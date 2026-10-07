// js/ordenamiento/app.js
'use strict';

// ---- Variables Globales ----
let arregloOriginal = [];
let historial = [];
let pasoActual = 0;
let reproduciendo = false;
let intervalo = null;
let algoritmoActual = 'selection'; // 'selection' o 'insertion'

// ---- Referencias al DOM ----
const btnSelection = document.getElementById('btnSelection');
const btnInsertion = document.getElementById('btnInsertion');
const btnGenerar = document.getElementById('btnGenerar');
const selectorVelocidad = document.getElementById('selectorVelocidad');

const btnAnterior = document.getElementById('btnAnterior');
const btnAuto = document.getElementById('btnAuto');
const btnSiguiente = document.getElementById('btnSiguiente');

const badgePasos = document.getElementById('badgePasos');
const barraProgreso = document.getElementById('barraProgreso');
const textoEstado = document.getElementById('textoEstado');
const statComparaciones = document.getElementById('statComparaciones');
const statIntercambios = document.getElementById('statIntercambios');

const btnAyuda = document.getElementById('btnAyuda');
const modalAyuda = document.getElementById('modalAyuda');
const btnCerrarAyuda = document.getElementById('btnCerrarAyuda');

// ---- Inicialización ----
function inicializar() {
  generarArregloAleatorio();
  ejecutarAlgoritmo();
}

function generarArregloAleatorio(cantidad = 10) {
  arregloOriginal = [];
  for (let i = 0; i < cantidad; i++) {
    // Genera valores de altura aleatorios entre 10 y 99
    arregloOriginal.push(Math.floor(Math.random() * 90) + 10);
  }
}

function ejecutarAlgoritmo() {
  pausarReproduccion();
  
  // Dependiendo del botón activo, llamamos a la función matemática correspondiente
  // (Estas funciones deben estar en tu archivo algoritmos.js y devolver el historial)
  if (algoritmoActual === 'selection') {
    historial = ordenarSelectionSort([...arregloOriginal]);
  } else {
    historial = ordenarInsertionSort([...arregloOriginal]);
  }
  
  pasoActual = 0;
  actualizarInterfaz();
}

// ---- Actualización de la Interfaz ----
function actualizarInterfaz() {
  if (!historial || historial.length === 0) return;

  const estado = historial[pasoActual];
  const totalPasos = historial.length - 1;

  // 1. Dibujar los pinos (llama a la función en dibujo.js)
  dibujarPinos(estado.arreglo, estado.comparando, estado.moviendo, estado.ordenados);

  // 2. Actualizar las estadísticas numéricas
  statComparaciones.textContent = estado.comparaciones || 0;
  statIntercambios.textContent = estado.intercambios || 0;

  // 3. Actualizar el nuevo Panel de Progreso y Consola
  const porcentaje = totalPasos === 0 ? 0 : (pasoActual / totalPasos) * 100;
  badgePasos.textContent = `Paso ${pasoActual} de ${totalPasos}`;
  barraProgreso.style.width = `${porcentaje}%`;
  textoEstado.textContent = `> ${estado.mensaje}`;

  // 4. Habilitar/Deshabilitar botones según el paso
  btnAnterior.disabled = (pasoActual === 0);
  btnSiguiente.disabled = (pasoActual === totalPasos);
  
  if (pasoActual === totalPasos && reproduciendo) {
    pausarReproduccion();
  }
}

// ---- Controles de Reproducción ----
function pasoSiguiente() {
  if (pasoActual < historial.length - 1) {
    pasoActual++;
    actualizarInterfaz();
  }
}

function pasoAnterior() {
  if (pasoActual > 0) {
    pasoActual--;
    actualizarInterfaz();
  }
}

function alternarReproduccion() {
  if (reproduciendo) {
    pausarReproduccion();
  } else {
    // Si ya terminó y le da play, reiniciar desde cero
    if (pasoActual === historial.length - 1) {
      pasoActual = 0;
      actualizarInterfaz();
    }
    reproduciendo = true;
    btnAuto.textContent = 'Pausar';
    btnAuto.classList.replace('btn-neutral', 'btn-acento');
    
    const velocidad = parseInt(selectorVelocidad.value, 10);
    intervalo = setInterval(pasoSiguiente, velocidad);
  }
}

function pausarReproduccion() {
  reproduciendo = false;
  clearInterval(intervalo);
  btnAuto.textContent = 'Reproducir';
  btnAuto.classList.replace('btn-acento', 'btn-neutral');
}

// ---- Event Listeners (Eventos Clic) ----
btnSiguiente.addEventListener('click', () => {
  pausarReproduccion();
  pasoSiguiente();
});

btnAnterior.addEventListener('click', () => {
  pausarReproduccion();
  pasoAnterior();
});

btnAuto.addEventListener('click', alternarReproduccion);

btnGenerar.addEventListener('click', () => {
  generarArregloAleatorio();
  ejecutarAlgoritmo();
});

selectorVelocidad.addEventListener('change', () => {
  if (reproduciendo) {
    pausarReproduccion();
    alternarReproduccion();
  }
});

// Cambiar a Selection Sort
btnSelection.addEventListener('click', () => {
  if (algoritmoActual === 'selection') return;
  algoritmoActual = 'selection';
  btnSelection.classList.add('activo');
  btnSelection.setAttribute('aria-pressed', 'true');
  btnInsertion.classList.remove('activo');
  btnInsertion.setAttribute('aria-pressed', 'false');
  ejecutarAlgoritmo();
});

// Cambiar a Insertion Sort
btnInsertion.addEventListener('click', () => {
  if (algoritmoActual === 'insertion') return;
  algoritmoActual = 'insertion';
  btnInsertion.classList.add('activo');
  btnInsertion.setAttribute('aria-pressed', 'true');
  btnSelection.classList.remove('activo');
  btnSelection.setAttribute('aria-pressed', 'false');
  ejecutarAlgoritmo();
});

// ---- Atajos de Teclado ----
document.addEventListener('keydown', (evento) => {
  // Ignorar si el usuario está interactuando con algún input o el selector
  if (evento.target.tagName === 'SELECT' || evento.target.tagName === 'INPUT') return;
  // Ignorar si el modal de ayuda está abierto
  if (!modalAyuda.hidden) return;

  if (evento.key === 'ArrowRight') {
    evento.preventDefault();
    if (!btnSiguiente.disabled) {
      pausarReproduccion();
      pasoSiguiente();
    }
  } 
  else if (evento.key === 'ArrowLeft') {
    evento.preventDefault();
    if (!btnAnterior.disabled) {
      pausarReproduccion();
      pasoAnterior();
    }
  } 
  else if (evento.key === ' ') { // Barra espaciadora
    evento.preventDefault();
    alternarReproduccion();
  }
});

// ---- Ventana Modal de Ayuda ----
btnAyuda.addEventListener('click', () => {
  pausarReproduccion(); 
  modalAyuda.hidden = false;
});

btnCerrarAyuda.addEventListener('click', () => {
  modalAyuda.hidden = true;
});

// Arrancar al cargar la página
window.addEventListener('DOMContentLoaded', inicializar);