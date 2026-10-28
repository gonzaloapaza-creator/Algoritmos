/* Regresiones de Devin en Edge real, sin capturas.
 * node tests/regresiones-navegador.js
 * Reutiliza el servidor local y puppeteer-core de %TEMP%/grafo-e2e. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const directorio = fs.mkdtempSync(path.join(os.tmpdir(), 'algoritmos-regresiones-'));
const archivos = [];
let correctas = 0;

async function importarInvalido(page, selector, datos, fragmento, instantanea) {
  const antes = await page.evaluate(instantanea);
  await page.evaluate(() => document.querySelectorAll('#avisos > *, #toastStack > *').forEach(e => e.remove()));
  const archivo = path.join(directorio, 'invalido-' + archivos.length + '.json');
  fs.writeFileSync(archivo, JSON.stringify(datos));
  archivos.push(archivo);
  const [selectorArchivo] = await Promise.all([page.waitForFileChooser(), page.click(selector)]);
  await selectorArchivo.accept([archivo]);
  await page.waitForFunction(texto => [...document.querySelectorAll('#avisos, #toastStack')]
    .some(e => e.textContent.includes('Error al importar:') && e.textContent.includes(texto)), {}, fragmento);
  assert.equal(await page.evaluate(instantanea), antes, 'La importación inválida alteró el trabajo abierto');
  assert.equal(await page.$eval('#dialogoFondo', e => !e.hidden).catch(() => false), false,
    'Un archivo inválido no debe pedir reemplazar datos');
  correctas++;
  console.log('  ✓ JSON inválido preserva el trabajo: ' + fragmento);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const errores = [];
  const pagina = async modulo => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    page.setDefaultTimeout(7000);
    page.on('pageerror', error => errores.push(modulo + ': ' + error.message));
    await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'domcontentloaded' });
    return page;
  };
  try {
    let page = await pagina('johnson');
    await page.click('#btnEjemplos');
    await page.click('#ejemplosLista button');
    await page.waitForFunction(() => estado.nodos.length === 5);
    const grafo = await page.evaluate(() => instantaneaGrafo());
    const repetido = JSON.parse(JSON.stringify(grafo)); repetido.nodos[1].id = repetido.nodos[0].id;
    await page.click('#btnMasOpciones');
    await importarInvalido(page, '#btnImportarJSON', { version: '1.0', grafo: repetido }, 'repetido',
      () => JSON.stringify({ grafo: instantaneaGrafo(), historial: estado.historial }));
    if (!(await page.$eval('#btnMasOpciones', e => e.getAttribute('aria-expanded') === 'true'))) await page.click('#btnMasOpciones');
    await importarInvalido(page, '#btnImportarJSON', { version: '99', grafo }, 'Versión',
      () => JSON.stringify({ grafo: instantaneaGrafo(), historial: estado.historial }));
    await page.close();

    page = await pagina('asignacion');
    const modelo = await page.evaluate(() => estadoAsignacion.modelo);
    const roto = JSON.parse(JSON.stringify(modelo)); roto.valores['r_inexistente|t_inexistente'] = 4;
    await importarInvalido(page, '#btnImportarAsignacion', { version: 2, modelo: roto }, 'existentes',
      () => JSON.stringify({ datos: serializarAsignacion(), historial: estadoAsignacion.historial, resultado: estadoAsignacion.resultado }));
    await importarInvalido(page, '#btnImportarAsignacion', { version: 99, values: [[1]], labelsRows: ['A'], labelsCols: ['B'] }, 'Versión',
      () => JSON.stringify({ datos: serializarAsignacion(), historial: estadoAsignacion.historial, resultado: estadoAsignacion.resultado }));
    await page.click('#pasosAsignacion [data-vista="matriz"]');
    await page.click('#vistaMatriz [data-accion="resolver"]');
    await page.waitForFunction(() => resultadoVigenteAsignacion());
    assert.equal(await page.evaluate(() => estadoAsignacion.resultado.datos.total), 26);
    const calculoAsignacion = await page.evaluate(() => JSON.stringify(estadoAsignacion.resultado));
    await page.click('#pasosAsignacion [data-vista="grafo"]');
    await page.click('#svgAsignacion .nodo-b.recurso');
    await page.click('#panelSeleccionAcciones button');
    await page.waitForSelector('#dialogoInput', { visible: true });
    await page.click('#dialogoInput', { clickCount: 3 });
    await page.type('#dialogoInput', 'Persona renombrada');
    await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
    await page.click('#dialogoAceptar');
    await page.waitForFunction(() => estadoAsignacion.modelo.recursos[0].nombre === 'Persona renombrada');
    assert.equal(await page.evaluate(() => JSON.stringify(estadoAsignacion.resultado)), calculoAsignacion,
      'Renombrar debe conservar el cálculo y su vigencia');
    await page.click('#pasosAsignacion [data-vista="resultado"]');
    assert.match(await page.$eval('#listaAsignacion', e => e.textContent), /Persona renombrada/);
    await page.click('#pasosAsignacion [data-vista="procedimiento"]');
    await page.click('#procedimientoLista li:last-child button');
    assert.match(await page.$eval('#procedimientoTexto', e => e.textContent), /Persona renombrada/);
    correctas++;
    console.log('  ✓ Asignación: renombrar desde el grafo actualiza resultado y paso final, total 26 intacto');
    await page.close();

    page = await pagina('northwest');
    const transporte = await page.evaluate(() => estadoNorthwest.modelo);
    const fueraRango = JSON.parse(JSON.stringify(transporte)); fueraRango.origenes[0].oferta = -1;
    await importarInvalido(page, '#btnImportarNw', { version: 1, modelo: fueraRango }, 'oferta',
      () => JSON.stringify({ modelo: estadoNorthwest.modelo, historial: estadoNorthwest.historial, resultado: estadoNorthwest.resultado }));
    await importarInvalido(page, '#btnImportarNw', Object.assign({ version: 99 }, transporte), 'Versión',
      () => JSON.stringify({ modelo: estadoNorthwest.modelo, historial: estadoNorthwest.historial, resultado: estadoNorthwest.resultado }));
    await page.click('#pasosNorthwest [data-vista="balanceo"]');
    await page.click('#btnConfirmarBalanceo');
    const calculoNorthwest = await page.evaluate(() => JSON.stringify(estadoNorthwest.resultado.datos));
    await page.click('#pasosNorthwest [data-vista="datos"]');
    const nombre = '#tablaDatosNorthwest input[aria-label^="Nombre del origen"]';
    await page.click(nombre, { clickCount: 3 });
    await page.type(nombre, 'Planta renombrada');
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => estadoNorthwest.modelo.origenes[0].nombre === 'Planta renombrada');
    assert.equal(await page.evaluate(() => JSON.stringify(estadoNorthwest.resultado.datos)), calculoNorthwest);
    assert.ok(await page.evaluate(() => resultadoVigenteNorthwest()));
    await page.click('#pasosNorthwest [data-vista="resultado"]');
    assert.match(await page.$eval('#nwEnvios', e => e.textContent), /Planta renombrada/);
    await page.click('#pasosNorthwest [data-vista="resolucion"]');
    assert.match(await page.$eval('#nwPasoDetalle', e => e.textContent), /Planta renombrada/);
    correctas++;
    console.log('  ✓ Northwest: editar el nombre actualiza envíos y procedimiento conservando cantidades y costo');
    await page.close();

    page = await pagina('arboles');
    await page.click('#btnEjemploInsercion');
    await page.select('#selectorRecorrido', 'postorden');
    for (let i = 0; i < 3; i++) await page.click('#btnRecorridoSiguiente');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.evaluate(() => {
        document.getElementById('btnRecorridoSiguiente').click();
        if (temporizadorGuardadoArboles === null) throw new Error('No se ejercitó un guardado pendiente');
        if (JSON.parse(localStorage.getItem(ARBOLES_STORAGE_KEY)).pasoRecorrido === estadoArboles.pasoRecorrido) {
          throw new Error('La escritura ya terminó: falta ejercitar la salida antes de 400 ms');
        }
        location.assign('index.html?intro=no');
      })
    ]);
    await page.goto(BASE + 'arboles.html?intro=no', { waitUntil: 'domcontentloaded' });
    assert.deepEqual(await page.evaluate(() => ({ recorrido: estadoArboles.recorridoSeleccionado,
      paso: estadoArboles.pasoRecorrido, reproduciendo: estadoArboles.reproduciendo,
      intervalo: estadoArboles.intervaloRecorrido, secuencia: estadoArboles.secuencia })),
    { recorrido: 'postorden', paso: 4, reproduciendo: false, intervalo: null, secuencia: [5, 3, 1, 4, 7, 11, 8, 15] });
    assert.equal(await page.$eval('#salidaRecorrido', e => e.textContent), '1');
    correctas++;
    console.log('  ✓ Árboles: navegar antes del guardado de 400 ms recupera árbol, postorden y paso 4 en pausa');
    await page.close();

    for (const modulo of ['johnson', 'asignacion', 'northwest', 'ordenamiento', 'arboles']) {
      page = await pagina(modulo);
      const resultado = await page.evaluate(id => {
        const original = Storage.prototype.setItem;
        const guardarActual = () => {
          if (id === 'johnson') guardar();
          else if (id === 'asignacion') guardarAsignacion();
          else if (id === 'northwest') guardarNorthwest();
          else if (id === 'ordenamiento') guardarEstadoOrdenamiento();
          else guardarEstadoArboles();
        };
        try {
          Storage.prototype.setItem = () => { throw new DOMException('Almacenamiento lleno', 'QuotaExceededError'); };
          guardarActual(); guardarActual(); guardarActual();
          const avisos = [...document.querySelectorAll('#avisoAlmacenamiento')];
          const fallo = avisos.length === 1 && avisos[0].getClientRects().length > 0 && estadoAlmacenamientoLocal.fallando;
          Storage.prototype.setItem = original;
          guardarActual();
          return { fallo, recuperado: !estadoAlmacenamientoLocal.fallando && !document.getElementById('avisoAlmacenamiento') };
        } finally { Storage.prototype.setItem = original; }
      }, modulo);
      assert.deepEqual(resultado, { fallo: true, recuperado: true });
      correctas++;
      console.log('  ✓ ' + modulo + ': aviso único y visible tras tres fallos; recuperación al escribir');
      await page.close();
    }
    assert.deepEqual(errores, [], 'Errores JavaScript en el navegador');
    console.log('\n' + correctas + ' regresiones verificadas, sin errores JavaScript.');
  } finally {
    await browser.close();
    archivos.forEach(archivo => fs.unlinkSync(archivo));
    fs.rmdirSync(directorio);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
