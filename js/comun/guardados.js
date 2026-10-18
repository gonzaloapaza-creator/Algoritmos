/* Biblioteca local de trabajos nombrados para todos los algoritmos.
 *
 * La primera parte (hasta «Panel») es lógica pura sobre listas de trabajos y se
 * prueba desde Node (tests/guardados.test.js). CLAVE_TRABAJOS y
 * MAX_TRABAJOS_POR_MODULO vienen de js/config.js. */
'use strict';

const MODULOS_TRABAJO = ['johnson', 'asignacion', 'northwest', 'ordenamiento', 'arboles'];
const MAX_LARGO_NOMBRE_TRABAJO = 60;

/* ---------------- Lógica pura ---------------- */

function esTrabajoValido(t) {
  return !!t && typeof t === 'object' && typeof t.id === 'string' && typeof t.nombre === 'string' &&
    MODULOS_TRABAJO.includes(t.modulo) && typeof t.fecha === 'string' && !!t.datos && typeof t.datos === 'object';
}

function depurarListaTrabajos(datos) {
  return Array.isArray(datos) ? datos.filter(esTrabajoValido) : [];
}

function mismoNombreTrabajo(a, b) {
  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

function validarNombreTrabajo(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (!limpio) return { ok: false, error: 'Escribe un nombre para poder encontrarlo después.' };
  if (limpio.length > MAX_LARGO_NOMBRE_TRABAJO) return { ok: false, error: 'El nombre es demasiado largo (máximo ' + MAX_LARGO_NOMBRE_TRABAJO + ' caracteres).' };
  return { ok: true, valor: limpio };
}

function nuevoIdTrabajo() {
  return 'trabajo_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

function copiarTrabajo(datos) {
  return JSON.parse(JSON.stringify(datos));
}

/** Primer nombre libre de la forma «base», «base (2)», «base (3)»… dentro de un módulo. */
function nombreLibreTrabajo(trabajos, modulo, base) {
  const usados = trabajos.filter(t => t.modulo === modulo).map(t => t.nombre);
  if (!usados.some(u => mismoNombreTrabajo(u, base))) return base;
  let n = 2;
  while (usados.some(u => mismoNombreTrabajo(u, base + ' (' + n + ')'))) n++;
  return base + ' (' + n + ')';
}

/**
 * Inserta o reemplaza (mismo módulo y nombre, sin distinguir mayúsculas) un trabajo.
 * Devuelve { ok, trabajos, id } o { ok:false, error }.
 */
function insertarTrabajo(trabajos, modulo, nombre, datos, ahora) {
  const existente = trabajos.find(t => t.modulo === modulo && mismoNombreTrabajo(t.nombre, nombre));
  if (!existente && trabajos.filter(t => t.modulo === modulo).length >= MAX_TRABAJOS_POR_MODULO) {
    return { ok: false, error: 'Ya tienes ' + MAX_TRABAJOS_POR_MODULO + ' trabajos guardados en este módulo. Elimina alguno para guardar otro.' };
  }
  const trabajo = {
    id: existente ? existente.id : nuevoIdTrabajo(),
    nombre,
    modulo,
    fecha: (ahora || new Date()).toISOString(),
    datos: copiarTrabajo(datos)
  };
  return {
    ok: true,
    id: trabajo.id,
    reemplazo: !!existente,
    trabajos: existente ? trabajos.map(t => t.id === existente.id ? trabajo : t) : trabajos.concat(trabajo)
  };
}

/** Cambia el nombre de un trabajo. Falla si otro trabajo del mismo módulo ya usa ese nombre. */
function renombrarTrabajo(trabajos, id, nombre) {
  const actual = trabajos.find(t => t.id === id);
  if (!actual) return { ok: false, error: 'El trabajo ya no existe.' };
  const choque = trabajos.find(t => t.id !== id && t.modulo === actual.modulo && mismoNombreTrabajo(t.nombre, nombre));
  if (choque) return { ok: false, error: 'Ya tienes otro trabajo con ese nombre.' };
  return { ok: true, trabajos: trabajos.map(t => t.id === id ? Object.assign({}, t, { nombre }) : t) };
}

function eliminarTrabajo(trabajos, id) {
  return trabajos.filter(t => t.id !== id);
}

/** Documento exportable con los trabajos de un módulo. */
function exportarTrabajos(trabajos, modulo, ahora) {
  return {
    version: 1,
    tipo: 'trabajos',
    modulo,
    fecha: (ahora || new Date()).toISOString(),
    trabajos: trabajos.filter(t => t.modulo === modulo).map(copiarTrabajo)
  };
}

/**
 * Fusiona trabajos importados dentro de la lista actual. Solo se aceptan los del
 * módulo indicado; siempre reciben id nuevo y, si el nombre ya existe, un sufijo
 * «(2)», «(3)»… para no pisar nada. Respeta el máximo por módulo.
 * Devuelve { ok, trabajos, agregados, omitidos } o { ok:false, error }.
 */
function fusionarTrabajosImportados(trabajos, documento, modulo) {
  const lista = documento && Array.isArray(documento.trabajos) ? documento.trabajos : (Array.isArray(documento) ? documento : null);
  if (!lista) return { ok: false, error: 'El archivo no contiene una lista de trabajos.' };
  const validos = depurarListaTrabajos(lista).filter(t => t.modulo === modulo);
  if (!validos.length) return { ok: false, error: 'El archivo no tiene trabajos de ' + (NOMBRES_MODULO_TRABAJO[modulo] || modulo) + '.' };
  let salida = trabajos.slice();
  let agregados = 0;
  for (const t of validos) {
    if (salida.filter(x => x.modulo === modulo).length >= MAX_TRABAJOS_POR_MODULO) break;
    const nombre = validarNombreTrabajo(t.nombre);
    if (!nombre.ok) continue;
    salida.push({
      id: nuevoIdTrabajo(),
      nombre: nombreLibreTrabajo(salida, modulo, nombre.valor),
      modulo,
      fecha: Number.isNaN(new Date(t.fecha).getTime()) ? new Date().toISOString() : t.fecha,
      datos: copiarTrabajo(t.datos)
    });
    agregados++;
  }
  return { ok: true, trabajos: salida, agregados, omitidos: validos.length - agregados };
}

const NOMBRES_MODULO_TRABAJO = { johnson: 'Johnson', asignacion: 'Asignación', northwest: 'Esquina noroeste', ordenamiento: 'Ordenamiento', arboles: 'Árboles' };
const NOMBRES_ORDENAMIENTO_TRABAJO = { selection: 'Selection', insertion: 'Insertion', bubble: 'Bubble', shell: 'Shell', merge: 'Merge' };

function pluralTrabajo(n, singular, plural) {
  return n + ' ' + (n === 1 ? singular : plural);
}

function resumenTrabajo(t) {
  try {
    const d = t.datos;
    if (t.modulo === 'johnson') return pluralTrabajo(d.grafo.nodos.length, 'nodo', 'nodos') + ' · ' + pluralTrabajo(d.grafo.conexiones.length, 'conexión', 'conexiones');
    if (t.modulo === 'asignacion') return pluralTrabajo(d.modelo.recursos.length, 'recurso', 'recursos') + ' · ' + pluralTrabajo(d.modelo.tareas.length, 'tarea', 'tareas');
    if (t.modulo === 'northwest') return pluralTrabajo(d.modelo.origenes.length, 'origen', 'orígenes') + ' · ' + pluralTrabajo(d.modelo.destinos.length, 'destino', 'destinos');
    if (t.modulo === 'ordenamiento') return (NOMBRES_ORDENAMIENTO_TRABAJO[d.algoritmo] || d.algoritmo) + ' Sort · ' + pluralTrabajo(d.valores.length, 'pino', 'pinos');
    if (t.modulo === 'arboles') return pluralTrabajo(d.modo === 'busqueda' ? d.secuencia.length : d.recorridos.inorden.length, 'nodo', 'nodos');
  } catch (error) { /* el resumen es opcional */ }
  return '';
}

/* ---------------- Almacenamiento ---------------- */

function leerTrabajos() {
  try {
    return depurarListaTrabajos(JSON.parse(localStorage.getItem(CLAVE_TRABAJOS) || '[]'));
  } catch (error) {
    return [];
  }
}

function escribirTrabajos(trabajos) {
  localStorage.setItem(CLAVE_TRABAJOS, JSON.stringify(trabajos));
}

/* ---------------- Puente con cada módulo (depende del DOM y del estado de la página) ---------------- */

function instantaneaTrabajoActual(modulo) {
  if (modulo === 'johnson') return { grafo: instantaneaGrafo(), vista: estadoJohnson.vista };
  if (modulo === 'asignacion') return Object.assign(serializarAsignacion(), {
    resultadoVigente: resultadoVigenteAsignacion(),
    pasoActual: estadoAsignacion.resultado ? estadoAsignacion.resultado.pasoActual : 0
  });
  if (modulo === 'northwest') return {
    modelo: estadoNorthwest.modelo,
    vista: estadoNorthwest.vista,
    resultadoVigente: resultadoVigenteNorthwest(),
    pasoActual: estadoNorthwest.resultado ? estadoNorthwest.resultado.pasoActual : 0
  };
  if (modulo === 'ordenamiento') return instantaneaOrdenamiento(estadoOrdenamiento, selectorVelocidad.value);
  if (modulo === 'arboles') return instantaneaArboles();
  throw new Error('Este módulo no admite trabajos guardados.');
}

function guardarTrabajoNombrado(modulo, nombre) {
  const resultado = insertarTrabajo(leerTrabajos(), modulo, nombre, instantaneaTrabajoActual(modulo));
  if (!resultado.ok) throw new Error(resultado.error);
  escribirTrabajos(resultado.trabajos);
  return resultado.id;
}

function aplicarTrabajoNombrado(trabajo) {
  const datos = trabajo.datos;
  if (trabajo.modulo === 'johnson') {
    const grafo = depurarGrafo(datos.grafo);
    if (!grafo) throw new Error('El grafo guardado no es válido.');
    aplicarGrafo(grafo);
    estado.visualizacionJohnson = null;
    estadoJohnson.resultado = null;
    estadoJohnson.firma = null;
    estadoJohnson.seleccion = null;
    guardar();
    dibujar();
    cambiarVistaJohnson(datos.vista === 'matriz' ? 'matriz' : 'grafo');
    return;
  }
  if (trabajo.modulo === 'asignacion') {
    const modelo = depurarModeloAsignacion(datos.modelo);
    if (!modelo) throw new Error('La matriz guardada no es válida.');
    estadoAsignacion.modelo = modelo;
    estadoAsignacion.objetivo = datos.objetivo === 'max' ? 'max' : 'min';
    estadoAsignacion.posiciones = depurarPosiciones(datos.posiciones, modelo);
    estadoAsignacion.vista = ['grafo', 'matriz'].includes(datos.vista) ? datos.vista : 'grafo';
    estadoAsignacion.resultado = null;
    estadoAsignacion.seleccion = null;
    estadoAsignacion.origenConexion = null;
    estadoAsignacion.historial = { pasado: [], futuro: [] };
    matrizAsig.invalidas = {};
    guardarAsignacion();
    emitirCambioAsignacion('cargar-trabajo');
    if (datos.resultadoVigente && resolverAsignacion()) {
      if (estadoAsignacion.resultado) {
        const maximoPaso = estadoAsignacion.resultado.datos.pasos.length - 1;
        estadoAsignacion.resultado.pasoActual = Number.isInteger(datos.pasoActual)
          ? Math.max(0, Math.min(maximoPaso, datos.pasoActual)) : 0;
      }
      cambiarVistaAsignacion(['grafo', 'matriz', 'resultado', 'procedimiento'].includes(datos.vista) ? datos.vista : 'grafo');
    }
    return;
  }
  if (trabajo.modulo === 'northwest') {
    const modelo = depurarModeloNorthwest(datos.modelo);
    if (!modelo) throw new Error('Los datos de transporte guardados no son válidos.');
    estadoNorthwest.modelo = modelo;
    estadoNorthwest.vista = ['datos', 'balanceo', 'resolucion', 'resultado'].includes(datos.vista) ? datos.vista : 'datos';
    estadoNorthwest.resultado = null;
    estadoNorthwest.historial = { pasado: [], futuro: [] };
    tablaNw.invalidas = {};
    guardarNorthwest();
    emitirCambioNorthwest('cargar-trabajo');
    if (datos.resultadoVigente) {
      const resultado = resolverNorthwestCompleto();
      resultado.pasoActual = Number.isInteger(datos.pasoActual)
        ? Math.max(0, Math.min(resultado.datos.pasos.length - 1, datos.pasoActual)) : 0;
      cambiarVistaNorthwest(estadoNorthwest.vista);
    }
    return;
  }
  if (trabajo.modulo === 'ordenamiento') {
    const limpio = depurarEstadoOrdenamiento(datos);
    if (!limpio) throw new Error('El trabajo de ordenamiento no es válido.');
    aplicarEstadoOrdenamiento(limpio);
    return;
  }
  if (trabajo.modulo === 'arboles') {
    const limpio = restaurarEstadoArboles(datos);
    if (!limpio) throw new Error('El árbol guardado no es válido.');
    aplicarNuevoArbol(limpio.raiz, limpio.modo, limpio.secuencia);
    const recorrido = ['preorden', 'inorden', 'postorden'].includes(datos.recorrido) ? datos.recorrido : 'preorden';
    arbolElemento('selectorRecorrido').value = recorrido;
    cambiarRecorridoArbol();
    arbol.pasoRecorrido = Number.isInteger(datos.pasoRecorrido)
      ? Math.max(0, Math.min(arbol.historialRecorrido.length, datos.pasoRecorrido)) : 0;
    actualizarVisualArbol();
    if (limpio.modo === 'reconstruido') {
      const recorridos = recorridosArbol(limpio.raiz);
      Object.entries(recorridos).forEach(([nombre, valores]) => {
        arbolElemento('entrada' + nombre[0].toUpperCase() + nombre.slice(1)).value = valores.join(', ');
      });
      arbolElemento('modoReconstruccion').value = 'todos';
      actualizarCamposReconstruccion();
    }
    return;
  }
  throw new Error('El algoritmo del trabajo guardado no está disponible.');
}

/* ---------------- Panel «Mis trabajos» ---------------- */

function fechaTrabajo(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function avisarTrabajo(texto, tipo) {
  let pila = document.getElementById('gdAvisos');
  if (!pila) {
    pila = document.createElement('div');
    pila.id = 'gdAvisos';
    pila.className = 'gd-avisos';
    pila.setAttribute('role', 'status');
    pila.setAttribute('aria-live', 'polite');
    document.body.appendChild(pila);
  }
  const aviso = document.createElement('div');
  aviso.className = 'gd-aviso gd-aviso--' + (tipo || 'ok');
  aviso.textContent = texto;
  pila.appendChild(aviso);
  setTimeout(() => aviso.remove(), 3500);
}

function descargarJsonTrabajos(documento, nombreArchivo) {
  const blob = new Blob([JSON.stringify(documento, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function crearPanelTrabajos(modulo) {
  const el = (etiqueta, clase, texto) => {
    const e = document.createElement(etiqueta);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  };
  let confirmacion = null;     // { id, tipo: 'cargar' | 'eliminar' | 'renombrar' }
  let resaltado = null;
  let abridor = null;

  const fondo = el('div', 'gd-fondo');
  fondo.hidden = true;
  const panel = el('section', 'gd-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'gdTitulo');

  const cab = el('header', 'gd-cab');
  const titulos = el('div');
  const titulo = el('h3', '', 'Mis trabajos');
  titulo.id = 'gdTitulo';
  titulos.append(titulo, el('p', 'gd-sub', NOMBRES_MODULO_TRABAJO[modulo]));
  const cerrar = el('button', 'btn btn-fantasma btn-icono', '✕');
  cerrar.type = 'button';
  cerrar.setAttribute('aria-label', 'Cerrar');
  cab.append(titulos, cerrar);

  const form = el('form', 'gd-guardar');
  form.noValidate = true;
  const etiqueta = el('label', 'gd-etiqueta', 'Guardar lo que tienes ahora');
  etiqueta.htmlFor = 'gdNombre';
  const fila = el('div', 'gd-fila');
  const nombre = el('input', 'entrada');
  nombre.id = 'gdNombre';
  nombre.type = 'text';
  nombre.maxLength = MAX_LARGO_NOMBRE_TRABAJO;
  nombre.autocomplete = 'off';
  nombre.placeholder = 'Nombre, p. ej. «Ejemplo de clase»';
  const botonGuardar = el('button', 'btn btn-primary', 'Guardar');
  botonGuardar.type = 'submit';
  botonGuardar.id = 'gdGuardar';
  fila.append(nombre, botonGuardar);
  const ayuda = el('p', 'gd-ayuda');
  ayuda.setAttribute('role', 'status');
  form.append(etiqueta, fila, ayuda);

  const listaCab = el('div', 'gd-lista-cab');
  const contador = el('span', 'gd-contador');
  const herramientas = el('div', 'gd-herramientas');
  const btnExportar = el('button', 'btn btn-fantasma btn-sm', 'Exportar');
  btnExportar.type = 'button';
  btnExportar.title = 'Descargar todos los trabajos de este módulo como JSON';
  const btnImportar = el('button', 'btn btn-fantasma btn-sm', 'Importar');
  btnImportar.type = 'button';
  btnImportar.title = 'Añadir trabajos desde un archivo JSON exportado antes';
  herramientas.append(btnExportar, btnImportar);
  listaCab.append(el('h4', '', 'Guardados'), contador, herramientas);
  const lista = el('ul', 'gd-lista');
  const pie = el('p', 'gd-pie', 'Se guardan solo en este navegador. Cargar un trabajo reemplaza lo que tienes en pantalla. Usa «Exportar» para llevarlos a otro equipo.');
  panel.append(cab, form, listaCab, lista, pie);
  fondo.appendChild(panel);
  document.body.appendChild(fondo);

  function trabajosDelModulo() {
    return leerTrabajos().filter(t => t.modulo === modulo).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  function nombreSugerido() {
    return nombreLibreTrabajo(leerTrabajos(), modulo, 'Trabajo ' + (trabajosDelModulo().length + 1));
  }

  function actualizarAyuda() {
    const texto = nombre.value.trim();
    const existe = texto && trabajosDelModulo().some(t => mismoNombreTrabajo(t.nombre, texto));
    botonGuardar.textContent = existe ? 'Reemplazar' : 'Guardar';
    ayuda.className = 'gd-ayuda' + (existe ? ' gd-ayuda--aviso' : '');
    ayuda.textContent = existe ? 'Ya tienes un trabajo con ese nombre: se reemplazará con lo actual.' : '';
    nombre.removeAttribute('aria-invalid');
  }

  function dibujarLista() {
    const trabajos = trabajosDelModulo();
    contador.textContent = trabajos.length + ' / ' + MAX_TRABAJOS_POR_MODULO;
    btnExportar.disabled = !trabajos.length;
    lista.replaceChildren();
    if (!trabajos.length) {
      const vacio = el('li', 'gd-vacio');
      vacio.append(el('strong', '', 'Aún no hay nada guardado'), el('span', '', 'Escribe un nombre arriba y pulsa «Guardar»: tus trabajos aparecerán aquí.'));
      lista.appendChild(vacio);
      return;
    }
    trabajos.forEach(t => {
      const item = el('li', 'gd-item' + (t.id === resaltado ? ' gd-item--nuevo' : ''));
      const datos = el('div', 'gd-datos');
      const botones = el('div', 'gd-botones');
      const boton = (texto, clase, accion, extra) => {
        const b = el('button', 'btn btn-sm ' + clase, texto);
        b.type = 'button';
        if (extra) b.dataset.gd = extra;
        b.addEventListener('click', accion);
        botones.appendChild(b);
        return b;
      };
      const enConfirmacion = confirmacion && confirmacion.id === t.id;

      if (enConfirmacion && confirmacion.tipo === 'renombrar') {
        item.classList.add('gd-item--confirma');
        const campo = el('input', 'entrada');
        campo.type = 'text';
        campo.value = t.nombre;
        campo.maxLength = MAX_LARGO_NOMBRE_TRABAJO;
        campo.setAttribute('aria-label', 'Nuevo nombre');
        const error = el('span', 'gd-pregunta gd-pregunta--error');
        error.hidden = true;
        datos.append(campo, error);
        const confirmar = () => {
          const validacion = validarNombreTrabajo(campo.value);
          const resultado = validacion.ok ? renombrarTrabajo(leerTrabajos(), t.id, validacion.valor) : validacion;
          if (!resultado.ok) { error.textContent = resultado.error; error.hidden = false; campo.focus(); return; }
          try { escribirTrabajos(resultado.trabajos); } catch (e) { avisarTrabajo('No se pudo guardar el nuevo nombre.', 'error'); return; }
          confirmacion = null;
          avisarTrabajo('Trabajo renombrado a «' + validacion.valor + '».');
          actualizarAyuda();
          dibujarLista();
        };
        campo.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); confirmar(); }
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); confirmacion = null; dibujarLista(); }
        });
        boton('Guardar nombre', 'btn-primary', confirmar, 'confirmar');
        boton('Cancelar', 'btn-neutral', () => { confirmacion = null; dibujarLista(); });
        setTimeout(() => { campo.focus(); campo.select(); }, 0);
      } else {
        datos.appendChild(el('strong', 'gd-nombre', t.nombre));
        datos.appendChild(el('span', 'gd-meta', [resumenTrabajo(t), fechaTrabajo(t.fecha)].filter(Boolean).join(' · ')));
        if (enConfirmacion) {
          item.classList.add('gd-item--confirma');
          datos.appendChild(el('span', 'gd-pregunta', confirmacion.tipo === 'cargar'
            ? 'Esto reemplazará lo que tienes en pantalla.'
            : '¿Eliminar este trabajo? No se puede deshacer.'));
          const si = boton(confirmacion.tipo === 'cargar' ? 'Sí, cargar' : 'Sí, eliminar',
            confirmacion.tipo === 'cargar' ? 'btn-primary' : 'btn-peligro', () => ejecutar(t), 'confirmar');
          boton('Cancelar', 'btn-neutral', () => { confirmacion = null; dibujarLista(); });
          setTimeout(() => si.focus(), 0);
        } else {
          boton('Cargar', 'btn-secondary', () => { confirmacion = { id: t.id, tipo: 'cargar' }; dibujarLista(); }, 'cargar');
          boton('Renombrar', 'btn-fantasma', () => { confirmacion = { id: t.id, tipo: 'renombrar' }; dibujarLista(); }, 'renombrar');
          boton('Eliminar', 'btn-fantasma', () => { confirmacion = { id: t.id, tipo: 'eliminar' }; dibujarLista(); }, 'eliminar');
        }
      }
      item.append(datos, botones);
      lista.appendChild(item);
    });
  }

  function ejecutar(t) {
    const tipo = confirmacion.tipo;
    confirmacion = null;
    if (tipo === 'eliminar') {
      try {
        escribirTrabajos(eliminarTrabajo(leerTrabajos(), t.id));
        avisarTrabajo('Trabajo «' + t.nombre + '» eliminado.', 'info');
      } catch (error) {
        avisarTrabajo('No se pudo eliminar el trabajo.', 'error');
      }
      actualizarAyuda();
      dibujarLista();
      return;
    }
    try {
      aplicarTrabajoNombrado(t);
      cerrarPanel(false);
      avisarTrabajo('Trabajo «' + t.nombre + '» cargado.');
    } catch (error) {
      avisarTrabajo(error.message || 'No se pudo cargar el trabajo guardado.', 'error');
      dibujarLista();
    }
  }

  form.addEventListener('submit', evento => {
    evento.preventDefault();
    const validacion = validarNombreTrabajo(nombre.value);
    if (!validacion.ok) {
      nombre.setAttribute('aria-invalid', 'true');
      ayuda.className = 'gd-ayuda gd-ayuda--error';
      ayuda.textContent = validacion.error;
      nombre.focus();
      return;
    }
    const texto = validacion.valor;
    const reemplaza = trabajosDelModulo().some(t => mismoNombreTrabajo(t.nombre, texto));
    try {
      resaltado = guardarTrabajoNombrado(modulo, texto);
    } catch (error) {
      ayuda.className = 'gd-ayuda gd-ayuda--error';
      ayuda.textContent = error && error.message && !/quota|exceeded/i.test(error.message)
        ? error.message
        : 'No se pudo guardar: el navegador no tiene espacio o bloquea el almacenamiento.';
      return;
    }
    nombre.value = '';
    confirmacion = null;
    actualizarAyuda();
    dibujarLista();
    avisarTrabajo(reemplaza ? 'Trabajo «' + texto + '» reemplazado.' : 'Trabajo «' + texto + '» guardado.');
  });
  nombre.addEventListener('input', actualizarAyuda);

  btnExportar.addEventListener('click', () => {
    const documento = exportarTrabajos(leerTrabajos(), modulo);
    if (!documento.trabajos.length) { avisarTrabajo('No hay trabajos para exportar.', 'info'); return; }
    descargarJsonTrabajos(documento, 'trabajos_' + modulo + '_' + new Date().toISOString().slice(0, 10) + '.json');
    avisarTrabajo(pluralTrabajo(documento.trabajos.length, 'trabajo exportado', 'trabajos exportados') + '.');
  });

  btnImportar.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = evento => {
      const archivo = evento.target.files[0];
      if (!archivo) return;
      const lector = new FileReader();
      lector.onload = e => {
        try {
          const resultado = fusionarTrabajosImportados(leerTrabajos(), JSON.parse(e.target.result), modulo);
          if (!resultado.ok) throw new Error(resultado.error);
          escribirTrabajos(resultado.trabajos);
          confirmacion = null;
          actualizarAyuda();
          dibujarLista();
          avisarTrabajo(pluralTrabajo(resultado.agregados, 'trabajo importado', 'trabajos importados') +
            (resultado.omitidos ? ' · ' + resultado.omitidos + ' omitidos por el límite' : '') + '.');
        } catch (error) {
          avisarTrabajo('No se pudo importar: ' + (error.message || 'archivo no válido.'), 'error');
        }
      };
      lector.readAsText(archivo);
    };
    input.click();
  });

  function cerrarPanel(devolverFoco) {
    fondo.hidden = true;
    document.body.classList.remove('gd-abierto');
    confirmacion = null;
    if (devolverFoco !== false && abridor) abridor.focus();
  }

  cerrar.addEventListener('click', () => cerrarPanel());
  fondo.addEventListener('click', e => { if (e.target === fondo) cerrarPanel(); });
  // Mientras el panel está abierto, los atajos del módulo (flechas, espacio, Ctrl+Z…) no deben actuar.
  document.addEventListener('keydown', e => {
    if (fondo.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); cerrarPanel(); return; }
    if (e.key !== 'Tab') return;
    const foco = Array.from(panel.querySelectorAll('button, input')).filter(x => !x.disabled && x.offsetParent !== null);
    if (!foco.length) return;
    const primero = foco[0], ultimo = foco[foco.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); primero.focus(); }
    else if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }, true);

  return function abrirPanel(modo, boton) {
    abridor = boton;
    resaltado = null;
    confirmacion = null;
    nombre.value = modo === 'guardar' ? nombreSugerido() : '';
    actualizarAyuda();
    dibujarLista();
    fondo.hidden = false;
    document.body.classList.add('gd-abierto');
    if (modo === 'guardar') { nombre.focus(); nombre.select(); }
    else (lista.querySelector('[data-gd="cargar"]') || nombre).focus();
  };
}

function instalarGuardadosNombrados() {
  if (typeof document === 'undefined') return;
  const modulo = document.body.dataset.modulo;
  if (!NOMBRES_MODULO_TRABAJO[modulo]) return;
  const acciones = document.querySelector('.topbar__acciones');
  if (!acciones) return;

  let abrir = null;
  const boton = (texto, modo, clase, titulo) => {
    const elemento = document.createElement('button');
    elemento.type = 'button';
    elemento.className = 'btn ' + clase + ' btn-sm';
    elemento.textContent = texto;
    elemento.title = titulo;
    elemento.dataset.accionTrabajo = modo;
    elemento.addEventListener('click', () => {
      if (!abrir) abrir = crearPanelTrabajos(modulo);
      abrir(modo, elemento);
    });
    acciones.appendChild(elemento);
  };
  boton('Guardar', 'guardar', 'btn-secondary', 'Guardar este trabajo con un nombre');
  boton('Cargar', 'cargar', 'btn-neutral', 'Abrir un trabajo guardado');
}

instalarGuardadosNombrados();
