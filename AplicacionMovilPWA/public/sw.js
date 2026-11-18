/**
 * Service Worker: permite abrir la interfaz instalada sin red.
 * Por seguridad NUNCA intercepta /api, Authorization ni las respuestas JSON.
 * Para publicar cambios, se actualiza el sufijo de la versión del caché.
 */
const VERSION = 'vehiculos-pwa-v1';
const RECURSOS = [
  '/', '/index.html', '/styles.css', '/main.js', '/api.js',
  '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(RECURSOS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) => Promise.all(
      nombres.filter((nombre) => nombre !== VERSION).map((nombre) => caches.delete(nombre)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const solicitud = evento.request;
  const url = new URL(solicitud.url);
  if (solicitud.method !== 'GET' || url.origin !== self.location.origin) return;

  // Los datos protegidos se obtienen siempre en línea; no se guardan.
  if (url.pathname.startsWith('/api/')) return;

  // Al navegar, se intenta obtener una versión nueva; sin conexión, la pantalla almacenada.
  if (solicitud.mode === 'navigate') {
    evento.respondWith(fetch(solicitud).catch(async () => (
      (await caches.match('/index.html')) || Response.error()
    )));
    return;
  }

  // Solo recursos estáticos declarados se almacenan para habilitar el inicio sin red.
  if (RECURSOS.includes(url.pathname)) {
    evento.respondWith(caches.match(solicitud).then((guardado) => guardado || fetch(solicitud)));
  }
});
