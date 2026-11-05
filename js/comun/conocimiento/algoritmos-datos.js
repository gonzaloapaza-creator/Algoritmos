/* Conocimiento de los módulos de estructuras de datos: Ordenamiento y Árboles.
 * Los límites se leen de la configuración mediante la función L. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  K.registrar([
    /* ---------------- Ordenamiento ---------------- */
    {
      id: 'ordenamiento.que-es', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué significa ordenar una lista?',
      variantes: ['que es ordenar', 'que es el ordenamiento', 'para que sirve ordenar', 'que hace un algoritmo de ordenamiento', 'que significa ordenamiento'],
      conceptos: ['ordenar', 'ordenamiento', 'ordenado', 'orden', 'lista', 'arreglo'],
      breve: 'Ordenar es reorganizar los elementos de una lista para que queden en una secuencia determinada, normalmente de menor a mayor. Un algoritmo de ordenamiento decide qué elementos comparar y cuáles mover para lograrlo.',
      sencilla: 'Es como acomodar cartas en la mano de menor a mayor. Cada método tiene una «técnica» distinta para hacerlo.',
      ejemplo: 'Entrada [5, 2, 9, 1] → salida [1, 2, 5, 9]. Los mismos valores, en otro orden.',
      detalle: 'Este módulo muestra cinco métodos: Selection, Insertion, Bubble, Shell y Merge Sort. Todos ordenan de menor a mayor (ascendente). Puedes seguir cada comparación y cada movimiento, y ver los contadores acumulados.',
      relacionadas: ['ordenamiento.ascendente-descendente', 'ordenamiento.comparacion-intercambio', 'ordenamiento.comparar', 'basico.algoritmo'],
      referencia: 'Ordenamiento · selector de algoritmo'
    },
    {
      id: 'ordenamiento.ascendente-descendente', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Puedo ordenar de mayor a menor (descendente)?',
      variantes: ['que es ascendente', 'que es descendente', 'como ordeno de mayor a menor', 'se puede ordenar al reves', 'orden descendente', 'ordenar descendente'],
      conceptos: ['ascendente', 'descendente', 'mayor a menor', 'menor a mayor', 'al reves'],
      breve: 'Este módulo ordena siempre de menor a mayor (ascendente). No hay opción descendente. Ascendente significa que cada valor es mayor o igual que el anterior; descendente, lo contrario.',
      sencilla: 'Aquí la lista siempre termina con el más pequeño a la izquierda y el más grande a la derecha.',
      detalle: 'Los mismos algoritmos sirven para orden descendente invirtiendo la comparación (preguntar «¿es mayor?» en lugar de «¿es menor?»), pero esa variante no está implementada. Sí puedes generar una lista «Invertido» como entrada para observar el peor caso de varios métodos.',
      relacionadas: ['ordenamiento.que-es', 'ordenamiento.casos-ordenado-inverso'],
      referencia: 'Ordenamiento · botones «Pinos al azar», «Casi ordenado», «Invertido»'
    },
    {
      id: 'ordenamiento.comparacion-intercambio', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué diferencia hay entre comparación, intercambio, movimiento e inserción?',
      variantes: ['que es una comparacion', 'que es un intercambio', 'que es un movimiento', 'que es una insercion', 'que cuenta el contador de comparaciones', 'diferencia entre comparar e intercambiar', 'que es un swap'],
      conceptos: ['comparacion', 'comparaciones', 'comparar', 'intercambio', 'intercambios', 'swap', 'movimiento', 'movimientos', 'insercion', 'desplazamiento'],
      breve: 'Una comparación es mirar dos valores para decidir cuál es menor. Un intercambio es cambiar de lugar dos elementos. Un movimiento es cualquier cambio de posición de un elemento (incluye intercambios y desplazamientos). Una inserción es colocar un elemento en su lugar dentro de una parte ya ordenada, desplazando a los demás.',
      sencilla: 'Comparar: mirar. Intercambiar: dos cartas cambian de sitio. Mover: una carta cambia de sitio. Insertar: meter una carta en su hueco corriendo las otras.',
      ejemplo: 'En [3, 1]: comparar 3 con 1 (una comparación); como 3 > 1, intercambiarlos (un intercambio) → [1, 3].',
      detalle: 'En este módulo: Selection, Bubble y Shell cuentan intercambios; Insertion cuenta cada desplazamiento de la clave como un intercambio con su vecino; Merge cuenta escrituras en el arreglo auxiliar y copias de vuelta. Los contadores son acumulados hasta el paso que estás viendo.',
      relacionadas: ['ordenamiento.contadores', 'ordenamiento.colores', 'basico.paso-iteracion-parada']
    },
    {
      id: 'ordenamiento.repetidos-identidad', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué pasa con valores repetidos? ¿Cómo distingue dos elementos iguales?',
      variantes: ['puedo poner valores repetidos', 'que es el identificador del pino', 'como diferencia dos valores iguales', 'por que dos pinos con el mismo valor tienen id distinto', 'valores duplicados en ordenamiento'],
      conceptos: ['repetidos', 'repetido', 'duplicados', 'iguales', 'identidad', 'identificador', 'id', 'pino'],
      breve: 'Se permiten valores repetidos. Cada elemento (pino) tiene un identificador estable distinto aunque su valor sea igual a otro. Así se puede seguir a cada uno durante el ordenamiento y comprobar si el método conserva su orden relativo (estabilidad).',
      sencilla: 'Dos cartas pueden tener el mismo número, pero cada una es una carta distinta. El identificador es como una marca en el reverso para saber cuál es cuál.',
      ejemplo: 'Lista [4a, 4b, 1]: tras ordenar, un método estable da [1, 4a, 4b]; uno no estable podría dar [1, 4b, 4a].',
      relacionadas: ['ordenamiento.estabilidad', 'ordenamiento.reglas'],
      referencia: 'Ordenamiento · «Consultar posición»'
    },
    {
      id: 'ordenamiento.estabilidad', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué es la estabilidad de un algoritmo de ordenamiento?',
      variantes: ['que significa estable', 'que algoritmos son estables', 'por que importa la estabilidad', 'bubble sort es estable', 'selection sort es estable', 'que es un ordenamiento estable'],
      conceptos: ['estable', 'estabilidad', 'inestable'],
      breve: 'Un algoritmo es estable si, cuando dos elementos tienen el mismo valor, conservan el orden relativo que tenían en la entrada. Insertion, Bubble y Merge Sort son estables. Selection y Shell Sort no lo garantizan, porque hacen intercambios a distancia que pueden adelantar un elemento igual.',
      sencilla: 'Si dos alumnos sacaron la misma nota, un método estable los deja en el mismo orden en que estaban en la lista original.',
      ejemplo: 'Entrada [2a, 2b, 1]. Selection intercambia el 1 con el primer 2 → [1, 2b, 2a]: cambió el orden de los iguales. Bubble solo intercambia vecinos distintos → [1, 2a, 2b].',
      detalle: 'La estabilidad importa cuando ordenas por una clave pero quieres conservar otra (por ejemplo, ordenar por apellido manteniendo el orden por nombre). Merge Sort en este módulo toma primero el elemento izquierdo ante iguales, lo que lo hace estable.',
      relacionadas: ['ordenamiento.repetidos-identidad', 'ordenamiento.comparar']
    },
    {
      id: 'ordenamiento.selection', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Cómo funciona Selection Sort?',
      variantes: ['que es selection sort', 'que hace selection sort', 'explicame selection sort', 'ordenamiento por seleccion', 'como funciona el metodo de seleccion'],
      conceptos: ['selection', 'seleccion', 'minimo actual'],
      breve: 'Selection Sort busca el menor valor de la parte no ordenada y lo coloca al frente, intercambiándolo con el primer elemento pendiente. Repite con el resto hasta terminar. Siempre hace alrededor de n²/2 comparaciones, pero como mucho n − 1 intercambios.',
      sencilla: 'Miras todas las cartas, tomas la más pequeña y la pones al principio. Luego repites con las que quedan.',
      ejemplo: '[5, 2, 9, 1] → menor es 1, intercambio con 5 → [1, 2, 9, 5] → menor del resto es 2, ya está → [1, 2, 9, 5] → menor es 5 → [1, 2, 5, 9].',
      detalle: 'Complejidad O(n²) en todos los casos, incluso si la lista ya está ordenada. No es estable. En la pantalla, el celeste marca el mínimo actual y el verde las posiciones ya definitivas.',
      relacionadas: ['ordenamiento.comparar', 'ordenamiento.colores', 'ordenamiento.estabilidad']
    },
    {
      id: 'ordenamiento.insertion', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Cómo funciona Insertion Sort?',
      variantes: ['que es insertion sort', 'que hace insertion sort', 'explicame insertion sort', 'ordenamiento por insercion', 'como funciona el metodo de insercion', 'que es la clave en insertion'],
      conceptos: ['insertion', 'insercion', 'clave', 'prefijo'],
      breve: 'Insertion Sort recorre la lista tomando un elemento a la vez (la clave) y lo inserta en su lugar dentro de la parte izquierda ya ordenada, desplazando a los mayores una posición. Es muy rápido si la lista ya está casi ordenada.',
      sencilla: 'Es como ordenar cartas según las recibes: cada carta nueva la metes en su hueco entre las que ya tienes en la mano.',
      ejemplo: '[5, 2, 9, 1] → clave 2: se mueve antes del 5 → [2, 5, 9, 1] → clave 9: ya está → clave 1: se mueve al principio → [1, 2, 5, 9].',
      detalle: 'Complejidad O(n²) en el peor caso (lista invertida) y O(n) si ya está ordenada. Es estable. En este módulo cada desplazamiento de la clave se cuenta como un intercambio con su vecino. El prefijo verde está ordenado entre sí, pero puede recibir nuevos elementos.',
      relacionadas: ['ordenamiento.casos-ordenado-inverso', 'ordenamiento.shell', 'ordenamiento.estabilidad']
    },
    {
      id: 'ordenamiento.bubble', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Cómo funciona Bubble Sort?',
      variantes: ['que es bubble sort', 'que hace bubble sort', 'explicame bubble sort', 'ordenamiento burbuja', 'metodo de la burbuja', 'por que se llama burbuja'],
      conceptos: ['bubble', 'burbuja', 'vecinos'],
      breve: 'Bubble Sort compara cada par de vecinos y los intercambia si están en el orden equivocado. En cada pasada, el mayor «burbujea» hasta el final. Termina cuando una pasada completa no hace ningún intercambio.',
      sencilla: 'Vas por la fila de dos en dos: si el de la izquierda es mayor, se cambian de lugar. El más grande va subiendo como una burbuja hasta el final.',
      ejemplo: '[5, 2, 9, 1] → pasada 1: (5,2)→[2,5,9,1], (5,9) ok, (9,1)→[2,5,1,9]. Pasada 2: (2,5) ok, (5,1)→[2,1,5,9]. Pasada 3: (2,1)→[1,2,5,9]. Pasada 4: sin cambios → fin.',
      detalle: 'Complejidad O(n²); O(n) si ya está ordenada gracias a la parada anticipada. Es estable porque solo intercambia vecinos distintos. En la pantalla, el verde marca las posiciones finales del extremo derecho.',
      relacionadas: ['ordenamiento.comparar', 'ordenamiento.casos-ordenado-inverso', 'ordenamiento.estabilidad']
    },
    {
      id: 'ordenamiento.shell', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Cómo funciona Shell Sort y qué son los saltos?',
      variantes: ['que es shell sort', 'que hace shell sort', 'explicame shell sort', 'que son los saltos de shell', 'que es el gap en shell sort', 'que es la secuencia de saltos', 'por que shell compara elementos lejanos'],
      conceptos: ['shell', 'salto', 'saltos', 'gap', 'brecha', 'intervalo', 'lejanos'],
      breve: 'Shell Sort es una mejora de Insertion Sort: primero ordena elementos separados por un salto grande (por ejemplo, posiciones 1, 5, 9…), luego reduce el salto y repite, hasta terminar con salto 1, que es un Insertion Sort normal sobre una lista ya casi ordenada. Los saltos permiten mover elementos lejanos con pocos pasos.',
      sencilla: 'En vez de comparar vecinos, compara elementos a varias casillas de distancia. Así los valores muy desubicados viajan rápido. Al final, un repaso fino con salto 1 termina el trabajo.',
      ejemplo: 'Con 8 valores, los saltos son 4, 2, 1. Con salto 4 se comparan las posiciones 1–5, 2–6, 3–7, 4–8; con salto 2, 1–3, 3–5…; con salto 1, vecinos.',
      detalle: 'Este módulo usa la secuencia salto = n/2, n/4, …, 1 (parte entera). La complejidad depende de la secuencia; con esta es O(n²) en el peor caso pero mucho mejor en la práctica. No es estable. Los movimientos se cuentan como intercambios entre posiciones separadas por el salto.',
      relacionadas: ['ordenamiento.insertion', 'ordenamiento.comparar', 'ordenamiento.estabilidad']
    },
    {
      id: 'ordenamiento.merge', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Cómo funciona Merge Sort? ¿Qué son dividir y mezclar?',
      variantes: ['que es merge sort', 'que hace merge sort', 'explicame merge sort', 'ordenamiento por mezcla', 'que significa dividir y mezclar', 'que es la mezcla en merge sort', 'por que merge usa un arreglo auxiliar', 'que es el almacenamiento auxiliar'],
      conceptos: ['merge', 'mezcla', 'mezclar', 'dividir', 'division', 'auxiliar', 'mitades', 'segmento'],
      breve: 'Merge Sort divide la lista en mitades hasta tener segmentos de un solo elemento (que ya están ordenados) y luego los mezcla de dos en dos: compara las cabezas de ambos segmentos y copia la menor a un arreglo auxiliar, hasta vaciar los dos. Al final copia el resultado de vuelta.',
      sencilla: 'Parte el montón de cartas a la mitad una y otra vez hasta tener cartas sueltas. Luego junta montoncitos ordenados comparando siempre la primera carta de cada uno.',
      ejemplo: '[5, 2, 9, 1] → [5, 2] y [9, 1] → [5] [2] [9] [1] → mezclar: [2, 5] y [1, 9] → mezclar: [1, 2, 5, 9].',
      detalle: 'Complejidad O(n log n) siempre, incluso en el peor caso. Necesita memoria adicional del tamaño de la lista (el arreglo auxiliar), a diferencia de los otros cuatro métodos, que ordenan «en el sitio». Es estable: ante iguales toma primero el elemento izquierdo. En este módulo las escrituras en el auxiliar y las copias de vuelta cuentan como movimientos.',
      relacionadas: ['ordenamiento.comparar', 'basico.notacion-o', 'ordenamiento.estabilidad']
    },
    {
      id: 'ordenamiento.comparar', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿En qué se diferencian los cinco algoritmos de ordenamiento?',
      variantes: ['cual algoritmo de ordenamiento es mejor', 'diferencias entre los metodos de ordenamiento', 'cual es el mas rapido', 'comparacion de algoritmos de ordenamiento', 'cual elijo selection insertion bubble shell o merge', 'tabla comparativa de ordenamiento'],
      conceptos: ['diferencia', 'comparar', 'mejor', 'rapido', 'cual elijo'],
      breve: 'Selection: busca el mínimo y lo coloca; pocos intercambios, O(n²) siempre, no estable. Insertion: inserta cada elemento en la parte ordenada; O(n²), pero O(n) si ya está casi ordenado; estable. Bubble: intercambia vecinos; O(n²), O(n) si está ordenado; estable. Shell: Insertion con saltos decrecientes; más rápido en la práctica; no estable. Merge: divide y mezcla; O(n log n) siempre; necesita memoria auxiliar; estable.',
      sencilla: 'Para listas grandes, Merge es el más eficiente. Para listas casi ordenadas, Insertion es excelente. Bubble y Selection son los más fáciles de entender, pero los más lentos. Shell está en medio.',
      detalle: 'Prueba la misma lista con los cinco métodos y compara los contadores finales de comparaciones y movimientos. Con «Invertido» verás el peor caso de Insertion y Bubble; con «Casi ordenado», su mejor caso.',
      relacionadas: ['ordenamiento.selection', 'ordenamiento.insertion', 'ordenamiento.bubble', 'ordenamiento.shell', 'ordenamiento.merge', 'basico.complejidad']
    },
    {
      id: 'ordenamiento.casos-ordenado-inverso', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué pasa si la lista ya está ordenada o está invertida?',
      variantes: ['que pasa con una lista ya ordenada', 'que es el peor caso', 'que es el mejor caso', 'por que invertido tarda mas', 'lista invertida', 'casi ordenado que significa'],
      conceptos: ['ordenada', 'invertida', 'invertido', 'peor caso', 'mejor caso', 'casi ordenado'],
      breve: 'Una lista ya ordenada es el mejor caso de Insertion y Bubble: terminan en una pasada con n − 1 comparaciones y cero movimientos. Una lista invertida es su peor caso: necesitan el máximo de comparaciones e intercambios. Selection hace siempre las mismas comparaciones; Merge hace casi el mismo trabajo en cualquier caso.',
      sencilla: 'Si las cartas ya vienen ordenadas, Insertion y Bubble lo notan enseguida. Si vienen al revés, cada carta tiene que viajar hasta el otro extremo.',
      ejemplo: 'Con 8 valores invertidos, Bubble hace 28 comparaciones y 28 intercambios. Con 8 ya ordenados, hace 7 comparaciones y 0 intercambios.',
      relacionadas: ['ordenamiento.comparar', 'ordenamiento.insertion', 'ordenamiento.bubble'],
      referencia: 'Ordenamiento · botones «Casi ordenado» e «Invertido»'
    },
    {
      id: 'ordenamiento.contadores', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué cuentan los contadores de comparaciones e intercambios?',
      variantes: ['que significan los contadores', 'por que el contador de intercambios de merge es alto', 'como cuenta insertion los movimientos', 'los contadores son del paso actual o totales', 'que cuenta el contador'],
      conceptos: ['contador', 'contadores', 'cuenta', 'acumulado'],
      breve: 'Los contadores son acumulados hasta el paso que estás viendo. Cada comparación de dos valores suma una comparación. En intercambios/movimientos, cada método cuenta lo que realmente hace: Selection, Bubble y Shell cuentan intercambios de dos posiciones; Insertion cuenta cada desplazamiento de la clave; Merge cuenta escrituras en el auxiliar y copias de vuelta.',
      sencilla: 'El contador avanza con los pasos: si retrocedes, baja. Al llegar al final tienes los totales del método.',
      ejemplo: 'Merge con 8 valores: 3 niveles × 8 escrituras + copias de vuelta → su contador de movimientos es mayor que el de Selection, aunque Merge sea más rápido en comparaciones.',
      detalle: 'Por eso no conviene comparar «intercambios» entre métodos distintos sin tener en cuenta qué cuenta cada uno. Las comparaciones sí son comparables entre métodos.',
      relacionadas: ['ordenamiento.comparacion-intercambio', 'ordenamiento.comparar']
    },
    {
      id: 'ordenamiento.colores', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué significan los colores y marcas en Ordenamiento?',
      variantes: ['que significa el color amarillo', 'que significa el verde', 'que es el celeste', 'que significan los colores de los pinos', 'leyenda de colores', 'que significa la franja'],
      conceptos: ['colores', 'color', 'amarillo', 'verde', 'celeste', 'franja', 'leyenda', 'marcas'],
      breve: 'Amarillo: elementos que se están comparando. Celeste: mínimo actual (Selection). Color del módulo: elemento que se mueve o clave de inserción. Verde: posición definitiva en Selection y Bubble; en Insertion, prefijo ordenado que aún puede cambiar. Franja: sin revisar. Shell y Merge marcan todas las posiciones solo al terminar.',
      sencilla: 'Amarillo = «mirando», verde = «ya listo», celeste = «el más pequeño hasta ahora».',
      detalle: 'Además, el pseudocódigo resalta la línea que corresponde al evento actual, y el mapa de pasos resume hasta 120 marcas para saltar a cualquier momento.',
      relacionadas: ['ordenamiento.comparacion-intercambio', 'ejercicio.paso'],
      referencia: 'Ordenamiento · leyenda bajo el dibujo'
    },
    {
      id: 'ordenamiento.arreglos-grandes', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Cómo se muestran los arreglos grandes y cuáles son los límites?',
      variantes: ['por que ya no veo pinos sino barras', 'cuantos valores puedo poner', 'como veo todos los elementos', 'limite de valores en ordenamiento', 'por que hay desplazamiento horizontal'],
      conceptos: ['grande', 'grandes', 'barras', 'pinos', 'cuantos', 'limite', 'desplazamiento'],
      breve: L => 'Se admiten de ' + L.ordenCantidadMin + ' a ' + L.ordenCantidadMax + ' valores. Hasta 12 se dibujan como pinos con su número; con más, se muestran barras proporcionales con desplazamiento horizontal interno. «Consultar posición» permite leer el valor de cualquier posición sin depender del dibujo.',
      sencilla: 'Con pocos datos ves bolos con números; con muchos, barras de altura según el valor. Puedes desplazar el dibujo hacia los lados.',
      relacionadas: ['ordenamiento.reglas', 'ordenamiento.repetidos-identidad'],
      referencia: 'Ordenamiento · «Consultar posición»'
    },
    {
      id: 'ordenamiento.pausar-vs-cancelar', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué diferencia hay entre pausar la animación y cancelar la preparación?',
      variantes: ['que es cancelar preparacion', 'que significa preparando', 'pausar o cancelar', 'por que aparece preparando el procedimiento', 'que hace el boton cancelar preparacion'],
      conceptos: ['pausar', 'pausa', 'cancelar', 'preparacion', 'preparando'],
      breve: 'Pausar detiene la reproducción automática de pasos ya calculados; puedes seguir avanzando a mano. Cancelar la preparación interrumpe el cálculo del procedimiento (la generación de todos los eventos) cuando la lista es grande; entonces no hay pasos que ver hasta que vuelvas a preparar.',
      sencilla: 'Pausar es detener el video; cancelar la preparación es apagar la cámara antes de que termine de grabar.',
      detalle: 'La preparación ocurre al pulsar «Usar valores» o cambiar de método. El tiempo que tarda es el tiempo de cálculo real; la velocidad de reproducción es independiente.',
      relacionadas: ['basico.complejidad-vs-tiempo', 'aplicacion.pasos-controles'],
      referencia: 'Ordenamiento · «Reproducir» / «Cancelar preparación»'
    },
    {
      id: 'ordenamiento.reglas', tema: 'ordenamiento', modulos: ['ordenamiento'],
      pregunta: '¿Qué valores acepta Ordenamiento?',
      variantes: ['cuales son los limites de ordenamiento', 'puedo poner cero en ordenamiento', 'puedo poner negativos en ordenamiento', 'rango de valores de ordenamiento', 'acepta decimales ordenamiento'],
      conceptos: ['limites', 'reglas', 'rango', 'acepta', 'cuantos'],
      breve: L => 'De ' + L.ordenCantidadMin + ' a ' + L.ordenCantidadMax + ' enteros entre ' + L.ordenMin + ' y ' + L.ordenMax + ', separados por comas, espacios o punto y coma. Se permiten repetidos. No admite cero, negativos, decimales ni texto. Todos los métodos ordenan de menor a mayor.',
      relacionadas: ['ordenamiento.repetidos-identidad', 'ordenamiento.arreglos-grandes', 'problema.decimal'],
      referencia: 'Ordenamiento · campo «Valores»'
    },

    /* ---------------- Árboles ---------------- */
    {
      id: 'arboles.terminos', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué son raíz, nodo, enlace, padre, hijo, hermano, hoja y subárbol?',
      variantes: ['que es la raiz', 'que es una hoja', 'que es un nodo padre', 'que es un nodo hijo', 'que son nodos hermanos', 'que es un subarbol', 'partes de un arbol', 'que es un enlace en un arbol', 'terminos de arboles'],
      conceptos: ['raiz', 'hoja', 'hojas', 'padre', 'hijo', 'hijos', 'hermano', 'hermanos', 'subarbol', 'enlace', 'nodo'],
      breve: 'La raíz es el nodo superior, sin padre. Cada nodo guarda un valor y se une a otros mediante enlaces. El padre es el nodo inmediatamente arriba; los hijos, los inmediatamente abajo; los hermanos comparten padre. Una hoja no tiene hijos. Un subárbol es un nodo junto con todos sus descendientes.',
      sencilla: 'Es un árbol genealógico al revés: arriba el ancestro (raíz), abajo los descendientes. Los que no tienen descendientes son hojas.',
      ejemplo: 'Árbol con raíz 50, hijos 30 y 70, y 30 con hijo 20: 50 es raíz; 30 y 70 son hermanos e hijos de 50; 20 y 70 son hojas; {30, 20} es el subárbol izquierdo de 50.',
      detalle: 'Al seleccionar un nodo en el módulo, se informa su padre, sus hijos y si es raíz u hoja. En un árbol binario cada nodo tiene como máximo dos hijos: izquierdo y derecho.',
      relacionadas: ['arboles.profundidad-altura', 'arboles.binario-bst', 'grafo.arbol-bosque']
    },
    {
      id: 'arboles.profundidad-altura', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué son la profundidad y la altura de un árbol?',
      variantes: ['que es la altura del arbol', 'que es la profundidad de un nodo', 'diferencia entre altura y profundidad', 'que es el nivel de un nodo', 'como se mide la altura'],
      conceptos: ['profundidad', 'altura', 'nivel', 'niveles'],
      breve: 'La profundidad de un nodo es el número de enlaces desde la raíz hasta él (la raíz tiene profundidad 0). La altura del árbol es la mayor profundidad entre sus nodos, es decir, el número de enlaces del camino más largo desde la raíz hasta una hoja. Un árbol con un solo nodo tiene altura 0.',
      sencilla: 'Profundidad: cuántos pisos bajaste desde la raíz para llegar a ese nodo. Altura: cuántos pisos tiene el árbol en total.',
      ejemplo: 'Raíz 50 → 30 → 20: la profundidad de 20 es 2 y la altura del árbol es 2 (si no hay ramas más largas).',
      detalle: 'Esta es la convención que usa el dibujo del módulo para ubicar cada nivel (la raíz en el nivel 0). Algunos libros cuentan nodos en lugar de enlaces y obtienen un valor mayor en 1. El módulo no muestra un contador de altura explícito; se deduce del dibujo.',
      relacionadas: ['arboles.equilibrado-degenerado', 'arboles.terminos']
    },
    {
      id: 'arboles.binario-bst', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué diferencia hay entre árbol binario y árbol binario de búsqueda (BST)?',
      variantes: ['que es un arbol binario', 'que es un bst', 'que es un arbol binario de busqueda', 'bst y arbol binario son lo mismo', 'que significa bst', 'cual es la propiedad de busqueda'],
      conceptos: ['binario', 'bst', 'busqueda', 'propiedad', 'binary search tree'],
      breve: 'Un árbol binario es cualquier árbol donde cada nodo tiene como máximo dos hijos. Un árbol binario de búsqueda (BST) es un árbol binario que además cumple la propiedad de búsqueda: en cada nodo, todos los valores del subárbol izquierdo son menores y todos los del derecho son mayores. Todo BST es binario, pero no todo binario es BST.',
      sencilla: 'Binario: máximo dos ramas por nodo. BST: además, «lo pequeño a la izquierda, lo grande a la derecha» en todos los niveles.',
      ejemplo: 'Raíz 50 con hijos 30 (izquierda) y 70 (derecha) es BST. Raíz 50 con hijos 70 (izquierda) y 30 (derecha) es binario pero no BST.',
      detalle: 'La propiedad de búsqueda permite descartar un subárbol en cada comparación. Solo con un árbol equilibrado eso reduce aproximadamente a la mitad los candidatos; uno degenerado puede exigir revisar todos los nodos. En este módulo, el modo de búsqueda construye un BST insertando valores; la reconstrucción con recorridos puede producir un árbol binario general que no sea BST.',
      relacionadas: ['arboles.insercion', 'arboles.reconstruccion-no-bst', 'arboles.inorden-ordenado']
    },
    {
      id: 'arboles.insercion', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Cómo se inserta un valor en un BST y por qué se rechazan los duplicados?',
      variantes: ['como se agrega un nodo al arbol', 'por que no acepta valores repetidos', 'donde se coloca el nuevo valor', 'como funciona la insercion en bst', 'puedo insertar un valor que ya existe', 'no acepta valores repetidos'],
      conceptos: ['insertar', 'insercion', 'agregar', 'duplicado', 'duplicados', 'repetido', 'repetidos'],
      breve: 'Para insertar, se compara el valor nuevo con la raíz: si es menor va a la izquierda, si es mayor a la derecha; se repite con el hijo correspondiente hasta encontrar un hueco libre, donde se crea el nodo. Los duplicados se rechazan porque un valor igual no es ni menor ni mayor: romperían la propiedad de búsqueda tal como la define este módulo.',
      sencilla: 'El nuevo número baja por el árbol girando a la izquierda si es más pequeño y a la derecha si es más grande, hasta encontrar un lugar vacío.',
      ejemplo: 'Árbol 50 (30, 70). Insertar 40: 40 < 50 → izquierda; 40 > 30 → derecha de 30; hueco libre → 30 tiene hijo derecho 40.',
      detalle: 'El orden de inserción determina la forma del árbol: insertar 10, 20, 30 produce una cadena hacia la derecha; insertar 20, 10, 30 produce un árbol equilibrado con los mismos valores. «Quitar última inserción» revierte solo la última; no hay eliminación de un nodo arbitrario.',
      relacionadas: ['arboles.binario-bst', 'arboles.equilibrado-degenerado', 'arboles.operaciones'],
      referencia: 'Árboles · botón «Agregar»'
    },
    {
      id: 'arboles.equilibrado-degenerado', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué es un árbol equilibrado y uno degenerado?',
      variantes: ['que significa arbol balanceado', 'que es un arbol degenerado', 'por que mi arbol parece una lista', 'por que el arbol crece solo hacia un lado', 'la aplicacion balancea el arbol', 'que es un arbol avl'],
      conceptos: ['equilibrado', 'balanceado', 'balanceo', 'degenerado', 'desbalanceado', 'avl', 'lista'],
      breve: 'Un árbol está equilibrado cuando sus ramas tienen alturas parecidas, lo que mantiene la búsqueda rápida (O(log n)). Un árbol degenerado tiene todos sus nodos en una sola cadena, como una lista: la búsqueda se vuelve O(n). Un BST se degenera cuando insertas valores ya ordenados. Este módulo no balancea automáticamente.',
      sencilla: 'Equilibrado: frondoso y bajo. Degenerado: un palo largo con todos los nodos en fila. En el segundo, buscar es tan lento como recorrer una lista.',
      ejemplo: 'Insertar 1, 2, 3, 4, 5 en ese orden produce una cadena hacia la derecha de altura 4. Insertar 3, 1, 4, 2, 5 produce un árbol de altura 2 con los mismos valores.',
      detalle: 'Los árboles autobalanceados (AVL, rojo-negro) reorganizan los nodos al insertar para evitar la degeneración; no están implementados aquí. Puedes experimentar cambiando el orden de inserción o usando «Generar árbol».',
      relacionadas: ['arboles.insercion', 'arboles.profundidad-altura', 'basico.notacion-o', 'arboles.operaciones']
    },
    {
      id: 'arboles.recorridos', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué son los recorridos preorden, inorden y postorden?',
      variantes: ['que es preorden', 'que es inorden', 'que es postorden', 'diferencia entre preorden inorden y postorden', 'que es un recorrido de arbol', 'en que orden se visitan los nodos', 'que es preorder inorder postorder'],
      conceptos: ['recorrido', 'recorridos', 'preorden', 'inorden', 'postorden', 'preorder', 'inorder', 'postorder'],
      breve: 'Son tres formas de visitar todos los nodos de un árbol binario. Preorden: raíz, subárbol izquierdo, subárbol derecho. Inorden: izquierdo, raíz, derecho. Postorden: izquierdo, derecho, raíz. La diferencia es el momento en que se emite la raíz de cada subárbol: antes, en medio o después de sus hijos.',
      sencilla: 'Pre = la raíz primero. In = la raíz en medio. Post = la raíz al final. Y siempre izquierda antes que derecha.',
      ejemplo: 'Árbol 50 (30, 70): preorden 50, 30, 70; inorden 30, 50, 70; postorden 30, 70, 50.',
      detalle: 'Cada recorrido se define recursivamente: para recorrer un subárbol se aplica la misma regla. En el módulo puedes elegir el recorrido y avanzar evento por evento, distinguiendo «visitar» un nodo de «emitir» su valor.',
      relacionadas: ['arboles.visitar-vs-emitir', 'arboles.inorden-ordenado', 'arboles.reconstruccion'],
      referencia: 'Árboles · selector «Recorrido»'
    },
    {
      id: 'arboles.visitar-vs-emitir', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué diferencia hay entre visitar un nodo y emitir su valor?',
      variantes: ['que significa visitar', 'que significa emitir', 'por que el nodo se visita pero no sale en la salida', 'visitar y emitir son lo mismo', 'que es la salida del recorrido'],
      conceptos: ['visitar', 'visita', 'emitir', 'emite', 'salida', 'imprimir'],
      breve: 'Visitar un nodo es llegar a él durante el recorrido. Emitir su valor es agregarlo a la salida. En preorden ambas cosas ocurren a la vez; en inorden y postorden, el nodo se visita primero, luego se recorren sus hijos y solo después se emite. Por eso un nodo puede estar resaltado sin aparecer aún en la salida.',
      sencilla: 'Visitar es «pasar por la puerta»; emitir es «anotar el nombre en la lista». En algunos recorridos pasas por la puerta y vuelves más tarde a anotar.',
      ejemplo: 'Postorden en 50 (30, 70): se visita 50, se baja a 30 y se emite 30, se baja a 70 y se emite 70, y recién entonces se emite 50.',
      relacionadas: ['arboles.recorridos', 'ejercicio.paso']
    },
    {
      id: 'arboles.inorden-ordenado', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Por qué el inorden de un BST sale ordenado?',
      variantes: ['inorden da los valores ordenados', 'por que inorden ordena', 'el inorden siempre esta ordenado', 'inorden en un arbol que no es bst'],
      conceptos: ['inorden', 'ordenado', 'ordenados', 'creciente'],
      breve: 'Porque inorden emite primero todo el subárbol izquierdo (valores menores), luego la raíz y después el derecho (valores mayores). Como en un BST esa relación se cumple en cada nodo, la salida completa queda de menor a mayor. En un árbol binario que no sea BST, el inorden no tiene por qué salir ordenado.',
      sencilla: 'Inorden lee el árbol «de izquierda a derecha». En un BST, izquierda significa pequeño y derecha grande, así que sale ordenado.',
      ejemplo: 'BST 50 (30 (20, 40), 70): inorden 20, 30, 40, 50, 70. Árbol no BST 50 (70, 30): inorden 70, 50, 30, que no está ordenado.',
      relacionadas: ['arboles.recorridos', 'arboles.binario-bst', 'arboles.reconstruccion-no-bst']
    },
    {
      id: 'arboles.reconstruccion', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Cómo se reconstruye un árbol a partir de sus recorridos?',
      variantes: ['que es la reconstruccion', 'como reconstruyo un arbol con preorden e inorden', 'que recorridos necesito para reconstruir', 'como funciona reconstruir arbol', 'reconstruir con inorden y postorden'],
      conceptos: ['reconstruccion', 'reconstruir', 'reconstruido', 'a partir de'],
      breve: 'Se necesita el inorden más otro recorrido. Con preorden + inorden: el primer valor del preorden es la raíz; se busca en el inorden, y lo que queda a su izquierda forma el subárbol izquierdo y lo de la derecha el derecho; se repite en cada parte. Con inorden + postorden es igual, pero la raíz es el último valor del postorden.',
      sencilla: 'El preorden (o postorden) te dice quién es la raíz; el inorden te dice qué va a cada lado de ella. Combinándolos se arma el árbol pieza por pieza.',
      ejemplo: 'Preorden 50, 30, 70; inorden 30, 50, 70. Raíz 50. En inorden, 30 está a la izquierda y 70 a la derecha → árbol 50 (30, 70).',
      detalle: 'Los recorridos deben tener la misma longitud y los mismos valores, sin repetidos, y ser compatibles entre sí. Si no lo son, la aplicación lo informa y conserva el árbol anterior. El árbol resultante es binario general: no se comprueba ni se exige que sea BST.',
      relacionadas: ['arboles.pre-post-no-unico', 'arboles.reconstruccion-no-bst', 'arboles.recorridos'],
      referencia: 'Árboles · «Combinación de recorridos» y «Reconstruir árbol»'
    },
    {
      id: 'arboles.pre-post-no-unico', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Por qué preorden y postorden no determinan siempre un árbol único?',
      variantes: ['por que no puedo reconstruir solo con preorden y postorden', 'por que preorden y postorden necesitan inorden', 'preorden mas postorden', 'con preorden y postorden hay varios arboles'],
      conceptos: ['preorden', 'postorden', 'unico', 'ambiguo', 'ambiguedad'],
      breve: 'Porque cuando un nodo tiene un solo hijo, preorden y postorden no indican si ese hijo es izquierdo o derecho: ambas secuencias quedan iguales en los dos casos. El inorden sí lo distingue, por eso la opción «Preorden + postorden» de este módulo exige también el inorden.',
      sencilla: 'Pre y post dicen «quién es la raíz» pero no «de qué lado cuelga el hijo». Sin el inorden, hay dos árboles posibles.',
      ejemplo: 'Árbol 1 con hijo izquierdo 2, y árbol 1 con hijo derecho 2: ambos tienen preorden 1, 2 y postorden 2, 1. Sus inórdenes son distintos: 2, 1 y 1, 2.',
      detalle: 'Si todos los nodos internos tienen exactamente dos hijos (árbol binario lleno), preorden + postorden sí determinan el árbol. En general no, y por eso no se admite esa combinación sola.',
      relacionadas: ['arboles.reconstruccion', 'arboles.recorridos']
    },
    {
      id: 'arboles.reconstruccion-no-bst', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Por qué un árbol reconstruido puede no ser BST?',
      variantes: ['el arbol reconstruido es bst', 'por que no puedo insertar en el arbol reconstruido', 'reconstruccion y bst', 'el inorden del arbol reconstruido no esta ordenado'],
      conceptos: ['reconstruido', 'bst', 'no es bst', 'general'],
      breve: 'Porque la reconstrucción solo respeta el orden de los recorridos que escribiste, no la regla «menores a la izquierda, mayores a la derecha». Si tu inorden no está ordenado de menor a mayor, el árbol resultante es binario pero no BST. Por eso, para insertar nuevos valores con «Agregar», primero debes limpiar el árbol reconstruido.',
      sencilla: 'Reconstruir es «armar el dibujo que describen tus listas», sin preguntarse si los números están bien colocados para buscar.',
      ejemplo: 'Preorden 1, 2, 3; inorden 2, 1, 3 → árbol 1 (2, 3). Es binario, pero 2 está a la izquierda de 1 siendo mayor: no es BST.',
      relacionadas: ['arboles.binario-bst', 'arboles.inorden-ordenado', 'arboles.operaciones']
    },
    {
      id: 'arboles.operaciones', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué operaciones ofrece el módulo de Árboles? ¿Puedo eliminar o balancear?',
      variantes: ['puedo eliminar un nodo', 'como borro un nodo del arbol', 'la aplicacion balancea', 'que puedo hacer en arboles', 'operaciones disponibles en arboles', 'como elimino un valor del arbol', 'puedo buscar un valor'],
      conceptos: ['operaciones', 'eliminar', 'borrar', 'balancear', 'buscar', 'quitar'],
      breve: 'Operaciones disponibles: agregar un valor al BST, quitar la última inserción, limpiar el árbol, cargar el ejemplo de clase, generar un árbol con valores únicos al azar, reconstruir desde recorridos, seleccionar un nodo para ver padre e hijos, y recorrer en preorden, inorden o postorden paso a paso. No existe eliminación de un nodo arbitrario, ni balanceo automático, ni búsqueda animada de un valor.',
      sencilla: '«Quitar última inserción» solo deshace el último valor agregado, en orden inverso. Para quitar un nodo del medio tendrías que limpiar y volver a insertar los demás.',
      detalle: 'La eliminación en un BST (con los casos de hoja, un hijo y dos hijos) y el balanceo (AVL, rojo-negro) son operaciones clásicas que este módulo no implementa. Puedes simular el efecto de un orden de inserción distinto limpiando y agregando en otro orden.',
      relacionadas: ['arboles.insercion', 'arboles.equilibrado-degenerado', 'arboles.reconstruccion'],
      referencia: 'Árboles · botones «Agregar», «Quitar última inserción», «Limpiar árbol», «Generar árbol», «Reconstruir árbol»'
    },
    {
      id: 'arboles.reglas', tema: 'arboles', modulos: ['arboles'],
      pregunta: '¿Qué valores acepta el módulo de Árboles?',
      variantes: ['cuales son los limites de arboles', 'cuantos nodos puedo poner', 'rango de valores del arbol', 'arboles acepta decimales', 'arboles acepta negativos', 'puedo poner cero en el arbol'],
      conceptos: ['limites', 'reglas', 'rango', 'acepta', 'cuantos'],
      breve: L => 'Entre ' + L.arbolMin + ' y ' + L.arbolMax + ' valores enteros únicos de ' + L.arbolValorMin + ' a ' + L.arbolValorMax + '. Cero y negativos son válidos; no se admiten duplicados, decimales ni texto. Los recorridos de reconstrucción deben tener la misma longitud, los mismos valores y una estructura compatible.',
      relacionadas: ['arboles.insercion', 'arboles.reconstruccion', 'problema.repetidos'],
      referencia: 'Árboles · campo «Valor del nodo»'
    }
  ]);
})();
