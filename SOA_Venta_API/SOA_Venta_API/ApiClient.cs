using System;
using System.Collections.Generic;
using System.Data;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SOA_Venta_API
{
    public class ApiResponse
    {
        public int StatusCode { get; set; }
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public DataTable? Data { get; set; }
        public string RawJson { get; set; } = string.Empty;
    }

    public class ApiClient
    {
        // Enrutamiento unificado a traves de NGINX en el puerto 8090
        private readonly string baseUrl;
        private static readonly HttpClient client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

        public ApiClient(string baseUrl = "http://127.0.0.1:8090")
        {
            this.baseUrl = baseUrl.TrimEnd('/');
        }

        private HttpRequestMessage CreateRequest(HttpMethod method, string path, string token, string? jsonBody = null)
        {
            var url = $"{baseUrl}/{path.TrimStart('/')}";
            var request = new HttpRequestMessage(method, url);

            if (!string.IsNullOrWhiteSpace(token))
            {
                string headerVal = token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? token.Substring(7).Trim()
                    : token.Trim();

                // Evita excepcion local si el usuario pega saltos de linea o caracteres no ASCII
                headerVal = headerVal.Replace("\r", "").Replace("\n", "").Trim();
                request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {headerVal}");
            }

            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (!string.IsNullOrWhiteSpace(jsonBody) && (method == HttpMethod.Post || method == HttpMethod.Put))
            {
                request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            }

            return request;
        }

        private async Task<ApiResponse> ExecuteAsync(HttpMethod method, string path, string token, string? jsonBody = null)
        {
            var result = new ApiResponse();
            try
            {
                using var request = CreateRequest(method, path, token, jsonBody);
                using var response = await client.SendAsync(request);

                result.StatusCode = (int)response.StatusCode;
                result.IsSuccess = response.IsSuccessStatusCode;
                result.RawJson = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    result.Message = $"HTTP {result.StatusCode} {response.ReasonPhrase}";
                    if (!string.IsNullOrWhiteSpace(result.RawJson))
                    {
                        result.Data = ConvertJsonToDataTable(result.RawJson);
                    }
                }
                else
                {
                    result.Message = FormatearErrorHttp(result.StatusCode, result.RawJson);
                }
            }
            catch (HttpRequestException)
            {
                result.StatusCode = 0;
                result.IsSuccess = false;
                result.Message = "Error de conexion: no se pudo contactar con NGINX (http://127.0.0.1:8090). Verifique que los servicios esten iniciados.";
            }
            catch (TaskCanceledException)
            {
                result.StatusCode = 0;
                result.IsSuccess = false;
                result.Message = "Tiempo de espera agotado: el servidor tardo demasiado en responder.";
            }
            catch (Exception ex)
            {
                result.StatusCode = 0;
                result.IsSuccess = false;
                result.Message = $"Error inesperado: {ex.Message}";
            }
            return result;
        }

        private static string FormatearErrorHttp(int statusCode, string rawJson)
        {
            string detalle = ExtraerDetalleJson(rawJson);

            string baseMsg = statusCode switch
            {
                400 => "HTTP 400 (Datos invalidos): verifique los campos ingresados.",
                401 => "HTTP 401 (No autenticado): el token JWT es invalido, esta incompleto o ya expiro.",
                403 => "HTTP 403 (Sin permisos): su rol no esta autorizado para realizar esta operacion.",
                404 => "HTTP 404 (No encontrado): el recurso o ruta solicitada no existe.",
                409 => "HTTP 409 (Conflicto): ya existe un registro con esa placa, chasis o documento.",
                422 => "HTTP 422 (Validacion rechazada): uno o mas campos no cumplen el formato exigido.",
                500 => "HTTP 500 (Error interno): fallo en el servicio backend o base de datos.",
                502 => "HTTP 502 (Servicio no disponible): NGINX no pudo conectar con el servicio backend.",
                503 => "HTTP 503 (Servicio no disponible): el backend esta temporalmente caido.",
                _ => $"HTTP {statusCode}: la operacion no pudo completarse."
            };

            return string.IsNullOrWhiteSpace(detalle) ? baseMsg : $"{baseMsg} Detalle: {detalle}";
        }

        private static string ExtraerDetalleJson(string rawJson)
        {
            if (string.IsNullOrWhiteSpace(rawJson)) return string.Empty;
            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object) return string.Empty;

                if (root.TryGetProperty("detail", out var detailProp))
                {
                    if (detailProp.ValueKind == JsonValueKind.String)
                        return detailProp.GetString() ?? string.Empty;

                    // Formato de validacion FastAPI / Pydantic (lista de errores por campo)
                    if (detailProp.ValueKind == JsonValueKind.Array)
                    {
                        var partes = new List<string>();
                        foreach (var err in detailProp.EnumerateArray())
                        {
                            string campo = "";
                            if (err.TryGetProperty("loc", out var loc) && loc.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var item in loc.EnumerateArray()) campo = item.ToString();
                            }
                            string msg = err.TryGetProperty("msg", out var m) ? (m.GetString() ?? "") : "";
                            if (!string.IsNullOrWhiteSpace(msg))
                                partes.Add(string.IsNullOrWhiteSpace(campo) ? msg : $"{campo}: {msg}");
                        }
                        if (partes.Count > 0) return string.Join("; ", partes);
                    }
                }

                if (root.TryGetProperty("mensaje", out var msgProp) && msgProp.ValueKind == JsonValueKind.String)
                    return msgProp.GetString() ?? string.Empty;

                if (root.TryGetProperty("errors", out var errorsProp) && errorsProp.ValueKind == JsonValueKind.Object)
                {
                    var partes = new List<string>();
                    foreach (var p in errorsProp.EnumerateObject())
                        partes.Add($"{p.Name}: {p.Value}");
                    if (partes.Count > 0) return string.Join("; ", partes);
                }

                if (root.TryGetProperty("title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String)
                    return titleProp.GetString() ?? string.Empty;
            }
            catch
            {
                // Ignorar si no es JSON
            }
            return string.Empty;
        }

        // 1. Listar vehiculos (Spring Boot via NGINX)
        public Task<ApiResponse> ListarVehiculosAsync(string token) =>
            ExecuteAsync(HttpMethod.Get, "/api/vehiculos", token);

        // 2. Crear vehiculo (Spring Boot via NGINX)
        public Task<ApiResponse> CrearVehiculoAsync(string token, object vehiculo) =>
            ExecuteAsync(HttpMethod.Post, "/api/vehiculos", token, JsonSerializer.Serialize(vehiculo));

        // 3. Listar compradores (FastAPI via NGINX)
        public Task<ApiResponse> ListarCompradoresAsync(string token) =>
            ExecuteAsync(HttpMethod.Get, "/api/compradores", token);

        // 4. Crear comprador (FastAPI via NGINX)
        public Task<ApiResponse> CrearCompradorAsync(string token, object comprador) =>
            ExecuteAsync(HttpMethod.Post, "/api/compradores", token, JsonSerializer.Serialize(comprador));

        // 5. Listar ventas (FastAPI via NGINX) - Solo consulta, sin creacion
        public Task<ApiResponse> ListarVentasAsync(string token) =>
            ExecuteAsync(HttpMethod.Get, "/api/ventas", token);

        public static DataTable ConvertJsonToDataTable(string json)
        {
            var dt = new DataTable();
            if (string.IsNullOrWhiteSpace(json)) return dt;

            try
            {
                using var doc = JsonDocument.Parse(json);
                JsonElement root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("items", out JsonElement itemsElement))
                {
                    root = itemsElement;
                }

                if (root.ValueKind == JsonValueKind.Array)
                {
                    bool columnsCreated = false;
                    foreach (var item in root.EnumerateArray())
                    {
                        if (!columnsCreated)
                        {
                            foreach (var prop in item.EnumerateObject())
                            {
                                dt.Columns.Add(prop.Name, typeof(string));
                            }
                            columnsCreated = true;
                        }

                        var row = dt.NewRow();
                        foreach (var prop in item.EnumerateObject())
                        {
                            row[prop.Name] = prop.Value.ToString();
                        }
                        dt.Rows.Add(row);
                    }
                }
                else if (root.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in root.EnumerateObject())
                    {
                        dt.Columns.Add(prop.Name, typeof(string));
                    }
                    var row = dt.NewRow();
                    foreach (var prop in root.EnumerateObject())
                    {
                        row[prop.Name] = prop.Value.ToString();
                    }
                    dt.Rows.Add(row);
                }
            }
            catch
            {
                // Devolver tabla vacia en caso de error de parseo
            }
            return dt;
        }
    }
}
