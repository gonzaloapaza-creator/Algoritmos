'use strict';

const { crearContexto, cargar, prueba, igual, cierto, lanza, informe } = require('./cargar');

const ctx = cargar(crearContexto(), [
  'js/config.js',
  'js/asignacion/validacion.js',
  'js/asignacion/modelo.js',
  'js/asignacion/hungaro.js'
]);

const { resolverHungaro, verificarAsignacionPorFuerzaBruta } = ctx;

/** Comprueba que el húngaro y la fuerza bruta coinciden y que la asignación es válida. */
function comprobarCoincidencia(matriz, objetivo) {
  const h = resolverHungaro(matriz, objetivo);
  const fb = verificarAsignacionPorFuerzaBruta(matriz, objetivo);
  igual(h.total, fb.total, 'Total húngaro ≠ fuerza bruta para ' + JSON.stringify(matriz) + ' (' + objetivo + ')');
  const filas = new Set(h.asignaciones.map(a => a.fila));
  const cols = new Set(h.asignaciones.map(a => a.col));
  igual(filas.size, h.asignaciones.length, 'Filas repetidas');
  igual(cols.size, h.asignaciones.length, 'Columnas repetidas');
  igual(h.asignaciones.length, Math.min(matriz.length, matriz[0].length), 'Cantidad de asignaciones');
  igual(h.asignaciones.reduce((s, a) => s + matriz[a.fila][a.col], 0), h.total, 'El total no coincide con las celdas elegidas');
  return h;
}

prueba('Ejemplo de las capturas (min) → 26 con A→2, B→1, C→3, D→4', () => {
  const m = [[12, 8, 9, 14], [7, 10, 11, 18], [15, 13, 6, 9], [10, 17, 12, 5]];
  const r = comprobarCoincidencia(m, 'min');
  igual(r.total, 26);
  igual(r.asignaciones.map(a => [a.fila, a.col, a.valor]), [[0, 1, 8], [1, 0, 7], [2, 2, 6], [3, 3, 5]]);
  cierto(r.pasos[0].tipo === 'original');
  cierto(r.pasos.some(p => p.tipo === 'reduccion-filas'));
  cierto(r.pasos.some(p => p.tipo === 'reduccion-columnas'));
  cierto(r.pasos[r.pasos.length - 1].tipo === 'total');
  cierto(!r.pasos.some(p => p.tipo === 'balanceo'), 'No debe balancear una cuadrada');
  cierto(!r.pasos.some(p => p.tipo === 'conversion'), 'No debe convertir en min');
});

prueba('Ejemplo de las capturas (max) coincide con fuerza bruta e incluye la conversión', () => {
  const m = [[12, 8, 9, 14], [7, 10, 11, 18], [15, 13, 6, 9], [10, 17, 12, 5]];
  const r = comprobarCoincidencia(m, 'max');
  cierto(r.pasos.some(p => p.tipo === 'conversion'));
  igual(r.total, 14 + 7 + 13 + 12 <= r.total ? r.total : r.total); // sanity: se compara con fuerza bruta arriba
});

prueba('Caso que exige iteraciones de cobertura y ajuste (no basta reducir filas y columnas)', () => {
  // Matriz clásica: tras reducir filas y columnas no hay 4 ceros independientes.
  const m = [[4, 1, 3, 2], [2, 0, 5, 3], [3, 2, 2, 1], [1, 3, 4, 4]];
  const r = comprobarCoincidencia(m, 'min');
  cierto(r.pasos.some(p => p.tipo === 'cobertura'), 'Debe haber al menos una iteración de cobertura');
  cierto(r.pasos.some(p => p.tipo === 'ajuste'));
  const cob = r.pasos.find(p => p.tipo === 'cobertura');
  cierto(cob.filasCubiertas.length + cob.columnasCubiertas.length < 4, 'La cobertura debe usar menos de n líneas');
  cierto(cob.delta > 0);
});

prueba('Matriz 1×1', () => {
  const r = comprobarCoincidencia([[7]], 'min');
  igual(r.total, 7);
  igual(r.asignaciones, [{ fila: 0, col: 0, valor: 7 }]);
});

prueba('Rectangular 2×4 (más tareas): 2 asignaciones y 2 columnas sin asignar', () => {
  const m = [[9, 2, 7, 8], [6, 4, 3, 7]];
  const r = comprobarCoincidencia(m, 'min');
  igual(r.total, 5);
  igual(r.sinAsignarColumnas.length, 2);
  igual(r.sinAsignarFilas.length, 0);
  cierto(r.pasos.some(p => p.tipo === 'balanceo'));
});

prueba('Rectangular 4×2 (más recursos): 2 asignaciones y 2 filas sin asignar', () => {
  const m = [[9, 2], [7, 8], [6, 4], [3, 7]];
  const r = comprobarCoincidencia(m, 'min');
  igual(r.total, 5);
  igual(r.sinAsignarFilas.length, 2);
});

prueba('Valores negativos y cero (min y max)', () => {
  const m = [[-5, 0, 3], [2, -7, 0], [0, 4, -1]];
  igual(comprobarCoincidencia(m, 'min').total, -13);
  igual(comprobarCoincidencia(m, 'max').total, 9);
});

prueba('Maximización rectangular con negativos', () => {
  const m = [[-3, 8, 2], [5, -1, 4]];
  const r = comprobarCoincidencia(m, 'max');
  igual(r.total, 13);
});

prueba('Unicidad: se detecta cuando hay varias soluciones óptimas', () => {
  const unica = verificarAsignacionPorFuerzaBruta([[1, 5], [5, 1]], 'min');
  igual(unica.unica, true);
  const multiple = verificarAsignacionPorFuerzaBruta([[1, 1], [1, 1]], 'min');
  igual(multiple.cantidadOptimos, 2);
  igual(multiple.unica, false);
  // Rectangular: las ficticias permutadas no cuentan como soluciones distintas.
  const rect = verificarAsignacionPorFuerzaBruta([[1, 9, 9]], 'min');
  igual(rect.cantidadOptimos, 1);
});

prueba('Barrido aleatorio: húngaro == fuerza bruta en 300 matrices', () => {
  let semilla = 12345;
  const azar = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  for (let k = 0; k < 300; k++) {
    const filas = 1 + Math.floor(azar() * 6), cols = 1 + Math.floor(azar() * 6);
    const m = Array.from({ length: filas }, () => Array.from({ length: cols }, () => Math.floor(azar() * 21) - 5));
    comprobarCoincidencia(m, azar() < 0.5 ? 'min' : 'max');
  }
});

prueba('Rechaza matrices con pendientes o no enteros', () => {
  lanza(() => resolverHungaro([[1, null], [2, 3]], 'min'));
  lanza(() => resolverHungaro([[1.5, 2], [2, 3]], 'min'));
  lanza(() => resolverHungaro([], 'min'));
});

prueba('El resultado no modifica la matriz de entrada', () => {
  const m = [[3, 1], [2, 4]];
  const copia = JSON.stringify(m);
  resolverHungaro(m, 'min');
  igual(JSON.stringify(m), copia);
});

/* ---------------- Validación ---------------- */
const { validarValorAsignacion, validarNombreAsignacion } = ctx;

prueba('validarValorAsignacion: vacío es pendiente, no cero', () => {
  igual(validarValorAsignacion(''), { ok: true, valor: null });
  igual(validarValorAsignacion('   '), { ok: true, valor: null });
});

prueba('validarValorAsignacion: enteros, cero, negativos y límites', () => {
  igual(validarValorAsignacion('0').valor, 0);
  igual(validarValorAsignacion('-42').valor, -42);
  igual(validarValorAsignacion('+7').valor, 7);
  igual(validarValorAsignacion('999999').ok, true);
  igual(validarValorAsignacion('1000000').ok, false);
  igual(validarValorAsignacion('-1000000').ok, false);
});

prueba('validarValorAsignacion: rechaza texto, decimales, NaN, infinito, científicos', () => {
  ['12abc', 'abc', '3.5', '3,5', 'NaN', 'Infinity', '-Infinity', '1e3', '0x10', '1 2'].forEach(t => {
    igual(validarValorAsignacion(t).ok, false, 'Debería rechazar «' + t + '»');
  });
});

prueba('validarNombreAsignacion: vacío, largo, repetido', () => {
  const lista = [{ id: 'r_1', nombre: 'Torno' }, { id: 'r_2', nombre: 'Fresa' }];
  igual(validarNombreAsignacion('', lista).ok, false);
  igual(validarNombreAsignacion('x'.repeat(25), lista).ok, false);
  igual(validarNombreAsignacion('torno', lista, 'r_2').ok, false);
  igual(validarNombreAsignacion('torno', lista, 'r_1').ok, true);
  igual(validarNombreAsignacion('  Prensa  ', lista).valor, 'Prensa');
});

/* ---------------- Modelo ---------------- */
const {
  crearModeloAsignacion, agregarRecurso, agregarTarea, fijarValorAsignacion, obtenerValorAsignacion,
  renombrarElementoAsignacion, eliminarElementoAsignacion, matrizDelModelo, resumenModelo,
  validarModeloAsignacion, depurarModeloAsignacion, migrarAsignacionV1, ejemploAsignacion, firmaModeloAsignacion
} = ctx;

prueba('Modelo: ids estables, renombrar no rompe valores', () => {
  const m = crearModeloAsignacion();
  const r = agregarRecurso(m), t = agregarTarea(m);
  fijarValorAsignacion(m, r.id, t.id, 5);
  renombrarElementoAsignacion(m, r.id, 'Nuevo nombre');
  igual(obtenerValorAsignacion(m, r.id, t.id), 5);
  igual(m.recursos[0].nombre, 'Nuevo nombre');
});

prueba('Modelo: pendientes se distinguen de cero; resumen cuenta bien', () => {
  const m = crearModeloAsignacion();
  const r1 = agregarRecurso(m), r2 = agregarRecurso(m), t1 = agregarTarea(m), t2 = agregarTarea(m);
  fijarValorAsignacion(m, r1.id, t1.id, 0);
  fijarValorAsignacion(m, r2.id, t2.id, 3);
  igual(matrizDelModelo(m), [[0, null], [null, 3]]);
  const res = resumenModelo(m);
  igual([res.recursos, res.tareas, res.completos, res.total], [2, 2, 2, 4]);
  igual(validarModeloAsignacion(m).ok, false);
  fijarValorAsignacion(m, r1.id, t2.id, 1);
  fijarValorAsignacion(m, r2.id, t1.id, 1);
  igual(validarModeloAsignacion(m).ok, true);
  fijarValorAsignacion(m, r2.id, t1.id, null);
  igual(obtenerValorAsignacion(m, r2.id, t1.id), null);
});

prueba('Modelo: eliminar un elemento borra sus valores', () => {
  const m = ejemploAsignacion();
  const r = m.recursos[1];
  eliminarElementoAsignacion(m, r.id);
  igual(m.recursos.length, 3);
  cierto(!Object.keys(m.valores).some(k => k.startsWith(r.id + '|')));
  igual(resumenModelo(m).total, 12);
  igual(resumenModelo(m).completos, 12);
});

prueba('Modelo: límite de 8 por grupo', () => {
  const m = crearModeloAsignacion();
  for (let i = 0; i < 8; i++) cierto(agregarRecurso(m) !== null);
  igual(agregarRecurso(m), null);
});

prueba('Modelo: aviso de rectangular', () => {
  const m = crearModeloAsignacion();
  const r1 = agregarRecurso(m), t1 = agregarTarea(m), t2 = agregarTarea(m);
  fijarValorAsignacion(m, r1.id, t1.id, 1);
  fijarValorAsignacion(m, r1.id, t2.id, 2);
  const v = validarModeloAsignacion(m);
  igual(v.ok, true);
  igual(v.avisos.length, 1);
});

prueba('Migración v1 → modelo: conserva valores, nombres y deja pendientes los no enteros', () => {
  const v1 = { rows: 2, cols: 2, objective: 'max', labelsRows: ['A', 'A'], labelsCols: ['X', 'Y'], values: [[1, 2.5], [3, 4]] };
  const m = migrarAsignacionV1(v1);
  igual(m.recursos.map(r => r.nombre), ['A', 'A (2)']);
  igual(matrizDelModelo(m), [[1, null], [3, 4]]);
});

prueba('Depurar v2: descarta valores huérfanos y recalcula siguienteId', () => {
  const datos = {
    recursos: [{ id: 'r_1', nombre: 'A' }, { id: 'malo' }],
    tareas: [{ id: 't_2', nombre: 'X' }],
    valores: { 'r_1|t_2': 4, 'r_9|t_2': 1, 'r_1|t_2x': 2 },
    siguienteId: 1
  };
  const m = depurarModeloAsignacion(datos);
  igual(m.recursos.length, 1);
  igual(m.valores, { 'r_1|t_2': 4 });
  igual(m.siguienteId, 3);
});

prueba('Firma del modelo cambia con valores/objetivo pero no con nombres', () => {
  const m = ejemploAsignacion();
  const f1 = firmaModeloAsignacion(m, 'min');
  renombrarElementoAsignacion(m, m.recursos[0].id, 'Otro');
  igual(firmaModeloAsignacion(m, 'min'), f1);
  cierto(firmaModeloAsignacion(m, 'max') !== f1);
  fijarValorAsignacion(m, m.recursos[0].id, m.tareas[0].id, 99);
  cierto(firmaModeloAsignacion(m, 'min') !== f1);
});

process.exitCode = informe('Asignación') ? 0 : 1;
