'use strict';

const { crearContexto, cargar, evaluar: evaluarContexto, prueba, igual, cierto, lanza, informe } = require('./cargar');
const motor = cargar(crearContexto(), ['js/difusa/motor.js']).DifusaMotor;

function cerca(real, esperado, tolerancia = 1e-10) {
  cierto(Number.isFinite(real) && Math.abs(real - esperado) <= tolerancia,
    'Esperado ' + esperado + '; recibido ' + real + '; tolerancia ' + tolerancia);
}

// Referencia independiente por tramos, sin llamar a las funciones del motor.
function salidaManual(y, categoria) {
  if (categoria === 'breve') return y <= 20 ? 1 : y < 40 ? (40 - y) / 20 : 0;
  if (categoria === 'detallada') return y <= 60 ? 0 : y < 80 ? (y - 60) / 20 : 1;
  return y <= 20 || y >= 80 ? 0 : y <= 50 ? (y - 20) / 30 : (80 - y) / 30;
}

prueba('API pura disponible como script clásico y CommonJS, sin DOM', () => {
  ['triangular', 'trapezoidal', 'pertenenciasEntrada', 'pertenenciasSalida', 'validarEntrada',
    'evaluar', 'centroide', 'exportarReferencias'].forEach(nombre => cierto(typeof motor[nombre] === 'function'));
  const comun = require('../js/difusa/motor');
  cerca(comun.evaluar(5, 5).centroide.valor, 50);
  cierto(Object.isFrozen(motor.modelo));
  cierto(Object.isFrozen(motor.modelo.reglas[0]));
  cierto(Object.isFrozen(motor.modelo.entradas.baja.parametros));
});

prueba('Pertenencias de entrada exactas en extremos, quiebres y puntos centrales', () => {
  const casos = [
    [0, { baja: 1, media: 0, alta: 0 }],
    [2.5, { baja: 1, media: 0, alta: 0 }],
    [3.75, { baja: 0.5, media: 0.5, alta: 0 }],
    [5, { baja: 0, media: 1, alta: 0 }],
    [6.25, { baja: 0, media: 0.5, alta: 0.5 }],
    [7.5, { baja: 0, media: 0, alta: 1 }],
    [10, { baja: 0, media: 0, alta: 1 }]
  ];
  casos.forEach(([x, esperado]) => igual(motor.pertenenciasEntrada(x), esperado));
});

prueba('Pertenencias de salida y empate adicional en y=32', () => {
  igual(motor.pertenenciasSalida(0), { breve: 1, intermedia: 0, detallada: 0 });
  igual(motor.pertenenciasSalida(50), { breve: 0, intermedia: 1, detallada: 0 });
  igual(motor.pertenenciasSalida(100), { breve: 0, intermedia: 0, detallada: 1 });
  igual(motor.pertenenciasSalida(32), { breve: 0.4, intermedia: 0.4, detallada: 0 });
});

prueba('Triángulos y trapecios con parámetros repetidos preservan hombros sin divisiones por cero', () => {
  igual([motor.trapezoidal(0, [0, 0, 2.5, 5]), motor.trapezoidal(10, [5, 7.5, 10, 10])], [1, 1]);
  igual([motor.triangular(0, [0, 0, 5]), motor.triangular(5, [0, 5, 5])], [1, 1]);
  igual([motor.triangular(2, [2, 2, 2]), motor.triangular(1.9, [2, 2, 2])], [1, 0]);
  igual([motor.trapezoidal(2, [2, 2, 2, 2]), motor.trapezoidal(2.1, [2, 2, 2, 2])], [1, 0]);
  cerca(motor.triangular(2.5, [0, 0, 5]), 0.5);
  cerca(motor.trapezoidal(3.75, [0, 0, 2.5, 5]), 0.5);
  igual(motor.trapezoidal(-1, [0, 0, 2.5, 5]), 0);
  igual(motor.trapezoidal(11, [5, 7.5, 10, 10]), 0);
});

prueba('Funciones genéricas rechazan parámetros desordenados, incompletos y no finitos', () => {
  lanza(() => motor.triangular(1, [0, 2, 1]));
  lanza(() => motor.trapezoidal(1, [0, 1, 2]));
  lanza(() => motor.trapezoidal(1, [0, 1, 2, Infinity]));
  lanza(() => motor.triangular(NaN, [0, 1, 2]));
  lanza(() => motor.pertenenciasEntrada('2'));
});

prueba('Validación estricta de campos vacíos, texto, valores no finitos y rango, sin truncar ni limitar', () => {
  const invalidas = [undefined, null, true, false, [], {}, '', ' ', 'hola', '5x', '0x5', '5,2',
    'Infinity', 'NaN', NaN, Infinity, -Infinity, -0.1, 10.1, '10.0001'];
  invalidas.forEach(valor => {
    const validacion = motor.validarEntrada(valor);
    cierto(!validacion.valida && typeof validacion.error === 'string');
    lanza(() => motor.evaluar(valor, 5));
    lanza(() => motor.evaluar(5, valor));
  });
  igual(motor.validarEntrada(' 3.141592653589793 '), { valida: true, valor: 3.141592653589793 });
  igual(motor.validarEntrada('0'), { valida: true, valor: 0 });
  igual(motor.validarEntrada(10), { valida: true, valor: 10 });
  igual(motor.evaluar('2', '8').entradas, { familiaridad: 2, dificultad: 8 });
  let mensaje = '';
  try { motor.evaluar(5, 11); } catch (error) { mensaje = error.message; }
  cierto(/Dificultad/.test(mensaje) && /0 y 10/.test(mensaje), 'El error debe identificar la entrada y su rango');
});

prueba('Las nueve reglas coinciden con la tabla y cada una actúa sola en su prototipo', () => {
  const filas = [
    ['baja', 'baja', 'intermedia'], ['baja', 'media', 'detallada'], ['baja', 'alta', 'detallada'],
    ['media', 'baja', 'breve'], ['media', 'media', 'intermedia'], ['media', 'alta', 'detallada'],
    ['alta', 'baja', 'breve'], ['alta', 'media', 'breve'], ['alta', 'alta', 'intermedia']
  ];
  const prototipos = { baja: 0, media: 5, alta: 10 };
  igual(motor.modelo.reglas.map(r => [r.familiaridad, r.dificultad, r.salida]), filas);
  filas.forEach(([familiaridad, dificultad, salida], activa) => {
    const r = motor.evaluar(prototipos[familiaridad], prototipos[dificultad]);
    igual(r.reglas.map(regla => regla.activacion), filas.map((_, i) => i === activa ? 1 : 0));
    igual(r.etiquetas, [salida]);
    r.reglas.forEach((regla, j) => {
      igual(regla.id, j + 1);
      igual(regla.peso, 1);
      r.puntos.forEach((y, i) => cerca(regla.recortada[i], j === activa ? salidaManual(y, salida) : 0));
    });
    r.puntos.forEach((y, i) => cerca(r.agregada[i], salidaManual(y, salida)));
  });
});

prueba('Mezcla manual 3.5/6.5: recortes consultables e integral continua analítica de la envolvente', () => {
  const r = motor.evaluar(3.5, 6.5);
  igual(r.pertenencias.familiaridad, { baja: 0.6, media: 0.4, alta: 0 });
  igual(r.pertenencias.dificultad, { baja: 0, media: 0.4, alta: 0.6 });
  const activaciones = [0, 0.4, 0.6, 0, 0.4, 0.4, 0, 0, 0];
  igual(r.reglas.map(regla => regla.activacion), activaciones);
  // Perfil agregado derivado a mano: rampa 20–32, meseta hasta 68,
  // rampa detallada 68–72 y meseta final de altura 0.6.
  let numerador = 0, denominador = 0;
  r.puntos.forEach((y, i) => {
    const esperado = y <= 20 ? 0 : y < 32 ? (y - 20) / 30 : y <= 68 ? 0.4 : y < 72 ? (y - 60) / 20 : 0.6;
    r.reglas.forEach((regla, j) => {
      const pertenencia = salidaManual(y, regla.salida);
      const recortada = pertenencia < activaciones[j] ? pertenencia : activaciones[j];
      cerca(regla.recortada[i], recortada);
    });
    cerca(r.agregada[i], esperado);
    numerador += y * esperado;
    denominador += esperado;
  });
  // Áreas geométricas: 2.4 + 14.4 + 2 + 16.8 = 35.6.
  // Momentos: 67.2 + 720 + 140.2666... + 1444.8 = 35584/15.
  cerca(r.centroide.numerador, 35584 / 15);
  cerca(r.centroide.denominador, 178 / 5);
  cerca(r.centroide.valor, 17792 / 267);
  cierto(Math.abs(r.centroide.valor - numerador / denominador) > 1e-4, 'La antigua suma discreta no determina el resultado continuo');
});

prueba('Centroide continuo de hombros coincide con áreas y centros geométricos independientes', () => {
  // Triángulo de área10, centro220/3; rectángulo de área20, centro90.
  const denominador = 30;
  const numeradorDetallada = 7600 / 3;
  const detallada = motor.evaluar(0, 10);
  const breve = motor.evaluar(10, 0);
  cerca(detallada.centroide.denominador, denominador);
  cerca(detallada.centroide.numerador, numeradorDetallada, 1e-8);
  cerca(detallada.centroide.valor, numeradorDetallada / denominador);
  cerca(breve.centroide.valor, 100 - numeradorDetallada / denominador);
  cierto(detallada.centroide.valor < 100 && breve.centroide.valor > 0);
});

prueba('Caso simétrico 5/5 conserva el triángulo intermedio y devuelve 50', () => {
  const r = motor.evaluar(5, 5);
  cerca(r.centroide.denominador, 30);
  cerca(r.centroide.numerador, 1500, 1e-8);
  cerca(r.centroide.valor, 50);
  igual(r.etiquetas, ['intermedia']);
  igual(r.pertenenciasResultado, motor.pertenenciasSalida(r.centroide.valor));
});

prueba('Centroide controlado con denominador cero es un estado explícito sin NaN ni resultado inventado', () => {
  igual(motor.centroide([0, 50, 100], [0, 0, 0]),
    { estado: 'sin-reglas-activas', valor: null, numerador: 0, denominador: 0 });
  igual(motor.centroide([0, 50, 100], [0.25, 0.5, 0.25]),
    { estado: 'ok', valor: 50, numerador: 50, denominador: 1 });
  lanza(() => motor.centroide([], []));
  lanza(() => motor.centroide([0, 50], [0]));
  lanza(() => motor.centroide([NaN], [1]));
  lanza(() => motor.centroide([0], [-0.1]));
  lanza(() => motor.centroide([0], [Infinity]));
});

prueba('Muestreo uniforme incluye ambos extremos, conserva precisión y produce resultados finitos', () => {
  const r = motor.evaluar(3.141592653589793, 6.123456789012345);
  igual(r.puntos.length, 1001);
  igual(r.puntos[0], 0);
  igual(r.puntos[1000], 100);
  r.puntos.forEach((y, i) => cerca(y, i / 10));
  igual(r.entradas.familiaridad, 3.141592653589793);
  cierto(r.centroide.valor !== Number(r.centroide.valor.toFixed(3)), 'No debe redondear internamente');
  [0, 2.5, 5, 7.5, 10].forEach(f => [0, 2.5, 5, 7.5, 10].forEach(d => {
    const resultado = motor.evaluar(f, d);
    cierto(Number.isFinite(resultado.centroide.valor) && resultado.centroide.valor >= 0 && resultado.centroide.valor <= 100);
    cierto(resultado.centroide.denominador > 0);
  }));
});

prueba('Pasos registrados contienen los datos de la ejecución actual en cada etapa', () => {
  const r = motor.evaluar(3.5, 6.5);
  igual(r.pasos.map(paso => paso.tipo), ['datos', 'fuzzificacion', 'reglas', 'implicacion', 'agregacion', 'centroide', 'interpretacion']);
  igual(r.pasos[0].entradas, r.entradas);
  igual(r.pasos[1].pertenencias, r.pertenencias);
  r.pasos[2].reglas.forEach((regla, i) => {
    igual(regla.gradoFamiliaridad, r.reglas[i].gradoFamiliaridad);
    igual(regla.gradoDificultad, r.reglas[i].gradoDificultad);
    igual(regla.activacion, Math.min(regla.gradoFamiliaridad, regla.gradoDificultad));
  });
  r.pasos[3].reglas.forEach((regla, i) => igual(regla.recortada, r.reglas[i].recortada));
  igual(r.pasos[4].puntos, r.puntos);
  igual(r.pasos[4].agregada, r.agregada);
  ['estado', 'valor', 'numerador', 'denominador'].forEach(clave => igual(r.pasos[5][clave], r.centroide[clave]));
  igual(r.pasos[6].pertenenciasResultado, r.pertenenciasResultado);
  igual(r.pasos[6].etiquetas, r.etiquetas);
  cierto(r.pasos[0].descripcion.includes('3.5') && r.pasos[0].descripcion.includes('6.5'));
});

prueba('Cálculos independientes entre ejecuciones y referencias JSON procedentes del motor real', () => {
  const previo = motor.evaluar(2, 8);
  previo.agregada[0] = 999;
  previo.reglas[0].recortada[0] = 999;
  previo.pertenencias.familiaridad.baja = 999;
  const nuevo = motor.evaluar(2, 8);
  cierto(nuevo.agregada[0] <= 1 && nuevo.reglas[0].recortada[0] <= 1 && nuevo.pertenencias.familiaridad.baja <= 1);
  const referencias = JSON.parse(JSON.stringify(motor.exportarReferencias()));
  igual(referencias.muestreo.puntos, 1001);
  igual(referencias.tolerancia, 1e-8);
  igual(referencias.casos.length, 9);
  referencias.casos.forEach(caso => cerca(caso.resultado, motor.evaluar(caso.familiaridad, caso.dificultad).centroide.valor));
});

/* La persistencia configurable se verifica en logica-difusa-estado.test.js. */
if (!informe('Lógica difusa: núcleo Mamdani y referencia manual')) process.exitCode = 1;
