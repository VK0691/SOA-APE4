package ec.edu.com;

import java.math.BigDecimal;
import java.util.List;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.SplitPane;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.Duration;

public final class VehiculosApp extends Application {

    private final VehiculosApiClient api = new VehiculosApiClient();

    private final PasswordField txtToken = new PasswordField();
    private final Button btnConsultar = new Button("Consultar");
    private final Label lblEstado = new Label("Listo");
    private final Label lblTotal = new Label("Total de vehiculos: 0");
    private final TableView<Vehiculo> tablaVehiculos = new TableView<>();

    // Tabla de notificaciones (polling automatico)
    private final TableView<Notificacion> tablaNotificaciones = new TableView<>();
    private final Label lblNotificaciones = new Label("Notificaciones: esperando...");
    private final Label lblPolling = new Label("Polling: inactivo");
    private Timeline pollingTimeline;

    @Override
    public void start(Stage ventana) {
        // ---- Panel superior: token + boton ----
        Label lblTitulo = new Label("NGINX :8090  |  Spring Boot :8081/:8082  |  Notificaciones :8083");

        txtToken.setPromptText("Pegar JWT de Postman (obligatorio para vehiculos)");
        txtToken.setMaxWidth(Double.MAX_VALUE);

        txtToken.textProperty().addListener((obs, antiguo, nuevo) -> {
            tablaVehiculos.getItems().clear();
            lblTotal.setText("Total de vehiculos: 0");
            lblEstado.setText("Token modificado — vuelva a consultar");
        });

        btnConsultar.setOnAction(e -> consultarVehiculos());
        HBox barraToken = new HBox(8, txtToken, btnConsultar);
        HBox.setHgrow(txtToken, Priority.ALWAYS);

        VBox.setVgrow(tablaVehiculos, Priority.ALWAYS);
        VBox panelVehiculos = new VBox(8,
                new Label("Catalogo de vehiculos (via NGINX → Spring Boot):"),
                tablaVehiculos, lblTotal, lblEstado);
        panelVehiculos.setPadding(new Insets(8));
        configurarColumnasVehiculos();

        // ---- Panel inferior: notificaciones ----
        Button btnIniciarPolling = new Button("Iniciar polling");
        Button btnDetenerPolling = new Button("Detener");
        btnDetenerPolling.setDisable(true);

        btnIniciarPolling.setOnAction(e -> {
            iniciarPolling();
            btnIniciarPolling.setDisable(true);
            btnDetenerPolling.setDisable(false);
        });
        btnDetenerPolling.setOnAction(e -> {
            detenerPolling();
            btnIniciarPolling.setDisable(false);
            btnDetenerPolling.setDisable(true);
        });

        HBox barraPolling = new HBox(8, lblPolling, btnIniciarPolling, btnDetenerPolling);
        VBox.setVgrow(tablaNotificaciones, Priority.ALWAYS);
        VBox panelNotificaciones = new VBox(8,
                new Label("Notificaciones de ventas (GET /api/notificaciones cada 4s):"),
                barraPolling,
                tablaNotificaciones,
                lblNotificaciones);
        panelNotificaciones.setPadding(new Insets(8));
        configurarColumnasNotificaciones();

        // ---- Layout principal ----
        SplitPane splitPane = new SplitPane(panelVehiculos, panelNotificaciones);
        splitPane.setDividerPositions(0.6);
        SplitPane.setResizableWithParent(panelVehiculos, true);

        VBox raiz = new VBox(8, lblTitulo, barraToken, splitPane);
        raiz.setPadding(new Insets(12));
        VBox.setVgrow(splitPane, Priority.ALWAYS);

        ventana.setScene(new Scene(raiz, 1200, 700));
        ventana.setTitle("JavaFX — Vehiculos y Notificaciones de Ventas");
        ventana.setOnCloseRequest(e -> detenerPolling());
        ventana.show();
    }

    private void configurarColumnasVehiculos() {
        TableColumn<Vehiculo, Integer> colId = new TableColumn<>("ID");
        colId.setCellValueFactory(c -> new SimpleObjectProperty<>(c.getValue().idVehiculo()));

        TableColumn<Vehiculo, String> colMarca = new TableColumn<>("Marca");
        colMarca.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().marca()));

        TableColumn<Vehiculo, String> colModelo = new TableColumn<>("Modelo");
        colModelo.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().modelo()));

        TableColumn<Vehiculo, String> colPlaca = new TableColumn<>("Placa");
        colPlaca.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().placa()));

        TableColumn<Vehiculo, String> colChasis = new TableColumn<>("Chasis");
        colChasis.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().chasis()));

        TableColumn<Vehiculo, Integer> colAnio = new TableColumn<>("Año");
        colAnio.setCellValueFactory(c -> new SimpleObjectProperty<>(c.getValue().anio()));

        TableColumn<Vehiculo, String> colColor = new TableColumn<>("Color");
        colColor.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().color()));

        TableColumn<Vehiculo, BigDecimal> colPrecio = new TableColumn<>("Precio");
        colPrecio.setCellValueFactory(c -> new SimpleObjectProperty<>(c.getValue().precio()));

        TableColumn<Vehiculo, String> colEstado = new TableColumn<>("Estado");
        colEstado.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().estado()));

        tablaVehiculos.getColumns().addAll(
                colId, colMarca, colModelo, colPlaca, colChasis, colAnio, colColor, colPrecio, colEstado);
    }

    private void configurarColumnasNotificaciones() {
        TableColumn<Notificacion, String> colVenta = new TableColumn<>("Venta ID");
        colVenta.setCellValueFactory(c -> new SimpleStringProperty(
                c.getValue().ventaId() != null ? String.valueOf(c.getValue().ventaId()) : "—"));

        TableColumn<Notificacion, String> colVehiculo = new TableColumn<>("Vehiculo ID");
        colVehiculo.setCellValueFactory(c -> new SimpleStringProperty(
                c.getValue().vehiculoId() != null ? String.valueOf(c.getValue().vehiculoId()) : "—"));

        TableColumn<Notificacion, String> colTipo = new TableColumn<>("Tipo");
        colTipo.setCellValueFactory(c -> new SimpleStringProperty(
                c.getValue().tipo() != null ? c.getValue().tipo() : "—"));

        TableColumn<Notificacion, String> colPrecio = new TableColumn<>("Precio");
        colPrecio.setCellValueFactory(c -> new SimpleStringProperty(
                c.getValue().precio() != null
                        ? (c.getValue().moneda() != null ? c.getValue().moneda() + " " : "") + c.getValue().precio()
                        : "—"));

        TableColumn<Notificacion, String> colEvento = new TableColumn<>("Evento ID");
        colEvento.setCellValueFactory(c -> new SimpleStringProperty(
                c.getValue().eventoId() != null ? c.getValue().eventoId() : "—"));
        colEvento.setPrefWidth(220);

        TableColumn<Notificacion, String> colFecha = new TableColumn<>("Fecha UTC");
        colFecha.setCellValueFactory(c -> new SimpleStringProperty(
                c.getValue().fecha() != null ? c.getValue().fecha() : "—"));
        colFecha.setPrefWidth(180);

        tablaNotificaciones.getColumns().addAll(
                colVenta, colVehiculo, colTipo, colPrecio, colEvento, colFecha);
    }

    private void consultarVehiculos() {
        String jwt = txtToken.getText();
        if (jwt == null || jwt.trim().isEmpty()) {
            lblEstado.setText("Validacion: Debe ingresar un token JWT");
            return;
        }

        btnConsultar.setDisable(true);
        lblEstado.setText("Consultando via NGINX...");

        api.consultarVehiculos(jwt.trim()).thenAccept(resultado -> Platform.runLater(() -> {
            btnConsultar.setDisable(false);
            int codigo = resultado.codigoHttp();
            if (codigo == 200) {
                tablaVehiculos.getItems().setAll(resultado.vehiculos());
                lblTotal.setText("Total de vehiculos: " + resultado.vehiculos().size());
                lblEstado.setText("HTTP 200: Consulta exitosa via NGINX :8090");
            } else if (codigo == 401) {
                tablaVehiculos.getItems().clear();
                lblTotal.setText("Total de vehiculos: 0");
                lblEstado.setText("HTTP 401: Token invalido o expirado");
            } else if (codigo == 403) {
                tablaVehiculos.getItems().clear();
                lblTotal.setText("Total de vehiculos: 0");
                lblEstado.setText("HTTP 403: Sin permisos para consultar");
            } else {
                tablaVehiculos.getItems().clear();
                lblTotal.setText("Total de vehiculos: 0");
                lblEstado.setText("HTTP " + codigo + ": Error en la consulta");
            }
        })).exceptionally(ex -> {
            Platform.runLater(() -> {
                btnConsultar.setDisable(false);
                tablaVehiculos.getItems().clear();
                lblTotal.setText("Total de vehiculos: 0");
                lblEstado.setText("Error de conexion con NGINX");
            });
            return null;
        });
    }

    private void iniciarPolling() {
        pollingTimeline = new Timeline(new KeyFrame(Duration.seconds(4), e -> pollNotificaciones()));
        pollingTimeline.setCycleCount(Timeline.INDEFINITE);
        pollingTimeline.play();
        lblPolling.setText("Polling: activo (cada 4s)");
        // Primera llamada inmediata
        pollNotificaciones();
    }

    private void detenerPolling() {
        if (pollingTimeline != null) {
            pollingTimeline.stop();
            pollingTimeline = null;
        }
        lblPolling.setText("Polling: detenido");
    }

    private void pollNotificaciones() {
        api.consultarNotificaciones().thenAccept(resultado -> Platform.runLater(() -> {
            int codigo = resultado.codigoHttp();
            if (codigo == 200) {
                List<Notificacion> nuevas = resultado.notificaciones();
                tablaNotificaciones.getItems().setAll(nuevas);
                lblNotificaciones.setText("HTTP 200: " + nuevas.size() + " notificacion(es) recibidas");
            } else {
                lblNotificaciones.setText("HTTP " + codigo + ": Sin datos de notificaciones");
            }
        })).exceptionally(ex -> {
            Platform.runLater(() ->
                lblNotificaciones.setText("Error de conexion con notificaciones-service"));
            return null;
        });
    }
}
