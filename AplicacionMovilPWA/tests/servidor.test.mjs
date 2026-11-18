import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { crearServidor } from '../server.mjs';

// Prueba de integración local: dos servidores de prueba en puertos aleatorios.
test('proxy reenvía Bearer y respuesta HTTP del backend', async () => {
  let jwt = '';
  const backend = createServer((req, res) => {
    jwt = req.headers.authorization;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('[]');
  });
  backend.listen(0, '127.0.0.1'); await once(backend, 'listening');
  const port = backend.address().port;
  const frontend = crearServidor({ apiBase: `http://127.0.0.1:${port}` });
  frontend.listen(0, '127.0.0.1'); await once(frontend, 'listening');
  try {
    const respuesta = await fetch(`http://127.0.0.1:${frontend.address().port}/api/vehiculos`, {
      headers: { Authorization: 'Bearer prueba.jwt' },
    });
    assert.equal(respuesta.status, 200);
    assert.equal(jwt, 'Bearer prueba.jwt');
    assert.equal(respuesta.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await respuesta.json(), []);
  } finally {
    await new Promise((r) => frontend.close(r));
    await new Promise((r) => backend.close(r));
  }
});
