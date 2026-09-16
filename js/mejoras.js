'use strict';

// Estado de consulta y reproducción separado del documento y del historial.
let resultadoJohnsonActual=null, rutaActual=null, indiceRuta=0, relojRuta=null;
let firmaDocumento='';
const rutaUI=Object.fromEntries(['routeOrigin','routeDestination','routeStatus','routeSummary','routeProgress',
  'btnRoutePlay','btnRoutePrev','btnRouteNext','btnVerRuta','btnDeshacer','btnRehacer','graphSaved'].map(id=>[id,document.getElementById(id)]));
function firmaGrafo(){return JSON.stringify({nodos:estado.nodos.map(n=>[n.id,n.nombre]),conexiones:estado.conexiones.map(c=>[c.id,c.desde,c.hacia,c.valor])});}
function detenerRuta(){clearInterval(relojRuta);relojRuta=null;rutaUI.btnRoutePlay.textContent='Reproducir ruta';}
function controlesRuta(){
  const length=rutaActual?.conexiones.length??0;
  rutaUI.btnRoutePlay.disabled=!length;rutaUI.btnRoutePrev.disabled=!length||indiceRuta===0;rutaUI.btnRouteNext.disabled=!length||indiceRuta>=length;
  rutaUI.btnDeshacer.disabled=!puedeDeshacer();rutaUI.btnRehacer.disabled=!puedeRehacer();rutaUI.btnVerRuta.disabled=!estado.nodos.length;
}
function sincronizarSelectores(){
  for(const key of ['routeOrigin','routeDestination']){
    const select=rutaUI[key],old=select.value;select.replaceChildren();
    estado.nodos.forEach(n=>{const option=document.createElement('option');option.value=n.id;option.textContent=n.nombre;select.append(option);});
    if(estado.nodos.some(n=>n.id===old))select.value=old;
    else if(key==='routeDestination'&&estado.nodos.length>1)select.selectedIndex=estado.nodos.length-1;
  }
}
function invalidarResultados(){
  const habia=!!resultadoJohnsonActual||!!estado.visualizacionJohnson;
  detenerRuta();resultadoJohnsonActual=null;rutaActual=null;estado.visualizacionJohnson=null;
  cicloJohnsonPendiente=null;
  cerrarResultadoJohnson();
  rutaUI.routeSummary.textContent='';rutaUI.routeProgress.textContent='';
  rutaUI.routeStatus.textContent=habia?'Los datos cambiaron. Vuelve a consultar o calcular.':'Selecciona origen y destino para consultar una ruta.';
  controlesRuta();sincronizarSelectores();
}
function revisarCambiosGrafo(){
  const firma=firmaGrafo();if(firma!==firmaDocumento){invalidarResultados();firmaDocumento=firma;}
  controlesRuta();
}
function informarGuardado(ok){rutaUI.graphSaved.textContent=ok?'✓ Guardado en este navegador':'No se pudo guardar. Exporta el JSON para conservarlo.';rutaUI.graphSaved.classList.toggle('save-error',!ok);}
function registrarResultadoJohnson(resultado){resultadoJohnsonActual=resultado;firmaDocumento=firmaGrafo();}
function mostrarRutaConsultada(ruta,resultado,origen,destino){
  detenerRuta();registrarResultadoJohnson(resultado);rutaActual={...ruta,nodos:ruta.nodos.slice(),conexiones:ruta.conexiones.slice()};indiceRuta=ruta.conexiones.length;
  rutaUI.routeOrigin.value=resultado.ids[origen];rutaUI.routeDestination.value=resultado.ids[destino];
  rutaUI.routeSummary.textContent=ruta.nodos.map(id=>buscarNodo(id)?.nombre??'?').join(' → ');
  rutaUI.routeStatus.textContent=`Costo mínimo: ${ruta.distancia} · ${ruta.conexiones.length} conexiones`;
  rutaUI.routeProgress.textContent=ruta.conexiones.length?'Pesos originales: '+ruta.conexiones.map(id=>{const v=buscarConexion(id).valor;return v<0?`(${v})`:String(v);}).join(' + ')+` = ${ruta.distancia}`:'Origen y destino coinciden: costo 0.';
  controlesRuta();
}
function consultarRuta(){
  if(!estado.nodos.length)return;
  detenerRuta();
  if(!resultadoJohnsonActual||firmaDocumento!==firmaGrafo())registrarResultadoJohnson(calcularJohnson());
  const result=resultadoJohnsonActual;
  if(result.tieneCicloNegativo){
    rutaActual=null;estado.visualizacionJohnson=null;controlesRuta();rutaUI.routeSummary.textContent='';rutaUI.routeProgress.textContent='';
    resaltarCicloJohnson({nodos:result.cicloNodos,conexiones:result.cicloConexiones,nombres:result.ciclo});
    const total=result.cicloConexiones.reduce((s,id)=>s+buscarConexion(id).valor,0);
    rutaUI.routeStatus.textContent=`Ciclo negativo: costo ${total}. Johnson no puede completar la matriz.`;
    rutaUI.routeSummary.textContent=result.ciclo.concat(result.ciclo[0]??[]).join(' → ');return;
  }
  const a=result.ids.indexOf(rutaUI.routeOrigin.value),b=result.ids.indexOf(rutaUI.routeDestination.value),route=reconstruirRutaJohnson(a,b,result);
  if(!route){rutaActual=null;limpiarVisualizacionJohnson(true);controlesRuta();rutaUI.routeStatus.textContent='No existe camino en este sentido.';rutaUI.routeSummary.textContent='';rutaUI.routeProgress.textContent='';return;}
  activarCeldaJohnson(result,a,b);
}
function pintarPasoRuta(){
  if(!rutaActual)return;
  const conexiones=rutaActual.conexiones.slice(0,indiceRuta),nodos=rutaActual.nodos.slice(0,indiceRuta+1);
  estado.visualizacionJohnson={origen:rutaActual.nodos[0],destino:indiceRuta===rutaActual.conexiones.length?rutaActual.nodos.at(-1):null,nodos,conexiones,tipo:'ruta',distancia:rutaActual.distancia};
  const acumulado=conexiones.reduce((s,id)=>s+(buscarConexion(id)?.valor??0),0);
  rutaUI.routeProgress.textContent=`Tramo ${indiceRuta} de ${rutaActual.conexiones.length} · Costo acumulado: ${acumulado}`;
  dibujar();controlesRuta();
}
function cambiarConsulta(){
  detenerRuta();rutaActual=null;limpiarVisualizacionJohnson(true);rutaUI.routeSummary.textContent='';rutaUI.routeProgress.textContent='';rutaUI.routeStatus.textContent='Pulsa Ver ruta mínima para consultar estos nodos.';controlesRuta();
}
rutaUI.routeOrigin.addEventListener('change',cambiarConsulta);rutaUI.routeDestination.addEventListener('change',cambiarConsulta);
rutaUI.btnVerRuta.addEventListener('click',consultarRuta);
document.getElementById('btnSwapRoute').addEventListener('click',()=>{const a=rutaUI.routeOrigin.value;rutaUI.routeOrigin.value=rutaUI.routeDestination.value;rutaUI.routeDestination.value=a;cambiarConsulta();});
document.getElementById('btnClearRoute').addEventListener('click',()=>{cambiarConsulta();rutaUI.routeStatus.textContent='Resaltado eliminado. El grafo conserva sus datos.';});
rutaUI.btnRoutePrev.addEventListener('click',()=>{detenerRuta();indiceRuta=Math.max(0,indiceRuta-1);pintarPasoRuta();});
rutaUI.btnRouteNext.addEventListener('click',()=>{detenerRuta();indiceRuta=Math.min(rutaActual.conexiones.length,indiceRuta+1);pintarPasoRuta();});
rutaUI.btnRoutePlay.addEventListener('click',()=>{
  if(relojRuta){detenerRuta();return;}if(!rutaActual)return;
  if(indiceRuta>=rutaActual.conexiones.length)indiceRuta=0;pintarPasoRuta();rutaUI.btnRoutePlay.textContent='Pausar';
  relojRuta=setInterval(()=>{indiceRuta++;pintarPasoRuta();if(indiceRuta>=rutaActual.conexiones.length)detenerRuta();},1100);
});
rutaUI.btnDeshacer.addEventListener('click',deshacer);rutaUI.btnRehacer.addEventListener('click',rehacer);
document.getElementById('btnAjustarVista').addEventListener('click',ajustarVista);
document.getElementById('btnPantallaCompleta').addEventListener('click',()=>{document.body.classList.toggle('editor-ampliado');requestAnimationFrame(()=>{medirArea();ajustarVista();});});
document.getElementById('btnToggleRoutes').addEventListener('click',e=>{const control=document.getElementById('routeControls');control.hidden=!control.hidden;e.currentTarget.textContent=control.hidden?'Mostrar':'Ocultar';e.currentTarget.setAttribute('aria-expanded',String(!control.hidden));});
document.getElementById('btnEjemploGrafo').addEventListener('click',async()=>{
  cerrarMenuExtra();if(estado.nodos.length&&!await confirmar({titulo:'Cargar ejemplo',mensaje:'Se reemplazará el grafo actual. Podrás recuperarlo con Deshacer.'}))return;
  const nodos=[{id:'n_1',nombre:'A',x:120,y:180},{id:'n_2',nombre:'B',x:360,y:90},{id:'n_3',nombre:'C',x:360,y:300},{id:'n_4',nombre:'D',x:620,y:180},{id:'n_5',nombre:'E',x:820,y:300}];
  const conexiones=[[1,2,4],[1,3,7],[2,3,-2],[2,4,6],[3,4,3],[4,5,2],[3,5,8]].map(([a,b,v],i)=>({id:'c_'+(i+6),desde:'n_'+a,hacia:'n_'+b,valor:v}));
  aplicarGrafo({nodos,conexiones,siguienteId:20});guardar();dibujar();medirArea();ajustarVista();
});
document.getElementById('btnOrdenarGrafo').addEventListener('click',()=>{
  cerrarMenuExtra();if(!estado.nodos.length)return;guardarEstadoParaDeshacer();
  const radius=Math.max(120,estado.nodos.length*20);estado.nodos.forEach((n,i)=>{const a=2*Math.PI*i/estado.nodos.length-Math.PI/2;n.x=radius+120+radius*Math.cos(a);n.y=radius+120+radius*Math.sin(a);});
  guardar();dibujar();medirArea();ajustarVista();
});

// Los diálogos existentes comparten gestión de foco y bloqueo del fondo.
let botonApertura=null,ultimoDialogo=null;
document.addEventListener('click',e=>{if(!e.target.closest('.hoja-fondo,.modal-fondo'))botonApertura=e.target.closest('button,a');},true);
function dialogoVisible(){return Array.from(document.querySelectorAll('.hoja-fondo,.modal-fondo')).filter(e=>!e.hidden).at(-1)??null;}
function actualizarDialogos(){
  const visible=dialogoVisible();
  document.querySelector('main').inert=!!visible;document.querySelector('.app-header').inert=!!visible;
  document.querySelectorAll('.hoja-fondo,.modal-fondo').forEach(e=>e.inert=!e.hidden&&e!==visible);
  if(visible&&visible!==ultimoDialogo&&!visible.contains(document.activeElement))visible.querySelector('button:not([hidden]),input:not([hidden])')?.focus();
  if(!visible&&ultimoDialogo&&botonApertura?.isConnected)botonApertura.focus();
  ultimoDialogo=visible;
}
document.querySelectorAll('.hoja-fondo,.modal-fondo').forEach(e=>new MutationObserver(actualizarDialogos).observe(e,{attributes:true,attributeFilter:['hidden']}));
document.addEventListener('keydown',e=>{
  const box=dialogoVisible();if(!box||e.key!=='Tab')return;
  const items=Array.from(box.querySelectorAll('button,input,select,[tabindex="0"]')).filter(x=>!x.disabled&&x.getClientRects().length);
  if(!items.length)return;const first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
},true);
window.addEventListener('pagehide',detenerRuta);
requestAnimationFrame(()=>{firmaDocumento=firmaGrafo();sincronizarSelectores();controlesRuta();});
