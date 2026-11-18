# Microservicio Central de Vehículos y Seguridad (`venta-vehiculos-api_security`)

Servicio central del ecosistema desarrollado en **Java 17** con **Spring Boot 3**, **Spring Security**, **JPA/Hibernate** y persistencia en **MySQL / MariaDB**. Proporciona el catálogo maestro de vehículos, emisión de tokens OAuth2/JWT con control de acceso basado en roles (RBAC), gestión de reservas y coordinación transaccional.

---

## 1. Requisitos y Dependencias

- **JDK**: Java Development Kit 17 (Eclipse Temurin, OpenJDK u Oracle).
- **Maven**: Versión 3.8 o superior (se incluye Maven Wrapper `mvnw` y `mvnw.cmd`).
- **MySQL / MariaDB**: Instancia local activa en el puerto `3306` con la base de datos `venta_vehiculos`.

### Componentes y librerías clave (`pom.xml`)
- `spring-boot-starter-web`: API REST y contenedor embebido Apache Tomcat.
- `spring-boot-starter-data-jpa`: Capa de persistencia relacional con Hibernate.
- `spring-boot-starter-security`: Seguridad por filtros, protección de endpoints y gestión de roles (`ROLE_ADMIN`, `ROLE_OPERADOR`).
- `jjwt` (Java JWT): Emisión, firma criptográfica (HMAC-SHA256) y validación de tokens Bearer.
- `mariadb-java-client` / `mysql-connector-j`: Conector relacional JDBC.

---

## 2. Configuración (`application.properties`)

El archivo se encuentra en `src/main/resources/application.properties`. Sus parámetros principales son:

```properties
# Puerto de escucha del servicio
server.port=8081
server.address=127.0.0.1

# Conexion a MySQL
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/venta_vehiculos?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=

# Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true

# Seguridad OAuth2 y JWT
app.security.jwt-secret=ZgF1H57pdP00VgPHNFVCr7pdbi4WRHF+3AeVikPAmk4=
app.security.client-id=vehiculos-client
app.security.client-secret=cliente-local-aula-2026-cambiar
app.security.ventas-key=ventas-java-python-aula-2026-key-9F2uN4bS6x8Q1m

# Usuario inicial (bootstrap)
app.bootstrap.user=admin-local
app.bootstrap.password=cambiar-contrasena-aula-2026
app.bootstrap.role=ADMIN
```

---

## 3. Instalación y Ejecución

### Opción A: Ejecución directa con Maven Wrapper

**En Windows (PowerShell / CMD):**
```powershell
.\mvnw.cmd spring-boot:run
```

**En Linux / macOS:**
```bash
./mvnw spring-boot:run
```

### Opción B: Compilación y ejecución del paquete JAR

1. Compilar el proyecto empaquetándolo en `target/`:
   ```bash
   ./mvnw clean package -DskipTests
   ```
2. Ejecutar el artefacto compilado:
   ```bash
   java -jar target/venta-vehiculos-api-security-0.0.1-SNAPSHOT.jar
   ```

El servicio iniciará en:
```text
http://localhost:8081
```

---

## 4. Retos Implementados en este Servicio

| Reto | Componente / Endpoint | Descripción |
| :--- | :--- | :--- |
| **F05** | `GET /api/vehiculos?marca=...&estado=DISPONIBLE` | Filtro compuesto por marca y estado del catálogo con validación de estados permitidos (`DISPONIBLE`, `RESERVADO`, `VENDIDO`). Retorna 400 Bad Request si el estado es inválido. |
| **S14** | `CorrelationFilter.java` / Interceptores | Captura, inyección y propagación de la cabecera `X-Correlation-Id` en solicitudes HTTP entrantes y salientes, integrándose con MDC para trazabilidad distribuida de logs. |

---

## 5. Endpoints Principales y Autenticación

### 1. Obtener Token JWT de Acceso
- **Método / URL:** `POST http://localhost:8081/oauth/token`
- **Autenticación:** Basic Auth (`vehiculos-client` / `cliente-local-aula-2026-cambiar`)
- **Headers:** `Content-Type: application/x-www-form-urlencoded`
- **Body:**
  - `grant_type=password`
  - `username=admin-local`
  - `password=cambiar-contrasena-aula-2026`
- **Respuesta (200 OK):** Objeto JSON con `access_token` Bearer y tiempo de expiración.

### 2. Catálogo de Vehículos
- `GET http://localhost:8081/api/vehiculos` (Listado general)
- `GET http://localhost:8081/api/vehiculos?marca=Chevrolet&estado=DISPONIBLE` (Filtro compuesto Reto F05)

### 3. Operaciones de Reserva y Venta (Protegidas)
- `POST http://localhost:8081/api/vehiculos/{id}/reservar` (Reserva temporal de vehículo)
- `POST http://localhost:8081/api/vehiculos/{id}/confirmar` (Confirmación definitiva de venta)

