/* Verificación del inicio «Ciudad de algoritmos» con Edge y puppeteer-core.
 * Primero: node tests/servidor-local.js
 * Después: node tests/ciudad-navegador.js [--capturas]
 * Las capturas nuevas usan exclusivamente el prefijo ciudad-.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SOLO_CAPTURAS = process.argv.includes('--solo-capturas');
const CAPTURAS = process.argv.includes('--capturas') || SOLO_CAPTURAS;
const filtroAnchos = process.argv.find(argumento => argumento.startsWith('--anchos='));
const ANCHOS = filtroAnchos ? filtroAnchos.slice('--anchos='.length).split(',').map(Number) : [320, 390, 768, 1440];
const DIR_CAPTURAS = path.join(__dirname, '..', 'docs', 'capturas');
const MODULOS = ['johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest', 'ordenamiento', 'arboles'];
let correctas = 0, fallidas = 0;
const errores = [];

function comprobar(condicion, mensaje) {
  if (condicion) { correctas++; console.log('  ✓ ' + mensaje); }
  else { fallidas++; console.log('  ✗ ' + mensaje); }
}

async function pulsar(page, selector) {
  // La ciudad ahora es más alta: el clic espera una posición estable bajo la cabecera sticky.
  await page.$eval(selector, elemento => elemento.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }));
  return page.click(selector);
}

async function pagina(browser, ancho, tema, reducido = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: ancho, height: ancho === 1440 ? 1000 : ancho === 768 ? 1024 : 844, deviceScaleFactor: 1, hasTouch: ancho < 900 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: tema === 'claro' ? 'light' : 'dark' },
    { name: 'prefers-reduced-motion', value: reducido ? 'reduce' : 'no-preference' }
  ]);
  page.on('pageerror', error => errores.push(page.url() + ': ' + error.message));
  page.on('console', mensaje => {
    if (mensaje.type() === 'error') errores.push(page.url() + ': ' + mensaje.text() + ' [' + mensaje.location().url + ']');
  });
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  return page;
}

async function sinDesborde(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function capturar(page, nombre, fullPage = false) {
  if (!CAPTURAS) return;
  fs.mkdirSync(DIR_CAPTURAS, { recursive: true });
  await page.screenshot({ path: path.join(DIR_CAPTURAS, 'ciudad-' + nombre + '.png'), fullPage });
}

function esCapturaObjetivo(ancho, tema) {
  return [390, 1440].includes(ancho) || (ancho === 320 && tema === 'oscuro') || (ancho === 768 && tema === 'claro');
}

async function capturarInicio(page, ancho, tema) {
  if (!CAPTURAS || !esCapturaObjetivo(ancho, tema)) return;
  const desplazamiento = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  if (ancho < 600) {
    await page.$eval('#ciudadMapa', mapa => window.scrollTo(0, mapa.getBoundingClientRect().top + window.scrollY - 78));
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  await capturar(page, 'inicio-' + tema + '-' + ancho);
  await page.evaluate(({ x, y }) => window.scrollTo(x, y), desplazamiento);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function animacionesActivas(page) {
  return page.$eval('#ciudadMapa', mapa => [...mapa.querySelectorAll('*')].filter(elemento => {
    const estilo = getComputedStyle(elemento);
    return estilo.animationName !== 'none' && estilo.animationDuration.split(',').some(duracion => parseFloat(duracion) > 0.001) && estilo.animationPlayState.split(',').some(estado => estado.trim() !== 'paused');
  }).length);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    console.log('\nCiudad: tamaños, temas y selección real de módulos');
    for (const ancho of ANCHOS) {
      for (const tema of ['oscuro', 'claro']) {
        if (SOLO_CAPTURAS && !esCapturaObjetivo(ancho, tema)) continue;
        const page = await pagina(browser, ancho, tema);
        await capturarInicio(page, ancho, tema);
        if (SOLO_CAPTURAS) { await page.close(); continue; }
        const contexto = ancho + ' / ' + tema;
        comprobar(await page.evaluate(() => document.documentElement.dataset.tema) === tema, 'Tema del sistema: ' + contexto);
        comprobar(await page.$$eval('.ciudad-zona', zonas => zonas.length) === 7, 'Siete zonas reales: ' + contexto);
        comprobar(await page.$$eval('.ciudad-zona', zonas => zonas.every(zona => zona.tagName === 'BUTTON' && zona.getAttribute('aria-controls') === 'panelModulo')), 'Zonas accesibles como botones: ' + contexto);
        comprobar(await sinDesborde(page), 'Ciudad sin desborde horizontal: ' + contexto);
        if (ancho >= 1024) comprobar(await page.evaluate(() => document.getElementById('titulo-principal').getBoundingClientRect().left >= document.getElementById('barraLateral').getBoundingClientRect().right), 'La barra lateral no tapa el título ni el contenido: ' + contexto);
        comprobar(await page.$$eval('.ciudad-zona', zonas => zonas.every(zona => { const caja = zona.getBoundingClientRect(); return caja.width >= 44 && caja.height >= 44; })), 'Zonas con área táctil de 44 px: ' + contexto);

        for (const modulo of MODULOS) {
          await pulsar(page, '.ciudad-zona[data-modulo="' + modulo + '"]');
          comprobar(await page.$eval('.ciudad-zona[data-modulo="' + modulo + '"]', zona => zona.getAttribute('aria-pressed') === 'true'), modulo + ' queda seleccionado: ' + contexto);
          comprobar(await page.$$eval('.ciudad-zona[aria-pressed="true"]', zonas => zonas.length) === 1, 'Una sola zona seleccionada tras ' + modulo + ': ' + contexto);
          comprobar(await page.$eval('#panelModulo', (panel, id) => !panel.hidden && !!panel.querySelector('a[href="' + id + '.html"]') && !!panel.querySelector('h3')?.textContent.trim(), modulo), 'Panel con nombre y acceso real a ' + modulo + ': ' + contexto);
          if (ancho < 600) comprobar(await page.$eval('#ciudadAccesoMovil a', (enlace, id) => enlace.getAttribute('href') === id + '.html' && !enlace.closest('button'), modulo), 'Acceso móvil corresponde a ' + modulo + ': ' + contexto);
        }
        comprobar(await sinDesborde(page), 'Panel seleccionado sin desborde: ' + contexto);

        await pulsar(page, '#vistaLista');
        comprobar(await page.$eval('#catalogo', catalogo => !catalogo.hidden && catalogo.getClientRects().length > 0), 'Lista de algoritmos visible: ' + contexto);
        comprobar(await page.$$eval('#catalogo .tarjeta-alg a', enlaces => enlaces.length) === 7, 'Lista con siete accesos reales: ' + contexto);
        comprobar(await page.evaluate(() => localStorage.getItem('ui.inicio.vista.v1')) === 'lista', 'Preferencia de lista guardada: ' + contexto);
        comprobar(await sinDesborde(page), 'Lista sin desborde: ' + contexto);
        await page.reload({ waitUntil: 'networkidle0' });
        comprobar(await page.$eval('#vistaLista', boton => boton.getAttribute('aria-pressed') === 'true'), 'La vista lista se restaura: ' + contexto);
        await pulsar(page, '#vistaCiudad');
        comprobar(await page.$eval('#vistaCiudad', boton => boton.getAttribute('aria-pressed') === 'true'), 'Se puede volver a Ciudad: ' + contexto);

        if (ancho < 1024) {
          await pulsar(page, '#btnMenuLateral');
          await page.waitForSelector('body.nav-abierta');
          comprobar(await page.$eval('#btnMenuLateral', boton => boton.getAttribute('aria-expanded') === 'true'), 'Menú abre en ' + contexto);
          if (ancho === 390 && tema === 'oscuro') {
            comprobar(await page.$eval('#barraLateral', barra => barra.getAttribute('aria-modal') === 'true' && barra.contains(document.activeElement)), 'El menú móvil recibe el foco como diálogo');
            let focoContenido = true;
            for (let tabulacion = 0; tabulacion < 16; tabulacion++) {
              if (tabulacion === 8) await page.keyboard.down('Shift');
              await page.keyboard.press('Tab');
              focoContenido = focoContenido && await page.$eval('#barraLateral', barra => barra.contains(document.activeElement));
            }
            await page.keyboard.up('Shift');
            comprobar(focoContenido, 'Tab y Shift+Tab permanecen dentro del menú móvil');
          }
          await page.keyboard.press('Escape');
          comprobar(!(await page.$('body.nav-abierta')), 'Escape cierra menú en ' + contexto);
          comprobar(await page.evaluate(() => document.activeElement.id) === 'btnMenuLateral', 'El menú devuelve el foco a su botón en ' + contexto);
        }
        await page.close();
      }
    }

    if (SOLO_CAPTURAS) {
      console.log('Capturas de seis vistas guardadas con prefijo ciudad-.');
      errores.forEach(error => console.error(error));
      process.exitCode = errores.length ? 1 : 0;
      return;
    }

    console.log('\nCiudad: teclado, preferencias y movimiento');
    let page = await pagina(browser, 1440, 'oscuro');
    await page.hover('.ciudad-zona[data-modulo="johnson"]');
    comprobar(await animacionesActivas(page) > 0, 'Una zona muestra su demostración al recibir el puntero');
    comprobar(await page.$$eval('.ciudad-zona.demostrando', zonas => zonas.length) === 1, 'Solo una zona demuestra su algoritmo a la vez');
    await page.focus('.ciudad-zona[data-modulo="asignacion"]');
    await page.keyboard.press('Enter');
    comprobar(await page.$eval('.ciudad-zona[data-modulo="asignacion"]', zona => zona.getAttribute('aria-pressed') === 'true'), 'Enter selecciona una zona sin navegar');
    await page.focus('.ciudad-zona[data-modulo="arboles"]');
    await page.keyboard.press('Space');
    comprobar(await page.$eval('.ciudad-zona[data-modulo="arboles"]', zona => zona.getAttribute('aria-pressed') === 'true'), 'Espacio selecciona una zona');
    comprobar(await page.$eval('.ciudad-zona[data-modulo="arboles"]', zona => { const estilo = getComputedStyle(zona); return zona.matches(':focus-visible') && estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0; }), 'El foco de teclado es visible');
    await page.$eval('#equipo', equipo => equipo.scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => !document.querySelector('#ciudadMapa .demostrando'), { timeout: 1000 });
    comprobar(await animacionesActivas(page) === 0, 'Las demostraciones se detienen al salir la ciudad de pantalla');
    await page.$eval('#ciudadMapa', mapa => mapa.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await pulsar(page, '#btnMovimiento');
    comprobar(await page.evaluate(() => localStorage.getItem('ui.inicio.movimiento.v1')) === 'pausado', 'Pausar movimiento guarda la preferencia');
    comprobar(await animacionesActivas(page) === 0, 'Pausar detiene todas las animaciones de Ciudad');
    await page.reload({ waitUntil: 'networkidle0' });
    comprobar(await animacionesActivas(page) === 0 && await page.evaluate(() => localStorage.getItem('ui.inicio.movimiento.v1')) === 'pausado', 'El movimiento sigue pausado al recargar');
    await pulsar(page, '#btnMovimiento');
    comprobar(await page.evaluate(() => localStorage.getItem('ui.inicio.movimiento.v1')) === 'activo', 'El movimiento se puede reanudar');
    await pulsar(page, '#btnTema');
    await page.reload({ waitUntil: 'networkidle0' });
    comprobar(await page.evaluate(() => document.documentElement.dataset.tema) === 'claro', 'La elección del tema se conserva al recargar');
    await page.goto(BASE + 'index.html?simular=10', { waitUntil: 'networkidle0' });
    comprobar(await page.$$eval('.ciudad-zona', zonas => zonas.length) === 7, 'El catálogo simulado no inventa zonas implementadas');
    await pulsar(page, '#vistaLista');
    comprobar(await page.$$eval('#catalogo .tarjeta-alg', tarjetas => tarjetas.length) === 10, 'La lista conserva la simulación de diez entradas');
    comprobar(await page.$$eval('.tarjeta-alg--pendiente a', enlaces => enlaces.length) === 0, 'Las entradas simuladas no enlazan a rutas inexistentes');
    await page.close();

    page = await pagina(browser, 390, 'oscuro', true);
    comprobar(await animacionesActivas(page) === 0, 'Respeta prefers-reduced-motion desde la primera carga');
    comprobar(await page.$eval('#btnMovimiento', boton => boton.disabled && boton.getAttribute('aria-label').includes('preferencia del sistema')), 'El control explica la preferencia de movimiento reducido');
    await pulsar(page, '.ciudad-zona[data-modulo="arboles"]');
    comprobar(await animacionesActivas(page) === 0, 'Seleccionar un módulo conserva el movimiento reducido');
    await page.close();

    console.log('\nCiudad: trabajos recientes guardados desde un módulo');
    page = await pagina(browser, 1440, 'oscuro');
    comprobar(await page.$$eval('#trabajosRecientes .reciente-enlace', enlaces => enlaces.length) === 0, 'No inventa trabajos recientes cuando el almacén está vacío');
    await page.goto(BASE + 'ordenamiento.html?intro=no', { waitUntil: 'networkidle0' });
    await page.$eval('#entradaValores', entrada => { entrada.value = '9, 4, 7, 1, 5'; });
    await pulsar(page, '#btnAplicar');
    await pulsar(page, '[data-algoritmo="shell"]');
    await pulsar(page, '[data-accion-trabajo="guardar"]');
    await page.waitForSelector('.gd-fondo:not([hidden])');
    await pulsar(page, '#gdNombre', { clickCount: 3 });
    await page.type('#gdNombre', 'Ciudad: práctica Shell');
    await pulsar(page, '#gdGuardar');
    await page.keyboard.press('Escape');
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
    comprobar(await page.$eval('#trabajosRecientes', caja => caja.textContent.includes('Ciudad: práctica Shell')), 'El inicio muestra el trabajo guardado en Ordenamiento');
    comprobar(await page.$$eval('#trabajosRecientes .reciente-enlace', enlaces => enlaces.length) === 1, 'Un trabajo real produce un único enlace reciente');
    comprobar(await page.$eval('#trabajosRecientes .reciente-enlace', enlace => enlace.getAttribute('href') === 'ordenamiento.html?intro=no&trabajos=1'), 'El reciente conduce a la biblioteca de su módulo');
    await pulsar(page, '#trabajosRecientes .reciente-enlace');
    await page.waitForSelector('.gd-fondo:not([hidden])');
    comprobar(await page.$eval('.gd-fondo', caja => caja.textContent.includes('Ciudad: práctica Shell')), 'Abrir un reciente muestra su trabajo en la biblioteca');
    comprobar(await page.$eval('.gd-fondo', caja => caja.contains(document.activeElement)), 'La biblioteca abierta recibe el foco');
    comprobar(await page.evaluate(() => estadoOrdenamiento.algoritmo === 'shell' && estadoOrdenamiento.valores.join(',') === '9,4,7,1,5'), 'Entrar a recientes conserva los datos actuales del módulo');
    await page.close();
  } catch (error) {
    fallidas++;
    console.error('  ✗ Excepción: ' + error.stack);
  } finally {
    await browser.close();
  }
  console.log('\nErrores de consola/página: ' + errores.length);
  errores.forEach(error => console.log('  - ' + error));
  console.log('\n' + correctas + ' correctas, ' + fallidas + ' fallidas');
  process.exitCode = fallidas === 0 && errores.length === 0 ? 0 : 1;
})();
