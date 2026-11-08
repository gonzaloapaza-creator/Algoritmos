/* Vistas del módulo de Johnson: 1 Grafo → 2 Matriz → 3 Paso a paso → 4 Resultado.
 *
 * El editor (vista 1) es el de siempre. Las demás vistas leen el grafo actual y el
 * último resultado calculado; si el grafo cambia después de calcular, el resultado
 * deja de estar vigente (firma distinta) y las vistas piden recalcular.
 * Las vistas 3 y 4 dibujan su propio grafo de solo lectura, ajustado a su caja,
 * así nunca se mueven los nodos del editor.
 */

'use strict';

const VISTAS_JOHNSON = ['grafo', 'matriz', 'resolucion', 'resultado'];

const estadoJohnson = {
  vista: 'grafo',
  resultado: null,      // último resultado de calcularJohnson()
  firma: null,          // firma del grafo con el que se calculó
  pasoActual: 0,
  seleccion: null       // celda elegida en el resultado: { origen, destino }
};

// Consultas estáticas. Los máximos se conservan por origen mientras el grafo siga vigente.
const consultaCaminosJohnson = { objetivo: 'minimo', comparar: false, vista: 'caminos', temporal: null,
  minimo: null, maximo: null, maximos: null, cacheMaximos: new Map(),
  alternativas: [], alternativasPar: null, seleccionRutaId: null, modeloActivo: null, errorRutaActiva: null,
  busqueda: null, avisoBusqueda: '' };

const vj = {
  contador: document.getElementById('pasosContadorJn'),
  chip: document.getElementById('estadoResultadoJn'),
  validacion: document.getElementById('validacionJohnson'),
  resolucionSin: document.getElementById('resolucionSinJn'),
  resolucionCon: document.getElementById('resolucionConJn'),
  indicador: document.getElementById('jnPasoIndicador'),
  titulo: document.getElementById('jnPasoTitulo'),
  texto: document.getElementById('jnPasoTexto'),
  tablas: document.getElementById('jnPasoTablas'),
  leyenda: document.getElementById('jnPasoLeyenda'),
  lista: document.getElementById('jnPasosLista'),
  svgPaso: document.getElementById('svgPasoJn'),
  btnAnterior: document.getElementById('btnJnAnterior'),
  btnSiguiente: document.getElementById('btnJnSiguiente'),
  btnReiniciar: document.getElementById('btnJnReiniciar'),
  resultadoSin: document.getElementById('resultadoSinJn'),
  resultadoCon: document.getElementById('resultadoConJn'),
  pista: document.getElementById('johnsonPista'),
  tituloResultado: document.getElementById('johnsonTitulo'),
  svgResultado: document.getElementById('svgResultadoJn'),
  rutaEtiqueta: document.getElementById('jnRutaEtiqueta'),
  rutaDetalle: document.getElementById('jnRutaDetalle'),
  btnVerEnEditor: document.getElementById('btnVerEnEditor')
};

/* ---------------- Estado y vigencia ---------------- */

/** Resume lo que influye en el cálculo (no las posiciones de los nodos). */
function firmaGrafoJohnson() {
  return JSON.stringify([
    estado.nodos.map(n => n.id),
    estado.conexiones.map(c => [c.id, c.desde, c.hacia, c.valor])
  ]);
}

function resultadoVigenteJohnson() {
  return !!estadoJohnson.resultado && estadoJohnson.firma === firmaGrafoJohnson();
}

function editorJohnsonVisible() {
  return estadoJohnson.vista === 'grafo' && !introVisible() && el.bibliotecaFondo.hidden && el.ejemplosFondo.hidden;
}

/** Muestra el editor (si no lo estaba) antes de una acción que necesita medir el lienzo. */
function irAlEditorJohnson() {
  if (estadoJohnson.vista !== 'grafo') cambiarVistaJohnson('grafo');
}

function actualizarChipJohnson() {
  const chip = vj.chip;
  if (!estadoJohnson.resultado) { chip.className = 'estado estado--neutro'; chip.textContent = 'Sin calcular'; return; }
  if (!resultadoVigenteJohnson()) { chip.className = 'estado estado--aviso'; chip.textContent = 'Grafo modificado: recalcular'; return; }
  if (estadoJohnson.resultado.tieneCicloNegativo) { chip.className = 'estado estado--error'; chip.textContent = 'Ciclo negativo'; return; }
  chip.className = 'estado estado--ok'; chip.textContent = 'Resultado vigente';
}

/** Lo llama dibujar() tras cada cambio del grafo. */
function refrescarVistaJohnson() {
  let renombrado = false;
  if (estado.resultadoDijkstraRapido && estado.resultadoDijkstraRapido.firma !== firmaGrafoJohnson()) estado.resultadoDijkstraRapido = null;
  if (resultadoVigenteJohnson()) {
    const r = estadoJohnson.resultado;
    const nombres = r.ids.map(id => buscarNodo(id).nombre);
    if (JSON.stringify(nombres) !== JSON.stringify(r.nombres)) {
      renombrado = true;
      r.nombres = nombres;
      r.ciclo = r.cicloIndices.map(i => nombres[i]);
      r.aristas.forEach(a => { a.desde = nombres[a.indiceDesde]; a.hacia = nombres[a.indiceHacia]; });
      r.pasos = construirPasosJohnson(r);
    }
  } else if (consultaCaminosJohnson.minimo || estadoJohnson.seleccion) {
    limpiarRutaSeleccionadaJohnson();
  }
  actualizarChipJohnson();
  actualizarFormulariosEditorJohnson();
  if (estadoJohnson.vista !== 'grafo') dibujarVistaJohnson();
  actualizarPanelRutaEditorJohnson(renombrado);
}

/* ---------------- Navegación entre vistas ---------------- */

function cambiarVistaJohnson(vista) {
  if (!VISTAS_JOHNSON.includes(vista)) return;
  const cambia = estadoJohnson.vista !== vista;
  estadoJohnson.vista = vista;
  document.body.dataset.vista = vista;
  if (typeof cerrarMenuExtra === 'function') cerrarMenuExtra();

  if (vista !== 'grafo' && (estado.seleccion || estado.origenConexion)) {
    estado.seleccion = null;
    estado.origenConexion = null;
    actualizarInterfaz();
  }

  const indice = VISTAS_JOHNSON.indexOf(vista);
  document.querySelectorAll('#pasosJohnson .paso').forEach(btn => {
    const i = VISTAS_JOHNSON.indexOf(btn.dataset.vista);
    btn.classList.toggle('completo', i < indice);
    if (i === indice) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
  });
  vj.contador.textContent = 'Paso ' + (indice + 1) + ' de ' + VISTAS_JOHNSON.length;
  document.querySelectorAll('#moduloContenido .vista').forEach(s => { s.hidden = s.dataset.vista !== vista; });

  dibujarVistaJohnson();
  actualizarPanelRutaEditorJohnson();
  actualizarChipJohnson();

  if (vista === 'grafo') {
    // El lienzo pasó de oculto a visible: se mide y se redibuja con su tamaño real.
    requestAnimationFrame(() => {
      if (estadoJohnson.vista !== 'grafo') return;
      if (typeof adaptarAlArea === 'function') adaptarAlArea();
      if (estado.visualizacionJohnson && estado.visualizacionJohnson.valoresNodos) {
        dibujarLienzo();
        ajustarVistaRutaJohnson();
      }
    });
  }
  if (cambia) window.scrollTo({ top: 0 });
}

function dibujarVistaJohnson() {
  if (estadoJohnson.vista === 'matriz') dibujarVistaMatrizJohnson();
  else if (estadoJohnson.vista === 'resolucion') dibujarResolucionJohnson();
  else if (estadoJohnson.vista === 'resultado') dibujarResultadoJohnson();
}

/**
 * Calcula con el grafo actual y abre la resolución paso a paso.
 * Un ciclo negativo también se resalta en el editor, para verlo al volver.
 */
function calcularYMostrarJohnson(destino) {
  const validacion = validarGrafoImportado(instantaneaGrafo());
  if (!validacion.ok) { avisar(resumirErroresImportacion(validacion.errores), 'error'); return false; }
  if (estado.nodos.length < 2) {
    avisar('Crea al menos dos nodos para calcular las distancias mínimas.', 'error');
    return false;
  }

  limpiarRutaSeleccionadaJohnson();
  const resultado = calcularJohnson();
  estadoJohnson.resultado = resultado;
  estadoJohnson.firma = firmaGrafoJohnson();
  estadoJohnson.pasoActual = 0;
  estadoJohnson.seleccion = null;

  if (resultado.tieneCicloNegativo) {
    estado.visualizacionJohnson = resultado.cicloNodos.length === 0 ? null : {
      origen: null, destino: null,
      nodos: resultado.cicloNodos,
      conexiones: resultado.cicloConexiones,
      distancia: null,
      tipo: 'ciclo',
      firma: estadoJohnson.firma
    };
    avisar('El grafo contiene un ciclo de peso negativo.', 'error');
  } else {
    estado.visualizacionJohnson = null;
    avisar('Cálculo completado: consulta el resultado en el grafo.', 'ok');
  }

  dibujarLienzo();
  cambiarVistaJohnson(destino || 'resultado');
  return true;
}

/* ---------------- Utilidades de tablas ---------------- */

function elemento(etiqueta, texto, clases) {
  const nodo = document.createElement(etiqueta);
  if (texto !== undefined && texto !== null) nodo.textContent = texto;
  if (clases) nodo.className = clases;
  return nodo;
}

/**
 * Tabla compacta dentro de su caja con desplazamiento propio.
 * @param {string[]} cabeceras
 * @param {Array<{th:string, celdas:Array<string|{texto:string, clase?:string}>, clase?:string}>} filas
 */
function tablaJohnson(cabeceras, filas, titulo) {
  const bloque = document.createElement('div');
  bloque.className = 'jn-tabla';
  if (titulo) bloque.appendChild(elemento('p', titulo, 'etiqueta'));

  const caja = elemento('div', null, 'tabla-caja');
  const tabla = elemento('table', null, 'tabla tabla-compacta');
  const thead = document.createElement('thead');
  const fila = document.createElement('tr');
  cabeceras.forEach(texto => { const th = elemento('th', texto); th.scope = 'col'; fila.appendChild(th); });
  thead.appendChild(fila);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  filas.forEach(f => {
    const tr = document.createElement('tr');
    if (f.clase) tr.className = f.clase;
    const th = elemento('th', f.th, 'fija');
    th.scope = 'row';
    tr.appendChild(th);
    f.celdas.forEach(c => {
      const dato = typeof c === 'object' && c !== null ? c : { texto: String(c) };
      tr.appendChild(elemento('td', dato.texto, dato.clase || ''));
    });
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);
  caja.appendChild(tabla);
  bloque.appendChild(caja);
  return bloque;
}

function nombreJn(r, indice) {
  return indice === r.cantidad ? 'q' : r.nombres[indice];
}

function claseNumero(valor) {
  return valor < 0 ? 'negativo' : '';
}

/* ---------------- Vista 2: matriz ---------------- */

function dibujarVistaMatrizJohnson() {
  actualizarMatriz();

  const n = estado.nodos.length;
  const m = estado.conexiones.length;
  const negativos = estado.conexiones.filter(c => c.valor < 0).length;
  const bucles = estado.conexiones.filter(c => c.desde === c.hacia).length;
  const ceros = estado.conexiones.filter(c => c.valor === 0).length;
  const conSalida = new Set(estado.conexiones.map(c => c.desde));
  const conEntrada = new Set(estado.conexiones.map(c => c.hacia));
  const aislados = estado.nodos.filter(nd => !conSalida.has(nd.id) && !conEntrada.has(nd.id)).length;

  const caja = vj.validacion;
  caja.replaceChildren();
  caja.appendChild(elemento('p', 'Revisión de los datos', 'etiqueta'));

  const lista = elemento('dl', null, 'jn-datos');
  [['Nodos', n], ['Conexiones', m], ['Pesos negativos', negativos], ['Pesos cero', ceros], ['Bucles', bucles], ['Nodos aislados', aislados]]
    .forEach(([dt, dd]) => { lista.appendChild(elemento('dt', dt)); lista.appendChild(elemento('dd', String(dd))); });
  caja.appendChild(lista);

  const mensajes = [];
  if (n < 2) mensajes.push(['error', 'Se necesitan al menos 2 nodos para calcular distancias entre pares.']);
  else {
    if (m === 0) mensajes.push(['aviso', 'No hay conexiones: todas las distancias fuera de la diagonal serán ∞.']);
    if (negativos > 0) mensajes.push(['info', 'Hay pesos negativos: Johnson los reponderará con Bellman-Ford. Si forman un ciclo negativo, se avisará y se indicará el ciclo.']);
    if (aislados > 0) mensajes.push(['aviso', 'Los nodos aislados tienen distancia 0 a sí mismos y ∞ a los demás.']);
    mensajes.push(['ok', 'Datos válidos: todos los pesos son enteros. Puedes calcular.']);
  }
  mensajes.forEach(([tipo, texto]) => caja.appendChild(elemento('div', texto, 'mensaje mensaje--' + tipo)));

  document.querySelectorAll('[data-accion="calcular"]').forEach(b => { b.disabled = n < 2; });
}

/* ---------------- Grafo de solo lectura ---------------- */

function marcadorMini(defs, id, color) {
  const marcador = crearSVG('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
  marcador.appendChild(crearSVG('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color }));
  defs.appendChild(marcador);
}

/**
 * Dibuja el grafo actual en un SVG propio, ajustado a su caja con viewBox.
 * @param {SVGElement} svg
 * @param {Object} op
 *   etiquetaConexion(conexion) → texto del peso mostrado
 *   claseConexion(conexion)    → clases extra ('conexion-johnson', 'ciclo-negativo-johnson', 'conexion-johnson-inactiva')
 *   claseNodo(nodo, indice)    → clases extra ('nodo-johnson', 'nodo-johnson-origen'…)
 *   notaNodo(nodo, indice)     → texto pequeño bajo el nodo (o null)
 *   auxiliar                   → dibuja el nodo q y sus conexiones de peso 0
 *   auxiliarResaltadas         → Set de índices de nodo cuya conexión desde q se resalta
 */
function dibujarGrafoMini(svg, op) {
  // La geometría de dibujo.js lee estado.nodos y el área del editor: durante el
  // dibujo se sustituyen por una copia compactada y se restauran siempre después.
  const originales = estado.nodos;
  const cajaOriginal = cajaSVG;
  try {
    estado.nodos = nodosCompactadosMini(svg, originales, op && op.visual);
    cajaSVG = { ancho: 1e6, alto: 1e6, izquierda: 0, arriba: 0 };
    dibujarGrafoMiniInterno(svg, op);
  } finally {
    estado.nodos = originales;
    cajaSVG = cajaOriginal;
  }
}

/**
 * Copia de los nodos con las posiciones acercadas entre sí para que, al ajustar el
 * dibujo a una caja pequeña, los nombres y los pesos se sigan leyendo. Nunca se
 * acercan tanto como para que dos nodos se toquen.
 */
function nodosCompactadosMini(svg, nodos, visual) {
  if (nodos.length === 0) return nodos;
  const r = radioVisualNodoJohnson(visual);
  const margen = r * 4;
  const caja = svg.getBoundingClientRect();
  const anchoCaja = caja.width > 50 ? caja.width : 600;
  const altoCaja = caja.height > 50 ? caja.height : 360;

  const xs = nodos.map(n => n.x), ys = nodos.map(n => n.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const bw = Math.max(1, Math.max(...xs) - minX), bh = Math.max(1, Math.max(...ys) - minY);

  let menor = Infinity;
  for (let i = 0; i < nodos.length; i++) {
    for (let j = i + 1; j < nodos.length; j++) {
      menor = Math.min(menor, Math.hypot(nodos[i].x - nodos[j].x, nodos[i].y - nodos[j].y));
    }
  }
  const consulta = visual && visual.valoresNodos;
  if (consulta && (menor < 1 || Math.max(bw, bh) / menor > nodos.length * 6)) {
    // Distribución visual estable: Resultado y Ampliar usan las mismas posiciones.
    const columnas = Math.max(1, Math.ceil(Math.sqrt(nodos.length)));
    return nodos.map((n, i) => ({ id: n.id, nombre: n.nombre, x: margen + (i % columnas) * r * 4, y: margen + Math.floor(i / columnas) * r * 4 }));
  }
  const kMinimo = menor === Infinity ? (consulta ? 1 : 0) : (r * (consulta ? 4 : 3.6)) / Math.max(menor, 1);
  const ajuste = Math.max(.1, Math.min((anchoCaja - margen * 2) / bw, (altoCaja - margen * 2) / bh));
  const k = consulta ? kMinimo : limitar(ajuste, Math.min(1, kMinimo), 1);

  return nodos.map(n => ({
    id: n.id,
    nombre: n.nombre,
    x: margen + (n.x - minX) * k,
    y: margen + (n.y - minY) * k
  }));
}

function dibujarGrafoMiniInterno(svg, op) {
  op = op || {};
  svg.replaceChildren();
  const prefijo = svg.id + '-';
  const defs = crearSVG('defs', {});
  marcadorMini(defs, prefijo + 'normal', 'var(--arista)');
  marcadorMini(defs, prefijo + 'ruta', 'var(--ruta)');
  marcadorMini(defs, prefijo + 'maximo', 'var(--jn-maximo)');
  marcadorMini(defs, prefijo + 'compartido', 'var(--jn-compartido)');
  marcadorMini(defs, prefijo + 'ciclo', 'var(--rojo)');
  marcadorMini(defs, prefijo + 'aux', 'var(--texto-apagado)');
  svg.appendChild(defs);

  if (estado.nodos.length === 0) { svg.setAttribute('viewBox', '0 0 100 60'); return; }

  const r = radioVisualNodoJohnson(op.visual);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  estado.nodos.forEach(n => {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  });

  let q = null;
  if (op.auxiliar) {
    q = { id: '__q', nombre: 'q', x: minX - r * 4.5, y: (minY + maxY) / 2 };
    minX = q.x;
  }

  // Margen para bucles (hasta 3 radios por encima o por debajo) y notas bajo los nodos.
  const margen = r * 3.3;
  const x0 = minX - margen, y0 = minY - margen;
  const ancho = Math.max(maxX - minX + margen * 2, r * 8);
  const alto = Math.max(maxY - minY + margen * 2, r * 6);
  svg.setAttribute('viewBox', [x0, y0, ancho, alto].map(v => Math.round(v)).join(' '));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const capaConexiones = crearSVG('g', {});
  const capaNodos = crearSVG('g', {});

  if (q) {
    estado.nodos.forEach((nodo, i) => {
      const inicio = puntoEnBorde(q, nodo.x, nodo.y, r);
      const fin = puntoEnBorde(nodo, q.x, q.y, r + SEPARACION_ARROW);
      const resaltada = op.auxiliarResaltadas && op.auxiliarResaltadas.has(i);
      const grupo = crearSVG('g', { class: 'conexion conexion-auxiliar' + (resaltada ? ' conexion-johnson' : '') });
      const linea = crearSVG('path', { class: 'conexion-linea', d: 'M ' + inicio.x + ' ' + inicio.y + ' L ' + fin.x + ' ' + fin.y });
      linea.style.markerEnd = 'url(#' + prefijo + (resaltada ? 'ruta' : 'aux') + ')';
      grupo.appendChild(linea);
      const t = crearSVG('text', { class: 'conexion-valor', x: inicio.x + (fin.x - inicio.x) * 0.3, y: inicio.y + (fin.y - inicio.y) * 0.3 - 8 });
      t.textContent = '0';
      grupo.appendChild(t);
      capaConexiones.appendChild(grupo);
    });
  }

  estado.conexiones.forEach(conexion => {
    const geo = geometriaConexion(conexion, r);
    if (!geo) return;
    const extras = op.claseConexion ? op.claseConexion(conexion) : [];
    const grupo = crearSVG('g', { class: ['conexion'].concat(extras).join(' ') });
    grupo.dataset.id = conexion.id;
    const linea = crearSVG('path', { class: 'conexion-linea', d: geo.d });
    const tipo = extras.includes('ciclo-negativo-johnson') ? 'ciclo' : extras.includes('jn-camino-compartido') ? 'compartido' : extras.includes('jn-camino-maximo') ? 'maximo' : extras.includes('conexion-johnson') ? 'ruta' : 'normal';
    linea.style.markerEnd = 'url(#' + prefijo + tipo + ')';
    grupo.appendChild(linea);
    const texto = crearSVG('text', { class: 'conexion-valor', x: geo.etiquetaX, y: geo.etiquetaY });
    texto.textContent = op.etiquetaConexion ? op.etiquetaConexion(conexion) : textoConexionJohnson(conexion, op.visual);
    grupo.appendChild(crearSVG('title', {})).textContent = describirConexionJohnson(conexion, op.visual);
    grupo.appendChild(texto);
    grupo.setAttribute('aria-label', describirConexionJohnson(conexion, op.visual));
    if (op.visual) aplicarEstiloConexionRutaJohnson(grupo, conexion, op.visual, svg);
    capaConexiones.appendChild(grupo);
  });

  const nodos = q ? estado.nodos.concat([q]) : estado.nodos;
  nodos.forEach((nodo, i) => {
    const esQ = nodo === q;
    const extras = esQ ? ['nodo-auxiliar'] : (op.claseNodo ? op.claseNodo(nodo, i) : []);
    const grupo = crearSVG('g', { class: ['nodo'].concat(extras).join(' ') });
    grupo.dataset.id = nodo.id;
    grupo.appendChild(crearSVG('circle', { cx: nodo.x, cy: nodo.y, r: r }));
    dibujarNombreNodoJohnson(grupo, nodo, r);
    if (op.visual) {
      dibujarCompartimentosNodoJohnson(grupo, nodo, op.visual);
      if (!esQ) decorarNodoRutaJohnson(grupo, nodo, op.visual);
      if (op.interactivo !== false) {
        grupo.setAttribute('role', 'button');
        grupo.setAttribute('tabindex', '0');
      }
    }
    const nota = !esQ && op.notaNodo ? op.notaNodo(nodo, i) : null;
    if (nota !== null && nota !== undefined) {
      const t = crearSVG('text', { class: 'nodo-nota', x: nodo.x, y: nodo.y - r - 12 });
      t.textContent = nota;
      grupo.appendChild(t);
    }
    capaNodos.appendChild(grupo);
  });

  svg.appendChild(capaConexiones);
  svg.appendChild(capaNodos);
  if (op.visual) separarEtiquetasGrafoJohnson(capaConexiones, capaNodos, op.visual);
  if (op.visual) agregarLeyendaConsultaJohnson(capaNodos, op.visual, capaConexiones);
  // Incluye las cajas reales de nombres, pesos, flechas y etiquetas de rol.
  // Se mide antes de añadir los controles HTML y sin tocar posiciones del editor.
  if (svg.getBoundingClientRect().width > 0) {
    const cajas = [capaConexiones, capaNodos].map(c => c.getBBox());
    const izquierda = Math.min(...cajas.map(c => c.x));
    const arriba = Math.min(...cajas.map(c => c.y));
    const derecha = Math.max(...cajas.map(c => c.x + c.width));
    const abajo = Math.max(...cajas.map(c => c.y + c.height));
    const borde = 32;
    svg.setAttribute('viewBox', [izquierda - borde, arriba - borde, Math.max(80, derecha - izquierda + borde * 2), Math.max(80, abajo - arriba + borde * 2)].join(' '));
  }
  // Vista completa de referencia para Ajustar, zoom, exportación e impresión.
  svg.dataset.vistaCompleta = svg.getAttribute('viewBox');
}

/* ---------------- Vista 3: resolución paso a paso ---------------- */

/**
 * Pasos mostrados en la resolución: los registrados por el cálculo más un último
 * paso de presentación que reconstruye la ruta activa de la consulta. Este paso
 * final depende de la selección (origen, destino, ruta); los anteriores no.
 */
function pasosResolucionJohnson(r) {
  if (!r) return [];
  if (r.tieneCicloNegativo) return r.pasos;
  return r.pasos.concat([{
    tipo: 'ruta',
    titulo: 'Reconstrucción de la ruta seleccionada',
    texto: 'Se recorre el camino elegido en la consulta con los pesos originales y se acumula tramo a tramo. El acumulado al llegar al destino debe coincidir con el costo total de la ruta. Este paso cambia con la selección de origen, destino y ruta; los pasos anteriores no.'
  }]);
}

function irAPasoJohnson(indice) {
  if (!resultadoVigenteJohnson()) return;
  const total = pasosResolucionJohnson(estadoJohnson.resultado).length;
  estadoJohnson.pasoActual = limitar(indice, 0, total - 1);
  dibujarResolucionJohnson();
}

/**
 * Visual de solo lectura para un paso del procedimiento, con la misma estructura
 * que el resultado (nodos en T, mismas posiciones y tipografía) pero con los
 * datos reales de la etapa. `casillas` fija las dos casillas de cada nodo.
 */
function visualPasoJohnson(r, casillas, leyenda, extras) {
  const valoresNodos = {};
  r.ids.forEach(id => { valoresNodos[id] = { minimo: null, maximo: null }; });
  return Object.assign({
    tipo: 'paso', origen: null, destino: null, nodos: [], conexiones: [],
    rutasMostradas: [], rutaSeleccionada: null,
    valoresNodos, casillas, leyenda, firma: estadoJohnson.firma
  }, extras || {});
}

function textoSinResultado() {
  return estadoJohnson.resultado
    ? 'El grafo cambió después del último cálculo: los pasos ya no corresponden a él. Vuelve a calcular.'
    : estado.nodos.length < 2
      ? 'Crea al menos dos nodos (o carga un ejemplo) y pulsa «Calcular Johnson».'
      : 'Todavía no se ha calculado. Pulsa «Calcular Johnson» para ver cada paso del algoritmo.';
}

function leyendaJohnson(items) {
  vj.leyenda.replaceChildren();
  items.forEach(([clase, texto]) => {
    const item = elemento('span', null, 'leyenda__item');
    item.appendChild(elemento('span', null, 'leyenda__muestra ' + clase));
    item.appendChild(document.createTextNode(texto));
    vj.leyenda.appendChild(item);
  });
  vj.leyenda.hidden = items.length === 0;
}

/** Tabla de aristas originales (paso 1). */
function tablaAristasOriginales(r) {
  if (r.aristasOriginales.length === 0) return elemento('div', 'El grafo no tiene conexiones.', 'mensaje mensaje--aviso');
  return tablaJohnson(['Conexión', 'w(u,v)'], r.aristasOriginales.map(a => ({
    th: nombreJn(r, a.desde) + ' → ' + nombreJn(r, a.hacia),
    celdas: [{ texto: String(a.peso), clase: claseNumero(a.peso) }]
  })), 'Conexiones del grafo');
}

function contenidoPasoJohnson(r, paso) {
  const tablas = [];
  let grafo = {};
  let leyenda = [];
  const fmt = v => formatearDistancia(v);
  // Casillas por nodo real (índice) y, opcionalmente, del nodo auxiliar q.
  const casillasDe = (porNodo, deQ) => {
    const casillas = {};
    r.ids.forEach((id, i) => { casillas[id] = porNodo(i); });
    if (deQ) casillas.__q = deQ;
    return casillas;
  };
  const porId = new Map(r.aristas.map(a => [a.id, a]));
  const etiquetaReponderada = c => (porId.has(c.id) ? "w'=" + porId.get(c.id).pesoReponderado : String(c.valor));
  const todasInactivas = () => ['conexion-johnson-inactiva'];

  switch (paso.tipo) {
    case 'original':
      grafo = {
        interactivo: false,
        claseConexion: () => [],
        claseNodo: () => [],
        visual: visualPasoJohnson(r, casillasDe(() => ({ valores: [null, null], rotulos: ['d', 'h'], etiquetas: ['Distancia desde q (pendiente)', 'Potencial h (pendiente)'], claves: ['provisional', 'potencial'] })), [
          'Grafo original: etiquetas con el peso w de cada conexión',
          'Arriba: nodo · d: distancia desde q · h: potencial',
          '—: todavía no calculado en esta etapa'
        ])
      };
      tablas.push(tablaAristasOriginales(r));
      break;

    case 'auxiliar': {
      const inicial = r.pasadas.length ? r.pasadas[0].antes : r.ids.map(() => Infinity);
      grafo = {
        interactivo: false,
        auxiliar: true, auxiliarResaltadas: new Set(r.nombres.map((_, i) => i)),
        claseConexion: () => [],
        claseNodo: () => [],
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [inicial[i], null], rotulos: ['d', 'h'], etiquetas: ['Distancia inicial desde q', 'Potencial h (pendiente)'], claves: ['provisional', 'potencial'] }),
          { valores: [0, null], rotulos: ['d', 'h'], etiquetas: ['Distancia de q a sí mismo', 'Potencial (no aplica)'], claves: ['provisional', 'potencial'] }), [
          'Nodo auxiliar q conectado a todos con peso 0',
          'd: distancia inicial desde q (∞ = aún no alcanzado; q = 0)',
          'h: potencial, pendiente hasta terminar Bellman-Ford (—)'
        ])
      };
      tablas.push(tablaJohnson(['Conexión nueva', 'w'], r.nombres.map(nombre => ({ th: 'q → ' + nombre, celdas: ['0'] })), 'Conexiones de q'));
      leyenda = [['leyenda__muestra--ruta', 'Conexiones nuevas desde q (peso 0)']];
      break;
    }

    case 'bellman': {
      const p = paso.pasada;
      const cambiados = new Set(p.relajaciones.filter(x => x.hacia < r.cantidad).map(x => x.hacia));
      const conexionesRelajadas = new Set(p.relajaciones.filter(x => x.id).map(x => x.id));
      const desdeQ = new Set(p.relajaciones.filter(x => x.desde === r.cantidad).map(x => x.hacia));
      grafo = {
        interactivo: false,
        auxiliar: true,
        auxiliarResaltadas: desdeQ,
        claseConexion: c => (conexionesRelajadas.has(c.id) ? ['conexion-johnson'] : []),
        claseNodo: (nodo, i) => (cambiados.has(i) ? ['nodo-johnson'] : []),
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [p.antes[i], p.despues[i]], rotulos: ['antes', 'después'], etiquetas: ['Distancia desde q antes de la pasada ' + p.numero, 'Distancia desde q después de la pasada ' + p.numero], claves: ['antes', cambiados.has(i) ? 'cambio' : 'despues'] }),
          { valores: [0, 0], rotulos: ['antes', 'después'], etiquetas: ['Distancia de q antes', 'Distancia de q después'], claves: ['antes', 'despues'] }), [
          'Bellman-Ford · pasada ' + p.numero + ': distancias provisionales desde q',
          'Izquierda: d antes de la pasada · Derecha: d después',
          'Conexión resaltada: mejoró una distancia · ∞: aún no alcanzado'
        ])
      };
      tablas.push(tablaJohnson(['Nodo v', 'd(v) antes', 'd(v) después'], r.nombres.map((nombre, i) => ({
        th: nombre,
        celdas: [
          { texto: fmt(p.antes[i]), clase: claseNumero(p.antes[i]) },
          { texto: fmt(p.despues[i]), clase: [claseNumero(p.despues[i]), cambiados.has(i) ? 'cambio' : ''].join(' ') }
        ]
      })), 'Distancias desde q'));
      if (p.relajaciones.length) {
        tablas.push(tablaJohnson(['Conexión', 'd(u) + w', 'Antes', 'Nuevo d(v)'], p.relajaciones.map(x => ({
          th: nombreJn(r, x.desde) + ' → ' + nombreJn(r, x.hacia),
          celdas: [x.base + ' + ' + formatearSumando(x.peso), fmt(x.anterior), { texto: String(x.nuevo), clase: 'cambio ' + claseNumero(x.nuevo) }]
        })), 'Mejoras (relajaciones) en esta pasada'));
      }
      leyenda = [['leyenda__muestra--ruta', 'Conexión que mejoró una distancia'], ['leyenda__muestra--caja leyenda__muestra--cambio', 'Distancia actualizada']];
      break;
    }

    case 'ciclo': {
      const nodosCiclo = new Set(r.cicloIndices);
      const conexionesCiclo = new Set(r.cicloConexiones);
      const ultima = r.pasadas.length ? r.pasadas[r.pasadas.length - 1].despues : r.ids.map(() => null);
      grafo = {
        interactivo: false,
        claseConexion: c => (conexionesCiclo.has(c.id) ? ['conexion-johnson', 'ciclo-negativo-johnson'] : ['conexion-johnson-inactiva']),
        claseNodo: (nodo, i) => (nodosCiclo.has(i) ? ['nodo-johnson', 'ciclo-negativo-johnson'] : []),
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [ultima[i], null], rotulos: ['d', 'h'], etiquetas: ['Última distancia provisional desde q', 'Potencial h (no existe: ciclo negativo)'], claves: ['provisional', 'potencial'] })), [
          'Ciclo de peso negativo: el cálculo se detiene',
          'd: última distancia provisional desde q (seguiría bajando)',
          'h: no existe un potencial válido (—)'
        ], { tipo: 'ciclo' })
      };
      if (r.cicloConexiones.length) {
        const filas = r.cicloConexiones.map(id => {
          const a = r.aristasOriginales.find(x => x.id === id);
          return { th: nombreJn(r, a.desde) + ' → ' + nombreJn(r, a.hacia), celdas: [{ texto: String(a.peso), clase: claseNumero(a.peso) }] };
        });
        filas.push({ th: 'Suma del ciclo', celdas: [{ texto: String(r.cicloPeso), clase: 'negativo cambio' }], clase: 'jn-fila-total' });
        tablas.push(tablaJohnson(['Conexión', 'w(u,v)'], filas, 'Ciclo: ' + r.ciclo.concat([r.ciclo[0]]).join(' → ')));
      }
      leyenda = [['leyenda__muestra--ciclo', 'Ciclo de peso negativo']];
      break;
    }

    case 'verificacion':
      grafo = {
        interactivo: false,
        claseConexion: () => [],
        claseNodo: () => [],
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [r.potenciales[i], r.potenciales[i]], rotulos: ['d(q,v)', 'h'], etiquetas: ['Distancia final desde q', 'Potencial h(v) = d(q,v)'], claves: ['provisional', 'potencial'] })), [
          'Potenciales: h(v) es la distancia final desde q',
          'Izquierda: d(q,v) definitiva · Derecha: h(v), el mismo valor por definición',
          'Siempre h(v) ≤ 0 porque q llega a todos con peso 0'
        ])
      };
      tablas.push(tablaJohnson(['Nodo v', 'h(v)'], r.nombres.map((nombre, i) => ({
        th: nombre, celdas: [{ texto: String(r.potenciales[i]), clase: claseNumero(r.potenciales[i]) }]
      })), 'Potenciales'));
      break;

    case 'reponderacion': {
      grafo = {
        interactivo: false,
        etiquetaConexion: c => (porId.has(c.id) ? 'w=' + c.valor + " · w'=" + porId.get(c.id).pesoReponderado : String(c.valor)),
        claseConexion: () => [],
        claseNodo: () => [],
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [r.potenciales[i], null], rotulos: ['h', '—'], etiquetas: ['Potencial h(v)', 'Sin dato en esta etapa'], claves: ['potencial', 'vacio'] })), [
          "Reponderación: w' = w + h(u) − h(v)",
          "Etiqueta de cada conexión: w original · w' reponderado",
          'Nodo: h(v) a la izquierda · la casilla derecha no tiene dato aquí (—)'
        ])
      };
      if (r.aristas.length) {
        tablas.push(tablaJohnson(['Conexión', 'w', 'h(u)', 'h(v)', "w' = w + h(u) − h(v)"], r.aristas.map(a => ({
          th: a.desde + ' → ' + a.hacia,
          celdas: [
            { texto: String(a.peso), clase: claseNumero(a.peso) },
            String(r.potenciales[a.indiceDesde]),
            String(r.potenciales[a.indiceHacia]),
            { texto: a.peso + ' + ' + formatearSumando(r.potenciales[a.indiceDesde]) + ' − ' + formatearSumando(r.potenciales[a.indiceHacia]) + ' = ' + a.pesoReponderado, clase: 'cambio' }
          ]
        })), 'Pesos reponderados'));
      } else {
        tablas.push(elemento('div', 'No hay conexiones que reponderar.', 'mensaje mensaje--aviso'));
      }
      leyenda = [['leyenda__muestra--normal', "Etiqueta de cada conexión: w original · w' reponderado"]];
      break;
    }

    case 'dijkstra': {
      const u = paso.origen;
      const arbol = new Set(r.predecesores[u].filter(Boolean).map(p => p.conexion));
      grafo = {
        interactivo: false,
        etiquetaConexion: etiquetaReponderada,
        claseConexion: c => (arbol.has(c.id) ? ['conexion-johnson'] : ['conexion-johnson-inactiva']),
        claseNodo: (nodo, i) => (i === u ? ['nodo-johnson', 'nodo-johnson-origen'] : r.distancias[u][i] !== Infinity ? ['nodo-johnson'] : ['nodo-johnson-inactivo']),
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [r.distanciasReponderadas[u][i], r.distancias[u][i]], rotulos: ["d'", 'd'], etiquetas: ["Distancia reponderada d'(" + r.nombres[u] + ',v)', 'Distancia recuperada d(' + r.nombres[u] + ",v) = d' − h(u) + h(v)"], claves: ['reponderada', 'recuperada'] })), [
          'Dijkstra desde ' + r.nombres[u] + " con pesos w'",
          "Izquierda: d' reponderada · Derecha: d = d' − h(u) + h(v)",
          'Conexión resaltada: árbol de caminos mínimos · ∞: sin camino'
        ], { origen: r.ids[u] })
      };
      tablas.push(tablaJohnson(['Destino v', "d'(u,v)", "d' − h(u) + h(v)", 'd(u,v)', 'Ruta'], r.nombres.map((nombre, v) => {
        const dp = r.distanciasReponderadas[u][v];
        const d = r.distancias[u][v];
        const ruta = reconstruirRutaJohnson(u, v, r);
        return {
          th: nombre,
          celdas: [
            fmt(dp),
            dp === Infinity ? '—' : dp + ' − ' + formatearSumando(r.potenciales[u]) + ' + ' + formatearSumando(r.potenciales[v]),
            { texto: fmt(d), clase: d === Infinity ? 'apagado' : 'cambio ' + claseNumero(d) },
            { texto: ruta ? ruta.indices.map(i => r.nombres[i]).join(' → ') : 'sin camino', clase: ruta ? 'jn-ruta-celda' : 'apagado' }
          ]
        };
      }), 'Desde u = ' + r.nombres[u]));
      leyenda = [['leyenda__muestra--origen', 'Origen'], ['leyenda__muestra--ruta', 'Árbol de caminos mínimos'], ['leyenda__muestra--normal', "Etiquetas: pesos w'"]];
      break;
    }

    case 'final': {
      // La matriz es histórica; los nodos muestran la fila del origen y la columna
      // del destino de la consulta actual, que son valores reales de esa matriz.
      const sel = estadoJohnson.seleccion || { origen: 0, destino: r.cantidad - 1 };
      const o = sel.origen, d = sel.destino;
      grafo = {
        interactivo: false,
        claseConexion: () => [],
        claseNodo: (nodo, i) => (i === o ? ['nodo-johnson', 'nodo-johnson-origen'] : i === d ? ['nodo-johnson', 'nodo-johnson-destino'] : []),
        visual: visualPasoJohnson(r, casillasDe(i => ({ valores: [r.distancias[o][i], r.distancias[i][d]], rotulos: ['desde ' + r.nombres[o], 'hasta ' + r.nombres[d]], etiquetas: ['Distancia mínima desde ' + r.nombres[o] + ' (fila de la matriz)', 'Distancia mínima hasta ' + r.nombres[d] + ' (columna de la matriz)'], claves: ['recuperada', 'recuperada'] })), [
          'Matriz de distancias mínimas con pesos originales recuperados',
          'Izquierda: d(' + r.nombres[o] + ', v) · Derecha: d(v, ' + r.nombres[d] + ') · ∞: sin camino',
          'Par de la consulta actual: ' + r.nombres[o] + ' → ' + r.nombres[d] + ' = ' + fmt(r.distancias[o][d])
        ], { origen: r.ids[o], destino: r.ids[d] })
      };
      tablas.push(construirTablaDistancias(r, false));
      break;
    }

    case 'ruta': {
      // Mismo visual que el resultado: ruta activa, colores, pesos y destino.
      const sel = estadoJohnson.seleccion || { origen: 0, destino: r.cantidad - 1 };
      const vigente = estado.visualizacionJohnson && estado.visualizacionJohnson.firma === estadoJohnson.firma && estado.visualizacionJohnson.valoresNodos;
      if (!vigente) actualizarConsultaRutaJohnson(sel.origen, sel.destino);
      const visual = estado.visualizacionJohnson;
      grafo = {
        interactivo: false,
        visual: visual,
        claseConexion: c => clasesJohnsonConexion(c, visual),
        claseNodo: nodo => clasesJohnsonNodo(nodo, visual)
      };
      const caja = elemento('div', null, 'jn-ruta');
      construirConsultaDetalleJohnson(caja);
      tablas.push(caja);
      const consulta = consultaCaminosJohnson;
      const activa = visual && visual.rutaSeleccionada;
      leyenda = consulta.vista === 'temporal'
        ? [['leyenda__muestra--ruta', 'Vista activa: Tiempos y holguras (temprano | tardío). Cambia a Consulta de caminos para reconstruir una ruta.']]
        : activa ? [['leyenda__muestra--ruta', 'Ruta activa: ' + (activa.titulo || activa.id) + ' · destino Acum. | Total']]
          : [['leyenda__muestra--normal', consulta.comparar ? 'Sin ruta única activa: comparación Rmín / Rmáx, destino mín | máx' : 'Sin ruta activa: destino mín | máx']];
      break;
    }
  }
  return { tablas: tablas, grafo: grafo, leyenda: leyenda };
}

function dibujarResolucionJohnson() {
  const vigente = resultadoVigenteJohnson();
  vj.resolucionSin.hidden = vigente;
  vj.resolucionCon.hidden = !vigente;
  document.querySelectorAll('#vistaResolucionJn [data-ir="resultado"]').forEach(b => { b.disabled = !vigente; });
  if (!vigente) {
    vj.resolucionSin.querySelector('p').textContent = textoSinResultado();
    document.querySelectorAll('[data-accion="calcular"]').forEach(b => { b.disabled = estado.nodos.length < 2; });
    return;
  }

  const r = estadoJohnson.resultado;
  const pasos = pasosResolucionJohnson(r);
  estadoJohnson.pasoActual = limitar(estadoJohnson.pasoActual, 0, pasos.length - 1);
  const actual = estadoJohnson.pasoActual;
  const paso = pasos[actual];

  vj.indicador.textContent = 'Paso ' + (actual + 1) + ' de ' + pasos.length;
  vj.btnAnterior.disabled = actual === 0;
  vj.btnSiguiente.disabled = actual === pasos.length - 1;
  vj.btnReiniciar.disabled = actual === 0;
  vj.titulo.textContent = paso.titulo;
  vj.texto.textContent = paso.texto;

  const contenido = contenidoPasoJohnson(r, paso);
  dibujarGrafoMini(vj.svgPaso, contenido.grafo);
  vj.tablas.replaceChildren(...contenido.tablas);
  leyendaJohnson(contenido.leyenda);

  vj.lista.replaceChildren();
  pasos.forEach((p, i) => {
    const li = document.createElement('li');
    const btn = elemento('button', (i + 1) + '. ' + p.titulo, 'procedimiento__salto' + (i === actual ? ' activo' : ''));
    btn.type = 'button';
    if (i === actual) btn.setAttribute('aria-current', 'step');
    btn.addEventListener('click', () => irAPasoJohnson(i));
    li.appendChild(btn);
    vj.lista.appendChild(li);
  });
  const activo = vj.lista.querySelector('.activo');
  if (activo && vj.lista.scrollHeight > vj.lista.clientHeight) {
    vj.lista.scrollTop = activo.offsetTop - vj.lista.clientHeight / 2;
  }
}

/* ---------------- Vista 4: resultado ---------------- */

/** Texto del aria-label de una celda, según lo que representa. */
function etiquetaCeldaJohnson(resultado, origen, destino) {
  const desde = resultado.nombres[origen];
  const hacia = resultado.nombres[destino];
  const valor = resultado.distancias[origen][destino];

  if (valor === Infinity) return 'No existe camino desde ' + desde + ' hasta ' + hacia;
  if (origen === destino) return 'Ver el nodo ' + desde + ', distancia 0';
  return 'Ver ruta mínima de ' + desde + ' hasta ' + hacia + ', distancia ' + valor;
}

/**
 * Tabla de distancias mínimas (fila = origen, columna = destino).
 * Con `pulsable`, cada celda del cuerpo se puede activar (puntero o teclado)
 * para ver su ruta; las cabeceras no, porque no representan ninguna ruta.
 */
function construirTablaDistancias(resultado, pulsable) {
  const tabla = document.createElement('table');

  const cabecera = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  filaCabecera.appendChild(crearCelda('th', '', 'esquina'));
  resultado.nombres.forEach(nombre => filaCabecera.appendChild(crearCelda('th', nombre)));
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement('tbody');
  resultado.nombres.forEach((nombre, origen) => {
    const linea = document.createElement('tr');
    linea.appendChild(crearCelda('th', nombre, 'fila'));

    resultado.distancias[origen].forEach((valor, destino) => {
      const hayCamino = valor !== Infinity;
      const clases = [hayCamino ? 'valor' : 'sin-camino'];
      if (hayCamino && valor < 0) clases.push('negativo');
      if (origen === destino) clases.push('diagonal');
      if (pulsable) clases.push(hayCamino ? 'celda-ruta' : 'celda-sin-ruta');
      const sel = estadoJohnson.seleccion;
      if (pulsable && sel && sel.origen === origen && sel.destino === destino) clases.push('celda-elegida');

      const celda = crearCelda('td', formatearDistancia(valor), clases.join(' '));
      if (pulsable) {
        celda.tabIndex = 0;
        celda.setAttribute('role', 'button');
        celda.setAttribute('aria-label', etiquetaCeldaJohnson(resultado, origen, destino));
        celda.dataset.origen = origen;
        celda.dataset.destino = destino;
      }
      linea.appendChild(celda);
    });

    cuerpo.appendChild(linea);
  });
  tabla.appendChild(cuerpo);

  if (!pulsable) {
    const caja = elemento('div', null, 'tabla-datos tabla-datos--paso');
    caja.appendChild(tabla);
    return caja;
  }
  return tabla;
}

/** Una celda de la matriz siempre consulta el mínimo de Johnson. */
function seleccionarCeldaJohnson(origen, destino) {
  consultaCaminosJohnson.vista = 'caminos';
  consultaCaminosJohnson.seleccionRutaId = 'minimo';
  consultaCaminosJohnson.objetivo = 'minimo';
  consultaCaminosJohnson.comparar = false;
  mostrarConsultaRutaJohnson(origen, destino);
}

function textoRecorridoJohnson(r, ruta) {
  return ruta.indices.map(i => r.nombres[i]).join(' → ');
}

/** Explica y valida cada conexión por ID usando sus pesos originales. */
function prepararRecorridoRutaJohnson(r, ruta) {
  const originales = new Map(r.aristasOriginales.map(a => [a.id, a]));
  const acumuladas = [0];
  const pesos = ruta.conexiones.map((id, i) => {
    const arista = originales.get(id);
    if (!arista || arista.desde !== ruta.indices[i] || arista.hacia !== ruta.indices[i + 1]) throw new Error('La ruta contiene una conexión inconsistente.');
    acumuladas.push(acumuladas[i] + arista.peso);
    return arista.peso;
  });
  if (acumuladas[acumuladas.length - 1] !== ruta.distancia) throw new Error('El acumulado de los pesos originales (' + acumuladas[acumuladas.length - 1] + ') no coincide con el costo esperado (' + ruta.distancia + ').');
  return { ruta: ruta, pesos: pesos, acumuladas: acumuladas };
}

/**
 * Modelo (pesos y acumulados) de cualquier ruta disponible. Las principales ya lo
 * traen; las alternativas se validan aquí contra las conexiones originales.
 * Devuelve el error en texto en lugar de lanzarlo, para mostrarlo en la interfaz.
 */
function modeloRutaJohnson(r, ruta) {
  if (!ruta) return { modelo: null, error: null };
  if (ruta.modelo) return { modelo: ruta.modelo, error: null };
  try {
    const indices = ruta.indices || ruta.nodos.map(id => r.ids.indexOf(id));
    return { modelo: prepararRecorridoRutaJohnson(r, Object.assign({}, ruta, { indices })), error: null };
  } catch (error) {
    return { modelo: null, error: 'Ruta ' + (ruta.titulo || ruta.id) + ': ' + error.message + ' No se muestran valores en el destino.' };
  }
}

function numeroRutaJohnson(numero) {
  if (numero === null || numero === undefined) return '—';
  if (numero === Infinity || numero === -Infinity) return 'Sin camino';
  return String(numero).replace(/^-/, '−');
}

function rutasDisponiblesJohnson() {
  const c = consultaCaminosJohnson;
  const rutas = [];
  if (c.minimo) rutas.push(Object.assign({ id: 'minimo', titulo: 'Rmín · Johnson', color: 'var(--ruta)', modelo: c.minimo }, c.minimo.ruta));
  if (c.maximo) rutas.push(Object.assign({ id: 'maximo', titulo: 'Rmáx · DAG', color: 'var(--jn-maximo)', modelo: c.maximo }, c.maximo.ruta));
  c.alternativas.forEach((ruta, i) => rutas.push(Object.assign({ titulo: 'A' + (i + 1), color: ['var(--jn-alternativa-1)', 'var(--jn-alternativa-2)', 'var(--jn-alternativa-3)'][i % 3] }, ruta)));
  return rutas;
}

function cancelarBusquedaCaminosJohnson() {
  if (consultaCaminosJohnson.busqueda) consultaCaminosJohnson.busqueda.cancelada = true;
}

function actualizarConsultaRutaJohnson(origen, destino) {
  const r = estadoJohnson.resultado;
  if (!resultadoVigenteJohnson() || !Number.isInteger(origen) || !Number.isInteger(destino) || !r.ids[origen] || !r.ids[destino]) return false;
  const consulta = consultaCaminosJohnson;
  const par = JSON.stringify([estadoJohnson.firma, origen, destino]);
  if (consulta.alternativasPar !== par) {
    cancelarBusquedaCaminosJohnson();
    consulta.alternativas = []; consulta.avisoBusqueda = '';
    consulta.seleccionRutaId = consulta.comparar ? null : consulta.objetivo;
    consulta.alternativasPar = par;
  }
  estadoJohnson.seleccion = { origen, destino };
  const idOrigen = r.ids[origen];
  if (!consulta.cacheMaximos.has(idOrigen)) consulta.cacheMaximos.set(idOrigen, calcularMaximosDAGJohnson(estado.nodos, estado.conexiones, idOrigen));
  consulta.maximos = consulta.cacheMaximos.get(idOrigen);
  const minimo = reconstruirRutaJohnson(origen, destino, r);
  const maximo = reconstruirMaximoDAGJohnson(r.ids[destino], consulta.maximos);
  consulta.minimo = minimo ? prepararRecorridoRutaJohnson(r, minimo) : null;
  consulta.maximo = maximo ? prepararRecorridoRutaJohnson(r, maximo) : null;
  consulta.comparar = consulta.comparar && !!minimo && !!maximo;
  const disponibles = rutasDisponiblesJohnson();
  // Una selección nula explícita conserva la ruta desactivada al redibujar.
  // Un nuevo par o un cambio de objetivo sí intenta activar su ruta.
  if (consulta.seleccionRutaId !== null && !disponibles.some(ruta => ruta.id === consulta.seleccionRutaId)) consulta.seleccionRutaId = consulta.comparar ? null : consulta.objetivo;
  const elegida = disponibles.find(ruta => ruta.id === consulta.seleccionRutaId) || null;
  // Comparar mantiene los dos motores principales y, como máximo, la alternativa
  // elegida. La lista puede ser mayor sin convertir el grafo en decenas de trazos.
  const rutas = consulta.comparar ? disponibles.filter(ruta => ruta.id === 'minimo' || ruta.id === 'maximo' || ruta.id === consulta.seleccionRutaId) : elegida ? [elegida] : [];
  const valoresNodos = {};
  r.ids.forEach((id, i) => {
    valoresNodos[id] = { minimo: r.tieneCicloNegativo ? null : r.distancias[origen][i], maximo: consulta.maximos.aciclico ? consulta.maximos.distancias[i] : null };
  });
  // El destino de una ruta activa muestra el acumulado de sus tramos (pesos
  // originales) junto al costo total. Deben coincidir; si no, se informa el error
  // en lugar de copiar un número en las dos casillas.
  const activa = elegida ? modeloRutaJohnson(r, elegida) : { modelo: null, error: null };
  consulta.modeloActivo = activa.modelo;
  consulta.errorRutaActiva = activa.error;
  const casillas = {};
  if (elegida && !r.tieneCicloNegativo) {
    const acumulado = activa.modelo ? activa.modelo.acumuladas[activa.modelo.acumuladas.length - 1] : null;
    casillas[r.ids[destino]] = {
      valores: [acumulado, activa.modelo ? elegida.distancia : null],
      rotulos: ['Acum.', 'Total'],
      etiquetas: ['Acumulado de la ruta ' + (elegida.titulo || elegida.id), 'Costo total de la ruta ' + (elegida.titulo || elegida.id)],
      claves: ['acumulado', 'total']
    };
  }
  const visual = {
    tipo: r.tieneCicloNegativo ? 'ciclo' : consulta.comparar ? 'comparacion' : rutas.length ? 'ruta' : 'consulta',
    objetivo: consulta.comparar ? 'comparar' : consulta.objetivo,
    origen: idOrigen, destino: r.ids[destino],
    nodos: r.tieneCicloNegativo ? r.cicloNodos : Array.from(new Set(rutas.flatMap(ruta => ruta.nodos))),
    conexiones: r.tieneCicloNegativo ? r.cicloConexiones : Array.from(new Set(rutas.flatMap(ruta => ruta.conexiones))),
    minimoConexiones: rutas.some(ruta => ruta.id === 'minimo') && minimo ? minimo.conexiones : [],
    maximoConexiones: rutas.some(ruta => ruta.id === 'maximo') && maximo ? maximo.conexiones : [],
    nodosMinimos: rutas.some(ruta => ruta.id === 'minimo') && minimo ? minimo.nodos : [],
    nodosMaximos: rutas.some(ruta => ruta.id === 'maximo') && maximo ? maximo.nodos : [],
    rutasMostradas: rutas, rutaSeleccionada: elegida,
    valoresNodos, casillas, errorRuta: activa.error,
    distancia: elegida ? elegida.distancia : null, firma: estadoJohnson.firma
  };
  consulta.temporal = null;
  if (consulta.vista === 'temporal') {
    const temporal = calcularTiemposHolgurasJohnson(estado.nodos, estado.conexiones, idOrigen, r.ids[destino]);
    consulta.temporal = temporal;
    visual.vistaTemporal = true; visual.temporal = temporal;
    visual.rutasMostradas = []; visual.rutaSeleccionada = null;
    // Los tiempos no se sustituyen por el costo de ninguna ruta.
    visual.casillas = {}; visual.errorRuta = null;
    visual.minimoConexiones = []; visual.maximoConexiones = []; visual.nodosMinimos = []; visual.nodosMaximos = [];
    const criticas = new Set(temporal.criticas);
    visual.nodos = temporal.valido ? Array.from(new Set(estado.conexiones.filter(c => criticas.has(c.id)).flatMap(c => [c.desde, c.hacia]))) : [];
    visual.conexiones = temporal.valido ? temporal.criticas : [];
    visual.distancia = temporal.valido ? temporal.duracion : null;
    visual.tipo = 'temporal';
    r.ids.forEach((id, i) => { visual.valoresNodos[id] = { minimo: temporal.valido ? temporal.tempranos[i] : null, maximo: temporal.valido ? temporal.tardios[i] : null }; });
  }
  estado.visualizacionJohnson = visual;
  return true;
}

function mostrarConsultaRutaJohnson(origen, destino) {
  if (!actualizarConsultaRutaJohnson(origen, destino)) return;
  dibujarLienzo();
  sincronizarSelectoresRutaJohnson();
  el.johnsonTabla.querySelectorAll('td.celda-elegida').forEach(td => td.classList.remove('celda-elegida'));
  const celda = el.johnsonTabla.querySelector('td[data-origen="' + origen + '"][data-destino="' + destino + '"]');
  if (celda) celda.classList.add('celda-elegida');
  dibujarRutaResultadoJohnson();
  actualizarPanelRutaEditorJohnson(true);
  if (estadoJohnson.vista === 'grafo') ajustarVistaRutaJohnson();
  // El último paso del procedimiento representa la ruta activa: se actualiza con ella.
  if (estadoJohnson.vista === 'resolucion') dibujarResolucionJohnson();
}

function sincronizarSelectoresRutaJohnson() {
  const r = estadoJohnson.resultado;
  const sel = estadoJohnson.seleccion;
  if (!r || !sel) return;
  ['jnOrigenRuta', 'jnDestinoRuta'].forEach((id, i) => {
    const select = document.getElementById(id);
    const firma = JSON.stringify([r.ids, r.nombres]);
    if (select.dataset.nombres !== firma) {
      select.replaceChildren();
      r.nombres.forEach((nombre, indice) => {
        const opcion = elemento('option', nombre); opcion.value = indice; select.appendChild(opcion);
      });
      select.dataset.nombres = firma;
    }
    select.value = i === 0 ? sel.origen : sel.destino;
  });
  const consulta = consultaCaminosJohnson;
  const objetivo = document.getElementById('jnObjetivoRuta');
  objetivo.value = consulta.objetivo;
  objetivo.querySelector('[value="maximo"]').disabled = !consulta.maximos.aciclico;
  const comparar = document.getElementById('jnCompararRutas');
  comparar.disabled = !consulta.minimo || !consulta.maximo;
  comparar.checked = consulta.comparar;
  document.getElementById('jnVistaAnalisis').value = consulta.vista;
  document.getElementById('jnLeyendaCaminos').hidden = consulta.vista === 'temporal';
  objetivo.disabled = consulta.vista === 'temporal';
  comparar.disabled = consulta.vista === 'temporal' || !consulta.minimo || !consulta.maximo;
  document.getElementById('jnLeyendaValores').textContent = consulta.vista === 'temporal'
    ? 'Tiempos y holguras: nombre arriba; temprano a la izquierda y tardío a la derecha. H = holgura de actividad. Destino T | T. Elementos excluidos atenuados.'
    : 'Consulta de caminos: nombre arriba; mínimo a la izquierda y máximo DAG a la derecha, ambos desde el origen. Destino con ruta activa: Acum. (suma de pesos originales de sus tramos) | Total (costo de esa ruta). Sin ruta única activa el destino conserva mín | máx. ∞: sin camino; —: sin dato o máximo no disponible por ciclos.';
  document.getElementById('jnBuscarAlternativas').disabled = consulta.vista === 'temporal' || r.tieneCicloNegativo || !!consulta.busqueda;
  document.getElementById('jnCancelarAlternativas').hidden = !consulta.busqueda;
  document.getElementById('jnEstadoAlternativas').textContent = consulta.avisoBusqueda;
  document.getElementById('jnAvisoMaximo').textContent = consulta.maximos.aciclico
    ? 'Máximos disponibles. En caso de empate se muestra una ruta representativa según el orden de los datos.'
    : 'Máximo no disponible: esta versión requiere que todo el grafo sea acíclico. Un ciclo no implica automáticamente un máximo infinito.';
}

function construirDetalleRutaJohnson(contenedor, modelo, objetivo) {
  const r = estadoJohnson.resultado;
  const ruta = modelo.ruta;
  const nombres = ruta.indices.map(i => r.nombres[i]);
  const bloque = elemento('article', null, 'jn-detalle-ruta jn-detalle-ruta--' + objetivo + ' jn-camino-' + objetivo);
  bloque.appendChild(elemento('h3', objetivo === 'maximo' ? 'Rmáx · Camino máximo · recorrido topológico' : objetivo === 'minimo' ? 'Rmín · Camino mínimo · Johnson' : 'Alternativa seleccionada · ' + ruta.id));
  const secuencia = elemento('p', nombres.join(' → '), 'jn-ruta__recorrido');
  secuencia.tabIndex = 0;
  secuencia.setAttribute('aria-label', 'Secuencia completa: ' + nombres.join(' → '));
  bloque.appendChild(secuencia);
  const suma = modelo.pesos.length ? modelo.pesos.map(p => p < 0 ? '(' + numeroRutaJohnson(p) + ')' : String(p)).join(' + ') + ' = ' + numeroRutaJohnson(ruta.distancia) : 'Mismo nodo: 0 = 0';
  bloque.appendChild(elemento('p', suma, 'jn-ruta__suma'));
  bloque.appendChild(elemento('p', 'Costo total: ' + numeroRutaJohnson(ruta.distancia), 'jn-ruta__total'));
  const caja = elemento('div', null, 'jn-ruta__tabla');
  caja.tabIndex = 0;
  caja.setAttribute('role', 'region');
  caja.setAttribute('aria-label', 'Pesos originales y acumulado de la ruta elegida');
  const tabla = elemento('table', null, 'tabla tabla-compacta');
  const cabecera = elemento('thead');
  const fila = elemento('tr');
  ['Recorrido elegido', 'Peso original', 'Acumulado de esta ruta'].forEach(t => {
    const th = elemento('th', t); th.scope = 'col'; fila.appendChild(th);
  });
  cabecera.appendChild(fila); tabla.appendChild(cabecera);
  const cuerpo = elemento('tbody');
  nombres.forEach((nombre, i) => {
    const tr = elemento('tr');
    const th = elemento('th', i === 0 ? '0 · ' + nombre + ' (origen)' : i + ' · ' + nombres[i - 1] + ' → ' + nombre);
    th.scope = 'row'; tr.appendChild(th);
    tr.appendChild(elemento('td', i === 0 ? '—' : numeroRutaJohnson(modelo.pesos[i - 1])));
    tr.appendChild(elemento('td', numeroRutaJohnson(modelo.acumuladas[i])));
    cuerpo.appendChild(tr);
  });
  tabla.appendChild(cuerpo); caja.appendChild(tabla); bloque.appendChild(caja);
  contenedor.appendChild(bloque);
}

function construirProcedimientoMaximoJohnson(contenedor) {
  const maximos = consultaCaminosJohnson.maximos;
  if (!maximos || !maximos.aciclico) return;
  const r = estadoJohnson.resultado;
  const bloque = elemento('details', null, 'jn-procedimiento-maximo');
  bloque.appendChild(elemento('summary', 'Operaciones reales de maximización · recorrido topológico'));
  bloque.appendChild(elemento('p', 'Inicialización: origen = 0; los demás = −∞ (aún sin camino). Se recorren los nodos en orden topológico y se conserva el mayor candidato. En los empates se mantiene el primer predecesor.', 'tarjeta__pista'));
  bloque.appendChild(elemento('p', 'Orden: ' + maximos.orden.map(i => r.nombres[i]).join(' → '), 'jn-ruta__recorrido'));
  const filas = maximos.operaciones.map(op => ({
    th: r.nombres[op.desde] + ' → ' + r.nombres[op.hacia],
    celdas: [op.anterior === -Infinity ? '−∞' : numeroRutaJohnson(op.anterior), numeroRutaJohnson(op.candidato - op.peso) + ' + ' + (op.peso < 0 ? '(' + numeroRutaJohnson(op.peso) + ')' : op.peso) + ' = ' + numeroRutaJohnson(op.candidato), numeroRutaJohnson(op.actual), op.mejora ? 'Actualiza' : 'Conserva']
  }));
  bloque.appendChild(tablaJohnson(['Arista', 'Anterior', 'Candidato con peso original', 'Máximo', 'Decisión'], filas));
  contenedor.appendChild(bloque);
}

/** Detalle compartido por resultado y editor; los acumulados se distinguen de las distancias de los nodos. */
function construirConsultaDetalleJohnson(contenedor) {
  contenedor.replaceChildren();
  const r = estadoJohnson.resultado;
  const sel = estadoJohnson.seleccion;
  if (!r || !sel) return;
  const consulta = consultaCaminosJohnson;
  if (consulta.vista === 'temporal') { construirDetalleTemporalJohnson(contenedor); return; }
  const disponibles = rutasDisponiblesJohnson();
  const elegida = disponibles.find(ruta => ruta.id === consulta.seleccionRutaId) || null;
  const alternativaElegida = consulta.alternativas.find(ruta => ruta.id === consulta.seleccionRutaId);
  const modeloActivo = consulta.modeloActivo && elegida ? consulta.modeloActivo : null;
  contenedor.appendChild(elemento('p', 'Objetivo: ' + (consulta.comparar ? 'Comparar mínimo y máximo' : consulta.objetivo === 'maximo' ? 'Maximizar' : 'Minimizar') + ' · Origen: ' + r.nombres[sel.origen] + ' · Destino: ' + r.nombres[sel.destino], 'jn-ruta__cabecera'));
  if (!r.tieneCicloNegativo) {
    const activa = elemento('p', null, 'jn-ruta__activa');
    if (elegida && modeloActivo) {
      const acumulado = modeloActivo.acumuladas[modeloActivo.acumuladas.length - 1];
      activa.appendChild(elemento('strong', 'Ruta activa: ' + (elegida.titulo || elegida.id)));
      activa.appendChild(document.createTextNode(' · ' + textoRecorridoJohnson(r, modeloActivo.ruta) + ' · Destino ' + r.nombres[sel.destino] + ': Acum. ' + numeroRutaJohnson(acumulado) + ' | Total ' + numeroRutaJohnson(elegida.distancia) + '.'));
    } else if (elegida && consulta.errorRutaActiva) {
      activa.className = 'mensaje mensaje--error';
      activa.textContent = 'Ruta activa inconsistente. ' + consulta.errorRutaActiva;
    } else if (consulta.comparar) {
      activa.appendChild(elemento('strong', 'Sin ruta única activa'));
      activa.appendChild(document.createTextNode(' · Se comparan Rmín y Rmáx; el destino conserva mínimo | máximo. Elige una ruta de la lista para ver su acumulado y total.'));
    } else {
      activa.appendChild(elemento('strong', 'Sin ruta activa'));
      activa.appendChild(document.createTextNode(' · El destino conserva sus distancias reales.'));
    }
    contenedor.appendChild(activa);
  }
  if (r.tieneCicloNegativo) {
    contenedor.appendChild(avisoCicloNegativo(r));
    if (r.ciclo.length) contenedor.appendChild(elemento('p', r.ciclo.concat([r.ciclo[0]]).join(' → ') + ' · suma: ' + numeroRutaJohnson(r.cicloPeso), 'jn-ruta__recorrido jn-ruta__recorrido--ciclo'));
  } else if (consulta.objetivo === 'maximo' && !consulta.maximos.aciclico && !alternativaElegida) {
    contenedor.appendChild(elemento('p', 'La maximización de esta versión requiere un grafo dirigido sin ciclos.', 'mensaje mensaje--aviso'));
  } else if (consulta.comparar) {
    const comparacion = elemento('div', null, 'jn-detalle-comparacion');
    construirDetalleRutaJohnson(comparacion, consulta.minimo, 'minimo');
    construirDetalleRutaJohnson(comparacion, consulta.maximo, 'maximo');
    contenedor.appendChild(comparacion);
    if (JSON.stringify(consulta.minimo.ruta.conexiones) === JSON.stringify(consulta.maximo.ruta.conexiones)) contenedor.appendChild(elemento('p', 'El mínimo y el máximo comparten el mismo recorrido.', 'mensaje mensaje--ok'));
    if (alternativaElegida && modeloActivo) construirDetalleRutaJohnson(contenedor, modeloActivo, alternativaElegida.id);
  } else if (modeloActivo) {
    construirDetalleRutaJohnson(contenedor, modeloActivo, elegida.id);
  } else if (!elegida) {
    contenedor.appendChild(elemento('p', disponibles.length ? 'Selecciona una ruta de la lista para ver sus tramos, acumulado y total.' : 'No existe un camino entre estos vértices', 'mensaje mensaje--aviso'));
  }
  contenedor.appendChild(elemento('p', 'En cada nodo se muestran sus distancias mínima y máxima generales desde el origen. El destino de la ruta activa muestra Acum. (suma de los pesos originales de sus tramos) y Total (costo de esa ruta): deben coincidir. La tabla de tramos indica el acumulado exclusivo de la ruta elegida. Se muestra una ruta representativa por objetivo; puede haber empates.', 'tarjeta__pista'));
  const valores = elemento('details', null, 'jn-procedimiento-maximo');
  valores.appendChild(elemento('summary', 'Distancias mínimas y máximas desde ' + r.nombres[sel.origen]));
  valores.appendChild(tablaJohnson(['Nodo', 'Mínimo · Johnson', 'Máximo · acíclico'], r.ids.map((id, i) => ({ th: r.nombres[i], celdas: [numeroRutaJohnson(estado.visualizacionJohnson.valoresNodos[id].minimo), numeroRutaJohnson(estado.visualizacionJohnson.valoresNodos[id].maximo)] }))));
  contenedor.appendChild(valores);
  construirListaRutasJohnson(contenedor);
  if (consulta.comparar || consulta.objetivo === 'maximo') construirProcedimientoMaximoJohnson(contenedor);
}

function construirListaRutasJohnson(contenedor) {
  const consulta = consultaCaminosJohnson;
  const disponibles = rutasDisponiblesJohnson();
  if (!disponibles.length) return;
  const lista = elemento('div', null, 'jn-lista-rutas');
  lista.setAttribute('aria-label', 'Seleccionar ruta para destacar');
  disponibles.forEach(ruta => {
    const nombres = ruta.nodos.map(id => buscarNodo(id).nombre).join(' → ');
    const boton = elemento('button', null, 'btn btn-neutral jn-elegir-ruta');
    boton.type = 'button'; boton.dataset.rutaJohnson = ruta.id;
    boton.style.setProperty('--jn-color-lista', ruta.color);
    boton.setAttribute('aria-pressed', String(consulta.seleccionRutaId === ruta.id));
    boton.appendChild(elemento('strong', ruta.titulo + ' · costo ' + numeroRutaJohnson(ruta.distancia)));
    boton.appendChild(elemento('span', nombres));
    const pesos = ruta.modelo ? ruta.modelo.pesos : ruta.pesos;
    boton.appendChild(elemento('span', (pesos.length ? pesos.map(p => p < 0 ? '(' + p + ')' : p).join(' + ') : '0') + ' = ' + ruta.distancia));
    lista.appendChild(boton);
  });
  contenedor.appendChild(lista);
  contenedor.appendChild(elemento('p', 'Rmín y Rmáx proceden de sus motores. A1, A2… son caminos simples encontrados en orden de exploración; ese orden no garantiza las mejores alternativas. El contorno grueso identifica la ruta seleccionada; el trazo discontinuo señala aristas compartidas.', 'tarjeta__pista'));
}

function construirDetalleTemporalJohnson(contenedor) {
  const t = consultaCaminosJohnson.temporal;
  const r = estadoJohnson.resultado;
  contenedor.appendChild(elemento('h3', 'Tiempos y holguras'));
  contenedor.appendChild(elemento('p', 'Análisis temporal complementario sobre una red DAG de duraciones no negativas. No es el cálculo de mínimos de Johnson. Solo participan los nodos y actividades de algún camino entre el origen y el destino; los demás permanecen atenuados.', 'tarjeta__pista'));
  if (!t || !t.valido) {
    contenedor.appendChild(elemento('p', t ? t.mensaje : 'Selecciona un origen y un destino.', 'mensaje mensaje--aviso'));
    return;
  }
  contenedor.appendChild(elemento('p', 'Duración total T = ' + t.duracion + ' · Destino = ' + t.duracion + ' | ' + t.duracion, 'jn-ruta__total'));
  contenedor.appendChild(elemento('p', 'Izquierda: temprano · Derecha: tardío. H = holgura de la actividad; H = 0 identifica una actividad crítica. Una actividad no es crítica solo por unir nodos con valores iguales.', 'tarjeta__pista'));
  const activos = new Set(t.idsActivos);
  contenedor.appendChild(tablaJohnson(['Nodo', 'Temprano', 'Tardío', 'Participación'], r.ids.map((id, i) => ({ th: r.nombres[i], celdas: [numeroRutaJohnson(t.tempranos[i]), numeroRutaJohnson(t.tardios[i]), activos.has(id) ? 'Subred analizada' : 'Excluido'] }))));
  const aristas = new Set(t.conexionesActivas);
  const criticas = new Set(t.criticas);
  contenedor.appendChild(tablaJohnson(['Actividad', 'Duración original', 'Holgura H', 'Estado'], estado.conexiones.map(c => ({ th: buscarNodo(c.desde).nombre + ' → ' + buscarNodo(c.hacia).nombre, celdas: [String(c.valor), numeroRutaJohnson(t.holguras[c.id]), !aristas.has(c.id) ? 'Excluida' : criticas.has(c.id) ? 'Crítica · H = 0' : 'Con holgura'] }))));
  const pasos = elemento('details');
  pasos.appendChild(elemento('summary', 'Procedimiento temporal'));
  pasos.appendChild(elemento('p', 'Temprano(origen) = 0. En orden topológico: temprano(v) = máximo de temprano(u) + duración(u,v). T = temprano(destino). Tardío(destino) = T. En orden inverso: tardío(u) = mínimo de tardío(v) − duración(u,v). Holgura(u,v) = tardío(v) − temprano(u) − duración(u,v).'));
  pasos.appendChild(elemento('p', 'Orden: ' + t.orden.filter(i => activos.has(r.ids[i])).map(i => r.nombres[i]).join(' → ')));
  contenedor.appendChild(pasos);
}

async function buscarAlternativasJohnson() {
  const consulta = consultaCaminosJohnson;
  if (!resultadoVigenteJohnson() || !estadoJohnson.seleccion || consulta.vista !== 'caminos' || consulta.busqueda) return;
  const r = estadoJohnson.resultado, sel = estadoJohnson.seleccion;
  if (r.tieneCicloNegativo) return;
  const tarea = { cancelada: false, par: consulta.alternativasPar };
  consulta.busqueda = tarea;
  consulta.avisoBusqueda = 'Buscando caminos simples… límite: 30 rutas y 10000 aristas examinadas. Puedes cancelar.';
  sincronizarSelectoresRutaJohnson();
  try {
    const encontrados = await enumerarCaminosSimplesJohnson(estado.nodos, estado.conexiones, r.ids[sel.origen], r.ids[sel.destino], { maxRutas: 30, maxTrabajo: 10000, cederCada: 100, cancelado: () => tarea.cancelada || !resultadoVigenteJohnson() || consulta.alternativasPar !== tarea.par });
    if (consulta.busqueda !== tarea || consulta.alternativasPar !== tarea.par || !resultadoVigenteJohnson()) return;
    const principales = new Set([consulta.minimo, consulta.maximo].filter(Boolean).map(modelo => JSON.stringify(modelo.ruta.conexiones)));
    consulta.alternativas = encontrados.rutas.filter(ruta => !principales.has(JSON.stringify(ruta.conexiones))).map((ruta, i) => Object.assign({}, ruta, { id: 'alternativa-' + (i + 1) }));
    consulta.avisoBusqueda = (encontrados.cancelada ? 'Búsqueda cancelada; lista parcial. ' : encontrados.truncada ? 'Búsqueda truncada por el límite; lista parcial. ' : 'Búsqueda completada para este par. ') + encontrados.rutas.length + ' caminos simples encontrados; ' + consulta.alternativas.length + ' adicionales a los principales; ' + encontrados.trabajo + ' aristas examinadas. Orden de exploración, sin garantía de ranking.';
  } catch (error) {
    if (consulta.busqueda === tarea) consulta.avisoBusqueda = 'No se completó la búsqueda: ' + error.message;
  } finally {
    if (consulta.busqueda === tarea) {
      consulta.busqueda = null;
      if (resultadoVigenteJohnson() && consulta.alternativasPar === tarea.par) mostrarConsultaRutaJohnson(sel.origen, sel.destino);
    }
  }
}

function actualizarFormulariosEditorJohnson() {
  const firma = JSON.stringify([estado.nodos.map(n => [n.id, n.nombre]), estado.conexiones.map(c => [c.id, c.desde, c.hacia, c.valor])]);
  ['jnConexionDesde', 'jnConexionHacia', 'jnElementoEditor'].forEach(id => {
    const select = document.getElementById(id);
    if (!select || select.dataset.grafo === firma) return;
    const anterior = select.value;
    select.replaceChildren();
    if (id === 'jnElementoEditor') { const vacia = elemento('option', 'Elige un elemento'); vacia.value = ''; select.appendChild(vacia); }
    estado.nodos.forEach(n => { const op = elemento('option', n.nombre); op.value = id === 'jnElementoEditor' ? 'nodo:' + n.id : n.id; select.appendChild(op); });
    if (id === 'jnElementoEditor') estado.conexiones.forEach(c => { const op = elemento('option', buscarNodo(c.desde).nombre + ' → ' + buscarNodo(c.hacia).nombre + ' (' + c.valor + ')'); op.value = 'conexion:' + c.id; select.appendChild(op); });
    if (Array.from(select.options).some(op => op.value === anterior)) select.value = anterior;
    select.dataset.grafo = firma;
  });
}

function actualizarPanelRutaEditorJohnson(forzar) {
  const panel = document.getElementById('jnRutaEditor');
  const visible = resultadoVigenteJohnson() && !!estadoJohnson.seleccion && !!estado.visualizacionJohnson && estadoJohnson.vista === 'grafo';
  panel.hidden = !visible;
  document.body.classList.toggle('jn-ruta-en-editor', visible);
  if (!visible) return;
  const detalle = document.getElementById('jnRutaEditorDetalle');
  const clave = JSON.stringify([estadoJohnson.seleccion, consultaCaminosJohnson.objetivo, consultaCaminosJohnson.comparar, consultaCaminosJohnson.vista, consultaCaminosJohnson.seleccionRutaId, consultaCaminosJohnson.alternativas.length, estadoJohnson.resultado.nombres]);
  if (forzar || detalle.dataset.consulta !== clave) {
    detalle.dataset.consulta = clave;
    construirConsultaDetalleJohnson(detalle);
  }
}

function limpiarRutaSeleccionadaJohnson() {
  cancelarBusquedaCaminosJohnson();
  consultaCaminosJohnson.busqueda = null;
  consultaCaminosJohnson.alternativas = []; consultaCaminosJohnson.alternativasPar = null;
  consultaCaminosJohnson.avisoBusqueda = ''; consultaCaminosJohnson.temporal = null; consultaCaminosJohnson.seleccionRutaId = null;
  consultaCaminosJohnson.minimo = null;
  consultaCaminosJohnson.maximo = null;
  consultaCaminosJohnson.maximos = null;
  consultaCaminosJohnson.modeloActivo = null;
  consultaCaminosJohnson.errorRutaActiva = null;
  consultaCaminosJohnson.comparar = false;
  consultaCaminosJohnson.cacheMaximos.clear();
  estadoJohnson.seleccion = null;
  estado.visualizacionJohnson = null;
  actualizarPanelRutaEditorJohnson();
}

function dibujarRutaResultadoJohnson() {
  const r = estadoJohnson.resultado;
  const visual = estado.visualizacionJohnson;
  vj.rutaEtiqueta.textContent = consultaCaminosJohnson.vista === 'temporal' ? 'Tiempos y holguras · análisis complementario' : r.tieneCicloNegativo ? 'Ciclo negativo · cálculo global detenido' : consultaCaminosJohnson.comparar ? 'Comparación de caminos' : 'Camino seleccionado';
  vj.btnVerEnEditor.textContent = r.tieneCicloNegativo ? 'Ver ciclo en el editor' : 'Ver en el editor';
  vj.btnVerEnEditor.disabled = !visual;
  dibujarGrafoMini(vj.svgResultado, {
    visual: visual,
    claseConexion: c => clasesJohnsonConexion(c, visual),
    claseNodo: nodo => clasesJohnsonNodo(nodo, visual)
  });
  const sel = estadoJohnson.seleccion;
  const activa = visual && visual.rutaSeleccionada;
  vj.svgResultado.setAttribute('aria-label', consultaCaminosJohnson.vista === 'temporal' ? 'Red temporal: nombre, tiempo temprano y tardío. Conexiones con duración original y holgura H. Consulta la tabla para todos los valores.' : r.tieneCicloNegativo ? 'Johnson global detenido por ciclo negativo' : 'Consulta desde ' + r.nombres[sel.origen] + ' hasta ' + r.nombres[sel.destino] + '. Nodos divididos: nombre, mínimo y máximo.' + (activa ? ' Ruta activa ' + (activa.titulo || activa.id) + ': el destino muestra acumulado y total de esa ruta.' : ''));
  construirConsultaDetalleJohnson(vj.rutaDetalle);
}

function dibujarResultadoJohnson() {
  const vigente = resultadoVigenteJohnson();
  vj.resultadoSin.hidden = vigente;
  vj.resultadoCon.hidden = !vigente;
  if (!vigente) {
    vj.resultadoSin.querySelector('p').textContent = textoSinResultado();
    document.querySelectorAll('[data-accion="calcular"]').forEach(b => { b.disabled = estado.nodos.length < 2; });
    return;
  }
  const r = estadoJohnson.resultado;
  // Reconstruir el contrato completo aun al volver de otras operaciones del editor.
  const sel = estadoJohnson.seleccion || { origen: 0, destino: r.cantidad - 1 };
  actualizarConsultaRutaJohnson(sel.origen, sel.destino);
  sincronizarSelectoresRutaJohnson();
  el.johnsonTabla.replaceChildren();
  if (r.tieneCicloNegativo) {
    el.johnsonEstado.className = 'mensaje mensaje--error';
    el.johnsonEstado.textContent = 'Johnson global detenido: ciclo negativo. Los pares que lo atraviesan no tienen mínimo finito.';
    vj.tituloResultado.textContent = 'Matriz mínima no disponible · ciclo negativo';
    vj.pista.textContent = 'Cada vuelta al ciclo reduce el costo, así que puede bajar sin límite.';
    el.johnsonTabla.appendChild(avisoCicloNegativo(r));
  } else {
    el.johnsonEstado.className = 'mensaje mensaje--ok';
    el.johnsonEstado.textContent = 'Johnson calculado: ' + r.cantidad + ' × ' + r.cantidad + ' distancias mínimas. Consulta las rutas en el grafo.';
    vj.tituloResultado.textContent = 'Matriz de distancias mínimas · Johnson';
    vj.pista.textContent = 'Fila = origen · columna = destino · ∞ = sin camino. Cada celda consulta el mínimo; esta matriz no representa máximos.';
    el.johnsonTabla.appendChild(construirTablaDistancias(r, true));
  }
  dibujarRutaResultadoJohnson();
}

/** Explica el ciclo negativo y, si se pudo reconstruir, qué nodos lo forman. */
function avisoCicloNegativo(resultado) {
  const caja = elemento('div', null, 'johnson-aviso');
  caja.appendChild(elemento('p', 'El cálculo global de Johnson se detiene ante un ciclo negativo. El costo disminuye sin límite para los pares que pueden atravesarlo; otros pares pueden conservar mínimos finitos o no tener camino.', 'johnson-aviso-texto'));
  if (resultado.ciclo.length > 0) {
    caja.appendChild(elemento('p', 'Ciclo detectado: ' + resultado.ciclo.concat([resultado.ciclo[0]]).join(' → '), 'johnson-ciclo'));
  }
  caja.appendChild(elemento('p', 'Revisa los pesos negativos de esas conexiones. El grafo no se modificó.', 'johnson-aviso-texto'));
  return caja;
}

function verEnEditorJohnson() {
  if (!resultadoVigenteJohnson() || !estado.visualizacionJohnson) return;
  cambiarVistaJohnson('grafo');
  dibujarLienzo();
  ajustarVistaRutaJohnson();
  ayudar('Consulta estática: arriba nombre, abajo mínimo y máximo desde el origen seleccionado. El destino de la ruta activa muestra Acum. | Total de esa ruta. Consulta los pesos y acumulados en el detalle.');
}

/* ---------------- Ejemplos ---------------- */

let liberarFocoEjemplos = null;

function ejemplosVisible() {
  return !el.ejemplosFondo.hidden;
}

function cerrarEjemplos() {
  el.ejemplosFondo.hidden = true;
  if (liberarFocoEjemplos) { liberarFocoEjemplos(); liberarFocoEjemplos = null; }
}

function mostrarEjemplos() {
  if (ejemplosVisible()) return;
  cerrarBiblioteca();
  el.ejemplosLista.replaceChildren();
  EJEMPLOS_JOHNSON.forEach(ejemplo => {
    const item = elemento('li', null, 'biblio-item');
    const datos = elemento('div', null, 'biblio-datos');
    datos.appendChild(elemento('span', ejemplo.nombre, 'biblio-nombre'));
    datos.appendChild(elemento('span', ejemplo.descripcion, 'biblio-meta ejemplo-descripcion'));
    datos.appendChild(elemento('span', ejemplo.nodos.length + ' nodos · ' + ejemplo.conexiones.length + ' conexiones', 'biblio-meta'));
    item.appendChild(datos);
    const botones = elemento('div', null, 'biblio-botones');
    const boton = elemento('button', 'Cargar', 'btn btn-primary');
    boton.type = 'button';
    boton.dataset.ejemplo = ejemplo.id;
    boton.setAttribute('aria-label', 'Cargar el ejemplo ' + ejemplo.nombre);
    boton.addEventListener('click', () => cargarEjemploJohnson(ejemplo.id));
    botones.appendChild(boton);
    item.appendChild(botones);
    el.ejemplosLista.appendChild(item);
  });
  el.ejemplosFondo.hidden = false;
  const primero = el.ejemplosLista.querySelector('button');
  liberarFocoEjemplos = activarFocoModal(el.ejemplosFondo.querySelector('[role="dialog"]'), {
    cerrar: cerrarEjemplos, inicial: primero
  });
}

function aplicarEjemploJohnson(ejemplo) {
  const comprobacion = validarGrafoImportado(grafoDeEjemploJohnson(ejemplo, 600, 400, RADIO_NODO));
  if (!comprobacion.ok) { avisar(resumirErroresImportacion(comprobacion.errores), 'error'); return; }
  cerrarEjemplos();
  irAlEditorJohnson();
  guardarEstadoParaDeshacer();
  const a = medirArea();
  const ancho = a.ancho >= 50 ? a.ancho : 600;
  const alto = a.alto >= 50 ? a.alto : 400;
  aplicarGrafo(grafoDeEjemploJohnson(ejemplo, ancho, alto, RADIO_NODO));
  restablecerZoomSilencioso();
  guardar();
  elegirHerramienta('seleccionar');
  ayudar('Ejemplo <strong>' + escaparHtml(ejemplo.nombre) + '</strong> cargado. Pulsa <strong>Calcular Johnson</strong> para resolverlo paso a paso.');
  avisar('Ejemplo «' + ejemplo.nombre + '» cargado.', 'ok');
}

function cargarEjemploJohnson(id) {
  const ejemplo = ejemploJohnsonPorId(id);
  if (!ejemplo) return;
  const firma = JSON.stringify(instantaneaGrafo());
  // Solo se pregunta si hay algo que perder.
  if (estado.nodos.length === 0) { aplicarEjemploJohnson(ejemplo); return; }
  cerrarEjemplos();
  confirmar({
    titulo: 'Cargar ejemplo',
    mensaje: 'Se reemplazará el grafo que tienes en pantalla por «' + ejemplo.nombre + '». Podrás recuperarlo con Deshacer.'
  }).then(aceptado => {
    if (!aceptado) { avisar('No se cargó nada.'); return; }
    if (!comprobarEdicionJohnson(firma)) return;
    aplicarEjemploJohnson(ejemplo);
  });
}

/* ---------------- Arranque ---------------- */

function inicializarVistasJohnson() {
  document.querySelectorAll('#pasosJohnson .paso').forEach(btn => {
    btn.addEventListener('click', () => cambiarVistaJohnson(btn.dataset.vista));
  });
  document.querySelectorAll('#moduloContenido [data-ir]').forEach(btn => {
    btn.addEventListener('click', () => cambiarVistaJohnson(btn.dataset.ir));
  });
  document.querySelectorAll('[data-accion="calcular"]').forEach(btn => {
    btn.addEventListener('click', () => calcularYMostrarJohnson());
  });

  vj.btnAnterior.addEventListener('click', () => irAPasoJohnson(estadoJohnson.pasoActual - 1));
  vj.btnSiguiente.addEventListener('click', () => irAPasoJohnson(estadoJohnson.pasoActual + 1));
  vj.btnReiniciar.addEventListener('click', () => irAPasoJohnson(0));
  document.getElementById('btnJnImprimir').addEventListener('click', imprimirProcedimiento);
  registrarImpresionPasos({
    titulo: 'Algoritmo de Johnson · resolución paso a paso',
    paneles: () => [document.querySelector('#resolucionConJn .jn-principal')],
    total: () => (resultadoVigenteJohnson() ? pasosResolucionJohnson(estadoJohnson.resultado).length : 0),
    actual: () => estadoJohnson.pasoActual || 0,
    ir: irAPasoJohnson,
    activo: () => estadoJohnson.vista === 'resolucion'
  });
  vj.btnVerEnEditor.addEventListener('click', verEnEditorJohnson);

  const formulario = document.getElementById('jnConsultaRuta');
  const consultar = () => {
    const nuevaVista = document.getElementById('jnVistaAnalisis').value;
    if (consultaCaminosJohnson.vista !== nuevaVista) cancelarBusquedaCaminosJohnson();
    consultaCaminosJohnson.vista = nuevaVista;
    consultaCaminosJohnson.objetivo = document.getElementById('jnObjetivoRuta').value;
    consultaCaminosJohnson.comparar = document.getElementById('jnCompararRutas').checked;
    // Comparar parte sin ruta única activa; una ruta se activa desde la lista.
    consultaCaminosJohnson.seleccionRutaId = consultaCaminosJohnson.comparar ? null : consultaCaminosJohnson.objetivo;
    mostrarConsultaRutaJohnson(Number(document.getElementById('jnOrigenRuta').value), Number(document.getElementById('jnDestinoRuta').value));
  };
  formulario.addEventListener('submit', evento => { evento.preventDefault(); consultar(); });
  formulario.addEventListener('change', consultar);
  document.getElementById('jnBuscarAlternativas').addEventListener('click', buscarAlternativasJohnson);
  document.getElementById('jnCancelarAlternativas').addEventListener('click', () => {
    cancelarBusquedaCaminosJohnson();
    consultaCaminosJohnson.avisoBusqueda = 'Cancelando búsqueda…';
    sincronizarSelectoresRutaJohnson();
  });
  document.getElementById('jnOrganizarGrafo').addEventListener('click', () => { cerrarMenuExtra(); organizarGrafoJohnson(); });
  document.getElementById('jnCancelarConexion').addEventListener('click', () => { estado.origenConexion = null; dibujar(); ayudar('Conexión cancelada. Elige dos extremos para comenzar otra.'); });
  document.getElementById('jnCrearNodoForm').addEventListener('submit', evento => {
    evento.preventDefault();
    const campo = document.getElementById('jnCrearNodoNombre');
    const resultado = crearNodoDesdeFormularioJohnson(campo.value);
    if (resultado.ok) campo.value = ''; else avisar(resultado.error, 'error');
  });
  document.getElementById('jnCrearConexionForm').addEventListener('submit', evento => {
    evento.preventDefault();
    const peso = validarValor(document.getElementById('jnConexionPeso').value);
    if (!peso.ok) { avisar(peso.error, 'error'); return; }
    const resultado = guardarConexionJohnson(document.getElementById('jnConexionDesde').value, document.getElementById('jnConexionHacia').value, peso.valor);
    if (!resultado.ok) avisar(resultado.error, 'error');
  });
  document.getElementById('jnElementoEditor').addEventListener('change', evento => {
    const valor = evento.target.value, separador = valor.indexOf(':');
    estado.seleccion = separador < 0 ? null : { tipo: valor.slice(0, separador), id: valor.slice(separador + 1) };
    dibujar();
  });
  document.getElementById('btnExportarRutaJn').addEventListener('click', () => {
    if (!resultadoVigenteJohnson()) return;
    const vistaAnterior = vj.svgResultado.getAttribute('viewBox');
    vj.svgResultado.setAttribute('viewBox', vj.svgResultado.dataset.vistaCompleta);
    exportarSvgComoPng(vj.svgResultado, { nombre: 'johnson-caminos' })
      .then(() => avisar('Grafo y leyenda exportados como PNG.', 'ok'))
      .catch(() => avisar('No se pudo exportar el grafo.', 'error'));
    vj.svgResultado.setAttribute('viewBox', vistaAnterior);
  });
  document.getElementById('btnImprimirRutaJn').addEventListener('click', imprimirProcedimiento);
  let vistaAntesDeImprimir = null;
  window.addEventListener('beforeprint', () => {
    if (estadoJohnson.vista !== 'resultado' || !resultadoVigenteJohnson()) return;
    vistaAntesDeImprimir = vj.svgResultado.getAttribute('viewBox');
    vj.svgResultado.setAttribute('viewBox', vj.svgResultado.dataset.vistaCompleta);
  });
  window.addEventListener('afterprint', () => {
    if (vistaAntesDeImprimir) vj.svgResultado.setAttribute('viewBox', vistaAntesDeImprimir);
    vistaAntesDeImprimir = null;
  });

  document.getElementById('moduloContenido').addEventListener('click', evento => {
    const ruta = evento.target.closest('[data-ruta-johnson]');
    if (ruta && estadoJohnson.seleccion) {
      // Volver a pulsar la ruta activa la desactiva (destino mín | máx).
      consultaCaminosJohnson.seleccionRutaId = consultaCaminosJohnson.seleccionRutaId === ruta.dataset.rutaJohnson ? null : ruta.dataset.rutaJohnson;
      if (ruta.dataset.rutaJohnson === 'minimo' || ruta.dataset.rutaJohnson === 'maximo') consultaCaminosJohnson.objetivo = ruta.dataset.rutaJohnson;
      mostrarConsultaRutaJohnson(estadoJohnson.seleccion.origen, estadoJohnson.seleccion.destino);
      return;
    }
    // Los controles actúan sobre el grafo (resultado o paso) que los contiene.
    const ampliar = evento.target.closest('[data-ampliar-grafo]');
    if (ampliar) {
      const caja = ampliar.closest('.grafo-mini');
      const activo = caja.classList.toggle('jn-grafo-ampliado');
      ampliar.textContent = activo ? 'Restaurar vista' : 'Ampliar grafo';
      ampliar.setAttribute('aria-pressed', String(activo));
      if (caja.contains(vj.svgPaso)) dibujarResolucionJohnson(); else dibujarRutaResultadoJohnson();
      return;
    }
    const zoom = evento.target.closest('[data-zoom-ruta]');
    if (!zoom) return;
    const svg = zoom.closest('.grafo-mini').querySelector('svg');
    if (!svg || !svg.dataset.vistaCompleta) return;
    if (zoom.dataset.zoomRuta === 'ajustar') { svg.setAttribute('viewBox', svg.dataset.vistaCompleta); return; }
    const actual = svg.viewBox.baseVal;
    const completa = svg.dataset.vistaCompleta.split(' ').map(Number);
    const factor = zoom.dataset.zoomRuta === 'mas' ? 0.8 : 1.25;
    const ancho = limitar(actual.width * factor, completa[2] / 8, completa[2]);
    const alto = ancho * completa[3] / completa[2];
    const centroX = actual.x + actual.width / 2;
    const centroY = actual.y + actual.height / 2;
    svg.setAttribute('viewBox', [limitar(centroX - ancho / 2, completa[0], completa[0] + completa[2] - ancho), limitar(centroY - alto / 2, completa[1], completa[1] + completa[3] - alto), ancho, alto].join(' '));
  });

  // Desplazamiento directo del SVG ampliado, sin relojes ni animación.
  // El mismo comportamiento sirve para el grafo del resultado y el del paso.
  let evitarSeleccionNodo = false;
  const activarArrastre = svg => {
    let arrastre = null;
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', evento => {
      if (evento.button !== 0) return;
      const vista = svg.viewBox.baseVal;
      arrastre = { x: evento.clientX, y: evento.clientY, vista: [vista.x, vista.y, vista.width, vista.height], movido: false };
      evitarSeleccionNodo = false;
    });
    svg.addEventListener('pointermove', evento => {
      if (!arrastre || !svg.dataset.vistaCompleta) return;
      const dx = evento.clientX - arrastre.x, dy = evento.clientY - arrastre.y;
      if (Math.hypot(dx, dy) < 4 && !arrastre.movido) return;
      if (!arrastre.movido) svg.setPointerCapture(evento.pointerId);
      arrastre.movido = true;
      const caja = svg.getBoundingClientRect();
      const vista = arrastre.vista;
      const factor = Math.max(vista[2] / caja.width, vista[3] / caja.height);
      const completa = svg.dataset.vistaCompleta.split(' ').map(Number);
      const x = limitar(vista[0] - dx * factor, completa[0], completa[0] + completa[2] - vista[2]);
      const y = limitar(vista[1] - dy * factor, completa[1], completa[1] + completa[3] - vista[3]);
      svg.setAttribute('viewBox', [x, y, vista[2], vista[3]].join(' '));
    });
    const terminar = () => {
      evitarSeleccionNodo = !!arrastre && arrastre.movido;
      arrastre = null;
    };
    svg.addEventListener('pointerup', terminar);
    svg.addEventListener('pointercancel', terminar);
  };
  activarArrastre(vj.svgResultado);
  activarArrastre(vj.svgPaso);
  const elegirNodoResultado = evento => {
    if (evitarSeleccionNodo || !estadoJohnson.seleccion) return;
    const grupo = evento.target.closest('.nodo[data-id]');
    if (!grupo) return;
    const indice = estadoJohnson.resultado.ids.indexOf(grupo.dataset.id);
    const sel = estadoJohnson.seleccion;
    mostrarConsultaRutaJohnson(evento.shiftKey ? indice : sel.origen, evento.shiftKey ? sel.destino : indice);
  };
  vj.svgResultado.addEventListener('click', elegirNodoResultado);
  vj.svgResultado.addEventListener('keydown', evento => {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    evento.preventDefault(); evitarSeleccionNodo = false; elegirNodoResultado(evento);
  });

  // Delegación: la tabla se regenera, los manejadores no.
  el.johnsonTabla.addEventListener('click', evento => {
    const celda = evento.target.closest('td[data-origen]');
    if (celda) seleccionarCeldaJohnson(Number(celda.dataset.origen), Number(celda.dataset.destino));
  });
  el.johnsonTabla.addEventListener('keydown', evento => {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    const celda = evento.target.closest('td[data-origen]');
    if (!celda) return;
    evento.preventDefault();   // el espacio desplazaría la tabla
    seleccionarCeldaJohnson(Number(celda.dataset.origen), Number(celda.dataset.destino));
  });

  // ← → recorren los pasos de la resolución.
  document.addEventListener('keydown', evento => {
    if (estadoJohnson.vista !== 'resolucion' || modalAbierto() || hayDialogoVisible() || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (evento.target.closest && evento.target.closest('input, textarea, select')) return;
    if (evento.key === 'ArrowRight') { evento.preventDefault(); irAPasoJohnson(estadoJohnson.pasoActual + 1); }
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); irAPasoJohnson(estadoJohnson.pasoActual - 1); }
  });

  cambiarVistaJohnson('grafo');
}
