// js/ordenamiento/algoritmos.js
// Lógica pura (sin DOM): cada algoritmo devuelve el historial completo de pasos.
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

/* Crea un registrador de pasos que copia el arreglo y rellena los campos por defecto. */
function crearRegistro(arr) {
  const hist = [];
  const contadores = { comparaciones: 0, intercambios: 0 };
  function paso(datos) {
    const registro = Object.assign({
      tipo: TIPOS_PASO_ORDENAMIENTO.COMPARAR,
      arreglo: arr.map(p => ({ id: p.id, valor: p.valor })),
      comparando: [], moviendo: [], ordenados: [],
      minimo: null, sostenido: null, pasada: 0, linea: -1,
      comparaciones: contadores.comparaciones,
      intercambios: contadores.intercambios,
      movimientos: 0,
      mensaje: ''
    }, datos);
    if (datos.movimientos == null && registro.tipo === TIPOS_PASO_ORDENAMIENTO.MOVER) registro.movimientos = 1;
    hist.push(registro);
    const ultimo = registro;
    ultimo.comparando = ultimo.comparando.slice();
    ultimo.moviendo = ultimo.moviendo.slice();
    ultimo.ordenados = ultimo.ordenados.slice();
    if (ultimo.grupo) ultimo.grupo = ultimo.grupo.slice();
    if (ultimo.segmento) ultimo.segmento = ultimo.segmento.slice();
    if (ultimo.izquierdo) ultimo.izquierdo = ultimo.izquierdo.map(p => p && ({ id: p.id, valor: p.valor }));
    if (ultimo.derecho) ultimo.derecho = ultimo.derecho.map(p => p && ({ id: p.id, valor: p.valor }));
    if (ultimo.auxiliar) ultimo.auxiliar = ultimo.auxiliar.map(p => p && ({ id: p.id, valor: p.valor }));
  }
  return { hist, contadores, paso };
}

function ordenarSelectionSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const ordenados = [];

  paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Selection Sort con ${n} pinos.` });
  if (n === 0) return hist;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    const pasada = i + 1;
    paso({ tipo: T.SELECCION, pasada, linea: 1, minimo: minIdx, ordenados: [...ordenados],
      mensaje: `Pasada ${pasada}: se asume que ${arr[i].valor} (posición ${i}) es el menor.` });

    for (let j = i + 1; j < n; j++) {
      contadores.comparaciones++;
      paso({ tipo: T.COMPARAR, pasada, linea: 3, comparando: [j], minimo: minIdx, ordenados: [...ordenados],
        mensaje: `¿${arr[j].valor} < ${arr[minIdx].valor}? ${arr[j].valor < arr[minIdx].valor ? 'Sí: nuevo mínimo.' : 'No: el mínimo sigue siendo ' + arr[minIdx].valor + '.'}` });
      if (arr[j].valor < arr[minIdx].valor) {
        minIdx = j;
        paso({ tipo: T.MINIMO, pasada, linea: 4, minimo: minIdx, ordenados: [...ordenados],
          mensaje: `Nuevo mínimo: ${arr[minIdx].valor} en la posición ${minIdx}.` });
      }
    }

    if (minIdx !== i) {
      contadores.intercambios++;
      const a = arr[i].valor, b = arr[minIdx].valor;
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      paso({ tipo: T.MOVER, pasada, linea: 5, moviendo: [i, minIdx], ordenados: [...ordenados],
        mensaje: `Intercambio: ${b} pasa a la posición ${i} y ${a} a la posición ${minIdx}.` });
    }
    ordenados.push(i);
    paso({ tipo: T.FIJAR, pasada, linea: 6, ordenados: [...ordenados],
      mensaje: minIdx === i
        ? `${arr[i].valor} ya era el menor: queda fijo en la posición ${i}.`
        : `${arr[i].valor} queda fijo en la posición ${i}.` });
  }

  ordenados.push(n - 1);
  paso({ tipo: T.FIN, pasada: n - 1, linea: -1, ordenados: [...ordenados],
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} intercambios.` });
  return hist;
}

function ordenarInsertionSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const rango = k => [...Array(k).keys()];

  paso({ tipo: T.INICIO, linea: 0, ordenados: n ? [0] : [], mensaje: `Inicio de Insertion Sort con ${n} pinos. El primero ya forma la parte ordenada.` });
  if (n === 0) return hist;

  for (let i = 1; i < n; i++) {
    const clave = arr[i].valor;
    let j = i - 1;
    paso({ tipo: T.SELECCION, pasada: i, linea: 1, sostenido: i, ordenados: rango(i),
      mensaje: `Pasada ${i}: se levanta ${clave} para insertarlo en la parte ordenada.` });

    while (j >= 0) {
      contadores.comparaciones++;
      const mayor = arr[j].valor > clave;
      paso({ tipo: T.COMPARAR, pasada: i, linea: 3, comparando: [j], sostenido: j + 1, ordenados: rango(i),
        mensaje: `¿${arr[j].valor} > ${clave}? ${mayor ? 'Sí: se corre a la derecha.' : 'No: aquí va ' + clave + '.'}` });
      if (!mayor) break;
      contadores.intercambios++;
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      paso({ tipo: T.MOVER, pasada: i, linea: 4, moviendo: [j + 1], sostenido: j, ordenados: rango(i),
        mensaje: `${arr[j + 1].valor} se desplaza a la posición ${j + 1}.` });
      j--;
    }

    paso({ tipo: T.FIJAR, pasada: i, linea: 6, moviendo: [j + 1], ordenados: rango(i + 1),
      mensaje: `${clave} se inserta en la posición ${j + 1}. Ya hay ${i + 1} pinos ordenados.` });
  }

  paso({ tipo: T.FIN, pasada: n - 1, linea: -1, ordenados: rango(n),
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} desplazamientos.` });
  return hist;
}

function ordenarBubbleSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const ordenados = [];

  paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Bubble Sort con ${n} pinos.` });
  if (n === 0) return hist;

  for (let i = 0; i < n - 1; i++) {
    let huboCambio = false;
    const pasada = i + 1;
    paso({ tipo: T.SELECCION, pasada, linea: 1, ordenados: [...ordenados],
      mensaje: `Pasada ${pasada}: el mayor de los no ordenados subirá hasta la posición ${n - 1 - i}.` });

    for (let j = 0; j < n - 1 - i; j++) {
      contadores.comparaciones++;
      const mayor = arr[j].valor > arr[j + 1].valor;
      paso({ tipo: T.COMPARAR, pasada, linea: 3, comparando: [j, j + 1], ordenados: [...ordenados],
        mensaje: `¿${arr[j].valor} > ${arr[j + 1].valor}? ${mayor ? 'Sí: se intercambian.' : 'No: ya están en orden.'}` });
      if (mayor) {
        huboCambio = true;
        contadores.intercambios++;
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        paso({ tipo: T.MOVER, pasada, linea: 4, moviendo: [j, j + 1], ordenados: [...ordenados],
          mensaje: `Intercambio: ${arr[j].valor} ↔ ${arr[j + 1].valor}.` });
      }
    }

    ordenados.unshift(n - 1 - i);
    if (!huboCambio) {
      const todos = [...Array(n).keys()];
      paso({ tipo: T.FIJAR, pasada, linea: 6, ordenados: todos,
        mensaje: 'Sin intercambios en esta pasada: el arreglo ya está ordenado.' });
      ordenados.splice(0, ordenados.length, ...todos);
      break;
    }
    paso({ tipo: T.FIJAR, pasada, linea: 6, ordenados: [...ordenados],
      mensaje: `${arr[n - 1 - i].valor} queda fijo en la posición ${n - 1 - i}.` });
  }

  paso({ tipo: T.FIN, linea: -1, ordenados: [...Array(n).keys()],
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} intercambios.` });
  return hist;
}

function ordenarShellSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const saltos = [];
  for (let salto = Math.floor(n / 2); salto > 0; salto = Math.floor(salto / 2)) saltos.push(salto);

  paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Shell Sort con ${n} pinos. Los movimientos se cuentan como intercambios entre posiciones separadas por el salto.` });
  if (!n) return hist;

  saltos.forEach((salto, pasada) => {
    paso({ tipo: T.SELECCION, pasada: pasada + 1, salto, linea: 1,
      mensaje: `Comienza la pasada ${pasada + 1} con salto ${salto}. Los pinos de cada grupo están separados por ${salto} posiciones.` });
    for (let i = salto; i < n; i++) {
      const grupo = [];
      for (let k = i % salto; k < n; k += salto) grupo.push(k);
      let j = i;
      while (j >= salto) {
        contadores.comparaciones++;
        const cambiar = arr[j - salto].valor > arr[j].valor;
        paso({ tipo: T.COMPARAR, pasada: pasada + 1, salto, grupo, linea: 4,
          comparando: [j - salto, j],
          mensaje: `En el grupo [${grupo.join(', ')}], ¿${arr[j - salto].valor} > ${arr[j].valor}? ${cambiar ? 'Sí: se desplaza el pino hacia la izquierda, a distancia ' + salto + '.' : 'No: este pino ya está en la posición correcta del grupo.'}` });
        if (!cambiar) break;
        const valorIzquierdo = arr[j - salto].valor, valorDerecho = arr[j].valor;
        [arr[j - salto], arr[j]] = [arr[j], arr[j - salto]];
        contadores.intercambios++;
        paso({ tipo: T.MOVER, pasada: pasada + 1, salto, grupo, linea: 5,
          moviendo: [j - salto, j],
          mensaje: `Intercambio a distancia ${salto}: ${valorDerecho} avanza a la posición ${j - salto} y ${valorIzquierdo} retrocede a ${j}.` });
        j -= salto;
      }
      paso({ tipo: T.FIJAR, pasada: pasada + 1, salto, grupo, linea: 3,
        mensaje: `La inserción de la posición ${i} termina para este grupo; ninguna posición se marca definitiva todavía.` });
    }
  });

  paso({ tipo: T.FIN, pasada: saltos.length, salto: 0, linea: -1, ordenados: [...Array(n).keys()],
    mensaje: `¡Listo! La última pasada usó salto 1. ${contadores.comparaciones} comparaciones y ${contadores.intercambios} movimientos.` });
  return hist;
}

function ordenarMergeSort(valores) {
  const arr = pinosDesdeValores(valores);
  const n = arr.length;
  const { hist, contadores, paso } = crearRegistro(arr);
  const T = TIPOS_PASO_ORDENAMIENTO;
  const auxiliar = Array(n).fill(null);

  paso({ tipo: T.INICIO, linea: 0, mensaje: `Inicio de Merge Sort con ${n} pinos. Las escrituras en el auxiliar y las copias de vuelta cuentan como movimientos.` });
  if (!n) return hist;

  function mezclar(inicio, medio, fin) {
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
        paso(Object.assign({ tipo: T.COMPARAR, pasada: 0, linea: 5,
          mensaje: `Se comparan ${izquierdo[i].valor} (izquierda) y ${derecho[j].valor} (derecha). ${tomaIzquierdo ? 'Se elige primero el izquierdo' : 'Se elige el derecho'}${izquierdo[i].valor === derecho[j].valor ? ' para conservar la estabilidad' : ''}.` }, datosMezcla()));
        elegido = tomaIzquierdo ? izquierdo[i++] : derecho[j++];
      } else {
        const desdeIzquierdo = i < izquierdo.length;
        elegido = desdeIzquierdo ? izquierdo[i++] : derecho[j++];
        paso(Object.assign({ tipo: T.SELECCION, pasada: 0, linea: 6,
          mensaje: `La mitad ${desdeIzquierdo ? 'derecha' : 'izquierda'} se agotó; se selecciona ${elegido.valor} de la mitad restante.` }, datosMezcla()));
      }
      auxiliar[k] = { id: elegido.id, valor: elegido.valor };
      contadores.intercambios++;
      paso(Object.assign({ tipo: T.MOVER, pasada: 0, linea: 6, moviendo: [k],
        mensaje: `Se copia ${elegido.valor} al espacio auxiliar en la posición ${k}.` }, datosMezcla()));
      k++;
    }

    const cantidadCopiada = fin - inicio + 1;
    for (let destino = inicio; destino <= fin; destino++) {
      arr[destino] = { id: auxiliar[destino].id, valor: auxiliar[destino].valor };
      contadores.intercambios++;
    }
    paso(Object.assign({ tipo: T.MOVER, pasada: 0, linea: 7, moviendo: Array.from({ length: cantidadCopiada }, (_, i) => inicio + i),
      movimientos: cantidadCopiada,
      mensaje: `Se copia el segmento auxiliar completo [${inicio}, ${fin}] de vuelta al arreglo principal (${cantidadCopiada} pinos).` }, datosMezcla()));
    paso(Object.assign({ tipo: T.FIJAR, pasada: 0, linea: 7,
      mensaje: `El segmento [${inicio}, ${fin}] ya quedó mezclado en orden ascendente.` }, datosMezcla()));
  }

  function dividir(inicio, fin) {
    if (inicio >= fin) return;
    const medio = Math.floor((inicio + fin) / 2);
    paso({ tipo: T.SELECCION, pasada: 0, linea: 2, segmento: [inicio, fin],
      mensaje: `Se divide el segmento [${inicio}, ${fin}] en [${inicio}, ${medio}] y [${medio + 1}, ${fin}].` });
    dividir(inicio, medio);
    dividir(medio + 1, fin);
    mezclar(inicio, medio, fin);
  }

  dividir(0, n - 1);
  paso({ tipo: T.FIN, pasada: 0, linea: -1, ordenados: [...Array(n).keys()],
    mensaje: `¡Listo! ${contadores.comparaciones} comparaciones y ${contadores.intercambios} movimientos (escrituras en auxiliar y copias de vuelta).` });
  return hist;
}

const ALGORITMOS_ORDENAMIENTO = {
  selection: ordenarSelectionSort,
  insertion: ordenarInsertionSort,
  bubble: ordenarBubbleSort,
  shell: ordenarShellSort,
  merge: ordenarMergeSort
};

function ejecutarOrdenamiento(algoritmo, valores) {
  const fn = ALGORITMOS_ORDENAMIENTO[algoritmo];
  if (!fn) throw new Error('Algoritmo desconocido: ' + algoritmo);
  return fn(valores);
}

/* Analiza texto del usuario: enteros separados por coma, espacio o punto y coma. */
function analizarValoresOrdenamiento(texto, limites) {
  const { min = 1, max = 99, cantidadMin = 2, cantidadMax = 12 } = limites || {};
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
