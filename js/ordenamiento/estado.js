// js/ordenamiento/estado.js
'use strict';

const estadoOrdenamiento = {
  arregloActual: [],
  historialPasos: [],
  pasoActual: 0,
  algoritmo: 'selection',
  intervaloAuto: null // Nuevo: Guardará el ID del temporizador para la reproducción
};

function generarArregloAleatorio(cantidad = 10) {
  const nuevoArreglo = [];
  for (let i = 0; i < cantidad; i++) {
    nuevoArreglo.push(Math.floor(Math.random() * 90) + 10);
  }
  return nuevoArreglo;
}