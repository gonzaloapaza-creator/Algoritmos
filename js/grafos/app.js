/* Controlador compartido. Cada página crea un único estado y clave independientes. */
'use strict';

const moduloGrafo = {
  modulo: document.body.dataset.modulo,
  grafo: crearGrafoVacio(document.body.dataset.modulo === 'dijkstra'),
  origen: null, destino: null, objetivo: 'min', vista: 'grafo', paso: 0,
  resultado: null, pendiente: '', procedimientoVisitado: false, seleccion: null, historial: { pasado: [], futuro: [] },
  reproduciendo: false, intervalo: null, revision: 0, preparando: false,
  herramienta: 'seleccionar', conexionDesde: null, solicitandoConexion: false,
  vistaSvg: { x: 0, y: 0, ancho: 1000, alto: 600 }
};
const esDijkstraModulo = moduloGrafo.modulo === 'dijkstra';
const elementoGrafo = id => document.getElementById(id);

function construirInterfazModuloGrafo() {
  elementoGrafo('editorModuloGrafo').innerHTML = `
    <nav class="gm-flujo" aria-label="Etapas del módulo"><ol class="pasos">
      <li><button type="button" class="paso" data-vista-grafo="grafo" aria-label="Etapa 1: Grafo y datos"><span class="paso__numero">1</span><span class="paso__texto">Crea tu grafo<small>Puntos y conexiones</small></span></button></li>
      <li><button type="button" class="paso" data-vista-grafo="configuracion" aria-label="Etapa 2: ${esDijkstraModulo ? 'Origen y objetivo' : 'Objetivo'}"><span class="paso__numero">2</span><span class="paso__texto">${esDijkstraModulo ? 'Elige origen y objetivo' : 'Elige el objetivo'}<small>${esDijkstraModulo ? 'Mínimo; máximo solo en DAG' : '¿Mínimo o máximo?'}</small></span></button></li>
      <li><button type="button" class="paso" data-vista-grafo="procedimiento" aria-label="Etapa 3: Procedimiento"><span class="paso__numero">3</span><span class="paso__texto">Paso a paso<small>Consulta opcional</small></span></button></li>
      <li><button type="button" class="paso" data-vista-grafo="resultado" aria-label="Etapa 4: Resultado"><span class="paso__numero">4</span><span class="paso__texto">Tu resultado<small>${esDijkstraModulo ? 'Distancias y rutas' : 'Conexiones y peso total'}</small></span></button></li>
    </ol></nav>
    <div class="gm-herramientas" id="herramientasGrafo">
      <div class="gm-ejemplo-intro"><strong>Prueba y aprende</strong><span>Carga un ejemplo y explóralo.</span></div>
      <label>Ejemplo<select id="ejemploGrafo"><option value="obligatorio">Caso de clase</option><option value="ceros">Ceros y empates</option><option value="desconectado">Grupos separados</option></select></label>
      <button type="button" class="btn btn-secondary" id="btnEjemploGrafo">Cargar ejemplo</button>
      <button type="button" class="btn btn-neutral" id="btnDeshacerGrafo">Deshacer</button>
      <button type="button" class="btn btn-neutral" id="btnRehacerGrafo">Rehacer</button>
      <details class="gm-opciones"><summary class="btn btn-fantasma">Más opciones</summary><div class="gm-opciones-contenido">
      <label>Vértices<input type="number" id="cantidadAleatoriaGrafo" min="1" max="24" value="6" /></label>
      <label>Aristas<input type="number" id="aristasAleatoriasGrafo" min="0" max="96" value="8" /></label>
      <button type="button" class="btn btn-neutral" id="btnAleatorioGrafo">Generar</button>
      <button type="button" class="btn btn-fantasma" id="btnImportarGrafo">Importar JSON</button>
      <button type="button" class="btn btn-fantasma" id="btnExportarGrafo">Exportar JSON</button>
      <button type="button" class="btn btn-peligro" id="btnLimpiarGrafo">Limpiar</button>
      <input type="file" id="archivoGrafo" accept=".json,application/json" hidden />
      </div></details>
    </div>
    <p class="gm-estado" id="estadoCalculoGrafo" role="status"></p>
    <div class="gm-guia-etapa"><h2 id="tituloEtapaGrafo" tabindex="-1"></h2><p id="descripcionEtapaGrafo"></p></div>
    <div class="gm-distribucion" id="distribucionGrafo">
      <section class="gm-panel gm-lienzo-panel" aria-labelledby="tituloLienzoGrafo">
        <div class="gm-lienzo-cab"><div><h2 id="tituloLienzoGrafo">Tu grafo</h2><p class="gm-info" id="resumenGrafo"></p></div><div class="gm-zoom" role="group" aria-label="Vista del grafo">
          <button type="button" class="btn btn-neutral" id="btnAjustarGrafo">Ver todo</button><button type="button" class="btn btn-neutral" id="btnAmpliarGrafo" aria-pressed="false">Ampliar</button>
          <details class="gm-vista-opciones"><summary class="btn btn-fantasma">Zoom y más</summary><div class="gm-zoom-detalle"><button type="button" class="btn btn-neutral" id="btnZoomMenosGrafo" aria-label="Alejar">−</button><button type="button" class="btn btn-neutral" id="btnZoomMasGrafo" aria-label="Acercar">+</button><button type="button" class="btn btn-neutral" id="btnPngGrafo">PNG</button>
          <button type="button" class="btn btn-fantasma" data-pan-grafo="izquierda" aria-label="Desplazar vista a la izquierda">←</button><button type="button" class="btn btn-fantasma" data-pan-grafo="arriba" aria-label="Desplazar vista arriba">↑</button><button type="button" class="btn btn-fantasma" data-pan-grafo="abajo" aria-label="Desplazar vista abajo">↓</button><button type="button" class="btn btn-fantasma" data-pan-grafo="derecha" aria-label="Desplazar vista a la derecha">→</button>
          </div></details>
        </div></div>
        <div class="gm-editor-herramientas" role="group" aria-label="Herramientas de edición"><button type="button" class="btn btn-neutral" data-herramienta-grafo="seleccionar" aria-pressed="true">Seleccionar / mover</button><button type="button" class="btn btn-neutral" data-herramienta-grafo="crear" aria-pressed="false">Crear punto</button><button type="button" class="btn btn-neutral" data-herramienta-grafo="conectar" aria-pressed="false">Conectar extremos</button><button type="button" class="btn btn-neutral" data-herramienta-grafo="desplazar" aria-pressed="false">Desplazar vista</button><button type="button" class="btn btn-fantasma" id="btnCancelarConexionGrafo" hidden>Cancelar conexión</button><button type="button" class="btn btn-fantasma" id="btnOrganizarGrafo">Organizar grafo</button><button type="button" class="btn btn-fantasma" id="btnEditarSeleccionGrafo" disabled>Editar selección</button></div><p class="gm-herramienta-estado" id="estadoHerramientaGrafo" role="status"></p>
        <div class="gm-lienzo" tabindex="0" aria-label="Lienzo editable"><svg id="svgModuloGrafo" viewBox="0 0 1000 600" role="group" aria-label="Grafo editable. También puedes usar los formularios y listas."></svg>
          <div class="gm-vacio" id="bienvenidaGrafo"><span class="gm-vacio-icono" aria-hidden="true">↗</span><h3>Tu primera red empieza aquí</h3><p>Prueba un ejemplo listo o añade dos puntos y conéctalos.</p><button type="button" class="btn btn-primary" id="btnEjemploRapidoGrafo">Explorar un ejemplo</button><button type="button" class="btn btn-fantasma" id="btnCrearPrimerPunto">Crear mi primer punto →</button></div>
        </div>
        <div class="gm-leyenda" aria-label="Leyenda del grafo"><span><i class="gm-muestra gm-muestra-elegida" aria-hidden="true"></i>${esDijkstraModulo ? 'Árbol de predecesores' : 'Conexión aceptada'}</span><span><i class="gm-muestra gm-muestra-actual" aria-hidden="true"></i>En este paso</span><span><i class="gm-muestra gm-muestra-seleccion" aria-hidden="true"></i>Tu selección</span>${esDijkstraModulo ? '<span><i class="gm-muestra gm-muestra-ruta" aria-hidden="true"></i>Ruta al destino</span>' : '<span>Trazo discontinuo: descartada por ciclo</span>'}</div>
        <p class="gm-ayuda-corta" id="seleccionTextoGrafo"></p>
      </section>
      <section class="gm-panel gm-editor" id="panelEditorGrafo" aria-labelledby="tituloEditorGrafo"><h2 id="tituloEditorGrafo">Construye tu grafo</h2>
        <div class="gm-editor-bloque"><h3><span class="gm-numero" aria-hidden="true">1</span> Añade puntos</h3><p class="gm-info">Cada punto es un vértice: una ciudad, una parada o un lugar.</p><label for="nombreVertice">Nombre del punto</label><div class="gm-nuevo-punto"><input id="nombreVertice" maxlength="12" placeholder="Por ejemplo, A" autocomplete="off" aria-describedby="ayudaNombreVertice" /><button type="button" class="btn btn-primary" id="btnCrearVertice">Añadir</button></div><p class="gm-microayuda" id="ayudaNombreVertice">Hasta 12 caracteres. Nombres únicos sin distinguir mayúsculas ni espacios repetidos. Enter añade el punto.</p>
        <details class="gm-editar" id="ajustesVerticeGrafo"><summary>Editar un punto existente</summary><label for="seleccionVertice">Vértice seleccionado</label><select id="seleccionVertice"></select>
        <label for="nombreSeleccionado">Nombre</label><input id="nombreSeleccionado" maxlength="12" /><div class="gm-fila"><button type="button" class="btn btn-secondary" id="btnRenombrarVertice">Renombrar</button><button type="button" class="btn btn-peligro" id="btnEliminarVertice">Eliminar</button></div>
        <details class="gm-editar gm-posicion-opciones"><summary>Ajustar posición con coordenadas</summary><div class="gm-fila gm-posiciones"><div><label for="posicionNodoX">Posición X</label><input id="posicionNodoX" type="number" min="30" max="970" /></div><div><label for="posicionNodoY">Posición Y</label><input id="posicionNodoY" type="number" min="30" max="570" /></div></div><div class="gm-fila"><button type="button" class="btn btn-neutral" id="btnMoverVertice">Aplicar posición</button></div></details></details></div>
        <div class="gm-editor-bloque"><h3><span class="gm-numero" aria-hidden="true">2</span> Conecta los puntos</h3><p class="gm-info">Una conexión es una arista. Su peso indica la distancia o el costo.</p><div class="gm-extremos"><div><label for="aristaDesde">Desde</label><select id="aristaDesde"></select></div><span aria-hidden="true">${esDijkstraModulo ? '→' : '↔'}</span><div><label for="aristaHacia">Hasta</label><select id="aristaHacia"></select></div></div><label for="pesoArista">Peso (entero de 0 a 999999)</label><div class="gm-nueva-arista"><input id="pesoArista" inputmode="numeric" value="1" aria-describedby="ayudaCrearArista" /><button type="button" class="btn btn-primary" id="btnCrearArista">Conectar</button></div>
        <p class="gm-info" id="ayudaCrearArista">Una arista conecta dos vértices distintos. El peso representa su distancia o costo.</p>
        <details class="gm-editar" id="ajustesAristaGrafo"><summary>Editar una conexión existente</summary><label for="seleccionArista">Arista seleccionada</label><select id="seleccionArista"></select><label for="pesoSeleccionado">Editar peso</label><input id="pesoSeleccionado" inputmode="numeric" /><div class="gm-fila"><button type="button" class="btn btn-secondary" id="btnEditarPeso">Cambiar peso</button><button type="button" class="btn btn-peligro" id="btnEliminarArista">Eliminar</button></div></details></div>
        <div class="gm-avance"><button type="button" class="btn btn-primary" id="btnContinuarGrafo">Continuar: ${esDijkstraModulo ? 'elegir origen' : 'elegir objetivo'} →</button></div>
      </section>
      <section class="gm-panel gm-config" id="panelConfigGrafo" aria-labelledby="tituloConfigGrafo"><h2 id="tituloConfigGrafo">${esDijkstraModulo ? 'Origen y destino' : 'Objetivo del bosque'}</h2>
        <div id="configDijkstra"><label for="selectorModoGrafo">Modo del grafo</label><select id="selectorModoGrafo"><option value="dirigido">Dirigido</option><option value="no-dirigido">No dirigido</option></select><label for="origenGrafo">Origen</label><select id="origenGrafo"></select><label for="destinoGrafo">Destino opcional</label><select id="destinoGrafo"></select><label for="objetivoDijkstra">Objetivo del camino</label><select id="objetivoDijkstra"><option value="min">Mínimo (Dijkstra)</option><option value="max">Máximo (solo grafo dirigido acíclico)</option></select><p class="gm-info">Mínimo: Dijkstra. Máximo: relajación en orden topológico; requiere dirección y ausencia de ciclos. Cambiar objetivo conserva todas las conexiones.</p></div>
        <div id="configKruskal"><label for="objetivoGrafo">Peso del árbol o bosque</label><select id="objetivoGrafo"><option value="min">Mínimo</option><option value="max">Máximo</option></select></div>
        <p class="gm-info" id="contratoGrafo"></p><div class="gm-config-resumen" id="resumenConfigGrafo" role="status"></div><div class="gm-fila"><button type="button" class="btn btn-primary" id="btnResolverGrafo">${esDijkstraModulo ? 'Encontrar caminos mínimos' : 'Encontrar conexiones'} →</button></div><details class="gm-teoria"><summary>Cómo funciona y límites</summary><p class="gm-info" id="detalleContratoGrafo"></p></details>
        <button type="button" class="btn btn-neutral" id="btnCancelarCalculoGrafo" hidden>Cancelar preparación</button>
        <div class="gm-avance"><button type="button" class="btn btn-fantasma" id="btnVolverEditarGrafo">← Volver al grafo</button></div>
      </section>
    <section id="procedimientoGrafo" class="gm-panel gm-resultado" aria-labelledby="tituloProcedimientoGrafo"><h2 id="tituloProcedimientoGrafo">Decisiones de la ejecución</h2>
      <p class="gm-info">${esDijkstraModulo ? 'El predecesor es el vértice anterior en el camino elegido. ∞ o −∞ indica que aún no se ha encontrado un camino.' : 'Una componente es un grupo de vértices ya conectados. Unir dos del mismo grupo formaría un ciclo.'}</p>
      <div class="gm-cinta"><div class="gm-progreso"><span id="contadorPasosGrafo"></span><progress id="progresoPasosGrafo" value="0" max="1" aria-label="Avance del procedimiento"></progress></div><div class="gm-repro-principal"><button type="button" class="btn btn-neutral" id="btnAnteriorGrafo">← Anterior</button><button type="button" class="btn btn-primary" id="btnReproducirGrafo">Reproducir</button><button type="button" class="btn btn-neutral" id="btnSiguienteGrafo">Siguiente →</button></div><details class="gm-repro-opciones"><summary>Velocidad y más controles</summary><div class="gm-repro-detalle"><button type="button" class="btn btn-fantasma" id="btnReiniciarGrafo">Reiniciar</button><button type="button" class="btn btn-fantasma" id="btnUltimoGrafo">Último paso</button><label for="velocidadGrafo">Velocidad</label><select id="velocidadGrafo"><option value="1400">Lenta</option><option value="750" selected>Normal</option><option value="250">Rápida</option></select></div></details></div>
      <p class="gm-explicacion" id="explicacionPasoGrafo" role="status"></p><div id="detallePasoGrafo" class="gm-info"></div><div class="gm-tabla-caja"><table class="tabla" id="tablaEstadoGrafo"></table></div>
      <div class="gm-avance"><button type="button" class="btn btn-primary" id="btnVerResultadoGrafo">Ver resultado →</button></div>
    </section>
    <section id="resultadoGrafo" class="gm-panel gm-resultado" aria-labelledby="tituloResultadoGrafo"></section>
    </div>`;
  elementoGrafo('btnUltimoGrafo').insertAdjacentHTML('afterend', '<button type="button" class="btn btn-fantasma" id="btnImprimirGrafo">Imprimir todos los pasos</button>');
  const lienzo = elementoGrafo('svgModuloGrafo').parentElement;
  const herramientas = elementoGrafo('editorModuloGrafo').querySelector('.gm-editor-herramientas');
  const edicion = document.createElement('details'); edicion.id = 'edicionJuntoGrafo';
  const cabEdicion = document.createElement('summary'); cabEdicion.textContent = 'Editar grafo'; herramientas.before(edicion);
  edicion.append(cabEdicion, herramientas, elementoGrafo('estadoHerramientaGrafo'));
  const consulta = document.createElement('div'); consulta.className = 'gm-consulta'; consulta.setAttribute('aria-label', esDijkstraModulo ? 'Origen, destino y cálculo' : 'Objetivo y cálculo');
  consulta.append(elementoGrafo('configDijkstra'), elementoGrafo('configKruskal'), elementoGrafo('btnResolverGrafo'), elementoGrafo('btnCancelarCalculoGrafo'));
  lienzo.before(consulta);
  if (esDijkstraModulo) {
    const leyenda = document.createElement('span'); leyenda.textContent = 'Ruta: trazo grueso segmentado · Sin camino: contorno de puntos';
    elementoGrafo('editorModuloGrafo').querySelector('.gm-leyenda').append(leyenda);
  }
  const vistaActiva = document.createElement('div'); vistaActiva.id = 'consultaRutaGrafo'; vistaActiva.className = 'gm-consulta-ruta'; vistaActiva.setAttribute('role', 'status'); lienzo.before(vistaActiva);
  if (esDijkstraModulo) {
    const guia = document.createElement('aside'); guia.id = 'guiaLecturaEjemploGrafo'; guia.className = 'gm-guia-ejemplo'; guia.hidden = true; vistaActiva.before(guia);
  }
  lienzo.after(elementoGrafo('explicacionPasoGrafo'), elementoGrafo('editorModuloGrafo').querySelector('.gm-cinta'));
  elementoGrafo('configDijkstra').hidden = !esDijkstraModulo;
  // Cada etiqueta viaja con su control; no se generan columnas implícitas.
  const configuracion = elementoGrafo('configDijkstra');
  Array.from(configuracion.querySelectorAll('label')).forEach(label => {
    const grupo = document.createElement('div'); grupo.className = 'gm-campo-config';
    const control = elementoGrafo(label.htmlFor); label.before(grupo); grupo.append(label, control);
  });
  const catalogo = catalogoEjemplosGrafo(moduloGrafo.modulo), selector = elementoGrafo('ejemploGrafo');
  selector.replaceChildren(); catalogo.forEach(e => selector.add(new Option(e.nombre, e.id)));
  const pista = document.createElement('p'); pista.id = 'guiaEjemploGrafo'; pista.className = 'gm-info'; selector.parentElement.after(pista);
  const describir = () => {
    const ejemplo = catalogo.find(e => e.id === selector.value);
    pista.textContent = ejemplo.descripcion + (esDijkstraModulo ? ' Consulta sugerida: ' + nombreEjemplo(ejemplo.origen) + ' → ' + nombreEjemplo(ejemplo.destino) + ', Mínimo (Dijkstra).' : '');
    function nombreEjemplo(id) { return crearEjemploGrafo('dijkstra', ejemplo.id).nodos.find(n => n.id === id).nombre; }
  };
  selector.addEventListener('change', describir); describir();
  elementoGrafo('editorModuloGrafo').querySelectorAll('input, select').forEach(campo => campo.classList.add('entrada'));
  elementoGrafo('configKruskal').hidden = esDijkstraModulo;
  elementoGrafo('contratoGrafo').textContent = esDijkstraModulo
    ? 'Elige el origen y el objetivo. Mínimo usa Dijkstra con pesos no negativos; máximo usa orden topológico y exige un grafo dirigido acíclico. El destino es opcional: se calculan los mejores valores a todos los vértices.'
    : 'Mínimo: conecta cada grupo con el menor peso total. Máximo: busca el mayor peso total. Si hay grupos separados, obtendrás un bosque, sin añadir conexiones.';
  elementoGrafo('detalleContratoGrafo').textContent = esDijkstraModulo
    ? 'Pesos enteros de 0 a 999999. Sin bucles ni aristas duplicadas. En modo dirigido sí se admiten A→B y B→A como aristas distintas; en no dirigido A–B y B–A son una sola conexión. El mínimo usa Dijkstra (O(V² + E)). El máximo requiere modo dirigido y ningún ciclo; se calcula con orden topológico (O(V + E)). En ambos se calculan todos los destinos y los empates conservan el primer predecesor.'
    : 'Pesos enteros de 0 a 999999 por política del producto. Grafo no dirigido, sin bucles ni duplicados. Orden O(E log E) y Union-Find con compresión/rango. Empates por orden original de aristas. Registrar componentes añade O(EV) al procedimiento educativo.';
}

function serializarModuloGrafo() {
  return { version: 1, modulo: moduloGrafo.modulo, grafo: copiarGrafoModulo(moduloGrafo.grafo), origen: moduloGrafo.origen,
    destino: moduloGrafo.destino, objetivo: moduloGrafo.objetivo, vista: moduloGrafo.vista, paso: moduloGrafo.paso, resuelto: !!moduloGrafo.resultado };
}

function guardarModuloGrafo() {
  const clave = esDijkstraModulo ? DIJKSTRA_STORAGE_KEY : KRUSKAL_STORAGE_KEY;
  if (typeof permiteEscrituraGuardado === 'function' && !permiteEscrituraGuardado(clave)) return;
  escribirAlmacenamientoLocal(clave, JSON.stringify(serializarModuloGrafo()), { respaldo: 'usa «Exportar JSON»' });
}

function aplicarDocumentoModuloGrafo(documento, mantenerHistorial, registrarCambio = false) {
  const validacion = validarDocumentoGrafo(documento, moduloGrafo.modulo);
  if (!validacion.ok) throw new Error(validacion.error);
  const d = validacion.datos;
  // También la reconstrucción del resultado se prepara antes de modificar el ejercicio activo.
  const resultado = d.resuelto ? (esDijkstraModulo
    ? (d.objetivo === 'max' ? resolverCaminoMaximoDAG(d.grafo, d.origen) : resolverDijkstraGrafo(d.grafo, d.origen))
    : resolverKruskalGrafo(d.grafo, d.objetivo)) : null;
  if (registrarCambio) guardarHistoriaGrafo();
  moduloGrafo.conexionDesde = null; moduloGrafo.solicitandoConexion = false;
  detenerReproduccionGrafo(); moduloGrafo.revision++; moduloGrafo.preparando = false;
  delete moduloGrafo.tiempoCalculo;
  Object.assign(moduloGrafo, { grafo: d.grafo, origen: d.origen, destino: d.destino, objetivo: d.objetivo, vista: d.vista,
    resultado, pendiente: '', procedimientoVisitado: d.vista === 'procedimiento', paso: Math.min(d.paso, Math.max(0, resultado ? resultado.pasos.length - 1 : 0)), seleccion: null });
  if (!mantenerHistorial) moduloGrafo.historial = { pasado: [], futuro: [] };
  actualizarModuloGrafo(); guardarModuloGrafo();
}

function guardarHistoriaGrafo() {
  moduloGrafo.historial.pasado.push(serializarModuloGrafo());
  if (moduloGrafo.historial.pasado.length > MAX_ACCIONES_DESHACER) moduloGrafo.historial.pasado.shift();
  moduloGrafo.historial.futuro = [];
}

function invalidarResultadoGrafo(motivo = 'Cambiaste los datos matemáticos.') {
  detenerReproduccionGrafo(); moduloGrafo.revision++; moduloGrafo.preparando = false;
  delete moduloGrafo.tiempoCalculo;
  if (moduloGrafo.resultado || moduloGrafo.pendiente) moduloGrafo.pendiente = motivo;
  moduloGrafo.resultado = null; moduloGrafo.paso = 0; moduloGrafo.procedimientoVisitado = false;
}

function comprometerGrafo(grafo, mensaje, invalidar) {
  const comprobacion = validarGrafoModulo(grafo, moduloGrafo.modulo);
  if (!comprobacion.ok) {
    const guia = comprobacion.error === 'Hay una arista duplicada entre los mismos nodos.'
      ? ' Elige otra pareja o abre «Editar una conexión existente» para cambiar su peso.' : '';
    notificar(comprobacion.error + guia, 'error'); return false;
  }
  const nombres = validarNombresEditadosGrafo(moduloGrafo.grafo, comprobacion.grafo);
  if (!nombres.ok) { notificar(nombres.error, 'error'); return false; }
  const cambioMatematico = firmaCalculoGrafo(moduloGrafo.grafo) !== firmaCalculoGrafo(comprobacion.grafo);
  guardarHistoriaGrafo();
  moduloGrafo.grafo = comprobacion.grafo;
  if (cambioMatematico) invalidarResultadoGrafo('Cambiaste puntos, conexiones o pesos.');
  else {
    moduloGrafo.revision++;
    moduloGrafo.preparando = false;
    if (moduloGrafo.resultado) moduloGrafo.resultado.grafo = copiarGrafoModulo(grafo);
  }
  if (!grafo.nodos.some(n => n.id === moduloGrafo.origen)) moduloGrafo.origen = grafo.nodos[0] ? grafo.nodos[0].id : null;
  if (!grafo.nodos.some(n => n.id === moduloGrafo.destino)) moduloGrafo.destino = null;
  if (!grafo.nodos.some(n => n.id === moduloGrafo.conexionDesde)) moduloGrafo.conexionDesde = null;
  moduloGrafo.seleccion = null;
  actualizarModuloGrafo(); guardarModuloGrafo();
  if (mensaje) notificar(mensaje, 'ok');
  return true;
}

function deshacerModuloGrafo(rehacer) {
  const desde = rehacer ? moduloGrafo.historial.futuro : moduloGrafo.historial.pasado;
  const hacia = rehacer ? moduloGrafo.historial.pasado : moduloGrafo.historial.futuro;
  if (!desde.length) return;
  hacia.push(serializarModuloGrafo());
  aplicarDocumentoModuloGrafo(desde.pop(), true);
}

function siguienteIdModuloGrafo(grafo, prefijo) {
  return siguienteIdGrafoModulo(grafo, prefijo);
}

function validarPesoEditorGrafo(texto) {
  return validarPesoGrafoModulo(texto, moduloGrafo.modulo);
}

function cambiarVistaModuloGrafo(vista) {
  if (vista === 'procedimiento' && moduloGrafo.resultado) moduloGrafo.procedimientoVisitado = true;
  moduloGrafo.conexionDesde = null;
  detenerReproduccionGrafo(); moduloGrafo.vista = vista;
  actualizarModuloGrafo(); guardarModuloGrafo();
  enfocarEtapaModuloGrafo();
}

function enfocarEtapaModuloGrafo() {
  const destino = elementoGrafo(moduloGrafo.vista === 'configuracion' ? 'tituloConfigGrafo' : 'tituloEtapaGrafo');
  destino.setAttribute('tabindex', '-1');
  destino.focus({ preventScroll: true });
  destino.scrollIntoView({ block: 'start', behavior: 'instant' });
}

async function resolverModuloGrafo() {
  if (moduloGrafo.preparando) return;
  detenerReproduccionGrafo();
  const g = copiarGrafoModulo(moduloGrafo.grafo);
  const origen = moduloGrafo.origen, objetivo = moduloGrafo.objetivo;
  const revision = ++moduloGrafo.revision;
  moduloGrafo.preparando = true; actualizarModuloGrafo();
  // Se presenta el estado de preparación y se admite cancelar o editar antes de resolver.
  await new Promise(resolve => setTimeout(resolve, 0));
  if (revision !== moduloGrafo.revision) return;
  const inicio = performance.now();
  try {
    const resultado = esDijkstraModulo
      ? (objetivo === 'max' ? resolverCaminoMaximoDAG(g, origen) : resolverDijkstraGrafo(g, origen))
      : resolverKruskalGrafo(g, objetivo);
    if (revision !== moduloGrafo.revision) return;
    moduloGrafo.resultado = resultado; moduloGrafo.pendiente = ''; moduloGrafo.procedimientoVisitado = false; moduloGrafo.paso = 0; moduloGrafo.vista = 'resultado';
    moduloGrafo.tiempoCalculo = performance.now() - inicio;
    notificar('Resultado calculado. Puedes consultar el procedimiento bajo demanda.', 'ok');
  } catch (error) { notificar(error.message, 'error'); }
  moduloGrafo.preparando = false; actualizarModuloGrafo(); guardarModuloGrafo();
  if (moduloGrafo.resultado) enfocarEtapaModuloGrafo();
}

function pasoVisibleModuloGrafo() {
  return moduloGrafo.resultado ? moduloGrafo.resultado.pasos[moduloGrafo.paso] || null : null;
}

function detenerReproduccionGrafo() {
  clearInterval(moduloGrafo.intervalo); moduloGrafo.intervalo = null; moduloGrafo.reproduciendo = false;
}

function moverPasoModuloGrafo(delta) {
  if (!moduloGrafo.resultado) return;
  moduloGrafo.paso = limitar(moduloGrafo.paso + delta, 0, Math.max(0, moduloGrafo.resultado.pasos.length - 1));
  if (moduloGrafo.paso === moduloGrafo.resultado.pasos.length - 1) detenerReproduccionGrafo();
  actualizarModuloGrafo(); guardarModuloGrafo();
}

function reproducirModuloGrafo() {
  if (moduloGrafo.reproduciendo) { detenerReproduccionGrafo(); actualizarModuloGrafo(); return; }
  if (!moduloGrafo.resultado || !moduloGrafo.resultado.pasos.length) return;
  if (moduloGrafo.paso >= moduloGrafo.resultado.pasos.length - 1) moduloGrafo.paso = 0;
  moduloGrafo.reproduciendo = true;
  moduloGrafo.intervalo = setInterval(() => {
    if (moduloGrafo.paso >= moduloGrafo.resultado.pasos.length - 1) { detenerReproduccionGrafo(); actualizarModuloGrafo(); return; }
    moverPasoModuloGrafo(1);
  }, Number(elementoGrafo('velocidadGrafo').value));
  actualizarModuloGrafo();
}

function distanciaTextoGrafo(valor) { return valor === -Infinity ? '−∞' : Number.isFinite(valor) ? String(valor) : '∞'; }
function componentesTextoGrafo(componentes) { return componentes.map(c => '{' + c.map(nombreNodoGrafo).join(', ') + '}').join(' · '); }

function renderizarProcedimientoGrafo() {
  const resultado = moduloGrafo.resultado, paso = pasoVisibleModuloGrafo();
  const tabla = elementoGrafo('tablaEstadoGrafo');
  tabla.replaceChildren();
  const sinDatos = !resultado;
  elementoGrafo('contadorPasosGrafo').textContent = resultado && resultado.pasos.length ? 'Paso ' + (moduloGrafo.paso + 1) + ' de ' + resultado.pasos.length : 'Sin pasos para recorrer';
  elementoGrafo('progresoPasosGrafo').max = Math.max(1, resultado ? resultado.pasos.length : 0);
  elementoGrafo('progresoPasosGrafo').value = resultado && resultado.pasos.length ? moduloGrafo.paso + 1 : 0;
  ['btnAnteriorGrafo', 'btnSiguienteGrafo', 'btnReproducirGrafo', 'btnReiniciarGrafo', 'btnUltimoGrafo'].forEach(id => { elementoGrafo(id).disabled = sinDatos || !resultado.pasos.length; });
  elementoGrafo('btnAnteriorGrafo').disabled = sinDatos || moduloGrafo.paso === 0;
  elementoGrafo('btnSiguienteGrafo').disabled = sinDatos || moduloGrafo.paso >= resultado.pasos.length - 1;
  elementoGrafo('btnReproducirGrafo').textContent = moduloGrafo.reproduciendo ? 'Pausar' : 'Reproducir';
  elementoGrafo('btnReproducirGrafo').setAttribute('aria-pressed', String(moduloGrafo.reproduciendo));
  const explicacion = elementoGrafo('explicacionPasoGrafo'), detalle = elementoGrafo('detallePasoGrafo');
  detalle.replaceChildren();
  elementoGrafo('btnVerResultadoGrafo').textContent = sinDatos ? (moduloGrafo.pendiente ? 'Recalcular →' : 'Calcular →') : 'Ver resultado →';
  elementoGrafo('btnVerResultadoGrafo').disabled = sinDatos && (!moduloGrafo.grafo.nodos.length || (esDijkstraModulo && !moduloGrafo.origen));
  if (sinDatos) { explicacion.textContent = moduloGrafo.pendiente ? moduloGrafo.pendiente + ' Pulsa «Recalcular» junto al grafo para consultar los pasos actuales.' : 'Prepara el grafo y calcula con el botón junto al dibujo. Después podrás consultar aquí cada decisión.'; return; }
  if (esDijkstraModulo) {
    if (paso.tipo === 'relajacion') {
      const arista = moduloGrafo.grafo.conexiones.find(c => c.id === paso.arista);
      const maximo = moduloGrafo.objetivo === 'max';
      explicacion.textContent = 'Desde ' + nombreNodoGrafo(paso.desde) + ' hasta ' + nombreNodoGrafo(paso.hacia) + ': valor conocido ' + distanciaTextoGrafo(paso.distancias[paso.desde]) + ' + peso ' + arista.valor + ' = ' + paso.candidata + '. ' +
        (paso.mejora ? 'Mejora de ' + distanciaTextoGrafo(paso.anterior) + ' a ' + paso.candidata + '; el vértice anterior en este camino ahora es ' + nombreNodoGrafo(paso.desde) + '.' : 'No mejora el valor ' + distanciaTextoGrafo(paso.anterior) + '; se conserva el camino elegido.');
      detalle.textContent = 'Comparación: ' + paso.candidata + (maximo ? ' > ' : ' < ') + distanciaTextoGrafo(paso.anterior) + ' → ' + (paso.mejora ? 'sí' : 'no') + '. ';
    } else if (paso.tipo === 'seleccion') {
      explicacion.textContent = moduloGrafo.objetivo === 'max'
        ? 'Procesamos ' + nombreNodoGrafo(paso.actual) + ' según el orden topológico. Todos sus predecesores ya se revisaron; ahora relajamos sus conexiones salientes.'
        : 'Elegimos ' + nombreNodoGrafo(paso.actual) + ', el vértice pendiente con menor distancia (' + distanciaTextoGrafo(paso.distancias[paso.actual]) + '). Su distancia ya es definitiva; ahora revisaremos sus conexiones.';
      if (!Number.isFinite(paso.distancias[paso.actual])) explicacion.textContent = 'Procesamos ' + nombreNodoGrafo(paso.actual) + ' en orden topológico. Sin camino desde ' + nombreNodoGrafo(resultado.origen) + '; este nodo no propaga valores. Procesado no significa alcanzable.';
    } else if (paso.tipo === 'inicio') {
      explicacion.textContent = moduloGrafo.objetivo === 'max'
        ? 'Comenzamos en ' + nombreNodoGrafo(resultado.origen) + ' con valor 0. Los demás tienen −∞ hasta encontrar un camino. El procesamiento sigue el orden topológico: ' + resultado.ordenTopologico.map(nombreNodoGrafo).join(' → ') + '.'
        : 'Comenzamos en ' + nombreNodoGrafo(resultado.origen) + ' con distancia 0. Los demás tienen ∞ porque todavía no conocemos un camino hasta ellos.';
    } else {
      explicacion.textContent = moduloGrafo.objetivo === 'max'
        ? 'Orden topológico terminado. Los vértices que conservan −∞ no son alcanzables desde ' + nombreNodoGrafo(resultado.origen) + '.'
        : 'Recorrido terminado: ya no quedan vértices alcanzables por revisar. Los que conservan ∞ están sin camino desde ' + nombreNodoGrafo(resultado.origen) + '.';
    }
    const pendientes = paso.pendientes.filter(id => paso.tipo !== 'final' || Number.isFinite(paso.distancias[id]));
    detalle.textContent += (moduloGrafo.objetivo === 'max' ? 'Por procesar en orden topológico: ' : 'Por revisar: ') + (pendientes.map(id => nombreNodoGrafo(id) + ' (' + distanciaTextoGrafo(paso.distancias[id]) + ')').join(', ') || 'ninguno') + '. ' +
      (moduloGrafo.objetivo === 'max' ? 'La ausencia de ciclos permite usar un orden topológico para maximizar.' : 'Se busca el menor recorriendo esta lista; no se utiliza una cola de prioridad.');
    tabla.innerHTML = '<caption class="sr-only">Valores y predecesores en este paso</caption><thead><tr><th scope="col">Vértice</th><th scope="col">' + (moduloGrafo.objetivo === 'max' ? 'Mejor valor conocido' : 'Mejor distancia conocida') + '</th><th scope="col">Predecesor</th><th scope="col">Estado</th></tr></thead>';
    const cuerpo = document.createElement('tbody');
    moduloGrafo.grafo.nodos.forEach(n => {
      const fila = document.createElement('tr');
      const inalcanzableConfirmado = paso.tipo === 'final' || moduloGrafo.objetivo === 'max' && paso.finalizados.includes(n.id);
      const estado = !Number.isFinite(paso.distancias[n.id]) ? (inalcanzableConfirmado ? 'Sin camino desde ' + nombreNodoGrafo(resultado.origen) : 'Aún sin descubrir') : paso.finalizados.includes(n.id) ? '✓ Valor definitivo' : (moduloGrafo.objetivo === 'max' ? 'Valor provisional' : 'Distancia provisional');
      [nombreNodoGrafo(n.id), distanciaTextoGrafo(paso.distancias[n.id]), paso.predecesores[n.id] ? nombreNodoGrafo(paso.predecesores[n.id].nodo) : '—', estado].forEach(texto => { const celda = document.createElement('td'); celda.textContent = texto; fila.appendChild(celda); });
      if (paso.actual === n.id) fila.classList.add('gm-fila-actual');
      cuerpo.appendChild(fila);
    }); tabla.appendChild(cuerpo);
  } else {
    explicacion.textContent = paso ? textoAristaGrafo(paso.arista) + ': ' + (paso.aceptada ? '✓ Aceptada: une dos grupos distintos.' : '× Descartada. Sus extremos ya están en el mismo grupo; añadirla formaría un ciclo.') : 'No hay aristas que examinar. Cada vértice permanece como un grupo separado; el peso total es 0.';
    detalle.textContent = paso ? 'Grupos antes: ' + componentesTextoGrafo(paso.componentesAntes) + '. Grupos después: ' + componentesTextoGrafo(paso.componentesDespues) + '. Conexiones aceptadas: ' + (paso.elegidas.map(textoAristaGrafo).join('; ') || 'ninguna todavía') + '. Peso acumulado: ' + paso.total + '.' : 'Grupos: ' + componentesTextoGrafo(resultado.componentes) + '. Peso acumulado: 0.';
    if (paso) detalle.textContent += ' Conexiones elegidas: ' + paso.elegidas.length + '. Conexión ' + (moduloGrafo.paso + 1) + ' de ' + resultado.pasos.length + '.';
    if (paso && paso.elegidas.length === resultado.grafo.nodos.length - resultado.componentes.length && moduloGrafo.paso < resultado.pasos.length - 1) {
      detalle.textContent += ' La red ya está completa; los pasos restantes revisan conexiones descartadas por ciclo.';
      elementoGrafo('btnVerResultadoGrafo').textContent = 'Ir al resultado →';
    }
    tabla.innerHTML = '<caption>' + (moduloGrafo.objetivo === 'min' ? 'Mínimo: revisamos de menor a mayor peso.' : 'Máximo: revisamos de mayor a menor peso.') + ' Con igual peso se conserva el orden original.</caption><thead><tr><th scope="col">Orden</th><th scope="col">Arista y peso</th><th scope="col">Decisión</th></tr></thead>';
    const cuerpo = document.createElement('tbody');
    resultado.ordenadas.forEach((id, indice) => {
      const fila = document.createElement('tr');
      [String(indice + 1), textoAristaGrafo(id), indice <= moduloGrafo.paso ? (resultado.pasos[indice].aceptada ? '✓ Aceptada' : '× Ciclo') : 'Pendiente'].forEach(texto => { const celda = document.createElement('td'); celda.textContent = texto; fila.appendChild(celda); });
      if (indice === moduloGrafo.paso) { fila.classList.add('gm-fila-actual'); fila.setAttribute('aria-current', 'step'); }
      cuerpo.appendChild(fila);
    }); tabla.appendChild(cuerpo);
    if (moduloGrafo.vista === 'procedimiento') requestAnimationFrame(() => {
      const fila = tabla.querySelector('[aria-current="step"]'), contenedor = tabla.parentElement;
      if (!fila) return;
      const r = fila.getBoundingClientRect(), c = contenedor.getBoundingClientRect();
      if (r.top < c.top) contenedor.scrollTop += r.top - c.top;
      else if (r.bottom > c.bottom) contenedor.scrollTop += r.bottom - c.bottom;
    });
  }
}

function agregarMetricasGrafo(contenedor, datos) {
  const lista = document.createElement('dl'); lista.className = 'gm-metricas';
  datos.forEach(([nombre, valor]) => {
    const grupo = document.createElement('div');
    const etiqueta = document.createElement('dt'); etiqueta.textContent = nombre;
    const cifra = document.createElement('dd'); cifra.textContent = valor;
    grupo.append(etiqueta, cifra); lista.appendChild(grupo);
  });
  contenedor.appendChild(lista);
}

function cambiarConsultaModuloGrafo(campo, valor) {
  if (!['origen', 'destino', 'objetivo'].includes(campo)) return false;
  if (campo === 'objetivo' ? !['min', 'max'].includes(valor) : valor !== null && !moduloGrafo.grafo.nodos.some(n => n.id === valor)) {
    notificar('La selección no es válida. Se conserva el cálculo anterior.', 'error'); actualizarCamposEditorGrafo(); return false;
  }
  if (moduloGrafo[campo] === valor) return true;
  guardarHistoriaGrafo();
  if (campo !== 'destino') invalidarResultadoGrafo(campo === 'origen' ? 'Cambiaste el origen.' : 'Cambiaste el objetivo.');
  moduloGrafo[campo] = valor;
  actualizarModuloGrafo(); guardarModuloGrafo();
  return true;
}

function cambiarDestinoResultadoGrafo(destino) {
  if (destino === moduloGrafo.destino || !cambiarConsultaModuloGrafo('destino', destino)) return;
  const boton = destino === null ? elementoGrafo('btnTodasRutasGrafo') :
    Array.from(elementoGrafo('resultadoGrafo').querySelectorAll('[data-destino-resultado]')).find(b => b.dataset.destinoResultado === destino);
  if (boton) boton.focus({ preventScroll: true });
}

function renderizarResultadoGrafo() {
  const sinCaminoAbierto = elementoGrafo('destinosSinCaminoGrafo')?.open;
  const caja = elementoGrafo('resultadoGrafo'); caja.replaceChildren();
  const titulo = document.createElement('h2'); titulo.id = 'tituloResultadoGrafo'; titulo.textContent = 'Resultado'; caja.appendChild(titulo);
  const r = moduloGrafo.resultado;
  const parrafo = (texto, clase) => { const p = document.createElement('p'); p.textContent = texto; if (clase) p.className = clase; caja.appendChild(p); };
  const avanzar = (texto, vista, id) => {
    const pie = document.createElement('div'); pie.className = 'gm-avance';
    const boton = document.createElement('button'); boton.type = 'button'; boton.id = id; boton.className = 'btn btn-primary'; boton.textContent = texto;
    boton.addEventListener('click', () => cambiarVistaModuloGrafo(vista)); pie.appendChild(boton); caja.appendChild(pie);
  };
  if (!r) {
    parrafo(moduloGrafo.pendiente ? moduloGrafo.pendiente + ' Resultado pendiente. Pulsa «Recalcular» junto al grafo.' : 'Todavía no hay un resultado. Elige los datos y calcula con el botón junto al grafo.');
    const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'btn btn-primary'; boton.id = 'btnConfigurarResultadoGrafo'; boton.textContent = 'Recalcular'; boton.disabled = !moduloGrafo.grafo.nodos.length || (esDijkstraModulo && !moduloGrafo.origen); boton.addEventListener('click', resolverModuloGrafo); caja.append(boton); return;
  }
  if (esDijkstraModulo) {
    const maximo = moduloGrafo.objetivo === 'max';
    const nombreObjetivo = maximo ? 'máximos' : 'mínimos';
    titulo.textContent = 'Tus caminos ' + nombreObjetivo;
    parrafo('Estos son los valores ' + nombreObjetivo + ' desde ' + nombreNodoGrafo(r.origen) + '. ' + (moduloGrafo.destino ? 'El trazo grueso segmentado muestra solo la ruta al destino seleccionado.' : 'El trazo grueso continuo forma el árbol de mejores caminos a todos los puntos alcanzables.'));
    const alcanzables = moduloGrafo.grafo.nodos.filter(n => Number.isFinite(r.distancias[n.id])).length;
    agregarMetricasGrafo(caja, [['Origen', nombreNodoGrafo(r.origen)], ['Otros puntos alcanzables', String(alcanzables - 1)], ['Sin camino', String(moduloGrafo.grafo.nodos.length - alcanzables)]]);
    parrafo('Si hay empates, se muestra el primer camino encontrado según el orden actual; puede haber otras rutas con el mismo peso.');
    const resumenRuta = document.createElement('div'); resumenRuta.className = 'gm-ruta-resultado'; resumenRuta.setAttribute('role', 'status');
    const ruta = moduloGrafo.destino ? reconstruirRutaGrafo(r, moduloGrafo.destino) : null;
    const descripcion = document.createElement('p'); descripcion.className = 'gm-total';
    descripcion.textContent = moduloGrafo.destino
      ? (ruta ? 'Ruta de peso ' + (maximo ? 'máximo' : 'mínimo') + ': ' + ruta.nodos.map(nombreNodoGrafo).join(' → ') + '. Suma de pesos originales: ' + (ruta.conexiones.length ? ruta.conexiones.map(id => r.grafo.conexiones.find(c => c.id === id).valor).join(' + ') + ' = ' : '') + ruta.distancia + '.' : 'Sin camino desde el origen hasta ' + nombreNodoGrafo(moduloGrafo.destino) + '.')
      : '¿Hasta dónde quieres llegar?';
    const ayuda = document.createElement('p'); ayuda.textContent = moduloGrafo.destino
      ? 'El destino seleccionado se destaca en el grafo. Puedes elegir otro sin repetir el cálculo.'
      : 'Selecciona un punto de la lista para ver su ruta en el grafo.';
    resumenRuta.append(descripcion, ayuda); caja.appendChild(resumenRuta);
    if (moduloGrafo.destino) caja.insertBefore(resumenRuta, titulo.nextSibling);
    if (ruta && ruta.conexiones.length) {
      const tramos = document.createElement('ol'); tramos.className = 'gm-tramos-ruta';
      ruta.conexiones.forEach((id, indice) => { const item = document.createElement('li'); const c = r.grafo.conexiones.find(a => a.id === id); item.textContent = nombreNodoGrafo(ruta.nodos[indice]) + ' → ' + nombreNodoGrafo(ruta.nodos[indice + 1]) + ': ' + c.valor; tramos.appendChild(item); });
      resumenRuta.appendChild(tramos);
    }
    if (moduloGrafo.destino) {
      const indice = r.pasos.findLastIndex(p => p.tipo === 'relajacion' && p.hacia === moduloGrafo.destino && p.mejora && Number.isFinite(p.anterior));
      if (indice >= 0) {
        const paso = r.pasos[indice], boton = document.createElement('button'); boton.type = 'button'; boton.id = 'btnDecisionDijkstra'; boton.className = 'btn btn-neutral';
        boton.textContent = 'Ver cómo ' + nombreNodoGrafo(paso.hacia) + ' mejora de ' + paso.anterior + ' a ' + paso.candidata;
        boton.addEventListener('click', () => { moduloGrafo.paso = indice; cambiarVistaModuloGrafo('procedimiento'); }); resumenRuta.append(boton);
      }
    }
    const lista = document.createElement('ul'); lista.className = 'gm-destinos'; lista.setAttribute('aria-label', 'Destinos y valores ' + nombreObjetivo);
    const sinCamino = document.createElement('details'); sinCamino.id = 'destinosSinCaminoGrafo';
    sinCamino.open = Boolean(sinCaminoAbierto || moduloGrafo.destino && !Number.isFinite(r.distancias[moduloGrafo.destino]));
    const resumenSinCamino = document.createElement('summary');
    const listaSinCamino = document.createElement('ul'); listaSinCamino.className = 'gm-destinos';
    sinCamino.append(resumenSinCamino, listaSinCamino);
    const ordenDestinos = [moduloGrafo.grafo.nodos.find(n => n.id === r.origen), ...moduloGrafo.grafo.nodos.filter(n => n.id !== r.origen)];
    ordenDestinos.forEach(n => {
      const item = document.createElement('li');
      const boton = document.createElement('button'); boton.type = 'button'; boton.dataset.destinoResultado = n.id;
      boton.setAttribute('aria-pressed', String(moduloGrafo.destino === n.id));
      const nombre = document.createElement('span'); nombre.textContent = nombreNodoGrafo(n.id);
      const valor = document.createElement('strong'); valor.textContent = Number.isFinite(r.distancias[n.id]) ? String(r.distancias[n.id]) : (maximo ? '−∞' : '∞');
      const nota = document.createElement('small');       nota.textContent = n.id === r.origen ? 'Punto de partida' : Number.isFinite(r.distancias[n.id]) ? 'Ver camino →' : 'Sin camino';
      boton.setAttribute('aria-label', nombreNodoGrafo(n.id) + ': ' + (Number.isFinite(r.distancias[n.id]) ? (maximo ? 'valor máximo ' : 'distancia mínima ') + r.distancias[n.id] + '. Ver ruta.' : 'Sin camino desde ' + nombreNodoGrafo(r.origen) + '.'));
      boton.append(nombre, valor, nota); boton.addEventListener('click', () => cambiarDestinoResultadoGrafo(n.id)); item.appendChild(boton);
      (Number.isFinite(r.distancias[n.id]) ? lista : listaSinCamino).appendChild(item);
    }); caja.appendChild(lista);
    resumenSinCamino.textContent = 'Sin camino desde ' + nombreNodoGrafo(r.origen) + ' (' + listaSinCamino.children.length + ')';
    if (listaSinCamino.children.length) caja.appendChild(sinCamino);
    const todas = document.createElement('button'); todas.type = 'button'; todas.id = 'btnTodasRutasGrafo'; todas.className = 'btn btn-neutral'; todas.textContent = 'Ver árbol de mejores caminos'; todas.setAttribute('aria-pressed', String(moduloGrafo.destino === null));
    todas.addEventListener('click', () => cambiarDestinoResultadoGrafo(null)); caja.appendChild(todas);
    const detalle = document.createElement('details'); detalle.className = 'gm-teoria';
    const cab = document.createElement('summary'); cab.textContent = 'Consultar predecesores y nodos inalcanzables'; detalle.appendChild(cab);
    const predecesores = document.createElement('ul');
    moduloGrafo.grafo.nodos.forEach(n => { const item = document.createElement('li'); item.textContent = nombreNodoGrafo(n.id) + ': ' + (n.id === r.origen ? 'origen, valor 0' : !Number.isFinite(r.distancias[n.id]) ? 'Sin camino desde ' + nombreNodoGrafo(r.origen) : 'predecesor ' + nombreNodoGrafo(r.predecesores[n.id].nodo) + ', valor ' + r.distancias[n.id]); predecesores.appendChild(item); });
    detalle.appendChild(predecesores); caja.appendChild(detalle);
  } else {
    const conectado = r.componentes.length === 1;
    titulo.textContent = (conectado ? 'Árbol' : 'Bosque') + ' de expansión ' + (moduloGrafo.objetivo === 'min' ? 'mínimo' : 'máximo');
    parrafo((conectado ? 'Árbol' : 'Bosque') + ' de expansión de peso ' + (moduloGrafo.objetivo === 'min' ? 'mínimo' : 'máximo') + '. Peso total: ' + r.total, 'gm-total');
    agregarMetricasGrafo(caja, [['Peso total', String(r.total)], ['Conexiones elegidas', String(r.elegidas.length)], ['Grupos conectados', String(r.componentes.length)]]);
    if (!conectado) parrafo('El grafo está desconectado: no existe un árbol que abarque todos los vértices. No se han añadido conexiones.');
    parrafo('Componentes (' + r.componentes.length + '): ' + componentesTextoGrafo(r.componentes) + '. Aristas elegidas: ' + r.elegidas.length + ' = V − C = ' + moduloGrafo.grafo.nodos.length + ' − ' + r.componentes.length + '.');
    r.componentes.forEach((grupo, i) => {
      const conexiones = r.grafo.conexiones.filter(c => r.elegidas.includes(c.id) && grupo.includes(c.desde) && grupo.includes(c.hacia));
      parrafo('Grupo ' + (i + 1) + ': ' + grupo.map(nombreNodoGrafo).join(', ') + ' · Conexiones elegidas: ' + conexiones.length + ' · Subtotal: ' + conexiones.reduce((s, c) => s + c.valor, 0) + '.');
    });
    const aislados = moduloGrafo.grafo.nodos.filter(n => !moduloGrafo.grafo.conexiones.some(c => c.desde === n.id || c.hacia === n.id));
    if (aislados.length) parrafo('Vértices aislados: ' + aislados.map(n => nombreNodoGrafo(n.id)).join(', ') + '.');
    const lista = document.createElement('ul'); lista.className = 'gm-conexiones-elegidas'; r.elegidas.forEach(id => { const item = document.createElement('li'); item.textContent = '✓ ' + textoAristaGrafo(id); lista.appendChild(item); }); caja.appendChild(lista);
    const rechazadas = r.pasos.filter(p => !p.aceptada);
    const detalle = document.createElement('details'); detalle.className = 'gm-teoria';
    const cab = document.createElement('summary'); cab.textContent = 'Aristas descartadas por ciclo (' + rechazadas.length + ')'; detalle.appendChild(cab);
    const listaRechazadas = document.createElement('ul');
    rechazadas.forEach(paso => { const item = document.createElement('li'); item.textContent = '× ' + textoAristaGrafo(paso.arista) + '. Sus extremos ya estaban unidos por ' + componentesTextoGrafo(paso.componentesAntes.filter(c => c.includes(r.grafo.conexiones.find(a => a.id === paso.arista).desde))) + '.'; listaRechazadas.appendChild(item); });
    if (!rechazadas.length) { const item = document.createElement('li'); item.textContent = 'Ninguna conexión se descartó por ciclo.'; listaRechazadas.appendChild(item); }
    detalle.appendChild(listaRechazadas); caja.appendChild(detalle);
    parrafo('El total es la suma de estas conexiones. Si hay empates, otras elecciones pueden conseguir el mismo total.');
  }
  avanzar('← Revisar el procedimiento', 'procedimiento', 'btnRevisarProcedimiento');
}

function actualizarModuloGrafo() {
  actualizarCamposEditorGrafo();
  const etapas = ['grafo', 'configuracion', 'procedimiento', 'resultado'];
  document.querySelectorAll('[data-vista-grafo]').forEach(b => { const actual = b.dataset.vistaGrafo === moduloGrafo.vista; b.classList.toggle('activo', actual); b.classList.toggle('completo', b.dataset.vistaGrafo === 'procedimiento' ? moduloGrafo.procedimientoVisitado && !actual : etapas.indexOf(b.dataset.vistaGrafo) < etapas.indexOf(moduloGrafo.vista)); if (actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  elementoGrafo('panelEditorGrafo').hidden = moduloGrafo.vista !== 'grafo';
  elementoGrafo('panelConfigGrafo').hidden = moduloGrafo.vista !== 'configuracion';
  elementoGrafo('distribucionGrafo').dataset.vista = moduloGrafo.vista;
  elementoGrafo('procedimientoGrafo').hidden = moduloGrafo.vista !== 'procedimiento';
  elementoGrafo('explicacionPasoGrafo').hidden = moduloGrafo.vista !== 'procedimiento';
  elementoGrafo('editorModuloGrafo').querySelector('.gm-cinta').hidden = moduloGrafo.vista !== 'procedimiento';
  elementoGrafo('resultadoGrafo').hidden = moduloGrafo.vista !== 'resultado';
  elementoGrafo('herramientasGrafo').hidden = moduloGrafo.vista !== 'grafo';
  const edicion = elementoGrafo('edicionJuntoGrafo');
  if (edicion.dataset.vista !== moduloGrafo.vista) { edicion.open = moduloGrafo.vista === 'grafo'; edicion.dataset.vista = moduloGrafo.vista; }
  elementoGrafo('btnDeshacerGrafo').disabled = !moduloGrafo.historial.pasado.length;
  elementoGrafo('btnRehacerGrafo').disabled = !moduloGrafo.historial.futuro.length;
  elementoGrafo('btnResolverGrafo').disabled = moduloGrafo.preparando || !moduloGrafo.grafo.nodos.length || (esDijkstraModulo && !moduloGrafo.origen);
  if (esDijkstraModulo) elementoGrafo('btnResolverGrafo').textContent = moduloGrafo.objetivo === 'max' ? 'Encontrar caminos máximos (DAG)' : 'Encontrar caminos mínimos';
  if (moduloGrafo.pendiente) elementoGrafo('btnResolverGrafo').textContent = 'Recalcular ' + (moduloGrafo.objetivo === 'max' ? 'máximo' : 'mínimo');
  elementoGrafo('btnContinuarGrafo').disabled = !moduloGrafo.grafo.nodos.length;
  elementoGrafo('btnCrearArista').disabled = moduloGrafo.grafo.nodos.length < 2;
  elementoGrafo('ayudaCrearArista').textContent = moduloGrafo.grafo.nodos.length < 2 ? 'Primero crea dos vértices para poder conectarlos.' : 'Elige dos vértices distintos y escribe el peso de su conexión.';
  elementoGrafo('btnCancelarCalculoGrafo').hidden = !moduloGrafo.preparando;
  elementoGrafo('estadoCalculoGrafo').dataset.estado = moduloGrafo.preparando ? 'preparando' : moduloGrafo.resultado ? 'listo' : moduloGrafo.pendiente ? 'pendiente' : 'edicion';
  elementoGrafo('resumenConfigGrafo').textContent = !moduloGrafo.grafo.nodos.length ? 'Añade al menos un punto o carga un ejemplo para comenzar.' : esDijkstraModulo
    ? (moduloGrafo.origen ? 'Saldrás de ' + nombreNodoGrafo(moduloGrafo.origen) + ' y verás los valores ' + (moduloGrafo.objetivo === 'max' ? 'máximos' : 'mínimos') + (moduloGrafo.destino ? ' y la ruta hasta ' + nombreNodoGrafo(moduloGrafo.destino) + '.' : ' a todos los puntos.') : 'Elige el punto de origen y el objetivo para calcular.')
    : 'Buscaremos las conexiones con ' + (moduloGrafo.objetivo === 'min' ? 'el menor' : 'el mayor') + ' peso total, sin formar ciclos.';
  elementoGrafo('estadoCalculoGrafo').textContent = moduloGrafo.preparando ? 'Preparando cálculo… puedes cancelar o editar los datos.' : moduloGrafo.resultado ? '✓ Resultado actualizado. Paso a paso es una consulta opcional' + (esDijkstraModulo ? '; puedes elegir otro destino sin recalcular.' : '.') : moduloGrafo.pendiente ? moduloGrafo.pendiente + ' Resultado pendiente de recalcular. Usa «Recalcular» junto al grafo.' : 'Edición inicial. Prepara tus datos y calcula con el botón junto al grafo.';
  const guias = {
    grafo: ['1. Prepara tu grafo', moduloGrafo.grafo.nodos.length ? 'Añade o edita conexiones y después pulsa «Continuar» para elegir ' + (esDijkstraModulo ? 'el origen.' : 'el objetivo.') : 'Para empezar, carga un ejemplo o crea tus propios vértices y conexiones. Los datos actuales solo pertenecen a este módulo.'],
    configuracion: ['2. ' + (esDijkstraModulo ? 'Elige origen y objetivo' : 'Elige el objetivo'), moduloGrafo.grafo.nodos.length ? 'Revisa las opciones y pulsa «Calcular». Después podrás seguir cada decisión junto al grafo.' : 'El grafo está vacío. Vuelve a la etapa 1 para crear vértices o cargar un ejemplo.'],
    procedimiento: ['3. Sigue cada decisión', moduloGrafo.resultado ? 'Usa «Siguiente» o «Reproducir» y observa la conexión resaltada. La explicación y la tabla corresponden al paso actual.' : 'Usa «Calcular» o «Recalcular» junto al grafo para obtener los pasos de los datos actuales.'],
    resultado: ['4. Comprueba el resultado', esDijkstraModulo ? 'Consulta todos los valores óptimos y, si elegiste un destino, su ruta completa.' : 'Revisa las conexiones elegidas, los grupos conectados y el peso total.']
  };
  elementoGrafo('tituloEtapaGrafo').textContent = guias[moduloGrafo.vista][0];
  elementoGrafo('descripcionEtapaGrafo').textContent = guias[moduloGrafo.vista][1];
  dibujarEditorGrafo(); renderizarProcedimientoGrafo(); renderizarResultadoGrafo();
  renderizarConsultaJuntoGrafo();
  if (esDijkstraModulo) renderizarGuiaEjemploDijkstra();
}

function renderizarGuiaEjemploDijkstra() {
  const guia = elementoGrafo('guiaLecturaEjemploGrafo');
  const firma = g => JSON.stringify([g.dirigido, g.nodos.map(n => [n.id, n.nombre]), g.conexiones.map(c => [c.id, c.desde, c.hacia, c.valor])]);
  const actual = firma(moduloGrafo.grafo);
  const ejemplo = catalogoEjemplosGrafo('dijkstra').find(e => firma(crearEjemploGrafo('dijkstra', e.id)) === actual);
  guia.replaceChildren(); guia.hidden = !ejemplo || moduloGrafo.vista === 'grafo';
  if (guia.hidden) return;
  const titulo = document.createElement('strong'); titulo.textContent = 'Qué observar · ' + ejemplo.nombre.split(' · ')[1];
  const lectura = document.createElement('p');
  lectura.textContent = moduloGrafo.origen === ejemplo.origen && moduloGrafo.objetivo === 'min' ? ejemplo.observar
    : 'Has cambiado la consulta. La consigna del ejemplo usa Mínimo (Dijkstra) desde ' + nombreNodoGrafo(ejemplo.origen) + ' hasta ' + nombreNodoGrafo(ejemplo.destino) + '; el cálculo corresponde al origen y objetivo que tienes seleccionados.';
  guia.append(titulo, lectura);
}

function renderizarConsultaJuntoGrafo() {
  const caja = elementoGrafo('consultaRutaGrafo'); caja.replaceChildren(); caja.hidden = moduloGrafo.vista !== 'resultado' || !moduloGrafo.resultado;
  if (esDijkstraModulo) {
    const claves = elementoGrafo('editorModuloGrafo').querySelectorAll('.gm-leyenda > span');
    claves[0].hidden = !caja.hidden && !!moduloGrafo.destino;
    claves[3].hidden = caja.hidden || !moduloGrafo.destino;
    claves[4].hidden = caja.hidden;
  }
  if (caja.hidden) return;
  const r = moduloGrafo.resultado, texto = document.createElement('p');
  if (esDijkstraModulo) {
    const ruta = moduloGrafo.destino ? reconstruirRutaGrafo(r, moduloGrafo.destino) : null;
    texto.textContent = moduloGrafo.destino ? 'Vista activa: ruta al destino · ' + (ruta ? ruta.nodos.map(nombreNodoGrafo).join(' → ') + '. ' + (ruta.conexiones.map(id => r.grafo.conexiones.find(c => c.id === id).valor).join(' + ') || '0') + ' = ' + ruta.distancia + '. Peso total: ' + ruta.distancia + '.' : 'Sin camino desde ' + nombreNodoGrafo(r.origen) + ' hasta ' + nombreNodoGrafo(moduloGrafo.destino) + '.') : 'Vista activa: árbol de mejores caminos desde ' + nombreNodoGrafo(r.origen) + '. Consulta todos los destinos; los inalcanzables se agrupan aparte.';
    texto.textContent += ' Objetivo: ' + (r.objetivo === 'max' ? 'Máximo (orden topológico, solo DAG).' : 'Mínimo (Dijkstra).');
    caja.append(texto);
    if (moduloGrafo.destino) {
      const volver = document.createElement('button'); volver.type = 'button'; volver.className = 'btn btn-neutral'; volver.textContent = 'Volver al árbol y todos los destinos'; volver.addEventListener('click', () => cambiarDestinoResultadoGrafo(null)); caja.append(volver);
    }
  } else {
    texto.textContent = (r.componentes.length === 1 ? 'Árbol' : 'Bosque') + ' ' + (r.objetivo === 'max' ? 'máximo' : 'mínimo') + ' · Peso total: ' + r.total + ' · ' + r.elegidas.length + ' conexiones elegidas. Trazo grueso: elegidas; trazo discontinuo: descartadas por ciclo.'; caja.append(texto);
  }
}

function descargarJsonModuloGrafo() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(serializarModuloGrafo(), null, 2)], { type: 'application/json' }));
  const enlace = document.createElement('a'); enlace.href = url; enlace.download = moduloGrafo.modulo + '.json'; enlace.click(); URL.revokeObjectURL(url);
}

async function convertirModoGrafo() {
  const dirigido = elementoGrafo('selectorModoGrafo').value === 'dirigido';
  if (dirigido === moduloGrafo.grafo.dirigido) return;
  const revision = moduloGrafo.revision;
  const grafo = copiarGrafoModulo(moduloGrafo.grafo);
  const confirma = await dialogoConfirmar({ titulo: 'Convertir el grafo', mensaje: dirigido ? 'Cada arista no dirigida se convertirá en dos aristas dirigidas de igual peso. Se invalidará el cálculo. Si se supera el límite de 96 aristas, elimina algunas antes de convertir.' : 'Las aristas opuestas se fusionarán en una arista no dirigida. Resolverás explícitamente cualquier conflicto de pesos. Se invalidará el cálculo.' });
  if (!confirma || revision !== moduloGrafo.revision) { actualizarCamposEditorGrafo(); return; }
  const pesos = Object.create(null);
  if (dirigido) {
    if (grafo.conexiones.length * 2 > GRAFOS_MAX_ARISTAS) { notificar('La conversión superaría 96 aristas.', 'error'); actualizarCamposEditorGrafo(); return; }
  } else {
    const usados = new Set();
    for (const c of grafo.conexiones) {
      if (usados.has(c.id)) continue;
      const opuesta = grafo.conexiones.find(a => a.desde === c.hacia && a.hacia === c.desde);
      if (opuesta && opuesta.valor !== c.valor) {
        const valor = await dialogoPedirTexto({ titulo: 'Resolver pesos opuestos', mensaje: nombreNodoGrafo(c.desde) + ' → ' + nombreNodoGrafo(c.hacia) + ' pesa ' + c.valor + '; la dirección opuesta pesa ' + opuesta.valor + '. Escribe el peso de la arista no dirigida. Cancelar conserva el grafo original.', valor: c.valor, validar: validarPesoEditorGrafo, inputmode: 'numeric' });
        if (valor === undefined || revision !== moduloGrafo.revision) { actualizarCamposEditorGrafo(); return; }
        pesos[c.id] = valor;
      }
      usados.add(c.id); if (opuesta) usados.add(opuesta.id);
    }
  }
  const conversion = convertirDireccionGrafoModulo(grafo, moduloGrafo.modulo, dirigido, pesos);
  if (!conversion.ok) { notificar(conversion.error + ' Se conserva el ejercicio anterior.', 'error'); actualizarCamposEditorGrafo(); return; }
  if (!comprometerGrafo(conversion.grafo, 'Modo convertido de forma explícita.')) actualizarCamposEditorGrafo();
}

function textoAyudaModuloGrafo() {
  return [
    'VIDEO Y PRIMEROS PASOS\nEl botón «Video» abre la presentación explicativa. «Ir al algoritmo» vuelve a tu ejercicio; «No mostrar al entrar» recuerda tu preferencia solo para este módulo. El video necesita internet. En móvil, abre el menú ☰ y usa «Video del módulo» o «Ayuda del módulo». Puedes trabajar sin el video y consultar esta ayuda en cualquier momento.',
    '1) CREA TU GRAFO\nCarga un ejemplo o usa «Crear mi primer punto». Un punto es un vértice; una conexión es una arista. Añade el nombre y pulsa «Añadir» o Enter. Para conectar, elige «Desde», «Hasta» y un peso; pulsa «Conectar» o Enter desde el campo de peso. Se admiten hasta ' + GRAFOS_MAX_NODOS + ' vértices, ' + GRAFOS_MAX_ARISTAS + ' aristas y nombres de hasta ' + MAX_LARGO_NOMBRE + ' caracteres. No se admiten conexiones de un punto consigo mismo ni aristas repetidas.\n' +
      (esDijkstraModulo ? 'Los pesos son enteros entre 0 y ' + MAX_PESO + '. Un peso cero es una conexión real; los negativos no se admiten.' : 'Los pesos son enteros entre 0 y ' + MAX_PESO + ', incluido cero. Se excluyen negativos por política del producto, aunque Kruskal matemáticamente los admite. Las conexiones funcionan en ambos sentidos.'),
    '2) CONFIGURA EL CÁLCULO\n' + (esDijkstraModulo
      ? 'Elige el origen y el objetivo. Mínimo usa Dijkstra y pesos no negativos. Máximo no usa Dijkstra: solo se permite en grafos dirigidos acíclicos (DAG), con orden topológico; si el grafo tiene un ciclo o es no dirigido, se rechaza el cálculo. El destino es opcional y se calculan valores a todos los puntos. En modo dirigido A→B y B→A son aristas diferentes. En no dirigido una arista se recorre en ambos sentidos. Cambiar de modo pide confirmación y resuelve los conflictos de pesos entre conexiones opuestas.'
      : 'Pulsa «Continuar: elegir objetivo». Mínimo busca el menor peso total y Máximo, el mayor, conectando cada grupo sin formar ciclos. El grafo de entrada sí puede tener ciclos: el procedimiento explica qué aristas se descartan. Kruskal usa un grafo no dirigido y no necesita un origen o destino. No calcula rutas mínimas desde un punto.'),
    '3) SIGUE LOS PASOS\nCalcular abre el resultado estático. Pulsa «Revisar el procedimiento» cuando quieras consultar las decisiones. Usa «Anterior», «Siguiente» o, de forma opcional, «Reproducir/Pausar». La barra indica el avance real. «Velocidad y más controles» permite cambiar el ritmo, reiniciar o saltar al último paso. La velocidad no mide el rendimiento del algoritmo.\n' +
      (esDijkstraModulo ? (moduloGrafo.objetivo === 'max'
        ? 'El máximo no usa Dijkstra: procesa los vértices en orden topológico y relaja cada arista una vez. −∞ indica que no hay camino desde el origen.'
        : 'Dijkstra comienza con distancia 0 en el origen y ∞ en los demás. Elige el pendiente con menor distancia y revisa si pasar por él mejora las distancias vecinas.')
        + ' La tabla muestra valores, predecesores (el punto anterior del camino) y estados.' : 'Kruskal ordena las conexiones por peso y acepta una solo cuando une dos grupos separados. Una conexión entre puntos ya unidos se descarta porque formaría un ciclo. La tabla muestra cada decisión y el peso acumulado.') +
      '\nVerde: conexión elegida. Amarillo: elemento del paso actual. Contorno discontinuo: tu selección. La fila destacada corresponde al paso actual.',
    '4) ENTIENDE EL RESULTADO\n' + (esDijkstraModulo
      ? 'Las tarjetas muestran el valor mínimo (Dijkstra) o máximo (solo DAG) desde el origen. Selecciona un destino para ver la ruta, sus tramos y la suma de los pesos originales sin recalcular. El árbol de mejores caminos destaca los predecesores; no enumera todos los caminos posibles. El origen tiene valor 0; ∞ o −∞ indica que no hay camino. Los empates conservan el primer camino encontrado.'
      : 'Verás el peso total, las conexiones elegidas y la cantidad de grupos. Si todos los puntos están conectados, se obtiene un árbol; si hay grupos separados, un bosque. Los puntos aislados se conservan y no se inventan conexiones entre grupos. Se eligen V − C aristas: cantidad de vértices menos cantidad de grupos. Sin aristas, el total es 0. Si hay pesos iguales, otras elecciones pueden dar el mismo total; se conserva el orden original para desempatar.'),
    '5) EDITA Y RECORRE EL GRAFO\n«Crear punto» permite tocar o hacer clic en el fondo; en «Seleccionar / mover», un doble clic en el fondo también crea. «Conectar extremos» pide dos puntos y después el peso; Escape, tocar el fondo o «Cancelar conexión» cancela. Selecciona un elemento y pulsa «Editar selección», o usa las listas de los formularios, para renombrar, cambiar pesos o eliminar. Al borrar un punto se borran sus conexiones. Arrastra puntos con ratón o pantalla táctil; las coordenadas ofrecen una alternativa de teclado. «Desplazar vista» permite arrastrar el lienzo. «Organizar grafo» cambia posiciones solo cuando lo solicitas. «Ver todo» encuadra sin mover los puntos; «Ampliar» conserva selección, posiciones y resultado.\nCambiar conexiones, pesos, modo, origen u objetivo invalida el cálculo. Renombrar o mover puntos conserva el resultado. ' + (esDijkstraModulo ? 'Cambiar solo el destino también conserva el cálculo. ' : '') + 'Deshacer y Rehacer permiten recuperar hasta ' + MAX_ACCIONES_DESHACER + ' cambios.',
    '6) GUARDA Y COMPARTE\nEl ejercicio se guarda automáticamente en este navegador. «Guardar» conserva un trabajo con nombre; «Cargar» abre «Mis trabajos» para cargar, renombrar, eliminar, exportar o importar trabajos. Cargar reemplaza el ejercicio después de confirmar. Dijkstra y Kruskal tienen guardados independientes.\nEn «Más opciones», Exportar/Importar JSON lleva un ejercicio a otro equipo; el archivo se valida antes de reemplazar datos. «PNG», dentro de «Zoom y más», descarga la vista del grafo. Limpiar pide confirmación y se puede deshacer. Borrar los datos del navegador puede borrar tus trabajos: exporta JSON para conservar una copia. Si falla el autoguardado, sigue el aviso visible y exporta tu ejercicio.',
    '7) TECLADO Y AYUDA\nTab recorre los controles. Enter o Espacio seleccionan puntos y conexiones enfocados en el dibujo. Las listas y los campos de posición permiten editar sin arrastrar. Escape cierra la ayuda o el diálogo y devuelve el foco. Los botones «Video» y «Ayuda» pausan la reproducción para conservar el paso que estabas revisando. En el procedimiento, «Imprimir todos los pasos» (en «Velocidad y más controles») o Ctrl+P imprimen la ejecución completa en tema claro y conservan el paso que estabas revisando.'
  ].join('\n\n');
}

function instalarAccionesModuloGrafo() {
  const al = (id, accion) => elementoGrafo(id).addEventListener('click', accion);
  const seleccionado = tipo => {
    if (!moduloGrafo.seleccion || moduloGrafo.seleccion.tipo !== tipo) { notificar('Selecciona primero ' + (tipo === 'nodo' ? 'un vértice.' : 'una arista.'), 'aviso'); return null; }
    return moduloGrafo.seleccion.id;
  };
  al('btnCrearVertice', () => {
    const g = copiarGrafoModulo(moduloGrafo.grafo), nombre = elementoGrafo('nombreVertice').value.trim();
    if (!nombre || nombre.length > MAX_LARGO_NOMBRE) { notificar('Escribe un nombre de 1 a 12 caracteres.', 'error'); return; }
    const i = g.nodos.length, id = siguienteIdModuloGrafo(g, 'n');
    g.nodos.push({ id, nombre, x: 100 + (i % 6) * 160, y: 100 + Math.floor(i / 6) * 120 });
    if (comprometerGrafo(g, 'Punto añadido.')) { elementoGrafo('nombreVertice').value = ''; seleccionarElementoGrafo('nodo', id); elementoGrafo('ajustesVerticeGrafo').open = false; elementoGrafo('nombreVertice').focus({ preventScroll: true }); }
  });
  al('btnRenombrarVertice', () => {
    const id = seleccionado('nodo'); if (!id) return;
    const g = copiarGrafoModulo(moduloGrafo.grafo); g.nodos.find(n => n.id === id).nombre = elementoGrafo('nombreSeleccionado').value.trim();
    if (comprometerGrafo(g, 'Nombre actualizado; el cálculo se conserva.', false)) seleccionarElementoGrafo('nodo', id);
  });
  al('btnMoverVertice', () => {
    const id = seleccionado('nodo'); if (!id) return;
    const g = copiarGrafoModulo(moduloGrafo.grafo);
    Object.assign(g.nodos.find(n => n.id === id), { x: Number(elementoGrafo('posicionNodoX').value), y: Number(elementoGrafo('posicionNodoY').value) });
    if (comprometerGrafo(g, 'Posición actualizada; el cálculo se conserva.', false)) seleccionarElementoGrafo('nodo', id);
  });
  al('btnEliminarVertice', async () => {
    const id = seleccionado('nodo'); if (!id) return;
    const revision = moduloGrafo.revision;
    if (!await dialogoConfirmar({ titulo: 'Eliminar vértice', mensaje: 'También se eliminarán sus aristas. Puedes deshacer esta acción.' }) || revision !== moduloGrafo.revision) return;
    const g = copiarGrafoModulo(moduloGrafo.grafo); g.nodos = g.nodos.filter(n => n.id !== id); g.conexiones = g.conexiones.filter(c => c.desde !== id && c.hacia !== id); comprometerGrafo(g, 'Vértice y aristas relacionadas eliminados.');
  });
  al('btnCrearArista', () => {
    const desde = elementoGrafo('aristaDesde').value, hacia = elementoGrafo('aristaHacia').value;
    if (!desde || !hacia || desde === hacia) {
      notificar(!desde || !hacia ? 'Elige un vértice en «Desde» y otro en «Hasta».' : 'Elige dos vértices diferentes; no se admiten conexiones a sí mismo.', 'error');
      elementoGrafo(!desde ? 'aristaDesde' : 'aristaHacia').focus(); return;
    }
    const peso = validarPesoEditorGrafo(elementoGrafo('pesoArista').value); if (!peso.ok) { notificar(peso.error, 'error'); return; }
    const g = copiarGrafoModulo(moduloGrafo.grafo), id = siguienteIdModuloGrafo(g, 'e');
    g.conexiones.push({ id, desde, hacia, valor: peso.valor });
    if (comprometerGrafo(g, 'Arista creada.')) seleccionarElementoGrafo('arista', id);
  });
  al('btnEditarPeso', () => {
    const id = seleccionado('arista'); if (!id) return;
    const peso = validarPesoEditorGrafo(elementoGrafo('pesoSeleccionado').value); if (!peso.ok) { notificar(peso.error, 'error'); return; }
    const g = copiarGrafoModulo(moduloGrafo.grafo); g.conexiones.find(c => c.id === id).valor = peso.valor;
    if (comprometerGrafo(g, 'Peso actualizado. Calcula de nuevo.')) seleccionarElementoGrafo('arista', id);
  });
  al('btnEliminarArista', () => { const id = seleccionado('arista'); if (!id) return; const g = copiarGrafoModulo(moduloGrafo.grafo); g.conexiones = g.conexiones.filter(c => c.id !== id); comprometerGrafo(g, 'Arista eliminada.'); });
  elementoGrafo('seleccionVertice').addEventListener('change', e => { if (e.target.value) seleccionarElementoGrafo('nodo', e.target.value); else { moduloGrafo.seleccion = null; actualizarCamposEditorGrafo(); dibujarEditorGrafo(); } });
  elementoGrafo('seleccionArista').addEventListener('change', e => { if (e.target.value) seleccionarElementoGrafo('arista', e.target.value); else { moduloGrafo.seleccion = null; actualizarCamposEditorGrafo(); dibujarEditorGrafo(); } });
  elementoGrafo('selectorModoGrafo').addEventListener('change', convertirModoGrafo);
  ['origenGrafo', 'destinoGrafo', 'objetivoGrafo', 'objetivoDijkstra'].forEach(id => elementoGrafo(id).addEventListener('change', e => {
    cambiarConsultaModuloGrafo(id === 'origenGrafo' ? 'origen' : id === 'destinoGrafo' ? 'destino' : 'objetivo', e.target.value || null);
  }));
  document.querySelectorAll('[data-vista-grafo]').forEach(b => b.addEventListener('click', () => cambiarVistaModuloGrafo(b.dataset.vistaGrafo)));
  al('btnContinuarGrafo', () => cambiarVistaModuloGrafo('configuracion'));
  al('btnVolverEditarGrafo', () => cambiarVistaModuloGrafo('grafo'));
  al('btnVerResultadoGrafo', () => moduloGrafo.resultado ? cambiarVistaModuloGrafo('resultado') : resolverModuloGrafo());
  al('btnResolverGrafo', resolverModuloGrafo);
  al('btnCancelarCalculoGrafo', () => { moduloGrafo.revision++; moduloGrafo.preparando = false; actualizarModuloGrafo(); });
  al('btnDeshacerGrafo', () => deshacerModuloGrafo(false)); al('btnRehacerGrafo', () => deshacerModuloGrafo(true));
  async function reemplazarGrafo(grafo, titulo, ejemplo) {
    const revision = moduloGrafo.revision;
    if (moduloGrafo.grafo.nodos.length && !await dialogoConfirmar({ titulo, mensaje: 'Se reemplazarán los datos actuales de este módulo. Puedes deshacerlo después.' })) return;
    if (revision !== moduloGrafo.revision) return;
    if (ejemplo) {
      const datos = catalogoEjemplosGrafo(moduloGrafo.modulo).find(e => e.id === ejemplo);
      aplicarDocumentoModuloGrafo({ version: 1, modulo: moduloGrafo.modulo, grafo, origen: esDijkstraModulo ? datos.origen : null, destino: esDijkstraModulo ? datos.destino : null, objetivo: 'min', vista: 'configuracion' }, true, true);
      ajustarVistaEditorGrafo(); notificar(datos.descripcion, 'ok');
      elementoGrafo('btnResolverGrafo').focus({ preventScroll: true }); elementoGrafo('btnResolverGrafo').scrollIntoView({ block: 'center', behavior: 'instant' });
    } else comprometerGrafo(grafo, 'Datos actualizados.');
  }
  al('btnEjemploGrafo', () => { const id = elementoGrafo('ejemploGrafo').value; reemplazarGrafo(crearEjemploGrafo(moduloGrafo.modulo, id), 'Cargar ejemplo', id); });
  al('btnEjemploRapidoGrafo', () => { const id = catalogoEjemplosGrafo(moduloGrafo.modulo)[0].id; reemplazarGrafo(crearEjemploGrafo(moduloGrafo.modulo, id), 'Cargar ejemplo', id); });
  al('btnCrearPrimerPunto', () => { elementoGrafo('nombreVertice').focus(); elementoGrafo('nombreVertice').scrollIntoView({ block: 'center', behavior: 'instant' }); });
  elementoGrafo('nombreVertice').addEventListener('keydown', evento => { if (evento.key === 'Enter') { evento.preventDefault(); elementoGrafo('btnCrearVertice').click(); } });
  elementoGrafo('pesoArista').addEventListener('keydown', evento => { if (evento.key === 'Enter') { evento.preventDefault(); elementoGrafo('btnCrearArista').click(); } });
  al('btnAleatorioGrafo', () => {
    try { reemplazarGrafo(generarGrafoAleatorio(moduloGrafo.modulo, { cantidad: Number(elementoGrafo('cantidadAleatoriaGrafo').value), aristas: Number(elementoGrafo('aristasAleatoriasGrafo').value), dirigido: moduloGrafo.grafo.dirigido }), 'Generar grafo'); }
    catch (error) { notificar(error.message, 'error'); }
  });
  al('btnLimpiarGrafo', async () => { if (await dialogoConfirmar({ titulo: 'Limpiar grafo', mensaje: 'Se eliminarán los vértices y sus aristas. Esta acción se puede deshacer.', peligro: true })) comprometerGrafo(crearGrafoVacio(moduloGrafo.grafo.dirigido), 'Grafo vacío.'); });
  al('btnImportarGrafo', () => { elementoGrafo('archivoGrafo').value = ''; elementoGrafo('archivoGrafo').click(); });
  elementoGrafo('archivoGrafo').addEventListener('change', evento => {
    const archivo = evento.target.files[0]; if (!archivo) return;
    if (archivo.size > 1024 * 1024) { notificar('El archivo supera 1 MB. Un ejercicio de hasta 24 vértices y 96 aristas debe ocupar menos. El trabajo actual se conserva.', 'error'); return; }
    const revision = moduloGrafo.revision;
    const lector = new FileReader();
    lector.onerror = () => notificar('No se pudo leer el archivo. El trabajo actual se conserva.', 'error');
    lector.onload = async () => {
      try {
        const validacion = validarDocumentoGrafo(JSON.parse(lector.result), moduloGrafo.modulo);
        if (!validacion.ok) throw new Error(validacion.error);
        if (revision !== moduloGrafo.revision) { notificar('La entrada cambió durante la lectura. Vuelve a importar.', 'aviso'); return; }
        if (moduloGrafo.grafo.nodos.length && !await dialogoConfirmar({ titulo: 'Importar grafo', mensaje: 'El archivo es válido. ¿Reemplazar el ejercicio actual? Puedes deshacerlo.' })) return;
        if (revision !== moduloGrafo.revision) return;
        aplicarDocumentoModuloGrafo(validacion.datos, true, true); notificar('Grafo importado.', 'ok');
      } catch (error) { notificar('No se pudo importar: ' + error.message, 'error'); }
    };
    lector.readAsText(archivo);
  });
  al('btnExportarGrafo', descargarJsonModuloGrafo);
  al('btnPngGrafo', () => exportarSvgComoPng(elementoGrafo('svgModuloGrafo'), { nombre: moduloGrafo.modulo }).catch(error => notificar(error.message, 'error')));
  al('btnAnteriorGrafo', () => { detenerReproduccionGrafo(); moverPasoModuloGrafo(-1); });
  al('btnSiguienteGrafo', () => { detenerReproduccionGrafo(); moverPasoModuloGrafo(1); });
  al('btnReiniciarGrafo', () => { detenerReproduccionGrafo(); moduloGrafo.paso = 0; actualizarModuloGrafo(); guardarModuloGrafo(); });
  al('btnUltimoGrafo', () => { detenerReproduccionGrafo(); if (moduloGrafo.resultado) { moduloGrafo.paso = Math.max(0, moduloGrafo.resultado.pasos.length - 1); actualizarModuloGrafo(); guardarModuloGrafo(); } });
  al('btnReproducirGrafo', reproducirModuloGrafo);
  al('btnImprimirGrafo', () => { detenerReproduccionGrafo(); renderizarProcedimientoGrafo(); window.print(); });
  elementoGrafo('velocidadGrafo').addEventListener('change', () => { const activa = moduloGrafo.reproduciendo; detenerReproduccionGrafo(); if (activa) reproducirModuloGrafo(); });
  al('btnAmpliarGrafo', () => { const activo = elementoGrafo('distribucionGrafo').classList.toggle('gm-ampliado'); elementoGrafo('btnAmpliarGrafo').setAttribute('aria-pressed', String(activo)); });
  function vistaSvg() { actualizarVistaEditorGrafo(); }
  function zoom(factor) { const v = moduloGrafo.vistaSvg, ancho = limitar(v.ancho * factor, 100, 1600), escala = ancho / v.ancho; v.x += (v.ancho - ancho) / 2; v.y += (v.alto - v.alto * escala) / 2; v.alto *= escala; v.ancho = ancho; vistaSvg(); }
  al('btnZoomMasGrafo', () => zoom(.8)); al('btnZoomMenosGrafo', () => zoom(1.25));
  al('btnAjustarGrafo', ajustarVistaEditorGrafo);
  document.querySelectorAll('[data-pan-grafo]').forEach(b => b.addEventListener('click', () => { const v = moduloGrafo.vistaSvg, d = b.dataset.panGrafo; v.x += d === 'derecha' ? 60 : d === 'izquierda' ? -60 : 0; v.y += d === 'abajo' ? 60 : d === 'arriba' ? -60 : 0; vistaSvg(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { detenerReproduccionGrafo(); actualizarModuloGrafo(); } });
  al('btnVideoModulo', () => { detenerReproduccionGrafo(); renderizarProcedimientoGrafo(); requestAnimationFrame(dibujarEditorGrafo); });
  al('btnAyuda', () => {
    detenerReproduccionGrafo(); renderizarProcedimientoGrafo();
    dialogoInformar({ titulo: 'Ayuda: ' + (esDijkstraModulo ? 'Dijkstra' : 'Kruskal'), ancho: true, mensaje: textoAyudaModuloGrafo() + '\n\n' + TEXTO_AYUDA_RECUPERACION });
  });
}

construirInterfazModuloGrafo();
instalarAccionesModuloGrafo();
let originalGuardadoGrafo = null;
try {
  const guardado = localStorage.getItem(esDijkstraModulo ? DIJKSTRA_STORAGE_KEY : KRUSKAL_STORAGE_KEY);
  originalGuardadoGrafo = guardado;
  if (guardado) aplicarDocumentoModuloGrafo(JSON.parse(guardado)); else actualizarModuloGrafo();
} catch (error) {
  if (originalGuardadoGrafo !== null && typeof protegerGuardadoIncompatible === 'function') {
    protegerGuardadoIncompatible(esDijkstraModulo ? DIJKSTRA_STORAGE_KEY : KRUSKAL_STORAGE_KEY, originalGuardadoGrafo, error.message);
  }
  actualizarModuloGrafo(); notificar('No se pudo restaurar el ejercicio: ' + error.message + '. Conserva el original desde el aviso de recuperación.', 'aviso');
}
configurarVistaEditorGrafo();

registrarImpresionPasos({
  titulo: (esDijkstraModulo ? 'Dijkstra' : 'Kruskal') + ' · procedimiento real',
  paneles: () => [elementoGrafo('svgModuloGrafo').parentElement, elementoGrafo('explicacionPasoGrafo'), elementoGrafo('detallePasoGrafo'), elementoGrafo('tablaEstadoGrafo')],
  total: () => moduloGrafo.resultado ? moduloGrafo.resultado.pasos.length : 0,
  actual: () => moduloGrafo.paso,
  ir: i => {
    detenerReproduccionGrafo(); moduloGrafo.paso = i;
    dibujarEditorGrafo(); renderizarProcedimientoGrafo();
  },
  activo: () => moduloGrafo.vista === 'procedimiento'
});
