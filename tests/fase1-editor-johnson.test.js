'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { crearContexto, cargar, evaluar } = require('./cargar');

// Se ejecutan las acciones, validadores y el historial reales. El dibujo, los
// avisos y las escrituras se sustituyen: esta suite no verifica navegador ni SVG.
function preparar(grafo) {
  const ctx = crearContexto();
  ctx.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  cargar(ctx, [
    'js/config.js', 'js/comun/utilidades.js', 'js/estado.js',
    'js/almacenamiento.js', 'js/deshacer.js', 'js/acciones.js', 'js/dibujo.js'
  ]);
  ctx.avisos = [];
  ctx.avisar = (mensaje, tipo) => ctx.avisos.push({ mensaje, tipo });
  ctx.ayudar = () => {};
  ctx.guardar = () => {};
  ctx.dibujar = () => {};
  ctx.dibujarLienzo = () => {};
  ctx.zoomReset = () => {};
  ctx.area = () => ({ ancho: 900, alto: 600 });
  const estado = evaluar(ctx, 'estado');
  Object.assign(estado, grafo || ejemplo());
  return { ctx, estado };
}

function ejemplo() {
  return {
    nodos: ['A', 'B', 'E', 'D'].map((nombre, i) => ({ id: nombre, nombre, x: 100 + i * 120, y: 100 + i % 2 * 180 })),
    conexiones: [['A', 'B', 58], ['A', 'E', 6], ['E', 'D', 5], ['D', 'B', 8]]
      .map(([desde, hacia, valor], i) => ({ id: 'c_' + (i + 1), desde, hacia, valor })),
    siguienteId: 5
  };
}

function copiar(valor) { return JSON.parse(JSON.stringify(valor)); }

function estadoCompleto(ctx, estado) {
  return JSON.stringify({
    grafo: ctx.instantaneaGrafo(), seleccion: estado.seleccion,
    origenConexion: estado.origenConexion, visual: estado.visualizacionJohnson,
    historial: estado.historial
  });
}

function comprobarRechazoAtomico(ctx, estado, operacion) {
  const antes = estadoCompleto(ctx, estado);
  const visual = estado.visualizacionJohnson;
  const rechazo = operacion();
  assert.equal(rechazo.ok, false);
  assert.equal(typeof rechazo.error, 'string');
  assert.ok(rechazo.error.length > 0);
  assert.equal(estadoCompleto(ctx, estado), antes);
  assert.equal(estado.visualizacionJohnson, visual);
}

test('Crear nodos conserva nombres admitidos e IDs únicos; rechazos conservan estado e historial', () => {
  const { ctx, estado } = preparar();
  const nuevo = ctx.crearNodo(300, 250, 'ABCDEFGHIJKL');
  assert.equal(nuevo.ok, true);
  assert.equal(nuevo.nodo.nombre, 'ABCDEFGHIJKL');
  assert.ok(ctx.validarGrafoImportado(ctx.instantaneaGrafo()).ok);
  assert.equal(new Set(estado.nodos.concat(estado.conexiones).map(item => item.id)).size, estado.nodos.length + estado.conexiones.length);
  for (const args of [[100, 100, 'a'], [100, 100, 'ABCDEFGHIJKLM'], [100, 100, '   '], [NaN, 100, 'Nuevo']]) {
    comprobarRechazoAtomico(ctx, estado, () => ctx.crearNodo(...args));
  }
});

test('Crear nodo 41 se rechaza sin consumir ID ni modificar historial', () => {
  const grafo = ejemplo();
  grafo.nodos = Array.from({ length: 40 }, (_, i) => ({ id: 'n_' + (i + 1), nombre: 'n' + i, x: i * 30, y: 100 }));
  grafo.conexiones = [];
  grafo.siguienteId = 41;
  const { ctx, estado } = preparar(grafo);
  comprobarRechazoAtomico(ctx, estado, () => ctx.crearNodo(100, 200, 'Extra'));
});

test('Crear o editar conexiones rechaza bucles, duplicados, inversas, extremos y pesos inválidos atómicamente', () => {
  const { ctx, estado } = preparar();
  estado.seleccion = { tipo: 'nodo', id: 'A' };
  estado.visualizacionJohnson = { firma: 'vigente', origen: 'A', destino: 'B' };
  estado.historial.futuro.push({ marca: 'futuro que un rechazo debe conservar' });
  for (const args of [
    ['A', 'A', 0], ['A', 'B', 8], ['B', 'A', 8], ['A', 'X', 0],
    ['A', 'D', 1000000], ['A', 'D', -1000000], ['A', 'D', 1.2],
    ['A', 'D', NaN], ['A', 'D', Infinity], ['A', 'D', '0'],
    ['A', 'D', 0, 'inexistente'], ['A', 'B', 58, 'c_2']
  ]) comprobarRechazoAtomico(ctx, estado, () => ctx.guardarConexionJohnson(...args));
});

test('Crear peso cero y editar a ambos límites conserva el ID; deshacer y rehacer restauran pesos', () => {
  const { ctx, estado } = preparar();
  assert.equal(ctx.guardarConexionJohnson('A', 'D', 0).ok, true);
  const id = estado.conexiones.at(-1).id;
  assert.equal(ctx.buscarConexion(id).valor, 0);
  assert.equal(ctx.guardarConexionJohnson('A', 'D', -999999, id).ok, true);
  assert.equal(ctx.buscarConexion(id).valor, -999999);
  assert.equal(ctx.guardarConexionJohnson('A', 'D', 999999, id).ok, true);
  assert.equal(ctx.buscarConexion(id).valor, 999999);
  ctx.deshacer();
  assert.equal(ctx.buscarConexion(id).valor, -999999);
  ctx.rehacer();
  assert.equal(ctx.buscarConexion(id).valor, 999999);
});

test('El límite de 300 conexiones permite editar una existente y rechaza la 301 sin cambios', () => {
  const grafo = { nodos: [], conexiones: [], siguienteId: 1 };
  for (let i = 0; i < 26; i++) grafo.nodos.push({ id: 'n' + i, nombre: 'n' + i, x: 100 + i * 30, y: 100 });
  for (let i = 0; i < 25; i++) for (let j = i + 1; j < 25; j++) {
    grafo.conexiones.push({ id: 'c' + grafo.conexiones.length, desde: 'n' + i, hacia: 'n' + j, valor: 1 });
  }
  assert.equal(grafo.conexiones.length, 300);
  const { ctx, estado } = preparar(grafo);
  assert.equal(ctx.validarGrafoImportado(ctx.instantaneaGrafo()).ok, true);
  comprobarRechazoAtomico(ctx, estado, () => ctx.guardarConexionJohnson('n0', 'n25', 0));
  assert.equal(ctx.guardarConexionJohnson('n0', 'n1', 0, 'c0').ok, true);
  assert.equal(ctx.buscarConexion('c0').valor, 0);
  assert.equal(estado.conexiones.length, 300);
});

test('Importar nombres con espacios los normaliza sin mutar el original y evita homónimos posteriores', () => {
  const { ctx, estado } = preparar();
  const documento = ejemplo();
  documento.nodos[0].nombre = ' A ';
  const original = copiar(documento);
  const validacion = ctx.validarGrafoImportado(documento);
  assert.equal(validacion.ok, true);
  assert.equal(validacion.grafo.nodos[0].nombre, 'A');
  assert.deepEqual(documento, original);
  ctx.aplicarGrafo(documento);
  comprobarRechazoAtomico(ctx, estado, () => ctx.crearNodo(100, 100, 'a'));
});

test('Importaciones incompatibles conservan ejercicio, selección, resultados e historial', () => {
  const { ctx, estado } = preparar();
  estado.seleccion = { tipo: 'nodo', id: 'B' };
  estado.visualizacionJohnson = { firma: 'vigente', origen: 'A', destino: 'B' };
  const cambios = [
    g => g.conexiones.push({ id: 'inversa', desde: 'B', hacia: 'A', valor: 1 }),
    g => g.conexiones.push({ id: 'duplicada', desde: 'A', hacia: 'B', valor: 1 }),
    g => { g.conexiones[0].hacia = 'A'; },
    g => { g.conexiones[0].hacia = 'ausente'; },
    g => { g.conexiones[0].valor = 1000000; },
    g => { g.nodos[1].nombre = ' a '; },
    g => { g.nodos[0].x = 1000001; },
    g => { g.nodos[1].id = 'A'; }
  ];
  for (const cambiar of cambios) {
    const documento = ejemplo();
    cambiar(documento);
    const antes = estadoCompleto(ctx, estado);
    assert.equal(ctx.validarGrafoImportado(documento).ok, false);
    assert.throws(() => ctx.aplicarGrafo(documento));
    assert.equal(estadoCompleto(ctx, estado), antes);
  }
});

test('Importación conserva límites 40/300 y pesos enteros positivos, negativos y cero', () => {
  const { ctx } = preparar();
  const nodos = ejemplo();
  nodos.nodos = Array.from({ length: 41 }, (_, i) => ({ id: 'n' + i, nombre: 'n' + i, x: i, y: 1 }));
  assert.equal(ctx.validarGrafoImportado(nodos).ok, false);
  const conexiones = ejemplo();
  conexiones.conexiones = Array.from({ length: 301 }, (_, i) => ({ id: 'c' + i, desde: 'A', hacia: 'B', valor: 0 }));
  assert.equal(ctx.validarGrafoImportado(conexiones).ok, false);
  for (const peso of [-999999, 0, 999999]) {
    const documento = ejemplo();
    documento.conexiones[0].valor = peso;
    assert.equal(ctx.validarGrafoImportado(documento).ok, true);
  }
  for (const peso of [-1000000, 1000000, 0.5, NaN, Infinity]) {
    const documento = ejemplo();
    documento.conexiones[0].valor = peso;
    assert.equal(ctx.validarGrafoImportado(documento).ok, false);
  }
});

test('Archivo mayor de 1 MiB se rechaza antes de leer o alterar el ejercicio', () => {
  const { ctx, estado } = preparar();
  let leidos = 0;
  ctx.FileReader = class { constructor() { leidos++; } };
  ctx.document.createElement = () => {
    const input = {};
    input.click = () => input.onchange({ target: { files: [{ size: 1024 * 1024 + 1 }] } });
    return input;
  };
  const antes = estadoCompleto(ctx, estado);
  ctx.importarGrafoJSON();
  assert.equal(leidos, 0);
  assert.equal(estadoCompleto(ctx, estado), antes);
  assert.ok(ctx.avisos.some(aviso => aviso.tipo === 'error' && aviso.mensaje.includes('1 MB')));
});

test('Los datos calculados adjuntos a un documento no forman parte del modelo importado', () => {
  const { ctx } = preparar();
  const documento = ejemplo();
  documento.distancias = [[12345]];
  documento.visualizacionJohnson = { distancia: -99999 };
  const validacion = ctx.validarGrafoImportado(documento);
  assert.equal(validacion.ok, true);
  assert.equal(Object.hasOwn(validacion.grafo, 'distancias'), false);
  assert.equal(Object.hasOwn(validacion.grafo, 'visualizacionJohnson'), false);
  assert.deepEqual(copiar(validacion.grafo.conexiones), documento.conexiones);
});

test('Organizar DAG conserva topología, nombres, selección y resultado; permite deshacer y rehacer', () => {
  const { ctx, estado } = preparar();
  estado.seleccion = { tipo: 'nodo', id: 'B' };
  const seleccion = estado.seleccion;
  estado.visualizacionJohnson = { firma: 'vigente', distancia: 19 };
  const visual = estado.visualizacionJohnson;
  const antes = copiar(ctx.instantaneaGrafo());
  assert.equal(ctx.organizarGrafoJohnson().disposicion, 'niveles');
  const organizado = copiar(ctx.instantaneaGrafo());
  for (const conexion of estado.conexiones) {
    assert.ok(ctx.buscarNodo(conexion.desde).x < ctx.buscarNodo(conexion.hacia).x);
  }
  assert.deepEqual(organizado.conexiones, antes.conexiones);
  assert.deepEqual(organizado.nodos.map(n => [n.id, n.nombre]), antes.nodos.map(n => [n.id, n.nombre]));
  assert.equal(estado.seleccion, seleccion);
  assert.equal(estado.visualizacionJohnson, visual);
  ctx.deshacer();
  assert.deepEqual(copiar(ctx.instantaneaGrafo()), antes);
  ctx.rehacer();
  assert.deepEqual(copiar(ctx.instantaneaGrafo()), organizado);
});

test('Organizar una red con ciclo conserva sus datos y produce posiciones finitas y separadas', () => {
  const grafo = ejemplo();
  grafo.conexiones.push({ id: 'c_5', desde: 'D', hacia: 'A', valor: -1 });
  const { ctx, estado } = preparar(grafo);
  const conexiones = copiar(estado.conexiones);
  assert.equal(ctx.organizarGrafoJohnson().disposicion, 'circular');
  assert.deepEqual(copiar(estado.conexiones), conexiones);
  assert.ok(estado.nodos.every(nodo => Number.isFinite(nodo.x) && Number.isFinite(nodo.y)));
  assert.equal(new Set(estado.nodos.map(nodo => nodo.x + ':' + nodo.y)).size, estado.nodos.length);
  assert.equal(ctx.validarGrafoImportado(ctx.instantaneaGrafo()).ok, true);
});

test('Eliminar un nodo confirmado elimina sus incidentes, conserva otras conexiones y permite deshacer', async () => {
  const { ctx, estado } = preparar();
  const antes = copiar(ctx.instantaneaGrafo());
  ctx.confirmar = () => Promise.resolve(true);
  estado.seleccion = { tipo: 'nodo', id: 'E' };
  ctx.eliminarSeleccion();
  await Promise.resolve();
  assert.equal(estado.nodos.some(nodo => nodo.id === 'E'), false);
  assert.equal(estado.conexiones.some(conexion => conexion.desde === 'E' || conexion.hacia === 'E'), false);
  assert.deepEqual(estado.conexiones.map(conexion => conexion.id), ['c_1', 'c_4']);
  ctx.deshacer();
  assert.deepEqual(copiar(ctx.instantaneaGrafo()), antes);
});

test('Eliminar una conexión conserva los nodos y las otras conexiones; cancelar no cambia nada', async () => {
  const { ctx, estado } = preparar();
  estado.seleccion = { tipo: 'conexion', id: 'c_1' };
  ctx.confirmar = () => Promise.resolve(false);
  const antes = estadoCompleto(ctx, estado);
  ctx.eliminarSeleccion();
  await Promise.resolve();
  assert.equal(estadoCompleto(ctx, estado), antes);
  ctx.confirmar = () => Promise.resolve(true);
  ctx.eliminarSeleccion();
  await Promise.resolve();
  assert.equal(estado.nodos.length, 4);
  assert.deepEqual(estado.conexiones.map(conexion => conexion.id), ['c_2', 'c_3', 'c_4']);
});

test('Una confirmación de borrado antigua no elimina datos del ejercicio editado mientras esperaba', async () => {
  const { ctx, estado } = preparar();
  let aceptar;
  ctx.confirmar = () => new Promise(resolver => { aceptar = resolver; });
  estado.seleccion = { tipo: 'nodo', id: 'E' };
  ctx.eliminarSeleccion();
  assert.equal(ctx.guardarConexionJohnson('A', 'D', 0).ok, true);
  const despuesDeEditar = estadoCompleto(ctx, estado);
  aceptar(true);
  await Promise.resolve();
  assert.equal(estadoCompleto(ctx, estado), despuesDeEditar);
  assert.ok(ctx.avisos.some(aviso => aviso.tipo === 'error' && aviso.mensaje.includes('grafo cambió')));
});
