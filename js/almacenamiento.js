/* Guardado del grafo en el navegador: el autoguardado y la biblioteca de grafos. */

'use strict';

// Las constantes CLAVE_ALMACEN y CLAVE_BIBLIOTECA ahora vienen de config.js

/**
 * Crea una copia del grafo actual, lista para guardarse.
 * No incluye el resaltado visual de Johnson (estado.visualizacionJohnson).
 * @returns {{nodos:Array, conexiones:Array, siguienteId:number}} Copia del estado actual
 */
function instantaneaGrafo() {
  return {
    nodos: estado.nodos.map(n => ({ id: n.id, nombre: n.nombre, x: n.x, y: n.y })),
    conexiones: estado.conexiones.map(c => ({ id: c.id, desde: c.desde, hacia: c.hacia, valor: c.valor })),
    siguienteId: estado.siguienteId
  };
}

/**
 * Valida datos del almacenamiento sin reparar ni eliminar registros.
 * Conserva el nombre histórico por compatibilidad con los consumidores.
 * @param {Object} datos - Datos crudos del almacenamiento
 * @returns {{nodos:Array, conexiones:Array, siguienteId:number}|null}
 *          Copia completa o null si los datos son incompatibles
 */
function depurarGrafo(datos) {
  const validacion = validarGrafoImportado(datos);
  return validacion.ok ? validacion.grafo : null;
}

// Normaliza únicamente el contador de versiones antiguas; nunca elimina datos.
function copiarGrafoValidado(datos) {
  // La validación compara nombres recortados; el modelo debe conservar esa misma
  // forma para que un documento antiguo con espacios no permita un homónimo.
  const nodos = datos.nodos.map(n => ({ id: n.id, nombre: n.nombre.trim(), x: n.x, y: n.y }));
  const conexiones = datos.conexiones.map(c => ({ id: c.id, desde: c.desde, hacia: c.hacia, valor: c.valor }));

  // El contador debe quedar por encima del número más alto ya usado,
  // o los identificadores nuevos chocarían con los recuperados.
  let mayor = 0;
  nodos.concat(conexiones).forEach(objeto => {
    const numero = Number(String(objeto.id).split('_')[1]);
    if (Number.isInteger(numero) && numero > mayor) mayor = numero;
  });
  const guardado = datos.siguienteId;
  const siguienteId = Number.isInteger(guardado) && guardado > mayor ? guardado : mayor + 1;

  return { nodos: nodos, conexiones: conexiones, siguienteId: siguienteId };
}

/**
 * Validación estricta para importar un grafo (archivo JSON o «Mis trabajos»).
 * No descarta nada en silencio: devuelve la lista
 * de problemas para que el usuario corrija el archivo y el grafo abierto quede intacto.
 * Aplica las mismas reglas que la interfaz (nombres únicos de hasta MAX_LARGO_NOMBRE
 * caracteres, pesos enteros entre -MAX_PESO y MAX_PESO).
 * @param {Object} datos - { nodos, conexiones, siguienteId }
 * @returns {{ok:true, grafo:Object}|{ok:false, errores:string[]}}
 */
function validarGrafoImportado(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object' || !Array.isArray(datos.nodos) || !Array.isArray(datos.conexiones)) {
    return { ok: false, errores: ['El archivo no contiene las listas «nodos» y «conexiones».'] };
  }
  if (datos.nodos.length > 40 || datos.conexiones.length > 300) {
    return { ok: false, errores: ['El editor admite hasta 40 nodos y 300 conexiones. Conserva el original y divide el ejercicio.'] };
  }
  if (datos.siguienteId !== undefined && (!Number.isSafeInteger(datos.siguienteId) || datos.siguienteId < 1 || datos.siguienteId >= Number.MAX_SAFE_INTEGER)) {
    errores.push('El contador de identificadores debe ser un entero positivo seguro.');
  }
  const ids = new Set(), nombres = new Set();
  datos.nodos.forEach((n, i) => {
    const ref = 'Nodo ' + (i + 1);
    if (!n || typeof n.id !== 'string' || !n.id.trim()) { errores.push(ref + ': falta el identificador.'); return; }
    if (n.id.length > 80) errores.push(ref + ': identificador demasiado largo (máximo 80).');
    if (ids.has(n.id)) errores.push(ref + ': identificador «' + n.id + '» repetido.');
    ids.add(n.id);
    const nombre = typeof n.nombre === 'string' ? n.nombre.trim() : '';
    if (nombre === '') errores.push(ref + ' (' + n.id + '): el nombre está vacío.');
    else if (n.nombre.length > MAX_LARGO_NOMBRE) errores.push(ref + ' (' + n.id + '): nombre de más de ' + MAX_LARGO_NOMBRE + ' caracteres.');
    else if (nombres.has(nombre.toLowerCase())) errores.push(ref + ' (' + n.id + '): el nombre «' + nombre + '» está repetido.');
    nombres.add(nombre.toLowerCase());
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) errores.push(ref + ' (' + n.id + '): posición no numérica.');
    else if (Math.abs(n.x) > 1000000 || Math.abs(n.y) > 1000000) errores.push(ref + ': posición fuera del rango ±1000000.');
  });
  const idsConexion = new Set(), parejas = new Set();
  datos.conexiones.forEach((c, i) => {
    const ref = 'Conexión ' + (i + 1);
    if (!c || typeof c.id !== 'string' || !c.id.trim()) { errores.push(ref + ': falta el identificador.'); return; }
    if (c.id.length > 80) errores.push(ref + ': identificador demasiado largo (máximo 80).');
    if (idsConexion.has(c.id) || ids.has(c.id)) errores.push(ref + ': identificador «' + c.id + '» repetido.');
    idsConexion.add(c.id);
    const pareja = JSON.stringify([c.desde, c.hacia]);
    if (c.desde === c.hacia) errores.push(ref + ': Selecciona otro vértice: no se permiten conexiones consigo mismo.');
    if (parejas.has(pareja)) errores.push(ref + ': conexión repetida. Esta conexión ya existe. Puedes editar su peso.');
    if (parejas.has(JSON.stringify([c.hacia, c.desde]))) errores.push(ref + ': Ya existe una conexión entre estos vértices en el sentido contrario.');
    parejas.add(pareja);
    if (!ids.has(c.desde)) errores.push(ref + ' (' + c.id + '): el nodo de origen «' + c.desde + '» no existe.');
    if (!ids.has(c.hacia)) errores.push(ref + ' (' + c.id + '): el nodo de destino «' + c.hacia + '» no existe.');
    if (!Number.isInteger(c.valor)) errores.push(ref + ' (' + c.id + '): el peso debe ser un número entero.');
    else if (Math.abs(c.valor) > MAX_PESO) errores.push(ref + ' (' + c.id + '): el peso debe estar entre -' + MAX_PESO + ' y ' + MAX_PESO + '.');
  });
  if (errores.length) return { ok: false, errores };
  const grafo = copiarGrafoValidado(datos);
  if (!Number.isSafeInteger(grafo.siguienteId) || grafo.siguienteId >= Number.MAX_SAFE_INTEGER) return { ok: false, errores: ['Los identificadores numéricos exceden el rango seguro.'] };
  return { ok: true, grafo };
}

/** Regla del editor Johnson, independiente de los nombres y de su posición. */
function validarConexionJohnson(grafo, desde, hacia, idExcluir) {
  if (!grafo.nodos.some(n => n.id === desde) || !grafo.nodos.some(n => n.id === hacia)) return { ok: false, error: 'El vértice de origen o destino ya no existe.' };
  if (desde === hacia) return { ok: false, error: 'Selecciona otro vértice: no se permiten conexiones consigo mismo.' };
  const otras = grafo.conexiones.filter(c => c.id !== idExcluir);
  if (otras.some(c => c.desde === desde && c.hacia === hacia)) return { ok: false, error: 'Esta conexión ya existe. Puedes editar su peso.' };
  if (otras.some(c => c.desde === hacia && c.hacia === desde)) return { ok: false, error: 'Ya existe una conexión entre estos vértices en el sentido contrario.' };
  return { ok: true };
}

/** Crear o editar extremos/peso de forma atómica; los rechazos no tocan estado ni historial. */
function guardarConexionJohnson(desde, hacia, valor, idEditar) {
  const validacion = validarConexionJohnson(estado, desde, hacia, idEditar);
  if (!validacion.ok) return validacion;
  if (idEditar && !buscarConexion(idEditar)) return { ok: false, error: 'La conexión ya no existe.' };
  if (!Number.isInteger(valor) || Math.abs(valor) > MAX_PESO) return { ok: false, error: 'El peso debe ser un entero entre -' + MAX_PESO + ' y ' + MAX_PESO + '.' };
  if (!idEditar && estado.conexiones.length >= 300) return { ok: false, error: 'El editor admite hasta 300 conexiones.' };
  guardarEstadoParaDeshacer();
  if (idEditar) Object.assign(buscarConexion(idEditar), { desde, hacia, valor });
  else estado.conexiones.push({ id: nuevoId('c'), desde, hacia, valor });
  guardar(); dibujar();
  return { ok: true };
}

/** Reemplaza el grafo en pantalla por uno ya depurado. */
function aplicarGrafo(limpio) {
  const validacion = validarGrafoImportado(limpio);
  if (!validacion.ok) throw new Error(resumirErroresImportacion(validacion.errores));
  limpio = validacion.grafo;
  estado.nodos = limpio.nodos;
  estado.conexiones = limpio.conexiones;
  estado.siguienteId = limpio.siguienteId;
  estado.seleccion = null;
  estado.origenConexion = null;
  // También al cargar un trabajo nombrado: ajustar la vista nunca altera el grafo.
  if (typeof restablecerZoomSilencioso === 'function' && area().ancho >= 50 && area().alto >= 50) {
    // Primero medir las etiquetas del grafo nuevo, sin reutilizar cajas del anterior.
    if (typeof dibujarLienzo === 'function') dibujarLienzo();
    restablecerZoomSilencioso();
  }
}

/**
 * Guarda el grafo actual en localStorage (autoguardado).
 * Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando.
 */
function guardar() {
  if (!validarGrafoImportado(instantaneaGrafo()).ok) return false;
  // Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando y se avisa una sola vez.
  escribirAlmacenamientoLocal(CLAVE_ALMACEN, JSON.stringify(instantaneaGrafo()), { respaldo: 'usa «Más → Exportar JSON»' });
}

/**
 * Recupera el grafo del autoguardado desde localStorage.
 * Si los datos están corruptos o no existen, deja el grafo vacío.
 */
function cargar() {
  let crudo;
  try {
    crudo = localStorage.getItem(CLAVE_ALMACEN);
    if (!crudo) return;
    const validacion = validarGrafoImportado(JSON.parse(crudo));
    if (!validacion.ok) throw new Error(resumirErroresImportacion(validacion.errores));
    aplicarGrafo(validacion.grafo);
  } catch (e) {
    if (crudo) protegerGuardadoIncompatible(CLAVE_ALMACEN, crudo, e.message);
  }
}

function borrarGuardado() {
  if (!permiteEscrituraGuardado(CLAVE_ALMACEN)) return;
  try { localStorage.removeItem(CLAVE_ALMACEN); } catch (e) { /* sin almacenamiento */ }
}

/* ---------------- Biblioteca de grafos ---------------- */

/** Lista de grafos guardados, descartando las entradas dañadas. @returns {Array} */
function leerBiblioteca() {
  try {
    const crudo = localStorage.getItem(CLAVE_BIBLIOTECA);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    if (!Array.isArray(datos)) throw new Error('La biblioteca no contiene una lista de grafos.');
    if (new Set(datos.map(g => g && g.id)).size !== datos.length) throw new Error('La biblioteca contiene identificadores repetidos.');

    return datos
      .map(g => {
        const validacion = validarGrafoImportado(g);
        if (!g || typeof g.id !== 'string' || typeof g.nombre !== 'string') throw new Error('Hay un registro sin nombre o identificador.');
        if (!validacion.ok) return g; // Visible y exportable, se rechaza únicamente su carga.
        const limpio = validacion.grafo;
        return {
          id: g.id,
          nombre: g.nombre,
          fecha: typeof g.fecha === 'string' ? g.fecha : '',
          nodos: limpio.nodos,
          conexiones: limpio.conexiones,
          siguienteId: limpio.siguienteId
        };
      });
  } catch (e) {
    try { const crudo = localStorage.getItem(CLAVE_BIBLIOTECA); if (crudo) protegerGuardadoIncompatible(CLAVE_BIBLIOTECA, crudo, e.message); } catch (_) { /* almacenamiento no disponible */ }
    return [];
  }
}

/** @returns {boolean} false si el navegador no pudo guardar (por ejemplo, sin espacio). */
function escribirBiblioteca(lista) {
  if (!permiteEscrituraGuardado(CLAVE_BIBLIOTECA)) return false;
  try {
    localStorage.setItem(CLAVE_BIBLIOTECA, JSON.stringify(lista));
    return true;
  } catch (e) {
    return false;
  }
}
