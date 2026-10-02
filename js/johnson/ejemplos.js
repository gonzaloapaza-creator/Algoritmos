/* Grafos de ejemplo para Johnson. Sin DOM: se pueden cargar en Node.
 *
 * Las posiciones van en fracciones del área (0 a 1) y se convierten a píxeles al
 * cargar, así el ejemplo se ve completo en cualquier pantalla.
 */

'use strict';

const EJEMPLOS_JOHNSON = [
  {
    id: 'negativos',
    nombre: 'Pesos negativos (clásico)',
    descripcion: 'El ejemplo de los libros de texto: 5 nodos y varios pesos negativos sin ciclo negativo. Ideal para ver la reponderación.',
    nodos: [
      { nombre: 'a', x: 0.12, y: 0.50 },
      { nombre: 'b', x: 0.45, y: 0.14 },
      { nombre: 'c', x: 0.88, y: 0.30 },
      { nombre: 'd', x: 0.72, y: 0.86 },
      { nombre: 'e', x: 0.30, y: 0.86 }
    ],
    conexiones: [
      ['a', 'b', 3], ['a', 'c', 8], ['a', 'e', -4], ['b', 'd', 1], ['b', 'e', 7],
      ['c', 'b', 4], ['d', 'a', 2], ['d', 'c', -5], ['e', 'd', 6]
    ]
  },
  {
    id: 'positivos',
    nombre: 'Red de rutas (solo positivos)',
    descripcion: 'Seis puntos con distancias positivas. Los potenciales salen 0 y la reponderación no cambia nada.',
    nodos: [
      { nombre: 'A', x: 0.10, y: 0.55 },
      { nombre: 'B', x: 0.35, y: 0.15 },
      { nombre: 'C', x: 0.42, y: 0.55 },
      { nombre: 'D', x: 0.70, y: 0.18 },
      { nombre: 'E', x: 0.90, y: 0.62 },
      { nombre: 'F', x: 0.55, y: 0.88 }
    ],
    conexiones: [
      ['A', 'B', 7], ['A', 'C', 9], ['A', 'F', 14], ['B', 'C', 10], ['B', 'D', 15],
      ['C', 'D', 11], ['C', 'F', 2], ['D', 'E', 6], ['F', 'E', 9]
    ]
  },
  {
    id: 'inalcanzables',
    nombre: 'Nodos sin camino (∞)',
    descripcion: 'Dos grupos de nodos sin conexión entre ellos: varias distancias quedan en ∞.',
    nodos: [
      { nombre: 'a', x: 0.12, y: 0.25 },
      { nombre: 'b', x: 0.40, y: 0.15 },
      { nombre: 'c', x: 0.30, y: 0.78 },
      { nombre: 'd', x: 0.70, y: 0.40 },
      { nombre: 'e', x: 0.90, y: 0.80 }
    ],
    conexiones: [
      ['a', 'b', 3], ['b', 'c', -1], ['a', 'c', 4], ['c', 'a', 2], ['d', 'e', 2], ['e', 'd', 1], ['c', 'd', 5]
    ]
  },
  {
    id: 'ceros',
    nombre: 'Ceros y bucle',
    descripcion: 'Conexiones de peso 0 (que sí existen), un bucle a → a y un peso negativo.',
    nodos: [
      { nombre: 'a', x: 0.18, y: 0.62 },
      { nombre: 'b', x: 0.50, y: 0.22 },
      { nombre: 'c', x: 0.82, y: 0.62 },
      { nombre: 'd', x: 0.50, y: 0.88 }
    ],
    conexiones: [
      ['a', 'a', 2], ['a', 'b', 0], ['b', 'c', 0], ['c', 'a', 5], ['b', 'd', -2], ['d', 'c', 1]
    ]
  },
  {
    id: 'ciclo',
    nombre: 'Ciclo negativo',
    descripcion: 'a → b → c → a suma −1: no existen distancias mínimas y el algoritmo lo detecta.',
    nodos: [
      { nombre: 'a', x: 0.20, y: 0.25 },
      { nombre: 'b', x: 0.75, y: 0.25 },
      { nombre: 'c', x: 0.48, y: 0.80 },
      { nombre: 'd', x: 0.90, y: 0.80 }
    ],
    conexiones: [
      ['a', 'b', 1], ['b', 'c', -4], ['c', 'a', 2], ['b', 'd', 3]
    ]
  }
];

function ejemploJohnsonPorId(id) {
  return EJEMPLOS_JOHNSON.find(e => e.id === id) || null;
}

/**
 * Grafo listo para usar como estado a partir de un ejemplo.
 * @param {Object} ejemplo entrada de EJEMPLOS_JOHNSON
 * @param {number} ancho ancho del área en píxeles
 * @param {number} alto alto del área en píxeles
 * @param {number} radio radio de los nodos (margen mínimo con el borde)
 * @returns {{nodos:Array, conexiones:Array, siguienteId:number}}
 */
function grafoDeEjemploJohnson(ejemplo, ancho, alto, radio) {
  // Margen extra para que los bucles y las etiquetas no queden pegados al borde.
  const margen = radio * 2;
  const usableX = Math.max(0, ancho - margen * 2);
  const usableY = Math.max(0, alto - margen * 2);
  let siguiente = 1;
  const porNombre = new Map();

  const nodos = ejemplo.nodos.map(n => {
    const nodo = {
      id: 'n_' + (siguiente++),
      nombre: n.nombre,
      x: Math.round(margen + n.x * usableX),
      y: Math.round(margen + n.y * usableY)
    };
    porNombre.set(n.nombre, nodo.id);
    return nodo;
  });

  const conexiones = ejemplo.conexiones.map(([desde, hacia, valor]) => ({
    id: 'c_' + (siguiente++),
    desde: porNombre.get(desde),
    hacia: porNombre.get(hacia),
    valor: valor
  }));

  return { nodos: nodos, conexiones: conexiones, siguienteId: siguiente };
}
