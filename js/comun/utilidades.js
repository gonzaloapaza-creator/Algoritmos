/* Utilidades compartidas por los módulos que no cargan js/estado.js (Johnson). */

'use strict';

/** Mantiene un valor dentro de un rango. */
function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

/** Escapa texto del usuario antes de insertarlo con innerHTML. */
function escaparHtml(texto) {
  const caja = document.createElement('span');
  caja.textContent = String(texto == null ? '' : texto);
  return caja.innerHTML;
}
