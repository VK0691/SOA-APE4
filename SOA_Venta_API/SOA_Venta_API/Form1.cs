using System;
using System.Drawing;
using System.Globalization;
using System.Text.RegularExpressions;
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
            txtChasis.PlaceholderText = "Chasis (17 chars)";
            txtAnio.PlaceholderText = "Anio (2025)";
            txtPrecio.PlaceholderText = "Precio (25000)";
            txtToken.TextChanged += TxtToken_TextChanged;
        }

        private void TxtToken_TextChanged(object? sender, EventArgs e)
        {
            // Al borrar o modificar cualquier caracter del JWT se limpian los 3 listados por seguridad
            dgvVehiculos.DataSource = null;
            dgvCompradores.DataSource = null;
            dgvVentas.DataSource = null;
            lblTotal.Text = "Registros cargados: 0";

            if (string.IsNullOrWhiteSpace(txtToken.Text))
            {
                lblEstado.ForeColor = Color.DarkOrange;
                lblEstado.Text = "Token eliminado: los listados fueron limpiados.";
            }
            else
            {
                lblEstado.ForeColor = SystemColors.HotTrack;
                lblEstado.Text = "Token modificado: vuelva a consultar para validar acceso.";
            }
        }

        private string GetTokenOrWarn()
        {
            string token = txtToken.Text.Trim();
            if (string.IsNullOrEmpty(token))
            {
                lblEstado.ForeColor = Color.Red;
                lblEstado.Text = "Validacion: ingrese el token JWT antes de consultar o registrar.";
                MessageBox.Show("Debe ingresar un token JWT valido en la barra superior.", "Token requerido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
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
        private async Task CargarVehiculosAsync(string token)
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

        private async void BtnListarVehiculos_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            SetBusy(true, "Consultando vehiculos en NGINX (:8090)...");
            try
            {
                await CargarVehiculosAsync(token);
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

            string marca = txtMarca.Text.Trim();
            string modelo = txtModelo.Text.Trim();
            string placa = txtPlaca.Text.Trim().ToUpperInvariant();
            string chasis = txtChasis.Text.Trim().ToUpperInvariant();
            string anioTxt = txtAnio.Text.Trim();
            string color = txtColor.Text.Trim();
            string precioTxt = txtPrecio.Text.Trim().Replace(',', '.');

            // Validaciones claras y especificas por campo
            if (string.IsNullOrWhiteSpace(marca))
            {
                MostrarErrorValidacion("Ingrese la marca del vehiculo (ejemplo: Toyota).", txtMarca);
                return;
            }
            if (string.IsNullOrWhiteSpace(modelo))
            {
                MostrarErrorValidacion("Ingrese el modelo del vehiculo (ejemplo: Corolla).", txtModelo);
                return;
            }
            if (string.IsNullOrWhiteSpace(placa) || placa.Length < 4)
            {
                MostrarErrorValidacion("Ingrese una placa valida de al menos 4 caracteres (ejemplo: ABC-1234).", txtPlaca);
                return;
            }
            if (chasis.Length != 17)
            {
                MostrarErrorValidacion($"El chasis (VIN) debe tener exactamente 17 caracteres alfanumericos (actualmente tiene {chasis.Length}).", txtChasis);
                return;
            }
            int anioMax = DateTime.Now.Year + 1;
            if (!int.TryParse(anioTxt, out int anio) || anio < 1900 || anio > anioMax)
            {
                MostrarErrorValidacion($"El anio debe ser un numero entero entre 1900 y {anioMax}.", txtAnio);
                return;
            }
            if (string.IsNullOrWhiteSpace(color))
            {
                MostrarErrorValidacion("Ingrese el color del vehiculo (ejemplo: Blanco).", txtColor);
                return;
            }
            if (!decimal.TryParse(precioTxt, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal precio)
                || precio <= 0
                || precio > 9999999999.99m
                || decimal.Round(precio, 2) != precio)
            {
                MostrarErrorValidacion("El precio debe ser un numero positivo mayor a 0 con maximo 2 decimales (ejemplo: 25000 o 25000.50).", txtPrecio);
                return;
            }

            var vehiculo = new
            {
                marca = marca,
                modelo = modelo,
                placa = placa,
                chasis = chasis,
                anio = anio,
                color = color,
                precio = precio
            };

            SetBusy(true, "Creando vehiculo via NGINX (:8090)...");
            try
            {
                var res = await apiClient.CrearVehiculoAsync(token, vehiculo);
                if (res.IsSuccess)
                {
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Vehiculo {marca} {modelo} ({placa}) creado exitosamente.";
                    MessageBox.Show($"Vehiculo {marca} {modelo} (Placa {placa}) registrado con exito.", "Registro exitoso", MessageBoxButtons.OK, MessageBoxIcon.Information);

                    txtMarca.Clear();
                    txtModelo.Clear();
                    txtPlaca.Clear();
                    txtChasis.Clear();
                    txtAnio.Clear();
                    txtColor.Clear();
                    txtPrecio.Clear();

                    await CargarVehiculosAsync(token);
                }
                else
                {
                    if (res.StatusCode == 401 || res.StatusCode == 403)
                    {
                        dgvVehiculos.DataSource = null;
                        lblTotal.Text = "Registros cargados: 0";
                    }
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                    MessageBox.Show(res.Message, "No se pudo crear el vehiculo", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
        private async Task CargarCompradoresAsync(string token)
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

        private async void BtnListarCompradores_Click(object? sender, EventArgs e)
        {
            string token = GetTokenOrWarn();
            if (string.IsNullOrEmpty(token)) return;

            SetBusy(true, "Consultando compradores en FastAPI via NGINX (:8090)...");
            try
            {
                await CargarCompradoresAsync(token);
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

            string documento = txtDocComprador.Text.Trim();
            string nombre = txtNombreComprador.Text.Trim();
            string correo = txtCorreoComprador.Text.Trim();

            if (documento.Length < 3 || documento.Length > 30)
            {
                MostrarErrorValidacion("El documento (cedula/RUC) debe tener entre 3 y 30 caracteres.", txtDocComprador);
                return;
            }
            if (nombre.Length < 2 || nombre.Length > 120)
            {
                MostrarErrorValidacion("El nombre completo debe tener al menos 2 caracteres.", txtNombreComprador);
                return;
            }
            if (!Regex.IsMatch(correo, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                MostrarErrorValidacion("Ingrese un correo electronico valido (ejemplo: nombre@correo.com).", txtCorreoComprador);
                return;
            }

            var comprador = new
            {
                documento = documento,
                nombre = nombre,
                correo = correo
            };

            SetBusy(true, "Creando comprador via NGINX (:8090)...");
            try
            {
                var res = await apiClient.CrearCompradorAsync(token, comprador);
                if (res.IsSuccess)
                {
                    lblEstado.ForeColor = Color.Green;
                    lblEstado.Text = $"HTTP {res.StatusCode}: Comprador registrado exitosamente.";
                    MessageBox.Show($"Comprador {nombre} registrado con exito en FastAPI.", "Registro exitoso", MessageBoxButtons.OK, MessageBoxIcon.Information);

                    txtDocComprador.Clear();
                    txtNombreComprador.Clear();
                    txtCorreoComprador.Clear();

                    await CargarCompradoresAsync(token);
                }
                else
                {
                    if (res.StatusCode == 401 || res.StatusCode == 403)
                    {
                        dgvCompradores.DataSource = null;
                        lblTotal.Text = "Registros cargados: 0";
                    }
                    lblEstado.ForeColor = Color.Red;
                    lblEstado.Text = res.Message;
                    MessageBox.Show(res.Message, "No se pudo crear el comprador", MessageBoxButtons.OK, MessageBoxIcon.Error);
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

        private void MostrarErrorValidacion(string mensaje, Control control)
        {
            lblEstado.ForeColor = Color.Red;
            lblEstado.Text = $"Validacion: {mensaje}";
            MessageBox.Show(mensaje, "Dato invalido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            control.Focus();
        }

        private void TabControlPrincipal_SelectedIndexChanged(object? sender, EventArgs e)
        {
            lblEstado.ForeColor = SystemColors.HotTrack;
            lblEstado.Text = $"Pestana activa: {tabControlPrincipal.SelectedTab?.Text}";
            lblTotal.Text = "Registros cargados: -";
        }
    }
}
