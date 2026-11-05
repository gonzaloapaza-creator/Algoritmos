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
const consultaCaminosJohnson = { objetivo: 'minimo', comparar: false, minimo: null, maximo: null, maximos: null, cacheMaximos: new Map() };

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
    avisar('Cálculo completado: recorre los pasos.', 'ok');
  }

  dibujarLienzo();
  cambiarVistaJohnson(destino || 'resolucion');
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
    if (aislados > 0) mensajes.push(['aviso', aislados === 1 ? 'Un nodo no tiene conexiones: su fila y su columna serán ∞.' : aislados + ' nodos no tienen conexiones: sus filas y columnas serán ∞.']);
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
    texto.textContent = op.etiquetaConexion ? op.etiquetaConexion(conexion) : conexion.valor;
    grupo.appendChild(texto);
    capaConexiones.appendChild(grupo);
  });

  const nodos = q ? estado.nodos.concat([q]) : estado.nodos;
  nodos.forEach((nodo, i) => {
    const esQ = nodo === q;
    const extras = esQ ? ['nodo-auxiliar'] : (op.claseNodo ? op.claseNodo(nodo, i) : []);
    const grupo = crearSVG('g', { class: ['nodo'].concat(extras).join(' ') });
    grupo.dataset.id = nodo.id;
    grupo.appendChild(crearSVG('circle', { cx: nodo.x, cy: nodo.y, r: r }));
    const texto = crearSVG('text', { x: nodo.x, y: nodo.y });
    texto.textContent = nodo.nombre;
    grupo.appendChild(texto);
    if (op.visual) {
      dibujarCompartimentosNodoJohnson(grupo, nodo, op.visual);
      decorarNodoRutaJohnson(grupo, nodo, op.visual);
      grupo.setAttribute('role', 'button');
      grupo.setAttribute('tabindex', '0');
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
  if (svg === vj.svgResultado) {
    svg.dataset.vistaCompleta = svg.getAttribute('viewBox');
  }
}

/* ---------------- Vista 3: resolución paso a paso ---------------- */

function irAPasoJohnson(indice) {
  if (!resultadoVigenteJohnson()) return;
  const total = estadoJohnson.resultado.pasos.length;
  estadoJohnson.pasoActual = limitar(indice, 0, total - 1);
  dibujarResolucionJohnson();
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

  switch (paso.tipo) {
    case 'original':
      tablas.push(tablaAristasOriginales(r));
      break;

    case 'auxiliar':
      grafo = { auxiliar: true, auxiliarResaltadas: new Set(r.nombres.map((_, i) => i)) };
      tablas.push(tablaJohnson(['Conexión nueva', 'w'], r.nombres.map(nombre => ({ th: 'q → ' + nombre, celdas: ['0'] })), 'Conexiones de q'));
      leyenda = [['leyenda__muestra--ruta', 'Conexiones nuevas desde q (peso 0)']];
      break;

    case 'bellman': {
      const p = paso.pasada;
      const cambiados = new Set(p.relajaciones.filter(x => x.hacia < r.cantidad).map(x => x.hacia));
      const conexionesRelajadas = new Set(p.relajaciones.filter(x => x.id).map(x => x.id));
      const desdeQ = new Set(p.relajaciones.filter(x => x.desde === r.cantidad).map(x => x.hacia));
      grafo = {
        auxiliar: true,
        auxiliarResaltadas: desdeQ,
        claseConexion: c => (conexionesRelajadas.has(c.id) ? ['conexion-johnson'] : []),
        claseNodo: (nodo, i) => (cambiados.has(i) ? ['nodo-johnson'] : []),
        notaNodo: (nodo, i) => 'd=' + fmt(p.despues[i])
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
      grafo = {
        claseConexion: c => (conexionesCiclo.has(c.id) ? ['conexion-johnson', 'ciclo-negativo-johnson'] : ['conexion-johnson-inactiva']),
        claseNodo: (nodo, i) => (nodosCiclo.has(i) ? ['nodo-johnson', 'ciclo-negativo-johnson'] : [])
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
      grafo = { notaNodo: (nodo, i) => 'h=' + r.potenciales[i] };
      tablas.push(tablaJohnson(['Nodo v', 'h(v)'], r.nombres.map((nombre, i) => ({
        th: nombre, celdas: [{ texto: String(r.potenciales[i]), clase: claseNumero(r.potenciales[i]) }]
      })), 'Potenciales'));
      break;

    case 'reponderacion': {
      const porId = new Map(r.aristas.map(a => [a.id, a]));
      grafo = {
        etiquetaConexion: c => (porId.has(c.id) ? porId.get(c.id).pesoReponderado : c.valor),
        notaNodo: (nodo, i) => 'h=' + r.potenciales[i]
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
      leyenda = [['leyenda__muestra--normal', "Etiqueta de cada conexión: peso reponderado w'"]];
      break;
    }

    case 'dijkstra': {
      const u = paso.origen;
      const porId = new Map(r.aristas.map(a => [a.id, a]));
      const arbol = new Set(r.predecesores[u].filter(Boolean).map(p => p.conexion));
      grafo = {
        etiquetaConexion: c => (porId.has(c.id) ? porId.get(c.id).pesoReponderado : c.valor),
        claseConexion: c => (arbol.has(c.id) ? ['conexion-johnson'] : ['conexion-johnson-inactiva']),
        claseNodo: (nodo, i) => (i === u ? ['nodo-johnson', 'nodo-johnson-origen'] : r.distancias[u][i] !== Infinity ? ['nodo-johnson'] : []),
        notaNodo: (nodo, i) => "d'=" + fmt(r.distanciasReponderadas[u][i])
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

    case 'final':
      tablas.push(construirTablaDistancias(r, false));
      break;
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
  const pasos = r.pasos;
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
  if (acumuladas[acumuladas.length - 1] !== ruta.distancia) throw new Error('La suma de los pesos originales no coincide con el resultado.');
  return { ruta: ruta, pesos: pesos, acumuladas: acumuladas };
}

function numeroRutaJohnson(numero) {
  if (numero === null || numero === undefined) return '—';
  if (numero === Infinity || numero === -Infinity) return 'Sin camino';
  return String(numero).replace(/^-/, '−');
}

function actualizarConsultaRutaJohnson(origen, destino) {
  const r = estadoJohnson.resultado;
  if (!resultadoVigenteJohnson() || !Number.isInteger(origen) || !Number.isInteger(destino) || !r.ids[origen] || !r.ids[destino]) return false;
  const consulta = consultaCaminosJohnson;
  estadoJohnson.seleccion = { origen: origen, destino: destino };
  const idOrigen = r.ids[origen];
  if (!consulta.cacheMaximos.has(idOrigen)) consulta.cacheMaximos.set(idOrigen, calcularMaximosDAGJohnson(estado.nodos, estado.conexiones, idOrigen));
  consulta.maximos = consulta.cacheMaximos.get(idOrigen);
  const minimo = reconstruirRutaJohnson(origen, destino, r);
  const maximo = reconstruirMaximoDAGJohnson(r.ids[destino], consulta.maximos);
  consulta.minimo = minimo ? prepararRecorridoRutaJohnson(r, minimo) : null;
  consulta.maximo = maximo ? prepararRecorridoRutaJohnson(r, maximo) : null;
  consulta.comparar = consulta.comparar && !!minimo && !!maximo;
  const seleccionadas = consulta.comparar ? [minimo, maximo] : [(consulta.objetivo === 'maximo' ? maximo : minimo)];
  const rutas = seleccionadas.filter(Boolean);
  const mostrarMinimo = consulta.comparar || consulta.objetivo === 'minimo';
  const mostrarMaximo = consulta.comparar || consulta.objetivo === 'maximo';
  const valoresNodos = {};
  r.ids.forEach((id, i) => {
    valoresNodos[id] = { minimo: r.tieneCicloNegativo ? null : r.distancias[origen][i], maximo: consulta.maximos.aciclico ? consulta.maximos.distancias[i] : null };
  });
  estado.visualizacionJohnson = {
    tipo: r.tieneCicloNegativo ? 'ciclo' : consulta.comparar ? 'comparacion' : rutas.length ? 'ruta' : 'consulta',
    objetivo: consulta.comparar ? 'comparar' : consulta.objetivo,
    origen: idOrigen, destino: r.ids[destino],
    nodos: r.tieneCicloNegativo ? r.cicloNodos : Array.from(new Set(rutas.flatMap(ruta => ruta.nodos))),
    conexiones: r.tieneCicloNegativo ? r.cicloConexiones : Array.from(new Set(rutas.flatMap(ruta => ruta.conexiones))),
    minimoConexiones: mostrarMinimo && minimo ? minimo.conexiones : [],
    maximoConexiones: mostrarMaximo && maximo ? maximo.conexiones : [],
    nodosMinimos: mostrarMinimo && minimo ? minimo.nodos : [],
    nodosMaximos: mostrarMaximo && maximo ? maximo.nodos : [],
    valoresNodos: valoresNodos,
    distancia: rutas.length === 1 ? rutas[0].distancia : null,
    firma: estadoJohnson.firma
  };
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
  document.getElementById('jnAvisoMaximo').textContent = consulta.maximos.aciclico
    ? 'Máximos disponibles. En caso de empate se muestra una ruta representativa según el orden de los datos.'
    : 'La maximización de esta versión requiere un grafo dirigido sin ciclos.';
}

function construirDetalleRutaJohnson(contenedor, modelo, objetivo) {
  const r = estadoJohnson.resultado;
  const ruta = modelo.ruta;
  const nombres = ruta.indices.map(i => r.nombres[i]);
  const bloque = elemento('article', null, 'jn-detalle-ruta jn-detalle-ruta--' + objetivo + ' jn-camino-' + objetivo);
  bloque.appendChild(elemento('h3', objetivo === 'maximo' ? 'Camino máximo · recorrido topológico' : 'Camino mínimo · Johnson'));
  const secuencia = elemento('p', nombres.join(' → '), 'jn-ruta__recorrido');
  secuencia.tabIndex = 0;
  secuencia.setAttribute('aria-label', 'Secuencia completa: ' + nombres.join(' → '));
  bloque.appendChild(secuencia);
  const suma = modelo.pesos.length ? modelo.pesos.map(p => p < 0 ? '(' + numeroRutaJohnson(p) + ')' : String(p)).join(' + ') + ' = ' + numeroRutaJohnson(ruta.distancia) : 'Mismo nodo: 0 = 0';
  bloque.appendChild(elemento('p', suma, 'jn-ruta__suma'));
  bloque.appendChild(elemento('p', 'Distancia ' + (objetivo === 'maximo' ? 'máxima' : 'mínima') + ' total: ' + numeroRutaJohnson(ruta.distancia), 'jn-ruta__total'));
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
  contenedor.appendChild(elemento('p', 'Objetivo: ' + (consulta.comparar ? 'Comparar mínimo y máximo' : consulta.objetivo === 'maximo' ? 'Maximizar' : 'Minimizar') + ' · Origen: ' + r.nombres[sel.origen] + ' · Destino: ' + r.nombres[sel.destino], 'jn-ruta__cabecera'));
  if (r.tieneCicloNegativo) {
    contenedor.appendChild(avisoCicloNegativo(r));
    if (r.ciclo.length) contenedor.appendChild(elemento('p', r.ciclo.concat([r.ciclo[0]]).join(' → ') + ' · suma: ' + numeroRutaJohnson(r.cicloPeso), 'jn-ruta__recorrido jn-ruta__recorrido--ciclo'));
  } else if (consulta.objetivo === 'maximo' && !consulta.maximos.aciclico) {
    contenedor.appendChild(elemento('p', 'La maximización de esta versión requiere un grafo dirigido sin ciclos.', 'mensaje mensaje--aviso'));
  } else if (consulta.comparar) {
    const comparacion = elemento('div', null, 'jn-detalle-comparacion');
    construirDetalleRutaJohnson(comparacion, consulta.minimo, 'minimo');
    construirDetalleRutaJohnson(comparacion, consulta.maximo, 'maximo');
    contenedor.appendChild(comparacion);
    if (JSON.stringify(consulta.minimo.ruta.conexiones) === JSON.stringify(consulta.maximo.ruta.conexiones)) contenedor.appendChild(elemento('p', 'El mínimo y el máximo comparten el mismo recorrido.', 'mensaje mensaje--ok'));
  } else {
    const modelo = consulta.objetivo === 'maximo' ? consulta.maximo : consulta.minimo;
    if (modelo) construirDetalleRutaJohnson(contenedor, modelo, consulta.objetivo);
    else contenedor.appendChild(elemento('p', 'No existe un camino entre estos vértices', 'mensaje mensaje--aviso'));
  }
  contenedor.appendChild(elemento('p', 'En cada nodo se muestran sus distancias mínima y máxima generales desde el origen. La tabla de tramos indica el acumulado exclusivo de la ruta elegida. Se muestra una ruta representativa por objetivo; puede haber empates.', 'tarjeta__pista'));
  const valores = elemento('details', null, 'jn-procedimiento-maximo');
  valores.appendChild(elemento('summary', 'Distancias mínimas y máximas desde ' + r.nombres[sel.origen]));
  valores.appendChild(tablaJohnson(['Nodo', 'Mínimo · Johnson', 'Máximo · acíclico'], r.ids.map((id, i) => ({ th: r.nombres[i], celdas: [numeroRutaJohnson(estado.visualizacionJohnson.valoresNodos[id].minimo), numeroRutaJohnson(estado.visualizacionJohnson.valoresNodos[id].maximo)] }))));
  contenedor.appendChild(valores);
  if (consulta.comparar || consulta.objetivo === 'maximo') construirProcedimientoMaximoJohnson(contenedor);
}

function actualizarPanelRutaEditorJohnson(forzar) {
  const panel = document.getElementById('jnRutaEditor');
  const visible = resultadoVigenteJohnson() && !!estadoJohnson.seleccion && !!estado.visualizacionJohnson && estadoJohnson.vista === 'grafo';
  panel.hidden = !visible;
  document.body.classList.toggle('jn-ruta-en-editor', visible);
  if (!visible) return;
  const detalle = document.getElementById('jnRutaEditorDetalle');
  const clave = JSON.stringify([estadoJohnson.seleccion, consultaCaminosJohnson.objetivo, consultaCaminosJohnson.comparar, estadoJohnson.resultado.nombres]);
  if (forzar || detalle.dataset.consulta !== clave) {
    detalle.dataset.consulta = clave;
    construirConsultaDetalleJohnson(detalle);
  }
}

function limpiarRutaSeleccionadaJohnson() {
  consultaCaminosJohnson.minimo = null;
  consultaCaminosJohnson.maximo = null;
  consultaCaminosJohnson.maximos = null;
  consultaCaminosJohnson.comparar = false;
  consultaCaminosJohnson.cacheMaximos.clear();
  estadoJohnson.seleccion = null;
  estado.visualizacionJohnson = null;
  actualizarPanelRutaEditorJohnson();
}

function dibujarRutaResultadoJohnson() {
  const r = estadoJohnson.resultado;
  const visual = estado.visualizacionJohnson;
  vj.rutaEtiqueta.textContent = r.tieneCicloNegativo ? 'Ciclo negativo · sin mínimos' : consultaCaminosJohnson.comparar ? 'Comparación de caminos' : consultaCaminosJohnson.objetivo === 'maximo' ? 'Camino máximo' : 'Camino mínimo';
  vj.btnVerEnEditor.textContent = r.tieneCicloNegativo ? 'Ver ciclo en el editor' : 'Ver en el editor';
  vj.btnVerEnEditor.disabled = !visual;
  dibujarGrafoMini(vj.svgResultado, {
    visual: visual,
    claseConexion: c => clasesJohnsonConexion(c, visual),
    claseNodo: nodo => clasesJohnsonNodo(nodo, visual)
  });
  const sel = estadoJohnson.seleccion;
  vj.svgResultado.setAttribute('aria-label', r.tieneCicloNegativo ? 'Ciclo negativo; no existen distancias mínimas' : 'Consulta ' + (consultaCaminosJohnson.comparar ? 'mínima y máxima' : consultaCaminosJohnson.objetivo) + ' desde ' + r.nombres[sel.origen] + ' hasta ' + r.nombres[sel.destino] + '. Nodos divididos: nombre, mínimo y máximo.');
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
  if (!estadoJohnson.seleccion) actualizarConsultaRutaJohnson(0, r.cantidad - 1);
  sincronizarSelectoresRutaJohnson();
  el.johnsonTabla.replaceChildren();
  if (r.tieneCicloNegativo) {
    el.johnsonEstado.className = 'mensaje mensaje--error';
    el.johnsonEstado.textContent = 'El grafo contiene un ciclo de peso negativo: no existen distancias mínimas.';
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
  caja.appendChild(elemento('p', 'No existen distancias mínimas: cada vuelta al ciclo reduce el costo, así que puede bajar sin límite.', 'johnson-aviso-texto'));
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
  ayudar('Consulta estática: arriba nombre, abajo mínimo y máximo desde el origen seleccionado. Consulta los pesos y acumulados en el detalle.');
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
    total: () => (resultadoVigenteJohnson() ? estadoJohnson.resultado.pasos.length : 0),
    actual: () => estadoJohnson.pasoActual || 0,
    ir: irAPasoJohnson,
    activo: () => estadoJohnson.vista === 'resolucion'
  });
  vj.btnVerEnEditor.addEventListener('click', verEnEditorJohnson);

  const formulario = document.getElementById('jnConsultaRuta');
  const consultar = () => {
    consultaCaminosJohnson.objetivo = document.getElementById('jnObjetivoRuta').value;
    consultaCaminosJohnson.comparar = document.getElementById('jnCompararRutas').checked;
    mostrarConsultaRutaJohnson(Number(document.getElementById('jnOrigenRuta').value), Number(document.getElementById('jnDestinoRuta').value));
  };
  formulario.addEventListener('submit', evento => { evento.preventDefault(); consultar(); });
  formulario.addEventListener('change', consultar);
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
    const ampliar = evento.target.closest('[data-ampliar-grafo]');
    if (ampliar) {
      const activo = vj.resultadoCon.classList.toggle('jn-grafo-ampliado');
      ampliar.textContent = activo ? 'Restaurar vista' : 'Ampliar grafo';
      ampliar.setAttribute('aria-pressed', String(activo));
      dibujarRutaResultadoJohnson();
      return;
    }
    const zoom = evento.target.closest('[data-zoom-ruta]');
    if (!zoom) return;
    const svg = vj.svgResultado;
    if (!svg.dataset.vistaCompleta) return;
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
  let arrastreResultado = null;
  let evitarSeleccionNodo = false;
  vj.svgResultado.style.touchAction = 'none';
  vj.svgResultado.addEventListener('pointerdown', evento => {
    if (evento.button !== 0) return;
    const vista = vj.svgResultado.viewBox.baseVal;
    arrastreResultado = { x: evento.clientX, y: evento.clientY, vista: [vista.x, vista.y, vista.width, vista.height], movido: false };
    evitarSeleccionNodo = false;
  });
  vj.svgResultado.addEventListener('pointermove', evento => {
    if (!arrastreResultado) return;
    const dx = evento.clientX - arrastreResultado.x, dy = evento.clientY - arrastreResultado.y;
    if (Math.hypot(dx, dy) < 4 && !arrastreResultado.movido) return;
    if (!arrastreResultado.movido) vj.svgResultado.setPointerCapture(evento.pointerId);
    arrastreResultado.movido = true;
    const caja = vj.svgResultado.getBoundingClientRect();
    const vista = arrastreResultado.vista;
    const factor = Math.max(vista[2] / caja.width, vista[3] / caja.height);
    const completa = vj.svgResultado.dataset.vistaCompleta.split(' ').map(Number);
    const x = limitar(vista[0] - dx * factor, completa[0], completa[0] + completa[2] - vista[2]);
    const y = limitar(vista[1] - dy * factor, completa[1], completa[1] + completa[3] - vista[3]);
    vj.svgResultado.setAttribute('viewBox', [x, y, vista[2], vista[3]].join(' '));
  });
  const terminarArrastre = () => {
    evitarSeleccionNodo = !!arrastreResultado && arrastreResultado.movido;
    arrastreResultado = null;
  };
  vj.svgResultado.addEventListener('pointerup', terminarArrastre);
  vj.svgResultado.addEventListener('pointercancel', terminarArrastre);
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
