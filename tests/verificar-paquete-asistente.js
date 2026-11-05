/* Integridad de la entrega estática: CRC, contenido idéntico y exclusiones.
 * Ejecutar después de npm.cmd run preparar:netlify. No lee archivos privados. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { PUBLICOS, verificarPublico } = require('../scripts/preparar-netlify');
const raiz = path.resolve(__dirname, '..');
const drop = path.join(raiz, 'entrega-netlify/drop');
assert.equal(verificarPublico(drop), PUBLICOS.length);
const zip = fs.readFileSync(path.join(raiz, 'entrega-netlify/ciudad-algoritmos-netlify.zip'));
const crc = datos => {
  let n = 0xffffffff;
  for (const b of datos) {
    n ^= b;
    for (let bit = 0; bit < 8; bit++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  }
  return (n ^ 0xffffffff) >>> 0;
};
let offset = 0;
const nombres = [];
while (zip.readUInt32LE(offset) === 0x04034b50) {
  assert.equal(zip.readUInt16LE(offset + 8), 8, 'Compresión Deflate');
  const comprimidos = zip.readUInt32LE(offset + 18), bytes = zip.readUInt32LE(offset + 22);
  const largo = zip.readUInt16LE(offset + 26), extra = zip.readUInt16LE(offset + 28);
  const nombre = zip.subarray(offset + 30, offset + 30 + largo).toString('utf8');
  assert.ok(PUBLICOS.includes(nombre), 'Solo archivos públicos: ' + nombre);
  const inicio = offset + 30 + largo + extra;
  const datos = zlib.inflateRawSync(zip.subarray(inicio, inicio + comprimidos));
  assert.equal(datos.length, bytes, nombre + ': tamaño');
  assert.equal(crc(datos), zip.readUInt32LE(offset + 14), nombre + ': CRC');
  for (const carpeta of ['', 'public', 'entrega-netlify/drop']) {
    assert.deepEqual(datos, fs.readFileSync(path.join(raiz, carpeta, nombre)), nombre + ': versión vigente en ' + (carpeta || 'fuente'));
  }
  assert.ok(!/\/api\/(?:asistente|estado)|gemini|\.netlify\/functions|netlify\/functions/i.test(datos.toString('utf8')), nombre + ': sin dependencia remota');
  nombres.push(nombre); offset = inicio + comprimidos;
}
assert.equal(zip.readUInt32LE(offset), 0x02014b50, 'Directorio central del ZIP');
assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50, 'Fin del ZIP');
assert.equal(zip.readUInt16LE(zip.length - 12), PUBLICOS.length, 'Cantidad en el directorio central');
assert.deepEqual(nombres, PUBLICOS, 'Lista exacta; sin archivos privados, .env, pruebas o capturas');
assert.ok(nombres.includes('index.html'), 'index.html en la raíz');
console.log('Paquete verificado: ' + nombres.length + ' archivos; CRC correcto y ZIP = drop = public = fuentes. Sin API, proveedor, Functions ni archivos privados.');
