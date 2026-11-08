/* Recorrido acotado del ajuste de Johnson. Usa herramientas instaladas, sin capturas. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearServidor } = require('./servidor-local');

function localizar(candidatos) {
  for (const archivo of candidatos.filter(Boolean)) {
    if (fs.existsSync(archivo)) return fs.realpathSync.native(archivo);
  }
  throw new Error('No se encontró una herramienta instalada: ' + candidatos.filter(Boolean).join(', '));
}
let moduloLocal;
try { moduloLocal = require.resolve('puppeteer-core'); } catch (_) { /* Buscar instalación reutilizable. */ }
const modulo = localizar([process.env.PUPPETEER_CORE, moduloLocal,
  path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core', 'lib', 'cjs', 'puppeteer', 'puppeteer-core.js')]);
const edge = localizar([process.env.NAVEGADOR,
  process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe'),
  process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft/Edge/Application/msedge.exe'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft/Edge/Application/msedge.exe')]);
const puppeteer = require(modulo);

(async () => {
  console.log('Puppeteer-core: ' + modulo);
  console.log('Edge: ' + edge);
  const servidor = crearServidor();
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  let browser;
  let comprobaciones = 0;
  const comprobar = (valor, mensaje) => { assert.ok(valor, mensaje); comprobaciones++; console.log('✓ ' + mensaje); };
  try {
    browser = await puppeteer.launch({ executablePath: edge, headless: true, args: ['--no-first-run'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    page.on('console', mensaje => { if (mensaje.type() === 'error') errores.push(mensaje.text()); });
    // Edge solicita favicon aunque la página no lo declare; no forma parte de la aplicación.
    await page.setRequestInterception(true);
    page.on('request', peticion => {
      if (new URL(peticion.url()).pathname === '/favicon.ico') peticion.respond({ status: 204 });
      else peticion.continue();
    });
    await page.goto('http://127.0.0.1:' + servidor.address().port + '/johnson.html?intro=no', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      aplicarEjemploJohnson(ejemploJohnsonPorId('tiempos-holguras'));
      calcularYMostrarJohnson('resultado');
    });
    const leer = svg => page.evaluate(idSvg => {
      const id = estadoJohnson.resultado.ids[estadoJohnson.seleccion.destino];
      const nodo = document.querySelector('#' + idSvg + ' .nodo[data-id="' + id + '"]');
      const textoVisible = e => Array.from(e.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('');
      return {
        valores: Array.from(nodo.querySelectorAll('.jn-nodo-valor')).map(textoVisible),
        rotulos: Array.from(nodo.querySelectorAll('.jn-nodo-leyenda')).map(e => e.textContent),
        leyenda: document.querySelector('#' + idSvg + ' .jn-leyenda-svg').getAttribute('aria-label')
      };
    }, svg);
    const destino = async (svg, valores, rotulos, mensaje) => {
      const actual = await leer(svg);
      assert.deepEqual(actual.valores, valores, mensaje);
      assert.deepEqual(actual.rotulos, rotulos, mensaje);
      comprobar(true, mensaje);
      return actual;
    };
    const original = await page.evaluate(() => JSON.stringify([estado.nodos, estado.conexiones,
      estadoJohnson.resultado.distancias, consultaCaminosJohnson.maximos.distancias]));
    await destino('svgResultadoJn', ['19', '19'], ['Acum.', 'Total'], 'Mínimo activo: B = Acum. 19 | Total 19');
    await page.select('#jnObjetivoRuta', 'maximo');
    await destino('svgResultadoJn', ['58', '58'], ['Acum.', 'Total'], 'Máximo activo: B = Acum. 58 | Total 58');
    await page.click('#jnRutaDetalle [data-ruta-johnson="maximo"]');
    await destino('svgResultadoJn', ['19', '58'], ['mín', 'máx'], 'Desactivar fuera de comparación conserva mínimo/máximo');
    await page.click('#jnCompararRutas');
    let lectura = await destino('svgResultadoJn', ['19', '58'], ['mín', 'máx'], 'Comparación sin ruta única: B = mín 19 | máx 58');
    comprobar(lectura.leyenda.includes('Sin ruta única activa'), 'Leyenda de comparación sin selección');
    await page.click('#jnRutaDetalle [data-ruta-johnson="minimo"]');
    lectura = await destino('svgResultadoJn', ['19', '19'], ['Acum.', 'Total'], 'Activar mínimo actualiza casillas');
    comprobar(lectura.leyenda.includes('Ruta activa: Rmín') && lectura.leyenda.includes('Destino: Acum.'), 'Leyenda identifica ruta activa y Acum./Total');
    await page.click('#jnRutaDetalle [data-ruta-johnson="minimo"]');
    lectura = await destino('svgResultadoJn', ['19', '58'], ['mín', 'máx'], 'Volver a pulsar desactiva y restaura mín/máx');
    comprobar(!lectura.leyenda.includes('Ruta activa:') && lectura.leyenda.includes('Sin ruta única activa'), 'Desactivar limpia la leyenda activa');
    await page.select('#jnVistaAnalisis', 'temporal');
    await destino('svgResultadoJn', ['58', '58'], ['temprano', 'tardío'], 'Temporal conserva temprano 58 | tardío 58');
    await page.click('#pasosJohnson [data-vista="resolucion"]');
    const total = await page.$$eval('#jnPasosLista button', botones => botones.length);
    comprobar(await page.$eval('#svgPasoJn', svg => Array.from(svg.querySelectorAll('.jn-nodo-valor')).every(t => t.firstChild.textContent === '—')),
      'Primer paso conserva valores pendientes, sin adelantar el resultado');
    await page.click('#jnPasosLista li:last-child button');
    await destino('svgPasoJn', ['58', '58'], ['temprano', 'tardío'], 'Último paso respeta la vista temporal');
    await page.click('#pasosJohnson [data-vista="resultado"]');
    await page.select('#jnVistaAnalisis', 'caminos');
    await page.click('#jnRutaDetalle [data-ruta-johnson="maximo"]');
    await page.click('#pasosJohnson [data-vista="resolucion"]');
    await destino('svgPasoJn', ['58', '58'], ['Acum.', 'Total'], 'Reconstrucción final coincide con el máximo activo');
    comprobar(await page.$eval('#jnPasoTitulo', e => e.textContent === 'Reconstrucción de la ruta seleccionada'), 'Título del paso final');
    await page.click('#jnPasoTablas [data-ruta-johnson="minimo"]');
    await destino('svgPasoJn', ['19', '19'], ['Acum.', 'Total'], 'Cambiar ruta dentro del procedimiento actualiza el paso final');
    comprobar(await page.$$eval('#jnPasosLista button', botones => botones.length) === total, 'Cambiar ruta no duplica ni acumula pasos');
    for (const caja of ['grafoPasoJn', 'grafoResultadoJn']) {
      if (caja === 'grafoResultadoJn') await page.click('#pasosJohnson [data-vista="resultado"]');
      await page.click('#' + caja + ' [data-zoom-ruta="mas"]');
      await page.click('#' + caja + ' [data-zoom-ruta="ajustar"]');
      await page.click('#' + caja + ' [data-ampliar-grafo]');
      await page.click('#' + caja + ' [data-ampliar-grafo]');
    }
    comprobar(await page.evaluate(antes => antes === JSON.stringify([estado.nodos, estado.conexiones,
      estadoJohnson.resultado.distancias, consultaCaminosJohnson.maximos.distancias]), original),
    'Cambiar vista, zoom, ajustar y ampliar ambos SVG conserva grafo y cálculos');
    await page.click('#pasosJohnson [data-vista="grafo"]');
    const conexion = await page.evaluate(() => estado.conexiones[0].id);
    await page.select('#jnElementoEditor', 'conexion:' + conexion);
    await page.click('#btnEditar');
    await page.waitForSelector('#modalFondo:not([hidden])');
    await page.$eval('#modalInput', e => { e.value = '59'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalAceptar');
    await page.waitForFunction(() => estado.conexiones[0].valor === 59);
    comprobar(await page.evaluate(() => !resultadoVigenteJohnson() && estado.visualizacionJohnson === null &&
      estadoJohnson.seleccion === null && consultaCaminosJohnson.modeloActivo === null &&
      consultaCaminosJohnson.errorRutaActiva === null && consultaCaminosJohnson.cacheMaximos.size === 0),
    'Editar un peso invalida ruta, modelo, error y resaltados');
    await page.click('#pasosJohnson [data-vista="resolucion"]');
    comprobar(await page.$eval('#resolucionConJn', e => e.hidden), 'Procedimiento anterior queda invalidado');
    await page.click('#pasosJohnson [data-vista="resultado"]');
    comprobar(await page.$eval('#resultadoConJn', e => e.hidden), 'Resultado anterior queda invalidado');
    assert.deepEqual(errores, [], 'Errores de página o consola relacionados con la aplicación');
    comprobar(true, 'Sin errores de página ni consola de la aplicación');
    console.log('Johnson navegador: ' + comprobaciones + ' comprobaciones correctas; sin capturas ni publicación.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => servidor.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
