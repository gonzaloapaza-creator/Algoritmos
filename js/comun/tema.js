/* Tema claro / oscuro.
 *
 * Se carga justo después de config.js, antes de pintar el cuerpo, para fijar
 * html[data-tema] sin parpadeo. La elección se guarda en ui.tema.v1; si no hay
 * ninguna se sigue la preferencia del sistema (y sus cambios en vivo). */

'use strict';

const CLAVE_TEMA = 'ui.tema.v1';
const COLORES_TEMA = { oscuro: '#0b1020', claro: '#f3f5fa' };

function temaGuardado() {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return valor === 'claro' || valor === 'oscuro' ? valor : null;
  } catch (e) { return null; }
}

function temaDelSistema() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
}

function temaActual() {
  return document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro';
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', COLORES_TEMA[tema]);
  window.dispatchEvent(new CustomEvent('tema:cambio', { detail: { tema } }));
}

/** Cambia de tema y lo recuerda; devuelve el tema aplicado. */
function alternarTema() {
  const nuevo = temaActual() === 'claro' ? 'oscuro' : 'claro';
  try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch (e) { /* sin almacenamiento */ }
  aplicarTema(nuevo);
  return nuevo;
}

aplicarTema(temaGuardado() || temaDelSistema());

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!temaGuardado()) aplicarTema(temaDelSistema());
  });
}
