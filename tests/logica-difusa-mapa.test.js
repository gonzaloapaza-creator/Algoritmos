'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, informe } = require('./cargar');

function crearMapa() {
  const contexto = crearContexto(), pendientes = new Map();
  let siguiente = 0;
  contexto.setTimeout = fn => { const id = ++siguiente; pendientes.set(id, fn); return id; };
  contexto.clearTimeout = id => pendientes.delete(id);
  cargar(contexto, ['js/difusa/motor.js', 'js/difusa/modelo.js', 'js/difusa/mapa.js']);
  function lote() {
    const primero = pendientes.entries().next();
    if (primero.done) return false;
    pendientes.delete(primero.value[0]); primero.value[1](); return true;
  }
  function terminar() {
    let cuenta = 0;
    while (pendientes.size && cuenta++ < 500) lote();
    cierto(pendientes.size === 0, 'El mapa debe terminar en un número acotado de lotes');
    return cuenta;
  }
  return { mapa: evaluar(contexto, 'DifusaMapa'), lote, terminar, pendientes };
}

function sistema(cantidad, minimo = 0, maximo = 10) {
  const entradas = Array.from({ length: cantidad }, (_, i) => ({
    id: 'x' + (i + 1), nombre: 'Entrada ' + (i + 1), unidad: '', min: minimo, max: maximo,
    conjuntos: [
      { id: 'baja', nombre: 'Baja', tipo: 'trapezoidal', parametros: [minimo, minimo, minimo, maximo] },
      { id: 'alta', nombre: 'Alta', tipo: 'trapezoidal', parametros: [minimo, maximo, maximo, maximo] }
    ]
  }));
  return { version: 2, id: 'uniforme', nombre: 'Salida uniforme independiente', entradas,
    salida: { id: 'salida', nombre: 'Salida', unidad: '%', min: 10, max: 30, conjuntos: [
      { id: 'a', nombre: 'A', tipo: 'trapezoidal', parametros: [10, 10, 30, 30] },
      { id: 'b', nombre: 'B', tipo: 'triangular', parametros: [10, 20, 30] }
    ] },
    reglas: [{ id: 'r1', antecedentes: Object.fromEntries(entradas.map((v, i) => [v.id, i === 0 ? 'baja' : null])),
      conector: 'AND', consecuente: 'a', peso: 1, activa: true }] };
}

function configuracion(modelo, extras) {
  return { modelo, ejeX: 'x1', ejeY: modelo.entradas.length > 1 ? 'x2' : null,
    valores: Object.fromEntries(modelo.entradas.map(v => [v.id, v.min + (v.max - v.min) / 2])), estaVigente: () => true, ...extras };
}
function cerca(real, esperado) { cierto(Number.isFinite(real) && Math.abs(real - esperado) < 1e-8, 'Esperado ' + esperado + ', recibido ' + real); }
async function pruebaAsync(nombre, fn) {
  try { await fn(); prueba(nombre, () => {}); }
  catch (error) { prueba(nombre, () => { throw error; }); }
}
async function rechaza(fn) {
  let error = null;
  try { await fn(); } catch (fallo) { error = fallo; }
  cierto(error && error.message, 'Debe rechazar la configuración inválida con un error claro');
}

(async () => {
  await pruebaAsync('Mapa de una entrada usa lotes, conserva el modelo y coincide con un centroide uniforme independiente', async () => {
    const { mapa, lote, terminar } = crearMapa(), modelo = sistema(1), original = JSON.stringify(modelo), progreso = [];
    const promesa = mapa.generar(configuracion(modelo, { progreso: (hechos, total) => progreso.push([hechos, total]) }));
    cierto(mapa.activo()); igual(progreso.length, 0);
    lote(); igual(progreso[0], [2, 101]);
    const lotesRestantes = terminar(), resultado = await promesa;
    cierto(lotesRestantes > 1 && !mapa.activo()); igual(resultado.estado, 'completo');
    igual(resultado.datos.resolucion, 101); igual(resultado.datos.puntos.length, 101); igual(resultado.datos.ejeY, null);
    igual(resultado.datos.sinSalida, 1); igual(progreso[progreso.length - 1], [101, 101]);
    resultado.datos.puntos.forEach((p, i) => {
      cerca(p.x, i / 10);
      if (i === 100) igual(p.resultado, null);
      else cerca(p.resultado, 20); // Toda salida agregada positiva es un rectángulo uniforme entre 10 y 30.
      cierto(!Object.prototype.hasOwnProperty.call(p, 'agregada') && !Object.prototype.hasOwnProperty.call(p, 'reglas'));
    });
    igual(JSON.stringify(modelo), original);
  });

  await pruebaAsync('Cancelar resuelve la promesa y detiene lotes pendientes sin publicar resultados parciales', async () => {
    const { mapa, lote, terminar, pendientes } = crearMapa(); let evaluados = 0;
    const promesa = mapa.generar(configuracion(sistema(2), { progreso: hechos => { evaluados = hechos; } }));
    lote(); igual(evaluados, 2); mapa.cancelar();
    const resultado = await promesa;
    igual(resultado.estado, 'cancelado'); cierto(!resultado.datos); cierto(!mapa.activo()); igual(pendientes.size, 0);
    terminar(); igual(evaluados, 2);
  });

  await pruebaAsync('Una firma caducada descarta el mapa, incluso después de un lote; una petición nueva cancela la anterior', async () => {
    const { mapa, lote, terminar } = crearMapa(); let vigente = true;
    const primera = mapa.generar(configuracion(sistema(2), { estaVigente: () => vigente }));
    lote(); vigente = false; terminar();
    const descartado = await primera; igual(descartado.estado, 'cancelado'); cierto(!descartado.datos);
    const reemplazada = mapa.generar(configuracion(sistema(1)));
    const nueva = mapa.generar(configuracion(sistema(1)));
    igual((await reemplazada).estado, 'cancelado'); cierto(mapa.activo()); mapa.cancelar();
    igual((await nueva).estado, 'cancelado'); cierto(!mapa.activo());
  });

  await pruebaAsync('Rejilla de dos entradas incluye exactamente extremos decimales y conserva zonas sin salida', async () => {
    const { mapa, terminar } = crearMapa();
    const modelo = sistema(2, -33.7, 129.4), promesa = mapa.generar(configuracion(modelo));
    // Se captura antes de ejecutar temporizadores para evitar rechazos sin observador.
    const observado = promesa.then(valor => ({ valor }), error => ({ error }));
    terminar(); const terminado = await observado;
    if (terminado.error) throw terminado.error;
    const datos = terminado.valor.datos;
    igual(datos.resolucion, 15); igual(datos.puntos.length, 225); igual(datos.sinSalida, 15);
    igual(datos.puntos[0].x, -33.7); igual(datos.puntos[14].x, 129.4); igual(datos.puntos[224].y, 129.4);
    datos.puntos.forEach(p => { if (p.columna === 14) igual(p.resultado, null); else cerca(p.resultado, 20); });
  });

  await pruebaAsync('Tres entradas fijan la tercera y los ejes elegidos no alteran ese valor', async () => {
    const { mapa, terminar } = crearMapa(), modelo = sistema(3);
    modelo.reglas[0].antecedentes = { x1: null, x2: null, x3: 'baja' };
    for (const fijo of [5, 10]) {
      const promesa = mapa.generar(configuracion(modelo, { valores: { x1: 2, x2: 3, x3: fijo } }));
      terminar(); const { datos } = await promesa;
      igual(datos.fijos, [{ id: 'x3', nombre: 'Entrada 3', valor: fijo }]);
      igual(datos.puntos.length, 225); igual(datos.sinSalida, fijo === 10 ? 225 : 0);
      datos.puntos.forEach(p => { if (fijo === 10) igual(p.resultado, null); else cerca(p.resultado, 20); });
    }
  });

  await pruebaAsync('Configuraciones incompletas, ejes repetidos y valores fijos inválidos no dejan trabajos activos', async () => {
    const { mapa } = crearMapa(), modelo = sistema(3);
    await rechaza(() => mapa.generar(configuracion(modelo, { ejeX: 'x1', ejeY: 'x1' })));
    await rechaza(() => mapa.generar(configuracion(modelo, { valores: { x3: '' } })));
    await rechaza(() => mapa.generar(configuracion(modelo, { valores: { x3: 11 } })));
    modelo.reglas[0].consecuente = null;
    await rechaza(() => mapa.generar(configuracion(modelo)));
    cierto(!mapa.activo());
  });

  await pruebaAsync('Mapa conserva la salida estrecha 0.02 y distingue diagnósticos de puntos sin activación', async () => {
    const { mapa, terminar } = crearMapa(), modelo = sistema(1);
    modelo.salida.min = 0; modelo.salida.max = 100;
    modelo.salida.conjuntos[0] = { id: 'a', nombre: 'Estrecha', tipo: 'triangular', parametros: [0.01, 0.02, 0.03] };
    const promesa = mapa.generar(configuracion(modelo)); terminar();
    const { datos } = await promesa;
    datos.puntos.forEach((p, i) => {
      if (i === 100) { igual(p.resultado, null); igual(p.estado, 'sin-reglas-activas'); }
      else { cerca(p.resultado, 0.02); igual(p.estado, 'ok'); }
      cierto(typeof p.diagnostico === 'string' && p.diagnostico.length > 0);
    });
    igual(datos.diagnosticos, { ok: 100, 'sin-reglas-activas': 1 });
  });

  if (!informe('Lógica difusa: mapa por lotes, cancelación y referencia independiente')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
