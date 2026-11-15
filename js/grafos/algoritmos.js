/* Núcleos puros: sin DOM, almacenamiento ni controladores de otras páginas. */
'use strict';

/**
 * Dijkstra con lista de adyacencia y barrido lineal de pendientes: O(V² + E).
 * Desempata por orden de nodos y después por orden original de conexiones;
 * una igualdad no sustituye el primer predecesor encontrado.
 * El historial didáctico copia O(V) datos por paso: O((V + E)V) espacio.
 */
function resolverDijkstraGrafo(grafo, origen) {
  const validacion = validarGrafoModulo(grafo, 'dijkstra');
  if (!validacion.ok) throw new Error(validacion.error);
  const datos = validacion.grafo;
  if (!datos.nodos.length) throw new Error('Crea al menos un nodo antes de calcular.');
  if (!datos.nodos.some(n => n.id === origen)) throw new Error('Selecciona un origen válido.');
  const ids = datos.nodos.map(n => n.id);
  const distancias = Object.create(null);
  const predecesores = Object.create(null);
  const adyacencia = new Map(ids.map(id => [id, []]));
  ids.forEach(id => { distancias[id] = Infinity; predecesores[id] = null; });
  datos.conexiones.forEach(c => {
    adyacencia.get(c.desde).push({ hacia: c.hacia, conexion: c.id, valor: c.valor });
    if (!datos.dirigido) adyacencia.get(c.hacia).push({ hacia: c.desde, conexion: c.id, valor: c.valor });
  });
  distancias[origen] = 0;
  const finalizados = new Set();
  const exploradas = new Set();
  const pasos = [];
  const registrar = (tipo, detalle = {}) => pasos.push(Object.assign({
    tipo, actual: null, arista: null, anterior: null, candidata: null, mejora: false,
    distancias: Object.assign(Object.create(null), distancias),
    predecesores: Object.fromEntries(ids.map(id => [id, predecesores[id] ? Object.assign({}, predecesores[id]) : null])),
    finalizados: ids.filter(id => finalizados.has(id)),
    pendientes: ids.filter(id => !finalizados.has(id))
  }, detalle));
  registrar('inicio', { explicacion: 'Distancia 0 en el origen e infinito en los demás. Los pendientes se recorren por barrido lineal.' });
  while (finalizados.size < ids.length) {
    let actual = null;
    let menor = Infinity;
    for (const id of ids) {
      if (!finalizados.has(id) && distancias[id] < menor) {
        actual = id;
        menor = distancias[id];
      }
    }
    if (actual === null) break;
    finalizados.add(actual);
    registrar('seleccion', { actual, explicacion: 'Se finaliza el pendiente con menor distancia; los empates siguen el orden de nodos.' });
    for (const arista of adyacencia.get(actual)) {
      if (finalizados.has(arista.hacia)) continue;
      const anterior = distancias[arista.hacia];
      const candidata = distancias[actual] + arista.valor;
      const mejora = candidata < anterior;
      exploradas.add(arista.conexion);
      if (mejora) {
        distancias[arista.hacia] = candidata;
        predecesores[arista.hacia] = { nodo: actual, conexion: arista.conexion };
      }
      registrar('relajacion', { actual, desde: actual, hacia: arista.hacia, arista: arista.conexion, anterior, candidata, mejora,
        explicacion: mejora ? 'La candidata es menor: cambian distancia y predecesor.' : 'La candidata no es menor: se conserva la distancia.' });
    }
  }
  registrar('final', { explicacion: 'No quedan pendientes alcanzables. Las distancias infinitas indican que no existe camino.' });
  const idsArbol = new Set(ids.filter(id => predecesores[id]).map(id => predecesores[id].conexion));
  return { origen, objetivo: 'min', grafo: datos, distancias, predecesores, pasos, arbol: datos.conexiones.filter(c => idsArbol.has(c.id)).map(c => c.id), exploradas: Array.from(exploradas) };
}

/**
 * Camino de peso máximo desde un origen en un DAG, mediante orden topológico.
 * A diferencia de Dijkstra, no finaliza por distancias crecientes: relaja cada
 * arista una vez en orden topológico, por lo que también admite pesos cero.
 */
function resolverCaminoMaximoDAG(grafo, origen) {
  const validacion = validarGrafoModulo(grafo, 'dijkstra');
  if (!validacion.ok) throw new Error(validacion.error);
  const datos = validacion.grafo;
  if (!datos.nodos.length) throw new Error('Crea al menos un nodo antes de calcular.');
  if (!datos.dirigido) throw new Error('El camino máximo solo está disponible para grafos dirigidos acíclicos.');
  if (!datos.nodos.some(n => n.id === origen)) throw new Error('Selecciona un origen válido.');

  const ids = datos.nodos.map(n => n.id);
  const indice = new Map(ids.map((id, i) => [id, i]));
  const adyacencia = new Map(ids.map(id => [id, []]));
  const grados = new Map(ids.map(id => [id, 0]));
  datos.conexiones.forEach(c => {
    adyacencia.get(c.desde).push({ hacia: c.hacia, conexion: c.id, valor: c.valor });
    grados.set(c.hacia, grados.get(c.hacia) + 1);
  });
  const disponibles = ids.filter(id => grados.get(id) === 0);
  const orden = [];
  while (disponibles.length) {
    disponibles.sort((a, b) => indice.get(a) - indice.get(b));
    const actual = disponibles.shift();
    orden.push(actual);
    adyacencia.get(actual).forEach(arista => {
      grados.set(arista.hacia, grados.get(arista.hacia) - 1);
      if (grados.get(arista.hacia) === 0) disponibles.push(arista.hacia);
    });
  }
  if (orden.length !== ids.length) throw new Error('Ciclo incompatible con máximo: el grafo debe ser dirigido y acíclico. El ciclo se conserva y puedes calcular el mínimo.');

  const distancias = Object.create(null), predecesores = Object.create(null);
  ids.forEach(id => { distancias[id] = -Infinity; predecesores[id] = null; });
  distancias[origen] = 0;
  const finalizados = new Set(), exploradas = new Set(), pasos = [];
  const registrar = (tipo, detalle = {}) => pasos.push(Object.assign({
    tipo, actual: null, arista: null, anterior: null, candidata: null, mejora: false,
    distancias: Object.assign(Object.create(null), distancias),
    predecesores: Object.fromEntries(ids.map(id => [id, predecesores[id] ? Object.assign({}, predecesores[id]) : null])),
    finalizados: ids.filter(id => finalizados.has(id)),
    pendientes: ids.filter(id => !finalizados.has(id))
  }, detalle));
  registrar('inicio', { ordenTopologico: orden.slice(), explicacion: 'Se procesa cada vértice una vez, en orden topológico.' });
  orden.forEach(actual => {
    finalizados.add(actual);
    registrar('seleccion', { actual, explicacion: 'Se procesa ' + actual + ' en orden topológico; todos sus predecesores ya fueron revisados.' });
    if (!Number.isFinite(distancias[actual])) return;
    adyacencia.get(actual).forEach(arista => {
      const anterior = distancias[arista.hacia];
      const candidata = distancias[actual] + arista.valor;
      const mejora = candidata > anterior;
      exploradas.add(arista.conexion);
      if (mejora) {
        distancias[arista.hacia] = candidata;
        predecesores[arista.hacia] = { nodo: actual, conexion: arista.conexion };
      }
      registrar('relajacion', { actual, desde: actual, hacia: arista.hacia, arista: arista.conexion, anterior, candidata, mejora,
        explicacion: mejora ? 'La candidata es mayor: cambian el valor máximo y el predecesor.' : 'La candidata no es mayor: se conserva el mejor camino.' });
    });
  });
  registrar('final', { explicacion: 'Orden topológico completado. Los valores −∞ indican que no existe un camino desde el origen.' });
  const idsArbol = new Set(ids.filter(id => predecesores[id]).map(id => predecesores[id].conexion));
  return { origen, objetivo: 'max', grafo: datos, distancias, predecesores, pasos, ordenTopologico: orden,
    arbol: datos.conexiones.filter(c => idsArbol.has(c.id)).map(c => c.id), exploradas: Array.from(exploradas) };
}

/** Reconstruye y suma pesos originales, también en grafos no dirigidos. */
function reconstruirRutaGrafo(resultado, destino) {
  if (!resultado || !resultado.grafo || !Object.prototype.hasOwnProperty.call(resultado.distancias, destino) ||
      (resultado.objetivo === 'max' ? resultado.distancias[destino] === -Infinity : !Number.isFinite(resultado.distancias[destino]))) return null;
  if (destino === resultado.origen) return { nodos: [destino], conexiones: [], distancia: 0 };
  const conexionesPorId = new Map(resultado.grafo.conexiones.map(c => [c.id, c]));
  const nodos = [];
  const conexiones = [];
  const visitados = new Set();
  let actual = destino;
  let distancia = 0;
  while (!visitados.has(actual) && visitados.size < resultado.grafo.nodos.length) {
    visitados.add(actual);
    nodos.push(actual);
    if (actual === resultado.origen) return { nodos: nodos.reverse(), conexiones: conexiones.reverse(), distancia };
    const anterior = resultado.predecesores[actual];
    if (!anterior) return null;
    const conexion = conexionesPorId.get(anterior.conexion);
    if (!conexion) return null;
    const directa = conexion.desde === anterior.nodo && conexion.hacia === actual;
    const inversa = !resultado.grafo.dirigido && conexion.hacia === anterior.nodo && conexion.desde === actual;
    if (!directa && !inversa) return null;
    distancia += conexion.valor;
    conexiones.push(conexion.id);
    actual = anterior.nodo;
  }
  return null;
}

/**
 * Kruskal: orden O(E log E), Union-Find con compresión y rango O(E α(V)).
 * Igual peso conserva el orden original de conexiones, para ambos objetivos.
 * Registrar componentes añade O(EV) tiempo y memoria al historial educativo.
 */
function resolverKruskalGrafo(grafo, objetivo = 'min') {
  const validacion = validarGrafoModulo(grafo, 'kruskal');
  if (!validacion.ok) throw new Error(validacion.error);
  if (objetivo !== 'min' && objetivo !== 'max') throw new Error('El objetivo debe ser min o max.');
  const datos = validacion.grafo;
  if (!datos.nodos.length) throw new Error('Crea al menos un nodo antes de calcular.');
  const padre = new Map(datos.nodos.map(n => [n.id, n.id]));
  const rango = new Map(datos.nodos.map(n => [n.id, 0]));
  function representante(id) {
    if (padre.get(id) !== id) padre.set(id, representante(padre.get(id)));
    return padre.get(id);
  }
  function componentes() {
    const grupos = new Map();
    datos.nodos.forEach(n => {
      const raiz = representante(n.id);
      if (!grupos.has(raiz)) grupos.set(raiz, []);
      grupos.get(raiz).push(n.id);
    });
    return Array.from(grupos.values());
  }
  const factor = objetivo === 'min' ? 1 : -1;
  const ordenadas = datos.conexiones.map((arista, indice) => ({ arista, indice }))
    .sort((a, b) => factor * (a.arista.valor - b.arista.valor) || a.indice - b.indice).map(item => item.arista);
  const elegidas = [];
  const pasos = [];
  let total = 0;
  ordenadas.forEach(arista => {
    const componentesAntes = componentes();
    let a = representante(arista.desde);
    let b = representante(arista.hacia);
    const aceptada = a !== b;
    if (aceptada) {
      if (rango.get(a) < rango.get(b)) [a, b] = [b, a];
      padre.set(b, a);
      if (rango.get(a) === rango.get(b)) rango.set(a, rango.get(a) + 1);
      elegidas.push(arista.id);
      total += arista.valor;
    }
    pasos.push({ arista: arista.id, aceptada, componentesAntes, componentesDespues: componentes(), elegidas: elegidas.slice(), total });
  });
  return { grafo: datos, objetivo, elegidas, total, componentes: componentes(), ordenadas: ordenadas.map(c => c.id), pasos };
}
