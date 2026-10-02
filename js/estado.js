/* Estado de la aplicación, referencias del documento y validaciones. */

'use strict';

// Las constantes ahora vienen de config.js

const estado = {
  nodos: [],
  conexiones: [],
  siguienteId: 1,
  herramienta: 'seleccionar',
  seleccion: null,        
  origenConexion: null,
  /**
   * Resaltado del resultado de Johnson. Vale null cuando no hay nada resaltado y,
   * cuando lo hay: { origen, destino, nodos, conexiones, distancia, tipo, firma }, donde
   * nodos y conexiones son ids del grafo, tipo es 'ruta' o 'ciclo' y firma es la del
   * grafo en el que se calculó: si el grafo cambia, el resaltado se descarta solo.
   * Es SOLO visual: instantaneaGrafo() no lo copia, así que no llega al
   * almacenamiento ni a la biblioteca de grafos.
   */
  visualizacionJohnson: null,
  
  /**
   * Ventana de visualización: pantalla = logico * escala + offset.
   * No se guarda con el grafo, es solo la vista actual.
   */
  zoom: {
    escala: 1,
    offsetX: 0,
    offsetY: 0
  },
  
  // Sistema de deshacer/rehacer
  historial: {
    pasado: [],
    futuro: []
  }
};

const el = {
  lienzo: document.getElementById('lienzo'),
  svg: document.getElementById('svg'),
  capaNodos: document.getElementById('capaNodos'),
  capaConexiones: document.getElementById('capaConexiones'),
  ayuda: document.getElementById('ayuda'),
  vacio: document.getElementById('vacio'),
  avisos: document.getElementById('avisos'),
  panel: document.getElementById('panel'),
  panelTitulo: document.getElementById('panelTitulo'),
  panelDetalle: document.getElementById('panelDetalle'),
  btnEditar: document.getElementById('btnEditar'),
  btnEliminar: document.getElementById('btnEliminar'),
  btnCerrarPanel: document.getElementById('btnCerrarPanel'),
  btnLimpiar: document.getElementById('btnLimpiar'),
  btnEmpezar: document.getElementById('btnEmpezar'),
  btnAyuda: document.getElementById('btnAyuda'),
  btnVacioEjemplo: document.getElementById('btnVacioEjemplo'),
  botonesHerramienta: document.querySelectorAll('.btn-herramienta'),
  matrizTabla: document.getElementById('matrizTabla'),
  btnJohnson: document.getElementById('btnJohnson'),
  johnsonEstado: document.getElementById('johnsonEstado'),
  johnsonTabla: document.getElementById('johnsonTabla'),
  btnEjemplos: document.getElementById('btnEjemplos'),
  ejemplosFondo: document.getElementById('ejemplosFondo'),
  ejemplosLista: document.getElementById('ejemplosLista'),
  btnCerrarEjemplos: document.getElementById('btnCerrarEjemplos'),
  btnDeshacer: document.getElementById('btnDeshacer'),
  btnRehacer: document.getElementById('btnRehacer'),
  btnGuardar: document.getElementById('btnGuardar'),
  btnBiblioteca: document.getElementById('btnBiblioteca'),
  btnGuardarActual: document.getElementById('btnGuardarActual'),
  btnCerrarBiblioteca: document.getElementById('btnCerrarBiblioteca'),
  bibliotecaFondo: document.getElementById('bibliotecaFondo'),
  bibliotecaLista: document.getElementById('bibliotecaLista'),
  modalFondo: document.getElementById('modalFondo'),
  modal: document.querySelector('.modal'),
  modalTitulo: document.getElementById('modalTitulo'),
  modalMensaje: document.getElementById('modalMensaje'),
  modalCampo: document.getElementById('modalCampo'),
  modalInput: document.getElementById('modalInput'),
  modalError: document.getElementById('modalError'),
  modalAceptar: document.getElementById('modalAceptar'),
  modalCancelar: document.getElementById('modalCancelar')
};

/**
 * Busca un nodo por su ID en el estado actual.
 * @param {string} id - El ID del nodo a buscar
 * @returns {Object|null} El nodo encontrado o null si no existe
 */
function buscarNodo(id) {
  return estado.nodos.find(n => n.id === id) || null;
}

/**
 * Busca una conexión por su ID en el estado actual.
 * @param {string} id - El ID de la conexión a buscar
 * @returns {Object|null} La conexión encontrada o null si no existe
 */
function buscarConexion(id) {
  return estado.conexiones.find(c => c.id === id) || null;
}

/**
 * Busca la conexión que va de un nodo a otro (la dirección importa).
 * @param {string} desde - ID del nodo de origen
 * @param {string} hacia - ID del nodo de destino
 * @returns {Object|null} La conexión encontrada o null si no existe
 */
function buscarConexionEntre(desde, hacia) {
  return estado.conexiones.find(c => c.desde === desde && c.hacia === hacia) || null;
}

/**
 * Genera un identificador interno único.
 * @param {string} prefijo - Prefijo para el ID (ej: 'n' para nodos, 'c' para conexiones)
 * @returns {string} Un ID único en formato prefijo_número
 */
function nuevoId(prefijo) {
  return prefijo + '_' + (estado.siguienteId++);
}

/**
 * Convierte un índice numérico a letras (ej: 0->'a', 1->'b', 26->'aa').
 * @param {number} indice - El índice numérico a convertir
 * @returns {string} La representación en letras del índice
 */
function nombrePorIndice(indice) {
  let nombre = '';
  let n = indice;
  do {
    nombre = String.fromCharCode(97 + (n % 26)) + nombre; // 97=> 65 para mayuscula
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return nombre;
}

/**
 * Genera el primer nombre automático que todavía no esté en uso.
 * @returns {string} Un nombre disponible para un nuevo nodo
 */
function nombreAutomatico() {
  const usados = new Set(estado.nodos.map(n => n.nombre));
  let i = 0;
  while (usados.has(nombrePorIndice(i))) i++;
  return nombrePorIndice(i);
}

/**
 * Valida el nombre de un nodo.
 * @param {string} texto - El texto a validar
 * @param {string} idNodoActual - ID del nodo actual (para permitir nombres duplicados en el mismo nodo)
 * @returns {{ok:boolean, valor?:string, error?:string}} Objeto con resultado de validación
 */
function validarNombre(texto, idNodoActual) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: false, error: 'El nombre no puede estar vacío.' };
  if (limpio.length > MAX_LARGO_NOMBRE) {
    return { ok: false, error: 'El nombre es demasiado largo (máximo ' + MAX_LARGO_NOMBRE + ' caracteres).' };
  }
  const repetido = estado.nodos.some(n => n.id !== idNodoActual && n.nombre.toLowerCase() === limpio.toLowerCase());
  if (repetido) return { ok: false, error: 'El nombre ya existe. Escribe uno diferente.' };
  return { ok: true, valor: limpio };
}

// Las constantes MAX_PESO y ERROR_PESO ahora vienen de config.js

/**
 * Valida el valor/peso de una conexión.
 * El peso admite negativos y cero, porque Johnson trabaja con pesos negativos.
 * La expresión /^-?\d+$/ exige dígitos con un signo menos opcional, así que
 * descarta el texto, el campo vacío, los decimales y la notación científica.
 * NaN e Infinity tampoco pasan: no son secuencias de dígitos.
 * @param {string} texto - El texto a validar
 * @returns {{ok:boolean, valor?:number, error?:string}} Objeto con resultado de validación
 */
function validarValor(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (!/^-?\d+$/.test(limpio)) {
    return { ok: false, error: ERROR_PESO };
  }
  const numero = Number(limpio);
  if (!Number.isInteger(numero)) {
    return { ok: false, error: ERROR_PESO };
  }
  if (Math.abs(numero) > MAX_PESO) {
    return { ok: false, error: 'El peso debe estar entre -' + MAX_PESO + ' y ' + MAX_PESO + '.' };
  }
  return { ok: true, valor: numero };
}

/**
 * Mantiene un valor dentro de un rango especificado.
 * @param {number} valor - El valor a limitar
 * @param {number} minimo - El valor mínimo permitido
 * @param {number} maximo - El valor máximo permitido
 * @returns {number} El valor limitado al rango especificado
 */
function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

let cajaSVG = null;

/**
 * Mide el área de trabajo y guarda el resultado.
 * Medir provoca un recálculo del diseño, así que no debe hacerse en cada movimiento del dedo.
 */
function medirArea() {
  const caja = el.svg.getBoundingClientRect();
  const medida = { ancho: caja.width, alto: caja.height, izquierda: caja.left, arriba: caja.top };
  // Con el editor oculto (otra vista o la presentación) mide 0: se conserva la
  // última medida útil para que la geometría de las conexiones no se deforme.
  if (!cajaSVG || (medida.ancho >= 50 && medida.alto >= 50)) cajaSVG = medida;
  return medida;
}

function area() {
  return cajaSVG || medirArea();
}

/** Coloca los nodos dentro del área visible. Devuelve true si movió alguno. */
function ajustarNodosAlArea() {
  const a = area();
  const maxX = Math.max(RADIO_NODO, a.ancho - RADIO_NODO);
  const maxY = Math.max(RADIO_NODO, a.alto - RADIO_NODO);
  const minX = RADIO_NODO;
  const minY = RADIO_NODO;
  let cambio = false;

  estado.nodos.forEach(nodo => {
    const x = limitar(nodo.x, minX, maxX);
    const y = limitar(nodo.y, minY, maxY);
    if (x !== nodo.x || y !== nodo.y) { nodo.x = x; nodo.y = y; cambio = true; }
  });

  return cambio;
}
