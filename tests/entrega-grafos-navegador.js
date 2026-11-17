/* Regresión de la entrega Dijkstra/Kruskal. Contextos aislados y sin instalaciones.
 * Reutiliza el servidor local y Edge/Puppeteer del proyecto. --captura guarda QA solo en TEMP.
 * URL_PRUEBAS permite comprobar también el Drop servido localmente. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
const EDGE = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let comprobaciones = 0;
const errores = [];
function comprobar(valor, texto) { assert.ok(valor, texto); comprobaciones++; }
async function cuadro(p) { await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function clic(p, selector) {
  await p.$eval(selector, e => { for (let a = e.parentElement; a; a = a.parentElement) if (a.tagName === 'DETAILS') a.open = true; e.scrollIntoView({ block: 'center', behavior: 'instant' }); });
  await p.click(selector); await cuadro(p);
}
async function vista(p, nombre) { await clic(p, '[data-vista-grafo="' + nombre + '"]'); }
async function confirmar(p, aceptar = true) {
  await p.waitForSelector('#dialogoFondo:not([hidden])');
  await p.waitForFunction(() => Date.now() - dialogo.abiertaDesde >= FANTASMO_CLICK_TIMEOUT);
  await clic(p, aceptar ? '#dialogoAceptar' : '#dialogoCancelar');
  await p.waitForSelector('#dialogoFondo', { hidden: true });
}
async function cargarEjemplo(p, id) {
  await vista(p, 'grafo'); await p.select('#ejemploGrafo', id);
  const reemplaza = await p.evaluate(() => moduloGrafo.grafo.nodos.length > 0);
  await clic(p, '#btnEjemploGrafo'); if (reemplaza) await confirmar(p);
}
async function calcular(p) { await clic(p, '#btnResolverGrafo'); await p.waitForFunction(() => !moduloGrafo.preparando); await cuadro(p); }
async function instantanea(p) { return p.evaluate(() => JSON.stringify(serializarModuloGrafo())); }
async function identidad(p) { await p.evaluate(() => { window.__resultadoEntrega = moduloGrafo.resultado; }); }
async function conserva(p) { return p.evaluate(() => moduloGrafo.resultado === window.__resultadoEntrega); }
async function geometria(p) {
  return p.evaluate(() => {
    const svg = document.getElementById('svgModuloGrafo'), caja = svg.getBoundingClientRect();
    const dentro = r => r.left >= caja.left - 1 && r.right <= caja.right + 1 && r.top >= caja.top - 1 && r.bottom <= caja.bottom + 1;
    const cruza = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const pesos = [...svg.querySelectorAll('.gm-peso')].map(e=>e.getBoundingClientRect());
    const nodos = [...svg.querySelectorAll('circle')].map(e=>e.getBoundingClientRect());
    const texto = [...svg.querySelectorAll('text')];
    const controles = [...document.querySelectorAll('button, input, select, summary')].filter(e=>e.getClientRects().length && !e.closest('.sidebar') && !e.closest('#dialogoFondo'));
    return { zoom: visualViewport.scale, desborde: document.documentElement.scrollWidth > innerWidth + 1,
      dentro: [...nodos, ...texto.map(e=>e.getBoundingClientRect())].every(dentro),
      choques: pesos.some((a,i)=>pesos.slice(i+1).some(b=>cruza(a,b))||nodos.some(b=>cruza(a,b))),
      nodosSolapados: nodos.some((a,i)=>nodos.slice(i+1).some(b=>cruza(a,b))),
      inaccesibles: controles.filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>e.id||e.textContent),
      fuente: Math.min(...texto.map(e=>parseFloat(getComputedStyle(e).fontSize)*Math.hypot(e.getScreenCTM().a,e.getScreenCTM().b))) };
  });
}
async function revisarResultado(p, modulo, total) {
  comprobar(await p.evaluate(() => moduloGrafo.resultado !== null), modulo + ': resultado vigente');
  const datos = await p.evaluate(() => {
    const r=moduloGrafo.resultado, ruta=esDijkstraModulo?reconstruirRutaGrafo(r,moduloGrafo.destino):null;
    return { total: ruta? ruta.distancia:r.total, aristas:ruta? ruta.conexiones.length:r.elegidas.length,
      texto:document.getElementById('resultadoGrafo').textContent,
      panel:document.getElementById('resumenPanelRespuestaGrafo').textContent,
      elegidas:[...document.querySelectorAll('.arista-editor-grafo.elegida')].map(e=>e.dataset.id),
      esperadas:ruta?ruta.conexiones:r.elegidas,
      nodos:[...document.querySelectorAll('.gm-nodo-ruta')].map(e=>e.dataset.id), rutaNodos:ruta?.nodos };
  });
  comprobar(datos.total===total && datos.panel.includes('Total: '+total), modulo+': total '+total+' en motor y panel');
  comprobar(datos.aristas === (modulo==='dijkstra' ? total===101?4:2 :3), modulo+': número de aristas');
  assert.deepEqual(datos.elegidas.sort(), datos.esperadas.sort()); comprobaciones++;
  if(modulo==='dijkstra'){assert.deepEqual(datos.nodos.sort(),datos.rutaNodos.sort());comprobaciones++;comprobar(datos.texto.includes(total===101?'23 + 23 + 23 + 32 = 101':'52 + 69 = 121'),'Pesos originales y suma');}
  else comprobar(datos.texto.includes('3 de 4') && datos.texto.includes('empates'),'Tres de cuatro y explicación de empates');
}
async function matriz(browser) {
  for(const modulo of ['dijkstra','kruskal']) for(const ancho of [320,390,768,1440]) for(const tema of ['claro','oscuro']) {
    const contexto=await browser.createBrowserContext(),p=await contexto.newPage();p.setDefaultTimeout(10000);
    p.on('pageerror',e=>errores.push(e.message));p.on('console',m=>{if(m.type()==='error')errores.push(m.text());});
    p.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)errores.push(r.url()+': '+r.status());});
    await p.setViewport({width:ancho,height:950,deviceScaleFactor:1});
    await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:tema==='claro'?'light':'dark'},{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(BASE+modulo+'.html?intro=no',{waitUntil:'networkidle0'});
    await cargarEjemplo(p,'referencia-clase');
    const posiciones=await p.evaluate(()=>JSON.stringify(moduloGrafo.grafo.nodos));
    for(const [objetivo,total] of [['min',modulo==='dijkstra'?101:10],['max',modulo==='dijkstra'?121:13]]) {
      await clic(p,'[data-objetivo-grafo="'+objetivo+'"]');
      comprobar(await p.$$eval('[data-objetivo-grafo]',b=>b.length===2&&b.every(e=>e.getClientRects().length)&&b.filter(e=>e.getAttribute('aria-pressed')==='true').length===1),'Objetivos visibles y estado accesible');
      if(objetivo==='max') comprobar(await p.evaluate(()=>moduloGrafo.resultado===null&&!document.querySelector('.arista-editor-grafo.elegida')&&!document.getElementById('totalPanelRespuestaGrafo').textContent.includes('Total:')),'Cambio de objetivo retira solución anterior');
      await calcular(p);await revisarResultado(p,modulo,total);await identidad(p);
      await clic(p,'#btnAjustarGrafo');
      const geo=await geometria(p);
      comprobar(geo.zoom===1&&!geo.desborde&&geo.dentro&&!geo.choques&&!geo.nodosSolapados&&geo.fuente>=13.9&&!geo.inaccesibles.length,modulo+'/'+ancho+'/'+tema+': geometría '+JSON.stringify(geo));
      await p.focus('#resumenPanelRespuestaGrafo');await p.keyboard.press('Enter');await cuadro(p);
      comprobar(await p.$eval('#panelRespuestaGrafo',e=>!e.open),'Panel plegado con Enter');
      comprobar((await p.$eval('#resumenPanelRespuestaGrafo',e=>e.textContent)).includes('Total: '+total),'Objetivo y total visibles al plegar');
      comprobar(await conserva(p),'Plegar conserva el cálculo');
      const plegado=await geometria(p);comprobar(!plegado.desborde&&plegado.dentro&&!plegado.inaccesibles.length,'Grafo visible con panel plegado');
      await p.keyboard.press('Enter');await cuadro(p);
      comprobar(await p.$eval('#panelRespuestaGrafo',e=>e.open),'Panel desplegado con Enter');
      await clic(p,'#btnVerProcedimientoGrafo');
      comprobar(await p.evaluate(()=>moduloGrafo.vista==='procedimiento'&&!moduloGrafo.reproduciendo),'Procedimiento sin reproducción automática');
      if(modulo==='dijkstra') {
        const indice=await p.evaluate(()=>moduloGrafo.resultado.pasos.findIndex(x=>x.tipo==='relajacion'&&x.hacia==='n4'));
        const ronda=await p.evaluate(i=>[...document.querySelectorAll('.gm-ronda')].find(e=>+e.dataset.inicio<=i&&+e.dataset.fin>=i).querySelector('summary').id,indice);
        await clic(p,'#'+ronda);await clic(p,'[data-paso-ronda="'+indice+'"]');
        comprobar(await p.evaluate(i=>moduloGrafo.paso===i&&[...document.querySelectorAll('.gm-distancia-nodo')].every(e=>{const id=e.closest('[data-id]').dataset.id;return e.textContent==='d = '+distanciaTextoGrafo(moduloGrafo.resultado.pasos[i].distancias[id]);}),indice),'Tarjeta activa el paso real sin valores futuros');
        comprobar(await p.$eval('[data-paso-ronda="'+indice+'"]',e=>document.activeElement===e),'El foco permanece en la relajación consultada');
      } else {
        await clic(p,'#btnUltimoGrafo');comprobar((await p.$eval('#detallePasoGrafo',e=>e.textContent)).includes('Peso acumulado: '+total),'Acumulado Kruskal coincide con el final');
      }
      await clic(p,'#btnRegresarResultadoGrafo');await revisarResultado(p,modulo,total);
      comprobar(await conserva(p),'Regresar conserva consulta y cálculo');
      await clic(p,'#btnEditarDesdeResultadoGrafo');
      comprobar(await p.evaluate(()=>moduloGrafo.vista==='grafo'&&!document.getElementById('panelEditorGrafo').hidden),'Editar grafo accesible desde resultado');
      await vista(p,'resultado');
      comprobar(await p.evaluate(n=>JSON.stringify(moduloGrafo.grafo.nodos)===n,posiciones),'Ninguna transición mueve nodos');
      const tapados=await p.evaluate(async()=>{
        const lista=[];
        for(const id of ['btnAjustarGrafo','btnAmpliarGrafo','btnResolverGrafo','btnVerProcedimientoGrafo','resumenPanelRespuestaGrafo']){
          const e=document.getElementById(id);e.scrollIntoView({block:'center',behavior:'instant'});await new Promise(r=>requestAnimationFrame(r));
          const c=e.getBoundingClientRect(),hit=document.elementFromPoint(c.x+c.width/2,c.y+c.height/2);
          if(!hit||!e.contains(hit))lista.push(id);
        }
        return lista;
      });
      comprobar(!tapados.length,'Controles alcanzables por encima de Algo y barras: '+tapados);
    }
    if(ancho===390){for(const nuevo of [320,1440,390]){await p.setViewport({width:nuevo,height:950,deviceScaleFactor:1});await cuadro(p);comprobar(await conserva(p)&&await p.evaluate(n=>JSON.stringify(moduloGrafo.grafo.nodos)===n,posiciones),'Redimensionar conserva cálculo y nodos');}}
    if(process.argv.includes('--captura')&&[390,1440].includes(ancho)&&tema==='oscuro'){
      await p.evaluate(()=>document.querySelector('#toastStack')?.replaceChildren());
      await p.$eval('#distribucionGrafo',e=>e.scrollIntoView({block:'start'}));
      await p.screenshot({path:path.join(os.tmpdir(),'entrega-'+modulo+'-'+ancho+'.png'),fullPage:true});
    }
    await contexto.close();console.log('✓ '+modulo+' '+ancho+' px '+tema+': referencia, objetivos, panel, procedimiento y edición');
  }
}
async function contratos(browser) {
  const contexto=await browser.createBrowserContext(),p=await contexto.newPage();p.setDefaultTimeout(10000);
  p.on('pageerror',e=>errores.push(e.message));
  await p.setViewport({width:390,height:844});
  for(const modulo of ['dijkstra','kruskal']) {
    await p.goto(BASE+modulo+'.html?intro=no',{waitUntil:'networkidle0'});
    // Un documento de la versión previa, sin propiedades de interfaz nuevas.
    await p.evaluate(()=>{const d={version:1,modulo:moduloGrafo.modulo,grafo:crearEjemploGrafo(moduloGrafo.modulo),origen:esDijkstraModulo?'n1':null,destino:esDijkstraModulo?'n4':null,objetivo:'min',vista:'resultado',paso:0,resuelto:true};localStorage.setItem(esDijkstraModulo?DIJKSTRA_STORAGE_KEY:KRUSKAL_STORAGE_KEY,JSON.stringify(d));});
    await p.reload({waitUntil:'networkidle0'});
    comprobar(await p.evaluate(()=>moduloGrafo.resultado!==null),'Trabajo previo restaurado '+modulo);
    await cargarEjemplo(p,'referencia-clase');await calcular(p);await identidad(p);
    if(modulo==='dijkstra') {
      await p.select('#destinoGrafo','n5');await cuadro(p);comprobar(await conserva(p),'Otro destino reutiliza cálculo');
      await p.select('#destinoGrafo','n1');await cuadro(p);
      comprobar((await p.$eval('#totalPanelRespuestaGrafo',e=>e.textContent)).includes('Total: 0 · 0 aristas'),'Origen igual destino');
      await p.select('#destinoGrafo','n4');await cuadro(p);await clic(p,'#btnTodasRutasGrafo');
      comprobar(await p.evaluate(()=>moduloGrafo.destino===null),'Árbol identificado');await clic(p,'#btnVolverRutaGrafo');comprobar(await conserva(p),'Volver a ruta sin recalcular');
      await p.select('#origenGrafo','n4');await cuadro(p);comprobar(await p.evaluate(()=>!moduloGrafo.resultado),'Origen invalida');
      await calcular(p);await p.select('#destinoGrafo','n1');await cuadro(p);
      comprobar((await p.$eval('#totalPanelRespuestaGrafo',e=>e.textContent)).includes('Sin camino desde D')&&await p.$$eval('.arista-editor-grafo.elegida,.gm-nodo-ruta',x=>x.length===0),'Inalcanzable limpia resaltados');
      await p.select('#origenGrafo','n1');await clic(p,'[data-objetivo-grafo="max"]');
      await p.evaluate(()=>{const g=copiarGrafoModulo(moduloGrafo.grafo);g.conexiones.push({id:'inversa-qa',desde:'n4',hacia:'n1',valor:0});comprometerGrafo(g);});
      const ciclo=await p.evaluate(()=>JSON.stringify(moduloGrafo.grafo));await calcular(p);
      comprobar((await p.$eval('#diagnosticoCalculoGrafo',e=>e.textContent)).includes('Ciclo')&&await p.evaluate(g=>JSON.stringify(moduloGrafo.grafo)===g,ciclo),'Ciclo máximo rechazado y conservado');
      await cargarEjemplo(p,'campus');await clic(p,'[data-objetivo-grafo="max"]');const noDir=await p.evaluate(()=>JSON.stringify(moduloGrafo.grafo));await calcular(p);
      comprobar((await p.$eval('#diagnosticoCalculoGrafo',e=>e.textContent)).includes('dirigidos acíclicos')&&await p.evaluate(g=>JSON.stringify(moduloGrafo.grafo)===g,noDir),'Máximo no dirigido rechazado sin conversión');
    } else {
      await cargarEjemplo(p,'desconectado');await calcular(p);
      comprobar(await p.evaluate(()=>{const r=moduloGrafo.resultado;return r.elegidas.length===r.grafo.nodos.length-r.componentes.length&&r.componentes.reduce((s,g)=>s+r.grafo.conexiones.filter(e=>r.elegidas.includes(e.id)&&g.includes(e.desde)).reduce((v,e)=>v+e.valor,0),0)===r.total&&document.getElementById('resultadoGrafo').textContent.includes('Subtotal: 0');}),'Bosque conserva V−C y subtotales con aislado');
    }
    await cargarEjemplo(p,'referencia-clase');await calcular(p);await identidad(p);
    await p.evaluate(()=>{const g=copiarGrafoModulo(moduloGrafo.grafo);g.nodos[0].x+=1;g.nodos[0].nombre='Salida';comprometerGrafo(g);});
    comprobar(await conserva(p),'Mover/renombrar conserva cálculo '+modulo);
    await p.evaluate(()=>{const g=copiarGrafoModulo(moduloGrafo.grafo);g.conexiones[0].valor++;comprometerGrafo(g);});
    comprobar(await p.evaluate(()=>!moduloGrafo.resultado&&!document.querySelector('.arista-editor-grafo.elegida')&&document.getElementById('estadoCalculoGrafo').textContent.includes('Calcula de nuevo')),'Peso invalida solución '+modulo);
    await calcular(p);const antes=await instantanea(p);
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'entrega-grafos-')),invalido=path.join(dir,'invalido.json');fs.writeFileSync(invalido,'{"version":1,"modulo":"'+modulo+'","grafo":null}');
    await vista(p,'grafo');const antesImportar=await instantanea(p);
    const archivo=await p.$('#archivoGrafo');await archivo.uploadFile(invalido);await p.waitForFunction(()=>[...document.querySelectorAll('.toast')].some(e=>e.textContent.includes('No se pudo importar')));
    comprobar(await instantanea(p)===antesImportar,'Importación inválida conserva ejercicio '+modulo);
    await p.evaluate(()=>{window.__descargaEntrega=null;const original=URL.createObjectURL;URL.createObjectURL=function(blob){window.__descargaEntrega=blob;return original.call(this,blob);};});
    await clic(p,'#btnExportarGrafo');const documento=await p.evaluate(async()=>JSON.parse(await window.__descargaEntrega.text()));
    comprobar(documento.version===1&&documento.modulo===modulo&&documento.resuelto,'Exportación JSON conserva formato '+modulo);
    const valido=path.join(dir,'valido.json');fs.writeFileSync(valido,JSON.stringify(documento));
    await archivo.uploadFile(valido);await confirmar(p);await cuadro(p);comprobar(await p.evaluate(()=>moduloGrafo.resultado!==null),'Importación válida reconstruye cálculo '+modulo);
    // PNG: validar el recurso generado sin conservar descargas personales.
    await p.evaluate(()=>{window.__pngEntrega=false;HTMLAnchorElement.prototype.click=function(){if(this.download.endsWith('.png'))window.__pngEntrega=true;};});
    await clic(p,'#btnPngGrafo');await p.waitForFunction(()=>window.__pngEntrega===true);comprobar(true,'PNG generado '+modulo);
    await vista(p,'procedimiento');await p.evaluate(()=>{window.__impresionEntrega=false;window.print=()=>{window.__impresionEntrega=true;};});await clic(p,'#btnImprimirGrafo');
    comprobar(await p.evaluate(()=>window.__impresionEntrega),'Acción de impresión disponible '+modulo);
    comprobar(await p.evaluate(()=>{const paso=moduloGrafo.paso;window.dispatchEvent(new Event('beforeprint'));const total=document.querySelectorAll('#impresionPasos .impresion-paso').length;const ok=total===moduloGrafo.resultado.pasos.length&&moduloGrafo.paso===paso;window.dispatchEvent(new Event('afterprint'));return ok;}),'Impresión contiene todos los pasos y restaura el actual '+modulo);
    await vista(p,'resultado');await p.emulateMediaType('print');
    comprobar(await p.$eval('#panelRespuestaGrafo',e=>e.getBoundingClientRect().height>0),'Respuesta visible en impresión '+modulo);await p.emulateMediaType('screen');
    const textoAlgo=await p.evaluate(()=>{const contexto=AlgoContexto.obtener();return JSON.stringify(contexto);});comprobar(textoAlgo.includes(modulo),'Asistente mantiene contexto '+modulo);
    comprobar(antes.length>0,'Documento previo disponible');
  }
  await contexto.close();
}
(async()=>{const browser=await puppeteer.launch({executablePath:EDGE,headless:true,args:['--no-sandbox']});try{await matriz(browser);await contratos(browser);assert.deepEqual(errores,[]);console.log('Entrega grafos: '+comprobaciones+' comprobaciones correctas. Sin errores JS/HTTP locales.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
