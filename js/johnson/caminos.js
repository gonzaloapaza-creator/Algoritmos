/* Caminos máximos en grafos dirigidos acíclicos. No modifica el grafo ni usa el DOM. */
'use strict';

/**
 * Ordena TODO el grafo con Kahn y calcula máximos desde el origen mediante
 * programación dinámica. Conserva pesos e identificadores originales.
 * Los empates mantienen la primera conexión encontrada, de forma determinista.
 */
function calcularMaximosDAGJohnson(nodos, conexiones, origenId) {
  if (!Array.isArray(nodos) || !Array.isArray(conexiones)) {
    throw new Error('Se requieren listas de nodos y conexiones.');
  }

  const ids = nodos.map(nodo => nodo && nodo.id);
  const posicion = new Map();
  ids.forEach((id, indice) => {
    if (typeof id !== 'string' || !id || posicion.has(id)) {
      throw new Error('Los nodos deben tener identificadores únicos.');
    }
    posicion.set(id, indice);
  });
  if (!posicion.has(origenId)) throw new Error('El nodo de origen no existe.');

  const salientes = ids.map(() => []);
  const entradas = ids.map(() => 0);
  const idsConexiones = new Set();
  conexiones.forEach(conexion => {
    if (!conexion || typeof conexion.id !== 'string' || !conexion.id ||
        idsConexiones.has(conexion.id)) {
      throw new Error('Las conexiones deben tener identificadores únicos.');
    }
    const desde = posicion.get(conexion.desde);
    const hacia = posicion.get(conexion.hacia);
    if (desde === undefined || hacia === undefined) {
      throw new Error('Una conexión referencia un nodo que no existe.');
    }
    if (!Number.isFinite(conexion.valor)) throw new Error('El peso debe ser un número finito.');
    idsConexiones.add(conexion.id);
    salientes[desde].push({ id: conexion.id, desde: desde, hacia: hacia, peso: conexion.valor });
    entradas[hacia]++;
  });

  // La cola inicial respeta el orden de nodos y cada alta el de conexiones.
  const cola = [];
  entradas.forEach((cantidad, indice) => { if (cantidad === 0) cola.push(indice); });
  const orden = [];
  for (let turno = 0; turno < cola.length; turno++) {
    const desde = cola[turno];
    orden.push(desde);
    salientes[desde].forEach(arista => {
      entradas[arista.hacia]--;
      if (entradas[arista.hacia] === 0) cola.push(arista.hacia);
    });
  }

  const resultado = {
    aciclico: orden.length === ids.length,
    origen: origenId,
    ids: ids,
    distancias: null,
    predecesores: null,
    orden: orden,
    operaciones: []
  };
  // También bloquea los ciclos que no sean alcanzables desde el origen.
  if (!resultado.aciclico) return resultado;

  const distancias = ids.map(() => -Infinity);
  const predecesores = ids.map(() => null);
  distancias[posicion.get(origenId)] = 0;
  orden.forEach(desde => {
    if (distancias[desde] === -Infinity) return;
    salientes[desde].forEach(arista => {
      const anterior = distancias[arista.hacia];
      const candidato = distancias[desde] + arista.peso;
      const mejora = candidato > anterior;
      if (mejora) {
        distancias[arista.hacia] = candidato;
        predecesores[arista.hacia] = { nodo: desde, conexion: arista.id };
      }
      resultado.operaciones.push({
        desde: desde,
        hacia: arista.hacia,
        peso: arista.peso,
        anterior: anterior,
        candidato: candidato,
        actual: distancias[arista.hacia],
        mejora: mejora
      });
    });
  });
  resultado.distancias = distancias;
  resultado.predecesores = predecesores;
  return resultado;
}

/** Devuelve el camino de máximo peso, o null si no está definido/alcanza al destino. */
function reconstruirMaximoDAGJohnson(destinoId, resultado) {
  if (!resultado || !resultado.aciclico || !resultado.distancias || !resultado.predecesores) return null;
  const destino = resultado.ids.indexOf(destinoId);
  const origen = resultado.ids.indexOf(resultado.origen);
  if (destino < 0 || origen < 0 || resultado.distancias[destino] === -Infinity) return null;

  const indices = [];
  const conexiones = [];
  let actual = destino;
  // Límite defensivo para que un resultado ajeno/corrupto no produzca un bucle.
  for (let salto = 0; salto < resultado.ids.length; salto++) {
    indices.push(actual);
    if (actual === origen) {
      indices.reverse();
      conexiones.reverse();
      return {
        nodos: indices.map(indice => resultado.ids[indice]),
        indices: indices,
        conexiones: conexiones,
        distancia: resultado.distancias[destino]
      };
    }
    const anterior = resultado.predecesores[actual];
    if (!anterior || !Number.isInteger(anterior.nodo) || anterior.nodo < 0 || anterior.nodo >= resultado.ids.length) return null;
    conexiones.push(anterior.conexion);
    actual = anterior.nodo;
  }
  return null;
}
