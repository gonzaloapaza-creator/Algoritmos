/* Conocimiento matemático general: matrices, grafos y conceptos básicos de
 * algoritmos. No describe controles de la aplicación; eso está en aplicacion.js. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  K.registrar([
    /* ---------------- Matrices ---------------- */
    {
      id: 'matriz.que-es', tema: 'matrices', modulos: ['johnson', 'asignacion', 'northwest'],
      pregunta: '¿Qué es una matriz?',
      variantes: ['que es una matriz', 'para que sirve una matriz', 'matriz definicion', 'explicame las matrices', 'que son las matrices'],
      conceptos: ['matriz', 'matrices', 'tabla'],
      breve: 'Una matriz es una tabla de números ordenada en filas y columnas. Sirve para guardar muchos datos relacionados en un solo lugar y leer cualquiera de ellos por su posición.',
      sencilla: 'Piensa en una hoja cuadriculada: cada casilla guarda un número. Para encontrar uno, indicas su fila (hacia abajo) y su columna (hacia la derecha).',
      ejemplo: 'Una matriz de 2 filas y 3 columnas:\n[ 4  7  1 ]\n[ 0  5  9 ]\nEl número de la fila 2 y la columna 3 es 9.',
      detalle: 'En esta aplicación las matrices guardan relaciones entre pares: distancias entre vértices (Johnson), costos recurso–tarea (Asignación) o costos origen–destino (Esquina noroeste). Cada fila corresponde a un elemento de un grupo y cada columna a uno del otro.',
      relacionadas: ['matriz.fila-columna-celda', 'matriz.dimension', 'matriz.leer-posicion', 'matriz.adyacencia', 'matriz.costos']
    },
    {
      id: 'matriz.fila-columna-celda', tema: 'matrices', modulos: ['johnson', 'asignacion', 'northwest'],
      pregunta: '¿Qué son fila, columna y celda?',
      variantes: ['que es una fila', 'que es una columna', 'que es una celda', 'diferencia entre fila y columna', 'que es una casilla', 'fila y columna de una matriz'],
      variantesAutorizadas: ['que es una fila y una columna'],
      conceptos: ['fila', 'filas', 'columna', 'columnas', 'celda', 'celdas', 'casilla', 'casillas'],
      breve: 'Una fila es una línea horizontal de la matriz; una columna es una línea vertical; una celda (o casilla) es el cruce de una fila con una columna y contiene un solo valor.',
      sencilla: 'Las filas se leen de izquierda a derecha, como renglones. Las columnas van de arriba hacia abajo. Donde se cruzan hay una casilla con un número.',
      ejemplo: 'En la tabla de Esquina noroeste, cada fila es un origen (por ejemplo, una fábrica) y cada columna un destino (una tienda). La celda donde se cruzan guarda el costo de enviar una unidad de esa fábrica a esa tienda.',
      relacionadas: ['matriz.que-es', 'matriz.indice', 'matriz.leer-posicion']
    },
    {
      id: 'matriz.dimension', tema: 'matrices', modulos: ['johnson', 'asignacion', 'northwest'],
      pregunta: '¿Qué es la dimensión de una matriz?',
      variantes: ['que significa matriz 2x3', 'como se lee una matriz 2 por 3', 'que es el tamano de una matriz', 'dimension de la matriz', 'que es una matriz de 3x3'],
      conceptos: ['dimension', 'tamano', '2x3', '3x3', 'orden'],
      breve: 'La dimensión indica cuántas filas y cuántas columnas tiene la matriz, en ese orden. Una matriz 2×3 tiene 2 filas y 3 columnas, es decir, 6 celdas.',
      sencilla: 'Primero se dice el número de renglones y después el de columnas. «2 por 3» significa dos renglones con tres números cada uno.',
      ejemplo: 'Matriz 2×3:\n[ a  b  c ]\n[ d  e  f ]\nTiene 2 filas (a b c, d e f) y 3 columnas (a d, b e, c f).',
      detalle: 'En Asignación, la dimensión es recursos × tareas; en Esquina noroeste, orígenes × destinos. Si ambos números coinciden la matriz es cuadrada; si no, es rectangular.',
      relacionadas: ['matriz.cuadrada-rectangular', 'matriz.que-es']
    },
    {
      id: 'matriz.indice', tema: 'matrices', modulos: ['johnson', 'asignacion', 'northwest', 'ordenamiento'],
      pregunta: '¿Qué es un índice?',
      variantes: ['que es el indice de una matriz', 'que significa indice', 'que es la posicion de un elemento', 'indice de una lista'],
      conceptos: ['indice', 'indices', 'posicion', 'subindice'],
      breve: 'Un índice es el número que señala la posición de un elemento. En una matriz se usan dos: el de la fila y el de la columna; en una lista, solo uno.',
      sencilla: 'Es como el número de asiento: te dice exactamente dónde está algo sin tener que mirarlo todo.',
      ejemplo: 'En la lista [8, 3, 5], el valor 3 está en la posición 2 si contamos desde 1. Muchos programas cuentan desde 0; en esta aplicación las posiciones que se muestran al usuario comienzan en 1.',
      ejemploAutorizado: 'En la lista [8, 3, 5], contando desde 0, el valor 3 tiene índice 1. En Shell, un grupo con índices 0, 4 y 8 reúne esas posiciones reales de la lista, aunque no sean vecinas.',
      relacionadas: ['matriz.fila-columna-celda', 'matriz.leer-posicion']
    },
    {
      id: 'matriz.leer-posicion', tema: 'matrices', modulos: ['johnson', 'asignacion', 'northwest'],
      pregunta: '¿Cómo leo una posición concreta de la matriz?',
      variantes: ['como se lee una celda', 'como encuentro un valor en la matriz', 'como leer la matriz', 'que valor hay en la fila y columna', 'como interpreto una celda'],
      conceptos: ['leer', 'lectura', 'posicion', 'celda', 'valor'],
      breve: 'Busca la fila del primer elemento, avanza hasta la columna del segundo y lee el valor en el cruce. El orden importa: fila primero, columna después.',
      sencilla: 'Pon un dedo en el nombre de la fila (a la izquierda) y otro en el nombre de la columna (arriba). Donde se juntan está el dato.',
      ejemplo: 'En la matriz de distancias de Johnson, la fila es el origen y la columna el destino. La celda (A, C) dice cuánto cuesta ir de A a C; la celda (C, A), cuánto cuesta volver, y puede ser distinta.',
      detalle: 'En Johnson puedes seleccionar la celda para ver su ruta. En Asignación, tocar una pareja la resalta en el grafo y en la lista. En Esquina noroeste, la casilla muestra el costo unitario y, tras resolver, la cantidad asignada.',
      relacionadas: ['matriz.fila-columna-celda', 'matriz.distancias', 'johnson.interpretar-matriz']
    },
    {
      id: 'matriz.cuadrada-rectangular', tema: 'matrices', modulos: ['johnson', 'asignacion', 'northwest'],
      pregunta: '¿Qué diferencia hay entre matriz cuadrada y rectangular?',
      variantes: ['que es una matriz cuadrada', 'que es una matriz rectangular', 'matriz cuadrada vs rectangular', 'cuando una matriz es cuadrada'],
      conceptos: ['cuadrada', 'rectangular', 'cuadrado', 'rectangulo'],
      breve: 'Una matriz cuadrada tiene la misma cantidad de filas que de columnas (3×3, 5×5). Una rectangular tiene cantidades distintas (2×4, 5×3).',
      ejemplo: 'La matriz de distancias de Johnson siempre es cuadrada porque compara cada vértice con todos, incluido él mismo. Una matriz de Asignación con 3 recursos y 5 tareas es rectangular.',
      detalle: 'El método húngaro trabaja con matrices cuadradas: cuando la tuya es rectangular, la aplicación añade filas o columnas ficticias con valor cero para cuadrarla. Esos elementos ficticios representan recursos o tareas que quedarán sin asignar.',
      relacionadas: ['matriz.dimension', 'asignacion.rectangular', 'asignacion.ficticios']
    },
    {
      id: 'matriz.diagonal', tema: 'matrices', modulos: ['johnson'],
      pregunta: '¿Qué es la diagonal principal?',
      variantes: ['que significa la diagonal', 'por que la diagonal tiene ceros', 'diagonal de la matriz', 'que es la diagonal de una matriz'],
      conceptos: ['diagonal', 'principal'],
      breve: 'La diagonal principal son las celdas donde el número de fila coincide con el de columna: (1,1), (2,2), (3,3)… En una matriz de distancias contiene la distancia de cada vértice a sí mismo, que es 0.',
      sencilla: 'Es la línea de casillas que va desde la esquina superior izquierda hasta la inferior derecha.',
      ejemplo: '[ 0  4  7 ]\n[ 2  0  1 ]\n[ 5  3  0 ]\nLos tres ceros forman la diagonal principal.',
      detalle: 'En Johnson la diagonal vale 0 porque no hace falta moverse para llegar al mismo vértice. Si existiera un ciclo negativo, el algoritmo lo detecta antes y no produce esa matriz.',
      relacionadas: ['matriz.distancias', 'matriz.transpuesta-simetria', 'johnson.ciclo-negativo']
    },
    {
      id: 'matriz.transpuesta-simetria', tema: 'matrices', modulos: ['johnson', 'kruskal', 'dijkstra'],
      pregunta: '¿Qué son la transpuesta y la simetría de una matriz?',
      variantes: ['que es la matriz transpuesta', 'que es una matriz simetrica', 'por que la matriz no es simetrica', 'que significa simetria en la matriz'],
      conceptos: ['transpuesta', 'simetrica', 'simetria', 'simetrico'],
      breve: 'La transpuesta se obtiene intercambiando filas por columnas. Una matriz es simétrica cuando coincide con su transpuesta: la celda (i, j) es igual a la (j, i).',
      sencilla: 'Simétrica significa que da igual leer «de A a B» que «de B a A»: el valor es el mismo.',
      ejemplo: 'La matriz de un grafo no dirigido es simétrica: la conexión A–B pesa lo mismo en ambos sentidos. En un grafo dirigido puede no serlo: A→B pesa 4 y B→A no existe (∞).',
      detalle: 'En Johnson la matriz de distancias suele no ser simétrica porque el grafo es dirigido. En Kruskal el grafo es no dirigido, así que cualquier matriz que lo represente sería simétrica.',
      relacionadas: ['grafo.dirigido-no-dirigido', 'matriz.adyacencia']
    },
    {
      id: 'matriz.adyacencia', tema: 'matrices', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué es una matriz de adyacencia?',
      variantes: ['que es la matriz de adyacencia', 'para que sirve la matriz de adyacencia', 'como se representa un grafo con una matriz', 'matriz de adyacencia de un grafo'],
      conceptos: ['adyacencia', 'adyacente', 'adyacentes', 'representacion'],
      breve: 'Es una matriz cuadrada que representa un grafo: cada fila y cada columna es un vértice, y la celda (A, B) indica si existe conexión de A a B y, si tiene peso, cuánto vale.',
      sencilla: 'Es la «lista de vecinos» escrita en forma de tabla. Si en la casilla A–B hay un número, A está conectado con B.',
      ejemplo: 'Grafo con A→B peso 3 y B→C peso 2:\n      A    B    C\nA  [  —    3    —  ]\nB  [  —    —    2  ]\nC  [  —    —    —  ]\nEl guion significa que no hay conexión directa.',
      detalle: 'En Johnson, la pestaña Matriz muestra los pesos directos del grafo que dibujaste. No confundirla con la matriz de resultado, que contiene distancias mínimas, es decir, el mejor camino aunque pase por otros vértices.',
      relacionadas: ['matriz.distancias', 'grafo.lista-vs-matriz', 'matriz.cero-vacio-infinito'],
      comparar: { 'matriz.distancias': 'La matriz de adyacencia guarda los pesos de las conexiones directas que existen en el grafo. La matriz de distancias guarda el costo del mejor camino entre cada par, que puede pasar por varios vértices. La primera es un dato de entrada; la segunda, un resultado.' }
    },
    {
      id: 'matriz.costos', tema: 'matrices', modulos: ['asignacion', 'northwest'],
      pregunta: '¿Qué es una matriz de costos?',
      variantes: ['que es la matriz de costos', 'que significa la matriz de costos', 'para que sirve la matriz de costos', 'matriz de costo', 'matriz de beneficios'],
      conceptos: ['costos', 'costo', 'coste', 'beneficio', 'beneficios'],
      breve: 'Es una matriz donde cada celda indica cuánto cuesta (o cuánto beneficia) emparejar el elemento de su fila con el de su columna. Es el dato de entrada de Asignación y de Esquina noroeste.',
      sencilla: 'Cada casilla responde «¿cuánto cuesta esta combinación?». Las filas son una cosa (personas, fábricas) y las columnas otra (tareas, tiendas).',
      ejemplo: 'Dos personas y dos tareas:\n          Tarea 1   Tarea 2\nAna     [   5         8   ]\nLuis    [   6         4   ]\nAna tarda 5 en la tarea 1; Luis tarda 4 en la tarea 2.',
      detalle: 'En Asignación cada valor es el costo (o beneficio) de una pareja y se elige una celda por fila y columna. En Esquina noroeste el valor es el costo por unidad transportada, y en la celda se envían varias unidades; el costo total multiplica cantidad por costo unitario.',
      relacionadas: ['matriz.asignaciones', 'asignacion.costos-beneficios', 'northwest.costo-unitario'],
      comparar: { 'matriz.asignaciones': 'La matriz de costos es la entrada: dice cuánto vale cada combinación. La matriz de asignaciones (o de cantidades) es la salida: dice qué combinaciones se eligieron o cuántas unidades se envían por cada celda. No se deben confundir aunque tengan la misma forma.' }
    },
    {
      id: 'matriz.distancias', tema: 'matrices', modulos: ['johnson', 'dijkstra'],
      pregunta: '¿Qué es una matriz de distancias?',
      variantes: ['que es la matriz de distancias', 'que significa la matriz de distancias', 'como leo la matriz de distancias', 'matriz de distancias minimas'],
      conceptos: ['distancias', 'distancia', 'minimas'],
      breve: 'Es una matriz cuadrada cuya celda (A, B) guarda la distancia mínima para ir de A a B, es decir, el costo del mejor camino, no solo el de la conexión directa.',
      sencilla: 'Responde «¿cuál es la forma más barata de llegar de aquí a allá?» para cada pareja de vértices.',
      ejemplo: 'Si A→B pesa 10 y existe A→C→B con 3 + 4 = 7, la matriz de distancias pone 7 en (A, B), porque es el mejor camino.',
      detalle: 'En Johnson la produce el resultado final: la diagonal vale 0 y ∞ marca pares sin camino. En Dijkstra solo se calcula una fila de esa matriz: las distancias desde el origen elegido.',
      relacionadas: ['matriz.adyacencia', 'matriz.diagonal', 'matriz.cero-vacio-infinito', 'johnson.interpretar-matriz']
    },
    {
      id: 'matriz.asignaciones', tema: 'matrices', modulos: ['asignacion', 'northwest'],
      pregunta: '¿Qué es una matriz de asignaciones?',
      variantes: ['que es la matriz de asignaciones', 'que es la matriz de cantidades', 'que significan las cantidades en la tabla', 'matriz de resultado de transporte', 'matriz de envios'],
      conceptos: ['asignaciones', 'cantidades', 'cantidad', 'envios', 'envio'],
      breve: 'Es la matriz de salida: en Asignación marca qué pareja recurso–tarea se eligió (una por fila y columna); en Esquina noroeste indica cuántas unidades se envían de cada origen a cada destino.',
      sencilla: 'Es la respuesta escrita en forma de tabla. Donde hay una marca o un número, se eligió esa combinación.',
      ejemplo: 'Transporte con dos fábricas y dos tiendas: la matriz de cantidades [ 30 0 ; 10 20 ] dice que la fábrica 1 envía 30 a la tienda 1 y la fábrica 2 envía 10 a la tienda 1 y 20 a la tienda 2.',
      detalle: 'Un 0 en la matriz de cantidades significa que no se envía nada por esa ruta, salvo el caso especial del «0 básico» en soluciones degeneradas, que pertenece a la base sin representar un envío.',
      relacionadas: ['matriz.costos', 'northwest.degeneracion', 'northwest.costo-total']
    },
    {
      id: 'matriz.cero-vacio-infinito', tema: 'matrices', modulos: ['johnson', 'dijkstra', 'asignacion', 'northwest'],
      pregunta: '¿Qué diferencia hay entre cero, casilla vacía, sin relación e infinito?',
      variantes: ['cero o vacio', 'que diferencia hay entre cero y vacio', 'que significa una casilla vacia', 'vacio es lo mismo que cero', 'que significa el guion en la matriz', 'cero y pendiente son lo mismo', 'que significa infinito en la matriz'],
      conceptos: ['cero', 'vacio', 'vacia', 'pendiente', 'guion', 'infinito', 'ausencia'],
      breve: 'No son lo mismo. Cero es un valor real (costo 0 o distancia 0). Una casilla vacía es un dato pendiente que todavía no escribiste. «Sin relación» (guion) significa que no existe conexión directa. Infinito (∞) significa que no hay ningún camino posible.',
      sencilla: 'Cero: «cuesta nada». Vacío: «falta el dato». Guion: «no hay conexión directa». Infinito: «no se puede llegar de ninguna forma».',
      ejemplo: 'En Asignación, si dejas la casilla Ana–Tarea 2 vacía, la aplicación no la toma como 0: te pide completarla. Si escribes 0, significa que esa pareja no cuesta nada, y el método sí puede elegirla.',
      detalle: 'En Johnson y Dijkstra, un peso 0 es una conexión válida que no cuesta recorrer; ∞ en el resultado significa inalcanzable. En Esquina noroeste, una casilla vacía bloquea el avance al balanceo; un costo 0 es válido.',
      relacionadas: ['dijkstra.infinito', 'asignacion.pendientes', 'northwest.cero-basico']
    },
    {
      id: 'matriz.sumas', tema: 'matrices', modulos: ['northwest', 'asignacion'],
      pregunta: '¿Qué son las sumas por fila y por columna?',
      variantes: ['como se suma una fila', 'que significa la suma de la columna', 'por que se suman las filas', 'suma de filas y columnas', 'para que sirven los totales de fila y columna'],
      conceptos: ['suma', 'sumas', 'sumar', 'totales', 'total'],
      breve: 'La suma por fila agrega todos los valores de esa fila; la suma por columna, todos los de esa columna. En transporte permiten comprobar que cada origen envía exactamente su oferta y cada destino recibe su demanda.',
      sencilla: 'Sumar una fila es sumar los números de un renglón; sumar una columna es sumar hacia abajo.',
      ejemplo: 'Cantidades [ 30 0 ; 10 20 ]: la fila 1 suma 30 (oferta del origen 1); la columna 1 suma 40 (demanda del destino 1).',
      detalle: 'En Esquina noroeste, al terminar, cada fila de cantidades debe sumar la oferta de ese origen y cada columna la demanda de ese destino, incluyendo el ficticio si lo hubo. En el método húngaro las reducciones restan el mínimo de cada fila y columna, no sus sumas.',
      relacionadas: ['northwest.oferta-demanda', 'northwest.balanceo', 'asignacion.reducciones']
    },

    /* ---------------- Grafos ---------------- */
    {
      id: 'grafo.que-es', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal', 'asignacion'],
      pregunta: '¿Qué es un grafo?',
      variantes: ['que es un grafo', 'para que sirve un grafo', 'grafo definicion', 'que son los grafos', 'explicame los grafos'],
      conceptos: ['grafo', 'grafos', 'red'],
      breve: 'Un grafo es un conjunto de puntos (vértices o nodos) unidos por líneas (aristas o conexiones). Sirve para representar relaciones: ciudades y carreteras, personas y amistades, tareas y dependencias.',
      sencilla: 'Imagina un mapa simplificado: círculos para los lugares y líneas para los caminos que los unen. Eso es un grafo.',
      ejemplo: 'Tres ciudades A, B y C con carreteras A–B (5 km) y B–C (3 km) forman un grafo con 3 vértices y 2 aristas.',
      detalle: 'Johnson, Dijkstra y Kruskal trabajan sobre grafos. Asignación usa un grafo bipartito (recursos a un lado, tareas al otro). Un grafo puede dibujarse de muchas formas distintas sin cambiar: lo que importa es qué está conectado con qué.',
      relacionadas: ['grafo.vertice-arista', 'grafo.dirigido-no-dirigido', 'grafo.peso', 'grafo.lista-vs-matriz']
    },
    {
      id: 'grafo.vertice-arista', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal', 'asignacion'],
      pregunta: '¿Qué son un vértice y una arista?',
      variantes: ['que es un vertice', 'que es un nodo', 'que es una arista', 'que es una conexion', 'nodo y vertice son lo mismo', 'arista y conexion son lo mismo', 'diferencia entre nodo y arista', 'que es un punto del grafo'],
      conceptos: ['vertice', 'vertices', 'nodo', 'nodos', 'arista', 'aristas', 'conexion', 'conexiones', 'punto', 'puntos'],
      breve: 'Un vértice (también llamado nodo o punto) es uno de los elementos del grafo. Una arista (también llamada conexión) es la línea que une dos vértices. «Vértice» y «nodo» son sinónimos; «arista» y «conexión» también.',
      sencilla: 'Los vértices son los círculos; las aristas, las líneas entre ellos.',
      ejemplo: 'En un grafo de ciudades, cada ciudad es un vértice y cada carretera es una arista.',
      detalle: 'Esta aplicación usa «nodo» o «punto» en los botones de Johnson, Dijkstra y Kruskal, y «conexión» o «arista» según el módulo. Significan lo mismo. En Asignación los vértices se llaman recursos y tareas.',
      relacionadas: ['grafo.que-es', 'grafo.origen-destino', 'grafo.grado-aislado']
    },
    {
      id: 'grafo.origen-destino', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'northwest'],
      pregunta: '¿Qué son origen y destino?',
      variantes: ['que es el origen', 'que es el destino', 'que significa origen y destino', 'diferencia entre origen y destino', 'desde y hasta que significan'],
      conceptos: ['origen', 'destino', 'desde', 'hasta', 'salida', 'llegada'],
      breve: 'El origen es el vértice desde donde parte una conexión o un camino; el destino es el vértice al que llega. En una arista dirigida A→B, A es el origen y B el destino.',
      sencilla: 'Origen es «desde dónde sales»; destino, «a dónde quieres llegar».',
      ejemplo: 'En Dijkstra eliges un origen (por ejemplo, tu casa) y el algoritmo calcula la distancia mínima hasta todos los demás puntos; si eliges destino, resalta ese camino.',
      detalle: 'En Esquina noroeste los orígenes son las filas (quienes ofrecen) y los destinos las columnas (quienes demandan). En la matriz de Johnson, la fila es el origen y la columna el destino.',
      relacionadas: ['grafo.dirigido-no-dirigido', 'dijkstra.origen-igual-destino', 'northwest.oferta-demanda']
    },
    {
      id: 'grafo.dirigido-no-dirigido', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué diferencia hay entre grafo dirigido y no dirigido?',
      variantes: ['que es un grafo dirigido', 'que es un grafo no dirigido', 'que significa dirigido', 'dirigido o no dirigido', 'que es un digrafo', 'que significa la flecha en la conexion'],
      conceptos: ['dirigido', 'dirigida', 'digrafo', 'flecha', 'flechas', 'sentido', 'direccion'],
      breve: 'En un grafo dirigido cada arista tiene sentido: A→B permite ir de A a B, pero no de B a A. En un grafo no dirigido la arista A–B se puede recorrer en ambos sentidos.',
      sencilla: 'Dirigido es como una calle de un solo sentido; no dirigido, como una calle de doble sentido.',
      ejemplo: 'Con la única conexión A→B (dirigida), la distancia de A a B es su peso, pero la de B a A es ∞ porque no hay forma de volver.',
      detalle: 'Johnson trabaja siempre con grafos dirigidos. Dijkstra permite elegir el modo: en dirigido, A→B y B→A son conexiones diferentes y pueden tener pesos distintos. Kruskal trabaja con grafos no dirigidos porque un árbol de expansión no necesita sentidos.',
      relacionadas: ['grafo.aristas-duplicadas-opuestas', 'dijkstra.dirigido-vs-no-dirigido', 'matriz.transpuesta-simetria']
    },
    {
      id: 'grafo.peso', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest'],
      pregunta: '¿Qué es el peso de una arista y en qué se diferencia de costo, distancia y beneficio?',
      variantes: ['que es el peso', 'que significa el peso de una conexion', 'peso costo y distancia son lo mismo', 'diferencia entre peso y distancia', 'que es un beneficio', 'que es el costo'],
      conceptos: ['peso', 'pesos', 'ponderado', 'costo', 'distancia', 'beneficio', 'valor'],
      breve: 'El peso es el número asociado a una arista. Según el problema se interpreta como costo (lo que se paga), distancia (lo que se recorre) o beneficio (lo que se gana). Matemáticamente se tratan igual; cambia solo si queremos minimizarlo o maximizarlo.',
      sencilla: 'El peso es la «etiqueta numérica» de la línea. Puede ser kilómetros, minutos, dinero o puntos: el algoritmo solo ve el número.',
      ejemplo: 'Una carretera A–B de 12 km tiene peso 12. Si en lugar de distancia midieras el peaje, el peso sería el precio.',
      detalle: 'Johnson, Dijkstra y Kruskal mínimo buscan pesos totales pequeños. Kruskal máximo y Asignación en modo maximizar buscan beneficios grandes. En Esquina noroeste el peso se llama costo unitario porque se multiplica por la cantidad enviada.',
      relacionadas: ['grafo.pesos-negativos', 'grafo.camino-recorrido-ciclo', 'asignacion.costos-beneficios']
    },
    {
      id: 'grafo.camino-recorrido-ciclo', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué son camino, recorrido y ciclo?',
      variantes: ['que es un camino', 'que es un ciclo', 'que es un recorrido en un grafo', 'diferencia entre camino y ciclo', 'que significa que el grafo tenga ciclos', 'que es una ruta'],
      conceptos: ['camino', 'caminos', 'ruta', 'rutas', 'ciclo', 'ciclos', 'recorrido', 'trayecto'],
      breve: 'Un camino es una secuencia de vértices unidos por aristas, sin repetir vértices. Un recorrido es cualquier secuencia que siga aristas, aunque repita. Un ciclo es un camino que vuelve al vértice inicial.',
      sencilla: 'Camino: vas de un lugar a otro sin pasar dos veces por el mismo sitio. Ciclo: sales y regresas al punto de partida formando un anillo.',
      ejemplo: 'A→B→C es un camino de A a C. A→B→C→A es un ciclo. En Kruskal, si ya tienes A–B y B–C, añadir A–C cerraría un ciclo y se rechaza.',
      detalle: 'Un árbol es un grafo conectado sin ciclos. Dijkstra y Johnson buscan caminos de peso mínimo. Kruskal evita ciclos para construir un árbol. En Johnson un ciclo con peso total negativo impide calcular distancias mínimas.',
      relacionadas: ['grafo.bucle', 'grafo.arbol-bosque', 'johnson.ciclo-negativo', 'kruskal.detectar-ciclos']
    },
    {
      id: 'grafo.bucle', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué es un bucle en un grafo?',
      variantes: ['que es un bucle', 'que es un lazo', 'puedo conectar un nodo consigo mismo', 'conexion de un nodo a si mismo', 'por que no me deja conectar un nodo consigo mismo'],
      conceptos: ['bucle', 'bucles', 'lazo', 'lazos', 'mismo'],
      breve: 'Un bucle es una arista que sale de un vértice y llega al mismo vértice (A→A). Esta aplicación no permite crearlos en ningún módulo de grafos: es una decisión del editor, no una limitación de los algoritmos.',
      sencilla: 'Es una línea que da la vuelta y regresa al mismo círculo del que salió.',
      detalle: 'Para caminos mínimos un bucle de peso no negativo nunca mejora una distancia, y uno negativo sería un ciclo negativo. Para árboles de expansión un bucle siempre forma un ciclo, así que Kruskal lo rechazaría. Por eso el editor los bloquea desde el principio.',
      relacionadas: ['grafo.aristas-duplicadas-opuestas', 'grafo.camino-recorrido-ciclo', 'johnson.restriccion-editor']
    },
    {
      id: 'grafo.aristas-duplicadas-opuestas', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué son aristas duplicadas y aristas opuestas?',
      variantes: ['que es una arista duplicada', 'que es una conexion inversa', 'puedo poner dos conexiones entre los mismos nodos', 'que significa conexion opuesta', 'aristas paralelas', 'conexion repetida'],
      conceptos: ['duplicada', 'duplicadas', 'duplicado', 'repetida', 'paralela', 'paralelas', 'inversa', 'inversas', 'opuesta', 'opuestas'],
      breve: 'Una arista duplicada repite la misma pareja en el mismo sentido (dos veces A→B). Una arista opuesta o inversa va en sentido contrario (A→B y B→A). Ningún módulo admite duplicadas; las opuestas se permiten en Dijkstra dirigido y no en Johnson.',
      sencilla: 'Duplicada: la misma línea dibujada dos veces. Opuesta: una línea de ida y otra de vuelta entre los mismos dos puntos.',
      ejemplo: 'En Dijkstra dirigido puedes tener A→B con peso 4 y B→A con peso 9: son dos conexiones distintas. En Johnson, el editor rechaza la segunda.',
      detalle: 'Matemáticamente, los algoritmos de camino mínimo funcionan con aristas opuestas; incluso con duplicadas bastaría quedarse con la más barata. La prohibición en Johnson es una regla de esta aplicación para mantener la matriz simple y legible.',
      relacionadas: ['grafo.dirigido-no-dirigido', 'johnson.restriccion-editor', 'grafo.bucle']
    },
    {
      id: 'grafo.grado-aislado', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué son el grado de un vértice y un vértice aislado?',
      variantes: ['que es el grado de un nodo', 'que es un vertice aislado', 'que es un nodo aislado', 'que pasa con un nodo sin conexiones', 'nodo sin aristas'],
      conceptos: ['grado', 'aislado', 'aislados', 'suelto', 'solo'],
      breve: 'El grado de un vértice es la cantidad de aristas que llegan o salen de él. Un vértice aislado tiene grado 0: no está conectado con nadie.',
      sencilla: 'Cuenta cuántas líneas tocan el círculo: ese es su grado. Si ninguna lo toca, está aislado.',
      ejemplo: 'Si A tiene conexiones con B y con C, su grado es 2. Si D no tiene conexiones, está aislado: Dijkstra le asigna ∞ y Kruskal lo deja como componente propio.',
      ejemploAutorizado: 'Si A tiene conexiones con B y con C, su grado es 2. D, sin conexiones, está aislado. En Dijkstra queda a distancia ∞ si elegiste otro origen; si D es el origen, su distancia a sí mismo es 0. Kruskal conserva D como una componente de un solo vértice.',
      detalle: 'En grafos dirigidos se distinguen grado de entrada (aristas que llegan) y grado de salida (aristas que salen). Un vértice aislado no es un error: simplemente no se puede llegar a él ni salir de él.',
      relacionadas: ['grafo.conectividad', 'dijkstra.inalcanzables', 'kruskal.bosque']
    },
    {
      id: 'grafo.conectividad', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué significan conectividad y alcanzabilidad?',
      variantes: ['que es un grafo conexo', 'que significa que el grafo esta conectado', 'que es alcanzable', 'que significa alcanzabilidad', 'grafo desconectado', 'que es un grafo conectado'],
      variantesAutorizadas: ['que es la conectividad de un grafo'],
      conceptos: ['conectividad', 'conexo', 'conectado', 'desconectado', 'alcanzable', 'alcanzabilidad', 'alcanzar', 'componente', 'componentes'],
      breve: 'Un grafo es conectado (conexo) si desde cualquier vértice se puede llegar a cualquier otro. Un vértice B es alcanzable desde A si existe algún camino de A a B. En grafos dirigidos el sentido importa: B puede ser alcanzable desde A sin que A lo sea desde B.',
      sencilla: 'Conectado quiere decir que el dibujo está «todo en una pieza». Si hay grupos separados, el grafo está desconectado.',
      ejemplo: 'Con las aristas A–B y C–D hay dos grupos (componentes): {A, B} y {C, D}. C no es alcanzable desde A.',
      detalle: 'Kruskal produce un bosque con tantos árboles como componentes. Dijkstra y Johnson marcan ∞ los vértices no alcanzables. Las componentes son los grupos de vértices conectados entre sí.',
      relacionadas: ['grafo.grado-aislado', 'kruskal.bosque', 'dijkstra.inalcanzables']
    },
    {
      id: 'grafo.bipartito', tema: 'grafos', modulos: ['asignacion'],
      pregunta: '¿Qué es un grafo bipartito?',
      variantes: ['que es un grafo bipartito', 'que significa bipartito', 'por que el grafo de asignacion tiene dos columnas', 'grafo bipartito de asignacion'],
      conceptos: ['bipartito', 'bipartita', 'dos grupos', 'dos columnas'],
      breve: 'Un grafo bipartito tiene sus vértices divididos en dos grupos, y cada arista une un vértice de un grupo con uno del otro. Nunca hay aristas dentro del mismo grupo.',
      sencilla: 'Son dos filas de círculos enfrentadas: los de la izquierda solo se conectan con los de la derecha.',
      ejemplo: 'En Asignación, los recursos (personas) están a un lado y las tareas al otro. La conexión Ana–Tarea 2 existe; una conexión Ana–Luis no tiene sentido y el editor no la permite.',
      detalle: 'El problema de asignación equivale a elegir, en el grafo bipartito, un conjunto de aristas donde cada vértice aparece a lo sumo una vez (un emparejamiento) con costo mínimo o beneficio máximo. La matriz de costos es la misma información en forma de tabla.',
      relacionadas: ['asignacion.recursos-tareas', 'asignacion.grafo-y-matriz', 'grafo.que-es']
    },
    {
      id: 'grafo.arbol-bosque', tema: 'grafos', modulos: ['kruskal', 'arboles'],
      pregunta: '¿Qué son un árbol y un bosque en grafos?',
      variantes: ['que es un arbol en grafos', 'que es un bosque', 'que es un arbol de expansion', 'que significa arbol de expansion', 'por que se llama arbol', 'arbol generador'],
      variantesAutorizadas: ['diferencia entre arbol y bosque'],
      conceptos: ['arbol', 'arboles', 'bosque', 'expansion', 'generador', 'recubridor'],
      breve: 'Un árbol es un grafo conectado sin ciclos. Un bosque es un conjunto de árboles separados. Un árbol de expansión de un grafo es un árbol que usa aristas del grafo y llega a todos sus vértices.',
      sencilla: 'Un árbol conecta todo sin dar vueltas en círculo: entre dos puntos siempre hay un único camino. Si el dibujo está partido en varios grupos sin ciclos, es un bosque.',
      ejemplo: 'Con vértices A, B, C y aristas A–B y B–C tienes un árbol. Si añades A–C aparece un ciclo y deja de ser árbol.',
      detalle: 'Un árbol con V vértices tiene exactamente V − 1 aristas. Kruskal construye un árbol de expansión de peso mínimo (o máximo). El módulo Árboles trata árboles con raíz y a lo sumo dos hijos por nodo (árboles binarios), un caso particular con jerarquía.',
      relacionadas: ['kruskal.que-es', 'kruskal.v-menos-1', 'grafo.camino-minimo-vs-arbol', 'arboles.terminos']
    },
    {
      id: 'grafo.camino-minimo-vs-arbol', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué diferencia hay entre camino mínimo y árbol de expansión mínimo?',
      variantes: ['camino minimo vs arbol de expansion', 'diferencia entre dijkstra y kruskal', 'es lo mismo camino minimo que arbol minimo', 'por que kruskal no da rutas', 'kruskal calcula caminos minimos'],
      conceptos: ['camino minimo', 'arbol de expansion', 'expansion minimo'],
      breve: 'Un camino mínimo es la ruta más barata entre dos vértices concretos. Un árbol de expansión mínimo es el conjunto de aristas más barato que conecta todos los vértices a la vez. Resuelven preguntas distintas y pueden dar aristas diferentes.',
      sencilla: 'Camino mínimo: «¿cómo llego yo de A a B gastando lo menos posible?». Árbol mínimo: «¿cómo conecto a todos los pueblos con el menor total de carretera?».',
      ejemplo: 'Triángulo A–B (1), B–C (1), A–C (1.5). El árbol mínimo usa A–B y B–C (total 2). Pero el camino mínimo de A a C es la arista directa A–C (1.5), que el árbol no incluye.',
      detalle: 'Dijkstra y Johnson calculan caminos mínimos (desde un origen o entre todos los pares). Kruskal calcula el árbol de expansión. El árbol de caminos mínimos de Dijkstra desde un origen también es un árbol, pero no es el de expansión mínimo en general.',
      relacionadas: ['dijkstra.que-es', 'kruskal.que-es', 'kruskal.vs-dijkstra-johnson']
    },
    {
      id: 'grafo.pesos-negativos', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué pasa con pesos negativos y ciclos negativos?',
      variantes: ['que es un peso negativo', 'se pueden usar pesos negativos', 'que es un ciclo negativo', 'por que los pesos negativos son un problema', 'puedo poner un peso negativo'],
      conceptos: ['negativo', 'negativos', 'negativa', 'negativas'],
      breve: 'Un peso negativo es una arista que «paga» en lugar de costar. Un ciclo negativo es un ciclo cuya suma de pesos es menor que cero: repetirlo baja el costo sin límite, así que no existe un camino mínimo. Johnson acepta pesos negativos pero detecta y rechaza ciclos negativos; Dijkstra no admite negativos; Kruskal los acepta sin problema.',
      sencilla: 'Si una calle te regalara dinero por pasar, darías vueltas sin parar. Eso es un ciclo negativo: no hay «mínimo» posible.',
      ejemplo: 'A→B con peso 2 y B→A con peso −5 forman un ciclo de peso −3. Cada vuelta A→B→A reduce el costo en 3. Johnson avisaría de un ciclo negativo.',
      detalle: 'Dijkstra supone que al fijar un vértice ya no puede mejorar, lo cual falla con pesos negativos; por eso esta implementación los rechaza. Johnson usa Bellman-Ford para detectar ciclos negativos y reponderar. En Kruskal el signo no importa: solo se ordenan las aristas.',
      relacionadas: ['johnson.ciclo-negativo', 'dijkstra.pesos-negativos', 'kruskal.pesos-negativos-cero']
    },
    {
      id: 'grafo.empates', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest'],
      pregunta: '¿Qué pasa cuando hay empates o varias soluciones?',
      variantes: ['que pasa si hay empate', 'puede haber varias soluciones', 'por que eligio una y no otra si pesan igual', 'soluciones alternativas', 'hay mas de una respuesta correcta', 'que es un desempate'],
      conceptos: ['empate', 'empates', 'alternativa', 'alternativas', 'unica', 'unico', 'desempate'],
      breve: 'Cuando dos opciones tienen el mismo valor, el algoritmo elige una según una regla fija (orden de creación o posición) y la otra queda descartada. El total óptimo es el mismo, pero la solución concreta puede no ser única.',
      sencilla: 'Si dos caminos cuestan igual, cualquiera es correcto. La aplicación toma siempre el primero que encuentra para que el resultado sea repetible.',
      ejemplo: 'Kruskal con A–B (3) y B–C (3) ordena por peso y, en empate, por el orden en que creaste las conexiones. Otro programa podría elegir otra arista con el mismo total.',
      detalle: 'Esto se llama desempate determinista: con los mismos datos siempre sale lo mismo. Si tu libro o tu profesor muestran otra solución con el mismo total, ambas son válidas. El total óptimo no cambia; sí pueden cambiar las aristas o parejas elegidas.',
      relacionadas: ['basico.determinista', 'kruskal.empates', 'dijkstra.empates', 'asignacion.alternativas']
    },
    {
      id: 'grafo.lista-vs-matriz', tema: 'grafos', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Cómo se representa un grafo con listas y con matrices?',
      variantes: ['lista de adyacencia vs matriz', 'que es una lista de adyacencia', 'como se guarda un grafo', 'representacion de grafos', 'formas de representar un grafo'],
      conceptos: ['lista', 'listas', 'representar', 'representacion', 'guardar'],
      breve: 'Hay dos formas habituales: la matriz de adyacencia (una tabla vértice × vértice con el peso en cada cruce) y la lista de adyacencia (para cada vértice, la lista de sus vecinos con sus pesos). Contienen la misma información.',
      sencilla: 'La matriz es una tabla completa; la lista es una libreta donde cada vértice tiene apuntados solo sus vecinos.',
      ejemplo: 'Grafo A→B (3), A→C (5):\nLista: A: [B:3, C:5]; B: []; C: [].\nMatriz: fila A = [—, 3, 5]; filas B y C sin valores.',
      detalle: 'La matriz es cómoda para consultar «¿están conectados A y B?» de inmediato; la lista ocupa menos cuando hay pocas conexiones. Johnson muestra el grafo dibujado y su matriz; Dijkstra y Kruskal muestran listas de vértices y aristas en sus editores.',
      relacionadas: ['matriz.adyacencia', 'grafo.que-es']
    },

    /* ---------------- Conceptos básicos de algoritmos ---------------- */
    {
      id: 'basico.algoritmo', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué es un algoritmo?',
      variantes: ['que es un algoritmo', 'algoritmo definicion', 'para que sirve un algoritmo', 'explicame que es un algoritmo', 'que son los algoritmos'],
      conceptos: ['algoritmo', 'algoritmos', 'procedimiento', 'receta'],
      breve: 'Un algoritmo es una lista ordenada y finita de pasos precisos que, aplicados a unos datos de entrada, producen un resultado. Es una receta que cualquier persona o máquina puede seguir sin ambigüedad.',
      sencilla: 'Es como una receta de cocina: ingredientes (datos), pasos claros y un plato final (resultado). Si sigues los pasos igual, obtienes lo mismo.',
      ejemplo: 'Para encontrar el menor de una lista: 1) toma el primero como candidato; 2) recorre los demás; 3) si uno es menor, cámbialo por candidato; 4) al terminar, el candidato es el menor.',
      detalle: 'Cada módulo de esta ciudad es un algoritmo: Johnson, Dijkstra y Kruskal sobre grafos; el método húngaro y Esquina noroeste sobre tablas; cinco métodos de ordenamiento; y recorridos de árboles. Los pasos que ves en pantalla son exactamente los que ejecuta el algoritmo.',
      relacionadas: ['basico.entrada-proceso-salida', 'basico.paso-iteracion-parada', 'basico.complejidad']
    },
    {
      id: 'basico.entrada-proceso-salida', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué son entrada, proceso y salida?',
      variantes: ['que es la entrada de un algoritmo', 'que es la salida', 'entrada proceso salida', 'que significa entrada y salida', 'que datos necesita el algoritmo'],
      conceptos: ['entrada', 'salida', 'proceso', 'datos', 'resultado'],
      breve: 'La entrada son los datos que recibe el algoritmo (grafo, matriz, lista). El proceso son los pasos que realiza. La salida es el resultado que entrega (distancias, árbol, asignación, lista ordenada).',
      sencilla: 'Entrada: lo que le das. Proceso: lo que hace. Salida: lo que te devuelve.',
      ejemplo: 'En Dijkstra la entrada es el grafo con sus pesos y el origen; el proceso, la elección repetida del vértice pendiente más cercano; la salida, la tabla de distancias y predecesores.',
      detalle: 'En la ciudad, la etapa 1 de cada módulo prepara la entrada, la etapa de pasos muestra el proceso y la etapa final muestra la salida. Si cambias la entrada, la salida anterior deja de ser válida y hay que recalcular.',
      relacionadas: ['basico.algoritmo', 'basico.validacion-limites', 'aplicacion.recalcular']
    },
    {
      id: 'basico.paso-iteracion-parada', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué son paso, iteración y condición de parada?',
      variantes: ['que es un paso', 'que es una iteracion', 'que es la condicion de parada', 'cuando termina el algoritmo', 'que significa iterar', 'por que termina el algoritmo'],
      conceptos: ['paso', 'pasos', 'iteracion', 'iteraciones', 'parada', 'termina', 'terminar', 'repetir', 'repeticion', 'pasada'],
      breve: 'Un paso es una acción concreta del algoritmo. Una iteración es una repetición completa de un bloque de pasos. La condición de parada es la regla que indica cuándo dejar de repetir.',
      sencilla: 'Paso: una acción. Iteración: una vuelta completa. Condición de parada: la señal de «ya terminamos».',
      ejemplo: 'En Bubble Sort, comparar dos vecinos es un paso; recorrer toda la lista una vez es una iteración (pasada); la condición de parada es «no hubo intercambios en la última pasada».',
      detalle: 'Los módulos muestran cada paso como un evento que puedes avanzar o retroceder. En Johnson, Bellman-Ford repite pasadas hasta que no hay mejoras o hasta V − 1 veces. En Kruskal se detiene al tener V − 1 aristas o al acabar la lista. El contador de pasos de la pantalla cuenta eventos registrados, no iteraciones.',
      detalleAutorizado: 'Los módulos muestran cada paso como un evento que puedes avanzar o retroceder. En Johnson, Bellman-Ford repite pasadas hasta que no hay mejoras o hasta V − 1 veces, y comprueba después si existe un ciclo negativo. Kruskal registra todas las aristas para explicar aceptaciones y descartes, incluso cuando el árbol ya está completo. El contador de la pantalla cuenta eventos registrados, no iteraciones.',
      relacionadas: ['basico.algoritmo', 'aplicacion.pasos-controles']
    },
    {
      id: 'basico.solucion-valida-factible-optima', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué diferencia hay entre solución válida, factible y óptima?',
      variantes: ['que es una solucion factible', 'que es una solucion optima', 'que es una solucion valida', 'factible y optima son lo mismo', 'que significa optimo', 'diferencia entre factible y optima'],
      conceptos: ['factible', 'optima', 'optimo', 'optimalidad', 'valida', 'solucion'],
      breve: 'Una solución válida cumple las reglas del formato (datos completos y en rango). Una solución factible cumple todas las restricciones del problema (por ejemplo, satisface oferta y demanda). Una solución óptima es factible y, además, tiene el mejor valor posible: ningún otra factible la supera.',
      sencilla: 'Válida: «está bien escrita». Factible: «se puede llevar a cabo». Óptima: «es la mejor de todas las que se pueden llevar a cabo».',
      ejemplo: 'Esquina noroeste da una solución factible de transporte: envía todo lo que se pide sin superar las ofertas. Pero no es necesariamente óptima: puede existir otro reparto más barato.',
      detalle: 'Dijkstra, Johnson, Kruskal y el método húngaro garantizan soluciones óptimas (dentro de sus supuestos). Esquina noroeste solo garantiza factibilidad; métodos como MODI mejorarían esa solución, pero no están implementados aquí.',
      relacionadas: ['northwest.no-optimo', 'basico.voraz', 'grafo.empates']
    },
    {
      id: 'basico.voraz', tema: 'basicos', modulos: ['dijkstra', 'kruskal', 'northwest'],
      pregunta: '¿Qué es un algoritmo voraz?',
      variantes: ['que es un algoritmo voraz', 'que significa greedy', 'que es un algoritmo goloso', 'que es un algoritmo avido', 'por que dijkstra es voraz', 'kruskal es voraz'],
      conceptos: ['voraz', 'greedy', 'goloso', 'avido', 'codicioso'],
      breve: 'Un algoritmo voraz toma en cada paso la decisión que parece mejor en ese momento, sin volver atrás. Funciona de maravilla cuando el problema garantiza que esas decisiones locales llevan al óptimo global, como en Dijkstra o Kruskal; en otros casos solo da una solución razonable.',
      sencilla: 'Es elegir siempre «lo mejor ahora mismo» y seguir adelante sin arrepentirse.',
      ejemplo: 'Kruskal toma siempre la arista más barata que no forme ciclo. Esa estrategia voraz produce el árbol mínimo. Esquina noroeste también es voraz pero no mira costos, por eso no garantiza el óptimo.',
      detalle: 'Dijkstra fija en cada paso el vértice pendiente más cercano; con pesos no negativos esa decisión nunca se arrepiente. El método húngaro no es voraz: realiza reducciones y ajustes globales sobre toda la matriz.',
      relacionadas: ['dijkstra.que-es', 'kruskal.que-es', 'northwest.no-optimo', 'basico.solucion-valida-factible-optima']
    },
    {
      id: 'basico.complejidad', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué es la complejidad temporal y espacial?',
      variantes: ['que es la complejidad', 'que es la complejidad temporal', 'que es la complejidad espacial', 'que significa complejidad de un algoritmo', 'que es la notacion o grande', 'que es big o'],
      conceptos: ['complejidad', 'temporal', 'espacial', 'eficiencia', 'notacion', 'big o', 'o grande'],
      breve: 'La complejidad temporal estima cuánto crece el número de operaciones cuando crece el tamaño de la entrada. La complejidad espacial estima cuánta memoria adicional necesita. Se expresan con la notación O (se lee «o grande»), que describe el ritmo de crecimiento, no segundos exactos.',
      sencilla: 'Responde: si duplico los datos, ¿el trabajo se duplica, se cuadruplica o casi no cambia? Eso es la complejidad.',
      ejemplo: 'Bubble Sort compara aproximadamente n² veces para n valores: con 10 valores unas 100 comparaciones, con 100 valores unas 10 000. Es O(n²).',
      detalle: 'Las complejidades habituales: Dijkstra con cola de prioridad O((V + E) log V); Johnson O(V · E + V² log V); Kruskal O(E log E) por la ordenación; método húngaro O(n³); Esquina noroeste O(m + n); Merge Sort O(n log n); Selection, Insertion y Bubble O(n²); Shell entre ambos según los saltos; recorridos de árboles O(n).',
      relacionadas: ['basico.notacion-o', 'basico.complejidad-vs-tiempo', 'ordenamiento.comparar']
    },
    {
      id: 'basico.notacion-o', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué significan O(n), O(n²), O(log n) y O(n log n)?',
      variantes: ['que significa o de n', 'que es o de n al cuadrado', 'que significa o de log n', 'que es o de n log n', 'que es n cuadrado', 'que es logaritmico', 'que significa lineal'],
      conceptos: ['o(n)', 'n2', 'cuadrado', 'cuadratico', 'cuadratica', 'log', 'logaritmo', 'logaritmico', 'lineal', 'n log n'],
      breve: 'O(n): el trabajo crece en proporción directa al tamaño (el doble de datos, el doble de trabajo). O(n²): crece con el cuadrado (el doble de datos, cuatro veces más trabajo). O(log n): crece muy despacio (duplicar los datos añade solo un paso más). O(n log n): un poco más que lineal; es lo habitual en los mejores métodos de ordenamiento.',
      sencilla: 'Lineal: revisar una lista entera. Cuadrático: comparar cada elemento con todos los demás. Logarítmico: partir el problema a la mitad cada vez, como buscar en un diccionario. n log n: partir a la mitad y luego recorrer todo en cada nivel.',
      ejemplo: 'Con n = 1000: O(log n) ≈ 10 operaciones; O(n) = 1000; O(n log n) ≈ 10 000; O(n²) = 1 000 000.',
      detalle: 'Recorrer un árbol es O(n). Buscar en un BST equilibrado es O(log n) porque cada comparación descarta la mitad; en uno degenerado se vuelve O(n). Merge Sort es O(n log n); Bubble, Selection e Insertion son O(n²) en el peor caso.',
      relacionadas: ['basico.complejidad', 'arboles.equilibrado-degenerado', 'ordenamiento.comparar']
    },
    {
      id: 'basico.complejidad-vs-tiempo', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué diferencia hay entre complejidad, tiempo medido y velocidad de animación?',
      variantes: ['la velocidad de la animacion mide la complejidad', 'el tiempo de preparacion es la complejidad', 'por que tarda mas la animacion que el calculo', 'diferencia entre tiempo y complejidad', 'la animacion lenta significa que el algoritmo es lento'],
      conceptos: ['tiempo', 'medido', 'animacion', 'velocidad', 'preparacion', 'rendimiento'],
      breve: 'Son tres cosas distintas. La complejidad es una estimación teórica del crecimiento del trabajo. El tiempo medido es lo que tardó este navegador en calcular el procedimiento con tus datos. La velocidad de animación es solo el ritmo al que se muestran los pasos ya calculados: cambiarla no cambia el algoritmo.',
      sencilla: 'La animación es como pasar las páginas de un libro ya escrito: puedes ir rápido o lento, pero el libro ya está terminado.',
      ejemplo: 'En Ordenamiento, Merge Sort con 200 valores se calcula en milisegundos (tiempo medido), pero verlo paso a paso en velocidad «Lento» puede tardar minutos (animación). Su complejidad O(n log n) es una propiedad del método, no de tu computadora.',
      detalle: 'En Ordenamiento, el módulo informa el tiempo de preparación al construir el registro de eventos. El selector de velocidad modifica el intervalo entre eventos. No son la misma medida ni se deben comparar entre sí.',
      relacionadas: ['basico.complejidad', 'ordenamiento.pausar-vs-cancelar', 'aplicacion.velocidad']
    },
    {
      id: 'basico.validacion-limites', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué son la validación y los límites de la aplicación?',
      variantes: ['que es la validacion', 'por que la aplicacion tiene limites', 'que significa que el dato es invalido', 'los limites son del algoritmo o de la aplicacion', 'por que hay un maximo de nodos'],
      conceptos: ['validacion', 'validar', 'limite', 'limites', 'restriccion', 'restricciones', 'maximo', 'minimo'],
      breve: 'La validación comprueba que cada dato tenga el formato y el rango esperados antes de calcular. Los límites (cantidad de vértices, rango de valores, decimales) son decisiones de esta aplicación para mantener la pantalla legible y el cálculo rápido; los algoritmos en sí funcionan con tamaños mayores.',
      sencilla: 'La aplicación revisa que todo esté bien escrito antes de empezar, y pone un tope de tamaño para que el dibujo quepa y se entienda.',
      ejemplo: L => 'Dijkstra admite hasta ' + L.grafosNodos + ' vértices y ' + L.grafosAristas + ' aristas. El algoritmo de Dijkstra funcionaría con miles, pero el dibujo dejaría de ser legible.',
      detalle: 'Conviene distinguir tres tipos de restricciones: las matemáticas (Dijkstra no admite pesos negativos), las del editor (Johnson no permite conexiones inversas) y las de tamaño (máximo de elementos). Solo la primera es una propiedad del algoritmo.',
      relacionadas: ['aplicacion.limites', 'johnson.restriccion-editor', 'dijkstra.pesos-negativos']
    },
    {
      id: 'basico.determinista', tema: 'basicos', modulos: ['*'],
      pregunta: '¿Qué es un desempate determinista?',
      variantes: ['que significa determinista', 'por que siempre sale el mismo resultado', 'el algoritmo elige al azar', 'como desempata la aplicacion', 'regla de desempate'],
      conceptos: ['determinista', 'determinismo', 'azar', 'aleatorio', 'repetible', 'desempate'],
      breve: 'Determinista significa que, con los mismos datos, el algoritmo toma siempre las mismas decisiones y produce el mismo resultado. Cuando hay empates, la aplicación aplica una regla fija (orden de creación o posición en la lista) en lugar de elegir al azar.',
      sencilla: 'Nada se decide a la suerte: si repites el ejercicio, verás exactamente los mismos pasos.',
      ejemplo: 'En Kruskal, dos aristas con el mismo peso se ordenan según cuál creaste primero. En Dijkstra, si dos vértices pendientes tienen la misma distancia, se toma el primero en la lista.',
      detalle: 'Esto permite que los pasos guardados coincidan al cargar un trabajo, y que puedas comparar con un compañero. Si otro programa o libro desempata distinto, la solución puede variar sin dejar de ser óptima.',
      relacionadas: ['grafo.empates', 'kruskal.empates', 'dijkstra.empates']
    }
  ]);
})();
