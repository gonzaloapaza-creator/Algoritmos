'use strict';
const { crearContexto, cargar, evaluar, prueba, cierto, igual, lanza, informe } = require('./cargar');

const almacen = new Map();
let escrituras = 0, denegarEscritura = false;
const ctx = crearContexto();
ctx.localStorage = {
  getItem: clave => almacen.has(clave) ? almacen.get(clave) : null,
  setItem: (clave, valor) => { if (denegarEscritura) throw new Error('Cuota de prueba'); almacen.set(clave, valor); escrituras++; }
};
cargar(ctx, ['js/config.js', 'js/grafos/modelo.js', 'js/comun/guardados.js']);
const clave = evaluar(ctx, 'CLAVE_TRABAJOS');
const datos = () => ({ version: 1, modulo: 'dijkstra', grafo: ctx.crearEjemploGrafo('dijkstra'), origen: 'n1', resuelto: false });
const trabajo = (id, nombre) => ({ id, nombre, modulo: 'dijkstra', fecha: '2026-11-08T12:00:00.000Z', datos: datos() });

prueba('H-05: homónimos de 60 caracteres sobreviven importaciones, sufijos de dos cifras y recarga', () => {
  const nombre = 'X'.repeat(60);
  let biblioteca = [trabajo('original', nombre)];
  const original = JSON.stringify(biblioteca);
  for (let i = 2; i <= 15; i++) {
    const documento = { version: 1, modulo: 'dijkstra', trabajos: [trabajo('importado', nombre.toLowerCase())] };
    const r = ctx.fusionarTrabajosImportados(biblioteca, documento, 'dijkstra');
    cierto(r.ok); igual(r.agregados, 1);
    const esperado = 'x'.repeat(60 - (' (' + i + ')').length) + ' (' + i + ')';
    igual(r.trabajos[r.trabajos.length - 1].nombre, esperado);
    cierto(r.trabajos.every(t => t.nombre.length <= 60 && ctx.esTrabajoValido(t)));
    igual(new Set(r.trabajos.map(t => t.nombre.toLowerCase())).size, r.trabajos.length);
    ctx.escribirTrabajos(r.trabajos);
    biblioteca = ctx.leerTrabajos();
    igual(biblioteca.length, i);
  }
  igual(JSON.stringify([biblioteca[0]]), original);
});

prueba('Nombre libre verifica también colisiones preexistentes con el prefijo truncado', () => {
  const base = 'Z'.repeat(60);
  const lista = [trabajo('a', base), trabajo('b', 'z'.repeat(56) + ' (2)'), trabajo('c', 'Z'.repeat(56) + ' (3)')];
  igual(ctx.nombreLibreTrabajo(lista, 'dijkstra', base), 'Z'.repeat(56) + ' (4)');
  igual(ctx.nombreLibreTrabajo([], 'dijkstra', '  Prueba  '), 'Prueba');
  lanza(() => ctx.nombreLibreTrabajo([], 'dijkstra', ' '.repeat(60)));
});

prueba('El registro y el contenedor se validan antes de escribir; se conserva el texto anterior', () => {
  ctx.escribirTrabajos([trabajo('ok', 'Conservado')]);
  const original = almacen.get(clave), antes = escrituras;
  for (const lista of [[trabajo('x', 'a'.repeat(61))], [trabajo('x', 'Uno'), trabajo('x', 'Dos')], { trabajos: [] }, [null]]) {
    lanza(() => ctx.escribirTrabajos(lista));
    igual(almacen.get(clave), original); igual(escrituras, antes);
  }
  const registro = trabajo('x', 'Antes');
  registro.toJSON = () => trabajo('x', 'a'.repeat(61));
  lanza(() => ctx.escribirTrabajos([registro]));
  igual(almacen.get(clave), original); igual(escrituras, antes);
});

prueba('Fallo de almacenamiento y protección conservan la biblioteca anterior', () => {
  const original = almacen.get(clave);
  denegarEscritura = true;
  lanza(() => ctx.escribirTrabajos([trabajo('nuevo', 'Nuevo')]));
  denegarEscritura = false;
  igual(almacen.get(clave), original);
  ctx.permiteEscrituraGuardado = () => false;
  lanza(() => ctx.escribirTrabajos([trabajo('nuevo', 'Nuevo')]));
  igual(almacen.get(clave), original);
  delete ctx.permiteEscrituraGuardado;
});

prueba('Importación incompatible y nombre inválido no alteran la lista activa', () => {
  const lista = [trabajo('activo', 'Activo')], anterior = JSON.stringify(lista);
  cierto(!ctx.fusionarTrabajosImportados(lista, { version: 1, modulo: 'dijkstra', trabajos: [trabajo('malo', 'a'.repeat(61))] }, 'dijkstra').ok);
  cierto(!ctx.insertarTrabajo(lista, 'dijkstra', 'a'.repeat(61), datos()).ok);
  cierto(!ctx.renombrarTrabajo(lista, 'activo', ' ').ok);
  igual(JSON.stringify(lista), anterior);
});

prueba('Insertar y renombrar nombres válidos preservan IDs, copias y límite de contenedor', () => {
  const lista = [trabajo('activo', 'Activo')];
  const insercion = ctx.insertarTrabajo(lista, 'dijkstra', '  Segundo  ', datos());
  cierto(insercion.ok); igual(insercion.trabajos[1].nombre, 'Segundo');
  const cambio = ctx.renombrarTrabajo(insercion.trabajos, 'activo', '  Renombrado  ');
  cierto(cambio.ok); igual(cambio.trabajos[0].id, 'activo'); igual(cambio.trabajos[0].nombre, 'Renombrado');
  igual(lista[0].nombre, 'Activo');
  const exceso = Array.from({ length: 1001 }, (_, i) => trabajo('id-' + i, 'T' + i));
  cierto(!ctx.validarContenedorTrabajos(exceso).ok);
});

process.exitCode = informe('FASE 2 · biblioteca común (solo trabajos Dijkstra)') ? 0 : 1;
