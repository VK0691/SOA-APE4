using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SOA_Venta_API
{
    public partial class Form1 : Form
    {
        private readonly ApiClient apiClient = new ApiClient("http://127.0.0.1:8090");

        public Form1()
        {
            InitializeComponent();
        }

        private string GetTokenOrWarn()
        {
            string token = txtToken.Text.Trim();
            if (string.IsNullOrEmpty(token))
            {
                lblEstado.ForeColor = Color.Red;
                lblEstado.Text = "Por favor ingrese el token JWT.";
            }
            return token;
        }

        private void SetBusy(bool busy, string mensaje = "")
        {
            Cursor = busy ? Cursors.WaitCursor : Cursors.Default;
            btnListarVehiculos.Enabled = !busy;
            btnCrearVehiculo.Enabled = !busy;
            btnListarCompradores.Enabled = !busy;
            btnCrearComprador.Enabled = !busy;
            btnListarVentas.Enabled = !busy;

            if (busy)
            {
                lblEstado.ForeColor = Color.Blue;
                lblEstado.Text = mensaje;
            }
        }

        // ==========================================
        // 1. VEHICULOS (Spring Boot via NGINX)
        // ==========================================
        private async void BtnListarVehiculos_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            SetBusy(true, "Consultando vehiculos en NGINX (:8090)...");
            try
            {
                var res = await apiClient.ListarVehiculosAsync(token);
                if (res.IsSuccess)
                {
                    dgvVehiculos.DataSource = res.Data;
                    lblTotal.Text = $"Registros cargados: {res.Data?.Rows.Count ?? 0}";
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Catalogo cargado correctamente.";
                }
                else
                {
                    dgvVehiculos.DataSource = null;
                    lblTotal.Text = "Registros cargados: 0";
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                }
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void BtnCrearVehiculo_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            if (string.IsNullOrWhiteSpace(txtMarca.Text) ||
                string.IsNullOrWhiteSpace(txtModelo.Text) ||
                string.IsNullOrWhiteSpace(txtPlaca.Text) ||
                string.IsNullOrWhiteSpace(txtChasis.Text) ||
                string.IsNullOrWhiteSpace(txtAnio.Text) ||
                string.IsNullOrWhiteSpace(txtColor.Text) ||
                string.IsNullOrWhiteSpace(txtPrecio.Text))
            {
                MessageBox.Show("Complete todos los campos del vehiculo.", "Campos requeridos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (!int.TryParse(txtAnio.Text.Trim(), out int anio) || !decimal.TryParse(txtPrecio.Text.Trim(), out decimal precio))
            {
                MessageBox.Show("Ano y precio deben ser valores numericos validos.", "Formato invalido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            string chasis = txtChasis.Text.Trim().ToUpperInvariant();
            if (chasis.Length != 17)
            {
                MessageBox.Show("El chasis (VIN) debe tener exactamente 17 caracteres.", "Formato invalido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var vehiculo = new
            {
                marca = txtMarca.Text.Trim(),
                modelo = txtModelo.Text.Trim(),
                placa = txtPlaca.Text.Trim().ToUpperInvariant(),
                chasis = chasis,
                anio = anio,
                color = txtColor.Text.Trim(),
                precio = precio
            };

            SetBusy(true, "Creando vehiculo via NGINX (:8090)...");
            try
            {
                var res = await apiClient.CrearVehiculoAsync(token, vehiculo);
                if (res.IsSuccess)
                {
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Vehiculo creado exitosamente.";
                    MessageBox.Show("Vehiculo registrado con exito en Spring Boot.", "Exito", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    // Limpiar campos
                    txtPlaca.Clear();
                    txtChasis.Clear();
                    txtPrecio.Clear();
                    // Refrescar lista
                    BtnListarVehiculos_Click(sender, e);
                }
                else
                {
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                    MessageBox.Show($"Error al crear vehiculo: {res.Message}", "Error HTTP", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            finally
            {
                SetBusy(false);
            }
        }

        // ==========================================
        // 2. COMPRADORES (FastAPI via NGINX)
        // ==========================================
        private async void BtnListarCompradores_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            SetBusy(true, "Consultando compradores en FastAPI via NGINX (:8090)...");
            try
            {
                var res = await apiClient.ListarCompradoresAsync(token);
                if (res.IsSuccess)
                {
                    dgvCompradores.DataSource = res.Data;
                    lblTotal.Text = $"Registros cargados: {res.Data?.Rows.Count ?? 0}";
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Compradores cargados correctamente.";
                }
                else
                {
                    dgvCompradores.DataSource = null;
                    lblTotal.Text = "Registros cargados: 0";
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                }
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void BtnCrearComprador_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            if (string.IsNullOrWhiteSpace(txtDocComprador.Text) ||
                string.IsNullOrWhiteSpace(txtNombreComprador.Text) ||
                string.IsNullOrWhiteSpace(txtCorreoComprador.Text))
            {
                MessageBox.Show("Complete el documento, nombre y correo del comprador.", "Campos requeridos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var comprador = new
            {
                documento = txtDocComprador.Text.Trim(),
                nombre = txtNombreComprador.Text.Trim(),
                correo = txtCorreoComprador.Text.Trim()
            };

            SetBusy(true, "Creando comprador via NGINX (:8090)...");
            try
            {
                var res = await apiClient.CrearCompradorAsync(token, comprador);
                if (res.IsSuccess)
                {
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Comprador registrado exitosamente.";
                    MessageBox.Show("Comprador registrado con exito en FastAPI.", "Exito", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    txtDocComprador.Clear();
                    txtNombreComprador.Clear();
                    txtCorreoComprador.Clear();
                    BtnListarCompradores_Click(sender, e);
                }
                else
                {
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                    MessageBox.Show($"Error al crear comprador: {res.Message}", "Error HTTP", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            finally
            {
                SetBusy(false);
            }
        }

        // ==========================================
        // 3. VENTAS (FastAPI via NGINX - SOLO CONSULTA)
        // ==========================================
        private async void BtnListarVentas_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            SetBusy(true, "Consultando ventas en FastAPI via NGINX (:8090)...");
            try
            {
                var res = await apiClient.ListarVentasAsync(token);
                if (res.IsSuccess)
                {
                    dgvVentas.DataSource = res.Data;
                    lblTotal.Text = $"Registros cargados: {res.Data?.Rows.Count ?? 0}";
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Listado de ventas cargado (Solo consulta).";
                }
                else
                {
                    dgvVentas.DataSource = null;
                    lblTotal.Text = "Registros cargados: 0";
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                }
            }
            finally
            {
                SetBusy(false);
            }
        }

        private void TabControlPrincipal_SelectedIndexChanged(object? sender, EventArgs e)
        {
            lblEstado.ForeColor = SystemColors.HotTrack;
            lblEstado.Text = $"Pestana activa: {tabControlPrincipal.SelectedTab?.Text}";
            lblTotal.Text = "Registros cargados: -";
        }
    }
}
