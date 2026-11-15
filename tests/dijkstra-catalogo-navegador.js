/* Catálogo y lectura de Dijkstra en Edge, zoom normal y contextos aislados.
 * Reutiliza Puppeteer y el servidor existentes; no instala ni toma capturas. */
'use strict';

const assert = require('node:assert/strict'), path = require('node:path'), os = require('node:os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CASOS = [
  { id: 'atajo', destino: 'n4', minimo: 6 },
  { id: 'mejoras', destino: 'n5', minimo: 8 },
  { id: 'campus', destino: 'n4', minimo: 60 },
  { id: 'direcciones', destino: 'n3', minimo: 5 },
  { id: 'ceros', destino: 'n4', minimo: 2 }
];
let correctas = 0;
const errores = [];
function comprobar(valor, mensaje) { assert.ok(valor, mensaje); correctas++; console.log('  OK ' + mensaje); }
async function fotograma(p) { await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function clic(p, selector) {
  if (/^#dialogo(Aceptar|Cancelar)$/.test(selector)) await p.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
  await p.$eval(selector, e => {
    for (let a = e.parentElement; a; a = a.parentElement) if (a.tagName === 'DETAILS') a.open = true;
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await p.click(selector);
}
async function confirmar(p, aceptar = true) {
  await p.waitForSelector('#dialogoFondo:not([hidden])');
  await clic(p, aceptar ? '#dialogoAceptar' : '#dialogoCancelar');
  await p.waitForSelector('#dialogoFondo', { hidden: true });
}
async function nueva(b, ancho) {
  const contexto = await b.createBrowserContext(), p = await contexto.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', e => errores.push(ancho + ' px: ' + e.message));
  p.on('console', e => { if (e.type() === 'error') errores.push(ancho + ' px: ' + e.text()); });
  await p.setViewport({ width: ancho, height: 900, deviceScaleFactor: 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: ancho === 1440 ? 'dark' : 'light' }]);
  const respuesta = await p.goto(BASE + 'dijkstra.html?intro=no', { waitUntil: 'networkidle0' });
  assert.equal(respuesta.status(), 200);
  return { contexto, p };
}
async function cargar(p, id) {
  await clic(p, '[data-vista-grafo="grafo"]');
  await p.select('#ejemploGrafo', id);
  const reemplaza = await p.evaluate(() => moduloGrafo.grafo.nodos.length > 0);
  await clic(p, '#btnEjemploGrafo');
  if (reemplaza) await confirmar(p);
  await p.waitForFunction(() => moduloGrafo.vista === 'configuracion');
}
async function calcular(p) {
  await clic(p, '#btnResolverGrafo');
  await p.waitForFunction(() => !moduloGrafo.preparando && moduloGrafo.resultado !== null);
}
async function campo(p, selector, valor) {
  await p.$eval(selector, (e, valor) => { e.value = valor; e.dispatchEvent(new Event('input', { bubbles: true })); }, valor);
}
async function funcional(b) {
  const { contexto, p } = await nueva(b, 390);
  try {
    const catalogo = await p.$$eval('#ejemploGrafo option', opciones => opciones.map(e => e.value));
    comprobar(JSON.stringify(catalogo) === JSON.stringify(CASOS.map(c => c.id)), 'Catálogo: cinco lecciones y ningún caso retirado');
    await clic(p, '#btnEjemploRapidoGrafo');
    comprobar(await p.evaluate(() => moduloGrafo.grafo.nodos.length === 4 && moduloGrafo.destino === 'n4' && moduloGrafo.origen === 'n1' && document.activeElement.id === 'btnResolverGrafo'), 'Inicio rápido prepara Atajo, origen A, destino D y foco en calcular');
    await calcular(p);
    comprobar(await p.evaluate(() => moduloGrafo.resultado.distancias.n4 === 6 && document.activeElement.id === 'tituloEtapaGrafo'), 'Inicio rápido: mínimo 6 con foco en Resultado');
    await p.select('#objetivoDijkstra', 'max'); await calcular(p);
    comprobar(await p.evaluate(() => moduloGrafo.resultado.distancias.n4 === 9 && document.getElementById('consultaRutaGrafo').textContent.includes('orden topológico')), 'Inicio rápido: máximo 9 identificado como orden topológico');

    for (const caso of CASOS) {
      await cargar(p, caso.id);
      comprobar(await p.evaluate(caso => moduloGrafo.origen === 'n1' && moduloGrafo.destino === caso.destino && moduloGrafo.objetivo === 'min' && moduloGrafo.grafo.dirigido === (caso.id !== 'campus') && document.activeElement.id === 'btnResolverGrafo', caso), caso.id + ': carga normal confirmada, datos sugeridos y foco');
      comprobar(await p.$eval('#guiaLecturaEjemploGrafo', e => !e.hidden && e.textContent.includes('Qué observar')), caso.id + ': consigna persistente junto al cálculo');
      await calcular(p);
      comprobar(await p.evaluate(caso => moduloGrafo.resultado.distancias[caso.destino] === caso.minimo && moduloGrafo.vista === 'resultado' && !document.getElementById('guiaLecturaEjemploGrafo').hidden, caso), caso.id + ': resultado mínimo ' + caso.minimo + ' y guía conservada');

      if (caso.id === 'mejoras') await mejoras(p);
      if (caso.id === 'direcciones') await direcciones(p);
    }
    await clic(p, '[data-vista-grafo="grafo"]');
    const antes = await p.evaluate(() => JSON.stringify(serializarModuloGrafo()));
    await p.select('#ejemploGrafo', 'atajo'); await clic(p, '#btnEjemploGrafo'); await confirmar(p, false);
    comprobar(await p.evaluate(antes => JSON.stringify(serializarModuloGrafo()) === antes, antes), 'Cancelar otro ejemplo conserva el ejercicio completo');
  } finally { await contexto.close(); }
}

async function mejoras(p) {
  await p.evaluate(() => { window.resultadoCatalogo = moduloGrafo.resultado; });
  await clic(p, '#btnDecisionDijkstra');
  comprobar(await p.evaluate(() => {
    const paso = moduloGrafo.resultado.pasos[moduloGrafo.paso];
    return moduloGrafo.resultado === window.resultadoCatalogo && moduloGrafo.vista === 'procedimiento' && paso.tipo === 'relajacion' && paso.hacia === 'n5' && paso.anterior === 13 && paso.candidata === 8 && document.activeElement.id === 'tituloEtapaGrafo' && document.getElementById('explicacionPasoGrafo').textContent.includes('Mejora de 13 a 8');
  }), 'Mejoras: acceso directo a E 13→8, explicación sincronizada y foco en la etapa');
  comprobar(await p.$eval('#guiaLecturaEjemploGrafo', e => !e.hidden && e.textContent.includes('provisional')), 'Mejoras: la consigna permanece en Paso a paso');
  await clic(p, '[data-vista-grafo="resultado"]');
  for (const [destino, elegidas, costo] of [['n2', ['c2', 'c3'], 3], ['n3', ['c2'], 2]]) {
    await p.select('#destinoGrafo', destino);
    comprobar(await p.evaluate(({ elegidas, costo }) => {
      const aristas = [...document.querySelectorAll('.arista-editor-grafo')];
      return moduloGrafo.resultado === window.resultadoCatalogo && aristas.every(a => a.classList.contains('elegida') === elegidas.includes(a.dataset.id) && a.classList.contains('ruta') === elegidas.includes(a.dataset.id) && a.classList.contains('gm-arista-secundaria') === !elegidas.includes(a.dataset.id)) && document.getElementById('consultaRutaGrafo').textContent.includes('Peso total: ' + costo);
    }, { elegidas, costo }), 'Mejoras: destino ' + destino + ' destaca únicamente su ruta y conserva el cálculo');
  }
  await clic(p, '#consultaRutaGrafo button');
  comprobar(await p.evaluate(() => {
    const elegidas = [...document.querySelectorAll('.arista-editor-grafo.elegida')].map(e => e.dataset.id).sort();
    return moduloGrafo.destino === null && moduloGrafo.resultado === window.resultadoCatalogo && JSON.stringify(elegidas) === JSON.stringify([...moduloGrafo.resultado.arbol].sort()) && !document.querySelector('.arista-editor-grafo.ruta');
  }), 'Mejoras: volver al árbol restaura todas sus ramas sin recalcular');

  const guardado = await p.evaluate(() => serializarModuloGrafo());
  await clic(p, '[data-vista-grafo="grafo"]'); await p.select('#seleccionArista', 'c1');
  await campo(p, '#pesoSeleccionado', '9'); await clic(p, '#btnEditarPeso');
  await clic(p, '[data-vista-grafo="configuracion"]');
  comprobar(await p.$eval('#guiaLecturaEjemploGrafo', e => e.hidden), 'Mejoras: editar el peso retira la consigna del ejemplo original');
  await clic(p, '[data-vista-grafo="grafo"]'); await clic(p, '#btnDeshacerGrafo');
  await clic(p, '[data-vista-grafo="configuracion"]');
  comprobar(await p.$eval('#guiaLecturaEjemploGrafo', e => !e.hidden && e.textContent.includes('Una distancia puede mejorar')), 'Mejoras: deshacer recupera la consigna');
  comprobar(await p.evaluate(guardado => {
    const texto = JSON.stringify(guardado), validado = documentoTrabajoGrafo(guardado, 'dijkstra');
    aplicarDocumentoModuloGrafo(validado);
    return JSON.stringify(guardado) === texto && !document.getElementById('guiaLecturaEjemploGrafo').hidden && moduloGrafo.resultado.distancias.n5 === 8;
  }, guardado), 'Mejoras: recuperar trabajo guardado recompone resultado y guía sin alterar el documento');
  await p.select('#destinoGrafo', 'n5'); await p.select('#objetivoDijkstra', 'max'); await calcular(p);
  comprobar(await p.evaluate(() => moduloGrafo.resultado.distancias.n5 === 18 && document.getElementById('guiaLecturaEjemploGrafo').textContent.includes('Has cambiado la consulta')), 'Mejoras: máximo 18 con aviso de consulta distinta a la consigna');
}

async function direcciones(p) {
  await clic(p, '[data-vista-grafo="procedimiento"]'); await clic(p, '#btnReiniciarGrafo');
  comprobar(await p.$$eval('#tablaEstadoGrafo tbody tr', filas => filas.filter(f => f.cells[0].textContent !== 'A').every(f => f.cells[3].textContent === 'Aún sin descubrir')), 'Direcciones: al comenzar distingue desconocido de inalcanzable');
  await clic(p, '#btnUltimoGrafo');
  comprobar(await p.$$eval('#tablaEstadoGrafo tbody tr', filas => {
    const d = filas.find(f => f.cells[0].textContent === 'D'), c = filas.find(f => f.cells[0].textContent === 'C');
    return d.cells[3].textContent === 'Sin camino desde A' && c.cells[3].textContent.includes('Valor definitivo') && !d.classList.contains('finalizado');
  }), 'Direcciones: al terminar D queda sin camino y C tiene valor definitivo');
}

async function geometria(b, ancho) {
  const { contexto, p } = await nueva(b, ancho);
  try {
    for (const caso of CASOS) {
      await cargar(p, caso.id); await calcular(p); await clic(p, '#btnAjustarGrafo'); await fotograma(p);
      const datos = await p.evaluate(() => {
        const svg = document.getElementById('svgModuloGrafo'), marco = svg.getBoundingClientRect();
        const dentro = r => r.left >= marco.left - 1 && r.right <= marco.right + 1 && r.top >= marco.top - 1 && r.bottom <= marco.bottom + 1;
        const textos = [...svg.querySelectorAll('text')], circulos = [...svg.querySelectorAll('.nodo-editor-grafo circle')].map(e => e.getBoundingClientRect());
        const pesos = [...svg.querySelectorAll('.gm-peso')].map(e => e.getBoundingClientRect());
        const solapa = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        const nodosSolapados = circulos.some((a, i) => circulos.slice(i + 1).some(b => Math.hypot((a.left + a.right - b.left - b.right) / 2, (a.top + a.bottom - b.top - b.bottom) / 2) < (a.width + b.width) / 2 - 1));
        const pesosSolapados = pesos.some((a, i) => pesos.slice(i + 1).some(b => solapa(a, b)));
        const choquesPesoNodo = [];
        pesos.forEach((peso, ip) => circulos.forEach((nodo, inn) => {
          const cx = (nodo.left + nodo.right) / 2, cy = (nodo.top + nodo.bottom) / 2;
          const x = Math.max(peso.left, Math.min(cx, peso.right)), y = Math.max(peso.top, Math.min(cy, peso.bottom));
          if (Math.hypot(x - cx, y - cy) < nodo.width / 2 - 1) choquesPesoNodo.push({
            arista: svg.querySelectorAll('.gm-peso')[ip].closest('[data-id]').dataset.id,
            nodo: svg.querySelectorAll('.nodo-editor-grafo circle')[inn].closest('[data-id]').dataset.id,
            peso: { x: peso.left, y: peso.top, ancho: peso.width, alto: peso.height },
            circulo: { x: nodo.left, y: nodo.top, diametro: nodo.width }
          });
        }));
        return {
          fuera: [...textos, ...svg.querySelectorAll('.nodo-editor-grafo circle, .gm-arista-linea')].filter(e => !dentro(e.getBoundingClientRect())).map(e => e.textContent || e.getAttribute('class')),
          px: Math.min(...textos.map(e => parseFloat(getComputedStyle(e).fontSize) * Math.hypot(e.getScreenCTM().a, e.getScreenCTM().b))),
          pesosSolapados, pesoDentroNodo: choquesPesoNodo.length > 0, choquesPesoNodo, nodosSolapados, zoom: visualViewport.scale,
          desborde: document.documentElement.scrollWidth > innerWidth + 1
        };
      });
      const etiqueta = caso.id + '/' + ancho + ' px';
      comprobar(!datos.fuera.length && datos.px >= 13.9 && datos.zoom === 1 && !datos.desborde, etiqueta + ': etiquetas legibles dentro del SVG, zoom normal y sin desborde ' + JSON.stringify(datos));
      comprobar(!datos.pesosSolapados && !datos.pesoDentroNodo && !datos.nodosSolapados, etiqueta + ': pesos y nodos separados ' + JSON.stringify(datos));
    }
  } finally { await contexto.close(); }
}

(async () => {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  try {
    const solo = process.argv.find(a => a.startsWith('--solo='))?.slice(7);
    if (!solo || solo === 'funcional') await funcional(b);
    if (!solo || solo === 'geometria') for (const ancho of [320, 390, 1440]) await geometria(b, ancho);
    comprobar(!errores.length, 'Sin errores de consola ni página: ' + errores.join('; '));
  } finally { await b.close(); }
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; }).finally(() => console.log('Dijkstra catálogo: ' + correctas + ' comprobaciones, sin capturas.'));
