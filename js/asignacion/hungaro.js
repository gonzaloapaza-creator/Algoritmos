/* Método húngaro completo para el problema de asignación.
 *
 * Cada paso que se devuelve proviene de la ejecución real:
 *   1. matriz original;
 *   2. maximizar → minimizar (máximo − valor), si corresponde;
 *   3. balanceo a cuadrada con filas/columnas ficticias de costo 0, si corresponde;
 *   4. reducción por filas;
 *   5. reducción por columnas;
 *   6. mientras no haya n ceros independientes:
 *        a) emparejamiento máximo de ceros (Kuhn) y cobertura mínima de líneas (König),
 *        b) δ = mínimo no cubierto; se resta a lo no cubierto y se suma a las intersecciones;
 *   7. selección final y total con los valores originales.
 *
 * Sin DOM: se prueba en Node. No modifica la matriz que recibe.
 */

'use strict';

function copiarMatriz(m) {
  return m.map(fila => fila.slice());
}

/**
 * Emparejamiento máximo entre filas y columnas usando solo las celdas con cero
 * (algoritmo de Kuhn con caminos de aumento).
 * @returns {{parejaFila:number[], parejaColumna:number[], tamano:number}} -1 = sin pareja
 */
function emparejarCeros(costo) {
  const n = costo.length;
  const parejaFila = new Array(n).fill(-1);
  const parejaColumna = new Array(n).fill(-1);

  function intentar(fila, visitadas) {
    for (let col = 0; col < n; col++) {
      if (costo[fila][col] !== 0 || visitadas[col]) continue;
      visitadas[col] = true;
      if (parejaColumna[col] === -1 || intentar(parejaColumna[col], visitadas)) {
        parejaFila[fila] = col;
        parejaColumna[col] = fila;
        return true;
      }
    }
    return false;
  }

  let tamano = 0;
  for (let fila = 0; fila < n; fila++) {
    if (intentar(fila, new Array(n).fill(false))) tamano++;
  }
  return { parejaFila, parejaColumna, tamano };
}

/**
 * Cobertura mínima de los ceros con líneas (teorema de König): a partir de las filas
 * sin pareja se recorren caminos alternantes; se cubren las filas NO alcanzadas y las
 * columnas SÍ alcanzadas. El número de líneas coincide con el tamaño del emparejamiento.
 */
function coberturaMinima(costo, emparejamiento) {
  const n = costo.length;
  const filaVisitada = new Array(n).fill(false);
  const columnaVisitada = new Array(n).fill(false);
  const cola = [];
  for (let fila = 0; fila < n; fila++) {
    if (emparejamiento.parejaFila[fila] === -1) { filaVisitada[fila] = true; cola.push(fila); }
  }
  while (cola.length) {
    const fila = cola.shift();
    for (let col = 0; col < n; col++) {
      if (costo[fila][col] !== 0 || columnaVisitada[col]) continue;
      columnaVisitada[col] = true;
      const otra = emparejamiento.parejaColumna[col];
      if (otra !== -1 && !filaVisitada[otra]) { filaVisitada[otra] = true; cola.push(otra); }
    }
  }
  const filas = [], columnas = [];
  for (let i = 0; i < n; i++) {
    if (!filaVisitada[i]) filas.push(i);
    if (columnaVisitada[i]) columnas.push(i);
  }
  return { filas, columnas };
}

function listaCeros(emparejamiento) {
  return emparejamiento.parejaFila
    .map((col, fila) => ({ fila, col }))
    .filter(p => p.col !== -1);
}

function comprobarMatrizAsignacion(matriz) {
  if (!Array.isArray(matriz) || matriz.length === 0 || !Array.isArray(matriz[0]) || matriz[0].length === 0) {
    throw new Error('La matriz debe tener al menos una fila y una columna.');
  }
  const columnas = matriz[0].length;
  matriz.forEach(fila => {
    if (!Array.isArray(fila) || fila.length !== columnas) throw new Error('Todas las filas deben tener la misma cantidad de columnas.');
    fila.forEach(v => {
      if (!Number.isInteger(v)) throw new Error('Hay valores pendientes o no enteros: completa la matriz antes de resolver.');
    });
  });
}

/**
 * @param {number[][]} matriz  valores originales (enteros)
 * @param {'min'|'max'} objetivo
 * @param {{nombresFilas?:string[], nombresColumnas?:string[]}} [opciones]
 */
function resolverHungaro(matriz, objetivo, opciones) {
  comprobarMatrizAsignacion(matriz);
  const filas = matriz.length;
  const columnas = matriz[0].length;
  const n = Math.max(filas, columnas);
  const esMax = objetivo === 'max';
  const nombresFilas = (opciones && opciones.nombresFilas) || matriz.map((_, i) => 'Fila ' + (i + 1));
  const nombresColumnas = (opciones && opciones.nombresColumnas) || matriz[0].map((_, j) => 'Columna ' + (j + 1));
  const pasos = [];
  const marcas = { filasReales: filas, columnasReales: columnas };

  const paso = (tipo, titulo, texto, m, extra) => {
    pasos.push(Object.assign({ tipo, titulo, texto, matriz: copiarMatriz(m) }, marcas, extra || {}));
  };

  paso('original', 'Matriz original', esMax
    ? 'Valores de beneficio: se busca la asignación que MAXIMICE la suma.'
    : 'Valores de costo: se busca la asignación que MINIMICE la suma.', matriz);

  // 2) Maximizar equivale a minimizar la matriz de pérdidas máximo − valor.
  let costo = copiarMatriz(matriz);
  let maximo = null;
  if (esMax) {
    maximo = Math.max(...matriz.map(f => Math.max(...f)));
    costo = matriz.map(f => f.map(v => maximo - v));
    paso('conversion', 'Transformación de maximización a minimización',
      'Cada valor se sustituye por ' + maximo + ' − valor (el máximo de la matriz menos el valor). ' +
      'Maximizar el beneficio equivale a minimizar esta matriz de pérdidas.', costo);
  }

  // 3) Balanceo: la matriz debe ser cuadrada. Las ficticias tienen costo 0.
  if (filas !== columnas) {
    costo = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i < filas && j < columnas ? costo[i][j] : 0)));
    paso('balanceo', 'Balanceo: matriz ' + filas + '×' + columnas + ' → ' + n + '×' + n,
      filas < columnas
        ? 'Se añaden ' + (n - filas) + (n - filas === 1 ? ' fila ficticia' : ' filas ficticias') + ' con costo 0. Representan recursos inexistentes: las tareas que reciban una fila ficticia quedarán sin asignar.'
        : 'Se añaden ' + (n - columnas) + (n - columnas === 1 ? ' columna ficticia' : ' columnas ficticias') + ' con costo 0. Representan tareas inexistentes: los recursos que reciban una columna ficticia quedarán sin tarea.',
      costo);
  }

  // 4) Reducción por filas.
  const minimosFila = costo.map(f => Math.min(...f));
  costo = costo.map((f, i) => f.map(v => v - minimosFila[i]));
  paso('reduccion-filas', 'Reducción por filas',
    'A cada fila se le resta su mínimo (' + minimosFila.join(', ') + '). Restar una constante a una fila completa no cambia cuál es la asignación óptima.', costo);

  // 5) Reducción por columnas.
  const minimosColumna = Array.from({ length: n }, (_, j) => Math.min(...costo.map(f => f[j])));
  costo = costo.map(f => f.map((v, j) => v - minimosColumna[j]));
  paso('reduccion-columnas', 'Reducción por columnas',
    'A cada columna se le resta su mínimo (' + minimosColumna.join(', ') + '). Ahora cada fila y cada columna tienen al menos un cero.', costo);

  // 6) Cobertura y ajuste hasta lograr n ceros independientes.
  let emparejamiento = emparejarCeros(costo);
  let iteracion = 0;
  while (emparejamiento.tamano < n) {
    iteracion++;
    if (iteracion > 200) throw new Error('El método no convergió: revisa los datos.');
    const cobertura = coberturaMinima(costo, emparejamiento);
    const cubiertaFila = new Array(n).fill(false);
    const cubiertaColumna = new Array(n).fill(false);
    cobertura.filas.forEach(i => { cubiertaFila[i] = true; });
    cobertura.columnas.forEach(j => { cubiertaColumna[j] = true; });

    let delta = Infinity;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (!cubiertaFila[i] && !cubiertaColumna[j] && costo[i][j] < delta) delta = costo[i][j];
    }
    if (!Number.isFinite(delta) || delta <= 0) throw new Error('No se encontró un mínimo no cubierto positivo.');

    const lineas = cobertura.filas.length + cobertura.columnas.length;
    paso('cobertura', 'Iteración ' + iteracion + ': cubrir los ceros con el mínimo de líneas',
      'Se pueden elegir como máximo ' + emparejamiento.tamano + ' ceros independientes (ninguno comparte fila ni columna), ' +
      'y todos los ceros se cubren con ' + lineas + (lineas === 1 ? ' línea' : ' líneas') + ' (' +
      (cobertura.filas.length ? 'filas ' + cobertura.filas.map(i => i + 1).join(', ') : 'ninguna fila') + '; ' +
      (cobertura.columnas.length ? 'columnas ' + cobertura.columnas.map(j => j + 1).join(', ') : 'ninguna columna') + '). ' +
      'Como ' + lineas + ' < ' + n + ', todavía no hay asignación completa. El menor valor NO cubierto es δ = ' + delta + '.',
      costo, { filasCubiertas: cobertura.filas, columnasCubiertas: cobertura.columnas, ceros: listaCeros(emparejamiento), delta });

    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (!cubiertaFila[i] && !cubiertaColumna[j]) costo[i][j] -= delta;
      else if (cubiertaFila[i] && cubiertaColumna[j]) costo[i][j] += delta;
    }
    paso('ajuste', 'Iteración ' + iteracion + ': ajustar con δ = ' + delta,
      'Se resta δ a todas las celdas no cubiertas y se suma δ a las celdas cubiertas dos veces (intersección de una fila y una columna cubiertas). ' +
      'Las celdas cubiertas por una sola línea no cambian. Aparece al menos un cero nuevo.', costo,
      { filasCubiertas: cobertura.filas, columnasCubiertas: cobertura.columnas, delta });

    emparejamiento = emparejarCeros(costo);
  }

  // 7) Selección final.
  const seleccion = listaCeros(emparejamiento);
  paso('seleccion', 'Selección final: ' + n + ' ceros independientes',
    'Se eligen ' + n + ' ceros, exactamente uno por fila y uno por columna. Esas posiciones son la asignación óptima' +
    (filas !== columnas ? '; las que caen en una fila o columna ficticia no son asignaciones reales.' : '.'),
    costo, { ceros: seleccion, destacadas: seleccion });

  const asignaciones = seleccion
    .filter(p => p.fila < filas && p.col < columnas)
    .map(p => ({ fila: p.fila, col: p.col, valor: matriz[p.fila][p.col] }))
    .sort((a, b) => a.fila - b.fila);
  const total = asignaciones.reduce((s, a) => s + a.valor, 0);
  const sinAsignarFilas = matriz.map((_, i) => i).filter(i => !asignaciones.some(a => a.fila === i));
  const sinAsignarColumnas = matriz[0].map((_, j) => j).filter(j => !asignaciones.some(a => a.col === j));

  paso('total', 'Total con los valores originales',
    asignaciones.map(a => nombresFilas[a.fila] + ' → ' + nombresColumnas[a.col] + ': ' + a.valor).join('  +  ') +
    '  =  ' + total + (esMax ? ' (beneficio máximo)' : ' (costo mínimo)') +
    (sinAsignarFilas.length ? '. Sin tarea: ' + sinAsignarFilas.map(i => nombresFilas[i]).join(', ') : '') +
    (sinAsignarColumnas.length ? '. Sin recurso: ' + sinAsignarColumnas.map(j => nombresColumnas[j]).join(', ') : '') + '.',
    matriz, { destacadas: asignaciones.map(a => ({ fila: a.fila, col: a.col })) });

  return {
    objetivo: esMax ? 'max' : 'min',
    filas, columnas, n,
    asignaciones,
    total,
    sinAsignarFilas,
    sinAsignarColumnas,
    iteraciones: iteracion,
    pasos,
    costoReducidoFinal: copiarMatriz(costo),
    maximo
  };
}

/* ---------------- Verificación independiente ---------------- */

function factorial(k) {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return f;
}

/**
 * Búsqueda exacta por programación dinámica sobre subconjuntos de columnas (n ≤ 8):
 * O(n · 2ⁿ). No comparte código con el método húngaro, así sirve para comprobarlo.
 * Cuenta además cuántas asignaciones alcanzan el óptimo, para poder afirmar (o no)
 * que la solución es única.
 * @returns {{total:number, cantidadOptimos:number, unica:boolean, asignaciones:Array}}
 */
function verificarAsignacionPorFuerzaBruta(matriz, objetivo) {
  comprobarMatrizAsignacion(matriz);
  const filas = matriz.length, columnas = matriz[0].length;
  const n = Math.max(filas, columnas);
  if (n > 10) throw new Error('La verificación exhaustiva solo se ejecuta hasta 10×10.');
  const esMax = objetivo === 'max';
  // Mismo criterio que el húngaro para las ficticias: costo 0. Aquí se minimiza directamente
  // el negativo del beneficio, sin pasar por «máximo − valor», para que sea una comprobación distinta.
  const costo = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) =>
    (i < filas && j < columnas ? (esMax ? -matriz[i][j] : matriz[i][j]) : 0)));

  const completo = (1 << n) - 1;
  const mejor = new Array(1 << n).fill(Infinity);
  const cantidad = new Array(1 << n).fill(0);
  const desde = new Array(1 << n).fill(-1);
  mejor[0] = 0; cantidad[0] = 1;
  const bits = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

  for (let mascara = 0; mascara <= completo; mascara++) {
    if (cantidad[mascara] === 0) continue;
    const fila = bits(mascara);
    if (fila === n) continue;
    for (let col = 0; col < n; col++) {
      if (mascara & (1 << col)) continue;
      const siguiente = mascara | (1 << col);
      const valor = mejor[mascara] + costo[fila][col];
      if (valor < mejor[siguiente]) { mejor[siguiente] = valor; cantidad[siguiente] = cantidad[mascara]; desde[siguiente] = col; }
      else if (valor === mejor[siguiente]) cantidad[siguiente] += cantidad[mascara];
    }
  }

  // Reconstruir una solución óptima.
  const asignaciones = [];
  let mascara = completo;
  for (let fila = n - 1; fila >= 0; fila--) {
    const col = desde[mascara];
    if (fila < filas && col < columnas) asignaciones.push({ fila, col, valor: matriz[fila][col] });
    mascara &= ~(1 << col);
  }
  asignaciones.sort((a, b) => a.fila - b.fila);
  const total = asignaciones.reduce((s, a) => s + a.valor, 0);

  // Las ficticias se pueden permutar entre sí sin cambiar la asignación real: k! repeticiones.
  const ficticias = n - Math.min(filas, columnas);
  const cantidadOptimos = cantidad[completo] / factorial(ficticias);
  return { total, cantidadOptimos, unica: cantidadOptimos === 1, asignaciones };
}
