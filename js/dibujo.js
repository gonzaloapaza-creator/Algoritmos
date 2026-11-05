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

/**
 * Calcula la geometría (coordenadas y curvas) para dibujar una conexión.
 * Maneja conexiones directas, bucles (auto-conexiones) y conexiones bidireccionales.
 * @param {Object} conexion - La conexión a calcular
 * @returns {{d:string, etiquetaX:number, etiquetaY:number}|null}
 *          Objeto con el path SVG 'd' y coordenadas para la etiqueta del valor,
 *          o null si la conexión es inválida
 */
function radioVisualNodoJohnson(visual) {
  return visual && visual.valoresNodos ? 66 : RADIO_NODO;
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
  if (!visual || !visual.valoresNodos) return;
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
  const limiteDerecho = Math.max(0, ...nodos.map(c => c.x + c.width), ...conexiones.map(c => c.caja.x + c.caja.width));
  conexiones.sort((a, b) => Number(b.grupo.classList.contains('conexion-johnson')) - Number(a.grupo.classList.contains('conexion-johnson'))).forEach(conexion => {
    const { texto, linea, largo, grupo } = conexion;
    const cajaTexto = texto.getBBox();
    const dx = cajaTexto.x - Number(texto.getAttribute('x'));
    const dy = cajaTexto.y - Number(texto.getAttribute('y'));
    const cajaEn = (x, y) => ampliar({ x: x + dx, y: y + dy, width: cajaTexto.width, height: cajaTexto.height }, 7);
    const libre = caja => !nodos.some(nodo => cruza(caja, nodo)) && !ocupadas.some(otra => cruza(caja, otra)) && !tramos.some(tramo => cruza(caja, tramo));
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
  const conexiones = visual.conexiones || [];
  if (!conexiones.includes(conexion.id)) return conexiones.length ? ['conexion-johnson-inactiva'] : [];
  if (visual.tipo === 'ciclo') return ['conexion-johnson', 'ciclo-negativo-johnson'];
  const clases = ['conexion-johnson'];
  const minimo = (visual.minimoConexiones || []).includes(conexion.id);
  const maximo = (visual.maximoConexiones || []).includes(conexion.id);
  if (minimo) clases.push('jn-camino-minimo');
  if (maximo) clases.push('jn-camino-maximo');
  if (visual.tipo === 'comparacion' && minimo && maximo) clases.push('jn-camino-compartido');
  return clases;
}

/** Clases del resaltado de Johnson para un nodo. */
function clasesJohnsonNodo(nodo, visual) {
  if (!visual) return [];
  const nodos = visual.nodos || [];
  const incluido = nodos.includes(nodo.id);
  if (visual.tipo === 'ciclo') return incluido ? ['nodo-johnson', 'ciclo-negativo-johnson'] : [];
  const origen = nodo.id === visual.origen;
  const destino = nodo.id === visual.destino;
  if (!incluido && !origen && !destino) return (visual.conexiones || []).length ? ['nodo-johnson-inactivo'] : [];
  const clases = ['nodo-johnson'];
  const minimo = (visual.nodosMinimos || []).includes(nodo.id);
  const maximo = (visual.nodosMaximos || []).includes(nodo.id);
  if (minimo) clases.push('jn-camino-minimo');
  if (maximo) clases.push('jn-camino-maximo');
  if (visual.tipo === 'comparacion' && minimo && maximo) clases.push('jn-camino-compartido');
  if (nodo.id === visual.origen) clases.push('nodo-johnson-origen');
  // En la diagonal (A → A) origen y destino son el mismo nodo: se deja solo el
  // color de origen para no pintarlo de dos colores a la vez.
  else if (nodo.id === visual.destino) clases.push('nodo-johnson-destino');
  return clases;
}

/** Dibujo compartido entre el resultado y el editor: nombre, mínimo y máximo. */
function dibujarCompartimentosNodoJohnson(grupo, nodo, visual) {
  if (!visual || !visual.valoresNodos) return;
  const valores = visual.valoresNodos[nodo.id] || { minimo: null, maximo: null };
  const finalElegido = nodo.id === visual.destino && visual.objetivo !== 'comparar' && Number.isFinite(visual.distancia);
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
  const caracteres = Array.from(String(nodo.nombre));
  const tamanoNombre = caracteres.length > 10 ? 13 : 15;
  let nombreVisible = caracteres.join('');
  if (medirTexto(nombreVisible, tamanoNombre, 800) > 104) {
    while (caracteres.length > 1 && medirTexto(caracteres.join('') + '…', tamanoNombre, 800) > 104) caracteres.pop();
    nombreVisible = caracteres.join('') + '…';
  }
  const nombre = crearSVG('text', {
    class: 'jn-nodo-nombre', x: nodo.x, y: nodo.y - 29,
    'text-anchor': 'middle', 'dominant-baseline': 'central',
    style: 'font-size:' + tamanoNombre + 'px'
  });
  nombre.textContent = nombreVisible;
  const nombreCompleto = crearSVG('title', {});
  nombreCompleto.textContent = String(nodo.nombre);
  nombre.appendChild(nombreCompleto);
  grupo.appendChild(nombre);

  ['minimo', 'maximo'].forEach((clave, indice) => {
    const valor = finalElegido ? visual.distancia : valores[clave];
    const etiqueta = finalElegido ? 'Elegido' : indice ? 'Máximo' : 'Mínimo';
    const x = nodo.x + (indice ? 30 : -30);
    const leyenda = crearSVG('text', {
      class: 'jn-nodo-leyenda', x: x, y: nodo.y + 9,
      'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'font-size:12px'
    });
    leyenda.textContent = finalElegido ? 'Elegido' : indice ? 'máx' : 'mín';
    grupo.appendChild(leyenda);
    const contenido = valor == null || Number.isNaN(valor) ? '—' : !Number.isFinite(valor) ? '∞' : String(valor).replace(/-/g, '−');
    const tamanoNumero = contenido.length > 4 ? 13 : 14;
    const numero = crearSVG('text', {
      class: 'jn-nodo-valor jn-nodo-valor-' + (finalElegido ? visual.objetivo : clave), x: x, y: nodo.y + 35,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      style: 'font-size:' + tamanoNumero + 'px'
    });
    numero.textContent = contenido;
    if (medirTexto(contenido, tamanoNumero, 800) > 42) {
      numero.setAttribute('textLength', '42');
      numero.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    const detalle = crearSVG('title', {});
    detalle.textContent = etiqueta + ': ' + (valor == null || Number.isNaN(valor) ? 'no calculable' : Number.isFinite(valor) ? valor : 'sin camino');
    numero.appendChild(detalle);
    grupo.appendChild(numero);
  });
  const describir = valor => valor == null || Number.isNaN(valor) ? 'no calculable' : Number.isFinite(valor) ? String(valor) : 'sin camino';
  grupo.setAttribute('aria-label', finalElegido
    ? 'Nodo ' + nodo.nombre + '. Elegido ' + describir(visual.distancia) + ' en ambos compartimentos.'
    : 'Nodo ' + nodo.nombre + '. Mínimo ' + describir(valores.minimo) + '. Máximo ' + describir(valores.maximo));
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
  [
    'Arriba: nodo · Izquierda: mínimo · Derecha: máximo',
    '∞: sin camino · —: no calculable',
    'Mínimo: cian · Máximo: violeta · Compartido: discontinuo',
    ...(visual.objetivo !== 'comparar' && Number.isFinite(visual.distancia) ? ['Destino: valor elegido repetido en ambos espacios'] : [])
  ].forEach(frase => {
    let linea = '';
    frase.split(' ').forEach(palabra => {
      if (linea && (linea + ' ' + palabra).length > maximoCaracteres) {
        lineas.push(linea);
        linea = palabra;
      } else linea += (linea ? ' ' : '') + palabra;
    });
    if (linea) lineas.push(linea);
  });
  const grupo = crearSVG('g', { class: 'jn-leyenda-svg', role: 'note', 'aria-label': 'Leyenda de los valores y caminos de Johnson' });
  lineas.forEach((linea, indice) => {
    const texto = crearSVG('text', {
      class: 'jn-leyenda-svg-texto', x: x, y: y + indice * 17,
      style: 'font-size:12px;text-anchor:start;fill:var(--texto);font-weight:500'
    });
    texto.textContent = linea;
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

    const nodoOrigen = buscarNodo(conexion.desde);
    const nodoDestino = buscarNodo(conexion.hacia);
    const origenNombre = nodoOrigen ? nodoOrigen.nombre : '?';
    const destinoNombre = nodoDestino ? nodoDestino.nombre : '?';

    const grupo = crearSVG('g', { 
      class: 'conexion',
      role: 'button',
      'aria-label': `Conexión de ${origenNombre} a ${destinoNombre} con peso ${conexion.valor}`,
      tabindex: '0',
      'aria-pressed': String(!!(estado.seleccion && estado.seleccion.tipo === 'conexion' && estado.seleccion.id === conexion.id))
    });
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
    texto.textContent = conexion.valor;
    grupo.appendChild(texto);

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

    grupo.appendChild(crearSVG('circle', { cx: nodo.x, cy: nodo.y, r: RADIO_NODO }));

    const texto = crearSVG('text', { x: nodo.x, y: nodo.y });
    texto.textContent = nodo.nombre;
    grupo.appendChild(texto);

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
