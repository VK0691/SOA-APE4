import { listarVehiculos } from './api.js';

// Referencias a los controles de la interfaz móvil.
const formulario = document.querySelector('#formulario');
const campoToken = document.querySelector('#jwt');
const botonConsultar = document.querySelector('#consultar');
const botonBorrar = document.querySelector('#borrar');
const botonMostrar = document.querySelector('#alternarToken');
const mensaje = document.querySelector('#mensaje');
const contenedor = document.querySelector('#vehiculos');
const contador = document.querySelector('#contador');
const conexion = document.querySelector('#conexion');

const moneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

function mostrarMensaje(texto, tipo = 'neutro') {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

function limpiarListado() {
  contenedor.replaceChildren();
  contador.textContent = '0 vehículos';
}

function crearElemento(etiqueta, clase, contenido) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  // textContent impide interpretar HTML que pudiera venir de la API.
  if (contenido !== undefined) elemento.textContent = String(contenido);
  return elemento;
}

function texto(valor) {
  return valor === null || valor === undefined || valor === '' ? '—' : String(valor);
}

function precio(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  return Number.isFinite(numero) ? moneda.format(numero) : texto(valor);
}

function agregarDato(grilla, etiqueta, valor, extra = '') {
  const grupo = crearElemento('div', extra);
  grupo.append(
    crearElemento('span', 'dato-etiqueta', etiqueta),
    crearElemento('span', 'dato-valor', valor),
  );
  grilla.append(grupo);
}

function pintarListado(vehiculos) {
  limpiarListado();
  contador.textContent = `${vehiculos.length} vehículo${vehiculos.length === 1 ? '' : 's'}`;

  if (vehiculos.length === 0) {
    contenedor.append(crearElemento('p', 'vacio', 'HTTP 200: no hay vehículos registrados.'));
    return;
  }

  // Se crea una tarjeta adaptable al tamaño de un teléfono por cada registro.
  for (const vehiculo of vehiculos) {
    const tarjeta = crearElemento('article', 'vehiculo');
    const cabecera = crearElemento('div', 'vehiculo-cabecera');
    const encabezado = crearElemento('div');
    encabezado.append(
      crearElemento('h3', 'vehiculo-titulo', `${texto(vehiculo.marca)} ${texto(vehiculo.modelo)}`),
      crearElemento('span', 'vehiculo-id', `ID: ${texto(vehiculo.idVehiculo ?? vehiculo.id)}`),
    );

    const estado = texto(vehiculo.estado);
    const claseEstado = String(estado).toUpperCase() === 'DISPONIBLE' ? 'disponible'
      : String(estado).toUpperCase() === 'VENDIDO' ? 'vendido' : '';
    cabecera.append(encabezado, crearElemento('span', `estado ${claseEstado}`, estado));

    const grilla = crearElemento('div', 'datos');
    agregarDato(grilla, 'Placa', texto(vehiculo.placa));
    agregarDato(grilla, 'Año', texto(vehiculo.anio));
    agregarDato(grilla, 'Color', texto(vehiculo.color));
    agregarDato(grilla, 'Precio', precio(vehiculo.precio), 'dato-precio');
    tarjeta.append(cabecera, grilla);
    contenedor.append(tarjeta);
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  botonConsultar.disabled = true;
  botonBorrar.disabled = true;
  limpiarListado();
  mostrarMensaje('Consultando vehículos…');

  try {
    const respuesta = await listarVehiculos(campoToken.value);
    pintarListado(respuesta.vehiculos);
    mostrarMensaje(`HTTP ${respuesta.codigoHttp}: ${respuesta.vehiculos.length} vehículo(s) consultado(s).`, 'exito');
  } catch (error) {
    // Ante fallos se mantienen vacíos los resultados; nunca se inventan datos.
    mostrarMensaje(error.message, 'error');
    contador.textContent = '0 vehículos';
    contenedor.append(crearElemento('p', 'vacio', 'No hay datos disponibles para mostrar.'));
  } finally {
    botonConsultar.disabled = false;
    botonBorrar.disabled = false;
  }
});

botonMostrar.addEventListener('click', () => {
  const revelar = campoToken.type === 'password';
  campoToken.type = revelar ? 'text' : 'password';
  botonMostrar.textContent = revelar ? 'Ocultar' : 'Mostrar';
  botonMostrar.setAttribute('aria-pressed', String(revelar));
  botonMostrar.setAttribute('aria-label', revelar ? 'Ocultar token' : 'Mostrar token');
});

botonBorrar.addEventListener('click', () => {
  campoToken.value = '';
  campoToken.type = 'password';
  botonMostrar.textContent = 'Mostrar';
  botonMostrar.setAttribute('aria-pressed', 'false');
  botonMostrar.setAttribute('aria-label', 'Mostrar token');
  mostrarMensaje('Token borrado del formulario.');
  campoToken.focus();
});

function actualizarConexion() {
  conexion.textContent = navigator.onLine ? 'Navegador conectado' : 'Sin conexión de red';
}
window.addEventListener('online', actualizarConexion);
window.addEventListener('offline', actualizarConexion);
actualizarConexion();

// El Service Worker conserva únicamente recursos visuales, nunca el JWT ni /api.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // La consulta REST sigue funcionando aunque no se instale el modo PWA.
    });
  });
}
