/* Herramientas y eventos del puntero: clic, toque y arrastre. */

'use strict';

let arrastre = null;   // { id, dx, dy, movido }

function elegirHerramienta(nombre) {
  estado.herramienta = nombre;
  estado.origenConexion = null;
  estado.seleccion = null;   // el panel de acciones no debe quedar abierto de la herramienta anterior

  el.botonesHerramienta.forEach(boton => {
    const activo = boton.dataset.herramienta === nombre;
    boton.classList.toggle('activo', activo);
    boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
  });

  el.lienzo.classList.remove('modo-nodo', 'modo-conectar');
  if (nombre === 'nodo') el.lienzo.classList.add('modo-nodo');
  if (nombre === 'conectar') el.lienzo.classList.add('modo-conectar');

  if (nombre === 'seleccionar') {
    ayudar('Toca un <strong>nodo</strong> o una <strong>conexión</strong> para editarlos. Arrastra los nodos para moverlos.');
  } else if (nombre === 'nodo') {
    ayudar('Toca el área de trabajo para crear un nodo. Su nombre se asigna solo: <strong>a, b, c…</strong>');
  } else {
    ayudar('<strong>Selecciona el nodo de origen</strong>.');
  }

  dibujar();
}

/** Coordenadas del puntero en píxeles, relativas al borde del lienzo. */
function pantallaEnSVG(evento) {
  const a = area();
  return { x: evento.clientX - a.izquierda, y: evento.clientY - a.arriba };
}

/**
 * Coordenadas del puntero en el sistema del grafo: deshace el zoom y el
 * desplazamiento, de modo que tocar un nodo funciona a cualquier escala.
 */
function posicionEnSVG(evento) {
  const p = pantallaEnSVG(evento);
  return {
    x: (p.x - estado.zoom.offsetX) / estado.zoom.escala,
    y: (p.y - estado.zoom.offsetY) / estado.zoom.escala
  };
}

/** Margen extra para acertar con el dedo, que es menos preciso que el mouse.
 *  Se divide por la escala porque se compara en coordenadas del grafo. */
function tolerancia(evento) {
  const margen = evento.pointerType === 'mouse' ? 0 : 14;
  return margen / estado.zoom.escala;
}

/**
 * Nodo que hay bajo un punto, buscando por distancia al centro.
 * Se usa cuando el elemento tocado ya no sirve, por ejemplo en el doble clic:
 * el primer clic redibuja el grafo y sustituye el elemento original.
 */
function nodoEnPunto(punto, margen) {
  const alcance = RADIO_NODO + (margen || 0);
  let elegido = null;
  let menor = Infinity;

  // Se queda con el nodo más cercano, por si dos quedan dentro del margen del dedo.
  estado.nodos.forEach(nodo => {
    const distancia = Math.hypot(punto.x - nodo.x, punto.y - nodo.y);
    if (distancia <= alcance && distancia < menor) { menor = distancia; elegido = nodo; }
  });

  return elegido;
}

function terminarArrastre() {
  if (!arrastre) return;
  if (arrastre.movido) {
    const nodo = buscarNodo(arrastre.id);
    if (nodo) {
      // La instantánea debe ser la de ANTES de mover: se restauran un instante
      // las coordenadas de origen, se guarda y se vuelve a dejar el nodo donde está.
      const x = nodo.x, y = nodo.y;
      nodo.x = arrastre.origenX;
      nodo.y = arrastre.origenY;
      guardarEstadoParaDeshacer();
      nodo.x = x;
      nodo.y = y;
    }
    guardar();
  }
  arrastre = null;
  dibujar();
}

/* Gestos del lienzo:
   - un dedo / botón izquierdo: seleccionar, crear, conectar o arrastrar un nodo;
     sobre zona vacía y en modo Seleccionar, desplaza la vista.
   - botón central del ratón: desplazar la vista.
   - dos dedos: pellizcar para acercar y arrastrar para desplazar. */
const punteros = new Map();   // pointerId -> posición en píxeles del lienzo
let pan = null;               // última posición del gesto de desplazamiento
let pinza = null;             // referencia del gesto de dos dedos

function medidaPinza() {
  const puntos = Array.from(punteros.values());
  const a = puntos[0], b = puntos[1];
  return {
    distancia: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    centroX: (a.x + b.x) / 2,
    centroY: (a.y + b.y) / 2
  };
}

// Los eventos de puntero unifican mouse, dedo y lápiz en un solo código.
el.svg.addEventListener('pointerdown', evento => {
  // Botón principal o central del mouse, el dedo o el lápiz.
  if (evento.pointerType === 'mouse' && evento.button !== 0 && evento.button !== 1) return;

  medirArea();   // se mide una vez por gesto, no en cada movimiento
  punteros.set(evento.pointerId, pantallaEnSVG(evento));
  el.svg.setPointerCapture(evento.pointerId);

  // Segundo dedo: empieza el pellizco y se cancela lo que hubiera en curso.
  if (punteros.size === 2) {
    if (arrastre) { arrastre = null; dibujar(); }
    pan = null;
    pinza = medidaPinza();
    return;
  }
  if (punteros.size > 2) return;

  if (evento.pointerType === 'mouse' && evento.button === 1) {
    evento.preventDefault();
    pan = pantallaEnSVG(evento);
    el.svg.style.cursor = 'grabbing';
    return;
  }

  const punto = posicionEnSVG(evento);
  const grupoConexion = evento.target.closest('.conexion');
  const nodo = nodoEnPunto(punto, tolerancia(evento));

  if (nodo) {
    if (estado.herramienta === 'conectar') {
      manejarConectar(nodo);
      return;
    }

    estado.seleccion = { tipo: 'nodo', id: nodo.id };
    // Se guarda la diferencia con el centro para que el nodo no salte al arrastrar.
    arrastre = {
      id: nodo.id,
      dx: punto.x - nodo.x,
      dy: punto.y - nodo.y,
      origenX: nodo.x,
      origenY: nodo.y,
      movido: false
    };
    dibujar();
    return;
  }

  // Las conexiones solo se seleccionan con la herramienta Seleccionar.
  if (grupoConexion && estado.herramienta === 'seleccionar') {
    estado.seleccion = { tipo: 'conexion', id: grupoConexion.dataset.id };
    dibujar();
    return;
  }

  if (estado.herramienta === 'nodo') {
    crearNodo(punto.x, punto.y);
    return;
  }

  estado.seleccion = null;
  if (estado.herramienta === 'conectar' && estado.origenConexion) {
    estado.origenConexion = null;
    ayudar('<strong>Selecciona el nodo de origen</strong>.');
  }
  // Zona vacía en modo Seleccionar: el arrastre desplaza la vista.
  if (estado.herramienta === 'seleccionar') pan = pantallaEnSVG(evento);
  dibujar();
});

el.svg.addEventListener('pointermove', evento => {
  if (!punteros.has(evento.pointerId)) return;
  punteros.set(evento.pointerId, pantallaEnSVG(evento));

  if (pinza && punteros.size === 2) {
    const actual = medidaPinza();
    fijarEscala(estado.zoom.escala * (actual.distancia / pinza.distancia), actual.centroX, actual.centroY);
    desplazarVista(actual.centroX - pinza.centroX, actual.centroY - pinza.centroY);
    pinza = actual;
    return;
  }

  if (pan) {
    const p = pantallaEnSVG(evento);
    desplazarVista(p.x - pan.x, p.y - pan.y);
    pan = p;
    return;
  }

  if (!arrastre) return;
  const nodo = buscarNodo(arrastre.id);
  if (!nodo) return;

  const punto = posicionEnSVG(evento);
  const a = area();
  const maxX = Math.max(RADIO_NODO, a.ancho - RADIO_NODO);
  const maxY = Math.max(RADIO_NODO, a.alto - RADIO_NODO);

  nodo.x = limitar(punto.x - arrastre.dx, RADIO_NODO, maxX);
  nodo.y = limitar(punto.y - arrastre.dy, RADIO_NODO, maxY);
  arrastre.movido = true;

  // Al redibujar, las conexiones y sus valores siguen al nodo.
  dibujarPronto();
});

function soltarPuntero(evento) {
  punteros.delete(evento.pointerId);
  if (punteros.size < 2) pinza = null;
  if (punteros.size > 0) return;
  pan = null;
  el.svg.style.cursor = '';
  terminarArrastre();
}

el.svg.addEventListener('pointerup', soltarPuntero);
el.svg.addEventListener('pointercancel', soltarPuntero);

// El botón central abre el desplazamiento automático del navegador si no se frena aquí.
el.svg.addEventListener('mousedown', evento => {
  if (evento.button === 1) evento.preventDefault();
});

// Sobre el área de trabajo no debe aparecer el menú de copiar (pulsación larga o clic derecho)
// ni iniciarse una selección o un arrastre de texto: interfieren al mover los nodos.
['contextmenu', 'selectstart', 'dragstart'].forEach(tipo => {
  el.lienzo.addEventListener(tipo, evento => evento.preventDefault());
});

// Navegación por teclado en el área de trabajo
let nodoSeleccionadoPorTeclado = null;

document.addEventListener('keydown', evento => {
  // Solo en el área de trabajo y con herramienta seleccionar
  if (estado.herramienta !== 'seleccionar') return;
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
  if (modalAbierto()) return;

  // Navegación con flechas para mover entre nodos
  if (!evento.ctrlKey && !evento.metaKey && !evento.altKey) {
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft' || 
        evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      
      evento.preventDefault();
      
      if (estado.nodos.length === 0) return;
      
      // Si no hay nodo seleccionado, seleccionar el primero
      if (!nodoSeleccionadoPorTeclado) {
        nodoSeleccionadoPorTeclado = estado.nodos[0];
        estado.seleccion = { tipo: 'nodo', id: nodoSeleccionadoPorTeclado.id };
        dibujar();
        return;
      }
      
      // Encontrar nodo actual
      const indiceActual = estado.nodos.findIndex(n => n.id === nodoSeleccionadoPorTeclado.id);
      if (indiceActual === -1) {
        nodoSeleccionadoPorTeclado = estado.nodos[0];
        estado.seleccion = { tipo: 'nodo', id: nodoSeleccionadoPorTeclado.id };
        dibujar();
        return;
      }
      
      // Calcular índice del siguiente nodo según dirección
      let nuevoIndice = indiceActual;
      const total = estado.nodos.length;
      
      switch (evento.key) {
        case 'ArrowRight':
          nuevoIndice = (indiceActual + 1) % total;
          break;
        case 'ArrowLeft':
          nuevoIndice = (indiceActual - 1 + total) % total;
          break;
        case 'ArrowDown':
          nuevoIndice = Math.min(indiceActual + 1, total - 1);
          break;
        case 'ArrowUp':
          nuevoIndice = Math.max(indiceActual - 1, 0);
          break;
      }
      
      nodoSeleccionadoPorTeclado = estado.nodos[nuevoIndice];
      estado.seleccion = { tipo: 'nodo', id: nodoSeleccionadoPorTeclado.id };
      dibujar();
      
      // Anunciar cambio para screen readers
      ayudar('Nodo seleccionado: <strong>' + escaparHtml(nodoSeleccionadoPorTeclado.nombre) + '</strong>');
    }
    
    // Enter o Space en nodo seleccionado: editar
    if ((evento.key === 'Enter' || evento.key === ' ') && estado.seleccion && estado.seleccion.tipo === 'nodo') {
      evento.preventDefault();
      editarSeleccion();
    }
    
    // Delete en nodo seleccionado: eliminar
    if (evento.key === 'Delete' && estado.seleccion && estado.seleccion.tipo === 'nodo') {
      evento.preventDefault();
      eliminarSeleccion();
      nodoSeleccionadoPorTeclado = null;
    }
  }
});

// Atajo para renombrar en computadoras. Solo con la herramienta Seleccionar:
// al crear un bucle se toca el mismo nodo dos veces y eso también genera un doble clic.
el.svg.addEventListener('dblclick', evento => {
  if (estado.herramienta !== 'seleccionar') return;
  const nodo = nodoEnPunto(posicionEnSVG(evento), tolerancia(evento));
  if (!nodo) return;
  estado.seleccion = { tipo: 'nodo', id: nodo.id };
  dibujar();
  editarSeleccion();
});
