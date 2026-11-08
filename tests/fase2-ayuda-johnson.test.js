'use strict';
const { crearContexto, cargar, prueba, igual, cierto, informe } = require('./cargar');
const ctx = crearContexto(); ctx.window = ctx;
ctx.document = { body: { dataset: { modulo: 'johnson' } }, getElementById: () => null };
cargar(ctx, ['js/config.js', 'js/johnson.js', 'js/johnson/caminos.js']);
ctx.estado = {
  nodos: ['A', 'E', 'D', 'B'].map((id, i) => ({ id, nombre: id, x: 100 + i * 200, y: 200 })),
  conexiones: [['A', 'B', 58], ['A', 'E', 6], ['E', 'D', 5], ['D', 'B', 8]].map(([desde, hacia, valor], i) => ({ id: 'e' + i, desde, hacia, valor })),
  seleccion: null
};
const r = ctx.calcularJohnsonDesde(ctx.prepararDatosJohnson(ctx.estado.nodos, ctx.estado.conexiones));
ctx.estadoJohnson = { vista: 'resultado', resultado: r, pasoActual: 0, seleccion: { origen: 0, destino: 3 }, firma: 'vigente' };
ctx.resultadoVigenteJohnson = () => true;
cargar(ctx, ['js/comun/asistente-contexto.js', 'js/comun/conocimiento/base.js',
  'js/comun/conocimiento/fundamentos.js', 'js/comun/conocimiento/algoritmos-grafos.js',
  'js/comun/conocimiento/algoritmos-tablas.js', 'js/comun/conocimiento/algoritmos-datos.js',
  'js/comun/conocimiento/aplicacion.js', 'js/comun/conocimiento/diagnostico.js',
  'js/comun/conocimiento/ejercicio.js', 'js/comun/asistente-motor.js']);

function visualRuta(objetivo) {
  const maximos = ctx.calcularMaximosDAGJohnson(ctx.estado.nodos, ctx.estado.conexiones, 'A');
  const seleccionada = objetivo === 'maximo' ? ctx.reconstruirMaximoDAGJohnson('B', maximos) : ctx.reconstruirRutaJohnson(0, 3, r);
  const acumulado = seleccionada.conexiones.reduce((suma, id) => suma + ctx.estado.conexiones.find(c => c.id === id).valor, 0);
  return { tipo: 'ruta', firma: 'vigente', origen: 'A', destino: 'B', objetivo,
    rutaSeleccionada: Object.assign({ id: objetivo }, seleccionada),
    valoresNodos: { B: { minimo: 19, maximo: 58 } },
    casillas: { B: { rotulos: ['Acum.', 'Total'], valores: [acumulado, seleccionada.distancia] } } };
}

prueba('Algo explica Acum./Total de la ruta mínima19 o máxima58 sin sustituir los mínimos Johnson', () => {
  for (const objetivo of ['minimo', 'maximo']) {
    const costo = objetivo === 'minimo' ? 19 : 58;
    ctx.estado.visualizacionJohnson = visualRuta(objetivo);
    const foto = ctx.AlgoContexto.obtener(), resultado = foto.contexto.resultado;
    igual(resultado.seleccion.distancia, 19); igual(resultado.seleccion.ruta.distancia, costo);
    igual(resultado.consulta.destino, { rotulos: ['Acum.', 'Total'], valores: [costo, costo] });
    const texto = ctx.AlgoContexto.interno.explicarResultado('johnson', foto.contexto);
    cierto(texto.includes('Mínimo Johnson: 19') && texto.includes('Máximo DAG: 58'));
    cierto(texto.includes('El destino muestra Acum. ' + costo + ' | Total ' + costo));
    cierto(texto.includes('Costo de esta ruta: ' + costo));
    cierto(ctx.AlgoMotor.responder('¿Cuál es el costo total?', foto).texto.includes('El destino muestra Acum. ' + costo + ' | Total ' + costo));
  }
});

prueba('Comparar sin ruta activa explica mín19/máx58 y activar/desactivar elimina las casillas anteriores', () => {
  const comparacion = { tipo: 'comparacion', firma: 'vigente', origen: 'A', destino: 'B', objetivo: 'comparar',
    rutaSeleccionada: null, valoresNodos: { B: { minimo: 19, maximo: 58 } }, casillas: {} };
  for (const activa of [false, true, false]) {
    ctx.estado.visualizacionJohnson = activa ? Object.assign(visualRuta('maximo'), { tipo: 'comparacion', objetivo: 'comparar' }) : comparacion;
    const foto = ctx.AlgoContexto.obtener();
    igual(foto.contexto.resultado.consulta.destino, activa
      ? { rotulos: ['Acum.', 'Total'], valores: [58, 58] }
      : { rotulos: ['mín', 'máx'], valores: [19, 58] });
    const texto = ctx.AlgoContexto.interno.explicarResultado('johnson', foto.contexto);
    cierto(texto.includes(activa ? 'El destino muestra Acum. 58 | Total 58' : 'El destino muestra mín 19 | máx 58'));
    if (!activa) {
      igual(foto.contexto.resultado.seleccion.ruta, null);
      cierto(!texto.includes('Acum.') && !texto.includes('Costo de esta ruta:'));
      cierto(ctx.AlgoMotor.responder('¿Cuál es el costo total?', foto).texto.includes('El destino muestra mín 19 | máx 58'));
    }
  }
});

prueba('Un error de correspondencia se explica sin presentar como válida la ruta copiada', () => {
  ctx.estado.visualizacionJohnson = visualRuta('maximo');
  ctx.estado.visualizacionJohnson.errorRuta = 'El acumulado 57 no coincide con el costo esperado 58.';
  ctx.estado.visualizacionJohnson.casillas.B.valores = [null, null];
  const foto = ctx.AlgoContexto.obtener();
  igual(foto.contexto.resultado.consulta.error, ctx.estado.visualizacionJohnson.errorRuta);
  for (const texto of [ctx.AlgoContexto.interno.explicarResultado('johnson', foto.contexto), ctx.AlgoMotor.responder('¿Cuál es el costo total?', foto).texto]) {
    cierto(texto.includes('Error de correspondencia') && texto.includes('El acumulado 57 no coincide con el costo esperado 58.'));
    cierto(texto.includes('La ruta no puede presentarse como válida'));
    cierto(!texto.includes('Ruta seleccionada') && !texto.includes('Costo de esta ruta:') && !texto.includes('El destino muestra'));
  }
});

prueba('Sin casillas copiadas la explicación no inventa el destino con el costo de otra vista', () => {
  ctx.estado.visualizacionJohnson = visualRuta('maximo');
  const contexto = ctx.AlgoContexto.obtener().contexto;
  delete contexto.resultado.consulta.destino;
  const texto = ctx.AlgoContexto.interno.explicarResultado('johnson', contexto);
  cierto(texto.includes('No se copiaron las casillas del destino'));
  cierto(!texto.includes('El destino muestra'));
});

prueba('Algo explica temporal T58|58 y su procedimiento sin reutilizar el costo mínimo19', () => {
  const temporal = ctx.calcularTiemposHolgurasJohnson(ctx.estado.nodos, ctx.estado.conexiones, 'A', 'B');
  ctx.estado.visualizacionJohnson = { tipo: 'temporal', firma: 'vigente', origen: 'A', destino: 'B', vistaTemporal: true, temporal, valoresNodos: { B: { minimo: 58, maximo: 58 } } };
  const foto = ctx.AlgoContexto.obtener(), t = foto.contexto.resultado.temporal;
  igual(t.duracion, 58); igual(t.nodos[3], { id: 'B', temprano: 58, tardio: 58 });
  igual(t.actividades.map(a => a.holgura), [0, 39, 39, 39]);
  igual(foto.contexto.resultado.seleccion.ruta, null);
  igual(foto.contexto.resultado.consulta.destino, { rotulos: ['temprano', 'tardío'], valores: [58, 58] });
  const texto = ctx.AlgoContexto.interno.explicarResultado('johnson', foto.contexto);
  cierto(texto.includes('El destino muestra temprano 58 | tardío 58') && texto.includes('complementario'));
  cierto(texto.includes('tiempo temprano') && texto.includes('tiempo tardío'));
  cierto(!texto.includes('Mínimo Johnson: 58') && !texto.includes('Acum.') && !texto.includes('Costo de esta ruta:'));
  cierto(ctx.AlgoContexto.interno.explicarPaso('johnson', foto.contexto).includes('tardío(destino)=T'));
  const respuesta = ctx.AlgoMotor.responder('¿Cuál es el costo total?', foto);
  cierto(respuesta.texto.includes('T = 58'));
});

prueba('Temporal inválido y máximo no calculable conservan diagnósticos propios', () => {
  ctx.estado.visualizacionJohnson.temporal = { valido: false, mensaje: 'La red contiene un ciclo', idsActivos: [], conexionesActivas: [], criticas: [], holguras: {} };
  let foto = ctx.AlgoContexto.obtener();
  cierto(ctx.AlgoContexto.interno.explicarResultado('johnson', foto.contexto).includes('no disponible: La red contiene un ciclo'));
  ctx.estado.visualizacionJohnson = { tipo: 'consulta', firma: 'vigente', origen: 'A', destino: 'B', valoresNodos: { B: { minimo: 19, maximo: null } } };
  foto = ctx.AlgoContexto.obtener();
  igual(foto.contexto.resultado.consulta.destino, { rotulos: ['mín', 'máx'], valores: [19, null] });
  cierto(ctx.AlgoContexto.interno.explicarResultado('johnson', foto.contexto).includes('no implica infinito'));
});

prueba('Un resaltado de otra firma no aporta valores ni rutas a la consulta vigente', () => {
  ctx.estado.visualizacionJohnson.firma = 'obsoleta';
  const foto = ctx.AlgoContexto.obtener();
  igual(foto.contexto.resultado.consulta, undefined);
  igual(foto.contexto.resultado.seleccion.ruta, null);
});

process.exitCode = informe('FASE 2 · ayuda Johnson (solo datos de este módulo)') ? 0 : 1;
