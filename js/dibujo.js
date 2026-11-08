/* Geometría de las conexiones y dibujo del grafo con SVG. */

'use strict';

// Las constantes SVG_NS, RADIO_NODO, SEPARACION_ARROW, CURVATURA ahora vienen de config.js

function crearSVG(etiqueta, atributos) {
  const nodo = document.createElementNS(SVG_NS, etiqueta);
  for (const clave in atributos) nodo.setAttribute(clave, atributos[clave]);
  return nodo;
}

// Punto sobre el borde del círculo de un nodo, mirando hacia (hx, hy).
function puntoEnBorde(nodo, hx, hy, distancia) {
  const dx = hx - nodo.x, dy = hy - nodo.y;
  const largo = Math.hypot(dx, dy) || 1;
  return { x: nodo.x + (dx / largo) * distancia, y: nodo.y + (dy / largo) * distancia };
}

/** Evita que una conexión larga atraviese vértices intermedios alineados. */
function curvaParaEvitarNodosJohnson(a, b, radio) {
  const otros = estado.nodos.filter(nodo => nodo.id !== a.id && nodo.id !== b.id);
  if (!otros.length) return null;
  const dx = b.x - a.x, dy = b.y - a.y, largo2 = dx * dx + dy * dy;
  if (!largo2) return null;
  const distanciaSegmento = (punto, desde, hacia) => {
    const vx = hacia.x - desde.x, vy = hacia.y - desde.y;
    const t = limitar(((punto.x - desde.x) * vx + (punto.y - desde.y) * vy) / (vx * vx + vy * vy || 1), 0, 1);
    return Math.hypot(punto.x - desde.x - t * vx, punto.y - desde.y - t * vy);
  };
  if (!otros.some(nodo => distanciaSegmento(nodo, a, b) < radio + 16)) return null;
  const largo = Math.sqrt(largo2), nx = -dy / largo, ny = dx / largo;
  let mejor = null, menorChoque = Infinity;
  for (const factor of [2.8, 4.2, 6.3, 9.5]) {
    for (const lado of [-1, 1]) {
      const control = { x: (a.x + b.x) / 2 + nx * (radio + 24) * factor * lado,
        y: (a.y + b.y) / 2 + ny * (radio + 24) * factor * lado };
      const inicio = puntoEnBorde(a, control.x, control.y, radio);
      const fin = puntoEnBorde(b, control.x, control.y, radio + SEPARACION_ARROW);
      const puntos = Array.from({ length: 49 }, (_, i) => {
        const t = i / 48, u = 1 - t;
        return { x: u * u * inicio.x + 2 * u * t * control.x + t * t * fin.x,
          y: u * u * inicio.y + 2 * u * t * control.y + t * t * fin.y };
      });
      const choques = otros.filter(nodo => puntos.slice(1).some((punto, i) => distanciaSegmento(nodo, puntos[i], punto) < radio + 16)).length;
      const geometria = { d: 'M ' + inicio.x + ' ' + inicio.y + ' Q ' + control.x + ' ' + control.y + ' ' + fin.x + ' ' + fin.y,
        etiquetaX: .25 * inicio.x + .5 * control.x + .25 * fin.x,
        etiquetaY: .25 * inicio.y + .5 * control.y + .25 * fin.y };
      if (!choques) return geometria;
      if (choques < menorChoque) { menorChoque = choques; mejor = geometria; }
    }
  }
  // En una distribución manual muy densa puede seguir siendo necesario Organizar.
  return mejor;
}

/**
 * Calcula la geometría (coordenadas y curvas) para dibujar una conexión.
 * Maneja conexiones directas, bucles (auto-conexiones) y conexiones bidireccionales.
 * @param {Object} conexion - La conexión a calcular
 * @returns {{d:string, etiquetaX:number, etiquetaY:number}|null}
 *          Objeto con el path SVG 'd' y coordenadas para la etiqueta del valor,
 *          o null si la conexión es inválida
 */
function radioVisualNodoJohnson(visual) {
  // El editor admite nombres de 12 caracteres y costos de hasta ocho cifras.
  // Reservar el espacio en el nodo evita comprimir los valores contra la T.
  return visual && visual.valoresNodos ? 92 : 42;
}

/** Nombre completo en hasta dos líneas, también antes de calcular la consulta. */
function dibujarNombreNodoJohnson(grupo, nodo, radio) {
  const caracteres = Array.from(String(nodo.nombre));
  const corte = caracteres.length > 7 ? Math.ceil(caracteres.length / 2) : caracteres.length;
  const lineas = caracteres.length > 7 ? [caracteres.slice(0, corte).join(''), caracteres.slice(corte).join('')] : [caracteres.join('')];
  const nombre = crearSVG('text', { x: nodo.x, y: nodo.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'font-size:14px' });
  lineas.forEach((linea, i) => {
    const texto = crearSVG('tspan', { x: nodo.x, y: nodo.y + (lineas.length > 1 ? i ? 9 : -9 : 0) });
    texto.textContent = linea;
    // Una cota conservadora sirve también cuando el SVG aún no está montado.
    const ancho = Math.max(30, radio * 2 - 18);
    if (Array.from(linea).length * 11 > ancho) {
      texto.setAttribute('textLength', ancho);
      texto.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    nombre.appendChild(texto);
  });
  const titulo = crearSVG('title', {});
  titulo.textContent = String(nodo.nombre);
  grupo.appendChild(titulo);
  grupo.appendChild(nombre);
}

function geometriaConexion(conexion, radioOpcional) {
  const a = buscarNodo(conexion.desde);
  const b = buscarNodo(conexion.hacia);
  if (!a || !b) return null;
  const radio = Number.isFinite(radioOpcional) && radioOpcional > 0 ? radioOpcional : RADIO_NODO;

  if (a.id === b.id) {
    const r = radio;
    // El bucle se dibuja arriba; si no cabe, se dibuja abajo para que no quede fuera de la vista.
    const cabeArriba = a.y > r * 3.4;
    const cabeAbajo = a.y + r * 3.4 < limitesPlanoGrafo().abajo;
    const lado = (cabeArriba || !cabeAbajo) ? -1 : 1;
    const d = 'M ' + (a.x - r * 0.55) + ' ' + (a.y + r * 0.83 * lado) +
              ' C ' + (a.x - r * 2.1) + ' ' + (a.y + r * 3 * lado) +
              ', ' + (a.x + r * 2.1) + ' ' + (a.y + r * 3 * lado) +
              ', ' + (a.x + r * 0.55) + ' ' + (a.y + r * 0.83 * lado);
    return { d: d, etiquetaX: a.x, etiquetaY: a.y + r * 2.35 * lado };
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo = Math.hypot(dx, dy) || 1;
  const ux = dx / largo, uy = dy / largo;

  if (!buscarConexionEntre(b.id, a.id)) {
    const curva = curvaParaEvitarNodosJohnson(a, b, radio);
    if (curva) return curva;
    const x1 = a.x + ux * radio;
    const y1 = a.y + uy * radio;
    const x2 = b.x - ux * (radio + SEPARACION_ARROW);
    const y2 = b.y - uy * (radio + SEPARACION_ARROW);
    return {
      d: 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2,
      etiquetaX: (x1 + x2) / 2 + (-uy) * 12,
      etiquetaY: (y1 + y2) / 2 + (ux) * 12
    };
  }

  // La perpendicular se calcula con la dirección propia de cada conexión,
  // por eso a->b y b->a se desvían automáticamente a lados opuestos.
  // El punto de control se mantiene dentro del área para que la curva y su valor no se salgan.
  const zona = limitesPlanoGrafo();
  const cx = limitar((a.x + b.x) / 2 + (-uy) * CURVATURA, zona.izquierda + 14, zona.derecha - 14);
  const cy = limitar((a.y + b.y) / 2 + (ux) * CURVATURA, zona.arriba + 14, zona.abajo - 14);
  const inicio = puntoEnBorde(a, cx, cy, radio);
  const fin = puntoEnBorde(b, cx, cy, radio + SEPARACION_ARROW);

  return {
    d: 'M ' + inicio.x + ' ' + inicio.y + ' Q ' + cx + ' ' + cy + ' ' + fin.x + ' ' + fin.y,
    // Punto medio de una curva cuadrática: 0.25*A + 0.5*C + 0.25*B
    etiquetaX: 0.25 * inicio.x + 0.5 * cx + 0.25 * fin.x,
    etiquetaY: 0.25 * inicio.y + 0.5 * cy + 0.25 * fin.y
  };
}

/** Reserva espacio para los pesos en el mismo plano SVG de ambas vistas. */
function separarEtiquetasGrafoJohnson(capaConexiones, capaNodos, visual) {
  if (!capaConexiones.childElementCount) return;
  const ampliar = (caja, margen) => ({ x: caja.x - margen, y: caja.y - margen, width: caja.width + margen * 2, height: caja.height + margen * 2 });
  const cruza = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const nodos = Array.from(capaNodos.querySelectorAll('.nodo')).map(nodo => ampliar(nodo.getBBox(), 12));
  const conexiones = Array.from(capaConexiones.querySelectorAll('.conexion')).map(grupo => {
    const linea = grupo.querySelector('.conexion-linea');
    const texto = grupo.querySelector('.conexion-valor');
    if (!linea || !texto) return null;
    const largo = linea.getTotalLength();
    const puntos = Array.from({ length: 25 }, (_, i) => linea.getPointAtLength(largo * i / 24));
    return { grupo, linea, texto, largo, puntos, caja: ampliar(linea.getBBox(), 20) };
  }).filter(Boolean);
  const ocupadas = [];
  const tramos = [];
  conexiones.forEach(conexion => {
    conexion.puntos.slice(1).forEach((punto, i) => {
      const anterior = conexion.puntos[i];
      const margen = i >= 21 ? 16 : 7; // Incluye el ancho de la punta de flecha.
      tramos.push(ampliar({ x: Math.min(anterior.x, punto.x), y: Math.min(anterior.y, punto.y), width: Math.abs(punto.x - anterior.x), height: Math.abs(punto.y - anterior.y) }, margen));
    });
  });
  // Consultar solo los tramos próximos evita recorrer 7.200 segmentos por cada
  // candidato cuando el editor alcanza su límite de 300 conexiones.
  const celda = 128, rejilla = new Map(), tramosGrandes = [];
  const celdasDe = caja => ({ x0: Math.floor(caja.x / celda), y0: Math.floor(caja.y / celda), x1: Math.floor((caja.x + caja.width) / celda), y1: Math.floor((caja.y + caja.height) / celda) });
  tramos.forEach(tramo => {
    const c = celdasDe(tramo);
    if ((c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1) > 64) { tramosGrandes.push(tramo); return; }
    for (let x = c.x0; x <= c.x1; x++) for (let y = c.y0; y <= c.y1; y++) {
      const clave = x + ':' + y;
      if (!rejilla.has(clave)) rejilla.set(clave, []);
      rejilla.get(clave).push(tramo);
    }
  });
  const cruzaTramo = caja => {
    if (tramosGrandes.some(tramo => cruza(caja, tramo))) return true;
    const c = celdasDe(caja), revisados = new Set();
    for (let x = c.x0; x <= c.x1; x++) for (let y = c.y0; y <= c.y1; y++) {
      for (const tramo of rejilla.get(x + ':' + y) || []) {
        if (revisados.has(tramo)) continue;
        revisados.add(tramo);
        if (cruza(caja, tramo)) return true;
      }
    }
    return false;
  };
  const limiteDerecho = Math.max(0, ...nodos.map(c => c.x + c.width), ...conexiones.map(c => c.caja.x + c.caja.width));
  conexiones.sort((a, b) => Number(b.grupo.classList.contains('conexion-johnson')) - Number(a.grupo.classList.contains('conexion-johnson'))).forEach(conexion => {
    const { texto, linea, largo, grupo } = conexion;
    const cajaTexto = texto.getBBox();
    const dx = cajaTexto.x - Number(texto.getAttribute('x'));
    const dy = cajaTexto.y - Number(texto.getAttribute('y'));
    const cajaEn = (x, y) => ampliar({ x: x + dx, y: y + dy, width: cajaTexto.width, height: cajaTexto.height }, 7);
    const libre = caja => !nodos.some(nodo => cruza(caja, nodo)) && !ocupadas.some(otra => cruza(caja, otra)) && !cruzaTramo(caja);
    let posicion = null;
    let exterior = false;
    for (const distancia of [24, 36, 52, 72, 100, 136]) {
      for (const fraccion of [.5, .38, .62, .25, .75]) {
        const punto = linea.getPointAtLength(largo * fraccion);
        const antes = linea.getPointAtLength(Math.max(0, largo * fraccion - 1));
        const despues = linea.getPointAtLength(Math.min(largo, largo * fraccion + 1));
        const longitud = Math.hypot(despues.x - antes.x, despues.y - antes.y) || 1;
        for (const lado of [-1, 1]) {
          const x = punto.x - (despues.y - antes.y) / longitud * distancia * lado;
          const y = punto.y + (despues.x - antes.x) / longitud * distancia * lado;
          if (libre(cajaEn(x, y))) { posicion = { x, y }; break; }
        }
        if (posicion) break;
      }
      if (posicion) break;
    }
    if (!posicion) {
      // Una zona exterior conserva legible el peso incluso en conexiones densas.
      exterior = true;
      posicion = { x: limiteDerecho + cajaTexto.width / 2 + 30, y: Number(texto.getAttribute('y')) };
      while (ocupadas.some(caja => cruza(cajaEn(posicion.x, posicion.y), caja))) posicion.y += cajaTexto.height + 20;
    }
    texto.setAttribute('x', posicion.x);
    texto.setAttribute('y', posicion.y);
    const caja = cajaEn(posicion.x, posicion.y);
    ocupadas.push(ampliar(caja, 3));
    const fondoAnterior = grupo.querySelector('.jn-peso-fondo');
    if (fondoAnterior) fondoAnterior.remove();
    const guiaAnterior = grupo.querySelector('.jn-peso-guia');
    if (guiaAnterior) guiaAnterior.remove();
    if (exterior) {
      const ancla = linea.getPointAtLength(largo / 2);
      grupo.insertBefore(crearSVG('path', { class: 'jn-peso-guia', d: 'M ' + ancla.x + ' ' + ancla.y + ' L ' + posicion.x + ' ' + posicion.y, 'pointer-events': 'none' }), texto);
    }
    grupo.insertBefore(crearSVG('rect', { class: 'jn-peso-fondo', x: caja.x + 2, y: caja.y + 2, width: caja.width - 4, height: caja.height - 4, rx: 5, 'pointer-events': 'none' }), texto);
  });
}

/**
 * Clases del resaltado de Johnson para una conexión. Se recalculan en cada
 * dibujado a partir de estado.visualizacionJohnson: así el resaltado sobrevive
 * al arrastre de un nodo y al cambio de tamaño de la pantalla.
 */
function clasesJohnsonConexion(conexion, visual) {
  if (!visual) return [];
  if (visual.vistaTemporal && visual.temporal) {
    if (!(visual.temporal.conexionesActivas || []).includes(conexion.id)) return ['conexion-johnson-inactiva', 'jn-temporal-excluida'];
    const critica = (visual.temporal.criticas || []).includes(conexion.id);
    return critica ? ['conexion-johnson', 'jn-temporal-activa', 'jn-temporal-critica'] : ['jn-temporal-activa'];
  }
  const conexiones = visual.conexiones || [];
  const rutas = rutasVisualesJohnson(visual).filter(ruta => (ruta.conexiones || []).includes(conexion.id));
  if (!conexiones.includes(conexion.id) && !rutas.length) return visual.valoresNodos || conexiones.length ? ['conexion-johnson-inactiva'] : [];
  if (visual.tipo === 'ciclo') return ['conexion-johnson', 'ciclo-negativo-johnson'];
  const clases = ['conexion-johnson'];
  const minimo = (visual.minimoConexiones || []).includes(conexion.id);
  const maximo = (visual.maximoConexiones || []).includes(conexion.id);
  if (minimo) clases.push('jn-camino-minimo');
  if (maximo) clases.push('jn-camino-maximo');
  if (minimo && maximo || rutas.length > 1) clases.push('jn-camino-compartido');
  const elegida = rutaSeleccionadaVisualJohnson(visual);
  if (elegida) clases.push((elegida.conexiones || []).includes(conexion.id) ? 'jn-ruta-seleccionada' : 'jn-ruta-contexto');
  return clases;
}

/** Clases del resaltado de Johnson para un nodo. */
function clasesJohnsonNodo(nodo, visual) {
  if (!visual) return [];
  if (visual.vistaTemporal && visual.temporal) {
    if (!(visual.temporal.idsActivos || []).includes(nodo.id)) return ['nodo-johnson-inactivo', 'jn-temporal-excluida'];
    const clases = ['jn-temporal-activa'];
    if ((visual.nodos || []).includes(nodo.id)) clases.push('nodo-johnson', 'jn-temporal-critica');
    if (nodo.id === visual.origen) clases.push('nodo-johnson-origen');
    if (nodo.id === visual.destino) clases.push('nodo-johnson-destino');
    return clases;
  }
  const nodos = visual.nodos || [];
  const rutas = rutasVisualesJohnson(visual).filter(ruta => (ruta.nodos || []).includes(nodo.id));
  const incluido = nodos.includes(nodo.id) || rutas.length > 0;
  if (visual.tipo === 'ciclo') return incluido ? ['nodo-johnson', 'ciclo-negativo-johnson'] : [];
  const origen = nodo.id === visual.origen;
  const destino = nodo.id === visual.destino;
  if (!incluido && !origen && !destino) return visual.valoresNodos || (visual.conexiones || []).length ? ['nodo-johnson-inactivo'] : [];
  const clases = ['nodo-johnson'];
  const minimo = (visual.nodosMinimos || []).includes(nodo.id);
  const maximo = (visual.nodosMaximos || []).includes(nodo.id);
  if (minimo) clases.push('jn-camino-minimo');
  if (maximo) clases.push('jn-camino-maximo');
  if (minimo && maximo || rutas.length > 1) clases.push('jn-camino-compartido');
  const elegida = rutaSeleccionadaVisualJohnson(visual);
  if (elegida) clases.push((elegida.nodos || []).includes(nodo.id) ? 'jn-ruta-seleccionada' : 'jn-ruta-contexto');
  if (nodo.id === visual.origen) clases.push('nodo-johnson-origen');
  // En la diagonal (A → A) origen y destino son el mismo nodo: se deja solo el
  // color de origen para no pintarlo de dos colores a la vez.
  else if (nodo.id === visual.destino) clases.push('nodo-johnson-destino');
  return clases;
}

function rutasVisualesJohnson(visual) {
  return visual && Array.isArray(visual.rutasMostradas) ? visual.rutasMostradas : [];
}

function rutaSeleccionadaVisualJohnson(visual) {
  if (!visual || !visual.rutaSeleccionada) return null;
  return typeof visual.rutaSeleccionada === 'object' ? visual.rutaSeleccionada
    : rutasVisualesJohnson(visual).find(ruta => ruta.id === visual.rutaSeleccionada) || null;
}

function colorRutaVisualJohnson(ruta) {
  const color = ruta && ruta.color || '';
  return /^#[\da-f]{6}$/i.test(color) || /^var\(--(?:ruta|jn-maximo|jn-alternativa-[123])\)$/.test(color) ? color : null;
}

/** Texto original, nunca el peso reponderado del procedimiento. */
function textoConexionJohnson(conexion, visual) {
  const temporal = visual && visual.vistaTemporal && visual.temporal;
  if (!temporal) return String(conexion.valor);
  const holgura = temporal.holguras && temporal.holguras[conexion.id];
  return String(conexion.valor) + (Number.isFinite(holgura) ? ' · H=' + holgura : ' · excluida');
}

function describirConexionJohnson(conexion, visual) {
  const desde = buscarNodo(conexion.desde), hacia = buscarNodo(conexion.hacia);
  let texto = 'Conexión de ' + (desde ? desde.nombre : '?') + ' a ' + (hacia ? hacia.nombre : '?') + '. Peso original: ' + conexion.valor + '.';
  if (visual && visual.vistaTemporal && visual.temporal) {
    const temporal = visual.temporal;
    const holgura = temporal.holguras && temporal.holguras[conexion.id];
    texto += Number.isFinite(holgura)
      ? ' Duración: ' + conexion.valor + '. Holgura: ' + holgura + ((temporal.criticas || []).includes(conexion.id) ? '. Actividad crítica.' : '. Actividad no crítica.')
      : ' No participa en ningún camino del origen al destino seleccionados.';
  } else {
    const rutas = rutasVisualesJohnson(visual).filter(ruta => (ruta.conexiones || []).includes(conexion.id));
    if (rutas.length) texto += ' Rutas: ' + rutas.map(ruta => ruta.id).join(', ') + '.';
    const elegida = rutaSeleccionadaVisualJohnson(visual);
    if (elegida && (elegida.conexiones || []).includes(conexion.id)) texto += ' Pertenece a la ruta destacada ' + elegida.id + '.';
  }
  return texto;
}

/** Marcador local al SVG: conserva el color también en miniaturas y exportación. */
function aplicarEstiloConexionRutaJohnson(grupo, conexion, visual, svg) {
  if (!visual || visual.vistaTemporal || visual.tipo === 'ciclo') return;
  const rutas = rutasVisualesJohnson(visual).filter(ruta => (ruta.conexiones || []).includes(conexion.id));
  const elegida = rutaSeleccionadaVisualJohnson(visual);
  const ruta = elegida && (elegida.conexiones || []).includes(conexion.id) ? elegida : rutas.length === 1 ? rutas[0] : null;
  const color = colorRutaVisualJohnson(ruta);
  if (!color) return;
  grupo.style.setProperty('--jn-color-camino', color);
  const linea = grupo.querySelector('.conexion-linea'), texto = grupo.querySelector('.conexion-valor');
  if (texto) texto.style.fill = color;
  if (!linea) return;
  linea.style.stroke = color;
  const contenedor = svg || grupo.ownerSVGElement;
  if (!contenedor) return;
  let defs = contenedor.querySelector('defs');
  if (!defs) { defs = crearSVG('defs', {}); contenedor.insertBefore(defs, contenedor.firstChild); }
  const id = (contenedor.id || 'johnson') + '-ruta-color-' + color.replace(/[^\da-z]/gi, '').toLowerCase();
  if (!Array.from(defs.children).some(marcador => marcador.id === id)) {
    const marcador = crearSVG('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
    marcador.appendChild(crearSVG('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color, style: 'fill:' + color }));
    defs.appendChild(marcador);
  }
  linea.style.markerEnd = 'url(#' + id + ')';
}

/**
 * Contenido de los dos compartimentos inferiores de un nodo en T.
 * Por defecto: mínimo | máximo desde el origen (o temprano | tardío en la red
 * temporal). `visual.casillas[id]` sustituye esa pareja para un nodo concreto
 * con sus propios valores, rótulos y descripciones (destino con ruta activa,
 * etapas del procedimiento). Un valor null se muestra como «—».
 */
function casillasNodoJohnson(nodo, visual) {
  const propia = visual && visual.casillas && visual.casillas[nodo.id];
  if (propia) {
    return {
      valores: [propia.valores && propia.valores[0], propia.valores && propia.valores[1]].map(v => v === undefined ? null : v),
      rotulos: propia.rotulos || ['—', '—'],
      etiquetas: propia.etiquetas || propia.rotulos || ['Izquierda', 'Derecha'],
      claves: propia.claves || ['izquierda', 'derecha']
    };
  }
  const valores = (visual && visual.valoresNodos && visual.valoresNodos[nodo.id]) || { minimo: null, maximo: null };
  const temporal = !!(visual && visual.vistaTemporal);
  return {
    valores: [valores.minimo === undefined ? null : valores.minimo, valores.maximo === undefined ? null : valores.maximo],
    rotulos: temporal ? ['temprano', 'tardío'] : ['mín', 'máx'],
    etiquetas: temporal ? ['Tiempo temprano', 'Tiempo tardío'] : ['Mínimo', 'Máximo'],
    claves: ['minimo', 'maximo']
  };
}

/** Mismos datos en editor, resultado, lectura accesible y exportación. */
function dibujarCompartimentosNodoJohnson(grupo, nodo, visual) {
  if (!visual || !visual.valoresNodos) return;
  const casillas = casillasNodoJohnson(nodo, visual);
  const temporal = !!visual.vistaTemporal;
  const excluido = temporal && visual.temporal && !(visual.temporal.idsActivos || []).includes(nodo.id);
  const radio = radioVisualNodoJohnson(visual);
  grupo.textContent = '';
  grupo.classList.add('jn-nodo-dividido');
  const titulo = crearSVG('title', {});
  titulo.textContent = String(nodo.nombre);
  grupo.appendChild(titulo);
  grupo.appendChild(crearSVG('circle', { class: 'jn-nodo-base', cx: nodo.x, cy: nodo.y, r: radio }));
  const anchoDivision = Math.sqrt(radio * radio - 64) - 2;
  grupo.appendChild(crearSVG('line', {
    class: 'jn-nodo-division', x1: nodo.x - anchoDivision, y1: nodo.y - 8,
    x2: nodo.x + anchoDivision, y2: nodo.y - 8, 'aria-hidden': 'true'
  }));
  grupo.appendChild(crearSVG('line', {
    class: 'jn-nodo-division', x1: nodo.x, y1: nodo.y - 8,
    x2: nodo.x, y2: nodo.y + radio - 2, 'aria-hidden': 'true'
  }));

  // Medir también cuando el grupo aún pertenece a un fragmento sin montar.
  const contextoTexto = document.createElement('canvas').getContext('2d');
  const familiaTexto = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const medirTexto = (contenido, tamano, peso) => {
    if (!contextoTexto) return Array.from(contenido).length * tamano * 0.65;
    contextoTexto.font = peso + ' ' + tamano + 'px ' + familiaTexto;
    return contextoTexto.measureText(contenido).width;
  };
  const nombreVisible = String(nodo.nombre);
  const anchoNombre = Math.sqrt(radio * radio - 34 * 34) * 2 - 18;
  let tamanoNombre = 16;
  while (tamanoNombre > 12 && medirTexto(nombreVisible, tamanoNombre, 800) > anchoNombre) tamanoNombre--;
  const nombre = crearSVG('text', {
    class: 'jn-nodo-nombre', x: nodo.x, y: nodo.y - 34,
    'text-anchor': 'middle', 'dominant-baseline': 'central',
    style: 'font-size:' + tamanoNombre + 'px'
  });
  nombre.textContent = nombreVisible;
  if (medirTexto(nombreVisible, tamanoNombre, 800) > anchoNombre) {
    nombre.setAttribute('textLength', anchoNombre);
    nombre.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }
  const nombreCompleto = crearSVG('title', {});
  nombreCompleto.textContent = String(nodo.nombre);
  nombre.appendChild(nombreCompleto);
  grupo.appendChild(nombre);

  const describir = valor => valor == null || Number.isNaN(valor) ? 'sin dato' : valor === Infinity ? 'sin camino (∞)' : valor === -Infinity ? 'sin camino (−∞)' : String(valor);
  const anchoNumero = 70;
  casillas.claves.forEach((clave, indice) => {
    // El destino conserva sus dos extremos. Solo la red temporal establece T|T,
    // y solo una ruta activa sustituye el destino por Acum. | Total.
    const valor = casillas.valores[indice];
    const etiqueta = casillas.etiquetas[indice];
    const x = nodo.x + (indice ? 41 : -41);
    const rotulo = String(casillas.rotulos[indice]);
    let tamanoRotulo = 12;
    while (tamanoRotulo > 9 && medirTexto(rotulo, tamanoRotulo, 700) > anchoNumero) tamanoRotulo--;
    const leyenda = crearSVG('text', {
      class: 'jn-nodo-leyenda', x: x, y: nodo.y + 9,
      'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'font-size:' + tamanoRotulo + 'px'
    });
    leyenda.textContent = rotulo;
    if (medirTexto(rotulo, tamanoRotulo, 700) > anchoNumero) {
      leyenda.setAttribute('textLength', anchoNumero);
      leyenda.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    grupo.appendChild(leyenda);
    const contenido = valor == null || Number.isNaN(valor) ? '—' : valor === Infinity ? '∞' : valor === -Infinity ? '−∞' : String(valor).replace(/-/g, '−');
    let tamanoNumero = 16;
    while (tamanoNumero > 12 && medirTexto(contenido, tamanoNumero, 800) > anchoNumero) tamanoNumero--;
    const numero = crearSVG('text', {
      class: 'jn-nodo-valor jn-nodo-valor-' + clave, x: x, y: nodo.y + 39,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      style: 'font-size:' + tamanoNumero + 'px'
    });
    numero.textContent = contenido;
    if (medirTexto(contenido, tamanoNumero, 800) > anchoNumero) {
      numero.setAttribute('textLength', anchoNumero);
      numero.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    const detalle = crearSVG('title', {});
    detalle.textContent = etiqueta + ': ' + describir(valor);
    numero.appendChild(detalle);
    grupo.appendChild(numero);
  });
  grupo.setAttribute('aria-label', 'Nodo ' + nodo.nombre +
    '. ' + casillas.etiquetas[0] + ' ' + describir(casillas.valores[0]) +
    '. ' + casillas.etiquetas[1] + ' ' + describir(casillas.valores[1]) +
    (excluido ? '. No participa en ningún camino del origen al destino seleccionados.' : ''));
}

/** La leyenda forma parte del SVG para conservarse al exportar el editor. */
function agregarLeyendaConsultaJohnson(capa, visual, capaAristas) {
  const anterior = capa.querySelector('.jn-leyenda-svg');
  if (anterior) anterior.remove();
  if (!visual || !visual.valoresNodos) return;
  const capas = capaAristas ? [capa, capaAristas] : capa === el.capaNodos ? [capa, el.capaConexiones] : [capa];
  const cajas = capas.map(elemento => {
    try { return elemento.getBBox(); } catch (_) { return null; }
  }).filter(caja => caja && Number.isFinite(caja.x) && Number.isFinite(caja.y) && (caja.width || caja.height));
  if (!cajas.length) return;
  const x = Math.min(...cajas.map(caja => caja.x));
  const y = Math.max(...cajas.map(caja => caja.y + caja.height)) + 24;
  const ancho = Math.max(104, Math.max(...cajas.map(caja => caja.x + caja.width)) - x);
  const maximoCaracteres = Math.max(14, Math.floor(ancho / 6.6));
  const lineas = [];
  const elegida = rutaSeleccionadaVisualJohnson(visual);
  const frases = (Array.isArray(visual.leyenda) ? visual.leyenda : visual.vistaTemporal ? [
    'Tiempos y holguras: análisis temporal complementario',
    'Arriba: nodo · Izquierda: tiempo temprano · Derecha: tiempo tardío',
    'Peso: duración original · H: holgura de la actividad',
    'Crítica: H=0 · Atenuado: no participa en la subred seleccionada',
    'Destino: T | T por la condición inicial del recorrido hacia atrás'
  ] : [
    'Arriba: nodo · Izquierda: mínimo · Derecha: máximo desde el origen',
    '∞: sin camino · —: no calculable · Pesos originales',
    'Mínimo: cian · Máximo: violeta · Compartido: discontinuo',
    'Origen: doble aro · Destino: aro discontinuo',
    ...(elegida ? [
      'Ruta activa: ' + (elegida.titulo || elegida.id) + ' · trazo reforzado · resto atenuado',
      'Destino: Acum. = suma de los pesos originales de esa ruta · Total = su costo'
    ] : visual.tipo === 'comparacion' ? ['Sin ruta única activa: el destino conserva mínimo | máximo']
      : ['Sin ruta activa: el destino conserva mínimo | máximo'])
  ]).map(texto => ({ texto, color: null }));
  if (!Array.isArray(visual.leyenda) && !visual.vistaTemporal) rutasVisualesJohnson(visual).forEach(ruta => {
    const nombres = (ruta.nodos || []).map(id => { const nodo = buscarNodo(id); return nodo ? nodo.nombre : id; });
    frases.push({ texto: (ruta.titulo || ruta.id) + ' [' + ruta.id + ']: ' + nombres.join(' → ') + ' · costo ' + ruta.distancia,
      color: colorRutaVisualJohnson(ruta) });
  });
  frases.forEach(frase => {
    let linea = '';
    frase.texto.split(' ').forEach(palabra => {
      if (linea && (linea + ' ' + palabra).length > maximoCaracteres) {
        lineas.push({ texto: linea, color: frase.color });
        linea = palabra;
      } else linea += (linea ? ' ' : '') + palabra;
    });
    if (linea) lineas.push({ texto: linea, color: frase.color });
  });
  const grupo = crearSVG('g', { class: 'jn-leyenda-svg', role: 'note', 'aria-label': frases.map(frase => frase.texto).join('. ') });
  lineas.forEach((linea, indice) => {
    const texto = crearSVG('text', {
      class: 'jn-leyenda-svg-texto', x: x, y: y + indice * 17,
      style: 'font-size:12px;text-anchor:start;fill:' + (linea.color || 'var(--texto)') + ';font-weight:500'
    });
    texto.textContent = linea.texto;
    grupo.appendChild(texto);
  });
  capa.appendChild(grupo);
}

/** Identifica el papel de cada vértice sin depender del color. */
function decorarNodoRutaJohnson(grupo, nodo, visual) {
  grupo.querySelectorAll('.jn-ruta-aro, .jn-ruta-rol').forEach(elemento => elemento.remove());
  delete grupo.dataset.rutaIndice;
  const descripcion = (grupo.getAttribute('aria-label') || 'Nodo ' + nodo.nombre)
    .replace(/\. (?:Origen \/ destino|Origen|Destino|Intermedio)$/, '');
  grupo.setAttribute('aria-label', descripcion);
  if (!visual || visual.tipo === 'ciclo') return;
  // El nodo toma el color de la ruta activa (también las alternativas) para que
  // sus casillas Acum. | Total coincidan con el trazo.
  const elegida = rutaSeleccionadaVisualJohnson(visual);
  const colorElegida = elegida && (elegida.nodos || []).includes(nodo.id) ? colorRutaVisualJohnson(elegida) : null;
  if (colorElegida) grupo.style.setProperty('--jn-color-camino', colorElegida);
  const indice = (visual.nodos || []).indexOf(nodo.id);

  const origen = nodo.id === visual.origen;
  const destino = nodo.id === visual.destino;
  if (indice < 0 && !origen && !destino) return;
  const radio = radioVisualNodoJohnson(visual);
  const rol = origen && destino ? 'Origen / destino' : origen ? 'Origen' : destino ? 'Destino' : 'Intermedio';
  grupo.dataset.rutaIndice = String(indice);

  // El segundo círculo identifica el origen; el aro discontinuo identifica el destino.
  if (origen) grupo.insertBefore(crearSVG('circle', {
    class: 'jn-ruta-aro jn-ruta-aro-origen', cx: nodo.x, cy: nodo.y, r: radio + 5,
    'aria-hidden': 'true'
  }), grupo.querySelector('text'));
  if (destino) grupo.insertBefore(crearSVG('circle', {
    class: 'jn-ruta-aro jn-ruta-aro-destino', cx: nodo.x, cy: nodo.y, r: radio + (origen ? 10 : 5),
    'stroke-dasharray': '4 4', 'aria-hidden': 'true'
  }), grupo.querySelector('text'));

  const etiqueta = crearSVG('text', {
    class: 'jn-ruta-rol', x: nodo.x, y: nodo.y + radio + (visual.valoresNodos ? 25 : 18),
    'text-anchor': 'middle', 'dominant-baseline': 'central'
  });
  etiqueta.textContent = rol;
  grupo.appendChild(etiqueta);

  grupo.setAttribute('aria-label', descripcion + '. ' + rol);
}

/**
 * Redibuja el grafo completo a partir del estado actual.
 * Limpia las capas SVG y vuelve a crear todos los nodos y conexiones.
 * Actualiza también la interfaz y la matriz si está visible.
 * Optimizado con DocumentFragment para mejor rendimiento.
 */
function dibujar() {
  dibujarLienzo();
  actualizarInterfaz();
  // La matriz, la resolución y el resultado se mantienen al día con el grafo.
  if (typeof refrescarVistaJohnson === 'function') refrescarVistaJohnson();
}

/** Solo el SVG del editor: nodos, conexiones y resaltado. */
function dibujarLienzo() {
  const activo = document.activeElement;
  const enfocado = activo && el.svg.contains(activo) && activo.closest('[data-id]');
  const foco = enfocado ? { tipo: enfocado.classList.contains('nodo') ? 'nodo' : 'conexion', id: enfocado.dataset.id } : null;
  el.capaConexiones.textContent = '';
  el.capaNodos.textContent = '';

  // Un resaltado calculado sobre otro grafo ya no significa nada: se descarta.
  if (estado.visualizacionJohnson && typeof firmaGrafoJohnson === 'function' &&
      estado.visualizacionJohnson.firma !== firmaGrafoJohnson()) {
    estado.visualizacionJohnson = null;
  }
  const visual = estado.visualizacionJohnson;
  const radio = radioVisualNodoJohnson(visual);

  // Usar DocumentFragment para mejor rendimiento al agregar múltiples elementos
  const conexionesFragment = document.createDocumentFragment();
  const nodosFragment = document.createDocumentFragment();

  estado.conexiones.forEach(conexion => {
    const geo = geometriaConexion(conexion, radio);
    if (!geo) return;

    const grupo = crearSVG('g', { 
      class: 'conexion',
      role: 'button',
      'aria-label': describirConexionJohnson(conexion, visual),
      tabindex: '0',
      'aria-pressed': String(!!(estado.seleccion && estado.seleccion.tipo === 'conexion' && estado.seleccion.id === conexion.id))
    });
    const titulo = crearSVG('title', {});
    titulo.textContent = describirConexionJohnson(conexion, visual);
    grupo.appendChild(titulo);
    grupo.dataset.id = conexion.id;
    if (estado.seleccion && estado.seleccion.tipo === 'conexion' && estado.seleccion.id === conexion.id) {
      grupo.classList.add('seleccionada');
      grupo.setAttribute('aria-pressed', 'true');
    }
    clasesJohnsonConexion(conexion, visual).forEach(clase => grupo.classList.add(clase));

    const linea = crearSVG('path', { class: 'conexion-linea', d: geo.d });
    if (grupo.classList.contains('jn-camino-compartido')) linea.style.markerEnd = 'url(#flechaCompartido)';
    else if (grupo.classList.contains('jn-camino-maximo')) linea.style.markerEnd = 'url(#flechaMaximo)';
    grupo.appendChild(linea);
    // Zona ancha invisible: facilita tocar la conexión en el móvil.
    grupo.appendChild(crearSVG('path', { class: 'conexion-zona', d: geo.d }));

    const texto = crearSVG('text', { class: 'conexion-valor', x: geo.etiquetaX, y: geo.etiquetaY });
    texto.textContent = textoConexionJohnson(conexion, visual);
    grupo.appendChild(texto);
    aplicarEstiloConexionRutaJohnson(grupo, conexion, visual, el.svg);

    conexionesFragment.appendChild(grupo);
  });

  estado.nodos.forEach(nodo => {
    const grupo = crearSVG('g', { 
      class: 'nodo',
      role: 'button',
      'aria-label': `Nodo ${nodo.nombre}. Coordenadas: ${Math.round(nodo.x)}, ${Math.round(nodo.y)}`,
      tabindex: '0',
      'aria-pressed': String(!!(estado.seleccion && estado.seleccion.tipo === 'nodo' && estado.seleccion.id === nodo.id))
    });
    grupo.dataset.id = nodo.id;
    if (estado.seleccion && estado.seleccion.tipo === 'nodo' && estado.seleccion.id === nodo.id) {
      grupo.classList.add('seleccionado');
      grupo.setAttribute('aria-pressed', 'true');
    }
    if (estado.origenConexion === nodo.id) grupo.classList.add('origen');
    if (arrastre && arrastre.id === nodo.id) grupo.classList.add('arrastrando');
    clasesJohnsonNodo(nodo, visual).forEach(clase => grupo.classList.add(clase));

    grupo.appendChild(crearSVG('circle', { cx: nodo.x, cy: nodo.y, r: radio }));
    dibujarNombreNodoJohnson(grupo, nodo, radio);

    dibujarCompartimentosNodoJohnson(grupo, nodo, visual);
    decorarNodoRutaJohnson(grupo, nodo, visual);

    nodosFragment.appendChild(grupo);
  });

  // Agregar todos los elementos de una vez para mejor rendimiento
  el.capaConexiones.appendChild(conexionesFragment);
  el.capaNodos.appendChild(nodosFragment);
  separarEtiquetasGrafoJohnson(el.capaConexiones, el.capaNodos, visual);
  agregarLeyendaConsultaJohnson(el.capaNodos, visual);
  if (typeof actualizarLimitesRutaJohnson === 'function') actualizarLimitesRutaJohnson();
  if (foco) enfocarElementoJohnson(foco.tipo, foco.id);
}

function enfocarElementoJohnson(tipo, id) {
  const capa = tipo === 'nodo' ? el.capaNodos : el.capaConexiones;
  const elemento = Array.from(capa.children).find(nodo => nodo.dataset.id === id);
  if (elemento) elemento.focus({ preventScroll: true });
}

let dibujoPendiente = false;

/**
 * Pide un redibujado para el siguiente cuadro de animación.
 * Optimiza el rendimiento: aunque el dedo genere muchos eventos por segundo,
 * solo se dibuja una vez por cuadro usando requestAnimationFrame.
 */
function dibujarPronto() {
  if (dibujoPendiente) return;
  dibujoPendiente = true;
  requestAnimationFrame(() => {
    dibujoPendiente = false;
    dibujar();
  });
}
