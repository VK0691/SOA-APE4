import { useState } from 'react';
import { listarVehiculos, listarVentas } from './api/vehiculosApi.js';
import './App.css';

const dinero = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

function mostrarPrecio(precio) {
  if (precio === null || precio === undefined || precio === '') return '—';
  const numero = Number(precio);
  return Number.isFinite(numero) ? dinero.format(numero) : String(precio);
}

export default function App() {
  const [token, setToken] = useState('');
  const [mostrarToken, setMostrarToken] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [marca, setMarca] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [mensaje, setMensaje] = useState('Listo para consultar.');
  const [mensajeVentas, setMensajeVentas] = useState('');
  const [error, setError] = useState('');
  const [errorVentas, setErrorVentas] = useState('');
  const [codigoHttp, setCodigoHttp] = useState(null);
  const [codigoHttpVentas, setCodigoHttpVentas] = useState(null);

  const visibles = vehiculos.filter((v) =>
    String(v.marca ?? '').toLowerCase().includes(marca.trim().toLowerCase())
  );

  async function consultarVehiculos(evento) {
    evento.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('Consultando via NGINX → Spring Boot...');
    setCodigoHttp(null);
    setVehiculos([]);
    setSeleccionado(null);

    try {
      const resultado = await listarVehiculos(token);
      setVehiculos(resultado.vehiculos);
      setCodigoHttp(resultado.codigoHttp);
      setMensaje(`HTTP ${resultado.codigoHttp}: ${resultado.vehiculos.length} vehículos.`);
    } catch (e) {
      setCodigoHttp(e.status ?? null);
      setError(e.message);
      setMensaje('La consulta no pudo completarse.');
    } finally {
      setCargando(false);
    }
  }

  async function consultarVentas() {
    if (!token.trim()) {
      setErrorVentas('Ingrese el JWT antes de consultar ventas.');
      return;
    }
    setCargandoVentas(true);
    setErrorVentas('');
    setMensajeVentas('Consultando via NGINX → FastAPI...');
    setCodigoHttpVentas(null);
    setVentas([]);

    try {
      const resultado = await listarVentas(token);
      setVentas(resultado.ventas);
      setCodigoHttpVentas(resultado.codigoHttp);
      setMensajeVentas(`HTTP ${resultado.codigoHttp}: ${resultado.ventas.length} venta(s).`);
    } catch (e) {
      setCodigoHttpVentas(e.status ?? null);
      setErrorVentas(e.message);
      setMensajeVentas('No se pudieron obtener las ventas.');
    } finally {
      setCargandoVentas(false);
    }
  }

  return (
    <main className="contenedor">
      <header className="cabecera">
        <div className="marca-producto">PRÁCTICA WEB · REACT + FETCH · NGINX :8090</div>
        <h1>Consulta de vehículos y ventas</h1>
        <p>Cliente web de las APIs REST (Spring Boot + FastAPI) mediante NGINX balanceador.</p>
      </header>

      {/* SECCIÓN 1: TOKEN */}
      <section className="panel" aria-labelledby="titulo-acceso">
        <h2 id="titulo-acceso">1. Autenticación JWT</h2>
        <p className="ayuda">
          Obtenga el token desde Postman con <code>POST /oauth/token</code> a través de NGINX.
        </p>

        <form onSubmit={consultarVehiculos}>
          <label htmlFor="jwt">Token JWT (sin escribir "Bearer")</label>
          <div className="linea-token">
            <input
              id="jwt"
              type={mostrarToken ? 'text' : 'password'}
              autoComplete="off"
              spellCheck="false"
              placeholder="Pegar token JWT obtenido de Postman"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="secundario"
              type="button"
              onClick={() => setMostrarToken((v) => !v)}
              aria-label={mostrarToken ? 'Ocultar token' : 'Mostrar token'}
            >
              {mostrarToken ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          <div className="acciones">
            <button type="submit" disabled={cargando}>
              {cargando ? 'Consultando...' : 'Consultar vehículos'}
            </button>
            <button
              className="secundario"
              type="button"
              disabled={cargando}
              onClick={() => { setToken(''); setMostrarToken(false); }}
            >
              Limpiar token
            </button>
          </div>
        </form>

        <div className={error ? 'estado estado-error' : 'estado estado-ok'} role="status" aria-live="polite">
          <span>{error || mensaje}</span>
          {codigoHttp !== null && <strong> HTTP {codigoHttp}</strong>}
        </div>
        <p className="nota">El JWT permanece en memoria: no se guarda en localStorage.</p>
      </section>

      {/* SECCIÓN 2: CATÁLOGO */}
      <section className="panel" aria-labelledby="titulo-listado">
        <div className="titulo-listado">
          <div>
            <h2 id="titulo-listado">2. Catálogo de vehículos</h2>
            <p className="ayuda">Vía NGINX → Spring Boot (8081/8082). Filtro aplicado en el navegador.</p>
          </div>
          <span className="contador">{visibles.length} visibles</span>
        </div>

        <label htmlFor="filtroMarca">Filtrar por marca</label>
        <input
          id="filtroMarca"
          type="search"
          placeholder="Ejemplo: Toyota"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          disabled={cargando}
        />

        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Marca</th>
                <th scope="col">Modelo</th>
                <th scope="col">Placa</th>
                <th scope="col">Año</th>
                <th scope="col">Color</th>
                <th scope="col">Precio</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((v, i) => (
                <tr key={v.idVehiculo ?? v.id ?? i}>
                  <td>
                    <button
                      className="enlace-id"
                      type="button"
                      onClick={() => setSeleccionado(v)}
                      aria-label={`Ver detalle del vehículo ${v.idVehiculo ?? v.id ?? ''}`}
                    >
                      {v.idVehiculo ?? v.id ?? '—'}
                    </button>
                  </td>
                  <td>{v.marca ?? '—'}</td>
                  <td>{v.modelo ?? '—'}</td>
                  <td>{v.placa ?? '—'}</td>
                  <td>{v.anio ?? '—'}</td>
                  <td>{v.color ?? '—'}</td>
                  <td>{mostrarPrecio(v.precio)}</td>
                  <td>{v.estado ?? '—'}</td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td className="sin-datos" colSpan="8">
                    {cargando
                      ? 'Cargando vehículos...'
                      : vehiculos.length === 0
                      ? 'Presione "Consultar vehículos" para cargar el catálogo.'
                      : 'No hay vehículos que coincidan con la marca ingresada.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN 3: DETALLE */}
      <section className="panel" aria-labelledby="titulo-detalle">
        <h2 id="titulo-detalle">3. Detalle del vehículo</h2>
        {seleccionado ? (
          <dl className="detalle">
            <div><dt>ID</dt><dd>{seleccionado.idVehiculo ?? seleccionado.id ?? '—'}</dd></div>
            <div><dt>Marca</dt><dd>{seleccionado.marca ?? '—'}</dd></div>
            <div><dt>Modelo</dt><dd>{seleccionado.modelo ?? '—'}</dd></div>
            <div><dt>Placa</dt><dd>{seleccionado.placa ?? '—'}</dd></div>
            <div><dt>Chasis</dt><dd>{seleccionado.chasis ?? '—'}</dd></div>
            <div><dt>Año</dt><dd>{seleccionado.anio ?? '—'}</dd></div>
            <div><dt>Color</dt><dd>{seleccionado.color ?? '—'}</dd></div>
            <div><dt>Precio</dt><dd>{mostrarPrecio(seleccionado.precio)}</dd></div>
            <div><dt>Estado</dt><dd>{seleccionado.estado ?? '—'}</dd></div>
          </dl>
        ) : (
          <p className="ayuda">Haga clic en el ID de una fila del catálogo para ver el detalle.</p>
        )}
      </section>

      {/* SECCIÓN 4: VENTAS (solo consulta) */}
      <section className="panel" aria-labelledby="titulo-ventas">
        <div className="titulo-listado">
          <div>
            <h2 id="titulo-ventas">4. Historial de ventas</h2>
            <p className="ayuda">
              Vía NGINX → FastAPI (:8000). Solo consulta — el registro de ventas es exclusivo de la PWA.
            </p>
          </div>
          <span className="contador">{ventas.length} venta(s)</span>
        </div>

        <div className="acciones">
          <button type="button" onClick={consultarVentas} disabled={cargandoVentas}>
            {cargandoVentas ? 'Consultando...' : 'Consultar ventas'}
          </button>
        </div>

        {(mensajeVentas || errorVentas) && (
          <div className={errorVentas ? 'estado estado-error' : 'estado estado-ok'} role="status" aria-live="polite">
            <span>{errorVentas || mensajeVentas}</span>
            {codigoHttpVentas !== null && <strong> HTTP {codigoHttpVentas}</strong>}
          </div>
        )}

        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Vehículo ID</th>
                <th scope="col">Comprador ID</th>
                <th scope="col">Estado</th>
                <th scope="col">Precio</th>
                <th scope="col">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v, i) => (
                <tr key={v.id ?? i}>
                  <td>{v.id ?? '—'}</td>
                  <td>{v.vehiculo_id ?? v.vehiculoId ?? '—'}</td>
                  <td>{v.comprador_id ?? v.compradorId ?? '—'}</td>
                  <td>{v.estado ?? '—'}</td>
                  <td>{mostrarPrecio(v.precio_acordado ?? v.precioAcordado)}</td>
                  <td>{v.fechaUTC ?? v.fecha_creacion ?? v.fechaCreacion ?? '—'}</td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td className="sin-datos" colSpan="6">
                    {cargandoVentas ? 'Cargando ventas...' : 'Presione "Consultar ventas" para cargar el historial.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
