/* Modelo del problema de transporte para la esquina noroeste.
 *
 * origenes:  [{ id, nombre, oferta }]    oferta: entero ≥ 0 o null (pendiente)
 * destinos:  [{ id, nombre, demanda }]   demanda: entero ≥ 0 o null (pendiente)
 * costos:    { 'o_1|d_2': enteroEscalado }  ausente = pendiente. Escalado × 100.
 *
 * Los ficticios del balanceo NO viven aquí: se calculan aparte (balanceo.js) a
 * partir de estos datos, así nunca se acumulan ni sobrescriben la entrada.
 * Sin DOM: se prueba en Node.
 */

'use strict';

function crearModeloNorthwest() {
  return { origenes: [], destinos: [], costos: {}, siguienteId: 1 };
}

function claveNorthwest(origenId, destinoId) {
  return origenId + '|' + destinoId;
}

function nuevoIdNorthwest(modelo, prefijo) {
  return prefijo + '_' + (modelo.siguienteId++);
}

function nombreLibreNorthwest(lista, prefijo) {
  const usados = new Set(lista.map(e => e.nombre.toLowerCase()));
  let n = 1;
  while (usados.has((prefijo + ' ' + n).toLowerCase())) n++;
  return prefijo + ' ' + n;
}

function agregarOrigen(modelo, nombre, oferta) {
  if (modelo.origenes.length >= MAX_NORTHWEST_DIMENSION) return null;
  const origen = {
    id: nuevoIdNorthwest(modelo, 'o'),
    nombre: nombre || nombreLibreNorthwest(modelo.origenes, 'Origen'),
    oferta: Number.isInteger(oferta) ? oferta : null
  };
  modelo.origenes.push(origen);
  return origen;
}

function agregarDestino(modelo, nombre, demanda) {
  if (modelo.destinos.length >= MAX_NORTHWEST_DIMENSION) return null;
  const destino = {
    id: nuevoIdNorthwest(modelo, 'd'),
    nombre: nombre || nombreLibreNorthwest(modelo.destinos, 'Destino'),
    demanda: Number.isInteger(demanda) ? demanda : null
  };
  modelo.destinos.push(destino);
  return destino;
}

function buscarElementoNorthwest(modelo, id) {
  const origen = modelo.origenes.find(o => o.id === id);
  if (origen) return { tipo: 'origen', elemento: origen };
  const destino = modelo.destinos.find(d => d.id === id);
  if (destino) return { tipo: 'destino', elemento: destino };
  return null;
}

function eliminarElementoNorthwest(modelo, id) {
  const encontrado = buscarElementoNorthwest(modelo, id);
  if (!encontrado) return false;
  if (encontrado.tipo === 'origen') modelo.origenes = modelo.origenes.filter(o => o.id !== id);
  else modelo.destinos = modelo.destinos.filter(d => d.id !== id);
  Object.keys(modelo.costos).forEach(clave => {
    const [o, d] = clave.split('|');
    if (o === id || d === id) delete modelo.costos[clave];
  });
  return true;
}

function fijarCostoNorthwest(modelo, origenId, destinoId, escalado) {
  const clave = claveNorthwest(origenId, destinoId);
  if (escalado === null || escalado === undefined) { delete modelo.costos[clave]; return; }
  if (!Number.isInteger(escalado) || escalado < 0) throw new Error('El costo debe ser un entero escalado ≥ 0 o null.');
  modelo.costos[clave] = escalado;
}

function obtenerCostoNorthwest(modelo, origenId, destinoId) {
  const v = modelo.costos[claveNorthwest(origenId, destinoId)];
  return Number.isInteger(v) ? v : null;
}

function matrizCostosNorthwest(modelo) {
  return modelo.origenes.map(o => modelo.destinos.map(d => obtenerCostoNorthwest(modelo, o.id, d.id)));
}

function totalesNorthwest(modelo) {
  const ofertas = modelo.origenes.map(o => o.oferta);
  const demandas = modelo.destinos.map(d => d.demanda);
  const suma = lista => lista.reduce((s, v) => s + (Number.isInteger(v) ? v : 0), 0);
  const ofertaTotal = suma(ofertas);
  const demandaTotal = suma(demandas);
  return {
    ofertaTotal,
    demandaTotal,
    diferencia: ofertaTotal - demandaTotal,
    ofertasPendientes: ofertas.filter(v => v === null).length,
    demandasPendientes: demandas.filter(v => v === null).length
  };
}

/** Comprueba si el modelo se puede llevar al balanceo. */
function validarModeloNorthwest(modelo) {
  const errores = [];
  const m = modelo.origenes.length, n = modelo.destinos.length;
  if (m < MIN_NORTHWEST_DIMENSION) errores.push('Agrega al menos ' + MIN_NORTHWEST_DIMENSION + ' origen.');
  if (n < MIN_NORTHWEST_DIMENSION) errores.push('Agrega al menos ' + MIN_NORTHWEST_DIMENSION + ' destino.');
  if (m > MAX_NORTHWEST_DIMENSION) errores.push('Como máximo ' + MAX_NORTHWEST_DIMENSION + ' orígenes reales en esta versión.');
  if (n > MAX_NORTHWEST_DIMENSION) errores.push('Como máximo ' + MAX_NORTHWEST_DIMENSION + ' destinos reales en esta versión.');

  let costosPendientes = 0;
  modelo.origenes.forEach(o => modelo.destinos.forEach(d => {
    if (obtenerCostoNorthwest(modelo, o.id, d.id) === null) costosPendientes++;
  }));
  if (m > 0 && n > 0 && costosPendientes > 0) {
    errores.push(costosPendientes === 1 ? 'Falta 1 costo unitario. Todas las celdas necesitan un costo válido (no se admiten rutas prohibidas en esta versión).'
      : 'Faltan ' + costosPendientes + ' costos unitarios. Todas las celdas necesitan un costo válido (no se admiten rutas prohibidas en esta versión).');
  }
  const t = totalesNorthwest(modelo);
  if (t.ofertasPendientes) errores.push(t.ofertasPendientes === 1 ? 'Falta 1 oferta.' : 'Faltan ' + t.ofertasPendientes + ' ofertas.');
  if (t.demandasPendientes) errores.push(t.demandasPendientes === 1 ? 'Falta 1 demanda.' : 'Faltan ' + t.demandasPendientes + ' demandas.');

  Object.keys(modelo.costos).forEach(k => {
    const v = modelo.costos[k];
    if (!Number.isInteger(v) || v < 0 || v > MAX_COSTO_NORTHWEST * ESCALA_COSTO_NORTHWEST) errores.push('Hay un costo fuera de rango.');
  });
  modelo.origenes.forEach(o => {
    if (o.oferta !== null && (!Number.isInteger(o.oferta) || o.oferta < 0 || o.oferta > MAX_CANTIDAD_NORTHWEST)) errores.push('Hay una oferta fuera de rango.');
  });
  modelo.destinos.forEach(d => {
    if (d.demanda !== null && (!Number.isInteger(d.demanda) || d.demanda < 0 || d.demanda > MAX_CANTIDAD_NORTHWEST)) errores.push('Hay una demanda fuera de rango.');
  });

  return { ok: errores.length === 0, errores: Array.from(new Set(errores)), totales: t, costosPendientes };
}

function firmaModeloNorthwest(modelo) {
  return JSON.stringify({
    o: modelo.origenes.map(e => [e.id, e.oferta]),
    d: modelo.destinos.map(e => [e.id, e.demanda]),
    c: modelo.costos
  });
}

function clonarModeloNorthwest(modelo) {
  return JSON.parse(JSON.stringify(modelo));
}

/* ---------------- Serialización ---------------- */

function depurarModeloNorthwest(datos) {
  if (!datos || !Array.isArray(datos.origenes) || !Array.isArray(datos.destinos)) return null;
  const limpiarCantidad = v => (Number.isInteger(v) && v >= 0 && v <= MAX_CANTIDAD_NORTHWEST ? v : null);
  const limpiarLista = (lista, campo) => lista
    .filter(e => e && typeof e.id === 'string' && typeof e.nombre === 'string' && e.nombre.trim() !== '')
    .map(e => {
      const salida = { id: e.id, nombre: e.nombre.trim().slice(0, MAX_LARGO_ETIQUETA_NORTHWEST) };
      salida[campo] = limpiarCantidad(e[campo]);
      return salida;
    })
    .slice(0, MAX_NORTHWEST_DIMENSION);

  const origenes = limpiarLista(datos.origenes, 'oferta');
  const destinos = limpiarLista(datos.destinos, 'demanda');
  const idsO = new Set(origenes.map(e => e.id));
  const idsD = new Set(destinos.map(e => e.id));
  const costos = {};
  if (datos.costos && typeof datos.costos === 'object') {
    Object.keys(datos.costos).forEach(clave => {
      const [o, d] = clave.split('|');
      const v = datos.costos[clave];
      if (idsO.has(o) && idsD.has(d) && Number.isInteger(v) && v >= 0 && v <= MAX_COSTO_NORTHWEST * ESCALA_COSTO_NORTHWEST) costos[clave] = v;
    });
  }
  let mayor = 0;
  origenes.concat(destinos).forEach(e => {
    const numero = Number(String(e.id).split('_')[1]);
    if (Number.isInteger(numero) && numero > mayor) mayor = numero;
  });
  const siguienteId = Number.isInteger(datos.siguienteId) && datos.siguienteId > mayor ? datos.siguienteId : mayor + 1;
  return { origenes, destinos, costos, siguienteId };
}

/**
 * Construye un modelo a partir de matrices simples (costos ya escalados o no).
 * @param {number[][]} costos  sin escalar (unidades monetarias, hasta 2 decimales)
 */
function modeloNorthwestDesdeMatrices(costos, ofertas, demandas, nombresOrigenes, nombresDestinos) {
  const modelo = crearModeloNorthwest();
  ofertas.forEach((oferta, i) => agregarOrigen(modelo, nombresOrigenes ? nombresOrigenes[i] : null, oferta));
  demandas.forEach((demanda, j) => agregarDestino(modelo, nombresDestinos ? nombresDestinos[j] : null, demanda));
  costos.forEach((fila, i) => fila.forEach((c, j) => {
    fijarCostoNorthwest(modelo, modelo.origenes[i].id, modelo.destinos[j].id, Math.round(c * ESCALA_COSTO_NORTHWEST));
  }));
  return modelo;
}

const EJEMPLOS_NORTHWEST = [
  {
    id: 'balanceado',
    nombre: 'Balanceado 2×3 (costo 230)',
    costos: [[2, 3, 1], [5, 4, 8]], ofertas: [20, 30], demandas: [10, 25, 15],
    origenes: ['Planta A', 'Planta B'], destinos: ['Tienda 1', 'Tienda 2', 'Tienda 3']
  },
  {
    id: 'exceso-oferta',
    nombre: 'Exceso de oferta 3×3',
    costos: [[8, 6, 10], [9, 12, 13], [14, 9, 16]], ofertas: [35, 50, 40], demandas: [45, 20, 30],
    origenes: ['Fábrica Norte', 'Fábrica Centro', 'Fábrica Sur'], destinos: ['Cliente 1', 'Cliente 2', 'Cliente 3']
  },
  {
    id: 'exceso-demanda',
    nombre: 'Exceso de demanda 2×3 con decimales',
    costos: [[4.5, 2.25, 3], [6, 3.75, 5.5]], ofertas: [40, 35], demandas: [30, 30, 30],
    origenes: ['Depósito Este', 'Depósito Oeste'], destinos: ['Sucursal 1', 'Sucursal 2', 'Sucursal 3']
  },
  {
    id: 'degenerado',
    nombre: 'Degenerado 3×3',
    costos: [[3, 1, 7], [2, 6, 5], [8, 3, 3]], ofertas: [20, 10, 30], demandas: [20, 10, 30],
    origenes: ['Origen 1', 'Origen 2', 'Origen 3'], destinos: ['Destino 1', 'Destino 2', 'Destino 3']
  }
];

function ejemploNorthwest(id) {
  const e = EJEMPLOS_NORTHWEST.find(x => x.id === id) || EJEMPLOS_NORTHWEST[0];
  return modeloNorthwestDesdeMatrices(e.costos, e.ofertas, e.demandas, e.origenes, e.destinos);
}
