/**
 * Como la PWA utiliza JavaScript nativo, compilar equivale a preparar
 * sus archivos estáticos para un servidor HTTPS de producción.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const origen = resolve('public');
const destino = resolve('dist');
await stat(resolve(origen, 'index.html')); // Verifica que existe el proyecto.
await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
await cp(origen, destino, { recursive: true });
console.log('Compilación completada: archivos publicados en dist/');
console.log('Vista previa local: npm run preview');
