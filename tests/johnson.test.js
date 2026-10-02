'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, informe } = require('./cargar');

const ctx = cargar(crearContexto(), [
  'js/config.js',
  'js/johnson.js',
  'js/johnson/ejemplos.js'
]);

const {
  prepararDatosJohnson, calcularJohnsonDesde, reconstruirRutaJohnson, pesosDeRutaJohnson,
  grafoDeEjemploJohnson, ejemploJohnsonPorId, formatearDistancia
} = ctx;
const EJEMPLOS_JOHNSON = evaluar(ctx, 'EJEMPLOS_JOHNSON');

/** Grafo pequeño a partir de nombres y tripletas [desde, hacia, peso]. */
function grafo(nombres, aristas) {
  const nodos = nombres.map((nombre, i) => ({ id: 'n_' + i, nombre }));
  const id = nombre => 'n_' + nombres.indexOf(nombre);
  const conexiones = aristas.map(([a, b, peso], i) => ({ id: 'c_' + i, desde: id(a), hacia: id(b), valor: peso }));
  return { nodos, conexiones };
}

function resolver(g) {
  return calcularJohnsonDesde(prepararDatosJohnson(g.nodos, g.conexiones));
}

/** Referencia independiente: Floyd-Warshall. */
function floyd(g) {
  const n = g.nodos.length;
  const indice = new Map(g.nodos.map((nd, i) => [nd.id, i]));
  const d = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => (i === j ? 0 : Infinity)));
  g.conexiones.forEach(c => {
    const a = indice.get(c.desde), b = indice.get(c.hacia);
    d[a][b] = Math.min(d[a][b], c.valor);
  });
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  }
  return { d, ciclo: d.some((fila, i) => fila[i] < 0) };
}

/** Generador determinista (LCG) para que las pruebas aleatorias sean repetibles. */
function azar(semilla) {
  let s = semilla;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

prueba('Ejemplo clásico: distancias, potenciales y pesos reponderados', () => {
  const ej = ejemploJohnsonPorId('negativos');
  const g = grafoDeEjemploJohnson(ej, 800, 500, 26);
  const r = resolver(g);
  igual(r.tieneCicloNegativo, false);
  igual(r.potenciales, [0, -1, -5, 0, -4]);
  igual(r.distancias, [[0, 1, -3, 2, -4], [3, 0, -4, 1, -1], [7, 4, 0, 5, 3], [2, -1, -5, 0, -2], [8, 5, 1, 6, 0]]);
  cierto(r.aristas.every(a => a.pesoReponderado >= 0), 'Hay pesos reponderados negativos');
});

prueba('Ruta a → c del ejemplo clásico: a → e → d → c, suma −3', () => {
  const r = resolver(grafoDeEjemploJohnson(ejemploJohnsonPorId('negativos'), 800, 500, 26));
  const ruta = reconstruirRutaJohnson(0, 2, r);
  igual(ruta.indices, [0, 4, 3, 2]);
  igual(pesosDeRutaJohnson(ruta, r), [-4, 6, -5]);
  igual(ruta.distancia, -3);
});

prueba('Pasos registrados: orden y cantidad', () => {
  const r = resolver(grafoDeEjemploJohnson(ejemploJohnsonPorId('negativos'), 800, 500, 26));
  const tipos = r.pasos.map(p => p.tipo);
  igual(tipos[0], 'original');
  igual(tipos[1], 'auxiliar');
  cierto(tipos.filter(t => t === 'bellman').length === r.pasadas.length, 'Una entrada por pasada');
  igual(tipos.filter(t => t === 'dijkstra').length, 5);
  igual(tipos[tipos.length - 1], 'final');
  // La última pasada de Bellman-Ford no mejora nada (se detiene antes de tiempo).
  igual(r.pasadas[r.pasadas.length - 1].relajaciones.length, 0);
});

prueba('Solo positivos: potenciales 0 y pesos sin cambios', () => {
  const r = resolver(grafoDeEjemploJohnson(ejemploJohnsonPorId('positivos'), 800, 500, 26));
  cierto(r.potenciales.every(h => h === 0), 'Potenciales distintos de 0');
  cierto(r.aristas.every(a => a.peso === a.pesoReponderado), 'La reponderación cambió algún peso');
  igual(r.distancias[0][4], 20);   // A → C → F → E = 9 + 2 + 9
});

prueba('Nodos sin camino: ∞ y sin ruta', () => {
  const r = resolver(grafoDeEjemploJohnson(ejemploJohnsonPorId('inalcanzables'), 800, 500, 26));
  igual(r.distancias[3][0], Infinity);
  igual(reconstruirRutaJohnson(3, 0, r), null);
  igual(formatearDistancia(Infinity), '∞');
});

prueba('Ceros y bucle positivo: el bucle no cambia las distancias', () => {
  const g = grafoDeEjemploJohnson(ejemploJohnsonPorId('ceros'), 800, 500, 26);
  const r = resolver(g);
  igual(r.tieneCicloNegativo, false);
  igual(r.distancias, floyd(g).d);
  igual(r.distancias[0][2], -1);   // a → b → d → c = 0 − 2 + 1
});

prueba('Ciclo negativo: se detecta, se reconstruye y suma negativo', () => {
  const r = resolver(grafoDeEjemploJohnson(ejemploJohnsonPorId('ciclo'), 800, 500, 26));
  igual(r.tieneCicloNegativo, true);
  igual(r.ciclo, ['a', 'b', 'c']);
  igual(r.cicloConexiones.length, 3);
  igual(r.cicloPeso, -1);
  igual(r.pasos[r.pasos.length - 1].tipo, 'ciclo');
  igual(r.distancias, null);
});

prueba('Bucle negativo en un solo nodo', () => {
  const r = resolver(grafo(['a', 'b'], [['a', 'a', -1], ['a', 'b', 2]]));
  igual(r.tieneCicloNegativo, true);
  igual(r.ciclo, ['a']);
  igual(r.cicloPeso, -1);
});

prueba('Ejemplos: ids únicos, conexiones válidas y posiciones dentro del área', () => {
  EJEMPLOS_JOHNSON.forEach(ej => {
    const g = grafoDeEjemploJohnson(ej, 360, 300, 26);
    const ids = g.nodos.map(n => n.id).concat(g.conexiones.map(c => c.id));
    igual(new Set(ids).size, ids.length, ej.id + ': ids repetidos');
    cierto(g.conexiones.every(c => c.desde && c.hacia), ej.id + ': conexión con nodo inexistente');
    cierto(g.nodos.every(n => n.x >= 26 && n.x <= 334 && n.y >= 26 && n.y <= 274), ej.id + ': nodo fuera del área');
    cierto(g.siguienteId > ids.length, ej.id + ': siguienteId chocaría con un id existente');
  });
});

prueba('300 grafos aleatorios coinciden con Floyd-Warshall (y las rutas suman su distancia)', () => {
  const r01 = azar(7);
  let ciclos = 0;
  for (let t = 0; t < 300; t++) {
    const n = 1 + Math.floor(r01() * 7);
    const nombres = [...Array(n)].map((_, i) => 'v' + i);
    const aristas = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (r01() < 0.35) aristas.push([nombres[i], nombres[j], Math.floor(r01() * 15) - 4]);
    }
    const g = grafo(nombres, aristas);
    const r = resolver(g);
    const ref = floyd(g);
    igual(r.tieneCicloNegativo, ref.ciclo, 'Detección de ciclo distinta (caso ' + t + ')');
    if (ref.ciclo) {
      ciclos++;
      const suma = r.cicloConexiones.map(id => g.conexiones.find(c => c.id === id).valor).reduce((a, b) => a + b, 0);
      cierto(r.ciclo.length > 0 && r.cicloConexiones.length === r.ciclo.length && suma < 0, 'Ciclo mal reconstruido (caso ' + t + ')');
      continue;
    }
    igual(r.distancias, ref.d, 'Distancias distintas (caso ' + t + ')');
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const ruta = reconstruirRutaJohnson(i, j, r);
      if (!ruta) { igual(r.distancias[i][j], Infinity); continue; }
      igual(pesosDeRutaJohnson(ruta, r).reduce((a, b) => a + b, 0), r.distancias[i][j], 'Ruta que no suma su distancia');
    }
  }
  cierto(ciclos > 0, 'Las pruebas aleatorias no generaron ningún ciclo negativo');
});

process.exitCode = informe('Johnson') ? 0 : 1;
