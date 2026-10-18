'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, informe } = require('./cargar');

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
const ctx = cargar(contexto, ['js/config.js', 'js/comun/guardados.js']);

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

prueba('resumenTrabajo describe cada módulo y tolera datos incompletos', () => {
  igual(resumenTrabajo(trabajo()), '2 nodos · 1 conexión');
  igual(resumenTrabajo({ modulo: 'ordenamiento', datos: { algoritmo: 'merge', valores: [1, 2, 3] } }), 'Merge Sort · 3 pinos');
  igual(resumenTrabajo({ modulo: 'arboles', datos: { modo: 'busqueda', secuencia: [1] } }), '1 nodo');
  igual(resumenTrabajo({ modulo: 'asignacion', datos: { modelo: { recursos: [1], tareas: [1, 2] } } }), '1 recurso · 2 tareas');
  igual(resumenTrabajo({ modulo: 'northwest', datos: { modelo: { origenes: [1, 2], destinos: [1] } } }), '2 orígenes · 1 destino');
  igual(resumenTrabajo({ modulo: 'johnson', datos: {} }), '');
});

prueba('leerTrabajos/escribirTrabajos usan la clave de config y toleran JSON corrupto', () => {
  igual(leerTrabajos(), []);
  escribirTrabajos([trabajo(), { malo: true }]);
  igual(JSON.parse(contexto.localStorage.getItem(CLAVE)).length, 2, 'escribe tal cual');
  igual(leerTrabajos().length, 1, 'al leer se depura');
  contexto.localStorage.setItem(CLAVE, '{no es json');
  igual(leerTrabajos(), []);
});

process.exit(informe('Guardados') ? 0 : 1);
