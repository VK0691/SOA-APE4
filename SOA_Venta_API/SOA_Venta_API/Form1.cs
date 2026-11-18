using System;
using System.Data;
using System.Drawing;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SOA_Venta_API
{
    public partial class Form1 : Form
    {
        // URL del endpoint de la API
        private readonly string apiUrl = "http://127.0.0.1:8000/api/compradores";

        // Instancia reutilizable de HttpClient
        private static readonly HttpClient client = new HttpClient();

        public Form1()
        {
            InitializeComponent();

            // Token JWT inicial basado en el código de Postman
            txtToken.Text = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbi1sb2NhbCIsInJvbCI6IkFETUlOIiwic2NvcGUiOiJ2ZWhpY3Vsb3MiLCJ0aXBvIjoiYWNjZXNzIiwiaWRhcGxpIjoiOTIiLCJpYXQiOjE3OTM5MzA5MTUsImV4cCI6MTc5MzkzMjcxNX0.pZhdQwr34yysH833iP9dwajI4b75t4on1tB6AKcTZc4";
        }

        private async void btnConsultar_Click(object sender, EventArgs e)
        {
            string token = txtToken.Text.Trim();

            if (string.IsNullOrEmpty(token))
            {
                lblEstado.ForeColor = Color.Red;
                lblEstado.Text = "Por favor ingrese el token JWT.";
                return;
            }

            // Estado visual de consulta en progreso
            btnConsultar.Enabled = false;
            lblEstado.ForeColor = Color.Blue;
            lblEstado.Text = "Consultando...";
            Cursor = Cursors.WaitCursor;

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, apiUrl);

                string authHeader = token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? token
                    : $"Bearer {token}";

                request.Headers.Add("Authorization", authHeader);

                using var response = await client.SendAsync(request);

                // Manejo de respuestas HTTP según el código de estado
                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized) // 401
                {
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = "HTTP 401: JWT inválido o vencido";
                    dgvVehiculos.DataSource = null;
                    lblTotal.Text = "Total de vehículos: 0";
                    return;
                }

                if (response.StatusCode == System.Net.HttpStatusCode.Forbidden) // 403
                {
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = "HTTP 403: No autorizado para acceder a este recurso";
                    dgvVehiculos.DataSource = null;
                    lblTotal.Text = "Total de vehículos: 0";
                    return;
                }

                if (!response.IsSuccessStatusCode)
                {
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}";
                    dgvVehiculos.DataSource = null;
                    lblTotal.Text = "Total de vehículos: 0";
                    return;
                }

                // Respuesta exitosa (HTTP 200)
                string responseBody = await response.Content.ReadAsStringAsync();
                DataTable dt = ConvertJsonToDataTable(responseBody);

                dgvVehiculos.DataSource = dt;
                lblTotal.Text = $"Total de vehículos: {dt.Rows.Count}";

                lblEstado.ForeColor = Color.Green;
                lblEstado.Text = $"Consulta exitosa ({dt.Rows.Count} registro{(dt.Rows.Count == 1 ? "" : "s")}).";
            }
            catch (HttpRequestException ex)
            {
                lblEstado.ForeColor = Color.Red;
                lblEstado.Text = $"Error de conexión con la API: {ex.Message}";
                dgvVehiculos.DataSource = null;
                lblTotal.Text = "Total de vehículos: 0";
            }
            catch (Exception ex)
            {
                lblEstado.ForeColor = Color.Red;
                lblEstado.Text = $"Error: {ex.Message}";
                dgvVehiculos.DataSource = null;
                lblTotal.Text = "Total de vehículos: 0";
            }
            finally
            {
                btnConsultar.Enabled = true;
                Cursor = Cursors.Default;
            }
        }

        /// <summary>
        /// Convierte dinámicamente un JSON (array u objeto) a un DataTable para el DataGridView
        /// </summary>
        private DataTable ConvertJsonToDataTable(string json)
        {
            var dataTable = new DataTable();

            if (string.IsNullOrWhiteSpace(json))
                return dataTable;

            using var doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            JsonElement arrayElement = default;
            bool foundArray = false;

            if (root.ValueKind == JsonValueKind.Array)
            {
                arrayElement = root;
                foundArray = true;
            }
            else if (root.ValueKind == JsonValueKind.Object)
            {
                // Busca si contiene una propiedad tipo lista (ej. "data", "compradores", "vehiculos", etc.)
                foreach (var property in root.EnumerateObject())
                {
                    if (property.Value.ValueKind == JsonValueKind.Array)
                    {
                        arrayElement = property.Value;
                        foundArray = true;
                        break;
                    }
                }

                // Si no tiene arreglos, se muestra el objeto individual como una sola fila
                if (!foundArray)
                {
                    foreach (var prop in root.EnumerateObject())
                    {
                        dataTable.Columns.Add(prop.Name, typeof(string));
                    }

                    var row = dataTable.NewRow();
                    foreach (var prop in root.EnumerateObject())
                    {
                        row[prop.Name] = FormatJsonValue(prop.Value);
                    }
                    dataTable.Rows.Add(row);
                    return dataTable;
                }
            }
            else
            {
                dataTable.Columns.Add("Valor", typeof(string));
                dataTable.Rows.Add(root.ToString());
                return dataTable;
            }

            // 1. Obtener todas las columnas presentes en los elementos del arreglo
            foreach (var item in arrayElement.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in item.EnumerateObject())
                    {
                        if (!dataTable.Columns.Contains(prop.Name))
                        {
                            dataTable.Columns.Add(prop.Name, typeof(string));
                        }
                    }
                }
            }

            if (dataTable.Columns.Count == 0 && arrayElement.GetArrayLength() > 0)
            {
                dataTable.Columns.Add("Valor", typeof(string));
            }

            // 2. Llenar los datos de cada fila
            foreach (var item in arrayElement.EnumerateArray())
            {
                var row = dataTable.NewRow();
                if (item.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in item.EnumerateObject())
                    {
                        row[prop.Name] = FormatJsonValue(prop.Value);
                    }
                }
                else
                {
                    row["Valor"] = FormatJsonValue(item);
                }
                dataTable.Rows.Add(row);
            }

            return dataTable;
        }

        private string FormatJsonValue(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Null => string.Empty,
                JsonValueKind.Undefined => string.Empty,
                JsonValueKind.String => element.GetString() ?? string.Empty,
                JsonValueKind.Number => element.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                _ => element.GetRawText()
            };
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }
    }
}
