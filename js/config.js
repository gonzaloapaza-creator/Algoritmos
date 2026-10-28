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
const MAX_VALOR_ASIGNACION = 999999;
const MAX_LARGO_ETIQUETA_ASIGNACION = 24;

// Constantes de transporte (esquina noroeste). Son límites de esta aplicación,
// no del método: el algoritmo funciona con cualquier tamaño y cantidades reales.
const MAX_NORTHWEST_DIMENSION = 10;
const MIN_NORTHWEST_DIMENSION = 1;
const MAX_COSTO_NORTHWEST = 999999;        // costo unitario máximo (antes de escalar)
const ESCALA_COSTO_NORTHWEST = 100;        // los costos se guardan como enteros × 100 (2 decimales)
const MAX_CANTIDAD_NORTHWEST = 999999;     // oferta o demanda máxima por elemento
const MAX_LARGO_ETIQUETA_NORTHWEST = 40;

// Constantes de almacenamiento
const CLAVE_ALMACEN = 'grafo.v1';
const CLAVE_BIBLIOTECA = 'grafo.biblioteca.v1';
const ASIGNACION_STORAGE_KEY = 'asignacion.v1';          // formato antiguo: solo se lee para migrar
const ASIGNACION_STORAGE_KEY_V2 = 'asignacion.v2';
const NORTHWEST_STORAGE_KEY = 'northwest.v1';
const ARBOLES_STORAGE_KEY = 'arboles.v1';
const ORDENAMIENTO_STORAGE_KEY = 'ordenamiento.v1';
const DIJKSTRA_STORAGE_KEY = 'dijkstra.v1';
const KRUSKAL_STORAGE_KEY = 'kruskal.v1';
const CLAVE_TRABAJOS = 'algoritmos.trabajos.v1';         // biblioteca de trabajos nombrados (todos los módulos)
const MAX_TRABAJOS_POR_MODULO = 50;
const MIN_NODOS_ARBOL = 1;
const MAX_NODOS_ARBOL = 31;
const MIN_VALOR_ARBOL = -999;
const MAX_VALOR_ARBOL = 999;

// Constantes de UI
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

// Las constantes anteriores son `const` de nivel superior en un script clásico:
// quedan visibles para todos los demás scripts de la página sin copiarlas a `window`.
