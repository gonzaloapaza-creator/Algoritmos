/* Pruebas en navegador (Edge headless mediante puppeteer-core) y capturas.
 *
 * Uso:  node tests/navegador.js [--capturas]
 * Requiere un servidor en http://localhost:8123 (python -m http.server 8123) y
 * puppeteer-core instalado en %TEMP%/grafo-e2e (fuera del proyecto).
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));

const BASE = 'http://localhost:8123/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CAPTURAS = process.argv.includes('--capturas');
const DIR_CAPTURAS = path.join(__dirname, '..', 'docs', 'capturas');

let ok = 0, fallos = 0;
const errores = [];
function check(cond, msg) { if (cond) { ok++; console.log('  ✓ ' + msg); } else { fallos++; console.log('  ✗ ' + msg); } }

async function nuevaPagina(browser, ancho, alto) {
  const page = await browser.newPage();
  await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1, hasTouch: ancho < 900 });
  page.on('pageerror', e => errores.push(page.url() + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errores.push(page.url() + ': ' + m.text()); });
  return page;
}

async function capturar(page, nombre) {
  if (!CAPTURAS) return;
  fs.mkdirSync(DIR_CAPTURAS, { recursive: true });
  await page.screenshot({ path: path.join(DIR_CAPTURAS, nombre + '.png'), fullPage: false });
}

async function sinScrollHorizontal(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    /* ---------- Inicio ---------- */
    console.log('\nInicio');
    let page = await nuevaPagina(browser, 1440, 900);
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
    check(await page.$$eval('.tarjeta-alg', t => t.length) === 3, 'Tres tarjetas reales');
    check(await page.$$eval('.categoria', c => c.length) === 3, 'Tres categorías');
    check(await page.$$eval('.sidebar__enlace', e => e.length) === 4, 'Barra lateral: inicio + 3 algoritmos');
    await capturar(page, 'inicio-1440');
    await page.goto(BASE + 'index.html?simular=10', { waitUntil: 'networkidle0' });
    check(await page.$$eval('.tarjeta-alg', t => t.length) === 10, 'Catálogo simulado con 10 entradas');
    check(await page.$$eval('.tarjeta-alg--pendiente a', a => a.length) === 0, 'Las simuladas no enlazan a ninguna ruta');
    check(await sinScrollHorizontal(page), 'Sin desplazamiento horizontal (1440)');
    await capturar(page, 'inicio-simulado-1440');
    await page.close();

    for (const ancho of [320, 375, 390, 768, 1024]) {
      page = await nuevaPagina(browser, ancho, 800);
      await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
      check(await sinScrollHorizontal(page), 'Inicio sin scroll horizontal a ' + ancho);
      if (ancho < 1024) {
        await page.click('#btnMenuLateral');
        await page.waitForSelector('body.nav-abierta');
        check(await page.$eval('#btnMenuLateral', b => b.getAttribute('aria-expanded')) === 'true', 'Menú lateral abre a ' + ancho);
        await capturar(page, 'inicio-menu-' + ancho);
        await page.keyboard.press('Escape');
        check(!(await page.$('body.nav-abierta')), 'Escape cierra el menú a ' + ancho);
      }
      await capturar(page, 'inicio-' + ancho);
      await page.close();
    }


    /* ---------- Presentación con video ---------- */
    console.log('\nPresentación (video)');
    for (const [pagina, video] of [['johnson.html', 'jkJd1UjUdAo'], ['asignacion.html', '_XvIC2KvWvo'], ['northwest.html', 'HjXWStUh0yE']]) {
      page = await nuevaPagina(browser, 1440, 900);
      await page.goto(BASE + pagina, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#introModulo:not([hidden])');
      check(await page.$eval('#moduloContenido', e => e.hidden), pagina + ': el algoritmo queda oculto tras la presentación');
      check((await page.$eval('#introMarco iframe', f => f.src)).includes(video), pagina + ': iframe con el video ' + video);
      await page.click('#btnComenzarModulo');
      check(await page.$eval('#moduloContenido', e => !e.hidden), pagina + ': «Ir al algoritmo» muestra el módulo');
      check(!(await page.$('#introMarco iframe')), pagina + ': el video se descarga al salir');
      await page.click('#btnVideoModulo');
      check(await page.$eval('#introModulo', e => !e.hidden), pagina + ': «Video» vuelve a abrir la presentación');
      await page.click('#introOmitir');
      await page.click('#btnComenzarModulo');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#moduloContenido:not([hidden])');
      check(await page.$eval('#introModulo', e => e.hidden), pagina + ': «No mostrar al entrar» se recuerda');
      await page.evaluate(() => localStorage.clear());
      await page.close();
    }
    page = await nuevaPagina(browser, 375, 740);
    await page.goto(BASE + 'asignacion.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#introModulo:not([hidden])');
    check(await sinScrollHorizontal(page), 'Presentación sin scroll horizontal (375)');
    await capturar(page, 'asignacion-video-375');
    await page.close();
    page = await nuevaPagina(browser, 1440, 900);
    await page.goto(BASE + 'johnson.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#introModulo:not([hidden])');
    await capturar(page, 'johnson-video-1440');
    await page.close();

    /* ---------- Asignación ---------- */
    console.log('\nAsignación');
    page = await nuevaPagina(browser, 1440, 900);
    await page.goto(BASE + 'asignacion.html?intro=no', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.$eval('#vistaGrafo', v => !v.hidden), 'Empieza en la vista del grafo');
    check(await page.$eval('#vistaMatriz', v => v.hidden), 'La matriz no ocupa la pantalla inicial');
    check(await page.$$eval('#svgAsignacion .nodo-b', n => n.length) === 8, 'Grafo del ejemplo: 8 nodos');
    check(await page.$$eval('#svgAsignacion .arista', n => n.length) === 16, '16 conexiones');
    check((await page.$eval('#resumenAsignacion', e => e.textContent)).includes('16 de 16 valores completos'), 'Resumen «16 de 16 valores completos»');
    await capturar(page, 'asignacion-grafo-1440');

    // Sincronización grafo → matriz: editar valor mediante el modelo (misma ruta que el diálogo).
    await page.evaluate(() => {
      const m = estadoAsignacion.modelo;
      aplicarCambioAsignacion(mod => fijarValorAsignacion(mod, m.recursos[0].id, m.tareas[0].id, null));
    });
    check((await page.$eval('#resumenAsignacion', e => e.textContent)).includes('15 de 16'), 'Dejar pendiente actualiza el resumen (15 de 16)');
    check(await page.$$eval('#svgAsignacion .arista.pendiente', n => n.length) === 1, 'La conexión pendiente se dibuja discontinua');
    await page.click('[data-ir="matriz"]');
    await page.waitForSelector('#vistaMatriz:not([hidden])');
    check(await page.$eval('[data-accion="resolver"]', b => b.disabled), 'Resolver deshabilitado con pendientes');
    check((await page.$eval('#validacionAsignacion', e => e.textContent)).includes('Falta 1 valor'), 'La validación indica el valor faltante');
    await capturar(page, 'asignacion-matriz-pendiente-1440');

    // Escribir texto inválido en la celda: no se convierte.
    const celda = await page.$('input[data-fila="0"][data-col="0"]');
    await celda.click({ clickCount: 3 });
    await celda.type('12abc');
    await page.keyboard.press('Tab');
    check(await page.$eval('input[data-fila="0"][data-col="0"]', i => i.getAttribute('aria-invalid') === 'true'), 'Texto «12abc» marcado inválido');
    check(await page.evaluate(() => obtenerValorAsignacion(estadoAsignacion.modelo, estadoAsignacion.modelo.recursos[0].id, estadoAsignacion.modelo.tareas[0].id)) === null, 'El modelo no se modificó con el texto inválido');
    const celda2 = await page.$('input[data-fila="0"][data-col="0"]');
    await celda2.click({ clickCount: 3 });
    await celda2.type('12');
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => !document.querySelector('[data-accion="resolver"]').disabled);
    check(true, 'Al corregir a 12 se habilita Resolver');
    check(await page.evaluate(() => Object.keys(matrizAsig.invalidas).length) === 0, 'Se limpian las celdas inválidas');

    // Resolver.
    await page.click('#vistaMatriz [data-accion="resolver"]');
    await page.waitForSelector('#vistaResultado:not([hidden])');
    const total = await page.$eval('#totalAsignacion .total__valor', e => e.textContent);
    check(total === '26', 'Total mínimo 26');
    const lista = await page.$$eval('#listaAsignacion li', li => li.map(l => l.textContent));
    check(lista.join('|') === 'Trabajador A → Trabajo 28|Trabajador B → Trabajo 17|Trabajador C → Trabajo 36|Trabajador D → Trabajo 45', 'Parejas A→2, B→1, C→3, D→4');
    check(await page.$$eval('#svgAsignacion .arista.elegida', n => n.length) === 4, 'Cuatro conexiones destacadas en el grafo');
    check(await page.$$eval('#svgAsignacion .arista', n => n.length) === 4, 'Las no elegidas quedan ocultas por defecto');
    check((await page.$eval('#notasAsignacion', e => e.textContent)).includes('coincide el total 26'), 'Verificación exhaustiva coincide');
    await capturar(page, 'asignacion-resultado-1440');
    await page.click('#btnMostrarTodas');
    check(await page.$$eval('#svgAsignacion .arista', n => n.length) === 16, '«Mostrar todas» muestra 16 conexiones');
    await page.click('#btnMostrarTodas');

    // Selección sincronizada: lista → grafo → matriz.
    await page.click('#listaAsignacion li:nth-child(2)');
    check(await page.$$eval('#svgAsignacion .arista.seleccionada', n => n.length) === 1, 'Seleccionar en la lista destaca en el grafo');
    check(await page.$$eval('#matrizResultadoAsignacion td.seleccionada', n => n.length) === 1, '…y en la matriz');
    check(await page.$eval('#listaAsignacion li:nth-child(2)', l => l.classList.contains('seleccionada')), '…y en la lista');

    // Mover un nodo no invalida; cambiar un valor sí.
    await page.evaluate(() => { estadoAsignacion.posiciones[estadoAsignacion.modelo.recursos[0].id] = { x: 300, y: 100 }; guardarAsignacion(); renderAsignacion('visual'); });
    check(await page.evaluate(() => resultadoVigenteAsignacion()), 'Mover un nodo mantiene el resultado vigente');
    await page.click('[data-objetivo="max"]');
    check(!(await page.evaluate(() => resultadoVigenteAsignacion())), 'Cambiar el objetivo invalida el resultado');
    check((await page.$eval('#estadoResultado', e => e.textContent)).includes('recalcular'), 'El chip pide recalcular');
    check(await page.$eval('#sinResultado', e => !e.hidden), 'La vista de resultado avisa que hay que recalcular');
    await page.click('[data-objetivo="min"]');
    check(await page.evaluate(() => resultadoVigenteAsignacion()), 'Volver al objetivo original recupera la vigencia (misma firma)');

    // Procedimiento.
    await page.waitForSelector('#conResultado:not([hidden])');
    await page.click('[data-ir="procedimiento"]');
    await page.waitForSelector('#vistaProcedimiento:not([hidden])');
    const pasos = await page.$$eval('#procedimientoLista li', li => li.length);
    check(pasos >= 5, 'Procedimiento con ' + pasos + ' pasos reales');
    check((await page.$eval('#procedimientoIndicador', e => e.textContent)) === 'Paso 1 de ' + pasos, 'Indicador Paso 1 de N');
    await page.click('#btnPasoSiguiente');
    check((await page.$eval('#procedimientoIndicador', e => e.textContent)) === 'Paso 2 de ' + pasos, 'Siguiente avanza');
    await page.click('#btnPasoAnterior');
    check((await page.$eval('#procedimientoIndicador', e => e.textContent)) === 'Paso 1 de ' + pasos, 'Anterior retrocede');
    await page.evaluate(() => irAPasoAsignacion(3));
    await capturar(page, 'asignacion-procedimiento-1440');
    await page.click('#btnPasoReiniciar');
    check((await page.$eval('#procedimientoIndicador', e => e.textContent)) === 'Paso 1 de ' + pasos, 'Reiniciar vuelve al paso 1');

    // Persistencia: recargar conserva el modelo.
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.evaluate(() => estadoAsignacion.modelo.recursos.length === 4 && resumenModelo(estadoAsignacion.modelo).completos === 16), 'Recarga conserva el modelo completo');

    // Migración v1.
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('asignacion.v1', JSON.stringify({ rows: 2, cols: 3, objective: 'max', labelsRows: ['X', 'Y'], labelsCols: ['a', 'b', 'c'], values: [[1, 2, 3], [4, 5, 6]] }));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.evaluate(() => estadoAsignacion.modelo.recursos.length === 2 && estadoAsignacion.modelo.tareas.length === 3 && estadoAsignacion.objetivo === 'max'), 'Migra asignacion.v1 → v2 (2×3, max)');
    check(await page.evaluate(() => estadoAsignacion.modelo.recursos.map(r => r.nombre).join()) === 'X,Y', 'Conserva nombres migrados');

    // Renombrar y eliminar desde el modelo.
    await page.evaluate(() => aplicarCambioAsignacion(m => renombrarElementoAsignacion(m, m.recursos[0].id, 'Torno')));
    check((await page.$eval('#svgAsignacion .nodo-b text', t => t.textContent)) === 'Torno', 'Renombrar se refleja en el grafo');
    await page.evaluate(() => aplicarCambioAsignacion(m => eliminarElementoAsignacion(m, m.tareas[0].id)));
    check(await page.$$eval('#svgAsignacion .arista', n => n.length) === 4, 'Eliminar una tarea deja 2×2 = 4 conexiones');
    await page.evaluate(() => deshacerAsignacion());
    check(await page.$$eval('#svgAsignacion .arista', n => n.length) === 6, 'Deshacer restaura la tarea (6 conexiones)');
    await page.evaluate(() => rehacerAsignacion());
    check(await page.$$eval('#svgAsignacion .arista', n => n.length) === 4, 'Rehacer vuelve a eliminarla');

    // Herramienta conectar: recurso–recurso rechazado.
    await page.evaluate(() => { elegirHerramientaAsignacion('conectar'); manejarConectarAsignacion(estadoAsignacion.modelo.recursos[0]); manejarConectarAsignacion(estadoAsignacion.modelo.recursos[1]); });
    check(await page.evaluate(() => estadoAsignacion.origenConexion === null && !dialogoAbierto()), 'Conectar dos recursos no abre el diálogo de valor');
    await page.evaluate(() => { manejarConectarAsignacion(estadoAsignacion.modelo.recursos[0]); manejarConectarAsignacion(estadoAsignacion.modelo.tareas[0]); });
    await page.waitForSelector('#dialogoFondo:not([hidden])');
    check(true, 'Conectar recurso–tarea abre el diálogo de valor');
    await page.keyboard.press('Escape');
    await page.close();

    for (const [ancho, alto, nombre] of [[320, 700, '320'], [375, 740, '375'], [390, 844, '390'], [768, 1024, '768'], [1024, 768, '1024'], [844, 390, 'horizontal']]) {
      page = await nuevaPagina(browser, ancho, alto);
      await page.goto(BASE + 'asignacion.html?intro=no', { waitUntil: 'networkidle0' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle0' });
      check(await sinScrollHorizontal(page), 'Asignación sin scroll horizontal (' + nombre + ')');
      const lienzo = await page.$eval('#lienzoAsignacion', e => e.getBoundingClientRect().height);
      check(lienzo >= 220, 'Grafo con altura útil ' + Math.round(lienzo) + 'px (' + nombre + ')');
      await capturar(page, 'asignacion-grafo-' + nombre);
      await page.click('[data-ir="matriz"]');
      await page.waitForSelector('#vistaMatriz:not([hidden])');
      check(await sinScrollHorizontal(page), 'Matriz sin scroll horizontal de página (' + nombre + ')');
      const tabla = await page.$eval('#matrizAsignacion', e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
      check(tabla.sw >= tabla.cw, 'La matriz se desplaza dentro de su contenedor (' + nombre + ')');
      await capturar(page, 'asignacion-matriz-' + nombre);
      await page.click('#vistaMatriz [data-accion="resolver"]');
      await page.waitForSelector('#vistaResultado:not([hidden])');
      await capturar(page, 'asignacion-resultado-' + nombre);
      check(await sinScrollHorizontal(page), 'Resultado sin scroll horizontal (' + nombre + ')');
      await page.close();
    }

    /* ---------- Johnson (regresión) ---------- */
    console.log('\nJohnson');
    page = await nuevaPagina(browser, 1440, 900);
    await page.goto(BASE + 'johnson.html?intro=no', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.$eval('#vacio', e => !e.hidden), 'Grafo vacío al inicio');
    await page.evaluate(() => { elegirHerramienta('nodo'); crearNodo(200, 200); crearNodo(500, 200); crearNodo(350, 420); });
    check(await page.$$eval('#capaNodos .nodo', n => n.length) === 3, 'Tres nodos creados');
    await page.evaluate(() => {
      const [a, b, c] = estado.nodos;
      estado.conexiones.push({ id: nuevoId('c'), desde: a.id, hacia: b.id, valor: 4 });
      estado.conexiones.push({ id: nuevoId('c'), desde: b.id, hacia: c.id, valor: -2 });
      estado.conexiones.push({ id: nuevoId('c'), desde: a.id, hacia: c.id, valor: 5 });
      guardar(); dibujar();
    });
    check(await page.$$eval('#capaConexiones .conexion', n => n.length) === 3, 'Tres conexiones dibujadas');
    await page.evaluate(() => zoomIn());
    check((await page.$eval('#btnZoomReset', b => b.textContent)) === '110%', 'Zoom +');
    await page.evaluate(() => zoomReset());
    await page.evaluate(() => deshacer());
    check(await page.$$eval('#capaNodos .nodo', n => n.length) === 2, 'Deshacer quita el último nodo');
    await page.evaluate(() => rehacer());
    check(await page.$$eval('#capaNodos .nodo', n => n.length) === 3, 'Rehacer lo devuelve');
    await page.click('#btnJohnson');
    await page.waitForFunction(() => document.querySelector('#johnsonTabla table'));
    const celdaAC = await page.evaluate(() => {
      const tabla = document.querySelector('#johnsonTabla table');
      return tabla.querySelectorAll('tbody tr')[0].querySelectorAll('td')[2].textContent;
    });
    check(celdaAC === '2', 'Johnson: distancia a→c = 2 (por b con peso negativo)');
    await capturar(page, 'johnson-resultado-1440');
    await page.click('#btnCerrarJohnson');
    await page.evaluate(() => { estado.conexiones.push({ id: nuevoId('c'), desde: estado.nodos[2].id, hacia: estado.nodos[0].id, valor: -10 }); guardar(); dibujar(); });
    await page.click('#btnJohnson');
    await page.waitForFunction(() => document.querySelector('#johnsonEstado').textContent.length > 0 && !document.querySelector('#johnsonEstado').textContent.includes('Calculando'));
    check((await page.$eval('#johnsonFondo', e => e.textContent)).toLowerCase().includes('ciclo de peso negativo'), 'Johnson detecta el ciclo negativo');
    await page.click('#btnCerrarJohnson');
    check(await page.$$eval('.ciclo-negativo-johnson', n => n.length) >= 3, 'El ciclo se resalta en rojo al cerrar');
    await page.click('#btnMatriz');
    check(await page.$eval('#matrizFondo', e => !e.hidden), 'Matriz de adyacencia abre');
    await page.keyboard.press('Escape');
    check(await page.$eval('#matrizFondo', e => e.hidden), 'Escape cierra la matriz');
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.$$eval('#capaNodos .nodo', n => n.length) === 3, 'Autoguardado recupera el grafo');
    // Con la presentación visible el lienzo mide 0: los nodos no deben amontonarse en la esquina.
    await page.goto(BASE + 'johnson.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#introModulo:not([hidden])');
    await new Promise(r => setTimeout(r, 300));
    await page.click('#btnComenzarModulo');
    await new Promise(r => setTimeout(r, 300));
    const posiciones = await page.evaluate(() => estado.nodos.map(n => Math.round(n.x) + ',' + Math.round(n.y)));
    check(new Set(posiciones).size === 3 && !posiciones.every(p => p === '26,26'), 'Tras la presentación los nodos conservan sus posiciones');
    await page.goto(BASE + 'johnson.html?intro=no', { waitUntil: 'networkidle0' });
    const json = await page.evaluate(() => JSON.stringify({ version: '1.0', grafo: instantaneaGrafo() }));
    await page.evaluate(() => { limpiarTodo(); });
    await page.waitForSelector('#modalFondo:not([hidden])');
    await new Promise(r => setTimeout(r, 400));   // el modal ignora el clic fantasma de los primeros 350 ms
    await page.click('#modalAceptar');
    check(await page.$$eval('#capaNodos .nodo', n => n.length) === 0, 'Limpiar con confirmación vacía el grafo');
    await page.evaluate(j => { const d = JSON.parse(j); aplicarGrafo(depurarGrafo(d.grafo)); guardar(); dibujar(); }, json);
    check(await page.$$eval('#capaNodos .nodo', n => n.length) === 3, 'Importar (depurarGrafo + aplicarGrafo) restaura 3 nodos');
    await capturar(page, 'johnson-1440');
    await page.close();

    for (const [ancho, alto, nombre] of [[320, 700, '320'], [375, 740, '375'], [768, 1024, '768'], [844, 390, 'horizontal']]) {
      page = await nuevaPagina(browser, ancho, alto);
      await page.goto(BASE + 'johnson.html?intro=no', { waitUntil: 'networkidle0' });
      check(await sinScrollHorizontal(page), 'Johnson sin scroll horizontal (' + nombre + ')');
      const lienzo = await page.$eval('#lienzo', e => e.getBoundingClientRect().height);
      check(lienzo >= 150, 'Lienzo de Johnson con alto útil ' + Math.round(lienzo) + 'px (' + nombre + ')');
      await capturar(page, 'johnson-' + nombre);
      await page.close();
    }

    /* ---------- Northwest ---------- */
    console.log('\nNorthwest');
    page = await nuevaPagina(browser, 1440, 900);
    const respuesta = await page.goto(BASE + 'northwest.html?intro=no', { waitUntil: 'networkidle0' });
    if (respuesta && respuesta.status() === 200) {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle0' });
      check((await page.$eval('body', b => b.textContent)).includes('No garantiza el costo mínimo'), 'Aclaración permanente visible');
      check(!(await page.$eval('body', b => /encontrar óptimo|costo mínimo total/i.test(b.textContent))), 'No hay etiquetas de optimización');
      check(await page.$eval('#vistaDatos', v => !v.hidden), 'Empieza en Datos');
      await capturar(page, 'northwest-datos-1440');
      await page.click('[data-ir="balanceo"]');
      await page.waitForSelector('#vistaBalanceo:not([hidden])');
      await capturar(page, 'northwest-balanceo-1440');
      await page.click('#btnConfirmarBalanceo');
      await page.waitForSelector('#vistaResolucion:not([hidden])');
      check((await page.$eval('#nwPasoIndicador', e => e.textContent)).startsWith('Paso 1 de 4'), 'Resolución empieza en paso 1 de 4');
      check((await page.$eval('#nwPasoDetalle', e => e.textContent)).includes('min(20, 10) = 10'), 'Operación min(20, 10) = 10 visible');
      await capturar(page, 'northwest-resolucion-1440');
      await page.click('#btnNwSiguiente'); await page.click('#btnNwSiguiente'); await page.click('#btnNwSiguiente');
      check((await page.$eval('#nwPasoIndicador', e => e.textContent)).startsWith('Paso 4 de 4'), 'Avanza hasta el paso 4');
      await page.click('#btnNwAnterior');
      check((await page.$eval('#nwPasoIndicador', e => e.textContent)).startsWith('Paso 3 de 4'), 'Anterior retrocede');
      await page.click('#btnNwReiniciar');
      check((await page.$eval('#nwPasoIndicador', e => e.textContent)).startsWith('Paso 1 de 4'), 'Reiniciar vuelve al paso 1');
      await page.click('[data-ir="resultado"]');
      await page.waitForSelector('#vistaResultadoNw:not([hidden])');
      check((await page.$eval('#nwCostoTotal', e => e.textContent)).includes('230'), 'Costo total 230');
      check((await page.$eval('#vistaResultadoNw', e => e.textContent)).includes('solución inicial'), 'Advertencia de solución inicial');
      await capturar(page, 'northwest-resultado-1440');
      // Cambiar solo costos conserva cantidades.
      const antes = await page.evaluate(() => JSON.stringify(estadoNorthwest.resultado.datos.asignaciones));
      await page.evaluate(() => aplicarCambioNorthwest(m => fijarCostoNorthwest(m, m.origenes[0].id, m.destinos[0].id, 900)));
      check(!(await page.evaluate(() => resultadoVigenteNorthwest())), 'Cambiar un costo invalida el resultado');
      await page.evaluate(() => resolverNorthwestCompleto());
      const despues = await page.evaluate(() => JSON.stringify(estadoNorthwest.resultado.datos.asignaciones));
      check(antes === despues, 'Cambiar solo costos conserva las cantidades');
      check(!(await page.$eval('#nwCostoTotal', e => e.textContent)).includes('230'), 'El costo total sí cambia');
      // Exceso de oferta → ficticio, y rebalancear no acumula.
      await page.evaluate(() => aplicarCambioNorthwest(m => { m.origenes[0].oferta = 50; }));
      await page.evaluate(() => cambiarVistaNorthwest('balanceo'));
      check((await page.$eval('#vistaBalanceo', e => e.textContent)).includes('destino ficticio'), 'Exceso de oferta propone destino ficticio');
      check(await page.$$eval('#tablaBalanceo th.ficticio', t => t.length) >= 1, 'El ficticio se distingue en la tabla');
      await page.evaluate(() => cambiarVistaNorthwest('datos'));
      await page.evaluate(() => cambiarVistaNorthwest('balanceo'));
      check(await page.$$eval('#tablaBalanceo thead th.ficticio', t => t.length) === 1, 'Rebalancear no acumula ficticios');
      await capturar(page, 'northwest-balanceo-ficticio-1440');
      // Validación de costos.
      await page.evaluate(() => cambiarVistaNorthwest('datos'));
      const cCosto = await page.$('input[data-tipo="costo"][data-fila="0"][data-col="0"]');
      await cCosto.click({ clickCount: 3 }); await cCosto.type('2,755'); await page.keyboard.press('Tab');
      check(await page.$eval('input[data-tipo="costo"][data-fila="0"][data-col="0"]', i => i.getAttribute('aria-invalid') === 'true'), 'Costo con 3 decimales rechazado');
      const cCosto2 = await page.$('input[data-tipo="costo"][data-fila="0"][data-col="0"]');
      await cCosto2.click({ clickCount: 3 }); await cCosto2.type('2,75'); await page.keyboard.press('Tab');
      check(await page.evaluate(() => obtenerCostoNorthwest(estadoNorthwest.modelo, estadoNorthwest.modelo.origenes[0].id, estadoNorthwest.modelo.destinos[0].id)) === 275, 'Costo «2,75» guardado como 275');
      const cOferta = await page.$('input[data-tipo="oferta"][data-fila="0"]');
      await cOferta.click({ clickCount: 3 }); await cOferta.type('2.5'); await page.keyboard.press('Tab');
      check(await page.$eval('input[data-tipo="oferta"][data-fila="0"]', i => i.getAttribute('aria-invalid') === 'true'), 'Oferta fraccionaria rechazada');
      await page.reload({ waitUntil: 'networkidle0' });
      check(await page.evaluate(() => estadoNorthwest.modelo.origenes.length === 2 && estadoNorthwest.modelo.origenes[0].oferta === 50), 'Northwest conserva los datos al recargar');
      await page.close();

      for (const [ancho, alto, nombre] of [[320, 700, '320'], [375, 740, '375'], [768, 1024, '768'], [844, 390, 'horizontal']]) {
        page = await nuevaPagina(browser, ancho, alto);
        await page.goto(BASE + 'northwest.html?intro=no', { waitUntil: 'networkidle0' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle0' });
        check(await sinScrollHorizontal(page), 'Northwest datos sin scroll horizontal (' + nombre + ')');
        await capturar(page, 'northwest-datos-' + nombre);
        await page.click('[data-ir="balanceo"]');
        await page.waitForSelector('#vistaBalanceo:not([hidden])');
        await page.click('#btnConfirmarBalanceo');
        await page.waitForSelector('#vistaResolucion:not([hidden])');
        check(await sinScrollHorizontal(page), 'Northwest resolución sin scroll horizontal (' + nombre + ')');
        await capturar(page, 'northwest-resolucion-' + nombre);
        await page.click('[data-ir="resultado"]');
        await page.waitForSelector('#vistaResultadoNw:not([hidden])');
        await capturar(page, 'northwest-resultado-' + nombre);
        await page.close();
      }
    } else {
      console.log('  (northwest.html todavía no existe)');
    }
  } catch (e) {
    fallos++;
    console.log('  ✗ Excepción: ' + e.message);
  } finally {
    await browser.close();
  }

  console.log('\nErrores de consola/página: ' + errores.length);
  errores.forEach(e => console.log('  - ' + e));
  console.log('\n' + ok + ' correctas, ' + fallos + ' fallidas');
  process.exitCode = fallos === 0 && errores.length === 0 ? 0 : 1;
})();
