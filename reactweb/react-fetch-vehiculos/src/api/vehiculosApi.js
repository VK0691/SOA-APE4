/**
 * Cliente HTTP de la API de vehículos y ventas.
 * Ruta proxy: Vite /api -> NGINX :8090 -> Spring Boot / FastAPI
 */

const MENSAJES_HTTP = {
  401: 'HTTP 401: Falta el JWT o el token ya no es válido.',
  403: 'HTTP 403: El usuario no tiene permiso para consultar.',
  404: 'HTTP 404: Ruta no encontrada en el servidor.',
  500: 'HTTP 500: Error interno del servidor.',
  502: 'HTTP 502: El servidor intermedio no pudo contactar al backend.',
  503: 'HTTP 503: El servicio no está disponible.',
};

async function fetchJson(ruta, token) {
  const headers = new Headers({ Accept: 'application/json' });
  if (token && token.trim()) {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }

  let respuesta;
  try {
    respuesta = await fetch(ruta, { method: 'GET', headers, cache: 'no-store' });
  } catch {
    throw new Error('No se pudo conectar con NGINX. Verifique que el balanceador esté activo.');
  }

  if (!respuesta.ok) {
    const error = new Error(
      MENSAJES_HTTP[respuesta.status] ?? `La API devolvió HTTP ${respuesta.status}.`
    );
    error.status = respuesta.status;
    throw error;
  }

  if (respuesta.status === 204) return { datos: [], codigoHttp: 204 };

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error('La API respondió, pero el JSON no pudo interpretarse.');
  }

  return { datos, codigoHttp: respuesta.status };
}

export async function listarVehiculos(token) {
  const { datos, codigoHttp } = await fetchJson('/api/vehiculos', token);
  if (!Array.isArray(datos)) {
    throw new Error('Se esperaba un arreglo JSON de vehículos.');
  }
  return { vehiculos: datos, codigoHttp };
}

export async function listarVentas(token) {
  const { datos, codigoHttp } = await fetchJson('/api/ventas', token);
  // FastAPI puede devolver un arreglo o un objeto paginado con campo "items"
  const lista = Array.isArray(datos) ? datos : (datos.items ?? []);
  return { ventas: lista, codigoHttp };
}
