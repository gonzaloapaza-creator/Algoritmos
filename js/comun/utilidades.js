/* Utilidades compartidas por todos los módulos. Debe cargarse antes que el resto de scripts. */

'use strict';

/** Mantiene un valor dentro de un rango. */
function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

/**
 * Desplaza la caja con scroll de una tabla hasta dejar visible la celda indicada
 * (sin mover la página). Respeta «reducir movimiento».
 */
function desplazarHastaCelda(celda) {
  if (!celda || typeof celda.scrollIntoView !== 'function' || celda.offsetParent === null) return;
  if (document.body.classList.contains('imprimiendo-pasos')) return;
  const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  celda.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducido ? 'auto' : 'smooth' });
}

/** Escapa texto del usuario antes de insertarlo con innerHTML. */
function escaparHtml(texto) {
  const caja = document.createElement('span');
  caja.textContent = String(texto == null ? '' : texto);
  return caja.innerHTML;
}
