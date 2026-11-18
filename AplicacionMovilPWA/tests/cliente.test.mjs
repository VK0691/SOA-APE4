import test from 'node:test';
import assert from 'node:assert/strict';
import { listarVehiculos, normalizarToken } from '../public/api.js';

// Los datos de estas pruebas son simulados y no sustituyen a la API real.
test('normaliza un token pegado con prefijo Bearer', () => {
  assert.equal(normalizarToken('  bearer abc.def.ghi  '), 'abc.def.ghi');
});

test('GET transmite Authorization y recibe una lista JSON', async () => {
  let solicitud;
  const simularFetch = async (ruta, opciones) => {
    solicitud = { ruta, opciones };
    return new Response(JSON.stringify([{ idVehiculo: 1, marca: 'Ejemplo' }]), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  const resultado = await listarVehiculos('mi.token', simularFetch);
  assert.equal(solicitud.ruta, '/api/vehiculos');
  assert.equal(solicitud.opciones.headers.get('Authorization'), 'Bearer mi.token');
  assert.equal(solicitud.opciones.cache, 'no-store');
  assert.equal(resultado.vehiculos.length, 1);
});

test('sin token no agrega Authorization (el backend decide 401)', async () => {
  const simularFetch = async (_ruta, opciones) => {
    assert.equal(opciones.headers.has('Authorization'), false);
    return new Response('[]', { status: 200 });
  };
  await listarVehiculos('', simularFetch);
});

test('identifica HTTP 401 sin mostrar una lista inventada', async () => {
  await assert.rejects(
    listarVehiculos('vencido', async () => new Response('No autorizado', { status: 401 })),
    (error) => error.codigoHttp === 401 && /401/.test(error.message),
  );
});

test('rechaza un objeto en lugar del arreglo JSON contratado', async () => {
  await assert.rejects(
    listarVehiculos('jwt', async () => new Response('{"data":[]}', { status: 200 })),
    /arreglo JSON/,
  );
});

test('informa error de conectividad', async () => {
  await assert.rejects(
    listarVehiculos('jwt', async () => { throw new Error('sin red'); }),
    /conectar/,
  );
});
