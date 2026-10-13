'use strict';

function crearNodoArbol(valor) {
  return { valor, izquierdo: null, derecho: null };
}

function insertarNodoArbol(raiz, valor) {
  if (!raiz) return { raiz: crearNodoArbol(valor), camino: [], nuevo: valor, duplicado: false };
  const camino = [];
  let actual = raiz;
  while (true) {
    camino.push(actual.valor);
    if (valor === actual.valor) return { raiz, camino, nuevo: null, duplicado: true };
    const lado = valor < actual.valor ? 'izquierdo' : 'derecho';
    if (!actual[lado]) {
      actual[lado] = crearNodoArbol(valor);
      return { raiz, camino, nuevo: valor, duplicado: false };
    }
    actual = actual[lado];
  }
}

function crearArbolBusqueda(valores) {
  let raiz = null;
  for (const valor of valores) {
    const insercion = insertarNodoArbol(raiz, valor);
    if (insercion.duplicado) throw new Error(`El valor ${valor} está repetido.`);
    raiz = insercion.raiz;
  }
  return raiz;
}

function recorridosArbol(raiz) {
  const resultado = { preorden: [], inorden: [], postorden: [] };
  function visitar(nodo) {
    if (!nodo) return;
    resultado.preorden.push(nodo.valor);
    visitar(nodo.izquierdo);
    resultado.inorden.push(nodo.valor);
    visitar(nodo.derecho);
    resultado.postorden.push(nodo.valor);
  }
  visitar(raiz);
  return resultado;
}

function generarValoresArbol(cantidad, minimo, maximo, aleatorio) {
  const random = aleatorio || Math.random;
  const rango = [];
  for (let valor = minimo; valor <= maximo; valor++) rango.push(valor);
  if (!Number.isInteger(cantidad) || cantidad < MIN_NODOS_ARBOL || cantidad > MAX_NODOS_ARBOL) {
    throw new Error(`La cantidad debe estar entre ${MIN_NODOS_ARBOL} y ${MAX_NODOS_ARBOL}.`);
  }
  if (rango.length < cantidad) throw new Error(`El rango solo contiene ${rango.length} valores diferentes; se solicitaron ${cantidad}.`);
  for (let i = 0; i < cantidad; i++) {
    const j = i + Math.floor(random() * (rango.length - i));
    [rango[i], rango[j]] = [rango[j], rango[i]];
  }
  const seleccionados = rango.slice(0, cantidad);
  for (let i = seleccionados.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [seleccionados[i], seleccionados[j]] = [seleccionados[j], seleccionados[i]];
  }
  return seleccionados;
}
