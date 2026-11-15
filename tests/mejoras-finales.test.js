'use strict';
const { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const ctx = cargar(crearContexto(), ['js/config.js', 'js/grafos/modelo.js', 'js/grafos/algoritmos.js', 'js/difusa/motor.js', 'js/difusa/modelo.js', 'js/difusa/estado.js']);

prueba('Política de pesos común, completa y transaccional en creación, edición y documento', () => {
  for (const modulo of ['dijkstra', 'kruskal']) {
    const grafo = ctx.crearEjemploGrafo(modulo), original = JSON.stringify(grafo);
    for (const valor of [-1, '', ' ', '12abc', '1.2', NaN, Infinity, 1000000]) {
      cierto(!ctx.validarPesoGrafoModulo(valor, modulo).ok);
      cierto(!ctx.operarGrafoModulo(grafo, modulo, { tipo: 'peso', id: 'c1', valor }).ok);
      const documento = { version: 1, modulo, grafo: JSON.parse(original) }; documento.grafo.conexiones[0].valor = valor;
      cierto(!ctx.validarDocumentoGrafo(documento, modulo).ok);
      igual(JSON.stringify(grafo), original);
    }
    cierto(ctx.validarPesoGrafoModulo(0, modulo).ok);
    cierto(ctx.operarGrafoModulo(grafo, modulo, { tipo: 'peso', id: 'c1', valor: 0 }).ok);
    const antiguo = JSON.parse(original); antiguo.conexiones[0].valor = -3;
    const rechazo = ctx.validarDocumentoGrafo({ version: 1, modulo, grafo: antiguo }, modulo);
    cierto(!rechazo.ok && rechazo.error.includes('c1') && rechazo.error.includes('-3'));
    igual(antiguo.conexiones[0].valor, -3);
  }
});
prueba('Nombres nuevos uniformes; duplicados antiguos identificables, móviles y corregibles', () => {
  const g = ctx.crearEjemploGrafo('kruskal'); g.nodos[0].nombre = 'Un lugar';
  cierto(!ctx.operarGrafoModulo(g, 'kruskal', { tipo: 'renombrar', id: 'n2', nombre: ' un  LUGAR ' }).ok);
  g.nodos[1].nombre = 'un LUGAR';
  cierto(ctx.validarGrafoModulo(g, 'kruskal').ok);
  cierto(ctx.etiquetaNodoGrafo(g, 'n1') !== ctx.etiquetaNodoGrafo(g, 'n2'));
  cierto(ctx.operarGrafoModulo(g, 'kruskal', { tipo: 'mover', id: 'n1', x: 100, y: 100 }).ok);
  cierto(ctx.operarGrafoModulo(g, 'kruskal', { tipo: 'renombrar', id: 'n2', nombre: 'Otro' }).ok);
});
prueba('Ejemplos de grafos: ciclos conservados, máximos DAG y A→B=2 con aislado', () => {
  const g = ctx.crearEjemploGrafo('dijkstra', 'inalcanzable');
  const r = ctx.resolverCaminoMaximoDAG(g, 'n1');
  igual([r.distancias.n1, r.distancias.n2, r.distancias.n3], [0, 2, -Infinity]);
  igual(ctx.reconstruirRutaGrafo(r, 'n3'), null);
  const ciclo = ctx.crearEjemploGrafo('dijkstra', 'ciclico'), antes = JSON.stringify(ciclo);
  igual(ctx.resolverDijkstraGrafo(ciclo, 'n1').distancias.n3, 5);
  lanza(() => ctx.resolverCaminoMaximoDAG(ciclo, 'n1'));
  igual(JSON.stringify(ciclo), antes);
  const clase = ctx.crearEjemploGrafo('dijkstra');
  igual(ctx.resolverDijkstraGrafo(clase, 'n1').distancias.n4, 4);
  igual(ctx.resolverCaminoMaximoDAG(clase, 'n1').distancias.n4, 6);
  for (const nombre of ['obligatorio', 'ceros', 'desconectado']) {
    const k = ctx.crearEjemploGrafo('kruskal', nombre);
    cierto(ctx.validarGrafoModulo(k, 'kruskal').ok);
    for (const objetivo of ['min', 'max']) {
      const bosque = ctx.resolverKruskalGrafo(k, objetivo);
      igual(bosque.elegidas.length, k.nodos.length - bosque.componentes.length);
    }
  }
});
prueba('Tres entradas: ocupación participa en 27 reglas y cambia activaciones y centroide analítico', () => {
  const m = ctx.DifusaModelo.crearEjemplo('ventilacion3');
  cierto(ctx.DifusaModelo.validar(m).listo); igual(m.reglas.length, 27);
  igual(m.reglas.filter(r => r.activa && r.peso > 0 && r.antecedentes.ocupacion != null).length, 27);
  const evaluarCaso = ocupacion => ctx.DifusaMotor.evaluarSistema(m, { temperatura: 20, humedad: 50, ocupacion });
  const a = evaluarCaso(0), b = evaluarCaso(20);
  cierto(Math.abs(a.centroide.valor - 50 / 3) < 1e-10);
  cierto(Math.abs(b.centroide.valor - 250 / 3) < 1e-10);
  igual(a.reglas.filter(r => r.activacion > 0).map(r => r.id), ['r13']);
  igual(b.reglas.filter(r => r.activacion > 0).map(r => r.id), ['r15']);
});
prueba('Una entrada nueva no recibe centro ni cero al aplicar o restablecer', () => {
  const m = ctx.DifusaModelo.crearEjemplo('ayuda');
  const v = JSON.parse(JSON.stringify(m.entradas[0])); v.id = 'nueva'; v.nombre = 'Nueva'; m.entradas.push(v);
  m.reglas.forEach(r => { r.antecedentes.nueva = null; });
  cierto(ctx.DifusaEstado.aplicarModelo(m).ok); igual(ctx.DifusaEstado.estado.valores.nueva, null);
  ctx.DifusaEstado.restablecer(); igual(ctx.DifusaEstado.estado.valores.nueva, null);
  lanza(() => ctx.DifusaEstado.evaluar());
});
prueba('Ayuda local de Kruskal y difusa explica la política y el borrador sin usar red', () => {
  for (const modulo of ['kruskal', 'difusa']) {
    const c = crearContexto(); c.window = c; c.RegExp = RegExp;
    c.document = { body: { dataset: { modulo } }, getElementById: () => null };
    c.fetch = () => { throw new Error('La ayuda debe ser local'); };
    const conocimiento = ['base', 'fundamentos', 'algoritmos-grafos', 'algoritmos-tablas', 'algoritmos-datos', 'aplicacion', 'diagnostico', 'ejercicio'].map(n => 'js/comun/conocimiento/' + n + '.js');
    cargar(c, ['js/config.js', 'js/comun/asistente-contexto.js', ...conocimiento, 'js/comun/asistente-motor.js']);
    const respuesta = c.AlgoMotor.responder(modulo === 'kruskal' ? '¿Kruskal acepta pesos negativos y cero?' : '¿Qué significa borrador?', c.AlgoContexto.obtener());
    cierto(modulo === 'kruskal' ? respuesta.texto.includes('rechaza negativos') && respuesta.texto.includes('matemático') : respuesta.texto.includes('Borrador') && respuesta.texto.includes('pendientes'));
  }
});
if (!informe('Mejoras finales: regresiones de grafos y difusa')) process.exitCode = 1;
