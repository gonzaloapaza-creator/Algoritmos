/* Punto de entrada del módulo de esquina noroeste: vistas, botones y atajos. */

'use strict';

const appNw = {
  contador: document.getElementById('pasosContadorNw'),
  tablaDatos: document.getElementById('tablaDatosNorthwest'),
  resumenDatos: document.getElementById('resumenDatosNorthwest'),
  estadoBalance: document.getElementById('estadoBalanceNw'),
  balanceoTexto: document.getElementById('balanceoTexto'),
  tablaBalanceo: document.getElementById('tablaBalanceo'),
  balanceoSin: document.getElementById('balanceoSinDatos'),
  balanceoCon: document.getElementById('balanceoConDatos'),
  resolucionSin: document.getElementById('resolucionSin'),
  resolucionCon: document.getElementById('resolucionCon'),
  pasoIndicador: document.getElementById('nwPasoIndicador'),
  pasoDetalle: document.getElementById('nwPasoDetalle'),
  pasoTabla: document.getElementById('nwPasoTabla'),
  resultadoSin: document.getElementById('resultadoNwSin'),
  resultadoCon: document.getElementById('resultadoNwCon'),
  costoTotal: document.getElementById('nwCostoTotal'),
  tablaFinal: document.getElementById('nwTablaFinal'),
  envios: document.getElementById('nwEnvios'),
  verificacion: document.getElementById('nwVerificacion'),
  notas: document.getElementById('nwNotas'),
  autoplay: null
};

/* ---------------- Datos ---------------- */

function quitarElementoNorthwest(id) {
  const e = buscarElementoNorthwest(estadoNorthwest.modelo, id);
  if (!e) return;
  const lista = e.tipo === 'origen' ? estadoNorthwest.modelo.origenes : estadoNorthwest.modelo.destinos;
  if (lista.length <= MIN_NORTHWEST_DIMENSION) { notificar('Debe quedar al menos ' + (e.tipo === 'origen' ? 'un origen.' : 'un destino.'), 'error'); return; }
  dialogoConfirmar({
    titulo: 'Quitar ' + e.tipo,
    mensaje: '¿Quitar «' + e.elemento.nombre + '» y sus costos? Se puede deshacer con Ctrl+Z.',
    peligro: true,
    textoAceptar: 'Quitar'
  }).then(ok => {
    if (!ok) return;
    aplicarCambioNorthwest(m => eliminarElementoNorthwest(m, id), { motivo: 'quitar' });
    notificar((e.tipo === 'origen' ? 'Origen' : 'Destino') + ' eliminado.', 'ok');
  });
}

function agregarElementoNorthwest(tipo) {
  const m = estadoNorthwest.modelo;
  const lista = tipo === 'origen' ? m.origenes : m.destinos;
  if (lista.length >= MAX_NORTHWEST_DIMENSION) {
    notificar('Como máximo ' + MAX_NORTHWEST_DIMENSION + (tipo === 'origen' ? ' orígenes' : ' destinos') + ' reales en esta versión (el ficticio del balanceo no cuenta).', 'error');
    return;
  }
  aplicarCambioNorthwest(mod => { if (tipo === 'origen') agregarOrigen(mod); else agregarDestino(mod); }, { motivo: 'agregar' });
  notificar((tipo === 'origen' ? 'Origen' : 'Destino') + ' agregado: completa sus costos y su ' + (tipo === 'origen' ? 'oferta.' : 'demanda.'), 'ok');
}

function textoDiferencia(t) {
  if (t.diferencia === 0) return 'Diferencia: 0';
  return 'Diferencia: ' + (t.diferencia > 0 ? '+' : '') + t.diferencia + (t.diferencia > 0 ? ' (sobra oferta)' : ' (falta oferta)');
}

function estadoValidacionNorthwest() {
  const v = validarModeloNorthwest(estadoNorthwest.modelo);
  const invalidas = Object.keys(tablaNw.invalidas).length;
  const errores = v.errores.slice();
  if (invalidas) errores.unshift(invalidas === 1 ? 'Hay 1 casilla con texto no válido (en rojo): corrígela o vacíala.' : 'Hay ' + invalidas + ' casillas con texto no válido (en rojo): corrígelas o vacíalas.');
  return { ok: errores.length === 0, errores, totales: v.totales };
}

function dibujarResumenDatosNorthwest() {
  if (!appNw.resumenDatos) return;
  const v = estadoValidacionNorthwest();
  const t = v.totales;
  appNw.resumenDatos.replaceChildren();
  const resumen = document.createElement('p');
  resumen.className = 'resumen-datos';
  resumen.innerHTML = '<strong>' + estadoNorthwest.modelo.origenes.length + ' orígenes · ' + estadoNorthwest.modelo.destinos.length + ' destinos</strong>' +
    '<span>Oferta total: <strong>' + t.ofertaTotal + '</strong></span><span>Demanda total: <strong>' + t.demandaTotal + '</strong></span><span>' + textoDiferencia(t) + '</span>';
  appNw.resumenDatos.appendChild(resumen);

  const chip = appNw.estadoBalance;
  if (!v.ok) { chip.className = 'estado estado--error'; chip.textContent = 'Datos incompletos'; }
  else if (t.diferencia === 0) { chip.className = 'estado estado--ok'; chip.textContent = 'Balanceado'; }
  else { chip.className = 'estado estado--aviso'; chip.textContent = 'Requiere balanceo'; }

  if (v.errores.length) {
    const msg = document.createElement('div');
    msg.className = 'mensaje mensaje--error';
    msg.setAttribute('role', 'alert');
    msg.innerHTML = '<div><strong>Completa los datos para continuar</strong><ul></ul></div>';
    v.errores.forEach(e => { const li = document.createElement('li'); li.textContent = e; msg.querySelector('ul').appendChild(li); });
    appNw.resumenDatos.appendChild(msg);
  } else {
    const msg = document.createElement('div');
    msg.className = 'mensaje mensaje--ok';
    msg.textContent = t.diferencia === 0 ? 'Datos completos. El problema ya está balanceado.' : 'Datos completos. En el siguiente paso se propone el balanceo.';
    appNw.resumenDatos.appendChild(msg);
  }
  document.querySelectorAll('[data-ir="balanceo"]').forEach(b => { b.disabled = !v.ok; });
}

function dibujarDatosNorthwest() {
  appNw.tablaDatos.replaceChildren(construirTablaDatosNorthwest());
  dibujarResumenDatosNorthwest();
}

/* ---------------- Balanceo ---------------- */

function dibujarBalanceoNorthwest() {
  const v = estadoValidacionNorthwest();
  appNw.balanceoSin.hidden = v.ok;
  appNw.balanceoCon.hidden = !v.ok;
  if (!v.ok) { appNw.balanceoSin.querySelector('p').textContent = v.errores[0]; return; }
  // La vista previa se deriva siempre del modelo actual: nunca acumula ficticios.
  const balance = balancearNorthwest(estadoNorthwest.modelo);
  appNw.balanceoTexto.replaceChildren();
  const p = document.createElement('div');
  p.className = 'mensaje ' + (balance.ficticio ? 'mensaje--aviso' : 'mensaje--ok');
  p.textContent = explicarBalanceo(balance);
  appNw.balanceoTexto.appendChild(p);
  if (balance.trivial) {
    const t = document.createElement('div');
    t.className = 'mensaje mensaje--info';
    t.textContent = 'Caso trivial: todas las ofertas y demandas son cero. La solución inicial es no enviar nada, con costo total 0.';
    appNw.balanceoTexto.appendChild(t);
  }
  appNw.tablaBalanceo.replaceChildren(construirTablaBalanceadaNorthwest(balance));
  const btn = document.getElementById('btnConfirmarBalanceo');
  btn.textContent = balance.ficticio ? 'Confirmar balanceo y resolver' : 'Continuar y resolver';
}

function confirmarBalanceoNorthwest() {
  try {
    resolverNorthwestCompleto();
    detenerAutoplayNw();
    cambiarVistaNorthwest('resolucion');
    notificar('Solución inicial calculada. Recorre los pasos.', 'ok');
  } catch (e) {
    notificar(e.message, 'error');
  }
}

/* ---------------- Resolución paso a paso ---------------- */

function pasosNw() { return resultadoVigenteNorthwest() ? estadoNorthwest.resultado.datos.pasos : []; }

function irAPasoNw(indice) {
  const pasos = pasosNw();
  if (!pasos.length) return;
  estadoNorthwest.resultado.pasoActual = limitar(indice, 0, pasos.length - 1);
  dibujarResolucionNorthwest();
}

function detenerAutoplayNw() {
  if (appNw.autoplay) { clearInterval(appNw.autoplay); appNw.autoplay = null; }
  const b = document.getElementById('btnNwAuto');
  if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Reproducir'; }
}

function alternarAutoplayNw() {
  if (appNw.autoplay) { detenerAutoplayNw(); return; }
  const b = document.getElementById('btnNwAuto');
  b.setAttribute('aria-pressed', 'true');
  b.textContent = 'Pausar';
  appNw.autoplay = setInterval(() => {
    const pasos = pasosNw();
    const actual = estadoNorthwest.resultado ? estadoNorthwest.resultado.pasoActual : 0;
    if (!pasos.length || actual >= pasos.length - 1) { detenerAutoplayNw(); return; }
    irAPasoNw(actual + 1);
  }, 1600);
}

function nombreCeldaNw(balance, fila, col) {
  return balance.origenes[fila].nombre + ' → ' + balance.destinos[col].nombre;
}

function dibujarResolucionNorthwest() {
  const pasos = pasosNw();
  appNw.resolucionSin.hidden = pasos.length > 0;
  appNw.resolucionCon.hidden = pasos.length === 0;
  if (!pasos.length) {
    appNw.resolucionSin.querySelector('p').textContent = estadoNorthwest.resultado
      ? 'Los datos cambiaron: la resolución anterior ya no es válida. Vuelve al balanceo para recalcular.'
      : 'La resolución aparece después de confirmar el balanceo.';
    return;
  }
  const r = estadoNorthwest.resultado;
  const balance = r.balance;
  const actual = r.pasoActual || 0;
  const paso = pasos[actual];
  appNw.pasoIndicador.textContent = 'Paso ' + (actual + 1) + ' de ' + pasos.length;
  document.getElementById('btnNwAnterior').disabled = actual === 0;
  document.getElementById('btnNwSiguiente').disabled = actual === pasos.length - 1;

  const filas = [
    ['Celda actual', nombreCeldaNw(balance, paso.fila, paso.col) + ' (fila ' + (paso.fila + 1) + ', columna ' + (paso.col + 1) + ')'],
    ['Costo unitario', formatearCostoNorthwest(paso.costoUnitario) + ' (no interviene en la elección de la celda)'],
    ['Antes de asignar', 'oferta restante ' + paso.ofertaAntes + ' · demanda restante ' + paso.demandaAntes],
    ['Operación', paso.operacion],
    ['Cantidad asignada', paso.basicaCero ? '0 básico (variable básica con cantidad cero)' : String(paso.cantidad)],
    ['Después de asignar', 'oferta restante ' + paso.ofertaDespues + ' · demanda restante ' + paso.demandaDespues],
    ['Se satisface', paso.satisfecho === 'ambos' ? 'la fila y la columna a la vez' + (paso.simultaneo ? ' (agotamiento simultáneo: degeneración)' : '') : (paso.satisfecho === 'fila' ? 'la fila (oferta agotada)' : 'la columna (demanda cubierta)')],
    ['Próximo movimiento', paso.movimiento === 'abajo' ? 'bajar una fila' : (paso.movimiento === 'derecha' ? 'avanzar una columna' : 'fin: última celda del recorrido')]
  ];
  appNw.pasoDetalle.replaceChildren();
  const dl = document.createElement('dl');
  dl.className = 'nw-detalle';
  filas.forEach(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.appendChild(dt); dl.appendChild(dd);
  });
  appNw.pasoDetalle.appendChild(dl);
  if (paso.simultaneo) {
    const nota = document.createElement('div');
    nota.className = 'mensaje mensaje--aviso';
    nota.textContent = 'Degeneración: la oferta y la demanda se agotaron a la vez. Se tacha una sola línea y la siguiente celda del recorrido recibe un «0 básico» para conservar m + n − 1 variables básicas sin formar ciclos. No se usa ningún decimal pequeño que altere las cantidades.';
    appNw.pasoDetalle.appendChild(nota);
  }

  const basicasHastaAhora = r.datos.basicas.slice(0, actual + 1);
  const satisfechasFilas = paso.restanteOferta.map(v => v === 0);
  const satisfechasColumnas = paso.restanteDemanda.map(v => v === 0);
  appNw.pasoTabla.replaceChildren(construirTablaBalanceadaNorthwest(balance, {
    asignaciones: paso.asignaciones,
    basicas: basicasHastaAhora,
    celdaActual: { fila: paso.fila, col: paso.col },
    restanteOferta: paso.restanteOferta,
    restanteDemanda: paso.restanteDemanda,
    satisfechasFilas,
    satisfechasColumnas
  }));
}

/* ---------------- Resultado ---------------- */

function dibujarResultadoNorthwest() {
  const vigente = resultadoVigenteNorthwest();
  appNw.resultadoSin.hidden = vigente;
  appNw.resultadoCon.hidden = !vigente;
  if (!vigente) {
    appNw.resultadoSin.querySelector('p').textContent = estadoNorthwest.resultado
      ? 'Los datos cambiaron después de resolver: el resultado ya no es válido. Vuelve al balanceo para recalcular.'
      : 'El resultado aparece después de confirmar el balanceo y resolver.';
    return;
  }
  const r = estadoNorthwest.resultado;
  const b = r.balance, d = r.datos;

  appNw.costoTotal.replaceChildren();
  const et = document.createElement('span');
  et.textContent = 'Costo total de la solución inicial';
  const val = document.createElement('span');
  val.className = 'total__valor';
  val.textContent = formatearTotalNorthwest(d.costoTotal);
  appNw.costoTotal.appendChild(et);
  appNw.costoTotal.appendChild(val);

  appNw.tablaFinal.replaceChildren(construirTablaBalanceadaNorthwest(b, { asignaciones: d.asignaciones, basicas: d.basicas }));

  appNw.envios.replaceChildren();
  d.envios.forEach(e => {
    const li = document.createElement('li');
    const ficticio = b.origenes[e.fila].ficticio || b.destinos[e.col].ficticio;
    li.innerHTML = '<span></span><span class="valor"></span>';
    li.firstChild.textContent = nombreCeldaNw(b, e.fila, e.col) + (ficticio ? ' (ficticio)' : '');
    li.lastChild.textContent = e.cantidad + ' × ' + formatearCostoNorthwest(e.costoUnitario) + ' = ' + formatearCostoNorthwest(e.parcial);
    if (ficticio) li.classList.add('ficticio');
    appNw.envios.appendChild(li);
  });
  if (!d.envios.length) { const li = document.createElement('li'); li.textContent = 'No hay envíos con cantidad mayor que cero.'; appNw.envios.appendChild(li); }

  appNw.verificacion.replaceChildren();
  const v = d.verificacion;
  [
    ['Cantidades no negativas', v.noNegativas],
    ['Suma de cada fila = oferta balanceada', v.filasOk],
    ['Suma de cada columna = demanda balanceada', v.columnasOk],
    ['Costo total = Σ cantidad × costo unitario', v.costoOk],
    ['Base con m + n − 1 = ' + (d.m + d.n - 1) + ' variables básicas', v.cantidadBaseOk],
    ['Base sin ciclos', v.sinCiclos]
  ].forEach(([texto, ok]) => {
    const li = document.createElement('li');
    li.className = ok ? 'ok' : 'error';
    li.textContent = (ok ? '✓ ' : '✗ ') + texto;
    appNw.verificacion.appendChild(li);
  });

  appNw.notas.replaceChildren();
  const nota = (clase, texto) => { const p = document.createElement('div'); p.className = 'mensaje ' + clase; p.textContent = texto; appNw.notas.appendChild(p); };
  nota('mensaje--aviso mensaje--permanente', 'Esta es una solución inicial factible obtenida por la esquina noroeste. No es necesariamente la de menor costo: los costos no intervinieron en la elección de las celdas.');
  if (b.ficticio) {
    const idx = b.ficticio.indice;
    const absorbido = b.ficticio.tipo === 'destino' ? d.asignaciones.reduce((s, f) => s + f[idx], 0) : d.asignaciones[idx].reduce((s, x) => s + x, 0);
    nota('mensaje--info', (b.ficticio.tipo === 'destino'
      ? 'El destino ficticio absorbe ' + absorbido + ' unidades de oferta sobrante (no se envían a ningún destino real).'
      : 'El origen ficticio aporta ' + absorbido + ' unidades: demanda que queda sin cubrir por oferta real.') +
      ' El costo ficticio 0 es una convención del modelo, no evidencia de que el faltante o sobrante carezca de consecuencias económicas.');
  }
  if (d.degenerado) nota('mensaje--info', 'Solución degenerada: ' + d.positivas + ' asignaciones positivas y ' + d.basicasCero + ' «0 básico» completan las ' + (d.m + d.n - 1) + ' variables básicas.');
  else nota('mensaje--info', 'Solución no degenerada: las ' + d.positivas + ' asignaciones positivas forman la base de m + n − 1 variables.');
}

/* ---------------- Render general ---------------- */

function dibujarPasosNw() {
  const indice = VISTAS_NORTHWEST.indexOf(estadoNorthwest.vista);
  document.querySelectorAll('#pasosNorthwest .paso').forEach(btn => {
    const i = VISTAS_NORTHWEST.indexOf(btn.dataset.vista);
    btn.classList.toggle('completo', i < indice);
    if (i === indice) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
  });
  appNw.contador.textContent = 'Paso ' + (indice + 1) + ' de ' + VISTAS_NORTHWEST.length;
  document.querySelectorAll('.vista').forEach(s => { s.hidden = s.dataset.vista !== estadoNorthwest.vista; });
}

function renderNorthwest(motivo) {
  dibujarPasosNw();
  document.getElementById('btnDeshacerNw').disabled = !puedeDeshacerNorthwest();
  document.getElementById('btnRehacerNw').disabled = !puedeRehacerNorthwest();
  const chip = document.getElementById('estadoResultadoNw');
  if (!estadoNorthwest.resultado) { chip.className = 'estado estado--neutro'; chip.textContent = 'Sin resolver'; }
  else if (resultadoVigenteNorthwest()) { chip.className = 'estado estado--ok'; chip.textContent = 'Solución inicial vigente'; }
  else { chip.className = 'estado estado--aviso'; chip.textContent = 'Datos modificados: recalcular'; }
  if (motivo !== 'vista' && motivo !== 'resultado') detenerAutoplayNw();

  const vista = estadoNorthwest.vista;
  if (vista === 'datos') dibujarDatosNorthwest();
  if (vista === 'balanceo') dibujarBalanceoNorthwest();
  if (vista === 'resolucion') dibujarResolucionNorthwest();
  if (vista === 'resultado') dibujarResultadoNorthwest();
  if (vista !== 'datos') {
    const ok = estadoValidacionNorthwest().ok;
    document.querySelectorAll('[data-ir="balanceo"]').forEach(b => { b.disabled = !ok; });
  }
}

/* ---------------- Otras acciones ---------------- */

function cargarEjemploNorthwest(id) {
  const aplicar = () => {
    aplicarCambioNorthwest((m, e) => { e.modelo = ejemploNorthwest(id); }, { motivo: 'ejemplo' });
    tablaNw.invalidas = {};
    cambiarVistaNorthwest('datos');
    notificar('Ejemplo cargado.', 'ok');
  };
  dialogoConfirmar({ titulo: 'Cargar ejemplo', mensaje: 'Se reemplazarán los datos actuales. Podrás deshacerlo con Ctrl+Z.' }).then(ok => { if (ok) aplicar(); });
}

function limpiarNorthwest() {
  dialogoConfirmar({
    titulo: 'Limpiar datos',
    mensaje: 'Se vaciarán costos, ofertas y demandas dejando 1 origen y 1 destino. Se puede deshacer con Ctrl+Z.',
    peligro: true,
    textoAceptar: 'Limpiar'
  }).then(ok => {
    if (!ok) return;
    aplicarCambioNorthwest((m, e) => { e.modelo = crearModeloNorthwest(); agregarOrigen(e.modelo); agregarDestino(e.modelo); }, { motivo: 'limpiar' });
    tablaNw.invalidas = {};
    cambiarVistaNorthwest('datos');
    notificar('Datos eliminados.', 'ok');
  });
}

function exportarNorthwestJSON() {
  const datos = { version: 1, tipo: 'northwest', fecha: new Date().toISOString(), modelo: estadoNorthwest.modelo, nota: 'Los costos están escalados × ' + ESCALA_COSTO_NORTHWEST };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transporte_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  notificar('Datos exportados a JSON.', 'ok');
}

function importarNorthwestJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = evento => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = e => {
      try {
        const datos = JSON.parse(e.target.result);
        const modelo = depurarModeloNorthwest(datos && datos.modelo ? datos.modelo : datos);
        if (!modelo || (!modelo.origenes.length && !modelo.destinos.length)) throw new Error('El archivo no contiene un problema de transporte válido.');
        dialogoConfirmar({ titulo: 'Importar', mensaje: 'Se reemplazarán los datos actuales. Podrás deshacerlo con Ctrl+Z.' }).then(ok => {
          if (!ok) return;
          aplicarCambioNorthwest((m, est) => { est.modelo = modelo; }, { motivo: 'importar' });
          tablaNw.invalidas = {};
          cambiarVistaNorthwest('datos');
          notificar('Datos importados correctamente.', 'ok');
        });
      } catch (error) { notificar('Error al importar: ' + error.message, 'error'); }
    };
    lector.readAsText(archivo);
  };
  input.click();
}

const TEXTO_AYUDA_NORTHWEST =
  'VIDEO\n' +
  '· El botón «Video» de la cabecera abre la presentación con el video explicativo del método.\n\n' +
  'QUÉ HACE\n' +
  '· El método de la esquina noroeste obtiene una solución inicial factible del problema de transporte. No garantiza el costo mínimo: los costos no intervienen en la elección de las celdas.\n\n' +
  '1) DATOS\n' +
  '· Costos unitarios en el centro (0 a ' + MAX_COSTO_NORTHWEST + ', hasta 2 decimales, coma o punto). Oferta en la última columna y demanda en la última fila (enteros de 0 a ' + MAX_CANTIDAD_NORTHWEST + ').\n' +
  '· De ' + MIN_NORTHWEST_DIMENSION + ' a ' + MAX_NORTHWEST_DIMENSION + ' orígenes y destinos reales. Nombres de 1 a ' + MAX_LARGO_ETIQUETA_NORTHWEST + ' caracteres.\n' +
  '· Una casilla vacía es un dato pendiente, no un cero. Todas las celdas necesitan un costo: esta versión no admite rutas prohibidas.\n' +
  '· Esta versión usa cantidades enteras por decisión de la aplicación; el método no está limitado a enteros.\n\n' +
  '2) BALANCEO\n' +
  '· Si la oferta total supera la demanda, se agrega un destino ficticio con costo 0 que absorbe el sobrante. Si la demanda supera la oferta, un origen ficticio con costo 0 representa la demanda no cubierta.\n' +
  '· El ficticio se muestra como vista previa y se confirma antes de resolver; nunca se guarda en tus datos.\n\n' +
  '3) RESOLUCIÓN PASO A PASO\n' +
  '· Se empieza en la esquina superior izquierda, se asigna min(oferta restante, demanda restante) y se avanza hacia abajo (oferta agotada) o a la derecha (demanda cubierta).\n' +
  '· Si ambas se agotan a la vez, la siguiente celda recibe un «0 básico» para conservar m + n − 1 variables básicas (degeneración).\n\n' +
  '4) RESULTADO\n' +
  '· Matriz final de cantidades, lista de envíos, costo total = Σ cantidad × costo unitario y verificación de sumas y de la base.\n\n' +
  'GUARDADO Y ATAJOS\n' +
  '· Todo se guarda en este navegador. Exportar/Importar JSON (panel «Ejemplos»). Ctrl+Z / Ctrl+Y deshacen y rehacen; en la resolución, ← y → cambian de paso.';

/* ---------------- Inicio ---------------- */

function inicializarNorthwest() {
  cargarNorthwest();
  alCambiarNorthwest(renderNorthwest);

  document.querySelectorAll('#pasosNorthwest .paso').forEach(b => b.addEventListener('click', () => cambiarVistaNorthwest(b.dataset.vista)));
  document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => cambiarVistaNorthwest(b.dataset.ir)));
  document.getElementById('btnConfirmarBalanceo').addEventListener('click', confirmarBalanceoNorthwest);
  document.getElementById('btnAgregarOrigen').addEventListener('click', () => agregarElementoNorthwest('origen'));
  document.getElementById('btnAgregarDestino').addEventListener('click', () => agregarElementoNorthwest('destino'));
  document.getElementById('btnDeshacerNw').addEventListener('click', () => { if (!deshacerNorthwest()) notificar('No hay acciones para deshacer.', 'info'); });
  document.getElementById('btnRehacerNw').addEventListener('click', () => { if (!rehacerNorthwest()) notificar('No hay acciones para rehacer.', 'info'); });
  document.getElementById('btnLimpiarNw').addEventListener('click', limpiarNorthwest);
  document.getElementById('btnExportarNw').addEventListener('click', exportarNorthwestJSON);
  document.getElementById('btnImportarNw').addEventListener('click', importarNorthwestJSON);
  document.getElementById('btnAyudaNw').addEventListener('click', () => dialogoInformar({ titulo: 'Cómo usar Esquina noroeste', mensaje: TEXTO_AYUDA_NORTHWEST, ancho: true }));
  document.getElementById('btnNwAnterior').addEventListener('click', () => { detenerAutoplayNw(); irAPasoNw(estadoNorthwest.resultado.pasoActual - 1); });
  document.getElementById('btnNwSiguiente').addEventListener('click', () => { detenerAutoplayNw(); irAPasoNw(estadoNorthwest.resultado.pasoActual + 1); });
  document.getElementById('btnNwReiniciar').addEventListener('click', () => { detenerAutoplayNw(); irAPasoNw(0); });
  document.getElementById('btnNwAuto').addEventListener('click', alternarAutoplayNw);

  const selector = document.getElementById('selectorEjemploNw');
  EJEMPLOS_NORTHWEST.forEach(e => { const op = document.createElement('option'); op.value = e.id; op.textContent = e.nombre; selector.appendChild(op); });
  document.getElementById('btnEjemploNw').addEventListener('click', () => cargarEjemploNorthwest(selector.value));

  document.addEventListener('keydown', evento => {
    if (dialogoAbierto()) return;
    if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'SELECT' || evento.target.tagName === 'TEXTAREA') return;
    const ctrl = evento.ctrlKey || evento.metaKey;
    if (ctrl && evento.key.toLowerCase() === 'z' && !evento.shiftKey) { evento.preventDefault(); deshacerNorthwest(); }
    if ((ctrl && evento.key.toLowerCase() === 'y') || (ctrl && evento.shiftKey && evento.key.toLowerCase() === 'z')) { evento.preventDefault(); rehacerNorthwest(); }
    if (estadoNorthwest.vista === 'resolucion' && resultadoVigenteNorthwest()) {
      if (evento.key === 'ArrowRight') { detenerAutoplayNw(); irAPasoNw(estadoNorthwest.resultado.pasoActual + 1); }
      if (evento.key === 'ArrowLeft') { detenerAutoplayNw(); irAPasoNw(estadoNorthwest.resultado.pasoActual - 1); }
    }
  });

  renderNorthwest('inicio');
}

inicializarNorthwest();
