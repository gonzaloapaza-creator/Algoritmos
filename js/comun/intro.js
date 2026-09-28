/* Presentación del módulo: video explicativo antes de entrar al algoritmo.
 *
 * Requiere en el documento:
 *   <section id="introModulo" hidden>   (se rellena aquí)
 *   <div id="moduloContenido">          (el algoritmo; se oculta mientras se muestra la intro)
 *   <button id="btnVideoModulo">        (opcional: vuelve a abrir la presentación)
 *
 * El video se inserta solo cuando la presentación está visible (youtube-nocookie),
 * así no se carga nada de YouTube mientras se trabaja con el algoritmo.
 * Con «No mostrar al entrar» la elección se guarda en localStorage por módulo.
 */

'use strict';

const intro = {
  seccion: document.getElementById('introModulo'),
  contenido: document.getElementById('moduloContenido'),
  btnVideo: document.getElementById('btnVideoModulo'),
  alg: null,
  marco: null
};

function claveIntro() {
  return 'ui.intro.' + intro.alg.id;
}

function introOmitida() {
  try { return localStorage.getItem(claveIntro()) === 'omitir'; } catch (e) { return false; }
}

function guardarOmitirIntro(valor) {
  try { localStorage.setItem(claveIntro(), valor ? 'omitir' : 'mostrar'); } catch (e) { /* sin almacenamiento */ }
}

function construirIntro() {
  const alg = intro.alg;
  const s = intro.seccion;
  s.className = 'intro';
  s.setAttribute('aria-labelledby', 'introTitulo');
  s.innerHTML =
    '<div class="intro__video">' +
    '  <div class="intro__marco" id="introMarco"></div>' +
    '</div>' +
    '<div class="intro__texto">' +
    '  <p class="eyebrow">Antes de empezar</p>' +
    '  <h2 id="introTitulo"></h2>' +
    '  <p class="intro__descripcion"></p>' +
    '  <dl class="intro__datos"><dt>Entrada</dt><dd class="intro__entrada"></dd><dt>Resultado</dt><dd class="intro__resultado"></dd></dl>' +
    '  <div class="intro__acciones">' +
    '    <button type="button" class="btn btn-primary" id="btnComenzarModulo">Ir al algoritmo</button>' +
    '    <a class="btn btn-neutral" id="introEnlaceYoutube" target="_blank" rel="noopener">Ver en YouTube</a>' +
    '  </div>' +
    '  <label class="intro__omitir"><input type="checkbox" id="introOmitir" /> No mostrar al entrar (se puede volver con «Video»)</label>' +
    '</div>';
  s.querySelector('#introTitulo').textContent = alg.nombre;
  s.querySelector('.intro__descripcion').textContent = alg.descripcion;
  s.querySelector('.intro__entrada').textContent = alg.entrada;
  s.querySelector('.intro__resultado').textContent = alg.resultado;
  s.querySelector('#introEnlaceYoutube').href = 'https://www.youtube.com/watch?v=' + alg.video;
  s.querySelector('#introOmitir').checked = introOmitida();
  s.querySelector('#introOmitir').addEventListener('change', e => guardarOmitirIntro(e.target.checked));
  s.querySelector('#btnComenzarModulo').addEventListener('click', () => cerrarIntro(false));
  intro.marco = s.querySelector('#introMarco');
}

function mostrarIntro() {
  if (!intro.marco.firstChild) {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + intro.alg.video + '?rel=0';
    iframe.title = 'Video: ' + intro.alg.nombre;
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    intro.marco.appendChild(iframe);
  }
  intro.seccion.hidden = false;
  intro.contenido.hidden = true;
  document.body.classList.add('intro-visible');
  if (intro.btnVideo) intro.btnVideo.setAttribute('aria-pressed', 'true');
  window.scrollTo({ top: 0 });
}

function cerrarIntro(inicial) {
  intro.seccion.hidden = true;
  intro.contenido.hidden = false;
  document.body.classList.remove('intro-visible');
  // El video deja de sonar al salir: se quita el iframe y se vuelve a crear la próxima vez.
  if (intro.marco) intro.marco.replaceChildren();
  if (intro.btnVideo) intro.btnVideo.setAttribute('aria-pressed', 'false');
  // El lienzo pasó de oculto a visible: quien dibuje sobre él escucha este evento.
  window.dispatchEvent(new CustomEvent('navegacion:cambio'));
  if (inicial === true) return;
  const primero = intro.contenido.querySelector('h1, h2, button, a');
  if (primero && typeof primero.focus === 'function') { primero.setAttribute('tabindex', '-1'); primero.focus({ preventScroll: true }); }
}

function introVisible() {
  return !!(intro.seccion && !intro.seccion.hidden);
}

function inicializarIntro() {
  if (!intro.seccion || !intro.contenido) return;
  intro.alg = algoritmoPorId(document.body.dataset.modulo);
  if (!intro.alg || !intro.alg.video) return;
  construirIntro();
  if (intro.btnVideo) intro.btnVideo.addEventListener('click', () => (introVisible() ? cerrarIntro(false) : mostrarIntro()));
  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get('intro') === 'no' || introOmitida()) cerrarIntro(true); else mostrarIntro();
}

inicializarIntro();
