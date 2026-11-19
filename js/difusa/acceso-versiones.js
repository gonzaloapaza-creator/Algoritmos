/* El selector reutiliza el diálogo y el contrato de foco del proyecto. */
'use strict';
(() => {
  const boton = document.getElementById('btnAyuda');
  if (!boton || document.body.dataset.difusaPagina !== 'opciones') return;
  boton.addEventListener('click', () => {
    const chat = document.getElementById('algoPanel');
    if (chat && !chat.hidden) document.getElementById('algoCerrar').click();
    boton.focus({ preventScroll: true });
    dialogoInformar({
    titulo: 'Ayuda · Elegir versión de Lógica difusa',
    mensaje: 'USAR EN ESTA PÁGINA\nEl simulador funciona directamente en el navegador: permite configurar variables, conjuntos, reglas y consultar resultados. Conserva tus trabajos web.\n\nUSAR MATLAB ONLINE\nOfrece el ejemplo de ventilación y una guía para crear tu propio FIS en MATLAB. Requiere Internet y una cuenta con acceso a MATLAB y Fuzzy Logic Toolbox. Los archivos se suben manualmente; los resultados se consultan en MATLAB.\n\nCÓMO CONTINUAR Y REGRESAR\n«Abrir simulador web» entra al simulador. «Continuar con MATLAB» abre sus instrucciones, descargas y ayuda. Usa «Elegir versión» para regresar directamente aquí. «Video» vuelve a mostrar la introducción original.'
    });
  });
})();
