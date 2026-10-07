// js/ordenamiento/algoritmos.js
'use strict';

function ordenarSelectionSort(arreglo) {
  let hist = [];
  let arr = [...arreglo];
  let comparaciones = 0;
  let intercambios = 0;
  let n = arr.length;
  let ordenados = [];

  // Guardar estado inicial
  hist.push({
    arreglo: [...arr], comparando: [], moviendo: [], ordenados: [...ordenados],
    comparaciones, intercambios, mensaje: "Inicio de Selection Sort."
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comparaciones++;
      hist.push({
        arreglo: [...arr], comparando: [minIdx, j], moviendo: [], ordenados: [...ordenados],
        comparaciones, intercambios, mensaje: `Buscando el menor: comparando posición ${minIdx} con ${j}.`
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      intercambios++;
      hist.push({
        arreglo: [...arr], comparando: [], moviendo: [i, minIdx], ordenados: [...ordenados],
        comparaciones, intercambios, mensaje: `El menor es ${arr[minIdx]}. Intercambiando con ${arr[i]}.`
      });
      // Intercambio
      let temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
    } else {
      hist.push({
        arreglo: [...arr], comparando: [], moviendo: [], ordenados: [...ordenados],
        comparaciones, intercambios, mensaje: `El elemento ${arr[i]} ya está en su posición correcta.`
      });
    }
    ordenados.push(i);
  }
  
  ordenados.push(n - 1);
  hist.push({
    arreglo: [...arr], comparando: [], moviendo: [], ordenados: [...ordenados],
    comparaciones, intercambios, mensaje: "¡Arreglo ordenado exitosamente!"
  });

  return hist;
}

function ordenarInsertionSort(arreglo) {
  let hist = [];
  let arr = [...arreglo];
  let comparaciones = 0;
  let intercambios = 0;
  let n = arr.length;
  let ordenados = [0]; // El primer elemento se considera ordenado

  hist.push({
    arreglo: [...arr], comparando: [], moviendo: [], ordenados: [...ordenados],
    comparaciones, intercambios, mensaje: "Inicio de Insertion Sort."
  });

  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;

    hist.push({
      arreglo: [...arr], comparando: [i], moviendo: [], ordenados: [...ordenados],
      comparaciones, intercambios, mensaje: `Seleccionando ${key} para insertar en la parte ordenada.`
    });

    while (j >= 0) {
      comparaciones++;
      hist.push({
        arreglo: [...arr], comparando: [j, j + 1], moviendo: [], ordenados: [...ordenados],
        comparaciones, intercambios, mensaje: `Comparando ${key} con ${arr[j]}.`
      });

      if (arr[j] > key) {
        intercambios++;
        arr[j + 1] = arr[j];
        hist.push({
          arreglo: [...arr], comparando: [], moviendo: [j, j + 1], ordenados: [...ordenados],
          comparaciones, intercambios, mensaje: `${arr[j]} es mayor. Moviendo a la derecha.`
        });
        j = j - 1;
      } else {
        break; // Rompe el while si no es mayor
      }
    }
    
    arr[j + 1] = key;
    if (!ordenados.includes(i)) ordenados.push(i);

    hist.push({
      arreglo: [...arr], comparando: [], moviendo: [j + 1], ordenados: [...ordenados],
      comparaciones, intercambios, mensaje: `Insertando ${key} en su posición final.`
    });
  }

  hist.push({
    arreglo: [...arr], comparando: [], moviendo: [], ordenados: [...Array(n).keys()],
    comparaciones, intercambios, mensaje: "¡Arreglo ordenado exitosamente!"
  });

  return hist;
}