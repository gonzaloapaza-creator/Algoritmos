/* Estado del módulo de transporte (esquina noroeste), persistencia y deshacer/rehacer.
 * Independiente del estado de Johnson y del de Asignación. */

'use strict';

const VISTAS_NORTHWEST = ['datos', 'balanceo', 'resolucion', 'resultado'];

const estadoNorthwest = {
  modelo: crearModeloNorthwest(),
  vista: 'datos',
  resultado: null,         // { firma, vigente, balance, datos, pasoActual }
  historial: { pasado: [], futuro: [] },
  escuchas: []
};

function alCambiarNorthwest(fn) { estadoNorthwest.escuchas.push(fn); }
function emitirCambioNorthwest(motivo) { estadoNorthwest.escuchas.forEach(fn => fn(motivo)); }

/* ---------------- Persistencia ---------------- */

function guardarNorthwest() {
  if (typeof permiteEscrituraGuardado === 'function' && !permiteEscrituraGuardado(NORTHWEST_STORAGE_KEY)) return false;
  // Sin almacenamiento la aplicación sigue funcionando; el aviso se muestra una sola vez.
  escribirAlmacenamientoLocal(NORTHWEST_STORAGE_KEY, JSON.stringify({ version: 1, modelo: estadoNorthwest.modelo, vista: estadoNorthwest.vista }), { respaldo: 'usa «Exportar JSON» en el panel Ejemplos' });
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
        estadoNorthwest.vista = datos.vista === 'balanceo' ? 'balanceo' : 'datos';
        return 'guardado';
      }
    }
  } catch (e) {
    if (crudo) {
      if (typeof protegerGuardadoIncompatible === 'function') protegerGuardadoIncompatible(NORTHWEST_STORAGE_KEY, crudo, e.message);
      estadoNorthwest.modelo = ejemploNorthwest('balanceado');
      return 'incompatible';
    }
  }
  estadoNorthwest.modelo = ejemploNorthwest('balanceado');
  guardarNorthwest();
  return 'nuevo';
}

/* ---------------- Deshacer / rehacer ---------------- */

function instantaneaNorthwest() { return clonarModeloNorthwest(estadoNorthwest.modelo); }

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
  estadoNorthwest.modelo = estadoNorthwest.historial.pasado.pop();
  comprobarVigenciaNorthwest();
  guardarNorthwest();
  emitirCambioNorthwest('deshacer');
  return true;
}

function rehacerNorthwest() {
  if (!puedeRehacerNorthwest()) return false;
  estadoNorthwest.historial.pasado.push(instantaneaNorthwest());
  estadoNorthwest.modelo = estadoNorthwest.historial.futuro.pop();
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
  } catch (error) {
    estadoNorthwest.modelo = anterior;
    throw error;
  }
  if (JSON.stringify(anterior) === JSON.stringify(estadoNorthwest.modelo)) return false;
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
  return !!(estadoNorthwest.resultado && estadoNorthwest.resultado.vigente);
}

/** Balancea el modelo actual y ejecuta la esquina noroeste. */
function resolverNorthwestCompleto() {
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
