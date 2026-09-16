/* Mensajes de ayuda, avisos breves y panel del elemento seleccionado. */

'use strict';

// Las constantes TIMEOUT_AVISO ahora vienen de config.js

function avisar(mensaje, tipo) {
  const nodo = document.createElement('div');
  nodo.className = 'aviso' + (tipo ? ' ' + tipo : '');
  nodo.textContent = mensaje;
  el.avisos.appendChild(nodo);
  setTimeout(() => nodo.remove(), TIMEOUT_AVISO);
}

/**
 * Escapa el texto que escribe el usuario antes de insertarlo con innerHTML.
 * Sin esto, un nodo llamado «<b>» rompería el mensaje de ayuda.
 */
function escaparHtml(texto) {
  const caja = document.createElement('span');
  caja.textContent = String(texto == null ? '' : texto);
  return caja.innerHTML;
}

/** Recibe HTML: los datos del usuario deben pasar antes por escaparHtml(). */
function ayudar(html) {
  el.ayuda.innerHTML = html;
}

function actualizarInterfaz() {
  el.vacio.hidden = estado.nodos.length > 0;
  // El panel ocupa la parte inferior: el botón de ayuda se aparta mientras está visible.
  el.btnAyuda.hidden = estado.seleccion !== null;

  if (!estado.seleccion) {
    el.panel.hidden = true;
    return;
  }

  if (estado.seleccion.tipo === 'nodo') {
    const nodo = buscarNodo(estado.seleccion.id);
    if (!nodo) { estado.seleccion = null; el.panel.hidden = true; return; }
    el.panel.hidden = false;
    el.panelTitulo.textContent = 'Nodo seleccionado';
    el.panelDetalle.textContent = nodo.nombre;
    el.btnEditar.textContent = 'Editar nombre';
  } else {
    const conexion = buscarConexion(estado.seleccion.id);
    if (!conexion) { estado.seleccion = null; el.panel.hidden = true; return; }
    const a = buscarNodo(conexion.desde), b = buscarNodo(conexion.hacia);
    el.panel.hidden = false;
    el.panelTitulo.textContent = 'Conexión seleccionada';
    el.panelDetalle.textContent = a.nombre + ' → ' + b.nombre + '  (valor ' + conexion.valor + ')';
    el.btnEditar.textContent = 'Cambiar valor';
  }
}
