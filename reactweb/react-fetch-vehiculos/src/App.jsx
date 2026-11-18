import { useState } from 'react';
import { listarVehiculos } from './api/vehiculosApi.js';
import './App.css';

// Ecuador usa dólares estadounidenses. No modifica el precio de la API.
const dinero = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
});

// Apoyo visual: el precio se muestra tal como llega, formateado en USD.
function mostrarPrecio(precio) {
  if (precio === null || precio === undefined || precio === '') return '—';
  const numero = Number(precio);
  return Number.isFinite(numero) ? dinero.format(numero) : String(precio);
}

export default function App() {
  // useState guarda datos de la pantalla. Cuando cambian, React la actualiza.
  const [token, setToken] = useState('');
  const [mostrarToken, setMostrarToken] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [marca, setMarca] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('Listo para consultar.');
  const [error, setError] = useState('');
  const [codigoHttp, setCodigoHttp] = useState(null);

  // El filtro se aplica a los vehículos ya recibidos; no consulta MySQL.
  const visibles = vehiculos.filter((v) =>
    String(v.marca ?? '').toLowerCase().includes(marca.trim().toLowerCase()),
  );

  // Evento ejecutado al pulsar "Consultar vehículos".
  async function consultarVehiculos(evento) {
    evento.preventDefault(); // Evita que el navegador recargue la página.
    setCargando(true);
    setError('');
    setMensaje('Consultando la API de vehículos...');
    setCodigoHttp(null);
    setVehiculos([]); // Evita confundir una consulta fallida con datos antiguos.
    setSeleccionado(null);

    try {
      // La conexión HTTP se realiza en otro archivo, no en la interfaz.
      const resultado = await listarVehiculos(token);
      setVehiculos(resultado.vehiculos);
      setCodigoHttp(resultado.codigoHttp);
      setMensaje(`Consulta correcta: ${resultado.vehiculos.length} vehículos.`);
    } catch (e) {
      // Errores 401, 403 y red quedan visibles para el usuario.
      setCodigoHttp(e.status ?? null);
      setError(e.message);
      setMensaje('La consulta no pudo completarse.');
    } finally {
      // Se ejecuta tanto cuando fetch tiene éxito como cuando falla.
      setCargando(false);
    }
  }

  return (
    <main className="contenedor">
      <header className="cabecera">
        <div className="marca-producto">PRÁCTICA WEB · REACT + FETCH</div>
        <h1>Consulta de vehículos</h1>
        <p>Cliente web de la API REST existente en Java Spring Boot.</p>
      </header>

      <section className="panel" aria-labelledby="titulo-acceso">
        <h2 id="titulo-acceso">1. Conexión con la API</h2>
        <p className="ayuda">
          La aplicación consulta <code>GET /api/vehiculos</code> mediante el
          proxy local hacia <code>127.0.0.1:8081</code>.
        </p>

        <form onSubmit={consultarVehiculos}>
          <label htmlFor="jwt">Token JWT de Postman (sin escribir Bearer)</label>
          <div className="linea-token">
            <input
              id="jwt"
              type={mostrarToken ? 'text' : 'password'}
              autoComplete="off"
              spellCheck="false"
              placeholder="Pegar token JWT obtenido previamente"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="secundario"
              type="button"
              onClick={() => setMostrarToken((actual) => !actual)}
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
              onClick={() => {
                setToken('');
                setMostrarToken(false);
              }}
            >
              Limpiar token
            </button>
          </div>
        </form>

        <div className={error ? 'estado estado-error' : 'estado estado-ok'} role="status" aria-live="polite">
          <span>{error || mensaje}</span>
          {codigoHttp !== null && <strong>HTTP {codigoHttp}</strong>}
        </div>
        <p className="nota">El JWT permanece en memoria: no se guarda en localStorage ni en archivos.</p>
      </section>

      <section className="panel" aria-labelledby="titulo-listado">
        <div className="titulo-listado">
          <div>
            <h2 id="titulo-listado">2. Catálogo de vehículos</h2>
            <p className="ayuda">Datos recibidos del backend; filtro ejecutado en el navegador.</p>
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
                <th scope="col">Precio</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((v, indice) => (
                <tr key={v.idVehiculo ?? v.id ?? indice}>
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
                  <td>{mostrarPrecio(v.precio)}</td>
                  <td>{v.estado ?? '—'}</td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td className="sin-datos" colSpan="5">
                    {cargando
                      ? 'Cargando vehículos...'
                      : vehiculos.length === 0
                      ? 'Aún no hay vehículos para mostrar. Presione Consultar vehículos.'
                      : 'No hay vehículos que coincidan con la marca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="titulo-detalle">
        <h2 id="titulo-detalle">3. Detalle del vehículo</h2>
        {seleccionado ? (
          <dl className="detalle">
            <div><dt>ID</dt><dd>{seleccionado.idVehiculo ?? seleccionado.id ?? '—'}</dd></div>
            <div><dt>Marca</dt><dd>{seleccionado.marca ?? '—'}</dd></div>
            <div><dt>Modelo</dt><dd>{seleccionado.modelo ?? '—'}</dd></div>
            <div><dt>Precio</dt><dd>{mostrarPrecio(seleccionado.precio)}</dd></div>
            <div><dt>Estado</dt><dd>{seleccionado.estado ?? '—'}</dd></div>
          </dl>
        ) : (
          <p className="ayuda">Después de consultar, seleccione el ID de una fila para ver sus datos.</p>
        )}
      </section>
    </main>
  );
}
