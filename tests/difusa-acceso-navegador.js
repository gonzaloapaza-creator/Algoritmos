/* Integración dirigida sobre Drop; Edge existente y contextos aislados.
 * node tests/difusa-acceso-navegador.js [--capturas]
 * No usa perfiles personales, MATLAB ni servicios externos. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const { crearServidor } = require('./servidor-local');
const RAIZ = path.resolve(__dirname, '..');
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const original = fs.readFileSync(path.join(RAIZ, 'matlab/ventilacion_aula.fis'));
const sha256 = datos => crypto.createHash('sha256').update(datos).digest('hex');
const HASH_FIS = 'ef5e60f81ef46816bee8c9efdae92990a33a701f7558a23cad205b5c5068ab0e';
const ARCHIVOS = ['ventilacion_aula.fis', 'abrir_ventilacion.m', 'LEEME_MATLAB.txt'];

function verificarEjemplo(datos) {
  const nombres = [];
  let offset = 0;
  while (datos.readUInt32LE(offset) === 0x04034b50) {
    const largo = datos.readUInt16LE(offset + 26), extra = datos.readUInt16LE(offset + 28);
    const nombre = datos.subarray(offset + 30, offset + 30 + largo).toString('utf8');
    const inicio = offset + 30 + largo + extra, fin = inicio + datos.readUInt32LE(offset + 18);
    const contenido = zlib.inflateRawSync(datos.subarray(inicio, fin));
    assert.deepEqual(contenido, fs.readFileSync(path.join(RAIZ, 'matlab', nombre)), nombre + ' original');
    nombres.push(nombre);
    offset = fin;
  }
  assert.deepEqual(nombres, ARCHIVOS, 'ZIP contiene únicamente los tres archivos del ejemplo');
  assert.equal(datos.readUInt32LE(offset), 0x02014b50);
}

async function clic(page, selector) {
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.click(selector);
}

async function descargar(page, selector, carpeta, nombre) {
  await clic(page, selector);
  const destino = path.join(carpeta, nombre);
  for (let intento = 0; intento < 100; intento++) {
    if (fs.existsSync(destino) && !fs.existsSync(destino + '.crdownload')) return fs.readFileSync(destino);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('No terminó la descarga: ' + nombre);
}

async function ayudaYAlgo(page, pagina) {
  assert.equal(await page.$$eval('#algoAbrir', e => e.length), 1, 'Un único Algo');
  assert.equal(await page.evaluate(() => typeof DifusaEstado), 'undefined', 'Sin motor/editor web en las páginas informativas');
  for (const id of ['btnAyuda', 'btnVideoModulo', 'algoAbrir']) assert.ok(await page.$eval('#' + id, e => e.getClientRects().length > 0), id + ' visible');
  const matlab = pagina.includes('matlab');
  const foto = await page.evaluate(() => AlgoContexto.obtener());
  assert.equal(foto.contexto.datos.paginaAcceso, matlab ? 'matlab' : 'opciones');
  assert.equal(foto.contexto.resultadoVigente, false);
  assert.equal(foto.contexto.resultado, null);
  await page.focus('#btnAyuda');
  await page.keyboard.press('Enter');
  if (matlab) {
    await page.waitForSelector('#ayudaMatlab[open]');
    assert.equal(await page.$eval('#ayudaMatlab', e => e.matches(':modal')), true);
  } else {
    await page.waitForSelector('#dialogoFondo:not([hidden])');
    assert.match(await page.$eval('#dialogoMensaje', e => e.textContent), /navegador[\s\S]*MATLAB[\s\S]*regresar/i);
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.getElementById('dialogoFondo').contains(document.activeElement)));
  }
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('ayudaMatlab')?.open && (!document.getElementById('dialogoFondo') || document.getElementById('dialogoFondo').hidden));
  assert.equal(await page.evaluate(() => document.activeElement.id), 'btnAyuda');
  // El chat real recibe texto y responde usando el contexto de la página.
  await page.focus('#algoAbrir');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#algoPanel:not([hidden])');
  await page.type('#algoPregunta', matlab ? '¿Cómo creo un sistema nuevo en MATLAB?' : '¿Qué ofrece cada versión?');
  await page.keyboard.press('Enter');
  const respuesta = await page.$eval('#algoMensajes .algo-mensaje--local:last-child > p', e => e.textContent);
  assert.match(respuesta, matlab ? /Custom FIS[\s\S]*Mamdani Type-1/ : /navegador[\s\S]*MATLAB Online/);
  await page.type('#algoPregunta', '¿Puedes ejecutar MATLAB y consultar mi resultado?');
  await page.keyboard.press('Enter');
  assert.match(await page.$eval('#algoMensajes .algo-mensaje--local:last-child > p', e => e.textContent), /no ejecuta MATLAB[\s\S]*no consulta tu sesi[oó]n privada/i);
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#algoPanel', e => e.hidden), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'algoAbrir');
  // La ayuda ocupa su capa por encima del chat en escritorio y lo cierra antes.
  if (await page.evaluate(() => innerWidth > 640)) {
    await clic(page, '#algoAbrir');
    await clic(page, '#btnAyuda');
    assert.equal(await page.$eval('#algoPanel', e => e.hidden), true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement.id === 'btnAyuda');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btnAyuda', 'Retorno de Ayuda después del chat: ' + pagina);
  }
  await clic(page, '#btnVideoModulo');
  await page.waitForSelector('#introModulo:not([hidden])');
  assert.match(await page.$eval('#introMarco iframe', e => e.src), /youtube-nocookie\.com\/embed\/ayfoP7Tqa-s/);
  await clic(page, '#btnVideoModulo');
  assert.equal(await page.$('#introMarco iframe'), null, 'Cerrar Video retira el reproductor');
}

async function navegacionCiudad(page, base) {
  const navegaciones = [];
  const contar = solicitud => { if (solicitud.isNavigationRequest() && solicitud.frame() === page.mainFrame()) navegaciones.push(solicitud.url()); };
  page.on('request', contar);
  const iniciar = async () => {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await clic(page, '#vistaCiudad');
  };
  await iniciar();
  await page.evaluate(() => localStorage.setItem('ui.intro.difusa', 'omitir'));
  for (const acceso of ['ficha', 'lista', 'menu']) {
    await iniciar();
    let selector;
    if (acceso === 'ficha') {
      const antes = navegaciones.length;
      await clic(page, '.ciudad-zona[data-modulo="difusa"]');
      assert.equal(navegaciones.length, antes, 'Un clic solo selecciona');
      assert.equal(await page.$eval('.ciudad-zona[data-modulo="difusa"]', e => e.getAttribute('aria-pressed')), 'true');
      selector = '#panelModulo .ciudad-abrir';
    } else if (acceso === 'lista') {
      await clic(page, '#vistaLista');
      selector = '#catalogo a[href="logica-difusa.html?intro=si"]';
    } else selector = '#barraLateral a[title="Lógica difusa"]';
    await clic(page, selector);
    await page.waitForSelector('#introModulo:not([hidden])');
    assert.equal(new URL(page.url()).searchParams.get('intro'), 'si');
    assert.equal(await page.evaluate(() => localStorage.getItem('ui.intro.difusa')), 'omitir', 'Preferencia conservada');
    const fuente = await page.$eval('#introMarco iframe', e => e.src);
    assert.match(fuente, /ayfoP7Tqa-s/);
    assert.equal(new URL(fuente).searchParams.get('autoplay'), '0');
    await clic(page, '#btnComenzarModulo');
    await page.waitForSelector('#elegirMatlab');
    assert.match(page.url(), /logica-difusa-opciones\.html$/);
    assert.equal(await page.$('#introMarco iframe'), null);
  }
  await iniciar();
  const modulos = await page.evaluate(() => CATALOGO_ALGORITMOS.filter(a => a.disponible).map(a => ({ id: a.id, ruta: a.ruta })));
  for (const modulo of modulos) {
    await iniciar();
    const selector = '.ciudad-zona[data-modulo="' + modulo.id + '"]';
    await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const caja = await page.$eval(selector, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const antes = navegaciones.length;
    await page.mouse.click(caja.x, caja.y);
    assert.equal(navegaciones.length, antes);
    const carga = page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.mouse.click(caja.x, caja.y, { clickCount: 2 });
    await carga;
    assert.equal(navegaciones.length - antes, 1, modulo.id + ': una sola navegación por doble clic');
    const url = new URL(page.url());
    assert.equal(url.pathname.slice(1), modulo.id === 'difusa' ? 'logica-difusa-opciones.html' : modulo.ruta);
    if (modulo.id !== 'difusa') assert.equal(url.searchParams.get('intro'), 'no');
    assert.equal(await page.$('#introMarco iframe'), null, 'Acceso directo sin introducción');
  }
  await iniciar();
  const selector = '.ciudad-zona[data-modulo="difusa"]';
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const caja = await page.$eval(selector, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const antes = navegaciones.length;
  await page.mouse.move(caja.x, caja.y);
  await page.mouse.down();
  await page.mouse.move(caja.x + 40, caja.y + 8, { steps: 4 });
  await page.mouse.move(caja.x, caja.y, { steps: 4 });
  await page.mouse.up();
  await page.mouse.click(caja.x, caja.y, { clickCount: 2 });
  assert.equal(navegaciones.length, antes, 'Arrastrar y volver al origen no abre un módulo');
  await page.$eval(selector, e => {
    e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 77, button: 0, isPrimary: true }));
    e.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 77 }));
    e.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    e.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
  });
  assert.equal(navegaciones.length, antes, 'Un gesto cancelado no navega');
  await page.mouse.click(caja.x, caja.y);
  assert.equal(await page.$eval(selector, e => e.getAttribute('aria-pressed')), 'true', 'Un clic posterior a cancelar vuelve a funcionar');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await iniciar();
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const tactil = await page.$eval(selector, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const antesTap = navegaciones.length;
  await page.touchscreen.tap(tactil.x, tactil.y);
  assert.equal(navegaciones.length, antesTap, 'Un toque conserva la selección táctil');
  assert.equal(await page.$eval(selector, e => e.getAttribute('aria-pressed')), 'true');
  const accesoTactil = '#ciudadAccesoMovil .ciudad-abrir';
  await page.waitForSelector(accesoTactil, { visible: true });
  await clic(page, accesoTactil);
  await page.waitForSelector('#introModulo:not([hidden])');
  assert.equal(new URL(page.url()).searchParams.get('intro'), 'si');
  await page.setViewport({ width: 1366, height: 900, isMobile: false, hasTouch: false });
  page.off('request', contar);
  console.log('✓ Ficha/lista/menú → video original → selector sin borrar preferencias; doble clic único en los nueve módulos; arrastre/cancelación y acceso táctil conservados.');
}

async function ayudaMatlab(page) {
  await page.focus('#abrirAyudaMatlab');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#ayudaMatlab[open]');
  assert.equal(await page.$eval('#ayudaMatlab', e => e.matches(':modal')), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'cerrarAyudaMatlab');
  assert.equal(await page.$$eval('#ayudaMatlab details', e => e.length), 6);
  for (let i = 0; i < 20; i++) {
    if (i === 10) await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.getElementById('ayudaMatlab').contains(document.activeElement)), 'El foco permanece dentro del diálogo');
  }
  await page.keyboard.up('Shift');
  // El fondo es inerte incluso si se intenta enfocar un enlace por código.
  await page.evaluate(() => document.getElementById('abrirMatlabOnline').focus());
  assert.ok(await page.evaluate(() => document.getElementById('ayudaMatlab').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  await page.waitForSelector('#ayudaMatlab:not([open])');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'abrirAyudaMatlab');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#ayudaMatlab[open]');
  await clic(page, '#cerrarAyudaMatlab');
  await page.waitForSelector('#ayudaMatlab:not([open])');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'abrirAyudaMatlab');
}

async function copiasMatlab(page) {
  const esperados = {
    comandoMatlab: "fuzzyLogicDesigner('ventilacion_aula.fis')",
    comandoNuevoMatlab: 'fuzzyLogicDesigner',
    entradasBajasMatlab: '[0 0 0]',
    entradasCentralesMatlab: '[20 50 10]',
    entradasAltasMatlab: '[40 100 20]',
    comandoEjemploAyudaMatlab: "fuzzyLogicDesigner('ventilacion_aula.fis')",
    comandoNuevoAyudaMatlab: 'fuzzyLogicDesigner',
    comandoDiagnosticoMatlab: "ver('fuzzy')"
  };
  const botones = await page.$$eval('[data-copiar]', lista => lista.map(e => ({ destino: e.dataset.copiar, estado: e.dataset.estado, tipo: e.dataset.tipo || 'comando', ayuda: !!e.closest('dialog') })));
  assert.equal(botones.length, Object.keys(esperados).length);
  assert.equal(new Set(botones.map(b => b.destino)).size, botones.length);
  assert.equal(new Set(botones.map(b => b.estado)).size, botones.length);
  for (const boton of botones) {
    if (boton.ayuda && !await page.$eval('#ayudaMatlab', e => e.open)) {
      await clic(page, '#abrirAyudaMatlab');
      await page.waitForSelector('#ayudaMatlab[open]');
    }
    await page.$eval('#' + boton.destino, e => { for (let p = e.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true; });
    assert.equal(await page.$eval('#' + boton.destino, e => e.textContent), esperados[boton.destino]);
    assert.equal(await page.$eval('#' + boton.estado, e => e.getAttribute('aria-live')), 'polite');
    const selector = '[data-copiar="' + boton.destino + '"]';
    // Promesa pendiente: no debe anunciar éxito antes de que se confirme la copia.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: texto => new Promise(resolve => { window.__comandoCopiado = texto; window.__confirmarCopia = resolve; }) } }));
    const anteriores = await page.$$eval('button[data-copiar][data-estado]', botones => Object.fromEntries(botones.map(b => [b.dataset.estado, document.getElementById(b.dataset.estado).textContent])));
    await clic(page, selector);
    assert.equal(await page.evaluate(() => window.__comandoCopiado), esperados[boton.destino]);
    assert.equal(await page.$eval('#' + boton.estado, e => e.textContent), '');
    assert.equal(await page.$eval(selector, e => e.disabled), true);
    await page.evaluate(() => window.__confirmarCopia());
    await page.waitForFunction(id => document.getElementById(id).textContent.length > 0, {}, boton.estado);
    assert.match(await page.$eval('#' + boton.estado, e => e.textContent), boton.tipo === 'entradas' ? /^Entradas copiadas/ : /^Comando copiado/);
    const posteriores = await page.$$eval('button[data-copiar][data-estado]', botones => Object.fromEntries(botones.map(b => [b.dataset.estado, document.getElementById(b.dataset.estado).textContent])));
    for (const [id, valor] of Object.entries(anteriores)) if (id !== boton.estado) assert.equal(posteriores[id], valor, 'Estado independiente: ' + id);
    // Rechazo explícito y ausencia del portapapeles, cada uno con selección manual.
    for (const modo of ['rechazo', 'ausente']) {
      await page.evaluate(valor => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: valor === 'ausente' ? undefined : { writeText: async () => { throw new Error('Permiso denegado de prueba'); } } }), modo);
      await clic(page, selector);
      await page.waitForFunction(id => document.getElementById(id).textContent.includes('manualmente'), {}, boton.estado);
      assert.equal(await page.evaluate(() => window.getSelection().toString()), esperados[boton.destino]);
      assert.equal(await page.evaluate(() => document.activeElement.id), boton.destino);
      assert.equal(await page.$eval(selector, e => e.disabled), false);
      assert.equal(await page.$eval('#' + boton.destino, e => e.getClientRects().length > 0), true);
      assert.doesNotMatch(await page.$eval('#' + boton.estado, e => e.textContent), /copiado|copiadas/i);
    }
  }
  await page.keyboard.press('Escape');
  await page.waitForSelector('#ayudaMatlab:not([open])');
  console.log('✓ Ocho copias independientes, éxito solo tras confirmación, estados propios y selección manual ante rechazo o ausencia de portapapeles.');
}

(async () => {
  assert.equal(sha256(original), HASH_FIS, 'FIS original sin modificación');
  const servidor = crearServidor({ raiz: path.join(RAIZ, 'entrega-netlify/drop') });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + servidor.address().port + '/';
  const descargas = fs.mkdtempSync(path.join(os.tmpdir(), 'difusa-descargas-'));
  const capturas = process.argv.includes('--capturas') ? fs.mkdtempSync(path.join(os.tmpdir(), 'difusa-acceso-qa-')) : null;
  let browser;
  const errores = [], recursos = [];
  try {
    for (const nombre of [...ARCHIVOS, 'ventilacion_aula.zip']) {
      const respuesta = await fetch(base + 'matlab/' + nombre);
      assert.equal(respuesta.status, 200, nombre + ' disponible');
      const datos = Buffer.from(await respuesta.arrayBuffer());
      assert.deepEqual(datos, fs.readFileSync(path.join(RAIZ, 'matlab', nombre)));
      if (nombre.endsWith('.zip')) verificarEjemplo(datos);
    }
    console.log('✓ Descargas HTTP y ZIP de tres archivos; .fis original idéntico por SHA-256.');
    browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
    const contexto = await browser.createBrowserContext();
    const page = await contexto.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', error => errores.push(error.message));
    page.on('console', mensaje => { if (mensaje.type() === 'error') errores.push(mensaje.text()); });
    page.on('response', respuesta => { if (respuesta.url().startsWith(base) && respuesta.status() >= 400) recursos.push(respuesta.url()); });
    await page.setRequestInterception(true);
    page.on('request', solicitud => {
      if (solicitud.url().startsWith(base) || solicitud.url().startsWith('data:')) solicitud.continue();
      else solicitud.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Recurso externo omitido en QA local</title>' });
    });
    await page.setViewport({ width: 1366, height: 900 });
    await page.goto(base + 'logica-difusa.html', { waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('#btnComenzarModulo', e => e.textContent), 'Ir al algoritmo');
    assert.match(await page.$eval('#introMarco iframe', e => e.src), /youtube-nocookie\.com\/embed\/ayfoP7Tqa-s/);
    await clic(page, '#btnComenzarModulo');
    await page.waitForSelector('#elegirWeb');
    assert.match(page.url(), /logica-difusa-opciones\.html$/);
    assert.equal(await page.$('iframe'), null);
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement !== document.body), 'Navegación por teclado');
    await clic(page, '#elegirWeb');
    await page.waitForSelector('#formDifusa');
    assert.equal(new URL(page.url()).searchParams.get('intro'), 'no');
    assert.equal(await page.$('#introMarco iframe'), null, 'La elección web omite el video');
    const guardado = await page.evaluate(() => DifusaEstado.guardarTrabajo('QA acceso dos versiones'));
    assert.ok(guardado.ok && guardado.persistido);
    const persistido = await page.evaluate(() => localStorage.getItem('logica-difusa.trabajos.v2'));
    await clic(page, '#elegirVersionDifusa');
    await page.waitForSelector('#elegirMatlab');
    await clic(page, '#elegirMatlab');
    await page.waitForSelector('#abrirMatlabOnline');
    assert.equal(await page.$eval('h1', e => e.textContent), 'Lógica difusa con MATLAB');
    assert.deepEqual(await page.$$eval('a[target="_blank"]', enlaces => enlaces.map(e => ({ href: e.href, rel: e.rel })).filter(e => !e.rel.includes('noopener') || !e.rel.includes('noreferrer'))), []);
    assert.equal(await page.$eval('#abrirMatlabOnline', e => e.href), 'https://matlab.mathworks.com/');
    assert.equal(await page.$$eval('a[href="https://drive.mathworks.com/"]', e => e.length), 1);
    const cdp = await page.createCDPSession();
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: descargas });
    verificarEjemplo(await descargar(page, '#descargarPaqueteMatlab', descargas, 'ventilacion_aula.zip'));
    assert.equal(sha256(await descargar(page, '#descargarFisMatlab', descargas, 'ventilacion_aula.fis')), HASH_FIS);
    await ayudaMatlab(page);
    await copiasMatlab(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('logica-difusa.trabajos.v2')), persistido, 'Acceso MATLAB conserva la biblioteca web');
    console.log('✓ Video → selector → web/MATLAB; regreso, descargas reales y portapapeles con alternativa manual.');
    await page.goto(base, { waitUntil: 'networkidle0' });
    await clic(page, '.ciudad-zona[data-modulo="difusa"]');
    assert.equal(await page.$eval('#panelModulo a', e => e.getAttribute('href')), 'logica-difusa.html?intro=si');
    await clic(page, '#vistaLista');
    assert.equal(await page.$$eval('#catalogo a[href="logica-difusa.html?intro=si"]', e => e.length), 1);
    assert.equal(await page.$eval('#barraLateral a[title="Lógica difusa"]', e => e.getAttribute('href')), 'logica-difusa.html?intro=si');
    assert.equal(await page.$eval('#trabajosRecientes .reciente-enlace', e => e.getAttribute('href')), 'logica-difusa.html?intro=no&trabajos=1');
    await clic(page, '#trabajosRecientes .reciente-enlace');
    await page.waitForSelector('#panelTrabajosDifusa:not([hidden])');
    assert.match(await page.$eval('#listaTrabajosDifusa', e => e.textContent), /QA acceso dos versiones/);
    assert.equal(await page.$('#introMarco iframe'), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('logica-difusa.trabajos.v2')), persistido);
    console.log('✓ Accesos normales separados de la recuperación directa del trabajo web; biblioteca intacta.');
    await navegacionCiudad(page, base);
    for (const pagina of ['logica-difusa-opciones.html', 'logica-difusa-matlab.html']) {
      await page.goto(base + pagina, { waitUntil: 'networkidle0' });
      await clic(page, '#btnVideoModulo');
      await page.waitForSelector('#introModulo:not([hidden])');
      await clic(page, '#btnComenzarModulo');
      await page.waitForSelector('#elegirWeb');
      assert.match(page.url(), /logica-difusa-opciones\.html$/);
      assert.equal(await page.$('#introMarco iframe'), null);
    }
    for (const ancho of [1366, 390, 320]) {
      await page.setViewport({ width: ancho, height: 900, isMobile: ancho < 700, hasTouch: ancho < 700 });
      for (const tema of ['oscuro', 'claro']) {
        await page.evaluate(valor => { localStorage.setItem('ui.tema.v1', valor); }, tema);
        for (const pagina of ['logica-difusa-opciones.html', 'logica-difusa-matlab.html']) {
          await page.goto(base + pagina, { waitUntil: 'networkidle0' });
          assert.equal(await page.$eval('html', e => e.dataset.tema), tema);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), pagina + ' sin desbordamiento a ' + ancho);
          await ayudaYAlgo(page, pagina);
          const selector = pagina.includes('opciones') ? '#elegirWeb' : '#descargarPaqueteMatlab';
          await page.keyboard.press('Tab');
          await page.focus(selector);
          assert.equal(await page.$eval(selector, e => getComputedStyle(e).outlineStyle), 'solid', 'Foco visible');
          if (ancho < 1024) {
            await clic(page, '#btnMenuLateral');
            assert.equal(await page.$eval('#btnMenuLateral', e => e.getAttribute('aria-expanded')), 'true');
            await page.keyboard.press('Escape');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'btnMenuLateral');
          }
          if (pagina.includes('opciones')) {
            const posiciones = await page.$$eval('.difusa-acceso__tarjeta', elementos => elementos.map(e => ({ x: e.offsetLeft, y: e.offsetTop })));
            assert.equal(posiciones[0][ancho > 700 ? 'y' : 'x'], posiciones[1][ancho > 700 ? 'y' : 'x'], 'Tarjetas en columnas o apiladas');
          }
          if (capturas && ancho !== 320 && ((pagina.includes('opciones') && tema === 'oscuro') || (pagina.includes('matlab') && tema === 'claro'))) {
            await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            if (ancho >= 1024) {
              const limites = await page.evaluate(() => ({ contenido: document.querySelector('.difusa-acceso__interior').getBoundingClientRect().left, barra: document.querySelector('.sidebar').getBoundingClientRect().right, desplazamiento: window.scrollX, relleno: getComputedStyle(document.body).paddingLeft }));
              assert.ok(limites.contenido >= limites.barra, 'Contenido libre de la barra: ' + JSON.stringify(limites));
            }
            await page.screenshot({ path: path.join(capturas, pagina.replace('.html', '') + '-' + ancho + '-' + tema + '.png'), fullPage: true });
          }
          if (pagina.includes('matlab')) {
            await ayudaMatlab(page);
            await clic(page, '#abrirAyudaMatlab');
            await page.waitForSelector('#ayudaMatlab[open]');
            // Abre cada apartado mediante teclado y revisa el último con scroll interno.
            const resumenes = await page.$$('#ayudaMatlab summary');
            for (const resumen of resumenes) {
              await resumen.focus();
              if (!await resumen.evaluate(e => e.parentElement.open)) await page.keyboard.press('Enter');
            }
            assert.ok(await page.$eval('.matlab-ayuda__contenido', e => e.scrollHeight > e.clientHeight));
            await page.$eval('.matlab-ayuda__contenido', e => { e.scrollTop = e.scrollHeight; });
            assert.ok(await page.$eval('.matlab-ayuda__contenido', e => e.scrollTop > 0));
            assert.ok(await page.$eval('#ayudaMatlab', e => e.scrollWidth <= e.clientWidth + 1), 'Ayuda sin desbordamiento horizontal');
            const limitesAyuda = await page.$eval('#ayudaMatlab', e => { const r = e.getBoundingClientRect(); return { izquierda: r.left, derecha: r.right, arriba: r.top, abajo: r.bottom, ancho: innerWidth, alto: innerHeight }; });
            assert.ok(limitesAyuda.izquierda >= 0 && limitesAyuda.derecha <= limitesAyuda.ancho && limitesAyuda.arriba >= 0 && limitesAyuda.abajo <= limitesAyuda.alto);
            if (capturas && ancho !== 320) {
              await page.$eval('.matlab-ayuda__contenido', e => { e.scrollTop = 0; });
              await page.screenshot({ path: path.join(capturas, 'ayuda-matlab-' + ancho + '-' + tema + '.png') });
            }
            await page.keyboard.press('Escape');
            await page.waitForSelector('#ayudaMatlab:not([open])');
          }
        }
      }
    }
    assert.deepEqual(errores, [], 'Sin errores de consola ni JavaScript');
    assert.deepEqual(recursos, [], 'Sin recursos locales faltantes');
    console.log('✓ Escritorio 1366 y móvil 390/320, ambos temas, teclado/foco y menú. Sin errores de consola ni recursos faltantes.');
    if (capturas) console.log('Capturas de revisión: ' + capturas);
    console.log('MATLAB Online no ejecutado: inspección del .fis y comprobaciones locales únicamente.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => servidor.close(resolve));
    for (const nombre of fs.readdirSync(descargas)) fs.unlinkSync(path.join(descargas, nombre));
    fs.rmdirSync(descargas);
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
