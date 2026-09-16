/* Sistema de deshacer/rehacer */

'use strict';

// Las constantes MAX_ACCIONES_DESHACER ahora vienen de config.js

/**
 * Guarda el estado actual en el historial para poder deshacer cambios.
 */
function guardarEstadoParaDeshacer() {
  const snapshot = {
    nodos: JSON.parse(JSON.stringify(estado.nodos)),
    conexiones: JSON.parse(JSON.stringify(estado.conexiones)),
    siguienteId: estado.siguienteId,
    seleccion: estado.seleccion ? JSON.parse(JSON.stringify(estado.seleccion)) : null
  };
  
  estado.historial.pasado.push(snapshot);
  
  // Limitar el tamaño del historial
  if (estado.historial.pasado.length > MAX_ACCIONES_DESHACER) {
    estado.historial.pasado.shift();
  }
  
  // Limpiar el futuro cuando se hace una nueva acción
  estado.historial.futuro = [];
}

/**
 * Deshace la última acción.
 */
function deshacer() {
  if (estado.historial.pasado.length === 0) {
    avisar('No hay acciones para deshacer.', 'error');
    return;
  }
  
  // Guardar estado actual en el futuro
  const estadoActual = {
    nodos: JSON.parse(JSON.stringify(estado.nodos)),
    conexiones: JSON.parse(JSON.stringify(estado.conexiones)),
    siguienteId: estado.siguienteId,
    seleccion: estado.seleccion ? JSON.parse(JSON.stringify(estado.seleccion)) : null
  };
  estado.historial.futuro.push(estadoActual);
  
  // Restaurar estado anterior
  const anterior = estado.historial.pasado.pop();
  estado.nodos = anterior.nodos;
  estado.conexiones = anterior.conexiones;
  estado.siguienteId = anterior.siguienteId;
  estado.seleccion = anterior.seleccion;
  estado.origenConexion = null;
  
  guardar();
  dibujar();
  avisar('Acción deshecha.', 'ok');
}

/**
 * Rehace la última acción deshecha.
 */
function rehacer() {
  if (estado.historial.futuro.length === 0) {
    avisar('No hay acciones para rehacer.', 'error');
    return;
  }
  
  // Guardar estado actual en el pasado
  const estadoActual = {
    nodos: JSON.parse(JSON.stringify(estado.nodos)),
    conexiones: JSON.parse(JSON.stringify(estado.conexiones)),
    siguienteId: estado.siguienteId,
    seleccion: estado.seleccion ? JSON.parse(JSON.stringify(estado.seleccion)) : null
  };
  estado.historial.pasado.push(estadoActual);
  
  // Restaurar estado futuro
  const siguiente = estado.historial.futuro.pop();
  estado.nodos = siguiente.nodos;
  estado.conexiones = siguiente.conexiones;
  estado.siguienteId = siguiente.siguienteId;
  estado.seleccion = siguiente.seleccion;
  estado.origenConexion = null;
  
  guardar();
  dibujar();
  avisar('Acción rehecha.', 'ok');
}

/**
 * Verifica si hay acciones para deshacer.
 */
function puedeDeshacer() {
  return estado.historial.pasado.length > 0;
}

/**
 * Verifica si hay acciones para rehacer.
 */
function puedeRehacer() {
  return estado.historial.futuro.length > 0;
}

// Los atajos de teclado para deshacer/rehacer se manejan en app.js para evitar conflictos
