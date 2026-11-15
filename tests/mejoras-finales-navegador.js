/* Regresiones dirigidas. Usa únicamente Edge/Puppeteer ya disponibles,
 * contextos aislados y el servidor existente. No crea capturas. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path'), os = require('node:os'), fs = require('node:fs');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
let correctas = 0;
const errores = [];
const comprobar = (valor, mensaje) => { assert.ok(valor, mensaje); correctas++; console.log('  OK ' + mensaje); };
async function clic(page, selector) {
  if (selector === '#dialogoAceptar') await page.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
  await page.$eval(selector, e => {
    for (let p = e.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.click(selector);
}
async function escribir(page, selector, valor) {
  await clic(page, selector); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(valor);
}
async function nuevaPagina(browser, modulo) {
  const contexto = await browser.createBrowserContext(), page = await contexto.newPage();
  page.on('pageerror', e => errores.push(e.message));
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
  return { contexto, page };
}
async function grafos(browser, modulo) {
  const { contexto, page } = await nuevaPagina(browser, modulo);
  try {
    await clic(page, '#btnEjemploGrafo');
    for (const ancho of [320, 390, 768, 1440]) {
      await page.setViewport({ width: ancho, height: 900 });
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), modulo + ': sin desborde en ' + ancho);
      if (modulo === 'dijkstra') comprobar(await page.evaluate(() => [...document.querySelectorAll('#configDijkstra label')].every(label => {
        const control = document.getElementById(label.htmlFor), caja = control.getBoundingClientRect();
        return label.parentElement === control.parentElement && caja.width >= 150 && caja.left >= 0 && caja.right <= innerWidth;
      })), 'Dijkstra: etiquetas agrupadas y controles utilizables en ' + ancho);
    }
    await clic(page, '#btnResolverGrafo'); await page.waitForFunction(() => !!moduloGrafo.resultado);
    comprobar(await page.evaluate(() => moduloGrafo.vista === 'resultado' && !document.querySelector('[data-vista-grafo="procedimiento"]').classList.contains('completo')), modulo + ': Resultado primero, procedimiento opcional sin visitar');
    if (modulo === 'dijkstra') {
      await page.evaluate(() => { window.resultadoPruebaFinal = moduloGrafo.resultado; });
      await page.select('#destinoGrafo', 'n4');
      comprobar(await page.evaluate(() => moduloGrafo.resultado === window.resultadoPruebaFinal && document.querySelector('.gm-ruta-resultado').textContent.includes('2 + 2 + 2 = 6')), 'Destino consulta ruta y suma sin recalcular');
      await page.select('#objetivoDijkstra', 'max');
      comprobar(await page.evaluate(() => !moduloGrafo.resultado && document.getElementById('estadoCalculoGrafo').dataset.estado === 'pendiente' && document.getElementById('estadoCalculoGrafo').textContent.includes('objetivo') && document.getElementById('btnResolverGrafo').textContent.includes('Recalcular')), 'Objetivo invalida y ofrece recalcular en la misma vista');
      await clic(page, '#btnResolverGrafo'); await page.waitForFunction(() => !!moduloGrafo.resultado);
      comprobar(await page.evaluate(() => moduloGrafo.resultado.distancias.n4 === 9), 'DAG del ejemplo inicial distingue mínimo 6 y máximo 9');
      await page.evaluate(() => aplicarDocumentoModuloGrafo({ version: 1, modulo: 'dijkstra', grafo: crearEjemploGrafo('dijkstra', 'inalcanzable'), origen: 'n1', objetivo: 'max' }));
      await clic(page, '#btnResolverGrafo'); await page.waitForFunction(() => !!moduloGrafo.resultado);
      await clic(page, '#btnRevisarProcedimiento'); await clic(page, '#btnUltimoGrafo');
      comprobar(await page.$$eval('#tablaEstadoGrafo tbody tr', filas => filas[2].textContent.includes('Sin camino desde A') && !filas[2].textContent.includes('definitivo') && filas[0].cells[1].textContent === '0' && filas[1].cells[1].textContent === '2'), 'G-01: A=0, B=2 y C sin camino, sin marca de éxito');
      comprobar(await page.evaluate(() => AlgoContexto.ayudaLocal('Explícame este paso').includes('C: Sin camino desde A')), 'Algo coincide con el nodo inalcanzable del procedimiento');
      await page.evaluate(() => aplicarDocumentoModuloGrafo({ version: 1, modulo: 'dijkstra', grafo: crearEjemploGrafo('dijkstra', 'ciclico'), origen: 'n1', objetivo: 'max' }));
      const antes = await page.evaluate(() => JSON.stringify(moduloGrafo.grafo));
      await clic(page, '#btnResolverGrafo'); await page.waitForFunction(() => !moduloGrafo.preparando);
      comprobar(await page.evaluate(antes => !moduloGrafo.resultado && JSON.stringify(moduloGrafo.grafo) === antes && document.body.textContent.includes('Ciclo incompatible con máximo'), antes), 'Máximo con ciclo bloqueado sin transformar conexiones');
    } else {
      comprobar(await page.evaluate(() => moduloGrafo.resultado.total === 6 && document.getElementById('resultadoGrafo').textContent.includes('Subtotal: 6')), 'Kruskal mínimo 6 con subtotal real');
      await page.select('#objetivoGrafo', 'max'); await clic(page, '#btnResolverGrafo'); await page.waitForFunction(() => !!moduloGrafo.resultado);
      comprobar(await page.evaluate(() => moduloGrafo.resultado.total === 12), 'Kruskal máximo 12');
      await page.evaluate(() => aplicarDocumentoModuloGrafo({ version: 1, modulo: 'kruskal', grafo: crearEjemploGrafo('kruskal', 'desconectado') }));
      await clic(page, '#btnResolverGrafo'); await page.waitForFunction(() => !!moduloGrafo.resultado);
      comprobar(await page.$eval('#resultadoGrafo', e => e.textContent.includes('Bosque') && e.textContent.includes('Grupo 3: F · Conexiones elegidas: 0 · Subtotal: 0')), 'Bosque presenta componente aislada y subtotal cero');
    }
    await clic(page, '[data-vista-grafo="grafo"]');
    const antes = await page.evaluate(() => JSON.stringify(moduloGrafo.grafo));
    for (const valor of ['-1', '', '12abc', '1.5', '1000000']) {
      await escribir(page, '#pesoArista', valor); await page.select('#aristaDesde', 'n1'); await page.select('#aristaHacia', 'n3'); await clic(page, '#btnCrearArista');
      comprobar(await page.evaluate(antes => JSON.stringify(moduloGrafo.grafo) === antes, antes), modulo + ': peso inválido conserva ejercicio: ' + JSON.stringify(valor));
    }
    await escribir(page, '#nombreVertice', ' a '); await clic(page, '#btnCrearVertice');
    comprobar(await page.evaluate(antes => JSON.stringify(moduloGrafo.grafo) === antes, antes), modulo + ': nombre duplicado rechazado uniformemente');
    await page.evaluate(() => {
      const g = copiarGrafoModulo(moduloGrafo.grafo); g.nodos[1].nombre = 'A';
      aplicarDocumentoModuloGrafo({ version: 1, modulo: moduloGrafo.modulo, grafo: g, origen: 'n1' });
    });
    comprobar(await page.evaluate(() => document.querySelector('#origenGrafo option[value="n1"]').textContent === 'A [n1]' && document.querySelector('#origenGrafo option[value="n2"]').textContent === 'A [n2]' && document.querySelector('.nodo-editor-grafo[data-id="n1"]').textContent.includes('[n1]') && AlgoContexto.obtener().contexto.datos.nodos[0].nombre === 'A [n1]'), modulo + ': nombres antiguos distintos en lienzo, selector y Algo');
    comprobar(await page.evaluate(() => {
      const antes = JSON.stringify(serializarModuloGrafo()), documento = serializarModuloGrafo(); documento.grafo.conexiones[0].valor = -2;
      try { aplicarDocumentoModuloGrafo(documento); return false; }
      catch (error) { return JSON.stringify(serializarModuloGrafo()) === antes && documento.grafo.conexiones[0].valor === -2 && error.message.includes('negativo'); }
    }), modulo + ': carga antigua negativa rechazada sin modificar original ni ejercicio');
  } finally { await contexto.close(); }
}
async function focoReglas(browser, cantidad) {
  const { contexto, page } = await nuevaPagina(browser, 'logica-difusa');
  try {
    await page.evaluate(cantidad => {
      const m = DifusaModelo.crearEjemplo('ventilacion3');
      if (cantidad === 125) {
        m.entradas.forEach(v => { v.conjuntos = DifusaModelo.distribuirConjuntos(v, 5); });
        m.reglas = DifusaModelo.generarCombinaciones(m); m.reglas.forEach(r => { r.consecuente = m.salida.conjuntos[0].id; });
      }
      if (!DifusaEstado.aplicarModelo(m).ok) throw new Error('Modelo de prueba inválido');
      DifusaEditor.reiniciar();
    }, cantidad);
    await clic(page, '[data-vista="reglas"]');
    const id = await page.evaluate(() => DifusaEstado.estado.modelo.reglas[Math.floor(DifusaEstado.estado.modelo.reglas.length / 2)].id);
    const ant = '#ant-' + id + '-ocupacion', cons = '#cons-' + id, conector = '#conector-' + id, peso = '#peso-' + id, check = '#activa-' + id;
    for (const selector of [ant, conector, cons]) {
      await clic(page, selector);
      const desplazamiento = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      const posicion = await page.evaluate((selector, desplazamiento) => ({ foco: document.activeElement.id, esperado: document.querySelector(selector).id, scroll: scrollY, anterior: desplazamiento }), selector, desplazamiento);
      comprobar(posicion.foco === posicion.esperado && Math.abs(posicion.scroll - posicion.anterior) < 3, 'F-01: foco y desplazamiento estables ' + cantidad + ' reglas, ' + selector + ' ' + JSON.stringify(posicion));
    }
    await escribir(page, peso, '0.75');
    await page.$eval(peso, e => e.setSelectionRange(1, 3));
    comprobar(await page.$eval(peso, e => e === document.activeElement && e.selectionStart === 1 && e.selectionEnd === 3), 'F-01: peso conserva foco y selección con ' + cantidad + ' reglas');
    await clic(page, check); await page.keyboard.press('Space');
    comprobar(await page.$eval(check, e => e === document.activeElement), 'F-01: habilitación conserva foco con ' + cantidad + ' reglas');
    const ids = await page.evaluate(() => JSON.stringify(DifusaEditor.obtenerModeloEditor().reglas.map(r => r.id)));
    await page.select('#filtroEstadoDifusa', 'avisos');
    comprobar(await page.evaluate(ids => JSON.stringify(DifusaEditor.obtenerModeloEditor().reglas.map(r => r.id)) === ids, ids), 'Filtrar conserva IDs, datos y orden con ' + cantidad + ' reglas');
    if (cantidad === 27) {
      await page.select('#filtroEstadoDifusa', '');
      await clic(page, '[data-regla-id="' + id + '"] .difusa-acciones button:first-child');
      const creada = await page.evaluate(id => {
        const reglas = DifusaEditor.obtenerModeloEditor().reglas; return reglas[reglas.findIndex(r => r.id === id) + 1].id;
      }, id);
      comprobar(await page.evaluate(creada => document.activeElement.id === 'conector-' + creada, creada), 'Duplicar enfoca la regla creada');
      await clic(page, '[data-regla-id="' + creada + '"] .difusa-acciones button:last-child');
      await page.waitForSelector('#dialogoFondo:not([hidden])'); await clic(page, '#dialogoAceptar');
      await page.waitForFunction(() => document.getElementById('dialogoFondo').hidden);
      comprobar(await page.evaluate(creada => !DifusaEditor.obtenerModeloEditor().reglas.some(r => r.id === creada) && document.activeElement.id.startsWith('conector-'), creada), 'Eliminar enfoca una regla vecina');
    }
  } finally { await contexto.close(); }
}
async function difusa(browser) {
  const { contexto, page } = await nuevaPagina(browser, 'logica-difusa');
  try {
    await clic(page, '[data-vista="variables"]'); await clic(page, '#agregarEntradaDifusa');
    comprobar(await page.evaluate(() => document.activeElement.id === 'nombreVariableDifusa' && document.getElementById('agregarEntradaDifusa').disabled && document.getElementById('preparacionDifusa').textContent.includes('Borrador: Entradas 3/3') && document.getElementById('preparacionDifusa').textContent.includes('Entradas 2/3')), 'F-03/F-04: nombre enfocado, límite y contadores Aplicado/Borrador distintos');
    comprobar(await page.$eval('#editorVariablesDifusa', e => e.textContent.includes('Las reglas actuales ignoran esta entrada hasta que la utilices en sus condiciones') && e.textContent.includes('0 reglas habilitadas')), 'Participación de entrada nueva explicada sin alterar reglas');
    await clic(page, '#btnReglasEntradaDifusa');
    comprobar(await page.evaluate(() => document.activeElement.id === 'ant-' + DifusaEditor.obtenerModeloEditor().reglas[0].id + '-' + DifusaEditor.obtenerModeloEditor().entradas[2].id && [...document.querySelectorAll('.difusa-regla-editor')].filter(e => !e.hidden).length === 9), 'Acceso directo a entrada ignorada permite editar sus condiciones existentes');
    await clic(page, '[data-vista="variables"]');
    await clic(page, '#editorVariablesDifusa [data-aplicar-difusa]'); await clic(page, '[data-vista="evaluar"]');
    comprobar(await page.$$eval('[data-entrada-id]', inputs => inputs[2].value === '' && inputs[0].value === '5' && inputs[1].value === '5'), 'Entrada nueva vacía conserva las otras dos');
    await clic(page, '#evaluarDifusa');
    comprobar(await page.evaluate(() => document.activeElement.dataset.entradaId === DifusaEstado.estado.modelo.entradas[2].id && document.activeElement.getAttribute('aria-invalid') === 'true' && document.getElementById('error-' + document.activeElement.dataset.entradaId).textContent.length > 0 && !DifusaEstado.estado.resultado), 'F-02: error local, aria y foco en la entrada pendiente');
    await page.keyboard.press('Tab'); comprobar(await page.evaluate(() => document.activeElement.tagName !== 'BODY'), 'Tab continúa después del error');
    await clic(page, '[data-vista="inicio"]'); await clic(page, '[data-cargar-ejemplo="ventilacion3"]');
    await page.waitForSelector('#dialogoFondo:not([hidden])'); await clic(page, '#dialogoAceptar');
    await page.waitForFunction(() => DifusaEstado.estado.modelo.id === 'ventilacion3');
    await clic(page, '#casosVentilacionDifusa [data-ejemplo-difusa="20,50,0"]');
    comprobar(await page.evaluate(() => Math.abs(DifusaEstado.estado.resultado.centroide.valor - 50 / 3) < 1e-9), 'Ejemplo real: 0 personas produce 16,66667 %');
    await clic(page, '[data-vista="evaluar"]'); await clic(page, '#casosVentilacionDifusa [data-ejemplo-difusa="20,50,20"]');
    comprobar(await page.evaluate(() => Math.abs(DifusaEstado.estado.resultado.centroide.valor - 250 / 3) < 1e-9), 'Ejemplo real: 20 personas produce 83,33333 %');
    await clic(page, '#verReglasActivasDifusa');
    comprobar(await page.$$eval('#tablaReglas tr', filas => filas.filter(f => !f.hidden).length === 1 && filas.find(f => !f.hidden).dataset.reglaId === 'r15'), 'Reglas activas conservan identificador original');
    await clic(page, '#explorarMapaDifusa'); await clic(page, '#generarMapaDifusa'); await page.waitForFunction(() => document.getElementById('estadoMapaDifusa').textContent.includes('Mapa 15'));
    comprobar(await page.$eval('#estadoMapaDifusa', e => e.textContent.includes('Ocupación = 20 personas')), 'Mapa muestra nombre, valor y unidad fijos');
    await escribir(page, '#mapaFijo-ocupacion', '10');
    comprobar(await page.$eval('#graficaMapaDifusa', e => e.childElementCount === 0), 'Valor fijo invalida el mapa');
    for (const ancho of [320, 390, 768, 1440]) {
      await page.setViewport({ width: ancho, height: 900 });
      comprobar(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Difusa sin desborde en ' + ancho);
    }
    await clic(page, '[data-vista="evaluar"]'); await escribir(page, '#valor-temperatura', '');
    comprobar(await page.evaluate(() => !DifusaEstado.estado.resultado && document.getElementById('procedimientoVigenteDifusa').hidden && document.getElementById('graficaMapaDifusa').childElementCount === 0), 'Cambiar valores invalida resultado y mapa');
  } finally { await contexto.close(); }
}
(async () => {
  const respuesta = await fetch(BASE + 'dijkstra.html'); assert.equal(await respuesta.text(), fs.readFileSync(path.join(__dirname, '../dijkstra.html'), 'utf8'));
  const browser = await puppeteer.launch({ executablePath: process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  try {
    if (!process.argv.includes('--solo-difusa') && !process.argv.includes('--solo-evaluacion')) { await grafos(browser, 'dijkstra'); await grafos(browser, 'kruskal'); }
    if (!process.argv.includes('--solo-evaluacion')) { await focoReglas(browser, 27); await focoReglas(browser, 125); }
    await difusa(browser); comprobar(errores.length === 0, 'Sin errores de página');
  }
  finally { await browser.close(); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(() => console.log('Mejoras finales navegador: ' + correctas + ' comprobaciones. Errores de página: ' + errores.join('; ')));
