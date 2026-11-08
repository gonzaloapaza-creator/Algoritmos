/* Caminos máximos en grafos dirigidos acíclicos. No modifica el grafo ni usa el DOM. */
'use strict';

/**
 * Ordena TODO el grafo con Kahn y calcula máximos desde el origen mediante
 * programación dinámica. Conserva pesos e identificadores originales.
 * Los empates mantienen la primera conexión encontrada, de forma determinista.
 */
function calcularMaximosDAGJohnson(nodos, conexiones, origenId) {
  if (!Array.isArray(nodos) || !Array.isArray(conexiones)) {
    throw new Error('Se requieren listas de nodos y conexiones.');
  }

  const ids = nodos.map(nodo => nodo && nodo.id);
  const posicion = new Map();
  ids.forEach((id, indice) => {
    if (typeof id !== 'string' || !id || posicion.has(id)) {
      throw new Error('Los nodos deben tener identificadores únicos.');
    }
    posicion.set(id, indice);
  });
  if (!posicion.has(origenId)) throw new Error('El nodo de origen no existe.');

  const salientes = ids.map(() => []);
  const entradas = ids.map(() => 0);
  const idsConexiones = new Set();
  conexiones.forEach(conexion => {
    if (!conexion || typeof conexion.id !== 'string' || !conexion.id ||
        idsConexiones.has(conexion.id)) {
      throw new Error('Las conexiones deben tener identificadores únicos.');
    }
    const desde = posicion.get(conexion.desde);
    const hacia = posicion.get(conexion.hacia);
    if (desde === undefined || hacia === undefined) {
      throw new Error('Una conexión referencia un nodo que no existe.');
    }
    if (!Number.isFinite(conexion.valor)) throw new Error('El peso debe ser un número finito.');
    idsConexiones.add(conexion.id);
    salientes[desde].push({ id: conexion.id, desde: desde, hacia: hacia, peso: conexion.valor });
    entradas[hacia]++;
  });

  // La cola inicial respeta el orden de nodos y cada alta el de conexiones.
  const cola = [];
  entradas.forEach((cantidad, indice) => { if (cantidad === 0) cola.push(indice); });
  const orden = [];
  for (let turno = 0; turno < cola.length; turno++) {
    const desde = cola[turno];
    orden.push(desde);
    salientes[desde].forEach(arista => {
      entradas[arista.hacia]--;
      if (entradas[arista.hacia] === 0) cola.push(arista.hacia);
    });
  }

  const resultado = {
    aciclico: orden.length === ids.length,
    origen: origenId,
    ids: ids,
    distancias: null,
    predecesores: null,
    orden: orden,
    operaciones: []
  };
  // También bloquea los ciclos que no sean alcanzables desde el origen.
  if (!resultado.aciclico) return resultado;

  const distancias = ids.map(() => -Infinity);
  const predecesores = ids.map(() => null);
  distancias[posicion.get(origenId)] = 0;
  orden.forEach(desde => {
    if (distancias[desde] === -Infinity) return;
    salientes[desde].forEach(arista => {
      const anterior = distancias[arista.hacia];
      const candidato = distancias[desde] + arista.peso;
      const mejora = candidato > anterior;
      if (mejora) {
        distancias[arista.hacia] = candidato;
        predecesores[arista.hacia] = { nodo: desde, conexion: arista.id };
      }
      resultado.operaciones.push({
        desde: desde,
        hacia: arista.hacia,
        peso: arista.peso,
        anterior: anterior,
        candidato: candidato,
        actual: distancias[arista.hacia],
        mejora: mejora
      });
    });
  });
  resultado.distancias = distancias;
  resultado.predecesores = predecesores;
  return resultado;
}

/** Devuelve el camino de máximo peso, o null si no está definido/alcanza al destino. */
function reconstruirMaximoDAGJohnson(destinoId, resultado) {
  if (!resultado || !resultado.aciclico || !resultado.distancias || !resultado.predecesores) return null;
  const destino = resultado.ids.indexOf(destinoId);
  const origen = resultado.ids.indexOf(resultado.origen);
  if (destino < 0 || origen < 0 || resultado.distancias[destino] === -Infinity) return null;

  const indices = [];
  const conexiones = [];
  let actual = destino;
  // Límite defensivo para que un resultado ajeno/corrupto no produzca un bucle.
  for (let salto = 0; salto < resultado.ids.length; salto++) {
    indices.push(actual);
    if (actual === origen) {
      indices.reverse();
      conexiones.reverse();
      return {
        nodos: indices.map(indice => resultado.ids[indice]),
        indices: indices,
        conexiones: conexiones,
        distancia: resultado.distancias[destino]
      };
    }
    const anterior = resultado.predecesores[actual];
    if (!anterior || !Number.isInteger(anterior.nodo) || anterior.nodo < 0 || anterior.nodo >= resultado.ids.length) return null;
    conexiones.push(anterior.conexion);
    actual = anterior.nodo;
  }
  return null;
}

/**
 * Análisis temporal complementario, independiente de las distancias mínimas de
 * Johnson. La condición DAG y las duraciones no negativas se aplican a la red
 * completa; los tiempos y holguras se calculan solo en la subred origen-destino.
 * Los vectores conservan el orden/IDs del grafo y usan null para nodos excluidos.
 */
function calcularTiemposHolgurasJohnson(nodos, conexiones, origenId, destinoId) {
  // Este motor también valida identidades, referencias, números y el DAG global.
  const maximos = calcularMaximosDAGJohnson(nodos, conexiones, origenId);
  const ids = maximos.ids;
  const posicion = new Map(ids.map((id, indice) => [id, indice]));
  const origen = posicion.get(origenId);
  const destino = posicion.get(destinoId);
  if (destino === undefined) throw new Error('El nodo de destino no existe.');

  const resultado = {
    valido: false,
    motivo: null,
    mensaje: '',
    origen: origenId,
    destino: destinoId,
    ids: ids.slice(),
    idsActivos: [],
    conexionesActivas: [],
    tempranos: ids.map(() => null),
    tardios: ids.map(() => null),
    holguras: Object.create(null),
    criticas: [],
    duracion: null,
    tolerancia: null,
    orden: []
  };
  function rechazar(motivo, mensaje) {
    resultado.motivo = motivo;
    resultado.mensaje = mensaje;
    return resultado;
  }
  if (origenId === destinoId) {
    return rechazar('origen-destino-iguales', 'Tiempos y holguras requiere un origen y un destino distintos.');
  }
  if (conexiones.some(conexion => conexion.valor < 0)) {
    return rechazar('duraciones-negativas', 'Tiempos y holguras interpreta todos los pesos como duraciones: no admite valores negativos en la red.');
  }
  if (!maximos.aciclico) {
    return rechazar('ciclo', 'Tiempos y holguras requiere que toda la red dirigida sea acíclica. Hay un ciclo en el grafo.');
  }

  const salientes = ids.map(() => []);
  const entrantes = ids.map(() => []);
  conexiones.forEach(conexion => {
    const arista = { id: conexion.id, desde: posicion.get(conexion.desde), hacia: posicion.get(conexion.hacia), peso: conexion.valor };
    salientes[arista.desde].push(arista);
    entrantes[arista.hacia].push(arista);
  });
  function alcanzables(inicio, adyacencias, extremo) {
    const vistos = new Set([inicio]);
    const pendientes = [inicio];
    while (pendientes.length) {
      adyacencias[pendientes.pop()].forEach(arista => {
        const siguiente = arista[extremo];
        if (!vistos.has(siguiente)) {
          vistos.add(siguiente);
          pendientes.push(siguiente);
        }
      });
    }
    return vistos;
  }
  const desdeOrigen = alcanzables(origen, salientes, 'hacia');
  if (!desdeOrigen.has(destino)) {
    return rechazar('sin-camino', 'No existe camino del origen al destino; no se puede realizar el análisis temporal seleccionado.');
  }
  const haciaDestino = alcanzables(destino, entrantes, 'desde');
  const activos = new Set([...desdeOrigen].filter(indice => haciaDestino.has(indice)));
  const aristasActivas = conexiones.filter(conexion => activos.has(posicion.get(conexion.desde)) && activos.has(posicion.get(conexion.hacia)));
  const orden = maximos.orden.filter(indice => activos.has(indice));
  resultado.idsActivos = ids.filter((_, indice) => activos.has(indice));
  resultado.conexionesActivas = aristasActivas.map(arista => arista.id);
  resultado.orden = orden;

  resultado.tempranos[origen] = 0;
  orden.forEach(desde => {
    salientes[desde].forEach(arista => {
      if (!activos.has(arista.hacia)) return;
      const candidato = resultado.tempranos[desde] + arista.peso;
      if (resultado.tempranos[arista.hacia] === null || candidato > resultado.tempranos[arista.hacia]) {
        resultado.tempranos[arista.hacia] = candidato;
      }
    });
  });
  const duracion = resultado.tempranos[destino];
  resultado.duracion = duracion;
  resultado.tardios[destino] = duracion;
  orden.slice().reverse().forEach(desde => {
    if (desde === destino) return;
    let tardio = Infinity;
    salientes[desde].forEach(arista => {
      if (activos.has(arista.hacia)) tardio = Math.min(tardio, resultado.tardios[arista.hacia] - arista.peso);
    });
    resultado.tardios[desde] = tardio;
  });
  // Tolerancia de redondeo relativa a la escala, suficientemente pequeña para
  // conservar holguras enteras positivas dentro de los límites del editor.
  resultado.tolerancia = Number.EPSILON * 64 * Math.max(1, Math.abs(duracion));
  aristasActivas.forEach(arista => {
    const holgura = resultado.tardios[posicion.get(arista.hacia)] - resultado.tempranos[posicion.get(arista.desde)] - arista.valor;
    const critica = Math.abs(holgura) <= resultado.tolerancia;
    resultado.holguras[arista.id] = critica ? 0 : holgura;
    if (critica) resultado.criticas.push(arista.id);
  });
  resultado.valido = true;
  resultado.mensaje = 'Análisis temporal complementario sobre la subred que participa en caminos del origen al destino.';
  return resultado;
}

/**
 * Enumera bajo petición caminos simples en orden de profundidad, sin prometer
 * orden por costo. Opera sobre una copia de los datos; nunca alimenta los
 * motores principales de mínimos/máximos. Cada intento de arista cuenta como
 * trabajo, incluso si se descarta por repetir un nodo.
 *
 * Opciones: maxRutas (30, hasta 200), maxTrabajo (10000, hasta 100000),
 * cederCada (200, hasta 500), signal de AbortController, cancelado() y ceder().
 * ceder es un punto de prueba; por defecto devuelve el control al navegador
 * mediante setTimeout. La cancelación devuelve la lista parcial etiquetada.
 */
async function enumerarCaminosSimplesJohnson(nodos, conexiones, origenId, destinoId, opciones) {
  const configuracion = opciones || {};
  function limite(nombre, predeterminado, maximo) {
    const valor = configuracion[nombre] === undefined ? predeterminado : configuracion[nombre];
    if (!Number.isSafeInteger(valor) || valor < 1) throw new Error(nombre + ' debe ser un entero positivo.');
    return Math.min(valor, maximo);
  }
  const maxRutas = limite('maxRutas', 30, 200);
  const maxTrabajo = limite('maxTrabajo', 10000, 100000);
  const cederCada = limite('cederCada', 200, 500);
  if (configuracion.cancelado !== undefined && typeof configuracion.cancelado !== 'function') throw new Error('cancelado debe ser una función.');
  if (configuracion.ceder !== undefined && typeof configuracion.ceder !== 'function') throw new Error('ceder debe ser una función.');

  if (!Array.isArray(nodos) || !Array.isArray(conexiones)) throw new Error('Se requieren listas de nodos y conexiones.');
  const ids = nodos.map(nodo => nodo && nodo.id);
  const posicion = new Map();
  ids.forEach((id, indice) => {
    if (typeof id !== 'string' || !id || posicion.has(id)) throw new Error('Los nodos deben tener identificadores únicos.');
    posicion.set(id, indice);
  });
  if (!posicion.has(origenId) || !posicion.has(destinoId)) throw new Error('El origen y el destino deben existir.');
  const salientes = ids.map(() => []);
  const idsConexiones = new Set();
  conexiones.forEach(conexion => {
    if (!conexion || typeof conexion.id !== 'string' || !conexion.id || idsConexiones.has(conexion.id)) throw new Error('Las conexiones deben tener identificadores únicos.');
    const desde = posicion.get(conexion.desde), hacia = posicion.get(conexion.hacia);
    if (desde === undefined || hacia === undefined) throw new Error('Una conexión referencia un nodo que no existe.');
    if (!Number.isFinite(conexion.valor)) throw new Error('El peso debe ser un número finito.');
    idsConexiones.add(conexion.id);
    salientes[desde].push({ id: conexion.id, desde: desde, hacia: hacia, peso: conexion.valor });
  });
  const resultado = {
    rutas: [],
    truncada: false,
    cancelada: false,
    motivo: null,
    trabajo: 0,
    limites: { rutas: maxRutas, trabajo: maxTrabajo },
    orden: 'profundidad'
  };
  const cancelado = () => Boolean((configuracion.signal && configuracion.signal.aborted) || (configuracion.cancelado && configuracion.cancelado()));
  const ceder = configuracion.ceder || (() => new Promise(resolve => setTimeout(resolve, 0)));
  function terminar(motivo) {
    resultado.truncada = true;
    resultado.motivo = motivo;
    resultado.cancelada = motivo === 'cancelacion';
    return resultado;
  }
  if (cancelado()) return terminar('cancelacion');
  // Permite pintar el estado «buscando» y atender cancelación antes de explorar.
  await ceder();
  const origen = posicion.get(origenId), destino = posicion.get(destinoId);
  const pila = [{ nodo: origen, siguiente: 0 }];
  const caminoNodos = [origen];
  const caminoAristas = [];
  const visitados = new Set([origen]);
  let ultimoTrabajoCedido = 0;
  function retroceder() {
    const marco = pila.pop();
    visitados.delete(marco.nodo);
    caminoNodos.pop();
    if (caminoAristas.length) caminoAristas.pop();
  }
  while (pila.length) {
    if (cancelado()) return terminar('cancelacion');
    if (resultado.trabajo - ultimoTrabajoCedido >= cederCada) {
      ultimoTrabajoCedido = resultado.trabajo;
      await ceder();
      if (cancelado()) return terminar('cancelacion');
    }
    const marco = pila[pila.length - 1];
    if (marco.nodo === destino) {
      // Buscar una ruta adicional antes de etiquetar el límite distingue una
      // lista completa de exactamente maxRutas de una búsqueda interrumpida.
      if (resultado.rutas.length >= maxRutas) return terminar('limite-rutas');
      const pesos = caminoAristas.map(arista => arista.peso);
      resultado.rutas.push({
        id: 'alternativa-' + (resultado.rutas.length + 1),
        nodos: caminoNodos.map(indice => ids[indice]),
        conexiones: caminoAristas.map(arista => arista.id),
        pesos: pesos,
        distancia: pesos.reduce((suma, peso) => suma + peso, 0)
      });
      retroceder();
      continue;
    }
    if (marco.siguiente >= salientes[marco.nodo].length) {
      retroceder();
      continue;
    }
    if (resultado.trabajo >= maxTrabajo) return terminar('limite-trabajo');
    const arista = salientes[marco.nodo][marco.siguiente++];
    resultado.trabajo++;
    if (visitados.has(arista.hacia)) continue;
    visitados.add(arista.hacia);
    caminoNodos.push(arista.hacia);
    caminoAristas.push(arista);
    pila.push({ nodo: arista.hacia, siguiente: 0 });
  }
  return resultado;
}
