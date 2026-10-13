'use strict';

function analizarEnteroArbol(texto, etiqueta) {
  const valorTexto = String(texto == null ? '' : texto).trim();
  if (!valorTexto) return { ok: false, error: `Escribe ${etiqueta}.` };
  if (!/^-?\d+$/.test(valorTexto)) return { ok: false, error: `${etiqueta} debe ser un número entero completo.` };
  const valor = Number(valorTexto);
  if (!Number.isSafeInteger(valor) || valor < MIN_VALOR_ARBOL || valor > MAX_VALOR_ARBOL) {
    return { ok: false, error: `${etiqueta} debe estar entre ${MIN_VALOR_ARBOL} y ${MAX_VALOR_ARBOL}.` };
  }
  return { ok: true, valor };
}

function validarSecuenciaInsercion(valores) {
  if (!Array.isArray(valores)) return { ok: false, error: 'La secuencia de inserción no es válida.' };
  if (valores.length > MAX_NODOS_ARBOL) return { ok: false, error: `El árbol admite como máximo ${MAX_NODOS_ARBOL} nodos.` };
  const vistos = new Set();
  for (const valor of valores) {
    if (!Number.isInteger(valor) || valor < MIN_VALOR_ARBOL || valor > MAX_VALOR_ARBOL) {
      return { ok: false, error: `Cada nodo debe ser un entero entre ${MIN_VALOR_ARBOL} y ${MAX_VALOR_ARBOL}.` };
    }
    if (vistos.has(valor)) return { ok: false, error: `El valor ${valor} está repetido; no se permiten nodos duplicados.` };
    vistos.add(valor);
  }
  return { ok: true, valores: valores.slice() };
}

function analizarRecorridoArbol(texto, nombre) {
  const cadena = String(texto == null ? '' : texto).trim();
  if (!cadena) return { ok: false, error: `Completa el recorrido ${nombre}.` };
  const tokens = cadena.split(/[,\s]+/).filter(Boolean);
  if (tokens.length > MAX_NODOS_ARBOL) return { ok: false, error: `${nombre} contiene ${tokens.length} valores; el máximo es ${MAX_NODOS_ARBOL}.` };
  const valores = [];
  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) return { ok: false, error: `«${token}» no es un entero válido en ${nombre}.` };
    const valor = Number(token);
    if (!Number.isSafeInteger(valor) || valor < MIN_VALOR_ARBOL || valor > MAX_VALOR_ARBOL) {
      return { ok: false, error: `El valor ${token} de ${nombre} debe estar entre ${MIN_VALOR_ARBOL} y ${MAX_VALOR_ARBOL}.` };
    }
    valores.push(valor);
  }
  const repetidos = valores.filter((valor, i) => valores.indexOf(valor) !== i);
  if (repetidos.length) return { ok: false, error: `El valor ${repetidos[0]} está repetido en ${nombre}.` };
  return { ok: true, valores };
}

function validarValoresRecorrido(valores, nombre) {
  if (!Array.isArray(valores) || valores.length < MIN_NODOS_ARBOL || valores.length > MAX_NODOS_ARBOL) {
    return { ok: false, error: `${nombre} debe contener entre ${MIN_NODOS_ARBOL} y ${MAX_NODOS_ARBOL} valores.` };
  }
  const vistos = new Set();
  for (const valor of valores) {
    if (!Number.isInteger(valor) || valor < MIN_VALOR_ARBOL || valor > MAX_VALOR_ARBOL) {
      return { ok: false, error: `Cada valor de ${nombre} debe ser un entero entre ${MIN_VALOR_ARBOL} y ${MAX_VALOR_ARBOL}.` };
    }
    if (vistos.has(valor)) return { ok: false, error: `El valor ${valor} está repetido en ${nombre}.` };
    vistos.add(valor);
  }
  return { ok: true, valores: valores.slice() };
}

function validarParametrosGeneradorArbol(cantidadTexto, minimoTexto, maximoTexto) {
  const textoCantidad = String(cantidadTexto == null ? '' : cantidadTexto).trim();
  if (!textoCantidad) return { ok: false, error: 'Escribe la cantidad de nodos.' };
  if (!/^-?\d+$/.test(textoCantidad)) return { ok: false, error: 'La cantidad de nodos debe ser un número entero completo.' };
  const numeroCantidad = Number(textoCantidad);
  if (!Number.isSafeInteger(numeroCantidad)) return { ok: false, error: 'La cantidad de nodos debe ser un entero válido.' };
  const minimo = analizarEnteroArbol(minimoTexto, 'el valor mínimo');
  if (!minimo.ok) return minimo;
  const maximo = analizarEnteroArbol(maximoTexto, 'el valor máximo');
  if (!maximo.ok) return maximo;
  if (numeroCantidad < MIN_NODOS_ARBOL || numeroCantidad > MAX_NODOS_ARBOL) {
    return { ok: false, error: `La cantidad debe estar entre ${MIN_NODOS_ARBOL} y ${MAX_NODOS_ARBOL}.` };
  }
  if (minimo.valor > maximo.valor) return { ok: false, error: 'El valor mínimo no puede superar al máximo.' };
  const capacidad = maximo.valor - minimo.valor + 1;
  if (capacidad < numeroCantidad) {
    return { ok: false, error: `El rango de ${minimo.valor} a ${maximo.valor} contiene ${capacidad} valores diferentes. Reduce la cantidad a ${capacidad} o amplía el rango.` };
  }
  return { ok: true, cantidad: numeroCantidad, minimo: minimo.valor, maximo: maximo.valor };
}
