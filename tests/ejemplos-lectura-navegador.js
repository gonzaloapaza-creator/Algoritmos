/* Casos dirigidos, zoom normal y contextos aislados; sin capturas ni instalaciones. */
'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), os = require('node:os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
let correctas = 0; const errores = [];
const comprobar = (valor, mensaje) => { assert.ok(valor, mensaje); correctas++; console.log('  OK ' + mensaje); };
async function clic(p, selector) {
  if (/^#dialogo(Aceptar|Cancelar)$/.test(selector)) await p.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
  await p.$eval(selector, e => { for (let a = e.parentElement; a; a = a.parentElement) if (a.tagName === 'DETAILS') a.open = true; e.scrollIntoView({ block: 'center', behavior: 'instant' }); });
  await p.click(selector);
}
async function dialogo(p, aceptar = true) { await p.waitForSelector('#dialogoFondo:not([hidden])'); await clic(p, aceptar ? '#dialogoAceptar' : '#dialogoCancelar'); await p.waitForSelector('#dialogoFondo', { hidden: true }); }
async function nueva(b, modulo, ancho = 390) {
  const contexto = await b.createBrowserContext(), p = await contexto.newPage();
  p.on('pageerror', e => errores.push(modulo + ': ' + e.message));
  await p.setViewport({ width: ancho, height: 900, deviceScaleFactor: 1 }); await p.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' });
  return { contexto, p };
}
async function calcular(p) { await clic(p, '#btnResolverGrafo'); await p.waitForFunction(() => !moduloGrafo.preparando); }
async function cargarGrafo(p, id) {
  await clic(p, '[data-vista-grafo="grafo"]'); await p.select('#ejemploGrafo', id);
  const reemplaza = await p.evaluate(() => moduloGrafo.grafo.nodos.length > 0);
  await clic(p, '#btnEjemploGrafo'); if (reemplaza) await dialogo(p);
}
async function encuadre(p, mensaje) {
  await clic(p, '#btnAjustarGrafo');
  await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const datos = await p.evaluate(() => {
    const svg = document.getElementById('svgModuloGrafo'), caja = svg.getBoundingClientRect();
    const fuera = [...svg.querySelectorAll('text, .nodo-editor-grafo circle, .gm-arista-linea')].filter(e => {
      const r = e.getBoundingClientRect(); return r.left < caja.left - 1 || r.right > caja.right + 1 || r.top < caja.top - 1 || r.bottom > caja.bottom + 1;
    }).map(e => e.textContent || e.getAttribute('class'));
    return { fuera, desborde: document.documentElement.scrollWidth > innerWidth + 1, zoom: visualViewport.scale };
  });
  comprobar(!datos.fuera.length && !datos.desborde && datos.zoom === 1, mensaje + ' · margen de nodos, pesos y aristas: ' + JSON.stringify(datos.fuera));
  await p.$eval('#svgModuloGrafo', e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  comprobar(await p.evaluate(() => {
    const svg = document.getElementById('svgModuloGrafo').getBoundingClientRect(), dock = document.querySelector('.algo-dock')?.getBoundingClientRect(), barra = document.querySelector('.topbar').getBoundingClientRect();
    return svg.top >= barra.bottom - 1 && (!dock || svg.bottom <= dock.top + 1);
  }), mensaje + ' · grafo accesible entre la cabecera y Algo');
}
async function grafos(b, modulo) {
  const { contexto, p } = await nueva(b, modulo);
  try {
    const casos = modulo === 'dijkstra' ? [['atajo', 6, 9], ['campus', 60, null]] : [['cableado', 9, 22], ['optimos', 3, 6]];
    for (const [id, min, max] of casos) {
      await cargarGrafo(p, id);
      comprobar(await p.evaluate(() => document.activeElement.id === 'btnResolverGrafo' && !document.getElementById('btnResolverGrafo').disabled && moduloGrafo.vista === 'configuracion'), modulo + '/' + id + ': datos preparados y Calcular visible/enfocado');
      if (modulo === 'dijkstra') comprobar(await p.evaluate(id => moduloGrafo.origen === 'n1' && moduloGrafo.destino === 'n4' && moduloGrafo.grafo.dirigido === (id !== 'campus'), id), id + ': origen, destino y dirección sugeridos');
      await calcular(p);
      comprobar(await p.evaluate(min => (esDijkstraModulo ? moduloGrafo.resultado.distancias.n4 : moduloGrafo.resultado.total) === min, min), modulo + '/' + id + ': mínimo ' + min);
      comprobar(await p.evaluate(() => !document.getElementById('edicionJuntoGrafo').open && document.getElementById('consultaRutaGrafo').textContent.includes('total')), modulo + ': resultado prioriza objetivo/total y pliega creación');
      for (const ancho of [320, 1440]) { await p.setViewport({ width: ancho, height: 900 }); await encuadre(p, modulo + '/' + id + '/' + ancho); }
      await p.evaluate(() => { window.resultadoEjemplo = moduloGrafo.resultado; window.grafoEjemplo = JSON.stringify(moduloGrafo.grafo); });
      await clic(p, '#btnZoomMasGrafo'); await clic(p, '#btnAjustarGrafo');
      comprobar(await p.evaluate(() => moduloGrafo.resultado === window.resultadoEjemplo && JSON.stringify(moduloGrafo.grafo) === window.grafoEjemplo), modulo + ': zoom/ajuste conservan cálculo y posiciones');
      await p.select(modulo === 'dijkstra' ? '#objetivoDijkstra' : '#objetivoGrafo', 'max'); await calcular(p);
      comprobar(await p.evaluate(max => max === null ? !moduloGrafo.resultado && !moduloGrafo.grafo.dirigido : (esDijkstraModulo ? moduloGrafo.resultado.distancias.n4 : moduloGrafo.resultado.total) === max, max), modulo + '/' + id + ': máximo ' + (max === null ? 'bloqueado en no dirigido' : max));
    }
    if (modulo === 'dijkstra') {
      await cargarGrafo(p, 'direcciones'); await p.select('#destinoGrafo', ''); await calcular(p);
      comprobar(await p.evaluate(() => [...document.querySelectorAll('#resultadoGrafo > .gm-destinos button')].map(e => e.dataset.destinoResultado).join(',') === 'n1,n2,n3' && document.querySelector('#destinosSinCaminoGrafo summary').textContent === 'Sin camino desde A (1)' && document.querySelector('.gm-sin-camino[data-id="n4"]')), 'Todos los destinos agrupa inalcanzables y los identifica con patrón');
      await p.evaluate(() => { window.resultadoEjemplo = moduloGrafo.resultado; }); await p.select('#destinoGrafo', 'n2');
      comprobar(await p.evaluate(() => moduloGrafo.resultado === window.resultadoEjemplo && document.getElementById('consultaRutaGrafo').textContent.includes('A → B. 2 = 2') && document.querySelector('.arista-editor-grafo.ruta')), 'Destino reutiliza cálculo y muestra ruta/suma junto al grafo');
      await clic(p, '#consultaRutaGrafo button');
      comprobar(await p.evaluate(() => moduloGrafo.destino === null && moduloGrafo.resultado === window.resultadoEjemplo), 'Volver al árbol conserva resultado');
    }
    const documento = await p.evaluate(() => serializarModuloGrafo());
    await clic(p, '[data-vista-grafo="grafo"]'); const antes = await p.evaluate(() => JSON.stringify(serializarModuloGrafo()));
    await clic(p, '#btnEjemploGrafo'); await dialogo(p, false);
    comprobar(await p.evaluate(antes => JSON.stringify(serializarModuloGrafo()) === antes, antes), modulo + ': cancelar reemplazo conserva ejercicio');
    comprobar(await p.evaluate(documento => { const texto = JSON.stringify(documento); const validado = documentoTrabajoGrafo(documento, moduloGrafo.modulo); aplicarDocumentoModuloGrafo(validado); return JSON.stringify(serializarModuloGrafo()) === texto && JSON.stringify(documento) === texto; }, documento), modulo + ': carga mediante validador de trabajos conserva datos y resultado');
  } finally { await contexto.close(); }
}
async function arboles(b) {
  const { contexto, p } = await nueva(b, 'arboles');
  try {
    await p.select('#selectorRecorrido', 'postorden');
    let general = null;
    for (const [id, raiz, post] of [['equilibrado',40,'10, 30, 20, 50, 70, 60, 40'],['cadena',10,'50, 40, 30, 20, 10'],['general-pre',6,'8, 2, 4, 1, 6'],['general-post',6,'8, 2, 4, 1, 6']]) {
      const reemplaza = await p.evaluate(() => Boolean(arbol.raiz)); await clic(p, '[data-ejemplo-arbol="' + id + '"]'); if (reemplaza) await dialogo(p);
      comprobar(await p.evaluate(({ raiz, post }) => arbol.raiz.valor === raiz && document.getElementById('resultadoPostorden').textContent === post && arbol.recorridoSeleccionado === 'postorden' && !arbol.reproduciendo, { raiz, post }), 'Árboles/' + id + ': estructura y recorrido elegido');
      if (id.startsWith('general')) {
        comprobar(await p.evaluate(() => document.getElementById('resultadoInorden').textContent === '8, 2, 6, 4, 1' && document.activeElement.id === 'btnReconstruir'), 'Reconstrucción general preparada con inorden no ascendente');
        const raizActual = await p.evaluate(() => JSON.stringify(arbol.raiz)); if (general) comprobar(raizActual === general, 'Ambas modalidades reconstruyen el mismo árbol'); general = raizActual;
      }
      await clic(p, '#btnRecorridoSiguiente');
      comprobar(await p.evaluate(() => { const evento = arbol.historialRecorrido[arbol.pasoRecorrido - 1]; const salida = arbol.historialRecorrido.slice(0, arbol.pasoRecorrido).filter(e => e.tipo === 'emitir').map(e => e.valor).join(', ') || '—'; return document.querySelector('.arbol-nodo--actual').dataset.valor === String(evento.valor) && document.getElementById('salidaRecorrido').textContent === salida; }), 'Recorrido, resaltado y secuencia sincronizados');
      if (id === 'cadena') {
        await clic(p, '#btnAjustarArbol');
        comprobar(await p.evaluate(() => { const marco = document.getElementById('vistaArbol').getBoundingClientRect(); return [...document.querySelectorAll('#vistaArbol circle')].every(e => { const r = e.getBoundingClientRect(); return r.left >= marco.left && r.right <= marco.right && r.top >= marco.top && r.bottom <= marco.bottom; }); }), 'Cadena completa visible con Ajustar en móvil');
      }
    }
    await clic(p, '#btnRecorridoPlay'); const antes = await p.evaluate(() => JSON.stringify(instantaneaArboles()));
    await clic(p, '[data-ejemplo-arbol="cadena"]'); await p.waitForSelector('#dialogoFondo:not([hidden])');
    comprobar(await p.evaluate(() => !arbol.reproduciendo && arbol.intervaloRecorrido === null), 'Cargar ejemplo pausa la reproducción anterior');
    await dialogo(p, false);
    comprobar(await p.evaluate(antes => JSON.stringify(instantaneaArboles()) === antes, antes), 'Cancelar ejemplo no reemplaza el árbol');
    comprobar(await p.evaluate(() => { const guardado = instantaneaArboles(), texto = JSON.stringify(guardado); const limpio = depurarEstadoArboles(guardado); restaurarArbolDepurado(limpio); return JSON.stringify(instantaneaArboles()) === texto && !arbol.reproduciendo; }), 'Carga de árbol guardado conserva estructura, recorrido y paso');
  } finally { await contexto.close(); }
}
async function etiquetas(p, mensaje) {
  comprobar(await p.evaluate(() => {
    const svg = document.querySelector('#graficaSalida svg').getBoundingClientRect(), a = document.querySelector('.difusa-etiqueta-centroide').getBoundingClientRect(), b = document.querySelector('.difusa-etiqueta-consulta').getBoundingClientRect();
    const dentro = r => r.left >= svg.left - 1 && r.right <= svg.right + 1 && r.top >= svg.top - 1 && r.bottom <= svg.bottom + 1;
    return dentro(a) && dentro(b) && (a.bottom <= b.top || b.bottom <= a.top);
  }), mensaje + ': rótulos de centroide e inspección separados y dentro del gráfico');
}
async function difusa(b) {
  const { contexto, p } = await nueva(b, 'logica-difusa');
  try {
    comprobar(await p.$$eval('#vista-inicio [data-cargar-ejemplo]', botones => botones.length === 4 && new Set(botones.map(e => e.dataset.cargarEjemplo)).size === 4), 'Catálogo difuso reutiliza los cuatro modelos y ofrece una/dos/tres entradas');
    await clic(p, '[data-cargar-ejemplo="ventilacion3"]');
    await p.evaluate(() => { for (const [id, valor] of Object.entries({ temperatura:24, humedad:65, ocupacion:15 })) { const campo = document.getElementById('valor-' + id); campo.value = valor; campo.dispatchEvent(new Event('input', { bubbles: true })); } });
    await clic(p, '#evaluarDifusa');
    comprobar(await p.evaluate(() => document.getElementById('valorResultadoDifusa').textContent === '55,95 %' && document.getElementById('resumenResultado').innerText.includes('Se activaron 8 de 27 reglas') && document.getElementById('resumenResultado').offsetHeight < 450 && DifusaEstado.estado.resultado.centroide.valor !== 55.95), 'Resumen breve con unidad, ocho reglas y precisión interna intacta');
    comprobar(await p.evaluate(() => DifusaEstado.estado.seleccion.reglaId === 'r14' && [...document.querySelectorAll('#tablaReglas tr')].filter(e => !e.hidden).length === 8), 'Primera consulta filtra activas y elige la mayor, desempate original');
    await clic(p, '#pertenenciasResultadoDifusa > summary');
    comprobar(await p.$$eval('.difusa-lectura', parrafos => parrafos[2].textContent.includes('15 personas') && parrafos[2].textContent.includes('0,5 a Media y 0,5 a Alta')), 'Cada gráfica tiene valor, unidad y lectura de grados calculados');
    await clic(p, '#verReglasActivasDifusa'); comprobar(await p.evaluate(() => document.activeElement === document.querySelector('#reglasResultadoDifusa > summary')), 'Acceso directo abre la sección y enfoca su encabezado');
    await clic(p, '#verTodasReglasDifusa'); await clic(p, '[data-consultar-regla="r1"]');
    comprobar(await p.evaluate(() => DifusaEstado.estado.seleccion.reglaId === 'r1' && document.getElementById('explicacionRecorteDifusa').textContent.includes('no aporta') && document.activeElement === document.querySelector('#agregacionResultadoDifusa > summary')), 'Regla inactiva accesible desde la lista, con motivo y foco');
    await p.evaluate(() => { window.resultadoLectura = DifusaEstado.estado.resultado; });
    for (const ancho of [320,390,1440]) {
      await p.setViewport({ width:ancho, height:900 }); await p.evaluate(() => document.getElementById('agregacionResultadoDifusa').dispatchEvent(new Event('toggle')));
      for (const indice of [0, 560, 1000]) { await p.$eval('#puntoSalidaDifusa', (e, indice) => { e.value = indice; e.dispatchEvent(new Event('input', { bubbles:true })); }, indice); await etiquetas(p, ancho + ' px · índice ' + indice); }
    }
    comprobar(await p.evaluate(() => DifusaEstado.estado.resultado === window.resultadoLectura && DifusaEstado.estado.seleccion.reglaId === 'r1'), 'Inspección y cambios de ancho respetan selección manual y resultado');
    for (const [ocupacion, salida, regla] of [[0,'16,67 %','r13'],[20,'83,33 %','r15']]) {
      await clic(p, '[data-vista="evaluar"]'); await clic(p, '[data-ejemplo-difusa="20,50,' + ocupacion + '"]');
      comprobar(await p.evaluate(({ salida, regla }) => document.getElementById('valorResultadoDifusa').textContent === salida && DifusaEstado.estado.seleccion.reglaId === regla, { salida, regla }), 'Caso guiado: ' + ocupacion + ' personas → ' + salida + ' / ' + regla);
    }
    await clic(p, '[data-vista="inicio"]'); await clic(p, '[data-cargar-ejemplo="ventilacion"]'); await dialogo(p); await clic(p, '#evaluarDifusa'); await clic(p, '#verCalculoCompletoDifusa');
    await p.$eval('#puntoSalidaDifusa', e => { e.value = 500; e.dispatchEvent(new Event('input', { bubbles:true })); }); await etiquetas(p, 'Centroide e inspección coincidentes en 50 %');
    await p.evaluate(() => { const m = DifusaModelo.crearEjemplo('ventilacion'); m.salida.max *= 1e-6; m.salida.conjuntos.forEach(c => { c.parametros = c.parametros.map(x => x * 1e-6); }); if (!DifusaEstado.aplicarModelo(m).ok) throw Error('Modelo estrecho de prueba inválido'); });
    await p.reload({ waitUntil:'networkidle0' }); await clic(p, '[data-vista="evaluar"]'); await clic(p, '#evaluarDifusa');
    comprobar(await p.evaluate(() => DifusaEstado.estado.resultado.centroide.valor > 0 && /[eE]/.test(document.getElementById('valorResultadoDifusa').textContent)), 'Salida pequeña válida usa notación científica en lugar de cero');
    await p.evaluate(() => { const m = DifusaModelo.crearEjemplo('ventilacion'); m.reglas.forEach(r => { r.activa = false; }); if (!DifusaEstado.aplicarModelo(m).ok) throw Error('Modelo sin activas inválido'); });
    await p.reload({ waitUntil:'networkidle0' }); await clic(p, '[data-vista="evaluar"]'); await clic(p, '#evaluarDifusa'); await clic(p, '#agregacionResultadoDifusa > summary');
    comprobar(await p.evaluate(() => DifusaEstado.estado.seleccion.reglaId === null && DifusaEstado.estado.resultado.centroide.valor === null && document.getElementById('explicacionRecorteDifusa').textContent.includes('No hay reglas activas') && !document.querySelector('.difusa-etiqueta-centroide')), 'Sin reglas activas muestra diagnóstico sin inventar regla ni centroide');
    await p.select('#seleccionReglaDifusa', 'r1');
    comprobar(await p.$eval('#explicacionRecorteDifusa', e => e.textContent.includes('está deshabilitada')), 'Permite revisar una regla deshabilitada sin atribuirle aporte');
  } finally { await contexto.close(); }
}
(async () => {
  const b = await puppeteer.launch({ executablePath:process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--no-sandbox'] });
  try {
    const solo = process.argv.find(a => a.startsWith('--solo='))?.slice(7);
    if (!solo || solo === 'grafos') { await grafos(b,'dijkstra'); await grafos(b,'kruskal'); }
    if (!solo || solo === 'arboles') await arboles(b);
    if (!solo || solo === 'difusa') await difusa(b);
    comprobar(!errores.length, 'Sin errores de página: ' + errores.join('; '));
  } finally { await b.close(); }
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; }).finally(() => console.log('Ejemplos y lectura: ' + correctas + ' comprobaciones, sin capturas.'));
