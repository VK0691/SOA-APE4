# react-fetch-vehiculos — Plataforma Web de Consulta (React + Vite)

Cliente web de consulta conectado a NGINX (`http://127.0.0.1:8090`) mediante el proxy de desarrollo de Vite (`/api`).

## Funcionalidades (APE 04 — Actividad 7)
- Consulta del catálogo de vehículos (`GET /api/vehiculos`) con JWT en memoria.
- Filtro dinámico por marca y vista de detalle del vehículo seleccionado.
- Consulta del historial de ventas (`GET /api/ventas` vía NGINX → FastAPI).
- **No incluye formularios ni peticiones `POST /api/ventas`.**

## Instalación y ejecución
```powershell
npm install
npm run dev
# Abrir: http://localhost:5173
```
