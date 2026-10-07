// js/ordenamiento/app.js
'use strict';

// Elementos del DOM
const btnGenerar = document.getElementById('btnGenerar');
const btnSelection = document.getElementById('btnSelection');
const btnInsertion = document.getElementById('btnInsertion');
const btnAnterior = document.getElementById('btnAnterior');
const btnSiguiente = document.getElementById('btnSiguiente');
const btnAuto = document.getElementById('btnAuto');
const textoEstado = document.getElementById('textoEstado');
const statComparaciones = document.getElementById('statComparaciones');
const statIntercambios = document.getElementById('statIntercambios');
const selectorVelocidad = document.getElementById('selectorVelocidad');

function inicializar() {
  estadoOrdenamiento.arregloActual = generarArregloAleatorio();
  estadoOrdenamiento.historialPasos = [];
  estadoOrdenamiento.pasoActual = 0;
  prepararAlgoritmo();
}

function prepararAlgoritmo() {
  detenerReproduccion();
  if (estadoOrdenamiento.algoritmo === 'selection') {
    estadoOrdenamiento.historialPasos = calcularSelectionSort(estadoOrdenamiento.arregloActual);
  } else {
    estadoOrdenamiento.historialPasos = calcularInsertionSort(estadoOrdenamiento.arregloActual);
  }
  estadoOrdenamiento.pasoActual = 0;
  mostrarPasoActual();
}

function mostrarPasoActual() {
  const paso = estadoOrdenamiento.historialPasos[estadoOrdenamiento.pasoActual];
  
  dibujarPinos(paso.arreglo, paso.comparando, paso.moviendo, paso.ordenados);
  textoEstado.textContent = `Paso ${estadoOrdenamiento.pasoActual + 1} de ${estadoOrdenamiento.historialPasos.length}: ${paso.mensaje}`;
  
  // Actualizar estadísticas si el paso las tiene
  if (paso.stats) {
    statComparaciones.textContent = paso.stats.comparaciones;
    statIntercambios.textContent = paso.stats.intercambios;
  }
  
  btnAnterior.disabled = estadoOrdenamiento.pasoActual === 0;
  btnSiguiente.disabled = estadoOrdenamiento.pasoActual === estadoOrdenamiento.historialPasos.length - 1;
}

// ---- Lógica de Reproducción Automática ----

function detenerReproduccion() {
  if (estadoOrdenamiento.intervaloAuto) {
    clearInterval(estadoOrdenamiento.intervaloAuto);
    estadoOrdenamiento.intervaloAuto = null;
  }
  btnAuto.textContent = "Reproducir";
  btnAuto.classList.remove('btn-primary');
  btnAuto.classList.add('btn-neutral');
}

function alternarReproduccion() {
  if (estadoOrdenamiento.intervaloAuto) {
    detenerReproduccion();
  } else {
    if (estadoOrdenamiento.pasoActual >= estadoOrdenamiento.historialPasos.length - 1) {
      estadoOrdenamiento.pasoActual = 0;
    }
    
    btnAuto.textContent = "Pausar";
    btnAuto.classList.remove('btn-neutral');
    btnAuto.classList.add('btn-primary');
    
    // Leer la velocidad del selector (ej. 100, 400, 800)
    const velocidad = parseInt(selectorVelocidad.value, 10);
    
    estadoOrdenamiento.intervaloAuto = setInterval(() => {
      if (estadoOrdenamiento.pasoActual < estadoOrdenamiento.historialPasos.length - 1) {
        estadoOrdenamiento.pasoActual++;
        mostrarPasoActual();
      } else {
        detenerReproduccion();
      }
    }, velocidad); 
  }
}

btnAuto.addEventListener('click', alternarReproduccion);

// Actualiza el temporizador inmediatamente si se cambia la velocidad mientras reproduce
selectorVelocidad.addEventListener('change', () => {
  if (estadoOrdenamiento.intervaloAuto) {
    detenerReproduccion();
    alternarReproduccion();
  }
});

// ---- Eventos de la Interfaz ----

btnGenerar.addEventListener('click', () => {
  detenerReproduccion();
  estadoOrdenamiento.arregloActual = generarArregloAleatorio();
  prepararAlgoritmo();
});

btnAnterior.addEventListener('click', () => {
  detenerReproduccion(); 
  if (estadoOrdenamiento.pasoActual > 0) {
    estadoOrdenamiento.pasoActual--;
    mostrarPasoActual();
  }
});

btnSiguiente.addEventListener('click', () => {
  detenerReproduccion(); 
  if (estadoOrdenamiento.pasoActual < estadoOrdenamiento.historialPasos.length - 1) {
    estadoOrdenamiento.pasoActual++;
    mostrarPasoActual();
  }
});

function cambiarAlgoritmo(algoritmo, botonActivo, botonInactivo) {
  botonActivo.classList.add('activo');
  botonActivo.setAttribute('aria-pressed', 'true');
  
  botonInactivo.classList.remove('activo');
  botonInactivo.setAttribute('aria-pressed', 'false');
  
  estadoOrdenamiento.algoritmo = algoritmo;
  prepararAlgoritmo();
}

btnSelection.addEventListener('click', () => cambiarAlgoritmo('selection', btnSelection, btnInsertion));
btnInsertion.addEventListener('click', () => cambiarAlgoritmo('insertion', btnInsertion, btnSelection));

// ---- Atajos de Teclado ----
document.addEventListener('keydown', (evento) => {
  // Ignorar si hay una ventana modal abierta o el usuario interactúa con el selector
  if (evento.target.tagName === 'SELECT' || evento.target.tagName === 'INPUT') return;

  if (evento.key === 'ArrowRight') {
    evento.preventDefault();
    if (!btnSiguiente.disabled) btnSiguiente.click();
  } 
  else if (evento.key === 'ArrowLeft') {
    evento.preventDefault();
    if (!btnAnterior.disabled) btnAnterior.click();
  } 
  else if (evento.key === ' ') { // Barra espaciadora
    evento.preventDefault();
    btnAuto.click();
  }
});
// ---- Ventana de Ayuda ----
const btnAyuda = document.getElementById('btnAyuda');
const modalAyuda = document.getElementById('modalAyuda');
const btnCerrarAyuda = document.getElementById('btnCerrarAyuda');

btnAyuda.addEventListener('click', () => {
  detenerReproduccion(); // Pausa la animación si estaba corriendo
  modalAyuda.hidden = false;
});

btnCerrarAyuda.addEventListener('click', () => {
  modalAyuda.hidden = true;
});

inicializar();