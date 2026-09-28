/* Estado en memoria del módulo de asignación, persistencia y deshacer/rehacer.
 *
 * El estado es propio de este módulo: no comparte nada con `estado` (Johnson) ni con
 * el de Northwest. Lo que afecta al resultado vive en `modelo` + `objetivo`; el resto
 * (vista, selección, posiciones de los nodos, zoom) es solo presentación.
 */

'use strict';

const VISTAS_ASIGNACION = ['grafo', 'matriz', 'resultado', 'procedimiento'];

const estadoAsignacion = {
  modelo: crearModeloAsignacion(),
  objetivo: 'min',                 // 'min' | 'max'
  vista: 'grafo',
  herramienta: 'seleccionar',      // 'seleccionar' | 'conectar'
  seleccion: null,                 // { tipo:'nodo', id } | { tipo:'conexion', recursoId, tareaId } | null
  origenConexion: null,            // id del primer nodo tocado con la herramienta Conectar
  posiciones: {},                  // id -> { x, y } cuando el usuario movió el nodo (solo visual)
  vista2d: null,                   // viewBox actual del grafo { x, y, ancho, alto } o null = ajustar
  mostrarTodas: false,             // en el resultado: mostrar también las conexiones no elegidas
  mostrarValores: false,           // forzar las etiquetas de todos los valores
  resultado: null,                 // { firma, datos, verificacion, pasoActual } o null
  historial: { pasado: [], futuro: [] },
  escuchas: []
};

/* ---------------- Suscripción al cambio ---------------- */

function alCambiarAsignacion(fn) {
  estadoAsignacion.escuchas.push(fn);
}

function emitirCambioAsignacion(motivo) {
  estadoAsignacion.escuchas.forEach(fn => fn(motivo));
}

/* ---------------- Persistencia ---------------- */

function serializarAsignacion() {
  return {
    version: 2,
    objetivo: estadoAsignacion.objetivo,
    modelo: {
      recursos: estadoAsignacion.modelo.recursos,
      tareas: estadoAsignacion.modelo.tareas,
      valores: estadoAsignacion.modelo.valores,
      siguienteId: estadoAsignacion.modelo.siguienteId
    },
    posiciones: estadoAsignacion.posiciones,
    vista: estadoAsignacion.vista
  };
}

function guardarAsignacion() {
  try {
    localStorage.setItem(ASIGNACION_STORAGE_KEY_V2, JSON.stringify(serializarAsignacion()));
  } catch (e) { /* sin almacenamiento: la aplicación sigue funcionando */ }
}

/**
 * Carga el autoguardado. Orden: v2 → v1 (migrando y avisando) → ejemplo.
 * @returns {'v2'|'v1'|'nuevo'}
 */
function cargarAsignacion() {
  try {
    const crudoV2 = localStorage.getItem(ASIGNACION_STORAGE_KEY_V2);
    if (crudoV2) {
      const datos = JSON.parse(crudoV2);
      const modelo = depurarModeloAsignacion(datos.modelo);
      if (modelo) {
        estadoAsignacion.modelo = modelo;
        estadoAsignacion.objetivo = datos.objetivo === 'max' ? 'max' : 'min';
        estadoAsignacion.posiciones = depurarPosiciones(datos.posiciones, modelo);
        estadoAsignacion.vista = VISTAS_ASIGNACION.includes(datos.vista) && datos.vista !== 'resultado' && datos.vista !== 'procedimiento' ? datos.vista : 'grafo';
        return 'v2';
      }
    }
  } catch (e) { /* se intenta con el formato anterior */ }

  try {
    const crudoV1 = localStorage.getItem(ASIGNACION_STORAGE_KEY);
    if (crudoV1) {
      const datos = JSON.parse(crudoV1);
      const modelo = migrarAsignacionV1(datos);
      if (modelo) {
        estadoAsignacion.modelo = modelo;
        estadoAsignacion.objetivo = datos.objective === 'max' ? 'max' : 'min';
        guardarAsignacion();
        // El formato antiguo se conserva por si se vuelve a una versión anterior.
        return 'v1';
      }
    }
  } catch (e) { /* nada recuperable */ }

  estadoAsignacion.modelo = ejemploAsignacion();
  estadoAsignacion.objetivo = 'min';
  guardarAsignacion();
  return 'nuevo';
}

function depurarPosiciones(posiciones, modelo) {
  if (!posiciones || typeof posiciones !== 'object') return {};
  const ids = new Set(modelo.recursos.concat(modelo.tareas).map(e => e.id));
  const salida = {};
  Object.keys(posiciones).forEach(id => {
    const p = posiciones[id];
    if (ids.has(id) && p && Number.isFinite(p.x) && Number.isFinite(p.y)) salida[id] = { x: p.x, y: p.y };
  });
  return salida;
}

/* ---------------- Deshacer / rehacer ---------------- */

function instantaneaAsignacion() {
  return {
    modelo: clonarModeloAsignacion(estadoAsignacion.modelo),
    objetivo: estadoAsignacion.objetivo,
    posiciones: JSON.parse(JSON.stringify(estadoAsignacion.posiciones))
  };
}

function restaurarInstantaneaAsignacion(foto) {
  estadoAsignacion.modelo = foto.modelo;
  estadoAsignacion.objetivo = foto.objetivo;
  estadoAsignacion.posiciones = foto.posiciones;
  estadoAsignacion.seleccion = null;
  estadoAsignacion.origenConexion = null;
}

function guardarHistorialAsignacion() {
  estadoAsignacion.historial.pasado.push(instantaneaAsignacion());
  if (estadoAsignacion.historial.pasado.length > MAX_ACCIONES_DESHACER) estadoAsignacion.historial.pasado.shift();
  estadoAsignacion.historial.futuro = [];
}

function puedeDeshacerAsignacion() { return estadoAsignacion.historial.pasado.length > 0; }
function puedeRehacerAsignacion() { return estadoAsignacion.historial.futuro.length > 0; }

function deshacerAsignacion() {
  if (!puedeDeshacerAsignacion()) return false;
  estadoAsignacion.historial.futuro.push(instantaneaAsignacion());
  restaurarInstantaneaAsignacion(estadoAsignacion.historial.pasado.pop());
  comprobarVigenciaResultado();
  guardarAsignacion();
  emitirCambioAsignacion('deshacer');
  return true;
}

function rehacerAsignacion() {
  if (!puedeRehacerAsignacion()) return false;
  estadoAsignacion.historial.pasado.push(instantaneaAsignacion());
  restaurarInstantaneaAsignacion(estadoAsignacion.historial.futuro.pop());
  comprobarVigenciaResultado();
  guardarAsignacion();
  emitirCambioAsignacion('rehacer');
  return true;
}

/* ---------------- Cambios del modelo ---------------- */

/**
 * Único camino para modificar el modelo o el objetivo: guarda el historial, aplica el
 * cambio, comprueba si el resultado sigue vigente, persiste y avisa a las vistas.
 * @param {Function} cambio  recibe el modelo y lo modifica
 * @param {{sinHistorial?:boolean, motivo?:string}} [opciones]
 */
function aplicarCambioAsignacion(cambio, opciones) {
  const opts = opciones || {};
  if (!opts.sinHistorial) guardarHistorialAsignacion();
  cambio(estadoAsignacion.modelo, estadoAsignacion);
  comprobarVigenciaResultado();
  guardarAsignacion();
  emitirCambioAsignacion(opts.motivo || 'modelo');
}

/** Cambios de presentación (posiciones, vista, selección) que no tocan el modelo. */
function aplicarCambioVisualAsignacion(cambio, motivo) {
  cambio(estadoAsignacion);
  guardarAsignacion();
  emitirCambioAsignacion(motivo || 'visual');
}

function firmaActualAsignacion() {
  return firmaModeloAsignacion(estadoAsignacion.modelo, estadoAsignacion.objetivo);
}

/** El resultado deja de valer si cambian costos, conexiones, dimensiones u objetivo. */
function comprobarVigenciaResultado() {
  if (!estadoAsignacion.resultado) return;
  estadoAsignacion.resultado.vigente = estadoAsignacion.resultado.firma === firmaActualAsignacion();
}

function resultadoVigenteAsignacion() {
  return !!(estadoAsignacion.resultado && estadoAsignacion.resultado.vigente);
}

function fijarResultadoAsignacion(datos, verificacion) {
  estadoAsignacion.resultado = {
    firma: firmaActualAsignacion(),
    vigente: true,
    datos,
    verificacion,
    pasoActual: 0
  };
}

/* ---------------- Selección ---------------- */

function seleccionarAsignacion(seleccion) {
  estadoAsignacion.seleccion = seleccion;
  emitirCambioAsignacion('seleccion');
}

function esConexionSeleccionada(recursoId, tareaId) {
  const s = estadoAsignacion.seleccion;
  return !!(s && s.tipo === 'conexion' && s.recursoId === recursoId && s.tareaId === tareaId);
}

function esNodoSeleccionado(id) {
  const s = estadoAsignacion.seleccion;
  return !!(s && s.tipo === 'nodo' && s.id === id);
}

/** La selección puede quedar huérfana tras eliminar o deshacer. */
function limpiarSeleccionInvalida() {
  const s = estadoAsignacion.seleccion;
  if (!s) return;
  const m = estadoAsignacion.modelo;
  if (s.tipo === 'nodo' && !buscarElementoAsignacion(m, s.id)) estadoAsignacion.seleccion = null;
  if (s.tipo === 'conexion' && (!m.recursos.some(r => r.id === s.recursoId) || !m.tareas.some(t => t.id === s.tareaId))) estadoAsignacion.seleccion = null;
  if (estadoAsignacion.origenConexion && !buscarElementoAsignacion(m, estadoAsignacion.origenConexion)) estadoAsignacion.origenConexion = null;
}

/* ---------------- Vistas ---------------- */

function cambiarVistaAsignacion(vista) {
  if (!VISTAS_ASIGNACION.includes(vista)) return;
  estadoAsignacion.vista = vista;
  guardarAsignacion();
  emitirCambioAsignacion('vista');
}
