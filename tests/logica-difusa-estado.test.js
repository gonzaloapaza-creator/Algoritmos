/* Pruebas dirigidas de edición, trabajos JSON, autoguardado y migración difusa. */
'use strict';
const { crearContexto, cargar, prueba, cierto, igual, lanza, informe } = require('./cargar');
const clon = dato => JSON.parse(JSON.stringify(dato));
const ACTUAL = 'logica-difusa.v2';
const ANTERIOR = 'logica-difusa.v1';
const TRABAJOS = 'logica-difusa.trabajos.v2';

function memoria(datos = {}) {
  const valores = new Map([['otro-modulo.v1', 'conservar'], ...Object.entries(datos)]);
  const escrituras = [];
  return { valores, escrituras, getItem: clave => valores.has(clave) ? valores.get(clave) : null,
    setItem(clave, valor) { valores.set(clave, valor); escrituras.push(clave); } };
}
function entorno(almacenamiento = memoria()) {
  const c = crearContexto();
  c.localStorage = almacenamiento;
  cargar(c, ['js/difusa/motor.js', 'js/difusa/modelo.js', 'js/difusa/estado.js']);
  return { api: c.DifusaEstado, c, almacenamiento };
}
function cerca(a, b, tolerancia = 1e-8) {
  cierto(Number.isFinite(a) && Math.abs(a - b) <= tolerancia, a + ' debe ser cercano a ' + b);
}

prueba('Estado inicial y valores de ayuda se conservan al navegar; no almacena muestras', () => {
  const { api, almacenamiento } = entorno();
  igual(api.estado.valores, { familiaridad: 5, dificultad: 5 });
  cierto(api.estado.entradas === api.estado.valores);
  cierto(api.cambiarVista('reglas'));
  cierto(!api.cambiarVista('desconocida'));
  const r = api.evaluar();
  cerca(r.centroide.valor, 50);
  api.cambiarVista('resultado');
  cierto(api.estado.resultado === r);
  const guardado = JSON.parse(almacenamiento.valores.get(ACTUAL));
  igual(guardado.version, 2);
  igual(guardado.vista, 'resultado');
  cierto(!('resultado' in guardado) && !('puntos' in guardado) && !('seleccion' in guardado));
  cierto(!JSON.stringify(guardado).includes('recortada'));
  igual(almacenamiento.valores.get('otro-modulo.v1'), 'conservar');
});

prueba('Autoguardado v2 restaura modelo, valores y vista con resultados derivados descartados', () => {
  const { api, almacenamiento } = entorno();
  api.actualizarValor('familiaridad', '3,125');
  api.actualizarValor('dificultad', 8.23456789);
  api.cambiarVista('evaluar');
  api.evaluar();
  const segundo = entorno(almacenamiento).api;
  segundo.restaurar();
  igual(segundo.estado.valores, { familiaridad: 3.125, dificultad: 8.23456789 });
  igual(segundo.estado.vista, 'evaluar');
  igual(segundo.estado.resultado, null);
  igual(segundo.estado.pendiente, false);
});

prueba('Migración v1 recupera las entradas y conserva el original exacto', () => {
  const original = JSON.stringify({ version: 1, entradas: { familiaridad: 2, dificultad: 8 }, resultado: [999] });
  const { api, almacenamiento } = entorno(memoria({ [ANTERIOR]: original }));
  api.restaurar();
  igual(api.estado.valores, { familiaridad: 2, dificultad: 8 });
  igual(api.estado.modelo.nombre, 'Nivel de ayuda recomendado');
  igual(api.estado.resultado, null);
  igual(almacenamiento.valores.get(ANTERIOR), original);
  igual(JSON.parse(almacenamiento.valores.get(ACTUAL)).version, 2);
  cerca(api.evaluar().centroide.valor, 760 / 9); // Hombro continuo: triángulo + rectángulo.
});

prueba('Originales corruptos o incompatibles bloquean autoguardado hasta una acción explícita', () => {
  const invalidos = ['{', 'null', '[]', '{}', JSON.stringify({ version: 3 }),
    JSON.stringify({ version: 1, entradas: { familiaridad: '2', dificultad: 8 } }),
    JSON.stringify({ version: 1, entradas: { familiaridad: -1, dificultad: 8 } })];
  invalidos.forEach(texto => {
    const { api, almacenamiento } = entorno(memoria({ [ANTERIOR]: texto }));
    api.restaurar();
    cierto(api.estado.almacenamientoProtegido);
    igual(api.obtenerOriginal().texto, texto);
    api.actualizarValor('familiaridad', 2);
    api.cambiarVista('resultado');
    api.evaluar();
    igual(almacenamiento.valores.get(ANTERIOR), texto);
    cierto(!almacenamiento.valores.has(ACTUAL));
    cierto(api.estado.aviso.length > 0);
    const respaldo = api.respaldarOriginal();
    igual(respaldo.texto, texto);
    cierto(!api.estado.almacenamientoProtegido);
    cierto(almacenamiento.valores.has(ACTUAL));
    igual(almacenamiento.valores.get(ANTERIOR), texto);
  });
});

prueba('Autoguardado v2 incompatible permanece intacto y se reemplaza solo al elegir sistema actual', () => {
  const texto = JSON.stringify({ version: 2, modelo: { noCompatible: true } });
  const { api, almacenamiento } = entorno(memoria({ [ACTUAL]: texto }));
  api.restaurar();
  api.cargarEjemplo('propina');
  igual(almacenamiento.valores.get(ACTUAL), texto);
  igual(api.obtenerOriginal().clave, ACTUAL);
  cierto(api.descartarOriginal());
  cierto(!api.estado.almacenamientoProtegido);
  igual(JSON.parse(almacenamiento.valores.get(ACTUAL)).modelo.nombre, api.estado.modelo.nombre);
  igual(api.obtenerOriginal().texto, texto, 'La copia en memoria sigue descargable');
});

prueba('Fallos de almacenamiento permiten evaluar y utilizar trabajos durante la sesión', () => {
  const bloqueado = { getItem() { throw Error('Lectura bloqueada'); }, setItem() { throw Error('Cuota bloqueada'); } };
  const { api } = entorno(bloqueado);
  api.restaurar();
  cierto(api.estado.aviso.length > 0);
  cerca(api.evaluar().centroide.valor, 50);
  const guardado = api.guardarTrabajo('Mi caso');
  cierto(guardado.ok && !guardado.persistido);
  igual(api.listarTrabajos().length, 1);
  api.cargarEjemplo('ventilacion');
  cierto(api.cargarTrabajo(guardado.id).ok);
  igual(api.estado.valores, { familiaridad: 5, dificultad: 5 });
  cerca(api.evaluar().centroide.valor, 50);
});

prueba('Renombrar conserva cálculos y selección y actualiza las etiquetas de la ejecución', () => {
  const { api } = entorno();
  const resultado = api.evaluar();
  const muestras = resultado.agregada;
  api.seleccionarRegla('r5');
  api.seleccionarPunto(317);
  const modelo = clon(api.estado.modelo);
  modelo.entradas[0].nombre = 'Experiencia';
  modelo.entradas[0].unidad = 'puntos';
  modelo.entradas[0].conjuntos[0].nombre = 'Inicial';
  modelo.salida.conjuntos[1].nombre = 'Equilibrada';
  const aplicado = api.aplicarModelo(modelo);
  cierto(aplicado.ok && !aplicado.cambioMatematico);
  cierto(api.estado.resultado === resultado && api.estado.resultado.agregada === muestras);
  igual(api.estado.seleccion, { reglaId: 'r5', puntoIndice: 317 });
  cierto(resultado.pasos[0].descripcion.includes('Experiencia = 5 puntos'));
});

prueba('Editar matemática invalida resultado y resaltados; un modelo inválido conserva el último válido', () => {
  const { api } = entorno();
  api.evaluar();
  api.seleccionarRegla('r5');
  const modelo = clon(api.estado.modelo);
  modelo.reglas[4].peso = 0.75;
  cierto(api.aplicarModelo(modelo).cambioMatematico);
  igual(api.estado.resultado, null);
  cierto(api.estado.pendiente);
  igual(api.estado.seleccion, { reglaId: null, puntoIndice: null });
  const valido = api.estado.modelo;
  modelo.entradas[0].conjuntos[0].parametros = [4, 3, 2, 1];
  cierto(!api.aplicarModelo(modelo).ok);
  cierto(api.estado.modelo === valido);
});

prueba('Rango nuevo deja valor fuera de dominio pendiente sin limitar ni sustituirlo silenciosamente', () => {
  const { api, c } = entorno();
  const modelo = clon(api.estado.modelo);
  modelo.entradas[0].min = 6;
  modelo.entradas[0].max = 10;
  modelo.entradas[0].conjuntos = c.DifusaModelo.distribuirConjuntos(modelo.entradas[0], 3);
  delete modelo.valoresIniciales.familiaridad;
  cierto(api.aplicarModelo(modelo).ok);
  igual(api.estado.valores.familiaridad, null);
  lanza(() => api.evaluar());
  cierto(api.actualizarValor('familiaridad', 7.123456789).ok);
  igual(api.estado.valores.familiaridad, 7.123456789);
  cierto(Number.isFinite(api.evaluar().centroide.valor));
});

prueba('Campo inválido no se convierte en cero ni sustituye el valor válido y obliga a corregirlo', () => {
  const { api } = entorno();
  api.evaluar();
  ['', 'abc', '3.2resto', '1,2.3', NaN, Infinity, 10.001].forEach(valor => {
    cierto(!api.actualizarValor('familiaridad', valor).ok);
    igual(api.estado.valores.familiaridad, 5);
    igual(api.estado.resultado, null);
    lanza(() => api.evaluar());
    cierto(api.actualizarValor('familiaridad', 5).ok);
  });
  cerca(api.evaluar().centroide.valor, 50);
});

prueba('Crear sistema permite guardar el borrador, pero exige reglas completas para evaluar', () => {
  const { api, c } = entorno();
  api.crearSistema();
  cierto(c.DifusaModelo.validar(api.estado.modelo, { permitirBorradores: true }).valido);
  cierto(!c.DifusaModelo.validar(api.estado.modelo, { permitirBorradores: true }).listo);
  lanza(() => api.evaluar());
  const exportado = api.exportarTrabajo('Borrador');
  cierto(api.importarTrabajo(JSON.stringify(exportado)).ok);
  cierto(api.guardarTrabajo('Borrador').ok);
});

prueba('JSON de trabajo restaura modelo y valores y distingue la comparación numérica', () => {
  const { api } = entorno();
  api.cargarEjemplo('ventilacion');
  const id = api.estado.modelo.entradas[0].id;
  const v = api.estado.modelo.entradas[0];
  api.actualizarValor(id, v.min + (v.max - v.min) * 0.4);
  api.cambiarVista('evaluar');
  const exportado = api.exportarTrabajo('Ventilación de prueba');
  cierto(!JSON.stringify(exportado).includes('recortada'));
  api.cargarEjemplo('ayuda');
  cierto(api.importarTrabajo(JSON.stringify(exportado)).ok);
  igual(api.estado.modelo, exportado.modelo);
  igual(api.estado.valores, exportado.valores);
  igual(api.estado.vista, 'evaluar');
  igual(api.estado.resultado, null);
  cierto(!api.importarTrabajo({ version: 1, tipo: 'comparacion-numerica', casos: [] }).ok);
});

prueba('Importación inválida conserva ejercicio, resultado, selección, historial y autoguardado', () => {
  const { api, almacenamiento } = entorno();
  const resultado = api.evaluar();
  api.seleccionarRegla('r5');
  api.seleccionarPunto(500);
  api.estado.historial = ['conservar'];
  const antes = JSON.stringify(api.estado);
  const disco = almacenamiento.valores.get(ACTUAL);
  const casos = ['{', 'null', '[]', '{}', 'x'.repeat(1000001)];
  const trabajo = api.exportarTrabajo();
  const cambiar = fn => { const copia = clon(trabajo); fn(copia); casos.push(copia); };
  cambiar(t => { t.valores.familiaridad = '5'; });
  cambiar(t => { t.valores.familiaridad = Infinity; });
  cambiar(t => { t.modelo.entradas.push(...Array(4).fill(t.modelo.entradas[0])); });
  cambiar(t => { t.modelo.reglas[0].consecuente = 'inexistente'; });
  cambiar(t => { t.modelo.nombre = 'x'.repeat(41); });
  cambiar(t => { t.modelo.salida.conjuntos[0].parametros[0] = NaN; });
  cambiar(t => { t.vista = 'no-existe'; });
  cambiar(t => { t.modelo.entradas[0].id = '__proto__'; });
  casos.forEach(caso => {
    cierto(!api.importarTrabajo(caso).ok);
    igual(JSON.stringify(api.estado), antes);
    cierto(api.estado.resultado === resultado);
    igual(almacenamiento.valores.get(ACTUAL), disco);
  });
});

prueba('Guardar, listar, actualizar, cargar, renombrar y eliminar trabajos conservan su independencia', () => {
  const { api, almacenamiento } = entorno();
  api.actualizarValor('familiaridad', 2);
  const guardado = api.guardarTrabajo('  Ayuda de clase  ');
  cierto(guardado.ok && guardado.persistido);
  igual(api.listarTrabajos()[0].nombre, 'Ayuda de clase');
  const lista = api.listarTrabajos(); lista[0].nombre = 'no mutar biblioteca';
  igual(api.listarTrabajos()[0].nombre, 'Ayuda de clase');
  api.actualizarValor('familiaridad', 8);
  cierto(api.guardarTrabajo('Caso actualizado', guardado.id).ok);
  igual(api.listarTrabajos().length, 1);
  cierto(api.renombrarTrabajo(guardado.id, 'Nuevo nombre').ok);
  api.cargarEjemplo('propina');
  cierto(api.cargarTrabajo(guardado.id).ok);
  igual(api.estado.valores.familiaridad, 8);
  const nuevaSesion = entorno(almacenamiento).api;
  igual(nuevaSesion.listarTrabajos()[0].nombre, 'Nuevo nombre');
  cierto(nuevaSesion.eliminarTrabajo(guardado.id).ok);
  igual(nuevaSesion.listarTrabajos(), []);
  cierto(!nuevaSesion.cargarTrabajo(guardado.id).ok);
  igual(almacenamiento.valores.get('otro-modulo.v1'), 'conservar');
});

prueba('Biblioteca incompatible se conserva y los nuevos trabajos se identifican como temporales', () => {
  const original = '{biblioteca incompatible';
  const { api, almacenamiento } = entorno(memoria({ [TRABAJOS]: original }));
  igual(api.listarTrabajos(), []);
  const temporal = api.guardarTrabajo('Temporal');
  cierto(temporal.ok && !temporal.persistido);
  igual(almacenamiento.valores.get(TRABAJOS), original);
  cierto(api.cargarTrabajo(temporal.id).ok);
});

prueba('Límites de nombres y biblioteca rechazan acciones sin modificar trabajos existentes', () => {
  const { api } = entorno();
  cierto(!api.guardarTrabajo(' ').ok);
  cierto(!api.guardarTrabajo('x'.repeat(41)).ok);
  for (let i = 0; i < 50; i++) cierto(api.guardarTrabajo('Caso ' + i).ok);
  cierto(!api.guardarTrabajo('Excedido').ok);
  const antes = api.listarTrabajos();
  cierto(!api.renombrarTrabajo(antes[0].id, '').ok);
  cierto(!api.eliminarTrabajo('inexistente').ok);
  igual(api.listarTrabajos(), antes);
});

if (!informe('Lógica difusa: estado, migración y trabajos')) process.exitCode = 1;
