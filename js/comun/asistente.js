/* Algo: una conversación en memoria, ayuda local, sin llamadas de red.
 * Solo lee el ejercicio. El marcado constante es local; los mensajes son texto. */
(function () {
  'use strict';

  if (!window.AlgoContexto || document.getElementById('algoAbrir')) return;

  const ROBOT = '<svg class="algo-robot" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'
    + '<path class="algo-antena" d="M32 15V8"/><circle class="algo-luz" cx="32" cy="7" r="3"/>'
    + '<rect class="algo-cuerpo" x="10" y="16" width="44" height="37" rx="13"/>'
    + '<path class="algo-orejas" d="M6 30v10M58 30v10"/>'
    + '<rect class="algo-pantalla" x="17" y="24" width="30" height="20" rx="7"/>'
    + '<g class="algo-ojos"><circle cx="25" cy="32" r="2.5"/><circle cx="39" cy="32" r="2.5"/></g>'
    + '<path class="algo-boca" d="M28 39h8"/><path class="algo-sonrisa" d="M27 37q5 6 10 0"/>'
    + '<path class="algo-preocupacion" d="M28 40q4-4 8 0M22 27l6-1M36 26l6 1"/>'
    + '<g class="algo-puntos"><circle cx="23" cy="33" r="2"/><circle cx="32" cy="33" r="2"/><circle cx="41" cy="33" r="2"/></g>'
    + '<path class="algo-pies" d="M23 54v3M41 54v3"/></svg>';
  const raiz = document.createElement('div');
  raiz.className = 'algo-root';
  raiz.dataset.estado = 'reposo';
  raiz.setAttribute('data-html2canvas-ignore', 'true');
  raiz.innerHTML = '<div class="algo-dock"><button type="button" class="algo-abrir" id="algoAbrir" aria-expanded="false" aria-controls="algoPanel" aria-haspopup="dialog" aria-label="Abrir Algo, tu guía de algoritmos" title="Algo · Tu guía de algoritmos">'
    + ROBOT + '<span class="algo-solo-lectores">Algo</span></button></div>'
    + '<div class="algo-fondo" id="algoFondo" hidden></div>'
    + '<section class="algo-panel" id="algoPanel" role="dialog" aria-modal="false" aria-labelledby="algoTitulo" hidden>'
    + '<header class="algo-cabecera">' + ROBOT + '<h2 id="algoTitulo" tabindex="-1">Algo <span>Ayuda interactiva</span></h2>'
    + '<button type="button" class="btn btn-fantasma algo-icono" id="algoCerrar" aria-label="Cerrar Algo" title="Cerrar (Escape)">×</button></header>'
    + '<div class="algo-herramientas"><p class="algo-modulo" id="algoModulo"></p>'
    + '<button type="button" class="btn btn-fantasma btn-sm" id="algoLimpiar">Limpiar conversación</button></div>'
    + '<div class="algo-cuerpo-panel" id="algoCuerpo" tabindex="0" aria-label="Mensajes de la conversación">'
    + '<div class="algo-sugeridas" id="algoSugeridas" aria-label="Preguntas sugeridas"></div>'
    + '<div class="algo-mensajes" id="algoMensajes" role="log" aria-label="Conversación con Algo" aria-live="polite" aria-relevant="additions"></div></div>'
    + '<button type="button" class="algo-nuevas" id="algoNuevas" hidden>Ver nuevas respuestas ↓</button>'
    + '<form class="algo-formulario" id="algoFormulario">'
    + '<label for="algoPregunta">Tu pregunta <span>· Enter envía; Mayús+Enter añade una línea</span></label>'
    + '<textarea id="algoPregunta" rows="2" maxlength="1200" placeholder="Escribe tu duda…" aria-describedby="algoEstado"></textarea>'
    + '<div class="algo-acciones"><button type="submit" class="btn btn-primary" id="algoEnviar">Enviar</button>'
    + '</div>'
    + '<p class="algo-estado" id="algoEstado" role="status" aria-live="polite">Pregunta sobre este módulo o tu ejercicio.</p></form></section>';
  document.body.appendChild(raiz);
  document.body.classList.add('algo-disponible');

  const buscar = id => raiz.querySelector('#' + id);
  const panel = buscar('algoPanel'), abrir = buscar('algoAbrir'), campo = buscar('algoPregunta');
  const mensajes = buscar('algoMensajes'), cuerpo = buscar('algoCuerpo'), estado = buscar('algoEstado');
  const nuevas = buscar('algoNuevas'), fondo = buscar('algoFondo'), formulario = buscar('algoFormulario');
  const fondoAnterior = new Map();
  const vistaModal = window.matchMedia('(max-width: 640px), (max-height: 480px)');
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let iniciado = false, componiendo = false;
  let temporizadorGesto = null, ultimoEnvio = null;
  let bloqueoFondo = false, overflowAnterior = '', respuestasNuevas = 0;

  function gesto(nombre) {
    window.clearTimeout(temporizadorGesto);
    raiz.dataset.estado = nombre;
    if (nombre === 'saludo' || nombre === 'respuesta') {
      temporizadorGesto = window.setTimeout(() => { raiz.dataset.estado = 'reposo'; }, 1100);
    }
  }
  function alFinal() { return cuerpo.scrollHeight - cuerpo.scrollTop - cuerpo.clientHeight < 72; }
  function verUltimos() {
    cuerpo.scrollTop = cuerpo.scrollHeight;
    respuestasNuevas = 0;
    nuevas.hidden = true;
  }

  function agregar(autor, texto, tipo, referencia) {
    const seguir = alFinal();
    const posicion = cuerpo.scrollTop;
    const articulo = document.createElement('article');
    articulo.className = 'algo-mensaje algo-mensaje--' + tipo;
    articulo.dataset.origen = tipo;
    const etiqueta = document.createElement('strong');
    etiqueta.className = 'algo-mensaje__autor';
    etiqueta.textContent = autor;
    articulo.appendChild(etiqueta);
    if (referencia) {
      const detalle = document.createElement('small');
      detalle.className = 'algo-referencia';
      detalle.textContent = referencia;
      articulo.appendChild(detalle);
    }
    const contenido = document.createElement('p');
    contenido.textContent = String(texto);
    articulo.appendChild(contenido);
    mensajes.appendChild(articulo);
    if (seguir) verUltimos();
    else {
      cuerpo.scrollTop = posicion;
      if (tipo !== 'usuario') {
        respuestasNuevas++;
        nuevas.textContent = respuestasNuevas === 1 ? 'Ver nueva respuesta ↓' : 'Ver nuevas respuestas (' + respuestasNuevas + ') ↓';
        nuevas.hidden = false;
      }
    }
    return articulo;
  }

  function bloquearElemento(elemento) {
    if (elemento === raiz || fondoAnterior.has(elemento)) return;
    fondoAnterior.set(elemento, { inert: elemento.inert, oculto: elemento.getAttribute('aria-hidden') });
    elemento.inert = true;
    elemento.setAttribute('aria-hidden', 'true');
  }

  function actualizarModal() {
    const modal = !panel.hidden && vistaModal.matches;
    panel.setAttribute('aria-modal', String(modal));
    fondo.hidden = !modal;
    if (modal && !bloqueoFondo) {
      bloqueoFondo = true;
      overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      Array.from(document.body.children).forEach(bloquearElemento);
      if (!panel.contains(document.activeElement)) buscar('algoTitulo').focus({ preventScroll: true });
    } else if (!modal && bloqueoFondo) {
      bloqueoFondo = false;
      fondoAnterior.forEach((anterior, elemento) => {
        elemento.inert = anterior.inert;
        if (anterior.oculto === null) elemento.removeAttribute('aria-hidden');
        else elemento.setAttribute('aria-hidden', anterior.oculto);
      });
      fondoAnterior.clear();
      document.body.style.overflow = overflowAnterior;
    }
  }
  new MutationObserver(cambios => {
    if (bloqueoFondo) cambios.forEach(cambio => cambio.addedNodes.forEach(nodo => {
      if (nodo.nodeType === 1) bloquearElemento(nodo);
    }));
  }).observe(document.body, { childList: true });

  function refrescarContexto(foto, pregunta) {
    buscar('algoModulo').textContent = foto.referencia;
    const sugeridas = buscar('algoSugeridas');
    const preguntas = window.AlgoContexto.sugeridas(foto, pregunta).slice(0, 3);
    const existentes = Array.from(sugeridas.querySelectorAll('button'));
    if (existentes.length === preguntas.length && existentes.every((boton, i) => boton.textContent === preguntas[i])) {
      return;
    }
    sugeridas.replaceChildren();
    preguntas.forEach(pregunta => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'algo-sugerida';
      boton.textContent = pregunta;
      boton.addEventListener('click', () => enviarPregunta(pregunta));
      sugeridas.appendChild(boton);
    });
  }

  function cerrarPanel() {
    panel.hidden = true;
    document.body.classList.remove('algo-abierto');
    abrir.setAttribute('aria-expanded', 'false');
    actualizarModal();
    gesto('reposo');
    abrir.focus({ preventScroll: true });
  }

  function abrirPanel() {
    panel.hidden = false;
    document.body.classList.add('algo-abierto');
    abrir.setAttribute('aria-expanded', 'true');
    refrescarContexto(window.AlgoContexto.obtener());
    if (!iniciado) {
      iniciado = true;
      agregar('Algo', '¡Hola! Puedo guiarte por el módulo y ayudarte a entender tu ejercicio. Escribe una pregunta o elige una sugerencia.', 'local');
    }
    gesto('saludo');
    buscar('algoTitulo').focus({ preventScroll: true });
    ajustarViewport();
  }

  function enviarPregunta(valor) {
    if (componiendo) return;
    const pregunta = String(valor || '').trim();
    if (!pregunta) { estado.textContent = 'Escribe tu pregunta antes de enviarla.'; campo.focus(); return; }
    if (pregunta.length > 1200) { estado.textContent = 'La pregunta puede tener hasta 1200 caracteres.'; return; }
    const foto = window.AlgoContexto.obtener();
    const ahora = Date.now();
    if (ultimoEnvio && ultimoEnvio.pregunta === pregunta && ultimoEnvio.firma === foto.firma && ahora - ultimoEnvio.tiempo < 400) return;
    ultimoEnvio = { pregunta, firma: foto.firma, tiempo: ahora };
    agregar('Tú', pregunta, 'usuario', foto.referencia);
    if (campo.value.trim() === pregunta) campo.value = '';
    const respuesta = window.AlgoContexto.ayudaLocal(pregunta, foto);
    agregar('Algo', respuesta, 'local', foto.referencia);
    refrescarContexto(foto, pregunta);
    estado.textContent = 'Puedes continuar con otra pregunta.';
    gesto('respuesta');
    campo.focus({ preventScroll: true });
  }

  abrir.addEventListener('click', () => panel.hidden ? abrirPanel() : cerrarPanel());
  buscar('algoCerrar').addEventListener('click', cerrarPanel);
  fondo.addEventListener('click', cerrarPanel);
  formulario.addEventListener('submit', evento => { evento.preventDefault(); enviarPregunta(campo.value); });
  nuevas.addEventListener('click', () => { verUltimos(); cuerpo.focus({ preventScroll: true }); });
  cuerpo.addEventListener('scroll', () => { if (alFinal()) { respuestasNuevas = 0; nuevas.hidden = true; } }, { passive: true });
  buscar('algoLimpiar').addEventListener('click', () => {
    ultimoEnvio = null;
    mensajes.replaceChildren();
    campo.value = '';
    verUltimos();
    agregar('Algo', 'Conversación borrada de esta página. Puedes empezar una nueva pregunta.', 'local');
    refrescarContexto(window.AlgoContexto.obtener());
    estado.textContent = 'Pregunta sobre este módulo o tu ejercicio.';
    gesto('reposo');
    campo.focus({ preventScroll: true });
  });

  campo.addEventListener('compositionstart', () => { componiendo = true; });
  campo.addEventListener('compositionend', () => { componiendo = false; });
  campo.addEventListener('keydown', evento => {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing && !componiendo && evento.keyCode !== 229) {
      evento.preventDefault();
      formulario.requestSubmit();
    }
  });
  panel.addEventListener('keydown', evento => {
    evento.stopPropagation(); // Los atajos del ejercicio no reciben las teclas del chat.
    if (evento.key === 'Tab' && bloqueoFondo) {
      const focos = Array.from(panel.querySelectorAll('button:not([disabled]), textarea, [tabindex="0"]')).filter(e => !e.hidden && e.getClientRects().length);
      const primero = focos[0], ultimo = focos[focos.length - 1];
      if (!primero) return;
      if (evento.shiftKey && (document.activeElement === primero || !focos.includes(document.activeElement))) {
        evento.preventDefault(); ultimo.focus();
      } else if (!evento.shiftKey && (document.activeElement === ultimo || !focos.includes(document.activeElement))) {
        evento.preventDefault(); primero.focus();
      }
    }
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !panel.hidden && !evento.isComposing && !componiendo) {
      evento.preventDefault(); evento.stopPropagation(); cerrarPanel();
    }
  }, true);
  document.addEventListener('focusin', evento => {
    if (bloqueoFondo && !panel.contains(evento.target)) buscar('algoTitulo').focus({ preventScroll: true });
  });

  function ajustarViewport() {
    const vista = window.visualViewport;
    const alto = vista ? vista.height : window.innerHeight;
    const desplazamiento = vista ? Math.max(0, window.innerHeight - vista.height - vista.offsetTop) : 0;
    raiz.style.setProperty('--algo-vh', Math.round(alto) + 'px');
    raiz.style.setProperty('--algo-teclado', Math.round(desplazamiento) + 'px');
    raiz.classList.toggle('algo-altura-corta', alto < 500);
    actualizarModal();
  }
  window.addEventListener('resize', ajustarViewport);
  vistaModal.addEventListener('change', ajustarViewport);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', ajustarViewport);
    window.visualViewport.addEventListener('scroll', ajustarViewport);
  }
  ajustarViewport();

  function programarParpadeo() {
    window.setTimeout(() => {
      if (!movimientoReducido.matches && !document.hidden && raiz.dataset.estado === 'reposo') {
        raiz.classList.add('algo-parpadeo');
        window.setTimeout(() => raiz.classList.remove('algo-parpadeo'), 140);
      }
      programarParpadeo();
    }, 16000 + Math.random() * 9000);
  }
  programarParpadeo();
})();
