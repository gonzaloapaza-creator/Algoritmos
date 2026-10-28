/* Regresiones de Johnson y uso de las nuevas vistas Dijkstra/Kruskal.
 * npm run test:mejoras [-- --capturas]
 * Las capturas opcionales se escriben en el directorio temporal del sistema. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CAPTURAS = process.argv.includes('--capturas');
const DIR = path.join(os.tmpdir(), 'algoritmos-qa-mejoras');
let correctas = 0;

function comprobar(condicion, mensaje) {
  assert.ok(condicion, mensaje); correctas++; console.log('  ✓ ' + mensaje);
}

async function capturar(page, nombre) {
  if (!CAPTURAS) return;
  fs.mkdirSync(DIR, { recursive: true });
  await page.evaluate(() => { document.querySelector('#toastStack')?.replaceChildren(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.evaluate(() => Promise.all(document.getAnimations().map(animacion => animacion.finished.catch(() => {}))));
  await page.screenshot({ path: path.join(DIR, nombre + '.png'), fullPage: true });
}

async function clic(page, selector) {
  await page.$eval(selector, elemento => elemento.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.click(selector);
}

async function encuadreJohnson(page) {
  await page.waitForFunction(() => {
    const caja = document.getElementById('svg').getBoundingClientRect();
    return [...document.querySelectorAll('#capaNodos circle')].every(n => {
      const r = n.getBoundingClientRect();
      return r.left >= caja.left - 1 && r.right <= caja.right + 1 && r.top >= caja.top - 1 && r.bottom <= caja.bottom + 1;
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const errores = [];
  async function pagina(modulo, ancho = 1440) {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: ancho, height: 950 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', error => errores.push(error.message));
    await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
    return page;
  }
  try {
    let page = await pagina('johnson');
    const original = await page.evaluate(() => {
      aplicarGrafo({ nodos: [{ id: 'n_1', nombre: 'A', x: 800, y: 160 }, { id: 'n_2', nombre: 'B', x: 950, y: 400 }],
        conexiones: [{ id: 'c_3', desde: 'n_1', hacia: 'n_2', valor: 3 }], siguienteId: 4 });
      guardar(); dibujar();
      return localStorage.getItem(CLAVE_ALMACEN);
    });
    for (const ancho of [390, 320, 1440]) {
      await page.setViewport({ width: ancho, height: 900 });
      await encuadreJohnson(page);
      comprobar(await page.evaluate(antes => JSON.stringify(instantaneaGrafo()) === antes && localStorage.getItem(CLAVE_ALMACEN) === antes, original),
        'Johnson: cambiar a ' + ancho + ' px conserva posiciones y autoguardado');
    }
    await page.setViewport({ width: 390, height: 900 });
    await page.reload({ waitUntil: 'networkidle0' }); await encuadreJohnson(page);
    comprobar(await page.evaluate(antes => JSON.stringify(instantaneaGrafo()) === antes, original), 'Johnson: recuperar un grafo grande en móvil conserva su distribución');
    await page.evaluate(() => { elegirHerramienta('seleccionar'); document.querySelector('#capaNodos .nodo').focus(); });
    await page.keyboard.press(' ');
    comprobar(await page.evaluate(() => estado.seleccion.id === 'n_1' && document.activeElement.dataset.id === 'n_1'), 'Johnson: Espacio selecciona el nodo enfocado y conserva el foco');
    await page.keyboard.press('ArrowRight');
    comprobar(await page.evaluate(() => estado.seleccion.id === 'n_2' && document.activeElement.dataset.id === 'n_2'), 'Johnson: las flechas trasladan selección y foco al mismo nodo');
    await page.keyboard.press('Enter');
    comprobar(await page.evaluate(() => modalAbierto()), 'Johnson: Enter abre la edición del nodo enfocado');
    await page.keyboard.press('Escape');
    comprobar(await page.evaluate(() => document.activeElement.dataset.id === 'n_2'), 'Johnson: cerrar la edición devuelve el foco al nodo');
    comprobar(await page.evaluate(() => {
      crearNodo(200, 100);
      return estado.nodos[2].nombre === 'c' && validarGrafoImportado(instantaneaGrafo()).ok;
    }), 'Johnson: los nombres automáticos respetan mayúsculas y el grafo se puede reimportar');
    await page.close();

    for (const modulo of ['dijkstra', 'kruskal']) {
      page = await pagina(modulo);
      comprobar(await page.$eval('#bienvenidaGrafo', e => !e.hidden), modulo + ': bienvenida con acceso directo a un ejemplo');
      await capturar(page, modulo + '-inicio-1440');
      await page.setViewport({ width: 390, height: 844 });
      await capturar(page, modulo + '-inicio-390');
      await clic(page, '#btnCrearPrimerPunto');
      comprobar(await page.evaluate(() => document.activeElement.id === 'nombreVertice'), modulo + ': empezar desde cero lleva al nombre del punto');
      await page.type('#nombreVertice', 'Prueba'); await page.keyboard.press('Enter');
      comprobar(await page.evaluate(() => moduloGrafo.grafo.nodos.length === 1 && document.getElementById('bienvenidaGrafo').hidden), modulo + ': Enter crea el primer punto y retira la bienvenida');
      // Restablece solo la fixture; cargar el ejemplo se ejercita con su botón real.
      await page.evaluate(() => comprometerGrafo(crearGrafoVacio(moduloGrafo.grafo.dirigido)));
      await clic(page, '#btnEjemploRapidoGrafo');
      await page.waitForFunction(() => moduloGrafo.grafo.nodos.length > 1);
      await clic(page, '#btnContinuarGrafo');
      await page.waitForFunction(() => moduloGrafo.vista === 'configuracion');
      await clic(page, '#btnResolverGrafo');
      await page.waitForFunction(() => moduloGrafo.vista === 'procedimiento');
      const avance = await page.$eval('#progresoPasosGrafo', e => e.value);
      await clic(page, '#btnSiguienteGrafo');
      comprobar(await page.$eval('#progresoPasosGrafo', (e, antes) => e.value === antes + 1 && e.max > e.value, avance), modulo + ': el progreso refleja el paso real');
      await capturar(page, modulo + '-pasos-390');
      await clic(page, '#btnVerResultadoGrafo');
      if (modulo === 'dijkstra') {
        const resultado = await page.evaluateHandle(() => moduloGrafo.resultado);
        await clic(page, '[data-destino-resultado="n4"]');
        comprobar(await page.evaluate(ref => moduloGrafo.resultado === ref && moduloGrafo.destino === 'n4' && reconstruirRutaGrafo(ref, 'n4').distancia === 4, resultado), 'Dijkstra: elegir un destino desde el resultado conserva el cálculo y muestra su ruta');
        comprobar(await page.$eval('[data-destino-resultado="n4"]', e => e.getAttribute('aria-pressed') === 'true' && document.activeElement === e), 'Dijkstra: el destino seleccionado se anuncia y conserva el foco');
        await clic(page, '[data-destino-resultado="n5"]');
        comprobar(await page.$eval('.gm-ruta-resultado', e => /Sin camino/.test(e.textContent)), 'Dijkstra: un destino inalcanzable se explica al seleccionarlo');
        await clic(page, '#btnTodasRutasGrafo');
        comprobar(await page.evaluate(ref => moduloGrafo.destino === null && moduloGrafo.resultado === ref, resultado), 'Dijkstra: volver a todos los caminos conserva el resultado');
        await resultado.dispose();
      } else {
        comprobar(await page.$$eval('.gm-metricas dd', cifras => cifras.map(e => e.textContent).join(',') === '6,3,1'), 'Kruskal: resume peso total, conexiones y grupos con los valores del cálculo');
      }
      await capturar(page, modulo + '-resultado-390');
      await page.setViewport({ width: 1440, height: 950 });
      await capturar(page, modulo + '-resultado-1440');
      if (modulo === 'kruskal' && CAPTURAS) { await clic(page, '#btnTema'); await capturar(page, 'kruskal-resultado-1440-oscuro'); }
      comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), modulo + ': resultado sin desbordamiento horizontal');
      await clic(page, '[data-vista-grafo="procedimiento"]');
      await clic(page, '#btnReproducirGrafo');
      const antesVideo = await page.evaluate(() => {
        const copia = JSON.stringify(serializarModuloGrafo());
        document.getElementById('nombreVertice').value = 'Borrador';
        document.getElementById('btnVideoModulo').click();
        return copia;
      });
      comprobar(await page.evaluate(antes => introVisible() && !moduloGrafo.reproduciendo && moduloGrafo.intervalo === null && JSON.stringify(serializarModuloGrafo()) === antes, antesVideo), modulo + ': abrir el video pausa y conserva datos, resultado y paso');
      await clic(page, '#btnComenzarModulo');
      await page.waitForFunction(() => document.querySelectorAll('#svgModuloGrafo .nodo-editor-grafo').length === moduloGrafo.grafo.nodos.length);
      comprobar(await page.evaluate(antes => !introVisible() && JSON.stringify(serializarModuloGrafo()) === antes && document.getElementById('nombreVertice').value === 'Borrador', antesVideo), modulo + ': volver del video recupera el grafo y el borrador sin recalcular');
      await clic(page, '#btnReproducirGrafo');
      const antesAyuda = await page.evaluate(() => { const copia = JSON.stringify(serializarModuloGrafo()); document.getElementById('btnAyuda').click(); return copia; });
      comprobar(await page.evaluate(antes => !moduloGrafo.reproduciendo && JSON.stringify(serializarModuloGrafo()) === antes && document.getElementById('nombreVertice').value === 'Borrador', antesAyuda), modulo + ': abrir la ayuda pausa sin descartar el ejercicio ni el borrador');
      await page.keyboard.press('Escape');
      await page.close();
    }
    assert.deepEqual(errores, []);
    console.log('\nMejoras: ' + correctas + ' comprobaciones correctas, sin errores JavaScript.');
    if (CAPTURAS) console.log('Capturas: ' + DIR);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
