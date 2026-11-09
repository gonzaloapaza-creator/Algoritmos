'use strict';
const { crearContexto, cargar, prueba, igual, cierto, lanza, informe } = require('./cargar');
const contexto = cargar(crearContexto(), ['js/difusa/motor.js', 'js/difusa/modelo.js']);
const M = contexto.DifusaModelo, motor = contexto.DifusaMotor;
const copiar = dato => JSON.parse(JSON.stringify(dato));
function cerca(real, esperado, tolerancia = 1e-9) {
  cierto(Number.isFinite(real) && Math.abs(real - esperado) <= tolerancia, 'Esperado ' + esperado + ', recibido ' + real);
}
function variable(id, min = 0, max = 10) {
  return { id, nombre: id, unidad: '', min, max, conjuntos: [
    { id: 'izquierda', nombre: 'Izquierda', tipo: 'trapezoidal', parametros: [min, min, min, max] },
    { id: 'derecha', nombre: 'Derecha', tipo: 'trapezoidal', parametros: [min, max, max, max] }
  ] };
}
function sistema(cantidad = 1) {
  const entradas = Array.from({ length: cantidad }, (_, i) => variable('x' + (i + 1)));
  const antecedentes = {};
  entradas.forEach(v => { antecedentes[v.id] = 'izquierda'; });
  return { version: 2, id: 'prueba', nombre: 'Prueba independiente', descripcion: '', entradas,
    salida: variable('y', 10, 30), reglas: [{ id: 'r1', antecedentes, conector: 'AND', consecuente: 'izquierda', peso: 1, activa: true }] };
}

prueba('Lectura decimal estricta acepta coma y punto, conserva precisión y rechaza textos parciales o ambiguos', () => {
  [['3,125', 3.125], ['-2.75', -2.75], [' +.125 ', 0.125], ['1,5e2', 150], [0, 0], [1e-12, 1e-12]].forEach(([texto, valor]) => {
    const lectura = M.leerNumero(texto); cierto(lectura.valido); igual(lectura.valor, valor);
  });
  ['', ' ', '2texto', '2,4.5', '2.4,5', '1,2,3', '1 000', '0x10', '1e', true, null, [], {}, Infinity, NaN].forEach(valor => {
    const lectura = M.leerNumero(valor); cierto(!lectura.valido); igual(lectura.valor, null);
  });
});

prueba('Tres ejemplos reproducibles listos y plantilla coherente con decisiones pendientes', () => {
  ['ayuda', 'propina', 'ventilacion'].forEach(nombre => {
    const ejemplo = M.crearEjemplo(nombre), informeModelo = M.validar(ejemplo, { permitirBorradores: true });
    cierto(informeModelo.valido && informeModelo.listo, JSON.stringify(informeModelo.errores));
    cierto(motor.evaluarSistema(ejemplo, ejemplo.valoresIniciales).centroide.estado === 'ok');
  });
  const plantilla = M.plantilla(), revision = M.validar(plantilla, { permitirBorradores: true });
  cierto(revision.valido && !revision.listo && revision.pendientes.length > 0);
  cierto(plantilla.reglas.every(r => r.consecuente === null));
  lanza(() => motor.evaluarSistema(plantilla, plantilla.valoresIniciales));
  const otro = M.crearEjemplo('ayuda'); otro.entradas[0].conjuntos[0].parametros[2] = 99;
  igual(M.crearEjemplo('ayuda').entradas[0].conjuntos[0].parametros[2], 2.5);
});

prueba('Límites de dimensiones, nombres, IDs y números se validan también para JSON importado', () => {
  const cambios = [
    m => { m.version = 1; }, m => { m.entradas = []; }, m => { m.entradas = [variable('a'), variable('b'), variable('c'), variable('d')]; },
    m => { m.reglas = []; }, m => { m.reglas = Array.from({ length: 126 }, (_, i) => ({ ...m.reglas[0], id: 'r' + i })); },
    m => { m.entradas[0].conjuntos = [m.entradas[0].conjuntos[0]]; }, m => { m.entradas[0].conjuntos = Array(6).fill(m.entradas[0].conjuntos[0]); },
    m => { m.nombre = ' '; }, m => { m.nombre = 'a'.repeat(41); }, m => { m.entradas[0].nombre = m.salida.nombre; },
    m => { m.entradas[0].conjuntos[1].nombre = ' Izquierda '; }, m => { m.entradas[0].conjuntos[1].id = 'izquierda'; },
    m => { m.entradas[0].id = '__proto__'; }, m => { m.reglas[0].id = 'constructor'; },
    m => { m.entradas[0].min = ''; }, m => { m.entradas[0].min = -1000001; }, m => { m.entradas[0].max = Infinity; },
    m => { m.entradas[0].max = m.entradas[0].min; }, m => { m.salida.min = NaN; },
    m => { m.entradas[0].conjuntos[0].parametros = [0, 0, 0, 11]; },
    m => { m.entradas[0].conjuntos[0].parametros = [0, 5, 4, 10]; },
    m => { m.entradas[0].conjuntos[0].parametros = [5, 5, 5, 5]; },
    m => { m.entradas[0].conjuntos[0].tipo = 'gaussiana'; },
    m => { m.entradas[0].conjuntos[0].parametros[0] = '0'; },
    m => { m.valoresIniciales = { x1: 11 }; }
  ];
  cambios.forEach((cambiar, i) => {
    const m = sistema(); cambiar(m);
    const revision = M.validar(m, { permitirBorradores: true });
    cierto(!revision.valido && !revision.listo && revision.errores.length > 0, 'Cambio inválido no detectado: ' + i);
    cierto(revision.errores.every(e => typeof e.ruta === 'string' && typeof e.mensaje === 'string'));
  });
  [null, [], 'modelo', 4].forEach(m => cierto(!M.validar(m).valido));
});

prueba('Validación diferencia borradores, referencias rotas, reglas vacías y avisos deliberados', () => {
  const m = sistema(2);
  m.reglas[0].consecuente = null;
  cierto(M.validar(m, { permitirBorradores: true }).valido);
  cierto(!M.validar(m, { permitirBorradores: true }).listo);
  cierto(!M.validar(m).valido);
  m.reglas[0].activa = false;
  cierto(M.validar(m, { permitirBorradores: true }).listo);
  igual(motor.evaluarSistema(m, { x1: 2, x2: 2 }).centroide.valor, null);
  const errores = [
    r => { r.antecedentes.x1 = 'no-existe'; }, r => { r.antecedentes.otra = 'izquierda'; },
    r => { delete r.antecedentes.x1; }, r => { r.antecedentes = { x1: null, x2: null }; },
    r => { r.consecuente = 'no-existe'; }, r => { r.peso = -0.1; }, r => { r.peso = 1.01; },
    r => { r.peso = '0.5'; }, r => { r.conector = 'XOR'; }, r => { r.activa = 'true'; }
  ];
  errores.forEach(cambiar => { const modelo = sistema(2); cambiar(modelo.reglas[0]); cierto(!M.validar(modelo).valido); lanza(() => motor.evaluarSistema(modelo, { x1: 2, x2: 2 })); });
  const avisos = sistema();
  avisos.reglas.push({ ...copiar(avisos.reglas[0]), id: 'r2' });
  avisos.reglas.push({ ...copiar(avisos.reglas[0]), id: 'r3', consecuente: 'derecha' });
  avisos.reglas.push({ ...copiar(avisos.reglas[0]), id: 'r4', peso: 0, activa: false });
  const revision = M.validar(avisos);
  cierto(revision.valido && revision.listo);
  ['duplicada', 'otro consecuente', 'desactivada', 'peso cero'].forEach(texto => cierto(revision.avisos.some(a => a.mensaje.includes(texto)), texto));
});

prueba('Cobertura exacta por tramos descubre huecos estrechos, extremos, intervalos abiertos y puntos aislados', () => {
  const v = variable('x');
  cierto(M.cobertura(v).completa);
  v.conjuntos[0].parametros = [0, 0, 2, 4];
  v.conjuntos[1].parametros = [6, 6, 10, 10];
  igual(M.cobertura(v).huecos, [{ min: 4, max: 6, incluyeMin: true, incluyeMax: false }]);
  v.conjuntos = [
    { id: 'a', nombre: 'A', tipo: 'triangular', parametros: [0, 2.5, 5] },
    { id: 'b', nombre: 'B', tipo: 'triangular', parametros: [5, 7.5, 10] }
  ];
  igual(M.cobertura(v).huecos, [0, 5, 10].map(x => ({ min: x, max: x, incluyeMin: true, incluyeMax: true })));
  v.conjuntos[0] = { id: 'a', nombre: 'A', tipo: 'trapezoidal', parametros: [0, 0, 0.12, 0.1234] };
  v.conjuntos[1] = { id: 'b', nombre: 'B', tipo: 'trapezoidal', parametros: [0.1235, 0.13, 10, 10] };
  igual(M.cobertura(v).huecos, [{ min: 0.1234, max: 0.1235, incluyeMin: true, incluyeMax: true }]);
  v.conjuntos[0].parametros[0] = -1;
  cierto(!M.cobertura(v).valida);
});

prueba('Generación hasta 125 combinaciones conserva la decisión de salida pendiente sin mutar el sistema', () => {
  const m = sistema(3);
  m.entradas.forEach(v => { v.conjuntos = M.distribuirConjuntos(v, 5); });
  const antes = JSON.stringify(m), reglas = M.generarCombinaciones(m);
  igual(reglas.length, 125);
  igual(new Set(reglas.map(r => JSON.stringify(r.antecedentes))).size, 125);
  igual(new Set(reglas.map(r => r.id)).size, 125);
  cierto(reglas.every(r => r.consecuente === null && r.activa && r.peso === 1 && r.conector === 'AND'));
  igual(JSON.stringify(m), antes);
  m.reglas = reglas;
  const revision = M.validar(m, { permitirBorradores: true });
  cierto(revision.valido && !revision.listo && revision.pendientes.length === 125);
});

prueba('Distribución automática es explícita, pura, cubre el dominio y conserva los IDs/nombres existentes', () => {
  [2, 3, 4, 5].forEach(cantidad => {
    const v = variable('termica', -33.7, 129.4), original = JSON.stringify(v);
    const conjuntos = M.distribuirConjuntos(v, cantidad);
    igual(JSON.stringify(v), original);
    igual(conjuntos[0].id, 'izquierda'); igual(conjuntos[0].nombre, 'Izquierda');
    igual(conjuntos[1].id, 'derecha'); igual(conjuntos[1].nombre, 'Derecha');
    cierto(M.cobertura({ ...v, conjuntos }).completa);
    const modelo = sistema(); modelo.entradas[0] = { ...v, id: 'x1', conjuntos };
    cierto(M.validar(modelo).valido);
  });
  lanza(() => M.distribuirConjuntos(variable('x'), 6));
});

prueba('Firma matemática ignora renombres, unidades, descripción y orden, pero detecta cada cambio matemático', () => {
  const m = sistema(2), firma = M.firmaMatematica(m), renombrado = copiar(m);
  renombrado.nombre = 'Renombrado'; renombrado.descripcion = 'Otra explicación'; renombrado.id = 'otro';
  renombrado.entradas[0].nombre = 'Nuevo nombre'; renombrado.entradas[0].unidad = 'cm';
  renombrado.salida.conjuntos[0].nombre = 'Otra categoría'; renombrado.valoresIniciales = { x1: 2, x2: 3 };
  renombrado.entradas.reverse(); renombrado.entradas[0].conjuntos.reverse();
  igual(M.firmaMatematica(renombrado), firma);
  [c => { c.reglas[0].peso = 0.5; }, c => { c.reglas[0].conector = 'OR'; }, c => { c.reglas[0].activa = false; },
    c => { c.entradas[0].max = 11; }, c => { c.entradas[0].conjuntos[0].parametros[2] = 1; },
    c => { c.reglas[0].consecuente = 'derecha'; }, c => { c.reglas[0].antecedentes.x2 = null; }].forEach(cambiar => {
    const cambiado = copiar(m); cambiar(cambiado); cierto(M.firmaMatematica(cambiado) !== firma);
  });
});

prueba('Una entrada y dominio de salida 10–30: integral coincide con geometría independiente', () => {
  const m = sistema(), r = motor.evaluarSistema(m, { x1: '5,0' });
  igual(r.puntos.length, 1001); igual(r.puntos[0], 10); igual(r.puntos[1000], 30);
  cerca(r.reglas[0].activacion, 0.5);
  // Rectángulo área5, centro15; triángulo área2.5, centro70/3.
  const denominador = 7.5;
  const numerador = 400 / 3;
  cerca(r.centroide.denominador, denominador);
  cerca(r.centroide.numerador, numerador);
  cerca(r.centroide.valor, numerador / denominador);
  r.puntos.forEach((y, i) => cerca(r.agregada[i], i <= 500 ? 0.5 : (1000 - i) / 1000));
  const exacto = motor.evaluarSistema(m, { x1: '3,123456789' });
  igual(exacto.entradas.x1, 3.123456789);
  ['', 'texto', 10.01, -1, Infinity].forEach(valor => lanza(() => motor.evaluarSistema(m, { x1: valor })));
});

prueba('Dos y tres entradas: AND/OR excluyen No importa y el peso multiplica después del conector', () => {
  [2, 3].forEach(cantidad => {
    const m = sistema(cantidad), antecedentes = { x1: 'izquierda', x2: 'izquierda' };
    if (cantidad === 3) antecedentes.x3 = null;
    m.reglas = [
      { id: 'r1', antecedentes: { ...antecedentes }, conector: 'OR', consecuente: 'izquierda', peso: 0.5, activa: true },
      { id: 'r2', antecedentes: { ...antecedentes }, conector: 'AND', consecuente: 'derecha', peso: 0.5, activa: true }
    ];
    const r = motor.evaluarSistema(m, { x1: 2, x2: 5, x3: 8 });
    cerca(r.reglas[0].activacionAntecedente, 0.8); cerca(r.reglas[0].activacion, 0.4);
    cerca(r.reglas[1].activacionAntecedente, 0.5); cerca(r.reglas[1].activacion, 0.25);
    cerca(r.agregada[0], 0.4); cerca(r.agregada[250], 0.4); cerca(r.agregada[750], 0.25); cerca(r.agregada[1000], 0.25);
    if (cantidad === 3) {
      igual(r.reglas[0].antecedentes[2], { variableId: 'x3', conjuntoId: null, grado: null });
      m.reglas[1].antecedentes.x3 = 'izquierda';
      const todos = motor.evaluarSistema(m, { x1: 2, x2: 5, x3: 8 });
      cerca(todos.reglas[1].activacionAntecedente, 0.2); cerca(todos.reglas[1].activacion, 0.1);
    }
  });
});

prueba('Ausencia de activación, reglas desactivadas y peso cero devuelven masa cero y valor null', () => {
  const m = sistema();
  const sinActivacion = motor.evaluarSistema(m, { x1: 10 }).centroide;
  igual(sinActivacion.estado, 'sin-reglas-activas'); igual(sinActivacion.valor, null);
  igual(sinActivacion.numerador, 0); igual(sinActivacion.denominador, 0);
  m.reglas[0].activa = false;
  const desactivada = motor.evaluarSistema(m, { x1: 0 });
  igual(desactivada.reglas[0].activacionAntecedente, 1); igual(desactivada.reglas[0].activacion, 0);
  igual(desactivada.centroide.valor, null);
  m.reglas[0].activa = true; m.reglas[0].peso = 0;
  const cero = motor.evaluarSistema(m, { x1: 0 });
  igual(cero.centroide.estado, 'sin-reglas-activas'); igual(cero.etiquetas, []); igual(cero.pertenenciasResultado, null);
  cierto(cero.agregada.every(grado => grado === 0));
});

prueba('Interpretación conserva empates y no inventa etiqueta cuando el centroide queda fuera de todos los conjuntos', () => {
  const m = sistema();
  m.salida = variable('y', -10, 10);
  m.salida.conjuntos.forEach(c => { c.tipo = 'triangular'; c.parametros = [-10, 0, 10]; });
  m.reglas.push({ ...copiar(m.reglas[0]), id: 'r2', consecuente: 'derecha' });
  const empate = motor.evaluarSistema(m, { x1: 0 });
  cerca(empate.centroide.valor, 0); igual(empate.etiquetas, ['izquierda', 'derecha']); cierto(!empate.sinEtiqueta);
  m.salida.conjuntos[0].parametros = [-10, -7, -4]; m.salida.conjuntos[1].parametros = [4, 7, 10];
  const hueco = motor.evaluarSistema(m, { x1: 0 });
  cerca(hueco.centroide.valor, 0); igual(hueco.etiquetas, []); cierto(hueco.sinEtiqueta);
  igual(hueco.pertenenciasResultado, { izquierda: 0, derecha: 0 });
});

prueba('Pasos configurables contienen antecedentes, peso, recortes y sumas de esta ejecución, sin mutar datos', () => {
  const m = sistema(3), valores = { x1: 2, x2: 3.25, x3: 5 }, antes = JSON.stringify([m, valores]);
  const r = motor.evaluarSistema(m, valores);
  igual(JSON.stringify([m, valores]), antes);
  igual(r.pasos.map(p => p.tipo), ['datos', 'fuzzificacion', 'reglas', 'implicacion', 'agregacion', 'centroide', 'interpretacion']);
  igual(r.pasos[0].entradas, r.entradas); igual(r.pasos[1].pertenencias, r.pertenencias);
  igual(r.pasos[2].reglas[0].antecedentes, r.reglas[0].antecedentes);
  igual(r.pasos[2].reglas[0].peso, r.reglas[0].peso);
  igual(r.pasos[3].reglas[0].recortada, r.reglas[0].recortada);
  igual(r.pasos[4].agregada, r.agregada); igual(r.pasos[5].numerador, r.centroide.numerador);
  igual(r.pasos[5].denominador, r.centroide.denominador); igual(r.pasos[6].etiquetas, r.etiquetas);
  igual(r.firmaModelo, M.firmaMatematica(m));
});

prueba('Modelo configurable original conserva todas las referencias numéricas y recortes del núcleo anterior', () => {
  const m = M.crearEjemplo('ayuda');
  motor.exportarReferencias().casos.forEach(caso => {
    const anterior = motor.evaluar(caso.familiaridad, caso.dificultad);
    const actual = motor.evaluarSistema(m, { familiaridad: caso.familiaridad, dificultad: caso.dificultad });
    igual(actual.puntos, anterior.puntos); igual(actual.agregada, anterior.agregada);
    igual(actual.centroide, anterior.centroide); igual(actual.etiquetas, anterior.etiquetas);
    actual.reglas.forEach((r, i) => { igual(r.activacion, anterior.reglas[i].activacion); igual(r.recortada, anterior.reglas[i].recortada); });
  });
});

prueba('H-03: triángulo estrecho activo da 0.02 aunque las 1001 consultas sean todas cero', () => {
  const m = sistema();
  m.salida = variable('y', 0, 100);
  m.salida.conjuntos[0] = { id: 'izquierda', nombre: 'Estrecho', tipo: 'triangular', parametros: [0.01, 0.02, 0.03] };
  const r = motor.evaluarSistema(m, { x1: 0 });
  igual(r.centroide.estado, 'ok'); cerca(r.centroide.valor, 0.02, 1e-14);
  cerca(r.centroide.denominador, 0.01, 1e-14);
  cerca(r.centroide.numerador, 0.0002, 1e-14);
  cierto(r.agregada.every(y => y === 0));
  cierto(r.tramos.some(t => t.x0 === 0.01 && t.x1 === 0.02 && t.y1 === 1));
  igual(r.pasos[4].tramos, r.tramos);
  cierto(r.pasos[5].formula.startsWith('integral'));
  igual(r.etiquetas, ['izquierda']);
});

prueba('Envolvente de dos triángulos superpuestos incorpora su intersección y área geométrica', () => {
  const c = (parametros, activacion = 1) => ({ conjunto: { tipo: 'triangular', parametros }, activacion });
  // Cada triángulo tiene área1.5. Su intersección es un triángulo de área0.5;
  // la unión por máximo es simétrica alrededor de2, área2.5 y momento5.
  const r = motor.integrarEnvolvente([c([0, 1, 3]), c([1, 3, 4])], 0, 4);
  cerca(r.centroide.denominador, 2.5);
  cerca(r.centroide.numerador, 5);
  cerca(r.centroide.valor, 2);
  cierto(r.tramos.some(t => t.x1 === 2) && r.tramos.some(t => t.x0 === 2));
});

prueba('Recorte parcial asimétrico conserva áreas y primer momento del trapecio resultante', () => {
  const r = motor.integrarEnvolvente([{ conjunto: { tipo: 'triangular', parametros: [0, 1, 4] }, activacion: 0.5 }], 0, 4);
  // Triángulos de áreas1/8 y3/8; rectángulo de área1. Momento total8/3.
  cerca(r.centroide.denominador, 1.5);
  cerca(r.centroide.numerador, 8 / 3);
  cerca(r.centroide.valor, 16 / 9);
  cierto(r.tramos.some(t => t.x0 === 0.5 && t.x1 === 2.5 && t.y0 === 0.5 && t.y1 === 0.5));
});

prueba('Hombros interiores y dominio negativo no crean área entre saltos y soporte', () => {
  const r = motor.integrarEnvolvente([{ conjunto: { tipo: 'trapezoidal', parametros: [-3, -3, -1, -1] }, activacion: 1 }], -100, 100);
  cerca(r.centroide.denominador, 2);
  cerca(r.centroide.numerador, -4);
  cerca(r.centroide.valor, -2);
  const externos = r.tramos.filter(t => t.x1 <= -3 || t.x0 >= -1);
  cierto(externos.every(t => t.y0 === 0 && t.y1 === 0));
});

prueba('Diagnósticos separan ninguna activación, activación sin masa y subdesbordamiento numérico', () => {
  const conjunto = { tipo: 'triangular', parametros: [0, 1, 2] };
  igual(motor.integrarEnvolvente([{ conjunto, activacion: 0 }], 0, 2).centroide.estado, 'sin-reglas-activas');
  igual(motor.integrarEnvolvente([{ conjunto, activacion: 1 }], 3, 4).centroide.estado, 'activacion-sin-masa');
  const minimo = Number.MIN_VALUE;
  const fallo = motor.integrarEnvolvente([{ conjunto: { tipo: 'triangular', parametros: [0, minimo, minimo * 2] }, activacion: minimo }], 0, 1).centroide;
  igual(fallo.estado, 'fallo-numerico'); igual(fallo.valor, null);
  cierto(fallo.mensaje.includes('Limitación numérica'));
});

if (!informe('Lógica difusa configurable: modelo, reglas y referencias independientes')) process.exitCode = 1;
