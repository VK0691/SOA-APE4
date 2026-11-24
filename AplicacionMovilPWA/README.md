# AplicacionMovilPWA — Cliente Móvil PWA (Registro Exclusivo de Ventas)

Aplicación web progresiva (HTML/CSS/JS) servida localmente en el puerto `5174` con proxy hacia NGINX (`http://127.0.0.1:8090`).

## Funcionalidades (APE 04 — Actividad 6)
- Inicio de sesión real con usuario y contraseña (`POST /oauth/token` vía NGINX). Token JWT conservado únicamente en memoria durante la sesión.
- Selección de vehículos disponibles (`GET /api/vehiculos`) y compradores (`GET /api/compradores`).
- **Único cliente autorizado para registrar ventas** (`POST /api/ventas`) con cabecera `Idempotency-Key` autogenerada y soporte de reintento/consulta (`GET /api/ventas/{id}`).
- Manifiesto PWA (`manifest.webmanifest`) y Service Worker (`sw.js`) sin cachear respuestas protegidas ni JWT.

## Ejecución
```powershell
node server.mjs
# Abrir: http://localhost:5174
```
