# Microservicio de Notificaciones (`notificaciones-service`)

Servicio REST complementario desarrollado en **Java 17** con **Spring Boot 3**, diseñado para la recepción y procesamiento asíncrono de eventos de notificación emitidos tras la confirmación de transacciones en el sistema de ventas y vehículos.

---

## 1. Requisitos y Dependencias

- **JDK**: Java Development Kit 17 (OpenJDK, Eclipse Temurin o similar).
- **Maven**: 3.8+ (incluye scripts de ejecución `mvnw` y `mvnw.cmd`).

### Dependencias (`pom.xml`)
- `spring-boot-starter-web`: Exposición de endpoints REST y servidor Tomcat embebido.
- `spring-boot-starter-validation`: Validación por anotaciones (`@NotNull`, `@NotBlank`, `@Min`).

---

## 2. Configuración (`application.properties`)

Ubicado en `src/main/resources/application.properties`:

```properties
spring.application.name=notificaciones-service
server.port=8083
server.address=127.0.0.1

# Claves de servicio autorizadas (separadas por coma)
app.notificacion-key=avisos-java-python-aula-2026-key-7G5nP3rQ8c6L2t,aviso-java-python-aula-2026-key-4b7y9e2d1m8s
```

---

## 3. Instalación y Ejecución

### Ejecución con Maven Wrapper

**En Windows (PowerShell / CMD):**
```powershell
.\mvnw.cmd spring-boot:run
```

**En Linux / macOS:**
```bash
./mvnw spring-boot:run
```

El servicio queda a la escucha en:
```text
http://localhost:8083
```

---

## 4. Endpoints y Contrato HTTP

### Enviar Notificación de Evento
- **Método / URL:** `POST http://localhost:8083/api/notificaciones`
- **Headers obligatorios:**
  - `Content-Type: application/json`
  - `X-Notification-Key: avisos-java-python-aula-2026-key-7G5nP3rQ8c6L2t` (o la clave configurada en `ventas-api`)
  - *(Opcional)* `X-Correlation-Id: <uuid>` (para trazabilidad distribuida)

#### Ejemplo de Cuerpo de Solicitud (JSON):
```json
{
  "vehiculoId": 5,
  "destinatario": "usuario@correo.com",
  "tipo": "REGISTRO",
  "mensaje": "Vehículo registrado correctamente"
}
```

#### Respuesta Exitosa (201 Created):
```json
{
  "success": true,
  "estado": "ENVIADA",
  "mensaje": "Notificación procesada correctamente"
}
```

#### Validaciones y Control de Errores:
- `vehiculoId`: Obligatorio y mayor a 0.
- `destinatario`: No puede ser nulo ni estar en blanco.
- `mensaje`: No puede estar vacío.
- `tipo`: Solo admite `REGISTRO`, `ACTUALIZACION` o `ELIMINACION`.
- Si la cabecera `X-Notification-Key` falta o no coincide con las autorizadas, responde `401 Unauthorized` / `403 Forbidden`.
- Si los datos violan las restricciones, responde `400 Bad Request`.
