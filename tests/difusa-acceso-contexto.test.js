/* Contextos informativos de Algo: no editor, almacenamiento, MATLAB ni red. */
'use strict';
const assert = require('node:assert/strict');
const { crearContexto, cargar } = require('./cargar');

for (const pagina of ['opciones', 'matlab']) {
  const c = crearContexto();
  c.window = c;
  c.document = { body: { dataset: { modulo: 'difusa', difusaPagina: pagina } }, getElementById: () => null };
  c.localStorage = { getItem: () => { throw new Error('No leer trabajos'); }, setItem: () => { throw new Error('No escribir trabajos'); } };
  c.fetch = () => { throw new Error('No consultar servicios'); };
  Object.defineProperty(c, 'DifusaEstado', { get: () => { throw new Error('No exigir el editor'); } });
  cargar(c, ['js/comun/asistente-contexto.js', 'js/comun/conocimiento/base.js', 'js/difusa/conocimiento-acceso.js', 'js/comun/asistente-motor.js']);
  const foto = c.AlgoContexto.obtener();
  assert.equal(foto.modulo, 'difusa');
  assert.equal(foto.contexto.datos.paginaAcceso, pagina);
  assert.equal(foto.contexto.resultado, null);
  assert.equal(foto.contexto.paso, null);
  assert.equal(foto.contexto.resultadoVigente, false);
  assert.equal(c.AlgoContexto.interno.estadoContexto(foto), 'informacion');
  assert.equal(c.AlgoContexto.sugeridas(foto).length, 3);
  const casos = [
    ['¿Qué ofrece cada versión?', /navegador[\s\S]*MATLAB Online/],
    ['¿Cómo regreso al selector?', /sin repetir el video/],
    ['¿Cómo abro el ejemplo de ventilación?', /ZIP[\s\S]*tres archivos[\s\S]*abrir_ventilacion\.m/],
    ['¿Cómo creo un sistema nuevo en MATLAB?', /Custom FIS[\s\S]*Mamdani Type-1/],
    ['¿Qué comandos uso?', /fuzzyLogicDesigner\('ventilacion_aula\.fis'\)/],
    ['¿Cómo uso Rule Inference y Control Surface?', /Input values[\s\S]*Reference Inputs[\s\S]*NaN/],
    ['¿Cómo guardo mi sistema?', pagina === 'matlab' ? /Design → Save[\s\S]*Download/ : /trabajos web/],
    ['No se encuentra el archivo .fis', /nombre y ubicaci[oó]n[\s\S]*junto al \.m/],
    ['¿Puedes ejecutar MATLAB y consultar mi resultado?', /no ejecuta MATLAB[\s\S]*no consulta tu sesi[oó]n privada/]
  ];
  for (const [pregunta, esperado] of casos) {
    const respuesta = c.AlgoMotor.responder(pregunta, foto);
    assert.match(respuesta.texto, esperado, pagina + ': ' + pregunta);
    assert.ok(respuesta.acciones.length > 0);
  }
  for (const tipo of ['paso', 'resultado']) assert.match(c.AlgoMotor.responder('', foto, { tipo }).texto, /no tiene un c[aá]lculo web activo/);
  assert.match(c.AlgoMotor.responder('', foto, { tipo: 'empezar' }).texto, pagina === 'matlab' ? /Descarga el ZIP/ : /eligiendo/);
}
console.log('Algo en selector/MATLAB: contextos sin editor ni trabajos, nueve consultas y acciones por página correctas; sin sesiones privadas ni ejecución simulada.');
