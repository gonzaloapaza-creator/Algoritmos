/* Regresiones del cierre: perfiles aislados; nunca modifica almacenamiento real. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let correctas = 0;
const errores = [];

function comprobar(condicion, mensaje) {
  assert.ok(condicion, mensaje); correctas++;
  console.log('  ✓ ' + mensaje);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
  const descargas = fs.mkdtempSync(path.join(os.tmpdir(), 'cierre-rutas-'));
  try {
    for (const modulo of ['dijkstra', 'kruskal', 'ordenamiento']) {
      const contexto = await browser.createBrowserContext();
      const page = await contexto.newPage();
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => errores.push(modulo + ': ' + error.message));
      page.on('console', mensaje => { if (mensaje.type() === 'error') errores.push(modulo + ': ' + mensaje.text()); });
      const clave = modulo + '.v1', crudo = '{guardado original incompatible:' + modulo;
      await page.evaluateOnNewDocument(({ claveGuardada, original }) => {
        if (!sessionStorage.getItem('semilla-cierre')) {
          localStorage.setItem(claveGuardada, original);
          sessionStorage.setItem('semilla-cierre', '1');
        }
      }, { claveGuardada: clave, original: crudo });
      await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
      if (modulo === 'ordenamiento') {
        await page.waitForFunction(() => estadoOrdenamiento.historial.length > 0);
        await page.evaluate(() => fijarValores([9, 3, 4]));
      } else {
        await page.evaluate(() => comprometerGrafo(crearEjemploGrafo(moduloGrafo.modulo)));
      }
      comprobar(await page.evaluate(k => localStorage.getItem(k), clave) === crudo,
        modulo + ': restauración inválida y edición conservan el original exacto');
      comprobar(await page.$eval('.aviso-almacenamiento button:last-child', boton => boton.disabled),
        modulo + ': reemplazar sigue deshabilitado antes de descargar el original');
      const cliente = await page.createCDPSession();
      await cliente.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: descargas });
      await page.click('.aviso-almacenamiento button:first-of-type');
      const originalDescargado = path.join(descargas, clave + '-original.json');
      await page.waitForFunction(() => !document.querySelector('.aviso-almacenamiento button:last-child').disabled);
      const limiteDescarga = Date.now() + 5000;
      while (!fs.existsSync(originalDescargado) && Date.now() < limiteDescarga) await new Promise(r => setTimeout(r, 50));
      comprobar(fs.existsSync(originalDescargado) && fs.readFileSync(originalDescargado, 'utf8') === crudo,
        modulo + ': descarga real recupera el original sin modificarlo');
      await page.click('.aviso-almacenamiento button:last-child');
      await page.evaluate(esOrdenamiento => {
        if (esOrdenamiento) guardarEstadoOrdenamiento('650'); else guardarModuloGrafo();
      }, modulo === 'ordenamiento');
      comprobar(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).version === 1, clave),
        modulo + ': solo una elección explícita permite guardar el ejercicio actual');

      if (modulo !== 'ordenamiento') {
        await page.evaluate(() => aplicarDocumentoModuloGrafo({ version: 1, modulo: moduloGrafo.modulo,
          grafo: crearEjemploGrafo(moduloGrafo.modulo), origen: 'n1', resuelto: true, vista: 'procedimiento', paso: 3 }));
        comprobar(await page.evaluate(() => {
          const resultado = moduloGrafo.resultado, g = copiarGrafoModulo(moduloGrafo.grafo);
          g.nodos[0].nombre = 'Actual'; g.nodos[0].x++;
          comprometerGrafo(g, null, false);
          return moduloGrafo.resultado === resultado && moduloGrafo.resultado.grafo.nodos[0].nombre === 'Actual';
        }), modulo + ': renombrar y mover preservan cálculo y actualizan nombres');
        comprobar(await page.evaluate(() => {
          const antes = JSON.stringify({ g: moduloGrafo.grafo, h: moduloGrafo.historial, r: moduloGrafo.resultado });
          const invalido = copiarGrafoModulo(moduloGrafo.grafo);
          invalido.conexiones.push({ ...invalido.conexiones[0], id: 'otra-arista' });
          return !comprometerGrafo(invalido) && antes === JSON.stringify({ g: moduloGrafo.grafo, h: moduloGrafo.historial, r: moduloGrafo.resultado });
        }), modulo + ': una arista duplicada conserva ejercicio, historial y resultado');
        comprobar(await page.evaluate(() => {
          const g = copiarGrafoModulo(moduloGrafo.grafo); g.conexiones[0].valor++;
          comprometerGrafo(g, null, false); return moduloGrafo.resultado === null;
        }), modulo + ': el modelo invalida pesos cambiados incluso con petición de conservar cálculo');
        await page.evaluate(() => aplicarDocumentoModuloGrafo({ version: 1, modulo: moduloGrafo.modulo,
          grafo: crearEjemploGrafo(moduloGrafo.modulo), origen: 'n1', resuelto: true, vista: 'procedimiento', paso: 3 }));
        await page.$eval('#svgModuloGrafo .nodo-editor-grafo', elemento => elemento.focus());
        comprobar(await page.evaluate(() => { dibujarEditorGrafo(); return document.activeElement.dataset.id === 'n1'; }),
          modulo + ': redibujar conserva el foco del vértice');
        comprobar(await page.evaluate(k => {
          const antes = localStorage.getItem(k), tema = document.documentElement.dataset.tema || '';
          reproducirModuloGrafo(); prepararImpresion();
          const correcto = document.querySelectorAll('#impresionPasos .impresion-paso').length === moduloGrafo.resultado.pasos.length &&
            moduloGrafo.paso === 3 && !moduloGrafo.reproduciendo && localStorage.getItem(k) === antes && document.documentElement.dataset.tema === 'claro';
          terminarImpresion();
          return correcto && !document.querySelector('#impresionPasos') && (document.documentElement.dataset.tema || '') === tema;
        }, clave), modulo + ': impresión copia los pasos reales, pausa y restaura paso/tema sin guardar pasos transitorios');
      } else {
        await page.focus('#btnSiguiente');
        await page.keyboard.press('Space');
        comprobar(await page.evaluate(() => estadoOrdenamiento.pasoActual === 1 && !estadoOrdenamiento.reproduciendo),
          'Ordenamiento: Espacio activa el botón enfocado sin iniciar reproducción global');
        await page.evaluate(() => document.activeElement.blur());
        await page.keyboard.press('ArrowRight');
        comprobar(await page.evaluate(() => estadoOrdenamiento.pasoActual === 2),
          'Ordenamiento: los atajos de página siguen funcionando con los diálogos ocultos');
        await page.keyboard.press('ArrowLeft');
        await page.evaluate(() => { alternarReproduccion(); pausarReproduccion(); });
        await page.evaluate(() => {
          dialogoInformar({ titulo: 'Prueba de foco', mensaje: 'Los atajos deben respetar el diálogo.' });
        });
        await page.keyboard.press('ArrowRight');
        comprobar(await page.evaluate(() => estadoOrdenamiento.pasoActual === 1 && !estadoOrdenamiento.reproduciendo),
          'Ordenamiento: los atajos no modifican el paso detrás de un diálogo');
        await page.keyboard.press('Escape');
        comprobar(await page.evaluate(async () => {
          irAPaso(E.historial.length - 1);
          E.algoritmo = 'bubble';
          const preparacion = fijarValores(Array.from({ length: 200 }, (_, i) => 99 - i % 99));
          const limpio = statComparaciones.textContent === '0' && statIntercambios.textContent === '0' &&
            !document.getElementById('pistaBowling').classList.contains('celebrar');
          cancelarPreparacion(); await preparacion;
          return limpio && !E.preparando && E.historial.length === 0 && chipTipo.textContent === 'Sin procedimiento';
        }), 'Ordenamiento: preparar y cancelar datos nuevos no deja contadores ni celebración del resultado anterior');
        comprobar(await page.evaluate(async () => {
          E.algoritmo = 'insertion'; await fijarValores([1, 5, 7, 3, 2]);
          const paso = E.historial.findIndex(p => p.tipo === 'mover'); irAPaso(paso);
          return document.querySelector('.estadistica--ordenados .estadistica__etiqueta').textContent === 'Prefijo ordenado' &&
            document.querySelector('.leyenda__pino[data-color="exito"]').parentElement.textContent === 'Prefijo ordenado';
        }), 'Ordenamiento: Insertion explica que el prefijo ordenado puede cambiar después');
      }
      await contexto.close();
    }
    comprobar(errores.length === 0, 'Sin excepciones ni errores de consola');
  } catch (error) {
    console.error(error.stack || error); process.exitCode = 1;
  } finally {
    await browser.close();
    // Solo archivos de un directorio temporal creado por esta prueba.
    for (const archivo of fs.readdirSync(descargas)) fs.unlinkSync(path.join(descargas, archivo));
    fs.rmdirSync(descargas);
  }
  errores.forEach(error => console.error(error));
  if (errores.length) process.exitCode = 1;
  console.log('\nCierre rutas/Ordenamiento: ' + correctas + ' correctas; errores: ' + errores.length);
})();
