/* Punto de entrada del módulo de asignación: conecta botones, vistas y atajos.
 * Se carga después del resto de js/asignacion/. */

'use strict';

const appAsig = {
  slotEditor: document.getElementById('slotGrafoEditor'),
  slotResultado: document.getElementById('slotGrafoResultado'),
  resumen: document.getElementById('resumenAsignacion'),
  contador: document.getElementById('pasosContadorAsignacion'),
  panelTipo: document.getElementById('panelSeleccionTipo'),
  panelNombre: document.getElementById('panelSeleccionNombre'),
  panelDetalle: document.getElementById('panelSeleccionDetalle'),
  panelAcciones: document.getElementById('panelSeleccionAcciones')
};

/* ---------------- Render general ---------------- */

function colocarBloqueGrafo() {
  const destino = estadoAsignacion.vista === 'resultado' ? appAsig.slotResultado : appAsig.slotEditor;
  if (grafoAsig.bloque.parentElement !== destino) destino.appendChild(grafoAsig.bloque);
  grafoAsig.bloque.hidden = !(estadoAsignacion.vista === 'grafo' || (estadoAsignacion.vista === 'resultado' && resultadoVigenteAsignacion()));
}

function dibujarPasosAsignacion() {
  const indice = VISTAS_ASIGNACION.indexOf(estadoAsignacion.vista);
  document.querySelectorAll('#pasosAsignacion .paso').forEach(btn => {
    const i = VISTAS_ASIGNACION.indexOf(btn.dataset.vista);
    const actual = i === indice;
    btn.classList.toggle('completo', i < indice);
    if (actual) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
  });
  appAsig.contador.textContent = 'Paso ' + (indice + 1) + ' de ' + VISTAS_ASIGNACION.length;
  document.querySelectorAll('.vista').forEach(seccion => { seccion.hidden = seccion.dataset.vista !== estadoAsignacion.vista; });
}

function dibujarPanelSeleccion() {
  const s = estadoAsignacion.seleccion;
  const m = estadoAsignacion.modelo;
  const acciones = appAsig.panelAcciones;
  acciones.replaceChildren();
  const boton = (texto, clase, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm ' + clase;
    b.textContent = texto;
    b.addEventListener('click', fn);
    acciones.appendChild(b);
    return b;
  };

  if (!s) {
    appAsig.panelTipo.textContent = 'Selección';
    appAsig.panelNombre.textContent = 'Nada seleccionado';
    appAsig.panelDetalle.textContent = 'Toca un recurso, una tarea o una conexión en el grafo.';
    return;
  }
  if (s.tipo === 'nodo') {
    const e = buscarElementoAsignacion(m, s.id);
    if (!e) return;
    const lista = e.tipo === 'recurso' ? m.tareas : m.recursos;
    const completos = lista.filter(o => obtenerValorAsignacion(m, e.tipo === 'recurso' ? s.id : o.id, e.tipo === 'recurso' ? o.id : s.id) !== null).length;
    appAsig.panelTipo.textContent = e.tipo === 'recurso' ? 'Recurso seleccionado' : 'Tarea seleccionada';
    appAsig.panelNombre.textContent = e.elemento.nombre;
    appAsig.panelDetalle.textContent = completos + ' de ' + lista.length + ' conexiones con valor.';
    boton('Renombrar', 'btn-neutral', () => renombrarNodoAsignacion(s.id));
    boton('Eliminar', 'btn-peligro', () => eliminarNodoAsignacion(s.id));
    boton('Cerrar', 'btn-fantasma', () => seleccionarAsignacion(null));
    return;
  }
  const r = m.recursos.find(x => x.id === s.recursoId), t = m.tareas.find(x => x.id === s.tareaId);
  if (!r || !t) return;
  const valor = obtenerValorAsignacion(m, r.id, t.id);
  appAsig.panelTipo.textContent = 'Conexión seleccionada';
  appAsig.panelNombre.textContent = r.nombre + ' → ' + t.nombre;
  appAsig.panelDetalle.textContent = valor === null ? 'Pendiente: todavía no tiene valor (no cuenta como 0).' : (estadoAsignacion.objetivo === 'max' ? 'Beneficio: ' : 'Costo: ') + valor;
  boton(valor === null ? 'Dar valor' : 'Cambiar valor', 'btn-secondary', () => editarValorConexion(r.id, t.id));
  if (valor !== null) boton('Dejar pendiente', 'btn-peligro', () => eliminarConexionAsignacion(r.id, t.id));
  boton('Cerrar', 'btn-fantasma', () => seleccionarAsignacion(null));
}

function renderAsignacion(motivo) {
  limpiarSeleccionInvalida();
  dibujarPasosAsignacion();
  colocarBloqueGrafo();
  document.querySelectorAll('[data-objetivo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.objetivo === estadoAsignacion.objetivo ? 'true' : 'false'));
  appAsig.resumen.textContent = textoResumenAsignacion();
  dibujarEstadoResultadoAsignacion();
  document.getElementById('btnDeshacerAsig').disabled = !puedeDeshacerAsignacion();
  document.getElementById('btnRehacerAsig').disabled = !puedeRehacerAsignacion();
  document.getElementById('btnMostrarTodas').setAttribute('aria-pressed', estadoAsignacion.mostrarTodas ? 'true' : 'false');
  document.getElementById('btnMostrarValores').setAttribute('aria-pressed', estadoAsignacion.mostrarValores ? 'true' : 'false');

  const vista = estadoAsignacion.vista;
  if (vista === 'grafo' || vista === 'resultado') dibujarGrafoAsignacion();
  if (vista === 'grafo') dibujarPanelSeleccion();
  if (vista === 'matriz') {
    // Al escribir en la matriz no se reconstruye la tabla (perdería el foco); sí su validación.
    if (motivo === 'seleccion-matriz') dibujarValidacionAsignacion(); else dibujarMatrizAsignacion();
  }
  if (vista === 'resultado') dibujarResultadoAsignacion();
  if (vista === 'procedimiento') dibujarProcedimientoAsignacion();
  // Resolver solo con datos válidos, desde cualquier vista.
  if (vista !== 'matriz') {
    const ok = estadoValidacionAsignacion().ok;
    document.querySelectorAll('[data-accion="resolver"]').forEach(b => { b.disabled = !ok; });
  }
}

/* ---------------- Acciones ---------------- */

function completarPendientesAsignacion() {
  const pendientes = parejasPendientes(estadoAsignacion.modelo);
  if (!pendientes.length) { notificar('No hay parejas pendientes.', 'info'); return; }
  dialogoPedirTexto({
    titulo: 'Completar ' + pendientes.length + (pendientes.length === 1 ? ' pareja pendiente' : ' parejas pendientes'),
    mensaje: 'Escribe el valor que recibirán TODAS las parejas pendientes. No se asigna ningún valor por defecto: si prefieres uno distinto para cada pareja, edítalas en la matriz.',
    valor: '',
    validar: texto => {
      const v = validarValorAsignacion(texto);
      if (v.ok && v.valor === null) return { ok: false, error: 'Escribe un valor: vacío dejaría las parejas pendientes.' };
      return v;
    },
    etiquetaCampo: 'Valor para las pendientes'
  }).then(valor => {
    if (valor === undefined || valor === null) return;
    aplicarCambioAsignacion(modelo => pendientes.forEach(p => fijarValorAsignacion(modelo, p.recursoId, p.tareaId, valor)), { motivo: 'valor' });
    notificar(pendientes.length + ' parejas completadas con el valor ' + valor + '.', 'ok');
  });
}

function cargarEjemploAsignacion() {
  const hayDatos = estadoAsignacion.modelo.recursos.length + estadoAsignacion.modelo.tareas.length > 0;
  const aplicar = () => {
    aplicarCambioAsignacion((modelo, e) => {
      e.modelo = ejemploAsignacion();
      e.objetivo = 'min';
      e.posiciones = {};
      e.vista2d = null;
    }, { motivo: 'ejemplo' });
    estadoAsignacion.seleccion = null;
    matrizAsig.invalidas = {};
    emitirCambioAsignacion('seleccion');
    notificar('Ejemplo cargado: 4 trabajadores × 4 trabajos (mínimo esperado 26).', 'ok');
  };
  if (!hayDatos) { aplicar(); return; }
  dialogoConfirmar({ titulo: 'Cargar ejemplo', mensaje: 'Se reemplazarán los datos actuales. Podrás deshacerlo con Ctrl+Z.' }).then(ok => { if (ok) aplicar(); });
}

function limpiarAsignacion() {
  if (estadoAsignacion.modelo.recursos.length + estadoAsignacion.modelo.tareas.length === 0) { notificar('Ya está vacío.', 'info'); return; }
  dialogoConfirmar({
    titulo: 'Limpiar todo',
    mensaje: '¿Eliminar todos los recursos, tareas y valores? Se puede deshacer con Ctrl+Z.',
    peligro: true,
    textoAceptar: 'Limpiar'
  }).then(ok => {
    if (!ok) return;
    aplicarCambioAsignacion((modelo, e) => { e.modelo = crearModeloAsignacion(); e.posiciones = {}; e.vista2d = null; }, { motivo: 'limpiar' });
    estadoAsignacion.seleccion = null;
    matrizAsig.invalidas = {};
    cambiarVistaAsignacion('grafo');
    notificar('Datos eliminados.', 'ok');
  });
}

function exportarAsignacionJSON() {
  const datos = {
    version: 2,
    tipo: 'asignacion',
    fecha: new Date().toISOString(),
    objetivo: estadoAsignacion.objetivo,
    modelo: estadoAsignacion.modelo,
    posiciones: estadoAsignacion.posiciones
  };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'asignacion_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  notificar('Datos exportados a JSON.', 'ok');
}

function importarAsignacionJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = evento => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = e => {
      try {
        const datos = JSON.parse(e.target.result);
        let modelo = null, objetivo = 'min';
        if (datos && datos.modelo) { modelo = depurarModeloAsignacion(datos.modelo); objetivo = datos.objetivo === 'max' ? 'max' : 'min'; }
        else if (datos && Array.isArray(datos.values)) { modelo = migrarAsignacionV1(datos); objetivo = datos.objective === 'max' ? 'max' : 'min'; }
        if (!modelo) throw new Error('El archivo no contiene un problema de asignación válido.');
        const aplicar = () => {
          aplicarCambioAsignacion((m, est) => {
            est.modelo = modelo;
            est.objetivo = objetivo;
            est.posiciones = depurarPosiciones(datos.posiciones, modelo);
            est.vista2d = null;
          }, { motivo: 'importar' });
          estadoAsignacion.seleccion = null;
          matrizAsig.invalidas = {};
          cambiarVistaAsignacion('grafo');
          notificar('Datos importados correctamente.', 'ok');
        };
        if (estadoAsignacion.modelo.recursos.length + estadoAsignacion.modelo.tareas.length > 0) {
          dialogoConfirmar({ titulo: 'Importar', mensaje: 'Se reemplazarán los datos actuales. Podrás deshacerlo con Ctrl+Z.' }).then(ok => { if (ok) aplicar(); });
        } else aplicar();
      } catch (error) {
        notificar('Error al importar: ' + error.message, 'error');
      }
    };
    lector.onerror = () => notificar('No se pudo leer el archivo.', 'error');
    lector.readAsText(archivo);
  };
  input.click();
}

const TEXTO_AYUDA_ASIGNACION =
  'VIDEO\n' +
  '· El botón «Video» de la cabecera abre la presentación con el video explicativo del método húngaro.\n\n' +
  '1) GRAFO (paso 1)\n' +
  '· Recursos a la izquierda, tareas a la derecha. Cada pareja recurso–tarea tiene una conexión con un costo o beneficio.\n' +
  '· «+ Recurso» y «+ Tarea» agregan elementos (hasta ' + MAX_ASIGNACION_DIMENSION + ' por grupo). Doble toque sobre un nodo: renombrar.\n' +
  '· Herramienta Conectar: toca un recurso y luego una tarea (o al revés) para escribir el valor de esa conexión. No se pueden conectar dos recursos, dos tareas ni un elemento consigo mismo.\n' +
  '· Una conexión discontinua con «?» está PENDIENTE: no tiene valor y no equivale a 0. Todas deben completarse antes de resolver.\n' +
  '· Eliminar una conexión la deja pendiente. Eliminar un nodo borra todas sus conexiones.\n' +
  '· Arrastra los nodos para moverlos; «Reordenar» los devuelve a dos columnas. Rueda o pellizco: zoom; arrastrar el fondo: desplazar.\n\n' +
  '2) MATRIZ Y VALIDACIÓN (paso 2)\n' +
  '· La matriz es la misma información que el grafo: cambiar una celda actualiza el grafo y viceversa.\n' +
  '· Valores enteros entre -' + MAX_VALOR_ASIGNACION + ' y ' + MAX_VALOR_ASIGNACION + '. El 0 es válido; vacío es pendiente. Texto, decimales o infinitos se rechazan sin convertirse.\n' +
  '· Si hay más recursos que tareas (o al revés) se hacen min(recursos, tareas) asignaciones y el resto queda sin asignar.\n\n' +
  '3) RESULTADO (paso 3)\n' +
  '· El grafo destaca las conexiones elegidas y atenúa u oculta las demás («Mostrar todas» las recupera). Tocar una pareja la resalta también en la lista y en la matriz.\n' +
  '· Si cambias costos, conexiones, dimensiones u objetivo, el resultado se marca como no vigente y hay que recalcular. Mover un nodo no lo invalida.\n\n' +
  '4) PROCEDIMIENTO (paso 4)\n' +
  '· Pasos reales del método húngaro: matriz original, conversión de maximizar a minimizar, balanceo con ficticios, reducciones, cobertura mínima de líneas y ajustes con δ, selección final y total con los valores originales.\n' +
  '· Una búsqueda exhaustiva independiente comprueba el total y si la solución es única.\n\n' +
  '5) GUARDADO Y ATAJOS\n' +
  '· Todo se guarda solo en este navegador. Exportar/Importar JSON (panel «Edición») permite llevarte el problema.\n' +
  '· Ctrl+Z / Ctrl+Y deshacen y rehacen. 1 / 2 cambian de herramienta. Supr elimina la selección. Esc cierra el grafo ampliado o quita la selección.';

/* ---------------- Inicio ---------------- */

function inicializarAsignacion() {
  const origen = cargarAsignacion();
  if (origen === 'v1') notificar('Se migró la matriz guardada por la versión anterior. Revisa los datos.', 'aviso');

  alCambiarAsignacion(renderAsignacion);
  inicializarInteraccionGrafo();
  inicializarProcedimientoAsignacion();

  document.querySelectorAll('#pasosAsignacion .paso').forEach(b => b.addEventListener('click', () => cambiarVistaAsignacion(b.dataset.vista)));
  document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => cambiarVistaAsignacion(b.dataset.ir)));
  document.querySelectorAll('[data-accion="resolver"]').forEach(b => b.addEventListener('click', resolverAsignacion));
  document.querySelectorAll('[data-objetivo]').forEach(b => b.addEventListener('click', () => {
    if (estadoAsignacion.objetivo === b.dataset.objetivo) return;
    aplicarCambioAsignacion((m, e) => { e.objetivo = b.dataset.objetivo; }, { motivo: 'objetivo' });
  }));
  document.querySelectorAll('[data-herramienta-asig]').forEach(b => b.addEventListener('click', () => elegirHerramientaAsignacion(b.dataset.herramientaAsig)));

  document.getElementById('btnAgregarRecurso').addEventListener('click', () => agregarNodoAsignacion('recurso'));
  document.getElementById('btnAgregarTarea').addEventListener('click', () => agregarNodoAsignacion('tarea'));
  document.getElementById('btnVacioRecurso').addEventListener('click', () => agregarNodoAsignacion('recurso'));
  document.getElementById('btnVacioTarea').addEventListener('click', () => agregarNodoAsignacion('tarea'));
  document.getElementById('btnVacioEjemplo').addEventListener('click', cargarEjemploAsignacion);
  document.getElementById('btnReordenar').addEventListener('click', reordenarGrafoAsignacion);
  document.getElementById('btnAjustarVista').addEventListener('click', ajustarVistaAsignacion);
  document.getElementById('btnZoomMasAsig').addEventListener('click', () => zoomAsignacion(1.25));
  document.getElementById('btnZoomMenosAsig').addEventListener('click', () => zoomAsignacion(1 / 1.25));
  document.getElementById('btnAmpliarGrafo').addEventListener('click', () => alternarAmpliarGrafo());
  document.getElementById('btnMostrarTodas').addEventListener('click', () => { estadoAsignacion.mostrarTodas = !estadoAsignacion.mostrarTodas; renderAsignacion('visual'); });
  document.getElementById('btnMostrarValores').addEventListener('click', () => { estadoAsignacion.mostrarValores = !estadoAsignacion.mostrarValores; renderAsignacion('visual'); });
  document.getElementById('btnDeshacerAsig').addEventListener('click', () => { if (!deshacerAsignacion()) notificar('No hay acciones para deshacer.', 'info'); });
  document.getElementById('btnRehacerAsig').addEventListener('click', () => { if (!rehacerAsignacion()) notificar('No hay acciones para rehacer.', 'info'); });
  document.getElementById('btnCompletarPendientes').addEventListener('click', completarPendientesAsignacion);
  document.getElementById('btnEjemploAsig').addEventListener('click', cargarEjemploAsignacion);
  document.getElementById('btnLimpiarAsig').addEventListener('click', limpiarAsignacion);
  document.getElementById('btnExportarAsignacion').addEventListener('click', exportarAsignacionJSON);
  document.getElementById('btnImportarAsignacion').addEventListener('click', importarAsignacionJSON);
  document.getElementById('btnAyudaAsignacion').addEventListener('click', () => dialogoInformar({ titulo: 'Cómo usar Asignación', mensaje: TEXTO_AYUDA_ASIGNACION, ancho: true }));

  document.addEventListener('keydown', evento => {
    if (dialogoAbierto()) return;
    const enCampo = evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA';
    const ctrl = evento.ctrlKey || evento.metaKey;
    if (evento.key === 'Escape') {
      if (grafoAmpliado()) { alternarAmpliarGrafo(false); return; }
      if (estadoAsignacion.origenConexion) { estadoAsignacion.origenConexion = null; dibujarGrafoAsignacion(); return; }
      if (estadoAsignacion.seleccion && !enCampo) { seleccionarAsignacion(null); return; }
    }
    if (enCampo) return;
    if (ctrl && evento.key.toLowerCase() === 'z' && !evento.shiftKey) { evento.preventDefault(); deshacerAsignacion(); return; }
    if ((ctrl && evento.key.toLowerCase() === 'y') || (ctrl && evento.shiftKey && evento.key.toLowerCase() === 'z')) { evento.preventDefault(); rehacerAsignacion(); return; }
    if (estadoAsignacion.vista !== 'grafo') return;
    if (evento.key === '1') elegirHerramientaAsignacion('seleccionar');
    if (evento.key === '2') elegirHerramientaAsignacion('conectar');
    if ((evento.key === 'Delete' || evento.key === 'Backspace') && estadoAsignacion.seleccion && !evento.target.closest('#svgAsignacion')) {
      const s = estadoAsignacion.seleccion;
      evento.preventDefault();
      if (s.tipo === 'nodo') eliminarNodoAsignacion(s.id); else eliminarConexionAsignacion(s.recursoId, s.tareaId);
    }
  });

  renderAsignacion('inicio');
}

inicializarAsignacion();
