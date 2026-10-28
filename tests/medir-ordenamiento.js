'use strict';

/* Benchmark breve, determinista y sin dependencias. Ejecutar:
 * node --expose-gc tests/medir-ordenamiento.js [--json]
 * heapDelta es memoria retenida medida por V8 tras GC; puede variar por JIT/GC.
 * estimacionBytes es una estimación conservadora del grafo de objetos real:
 * 32 B por objeto, 24 B por array, 8 B por propiedad/elemento, 24+2*l por string.
 * Detecta referencias compartidas. No representa un máximo universal del navegador.
 */
const os = require('os');
const v8 = require('v8');
const { execFileSync } = require('child_process');
const { performance } = require('perf_hooks');
const { crearContexto, cargar } = require('./cargar');
const ctx = cargar(crearContexto(), ['js/ordenamiento/algoritmos.js']);

function estimarBytes(raiz) {
  const vistos = new WeakSet();
  function contar(valor) {
    if (typeof valor === 'string') return 24 + valor.length * 2;
    if (!valor || typeof valor !== 'object') return 8;
    if (vistos.has(valor)) return 0;
    vistos.add(valor);
    return (Array.isArray(valor) ? 24 : 32) + Object.keys(valor).reduce((suma, clave) => suma + 8 + contar(valor[clave]), 0);
  }
  return contar(raiz);
}

const filas = [];
function medirCaso(cantidad, caso, metodo, valores) {
  if (global.gc) global.gc();
  const memoriaInicio = process.memoryUsage().heapUsed;
  const inicio = performance.now();
  const registro = ctx.ejecutarOrdenamientoCompacto(metodo, valores);
  const tiempoMs = +(performance.now() - inicio).toFixed(2);
  if (global.gc) global.gc();
  const heapDelta = process.memoryUsage().heapUsed - memoriaInicio;
  const fin = ctx.obtenerPasoOrdenamiento(registro, registro.eventos.length - 1);
  if (JSON.stringify(fin.arreglo.map(p => p.valor)) !== JSON.stringify(valores.slice().sort((a, b) => a - b))) throw new Error('Resultado incorrecto');
  return { cantidad, caso, metodo, tiempoMs, eventos: registro.eventos.length, checkpoints: registro.checkpoints.length, estimacionBytes: estimarBytes(registro), heapDelta: global.gc ? heapDelta : null, serializadoV8Bytes: v8.serialize(registro).byteLength };
}
// Un proceso por caso evita que referencias transitorias de otro caso o su JIT
// contaminen el delta retenido. 45 casos pequeños; ninguna búsqueda de máximo.
if (process.argv.includes('--caso')) {
  const { cantidad, caso, metodo, valores } = JSON.parse(process.argv[process.argv.indexOf('--caso') + 1]);
  console.log(JSON.stringify(medirCaso(cantidad, caso, metodo, valores)));
  process.exit(0);
}
for (const cantidad of [40, 100, 200]) {
  const ascendente = Array.from({ length: cantidad }, (_, i) => 1 + Math.floor(i * 98 / Math.max(1, cantidad - 1)));
  const casos = { ordenado: ascendente, inverso: ascendente.slice().reverse(), repetidos: Array.from({ length: cantidad }, (_, i) => 1 + ((i * 37 + 11) % 7)) };
  for (const [caso, valores] of Object.entries(casos)) {
    for (const metodo of ['selection', 'insertion', 'bubble', 'shell', 'merge']) {
      filas.push(JSON.parse(execFileSync(process.execPath, ['--expose-gc', __filename, '--caso', JSON.stringify({ cantidad, caso, metodo, valores })], { encoding: 'utf8', windowsHide: true })));
    }
  }
}
const resultado = { entorno: { node: process.version, plataforma: os.platform(), arquitectura: os.arch(), cpu: os.cpus()[0].model, gc: !!global.gc }, estimacion: 'Objetos32B, arrays24B, slots8B, strings24+2*longitud; referencias compartidas contadas una vez. Heap retenido medido tras GC y serialización V8 medidos por separado.', filas };
if (process.argv.includes('--json')) console.log(JSON.stringify(resultado, null, 2));
else {
  console.log(resultado.entorno, resultado.estimacion);
  console.table(filas.map(f => ({ ...f, estimacionMiB: +(f.estimacionBytes / 1048576).toFixed(2), heapMiB: f.heapDelta == null ? null : +(f.heapDelta / 1048576).toFixed(2) })));
}
