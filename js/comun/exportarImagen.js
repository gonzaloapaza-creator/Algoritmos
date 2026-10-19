/* Exportación de un <svg> a PNG, común a Johnson, Asignación y Árboles.
 *
 * Se clona el SVG y a cada elemento se le copian los estilos calculados que
 * importan para dibujar (relleno, trazo, tipografía…). Así la imagen sale igual
 * que en pantalla con cualquier hoja de estilos y cualquier tema, sin mantener
 * una copia de las reglas CSS a mano. */

'use strict';

const PROPIEDADES_SVG_EXPORTABLES = [
  'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
  'stroke-linejoin', 'stroke-opacity', 'opacity', 'font-family', 'font-size', 'font-weight',
  'font-style', 'letter-spacing', 'text-anchor', 'dominant-baseline', 'paint-order',
  'visibility', 'display', 'filter', 'marker-start', 'marker-mid', 'marker-end'
];

/* Los marcadores calculados llegan como url("http://…/pagina.html#id"): el SVG
 * exportado viaja solo, así que se dejan relativos al propio documento. */
function normalizarUrlSvg(valor) {
  return valor.replace(/url\(["']?[^"')#]*#([^"')]+)["']?\)/g, 'url(#$1)');
}

function copiarEstilosCalculadosSvg(original, copia) {
  const fuentes = [original].concat(Array.from(original.querySelectorAll('*')));
  const destinos = [copia].concat(Array.from(copia.querySelectorAll('*')));
  fuentes.forEach((elemento, i) => {
    const destino = destinos[i];
    if (!destino) return;
    const calculado = window.getComputedStyle(elemento);
    if (calculado.display === 'none') { destino.remove(); return; }
    const declaraciones = PROPIEDADES_SVG_EXPORTABLES
      .map(prop => {
        const valor = calculado.getPropertyValue(prop);
        return valor ? prop + ':' + normalizarUrlSvg(valor) : '';
      })
      .filter(Boolean)
      .join(';');
    destino.setAttribute('style', declaraciones);
  });
}

function colorFondoDocumento() {
  const cuerpo = window.getComputedStyle(document.body).backgroundColor;
  const variable = window.getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  return variable || (cuerpo && cuerpo !== 'rgba(0, 0, 0, 0)' ? cuerpo : '#ffffff');
}

/**
 * Descarga el SVG indicado como PNG a doble resolución.
 * @param {SVGSVGElement} svg
 * @param {{ nombre?: string, fondo?: string, escala?: number }} [opciones]
 * @returns {Promise<void>} se rechaza si el navegador no pudo rasterizar el SVG.
 */
function exportarSvgComoPng(svg, opciones) {
  const o = opciones || {};
  return new Promise((resolver, rechazar) => {
    if (!svg) { rechazar(new Error('No hay ningún dibujo que exportar.')); return; }
    const caja = svg.getBoundingClientRect();
    const ancho = Math.max(1, Math.round(caja.width));
    const alto = Math.max(1, Math.round(caja.height));

    const copia = svg.cloneNode(true);
    copiarEstilosCalculadosSvg(svg, copia);
    copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copia.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    copia.setAttribute('width', String(ancho));
    copia.setAttribute('height', String(alto));
    if (!copia.getAttribute('viewBox')) copia.setAttribute('viewBox', '0 0 ' + ancho + ' ' + alto);
    copia.removeAttribute('style');

    const datos = new XMLSerializer().serializeToString(copia);
    const url = URL.createObjectURL(new Blob([datos], { type: 'image/svg+xml;charset=utf-8' }));
    const escala = o.escala || 2;
    const canvas = document.createElement('canvas');
    canvas.width = ancho * escala;
    canvas.height = alto * escala;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.fillStyle = o.fondo || colorFondoDocumento();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) { rechazar(new Error('No se pudo generar la imagen.')); return; }
        const enlace = document.createElement('a');
        const destino = URL.createObjectURL(blob);
        enlace.href = destino;
        enlace.download = (o.nombre || 'imagen') + '_' + new Date().toISOString().slice(0, 10) + '.png';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(destino);
        resolver();
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error('No se pudo generar la imagen.'));
    };
    img.src = url;
  });
}
