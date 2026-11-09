/* Algo: una conversación en memoria, ayuda local, sin llamadas de red.
 * Solo lee el ejercicio. El marcado constante es local; los mensajes son texto. */
(function () {
  'use strict';

  if (!window.AlgoContexto || !window.AlgoMotor || document.getElementById('algoAbrir')) return;
  const motor = window.AlgoMotor;
  const BIENVENIDA = 'Puedes preguntarme por conceptos, cómo usar los módulos o el paso que estás viendo.';

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
    + '<section class="algo-explorador" id="algoExplorador" aria-labelledby="algoExploradorTitulo" hidden>'
    + '<div class="algo-explorador-nav"><button type="button" class="algo-sugerida" id="algoCategorias">Volver a categorías</button>'
    + '<button type="button" class="algo-sugerida" id="algoExploradorCerrar">Cerrar explorador</button></div>'
    + '<h3 id="algoExploradorTitulo" tabindex="-1">Explorar temas</h3>'
    + '<label for="algoBuscar">Buscar un tema o una pregunta</label><input id="algoBuscar" type="search" maxlength="160" placeholder="Por ejemplo: matriz o ficticio">'
    + '<p id="algoBusquedaEstado" role="status" aria-live="polite"></p><div id="algoResultados"></div></section>'
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
  const consultasAnteriores = new WeakMap();
  const vistaModal = window.matchMedia('(max-width: 640px), (max-height: 480px)');
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let iniciado = false, componiendo = false;
  let temporizadorGesto = null, ultimoEnvio = null;
  let bloqueoFondo = false, overflowAnterior = '', respuestasNuevas = 0;
  let moduloAnterior = null, ultimaFirmaContexto = null;

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

  function botonAccion(accion, destino, origen) {
    const boton = document.createElement('button');
    boton.type = 'button'; boton.className = 'algo-sugerida'; boton.textContent = accion.etiqueta;
    boton.addEventListener('click', () => ejecutarAccion(accion, origen));
    destino.appendChild(boton);
    return boton;
  }

  function conservarLectura() {
    const borde = cuerpo.getBoundingClientRect().top;
    const ancla = cuerpo.scrollTop > 0 && Array.from(mensajes.querySelectorAll('article > p'))
      .find(elemento => elemento.getBoundingClientRect().bottom > borde);
    return { posicion: cuerpo.scrollTop, ancla, arriba: ancla ? ancla.getBoundingClientRect().top : 0 };
  }

  function restaurarLectura(lectura) {
    cuerpo.scrollTop = lectura.ancla && lectura.ancla.isConnected
      ? cuerpo.scrollTop + lectura.ancla.getBoundingClientRect().top - lectura.arriba : lectura.posicion;
  }

  function actualizarHistorial(foto) {
    mensajes.querySelectorAll('.algo-mensaje--local').forEach(articulo => {
      const consulta = consultasAnteriores.get(articulo);
      if (consulta) consulta.aviso.hidden = consulta.firma === foto.firma;
    });
  }

  function actualizarPreguntas(foto, sugeridas) {
    let preguntas = buscar('algoPreguntasContexto');
    if (!preguntas) {
      sugeridas.replaceChildren();
      preguntas = document.createElement('div');
      preguntas.id = 'algoPreguntasContexto'; preguntas.className = 'algo-preguntas-contexto';
      preguntas.setAttribute('role', 'group'); preguntas.setAttribute('aria-label', 'Preguntas para el estado actual');
      sugeridas.appendChild(preguntas);
      const accesos = document.createElement('div');
      accesos.className = 'algo-accesos'; accesos.setAttribute('role', 'group'); accesos.setAttribute('aria-label', 'Explorar la ayuda');
      botonAccion({ etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } }, accesos);
      botonAccion({ etiqueta: 'Ver ejemplos de preguntas', comando: { tipo: 'ejemplos' } }, accesos);
      sugeridas.appendChild(accesos);
    }
    const textos = [...new Set(window.AlgoContexto.sugeridas(foto)
      .filter(pregunta => typeof pregunta === 'string' && pregunta.trim()).map(pregunta => pregunta.trim()))].slice(0, 3);
    const existentes = Array.from(preguntas.querySelectorAll('button'));
    if (existentes.length === textos.length && existentes.every((boton, i) => boton.textContent === textos[i])) return;
    const indiceFoco = existentes.indexOf(document.activeElement);
    const textoFoco = indiceFoco >= 0 ? existentes[indiceFoco].textContent : null;
    const porTexto = new Map(existentes.map(boton => [boton.textContent, boton]));
    const vigentes = textos.map(pregunta => porTexto.get(pregunta) || botonAccion({ etiqueta: pregunta, pregunta }, preguntas));
    existentes.forEach(boton => { if (!vigentes.includes(boton)) boton.remove(); });
    vigentes.forEach(boton => preguntas.appendChild(boton));
    if (indiceFoco >= 0 && vigentes.length) {
      (vigentes.find(boton => boton.textContent === textoFoco) || vigentes[Math.min(indiceFoco, vigentes.length - 1)])
        .focus({ preventScroll: true });
    }
  }

  function refrescarContexto(foto) {
    ultimaFirmaContexto = foto.firma;
    if (moduloAnterior && moduloAnterior !== foto.modulo) {
      motor.reiniciar(); buscar('algoExplorador').hidden = true;
    }
    moduloAnterior = foto.modulo;
    buscar('algoModulo').textContent = foto.referencia;
    const sugeridas = buscar('algoSugeridas');
    // El módulo excluido conserva sus controles y su actualización anteriores.
    if (foto.modulo !== 'asignacion') {
      const lectura = conservarLectura();
      actualizarHistorial(foto);
      actualizarPreguntas(foto, sugeridas);
      restaurarLectura(lectura);
      return;
    }
    const acciones = [
      { etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } },
      { etiqueta: 'Ver ejemplos de preguntas', comando: { tipo: 'ejemplos' } }
    ];
    const c = foto.contexto;
    if (c.resultadoVigente && c.paso) acciones.push({ etiqueta: 'Explicar este paso', comando: { tipo: 'paso' } });
    if (c.resultadoVigente && c.resultado) acciones.push({ etiqueta: 'Interpretar resultado', comando: { tipo: 'resultado' } });
    if (!c.resultadoVigente) acciones.push({ etiqueta: 'Ayúdame a empezar', comando: { tipo: 'empezar' } });
    const existentes = Array.from(sugeridas.querySelectorAll('button'));
    if (existentes.length === acciones.length && existentes.every((boton, i) => boton.textContent === acciones[i].etiqueta)) {
      return;
    }
    sugeridas.replaceChildren();
    acciones.forEach(a => botonAccion(a, sugeridas));
  }

  function mostrarLista(acciones, destino) {
    let cantidad = 0;
    const ampliar = () => {
      const hasta = Math.min(cantidad + 8, acciones.length);
      for (; cantidad < hasta; cantidad++) botonAccion(acciones[cantidad], destino);
      if (cantidad < acciones.length) {
        const mas = document.createElement('button'); mas.type = 'button'; mas.className = 'algo-sugerida'; mas.textContent = 'Ver más preguntas';
        mas.addEventListener('click', () => {
          const anterior = cantidad;
          mas.remove(); ampliar();
          const botones = destino.querySelectorAll('button');
          if (botones[anterior]) botones[anterior].focus({ preventScroll: true });
        });
        destino.appendChild(mas);
      }
    };
    ampliar();
  }

  function explorar(respuesta, enfocar = true) {
    const explorador = buscar('algoExplorador'), resultados = buscar('algoResultados');
    explorador.hidden = false; resultados.replaceChildren();
    buscar('algoBuscar').value = '';
    buscar('algoBusquedaEstado').textContent = '';
    buscar('algoExploradorTitulo').textContent = respuesta.tipo === 'explorador' ? 'Explorar temas' : respuesta.texto;
    buscar('algoCategorias').hidden = respuesta.tipo === 'explorador';
    if (respuesta.tipo === 'explorador') respuesta.explorador.forEach(grupo => {
      const seccion = document.createElement('section'), titulo = document.createElement('h4');
      titulo.textContent = grupo.titulo; seccion.appendChild(titulo);
      grupo.temas.forEach(tema => {
        const b = botonAccion({ etiqueta: tema.titulo + ' · ' + tema.cantidad, comando: { tipo: 'tema', clave: tema.clave } }, seccion);
        b.title = tema.descripcion;
      }); resultados.appendChild(seccion);
    });
    else mostrarLista(respuesta.acciones, resultados);
    if (enfocar) buscar('algoExploradorTitulo').focus({ preventScroll: true });
    cuerpo.scrollTop = 0;
  }

  function mostrarRespuesta(respuesta, foto) {
    if (respuesta.tipo === 'explorador' || respuesta.tipo === 'lista') { explorar(respuesta); return; }
    const seguir = alFinal(), posicion = cuerpo.scrollTop;
    const articulo = agregar('Algo', respuesta.texto, 'local', foto.referencia);
    if (foto.modulo !== 'asignacion') {
      const aviso = document.createElement('small');
      aviso.className = 'algo-consulta-anterior'; aviso.hidden = true;
      aviso.textContent = 'Consulta anterior: el estado del ejercicio cambió.';
      articulo.insertBefore(aviso, articulo.querySelector('p'));
      consultasAnteriores.set(articulo, { firma: foto.firma, aviso });
    }
    if (respuesta.entrada) articulo.dataset.entrada = respuesta.entrada;
    if (respuesta.acciones.length) {
      const acciones = document.createElement('div'); acciones.className = 'algo-respuesta-acciones';
      acciones.setAttribute('aria-label', 'Ampliar esta respuesta');
      const origen = foto.modulo !== 'asignacion' ? { firma: foto.firma, modulo: foto.modulo } : null;
      respuesta.acciones.forEach(a => botonAccion(a, acciones, origen)); articulo.appendChild(acciones);
    }
    if (seguir) verUltimos(); else cuerpo.scrollTop = posicion;
  }

  function ejecutarAccion(accion, origen) {
    if (accion.pregunta) { buscar('algoExplorador').hidden = true; enviarPregunta(accion.pregunta); return; }
    const foto = window.AlgoContexto.obtener();
    refrescarContexto(foto);
    const comando = origen && foto.modulo !== 'asignacion' && accion.comando
      ? Object.assign({}, accion.comando, { firmaOrigen: origen.firma, moduloOrigen: origen.modulo }) : accion.comando;
    const respuesta = motor.responder('', foto, comando);
    if (!['explorador', 'lista'].includes(respuesta.tipo)) {
      buscar('algoExplorador').hidden = true;
      agregar('Tú', accion.etiqueta, 'usuario', foto.referencia);
    }
    mostrarRespuesta(respuesta, foto);
    estado.textContent = 'Puedes continuar con otra pregunta.';
    if (!['explorador', 'lista'].includes(respuesta.tipo)) campo.focus({ preventScroll: true });
  }

  buscar('algoCategorias').addEventListener('click', () => ejecutarAccion({ comando: { tipo: 'explorar' } }));
  buscar('algoExploradorCerrar').addEventListener('click', () => {
    buscar('algoExplorador').hidden = true;
    buscar('algoSugeridas').querySelector('button').focus({ preventScroll: true });
  });
  buscar('algoBuscar').addEventListener('input', () => {
    const q = buscar('algoBuscar').value.trim(), resultados = buscar('algoResultados');
    const foto = window.AlgoContexto.obtener();
    if (!q) { explorar(motor.responder('', foto, { tipo: 'explorar' }), false); return; }
    resultados.replaceChildren(); buscar('algoCategorias').hidden = false;
    buscar('algoExploradorTitulo').textContent = 'Resultados de búsqueda';
    const entradas = motor.buscar(q, foto.modulo);
    buscar('algoBusquedaEstado').textContent = entradas.length ? entradas.length + ' preguntas relevantes.'
      : q.length < 2 ? 'Escribe al menos dos caracteres.' : 'Sin coincidencias. Prueba con un concepto como «matriz», «guardar» o «camino», o vuelve a las categorías.';
    mostrarLista(entradas.map(e => ({ etiqueta: e.pregunta, comando: { tipo: 'entrada', id: e.id } })), resultados);
  });
  // Los módulos actualizan su DOM al editar o cambiar de paso. Refrescamos solo
  // las acciones del panel abierto; sin sondeos ni alterar el ejercicio.
  new MutationObserver(cambios => {
    if (!panel.hidden && cambios.some(cambio => !raiz.contains(cambio.target))) {
      const foto = window.AlgoContexto.obtener();
      if (foto.firma !== ultimaFirmaContexto) refrescarContexto(foto);
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-modulo'] });
  document.addEventListener('input', evento => {
    if (!panel.hidden && !raiz.contains(evento.target)) refrescarContexto(window.AlgoContexto.obtener());
  });

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
      agregar('Algo', BIENVENIDA, 'local');
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
    refrescarContexto(foto);
    buscar('algoExplorador').hidden = true;
    agregar('Tú', pregunta, 'usuario', foto.referencia);
    if (campo.value.trim() === pregunta) campo.value = '';
    const respuesta = motor.responder(pregunta, foto);
    mostrarRespuesta(respuesta, foto);
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
    motor.reiniciar();
    buscar('algoExplorador').hidden = true;
    buscar('algoResultados').replaceChildren(); buscar('algoBuscar').value = '';
    mensajes.replaceChildren();
    campo.value = '';
    verUltimos();
    agregar('Algo', BIENVENIDA, 'local');
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
      const focos = Array.from(panel.querySelectorAll('button:not([disabled]), input, textarea, [tabindex="0"]')).filter(e => !e.closest('[hidden]') && e.getClientRects().length);
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
