/* Entrenamiento, integración y regresiones del perceptrón; Edge aislado, sin instalar.
 * npm start en otra terminal. URL_PRUEBAS permite revisar el Drop local.
 * --captura conserva imágenes de QA únicamente en TEMP. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const puppeteer=require(path.join(os.tmpdir(),'grafo-e2e/node_modules/puppeteer-core'));
const BASE=(process.env.URL_PRUEBAS||'http://127.0.0.1:8123/').replace(/\/?$/,'/');
const EDGE=process.env.NAVEGADOR||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let correctas=0;const errores=[];
function comprobar(v,m){assert.ok(v,m);correctas++;}
async function cuadro(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function clic(p,s){await p.$eval(s,e=>{for(let a=e.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;e.scrollIntoView({block:'center',behavior:'instant'});});await p.click(s);await cuadro(p);}
async function campo(p,s,v){await p.$eval(s,(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},v);await cuadro(p);}
async function entrenar(p){await clic(p,'#config button[type=submit]');}
async function cargar(p,id){await p.select('#ejemplo',id);await clic(p,'#cargar');}
function observar(p){p.on('pageerror',e=>errores.push(e.message));p.on('console',m=>{if(m.type()==='error')errores.push(m.text());});p.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)errores.push(r.url()+':'+r.status());});}
async function comprobarAnd(p){
  comprobar(await p.$eval('#aprenderUmbral',e=>!e.checked),'Ejemplo mantiene umbral fijo');
  await entrenar(p);
  comprobar(await p.$eval('#resultados',e=>!e.hidden),'Entrenamiento presenta resultado');
  const resumen=await p.$eval('#metricas',e=>e.textContent);
  comprobar(resumen.includes('3/4 → 4/4')&&resumen.includes('(0,1 · 0,1)'),'Aciertos y pesos finales AND');
  const comparacion=await p.$$eval('#comparacion tbody tr',filas=>filas.map(f=>[f.cells[2].textContent,f.cells[3].textContent,f.cells[4].textContent]));
  assert.deepEqual(comparacion,[['0','0','0'],['0','0','0'],['0','1','0'],['1','1','1']]);correctas++;
  comprobar((await p.$eval('#grafico svg',e=>e.getAttribute('aria-label'))).includes('1, 0'),'Errores por época 1,0');
  await clic(p,'#siguiente');await clic(p,'#siguiente');
  const paso=await p.$eval('#detalle-paso',e=>e.textContent);
  comprobar(paso.includes('z = (1 × 0,2) + (0 × 0,1) − (0,2) = 0'),'Neta exacta de la fila (1,0)');
  comprobar(paso.includes('Error e = 1 − (0) = 1')&&paso.includes('w₁: Δw = −(0,1) × (1) × (1) = −0,1'),'Razón numérica de w1');
  comprobar(paso.includes('w₂: Δw = −(0,1) × (1) × (0) = 0')&&paso.includes('esta entrada vale 0'),'Razón numérica de w2 invariable');
  comprobar(paso.includes('Umbral fijo: 0,2'),'Umbral no cambia');
  comprobar(await p.$$eval('#detalle-paso .rn-fila-cambio',e=>e.length===2),'Destaca fila y explicación del único peso cambiado');
  await clic(p,'#tabla-epoca');
  const fila=await p.$eval('#tabla-epoca tbody',e=>[...e.rows[2].cells].map(c=>c.textContent));
  assert.deepEqual(fila,['3','(1 · 0)','(0,2 · 0,1)','(0,2 · 0)','0,2','0,2','0','1','0','1','(−0,1 · 0)','(0,1 · 0,1)','0,2']);correctas++;
  await p.select('#ir-epoca','2');await cuadro(p);
  comprobar((await p.$eval('#paso',e=>e.textContent)).includes('Época 2 de 2'),'Cambio de época');
  comprobar(await p.$$eval('#tabla-epoca tbody tr',filas=>filas.every(f=>f.cells[9].textContent==='0')),'Época 2 completa sin errores');
  await clic(p,'#anterior');comprobar((await p.$eval('#paso',e=>e.textContent)).includes('Época 1 de 2 · Patrón 4'),'Retrocede entre épocas');
  await clic(p,'#siguiente');
  const antes=await p.$eval('#metricas',e=>e.textContent);
  await campo(p,'#pred-0','1');await campo(p,'#pred-1','1');await clic(p,'#predecir');
  comprobar((await p.$eval('#prediccion',e=>e.textContent)).includes('Clase predicha 1'),'Prueba independiente con pesos obtenidos');
  comprobar(await p.$eval('#metricas',(e,a)=>e.textContent===a,antes),'Predecir no modifica entrenamiento');
}
async function matriz(browser){
  for(const ancho of [320,390,768,1440])for(const tema of ['claro','oscuro']){
    const contexto=await browser.createBrowserContext(),p=await contexto.newPage();p.setDefaultTimeout(10000);observar(p);
    await p.setViewport({width:ancho,height:900,deviceScaleFactor:1});await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:tema==='claro'?'light':'dark'},{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(BASE+'redes-neuronales.html',{waitUntil:'networkidle0'});
    comprobar(await p.evaluate(t=>document.documentElement.dataset.tema===t,tema),'Tema común '+tema);
    comprobar(await p.$$eval('#barraLateral a[href="redes-neuronales.html"]',e=>e.length===1),'Menú incluye perceptrón una vez');
    await cargar(p,'and');await comprobarAnd(p);
    const geo=await p.evaluate(()=>({zoom:visualViewport.scale,desborde:document.documentElement.scrollWidth>innerWidth+1,
      controles:[...document.querySelectorAll('#moduloContenido button,#moduloContenido input,#moduloContenido select')].filter(e=>e.getClientRects().length&&!e.closest('.rn-tabla')).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>e.id),
      pesos:[...document.querySelectorAll('#pesos input')].map(e=>({valor:e.value,ancho:e.getBoundingClientRect().width})),
      tabla:getComputedStyle(document.querySelector('#tabla-epoca').parentElement).overflowX}));
    comprobar(geo.zoom===1&&!geo.desborde&&!geo.controles.length&&geo.pesos.every(e=>e.ancho>=44)&&geo.tabla==='auto','Geometría '+ancho+'/'+tema+' '+JSON.stringify(geo));
    await p.focus('#anterior');await p.keyboard.press('Enter');comprobar(await p.$eval('#anterior',e=>document.activeElement===e),'Navegación por teclado conserva foco');
    await campo(p,'#peso-0','texto');comprobar(await p.$eval('#resultados',e=>e.hidden),'Editar invalida y retira resultado');
    comprobar((await p.$eval('#estado',e=>e.textContent)).includes('Entrena de nuevo'),'Pide entrenar de nuevo');
    comprobar((await p.$eval('#diagrama-suma',e=>e.textContent))==='S = Σ xᵢwᵢ','Diagrama retira resultado anterior');
    await entrenar(p);comprobar(await p.$eval('#error',e=>!e.hidden)&&await p.$eval('#peso-0',e=>e.getAttribute('aria-invalid')==='true'),'Entrada inválida indicada');
    await campo(p,'#peso-0','0.2');await entrenar(p);comprobar(await p.$eval('#resultados',e=>!e.hidden),'Punto decimal válido');
    if(process.argv.includes('--captura')&&[390,1440].includes(ancho)&&tema==='oscuro'){
      await p.screenshot({path:path.join(os.tmpdir(),'perceptron-'+ancho+'.png'),fullPage:true});
      await p.$eval('#detalle-paso',e=>e.scrollIntoView({block:'start',behavior:'instant'}));
      await p.screenshot({path:path.join(os.tmpdir(),'perceptron-paso-'+ancho+'.png')});
      await p.evaluate(()=>scrollTo(0,0));
      await p.screenshot({path:path.join(os.tmpdir(),'perceptron-inicio-'+ancho+'.png')});
    }
    await contexto.close();console.log('✓ Perceptrón '+ancho+' px '+tema+': AND, historial, comparación, teclado y validación');
  }
}
async function integracion(browser){
  const contexto=await browser.createBrowserContext(),p=await contexto.newPage();p.setDefaultTimeout(10000);observar(p);
  await p.setViewport({width:390,height:900});
  await p.goto(BASE+'index.html',{waitUntil:'networkidle0'});await clic(p,'#vistaCiudad');
  comprobar(await p.$$eval('.ciudad-zona',e=>e.length===9),'Ciudad tiene nueve módulos');
  await clic(p,'.ciudad-zona[data-modulo="neuronales"]');
  comprobar(await p.$$eval('a[href="redes-neuronales.html"]',e=>e.some(a=>a.textContent==='Abrir módulo')),'Ciudad abre el perceptrón');
  await clic(p,'#vistaLista');comprobar(await p.$$eval('#catalogo a[href="redes-neuronales.html"]',e=>e.length===1),'Vista lista incluye perceptrón');
  await p.setViewport({width:1440,height:900});await clic(p,'#vistaCiudad');
  const ciudad=await p.evaluate(()=>{const zonas=[...document.querySelectorAll('.ciudad-zona')].map(e=>e.getBoundingClientRect()),n=zonas.at(-1);return {desborde:document.documentElement.scrollWidth>innerWidth+1,choque:zonas.slice(0,-1).some(r=>n.left<r.right&&n.right>r.left&&n.top<r.bottom&&n.bottom>r.top)};});
  comprobar(!ciudad.desborde&&!ciudad.choque,'La novena zona conserva espacio propio en escritorio');
  await p.setViewport({width:390,height:900});
  await p.goto(BASE+'redes-neuronales.html',{waitUntil:'networkidle0'});
  await clic(p,'#aprenderUmbral');await entrenar(p);await clic(p,'#siguiente');await clic(p,'#siguiente');
  comprobar((await p.$eval('#detalle-paso',e=>e.textContent)).includes('Δθ = η · e = (0,1) × (1) = 0,1. θ nuevo = 0,2 + (0,1) = 0,3'),'Actualización opcional del umbral separada de los pesos');
  await clic(p,'#aprenderUmbral');
  await cargar(p,'bipolar');await entrenar(p);
  comprobar((await p.$eval('#metricas',e=>e.textContent)).includes('3/4 → 4/4'),'Hardlims bipolar aprende');
  await clic(p,'#siguiente');await clic(p,'#siguiente');await clic(p,'#siguiente');
  comprobar((await p.$eval('#detalle-paso',e=>e.textContent)).includes('Error e = −1 − (1) = −2'),'Hardlims registra error −2');
  comprobar((await p.$eval('#grafico svg',e=>e.getAttribute('aria-label'))).includes('1, 0'),'Hardlims termina tras dos épocas');
  await cargar(p,'or');await entrenar(p);comprobar((await p.$eval('#convergencia',e=>e.textContent))==='Convergió','OR converge');
  await cargar(p,'xor');await entrenar(p);
  comprobar((await p.$eval('#convergencia',e=>e.textContent))==='Límite de épocas','XOR declara límite');
  comprobar((await p.$eval('#metricas',e=>e.textContent)).includes('12'),'XOR ejecuta doce épocas');
  await cargar(p,'and');await entrenar(p);const antes=await p.$eval('#metricas',e=>e.textContent);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'perceptron-json-')),f=path.join(dir,'invalido.json');
  fs.writeFileSync(f,JSON.stringify({tipo:'ciudad-perceptron',version:1,datos:{entradas:2,activacion:'hardlims',aprenderUmbral:false,umbral:'.2',razon:'.1',epocas:2,pesos:[0,0],patrones:[{x:[0,0],y:0}]}}));
  await (await p.$('#archivo')).uploadFile(f);await p.waitForFunction(()=>!document.getElementById('error').hidden);
  comprobar(await p.$eval('#metricas',(e,t)=>e.textContent===t,antes)&&await p.$eval('#resultados',e=>!e.hidden),'JSON inválido conserva ejercicio y entrenamiento');
  await p.evaluate(()=>{const original=URL.createObjectURL;URL.createObjectURL=function(b){window.__jsonPerceptron=b;return original.call(this,b);};});
  await clic(p,'#exportar');const documento=await p.evaluate(async()=>JSON.parse(await window.__jsonPerceptron.text()));
  comprobar(documento.tipo==='ciudad-perceptron'&&documento.version===1&&documento.datos.patrones.length===4,'Exporta datos reproducibles');
  const valido=path.join(dir,'valido.json');fs.writeFileSync(valido,JSON.stringify(documento));await (await p.$('#archivo')).uploadFile(valido);await p.waitForFunction(()=>document.getElementById('estado').textContent.includes('cargado correctamente'));
  comprobar(await p.$eval('#resultados',e=>e.hidden),'Importar válido exige entrenar');await comprobarAnd(p);
  const algo=await p.evaluate(()=>({nombre:AlgoContexto.obtener().modulo,respuesta:AlgoMotor.responder('¿Por qué cambia un peso?',AlgoContexto.obtener()).texto,paso:AlgoContexto.ayudaLocal('Explica este paso',AlgoContexto.obtener())}));
  comprobar(algo.nombre==='neuronales'&&algo.respuesta.includes('Δw'),'Algo reconoce módulo y regla');
  comprobar(algo.paso.includes('Época')&&algo.paso.includes('patrón'),'Algo explica el registro actual sin recalcular');
  await clic(p,'#btnMenuLateral');await p.evaluate(async()=>{await Promise.all(document.getElementById('barraLateral').getAnimations().map(a=>a.finished.catch(()=>{})));});await clic(p,'#barraLateral .sidebar__acceso-modulo');await p.waitForSelector('#dialogoFondo:not([hidden])');comprobar((await p.$eval('#dialogoFondo',e=>e.textContent)).includes('Perceptrón'),'Ayuda integrada accesible desde el menú móvil');await p.keyboard.press('Escape');
  await p.select('#activacion','hardlims');await cuadro(p);
  comprobar(await p.$eval('#resultados',e=>e.hidden)&&(await p.$eval('#estado',e=>e.textContent)).includes('Entrena de nuevo'),'Cambiar activación retira resultado y pide entrenar');
  comprobar(await p.$$eval('#datos tbody select',s=>s.map(e=>e.value).join(',')==='-1,-1,-1,1'),'Activación bipolar muestra únicamente clases compatibles');
  await contexto.close();
}
(async()=>{const browser=await puppeteer.launch({executablePath:EDGE,headless:true,args:['--no-sandbox']});try{await matriz(browser);await integracion(browser);assert.deepEqual(errores,[]);console.log('Perceptrón navegador: '+correctas+' comprobaciones correctas; sin errores JS/HTTP locales.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
