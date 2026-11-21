/**
 * Servidor de desarrollo local sin dependencias externas.
 * Sirve la PWA y actua como proxy hacia NGINX (puerto 8090).
 * La PWA es el UNICO cliente autorizado a registrar ventas.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// Rutas que se reenvian a NGINX (port 8090)
const RUTAS_PROXY = [
  '/oauth/token',
  '/api/vehiculos',
  '/api/compradores',
  '/api/ventas',
];

export function crearServidor({
  directorio = resolve(ROOT, 'public'),
  apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:8090',
} = {}) {
  const carpeta = resolve(directorio);

  return createServer(async (peticion, respuesta) => {
    const url = new URL(peticion.url || '/', 'http://localhost');
    respuesta.setHeader('X-Content-Type-Options', 'nosniff');
    respuesta.setHeader('Referrer-Policy', 'no-referrer');
    respuesta.setHeader('Cache-Control', 'no-store');

    const esRutaProxy = RUTAS_PROXY.some(r => url.pathname === r || url.pathname.startsWith(r + '/'));

    if (esRutaProxy) {
      const abortador = new AbortController();
      const temporizador = setTimeout(() => abortador.abort(), 15000);
      try {
        const urlRemota = `${apiBase.replace(/\/$/, '')}${url.pathname}${url.search}`;
        const encabezados = {
          'Content-Type': peticion.headers['content-type'] || 'application/json',
          'Accept': 'application/json',
        };
        if (peticion.headers['authorization']) {
          encabezados['Authorization'] = peticion.headers['authorization'];
        }
        if (peticion.headers['idempotency-key']) {
          encabezados['Idempotency-Key'] = peticion.headers['idempotency-key'];
        }

        let cuerpo;
        if (peticion.method === 'POST' || peticion.method === 'PUT') {
          cuerpo = await new Promise((res, rej) => {
            const partes = [];
            peticion.on('data', c => partes.push(c));
            peticion.on('end', () => res(Buffer.concat(partes)));
            peticion.on('error', rej);
          });
        }

        const remoto = await fetch(urlRemota, {
          method: peticion.method,
          headers: encabezados,
          body: cuerpo,
          signal: abortador.signal,
          cache: 'no-store',
        });

        const contentType = remoto.headers.get('content-type') || 'application/json; charset=utf-8';
        respuesta.writeHead(remoto.status, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          'Vary': 'Authorization',
        });
        respuesta.end(Buffer.from(await remoto.arrayBuffer()));
      } catch (error) {
        const tiempoAgotado = error.name === 'AbortError';
        respuesta.writeHead(tiempoAgotado ? 504 : 502, { 'Content-Type': 'application/json; charset=utf-8' });
        respuesta.end(JSON.stringify({ error: tiempoAgotado ? 'Tiempo de espera agotado' : 'NGINX no disponible' }));
      } finally {
        clearTimeout(temporizador);
      }
      return;
    }

    if (peticion.method !== 'GET' && peticion.method !== 'HEAD') {
      respuesta.writeHead(405); respuesta.end(); return;
    }

    let ruta;
    try { ruta = decodeURIComponent(url.pathname); }
    catch { respuesta.writeHead(400); respuesta.end(); return; }
    const archivo = resolve(carpeta, '.' + (ruta === '/' ? '/index.html' : ruta));
    if (!(archivo === carpeta || archivo.startsWith(carpeta + sep))) {
      respuesta.writeHead(403); respuesta.end(); return;
    }
    try {
      const detalle = await stat(archivo);
      if (!detalle.isFile()) throw new Error('no es archivo');
      respuesta.setHeader('Content-Type', TIPOS[extname(archivo)] || 'application/octet-stream');
      if (peticion.method === 'HEAD') { respuesta.writeHead(200); respuesta.end(); return; }
      respuesta.writeHead(200);
      respuesta.end(await readFile(archivo));
    } catch {
      respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      respuesta.end('Recurso no encontrado');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argPuerto = process.argv.find(a => a.startsWith('--port='));
  const argCarpeta = process.argv.find(a => a.startsWith('--dir='));
  const puerto = Number(argPuerto?.split('=')[1] || process.env.PORT || 5174);
  const host = process.env.HOST || '127.0.0.1';
  const carpeta = resolve(ROOT, argCarpeta?.split('=')[1] || 'public');
  crearServidor({ directorio: carpeta }).listen(puerto, host, () => {
    console.log(`PWA disponible: http://localhost:${puerto}`);
    console.log(`Proxy hacia NGINX: http://127.0.0.1:8090`);
    console.log('Para cerrar: Ctrl + C');
  });
}
