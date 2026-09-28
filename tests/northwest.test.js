'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');

const ctx = cargar(crearContexto(), [
  'js/config.js',
  'js/northwest/validacion.js',
  'js/northwest/modelo.js',
  'js/northwest/balanceo.js',
  'js/northwest/noroeste.js'
]);

const {
  resolverEsquinaNoroeste, balancearNorthwest, modeloNorthwestDesdeMatrices, ejemploNorthwest,
  validarCostoNorthwest, validarCantidadNorthwest, validarEtiquetaNorthwest, formatearCostoNorthwest,
  validarModeloNorthwest, depurarModeloNorthwest, agregarOrigen, agregarDestino, fijarCostoNorthwest,
  eliminarElementoNorthwest, crearModeloNorthwest, firmaModeloNorthwest
} = ctx;
const EJEMPLOS_NORTHWEST = evaluar(ctx, 'EJEMPLOS_NORTHWEST');

const escalar = m => m.map(f => f.map(v => Math.round(v * 100)));

function resolverDesde(costos, ofertas, demandas) {
  const modelo = modeloNorthwestDesdeMatrices(costos, ofertas, demandas);
  const v = validarModeloNorthwest(modelo);
  cierto(v.ok, 'Modelo inválido: ' + v.errores.join(' '));
  const b = balancearNorthwest(modelo);
  const r = resolverEsquinaNoroeste(b.costos, b.ofertas, b.demandas);
  cierto(r.verificacion.ok, 'Verificación fallida: ' + JSON.stringify(r.verificacion));
  return { b, r };
}

prueba('Ejemplo de la consigna: asignaciones y costo 230', () => {
  const { r } = resolverDesde([[2, 3, 1], [5, 4, 8]], [20, 30], [10, 25, 15]);
  igual(r.asignaciones, [[10, 10, 0], [0, 15, 15]]);
  igual(r.costoTotal, 230 * 100);
  igual(r.variablesBasicas, 4);
  igual(r.degenerado, false);
  igual(r.pasos.length, 4);
  igual(r.pasos[0].operacion, 'min(20, 10) = 10');
  igual(r.pasos[0].movimiento, 'derecha');
  igual(r.pasos[1].movimiento, 'abajo');
});

prueba('Cambiar solo los costos conserva las cantidades asignadas', () => {
  const a = resolverDesde([[2, 3, 1], [5, 4, 8]], [20, 30], [10, 25, 15]).r;
  const b = resolverDesde([[9, 1, 7], [1, 9, 2]], [20, 30], [10, 25, 15]).r;
  igual(a.asignaciones, b.asignaciones);
  cierto(a.costoTotal !== b.costoTotal);
});

prueba('Exceso de oferta: destino ficticio absorbe la diferencia con costo 0', () => {
  const { b, r } = resolverDesde([[8, 6, 10], [9, 12, 13], [14, 9, 16]], [35, 50, 40], [45, 20, 30]);
  igual(b.ficticio.tipo, 'destino');
  igual(b.ficticio.cantidad, 30);
  igual(b.demandas, [45, 20, 30, 30]);
  igual(b.costos.map(f => f[3]), [0, 0, 0]);
  igual(r.asignaciones[2][3], 30);
  igual(r.asignaciones.length, 3);
});

prueba('Exceso de demanda: origen ficticio con costo 0', () => {
  const { b, r } = resolverDesde([[4.5, 2.25, 3], [6, 3.75, 5.5]], [40, 35], [30, 30, 30]);
  igual(b.ficticio.tipo, 'origen');
  igual(b.ficticio.cantidad, 15);
  igual(b.ofertas, [40, 35, 15]);
  igual(b.costos[2], [0, 0, 0]);
  igual(r.asignaciones[2], [0, 0, 15]);
  // 30×4.5 + 10×2.25 + 20×3.75 + 15×5.5 = 135 + 22.5 + 75 + 82.5 = 315
  igual(r.costoTotal, 31500);
  igual(formatearCostoNorthwest(r.costoTotal), '315');
});

prueba('Balanceado no agrega ficticios y el balanceo no toca el modelo', () => {
  const modelo = ejemploNorthwest('balanceado');
  const antes = JSON.stringify(modelo);
  const b = balancearNorthwest(modelo);
  igual(b.ficticio, null);
  igual(JSON.stringify(modelo), antes);
  // Rebalancear no acumula.
  const b2 = balancearNorthwest(modelo);
  igual(b2.destinos.length, 3);
});

prueba('Degeneración: agotamiento simultáneo genera 0 básico y base de m+n−1 sin ciclos', () => {
  const { r } = resolverDesde([[3, 1, 7], [2, 6, 5], [8, 3, 3]], [20, 10, 30], [20, 10, 30]);
  igual(r.degenerado, true);
  igual(r.variablesBasicas, 5);
  igual(r.positivas, 3);
  igual(r.basicasCero, 2);
  cierto(r.verificacion.sinCiclos);
  cierto(r.pasos.some(p => p.simultaneo));
  cierto(r.pasos.some(p => p.basicaCero));
  igual(r.asignaciones, [[20, 0, 0], [0, 10, 0], [0, 0, 30]]);
});

prueba('Ceros en oferta y demanda no provocan bucles', () => {
  const { r } = resolverDesde([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [0, 10, 5], [5, 0, 10]);
  igual(r.verificacion.filasOk, true);
  igual(r.verificacion.columnasOk, true);
  igual(r.variablesBasicas, 5);
  igual(r.asignaciones[0], [0, 0, 0]);
});

prueba('Caso trivial: todo cero', () => {
  const { b, r } = resolverDesde([[1, 2], [3, 4]], [0, 0], [0, 0]);
  igual(b.trivial, true);
  igual(r.costoTotal, 0);
  igual(r.asignaciones, [[0, 0], [0, 0]]);
  igual(r.variablesBasicas, 3);
});

prueba('1×1, 1×N y M×1', () => {
  igual(resolverDesde([[5]], [7], [7]).r.asignaciones, [[7]]);
  igual(resolverDesde([[5]], [7], [7]).r.costoTotal, 3500);
  const fila = resolverDesde([[1, 2, 3, 4]], [10], [1, 2, 3, 4]).r;
  igual(fila.asignaciones, [[1, 2, 3, 4]]);
  igual(fila.variablesBasicas, 4);
  const col = resolverDesde([[1], [2], [3]], [1, 2, 3], [6]).r;
  igual(col.asignaciones, [[1], [2], [3]]);
  igual(col.variablesBasicas, 3);
});

prueba('Tamaño máximo 10×10 (+ ficticio) con valores grandes dentro del rango seguro', () => {
  const costos = Array.from({ length: 10 }, (_, i) => Array.from({ length: 10 }, (_, j) => 999999 - i - j));
  const ofertas = new Array(10).fill(999999);
  const demandas = new Array(10).fill(999998);
  const { b, r } = resolverDesde(costos, ofertas, demandas);
  igual(b.ficticio.tipo, 'destino');
  igual(b.ficticio.cantidad, 10);
  igual(b.destinos.length, 11);
  igual(r.variablesBasicas, 10 + 11 - 1);
  cierto(Number.isSafeInteger(r.costoTotal));
});

prueba('Rechaza problemas no balanceados o con datos inválidos', () => {
  lanza(() => resolverEsquinaNoroeste([[1, 2]], [5], [1, 2]));
  lanza(() => resolverEsquinaNoroeste([[1]], [-1], [-1]));
  lanza(() => resolverEsquinaNoroeste([[1.5]], [1], [1]));
});

/* ---------------- Validación ---------------- */
prueba('validarCostoNorthwest: coma o punto, hasta 2 decimales, escala ×100', () => {
  igual(validarCostoNorthwest('2,75').valor, 275);
  igual(validarCostoNorthwest('2.75').valor, 275);
  igual(validarCostoNorthwest('2.5').valor, 250);
  igual(validarCostoNorthwest('0').valor, 0);
  igual(validarCostoNorthwest('999999').valor, 99999900);
  igual(validarCostoNorthwest(''), { ok: true, valor: null });
  igual(validarCostoNorthwest('1000000').ok, false);
  igual(validarCostoNorthwest('2.755').ok, false);
  igual(validarCostoNorthwest('-1').ok, false);
  ['12abc', '1.234,5', '1,234.5', '1e3', 'NaN', 'Infinity', 'abc', '1 2'].forEach(t => igual(validarCostoNorthwest(t).ok, false, 'Debe rechazar «' + t + '»'));
});

prueba('validarCantidadNorthwest: enteros ≥ 0, rechaza fracciones y negativos', () => {
  igual(validarCantidadNorthwest('0').valor, 0);
  igual(validarCantidadNorthwest('999999').valor, 999999);
  igual(validarCantidadNorthwest('').valor, null);
  igual(validarCantidadNorthwest('1000000').ok, false);
  igual(validarCantidadNorthwest('-3').ok, false);
  igual(validarCantidadNorthwest('2.5').ok, false);
  igual(validarCantidadNorthwest('2,5').ok, false);
  igual(validarCantidadNorthwest('abc').ok, false);
});

prueba('validarEtiquetaNorthwest: recorta, límite 40, repetidos', () => {
  igual(validarEtiquetaNorthwest('  Planta  ').valor, 'Planta');
  igual(validarEtiquetaNorthwest('x'.repeat(41)).ok, false);
  igual(validarEtiquetaNorthwest('x'.repeat(40)).ok, true);
  igual(validarEtiquetaNorthwest('').ok, false);
  igual(validarEtiquetaNorthwest('a', [{ id: 'o_1', nombre: 'A' }]).ok, false);
});

prueba('formatearCostoNorthwest', () => {
  igual(formatearCostoNorthwest(275), '2.75');
  igual(formatearCostoNorthwest(250), '2.5');
  igual(formatearCostoNorthwest(200), '2');
  igual(formatearCostoNorthwest(5), '0.05');
  igual(formatearCostoNorthwest(0), '0');
});

/* ---------------- Modelo ---------------- */
prueba('Modelo: pendientes bloquean la validación; ficticios no se guardan', () => {
  const m = crearModeloNorthwest();
  const o = agregarOrigen(m, null, 5), d = agregarDestino(m, null, 3);
  const v1 = validarModeloNorthwest(m);
  igual(v1.ok, false);
  fijarCostoNorthwest(m, o.id, d.id, 100);
  igual(validarModeloNorthwest(m).ok, true);
  const b = balancearNorthwest(m);
  igual(b.ficticio.tipo, 'destino');
  igual(m.destinos.length, 1);
});

prueba('Modelo: eliminar borra costos; límite 10; depurar descarta huérfanos', () => {
  const m = crearModeloNorthwest();
  for (let i = 0; i < 10; i++) cierto(agregarOrigen(m) !== null);
  igual(agregarOrigen(m), null);
  const d = agregarDestino(m);
  fijarCostoNorthwest(m, m.origenes[0].id, d.id, 100);
  eliminarElementoNorthwest(m, d.id);
  igual(Object.keys(m.costos).length, 0);
  const dep = depurarModeloNorthwest({ origenes: [{ id: 'o_1', nombre: 'A', oferta: 5 }], destinos: [{ id: 'd_2', nombre: 'B', demanda: -1 }], costos: { 'o_1|d_2': 5, 'o_9|d_2': 1 } });
  igual(dep.destinos[0].demanda, null);
  igual(dep.costos, { 'o_1|d_2': 5 });
  igual(dep.siguienteId, 3);
});

prueba('Firma cambia con costos/ofertas/demandas, no con nombres', () => {
  const m = ejemploNorthwest('balanceado');
  const f = firmaModeloNorthwest(m);
  m.origenes[0].nombre = 'Otro';
  igual(firmaModeloNorthwest(m), f);
  m.origenes[0].oferta = 21;
  cierto(firmaModeloNorthwest(m) !== f);
});

prueba('Todos los ejemplos precargados se resuelven y verifican', () => {
  EJEMPLOS_NORTHWEST.forEach(e => {
    const { r } = resolverDesde(e.costos, e.ofertas, e.demandas);
    cierto(r.verificacion.ok, 'Ejemplo ' + e.id);
  });
});

prueba('Barrido aleatorio: 300 problemas verifican sumas, base y costo', () => {
  let semilla = 777;
  const azar = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  for (let k = 0; k < 300; k++) {
    const m = 1 + Math.floor(azar() * 10), n = 1 + Math.floor(azar() * 10);
    const costos = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.round(azar() * 5000) / 100));
    const ofertas = Array.from({ length: m }, () => Math.floor(azar() * 8) === 0 ? 0 : Math.floor(azar() * 50));
    const demandas = Array.from({ length: n }, () => Math.floor(azar() * 8) === 0 ? 0 : Math.floor(azar() * 50));
    const { r } = resolverDesde(costos, ofertas, demandas);
    cierto(r.verificacion.ok);
  }
});

process.exitCode = informe('Northwest') ? 0 : 1;
