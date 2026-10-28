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
const estadoPreparacion = $('estadoPreparacion');
const btnCancelarPreparacion = $('btnCancelarPreparacion');
let versionPreparacion = 0;
let cuadroPendiente = null;

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
function fijarValores(valores, pasoInicial) {
  E.valores = valores.slice();
  E.cantidad = valores.length;
  selectorCantidad.value = String(E.cantidad);
  entradaValores.value = valores.join(', ');
  entradaValores.removeAttribute('aria-invalid');
  errorEntrada.textContent = '';
  return ejecutarAlgoritmo(pasoInicial);
}

function valoresCasiOrdenados(cantidad) {
  const v = generarValoresOrdenamiento(cantidad).sort((a, b) => a - b);
  const i = Math.floor(Math.random() * (cantidad - 1));
  [v[i], v[i + 1]] = [v[i + 1], v[i]];
  return v;
}

async function ejecutarAlgoritmo(pasoInicial) {
  pausarReproduccion();
  const version = ++versionPreparacion;
  E.preparando = true;
  E.historial = [];
  E.registro = null;
  E.pasoActual = Number.isInteger(pasoInicial) && pasoInicial >= 0 ? pasoInicial : 0;
  construirPseudocodigo();
  estadoPreparacion.textContent = `Preparando ${E.valores.length} valores; puedes cambiar datos o cancelar.`;
  btnCancelarPreparacion.hidden = false;
  [btnAnterior, btnSiguiente, btnAuto, btnReiniciar, deslizadorPasos].forEach(b => { b.disabled = true; });
  mapaPasos.replaceChildren();
  dibujarPinos({ arreglo: pinosDesdeValores(E.valores) }, { sinAnimar: true });
  guardarEstadoOrdenamiento(selectorVelocidad.value);
  const inicio = performance.now();
  const registro = await prepararOrdenamiento(E.algoritmo, E.valores, { cancelado: () => version !== versionPreparacion });
  if (!registro || version !== versionPreparacion) return false;
  E.preparando = false;
  E.registro = registro;
  E.historial = registro.eventos;
  E.pasoActual = Math.min(E.pasoActual, E.historial.length - 1);
  estadoPreparacion.textContent = `${E.valores.length} valores · ${E.historial.length.toLocaleString('es')} eventos · ${registro.checkpoints.length} puntos de recuperación · preparación ${(performance.now() - inicio).toFixed(0)} ms. La animación recorre cada evento.`;
  btnCancelarPreparacion.hidden = true;
  btnAuto.disabled = deslizadorPasos.disabled = false;
  construirMapaPasos();
  deslizadorPasos.max = E.historial.length - 1;
  actualizarInterfaz({ sinAnimar: true });
  return true;
}

function cancelarPreparacion() {
  if (!E.preparando) return;
  versionPreparacion++;
  E.preparando = false;
  btnCancelarPreparacion.hidden = true;
  estadoPreparacion.textContent = 'Preparación cancelada. Pulsa «Usar valores» o elige otro algoritmo para preparar de nuevo.';
}
btnCancelarPreparacion.addEventListener('click', cancelarPreparacion);

// ---- Paneles estáticos por ejecución ----
function construirMapaPasos() {
  mapaPasos.innerHTML = '';
  const cantidad = Math.min(120, E.historial.length);
  for (let muestra = 0; muestra < cantidad; muestra++) {
    const i = Math.round(muestra * (E.historial.length - 1) / Math.max(1, cantidad - 1));
    const paso = E.historial[i];
    const s = document.createElement('span');
    s.dataset.tipo = paso.tipo;
    s.dataset.indice = i;
    s.title = `Paso ${i}: ${NOMBRES_TIPO[paso.tipo] || paso.tipo}`;
    mapaPasos.appendChild(s);
  }
  mapaPasos.title = `Vista resumida: ${cantidad} marcas para ${E.historial.length} eventos. Usa el deslizador para acceder a cualquiera.`;
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
  while (contenedor.children.length > (pinos || []).length) contenedor.lastElementChild.remove();
  (pinos || []).forEach((pino, indice) => {
    let caja = contenedor.children[indice];
    if (!caja) {
      caja = document.createElement('span');
      caja.append(document.createElement('b'), document.createElement('small'));
      contenedor.appendChild(caja);
    }
    caja.className = 'auxiliar-pino' + (pino ? '' : ' auxiliar-pino--vacio');
    const valor = pino ? String(pino.valor) : '·';
    if (caja.firstElementChild.textContent !== valor) caja.firstElementChild.textContent = valor;
    caja.title = pino ? `Pino ${pino.id}: valor ${pino.valor}` : 'Sin copiar todavía';
    caja.setAttribute('aria-label', pino ? `Pino ${pino.valor}, identificador ${pino.id}` : 'Espacio vacío');
    const posicion = caja.lastElementChild;
    posicion.textContent = String((inicio || 0) + indice);
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
      const posicion = paso.segmento ? indice : -1;
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
  const paso = obtenerPasoOrdenamiento(E.registro, E.pasoActual);
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
  Array.from(mapaPasos.children).forEach((s, muestra) => {
    const i = Number(s.dataset.indice);
    const siguiente = mapaPasos.children[muestra + 1];
    s.classList.toggle('hecho', i <= E.pasoActual);
    s.classList.toggle('actual', i <= E.pasoActual && (!siguiente || Number(siguiente.dataset.indice) > E.pasoActual));
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
async function aplicarEstadoOrdenamiento(limpio) {
  pausarReproduccion();
  E.algoritmo = limpio.algoritmo;
  E.cantidad = limpio.valores.length;
  selectorVelocidad.value = limpio.velocidad;
  selectorCantidad.value = String(E.cantidad);
  botonesAlgoritmo.forEach(b => b.setAttribute('aria-pressed', b.dataset.algoritmo === E.algoritmo ? 'true' : 'false'));
  await fijarValores(limpio.valores, limpio.pasoActual);
}

// ---- Navegación entre pasos ----
function irAPaso(i, opciones) {
  if (!E.historial.length || E.preparando) return;
  const total = E.historial.length - 1;
  E.pasoActual = Math.max(0, Math.min(total, i));
  actualizarInterfaz(opciones);
}
function pasoSiguiente() { if (E.pasoActual < E.historial.length - 1) irAPaso(E.pasoActual + 1); }
function pasoAnterior() { if (E.pasoActual > 0) irAPaso(E.pasoActual - 1); }

function alternarReproduccion() {
  if (E.preparando || !E.historial.length) return;
  if (E.reproduciendo) { pausarReproduccion(); return; }
  if (E.pasoActual === E.historial.length - 1) irAPaso(0, { sinAnimar: true });
  E.reproduciendo = true;
  btnAuto.querySelector('span').textContent = 'Pausar';
  btnAuto.classList.replace('btn-neutral', 'btn-secondary');
  btnAuto.setAttribute('aria-pressed', 'true');
  E.intervalo = setInterval(pasoSiguiente, parseInt(selectorVelocidad.value, 10));
}

function pausarReproduccion() {
  E.reproduciendo = false;
  clearInterval(E.intervalo);
  E.intervalo = null;
  btnAuto.querySelector('span').textContent = 'Reproducir';
  btnAuto.classList.replace('btn-secondary', 'btn-neutral');
  btnAuto.setAttribute('aria-pressed', 'false');
}

// ---- Eventos ----
btnSiguiente.addEventListener('click', () => { pausarReproduccion(); pasoSiguiente(); });
btnAnterior.addEventListener('click', () => { pausarReproduccion(); pasoAnterior(); });
btnReiniciar.addEventListener('click', () => { pausarReproduccion(); irAPaso(0, { sinAnimar: true }); });
btnAuto.addEventListener('click', alternarReproduccion);

deslizadorPasos.addEventListener('input', () => {
  pausarReproduccion();
  if (cuadroPendiente != null) return;
  cuadroPendiente = requestAnimationFrame(() => {
    cuadroPendiente = null;
    irAPaso(parseInt(deslizadorPasos.value, 10), { sinAnimar: true });
  });
});
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
  const cantidad = Number(selectorCantidad.value);
  if (!Number.isInteger(cantidad) || cantidad < LIMITES_ORDENAMIENTO.cantidadMin || cantidad > LIMITES_ORDENAMIENTO.cantidadMax) {
    errorEntrada.textContent = `Elige entre ${LIMITES_ORDENAMIENTO.cantidadMin} y ${LIMITES_ORDENAMIENTO.cantidadMax} valores.`;
    selectorCantidad.value = String(E.cantidad);
    return;
  }
  E.cantidad = cantidad;
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
entradaValores.addEventListener('input', () => { cancelarPreparacion(); errorEntrada.textContent = ''; entradaValores.removeAttribute('aria-invalid'); });

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
  if (evento.target.closest('.pino-caja')) return;
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
instalarAyudaModal(modalAyuda, btnAyuda, btnCerrarAyuda, pausarReproduccion);

// ---- Arranque ----
window.addEventListener('DOMContentLoaded', () => {
  const guardado = restaurarEstadoOrdenamiento();
  if (guardado) { aplicarEstadoOrdenamiento(guardado); return; }
  E.cantidad = parseInt(selectorCantidad.value, 10);
  fijarValores(generarValoresOrdenamiento(E.cantidad));
});
