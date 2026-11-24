import { login, listarVehiculos, listarCompradores, registrarVenta } from './api.js';

// ---- Estado en memoria (nunca se persiste) ----
let jwt = null;
let vehiculoSeleccionadoId = null;
let compradorSeleccionadoId = null;

// Clave idempotente con boton manual "Nueva clave idempotente"
const sesionPrefijo = `PWA-${Date.now().toString().slice(-6)}`;
let contadorIdempotencia = 1;
let idempotencyKey = construirClave(contadorIdempotencia);

// Datos y paginacion
const ITEMS_POR_PAGINA = 5;
let vehiculosDisponibles = [];
let paginaVehiculos = 1;
let compradoresLista = [];
let paginaCompradores = 1;

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
const pagVehiculos = document.querySelector('#pagVehiculos');
const pVehiculoSel = document.querySelector('#vehiculoSeleccionado');

const btnCargarCompradores = document.querySelector('#btnCargarCompradores');
const lstCompradores = document.querySelector('#lstCompradores');
const pagCompradores = document.querySelector('#pagCompradores');
const pCompradorSel = document.querySelector('#compradorSeleccionado');

const btnRegistrarVenta = document.querySelector('#btnRegistrarVenta');
const btnNuevaKey = document.querySelector('#btnNuevaKey');
const lblIdempotencyKey = document.querySelector('#lblIdempotencyKey');
const msgVenta = document.querySelector('#msgVenta');

const conexion = document.querySelector('#conexion');

// ---- Helpers ----
function construirClave(n) {
  return `${sesionPrefijo}-${String(n).padStart(4, '0')}`;
}

function mostrarClaveActual() {
  lblIdempotencyKey.textContent = `Idempotency-Key: ${idempotencyKey}`;
}

function actualizarKey() {
  contadorIdempotencia += 1;
  idempotencyKey = construirClave(contadorIdempotencia);
  mostrarClaveActual();
  // Si el vehiculo seleccionado ya fue vendido, limpiar seleccion al generar clave nueva
  if (vehiculoSeleccionadoId && !vehiculosDisponibles.some((v) => String(v.idVehiculo ?? v.id) === String(vehiculoSeleccionadoId))) {
    vehiculoSeleccionadoId = null;
    pVehiculoSel.textContent = '';
  }
}

function mostrarMensaje(el, texto, tipo = 'neutro') {
  el.textContent = texto;
  el.className = `mensaje ${tipo}`;
}

function crearTarjeta(etiqueta, id, seleccionado, onClick) {
  const div = document.createElement('div');
  div.className = 'vehiculo';
  div.setAttribute('role', 'listitem');
  div.setAttribute('tabindex', '0');
  div.style.cursor = 'pointer';
  div.textContent = etiqueta;
  div.dataset.id = id;
  if (String(id) === String(seleccionado)) {
    div.style.outline = '3px solid #103b56';
  }
  div.addEventListener('click', () => onClick(id, etiqueta));
  div.addEventListener('keydown', (e) => { if (e.key === 'Enter') onClick(id, etiqueta); });
  return div;
}

function pintarPaginacion(contenedor, paginaActual, totalItems, onCambiarPagina) {
  const totalPaginas = Math.max(1, Math.ceil(totalItems / ITEMS_POR_PAGINA));
  if (totalItems <= ITEMS_POR_PAGINA) {
    contenedor.style.display = 'none';
    contenedor.innerHTML = '';
    return;
  }

  contenedor.style.display = 'flex';
  contenedor.innerHTML = '';

  const btnAnt = document.createElement('button');
  btnAnt.type = 'button';
  btnAnt.className = 'boton-secundario';
  btnAnt.textContent = 'Anterior';
  btnAnt.disabled = paginaActual <= 1;
  btnAnt.addEventListener('click', () => onCambiarPagina(paginaActual - 1));

  const info = document.createElement('span');
  info.className = 'paginacion-info';
  info.textContent = `Pagina ${paginaActual} de ${totalPaginas} (${totalItems} registros)`;

  const btnSig = document.createElement('button');
  btnSig.type = 'button';
  btnSig.className = 'boton-secundario';
  btnSig.textContent = 'Siguiente';
  btnSig.disabled = paginaActual >= totalPaginas;
  btnSig.addEventListener('click', () => onCambiarPagina(paginaActual + 1));

  contenedor.append(btnAnt, info, btnSig);
}

function renderizarVehiculos() {
  lstVehiculos.innerHTML = '';
  const total = vehiculosDisponibles.length;

  if (total === 0) {
    lstVehiculos.textContent = 'No hay vehiculos disponibles para vender.';
    pagVehiculos.style.display = 'none';
    return;
  }

  const totalPaginas = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));
  if (paginaVehiculos > totalPaginas) paginaVehiculos = totalPaginas;

  const inicio = (paginaVehiculos - 1) * ITEMS_POR_PAGINA;
  const pagina = vehiculosDisponibles.slice(inicio, inicio + ITEMS_POR_PAGINA);

  pagina.forEach((v) => {
    const id = v.idVehiculo ?? v.id;
    const etiqueta = `ID:${id} | ${v.marca} ${v.modelo} | ${v.placa} | $${v.precio}`;
    lstVehiculos.appendChild(crearTarjeta(etiqueta, id, vehiculoSeleccionadoId, (selId, lbl) => {
      vehiculoSeleccionadoId = selId;
      pVehiculoSel.textContent = `Vehiculo seleccionado: ${lbl}`;
      renderizarVehiculos();
    }));
  });

  pintarPaginacion(pagVehiculos, paginaVehiculos, total, (nuevaPag) => {
    paginaVehiculos = nuevaPag;
    renderizarVehiculos();
  });
}

function renderizarCompradores() {
  lstCompradores.innerHTML = '';
  const total = compradoresLista.length;

  if (total === 0) {
    lstCompradores.textContent = 'No hay compradores registrados.';
    pagCompradores.style.display = 'none';
    return;
  }

  const totalPaginas = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));
  if (paginaCompradores > totalPaginas) paginaCompradores = totalPaginas;

  const inicio = (paginaCompradores - 1) * ITEMS_POR_PAGINA;
  const pagina = compradoresLista.slice(inicio, inicio + ITEMS_POR_PAGINA);

  pagina.forEach((c) => {
    const etiqueta = `ID:${c.id} | ${c.nombre} | ${c.documento} | ${c.correo}`;
    lstCompradores.appendChild(crearTarjeta(etiqueta, c.id, compradorSeleccionadoId, (selId, lbl) => {
      compradorSeleccionadoId = selId;
      pCompradorSel.textContent = `Comprador seleccionado: ${lbl}`;
      renderizarCompradores();
    }));
  });

  pintarPaginacion(pagCompradores, paginaCompradores, total, (nuevaPag) => {
    paginaCompradores = nuevaPag;
    renderizarCompradores();
  });
}

// ---- LOGIN ----
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = txtUsuario.value.trim();
  const clave = txtPassword.value;
  if (!usuario || !clave) {
    mostrarMensaje(msgLogin, 'Ingrese usuario y contrasena.', 'error');
    return;
  }

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
    mostrarClaveActual();
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
  vehiculosDisponibles = [];
  compradoresLista = [];
  paginaVehiculos = 1;
  paginaCompradores = 1;
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
  pagVehiculos.style.display = 'none';
  pagCompradores.style.display = 'none';
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
    vehiculosDisponibles = res.vehiculos.filter((v) => (v.estado ?? '').toUpperCase() === 'DISPONIBLE');
    paginaVehiculos = 1;
    if (!vehiculosDisponibles.some((v) => String(v.idVehiculo ?? v.id) === String(vehiculoSeleccionadoId))) {
      vehiculoSeleccionadoId = null;
      pVehiculoSel.textContent = '';
    }
    renderizarVehiculos();
  } catch (err) {
    lstVehiculos.textContent = err.message;
    pagVehiculos.style.display = 'none';
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
    compradoresLista = res.compradores;
    paginaCompradores = 1;
    renderizarCompradores();
  } catch (err) {
    lstCompradores.textContent = err.message;
    pagCompradores.style.display = 'none';
  } finally {
    btnCargarCompradores.disabled = false;
  }
});

// ---- VENTA ----
btnNuevaKey.addEventListener('click', actualizarKey);

btnRegistrarVenta.addEventListener('click', async () => {
  if (!jwt) { mostrarMensaje(msgVenta, 'Primero inicie sesion.', 'error'); return; }
  if (!vehiculoSeleccionadoId) { mostrarMensaje(msgVenta, 'Seleccione un vehiculo disponible.', 'error'); return; }
  if (!compradorSeleccionadoId) { mostrarMensaje(msgVenta, 'Seleccione un comprador.', 'error'); return; }

  btnRegistrarVenta.disabled = true;
  mostrarMensaje(msgVenta, `Registrando venta con key: ${idempotencyKey}...`, 'neutro');

  try {
    const res = await registrarVenta(jwt, Number(vehiculoSeleccionadoId), Number(compradorSeleccionadoId), idempotencyKey);
    const { codigoHttp, datos } = res;

    if (codigoHttp === 201) {
      mostrarMensaje(msgVenta, `HTTP 201: Venta CREADA. ID: ${datos.id ?? '?'} | Estado: ${datos.estado ?? '?'}`, 'exito');
      // Quitar automaticamente el vehiculo vendido del listado de disponibles
      vehiculosDisponibles = vehiculosDisponibles.filter((v) => String(v.idVehiculo ?? v.id) !== String(vehiculoSeleccionadoId));
      renderizarVehiculos();
    } else if (codigoHttp === 200) {
      mostrarMensaje(msgVenta, `HTTP 200: Venta IDEMPOTENTE (ya existia). ID: ${datos.id ?? '?'} | Estado: ${datos.estado ?? '?'}`, 'exito');
    } else if (codigoHttp === 409) {
      const det = datos?.detail || 'Conflicto de idempotencia — misma clave, cuerpo diferente.';
      mostrarMensaje(msgVenta, `HTTP 409: ${det}`, 'error');
    } else if (codigoHttp === 403) {
      mostrarMensaje(msgVenta, 'HTTP 403: Sin permiso para registrar ventas (se requiere rol OPERADOR o ADMIN).', 'error');
    } else if (codigoHttp === 401) {
      mostrarMensaje(msgVenta, 'HTTP 401: Sesion vencida o token invalido. Vuelva a iniciar sesion.', 'error');
    } else {
      mostrarMensaje(msgVenta, `HTTP ${codigoHttp}: ${datos?.detail || JSON.stringify(datos)}`, 'error');
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
