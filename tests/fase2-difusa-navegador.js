/* Escenarios propios de H-03/H-08 sobre el servidor indicado. Sin capturas,
 * instalaciones ni acceso a perfiles personales. Edge/Puppeteer ya instalados. */
'use strict';
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = (process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/').replace(/\/?$/, '/');
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let comprobaciones = 0;
const comprobar = (condicion, mensaje) => { assert.ok(condicion, mensaje); comprobaciones++; console.log('  OK ' + mensaje); };
async function cuadro(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function pulsar(page, selector, tactil) {
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  if (tactil) await page.tap(selector); else await page.click(selector);
  await cuadro(page);
}
async function escribir(page, selector, valor, tactil) {
  await pulsar(page, selector, tactil);
  await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.type(valor);
  await cuadro(page);
}
async function cancelarBorrador(page, tactil) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('#vista-variables button')].find(e => e.textContent === 'Cancelar cambios');
    b.dataset.qaCancelar = '';
  });
  await pulsar(page, '[data-qa-cancelar]', tactil);
}
async function escenario(browser, ancho, tema, tactil) {
  const contexto = await browser.createBrowserContext(), page = await contexto.newPage(), errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) errores.push(r.status() + ' ' + r.url()); });
  await page.setViewport({ width: ancho, height: 860, isMobile: tactil, hasTouch: tactil });
  await page.evaluateOnNewDocument(tema => { localStorage.setItem('ui.tema.v1', tema); }, tema);
  try {
    await page.goto(BASE + 'logica-difusa.html?intro=no', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => typeof DifusaEditor !== 'undefined' && typeof DifusaEstado !== 'undefined');
    console.log('\nDifusa ' + ancho + ' px / ' + tema + (tactil ? ' / táctil' : ' / ratón'));
    comprobar(await page.evaluate(tema => document.documentElement.dataset.tema === tema, tema), 'Tema aplicado');
    const aplicado = await page.evaluate(() => JSON.stringify(DifusaEstado.estado.modelo));
    await pulsar(page, '.difusa-etapas [data-vista="variables"]', tactil);
    await escribir(page, '#minVariableDifusa', 'texto', tactil);
    await pulsar(page, '.difusa-etapas [data-vista="reglas"]', tactil);
    await pulsar(page, '#generarCombinacionesDifusa', tactil);
    const invalido = await page.evaluate(() => ({
      conserva: JSON.stringify(DifusaEstado.estado.modelo), variableVisible: !document.getElementById('vista-variables').hidden,
      error: document.getElementById('minVariableDifusa-error').textContent,
      aria: document.getElementById('minVariableDifusa').getAttribute('aria-invalid'),
      foco: document.activeElement.id, dialogo: document.getElementById('dialogoFondo') && !document.getElementById('dialogoFondo').hidden
    }));
    comprobar(invalido.conserva === aplicado && invalido.variableVisible && invalido.error && invalido.aria === 'true' && invalido.foco === 'minVariableDifusa' && !invalido.dialogo,
      'H-08: generar inválido conserva aplicado, muestra campo/error visible y enfoca su corrección');
    await page.keyboard.press('Tab');
    comprobar(await page.evaluate(() => document.activeElement.id !== 'minVariableDifusa'), 'Tab continúa desde el campo inválido');
    await cancelarBorrador(page, tactil);
    await pulsar(page, '.difusa-etapas [data-vista="reglas"]', tactil);
    await pulsar(page, '#generarCombinacionesDifusa', tactil);
    await page.waitForSelector('#dialogoFondo:not([hidden])');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#dialogoFondo', { hidden: true });
    comprobar(await page.evaluate(aplicado => JSON.stringify(DifusaEstado.estado.modelo) === aplicado && !DifusaEditor.tieneBorradores(), aplicado), 'Escape cancela generación válida sin cambiar el modelo');

    // Preparación mediante la API validada; la introducción del valor y la
    // evaluación posterior se realizan con los controles reales del módulo.
    await page.evaluate(() => {
      const modelo = DifusaModelo.crearEjemplo('ventilacion');
      modelo.salida.conjuntos[1].parametros = [0.01, 0.02, 0.03];
      const validacion = DifusaEstado.aplicarModelo(modelo);
      if (!validacion.ok) throw new Error(JSON.stringify(validacion.errores));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await pulsar(page, '.difusa-etapas [data-vista="evaluar"]', tactil);
    await escribir(page, '#valor-temperatura', '20', tactil);
    await pulsar(page, '#evaluarDifusa', tactil);
    await page.waitForFunction(() => DifusaEstado.estado.resultado !== null && !document.getElementById('vista-resultado').hidden);
    const estrecho = await page.evaluate(() => {
      const r = DifusaEstado.estado.resultado;
      return { valor: r.centroide.valor, area: r.centroide.denominador, muestrasCero: r.agregada.every(x => x === 0),
        tramos: r.tramos, alto: document.querySelector('#graficaSalida .difusa-agregada-linea').getBBox().height,
        aria: document.querySelector('#graficaSalida desc').textContent, procedimiento: document.getElementById('calculoCentroide').textContent,
        texto: document.getElementById('resumenResultado').textContent };
    });
    comprobar(Math.abs(estrecho.valor - 0.02) < 1e-12 && Math.abs(estrecho.area - 0.01) < 1e-12 && estrecho.muestrasCero,
      'H-03: resultado 0.02 con área0.01 pese a consultas uniformes de masa cero');
    comprobar(estrecho.tramos.some(t => t.x0 === 0.01 && t.x1 === 0.02 && t.y1 === 1) && estrecho.alto > 170 && estrecho.aria.includes('centroide continuo'),
      'La gráfica y su descripción conservan nudos/altura de la envolvente estrecha');
    comprobar(estrecho.procedimiento.includes('1001') && estrecho.procedimiento.includes('no determinan el centroide') && !estrecho.texto.includes('Sin reglas activas'),
      'Resumen y procedimiento distinguen muestras auxiliares de la integral válida');
    const respuestaAlgo = await page.evaluate(() => AlgoContexto.ayudaLocal('¿Cómo interpreto resultados?', AlgoContexto.obtener()));
    comprobar(respuestaAlgo.includes('Centroide continuo') && !respuestaAlgo.includes('Sin reglas activas'), 'Algo explica el mismo centroide continuo sin diagnosticar ausencia de reglas');
    await pulsar(page, '#panelMapaDifusa > summary', tactil);
    await pulsar(page, '#generarMapaDifusa', tactil);
    await page.waitForFunction(() => !DifusaMapa.activo() && document.getElementById('estadoMapaDifusa').textContent.includes('Diagnósticos:'), { timeout: 30000 });
    comprobar(await page.$eval('#estadoMapaDifusa', e => e.textContent.includes('centroide continuo') && e.textContent.includes('ok:')), 'Mapa usa la misma política y publica diagnósticos separados');
    const medidas = await page.evaluate(() => {
      const ancho = document.documentElement.clientWidth;
      return { ancho, contenido: document.documentElement.scrollWidth,
        controles: [...document.querySelectorAll('#vista-resultado button:not([disabled]), #vista-resultado input, #vista-resultado select')]
          .filter(e => e.getClientRects().length && (e.getBoundingClientRect().left < -2 || e.getBoundingClientRect().right > ancho + 2)).map(e => e.id),
        leyenda: document.getElementById('leyendaSalidaDifusa').textContent };
    });
    comprobar(medidas.contenido <= medidas.ancho + 2 && !medidas.controles.length && medidas.leyenda.includes('centroide'), 'Controles y leyenda alcanzables sin desbordamiento global');
    comprobar(!errores.length, 'Sin errores JavaScript ni HTTP locales: ' + errores.join('; '));
  } finally { await contexto.close(); }
}
async function breve(browser) {
  const contexto = await browser.createBrowserContext(), page = await contexto.newPage(), errores = [];
  page.on('pageerror', error => errores.push(error.message));
  page.on('response', respuesta => { if (respuesta.url().startsWith(BASE) && respuesta.status() >= 400) errores.push(respuesta.status() + ' ' + respuesta.url()); });
  await page.setViewport({ width: 360, height: 860, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => localStorage.setItem('ui.tema.v1', 'claro'));
  try {
    await page.goto(BASE + 'logica-difusa.html?intro=no', { waitUntil: 'networkidle0' });
    const aplicada = await page.evaluate(() => {
      const modelo = DifusaModelo.crearEjemplo('ventilacion');
      modelo.salida.conjuntos[1].parametros = [0.01, 0.02, 0.03];
      const validacion = DifusaEstado.aplicarModelo(modelo);
      return validacion.ok && validacion.listo;
    });
    comprobar(aplicada, 'Drop: API valida y aplica la red de salida estrecha');
    await page.reload({ waitUntil: 'networkidle0' });
    await pulsar(page, '.difusa-etapas [data-vista="evaluar"]', true);
    await escribir(page, '#valor-temperatura', '20', true);
    await pulsar(page, '#evaluarDifusa', true);
    await page.waitForFunction(() => DifusaEstado.estado.resultado && !document.getElementById('vista-resultado').hidden);
    const salida = await page.evaluate(() => {
      const r = DifusaEstado.estado.resultado;
      return { valor: r.centroide.valor, area: r.centroide.denominador, muestrasCero: r.agregada.every(x => x === 0),
        texto: document.getElementById('resumenResultado').textContent,
        nudo: r.tramos.some(t => t.x0 === 0.01 && t.x1 === 0.02 && t.y1 === 1),
        altura: document.querySelector('#graficaSalida .difusa-agregada-linea').getBBox().height,
        descripcion: document.querySelector('#graficaSalida desc').textContent };
    });
    comprobar(Math.abs(salida.valor - 0.02) < 1e-12 && !salida.texto.includes('Sin reglas activas'), 'Drop: Evaluar y Resultado muestran centroide0.02 válido');
    comprobar(Math.abs(salida.area - 0.01) < 1e-12 && salida.muestrasCero, 'Drop: área0.01 procede de la integral aunque las1001 consultas sean cero');
    comprobar(salida.nudo && salida.altura > 170 && salida.descripcion.includes('centroide continuo'), 'Drop: SVG conserva nudos/altura y descripción accesible de la curva estrecha');
    const algo = await page.evaluate(() => AlgoContexto.ayudaLocal('¿Cómo interpreto resultados?', AlgoContexto.obtener()));
    comprobar(algo.includes('Centroide continuo') && !algo.includes('Sin reglas activas'), 'Drop: Algo explica el mismo centroide continuo');
    comprobar(!errores.length, 'Drop: sin errores JavaScript/HTTP locales ' + errores.join('; '));
  } finally { await contexto.close(); }
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    if (process.argv.includes('--breve')) await breve(browser);
    else {
      await escenario(browser, 1280, 'oscuro', false);
      await escenario(browser, 360, 'claro', true);
    }
    console.log('\nDifusa navegador: ' + comprobaciones + ' comprobaciones correctas. Sin capturas.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
