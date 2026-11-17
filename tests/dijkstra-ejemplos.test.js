'use strict';

const fs = require('fs'), path = require('path'), vm = require('vm');
const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const fuentes = ['js/config.js', 'js/grafos/modelo.js', 'js/grafos/algoritmos.js'];
const c = cargar(crearContexto(), fuentes);
const idsCatalogo = ['atajo', 'mejoras', 'campus', 'direcciones', 'ceros', 'referencia-clase'];
const grafo = id => c.crearEjemploGrafo('dijkstra', id);

function comprobarDistancias(g, resultado, esperadas) {
  g.nodos.forEach((n, i) => cierto(resultado.distancias[n.id] === esperadas[i],
    n.nombre + ': esperado ' + esperadas[i] + ', obtenido ' + resultado.distancias[n.id]));
}

prueba('El catálogo conserva las cinco lecciones y añade la referencia de clase', () => {
  const catalogo = c.catalogoEjemplosGrafo('dijkstra');
  igual(catalogo.map(e => e.id), idsCatalogo);
  const destinos = { atajo: 'n4', mejoras: 'n5', campus: 'n4', direcciones: 'n3', ceros: 'n4', 'referencia-clase': 'n4' };
  for (const e of catalogo) {
    const g = grafo(e.id);
    cierto(c.validarGrafoModulo(g, 'dijkstra').ok);
    cierto(e.nombre && e.descripcion);
    igual(e.origen, 'n1'); igual(e.destino, destinos[e.id]);
    cierto(g.nodos.some(n => n.id === e.origen) && g.nodos.some(n => n.id === e.destino));
  }
});

prueba('Mejoras revisa B, D y E antes de fijarlos y distingue el mínimo 8 del máximo 18', () => {
  const g = grafo('mejoras'), antes = JSON.stringify(g), r = c.resolverDijkstraGrafo(g, 'n1');
  comprobarDistancias(g, r, [0, 3, 2, 5, 8]);
  igual(r.pasos.filter(p => p.tipo === 'seleccion').map(p => p.actual), ['n1', 'n3', 'n2', 'n4', 'n5']);
  const revisiones = r.pasos.filter(p => p.tipo === 'relajacion' && p.mejora && Number.isFinite(p.anterior));
  igual(revisiones.map(p => [p.hacia, p.anterior, p.candidata]), [['n2', 8, 3], ['n4', 9, 5], ['n5', 13, 8]]);
  cierto(revisiones.every(p => !p.finalizados.includes(p.hacia)), 'Una revisión debe actualizar una distancia aún tentativa');
  igual(c.reconstruirRutaGrafo(r, 'n5'), {
    nodos: ['n1', 'n3', 'n2', 'n4', 'n5'], conexiones: ['c2', 'c3', 'c4', 'c6'], distancia: 8
  });
  // Referencias calculadas aparte: los caminos de A a E pesan 8, 12, 13, 13 y 18.
  const maximo = c.resolverCaminoMaximoDAG(g, 'n1');
  comprobarDistancias(g, maximo, [0, 8, 2, 10, 18]);
  igual(c.reconstruirRutaGrafo(maximo, 'n5'), {
    nodos: ['n1', 'n2', 'n5'], conexiones: ['c1', 'c7'], distancia: 18
  });
  igual(JSON.stringify(g), antes, 'Calcular ambos objetivos debe conservar los datos del ejemplo');
});

prueba('Direcciones diferencia una conexión entrante de un camino desde el origen', () => {
  const g = grafo('direcciones'), desdeA = c.resolverDijkstraGrafo(g, 'n1'), desdeD = c.resolverDijkstraGrafo(g, 'n4');
  comprobarDistancias(g, desdeA, [0, 2, 5, Infinity]);
  comprobarDistancias(g, desdeD, [Infinity, 1, 4, 0]);
  cierto(g.conexiones.some(a => a.desde === 'n4' && a.hacia === 'n2'));
  cierto(c.reconstruirRutaGrafo(desdeA, 'n4') === null);
  igual(c.reconstruirRutaGrafo(desdeD, 'n3').nodos, ['n4', 'n2', 'n3']);
  const maximo = c.resolverCaminoMaximoDAG(g, 'n1');
  comprobarDistancias(g, maximo, [0, 2, 5, -Infinity]);
  cierto(maximo.ordenTopologico.includes('n4'), 'Procesar un nodo en máximo no demuestra que sea alcanzable');
});

prueba('Campus permite regresar con los mismos pesos originales y rechaza máximo sin modificar el grafo', () => {
  const g = grafo('campus'), antes = JSON.stringify(g);
  const ida = c.reconstruirRutaGrafo(c.resolverDijkstraGrafo(g, 'n1'), 'n4');
  const vuelta = c.reconstruirRutaGrafo(c.resolverDijkstraGrafo(g, 'n4'), 'n1');
  igual(ida.nodos, ['n1', 'n2', 'n3', 'n4']); igual(ida.distancia, 60);
  igual(vuelta.nodos, ['n4', 'n3', 'n2', 'n1']); igual(vuelta.distancia, 60);
  igual(vuelta.conexiones, [...ida.conexiones].reverse());
  lanza(() => c.resolverCaminoMaximoDAG(g, 'n1'));
  igual(JSON.stringify(g), antes);
});

prueba('Ceros conserva las dos rutas óptimas y no sustituye el primer predecesor por una igualdad', () => {
  const g = grafo('ceros');
  // Las dos rutas independientes son A→B→D (0+2) y A→C→D (0+2).
  const r = c.resolverDijkstraGrafo(g, 'n1');
  comprobarDistancias(g, r, [0, 0, 0, 2]);
  igual(c.reconstruirRutaGrafo(r, 'n4').nodos, ['n1', 'n2', 'n4']);
  cierto(r.pasos.some(p => p.tipo === 'relajacion' && p.hacia === 'n4' && p.anterior === 2 && p.candidata === 2 && !p.mejora));
  igual(c.resolverCaminoMaximoDAG(g, 'n1').distancias.n4, 2);
  g.nodos = [g.nodos[0], g.nodos[2], g.nodos[1], g.nodos[3]];
  const empatado = c.resolverDijkstraGrafo(g, 'n1');
  igual(empatado.distancias.n4, 2);
  igual(c.reconstruirRutaGrafo(empatado, 'n4').nodos, ['n1', 'n3', 'n4']);
});

prueba('Los ejemplos retirados del selector siguen validando y restaurando trabajos resueltos', () => {
  const estado = crearContexto();
  estado.document = { body: { dataset: { modulo: 'dijkstra' } } };
  cargar(estado, fuentes);
  const controlador = fs.readFileSync(path.join(__dirname, '../js/grafos/app.js'), 'utf8').split('\nconstruirInterfazModuloGrafo();')[0];
  vm.runInContext(controlador, estado, { filename: 'js/grafos/app.js (sin arranque DOM)' });
  evaluar(estado, 'actualizarModuloGrafo = () => {}; actualizarCamposEditorGrafo = () => {}; guardarModuloGrafo = () => {}; detenerReproduccionGrafo = () => {}; notificar = () => {};');
  const referencias = {
    obligatorio: [0, 3, 1, 4, Infinity], desconectado: [0, 2, 2, Infinity, Infinity, Infinity],
    inalcanzable: [0, 2, Infinity], ciclico: [0, 2, 5]
  };
  for (const [id, esperadas] of Object.entries(referencias)) {
    const g = grafo(id);
    const documento = JSON.parse(JSON.stringify({ version: 1, modulo: 'dijkstra', grafo: g,
      origen: 'n1', destino: g.nodos[1].id, objetivo: 'min', vista: 'resultado', paso: 0, resuelto: true,
      resultado: { distancias: { n1: -999 } } }));
    const antes = JSON.stringify(documento), validado = c.validarDocumentoGrafo(documento, 'dijkstra');
    cierto(validado.ok, id + ' debe seguir siendo recuperable');
    estado.aplicarDocumentoModuloGrafo(validado.datos);
    const resultado = evaluar(estado, 'moduloGrafo.resultado');
    comprobarDistancias(g, resultado, esperadas);
    igual(evaluar(estado, 'serializarModuloGrafo().grafo'), g);
    igual(evaluar(estado, 'moduloGrafo.destino'), documento.destino);
    igual(JSON.stringify(documento), antes, 'Restaurar debe conservar el documento de entrada');
  }
  const ciclico = grafo('ciclico'), antes = JSON.stringify(ciclico);
  lanza(() => c.resolverCaminoMaximoDAG(ciclico, 'n1'));
  igual(JSON.stringify(ciclico), antes, 'Bloquear máximo debe conservar el ciclo del trabajo antiguo');
});

if (!informe('Ejemplos guiados de Dijkstra')) process.exitCode = 1;
