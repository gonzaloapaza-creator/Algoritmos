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
    estado.nodos.map(n => [n.id, n.nombre]),
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
  actualizarChipJohnson();
  if (estadoJohnson.vista !== 'grafo') dibujarVistaJohnson();
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
  actualizarChipJohnson();

  if (vista === 'grafo') {
    // El lienzo pasó de oculto a visible: se mide y se redibuja con su tamaño real.
    requestAnimationFrame(() => { if (typeof adaptarAlArea === 'function') adaptarAlArea(); });
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
  if (estado.nodos.length < 2) {
    avisar('Crea al menos dos nodos para calcular las distancias mínimas.', 'error');
    return false;
  }

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
    estado.nodos = nodosCompactadosMini(svg, originales);
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
function nodosCompactadosMini(svg, nodos) {
  if (nodos.length === 0) return nodos;
  const r = RADIO_NODO;
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
  const kMinimo = menor === Infinity ? 0 : Math.min(1, (r * 3.6) / Math.max(menor, 1));
  const k = limitar(Math.min((anchoCaja - margen * 2) / bw, (altoCaja - margen * 2) / bh), kMinimo, 1);

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
  marcadorMini(defs, prefijo + 'normal', '#9cb0d4');
  marcadorMini(defs, prefijo + 'ruta', '#22d3ee');
  marcadorMini(defs, prefijo + 'ciclo', '#ff5f6d');
  marcadorMini(defs, prefijo + 'aux', '#7e8ab3');
  svg.appendChild(defs);

  if (estado.nodos.length === 0) { svg.setAttribute('viewBox', '0 0 100 60'); return; }

  const r = RADIO_NODO;
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
    const geo = geometriaConexion(conexion);
    if (!geo) return;
    const extras = op.claseConexion ? op.claseConexion(conexion) : [];
    const grupo = crearSVG('g', { class: ['conexion'].concat(extras).join(' ') });
    const linea = crearSVG('path', { class: 'conexion-linea', d: geo.d });
    const tipo = extras.includes('ciclo-negativo-johnson') ? 'ciclo' : extras.includes('conexion-johnson') ? 'ruta' : 'normal';
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
    grupo.appendChild(crearSVG('circle', { cx: nodo.x, cy: nodo.y, r: r }));
    const texto = crearSVG('text', { x: nodo.x, y: nodo.y });
    texto.textContent = nodo.nombre;
    grupo.appendChild(texto);
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

/** Elige una celda del resultado: se resalta su ruta aquí y en el editor. */
function seleccionarCeldaJohnson(origen, destino) {
  if (!resultadoVigenteJohnson()) return;
  estadoJohnson.seleccion = { origen: origen, destino: destino };
  const r = estadoJohnson.resultado;
  const ruta = reconstruirRutaJohnson(origen, destino, r);
  estado.visualizacionJohnson = ruta ? {
    origen: ruta.nodos[0],
    destino: ruta.nodos[ruta.nodos.length - 1],
    nodos: ruta.nodos,
    conexiones: ruta.conexiones,
    distancia: ruta.distancia,
    tipo: 'ruta',
    firma: estadoJohnson.firma
  } : null;
  dibujarLienzo();

  el.johnsonTabla.querySelectorAll('td.celda-elegida').forEach(td => td.classList.remove('celda-elegida'));
  const celda = el.johnsonTabla.querySelector('td[data-origen="' + origen + '"][data-destino="' + destino + '"]');
  if (celda) celda.classList.add('celda-elegida');
  dibujarRutaResultadoJohnson();
}

function textoRecorridoJohnson(r, ruta) {
  return ruta.indices.map(i => r.nombres[i]).join(' → ');
}

/** Panel lateral del resultado: grafo con la ruta (o el ciclo) y su detalle. */
function dibujarRutaResultadoJohnson() {
  const r = estadoJohnson.resultado;
  const detalle = vj.rutaDetalle;
  detalle.replaceChildren();

  if (r.tieneCicloNegativo) {
    vj.rutaEtiqueta.textContent = 'Ciclo negativo';
    const nodosCiclo = new Set(r.cicloIndices);
    const conexionesCiclo = new Set(r.cicloConexiones);
    dibujarGrafoMini(vj.svgResultado, {
      claseConexion: c => (conexionesCiclo.has(c.id) ? ['conexion-johnson', 'ciclo-negativo-johnson'] : ['conexion-johnson-inactiva']),
      claseNodo: (nodo, i) => (nodosCiclo.has(i) ? ['nodo-johnson', 'ciclo-negativo-johnson'] : [])
    });
    if (r.ciclo.length) {
      detalle.appendChild(elemento('p', r.ciclo.concat([r.ciclo[0]]).join(' → '), 'jn-ruta__recorrido jn-ruta__recorrido--ciclo'));
      detalle.appendChild(elemento('p', 'Suma de pesos del ciclo: ' + r.cicloPeso, 'jn-ruta__suma'));
    }
    vj.btnVerEnEditor.textContent = 'Ver ciclo en el editor';
    vj.btnVerEnEditor.disabled = r.cicloNodos.length === 0;
    return;
  }

  vj.rutaEtiqueta.textContent = 'Ruta seleccionada';
  vj.btnVerEnEditor.textContent = 'Ver en el editor';
  const sel = estadoJohnson.seleccion;
  const ruta = sel ? reconstruirRutaJohnson(sel.origen, sel.destino, r) : null;

  if (!sel) {
    dibujarGrafoMini(vj.svgResultado, {});
    detalle.appendChild(elemento('p', 'Toca una celda de la tabla para ver aquí su ruta y cómo se suma la distancia.', 'tarjeta__pista'));
    vj.btnVerEnEditor.disabled = true;
    return;
  }

  if (!ruta) {
    dibujarGrafoMini(vj.svgResultado, {
      claseNodo: (nodo, i) => (i === sel.origen ? ['nodo-johnson', 'nodo-johnson-origen'] : i === sel.destino ? ['nodo-johnson', 'nodo-johnson-destino'] : []),
      claseConexion: () => ['conexion-johnson-inactiva']
    });
    detalle.appendChild(elemento('div', 'No existe ningún camino de ' + r.nombres[sel.origen] + ' a ' + r.nombres[sel.destino] + ' (∞).', 'mensaje mensaje--aviso'));
    vj.btnVerEnEditor.disabled = true;
    return;
  }

  const enRuta = new Set(ruta.conexiones);
  dibujarGrafoMini(vj.svgResultado, {
    claseConexion: c => (enRuta.has(c.id) ? ['conexion-johnson'] : ['conexion-johnson-inactiva']),
    claseNodo: (nodo, i) => {
      if (!ruta.indices.includes(i)) return [];
      if (i === sel.origen) return ['nodo-johnson', 'nodo-johnson-origen'];
      if (i === sel.destino) return ['nodo-johnson', 'nodo-johnson-destino'];
      return ['nodo-johnson'];
    }
  });

  detalle.appendChild(elemento('p', textoRecorridoJohnson(r, ruta), 'jn-ruta__recorrido'));
  const pesos = pesosDeRutaJohnson(ruta, r);
  const suma = pesos.length ? pesos.map((p, i) => (i === 0 ? String(p) : formatearSumando(p))).join(' + ') + ' = ' + ruta.distancia : 'Mismo nodo: distancia 0';
  detalle.appendChild(elemento('p', suma, 'jn-ruta__suma'));
  vj.btnVerEnEditor.disabled = false;
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
  el.johnsonTabla.replaceChildren();

  if (r.tieneCicloNegativo) {
    el.johnsonEstado.className = 'mensaje mensaje--error';
    el.johnsonEstado.textContent = 'El grafo contiene un ciclo de peso negativo: no existen distancias mínimas.';
    vj.tituloResultado.textContent = 'Sin distancias mínimas';
    vj.pista.textContent = 'Cada vuelta al ciclo reduce el costo, así que puede bajar sin límite.';
    el.johnsonTabla.appendChild(avisoCicloNegativo(r));
  } else {
    const inalcanzables = r.distancias.reduce((t, fila) => t + fila.filter(v => v === Infinity).length, 0);
    el.johnsonEstado.className = 'mensaje mensaje--ok';
    el.johnsonEstado.textContent = 'Cálculo completado: ' + r.cantidad + ' × ' + r.cantidad + ' distancias' +
      (inalcanzables ? ' (' + inalcanzables + ' sin camino).' : '.');
    vj.tituloResultado.textContent = 'Distancias mínimas';
    vj.pista.textContent = 'Toca una celda para ver su ruta. Fila = origen · columna = destino · ∞ = sin camino.';
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
  const r = estadoJohnson.resultado;
  if (!resultadoVigenteJohnson()) return;
  cambiarVistaJohnson('grafo');
  const visual = estado.visualizacionJohnson;
  if (!visual) return;
  if (visual.tipo === 'ciclo') {
    ayudar('Ciclo negativo: <strong>' + r.ciclo.concat([r.ciclo[0]]).map(escaparHtml).join(' → ') + '</strong> · suma ' + r.cicloPeso);
    return;
  }
  const sel = estadoJohnson.seleccion;
  const ruta = reconstruirRutaJohnson(sel.origen, sel.destino, r);
  ayudar('Ruta mínima: <strong>' + ruta.indices.map(i => escaparHtml(r.nombres[i])).join(' → ') + '</strong> · ' +
         'Distancia total: <strong>' + ruta.distancia + '</strong>');
}

/* ---------------- Ejemplos ---------------- */

function ejemplosVisible() {
  return !el.ejemplosFondo.hidden;
}

function cerrarEjemplos() {
  el.ejemplosFondo.hidden = true;
}

function mostrarEjemplos() {
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
  if (primero) primero.focus();
}

function aplicarEjemploJohnson(ejemplo) {
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
  // Solo se pregunta si hay algo que perder.
  if (estado.nodos.length === 0) { aplicarEjemploJohnson(ejemplo); return; }
  cerrarEjemplos();
  confirmar({
    titulo: 'Cargar ejemplo',
    mensaje: 'Se reemplazará el grafo que tienes en pantalla por «' + ejemplo.nombre + '». Podrás recuperarlo con Deshacer.'
  }).then(aceptado => {
    if (!aceptado) { avisar('No se cargó nada.'); return; }
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
  vj.btnVerEnEditor.addEventListener('click', verEnEditorJohnson);

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
    if (estadoJohnson.vista !== 'resolucion' || modalAbierto() || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (evento.target.closest && evento.target.closest('input, textarea, select')) return;
    if (evento.key === 'ArrowRight') { evento.preventDefault(); irAPasoJohnson(estadoJohnson.pasoActual + 1); }
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); irAPasoJohnson(estadoJohnson.pasoActual - 1); }
  });

  cambiarVistaJohnson('grafo');
}
