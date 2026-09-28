/* Balanceo del problema de transporte.
 *
 * Devuelve SIEMPRE una estructura nueva derivada del modelo: los ficticios nunca se
 * escriben en el modelo, así que al cambiar la entrada se reconstruyen sin acumularse.
 * El costo 0 de las celdas ficticias es una convención del modelo, no una afirmación
 * de que el sobrante o el faltante carezcan de consecuencias económicas.
 * Sin DOM: se prueba en Node.
 */

'use strict';

/**
 * @param {Object} modelo  modelo validado (sin pendientes)
 * @returns {{
 *   costos:number[][], ofertas:number[], demandas:number[],
 *   origenes:Array<{id,nombre,ficticio:boolean}>, destinos:Array<{id,nombre,ficticio:boolean}>,
 *   ficticio: null | {tipo:'origen'|'destino', cantidad:number, indice:number},
 *   ofertaTotal:number, demandaTotal:number, trivial:boolean
 * }}
 */
function balancearNorthwest(modelo) {
  const origenes = modelo.origenes.map(o => ({ id: o.id, nombre: o.nombre, ficticio: false }));
  const destinos = modelo.destinos.map(d => ({ id: d.id, nombre: d.nombre, ficticio: false }));
  const ofertas = modelo.origenes.map(o => o.oferta);
  const demandas = modelo.destinos.map(d => d.demanda);
  const costos = matrizCostosNorthwest(modelo);

  const ofertaTotal = ofertas.reduce((s, v) => s + v, 0);
  const demandaTotal = demandas.reduce((s, v) => s + v, 0);
  let ficticio = null;

  if (ofertaTotal > demandaTotal) {
    const cantidad = ofertaTotal - demandaTotal;
    destinos.push({ id: 'ficticio_destino', nombre: 'Destino ficticio', ficticio: true });
    demandas.push(cantidad);
    costos.forEach(fila => fila.push(0));
    ficticio = { tipo: 'destino', cantidad, indice: destinos.length - 1 };
  } else if (demandaTotal > ofertaTotal) {
    const cantidad = demandaTotal - ofertaTotal;
    origenes.push({ id: 'ficticio_origen', nombre: 'Origen ficticio', ficticio: true });
    ofertas.push(cantidad);
    costos.push(destinos.map(() => 0));
    ficticio = { tipo: 'origen', cantidad, indice: origenes.length - 1 };
  }

  return {
    costos, ofertas, demandas, origenes, destinos, ficticio,
    ofertaTotal, demandaTotal,
    trivial: ofertaTotal === 0 && demandaTotal === 0
  };
}

/** Texto explicativo del balanceo, para la vista previa. */
function explicarBalanceo(balance) {
  if (!balance.ficticio) {
    return 'La oferta total (' + balance.ofertaTotal + ') coincide con la demanda total (' + balance.demandaTotal + '): el problema ya está balanceado y no se agrega ningún elemento.';
  }
  if (balance.ficticio.tipo === 'destino') {
    return 'La oferta total (' + balance.ofertaTotal + ') supera la demanda total (' + balance.demandaTotal + ') en ' + balance.ficticio.cantidad +
      ' unidades. Se agrega un destino ficticio con demanda ' + balance.ficticio.cantidad + ' y costo unitario 0 que absorbe la oferta sobrante. ' +
      'El costo 0 es una convención del modelo: no significa que producir de más no tenga consecuencias económicas.';
  }
  return 'La demanda total (' + balance.demandaTotal + ') supera la oferta total (' + balance.ofertaTotal + ') en ' + balance.ficticio.cantidad +
    ' unidades. Se agrega un origen ficticio con oferta ' + balance.ficticio.cantidad + ' y costo unitario 0 que representa la demanda no cubierta por oferta real. ' +
    'El costo 0 es una convención del modelo: no significa que dejar demanda sin atender carezca de consecuencias económicas.';
}
