/*
 * Algoritmo de Johnson: distancias mínimas entre todos los pares de nodos
 * de un grafo dirigido y ponderado, admitiendo pesos negativos.
 *
 * Pasos: nodo auxiliar q conectado a todos con peso 0 → Bellman-Ford desde q
 * para obtener los potenciales h(v) y detectar ciclos negativos → reponderación
 * w'(u,v) = w(u,v) + h(u) - h(v), que deja todos los pesos en positivo o cero
 * → Dijkstra desde cada nodo → se recupera d(u,v) = d'(u,v) - h(u) + h(v).
 *
 * El cálculo trabaja siempre con copias: no toca estado.nodos ni estado.conexiones.
 */

'use strict';

// Las constantes SIN_CAMINO ahora vienen de config.js

/**
 * Copia el grafo a índices numéricos (0, 1, 2…), más cómodos para el cálculo.
 * Cada arista conserva el `id` de su conexión original: es lo que después permite
 * resaltar exactamente esa arista en el dibujo.
 * Las aristas se recorren en el orden de `estado.conexiones`, y los nodos en el de
 * `estado.nodos`: de ahí sale el desempate determinista entre rutas de igual costo.
 * @returns {{nombres:string[], ids:string[], aristas:Array<{id:string,desde:number,hacia:number,peso:number}>, cantidad:number}}
 */
function construirDatosJohnson() {
  const posicion = new Map();
  estado.nodos.forEach((nodo, i) => posicion.set(nodo.id, i));

  const nombres = estado.nodos.map(nodo => nodo.nombre);
  const ids = estado.nodos.map(nodo => nodo.id);
  const aristas = [];

  estado.conexiones.forEach(conexion => {
    const desde = posicion.get(conexion.desde);
    const hacia = posicion.get(conexion.hacia);
    // Una conexión hacia un nodo inexistente se ignora en lugar de romper el cálculo.
    if (desde === undefined || hacia === undefined) return;
    aristas.push({ id: conexion.id, desde: desde, hacia: hacia, peso: conexion.valor });
  });

  return { nombres: nombres, ids: ids, aristas: aristas, cantidad: nombres.length };
}

/**
 * Conexiones que forman el ciclo negativo, en orden y cerrando la vuelta.
 * Con un único nodo busca su bucle (`A → A`).
 * @returns {string[]} ids de las conexiones originales
 */
function conexionesDelCiclo(datos, indices) {
  if (indices.length === 0) return [];

  const conexiones = [];
  for (let i = 0; i < indices.length; i++) {
    const desde = indices[i];
    const hacia = indices[(i + 1) % indices.length];   // la última cierra el ciclo

    // Si hubiera varias aristas entre los mismos nodos se toma la de menor peso,
    // que es la que hace negativo el ciclo.
    let elegida = null;
    datos.aristas.forEach(arista => {
      if (arista.desde !== desde || arista.hacia !== hacia) return;
      if (!elegida || arista.peso < elegida.peso) elegida = arista;
    });
    if (elegida) conexiones.push(elegida.id);
  }

  return conexiones;
}

/**
 * Recorre los predecesores hasta caer dentro del ciclo negativo y devuelve
 * sus nodos en orden. Sirve solo para informar al usuario.
 * @returns {number[]} índices de los nodos del ciclo
 */
function nodosDelCiclo(anterior, arista, total) {
  let actual = arista.hacia;

  // Con "total" saltos hacia atrás se está seguro de haber entrado en el ciclo.
  for (let i = 0; i < total; i++) {
    if (anterior[actual] === -1) return [];
    actual = anterior[actual];
  }

  const ciclo = [];
  const vistos = new Set();
  let nodo = actual;
  while (nodo !== -1 && !vistos.has(nodo)) {
    vistos.add(nodo);
    ciclo.push(nodo);
    nodo = anterior[nodo];
  }

  ciclo.reverse();
  return ciclo;
}

/**
 * Ejecuta el algoritmo de Bellman-Ford desde el nodo auxiliar q.
 * El nodo auxiliar se conecta a todos los nodos con peso 0 para garantizar
 * que todos sean alcanzables.
 * @param {Object} datos - Datos del grafo procesados por construirDatosJohnson
 * @returns {{tieneCicloNegativo:boolean, potenciales:number[]|null, ciclo:number[]}}
 *          Objeto con resultado del algoritmo: indica si hay ciclo negativo,
 *          los potenciales h(v) y los nodos del ciclo si existe
 */
function bellmanFordJohnson(datos) {
  const n = datos.cantidad;
  const q = n;                 // el nodo auxiliar ocupa la última posición
  const total = n + 1;

  // Copia de las aristas más las del nodo auxiliar: el grafo original no se toca.
  const aristas = datos.aristas.slice();
  for (let v = 0; v < n; v++) aristas.push({ desde: q, hacia: v, peso: 0 });

  const distancia = new Array(total).fill(Infinity);
  const anterior = new Array(total).fill(-1);
  distancia[q] = 0;

  // Basta con total-1 pasadas: un camino mínimo no repite nodos.
  for (let pasada = 0; pasada < total - 1; pasada++) {
    let cambio = false;
    for (const arista of aristas) {
      if (distancia[arista.desde] === Infinity) continue;   // aún inalcanzable
      const candidata = distancia[arista.desde] + arista.peso;
      if (candidata < distancia[arista.hacia]) {
        distancia[arista.hacia] = candidata;
        anterior[arista.hacia] = arista.desde;
        cambio = true;
      }
    }
    if (!cambio) break;   // ya está estable, no hace falta seguir
  }

  // Una pasada extra: si todavía se puede mejorar algo, hay un ciclo negativo.
  // Un bucle de peso negativo también se detecta aquí, porque la arista v → v
  // sigue mejorando su propia distancia.
  let ultimaMejora = null;
  for (const arista of aristas) {
    if (distancia[arista.desde] === Infinity) continue;
    if (distancia[arista.desde] + arista.peso < distancia[arista.hacia]) {
      distancia[arista.hacia] = distancia[arista.desde] + arista.peso;
      anterior[arista.hacia] = arista.desde;
      ultimaMejora = arista;
    }
  }
  if (ultimaMejora) {
    return { tieneCicloNegativo: true, potenciales: null,
      ciclo: nodosDelCiclo(anterior, ultimaMejora, total) };
  }

  // Se descarta el nodo auxiliar: los potenciales son los de los nodos reales.
  return { tieneCicloNegativo: false, potenciales: distancia.slice(0, n), ciclo: [] };
}

/**
 * Aplica w'(u,v) = w(u,v) + h(u) - h(v). El resultado nunca es negativo,
 * que es justo lo que Dijkstra necesita para funcionar.
 */
function reponderarConexiones(datos, potenciales) {
  return datos.aristas.map(arista => ({
    id: arista.id,          // se conserva para poder reconstruir la ruta original
    desde: arista.desde,
    hacia: arista.hacia,
    peso: arista.peso + potenciales[arista.desde] - potenciales[arista.hacia]
  }));
}

/**
 * Dijkstra sobre los pesos reponderados.
 *
 * Además de las distancias guarda, para cada nodo, de dónde se llegó a él y por
 * qué conexión. Con eso se reconstruyen después las rutas sobre el grafo original.
 * Los desempates usan `<` estricto, así que gana siempre el primer nodo o la primera
 * conexión según el orden actual del grafo: el resultado es determinista.
 *
 * @returns {{distancias:number[], predecesores:Array<{nodo:number,conexion:string}|null>}}
 */
function dijkstraJohnson(origen, adyacencia, cantidad) {
  const distancias = new Array(cantidad).fill(Infinity);
  const predecesores = new Array(cantidad).fill(null);
  const cerrado = new Array(cantidad).fill(false);
  distancias[origen] = 0;

  for (let paso = 0; paso < cantidad; paso++) {
    // Nodo abierto más cercano. Infinity nunca se elige, así que los nodos
    // inalcanzables se quedan fuera en lugar de tratarse como distancia normal.
    let actual = -1;
    let menor = Infinity;
    for (let v = 0; v < cantidad; v++) {
      if (!cerrado[v] && distancias[v] < menor) { menor = distancias[v]; actual = v; }
    }
    if (actual === -1) break;   // solo quedan nodos inalcanzables

    cerrado[actual] = true;
    adyacencia[actual].forEach(arista => {
      const candidata = distancias[actual] + arista.peso;
      if (candidata < distancias[arista.hacia]) {
        distancias[arista.hacia] = candidata;
        predecesores[arista.hacia] = { nodo: actual, conexion: arista.id };
      }
    });
  }

  return { distancias: distancias, predecesores: predecesores };
}

/**
 * Ejecuta el algoritmo completo de Johnson.
 * Calcula las rutas mínimas entre todos los pares de nodos de un grafo
 * dirigido y ponderado, admitiendo pesos negativos.
 * @returns {{nombres:string[], ids:string[], distancias:Array<number[]>|null,
 *            potenciales:number[]|null, predecesores:Array<Array>|null,
 *            tieneCicloNegativo:boolean, ciclo:string[],
 *            cicloNodos:string[], cicloConexiones:string[]}}
 *          Objeto con el resultado completo del algoritmo de Johnson
 */
function calcularJohnson() {
  const datos = construirDatosJohnson();
  const bellman = bellmanFordJohnson(datos);

  if (bellman.tieneCicloNegativo) {
    // El nodo auxiliar q no tiene nombre: se descarta por si apareciera.
    const indices = bellman.ciclo.filter(indice => indice >= 0 && indice < datos.cantidad);
    return {
      nombres: datos.nombres,
      ids: datos.ids,
      distancias: null,
      potenciales: null,
      predecesores: null,
      tieneCicloNegativo: true,
      ciclo: indices.map(indice => datos.nombres[indice]),
      // Ids del grafo original, para poder resaltar el ciclo en el dibujo.
      cicloNodos: indices.map(indice => datos.ids[indice]),
      cicloConexiones: conexionesDelCiclo(datos, indices)
    };
  }

  const potenciales = bellman.potenciales;
  const reponderadas = reponderarConexiones(datos, potenciales);
  const adyacencia = datos.nombres.map(() => []);
  reponderadas.forEach(arista => adyacencia[arista.desde].push(arista));

  const distancias = [];
  const predecesores = [];
  for (let origen = 0; origen < datos.cantidad; origen++) {
    const dijkstra = dijkstraJohnson(origen, adyacencia, datos.cantidad);
    // Se deshace la reponderación para recuperar la distancia real.
    distancias.push(dijkstra.distancias.map((valor, destino) =>
      valor === Infinity ? Infinity : valor - potenciales[origen] + potenciales[destino]
    ));
    // Los predecesores no se tocan: la reponderación no cambia cuál es el camino
    // más corto, solo cuánto mide, así que sirven tal cual para el grafo original.
    predecesores.push(dijkstra.predecesores);
  }

  return {
    nombres: datos.nombres,
    ids: datos.ids,
    distancias: distancias,
    potenciales: potenciales,
    predecesores: predecesores,
    // Datos del procedimiento: las aristas originales junto a su peso reponderado.
    aristas: datos.aristas.map((arista, i) => ({
      desde: datos.nombres[arista.desde],
      hacia: datos.nombres[arista.hacia],
      peso: arista.peso,
      pesoReponderado: reponderadas[i].peso
    })),
    tieneCicloNegativo: false,
    ciclo: [],
    cicloNodos: [],
    cicloConexiones: []
  };
}

/**
 * Reconstruye una ruta mínima caminando hacia atrás por los predecesores.
 * Devuelve ids del grafo original y la distancia real (nunca la reponderada).
 *
 * @returns {{nodos:string[], conexiones:string[], distancia:number}|null}
 *          null si no hay camino, si hay ciclo negativo o si los índices no son válidos
 */
function reconstruirRutaJohnson(origen, destino, resultado) {
  if (!resultado || resultado.tieneCicloNegativo || !resultado.predecesores) return null;
  if (!resultado.distancias[origen] || resultado.distancias[origen][destino] === undefined) return null;

  const distancia = resultado.distancias[origen][destino];
  if (distancia === Infinity) return null;

  // Origen y destino son el mismo nodo: la distancia es 0 y no se recorre nada.
  if (origen === destino) {
    return { nodos: [resultado.ids[origen]], conexiones: [], distancia: distancia };
  }

  const predecesores = resultado.predecesores[origen];
  const nodos = [];
  const conexiones = [];
  let actual = destino;

  // El tope de pasos evita quedarse dando vueltas si los predecesores llegaran
  // inconsistentes: una ruta mínima no repite nodos, así que nunca hacen falta más.
  for (let paso = 0; paso <= resultado.ids.length; paso++) {
    nodos.push(resultado.ids[actual]);

    if (actual === origen) {
      nodos.reverse();          // se recorrió del destino al origen
      conexiones.reverse();
      return { nodos: nodos, conexiones: conexiones, distancia: distancia };
    }

    const anterior = predecesores[actual];
    if (!anterior) return null;
    conexiones.push(anterior.conexion);
    actual = anterior.nodo;
  }

  return null;
}

/* ---------------- Resultado en pantalla ---------------- */

function formatearDistancia(valor) {
  return valor === Infinity ? SIN_CAMINO : String(valor);
}

/** Texto del aria-label de una celda, según lo que representa. */
function etiquetaCeldaJohnson(resultado, origen, destino) {
  const desde = resultado.nombres[origen];
  const hacia = resultado.nombres[destino];
  const valor = resultado.distancias[origen][destino];

  if (valor === Infinity) return 'No existe camino desde ' + desde + ' hasta ' + hacia;
  if (origen === destino) return 'Ver el nodo ' + desde + ', distancia 0';
  return 'Ver ruta mínima de ' + desde + ' hasta ' + hacia + ', distancia ' + valor;
}

/**
 * Tabla de distancias mínimas. Se reutiliza crearCelda de la matriz de
 * adyacencia, que ya inserta el texto con textContent.
 *
 * Cada celda del cuerpo puede activarse para ver su ruta sobre el grafo; las
 * cabeceras no, porque no representan ninguna ruta.
 */
function construirMatrizJohnson(resultado) {
  const tabla = document.createElement('table');

  const cabecera = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  filaCabecera.appendChild(crearCelda('th', '', 'esquina'));
  resultado.nombres.forEach(nombre => filaCabecera.appendChild(crearCelda('th', nombre)));
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement('tbody');
  resultado.nombres.forEach((nombre, origen) => {
    const linea = document.createElement('tr');
    linea.appendChild(crearCelda('th', nombre, 'fila'));

    resultado.distancias[origen].forEach((valor, destino) => {
      const hayCamino = valor !== Infinity;
      const clases = [hayCamino ? 'celda-ruta' : 'celda-sin-ruta'];

      if (hayCamino) {
        clases.push('valor');
        if (valor < 0) clases.push('negativo');
      } else {
        clases.push('sin-camino');
      }
      if (origen === destino) clases.push('diagonal');

      const celda = crearCelda('td', formatearDistancia(valor), clases.join(' '));

      // Se puede activar con el puntero y con el teclado, como un botón.
      celda.tabIndex = 0;
      celda.setAttribute('role', 'button');
      celda.setAttribute('aria-label', etiquetaCeldaJohnson(resultado, origen, destino));

      celda.addEventListener('click', () => activarCeldaJohnson(resultado, origen, destino));
      celda.addEventListener('keydown', evento => {
        if (evento.key !== 'Enter' && evento.key !== ' ') return;
        evento.preventDefault();   // el espacio desplazaría la tabla
        activarCeldaJohnson(resultado, origen, destino);
      });

      linea.appendChild(celda);
    });

    cuerpo.appendChild(linea);
  });
  tabla.appendChild(cuerpo);

  return tabla;
}

/**
 * Reconstruye la ruta de una celda y la resalta sobre el grafo.
 * Sin camino no cierra el panel: solo avisa, para poder seguir explorando la tabla.
 */
function activarCeldaJohnson(resultado, origen, destino) {
  const desde = resultado.nombres[origen];
  const hacia = resultado.nombres[destino];
  const ruta = reconstruirRutaJohnson(origen, destino, resultado);

  if (!ruta) {
    avisar('No existe un camino desde ' + desde + ' hasta ' + hacia + '.');
    return;
  }

  estado.visualizacionJohnson = {
    origen: ruta.nodos[0],
    destino: ruta.nodos[ruta.nodos.length - 1],
    nodos: ruta.nodos,
    conexiones: ruta.conexiones,
    distancia: ruta.distancia,
    tipo: 'ruta'
  };

  if (typeof mostrarRutaConsultada === 'function') mostrarRutaConsultada(ruta, resultado, origen, destino);

  cerrarResultadoJohnson();
  dibujar();

  if (origen === destino) {
    ayudar('Origen y destino: <strong>' + escaparHtml(desde) + '</strong> · ' +
           'Distancia total: <strong>' + ruta.distancia + '</strong>');
    return;
  }

  const recorrido = ruta.nodos.map(id => {
    const nodo = buscarNodo(id);
    return escaparHtml(nodo ? nodo.nombre : '?');
  }).join(' → ');

  ayudar('Ruta mínima: <strong>' + recorrido + '</strong> · ' +
         'Distancia total: <strong>' + ruta.distancia + '</strong>');
}

/** Explica el ciclo negativo y, si se pudo reconstruir, qué nodos lo forman. */
function avisoCicloNegativo(resultado) {
  const caja = document.createElement('div');
  caja.className = 'johnson-aviso';

  caja.appendChild(crearCelda(
    'p',
    'Johnson no puede producir una matriz completa de distancias mínimas finitas. Las rutas que pueden pasar por este ciclo pueden reducir su costo sin límite.',
    'johnson-aviso-texto'
  ));

  if (resultado.ciclo.length > 0) {
    const recorrido = resultado.ciclo.concat([resultado.ciclo[0]]).join(' → ');
    caja.appendChild(crearCelda('p', 'Ciclo detectado: ' + recorrido, 'johnson-ciclo'));
  }

  caja.appendChild(crearCelda(
    'p',
    'Revisa los pesos negativos de esas conexiones. El grafo no se modificó.',
    'johnson-aviso-texto'
  ));

  return caja;
}

/**
 * Ciclo negativo que se resaltará al cerrar el aviso. Se guarda aparte porque el
 * resaltado no debe taparse con el panel abierto encima.
 */
let cicloJohnsonPendiente = null;

/** Deja el grafo sin resaltado. Redibuja solo si hacía falta y si se le pide. */
function limpiarVisualizacionJohnson(redibujar) {
  if (!estado.visualizacionJohnson) return false;
  estado.visualizacionJohnson = null;
  if (redibujar) dibujar();
  return true;
}

/** Marca en rojo los nodos y las conexiones del ciclo negativo. */
function resaltarCicloJohnson(ciclo) {
  if (!ciclo || ciclo.nodos.length === 0) return;

  estado.visualizacionJohnson = {
    origen: null,               // un ciclo no tiene extremos
    destino: null,
    nodos: ciclo.nodos,
    conexiones: ciclo.conexiones,
    distancia: null,
    tipo: 'ciclo'
  };

  dibujar();

  // El primer nombre se repite al final para que se vea que la vuelta se cierra.
  const recorrido = ciclo.nombres.concat([ciclo.nombres[0]]).map(escaparHtml).join(' → ');
  ayudar('Ciclo negativo detectado: <strong>' + recorrido + '</strong>');
}

/** Un paso del procedimiento: título, explicación y, si aplica, una tabla. */
function pasoJohnson(titulo, texto, tabla) {
  const bloque = document.createElement('section');
  bloque.className = 'procedure-step';
  bloque.appendChild(crearCelda('h3', titulo));
  bloque.appendChild(crearCelda('p', texto));
  if (tabla) bloque.appendChild(tabla);
  return bloque;
}

/** Tabla de dos columnas: nodo y su potencial h(v). */
function tablaPotenciales(resultado) {
  const caja = document.createElement('div');
  caja.className = 'tabla-datos tabla-datos--paso';
  const tabla = document.createElement('table');

  const cabecera = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  filaCabecera.appendChild(crearCelda('th', 'Nodo v'));
  filaCabecera.appendChild(crearCelda('th', 'h(v)'));
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement('tbody');
  resultado.nombres.forEach((nombre, i) => {
    const linea = document.createElement('tr');
    linea.appendChild(crearCelda('th', nombre, 'fila'));
    linea.appendChild(crearCelda('td', String(resultado.potenciales[i]), 'valor'));
    cuerpo.appendChild(linea);
  });
  tabla.appendChild(cuerpo);

  caja.appendChild(tabla);
  return caja;
}

/** Tabla de aristas con su peso original y su peso reponderado. */
function tablaReponderacion(resultado) {
  const caja = document.createElement('div');
  caja.className = 'tabla-datos tabla-datos--paso';
  const tabla = document.createElement('table');

  const cabecera = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  ['Arista', 'w(u,v)', "w'(u,v)"].forEach(texto => filaCabecera.appendChild(crearCelda('th', texto)));
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement('tbody');
  resultado.aristas.forEach(arista => {
    const linea = document.createElement('tr');
    linea.appendChild(crearCelda('th', arista.desde + ' → ' + arista.hacia, 'fila'));
    linea.appendChild(crearCelda('td', String(arista.peso), arista.peso < 0 ? 'valor negativo' : 'valor'));
    linea.appendChild(crearCelda('td', String(arista.pesoReponderado), 'valor'));
    cuerpo.appendChild(linea);
  });
  tabla.appendChild(cuerpo);

  caja.appendChild(tabla);
  return caja;
}

/**
 * Muestra cómo se llegó al resultado. No repite el cálculo: usa los datos
 * intermedios que ya devolvió calcularJohnson().
 */
function dibujarProcedimientoJohnson(resultado) {
  if (!el.johnsonProcedimiento || !el.johnsonPasos) return;

  el.johnsonPasos.replaceChildren();

  if (resultado.tieneCicloNegativo || !resultado.potenciales) {
    el.johnsonProcedimiento.hidden = true;
    el.johnsonProcedimiento.open = false;
    return;
  }

  el.johnsonPasos.appendChild(pasoJohnson(
    '1. Nodo auxiliar y Bellman-Ford',
    'Se añade un nodo q conectado a todos los demás con peso 0 y se ejecuta Bellman-Ford desde q. ' +
    'La distancia obtenida para cada nodo es su potencial h(v). Este paso también es el que detecta los ciclos negativos.',
    tablaPotenciales(resultado)
  ));

  el.johnsonPasos.appendChild(pasoJohnson(
    '2. Reponderación de las aristas',
    "Se aplica w'(u,v) = w(u,v) + h(u) − h(v). Los nuevos pesos nunca son negativos y los caminos mínimos " +
    'siguen siendo los mismos, que es lo que permite usar Dijkstra.',
    resultado.aristas.length > 0 ? tablaReponderacion(resultado) : null
  ));

  el.johnsonPasos.appendChild(pasoJohnson(
    '3. Dijkstra desde cada nodo',
    'Con los pesos reponderados se ejecuta Dijkstra una vez por cada nodo de origen (' +
    resultado.nombres.length + ' ejecuciones).',
    null
  ));

  el.johnsonPasos.appendChild(pasoJohnson(
    '4. Distancias reales',
    "Se deshace la reponderación con d(u,v) = d'(u,v) − h(u) + h(v). El resultado es la tabla de arriba: " +
    'toca cualquier celda para ver esa ruta dibujada sobre el grafo.',
    null
  ));

  el.johnsonProcedimiento.hidden = false;
}

function dibujarResultadoJohnson(resultado) {
  if (typeof registrarResultadoJohnson === 'function') registrarResultadoJohnson(resultado);
  el.johnsonTabla.textContent = '';
  dibujarProcedimientoJohnson(resultado);

  if (resultado.tieneCicloNegativo) {
    el.johnsonEstado.textContent = 'El grafo contiene un ciclo de peso negativo.';
    el.johnsonEstado.className = 'johnson-estado es-error';
    el.johnsonTabla.appendChild(avisoCicloNegativo(resultado));
    avisar('El grafo contiene un ciclo de peso negativo.', 'error');
    // Se resaltará al cerrar el aviso, cuando el grafo vuelva a estar a la vista.
    cicloJohnsonPendiente = resultado.cicloNodos.length === 0 ? null : {
      nodos: resultado.cicloNodos,
      conexiones: resultado.cicloConexiones,
      nombres: resultado.ciclo
    };
    return;
  }

  el.johnsonEstado.textContent = 'Cálculo completado.';
  el.johnsonEstado.className = 'johnson-estado es-ok';
  el.johnsonTabla.appendChild(construirMatrizJohnson(resultado));
  avisar('Cálculo completado.', 'ok');
}

function johnsonVisible() {
  return !el.johnsonFondo.hidden;
}

function abrirResultadoJohnson() {
  if (typeof cambiarConsulta === 'function') cambiarConsulta();
  if (estado.nodos.length < 1) {
    avisar('Crea al menos un nodo para calcular las distancias mínimas.');
    return;
  }

  cerrarMatriz();          // dos hojas a la vez se taparían
  cerrarBiblioteca();

  // Un cálculo nuevo invalida el resaltado anterior.
  cicloJohnsonPendiente = null;
  limpiarVisualizacionJohnson(true);

  el.johnsonTabla.textContent = '';
  if (el.johnsonProcedimiento) el.johnsonProcedimiento.hidden = true;
  el.johnsonEstado.textContent = 'Calculando las rutas mínimas…';
  el.johnsonEstado.className = 'johnson-estado';
  el.johnsonFondo.hidden = false;
  el.btnCerrarJohnson.focus();

  ayudar('Resultado de <strong>Johnson</strong>: cada fila es el nodo de origen y cada columna el de destino.');
  avisar('Calculando las rutas mínimas…');

  // El cálculo es sincrónico: se aplaza un instante para que el navegador
  // alcance a pintar el estado antes de bloquearse con el recorrido.
  setTimeout(() => {
    if (el.johnsonFondo.hidden) return;   // se cerró mientras esperaba
    dibujarResultadoJohnson(calcularJohnson());
  }, 0);
}

function cerrarResultadoJohnson() {
  el.johnsonFondo.hidden = true;
  el.johnsonTabla.textContent = '';
  if (el.johnsonProcedimiento) {
    el.johnsonProcedimiento.hidden = true;
    el.johnsonProcedimiento.open = false;
  }

  // Se consume una sola vez: si el usuario vuelve a cerrar no se repite el resaltado.
  const ciclo = cicloJohnsonPendiente;
  cicloJohnsonPendiente = null;
  if (ciclo) resaltarCicloJohnson(ciclo);
}

function alternarJohnson() {
  if (johnsonVisible()) cerrarResultadoJohnson();
  else abrirResultadoJohnson();
}
