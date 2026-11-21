# consultarvehiculojavafx — Cliente Escritorio JavaFX (Vehículos y Notificaciones)

Aplicación de escritorio JavaFX que consume el catálogo de vehículos y monitorea automáticamente las notificaciones de ventas emitidas por RabbitMQ a través de NGINX (`http://127.0.0.1:8090`).

## Funcionalidades (APE 04 — Actividad 9)
- Consulta de vehículos (`GET /api/vehiculos`) con campo de token enmascarado (`PasswordField`) y limpieza al modificar el JWT.
- Panel dividido (`SplitPane`) con tabla de notificaciones en tiempo real alimentada por sondeo automático cada 4 segundos (`Timeline`) contra `GET /api/notificaciones`.
- Controles de inicio/detención de polling y visualización diferenciada de errores de conexión vs lista vacía.

## Compilación y ejecución
```powershell
mvn clean compile
mvn javafx:run
```
