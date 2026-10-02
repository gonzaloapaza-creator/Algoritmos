/* Zoom y desplazamiento (pan) del área de trabajo.
 *
 * El grafo vive en un sistema de coordenadas "lógico" que coincide con el tamaño
 * del lienzo al 100 %. El zoom es solo una ventana sobre ese plano: las posiciones
 * de los nodos no cambian nunca al acercar, alejar o desplazar.
 *
 * pantalla = logico * escala + offset      →      logico = (pantalla - offset) / escala
 */

'use strict';

// Las constantes ZOOM_MIN, ZOOM_MAX, ZOOM_STEP ahora vienen de config.js

/**
 * Impide que el plano del grafo se salga de la vista: al acercar solo se puede
 * desplazar dentro de él y al alejar queda centrado, sin huecos a los lados.
 */
function limitarPan() {
  const a = area();
  const anchoEscalado = a.ancho * estado.zoom.escala;
  const altoEscalado = a.alto * estado.zoom.escala;

  const limiteX = anchoEscalado >= a.ancho
    ? [a.ancho - anchoEscalado, 0]
    : [0, a.ancho - anchoEscalado];
  const limiteY = altoEscalado >= a.alto
    ? [a.alto - altoEscalado, 0]
    : [0, a.alto - altoEscalado];

  estado.zoom.offsetX = limitar(estado.zoom.offsetX, limiteX[0], limiteX[1]);
  estado.zoom.offsetY = limitar(estado.zoom.offsetY, limiteY[0], limiteY[1]);
}

/** Aplica la transformación actual a las dos capas del SVG. */
function aplicarZoom() {
  limitarPan();
  // Sin unidades: el atributo transform del SVG no admite "px".
  const transform = `translate(${estado.zoom.offsetX} ${estado.zoom.offsetY}) scale(${estado.zoom.escala})`;
  el.capaNodos.setAttribute('transform', transform);
  el.capaConexiones.setAttribute('transform', transform);
  actualizarEtiquetaZoom();
}

/** El botón central muestra el porcentaje actual, así el zoom no es a ciegas. */
function actualizarEtiquetaZoom() {
  const boton = document.getElementById('btnZoomReset');
  if (boton) boton.textContent = Math.round(estado.zoom.escala * 100) + '%';
}

/**
 * Cambia la escala manteniendo fijo un punto de la pantalla (el cursor, los dedos
 * o el centro del lienzo). Sin esto el grafo "salta" al hacer zoom.
 */
function fijarEscala(nuevaEscala, pantallaX, pantallaY) {
  const escala = limitar(nuevaEscala, ZOOM_MIN, ZOOM_MAX);
  if (escala === estado.zoom.escala) { aplicarZoom(); return; }

  const logicoX = (pantallaX - estado.zoom.offsetX) / estado.zoom.escala;
  const logicoY = (pantallaY - estado.zoom.offsetY) / estado.zoom.escala;

  estado.zoom.escala = escala;
  estado.zoom.offsetX = pantallaX - logicoX * escala;
  estado.zoom.offsetY = pantallaY - logicoY * escala;
  aplicarZoom();
}

/** Punto de referencia por defecto: el centro del lienzo. */
function centroLienzo() {
  const a = area();
  return { x: a.ancho / 2, y: a.alto / 2 };
}

function zoomIn() {
  const centro = centroLienzo();
  fijarEscala(estado.zoom.escala + ZOOM_STEP, centro.x, centro.y);
  avisar(`Zoom: ${Math.round(estado.zoom.escala * 100)}%`);
}

function zoomOut() {
  const centro = centroLienzo();
  fijarEscala(estado.zoom.escala - ZOOM_STEP, centro.x, centro.y);
  avisar(`Zoom: ${Math.round(estado.zoom.escala * 100)}%`);
}

/** Vuelve al 100 % sin aviso: se usa al cargar un grafo nuevo. */
function restablecerZoomSilencioso() {
  estado.zoom.escala = 1;
  estado.zoom.offsetX = 0;
  estado.zoom.offsetY = 0;
  aplicarZoom();
}

function zoomReset() {
  restablecerZoomSilencioso();
  avisar('Zoom al 100%');
}

/** Desplaza la vista una cantidad en píxeles de pantalla. */
function desplazarVista(dx, dy) {
  estado.zoom.offsetX += dx;
  estado.zoom.offsetY += dy;
  aplicarZoom();
}

/**
 * Zoom con la rueda del ratón, anclado al cursor.
 * Solo actúa sobre el lienzo, así que la página se sigue desplazando con normalidad.
 */
function zoomRueda(evento) {
  evento.preventDefault();
  const a = area();
  const paso = evento.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  fijarEscala(estado.zoom.escala + paso, evento.clientX - a.izquierda, evento.clientY - a.arriba);
}

el.svg.addEventListener('wheel', zoomRueda, { passive: false });

// Al cambiar el tamaño del lienzo el desplazamiento puede quedar fuera de rango.
// Con el editor oculto (otra vista) el lienzo mide 0: entonces no se toca nada.
window.addEventListener('resize', () => {
  const a = medirArea();
  if (a.ancho >= 50 && a.alto >= 50) aplicarZoom();
});

actualizarEtiquetaZoom();
