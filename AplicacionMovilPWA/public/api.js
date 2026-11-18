/**
 * Cliente HTTP de vehículos. No conoce la interfaz ni accede a MySQL.
 * La ruta relativa /api/vehiculos es reenviada por server.mjs a Spring Boot.
 */
export function normalizarToken(entrada = '') {
  // Se aceptan tanto JWT sin prefijo como textos que empiezan con Bearer.
  return String(entrada).trim().replace(/^Bearer\s+/i, '').trim();
}

export async function listarVehiculos(entradaToken, ejecutarFetch = fetch) {
  const jwt = normalizarToken(entradaToken);
  const encabezados = new Headers({ Accept: 'application/json' });

  // Si no hay JWT, el backend es quien determina si responde HTTP 401.
  if (jwt) encabezados.set('Authorization', `Bearer ${jwt}`);

  let respuesta;
  try {
    // No se almacena en caché la respuesta con datos protegidos.
    respuesta = await ejecutarFetch('/api/vehiculos', {
      method: 'GET',
      headers: encabezados,
      cache: 'no-store',
    });
  } catch {
    throw new Error('No se pudo conectar con el servicio. Compruebe la red y Spring Boot.');
  }

  if (!respuesta.ok) {
    const mensajes = {
      401: 'HTTP 401: JWT ausente, inválido o vencido.',
      403: 'HTTP 403: el usuario no tiene permiso para consultar.',
      404: 'HTTP 404: no se encontró /api/vehiculos.',
      502: 'HTTP 502: no se pudo establecer conexión con Spring Boot.',
      503: 'HTTP 503: el servicio no está disponible.',
      504: 'HTTP 504: Spring Boot no respondió a tiempo.',
    };
    const error = new Error(mensajes[respuesta.status] || `HTTP ${respuesta.status}: consulta no completada.`);
    error.codigoHttp = respuesta.status;
    throw error;
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error('La API devolvió una respuesta que no es JSON válido.');
  }
  if (!Array.isArray(datos)) {
    throw new Error('La API debe devolver un arreglo JSON de vehículos.');
  }
  return { codigoHttp: respuesta.status, vehiculos: datos };
}
