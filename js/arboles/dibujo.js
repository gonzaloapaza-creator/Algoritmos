'use strict';

const SVG_ARBOL_NS = 'http://www.w3.org/2000/svg';
let dimensionesDibujoArbol = { ancho: 600, alto: 220 };
let zoomDibujoArbol = 1;

function elementoSvgArbol(nombre, atributos, texto) {
  const elemento = document.createElementNS(SVG_ARBOL_NS, nombre);
  Object.entries(atributos || {}).forEach(([clave, valor]) => elemento.setAttribute(clave, String(valor)));
  if (texto != null) elemento.textContent = texto;
  return elemento;
}

function dibujarArbol(raiz, opciones) {
  const contenedor = document.getElementById('vistaArbol');
  if (!contenedor) return;
  const opcionesDibujo = opciones || {};
  const anchoVisible = Math.max(320, contenedor.clientWidth || 640);
  if (!raiz) {
    dimensionesDibujoArbol = { ancho: anchoVisible, alto: 220 };
    contenedor.replaceChildren();
    contenedor.appendChild(elementoSvgArbol('svg', {
      viewBox: `0 0 ${anchoVisible} 220`,
      role: 'img',
      'aria-label': 'Árbol vacío'
    }));
    const texto = document.createElement('p');
    texto.className = 'arbol-vacio';
    texto.textContent = 'El árbol está vacío. Agrega un valor o reconstruye uno desde sus recorridos.';
    contenedor.appendChild(texto);
    return;
  }

  const orden = [];
  let profundidadMaxima = 0;
  const nodos = [];
  function medir(nodo, profundidad, padre) {
    if (!nodo) return;
    profundidadMaxima = Math.max(profundidadMaxima, profundidad);
    medir(nodo.izquierdo, profundidad + 1, nodo);
    const x = 56 + orden.length * 86;
    orden.push(nodo.valor);
    nodos.push({ nodo, profundidad, padre, x, y: 48 + profundidad * 86 });
    medir(nodo.derecho, profundidad + 1, nodo);
  }
  medir(raiz, 0, null);
  const ancho = Math.max(anchoVisible, orden.length * 86 + 28);
  const alto = Math.max(210, (profundidadMaxima + 1) * 86 + 42);
  dimensionesDibujoArbol = { ancho, alto };
  const posiciones = new Map(nodos.map(item => [item.nodo.valor, item]));
  const svg = elementoSvgArbol('svg', {
    viewBox: `0 0 ${ancho} ${alto}`,
    width: ancho,
    height: alto,
    role: 'group',
    'aria-label': 'Árbol binario interactivo'
  });
  const aristas = elementoSvgArbol('g', { class: 'arbol-aristas', 'aria-hidden': 'true' });
  nodos.forEach(item => {
    ['izquierdo', 'derecho'].forEach(lado => {
      const hijo = item.nodo[lado];
      if (!hijo) return;
      const destino = posiciones.get(hijo.valor);
      aristas.appendChild(elementoSvgArbol('line', {
        x1: item.x, y1: item.y + 22, x2: destino.x, y2: destino.y - 22,
        class: opcionesDibujo.camino && opcionesDibujo.camino.includes(item.nodo.valor) && opcionesDibujo.camino.includes(hijo.valor) ? 'arbol-rama arbol-rama--activa' : 'arbol-rama'
      }));
    });
  });
  svg.appendChild(aristas);

  const grupoNodos = elementoSvgArbol('g', { class: 'arbol-nodos' });
  nodos.forEach(item => {
    const valor = item.nodo.valor;
    const clases = ['arbol-nodo'];
    if (!item.padre) clases.push('arbol-nodo--raiz');
    if (!item.nodo.izquierdo && !item.nodo.derecho) clases.push('arbol-nodo--hoja');
    if (opcionesDibujo.visitados && opcionesDibujo.visitados.includes(valor)) clases.push('arbol-nodo--visitado');
    if (opcionesDibujo.actual === valor) clases.push('arbol-nodo--actual');
    if (opcionesDibujo.nuevo === valor) clases.push('arbol-nodo--nuevo');
    if (opcionesDibujo.camino && opcionesDibujo.camino.includes(valor)) clases.push('arbol-nodo--camino');
    if (opcionesDibujo.seleccion === valor) clases.push('arbol-nodo--seleccionado');
    const grupo = elementoSvgArbol('g', {
      class: clases.join(' '),
      transform: `translate(${item.x} ${item.y})`,
      tabindex: '0',
      role: 'button',
      'data-valor': valor,
      'aria-label': `Nodo ${valor}${!item.padre ? ', raíz' : ''}${!item.nodo.izquierdo && !item.nodo.derecho ? ', hoja' : ''}`
    });
    const titulo = elementoSvgArbol('title', {}, `Valor ${valor}${!item.padre ? ' · raíz' : ''}${!item.nodo.izquierdo && !item.nodo.derecho ? ' · hoja' : ''}`);
    grupo.appendChild(titulo);
    grupo.appendChild(elementoSvgArbol('circle', { r: 22, class: 'arbol-nodo__circulo' }));
    grupo.appendChild(elementoSvgArbol('text', { class: 'arbol-nodo__valor', 'text-anchor': 'middle', dy: '.35em' }, valor));
    if (!item.padre) grupo.appendChild(elementoSvgArbol('text', { class: 'arbol-nodo__etiqueta', 'text-anchor': 'middle', y: 37 }, 'raíz'));
    else if (!item.nodo.izquierdo && !item.nodo.derecho) grupo.appendChild(elementoSvgArbol('text', { class: 'arbol-nodo__etiqueta', 'text-anchor': 'middle', y: 37 }, 'hoja'));
    grupoNodos.appendChild(grupo);
  });
  svg.appendChild(grupoNodos);
  svg.style.width = `${ancho * zoomDibujoArbol}px`;
  svg.style.height = `${alto * zoomDibujoArbol}px`;
  contenedor.replaceChildren(svg);
}

function cambiarZoomArbol(factor) {
  zoomDibujoArbol = Math.max(0.1, Math.min(2.5, zoomDibujoArbol * factor));
  const svg = document.querySelector('#vistaArbol svg');
  if (svg) {
    svg.style.width = `${dimensionesDibujoArbol.ancho * zoomDibujoArbol}px`;
    svg.style.height = `${dimensionesDibujoArbol.alto * zoomDibujoArbol}px`;
  }
}

function ajustarZoomArbol() {
  const contenedor = document.getElementById('vistaArbol');
  if (!contenedor) return;
  zoomDibujoArbol = Math.min(1, (contenedor.clientWidth || 640) / dimensionesDibujoArbol.ancho);
  cambiarZoomArbol(1);
  centrarArbol();
}

function centrarArbol() {
  const contenedor = document.getElementById('vistaArbol');
  if (contenedor) contenedor.scrollLeft = Math.max(0, (contenedor.scrollWidth - contenedor.clientWidth) / 2);
}
