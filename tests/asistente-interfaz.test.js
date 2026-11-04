/* Interacción en DOM simulado: sin navegador, capturas, cálculos ni proveedor. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { parseHTML } = require(process.env.ALGO_DOM_MODULE || path.join(os.tmpdir(), 'algo-dom/node_modules/linkedom'));
let correctas = 0;
function comprobar(valor, texto) { assert.ok(valor, texto); console.log('✓ ' + texto); correctas++; }

async function entorno(movil = false) {
  const { window } = parseHTML('<!doctype html><html><body><main id="ejercicio"><button id="accion">Acción</button></main></body></html>');
  const { document } = window;
  Object.defineProperty(document, 'activeElement', { configurable: true, writable: true, value: document.body });
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  window.HTMLElement.prototype.getClientRects = function () { return this.hidden ? [] : [{ width: 100, height: 40 }]; };
  window.HTMLElement.prototype.requestSubmit = function () { this.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); };
  window.innerWidth = movil ? 375 : 1440;
  window.innerHeight = movil ? 640 : 950;
  window.matchMedia = consulta => ({ matches: !consulta.includes('reduced-motion') && movil, addEventListener() {} });
  // No ejecutar animaciones ni temporizadores reales en esta simulación.
  window.setTimeout = () => 1;
  window.clearTimeout = () => {};
  let peticiones = 0;
  const sinRed = () => { peticiones++; throw Error('Algo no puede usar red'); };
  window.fetch = sinRed;
  window.XMLHttpRequest = sinRed;
  window.WebSocket = sinRed;
  document.body.dataset.modulo = 'johnson';
  const contexto = vm.createContext({ window, document, MutationObserver: window.MutationObserver,
    fetch: sinRed, XMLHttpRequest: sinRed, WebSocket: sinRed, console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/comun/asistente-contexto.js'), 'utf8'), contexto);
  const codigo = fs.readFileSync(path.join(__dirname, '../js/comun/asistente.js'), 'utf8');
  vm.runInContext(codigo, contexto);
  const id = nombre => document.getElementById(nombre);
  const enviar = texto => { id('algoPregunta').value = texto; id('algoFormulario').requestSubmit(); };
  const tecla = (elemento, key, extras = {}) => {
    const evento = new window.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(evento, { key, ...extras }); elemento.dispatchEvent(evento); return evento;
  };
  return { window, document, id, codigo, contexto, enviar, tecla, peticiones: () => peticiones };
}

(async () => {
  const e = await entorno();
  const { document, id } = e;
  comprobar(id('algoPanel').hidden && e.peticiones() === 0, 'No abre ni usa red al cargar');
  vm.runInContext(e.codigo, e.contexto);
  comprobar(document.querySelectorAll('#algoPanel').length === 1 && document.querySelectorAll('#algoPregunta').length === 1, 'Una conversación, una entrada y una instancia');
  id('algoAbrir').click();
  comprobar(!id('algoPanel').hidden && id('algoTitulo').textContent.includes('Ayuda interactiva') && !id('algoPrivacidad') && !id('algoCancelar') && !id('algoReintentar'), 'Abre con subtítulo y sin controles de conexión');
  comprobar(document.activeElement === id('algoTitulo'), 'Abrir enfoca el título del panel');
  e.enviar('¿Cómo empiezo?');
  comprobar(id('algoMensajes').textContent.includes('decisión del editor') && e.peticiones() === 0, 'Respuesta local inmediata');
  e.enviar('Duda desconocida <img src=x onerror=alert(1)>');
  comprobar(id('algoMensajes').textContent.includes('No tengo una explicación local') && !id('algoMensajes').querySelector('img,script'), 'Pregunta desconocida honesta y texto seguro');
  comprobar(id('algoSugeridas').children.length === 3 && !id('algoEnviar').disabled && document.activeElement === id('algoPregunta'), 'Sugerencias, envío y foco siguen disponibles');
  const cantidad = id('algoMensajes').children.length;
  id('algoPregunta').value = 'Borrador'; id('algoCerrar').click(); id('algoAbrir').click();
  comprobar(id('algoPregunta').value === 'Borrador' && id('algoMensajes').children.length === cantidad, 'Cerrar y reabrir conserva conversación y borrador');
  e.tecla(document, 'Escape');
  comprobar(id('algoPanel').hidden && document.activeElement === id('algoAbrir'), 'Escape cierra y devuelve el foco al avatar');
  id('algoAbrir').click();
  const antes = id('algoMensajes').children.length;
  id('algoPregunta').value = '¿Cuáles son las reglas?';
  id('algoPregunta').dispatchEvent(new e.window.Event('compositionstart'));
  e.tecla(id('algoPregunta'), 'Enter', { isComposing: true });
  id('algoPregunta').dispatchEvent(new e.window.Event('compositionend'));
  const salto = e.tecla(id('algoPregunta'), 'Enter', { shiftKey: true });
  comprobar(id('algoMensajes').children.length === antes && !salto.defaultPrevented, 'Composición y Mayús+Enter no envían');
  e.tecla(id('algoPregunta'), 'Enter');
  comprobar(id('algoMensajes').children.length === antes + 2, 'Enter agrega pregunta y respuesta sin esperar');
  e.enviar('¿Cuáles son las reglas?');
  comprobar(id('algoMensajes').children.length === antes + 2, 'Envío doble inmediato no duplica la respuesta');
  Object.defineProperties(id('algoCuerpo'), { scrollHeight: { configurable: true, value: 2000 }, clientHeight: { configurable: true, value: 200 } });
  id('algoCuerpo').scrollTop = 100;
  e.enviar('¿Cómo veo los pasos?');
  comprobar(id('algoCuerpo').scrollTop === 100 && !id('algoNuevas').hidden, 'Conserva la posición de lectura y avisa de nueva respuesta');
  id('algoNuevas').click();
  comprobar(id('algoNuevas').hidden, 'Ver nuevas respuestas lleva al final');
  id('algoLimpiar').click();
  comprobar(id('algoMensajes').children.length === 1 && id('algoPregunta').value === '' && document.activeElement === id('algoPregunta'), 'Limpiar borra conversación y borrador y conserva el foco');
  const m = await entorno(true); m.id('algoAbrir').click();
  comprobar(m.id('algoPanel').getAttribute('aria-modal') === 'true' && m.id('ejercicio').inert && !m.id('algoFondo').hidden, 'Móvil bloquea el fondo y declara diálogo modal');
  m.id('algoEnviar').focus(); m.tecla(m.id('algoPanel'), 'Tab');
  const primero = m.document.activeElement === m.id('algoCerrar');
  m.tecla(m.id('algoPanel'), 'Tab', { shiftKey: true });
  comprobar(primero && m.document.activeElement === m.id('algoEnviar'), 'Tab y Mayús+Tab mantienen el foco en el panel móvil');
  m.id('algoCerrar').click();
  comprobar(!m.id('ejercicio').inert && !m.id('ejercicio').hasAttribute('aria-hidden') && m.document.activeElement === m.id('algoAbrir'), 'Cerrar restaura fondo y foco en móvil');
  comprobar(e.peticiones() === 0 && m.peticiones() === 0, 'Cero llamadas de red del asistente durante toda la interacción');
  console.log('\nInterfaz local: ' + correctas + ' comprobaciones correctas. Sin capturas.');
})().catch(error => { console.error(error); process.exitCode = 1; });
