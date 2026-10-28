'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');

/* localStorage mínimo en memoria para probar leer/escribir sin navegador. */
function crearAlmacen() {
  const datos = {};
  return {
    getItem: k => (Object.prototype.hasOwnProperty.call(datos, k) ? datos[k] : null),
    setItem: (k, v) => { datos[k] = String(v); },
    removeItem: k => { delete datos[k]; },
    _datos: datos
  };
}

const contexto = crearContexto();
contexto.localStorage = crearAlmacen();
const ctx = cargar(contexto, ['js/config.js', 'js/grafos/modelo.js', 'js/comun/utilidades.js', 'js/comun/guardados.js']);

const {
  depurarListaTrabajos, validarNombreTrabajo, nombreLibreTrabajo, insertarTrabajo, renombrarTrabajo,
  eliminarTrabajo, exportarTrabajos, fusionarTrabajosImportados, resumenTrabajo, leerTrabajos, escribirTrabajos
} = ctx;
const MAX = evaluar(ctx, 'MAX_TRABAJOS_POR_MODULO');
const CLAVE = evaluar(ctx, 'CLAVE_TRABAJOS');

const fecha = new Date('2026-01-02T03:04:05Z');
const trabajo = (extra) => Object.assign({ id: 'id1', nombre: 'Uno', modulo: 'johnson', fecha: fecha.toISOString(), datos: { grafo: { nodos: [1, 2], conexiones: [1] } } }, extra);

prueba('depurarListaTrabajos descarta entradas malformadas y módulos desconocidos', () => {
  const lista = [trabajo(), null, 5, { id: 1 }, trabajo({ modulo: 'otro' }), trabajo({ datos: null }), trabajo({ id: 'id2', nombre: 'Dos' })];
  igual(depurarListaTrabajos(lista).map(t => t.id), ['id1', 'id2']);
  igual(depurarListaTrabajos('nada'), []);
});

prueba('validarNombreTrabajo recorta espacios y acota la longitud', () => {
  igual(validarNombreTrabajo('  Clase 1 '), { ok: true, valor: 'Clase 1' });
  igual(validarNombreTrabajo('   ').ok, false);
  igual(validarNombreTrabajo(null).ok, false);
  igual(validarNombreTrabajo('x'.repeat(61)).ok, false);
  igual(validarNombreTrabajo('x'.repeat(60)).ok, true);
});

prueba('nombreLibreTrabajo añade sufijos sin distinguir mayúsculas y por módulo', () => {
  const lista = [trabajo({ nombre: 'Clase' }), trabajo({ id: 'b', nombre: 'clase (2)' }), trabajo({ id: 'c', nombre: 'Clase', modulo: 'arboles' })];
  igual(nombreLibreTrabajo(lista, 'johnson', 'CLASE'), 'CLASE (3)');
  igual(nombreLibreTrabajo(lista, 'johnson', 'Otra'), 'Otra');
  igual(nombreLibreTrabajo(lista, 'northwest', 'Clase'), 'Clase');
});

prueba('insertarTrabajo crea, reemplaza por nombre (sin distinguir mayúsculas) y copia los datos', () => {
  const datos = { grafo: { nodos: [], conexiones: [] } };
  const r1 = insertarTrabajo([], 'johnson', 'Mi grafo', datos, fecha);
  cierto(r1.ok && !r1.reemplazo && r1.trabajos.length === 1);
  igual(r1.trabajos[0].fecha, fecha.toISOString());
  cierto(r1.trabajos[0].datos !== datos, 'los datos se copian');
  datos.grafo.nodos.push('x');
  igual(r1.trabajos[0].datos.grafo.nodos, [], 'modificar el original no afecta al guardado');

  const r2 = insertarTrabajo(r1.trabajos, 'johnson', 'MI GRAFO', { grafo: { nodos: [1], conexiones: [] } });
  cierto(r2.ok && r2.reemplazo, 'reemplaza');
  igual(r2.trabajos.length, 1);
  igual(r2.id, r1.id, 'conserva el id al reemplazar');
  igual(r2.trabajos[0].nombre, 'MI GRAFO', 'toma el nombre nuevo');

  const r3 = insertarTrabajo(r2.trabajos, 'arboles', 'MI GRAFO', { modo: 'busqueda', secuencia: [] });
  cierto(r3.ok && !r3.reemplazo && r3.trabajos.length === 2, 'el mismo nombre en otro módulo no reemplaza');
});

prueba('insertarTrabajo respeta el máximo por módulo pero permite reemplazar', () => {
  let lista = [];
  for (let i = 0; i < MAX; i++) lista = insertarTrabajo(lista, 'johnson', 'T' + i, { a: i }).trabajos;
  igual(lista.length, MAX);
  igual(insertarTrabajo(lista, 'johnson', 'Uno más', { a: 1 }).ok, false, 'rechaza el exceso');
  cierto(insertarTrabajo(lista, 'johnson', 'T3', { a: 99 }).ok, 'reemplazar sigue permitido');
  cierto(insertarTrabajo(lista, 'arboles', 'Otro módulo', { a: 1 }).ok, 'el límite es por módulo');
});

prueba('renombrarTrabajo cambia el nombre y evita duplicados en el módulo', () => {
  const lista = [trabajo(), trabajo({ id: 'id2', nombre: 'Dos' }), trabajo({ id: 'id3', nombre: 'Dos', modulo: 'arboles' })];
  const ok = renombrarTrabajo(lista, 'id1', 'Nuevo');
  cierto(ok.ok);
  igual(ok.trabajos.find(t => t.id === 'id1').nombre, 'Nuevo');
  igual(lista[0].nombre, 'Uno', 'no muta la lista original');
  igual(renombrarTrabajo(lista, 'id1', 'dos').ok, false, 'choca con otro del mismo módulo');
  cierto(renombrarTrabajo(lista, 'id1', 'Uno').ok, 'renombrar al mismo nombre es válido');
  igual(renombrarTrabajo(lista, 'nada', 'X').ok, false, 'id inexistente');
});

prueba('eliminarTrabajo quita solo el id indicado', () => {
  const lista = [trabajo(), trabajo({ id: 'id2' })];
  igual(eliminarTrabajo(lista, 'id1').map(t => t.id), ['id2']);
  igual(eliminarTrabajo(lista, 'zzz').length, 2);
});

prueba('exportarTrabajos filtra por módulo y produce copias', () => {
  const lista = [trabajo(), trabajo({ id: 'id2', modulo: 'arboles', datos: { modo: 'busqueda', secuencia: [1] } })];
  const doc = exportarTrabajos(lista, 'johnson', fecha);
  igual(doc.version, 1);
  igual(doc.tipo, 'trabajos');
  igual(doc.modulo, 'johnson');
  igual(doc.fecha, fecha.toISOString());
  igual(doc.trabajos.map(t => t.id), ['id1']);
  cierto(doc.trabajos[0] !== lista[0] && doc.trabajos[0].datos !== lista[0].datos, 'copias profundas');
});

prueba('fusionarTrabajosImportados acepta solo el módulo actual, renueva ids y evita colisiones de nombre', () => {
  const actual = [trabajo({ nombre: 'Clase' })];
  const doc = { version: 1, tipo: 'trabajos', modulo: 'johnson', trabajos: [
    trabajo({ id: 'id1', nombre: 'Clase' }),
    trabajo({ id: 'id9', nombre: 'Examen', fecha: 'fecha rota' }),
    trabajo({ id: 'id8', nombre: 'Ajeno', modulo: 'arboles' }),
    { basura: true }
  ] };
  const r = fusionarTrabajosImportados(actual, doc, 'johnson');
  cierto(r.ok);
  igual(r.agregados, 2);
  igual(r.omitidos, 0);
  igual(r.trabajos.length, 3);
  const nombres = r.trabajos.map(t => t.nombre).sort();
  igual(nombres, ['Clase', 'Clase (2)', 'Examen']);
  cierto(r.trabajos.every((t, i, arr) => arr.findIndex(x => x.id === t.id) === i), 'ids únicos');
  cierto(r.trabajos.slice(1).every(t => t.id !== 'id1' && t.id !== 'id9'), 'ids importados se renuevan');
  cierto(!Number.isNaN(new Date(r.trabajos.find(t => t.nombre === 'Examen').fecha).getTime()), 'repara fechas inválidas');
  igual(actual.length, 1, 'no muta la lista original');
});

prueba('fusionarTrabajosImportados: errores, lista cruda y límite por módulo', () => {
  igual(fusionarTrabajosImportados([], { nada: 1 }, 'johnson').ok, false);
  igual(fusionarTrabajosImportados([], { trabajos: [trabajo({ modulo: 'arboles' })] }, 'johnson').ok, false, 'sin trabajos del módulo');
  cierto(fusionarTrabajosImportados([], [trabajo()], 'johnson').ok, 'acepta un arreglo directo');
  let lista = [];
  for (let i = 0; i < MAX - 1; i++) lista = insertarTrabajo(lista, 'johnson', 'T' + i, { a: i }).trabajos;
  const r = fusionarTrabajosImportados(lista, [trabajo({ id: 'a', nombre: 'A' }), trabajo({ id: 'b', nombre: 'B' })], 'johnson');
  igual(r.agregados, 1);
  igual(r.omitidos, 1);
  igual(r.trabajos.length, MAX);
});

prueba('Mis trabajos rechaza versiones futuras antes de fusionar o aplicar datos', () => {
  const actual = [trabajo()];
  const antes = JSON.stringify(actual);
  cierto(!fusionarTrabajosImportados(actual, { version: 99, trabajos: [trabajo()] }, 'johnson').ok);
  igual(JSON.stringify(actual), antes);
  ['johnson', 'asignacion', 'northwest'].forEach(modulo => {
    lanza(() => ctx.aplicarTrabajoNombrado(trabajo({ modulo, datos: { version: 99 } })));
  });
});

prueba('Un trabajo inválido de Johnson, Asignación o Northwest conserva el ejercicio activo', () => {
  const contexto = crearContexto();
  cargar(contexto, ['js/config.js', 'js/comun/utilidades.js', 'js/almacenamiento.js',
    'js/asignacion/validacion.js', 'js/asignacion/modelo.js', 'js/northwest/validacion.js',
    'js/northwest/modelo.js', 'js/comun/guardados.js']);
  contexto.estado = { nodos: [{ id: 'actual', nombre: 'Actual', x: 10, y: 10 }], conexiones: [], siguienteId: 2 };
  contexto.estadoAsignacion = { modelo: contexto.ejemploAsignacion(), resultado: { total: 26 }, historial: { pasado: ['conservado'] } };
  contexto.estadoNorthwest = { modelo: contexto.ejemploNorthwest('balanceado'), resultado: { total: 230 } };
  const antes = JSON.stringify([contexto.estado, contexto.estadoAsignacion, contexto.estadoNorthwest]);
  const grafo = { nodos: [{ id: 'n', nombre: 'Uno', x: 0, y: 0 }, { id: 'n', nombre: 'Dos', x: 1, y: 1 }], conexiones: [] };
  const asignacion = contexto.ejemploAsignacion(); asignacion.valores['inexistente|inexistente'] = 1;
  const northwest = contexto.ejemploNorthwest('balanceado'); northwest.origenes[0].oferta = -1;
  const casos = [
    ['johnson', { grafo }, 'grafo guardado no es válido'],
    ['asignacion', { modelo: asignacion }, 'matriz guardada no es válida'],
    ['northwest', { modelo: northwest }, 'transporte guardados no son válidos']
  ];
  casos.forEach(([modulo, datos, mensaje]) => {
    let error;
    try { contexto.aplicarTrabajoNombrado(trabajo({ modulo, datos })); } catch (e) { error = e; }
    cierto(error && error.message.includes(mensaje), 'Debe rechazar por validación: ' + modulo);
    igual(JSON.stringify([contexto.estado, contexto.estadoAsignacion, contexto.estadoNorthwest]), antes);
  });
});

prueba('resumenTrabajo describe cada módulo y tolera datos incompletos', () => {
  igual(resumenTrabajo(trabajo()), '2 nodos · 1 conexión');
  igual(resumenTrabajo({ modulo: 'ordenamiento', datos: { algoritmo: 'merge', valores: [1, 2, 3] } }), 'Merge Sort · 3 pinos');
  igual(resumenTrabajo({ modulo: 'arboles', datos: { modo: 'busqueda', secuencia: [1] } }), '1 nodo');
  igual(resumenTrabajo({ modulo: 'asignacion', datos: { modelo: { recursos: [1], tareas: [1, 2] } } }), '1 recurso · 2 tareas');
  igual(resumenTrabajo({ modulo: 'northwest', datos: { modelo: { origenes: [1, 2], destinos: [1] } } }), '2 orígenes · 1 destino');
  igual(resumenTrabajo({ modulo: 'johnson', datos: {} }), '');
  igual(resumenTrabajo({ modulo: 'dijkstra', datos: { grafo: { dirigido: true, nodos: [1, 2], conexiones: [1] } } }), '2 vértices · 1 arista · Dirigido');
  igual(resumenTrabajo({ modulo: 'kruskal', datos: { objetivo: 'max', grafo: { nodos: [1], conexiones: [] } } }), '1 vértice · 0 aristas · Máximo');
});

function documentoGrafo(modulo) {
  const grafo = ctx.crearEjemploGrafo(modulo);
  return { version: 1, modulo, grafo, origen: grafo.nodos[0].id, destino: null,
    objetivo: 'min', vista: 'procedimiento', paso: 2, resuelto: true };
}

prueba('Dijkstra y Kruskal se guardan como trabajos separados con el mismo nombre', () => {
  let lista = [];
  ['dijkstra', 'kruskal'].forEach(modulo => {
    const insertado = insertarTrabajo(lista, modulo, 'Mi red', documentoGrafo(modulo), fecha);
    cierto(insertado.ok);
    lista = insertado.trabajos;
  });
  igual(depurarListaTrabajos(lista).map(t => t.modulo), ['dijkstra', 'kruskal']);
  igual(exportarTrabajos(lista, 'dijkstra').trabajos.map(t => t.modulo), ['dijkstra']);
  igual(exportarTrabajos(lista, 'kruskal').trabajos.map(t => t.modulo), ['kruskal']);
});

prueba('La biblioteca de grafos valida todos los documentos antes de fusionar', () => {
  ['dijkstra', 'kruskal'].forEach(modulo => {
    const datos = documentoGrafo(modulo);
    const bueno = trabajo({ modulo, datos });
    const malo = JSON.parse(JSON.stringify(bueno));
    malo.id = 'malo'; malo.nombre = 'Roto';
    malo.datos.grafo.nodos[1].id = malo.datos.grafo.nodos[0].id;
    const actual = [trabajo()];
    const antes = JSON.stringify(actual);
    const resultado = fusionarTrabajosImportados(actual, { version: 1, tipo: 'trabajos', modulo, trabajos: [bueno, malo] }, modulo);
    cierto(!resultado.ok && resultado.error.includes('repetido'));
    igual(JSON.stringify(actual), antes, 'No inserta parcialmente la biblioteca');
    cierto(fusionarTrabajosImportados(actual, { version: 1, modulo, trabajos: [bueno] }, modulo).ok);
    cierto(!fusionarTrabajosImportados(actual, { version: 1, modulo: 'otro', trabajos: [bueno] }, modulo).ok);
    malo.datos = documentoGrafo(modulo === 'dijkstra' ? 'kruskal' : 'dijkstra');
    cierto(!fusionarTrabajosImportados(actual, [malo], modulo).ok, 'Rechaza sobre de otro algoritmo');
    if (modulo === 'dijkstra') {
      malo.datos = documentoGrafo(modulo); malo.datos.grafo.conexiones[0].valor = -1;
      cierto(!fusionarTrabajosImportados(actual, [malo], modulo).ok, 'Rechaza negativos también al importar trabajos');
    }
  });
});

prueba('El puente de grafos valida antes de aplicar y respeta el módulo abierto', () => {
  const contexto = crearContexto();
  cargar(contexto, ['js/config.js', 'js/grafos/modelo.js', 'js/comun/guardados.js']);
  contexto.estado = { nodos: [{ id: 'johnson-previo' }] };
  contexto.moduloGrafo = { modulo: 'dijkstra', grafo: { actual: true }, reproduciendo: false };
  let aplicados = 0;
  contexto.aplicarDocumentoModuloGrafo = datos => { aplicados++; contexto.moduloGrafo.grafo = datos.grafo; };
  contexto.serializarModuloGrafo = () => documentoGrafo('dijkstra');
  const antes = JSON.stringify([contexto.estado, contexto.moduloGrafo]);
  const negativo = documentoGrafo('dijkstra'); negativo.grafo.conexiones[0].valor = -1;
  lanza(() => contexto.aplicarTrabajoNombrado(trabajo({ modulo: 'dijkstra', datos: negativo })));
  lanza(() => contexto.aplicarTrabajoNombrado(trabajo({ modulo: 'kruskal', datos: documentoGrafo('kruskal') })));
  lanza(() => contexto.instantaneaTrabajoActual('kruskal'));
  igual(JSON.stringify([contexto.estado, contexto.moduloGrafo]), antes);
  igual(aplicados, 0);
  const instantanea = contexto.instantaneaTrabajoActual('dijkstra');
  igual(instantanea.modulo, 'dijkstra');
  cierto(instantanea.resuelto && instantanea.paso === 2);
  contexto.aplicarTrabajoNombrado(trabajo({ modulo: 'dijkstra', datos: instantanea }));
  igual(aplicados, 1);
  igual(contexto.estado.nodos, [{ id: 'johnson-previo' }]);
});

prueba('leerTrabajos/escribirTrabajos usan la clave de config y toleran JSON corrupto', () => {
  igual(leerTrabajos(), []);
  escribirTrabajos([trabajo(), { malo: true }]);
  igual(JSON.parse(contexto.localStorage.getItem(CLAVE)).length, 2, 'escribe tal cual');
  igual(leerTrabajos().length, 1, 'al leer se depura');
  contexto.localStorage.setItem(CLAVE, '{no es json');
  igual(leerTrabajos(), []);
});

prueba('Autoguardado: un fallo de escritura avisa una sola vez, la sesión sigue y el estado se limpia al volver a escribir', () => {
  const { escribirAlmacenamientoLocal } = ctx;
  const estadoAlm = evaluar(ctx, 'estadoAlmacenamientoLocal');
  const avisos = [];
  contexto.notificar = (texto, tipo) => avisos.push(tipo + ': ' + texto);
  const almacenReal = contexto.localStorage;
  let fallar = true;
  contexto.localStorage = {
    getItem: almacenReal.getItem,
    removeItem: almacenReal.removeItem,
    setItem: (k, v) => { if (fallar) throw new Error('QuotaExceededError'); almacenReal.setItem(k, v); }
  };
  try {
    igual(escribirAlmacenamientoLocal('prueba.clave', '1'), false);
    igual(escribirAlmacenamientoLocal('prueba.clave', '2'), false);
    cierto(estadoAlm.fallando, 'Debe quedar marcado el fallo');
    igual(avisos, [], 'Sin DOM no hay toast por cada edición ni aviso de éxito falso');
    fallar = false;
    igual(escribirAlmacenamientoLocal('prueba.clave', '3'), true);
    cierto(!estadoAlm.fallando, 'Una escritura posterior con éxito limpia el estado de error');
    igual(almacenReal.getItem('prueba.clave'), '3');
    igual(avisos, ['ok: El guardado local volvió a funcionar.']);
    igual(escribirAlmacenamientoLocal('prueba.clave', '4'), true);
    igual(avisos.length, 1, 'El aviso de recuperación se muestra solo al salir del fallo');
  } finally {
    contexto.localStorage = almacenReal;
    almacenReal.removeItem('prueba.clave');
    delete contexto.notificar;
  }
});

prueba('El aviso visible de autoguardado se conserva sin duplicados y se retira al recuperarse', () => {
  const contexto = crearContexto();
  const visibles = [];
  let creados = 0;
  let fallar = true;
  contexto.document = {
    getElementById: () => ({ prepend: aviso => visibles.push(aviso) }),
    createElement: () => {
      creados++;
      return { atributos: {}, setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
        remove() { visibles.splice(visibles.indexOf(this), 1); } };
    }
  };
  contexto.localStorage = { setItem: () => { if (fallar) throw new Error('QuotaExceededError'); } };
  cargar(contexto, ['js/comun/utilidades.js']);
  contexto.escribirAlmacenamientoLocal('ejercicio', '1', { respaldo: 'exporta JSON' });
  contexto.escribirAlmacenamientoLocal('ejercicio', '2');
  igual(creados, 1);
  igual(visibles.length, 1);
  igual(visibles[0].atributos.role, 'alert');
  cierto(visibles[0].textContent.includes('exporta JSON'));
  fallar = false;
  contexto.escribirAlmacenamientoLocal('ejercicio', '3');
  igual(visibles.length, 0);
  cierto(!evaluar(contexto, 'estadoAlmacenamientoLocal.fallando'));
});

process.exit(informe('Guardados') ? 0 : 1);
