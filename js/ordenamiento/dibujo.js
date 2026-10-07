// js/ordenamiento/dibujo.js
'use strict';

function dibujarPinos(arreglo, indicesComparando = [], indicesMoviendo = [], ordenados = []) {
  const pista = document.getElementById('pistaBowling');
  if (!arreglo || arreglo.length === 0) return;

  const maxValor = Math.max(...arreglo);

  // Si la pista está vacía (o cambió la cantidad), creamos los elementos base una sola vez
  if (pista.children.length !== arreglo.length) {
    pista.innerHTML = '';
    arreglo.forEach((_, indice) => {
      const pinoHTML = `
        <div class="pino-caja" id="pino-${indice}">
          <svg viewBox="0 0 40 100" class="pino-bowling" preserveAspectRatio="none">
            <path d="M12,25 C12,10 28,10 28,25 C28,35 22,40 25,60 C28,80 35,90 35,95 C35,100 5,100 5,95 C5,90 12,80 15,60 C18,40 12,35 12,25 Z" />
            <path class="pino-franja" d="M14,35 L26,35" />
            <path class="pino-franja" d="M15,42 L25,42" />
          </svg>
          <span class="pino-valor"></span>
        </div>
      `;
      pista.insertAdjacentHTML('beforeend', pinoHTML);
    });
  }

  // Ahora solo actualizamos las alturas, textos y clases de los elementos existentes
  // ¡Esto permite que el CSS anime los cambios suavemente!
  arreglo.forEach((valor, indice) => {
    const caja = document.getElementById(`pino-${indice}`);
    const svg = caja.querySelector('.pino-bowling');
    const span = caja.querySelector('.pino-valor');

    // Actualizamos altura y valor
    const altura = 70 + (valor / maxValor) * 150;
    svg.style.height = `${altura}px`;
    span.textContent = valor;

    // Reseteamos las clases y aplicamos el color correspondiente
    caja.className = 'pino-caja';
    if (ordenados.includes(indice)) {
      caja.classList.add('estado-ordenado');
    } else if (indicesMoviendo.includes(indice)) {
      caja.classList.add('estado-moviendo');
    } else if (indicesComparando.includes(indice)) {
      caja.classList.add('estado-comparando');
    }
  });
}