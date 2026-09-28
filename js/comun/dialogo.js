/* Ventana de diálogo compartida: confirmar, informar o pedir un dato validado.
 *
 * A diferencia de modal.js (propio del editor de Johnson, atado a `el`), esta
 * versión crea su propio DOM y no depende de ningún estado de módulo. Solo puede
 * haber una ventana abierta a la vez; abrir otra devuelve null sin cerrar la actual.
 */

'use strict';

/* Marca de cancelación: distinta de `null`, que puede ser un valor válido («pendiente»). */
const DIALOGO_CANCELADO = { cancelado: true };

const dialogo = {
  fondo: null,
  caja: null,
  titulo: null,
  mensaje: null,
  campo: null,
  input: null,
  error: null,
  aceptar: null,
  cancelar: null,
  cerrar: null,        // función que resuelve la promesa abierta
  abiertaDesde: 0,
  focoPrevio: null
};

function construirDialogo() {
  if (dialogo.fondo) return;
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.id = 'dialogoFondo';
  fondo.hidden = true;
  fondo.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="dialogoTitulo" aria-describedby="dialogoMensaje">' +
    '  <h3 id="dialogoTitulo"></h3>' +
    '  <p id="dialogoMensaje" class="modal-scroll"></p>' +
    '  <div id="dialogoCampo" hidden>' +
    '    <label class="sr-only" for="dialogoInput">Valor</label>' +
    '    <input type="text" id="dialogoInput" autocomplete="off" inputmode="text" />' +
    '    <p class="modal-error" id="dialogoError" role="alert" hidden></p>' +
    '  </div>' +
    '  <div class="modal-botones">' +
    '    <button type="button" class="btn btn-fantasma" id="dialogoCancelar">Cancelar</button>' +
    '    <button type="button" class="btn btn-primary" id="dialogoAceptar">Aceptar</button>' +
    '  </div>' +
    '</div>';
  document.body.appendChild(fondo);

  dialogo.fondo = fondo;
  dialogo.caja = fondo.querySelector('.modal');
  dialogo.titulo = fondo.querySelector('#dialogoTitulo');
  dialogo.mensaje = fondo.querySelector('#dialogoMensaje');
  dialogo.campo = fondo.querySelector('#dialogoCampo');
  dialogo.input = fondo.querySelector('#dialogoInput');
  dialogo.error = fondo.querySelector('#dialogoError');
  dialogo.aceptar = fondo.querySelector('#dialogoAceptar');
  dialogo.cancelar = fondo.querySelector('#dialogoCancelar');

  dialogo.cancelar.addEventListener('click', () => {
    if (!clicFantasmaDialogo() && dialogo.cerrar) dialogo.cerrar(DIALOGO_CANCELADO);
  });
  fondo.addEventListener('click', evento => {
    if (clicFantasmaDialogo()) return;
    if (evento.target === fondo && dialogo.cerrar) dialogo.cerrar(DIALOGO_CANCELADO);
  });
  dialogo.input.addEventListener('keydown', evento => {
    if (evento.key === 'Enter') { evento.preventDefault(); dialogo.aceptar.click(); }
  });
  document.addEventListener('keydown', evento => {
    if (!dialogo.cerrar) return;
    if (evento.key === 'Escape') { evento.preventDefault(); dialogo.cerrar(DIALOGO_CANCELADO); return; }
    // El foco no sale de la ventana con Tab.
    if (evento.key === 'Tab') {
      const focables = Array.from(dialogo.caja.querySelectorAll('input, button')).filter(e => !e.hidden && e.offsetParent !== null);
      if (!focables.length) return;
      const primero = focables[0], ultimo = focables[focables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
    }
  });
}

function dialogoAbierto() {
  return dialogo.cerrar !== null;
}

function clicFantasmaDialogo() {
  return Date.now() - dialogo.abiertaDesde < FANTASMO_CLICK_TIMEOUT;
}

function pantallaTactil() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * @param {{titulo:string, mensaje:string, pedirTexto?:boolean, valor?:string, validar?:Function,
 *          textoAceptar?:string, soloAceptar?:boolean, peligro?:boolean, ancho?:boolean, inputmode?:string}} config
 * @returns {Promise<any>} true, el valor validado (puede ser null), o DIALOGO_CANCELADO
 */
function abrirDialogo(config) {
  construirDialogo();
  if (dialogo.cerrar) return Promise.resolve(DIALOGO_CANCELADO);

  return new Promise(resolve => {
    dialogo.focoPrevio = document.activeElement;
    dialogo.titulo.textContent = config.titulo;
    dialogo.mensaje.textContent = config.mensaje || '';
    dialogo.mensaje.hidden = !config.mensaje;
    dialogo.error.hidden = true;
    dialogo.campo.hidden = !config.pedirTexto;
    dialogo.cancelar.hidden = !!config.soloAceptar;
    dialogo.aceptar.textContent = config.textoAceptar || 'Aceptar';
    dialogo.aceptar.className = 'btn ' + (config.peligro ? 'btn-peligro' : 'btn-primary');
    dialogo.caja.classList.toggle('modal-ancho', !!config.ancho);

    if (config.pedirTexto) {
      dialogo.input.value = config.valor == null ? '' : String(config.valor);
      dialogo.input.setAttribute('inputmode', config.inputmode || 'text');
      dialogo.input.setAttribute('aria-label', config.etiquetaCampo || 'Valor');
    }

    dialogo.fondo.hidden = false;
    dialogo.fondo.scrollTop = 0;
    dialogo.abiertaDesde = Date.now();

    if (!pantallaTactil() || !config.pedirTexto) {
      setTimeout(() => {
        if (config.pedirTexto) { dialogo.input.focus(); dialogo.input.select(); }
        else dialogo.aceptar.focus();
      }, MODAL_FOCUS_DELAY);
    }

    dialogo.cerrar = respuesta => {
      dialogo.input.blur();
      dialogo.fondo.hidden = true;
      dialogo.cerrar = null;
      const previo = dialogo.focoPrevio;
      dialogo.focoPrevio = null;
      if (previo && typeof previo.focus === 'function' && document.contains(previo)) previo.focus();
      resolve(respuesta);
    };

    dialogo.aceptar.onclick = () => {
      if (clicFantasmaDialogo()) return;
      if (!config.pedirTexto) { dialogo.cerrar(true); return; }
      const resultado = config.validar ? config.validar(dialogo.input.value) : { ok: true, valor: dialogo.input.value };
      if (!resultado.ok) {
        dialogo.error.textContent = resultado.error;
        dialogo.error.hidden = false;
        dialogo.input.focus();
        return;
      }
      dialogo.cerrar(resultado.valor);
    };
  });
}

/** Devuelve true o false. */
function dialogoConfirmar(config) {
  return abrirDialogo({
    titulo: config.titulo,
    mensaje: config.mensaje,
    pedirTexto: false,
    peligro: !!config.peligro,
    textoAceptar: config.textoAceptar || 'Sí, continuar'
  }).then(r => r === true);
}

/** Ventana informativa con un solo botón. */
function dialogoInformar(config) {
  return abrirDialogo({
    titulo: config.titulo,
    mensaje: config.mensaje,
    pedirTexto: false,
    soloAceptar: true,
    ancho: !!config.ancho,
    textoAceptar: config.textoAceptar || 'Entendido'
  });
}

/** Devuelve el valor validado (puede ser null = pendiente) o undefined si se cancela. */
function dialogoPedirTexto(config) {
  return abrirDialogo({
    titulo: config.titulo,
    mensaje: config.mensaje,
    pedirTexto: true,
    valor: config.valor,
    validar: config.validar,
    inputmode: config.inputmode,
    etiquetaCampo: config.etiquetaCampo,
    textoAceptar: config.textoAceptar || 'Guardar'
  }).then(r => (r === DIALOGO_CANCELADO ? undefined : r));
}
