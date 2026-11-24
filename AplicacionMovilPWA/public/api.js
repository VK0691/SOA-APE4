/**
 * api.js — Cliente HTTP de la PWA.
 * Esta PWA es el UNICO cliente autorizado a registrar ventas (POST /api/ventas).
 * El token JWT no se persiste: vive solo en memoria durante la sesion.
 */

export function normalizarToken(entrada = '') {
  return String(entrada).trim().replace(/^Bearer\s+/i, '').trim();
}

function headersBase(jwt) {
  const h = new Headers({ Accept: 'application/json' });
  if (jwt) h.set('Authorization', `Bearer ${jwt}`);
  return h;
}

async function parsearRespuesta(respuesta) {
  const texto = await respuesta.text();
  try { return JSON.parse(texto); } catch { return texto; }
}

// POST /oauth/token — login con credenciales de usuario
export async function login(username, password) {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  });

  // Credenciales del cliente OAuth2 (vehiculos-client)
  const credenciales = btoa('vehiculos-client:cliente-local-aula-2026-cambiar');

  let respuesta;
  try {
    respuesta = await fetch('/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credenciales}`,
        'Accept': 'application/json',
      },
      body,
      cache: 'no-store',
    });
  } catch {
    throw new Error('No se pudo conectar con NGINX para el login.');
  }

  const datos = await parsearRespuesta(respuesta);
  if (!respuesta.ok) {
    throw Object.assign(
      new Error(datos?.mensaje || datos?.error_description || `HTTP ${respuesta.status}: Login fallido`),
      { codigoHttp: respuesta.status }
    );
  }
  return { codigoHttp: respuesta.status, accessToken: datos.access_token, tokenType: datos.token_type };
}

// GET /api/vehiculos
export async function listarVehiculos(jwt) {
  const token = normalizarToken(jwt);
  let respuesta;
  try {
    respuesta = await fetch('/api/vehiculos', {
      method: 'GET',
      headers: headersBase(token),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Error de red al consultar vehiculos.');
  }
  if (!respuesta.ok) {
    throw Object.assign(new Error(`HTTP ${respuesta.status}: Error al listar vehiculos`), { codigoHttp: respuesta.status });
  }
  const datos = await respuesta.json();
  return { codigoHttp: respuesta.status, vehiculos: Array.isArray(datos) ? datos : [] };
}

// GET /api/compradores
export async function listarCompradores(jwt) {
  const token = normalizarToken(jwt);
  let respuesta;
  try {
    respuesta = await fetch('/api/compradores', {
      method: 'GET',
      headers: headersBase(token),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Error de red al consultar compradores.');
  }
  if (!respuesta.ok) {
    throw Object.assign(new Error(`HTTP ${respuesta.status}: Error al listar compradores`), { codigoHttp: respuesta.status });
  }
  const datos = await respuesta.json();
  return { codigoHttp: respuesta.status, compradores: Array.isArray(datos) ? datos : [] };
}

// POST /api/ventas — UNICO cliente autorizado para registrar ventas
export async function registrarVenta(jwt, vehiculoId, compradorId, idempotencyKey) {
  const token = normalizarToken(jwt);
  const h = headersBase(token);
  h.set('Content-Type', 'application/json');
  h.set('Idempotency-Key', idempotencyKey);

  let respuesta;
  try {
    respuesta = await fetch('/api/ventas', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ vehiculoId, compradorId }),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Error de red al registrar la venta.');
  }

  const datos = await parsearRespuesta(respuesta);
  return { codigoHttp: respuesta.status, datos, esIdempotente: respuesta.status === 200 };
}

// GET /api/ventas/{id}
export async function consultarVenta(jwt, id) {
  const token = normalizarToken(jwt);
  let respuesta;
  try {
    respuesta = await fetch(`/api/ventas/${id}`, {
      method: 'GET',
      headers: headersBase(token),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Error de red al consultar la venta.');
  }
  const datos = await parsearRespuesta(respuesta);
  return { codigoHttp: respuesta.status, datos };
}
