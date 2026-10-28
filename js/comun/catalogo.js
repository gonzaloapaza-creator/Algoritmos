/* Catálogo central de algoritmos.
 *
 * El inicio y la navegación lateral se construyen a partir de esta lista: para
 * publicar un algoritmo nuevo basta con añadir una entrada aquí y crear su
 * página. Las entradas con `disponible: false` se muestran como "próximamente"
 * y no enlazan a ninguna ruta: nunca se publica como disponible algo que no existe.
 * `video` es el identificador de YouTube del video explicativo que se muestra antes
 * de entrar al algoritmo (js/comun/intro.js).
 */

'use strict';

const CATEGORIAS_ALGORITMOS = [
  { id: 'grafos', nombre: 'Grafos y rutas', descripcion: 'Johnson calcula caminos mínimos entre todos los pares y admite pesos negativos; Dijkstra parte de un origen con pesos no negativos; Kruskal conecta cada componente con peso total mínimo o máximo.' },
  { id: 'asignacion', nombre: 'Asignación', descripcion: 'Emparejar recursos con tareas al menor costo o mayor beneficio.' },
  { id: 'transporte', nombre: 'Transporte', descripcion: 'Distribuir oferta entre destinos con demanda.' },
  { id: 'arreglos', nombre: 'Ordenamiento', descripcion: 'Visualización de algoritmos de ordenamiento con arreglos y pinos de boliche.' },
  { id: 'arboles', nombre: 'Árboles', descripcion: 'Construcción, recorridos y reconstrucción de árboles binarios.' }
];

/* Iconos como contenido interno de un <svg viewBox="0 0 24 24"> con trazo currentColor. */
const ICONOS_ALGORITMOS = {
  grafo: '<circle cx="5" cy="17" r="2.8"/><circle cx="12" cy="6" r="2.8"/><circle cx="19" cy="15" r="2.8"/><path d="M7.2 15.3 10.5 8.5l5.6 4.7"/>',
  navegacion: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.5 12H12m0 0 5-6m-5 6 5 6M13 6h4v4m-4 8h4v-4"/>',
  conexiones: '<circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.5 5h9M5 7.5v9m2.5 2.5h9"/>',
  bipartito: '<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="12" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6h7.2M8.4 12l7.2 6M8.4 18l7.2-6"/>',
  tabla: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M3.5 15h17M9 4v16M15 4v16"/>',
  esquina: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M3.5 15h17M9.5 4v16M15 4v16"/><rect x="4.5" y="5" width="4" height="4" rx="1" fill="currentColor" stroke="none"/>',
  ordenamiento: '<path d="M4 20h16M6 16v4M12 8v12M18 12v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  arbol: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 7.5v4m0 0-6 4m6-4 6 4"/>'
};

const CATALOGO_ALGORITMOS = [
  {
    id: 'ordenamiento',
    zona: 'Planta clasificadora',
    etiqueta: 'Ordenamiento · Cinco métodos',
    distrito: 'arreglos',
    escena: 'clasificadora',
    color: '#eba2c4', colorClaro: '#a33669', colorFuerte: '#f4c0d8',
    nombre: 'Ordenamiento (Bowling)',
    corto: 'Ordenamiento',
    categoria: 'arreglos',
    descripcion: 'Visualización paso a paso de Selection, Insertion, Bubble, Shell y Merge Sort usando pinos de boliche, pseudocódigo y contadores.',
    entrada: 'Lista de enteros (propia o al azar) y algoritmo',
    resultado: 'Elementos ordenados ascendentemente',
    ruta: 'ordenamiento.html',
    icono: 'ordenamiento',
    metodos: ['Selection Sort', 'Insertion Sort', 'Bubble Sort', 'Shell Sort', 'Merge Sort'],
    video: 'd5tujF0y5TE',
    disponible: true
  },
  {
    id: 'arboles',
    zona: 'Jardín de estructuras',
    etiqueta: 'Árboles · Estructuras y recorridos',
    distrito: 'arboles',
    escena: 'jardin',
    color: '#88c7a2', colorClaro: '#32764a', colorFuerte: '#b0e0c3',
    nombre: 'Árboles binarios',
    corto: 'Árboles',
    categoria: 'arboles',
    descripcion: 'Descubre cómo crecen los árboles binarios: agrega valores, explora sus recorridos y reconstruye el árbol a partir de sus secuencias.',
    entrada: 'Valores únicos o recorridos preorden, inorden y postorden',
    resultado: 'Árbol interactivo y recorridos explicados paso a paso',
    ruta: 'arboles.html',
    icono: 'arbol',
    video: 'tBaOQeyXYqg',
    disponible: true
  },
  {
    id: 'johnson',
    zona: 'Estación de rutas',
    etiqueta: 'Johnson · Todos los pares',
    distrito: 'grafos',
    escena: 'estacion',
    color: '#ac9bfa', colorClaro: '#6550b6', colorFuerte: '#c8bafa',
    nombre: 'Algoritmo de Johnson',
    corto: 'Johnson',
    categoria: 'grafos',
    descripcion: 'Rutas mínimas entre todos los pares de nodos de un grafo dirigido, admitiendo pesos negativos y detectando ciclos negativos.',
    entrada: 'Grafo dirigido con pesos enteros',
    resultado: 'Matriz de distancias y rutas',
    ruta: 'johnson.html',
    icono: 'grafo',
    video: 'jkJd1UjUdAo',
    disponible: true
  },
  {
    id: 'dijkstra',
    zona: 'Centro de navegación',
    etiqueta: 'Dijkstra · Desde un origen',
    distrito: 'grafos',
    escena: 'navegacion',
    color: '#69d4df', colorClaro: '#147481', colorFuerte: '#a4edf2',
    nombre: 'Algoritmo de Dijkstra',
    corto: 'Dijkstra',
    categoria: 'grafos',
    descripcion: 'Caminos mínimos desde un origen a todos los vértices de un grafo dirigido o no dirigido, con pesos no negativos. Selecciona un destino para destacar su ruta.',
    entrada: 'Grafo con pesos enteros no negativos y origen',
    resultado: 'Distancias desde el origen y ruta al destino',
    ruta: 'dijkstra.html',
    icono: 'navegacion',
    video: 'UnsRfl6xw2o',
    disponible: true
  },
  {
    id: 'kruskal',
    zona: 'Central de conexiones',
    etiqueta: 'Kruskal · Árbol y bosque',
    distrito: 'grafos',
    escena: 'conexiones',
    color: '#dfca78', colorClaro: '#806b1a', colorFuerte: '#f2e0a0',
    nombre: 'Algoritmo de Kruskal',
    corto: 'Kruskal',
    categoria: 'grafos',
    descripcion: 'Conecta cada componente de un grafo no dirigido con un árbol de expansión de peso mínimo o máximo, descartando enlaces que crean ciclos. Admite pesos negativos.',
    entrada: 'Grafo no dirigido ponderado y objetivo mínimo/máximo',
    resultado: 'Árbol o bosque de expansión y peso total',
    ruta: 'kruskal.html',
    icono: 'conexiones',
    video: 'Wo-Pk0Iq3oU',
    disponible: true
  },
  {
    id: 'asignacion',
    zona: 'Centro de coordinación',
    etiqueta: 'Asignación · Método húngaro',
    distrito: 'asignacion',
    escena: 'coordinacion',
    color: '#80b8fc', colorClaro: '#2863a8', colorFuerte: '#b1d3ff',
    nombre: 'Asignación (método húngaro)',
    corto: 'Asignación',
    categoria: 'asignacion',
    descripcion: 'Empareja recursos con tareas a partir de un grafo bipartito con costos o beneficios, con el procedimiento completo del método húngaro.',
    entrada: 'Grafo bipartito o matriz de costos',
    resultado: 'Asignación óptima y total',
    ruta: 'asignacion.html',
    icono: 'bipartito',
    video: '_XvIC2KvWvo',
    disponible: true
  },
  {
    id: 'northwest',
    zona: 'Centro logístico',
    etiqueta: 'Northwest · Esquina noroeste',
    distrito: 'transporte',
    escena: 'logistica',
    color: '#f4b773', colorClaro: '#965312', colorFuerte: '#ffd4a1',
    nombre: 'Esquina noroeste',
    corto: 'Northwest',
    categoria: 'transporte',
    descripcion: 'Solución inicial factible para el problema de transporte, paso a paso. No garantiza el costo mínimo.',
    entrada: 'Matriz de costos, oferta y demanda',
    resultado: 'Solución inicial factible',
    ruta: 'northwest.html',
    icono: 'esquina',
    video: 'HjXWStUh0yE',
    disponible: true
  }
];

function categoriaPorId(id) {
  return CATEGORIAS_ALGORITMOS.find(c => c.id === id) || null;
}

function algoritmoPorId(id) {
  return CATALOGO_ALGORITMOS.find(a => a.id === id) || null;
}

/** Devuelve [{ categoria, algoritmos }] respetando el orden de CATEGORIAS_ALGORITMOS. */
function agruparCatalogo(lista) {
  const fuente = lista || CATALOGO_ALGORITMOS;
  return CATEGORIAS_ALGORITMOS
    .map(categoria => ({ categoria, algoritmos: fuente.filter(a => a.categoria === categoria.id) }))
    .filter(grupo => grupo.algoritmos.length > 0);
}

/**
 * Entradas ficticias para comprobar que la navegación y el inicio soportan un
 * catálogo largo. Se marcan como no disponibles y solo se usan al abrir el inicio
 * con ?simular=N. Nunca forman parte del catálogo real.
 */
function catalogoSimulado(cantidad) {
  const base = CATALOGO_ALGORITMOS.slice();
  const ids = CATEGORIAS_ALGORITMOS.map(c => c.id);
  for (let i = 0; base.length < cantidad; i++) {
    base.push({
      id: 'simulado_' + (i + 1),
      nombre: 'Algoritmo de prueba ' + (i + 1),
      corto: 'Prueba ' + (i + 1),
      categoria: ids[i % ids.length],
      descripcion: 'Entrada simulada para verificar el diseño con un catálogo largo. No corresponde a ningún algoritmo implementado.',
      entrada: 'Datos de ejemplo',
      resultado: 'Sin implementar',
      ruta: '',
      icono: 'tabla',
      disponible: false
    });
  }
  return base;
}
