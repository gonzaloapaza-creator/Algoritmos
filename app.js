/* Punto de entrada: conecta los botones y arranca la aplicación. 
Se carga después de los archivos de la carpeta js/. */

'use strict';

el.botonesHerramienta.forEach(boton => {
  boton.addEventListener('click', () => elegirHerramienta(boton.dataset.herramienta));
});
el.btnEditar.addEventListener('click', editarSeleccion);
el.btnEliminar.addEventListener('click', eliminarSeleccion);
el.btnCerrarPanel.addEventListener('click', () => { estado.seleccion = null; dibujar(); });
el.btnLimpiar.addEventListener('click', () => { cerrarMenuExtra(); limpiarTodo(); });
el.btnAyuda.addEventListener('click', mostrarAyuda);
// Las hojas flotantes se excluyen entre sí: dos abiertas a la vez se taparían.
el.btnMatriz.addEventListener('click', () => { cerrarMenuExtra(); cerrarResultadoJohnson(); alternarMatriz(); });
el.btnCerrarMatriz.addEventListener('click', cerrarMatriz);
el.matrizFondo.addEventListener('click', evento => {
  if (evento.target === el.matrizFondo) cerrarMatriz();
});

el.btnJohnson.addEventListener('click', alternarJohnson);
el.btnCerrarJohnson.addEventListener('click', cerrarResultadoJohnson);
el.johnsonFondo.addEventListener('click', evento => {
  if (evento.target === el.johnsonFondo) cerrarResultadoJohnson();
});

// «Guardar» guarda directamente; «Biblioteca» abre la lista de grafos guardados.
el.btnGuardar.addEventListener('click', () => {
  cerrarMenuExtra();
  cerrarResultadoJohnson();
  cerrarMatriz();
  guardarGrafoActual();
});
el.btnBiblioteca.addEventListener('click', () => { cerrarMenuExtra(); cerrarResultadoJohnson(); alternarBiblioteca(); });
el.btnGuardarActual.addEventListener('click', guardarGrafoActual);
el.btnCerrarBiblioteca.addEventListener('click', cerrarBiblioteca);

// Botones de exportar/importar
const btnExportarJSON = document.getElementById('btnExportarJSON');
const btnExportarImagen = document.getElementById('btnExportarImagen');
const btnImportarJSON = document.getElementById('btnImportarJSON');

if (btnExportarJSON) {
  btnExportarJSON.addEventListener('click', () => { cerrarMenuExtra(); exportarGrafoJSON(); });
}
if (btnExportarImagen) {
  btnExportarImagen.addEventListener('click', () => { cerrarMenuExtra(); exportarGrafoImagen(); });
}
if (btnImportarJSON) {
  btnImportarJSON.addEventListener('click', () => { cerrarMenuExtra(); importarGrafoJSON(); });
}

// Botones de zoom
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomReset = document.getElementById('btnZoomReset');

if (btnZoomIn) {
  btnZoomIn.addEventListener('click', zoomIn);
}
if (btnZoomOut) {
  btnZoomOut.addEventListener('click', zoomOut);
}
if (btnZoomReset) {
  btnZoomReset.addEventListener('click', zoomReset);
}

// Botón de Dijkstra
const btnDijkstra = document.getElementById('btnDijkstra');
if (btnDijkstra) {
  btnDijkstra.addEventListener('click', () => { 
    cerrarMenuExtra(); 
    if (estado.seleccion && estado.seleccion.tipo === 'nodo') {
      ejecutarDijkstra(estado.seleccion.id);
    } else {
      avisar('Selecciona un nodo para ejecutar Dijkstra desde ese origen.', 'error');
    }
  });
}
el.bibliotecaFondo.addEventListener('click', evento => {
  if (evento.target === el.bibliotecaFondo) cerrarBiblioteca();
});

el.btnEmpezar.addEventListener('click', () => {
  // Elegir la herramienta cambia el mensaje de ayuda y con él la altura del lienzo,
  // por eso el área se mide después: así el nodo queda realmente centrado.
  elegirHerramienta('nodo');
  const a = medirArea();
  crearNodo((a.ancho / 2 - estado.zoom.offsetX) / estado.zoom.escala, (a.alto / 2 - estado.zoom.offsetY) / estado.zoom.escala);
});

/*   MENÚ "Más opciones" (solo visible en celular)
   Guarda Matriz, Guardar y Limpiar para que la barra ocupe menos alto.
   No toca el grafo ni la herramienta activa y su estado no se guarda en ningún sitio. */
const btnMasOpciones = document.getElementById('btnMasOpciones');
const menuExtra = document.getElementById('menuExtra');
const menuFlecha = document.getElementById('menuFlecha');

function menuExtraAbierto() {
  return menuExtra.classList.contains('abierto');
}

/** Abre o cierra el desplegable de acciones. */
function fijarMenuExtra(abrir) {
  if (abrir === menuExtraAbierto()) return;

  menuExtra.classList.toggle('abierto', abrir);
  btnMasOpciones.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  menuFlecha.textContent = abrir ? '▲' : '▼';
}

function cerrarMenuExtra() {
  fijarMenuExtra(false);
}

btnMasOpciones.addEventListener('click', () => fijarMenuExtra(!menuExtraAbierto()));

/** true si el toque ocurrió dentro del menú o en el botón que lo abre. */
function dentroDelMenuExtra(destino) {
  return !!(destino && destino.closest && destino.closest('#menuExtra, #btnMasOpciones'));
}

// Un toque fuera cierra el menú; dentro de él no, hasta que se elija una acción.
// Se escucha en captura y se detiene la propagación para que ese primer toque solo
// cierre: si además creara un nodo, quedaría colocado con la medida antigua del lienzo.
document.addEventListener('pointerdown', evento => {
  if (!menuExtraAbierto() || dentroDelMenuExtra(evento.target)) return;
  evento.stopPropagation();
  cerrarMenuExtra();
}, true);

// Respaldo para el teclado: Enter o Espacio generan clic sin pointerdown.
document.addEventListener('click', evento => {
  if (!menuExtraAbierto() || dentroDelMenuExtra(evento.target)) return;
  cerrarMenuExtra();
});

// Escape cierra el menú, salvo si hay una ventana abierta: esa tiene prioridad.
document.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && menuExtraAbierto() && !modalAbierto()) cerrarMenuExtra();
});

/** Vuelve a medir el área y mete los nodos dentro de ella. */
function adaptarAlArea() {
  // Con una ventana abierta, el teclado del móvil reduce la pantalla:
  // si se recolocaran los nodos ahora, quedarían amontonados al cerrarlo.
  if (modalAbierto()) return;

  medirArea();
  if (ajustarNodosAlArea()) guardar();
  dibujarPronto();
}

// ResizeObserver detecta cualquier cambio de tamaño del lienzo, no solo el de la ventana:
// también al girar el teléfono o cuando la barra de ayuda pasa a ocupar dos líneas.
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(adaptarAlArea).observe(el.lienzo);
} else {
  window.addEventListener('resize', adaptarAlArea);
}
window.addEventListener('orientationchange', adaptarAlArea);

cargar();
medirArea();
if (ajustarNodosAlArea()) guardar();   // el grafo pudo guardarse en una pantalla más grande
elegirHerramienta('seleccionar');
if (estado.nodos.length === 0) {
  // Mensaje corto: la explicación completa está en el botón Ayuda.
  ayudar('Selecciona <strong>Nodo</strong> y toca el área para comenzar.');
}
dibujar();

// Atajos de teclado adicionales
document.addEventListener('keydown', evento => {
  // Ignorar si estamos en un input o textarea
  if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') return;
  
  // Ignorar si hay un modal abierto
  if (modalAbierto()) return;
  if (matrizVisible() || johnsonVisible() || bibliotecaVisible()) return;
  if (evento.target.matches('select, button, a, [contenteditable="true"]') && !(evento.ctrlKey || evento.metaKey)) return;

  const ctrlOrCmd = evento.ctrlKey || evento.metaKey;

  // Ctrl+S / Cmd+S: Guardar grafo actual
  if (ctrlOrCmd && evento.key === 's') {
    evento.preventDefault();
    guardarGrafoActual();
    return;
  }

  // Ctrl+M: Mostrar/Ocultar matriz
  if (ctrlOrCmd && evento.key === 'm') {
    evento.preventDefault();
    alternarMatriz();
    return;
  }

  // Ctrl+J: Ejecutar Johnson
  if (ctrlOrCmd && evento.key === 'j') {
    evento.preventDefault();
    alternarJohnson();
    return;
  }

  // Ctrl+B: Mostrar/Ocultar biblioteca
  if (ctrlOrCmd && evento.key === 'b') {
    evento.preventDefault();
    alternarBiblioteca();
    return;
  }

  // Delete / Backspace: Eliminar selección
  if ((evento.key === 'Delete' || evento.key === 'Backspace') && estado.seleccion) {
    evento.preventDefault();
    eliminarSeleccion();
    return;
  }

  // Ctrl+N: Crear nuevo nodo en el centro
  if (ctrlOrCmd && evento.key === 'n') {
    evento.preventDefault();
    const a = area();
    crearNodo((a.ancho / 2 - estado.zoom.offsetX) / estado.zoom.escala, (a.alto / 2 - estado.zoom.offsetY) / estado.zoom.escala);
    return;
  }

  // Número 1, 2, 3: Cambiar herramienta
  if (!ctrlOrCmd && !evento.metaKey && !evento.altKey) {
    if (evento.key === '1') {
      evento.preventDefault();
      elegirHerramienta('seleccionar');
      return;
    }
    if (evento.key === '2') {
      evento.preventDefault();
      elegirHerramienta('nodo');
      return;
    }
    if (evento.key === '3') {
      evento.preventDefault();
      elegirHerramienta('conectar');
      return;
    }
  }

  // Ctrl+/-: Zoom in/out
  if (ctrlOrCmd && (evento.key === '=' || evento.key === '+')) {
    evento.preventDefault();
    zoomIn();
    return;
  }

  if (ctrlOrCmd && evento.key === '-') {
    evento.preventDefault();
    zoomOut();
    return;
  }

  // Ctrl+0: Reset zoom
  if (ctrlOrCmd && evento.key === '0') {
    evento.preventDefault();
    zoomReset();
    return;
  }

  // Ctrl+Z: Deshacer
  if (ctrlOrCmd && evento.key === 'z' && !evento.shiftKey) {
    evento.preventDefault();
    deshacer();
    return;
  }

  // Ctrl+Shift+Z o Ctrl+Y: Rehacer
  if ((ctrlOrCmd && evento.shiftKey && evento.key === 'z') || (ctrlOrCmd && evento.key === 'y')) {
    evento.preventDefault();
    rehacer();
    return;
  }
});
