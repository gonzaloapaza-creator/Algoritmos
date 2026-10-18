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
  try {
    localStorage.setItem(ARBOLES_STORAGE_KEY, JSON.stringify(instantaneaArboles()));
  } catch (error) {
    console.warn('No se pudo guardar el estado de Árboles en el almacenamiento local.', error);
  }
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

function depurarEstadoArboles(datos) {
  try {
    if (!datos || datos.version !== 1) throw new Error('La versión guardada no es compatible.');
    if (datos.modo === 'busqueda') {
      const validacion = validarSecuenciaInsercion(datos.secuencia);
      if (!validacion.ok) throw new Error(validacion.error);
      return { modo: 'busqueda', secuencia: validacion.valores, raiz: crearArbolBusqueda(validacion.valores) };
    }
    if (datos.modo === 'reconstruido' && datos.recorridos) {
      const resultado = validarYReconstruirArbol(datos.recorridos, 'todos');
      if (!resultado.ok) throw new Error(resultado.error);
      return { modo: 'reconstruido', secuencia: [], raiz: resultado.raiz };
    }
    throw new Error('El contenido guardado no tiene un modo reconocido.');
  } catch (error) {
    return null;
  }
}
