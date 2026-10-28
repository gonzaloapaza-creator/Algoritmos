'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');

const ctx = cargar(crearContexto(), [
  'js/config.js',
  'js/ordenamiento/estado.js',
  'js/ordenamiento/algoritmos.js'
]);

const { ordenarSelectionSort, ordenarInsertionSort, ordenarBubbleSort, ordenarShellSort, ordenarMergeSort, ejecutarOrdenamiento, analizarValoresOrdenamiento, valoresDePinos, generarValoresOrdenamiento, instantaneaOrdenamiento, depurarEstadoOrdenamiento } = ctx;
const PSEUDOCODIGO = evaluar(ctx, 'PSEUDOCODIGO_ORDENAMIENTO');
const LIMITES = evaluar(ctx, 'LIMITES_ORDENAMIENTO');

const ALGORITMOS = { selection: ordenarSelectionSort, insertion: ordenarInsertionSort, bubble: ordenarBubbleSort, shell: ordenarShellSort, merge: ordenarMergeSort };
const ordenado = v => v.slice().sort((a, b) => a - b);
const ultimo = h => h[h.length - 1];

/* Invariantes que debe cumplir cualquier historial. */
function verificarHistorial(nombre, hist, valores) {
  const n = valores.length;
  cierto(hist.length >= 2, nombre + ': historial demasiado corto');
  igual(hist[0].tipo, 'inicio', nombre + ': el primer paso es inicio');
  igual(valoresDePinos(hist[0].arreglo), valores, nombre + ': el paso 0 conserva los datos de entrada');
  igual(ultimo(hist).tipo, 'fin', nombre + ': el último paso es fin');
  igual(valoresDePinos(ultimo(hist).arreglo), ordenado(valores), nombre + ': el resultado está ordenado');
  igual(ultimo(hist).ordenados.length, n, nombre + ': al final todos están marcados como ordenados');

  const ids = hist[0].arreglo.map(p => p.id).sort();
  let compPrev = 0, movPrev = 0;
  hist.forEach((p, i) => {
    igual(p.arreglo.map(x => x.id).sort(), ids, `${nombre}: paso ${i} conserva los mismos pinos`);
    igual(ordenado(valoresDePinos(p.arreglo)), ordenado(valores), `${nombre}: paso ${i} es una permutación`);
    cierto(p.comparaciones >= compPrev && p.intercambios >= movPrev, `${nombre}: paso ${i} contadores no decrecen`);
    compPrev = p.comparaciones; movPrev = p.intercambios;
    cierto(p.linea >= -1 && p.linea < PSEUDOCODIGO[nombre].length, `${nombre}: paso ${i} línea de pseudocódigo válida`);
    [...p.comparando, ...p.moviendo, ...p.ordenados].forEach(idx => cierto(idx >= 0 && idx < n, `${nombre}: paso ${i} índice fuera de rango`));
    if (p.tipo !== 'fin') cierto(p.mensaje.length > 0, `${nombre}: paso ${i} sin mensaje`);
  });
  const movimientos = hist.reduce((total, p) => total + p.movimientos, 0);
  igual(movimientos, ultimo(hist).intercambios, nombre + ': un paso «mover» por cada movimiento contado');
  const comparaciones = hist.filter(p => p.tipo === 'comparar').length;
  igual(comparaciones, ultimo(hist).comparaciones, nombre + ': un paso «comparar» por cada comparación contada');
}

prueba('Selection Sort: ejemplo fijo, conteos exactos', () => {
  const h = ordenarSelectionSort([5, 3, 8, 1]);
  verificarHistorial('selection', h, [5, 3, 8, 1]);
  igual(ultimo(h).comparaciones, 6);     // n(n−1)/2
  igual(ultimo(h).intercambios, 2);      // 1↔5, 3↔5
  igual(h.filter(p => p.tipo === 'fijar').length, 3);
});

prueba('Selection Sort: marca el mínimo actual y las pasadas', () => {
  const h = ordenarSelectionSort([9, 4, 7]);
  const minimos = h.filter(p => p.tipo === 'minimo');
  igual(minimos.length, 2);              // 4 en la pasada 1, 7 en la pasada 2
  igual(minimos[0].minimo, 1);
  igual(minimos[1].minimo, 2);
  igual(minimos[1].pasada, 2);
  igual(Math.max(...h.map(p => p.pasada)), 2);
});

prueba('Insertion Sort: ejemplo fijo y clave sostenida', () => {
  const h = ordenarInsertionSort([4, 3, 2, 1]);
  verificarHistorial('insertion', h, [4, 3, 2, 1]);
  igual(ultimo(h).comparaciones, 6);
  igual(ultimo(h).intercambios, 6);
  const seleccion = h.find(p => p.tipo === 'seleccion');
  igual(seleccion.sostenido, 1);
  igual(seleccion.ordenados, [0]);
});

prueba('Insertion Sort: arreglo ya ordenado hace n−1 comparaciones y 0 movimientos', () => {
  const h = ordenarInsertionSort([1, 2, 3, 4, 5]);
  igual(ultimo(h).comparaciones, 4);
  igual(ultimo(h).intercambios, 0);
});

prueba('Bubble Sort: ejemplo fijo y parada temprana', () => {
  const h = ordenarBubbleSort([3, 1, 2]);
  verificarHistorial('bubble', h, [3, 1, 2]);
  igual(ultimo(h).intercambios, 2);
  const h2 = ordenarBubbleSort([1, 2, 3, 4, 5, 6]);
  igual(ultimo(h2).comparaciones, 5, 'una sola pasada si ya está ordenado');
  igual(ultimo(h2).intercambios, 0);
});

prueba('Bubble Sort: fija el mayor al final de cada pasada', () => {
  const h = ordenarBubbleSort([5, 1, 4, 2]);
  const fijados = h.filter(p => p.tipo === 'fijar');
  igual(fijados[0].ordenados, [3]);
  igual(valoresDePinos(fijados[0].arreglo)[3], 5);
});

prueba('Shell Sort: usa saltos decrecientes hasta 1 sin fijar posiciones antes del final', () => {
  const h = ordenarShellSort([12, 4, 9, 1, 7, 3]);
  verificarHistorial('shell', h, [12, 4, 9, 1, 7, 3]);
  igual(h.filter(p => p.tipo === 'seleccion').map(p => p.salto), [3, 1]);
  cierto(h.filter(p => p.tipo !== 'fin').every(p => p.ordenados.length === 0), 'no marca posiciones definitivas en las pasadas');
  cierto(h.some(p => p.tipo === 'comparar' && p.grupo && p.grupo.length > 1), 'muestra el grupo comparado');
});

prueba('Merge Sort: divisiones y mezclas reales, estable con valores repetidos', () => {
  const h = ordenarMergeSort([4, 2, 4, 1, 2, 4]);
  verificarHistorial('merge', h, [4, 2, 4, 1, 2, 4]);
  cierto(h.some(p => p.tipo === 'seleccion' && p.segmento), 'registra divisiones o segmentos');
  cierto(h.some(p => p.auxiliar && p.auxiliar.some(Boolean)), 'expone escrituras en el auxiliar');
  const fin = ultimo(h).arreglo;
  const iguales = {};
  fin.forEach(p => { (iguales[p.valor] = iguales[p.valor] || []).push(Number(p.id.slice(1))); });
  Object.values(iguales).forEach(ids => igual(ids, ids.slice().sort((a, b) => a - b), 'Merge conserva el orden original de iguales'));
});

prueba('Shell y Merge ordenan tamaños mínimo/máximo, invertidos y repeticiones', () => {
  [ordenarShellSort, ordenarMergeSort].forEach(fn => {
    [[7, 6, 5], [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], [5, 5, 5, 1, 1, 9, 9]].forEach(valores => {
      verificarHistorial(fn === ordenarShellSort ? 'shell' : 'merge', fn(valores), valores);
    });
  });
});

prueba('Cada paso mantiene instantáneas independientes del arreglo y el auxiliar', () => {
  const h = ordenarMergeSort([6, 2, 5, 1]);
  const originalSiguiente = h[2].arreglo[0].valor;
  h[1].arreglo[0].valor = -100;
  igual(h[2].arreglo[0].valor, originalSiguiente);
  const conAuxiliar = h.find(p => p.auxiliar && p.auxiliar.some(Boolean));
  const siguienteAuxiliar = h[h.indexOf(conAuxiliar) + 1];
  if (conAuxiliar && siguienteAuxiliar && siguienteAuxiliar.auxiliar) {
    conAuxiliar.auxiliar[0].valor = -200;
    cierto(siguienteAuxiliar.auxiliar[0].valor !== -200, 'el auxiliar de pasos distintos no comparte objetos');
  }
});

prueba('Casos borde: vacío, un elemento, repetidos', () => {
  Object.entries(ALGORITMOS).forEach(([nombre, fn]) => {
    igual(fn([]).length, 1, nombre + ' vacío');
    igual(valoresDePinos(ultimo(fn([7])).arreglo), [7], nombre + ' un elemento');
    verificarHistorial(nombre, fn([2, 2, 1, 1, 2]), [2, 2, 1, 1, 2]);
  });
});

prueba('Estabilidad: Insertion, Bubble y Merge conservan el orden de iguales', () => {
  const valores = [3, 1, 3, 2, 1];
  ['insertion', 'bubble', 'merge'].forEach(nombre => {
    const fin = ultimo(ALGORITMOS[nombre](valores)).arreglo;
    const idsPorValor = {};
    fin.forEach(p => { (idsPorValor[p.valor] = idsPorValor[p.valor] || []).push(parseInt(p.id.slice(1), 10)); });
    Object.values(idsPorValor).forEach(ids => igual(ids, ids.slice().sort((a, b) => a - b), nombre + ' es estable'));
  });
});

prueba('300 arreglos aleatorios: los cinco algoritmos ordenan y cumplen los invariantes', () => {
  for (let k = 0; k < 300; k++) {
    const n = LIMITES.cantidadMin + Math.floor(Math.random() * 10);
    const valores = generarValoresOrdenamiento(n);
    Object.entries(ALGORITMOS).forEach(([nombre, fn]) => verificarHistorial(nombre, fn(valores), valores));
  }
});

prueba('ejecutarOrdenamiento: despacha por nombre y rechaza desconocidos', () => {
  igual(valoresDePinos(ultimo(ejecutarOrdenamiento('bubble', [2, 1])).arreglo), [1, 2]);
  lanza(() => ejecutarOrdenamiento('quick', [1]));
});

prueba('analizarValoresOrdenamiento: separadores, rangos y errores', () => {
  igual(analizarValoresOrdenamiento('45, 12;78 3  56', LIMITES), { ok: true, valores: [45, 12, 78, 3, 56] });
  igual(analizarValoresOrdenamiento('1 2', LIMITES).ok, false, 'pocos valores');
  igual(analizarValoresOrdenamiento(Array(LIMITES.cantidadMax + 1).fill(1).join(' '), LIMITES).ok, false, 'demasiados');
  igual(analizarValoresOrdenamiento('1 2 abc', LIMITES).ok, false, 'texto');
  igual(analizarValoresOrdenamiento('1 2 2.5', LIMITES).ok, false, 'decimal');
  igual(analizarValoresOrdenamiento('0 5 9', LIMITES).ok, false, 'fuera de rango');
  igual(analizarValoresOrdenamiento('', LIMITES).ok, false, 'vacío');
});

prueba('generarValoresOrdenamiento respeta cantidad y límites', () => {
  const v = generarValoresOrdenamiento(12);
  igual(v.length, 12);
  cierto(v.every(x => Number.isInteger(x) && x >= LIMITES.min && x <= LIMITES.max));
});

prueba('Persistencia: la instantánea se depura de ida y vuelta', () => {
  const estado = { algoritmo: 'merge', valores: [5, 3, 9], pasoActual: 4 };
  const foto = instantaneaOrdenamiento(estado, 300);
  igual(foto, { version: 1, algoritmo: 'merge', valores: [5, 3, 9], pasoActual: 4, velocidad: '300' });
  igual(depurarEstadoOrdenamiento(foto), { algoritmo: 'merge', valores: [5, 3, 9], pasoActual: 4, velocidad: '300' });
  cierto(foto.valores !== estado.valores, 'la instantánea copia el arreglo');
});

prueba('Persistencia: rechaza datos inválidos y normaliza paso y velocidad', () => {
  igual(depurarEstadoOrdenamiento(null), null);
  igual(depurarEstadoOrdenamiento({ algoritmo: 'quick', valores: [1, 2, 3] }), null, 'algoritmo desconocido');
  igual(depurarEstadoOrdenamiento({ algoritmo: 'bubble', valores: [1, 2] }), null, 'pocos valores');
  igual(depurarEstadoOrdenamiento({ algoritmo: 'bubble', valores: [1, 2, 500] }), null, 'fuera de rango');
  igual(depurarEstadoOrdenamiento({ algoritmo: 'bubble', valores: '1,2,3' }), null, 'valores no es arreglo');
  igual(depurarEstadoOrdenamiento({ algoritmo: 'toString', valores: [1, 2, 3] }), null, 'no usa propiedades heredadas');
  igual(depurarEstadoOrdenamiento({ version: 8, algoritmo: 'bubble', valores: [1, 2, 3] }), null, 'versión incompatible');
  igual(depurarEstadoOrdenamiento({ algoritmo: 'bubble', valores: [1, '2', 3] }), null, 'tipos numéricos estrictos');
  const limpio = depurarEstadoOrdenamiento({ algoritmo: 'shell', valores: [3, 2, 1], pasoActual: -2, velocidad: 999 });
  igual(limpio, { algoritmo: 'shell', valores: [3, 2, 1], pasoActual: 0, velocidad: '650' });
});

prueba('Cinco métodos con 40, 100 y 200: ordenados, inversos y repetidos; resultado, IDs y conteos', () => {
  const { ejecutarOrdenamientoCompacto, obtenerPasoOrdenamiento } = ctx;
  for (const n of [40, 100, LIMITES.cantidadMax]) {
    const ascendente = Array.from({ length: n }, (_, i) => 1 + Math.floor(i * 98 / Math.max(1, n - 1)));
    for (const valores of [ascendente, ascendente.slice().reverse(), Array.from({ length: n }, (_, i) => 1 + ((i * 37 + 11) % 7))]) {
      for (const nombre of Object.keys(ALGORITMOS)) {
        const registro = ejecutarOrdenamientoCompacto(nombre, valores);
        const total = registro.eventos.length;
        const fin = obtenerPasoOrdenamiento(registro, total - 1);
        igual(valoresDePinos(fin.arreglo), ordenado(valores), nombre + ' referencia numérica, n=' + n);
        igual(fin.ordenados.length, n);
        igual(registro.eventos.filter(p => p.tipo === 'comparar').length, fin.comparaciones);
        igual(registro.eventos.reduce((sum, p) => sum + p.movimientos, 0), fin.intercambios);
        cierto(registro.eventos.every(p => !p.arreglo && !p.auxiliar && !p.ordenados), 'eventos sin snapshots completos');
        igual(registro.checkpoints.length, Math.ceil(total / 128));
        const ids = fin.arreglo.map(p => p.id).sort();
        igual(ids, Array.from({ length: n }, (_, i) => 'p' + i).sort());
        // Navegar hacia adelante, atrás, al final y al inicio, incluidos límites de checkpoint.
        for (const indice of [0, Math.min(127, total - 1), Math.min(128, total - 1), Math.min(129, total - 1), total - 1, Math.min(128, total - 1), 1, 0]) {
          const paso = obtenerPasoOrdenamiento(registro, indice);
          igual(paso.arreglo.map(p => p.id).sort(), ids, 'navegación conserva identificadores');
          igual(ordenado(valoresDePinos(paso.arreglo)), ordenado(valores), 'navegación conserva permutación');
          cierto(paso.linea >= -1 && paso.linea < PSEUDOCODIGO[nombre].length);
        }
        if (['insertion', 'bubble', 'merge'].includes(nombre)) {
          for (let i = 1; i < n; i++) if (fin.arreglo[i].valor === fin.arreglo[i - 1].valor) cierto(Number(fin.arreglo[i - 1].id.slice(1)) < Number(fin.arreglo[i].id.slice(1)), nombre + ' conserva estabilidad');
        }
      }
    }
  }
});

prueba('Entrada y persistencia aceptan el máximo medido y rechazan excesos sin modificarlo', () => {
  const valores = generarValoresOrdenamiento(LIMITES.cantidadMax);
  cierto(analizarValoresOrdenamiento(valores.join(', '), LIMITES).ok);
  igual(depurarEstadoOrdenamiento({ version: 1, algoritmo: 'merge', valores }).valores, valores);
  igual(depurarEstadoOrdenamiento({ algoritmo: 'merge', valores: valores.concat(1) }), null);
  lanza(() => generarValoresOrdenamiento(LIMITES.cantidadMax + 1));
  lanza(() => generarValoresOrdenamiento(NaN));
  lanza(() => generarValoresOrdenamiento(3.5));
});

prueba('API indexada grande consulta snapshots a demanda sin conservarlos por evento', () => {
  const valores = Array.from({ length: 40 }, (_, i) => 1 + i % 99).reverse();
  const h = ejecutarOrdenamiento('bubble', valores);
  cierto(Array.isArray(h));
  cierto(h.length > 1000);
  igual(valoresDePinos(h[0].arreglo), valores);
  igual(valoresDePinos(h[h.length - 1].arreglo), ordenado(valores));
  cierto(h[0] !== h[0], 'la consulta no almacena snapshots completos');
  let eventos = 0;
  h.forEach(() => { eventos++; });
  igual(eventos, h.length, 'forEach visita todos los eventos del array disperso');
  igual(h.map(p => p.tipo)[h.length - 1], 'fin', 'map conserva la API nativa');
});

async function verificarPreparacion() {
  let cesiones = 0;
  let cancelado = false;
  const valores = Array.from({ length: 200 }, (_, i) => 99 - i % 99);
  const canceladoResultado = await ctx.prepararOrdenamiento('bubble', valores, {
    cancelado: () => cancelado,
    ceder: async () => { cesiones++; cancelado = true; }
  });
  prueba('Preparación cooperativa cede y descarta un cálculo cancelado', () => {
    cierto(cesiones > 0);
    igual(canceladoResultado, null);
  });
  cesiones = 0;
  const completo = await ctx.prepararOrdenamiento('bubble', valores, { ceder: async () => { cesiones++; } });
  prueba('Preparación cooperativa completa conserva resultado y cede en lotes', () => {
    cierto(cesiones > 10);
    igual(valoresDePinos(ctx.obtenerPasoOrdenamiento(completo, completo.eventos.length - 1).arreglo), ordenado(valores));
  });
}
verificarPreparacion().then(() => process.exit(informe('Ordenamiento') ? 0 : 1)).catch(error => { console.error(error); process.exit(1); });
