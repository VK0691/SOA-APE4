package ec.edu.com;

import java.math.BigDecimal;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public final class VehiculosApp extends Application {
    private final VehiculosApiClient api = new VehiculosApiClient();
    private final PasswordField txtToken = new PasswordField();
    private final Button btnConsultar = new Button("Consultar");
    private final Label lblEstado = new Label("Listo");
    private final Label lblTotal = new Label("Total de vehiculos: 0");
    private final TableView<Vehiculo> tabla = new TableView<>();

    @Override
    public void start(Stage ventana) {
        Label titulo = new Label("Consulta de vehiculos Registrados");
        txtToken.setPromptText("aki va el JWT");
        txtToken.setMaxWidth(Double.MAX_VALUE);

        configurarColumnas();

        txtToken.textProperty().addListener((obs, antiguo, nuevo) -> {
            tabla.getItems().clear();
            lblTotal.setText("Total de vehiculos: 0");
            lblEstado.setText("Listo");
        });

        btnConsultar.setOnAction(e -> consultar());

        VBox.setVgrow(tabla, Priority.ALWAYS);
        VBox contenido = new VBox(12, titulo, txtToken, btnConsultar, tabla, lblTotal, lblEstado);
        contenido.setPadding(new Insets(12));
        contenido.setStyle("-fx-background-color: white;");

        ventana.setScene(new Scene(contenido, 1024, 650));
        ventana.setTitle("Consulta Vehiculos");
        ventana.show();
    }

    private void configurarColumnas() {
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

        TableColumn<Vehiculo, Integer> colAnio = new TableColumn<>("Anio");
        colAnio.setCellValueFactory(c -> new SimpleObjectProperty<>(c.getValue().anio()));

        TableColumn<Vehiculo, String> colColor = new TableColumn<>("Color");
        colColor.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().color()));

        TableColumn<Vehiculo, BigDecimal> colPrecio = new TableColumn<>("Precio");
        colPrecio.setCellValueFactory(c -> new SimpleObjectProperty<>(c.getValue().precio()));

        TableColumn<Vehiculo, String> colEstado = new TableColumn<>("Estado");
        colEstado.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().estado()));

        tabla.getColumns().addAll(colId, colMarca, colModelo, colPlaca, colChasis, colAnio, colColor, colPrecio, colEstado);
    }

    private void consultar() {
        String jwt = txtToken.getText();

        if (jwt == null || jwt.trim().isEmpty()) {
            lblEstado.setText("Validacion: Debe ingresar un token JWT");
            return;
        }

        btnConsultar.setDisable(true);
        lblEstado.setText("Consultando...");

        api.consultarVehiculos(jwt.trim()).thenAccept(resultado -> {
            Platform.runLater(() -> {
                btnConsultar.setDisable(false);
                int codigo = resultado.codigoHttp();

                if (codigo == 200) {
                    tabla.getItems().setAll(resultado.vehiculos());
                    lblTotal.setText("Total de vehiculos: " + resultado.vehiculos().size());
                    lblEstado.setText("Consulta exitosa (200 OK)");
                } else if (codigo == 401) {
                    tabla.getItems().clear();
                    lblTotal.setText("Total de vehiculos: 0");
                    lblEstado.setText("Error 401: Token invalido o expirado");
                } else if (codigo == 403) {
                    tabla.getItems().clear();
                    lblTotal.setText("Total de vehiculos: 0");
                    lblEstado.setText("Error 403: Sin permisos");
                } else {
                    tabla.getItems().clear();
                    lblTotal.setText("Total de vehiculos: 0");
                    lblEstado.setText("Error HTTP " + codigo);
                }
            });
        }).exceptionally(ex -> {
            Platform.runLater(() -> {
                btnConsultar.setDisable(false);
                tabla.getItems().clear();
                lblTotal.setText("Total de vehiculos: 0");
                lblEstado.setText("Error de conexion con el servidor");
            });
            return null;
        });
    }
}