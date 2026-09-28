// Acciones sobre el grafo: crear, conectar, editar, eliminar y limpiar.

'use strict';

/**
 * Crea un nuevo nodo en las coordenadas especificadas.
 * @param {number} x - Coordenada X para el nuevo nodo
 * @param {number} y - Coordenada Y para el nuevo nodo
 */
function crearNodo(x, y) {
  guardarEstadoParaDeshacer();
  
  const a = area();
  const maxX = Math.max(RADIO_NODO, a.ancho - RADIO_NODO);
  const maxY = Math.max(RADIO_NODO, a.alto - RADIO_NODO);
  const minX = RADIO_NODO;
  const minY = RADIO_NODO;
  
  const nodo = {
    id: nuevoId('n'),
    nombre: nombreAutomatico(),
    x: limitar(x, minX, maxX),
    y: limitar(y, minY, maxY)
  };
  estado.nodos.push(nodo);
  estado.seleccion = null;
  guardar();
  dibujar();
}

/**
 * Maneja la lógica de la herramienta Conectar.
 * Permite seleccionar origen y destino para crear o actualizar conexiones.
 * @param {Object} nodo - El nodo seleccionado
 */
function manejarConectar(nodo) {
  if (!estado.origenConexion) {
    estado.origenConexion = nodo.id;
    ayudar('Origen: <strong>' + escaparHtml(nodo.nombre) + '</strong>. Ahora selecciona el nodo de destino.');
    avisar('Ahora selecciona el nodo de destino.');
    dibujar();
    return;
  }

  const origen = buscarNodo(estado.origenConexion);
  const destino = nodo;
  estado.origenConexion = null;

  // Si el origen ya no existe, se vuelve a empezar en lugar de fallar.
  if (!origen) {
    estado.origenConexion = destino.id;
    ayudar('Origen: <strong>' + escaparHtml(destino.nombre) + '</strong>. Ahora selecciona el nodo de destino.');
    dibujar();
    return;
  }

  dibujar();

  const existente = buscarConexionEntre(origen.id, destino.id);

  pedirTexto({
    titulo: existente ? 'Actualizar valor de la conexión' : 'Valor de la conexión',
    mensaje: 'Conexión ' + origen.nombre + ' → ' + destino.nombre +
             '. Introduce el peso: un número entero, que puede ser negativo o cero.',
    valor: existente ? String(existente.valor) : '1',
    validar: validarValor
  }).then(resultado => {
    ayudar('<strong>Selecciona el nodo de origen</strong>.');
    if (resultado === null) { dibujar(); return; }

    guardarEstadoParaDeshacer();

    if (existente) {
      existente.valor = resultado;
      avisar('La conexión ya existía: se actualizó su valor a ' + resultado + '.', 'ok');
    } else {
      estado.conexiones.push({ id: nuevoId('c'), desde: origen.id, hacia: destino.id, valor: resultado });
    }
    guardar();
    dibujar();
  });
}

/**
 * Edita el elemento seleccionado (nodo o conexión).
 * Abre un modal para editar el nombre del nodo o el valor de la conexión.
 */
function editarSeleccion() {
  if (!estado.seleccion) return;

  if (estado.seleccion.tipo === 'nodo') {
    const nodo = buscarNodo(estado.seleccion.id);
    if (!nodo) return;
    pedirTexto({
      titulo: 'Editar nombre del nodo',
      mensaje: 'Escribe el nuevo nombre para el nodo "' + nodo.nombre + '".',
      valor: nodo.nombre,
      validar: texto => validarNombre(texto, nodo.id)
    }).then(nuevo => {
      if (nuevo === null) return;
      guardarEstadoParaDeshacer();
      nodo.nombre = nuevo;      // las conexiones usan el id
      guardar();
      dibujar();
      avisar('Nombre actualizado correctamente.', 'ok');
    });
    return;
  }

  const conexion = buscarConexion(estado.seleccion.id);
  if (!conexion) return;
  const a = buscarNodo(conexion.desde), b = buscarNodo(conexion.hacia);
  // Sin sus dos nodos la conexión no se puede describir: se descarta.
  if (!a || !b) { estado.seleccion = null; dibujar(); return; }
  pedirTexto({
    titulo: 'Cambiar valor de la conexión',
    mensaje: 'Conexión ' + a.nombre + ' → ' + b.nombre + '. Introduce el peso: un número entero, que puede ser negativo o cero.',
    valor: String(conexion.valor),
    validar: validarValor
  }).then(nuevo => {
    if (nuevo === null) return;
    guardarEstadoParaDeshacer();
    conexion.valor = nuevo;
    guardar();
    dibujar();
    avisar('Valor actualizado correctamente.', 'ok');
  });
}

/**
 * Elimina el elemento seleccionado (nodo o conexión).
 * Para nodos, también elimina todas sus conexiones asociadas.
 * Requiere confirmación del usuario.
 */
function eliminarSeleccion() {
  if (!estado.seleccion) return;

  if (estado.seleccion.tipo === 'nodo') {
    const nodo = buscarNodo(estado.seleccion.id);
    if (!nodo) return;
    confirmar({
      titulo: 'Eliminar nodo',
      mensaje: '¿Seguro que deseas eliminar el nodo ' + nodo.nombre + ' y todas sus conexiones?'
    }).then(aceptado => {
      if (!aceptado) { avisar('No se eliminó nada.'); return; }
      guardarEstadoParaDeshacer();
      estado.conexiones = estado.conexiones.filter(c => c.desde !== nodo.id && c.hacia !== nodo.id);
      estado.nodos = estado.nodos.filter(n => n.id !== nodo.id);
      estado.seleccion = null;
      guardar();
      dibujar();
      avisar('Nodo eliminado correctamente.', 'ok');
    });
    return;
  }

  const conexion = buscarConexion(estado.seleccion.id);
  if (!conexion) return;
  const a = buscarNodo(conexion.desde), b = buscarNodo(conexion.hacia);
  if (!a || !b) { estado.seleccion = null; dibujar(); return; }
  confirmar({
    titulo: 'Eliminar conexión',
    mensaje: '¿Seguro que deseas eliminar la conexión de ' + a.nombre + ' hacia ' + b.nombre + '?'
  }).then(aceptado => {
    if (!aceptado) { avisar('No se eliminó nada.'); return; }
    guardarEstadoParaDeshacer();
    // Solo se borra esta dirección; la conexión contraria se conserva.
    estado.conexiones = estado.conexiones.filter(c => c.id !== conexion.id);
    estado.seleccion = null;
    guardar();
    dibujar();
    avisar('Conexión eliminada correctamente.', 'ok');
  });
}

const TEXTO_AYUDA =
  '¿QUÉ ES ESTA APLICACIÓN?\n' +
  'Un editor visual de grafos dirigidos y ponderados. Un grafo está formado por nodos (los círculos) y por conexiones entre ellos (las flechas). Cada conexión lleva un valor o peso, que puede representar una distancia, un costo, un tiempo, etc.\n' +
  '· El botón «Video» de la cabecera abre la presentación con el video explicativo del algoritmo. El menú ☰ (o la barra lateral) cambia de algoritmo.\n\n' +

  '1) HERRAMIENTAS DE LA BARRA SUPERIOR\n' +
  '· Seleccionar: es el modo normal de trabajo.\n' +
  '   – Toca un nodo o una conexión para seleccionarlo; abajo aparece el panel de acciones.\n' +
  '   – Arrastra un nodo para moverlo; sus conexiones y sus valores lo siguen.\n' +
  '   – En computadora, doble clic sobre un nodo abre directamente el cambio de nombre.\n' +
  '· Nodo: cada toque sobre el área de trabajo crea un nodo nuevo en ese punto.\n' +
  '   El nombre se asigna automáticamente en orden: a, b, c… z, aa, ab…\n' +
  '   Se reutiliza el primer nombre libre, así que al borrar “b” el siguiente nodo será “b”.\n' +
  '· Conectar: se trabaja en dos pasos.\n' +
  '   1. Toca el nodo de ORIGEN: queda marcado en verde.\n' +
  '   2. Toca el nodo de DESTINO y escribe el valor de la conexión.\n' +
  '   Para cancelar a medio camino, toca una zona vacía o cambia de herramienta.\n' +
  '· Calcular Johnson: distancia mínima entre todos los pares de nodos. Necesita al menos dos nodos.\n' +
  '· Matriz: muestra la matriz de adyacencia del grafo con todos sus valores y sus sumas.\n' +
  '· Acciones: despliega el resto de opciones.\n' +
  '   – Guardar grafo: lo guarda con un nombre en este navegador.\n' +
  '   – Biblioteca: lista de grafos guardados, para cargarlos o eliminarlos.\n' +
  '   – Dijkstra: con un nodo seleccionado, calcula desde él las rutas mínimas hacia el resto y dibuja el árbol de caminos mínimos. No admite pesos negativos.\n' +
  '   – Exportar JSON / Exportar imagen / Importar JSON: para llevarte el grafo o recuperarlo.\n' +
  '   – Limpiar: borra el grafo completo. Siempre pide confirmación antes.\n\n' +

  '1.b) MOVERSE POR EL LIENZO\n' +
  '· Rueda del ratón: acercar y alejar sobre el puntero.\n' +
  '· Dos dedos: pellizcar para acercar y arrastrar para desplazar la vista.\n' +
  '· Botón central del ratón, o arrastrar una zona vacía con la herramienta Seleccionar: desplaza la vista.\n' +
  '· Los botones −, % y + de la esquina superior derecha hacen lo mismo; el del centro vuelve al 100 %.\n\n' +

  '2) EDITAR Y ELIMINAR\n' +
  '· Selecciona el elemento y usa el panel que aparece en la parte inferior.\n' +
  '· En un nodo, el botón cambia su nombre; en una conexión, cambia su valor.\n' +
  '· Al eliminar un nodo se eliminan también todas las conexiones que entran o salen de él.\n' +
  '· Al eliminar una conexión solo desaparece ese sentido: la contraria se conserva.\n' +
  '· El botón ✕ del panel cierra el panel sin modificar nada.\n\n' +

  '3) REGLAS DE LOS DATOS\n' +
  '· El peso de una conexión es un número ENTERO: admite positivos, negativos y cero, hasta 999999 en valor absoluto. No se aceptan decimales ni texto.\n' +
  '· Un peso de 0 es una conexión real que no cuesta nada recorrer; no es lo mismo que no tener conexión.\n' +
  '· El grafo es DIRIGIDO: a → b y b → a son dos conexiones distintas y cada una puede tener su propio valor. Cuando existen las dos, se dibujan curvadas para que ninguna tape a la otra.\n' +
  '· Si vuelves a conectar dos nodos en el mismo sentido, no se duplica la conexión: se actualiza el valor de la que ya existía.\n' +
  '· Un nodo puede conectarse consigo mismo (bucle); se dibuja como un lazo.\n' +
  '· Los nombres de los nodos no se repiten y admiten hasta ' + MAX_LARGO_NOMBRE + ' caracteres.\n\n' +

  '4) LA MATRIZ DE ADYACENCIA\n' +
  '· Es una tabla de N×N, donde N es la cantidad de nodos.\n' +
  '· La FILA indica el nodo de origen y la COLUMNA el nodo de destino.\n' +
  '· La celda contiene el peso de la conexión origen → destino, o una raya (—) si esa conexión no existe.\n' +
  '· Al ser un grafo dirigido, la matriz normalmente NO es simétrica.\n' +
  '· La diagonal (a-a, b-b…) solo tiene valor cuando el nodo tiene un bucle.\n' +
  '· “Σ fila” suma los valores que salen de un nodo y “Σ col.” los que entran en él; junto a cada suma se indica también cuántos de esos valores son distintos de cero (un peso de 0 cuenta como conexión, pero no como “valor ≠ 0”).\n' +
  '· La última celda es la suma de todos los valores del grafo, con su propia cantidad de valores ≠ 0.\n' +
  '· Si el grafo cambia mientras la matriz está abierta, la tabla se actualiza sola.\n\n' +

  '5) GUARDADO\n' +
  '· El grafo en pantalla se guarda solo y se recupera al volver a entrar, sin hacer nada.\n' +
  '· Además, con el botón Guardar puedes conservar varios grafos con nombre y alternar entre ellos.\n' +
  '· Si al guardar repites un nombre, se te ofrece reemplazar ese grafo: así se actualiza uno ya guardado.\n' +
  '· Cargar un grafo guardado reemplaza el que esté en pantalla, por eso se pide confirmación.\n' +
  '· Limpiar solo borra el grafo en pantalla; los grafos guardados no se tocan.\n' +
  '· Todo el guardado es local: no se envía nada a internet y no se comparte entre dispositivos.\n' +
  '· Si cambias el tamaño de la ventana o giras el teléfono, los nodos se reacomodan para no quedar fuera del área visible.\n\n' +

  '6) EL ALGORITMO DE JOHNSON\n' +
  '· Calcula la distancia mínima entre TODOS los pares de nodos, admitiendo pesos negativos.\n' +
  '· La fila es el nodo de origen y la columna el de destino; la diagonal siempre vale 0.\n' +
  '· El símbolo ∞ indica que no existe ningún camino en ese sentido.\n' +
  '· Si el grafo tiene un ciclo cuyos pesos suman un valor negativo, no hay distancias mínimas: recorrerlo una y otra vez baja el costo sin límite. En ese caso se avisa y se indica el ciclo.\n' +
  '· El cálculo no modifica el grafo: trabaja sobre una copia.\n\n' +

  '7) TECLADO\n' +
  '· Enter: confirma el dato escrito en una ventana.\n' +
  '· Escape: cierra la ventana o el panel abierto sin guardar cambios.\n' +
  '· 1 / 2 / 3: cambia a Seleccionar, Nodo o Conectar.\n' +
  '· Flechas: recorre los nodos; Enter los renombra y Suprimir los elimina.\n' +
  '· Ctrl+Z deshace y Ctrl+Y (o Ctrl+Shift+Z) rehace.\n' +
  '· Ctrl+S guarda el grafo, Ctrl+B abre la biblioteca, Ctrl+M la matriz y Ctrl+J el cálculo de Johnson.\n' +
  '· Ctrl+N crea un nodo en el centro. Ctrl y + / − / 0 controlan el zoom.';

function mostrarAyuda() {
  abrirModal({
    titulo: 'Cómo usar Grafo',
    mensaje: TEXTO_AYUDA,
    pedirTexto: false,
    soloAceptar: true,
    ancho: true,
    textoAceptar: 'Entendido'
  });
}

function limpiarTodo() {
  if (estado.nodos.length === 0 && estado.conexiones.length === 0) {
    avisar('El grafo ya está vacío.');
    return;
  }
  confirmar({
    titulo: 'Limpiar el grafo',
    mensaje: '¿Seguro que deseas eliminar todos los nodos y conexiones?'
  }).then(aceptado => {
    if (!aceptado) { avisar('No se eliminó nada.'); return; }
    guardarEstadoParaDeshacer();
    estado.nodos = [];
    estado.conexiones = [];
    estado.seleccion = null;
    estado.origenConexion = null;
    estado.siguienteId = 1;
    borrarGuardado();
    dibujar();
    avisar('Se eliminaron todos los nodos y conexiones.', 'ok');
  });
}

/* ---------------- Exportar/Importar ---------------- */

/**
 * Exporta el grafo actual a un archivo JSON.
 */
function exportarGrafoJSON() {
  if (estado.nodos.length === 0) {
    avisar('El grafo está vacío: no hay nada que exportar.', 'error');
    return;
  }

  const datos = {
    version: '1.0',
    fecha: new Date().toISOString(),
    grafo: instantaneaGrafo()
  };

  const json = JSON.stringify(datos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grafo_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  avisar('Grafo exportado a JSON correctamente.', 'ok');
}

/*
 * Estilos que se incrustan en el SVG exportado.
 * Son necesarios: el SVG del documento se pinta con styles.css, pero el archivo
 * que se convierte a PNG viaja solo y sin ellos saldría en negro sobre negro.
 */
const ESTILOS_EXPORTACION = `
  .nodo circle { fill: #24305c; stroke: #5b8cff; stroke-width: 3; }
  .nodo text { fill: #eef1fb; font-size: 16px; font-weight: 700; text-anchor: middle;
               dominant-baseline: central; font-family: system-ui, "Segoe UI", Roboto, Arial, sans-serif; }
  .nodo.seleccionado circle { stroke: #ffcf5c; stroke-width: 4.5; fill: #3d3721; }
  .nodo.origen circle { stroke: #00d3a7; stroke-width: 4.5; fill: #123c36; }
  .nodo-johnson circle { stroke: #22d3ee; stroke-width: 4; fill: #123a44; }
  .nodo-johnson-origen circle { stroke: #00d3a7; fill: #0d3b33; }
  .nodo-johnson-destino circle { stroke: #ff9f43; fill: #45301a; }
  .nodo-johnson.ciclo-negativo-johnson circle { stroke: #ff5f6d; fill: #451c22; }
  .conexion-linea { fill: none; stroke: #9cb0d4; stroke-width: 2.5; marker-end: url(#flecha); }
  .conexion.seleccionada .conexion-linea { stroke: #ffcf5c; stroke-width: 4; marker-end: url(#flechaSel); }
  .conexion-johnson .conexion-linea { stroke: #22d3ee; stroke-width: 4.5; marker-end: url(#flechaRuta); }
  .conexion-johnson.ciclo-negativo-johnson .conexion-linea { stroke: #ff5f6d; marker-end: url(#flechaCiclo); }
  .conexion-johnson-inactiva .conexion-linea { opacity: .28; }
  .conexion-johnson-inactiva .conexion-valor { opacity: .4; }
  .conexion-zona { display: none; }
  .conexion-valor { fill: #eef1fb; font-size: 14px; font-weight: 700; text-anchor: middle;
                    dominant-baseline: central; paint-order: stroke; stroke: #0f1220;
                    stroke-width: 6px; stroke-linejoin: round;
                    font-family: system-ui, "Segoe UI", Roboto, Arial, sans-serif; }
  .conexion-johnson .conexion-valor { fill: #a5f3fc; }
  .conexion-johnson.ciclo-negativo-johnson .conexion-valor { fill: #ffc4c8; }
`;

/**
 * Exporta el grafo actual como imagen PNG.
 * Se exporta una copia del SVG con los estilos incrustados y a doble resolución,
 * para que el archivo se vea igual que en pantalla y no salga borroso.
 */
function exportarGrafoImagen() {
  if (estado.nodos.length === 0) {
    avisar('El grafo está vacío: no hay nada que exportar.', 'error');
    return;
  }

  const caja = el.svg.getBoundingClientRect();
  const ancho = Math.max(1, Math.round(caja.width));
  const alto = Math.max(1, Math.round(caja.height));

  const copia = el.svg.cloneNode(true);
  copia.setAttribute('xmlns', SVG_NS);
  copia.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  copia.setAttribute('width', ancho);
  copia.setAttribute('height', alto);
  copia.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);

  const estilos = document.createElementNS(SVG_NS, 'style');
  estilos.textContent = ESTILOS_EXPORTACION;
  copia.insertBefore(estilos, copia.firstChild);

  const svgData = new XMLSerializer().serializeToString(copia);
  const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));

  const escala = 2;   // el PNG se ve nítido también en pantallas de alta densidad
  const canvas = document.createElement('canvas');
  canvas.width = ancho * escala;
  canvas.height = alto * escala;
  const ctx = canvas.getContext('2d');

  const img = new Image();

  img.onload = function () {
    ctx.fillStyle = '#0f1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob(blob => {
      if (!blob) { avisar('Error al exportar la imagen.', 'error'); return; }
      const enlace = document.createElement('a');
      const destino = URL.createObjectURL(blob);
      enlace.href = destino;
      enlace.download = 'grafo_' + new Date().toISOString().slice(0, 10) + '.png';
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(destino);
      avisar('Grafo exportado como imagen correctamente.', 'ok');
    }, 'image/png');
  };

  img.onerror = function () {
    URL.revokeObjectURL(url);
    avisar('Error al exportar la imagen.', 'error');
  };

  img.src = url;
}

/**
 * Importa un grafo desde un archivo JSON.
 */
function importarGrafoJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    
    const lector = new FileReader();
    lector.onload = function(e) {
      try {
        const datos = JSON.parse(e.target.result);
        
        if (!datos.grafo || !datos.grafo.nodos || !datos.grafo.conexiones) {
          throw new Error('Formato de archivo inválido');
        }
        
        const limpio = depurarGrafo(datos.grafo);
        if (!limpio) {
          throw new Error('El archivo contiene datos inválidos');
        }
        
        // Confirmar si hay datos existentes
        if (estado.nodos.length > 0 || estado.conexiones.length > 0) {
          confirmar({
            titulo: 'Importar grafo',
            mensaje: 'Se reemplazará el grafo actual. ¿Deseas continuar?'
          }).then(aceptado => {
            if (aceptado) {
              aplicarGrafo(limpio);
              medirArea();
              ajustarNodosAlArea();
              guardar();
              dibujar();
              avisar('Grafo importado correctamente.', 'ok');
            }
          });
        } else {
          aplicarGrafo(limpio);
          medirArea();
          ajustarNodosAlArea();
          guardar();
          dibujar();
          avisar('Grafo importado correctamente.', 'ok');
        }
        
      } catch (error) {
        avisar('Error al importar: ' + error.message, 'error');
      }
    };
    
    lector.onerror = function() {
      avisar('Error al leer el archivo.', 'error');
    };
    
    lector.readAsText(archivo);
  };
  
  input.click();
}
