/* Registro de conocimiento de Algo. Sin red, sin almacenamiento, sin cálculo.
 * Cada archivo de tema llama a AlgoConocimiento.registrar([...entradas]).
 *
 * Entrada:
 *   id            identificador estable 'tema.nombre'
 *   tema          clave de TEMAS (categoría del explorador)
 *   modulos       módulos relacionados; ['*'] si aplica a todos
 *   pregunta      formulación principal (se muestra en el explorador)
 *   variantes     otras formulaciones completas
 *   conceptos     palabras clave y sinónimos reales (no equivalencias forzadas)
 *   breve         contestación directa (texto o función que recibe límites)
 *   sencilla      explicación con lenguaje llano (opcional)
 *   ejemplo       ejemplo pequeño y correcto (opcional)
 *   detalle       ampliación (opcional)
 *   relacionadas  ids de otras entradas
 *   comparar      { otroId: texto } comparaciones preparadas (opcional)
 *   referencia    control o regla del proyecto a la que se refiere (opcional)
 *   dinamica      nombre de la explicación dinámica que la resuelve (opcional) */
'use strict';

(() => {
  if (window.AlgoConocimiento) return;

  const TEMAS = {
    basicos: { titulo: 'Conceptos básicos', descripcion: 'Algoritmos, pasos, soluciones y complejidad explicados desde cero.' },
    matrices: { titulo: 'Matrices', descripcion: 'Filas, columnas, celdas y los tipos de matriz que usa la ciudad.' },
    grafos: { titulo: 'Grafos', descripcion: 'Nodos, conexiones, pesos, caminos, ciclos y árboles.' },
    johnson: { titulo: 'Johnson', descripcion: 'Distancias entre todos los pares con pesos negativos.' },
    dijkstra: { titulo: 'Dijkstra', descripcion: 'Caminos mínimos desde un origen.' },
    kruskal: { titulo: 'Kruskal', descripcion: 'Árbol o bosque de expansión mínimo o máximo.' },
    asignacion: { titulo: 'Asignación', descripcion: 'Método húngaro: recursos, tareas y parejas.' },
    northwest: { titulo: 'Esquina noroeste', descripcion: 'Solución inicial de transporte: oferta, demanda y ficticios.' },
    ordenamiento: { titulo: 'Ordenamiento', descripcion: 'Selection, Insertion, Bubble, Shell y Merge.' },
    arboles: { titulo: 'Árboles', descripcion: 'BST, recorridos y reconstrucción.' },
    difusa: { titulo: 'Lógica difusa', descripcion: 'Variables, pertenencias, reglas AND/OR con peso y centroide Mamdani.' },
    ejercicio: { titulo: 'Ejercicio actual', descripcion: 'Lo que estás viendo: paso, resultado, selección y datos pendientes.' },
    aplicacion: { titulo: 'Uso de la aplicación', descripcion: 'Módulos, controles, guardados, exportación e impresión.' },
    problemas: { titulo: 'Problemas frecuentes', descripcion: 'Qué revisar cuando algo no funciona como esperabas.' }
  };
  const GRUPOS = [
    { titulo: 'Conceptos básicos', temas: ['basicos'] },
    { titulo: 'Grafos y matrices', temas: ['grafos', 'matrices'] },
    { titulo: 'Algoritmos', temas: ['johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest', 'ordenamiento', 'arboles', 'difusa'] },
    { titulo: 'Ejercicio actual', temas: ['ejercicio'] },
    { titulo: 'Uso de la aplicación', temas: ['aplicacion'] },
    { titulo: 'Problemas frecuentes', temas: ['problemas'] }
  ];

  // Las cifras proceden de las constantes cargadas en la página. Solo las dos
  // constantes que viven en archivos de un módulo tienen respaldo aquí, y la
  // suite de conocimiento comprueba que coincidan con sus fuentes.
  const RESPALDO = { grafosMaxNodos: 24, grafosMaxAristas: 96, ordenamiento: { min: 1, max: 99, cantidadMin: 3, cantidadMax: 200 } };
  function limites() {
    /* global MAX_PESO, MAX_LARGO_NOMBRE, MAX_ASIGNACION_DIMENSION, MIN_ASIGNACION_DIMENSION, MAX_VALOR_ASIGNACION,
       MAX_LARGO_ETIQUETA_ASIGNACION, MAX_NORTHWEST_DIMENSION, MIN_NORTHWEST_DIMENSION, MAX_COSTO_NORTHWEST,
       ESCALA_COSTO_NORTHWEST, MAX_CANTIDAD_NORTHWEST, MAX_LARGO_ETIQUETA_NORTHWEST, MAX_NODOS_ARBOL, MIN_NODOS_ARBOL,
       MIN_VALOR_ARBOL, MAX_VALOR_ARBOL, MAX_TRABAJOS_POR_MODULO, MAX_ACCIONES_DESHACER, MAX_GRAFOS, GRAFOS_MAX_NODOS,
       GRAFOS_MAX_ARISTAS, LIMITES_ORDENAMIENTO */
    const ord = typeof LIMITES_ORDENAMIENTO !== 'undefined' ? LIMITES_ORDENAMIENTO : RESPALDO.ordenamiento;
    return {
      peso: typeof MAX_PESO !== 'undefined' ? MAX_PESO : 999999,
      nombreVertice: typeof MAX_LARGO_NOMBRE !== 'undefined' ? MAX_LARGO_NOMBRE : 12,
      grafosNodos: typeof GRAFOS_MAX_NODOS !== 'undefined' ? GRAFOS_MAX_NODOS : RESPALDO.grafosMaxNodos,
      grafosAristas: typeof GRAFOS_MAX_ARISTAS !== 'undefined' ? GRAFOS_MAX_ARISTAS : RESPALDO.grafosMaxAristas,
      asignacionMin: typeof MIN_ASIGNACION_DIMENSION !== 'undefined' ? MIN_ASIGNACION_DIMENSION : 1,
      asignacionMax: typeof MAX_ASIGNACION_DIMENSION !== 'undefined' ? MAX_ASIGNACION_DIMENSION : 8,
      asignacionValor: typeof MAX_VALOR_ASIGNACION !== 'undefined' ? MAX_VALOR_ASIGNACION : 999999,
      asignacionNombre: typeof MAX_LARGO_ETIQUETA_ASIGNACION !== 'undefined' ? MAX_LARGO_ETIQUETA_ASIGNACION : 24,
      northwestMin: typeof MIN_NORTHWEST_DIMENSION !== 'undefined' ? MIN_NORTHWEST_DIMENSION : 1,
      northwestMax: typeof MAX_NORTHWEST_DIMENSION !== 'undefined' ? MAX_NORTHWEST_DIMENSION : 10,
      northwestCosto: typeof MAX_COSTO_NORTHWEST !== 'undefined' ? MAX_COSTO_NORTHWEST : 999999,
      northwestDecimales: typeof ESCALA_COSTO_NORTHWEST !== 'undefined' ? String(ESCALA_COSTO_NORTHWEST).length - 1 : 2,
      northwestCantidad: typeof MAX_CANTIDAD_NORTHWEST !== 'undefined' ? MAX_CANTIDAD_NORTHWEST : 999999,
      northwestNombre: typeof MAX_LARGO_ETIQUETA_NORTHWEST !== 'undefined' ? MAX_LARGO_ETIQUETA_NORTHWEST : 40,
      arbolMin: typeof MIN_NODOS_ARBOL !== 'undefined' ? MIN_NODOS_ARBOL : 1,
      arbolMax: typeof MAX_NODOS_ARBOL !== 'undefined' ? MAX_NODOS_ARBOL : 31,
      arbolValorMin: typeof MIN_VALOR_ARBOL !== 'undefined' ? MIN_VALOR_ARBOL : -999,
      arbolValorMax: typeof MAX_VALOR_ARBOL !== 'undefined' ? MAX_VALOR_ARBOL : 999,
      ordenMin: ord.min, ordenMax: ord.max, ordenCantidadMin: ord.cantidadMin, ordenCantidadMax: ord.cantidadMax,
      trabajos: typeof MAX_TRABAJOS_POR_MODULO !== 'undefined' ? MAX_TRABAJOS_POR_MODULO : 50,
      deshacer: typeof MAX_ACCIONES_DESHACER !== 'undefined' ? MAX_ACCIONES_DESHACER : 50,
      grafosBiblioteca: typeof MAX_GRAFOS !== 'undefined' ? MAX_GRAFOS : 30
    };
  }

  const entradas = [];
  const porId = new Map();
  const problemas = [];
  const CAMPOS_TEXTO = ['breve', 'sencilla', 'ejemplo', 'detalle'];

  function registrar(lista) {
    (Array.isArray(lista) ? lista : []).forEach(e => {
      if (!e || typeof e.id !== 'string' || !e.id.trim()) { problemas.push('Entrada sin id'); return; }
      if (porId.has(e.id)) { problemas.push('Id duplicado: ' + e.id); return; }
      if (!TEMAS[e.tema]) problemas.push(e.id + ': tema desconocido ' + e.tema);
      if (typeof e.pregunta !== 'string' || !e.pregunta.trim()) problemas.push(e.id + ': falta la pregunta principal');
      if (!e.dinamica && (typeof e.breve !== 'string' && typeof e.breve !== 'function')) problemas.push(e.id + ': falta la respuesta breve');
      const entrada = Object.assign({ modulos: ['*'], variantes: [], conceptos: [], relacionadas: [] }, e);
      Object.freeze(entrada);
      entradas.push(entrada);
      porId.set(entrada.id, entrada);
    });
  }

  function texto(valor) {
    if (typeof valor === 'function') {
      try { return String(valor(limites()) || ''); } catch (error) { return ''; }
    }
    return typeof valor === 'string' ? valor : '';
  }

  function comprobarReferencias() {
    const avisos = [];
    entradas.forEach(e => {
      e.relacionadas.forEach(id => { if (!porId.has(id)) avisos.push(e.id + ' → relacionada inexistente ' + id); });
      Object.keys(e.comparar || {}).forEach(id => { if (!porId.has(id)) avisos.push(e.id + ' → comparación con inexistente ' + id); });
      CAMPOS_TEXTO.forEach(campo => { if (e[campo] !== undefined && !texto(e[campo])) avisos.push(e.id + ': el campo ' + campo + ' queda vacío'); });
    });
    return problemas.concat(avisos);
  }

  function porTema(tema) { return entradas.filter(e => e.tema === tema); }

  window.AlgoConocimiento = Object.freeze({
    TEMAS, GRUPOS, registrar, limites, texto, porTema, comprobarReferencias,
    entradas: () => entradas.slice(),
    porId: id => porId.get(id) || null
  });
})();
