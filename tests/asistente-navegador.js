/* QA exclusivo de Algo local en el paquete Drop. Perfil aislado, sin capturas. */
'use strict';
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const { crearServidor } = require('./servidor-local');
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async () => {
  const servidor = crearServidor({ raiz: path.join(__dirname, '../entrega-netlify/drop') });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + servidor.address().port + '/';
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
    const perfil = await browser.createBrowserContext();
    const page = await perfil.newPage();
    page.setDefaultTimeout(8000);
    await page.setViewport({ width: 1440, height: 950 });
    const errores = [], api = [];
    let duranteChat = false, peticionesChat = 0;
    page.on('pageerror', error => errores.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (duranteChat) peticionesChat++;
      if (/\/api\//.test(request.url())) api.push(request.url());
      if (!request.url().startsWith(base) && !request.url().startsWith('data:')) request.abort().catch(() => {});
      else request.continue().catch(() => {});
    });
    const enviar = async texto => {
      await page.$eval('#algoPregunta', (campo, valor) => { campo.value = valor; }, texto);
      await page.click('#algoEnviar');
    };
    for (const modulo of ['index', 'johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest', 'ordenamiento', 'arboles']) {
      await page.goto(base + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
      await page.waitForSelector('#algoAbrir');
      await page.waitForFunction(() => !AlgoContexto.obtener().contexto.datos.preparando);
      const antes = await page.evaluate(() => AlgoContexto.obtener().firma);
      duranteChat = true;
      await page.focus('#algoAbrir');
      await page.keyboard.press('Enter');
      assert.equal(await page.$eval('#algoPanel', e => e.hidden), false);
      assert.equal(await page.$eval('#algoTitulo span', e => e.textContent), 'Ayuda interactiva');
      await enviar('¿Cómo empiezo?');
      assert.ok(!(await page.$eval('#algoMensajes article:last-child p', e => e.textContent)).startsWith('No tengo'));
      await enviar('¿Cuáles son las reglas?');
      assert.ok(!(await page.$eval('#algoMensajes article:last-child p', e => e.textContent)).startsWith('No tengo'));
      await enviar('¿Cómo ingreso datos?');
      assert.ok(!(await page.$eval('#algoMensajes article:last-child p', e => e.textContent)).startsWith('No tengo'));
      await enviar('Duda ajena sobre astronomía');
      assert.ok((await page.$eval('#algoMensajes article:last-child p', e => e.textContent)).startsWith('No tengo una explicación local'));
      await enviar('¿Dónde estoy?');
      assert.ok((await page.$eval('#algoMensajes article:last-child p', e => e.textContent)).includes('Vista actual:'));
      assert.equal(await page.evaluate(() => AlgoContexto.obtener().firma), antes, modulo + ': estado intacto');
      const cantidad = await page.$$eval('#algoMensajes article', e => e.length);
      await page.keyboard.press('Escape');
      assert.ok(await page.$eval('#algoPanel', e => e.hidden));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'algoAbrir');
      await page.click('#algoAbrir');
      assert.equal(await page.$$eval('#algoMensajes article', e => e.length), cantidad);
      await page.click('#algoCerrar');
      duranteChat = false;
      console.log('✓ ' + modulo + ': abrir, respuestas locales, desconocida, contexto, historial y cierre.');
    }
    await page.setViewport({ width: 375, height: 667 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.click('#algoAbrir');
    const medidas = await page.$eval('#algoPanel', e => {
      const r = e.getBoundingClientRect();
      return { modal: e.getAttribute('aria-modal'), left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    assert.equal(medidas.modal, 'true');
    assert.ok(medidas.left >= 0 && medidas.right <= 375 && medidas.top >= 0 && medidas.bottom <= 667);
    assert.equal(await page.$eval('.algo-cabecera .algo-robot', e => getComputedStyle(e).animationName), 'none');
    await page.focus('#algoEnviar');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'algoCerrar');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'algoEnviar');
    await page.click('#algoLimpiar');
    assert.equal(await page.$$eval('#algoMensajes article', e => e.length), 1);
    await page.setOfflineMode(true);
    await enviar('¿Cómo empiezo?');
    assert.ok((await page.$eval('#algoMensajes article:last-child p', e => e.textContent)).includes('BST'));
    await page.emulateMediaType('print');
    assert.equal(await page.$eval('.algo-root', e => getComputedStyle(e).display), 'none');
    assert.deepEqual(errores, []);
    assert.deepEqual(api, []);
    assert.equal(peticionesChat, 0);
    console.log('✓ Móvil, teclado, movimiento reducido, impresión y respuesta offline. Cero solicitudes del chat y cero errores JS. Sin capturas.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => servidor.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
