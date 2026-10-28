/* Controlador compartido. Cada página crea un único estado y clave independientes. */
'use strict';

const moduloGrafo = {
  modulo: document.body.dataset.modulo,
  grafo: crearGrafoVacio(document.body.dataset.modulo === 'dijkstra'),
  origen: null, destino: null, objetivo: 'min', vista: 'grafo', paso: 0,
  resultado: null, seleccion: null, historial: { pasado: [], futuro: [] },
  reproduciendo: false, intervalo: null, revision: 0, preparando: false,
  vistaSvg: { x: 0, y: 0, ancho: 1000, alto: 600 }
};
const esDijkstraModulo = moduloGrafo.modulo === 'dijkstra';
const elementoGrafo = id => document.getElementById(id);

function construirInterfazModuloGrafo() {
  elementoGrafo('editorModuloGrafo').innerHTML = `
    <nav class="gm-flujo" aria-label="Etapas del módulo"><ol class="pasos">
      <li><button type="button" class="paso" data-vista-grafo="grafo" aria-label="Etapa 1: Grafo y datos"><span class="paso__numero">1</span><span class="paso__texto">Crea tu grafo<small>Puntos y conexiones</small></span></button></li>
      <li><button type="button" class="paso" data-vista-grafo="configuracion" aria-label="Etapa 2: ${esDijkstraModulo ? 'Origen y destino' : 'Objetivo'}"><span class="paso__numero">2</span><span class="paso__texto">${esDijkstraModulo ? 'Elige el origen' : 'Elige el objetivo'}<small>${esDijkstraModulo ? '¿Desde dónde sales?' : '¿Mínimo o máximo?'}</small></span></button></li>
      <li><button type="button" class="paso" data-vista-grafo="procedimiento" aria-label="Etapa 3: Procedimiento"><span class="paso__numero">3</span><span class="paso__texto">Sigue los pasos<small>Observa cada decisión</small></span></button></li>
      <li><button type="button" class="paso" data-vista-grafo="resultado" aria-label="Etapa 4: Resultado"><span class="paso__numero">4</span><span class="paso__texto">Tu resultado<small>${esDijkstraModulo ? 'Distancias y rutas' : 'Conexiones y peso total'}</small></span></button></li>
    </ol></nav>
    <div class="gm-herramientas" id="herramientasGrafo">
      <div class="gm-ejemplo-intro"><strong>Prueba y aprende</strong><span>Carga un ejemplo y explóralo.</span></div>
      <label>Ejemplo<select id="ejemploGrafo"><option value="obligatorio">Caso de clase</option><option value="ceros">${esDijkstraModulo ? 'Ceros y empates' : 'Negativos, cero y empates'}</option><option value="desconectado">Grupos separados</option></select></label>
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
        <div class="gm-lienzo" tabindex="0" aria-label="Lienzo con desplazamiento interno"><svg id="svgModuloGrafo" viewBox="0 0 1000 600" role="group" aria-label="Grafo editable. También puedes usar los formularios y listas."></svg>
          <div class="gm-vacio" id="bienvenidaGrafo"><span class="gm-vacio-icono" aria-hidden="true">↗</span><h3>Tu primera red empieza aquí</h3><p>Prueba un ejemplo listo o añade dos puntos y conéctalos.</p><button type="button" class="btn btn-primary" id="btnEjemploRapidoGrafo">Explorar un ejemplo</button><button type="button" class="btn btn-fantasma" id="btnCrearPrimerPunto">Crear mi primer punto →</button></div>
        </div>
        <div class="gm-leyenda" aria-label="Leyenda del grafo"><span><i class="gm-muestra gm-muestra-elegida" aria-hidden="true"></i>${esDijkstraModulo ? 'Camino elegido' : 'Conexión aceptada'}</span><span><i class="gm-muestra gm-muestra-actual" aria-hidden="true"></i>En este paso</span><span><i class="gm-muestra gm-muestra-seleccion" aria-hidden="true"></i>Tu selección</span>${esDijkstraModulo ? '<span><i class="gm-muestra gm-muestra-ruta" aria-hidden="true"></i>Ruta al destino</span>' : ''}</div>
        <p class="gm-ayuda-corta" id="seleccionTextoGrafo"></p>
      </section>
      <section class="gm-panel gm-editor" id="panelEditorGrafo" aria-labelledby="tituloEditorGrafo"><h2 id="tituloEditorGrafo">Construye tu grafo</h2>
        <div class="gm-editor-bloque"><h3><span class="gm-numero" aria-hidden="true">1</span> Añade puntos</h3><p class="gm-info">Cada punto es un vértice: una ciudad, una parada o un lugar.</p><label for="nombreVertice">Nombre del punto</label><div class="gm-nuevo-punto"><input id="nombreVertice" maxlength="12" placeholder="Por ejemplo, A" autocomplete="off" aria-describedby="ayudaNombreVertice" /><button type="button" class="btn btn-primary" id="btnCrearVertice">Añadir</button></div><p class="gm-microayuda" id="ayudaNombreVertice">Hasta 12 caracteres. También puedes pulsar Enter.</p>
        <details class="gm-editar" id="ajustesVerticeGrafo"><summary>Editar un punto existente</summary><label for="seleccionVertice">Vértice seleccionado</label><select id="seleccionVertice"></select>
        <label for="nombreSeleccionado">Nombre</label><input id="nombreSeleccionado" maxlength="12" /><div class="gm-fila"><button type="button" class="btn btn-secondary" id="btnRenombrarVertice">Renombrar</button><button type="button" class="btn btn-peligro" id="btnEliminarVertice">Eliminar</button></div>
        <details class="gm-editar gm-posicion-opciones"><summary>Ajustar posición con coordenadas</summary><div class="gm-fila gm-posiciones"><div><label for="posicionNodoX">Posición X</label><input id="posicionNodoX" type="number" min="30" max="970" /></div><div><label for="posicionNodoY">Posición Y</label><input id="posicionNodoY" type="number" min="30" max="570" /></div></div><div class="gm-fila"><button type="button" class="btn btn-neutral" id="btnMoverVertice">Aplicar posición</button></div></details></details></div>
        <div class="gm-editor-bloque"><h3><span class="gm-numero" aria-hidden="true">2</span> Conecta los puntos</h3><p class="gm-info">Una conexión es una arista. Su peso indica la distancia o el costo.</p><div class="gm-extremos"><div><label for="aristaDesde">Desde</label><select id="aristaDesde"></select></div><span aria-hidden="true">${esDijkstraModulo ? '→' : '↔'}</span><div><label for="aristaHacia">Hasta</label><select id="aristaHacia"></select></div></div><label for="pesoArista">Peso ${esDijkstraModulo ? '(0 o un entero positivo)' : '(entero; puede ser negativo)'}</label><div class="gm-nueva-arista"><input id="pesoArista" inputmode="numeric" value="1" aria-describedby="ayudaCrearArista" /><button type="button" class="btn btn-primary" id="btnCrearArista">Conectar</button></div>
        <p class="gm-info" id="ayudaCrearArista">Una arista conecta dos vértices distintos. El peso representa su distancia o costo.</p>
        <details class="gm-editar" id="ajustesAristaGrafo"><summary>Editar una conexión existente</summary><label for="seleccionArista">Arista seleccionada</label><select id="seleccionArista"></select><label for="pesoSeleccionado">Editar peso</label><input id="pesoSeleccionado" inputmode="numeric" /><div class="gm-fila"><button type="button" class="btn btn-secondary" id="btnEditarPeso">Cambiar peso</button><button type="button" class="btn btn-peligro" id="btnEliminarArista">Eliminar</button></div></details></div>
        <div class="gm-avance"><button type="button" class="btn btn-primary" id="btnContinuarGrafo">Continuar: ${esDijkstraModulo ? 'elegir origen' : 'elegir objetivo'} →</button></div>
      </section>
      <section class="gm-panel gm-config" id="panelConfigGrafo" aria-labelledby="tituloConfigGrafo"><h2 id="tituloConfigGrafo">${esDijkstraModulo ? 'Origen y destino' : 'Objetivo del bosque'}</h2>
        <div id="configDijkstra"><label for="selectorModoGrafo">Modo del grafo</label><select id="selectorModoGrafo"><option value="dirigido">Dirigido</option><option value="no-dirigido">No dirigido</option></select><label for="origenGrafo">Origen</label><select id="origenGrafo"></select><label for="destinoGrafo">Destino opcional</label><select id="destinoGrafo"></select></div>
        <div id="configKruskal"><label for="objetivoGrafo">Peso del árbol o bosque</label><select id="objetivoGrafo"><option value="min">Mínimo</option><option value="max">Máximo</option></select></div>
        <p class="gm-info" id="contratoGrafo"></p><div class="gm-config-resumen" id="resumenConfigGrafo" role="status"></div><div class="gm-fila"><button type="button" class="btn btn-primary" id="btnResolverGrafo">${esDijkstraModulo ? 'Encontrar caminos mínimos' : 'Encontrar conexiones'} →</button></div><details class="gm-teoria"><summary>Cómo funciona y límites</summary><p class="gm-info" id="detalleContratoGrafo"></p></details>
        <button type="button" class="btn btn-neutral" id="btnCancelarCalculoGrafo" hidden>Cancelar preparación</button>
        <div class="gm-avance"><button type="button" class="btn btn-fantasma" id="btnVolverEditarGrafo">← Volver al grafo</button></div>
      </section>
    <section id="procedimientoGrafo" class="gm-panel gm-resultado" aria-labelledby="tituloProcedimientoGrafo"><h2 id="tituloProcedimientoGrafo">Decisiones de la ejecución</h2>
      <p class="gm-info">${esDijkstraModulo ? 'El predecesor es el vértice anterior en el camino elegido. ∞ indica que aún no se ha encontrado un camino.' : 'Una componente es un grupo de vértices ya conectados. Unir dos del mismo grupo formaría un ciclo.'}</p>
      <div class="gm-cinta"><div class="gm-progreso"><span id="contadorPasosGrafo"></span><progress id="progresoPasosGrafo" value="0" max="1" aria-label="Avance del procedimiento"></progress></div><div class="gm-repro-principal"><button type="button" class="btn btn-neutral" id="btnAnteriorGrafo">← Anterior</button><button type="button" class="btn btn-primary" id="btnReproducirGrafo">Reproducir</button><button type="button" class="btn btn-neutral" id="btnSiguienteGrafo">Siguiente →</button></div><details class="gm-repro-opciones"><summary>Velocidad y más controles</summary><div class="gm-repro-detalle"><button type="button" class="btn btn-fantasma" id="btnReiniciarGrafo">Reiniciar</button><button type="button" class="btn btn-fantasma" id="btnUltimoGrafo">Último paso</button><label for="velocidadGrafo">Velocidad</label><select id="velocidadGrafo"><option value="1400">Lenta</option><option value="750" selected>Normal</option><option value="250">Rápida</option></select></div></details></div>
      <p class="gm-explicacion" id="explicacionPasoGrafo" role="status"></p><div id="detallePasoGrafo" class="gm-info"></div><div class="gm-tabla-caja"><table class="tabla" id="tablaEstadoGrafo"></table></div>
      <div class="gm-avance"><button type="button" class="btn btn-primary" id="btnVerResultadoGrafo">Ver resultado →</button></div>
    </section>
    <section id="resultadoGrafo" class="gm-panel gm-resultado" aria-labelledby="tituloResultadoGrafo"></section>
    </div>`;
  const lienzo = elementoGrafo('svgModuloGrafo').parentElement;
  lienzo.after(elementoGrafo('explicacionPasoGrafo'), elementoGrafo('editorModuloGrafo').querySelector('.gm-cinta'));
  elementoGrafo('configDijkstra').hidden = !esDijkstraModulo;
  elementoGrafo('editorModuloGrafo').querySelectorAll('input, select').forEach(campo => campo.classList.add('entrada'));
  elementoGrafo('configKruskal').hidden = esDijkstraModulo;
  elementoGrafo('contratoGrafo').textContent = esDijkstraModulo
    ? 'Elige desde dónde comenzar. El destino es opcional: siempre se calculan los caminos a todos los vértices. Cambiar solo el destino conserva el cálculo.'
    : 'Mínimo: conecta cada grupo con el menor peso total. Máximo: busca el mayor peso total. Si hay grupos separados, obtendrás un bosque, sin añadir conexiones.';
  elementoGrafo('detalleContratoGrafo').textContent = esDijkstraModulo
    ? 'Pesos enteros de 0 a 999999. Sin bucles ni aristas duplicadas. Se calculan todos los destinos, incluso si seleccionas uno. Barrido lineal: O(V² + E). Empates por orden de vértices; se conserva el primer predecesor.'
    : 'Pesos enteros de −999999 a 999999. Grafo no dirigido, sin bucles ni duplicados. Orden O(E log E) y Union-Find con compresión/rango. Empates por orden original de aristas. Registrar componentes añade O(EV) al procedimiento educativo.';
}

function serializarModuloGrafo() {
  return { version: 1, modulo: moduloGrafo.modulo, grafo: copiarGrafoModulo(moduloGrafo.grafo), origen: moduloGrafo.origen,
    destino: moduloGrafo.destino, objetivo: moduloGrafo.objetivo, vista: moduloGrafo.vista, paso: moduloGrafo.paso, resuelto: !!moduloGrafo.resultado };
}

function guardarModuloGrafo() {
  escribirAlmacenamientoLocal(esDijkstraModulo ? DIJKSTRA_STORAGE_KEY : KRUSKAL_STORAGE_KEY, JSON.stringify(serializarModuloGrafo()), { respaldo: 'usa «Exportar JSON»' });
}

function aplicarDocumentoModuloGrafo(documento, mantenerHistorial) {
  const validacion = validarDocumentoGrafo(documento, moduloGrafo.modulo);
  if (!validacion.ok) throw new Error(validacion.error);
  const d = validacion.datos;
  // También la reconstrucción del resultado se prepara antes de modificar el ejercicio activo.
  const resultado = d.resuelto ? (esDijkstraModulo ? resolverDijkstraGrafo(d.grafo, d.origen) : resolverKruskalGrafo(d.grafo, d.objetivo)) : null;
  detenerReproduccionGrafo(); moduloGrafo.revision++; moduloGrafo.preparando = false;
  delete moduloGrafo.tiempoCalculo;
  Object.assign(moduloGrafo, { grafo: d.grafo, origen: d.origen, destino: d.destino, objetivo: d.objetivo, vista: d.vista,
    resultado, paso: Math.min(d.paso, Math.max(0, resultado ? resultado.pasos.length - 1 : 0)), seleccion: null });
  if (!mantenerHistorial) moduloGrafo.historial = { pasado: [], futuro: [] };
  actualizarModuloGrafo(); guardarModuloGrafo();
}

function guardarHistoriaGrafo() {
  moduloGrafo.historial.pasado.push(serializarModuloGrafo());
  if (moduloGrafo.historial.pasado.length > MAX_ACCIONES_DESHACER) moduloGrafo.historial.pasado.shift();
  moduloGrafo.historial.futuro = [];
}

function invalidarResultadoGrafo() {
  detenerReproduccionGrafo(); moduloGrafo.revision++; moduloGrafo.preparando = false;
  delete moduloGrafo.tiempoCalculo;
  moduloGrafo.resultado = null; moduloGrafo.paso = 0;
}

function comprometerGrafo(grafo, mensaje, invalidar) {
  const comprobacion = validarGrafoModulo(grafo, moduloGrafo.modulo);
  if (!comprobacion.ok) { notificar(comprobacion.error, 'error'); return false; }
  guardarHistoriaGrafo();
  moduloGrafo.grafo = comprobacion.grafo;
  if (invalidar !== false) invalidarResultadoGrafo();
  else {
    moduloGrafo.revision++;
    moduloGrafo.preparando = false;
    if (moduloGrafo.resultado) moduloGrafo.resultado.grafo = copiarGrafoModulo(grafo);
  }
  if (!grafo.nodos.some(n => n.id === moduloGrafo.origen)) moduloGrafo.origen = grafo.nodos[0] ? grafo.nodos[0].id : null;
  if (!grafo.nodos.some(n => n.id === moduloGrafo.destino)) moduloGrafo.destino = null;
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
  const ids = new Set(grafo.nodos.concat(grafo.conexiones).map(e => e.id));
  let id;
  do { id = prefijo + grafo.siguienteId++; } while (ids.has(id));
  return id;
}

function validarPesoEditorGrafo(texto) {
  const limpio = String(texto).trim();
  const minimo = esDijkstraModulo ? 0 : -MAX_PESO;
  if (!/^-?\d+$/.test(limpio) || !Number.isSafeInteger(Number(limpio)) || Number(limpio) < minimo || Number(limpio) > MAX_PESO) return { ok: false, error: 'Escribe un entero entre ' + minimo + ' y ' + MAX_PESO + '.' };
  return { ok: true, valor: Number(limpio) };
}

function cambiarVistaModuloGrafo(vista) {
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
    const resultado = esDijkstraModulo ? resolverDijkstraGrafo(g, origen) : resolverKruskalGrafo(g, objetivo);
    if (revision !== moduloGrafo.revision) return;
    moduloGrafo.resultado = resultado; moduloGrafo.paso = 0; moduloGrafo.vista = 'procedimiento';
    moduloGrafo.tiempoCalculo = performance.now() - inicio;
    notificar('Cálculo preparado. Sigue sus decisiones o consulta el resultado.', 'ok');
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

function distanciaTextoGrafo(valor) { return Number.isFinite(valor) ? String(valor) : '∞'; }
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
  elementoGrafo('btnVerResultadoGrafo').textContent = sinDatos ? 'Elegir datos y calcular →' : 'Ver resultado →';
  if (sinDatos) { explicacion.textContent = 'Primero prepara el grafo y calcula en la etapa 2. Después podrás seguir aquí cada decisión.'; return; }
  if (esDijkstraModulo) {
    if (paso.tipo === 'relajacion') {
      const arista = moduloGrafo.grafo.conexiones.find(c => c.id === paso.arista);
      explicacion.textContent = 'Desde ' + nombreNodoGrafo(paso.desde) + ' hasta ' + nombreNodoGrafo(paso.hacia) + ': distancia conocida ' + distanciaTextoGrafo(paso.distancias[paso.desde]) + ' + peso ' + arista.valor + ' = ' + paso.candidata + '. ' +
        (paso.mejora ? 'Mejora de ' + distanciaTextoGrafo(paso.anterior) + ' a ' + paso.candidata + '; el vértice anterior en este camino ahora es ' + nombreNodoGrafo(paso.desde) + '.' : 'No mejora la distancia ' + distanciaTextoGrafo(paso.anterior) + '; se conserva el camino elegido.');
      detalle.textContent = 'Comparación: ' + paso.candidata + ' < ' + distanciaTextoGrafo(paso.anterior) + ' → ' + (paso.mejora ? 'sí' : 'no') + '. ';
    } else if (paso.tipo === 'seleccion') {
      explicacion.textContent = 'Elegimos ' + nombreNodoGrafo(paso.actual) + ', el vértice pendiente con menor distancia (' + distanciaTextoGrafo(paso.distancias[paso.actual]) + '). Su distancia ya es definitiva; ahora revisaremos sus conexiones.';
    } else if (paso.tipo === 'inicio') {
      explicacion.textContent = 'Comenzamos en ' + nombreNodoGrafo(resultado.origen) + ' con distancia 0. Los demás tienen ∞ porque todavía no conocemos un camino hasta ellos.';
    } else {
      explicacion.textContent = 'Recorrido terminado: ya no quedan vértices alcanzables por revisar. Los que conservan ∞ están sin camino desde ' + nombreNodoGrafo(resultado.origen) + '.';
    }
    const pendientes = paso.pendientes.filter(id => paso.tipo !== 'final' || Number.isFinite(paso.distancias[id]));
    detalle.textContent += 'Por revisar: ' + (pendientes.map(id => nombreNodoGrafo(id) + ' (' + distanciaTextoGrafo(paso.distancias[id]) + ')').join(', ') || 'ninguno') + '. Se busca el menor recorriendo esta lista; no se utiliza una cola de prioridad.';
    tabla.innerHTML = '<caption class="sr-only">Distancias y predecesores en este paso</caption><thead><tr><th scope="col">Vértice</th><th scope="col">Distancia</th><th scope="col">Predecesor</th><th scope="col">Estado</th></tr></thead>';
    const cuerpo = document.createElement('tbody');
    moduloGrafo.grafo.nodos.forEach(n => {
      const fila = document.createElement('tr');
      const estado = paso.finalizados.includes(n.id) ? '✓ Distancia definitiva' : paso.tipo === 'final' && !Number.isFinite(paso.distancias[n.id]) ? 'Sin camino' : 'Por revisar';
      [n.nombre, distanciaTextoGrafo(paso.distancias[n.id]), paso.predecesores[n.id] ? nombreNodoGrafo(paso.predecesores[n.id].nodo) : '—', estado].forEach(texto => { const celda = document.createElement('td'); celda.textContent = texto; fila.appendChild(celda); });
      if (paso.actual === n.id) fila.classList.add('gm-fila-actual');
      cuerpo.appendChild(fila);
    }); tabla.appendChild(cuerpo);
  } else {
    explicacion.textContent = paso ? textoAristaGrafo(paso.arista) + ': ' + (paso.aceptada ? '✓ Aceptamos esta conexión: une dos grupos que estaban separados.' : '× Descartamos esta conexión: sus extremos ya están conectados; añadirla formaría un ciclo.') : 'No hay aristas que examinar. Cada vértice permanece como un grupo separado; el peso total es 0.';
    detalle.textContent = paso ? 'Grupos antes: ' + componentesTextoGrafo(paso.componentesAntes) + '. Grupos después: ' + componentesTextoGrafo(paso.componentesDespues) + '. Conexiones aceptadas: ' + (paso.elegidas.map(textoAristaGrafo).join('; ') || 'ninguna todavía') + '. Peso acumulado: ' + paso.total + '.' : 'Grupos: ' + componentesTextoGrafo(resultado.componentes) + '. Peso acumulado: 0.';
    tabla.innerHTML = '<caption>' + (moduloGrafo.objetivo === 'min' ? 'Mínimo: revisamos de menor a mayor peso.' : 'Máximo: revisamos de mayor a menor peso.') + ' Con igual peso se conserva el orden original.</caption><thead><tr><th scope="col">Orden</th><th scope="col">Arista y peso</th><th scope="col">Decisión</th></tr></thead>';
    const cuerpo = document.createElement('tbody');
    resultado.ordenadas.forEach((id, indice) => {
      const fila = document.createElement('tr');
      [String(indice + 1), textoAristaGrafo(id), indice <= moduloGrafo.paso ? (resultado.pasos[indice].aceptada ? '✓ Aceptada' : '× Ciclo') : 'Pendiente'].forEach(texto => { const celda = document.createElement('td'); celda.textContent = texto; fila.appendChild(celda); });
      if (indice === moduloGrafo.paso) { fila.classList.add('gm-fila-actual'); fila.setAttribute('aria-current', 'step'); }
      cuerpo.appendChild(fila);
    }); tabla.appendChild(cuerpo);
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

function cambiarDestinoResultadoGrafo(destino) {
  if (destino === moduloGrafo.destino) return;
  guardarHistoriaGrafo(); moduloGrafo.destino = destino;
  actualizarModuloGrafo(); guardarModuloGrafo();
  const boton = destino === null ? elementoGrafo('btnTodasRutasGrafo') :
    Array.from(elementoGrafo('resultadoGrafo').querySelectorAll('[data-destino-resultado]')).find(b => b.dataset.destinoResultado === destino);
  if (boton) boton.focus({ preventScroll: true });
}

function renderizarResultadoGrafo() {
  const caja = elementoGrafo('resultadoGrafo'); caja.replaceChildren();
  const titulo = document.createElement('h2'); titulo.id = 'tituloResultadoGrafo'; titulo.textContent = 'Resultado'; caja.appendChild(titulo);
  const r = moduloGrafo.resultado;
  const parrafo = (texto, clase) => { const p = document.createElement('p'); p.textContent = texto; if (clase) p.className = clase; caja.appendChild(p); };
  const avanzar = (texto, vista, id) => {
    const pie = document.createElement('div'); pie.className = 'gm-avance';
    const boton = document.createElement('button'); boton.type = 'button'; boton.id = id; boton.className = 'btn btn-primary'; boton.textContent = texto;
    boton.addEventListener('click', () => cambiarVistaModuloGrafo(vista)); pie.appendChild(boton); caja.appendChild(pie);
  };
  if (!r) { parrafo('Todavía no hay un resultado. Revisa tus datos y elige ' + (esDijkstraModulo ? 'el origen' : 'el objetivo') + ' antes de calcular.'); avanzar('Ir a configurar y calcular →', 'configuracion', 'btnConfigurarResultadoGrafo'); return; }
  if (esDijkstraModulo) {
    titulo.textContent = 'Tus caminos mínimos';
    parrafo('Estas son las distancias mínimas desde ' + nombreNodoGrafo(r.origen) + '. Las conexiones verdes forman los caminos elegidos hasta cada vértice alcanzable.');
    const alcanzables = moduloGrafo.grafo.nodos.filter(n => Number.isFinite(r.distancias[n.id])).length;
    agregarMetricasGrafo(caja, [['Origen', nombreNodoGrafo(r.origen)], ['Otros puntos alcanzables', String(alcanzables - 1)], ['Sin camino', String(moduloGrafo.grafo.nodos.length - alcanzables)]]);
    const resumenRuta = document.createElement('div'); resumenRuta.className = 'gm-ruta-resultado'; resumenRuta.setAttribute('role', 'status');
    const ruta = moduloGrafo.destino ? reconstruirRutaGrafo(r, moduloGrafo.destino) : null;
    const descripcion = document.createElement('p'); descripcion.className = 'gm-total';
    descripcion.textContent = moduloGrafo.destino
      ? (ruta ? 'Ruta: ' + ruta.nodos.map(nombreNodoGrafo).join(' → ') + '. Suma de pesos originales: ' + ruta.distancia + '.' : 'Sin camino desde el origen hasta ' + nombreNodoGrafo(moduloGrafo.destino) + '.')
      : '¿Hasta dónde quieres llegar?';
    const ayuda = document.createElement('p'); ayuda.textContent = moduloGrafo.destino
      ? 'El destino seleccionado se destaca en el grafo. Puedes elegir otro sin repetir el cálculo.'
      : 'Selecciona un punto de la lista para ver su ruta en el grafo.';
    resumenRuta.append(descripcion, ayuda); caja.appendChild(resumenRuta);
    const lista = document.createElement('ul'); lista.className = 'gm-destinos'; lista.setAttribute('aria-label', 'Destinos y distancias mínimas');
    moduloGrafo.grafo.nodos.forEach(n => {
      const item = document.createElement('li');
      const boton = document.createElement('button'); boton.type = 'button'; boton.dataset.destinoResultado = n.id;
      boton.setAttribute('aria-pressed', String(moduloGrafo.destino === n.id));
      const nombre = document.createElement('span'); nombre.textContent = n.nombre;
      const valor = document.createElement('strong'); valor.textContent = Number.isFinite(r.distancias[n.id]) ? String(r.distancias[n.id]) : '∞';
      const nota = document.createElement('small'); nota.textContent = n.id === r.origen ? 'Punto de partida' : Number.isFinite(r.distancias[n.id]) ? 'Ver camino →' : 'Sin camino';
      boton.setAttribute('aria-label', n.nombre + ': ' + (Number.isFinite(r.distancias[n.id]) ? 'distancia ' + r.distancias[n.id] + '. Ver ruta.' : 'Sin camino desde el origen.'));
      boton.append(nombre, valor, nota); boton.addEventListener('click', () => cambiarDestinoResultadoGrafo(n.id)); item.appendChild(boton); lista.appendChild(item);
    }); caja.appendChild(lista);
    const todas = document.createElement('button'); todas.type = 'button'; todas.id = 'btnTodasRutasGrafo'; todas.className = 'btn btn-neutral'; todas.textContent = 'Ver todos los caminos'; todas.setAttribute('aria-pressed', String(moduloGrafo.destino === null));
    todas.addEventListener('click', () => cambiarDestinoResultadoGrafo(null)); caja.appendChild(todas);
  } else {
    const conectado = r.componentes.length === 1;
    titulo.textContent = conectado ? 'Tu red está conectada' : 'Tu red tiene grupos separados';
    parrafo((conectado ? 'Árbol' : 'Bosque') + ' de expansión de peso ' + (moduloGrafo.objetivo === 'min' ? 'mínimo' : 'máximo') + '. Peso total: ' + r.total, 'gm-total');
    agregarMetricasGrafo(caja, [['Peso total', String(r.total)], ['Conexiones elegidas', String(r.elegidas.length)], ['Grupos conectados', String(r.componentes.length)]]);
    if (!conectado) parrafo('El grafo está desconectado: no existe un árbol que abarque todos los vértices. No se han añadido conexiones.');
    parrafo('Componentes (' + r.componentes.length + '): ' + componentesTextoGrafo(r.componentes) + '. Aristas elegidas: ' + r.elegidas.length + ' = V − C = ' + moduloGrafo.grafo.nodos.length + ' − ' + r.componentes.length + '.');
    const aislados = moduloGrafo.grafo.nodos.filter(n => !moduloGrafo.grafo.conexiones.some(c => c.desde === n.id || c.hacia === n.id));
    if (aislados.length) parrafo('Vértices aislados: ' + aislados.map(n => n.nombre).join(', ') + '.');
    const lista = document.createElement('ul'); lista.className = 'gm-conexiones-elegidas'; r.elegidas.forEach(id => { const item = document.createElement('li'); item.textContent = '✓ ' + textoAristaGrafo(id); lista.appendChild(item); }); caja.appendChild(lista);
    parrafo('El total es la suma de estas conexiones. Si hay empates, otras elecciones pueden conseguir el mismo total.');
  }
  avanzar('← Revisar el procedimiento', 'procedimiento', 'btnRevisarProcedimiento');
}

function actualizarModuloGrafo() {
  actualizarCamposEditorGrafo();
  const etapas = ['grafo', 'configuracion', 'procedimiento', 'resultado'];
  document.querySelectorAll('[data-vista-grafo]').forEach(b => { const actual = b.dataset.vistaGrafo === moduloGrafo.vista; b.classList.toggle('activo', actual); b.classList.toggle('completo', etapas.indexOf(b.dataset.vistaGrafo) < etapas.indexOf(moduloGrafo.vista)); if (actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  elementoGrafo('panelEditorGrafo').hidden = moduloGrafo.vista !== 'grafo';
  elementoGrafo('panelConfigGrafo').hidden = moduloGrafo.vista !== 'configuracion';
  elementoGrafo('distribucionGrafo').dataset.vista = moduloGrafo.vista;
  elementoGrafo('procedimientoGrafo').hidden = moduloGrafo.vista !== 'procedimiento';
  elementoGrafo('explicacionPasoGrafo').hidden = moduloGrafo.vista !== 'procedimiento';
  elementoGrafo('editorModuloGrafo').querySelector('.gm-cinta').hidden = moduloGrafo.vista !== 'procedimiento';
  elementoGrafo('resultadoGrafo').hidden = moduloGrafo.vista !== 'resultado';
  elementoGrafo('herramientasGrafo').hidden = moduloGrafo.vista !== 'grafo';
  elementoGrafo('btnDeshacerGrafo').disabled = !moduloGrafo.historial.pasado.length;
  elementoGrafo('btnRehacerGrafo').disabled = !moduloGrafo.historial.futuro.length;
  elementoGrafo('btnResolverGrafo').disabled = moduloGrafo.preparando || !moduloGrafo.grafo.nodos.length || (esDijkstraModulo && !moduloGrafo.origen);
  elementoGrafo('btnContinuarGrafo').disabled = !moduloGrafo.grafo.nodos.length;
  elementoGrafo('btnCrearArista').disabled = moduloGrafo.grafo.nodos.length < 2;
  elementoGrafo('ayudaCrearArista').textContent = moduloGrafo.grafo.nodos.length < 2 ? 'Primero crea dos vértices para poder conectarlos.' : 'Elige dos vértices distintos y escribe el peso de su conexión.';
  elementoGrafo('btnCancelarCalculoGrafo').hidden = !moduloGrafo.preparando;
  elementoGrafo('estadoCalculoGrafo').dataset.estado = moduloGrafo.preparando ? 'preparando' : moduloGrafo.resultado ? 'listo' : 'edicion';
  elementoGrafo('resumenConfigGrafo').textContent = !moduloGrafo.grafo.nodos.length ? 'Añade al menos un punto o carga un ejemplo para comenzar.' : esDijkstraModulo
    ? (moduloGrafo.origen ? 'Saldrás de ' + nombreNodoGrafo(moduloGrafo.origen) + (moduloGrafo.destino ? ' y verás la ruta hasta ' + nombreNodoGrafo(moduloGrafo.destino) + '.' : ' y verás la distancia a todos los puntos.') : 'Elige el punto de origen para calcular las distancias.')
    : 'Buscaremos las conexiones con ' + (moduloGrafo.objetivo === 'min' ? 'el menor' : 'el mayor') + ' peso total, sin formar ciclos.';
  elementoGrafo('estadoCalculoGrafo').textContent = moduloGrafo.preparando ? 'Preparando cálculo… puedes cancelar o editar los datos.' : moduloGrafo.resultado ? '✓ Resultado actualizado. Puedes revisar cada paso' + (esDijkstraModulo ? ' o elegir otro destino sin recalcular.' : ' y comprobar el peso total.') : 'Tus cambios se guardan en este navegador. Cuando estén listos, continúa a la etapa 2.';
  const guias = {
    grafo: ['1. Prepara tu grafo', moduloGrafo.grafo.nodos.length ? 'Añade o edita conexiones y después pulsa «Continuar» para elegir ' + (esDijkstraModulo ? 'el origen.' : 'el objetivo.') : 'Para empezar, carga un ejemplo o crea tus propios vértices y conexiones. Los datos actuales solo pertenecen a este módulo.'],
    configuracion: ['2. ' + (esDijkstraModulo ? 'Elige desde dónde comenzar' : 'Elige el objetivo'), moduloGrafo.grafo.nodos.length ? 'Revisa las opciones y pulsa «Calcular». Después podrás seguir cada decisión junto al grafo.' : 'El grafo está vacío. Vuelve a la etapa 1 para crear vértices o cargar un ejemplo.'],
    procedimiento: ['3. Sigue cada decisión', moduloGrafo.resultado ? 'Usa «Siguiente» o «Reproducir» y observa la conexión resaltada. La explicación y la tabla corresponden al paso actual.' : 'Primero necesitas calcular. Usa el botón de abajo para revisar la configuración.'],
    resultado: ['4. Comprueba el resultado', esDijkstraModulo ? 'Consulta todas las distancias y, si elegiste un destino, su ruta completa.' : 'Revisa las conexiones elegidas, los grupos conectados y el peso total.']
  };
  elementoGrafo('tituloEtapaGrafo').textContent = guias[moduloGrafo.vista][0];
  elementoGrafo('descripcionEtapaGrafo').textContent = guias[moduloGrafo.vista][1];
  dibujarEditorGrafo(); renderizarProcedimientoGrafo(); renderizarResultadoGrafo();
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
  if (dirigido) {
    if (grafo.conexiones.length * 2 > GRAFOS_MAX_ARISTAS) { notificar('La conversión superaría 96 aristas.', 'error'); actualizarCamposEditorGrafo(); return; }
    grafo.conexiones = grafo.conexiones.flatMap(c => [c, { id: siguienteIdModuloGrafo(grafo, 'e'), desde: c.hacia, hacia: c.desde, valor: c.valor }]);
  } else {
    const nuevas = [], usados = new Set();
    for (const c of grafo.conexiones) {
      if (usados.has(c.id)) continue;
      const opuesta = grafo.conexiones.find(a => a.desde === c.hacia && a.hacia === c.desde);
      let peso = c.valor;
      if (opuesta && opuesta.valor !== c.valor) {
        const valor = await dialogoPedirTexto({ titulo: 'Resolver pesos opuestos', mensaje: nombreNodoGrafo(c.desde) + ' → ' + nombreNodoGrafo(c.hacia) + ' pesa ' + c.valor + '; la dirección opuesta pesa ' + opuesta.valor + '. Escribe el peso de la arista no dirigida. Cancelar conserva el grafo original.', valor: c.valor, validar: validarPesoEditorGrafo, inputmode: 'numeric' });
        if (valor === undefined || revision !== moduloGrafo.revision) { actualizarCamposEditorGrafo(); return; }
        peso = valor;
      }
      nuevas.push(Object.assign({}, c, { valor: peso })); usados.add(c.id); if (opuesta) usados.add(opuesta.id);
    }
    grafo.conexiones = nuevas;
  }
  grafo.dirigido = dirigido;
  comprometerGrafo(grafo, 'Modo convertido de forma explícita.');
}

function textoAyudaModuloGrafo() {
  return [
    'VIDEO Y PRIMEROS PASOS\nEl botón «Video» abre la presentación explicativa. «Ir al algoritmo» vuelve a tu ejercicio; «No mostrar al entrar» recuerda tu preferencia solo para este módulo. El video necesita internet. En móvil, abre el menú ☰ y usa «Video del módulo» o «Ayuda del módulo». Puedes trabajar sin el video y consultar esta ayuda en cualquier momento.',
    '1) CREA TU GRAFO\nCarga un ejemplo o usa «Crear mi primer punto». Un punto es un vértice; una conexión es una arista. Añade el nombre y pulsa «Añadir» o Enter. Para conectar, elige «Desde», «Hasta» y un peso; pulsa «Conectar» o Enter desde el campo de peso. Se admiten hasta ' + GRAFOS_MAX_NODOS + ' vértices, ' + GRAFOS_MAX_ARISTAS + ' aristas y nombres de hasta ' + MAX_LARGO_NOMBRE + ' caracteres. No se admiten conexiones de un punto consigo mismo ni aristas repetidas.\n' +
      (esDijkstraModulo ? 'Los pesos son enteros entre 0 y ' + MAX_PESO + '. Un peso cero es una conexión real; los negativos no se admiten.' : 'Los pesos son enteros entre −' + MAX_PESO + ' y ' + MAX_PESO + ', incluidos cero y negativos. Las conexiones funcionan en ambos sentidos.'),
    '2) CONFIGURA EL CÁLCULO\n' + (esDijkstraModulo
      ? 'Pulsa «Continuar: elegir origen». El origen es el punto desde el que sales. El destino es opcional: siempre se calculan las distancias a todos los puntos. En modo dirigido se respetan las flechas; en no dirigido se puede recorrer una conexión en ambos sentidos. Cambiar de modo pide confirmación y resuelve los conflictos de pesos entre conexiones opuestas.'
      : 'Pulsa «Continuar: elegir objetivo». Mínimo busca el menor peso total y Máximo, el mayor, conectando cada grupo sin formar ciclos. Kruskal usa un grafo no dirigido y no necesita un origen o destino. No calcula rutas mínimas desde un punto.'),
    '3) SIGUE LOS PASOS\nDespués de calcular, usa «Anterior», «Siguiente» o «Reproducir/Pausar». La barra indica el avance real. «Velocidad y más controles» permite cambiar el ritmo, reiniciar o saltar al último paso. La velocidad regula la animación, no mide el rendimiento del algoritmo.\n' +
      (esDijkstraModulo ? 'Dijkstra comienza con distancia 0 en el origen y ∞ en los demás. Elige el pendiente con menor distancia y revisa si pasar por él mejora las distancias vecinas. La tabla muestra distancias, predecesores (el punto anterior del camino) y estados.' : 'Kruskal ordena las conexiones por peso y acepta una solo cuando une dos grupos separados. Una conexión entre puntos ya unidos se descarta porque formaría un ciclo. La tabla muestra cada decisión y el peso acumulado.') +
      '\nVerde: conexión elegida. Amarillo: elemento del paso actual. Contorno discontinuo: tu selección. La fila destacada corresponde al paso actual.',
    '4) ENTIENDE EL RESULTADO\n' + (esDijkstraModulo
      ? 'Las tarjetas muestran la distancia mínima desde el origen. Selecciona un destino para ver la ruta y la suma de sus pesos originales en el grafo, sin recalcular. «Ver todos los caminos» recupera el árbol completo de caminos mínimos. La distancia del origen a sí mismo es 0. ∞ o «Sin camino» indica que el punto no se puede alcanzar desde ese origen; no significa un costo cero. Los empates conservan el primer camino encontrado.'
      : 'Verás el peso total, las conexiones elegidas y la cantidad de grupos. Si todos los puntos están conectados, se obtiene un árbol; si hay grupos separados, un bosque. Los puntos aislados se conservan y no se inventan conexiones entre grupos. Se eligen V − C aristas: cantidad de vértices menos cantidad de grupos. Sin aristas, el total es 0. Si hay pesos iguales, otras elecciones pueden dar el mismo total; se conserva el orden original para desempatar.'),
    '5) EDITA Y RECORRE EL GRAFO\nSelecciona un elemento en el dibujo o abre «Editar un punto existente» / «Editar una conexión existente». Puedes renombrar, cambiar pesos y eliminar; al borrar un punto se borran sus conexiones. Arrastra puntos con el ratón o usa «Ajustar posición con coordenadas» con teclado o pantalla táctil. «Ver todo» encuadra la red sin mover los puntos; «Ampliar» da más espacio y «Zoom y más» ofrece acercamiento y desplazamiento.\nCambiar conexiones, pesos, modo, origen u objetivo invalida el cálculo. Renombrar o mover puntos conserva el resultado. ' + (esDijkstraModulo ? 'Cambiar solo el destino también conserva el cálculo. ' : '') + 'Los botones «Deshacer» y «Rehacer» permiten recuperar hasta ' + MAX_ACCIONES_DESHACER + ' cambios.',
    '6) GUARDA Y COMPARTE\nEl ejercicio se guarda automáticamente en este navegador. «Guardar» conserva un trabajo con nombre; «Cargar» abre «Mis trabajos» para cargar, renombrar, eliminar, exportar o importar trabajos. Cargar reemplaza el ejercicio después de confirmar. Dijkstra y Kruskal tienen guardados independientes.\nEn «Más opciones», Exportar/Importar JSON lleva un ejercicio a otro equipo; el archivo se valida antes de reemplazar datos. «PNG», dentro de «Zoom y más», descarga la vista del grafo. Limpiar pide confirmación y se puede deshacer. Borrar los datos del navegador puede borrar tus trabajos: exporta JSON para conservar una copia. Si falla el autoguardado, sigue el aviso visible y exporta tu ejercicio.',
    '7) TECLADO Y AYUDA\nTab recorre los controles. Enter o Espacio seleccionan puntos y conexiones enfocados en el dibujo. Las listas y los campos de posición permiten editar sin arrastrar. Escape cierra la ayuda o el diálogo y devuelve el foco. Los botones «Video» y «Ayuda» pausan la reproducción para conservar el paso que estabas revisando.'
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
  ['origenGrafo', 'destinoGrafo', 'objetivoGrafo'].forEach(id => elementoGrafo(id).addEventListener('change', e => {
    guardarHistoriaGrafo();
    if (id !== 'destinoGrafo') invalidarResultadoGrafo();
    moduloGrafo[id === 'origenGrafo' ? 'origen' : id === 'destinoGrafo' ? 'destino' : 'objetivo'] = e.target.value || null;
    actualizarModuloGrafo(); guardarModuloGrafo();
  }));
  document.querySelectorAll('[data-vista-grafo]').forEach(b => b.addEventListener('click', () => cambiarVistaModuloGrafo(b.dataset.vistaGrafo)));
  al('btnContinuarGrafo', () => cambiarVistaModuloGrafo('configuracion'));
  al('btnVolverEditarGrafo', () => cambiarVistaModuloGrafo('grafo'));
  al('btnVerResultadoGrafo', () => cambiarVistaModuloGrafo(moduloGrafo.resultado ? 'resultado' : 'configuracion'));
  al('btnResolverGrafo', resolverModuloGrafo);
  al('btnCancelarCalculoGrafo', () => { moduloGrafo.revision++; moduloGrafo.preparando = false; actualizarModuloGrafo(); });
  al('btnDeshacerGrafo', () => deshacerModuloGrafo(false)); al('btnRehacerGrafo', () => deshacerModuloGrafo(true));
  async function reemplazarGrafo(grafo, titulo) {
    const revision = moduloGrafo.revision;
    if (moduloGrafo.grafo.nodos.length && !await dialogoConfirmar({ titulo, mensaje: 'Se reemplazarán los datos actuales de este módulo. Puedes deshacerlo después.' })) return;
    if (revision !== moduloGrafo.revision) return;
    comprometerGrafo(grafo, 'Datos actualizados.');
  }
  al('btnEjemploGrafo', () => reemplazarGrafo(crearEjemploGrafo(moduloGrafo.modulo, elementoGrafo('ejemploGrafo').value), 'Cargar ejemplo'));
  al('btnEjemploRapidoGrafo', () => reemplazarGrafo(crearEjemploGrafo(moduloGrafo.modulo), 'Cargar ejemplo'));
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
        guardarHistoriaGrafo(); aplicarDocumentoModuloGrafo(validacion.datos, true); notificar('Grafo importado.', 'ok');
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
    dialogoInformar({ titulo: 'Ayuda: ' + (esDijkstraModulo ? 'Dijkstra' : 'Kruskal'), ancho: true, mensaje: textoAyudaModuloGrafo() });
  });
}

construirInterfazModuloGrafo();
instalarAccionesModuloGrafo();
try {
  const guardado = localStorage.getItem(esDijkstraModulo ? DIJKSTRA_STORAGE_KEY : KRUSKAL_STORAGE_KEY);
  if (guardado) aplicarDocumentoModuloGrafo(JSON.parse(guardado)); else actualizarModuloGrafo();
} catch (error) { actualizarModuloGrafo(); notificar('No se pudo restaurar el ejercicio: ' + error.message + '. Puedes importar una copia JSON.', 'aviso'); }
configurarVistaEditorGrafo();
