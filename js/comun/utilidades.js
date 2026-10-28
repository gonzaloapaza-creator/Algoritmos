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

/** Resume una lista de problemas de importación en un mensaje breve (máximo 3 detalles). */
function resumirErroresImportacion(errores, maximo) {
  const lista = Array.isArray(errores) ? errores : [String(errores)];
  const tope = maximo || 3;
  const visibles = lista.slice(0, tope);
  const resto = lista.length - visibles.length;
  return visibles.join(' ') + (resto > 0 ? ' (+' + resto + ' más)' : '');
}

/* ---------------- Autoguardado con aviso de fallo ----------------
 * El guardado es local al navegador. Si localStorage falla (bloqueado, lleno,
 * modo privado), la sesión sigue funcionando pero se muestra UN aviso persistente
 * hasta que una escritura posterior vuelva a tener éxito. */

const estadoAlmacenamientoLocal = { fallando: false, aviso: null };

/**
 * Escribe en localStorage y gestiona el aviso de fallo.
 * @param {string} clave
 * @param {string} valor  ya serializado
 * @param {{respaldo?: string}} [opciones]  texto con la forma de respaldar (p. ej. «Exportar JSON»)
 * @returns {boolean} true si se guardó
 */
function escribirAlmacenamientoLocal(clave, valor, opciones) {
  try {
    localStorage.setItem(clave, valor);
  } catch (error) {
    if (!estadoAlmacenamientoLocal.fallando) {
      estadoAlmacenamientoLocal.fallando = true;
      mostrarAvisoAlmacenamiento(opciones && opciones.respaldo);
    }
    return false;
  }
  if (estadoAlmacenamientoLocal.fallando) {
    estadoAlmacenamientoLocal.fallando = false;
    ocultarAvisoAlmacenamiento();
    if (typeof notificar === 'function') notificar('El guardado local volvió a funcionar.', 'ok');
    else if (typeof avisar === 'function') avisar('El guardado local volvió a funcionar.', 'ok');
  }
  return true;
}

function mostrarAvisoAlmacenamiento(respaldo) {
  if (typeof document === 'undefined' || estadoAlmacenamientoLocal.aviso) return;
  const contenedor = document.getElementById('moduloContenido') || document.querySelector('.contenido') || document.body;
  if (!contenedor) return;
  const aviso = document.createElement('div');
  aviso.className = 'mensaje mensaje--aviso aviso-almacenamiento';
  aviso.id = 'avisoAlmacenamiento';
  aviso.setAttribute('role', 'alert');
  aviso.textContent = 'Los cambios actuales no se están guardando en este navegador (almacenamiento local no disponible o lleno). ' +
    'Puedes seguir trabajando; para no perder el trabajo, ' + (respaldo || 'descárgalo con la opción de exportar') + '.';
  contenedor.prepend(aviso);
  estadoAlmacenamientoLocal.aviso = aviso;
}

function ocultarAvisoAlmacenamiento() {
  if (estadoAlmacenamientoLocal.aviso) estadoAlmacenamientoLocal.aviso.remove();
  estadoAlmacenamientoLocal.aviso = null;
}

/** Escapa texto del usuario antes de insertarlo con innerHTML. */
function escaparHtml(texto) {
  const caja = document.createElement('span');
  caja.textContent = String(texto == null ? '' : texto);
  return caja.innerHTML;
}
