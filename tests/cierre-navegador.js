/* Cierre transversal en Edge/Chromium real headless. Cada módulo/tema usa un
 * contexto incógnito independiente; nunca se toca el perfil del usuario.
 * node tests/cierre-navegador.js [--capturas] [--modulo=johnson]
 * El reflow al 200 % y los gestos táctiles son emulados, no teléfonos físicos.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert/strict');
const { pathToFileURL } = require('url');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CAPTURAS = process.argv.includes('--capturas');
const SOLO_TACTIL = process.argv.includes('--tactil');
const SOLO = process.argv.find(a => a.startsWith('--modulo='))?.split('=')[1];
const TAMANOS = [[320, 800], [375, 812], [390, 844], [768, 1024], [1024, 900], [1440, 950], [844, 390]];
const MODULOS = ['index', 'johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest', 'ordenamiento', 'arboles'];
const fallos = [], errores = [];
let correctas = 0;

function limpiarTemporal(directorio) {
  const destino = path.resolve(directorio);
  if (path.dirname(destino) !== path.resolve(os.tmpdir()) || !path.basename(destino).startsWith('algoritmos-cierre-')) throw new Error('Directorio temporal inesperado');
  fs.rmSync(destino, { recursive: true, force: true });
}

function comprobar(condicion, etiqueta, detalle) {
  if (condicion) correctas++;
  else { fallos.push(etiqueta + (detalle ? ': ' + JSON.stringify(detalle) : '')); console.error('  ✗ ' + fallos.at(-1)); }
}

async function fotograma(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function clic(page, selector) {
  await page.$eval(selector, e => {
    for (let p = e.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.click(selector);
  await fotograma(page);
}

async function revisarGeometria(page, etiqueta) {
  await fotograma(page);
  const medidas = await page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const visibles = [...document.querySelectorAll('body *')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
    });
    const fuera = visibles.filter(e => {
      if (e.closest('svg, .sidebar, [hidden]')) return false;
      const r = e.getBoundingClientRect();
      if (r.right <= ancho + 1 && r.left >= -1) return false;
      for (let p = e.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowX)) return false;
      }
      return true;
    }).slice(0, 8).map(e => ({ tag: e.tagName, id: e.id, clase: e.className, texto: e.textContent.slice(0, 55) }));
    const erroresCrudos = visibles.filter(e => e.children.length === 0 && /^(NaN|undefined|\[object Object\])$/.test(e.textContent.trim())).map(e => e.textContent);
    const botonesCortados = [...document.querySelectorAll('.arbol-campos .btn')].filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
    const costo = document.getElementById('nwCostoTotal');
    const altoCosto = costo?.getClientRects().length ? costo.getBoundingClientRect().height : 0;
    const modulo = document.body.dataset.modulo;
    const metodoCoherente = modulo !== 'ordenamiento' || document.querySelector('[data-algoritmo][aria-pressed="true"]')?.dataset.algoritmo === E.algoritmo;
    return { ancho, scroll: document.documentElement.scrollWidth, fuera, erroresCrudos, botonesCortados, altoCosto, modulo, metodoCoherente };
  });
  comprobar(medidas.scroll <= medidas.ancho + 1, etiqueta + ' sin desborde de página', medidas.scroll > medidas.ancho + 1 ? medidas : null);
  comprobar(!medidas.erroresCrudos.length, etiqueta + ' sin valores técnicos visibles', medidas.erroresCrudos);
  if (medidas.modulo === 'arboles') comprobar(!medidas.botonesCortados.length, etiqueta + ' botones de edición completos', medidas.botonesCortados);
  if (medidas.modulo === 'northwest' && medidas.ancho <= 640 && medidas.altoCosto) comprobar(medidas.altoCosto < 120, etiqueta + ' costo total compacto en móvil', medidas.altoCosto);
  if (medidas.modulo === 'ordenamiento') comprobar(medidas.metodoCoherente, etiqueta + ' pestaña y procedimiento corresponden al método actual');
}

async function revisarTamanos(page, etiqueta) {
  async function datos() {
    return page.evaluate(() => {
      const m = document.body.dataset.modulo;
      if (m === 'johnson') return JSON.stringify({ nodos: estado.nodos, conexiones: estado.conexiones, vista: estadoJohnson.vista, distancias: estadoJohnson.resultado?.distancias });
      if (m === 'dijkstra' || m === 'kruskal') return JSON.stringify({ grafo: moduloGrafo.grafo, vista: moduloGrafo.vista, paso: moduloGrafo.paso, resultado: !!moduloGrafo.resultado });
      if (m === 'asignacion') return JSON.stringify({ modelo: estadoAsignacion.modelo, vista: estadoAsignacion.vista, total: estadoAsignacion.resultado?.datos.total, paso: estadoAsignacion.resultado?.pasoActual });
      if (m === 'northwest') return JSON.stringify({ modelo: estadoNorthwest.modelo, vista: estadoNorthwest.vista, total: estadoNorthwest.resultado?.datos.costoTotal, paso: estadoNorthwest.resultado?.pasoActual });
      if (m === 'ordenamiento') return JSON.stringify({ valores: E.valores, algoritmo: E.algoritmo, paso: E.pasoActual, historial: E.historial.length });
      if (m === 'arboles') return JSON.stringify({ raiz: arbol.raiz, modo: arbol.modo, paso: arbol.pasoRecorrido });
      return 'inicio';
    });
  }
  const antes = await datos();
  for (const [width, height] of TAMANOS) {
    await page.setViewport({ width, height, deviceScaleFactor: 1, hasTouch: false });
    await revisarGeometria(page, etiqueta + '/' + width + 'x' + height);
  }
  comprobar(await datos() === antes, etiqueta + '/redimensionado conserva datos, resultado y paso');
}

async function prepararEjemplo(page, modulo) {
  if (modulo === 'index') return;
  if (['dijkstra', 'kruskal'].includes(modulo)) await clic(page, '#btnEjemploRapidoGrafo');
  if (modulo === 'asignacion') await clic(page, '#btnVacioEjemplo');
  if (modulo === 'arboles') await clic(page, '#btnEjemploInsercion');
  if (modulo === 'northwest') await page.evaluate(() => aplicarCambioNorthwest((m, e) => { e.modelo = ejemploNorthwest('balanceado'); }, { motivo: 'ejemplo' }));
  if (modulo === 'johnson') await page.evaluate(() => aplicarEjemploJohnson(ejemploJohnsonPorId('negativos')));
  if (modulo === 'ordenamiento') await page.evaluate(() => fijarValores([9, 4, 7, 1, 5]));
}

async function resolverEjemplo(page, modulo) {
  if (['dijkstra', 'kruskal'].includes(modulo)) {
    await clic(page, '#btnContinuarGrafo');
    await clic(page, '#btnResolverGrafo');
    await page.waitForFunction(() => !moduloGrafo.preparando && !!moduloGrafo.resultado);
  }
  if (modulo === 'johnson') await page.evaluate(() => calcularYMostrarJohnson());
  if (modulo === 'asignacion') await page.evaluate(() => resolverAsignacion());
  if (modulo === 'northwest') await page.evaluate(() => resolverNorthwestCompleto());
  if (modulo === 'arboles') await clic(page, '#btnRecorridoSiguiente');
  if (modulo === 'ordenamiento') await clic(page, '#btnSiguiente');
}

async function cambiarVista(page, modulo, vista) {
  await page.evaluate((m, v) => {
    if (m === 'johnson') cambiarVistaJohnson(v);
    if (m === 'asignacion') cambiarVistaAsignacion(v);
    if (m === 'northwest') cambiarVistaNorthwest(v);
    if (m === 'dijkstra' || m === 'kruskal') cambiarVistaModuloGrafo(v);
    if (m === 'ordenamiento') irAPaso(v === 'resultado' ? E.historial.length - 1 : Math.min(4, E.historial.length - 1));
    if (m === 'arboles') { if (v === 'resultado') { arbol.pasoRecorrido = arbol.historialRecorrido.length; actualizarVisualArbol(); } }
  }, modulo, vista);
}

async function revisarAyuda(page, modulo, tema) {
  const boton = { asignacion: '#btnAyudaAsignacion', northwest: '#btnAyudaNw' }[modulo] || '#btnAyuda';
  for (const [width, height] of [[320, 800], [844, 390], [1440, 950]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1, hasTouch: false });
    if (width < 1024) {
      await clic(page, '#btnMenuLateral');
      await clic(page, '.sidebar__acceso-modulo:last-child');
    } else await clic(page, boton);
    const datos = await page.evaluate(() => {
      const caja = [...document.querySelectorAll('[aria-modal="true"]')].find(e => e.getClientRects().length);
      const r = caja?.getBoundingClientRect();
      return { abierta: !!caja, foco: !!caja?.contains(document.activeElement), cabe: r && r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1,
        caja: r && { top: r.top, bottom: r.bottom, height: r.height } };
    });
    comprobar(datos.abierta && datos.foco && datos.cabe, modulo + '/' + tema + '/ayuda-' + width + ' cabe y recibe foco', datos);
    await page.keyboard.press('Tab');
    comprobar(await page.evaluate(() => [...document.querySelectorAll('[aria-modal="true"]')].some(e => e.getClientRects().length && e.contains(document.activeElement))), modulo + '/ayuda contiene Tab');
    await page.keyboard.press('Escape');
    comprobar(await page.evaluate(() => ![...document.querySelectorAll('[aria-modal="true"]')].some(e => e.getClientRects().length)), modulo + '/Escape cierra ayuda');
    comprobar(await page.evaluate(id => document.activeElement.id === id, width < 1024 ? 'btnMenuLateral' : boton.slice(1)), modulo + '/ayuda devuelve foco');
  }
}

async function revisarMaximo(page, modulo) {
  if (modulo === 'ordenamiento') await clic(page, '[data-algoritmo="bubble"]');
  await page.evaluate(async m => {
    if (m === 'asignacion') {
      aplicarCambioAsignacion((anterior, e) => {
        const nuevo = crearModeloAsignacion();
        for (let i = 0; i < 8; i++) { agregarRecurso(nuevo, 'Recurso largo número ' + i); agregarTarea(nuevo, 'Tarea extensa número ' + i); }
        nuevo.recursos.forEach((r, i) => nuevo.tareas.forEach((t, j) => fijarValorAsignacion(nuevo, r.id, t.id, i - j)));
        e.modelo = nuevo;
      });
      resolverAsignacion(); cambiarVistaAsignacion('matriz');
    }
    if (m === 'northwest') {
      aplicarCambioNorthwest((anterior, e) => {
        const nuevo = crearModeloNorthwest();
        for (let i = 0; i < 10; i++) { agregarOrigen(nuevo, 'Origen extenso para revisar etiquetas ' + i, 10); agregarDestino(nuevo, 'Destino largo para revisar etiquetas ' + i, 10); }
        nuevo.origenes.forEach((r, i) => nuevo.destinos.forEach((t, j) => { nuevo.costos[claveNorthwest(r.id, t.id)] = (i + j) * 100; }));
        e.modelo = nuevo;
      });
      resolverNorthwestCompleto(); cambiarVistaNorthwest('datos');
    }
    if (m === 'dijkstra' || m === 'kruskal') {
      const g = generarGrafoAleatorio(m, { cantidad: 24, aristas: 96, semilla: 1703 });
      g.nodos.forEach((n, i) => { n.nombre = 'NombreLarg' + String(i).padStart(2, '0'); });
      aplicarDocumentoModuloGrafo({ version: 1, modulo: m, grafo: g, origen: g.nodos[0].id, destino: null, objetivo: 'min', vista: 'grafo', paso: 0, resuelto: false });
    }
    if (m === 'arboles') aplicarNuevoArbol(crearArbolBusqueda(Array.from({ length: 31 }, (_, i) => i)), 'busqueda', Array.from({ length: 31 }, (_, i) => i));
    if (m === 'ordenamiento') await fijarValores(Array.from({ length: 200 }, (_, i) => 99 - i % 99));
    if (m === 'johnson') {
      const nodos = Array.from({ length: 40 }, (_, i) => ({ id: 'n' + i, nombre: 'NombreLarg' + String(i).padStart(2, '0'), x: 80 + i % 8 * 110, y: 80 + Math.floor(i / 8) * 110 }));
      const conexiones = [];
      for (let i = 0; i < nodos.length; i++) for (let j = i + 1; j < nodos.length && conexiones.length < 300; j++) conexiones.push({ id: 'c' + conexiones.length, desde: nodos[i].id, hacia: nodos[j].id, valor: j - i });
      aplicarGrafo({ nodos, conexiones, siguienteId: 341 }); guardar(); dibujar(); cambiarVistaJohnson('grafo');
    }
  }, modulo);
  await revisarTamanos(page, modulo + '/máximo-nombres-largos');
}

async function revisarZoomPresentacion(page, modulo, tema) {
  // Reflow equivalente a una ventana 1440x950 al 200 %. CSS zoom y el gesto
  // pinch no equivalen al zoom del navegador: no cambian sus media queries.
  await page.setViewport({ width: 720, height: 475, deviceScaleFactor: 2 });
  await revisarGeometria(page, modulo + '/' + tema + '/viewport-equivalente-200%');
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  if (modulo !== 'index') {
    await clic(page, '#btnPresentacion');
    comprobar(await page.evaluate(() => document.body.classList.contains('presentacion')), modulo + '/modo presentación abre');
    await revisarGeometria(page, modulo + '/' + tema + '/presentación');
    await page.keyboard.press('Escape');
    comprobar(await page.evaluate(() => !document.body.classList.contains('presentacion')), modulo + '/Escape sale de presentación');
  }
}

async function revisarSalidas(page, modulo, tema) {
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  if (['johnson', 'dijkstra', 'kruskal', 'asignacion', 'arboles'].includes(modulo)) {
    if (modulo !== 'arboles') await cambiarVista(page, modulo, 'grafo');
    const datos = await page.evaluate(async m => {
      const ids = { johnson: 'svg', asignacion: 'svgAsignacion', arboles: 'svgArbol', dijkstra: 'svgModuloGrafo', kruskal: 'svgModuloGrafo' };
      const svg = document.getElementById(ids[m]) || document.querySelector(m === 'johnson' ? '.grafo-workspace svg' : '#vistaArbol svg');
      const original = URL.createObjectURL.bind(URL);
      let png = null;
      URL.createObjectURL = blob => { if (blob.type === 'image/png') png = blob; return original(blob); };
      try {
        await exportarSvgComoPng(svg, { nombre: 'cierre-' + m });
        const bytes = new Uint8Array(await png.arrayBuffer());
        const imagen = await createImageBitmap(png);
        const resultado = { firma: Array.from(bytes.slice(0, 8)), largo: bytes.length, ancho: imagen.width, alto: imagen.height };
        imagen.close(); return resultado;
      } finally { URL.createObjectURL = original; }
    }, modulo);
    comprobar(datos.firma.join(',') === '137,80,78,71,13,10,26,10' && datos.largo > 1000 && datos.ancho > 100 && datos.alto > 100, modulo + '/' + tema + '/PNG rasterizado real', datos);
  }
  const vistas = { johnson: 'resolucion', asignacion: 'procedimiento', northwest: 'resolucion', dijkstra: 'procedimiento', kruskal: 'procedimiento' };
  if (vistas[modulo]) await cambiarVista(page, modulo, vistas[modulo]);
  await page.evaluate(() => {
    window.cierreImpresion = null;
    window.addEventListener('beforeprint', () => {
      window.cierreImpresion = {
        pasos: document.querySelectorAll('#impresionPasos .impresion-paso').length,
        texto: document.getElementById('impresionPasos')?.textContent || '',
        tema: document.documentElement.dataset.tema
      };
    });
  });
  const antes = await page.evaluate(() => ({ tema: document.documentElement.dataset.tema, configurado: typeof configuracionImpresion !== 'undefined' && !!configuracionImpresion, paso: typeof configuracionImpresion !== 'undefined' && configuracionImpresion ? configuracionImpresion.actual() : null }));
  // Este protocolo conserva preferencias: emulateMediaType() de Puppeteer
  // manda media sin features y puede restaurar accidentalmente las del host.
  const sesionMedia = await page.createCDPSession();
  const preferencias = [{ name: 'prefers-color-scheme', value: tema === 'claro' ? 'light' : 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }];
  await sesionMedia.send('Emulation.setEmulatedMedia', { media: 'print', features: preferencias });
  const contraste = await page.evaluate(() => {
    const textos = [...document.querySelectorAll('.tarjeta__pista, .proc-texto, .gm-info, .modulo-cabecera p, #ideaAlgoritmo')].filter(e => e.getClientRects().length);
    return textos.map(e => {
      const rgb = getComputedStyle(e).color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (!rgb) return { texto: e.textContent.slice(0, 40), contraste: 0 };
      const lineal = rgb.map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
      const luminancia = .2126 * lineal[0] + .7152 * lineal[1] + .0722 * lineal[2];
      return { texto: e.textContent.slice(0, 40), contraste: 1.05 / (luminancia + .05) };
    });
  });
  comprobar(contraste.length > 0 && contraste.every(t => t.contraste >= 4.5), modulo + '/' + tema + '/explicaciones impresas con contraste de texto 4.5:1 sobre papel', contraste.filter(t => t.contraste < 4.5));
  await sesionMedia.send('Emulation.setEmulatedMedia', { media: '', features: preferencias });
  const pdf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
  await page.waitForFunction(() => !document.getElementById('impresionPasos') && document.documentElement.dataset.temaAnterior === undefined);
  await fotograma(page);
  const despues = await page.evaluate(() => ({ tema: document.documentElement.dataset.tema, paso: typeof configuracionImpresion !== 'undefined' && configuracionImpresion ? configuracionImpresion.actual() : null, temporal: !!document.getElementById('impresionPasos'), datos: window.cierreImpresion }));
  comprobar(pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 5000, modulo + '/' + tema + '/PDF nativo real');
  comprobar(antes.tema === despues.tema && antes.paso === despues.paso && !despues.temporal, modulo + '/' + tema + '/impresión restaura tema y paso', { antes: antes.tema, despues: despues.tema, paso: despues.paso, temporal: despues.temporal });
  if (antes.configurado) comprobar(despues.datos.pasos > 1 && despues.datos.tema === 'claro' && !/NaN|undefined/.test(despues.datos.texto), modulo + '/' + tema + '/impresión incluye pasos reales legibles', { pasos: despues.datos.pasos, tema: despues.datos.tema, errores: despues.datos.texto.match(/.{0,50}(NaN|undefined).{0,70}/g) });
  if (CAPTURAS && modulo === 'kruskal' && tema === 'claro') await capturarPdf(pdf);
}

async function capturarPdf(bytes) {
  // Herramientas de inspección opcionales en la misma carpeta temporal de QA;
  // no son dependencias de la aplicación ni se incorporan al repositorio.
  const carpeta = path.join(os.tmpdir(), 'grafo-e2e', 'node_modules');
  const canvas = require(path.join(carpeta, '@napi-rs', 'canvas'));
  global.DOMMatrix = canvas.DOMMatrix;
  global.ImageData = canvas.ImageData;
  global.Path2D = canvas.Path2D;
  const pdfjs = await import(pathToFileURL(path.join(carpeta, 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')).href);
  const carga = pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, standardFontDataUrl: path.join(carpeta, 'pdfjs-dist', 'standard_fonts').replace(/\\/g, '/') + '/' });
  const documento = await carga.promise;
  const primera = await documento.getPage(1);
  const viewport = primera.getViewport({ scale: 1.4 });
  const imagen = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await primera.render({ canvasContext: imagen.getContext('2d'), viewport }).promise;
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'capturas', 'cierre-impresion-kruskal-claro.png'), imagen.toBuffer('image/png'));
  const paginas = [];
  for (let i = 1; i <= documento.numPages; i++) paginas.push((await (await documento.getPage(i)).getTextContent()).items.map(e => e.str).join(' '));
  const texto = paginas.join('\n');
  comprobar(/Kruskal/.test(texto) && /Paso 1 de/.test(texto) && /Paso \d+ de \d+/.test(paginas.at(-1)) && !/undefined|NaN/.test(texto), 'PDF de Kruskal reabierto: pasos y texto hasta última página');
  console.log('  ✓ PDF Kruskal: ' + documento.numPages + ' páginas reabiertas, primera renderizada como PNG');
  await carga.destroy();
}

async function revisarTactil(browser) {
  for (const modulo of MODULOS.filter(m => !SOLO || m === SOLO)) {
    const contexto = await browser.createBrowserContext();
    const page = await contexto.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, hasTouch: true });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'load' });
    async function tocar(selector) {
      const caja = await page.$eval(selector, e => { e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.touchscreen.tap(caja.x, caja.y); await fotograma(page);
    }
    await tocar('#btnMenuLateral');
    comprobar(await page.evaluate(() => document.body.classList.contains('nav-abierta')), modulo + '/toque emulado abre menú');
    await tocar('.sidebar__cerrar');
    comprobar(await page.evaluate(() => !document.body.classList.contains('nav-abierta')), modulo + '/toque emulado cierra menú');
    if (modulo === 'dijkstra' || modulo === 'kruskal') {
      await tocar('#btnEjemploRapidoGrafo');
      comprobar(await page.evaluate(esperados => moduloGrafo.grafo.nodos.length === esperados, modulo === 'dijkstra' ? 5 : 4), modulo + '/toque carga ejemplo');
    }
    if (modulo === 'johnson') await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, hasTouch: true });
    await page.evaluate(() => scrollTo(0, 0));
    const antes = await page.evaluate(() => scrollY);
    const alto = await page.evaluate(() => innerHeight);
    const sesion = await page.createCDPSession();
    await sesion.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 4, y: alto - 30 }] });
    for (let i = 1; i <= 8; i++) await sesion.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 4, y: alto - 30 - i * (alto - 180) / 8 }] });
    await sesion.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await fotograma(page);
    const despues = await page.evaluate(() => ({ scroll: scrollY, maximo: document.documentElement.scrollHeight - innerHeight }));
    comprobar(despues.maximo <= 1 || despues.scroll > antes, modulo + '/gesto fuera del lienzo permite desplazar página', despues);
    await contexto.close();
  }
}

async function revisarContrasteRutaJohnson(page, tema) {
  await page.evaluate(() => seleccionarCeldaJohnson(0, 2));
  const contrastes = await page.$$eval('#vistaResultadoJn .nodo-johnson', grupos => {
    function luminancia(color) {
      const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
      return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
    }
    return grupos.map(g => {
      const texto = g.querySelector('text'), circulo = g.querySelector('circle');
      const fondo = luminancia(getComputedStyle(circulo).fill), letra = luminancia(getComputedStyle(texto).fill);
      return { nombre: texto.textContent, contraste: (Math.max(fondo, letra) + .05) / (Math.min(fondo, letra) + .05) };
    });
  });
  comprobar(contrastes.length === 4 && contrastes.every(c => c.contraste >= 4.5), 'Johnson/' + tema + '/ruta seleccionada con nombres legibles', contrastes);
}

async function revisarErroresAvisos(page, modulo) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  if (['dijkstra', 'kruskal'].includes(modulo)) {
    await cambiarVista(page, modulo, 'grafo');
    const antes = await page.evaluate(() => JSON.stringify(moduloGrafo.grafo));
    await page.$eval('#nombreVertice', e => { e.value = ''; });
    await clic(page, '#btnCrearVertice');
    comprobar(await page.evaluate(() => JSON.stringify(moduloGrafo.grafo)) === antes, modulo + '/error conserva grafo');
  }
  if (modulo === 'ordenamiento') {
    const antes = await page.evaluate(() => E.valores.join(','));
    await page.$eval('#entradaValores', e => { e.value = '1, dato inválido, 3'; });
    await clic(page, '#btnAplicar');
    comprobar(await page.evaluate(() => E.valores.join(',')) === antes && await page.$eval('#errorEntrada', e => !!e.textContent), modulo + '/error conserva lista y explica el campo');
  }
  if (modulo === 'arboles') {
    const antes = await page.evaluate(() => JSON.stringify(arbol.raiz));
    await page.$eval('#valorNodo', e => { e.value = '9999'; });
    await clic(page, '#formInsertar button[type="submit"]');
    comprobar(await page.evaluate(() => JSON.stringify(arbol.raiz)) === antes && await page.$eval('#errorInsercion', e => !!e.textContent), modulo + '/error conserva árbol y explica el campo');
  }
  await revisarTamanos(page, modulo + '/error');
  const avisoCreado = await page.evaluate(() => {
    protegerGuardadoIncompatible('cierre.qa.aislado', '{"version":99}', 'El documento anterior usa una versión incompatible. Revisa y conserva la copia antes de reemplazarlo.');
    return document.querySelectorAll('.aviso-almacenamiento').length;
  });
  comprobar(avisoCreado > 0, modulo + '/recuperación muestra aviso persistente');
  await revisarTamanos(page, modulo + '/aviso-recuperación');
  const aviso = await page.evaluate(() => { const e = document.querySelector('.aviso-almacenamiento'); if (!e) return { existe: false }; const r = e.getBoundingClientRect(); return { existe: true, alto: r.height, pantalla: innerHeight, botones: e.querySelectorAll('button').length }; });
  comprobar(aviso.existe && aviso.alto <= aviso.pantalla * .33 && aviso.botones === 2, modulo + '/recuperación acotada con acciones accesibles', aviso);
}

async function capturar(page, modulo, tema, estado) {
  if (!CAPTURAS) return;
  const casos = new Set(['index/oscuro/ejemplo', 'johnson/claro/resultado', 'dijkstra/oscuro/resultado', 'kruskal/claro/resultado', 'asignacion/oscuro/resultado', 'northwest/claro/resultado', 'ordenamiento/oscuro/máximo', 'arboles/claro/máximo']);
  if (!casos.has(modulo + '/' + tema + '/' + estado)) return;
  const movil = ['index', 'dijkstra', 'northwest', 'ordenamiento'].includes(modulo);
  await page.setViewport({ width: movil ? 390 : 1440, height: movil ? 844 : 950, deviceScaleFactor: 1 });
  if (modulo === 'johnson' && estado === 'resultado') await page.evaluate(() => seleccionarCeldaJohnson(0, 2));
  await page.waitForFunction(() => ![...document.querySelectorAll('.toast-stack .toast')].some(e => e.getClientRects().length), { timeout: 5000 });
  await page.evaluate(() => scrollTo(0, 0));
  await fotograma(page);
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'capturas', 'cierre-' + modulo + '-' + tema + '-' + (movil ? '390' : '1440') + '.png'), fullPage: true });
}

(async () => {
  const respuesta = await fetch(BASE + 'index.html');
  assert.equal(await respuesta.text(), fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), 'El servidor debe servir este proyecto');
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    console.log('Navegador: ' + await browser.version() + '; contextos incógnitos aislados');
    for (const modulo of MODULOS.filter(m => !SOLO_TACTIL && (!SOLO || m === SOLO))) for (const tema of ['oscuro', 'claro']) {
      const contexto = await browser.createBrowserContext();
      const page = await contexto.newPage();
      let navegaciones = 0;
      page.on('framenavigated', frame => { if (frame === page.mainFrame()) navegaciones++; });
      const descargas = fs.mkdtempSync(path.join(os.tmpdir(), 'algoritmos-cierre-'));
      await (await page.createCDPSession()).send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: descargas });
      page.on('pageerror', e => errores.push(modulo + '/' + tema + ': ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errores.push(modulo + '/' + tema + ': ' + m.text()); });
      await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: tema === 'claro' ? 'light' : 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'load' });
      await page.evaluate(m => {
        if (m === 'asignacion') aplicarCambioAsignacion((modelo, e) => { e.modelo = crearModeloAsignacion(); });
        if (m === 'northwest') aplicarCambioNorthwest((modelo, e) => { e.modelo = crearModeloNorthwest(); });
      }, modulo);
      await revisarTamanos(page, modulo + '/' + tema + '/inicial');
      await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
      await prepararEjemplo(page, modulo);
      await revisarTamanos(page, modulo + '/' + tema + '/ejemplo');
      await capturar(page, modulo, tema, 'ejemplo');
      if (modulo !== 'index') {
        await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
        await resolverEjemplo(page, modulo);
        const vistas = { johnson: ['matriz', 'resolucion', 'resultado'], asignacion: ['matriz', 'procedimiento', 'resultado'], northwest: ['balanceo', 'resolucion', 'resultado'], dijkstra: ['configuracion', 'procedimiento', 'resultado'], kruskal: ['configuracion', 'procedimiento', 'resultado'] }[modulo] || ['procedimiento', 'resultado'];
        for (const vista of vistas) {
          await cambiarVista(page, modulo, vista);
          if (modulo === 'johnson' && vista === 'resultado') await revisarContrasteRutaJohnson(page, tema);
          await revisarTamanos(page, modulo + '/' + tema + '/' + vista);
          if (vista === 'resultado') await capturar(page, modulo, tema, 'resultado');
        }
        await revisarSalidas(page, modulo, tema);
        await revisarAyuda(page, modulo, tema);
        await revisarMaximo(page, modulo); await capturar(page, modulo, tema, 'máximo');
        await revisarErroresAvisos(page, modulo);
      }
      await revisarZoomPresentacion(page, modulo, tema);
      comprobar(navegaciones === 1, modulo + '/' + tema + '/redimensionado conserva documento sin recargas', { navegaciones });
      console.log('  ✓ Recorrido ' + modulo + '/' + tema);
      await contexto.close();
      limpiarTemporal(descargas);
    }
    await revisarTactil(browser);
  } finally { await browser.close(); }
  comprobar(!errores.length, 'Sin excepciones ni errores de consola', errores);
  console.log('\nCierre: ' + correctas + ' comprobaciones correctas; ' + fallos.length + ' fallidas; ' + errores.length + ' errores JavaScript/consola.');
  if (fallos.length) process.exitCode = 1;
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
