/* Dibujo y edición SVG pequeños, compartidos por los dos módulos de grafos. */
'use strict';

// Las coordenadas del ejercicio no cambian al adaptar la vista a una pantalla.
let vistaAjustadaEditorGrafo = true;
let observadorVistaEditorGrafo;
let arrastreVistaGrafo = null;
let suprimirClickEditorGrafo = 0;

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
  const margen = Math.max(100, 88 / escala);
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
  instalarHerramientasEditorGrafo();
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
  actualizarHerramientasEditorGrafo();
  if (moduloGrafo.vista === 'grafo') {
    document.getElementById(tipo === 'nodo' ? 'ajustesVerticeGrafo' : 'ajustesAristaGrafo').open = true;
  }
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
  const nodos = g.nodos.map(n => [n.id, n.nombre]);
  ['seleccionVertice', 'aristaDesde', 'aristaHacia', 'origenGrafo'].forEach(id => opciones(id, nodos, id === 'aristaDesde' || id === 'aristaHacia' ? 'Elige…' : 'Elige un punto'));
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
  const focoAnterior = document.activeElement;
  const idEnfocado = focoAnterior && document.getElementById('svgModuloGrafo').contains(focoAnterior)
    ? focoAnterior.closest('[data-id]')?.dataset.id : null;
  const svg = document.getElementById('svgModuloGrafo');
  // La presentación oculta el editor. Se dibuja al mostrarlo, cuando tiene medidas.
  if (!svg.getClientRects().length) return;
  const radio = aplicarVistaEditorGrafo();
  const matrizVista = svg.getScreenCTM();
  const escalaVista = Math.max(.05, Math.hypot(matrizVista.a, matrizVista.b));
  const fuenteNombre = Math.max(16, 13 / escalaVista);
  const fuenteDistancia = Math.max(18, 14 / escalaVista);
  const separacionPeso = Math.max(20, 18 / escalaVista);
  const etiquetas = [];
  const g = arrastreVistaGrafo ? copiarGrafoModulo(moduloGrafo.grafo) : moduloGrafo.grafo;
  if (arrastreVistaGrafo) Object.assign(g.nodos.find(n => n.id === arrastreVistaGrafo.id), arrastreVistaGrafo.posicion);
  const resultado = moduloGrafo.resultado;
  const paso = pasoVisibleModuloGrafo();
  const mostrandoResultado = moduloGrafo.vista === 'resultado';
  const elegidas = new Set(resultado ? (mostrandoResultado ? (resultado.arbol || resultado.elegidas) : (paso && (paso.elegidas || Object.values(paso.predecesores || {}).filter(Boolean).map(p => p.conexion))) || []) : []);
  const ruta = resultado && moduloGrafo.modulo === 'dijkstra' && mostrandoResultado && moduloGrafo.destino ? reconstruirRutaGrafo(resultado, moduloGrafo.destino) : null;
  const finalizados = new Set(paso && !mostrandoResultado ? paso.finalizados || [] : []);
  const porId = new Map(g.nodos.map(n => [n.id, n]));
  const radioNodo = n => {
    const distancia = esDijkstraModulo && resultado ? (mostrandoResultado ? resultado.distancias[n.id] : paso && paso.distancias[n.id]) : undefined;
    const anchoNombre = Math.min(n.nombre.length, 6) * fuenteNombre * .34 + 10 / escalaVista;
    const anchoDistancia = distancia === undefined ? 0 : ('d = ' + distanciaTextoGrafo(distancia)).length * fuenteDistancia * .32 + 9 / escalaVista;
    const altoTexto = n.nombre.length > 6 ? (distancia === undefined ? fuenteNombre * 1.8
      : (fuenteNombre + fuenteDistancia) * .8 + fuenteDistancia * .8) + 10 / escalaVista : 0;
    return Math.max(radio, anchoNombre, anchoDistancia, altoTexto);
  };
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
    const margenDesde = Math.min(radioNodo(desde) + 3, longitud * .45), margenHasta = Math.min(radioNodo(hacia) + 6, longitud * .45);
    const x1 = desde.x + ux * margenDesde, y1 = desde.y + uy * margenDesde;
    const x2 = hacia.x - ux * margenHasta, y2 = hacia.y - uy * margenHasta;
    const mx = (x1 + x2) / 2 - uy * curva, my = (y1 + y2) / 2 + ux * curva;
    const d = 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
    const seleccionado = moduloGrafo.seleccion && moduloGrafo.seleccion.id === c.id;
    const descartada = mostrandoResultado && !esDijkstraModulo && resultado && !elegidas.has(c.id);
    const grupo = elementoSvgGrafo('g', { class: 'arista-editor-grafo' + (seleccionado ? ' seleccionado' : '') + (elegidas.has(c.id) ? ' elegida' : '') + (descartada ? ' descartada' : '') + (paso && !mostrandoResultado && paso.arista === c.id ? ' actual' : '') + (ruta && ruta.conexiones.includes(c.id) ? ' ruta' : ''), 'data-id': c.id, tabindex: 0, role: 'button', 'aria-label': 'Editar arista ' + textoAristaGrafo(c.id) + (descartada ? ', descartada por ciclo' : elegidas.has(c.id) ? ', elegida' : '') });
    if (mostrandoResultado && esDijkstraModulo && !elegidas.has(c.id)) grupo.classList.add('gm-arista-secundaria');
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
    const radioActual = radioNodo(n);
    const seleccionado = moduloGrafo.seleccion && moduloGrafo.seleccion.id === n.id;
    const grupo = elementoSvgGrafo('g', { transform: 'translate(' + n.x + ' ' + n.y + ')', class: 'nodo-editor-grafo' + (seleccionado ? ' seleccionado' : '') + (paso && !mostrandoResultado && paso.actual === n.id ? ' actual' : '') + (finalizados.has(n.id) ? ' finalizado' : '') + (esDijkstraModulo && n.id === moduloGrafo.origen ? ' gm-origen' : '') + (esDijkstraModulo && n.id === moduloGrafo.destino ? ' gm-destino' : ''), 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': 'Seleccionar vértice ' + n.nombre + (esDijkstraModulo && n.id === moduloGrafo.origen ? ', origen' : '') + (esDijkstraModulo && n.id === moduloGrafo.destino ? ', destino' : '') });
    grupo.appendChild(elementoSvgGrafo('title', {}, n.nombre + ' · ' + n.id));
    if (moduloGrafo.conexionDesde === n.id) grupo.classList.add('gm-extremo-conexion');
    grupo.appendChild(elementoSvgGrafo('circle', { r: radioActual }));
    const distancia = esDijkstraModulo && resultado ? (mostrandoResultado ? resultado.distancias[n.id] : paso && paso.distancias[n.id]) : undefined;
    const multilinea = n.nombre.length > 6;
    // La fuente tiene un tamaño mínimo lógico; sus separaciones deben usar ese
    // mismo tamaño para que acercar la vista no junte nombre y distancia.
    const yNombre = multilinea ? -fuenteNombre * (distancia !== undefined ? 1.2 : .6)
      : distancia !== undefined ? -fuenteDistancia * .65 : 0;
    const nombre = elementoSvgGrafo('text', { y: yNombre, class: 'gm-nombre-nodo' });
    if (multilinea) { nombre.append(elementoSvgGrafo('tspan', { x: 0 }, n.nombre.slice(0, 6)), elementoSvgGrafo('tspan', { x: 0, dy: fuenteNombre * 1.2 }, n.nombre.slice(6))); }
    else nombre.textContent = n.nombre;
    nombre.style.fontSize = fuenteNombre + 'px'; grupo.appendChild(nombre);
    if (distancia !== undefined) {
      const yDistancia = multilinea ? (fuenteNombre + fuenteDistancia) * .8 + 4 / escalaVista : fuenteNombre * .75;
      const etiquetaDistancia = elementoSvgGrafo('text', { y: yDistancia, class: 'gm-distancia-nodo' }, 'd = ' + distanciaTextoGrafo(distancia));
      etiquetaDistancia.style.fontSize = fuenteDistancia + 'px';
      grupo.appendChild(etiquetaDistancia);
      grupo.setAttribute('aria-label', grupo.getAttribute('aria-label') + ', distancia desde el origen ' + distanciaTextoGrafo(distancia));
    }
    if (esDijkstraModulo && (n.id === moduloGrafo.origen || n.id === moduloGrafo.destino)) {
      grupo.appendChild(elementoSvgGrafo('text', { y: radioActual + 16 / escalaVista, class: 'gm-nodo-etiqueta' }, n.id === moduloGrafo.origen && n.id === moduloGrafo.destino ? 'Origen / destino' : n.id === moduloGrafo.origen ? 'Origen' : 'Destino'));
    }
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
  if (idEnfocado) Array.from(svg.querySelectorAll('[data-id]')).find(n => n.dataset.id === idEnfocado)?.focus({ preventScroll: true });
  colocarPesosEditorGrafo(svg, etiquetas, separacionPeso, escalaVista);
  document.getElementById('bienvenidaGrafo').hidden = !!g.nodos.length;
  document.getElementById('resumenGrafo').textContent = g.nodos.length + ' puntos · ' + g.conexiones.length + ' conexiones · ' + (g.dirigido ? 'Con dirección →' : 'En ambos sentidos ↔');
  document.getElementById('seleccionTextoGrafo').textContent = moduloGrafo.seleccion
    ? 'Selección: ' + (moduloGrafo.seleccion.tipo === 'nodo' ? nombreNodoGrafo(moduloGrafo.seleccion.id) : textoAristaGrafo(moduloGrafo.seleccion.id)) + '. Puedes editar sus datos en el formulario.'
    : 'Selecciona o arrastra puntos con ratón o pantalla táctil. Usa las herramientas para crear, conectar o desplazar; los formularios permiten las mismas operaciones con teclado.';
  actualizarHerramientasEditorGrafo();
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
  const activar = () => {
    if (Date.now() < suprimirClickEditorGrafo) return;
    if (tipo === 'nodo' && moduloGrafo.herramienta === 'conectar') conectarExtremoEditorGrafo(id);
    else if (moduloGrafo.herramienta !== 'desplazar') seleccionarElementoGrafo(tipo, id);
  };
  elemento.addEventListener('click', evento => { evento.stopPropagation(); activar(); });
  elemento.addEventListener('keydown', evento => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault(); activar();
      const nuevo = document.querySelector('[data-id="' + CSS.escape(id) + '"]');
      if (nuevo) nuevo.focus();
    }
  });
}

function comenzarArrastreGrafo(evento, grupo, nodo) {
  if (moduloGrafo.herramienta !== 'seleccionar' || evento.button !== 0 || !evento.isPrimary) return;
  evento.stopPropagation();
  const svg = document.getElementById('svgModuloGrafo');
  const punto = e => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return { x: limitar(p.x, 30, 970), y: limitar(p.y, 30, 570) };
  };
  const inicio = punto(evento);
  let final = { x: nodo.x, y: nodo.y };
  const revision = moduloGrafo.revision;
  svg.setPointerCapture(evento.pointerId);
  const mover = e => {
    const p = punto(e);
    final = { x: limitar(nodo.x + p.x - inicio.x, 30, 970), y: limitar(nodo.y + p.y - inicio.y, 30, 570) };
    if (Math.hypot(final.x - nodo.x, final.y - nodo.y) > 3) {
      vistaAjustadaEditorGrafo = false;
      arrastreVistaGrafo = { id: nodo.id, posicion: final };
      dibujarEditorGrafo();
    }
  };
  const terminar = e => {
    svg.removeEventListener('pointermove', mover); svg.removeEventListener('pointerup', terminar);
    svg.removeEventListener('pointercancel', cancelar);
    arrastreVistaGrafo = null;
    if (revision !== moduloGrafo.revision) { dibujarEditorGrafo(); return; }
    if (Math.hypot(final.x - nodo.x, final.y - nodo.y) > 1) {
      suprimirClickEditorGrafo = Date.now() + 400;
      const g = copiarGrafoModulo(moduloGrafo.grafo);
      Object.assign(g.nodos.find(n => n.id === nodo.id), final);
      comprometerGrafo(g, 'Posición actualizada.', false);
    }
    seleccionarElementoGrafo('nodo', nodo.id);
    if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
  };
  const cancelar = () => { svg.removeEventListener('pointermove', mover); svg.removeEventListener('pointerup', terminar); svg.removeEventListener('pointercancel', cancelar); arrastreVistaGrafo = null; dibujarEditorGrafo(); };
  svg.addEventListener('pointermove', mover); svg.addEventListener('pointerup', terminar); svg.addEventListener('pointercancel', cancelar);
}

function actualizarHerramientasEditorGrafo() {
  document.querySelectorAll('[data-herramienta-grafo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.herramientaGrafo === moduloGrafo.herramienta)));
  const svg = document.getElementById('svgModuloGrafo');
  svg.dataset.herramienta = moduloGrafo.herramienta;
  document.getElementById('btnCancelarConexionGrafo').hidden = !moduloGrafo.conexionDesde;
  document.getElementById('btnEditarSeleccionGrafo').disabled = !moduloGrafo.seleccion;
  document.getElementById('bienvenidaGrafo').hidden = !!moduloGrafo.grafo.nodos.length || moduloGrafo.herramienta === 'crear';
  document.getElementById('estadoHerramientaGrafo').textContent = moduloGrafo.conexionDesde
    ? 'Desde ' + nombreNodoGrafo(moduloGrafo.conexionDesde) + ': elige el otro extremo. Escape o «Cancelar conexión» cancela.'
    : ({ seleccionar: 'Selecciona un elemento o arrastra un punto. Doble clic en el fondo crea un punto.', crear: 'Toca o haz clic en el fondo para crear un punto. También puedes usar el formulario.', conectar: 'Selecciona dos puntos para conectar sus extremos y después escribe el peso.', desplazar: 'Arrastra el lienzo para desplazar la vista. Los controles de zoom también funcionan con teclado y táctil.' })[moduloGrafo.herramienta];
}

function cancelarConexionEditorGrafo() {
  moduloGrafo.conexionDesde = null;
  dibujarEditorGrafo(); actualizarHerramientasEditorGrafo();
}

function ejecutarOperacionEditorGrafo(operacion, mensaje) {
  const resultado = operarGrafoModulo(moduloGrafo.grafo, moduloGrafo.modulo, operacion);
  if (!resultado.ok) { notificar(resultado.error + ' El ejercicio anterior se conserva.', 'error'); return false; }
  if (!comprometerGrafo(resultado.grafo, mensaje)) return false;
  if (operacion.tipo === 'nodo' || operacion.tipo === 'arista') seleccionarElementoGrafo(operacion.tipo === 'nodo' ? 'nodo' : 'arista', resultado.id);
  return true;
}

async function crearNodoEnPuntoEditorGrafo(evento) {
  if (moduloGrafo.solicitandoConexion) return;
  const svg = document.getElementById('svgModuloGrafo');
  const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(svg.getScreenCTM().inverse());
  const revision = moduloGrafo.revision;
  moduloGrafo.solicitandoConexion = true;
  const nombre = await dialogoPedirTexto({ titulo: 'Crear un punto', mensaje: 'Escribe su nombre. Podrás moverlo o renombrarlo después.', valor: String.fromCharCode(65 + moduloGrafo.grafo.nodos.length), validar: texto => {
    const valor = String(texto).trim();
    return valor && valor.length <= MAX_LARGO_NOMBRE ? { ok: true, valor } : { ok: false, error: 'Escribe un nombre de 1 a ' + MAX_LARGO_NOMBRE + ' caracteres.' };
  } });
  moduloGrafo.solicitandoConexion = false;
  if (nombre === undefined || revision !== moduloGrafo.revision) return;
  ejecutarOperacionEditorGrafo({ tipo: 'nodo', nombre, x: limitar(p.x, 30, 970), y: limitar(p.y, 30, 570) }, 'Punto creado.');
}

async function conectarExtremoEditorGrafo(id) {
  if (moduloGrafo.solicitandoConexion) return;
  if (!moduloGrafo.conexionDesde) {
    moduloGrafo.conexionDesde = id; moduloGrafo.seleccion = { tipo: 'nodo', id };
    actualizarCamposEditorGrafo(); dibujarEditorGrafo(); return;
  }
  const desde = moduloGrafo.conexionDesde;
  if (desde === id) { notificar('Elige otro punto. El editor no admite bucles.', 'aviso'); return; }
  const existente = moduloGrafo.grafo.conexiones.find(c => c.desde === desde && c.hacia === id || !moduloGrafo.grafo.dirigido && c.desde === id && c.hacia === desde);
  if (existente) { notificar('Esta conexión ya existe. Selecciónala para editar su peso.', 'aviso'); return; }
  const revision = moduloGrafo.revision;
  moduloGrafo.solicitandoConexion = true;
  const valor = await dialogoPedirTexto({ titulo: 'Peso de la conexión', mensaje: nombreNodoGrafo(desde) + (moduloGrafo.grafo.dirigido ? ' → ' : ' — ') + nombreNodoGrafo(id) + '. ' + (esDijkstraModulo ? 'Dijkstra admite enteros no negativos; cero es válido.' : 'Kruskal admite enteros negativos, cero y positivos.'), valor: document.getElementById('pesoArista').value, validar: validarPesoEditorGrafo, inputmode: 'numeric' });
  moduloGrafo.solicitandoConexion = false;
  // Cancelar el diálogo cancela también la conexión pendiente.
  if (valor === undefined || revision !== moduloGrafo.revision || moduloGrafo.conexionDesde !== desde) { cancelarConexionEditorGrafo(); return; }
  moduloGrafo.conexionDesde = null;
  ejecutarOperacionEditorGrafo({ tipo: 'arista', desde, hacia: id, valor }, 'Conexión creada.');
}

function organizarEditorGrafo() {
  const g = copiarGrafoModulo(moduloGrafo.grafo);
  if (!g.nodos.length) return;
  // Solo una acción explícita distribuye las posiciones; calcular y elegir rutas no lo hacen.
  const caja = document.getElementById('svgModuloGrafo').getBoundingClientRect();
  const proporcion = Math.max(.6, Math.min(1.9, caja.width / Math.max(1, caja.height)));
  const columnas = Math.ceil(Math.sqrt(g.nodos.length * proporcion)), filas = Math.ceil(g.nodos.length / columnas), ancho = Math.min(790, 400 * proporcion);
  g.nodos.forEach((n, i) => { n.x = columnas === 1 ? 500 : 500 - ancho / 2 + (i % columnas) * ancho / (columnas - 1); n.y = filas === 1 ? 300 : 100 + Math.floor(i / columnas) * 400 / (filas - 1); });
  const seleccion = moduloGrafo.seleccion;
  comprometerGrafo(g, 'Distribución actualizada; el cálculo se conserva.', false);
  moduloGrafo.seleccion = seleccion; ajustarVistaEditorGrafo(); actualizarCamposEditorGrafo();
}

function instalarHerramientasEditorGrafo() {
  const svg = document.getElementById('svgModuloGrafo');
  document.querySelectorAll('[data-herramienta-grafo]').forEach(b => b.addEventListener('click', () => {
    moduloGrafo.herramienta = b.dataset.herramientaGrafo; cancelarConexionEditorGrafo();
  }));
  document.getElementById('btnCancelarConexionGrafo').addEventListener('click', cancelarConexionEditorGrafo);
  document.getElementById('btnOrganizarGrafo').addEventListener('click', organizarEditorGrafo);
  document.getElementById('btnEditarSeleccionGrafo').addEventListener('click', () => {
    if (!moduloGrafo.seleccion) return;
    const seleccion = moduloGrafo.seleccion;
    cambiarVistaModuloGrafo('grafo'); seleccionarElementoGrafo(seleccion.tipo, seleccion.id);
    document.getElementById(seleccion.tipo === 'nodo' ? 'nombreSeleccionado' : 'pesoSeleccionado').focus({ preventScroll: true });
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && moduloGrafo.conexionDesde && !moduloGrafo.solicitandoConexion) { evento.preventDefault(); cancelarConexionEditorGrafo(); }
  });
  svg.addEventListener('click', evento => {
    if (Date.now() < suprimirClickEditorGrafo || evento.target.closest('[data-id]')) return;
    if (moduloGrafo.herramienta === 'crear') crearNodoEnPuntoEditorGrafo(evento);
    else if (moduloGrafo.herramienta === 'conectar') cancelarConexionEditorGrafo();
  });
  svg.addEventListener('dblclick', evento => {
    if (moduloGrafo.herramienta === 'seleccionar' && !evento.target.closest('[data-id]')) { evento.preventDefault(); crearNodoEnPuntoEditorGrafo(evento); }
  });
  svg.addEventListener('pointerdown', evento => {
    if (moduloGrafo.herramienta !== 'desplazar' || evento.button !== 0 || !evento.isPrimary) return;
    const inicio = { x: evento.clientX, y: evento.clientY }, vista = Object.assign({}, moduloGrafo.vistaSvg);
    const inversa = svg.getScreenCTM().inverse();
    const puntoInicio = new DOMPoint(inicio.x, inicio.y).matrixTransform(inversa);
    svg.setPointerCapture(evento.pointerId);
    const mover = e => { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(inversa); Object.assign(moduloGrafo.vistaSvg, { x: vista.x - p.x + puntoInicio.x, y: vista.y - p.y + puntoInicio.y }); actualizarVistaEditorGrafo(); };
    const terminar = e => { svg.removeEventListener('pointermove', mover); svg.removeEventListener('pointerup', terminar); svg.removeEventListener('pointercancel', terminar); if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId); };
    svg.addEventListener('pointermove', mover); svg.addEventListener('pointerup', terminar); svg.addEventListener('pointercancel', terminar);
  });
  actualizarHerramientasEditorGrafo();
}
