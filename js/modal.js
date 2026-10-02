/* Ventana modal para confirmar acciones o pedir un dato validado. */

'use strict';

// Las constantes FANTASMO_CLICK_TIMEOUT y MODAL_FOCUS_DELAY ahora vienen de config.js

let cerrarModal = null;   // función que resuelve la promesa abierta
let abiertaDesde = 0;     // momento en que se abrió, para ignorar el toque que la abrió

function modalAbierto() {
  return cerrarModal !== null;
}

/** Pantalla táctil: en ella el teclado ocupa media pantalla, así que no se enfoca solo. */
function esTactil() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * El dedo que abre la ventana genera un clic al soltarse sobre lo que haya debajo.
 * Durante un instante se ignoran esos clics para no cerrar ni aceptar sin querer.
 */
function clicFantasma() {
  return Date.now() - abiertaDesde < FANTASMO_CLICK_TIMEOUT;
}

function abrirModal(config) {
  // Si ya hay una ventana abierta se ignora la nueva, para no perder la respuesta pendiente.
  if (cerrarModal) return Promise.resolve(null);

  return new Promise(resolve => {
    el.modalTitulo.textContent = config.titulo;
    el.modalMensaje.textContent = config.mensaje;
    el.modalError.hidden = true;
    el.modalCampo.hidden = !config.pedirTexto;
    el.modalCancelar.hidden = !!config.soloAceptar;   // las ventanas informativas no necesitan cancelar
    el.modalAceptar.textContent = config.textoAceptar || 'Aceptar';
    el.modal.classList.toggle('modal-ancho', !!config.ancho);   // textos largos, como la ayuda

    if (config.pedirTexto) {
      el.modalInput.value = config.valor || '';
      // Siempre el teclado completo: el peso admite signo negativo y el teclado
      // numérico de varios teléfonos no incluye la tecla del signo menos.
      el.modalInput.setAttribute('inputmode', 'text');
    }

    el.modalFondo.hidden = false;
    el.modalFondo.scrollTop = 0;
    abiertaDesde = Date.now();

    // En el móvil el usuario toca el campo cuando quiere escribir: así el teclado
    // no aparece de golpe ni tapa los botones al abrirse la ventana.
    if (!esTactil()) {
      setTimeout(() => {
        if (config.pedirTexto) { el.modalInput.focus(); el.modalInput.select(); }
        else el.modalAceptar.focus();
      }, MODAL_FOCUS_DELAY);
    }

    cerrarModal = respuesta => {
      el.modalInput.blur();   // cierra el teclado del móvil antes de ocultar la ventana
      el.modalFondo.hidden = true;
      cerrarModal = null;
      resolve(respuesta);
    };

    // La ventana no se cierra hasta que el dato sea válido o el usuario cancele.
    el.modalAceptar.onclick = () => {
      if (clicFantasma()) return;
      if (!config.pedirTexto) { cerrarModal(true); return; }
      const resultado = config.validar
        ? config.validar(el.modalInput.value)
        : { ok: true, valor: el.modalInput.value };
      if (!resultado.ok) {
        el.modalError.textContent = resultado.error;
        el.modalError.hidden = false;
        el.modalInput.focus();
        return;
      }
      cerrarModal(resultado.valor);
    };
  });
}

/** Devuelve true o false. */
function confirmar(config) {
  return abrirModal({
    titulo: config.titulo,
    mensaje: config.mensaje,
    pedirTexto: false,
    textoAceptar: 'Sí, continuar'
  }).then(respuesta => respuesta === true);
}

// Devuelve el valor ya validado, o null si se cancela.
function pedirTexto(config) {
  return abrirModal({
    titulo: config.titulo,
    mensaje: config.mensaje,
    pedirTexto: true,
    valor: config.valor,
    validar: config.validar,
    textoAceptar: 'Guardar'
  }).then(respuesta => (respuesta === null || respuesta === false ? null : respuesta));
}

el.modalCancelar.addEventListener('click', () => {
  if (!clicFantasma() && cerrarModal) cerrarModal(null);
});
el.modalFondo.addEventListener('click', evento => {
  if (clicFantasma()) return;
  if (evento.target === el.modalFondo && cerrarModal) cerrarModal(null);
});
el.modalInput.addEventListener('keydown', evento => {
  if (evento.key === 'Enter') { evento.preventDefault(); el.modalAceptar.click(); }
});
document.addEventListener('keydown', evento => {
  if (evento.key !== 'Escape') return;
  // La ventana tiene prioridad: se cierra de una en una.
  if (cerrarModal) cerrarModal(null);
  else if (bibliotecaVisible()) cerrarBiblioteca();
  else if (ejemplosVisible()) cerrarEjemplos();
});
