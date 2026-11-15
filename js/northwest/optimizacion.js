/* Optimización del transporte mediante el método MODI (u-v). */
'use strict';

function optimizarTransporteMODI(costos, ofertas, demandas, inicial, objetivo = 'min') {
  if (objetivo !== 'min' && objetivo !== 'max') throw new Error('El objetivo debe ser min o max.');
  if (!inicial || !Array.isArray(inicial.asignaciones) || !Array.isArray(inicial.basicas)) {
    throw new Error('MODI necesita una solución inicial de transporte.');
  }
  const m = ofertas.length, n = demandas.length;
  const asignaciones = inicial.asignaciones.map(f => f.slice());
  const asignacionesIniciales = inicial.asignaciones.map(f => f.slice());
  let basicas = inicial.basicas.map(c => ({ fila: c.fila, col: c.col }));
  const claveCelda = (fila, col) => fila + ':' + col;
  const ordenar = celdas => celdas.slice().sort((a, b) => a.fila - b.fila || a.col - b.col);
  const calcularTotal = matriz => {
    let total = 0;
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
      const parcial = matriz[i][j] * costos[i][j];
      if (!Number.isSafeInteger(parcial) || !Number.isSafeInteger(total + parcial)) {
        throw new Error('El costo total excede el rango seguro de enteros durante MODI.');
      }
      total += parcial;
    }
    return total;
  };
  const validarFlujos = () => {
    for (let i = 0; i < m; i++) {
      if (asignaciones[i].reduce((s, v) => s + v, 0) !== ofertas[i]) throw new Error('MODI produjo una oferta de fila inconsistente.');
    }
    for (let j = 0; j < n; j++) {
      if (asignaciones.reduce((s, f) => s + f[j], 0) !== demandas[j]) throw new Error('MODI produjo una demanda de columna inconsistente.');
    }
    if (basicas.length !== m + n - 1 || !baseSinCiclos(basicas, m, n)) {
      throw new Error('MODI produjo una base de transporte inválida.');
    }
  };
  validarFlujos();
  const costoInicial = calcularTotal(asignaciones);

  function calcularPotenciales() {
    const u = new Array(m), v = new Array(n);
    u[0] = 0;
    let cambio = true;
    while (cambio) {
      cambio = false;
      basicas.forEach(c => {
        if (u[c.fila] !== undefined && v[c.col] === undefined) { v[c.col] = costos[c.fila][c.col] - u[c.fila]; cambio = true; }
        else if (v[c.col] !== undefined && u[c.fila] === undefined) { u[c.fila] = costos[c.fila][c.col] - v[c.col]; cambio = true; }
        else if (u[c.fila] !== undefined && v[c.col] !== undefined && u[c.fila] + v[c.col] !== costos[c.fila][c.col]) {
          throw new Error('La base inicial contiene un ciclo o potenciales inconsistentes.');
        }
      });
    }
    if (u.some(x => x === undefined) || v.some(x => x === undefined)) throw new Error('La base inicial no conecta todas las filas y columnas.');
    return { u, v };
  }

  function caminoEnBase(entrada) {
    const adyacencia = new Map();
    const agregar = (nodo, vecino, celda) => {
      if (!adyacencia.has(nodo)) adyacencia.set(nodo, []);
      adyacencia.get(nodo).push({ vecino, celda });
    };
    basicas.forEach(c => {
      agregar('r' + c.fila, 'c' + c.col, c);
      agregar('c' + c.col, 'r' + c.fila, c);
    });
    const inicio = 'r' + entrada.fila, fin = 'c' + entrada.col;
    const pendientes = [inicio], anterior = new Map([[inicio, null]]);
    while (pendientes.length && !anterior.has(fin)) {
      const nodo = pendientes.shift();
      (adyacencia.get(nodo) || []).forEach(arista => {
        if (!anterior.has(arista.vecino)) {
          anterior.set(arista.vecino, { nodo, celda: arista.celda });
          pendientes.push(arista.vecino);
        }
      });
    }
    if (!anterior.has(fin)) throw new Error('No se pudo formar el ciclo de mejora de MODI.');
    const camino = [];
    for (let nodo = fin; nodo !== inicio;) {
      const paso = anterior.get(nodo);
      camino.push(paso.celda);
      nodo = paso.nodo;
    }
    return camino.reverse();
  }

  const pasos = [];
  const vistos = new Set();
  const limite = Math.max(100, 10 * m * n * (m + n));
  let costoTotal = calcularTotal(asignaciones);
  for (let iteracion = 0; iteracion < limite; iteracion++) {
    const firma = basicas.map(c => claveCelda(c.fila, c.col)).sort().join('|') + '/' + JSON.stringify(asignaciones);
    if (vistos.has(firma)) throw new Error('MODI detectó una repetición de estado; no se publicó un resultado subóptimo.');
    vistos.add(firma);

    const potenciales = calcularPotenciales();
    const conjuntoBasico = new Set(basicas.map(c => claveCelda(c.fila, c.col)));
    let entrada = null;
    for (let i = 0; i < m && !entrada; i++) for (let j = 0; j < n; j++) {
      if (conjuntoBasico.has(claveCelda(i, j))) continue;
      const reducido = costos[i][j] - potenciales.u[i] - potenciales.v[j];
      if (objetivo === 'min' ? reducido < 0 : reducido > 0) { entrada = { fila: i, col: j, reducido }; break; }
    }
    if (!entrada) {
      const basicasFinales = basicas.map(c => ({
        fila: c.fila, col: c.col, cantidad: asignaciones[c.fila][c.col],
        basicaCero: asignaciones[c.fila][c.col] === 0
      }));
      const envios = [];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (asignaciones[i][j] > 0) {
        const parcial = asignaciones[i][j] * costos[i][j];
        if (!Number.isSafeInteger(parcial)) throw new Error('El producto cantidad × costo excede el rango seguro de enteros durante MODI.');
        envios.push({ fila: i, col: j, cantidad: asignaciones[i][j], costoUnitario: costos[i][j], parcial });
      }
      const positivas = basicasFinales.filter(c => !c.basicaCero).length;
      const verificacion = verificarSolucionTransporte(asignaciones, ofertas, demandas, costos, costoTotal, basicasFinales);
      if (!verificacion.ok) throw new Error('La solución optimizada no superó la verificación independiente de transporte.');
      return {
        objetivo, asignaciones, basicas: basicas.map(c => ({
          fila: c.fila, col: c.col, cantidad: asignaciones[c.fila][c.col],
          basicaCero: asignaciones[c.fila][c.col] === 0
        })),
        envios, costoTotal, costoInicial, asignacionesIniciales, pasosOptimizacion: pasos,
        positivas, variablesBasicas: basicas.length, basicasCero: basicas.length - positivas,
        degenerado: positivas < m + n - 1, verificacion, potenciales
      };
    }

    const camino = caminoEnBase(entrada);
    const restan = camino.filter((_, indice) => indice % 2 === 0);
    const theta = Math.min(...restan.map(c => asignaciones[c.fila][c.col]));
    const salen = restan.filter(c => asignaciones[c.fila][c.col] === theta);
    const salida = ordenar(salen)[0];
    asignaciones[entrada.fila][entrada.col] += theta;
    camino.forEach((c, indice) => { asignaciones[c.fila][c.col] += indice % 2 === 0 ? -theta : theta; });
    basicas = basicas.filter(c => claveCelda(c.fila, c.col) !== claveCelda(salida.fila, salida.col));
    basicas.push({ fila: entrada.fila, col: entrada.col });
    basicas = ordenar(basicas);
    const anterior = costoTotal;
    costoTotal = calcularTotal(asignaciones);
    validarFlujos();
    pasos.push({
      iteracion: iteracion + 1, entrada, camino: camino.map(c => ({ fila: c.fila, col: c.col })),
      salida, theta, reducido: entrada.reducido, costoAnterior: anterior, costoTotal,
      potenciales: { u: potenciales.u.slice(), v: potenciales.v.slice() },
      asignaciones: asignaciones.map(f => f.slice())
    });
  }
  throw new Error('MODI alcanzó el límite de iteraciones sin demostrar optimalidad.');
}
