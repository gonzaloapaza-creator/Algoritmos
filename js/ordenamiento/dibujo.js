// js/ordenamiento/dibujo.js
// Dibuja los pinos sobre la pista. Cada pino conserva su nodo DOM (por id) y se
// desplaza con transform, así el navegador anima el movimiento entre pasos.
'use strict';

const PINO_SVG = `
  <svg viewBox="0 0 42 104" class="pino-bowling" aria-hidden="true">
    <path class="pino-cuerpo" d="M21 1.5 C14.5 1.5 11.5 7 12 14 C12.5 21 15 25 13 32 C10 42 4 50 4 68 C4 84 8 98.5 21 98.5 C34 98.5 38 84 38 68 C38 50 32 42 29 32 C27 25 29.5 21 30 14 C30.5 7 27.5 1.5 21 1.5 Z"/>
    <path class="pino-brillo" d="M15 10 C14 20 15 28 12 38" />
    <path class="pino-franja" d="M13.4 31 C17 33.2 25 33.2 28.6 31" />
    <path class="pino-franja" d="M12 37.5 C16.5 40 25.5 40 30 37.5" />
    <circle class="pino-ojo" cx="17" cy="15.5" r="1.7" />
    <circle class="pino-ojo" cx="25" cy="15.5" r="1.7" />
    <path class="pino-boca pino-boca--feliz" d="M17.5 20.5 Q21 23.5 24.5 20.5" />
    <path class="pino-boca pino-boca--atento" d="M18 21 L24 21" />
    <circle class="pino-boca pino-boca--sorpresa" cx="21" cy="21.5" r="1.9" />
    <circle class="pino-insignia" cx="21" cy="70" r="12" />
    <text class="pino-texto" x="21" y="70" text-anchor="middle" dominant-baseline="central"></text>
  </svg>
  <span class="pino-sombra" aria-hidden="true"></span>`;

let pistaOrdenamiento = null;
let indicesOrdenamiento = null;
let ultimoEstadoDibujado = null;
let pinoSeleccionado = 'p0';
const nodosPinosOrdenamiento = new Map();

function prepararPista() {
  if (pistaOrdenamiento) return;
  pistaOrdenamiento = document.getElementById('pistaBowling');
  indicesOrdenamiento = document.getElementById('pistaIndices');
  if (!pistaOrdenamiento) return;
  const seleccionar = evento => {
    const caja = evento.target.closest('.pino-caja');
    if (caja) seleccionarPinoOrdenamiento(caja.dataset.id);
  };
  pistaOrdenamiento.addEventListener('click', seleccionar);
  pistaOrdenamiento.addEventListener('focusin', seleccionar);
  pistaOrdenamiento.addEventListener('keydown', evento => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key) || !ultimoEstadoDibujado) return;
    evento.preventDefault(); evento.stopPropagation();
    const arreglo = ultimoEstadoDibujado.arreglo;
    let indice = arreglo.findIndex(p => p.id === pinoSeleccionado);
    if (evento.key === 'Home') indice = 0;
    else if (evento.key === 'End') indice = arreglo.length - 1;
    else indice = Math.max(0, Math.min(arreglo.length - 1, indice + (evento.key === 'ArrowRight' ? 1 : -1)));
    seleccionarPinoOrdenamiento(arreglo[indice].id, true);
  });
  const selector = document.getElementById('indiceSeleccionado');
  selector.addEventListener('change', () => {
    if (!ultimoEstadoDibujado) return;
    const indice = Number(selector.value);
    if (Number.isInteger(indice) && ultimoEstadoDibujado.arreglo[indice]) seleccionarPinoOrdenamiento(ultimoEstadoDibujado.arreglo[indice].id, true);
  });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => { if (ultimoEstadoDibujado) dibujarPinos(ultimoEstadoDibujado, { sinAnimar: true }); }).observe(pistaOrdenamiento.parentElement);
  }
}

function geometriaPista(n) {
  const ancho = pistaOrdenamiento.parentElement.clientWidth || 600;
  const barras = n > 12;
  const relleno = 12;
  const casilla = barras ? Math.max(18, Math.min(28, Math.floor((ancho - 24) / n))) : Math.max(34, Math.min(88, Math.floor((ancho - 24) / Math.max(n, 1))));
  const anchoContenido = Math.max(ancho, n * casilla + relleno * 2);
  const alturaMax = barras ? 180 : Math.min(176, Math.round(casilla * 2.25));
  return { casilla, alturaMax, alturaMin: barras ? 24 : Math.round(alturaMax * .45), inicio: Math.max(relleno, (anchoContenido - n * casilla) / 2), anchoContenido, barras };
}

function estadoTextoPino(estado, indice) {
  const textos = [];
  if ((estado.ordenados || []).includes(indice)) textos.push('en su lugar');
  if (estado.sostenido === indice) textos.push('clave sostenida');
  if ((estado.moviendo || []).includes(indice)) textos.push('moviendo');
  if ((estado.comparando || []).includes(indice)) textos.push('comparando');
  if (estado.minimo === indice) textos.push('mínimo actual');
  return textos.join(', ') || 'sin revisar';
}

function seleccionarPinoOrdenamiento(id, enfocar) {
  if (!ultimoEstadoDibujado) return;
  const anterior = nodosPinosOrdenamiento.get(pinoSeleccionado);
  if (anterior) { anterior.caja.classList.remove('pino-seleccionado'); anterior.caja.tabIndex = -1; anterior.caja.setAttribute('aria-pressed', 'false'); }
  pinoSeleccionado = id;
  const nodo = nodosPinosOrdenamiento.get(id);
  if (!nodo) return;
  nodo.caja.classList.add('pino-seleccionado');
  nodo.caja.tabIndex = 0;
  nodo.caja.setAttribute('aria-pressed', 'true');
  actualizarDetallePino();
  if (enfocar) { nodo.caja.focus({ preventScroll: true }); nodo.caja.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

function actualizarDetallePino() {
  const estado = ultimoEstadoDibujado;
  if (!estado) return;
  const indice = estado.arreglo.findIndex(p => p.id === pinoSeleccionado);
  if (indice < 0) return;
  const pino = estado.arreglo[indice];
  const selector = document.getElementById('indiceSeleccionado');
  selector.max = String(estado.arreglo.length - 1);
  selector.value = String(indice);
  document.getElementById('detallePino').textContent = 'Posición ' + indice + ' · valor ' + pino.valor + ' · identificador ' + pino.id + ' · ' + estadoTextoPino(estado, indice) + '.';
}

function dibujarPinos(estado, opciones) {
  prepararPista();
  if (!pistaOrdenamiento || !estado || !estado.arreglo) return;
  ultimoEstadoDibujado = estado;
  const arreglo = estado.arreglo;
  const g = geometriaPista(arreglo.length);
  const maxValor = Math.max(...arreglo.map(p => p.valor), 1);
  const ids = new Set(arreglo.map(p => p.id));
  if (!ids.has(pinoSeleccionado)) pinoSeleccionado = arreglo.length ? arreglo[0].id : null;
  pistaOrdenamiento.classList.toggle('sin-animar', !!(opciones && opciones.sinAnimar));
  pistaOrdenamiento.classList.toggle('pista-barras', g.barras);
  pistaOrdenamiento.style.setProperty('--casilla', g.casilla + 'px');
  pistaOrdenamiento.style.width = g.anchoContenido + 'px';
  pistaOrdenamiento.style.height = (g.alturaMax + 64) + 'px';
  indicesOrdenamiento.style.width = g.anchoContenido + 'px';
  nodosPinosOrdenamiento.forEach((nodo, id) => { if (!ids.has(id)) { nodo.caja.remove(); nodosPinosOrdenamiento.delete(id); } });
  nodosPinosOrdenamiento.forEach((nodo, id) => { if (nodo.barras !== g.barras) { nodo.caja.remove(); nodosPinosOrdenamiento.delete(id); } });
  const comparando = new Set(estado.comparando || []);
  const moviendo = new Set(estado.moviendo || []);
  const ordenados = new Set(estado.ordenados || []);
  arreglo.forEach((p, indice) => {
    let nodo = nodosPinosOrdenamiento.get(p.id);
    if (!nodo) {
      const caja = document.createElement('button');
      caja.type = 'button'; caja.className = 'pino-caja'; caja.dataset.id = p.id;
      caja.innerHTML = (g.barras ? '' : PINO_SVG) + '<span class="barra-valor" aria-hidden="true"></span><span class="barra-marca" aria-hidden="true"></span>';
      nodo = { caja, barras: g.barras, svg: caja.querySelector('.pino-bowling'), texto: caja.querySelector('.pino-texto'), barra: caja.querySelector('.barra-valor'), marca: caja.querySelector('.barra-marca') };
      nodosPinosOrdenamiento.set(p.id, nodo); pistaOrdenamiento.appendChild(caja);
    }
    const altura = g.alturaMin + p.valor / maxValor * (g.alturaMax - g.alturaMin);
    const estilo = (elemento, clave, valor) => { if (elemento.style[clave] !== valor) elemento.style[clave] = valor; };
    if (nodo.svg) { estilo(nodo.svg, 'height', altura + 'px'); estilo(nodo.svg, 'width', altura * 42 / 104 + 'px'); }
    estilo(nodo.barra, 'height', altura + 'px');
    if (nodo.texto && nodo.texto.textContent !== String(p.valor)) nodo.texto.textContent = p.valor;
    let clase = 'pino-caja';
    if (ordenados.has(indice)) clase += ' estado-ordenado';
    if (estado.sostenido === indice) clase += ' estado-sostenido';
    else if (moviendo.has(indice)) clase += ' estado-moviendo';
    else if (comparando.has(indice)) clase += ' estado-comparando';
    if (estado.minimo === indice) clase += ' estado-minimo';
    if (p.id === pinoSeleccionado) clase += ' pino-seleccionado';
    if (nodo.caja.className !== clase) nodo.caja.className = clase;
    estilo(nodo.caja, 'width', g.casilla + 'px');
    estilo(nodo.caja, 'transform', 'translateX(' + (g.inicio + indice * g.casilla) + 'px)');
    estilo(nodo.caja, 'zIndex', moviendo.has(indice) || estado.sostenido === indice ? '3' : '1');
    const etiqueta = 'Valor ' + p.valor + ', posición ' + indice + ', ' + p.id + ': ' + estadoTextoPino(estado, indice);
    if (nodo.caja.getAttribute('aria-label') !== etiqueta) nodo.caja.setAttribute('aria-label', etiqueta);
    nodo.caja.tabIndex = p.id === pinoSeleccionado ? 0 : -1;
    nodo.caja.setAttribute('aria-pressed', p.id === pinoSeleccionado ? 'true' : 'false');
    const marca = estado.minimo === indice ? '↓' : estado.sostenido === indice ? '↑' : moviendo.has(indice) ? '↔' : comparando.has(indice) ? '?' : ordenados.has(indice) ? '✓' : '';
    if (nodo.marca.textContent !== marca) nodo.marca.textContent = marca;
  });
  dibujarIndices(estado, g);
  actualizarDetallePino();
}

function dibujarIndices(estado, g) {
  if (!indicesOrdenamiento) return;
  const n = estado.arreglo.length;
  while (indicesOrdenamiento.children.length > n) indicesOrdenamiento.lastElementChild.remove();
  while (indicesOrdenamiento.children.length < n) {
    const s = document.createElement('span');
    s.className = 'pista-indice'; s.innerHTML = '<b></b><i></i>'; indicesOrdenamiento.appendChild(s);
  }
  const comparando = new Set(estado.comparando || []);
  Array.from(indicesOrdenamiento.children).forEach((s, i) => {
    s.style.width = g.casilla + 'px'; s.style.transform = 'translateX(' + (g.inicio + i * g.casilla) + 'px)';
    s.firstElementChild.textContent = !g.barras || i % 5 === 0 || i === n - 1 ? i : '';
    let etiqueta = '';
    if (estado.minimo === i) etiqueta = 'mín';
    else if (estado.sostenido === i) etiqueta = 'clave';
    else if (comparando.has(i)) etiqueta = 'j';
    s.lastElementChild.textContent = etiqueta; s.classList.toggle('activo', !!etiqueta);
  });
}
