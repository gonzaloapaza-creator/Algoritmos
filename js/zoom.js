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

// Solo conserva límites del dibujo; los nodos guardados nunca se modifican.
let limitesDibujoRutaJohnson = null;

function firmaDibujoVistaJohnson() {
  return JSON.stringify([estado.nodos.map(nodo => [nodo.id, nodo.x, nodo.y, nodo.nombre]), estado.conexiones.map(conexion => [conexion.id, conexion.desde, conexion.hacia, conexion.valor])]);
}

/** Incluye nombres, pesos y etiquetas de ruta al encuadrar el editor. */
function actualizarLimitesRutaJohnson() {
  const visual = estado.visualizacionJohnson;
  limitesDibujoRutaJohnson = null;
  if (!estado.nodos.length) return;
  const cajas = [el.capaNodos, el.capaConexiones].map(capa => {
    try { return capa.childElementCount ? capa.getBBox() : null; }
    catch (_) { return null; }
  }).filter(caja => caja && Number.isFinite(caja.x) && Number.isFinite(caja.y) && (caja.width || caja.height));
  if (!cajas.length) return;
  const margen = 30;
  limitesDibujoRutaJohnson = {
    visual,
    firma: firmaDibujoVistaJohnson(),
    izquierda: Math.min(...cajas.map(caja => caja.x)) - margen,
    arriba: Math.min(...cajas.map(caja => caja.y)) - margen,
    derecha: Math.max(...cajas.map(caja => caja.x + caja.width)) + margen,
    abajo: Math.max(...cajas.map(caja => caja.y + caja.height)) + margen
  };
}

function limitesVistaGrafo() {
  return limitesDibujoRutaJohnson && limitesDibujoRutaJohnson.visual === estado.visualizacionJohnson && limitesDibujoRutaJohnson.firma === firmaDibujoVistaJohnson()
    ? limitesDibujoRutaJohnson : limitesPlanoGrafo();
}

/** Ajuste de toda la ruta y del contexto del grafo, sin alterar sus posiciones. */
function ajustarVistaRutaJohnson() {
  const a = medirArea();
  if (a.ancho < 50 || a.alto < 50) return;
  actualizarLimitesRutaJohnson();
  restablecerZoomSilencioso();
}

/**
 * Impide que el plano del grafo se salga de la vista: al acercar solo se puede
 * desplazar dentro de él y al alejar queda centrado, sin huecos a los lados.
 */
function limitarPan() {
  const a = area();
  const plano = limitesVistaGrafo();
  const anchoEscalado = (plano.derecha - plano.izquierda) * estado.zoom.escala;
  const altoEscalado = (plano.abajo - plano.arriba) * estado.zoom.escala;

  const limiteX = anchoEscalado >= a.ancho
    ? [a.ancho - anchoEscalado, 0]
    : [0, a.ancho - anchoEscalado];
  const limiteY = altoEscalado >= a.alto
    ? [a.alto - altoEscalado, 0]
    : [0, a.alto - altoEscalado];

  const origenX = plano.izquierda * estado.zoom.escala;
  const origenY = plano.arriba * estado.zoom.escala;
  estado.zoom.offsetX = limitar(estado.zoom.offsetX, limiteX[0] - origenX, limiteX[1] - origenX);
  estado.zoom.offsetY = limitar(estado.zoom.offsetY, limiteY[0] - origenY, limiteY[1] - origenY);
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
  const escala = limitar(nuevaEscala, Math.min(ZOOM_MIN, escalaAjustadaGrafo()), ZOOM_MAX);
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

function escalaAjustadaGrafo() {
  const a = area(), plano = limitesVistaGrafo();
  return Math.min(1, a.ancho / Math.max(1, plano.derecha - plano.izquierda),
    a.alto / Math.max(1, plano.abajo - plano.arriba));
}

/** Encuadra el plano completo sin recolocar ni guardar ningún nodo. */
function restablecerZoomSilencioso() {
  const a = area(), plano = limitesVistaGrafo();
  estado.zoom.escala = escalaAjustadaGrafo();
  estado.zoom.offsetX = (a.ancho - (plano.derecha + plano.izquierda) * estado.zoom.escala) / 2;
  estado.zoom.offsetY = (a.alto - (plano.abajo + plano.arriba) * estado.zoom.escala) / 2;
  aplicarZoom();
}

function zoomReset() {
  actualizarLimitesRutaJohnson();
  restablecerZoomSilencioso();
  avisar('Vista ajustada: se muestra el grafo completo.');
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
  if (a.ancho >= 50 && a.alto >= 50) {
    if (estado.visualizacionJohnson && (estado.visualizacionJohnson.tipo === 'ruta' || estado.visualizacionJohnson.valoresNodos)) ajustarVistaRutaJohnson();
    else aplicarZoom();
  }
});

actualizarEtiquetaZoom();
