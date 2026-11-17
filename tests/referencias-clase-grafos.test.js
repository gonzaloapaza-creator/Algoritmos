'use strict';
const { crearContexto, cargar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const c = cargar(crearContexto(), ['js/config.js', 'js/grafos/modelo.js', 'js/grafos/algoritmos.js']);

prueba('Referencia Dijkstra: rutas originales y cuatro/dos aristas, mínimo 101 y máximo 121', () => {
  const g = c.crearEjemploGrafo('dijkstra', 'referencia-clase'), antes = JSON.stringify(g);
  for (const [resolver, total, nombres, pesos] of [
    [c.resolverDijkstraGrafo, 101, ['A','C','E','B','D'], [23,23,23,32]],
    [c.resolverCaminoMaximoDAG, 121, ['A','E','D'], [52,69]]
  ]) {
    const r = resolver(g, 'n1'), ruta = c.reconstruirRutaGrafo(r, 'n4');
    igual(ruta.distancia, total);
    igual(ruta.nodos.map(id => g.nodos.find(n => n.id === id).nombre), nombres);
    igual(ruta.conexiones.map(id => g.conexiones.find(e => e.id === id).valor), pesos);
    igual(ruta.conexiones.length, pesos.length);
    igual(r.pasos[r.pasos.length - 1].distancias.n4, total);
  }
  igual(JSON.stringify(g), antes);
});
prueba('Referencia Kruskal: mínimo 10 estable y máximo 13, tres de cuatro aristas', () => {
  const g = c.crearEjemploGrafo('kruskal', 'referencia-clase');
  for (const [objetivo, total, elegidas] of [['min',10,['c1','c2','c3']], ['max',13,['c3','c4','c2']]]) {
    const r = c.resolverKruskalGrafo(g, objetivo);
    igual(r.total, total); igual(r.elegidas, elegidas); igual(r.elegidas.length, 3);
    igual(r.componentes.length, 1); igual(r.pasos.length, 4);
    igual(r.pasos[r.pasos.length - 1].total, total);
    cierto(r.pasos.some(p => !p.aceptada));
  }
});
prueba('Referencias no alteran los documentos anteriores; rechazan ciclos máximos y no dirigidos', () => {
  for (const modulo of ['dijkstra', 'kruskal']) {
    for (const id of ['obligatorio', 'ceros', 'desconectado', 'referencia-clase']) {
      const grafo = c.crearEjemploGrafo(modulo, id);
      cierto(c.validarDocumentoGrafo({ version: 1, modulo, grafo }, modulo).ok);
    }
  }
  const g = c.crearEjemploGrafo('dijkstra', 'referencia-clase');
  g.conexiones.push({ id: 'inversa', desde: 'n4', hacia: 'n1', valor: 0 });
  lanza(() => c.resolverCaminoMaximoDAG(g, 'n1'));
  igual(c.resolverDijkstraGrafo(g, 'n1').distancias.n4, 101);
  g.conexiones.pop(); g.dirigido = false;
  lanza(() => c.resolverCaminoMaximoDAG(g, 'n1'));
});
if (!informe('Referencias de clase · Dijkstra y Kruskal')) process.exitCode = 1;
