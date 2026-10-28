/* Modelo puro de los editores independientes de Dijkstra y Kruskal. */
'use strict';

// Límites de esta interfaz, no límites matemáticos de los algoritmos.
const GRAFOS_MAX_NODOS = 24;
const GRAFOS_MAX_ARISTAS = 96;
const GRAFOS_ANCHO = 1000;
const GRAFOS_ALTO = 600;
const GRAFOS_MARGEN = 30;

function crearGrafoVacio(dirigido = true) {
  return { dirigido, nodos: [], conexiones: [], siguienteId: 1 };
}

function copiarGrafoModulo(grafo) {
  return {
    dirigido: grafo.dirigido,
    nodos: grafo.nodos.map(n => ({ id: n.id, nombre: n.nombre, x: n.x, y: n.y })),
    conexiones: grafo.conexiones.map(c => ({ id: c.id, desde: c.desde, hacia: c.hacia, valor: c.valor })),
    siguienteId: grafo.siguienteId
  };
}

function validarGrafoModulo(grafo, modulo) {
  const fallo = error => ({ ok: false, grafo: null, error });
  if (modulo !== 'dijkstra' && modulo !== 'kruskal') return fallo('Módulo de grafo desconocido.');
  if (!grafo || typeof grafo !== 'object' || Array.isArray(grafo)) return fallo('El grafo debe ser un objeto.');
  if (typeof grafo.dirigido !== 'boolean') return fallo('El modo dirigido debe ser verdadero o falso.');
  if (modulo === 'kruskal' && grafo.dirigido) return fallo('Kruskal requiere un grafo no dirigido.');
  if (!Array.isArray(grafo.nodos) || !Array.isArray(grafo.conexiones)) return fallo('Faltan las listas de nodos y conexiones.');
  if (grafo.nodos.length > GRAFOS_MAX_NODOS) return fallo(`El límite es ${GRAFOS_MAX_NODOS} nodos.`);
  if (grafo.conexiones.length > GRAFOS_MAX_ARISTAS) return fallo(`El límite es ${GRAFOS_MAX_ARISTAS} aristas.`);
  if (!Number.isSafeInteger(grafo.siguienteId) || grafo.siguienteId < 1 || grafo.siguienteId >= Number.MAX_SAFE_INTEGER) {
    return fallo('siguienteId debe ser un entero seguro positivo con margen para crear elementos.');
  }
  const ids = new Set();
  const nodos = new Set();
  const esId = id => typeof id === 'string' && id.length > 0 && id.length <= 80 && id.trim() === id;
  for (const nodo of grafo.nodos) {
    if (!nodo || !esId(nodo.id)) return fallo('Cada nodo necesita un ID de texto no vacío, de hasta 80 caracteres.');
    if (ids.has(nodo.id)) return fallo(`ID repetido: ${nodo.id}.`);
    ids.add(nodo.id);
    nodos.add(nodo.id);
    if (typeof nodo.nombre !== 'string' || !nodo.nombre.trim() || nodo.nombre.length > MAX_LARGO_NOMBRE) {
      return fallo(`Cada nombre debe tener entre 1 y ${MAX_LARGO_NOMBRE} caracteres.`);
    }
    if (!Number.isFinite(nodo.x) || !Number.isFinite(nodo.y) ||
        nodo.x < GRAFOS_MARGEN || nodo.x > GRAFOS_ANCHO - GRAFOS_MARGEN ||
        nodo.y < GRAFOS_MARGEN || nodo.y > GRAFOS_ALTO - GRAFOS_MARGEN) {
      return fallo('Las coordenadas deben estar dentro del lienzo: x de 30 a 970, y de 30 a 570.');
    }
  }
  const pares = new Set();
  for (const conexion of grafo.conexiones) {
    if (!conexion || !esId(conexion.id)) return fallo('Cada conexión necesita un ID de texto no vacío, de hasta 80 caracteres.');
    if (ids.has(conexion.id)) return fallo(`ID repetido: ${conexion.id}.`);
    ids.add(conexion.id);
    if (!nodos.has(conexion.desde) || !nodos.has(conexion.hacia)) return fallo('Una conexión apunta a un nodo que no existe.');
    if (conexion.desde === conexion.hacia) return fallo('Esta versión no admite bucles.');
    // JSON de la pareja evita colisiones si un ID contiene un separador.
    const pareja = grafo.dirigido ? [conexion.desde, conexion.hacia] : [conexion.desde, conexion.hacia].sort();
    const clave = JSON.stringify(pareja);
    if (pares.has(clave)) return fallo('Hay una arista duplicada entre los mismos nodos.');
    pares.add(clave);
    if (!Number.isSafeInteger(conexion.valor)) return fallo('El peso debe ser un número entero finito.');
    const minimo = modulo === 'dijkstra' ? 0 : -MAX_PESO;
    if (conexion.valor < minimo || conexion.valor > MAX_PESO) return fallo(`El peso debe estar entre ${minimo} y ${MAX_PESO}.`);
  }
  return { ok: true, grafo: copiarGrafoModulo(grafo), error: null };
}

/** Un solo validador para archivos, autoguardado y biblioteca de trabajos. */
function validarDocumentoGrafo(datos, modulo) {
  const fallo = error => ({ ok: false, datos: null, error });
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return fallo('El documento debe ser un objeto.');
  if (datos.version !== 1) return fallo('Versión de documento incompatible; se requiere la versión 1.');
  if (datos.modulo !== modulo || (modulo !== 'dijkstra' && modulo !== 'kruskal')) return fallo('El documento pertenece a otro módulo.');
  const comprobacion = validarGrafoModulo(datos.grafo, modulo);
  if (!comprobacion.ok) return fallo(comprobacion.error);
  const opcion = (clave, defecto) => Object.prototype.hasOwnProperty.call(datos, clave) ? datos[clave] : defecto;
  const origen = opcion('origen', null);
  const destino = opcion('destino', null);
  const objetivo = opcion('objetivo', 'min');
  const vista = opcion('vista', 'grafo');
  const paso = opcion('paso', 0);
  const resuelto = opcion('resuelto', false);
  const ids = new Set(comprobacion.grafo.nodos.map(n => n.id));
  if (origen !== null && (typeof origen !== 'string' || !ids.has(origen))) return fallo('El origen no corresponde a un nodo del grafo.');
  if (destino !== null && (typeof destino !== 'string' || !ids.has(destino))) return fallo('El destino no corresponde a un nodo del grafo.');
  if (objetivo !== 'min' && objetivo !== 'max') return fallo('El objetivo debe ser min o max.');
  if (!['grafo', 'configuracion', 'procedimiento', 'resultado'].includes(vista)) return fallo('La vista guardada no es válida.');
  if (!Number.isSafeInteger(paso) || paso < 0) return fallo('El paso debe ser un entero seguro no negativo.');
  if (typeof resuelto !== 'boolean') return fallo('El estado resuelto debe ser verdadero o falso.');
  if (resuelto && (!ids.size || (modulo === 'dijkstra' && origen === null))) return fallo('Un cálculo resuelto necesita datos y un origen válido en Dijkstra.');
  return { ok: true, datos: { version: 1, modulo, grafo: comprobacion.grafo, origen, destino, objetivo, vista, paso, resuelto }, error: null };
}

/** Ejemplos propios: no cargan ni modifican el estado de Johnson. */
function crearEjemploGrafo(modulo, nombre = 'obligatorio') {
  if (modulo !== 'dijkstra' && modulo !== 'kruskal') throw new Error('Módulo de grafo desconocido.');
  const dirigido = modulo === 'dijkstra';
  let nombres = dirigido ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  let conexiones = dirigido
    ? [['A', 'B', 4], ['A', 'C', 1], ['C', 'B', 2], ['B', 'D', 1], ['C', 'D', 5]]
    : [['A', 'B', 1], ['A', 'C', 4], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 3]];
  if (nombre === 'ceros') {
    nombres = ['A', 'B', 'C', 'D'];
    conexiones = dirigido
      ? [['A', 'B', 0], ['A', 'C', 0], ['B', 'D', 2], ['C', 'D', 2]]
      : [['A', 'B', -3], ['A', 'C', 0], ['B', 'C', 0], ['C', 'D', 2], ['B', 'D', 2]];
  } else if (nombre === 'desconectado') {
    nombres = ['A', 'B', 'C', 'D', 'E', 'F'];
    conexiones = dirigido ? [['A', 'B', 2], ['B', 'C', 0], ['D', 'E', 1]] : [['A', 'B', -2], ['B', 'C', 0], ['A', 'C', 3], ['D', 'E', 1]];
  } else if (nombre !== 'obligatorio') {
    throw new Error('Ejemplo de grafo desconocido.');
  }
  const nodos = nombres.map((nombreNodo, i) => {
    const angulo = -Math.PI / 2 + (2 * Math.PI * i / nombres.length);
    return { id: 'n' + (i + 1), nombre: nombreNodo, x: Math.round(500 + 355 * Math.cos(angulo)), y: Math.round(300 + 220 * Math.sin(angulo)) };
  });
  const porNombre = new Map(nodos.map(n => [n.nombre, n.id]));
  return {
    dirigido, nodos,
    conexiones: conexiones.map(([desde, hacia, valor], i) => ({ id: 'c' + (i + 1), desde: porNombre.get(desde), hacia: porNombre.get(hacia), valor })),
    siguienteId: nodos.length + conexiones.length + 1
  };
}

/** Generación acotada. No inventa enlaces para forzar conectividad. */
function generarGrafoAleatorio(modulo, opciones = {}) {
  if (modulo !== 'dijkstra' && modulo !== 'kruskal') throw new Error('Módulo de grafo desconocido.');
  const cantidad = opciones.cantidad === undefined ? 6 : opciones.cantidad;
  const dirigido = modulo === 'kruskal' ? false : (opciones.dirigido === undefined ? true : opciones.dirigido);
  if (typeof dirigido !== 'boolean') throw new Error('El modo dirigido no es válido.');
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > GRAFOS_MAX_NODOS) throw new Error(`Elige entre 1 y ${GRAFOS_MAX_NODOS} nodos.`);
  const maximo = Math.min(GRAFOS_MAX_ARISTAS, cantidad * (cantidad - 1) / (dirigido ? 1 : 2));
  const cantidadAristas = opciones.aristas === undefined ? Math.min(8, maximo) : opciones.aristas;
  if (!Number.isInteger(cantidadAristas) || cantidadAristas < 0 || cantidadAristas > maximo) throw new Error(`Para este grafo se admiten de 0 a ${maximo} aristas.`);
  let semilla = opciones.semilla === undefined ? null : opciones.semilla;
  if (semilla !== null && !Number.isSafeInteger(semilla)) throw new Error('La semilla debe ser un entero seguro.');
  const azar = typeof opciones.aleatorio === 'function' ? opciones.aleatorio : semilla === null ? Math.random : () => {
    semilla = (Math.imul(1664525, semilla >>> 0) + 1013904223) >>> 0;
    return semilla / 4294967296;
  };
  const nodos = Array.from({ length: cantidad }, (_, i) => {
    const angulo = -Math.PI / 2 + 2 * Math.PI * i / cantidad;
    return { id: 'n' + (i + 1), nombre: String.fromCharCode(65 + i), x: Math.round(500 + 400 * Math.cos(angulo)), y: Math.round(300 + 230 * Math.sin(angulo)) };
  });
  const pares = [];
  nodos.forEach((desde, i) => nodos.forEach((hacia, j) => {
    if (i !== j && (dirigido || i < j)) pares.push([desde.id, hacia.id]);
  }));
  for (let i = pares.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [pares[i], pares[j]] = [pares[j], pares[i]];
  }
  const conexiones = pares.slice(0, cantidadAristas).map(([desde, hacia], i) => ({
    id: 'c' + (i + 1), desde, hacia, valor: Math.floor(azar() * (modulo === 'kruskal' ? 30 : 21)) - (modulo === 'kruskal' ? 9 : 0)
  }));
  return { dirigido, nodos, conexiones, siguienteId: nodos.length + conexiones.length + 1 };
}
