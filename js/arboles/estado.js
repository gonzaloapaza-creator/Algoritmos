'use strict';

const estadoArboles = {
  modo: 'busqueda',
  secuencia: [],
  raiz: null,
  seleccion: null,
  camino: [],
  nuevo: null,
  recorridoSeleccionado: 'preorden',
  historialRecorrido: [],
  pasoRecorrido: 0,
  intervaloRecorrido: null,
  reproduciendo: false
};

function instantaneaArboles() {
  const datos = estadoArboles.modo === 'busqueda'
    ? { version: 1, modo: 'busqueda', secuencia: estadoArboles.secuencia.slice() }
    : { version: 1, modo: 'reconstruido', recorridos: recorridosArbol(estadoArboles.raiz) };
  datos.recorrido = estadoArboles.recorridoSeleccionado;
  datos.pasoRecorrido = estadoArboles.pasoRecorrido;
  return datos;
}

function guardarEstadoArboles() {
  if (typeof localStorage === 'undefined') return;
  cancelarGuardadoDiferidoArboles();
  // Si falla, escribirAlmacenamientoLocal avisa una sola vez y la sesión continúa.
  escribirAlmacenamientoLocal(ARBOLES_STORAGE_KEY, JSON.stringify(instantaneaArboles()), { respaldo: 'guarda el trabajo con «Guardar» y expórtalo desde «Mis trabajos»' });
}

/* Guardado diferido: los cambios de recorrido y de paso (incluida la animación) se
 * agrupan en una sola escritura en vez de una por fotograma. */
let temporizadorGuardadoArboles = null;

function programarGuardadoArboles(retraso) {
  if (typeof localStorage === 'undefined' || typeof setTimeout === 'undefined') return;
  cancelarGuardadoDiferidoArboles();
  temporizadorGuardadoArboles = setTimeout(() => { temporizadorGuardadoArboles = null; guardarEstadoArboles(); }, retraso == null ? 400 : retraso);
}

function cancelarGuardadoDiferidoArboles() {
  if (temporizadorGuardadoArboles !== null && typeof clearTimeout !== 'undefined') clearTimeout(temporizadorGuardadoArboles);
  temporizadorGuardadoArboles = null;
}

/** Completa la última escritura antes de abandonar u ocultar la página. */
function descargarGuardadoPendienteArboles() {
  if (temporizadorGuardadoArboles !== null) guardarEstadoArboles();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', descargarGuardadoPendienteArboles);
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) descargarGuardadoPendienteArboles();
  });
}

function restaurarEstadoArboles(datosDirectos) {
  if (datosDirectos) return depurarEstadoArboles(datosDirectos);
  if (typeof localStorage === 'undefined') return null;
  let texto;
  try {
    texto = localStorage.getItem(ARBOLES_STORAGE_KEY);
  } catch (error) {
    console.warn('No se pudo leer el estado guardado de Árboles.', error);
    return null;
  }
  if (!texto) return null;
  try {
    return depurarEstadoArboles(JSON.parse(texto));
  } catch (error) {
    console.warn('Se ignoró el estado guardado de Árboles porque no es válido.', error);
    return null;
  }
}

const RECORRIDOS_ARBOL = ['preorden', 'inorden', 'postorden'];

/**
 * Valida datos guardados (autoguardado o «Mis trabajos») y devuelve
 * { modo, secuencia, raiz, recorrido, pasoRecorrido } o null si no sirven.
 * `recorrido` y `pasoRecorrido` faltan en formatos antiguos: se usan valores seguros.
 * El paso se acota al historial real al aplicarlo; aquí solo se exige un entero ≥ 0.
 */
function depurarEstadoArboles(datos) {
  try {
    if (!datos || datos.version !== 1) throw new Error('La versión guardada no es compatible.');
    const metadatos = {
      recorrido: RECORRIDOS_ARBOL.includes(datos.recorrido) ? datos.recorrido : 'preorden',
      pasoRecorrido: Number.isInteger(datos.pasoRecorrido) && datos.pasoRecorrido >= 0 ? datos.pasoRecorrido : 0
    };
    if (datos.modo === 'busqueda') {
      const validacion = validarSecuenciaInsercion(datos.secuencia);
      if (!validacion.ok) throw new Error(validacion.error);
      return Object.assign({ modo: 'busqueda', secuencia: validacion.valores, raiz: crearArbolBusqueda(validacion.valores) }, metadatos);
    }
    if (datos.modo === 'reconstruido' && datos.recorridos) {
      const resultado = validarYReconstruirArbol(datos.recorridos, 'todos');
      if (!resultado.ok) throw new Error(resultado.error);
      return Object.assign({ modo: 'reconstruido', secuencia: [], raiz: resultado.raiz }, metadatos);
    }
    throw new Error('El contenido guardado no tiene un modo reconocido.');
  } catch (error) {
    return null;
  }
}
