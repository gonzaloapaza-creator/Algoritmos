/* Notificaciones breves (toasts) comunes a las páginas que no son el editor de Johnson.
 * Crea su propio contenedor si el documento no lo trae. */

'use strict';

function contenedorNotificaciones() {
  let pila = document.getElementById('toastStack');
  if (!pila) {
    pila = document.createElement('div');
    pila.id = 'toastStack';
    pila.className = 'toast-stack';
    pila.setAttribute('aria-live', 'polite');
    pila.setAttribute('aria-atomic', 'true');
    document.body.appendChild(pila);
  }
  return pila;
}

/**
 * @param {string} mensaje
 * @param {'ok'|'error'|'info'|'aviso'} [tipo]
 */
function notificar(mensaje, tipo) {
  const pila = contenedorNotificaciones();
  const toast = document.createElement('div');
  toast.className = 'toast toast--' + (tipo || 'info');
  toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  toast.textContent = mensaje;
  pila.appendChild(toast);
  // Como máximo tres visibles: las más antiguas se retiran.
  while (pila.children.length > 3) pila.firstChild.remove();
  window.setTimeout(() => {
    toast.classList.add('is-hiding');
    window.setTimeout(() => toast.remove(), 220);
  }, TIMEOUT_TOAST);
}
