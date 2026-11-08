'use strict';

const { crearContexto, cargar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const ctx = crearContexto();
let cesionesReales = 0;
ctx.setTimeout = (fn, demora) => { cesionesReales++; return setTimeout(fn, demora); };
cargar(ctx, ['js/config.js', 'js/johnson.js', 'js/johnson/caminos.js', 'js/johnson/ejemplos.js']);

function grafo(nombres, aristas) {
  return {
    nodos: nombres.map(nombre => ({ id: nombre, nombre })),
    conexiones: aristas.map(([desde, hacia, valor], indice) => ({ id: 'e' + indice, desde, hacia, valor }))
  };
}
const temporal = (g, origen, destino) => ctx.calcularTiemposHolgurasJohnson(g.nodos, g.conexiones, origen, destino);
const maximos = (g, origen) => ctx.calcularMaximosDAGJohnson(g.nodos, g.conexiones, origen);
const minimos = g => ctx.calcularJohnsonDesde(ctx.prepararDatosJohnson(g.nodos, g.conexiones));
const enumerar = (g, origen, destino, opciones) => ctx.enumerarCaminosSimplesJohnson(g.nodos, g.conexiones, origen, destino, opciones);

prueba('Referencia A→B: mínimo 19, máximo 58 y tiempos/holguras independientes', () => {
  const g = grafo(['A', 'E', 'D', 'B'], [['A', 'B', 58], ['A', 'E', 6], ['E', 'D', 5], ['D', 'B', 8]]);
  const copia = JSON.stringify(g);
  const min = minimos(g), max = maximos(g, 'A'), t = temporal(g, 'A', 'B');
  const rutaMin = ctx.reconstruirRutaJohnson(0, 3, min);
  const rutaMax = ctx.reconstruirMaximoDAGJohnson('B', max);
  igual(rutaMin.nodos, ['A', 'E', 'D', 'B']);
  igual(ctx.pesosDeRutaJohnson(rutaMin, min), [6, 5, 8]);
  igual(rutaMin.distancia, 19);
  igual(rutaMax.nodos, ['A', 'B']);
  igual(rutaMax.distancia, 58);
  igual([min.distancias[0][3], max.distancias[3]], [19, 58]);
  cierto(t.valido);
  igual(t.tempranos, [0, 6, 11, 58]);
  igual(t.tardios, [0, 45, 50, 58]);
  igual(t.duracion, 58);
  igual(t.holguras, { e0: 0, e1: 39, e2: 39, e3: 39 });
  igual(t.criticas, ['e0']);
  igual(JSON.stringify(g), copia, 'Los motores no deben modificar el ejercicio');
});

prueba('El ejemplo de referencia queda disponible con sus pesos originales', () => {
  const ejemplo = ctx.ejemploJohnsonPorId('tiempos-holguras');
  cierto(ejemplo);
  const g = ctx.grafoDeEjemploJohnson(ejemplo, 800, 600, 26);
  const origen = g.nodos.find(n => n.nombre === 'A').id;
  const destino = g.nodos.find(n => n.nombre === 'B').id;
  igual(temporal(g, origen, destino).duracion, 58);
  igual(minimos(g).distancias[0][3], 19);
});

prueba('Temporal excluye ramas sin llegada al destino y nodos sin llegada desde el origen', () => {
  const g = grafo(['A', 'B', 'C', 'X', 'Y', 'Z'], [['A', 'B', 2], ['B', 'C', 3], ['A', 'X', 100], ['Y', 'C', 100]]);
  const t = temporal(g, 'A', 'C');
  cierto(t.valido);
  igual(t.idsActivos, ['A', 'B', 'C']);
  igual(t.conexionesActivas, ['e0', 'e1']);
  igual(t.tempranos, [0, 2, 5, null, null, null]);
  igual(t.tardios, [0, 2, 5, null, null, null]);
  igual(t.holguras, { e0: 0, e1: 0 });
});

prueba('La holgura de la arista decide criticidad aunque sus dos nodos sean críticos', () => {
  const g = grafo(['A', 'B', 'C'], [['A', 'B', 5], ['B', 'C', 5], ['A', 'C', 2]]);
  const t = temporal(g, 'A', 'C');
  igual(t.tempranos, [0, 5, 10]);
  igual(t.tardios, [0, 5, 10]);
  igual(t.holguras.e2, 8);
  igual(t.criticas, ['e0', 'e1']);
});

prueba('Temporal admite duración cero y tolera únicamente el redondeo numérico pequeño', () => {
  const cero = temporal(grafo(['A', 'B'], [['A', 'B', 0]]), 'A', 'B');
  igual(cero.tempranos, [0, 0]);
  igual(cero.tardios, [0, 0]);
  igual(cero.criticas, ['e0']);
  const decimal = temporal(grafo(['A', 'B', 'C'], [['A', 'B', 0.1], ['B', 'C', 0.2], ['A', 'C', 0.3]]), 'A', 'C');
  igual(decimal.criticas, ['e0', 'e1', 'e2']);
  const grande = temporal(grafo(['A', 'B', 'C'], [['A', 'B', 999999], ['B', 'C', 999999], ['A', 'C', 999999]]), 'A', 'C');
  igual(grande.holguras.e2, 999999);
  cierto(!grande.criticas.includes('e2'));
});

prueba('Temporal rechaza duraciones negativas incluso fuera de la subred seleccionada', () => {
  const g = grafo(['A', 'B', 'X', 'Y'], [['A', 'B', 3], ['X', 'Y', -1]]);
  const t = temporal(g, 'A', 'B');
  igual(t.valido, false);
  igual(t.motivo, 'duraciones-negativas');
  igual(t.duracion, null);
});

prueba('Temporal y máximos requieren DAG global, también con un ciclo ajeno al origen', () => {
  const g = grafo(['A', 'B', 'X', 'Y', 'Z'], [['A', 'B', 3], ['X', 'Y', 1], ['Y', 'Z', 1], ['Z', 'X', 1]]);
  igual(temporal(g, 'A', 'B').motivo, 'ciclo');
  const max = maximos(g, 'A');
  igual(max.aciclico, false);
  igual(max.distancias, null);
  igual(ctx.reconstruirMaximoDAGJohnson('B', max), null);
  igual(minimos(g).distancias[0][1], 3, 'El ciclo positivo no invalida el mínimo Johnson');
});

prueba('Origen=destino conserva ruta trivial 0 en consulta y se rechaza en temporal', () => {
  const g = grafo(['A', 'B'], [['A', 'B', 4]]);
  igual(ctx.reconstruirRutaJohnson(0, 0, minimos(g)).distancia, 0);
  const max = ctx.reconstruirMaximoDAGJohnson('A', maximos(g, 'A'));
  igual(max.nodos, ['A']);
  igual(max.conexiones, []);
  igual(max.distancia, 0);
  igual(temporal(g, 'A', 'A').motivo, 'origen-destino-iguales');
});

prueba('Inalcanzable queda sin ruta y sin análisis temporal', () => {
  const g = grafo(['A', 'B', 'C'], [['A', 'B', 4]]);
  igual(ctx.reconstruirRutaJohnson(0, 2, minimos(g)), null);
  const max = maximos(g, 'A');
  cierto(max.distancias[2] === -Infinity);
  igual(ctx.reconstruirMaximoDAGJohnson('C', max), null);
  igual(temporal(g, 'A', 'C').motivo, 'sin-camino');
});

prueba('Pesos negativos: Johnson conserva mínimos y máximo DAG usa su motor propio', () => {
  const g = grafo(['A', 'B', 'C'], [['A', 'B', -4], ['A', 'C', -1], ['C', 'B', -1]]);
  igual(minimos(g).distancias[0][1], -4);
  const max = ctx.reconstruirMaximoDAGJohnson('B', maximos(g, 'A'));
  igual(max.nodos, ['A', 'C', 'B']);
  igual(max.distancia, -2);
  igual(temporal(g, 'A', 'B').motivo, 'duraciones-negativas');
});

prueba('Un ciclo negativo impide mínimo Johnson y no se sustituye por enumeración', () => {
  const g = grafo(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['B', 'C', -4], ['C', 'A', 2], ['C', 'D', 3]]);
  const min = minimos(g);
  igual(min.tieneCicloNegativo, true);
  cierto(min.cicloPeso < 0);
  igual(min.distancias, null);
  igual(ctx.reconstruirRutaJohnson(0, 3, min), null);
  igual(maximos(g, 'A').aciclico, false);
});

prueba('Temporal rechaza referencias o pesos malformados sin omitir conexiones', () => {
  const g = grafo(['A', 'B'], [['A', 'B', 2]]);
  lanza(() => temporal(g, 'A', 'inexistente'));
  g.conexiones[0].hacia = 'inexistente';
  lanza(() => temporal(g, 'A', 'B'));
  g.conexiones[0].hacia = 'B';
  g.conexiones[0].valor = Infinity;
  lanza(() => temporal(g, 'A', 'B'));
});

async function pruebaAsync(nombre, fn) {
  let error;
  try { await fn(); } catch (e) { error = e; }
  prueba(nombre, () => { if (error) throw error; });
}

(async () => {
  await pruebaAsync('Alternativas enumera caminos simples, con IDs y pesos originales, en una red cíclica', async () => {
    const g = grafo(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['B', 'C', 2], ['C', 'A', 3], ['B', 'D', 4], ['A', 'D', 10], ['C', 'D', 1]]);
    const antes = JSON.stringify(g);
    const r = await enumerar(g, 'A', 'D');
    igual(r.truncada, false);
    igual(r.cancelada, false);
    igual(r.rutas.map(ruta => ruta.nodos), [['A', 'B', 'C', 'D'], ['A', 'B', 'D'], ['A', 'D']]);
    igual(r.rutas.map(ruta => ruta.distancia), [4, 5, 10]);
    cierto(r.rutas.every(ruta => new Set(ruta.nodos).size === ruta.nodos.length));
    cierto(r.rutas.every(ruta => ruta.pesos.reduce((a, b) => a + b, 0) === ruta.distancia));
    igual(new Set(r.rutas.map(ruta => ruta.id)).size, r.rutas.length);
    igual(JSON.stringify(g), antes);
  });

  await pruebaAsync('El límite de rutas identifica lista parcial y no afirma orden óptimo', async () => {
    const g = grafo(['A', 'B', 'C', 'D'], [['A', 'D', 50], ['A', 'B', 1], ['B', 'D', 1], ['A', 'C', 2], ['C', 'D', 2]]);
    const min = minimos(g), max = maximos(g, 'A');
    const r = await enumerar(g, 'A', 'D', { maxRutas: 1 });
    igual(r.rutas.length, 1);
    igual(r.rutas[0].distancia, 50);
    igual(r.truncada, true);
    igual(r.motivo, 'limite-rutas');
    igual(r.orden, 'profundidad');
    igual(min.distancias[0][3], 2);
    igual(max.distancias[3], 50);
  });

  await pruebaAsync('Exactamente el límite de rutas se informa como búsqueda completa si termina', async () => {
    const g = grafo(['A', 'B', 'C'], [['A', 'C', 4], ['A', 'B', 1], ['B', 'C', 1]]);
    const r = await enumerar(g, 'A', 'C', { maxRutas: 2 });
    igual(r.rutas.length, 2);
    igual(r.truncada, false);
  });

  await pruebaAsync('Límite de trabajo también corta la búsqueda sin alcanzar ninguna ruta', async () => {
    const g = grafo(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1]]);
    const r = await enumerar(g, 'A', 'D', { maxTrabajo: 1 });
    igual(r.rutas, []);
    igual(r.trabajo, 1);
    igual(r.truncada, true);
    igual(r.motivo, 'limite-trabajo');
    igual(r.limites, { rutas: 30, trabajo: 1 });
  });

  await pruebaAsync('Cancelación inicial mediante AbortSignal no explora la red', async () => {
    const controller = new AbortController();
    controller.abort();
    const r = await enumerar(grafo(['A', 'B'], [['A', 'B', 1]]), 'A', 'B', { signal: controller.signal });
    igual(r.cancelada, true);
    igual(r.truncada, true);
    igual(r.motivo, 'cancelacion');
    igual(r.trabajo, 0);
  });

  await pruebaAsync('Cancelación durante una cesión de control conserva solo la lista parcial', async () => {
    const controller = new AbortController();
    let cesiones = 0;
    const g = grafo(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['A', 'D', 9]]);
    const r = await enumerar(g, 'A', 'D', { signal: controller.signal, cederCada: 1, ceder: async () => { if (++cesiones === 2) controller.abort(); } });
    igual(cesiones, 2);
    igual(r.cancelada, true);
    igual(r.trabajo, 1);
    igual(r.rutas.length, 0);
  });

  await pruebaAsync('Cesión predeterminada usa temporizador y se repite durante la exploración', async () => {
    const antes = cesionesReales;
    const g = grafo(['A', 'B', 'C'], [['A', 'B', 1], ['B', 'C', 1]]);
    const r = await enumerar(g, 'A', 'C', { cederCada: 1 });
    cierto(cesionesReales - antes >= 2);
    igual(r.rutas[0].distancia, 2);
  });

  await pruebaAsync('Enumeración trabaja sobre una copia si el documento cambia durante la cesión', async () => {
    const g = grafo(['A', 'B'], [['A', 'B', 2]]);
    const r = await enumerar(g, 'A', 'B', { ceder: async () => { g.conexiones[0].valor = 99; g.nodos[1].id = 'otro'; } });
    igual(r.rutas[0].nodos, ['A', 'B']);
    igual(r.rutas[0].pesos, [2]);
    igual(r.rutas[0].distancia, 2);
  });

  await pruebaAsync('Enumeración sin camino y ruta trivial informan finalización completa', async () => {
    const g = grafo(['A', 'B'], []);
    const sinCamino = await enumerar(g, 'A', 'B');
    igual(sinCamino.rutas, []);
    igual(sinCamino.truncada, false);
    const trivial = await enumerar(g, 'A', 'A', { maxRutas: 1 });
    igual(trivial.rutas[0].nodos, ['A']);
    igual(trivial.rutas[0].distancia, 0);
    igual(trivial.rutas[0].conexiones, []);
    igual(trivial.truncada, false);
  });

  process.exitCode = informe('Johnson FASE 1: tiempos, holguras y alternativas') ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
