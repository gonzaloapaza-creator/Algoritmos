// js/ordenamiento/app.js
'use strict';

const E = estadoOrdenamiento;
const $ = id => document.getElementById(id);

const botonesAlgoritmo = Array.from(document.querySelectorAll('[data-algoritmo]'));
const selectorVelocidad = $('selectorVelocidad');
const selectorCantidad = $('selectorCantidad');
const entradaValores = $('entradaValores');
const errorEntrada = $('errorEntrada');
const btnAplicar = $('btnAplicar');
const btnGenerar = $('btnGenerar');
const btnCasiOrdenado = $('btnCasiOrdenado');
const btnInvertido = $('btnInvertido');

const btnReiniciar = $('btnReiniciar');
const btnAnterior = $('btnAnterior');
const btnAuto = $('btnAuto');
const btnSiguiente = $('btnSiguiente');

const contadorGrande = $('contadorGrande');
const contadorNumero = $('contadorNumero');
const contadorTotal = $('contadorTotal');
const chipTipo = $('chipTipo');
const badgePasos = $('badgePasos');
const statPasada = $('statPasada');
const statPasadas = $('statPasadas');
const mapaPasos = $('mapaPasos');
const deslizadorPasos = $('deslizadorPasos');
const textoEstado = $('textoEstado');
const statComparaciones = $('statComparaciones');
const statIntercambios = $('statIntercambios');
const statOrdenados = $('statOrdenados');
const statTotalPasos = $('statTotalPasos');

const pseudocodigo = $('pseudocodigo');
const tituloAlgoritmo = $('tituloAlgoritmo');
const ideaAlgoritmo = $('ideaAlgoritmo');
const estadoComplejidad = $('estadoComplejidad');
const infoComplejidad = $('infoComplejidad');
const infoEstable = $('infoEstable');
const infoPeorCaso = $('infoPeorCaso');
const panelShell = $('panelShell');
const panelMerge = $('panelMerge');
const sinAuxiliar = $('sinAuxiliar');
const saltoShell = $('saltoShell');
const grupoShell = $('grupoShell');
const segmentoMerge = $('segmentoMerge');
const izquierdoMerge = $('izquierdoMerge');
const derechoMerge = $('derechoMerge');
const auxiliarMerge = $('auxiliarMerge');

const btnAyuda = $('btnAyuda');
const modalAyuda = $('modalAyuda');
const btnCerrarAyuda = $('btnCerrarAyuda');

const NOMBRES_TIPO = {
  inicio: 'Inicio', seleccion: 'Nueva pasada', comparar: 'Comparación', minimo: 'Nuevo mínimo',
  mover: 'Movimiento', fijar: 'En su lugar', fin: 'Ordenado'
};

// ---- Datos ----
function fijarValores(valores) {
  E.valores = valores.slice();
  entradaValores.value = valores.join(', ');
  errorEntrada.textContent = '';
  ejecutarAlgoritmo();
}

function valoresCasiOrdenados(cantidad) {
  const v = generarValoresOrdenamiento(cantidad).sort((a, b) => a - b);
  const i = Math.floor(Math.random() * (cantidad - 1));
  [v[i], v[i + 1]] = [v[i + 1], v[i]];
  return v;
}

function ejecutarAlgoritmo() {
  pausarReproduccion();
  E.historial = ejecutarOrdenamiento(E.algoritmo, E.valores);
  E.pasoActual = 0;
  construirMapaPasos();
  construirPseudocodigo();
  deslizadorPasos.max = E.historial.length - 1;
  actualizarInterfaz({ sinAnimar: true });
}

// ---- Paneles estáticos por ejecución ----
function construirMapaPasos() {
  mapaPasos.innerHTML = '';
  E.historial.forEach((paso, i) => {
    const s = document.createElement('span');
    s.dataset.tipo = paso.tipo;
    s.dataset.indice = i;
    s.title = `Paso ${i}: ${NOMBRES_TIPO[paso.tipo] || paso.tipo}`;
    mapaPasos.appendChild(s);
  });
}

function construirPseudocodigo() {
  const info = INFO_ALGORITMOS_ORDENAMIENTO[E.algoritmo];
  const n = E.valores.length;
  pseudocodigo.innerHTML = '';
  PSEUDOCODIGO_ORDENAMIENTO[E.algoritmo].forEach(linea => {
    const li = document.createElement('li');
    li.textContent = linea;
    pseudocodigo.appendChild(li);
  });
  tituloAlgoritmo.textContent = info.nombre;
  ideaAlgoritmo.textContent = info.idea;
  estadoComplejidad.textContent = info.complejidad.split(' ·')[0];
  infoComplejidad.textContent = info.complejidad;
  infoEstable.textContent = info.estable ? 'Sí: conserva el orden de los iguales' : 'No';
  if (E.algoritmo === 'merge') {
    infoPeorCaso.textContent = `O(n log n); a lo sumo aproximadamente ${n * Math.ceil(Math.log2(Math.max(n, 2)))} comparaciones para n = ${n}`;
    statPasadas.textContent = '—';
  } else if (E.algoritmo === 'shell') {
    infoPeorCaso.textContent = `La secuencia de saltos afecta el costo; esta versión usa ${Array.from({ length: Math.floor(n / 2) }, (_, i) => Math.floor(n / 2 / Math.pow(2, i))).filter(Boolean).join(' → ') || 'sin pasadas'} y puede llegar a O(n²).`;
    let saltos = 0;
    for (let salto = Math.floor(n / 2); salto > 0; salto = Math.floor(salto / 2)) saltos++;
    statPasadas.textContent = String(saltos);
  } else {
    infoPeorCaso.textContent = `n(n − 1)/2 = ${n * (n - 1) / 2} con n = ${n}`;
    statPasadas.textContent = Math.max(0, n - 1);
  }
}

function renderPinosAuxiliares(contenedor, pinos, inicio) {
  contenedor.replaceChildren();
  (pinos || []).forEach((pino, indice) => {
    const caja = document.createElement('span');
    caja.className = 'auxiliar-pino' + (pino ? '' : ' auxiliar-pino--vacio');
    caja.textContent = pino ? String(pino.valor) : '·';
    caja.title = pino ? `Pino ${pino.id}: valor ${pino.valor}` : 'Sin copiar todavía';
    caja.setAttribute('aria-label', pino ? `Pino ${pino.valor}, identificador ${pino.id}` : 'Espacio vacío');
    const posicion = document.createElement('small');
    posicion.textContent = String((inicio || 0) + indice);
    caja.appendChild(posicion);
    contenedor.appendChild(caja);
  });
}

function actualizarAuxiliar(paso) {
  const shell = E.algoritmo === 'shell';
  const merge = E.algoritmo === 'merge';
  panelShell.hidden = !shell;
  panelMerge.hidden = !merge;
  sinAuxiliar.hidden = shell || merge;
  if (shell) {
    saltoShell.textContent = paso.salto || '—';
    renderPinosAuxiliares(grupoShell, (paso.grupo || []).map(i => paso.arreglo[i]), paso.grupo && paso.grupo[0]);
    Array.from(grupoShell.children).forEach((el, i) => {
      el.classList.toggle('auxiliar-pino--activo', (paso.grupo || [])[i] === (paso.comparando || [])[0] || (paso.grupo || [])[i] === (paso.comparando || [])[1]);
    });
  }
  if (merge) {
    segmentoMerge.textContent = paso.segmento ? `[${paso.segmento[0]}, ${paso.segmento[1]}]` : 'Dividiendo el arreglo';
    renderPinosAuxiliares(izquierdoMerge, paso.izquierdo || []);
    renderPinosAuxiliares(derechoMerge, paso.derecho || []);
    renderPinosAuxiliares(auxiliarMerge, paso.auxiliar || []);
    (paso.comparando || []).forEach(indice => {
      const posicion = paso.segmento ? indice - paso.segmento[0] : -1;
      if (posicion >= 0) {
        const el = auxiliarMerge.children[posicion];
        if (el) el.classList.add('auxiliar-pino--activo');
      }
    });
  }
}

// ---- Actualización por paso ----
function animarTic(el) {
  el.classList.remove('tic');
  void el.offsetWidth;
  el.classList.add('tic');
}

function actualizarInterfaz(opciones) {
  if (!E.historial.length) return;
  const paso = E.historial[E.pasoActual];
  const total = E.historial.length - 1;
  const n = paso.arreglo.length;

  dibujarPinos(paso, opciones);
  actualizarAuxiliar(paso);
  const pista = $('pistaBowling');
  pista.classList.toggle('celebrar', paso.tipo === 'fin');
  if (paso.tipo === 'fin') pista.querySelectorAll('.pino-caja').forEach((c, i) => c.style.setProperty('--orden', i));

  // Contador grande con anillo de progreso
  const porcentaje = total === 0 ? 100 : (E.pasoActual / total) * 100;
  contadorGrande.style.setProperty('--progreso', porcentaje.toFixed(1));
  if (contadorNumero.textContent !== String(E.pasoActual)) animarTic(contadorNumero);
  contadorNumero.textContent = E.pasoActual;
  contadorTotal.textContent = `de ${total}`;
  badgePasos.textContent = `${E.pasoActual} de ${total}`;
  chipTipo.dataset.tipo = paso.tipo;
  chipTipo.textContent = NOMBRES_TIPO[paso.tipo] || paso.tipo;
  statPasada.textContent = paso.salto ? `${paso.pasada || 0} · salto ${paso.salto}` : paso.pasada || 0;

  // Mapa de pasos y deslizador
  Array.from(mapaPasos.children).forEach((s, i) => {
    s.classList.toggle('hecho', i <= E.pasoActual);
    s.classList.toggle('actual', i === E.pasoActual);
  });
  deslizadorPasos.value = E.pasoActual;

  // Consola y estadísticas
  if (textoEstado.textContent !== paso.mensaje) animarTic(textoEstado);
  textoEstado.textContent = paso.mensaje;
  const stats = [[statComparaciones, paso.comparaciones], [statIntercambios, paso.intercambios], [statOrdenados, paso.ordenados.length]];
  stats.forEach(([el, v]) => { if (el.textContent !== String(v)) { el.textContent = v; animarTic(el); } });
  statTotalPasos.textContent = total;

  // Pseudocódigo
  Array.from(pseudocodigo.children).forEach((li, i) => li.classList.toggle('activa', i === paso.linea));

  // Botones
  btnAnterior.disabled = btnReiniciar.disabled = E.pasoActual === 0;
  btnSiguiente.disabled = E.pasoActual === total;
  if (E.pasoActual === total && E.reproduciendo) pausarReproduccion();
  if (n === 0) btnAuto.disabled = true;

  guardarEstadoOrdenamiento(selectorVelocidad.value);
}

/** Aplica un estado ya validado por depurarEstadoOrdenamiento (autoguardado o trabajo nombrado). */
function aplicarEstadoOrdenamiento(limpio) {
  pausarReproduccion();
  E.algoritmo = limpio.algoritmo;
  E.cantidad = limpio.valores.length;
  selectorVelocidad.value = limpio.velocidad;
  selectorCantidad.value = String(E.cantidad);
  botonesAlgoritmo.forEach(b => b.setAttribute('aria-pressed', b.dataset.algoritmo === E.algoritmo ? 'true' : 'false'));
  fijarValores(limpio.valores);
  irAPaso(limpio.pasoActual, { sinAnimar: true });
}

// ---- Navegación entre pasos ----
function irAPaso(i, opciones) {
  const total = E.historial.length - 1;
  E.pasoActual = Math.max(0, Math.min(total, i));
  actualizarInterfaz(opciones);
}
function pasoSiguiente() { if (E.pasoActual < E.historial.length - 1) irAPaso(E.pasoActual + 1); }
function pasoAnterior() { if (E.pasoActual > 0) irAPaso(E.pasoActual - 1); }

function alternarReproduccion() {
  if (E.reproduciendo) { pausarReproduccion(); return; }
  if (E.pasoActual === E.historial.length - 1) irAPaso(0, { sinAnimar: true });
  E.reproduciendo = true;
  btnAuto.textContent = '❚❚ Pausar';
  btnAuto.classList.replace('btn-neutral', 'btn-secondary');
  btnAuto.setAttribute('aria-pressed', 'true');
  E.intervalo = setInterval(pasoSiguiente, parseInt(selectorVelocidad.value, 10));
}

function pausarReproduccion() {
  E.reproduciendo = false;
  clearInterval(E.intervalo);
  E.intervalo = null;
  btnAuto.textContent = '▶ Reproducir';
  btnAuto.classList.replace('btn-secondary', 'btn-neutral');
  btnAuto.setAttribute('aria-pressed', 'false');
}

// ---- Eventos ----
btnSiguiente.addEventListener('click', () => { pausarReproduccion(); pasoSiguiente(); });
btnAnterior.addEventListener('click', () => { pausarReproduccion(); pasoAnterior(); });
btnReiniciar.addEventListener('click', () => { pausarReproduccion(); irAPaso(0, { sinAnimar: true }); });
btnAuto.addEventListener('click', alternarReproduccion);

deslizadorPasos.addEventListener('input', () => { pausarReproduccion(); irAPaso(parseInt(deslizadorPasos.value, 10), { sinAnimar: true }); });
mapaPasos.addEventListener('click', e => {
  const s = e.target.closest('span[data-indice]');
  if (!s) return;
  pausarReproduccion();
  irAPaso(parseInt(s.dataset.indice, 10), { sinAnimar: true });
});

selectorVelocidad.addEventListener('change', () => {
  if (E.reproduciendo) { pausarReproduccion(); alternarReproduccion(); }
  guardarEstadoOrdenamiento(selectorVelocidad.value);
});
selectorCantidad.addEventListener('change', () => {
  E.cantidad = parseInt(selectorCantidad.value, 10);
  fijarValores(generarValoresOrdenamiento(E.cantidad));
});

btnGenerar.addEventListener('click', () => fijarValores(generarValoresOrdenamiento(E.cantidad)));
btnCasiOrdenado.addEventListener('click', () => fijarValores(valoresCasiOrdenados(E.cantidad)));
btnInvertido.addEventListener('click', () => fijarValores(generarValoresOrdenamiento(E.cantidad).sort((a, b) => b - a)));

function aplicarValoresEscritos() {
  const r = analizarValoresOrdenamiento(entradaValores.value, LIMITES_ORDENAMIENTO);
  entradaValores.setAttribute('aria-invalid', r.ok ? 'false' : 'true');
  if (!r.ok) { errorEntrada.textContent = r.error; return; }
  fijarValores(r.valores);
}
btnAplicar.addEventListener('click', aplicarValoresEscritos);
entradaValores.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); aplicarValoresEscritos(); } });
entradaValores.addEventListener('input', () => { errorEntrada.textContent = ''; entradaValores.removeAttribute('aria-invalid'); });

botonesAlgoritmo.forEach(btn => btn.addEventListener('click', () => {
  const alg = btn.dataset.algoritmo;
  if (alg === E.algoritmo) return;
  E.algoritmo = alg;
  botonesAlgoritmo.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
  ejecutarAlgoritmo();
}));

// ---- Atajos de teclado ----
document.addEventListener('keydown', evento => {
  const t = evento.target.tagName;
  if (t === 'SELECT' || t === 'INPUT' || t === 'TEXTAREA') return;
  if (!modalAyuda.hidden) return;
  if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

  const acciones = {
    ArrowRight: () => { pausarReproduccion(); pasoSiguiente(); },
    ArrowLeft: () => { pausarReproduccion(); pasoAnterior(); },
    Home: () => { pausarReproduccion(); irAPaso(0, { sinAnimar: true }); },
    End: () => { pausarReproduccion(); irAPaso(E.historial.length - 1, { sinAnimar: true }); },
    ' ': alternarReproduccion,
    r: () => { pausarReproduccion(); irAPaso(0, { sinAnimar: true }); },
    R: () => { pausarReproduccion(); irAPaso(0, { sinAnimar: true }); }
  };
  const accion = acciones[evento.key];
  if (accion) { evento.preventDefault(); accion(); }
});

// ---- Ayuda ----
btnAyuda.addEventListener('click', () => { pausarReproduccion(); modalAyuda.hidden = false; });
btnCerrarAyuda.addEventListener('click', () => { modalAyuda.hidden = true; });
modalAyuda.addEventListener('click', e => { if (e.target === modalAyuda) modalAyuda.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modalAyuda.hidden) modalAyuda.hidden = true; });

// ---- Arranque ----
window.addEventListener('DOMContentLoaded', () => {
  const guardado = restaurarEstadoOrdenamiento();
  if (guardado) { aplicarEstadoOrdenamiento(guardado); return; }
  E.cantidad = parseInt(selectorCantidad.value, 10);
  fijarValores(generarValoresOrdenamiento(E.cantidad));
});
