/* QA dirigido sobre el Drop final. Edge y puppeteer-core ya disponibles.
 * Sin instalaciones, capturas, videos ni descargas en disco.
 * node tests/logica-difusa-navegador.js */
'use strict';
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const { crearServidor } = require('./servidor-local');
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DROP = path.join(__dirname, '../entrega-netlify/drop');
const cerca = (actual, esperado, mensaje) => assert.ok(Number.isFinite(actual) && Math.abs(actual - esperado) < 1e-8, mensaje + ': ' + actual + ' / ' + esperado);

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
async function cambiar(page, selector, valor, evento = 'input') {
  await page.$eval(selector, (e, datos) => {
    e.value = String(datos.valor);
    e.dispatchEvent(new Event(datos.evento, { bubbles: true }));
  }, { valor, evento });
  await fotograma(page);
}
async function elegir(page, selector, valor) {
  await page.select(selector, String(valor));
  await fotograma(page);
}
async function botonTexto(page, texto, contenedor = '#moduloContenido') {
  const encontrado = await page.evaluate(({ texto, contenedor }) => {
    document.querySelectorAll('[data-qa-boton]').forEach(e => e.removeAttribute('data-qa-boton'));
    const e = [...document.querySelector(contenedor).querySelectorAll('button')]
      .find(b => b.textContent.trim() === texto && b.getClientRects().length && !b.disabled);
    if (!e) return false;
    e.dataset.qaBoton = 'actual'; return true;
  }, { texto, contenedor });
  assert.ok(encontrado, 'Botón visible: ' + texto + ' en ' + contenedor);
  await clic(page, '[data-qa-boton="actual"]');
}
async function hayDialogo(page) {
  return page.evaluate(() => Boolean(document.getElementById('dialogoFondo') && !document.getElementById('dialogoFondo').hidden));
}
async function dialogo(page, aceptar = true, texto) {
  await page.waitForSelector('#dialogoFondo:not([hidden])');
  if (texto !== undefined) await cambiar(page, '#dialogoInput', texto);
  // El diálogo común evita aceptar el clic que lo acaba de abrir.
  await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde > FANTASMO_CLICK_TIMEOUT);
  await clic(page, aceptar ? '#dialogoAceptar' : '#dialogoCancelar');
  if (aceptar && await hayDialogo(page)) {
    const error = await page.$eval('#dialogoError', e => e.hidden ? '' : e.textContent);
    assert.equal(error, '', 'El diálogo acepta el dato válido: ' + texto);
  }
  await page.waitForSelector('#dialogoFondo', { hidden: true });
}
async function vista(page, id) {
  await clic(page, '.difusa-etapas [data-vista="' + id + '"]');
  await page.waitForSelector('#vista-' + id + ':not([hidden])');
  const visibles = await page.$$eval('.difusa-vista', elementos => elementos.filter(e => !e.hidden && e.getClientRects().length).map(e => e.id));
  assert.deepEqual(visibles, ['vista-' + id], 'Solo se muestra la vista activa ' + id);
}
async function selectorEntrada(page, id, rango = false) {
  const selector = await page.evaluate(({ id, rango }) => {
    const atributo = rango ? 'data-rango-difusa' : 'data-valor-difusa';
    const directo = document.querySelector('[' + atributo + '="' + id + '"]');
    if (directo) return '[' + atributo + '="' + id + '"]';
    const v = DifusaEstado.estado.modelo.entradas.find(x => x.id === id);
    const cajas = [...document.querySelectorAll('#controlesEntradasDifusa .difusa-entrada')];
    const caja = cajas.find(e => e.textContent.includes(v.nombre));
    const e = caja && caja.querySelector(rango ? 'input[type="range"]' : 'input:not([type="range"])');
    return e && e.id ? '#' + CSS.escape(e.id) : null;
  }, { id, rango });
  assert.ok(selector, 'Control de entrada ' + id + (rango ? ' (deslizador)' : ' (número)'));
  return selector;
}
async function valorEntrada(page, id, valor, rango = false) {
  const selector = await selectorEntrada(page, id, rango);
  await cambiar(page, selector, valor);
  return selector;
}
async function resultado(page) { return page.evaluate(() => DifusaEstado.estado.resultado && DifusaEstado.estado.resultado.centroide.valor); }
async function evaluarActual(page, esperado) {
  await vista(page, 'evaluar');
  await clic(page, '#evaluarDifusa');
  await page.waitForFunction(() => DifusaEstado.estado.resultado !== null);
  if (esperado !== undefined) cerca(await resultado(page), esperado, 'Centroide del ejemplo');
  assert.equal(await page.$eval('#vista-resultado', e => e.hidden), false);
  assert.ok(await page.$('#graficaSalida .difusa-agregada-linea'));
}
async function cargarEjemplo(page, id) {
  await vista(page, 'inicio');
  await clic(page, '[data-cargar-ejemplo="' + id + '"]');
  if (await hayDialogo(page)) await dialogo(page);
  await page.waitForFunction(id => DifusaEstado.estado.modelo.id === id && !DifusaEditor.tieneBorradores(), {}, id);
}
async function aplicar(page, seccion) {
  await clic(page, '#vista-' + seccion + ' [data-aplicar-difusa]');
  await page.waitForFunction(() => !DifusaEditor.tieneBorradores());
}
async function interceptarDescargas(page) {
  await page.evaluate(() => {
    window.__qaDescargas = [];
    const crear = URL.createObjectURL.bind(URL);
    URL.createObjectURL = objeto => { window.__qaBlob = objeto; return crear(objeto); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.__qaDescargas.push({ nombre: this.download, blob: window.__qaBlob }); return; }
      return click.call(this);
    };
  });
}
async function ultimaDescarga(page) {
  return page.evaluate(async () => {
    const d = window.__qaDescargas[window.__qaDescargas.length - 1];
    return { nombre: d.nombre, texto: await d.blob.text() };
  });
}
async function importarArchivo(page, texto) {
  await page.$eval('#archivoTrabajoDifusa', (input, contenido) => {
    const datos = new DataTransfer(); datos.items.add(new File([contenido], 'trabajo-qa.json', { type: 'application/json' }));
    input.files = datos.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  }, texto);
  await fotograma(page);
}
async function geometria(page, contexto) {
  await fotograma(page);
  const datos = await page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const visibles = [...document.querySelectorAll('.difusa-vista')].filter(e => !e.hidden && e.getClientRects().length);
    const svgs = visibles.flatMap(e => [...e.querySelectorAll('.difusa-grafica')]).filter(e => e.getClientRects().length);
    const cortados = visibles.flatMap(e => [...e.querySelectorAll('input, select, button')]).filter(e => e.getClientRects().length).filter(e => {
      const r = e.getBoundingClientRect(); return r.left < -1 || r.right > ancho + 1;
    }).map(e => e.id || e.textContent.trim().slice(0, 30));
    return { ancho, scroll: document.documentElement.scrollWidth, cortados,
      svgsValidos: svgs.every(svg => { const r = svg.getBoundingClientRect(); return svg.hasAttribute('viewBox') && svg.querySelector('title') && svg.querySelector('desc') && r.left >= -1 && r.right <= ancho + 1 && r.height > 0; }),
      invalido: /\b(?:NaN|undefined|Infinity)\b/.test(visibles.map(e => e.innerText).join(' ')) };
  });
  assert.ok(datos.scroll <= datos.ancho + 1, contexto + ': sin desbordamiento global ' + JSON.stringify(datos));
  assert.deepEqual(datos.cortados, [], contexto + ': controles completos');
  assert.ok(datos.svgsValidos, contexto + ': SVG adaptables con título y descripción');
  assert.equal(datos.invalido, false, contexto + ': números y etiquetas válidos');
}
async function abrirMapa(page) {
  await vista(page, 'resultado');
  await page.$eval('#panelMapaDifusa', e => { e.open = true; });
  await fotograma(page);
}
async function generarMapa(page) {
  await abrirMapa(page);
  await clic(page, '#generarMapaDifusa');
  await page.waitForFunction(() => !DifusaMapa.activo() && (document.querySelector('#graficaMapaDifusa svg') ||
    document.getElementById('estadoMapaDifusa').textContent.trim()), { timeout: 20000 });
  assert.ok(await page.$('#graficaMapaDifusa svg'), 'Mapa generado: ' + await page.$eval('#estadoMapaDifusa', e => e.textContent));
}

(async () => {
  assert.ok(fs.existsSync(path.join(DROP, 'js/difusa/modelo.js')), 'Primero regenera el Drop con el modelo configurable.');
  const servidor = crearServidor({ raiz: DROP });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + servidor.address().port + '/';
  const errores = [], recursos = [], llamadasAPI = [];
  let browser;
  async function pagina(contexto) {
    const p = await contexto.newPage(); p.setDefaultTimeout(10000);
    await p.setViewport({ width: 1440, height: 950 });
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    p.on('pageerror', e => errores.push(e.message));
    p.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) recursos.push(r.status() + ' ' + r.url()); });
    await p.setRequestInterception(true);
    p.on('request', r => {
      if (/\/api\//.test(r.url())) llamadasAPI.push(r.url());
      if (!r.url().startsWith(base) && !/^(data:|blob:)/.test(r.url())) r.abort().catch(() => {});
      else r.continue().catch(() => {});
    });
    return p;
  }
  try {
    browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
    const contexto = await browser.createBrowserContext();
    const page = await pagina(contexto);
    await page.goto(base + 'logica-difusa.html', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#introModulo:not([hidden])');
    const fuenteVideo = await page.$eval('#introMarco iframe', e => e.src);
    assert.match(fuenteVideo, /youtube-nocookie\.com\/embed\/ayfoP7Tqa-s/);
    assert.ok([null, '0'].includes(new URL(fuenteVideo).searchParams.get('autoplay')), 'Video sin reproducción automática');
    assert.match(await page.$eval('#introEnlaceYoutube', e => e.href), /watch\?v=ayfoP7Tqa-s/);
    assert.match(await page.$eval('#btnComenzarModulo', e => e.textContent), /Ir al m[oó]dulo/i);
    await clic(page, '#introOmitir');
    await clic(page, '#btnComenzarModulo');
    assert.equal(await page.$('#introMarco iframe'), null);
    assert.equal(await resultado(page), null);
    await vista(page, 'reglas');
    assert.equal(await page.$$eval('#editorReglasDifusa .difusa-regla-editor', e => e.length), 9);
    assert.equal(await page.$$eval('#barraLateral a[href="logica-difusa.html"][aria-current="page"]', e => e.length), 1);
    await evaluarActual(page, 50);
    await page.evaluate(() => { window.__qaResultadoVideo = DifusaEstado.estado.resultado; });
    await clic(page, '#btnVideoModulo');
    assert.ok(await page.$('#introMarco iframe'));
    await clic(page, '#btnComenzarModulo');
    assert.equal(await page.$('#introMarco iframe'), null);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.resultado === window.__qaResultadoVideo), true);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('#introModulo', e => e.hidden), true, 'Preferencia de omitir bienvenida');
    console.log('✓ Bienvenida común, video sin autoplay, salida/regreso sin perder cálculo y preferencia persistida.');

    for (const [f, d, esperado] of [[2, 8, 84.47038269550748], [5, 5, 50], [8, 2, 15.52961730449252]]) {
      await vista(page, 'evaluar');
      await clic(page, '[data-ejemplo-difusa="' + f + ',' + d + '"]');
      if (await resultado(page) === null) await clic(page, '#evaluarDifusa');
      await page.waitForFunction(() => DifusaEstado.estado.resultado !== null);
      cerca(await resultado(page), esperado, 'Referencia original ' + f + '/' + d);
    }
    await vista(page, 'evaluar');
    const textoF = await valorEntrada(page, 'familiaridad', '5.25');
    const rangoF = await selectorEntrada(page, 'familiaridad', true);
    assert.equal(await page.$eval(rangoF, e => Number(e.value)), 5.25);
    await valorEntrada(page, 'dificultad', 6.25, true);
    assert.equal(await page.$eval(await selectorEntrada(page, 'dificultad'), e => Number(e.value)), 6.25);
    assert.equal(await resultado(page), null);
    await evaluarActual(page);
    assert.deepEqual(await page.evaluate(() => DifusaEstado.estado.resultado.entradas), { familiaridad: 5.25, dificultad: 6.25 });
    for (const incorrecto of ['', '10.01', 'texto', '1,2.3', '3.5resto']) {
      await vista(page, 'evaluar'); await cambiar(page, textoF, incorrecto);
      await clic(page, '#evaluarDifusa');
      assert.equal(await resultado(page), null, 'No evalúa entrada incorrecta: ' + incorrecto);
      assert.equal(await page.$eval(textoF, e => e.getAttribute('aria-invalid')), 'true');
      assert.equal(await page.$eval(textoF, e => e.value), incorrecto, 'No limita ni trunca la escritura');
    }
    await cambiar(page, textoF, 5.25);
    await evaluarActual(page);
    console.log('✓ Cinco vistas reales, referencias originales, 5.25 sin paso artificial y validación estricta.');

    await page.evaluate(() => { window.__qaResultadoNombre = DifusaEstado.estado.resultado; });
    await vista(page, 'variables');
    await cambiar(page, '#nombreVariableDifusa', 'Experiencia QA');
    await aplicar(page, 'variables');
    assert.equal(await page.evaluate(() => DifusaEstado.estado.resultado === window.__qaResultadoNombre), true);
    assert.equal(await page.$eval('#tituloPreviewDifusa', e => e.textContent), 'Experiencia QA');
    await cambiar(page, '#conjunto-baja', 'Inicial QA');
    await aplicar(page, 'variables');
    assert.match(await page.$eval('#leyendaPreviewDifusa', e => e.textContent), /Inicial QA/);
    const curvaAntes = await page.$eval('#previewVariableDifusa .difusa-curva--0', e => e.getAttribute('d'));
    await cambiar(page, '#param-baja-2', 2.4);
    assert.notEqual(await page.$eval('#previewVariableDifusa .difusa-curva--0', e => e.getAttribute('d')), curvaAntes);
    assert.equal(await resultado(page), null, 'La edición matemática invalida el resultado');
    await aplicar(page, 'variables');
    const modeloValido = await page.evaluate(() => JSON.stringify(DifusaEstado.estado.modelo));
    await cambiar(page, '#param-baja-2', 'inválido');
    assert.equal(await page.$eval('#param-baja-2', e => e.getAttribute('aria-invalid')), 'true');
    await clic(page, '#vista-variables [data-aplicar-difusa]');
    assert.equal(await page.evaluate(() => JSON.stringify(DifusaEstado.estado.modelo)), modeloValido);
    await botonTexto(page, 'Cancelar cambios', '#vista-variables');
    assert.equal(await page.$eval('#param-baja-2', e => e.value), '2.4');
    await cambiar(page, '#minVariableDifusa', 1);
    await botonTexto(page, 'Reajustar curvas al rango', '#vista-variables');
    await dialogo(page, false);
    assert.equal(await page.evaluate(() => JSON.stringify(DifusaEstado.estado.modelo)), modeloValido);
    await botonTexto(page, 'Cancelar cambios', '#vista-variables');
    console.log('✓ Edición y vista previa inmediatas; renombrar conserva cálculo; aplicar/cancelar y rango explícito.');

    await cargarEjemplo(page, 'ayuda'); await vista(page, 'reglas');
    await elegir(page, '#conector-r1', 'OR');
    await elegir(page, '#ant-r1-dificultad', '');
    await cambiar(page, '#peso-r1', '0,5');
    await aplicar(page, 'reglas');
    await vista(page, 'evaluar'); await valorEntrada(page, 'familiaridad', 0); await valorEntrada(page, 'dificultad', 10);
    await evaluarActual(page);
    const regla = await page.evaluate(() => DifusaEstado.estado.resultado.reglas.find(r => r.id === 'r1'));
    assert.equal(regla.conector, 'OR'); assert.equal(regla.peso, 0.5); assert.equal(regla.activacion, 0.5);
    assert.equal(regla.antecedentes.find(a => a.variableId === 'dificultad').conjuntoId, null);
    await vista(page, 'reglas');
    await clic(page, '[data-regla-id="r1"] input[type="checkbox"]');
    await aplicar(page, 'reglas'); await evaluarActual(page);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.resultado.reglas[0].activacion), 0);
    await vista(page, 'reglas');
    await clic(page, '#agregarReglaDifusa');
    let nuevoId = await page.$$eval('#editorReglasDifusa [data-regla-id]', e => e[e.length - 1].dataset.reglaId);
    await elegir(page, '#cons-' + nuevoId, 'breve'); await aplicar(page, 'reglas');
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.reglas.length), 10);
    await botonTexto(page, 'Duplicar como borrador', '[data-regla-id="r5"]');
    const duplicada = await page.$$eval('#editorReglasDifusa [data-regla-id]', e => e.map(x => x.dataset.reglaId));
    const duplicadaId = duplicada[duplicada.indexOf('r5') + 1];
    assert.equal(await page.$eval('#cons-' + duplicadaId, e => e.value), '');
    await botonTexto(page, 'Eliminar regla', '[data-regla-id="' + duplicadaId + '"]'); await dialogo(page, false);
    assert.equal(await page.$$eval('#editorReglasDifusa [data-regla-id]', e => e.length), 11);
    await botonTexto(page, 'Eliminar regla', '[data-regla-id="' + duplicadaId + '"]'); await dialogo(page);
    await aplicar(page, 'reglas');
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.reglas.length), 10);
    await clic(page, '#generarCombinacionesDifusa'); await dialogo(page, false);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.reglas.length), 10);
    await clic(page, '#generarCombinacionesDifusa'); await dialogo(page); await aplicar(page, 'reglas');
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.reglas.every(r => r.consecuente === null)), true);
    assert.match(await page.$eval('#preparacionDifusa', e => e.textContent), /pendiente|consecuente/i);
    assert.equal(await resultado(page), null);
    console.log('✓ AND/OR, peso, No importa, desactivar, añadir/duplicar/eliminar y combinaciones sin decisiones inventadas.');

    await vista(page, 'inicio'); await clic(page, '#crearSistemaDifusa');
    if (await hayDialogo(page)) await dialogo(page);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.id), 'mi-sistema');
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.reglas[0].consecuente), null);
    assert.match(await page.$eval('#preparacionDifusa', e => e.textContent), /pendiente|consecuente/i);
    await cargarEjemplo(page, 'propina'); await evaluarActual(page, 15);
    await cambiar(page, '#puntoSalidaDifusa', 250);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.resultado.puntos[250]), 7.5);
    assert.match(await page.$eval('#consultaPuntoDifusa', e => e.textContent), /7[.,]5/);
    await elegir(page, '#seleccionReglaDifusa', 'r5');
    assert.equal(await page.evaluate(() => DifusaEstado.estado.seleccion.reglaId), 'r5');
    assert.ok(await page.$('#graficaSalida .difusa-recorte-linea'));
    assert.match(await page.$eval('#calculoCentroide', e => e.textContent), /numerador/i);
    assert.match(await page.$eval('#calculoCentroide', e => e.textContent), /denominador/i);
    await interceptarDescargas(page);
    await clic(page, '#exportarTrabajoDifusa');
    const exportado = await ultimaDescarga(page); const trabajoJSON = JSON.parse(exportado.texto);
    assert.equal(trabajoJSON.version, 2); assert.equal(trabajoJSON.tipo, 'ciudad-logica-difusa-trabajo');
    assert.equal(trabajoJSON.modelo.salida.max, 30); assert.equal('resultado' in trabajoJSON, false);
    await clic(page, '#exportarComparacionDifusa');
    const comparacion = JSON.parse((await ultimaDescarga(page)).texto);
    assert.equal(comparacion.tipo, 'ciudad-logica-difusa-comparacion');
    assert.equal(comparacion.muestreo.puntos, 1001); assert.ok(comparacion.casos.length > 0);
    await clic(page, '#guardarTrabajoDifusa'); await dialogo(page, true, 'QA propina');
    assert.equal(await page.evaluate(() => DifusaEstado.listarTrabajos().length), 1);
    await clic(page, '#verTrabajosDifusa');
    await botonTexto(page, 'Renombrar', '#listaTrabajosDifusa'); await dialogo(page, true, 'QA propina renombrada');
    assert.equal(await page.evaluate(() => DifusaEstado.listarTrabajos()[0].nombre), 'QA propina renombrada');
    await clic(page, '#cerrarTrabajosDifusa');
    await cargarEjemplo(page, 'ayuda');
    await clic(page, '#verTrabajosDifusa'); await botonTexto(page, 'Cargar', '#listaTrabajosDifusa');
    if (await hayDialogo(page)) await dialogo(page);
    await page.waitForFunction(() => DifusaEstado.estado.modelo.id === 'propina');
    await evaluarActual(page, 15);
    await page.evaluate(() => { window.__qaImportResultado = DifusaEstado.estado.resultado; window.__qaImportModelo = JSON.stringify(DifusaEstado.estado.modelo); });
    await importarArchivo(page, '{no es JSON');
    if (await hayDialogo(page)) await dialogo(page);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.resultado === window.__qaImportResultado), true);
    assert.equal(await page.evaluate(() => JSON.stringify(DifusaEstado.estado.modelo) === window.__qaImportModelo), true);
    await importarArchivo(page, JSON.stringify(comparacion));
    assert.equal(await page.evaluate(() => DifusaEstado.estado.resultado === window.__qaImportResultado), true, 'JSON numérico no sustituye un trabajo');
    await cargarEjemplo(page, 'ayuda');
    await importarArchivo(page, exportado.texto);
    if (await hayDialogo(page)) await dialogo(page);
    await page.waitForFunction(() => DifusaEstado.estado.modelo.id === 'propina');
    await evaluarActual(page, 15);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await resultado(page), null);
    assert.equal(await page.evaluate(() => DifusaEstado.estado.modelo.id), 'propina');
    await clic(page, '#verTrabajosDifusa'); await botonTexto(page, 'Eliminar', '#listaTrabajosDifusa'); await dialogo(page);
    assert.equal(await page.evaluate(() => DifusaEstado.listarTrabajos().length), 0);
    await clic(page, '#cerrarTrabajosDifusa');
    console.log('✓ Punto real en salida 0–30, selección y recorte; trabajos y JSON en memoria, importación inválida no destructiva.');

    await cargarEjemplo(page, 'ventilacion'); await evaluarActual(page, 50);
    assert.equal(await page.$('#graficaMapaDifusa svg'), null, 'El mapa se genera bajo petición');
    assert.equal(await page.evaluate(() => DifusaMapa.activo()), false);
    await generarMapa(page);
    assert.match(await page.$eval('#graficaMapaDifusa svg title', e => e.textContent), /Curva de respuesta/);
    await cargarEjemplo(page, 'ayuda'); await evaluarActual(page, 50); await generarMapa(page);
    assert.ok(await page.$$eval('#graficaMapaDifusa rect', e => e.length >= 225));
    await clic(page, '#generarMapaDifusa');
    await page.waitForFunction(() => DifusaMapa.activo());
    await clic(page, '#cancelarMapaDifusa');
    assert.equal(await page.evaluate(() => DifusaMapa.activo()), false);
    await vista(page, 'variables'); await clic(page, '#agregarEntradaDifusa'); await aplicar(page, 'variables');
    const tercera = await page.evaluate(() => DifusaEstado.estado.modelo.entradas[2]);
    await vista(page, 'evaluar'); await valorEntrada(page, tercera.id, 5); await evaluarActual(page, 50);
    await abrirMapa(page); await cambiar(page, '#mapaFijo-' + tercera.id, 5); await generarMapa(page);
    assert.match(await page.$eval('#graficaMapaDifusa svg desc', e => e.textContent), new RegExp(tercera.nombre + ' fijo en 5'));
    await elegir(page, '#mapaEjeX', tercera.id);
    await elegir(page, '#mapaEjeY', 'familiaridad');
    assert.ok(await page.$('#mapaFijo-dificultad'));
    await cambiar(page, '#mapaFijo-dificultad', 6);
    await generarMapa(page);
    assert.match(await page.$eval('#graficaMapaDifusa svg desc', e => e.textContent), /Dificultad percibida del ejercicio fijo en 6/);
    await clic(page, '#generarMapaDifusa'); await page.waitForFunction(() => DifusaMapa.activo());
    await vista(page, 'variables');
    await elegir(page, '#variableActualDifusa', 'familiaridad');
    await cambiar(page, '#param-baja-2', 2.4);
    assert.equal(await page.evaluate(() => DifusaMapa.activo()), false);
    assert.equal(await page.$('#graficaMapaDifusa svg'), null, 'Modelo editado descarta mapa y trabajo en curso');
    await botonTexto(page, 'Cancelar cambios', '#vista-variables');
    console.log('✓ Curva de una entrada, mapa de dos, tercera entrada fija y cancelación/descarte al editar.');

    await evaluarActual(page, 50);
    for (const ancho of [390, 1440]) for (const tema of ['oscuro', 'claro']) {
      await page.setViewport({ width: ancho, height: ancho === 390 ? 844 : 950 });
      await page.evaluate(valor => aplicarTema(valor), tema);
      for (const id of ['inicio', 'variables', 'reglas', 'evaluar', 'resultado']) {
        await vista(page, id); await geometria(page, ancho + ' px / ' + tema + ' / ' + id);
      }
      const tabla = await page.$eval('#tablaReglas', e => getComputedStyle(e.closest('.difusa-tabla-contenedor')).overflowX);
      assert.equal(tabla, 'auto');
    }
    await page.setViewport({ width: 1440, height: 950 }); await vista(page, 'evaluar');
    const primero = await selectorEntrada(page, 'familiaridad');
    const rango = await selectorEntrada(page, 'familiaridad', true);
    await page.focus(primero); await page.keyboard.press('Tab');
    assert.equal(await page.$eval(rango, e => document.activeElement === e), true);
    assert.equal(await page.$eval(rango, e => e.matches(':focus-visible') && getComputedStyle(e).outlineStyle !== 'none'), true);
    console.log('✓ Cinco vistas a 390 y 1440 px, ambos temas, controles completos, tablas internas y teclado.');

    const contextoMigracion = await browser.createBrowserContext(); const migracion = await pagina(contextoMigracion);
    await migracion.goto(base + 'index.html', { waitUntil: 'networkidle0' });
    const original = JSON.stringify({ version: 1, entradas: { familiaridad: 2, dificultad: 8 } });
    await migracion.evaluate(texto => localStorage.setItem('logica-difusa.v1', texto), original);
    await migracion.goto(base + 'logica-difusa.html?intro=no', { waitUntil: 'networkidle0' });
    await evaluarActual(migracion, 84.47038269550748);
    assert.equal(await migracion.evaluate(() => localStorage.getItem('logica-difusa.v1')), original);
    assert.equal(await migracion.evaluate(() => JSON.parse(localStorage.getItem('logica-difusa.v2')).version), 2);
    const fallo = await pagina(contextoMigracion);
    await fallo.evaluateOnNewDocument(() => {
      Storage.prototype.getItem = function () { throw new DOMException('Bloqueado para QA', 'SecurityError'); };
      Storage.prototype.setItem = function () { throw new DOMException('Bloqueado para QA', 'SecurityError'); };
    });
    await fallo.goto(base + 'logica-difusa.html?intro=no', { waitUntil: 'networkidle0' }); await evaluarActual(fallo, 50);
    assert.ok((await fallo.$eval('#almacenamientoDifusa', e => e.textContent)).trim());
    await fallo.close(); await migracion.close(); await contextoMigracion.close();
    await page.goto(base + 'index.html?intro=no', { waitUntil: 'networkidle0' });
    await clic(page, '#vistaCiudad'); assert.equal(await page.$$eval('.ciudad-zona[data-modulo="difusa"]', e => e.length), 1);
    await clic(page, '.ciudad-zona[data-modulo="difusa"]');
    assert.equal(await page.$eval('#panelModulo a', e => e.getAttribute('href')), 'logica-difusa.html');
    await clic(page, '#vistaLista'); assert.equal(await page.$$eval('#catalogo a[href="logica-difusa.html"]', e => e.length), 1);
    assert.deepEqual(errores, [], 'Sin errores JavaScript'); assert.deepEqual(recursos, [], 'Sin recursos locales fallidos'); assert.deepEqual(llamadasAPI, [], 'Sin llamadas a API');
    console.log('✓ Migración v1 preservada, almacenamiento bloqueado operativo e integración sin duplicados. Cero errores JS/HTTP/API. Sin capturas.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => servidor.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
