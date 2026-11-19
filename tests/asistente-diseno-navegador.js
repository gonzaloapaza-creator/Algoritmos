/* QA dirigido del diseño compartido. Edge existente, perfil y servidor Drop aislados.
 * node tests/asistente-diseno-navegador.js [--capturas]
 * No abre sesiones personales ni ejecuta MATLAB. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const { crearServidor } = require('./servidor-local');
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function escribir(page, texto) {
  await page.$eval('#algoPregunta', (e, valor) => {
    e.value = valor; e.dispatchEvent(new Event('input', { bubbles: true }));
  }, texto);
}
async function enviar(page, texto) {
  await escribir(page, texto);
  await page.$eval('#algoFormulario', e => e.requestSubmit());
}
const ultima = page => page.$eval('#algoMensajes .algo-mensaje--local:last-child > p', e => e.textContent);
const cantidad = page => page.$$eval('#algoMensajes article', e => e.length);
const almacenamiento = page => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
async function limites(page, ancho, alto) {
  const medidas = await page.evaluate(() => {
    const panel = document.getElementById('algoPanel'), cuerpo = document.getElementById('algoCuerpo');
    const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    return { panel: rect(panel), campo: rect(document.getElementById('algoPregunta')), enviar: rect(document.getElementById('algoEnviar')),
      cerrar: rect(document.getElementById('algoCerrar')), cuerpo: rect(cuerpo), formulario: rect(document.getElementById('algoFormulario')),
      desborde: panel.scrollWidth > panel.clientWidth + 1, scrollPanel: panel.scrollHeight > panel.clientHeight + 1,
      fuente: parseFloat(getComputedStyle(panel.querySelector('.algo-mensaje > p') || document.getElementById('algoBienvenida')).fontSize),
      scrolls: Array.from(panel.querySelectorAll('*')).filter(e => e !== cuerpo && e.tagName !== 'TEXTAREA'
        && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1).length };
  });
  assert.ok(medidas.panel.x >= 0 && medidas.panel.right <= ancho + 1 && medidas.panel.y >= 0 && medidas.panel.bottom <= alto + 1, JSON.stringify(medidas));
  for (const k of ['campo', 'enviar', 'cerrar']) {
    assert.ok(medidas[k].height >= 44 && medidas[k].bottom <= alto && medidas[k].y >= 0, k + ': alcanzable');
  }
  assert.ok(medidas.cuerpo.height > 30 && !medidas.desborde && !medidas.scrollPanel && medidas.scrolls === 0, 'Solo el historial desplaza el contenido');
  assert.ok(medidas.fuente >= 14 && medidas.fuente <= 16, 'Texto principal legible');
  return medidas;
}

(async () => {
  const servidor = crearServidor({ raiz: path.join(__dirname, '../entrega-netlify/drop') });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + servidor.address().port + '/';
  const capturas = process.argv.includes('--capturas') ? fs.mkdtempSync(path.join(os.tmpdir(), 'algo-diseno-qa-')) : null;
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
    const perfil = await browser.createBrowserContext(), page = await perfil.newPage();
    page.setDefaultTimeout(8000);
    const errores = [], faltantes = [], redChat = [];
    let conversando = false;
    page.on('pageerror', e => errores.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errores.push(e.text()); });
    page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) faltantes.push(r.url()); });
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (conversando) redChat.push(r.url());
      if (r.url().startsWith(base) || r.url().startsWith('data:')) r.continue();
      else r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Externo omitido en QA</title>' });
    });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const cargar = async pagina => {
      conversando = false;
      await page.goto(base + pagina + '?intro=no', { waitUntil: 'networkidle0' });
      await page.waitForSelector('#algoAbrir');
      await page.waitForFunction(() => !AlgoContexto.obtener().contexto.datos.preparando);
    };
    await page.setViewport({ width: 1366, height: 900 });
    await cargar('logica-difusa-matlab.html');
    conversando = true;
    const memoriaInicial = await almacenamiento(page);
    await page.focus('#algoAbrir'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'algoTitulo');
    assert.equal(await page.$eval('#algoAbrir', e => e.getAttribute('aria-expanded')), 'true');
    assert.deepEqual(await page.$$eval('#algoPreguntasContexto button', e => e.map(b => b.textContent)), ['Abrir el ejemplo', 'Crear un sistema', 'Ver el procedimiento']);
    assert.equal(await cantidad(page), 0);
    const inicial = await limites(page, 1366, 900);
    assert.ok(inicial.panel.width >= 380 && inicial.panel.width <= 420 && inicial.formulario.height < 80 && inicial.cuerpo.height > inicial.panel.height * .6);
    if (capturas) await page.screenshot({ path: path.join(capturas, 'desktop-inicial.png') });
    await enviar(page, '   '); assert.equal(await cantidad(page), 0);
    assert.match(await page.$eval('#algoEstado', e => e.textContent), /Escribe/);
    await escribir(page, 'a'.repeat(1201));
    await page.$eval('#algoFormulario', e => e.requestSubmit());
    assert.equal(await cantidad(page), 0);
    assert.match(await page.$eval('#algoEstado', e => e.textContent), /1200/);
    await escribir(page, 'Borrador\nsegunda línea');
    await page.click('#algoCerrar');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'algoAbrir');
    await page.click('#algoAbrir');
    assert.equal(await page.$eval('#algoPregunta', e => e.value), 'Borrador\nsegunda línea');
    await escribir(page, '¿Cómo creo un sistema nuevo en MATLAB?');
    await page.focus('#algoPregunta');
    await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift');
    assert.equal(await cantidad(page), 0);
    await page.keyboard.press('Enter');
    assert.equal(await cantidad(page), 2);
    assert.match(await ultima(page), /Custom FIS[\s\S]*Mamdani Type-1/);
    assert.equal(await page.$eval('#algoSugeridas', e => e.hidden), true);
    await enviar(page, '¿Cómo creo un sistema nuevo en MATLAB?');
    assert.equal(await cantidad(page), 2, 'No duplica envío inmediato');
    await enviar(page, 'Duda <img src=x onerror=alert(1)>');
    assert.equal(await page.$('#algoMensajes img, #algoMensajes script'), null);
    await enviar(page, '¿Qué comandos uso en MATLAB?');
    const texto = await ultima(page);
    assert.ok(await page.$('.algo-mensaje--local:last-child code'));
    const copiar = '#algoMensajes .algo-mensaje--local:last-child .algo-copia button';
    const estadoCopia = '#algoMensajes .algo-mensaje--local:last-child .algo-copia-estado';
    // Promesa pendiente: la confirmación solo aparece después de resolverla.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: texto => { window.textoCopiadoQA = texto; return new Promise(resolve => { window.terminarCopiaQA = resolve; }); }
    } }));
    await page.click(copiar);
    assert.equal(await page.$eval(estadoCopia, e => e.textContent), '');
    assert.equal(await page.$eval(copiar, e => e.disabled), true);
    assert.equal(await page.evaluate(() => window.textoCopiadoQA), texto);
    await page.evaluate(() => window.terminarCopiaQA());
    await page.waitForFunction(() => document.querySelector('.algo-mensaje--local:last-child .algo-copia-estado').textContent === 'Respuesta copiada.');
    // Rechazo y ausencia real de la API: selección exacta, sin falso éxito.
    for (const modo of ['rechazo', 'ausente']) {
      await page.evaluate(modo => Object.defineProperty(navigator, 'clipboard', { configurable: true,
        value: modo === 'ausente' ? undefined : { writeText: () => Promise.reject(new Error('QA denegado')) } }), modo);
      await page.click(copiar);
      await page.waitForFunction(() => document.querySelector('.algo-mensaje--local:last-child .algo-copia-estado').textContent.startsWith('Texto seleccionado.'));
      assert.equal(await page.evaluate(() => getSelection().toString()), texto);
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'P');
    }
    await page.evaluate(() => getSelection().removeAllRanges());
    // Una copia pendiente que falla después de cerrar no roba el foco.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: () => new Promise((_, reject) => { window.rechazarCopiaQA = reject; }) } }));
    await page.click(copiar); await page.click('#algoCerrar');
    await page.evaluate(() => window.rechazarCopiaQA(new Error('QA cierre durante copia')));
    await page.waitForFunction(() => !document.querySelector('.algo-mensaje--local:last-child .algo-copia button').disabled);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'algoAbrir');
    assert.equal(await page.evaluate(() => getSelection().toString()), '');
    await page.click('#algoAbrir');
    // Ejemplos y catálogo bajo un único acceso; sin otra barra de desplazamiento.
    await page.click('#algoVerTemas');
    assert.equal(await page.$eval('#algoVerTemas', e => e.getAttribute('aria-expanded')), 'true');
    await page.click('#algoEjemplos');
    assert.ok(await page.$$eval('#algoResultados button', e => e.length > 0 && e.length <= 9));
    await page.click('#algoExploradorCerrar');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'algoVerTemas');
    await page.click('#algoVerTemas');
    await page.type('#algoBuscar', 'matlab');
    assert.ok(await page.$$eval('#algoResultados button', e => e.length > 0));
    await page.click('#algoExploradorCerrar');
    // Un mensaje anterior sigue en la misma posición al llegar otra respuesta.
    await enviar(page, '¿Cómo uso Rule Inference y Control Surface?');
    await page.$eval('#algoCuerpo', e => { e.scrollTop = 100; });
    const lectura = await page.$eval('#algoCuerpo', e => e.scrollTop);
    await enviar(page, '¿Puedes ejecutar MATLAB y consultar mi resultado?');
    assert.match(await ultima(page), /no ejecuta MATLAB[\s\S]*no consulta tu sesión privada/i);
    assert.ok(Math.abs(await page.$eval('#algoCuerpo', e => e.scrollTop) - lectura) < 2, 'Conserva lectura anterior');
    assert.equal(await page.$eval('#algoNuevas', e => e.hidden), false);
    await page.click('#algoNuevas');
    assert.equal(await page.$eval('#algoNuevas', e => e.hidden), true);
    await enviar(page, '¿Cómo guardo y descargo mi FIS?');
    assert.ok(await page.$eval('#algoCuerpo', e => e.scrollHeight - e.scrollTop - e.clientHeight < 3), 'Sigue al final al conversar');
    await escribir(page, 'línea 1\nlínea 2\nlínea 3\nlínea 4\nlínea 5\nlínea 6');
    const altoCampo = await page.$eval('#algoPregunta', e => e.clientHeight);
    assert.ok(altoCampo >= 90 && altoCampo <= 108);
    await escribir(page, 'Borrador conservado');
    const historial = await cantidad(page);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#algoPanel', e => e.hidden), true);
    await page.click('#algoAbrir');
    assert.equal(await cantidad(page), historial);
    assert.equal(await page.$eval('#algoPregunta', e => e.value), 'Borrador conservado');
    // Escritorio: el foco puede salir del panel no modal.
    await page.focus('#algoEnviar'); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.getElementById('algoPanel').contains(document.activeElement)), false);
    await page.focus('#algoPregunta');
    assert.equal(await almacenamiento(page), memoriaInicial);
    await page.click('#algoLimpiar');
    assert.equal(await cantidad(page), 0);
    assert.equal(await page.$eval('#algoSugeridas', e => e.hidden), false);
    assert.equal(await almacenamiento(page), memoriaInicial, 'Limpiar solo afecta al asistente');
    console.log('✓ Conversación, borrador, límites, teclado, seguridad, copia pendiente/éxito/fallo, temas y lectura.');

    const paginas = [
      ['index.html', /Ciudad/, /algoritmo/, '¿Qué algoritmo elijo?'],
      ['logica-difusa-opciones.html', /Elegir versión/, /Lógica difusa/, '¿Qué ofrece cada versión?'],
      ['logica-difusa-matlab.html', /MATLAB Online/, /MATLAB/, '¿Cómo abro el ejemplo de ventilación?'],
      ['logica-difusa.html', /Lógica difusa/, /variables/, '¿Dónde estoy?'],
      ['ordenamiento.html', /Ordenamiento/, /resultado/, 'Explícame el resultado']
    ];
    for (const ancho of [1366, 390, 320]) for (const tema of ['claro', 'oscuro']) {
      await page.setViewport({ width: ancho, height: ancho === 1366 ? 900 : 844 });
      await page.evaluate(t => localStorage.setItem('ui.tema.v1', t), tema);
      for (const [pagina, contexto, saludo, pregunta] of paginas) {
        await cargar(pagina);
        if (pagina === 'ordenamiento.html') {
          await page.$eval('#entradaValores', e => { e.value = '5, 2, 4, 1'; e.dispatchEvent(new Event('input', { bubbles: true })); });
          await page.click('#btnAplicar');
          await page.waitForFunction(() => AlgoContexto.obtener().contexto.resultadoVigente);
          await page.$eval('#deslizadorPasos', e => { e.value = e.max; e.dispatchEvent(new Event('input', { bubbles: true })); });
          await page.waitForFunction(() => AlgoContexto.obtener().contexto.resultado.arregloFinal !== null);
        }
        const firma = await page.evaluate(() => AlgoContexto.obtener().firma), guardados = await almacenamiento(page);
        conversando = true;
        await page.click('#algoAbrir');
        assert.equal(await page.$eval('html', e => e.dataset.tema), tema);
        assert.match(await page.$eval('#algoModulo', e => e.textContent), contexto);
        assert.match(await page.$eval('#algoBienvenida', e => e.textContent), saludo);
        assert.equal(await page.$$eval('#algoPreguntasContexto button', e => e.length), 3);
        assert.equal(await page.$eval('#algoPanel', e => e.getAttribute('aria-modal')), ancho === 1366 ? 'false' : 'true');
        await limites(page, ancho, ancho === 1366 ? 900 : 844);
        if (capturas && (pagina === 'logica-difusa-matlab.html' || (ancho === 390 && pagina === 'index.html'))) {
          await page.screenshot({ path: path.join(capturas, pagina.replace('.html', '') + '-' + ancho + '-' + tema + '-inicial.png') });
        }
        await enviar(page, pregunta);
        assert.equal(await page.$eval('#algoSugeridas', e => e.hidden), true);
        const respuesta = await ultima(page);
        if (pagina.includes('opciones')) assert.match(respuesta, /navegador[\s\S]*MATLAB Online/);
        if (pagina.includes('matlab')) assert.match(respuesta, /abrir_ventilacion\.m/);
        if (pagina === 'ordenamiento.html') assert.match(respuesta, /1[\s\S]*2[\s\S]*4[\s\S]*5/);
        if (pagina === 'ordenamiento.html' && ancho === 1366 && tema === 'claro') {
          assert.ok(respuesta.includes('\n'), 'Respuesta real con saltos de línea');
          await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
            value: { writeText: texto => { window.copiaMultilineaQA = texto; return Promise.resolve(); } } }));
          await page.click(copiar);
          assert.equal(await page.evaluate(() => window.copiaMultilineaQA), respuesta, 'Copia conserva todos los saltos');
        }
        if (pagina === 'logica-difusa.html') assert.match(respuesta, /Vista actual: Lógica difusa/);
        await limites(page, ancho, ancho === 1366 ? 900 : 844);
        // Contraste del texto principal y secundario sobre la superficie del panel.
        const contrastes = await page.$eval('#algoPanel', panel => {
          const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
          const luz = color => { const c = rgb(color); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
          const fondo = luz(getComputedStyle(panel).backgroundColor);
          const contrastes = ['.algo-mensaje--local > p', '#algoModulo', '.algo-copia button'].map(selector => {
            const texto = luz(getComputedStyle(panel.querySelector(selector)).color);
            return (Math.max(texto, fondo) + .05) / (Math.min(texto, fondo) + .05);
          });
          const campo = panel.querySelector('#algoPregunta'), campoFondo = luz(getComputedStyle(campo).backgroundColor);
          const placeholder = luz(getComputedStyle(campo, '::placeholder').color);
          contrastes.push((Math.max(placeholder, campoFondo) + .05) / (Math.min(placeholder, campoFondo) + .05));
          return contrastes;
        });
        assert.ok(contrastes.every(c => c >= 4.5), 'Contraste en ' + tema + ': ' + contrastes);
        assert.equal(await page.evaluate(() => AlgoContexto.obtener().firma), firma, 'Ejercicio intacto');
        assert.equal(await almacenamiento(page), guardados, 'Almacenamiento intacto');
        if (capturas && pagina === 'logica-difusa-matlab.html') await page.screenshot({ path: path.join(capturas, 'matlab-' + ancho + '-' + tema + '-respuesta.png') });
        if (ancho !== 1366) {
          await page.focus('#algoEnviar'); await page.keyboard.press('Tab');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'algoCerrar');
          await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'algoEnviar');
        }
        await page.keyboard.press('Escape');
        assert.equal(await page.$eval('#algoPanel', e => e.hidden), true);
        assert.equal(await page.$eval('#algoAbrir', e => e.getAttribute('aria-expanded')), 'false');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'algoAbrir');
      }
      console.log('✓ Cinco contextos reales · ' + ancho + ' px · ' + tema + ': geometría, respuesta, contraste, foco y estado.');
    }
    // Escape respeta la ayuda activa y no cierra también Algo.
    await page.setViewport({ width: 1366, height: 900 });
    await cargar('ordenamiento.html'); conversando = true;
    await page.click('#algoAbrir'); await page.click('#btnAyuda');
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#modalAyuda', e => e.hidden), true);
    assert.equal(await page.$eval('#algoPanel', e => e.hidden), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btnAyuda');
    await page.focus('#algoPregunta'); await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#algoPanel', e => e.hidden), true);
    // Diálogo nativo superpuesto: solo su cancelación recibe Escape.
    await cargar('logica-difusa-matlab.html'); conversando = true;
    await page.click('#algoAbrir');
    await page.$eval('#ayudaMatlab', e => e.showModal());
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#ayudaMatlab', e => e.open), false);
    assert.equal(await page.$eval('#algoPanel', e => e.hidden), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#algoPanel', e => e.hidden), true);
    // Altura disponible reducida, como al aparecer el teclado virtual.
    await page.setViewport({ width: 390, height: 844 });
    await page.click('#algoAbrir');
    await escribir(page, 'Borrador con teclado');
    await page.evaluate(() => {
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: { height: 360, width: 390, offsetTop: 0 } });
      window.dispatchEvent(new Event('resize'));
    });
    await limites(page, 390, 360);
    assert.equal(await page.$eval('#algoPregunta', e => e.value), 'Borrador con teclado');
    if (capturas) await page.screenshot({ path: path.join(capturas, 'movil-teclado-emulado.png') });
    await escribir(page, 'Una línea\nOtra línea\nTercera línea\nCuarta línea');
    await page.evaluate(() => { window.visualViewport.height = 280; window.dispatchEvent(new Event('resize')); });
    await limites(page, 390, 280);
    assert.equal(await page.$eval('.algo-cabecera .algo-robot', e => getComputedStyle(e).animationName), 'none');
    await page.keyboard.press('Escape');
    await page.setViewport({ width: 640, height: 450 });
    await cargar('logica-difusa-matlab.html'); conversando = true;
    await page.click('#algoAbrir'); await limites(page, 640, 450);
    assert.deepEqual(errores, []); assert.deepEqual(faltantes, []); assert.deepEqual(redChat, []);
    console.log('✓ Ayuda y Escape por capas; altura con teclado emulado; ventana reducida; movimiento reducido; cero errores o solicitudes del chat.');
    if (capturas) console.log('Capturas: ' + capturas);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => servidor.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
