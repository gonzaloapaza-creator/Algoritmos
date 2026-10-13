// js/ordenamiento/estado.js
'use strict';

const LIMITES_ORDENAMIENTO = { min: 1, max: 99, cantidadMin: 3, cantidadMax: 12, cantidadPorDefecto: 8 };

const estadoOrdenamiento = {
  valores: [],            // arreglo original (enteros)
  historial: [],          // pasos devueltos por el algoritmo
  pasoActual: 0,
  algoritmo: 'selection', // 'selection' | 'insertion' | 'bubble'
  cantidad: LIMITES_ORDENAMIENTO.cantidadPorDefecto,
  reproduciendo: false,
  intervalo: null
};

function generarValoresOrdenamiento(cantidad) {
  const { min, max } = LIMITES_ORDENAMIENTO;
  const nuevo = [];
  for (let i = 0; i < cantidad; i++) nuevo.push(Math.floor(Math.random() * (max - min + 1)) + min);
  return nuevo;
}
