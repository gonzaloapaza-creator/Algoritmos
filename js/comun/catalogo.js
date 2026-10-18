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
  { id: 'grafos', nombre: 'Grafos y rutas', descripcion: 'Caminos mínimos y análisis sobre grafos dirigidos.' },
  { id: 'asignacion', nombre: 'Asignación', descripcion: 'Emparejar recursos con tareas al menor costo o mayor beneficio.' },
  { id: 'transporte', nombre: 'Transporte', descripcion: 'Distribuir oferta entre destinos con demanda.' },
  { id: 'arreglos', nombre: 'Ordenamiento', descripcion: 'Visualización de algoritmos de ordenamiento con arreglos y pinos de boliche.' },
  { id: 'arboles', nombre: 'Árboles', descripcion: 'Construcción, recorridos y reconstrucción de árboles binarios.' }
];

/* Iconos como contenido interno de un <svg viewBox="0 0 24 24"> con trazo currentColor. */
const ICONOS_ALGORITMOS = {
  grafo: '<circle cx="5" cy="17" r="2.8"/><circle cx="12" cy="6" r="2.8"/><circle cx="19" cy="15" r="2.8"/><path d="M7.2 15.3 10.5 8.5l5.6 4.7"/>',
  bipartito: '<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="12" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6h7.2M8.4 12l7.2 6M8.4 18l7.2-6"/>',
  tabla: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M3.5 15h17M9 4v16M15 4v16"/>',
  esquina: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M3.5 15h17M9.5 4v16M15 4v16"/><rect x="4.5" y="5" width="4" height="4" rx="1" fill="currentColor" stroke="none"/>',
  ordenamiento: '<path d="M4 20h16M6 16v4M12 8v12M18 12v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  arbol: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 7.5v4m0 0-6 4m6-4 6 4"/>'
};

const CATALOGO_ALGORITMOS = [
  {
    id: 'ordenamiento',
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
    id: 'asignacion',
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
    nombre: 'Esquina noroeste',
    corto: 'Esquina noroeste',
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
