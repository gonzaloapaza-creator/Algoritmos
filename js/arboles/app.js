'use strict';

const arbol = estadoArboles;
const arbolElemento = id => document.getElementById(id);
const nodosEjemploClase = [5, 3, 1, 4, 7, 11, 8, 15];
const recorridosEjemploClase = {
  preorden: [5, 3, 1, 4, 7, 11, 8, 15],
  inorden: [1, 3, 4, 5, 7, 8, 11, 15],
  postorden: [1, 4, 3, 8, 15, 11, 7, 5]
};

function detenerRecorridoArbol() {
  arbol.reproduciendo = false;
  if (arbol.intervaloRecorrido !== null) clearInterval(arbol.intervaloRecorrido);
  arbol.intervaloRecorrido = null;
  const boton = arbolElemento('btnRecorridoPlay');
  if (boton) {
    boton.textContent = 'Reproducir';
    boton.setAttribute('aria-pressed', 'false');
  }
}

function invalidarRecorridoArbol() {
  detenerRecorridoArbol();
  arbol.historialRecorrido = [];
  arbol.pasoRecorrido = 0;
}

function buscarRelacionArbol(raiz, valor, padre) {
  if (!raiz) return null;
  if (raiz.valor === valor) return { nodo: raiz, padre: padre ? padre.valor : null };
  return buscarRelacionArbol(raiz.izquierdo, valor, raiz) || buscarRelacionArbol(raiz.derecho, valor, raiz);
}

function textoListaArbol(valores) {
  return valores.length ? valores.join(', ') : '—';
}

function actualizarDetalleNodo() {
  const salida = arbolElemento('detalleNodo');
  const hallado = buscarRelacionArbol(arbol.raiz, arbol.seleccion, null);
  if (!hallado) {
    salida.textContent = 'Selecciona un nodo para ver sus relaciones.';
    return;
  }
  const { nodo, padre } = hallado;
  salida.textContent = `Valor: ${nodo.valor}${padre === null ? ' · raíz' : ` · padre: ${padre}`} · hijo izquierdo: ${nodo.izquierdo ? nodo.izquierdo.valor : 'ninguno'} · hijo derecho: ${nodo.derecho ? nodo.derecho.valor : 'ninguno'}${!nodo.izquierdo && !nodo.derecho ? ' · hoja' : ''}`;
}

function actualizarVisualArbol(opciones) {
  const recorridos = recorridosArbol(arbol.raiz);
  const nuevos = opciones || {};
  arbolElemento('secuenciaInsercion').textContent = arbol.modo === 'busqueda' ? textoListaArbol(arbol.secuencia) : 'Árbol reconstruido desde recorridos';
  arbolElemento('estadoArbol').textContent = arbol.raiz
    ? `${arbol.modo === 'busqueda' ? 'Árbol binario de búsqueda' : 'Árbol binario reconstruido'} · ${recorridos.inorden.length} nodo(s).`
    : 'Árbol vacío.';
  arbolElemento('btnDeshacerInsercion').disabled = !arbol.secuencia.length || arbol.modo !== 'busqueda';
  arbolElemento('btnLimpiarArbol').disabled = !arbol.raiz;
  arbolElemento('resultadoPreorden').textContent = textoListaArbol(recorridos.preorden);
  arbolElemento('resultadoInorden').textContent = textoListaArbol(recorridos.inorden);
  arbolElemento('resultadoPostorden').textContent = textoListaArbol(recorridos.postorden);

  const eventos = arbol.historialRecorrido;
  const visitados = new Set();
  const salida = [];
  let actual = null;
  eventos.slice(0, arbol.pasoRecorrido).forEach(evento => {
    actual = evento.valor;
    if (evento.tipo === 'visitar') visitados.add(evento.valor);
    if (evento.tipo === 'emitir') salida.push(evento.valor);
  });
  dibujarArbol(arbol.raiz, {
    seleccion: arbol.seleccion,
    camino: nuevos.camino || arbol.camino,
    nuevo: nuevos.nuevo !== undefined ? nuevos.nuevo : arbol.nuevo,
    actual,
    visitados: [...visitados]
  });
  actualizarDetalleNodo();
  actualizarControlesRecorrido(salida, eventos.length ? eventos[arbol.pasoRecorrido - 1] : null);
}

function crearHistorialRecorrido(raiz, tipo) {
  const eventos = [];
  function recorrer(nodo) {
    if (!nodo) return;
    eventos.push({ tipo: 'visitar', valor: nodo.valor, mensaje: `Se visita el nodo ${nodo.valor}. La visita todavía no agrega el valor a la salida.` });
    if (tipo === 'preorden') eventos.push({ tipo: 'emitir', valor: nodo.valor, mensaje: `Preorden: se agrega ${nodo.valor} antes de recorrer sus hijos.` });
    recorrer(nodo.izquierdo);
    if (tipo === 'inorden') eventos.push({ tipo: 'emitir', valor: nodo.valor, mensaje: `Inorden: se agrega ${nodo.valor} después del subárbol izquierdo y antes del derecho.` });
    recorrer(nodo.derecho);
    if (tipo === 'postorden') eventos.push({ tipo: 'emitir', valor: nodo.valor, mensaje: `Postorden: ya se recorrieron sus hijos; ahora se agrega ${nodo.valor}.` });
  }
  recorrer(raiz);
  return eventos;
}

function actualizarControlesRecorrido(salida, evento) {
  const total = arbol.historialRecorrido.length;
  arbolElemento('salidaRecorrido').textContent = textoListaArbol(salida);
  arbolElemento('explicacionRecorrido').textContent = evento
    ? `Paso ${arbol.pasoRecorrido} de ${total}: ${evento.mensaje}`
    : arbol.raiz ? 'Recorrido listo. Avanza o reproduce para visitar los nodos.' : 'Agrega o reconstruye un árbol para habilitar el recorrido.';
  arbolElemento('btnRecorridoAnterior').disabled = arbol.pasoRecorrido === 0;
  arbolElemento('btnRecorridoSiguiente').disabled = arbol.pasoRecorrido >= total;
  arbolElemento('btnRecorridoReiniciar').disabled = arbol.pasoRecorrido === 0;
  arbolElemento('btnRecorridoPlay').disabled = total === 0;
}

function cambiarRecorridoArbol() {
  invalidarRecorridoArbol();
  arbol.recorridoSeleccionado = arbolElemento('selectorRecorrido').value;
  arbol.historialRecorrido = crearHistorialRecorrido(arbol.raiz, arbol.recorridoSeleccionado);
  actualizarVisualArbol();
}

function pasoSiguienteRecorrido() {
  if (arbol.pasoRecorrido < arbol.historialRecorrido.length) {
    arbol.pasoRecorrido++;
    actualizarVisualArbol();
  }
  if (arbol.pasoRecorrido >= arbol.historialRecorrido.length) detenerRecorridoArbol();
}

function pasoAnteriorRecorrido() {
  if (arbol.pasoRecorrido > 0) arbol.pasoRecorrido--;
  actualizarVisualArbol();
}

function alternarReproduccionRecorrido() {
  if (arbol.reproduciendo) {
    detenerRecorridoArbol();
    return;
  }
  if (!arbol.historialRecorrido.length) return;
  if (arbol.pasoRecorrido >= arbol.historialRecorrido.length) {
    arbol.pasoRecorrido = 0;
    actualizarVisualArbol();
  }
  arbol.reproduciendo = true;
  arbolElemento('btnRecorridoPlay').textContent = 'Pausar';
  arbolElemento('btnRecorridoPlay').setAttribute('aria-pressed', 'true');
  arbol.intervaloRecorrido = setInterval(pasoSiguienteRecorrido, Number(arbolElemento('velocidadRecorrido').value));
}

function aplicarNuevoArbol(raiz, modo, secuencia, opciones) {
  invalidarRecorridoArbol();
  arbol.raiz = raiz;
  arbol.modo = modo;
  arbol.secuencia = secuencia.slice();
  arbol.camino = opciones && opciones.camino ? opciones.camino.slice() : [];
  arbol.nuevo = opciones ? opciones.nuevo : null;
  arbol.seleccion = null;
  arbol.recorridoSeleccionado = arbolElemento('selectorRecorrido').value;
  arbol.historialRecorrido = crearHistorialRecorrido(arbol.raiz, arbol.recorridoSeleccionado);
  actualizarVisualArbol();
  guardarEstadoArboles();
}

function agregarValorArbol(texto) {
  const validacion = analizarEnteroArbol(texto, 'un valor de nodo');
  if (!validacion.ok) return validacion;
  if (arbol.modo !== 'busqueda') return { ok: false, error: 'Limpia el árbol reconstruido antes de agregar valores de búsqueda.' };
  if (arbol.secuencia.length >= MAX_NODOS_ARBOL) return { ok: false, error: `El árbol admite como máximo ${MAX_NODOS_ARBOL} nodos.` };
  const insercion = insertarNodoArbol(arbol.raiz, validacion.valor);
  if (insercion.duplicado) return { ok: false, error: `El valor ${validacion.valor} ya existe; no se permiten duplicados.` };
  const secuencia = arbol.secuencia.concat(validacion.valor);
  aplicarNuevoArbol(insercion.raiz, 'busqueda', secuencia, { camino: insercion.camino, nuevo: insercion.nuevo });
  return { ok: true };
}

function actualizarCamposReconstruccion() {
  const modo = arbolElemento('modoReconstruccion').value;
  const necesarios = modo === 'in_post' ? ['inorden', 'postorden'] : modo === 'pre_in' ? ['preorden', 'inorden'] : ['preorden', 'inorden', 'postorden'];
  document.querySelectorAll('.arbol-recorrido-campo').forEach(campo => {
    const nombre = campo.dataset.recorrido;
    const activa = necesarios.includes(nombre);
    const entrada = campo.querySelector('textarea');
    campo.hidden = !activa;
    entrada.required = activa;
    entrada.disabled = !activa;
  });
  arbolElemento('avisoPrePost').hidden = modo !== 'pre_post';
}

function leerEntradasReconstruccion() {
  const modo = arbolElemento('modoReconstruccion').value;
  const campos = modo === 'in_post'
    ? ['inorden', 'postorden']
    : modo === 'pre_in' ? ['preorden', 'inorden'] : ['preorden', 'inorden', 'postorden'];
  const resultado = {};
  for (const nombre of campos) {
    const analisis = analizarRecorridoArbol(arbolElemento('entrada' + nombre[0].toUpperCase() + nombre.slice(1)).value, nombre);
    if (!analisis.ok) return analisis;
    resultado[nombre] = analisis.valores;
  }
  return validarYReconstruirArbol(resultado, modo);
}

function mostrarErrorReconstruccion(texto) {
  arbolElemento('errorReconstruccion').textContent = texto;
  arbolElemento('errorReconstruccion').dataset.sinResultado = 'true';
}

function ejecutarReconstruccion() {
  const resultado = leerEntradasReconstruccion();
  if (!resultado.ok) {
    mostrarErrorReconstruccion(`${resultado.error} No se reconstruyó el árbol; los campos se conservaron.`);
    return false;
  }
  arbolElemento('errorReconstruccion').textContent = '';
  arbolElemento('errorReconstruccion').removeAttribute('data-sin-resultado');
  aplicarNuevoArbol(resultado.raiz, 'reconstruido', []);
  return true;
}

function cargarEjemploReconstruccion() {
  arbolElemento('modoReconstruccion').value = 'todos';
  actualizarCamposReconstruccion();
  Object.entries(recorridosEjemploClase).forEach(([nombre, valores]) => {
    arbolElemento('entrada' + nombre[0].toUpperCase() + nombre.slice(1)).value = valores.join(', ');
  });
  ejecutarReconstruccion();
}

arbolElemento('formInsertar').addEventListener('submit', evento => {
  evento.preventDefault();
  const resultado = agregarValorArbol(arbolElemento('valorNodo').value);
  arbolElemento('errorInsercion').textContent = resultado.ok ? '' : resultado.error;
  if (resultado.ok) {
    arbolElemento('valorNodo').value = '';
    arbolElemento('valorNodo').focus();
  }
});

arbolElemento('btnDeshacerInsercion').addEventListener('click', () => {
  if (!arbol.secuencia.length || arbol.modo !== 'busqueda') return;
  const secuencia = arbol.secuencia.slice(0, -1);
  aplicarNuevoArbol(crearArbolBusqueda(secuencia), 'busqueda', secuencia);
});

arbolElemento('btnLimpiarArbol').addEventListener('click', () => aplicarNuevoArbol(null, 'busqueda', []));

arbolElemento('btnEjemploInsercion').addEventListener('click', () => {
  aplicarNuevoArbol(crearArbolBusqueda(nodosEjemploClase), 'busqueda', nodosEjemploClase);
  arbolElemento('errorInsercion').textContent = '';
});
arbolElemento('btnEjemploAleatorio').addEventListener('click', () => {
  aplicarNuevoArbol(crearArbolBusqueda(nodosEjemploClase), 'busqueda', nodosEjemploClase);
  arbolElemento('secuenciaAleatoria').textContent = nodosEjemploClase.join(', ');
  arbolElemento('errorAleatorio').textContent = '';
});

arbolElemento('formAleatorio').addEventListener('submit', evento => {
  evento.preventDefault();
  const validacion = validarParametrosGeneradorArbol(
    arbolElemento('cantidadNodos').value,
    arbolElemento('valorMinimo').value,
    arbolElemento('valorMaximo').value
  );
  if (!validacion.ok) {
    arbolElemento('errorAleatorio').textContent = validacion.error;
    return;
  }
  const valores = generarValoresArbol(validacion.cantidad, validacion.minimo, validacion.maximo);
  const secuencia = validarSecuenciaInsercion(valores);
  if (!secuencia.ok) {
    arbolElemento('errorAleatorio').textContent = secuencia.error;
    return;
  }
  aplicarNuevoArbol(crearArbolBusqueda(valores), 'busqueda', valores);
  arbolElemento('secuenciaAleatoria').textContent = valores.join(', ');
  arbolElemento('errorAleatorio').textContent = '';
});

arbolElemento('modoReconstruccion').addEventListener('change', actualizarCamposReconstruccion);
arbolElemento('btnReconstruir').addEventListener('click', ejecutarReconstruccion);
arbolElemento('btnEjemploReconstruccion').addEventListener('click', cargarEjemploReconstruccion);

arbolElemento('selectorRecorrido').addEventListener('change', cambiarRecorridoArbol);
arbolElemento('btnRecorridoAnterior').addEventListener('click', () => { detenerRecorridoArbol(); pasoAnteriorRecorrido(); });
arbolElemento('btnRecorridoSiguiente').addEventListener('click', () => { detenerRecorridoArbol(); pasoSiguienteRecorrido(); });
arbolElemento('btnRecorridoPlay').addEventListener('click', alternarReproduccionRecorrido);
arbolElemento('btnRecorridoReiniciar').addEventListener('click', () => {
  detenerRecorridoArbol();
  arbol.pasoRecorrido = 0;
  actualizarVisualArbol();
});
arbolElemento('velocidadRecorrido').addEventListener('change', () => {
  if (arbol.reproduciendo) {
    detenerRecorridoArbol();
    alternarReproduccionRecorrido();
  }
});

arbolElemento('vistaArbol').addEventListener('click', evento => {
  const nodo = evento.target.closest('[data-valor]');
  if (!nodo) return;
  arbol.seleccion = Number(nodo.dataset.valor);
  arbol.camino = [];
  arbol.nuevo = null;
  actualizarVisualArbol();
});
arbolElemento('vistaArbol').addEventListener('keydown', evento => {
  if ((evento.key === 'Enter' || evento.key === ' ') && evento.target.matches('[data-valor]')) {
    evento.preventDefault();
    evento.target.click();
  }
});

arbolElemento('btnZoomMas').addEventListener('click', () => cambiarZoomArbol(1.2));
arbolElemento('btnZoomMenos').addEventListener('click', () => cambiarZoomArbol(1 / 1.2));
arbolElemento('btnCentrarArbol').addEventListener('click', centrarArbol);
arbolElemento('btnAjustarArbol').addEventListener('click', ajustarZoomArbol);

const modalAyudaArbol = arbolElemento('modalAyuda');
arbolElemento('btnAyuda').addEventListener('click', () => { modalAyudaArbol.hidden = false; });
arbolElemento('btnCerrarAyuda').addEventListener('click', () => { modalAyudaArbol.hidden = true; });
modalAyudaArbol.addEventListener('click', evento => { if (evento.target === modalAyudaArbol) modalAyudaArbol.hidden = true; });
document.addEventListener('keydown', evento => { if (evento.key === 'Escape' && !modalAyudaArbol.hidden) modalAyudaArbol.hidden = true; });

actualizarCamposReconstruccion();
const guardado = restaurarEstadoArboles();
if (guardado) {
  aplicarNuevoArbol(guardado.raiz, guardado.modo, guardado.secuencia);
  if (guardado.modo === 'reconstruido') {
    const recorridos = recorridosArbol(guardado.raiz);
    Object.entries(recorridos).forEach(([nombre, valores]) => {
      arbolElemento('entrada' + nombre[0].toUpperCase() + nombre.slice(1)).value = valores.join(', ');
    });
    arbolElemento('modoReconstruccion').value = 'todos';
    actualizarCamposReconstruccion();
  }
} else {
  arbol.historialRecorrido = crearHistorialRecorrido(null, arbol.recorridoSeleccionado);
  actualizarVisualArbol();
}

if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { if (arbol.raiz) actualizarVisualArbol(); })
    .observe(arbolElemento('vistaArbol'));
}
