/* Smoke dirigido del paquete construido. URL_PRUEBAS=http://127.0.0.1:8124/
 * Solo Northwest/Shell; sin capturas y con Edge/Puppeteer ya instalados. */
'use strict';

const assert = require('assert/strict');
const path = require('path');
const os = require('os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = (process.env.URL_PRUEBAS || 'http://127.0.0.1:8124/').replace(/\/?$/, '/');
let correctas = 0;
const errores = [];
function comprobar(valor, mensaje) { assert.ok(valor, mensaje); correctas++; console.log('✓ ' + mensaje); }
async function clic(page, selector) {
  await page.$eval(selector, e => e.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.click(selector);
}
async function abrir(browser, modulo) {
  const page = await browser.newPage();
  page.on('pageerror', error => errores.push(modulo + ': ' + error.message));
  page.on('response', response => { if (response.url().startsWith(BASE) && /\.js(?:\?|$)/.test(response.url()) && response.status() >= 400) errores.push(modulo + ': JS ' + response.status() + ' ' + response.url()); });
  page.on('requestfailed', request => { if (request.url().startsWith(BASE) && /\.js(?:\?|$)/.test(request.url())) errores.push(modulo + ': JS no cargado ' + request.url()); });
  await page.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => localStorage.clear());
  await page.goto(BASE + modulo + '.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.documentElement.dataset.tema = 'claro');
  if (await page.$('#btnComenzarModulo')) await clic(page, '#btnComenzarModulo');
  return page;
}
async function northwest(browser) {
  const page = await abrir(browser, 'northwest');
  await page.select('#selectorEjemploNw', 'balanceado');
  await clic(page, '#btnEjemploNw');
  await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde > 450);
  await clic(page, '#dialogoAceptar');
  await clic(page, '#pasosNorthwest [data-vista=balanceo]');
  await clic(page, '#btnConfirmarBalanceo');
  await clic(page, '#pasosNorthwest [data-vista=resultado]');
  comprobar(await page.evaluate(() => resultadoVigenteNorthwest() && estadoNorthwest.resultado.datos.costoTotal === 23000 && document.getElementById('nwCostoTotal').textContent.includes('230')), 'Construido Northwest: ejemplo cargado por botones y costo inicial 230');
  await clic(page, '#pasosNorthwest [data-vista=datos]');
  const entrada = '#tablaDatosNorthwest [data-tipo=costo]';
  await clic(page, entrada); await page.$eval(entrada, e => e.select()); await page.keyboard.type('abc'); await page.keyboard.press('Tab');
  await clic(page, '#pasosNorthwest [data-vista=resultado]');
  comprobar(await page.evaluate(() => !resultadoVigenteNorthwest() && resultadoConsultableNorthwest() && document.getElementById('nwCostoTotal').textContent.includes('Último cálculo válido; hay datos pendientes de corregir') && document.getElementById('btnConfirmarBalanceo').disabled), 'Construido Northwest: entrada inválida conserva último cálculo rotulado y bloquea resolver');
  comprobar(await page.evaluate(() => !!window.AlgoContexto && !!window.AlgoMotor && !AlgoContexto.obtener().contexto.resultadoVigente), 'Construido Northwest: scripts y adaptador Algo activos con estado pendiente');
  comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Construido Northwest: resultado móvil claro sin desbordamiento de página');
  await page.close();
}
async function shell(browser) {
  const page = await abrir(browser, 'ordenamiento');
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length);
  await clic(page, '[data-algoritmo=shell]');
  const valores = Array.from({ length: 200 }, (_, i) => 99 - i % 99);
  await clic(page, '#entradaValores'); await page.$eval('#entradaValores', e => e.select()); await page.keyboard.type(valores.join(','));
  await clic(page, '#btnAplicar');
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.valores.length === 200 && estadoOrdenamiento.historial.length);
  await clic(page, '#btnFinalOrdenamiento');
  const final = await page.evaluate(() => ({ valores: obtenerPasoOrdenamiento(estadoOrdenamiento.registro, estadoOrdenamiento.pasoActual).arreglo.map(p => p.valor), terminado: estadoOrdenamiento.pasoActual === estadoOrdenamiento.historial.length - 1 && !estadoOrdenamiento.reproduciendo }));
  comprobar(final.terminado && JSON.stringify(final.valores) === JSON.stringify(valores.slice().sort((a, b) => a - b)), 'Construido Shell: prepara 200 valores y llega al resultado correcto con Ir al final');
  comprobar(await page.$eval('#duracionReproduccion', e => e.textContent.includes('no tiempo de cálculo')), 'Construido Shell: estimación identifica duración de reproducción');
  comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Construido Shell: lista móvil usa desplazamiento interno sin desbordar la página');
  await page.close();
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-first-run', '--disable-gpu'] });
  try {
    await northwest(browser); await shell(browser);
    comprobar(errores.length === 0, 'Construido Northwest/Shell: cero excepciones de página y cero scripts fallidos' + (errores.length ? ': ' + errores.join('; ') : ''));
    console.log(`${correctas} comprobaciones dirigidas correctas sobre ${BASE}; sin capturas.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
