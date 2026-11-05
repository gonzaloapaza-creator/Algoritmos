/* Preparación local reproducible, sin dependencias, red ni lectura de .env. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const RAIZ = path.resolve(__dirname, '..');
// Lista deliberada: no recorrer la raíz ni incorporar guardados o respaldos.
const PUBLICOS = [
  'index.html', 'johnson.html', 'dijkstra.html', 'kruskal.html', 'asignacion.html',
  'northwest.html', 'ordenamiento.html', 'arboles.html', 'styles.css', 'app.js',
  'css/arboles.css', 'css/asignacion.css', 'css/asistente.css', 'css/ciudad.css',
  'css/grafos.css', 'css/impresion.css', 'css/johnson.css', 'css/northwest.css',
  'css/ordenamiento.css', 'css/shell.css',
  'js/acciones.js', 'js/almacenamiento.js', 'js/biblioteca.js', 'js/config.js',
  'js/deshacer.js', 'js/dibujo.js', 'js/dijkstra.js', 'js/estado.js',
  'js/interaccion.js', 'js/interfaz.js', 'js/johnson.js', 'js/matriz.js',
  'js/modal.js', 'js/zoom.js',
  'js/arboles/app.js', 'js/arboles/dibujo.js', 'js/arboles/estado.js',
  'js/arboles/modelo.js', 'js/arboles/reconstruccion.js', 'js/arboles/validacion.js',
  'js/asignacion/app.js', 'js/asignacion/estado.js', 'js/asignacion/grafo.js',
  'js/asignacion/hungaro.js', 'js/asignacion/matriz.js', 'js/asignacion/modelo.js',
  'js/asignacion/procedimiento.js', 'js/asignacion/resultado.js', 'js/asignacion/validacion.js',
  'js/comun/asistente-contexto.js', 'js/comun/asistente-motor.js', 'js/comun/asistente.js', 'js/comun/catalogo.js',
  'js/comun/conocimiento/base.js', 'js/comun/conocimiento/fundamentos.js', 'js/comun/conocimiento/algoritmos-grafos.js',
  'js/comun/conocimiento/algoritmos-tablas.js', 'js/comun/conocimiento/algoritmos-datos.js', 'js/comun/conocimiento/aplicacion.js',
  'js/comun/conocimiento/diagnostico.js', 'js/comun/conocimiento/ejercicio.js',
  'js/comun/ciudad.js', 'js/comun/dialogo.js', 'js/comun/exportarImagen.js',
  'js/comun/guardados.js', 'js/comun/impresion.js', 'js/comun/inicio.js',
  'js/comun/intro.js', 'js/comun/navegacion.js', 'js/comun/notificaciones.js',
  'js/comun/presentacion.js', 'js/comun/tema.js', 'js/comun/utilidades.js',
  'js/grafos/algoritmos.js', 'js/grafos/app.js', 'js/grafos/editor.js', 'js/grafos/modelo.js',
  'js/johnson/ejemplos.js', 'js/johnson/vistas.js',
  'js/northwest/app.js', 'js/northwest/balanceo.js', 'js/northwest/estado.js',
  'js/northwest/modelo.js', 'js/northwest/noroeste.js', 'js/northwest/tabla.js', 'js/northwest/validacion.js',
  'js/ordenamiento/algoritmos.js', 'js/ordenamiento/app.js',
  'js/ordenamiento/dibujo.js', 'js/ordenamiento/estado.js'
];

function destinoSeguro(base, relativo) {
  const destino = path.resolve(base, relativo);
  if (!destino.startsWith(path.resolve(base) + path.sep)) throw new Error('Ruta fuera del directorio de salida.');
  return destino;
}
function escribir(base, nombre, datos) {
  const destino = destinoSeguro(base, nombre);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, datos);
}
function leer(base, nombre) {
  const archivo = destinoSeguro(base, nombre);
  if (fs.lstatSync(archivo).isSymbolicLink()) throw new Error('No se empaquetan enlaces: ' + nombre);
  return fs.readFileSync(archivo);
}
function inventario(base, prefijo = '') {
  if (fs.lstatSync(base).isSymbolicLink()) throw new Error('El directorio de salida no puede ser un enlace.');
  return fs.readdirSync(path.join(base, prefijo), { withFileTypes: true }).flatMap(e => {
    const nombre = prefijo + e.name;
    if (e.isSymbolicLink()) throw new Error('No se empaquetan enlaces: ' + nombre);
    return e.isDirectory() ? inventario(base, nombre + '/') : [nombre];
  });
}
function verificarPublico(base) {
  const permitidos = new Set(PUBLICOS);
  const reales = inventario(base);
  for (const nombre of reales) if (!permitidos.has(nombre)) throw new Error('Archivo público inesperado: ' + nombre);
  for (const nombre of PUBLICOS) {
    const texto = leer(base, nombre).toString('utf8');
    if (/AIza[0-9A-Za-z_-]{25,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(texto)) {
      throw new Error('Posible credencial detectada en ' + nombre);
    }
    if (/\/api\/(?:asistente|estado)|gemini|\.netlify\/functions|netlify\/functions/i.test(texto)) {
      throw new Error('Dependencia de asistente remoto en ' + nombre);
    }
    if (nombre.endsWith('.html')) {
      if ((texto.match(/src="js\/comun\/asistente\.js"/g) || []).length !== 1) throw new Error('Integración duplicada o ausente: ' + nombre);
      const scripts = Array.from(texto.matchAll(/<script src="([^"]+)"/g), m => m[1]);
      const dependencias = ['js/config.js', 'js/comun/utilidades.js', 'js/comun/asistente-contexto.js']
        .concat(PUBLICOS.filter(n => n.startsWith('js/comun/conocimiento/')), 'js/comun/asistente-motor.js', 'js/comun/asistente.js');
      let anterior = -1;
      for (const dependencia of dependencias) {
        const posicion = scripts.indexOf(dependencia);
        if (scripts.filter(s => s === dependencia).length !== 1 || posicion <= anterior) throw new Error('Orden o duplicado de ' + dependencia + ' en ' + nombre);
        anterior = posicion;
      }
      for (const m of texto.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
        if (/^(?:[a-z]+:|\/\/)/i.test(m[1])) continue;
        const recurso = path.posix.normalize(path.posix.join(path.posix.dirname(nombre), m[1]));
        if (!permitidos.has(recurso)) throw new Error('Recurso fuera del paquete: ' + recurso);
      }
    }
  }
  return reales.length;
}

// ZIP estándar (Deflate, CRC32, nombres UTF-8); cada entrada proviene de la lista explícita.
const CRC = Array.from({ length: 256 }, (_, i) => {
  let valor = i;
  for (let bit = 0; bit < 8; bit++) valor = (valor >>> 1) ^ (valor & 1 ? 0xedb88320 : 0);
  return valor >>> 0;
});
function crc32(datos) {
  let valor = 0xffffffff;
  for (const byte of datos) valor = CRC[(valor ^ byte) & 255] ^ (valor >>> 8);
  return (valor ^ 0xffffffff) >>> 0;
}
function zip(archivo, entradas) {
  const partes = [], central = [];
  let offset = 0;
  for (const [nombre, datos] of entradas) {
    if (/(?:^|\/)(?:\.env(?:\.|$)|\.git(?:\/|$)|node_modules|tests|logs|docs)(?:\/|$)/.test(nombre)) throw new Error('Archivo prohibido: ' + nombre);
    const n = Buffer.from(nombre), comprimido = zlib.deflateRawSync(datos), crc = crc32(datos);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18); local.writeUInt32LE(datos.length, 22); local.writeUInt16LE(n.length, 26);
    partes.push(local, n, comprimido);
    const ficha = Buffer.alloc(46);
    ficha.writeUInt32LE(0x02014b50); ficha.writeUInt16LE(20, 4); ficha.writeUInt16LE(20, 6); ficha.writeUInt16LE(0x800, 8);
    ficha.writeUInt16LE(8, 10); ficha.writeUInt16LE(0x21, 14); ficha.writeUInt32LE(crc, 16);
    ficha.writeUInt32LE(comprimido.length, 20); ficha.writeUInt32LE(datos.length, 24); ficha.writeUInt16LE(n.length, 28); ficha.writeUInt32LE(offset, 42);
    central.push(ficha, n);
    offset += local.length + n.length + comprimido.length;
  }
  const indice = Buffer.concat(central), fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50); fin.writeUInt16LE(entradas.length, 8); fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(indice.length, 12); fin.writeUInt32LE(offset, 16);
  fs.writeFileSync(archivo, Buffer.concat([...partes, indice, fin]));
  return fs.statSync(archivo).size;
}

// Se retiran solo salidas antiguas conocidas. No se borra ni recorre su contenido.
function retirarPaquetesAntiguos(entrega) {
  const base = fs.realpathSync.native(entrega);
  const archivo = path.join(base, 'OBSOLETO_GEMINI_NO_PUBLICAR');
  if (fs.existsSync(archivo) && (fs.lstatSync(archivo).isSymbolicLink() || fs.realpathSync.native(archivo) !== archivo)) {
    throw new Error('El archivo de paquetes obsoletos debe ser una carpeta local.');
  }
  fs.mkdirSync(archivo, { recursive: true });
  for (const nombre of ['ciudad-algoritmos-funciones.zip', 'proyecto-completo', '.vinculo-cli-proyecto-completo']) {
    const origen = destinoSeguro(base, nombre);
    if (!fs.existsSync(origen)) continue;
    // Verificar las rutas absolutas reales antes de mover una carpeta completa.
    if (fs.lstatSync(origen).isSymbolicLink() || !fs.realpathSync.native(origen).startsWith(base + path.sep)) {
      throw new Error('No se mueve una salida que apunte fuera de entrega-netlify.');
    }
    let destino = destinoSeguro(archivo, nombre);
    if (fs.existsSync(destino)) destino = destinoSeguro(archivo, nombre + '.anterior-' + Date.now());
    if (!destino.startsWith(base + path.sep)) throw new Error('Destino de archivo obsoleto fuera de la entrega.');
    fs.renameSync(origen, destino);
    console.log('Paquete anterior archivado como OBSOLETO: ' + nombre);
  }
  escribir(archivo, 'NO_PUBLICAR.txt', 'OBSOLETO: NO PUBLICAR\n\nEstos paquetes anteriores dependían de Gemini y no contienen la conversión local actual. Se conservan solo como respaldo. Publica únicamente ../drop o ../ciudad-algoritmos-netlify.zip. Cualquier vínculo CLI antiguo a proyecto-completo también está obsoleto.\n');
  escribir(base, 'PUBLICAR_SOLO_DROP.txt', 'Paquete vigente\n\nArrastra únicamente drop al apartado Deploys del proyecto existente. ciudad-algoritmos-netlify.zip contiene los mismos archivos y debe extraerse primero. No publiques OBSOLETO_GEMINI_NO_PUBLICAR, public, la raíz del proyecto ni vínculos CLI antiguos.\n');
}

function preparar() {
  const publico = path.join(RAIZ, 'public');
  const fuentes = fs.existsSync(path.join(RAIZ, 'index.html'));
  if (fuentes) {
    // Rechaza contenido ajeno antes de actualizar una salida que ya exista.
    if (fs.existsSync(publico)) {
      const extras = inventario(publico).filter(n => !PUBLICOS.includes(n));
      if (extras.length) throw new Error('public contiene archivos ajenos; revísalos antes de construir.');
    }
    for (const nombre of PUBLICOS) escribir(publico, nombre, leer(RAIZ, nombre));
  }
  const cantidad = verificarPublico(publico);
  console.log('public listo: ' + cantidad + ' archivos públicos, sin servidor ni .env.');
  if (process.argv.includes('--solo-publico')) return;
  if (!fuentes) throw new Error('Para regenerar la entrega, usa el proyecto original.');

  const entrega = path.join(RAIZ, 'entrega-netlify');
  fs.mkdirSync(entrega, { recursive: true });
  const estaticos = PUBLICOS.map(n => [n, leer(publico, n)]);
  // También las carpetas arrastrables deben estar limpias en regeneraciones.
  // Se rechaza contenido ajeno sin eliminar archivos del usuario.
  for (const [carpeta, entradas] of [['drop', estaticos]]) {
    const salida = path.join(entrega, carpeta);
    const permitidos = new Set(entradas.map(([n]) => n));
    if (fs.existsSync(salida) && inventario(salida).some(n => !permitidos.has(n))) {
      throw new Error(carpeta + ' contiene archivos ajenos; revísalos antes de regenerar la entrega.');
    }
  }
  for (const [n, datos] of estaticos) escribir(path.join(entrega, 'drop'), n, datos);
  retirarPaquetesAntiguos(entrega);
  const bytes = zip(path.join(entrega, 'ciudad-algoritmos-netlify.zip'), estaticos);
  console.log('ciudad-algoritmos-netlify.zip: ' + estaticos.length + ' archivos, ' + bytes + ' bytes.');
  const manifiesto = {
    tipo: 'Sitio estático con Algo local; publicar únicamente drop o el ZIP estático.',
    drop: estaticos.map(([n, d]) => ({ archivo: n, bytes: d.length }))
  };
  escribir(entrega, 'CONTENIDO.json', JSON.stringify(manifiesto, null, 2) + '\n');
}

if (require.main === module) {
  try { preparar(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { PUBLICOS, verificarPublico };
