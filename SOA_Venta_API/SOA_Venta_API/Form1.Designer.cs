namespace SOA_Venta_API
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            lblTitulo = new Label();
            lblSubtitulo = new Label();
            lblToken = new Label();
            txtToken = new TextBox();
            lblEstado = new Label();
            lblTotal = new Label();
            tabControlPrincipal = new TabControl();
            tabVehiculos = new TabPage();
            btnListarVehiculos = new Button();
            btnCrearVehiculo = new Button();
            txtMarca = new TextBox();
            txtModelo = new TextBox();
            txtPlaca = new TextBox();
            txtChasis = new TextBox();
            txtAnio = new TextBox();
            txtColor = new TextBox();
            txtPrecio = new TextBox();
            dgvVehiculos = new DataGridView();
            tabCompradores = new TabPage();
            btnListarCompradores = new Button();
            btnCrearComprador = new Button();
            txtDocComprador = new TextBox();
            txtNombreComprador = new TextBox();
            txtCorreoComprador = new TextBox();
            dgvCompradores = new DataGridView();
            tabVentas = new TabPage();
            btnListarVentas = new Button();
            lblAvisoVentas = new Label();
            dgvVentas = new DataGridView();
            tabControlPrincipal.SuspendLayout();
            tabVehiculos.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dgvVehiculos).BeginInit();
            tabCompradores.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dgvCompradores).BeginInit();
            tabVentas.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dgvVentas).BeginInit();
            SuspendLayout();
            // 
            // lblTitulo
            // 
            lblTitulo.AutoSize = true;
            lblTitulo.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
            lblTitulo.Location = new Point(18, 12);
            lblTitulo.Name = "lblTitulo";
            lblTitulo.Size = new Size(390, 25);
            lblTitulo.TabIndex = 0;
            lblTitulo.Text = "Panel Administrativo SOA (Windows Forms)";
            // 
            // lblSubtitulo
            // 
            lblSubtitulo.AutoSize = true;
            lblSubtitulo.Font = new Font("Segoe UI", 8.5F);
            lblSubtitulo.ForeColor = SystemColors.GrayText;
            lblSubtitulo.Location = new Point(20, 40);
            lblSubtitulo.Name = "lblSubtitulo";
            lblSubtitulo.Size = new Size(420, 15);
            lblSubtitulo.TabIndex = 1;
            lblSubtitulo.Text = "Conectado a NGINX (http://127.0.0.1:8090) con balanceo y autenticación JWT.";
            // 
            // lblToken
            // 
            lblToken.AutoSize = true;
            lblToken.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblToken.Location = new Point(20, 65);
            lblToken.Name = "lblToken";
            lblToken.Size = new Size(68, 15);
            lblToken.TabIndex = 2;
            lblToken.Text = "Token JWT:";
            // 
            // txtToken
            // 
            txtToken.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            txtToken.Location = new Point(94, 62);
            txtToken.Name = "txtToken";
            txtToken.PlaceholderText = "Pegue aquí el token JWT obtenido del login";
            txtToken.Size = new Size(880, 23);
            txtToken.TabIndex = 3;
            txtToken.UseSystemPasswordChar = true;
            // 
            // lblEstado
            // 
            lblEstado.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            lblEstado.AutoSize = true;
            lblEstado.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblEstado.ForeColor = SystemColors.HotTrack;
            lblEstado.Location = new Point(20, 650);
            lblEstado.Name = "lblEstado";
            lblEstado.Size = new Size(116, 15);
            lblEstado.TabIndex = 4;
            lblEstado.Text = "Estado: Listo";
            // 
            // lblTotal
            // 
            lblTotal.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
            lblTotal.AutoSize = true;
            lblTotal.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblTotal.Location = new Point(850, 650);
            lblTotal.Name = "lblTotal";
            lblTotal.Size = new Size(118, 15);
            lblTotal.TabIndex = 5;
            lblTotal.Text = "Registros cargados: 0";
            // 
            // tabControlPrincipal
            // 
            tabControlPrincipal.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            tabControlPrincipal.Controls.Add(tabVehiculos);
            tabControlPrincipal.Controls.Add(tabCompradores);
            tabControlPrincipal.Controls.Add(tabVentas);
            tabControlPrincipal.Location = new Point(20, 95);
            tabControlPrincipal.Name = "tabControlPrincipal";
            tabControlPrincipal.SelectedIndex = 0;
            tabControlPrincipal.Size = new Size(954, 545);
            tabControlPrincipal.TabIndex = 6;
            tabControlPrincipal.SelectedIndexChanged += TabControlPrincipal_SelectedIndexChanged;
            // 
            // tabVehiculos
            // 
            tabVehiculos.Controls.Add(btnListarVehiculos);
            tabVehiculos.Controls.Add(btnCrearVehiculo);
            tabVehiculos.Controls.Add(txtMarca);
            tabVehiculos.Controls.Add(txtModelo);
            tabVehiculos.Controls.Add(txtPlaca);
            tabVehiculos.Controls.Add(txtChasis);
            tabVehiculos.Controls.Add(txtAnio);
            tabVehiculos.Controls.Add(txtColor);
            tabVehiculos.Controls.Add(txtPrecio);
            tabVehiculos.Controls.Add(dgvVehiculos);
            tabVehiculos.Location = new Point(4, 24);
            tabVehiculos.Name = "tabVehiculos";
            tabVehiculos.Padding = new Padding(3);
            tabVehiculos.Size = new Size(946, 517);
            tabVehiculos.TabIndex = 0;
            tabVehiculos.Text = "Vehículos (Spring Boot)";
            tabVehiculos.UseVisualStyleBackColor = true;
            // 
            // btnListarVehiculos
            // 
            btnListarVehiculos.Location = new Point(12, 10);
            btnListarVehiculos.Name = "btnListarVehiculos";
            btnListarVehiculos.Size = new Size(130, 30);
            btnListarVehiculos.TabIndex = 0;
            btnListarVehiculos.Text = "Listar Vehículos";
            btnListarVehiculos.UseVisualStyleBackColor = true;
            btnListarVehiculos.Click += BtnListarVehiculos_Click;
            // 
            // txtMarca
            // 
            txtMarca.Location = new Point(12, 50);
            txtMarca.Name = "txtMarca";
            txtMarca.PlaceholderText = "Marca";
            txtMarca.Size = new Size(100, 23);
            txtMarca.TabIndex = 1;
            // 
            // txtModelo
            // 
            txtModelo.Location = new Point(118, 50);
            txtModelo.Name = "txtModelo";
            txtModelo.PlaceholderText = "Modelo";
            txtModelo.Size = new Size(100, 23);
            txtModelo.TabIndex = 2;
            // 
            // txtPlaca
            // 
            txtPlaca.Location = new Point(224, 50);
            txtPlaca.Name = "txtPlaca";
            txtPlaca.PlaceholderText = "Placa";
            txtPlaca.Size = new Size(90, 23);
            txtPlaca.TabIndex = 3;
            // 
            // txtChasis
            // 
            txtChasis.Location = new Point(320, 50);
            txtChasis.Name = "txtChasis";
            txtChasis.PlaceholderText = "Chasis";
            txtChasis.Size = new Size(120, 23);
            txtChasis.TabIndex = 4;
            // 
            // txtAnio
            // 
            txtAnio.Location = new Point(446, 50);
            txtAnio.Name = "txtAnio";
            txtAnio.PlaceholderText = "Año (2024)";
            txtAnio.Size = new Size(75, 23);
            txtAnio.TabIndex = 5;
            // 
            // txtColor
            // 
            txtColor.Location = new Point(527, 50);
            txtColor.Name = "txtColor";
            txtColor.PlaceholderText = "Color";
            txtColor.Size = new Size(80, 23);
            txtColor.TabIndex = 6;
            // 
            // txtPrecio
            // 
            txtPrecio.Location = new Point(613, 50);
            txtPrecio.Name = "txtPrecio";
            txtPrecio.PlaceholderText = "Precio (15000)";
            txtPrecio.Size = new Size(95, 23);
            txtPrecio.TabIndex = 7;
            // 
            // btnCrearVehiculo
            // 
            btnCrearVehiculo.Location = new Point(718, 48);
            btnCrearVehiculo.Name = "btnCrearVehiculo";
            btnCrearVehiculo.Size = new Size(120, 26);
            btnCrearVehiculo.TabIndex = 8;
            btnCrearVehiculo.Text = "Crear Vehículo";
            btnCrearVehiculo.UseVisualStyleBackColor = true;
            btnCrearVehiculo.Click += BtnCrearVehiculo_Click;
            // 
            // dgvVehiculos
            // 
            dgvVehiculos.AllowUserToAddRows = false;
            dgvVehiculos.AllowUserToDeleteRows = false;
            dgvVehiculos.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            dgvVehiculos.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dgvVehiculos.BackgroundColor = Color.White;
            dgvVehiculos.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvVehiculos.Location = new Point(12, 85);
            dgvVehiculos.Name = "dgvVehiculos";
            dgvVehiculos.ReadOnly = true;
            dgvVehiculos.Size = new Size(920, 420);
            dgvVehiculos.TabIndex = 9;
            // 
            // tabCompradores
            // 
            tabCompradores.Controls.Add(btnListarCompradores);
            tabCompradores.Controls.Add(txtDocComprador);
            tabCompradores.Controls.Add(txtNombreComprador);
            tabCompradores.Controls.Add(txtCorreoComprador);
            tabCompradores.Controls.Add(btnCrearComprador);
            tabCompradores.Controls.Add(dgvCompradores);
            tabCompradores.Location = new Point(4, 24);
            tabCompradores.Name = "tabCompradores";
            tabCompradores.Padding = new Padding(3);
            tabCompradores.Size = new Size(946, 517);
            tabCompradores.TabIndex = 1;
            tabCompradores.Text = "Compradores (FastAPI)";
            tabCompradores.UseVisualStyleBackColor = true;
            // 
            // btnListarCompradores
            // 
            btnListarCompradores.Location = new Point(12, 10);
            btnListarCompradores.Name = "btnListarCompradores";
            btnListarCompradores.Size = new Size(140, 30);
            btnListarCompradores.TabIndex = 0;
            btnListarCompradores.Text = "Listar Compradores";
            btnListarCompradores.UseVisualStyleBackColor = true;
            btnListarCompradores.Click += BtnListarCompradores_Click;
            // 
            // txtDocComprador
            // 
            txtDocComprador.Location = new Point(12, 50);
            txtDocComprador.Name = "txtDocComprador";
            txtDocComprador.PlaceholderText = "Documento (Cédula/RUC)";
            txtDocComprador.Size = new Size(170, 23);
            txtDocComprador.TabIndex = 1;
            // 
            // txtNombreComprador
            // 
            txtNombreComprador.Location = new Point(190, 50);
            txtNombreComprador.Name = "txtNombreComprador";
            txtNombreComprador.PlaceholderText = "Nombre Completo";
            txtNombreComprador.Size = new Size(200, 23);
            txtNombreComprador.TabIndex = 2;
            // 
            // txtCorreoComprador
            // 
            txtCorreoComprador.Location = new Point(400, 50);
            txtCorreoComprador.Name = "txtCorreoComprador";
            txtCorreoComprador.PlaceholderText = "Correo Electrónico";
            txtCorreoComprador.Size = new Size(220, 23);
            txtCorreoComprador.TabIndex = 3;
            // 
            // btnCrearComprador
            // 
            btnCrearComprador.Location = new Point(630, 48);
            btnCrearComprador.Name = "btnCrearComprador";
            btnCrearComprador.Size = new Size(130, 26);
            btnCrearComprador.TabIndex = 4;
            btnCrearComprador.Text = "Crear Comprador";
            btnCrearComprador.UseVisualStyleBackColor = true;
            btnCrearComprador.Click += BtnCrearComprador_Click;
            // 
            // dgvCompradores
            // 
            dgvCompradores.AllowUserToAddRows = false;
            dgvCompradores.AllowUserToDeleteRows = false;
            dgvCompradores.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            dgvCompradores.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dgvCompradores.BackgroundColor = Color.White;
            dgvCompradores.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvCompradores.Location = new Point(12, 85);
            dgvCompradores.Name = "dgvCompradores";
            dgvCompradores.ReadOnly = true;
            dgvCompradores.Size = new Size(920, 420);
            dgvCompradores.TabIndex = 5;
            // 
            // tabVentas
            // 
            tabVentas.Controls.Add(btnListarVentas);
            tabVentas.Controls.Add(lblAvisoVentas);
            tabVentas.Controls.Add(dgvVentas);
            tabVentas.Location = new Point(4, 24);
            tabVentas.Name = "tabVentas";
            tabVentas.Padding = new Padding(3);
            tabVentas.Size = new Size(946, 517);
            tabVentas.TabIndex = 2;
            tabVentas.Text = "Ventas (Solo Consulta)";
            tabVentas.UseVisualStyleBackColor = true;
            // 
            // btnListarVentas
            // 
            btnListarVentas.Location = new Point(12, 10);
            btnListarVentas.Name = "btnListarVentas";
            btnListarVentas.Size = new Size(130, 30);
            btnListarVentas.TabIndex = 0;
            btnListarVentas.Text = "Listar Ventas";
            btnListarVentas.UseVisualStyleBackColor = true;
            btnListarVentas.Click += BtnListarVentas_Click;
            // 
            // lblAvisoVentas
            // 
            lblAvisoVentas.AutoSize = true;
            lblAvisoVentas.Font = new Font("Segoe UI", 8.5F, FontStyle.Italic);
            lblAvisoVentas.ForeColor = Color.DarkSlateGray;
            lblAvisoVentas.Location = new Point(160, 18);
            lblAvisoVentas.Name = "lblAvisoVentas";
            lblAvisoVentas.Size = new Size(495, 15);
            lblAvisoVentas.TabIndex = 1;
            lblAvisoVentas.Text = "Consulta administrativa. Regla de negocio: El registro de ventas es exclusivo de la PWA Móvil.";
            // 
            // dgvVentas
            // 
            dgvVentas.AllowUserToAddRows = false;
            dgvVentas.AllowUserToDeleteRows = false;
            dgvVentas.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            dgvVentas.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dgvVentas.BackgroundColor = Color.White;
            dgvVentas.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvVentas.Location = new Point(12, 50);
            dgvVentas.Name = "dgvVentas";
            dgvVentas.ReadOnly = true;
            dgvVentas.Size = new Size(920, 455);
            dgvVentas.TabIndex = 2;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(990, 680);
            Controls.Add(tabControlPrincipal);
            Controls.Add(lblTotal);
            Controls.Add(lblEstado);
            Controls.Add(txtToken);
            Controls.Add(lblToken);
            Controls.Add(lblSubtitulo);
            Controls.Add(lblTitulo);
            MinimumSize = new Size(800, 600);
            Name = "Form1";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Panel Administrativo SOA - Windows Forms";
            tabControlPrincipal.ResumeLayout(false);
            tabVehiculos.ResumeLayout(false);
            tabVehiculos.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dgvVehiculos).EndInit();
            tabCompradores.ResumeLayout(false);
            tabCompradores.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dgvCompradores).EndInit();
            tabVentas.ResumeLayout(false);
            tabVentas.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dgvVentas).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private Label lblTitulo;
        private Label lblSubtitulo;
        private Label lblToken;
        private TextBox txtToken;
        private Label lblEstado;
        private Label lblTotal;
        private TabControl tabControlPrincipal;
        private TabPage tabVehiculos;
        private TabPage tabCompradores;
        private TabPage tabVentas;
        private Button btnListarVehiculos;
        private Button btnCrearVehiculo;
        private TextBox txtMarca;
        private TextBox txtModelo;
        private TextBox txtPlaca;
        private TextBox txtChasis;
        private TextBox txtAnio;
        private TextBox txtColor;
        private TextBox txtPrecio;
        private DataGridView dgvVehiculos;
        private Button btnListarCompradores;
        private TextBox txtDocComprador;
        private TextBox txtNombreComprador;
        private TextBox txtCorreoComprador;
        private Button btnCrearComprador;
        private DataGridView dgvCompradores;
        private Button btnListarVentas;
        private Label lblAvisoVentas;
        private DataGridView dgvVentas;
    }
}
