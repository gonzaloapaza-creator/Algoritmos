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
  // Ids repetidos: las conexiones serían ambiguas; no se adivina cuál era el nodo real.
  if (ids.size !== nodos.length) return null;
  // El peso solo tiene que ser entero dentro del rango de la interfaz: el cero y los negativos son válidos.
  const conexiones = datos.conexiones
    .filter(c => c && typeof c.id === 'string' && ids.has(c.desde) && ids.has(c.hacia) &&
                 Number.isInteger(c.valor) && Math.abs(c.valor) <= MAX_PESO)
    .map(c => ({ id: c.id, desde: c.desde, hacia: c.hacia, valor: c.valor }));
  if (new Set(conexiones.map(c => c.id)).size !== conexiones.length) return null;

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

/**
 * Validación estricta para importar un grafo (archivo JSON o «Mis trabajos»).
 * A diferencia de depurarGrafo(), no descarta nada en silencio: devuelve la lista
 * de problemas para que el usuario corrija el archivo y el grafo abierto quede intacto.
 * Aplica las mismas reglas que la interfaz (nombres únicos de hasta MAX_LARGO_NOMBRE
 * caracteres, pesos enteros entre -MAX_PESO y MAX_PESO).
 * @param {Object} datos - { nodos, conexiones, siguienteId }
 * @returns {{ok:true, grafo:Object}|{ok:false, errores:string[]}}
 */
function validarGrafoImportado(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object' || !Array.isArray(datos.nodos) || !Array.isArray(datos.conexiones)) {
    return { ok: false, errores: ['El archivo no contiene las listas «nodos» y «conexiones».'] };
  }
  const ids = new Set(), nombres = new Set();
  datos.nodos.forEach((n, i) => {
    const ref = 'Nodo ' + (i + 1);
    if (!n || typeof n.id !== 'string' || n.id === '') { errores.push(ref + ': falta el identificador.'); return; }
    if (ids.has(n.id)) errores.push(ref + ': identificador «' + n.id + '» repetido.');
    ids.add(n.id);
    const nombre = typeof n.nombre === 'string' ? n.nombre.trim() : '';
    if (nombre === '') errores.push(ref + ' (' + n.id + '): el nombre está vacío.');
    else if (nombre.length > MAX_LARGO_NOMBRE) errores.push(ref + ' (' + n.id + '): nombre de más de ' + MAX_LARGO_NOMBRE + ' caracteres.');
    else if (nombres.has(nombre.toLowerCase())) errores.push(ref + ' (' + n.id + '): el nombre «' + nombre + '» está repetido.');
    nombres.add(nombre.toLowerCase());
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) errores.push(ref + ' (' + n.id + '): posición no numérica.');
  });
  const idsConexion = new Set(), parejas = new Set();
  datos.conexiones.forEach((c, i) => {
    const ref = 'Conexión ' + (i + 1);
    if (!c || typeof c.id !== 'string' || c.id === '') { errores.push(ref + ': falta el identificador.'); return; }
    if (idsConexion.has(c.id)) errores.push(ref + ': identificador «' + c.id + '» repetido.');
    idsConexion.add(c.id);
    const pareja = JSON.stringify([c.desde, c.hacia]);
    if (parejas.has(pareja)) errores.push(ref + ': conexión repetida entre el mismo origen y destino.');
    parejas.add(pareja);
    if (!ids.has(c.desde)) errores.push(ref + ' (' + c.id + '): el nodo de origen «' + c.desde + '» no existe.');
    if (!ids.has(c.hacia)) errores.push(ref + ' (' + c.id + '): el nodo de destino «' + c.hacia + '» no existe.');
    if (!Number.isInteger(c.valor)) errores.push(ref + ' (' + c.id + '): el peso debe ser un número entero.');
    else if (Math.abs(c.valor) > MAX_PESO) errores.push(ref + ' (' + c.id + '): el peso debe estar entre -' + MAX_PESO + ' y ' + MAX_PESO + '.');
  });
  if (errores.length) return { ok: false, errores };
  return { ok: true, grafo: depurarGrafo(datos) };
}

/** Reemplaza el grafo en pantalla por uno ya depurado. */
function aplicarGrafo(limpio) {
  estado.nodos = limpio.nodos;
  estado.conexiones = limpio.conexiones;
  estado.siguienteId = limpio.siguienteId;
  estado.seleccion = null;
  estado.origenConexion = null;
  // También al cargar un trabajo nombrado: ajustar la vista nunca altera el grafo.
  if (typeof restablecerZoomSilencioso === 'function' && area().ancho >= 50 && area().alto >= 50) {
    restablecerZoomSilencioso();
  }
}

/**
 * Guarda el grafo actual en localStorage (autoguardado).
 * Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando.
 */
function guardar() {
  // Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando y se avisa una sola vez.
  escribirAlmacenamientoLocal(CLAVE_ALMACEN, JSON.stringify(instantaneaGrafo()), { respaldo: 'usa «Más → Exportar JSON»' });
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
