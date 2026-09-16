/* Configuración y constantes centralizadas del proyecto */

'use strict';

// Constantes de grafos y visualización
const RADIO_NODO = 26;
const SEPARACION_ARROW = 4;
const CURVATURA = 34;
const MAX_LARGO_NOMBRE = 12;
const MAX_PESO = 999999;
const ERROR_PESO = 'El peso debe ser un número entero.';

// Constantes de biblioteca
const MAX_GRAFOS = 30;
const MAX_LARGO_NOMBRE_GRAFO = 40;

// Constantes de asignación
const MAX_ASIGNACION_DIMENSION = 8;
const MIN_ASIGNACION_DIMENSION = 1;

// Constantes de almacenamiento
const CLAVE_ALMACEN = 'grafo.v1';
const CLAVE_BIBLIOTECA = 'grafo.biblioteca.v1';
const ASIGNACION_STORAGE_KEY = 'asignacion.v1';

// Constantes de UI
const TIMEOUT_AVISO = 2600;
const TIMEOUT_TOAST = 2200;
const FANTASMO_CLICK_TIMEOUT = 350;
const MODAL_FOCUS_DELAY = 30;

// Constantes de zoom
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

// Constantes de historial
const MAX_ACCIONES_DESHACER = 50;

// Textos de símbolos
const SIN_CAMINO = '∞';
const SIN_CONEXION = '—';

// SVG namespace
const SVG_NS = 'http://www.w3.org/2000/svg';

// Herramientas disponibles
const HERRAMIENTAS = {
  SELECCIONAR: 'seleccionar',
  NODO: 'nodo',
  CONECTAR: 'conectar'
};

// Tipos de selección
const TIPOS_SELECCION = {
  NODO: 'nodo',
  CONEXION: 'conexion'
};

// Tipos de visualización Johnson
const TIPOS_VISUALIZACION = {
  RUTA: 'ruta',
  CICLO: 'ciclo'
};

// Tipos de avisos
const TIPOS_AVISO = {
  OK: 'ok',
  ERROR: 'error'
};

// Objetivos de asignación
const OBJETIVOS_ASIGNACION = {
  MIN: 'min',
  MAX: 'max'
};

// Asegurar que las constantes estén disponibles globalmente
if (typeof window !== 'undefined') {
  window.CONFIG = {
    RADIO_NODO,
    SEPARACION_ARROW,
    CURVATURA,
    MAX_LARGO_NOMBRE,
    MAX_PESO,
    ERROR_PESO,
    MAX_GRAFOS,
    MAX_LARGO_NOMBRE_GRAFO,
    MAX_ASIGNACION_DIMENSION,
    MIN_ASIGNACION_DIMENSION,
    CLAVE_ALMACEN,
    CLAVE_BIBLIOTECA,
    ASIGNACION_STORAGE_KEY,
    TIMEOUT_AVISO,
    TIMEOUT_TOAST,
    FANTASMO_CLICK_TIMEOUT,
    MODAL_FOCUS_DELAY,
    ZOOM_MIN,
    ZOOM_MAX,
    ZOOM_STEP,
    MAX_ACCIONES_DESHACER,
    SIN_CAMINO,
    SIN_CONEXION,
    SVG_NS,
    HERRAMIENTAS,
    TIPOS_SELECCION,
    TIPOS_VISUALIZACION,
    TIPOS_AVISO,
    OBJETIVOS_ASIGNACION
  };
  
  // También hacer las constantes disponibles directamente en window
  window.RADIO_NODO = RADIO_NODO;
  window.SEPARACION_ARROW = SEPARACION_ARROW;
  window.CURVATURA = CURVATURA;
  window.MAX_LARGO_NOMBRE = MAX_LARGO_NOMBRE;
  window.MAX_PESO = MAX_PESO;
  window.ERROR_PESO = ERROR_PESO;
  window.MAX_GRAFOS = MAX_GRAFOS;
  window.MAX_LARGO_NOMBRE_GRAFO = MAX_LARGO_NOMBRE_GRAFO;
  window.MAX_ASIGNACION_DIMENSION = MAX_ASIGNACION_DIMENSION;
  window.MIN_ASIGNACION_DIMENSION = MIN_ASIGNACION_DIMENSION;
  window.CLAVE_ALMACEN = CLAVE_ALMACEN;
  window.CLAVE_BIBLIOTECA = CLAVE_BIBLIOTECA;
  window.ASIGNACION_STORAGE_KEY = ASIGNACION_STORAGE_KEY;
  window.TIMEOUT_AVISO = TIMEOUT_AVISO;
  window.TIMEOUT_TOAST = TIMEOUT_TOAST;
  window.FANTASMO_CLICK_TIMEOUT = FANTASMO_CLICK_TIMEOUT;
  window.MODAL_FOCUS_DELAY = MODAL_FOCUS_DELAY;
  window.ZOOM_MIN = ZOOM_MIN;
  window.ZOOM_MAX = ZOOM_MAX;
  window.ZOOM_STEP = ZOOM_STEP;
  window.MAX_ACCIONES_DESHACER = MAX_ACCIONES_DESHACER;
  window.SIN_CAMINO = SIN_CAMINO;
  window.SIN_CONEXION = SIN_CONEXION;
  window.SVG_NS = SVG_NS;
}