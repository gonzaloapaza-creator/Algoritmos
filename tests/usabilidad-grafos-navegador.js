/* Revisión dirigida de Dijkstra/Kruskal: cuatro etapas, cuatro anchos y ambos temas.
 * node tests/usabilidad-grafos-navegador.js [--capturas] [--caso=dijkstra-320-claro]
 * Reutiliza el servidor del proyecto, Edge y Puppeteer existentes. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CAPTURAS = process.argv.includes('--capturas');
const SOLO_CASO = process.argv.find(a => a.startsWith('--caso='))?.slice('--caso='.length);
const TAMANOS = [[320, 800], [390, 844], [768, 1024], [1440, 950]];
const VISTAS = ['grafo', 'configuracion', 'procedimiento', 'resultado'];
const errores = [];
let correctas = 0;

function comprobar(condicion, mensaje) {
  assert.ok(condicion, mensaje);
  correctas++;
}

async function clic(page, selector) {
  await page.$eval(selector, elemento => {
    const contenedores = [];
    for (let padre = elemento.parentElement; padre; padre = padre.parentElement) {
      if (padre.tagName === 'DETAILS' && !padre.open) contenedores.unshift(padre);
    }
    contenedores.forEach(detalle => detalle.querySelector('summary').click());
  });
  await page.$eval(selector, e => e.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.click(selector);
}

async function vista(page, nombre) {
  await clic(page, '[data-vista-grafo="' + nombre + '"]');
  await page.waitForFunction(esperada => moduloGrafo.vista === esperada, {}, nombre);
}

async function fotograma(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function pesosSeparados(page) {
  return page.$$eval('#svgModuloGrafo .gm-peso', textos => {
    const cajas = textos.map(e => e.getBoundingClientRect());
    return !cajas.some((a, i) => cajas.slice(i + 1).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
  });
}

async function geometria(page) {
  await fotograma(page);
  return page.evaluate(() => {
    const svg = document.getElementById('svgModuloGrafo');
    const lienzo = svg.getBoundingClientRect();
    const rect = e => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const dentro = r => r.left >= lienzo.left - 1 && r.right <= lienzo.right + 1 && r.top >= lienzo.top - 1 && r.bottom <= lienzo.bottom + 1;
    const circulos = [...svg.querySelectorAll('.nodo-editor-grafo circle')].map(rect);
    const textos = [...svg.querySelectorAll('text')].map(e => ({ ...rect(e), px: parseFloat(getComputedStyle(e).fontSize) * e.getScreenCTM().a, texto: e.textContent }));
    return { width: lienzo.width, height: lienzo.height, nodos: circulos.length,
      todosDentro: circulos.every(dentro), diametroMinimo: Math.min(...circulos.map(c => c.width)),
      textoMinimo: Math.min(...textos.map(t => t.px)), textoVacioDentro: textos.every(dentro),
      textos, viewBox: svg.getAttribute('viewBox') };
  });
}

async function revisarVista(page, etiqueta, nombre, vacio) {
  await vista(page, nombre);
  const datos = await page.evaluate(() => {
    const visible = e => !!e && e.getClientRects().length > 0;
    const flujo = document.querySelector('.gm-flujo').getBoundingClientRect();
    const botones = [...document.querySelectorAll('[data-vista-grafo]')].map(e => {
      const r = e.getBoundingClientRect();
      return { x: r.left, y: r.top, derecha: r.right, abajo: r.bottom, alto: r.height };
    });
    const seSolapan = botones.some((a, i) => botones.slice(i + 1).some(b => Math.min(a.derecha, b.derecha) - Math.max(a.x, b.x) > 1 && Math.min(a.abajo, b.abajo) - Math.max(a.y, b.y) > 1));
    return {
      sinDesborde: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      activa: document.querySelector('[aria-current="step"][data-vista-grafo]')?.dataset.vistaGrafo,
      navLegible: !seSolapan && botones.every(b => b.x >= flujo.left - 1 && b.derecha <= flujo.right + 1 && b.alto >= 44),
      editor: visible(document.getElementById('panelEditorGrafo')),
      config: visible(document.getElementById('panelConfigGrafo')),
      procedimiento: visible(document.getElementById('procedimientoGrafo')),
      resultado: visible(document.getElementById('resultadoGrafo')),
      explicacion: document.getElementById('explicacionPasoGrafo').textContent,
      textoResultado: document.getElementById('resultadoGrafo').textContent,
      resolverDeshabilitado: document.getElementById('btnResolverGrafo').disabled,
      focoVisible: document.activeElement.getBoundingClientRect().top >= document.querySelector('.topbar').getBoundingClientRect().bottom - 1
    };
  });
  comprobar(datos.sinDesborde, etiqueta + '/' + nombre + ': sin desplazamiento horizontal de la página');
  comprobar(datos.activa === nombre && datos.navLegible, etiqueta + '/' + nombre + ': navegación identificable y sin solapes');
  comprobar(datos.focoVisible, etiqueta + '/' + nombre + ': encabezado enfocado visible bajo la barra fija');
  comprobar(datos.editor === (nombre === 'grafo') && datos.config === (nombre === 'configuracion') && datos.procedimiento === (nombre === 'procedimiento') && datos.resultado === (nombre === 'resultado'), etiqueta + '/' + nombre + ': solo la tarea de la etapa actual');
  if (vacio && nombre === 'configuracion') comprobar(datos.resolverDeshabilitado, etiqueta + ': calcular vacío está deshabilitado');
  if (nombre === 'procedimiento') comprobar(datos.explicacion.trim().length > 20, etiqueta + ': explicación del procedimiento disponible');
  if (nombre === 'resultado') comprobar(datos.textoResultado.trim().length > 20, etiqueta + ': resultado o guía para obtenerlo disponible');
}

async function captura(page, modulo, ancho, tema, nombre) {
  if (!CAPTURAS) return;
  const elegidas = new Set([
    'dijkstra-320-oscuro-grafo', 'kruskal-390-claro-configuracion',
    'dijkstra-390-claro-procedimiento', 'kruskal-1440-oscuro-procedimiento',
    'dijkstra-768-oscuro-resultado', 'kruskal-320-claro-resultado'
  ]);
  const id = [modulo, ancho, tema, nombre].join('-');
  if (!elegidas.has(id)) return;
  await page.evaluate(paginaCompleta => {
    document.querySelector('#toastStack')?.replaceChildren();
    const guia = document.querySelector('.gm-guia-etapa');
    window.scrollTo({ top: paginaCompleta ? 0 : Math.max(0, (guia?.getBoundingClientRect().top || 0) + scrollY - 80), behavior: 'instant' });
  }, ancho < 1000);
  await fotograma(page);
  const salida = path.join(__dirname, '..', 'docs', 'capturas', 'revision-' + id + '.png');
  await page.screenshot({ path: salida, fullPage: ancho < 1000 });
  console.log('  Captura: ' + path.relative(path.join(__dirname, '..'), salida));
}

async function revisarMatriz(browser) {
  for (const modulo of ['dijkstra', 'kruskal']) {
    for (const [ancho, alto] of TAMANOS) for (const tema of ['claro', 'oscuro']) {
      const etiqueta = modulo + '-' + ancho + '-' + tema;
      if (SOLO_CASO && SOLO_CASO !== etiqueta) continue;
      const contexto = await browser.createBrowserContext();
      const page = await contexto.newPage();
      page.setDefaultTimeout(8000);
      page.on('pageerror', e => errores.push(modulo + ': ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errores.push(modulo + ': ' + m.text()); });
      await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: tema === 'claro' ? 'light' : 'dark' }]);
      const respuesta = await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
      comprobar(respuesta.status() === 200, etiqueta + ': página disponible');
      comprobar(await page.$eval('html', e => e.dataset.tema) === tema, etiqueta + ': tema solicitado');
      comprobar(await page.$$eval('.topbar button, .topbar a', controles => {
        const cajas = controles.filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect());
        return cajas.every(r => r.left >= -1 && r.right <= innerWidth + 1) && !cajas.some((a, i) => cajas.slice(i + 1).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
      }), etiqueta + ': botones de la barra superior sin solapes');
      if (ancho < 1024) {
        await clic(page, '#btnMenuLateral');
        await page.waitForFunction(() => document.body.classList.contains('nav-abierta'));
        await page.waitForFunction(() => document.getElementById('barraLateral').getBoundingClientRect().left >= -1);
        comprobar(await page.$eval('#barraLateral', e => {
          const r = e.getBoundingClientRect();
          return r.left >= -1 && r.right <= innerWidth + 1;
        }), etiqueta + ': menú lateral cabe en la pantalla');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.body.classList.contains('nav-abierta'));
      }
      for (const nombre of VISTAS) await revisarVista(page, etiqueta + '/vacío', nombre, true);
      await vista(page, 'grafo');
      const vacio = await geometria(page);
      comprobar(vacio.textos.some(t => t.texto.trim().length > 15) && vacio.textoVacioDentro && vacio.textoMinimo >= 13.9, etiqueta + ': ayuda del lienzo vacío completamente visible y legible');
      await clic(page, '#btnEjemploGrafo');
      await page.waitForFunction(() => moduloGrafo.grafo.nodos.length > 0);
      await clic(page, '#btnAjustarGrafo');
      const grafo = await geometria(page);
      comprobar(grafo.todosDentro && grafo.width <= ancho && grafo.height >= 240, etiqueta + ': ejemplo completo dentro del lienzo');
      comprobar(grafo.textoMinimo >= 13.9 && grafo.diametroMinimo >= 43.9, etiqueta + ': etiquetas y objetivos del grafo legibles');
      comprobar(await pesosSeparados(page), etiqueta + ': pesos del ejemplo sin etiquetas superpuestas');
      await captura(page, modulo, ancho, tema, 'grafo');
      await revisarVista(page, etiqueta + '/ejemplo', 'grafo', false);
      await clic(page, '#btnContinuarGrafo');
      comprobar(await page.evaluate(() => moduloGrafo.vista === 'configuracion' && document.activeElement.id === 'tituloConfigGrafo'), etiqueta + ': Continuar lleva a configurar con foco');
      await revisarVista(page, etiqueta + '/ejemplo', 'configuracion', false);
      await captura(page, modulo, ancho, tema, 'configuracion');
      await clic(page, '#btnResolverGrafo');
      await page.waitForFunction(() => !!moduloGrafo.resultado);
      comprobar(await page.evaluate(() => moduloGrafo.vista === 'procedimiento' && document.activeElement.id === 'tituloEtapaGrafo'), etiqueta + ': Calcular abre el procedimiento con foco');
      await revisarVista(page, etiqueta + '/ejemplo', 'procedimiento', false);
      const pasoAntes = await page.evaluate(() => moduloGrafo.paso);
      await clic(page, '#btnSiguienteGrafo');
      comprobar(await page.evaluate(p => moduloGrafo.paso === p + 1, pasoAntes), etiqueta + ': Siguiente cambia el paso');
      comprobar(await page.evaluate(() => document.activeElement.id === 'btnSiguienteGrafo'), etiqueta + ': avanzar conserva el foco en el control');
      await clic(page, '#btnAnteriorGrafo');
      comprobar(await page.evaluate(p => moduloGrafo.paso === p, pasoAntes), etiqueta + ': Anterior recupera el paso');
      const contenido = await page.evaluate(() => {
        const b = s => document.querySelector(s).getBoundingClientRect();
        const grafico = b('#svgModuloGrafo'), control = b('.gm-cinta'), texto = b('#explicacionPasoGrafo');
        const tabla = b('.gm-tabla-caja'), encabezados = [...document.querySelectorAll('#tablaEstadoGrafo th')].map(e => e.getBoundingClientRect());
        const distancia = texto.top > grafico.bottom ? texto.top - grafico.bottom : Math.max(0, grafico.top - texto.bottom);
        return { distancia, separacionControles: Math.abs(control.top - grafico.top),
          tablaVisible: encabezados.every(r => r.left >= tabla.left - 1 && r.right <= tabla.right + 1),
          cantidadColumnas: encabezados.length };
      });
      comprobar(contenido.distancia < alto / 2 && contenido.separacionControles < alto, etiqueta + ': controles y explicación cercanos al dibujo');
      comprobar(contenido.tablaVisible && contenido.cantidadColumnas === (modulo === 'dijkstra' ? 4 : 3), etiqueta + ': todas las columnas del procedimiento caben');
      if (modulo === 'dijkstra') { await clic(page, '#btnSiguienteGrafo'); await clic(page, '#btnSiguienteGrafo'); }
      else await clic(page, '#btnUltimoGrafo');
      comprobar(await page.$$eval('#tablaEstadoGrafo th, #tablaEstadoGrafo td', celdas => celdas.every(e => e.scrollWidth <= e.clientWidth + 1)), etiqueta + ': texto completo de cada celda cabe sin recortarse');
      comprobar(await pesosSeparados(page), etiqueta + ': pesos del procedimiento sin etiquetas superpuestas');
      await captura(page, modulo, ancho, tema, 'procedimiento');
      await clic(page, '#btnVerResultadoGrafo');
      comprobar(await page.evaluate(() => moduloGrafo.vista === 'resultado'), etiqueta + ': Ver resultado abre su etapa');
      await revisarVista(page, etiqueta + '/ejemplo', 'resultado', false);
      await captura(page, modulo, ancho, tema, 'resultado');
      await clic(page, '#btnRevisarProcedimiento');
      comprobar(await page.evaluate(() => moduloGrafo.vista === 'procedimiento'), etiqueta + ': resultado permite volver al procedimiento');
      console.log('  ✓ ' + etiqueta + ': vacío, ejemplo y las cuatro etapas');
      await contexto.close();
    }
  }
}

async function revisarEncuadres(browser) {
  for (const modulo of ['dijkstra', 'kruskal']) {
    const contexto = await browser.createBrowserContext();
    const page = await contexto.newPage();
    page.on('pageerror', e => errores.push(modulo + '/encuadre: ' + e.message));
    await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
    await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
    for (const caso of ['esquinas', 'uno', 'maximo']) {
      await page.evaluate(nombre => {
        const g = generarGrafoAleatorio(moduloGrafo.modulo, {
          cantidad: nombre === 'uno' ? 1 : nombre === 'esquinas' ? 4 : 24,
          aristas: nombre === 'maximo' ? 96 : 0, semilla: 1703
        });
        if (nombre === 'esquinas') g.nodos.forEach((n, i) => Object.assign(n, { x: i % 2 ? 970 : 30, y: i < 2 ? 30 : 570 }));
        aplicarDocumentoModuloGrafo({ version: 1, modulo: moduloGrafo.modulo, grafo: g,
          origen: g.nodos[0].id, destino: null, objetivo: 'min', vista: 'grafo', paso: 0, resuelto: false });
      }, caso);
      await clic(page, '#btnAjustarGrafo');
      const antes = await geometria(page);
      comprobar(antes.todosDentro && antes.textoMinimo >= 13.9 && antes.diametroMinimo >= (caso === 'maximo' ? 27.9 : 43.9), modulo + '/' + caso + ': encuadre completo y legible en 320');
      for (const ancho of [768, 390]) {
        await page.setViewport({ width: ancho, height: 900, deviceScaleFactor: 1 });
        const adaptado = await geometria(page);
        comprobar(adaptado.todosDentro && adaptado.textoMinimo >= 13.9, modulo + '/' + caso + ': reajusta al cambiar a ' + ancho);
      }
      if (caso === 'esquinas') {
        const antesZoom = await geometria(page);
        await clic(page, '#btnZoomMasGrafo');
        const ampliado = await geometria(page);
        comprobar(ampliado.viewBox !== antesZoom.viewBox, modulo + ': Acercar cambia el encuadre');
        await clic(page, '[data-pan-grafo="derecha"]');
        const desplazado = await geometria(page);
        comprobar(desplazado.viewBox !== ampliado.viewBox, modulo + ': desplazamiento del dibujo funcional');
        await page.select('#seleccionVertice', 'n1');
        await fotograma(page);
        const centrado = await page.$eval('#svgModuloGrafo .nodo-editor-grafo[data-id="n1"] circle', e => {
          const r = e.getBoundingClientRect(), svg = document.getElementById('svgModuloGrafo').getBoundingClientRect();
          return r.left >= svg.left - 1 && r.right <= svg.right + 1 && r.top >= svg.top - 1 && r.bottom <= svg.bottom + 1;
        });
        comprobar(centrado, modulo + ': selección por lista recupera el nodo tras zoom y desplazamiento');
        await clic(page, '#btnAjustarGrafo');
        comprobar((await geometria(page)).todosDentro, modulo + ': Ver todo recupera todos los nodos');
      }
      await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
    }
    await contexto.close();
  }
  console.log('  ✓ Encuadres: esquinas, un vértice, 24 vértices/96 aristas, cambio de ancho, zoom y selección');
}

(async () => {
  if (SOLO_CASO) assert.match(SOLO_CASO, /^(dijkstra|kruskal)-(320|390|768|1440)-(claro|oscuro)$/, 'Caso de revisión desconocido');
  // Un puerto abierto no demuestra que sirva este directorio.
  const respuesta = await fetch(BASE + 'dijkstra.html');
  comprobar(respuesta.ok && await respuesta.text() === fs.readFileSync(path.join(__dirname, '..', 'dijkstra.html'), 'utf8'), 'Servidor local corresponde al proyecto');
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    await revisarMatriz(browser);
    if (!SOLO_CASO) await revisarEncuadres(browser);
    comprobar(errores.length === 0, 'Sin errores JavaScript ni de consola');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(() => {
  errores.forEach(error => console.error(error));
  if (errores.length) process.exitCode = 1;
  console.log('\nUsabilidad de grafos: ' + correctas + ' comprobaciones correctas; errores de consola/página: ' + errores.length);
});
