/* Cierre de Asignación, Northwest y Árboles en contextos aislados de Edge.
 * node tests/cierre-datos-navegador.js (servidor local activo).
 * No consulta ni borra el almacenamiento del perfil real del usuario. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const descargas = fs.mkdtempSync(path.join(os.tmpdir(), 'algoritmos-cierre-datos-'));
let correctas = 0;

function comprobar(condicion, texto) {
  assert.ok(condicion, texto); correctas++; console.log('  ✓ ' + texto);
}

async function editar(page, modulo, segunda) {
  if (modulo === 'asignacion') await page.click('#btnAgregarRecurso');
  else if (modulo === 'northwest') await page.click('#btnAgregarOrigen');
  else {
    await page.type('#valorNodo', segunda ? '43' : '42');
    await page.click('#formInsertar button[type="submit"]');
  }
}

async function aceptarDialogo(page, aceptar) {
  await page.waitForSelector('#dialogoFondo', { visible: true });
  await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
  await page.click(aceptar ? '#dialogoAceptar' : '#dialogoCancelar');
  await page.waitForSelector('#dialogoFondo', { hidden: true });
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const errores = [];
  const abrir = async (modulo, contexto) => {
    const page = await contexto.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    page.setDefaultTimeout(8000);
    page.on('pageerror', error => errores.push(modulo + ': ' + error.message));
    await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'domcontentloaded' });
    return page;
  };
  try {
    for (const modulo of ['asignacion', 'northwest', 'arboles']) {
      const contexto = await browser.createBrowserContext();
      const page = await abrir(modulo, contexto);
      const { clave, crudo } = await page.evaluate(modulo => {
        let clave, datos;
        if (modulo === 'asignacion') {
          clave = ASIGNACION_STORAGE_KEY_V2; datos = serializarAsignacion();
          datos.modelo.valores['fantasma|tarea'] = 1;
        } else if (modulo === 'northwest') {
          clave = NORTHWEST_STORAGE_KEY; datos = { version: 1, modelo: estadoNorthwest.modelo };
          datos.modelo.origenes[0].oferta = -1;
        } else {
          clave = ARBOLES_STORAGE_KEY; datos = { version: 1, modo: 'busqueda', secuencia: [1, 1] };
        }
        const crudo = JSON.stringify(datos); localStorage.setItem(clave, crudo);
        return { clave, crudo };
      }, modulo);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.aviso-almacenamiento button');
      comprobar(await page.evaluate(clave => !permiteEscrituraGuardado(clave), clave), modulo + ': autoguardado inválido bloqueado');
      await editar(page, modulo, false);
      assert.equal(await page.evaluate(clave => localStorage.getItem(clave), clave), crudo);
      comprobar(await page.$eval('.aviso-almacenamiento button:last-of-type', boton => boton.disabled), modulo + ': editar conserva original y exige descargar antes de habilitar');

      const sesion = await page.createCDPSession();
      await sesion.send('Browser.setDownloadBehavior', { behavior: 'allow', browserContextId: contexto.id, downloadPath: descargas });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.click('.aviso-almacenamiento button:first-of-type');
      const archivo = path.join(descargas, clave.replace(/[^a-z0-9.-]/gi, '-') + '-original.json');
      for (let intento = 0; intento < 160 && !fs.existsSync(archivo); intento++) await new Promise(resolve => setTimeout(resolve, 25));
      assert.equal(fs.readFileSync(archivo, 'utf8'), crudo, 'La descarga debe conservar exactamente el original');
      await page.waitForFunction(() => !document.querySelector('.aviso-almacenamiento button:last-of-type').disabled);
      await page.click('.aviso-almacenamiento button:last-of-type');
      await editar(page, modulo, true);
      comprobar(await page.evaluate(({ clave, crudo }) => permiteEscrituraGuardado(clave) && localStorage.getItem(clave) !== crudo, { clave, crudo }), modulo + ': descarga exacta y decisión explícita recuperan el autoguardado');
      await page.reload({ waitUntil: 'domcontentloaded' });
      comprobar(await page.$$eval('.aviso-almacenamiento', avisos => avisos.length === 0), modulo + ': nuevo guardado válido se recupera tras recargar');
      await contexto.close();
    }

    let contexto = await browser.createBrowserContext();
    let page = await abrir('index', contexto);
    const antiguo = JSON.stringify({ rows: 2, cols: 2, objective: 'max', labelsRows: ['Ana', 'Ana'], labelsCols: ['X', 'Y'], values: [[1, 2.5], [3, 4]] });
    await page.evaluate(texto => localStorage.setItem('asignacion.v1', texto), antiguo);
    await page.goto(BASE + 'asignacion.html?intro=no', { waitUntil: 'domcontentloaded' });
    const migrado = await page.evaluate(() => ({ matriz: matrizDelModelo(estadoAsignacion.modelo), nombres: estadoAsignacion.modelo.recursos.map(r => r.nombre), objetivo: estadoAsignacion.objetivo, original: localStorage.getItem('asignacion.v1') }));
    assert.deepEqual(migrado, { matriz: [[1, null], [3, 4]], nombres: ['Ana', 'Ana (2)'], objetivo: 'max', original: antiguo });
    comprobar(true, 'Asignación: migración compatible conserva original y distingue pendientes de cero');
    await page.$eval('#svgAsignacion .nodo-b', nodo => nodo.focus()); await page.keyboard.press('Enter');
    comprobar(await page.evaluate(() => document.activeElement.matches('#svgAsignacion .nodo-b') && document.activeElement.getAttribute('aria-pressed') === 'true'), 'Asignación: selección con teclado conserva el foco');
    await contexto.close();

    contexto = await browser.createBrowserContext(); page = await abrir('index', contexto);
    const legadoInvalido = JSON.stringify({ version: 1, objective: 'desconocido', values: [[7]] });
    await page.evaluate(texto => localStorage.setItem('asignacion.v1', texto), legadoInvalido);
    await page.goto(BASE + 'asignacion.html?intro=no', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.aviso-almacenamiento button');
    await editar(page, 'asignacion', false);
    const protegido = await page.evaluate(() => ({ original: localStorage.getItem('asignacion.v1'), actual: localStorage.getItem('asignacion.v2'), bloqueado: !permiteEscrituraGuardado('asignacion.v2'), aviso: document.querySelector('.aviso-almacenamiento').textContent }));
    assert.equal(protegido.original, legadoInvalido); assert.equal(protegido.actual, null);
    comprobar(protegido.bloqueado && protegido.aviso.includes('asignacion.v1') && protegido.aviso.includes('objetivo'), 'Asignación V1: objetivo incompatible preserva original y pausa también V2 después de editar');
    const sesionLegado = await page.createCDPSession();
    await sesionLegado.send('Browser.setDownloadBehavior', { behavior: 'allow', browserContextId: contexto.id, downloadPath: descargas });
    const archivoLegado = path.join(descargas, 'asignacion.v2-original.json');
    if (fs.existsSync(archivoLegado)) fs.unlinkSync(archivoLegado);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.click('.aviso-almacenamiento button:first-of-type');
    for (let intento = 0; intento < 160 && !fs.existsSync(archivoLegado); intento++) await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(fs.readFileSync(archivoLegado, 'utf8'), legadoInvalido);
    await page.waitForFunction(() => !document.querySelector('.aviso-almacenamiento button:last-of-type').disabled);
    await page.click('.aviso-almacenamiento button:last-of-type'); await editar(page, 'asignacion', true);
    const recuperado = await page.evaluate(() => ({ original: localStorage.getItem('asignacion.v1'), actual: JSON.parse(localStorage.getItem('asignacion.v2')) }));
    comprobar(recuperado.original === legadoInvalido && recuperado.actual.version === 2 && recuperado.actual.modelo.recursos.length === 6, 'Asignación V1: descarga exacta y decisión explícita crean V2 conservando V1');
    await page.reload({ waitUntil: 'domcontentloaded' });
    comprobar(await page.evaluate(() => estadoAsignacion.modelo.recursos.length === 6 && !document.querySelector('.aviso-almacenamiento')), 'Asignación V1: nueva sesión restaura V2 válido y deja intacto el legado');
    await contexto.close();

    contexto = await browser.createBrowserContext(); page = await abrir('arboles', contexto);
    await page.click('#btnEjemploInsercion');
    const anterior = await page.evaluate(() => JSON.stringify(instantaneaArboles()));
    await page.click('#btnLimpiarArbol'); await aceptarDialogo(page, false);
    assert.equal(await page.evaluate(() => JSON.stringify(instantaneaArboles())), anterior);
    comprobar(true, 'Árboles: cancelar vaciado conserva estructura y recorrido');
    await page.$eval('#vistaArbol [data-valor]', nodo => nodo.focus()); await page.keyboard.press('Enter');
    comprobar(await page.evaluate(() => document.activeElement.matches('#vistaArbol [data-valor]') && document.activeElement.getAttribute('aria-pressed') === 'true'), 'Árboles: seleccionar mantiene foco y selección accesible');
    await page.select('#selectorRecorrido', 'postorden');
    await page.click('#btnRecorridoSiguiente'); await page.click('#btnRecorridoSiguiente');
    await page.reload({ waitUntil: 'domcontentloaded' });
    const restaurado = await page.evaluate(() => ({ recorrido: estadoArboles.recorridoSeleccionado, paso: estadoArboles.pasoRecorrido, play: estadoArboles.reproduciendo }));
    assert.deepEqual(restaurado, { recorrido: 'postorden', paso: 2, play: false });
    comprobar(true, 'Árboles: recargar recupera recorrido y paso con reproducción pausada');
    await contexto.close();
    assert.deepEqual(errores, [], 'Excepciones de JavaScript');
    console.log('\n' + correctas + ' comprobaciones de cierre de datos correctas, sin excepciones JavaScript.');
  } finally {
    await browser.close();
    for (const nombre of fs.readdirSync(descargas)) fs.unlinkSync(path.join(descargas, nombre));
    fs.rmdirSync(descargas);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
