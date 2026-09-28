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
  try {
    localStorage.setItem(NORTHWEST_STORAGE_KEY, JSON.stringify({ version: 1, modelo: estadoNorthwest.modelo, vista: estadoNorthwest.vista }));
  } catch (e) { /* sin almacenamiento */ }
}

function cargarNorthwest() {
  try {
    const crudo = localStorage.getItem(NORTHWEST_STORAGE_KEY);
    if (crudo) {
      const datos = JSON.parse(crudo);
      const modelo = depurarModeloNorthwest(datos.modelo);
      if (modelo) {
        estadoNorthwest.modelo = modelo;
        estadoNorthwest.vista = datos.vista === 'balanceo' ? 'balanceo' : 'datos';
        return 'guardado';
      }
    }
  } catch (e) { /* nada recuperable */ }
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
  if (!opts.sinHistorial) guardarHistorialNorthwest();
  cambio(estadoNorthwest.modelo, estadoNorthwest);
  comprobarVigenciaNorthwest();
  guardarNorthwest();
  emitirCambioNorthwest(opts.motivo || 'modelo');
}

function comprobarVigenciaNorthwest() {
  if (!estadoNorthwest.resultado) return;
  estadoNorthwest.resultado.vigente = estadoNorthwest.resultado.firma === firmaModeloNorthwest(estadoNorthwest.modelo);
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
