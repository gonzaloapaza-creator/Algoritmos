'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');

const ctx = cargar(crearContexto(), [
  'js/config.js',
  'js/arboles/modelo.js',
  'js/arboles/validacion.js',
  'js/arboles/reconstruccion.js',
  'js/arboles/estado.js'
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

prueba('Recuperación: depurarEstadoArboles conserva recorrido y paso, con valores seguros para formatos antiguos', () => {
  const { depurarEstadoArboles } = ctx;
  const antiguo = depurarEstadoArboles({ version: 1, modo: 'busqueda', secuencia: [5, 3, 8] });
  cierto(antiguo && antiguo.recorrido === 'preorden' && antiguo.pasoRecorrido === 0);
  const completo = depurarEstadoArboles({ version: 1, modo: 'busqueda', secuencia: [5, 3, 8], recorrido: 'postorden', pasoRecorrido: 4 });
  cierto(completo && completo.recorrido === 'postorden' && completo.pasoRecorrido === 4);
  const raro = depurarEstadoArboles({ version: 1, modo: 'busqueda', secuencia: [5], recorrido: 'otro', pasoRecorrido: -2 });
  cierto(raro && raro.recorrido === 'preorden' && raro.pasoRecorrido === 0);
  const reconstruido = depurarEstadoArboles({ version: 1, modo: 'reconstruido', recorridos: { preorden: [2, 1, 3], inorden: [1, 2, 3], postorden: [1, 3, 2] }, recorrido: 'inorden', pasoRecorrido: 1 });
  cierto(reconstruido && reconstruido.modo === 'reconstruido' && reconstruido.recorrido === 'inorden' && reconstruido.pasoRecorrido === 1);
  igual(depurarEstadoArboles({ version: 2, modo: 'busqueda', secuencia: [1] }), null);
});

prueba('El guardado diferido conserva el último paso al salir u ocultar la página', () => {
  const contexto = crearContexto();
  const eventos = {};
  const pendientes = new Map();
  const escrituras = [];
  let reloj = 0;
  contexto.window = { addEventListener: (nombre, fn) => { eventos[nombre] = fn; } };
  contexto.document = { hidden: false, addEventListener: (nombre, fn) => { eventos[nombre] = fn; } };
  contexto.localStorage = {};
  contexto.setTimeout = (fn, retraso) => { pendientes.set(++reloj, { fn, retraso }); return reloj; };
  contexto.clearTimeout = id => pendientes.delete(id);
  contexto.escribirAlmacenamientoLocal = (clave, texto) => escrituras.push(JSON.parse(texto));
  cargar(contexto, ['js/config.js', 'js/arboles/estado.js']);
  const estado = evaluar(contexto, 'estadoArboles');
  estado.secuencia = [5, 3, 8];
  estado.recorridoSeleccionado = 'postorden';
  estado.pasoRecorrido = 2;
  contexto.programarGuardadoArboles();
  igual([...pendientes.values()].map(t => t.retraso), [400]);
  estado.pasoRecorrido = 4;
  contexto.programarGuardadoArboles();
  igual(pendientes.size, 1, 'Las ediciones consecutivas agrupan la escritura');
  igual(escrituras.length, 0);
  eventos.pagehide();
  igual(escrituras.length, 1);
  igual(escrituras[0].pasoRecorrido, 4);
  igual(escrituras[0].recorrido, 'postorden');
  igual(pendientes.size, 0);
  eventos.pagehide();
  igual(escrituras.length, 1, 'Sin guardado pendiente no se repite la escritura');
  estado.pasoRecorrido = 5;
  contexto.programarGuardadoArboles();
  eventos.visibilitychange();
  igual(escrituras.length, 1, 'Una página visible conserva la espera');
  contexto.document.hidden = true;
  eventos.visibilitychange();
  igual(escrituras[1].pasoRecorrido, 5);
  igual(pendientes.size, 0);
});

prueba('Restaurar Árboles aplica estructura, recorrido y paso con la reproducción pausada', () => {
  const contexto = crearContexto();
  const elementos = new Map();
  const elemento = id => {
    if (!elementos.has(id)) elementos.set(id, { value: '', addEventListener() {}, setAttribute() {} });
    return elementos.get(id);
  };
  contexto.document = { getElementById: elemento, querySelectorAll: () => [], addEventListener() {} };
  contexto.dibujarArbol = () => {};
  contexto.cambiarZoomArbol = contexto.centrarArbol = contexto.ajustarZoomArbol = () => {};
  contexto.instalarAyudaModal = () => {};
  contexto.escribirAlmacenamientoLocal = () => true;
  contexto.clearInterval = () => {};
  const guardado = { version: 1, modo: 'busqueda', secuencia: [5, 3, 8], recorrido: 'postorden', pasoRecorrido: 4 };
  contexto.localStorage = { getItem: () => JSON.stringify(guardado) };
  cargar(contexto, ['js/config.js', 'js/arboles/modelo.js', 'js/arboles/validacion.js',
    'js/arboles/reconstruccion.js', 'js/arboles/estado.js', 'js/arboles/app.js']);
  const estado = evaluar(contexto, 'estadoArboles');
  igual(contexto.recorridosArbol(estado.raiz).inorden, [3, 5, 8]);
  igual(elemento('selectorRecorrido').value, 'postorden');
  igual(estado.pasoRecorrido, 4);
  cierto(!estado.reproduciendo && estado.intervaloRecorrido === null);
  cierto(elemento('explicacionRecorrido').textContent.includes('Paso 4 de 6'));
  const reconstruido = contexto.depurarEstadoArboles({ version: 1, modo: 'reconstruido',
    recorridos: { preorden: [10, 15, 5], inorden: [15, 10, 5], postorden: [15, 5, 10] },
    recorrido: 'inorden', pasoRecorrido: 99 });
  estado.reproduciendo = true;
  estado.intervaloRecorrido = 42;
  contexto.restaurarArbolDepurado(reconstruido);
  igual(estado.raiz.izquierdo.valor, 15, 'La restauración conserva el árbol reconstruido que no es BST');
  igual(estado.recorridoSeleccionado, 'inorden');
  igual(estado.pasoRecorrido, 6, 'El paso se limita al historial real');
  igual(elemento('entradaPreorden').value, '10, 15, 5');
  cierto(!estado.reproduciendo && estado.intervaloRecorrido === null);
});

process.exit(informe('Árboles') ? 0 : 1);
