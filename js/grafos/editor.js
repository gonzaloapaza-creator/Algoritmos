/* Dibujo y edición SVG pequeños, compartidos por los dos módulos de grafos. */
'use strict';

// Las coordenadas del ejercicio no cambian al adaptar la vista a una pantalla.
let vistaAjustadaEditorGrafo = true;
let observadorVistaEditorGrafo;

function encuadreEditorGrafo() {
  const svg = document.getElementById('svgModuloGrafo');
  const nodos = moduloGrafo.grafo.nodos;
  if (!nodos.length) return { x: 0, y: 0, ancho: 1000, alto: 600 };
  const caja = svg.getBoundingClientRect();
  const menorX = Math.min(...nodos.map(n => n.x)), mayorX = Math.max(...nodos.map(n => n.x));
  const menorY = Math.min(...nodos.map(n => n.y)), mayorY = Math.max(...nodos.map(n => n.y));
  const ancho = Math.max(120, mayorX - menorX), alto = Math.max(120, mayorY - menorY);
  // El margen se calcula en píxeles visibles e incluye círculos, trazos y etiquetas.
  const escala = Math.min(Math.max(80, caja.width - 64) / ancho, Math.max(80, caja.height - 64) / alto);
  const margen = Math.max(38, 32 / escala);
  return { x: (menorX + mayorX - ancho) / 2 - margen, y: (menorY + mayorY - alto) / 2 - margen,
    ancho: ancho + margen * 2, alto: alto + margen * 2 };
}

function aplicarVistaEditorGrafo() {
  const svg = document.getElementById('svgModuloGrafo');
  if (vistaAjustadaEditorGrafo) moduloGrafo.vistaSvg = encuadreEditorGrafo();
  const v = moduloGrafo.vistaSvg;
  svg.setAttribute('viewBox', [v.x, v.y, v.ancho, v.alto].join(' '));
  const caja = svg.getBoundingClientRect();
  const escala = Math.max(.05, Math.min(caja.width / v.ancho, caja.height / v.alto));
  svg.style.setProperty('--gm-texto', Math.max(20, 14 / escala) + 'px');
  svg.style.setProperty('--gm-peso', Math.max(18, 14 / escala) + 'px');
  svg.style.setProperty('--gm-halo', Math.max(7, 5 / escala) + 'px');
  // Un grafo muy poblado necesita zoom para separar sus vértices, sin ocultarlos.
  const radioPantalla = moduloGrafo.grafo.nodos.length > 12 ? 14 : 22;
  return Math.max(30, radioPantalla / escala);
}

function ajustarVistaEditorGrafo() {
  vistaAjustadaEditorGrafo = true;
  dibujarEditorGrafo();
}

function actualizarVistaEditorGrafo() {
  vistaAjustadaEditorGrafo = false;
  dibujarEditorGrafo();
}

function configurarVistaEditorGrafo() {
  if (observadorVistaEditorGrafo) observadorVistaEditorGrafo.disconnect();
  observadorVistaEditorGrafo = new ResizeObserver(() => dibujarEditorGrafo());
  observadorVistaEditorGrafo.observe(document.getElementById('svgModuloGrafo'));
  ajustarVistaEditorGrafo();
}

function centrarSeleccionEditorGrafo(tipo, id) {
  const g = moduloGrafo.grafo;
  const seleccion = tipo === 'nodo' ? g.nodos.find(n => n.id === id) : g.conexiones.find(c => c.id === id);
  if (!seleccion) return;
  const extremos = tipo === 'nodo' ? [seleccion] : g.nodos.filter(n => n.id === seleccion.desde || n.id === seleccion.hacia);
  const x = extremos.reduce((suma, n) => suma + n.x, 0) / extremos.length;
  const y = extremos.reduce((suma, n) => suma + n.y, 0) / extremos.length;
  const svg = document.getElementById('svgModuloGrafo');
  const caja = svg.getBoundingClientRect();
  const punto = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
  if (punto.x >= caja.left + 26 && punto.x <= caja.right - 26 && punto.y >= caja.top + 26 && punto.y <= caja.bottom - 26) return;
  const vista = moduloGrafo.vistaSvg;
  vista.x = x - vista.ancho / 2; vista.y = y - vista.alto / 2;
  actualizarVistaEditorGrafo();
}

function elementoSvgGrafo(nombre, atributos, texto) {
  const elemento = document.createElementNS(SVG_NS, nombre);
  Object.entries(atributos || {}).forEach(([clave, valor]) => elemento.setAttribute(clave, String(valor)));
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function nombreNodoGrafo(id) {
  const nodo = moduloGrafo.grafo.nodos.find(n => n.id === id);
  return nodo ? nodo.nombre : '—';
}

function textoAristaGrafo(id) {
  const c = moduloGrafo.grafo.conexiones.find(a => a.id === id);
  return c ? nombreNodoGrafo(c.desde) + (moduloGrafo.grafo.dirigido ? ' → ' : ' — ') + nombreNodoGrafo(c.hacia) + ' = ' + c.valor : '—';
}

function seleccionarElementoGrafo(tipo, id) {
  moduloGrafo.seleccion = { tipo, id };
  actualizarCamposEditorGrafo();
  dibujarEditorGrafo();
  // Cambia solo el encuadre del dibujo y conserva la posición de la página.
  centrarSeleccionEditorGrafo(tipo, id);
}

function actualizarCamposEditorGrafo() {
  const g = moduloGrafo.grafo;
  const seleccion = moduloGrafo.seleccion;
  function opciones(id, datos, vacio) {
    const campo = document.getElementById(id);
    const valor = campo.value;
    campo.replaceChildren();
    if (vacio) campo.add(new Option(vacio, ''));
    datos.forEach(([clave, texto]) => campo.add(new Option(texto, clave)));
    if (datos.some(d => d[0] === valor)) campo.value = valor;
  }
  const nodos = g.nodos.map(n => [n.id, n.nombre + ' · ' + n.id]);
  ['seleccionVertice', 'aristaDesde', 'aristaHacia', 'origenGrafo'].forEach(id => opciones(id, nodos, 'Selecciona un vértice'));
  opciones('destinoGrafo', nodos, 'Todos los destinos');
  opciones('seleccionArista', g.conexiones.map(c => [c.id, textoAristaGrafo(c.id)]), 'Selecciona una arista');
  document.getElementById('seleccionVertice').value = seleccion && seleccion.tipo === 'nodo' ? seleccion.id : '';
  document.getElementById('seleccionArista').value = seleccion && seleccion.tipo === 'arista' ? seleccion.id : '';
  ['nombreSeleccionado', 'posicionNodoX', 'posicionNodoY', 'btnRenombrarVertice', 'btnMoverVertice', 'btnEliminarVertice'].forEach(id => {
    document.getElementById(id).disabled = !seleccion || seleccion.tipo !== 'nodo';
  });
  ['pesoSeleccionado', 'btnEditarPeso', 'btnEliminarArista'].forEach(id => {
    document.getElementById(id).disabled = !seleccion || seleccion.tipo !== 'arista';
  });
  if (seleccion && seleccion.tipo === 'nodo') {
    const nodo = g.nodos.find(n => n.id === seleccion.id);
    if (nodo) {
      document.getElementById('seleccionVertice').value = nodo.id;
      document.getElementById('nombreSeleccionado').value = nodo.nombre;
      document.getElementById('posicionNodoX').value = Math.round(nodo.x);
      document.getElementById('posicionNodoY').value = Math.round(nodo.y);
    }
  } else if (seleccion && seleccion.tipo === 'arista') {
    const arista = g.conexiones.find(c => c.id === seleccion.id);
    if (arista) {
      document.getElementById('seleccionArista').value = arista.id;
      document.getElementById('pesoSeleccionado').value = arista.valor;
    }
  }
  document.getElementById('origenGrafo').value = moduloGrafo.origen || '';
  document.getElementById('destinoGrafo').value = moduloGrafo.destino || '';
  document.getElementById('objetivoGrafo').value = moduloGrafo.objetivo;
  document.getElementById('selectorModoGrafo').value = g.dirigido ? 'dirigido' : 'no-dirigido';
}

function dibujarEditorGrafo() {
  const svg = document.getElementById('svgModuloGrafo');
  const radio = aplicarVistaEditorGrafo();
  const matrizVista = svg.getScreenCTM();
  const escalaVista = Math.max(.05, Math.hypot(matrizVista.a, matrizVista.b));
  const separacionPeso = Math.max(20, 18 / escalaVista);
  const etiquetas = [];
  const g = moduloGrafo.grafo;
  const resultado = moduloGrafo.resultado;
  const paso = pasoVisibleModuloGrafo();
  const mostrandoResultado = moduloGrafo.vista === 'resultado';
  const elegidas = new Set(resultado ? (mostrandoResultado ? (resultado.arbol || resultado.elegidas) : (paso && (paso.elegidas || Object.values(paso.predecesores || {}).filter(Boolean).map(p => p.conexion))) || []) : []);
  const ruta = resultado && moduloGrafo.modulo === 'dijkstra' && mostrandoResultado && moduloGrafo.destino ? reconstruirRutaGrafo(resultado, moduloGrafo.destino) : null;
  const finalizados = new Set(paso && !mostrandoResultado ? paso.finalizados || [] : []);
  const porId = new Map(g.nodos.map(n => [n.id, n]));
  const capa = elementoSvgGrafo('g');
  const defs = elementoSvgGrafo('defs');
  const marcador = elementoSvgGrafo('marker', { id: 'flechaEditorGrafo', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' });
  marcador.appendChild(elementoSvgGrafo('path', { d: 'M0 0 10 5 0 10z', class: 'gm-flecha' }));
  defs.appendChild(marcador); capa.appendChild(defs);
  g.conexiones.forEach(c => {
    const desde = porId.get(c.desde), hacia = porId.get(c.hacia);
    const dx = hacia.x - desde.x, dy = hacia.y - desde.y, longitud = Math.hypot(dx, dy) || 1;
    const ux = dx / longitud, uy = dy / longitud;
    const opuesta = g.dirigido && g.conexiones.some(a => a.desde === c.hacia && a.hacia === c.desde);
    const curva = opuesta ? 32 : 0;
    const margenDesde = Math.min(radio + 3, longitud * .45), margenHasta = Math.min(radio + 6, longitud * .45);
    const x1 = desde.x + ux * margenDesde, y1 = desde.y + uy * margenDesde;
    const x2 = hacia.x - ux * margenHasta, y2 = hacia.y - uy * margenHasta;
    const mx = (x1 + x2) / 2 - uy * curva, my = (y1 + y2) / 2 + ux * curva;
    const d = 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
    const seleccionado = moduloGrafo.seleccion && moduloGrafo.seleccion.id === c.id;
    const grupo = elementoSvgGrafo('g', { class: 'arista-editor-grafo' + (seleccionado ? ' seleccionado' : '') + (elegidas.has(c.id) ? ' elegida' : '') + (paso && !mostrandoResultado && paso.arista === c.id ? ' actual' : '') + (ruta && ruta.conexiones.includes(c.id) ? ' ruta' : ''), 'data-id': c.id, tabindex: 0, role: 'button', 'aria-label': 'Editar arista ' + textoAristaGrafo(c.id) });
    grupo.appendChild(elementoSvgGrafo('title', {}, textoAristaGrafo(c.id)));
    grupo.appendChild(elementoSvgGrafo('path', { d, class: 'gm-arista-hit' }));
    const linea = elementoSvgGrafo('path', { d, class: 'gm-arista-linea' });
    if (g.dirigido) linea.setAttribute('marker-end', 'url(#flechaEditorGrafo)');
    grupo.appendChild(linea);
    const etiqueta = elementoSvgGrafo('text', { class: 'gm-peso' }, c.valor);
    // El tercio del tramo mantiene el peso junto a su arista y fuera de cruces centrales.
    etiquetas.push({ elemento: etiqueta, x: (4 * x1 + 4 * mx + x2) / 9, y: (4 * y1 + 4 * my + y2) / 9, nx: -uy, ny: ux });
    grupo.appendChild(etiqueta);
    activarSeleccionSvgGrafo(grupo, 'arista', c.id);
    capa.appendChild(grupo);
  });
  g.nodos.forEach(n => {
    const seleccionado = moduloGrafo.seleccion && moduloGrafo.seleccion.id === n.id;
    const grupo = elementoSvgGrafo('g', { transform: 'translate(' + n.x + ' ' + n.y + ')', class: 'nodo-editor-grafo' + (seleccionado ? ' seleccionado' : '') + (paso && !mostrandoResultado && paso.actual === n.id ? ' actual' : '') + (finalizados.has(n.id) ? ' finalizado' : ''), 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': 'Seleccionar vértice ' + n.nombre });
    grupo.appendChild(elementoSvgGrafo('title', {}, n.nombre + ' · ' + n.id));
    grupo.appendChild(elementoSvgGrafo('circle', { r: radio }));
    grupo.appendChild(elementoSvgGrafo('text', { y: 0 }, n.nombre.length > 5 ? n.nombre.slice(0, 4) + '…' : n.nombre));
    activarSeleccionSvgGrafo(grupo, 'nodo', n.id);
    grupo.addEventListener('pointerdown', evento => comenzarArrastreGrafo(evento, grupo, n));
    capa.appendChild(grupo);
  });
  if (!g.nodos.length) {
    const vacio = elementoSvgGrafo('text', { x: 500, y: 220 });
    ['Tu grafo está vacío.', 'Carga un ejemplo', 'o crea un vértice.'].forEach((linea, i) => {
      vacio.appendChild(elementoSvgGrafo('tspan', { x: 500, dy: i ? '1.6em' : 0 }, linea));
    });
    capa.appendChild(vacio);
  }
  svg.replaceChildren(capa);
  colocarPesosEditorGrafo(svg, etiquetas, separacionPeso, escalaVista);
  document.getElementById('resumenGrafo').textContent = g.nodos.length + ' / ' + GRAFOS_MAX_NODOS + ' vértices · ' + g.conexiones.length + ' / ' + GRAFOS_MAX_ARISTAS + ' aristas · ' + (g.dirigido ? 'Dirigido' : 'No dirigido');
  document.getElementById('seleccionTextoGrafo').textContent = (moduloGrafo.seleccion ? 'Selección: ' + (moduloGrafo.seleccion.tipo === 'nodo' ? nombreNodoGrafo(moduloGrafo.seleccion.id) : textoAristaGrafo(moduloGrafo.seleccion.id)) : 'Selecciona un vértice o una arista, o usa las listas de edición.') + ' Ver todo muestra el grafo completo. Abre Zoom y más para acercar y recorrerlo con las flechas. Las listas llevan a la selección aunque esté fuera de la vista.';
}

function colocarPesosEditorGrafo(svg, etiquetas, separacion, escala) {
  const lienzo = svg.getBoundingClientRect();
  const nodos = Array.from(svg.querySelectorAll('.nodo-editor-grafo circle'), n => n.getBoundingClientRect());
  const colocadas = [];
  const seCruzan = (a, b) => a.left < b.right + 2 && a.right > b.left - 2 && a.top < b.bottom + 2 && a.bottom > b.top - 2;
  etiquetas.forEach(etiqueta => {
    const situar = distancia => {
      etiqueta.elemento.setAttribute('x', etiqueta.x + etiqueta.nx * distancia);
      etiqueta.elemento.setAttribute('y', etiqueta.y + etiqueta.ny * distancia);
      return etiqueta.elemento.getBoundingClientRect();
    };
    // Cambia de lado cuando dos pesos coinciden; las coordenadas del grafo se conservan.
    let caja;
    for (const distancia of [separacion, -separacion, separacion + 12 / escala, -separacion - 12 / escala]) {
      caja = situar(distancia);
      const dentro = caja.left >= lienzo.left + 2 && caja.right <= lienzo.right - 2 && caja.top >= lienzo.top + 2 && caja.bottom <= lienzo.bottom - 2;
      if (dentro && !colocadas.some(otra => seCruzan(caja, otra)) && !nodos.some(nodo => seCruzan(caja, nodo))) break;
      caja = null;
    }
    colocadas.push(caja || situar(separacion));
  });
}

function activarSeleccionSvgGrafo(elemento, tipo, id) {
  elemento.addEventListener('click', () => seleccionarElementoGrafo(tipo, id));
  elemento.addEventListener('keydown', evento => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault(); seleccionarElementoGrafo(tipo, id);
      const nuevo = document.querySelector('[data-id="' + CSS.escape(id) + '"]');
      if (nuevo) nuevo.focus();
    }
  });
}

function comenzarArrastreGrafo(evento, grupo, nodo) {
  if (evento.pointerType !== 'mouse' || evento.button !== 0) return;
  const svg = document.getElementById('svgModuloGrafo');
  const punto = e => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return { x: limitar(p.x, 30, 970), y: limitar(p.y, 30, 570) };
  };
  const inicio = punto(evento);
  let final = { x: nodo.x, y: nodo.y };
  const revision = moduloGrafo.revision;
  grupo.setPointerCapture(evento.pointerId);
  const mover = e => {
    const p = punto(e);
    final = { x: limitar(nodo.x + p.x - inicio.x, 30, 970), y: limitar(nodo.y + p.y - inicio.y, 30, 570) };
    grupo.setAttribute('transform', 'translate(' + final.x + ' ' + final.y + ')');
  };
  const terminar = e => {
    grupo.removeEventListener('pointermove', mover); grupo.removeEventListener('pointerup', terminar);
    grupo.removeEventListener('pointercancel', cancelar);
    if (revision !== moduloGrafo.revision) { dibujarEditorGrafo(); return; }
    if (Math.hypot(final.x - nodo.x, final.y - nodo.y) > 1) {
      const g = copiarGrafoModulo(moduloGrafo.grafo);
      Object.assign(g.nodos.find(n => n.id === nodo.id), final);
      comprometerGrafo(g, 'Posición actualizada.', false);
    }
    seleccionarElementoGrafo('nodo', nodo.id);
    if (grupo.hasPointerCapture(e.pointerId)) grupo.releasePointerCapture(e.pointerId);
  };
  const cancelar = () => { grupo.removeEventListener('pointermove', mover); grupo.removeEventListener('pointerup', terminar); grupo.removeEventListener('pointercancel', cancelar); dibujarEditorGrafo(); };
  grupo.addEventListener('pointermove', mover); grupo.addEventListener('pointerup', terminar); grupo.addEventListener('pointercancel', cancelar);
}
