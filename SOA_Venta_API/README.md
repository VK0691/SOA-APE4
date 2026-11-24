# SOA_Venta_API — Cliente Administrativo Windows Forms (.NET)

Cliente de escritorio C# Windows Forms para administración y consulta a través de NGINX (`http://127.0.0.1:8090`).

## Funcionalidades (APE 04 — Actividad 5)
- **Vehículos (Spring Boot vía NGINX):** Listar (`GET /api/vehiculos`) y crear (`POST /api/vehiculos`, con validación de chasis VIN de 17 caracteres).
- **Compradores (FastAPI vía NGINX):** Listar (`GET /api/compradores`) y crear (`POST /api/compradores`).
- **Ventas (FastAPI vía NGINX):** Solo consulta (`GET /api/ventas`). Por regla de negocio no incluye registro de ventas.
- Comunicación HTTP encapsulada en `ApiClient.cs` separada de `Form1.cs`.

## Compilación y ejecución
```powershell
cd SOA_Venta_API
dotnet build
dotnet run
```
