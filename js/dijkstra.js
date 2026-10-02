/* Algoritmo de Dijkstra individual para rutas mínimas desde un origen */

'use strict';

/**
 * Ejecuta el algoritmo de Dijkstra desde un nodo de origen específico.
 * Calcula las rutas mínimas desde ese nodo hacia todos los demás.
 * @param {string} origenId - ID del nodo de origen
 * @returns {{nombres:string[], ids:string[], distancias:number[], predecesores:Array<{nodo:number,conexion:string}|null>}}
 *          Objeto con resultados del algoritmo
 */
function calcularDijkstra(origenId) {
  const posicion = new Map();
  estado.nodos.forEach((nodo, i) => posicion.set(nodo.id, i));

  const origenIndex = posicion.get(origenId);
  if (origenIndex === undefined) {
    return null;
  }

  const nombres = estado.nodos.map(nodo => nodo.nombre);
  const ids = estado.nodos.map(nodo => nodo.id);
  const n = nombres.length;

  // Construir lista de adyacencia
  const adyacencia = nombres.map(() => []);
  estado.conexiones.forEach(conexion => {
    const desde = posicion.get(conexion.desde);
    const hacia = posicion.get(conexion.hacia);
    if (desde !== undefined && hacia !== undefined) {
      adyacencia[desde].push({
        hacia: hacia,
        peso: conexion.valor,
        id: conexion.id
      });
    }
  });

  // Dijkstra
  const distancias = new Array(n).fill(Infinity);
  const predecesores = new Array(n).fill(null);
  const visitados = new Array(n).fill(false);

  distancias[origenIndex] = 0;

  for (let i = 0; i < n; i++) {
    // Encontrar el nodo no visitado con menor distancia
    let actual = -1;
    let menor = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visitados[v] && distancias[v] < menor) {
        menor = distancias[v];
        actual = v;
      }
    }

    if (actual === -1) break; // No hay más nodos alcanzables
    visitados[actual] = true;

    // Relajar aristas
    adyacencia[actual].forEach(arista => {
      if (!visitados[arista.hacia]) {
        const nuevaDistancia = distancias[actual] + arista.peso;
        if (nuevaDistancia < distancias[arista.hacia]) {
          distancias[arista.hacia] = nuevaDistancia;
          predecesores[arista.hacia] = {
            nodo: actual,
            conexion: arista.id
          };
        }
      }
    });
  }

  return {
    nombres: nombres,
    ids: ids,
    distancias: distancias,
    predecesores: predecesores
  };
}

/**
 * Reconstruye la ruta mínima desde el origen hasta un destino.
 * @param {number} origen - Índice del nodo de origen
 * @param {number} destino - Índice del nodo de destino
 * @param {Array} predecesores - Array de predecesores del algoritmo
 * @param {Array} ids - Array de IDs de nodos
 * @returns {{nodos:string[], conexiones:string[], distancia:number}|null}
 *          Ruta reconstruida o null si no existe camino
 */
function reconstruirRutaDijkstra(origen, destino, predecesores, ids) {
  if (predecesores[destino] === null && origen !== destino) {
    return null;
  }

  const nodos = [];
  const conexiones = [];
  let actual = destino;

  if (origen === destino) {
    return { nodos: [ids[origen]], conexiones: [], distancia: 0 };
  }

  const visitados = new Set();
  const maxPasos = ids.length;

  for (let paso = 0; paso < maxPasos; paso++) {
    if (visitados.has(actual)) break; // Evitar ciclos
    visitados.add(actual);

    nodos.push(ids[actual]);

    if (actual === origen) {
      nodos.reverse();
      conexiones.reverse();
      return { nodos, conexiones, distancia: calcularDistanciaRuta(nodos) };
    }

    const pred = predecesores[actual];
    if (!pred) break;

    conexiones.push(pred.conexion);
    actual = pred.nodo;
  }

  return null;
}

/**
 * Calcula la distancia total de una ruta.
 * @param {string[]} nodos - IDs de nodos en la ruta
 * @returns {number} Distancia total
 */
function calcularDistanciaRuta(nodos) {
  let distancia = 0;
  for (let i = 0; i < nodos.length - 1; i++) {
    const conexion = buscarConexionEntre(nodos[i], nodos[i + 1]);
    if (conexion) {
      distancia += conexion.valor;
    }
  }
  return distancia;
}

/**
 * Ejecuta Dijkstra y muestra el resultado.
 * @param {string} origenId - ID del nodo de origen
 */
function ejecutarDijkstra(origenId) {
  // Dijkstra no es válido con pesos negativos: daría un resultado silenciosamente
  // equivocado. Para ese caso está Johnson, que sí los admite.
  if (estado.conexiones.some(conexion => conexion.valor < 0)) {
    avisar('Dijkstra no admite pesos negativos. Usa «Calcular Johnson» para ese grafo.', 'error');
    return;
  }

  const resultado = calcularDijkstra(origenId);
  if (!resultado) {
    avisar('No se pudo ejecutar Dijkstra: nodo de origen inválido.', 'error');
    return;
  }

  const origenNodo = buscarNodo(origenId);
  if (!origenNodo) return;

  const origenIndex = resultado.ids.indexOf(origenId);

  // Resaltado: el árbol de caminos mínimos completo, que es lo que Dijkstra calcula.
  const nodosAlcanzados = [];
  const conexionesArbol = [];
  const lineas = [`Origen: ${origenNodo.nombre}`, ''];

  resultado.nombres.forEach((nombre, i) => {
    const distancia = resultado.distancias[i];
    if (distancia === Infinity) {
      lineas.push(`${nombre}: sin camino (∞)`);
      return;
    }

    nodosAlcanzados.push(resultado.ids[i]);
    if (resultado.predecesores[i]) conexionesArbol.push(resultado.predecesores[i].conexion);

    const ruta = reconstruirRutaDijkstra(origenIndex, i, resultado.predecesores, resultado.ids);
    const recorrido = ruta
      ? ruta.nodos.map(id => { const n = buscarNodo(id); return n ? n.nombre : '?'; }).join(' → ')
      : nombre;
    lineas.push(`${nombre}: ${distancia}   (${recorrido})`);
  });

  estado.visualizacionJohnson = {
    origen: origenId,
    destino: null,
    nodos: nodosAlcanzados,
    conexiones: conexionesArbol,
    distancia: null,
    tipo: 'ruta',
    firma: firmaGrafoJohnson()
  };
  dibujar();

  const alcanzados = nodosAlcanzados.length - 1;
  ayudar('Árbol de caminos mínimos desde <strong>' + escaparHtml(origenNodo.nombre) + '</strong>: ' +
         alcanzados + (alcanzados === 1 ? ' nodo alcanzable' : ' nodos alcanzables') + '.');

  abrirModal({
    titulo: 'Dijkstra desde ' + origenNodo.nombre,
    mensaje: lineas.join('\n'),
    pedirTexto: false,
    soloAceptar: true,
    ancho: true,
    textoAceptar: 'Entendido'
  });
}