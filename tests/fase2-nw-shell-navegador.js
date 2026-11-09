/* Comprobación dirigida de Northwest y Shell. Sin capturas ni dependencias nuevas. */
'use strict';

const assert = require('assert/strict');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
let correctas = 0;
const errores = [];
function comprobar(valor, mensaje) { assert.ok(valor, mensaje); correctas++; console.log('✓ ' + mensaje); }
async function clic(page, selector) {
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.click(selector);
}
async function escribir(page, selector, texto, tecla = 'Tab') {
  await clic(page, selector); await page.$eval(selector, e => e.select());
  await page.keyboard.type(texto); await page.keyboard.press(tecla);
}
async function abrir(browser, modulo, movil) {
  const page = await browser.newPage();
  page.on('pageerror', e => errores.push(modulo + ': ' + e.message));
  await page.setViewport(movil ? { width: 360, height: 800, isMobile: true, hasTouch: true } : { width: 1366, height: 900 });
  await page.evaluateOnNewDocument(() => localStorage.clear());
  await page.goto(BASE + modulo + '.html', { waitUntil: 'networkidle0' });
  await page.evaluate(tema => document.documentElement.dataset.tema = tema, movil ? 'claro' : 'oscuro');
  if (await page.$('#btnComenzarModulo')) await clic(page, '#btnComenzarModulo');
  return page;
}
async function northwest(browser, movil) {
  const page = await abrir(browser, 'northwest', movil), caso = 'Northwest ' + (movil ? 'móvil claro' : 'escritorio oscuro');
  const claves = await page.$$eval('#tablaDatosNorthwest [data-tipo=costo]', es => es.map(e => e.dataset.claveNw));
  const primero = '[data-clave-nw="' + claves[0] + '"]';
  await escribir(page, primero, '3.75');
  comprobar(await page.evaluate(clave => document.activeElement.dataset.claveNw === clave, claves[1]), caso + ': Tab conserva el siguiente ID de celda');
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  comprobar(await page.evaluate(clave => document.activeElement.dataset.claveNw === clave, claves[0]), caso + ': Mayús+Tab vuelve a la celda por ID');
  await escribir(page, primero, '4.25', 'Enter');
  comprobar(await page.evaluate(clave => document.activeElement.dataset.claveNw === clave, claves[1]), caso + ': Enter confirma y avanza sin perder foco');
  await clic(page, '#pasosNorthwest [data-vista=balanceo]'); await clic(page, '#btnConfirmarBalanceo');
  await clic(page, '#pasosNorthwest [data-vista=resultado]');
  comprobar(await page.$eval('#nwNotas', e => e.textContent.includes('No es necesariamente la de menor costo')), caso + ': conserva advertencia de solución inicial factible');
  const costo = await page.evaluate(() => estadoNorthwest.resultado.datos.costoTotal);
  await clic(page, '#pasosNorthwest [data-vista=datos]'); await escribir(page, primero, '-2');
  comprobar(await page.evaluate(() => !resultadoVigenteNorthwest() && resultadoConsultableNorthwest() && document.getElementById('btnConfirmarBalanceo').disabled), caso + ': texto inválido bloquea recalcular y conserva el cálculo previo');
  await clic(page, '#pasosNorthwest [data-vista=resultado]');
  comprobar(await page.evaluate(c => estadoNorthwest.resultado.datos.costoTotal === c && document.getElementById('nwCostoTotal').textContent.includes('Último cálculo válido; hay datos pendientes de corregir'), costo), caso + ': resultado rotula el último cálculo válido');
  comprobar(await page.evaluate(() => { const c = AlgoContexto.obtener().contexto; return !c.resultadoVigente && c.error.includes('Último cálculo válido; hay datos pendientes de corregir'); }), caso + ': Algo coincide con el estado pendiente');
  await clic(page, '#pasosNorthwest [data-vista=resolucion]');
  comprobar(await page.$eval('#nwPasoIndicador', e => e.textContent.includes('Último cálculo válido; hay datos pendientes de corregir')), caso + ': procedimiento identifica el resultado anterior');
  await clic(page, '#pasosNorthwest [data-vista=datos]');
  await escribir(page, '[data-clave-nw="' + claves[claves.length - 1] + '"]', 'abc');
  const origenes = await page.evaluate(() => estadoNorthwest.modelo.origenes.length);
  await clic(page, '#tablaDatosNorthwest tbody tr:first-child .nw-quitar');
  await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde > 450);
  await clic(page, '#dialogoAceptar');
  await page.waitForFunction(cantidad => estadoNorthwest.modelo.origenes.length === cantidad - 1, {}, origenes);
  const pendientes = await page.evaluate(() => Object.keys(estadoNorthwest.invalidas));
  comprobar(pendientes.length === 1, caso + ': eliminar fila purga sus errores y conserva otro error vigente (' + pendientes.join(',') + ')');
  await clic(page, '#btnDeshacerNw');
  comprobar(await page.evaluate(() => Object.keys(estadoNorthwest.invalidas).length === 2), caso + ': deshacer recupera fila y borradores asociados');
  await clic(page, '#btnRehacerNw');
  comprobar(await page.evaluate(() => Object.keys(estadoNorthwest.invalidas).length === 1), caso + ': rehacer vuelve a purgar incidentes');
  await escribir(page, '[data-clave-nw="' + claves[claves.length - 1] + '"]', '8');
  comprobar(await page.evaluate(() => !hayPendientesNorthwest()), caso + ': corregir el error restante permite resolver');
  comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), caso + ': página sin desbordamiento horizontal');
  await page.close();
}
async function shell(browser, movil) {
  const page = await abrir(browser, 'ordenamiento', movil), caso = 'Shell ' + (movil ? 'móvil claro' : 'escritorio oscuro');
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length > 0);
  await escribir(page, '#entradaValores', '9,8,7,6,5,4,3,2,1', 'Enter');
  await clic(page, '[data-algoritmo=shell]');
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.algoritmo === 'shell');
  const indice = await page.evaluate(() => estadoOrdenamiento.historial.findIndex((e, i) => JSON.stringify(obtenerPasoOrdenamiento(estadoOrdenamiento.registro, i).grupo) === '[0,4,8]'));
  assert.ok(indice >= 0, 'Existe evento de grupo [0,4,8]');
  await clic(page, '#deslizadorPasos'); await page.keyboard.press('Home');
  for (let i = 0; i < indice; i++) await page.keyboard.press('ArrowRight');
  await page.waitForFunction(i => estadoOrdenamiento.pasoActual === i, {}, indice);
  comprobar(await page.$$eval('#grupoShell small', es => es.map(e => e.textContent).join(',') === '0,4,8'), caso + ': auxiliar muestra índices reales [0,4,8]');
  comprobar(await page.$$eval('#grupoShell .auxiliar-pino', es => es.every((e, i) => e.getAttribute('aria-label').includes('Posición ' + [0,4,8][i]))), caso + ': etiquetas accesibles incluyen índices reales');
  const valores = Array.from({ length: 200 }, (_, i) => 99 - i % 99).join(',');
  await escribir(page, '#entradaValores', valores, 'Enter');
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.valores.length === 200);
  await clic(page, '#btnFinalOrdenamiento');
  comprobar(await page.evaluate(() => estadoOrdenamiento.pasoActual === estadoOrdenamiento.historial.length - 1 && !estadoOrdenamiento.reproduciendo), caso + ': Ir al final consulta 200 valores sin reproducir');
  comprobar(await page.$eval('#duracionReproduccion', e => e.textContent.includes('no tiempo de cálculo')), caso + ': duración estimada distingue reproducción y cálculo');
  await clic(page, '#deslizadorPasos'); await page.keyboard.press('Home');
  await page.waitForFunction(() => estadoOrdenamiento.pasoActual === 0);
  await page.keyboard.press('End'); await page.waitForFunction(() => estadoOrdenamiento.pasoActual === estadoOrdenamiento.historial.length - 1);
  comprobar(await page.$eval('#deslizadorPasos', e => e.getAttribute('aria-valuetext').includes('Ordenado')), caso + ': deslizador accesible llega al final por teclado');
  await page.keyboard.press('Home'); await page.waitForFunction(() => estadoOrdenamiento.pasoActual === 0);
  await clic(page, '#btnAuto'); await clic(page, '#btnAuto');
  comprobar(await page.evaluate(() => !estadoOrdenamiento.reproduciendo), caso + ': reproducción se puede pausar de inmediato');
  // Ambos son botones reales; activarlos en el mismo turno garantiza que se comprueba la cancelación durante la preparación cooperativa.
  await page.evaluate(() => { document.querySelector('[data-algoritmo=bubble]').click(); document.getElementById('btnCancelarPreparacion').click(); });
  comprobar(await page.evaluate(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length === 0 && document.getElementById('estadoPreparacion').textContent.includes('cancelada')), caso + ': cancela preparación y conserva los 200 valores');
  comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), caso + ': lista grande usa desplazamiento interno sin desbordar la página');
  await page.close();
}
async function algoNorthwest(browser) {
  const page = await abrir(browser, 'northwest', false);
  await clic(page, '#pasosNorthwest [data-vista=balanceo]'); await clic(page, '#btnConfirmarBalanceo');
  await clic(page, '#pasosNorthwest [data-vista=datos]');
  await escribir(page, '#tablaDatosNorthwest [data-tipo=costo]', 'abc');
  const respuestas = await page.evaluate(() => {
    const foto = AlgoContexto.obtener();
    return [AlgoMotor.responder('', foto, { tipo: 'resultado' }).texto, AlgoMotor.responder('', foto, { tipo: 'paso' }).texto,
      AlgoMotor.responder('', foto, { tipo: 'entrada', id: 'ejercicio.total' }).texto, AlgoMotor.responder('', foto, { tipo: 'entrada', id: 'ejercicio.celda' }).texto];
  });
  respuestas.forEach((texto, indice) => comprobar(texto.includes('Último cálculo válido; hay datos pendientes de corregir'), 'Algo Northwest: respuesta ' + (indice + 1) + ' identifica el cálculo anterior y bloquea el nuevo'));
  comprobar(await page.evaluate(() => !resultadoVigenteNorthwest() && resultadoConsultableNorthwest()), 'Algo Northwest conserva la distinción entre histórico consultable y vigente');
  await page.close();
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-first-run', '--disable-gpu'] });
  try {
    if (process.argv.includes('--solo=algo')) await algoNorthwest(browser);
    else for (const movil of [false, true]) { await northwest(browser, movil); await shell(browser, movil); }
    comprobar(errores.length === 0, 'Sin excepciones de página en Northwest y Shell');
    console.log(`${correctas} comprobaciones dirigidas correctas; sin capturas.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
