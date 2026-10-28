/* Contrato de teclado de los diálogos compartidos, sin dependencias de navegador. */
'use strict';

const { crearContexto, cargar, prueba, cierto, igual, informe } = require('./cargar');

function entorno() {
  const contexto = crearContexto();
  const escuchas = {};
  const documento = {
    activeElement: null,
    addEventListener: (tipo, fn) => { escuchas[tipo] = fn; },
    contains: elemento => elemento.conectado !== false
  };
  contexto.document = documento;
  cargar(contexto, ['js/comun/dialogo.js']);
  const control = nombre => ({
    nombre, disabled: false, hidden: false, tabIndex: 0,
    getClientRects() { return this.hidden ? [] : [{}]; },
    focus() { documento.activeElement = this; }
  });
  const caja = controles => Object.assign(control('caja'), {
    atributos: {},
    querySelectorAll: () => controles,
    contains: elemento => controles.includes(elemento),
    hasAttribute(nombre) { return nombre in this.atributos; },
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    removeAttribute(nombre) { delete this.atributos[nombre]; }
  });
  const tecla = (key, shiftKey) => {
    const evento = { key, shiftKey, preventDefault() { this.prevenido = true; }, stopImmediatePropagation() {} };
    escuchas.keydown(evento);
    return evento;
  };
  return { contexto, documento, control, caja, tecla, escuchas };
}

prueba('El foco inicial entra y Tab recorre solo controles visibles y habilitados', () => {
  const e = entorno();
  const primero = e.control('primero'), oculto = e.control('oculto'), deshabilitado = e.control('deshabilitado'), ultimo = e.control('ultimo');
  oculto.hidden = true;
  deshabilitado.disabled = true;
  const liberar = e.contexto.activarFocoModal(e.caja([primero, oculto, deshabilitado, ultimo]));
  cierto(e.documento.activeElement === primero);
  cierto(e.tecla('Tab', true).prevenido);
  cierto(e.documento.activeElement === ultimo, 'Shift+Tab vuelve al último control');
  e.tecla('Tab');
  cierto(e.documento.activeElement === primero, 'Tab vuelve al primer control');
  liberar(false);
});

prueba('Escape cierra únicamente el diálogo superior y restituye el foco de cada nivel', () => {
  const e = entorno(), origen = e.control('abridor'), exterior = e.control('exterior'), interior = e.control('interior');
  origen.focus();
  let cerrados = 0, liberarExterior, liberarInterior;
  liberarExterior = e.contexto.activarFocoModal(e.caja([exterior]), { cerrar: () => { cerrados++; liberarExterior(); } });
  liberarInterior = e.contexto.activarFocoModal(e.caja([interior]), { cerrar: () => { cerrados++; liberarInterior(); } });
  e.tecla('Escape');
  igual(cerrados, 1);
  cierto(e.documento.activeElement === exterior);
  e.tecla('Escape');
  igual(cerrados, 2);
  cierto(e.documento.activeElement === origen);
  cierto(!e.tecla('Tab').prevenido, 'Al cerrar se libera la navegación normal');
});

prueba('Un diálogo sin controles mantiene el foco y un foco externo vuelve al contenido', () => {
  const e = entorno(), vacia = e.caja([]), externo = e.control('externo');
  const liberar = e.contexto.activarFocoModal(vacia);
  cierto(e.documento.activeElement === vacia);
  e.tecla('Tab');
  cierto(e.documento.activeElement === vacia);
  externo.focus();
  e.escuchas.focusin({ target: externo });
  cierto(e.documento.activeElement === vacia);
  liberar(false);
  cierto(!vacia.hasAttribute('tabindex'), 'Se conserva el atributo tabindex original');
});

process.exit(informe('Foco compartido') ? 0 : 1);
