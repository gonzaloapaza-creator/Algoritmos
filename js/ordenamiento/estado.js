// js/ordenamiento/estado.js
'use strict';

const LIMITES_ORDENAMIENTO = { min: 1, max: 99, cantidadMin: 3, cantidadMax: 200, cantidadPorDefecto: 8 };
const VELOCIDADES_ORDENAMIENTO = ['1200', '650', '300', '120'];

const estadoOrdenamiento = {
  valores: [],            // arreglo original (enteros)
  historial: [],          // eventos compactos; los arreglos se reconstruyen a demanda
  registro: null,         // eventos, checkpoints y catálogo de pinos
  preparando: false,
  pasoActual: 0,
  algoritmo: 'selection', // 'selection' | 'insertion' | 'bubble' | 'shell' | 'merge'
  cantidad: LIMITES_ORDENAMIENTO.cantidadPorDefecto,
  reproduciendo: false,
  intervalo: null
};

function generarValoresOrdenamiento(cantidad) {
  const { min, max, cantidadMin, cantidadMax } = LIMITES_ORDENAMIENTO;
  if (!Number.isInteger(cantidad) || cantidad < cantidadMin || cantidad > cantidadMax) throw new Error(`La cantidad debe ser un entero entre ${cantidadMin} y ${cantidadMax}.`);
  const nuevo = [];
  for (let i = 0; i < cantidad; i++) nuevo.push(Math.floor(Math.random() * (max - min + 1)) + min);
  return nuevo;
}

/** Duración teórica de los intervalos entre eventos, independiente de la preparación. */
function estimarDuracionOrdenamiento(eventos, velocidad, pasoActual = 0) {
  const transiciones = Math.max(0, Number.isSafeInteger(eventos) ? eventos - 1 : 0);
  const intervalo = VELOCIDADES_ORDENAMIENTO.includes(String(velocidad)) ? Number(velocidad) : Number(VELOCIDADES_ORDENAMIENTO[1]);
  const actual = Math.max(0, Math.min(transiciones, Number.isSafeInteger(pasoActual) ? pasoActual : 0));
  return { totalMs: transiciones * intervalo, restanteMs: (transiciones - actual) * intervalo };
}

function formatearDuracionOrdenamiento(milisegundos) {
  const segundos = Math.max(0, Math.ceil(milisegundos / 1000));
  if (segundos < 60) return segundos + ' s';
  const minutos = Math.floor(segundos / 60), resto = segundos % 60;
  if (minutos < 60) return minutos + ' min' + (resto ? ' ' + resto + ' s' : '');
  return Math.floor(minutos / 60) + ' h' + (minutos % 60 ? ' ' + minutos % 60 + ' min' : '');
}

/* ---------------- Persistencia (lógica pura, sin DOM) ---------------- */

/** Instantánea serializable del estado visible. `velocidad` es el valor del selector. */
function instantaneaOrdenamiento(estado, velocidad) {
  return {
    version: 1,
    algoritmo: estado.algoritmo,
    valores: estado.valores.slice(),
    pasoActual: estado.pasoActual,
    velocidad: String(velocidad == null ? VELOCIDADES_ORDENAMIENTO[1] : velocidad)
  };
}

/**
 * Valida datos guardados (autoguardado o trabajo nombrado) y devuelve
 * { algoritmo, valores, pasoActual, velocidad } o null si no sirven.
 * El paso se acota al historial real al aplicarlo, aquí solo se exige un entero ≥ 0.
 */
function depurarEstadoOrdenamiento(datos) {
  if (!datos || typeof datos !== 'object') return null;
  if (datos.version != null && datos.version !== 1) return null;
  if (!Object.prototype.hasOwnProperty.call(ALGORITMOS_ORDENAMIENTO, datos.algoritmo)) return null;
  if (!Array.isArray(datos.valores)) return null;
  if (!datos.valores.every(Number.isInteger)) return null;
  const valores = analizarValoresOrdenamiento(datos.valores.join(', '), LIMITES_ORDENAMIENTO);
  if (!valores.ok) return null;
  return {
    algoritmo: datos.algoritmo,
    valores: valores.valores,
    pasoActual: Number.isInteger(datos.pasoActual) && datos.pasoActual >= 0 ? datos.pasoActual : 0,
    velocidad: VELOCIDADES_ORDENAMIENTO.includes(String(datos.velocidad)) ? String(datos.velocidad) : VELOCIDADES_ORDENAMIENTO[1]
  };
}

function guardarEstadoOrdenamiento(velocidad) {
  if (typeof localStorage === 'undefined') return;
  if (typeof permiteEscrituraGuardado === 'function' && !permiteEscrituraGuardado(ORDENAMIENTO_STORAGE_KEY)) return;
  // Si falla, escribirAlmacenamientoLocal avisa una sola vez y la sesión continúa.
  escribirAlmacenamientoLocal(ORDENAMIENTO_STORAGE_KEY, JSON.stringify(instantaneaOrdenamiento(estadoOrdenamiento, velocidad)), { respaldo: 'guarda el trabajo con «Guardar» y expórtalo desde «Mis trabajos»' });
}

function restaurarEstadoOrdenamiento() {
  if (typeof localStorage === 'undefined') return null;
  let texto = null;
  try {
    texto = localStorage.getItem(ORDENAMIENTO_STORAGE_KEY);
    if (!texto) return null;
    const limpio = depurarEstadoOrdenamiento(JSON.parse(texto));
    if (!limpio) throw new Error('El guardado de Ordenamiento tiene una versión, un método o unos valores incompatibles.');
    return limpio;
  } catch (error) {
    if (texto !== null && typeof protegerGuardadoIncompatible === 'function') protegerGuardadoIncompatible(ORDENAMIENTO_STORAGE_KEY, texto, error.message);
    console.warn('Se ignoró el estado guardado de Ordenamiento porque no es válido.', error);
    return null;
  }
}
