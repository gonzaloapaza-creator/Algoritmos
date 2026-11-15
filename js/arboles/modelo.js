'use strict';

function catalogoEjemplosArbol() {
  return [
    { id: 'clase', nombre: 'Básico · Ejemplo de clase', modo: 'busqueda', valores: [5, 3, 1, 4, 7, 11, 8, 15], descripcion: 'Inserta los valores en orden. Compara preorden, inorden y postorden sobre la misma estructura.' },
    { id: 'equilibrado', nombre: 'Básico · BST equilibrado', modo: 'busqueda', valores: [40, 20, 60, 10, 30, 50, 70], descripcion: 'Inserta primero la raíz y después sus niveles. Observa tres recorridos diferentes de un árbol de siete nodos.' },
    { id: 'cadena', nombre: 'Intermedio · BST en cadena', modo: 'busqueda', valores: [10, 20, 30, 40, 50], descripcion: 'Inserta en orden ascendente: cada nodo nuevo queda a la derecha. Usa Ajustar, zoom o desplaza la vista para recorrer la cadena.' },
    { id: 'general-pre', nombre: 'Especial · General con preorden + inorden', modo: 'pre_in', recorridos: { inorden: [8, 2, 6, 4, 1], preorden: [6, 2, 8, 1, 4] }, descripcion: 'Reconstruye con raíz 6. Es un árbol binario general: su inorden no es ascendente y no cumple las reglas de un BST.' },
    { id: 'general-post', nombre: 'Especial · General con inorden + postorden', modo: 'in_post', recorridos: { inorden: [8, 2, 6, 4, 1], postorden: [8, 2, 4, 1, 6] }, descripcion: 'Reconstruye la misma estructura con otro par de recorridos. El último valor de postorden indica la raíz 6.' }
  ];
}

function crearNodoArbol(valor) {
  if (!Number.isSafeInteger(valor) || valor < MIN_VALOR_ARBOL || valor > MAX_VALOR_ARBOL) throw new Error('Cada nodo debe ser un entero entre ' + MIN_VALOR_ARBOL + ' y ' + MAX_VALOR_ARBOL + '.');
  return { valor, izquierdo: null, derecho: null };
}

function insertarNodoArbol(raiz, valor) {
  crearNodoArbol(valor); // La regla también protege llamadas que evitan el formulario.
  if (!raiz) return { raiz: crearNodoArbol(valor), camino: [], nuevo: valor, duplicado: false };
  const camino = [];
  let actual = raiz;
  while (true) {
    camino.push(actual.valor);
    if (valor === actual.valor) return { raiz, camino, nuevo: null, duplicado: true };
    const lado = valor < actual.valor ? 'izquierdo' : 'derecho';
    if (!actual[lado]) {
      if (recorridosArbol(raiz).inorden.length >= MAX_NODOS_ARBOL) throw new Error('El árbol admite como máximo ' + MAX_NODOS_ARBOL + ' nodos.');
      actual[lado] = crearNodoArbol(valor);
      return { raiz, camino, nuevo: valor, duplicado: false };
    }
    actual = actual[lado];
  }
}

function crearArbolBusqueda(valores) {
  const validacion = validarSecuenciaInsercion(valores);
  if (!validacion.ok) throw new Error(validacion.error);
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
  const validacion = validarParametrosGeneradorArbol(cantidad, minimo, maximo);
  if (!validacion.ok) throw new Error(validacion.error);
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
