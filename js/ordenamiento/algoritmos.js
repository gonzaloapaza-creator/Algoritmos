// js/ordenamiento/algoritmos.js
'use strict';

/**
 * Calcula todos los pasos del algoritmo Selection Sort.
 */
function calcularSelectionSort(arregloInicial) {
  const historial = [];
  const arr = [...arregloInicial];
  const n = arr.length;
  const ordenados = [];
  
  let comparaciones = 0;
  let intercambios = 0;

  // Función de ayuda para guardar los fotogramas más fácilmente
  const agregarPaso = (comparando, moviendo, mensaje) => {
    historial.push({ 
      arreglo: [...arr], 
      comparando, 
      moviendo, 
      ordenados: [...ordenados], 
      mensaje, 
      stats: { comparaciones, intercambios } 
    });
  };

  agregarPaso([], [], "Inicio de Selection Sort.");

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comparaciones++;
      agregarPaso([minIdx, j], [], `Buscando el menor: comparando ${arr[minIdx]} y ${arr[j]}.`);
      
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        agregarPaso([], [minIdx], `Nuevo menor temporal encontrado: ${arr[minIdx]}.`);
      }
    }
    
    if (minIdx !== i) {
      intercambios++;
      agregarPaso([], [i, minIdx], `Intercambiando ${arr[i]} con el menor encontrado (${arr[minIdx]}).`);
      
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
    }
    
    ordenados.push(i);
    agregarPaso([], [], `El pino ${arr[i]} ya está en su posición final.`);
  }
  
  ordenados.push(n - 1);
  agregarPaso([], [], "¡Selection Sort terminado!");
  
  return historial;
}

/**
 * Calcula todos los pasos del algoritmo Insertion Sort.
 */
function calcularInsertionSort(arregloInicial) {
  const historial = [];
  const arr = [...arregloInicial];
  const n = arr.length;
  const ordenados = [0]; 
  
  let comparaciones = 0;
  let intercambios = 0; // Para este algoritmo, representa los desplazamientos

  const agregarPaso = (comparando, moviendo, mensaje) => {
    historial.push({ 
      arreglo: [...arr], 
      comparando, 
      moviendo, 
      ordenados: [...ordenados], 
      mensaje, 
      stats: { comparaciones, intercambios } 
    });
  };

  agregarPaso([], [], "Inicio de Insertion Sort. El primer elemento se asume ordenado.");

  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;

    agregarPaso([], [i], `Evaluando el pino ${key} para insertarlo.`);

    while (j >= 0) {
      comparaciones++;
      agregarPaso([j, j + 1], [], `Comparando ${arr[j]} y ${key}.`);
      
      if (arr[j] > key) {
        intercambios++;
        arr[j + 1] = arr[j];
        agregarPaso([], [j + 1], `Desplazando ${arr[j]} a la derecha.`);
        j = j - 1;
      } else {
        break; // Está en la posición correcta respecto a esta parte del arreglo
      }
    }
    
    arr[j + 1] = key;
    if (!ordenados.includes(i)) ordenados.push(i);
    
    agregarPaso([], [j + 1], `Pino ${key} insertado en su posición correcta.`);
  }
  
  agregarPaso([], [], "¡Insertion Sort terminado!");
  
  return historial;
}