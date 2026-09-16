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
  if (!Number.isFinite(estado.zoom.offsetX)) estado.zoom.offsetX = 0;
  if (!Number.isFinite(estado.zoom.offsetY)) estado.zoom.offsetY = 0;
}

/** Encuadra todos los nodos, con espacio para bucles y etiquetas. */
function ajustarVista() {
  const a = area();
  if (!estado.nodos.length || !a.ancho || !a.alto) return;
  const margen = 100;
  const xs = estado.nodos.map(n => n.x), ys = estado.nodos.map(n => n.y);
  const minX = Math.min(...xs) - margen, maxX = Math.max(...xs) + margen;
  const minY = Math.min(...ys) - margen, maxY = Math.max(...ys) + margen;
  const escala = Math.min(1.5, a.ancho / (maxX-minX), a.alto / (maxY-minY));
  estado.zoom.escala = Math.max(0.001, escala);
  estado.zoom.offsetX = a.ancho/2 - (minX+maxX)/2*estado.zoom.escala;
  estado.zoom.offsetY = a.alto/2 - (minY+maxY)/2*estado.zoom.escala;
  aplicarZoom();
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

function zoomReset() {
  estado.zoom.escala = 1;
  estado.zoom.offsetX = 0;
  estado.zoom.offsetY = 0;
  aplicarZoom();
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
window.addEventListener('resize', () => { medirArea(); aplicarZoom(); });

actualizarEtiquetaZoom();
