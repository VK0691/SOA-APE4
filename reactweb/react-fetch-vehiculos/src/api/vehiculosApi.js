/**
 * Cliente HTTP de la API de vehículos.
 *
 * Responsabilidad: enviar GET, agregar JWT e interpretar HTTP/JSON.
 * No contiene código visual, consultas SQL ni reglas de negocio.
 *
 * La ruta es relativa porque el proxy de Vite (/api) conecta con Java.
 */
export async function listarVehiculos(token) {
  // Headers es el objeto estándar del navegador para cabeceras HTTP.
  const headers = new Headers({ Accept: 'application/json' });

  // Solo se envía Authorization si existe un token escrito por el usuario.
  // Dejarlo vacío permite comprobar el 401 real del backend.
  if (token.trim()) {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }

  let respuesta;
  try {
    // fetch solicita recursos sin bloquear la interfaz de React.
    respuesta = await fetch('/api/vehiculos', {
      method: 'GET',
      headers,
      cache: 'no-store', // Evita mostrar un catálogo almacenado en caché.
    });
  } catch {
    // Un fallo de red impide recibir una respuesta HTTP.
    throw new Error('No se pudo conectar. Verifique el servidor y la red.');
  }

  // fetch NO lanza una excepción automática por códigos como 401 o 403.
  // Por eso, se debe verificar manualmente respuesta.ok.
  if (!respuesta.ok) {
    const mensajes = {
      401: 'HTTP 401: Falta el JWT o el token ya no es válido.',
      403: 'HTTP 403: El usuario no tiene permiso para consultar.',
      404: 'HTTP 404: No existe la ruta /api/vehiculos.',
      500: 'HTTP 500: Error del servidor o de la conexión con la API Java.',
      502: 'HTTP 502: El servidor intermedio no pudo contactar a Java.',
      503: 'HTTP 503: El servicio de vehículos no está disponible.',
    };

    const error = new Error(
      mensajes[respuesta.status] ?? `La API devolvió HTTP ${respuesta.status}.`,
    );
    error.status = respuesta.status; // La interfaz podrá mostrar el código.
    throw error;
  }

  // Una API puede responder 204 cuando no hay contenido.
  if (respuesta.status === 204) {
    return { vehiculos: [], codigoHttp: 204 };
  }

  let datos;
  try {
    // Convertir la respuesta JSON en un arreglo de objetos JavaScript.
    datos = await respuesta.json();
  } catch {
    throw new Error('La API respondió, pero el JSON no pudo interpretarse.');
  }

  // Contrato de esta práctica: GET /api/vehiculos devuelve una lista.
  // Si Java envía otro formato, se debe ajustar según el contrato real.
  if (!Array.isArray(datos)) {
    throw new Error('Se esperaba una lista JSON de vehículos (un arreglo).');
  }

  return { vehiculos: datos, codigoHttp: respuesta.status };
}
