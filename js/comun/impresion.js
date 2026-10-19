/* Impresión del procedimiento completo.
 *
 * Las vistas «paso a paso» muestran un solo paso. Al imprimir (botón «Imprimir»
 * o Ctrl+P) se recorren todos los pasos con la función de dibujo del módulo, se
 * copia el panel de cada uno en #impresionPasos y al terminar se restaura el
 * paso que estaba en pantalla. css/impresion.css oculta la interfaz interactiva
 * y muestra solo esa copia. Mientras se imprime se fuerza el tema claro. */

'use strict';

let configuracionImpresion = null;

/**
 * @param {Object} c
 *   paneles()  → elementos cuyo contenido se copia por cada paso
 *   total()    → cantidad de pasos (0 = nada que volcar)
 *   actual()   → índice del paso en pantalla
 *   ir(i)      → dibuja el paso i de forma síncrona
 *   titulo     → encabezado del documento impreso
 *   activo()   → true si la vista de pasos es la que se está mostrando
 */
function registrarImpresionPasos(c) {
  configuracionImpresion = c;
}

/* Los ids (marcadores SVG, etiquetas) se renombran en cada copia para que las
 * referencias url(#id) de cada paso apunten a su propio marcador. */
function copiarPanelParaImpresion(panel, sufijo) {
  const copia = panel.cloneNode(true);
  copia.removeAttribute('id');
  copia.querySelectorAll('[id]').forEach(e => { e.id = e.id + '-' + sufijo; });
  copia.querySelectorAll('[style]').forEach(e => {
    e.setAttribute('style', e.getAttribute('style').replace(/url\(["']?#([^"')]+)["']?\)/g, 'url(#$1-' + sufijo + ')'));
  });
  copia.querySelectorAll('[marker-end], [marker-start]').forEach(e => {
    ['marker-end', 'marker-start'].forEach(a => {
      const v = e.getAttribute(a);
      if (v) e.setAttribute(a, v.replace(/#([^)]+)\)/, '#$1-' + sufijo + ')'));
    });
  });
  copia.querySelectorAll('button, input, select, .acciones').forEach(e => e.remove());
  return copia;
}

function prepararImpresion() {
  const c = configuracionImpresion;
  document.querySelectorAll('#impresionPasos').forEach(e => e.remove());
  if (!document.documentElement.dataset.temaAnterior) document.documentElement.dataset.temaAnterior = document.documentElement.dataset.tema || '';
  document.documentElement.dataset.tema = 'claro';
  if (!c || !c.activo() || c.total() === 0) return;

  const total = c.total();
  const actual = c.actual();
  const contenedor = document.createElement('section');
  contenedor.id = 'impresionPasos';
  contenedor.setAttribute('aria-hidden', 'true');
  const h = document.createElement('h2');
  h.textContent = c.titulo + ' · ' + total + ' pasos';
  contenedor.appendChild(h);

  for (let i = 0; i < total; i++) {
    c.ir(i);
    const bloque = document.createElement('article');
    bloque.className = 'impresion-paso';
    const titulo = document.createElement('h3');
    titulo.textContent = 'Paso ' + (i + 1) + ' de ' + total;
    bloque.appendChild(titulo);
    c.paneles().forEach((panel, j) => bloque.appendChild(copiarPanelParaImpresion(panel, 'imp' + i + '_' + j)));
    contenedor.appendChild(bloque);
  }
  c.ir(actual);
  document.body.appendChild(contenedor);
  document.body.classList.add('imprimiendo-pasos');
}

function terminarImpresion() {
  const anterior = document.documentElement.dataset.temaAnterior;
  if (anterior) document.documentElement.dataset.tema = anterior;
  else if (anterior === '') delete document.documentElement.dataset.tema;
  delete document.documentElement.dataset.temaAnterior;
  document.querySelectorAll('#impresionPasos').forEach(e => e.remove());
  document.body.classList.remove('imprimiendo-pasos');
}

function imprimirProcedimiento() {
  window.print();
}

window.addEventListener('beforeprint', prepararImpresion);
window.addEventListener('afterprint', terminarImpresion);
