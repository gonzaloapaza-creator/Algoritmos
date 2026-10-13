'use strict';

function mismosElementosArbol(a, b) {
  return a.length === b.length && a.every(valor => new Set(b).has(valor));
}

function reconstruirDesdePreordenEInorden(preorden, inorden) {
  let indicePre = 0;
  const posiciones = new Map(inorden.map((valor, indice) => [valor, indice]));
  function construir(inicio, fin) {
    if (inicio > fin) return null;
    if (indicePre >= preorden.length) throw new Error('Los recorridos contienen los mismos valores, pero su orden es incompatible.');
    const valor = preorden[indicePre++];
    const indice = posiciones.get(valor);
    if (indice == null || indice < inicio || indice > fin) throw new Error('Los recorridos contienen los mismos valores, pero su orden es incompatible.');
    const nodo = crearNodoArbol(valor);
    nodo.izquierdo = construir(inicio, indice - 1);
    nodo.derecho = construir(indice + 1, fin);
    return nodo;
  }
  const raiz = construir(0, inorden.length - 1);
  if (indicePre !== preorden.length) throw new Error('Los recorridos contienen los mismos valores, pero su orden es incompatible.');
  return raiz;
}

function reconstruirDesdeInordenYPostorden(inorden, postorden) {
  let indicePost = postorden.length - 1;
  const posiciones = new Map(inorden.map((valor, indice) => [valor, indice]));
  function construir(inicio, fin) {
    if (inicio > fin) return null;
    if (indicePost < 0) throw new Error('Los recorridos contienen los mismos valores, pero su orden es incompatible.');
    const valor = postorden[indicePost--];
    const indice = posiciones.get(valor);
    if (indice == null || indice < inicio || indice > fin) throw new Error('Los recorridos contienen los mismos valores, pero su orden es incompatible.');
    const nodo = crearNodoArbol(valor);
    nodo.derecho = construir(indice + 1, fin);
    nodo.izquierdo = construir(inicio, indice - 1);
    return nodo;
  }
  const raiz = construir(0, inorden.length - 1);
  if (indicePost !== -1) throw new Error('Los recorridos contienen los mismos valores, pero su orden es incompatible.');
  return raiz;
}

function validarYReconstruirArbol(entrada, modo) {
  const nombres = { preorden: 'preorden', inorden: 'inorden', postorden: 'postorden' };
  const modos = {
    pre_in: ['preorden', 'inorden'],
    in_post: ['inorden', 'postorden'],
    pre_post: ['preorden', 'inorden', 'postorden'],
    todos: ['preorden', 'inorden', 'postorden']
  };
  const requeridos = modos[modo];
  if (!requeridos) return { ok: false, error: 'Selecciona una combinación de recorridos válida.' };
  const recorridos = {};
  for (const nombre of requeridos) {
    const validacion = validarValoresRecorrido(entrada[nombre], nombres[nombre]);
    if (!validacion.ok) return validacion;
    recorridos[nombre] = validacion.valores;
  }
  const base = recorridos[requeridos[0]];
  for (const nombre of requeridos.slice(1)) {
    const actual = recorridos[nombre];
    if (actual.length !== base.length) {
      return { ok: false, error: `${nombres[requeridos[0]]} contiene ${base.length} valores e ${nombres[nombre]} contiene ${actual.length}.` };
    }
    const faltantes = base.filter(valor => !actual.includes(valor));
    const sobrantes = actual.filter(valor => !base.includes(valor));
    if (faltantes.length || sobrantes.length) {
      const texto = [];
      if (sobrantes.length) texto.push(`El valor ${sobrantes[0]} aparece en ${nombres[nombre]}, pero falta en ${nombres[requeridos[0]]}.`);
      if (faltantes.length) texto.push(`El valor ${faltantes[0]} aparece en ${nombres[requeridos[0]]}, pero falta en ${nombres[nombre]}.`);
      return { ok: false, error: texto.join(' ') };
    }
  }

  let raiz;
  try {
    raiz = modo === 'in_post'
      ? reconstruirDesdeInordenYPostorden(recorridos.inorden, recorridos.postorden)
      : reconstruirDesdePreordenEInorden(recorridos.preorden, recorridos.inorden);
  } catch (error) {
    return { ok: false, error: error.message };
  }
  const calculados = recorridosArbol(raiz);
  for (const nombre of requeridos) {
    if (calculados[nombre].length !== recorridos[nombre].length ||
        calculados[nombre].some((valor, i) => valor !== recorridos[nombre][i])) {
      return { ok: false, error: `El ${nombres[nombre]} ingresado no corresponde al árbol reconstruido.` };
    }
  }
  return { ok: true, raiz, recorridos: calculados };
}
