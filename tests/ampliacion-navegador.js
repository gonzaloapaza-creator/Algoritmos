/* QA dirigida de la ampliación; reutiliza Edge, Puppeteer y el servidor existentes.
 * node tests/ampliacion-navegador.js [--capturas] [--ciudad|--grafos|--ordenamiento|--transferencias]
 * Capturas nuevas únicamente: docs/capturas/ampliacion-*.png. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CAPTURAS = process.argv.includes('--capturas');
const SOLO_CIUDAD = process.argv.includes('--ciudad');
const SOLO_GRAFOS = process.argv.includes('--grafos');
const SOLO_ORDENAMIENTO = process.argv.includes('--ordenamiento');
const SOLO_TRANSFERENCIAS = process.argv.includes('--transferencias');
const TAMANOS = [[320, 'oscuro'], [390, 'claro'], [768, 'claro'], [1440, 'oscuro']];
const directorio = fs.mkdtempSync(path.join(os.tmpdir(), 'algoritmos-ampliacion-'));
const errores = [];
let correctas = 0;

function comprobar(condicion, mensaje) {
  assert.ok(condicion, mensaje);
  correctas++;
  console.log('  ✓ ' + mensaje);
}

async function escribir(page, selector, valor) {
  await page.$eval(selector, (elemento, texto) => {
    elemento.value = String(texto);
    elemento.dispatchEvent(new Event('input', { bubbles: true }));
  }, valor);
}

async function clic(page, selector) {
  // Las herramientas secundarias se revelan desde su resumen antes de usarlas.
  await page.$eval(selector, elemento => {
    const contenedores = [];
    for (let padre = elemento.parentElement; padre; padre = padre.parentElement) {
      if (padre.tagName === 'DETAILS' && !padre.open) contenedores.unshift(padre);
    }
    contenedores.forEach(detalle => detalle.querySelector('summary').click());
  });
  await page.$eval(selector, elemento => elemento.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }));
  return page.click(selector);
}

async function sinDesborde(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function confirmar(page, esperarCierre = true) {
  await page.waitForSelector('#dialogoFondo:not([hidden])', { visible: true });
  await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
  await clic(page, '#dialogoAceptar');
  if (esperarCierre) await page.waitForSelector('#dialogoFondo[hidden]', { hidden: true });
}

async function abrir(browser, pagina, ancho = 1440, tema = 'oscuro') {
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  await page.setViewport({ width: ancho, height: ancho === 768 ? 1024 : 950, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: tema === 'claro' ? 'light' : 'dark' }]);
  page.on('pageerror', error => errores.push(pagina + ': ' + error.message));
  page.on('console', mensaje => { if (mensaje.type() === 'error') errores.push(pagina + ': ' + mensaje.text()); });
  const respuesta = await page.goto(BASE + pagina + '.html?intro=no', { waitUntil: 'networkidle0' });
  comprobar(respuesta.status() === 200, 'URL directa disponible: ' + pagina);
  return page;
}

async function vista(page, nombre) {
  await clic(page, '[data-vista-grafo="' + nombre + '"]');
  await page.waitForFunction(esperada => moduloGrafo.vista === esperada, {}, nombre);
}

async function ejemplo(page, nombre = 'obligatorio') {
  await vista(page, 'grafo');
  await page.select('#ejemploGrafo', nombre);
  const habiaDatos = await page.evaluate(() => moduloGrafo.grafo.nodos.length > 0);
  await clic(page, '#btnEjemploGrafo');
  if (habiaDatos) await confirmar(page);
  await page.waitForFunction(() => moduloGrafo.grafo.nodos.length > 0 && !moduloGrafo.resultado);
}

async function resolver(page) {
  await vista(page, 'configuracion');
  await clic(page, '#btnResolverGrafo');
  await page.waitForFunction(() => !!moduloGrafo.resultado);
}

async function captura(page, nombre, objetivo) {
  if (!CAPTURAS) return;
  fs.mkdirSync(path.join(__dirname, '..', 'docs', 'capturas'), { recursive: true });
  await page.evaluate(() => document.querySelector('#toastStack')?.replaceChildren());
  if (objetivo) await page.$eval(objetivo, elemento => window.scrollTo({ top: elemento.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' }));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'capturas', 'ampliacion-' + nombre + '.png') });
}

async function revisarCiudad(browser) {
  for (const [ancho, tema] of TAMANOS) {
    const page = await abrir(browser, 'index', ancho, tema);
    await page.evaluate(() => { localStorage.removeItem('ui.inicio.vista.v1'); localStorage.removeItem('ui.tema.v1'); });
    await page.reload({ waitUntil: 'networkidle0' });
    comprobar(await page.$$eval('.ciudad-zona', zonas => zonas.length === 7), 'Siete zonas accesibles a ' + ancho);
    comprobar(await page.evaluate(() => agruparCatalogo().find(g => g.categoria.id === 'grafos').algoritmos.length === 3), 'Johnson, Dijkstra y Kruskal en Grafos y rutas');
    comprobar(await page.$$eval('.ciudad-etiqueta strong', etiquetas => etiquetas.every(e => parseFloat(getComputedStyle(e).fontSize) >= 12)), 'Nombres legibles a ' + ancho);
    comprobar(await sinDesborde(page), 'Ciudad sin desborde a ' + ancho + ' / ' + tema);
    const escenas = await page.$$eval('.ciudad-zona[data-distrito="grafos"] svg', elementos => elementos.map(e => e.innerHTML));
    comprobar(new Set(escenas).size === 3, 'Tres edificios de grafos visualmente distintos');
    for (const modulo of ['dijkstra', 'kruskal']) {
      await clic(page, '.ciudad-zona[data-modulo="' + modulo + '"]');
      comprobar(await page.$eval('#panelModulo a', (a, id) => a.getAttribute('href') === id + '.html', modulo), 'Panel enlaza a ' + modulo);
    }
    await captura(page, 'ciudad-' + ancho + '-' + tema, '#ciudadMapa');
    await clic(page, '#vistaLista');
    await page.waitForFunction(() => !document.getElementById('catalogo').hidden);
    comprobar(await page.$$eval('#catalogo .tarjeta-alg a', enlaces => enlaces.length === 7), 'Lista conserva siete accesos reales');
    const [nueva] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      clic(page, '#catalogo a[href="dijkstra.html"]')
    ]);
    comprobar(nueva.status() === 200 && await page.$eval('body', body => body.dataset.modulo === 'dijkstra'), 'La lista abre una página funcional');
    await page.close();
  }
}

async function revisarCrud(page, modulo) {
  // Punto de partida válido y vacío; todas las operaciones siguientes usan controles reales.
  await page.evaluate(() => aplicarDocumentoModuloGrafo({ version: 1, modulo: moduloGrafo.modulo,
    grafo: crearGrafoVacio(moduloGrafo.modulo === 'dijkstra'), origen: null, destino: null,
    objetivo: 'min', vista: 'grafo', paso: 0, resuelto: false }));
  for (const nombre of ['A', 'B', 'C']) {
    await escribir(page, '#nombreVertice', nombre);
    await clic(page, '#btnCrearVertice');
  }
  comprobar(await page.$$eval('#svgModuloGrafo .nodo-editor-grafo', nodos => nodos.length === 3), modulo + ': crear tres vértices desde formulario');
  const ids = await page.evaluate(() => moduloGrafo.grafo.nodos.map(n => n.id));
  await page.$eval('#svgModuloGrafo .nodo-editor-grafo[data-id="' + ids[0] + '"]', e => e.focus());
  await page.keyboard.press('Enter');
  comprobar(await page.evaluate(id => moduloGrafo.seleccion.id === id && document.activeElement.dataset.id === id, ids[0]), modulo + ': selección SVG por teclado conserva foco');
  await page.select('#seleccionVertice', ids[0]);
  await escribir(page, '#nombreSeleccionado', 'Origen');
  await clic(page, '#btnRenombrarVertice');
  comprobar(await page.evaluate(id => moduloGrafo.grafo.nodos.find(n => n.id === id).nombre === 'Origen', ids[0]), modulo + ': renombrar conserva el ID');
  for (const [desde, hacia, peso] of [[ids[0], ids[1], 0], [ids[1], ids[2], modulo === 'kruskal' ? -2 : 2]]) {
    await page.select('#aristaDesde', desde);
    await page.select('#aristaHacia', hacia);
    await escribir(page, '#pesoArista', peso);
    await clic(page, '#btnCrearArista');
  }
  comprobar(await page.evaluate(() => moduloGrafo.grafo.conexiones.length === 2), modulo + ': crear aristas admite cero' + (modulo === 'kruskal' ? ' y negativos' : ''));
  const primera = await page.evaluate(() => moduloGrafo.grafo.conexiones[0].id);
  await page.select('#seleccionArista', primera);
  await escribir(page, '#pesoSeleccionado', 3);
  await clic(page, '#btnEditarPeso');
  comprobar(await page.evaluate(id => moduloGrafo.grafo.conexiones.find(c => c.id === id).valor === 3, primera), modulo + ': editar peso');
  await clic(page, '#btnDeshacerGrafo');
  comprobar(await page.evaluate(id => moduloGrafo.grafo.conexiones.find(c => c.id === id).valor === 0, primera), modulo + ': deshacer peso');
  await clic(page, '#btnRehacerGrafo');
  comprobar(await page.evaluate(id => moduloGrafo.grafo.conexiones.find(c => c.id === id).valor === 3, primera), modulo + ': rehacer peso');
  await page.select('#seleccionVertice', ids[1]);
  await clic(page, '#btnEliminarVertice');
  await confirmar(page);
  comprobar(await page.evaluate(() => moduloGrafo.grafo.nodos.length === 2 && moduloGrafo.grafo.conexiones.length === 0), modulo + ': eliminar vértice elimina aristas incidentes');
  await clic(page, '#btnDeshacerGrafo');
  comprobar(await page.evaluate(() => moduloGrafo.grafo.nodos.length === 3 && moduloGrafo.grafo.conexiones.length === 2), modulo + ': deshacer recupera topología');
  await page.select('#seleccionArista', primera);
  await clic(page, '#btnEliminarArista');
  comprobar(await page.evaluate(() => moduloGrafo.grafo.conexiones.length === 1), modulo + ': eliminar arista');
  await clic(page, '#btnDeshacerGrafo');
  if (modulo === 'dijkstra') {
    await page.select('#aristaDesde', ids[0]); await page.select('#aristaHacia', ids[2]);
    await escribir(page, '#pesoArista', -1); await clic(page, '#btnCrearArista');
    comprobar(await page.evaluate(() => moduloGrafo.grafo.conexiones.length === 2), 'Dijkstra rechaza peso negativo desde edición');
  }
  await clic(page, '#btnLimpiarGrafo');
  await page.waitForSelector('#dialogoFondo:not([hidden])', { visible: true });
  comprobar(await page.$eval('#dialogoFondo', e => e.contains(document.activeElement)), modulo + ': limpiar pide confirmación con foco');
  await page.keyboard.press('Escape');
  comprobar(await page.evaluate(() => moduloGrafo.grafo.nodos.length === 3 && document.activeElement.id === 'btnLimpiarGrafo'), modulo + ': Escape conserva datos y devuelve foco');
}

async function revisarImportacion(page, modulo) {
  const original = await page.evaluate(() => serializarModuloGrafo());
  const antes = await page.evaluate(() => JSON.stringify({ datos: serializarModuloGrafo(), historial: moduloGrafo.historial }));
  for (const [nombre, mutar] of [
    ['version', datos => { datos.version = 99; }],
    ['duplicado', datos => { datos.grafo.nodos[1].id = datos.grafo.nodos[0].id; }],
    ['otro-modulo', datos => { datos.modulo = modulo === 'dijkstra' ? 'kruskal' : 'dijkstra'; }],
    ...(modulo === 'dijkstra' ? [['negativo', datos => { datos.grafo.conexiones[0].valor = -1; }]] : [])
  ]) {
    const invalido = JSON.parse(JSON.stringify(original)); mutar(invalido);
    const archivo = path.join(directorio, modulo + '-' + nombre + '.json');
    fs.writeFileSync(archivo, JSON.stringify(invalido));
    await page.evaluate(() => document.querySelector('#toastStack')?.replaceChildren());
    const [selector] = await Promise.all([page.waitForFileChooser(), clic(page, '#btnImportarGrafo')]);
    await selector.accept([archivo]);
    await page.waitForFunction(() => document.querySelector('#toastStack .toast--error')?.textContent.includes('importar'));
    comprobar(await page.evaluate(() => JSON.stringify({ datos: serializarModuloGrafo(), historial: moduloGrafo.historial })) === antes, modulo + ': JSON inválido (' + nombre + ') conserva trabajo e historial');
    comprobar(!await page.$eval('#dialogoFondo', e => !e.hidden).catch(() => false), 'El rechazo ocurre antes de pedir reemplazo');
  }
}

async function esperarDescarga(buscar) {
  const fin = Date.now() + 5000;
  while (Date.now() < fin) {
    const archivo = buscar();
    if (archivo && fs.existsSync(archivo) && fs.statSync(archivo).size > 0) return archivo;
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw new Error('La descarga no se completó.');
}

async function revisarTransferencias(page, modulo) {
  await vista(page, 'grafo');
  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: directorio });
  const antes = await page.evaluate(() => serializarModuloGrafo());
  await clic(page, '#btnExportarGrafo');
  const archivo = await esperarDescarga(() => path.join(directorio, modulo + '.json'));
  const descargado = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  comprobar(JSON.stringify(descargado) === JSON.stringify(antes), modulo + ': exportar JSON descarga el documento completo');
  const [selector] = await Promise.all([page.waitForFileChooser(), clic(page, '#btnImportarGrafo')]);
  await selector.accept([archivo]);
  await confirmar(page);
  comprobar(await page.evaluate(datos => JSON.stringify(serializarModuloGrafo()) === JSON.stringify(datos), descargado), modulo + ': importar JSON válido restaura el mismo ejercicio');
  await clic(page, '#btnPngGrafo');
  const png = await esperarDescarga(() => {
    const nombre = fs.readdirSync(directorio).find(n => n.startsWith(modulo + '_') && n.endsWith('.png'));
    return nombre ? path.join(directorio, nombre) : null;
  });
  comprobar(fs.readFileSync(png).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), modulo + ': exportación gráfica descarga un PNG válido');
  await cdp.detach();
}

async function revisarTrabajo(page, modulo) {
  await vista(page, 'procedimiento');
  await clic(page, '#btnUltimoGrafo');
  const antes = await page.evaluate(() => serializarModuloGrafo());
  await clic(page, '[data-accion-trabajo="guardar"]');
  await escribir(page, '#gdNombre', 'Ampliación ' + modulo);
  await clic(page, '#gdGuardar');
  comprobar(await page.$$eval('.gd-item', elementos => elementos.length >= 1), modulo + ': trabajo nombrado visible');
  await page.keyboard.press('Escape');
  await clic(page, '#btnReiniciarGrafo');
  await clic(page, '[data-accion-trabajo="cargar"]');
  comprobar(await page.$eval('.gd-panel', e => e.contains(document.activeElement)), modulo + ': biblioteca captura el foco');
  let focoDentro = true;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    focoDentro = focoDentro && await page.$eval('.gd-panel', e => e.contains(document.activeElement));
  }
  comprobar(focoDentro, modulo + ': Tab permanece dentro de la biblioteca');
  await clic(page, '[data-gd="cargar"]');
  comprobar(await page.$eval('.gd-item--confirma', e => e.textContent.includes('reemplaz')), modulo + ': cargar requiere confirmación');
  await clic(page, '[data-gd="confirmar"]');
  await page.waitForFunction(() => document.querySelector('.gd-fondo').hidden);
  comprobar(await page.evaluate(() => document.activeElement.dataset.accionTrabajo === 'cargar' && document.activeElement.getClientRects().length > 0), modulo + ': cargar devuelve el foco al botón Cargar visible');
  const despues = await page.evaluate(() => serializarModuloGrafo());
  comprobar(JSON.stringify(despues) === JSON.stringify(antes), modulo + ': cargar restaura datos, vista y paso');
  comprobar(await page.evaluate(() => !moduloGrafo.reproduciendo), modulo + ': el trabajo se restaura en pausa');
  await page.reload({ waitUntil: 'networkidle0' });
  comprobar(await page.evaluate(() => !moduloGrafo.reproduciendo && !!moduloGrafo.resultado), modulo + ': autoguardado recupera resultado en pausa');
}

async function revisarResultado(page, modulo) {
  await ejemplo(page);
  if (modulo === 'dijkstra') {
    await vista(page, 'configuracion');
    await page.select('#origenGrafo', 'n1'); await page.select('#destinoGrafo', 'n4');
  }
  await resolver(page);
  if (modulo === 'dijkstra') {
    const correcto = await page.evaluate(() => {
      const r = moduloGrafo.resultado;
      const ruta = reconstruirRutaGrafo(r, 'n4');
      return r.distancias.n1 === 0 && r.distancias.n2 === 3 && r.distancias.n3 === 1 && r.distancias.n4 === 4 && !Number.isFinite(r.distancias.n5) && ruta.nodos.join(',') === 'n1,n3,n2,n4' && ruta.distancia === 4;
    });
    comprobar(correcto, 'Dijkstra: distancias completas y ruta obligatoria correctas');
  } else comprobar(await page.evaluate(() => moduloGrafo.resultado.total === 6 && moduloGrafo.resultado.elegidas.length === 3), 'Kruskal: expansión mínima con peso 6');
  await vista(page, 'procedimiento');
  await clic(page, '#btnSiguienteGrafo');
  const paso = await page.evaluate(() => moduloGrafo.paso);
  await clic(page, '#btnAnteriorGrafo');
  comprobar(await page.evaluate(p => moduloGrafo.paso === p - 1, paso), modulo + ': procedimiento avanza y retrocede');
  await clic(page, '#btnReproducirGrafo');
  await clic(page, '#btnReproducirGrafo');
  comprobar(await page.evaluate(() => !moduloGrafo.reproduciendo), modulo + ': reproducción y pausa');
  await clic(page, '#btnReiniciarGrafo');
  comprobar(await page.evaluate(() => moduloGrafo.paso === 0 && !moduloGrafo.reproduciendo), modulo + ': reiniciar vuelve al primer paso en pausa');
  await vista(page, 'resultado');
  const texto = await page.$eval('#resultadoGrafo', e => e.textContent);
  comprobar(modulo === 'dijkstra' ? /Sin camino/i.test(texto) : texto.includes('6'), modulo + ': resultado visible con explicación');
  if (modulo === 'dijkstra') {
    await vista(page, 'configuracion'); await page.select('#destinoGrafo', 'n1');
    comprobar(await page.evaluate(() => !!moduloGrafo.resultado && reconstruirRutaGrafo(moduloGrafo.resultado, 'n1').distancia === 0), 'Dijkstra: cambiar destino conserva cálculo; origen consigo mismo vale cero');
  }
  await revisarTrabajo(page, modulo);
  await vista(page, 'grafo');
  await page.select('#seleccionVertice', 'n1'); await escribir(page, '#nombreSeleccionado', 'Nuevo');
  await clic(page, '#btnRenombrarVertice');
  comprobar(await page.evaluate(() => !!moduloGrafo.resultado), modulo + ': renombrar conserva cálculo');
  await vista(page, 'resultado');
  comprobar(await page.$eval('#resultadoGrafo', e => e.textContent.includes('Nuevo')), modulo + ': resultado usa etiquetas actuales');
  await vista(page, 'grafo');
  await page.select('#seleccionVertice', 'n1');
  await escribir(page, '#posicionNodoX', 300); await escribir(page, '#posicionNodoY', 200);
  await clic(page, '#btnMoverVertice');
  comprobar(await page.evaluate(() => !!moduloGrafo.resultado && moduloGrafo.grafo.nodos[0].x === 300 && moduloGrafo.grafo.nodos[0].y === 200), modulo + ': mover por formulario conserva cálculo');
  await page.select('#seleccionArista', 'c1'); await escribir(page, '#pesoSeleccionado', 9); await clic(page, '#btnEditarPeso');
  comprobar(await page.evaluate(() => moduloGrafo.resultado === null), modulo + ': editar peso invalida cálculo');
  if (modulo === 'kruskal') {
    await ejemplo(page); await resolver(page); await vista(page, 'configuracion'); await page.select('#objetivoGrafo', 'max');
    comprobar(await page.evaluate(() => moduloGrafo.resultado === null), 'Kruskal: cambiar objetivo invalida cálculo');
    await resolver(page);
    comprobar(await page.evaluate(() => moduloGrafo.resultado.total === 12), 'Kruskal máximo real del ejemplo: peso 12');
    await ejemplo(page, 'desconectado'); await resolver(page); await vista(page, 'resultado');
    comprobar(await page.evaluate(() => moduloGrafo.resultado.elegidas.length === moduloGrafo.grafo.nodos.length - moduloGrafo.resultado.componentes.length), 'Kruskal: bosque cumple V−C');
    comprobar(await page.$eval('#resultadoGrafo', e => /bosque/i.test(e.textContent)), 'Kruskal explica resultado desconectado');
  }
}

async function revisarResponsive(browser, modulo) {
  for (const [ancho, tema] of TAMANOS) {
    const page = await abrir(browser, modulo, ancho, tema);
    await ejemplo(page); await resolver(page); await vista(page, 'grafo');
    comprobar(await sinDesborde(page), modulo + ': sin desborde a ' + ancho + ' / ' + tema);
    comprobar(await page.$eval('#svgModuloGrafo', svg => svg.getBoundingClientRect().height >= 240), modulo + ': grafo con altura útil a ' + ancho);
    await captura(page, modulo + '-' + ancho + '-' + tema, '#svgModuloGrafo');
    await vista(page, 'procedimiento');
    comprobar(await sinDesborde(page), modulo + ': procedimiento se desplaza internamente a ' + ancho);
    await vista(page, 'resultado');
    comprobar(await sinDesborde(page), modulo + ': resultado sin desborde a ' + ancho);
    await page.close();
  }
}

async function revisarOrdenamiento(browser) {
  const page = await abrir(browser, 'ordenamiento', 390, 'claro');
  const entrada = Array.from({ length: 40 }, (_, i) => 40 - i);
  await escribir(page, '#entradaValores', entrada.join(', ')); await clic(page, '#btnAplicar');
  for (const algoritmo of ['selection', 'insertion', 'bubble', 'shell', 'merge']) {
    await clic(page, '[data-algoritmo="' + algoritmo + '"]');
    await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length > 0);
    await page.evaluate(() => irAPaso(estadoOrdenamiento.historial.length - 1));
    comprobar(await page.evaluate(() => obtenerPasoOrdenamiento(estadoOrdenamiento.registro, estadoOrdenamiento.pasoActual).arreglo.map(p => p.valor).every((v, i, a) => !i || a[i - 1] <= v)), algoritmo + ': 40 inversos terminan ordenados en navegador');
    comprobar(await page.$$eval('#mapaPasos > *', marcas => marcas.length <= 120), algoritmo + ': historial DOM acotado');
  }
  comprobar(await page.$$eval('.pista-barras .pino-caja', elementos => elementos.length === 40), 'Ordenamiento grande usa 40 barras consultables');
  await escribir(page, '#indiceSeleccionado', 19);
  await page.$eval('#indiceSeleccionado', e => e.dispatchEvent(new Event('change', { bubbles: true })));
  comprobar(await page.$eval('#detallePino', e => /20/.test(e.textContent)), 'Consulta de posición muestra el valor seleccionado');
  if (!await sinDesborde(page)) {
    console.log(await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, desplazamiento: window.scrollX,
      elementos: [...document.querySelectorAll('main *')].filter(e => e.getBoundingClientRect().right > innerWidth && getComputedStyle(e).overflowX !== 'hidden').slice(0, 15).map(e => [e.id, e.className, e.getBoundingClientRect().width]) })));
    await captura(page, 'ordenamiento-desborde-390-claro', '#pistaBowling');
  }
  comprobar(await sinDesborde(page), 'Ordenamiento grande mantiene desplazamiento interno');
  await clic(page, '[data-algoritmo="bubble"]');
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length > 0);
  const cancelacion = await page.evaluate(async () => {
    const grande = Array.from({ length: 200 }, (_, i) => 99 - Math.floor(i * 98 / 199));
    let pulsos = 0;
    const reloj = setInterval(() => pulsos++, 0);
    const calculo = fijarValores(grande);
    await new Promise(resolve => setTimeout(resolve, 0));
    const estabaPreparando = estadoOrdenamiento.preparando;
    document.getElementById('btnCancelarPreparacion').click();
    await calculo;
    clearInterval(reloj);
    return { pulsos, estabaPreparando, preparando: estadoOrdenamiento.preparando, eventos: estadoOrdenamiento.historial.length };
  });
  comprobar(cancelacion.estabaPreparando && cancelacion.pulsos > 0 && !cancelacion.preparando && cancelacion.eventos === 0, '200 inversos: navegador atiende temporizadores y cancelación descarta preparación');
  const obsoleto = await page.evaluate(async () => {
    const antiguo = fijarValores(Array.from({ length: 200 }, (_, i) => 99 - Math.floor(i * 98 / 199)));
    await new Promise(resolve => setTimeout(resolve, 0));
    const nuevo = fijarValores([3, 1, 2]);
    await Promise.all([antiguo, nuevo]);
    return estadoOrdenamiento.valores.join(',') === '3,1,2' && estadoOrdenamiento.registro.pinos.length === 3;
  });
  comprobar(obsoleto, 'Cambiar datos durante preparación impide aplicar resultados antiguos');
  await page.evaluate(() => fijarValores(Array.from({ length: 200 }, (_, i) => 99 - Math.floor(i * 98 / 199))));
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length > 0);
  await page.evaluate(() => irAPaso(estadoOrdenamiento.historial.length - 1));
  comprobar(await page.evaluate(() => obtenerPasoOrdenamiento(estadoOrdenamiento.registro, estadoOrdenamiento.pasoActual).arreglo.map(p => p.valor).every((v, i, a) => !i || a[i - 1] <= v)), 'Máximo200: Bubble inverso repetido termina ordenado');
  await clic(page, '#btnAnterior');
  const paso = await page.evaluate(() => estadoOrdenamiento.pasoActual);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !estadoOrdenamiento.preparando && estadoOrdenamiento.historial.length > 0);
  comprobar(await page.evaluate(p => estadoOrdenamiento.valores.length === 200 && estadoOrdenamiento.pasoActual === p && !estadoOrdenamiento.reproduciendo, paso), 'Máximo200: recargar recupera valores, paso y pausa');
  await clic(page, '#btnReiniciar'); await clic(page, '#btnSiguiente');
  comprobar(await page.evaluate(() => estadoOrdenamiento.pasoActual === 1), 'Máximo200: reiniciar y avanzar conservan controles');
  await clic(page, '#btnAuto'); await clic(page, '#btnAuto');
  comprobar(await page.evaluate(() => !estadoOrdenamiento.reproduciendo), 'Máximo200: reproducir y pausar');
  await captura(page, 'ordenamiento-200-390-claro', '#pistaBowling');
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    if (!SOLO_GRAFOS && !SOLO_ORDENAMIENTO && !SOLO_TRANSFERENCIAS) await revisarCiudad(browser);
    if (!SOLO_CIUDAD && !SOLO_ORDENAMIENTO) {
      for (const modulo of ['dijkstra', 'kruskal']) {
        const page = await abrir(browser, modulo);
        if (SOLO_TRANSFERENCIAS) { await ejemplo(page); await resolver(page); }
        else {
          await revisarCrud(page, modulo);
          await revisarImportacion(page, modulo);
          await revisarResultado(page, modulo);
        }
        await revisarTransferencias(page, modulo);
        await page.close();
        if (!SOLO_TRANSFERENCIAS) await revisarResponsive(browser, modulo);
      }
    }
    if (!SOLO_CIUDAD && !SOLO_GRAFOS && !SOLO_TRANSFERENCIAS) await revisarOrdenamiento(browser);
    comprobar(errores.length === 0, 'Sin errores JavaScript ni de consola');
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    fs.readdirSync(directorio, { withFileTypes: true }).forEach(entrada => {
      if (entrada.isFile()) fs.unlinkSync(path.join(directorio, entrada.name));
    });
    fs.rmdirSync(directorio);
  }
  errores.forEach(error => console.error(error));
  if (errores.length) process.exitCode = 1;
  console.log('\nAmpliación: ' + correctas + ' comprobaciones correctas; errores de consola/página: ' + errores.length);
})();
