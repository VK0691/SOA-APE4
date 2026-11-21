using System;
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
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", headerVal);
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
                    result.Message = $"HTTP {result.StatusCode} {response.ReasonPhrase}: {result.RawJson}";
                }
            }
            catch (HttpRequestException ex)
            {
                result.StatusCode = 0;
                result.IsSuccess = false;
                result.Message = $"Error de conexion: {ex.Message}";
            }
            catch (Exception ex)
            {
                result.StatusCode = 0;
                result.IsSuccess = false;
                result.Message = $"Error inesperado: {ex.Message}";
            }
            return result;
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

                // Si es un objeto paginado con clave "items"
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
