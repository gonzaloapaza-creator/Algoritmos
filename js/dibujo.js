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
function geometriaConexion(conexion) {
  const a = buscarNodo(conexion.desde);
  const b = buscarNodo(conexion.hacia);
  if (!a || !b) return null;

  if (a.id === b.id) {
    const r = RADIO_NODO;
    // El bucle se dibuja arriba; si no cabe, se dibuja abajo para que no quede fuera de la vista.
    const cabeArriba = a.y > r * 3.4;
    const cabeAbajo = a.y + r * 3.4 < area().alto;
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
    const x1 = a.x + ux * RADIO_NODO;
    const y1 = a.y + uy * RADIO_NODO;
    const x2 = b.x - ux * (RADIO_NODO + SEPARACION_ARROW);
    const y2 = b.y - uy * (RADIO_NODO + SEPARACION_ARROW);
    return {
      d: 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2,
      etiquetaX: (x1 + x2) / 2 + (-uy) * 12,
      etiquetaY: (y1 + y2) / 2 + (ux) * 12
    };
  }

  // La perpendicular se calcula con la dirección propia de cada conexión,
  // por eso a->b y b->a se desvían automáticamente a lados opuestos.
  // El punto de control se mantiene dentro del área para que la curva y su valor no se salgan.
  const zona = area();
  const cx = (a.x + b.x) / 2 + (-uy) * CURVATURA;
  const cy = (a.y + b.y) / 2 + (ux) * CURVATURA;
  const inicio = puntoEnBorde(a, cx, cy, RADIO_NODO);
  const fin = puntoEnBorde(b, cx, cy, RADIO_NODO + SEPARACION_ARROW);

  return {
    d: 'M ' + inicio.x + ' ' + inicio.y + ' Q ' + cx + ' ' + cy + ' ' + fin.x + ' ' + fin.y,
    // Punto medio de una curva cuadrática: 0.25*A + 0.5*C + 0.25*B
    etiquetaX: 0.25 * inicio.x + 0.5 * cx + 0.25 * fin.x,
    etiquetaY: 0.25 * inicio.y + 0.5 * cy + 0.25 * fin.y
  };
}

/**
 * Clases del resaltado de Johnson para una conexión. Se recalculan en cada
 * dibujado a partir de estado.visualizacionJohnson: así el resaltado sobrevive
 * al arrastre de un nodo y al cambio de tamaño de la pantalla.
 */
function clasesJohnsonConexion(conexion, visual) {
  if (!visual) return [];
  if (!visual.conexiones.includes(conexion.id)) return ['conexion-johnson-inactiva'];
  return visual.tipo === 'ciclo'
    ? ['conexion-johnson', 'ciclo-negativo-johnson']
    : ['conexion-johnson'];
}

/** Clases del resaltado de Johnson para un nodo. */
function clasesJohnsonNodo(nodo, visual) {
  if (!visual || !visual.nodos.includes(nodo.id)) return [];

  if (visual.tipo === 'ciclo') return ['nodo-johnson', 'ciclo-negativo-johnson'];

  const clases = ['nodo-johnson'];
  if (nodo.id === visual.origen) clases.push('nodo-johnson-origen');
  // En la diagonal (A → A) origen y destino son el mismo nodo: se deja solo el
  // color de origen para no pintarlo de dos colores a la vez.
  else if (nodo.id === visual.destino) clases.push('nodo-johnson-destino');
  return clases;
}

/**
 * Redibuja el grafo completo a partir del estado actual.
 * Limpia las capas SVG y vuelve a crear todos los nodos y conexiones.
 * Actualiza también la interfaz y la matriz si está visible.
 * Optimizado con DocumentFragment para mejor rendimiento.
 */
function dibujar() {
  const foco = document.activeElement;
  const focoId = el.svg.contains(foco) ? foco.dataset?.id : null;
  el.capaConexiones.textContent = '';
  el.capaNodos.textContent = '';

  const visual = estado.visualizacionJohnson;

  // Usar DocumentFragment para mejor rendimiento al agregar múltiples elementos
  const conexionesFragment = document.createDocumentFragment();
  const nodosFragment = document.createDocumentFragment();

  estado.conexiones.forEach(conexion => {
    const geo = geometriaConexion(conexion);
    if (!geo) return;

    const nodoOrigen = buscarNodo(conexion.desde);
    const nodoDestino = buscarNodo(conexion.hacia);
    const origenNombre = nodoOrigen ? nodoOrigen.nombre : '?';
    const destinoNombre = nodoDestino ? nodoDestino.nombre : '?';

    const grupo = crearSVG('g', { 
      class: 'conexion',
      role: 'button',
      'aria-label': `Conexión de ${origenNombre} a ${destinoNombre} con peso ${conexion.valor}`,
      tabindex: '0'
    });
    grupo.dataset.id = conexion.id;
    if (estado.seleccion && estado.seleccion.tipo === 'conexion' && estado.seleccion.id === conexion.id) {
      grupo.classList.add('seleccionada');
      grupo.setAttribute('aria-pressed', 'true');
    }
    clasesJohnsonConexion(conexion, visual).forEach(clase => grupo.classList.add(clase));

    grupo.appendChild(crearSVG('path', { class: 'conexion-linea', d: geo.d }));
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
      tabindex: '0'
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

    nodosFragment.appendChild(grupo);
  });

  // Agregar todos los elementos de una vez para mejor rendimiento
  el.capaConexiones.appendChild(conexionesFragment);
  el.capaNodos.appendChild(nodosFragment);

  actualizarInterfaz();
  // Si la matriz está abierta, se mantiene al día con el grafo.
  actualizarMatriz();
  if (focoId) {
    const nuevo = Array.from(el.svg.querySelectorAll('[data-id]')).find(e => e.dataset.id === focoId);
    (nuevo || el.svg).focus({ preventScroll:true });
  }
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
