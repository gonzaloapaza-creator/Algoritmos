// js/ordenamiento/algoritmos.js
// Lógica pura (sin DOM): generadores compartidos y eventos con checkpoints.
// Los pinos son objetos { id, valor } para que la vista pueda animar el mismo pino
// aunque cambie de posición.
'use strict';

const TIPOS_PASO_ORDENAMIENTO = {
  INICIO: 'inicio',
  SELECCION: 'seleccion',   // se elige la clave / se inicia una pasada
  COMPARAR: 'comparar',
  MINIMO: 'minimo',         // nuevo mínimo encontrado (selection)
  MOVER: 'mover',           // intercambio o desplazamiento
  FIJAR: 'fijar',           // un pino queda en su posición definitiva
  FIN: 'fin'
};

const PSEUDOCODIGO_ORDENAMIENTO = {
  selection: [
    'para i = 0 hasta n − 2:',
    '    min = i',
    '    para j = i + 1 hasta n − 1:',
    '        si A[j] < A[min]:',
    '            min = j',
    '    si min ≠ i: intercambiar A[i], A[min]',
    '    // A[0..i] ya está ordenado'
  ],
  insertion: [
    'para i = 1 hasta n − 1:',
    '    clave = A[i]',
    '    j = i − 1',
    '    mientras j ≥ 0 y A[j] > clave:',
    '        A[j + 1] = A[j]',
    '        j = j − 1',
    '    A[j + 1] = clave'
  ],
  bubble: [
    'para i = 0 hasta n − 2:',
    '    huboCambio = falso',
    '    para j = 0 hasta n − 2 − i:',
    '        si A[j] > A[j + 1]:',
    '            intercambiar A[j], A[j + 1]',
    '            huboCambio = verdadero',
    '    si no huboCambio: terminar'
  ],
  shell: [
    'salto = floor(n / 2)',
    'mientras salto > 0:',
    '    para i = salto hasta n − 1:',
    '        j = i',
    '        mientras j ≥ salto y A[j − salto] > A[j]:',
    '            intercambiar A[j − salto], A[j]',
    '            j = j − salto',
    '    salto = floor(salto / 2)'
  ],
  merge: [
    'ordenar(inicio, fin):',
    '    si inicio ≥ fin: regresar',
    '    medio = floor((inicio + fin) / 2)',
    '    ordenar(inicio, medio)',
    '    ordenar(medio + 1, fin)',
    '    comparar las cabezas izquierda y derecha',
    '    copiar el menor al arreglo auxiliar',
    '    copiar el segmento auxiliar al arreglo'
  ]
};

const INFO_ALGORITMOS_ORDENAMIENTO = {
  selection: { nombre: 'Selection Sort', complejidad: 'O(n²)', estable: false, idea: 'Busca el menor del resto y lo coloca al frente.' },
  insertion: { nombre: 'Insertion Sort', complejidad: 'O(n²) · O(n) si ya está ordenado', estable: true, idea: 'Toma un pino y lo inserta en su lugar dentro de la parte ordenada.' },
  bubble: { nombre: 'Bubble Sort', complejidad: 'O(n²) · O(n) si ya está ordenado', estable: true, idea: 'Compara vecinos y «burbujea» el mayor hacia el final.' },
  shell: { nombre: 'Shell Sort', complejidad: 'Depende de la secuencia de saltos', estable: false, idea: 'Ordena grupos separados por saltos decrecientes hasta terminar con una pasada de inserción.' },
  merge: { nombre: 'Merge Sort', complejidad: 'O(n log n)', estable: true, idea: 'Divide el arreglo en mitades y las mezcla en orden; ante iguales, conserva primero el elemento izquierdo.' }
};

function pinosDesdeValores(valores) {
  return valores.map((valor, i) => ({ id: 'p' + i, valor }));
}

function valoresDePinos(pinos) {
  return pinos.map(p => p.valor);
}

/* Eventos compactos y un checkpoint cada 128 pasos. Las APIs clásicas
 * materializan instantáneas independientes; la interfaz pide solo el paso visible. */
const INTERVALO_CHECKPOINT_ORDENAMIENTO = 128;

function comprimirIndicesOrdenamiento(indices) {
  const rangos = [];
  indices.forEach(i => {
    const ultimo = rangos[rangos.length - 1];
    if (ultimo && ultimo[1] + 1 === i) ultimo[1] = i;
    else rangos.push([i, i]);
  });
  return rangos;
}
function expandirIndicesOrdenamiento(rangos) {
  const indices = [];
  rangos.forEach(([a, b]) => { for (let i = a; i <= b; i++) indices.push(i); });
  return indices;
}

function crearRegistro(arr) {
  const hist = { eventos: [], checkpoints: [], pinos: arr.map(p => ({ ...p })) };
  const contadores = { comparaciones: 0, intercambios: 0 };
  const cambios = new Map();
  const idsMitades = new WeakMap();
  const auxiliarAnterior = Array(arr.length).fill(null);
  function intercambiar(a, b) {
    [arr[a], arr[b]] = [arr[b], arr[a]];
    cambios.set(a, arr[a].id); cambios.set(b, arr[b].id);
  }
  function escribir(i, pino) {
    arr[i] = pino;
    cambios.set(i, pino.id);
  }
  function paso(datos) {
    const registro = {
      tipo: datos.tipo || TIPOS_PASO_ORDENAMIENTO.COMPARAR,
      comparando: datos.comparando || [], moviendo: datos.moviendo || [],
      minimo: datos.minimo == null ? null : datos.minimo,
      sostenido: datos.sostenido == null ? null : datos.sostenido,
      pasada: datos.pasada || 0, linea: datos.linea == null ? -1 : datos.linea,
      comparaciones: contadores.comparaciones,
      intercambios: contadores.intercambios,
      movimientos: datos.movimientos == null ? (datos.tipo === TIPOS_PASO_ORDENAMIENTO.MOVER ? 1 : 0) : datos.movimientos,
      mensaje: datos.mensaje || '',
      ordenadosRangos: comprimirIndicesOrdenamiento(datos.ordenados || []),
      cambios: Array.from(cambios)
    };
    if (datos.salto != null) registro.salto = datos.salto;
    if (datos.segmento) registro.segmento = datos.segmento;
    cambios.clear();
    if (datos.grupo) {
      registro.grupoInicio = datos.grupo[0];
    }
    ['izquierdo', 'derecho'].forEach(clave => {
      if (!datos[clave]) return;
      if (!idsMitades.has(datos[clave])) idsMitades.set(datos[clave], datos[clave].map(p => p.id));
      registro[clave] = idsMitades.get(datos[clave]);
    });
    if (datos.auxiliar) {
      registro.cambiosAuxiliar = [];
      datos.auxiliar.forEach((p, i) => {
        const id = p ? p.id : null;
        if (auxiliarAnterior[i] !== id) registro.cambiosAuxiliar.push([i, id]);
        auxiliarAnterior[i] = id;
      });
      registro.tieneAuxiliar = true;
    }
    const indice = hist.eventos.length;
    hist.eventos.push(registro);
    if (indice % INTERVALO_CHECKPOINT_ORDENAMIENTO === 0) {
      hist.checkpoints.push({ indice, arreglo: arr.map(p => p.id), auxiliar: auxiliarAnterior.slice() });
    }
    return registro;
  }
  return { hist, contadores, paso, intercambiar, escribir };
}

function obtenerPasoOrdenamiento(historial, indice) {
  if (!historial || !historial.eventos.length) return null;
  const i = Math.max(0, Math.min(historial.eventos.length - 1, Math.trunc(indice)));
  const checkpoint = historial.checkpoints[Math.floor(i / INTERVALO_CHECKPOINT_ORDENAMIENTO)];
  const arreglo = checkpoint.arreglo.slice();
  const auxiliar = checkpoint.auxiliar.slice();
  for (let j = checkpoint.indice + 1; j <= i; j++) {
    const evento = historial.eventos[j];
    evento.cambios.forEach(([posicion, id]) => { arreglo[posicion] = id; });
    (evento.cambiosAuxiliar || []).forEach(([posicion, id]) => { auxiliar[posicion] = id; });
  }
  const evento = historial.eventos[i];
  const pino = id => id == null ? null : { ...historial.pinos[Number(id.slice(1))] };
  const paso = Object.assign({}, evento, {
    arreglo: arreglo.map(pino), ordenados: expandirIndicesOrdenamiento(evento.ordenadosRangos),
    comparando: evento.comparando.slice(), moviendo: evento.moviendo.slice()
  });
  if (evento.grupoInicio != null) {
    paso.grupo = [];
    for (let j = evento.grupoInicio; j < arreglo.length; j += evento.salto) paso.grupo.push(j);
  }
  ['izquierdo', 'derecho'].forEach(clave => { if (evento[clave]) paso[clave] = evento[clave].map(pino); });
  if (evento.tieneAuxiliar) paso.auxiliar = auxiliar.map(pino);
  return paso;
}

function* generarSelectionSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso, intercambiar, escribir } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const ordenados = [];

  yield paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Selection Sort con ${n} pinos.` });
  if (n === 0) return hist;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    const pasada = i + 1;
    yield paso({ tipo: T.SELECCION, pasada, linea: 1, minimo: minIdx, ordenados: [...ordenados],
      mensaje: `Pasada ${pasada}: se asume que ${arr[i].valor} (posición ${i}) es el menor.` });

    for (let j = i + 1; j < n; j++) {
      contadores.comparaciones++;
      yield paso({ tipo: T.COMPARAR, pasada, linea: 3, comparando: [j], minimo: minIdx, ordenados: [...ordenados],
        mensaje: `¿${arr[j].valor} < ${arr[minIdx].valor}? ${arr[j].valor < arr[minIdx].valor ? 'Sí: nuevo mínimo.' : 'No: el mínimo sigue siendo ' + arr[minIdx].valor + '.'}` });
      if (arr[j].valor < arr[minIdx].valor) {
        minIdx = j;
        yield paso({ tipo: T.MINIMO, pasada, linea: 4, minimo: minIdx, ordenados: [...ordenados],
          mensaje: `Nuevo mínimo: ${arr[minIdx].valor} en la posición ${minIdx}.` });
      }
    }

    if (minIdx !== i) {
      contadores.intercambios++;
      const a = arr[i].valor, b = arr[minIdx].valor;
      intercambiar(i, minIdx);
      yield paso({ tipo: T.MOVER, pasada, linea: 5, moviendo: [i, minIdx], ordenados: [...ordenados],
        mensaje: `Intercambio: ${b} pasa a la posición ${i} y ${a} a la posición ${minIdx}.` });
    }
    ordenados.push(i);
    yield paso({ tipo: T.FIJAR, pasada, linea: 6, ordenados: [...ordenados],
      mensaje: minIdx === i
        ? `${arr[i].valor} ya era el menor: queda fijo en la posición ${i}.`
        : `${arr[i].valor} queda fijo en la posición ${i}.` });
  }

  ordenados.push(n - 1);
  yield paso({ tipo: T.FIN, pasada: n - 1, linea: -1, ordenados: [...ordenados],
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} intercambios.` });
  return hist;
}

function* generarInsertionSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso, intercambiar, escribir } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const rango = k => [...Array(k).keys()];

  yield paso({ tipo: T.INICIO, linea: 0, ordenados: n ? [0] : [], mensaje: `Inicio de Insertion Sort con ${n} pinos. El primero ya forma la parte ordenada.` });
  if (n === 0) return hist;

  for (let i = 1; i < n; i++) {
    const clave = arr[i].valor;
    let j = i - 1;
    yield paso({ tipo: T.SELECCION, pasada: i, linea: 1, sostenido: i, ordenados: rango(i),
      mensaje: `Pasada ${i}: se levanta ${clave} para insertarlo en la parte ordenada.` });

    while (j >= 0) {
      contadores.comparaciones++;
      const mayor = arr[j].valor > clave;
      yield paso({ tipo: T.COMPARAR, pasada: i, linea: 3, comparando: [j], sostenido: j + 1, ordenados: rango(i),
        mensaje: `¿${arr[j].valor} > ${clave}? ${mayor ? 'Sí: se corre a la derecha.' : 'No: aquí va ' + clave + '.'}` });
      if (!mayor) break;
      contadores.intercambios++;
      intercambiar(j, j + 1);
      yield paso({ tipo: T.MOVER, pasada: i, linea: 4, moviendo: [j + 1], sostenido: j, ordenados: rango(i),
        mensaje: `${arr[j + 1].valor} se desplaza a la posición ${j + 1}.` });
      j--;
    }

    yield paso({ tipo: T.FIJAR, pasada: i, linea: 6, moviendo: [j + 1], ordenados: rango(i + 1),
      mensaje: `${clave} se inserta en la posición ${j + 1}. Ya hay ${i + 1} pinos ordenados.` });
  }

  yield paso({ tipo: T.FIN, pasada: n - 1, linea: -1, ordenados: rango(n),
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} desplazamientos.` });
  return hist;
}

function* generarBubbleSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso, intercambiar, escribir } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const ordenados = [];

  yield paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Bubble Sort con ${n} pinos.` });
  if (n === 0) return hist;

  for (let i = 0; i < n - 1; i++) {
    let huboCambio = false;
    const pasada = i + 1;
    yield paso({ tipo: T.SELECCION, pasada, linea: 1, ordenados: [...ordenados],
      mensaje: `Pasada ${pasada}: el mayor de los no ordenados subirá hasta la posición ${n - 1 - i}.` });

    for (let j = 0; j < n - 1 - i; j++) {
      contadores.comparaciones++;
      const mayor = arr[j].valor > arr[j + 1].valor;
      yield paso({ tipo: T.COMPARAR, pasada, linea: 3, comparando: [j, j + 1], ordenados: [...ordenados],
        mensaje: `¿${arr[j].valor} > ${arr[j + 1].valor}? ${mayor ? 'Sí: se intercambian.' : 'No: ya están en orden.'}` });
      if (mayor) {
        huboCambio = true;
        contadores.intercambios++;
        intercambiar(j, j + 1);
        yield paso({ tipo: T.MOVER, pasada, linea: 4, moviendo: [j, j + 1], ordenados: [...ordenados],
          mensaje: `Intercambio: ${arr[j].valor} ↔ ${arr[j + 1].valor}.` });
      }
    }

    ordenados.unshift(n - 1 - i);
    if (!huboCambio) {
      const todos = [...Array(n).keys()];
      yield paso({ tipo: T.FIJAR, pasada, linea: 6, ordenados: todos,
        mensaje: 'Sin intercambios en esta pasada: el arreglo ya está ordenado.' });
      ordenados.splice(0, ordenados.length, ...todos);
      break;
    }
    yield paso({ tipo: T.FIJAR, pasada, linea: 6, ordenados: [...ordenados],
      mensaje: `${arr[n - 1 - i].valor} queda fijo en la posición ${n - 1 - i}.` });
  }

  yield paso({ tipo: T.FIN, linea: -1, ordenados: [...Array(n).keys()],
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} intercambios.` });
  return hist;
}

function* generarShellSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso, intercambiar, escribir } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const saltos = [];
  for (let salto = Math.floor(n / 2); salto > 0; salto = Math.floor(salto / 2)) saltos.push(salto);

  yield paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Shell Sort con ${n} pinos. Los movimientos se cuentan como intercambios entre posiciones separadas por el salto.` });
  if (!n) return hist;

  for (const [pasada, salto] of saltos.entries()) {
    yield paso({ tipo: T.SELECCION, pasada: pasada + 1, salto, linea: 1,
      mensaje: `Comienza la pasada ${pasada + 1} con salto ${salto}. Los pinos de cada grupo están separados por ${salto} posiciones.` });
    for (let i = salto; i < n; i++) {
      const grupo = [];
      for (let k = i % salto; k < n; k += salto) grupo.push(k);
      let j = i;
      while (j >= salto) {
        contadores.comparaciones++;
        const cambiar = arr[j - salto].valor > arr[j].valor;
        yield paso({ tipo: T.COMPARAR, pasada: pasada + 1, salto, grupo, linea: 4,
          comparando: [j - salto, j],
          mensaje: `En el grupo [${grupo.join(', ')}], ¿${arr[j - salto].valor} > ${arr[j].valor}? ${cambiar ? 'Sí: se desplaza el pino hacia la izquierda, a distancia ' + salto + '.' : 'No: este pino ya está en la posición correcta del grupo.'}` });
        if (!cambiar) break;
        const valorIzquierdo = arr[j - salto].valor, valorDerecho = arr[j].valor;
        intercambiar(j - salto, j);
        contadores.intercambios++;
        yield paso({ tipo: T.MOVER, pasada: pasada + 1, salto, grupo, linea: 5,
          moviendo: [j - salto, j],
          mensaje: `Intercambio a distancia ${salto}: ${valorDerecho} avanza a la posición ${j - salto} y ${valorIzquierdo} retrocede a ${j}.` });
        j -= salto;
      }
      yield paso({ tipo: T.FIJAR, pasada: pasada + 1, salto, grupo, linea: 3,
        mensaje: `La inserción de la posición ${i} termina para este grupo; ninguna posición se marca definitiva todavía.` });
    }
  }

  yield paso({ tipo: T.FIN, pasada: saltos.length, salto: 0, linea: -1, ordenados: [...Array(n).keys()],
    mensaje: `¡Listo! La última pasada usó salto 1. ${contadores.comparaciones} comparaciones y ${contadores.intercambios} movimientos.` });
  return hist;
}

function* generarMergeSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso, intercambiar, escribir } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const auxiliar = Array(n).fill(null);

  yield paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Merge Sort con ${n} pinos. Las escrituras en el auxiliar y las copias de vuelta cuentan como movimientos.` });
  if (!n) return hist;

  function* mezclar(inicio, medio, fin) {
    const izquierdo = arr.slice(inicio, medio + 1);
    const derecho = arr.slice(medio + 1, fin + 1);
    let i = 0, j = 0, k = inicio;
    const segmento = [inicio, fin];
    const datosMezcla = () => ({
      segmento,
      izquierdo,
      derecho,
      auxiliar,
      comparando: [i < izquierdo.length ? inicio + i : -1, j < derecho.length ? medio + 1 + j : -1].filter(x => x >= 0)
    });

    while (i < izquierdo.length || j < derecho.length) {
      let elegido;
      if (i < izquierdo.length && j < derecho.length) {
        contadores.comparaciones++;
        const tomaIzquierdo = izquierdo[i].valor <= derecho[j].valor;
        yield paso(Object.assign({ tipo: T.COMPARAR, pasada: 0, linea: 5,
          mensaje: `Se comparan ${izquierdo[i].valor} (izquierda) y ${derecho[j].valor} (derecha). ${tomaIzquierdo ? 'Se elige primero el izquierdo' : 'Se elige el derecho'}${izquierdo[i].valor === derecho[j].valor ? ' para conservar la estabilidad' : ''}.` }, datosMezcla()));
        elegido = tomaIzquierdo ? izquierdo[i++] : derecho[j++];
      } else {
        const desdeIzquierdo = i < izquierdo.length;
        elegido = desdeIzquierdo ? izquierdo[i++] : derecho[j++];
        yield paso(Object.assign({ tipo: T.SELECCION, pasada: 0, linea: 6,
          mensaje: `La mitad ${desdeIzquierdo ? 'derecha' : 'izquierda'} se agotó; se selecciona ${elegido.valor} de la mitad restante.` }, datosMezcla()));
      }
      auxiliar[k] = { id: elegido.id, valor: elegido.valor };
      contadores.intercambios++;
      yield paso(Object.assign({ tipo: T.MOVER, pasada: 0, linea: 6, moviendo: [k],
        mensaje: `Se copia ${elegido.valor} al espacio auxiliar en la posición ${k}.` }, datosMezcla()));
      k++;
    }

    const cantidadCopiada = fin - inicio + 1;
    for (let destino = inicio; destino <= fin; destino++) {
      escribir(destino, { id: auxiliar[destino].id, valor: auxiliar[destino].valor });
      contadores.intercambios++;
    }
    yield paso(Object.assign({ tipo: T.MOVER, pasada: 0, linea: 7, moviendo: Array.from({ length: cantidadCopiada }, (_, i) => inicio + i),
      movimientos: cantidadCopiada,
      mensaje: `Se copia el segmento auxiliar completo [${inicio}, ${fin}] de vuelta al arreglo principal (${cantidadCopiada} pinos).` }, datosMezcla()));
    yield paso(Object.assign({ tipo: T.FIJAR, pasada: 0, linea: 7,
      mensaje: `El segmento [${inicio}, ${fin}] ya quedó mezclado en orden ascendente.` }, datosMezcla()));
  }

  function* dividir(inicio, fin) {
    if (inicio >= fin) return;
    const medio = Math.floor((inicio + fin) / 2);
    yield paso({ tipo: T.SELECCION, pasada: 0, linea: 2, segmento: [inicio, fin],
      mensaje: `Se divide el segmento [${inicio}, ${fin}] en [${inicio}, ${medio}] y [${medio + 1}, ${fin}].` });
    yield* dividir(inicio, medio);
    yield* dividir(medio + 1, fin);
    yield* mezclar(inicio, medio, fin);
  }

  yield* dividir(0, n - 1);
  yield paso({ tipo: T.FIN, pasada: 0, linea: -1, ordenados: [...Array(n).keys()],
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} movimientos (escrituras en auxiliar y copias de vuelta).` });
  return hist;
}

const GENERADORES_ORDENAMIENTO = {
  selection: generarSelectionSort, insertion: generarInsertionSort,
  bubble: generarBubbleSort, shell: generarShellSort, merge: generarMergeSort
};

function ejecutarOrdenamientoCompacto(algoritmo, valores) {
  if (!Object.prototype.hasOwnProperty.call(GENERADORES_ORDENAMIENTO, algoritmo)) throw new Error('Algoritmo desconocido: ' + algoritmo);
  const generador = GENERADORES_ORDENAMIENTO[algoritmo](valores);
  let siguiente;
  do { siguiente = generador.next(); } while (!siguiente.done);
  return siguiente.value;
}

/* La preparación cede cada 8 ms o 256 eventos. La cancelación nunca publica
 * un historial incompleto. El intervalo de reproducción no afecta al cálculo. */
async function prepararOrdenamiento(algoritmo, valores, opciones) {
  const config = opciones || {};
  if (!Object.prototype.hasOwnProperty.call(GENERADORES_ORDENAMIENTO, algoritmo)) throw new Error('Algoritmo desconocido: ' + algoritmo);
  const generador = GENERADORES_ORDENAMIENTO[algoritmo](valores.slice());
  const ceder = config.ceder || (() => new Promise(resolve => setTimeout(resolve, 0)));
  let siguiente;
  do {
    const inicio = Date.now();
    let cantidad = 0;
    do {
      if (config.cancelado && config.cancelado()) return null;
      siguiente = generador.next();
      cantidad++;
    } while (!siguiente.done && cantidad < 256 && Date.now() - inicio < 8);
    if (!siguiente.done) await ceder();
  } while (!siguiente.done);
  return config.cancelado && config.cancelado() ? null : siguiente.value;
}

function ejecutarOrdenamiento(algoritmo, valores) {
  const compacto = ejecutarOrdenamientoCompacto(algoritmo, valores);
  // Compatibilidad indexada sin conservar n pinos por cada evento grande.
  // Los métodos nativos de Array consultan cada instantánea a demanda.
  if (valores.length > 12) {
    const indices = propiedad => typeof propiedad === 'string' && /^(0|[1-9]\d*)$/.test(propiedad) && Number(propiedad) < compacto.eventos.length;
    return new Proxy(Array(compacto.eventos.length), {
      get(objeto, propiedad, receptor) {
        return indices(propiedad) ? obtenerPasoOrdenamiento(compacto, Number(propiedad)) : Reflect.get(objeto, propiedad, receptor);
      },
      has(objeto, propiedad) { return indices(propiedad) || Reflect.has(objeto, propiedad); }
    });
  }
  return compacto.eventos.map((_, i) => obtenerPasoOrdenamiento(compacto, i));
}
function ordenarSelectionSort(valores) { return ejecutarOrdenamiento('selection', valores); }
function ordenarInsertionSort(valores) { return ejecutarOrdenamiento('insertion', valores); }
function ordenarBubbleSort(valores) { return ejecutarOrdenamiento('bubble', valores); }
function ordenarShellSort(valores) { return ejecutarOrdenamiento('shell', valores); }
function ordenarMergeSort(valores) { return ejecutarOrdenamiento('merge', valores); }
const ALGORITMOS_ORDENAMIENTO = {
  selection: ordenarSelectionSort, insertion: ordenarInsertionSort, bubble: ordenarBubbleSort,
  shell: ordenarShellSort, merge: ordenarMergeSort
};

/* Analiza texto del usuario: enteros separados por coma, espacio o punto y coma. */
function analizarValoresOrdenamiento(texto, limites) {
  const { min = 1, max = 99, cantidadMin = 2, cantidadMax = 200 } = limites || {};
  const partes = String(texto || '').split(/[\s,;]+/).filter(Boolean);
  if (partes.length < cantidadMin) return { ok: false, error: `Escribe al menos ${cantidadMin} valores.` };
  if (partes.length > cantidadMax) return { ok: false, error: `Como máximo ${cantidadMax} valores.` };
  const valores = [];
  for (const p of partes) {
    if (!/^-?\d+$/.test(p)) return { ok: false, error: `«${p}» no es un número entero.` };
    const v = Number(p);
    if (v < min || v > max) return { ok: false, error: `Los valores deben estar entre ${min} y ${max} (recibido ${v}).` };
    valores.push(v);
  }
  return { ok: true, valores };
}
