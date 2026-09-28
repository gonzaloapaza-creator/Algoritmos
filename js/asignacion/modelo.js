/* Modelo del problema de asignación.
 *
 * Un único modelo alimenta el grafo bipartito y la matriz: son dos vistas de los
 * mismos datos. Los recursos y las tareas tienen identificadores estables
 * (renombrar no rompe nada) y los valores se guardan por pareja (recurso, tarea).
 * Una pareja SIN valor es un dato pendiente; nunca se interpreta como cero.
 *
 * Sin DOM: se prueba en Node.
 */

'use strict';

function crearModeloAsignacion() {
  return { recursos: [], tareas: [], valores: {}, siguienteId: 1 };
}

function claveAsignacion(recursoId, tareaId) {
  return recursoId + '|' + tareaId;
}

function nuevoIdAsignacion(modelo, prefijo) {
  return prefijo + '_' + (modelo.siguienteId++);
}

/** Primer «Prefijo N» que no esté en uso dentro del grupo. */
function nombreLibreAsignacion(lista, prefijo) {
  const usados = new Set(lista.map(e => e.nombre.toLowerCase()));
  let n = 1;
  while (usados.has((prefijo + ' ' + n).toLowerCase())) n++;
  return prefijo + ' ' + n;
}

function agregarRecurso(modelo, nombre) {
  if (modelo.recursos.length >= MAX_ASIGNACION_DIMENSION) return null;
  const recurso = { id: nuevoIdAsignacion(modelo, 'r'), nombre: nombre || nombreLibreAsignacion(modelo.recursos, 'Recurso') };
  modelo.recursos.push(recurso);
  return recurso;
}

function agregarTarea(modelo, nombre) {
  if (modelo.tareas.length >= MAX_ASIGNACION_DIMENSION) return null;
  const tarea = { id: nuevoIdAsignacion(modelo, 't'), nombre: nombre || nombreLibreAsignacion(modelo.tareas, 'Tarea') };
  modelo.tareas.push(tarea);
  return tarea;
}

/** @returns {{tipo:'recurso'|'tarea', elemento:Object}|null} */
function buscarElementoAsignacion(modelo, id) {
  const recurso = modelo.recursos.find(r => r.id === id);
  if (recurso) return { tipo: 'recurso', elemento: recurso };
  const tarea = modelo.tareas.find(t => t.id === id);
  if (tarea) return { tipo: 'tarea', elemento: tarea };
  return null;
}

function renombrarElementoAsignacion(modelo, id, nombre) {
  const encontrado = buscarElementoAsignacion(modelo, id);
  if (!encontrado) return false;
  encontrado.elemento.nombre = nombre;
  return true;
}

/** Elimina un recurso o una tarea junto con todos sus valores. */
function eliminarElementoAsignacion(modelo, id) {
  const encontrado = buscarElementoAsignacion(modelo, id);
  if (!encontrado) return false;
  if (encontrado.tipo === 'recurso') modelo.recursos = modelo.recursos.filter(r => r.id !== id);
  else modelo.tareas = modelo.tareas.filter(t => t.id !== id);
  Object.keys(modelo.valores).forEach(clave => {
    const [r, t] = clave.split('|');
    if (r === id || t === id) delete modelo.valores[clave];
  });
  return true;
}

/**
 * Fija el valor de una pareja. `valor === null` deja la pareja pendiente
 * (equivale a eliminar la conexión en el grafo).
 */
function fijarValorAsignacion(modelo, recursoId, tareaId, valor) {
  const clave = claveAsignacion(recursoId, tareaId);
  if (valor === null || valor === undefined) { delete modelo.valores[clave]; return; }
  if (!Number.isInteger(valor)) throw new Error('El valor debe ser un entero o null.');
  modelo.valores[clave] = valor;
}

/** @returns {number|null} null si la pareja está pendiente. */
function obtenerValorAsignacion(modelo, recursoId, tareaId) {
  const v = modelo.valores[claveAsignacion(recursoId, tareaId)];
  return Number.isInteger(v) ? v : null;
}

/** Matriz filas = recursos, columnas = tareas, con null en las pendientes. */
function matrizDelModelo(modelo) {
  return modelo.recursos.map(r => modelo.tareas.map(t => obtenerValorAsignacion(modelo, r.id, t.id)));
}

/** Parejas sin valor, en orden de recorrido recurso → tarea. */
function parejasPendientes(modelo) {
  const pendientes = [];
  modelo.recursos.forEach(r => modelo.tareas.forEach(t => {
    if (obtenerValorAsignacion(modelo, r.id, t.id) === null) pendientes.push({ recursoId: r.id, tareaId: t.id });
  }));
  return pendientes;
}

function resumenModelo(modelo) {
  const total = modelo.recursos.length * modelo.tareas.length;
  const pendientes = parejasPendientes(modelo);
  return {
    recursos: modelo.recursos.length,
    tareas: modelo.tareas.length,
    total,
    completos: total - pendientes.length,
    pendientes
  };
}

/**
 * Comprueba si el modelo se puede resolver. Devuelve todos los problemas, no solo el primero.
 * @returns {{ok:boolean, errores:string[], avisos:string[]}}
 */
function validarModeloAsignacion(modelo) {
  const errores = [];
  const avisos = [];
  const r = modelo.recursos.length, t = modelo.tareas.length;
  if (r < MIN_ASIGNACION_DIMENSION) errores.push('Agrega al menos ' + MIN_ASIGNACION_DIMENSION + ' recurso.');
  if (t < MIN_ASIGNACION_DIMENSION) errores.push('Agrega al menos ' + MIN_ASIGNACION_DIMENSION + ' tarea.');
  if (r > MAX_ASIGNACION_DIMENSION) errores.push('Como máximo ' + MAX_ASIGNACION_DIMENSION + ' recursos en esta versión.');
  if (t > MAX_ASIGNACION_DIMENSION) errores.push('Como máximo ' + MAX_ASIGNACION_DIMENSION + ' tareas en esta versión.');

  const pendientes = parejasPendientes(modelo);
  if (r > 0 && t > 0 && pendientes.length > 0) {
    errores.push(pendientes.length === 1
      ? 'Falta 1 valor: todas las parejas recurso–tarea necesitan un costo o beneficio.'
      : 'Faltan ' + pendientes.length + ' valores: todas las parejas recurso–tarea necesitan un costo o beneficio.');
  }

  Object.keys(modelo.valores).forEach(clave => {
    const v = modelo.valores[clave];
    if (!Number.isInteger(v) || Math.abs(v) > MAX_VALOR_ASIGNACION) errores.push('Hay un valor fuera de rango o no entero.');
  });

  if (r > 0 && t > 0 && r !== t) {
    const menor = Math.min(r, t);
    avisos.push('La matriz es rectangular (' + r + '×' + t + '): se realizarán ' + menor + ' asignaciones reales y '
      + (r > t ? (r - t) + (r - t === 1 ? ' recurso quedará' : ' recursos quedarán') + ' sin tarea.'
               : (t - r) + (t - r === 1 ? ' tarea quedará' : ' tareas quedarán') + ' sin recurso.'));
  }

  return { ok: errores.length === 0, errores: Array.from(new Set(errores)), avisos };
}

function clonarModeloAsignacion(modelo) {
  return JSON.parse(JSON.stringify(modelo));
}

/** Firma de los datos que afectan al resultado: si cambia, el resultado deja de valer. */
function firmaModeloAsignacion(modelo, objetivo) {
  return JSON.stringify({
    o: objetivo,
    r: modelo.recursos.map(e => e.id),
    t: modelo.tareas.map(e => e.id),
    v: modelo.valores
  });
}

/* ---------------- Serialización ---------------- */

/**
 * Revisa datos externos (autoguardado v2 o importación). Descarta lo inválido en
 * lugar de fallar; devuelve null solo si no hay nada recuperable.
 */
function depurarModeloAsignacion(datos) {
  if (!datos || !Array.isArray(datos.recursos) || !Array.isArray(datos.tareas)) return null;
  const limpiarLista = lista => lista
    .filter(e => e && typeof e.id === 'string' && typeof e.nombre === 'string' && e.nombre.trim() !== '')
    .map(e => ({ id: e.id, nombre: e.nombre.trim().slice(0, MAX_LARGO_ETIQUETA_ASIGNACION) }))
    .slice(0, MAX_ASIGNACION_DIMENSION);

  const recursos = limpiarLista(datos.recursos);
  const tareas = limpiarLista(datos.tareas);
  const idsR = new Set(recursos.map(e => e.id));
  const idsT = new Set(tareas.map(e => e.id));
  const valores = {};
  if (datos.valores && typeof datos.valores === 'object') {
    Object.keys(datos.valores).forEach(clave => {
      const [r, t] = clave.split('|');
      const v = datos.valores[clave];
      if (idsR.has(r) && idsT.has(t) && Number.isInteger(v) && Math.abs(v) <= MAX_VALOR_ASIGNACION) valores[clave] = v;
    });
  }

  let mayor = 0;
  recursos.concat(tareas).forEach(e => {
    const numero = Number(String(e.id).split('_')[1]);
    if (Number.isInteger(numero) && numero > mayor) mayor = numero;
  });
  const siguienteId = Number.isInteger(datos.siguienteId) && datos.siguienteId > mayor ? datos.siguienteId : mayor + 1;

  return { recursos, tareas, valores, siguienteId };
}

/**
 * Convierte el formato antiguo (asignacion.v1: rows/cols/labelsRows/labelsCols/values)
 * al modelo actual. Los valores no enteros se dejan pendientes en vez de forzarlos a 0.
 */
function migrarAsignacionV1(datos) {
  if (!datos || !Array.isArray(datos.values)) return null;
  const modelo = crearModeloAsignacion();
  const filas = Math.min(MAX_ASIGNACION_DIMENSION, datos.values.length);
  const columnas = Math.min(MAX_ASIGNACION_DIMENSION, Array.isArray(datos.values[0]) ? datos.values[0].length : 0);
  if (filas === 0 || columnas === 0) return null;

  for (let i = 0; i < filas; i++) {
    const nombre = Array.isArray(datos.labelsRows) && typeof datos.labelsRows[i] === 'string' && datos.labelsRows[i].trim()
      ? datos.labelsRows[i].trim().slice(0, MAX_LARGO_ETIQUETA_ASIGNACION) : null;
    agregarRecurso(modelo, nombre);
  }
  for (let j = 0; j < columnas; j++) {
    const nombre = Array.isArray(datos.labelsCols) && typeof datos.labelsCols[j] === 'string' && datos.labelsCols[j].trim()
      ? datos.labelsCols[j].trim().slice(0, MAX_LARGO_ETIQUETA_ASIGNACION) : null;
    agregarTarea(modelo, nombre);
  }
  // Nombres repetidos en el formato antiguo: se desambiguan para respetar la regla actual.
  [modelo.recursos, modelo.tareas].forEach(lista => {
    const vistos = new Set();
    lista.forEach(e => {
      let nombre = e.nombre, k = 2;
      while (vistos.has(nombre.toLowerCase())) nombre = e.nombre + ' (' + (k++) + ')';
      e.nombre = nombre;
      vistos.add(nombre.toLowerCase());
    });
  });
  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      const v = Array.isArray(datos.values[i]) ? datos.values[i][j] : undefined;
      if (Number.isInteger(v) && Math.abs(v) <= MAX_VALOR_ASIGNACION) {
        fijarValorAsignacion(modelo, modelo.recursos[i].id, modelo.tareas[j].id, v);
      }
    }
  }
  return modelo;
}

/** Modelo de ejemplo (el de las capturas). Mínimo esperado: 26. */
function ejemploAsignacion() {
  const modelo = crearModeloAsignacion();
  const recursos = ['Trabajador A', 'Trabajador B', 'Trabajador C', 'Trabajador D'].map(n => agregarRecurso(modelo, n));
  const tareas = ['Trabajo 1', 'Trabajo 2', 'Trabajo 3', 'Trabajo 4'].map(n => agregarTarea(modelo, n));
  const valores = [
    [12, 8, 9, 14],
    [7, 10, 11, 18],
    [15, 13, 6, 9],
    [10, 17, 12, 5]
  ];
  valores.forEach((fila, i) => fila.forEach((v, j) => fijarValorAsignacion(modelo, recursos[i].id, tareas[j].id, v)));
  return modelo;
}
