/* Punto de entrada de Johnson: conecta los botones y arranca la aplicación.
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
el.btnJohnson.addEventListener('click', () => { cerrarMenuExtra(); calcularYMostrarJohnson(); });

// Ejemplos: desde la barra y desde el estado vacío.
el.btnEjemplos.addEventListener('click', () => { cerrarMenuExtra(); mostrarEjemplos(); });
el.btnVacioEjemplo.addEventListener('click', mostrarEjemplos);
el.btnCerrarEjemplos.addEventListener('click', cerrarEjemplos);
el.ejemplosFondo.addEventListener('click', evento => {
  if (evento.target === el.ejemplosFondo) cerrarEjemplos();
});

el.btnDeshacer.addEventListener('click', () => { cerrarMenuExtra(); deshacer(); });
el.btnRehacer.addEventListener('click', () => { cerrarMenuExtra(); rehacer(); });

// «Guardar» guarda directamente; «Biblioteca» abre la lista de grafos guardados.
el.btnGuardar.addEventListener('click', () => { cerrarMenuExtra(); guardarGrafoActual(); });
el.btnBiblioteca.addEventListener('click', () => { cerrarMenuExtra(); alternarBiblioteca(); });
el.btnGuardarActual.addEventListener('click', guardarGrafoActual);
el.btnCerrarBiblioteca.addEventListener('click', cerrarBiblioteca);
el.bibliotecaFondo.addEventListener('click', evento => {
  if (evento.target === el.bibliotecaFondo) cerrarBiblioteca();
});

// Botones de exportar/importar
document.getElementById('btnExportarJSON').addEventListener('click', () => { cerrarMenuExtra(); exportarGrafoJSON(); });
document.getElementById('btnExportarImagen').addEventListener('click', () => { cerrarMenuExtra(); exportarGrafoImagen(); });
document.getElementById('btnImportarJSON').addEventListener('click', () => { cerrarMenuExtra(); importarGrafoJSON(); });

// Botones de zoom
document.getElementById('btnZoomIn').addEventListener('click', zoomIn);
document.getElementById('btnZoomOut').addEventListener('click', zoomOut);
document.getElementById('btnZoomReset').addEventListener('click', zoomReset);

// Botón de Dijkstra
document.getElementById('btnDijkstra').addEventListener('click', () => {
  cerrarMenuExtra();
  if (estado.seleccion && estado.seleccion.tipo === 'nodo') {
    ejecutarDijkstra(estado.seleccion.id);
  } else {
    avisar('Selecciona un nodo para ejecutar Dijkstra desde ese origen.', 'error');
  }
});

el.btnEmpezar.addEventListener('click', () => {
  // Elegir la herramienta cambia el mensaje de ayuda y con él la altura del lienzo,
  // por eso el área se mide después: así el nodo queda realmente centrado.
  elegirHerramienta('nodo');
  const a = medirArea();
  crearNodo(a.ancho / 2, a.alto / 2);
});

/*   MENÚ «Más»
   Guarda las acciones menos frecuentes para que la barra ocupe menos alto.
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
  if (abrir) {
    // Que nunca quede cortado por el borde inferior: si no cabe, se desplaza por dentro.
    const libre = window.innerHeight - menuExtra.getBoundingClientRect().top - 12;
    menuExtra.style.maxHeight = Math.max(160, libre) + 'px';
  }
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

  const a = medirArea();
  // Con el lienzo oculto (la presentación con video u otra vista del módulo)
  // el área mide 0 y los nodos se amontonarían en la esquina.
  if (a.ancho < 50 || a.alto < 50) return;
  if (ajustarNodosAlArea()) guardar();
  aplicarZoom();
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

inicializarVistasJohnson();
cargar();
const areaInicial = medirArea();
if (areaInicial.ancho >= 50 && areaInicial.alto >= 50 && ajustarNodosAlArea()) guardar();   // el grafo pudo guardarse en una pantalla más grande
elegirHerramienta('seleccionar');
if (estado.nodos.length === 0) {
  // Mensaje corto: la explicación completa está en el botón Ayuda.
  ayudar('Selecciona <strong>Nodo</strong> y toca el área para comenzar, o carga un <strong>ejemplo</strong>.');
}
dibujar();

// Atajos de teclado adicionales
document.addEventListener('keydown', evento => {
  // Ignorar si estamos escribiendo o hay una ventana abierta
  const etiqueta = evento.target.tagName;
  if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT') return;
  if (modalAbierto() || introVisible()) return;

  const ctrlOrCmd = evento.ctrlKey || evento.metaKey;
  const tecla = evento.key.toLowerCase();

  // Atajos de módulo: funcionan desde cualquier vista.
  if (ctrlOrCmd && tecla === 'z' && !evento.shiftKey) { evento.preventDefault(); deshacer(); return; }
  if (ctrlOrCmd && (tecla === 'y' || (evento.shiftKey && tecla === 'z'))) { evento.preventDefault(); rehacer(); return; }
  if (ctrlOrCmd && tecla === 's') { evento.preventDefault(); guardarGrafoActual(); return; }
  if (ctrlOrCmd && tecla === 'b') { evento.preventDefault(); alternarBiblioteca(); return; }
  if (ctrlOrCmd && tecla === 'm') { evento.preventDefault(); cambiarVistaJohnson('matriz'); return; }
  if (ctrlOrCmd && tecla === 'j') { evento.preventDefault(); calcularYMostrarJohnson(); return; }

  // El resto actúa sobre el editor: solo con el grafo a la vista y sin hojas abiertas.
  if (!tecladoSobreGrafo(evento)) return;

  // Delete / Backspace: Eliminar selección
  if ((evento.key === 'Delete' || evento.key === 'Backspace') && estado.seleccion) {
    evento.preventDefault();
    eliminarSeleccion();
    return;
  }

  // Ctrl+N: Crear nuevo nodo en el centro
  if (ctrlOrCmd && tecla === 'n') {
    evento.preventDefault();
    const a = medirArea();
    crearNodo(a.ancho / 2, a.alto / 2);
    return;
  }

  // Número 1, 2, 3: Cambiar herramienta
  if (!ctrlOrCmd && !evento.altKey) {
    const herramienta = { 1: 'seleccionar', 2: 'nodo', 3: 'conectar' }[evento.key];
    if (herramienta) { evento.preventDefault(); elegirHerramienta(herramienta); return; }
  }

  // Ctrl +/−/0: zoom
  if (ctrlOrCmd && (evento.key === '=' || evento.key === '+')) { evento.preventDefault(); zoomIn(); return; }
  if (ctrlOrCmd && evento.key === '-') { evento.preventDefault(); zoomOut(); return; }
  if (ctrlOrCmd && evento.key === '0') { evento.preventDefault(); zoomReset(); }
});
