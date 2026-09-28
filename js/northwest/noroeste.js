/* Método de la esquina noroeste.
 *
 * Obtiene una SOLUCIÓN INICIAL FACTIBLE del problema de transporte balanceado.
 * No garantiza el costo mínimo: los costos no intervienen en la elección de celdas,
 * solo se usan al final para calcular el costo total de la solución obtenida.
 *
 * Regla: empezar en la esquina superior izquierda; asignar min(oferta restante,
 * demanda restante); restar a ambos saldos; si se agota la oferta bajar una fila,
 * si se satisface la demanda avanzar una columna. Si ambos se agotan a la vez
 * (degeneración) se avanza en UNA sola dirección y la siguiente celda recibe un
 * «0 básico»: una variable básica con cantidad cero, que mantiene la base en
 * m + n − 1 celdas sin ciclos. Nunca se usa un decimal pequeño (ε) que altere
 * cantidades, balances o costos.
 *
 * Sin DOM: se prueba en Node. Recibe el problema ya balanceado (balanceo.js).
 */

'use strict';

/**
 * @param {number[][]} costos    costos unitarios escalados (enteros ≥ 0), m × n
 * @param {number[]} ofertas     enteros ≥ 0, suma igual a la de demandas
 * @param {number[]} demandas    enteros ≥ 0
 * @returns {{
 *   asignaciones:number[][], basicas:Array<{fila,col,cantidad,basicaCero:boolean}>,
 *   pasos:Array, costoTotal:number, positivas:number, degenerado:boolean, verificacion:Object
 * }}
 */
function resolverEsquinaNoroeste(costos, ofertas, demandas) {
  const m = ofertas.length, n = demandas.length;
  if (m === 0 || n === 0) throw new Error('Se necesita al menos un origen y un destino.');
  if (!Array.isArray(costos) || costos.length !== m || costos.some(f => !Array.isArray(f) || f.length !== n)) {
    throw new Error('La matriz de costos no coincide con las dimensiones de oferta y demanda.');
  }
  [...ofertas, ...demandas].forEach(v => { if (!Number.isInteger(v) || v < 0) throw new Error('Ofertas y demandas deben ser enteros ≥ 0.'); });
  costos.forEach(f => f.forEach(c => { if (!Number.isInteger(c) || c < 0) throw new Error('Los costos deben ser enteros escalados ≥ 0.'); }));
  const ofertaTotal = ofertas.reduce((s, v) => s + v, 0);
  const demandaTotal = demandas.reduce((s, v) => s + v, 0);
  if (ofertaTotal !== demandaTotal) throw new Error('El problema debe estar balanceado: oferta total ' + ofertaTotal + ' ≠ demanda total ' + demandaTotal + '.');

  const restanteOferta = ofertas.slice();
  const restanteDemanda = demandas.slice();
  const asignaciones = Array.from({ length: m }, () => new Array(n).fill(0));
  const basicas = [];
  const pasos = [];
  let fila = 0, col = 0;
  let degenerado = false;

  // Cada paso visita una celda y luego se mueve una posición: a lo sumo m + n − 1 pasos.
  for (let paso = 1; paso <= m + n - 1; paso++) {
    const ofertaAntes = restanteOferta[fila];
    const demandaAntes = restanteDemanda[col];
    const cantidad = Math.min(ofertaAntes, demandaAntes);
    asignaciones[fila][col] += cantidad;
    restanteOferta[fila] -= cantidad;
    restanteDemanda[col] -= cantidad;
    const basicaCero = cantidad === 0;
    basicas.push({ fila, col, cantidad, basicaCero });

    const ofertaAgotada = restanteOferta[fila] === 0;
    const demandaSatisfecha = restanteDemanda[col] === 0;
    const ultimaFila = fila === m - 1, ultimaColumna = col === n - 1;
    const esUltima = ultimaFila && ultimaColumna;
    let movimiento = null;
    let satisfecho = null;

    if (!esUltima) {
      if (ofertaAgotada && demandaSatisfecha) {
        // Agotamiento simultáneo: se tacha una sola línea y la siguiente celda queda como 0 básico.
        degenerado = true;
        satisfecho = 'ambos';
        movimiento = ultimaFila ? 'derecha' : 'abajo';
      } else if (ofertaAgotada) {
        satisfecho = 'fila';
        movimiento = ultimaFila ? 'derecha' : 'abajo';
      } else if (demandaSatisfecha) {
        satisfecho = 'columna';
        movimiento = ultimaColumna ? 'abajo' : 'derecha';
      } else {
        throw new Error('Estado inconsistente: ni la oferta ni la demanda se agotaron en la celda (' + (fila + 1) + ', ' + (col + 1) + ').');
      }
    } else {
      satisfecho = ofertaAgotada && demandaSatisfecha ? 'ambos' : (ofertaAgotada ? 'fila' : 'columna');
    }

    pasos.push({
      numero: paso,
      fila, col,
      costoUnitario: costos[fila][col],
      ofertaAntes, demandaAntes,
      operacion: 'min(' + ofertaAntes + ', ' + demandaAntes + ') = ' + cantidad,
      cantidad,
      basicaCero,
      ofertaDespues: restanteOferta[fila],
      demandaDespues: restanteDemanda[col],
      satisfecho,                          // 'fila' | 'columna' | 'ambos'
      movimiento,                          // 'abajo' | 'derecha' | null (fin)
      simultaneo: satisfecho === 'ambos' && !esUltima,
      restanteOferta: restanteOferta.slice(),
      restanteDemanda: restanteDemanda.slice(),
      asignaciones: asignaciones.map(f => f.slice())
    });

    if (esUltima) break;
    if (movimiento === 'abajo') fila++;
    else col++;
  }

  if (restanteOferta.some(v => v !== 0) || restanteDemanda.some(v => v !== 0)) {
    throw new Error('El recorrido terminó con saldos pendientes: el problema no estaba balanceado.');
  }

  let costoTotal = 0;
  const envios = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    if (asignaciones[i][j] > 0) {
      const parcial = asignaciones[i][j] * costos[i][j];
      if (!Number.isSafeInteger(parcial)) throw new Error('El producto cantidad × costo excede el rango seguro de enteros.');
      costoTotal += parcial;
      if (!Number.isSafeInteger(costoTotal)) throw new Error('El costo total excede el rango seguro de enteros.');
      envios.push({ fila: i, col: j, cantidad: asignaciones[i][j], costoUnitario: costos[i][j], parcial });
    }
  }

  const positivas = basicas.filter(b => !b.basicaCero).length;
  const verificacion = verificarSolucionTransporte(asignaciones, ofertas, demandas, costos, costoTotal, basicas);

  return {
    m, n,
    asignaciones,
    basicas,
    envios,
    pasos,
    costoTotal,
    positivas,
    variablesBasicas: basicas.length,
    basicasCero: basicas.length - positivas,
    degenerado: degenerado || positivas < m + n - 1,
    verificacion
  };
}

/**
 * Comprobación independiente de la solución:
 * cantidades no negativas, sumas por fila y columna, costo total y base sin ciclos.
 */
function verificarSolucionTransporte(asignaciones, ofertas, demandas, costos, costoTotal, basicas) {
  const m = ofertas.length, n = demandas.length;
  const noNegativas = asignaciones.every(f => f.every(v => Number.isInteger(v) && v >= 0));
  const filasOk = asignaciones.every((f, i) => f.reduce((s, v) => s + v, 0) === ofertas[i]);
  const columnasOk = demandas.every((d, j) => asignaciones.reduce((s, f) => s + f[j], 0) === d);
  let recalculado = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) recalculado += asignaciones[i][j] * costos[i][j];
  const costoOk = recalculado === costoTotal;
  const cantidadBaseOk = basicas.length === m + n - 1;
  const sinCiclos = baseSinCiclos(basicas, m, n);
  return {
    noNegativas, filasOk, columnasOk, costoOk, cantidadBaseOk, sinCiclos,
    ok: noNegativas && filasOk && columnasOk && costoOk && cantidadBaseOk && sinCiclos
  };
}

/**
 * Una base del problema de transporte es un bosque en el grafo bipartito filas–columnas:
 * se eliminan repetidamente las celdas «hoja» (únicas en su fila o en su columna).
 * Si al final no queda ninguna, no hay ciclos.
 */
function baseSinCiclos(basicas, m, n) {
  const vivas = basicas.map(b => ({ fila: b.fila, col: b.col, activa: true }));
  let cambio = true;
  while (cambio) {
    cambio = false;
    const porFila = new Array(m).fill(0), porCol = new Array(n).fill(0);
    vivas.forEach(c => { if (c.activa) { porFila[c.fila]++; porCol[c.col]++; } });
    vivas.forEach(c => {
      if (c.activa && (porFila[c.fila] === 1 || porCol[c.col] === 1)) { c.activa = false; cambio = true; }
    });
  }
  return vivas.every(c => !c.activa);
}
