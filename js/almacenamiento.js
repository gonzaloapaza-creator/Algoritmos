/* Guardado del grafo en el navegador: el autoguardado y la biblioteca de grafos. */

'use strict';

// Las constantes CLAVE_ALMACEN y CLAVE_BIBLIOTECA ahora vienen de config.js

/**
 * Crea una copia del grafo actual, lista para guardarse.
 * No incluye el resaltado visual de Johnson (estado.visualizacionJohnson).
 * @returns {{nodos:Array, conexiones:Array, siguienteId:number}} Copia del estado actual
 */
function instantaneaGrafo() {
  return {
    nodos: estado.nodos.map(n => ({ id: n.id, nombre: n.nombre, x: n.x, y: n.y })),
    conexiones: estado.conexiones.map(c => ({ id: c.id, desde: c.desde, hacia: c.hacia, valor: c.valor })),
    siguienteId: estado.siguienteId
  };
}

/**
 * Revisa y depura datos que vienen del almacenamiento.
 * Los datos pueden estar incompletos, ser de una versión anterior o haber sido modificados a mano.
 * Devuelve copias nuevas, así que el resultado se puede usar como estado.
 * @param {Object} datos - Datos crudos del almacenamiento
 * @returns {{nodos:Array, conexiones:Array, siguienteId:number}|null}
 *          Grafo depurado o null si los datos son inválidos
 */
function depurarGrafo(datos) {
  if (!datos || !Array.isArray(datos.nodos) || !Array.isArray(datos.conexiones)) return null;

  const nodos = datos.nodos
    .filter(n => n && typeof n.id === 'string' && typeof n.nombre === 'string' &&
                 Number.isFinite(n.x) && Number.isFinite(n.y))
    .map(n => ({ id: n.id, nombre: n.nombre, x: n.x, y: n.y }));

  const ids = new Set(nodos.map(n => n.id));
  // El peso solo tiene que ser entero: el cero y los negativos son válidos.
  const conexiones = datos.conexiones
    .filter(c => c && typeof c.id === 'string' && ids.has(c.desde) && ids.has(c.hacia) &&
                 Number.isInteger(c.valor))
    .map(c => ({ id: c.id, desde: c.desde, hacia: c.hacia, valor: c.valor }));

  // El contador debe quedar por encima del número más alto ya usado,
  // o los identificadores nuevos chocarían con los recuperados.
  let mayor = 0;
  nodos.concat(conexiones).forEach(objeto => {
    const numero = Number(String(objeto.id).split('_')[1]);
    if (Number.isInteger(numero) && numero > mayor) mayor = numero;
  });
  const guardado = datos.siguienteId;
  const siguienteId = Number.isInteger(guardado) && guardado > mayor ? guardado : mayor + 1;

  return { nodos: nodos, conexiones: conexiones, siguienteId: siguienteId };
}

/** Reemplaza el grafo en pantalla por uno ya depurado. */
function aplicarGrafo(limpio) {
  estado.nodos = limpio.nodos;
  estado.conexiones = limpio.conexiones;
  estado.siguienteId = limpio.siguienteId;
  estado.seleccion = null;
  estado.origenConexion = null;
}

/**
 * Guarda el grafo actual en localStorage (autoguardado).
 * Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando.
 */
function guardar() {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(instantaneaGrafo()));
  } catch (e) {
    // Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando.
  }
}

/**
 * Recupera el grafo del autoguardado desde localStorage.
 * Si los datos están corruptos o no existen, deja el grafo vacío.
 */
function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACEN);
    if (!crudo) return;
    const limpio = depurarGrafo(JSON.parse(crudo));
    if (limpio) aplicarGrafo(limpio);
  } catch (e) {
    estado.nodos = [];
    estado.conexiones = [];
  }
}

function borrarGuardado() {
  try { localStorage.removeItem(CLAVE_ALMACEN); } catch (e) { /* sin almacenamiento */ }
}

/* ---------------- Biblioteca de grafos ---------------- */

/** Lista de grafos guardados, descartando las entradas dañadas. @returns {Array} */
function leerBiblioteca() {
  try {
    const crudo = localStorage.getItem(CLAVE_BIBLIOTECA);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];

    return datos
      .filter(g => g && typeof g.id === 'string' && typeof g.nombre === 'string')
      .map(g => {
        const limpio = depurarGrafo(g);
        if (!limpio) return null;
        return {
          id: g.id,
          nombre: g.nombre,
          fecha: typeof g.fecha === 'string' ? g.fecha : '',
          nodos: limpio.nodos,
          conexiones: limpio.conexiones,
          siguienteId: limpio.siguienteId
        };
      })
      .filter(g => g !== null);
  } catch (e) {
    return [];
  }
}

/** @returns {boolean} false si el navegador no pudo guardar (por ejemplo, sin espacio). */
function escribirBiblioteca(lista) {
  try {
    localStorage.setItem(CLAVE_BIBLIOTECA, JSON.stringify(lista));
    return true;
  } catch (e) {
    return false;
  }
}
