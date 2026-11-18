# Microservicio de Ventas (`ventas-api`)

Servicio REST desarrollado en **Python** utilizando **FastAPI**, **SQLAlchemy ORM** y **Alembic** para la gestión del ciclo de vida de ventas de vehículos, gestión de compradores, comprobantes fiscales, trazabilidad distribuida y resiliencia asíncrona.

---

## 1. Requisitos y Dependencias

- **Python**: Versión 3.10 o superior.
- **MySQL / MariaDB**: Instancia activa (puerto por defecto `3306`).
- **Microservicios colaboradores**:
  - `venta-vehiculos-api_security` (Spring Boot en puerto `8081` o `8080`)
  - `notificaciones-service` (Spring Boot en puerto `8083`)

### Dependencias principales (`requirements.txt`)
- `fastapi` y `uvicorn`: Framework web y servidor ASGI de alto rendimiento.
- `sqlalchemy` y `pymysql`: ORM y driver relacional para MySQL.
- `alembic`: Control de versiones y migraciones de esquema de base de datos.
- `pydantic`: Validación estricta de datos y esquemas de entrada/salida.
- `httpx` / `requests`: Clientes HTTP para invocación remota resiliente.
- `python-jose[cryptography]`: Validación y decodificación de tokens OAuth2 / JWT.

---

## 2. Instalación y Configuración

### Paso 1: Crear y activar el entorno virtual
En la raíz de la carpeta `ventas-api`:

**En Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**En Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Paso 2: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 3: Configurar variables de entorno
Copiar el archivo de plantilla `.env.example` a `.env`:

```bash
cp .env.example .env
```
*(En Windows cmd/powershell: `copy .env.example .env`)*

Asegurarse de que los valores coincidan con su entorno local:
```env
# Base de datos MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=venta_vehiculos
DB_USER=root
DB_PASSWORD=

# Servicio Java Vehiculos & Seguridad
JAVA_URL=http://127.0.0.1:8081
VENTAS_SERVICE_KEY=ventas-java-python-aula-2026-key-9F2uN4bS6x8Q1m

# Servicio de Notificaciones
NOTIFICACIONES_URL=http://127.0.0.1:8083
NOTIFICACIONES_KEY=aviso-java-python-aula-2026-key-4b7y9e2d1m8s
```

### Paso 4: Ejecutar migraciones de base de datos
Aplicar las migraciones de Alembic para asegurar las tablas y columnas necesarias:
```bash
alembic upgrade head
```
*(Aplica tanto la versión inicial como la migración `0002_reintentos` que incorpora `reintentos_remotos` y `reintentos_notif`)*.

---

## 3. Ejecución del Servicio

### Modo Servidor API (FastAPI)
Para iniciar el servidor en el puerto `8000`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

El servicio y su documentación interactiva quedarán disponibles en:
- **API URL:** `http://localhost:8000`
- **Swagger UI:** `http://localhost:8000/docs`
- **Redoc:** `http://localhost:8000/redoc`

### Modo Worker de Recuperación Asíncrona (Opcional / Reto S15)
Para ejecutar el proceso en segundo plano encargado de reintentar ventas pendientes o notificaciones fallidas:
```bash
python -m app.worker
```

---

## 4. Retos Implementados en este Servicio

| Reto | Método / Ruta | Descripción |
| :--- | :--- | :--- |
| **F01** | `GET /api/compradores` | Listado de compradores pertenecientes al usuario autenticado. |
| **F02** | `GET /api/compradores/{id}` | Consulta de comprador por ID verificando propiedad y existencia (404/403). |
| **F03** | `GET /api/ventas` | Historial de ventas propias ordenadas por `fecha DESC, id DESC`. |
| **F04** | `GET /api/ventas?estado=...` | Filtrado por estado del ciclo de vida con validación estricta (422). |
| **D06** | `GET /api/ventas?page=...&limit=...` | Paginación con metadata (`total`, `paginas`, `items`, `page`, `limit`). |
| **D07** | `GET /api/compradores?buscar=...` | Búsqueda por coincidencia de subcadena en nombre, documento o correo. |
| **D08** | `PUT /api/compradores/{id}` | Actualización completa/parcial idempotente validando duplicidad y formato. |
| **D09** | `GET /api/ventas/resumen` | Resumen numérico y financiero con precisión decimal sin colisión de rutas. |
| **D10** | `GET /api/ventas/{id}/comprobante` | Emisión de comprobante formal exigiendo estado `COMPLETADA` (409/404). |
| **S11** | `POST /api/ventas` | Auditoría de fallos remotos y registro de intentos sin inconsistencias. |
| **S12** | `GET /api/ventas/incidencias` | Bandeja de incidencias y monitoreo de ventas con fallos operativos. |
| **S13** | `POST /api/ventas/{id}/conciliar` | Conciliación manual de estado con los servicios colaboradores. |
| **S14** | *Filtro / Middleware* | Propagación y trazabilidad de extremo a extremo vía `X-Correlation-Id`. |
| **S15** | *Worker en segundo plano* | Reintentos asíncronos desacoplados con algoritmo de retroceso (*backoff*). |

---

## 5. Pruebas y Colección Postman

Las pruebas de integración y validación funcional se encuentran organizadas en las colecciones de la carpeta `../.postman/`:
- `Retos_Faciles_F01_F05.postman_collection.json`
- `Retos_Dificiles_D06_D10.postman_collection.json`
- `Retos_Superdificiles_S11_S15.postman_collection.json`

