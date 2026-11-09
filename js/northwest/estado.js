/* Estado del módulo de transporte (esquina noroeste), persistencia y deshacer/rehacer.
 * Independiente del estado de Johnson y del de Asignación. */

'use strict';

const VISTAS_NORTHWEST = ['datos', 'balanceo', 'resolucion', 'resultado'];

const estadoNorthwest = {
  modelo: crearModeloNorthwest(),
  vista: 'datos',
  resultado: null,         // { firma, vigente, balance, datos, pasoActual }
  invalidas: {},           // Borradores rechazados, asociados a IDs de celdas reales.
  historial: { pasado: [], futuro: [] },
  escuchas: []
};

function alCambiarNorthwest(fn) { estadoNorthwest.escuchas.push(fn); }
function emitirCambioNorthwest(motivo) { estadoNorthwest.escuchas.forEach(fn => fn(motivo)); }

/* ---------------- Persistencia ---------------- */

function guardarNorthwest() {
  if (typeof permiteEscrituraGuardado === 'function' && !permiteEscrituraGuardado(NORTHWEST_STORAGE_KEY)) return false;
  // Sin almacenamiento la aplicación sigue funcionando; el aviso se muestra una sola vez.
  escribirAlmacenamientoLocal(NORTHWEST_STORAGE_KEY, JSON.stringify({ version: 1, modelo: estadoNorthwest.modelo, vista: estadoNorthwest.vista, invalidas: estadoNorthwest.invalidas }), { respaldo: 'usa «Exportar JSON» en el panel Ejemplos' });
}

function cargarNorthwest() {
  let crudo;
  try {
    crudo = localStorage.getItem(NORTHWEST_STORAGE_KEY);
    if (crudo) {
      const datos = JSON.parse(crudo);
      if (!datos || datos.version !== 1) throw new Error('El autoguardado debe usar la versión 1.');
      const validacion = validarModeloNorthwestImportado(datos.modelo);
      if (!validacion.ok) throw new Error(validacion.errores.join(' '));
      const modelo = validacion.modelo;
      if (modelo) {
        estadoNorthwest.modelo = modelo;
        estadoNorthwest.invalidas = depurarInvalidasNorthwest(datos.invalidas, modelo);
        estadoNorthwest.resultado = null;
        estadoNorthwest.vista = datos.vista === 'balanceo' ? 'balanceo' : 'datos';
        return 'guardado';
      }
    }
  } catch (e) {
    if (crudo) {
      if (typeof protegerGuardadoIncompatible === 'function') protegerGuardadoIncompatible(NORTHWEST_STORAGE_KEY, crudo, e.message);
      estadoNorthwest.modelo = ejemploNorthwest('balanceado');
      estadoNorthwest.invalidas = {};
      return 'incompatible';
    }
  }
  estadoNorthwest.modelo = ejemploNorthwest('balanceado');
  estadoNorthwest.invalidas = {};
  guardarNorthwest();
  return 'nuevo';
}

/* ---------------- Deshacer / rehacer ---------------- */

function depurarInvalidasNorthwest(invalidas, modelo = estadoNorthwest.modelo) {
  const admitidas = new Set();
  modelo.origenes.forEach(o => { admitidas.add('oferta:' + o.id); modelo.destinos.forEach(d => admitidas.add('costo:' + o.id + '|' + d.id)); });
  modelo.destinos.forEach(d => admitidas.add('demanda:' + d.id));
  const limpias = {};
  if (!invalidas || typeof invalidas !== 'object' || Array.isArray(invalidas)) return limpias;
  Object.keys(invalidas).forEach(clave => {
    if (!admitidas.has(clave) || typeof invalidas[clave] !== 'string' || invalidas[clave].length > 200) return;
    const validar = clave.startsWith('costo:') ? validarCostoNorthwest : validarCantidadNorthwest;
    if (!validar(invalidas[clave]).ok) limpias[clave] = invalidas[clave];
  });
  return limpias;
}

function purgarInvalidasNorthwest() {
  estadoNorthwest.invalidas = depurarInvalidasNorthwest(estadoNorthwest.invalidas);
}

function hayPendientesNorthwest() { purgarInvalidasNorthwest(); return Object.keys(estadoNorthwest.invalidas).length > 0; }

function registrarBorradorNorthwest(clave, texto, esValido) {
  if (esValido) delete estadoNorthwest.invalidas[clave];
  else estadoNorthwest.invalidas[clave] = String(texto).slice(0, 200);
  purgarInvalidasNorthwest();
  guardarNorthwest();
  emitirCambioNorthwest('borrador');
}

function instantaneaNorthwest() { return { modelo: clonarModeloNorthwest(estadoNorthwest.modelo), invalidas: Object.assign({}, estadoNorthwest.invalidas) }; }

function restaurarInstantaneaNorthwest(foto) {
  // Las instantáneas de sesiones anteriores contenían solo el modelo.
  estadoNorthwest.modelo = clonarModeloNorthwest(foto.modelo || foto);
  estadoNorthwest.invalidas = depurarInvalidasNorthwest(foto.invalidas);
}

function guardarHistorialNorthwest() {
  estadoNorthwest.historial.pasado.push(instantaneaNorthwest());
  if (estadoNorthwest.historial.pasado.length > MAX_ACCIONES_DESHACER) estadoNorthwest.historial.pasado.shift();
  estadoNorthwest.historial.futuro = [];
}
function puedeDeshacerNorthwest() { return estadoNorthwest.historial.pasado.length > 0; }
function puedeRehacerNorthwest() { return estadoNorthwest.historial.futuro.length > 0; }

function deshacerNorthwest() {
  if (!puedeDeshacerNorthwest()) return false;
  estadoNorthwest.historial.futuro.push(instantaneaNorthwest());
  restaurarInstantaneaNorthwest(estadoNorthwest.historial.pasado.pop());
  comprobarVigenciaNorthwest();
  guardarNorthwest();
  emitirCambioNorthwest('deshacer');
  return true;
}

function rehacerNorthwest() {
  if (!puedeRehacerNorthwest()) return false;
  estadoNorthwest.historial.pasado.push(instantaneaNorthwest());
  restaurarInstantaneaNorthwest(estadoNorthwest.historial.futuro.pop());
  comprobarVigenciaNorthwest();
  guardarNorthwest();
  emitirCambioNorthwest('rehacer');
  return true;
}

/* ---------------- Cambios ---------------- */

function aplicarCambioNorthwest(cambio, opciones) {
  const opts = opciones || {};
  const anterior = instantaneaNorthwest();
  try {
    cambio(estadoNorthwest.modelo, estadoNorthwest);
    const validacion = validarModeloNorthwestImportado(estadoNorthwest.modelo);
    if (!validacion.ok) throw new Error(validacion.errores[0]);
    if (['ejemplo', 'limpiar', 'importar', 'trabajo'].includes(opts.motivo)) estadoNorthwest.invalidas = {};
    purgarInvalidasNorthwest();
  } catch (error) {
    restaurarInstantaneaNorthwest(anterior);
    throw error;
  }
  if (JSON.stringify(anterior) === JSON.stringify(instantaneaNorthwest())) return false;
  if (!opts.sinHistorial) {
    estadoNorthwest.historial.pasado.push(anterior);
    if (estadoNorthwest.historial.pasado.length > MAX_ACCIONES_DESHACER) estadoNorthwest.historial.pasado.shift();
    estadoNorthwest.historial.futuro = [];
  }
  comprobarVigenciaNorthwest();
  guardarNorthwest();
  emitirCambioNorthwest(opts.motivo || 'modelo');
  return true;
}

function comprobarVigenciaNorthwest() {
  purgarInvalidasNorthwest();
  if (!estadoNorthwest.resultado) return;
  estadoNorthwest.resultado.vigente = estadoNorthwest.resultado.firma === firmaModeloNorthwest(estadoNorthwest.modelo);
  sincronizarNombresNorthwest(estadoNorthwest.resultado.balance, estadoNorthwest.modelo);
}

/**
 * El balance guarda copias de los nombres al resolver. La firma no incluye nombres
 * (renombrar no invalida el resultado), así que se refrescan por id para que
 * resultado, procedimiento e impresión muestren siempre el nombre actual.
 * Los ficticios no están en el modelo y conservan su nombre.
 */
function sincronizarNombresNorthwest(balance, modelo) {
  if (!balance || !modelo) return;
  const actualizar = (lista, fuente) => {
    const porId = new Map(fuente.map(e => [e.id, e.nombre]));
    lista.forEach(e => { if (!e.ficticio && porId.has(e.id)) e.nombre = porId.get(e.id); });
  };
  actualizar(balance.origenes, modelo.origenes);
  actualizar(balance.destinos, modelo.destinos);
}

function resultadoVigenteNorthwest() {
  return resultadoConsultableNorthwest() && !hayPendientesNorthwest();
}

function resultadoConsultableNorthwest() {
  return !!(estadoNorthwest.resultado && estadoNorthwest.resultado.vigente && estadoNorthwest.resultado.firma === firmaModeloNorthwest(estadoNorthwest.modelo));
}

function avisoResultadoNorthwest() {
  return resultadoConsultableNorthwest() && hayPendientesNorthwest() ? 'Último cálculo válido; hay datos pendientes de corregir' : '';
}

/** Explica el estado sin ofrecer como consultable un cálculo de otros datos. */
function explicarEstadoResultadoNorthwest() {
  const pendientes = hayPendientesNorthwest();
  if (resultadoConsultableNorthwest()) {
    return pendientes ? avisoResultadoNorthwest() + '. Las cantidades y el costo visibles en Resultado y Procedimiento corresponden al modelo válido anterior, no al texto rechazado. Corrige las casillas marcadas antes de recalcular.' : '';
  }
  if (estadoNorthwest.resultado) {
    return 'Los datos cambiaron: el resultado anterior está invalidado y no hay valores consultables en Resultado ni en Procedimiento. ' +
      (pendientes ? 'Corrige las casillas marcadas y vuelve al balanceo para recalcular.' : 'Vuelve al balanceo para recalcular.');
  }
  return pendientes ? 'Aún no hay un cálculo. Corrige las casillas marcadas y confirma el balanceo para resolver.' : 'El resultado y el procedimiento aparecen después de confirmar el balanceo y resolver.';
}

/** Balancea el modelo actual y ejecuta la esquina noroeste. */
function resolverNorthwestCompleto() {
  if (hayPendientesNorthwest()) throw new Error(explicarEstadoResultadoNorthwest());
  const v = validarModeloNorthwest(estadoNorthwest.modelo);
  if (!v.ok) throw new Error(v.errores[0]);
  const balance = balancearNorthwest(estadoNorthwest.modelo);
  const datos = resolverEsquinaNoroeste(balance.costos, balance.ofertas, balance.demandas);
  estadoNorthwest.resultado = {
    firma: firmaModeloNorthwest(estadoNorthwest.modelo),
    vigente: true,
    balance,
    datos,
    pasoActual: 0
  };
  emitirCambioNorthwest('resultado');
  return estadoNorthwest.resultado;
}

function cambiarVistaNorthwest(vista) {
  if (!VISTAS_NORTHWEST.includes(vista)) return;
  estadoNorthwest.vista = vista;
  guardarNorthwest();
  emitirCambioNorthwest('vista');
}
