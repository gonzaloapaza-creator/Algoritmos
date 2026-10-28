'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const ctx = cargar(crearContexto(), ['js/config.js', 'js/grafos/modelo.js', 'js/grafos/algoritmos.js']);
const {
  crearGrafoVacio, copiarGrafoModulo, validarGrafoModulo, validarDocumentoGrafo,
  crearEjemploGrafo, generarGrafoAleatorio, resolverDijkstraGrafo,
  reconstruirRutaGrafo, resolverKruskalGrafo
} = ctx;
const maxPeso = evaluar(ctx, 'MAX_PESO');
const maxNodos = evaluar(ctx, 'GRAFOS_MAX_NODOS');
const maxAristas = evaluar(ctx, 'GRAFOS_MAX_ARISTAS');
const copia = datos => JSON.parse(JSON.stringify(datos));
const documento = (modulo = 'dijkstra') => ({ version: 1, modulo, grafo: crearEjemploGrafo(modulo) });

/** Referencia independiente: Floyd-Warshall sobre una matriz de distancias. */
function floyd(grafo) {
  const indice = new Map(grafo.nodos.map((n, i) => [n.id, i]));
  const d = grafo.nodos.map((_, i) => grafo.nodos.map((__, j) => i === j ? 0 : Infinity));
  grafo.conexiones.forEach(c => {
    const a = indice.get(c.desde), b = indice.get(c.hacia);
    d[a][b] = c.valor;
    if (!grafo.dirigido) d[b][a] = c.valor;
  });
  for (let k = 0; k < d.length; k++) for (let i = 0; i < d.length; i++) for (let j = 0; j < d.length; j++) {
    d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
  }
  return d;
}

/** Componentes por búsqueda, sin reutilizar Union-Find ni ordenación de Kruskal. */
function componentesReferencia(grafo, aristas = grafo.conexiones) {
  const pendientes = new Set(grafo.nodos.map(n => n.id));
  const componentes = [];
  while (pendientes.size) {
    const semilla = pendientes.values().next().value;
    const grupo = [];
    const pila = [semilla];
    pendientes.delete(semilla);
    while (pila.length) {
      const actual = pila.pop();
      grupo.push(actual);
      aristas.forEach(c => {
        const vecino = c.desde === actual ? c.hacia : c.hacia === actual ? c.desde : null;
        if (vecino !== null && pendientes.has(vecino)) { pendientes.delete(vecino); pila.push(vecino); }
      });
    }
    componentes.push(grupo.sort());
  }
  return componentes.sort((a, b) => a[0].localeCompare(b[0]));
}

/** Enumera todos los subconjuntos; solo se usa con grafos de hasta 8 aristas. */
function extremosExhaustivos(grafo) {
  const componentes = componentesReferencia(grafo);
  const cantidad = grafo.nodos.length - componentes.length;
  let minimo = Infinity, maximo = -Infinity;
  for (let mascara = 0; mascara < 2 ** grafo.conexiones.length; mascara++) {
    const elegidas = grafo.conexiones.filter((_, i) => (mascara & (1 << i)) !== 0);
    if (elegidas.length !== cantidad || JSON.stringify(componentesReferencia(grafo, elegidas)) !== JSON.stringify(componentes)) continue;
    const total = elegidas.reduce((suma, c) => suma + c.valor, 0);
    minimo = Math.min(minimo, total);
    maximo = Math.max(maximo, total);
  }
  return { minimo, maximo };
}

prueba('Dijkstra: caso obligatorio dirigido, todas las distancias y ruta de peso original', () => {
  const grafo = crearEjemploGrafo('dijkstra');
  const resultado = resolverDijkstraGrafo(grafo, 'n1');
  igual(grafo.nodos.map(n => resultado.distancias[n.id]), [0, 3, 1, 4, Infinity]);
  const ruta = reconstruirRutaGrafo(resultado, 'n4');
  igual(ruta.nodos, ['n1', 'n3', 'n2', 'n4']);
  igual(ruta.conexiones, ['c2', 'c3', 'c4']);
  igual(ruta.distancia, 4);
  cierto(resultado.distancias.n5 === Infinity);
  cierto(reconstruirRutaGrafo(resultado, 'n5') === null);
  igual(reconstruirRutaGrafo(resultado, 'n1'), { nodos: ['n1'], conexiones: [], distancia: 0 });
  igual(resultado.arbol, ['c2', 'c3', 'c4']);
});

prueba('Dijkstra: pesos cero y desempates por orden de nodos, sin reemplazar una igualdad', () => {
  const grafo = crearEjemploGrafo('dijkstra', 'ceros');
  // Evaluar primero A→C no altera el desempate posterior entre B y C.
  [grafo.conexiones[0], grafo.conexiones[1]] = [grafo.conexiones[1], grafo.conexiones[0]];
  const resultado = resolverDijkstraGrafo(grafo, 'n1');
  igual(resultado.distancias.n4, 2);
  igual(resultado.predecesores.n4.nodo, 'n2');
  igual(resultado.pasos.filter(p => p.tipo === 'seleccion').map(p => p.actual), ['n1', 'n2', 'n3', 'n4']);
  cierto(resultado.pasos.some(p => p.tipo === 'relajacion' && p.anterior === p.candidata && !p.mejora));
});

prueba('Dijkstra: grafo no dirigido recorre aristas inversas con sus pesos originales', () => {
  const grafo = crearEjemploGrafo('dijkstra');
  grafo.dirigido = false;
  const resultado = resolverDijkstraGrafo(grafo, 'n4');
  const ruta = reconstruirRutaGrafo(resultado, 'n1');
  igual(ruta.nodos, ['n4', 'n2', 'n3', 'n1']);
  igual(ruta.distancia, 4);
  igual(ruta.conexiones, ['c4', 'c3', 'c2']);
});

prueba('Dijkstra: pasos conservan estados reales, finalizados y pendientes lineales', () => {
  const resultado = resolverDijkstraGrafo(crearEjemploGrafo('dijkstra'), 'n1');
  const pasos = resultado.pasos;
  igual(pasos[0].tipo, 'inicio');
  igual(pasos[0].distancias.n1, 0);
  cierto(pasos[0].distancias.n2 === Infinity);
  igual(pasos[0].predecesores.n2, null);
  igual(pasos[pasos.length - 1].tipo, 'final');
  igual(pasos[pasos.length - 1].pendientes, ['n5']);
  for (let i = 1; i < pasos.length; i++) {
    const paso = pasos[i];
    cierto(paso.finalizados.length >= pasos[i - 1].finalizados.length);
    igual(paso.pendientes.length + paso.finalizados.length, 5);
    if (paso.tipo === 'relajacion') {
      igual(paso.anterior, pasos[i - 1].distancias[paso.hacia]);
      igual(paso.mejora, paso.candidata < paso.anterior);
      igual(paso.distancias[paso.hacia], paso.mejora ? paso.candidata : paso.anterior);
    }
  }
  cierto(pasos[0].predecesores !== pasos[1].predecesores);
});

prueba('Dijkstra: 32 grafos con semilla y todos sus orígenes frente a Floyd-Warshall', () => {
  for (let semilla = 1; semilla <= 32; semilla++) {
    const cantidad = 2 + semilla % 5;
    const dirigido = semilla % 2 === 0;
    const aristas = Math.min(8, cantidad * (cantidad - 1) / (dirigido ? 1 : 2));
    const grafo = generarGrafoAleatorio('dijkstra', { cantidad, aristas, dirigido, semilla });
    const referencia = floyd(grafo);
    grafo.nodos.forEach((origen, i) => {
      const resultado = resolverDijkstraGrafo(grafo, origen.id);
      grafo.nodos.forEach((destino, j) => {
        cierto(resultado.distancias[destino.id] === referencia[i][j], `Semilla ${semilla}, ${i}→${j}`);
        const ruta = reconstruirRutaGrafo(resultado, destino.id);
        if (referencia[i][j] === Infinity) cierto(ruta === null);
        else {
          igual(ruta.distancia, referencia[i][j]);
          igual(ruta.conexiones.reduce((s, id) => s + grafo.conexiones.find(c => c.id === id).valor, 0), referencia[i][j]);
          igual(new Set(ruta.nodos).size, ruta.nodos.length);
        }
      });
    });
  }
});

prueba('Kruskal: caso obligatorio mínimo 6 y máximo matemático 12', () => {
  const grafo = crearEjemploGrafo('kruskal');
  const minimo = resolverKruskalGrafo(grafo, 'min');
  igual(minimo.elegidas, ['c1', 'c3', 'c5']);
  igual(minimo.total, 6);
  const maximo = resolverKruskalGrafo(grafo, 'max');
  igual(maximo.elegidas, ['c4', 'c2', 'c5']);
  igual(maximo.total, 12);
  // BD + AC + AB suma 10, pero CD de peso 3 mejora AB de peso 1 sin ciclo.
  igual(extremosExhaustivos(grafo), { minimo: 6, maximo: 12 });
});

prueba('Kruskal: negativos, ceros y desempates estables en ambos objetivos', () => {
  const grafo = crearEjemploGrafo('kruskal', 'ceros');
  const minimo = resolverKruskalGrafo(grafo, 'min');
  const maximo = resolverKruskalGrafo(grafo, 'max');
  igual(minimo.ordenadas, ['c1', 'c2', 'c3', 'c4', 'c5']);
  igual(maximo.ordenadas, ['c4', 'c5', 'c2', 'c3', 'c1']);
  igual(minimo.total, -1);
  igual(maximo.total, 4);
});

prueba('Kruskal: desconectado entrega bosque, componentes, aislado y V−C aristas', () => {
  const grafo = crearEjemploGrafo('kruskal', 'desconectado');
  for (const objetivo of ['min', 'max']) {
    const resultado = resolverKruskalGrafo(grafo, objetivo);
    igual(resultado.componentes, [['n1', 'n2', 'n3'], ['n4', 'n5'], ['n6']]);
    igual(resultado.elegidas.length, grafo.nodos.length - resultado.componentes.length);
    const aristas = grafo.conexiones.filter(c => resultado.elegidas.includes(c.id));
    igual(componentesReferencia(grafo, aristas), componentesReferencia(grafo));
  }
});

prueba('Kruskal: registra una decisión real por arista y descarta ciclos sin cambiar el acumulado', () => {
  const grafo = crearEjemploGrafo('kruskal');
  const resultado = resolverKruskalGrafo(grafo);
  igual(resultado.pasos.map(p => p.arista), resultado.ordenadas);
  let cantidad = grafo.nodos.length, peso = 0;
  resultado.pasos.forEach(paso => {
    igual(paso.componentesAntes.length, cantidad);
    if (paso.aceptada) { cantidad--; peso += grafo.conexiones.find(c => c.id === paso.arista).valor; }
    igual(paso.componentesDespues.length, cantidad);
    igual(paso.total, peso);
    igual(paso.elegidas.length, grafo.nodos.length - cantidad);
  });
  cierto(resultado.pasos.some(p => !p.aceptada));
});

prueba('Kruskal: 28 grafos con semilla frente a enumeración exhaustiva de bosques', () => {
  for (let semilla = 1; semilla <= 28; semilla++) {
    const cantidad = 2 + semilla % 5;
    const aristas = Math.min(8, cantidad * (cantidad - 1) / 2);
    const grafo = generarGrafoAleatorio('kruskal', { cantidad, aristas, semilla });
    const referencia = extremosExhaustivos(grafo);
    for (const objetivo of ['min', 'max']) {
      const resultado = resolverKruskalGrafo(grafo, objetivo);
      igual(resultado.total, objetivo === 'min' ? referencia.minimo : referencia.maximo, `Semilla ${semilla}, ${objetivo}`);
      const elegidas = grafo.conexiones.filter(c => resultado.elegidas.includes(c.id));
      igual(componentesReferencia(grafo, elegidas), componentesReferencia(grafo));
      igual(resultado.elegidas.length, cantidad - componentesReferencia(grafo).length);
    }
  }
});

prueba('Grafos: vacío válido para editar, pero ambos cálculos lo rechazan', () => {
  for (const modulo of ['dijkstra', 'kruskal']) cierto(validarGrafoModulo(crearGrafoVacio(modulo === 'dijkstra'), modulo).ok);
  lanza(() => resolverDijkstraGrafo(crearGrafoVacio(), 'n1'));
  lanza(() => resolverKruskalGrafo(crearGrafoVacio(false)));
});

prueba('Grafos: único vértice y múltiples vértices sin aristas', () => {
  const grafo = generarGrafoAleatorio('kruskal', { cantidad: 1, aristas: 0, semilla: 2 });
  const resultado = resolverKruskalGrafo(grafo);
  igual(resultado.elegidas, []);
  igual(resultado.componentes, [['n1']]);
  igual(resultado.total, 0);
  igual(resultado.pasos, []);
  const dijkstra = resolverDijkstraGrafo(grafo, 'n1');
  igual(reconstruirRutaGrafo(dijkstra, 'n1').distancia, 0);
  const aislados = generarGrafoAleatorio('kruskal', { cantidad: 5, aristas: 0, semilla: 2 });
  igual(resolverKruskalGrafo(aislados).componentes.length, 5);
  const distancias = resolverDijkstraGrafo(aislados, 'n2').distancias;
  cierto(distancias.n1 === Infinity && distancias.n2 === 0);
});

prueba('Validación de grafo: rechaza pesos, bucles, IDs, coordenadas, referencias y datos mal formados', () => {
  const invalidos = [
    g => { g.dirigido = 1; },
    g => { g.nodos = {}; },
    g => { g.conexiones = null; },
    g => { g.nodos[0].id = ''; },
    g => { g.nodos[1].id = g.nodos[0].id; },
    g => { g.conexiones[0].id = g.nodos[0].id; },
    g => { g.conexiones[1].id = g.conexiones[0].id; },
    g => { g.nodos[0].nombre = 2; },
    g => { g.nodos[0].nombre = ' '; },
    g => { g.nodos[0].nombre = 'a'.repeat(13); },
    g => { g.nodos[0].x = 29; },
    g => { g.nodos[0].y = 571; },
    g => { g.nodos[0].x = Infinity; },
    g => { g.conexiones[0].hacia = 'ausente'; },
    g => { g.conexiones[0].hacia = g.conexiones[0].desde; },
    g => { g.conexiones[0].valor = -1; },
    g => { g.conexiones[0].valor = 0.5; },
    g => { g.conexiones[0].valor = '3'; },
    g => { g.conexiones[0].valor = Infinity; },
    g => { g.conexiones[0].valor = NaN; },
    g => { g.conexiones[0].valor = maxPeso + 1; },
    g => { g.siguienteId = 0; },
    g => { g.siguienteId = 1.5; },
    g => { g.siguienteId = Number.MAX_SAFE_INTEGER; }
  ];
  invalidos.forEach((modificar, i) => {
    const grafo = crearEjemploGrafo('dijkstra');
    modificar(grafo);
    const antes = JSON.stringify(grafo);
    const resultado = validarGrafoModulo(grafo, 'dijkstra');
    cierto(!resultado.ok && typeof resultado.error === 'string', `Mutación inválida ${i}`);
    igual(JSON.stringify(grafo), antes);
  });
  cierto(!validarGrafoModulo(null, 'dijkstra').ok);
  cierto(!validarGrafoModulo({}, 'otro').ok);
  cierto(!validarGrafoModulo(crearEjemploGrafo('dijkstra'), 'kruskal').ok);
});

prueba('Validación de grafo: duplicados dirigidos y parejas invertidas no dirigidas', () => {
  const grafo = crearEjemploGrafo('dijkstra');
  grafo.conexiones.push({ id: 'extra', desde: 'n2', hacia: 'n1', valor: 2 });
  cierto(validarGrafoModulo(grafo, 'dijkstra').ok);
  grafo.dirigido = false;
  cierto(!validarGrafoModulo(grafo, 'dijkstra').ok);
  grafo.dirigido = true;
  grafo.conexiones[grafo.conexiones.length - 1].desde = 'n1';
  grafo.conexiones[grafo.conexiones.length - 1].hacia = 'n2';
  cierto(!validarGrafoModulo(grafo, 'dijkstra').ok);
});

prueba('Validación de documento: defaults solo para opciones faltantes y copias independientes', () => {
  const datos = documento();
  const resultado = validarDocumentoGrafo(datos, 'dijkstra');
  cierto(resultado.ok);
  igual(resultado.datos.origen, null);
  igual(resultado.datos.destino, null);
  igual(resultado.datos.objetivo, 'min');
  igual(resultado.datos.vista, 'grafo');
  igual(resultado.datos.paso, 0);
  igual(resultado.datos.resuelto, false);
  resultado.datos.grafo.nodos[0].nombre = 'Cambió';
  igual(datos.grafo.nodos[0].nombre, 'A');
  const actual = copiarGrafoModulo(datos.grafo);
  actual.nodos[0].nombre = 'Otro';
  igual(datos.grafo.nodos[0].nombre, 'A');
});

prueba('Validación de documento: versiones, módulo y opciones inválidas no alteran el original', () => {
  const invalidos = [
    d => { delete d.version; }, d => { d.version = 2; }, d => { d.version = '1'; },
    d => { d.modulo = 'kruskal'; }, d => { delete d.modulo; },
    d => { d.origen = 'ausente'; }, d => { d.destino = 'ausente'; },
    d => { d.origen = 1; }, d => { d.objetivo = null; }, d => { d.vista = 'otra'; },
    d => { d.paso = -1; }, d => { d.paso = 0.1; }, d => { d.paso = Number.MAX_SAFE_INTEGER + 1; },
    d => { d.resuelto = 1; }, d => { d.resuelto = true; },
    d => { d.grafo.conexiones[0].valor = -1; }
  ];
  invalidos.forEach(modificar => {
    const datos = documento(); modificar(datos);
    const antes = JSON.stringify(datos);
    const resultado = validarDocumentoGrafo(datos, 'dijkstra');
    cierto(!resultado.ok && typeof resultado.error === 'string');
    igual(JSON.stringify(datos), antes);
  });
  const resuelto = Object.assign(documento(), { origen: 'n1', destino: 'n4', resuelto: true, vista: 'resultado', paso: 3 });
  cierto(validarDocumentoGrafo(resuelto, 'dijkstra').ok);
});

prueba('Cálculos: entradas intactas, rechazos tempranos y reconstrucción desde copia original', () => {
  const grafo = crearEjemploGrafo('dijkstra');
  const antes = JSON.stringify(grafo);
  const resultado = resolverDijkstraGrafo(grafo, 'n1');
  igual(JSON.stringify(grafo), antes);
  grafo.conexiones[1].valor = 99;
  igual(reconstruirRutaGrafo(resultado, 'n4').distancia, 4);
  lanza(() => resolverDijkstraGrafo(grafo, 'otro'));
  grafo.conexiones[0].valor = -2;
  lanza(() => resolverDijkstraGrafo(grafo, 'n1'));
  const kruskal = crearEjemploGrafo('kruskal');
  const original = JSON.stringify(kruskal);
  resolverKruskalGrafo(kruskal, 'max');
  igual(JSON.stringify(kruskal), original);
  lanza(() => resolverKruskalGrafo(kruskal, 'otro'));
  cierto(reconstruirRutaGrafo(resultado, 'ausente') === null);
});

prueba('IDs estables arbitrarios, incluidos nombres de propiedades de Object', () => {
  const grafo = crearEjemploGrafo('dijkstra');
  grafo.nodos[0].id = '__proto__';
  grafo.nodos[1].id = 'constructor';
  grafo.conexiones.forEach(c => {
    if (c.desde === 'n1') c.desde = '__proto__';
    if (c.hacia === 'n1') c.hacia = '__proto__';
    if (c.desde === 'n2') c.desde = 'constructor';
    if (c.hacia === 'n2') c.hacia = 'constructor';
  });
  cierto(validarGrafoModulo(grafo, 'dijkstra').ok);
  const resultado = resolverDijkstraGrafo(grafo, '__proto__');
  igual(resultado.distancias.constructor, 3);
  igual(reconstruirRutaGrafo(resultado, 'n4').nodos, ['__proto__', 'n3', 'constructor', 'n4']);
});

prueba('Ejemplos y generación: acotados, repetibles y sin dependencia del estado global', () => {
  for (const modulo of ['dijkstra', 'kruskal']) {
    for (const nombre of ['obligatorio', 'ceros', 'desconectado']) cierto(validarGrafoModulo(crearEjemploGrafo(modulo, nombre), modulo).ok);
    const opciones = { cantidad: maxNodos, aristas: maxAristas, semilla: 1703 };
    const primero = generarGrafoAleatorio(modulo, opciones);
    igual(primero, generarGrafoAleatorio(modulo, opciones));
    cierto(validarGrafoModulo(primero, modulo).ok);
    igual(new Set(primero.nodos.map(n => n.id).concat(primero.conexiones.map(c => c.id))).size, maxNodos + maxAristas);
    lanza(() => generarGrafoAleatorio(modulo, { cantidad: maxNodos + 1 }));
    lanza(() => generarGrafoAleatorio(modulo, { cantidad: 2, aristas: maxAristas }));
  }
  lanza(() => crearEjemploGrafo('otro'));
  lanza(() => crearEjemploGrafo('dijkstra', 'otro'));
});

prueba('Máximo 24/96: pasos acotados, todas las distancias y bosque V−C', () => {
  const dijkstra = generarGrafoAleatorio('dijkstra', { cantidad: maxNodos, aristas: maxAristas, semilla: 1703 });
  const resultado = resolverDijkstraGrafo(dijkstra, 'n1');
  const referencia = floyd(dijkstra);
  cierto(resultado.pasos.length <= 2 + maxNodos + maxAristas);
  dijkstra.nodos.forEach((n, i) => cierto(resultado.distancias[n.id] === referencia[0][i]));
  const kruskal = generarGrafoAleatorio('kruskal', { cantidad: maxNodos, aristas: maxAristas, semilla: 1703 });
  for (const objetivo of ['min', 'max']) {
    const r = resolverKruskalGrafo(kruskal, objetivo);
    igual(r.pasos.length, maxAristas);
    igual(r.elegidas.length, maxNodos - r.componentes.length);
  }
  const exceso = copia(kruskal);
  exceso.nodos.push({ id: 'extra', nombre: 'Más', x: 500, y: 300 });
  cierto(!validarGrafoModulo(exceso, 'kruskal').ok);
  const muchas = copia(kruskal);
  muchas.conexiones.push(Object.assign({}, muchas.conexiones[0], { id: 'extra' }));
  cierto(!validarGrafoModulo(muchas, 'kruskal').ok);
});

if (!informe('Grafos · Dijkstra, Kruskal y validación compartida')) process.exitCode = 1;

// Medición breve y reproducible; el tamaño JSON no pretende medir el heap de JS.
if (process.argv.includes('--medir')) {
  console.log(`\nMedición: ${process.version}, ${process.platform}/${process.arch}; semilla 1703; 24 nodos, 96 aristas; 10 ejecuciones tras calentamiento.`);
  for (const modulo of ['dijkstra', 'kruskal']) {
    const grafo = generarGrafoAleatorio(modulo, { cantidad: maxNodos, aristas: maxAristas, semilla: 1703 });
    const calcular = () => modulo === 'dijkstra' ? resolverDijkstraGrafo(grafo, 'n1') : resolverKruskalGrafo(grafo, 'min');
    calcular();
    const tiempos = [];
    let resultado;
    for (let repeticion = 0; repeticion < 10; repeticion++) {
      const inicio = process.hrtime.bigint();
      resultado = calcular();
      tiempos.push(Number(process.hrtime.bigint() - inicio) / 1e6);
    }
    tiempos.sort((a, b) => a - b);
    const bytes = Buffer.byteLength(JSON.stringify(resultado.pasos));
    console.log(`${modulo}: mediana ${((tiempos[4] + tiempos[5]) / 2).toFixed(3)} ms; máximo ${tiempos[9].toFixed(3)} ms; ${resultado.pasos.length} pasos; historial JSON ${bytes} bytes (serialización, no heap).`);
  }
}
