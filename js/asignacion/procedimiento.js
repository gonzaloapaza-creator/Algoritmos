/* Procedimiento paso a paso del método húngaro: navegación anterior / siguiente / reiniciar
 * sobre los pasos reales devueltos por resolverHungaro(). */

'use strict';

const procAsig = {
  caja: document.getElementById('procedimientoAsignacion'),
  sin: document.getElementById('procedimientoSinResultado'),
  con: document.getElementById('procedimientoConResultado'),
  indicador: document.getElementById('procedimientoIndicador'),
  titulo: document.getElementById('procedimientoTitulo'),
  texto: document.getElementById('procedimientoTexto'),
  tabla: document.getElementById('procedimientoTabla'),
  lista: document.getElementById('procedimientoLista'),
  btnAnterior: document.getElementById('btnPasoAnterior'),
  btnSiguiente: document.getElementById('btnPasoSiguiente'),
  btnReiniciar: document.getElementById('btnPasoReiniciar'),
  verTodos: document.getElementById('procedimientoTodos'),
  mostrarTodos: false
};

function pasosAsignacion() {
  return resultadoVigenteAsignacion() ? estadoAsignacion.resultado.datos.pasos : [];
}

function irAPasoAsignacion(indice) {
  const pasos = pasosAsignacion();
  if (!pasos.length) return;
  estadoAsignacion.resultado.pasoActual = limitar(indice, 0, pasos.length - 1);
  dibujarProcedimientoAsignacion();
}

/** Tabla de un paso, con filas/columnas ficticias, líneas de cobertura y ceros marcados. */
function tablaPasoAsignacion(paso) {
  const m = estadoAsignacion.modelo;
  const n = paso.matriz.length;
  const columnas = paso.matriz[0].length;
  const filasCubiertas = new Set(paso.filasCubiertas || []);
  const columnasCubiertas = new Set(paso.columnasCubiertas || []);
  const ceros = paso.ceros || [];
  const destacadas = paso.destacadas || [];

  const tabla = document.createElement('table');
  tabla.className = 'tabla tabla-compacta tabla-paso';
  const thead = document.createElement('thead');
  const cab = document.createElement('tr');
  const esquina = document.createElement('th');
  esquina.className = 'fija';
  esquina.textContent = '';
  cab.appendChild(esquina);
  for (let j = 0; j < columnas; j++) {
    const th = document.createElement('th');
    th.scope = 'col';
    const real = j < paso.columnasReales;
    th.textContent = real ? (m.tareas[j] ? m.tareas[j].nombre : 'C' + (j + 1)) : 'Ficticia ' + (j - paso.columnasReales + 1);
    if (!real) th.classList.add('ficticio');
    if (columnasCubiertas.has(j)) th.classList.add('cubierta');
    cab.appendChild(th);
  }
  thead.appendChild(cab);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 0; i < n; i++) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.className = 'fija';
    const realFila = i < paso.filasReales;
    th.textContent = realFila ? (m.recursos[i] ? m.recursos[i].nombre : 'F' + (i + 1)) : 'Ficticio ' + (i - paso.filasReales + 1);
    if (!realFila) th.classList.add('ficticio');
    if (filasCubiertas.has(i)) th.classList.add('cubierta');
    tr.appendChild(th);
    for (let j = 0; j < columnas; j++) {
      const td = document.createElement('td');
      const v = paso.matriz[i][j];
      td.textContent = String(v);
      const realCol = j < paso.columnasReales;
      if (!realFila || !realCol) td.classList.add('ficticio');
      const fc = filasCubiertas.has(i), cc = columnasCubiertas.has(j);
      if (fc && cc) td.classList.add('cubierta-doble');
      else if (fc || cc) td.classList.add('cubierta');
      if (v === 0 && (paso.tipo !== 'original' && paso.tipo !== 'total' && paso.tipo !== 'conversion')) td.classList.add('cero');
      if (ceros.some(c => c.fila === i && c.col === j)) { td.classList.add('cero-independiente'); td.textContent = v + ' *'; }
      if (destacadas.some(c => c.fila === i && c.col === j)) td.classList.add('elegida');
      if (paso.tipo === 'cobertura' && !fc && !cc && v === paso.delta) td.classList.add('minimo-delta');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  tabla.appendChild(tbody);
  return tabla;
}

function leyendaPasoAsignacion(paso) {
  const partes = [];
  if (paso.filasReales < paso.matriz.length || paso.columnasReales < paso.matriz[0].length) {
    partes.push('<span class="leyenda__item"><span class="leyenda__muestra leyenda__muestra--caja leyenda__muestra--ficticio"></span>Fila o columna ficticia (costo 0)</span>');
  }
  if (paso.tipo === 'cobertura' || paso.tipo === 'ajuste') {
    partes.push('<span class="leyenda__item"><span class="leyenda__muestra leyenda__muestra--caja leyenda__muestra--cubierta"></span>Celda cubierta por una línea (doble tono: por dos)</span>');
  }
  if (paso.ceros && paso.ceros.length) partes.push('<span class="leyenda__item"><strong>*</strong> cero independiente (emparejamiento actual)</span>');
  if (paso.tipo === 'cobertura') partes.push('<span class="leyenda__item"><span class="leyenda__muestra leyenda__muestra--caja leyenda__muestra--cero"></span>δ = mínimo no cubierto</span>');
  if (paso.destacadas && paso.destacadas.length) partes.push('<span class="leyenda__item"><span class="leyenda__muestra leyenda__muestra--elegida"></span>Celda seleccionada</span>');
  return partes.join('');
}

function bloquePasoAsignacion(paso, indice, total) {
  const seccion = document.createElement('section');
  seccion.className = 'procedure-step';
  const h = document.createElement('h4');
  h.textContent = 'Paso ' + (indice + 1) + ' de ' + total + ': ' + paso.titulo;
  seccion.appendChild(h);
  const p = document.createElement('p');
  p.textContent = paso.texto;
  seccion.appendChild(p);
  const caja = document.createElement('div');
  caja.className = 'tabla-caja';
  caja.appendChild(tablaPasoAsignacion(paso));
  seccion.appendChild(caja);
  const leyenda = document.createElement('div');
  leyenda.className = 'leyenda';
  leyenda.innerHTML = leyendaPasoAsignacion(paso);
  if (leyenda.innerHTML) seccion.appendChild(leyenda);
  return seccion;
}

function dibujarProcedimientoAsignacion() {
  if (!procAsig.caja) return;
  const pasos = pasosAsignacion();
  procAsig.sin.hidden = pasos.length > 0;
  procAsig.con.hidden = pasos.length === 0;
  if (!pasos.length) {
    procAsig.sin.querySelector('p').textContent = estadoAsignacion.resultado
      ? 'Los datos cambiaron: el procedimiento corresponde a un resultado que ya no es válido. Vuelve a resolver.'
      : 'El procedimiento aparece después de resolver.';
    return;
  }

  const actual = estadoAsignacion.resultado.pasoActual || 0;
  procAsig.indicador.textContent = 'Paso ' + (actual + 1) + ' de ' + pasos.length;
  procAsig.btnAnterior.disabled = actual === 0;
  procAsig.btnSiguiente.disabled = actual === pasos.length - 1;

  procAsig.lista.replaceChildren();
  pasos.forEach((paso, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'procedimiento__salto' + (i === actual ? ' activo' : '');
    btn.textContent = (i + 1) + '. ' + paso.titulo;
    if (i === actual) btn.setAttribute('aria-current', 'step');
    btn.addEventListener('click', () => irAPasoAsignacion(i));
    li.appendChild(btn);
    procAsig.lista.appendChild(li);
  });

  procAsig.tabla.replaceChildren();
  if (procAsig.mostrarTodos) {
    procAsig.titulo.textContent = 'Todos los pasos';
    procAsig.texto.textContent = 'Secuencia completa de la ejecución del método húngaro sobre estos datos.';
    pasos.forEach((paso, i) => procAsig.tabla.appendChild(bloquePasoAsignacion(paso, i, pasos.length)));
  } else {
    const paso = pasos[actual];
    procAsig.titulo.textContent = paso.titulo;
    procAsig.texto.textContent = paso.texto;
    const caja = document.createElement('div');
    caja.className = 'tabla-caja';
    caja.appendChild(tablaPasoAsignacion(paso));
    procAsig.tabla.appendChild(caja);
    const leyenda = document.createElement('div');
    leyenda.className = 'leyenda';
    leyenda.innerHTML = leyendaPasoAsignacion(paso);
    if (leyenda.innerHTML) procAsig.tabla.appendChild(leyenda);
  }
  if (procAsig.verTodos) procAsig.verTodos.setAttribute('aria-pressed', procAsig.mostrarTodos ? 'true' : 'false');
}

function inicializarProcedimientoAsignacion() {
  if (!procAsig.caja) return;
  procAsig.btnAnterior.addEventListener('click', () => irAPasoAsignacion((estadoAsignacion.resultado.pasoActual || 0) - 1));
  procAsig.btnSiguiente.addEventListener('click', () => irAPasoAsignacion((estadoAsignacion.resultado.pasoActual || 0) + 1));
  procAsig.btnReiniciar.addEventListener('click', () => irAPasoAsignacion(0));
  if (procAsig.verTodos) procAsig.verTodos.addEventListener('click', () => { procAsig.mostrarTodos = !procAsig.mostrarTodos; dibujarProcedimientoAsignacion(); });
}
