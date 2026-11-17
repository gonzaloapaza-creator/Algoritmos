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

/** Los nombres y las posiciones no cambian el problema matemático. */
function firmaCalculoGrafo(grafo) {
  return JSON.stringify({ dirigido: grafo.dirigido,
    nodos: grafo.nodos.map(n => n.id),
    conexiones: grafo.conexiones.map(c => [c.id, c.desde, c.hacia, c.valor]) });
}

/** Reglas compartidas de la interfaz y las operaciones; siempre devuelve una copia válida. */
function validarPesoGrafoModulo(texto, modulo) {
  const limpio = String(texto).trim(), minimo = 0;
  if (!/^-?\d+$/.test(limpio) || !Number.isSafeInteger(Number(limpio)) || Number(limpio) < minimo || Number(limpio) > MAX_PESO) {
    return { ok: false, error: Number(limpio) < 0
      ? 'Este módulo admite pesos no negativos por política del producto. Cero sí es válido.'
      : `Escribe un entero entre ${minimo} y ${MAX_PESO}.` };
  }
  return { ok: true, valor: Number(limpio) };
}

function normalizarNombreNodoGrafo(nombre) {
  return String(nombre).trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

// Los nombres antiguos se conservan. Solo las altas y los cambios de nombre
// deben ser únicos; mover o corregir otro nodo sigue siendo posible.
function validarNombresEditadosGrafo(anterior, nuevo) {
  for (const n of nuevo.nodos) {
    const previo = anterior.nodos.find(p => p.id === n.id);
    if (previo && previo.nombre === n.nombre) continue;
    if (nuevo.nodos.some(p => p.id !== n.id && normalizarNombreNodoGrafo(p.nombre) === normalizarNombreNodoGrafo(n.nombre))) {
      return { ok: false, error: 'Nombre duplicado. Se ignoran mayúsculas y espacios repetidos o exteriores.' };
    }
  }
  return { ok: true };
}

function etiquetaNodoGrafo(grafo, id) {
  const nodo = grafo.nodos.find(n => n.id === id);
  if (!nodo) return '—';
  if (!grafo.nodos.some(n => n.id !== id && normalizarNombreNodoGrafo(n.nombre) === normalizarNombreNodoGrafo(nodo.nombre))) return nodo.nombre;
  const breve = clave => {
    let hash = 2166136261;
    for (const letra of clave) hash = Math.imul(hash ^ letra.charCodeAt(0), 16777619);
    return (hash >>> 0).toString(36);
  };
  const marca = id.length <= 8 ? id : breve(id);
  const colision = grafo.nodos.some(n => n.id !== id && (n.id.length <= 8 ? n.id : breve(n.id)) === marca);
  return nodo.nombre + ' [' + (colision ? id : marca) + ']';
}

function siguienteIdGrafoModulo(grafo, prefijo) {
  const ids = new Set(grafo.nodos.concat(grafo.conexiones).map(e => e.id));
  let id;
  do { id = prefijo + grafo.siguienteId++; } while (ids.has(id));
  return id;
}

function operarGrafoModulo(grafo, modulo, operacion) {
  if (!operacion || typeof operacion !== 'object') return { ok: false, grafo: null, error: 'La operación debe ser un objeto.' };
  const base = validarGrafoModulo(grafo, modulo);
  if (!base.ok) return base;
  const g = base.grafo;
  const fallo = error => ({ ok: false, grafo: null, error });
  const nodo = g.nodos.find(n => n.id === operacion.id);
  const arista = g.conexiones.find(c => c.id === operacion.id);
  if (['renombrar', 'mover', 'eliminar-nodo'].includes(operacion.tipo) && !nodo) return fallo('El vértice seleccionado ya no existe.');
  if (['peso', 'eliminar-arista'].includes(operacion.tipo) && !arista) return fallo('La conexión seleccionada ya no existe.');
  let id = operacion.id;
  switch (operacion.tipo) {
    case 'nodo':
      id = siguienteIdGrafoModulo(g, 'n');
      g.nodos.push({ id, nombre: String(operacion.nombre || '').trim(), x: operacion.x, y: operacion.y }); break;
    case 'renombrar': nodo.nombre = String(operacion.nombre || '').trim(); break;
    case 'mover': Object.assign(nodo, { x: operacion.x, y: operacion.y }); break;
    case 'eliminar-nodo':
      g.nodos = g.nodos.filter(n => n.id !== id);
      g.conexiones = g.conexiones.filter(c => c.desde !== id && c.hacia !== id); break;
    case 'arista':
    case 'peso': {
      const peso = validarPesoGrafoModulo(operacion.valor, modulo);
      if (!peso.ok) return fallo(peso.error);
      if (operacion.tipo === 'peso') arista.valor = peso.valor;
      else { id = siguienteIdGrafoModulo(g, 'e'); g.conexiones.push({ id, desde: operacion.desde, hacia: operacion.hacia, valor: peso.valor }); }
      break;
    }
    case 'eliminar-arista': g.conexiones = g.conexiones.filter(c => c.id !== id); break;
    default: return fallo('Operación de grafo desconocida.');
  }
  const nombres = validarNombresEditadosGrafo(grafo, g);
  if (!nombres.ok) return fallo(nombres.error);
  const resultado = validarGrafoModulo(g, modulo);
  if (resultado.ok) resultado.id = id;
  return resultado;
}

/** Cambiar de dirección exige resolver todos los conflictos antes de publicar la copia. */
function convertirDireccionGrafoModulo(grafo, modulo, dirigido, pesos = {}) {
  const validacion = validarGrafoModulo(grafo, modulo);
  if (!validacion.ok) return validacion;
  const g = validacion.grafo;
  if (typeof dirigido !== 'boolean') return { ok: false, grafo: null, error: 'El modo dirigido debe ser verdadero o falso.' };
  if (modulo === 'kruskal' && dirigido) return { ok: false, grafo: null, error: 'Kruskal requiere un grafo no dirigido.' };
  if (g.dirigido === dirigido) return validacion;
  if (dirigido) {
    const originales = g.conexiones.slice();
    originales.forEach(c => g.conexiones.push({ id: siguienteIdGrafoModulo(g, 'e'), desde: c.hacia, hacia: c.desde, valor: c.valor }));
  } else {
    const nuevas = [], usados = new Set();
    for (const c of g.conexiones) {
      if (usados.has(c.id)) continue;
      const opuesta = g.conexiones.find(a => a.desde === c.hacia && a.hacia === c.desde);
      let valor = c.valor;
      if (opuesta && opuesta.valor !== c.valor) {
        if (!Object.prototype.hasOwnProperty.call(pesos, c.id)) return { ok: false, grafo: null, error: 'Resuelve los pesos opuestos antes de cambiar a no dirigido.' };
        const peso = validarPesoGrafoModulo(pesos[c.id], modulo);
        if (!peso.ok) return { ok: false, grafo: null, error: peso.error };
        valor = peso.valor;
      }
      nuevas.push(Object.assign({}, c, { valor })); usados.add(c.id); if (opuesta) usados.add(opuesta.id);
    }
    g.conexiones = nuevas;
  }
  g.dirigido = dirigido;
  return validarGrafoModulo(g, modulo);
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
    if (conexion.desde === conexion.hacia) return fallo('Conexión consigo mismo: no se admiten bucles propios.');
    // JSON de la pareja evita colisiones si un ID contiene un separador.
    const pareja = grafo.dirigido ? [conexion.desde, conexion.hacia] : [conexion.desde, conexion.hacia].sort();
    const clave = JSON.stringify(pareja);
    if (pares.has(clave)) return fallo('Hay una arista duplicada entre los mismos nodos.');
    pares.add(clave);
    if (!Number.isSafeInteger(conexion.valor)) return fallo('El peso debe ser un número entero finito.');
    const minimo = 0;
    if (conexion.valor < minimo || conexion.valor > MAX_PESO) return fallo(conexion.valor < 0
      ? `La conexión ${conexion.id} tiene peso negativo (${conexion.valor}). La política actual admite enteros de 0 a ${MAX_PESO}. Se conserva el original; corrige una copia del trabajo antes de cargar. El ejercicio activo no se reemplaza.`
      : `El peso debe estar entre ${minimo} y ${MAX_PESO}.`);
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
function catalogoEjemplosGrafo(modulo) {
  if (modulo === 'dijkstra') return [
    { id: 'atajo', nombre: 'Básico · El atajo aparente', descripcion: 'Compara un enlace directo con tres tramos de menor costo. Menos tramos no significa menor suma.', origen: 'n1', destino: 'n4', observar: 'Sigue cómo cambia el costo de llegar a D al descubrir la ruta por B y C. Después compara Mínimo con Máximo: este grafo dirigido no tiene ciclos.' },
    { id: 'mejoras', nombre: 'Intermedio · Una distancia puede mejorar', descripcion: 'Una ruta descubierta primero puede ser sustituida. Observa cómo cambian las distancias y los predecesores.', origen: 'n1', destino: 'n5', observar: 'En Paso a paso, B y D mejoran al llegar desde C y B; E vuelve a mejorar al pasar por D. Una distancia provisional todavía puede cambiar.' },
    { id: 'campus', nombre: 'Aplicado · Caminos de un campus', descripcion: 'Busca de Entrada a Biblioteca y compara caminos en metros. Las conexiones se pueden recorrer en ambos sentidos.', origen: 'n1', destino: 'n4', observar: 'Compara pasar por Patio y Bloque con las conexiones más directas. Puedes cambiar el origen a Biblioteca para comprobar el regreso. Datos didácticos en metros; Máximo requiere un grafo dirigido sin ciclos.' },
    { id: 'direcciones', nombre: 'Intermedio · Las flechas importan', descripcion: 'Un punto puede estar conectado y aun así no ser alcanzable. Sigue el sentido de cada flecha.', origen: 'n1', destino: 'n3', observar: 'Desde A se llega a C, pero no a D: la conexión sale de D hacia B. Consulta D y luego prueba D como origen; sus destinos alcanzables cambian.' },
    { id: 'ceros', nombre: 'Especial · Costo cero y rutas empatadas', descripcion: 'Cero es una conexión real. Dos rutas a D tienen el mismo costo; el módulo conserva la primera que encuentra.', origen: 'n1', destino: 'n4', observar: 'Compara A→B→D con A→C→D. Ambas suman lo mismo y B y C quedan a costo cero desde A. Se muestra una ruta óptima, sin afirmar que sea la única.' },
    { id: 'referencia-clase', nombre: 'Referencia de clase', descripcion: 'Compara la ruta mínima de cuatro aristas con la máxima de dos aristas, desde A hasta D.', origen: 'n1', destino: 'n4', observar: 'Minimizar: A→C→E→B→D suma 101. Maximizar: A→E→D suma 121. Cambia el objetivo y calcula para contrastar las dos rutas y su procedimiento.' }
  ];
  return [
    { id: 'obligatorio', nombre: 'Básico · Caso de clase', descripcion: 'Observa cómo se acepta una conexión entre grupos y se descarta la que cierra un ciclo.' },
    { id: 'ceros', nombre: 'Especial · Ceros y redes empatadas', descripcion: 'Cero es un peso válido. Los empates conservan el orden de las conexiones.' },
    { id: 'desconectado', nombre: 'Especial · Grupos separados y un aislado', descripcion: 'Obtén un bosque de tres componentes: cada grupo tiene su subtotal y el aislado aporta cero.' },
    { id: 'cableado', nombre: 'Intermedio · Cableado entre edificios', descripcion: 'Conecta todos los edificios. Mínimo y máximo se aplican a la suma de toda la red, no a una ruta.' },
    { id: 'optimos', nombre: 'Especial · Varias redes óptimas', descripcion: 'Un circuito de cuatro enlaces iguales ofrece varios árboles mínimos. Observa el desempate y el descarte por ciclo.' },
    { id: 'referencia-clase', nombre: 'Referencia de clase', descripcion: 'Cuatro conexiones: el árbol mínimo suma 10 y el máximo 13. Hay dos árboles mínimos por el empate de peso 5.' }
  ];
}

function crearEjemploGrafo(modulo, nombre = 'obligatorio') {
  if (modulo !== 'dijkstra' && modulo !== 'kruskal') throw new Error('Módulo de grafo desconocido.');
  let dirigido = modulo === 'dijkstra';
  let nombres = dirigido ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  let conexiones = dirigido
    ? [['A', 'B', 4], ['A', 'C', 1], ['C', 'B', 2], ['B', 'D', 1], ['C', 'D', 5]]
    : [['A', 'B', 1], ['A', 'C', 4], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 3]];
  if (nombre === 'referencia-clase') {
    nombres = dirigido ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    conexiones = dirigido ? [['A', 'C', 23], ['A', 'E', 52], ['C', 'E', 23], ['E', 'B', 23], ['E', 'D', 69], ['B', 'D', 32]]
      : [['A', 'B', 2], ['C', 'D', 3], ['A', 'C', 5], ['B', 'D', 5]];
  } else if (nombre === 'ceros') {
    nombres = ['A', 'B', 'C', 'D'];
    conexiones = dirigido
      ? [['A', 'B', 0], ['A', 'C', 0], ['B', 'D', 2], ['C', 'D', 2]]
      : [['A', 'B', 0], ['A', 'C', 0], ['B', 'C', 0], ['C', 'D', 2], ['B', 'D', 2]];
  } else if (nombre === 'desconectado') {
    nombres = ['A', 'B', 'C', 'D', 'E', 'F'];
    conexiones = dirigido ? [['A', 'B', 2], ['B', 'C', 0], ['D', 'E', 1]] : [['A', 'B', 2], ['B', 'C', 0], ['A', 'C', 3], ['D', 'E', 1]];
  } else if (dirigido && nombre === 'inalcanzable') {
    nombres = ['A', 'B', 'C']; conexiones = [['A', 'B', 2]];
  } else if (dirigido && nombre === 'ciclico') {
    nombres = ['A', 'B', 'C']; conexiones = [['A', 'B', 2], ['B', 'A', 1], ['B', 'C', 3]];
  } else if (modulo === 'dijkstra' && nombre === 'atajo') {
    nombres = ['A', 'B', 'C', 'D']; conexiones = [['A', 'B', 2], ['B', 'C', 2], ['C', 'D', 2], ['A', 'D', 9]];
  } else if (modulo === 'dijkstra' && nombre === 'mejoras') {
    nombres = ['A', 'B', 'C', 'D', 'E'];
    conexiones = [['A', 'B', 8], ['A', 'C', 2], ['C', 'B', 1], ['B', 'D', 2], ['C', 'D', 7], ['D', 'E', 3], ['B', 'E', 10]];
  } else if (modulo === 'dijkstra' && nombre === 'direcciones') {
    nombres = ['A', 'B', 'C', 'D']; conexiones = [['A', 'B', 2], ['B', 'C', 3], ['D', 'B', 1]];
  } else if (modulo === 'dijkstra' && nombre === 'campus') {
    dirigido = false; nombres = ['Entrada', 'Patio', 'Bloque', 'Biblioteca'];
    conexiones = [['Entrada', 'Patio', 20], ['Entrada', 'Bloque', 50], ['Patio', 'Bloque', 15], ['Patio', 'Biblioteca', 70], ['Bloque', 'Biblioteca', 25]];
  } else if (modulo === 'kruskal' && nombre === 'cableado') {
    conexiones = [['A', 'B', 2], ['A', 'C', 6], ['B', 'C', 3], ['B', 'D', 7], ['C', 'D', 4], ['A', 'D', 9]];
  } else if (modulo === 'kruskal' && nombre === 'optimos') {
    conexiones = [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'A', 1], ['A', 'C', 4]];
  } else if (nombre !== 'obligatorio') {
    throw new Error('Ejemplo de grafo desconocido.');
  }
  // Los ejemplos de aprendizaje usan una disposición sin cruces de aristas.
  // Los casos antiguos siguen disponibles como documentos y datos de regresión.
  const disposicionesDijkstra = {
    atajo: [[150, 380], [350, 100], [650, 100], [850, 380]],
    mejoras: [[250, 70], [250, 300], [700, 70], [700, 300], [475, 550]],
    campus: [[250, 50], [700, 50], [250, 550], [700, 550]],
    direcciones: [[150, 280], [470, 280], [830, 100], [830, 480]],
    ceros: [[150, 300], [500, 100], [500, 500], [850, 300]],
    'referencia-clase': [[200, 550], [800, 50], [200, 50], [800, 550], [500, 300]]
  };
  const posiciones = modulo === 'dijkstra' ? disposicionesDijkstra[nombre] : nombre === 'referencia-clase' ? [[140, 110], [860, 110], [140, 490], [860, 490]] : null;
  const nodos = nombres.map((nombreNodo, i) => {
    const angulo = -Math.PI / 2 + (2 * Math.PI * i / nombres.length);
    return { id: 'n' + (i + 1), nombre: nombreNodo, x: posiciones ? posiciones[i][0] : Math.round(500 + 355 * Math.cos(angulo)), y: posiciones ? posiciones[i][1] : Math.round(300 + 220 * Math.sin(angulo)) };
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
    id: 'c' + (i + 1), desde, hacia, valor: Math.floor(azar() * 21)
  }));
  return { dirigido, nodos, conexiones, siguienteId: nodos.length + conexiones.length + 1 };
}
