/* Modo presentación (proyector): oculta la barra lateral y el pie, ensancha el
 * contenido y agranda la tipografía. Solo tiene sentido en escritorio, así que
 * el botón se muestra a partir de 1024 px. Atajo: Alt+P; Escape sale.
 * Se recuerda en ui.presentacion.v1. */

'use strict';

const CLAVE_PRESENTACION = 'ui.presentacion.v1';

function presentacionActiva() {
  return document.body.classList.contains('presentacion');
}

function fijarPresentacion(activa) {
  document.body.classList.toggle('presentacion', activa);
  try { localStorage.setItem(CLAVE_PRESENTACION, activa ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
  const btn = document.getElementById('btnPresentacion');
  if (btn) {
    btn.setAttribute('aria-pressed', activa ? 'true' : 'false');
    btn.title = activa ? 'Salir del modo presentación (Esc)' : 'Modo presentación: pantalla limpia y texto grande (Alt+P)';
  }
  // El lienzo de Johnson y otros dibujos dependen del ancho disponible.
  window.dispatchEvent(new CustomEvent('navegacion:cambio'));
}

function hayDialogoAbierto() {
  return Array.from(document.querySelectorAll('[aria-modal="true"]')).some(d => d.offsetParent !== null);
}

function alternarPresentacion() {
  fijarPresentacion(!presentacionActiva());
}

function inicializarPresentacion() {
  if (document.body.classList.contains('page-home')) return;
  const acciones = document.querySelector('.topbar__acciones');
  if (!acciones) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'btnPresentacion';
  btn.className = 'btn btn-fantasma btn-icono topbar__presentacion';
  btn.setAttribute('aria-label', 'Modo presentación');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/></svg>';
  btn.addEventListener('click', alternarPresentacion);
  acciones.appendChild(btn);

  let guardada = false;
  try { guardada = localStorage.getItem(CLAVE_PRESENTACION) === '1'; } catch (e) { /* sin almacenamiento */ }
  if (guardada && window.matchMedia('(min-width: 1024px)').matches) fijarPresentacion(true);

  document.addEventListener('keydown', evento => {
    if (evento.altKey && !evento.ctrlKey && !evento.metaKey && (evento.key === 'p' || evento.key === 'P')) {
      evento.preventDefault();
      alternarPresentacion();
    } else if (evento.key === 'Escape' && presentacionActiva() && !evento.defaultPrevented && !hayDialogoAbierto()) {
      fijarPresentacion(false);
    }
  });
}

inicializarPresentacion();
