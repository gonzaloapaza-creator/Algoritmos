/* Integración acotada del proveedor de recientes. Perfil aislado y sin capturas. */
'use strict';
const assert = require('assert/strict');
const path = require('path'), os = require('os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let correctas = 0;
function check(condicion, texto) { assert.ok(condicion, texto); correctas++; console.log('  ✓ ' + texto); }
(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
  const errores = [];
  try {
    const contexto = await browser.createBrowserContext(), page = await contexto.newPage();
    page.on('pageerror', e => errores.push(e.message));
    await page.setViewport({ width: 1366, height: 900 });
    await page.goto(BASE + 'logica-difusa.html?intro=no', { waitUntil: 'networkidle0' });
    const guardado = await page.evaluate(() => DifusaEstado.guardarTrabajo('Reciente de prueba FASE 2'));
    check(guardado.ok && guardado.persistido, 'Se guarda un ejercicio difuso válido en el contexto aislado');
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
    check(await page.$eval('#trabajosRecientes', e => e.textContent.includes('Reciente de prueba FASE 2')), 'Inicio integra la biblioteca propia de difusa');
    const ruta = await page.$eval('#trabajosRecientes .reciente-enlace', e => e.getAttribute('href'));
    check(ruta === 'logica-difusa.html?intro=no&trabajos=1', 'El enlace conserva el módulo y abre su biblioteca');
    await page.click('#btnAyudaInicio');
    check(await page.evaluate(() => document.body.innerText.includes('8 edificios')), 'Ayuda usa el número de edificios del catálogo');
    await page.keyboard.press('Escape');
    check(await page.evaluate(() => document.activeElement.id === 'btnAyudaInicio'), 'Escape cierra el diálogo y devuelve el foco');
    // El diálogo evita clics fantasma durante 350ms tras cerrarse.
    await new Promise(resolve => setTimeout(resolve, 400));
    await page.click('#trabajosRecientes .reciente-enlace');
    await page.waitForFunction(() => !document.getElementById('panelTrabajosDifusa').hidden);
    check(await page.$eval('#listaTrabajosDifusa', e => e.textContent.includes('Reciente de prueba FASE 2')), 'La biblioteca de destino muestra el trabajo sin cargarlo automáticamente');
    await page.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true });
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
    await page.evaluate(() => { document.documentElement.dataset.tema = 'claro'; });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Inicio móvil claro sin desbordamiento horizontal');
    check(await page.$eval('#trabajosRecientes .reciente-enlace', e => e.getBoundingClientRect().width > 40), 'El acceso reciente es alcanzable en móvil');
    check(errores.length === 0, 'Sin errores de página en Inicio y biblioteca difusa');
    console.log('\n' + correctas + ' comprobaciones correctas. Sin capturas ni datos del perfil real.');
    await contexto.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
