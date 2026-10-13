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

function prepararPista() {
  if (pistaOrdenamiento) return;
  pistaOrdenamiento = document.getElementById('pistaBowling');
  indicesOrdenamiento = document.getElementById('pistaIndices');
  if (typeof ResizeObserver !== 'undefined' && pistaOrdenamiento) {
    new ResizeObserver(() => { if (ultimoEstadoDibujado) dibujarPinos(ultimoEstadoDibujado, { sinAnimar: true }); }).observe(pistaOrdenamiento);
  }
}

/* Geometría de la pista según el ancho disponible y la cantidad de pinos. */
function geometriaPista(n) {
  const ancho = pistaOrdenamiento.clientWidth || 600;
  const relleno = 12;
  const util = ancho - relleno * 2;
  const casilla = Math.max(34, Math.min(88, Math.floor(util / Math.max(n, 1))));
  const alturaMax = Math.min(176, Math.round(casilla * 2.25));
  const alturaMin = Math.round(alturaMax * 0.45);
  const inicio = relleno + Math.max(0, (util - casilla * n) / 2);
  return { casilla, alturaMax, alturaMin, inicio };
}

function dibujarPinos(estado, opciones) {
  prepararPista();
  if (!pistaOrdenamiento || !estado || !estado.arreglo) return;
  ultimoEstadoDibujado = estado;

  const sinAnimar = opciones && opciones.sinAnimar;
  const arreglo = estado.arreglo;
  const n = arreglo.length;
  const maxValor = Math.max(...arreglo.map(p => p.valor), 1);
  const g = geometriaPista(n);
  const ids = new Set(arreglo.map(p => p.id));

  pistaOrdenamiento.classList.toggle('sin-animar', !!sinAnimar);
  pistaOrdenamiento.style.setProperty('--casilla', g.casilla + 'px');
  pistaOrdenamiento.style.height = (g.alturaMax + 64) + 'px';

  // Retirar pinos que ya no existen (cambio de datos) y crear los nuevos.
  Array.from(pistaOrdenamiento.querySelectorAll('.pino-caja')).forEach(caja => {
    if (!ids.has(caja.dataset.id)) caja.remove();
  });
  arreglo.forEach(p => {
    if (pistaOrdenamiento.querySelector(`.pino-caja[data-id="${p.id}"]`)) return;
    const caja = document.createElement('div');
    caja.className = 'pino-caja';
    caja.dataset.id = p.id;
    caja.innerHTML = PINO_SVG;
    pistaOrdenamiento.appendChild(caja);
  });

  const comparando = new Set(estado.comparando || []);
  const moviendo = new Set(estado.moviendo || []);
  const ordenados = new Set(estado.ordenados || []);

  arreglo.forEach((p, indice) => {
    const caja = pistaOrdenamiento.querySelector(`.pino-caja[data-id="${p.id}"]`);
    const svg = caja.querySelector('.pino-bowling');
    const texto = caja.querySelector('.pino-texto');

    const altura = g.alturaMin + (p.valor / maxValor) * (g.alturaMax - g.alturaMin);
    svg.style.height = altura + 'px';
    svg.style.width = (altura * 42 / 104) + 'px';
    texto.textContent = p.valor;

    let clase = 'pino-caja';
    if (ordenados.has(indice)) clase += ' estado-ordenado';
    if (estado.sostenido === indice) clase += ' estado-sostenido';
    else if (moviendo.has(indice)) clase += ' estado-moviendo';
    else if (comparando.has(indice)) clase += ' estado-comparando';
    if (estado.minimo === indice) clase += ' estado-minimo';
    caja.className = clase;

    caja.style.width = g.casilla + 'px';
    caja.style.transform = `translateX(${g.inicio + indice * g.casilla}px)`;
    caja.style.zIndex = (moviendo.has(indice) || estado.sostenido === indice) ? 3 : 1;
    caja.setAttribute('aria-label', `Pino ${p.valor} en la posición ${indice}`);
  });

  dibujarIndices(estado, g);
}

/* Fila de índices bajo la pista con marcadores (mín, clave, i…). */
function dibujarIndices(estado, g) {
  if (!indicesOrdenamiento) return;
  const n = estado.arreglo.length;
  while (indicesOrdenamiento.children.length > n) indicesOrdenamiento.lastElementChild.remove();
  while (indicesOrdenamiento.children.length < n) {
    const s = document.createElement('span');
    s.className = 'pista-indice';
    s.innerHTML = '<b></b><i></i>';
    indicesOrdenamiento.appendChild(s);
  }
  const comparando = new Set(estado.comparando || []);
  Array.from(indicesOrdenamiento.children).forEach((s, i) => {
    s.style.width = g.casilla + 'px';
    s.style.transform = `translateX(${g.inicio + i * g.casilla}px)`;
    s.firstElementChild.textContent = i;
    let etiqueta = '';
    if (estado.minimo === i) etiqueta = 'mín';
    else if (estado.sostenido === i) etiqueta = 'clave';
    else if (comparando.has(i)) etiqueta = 'j';
    s.lastElementChild.textContent = etiqueta;
    s.classList.toggle('activo', !!etiqueta);
  });
}
