# APE 04 — Arquitectura Multicanal de Vehículos, Compradores, Ventas y Notificaciones

**Universidad Técnica de Ambato — FISEI — Carrera de Software**  
**Asignatura:** Aplicaciones Orientadas a Servicios (5to Semestre "B")  
**Docente:** Ing. Javier Santiago Vargas Paredes, Mg.  
**Estudiante:** Molina Nuñez Karen Valeria  
**Ciclo Académico:** Julio 2026 – Diciembre 2026

---

## 1. Arquitectura y Puertos Locales

| Componente | Tecnología | Puerto local | Responsabilidad principal |
|---|---|---:|---|
| **NGINX** | Reverse Proxy / Load Balancer | `8090` | Punto único de entrada REST; balanceo ponderado **3:1** hacia Java A y B; proxy hacia FastAPI y Notificaciones |
| **API Vehículos — Instancia A** | Java 17 / Spring Boot | `8081` | OAuth2/JWT, catálogo de vehículos, reservas internas (`weight=3` en NGINX) |
| **API Vehículos — Instancia B** | Java 17 / Spring Boot | `8082` | Instancia equivalente stateless sobre la misma BD (`weight=1` en NGINX) |
| **API Ventas y Compradores** | Python 3 / FastAPI | `8000` | Gestión de compradores, registro idempotente de ventas (`Idempotency-Key`) y publicación de eventos en RabbitMQ |
| **Servicio de Notificaciones** | Java 17 / Spring Boot AMQP | `8083` | Consumidor `@RabbitListener` de `notificaciones.ventas` con deduplicación por `eventoId` y API `GET /api/notificaciones` |
| **RabbitMQ** | Docker (`rabbitmq:3-management`) | `5672` / `15672` | Cola durable `notificaciones.ventas` con mensajes persistentes |
| **MySQL / MariaDB** | XAMPP MariaDB | `3306` | Base de datos operativa `venta_vehiculos` |
| **Windows Forms** | C# / .NET 8 (`SOA_Venta_API`) | Escritorio | Crear/listar vehículos y compradores; listar ventas (**solo consulta**) |
| **PWA Móvil** | HTML5 / CSS3 / JS ES Modules | `5174` | Login JWT (`POST /oauth/token`) y **único cliente autorizado para registrar ventas** (`POST /api/ventas`) |
| **Cliente Web React** | React + Vite + Fetch | `5173` | Consulta de catálogo, filtro por marca, detalle y consulta de ventas (**sin creación de ventas**) |
| **Cliente JavaFX** | JavaFX + `HttpClient` | Escritorio | Consulta de vehículos y monitoreo automático de notificaciones de ventas (polling cada 4 s) |

> **Nota técnica de puertos:** En el equipo de pruebas el puerto `8080` se encuentra ocupado por un servicio local de Oracle XE (`TNSLSNR`). En concordancia con los ajustes técnicos permitidos por la guía APE 04, las instancias Java se desplegaron en `8081` y `8082` (detrás de NGINX `:8090`), FastAPI en `8000` y Notificaciones en `8083`.

---

## 2. Preparación de Credenciales Locales (Sin Secretos en Repositorio)

Antes de ejecutar los servicios, copie cada plantilla y complete sus credenciales locales:

```powershell
Copy-Item ventas-api\.env.example ventas-api\.env
Copy-Item venta-vehiculos-api_security\src\main\resources\application.properties.example venta-vehiculos-api_security\src\main\resources\application.properties
Copy-Item notificaciones-service\src\main\resources\application.properties.example notificaciones-service\src\main\resources\application.properties
```

Importe el esquema SQL limpio (sin datos personales) si parte de una base vacía:

```powershell
mysql -u root -e "CREATE DATABASE IF NOT EXISTS venta_vehiculos;"
mysql -u root venta_vehiculos < sql/schema_venta_vehiculos.sql
```

---

## 3. Orden de Arranque Reproducible

1. **MySQL / MariaDB (`:3306`):** Iniciar servicio XAMPP MySQL.
2. **RabbitMQ (`:5672` / `:15672`):**
   ```powershell
   docker compose -f docker-compose.rabbitmq.yml up -d
   ```
3. **NGINX (`:8090`):** Copiar `nginx.conf` a `conf/nginx.conf`, validar y arrancar:
   ```powershell
   nginx -t
   nginx -g "daemon off;"
   ```
4. **API Vehículos Spring Boot — Instancia A (`:8081`) e Instancia B (`:8082`):**
   ```powershell
   cd venta-vehiculos-api_security
   .\mvnw.cmd package -DskipTests
   java -jar target\venta-vehiculos-api-0.0.1-SNAPSHOT.jar --server.port=8081
   java -jar target\venta-vehiculos-api-0.0.1-SNAPSHOT.jar --server.port=8082
   ```
5. **API Ventas FastAPI (`:8000`):**
   ```powershell
   cd ventas-api
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   .\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
6. **Servicio de Notificaciones (`:8083`):**
   ```powershell
   cd notificaciones-service
   .\mvnw.cmd package -DskipTests
   java -jar target\notificaciones-service-0.0.1-SNAPSHOT.jar
   ```
7. **Clientes:**
   - **Windows Forms:** `cd SOA_Venta_API\SOA_Venta_API && dotnet run`
   - **PWA Móvil (`:5174`):** `cd AplicacionMovilPWA && node server.mjs`
   - **React Web (`:5173`):** `cd reactweb\react-fetch-vehiculos && npm install && npm run dev`
   - **JavaFX:** `cd escritorioFX\consultarvehiculojavafx && mvn javafx:run`
