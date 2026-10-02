/*
 * Algoritmo de Johnson: distancias mínimas entre todos los pares de nodos
 * de un grafo dirigido y ponderado, admitiendo pesos negativos.
 *
 * Pasos: nodo auxiliar q conectado a todos con peso 0 → Bellman-Ford desde q
 * para obtener los potenciales h(v) y detectar ciclos negativos → reponderación
 * w'(u,v) = w(u,v) + h(u) - h(v), que deja todos los pesos en positivo o cero
 * → Dijkstra desde cada nodo → se recupera d(u,v) = d'(u,v) - h(u) + h(v).
 *
 * Este archivo no toca el DOM: el cálculo trabaja con copias y registra todo lo
 * necesario para mostrar la resolución paso a paso (js/johnson/vistas.js).
 * Se puede cargar en Node (tests/johnson.test.js).
 */

'use strict';

/**
 * Copia un grafo a índices numéricos (0, 1, 2…), más cómodos para el cálculo.
 * Cada arista conserva el `id` de su conexión original: es lo que después permite
 * resaltar exactamente esa arista en el dibujo.
 * Las aristas se recorren en el orden de `conexiones` y los nodos en el de `nodos`:
 * de ahí sale el desempate determinista entre rutas de igual costo.
 * @returns {{nombres:string[], ids:string[], aristas:Array<{id:string,desde:number,hacia:number,peso:number}>, cantidad:number}}
 */
function prepararDatosJohnson(nodos, conexiones) {
  const posicion = new Map();
  nodos.forEach((nodo, i) => posicion.set(nodo.id, i));

  const aristas = [];
  conexiones.forEach(conexion => {
    const desde = posicion.get(conexion.desde);
    const hacia = posicion.get(conexion.hacia);
    // Una conexión hacia un nodo inexistente se ignora en lugar de romper el cálculo.
    if (desde === undefined || hacia === undefined) return;
    aristas.push({ id: conexion.id, desde: desde, hacia: hacia, peso: conexion.valor });
  });

  return {
    nombres: nodos.map(nodo => nodo.nombre),
    ids: nodos.map(nodo => nodo.id),
    aristas: aristas,
    cantidad: nodos.length
  };
}

/** Datos del grafo que está en pantalla. */
function construirDatosJohnson() {
  return prepararDatosJohnson(estado.nodos, estado.conexiones);
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
 * sus nodos en el sentido de las flechas.
 * @param {number[]} anterior predecesor de cada nodo (-1 si no tiene)
 * @param {number} inicio nodo cuya distancia todavía podía mejorar
 * @param {number} total cantidad de nodos, incluido el auxiliar
 * @returns {number[]} índices de los nodos del ciclo ([] si no se pudo reconstruir)
 */
function nodosDelCiclo(anterior, inicio, total) {
  let actual = inicio;

  // Con "total" saltos hacia atrás se está seguro de haber entrado en el ciclo.
  for (let i = 0; i < total; i++) {
    actual = anterior[actual];
    if (actual === -1 || actual === undefined) return [];
  }

  const ciclo = [];
  let nodo = actual;
  do {
    ciclo.push(nodo);
    nodo = anterior[nodo];
  } while (nodo !== actual && nodo !== -1 && ciclo.length <= total);

  if (nodo !== actual) return [];
  ciclo.reverse();               // se recorrió contra las flechas
  return ciclo;
}

/**
 * Ejecuta Bellman-Ford desde el nodo auxiliar q, conectado a todos los nodos con
 * peso 0 para garantizar que todos sean alcanzables.
 *
 * Registra cada pasada (distancias antes y después y las relajaciones hechas)
 * para poder enseñarla en la resolución paso a paso.
 *
 * @returns {{tieneCicloNegativo:boolean, potenciales:number[]|null, ciclo:number[],
 *            pasadas:Array, aristaCiclo:Object|null, totalAristas:number}}
 */
function bellmanFordJohnson(datos) {
  const n = datos.cantidad;
  const q = n;                 // el nodo auxiliar ocupa la última posición
  const total = n + 1;

  // Copia de las aristas más las del nodo auxiliar: el grafo original no se toca.
  const aristas = datos.aristas.slice();
  for (let v = 0; v < n; v++) aristas.push({ id: null, desde: q, hacia: v, peso: 0 });

  const distancia = new Array(total).fill(Infinity);
  const anterior = new Array(total).fill(-1);
  distancia[q] = 0;

  const pasadas = [];

  // Basta con total-1 pasadas: un camino mínimo no repite nodos.
  for (let pasada = 0; pasada < total - 1; pasada++) {
    const antes = distancia.slice(0, n);
    const relajaciones = [];
    for (const arista of aristas) {
      if (distancia[arista.desde] === Infinity) continue;   // aún inalcanzable
      const candidata = distancia[arista.desde] + arista.peso;
      if (candidata < distancia[arista.hacia]) {
        relajaciones.push({
          id: arista.id,
          desde: arista.desde,
          hacia: arista.hacia,
          peso: arista.peso,
          base: distancia[arista.desde],
          anterior: distancia[arista.hacia],
          nuevo: candidata
        });
        distancia[arista.hacia] = candidata;
        anterior[arista.hacia] = arista.desde;
      }
    }
    pasadas.push({ numero: pasada + 1, antes: antes, despues: distancia.slice(0, n), relajaciones: relajaciones });
    if (relajaciones.length === 0) break;   // ya está estable, no hace falta seguir
  }

  // Una pasada extra: si todavía se puede mejorar algo, hay un ciclo negativo.
  // Un bucle de peso negativo también se detecta aquí, porque la arista v → v
  // sigue mejorando su propia distancia.
  for (const arista of aristas) {
    if (distancia[arista.desde] === Infinity) continue;
    if (distancia[arista.desde] + arista.peso < distancia[arista.hacia]) {
      let ciclo;
      if (arista.desde === arista.hacia) {
        ciclo = [arista.desde];                                  // bucle negativo
      } else {
        // La arista que aún mejora pasa a ser el predecesor: así el recorrido
        // hacia atrás siempre parte de un nodo afectado por el ciclo.
        anterior[arista.hacia] = arista.desde;
        ciclo = nodosDelCiclo(anterior, arista.hacia, total);
      }
      return {
        tieneCicloNegativo: true,
        potenciales: null,
        ciclo: ciclo.filter(indice => indice >= 0 && indice < n),
        pasadas: pasadas,
        aristaCiclo: { id: arista.id, desde: arista.desde, hacia: arista.hacia, peso: arista.peso,
                       base: distancia[arista.desde], actual: distancia[arista.hacia] },
        totalAristas: aristas.length
      };
    }
  }

  // Se descarta el nodo auxiliar: los potenciales son los de los nodos reales.
  return {
    tieneCicloNegativo: false,
    potenciales: distancia.slice(0, n),
    ciclo: [],
    pasadas: pasadas,
    aristaCiclo: null,
    totalAristas: aristas.length
  };
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
 * qué conexión, y el orden en que se fijaron los nodos.
 * Los desempates usan `<` estricto, así que gana siempre el primer nodo o la primera
 * conexión según el orden actual del grafo: el resultado es determinista.
 *
 * @returns {{distancias:number[], predecesores:Array<{nodo:number,conexion:string}|null>, orden:number[]}}
 */
function dijkstraJohnson(origen, adyacencia, cantidad) {
  const distancias = new Array(cantidad).fill(Infinity);
  const predecesores = new Array(cantidad).fill(null);
  const cerrado = new Array(cantidad).fill(false);
  const orden = [];
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
    orden.push(actual);
    adyacencia[actual].forEach(arista => {
      if (cerrado[arista.hacia]) return;
      const candidata = distancias[actual] + arista.peso;
      if (candidata < distancias[arista.hacia]) {
        distancias[arista.hacia] = candidata;
        predecesores[arista.hacia] = { nodo: actual, conexion: arista.id };
      }
    });
  }

  return { distancias: distancias, predecesores: predecesores, orden: orden };
}

/**
 * Ejecuta el algoritmo completo de Johnson sobre unos datos ya preparados.
 * @returns {Object} resultado con distancias, potenciales, predecesores, datos
 *          intermedios de cada fase y la lista de pasos para la vista.
 */
function calcularJohnsonDesde(datos) {
  const bellman = bellmanFordJohnson(datos);
  const base = {
    nombres: datos.nombres,
    ids: datos.ids,
    cantidad: datos.cantidad,
    aristasOriginales: datos.aristas.map(a => ({ id: a.id, desde: a.desde, hacia: a.hacia, peso: a.peso })),
    pasadas: bellman.pasadas,
    totalAristasBellman: bellman.totalAristas
  };

  if (bellman.tieneCicloNegativo) {
    const indices = bellman.ciclo;
    const resultado = Object.assign(base, {
      distancias: null,
      distanciasReponderadas: null,
      potenciales: null,
      predecesores: null,
      ordenes: null,
      aristas: [],
      tieneCicloNegativo: true,
      aristaCiclo: bellman.aristaCiclo,
      cicloIndices: indices,
      ciclo: indices.map(indice => datos.nombres[indice]),
      // Ids del grafo original, para poder resaltar el ciclo en el dibujo.
      cicloNodos: indices.map(indice => datos.ids[indice]),
      cicloConexiones: conexionesDelCiclo(datos, indices)
    });
    resultado.cicloPeso = resultado.cicloConexiones.reduce((suma, id) => {
      const arista = datos.aristas.find(a => a.id === id);
      return suma + (arista ? arista.peso : 0);
    }, 0);
    resultado.pasos = construirPasosJohnson(resultado);
    return resultado;
  }

  const potenciales = bellman.potenciales;
  const reponderadas = reponderarConexiones(datos, potenciales);
  const adyacencia = datos.nombres.map(() => []);
  reponderadas.forEach(arista => adyacencia[arista.desde].push(arista));

  const distancias = [];
  const distanciasReponderadas = [];
  const predecesores = [];
  const ordenes = [];
  for (let origen = 0; origen < datos.cantidad; origen++) {
    const dijkstra = dijkstraJohnson(origen, adyacencia, datos.cantidad);
    distanciasReponderadas.push(dijkstra.distancias);
    // Se deshace la reponderación para recuperar la distancia real.
    distancias.push(dijkstra.distancias.map((valor, destino) =>
      valor === Infinity ? Infinity : valor - potenciales[origen] + potenciales[destino]
    ));
    // Los predecesores no se tocan: la reponderación no cambia cuál es el camino
    // más corto, solo cuánto mide, así que sirven tal cual para el grafo original.
    predecesores.push(dijkstra.predecesores);
    ordenes.push(dijkstra.orden);
  }

  const resultado = Object.assign(base, {
    distancias: distancias,
    distanciasReponderadas: distanciasReponderadas,
    potenciales: potenciales,
    predecesores: predecesores,
    ordenes: ordenes,
    // Las aristas originales junto a su peso reponderado.
    aristas: datos.aristas.map((arista, i) => ({
      id: arista.id,
      indiceDesde: arista.desde,
      indiceHacia: arista.hacia,
      desde: datos.nombres[arista.desde],
      hacia: datos.nombres[arista.hacia],
      peso: arista.peso,
      pesoReponderado: reponderadas[i].peso
    })),
    tieneCicloNegativo: false,
    aristaCiclo: null,
    cicloIndices: [],
    ciclo: [],
    cicloNodos: [],
    cicloConexiones: [],
    cicloPeso: 0
  });
  resultado.pasos = construirPasosJohnson(resultado);
  return resultado;
}

/** Johnson sobre el grafo que está en pantalla. */
function calcularJohnson() {
  return calcularJohnsonDesde(construirDatosJohnson());
}

/**
 * Reconstruye una ruta mínima caminando hacia atrás por los predecesores.
 * Devuelve ids del grafo original, índices, y la distancia real (nunca la reponderada).
 *
 * @returns {{nodos:string[], indices:number[], conexiones:string[], distancia:number}|null}
 *          null si no hay camino, si hay ciclo negativo o si los índices no son válidos
 */
function reconstruirRutaJohnson(origen, destino, resultado) {
  if (!resultado || resultado.tieneCicloNegativo || !resultado.predecesores) return null;
  if (!resultado.distancias[origen] || resultado.distancias[origen][destino] === undefined) return null;

  const distancia = resultado.distancias[origen][destino];
  if (distancia === Infinity) return null;

  // Origen y destino son el mismo nodo: la distancia es 0 y no se recorre nada.
  if (origen === destino) {
    return { nodos: [resultado.ids[origen]], indices: [origen], conexiones: [], distancia: distancia };
  }

  const predecesores = resultado.predecesores[origen];
  const indices = [];
  const conexiones = [];
  let actual = destino;

  // El tope de pasos evita quedarse dando vueltas si los predecesores llegaran
  // inconsistentes: una ruta mínima no repite nodos, así que nunca hacen falta más.
  for (let paso = 0; paso <= resultado.ids.length; paso++) {
    indices.push(actual);

    if (actual === origen) {
      indices.reverse();          // se recorrió del destino al origen
      conexiones.reverse();
      return { nodos: indices.map(i => resultado.ids[i]), indices: indices, conexiones: conexiones, distancia: distancia };
    }

    const anterior = predecesores[actual];
    if (!anterior) return null;
    conexiones.push(anterior.conexion);
    actual = anterior.nodo;
  }

  return null;
}

/** Peso original de cada conexión de una ruta, en orden. */
function pesosDeRutaJohnson(ruta, resultado) {
  return ruta.conexiones.map(id => {
    const arista = resultado.aristasOriginales.find(a => a.id === id);
    return arista ? arista.peso : 0;
  });
}

function formatearDistancia(valor) {
  return valor === Infinity ? SIN_CAMINO : String(valor);
}

/** Un número listo para aparecer como sumando: los negativos van entre paréntesis. */
function formatearSumando(valor) {
  return valor < 0 ? '(' + valor + ')' : String(valor);
}

/* ---------------- Pasos de la resolución ---------------- */

/**
 * Lista de pasos que se muestran en la resolución. Cada paso describe qué
 * se hizo con datos de la ejecución real; la vista solo los dibuja.
 *   tipo: 'original' | 'auxiliar' | 'bellman' | 'ciclo' | 'verificacion' |
 *         'reponderacion' | 'dijkstra' | 'final'
 */
function construirPasosJohnson(r) {
  const n = r.cantidad;
  const m = r.aristasOriginales.length;
  const negativos = r.aristasOriginales.filter(a => a.peso < 0).length;
  const pasos = [];

  pasos.push({
    tipo: 'original',
    titulo: 'Grafo original',
    texto: n + (n === 1 ? ' nodo' : ' nodos') + ' y ' + m + (m === 1 ? ' conexión dirigida' : ' conexiones dirigidas') + '. ' +
      (negativos > 0
        ? 'Hay ' + negativos + (negativos === 1 ? ' peso negativo' : ' pesos negativos') +
          ': Dijkstra por sí solo daría resultados incorrectos, por eso Johnson primero reponderará las aristas.'
        : 'No hay pesos negativos: los potenciales saldrán 0 y la reponderación no cambiará ningún peso, pero el procedimiento es el mismo.')
  });

  pasos.push({
    tipo: 'auxiliar',
    titulo: 'Nodo auxiliar q',
    texto: 'Se añade un nodo nuevo q con una conexión de peso 0 hacia cada uno de los ' + n +
      ' nodos. Así todos son alcanzables desde q. El grafo original no se modifica: q solo existe durante el cálculo.'
  });

  r.pasadas.forEach(pasada => {
    const cambios = pasada.relajaciones.length;
    pasos.push({
      tipo: 'bellman',
      titulo: 'Bellman-Ford · pasada ' + pasada.numero,
      texto: cambios > 0
        ? 'Se revisan las ' + r.totalAristasBellman + ' conexiones (incluidas las de q). Cada vez que d(u) + w(u,v) < d(v) se actualiza d(v): ' +
          cambios + (cambios === 1 ? ' mejora' : ' mejoras') + ' en esta pasada.'
        : 'Ninguna distancia mejora en esta pasada: los valores ya son definitivos y Bellman-Ford termina antes de completar las ' + n + ' pasadas.',
      pasada: pasada
    });
  });

  if (r.tieneCicloNegativo) {
    const a = r.aristaCiclo;
    const nombre = i => (i === n ? 'q' : r.nombres[i]);
    pasos.push({
      tipo: 'ciclo',
      titulo: 'Ciclo negativo detectado',
      texto: 'Después de ' + n + ' pasadas todavía se puede mejorar ' + nombre(a.desde) + ' → ' + nombre(a.hacia) + ': ' +
        a.base + ' + ' + formatearSumando(a.peso) + ' = ' + (a.base + a.peso) + ' < ' + a.actual + '. ' +
        'Eso solo ocurre si hay un ciclo cuya suma de pesos es negativa: cada vuelta reduce el costo sin límite, así que no existen distancias mínimas. El algoritmo se detiene aquí.'
    });
    return pasos;
  }

  pasos.push({
    tipo: 'verificacion',
    titulo: 'Potenciales h(v)',
    texto: 'Una revisión adicional de todas las conexiones no mejora ninguna distancia: no hay ciclos negativos. ' +
      'La distancia final desde q a cada nodo es su potencial h(v). Como q llega a todos con peso 0, siempre h(v) ≤ 0.'
  });

  pasos.push({
    tipo: 'reponderacion',
    titulo: 'Reponderación de las aristas',
    texto: "Cada peso se transforma con w'(u,v) = w(u,v) + h(u) − h(v). Los nuevos pesos nunca son negativos y " +
      'en cualquier camino de u a v la suma cambia siempre en la misma cantidad, h(u) − h(v): los caminos mínimos siguen siendo los mismos.'
  });

  for (let origen = 0; origen < n; origen++) {
    const orden = r.ordenes[origen].map(i => r.nombres[i]);
    const alcanzables = orden.length - 1;
    pasos.push({
      tipo: 'dijkstra',
      titulo: 'Dijkstra desde ' + r.nombres[origen],
      texto: "Con los pesos w' se ejecuta Dijkstra desde " + r.nombres[origen] + '. Orden en que se fijan los nodos: ' +
        orden.join(' → ') + '. ' +
        (alcanzables < n - 1 ? (n - 1 - alcanzables) + (n - 1 - alcanzables === 1 ? ' nodo queda' : ' nodos quedan') + ' sin camino (∞). ' : '') +
        "La distancia real se recupera con d(u,v) = d'(u,v) − h(u) + h(v).",
      origen: origen
    });
  }

  pasos.push({
    tipo: 'final',
    titulo: 'Matriz de distancias mínimas',
    texto: 'Reuniendo las ' + n + ' ejecuciones de Dijkstra se obtiene la distancia mínima entre todos los pares. ' +
      'Cada fila es el origen y cada columna el destino; ∞ indica que no hay camino.'
  });

  return pasos;
}
