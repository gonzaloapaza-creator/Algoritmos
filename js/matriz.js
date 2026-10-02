/* Matriz de adyacencia del grafo y resumen numérico. */

'use strict';

// Las constantes SIN_CONEXION ahora vienen de config.js

/**
 * Construye la matriz de adyacencia con los valores de las conexiones.
 * Las filas son el nodo de origen y las columnas el de destino, por eso
 * la matriz no es simétrica: a → b y b → a se guardan por separado.
 *
 * Una celda vale null cuando no hay conexión. Es distinto de 0, que ahora es
 * un peso válido: una conexión real que no cuesta nada recorrer.
 */
function construirMatriz() {
  const nodos = estado.nodos;
  const posicion = new Map();
  nodos.forEach((nodo, i) => posicion.set(nodo.id, i));

  const celdas = nodos.map(() => nodos.map(() => null));
  let suma = 0;

  estado.conexiones.forEach(conexion => {
    const fila = posicion.get(conexion.desde);
    const columna = posicion.get(conexion.hacia);
    // Una conexión hacia un nodo inexistente se ignora en lugar de romper la matriz.
    if (fila === undefined || columna === undefined) return;

    const actual = celdas[fila][columna];
    celdas[fila][columna] = (actual === null ? 0 : actual) + conexion.valor;
    suma += conexion.valor;
  });

  // Las celdas sin conexión no aportan nada a las sumas.
  const sumar = (total, valor) => total + (valor === null ? 0 : valor);
  const sumaFilas = celdas.map(fila => fila.reduce(sumar, 0));
  const sumaColumnas = nodos.map((_, c) => celdas.reduce((total, fila) => sumar(total, fila[c]), 0));

  // Un peso de 0 es una conexión real, pero no cuenta como "valor distinto de 0".
  const contar = (total, valor) => total + (valor !== null && valor !== 0 ? 1 : 0);
  const contarFilas = celdas.map(fila => fila.reduce(contar, 0));
  const contarColumnas = nodos.map((_, c) => celdas.reduce((total, fila) => contar(total, fila[c]), 0));
  const cantidad = contarFilas.reduce((total, valor) => total + valor, 0);

  return { nodos, celdas, suma, sumaFilas, sumaColumnas, cantidad, contarFilas, contarColumnas };
}

function crearCelda(etiqueta, texto, clases) {
  const celda = document.createElement(etiqueta);
  celda.textContent = texto;
  if (clases) celda.className = clases;
  return celda;
}

/**
 * thead, tbody y tfoot no son decorativos: permiten fijar la fila de cabecera
 * y la primera columna al desplazarse, sin que las filas de resumen se confundan
 * con la cabecera.
 *
 * El resumen numérico usa dos columnas (a la derecha) y dos filas (abajo)
 * independientes -"Σ Pesos" y "Cantidad ≠ 0"-, cada una con un solo número por
 * celda: el encabezado ya dice qué significa, así que no se repite como texto.
 */
function dibujarTablaMatriz(datos) {
  const tabla = document.createElement('table');

  const cabecera = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  filaCabecera.appendChild(crearCelda('th', '', 'esquina'));
  datos.nodos.forEach(nodo => filaCabecera.appendChild(crearCelda('th', nodo.nombre)));
  filaCabecera.appendChild(crearCelda('th', 'Σ Pesos', 'col-suma'));
  filaCabecera.appendChild(crearCelda('th', 'Cantidad ≠ 0', 'col-cantidad'));
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement('tbody');
  datos.nodos.forEach((nodo, f) => {
    const linea = document.createElement('tr');
    linea.appendChild(crearCelda('th', nodo.nombre, 'fila'));

    datos.celdas[f].forEach((valor, c) => {
      const clases = [];
      if (valor === null) {
        clases.push('sin-conexion');
      } else {
        clases.push('valor');
        if (valor < 0) clases.push('negativo');
      }
      if (f === c) clases.push('diagonal');
      linea.appendChild(crearCelda('td', valor === null ? SIN_CONEXION : String(valor), clases.join(' ')));
    });

    linea.appendChild(crearCelda('td', String(datos.sumaFilas[f]), 'col-suma'));
    linea.appendChild(crearCelda('td', String(datos.contarFilas[f]), 'col-cantidad'));
    cuerpo.appendChild(linea);
  });
  tabla.appendChild(cuerpo);

  const pie = document.createElement('tfoot');

  // Fila "Σ Pesos": una suma por columna, y el gran total en su propia columna.
  // La intersección con "Cantidad ≠ 0" no aplica y queda vacía.
  const filaSuma = document.createElement('tr');
  filaSuma.appendChild(crearCelda('th', 'Σ Pesos', 'fila col-suma'));
  datos.sumaColumnas.forEach(valor => filaSuma.appendChild(crearCelda('td', String(valor), 'col-suma')));
  filaSuma.appendChild(crearCelda('td', String(datos.suma), 'col-suma granTotal'));
  filaSuma.appendChild(crearCelda('td', '', 'celda-vacia'));
  pie.appendChild(filaSuma);

  // Fila "Cantidad ≠ 0": misma lógica, con el gran total en la otra esquina.
  const filaCantidad = document.createElement('tr');
  filaCantidad.appendChild(crearCelda('th', 'Cantidad ≠ 0', 'fila col-cantidad'));
  datos.contarColumnas.forEach(valor => filaCantidad.appendChild(crearCelda('td', String(valor), 'col-cantidad')));
  filaCantidad.appendChild(crearCelda('td', '', 'celda-vacia'));
  filaCantidad.appendChild(crearCelda('td', String(datos.cantidad), 'col-cantidad granTotal'));
  pie.appendChild(filaCantidad);

  tabla.appendChild(pie);

  return tabla;
}

/** Vuelve a generar la matriz de la vista «Matriz». */
function actualizarMatriz() {
  const datos = construirMatriz();

  el.matrizTabla.textContent = '';
  if (datos.nodos.length === 0) {
    el.matrizTabla.appendChild(
      crearCelda('p', 'Todavía no hay nodos: crea al menos uno para ver la matriz.', 'matriz-vacia')
    );
    return;
  }
  el.matrizTabla.appendChild(dibujarTablaMatriz(datos));
}
