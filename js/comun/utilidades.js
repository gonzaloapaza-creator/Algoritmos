/* Utilidades compartidas por todos los módulos. Debe cargarse antes que el resto de scripts. */

'use strict';

const TEXTO_AYUDA_RECUPERACION = 'RECUPERACIÓN DE DATOS\nSi un guardado anterior es incompatible, su original se conserva intacto y el autoguardado queda pausado. Usa «Descargar original» en el aviso, conserva ese archivo y después elige «Usar ejercicio actual» para habilitar el próximo guardado. Mientras tanto puedes trabajar en esta sesión y exportarla. Corrige los problemas indicados en una copia del original; no se eliminan datos para repararlo automáticamente. Los archivos JSON de importación admiten hasta 1 MiB.';

/** Mantiene un valor dentro de un rango. */
function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

/** Incluye paneles cuyo atributo hidden está en un ancestro. */
function hayDialogoVisible() {
  return Array.from(document.querySelectorAll('[role="dialog"]')).some(panel => panel.getClientRects().length > 0);
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
  if (!permiteEscrituraGuardado(clave)) return false;
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

// Un original incompatible nunca se reemplaza por un ejemplo ni por una reparación parcial.
const guardadosProtegidos = new Map();

function permiteEscrituraGuardado(clave) {
  return !guardadosProtegidos.has(clave);
}

function descargarOriginalGuardado(crudo, nombre) {
  const url = URL.createObjectURL(new Blob([crudo], { type: 'application/json' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre || 'guardado-original.json';
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function protegerGuardadoIncompatible(clave, crudo, motivo) {
  if (guardadosProtegidos.has(clave)) return;
  const recuperacion = { crudo, descargado: false };
  guardadosProtegidos.set(clave, recuperacion);
  if (typeof document === 'undefined') return;
  const aviso = document.createElement('div');
  aviso.className = 'mensaje mensaje--aviso aviso-almacenamiento';
  aviso.setAttribute('role', 'alert');
  const texto = document.createElement('p');
  texto.textContent = 'El guardado anterior es incompatible y se conserva intacto. ' + motivo +
    ' Puedes trabajar en esta sesión; el autoguardado está pausado hasta descargar el original y elegir usar el ejercicio actual.';
  const descargar = document.createElement('button');
  descargar.type = 'button'; descargar.className = 'btn btn-neutral';
  descargar.textContent = 'Descargar original';
  const continuar = document.createElement('button');
  continuar.type = 'button'; continuar.className = 'btn btn-primary';
  continuar.textContent = 'Usar ejercicio actual'; continuar.disabled = true;
  descargar.addEventListener('click', () => {
    descargarOriginalGuardado(crudo, clave.replace(/[^a-z0-9.-]/gi, '-') + '-original.json');
    recuperacion.descargado = true; continuar.disabled = false;
  });
  continuar.addEventListener('click', () => {
    if (!recuperacion.descargado) return;
    guardadosProtegidos.delete(clave); aviso.remove();
    const informar = typeof notificar === 'function' ? notificar : typeof avisar === 'function' ? avisar : null;
    if (informar) informar('El próximo cambio guardará el ejercicio actual. Conserva el archivo original descargado.', 'ok');
  });
  aviso.append(texto, descargar, continuar);
  (document.getElementById('moduloContenido') || document.querySelector('.contenido') || document.body).prepend(aviso);
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
