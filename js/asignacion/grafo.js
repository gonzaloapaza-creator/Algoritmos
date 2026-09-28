/* Grafo bipartito del módulo de asignación: dibujo SVG e interacción.
 *
 * Recursos en una columna, tareas en la otra y una conexión por pareja. Una pareja
 * sin valor se dibuja discontinua (pendiente). El zoom y el desplazamiento se hacen
 * con el viewBox del SVG; las posiciones de los nodos viven en estadoAsignacion.posiciones
 * solo cuando el usuario los mueve (mover un nodo no invalida el resultado).
 */

'use strict';

const GRAFO_ASIG = {
  anchoNodo: 150,
  altoNodo: 44,
  separacionY: 74,
  margenX: 40,
  margenY: 56,
  anchoLogico: 880,
  maxNombre: 16
};

const grafoAsig = {
  bloque: document.getElementById('bloqueGrafo'),
  lienzo: document.getElementById('lienzoAsignacion'),
  svg: document.getElementById('svgAsignacion'),
  capaFondo: document.getElementById('capaFondoAsignacion'),
  capaConexiones: document.getElementById('capaConexionesAsignacion'),
  capaNodos: document.getElementById('capaNodosAsignacion'),
  vacio: document.getElementById('grafoVacio'),
  ayuda: document.getElementById('ayudaGrafo'),
  etiquetaZoom: document.getElementById('zoomAsignacionEtiqueta'),
  arrastre: null,
  punteros: new Map(),
  pan: null,
  pinza: null,
  dibujoPendiente: false,
  hover: null
};

function crearSvgAsig(etiqueta, atributos) {
  const nodo = document.createElementNS(SVG_NS, etiqueta);
  for (const clave in atributos) nodo.setAttribute(clave, atributos[clave]);
  return nodo;
}

/* ---------------- Disposición ---------------- */

/**
 * En un lienzo estrecho (móvil en vertical) las dos columnas se acercan y los nodos
 * se estrechan: así el grafo aprovecha el alto disponible en vez de verse diminuto.
 */
function ajustarGeometriaAsignacion() {
  const ancho = grafoAsig.svg ? grafoAsig.svg.getBoundingClientRect().width : 0;
  if (ancho <= 0) return;   // oculto: se conserva la geometría anterior hasta que se vea
  const estrecho = ancho < 560;
  GRAFO_ASIG.anchoLogico = estrecho ? 440 : 880;
  GRAFO_ASIG.anchoNodo = estrecho ? 128 : 150;
  GRAFO_ASIG.maxNombre = estrecho ? 13 : 16;
}

/** Posiciones automáticas en dos columnas, con las movidas por el usuario encima. */
function disposicionAsignacion() {
  ajustarGeometriaAsignacion();
  const m = estadoAsignacion.modelo;
  const G = GRAFO_ASIG;
  const filas = Math.max(m.recursos.length, m.tareas.length, 1);
  const altoTotal = filas * G.separacionY;
  const xRecurso = G.margenX + G.anchoNodo / 2;
  const xTarea = G.anchoLogico - G.margenX - G.anchoNodo / 2;
  const posiciones = {};
  const colocar = (lista, x) => {
    const desplazamiento = (altoTotal - lista.length * G.separacionY) / 2;
    lista.forEach((e, i) => {
      posiciones[e.id] = { x, y: G.margenY + desplazamiento + G.separacionY * i + G.altoNodo / 2 };
    });
  };
  colocar(m.recursos, xRecurso);
  colocar(m.tareas, xTarea);
  Object.keys(estadoAsignacion.posiciones).forEach(id => {
    if (posiciones[id]) posiciones[id] = estadoAsignacion.posiciones[id];
  });
  return { posiciones, xRecurso, xTarea, altoTotal: altoTotal + G.margenY * 2 };
}

/** Caja que contiene todo el dibujo, con margen. */
function cajaContenidoAsignacion(disp) {
  const G = GRAFO_ASIG;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.values(disp.posiciones).forEach(p => {
    minX = Math.min(minX, p.x - G.anchoNodo / 2);
    maxX = Math.max(maxX, p.x + G.anchoNodo / 2);
    minY = Math.min(minY, p.y - G.altoNodo / 2);
    maxY = Math.max(maxY, p.y + G.altoNodo / 2);
  });
  if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = G.anchoLogico; maxY = 320; }
  // Siempre se incluyen los títulos de las columnas y ambos lados.
  minX = Math.min(minX, G.margenX);
  maxX = Math.max(maxX, G.anchoLogico - G.margenX);
  minY = Math.min(minY, 8);
  const margen = 28;
  return { x: minX - margen, y: minY - margen, ancho: maxX - minX + margen * 2, alto: maxY - minY + margen * 2 };
}

/* ---------------- viewBox: zoom y desplazamiento ---------------- */

function medidaLienzoAsignacion() {
  const caja = grafoAsig.svg.getBoundingClientRect();
  return { ancho: Math.max(1, caja.width), alto: Math.max(1, caja.height) };
}

/** viewBox que muestra todo el contenido respetando la proporción del lienzo. */
function vistaAjustadaAsignacion(disp) {
  const caja = cajaContenidoAsignacion(disp);
  const medida = medidaLienzoAsignacion();
  const proporcion = medida.ancho / medida.alto;
  let ancho = caja.ancho, alto = caja.alto;
  if (ancho / alto > proporcion) alto = ancho / proporcion; else ancho = alto * proporcion;
  return { x: caja.x - (ancho - caja.ancho) / 2, y: caja.y - (alto - caja.alto) / 2, ancho, alto };
}

function vistaActualAsignacion(disp) {
  return estadoAsignacion.vista2d || vistaAjustadaAsignacion(disp);
}

function aplicarVistaAsignacion(vista) {
  grafoAsig.svg.setAttribute('viewBox', vista.x + ' ' + vista.y + ' ' + vista.ancho + ' ' + vista.alto);
  if (grafoAsig.etiquetaZoom) {
    const ajustada = vistaAjustadaAsignacion(disposicionAsignacion());
    grafoAsig.etiquetaZoom.textContent = Math.round((ajustada.ancho / vista.ancho) * 100) + '%';
  }
}

/** Cambia la escala manteniendo fijo un punto (en coordenadas del dibujo). */
function zoomAsignacion(factor, puntoFijo) {
  const disp = disposicionAsignacion();
  const actual = vistaActualAsignacion(disp);
  const ajustada = vistaAjustadaAsignacion(disp);
  const anchoNuevo = limitar(actual.ancho / factor, ajustada.ancho / 4, ajustada.ancho * 3);
  const f = actual.ancho / anchoNuevo;
  const altoNuevo = actual.alto / f;
  const p = puntoFijo || { x: actual.x + actual.ancho / 2, y: actual.y + actual.alto / 2 };
  estadoAsignacion.vista2d = {
    x: p.x - (p.x - actual.x) / f,
    y: p.y - (p.y - actual.y) / f,
    ancho: anchoNuevo,
    alto: altoNuevo
  };
  aplicarVistaAsignacion(estadoAsignacion.vista2d);
}

function desplazarVistaAsignacion(dx, dy) {
  const disp = disposicionAsignacion();
  const actual = vistaActualAsignacion(disp);
  estadoAsignacion.vista2d = { x: actual.x - dx, y: actual.y - dy, ancho: actual.ancho, alto: actual.alto };
  aplicarVistaAsignacion(estadoAsignacion.vista2d);
}

function ajustarVistaAsignacion() {
  estadoAsignacion.vista2d = null;
  aplicarVistaAsignacion(vistaAjustadaAsignacion(disposicionAsignacion()));
}

/** Coordenadas del puntero en el sistema del dibujo. */
function puntoSvgAsignacion(evento) {
  const ctm = grafoAsig.svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const punto = grafoAsig.svg.createSVGPoint();
  punto.x = evento.clientX;
  punto.y = evento.clientY;
  const p = punto.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/* ---------------- Geometría ---------------- */

/** Punto del borde de un rectángulo centrado en `c`, en dirección a `hacia`. */
function puntoBordeRect(c, hacia, ancho, alto) {
  const dx = hacia.x - c.x, dy = hacia.y - c.y;
  if (dx === 0 && dy === 0) return { x: c.x, y: c.y };
  const escala = Math.min(
    Math.abs(dx) > 0 ? (ancho / 2) / Math.abs(dx) : Infinity,
    Math.abs(dy) > 0 ? (alto / 2) / Math.abs(dy) : Infinity
  );
  return { x: c.x + dx * escala, y: c.y + dy * escala };
}

function acortarNombre(nombre) {
  return nombre.length > GRAFO_ASIG.maxNombre ? nombre.slice(0, GRAFO_ASIG.maxNombre - 1) + '…' : nombre;
}

/* ---------------- Modo y reglas de visibilidad ---------------- */

function modoResultadoAsignacion() {
  return estadoAsignacion.vista === 'resultado' && resultadoVigenteAsignacion();
}

function asignacionesActuales() {
  return modoResultadoAsignacion() ? estadoAsignacion.resultado.datos.asignaciones : [];
}

function parejaElegida(recursoIdx, tareaIdx) {
  return asignacionesActuales().some(a => a.fila === recursoIdx && a.col === tareaIdx);
}

function nodoRelacionado(recursoId, tareaId) {
  const s = estadoAsignacion.seleccion;
  return !!(s && s.tipo === 'nodo' && (s.id === recursoId || s.id === tareaId));
}

/* ---------------- Dibujo ---------------- */

function dibujarGrafoAsignacion() {
  const m = estadoAsignacion.modelo;
  const G = GRAFO_ASIG;
  const disp = disposicionAsignacion();
  const resultado = modoResultadoAsignacion();
  const totalParejas = m.recursos.length * m.tareas.length;
  const s = estadoAsignacion.seleccion;

  grafoAsig.bloque.classList.toggle('modo-resultado', resultado);
  grafoAsig.bloque.classList.toggle('modo-conectar', !resultado && estadoAsignacion.herramienta === 'conectar');
  grafoAsig.vacio.hidden = m.recursos.length + m.tareas.length > 0;

  // Fondo: títulos de las columnas.
  grafoAsig.capaFondo.replaceChildren();
  const tituloR = crearSvgAsig('text', { class: 'grafo-b__titulo', x: disp.xRecurso, y: 22 });
  tituloR.textContent = 'Recursos (' + m.recursos.length + ')';
  const tituloT = crearSvgAsig('text', { class: 'grafo-b__titulo', x: disp.xTarea, y: 22 });
  tituloT.textContent = 'Tareas (' + m.tareas.length + ')';
  grafoAsig.capaFondo.appendChild(tituloR);
  grafoAsig.capaFondo.appendChild(tituloT);

  // Conexiones.
  const fragmentoC = document.createDocumentFragment();
  m.recursos.forEach((r, i) => m.tareas.forEach((t, j) => {
    const valor = obtenerValorAsignacion(m, r.id, t.id);
    const elegida = resultado && parejaElegida(i, j);
    if (resultado && !elegida && !estadoAsignacion.mostrarTodas && !esConexionSeleccionada(r.id, t.id) && !nodoRelacionado(r.id, t.id)) return;

    const a = disp.posiciones[r.id], b = disp.posiciones[t.id];
    const inicio = puntoBordeRect(a, b, G.anchoNodo, G.altoNodo);
    const fin = puntoBordeRect(b, a, G.anchoNodo, G.altoNodo);
    const d = 'M ' + inicio.x + ' ' + inicio.y + ' L ' + fin.x + ' ' + fin.y;

    const seleccionada = esConexionSeleccionada(r.id, t.id);
    const relacionada = nodoRelacionado(r.id, t.id);
    const grupo = crearSvgAsig('g', {
      class: 'arista' + (valor === null ? ' pendiente' : '') + (seleccionada ? ' seleccionada' : '') +
        (elegida ? ' elegida' : '') + (resultado && !elegida ? ' atenuada' : '') + (relacionada ? ' relacionada' : '') +
        (s && s.tipo === 'nodo' && !relacionada && !elegida && !seleccionada ? ' fuera-foco' : ''),
      role: 'button',
      tabindex: '0',
      'aria-label': r.nombre + ' → ' + t.nombre + ': ' + (valor === null ? 'pendiente' : valor) + (elegida ? ' (elegida)' : '')
    });
    grupo.dataset.recurso = r.id;
    grupo.dataset.tarea = t.id;
    if (seleccionada) grupo.setAttribute('aria-pressed', 'true');
    grupo.appendChild(crearSvgAsig('path', { class: 'arista__linea', d }));
    grupo.appendChild(crearSvgAsig('path', { class: 'arista__zona', d }));

    // Etiqueta contextual: siempre con pocas parejas; con muchas, solo las que importan.
    const mostrarEtiqueta = estadoAsignacion.mostrarValores || seleccionada || relacionada || elegida ||
      (totalParejas <= 20 && !resultado) || (grafoAsig.hover && grafoAsig.hover.recursoId === r.id && grafoAsig.hover.tareaId === t.id);
    if (mostrarEtiqueta) {
      // Cada columna de destino coloca su etiqueta a una distancia distinta del origen:
      // así las conexiones que se cruzan en el centro no superponen sus números.
      const nT = m.tareas.length;
      const t = nT > 1 ? 0.22 + 0.56 * (j / (nT - 1)) : 0.5;
      const mx = inicio.x + (fin.x - inicio.x) * t, my = inicio.y + (fin.y - inicio.y) * t;
      const texto = crearSvgAsig('text', { class: 'arista__valor', x: mx, y: my });
      texto.textContent = valor === null ? '?' : String(valor);
      grupo.appendChild(texto);
    }
    fragmentoC.appendChild(grupo);
  }));
  grafoAsig.capaConexiones.replaceChildren(fragmentoC);

  // Nodos.
  const fragmentoN = document.createDocumentFragment();
  const dibujarNodo = (e, tipo, indice) => {
    const p = disp.posiciones[e.id];
    const sinAsignar = resultado && !asignacionesActuales().some(a => (tipo === 'recurso' ? a.fila : a.col) === indice);
    const grupo = crearSvgAsig('g', {
      class: 'nodo-b ' + tipo + (esNodoSeleccionado(e.id) ? ' seleccionado' : '') +
        (estadoAsignacion.origenConexion === e.id ? ' origen' : '') +
        (grafoAsig.arrastre && grafoAsig.arrastre.id === e.id ? ' arrastrando' : '') +
        (sinAsignar ? ' sin-asignar' : ''),
      role: 'button',
      tabindex: '0',
      'aria-label': (tipo === 'recurso' ? 'Recurso ' : 'Tarea ') + e.nombre + (sinAsignar ? ' (sin asignar)' : '')
    });
    grupo.dataset.id = e.id;
    if (esNodoSeleccionado(e.id)) grupo.setAttribute('aria-pressed', 'true');
    grupo.appendChild(crearSvgAsig('rect', {
      x: p.x - G.anchoNodo / 2, y: p.y - G.altoNodo / 2, width: G.anchoNodo, height: G.altoNodo, rx: 12
    }));
    const texto = crearSvgAsig('text', { x: p.x, y: p.y });
    texto.textContent = acortarNombre(e.nombre);
    grupo.appendChild(texto);
    if (sinAsignar) {
      const marca = crearSvgAsig('text', { class: 'nodo-b__marca', x: p.x, y: p.y + G.altoNodo / 2 + 12 });
      marca.textContent = 'sin asignar';
      grupo.appendChild(marca);
    }
    const titulo = crearSvgAsig('title', {});
    titulo.textContent = e.nombre;
    grupo.appendChild(titulo);
    fragmentoN.appendChild(grupo);
  };
  m.recursos.forEach((r, i) => dibujarNodo(r, 'recurso', i));
  m.tareas.forEach((t, j) => dibujarNodo(t, 'tarea', j));
  grafoAsig.capaNodos.replaceChildren(fragmentoN);

  aplicarVistaAsignacion(vistaActualAsignacion(disp));
  actualizarAyudaGrafo();
}

function dibujarGrafoAsignacionPronto() {
  if (grafoAsig.dibujoPendiente) return;
  grafoAsig.dibujoPendiente = true;
  requestAnimationFrame(() => { grafoAsig.dibujoPendiente = false; dibujarGrafoAsignacion(); });
}

function actualizarAyudaGrafo() {
  if (!grafoAsig.ayuda) return;
  const m = estadoAsignacion.modelo;
  if (modoResultadoAsignacion()) {
    grafoAsig.ayuda.textContent = 'Toca una conexión o un nodo para destacarla en la lista y en la matriz.';
    return;
  }
  if (m.recursos.length + m.tareas.length === 0) { grafoAsig.ayuda.textContent = ''; return; }
  if (estadoAsignacion.herramienta === 'conectar') {
    const origen = estadoAsignacion.origenConexion ? buscarElementoAsignacion(m, estadoAsignacion.origenConexion) : null;
    grafoAsig.ayuda.textContent = origen
      ? 'Origen: ' + origen.elemento.nombre + '. Ahora toca ' + (origen.tipo === 'recurso' ? 'una tarea' : 'un recurso') + ' para indicar el valor.'
      : 'Toca un recurso y luego una tarea (o al revés) para dar valor a su conexión.';
  } else {
    grafoAsig.ayuda.textContent = 'Toca un nodo o una conexión para editarlos; arrastra los nodos para moverlos. Doble toque: renombrar o cambiar valor.';
  }
}

/* ---------------- Interacción ---------------- */

function nodoBajoPuntero(punto) {
  const disp = disposicionAsignacion();
  const G = GRAFO_ASIG;
  const lista = estadoAsignacion.modelo.recursos.concat(estadoAsignacion.modelo.tareas);
  for (let i = lista.length - 1; i >= 0; i--) {
    const p = disp.posiciones[lista[i].id];
    if (Math.abs(punto.x - p.x) <= G.anchoNodo / 2 + 4 && Math.abs(punto.y - p.y) <= G.altoNodo / 2 + 4) return lista[i];
  }
  return null;
}

function medidaPinzaAsig() {
  const puntos = Array.from(grafoAsig.punteros.values());
  const a = puntos[0], b = puntos[1];
  return { distancia: Math.hypot(a.x - b.x, a.y - b.y) || 1, centroX: (a.x + b.x) / 2, centroY: (a.y + b.y) / 2 };
}

function manejarConectarAsignacion(nodo) {
  const m = estadoAsignacion.modelo;
  const actual = buscarElementoAsignacion(m, nodo.id);
  if (!estadoAsignacion.origenConexion) {
    estadoAsignacion.origenConexion = nodo.id;
    dibujarGrafoAsignacion();
    return;
  }
  const origen = buscarElementoAsignacion(m, estadoAsignacion.origenConexion);
  estadoAsignacion.origenConexion = null;
  if (!origen) { dibujarGrafoAsignacion(); return; }
  if (origen.elemento.id === nodo.id) {
    notificar('Un elemento no puede conectarse consigo mismo.', 'error');
    dibujarGrafoAsignacion();
    return;
  }
  if (origen.tipo === actual.tipo) {
    notificar(origen.tipo === 'recurso' ? 'Dos recursos no se conectan entre sí: elige una tarea.' : 'Dos tareas no se conectan entre sí: elige un recurso.', 'error');
    dibujarGrafoAsignacion();
    return;
  }
  const recurso = origen.tipo === 'recurso' ? origen.elemento : actual.elemento;
  const tarea = origen.tipo === 'tarea' ? origen.elemento : actual.elemento;
  dibujarGrafoAsignacion();
  editarValorConexion(recurso.id, tarea.id);
}

/** Pide el valor de una pareja y lo guarda. Vacío = pendiente (no cero). */
function editarValorConexion(recursoId, tareaId) {
  const m = estadoAsignacion.modelo;
  const r = m.recursos.find(e => e.id === recursoId), t = m.tareas.find(e => e.id === tareaId);
  if (!r || !t) return Promise.resolve(null);
  const actual = obtenerValorAsignacion(m, recursoId, tareaId);
  return dialogoPedirTexto({
    titulo: (estadoAsignacion.objetivo === 'max' ? 'Beneficio' : 'Costo') + ' de ' + r.nombre + ' → ' + t.nombre,
    mensaje: 'Número entero entre -' + MAX_VALOR_ASIGNACION + ' y ' + MAX_VALOR_ASIGNACION + '. Deja el campo vacío para marcar la pareja como pendiente (no es lo mismo que 0).',
    valor: actual === null ? '' : String(actual),
    validar: validarValorAsignacion,
    etiquetaCampo: 'Valor de la conexión'
  }).then(valor => {
    if (valor === undefined) return null;                    // cancelado
    if (valor === null && actual === null) return null;      // ya estaba pendiente
    aplicarCambioAsignacion(modelo => fijarValorAsignacion(modelo, recursoId, tareaId, valor), { motivo: 'valor' });
    estadoAsignacion.seleccion = { tipo: 'conexion', recursoId, tareaId };
    emitirCambioAsignacion('seleccion');
    notificar(valor === null ? 'La pareja quedó pendiente.' : 'Valor guardado: ' + valor, 'ok');
    return valor;
  });
}

function renombrarNodoAsignacion(id) {
  const m = estadoAsignacion.modelo;
  const encontrado = buscarElementoAsignacion(m, id);
  if (!encontrado) return;
  const lista = encontrado.tipo === 'recurso' ? m.recursos : m.tareas;
  dialogoPedirTexto({
    titulo: 'Renombrar ' + (encontrado.tipo === 'recurso' ? 'recurso' : 'tarea'),
    mensaje: 'Hasta ' + MAX_LARGO_ETIQUETA_ASIGNACION + ' caracteres. Las conexiones y sus valores se conservan.',
    valor: encontrado.elemento.nombre,
    validar: texto => validarNombreAsignacion(texto, lista, id),
    etiquetaCampo: 'Nombre'
  }).then(nombre => {
    if (nombre === undefined) return;
    aplicarCambioAsignacion(modelo => renombrarElementoAsignacion(modelo, id, nombre), { motivo: 'nombre' });
    notificar('Nombre actualizado.', 'ok');
  });
}

function eliminarNodoAsignacion(id) {
  const encontrado = buscarElementoAsignacion(estadoAsignacion.modelo, id);
  if (!encontrado) return;
  dialogoConfirmar({
    titulo: 'Eliminar ' + (encontrado.tipo === 'recurso' ? 'recurso' : 'tarea'),
    mensaje: '¿Eliminar «' + encontrado.elemento.nombre + '» y todos sus valores? Se puede deshacer con Ctrl+Z.',
    peligro: true,
    textoAceptar: 'Eliminar'
  }).then(ok => {
    if (!ok) return;
    aplicarCambioAsignacion(modelo => {
      eliminarElementoAsignacion(modelo, id);
      delete estadoAsignacion.posiciones[id];
    }, { motivo: 'eliminar' });
    estadoAsignacion.seleccion = null;
    emitirCambioAsignacion('seleccion');
    notificar('Elemento eliminado.', 'ok');
  });
}

/** Eliminar una conexión = dejar la pareja pendiente. */
function eliminarConexionAsignacion(recursoId, tareaId) {
  const m = estadoAsignacion.modelo;
  if (obtenerValorAsignacion(m, recursoId, tareaId) === null) { notificar('Esa pareja ya está pendiente.', 'info'); return; }
  aplicarCambioAsignacion(modelo => fijarValorAsignacion(modelo, recursoId, tareaId, null), { motivo: 'valor' });
  notificar('La pareja quedó pendiente: deberá completarse antes de resolver.', 'aviso');
}

function inicializarInteraccionGrafo() {
  const svg = grafoAsig.svg;

  svg.addEventListener('pointerdown', evento => {
    if (evento.pointerType === 'mouse' && evento.button !== 0 && evento.button !== 1) return;
    grafoAsig.punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    svg.setPointerCapture(evento.pointerId);

    if (grafoAsig.punteros.size === 2) {
      if (grafoAsig.arrastre) { grafoAsig.arrastre = null; dibujarGrafoAsignacion(); }
      grafoAsig.pan = null;
      grafoAsig.pinza = medidaPinzaAsig();
      return;
    }
    if (grafoAsig.punteros.size > 2) return;

    if (evento.pointerType === 'mouse' && evento.button === 1) {
      evento.preventDefault();
      grafoAsig.pan = puntoSvgAsignacion(evento);
      return;
    }

    const punto = puntoSvgAsignacion(evento);
    const nodo = nodoBajoPuntero(punto);
    const resultado = modoResultadoAsignacion();

    if (nodo) {
      if (!resultado && estadoAsignacion.herramienta === 'conectar') { manejarConectarAsignacion(nodo); return; }
      estadoAsignacion.seleccion = { tipo: 'nodo', id: nodo.id };
      const disp = disposicionAsignacion();
      const p = disp.posiciones[nodo.id];
      grafoAsig.arrastre = { id: nodo.id, dx: punto.x - p.x, dy: punto.y - p.y, origen: { x: p.x, y: p.y }, movido: false, teniaPosicion: !!estadoAsignacion.posiciones[nodo.id] };
      emitirCambioAsignacion('seleccion');
      return;
    }

    const arista = evento.target.closest('.arista');
    if (arista && (resultado || estadoAsignacion.herramienta === 'seleccionar')) {
      estadoAsignacion.seleccion = { tipo: 'conexion', recursoId: arista.dataset.recurso, tareaId: arista.dataset.tarea };
      emitirCambioAsignacion('seleccion');
      return;
    }

    // Zona vacía: se limpia la selección y se desplaza la vista.
    if (estadoAsignacion.origenConexion) estadoAsignacion.origenConexion = null;
    if (estadoAsignacion.seleccion) { estadoAsignacion.seleccion = null; emitirCambioAsignacion('seleccion'); }
    else dibujarGrafoAsignacion();
    grafoAsig.pan = punto;
  });

  svg.addEventListener('pointermove', evento => {
    if (!grafoAsig.punteros.has(evento.pointerId)) {
      // Solo hover con el ratón: muestra la etiqueta de la conexión bajo el cursor.
      if (evento.pointerType === 'mouse') {
        const arista = evento.target.closest('.arista');
        const nuevo = arista ? { recursoId: arista.dataset.recurso, tareaId: arista.dataset.tarea } : null;
        const cambia = JSON.stringify(nuevo) !== JSON.stringify(grafoAsig.hover);
        if (cambia) { grafoAsig.hover = nuevo; dibujarGrafoAsignacionPronto(); }
      }
      return;
    }
    grafoAsig.punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });

    if (grafoAsig.pinza && grafoAsig.punteros.size === 2) {
      const actual = medidaPinzaAsig();
      const centro = puntoSvgAsignacion({ clientX: actual.centroX, clientY: actual.centroY });
      zoomAsignacion(actual.distancia / grafoAsig.pinza.distancia, centro);
      const antes = puntoSvgAsignacion({ clientX: grafoAsig.pinza.centroX, clientY: grafoAsig.pinza.centroY });
      const despues = puntoSvgAsignacion({ clientX: actual.centroX, clientY: actual.centroY });
      desplazarVistaAsignacion(despues.x - antes.x, despues.y - antes.y);
      grafoAsig.pinza = actual;
      return;
    }

    if (grafoAsig.pan) {
      const p = puntoSvgAsignacion(evento);
      desplazarVistaAsignacion(p.x - grafoAsig.pan.x, p.y - grafoAsig.pan.y);
      grafoAsig.pan = puntoSvgAsignacion(evento);
      return;
    }

    if (!grafoAsig.arrastre) return;
    const punto = puntoSvgAsignacion(evento);
    const nuevo = { x: punto.x - grafoAsig.arrastre.dx, y: punto.y - grafoAsig.arrastre.dy };
    if (!grafoAsig.arrastre.movido && Math.hypot(nuevo.x - grafoAsig.arrastre.origen.x, nuevo.y - grafoAsig.arrastre.origen.y) < 4) return;
    grafoAsig.arrastre.movido = true;
    estadoAsignacion.posiciones[grafoAsig.arrastre.id] = nuevo;
    dibujarGrafoAsignacionPronto();
  });

  const soltar = evento => {
    grafoAsig.punteros.delete(evento.pointerId);
    if (grafoAsig.punteros.size < 2) grafoAsig.pinza = null;
    if (grafoAsig.punteros.size > 0) return;
    grafoAsig.pan = null;
    if (grafoAsig.arrastre) {
      const a = grafoAsig.arrastre;
      grafoAsig.arrastre = null;
      if (a.movido) {
        // La instantánea del historial debe ser la de ANTES de mover.
        const final = estadoAsignacion.posiciones[a.id];
        if (a.teniaPosicion) estadoAsignacion.posiciones[a.id] = a.origen; else delete estadoAsignacion.posiciones[a.id];
        guardarHistorialAsignacion();
        estadoAsignacion.posiciones[a.id] = final;
        guardarAsignacion();
      }
      dibujarGrafoAsignacion();
    }
  };
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);
  svg.addEventListener('pointerleave', () => { if (grafoAsig.hover) { grafoAsig.hover = null; dibujarGrafoAsignacionPronto(); } });

  svg.addEventListener('wheel', evento => {
    evento.preventDefault();
    zoomAsignacion(evento.deltaY > 0 ? 1 / 1.12 : 1.12, puntoSvgAsignacion(evento));
  }, { passive: false });

  svg.addEventListener('dblclick', evento => {
    if (modoResultadoAsignacion()) return;
    const nodo = nodoBajoPuntero(puntoSvgAsignacion(evento));
    if (nodo) { renombrarNodoAsignacion(nodo.id); return; }
    const arista = evento.target.closest('.arista');
    if (arista) editarValorConexion(arista.dataset.recurso, arista.dataset.tarea);
  });

  // Teclado sobre nodos y conexiones (tienen tabindex).
  svg.addEventListener('keydown', evento => {
    const nodo = evento.target.closest('.nodo-b');
    const arista = evento.target.closest('.arista');
    if (!nodo && !arista) return;
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      if (nodo) {
        if (!modoResultadoAsignacion() && estadoAsignacion.herramienta === 'conectar') {
          const e = buscarElementoAsignacion(estadoAsignacion.modelo, nodo.dataset.id);
          if (e) manejarConectarAsignacion(e.elemento);
          return;
        }
        seleccionarAsignacion({ tipo: 'nodo', id: nodo.dataset.id });
      } else {
        seleccionarAsignacion({ tipo: 'conexion', recursoId: arista.dataset.recurso, tareaId: arista.dataset.tarea });
      }
    }
    if ((evento.key === 'Delete' || evento.key === 'Backspace') && !modoResultadoAsignacion()) {
      evento.preventDefault();
      if (nodo) eliminarNodoAsignacion(nodo.dataset.id);
      else eliminarConexionAsignacion(arista.dataset.recurso, arista.dataset.tarea);
    }
  });

  ['contextmenu', 'selectstart', 'dragstart'].forEach(tipo => grafoAsig.lienzo.addEventListener(tipo, e => e.preventDefault()));

  // Al cambiar el tamaño del lienzo (o al mostrarse) se redibuja todo: la geometría
  // de las columnas depende del ancho disponible.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => { if (grafoAsig.svg.getBoundingClientRect().width > 0) dibujarGrafoAsignacionPronto(); }).observe(grafoAsig.svg);
  }
  window.addEventListener('navegacion:cambio', () => setTimeout(dibujarGrafoAsignacionPronto, 200));
}

/* ---------------- Acciones de la barra del grafo ---------------- */

function elegirHerramientaAsignacion(nombre) {
  estadoAsignacion.herramienta = nombre;
  estadoAsignacion.origenConexion = null;
  document.querySelectorAll('[data-herramienta-asig]').forEach(b => {
    const activo = b.dataset.herramientaAsig === nombre;
    b.setAttribute('aria-pressed', activo ? 'true' : 'false');
  });
  dibujarGrafoAsignacion();
}

function agregarNodoAsignacion(tipo) {
  const m = estadoAsignacion.modelo;
  const lista = tipo === 'recurso' ? m.recursos : m.tareas;
  if (lista.length >= MAX_ASIGNACION_DIMENSION) {
    notificar('Como máximo ' + MAX_ASIGNACION_DIMENSION + (tipo === 'recurso' ? ' recursos' : ' tareas') + ' en esta versión.', 'error');
    return;
  }
  let nuevo = null;
  aplicarCambioAsignacion(modelo => { nuevo = tipo === 'recurso' ? agregarRecurso(modelo) : agregarTarea(modelo); }, { motivo: 'agregar' });
  if (nuevo) {
    estadoAsignacion.seleccion = { tipo: 'nodo', id: nuevo.id };
    estadoAsignacion.vista2d = null;
    emitirCambioAsignacion('seleccion');
    notificar((tipo === 'recurso' ? 'Recurso' : 'Tarea') + ' «' + nuevo.nombre + '» agregado. Sus conexiones quedan pendientes.', 'ok');
  }
}

function reordenarGrafoAsignacion() {
  if (Object.keys(estadoAsignacion.posiciones).length === 0) { ajustarVistaAsignacion(); return; }
  guardarHistorialAsignacion();
  aplicarCambioVisualAsignacion(e => { e.posiciones = {}; e.vista2d = null; }, 'reordenar');
}

function alternarAmpliarGrafo(forzar) {
  const ampliado = typeof forzar === 'boolean' ? forzar : !grafoAsig.bloque.classList.contains('ampliado');
  grafoAsig.bloque.classList.toggle('ampliado', ampliado);
  document.body.classList.toggle('grafo-ampliado', ampliado);
  const btn = document.getElementById('btnAmpliarGrafo');
  if (btn) { btn.setAttribute('aria-pressed', ampliado ? 'true' : 'false'); btn.textContent = ampliado ? 'Reducir' : 'Ampliar'; }
  setTimeout(() => aplicarVistaAsignacion(vistaActualAsignacion(disposicionAsignacion())), 30);
}

function grafoAmpliado() {
  return grafoAsig.bloque.classList.contains('ampliado');
}
