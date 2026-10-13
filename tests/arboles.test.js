'use strict';

const { crearContexto, cargar, prueba, igual, cierto, lanza, informe } = require('./cargar');

const ctx = cargar(crearContexto(), [
  'js/config.js',
  'js/arboles/modelo.js',
  'js/arboles/validacion.js',
  'js/arboles/reconstruccion.js'
]);
const {
  crearArbolBusqueda, insertarNodoArbol, recorridosArbol, generarValoresArbol,
  validarSecuenciaInsercion, analizarEnteroArbol, analizarRecorridoArbol,
  validarParametrosGeneradorArbol, validarYReconstruirArbol
} = ctx;

const ejemplo = {
  preorden: [5, 3, 1, 4, 7, 11, 8, 15],
  inorden: [1, 3, 4, 5, 7, 8, 11, 15],
  postorden: [1, 4, 3, 8, 15, 11, 7, 5]
};

prueba('Árbol de clase: estructura y tres recorridos exactos', () => {
  const raiz = crearArbolBusqueda([5, 3, 1, 4, 7, 11, 8, 15]);
  igual(raiz.valor, 5);
  igual(raiz.izquierdo.izquierdo.valor, 1);
  igual(raiz.izquierdo.derecho.valor, 4);
  igual(raiz.derecho.derecho.izquierdo.valor, 8);
  igual(raiz.derecho.derecho.derecho.valor, 15);
  igual(recorridosArbol(raiz), ejemplo);
});

prueba('Árbol vacío, nodo único y formas desbalanceadas', () => {
  igual(recorridosArbol(null), { preorden: [], inorden: [], postorden: [] });
  igual(recorridosArbol(crearArbolBusqueda([-17])), { preorden: [-17], inorden: [-17], postorden: [-17] });
  const izquierda = crearArbolBusqueda([3, 2, 1]);
  const derecha = crearArbolBusqueda([1, 2, 3]);
  igual(izquierda.izquierdo.izquierdo.valor, 1);
  igual(derecha.derecho.derecho.valor, 3);
});

prueba('Inserción y límites: rechaza duplicados, decimales y valores fuera de rango', () => {
  const raiz = crearArbolBusqueda([-999, 0, 999]);
  igual(recorridosArbol(raiz).inorden, [-999, 0, 999]);
  cierto(validarSecuenciaInsercion(Array(31).fill(0).map((_, i) => i - 15)).ok);
  cierto(!validarSecuenciaInsercion([2, 2]).ok);
  cierto(!validarSecuenciaInsercion([-1000]).ok);
  cierto(!analizarEnteroArbol('12abc', 'valor').ok);
  cierto(!analizarEnteroArbol('1.5', 'valor').ok);
  const duplicado = insertarNodoArbol(crearArbolBusqueda([4]), 4);
  cierto(duplicado.duplicado);
  lanza(() => crearArbolBusqueda([1, 1]));
});

prueba('Generador aleatorio: valores únicos, mezcla el orden y respeta límites', () => {
  let semilla = 17;
  const random = () => { semilla = (semilla * 48271) % 2147483647; return semilla / 2147483647; };
  const valores = generarValoresArbol(31, -15, 15, random);
  igual(valores.length, 31);
  igual(new Set(valores).size, 31);
  cierto(valores.every(v => v >= -15 && v <= 15));
  cierto(valores.some((v, i) => v !== -15 + i), 'los valores no están simplemente ordenados');
  lanza(() => generarValoresArbol(3, 1, 2));
  lanza(() => generarValoresArbol(32, 1, 99));
});

prueba('Generador valida cantidad, rango inclusivo y capacidad insuficiente', () => {
  igual(validarParametrosGeneradorArbol('1', '5', '5'), { ok: true, cantidad: 1, minimo: 5, maximo: 5 });
  cierto(!validarParametrosGeneradorArbol('2', '5', '5').ok);
  cierto(validarParametrosGeneradorArbol('6', '1', '5').error.includes('Reduce la cantidad a 5'));
  cierto(!validarParametrosGeneradorArbol('32', '1', '99').ok);
  cierto(!validarParametrosGeneradorArbol('4', '5', '1').ok);
});

prueba('Entradas de recorridos: signos, separadores, enteros completos y errores', () => {
  igual(analizarRecorridoArbol('−5, 0\n15 20'.replace('−', '-'), 'preorden'), { ok: true, valores: [-5, 0, 15, 20] });
  cierto(!analizarRecorridoArbol('1 2.5', 'inorden').ok);
  cierto(!analizarRecorridoArbol('1 2abc', 'inorden').ok);
  cierto(analizarRecorridoArbol('4, 4', 'inorden').error.includes('repetido'));
  cierto(analizarRecorridoArbol('1000', 'postorden').error.includes('entre -999 y 999'));
});

prueba('Reconstruye con preorden+inorden e inorden+postorden', () => {
  ['pre_in', 'in_post'].forEach(modo => {
    const r = validarYReconstruirArbol(ejemplo, modo);
    cierto(r.ok, r.error);
    igual(r.recorridos, ejemplo);
  });
});

prueba('Reconstruye árboles válidos que no son árboles de búsqueda', () => {
  const recorridos = { preorden: [10, 15, 5], inorden: [15, 10, 5], postorden: [15, 5, 10] };
  const r = validarYReconstruirArbol(recorridos, 'todos');
  cierto(r.ok, r.error);
  igual(r.raiz.izquierdo.valor, 15);
  igual(r.raiz.derecho.valor, 5);
  igual(r.recorridos, recorridos);
});

prueba('Rechaza duplicados, longitudes distintas y conjuntos de valores diferentes', () => {
  cierto(validarYReconstruirArbol({ preorden: [1, 1], inorden: [1, 1] }, 'pre_in').error.includes('repetido'));
  cierto(validarYReconstruirArbol({ preorden: [1, 2], inorden: [1] }, 'pre_in').error.includes('contiene 2 valores'));
  cierto(validarYReconstruirArbol({ preorden: [1, 2], inorden: [1, 3] }, 'pre_in').error.includes('aparece en inorden'));
});

prueba('Rechaza particiones incompatibles, tercer recorrido incorrecto y falta de inorden', () => {
  const incompatible = validarYReconstruirArbol({ preorden: [1, 2, 3], inorden: [3, 1, 2] }, 'pre_in');
  cierto(!incompatible.ok && incompatible.error.includes('orden es incompatible'));
  const tercer = validarYReconstruirArbol({ preorden: [2, 1, 3], inorden: [1, 2, 3], postorden: [1, 2, 3] }, 'todos');
  cierto(!tercer.ok && tercer.error.includes('postorden ingresado no corresponde'));
  const sinInorden = validarYReconstruirArbol({ preorden: [2, 1], postorden: [1, 2] }, 'pre_post');
  cierto(!sinInorden.ok && sinInorden.error.includes('inorden'));
});

process.exit(informe('Árboles') ? 0 : 1);
