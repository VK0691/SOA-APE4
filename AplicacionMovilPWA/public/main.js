import { login, listarVehiculos, listarCompradores, registrarVenta } from './api.js';

// ---- Estado en memoria (nunca se persiste) ----
let jwt = null;
let vehiculoSeleccionadoId = null;
let compradorSeleccionadoId = null;
let idempotencyKey = generarKey();

// ---- Referencias DOM ----
const formLogin = document.querySelector('#formLogin');
const txtUsuario = document.querySelector('#txtUsuario');
const txtPassword = document.querySelector('#txtPassword');
const btnLogin = document.querySelector('#btnLogin');
const btnLogout = document.querySelector('#btnLogout');
const btnMostrarPass = document.querySelector('#btnMostrarPass');
const msgLogin = document.querySelector('#msgLogin');

const panelVehiculos = document.querySelector('#panelVehiculos');
const panelCompradores = document.querySelector('#panelCompradores');
const panelVenta = document.querySelector('#panelVenta');

const btnCargarVehiculos = document.querySelector('#btnCargarVehiculos');
const lstVehiculos = document.querySelector('#lstVehiculos');
const pVehiculoSel = document.querySelector('#vehiculoSeleccionado');

const btnCargarCompradores = document.querySelector('#btnCargarCompradores');
const lstCompradores = document.querySelector('#lstCompradores');
const pCompradorSel = document.querySelector('#compradorSeleccionado');

const btnRegistrarVenta = document.querySelector('#btnRegistrarVenta');
const btnNuevaKey = document.querySelector('#btnNuevaKey');
const lblIdempotencyKey = document.querySelector('#lblIdempotencyKey');
const msgVenta = document.querySelector('#msgVenta');

const conexion = document.querySelector('#conexion');

// ---- Helpers ----
function generarKey() {
  return 'PWA-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}

function mostrarMensaje(el, texto, tipo = 'neutro') {
  el.textContent = texto;
  el.className = `mensaje ${tipo}`;
}

function crearTarjeta(etiqueta, id, onClick) {
  const div = document.createElement('div');
  div.className = 'vehiculo';
  div.setAttribute('role', 'listitem');
  div.setAttribute('tabindex', '0');
  div.style.cursor = 'pointer';
  div.textContent = etiqueta;
  div.dataset.id = id;
  div.addEventListener('click', () => onClick(id, etiqueta, div));
  div.addEventListener('keydown', (e) => { if (e.key === 'Enter') onClick(id, etiqueta, div); });
  return div;
}

function marcarSeleccion(contenedor, idSeleccionado) {
  contenedor.querySelectorAll('[data-id]').forEach(el => {
    el.style.outline = el.dataset.id === String(idSeleccionado) ? '3px solid #103b56' : '';
  });
}

// ---- LOGIN ----
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = txtUsuario.value.trim();
  const clave = txtPassword.value;
  if (!usuario || !clave) { mostrarMensaje(msgLogin, 'Ingrese usuario y contrasena.', 'error'); return; }

  btnLogin.disabled = true;
  mostrarMensaje(msgLogin, 'Iniciando sesion via NGINX...', 'neutro');

  try {
    const res = await login(usuario, clave);
    jwt = res.accessToken;
    mostrarMensaje(msgLogin, `HTTP ${res.codigoHttp}: Sesion iniciada. Token obtenido.`, 'exito');
    btnLogin.style.display = 'none';
    btnLogout.style.display = '';
    txtUsuario.disabled = true;
    txtPassword.disabled = true;
    panelVehiculos.style.display = '';
    panelCompradores.style.display = '';
    panelVenta.style.display = '';
    actualizarKey();
  } catch (err) {
    mostrarMensaje(msgLogin, err.message, 'error');
    jwt = null;
  } finally {
    btnLogin.disabled = false;
  }
});

btnLogout.addEventListener('click', () => {
  jwt = null;
  vehiculoSeleccionadoId = null;
  compradorSeleccionadoId = null;
  txtUsuario.disabled = false;
  txtPassword.disabled = false;
  txtPassword.value = '';
  btnLogin.style.display = '';
  btnLogout.style.display = 'none';
  panelVehiculos.style.display = 'none';
  panelCompradores.style.display = 'none';
  panelVenta.style.display = 'none';
  lstVehiculos.innerHTML = '';
  lstCompradores.innerHTML = '';
  pVehiculoSel.textContent = '';
  pCompradorSel.textContent = '';
  mostrarMensaje(msgLogin, 'Sesion cerrada.', 'neutro');
  mostrarMensaje(msgVenta, '', 'neutro');
});

btnMostrarPass.addEventListener('click', () => {
  const revelar = txtPassword.type === 'password';
  txtPassword.type = revelar ? 'text' : 'password';
  btnMostrarPass.textContent = revelar ? 'Ocultar' : 'Mostrar';
});

// ---- VEHICULOS ----
btnCargarVehiculos.addEventListener('click', async () => {
  if (!jwt) { mostrarMensaje(msgLogin, 'Primero inicie sesion.', 'error'); return; }
  btnCargarVehiculos.disabled = true;
  lstVehiculos.textContent = 'Cargando...';

  try {
    const res = await listarVehiculos(jwt);
    lstVehiculos.innerHTML = '';
    const disponibles = res.vehiculos.filter(v => (v.estado ?? '').toUpperCase() === 'DISPONIBLE');
    if (disponibles.length === 0) {
      lstVehiculos.textContent = 'No hay vehiculos disponibles.';
    } else {
      disponibles.forEach(v => {
        const etiqueta = `ID:${v.idVehiculo ?? v.id} | ${v.marca} ${v.modelo} | ${v.placa} | $${v.precio}`;
        lstVehiculos.appendChild(crearTarjeta(etiqueta, v.idVehiculo ?? v.id, (id, lbl, el) => {
          vehiculoSeleccionadoId = id;
          pVehiculoSel.textContent = `Vehiculo seleccionado: ${lbl}`;
          marcarSeleccion(lstVehiculos, id);
        }));
      });
    }
  } catch (err) {
    lstVehiculos.textContent = err.message;
  } finally {
    btnCargarVehiculos.disabled = false;
  }
});

// ---- COMPRADORES ----
btnCargarCompradores.addEventListener('click', async () => {
  if (!jwt) { mostrarMensaje(msgLogin, 'Primero inicie sesion.', 'error'); return; }
  btnCargarCompradores.disabled = true;
  lstCompradores.textContent = 'Cargando...';

  try {
    const res = await listarCompradores(jwt);
    lstCompradores.innerHTML = '';
    if (res.compradores.length === 0) {
      lstCompradores.textContent = 'No hay compradores registrados.';
    } else {
      res.compradores.forEach(c => {
        const etiqueta = `ID:${c.id} | ${c.nombre} | ${c.documento} | ${c.correo}`;
        lstCompradores.appendChild(crearTarjeta(etiqueta, c.id, (id, lbl, el) => {
          compradorSeleccionadoId = id;
          pCompradorSel.textContent = `Comprador seleccionado: ${lbl}`;
          marcarSeleccion(lstCompradores, id);
        }));
      });
    }
  } catch (err) {
    lstCompradores.textContent = err.message;
  } finally {
    btnCargarCompradores.disabled = false;
  }
});

// ---- VENTA ----
function actualizarKey() {
  idempotencyKey = generarKey();
  lblIdempotencyKey.textContent = `Idempotency-Key: ${idempotencyKey}`;
}

btnNuevaKey.addEventListener('click', actualizarKey);

btnRegistrarVenta.addEventListener('click', async () => {
  if (!jwt) { mostrarMensaje(msgVenta, 'Primero inicie sesion.', 'error'); return; }
  if (!vehiculoSeleccionadoId) { mostrarMensaje(msgVenta, 'Seleccione un vehiculo disponible.', 'error'); return; }
  if (!compradorSeleccionadoId) { mostrarMensaje(msgVenta, 'Seleccione un comprador.', 'error'); return; }

  btnRegistrarVenta.disabled = true;
  mostrarMensaje(msgVenta, `Registrando venta con key: ${idempotencyKey}...`, 'neutro');

  try {
    const res = await registrarVenta(jwt, vehiculoSeleccionadoId, compradorSeleccionadoId, idempotencyKey);
    const { codigoHttp, datos, esIdempotente } = res;

    if (codigoHttp === 201) {
      mostrarMensaje(msgVenta, `HTTP 201: Venta CREADA. ID: ${datos.id ?? '?'} | Estado: ${datos.estado ?? '?'}`, 'exito');
    } else if (codigoHttp === 200) {
      mostrarMensaje(msgVenta, `HTTP 200: Venta IDEMPOTENTE (ya existia). ID: ${datos.id ?? '?'} | Estado: ${datos.estado ?? '?'}`, 'exito');
    } else if (codigoHttp === 409) {
      mostrarMensaje(msgVenta, `HTTP 409: Conflicto de idempotencia — misma clave, cuerpo diferente.`, 'error');
    } else {
      mostrarMensaje(msgVenta, `HTTP ${codigoHttp}: ${JSON.stringify(datos)}`, 'error');
    }
  } catch (err) {
    mostrarMensaje(msgVenta, err.message, 'error');
  } finally {
    btnRegistrarVenta.disabled = false;
  }
});

// ---- CONEXION ----
function actualizarConexion() {
  conexion.textContent = navigator.onLine ? 'Navegador conectado' : 'Sin conexion de red';
}
window.addEventListener('online', actualizarConexion);
window.addEventListener('offline', actualizarConexion);
actualizarConexion();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
