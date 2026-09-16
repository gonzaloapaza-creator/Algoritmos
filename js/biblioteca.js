/* Biblioteca de grafos: guardar el grafo actual con un nombre, cargarlo o eliminarlo. */

'use strict';

// Las constantes MAX_GRAFOS y MAX_LARGO_NOMBRE_GRAFO ahora vienen de config.js

function validarNombreGrafo(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: false, error: 'Escribe un nombre para el grafo.' };
  if (limpio.length > MAX_LARGO_NOMBRE_GRAFO) {
    return { ok: false, error: 'El nombre es demasiado largo (máximo ' + MAX_LARGO_NOMBRE_GRAFO + ' caracteres).' };
  }
  return { ok: true, valor: limpio };
}

/** Primer nombre del tipo "Grafo 3" que no esté ocupado. */
function nombreSugerido(lista) {
  const usados = new Set(lista.map(g => g.nombre.toLowerCase()));
  let i = 1;
  while (usados.has(('grafo ' + i))) i++;
  return 'Grafo ' + i;
}

function buscarPorNombre(lista, nombre) {
  const buscado = nombre.toLowerCase();
  return lista.find(g => g.nombre.toLowerCase() === buscado) || null;
}

/** Fecha corta y legible; si el dato no es válido no se muestra nada. */
function fechaLegible(texto) {
  const fecha = new Date(texto);
  if (isNaN(fecha.getTime())) return '';
  try {
    return fecha.toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return fecha.toLocaleString();
  }
}

function crearTexto(etiqueta, texto, clases) {
  const nodo = document.createElement(etiqueta);
  nodo.textContent = texto;
  if (clases) nodo.className = clases;
  return nodo;
}

function crearBoton(texto, clases, alPulsar) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn ' + clases;
  boton.textContent = texto;
  boton.addEventListener('click', alPulsar);
  return boton;
}

function crearItemGrafo(grafo) {
  const item = document.createElement('li');
  item.className = 'biblio-item';

  const datos = document.createElement('div');
  datos.className = 'biblio-datos';
  datos.appendChild(crearTexto('span', grafo.nombre, 'biblio-nombre'));

  const partes = [
    grafo.nodos.length + (grafo.nodos.length === 1 ? ' nodo' : ' nodos'),
    grafo.conexiones.length + (grafo.conexiones.length === 1 ? ' conexión' : ' conexiones')
  ];
  const fecha = fechaLegible(grafo.fecha);
  if (fecha) partes.push(fecha);
  datos.appendChild(crearTexto('span', partes.join(' · '), 'biblio-meta'));
  item.appendChild(datos);

  const botones = document.createElement('div');
  botones.className = 'biblio-botones';
  botones.appendChild(crearBoton('Cargar', 'btn-claro', () => cargarGrafoGuardado(grafo.id)));
  botones.appendChild(crearBoton('Eliminar', 'btn-peligro', () => eliminarGrafoGuardado(grafo.id)));
  item.appendChild(botones);

  return item;
}

/** Vuelve a generar la lista. Solo trabaja si el panel está a la vista. */
function actualizarBiblioteca() {
  if (el.bibliotecaFondo.hidden) return;

  const lista = leerBiblioteca();
  el.bibliotecaLista.textContent = '';

  if (lista.length === 0) {
    el.bibliotecaLista.appendChild(
      crearTexto('li', 'Todavía no has guardado ningún grafo.', 'biblio-vacia')
    );
    return;
  }

  // El último guardado aparece primero: es el que se suele buscar.
  lista.slice().reverse().forEach(grafo => el.bibliotecaLista.appendChild(crearItemGrafo(grafo)));
}

/* ---------------- Acciones ---------------- */

function anotarGrafo(lista, nombre, idExistente) {
  const copia = instantaneaGrafo();
  const registro = {
    id: idExistente || 'g_' + Date.now(),
    nombre: nombre,
    fecha: new Date().toISOString(),
    nodos: copia.nodos,
    conexiones: copia.conexiones,
    siguienteId: copia.siguienteId
  };

  const nueva = idExistente
    ? lista.map(g => (g.id === idExistente ? registro : g))
    : lista.concat([registro]);

  if (!escribirBiblioteca(nueva)) {
    avisar('No se pudo guardar: el navegador no tiene espacio disponible.', 'error');
    return;
  }
  actualizarBiblioteca();
  avisar('Grafo «' + nombre + '» guardado.', 'ok');
}

function guardarGrafoActual() {
  if (estado.nodos.length === 0) {
    avisar('El grafo está vacío: crea algún nodo antes de guardarlo.');
    return;
  }

  const lista = leerBiblioteca();

  pedirTexto({
    titulo: 'Guardar grafo',
    mensaje: 'Escribe un nombre para reconocerlo después.',
    valor: nombreSugerido(lista),
    validar: validarNombreGrafo
  }).then(nombre => {
    if (nombre === null) return;

    const existente = buscarPorNombre(lista, nombre);
    if (existente) {
      // Reutilizar el nombre es la forma natural de actualizar un grafo, pero se confirma.
      confirmar({
        titulo: 'Reemplazar grafo',
        mensaje: 'Ya existe un grafo llamado «' + existente.nombre + '». ¿Deseas reemplazarlo por el grafo actual?'
      }).then(aceptado => {
        if (!aceptado) { avisar('No se guardó nada.'); return; }
        anotarGrafo(lista, existente.nombre, existente.id);
      });
      return;
    }

    if (lista.length >= MAX_GRAFOS) {
      avisar('Ya hay ' + MAX_GRAFOS + ' grafos guardados. Elimina alguno primero.', 'error');
      return;
    }
    anotarGrafo(lista, nombre, null);
  });
}

function aplicarGuardado(grafo) {
  aplicarGrafo({ nodos: grafo.nodos, conexiones: grafo.conexiones, siguienteId: grafo.siguienteId });
  medirArea();
  ajustarNodosAlArea();   // el grafo pudo guardarse en una pantalla más grande
  guardar();
  cerrarBiblioteca();
  elegirHerramienta('seleccionar');
  avisar('Grafo «' + grafo.nombre + '» cargado.', 'ok');
}

function cargarGrafoGuardado(id) {
  const grafo = leerBiblioteca().find(g => g.id === id);
  if (!grafo) { avisar('Ese grafo ya no está disponible.', 'error'); actualizarBiblioteca(); return; }

  // Solo se pregunta si hay algo que perder.
  if (estado.nodos.length === 0) { aplicarGuardado(grafo); return; }

  confirmar({
    titulo: 'Cargar grafo',
    mensaje: 'Se reemplazará el grafo que tienes en pantalla por «' + grafo.nombre + '». ' +
             'Si no lo has guardado, se perderá.'
  }).then(aceptado => {
    if (!aceptado) { avisar('No se cargó nada.'); return; }
    aplicarGuardado(grafo);
  });
}

function eliminarGrafoGuardado(id) {
  const lista = leerBiblioteca();
  const grafo = lista.find(g => g.id === id);
  if (!grafo) { actualizarBiblioteca(); return; }

  confirmar({
    titulo: 'Eliminar grafo guardado',
    mensaje: '¿Seguro que deseas eliminar «' + grafo.nombre + '»? Esta acción no se puede deshacer.'
  }).then(aceptado => {
    if (!aceptado) { avisar('No se eliminó nada.'); return; }
    if (!escribirBiblioteca(lista.filter(g => g.id !== id))) {
      avisar('No se pudo eliminar: el navegador bloqueó el almacenamiento.', 'error');
      return;
    }
    actualizarBiblioteca();
    avisar('Grafo eliminado.', 'ok');
  });
}

/* ---------------- Mostrar y ocultar ---------------- */

function bibliotecaVisible() {
  return !el.bibliotecaFondo.hidden;
}

function mostrarBiblioteca() {
  cerrarMatriz();   // dos paneles a la vez se taparían
  el.bibliotecaFondo.hidden = false;
  actualizarBiblioteca();
  el.btnGuardarActual.focus();
}

function cerrarBiblioteca() {
  el.bibliotecaFondo.hidden = true;
}

function alternarBiblioteca() {
  if (bibliotecaVisible()) cerrarBiblioteca();
  else mostrarBiblioteca();
}
