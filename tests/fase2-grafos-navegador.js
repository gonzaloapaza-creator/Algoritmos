/* Interacciones reales de los tres grafos. Sin capturas, videos ni perfiles del usuario.
 * URL_PRUEBAS admite también el servidor del paquete construido.
 * CASO_GRAFOS filtra escenarios; GRAFOS_BREVE=1 revisa solo resultados/responsive.
 * Puppeteer y Edge deben estar ya instalados; esta prueba no instala nada. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e', 'node_modules', 'puppeteer-core'));
const BASE = (process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/').replace(/\/?$/, '/');
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FILTRO = process.env.CASO_GRAFOS || '';
const BREVE = process.env.GRAFOS_BREVE === '1';
const COMPROBAR_ALGO = process.env.COMPROBAR_ALGO_GRAFOS === '1';
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fase2-grafos-export-'));
let comprobaciones = 0;
const errores = [], fallos = [], escenarios = [];

function comprobar(valor, texto) { assert.ok(valor, texto); comprobaciones++; console.log('  OK ' + texto); }
async function cuadro(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function clic(page, selector) {
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.click(selector); await cuadro(page);
}
async function llenar(page, selector, texto) {
  await clic(page, selector); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.type(String(texto));
}
async function seleccionar(page, selector, valor) { await page.select(selector, String(valor)); await cuadro(page); }
async function centro(page, selector) {
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  return page.$eval(selector, e => { const c = e.getBoundingClientRect(); return { x: c.x + c.width / 2, y: c.y + c.height / 2 }; });
}
async function tocarNodo(page, selector, tactil = false) {
  const p = await centro(page, selector);
  if (tactil) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
  await cuadro(page);
}
async function arrastrar(page, selector, tactil = false) {
  const p = await centro(page, selector);
  if (tactil) {
    const cdp = await page.createCDPSession();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x + i * 5, y: p.y + i * 3 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 35, p.y + 24, { steps: 6 }); await page.mouse.up();
  }
  await cuadro(page);
}
async function grafo(page, modulo) { return page.evaluate(j => JSON.stringify(j ? instantaneaGrafo() : moduloGrafo.grafo), modulo === 'johnson'); }
async function dialogoJohnson(page, valor) {
  await page.waitForSelector('#modalFondo:not([hidden])');
  if (valor !== undefined) await llenar(page, '#modalInput', valor);
  await page.waitForFunction(() => !clicFantasma());
  await clic(page, '#modalAceptar'); await page.waitForSelector('#modalFondo[hidden]');
}
async function confirmarComun(page) {
  const boton = await page.waitForSelector('#dialogoFondo:not([hidden]) #dialogoAceptar');
  await page.waitForFunction(() => !clicFantasmaDialogo());
  await boton.click(); await cuadro(page);
}
async function responsive(page, modulo) {
  const medicion = await page.evaluate(() => ({ ancho: innerWidth, contenido: document.documentElement.scrollWidth,
    tapados: [...document.querySelectorAll('button, input, select')].filter(e => e.getClientRects().length && !e.closest('.sidebar')).filter(e => { const c=e.getBoundingClientRect(); return c.left < -2 || c.right > innerWidth + 2; }).map(e=>e.id || e.textContent.trim()),
    tema: document.documentElement.dataset.tema }));
  comprobar(medicion.contenido <= medicion.ancho + 2 && !medicion.tapados.length, modulo + ': controles alcanzables sin desbordamiento horizontal (' + medicion.ancho + ' px, ' + medicion.tema + ') ' + JSON.stringify(medicion.tapados));
}
async function abrir(browser, modulo, movil = false) {
  const contexto = await browser.createBrowserContext();
  const page = await contexto.newPage(); page.setDefaultTimeout(8000);
  await page.setViewport({ width: movil ? 360 : 1440, height: movil ? 800 : 1000, isMobile: movil, hasTouch: movil });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: movil ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', e => errores.push(modulo + ': ' + e.message));
  await page.goto(BASE + modulo + '.html?intro=no', { waitUntil: 'networkidle0' }); await cuadro(page);
  return { page, contexto };
}
function escenario(nombre, fn, largo = false) { if ((!FILTRO || nombre.includes(FILTRO)) && (!BREVE || !largo)) escenarios.push({ nombre, fn }); }

escenario('johnson-crud', async browser => {
  const { page, contexto } = await abrir(browser, 'johnson');
  try {
    await clic(page, '.jn-formularios summary');
    for (const nombre of ['A', 'B', 'C']) { await llenar(page, '#jnCrearNodoNombre', nombre); await page.keyboard.press('Enter'); await cuadro(page); }
    comprobar(await page.evaluate(() => estado.nodos.length === 3), 'Johnson: crear nodos con formulario y Enter');
    const ids = await page.evaluate(() => estado.nodos.map(n=>n.id));
    await clic(page, '.jn-formularios summary');
    await clic(page, '[data-herramienta="conectar"]'); await tocarNodo(page, '#capaNodos [data-id="'+ids[0]+'"] circle');
    await page.keyboard.press('Escape');
    comprobar(await page.evaluate(() => estado.origenConexion === null), 'Johnson: Escape cancela conexión pendiente');
    for (const cancelar of [true, false]) {
      await tocarNodo(page, '#capaNodos [data-id="'+ids[0]+'"] circle'); await tocarNodo(page, '#capaNodos [data-id="'+ids[1]+'"] circle');
      await page.waitForSelector('#modalFondo:not([hidden])');
      if (cancelar) { await page.keyboard.press('Escape'); await cuadro(page); }
      else await dialogoJohnson(page, 0);
    }
    comprobar(await page.evaluate(() => estado.conexiones.length === 1 && estado.conexiones[0].valor === 0), 'Johnson: cancelar diálogo conserva datos y crear conexión admite cero');
    await clic(page, '[data-herramienta="seleccionar"]');
    const p0=await page.evaluate(id=>{const n=buscarNodo(id);return [n.x,n.y];},ids[0]);
    await arrastrar(page, '#capaNodos [data-id="'+ids[0]+'"] circle');
    comprobar(await page.evaluate(({id,p})=>{const n=buscarNodo(id);return n.x!==p[0]||n.y!==p[1];},{id:ids[0],p:p0}), 'Johnson: arrastre cambia posición');
    await page.$eval('#capaNodos [data-id="'+ids[0]+'"]', e=>e.focus()); await page.keyboard.press('Enter');
    await dialogoJohnson(page,'ABCDEFGHIJKL');
    comprobar(await page.evaluate(id=>buscarNodo(id).nombre==='ABCDEFGHIJKL',ids[0]), 'Johnson: Enter sobre nodo enfocado permite renombrar a 12 caracteres');
    await clic(page,'.jn-formularios summary');
    const antes=await grafo(page,'johnson');
    for(const [desde,hacia] of [[ids[0],ids[0]],[ids[0],ids[1]],[ids[1],ids[0]]]) {
      await seleccionar(page,'#jnConexionDesde',desde);await seleccionar(page,'#jnConexionHacia',hacia);await clic(page,'#jnCrearConexionForm button');
      comprobar(await grafo(page,'johnson')===antes,'Johnson: rechaza bucle/duplicado/inversa conservando ejercicio');
    }
    const conexion=await page.evaluate(()=>estado.conexiones[0].id);
    await seleccionar(page,'#jnElementoEditor','conexion:'+conexion); await clic(page,'#btnEditar'); await dialogoJohnson(page,-7);
    comprobar(await page.evaluate(()=>estado.conexiones[0].valor===-7),'Johnson: editar conexión admite negativos');
    await clic(page,'#btnEliminar');await page.keyboard.press('Escape');await cuadro(page);
    comprobar(await page.evaluate(()=>estado.conexiones.length===1),'Johnson: cancelar borrado conserva conexión');
    await clic(page,'#btnEliminar');await dialogoJohnson(page); comprobar(await page.evaluate(()=>estado.conexiones.length===0),'Johnson: eliminar conexión');
    await seleccionar(page,'#jnElementoEditor','nodo:'+ids[2]);await clic(page,'#btnEliminar');await dialogoJohnson(page);
    comprobar(await page.evaluate(()=>estado.nodos.length===2),'Johnson: eliminar nodo');
    await responsive(page,'Johnson editor');
  } finally { await contexto.close(); }
}, true);

async function cargarJohnsonReferencia(page) {
  await clic(page,'#btnEjemplos');await clic(page,'[data-ejemplo="tiempos-holguras"]');
  await clic(page,'#btnMasOpciones');await clic(page,'#jnOrganizarGrafo');
  await clic(page,'#btnJohnson');await page.waitForSelector('#vistaResultadoJn:not([hidden])');
}

escenario('johnson-resultado', async browser => {
  const { page, contexto }=await abrir(browser,'johnson');
  try {
    await cargarJohnsonReferencia(page);
    const destino=await page.evaluate(()=>estado.nodos.find(n=>n.nombre==='B').id);
    comprobar(await page.evaluate(id=>{const g=document.querySelector('#svgResultadoJn [data-id="'+id+'"]');return g.querySelector('.jn-nodo-valor-minimo').childNodes[0].textContent==='19'&&g.querySelector('.jn-nodo-valor-maximo').childNodes[0].textContent==='58';},destino),'Johnson: destino real muestra 19 | 58');
    comprobar(await page.$eval('#jnRutaDetalle',e=>e.textContent.includes('6 + 5 + 8 = 19')),'Johnson: recorrido, pesos originales y suma visibles');
    comprobar(await page.$eval('#johnsonTabla',e=>!e.closest('details').open),'Johnson: matriz secundaria cerrada inicialmente');
    await clic(page,'#johnsonTitulo');comprobar(await page.$eval('#johnsonTabla',e=>e.getBoundingClientRect().height>0),'Johnson: Ver matriz abre contenido secundario');await clic(page,'#johnsonTitulo');
    await seleccionar(page,'#jnObjetivoRuta','maximo');
    comprobar(await page.$eval('#jnRutaDetalle',e=>e.textContent.includes('Costo total: 58')),'Johnson: seleccionar máximo actualiza resumen');
    await clic(page,'#jnCompararRutas');
    comprobar(await page.evaluate(()=>document.querySelectorAll('#svgResultadoJn .jn-camino-minimo').length>0&&document.querySelectorAll('#svgResultadoJn .jn-camino-maximo').length>0),'Johnson: comparación estática de rutas');
    const posiciones=await page.evaluate(()=>JSON.stringify(estado.nodos.map(n=>[n.x,n.y])));
    const vb=await page.$eval('#svgResultadoJn',e=>e.getAttribute('viewBox'));
    await clic(page,'[data-zoom-ruta="mas"]');comprobar(await page.$eval('#svgResultadoJn',e=>e.getAttribute('viewBox'))!==vb,'Johnson: zoom del resultado');
    await clic(page,'[data-zoom-ruta="ajustar"]');await clic(page,'[data-ampliar-grafo]');await clic(page,'[data-ampliar-grafo]');
    comprobar(await page.evaluate(p=>JSON.stringify(estado.nodos.map(n=>[n.x,n.y]))===p,posiciones),'Johnson: ajustar/ampliar/restaurar conserva posiciones');
    await seleccionar(page,'#jnVistaAnalisis','temporal');
    comprobar(await page.evaluate(id=>{const g=document.querySelector('#svgResultadoJn [data-id="'+id+'"]');return g.getAttribute('aria-label').includes('Tiempo temprano 58. Tiempo tardío 58');},destino),'Johnson: temporal muestra 58 | 58 con semántica temprano/tardío');
    comprobar(await page.$eval('#svgResultadoJn',e=>e.textContent.includes('6 · H=39')&&e.textContent.includes('58 · H=0')),'Johnson: holguras originales legibles en SVG');
    if (COMPROBAR_ALGO) {
      await clic(page,'#algoAbrir'); await llenar(page,'#algoPregunta','¿Cuál es el costo total?'); await page.keyboard.press('Enter'); await cuadro(page);
      const respuesta=await page.$eval('#algoMensajes article:last-child p',e=>e.textContent);
      comprobar(respuesta.includes('58')&&!/\b19\b/.test(respuesta),'Algo: costo temporal del ejercicio es 58, sin confundirlo con mínimo 19. '+respuesta);
      await page.keyboard.press('Escape'); await cuadro(page);
    }
    const encuadre=await page.$eval('#svgResultadoJn',svg=>{const v=svg.viewBox.baseVal;return [...svg.querySelectorAll('.nodo,.conexion,.jn-leyenda-svg')].every(g=>{const b=g.getBBox();return b.x>=v.x-1&&b.y>=v.y-1&&b.x+b.width<=v.x+v.width+1&&b.y+b.height<=v.y+v.height+1;});});
    comprobar(encuadre,'Johnson: ajuste incluye nodos, pesos y leyenda');
    const choques=await page.$eval('#svgResultadoJn',svg=>[...svg.querySelectorAll('.nodo')].some(g=>{const ts=[...g.querySelectorAll('.jn-nodo-nombre,.jn-nodo-leyenda,.jn-nodo-valor')].map(t=>t.getBBox());return ts.some((a,i)=>ts.some((b,j)=>i<j&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y));}));
    comprobar(!choques,'Johnson: compartimentos T sin solapamiento interno medido');
    const atraviesa = await page.evaluate(() => {
      const larga = estado.conexiones.find(c => c.valor === 58);
      const linea = document.querySelector('#svgResultadoJn .conexion[data-id="'+larga.id+'"] .conexion-linea');
      const otros = estado.nodos.filter(n => n.id !== larga.desde && n.id !== larga.hacia).map(n => {
        const circulo = document.querySelector('#svgResultadoJn .nodo[data-id="'+n.id+'"] .jn-nodo-base');
        return { x: circulo.cx.baseVal.value, y: circulo.cy.baseVal.value };
      });
      const radio = radioVisualNodoJohnson(estado.visualizacionJohnson), longitud = linea.getTotalLength();
      return otros.some(n => Array.from({length:101},(_,i)=>linea.getPointAtLength(longitud*i/100)).some(p=>Math.hypot(p.x-n.x,p.y-n.y)<radio+2));
    });
    comprobar(!atraviesa,'Johnson: conexión larga organizada evita los círculos intermedios');
    // Observar la copia que el exportador serializa, sin alterar el resultado.
    await page.evaluate(()=>{const original=XMLSerializer.prototype.serializeToString;XMLSerializer.prototype.serializeToString=function(n){const texto=original.call(this,n);if(n.tagName.toLowerCase()==='svg')window.svgExportadoFase2=texto;return texto;};});
    const cdp=await page.createCDPSession();await cdp.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:DIR});
    await clic(page,'#btnExportarRutaJn');
    await page.waitForFunction(()=>typeof window.svgExportadoFase2==='string');
    const exportado=await page.evaluate(()=>window.svgExportadoFase2);
    comprobar(exportado.includes('H=39')&&exportado.includes('temprano')&&exportado.includes('tardío')&&exportado.includes('viewBox='),'Johnson: copia exportada conserva valores, etiquetas y encuadre');
    const limite=Date.now()+8000;let archivo;
    while(Date.now()<limite&&!archivo){archivo=fs.readdirSync(DIR).find(n=>n.endsWith('.png'));if(!archivo)await new Promise(r=>setTimeout(r,100));}
    comprobar(!!archivo,'Johnson: descarga PNG real completada');
    const ruta=path.join(DIR,archivo),png=fs.readFileSync(ruta);comprobar(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&png.readUInt32BE(16)>100&&png.readUInt32BE(20)>100,'Johnson: PNG válido con dimensiones útiles');console.log('  PNG exportado: '+ruta);
    await seleccionar(page,'#jnVistaAnalisis','caminos');await clic(page,'#btnVerEnEditor');
    await tocarNodo(page,'#capaNodos .nodo circle');await clic(page,'#btnMasOpciones');await clic(page,'#btnDijkstra');
    await page.waitForSelector('#modalFondo:not([hidden])');await page.keyboard.press('Escape');await cuadro(page);
    await clic(page,'#pasosJohnson [data-vista="resultado"]');
    comprobar(await page.evaluate(()=>!!estado.resultadoDijkstraRapido&&estado.visualizacionJohnson.valoresNodos[estado.nodos.find(n=>n.nombre==='B').id].minimo===19),'Johnson: Dijkstra rápido → Resultado conserva consulta propia (H-01)');
    await responsive(page,'Johnson resultado');
  } finally {await contexto.close();}
});

async function agregarNodoGm(page,nombre) {await llenar(page,'#nombreVertice',nombre);await page.keyboard.press('Enter');await cuadro(page);}
async function conectarGm(page,desde,hacia,peso) {await seleccionar(page,'#aristaDesde',desde);await seleccionar(page,'#aristaHacia',hacia);await llenar(page,'#pesoArista',peso);await page.keyboard.press('Enter');await cuadro(page);}

for(const modulo of ['dijkstra','kruskal']) escenario(modulo+'-crud',async browser=>{
  const {page,contexto}=await abrir(browser,modulo);
  try {
    for(const nombre of ['A','B','C','X'])await agregarNodoGm(page,nombre);
    const ids=await page.evaluate(()=>moduloGrafo.grafo.nodos.map(n=>n.id));
    comprobar(ids.length===4,modulo+': crear nodos con Enter');
    await conectarGm(page,ids[0],ids[1],0);await conectarGm(page,ids[1],ids[2],2);await conectarGm(page,ids[0],ids[2],9);
    const antes=await grafo(page,modulo);
    for(const [a,b,p] of [[ids[0],ids[0],1],[ids[0],ids[1],7],...(modulo==='dijkstra'?[[ids[0],ids[3],-1]]:[[ids[1],ids[0],3]])]){
      await conectarGm(page,a,b,p);comprobar(await grafo(page,modulo)===antes,modulo+': regla inválida conserva ejercicio');
    }
    await clic(page,'[data-herramienta-grafo="conectar"]');await tocarNodo(page,'#svgModuloGrafo [data-id="'+ids[0]+'"] circle');await page.keyboard.press('Escape');
    comprobar(await page.evaluate(()=>moduloGrafo.conexionDesde===null),modulo+': Escape cancela conexión');
    for (const cancelar of [true, false]) {
      await tocarNodo(page,'#svgModuloGrafo [data-id="'+ids[1]+'"] circle');await tocarNodo(page,'#svgModuloGrafo [data-id="'+ids[3]+'"] circle');
      await page.waitForSelector('#dialogoFondo:not([hidden])');
      if (cancelar) { await page.keyboard.press('Escape'); await cuadro(page); }
      else { await llenar(page,'#dialogoInput',4); await confirmarComun(page); }
    }
    comprobar(await page.evaluate(()=>moduloGrafo.grafo.conexiones.length===4),modulo+': extremos gráficos crean conexión y cancelar diálogo conserva datos');
    const temporal=await page.evaluate(()=>moduloGrafo.grafo.conexiones.at(-1).id);
    await seleccionar(page,'#seleccionArista',temporal);await clic(page,'#btnEliminarArista');
    await clic(page,'[data-herramienta-grafo="seleccionar"]');await clic(page,'#btnOrganizarGrafo');
    const pos=await page.evaluate(id=>{const n=moduloGrafo.grafo.nodos.find(n=>n.id===id);return[n.x,n.y];},ids[0]);await arrastrar(page,'#svgModuloGrafo [data-id="'+ids[0]+'"] circle');
    comprobar(await page.evaluate(({id,p})=>{const n=moduloGrafo.grafo.nodos.find(n=>n.id===id);return n.x!==p[0]||n.y!==p[1];},{id:ids[0],p:pos}),modulo+': arrastre real mueve nodo');
    await seleccionar(page,'#seleccionVertice',ids[0]);await llenar(page,'#nombreSeleccionado','ABCDEFGHIJKL');await clic(page,'#btnRenombrarVertice');
    comprobar(await page.evaluate(id=>moduloGrafo.grafo.nodos.find(n=>n.id===id).nombre==='ABCDEFGHIJKL',ids[0]),modulo+': renombrar nodo a nombre largo');
    const edge=await page.evaluate(()=>moduloGrafo.grafo.conexiones[1].id);
    await clic(page,'#ajustesAristaGrafo summary');await seleccionar(page,'#seleccionArista',edge);await llenar(page,'#pesoSeleccionado',modulo==='kruskal'?-2:3);await clic(page,'#btnEditarPeso');
    comprobar(await page.evaluate(({id,p})=>moduloGrafo.grafo.conexiones.find(c=>c.id===id).valor===p,{id:edge,p:modulo==='kruskal'?-2:3}),modulo+': editar peso de conexión');
    await clic(page,'#btnContinuarGrafo');
    if(modulo==='dijkstra'){await seleccionar(page,'#origenGrafo',ids[0]);await seleccionar(page,'#destinoGrafo',ids[2]);}
    await clic(page,'#btnResolverGrafo');await page.waitForFunction(()=>moduloGrafo.resultado&&moduloGrafo.vista==='resultado');
    comprobar(await page.$eval('#resultadoGrafo',(e,m)=>e.textContent.includes(m==='dijkstra'?'0 + 3 = 3':'Peso total: -2'),modulo),modulo+': resultado estático con total esperado');
    const solapados=await page.$eval('#svgModuloGrafo',svg=>[...svg.querySelectorAll('.nodo-editor-grafo')].flatMap(g=>{const a=g.querySelector('.gm-nombre-nodo').getBBox(),e=g.querySelector('.gm-distancia-nodo');if(!e)return [];const b=e.getBBox();return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y?[{id:g.dataset.id,nombre:[a.x,a.y,a.width,a.height],valor:[b.x,b.y,b.width,b.height]}]:[];}));
    comprobar(!solapados.length,modulo+': nombre y datos propios sin solapamiento interno '+JSON.stringify(solapados));
    if(modulo==='dijkstra'){
      await page.evaluate(()=>window.resultadoAnteriorFase2=moduloGrafo.resultado);await seleccionar(page,'#destinoGrafo',ids[3]);
      comprobar(await page.evaluate(()=>window.resultadoAnteriorFase2===moduloGrafo.resultado&&document.getElementById('resultadoGrafo').textContent.includes('Sin camino')), 'Dijkstra: cambiar destino reutiliza cálculo y muestra inalcanzable');
    }else{
      comprobar(await page.$eval('#resultadoGrafo',e=>e.textContent.includes('Bosque')&&e.textContent.includes('X')),'Kruskal: bosque y nodo aislado explícitos');
      await seleccionar(page,'#objetivoGrafo','max');await clic(page,'#btnResolverGrafo');await page.waitForFunction(()=>!!moduloGrafo.resultado);
      comprobar(await page.$eval('#resultadoGrafo',e=>e.textContent.includes('Peso total: 9')),'Kruskal: máximo de expansión conserva interpretación');
    }
    const vb=await page.$eval('#svgModuloGrafo',e=>e.getAttribute('viewBox'));await clic(page,'.gm-vista-opciones summary');await clic(page,'#btnZoomMasGrafo');comprobar(await page.$eval('#svgModuloGrafo',e=>e.getAttribute('viewBox'))!==vb,modulo+': zoom del grafo');
    const despuesZoom=await page.$eval('#svgModuloGrafo',e=>e.getAttribute('viewBox'));await clic(page,'[data-pan-grafo="derecha"]');comprobar(await page.$eval('#svgModuloGrafo',e=>e.getAttribute('viewBox'))!==despuesZoom,modulo+': desplazar vista mediante control accesible');await clic(page,'#btnAjustarGrafo');
    await clic(page,'#btnAmpliarGrafo');await clic(page,'#btnAmpliarGrafo');comprobar(await page.evaluate(()=>!!moduloGrafo.resultado),modulo+': ampliar/restaurar conserva resultado');
    await clic(page,'[data-vista-grafo="grafo"]');await seleccionar(page,'#seleccionArista',edge);await clic(page,'#btnEliminarArista');comprobar(await page.evaluate(id=>!moduloGrafo.grafo.conexiones.some(c=>c.id===id)&&!moduloGrafo.resultado,edge),modulo+': borrar conexión invalida resultado');
    await seleccionar(page,'#seleccionVertice',ids[0]);await clic(page,'#btnEliminarVertice');await page.keyboard.press('Escape');await cuadro(page);comprobar(await page.evaluate(()=>moduloGrafo.grafo.nodos.length===4),modulo+': cancelar diálogo de borrado conserva nodo');
    await clic(page,'#btnEliminarVertice');await confirmarComun(page);comprobar(await page.evaluate(id=>!moduloGrafo.grafo.nodos.some(n=>n.id===id)&&!moduloGrafo.grafo.conexiones.some(c=>c.desde===id||c.hacia===id),ids[0]),modulo+': eliminar nodo borra incidentes');
    await responsive(page,modulo+' editor');
  }finally{await contexto.close();}
},true);

escenario('dijkstra-direccion',async browser=>{
  const{page,contexto}=await abrir(browser,'dijkstra');
  try{
    await agregarNodoGm(page,'A');await agregarNodoGm(page,'B');
    const ids=await page.evaluate(()=>moduloGrafo.grafo.nodos.map(n=>n.id));
    await conectarGm(page,ids[0],ids[1],2);await conectarGm(page,ids[1],ids[0],5);
    comprobar(await page.evaluate(()=>moduloGrafo.grafo.dirigido&&moduloGrafo.grafo.conexiones.length===2),'Dijkstra dirigido admite conexiones inversas independientes');
    const previo=await grafo(page,'dijkstra');
    await seleccionar(page,'#selectorModoGrafo','no-dirigido');await page.waitForSelector('#dialogoFondo:not([hidden])');await page.keyboard.press('Escape');await cuadro(page);
    comprobar(await grafo(page,'dijkstra')===previo,'Dijkstra: cancelar cambio de dirección conserva ejercicio');
    await seleccionar(page,'#selectorModoGrafo','no-dirigido');await confirmarComun(page);
    await page.waitForFunction(()=>document.getElementById('dialogoTitulo').textContent==='Resolver pesos opuestos');
    await llenar(page,'#dialogoInput',3);await confirmarComun(page);
    comprobar(await page.evaluate(()=>!moduloGrafo.grafo.dirigido&&moduloGrafo.grafo.conexiones.length===1&&moduloGrafo.grafo.conexiones[0].valor===3),'Dijkstra: resolver pesos opuestos fusiona una conexión no dirigida');
    const noDirigido=await grafo(page,'dijkstra');await conectarGm(page,ids[1],ids[0],7);
    comprobar(await grafo(page,'dijkstra')===noDirigido,'Dijkstra no dirigido rechaza inversa duplicada');
    await seleccionar(page,'#selectorModoGrafo','dirigido');await confirmarComun(page);
    comprobar(await page.evaluate(()=>moduloGrafo.grafo.dirigido&&moduloGrafo.grafo.conexiones.length===2&&moduloGrafo.grafo.conexiones.every(c=>c.valor===3)),'Dijkstra: volver a dirigido reconstruye ambas direcciones');
  }finally{await contexto.close();}
},true);

for(const modulo of ['johnson','dijkstra','kruskal'])escenario(modulo+'-movil',async browser=>{
  const{page,contexto}=await abrir(browser,modulo,true);
  try{
    await responsive(page,modulo+' móvil inicial');
    if(modulo==='johnson')await cargarJohnsonReferencia(page);
    else{await clic(page,'#btnEjemploRapidoGrafo');await clic(page,'#btnResolverGrafo');await page.waitForFunction(()=>!!moduloGrafo.resultado);}
    await responsive(page,modulo+' móvil resultado');
    if(modulo==='johnson'){
      await seleccionar(page,'#jnVistaAnalisis','temporal');await clic(page,'[data-ampliar-grafo]');await clic(page,'[data-ampliar-grafo]');await clic(page,'#btnVerEnEditor');
    }else await clic(page,'[data-vista-grafo="grafo"]');
    const selector=modulo==='johnson'?'#capaNodos .nodo circle':'#svgModuloGrafo .nodo-editor-grafo circle';
    await page.evaluate(j=>{window.resultadoAntesArrastreFase2=j?estadoJohnson.resultado:moduloGrafo.resultado;},modulo==='johnson');
    const previo=await grafo(page,modulo);await arrastrar(page,selector,true);comprobar(await grafo(page,modulo)!==previo,modulo+': arrastre táctil emulado real');
    comprobar(await page.evaluate(j=>window.resultadoAntesArrastreFase2===(j?estadoJohnson.resultado:moduloGrafo.resultado),modulo==='johnson'),modulo+': mover con tacto conserva cálculo válido');
    const grupo=modulo==='johnson'?'#capaNodos .nodo':'#svgModuloGrafo .nodo-editor-grafo';await page.$eval(grupo,e=>e.focus());await page.keyboard.press(' ');await cuadro(page);comprobar(await page.evaluate(j=>!!(j?estado.seleccion:moduloGrafo.seleccion),modulo==='johnson'),modulo+': Espacio selecciona nodo y permite alternativa de teclado');
    await page.keyboard.press('Tab');comprobar(await page.evaluate(()=>document.activeElement!==document.body),modulo+': Tab conserva navegación de foco');
    await responsive(page,modulo+' móvil editor');
  }finally{await contexto.close();}
});

(async()=>{
  const browser=await puppeteer.launch({executablePath:EDGE,headless:true,args:['--no-sandbox']});
  try{for(const {nombre,fn}of escenarios){console.log('\n'+nombre+' · '+BASE);try{await fn(browser);}catch(error){fallos.push(nombre+': '+error.stack);console.error('  FALLO '+error.message);}}}
  finally{await browser.close();}
  console.log('\n'+comprobaciones+' comprobaciones aprobadas; '+fallos.length+' escenarios fallidos; '+errores.length+' errores de página.');
  if(fallos.length||errores.length){console.error(fallos.concat(errores).join('\n'));process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});
