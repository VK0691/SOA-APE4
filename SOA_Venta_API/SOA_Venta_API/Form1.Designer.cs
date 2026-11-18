namespace SOA_Venta_API
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            lblTitulo = new Label();
            lblSubtitulo = new Label();
            lblToken = new Label();
            txtToken = new TextBox();
            btnConsultar = new Button();
            lblEstado = new Label();
            dgvVehiculos = new DataGridView();
            lblTotal = new Label();
            ((System.ComponentModel.ISupportInitialize)dgvVehiculos).BeginInit();
            SuspendLayout();
            // 
            // lblTitulo
            // 
            lblTitulo.AutoSize = true;
            lblTitulo.Font = new Font("Segoe UI", 16F, FontStyle.Bold);
            lblTitulo.Location = new Point(27, 23);
            lblTitulo.Name = "lblTitulo";
            lblTitulo.Size = new Size(235, 30);
            lblTitulo.TabIndex = 0;
            lblTitulo.Text = "Vehículos registrados";
            // 
            // lblSubtitulo
            // 
            lblSubtitulo.AutoSize = true;
            lblSubtitulo.Font = new Font("Segoe UI", 9F);
            lblSubtitulo.ForeColor = SystemColors.GrayText;
            lblSubtitulo.Location = new Point(29, 69);
            lblSubtitulo.Name = "lblSubtitulo";
            lblSubtitulo.Size = new Size(290, 15);
            lblSubtitulo.TabIndex = 1;
            lblSubtitulo.Text = "Consulta de la API REST Java / Spring Boot (opcional).";
            // 
            // lblToken
            // 
            lblToken.AutoSize = true;
            lblToken.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblToken.Location = new Point(27, 106);
            lblToken.Name = "lblToken";
            lblToken.Size = new Size(31, 15);
            lblToken.TabIndex = 2;
            lblToken.Text = "JWT";
            // 
            // txtToken
            // 
            txtToken.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            txtToken.Font = new Font("Segoe UI", 9.5F);
            txtToken.Location = new Point(27, 133);
            txtToken.Name = "txtToken";
            txtToken.Size = new Size(823, 24);
            txtToken.TabIndex = 3;
            txtToken.UseSystemPasswordChar = true;
            // 
            // btnConsultar
            // 
            btnConsultar.Font = new Font("Segoe UI", 9F);
            btnConsultar.Location = new Point(27, 179);
            btnConsultar.Name = "btnConsultar";
            btnConsultar.Size = new Size(124, 37);
            btnConsultar.TabIndex = 4;
            btnConsultar.Text = "Consultar";
            btnConsultar.UseVisualStyleBackColor = true;
            btnConsultar.Click += btnConsultar_Click;
            // 
            // lblEstado
            // 
            lblEstado.AutoSize = true;
            lblEstado.Font = new Font("Segoe UI", 9F);
            lblEstado.ForeColor = SystemColors.GrayText;
            lblEstado.Location = new Point(163, 186);
            lblEstado.Name = "lblEstado";
            lblEstado.Size = new Size(113, 15);
            lblEstado.TabIndex = 5;
            lblEstado.Text = "Listo para consultar.";
            // 
            // dgvVehiculos
            // 
            dgvVehiculos.AllowUserToAddRows = false;
            dgvVehiculos.AllowUserToDeleteRows = false;
            dgvVehiculos.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            dgvVehiculos.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dgvVehiculos.BackgroundColor = Color.White;
            dgvVehiculos.BorderStyle = BorderStyle.Fixed3D;
            dgvVehiculos.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvVehiculos.Location = new Point(27, 228);
            dgvVehiculos.Name = "dgvVehiculos";
            dgvVehiculos.ReadOnly = true;
            dgvVehiculos.RowHeadersWidth = 51;
            dgvVehiculos.RowTemplate.Height = 29;
            dgvVehiculos.Size = new Size(824, 316);
            dgvVehiculos.TabIndex = 6;
            // 
            // lblTotal
            // 
            lblTotal.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            lblTotal.AutoSize = true;
            lblTotal.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblTotal.Location = new Point(27, 558);
            lblTotal.Name = "lblTotal";
            lblTotal.Size = new Size(119, 15);
            lblTotal.TabIndex = 7;
            lblTotal.Text = "Total de vehículos: 0";
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(9F, 23F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(880, 601);
            Controls.Add(lblTotal);
            Controls.Add(dgvVehiculos);
            Controls.Add(lblEstado);
            Controls.Add(btnConsultar);
            Controls.Add(txtToken);
            Controls.Add(lblToken);
            Controls.Add(lblSubtitulo);
            Controls.Add(lblTitulo);
            MinimumSize = new Size(673, 477);
            Name = "Form1";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Form1";
            Load += Form1_Load;
            ((System.ComponentModel.ISupportInitialize)dgvVehiculos).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private System.Windows.Forms.Label lblTitulo;
        private System.Windows.Forms.Label lblSubtitulo;
        private System.Windows.Forms.Label lblToken;
        private System.Windows.Forms.TextBox txtToken;
        private System.Windows.Forms.Button btnConsultar;
        private System.Windows.Forms.Label lblEstado;
        private System.Windows.Forms.DataGridView dgvVehiculos;
        private System.Windows.Forms.Label lblTotal;
    }
}
