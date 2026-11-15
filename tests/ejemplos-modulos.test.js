'use strict';
const { crearContexto, cargar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const c = cargar(crearContexto(), ['js/config.js', 'js/grafos/modelo.js', 'js/grafos/algoritmos.js', 'js/arboles/modelo.js', 'js/arboles/validacion.js', 'js/arboles/reconstruccion.js', 'js/difusa/motor.js', 'js/difusa/modelo.js']);
prueba('Catálogos ofrecen ejemplos válidos y conservan las fábricas anteriores', () => {
  for (const m of ['dijkstra', 'kruskal']) {
    const lista = c.catalogoEjemplosGrafo(m);
    if (m === 'kruskal') cierto(['obligatorio', 'ceros', 'desconectado'].every(id => lista.some(e => e.id === id)));
    igual(new Set(lista.map(e => e.id)).size, lista.length);
    for (const e of lista) cierto(e.nombre && e.descripcion && c.validarGrafoModulo(c.crearEjemploGrafo(m, e.id), m).ok);
    const anteriores = m === 'dijkstra' ? ['obligatorio', 'ceros', 'desconectado', 'inalcanzable', 'ciclico'] : ['obligatorio', 'ceros', 'desconectado'];
    for (const id of anteriores) cierto(c.validarGrafoModulo(c.crearEjemploGrafo(m, id), m).ok);
  }
});
prueba('Atajo: la suma mínima 6 vence al enlace directo; máximo 9 y campus no dirigido 60', () => {
  const g = c.crearEjemploGrafo('dijkstra', 'atajo');
  igual(c.reconstruirRutaGrafo(c.resolverDijkstraGrafo(g, 'n1'), 'n4'), { nodos: ['n1', 'n2', 'n3', 'n4'], conexiones: ['c1', 'c2', 'c3'], distancia: 6 });
  igual(c.reconstruirRutaGrafo(c.resolverCaminoMaximoDAG(g, 'n1'), 'n4').distancia, 9);
  const campus = c.crearEjemploGrafo('dijkstra', 'campus');
  cierto(!campus.dirigido);
  igual(c.reconstruirRutaGrafo(c.resolverDijkstraGrafo(campus, 'n1'), 'n4').nodos, ['n1', 'n2', 'n3', 'n4']);
  igual(c.resolverDijkstraGrafo(campus, 'n1').distancias.n4, 60);
  igual(c.resolverDijkstraGrafo(campus, 'n4').distancias.n1, 60);
  lanza(() => c.resolverCaminoMaximoDAG(campus, 'n1'));
});
prueba('Cableado 9/22 y varias redes óptimas 3/6 conservan decisiones y V−C', () => {
  for (const [id, min, max] of [['cableado', 9, 22], ['optimos', 3, 6]]) {
    const g = c.crearEjemploGrafo('kruskal', id);
    for (const objetivo of ['min', 'max']) {
      const r = c.resolverKruskalGrafo(g, objetivo);
      igual(r.total, objetivo === 'min' ? min : max); igual(r.elegidas.length, g.nodos.length - r.componentes.length);
      igual(r.pasos.length, g.conexiones.length); cierto(r.pasos.some(p => !p.aceptada));
    }
  }
  const g = c.crearEjemploGrafo('kruskal', 'cableado');
  igual(c.resolverKruskalGrafo(g).elegidas, ['c1', 'c3', 'c5']);
  igual(c.resolverKruskalGrafo(g, 'max').elegidas, ['c6', 'c4', 'c2']);
});
prueba('BST equilibrado, cadena y reconstrucciones generales coinciden con los recorridos de referencia', () => {
  const lista = c.catalogoEjemplosArbol(), buscar = id => lista.find(e => e.id === id);
  const r = c.recorridosArbol(c.crearArbolBusqueda(buscar('equilibrado').valores));
  igual(r, { preorden: [40,20,10,30,60,50,70], inorden: [10,20,30,40,50,60,70], postorden: [10,30,20,50,70,60,40] });
  igual(c.recorridosArbol(c.crearArbolBusqueda(buscar('cadena').valores)).postorden, [50,40,30,20,10]);
  const a = c.validarYReconstruirArbol(buscar('general-pre').recorridos, 'pre_in');
  const b = c.validarYReconstruirArbol(buscar('general-post').recorridos, 'in_post');
  cierto(a.ok && b.ok); igual(a.raiz, b.raiz); igual(a.raiz.valor, 6);
  igual(c.recorridosArbol(a.raiz), { preorden: [6,2,8,1,4], inorden: [8,2,6,4,1], postorden: [8,2,4,1,6] });
});
prueba('Referencias difusas vigentes: 55,95238 con ocho reglas y ocupación 0/20 con r13/r15', () => {
  const m = c.DifusaModelo.crearEjemplo('ventilacion3'), evaluar = valores => c.DifusaMotor.evaluarSistema(m, valores);
  const r = evaluar({ temperatura: 24, humedad: 65, ocupacion: 15 });
  cierto(Math.abs(r.centroide.valor - 55.95238095238095) < 1e-10); igual(r.reglas.filter(x => x.activacion > 0).length, 8);
  igual(r.pertenencias.ocupacion.media, .5); igual(r.pertenencias.ocupacion.alta, .5);
  for (const [ocupacion, id, esperado] of [[0, 'r13', 50/3], [20, 'r15', 250/3]]) {
    const x = evaluar({ temperatura: 20, humedad: 50, ocupacion });
    igual(x.reglas.filter(x => x.activacion > 0).map(x => x.id), [id]); cierto(Math.abs(x.centroide.valor - esperado) < 1e-10);
  }
});
if (!informe('Ejemplos de los cuatro módulos')) process.exitCode = 1;
