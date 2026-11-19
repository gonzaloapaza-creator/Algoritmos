/* Ayuda y copias de MATLAB: sin leer ni modificar modelos o trabajos. */
'use strict';
(() => {
  document.querySelectorAll('button[data-copiar]').forEach(boton => {
    const contenido = document.getElementById(boton.dataset.copiar);
    const estado = document.getElementById(boton.dataset.estado);
    if (!contenido || !estado) return;
    boton.hidden = false;
    boton.addEventListener('click', async () => {
      if (boton.disabled) return;
      boton.disabled = true;
      estado.textContent = '';
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Portapapeles no disponible');
        await navigator.clipboard.writeText(contenido.textContent.trim());
        estado.textContent = boton.dataset.tipo === 'entradas'
          ? 'Entradas copiadas. Pégalas en Input values de Rule Inference.'
          : 'Comando copiado. Pégalo en Command Window de MATLAB y pulsa Enter.';
      } catch (_) {
        contenido.focus({ preventScroll: true });
        const seleccion = window.getSelection();
        if (seleccion) {
          const rango = document.createRange();
          rango.selectNodeContents(contenido);
          seleccion.removeAllRanges();
          seleccion.addRange(rango);
        }
        estado.textContent = 'Selecciona y copia el texto manualmente (Ctrl+C, ⌘C o el menú de tu dispositivo).';
      } finally {
        boton.disabled = false;
      }
    });
  });

  const accesosAyuda = document.querySelectorAll('[data-abrir-ayuda-matlab]');
  const ayuda = document.getElementById('ayudaMatlab');
  if (!accesosAyuda.length || !ayuda || typeof ayuda.showModal !== 'function') return;
  let retornoAyuda = null;
  accesosAyuda.forEach(abrir => {
    abrir.hidden = false;
    abrir.addEventListener('click', () => {
      if (ayuda.open) return;
      const chat = document.getElementById('algoPanel');
      if (chat && !chat.hidden) document.getElementById('algoCerrar').click();
      retornoAyuda = abrir;
      abrir.focus({ preventScroll: true });
      ayuda.showModal();
      document.body.classList.add('ayuda-matlab-abierta');
    });
  });
  ayuda.addEventListener('close', () => {
    document.body.classList.remove('ayuda-matlab-abierta');
    if (retornoAyuda) retornoAyuda.focus({ preventScroll: true });
  });
})();
