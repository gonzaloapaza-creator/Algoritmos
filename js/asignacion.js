'use strict';

const estadoAsignacion = { rows:4, cols:4, objective:'min',
  labelsRows:['Trabajador A','Trabajador B','Trabajador C','Trabajador D'],
  labelsCols:['Trabajo 1','Trabajo 2','Trabajo 3','Trabajo 4'],
  values:[[12,8,9,14],[7,10,11,18],[15,13,6,9],[10,17,12,5]] };
const refs = Object.fromEntries(['asignacionMatrix','resultMatrix','asignacionResultado','resultadoAsignacionTexto',
  'procedimientoAsignacion','grafoAsignacion','assignmentStatus','rowsValue','colsValue','stepCounter','stepRange',
  'btnStepPrev','btnStepNext','btnStepPlay','btnAssignmentUndo','toastStack'].map(id=>[id,document.getElementById(id)]));
let resultadoAsignacion=null, parejaSeleccionada=null, pasoAsignacion=0, timerAsignacion=null;
const historialAsignacion=[];
function texto(tag,value,clase){const e=document.createElement(tag);e.textContent=value;if(clase)e.className=clase;return e;}
function showToast(message,type='ok') {
  const e=texto('div',message,'toast toast--'+type);refs.toastStack.append(e);setTimeout(()=>e.remove(),3200);
}
function persistAssignmentState(){
  try{localStorage.setItem(ASIGNACION_STORAGE_KEY,JSON.stringify(estadoAsignacion));document.getElementById('assignmentSaved').textContent='Guardado en este navegador';}
  catch{document.getElementById('assignmentSaved').textContent='No se pudo guardar. Exporta el problema para conservarlo.';}
}
function restoreAssignmentState(){
  try{
    const p=JSON.parse(localStorage.getItem(ASIGNACION_STORAGE_KEY));
    if(!p||!Number.isInteger(p.rows)||!Number.isInteger(p.cols)||p.rows<1||p.cols<1||p.rows>8||p.cols>8||
      !['min','max'].includes(p.objective)||!Array.isArray(p.values)||p.values.length!==p.rows||
      p.values.some(row=>!Array.isArray(row)||row.length!==p.cols||row.some(v=>v!==null&&(!Number.isInteger(v)||Math.abs(v)>999999))))return;
    for(const [key,n,prefix] of [['labelsRows',p.rows,'Recurso'],['labelsCols',p.cols,'Tarea']]){
      p[key]=Array.from({length:n},(_,i)=>typeof p[key]?.[i]==='string'&&p[key][i].trim()?p[key][i].trim().slice(0,24):`${prefix} ${i+1}`);
    }
    Object.assign(estadoAsignacion,{rows:p.rows,cols:p.cols,objective:p.objective,values:p.values,labelsRows:p.labelsRows,labelsCols:p.labelsCols});
  }catch{/* Se conserva el ejemplo inicial si el guardado está dañado. */}
}
function recordar(){historialAsignacion.push(JSON.stringify(estadoAsignacion));if(historialAsignacion.length>50)historialAsignacion.shift();refs.btnAssignmentUndo.disabled=false;}
function detenerPasos(){clearInterval(timerAsignacion);timerAsignacion=null;refs.btnStepPlay.textContent='Reproducir';}
function invalidarAsignacion(){
  const habia=!!resultadoAsignacion;
  detenerPasos();resultadoAsignacion=null;parejaSeleccionada=null;
  refs.asignacionResultado.hidden=true;
  document.querySelectorAll('[data-assignment-view]').forEach(b=>{if(b.dataset.assignmentView!=='datos')b.disabled=true;});
  cambiarVistaAsignacion('datos');
  refs.assignmentStatus.textContent=habia?'Los datos cambiaron. Vuelve a resolver.':'Completa la matriz y pulsa Resolver.';
}
function cambiarVistaAsignacion(view){
  if(view!=='datos'&&!resultadoAsignacion)return;
  detenerPasos();
  document.querySelectorAll('[data-assignment-view]').forEach(b=>{const active=b.dataset.assignmentView===view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  document.getElementById('assignmentData').hidden=view!=='datos';
  refs.asignacionResultado.hidden=view==='datos';
  document.getElementById('assignmentResultContent').hidden=view!=='resultado';
  document.getElementById('assignmentProcedureContent').hidden=view!=='pasos';
}
function actualizarObjetivo(){
  document.querySelectorAll('[name="objetivo"]').forEach(r=>r.checked=r.value===estadoAsignacion.objective);
  document.getElementById('matrix-title').textContent=estadoAsignacion.objective==='max'?'Matriz de beneficios':'Matriz de costos';
}
function buildMatrixFromState(){
  refs.rowsValue.textContent=estadoAsignacion.rows;refs.colsValue.textContent=estadoAsignacion.cols;actualizarObjetivo();
  document.querySelectorAll('[data-dimension]').forEach(b=>b.disabled=(estadoAsignacion[b.dataset.dimension]+Number(b.dataset.step)<1||estadoAsignacion[b.dataset.dimension]+Number(b.dataset.step)>8));
  const table=document.createElement('table');table.setAttribute('aria-label','Datos del problema de asignación');
  const head=document.createElement('thead'),tr=document.createElement('tr');tr.append(texto('th','Recurso / Tarea'));
  function label(key,index){
    const input=document.createElement('input');input.className='label-input';input.type='text';input.maxLength=24;input.value=estadoAsignacion[key][index];
    input.setAttribute('aria-label',`Nombre de ${key==='labelsRows'?'recurso':'tarea'} ${index+1}`);
    input.addEventListener('change',()=>{recordar();estadoAsignacion[key][index]=input.value.trim()||(key==='labelsRows'?'Recurso ':'Tarea ')+(index+1);input.value=estadoAsignacion[key][index];invalidarAsignacion();persistAssignmentState();});
    return input;
  }
  estadoAsignacion.labelsCols.forEach((_,c)=>{const th=document.createElement('th');th.scope='col';th.append(label('labelsCols',c));tr.append(th);});head.append(tr);table.append(head);
  const body=document.createElement('tbody');
  estadoAsignacion.values.forEach((row,r)=>{
    const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.append(label('labelsRows',r));tr.append(th);
    row.forEach((value,c)=>{
      const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.step='1';input.min='-999999';input.max='999999';input.value=value??'';input.dataset.row=r;input.dataset.col=c;
      input.setAttribute('aria-label',`${estadoAsignacion.labelsRows[r]} / ${estadoAsignacion.labelsCols[c]}`);
      input.setAttribute('aria-invalid',String(value===null));
      input.addEventListener('input',()=>{
        recordar();const v=Number(input.value);estadoAsignacion.values[r][c]=input.value.trim()!==''&&Number.isInteger(v)&&Math.abs(v)<=999999?v:null;
        input.setAttribute('aria-invalid',String(estadoAsignacion.values[r][c]===null));invalidarAsignacion();persistAssignmentState();
      });
      input.addEventListener('keydown',e=>{
        const delta={ArrowDown:[1,0],ArrowUp:[-1,0],Enter:[1,0]};if(!delta[e.key])return;
        e.preventDefault();const [dr,dc]=delta[e.key];table.querySelector(`[data-row="${r+dr}"][data-col="${c+dc}"]`)?.focus();
      });td.append(input);tr.append(td);
    });body.append(tr);
  });table.append(body);refs.asignacionMatrix.replaceChildren(table);
}
function adjustDimension(dimension,step){
  const next=estadoAsignacion[dimension]+step;if(next<1||next>8)return;
  if(step<0&&!window.confirm('Se eliminará la última fila o columna. Podrás recuperarla con Deshacer.'))return;
  recordar();estadoAsignacion[dimension]=next;
  estadoAsignacion.labelsRows=Array.from({length:estadoAsignacion.rows},(_,r)=>estadoAsignacion.labelsRows[r]??`Recurso ${r+1}`);
  estadoAsignacion.labelsCols=Array.from({length:estadoAsignacion.cols},(_,c)=>estadoAsignacion.labelsCols[c]??`Tarea ${c+1}`);
  estadoAsignacion.values=Array.from({length:estadoAsignacion.rows},(_,r)=>Array.from({length:estadoAsignacion.cols},(_,c)=>estadoAsignacion.values[r]?.[c]??0));
  invalidarAsignacion();buildMatrixFromState();persistAssignmentState();
}
function elegirPareja(r,c){parejaSeleccionada={row:r,col:c};renderResult();}
function renderResult(){
  if(!resultadoAsignacion)return;
  const result=resultadoAsignacion;refs.resultadoAsignacionTexto.replaceChildren();
  refs.resultadoAsignacionTexto.append(texto('p',`${result.objective==='max'?'Beneficio máximo':'Costo mínimo'}: ${result.total}`,'total-value'));
  refs.resultadoAsignacionTexto.append(texto('p',`${result.assignments.length} asignaciones · Método húngaro`,'muted'));
  const list=document.createElement('div');list.className='assignment-pairs';
  result.assignments.forEach(a=>{const b=texto('button',`${estadoAsignacion.labelsRows[a.row]} → ${estadoAsignacion.labelsCols[a.col]} · ${a.value}`,'pair-button');b.type='button';b.dataset.pair=`${a.row}-${a.col}`;b.classList.toggle('active',parejaSeleccionada?.row===a.row&&parejaSeleccionada?.col===a.col);b.addEventListener('click',()=>elegirPareja(a.row,a.col));list.append(b);});
  refs.resultadoAsignacionTexto.append(list);
  const unassignedRows=estadoAsignacion.labelsRows.filter((_,r)=>!result.assignments.some(a=>a.row===r));
  const unassignedCols=estadoAsignacion.labelsCols.filter((_,c)=>!result.assignments.some(a=>a.col===c));
  if(unassignedRows.length)refs.resultadoAsignacionTexto.append(texto('p','Sin tarea: '+unassignedRows.join(', '),'result-note'));
  if(unassignedCols.length)refs.resultadoAsignacionTexto.append(texto('p','Tareas sin asignar: '+unassignedCols.join(', '),'result-note'));
  const table=document.createElement('table'),head=document.createElement('thead'),hr=document.createElement('tr');hr.append(texto('th','Recurso / Tarea'));
  estadoAsignacion.labelsCols.forEach(name=>hr.append(texto('th',name)));head.append(hr);table.append(head);
  const body=document.createElement('tbody');
  estadoAsignacion.values.forEach((row,r)=>{const tr=document.createElement('tr');tr.append(texto('th',estadoAsignacion.labelsRows[r]));row.forEach((v,c)=>{
    const td=document.createElement('td'),selected=result.assignments.some(a=>a.row===r&&a.col===c),b=texto('button',String(v)+(selected?' ✓':''),'cell-button');
    b.type='button';b.setAttribute('aria-label',`${estadoAsignacion.labelsRows[r]}, ${estadoAsignacion.labelsCols[c]}, valor ${v}${selected?', asignación óptima':''}`);
    b.addEventListener('click',()=>elegirPareja(r,c));td.classList.toggle('selected-cell',selected);td.classList.toggle('pair-focused',parejaSeleccionada?.row===r&&parejaSeleccionada?.col===c);td.append(b);tr.append(td);
  });body.append(tr);});table.append(body);refs.resultMatrix.replaceChildren(table);dibujarAsignacion();
}
function svgElement(tag,attrs={},value){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(value!==undefined)e.textContent=value;return e;}
function dibujarAsignacion(){
  if(!resultadoAsignacion)return;
  const svg=refs.grafoAsignacion,n=Math.max(estadoAsignacion.rows,estadoAsignacion.cols),height=70+n*72;
  svg.setAttribute('viewBox',`0 0 700 ${height}`);svg.style.height=height+'px';svg.replaceChildren();
  svg.append(svgElement('title',{},'Emparejamiento óptimo entre recursos y tareas'));
  svg.append(svgElement('text',{x:115,y:24,class:'bipartite-heading'},'Recursos'),svgElement('text',{x:585,y:24,class:'bipartite-heading'},'Tareas'));
  const all=document.getElementById('showAllAssignmentEdges').checked;
  const pairs=all?estadoAsignacion.values.flatMap((row,r)=>row.map((v,c)=>({row:r,col:c,value:v}))):resultadoAsignacion.assignments.slice();
  if(parejaSeleccionada&&!pairs.some(a=>a.row===parejaSeleccionada.row&&a.col===parejaSeleccionada.col))pairs.push({...parejaSeleccionada,value:estadoAsignacion.values[parejaSeleccionada.row][parejaSeleccionada.col]});
  pairs.sort((a,b)=>Number(a.row===parejaSeleccionada?.row&&a.col===parejaSeleccionada?.col)-Number(b.row===parejaSeleccionada?.row&&b.col===parejaSeleccionada?.col));
  const isChosen=(r,c)=>resultadoAsignacion.assignments.some(a=>a.row===r&&a.col===c);
  pairs.forEach(a=>{
    const selected=isChosen(a.row,a.col),focused=parejaSeleccionada?.row===a.row&&parejaSeleccionada?.col===a.col;
    const y1=64+a.row*72,y2=64+a.col*72;
    const g=svgElement('g',{class:`bipartite-edge${selected?' chosen':''}${focused?' focused':''}`,tabindex:'0',role:'button','aria-label':`${estadoAsignacion.labelsRows[a.row]} a ${estadoAsignacion.labelsCols[a.col]}, ${a.value}${selected?', elegida':''}`});
    const d=`M 220 ${y1} C 315 ${y1}, 385 ${y2}, 480 ${y2}`;
    g.append(svgElement('path',{d,class:'bipartite-hit'}),svgElement('path',{d,class:'bipartite-line'}));
    if(selected||focused)g.append(svgElement('text',{x:350,y:(y1+y2)/2-7,class:'bipartite-weight'},String(a.value)));
    g.addEventListener('click',()=>elegirPareja(a.row,a.col));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();elegirPareja(a.row,a.col);}});svg.append(g);
  });
  [['labelsRows',115,'row'],['labelsCols',585,'col']].forEach(([key,x,side])=>estadoAsignacion[key].forEach((name,i)=>{
    const y=64+i*72,selected=resultadoAsignacion.assignments.some(a=>a[side]===i),focus=parejaSeleccionada?.[side]===i;
    const g=svgElement('g',{class:`bipartite-node${selected?' assigned':' unassigned'}${focus?' focused':''}`});g.append(svgElement('rect',{x:x-105,y:y-24,width:210,height:48,rx:12}),svgElement('text',{x,y:y+5},name));svg.append(g);
  }));
  const hint=document.getElementById('assignmentPairHint');hint.textContent=parejaSeleccionada?
    `${estadoAsignacion.labelsRows[parejaSeleccionada.row]} → ${estadoAsignacion.labelsCols[parejaSeleccionada.col]}: ${estadoAsignacion.values[parejaSeleccionada.row][parejaSeleccionada.col]} · ${isChosen(parejaSeleccionada.row,parejaSeleccionada.col)?'Elegida en el óptimo':'No elegida en este óptimo'}`:
    'Selecciona una conexión o una casilla para compararlas. Las conexiones verdes pertenecen al óptimo.';
}
function renderProcedure(){
  if(!resultadoAsignacion)return;
  const steps=resultadoAsignacion.steps,s=steps[pasoAsignacion];refs.procedimientoAsignacion.replaceChildren(texto('h3',s.title),texto('p',s.text));
  refs.stepCounter.textContent=`Paso ${pasoAsignacion+1} de ${steps.length}`;refs.stepRange.max=steps.length-1;refs.stepRange.value=pasoAsignacion;
  refs.btnStepPrev.disabled=pasoAsignacion===0;refs.btnStepNext.disabled=pasoAsignacion===steps.length-1;
  const table=document.createElement('table'),head=document.createElement('thead'),hr=document.createElement('tr');hr.append(texto('th',''));
  s.matrix.forEach((_,c)=>hr.append(texto('th',estadoAsignacion.labelsCols[c]??`Ficticia ${c+1}`)));head.append(hr);table.append(head);
  const body=document.createElement('tbody');s.matrix.forEach((row,r)=>{const tr=document.createElement('tr');tr.append(texto('th',estadoAsignacion.labelsRows[r]??`Ficticio ${r+1}`));row.forEach((v,c)=>{
    const td=texto('td',String(v)+(s.stars[r][c]?' ★':s.primes[r][c]?' ′':''));
    td.classList.toggle('covered-row',s.coveredRows[r]);td.classList.toggle('covered-col',s.coveredCols[c]);td.classList.toggle('selected-cell',s.stars[r][c]);td.classList.toggle('candidate-cell',s.primes[r][c]);
    if(r>=estadoAsignacion.rows||c>=estadoAsignacion.cols)td.classList.add('dummy-cell');
    tr.append(td);
  });body.append(tr);});table.append(body);const scroll=document.createElement('div');scroll.className='matrix-scroll';scroll.append(table);refs.procedimientoAsignacion.append(scroll);
}
function handleSolve(){
  try{const result=solveAssignment(estadoAsignacion.values,estadoAsignacion.objective);resultadoAsignacion=result;parejaSeleccionada=null;pasoAsignacion=0;
    document.querySelectorAll('[data-assignment-view]').forEach(b=>b.disabled=false);renderResult();renderProcedure();cambiarVistaAsignacion('resultado');
    refs.assignmentStatus.textContent='Resultado actualizado · Puedes consultar la matriz, el gráfico o los pasos.';showToast('Asignación óptima calculada.');
  }catch(e){showToast(e.message,'error');refs.asignacionMatrix.querySelector('[aria-invalid="true"]')?.focus();}
}
function exportarAsignacion(){
  const blob=new Blob([JSON.stringify({version:2,problema:estadoAsignacion,resultado:resultadoAsignacion?{assignments:resultadoAsignacion.assignments,total:resultadoAsignacion.total,objective:resultadoAsignacion.objective}:null},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='asignacion.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
restoreAssignmentState();buildMatrixFromState();
document.querySelectorAll('[name="objetivo"]').forEach(r=>r.addEventListener('change',()=>{recordar();estadoAsignacion.objective=r.value;actualizarObjetivo();invalidarAsignacion();persistAssignmentState();}));
document.querySelectorAll('[data-dimension]').forEach(b=>b.addEventListener('click',()=>adjustDimension(b.dataset.dimension,Number(b.dataset.step))));
document.querySelectorAll('[data-assignment-view]').forEach(b=>b.addEventListener('click',()=>cambiarVistaAsignacion(b.dataset.assignmentView)));
document.getElementById('btnResolverAsignacion').addEventListener('click',handleSolve);
document.getElementById('btnAsignacionLimpiar').addEventListener('click',()=>{if(!confirm('¿Vaciar todos los costos? Puedes deshacerlo.'))return;recordar();estadoAsignacion.values=Array.from({length:estadoAsignacion.rows},()=>Array(estadoAsignacion.cols).fill(null));invalidarAsignacion();buildMatrixFromState();persistAssignmentState();});
document.getElementById('btnAsignacionEjemplo').addEventListener('click',()=>{if(!confirm('¿Reemplazar los datos por un ejemplo? Puedes deshacerlo.'))return;recordar();Object.assign(estadoAsignacion,{rows:3,cols:3,objective:'min',labelsRows:['Ana','Bruno','Carla'],labelsCols:['Diseño','Código','Pruebas'],values:[[0,1,1],[0,1,1],[1,0,0]]});invalidarAsignacion();buildMatrixFromState();persistAssignmentState();showToast('Ejemplo cargado: requiere ajustar la matriz para completar el óptimo.');});
refs.btnAssignmentUndo.addEventListener('click',()=>{if(!historialAsignacion.length)return;Object.assign(estadoAsignacion,JSON.parse(historialAsignacion.pop()));invalidarAsignacion();buildMatrixFromState();persistAssignmentState();refs.btnAssignmentUndo.disabled=!historialAsignacion.length;});
document.getElementById('showAllAssignmentEdges').addEventListener('change',dibujarAsignacion);
refs.btnStepPrev.addEventListener('click',()=>{detenerPasos();pasoAsignacion=Math.max(0,pasoAsignacion-1);renderProcedure();});
refs.btnStepNext.addEventListener('click',()=>{detenerPasos();pasoAsignacion=Math.min(resultadoAsignacion.steps.length-1,pasoAsignacion+1);renderProcedure();});
refs.stepRange.addEventListener('input',()=>{detenerPasos();pasoAsignacion=Number(refs.stepRange.value);renderProcedure();});
refs.btnStepPlay.addEventListener('click',()=>{if(timerAsignacion){detenerPasos();return;}if(pasoAsignacion===resultadoAsignacion.steps.length-1)pasoAsignacion=0;renderProcedure();refs.btnStepPlay.textContent='Pausar';timerAsignacion=setInterval(()=>{if(pasoAsignacion>=resultadoAsignacion.steps.length-1){detenerPasos();return;}pasoAsignacion++;renderProcedure();},Number(document.getElementById('stepSpeed').value));});
document.getElementById('stepSpeed').addEventListener('change',detenerPasos);
document.getElementById('btnExportAssignment').addEventListener('click',exportarAsignacion);
document.getElementById('btnPrintAssignment').addEventListener('click',()=>window.print());
document.getElementById('btnAyudaAsignacion').addEventListener('click',()=>document.getElementById('assignmentHelp').showModal());
document.getElementById('btnCerrarAyudaAsignacion').addEventListener('click',()=>document.getElementById('assignmentHelp').close());
window.addEventListener('pagehide',detenerPasos);
persistAssignmentState();
