/* Conocimiento de los algoritmos sobre grafos: Johnson, Dijkstra y Kruskal.
 * Los límites numéricos se leen de la configuración mediante la función L. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  K.registrar([
    /* ---------------- Johnson ---------------- */
    {
      id: 'johnson.que-es', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué resuelve Johnson y cuándo usarlo?',
      variantes: ['que es johnson', 'que es el algoritmo de johnson', 'para que sirve johnson', 'cuando uso johnson', 'que hace johnson', 'que calcula johnson', 'que problema resuelve johnson'],
      conceptos: ['johnson', 'todos los pares', 'pares'],
      breve: 'Johnson calcula la distancia mínima entre todos los pares de vértices de un grafo dirigido, incluso con pesos negativos, siempre que no haya ciclos negativos. Úsalo cuando necesites la tabla completa «de cada uno a cada uno».',
      sencilla: 'Dijkstra responde «desde aquí, ¿cuánto cuesta llegar a cada sitio?». Johnson responde esa pregunta para todos los puntos de salida a la vez, y además tolera conexiones con peso negativo.',
      ejemplo: 'Con vértices A, B y C, Johnson entrega una matriz 3×3: la celda (A, C) es el costo mínimo de A a C; la celda (C, A), el de C a A.',
      detalle: 'Combina dos algoritmos: Bellman-Ford una vez (desde un nodo auxiliar) para obtener potenciales y detectar ciclos negativos, y Dijkstra una vez desde cada vértice sobre los pesos reponderados. Es más eficiente que Floyd-Warshall en grafos con pocas conexiones.',
      relacionadas: ['johnson.todos-los-pares', 'johnson.nodo-auxiliar', 'johnson.bellman-ford', 'johnson.por-que-dijkstra', 'kruskal.vs-dijkstra-johnson'],
      referencia: 'Johnson · Grafo → Matriz → Paso a paso → Resultado'
    },
    {
      id: 'johnson.todos-los-pares', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué significa «distancias entre todos los pares»?',
      variantes: ['que es todos los pares', 'que significa distancia entre todos los pares', 'por que la matriz tiene una fila por nodo', 'distancias de todos a todos'],
      conceptos: ['todos los pares', 'pares', 'todos'],
      breve: 'Significa que el resultado incluye la distancia mínima de cada vértice a cada uno de los demás, no solo desde un origen. Con V vértices hay V × V parejas, por eso el resultado es una matriz cuadrada.',
      sencilla: 'Es una tabla de kilometraje como la de los mapas de carreteras: buscas la ciudad de salida en la fila y la de llegada en la columna.',
      ejemplo: 'Con 4 vértices la matriz tiene 16 celdas: 4 en la diagonal valen 0 y las otras 12 son las distancias entre vértices distintos.',
      relacionadas: ['johnson.que-es', 'matriz.distancias', 'johnson.interpretar-matriz']
    },
    {
      id: 'johnson.nodo-auxiliar', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué es el nodo auxiliar q?',
      variantes: ['que es el nodo q', 'por que se agrega un nodo nuevo', 'que es el vertice auxiliar', 'para que sirve el nodo auxiliar', 'de donde sale el nodo q'],
      conceptos: ['auxiliar', 'q', 'nuevo nodo', 'nodo extra'],
      breve: 'El nodo auxiliar q es un vértice temporal que Johnson añade con una conexión de peso 0 hacia cada vértice del grafo. Sirve para que Bellman-Ford pueda alcanzar a todos desde un único punto y calcular los potenciales. No modifica tu grafo: desaparece al terminar.',
      sencilla: 'Es un «punto de partida imaginario» conectado gratis a todos los demás, para medirlos a todos desde el mismo lugar.',
      ejemplo: 'Si tu grafo tiene A, B y C, el cálculo trabaja con q→A (0), q→B (0) y q→C (0) además de tus conexiones. En la pestaña Paso a paso aparece como «Nodo auxiliar q».',
      detalle: 'Como q llega a todos con peso 0, la distancia desde q a cada vértice (su potencial h) es siempre menor o igual que 0. Sin q, un vértice no alcanzable desde el origen elegido quedaría sin potencial.',
      relacionadas: ['johnson.bellman-ford', 'johnson.potenciales']
    },
    {
      id: 'johnson.bellman-ford', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué es Bellman-Ford y qué hace dentro de Johnson?',
      variantes: ['que es bellman ford', 'para que sirve bellman ford', 'que son las pasadas de bellman ford', 'por que johnson usa bellman ford', 'que hace bellman ford'],
      conceptos: ['bellman', 'ford', 'bellman-ford', 'pasadas', 'pasada'],
      breve: 'Bellman-Ford es un algoritmo de caminos mínimos desde un origen que admite pesos negativos. Repite «pasadas» en las que revisa todas las conexiones y mejora las distancias que puede. En Johnson se ejecuta una sola vez, desde el nodo auxiliar q, para obtener los potenciales y detectar ciclos negativos.',
      sencilla: 'En cada pasada revisa todas las conexiones y pregunta «¿llegar por aquí sale más barato?». Si tras muchas pasadas todavía mejora algo, es que hay un ciclo negativo.',
      ejemplo: 'Pasada 1: d(A) pasa de ∞ a 0 por q→A. Pasada 2: d(B) baja a −3 gracias a A→B (−3). Si ninguna distancia cambia en una pasada, termina antes.',
      detalle: 'Con V vértices (más q), bastan V pasadas para fijar las distancias si no hay ciclos negativos. La aplicación muestra cada pasada con las distancias antes y después y el número de mejoras (relajaciones). Una revisión adicional sin mejoras confirma que no hay ciclo negativo.',
      relacionadas: ['johnson.potenciales', 'johnson.ciclo-negativo', 'dijkstra.relajacion']
    },
    {
      id: 'johnson.potenciales', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué son los potenciales h(v)?',
      variantes: ['que es h de v', 'que significa potencial', 'para que sirven los potenciales', 'que son los potenciales', 'por que los potenciales son negativos o cero'],
      conceptos: ['potencial', 'potenciales', 'h(v)', 'h'],
      breve: 'El potencial h(v) de cada vértice es la distancia mínima desde el nodo auxiliar q hasta v, calculada con Bellman-Ford. Es un número que sirve para «corregir» los pesos y eliminar los negativos sin cambiar cuáles son los caminos mínimos.',
      sencilla: 'Es como asignar a cada ciudad una altura. Después se ajusta el costo de cada carretera según la diferencia de alturas, y así ninguna carretera queda con costo negativo.',
      ejemplo: 'Si h(A) = 0 y h(B) = −3, la conexión A→B de peso −3 se convierte en −3 + 0 − (−3) = 0.',
      detalle: 'Siempre h(v) ≤ 0 porque q llega a todos con peso 0. Si el grafo no tiene pesos negativos, todos los potenciales valen 0 y la reponderación no cambia nada; el procedimiento se muestra igual.',
      relacionadas: ['johnson.reponderacion', 'johnson.bellman-ford', 'johnson.nodo-auxiliar']
    },
    {
      id: 'johnson.reponderacion', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué es la reponderación y cómo se recuperan los pesos originales?',
      variantes: ['que es reponderar', 'que significa reponderacion', 'como se recuperan las distancias originales', 'que es w prima', 'por que cambian los pesos', 'formula de reponderacion'],
      conceptos: ['reponderacion', 'reponderar', 'reponderados', 'w prima', 'recuperar', 'originales'],
      breve: 'Reponderar es transformar cada peso con la fórmula w\'(u,v) = w(u,v) + h(u) − h(v), donde h son los potenciales. Los nuevos pesos nunca son negativos. Al final, la distancia real se recupera con d(u,v) = d\'(u,v) − h(u) + h(v).',
      sencilla: 'Primero se «suben» los pesos para que ninguno sea negativo, se calcula con Dijkstra, y después se «bajan» las distancias para volver a los valores verdaderos. Lo que se suma de ida se resta de vuelta.',
      ejemplo: 'Con h(A) = 0 y h(C) = −5: si Dijkstra reponderado da d\'(A,C) = 2, la distancia real es 2 − 0 + (−5) = −3.',
      detalle: 'Funciona porque en cualquier camino de u a v los términos intermedios se cancelan: la suma total cambia siempre en h(u) − h(v), que no depende del camino. Por eso el camino más corto con w\' es también el más corto con w.',
      relacionadas: ['johnson.potenciales', 'johnson.por-que-dijkstra']
    },
    {
      id: 'johnson.por-que-dijkstra', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Por qué Johnson utiliza Dijkstra?',
      variantes: ['por que johnson usa dijkstra', 'para que ejecuta dijkstra varias veces', 'por que no usa solo bellman ford', 'cuantas veces corre dijkstra'],
      conceptos: ['dijkstra', 'veces', 'ejecuta'],
      breve: 'Porque, una vez que los pesos son no negativos gracias a la reponderación, Dijkstra es más rápido que Bellman-Ford. Johnson ejecuta Dijkstra una vez desde cada vértice (V ejecuciones) y reúne los resultados en la matriz.',
      sencilla: 'Bellman-Ford es lento pero tolera negativos; Dijkstra es rápido pero no los tolera. Johnson usa Bellman-Ford una sola vez para quitar los negativos y luego Dijkstra muchas veces.',
      ejemplo: 'Con 5 vértices verás en el paso a paso 5 bloques «Dijkstra desde A», «Dijkstra desde B»…, cada uno con el orden en que fija los vértices.',
      detalle: 'La complejidad depende de cómo se implemente Dijkstra. Con montículos apropiados, Johnson puede alcanzar O(V · E + V² log V). Este proyecto selecciona el siguiente vértice mediante barrido lineal, por lo que su núcleo tiene costo O(V³ + V · E), sin contar las copias para explicar los pasos. Floyd-Warshall O(V³) es otra alternativa teórica y no está implementada en la interfaz.',
      relacionadas: ['dijkstra.que-es', 'johnson.reponderacion', 'basico.complejidad']
    },
    {
      id: 'johnson.ciclo-negativo', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué es un ciclo negativo en Johnson y por qué impide el resultado?',
      variantes: ['que es un ciclo negativo', 'me aparece un ciclo negativo', 'por que no calcula si hay ciclo negativo', 'que hago con el ciclo negativo', 'como corrijo un ciclo negativo', 'ciclo negativo detectado'],
      conceptos: ['ciclo negativo', 'ciclo', 'negativo'],
      breve: 'Un ciclo negativo es un recorrido cerrado cuya suma de pesos es menor que cero. Los pares que pueden pasar por ese ciclo no tienen un mínimo finito: cada vuelta reduce el costo. Este módulo de Johnson detecta ciclos negativos en cualquier componente y detiene el cálculo global, mostrando el ciclo en lugar de la matriz.',
      sencilla: 'Si hay un circuito que «paga» por recorrerlo, nadie puede decir cuál es el camino más barato: siempre se puede dar otra vuelta. Por eso el algoritmo se niega a inventar un número.',
      ejemplo: 'A→B (2), B→C (1), C→A (−6): la vuelta completa suma −3. La aplicación resaltará estas tres conexiones y pedirá corregirlas.',
      detalle: 'Un par origen-destino queda afectado cuando el origen puede llegar al ciclo y desde el ciclo se puede llegar al destino; otros pares podrían conservar un mínimo matemático. La implementación global de Johnson aborta ante cualquier ciclo negativo porque necesita potenciales válidos para todos. Para continuar, corrige el ciclo señalado y recalcula. Un ciclo de suma 0 y los pesos negativos sin ciclo negativo sí se admiten.',
      relacionadas: ['grafo.pesos-negativos', 'johnson.bellman-ford', 'problema.ciclo-negativo']
    },
    {
      id: 'johnson.sin-camino', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué significa ∞ o «sin camino» en la matriz de Johnson?',
      variantes: ['por que hay infinito en la matriz', 'que significa infinito en johnson', 'por que un nodo no tiene camino', 'vertices sin camino', 'celda con infinito'],
      conceptos: ['infinito', 'sin camino', 'inalcanzable'],
      breve: '∞ en la celda (A, B) significa que no existe ninguna secuencia de conexiones que vaya de A a B respetando los sentidos. No es un error ni un costo enorme: es «imposible llegar».',
      sencilla: 'Es como buscar una ruta en coche a una isla sin puente: no hay camino, por mucho que pagues.',
      ejemplo: 'Con la única conexión A→B, la celda (A, B) tiene el peso de la conexión y la celda (B, A) tiene ∞: no hay forma de volver.',
      detalle: 'Como Johnson trabaja con grafos dirigidos, es frecuente que (A, B) sea finita y (B, A) sea ∞. Este editor prohíbe conexiones opuestas para una misma pareja: para permitir el regreso puedes conectar a través de otro vértice, respetando esa restricción del editor.',
      relacionadas: ['matriz.cero-vacio-infinito', 'grafo.conectividad', 'johnson.restriccion-editor']
    },
    {
      id: 'johnson.interpretar-matriz', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Cómo interpreto la matriz de resultados y las rutas de Johnson?',
      variantes: ['como leo el resultado de johnson', 'como veo la ruta de una celda', 'que significa la fila y la columna del resultado', 'como se lee la matriz final', 'donde veo el camino'],
      conceptos: ['interpretar', 'ruta', 'rutas', 'resultado', 'matriz final'],
      breve: 'El grafo y el resumen muestran la ruta completa, los pesos originales de sus tramos y su costo total. Elige origen, destino y objetivo cerca del grafo. La matriz es una consulta secundaria de mínimos: fila = origen, columna = destino, diagonal = 0 y ∞ = sin camino. Seleccionar una celda consulta esa ruta mínima.',
      sencilla: 'Lee como un horario de trenes: fila «salgo de», columna «llego a». El número es el costo total del mejor recorrido.',
      ejemplo: 'Si la celda (A, D) marca 7 y al seleccionarla se resalta A → B → D, significa que ir por B cuesta 7 y no hay forma más barata.',
      detalle: 'El resultado usa costos originales; los pesos reponderados se explican únicamente en el procedimiento. Una consulta válida del origen a sí mismo da costo 0 y ruta de un solo nodo. Mover o renombrar conserva el cálculo; cambiar pesos o conexiones lo invalida. El máximo sobre DAG es un cálculo adicional, y los valores del nodo siguen significando mínimo | máximo aunque elijas un solo objetivo.',
      relacionadas: ['matriz.leer-posicion', 'matriz.distancias', 'johnson.sin-camino', 'johnson.valores-t', 'johnson.tiempos-holguras', 'ejercicio.celda'],
      referencia: 'Johnson · pestaña 4 Resultado'
    },
    {
      id: 'johnson.restriccion-editor', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Por qué el editor de Johnson no permite bucles, duplicados ni conexiones inversas?',
      variantes: ['por que no puedo conectar b con a si ya existe a con b', 'por que no me deja la conexion inversa', 'johnson permite conexiones en ambos sentidos', 'es una limitacion de johnson', 'regla del editor de johnson', 'por que johnson no acepta aristas opuestas'],
      conceptos: ['editor', 'restriccion', 'inversa', 'inversas', 'opuesta', 'duplicado', 'bucle'],
      breve: 'Es una regla de este editor, no del algoritmo. El algoritmo de Johnson funciona perfectamente con conexiones A→B y B→A a la vez. La aplicación las bloquea para que la matriz de adyacencia y el dibujo sean sencillos de leer en clase.',
      sencilla: 'El programa pone una regla de «una sola conexión por pareja» para que el grafo no se vuelva confuso. Johnson, como método matemático, no tiene esa limitación.',
      ejemplo: 'Si ya existe A→B, el editor rechaza B→A. Para que B pueda llegar a A, conecta B con otro vértice que sí llegue a A (por ejemplo, B→C y C→A).',
      detalle: 'Sí se permiten pesos negativos y ciclos de tres o más vértices (A→B→C→A). Los bucles (A→A) y las conexiones duplicadas tampoco se admiten. Dijkstra en modo dirigido, en cambio, sí admite A→B y B→A como conexiones diferentes.',
      relacionadas: ['grafo.aristas-duplicadas-opuestas', 'grafo.bucle', 'basico.validacion-limites', 'johnson.regla-vs-algoritmo'],
      referencia: 'Johnson · herramienta Conectar'
    },
    {
      id: 'johnson.regla-vs-algoritmo', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué diferencia hay entre la regla del editor y lo que permite el algoritmo de Johnson?',
      variantes: ['restriccion del editor vs limitacion matematica', 'que limita el algoritmo y que limita la aplicacion', 'johnson matematico vs johnson de la aplicacion', 'que cosas prohibe johnson de verdad'],
      conceptos: ['regla', 'algoritmo', 'matematica', 'limitacion'],
      breve: 'El algoritmo de Johnson solo exige una cosa: que no haya ciclos negativos. Todo lo demás que rechaza el editor (bucles, duplicados, conexiones inversas, pesos fuera de rango, número de vértices) son decisiones de esta aplicación.',
      sencilla: 'Limitación matemática: «sin ciclos negativos». Reglas de la aplicación: «una conexión por pareja, sin bucles, pesos enteros en un rango». Las segundas podrían cambiarse; la primera no.',
      ejemplo: L => 'Un peso de ' + (L.peso + 1) + ' se rechaza por el rango del editor (máximo ' + L.peso + '), no porque Johnson no pueda calcularlo.',
      relacionadas: ['johnson.restriccion-editor', 'johnson.ciclo-negativo', 'basico.validacion-limites']
    },
    {
      id: 'johnson.reglas', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué valores acepta Johnson?',
      variantes: ['cuales son los limites de johnson', 'que pesos acepta johnson', 'johnson acepta negativos', 'johnson acepta decimales', 'rango de pesos de johnson'],
      conceptos: ['limites', 'reglas', 'pesos', 'rango', 'acepta'],
      breve: L => 'Pesos enteros entre −' + L.peso + ' y ' + L.peso + ', incluidos cero y negativos. No admite decimales. El editor prohíbe bucles, duplicados y conexiones inversas, pero sí permite ciclos de tres o más vértices. Nombres de vértice de hasta ' + L.nombreVertice + ' caracteres.',
      relacionadas: ['johnson.restriccion-editor', 'johnson.ciclo-negativo', 'problema.decimal'],
      referencia: 'Johnson · reglas del editor'
    },
    {
      id: 'johnson.valores-t', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Qué significan las dos casillas de los nodos en T de Johnson?',
      variantes: ['que significan los numeros de abajo', 'por que el destino tiene dos valores distintos', 'minimo maximo en el nodo', 'casillas del nodo t', 'por que sale 19 y 58', 'como leo los nodos divididos'],
      conceptos: ['casillas', 'compartimentos', 'minimo', 'maximo', 'valores', 'nodo t'],
      breve: 'En «Consulta de caminos», el nombre ocupa la parte superior; abajo izquierda está la distancia mínima desde el origen y abajo derecha la máxima sobre DAG desde ese mismo origen. Son dos datos independientes: elegir una ruta no obliga a que coincidan, tampoco en el destino.',
      ejemplo: 'Con A→B=58, A→E=6, E→D=5 y D→B=8, el mínimo A→E→D→B cuesta 19 y el máximo A→B cuesta 58. B muestra 19 | 58, tanto al minimizar como al maximizar.',
      detalle: 'El costo del recorrido elegido aparece en su resumen, con secuencia y suma de pesos originales. Si hay ciclos, el máximo no está disponible y muestra — con una explicación; eso no afirma que sea infinito. Al cambiar a «Tiempos y holguras» las dos casillas cambian de significado a temprano | tardío y se recalculan con las reglas temporales.',
      relacionadas: ['johnson.maximos-dag', 'johnson.tiempos-holguras', 'johnson.interpretar-matriz'],
      referencia: 'Johnson · Resultado → Vista → Consulta de caminos'
    },
    {
      id: 'johnson.maximos-dag', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Cómo se calcula el camino máximo y por qué puede estar bloqueado?',
      variantes: ['johnson maximizar', 'maximo no disponible', 'por que no calcula el maximo', 'maximos en dag', 'maximo con ciclos', 'johnson invierte comparaciones'],
      conceptos: ['maximos', 'maximo', 'dag', 'aciclico', 'bloqueado'],
      breve: 'El máximo es un análisis adicional sobre un grafo dirigido acíclico (DAG), mediante orden topológico y programación dinámica. Johnson sigue calculando mínimos entre pares: el máximo no se obtiene invirtiendo sus comparaciones.',
      detalle: 'Esta versión exige que todo el grafo sea acíclico, incluso las componentes ajenas al origen. Si encuentra un ciclo, bloquea el máximo y muestra —; no lo declara infinito automáticamente. En un DAG admite pesos negativos, cero y positivos. «Comparar mínimo y máximo» permite distinguir ambas rutas y sus aristas compartidas.',
      relacionadas: ['johnson.valores-t', 'johnson.alternativas', 'dijkstra.caminos-maximos']
    },
    {
      id: 'johnson.tiempos-holguras', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Cómo funcionan los tiempos tempranos, tardíos y las holguras?',
      variantes: ['tiempos y holguras', 'tiempo temprano y tardio', 'como calculo la holgura', 'actividad critica', 'por que el destino muestra t t', 'red temporal', 'ruta critica'],
      conceptos: ['temprano', 'tardio', 'temporal', 'holgura', 'critica', 'duracion'],
      breve: '«Tiempos y holguras» es un análisis temporal complementario: cada peso representa una duración. Requiere toda la red dirigida acíclica, duraciones no negativas, origen distinto del destino y algún camino entre ambos. Calcula únicamente la subred que participa en caminos de ese origen a ese destino; el resto sigue visible y atenuado.',
      sencilla: 'Temprano indica cuándo puede estar listo un punto según la cadena más larga que lo precede. Tardío indica hasta cuándo puede esperar sin retrasar el final. La holgura de una actividad mide cuánto margen tiene.',
      ejemplo: 'En el ejemplo «Rutas y tiempos (19 / 58)»: A=0 | 0, E=6 | 45, D=11 | 50 y B=58 | 58. A→B tiene holgura 0; A→E, E→D y D→B tienen holgura 39 cada una. En consulta de caminos B era 19 | 58: son interpretaciones diferentes.',
      detalle: 'Temprano(origen)=0; en orden topológico, temprano(v)=máx(temprano(u)+duración(u,v)). T=temprano(destino), y tardío(destino)=T; hacia atrás, tardío(u)=mín(tardío(v)−duración(u,v)). Holgura(u→v)=tardío(v)−temprano(u)−duración(u,v). Es crítica una actividad de holgura 0, con tolerancia de redondeo; que sus dos nodos tengan temprano=tardío no basta. El destino muestra T | T por la condición inicial del cálculo hacia atrás. Este análisis no es el cálculo de mínimos de Johnson.',
      relacionadas: ['johnson.valores-t', 'johnson.maximos-dag', 'johnson.reglas'],
      referencia: 'Johnson · Resultado → Vista → Tiempos y holguras'
    },
    {
      id: 'johnson.alternativas', tema: 'johnson', modulos: ['johnson'],
      pregunta: '¿Cómo comparo rutas y busco alternativas sin bloquear el grafo?',
      variantes: ['buscar alternativas', 'colores de los caminos', 'seleccionar una ruta', 'cancelar busqueda', 'lista parcial de caminos', 'busqueda truncada', 'todos los caminos'],
      conceptos: ['alternativas', 'colores', 'seleccionar ruta', 'cancelar', 'truncada', 'lista parcial'],
      breve: 'Usa «Comparar mínimo y máximo» para las rutas principales y «Buscar alternativas» cuando quieras explorar otras rutas simples, sin repetir nodos. Cada ruta ofrece identificador, color, secuencia y costo; seleccionarla la destaca. La leyenda y el texto permiten reconocerla además del color.',
      detalle: 'La búsqueda se inicia bajo petición, cede el control al navegador y permite «Cancelar búsqueda». Está limitada a 30 rutas y 10000 aristas examinadas; si se cancela o alcanza un límite, se avisa que la lista es parcial. El orden es de exploración y no garantiza las mejores alternativas. Los motores de Johnson y máximo DAG calculan las rutas principales independientemente de esa lista. Los resultados y colores son estáticos, sin reproducción automática.',
      relacionadas: ['johnson.maximos-dag', 'johnson.interpretar-matriz', 'grafos.edicion-fase1'],
      referencia: 'Johnson · Resultado → Buscar alternativas'
    },
    {
      id: 'grafos.edicion-fase1', tema: 'grafo', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Cómo creo, conecto, muevo y edito los puntos del grafo?',
      variantes: ['como creo nodos', 'crear puntos', 'conectar extremos', 'cancelar una conexion', 'editar una conexion', 'mover nodos en tactil', 'organizar grafo', 'ampliar restaurar grafo'],
      conceptos: ['crear', 'editar', 'mover', 'renombrar', 'conectar', 'cancelar conexion', 'organizar', 'ampliar'],
      breve: 'Elige la herramienta para crear un nodo o punto y pulsa el fondo del grafo. Para conectar, selecciona la herramienta de conexión, toca sus dos extremos e indica el peso. «Cancelar conexión» descarta el extremo pendiente. Selecciona un nodo o conexión para renombrar, cambiar peso o eliminar con sus controles.',
      detalle: 'Puedes arrastrar puntos y usar los formularios como alternativa accesible. Eliminar un nodo elimina también sus conexiones incidentes. «Deshacer» y «Rehacer» recuperan ediciones. Zoom, desplazamiento y ajustar/ver todo cambian el encuadre; ampliar/restaurar conserva el ejercicio. «Organizar grafo» redistribuye posiciones solo cuando lo pides: recalcular o seleccionar otra ruta no reorganiza tus puntos. Se aplican las reglas particulares del módulo; una operación inválida explica el motivo y conserva el ejercicio anterior.',
      relacionadas: ['johnson.reglas', 'dijkstra.reglas', 'kruskal.reglas', 'grafos.estado-fase1'],
      referencia: 'Johnson, Dijkstra y Kruskal · herramientas del grafo y formularios'
    },
    {
      id: 'grafos.estado-fase1', tema: 'grafo', modulos: ['johnson', 'dijkstra', 'kruskal'],
      pregunta: '¿Qué cambios conservan el resultado y cuáles obligan a recalcular?',
      variantes: ['resultado vigente', 'mover conserva el resultado', 'renombrar conserva calculo', 'por que tengo que recalcular', 'importacion invalida', 'cambiar destino sin recalcular', 'dijkstra rapido y resultado'],
      conceptos: ['estado', 'vigente', 'recalcular', 'conserva', 'invalida', 'importar'],
      breve: 'Mover o renombrar nodos conserva los cálculos válidos y actualiza los textos. Cambiar pesos, conexiones o nodos altera los datos matemáticos y elimina resultados y resaltados anteriores. Dijkstra invalida también al cambiar modo u origen, y Kruskal al cambiar objetivo. Cambiar solo el destino de Dijkstra reutiliza las distancias del origen.',
      detalle: 'Cambiar entre consulta de caminos y tiempos/holguras usa los datos correspondientes a esa operación. Dijkstra rápido dentro de Johnson tiene su propia visualización; volver a Resultado recupera la consulta de Johnson. Importar un documento inválido conserva el ejercicio activo y explica el error. Los documentos recuperados se validan y los resultados se recalculan: una respuesta guardada no se acepta como autoridad matemática. Nombres y posiciones no sustituyen los IDs que mantienen las referencias.',
      relacionadas: ['grafos.edicion-fase1', 'johnson.valores-t', 'dijkstra.arbol-ruta', 'kruskal.resultado']
    },

    /* ---------------- Dijkstra ---------------- */
    {
      id: 'dijkstra.que-es', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué resuelve Dijkstra?',
      variantes: ['que es dijkstra', 'que es el algoritmo de dijkstra', 'para que sirve dijkstra', 'que hace dijkstra', 'cuando uso dijkstra', 'que calcula dijkstra', 'caminos minimos desde un origen'],
      conceptos: ['dijkstra', 'camino minimo', 'caminos minimos', 'origen'],
      breve: 'Dijkstra calcula el camino de menor costo desde un vértice origen hasta todos los demás, en grafos con pesos no negativos. Entrega una distancia por vértice y el predecesor de cada uno, con lo que se reconstruye la ruta.',
      sencilla: 'Es el método de los mapas: desde donde estás, encuentra la forma más barata de llegar a cada lugar, sin probar todas las combinaciones.',
      ejemplo: 'Origen A con A→B (4), A→C (1), C→B (2): la distancia a B es 3 (por C), no 4. El predecesor de B es C y el de C es A.',
      detalle: 'Funciona por etapas: mantiene distancias tentativas, elige siempre el vértice pendiente más cercano, lo marca como finalizado y revisa sus conexiones (relajación). Con pesos no negativos, un vértice finalizado ya no mejora.',
      relacionadas: ['dijkstra.distancias-tentativas', 'dijkstra.relajacion', 'dijkstra.pendientes-finalizados', 'dijkstra.pesos-negativos', 'grafo.camino-minimo-vs-arbol'],
      referencia: 'Dijkstra · etapas Grafo → Origen → Pasos → Resultado'
    },
    {
      id: 'dijkstra.distancias-tentativas', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué son las distancias tentativas?',
      variantes: ['que es una distancia tentativa', 'por que las distancias cambian durante los pasos', 'que significa distancia provisional', 'por que empieza en infinito'],
      conceptos: ['tentativa', 'tentativas', 'provisional', 'estimacion'],
      breve: 'Una distancia tentativa es el mejor costo conocido hasta el momento para llegar a un vértice. Empieza en 0 para el origen y en ∞ para los demás, y va bajando cuando se descubren caminos mejores. Cuando el vértice se finaliza, deja de ser tentativa y pasa a ser definitiva.',
      sencilla: '«Hasta ahora, lo más barato que sé para llegar a B es 7.» Si luego descubro un camino de 5, lo actualizo.',
      ejemplo: 'Paso 1: d(B) = ∞. Paso 2: se revisa A→B (4), d(B) = 4. Paso 3: se revisa C→B con d(C) = 1, candidata 1 + 2 = 3 < 4, d(B) = 3.',
      relacionadas: ['dijkstra.relajacion', 'dijkstra.pendientes-finalizados', 'dijkstra.infinito']
    },
    {
      id: 'dijkstra.relajacion', tema: 'dijkstra', modulos: ['dijkstra', 'johnson'],
      pregunta: '¿Qué es la relajación de una arista?',
      variantes: ['que significa relajar', 'que es relajar una arista', 'que es la relajacion', 'que es la distancia candidata', 'por que dice que no hay mejora'],
      conceptos: ['relajacion', 'relajar', 'candidata', 'mejora', 'mejoras'],
      breve: 'Relajar la conexión u→v es comprobar si llegar a v pasando por u sale más barato: se calcula la candidata d(u) + peso(u,v) y, si es menor que la distancia actual d(v), se actualiza d(v) y se anota u como predecesor de v. Si no es menor, no hay mejora y nada cambia.',
      sencilla: 'Es preguntar: «¿Y si voy a v pasando por u? ¿Me ahorro algo?». Si sí, apunto el nuevo precio; si no, lo dejo como estaba.',
      ejemplo: 'd(C) = 1, conexión C→B peso 2, d(B) actual 4. Candidata 1 + 2 = 3 < 4: hay mejora, d(B) pasa a 3 y el predecesor de B es C.',
      detalle: 'En los pasos de Dijkstra la aplicación muestra «Conexión revisada», la distancia anterior, la candidata y si registró mejora. Bellman-Ford (dentro de Johnson) hace la misma operación, pero sobre todas las conexiones en cada pasada.',
      relacionadas: ['dijkstra.distancias-tentativas', 'dijkstra.predecesores', 'johnson.bellman-ford']
    },
    {
      id: 'dijkstra.pendientes-finalizados', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué son los vértices pendientes y finalizados?',
      variantes: ['que significa finalizado', 'que es un vertice pendiente', 'que significa que un nodo esta fijado', 'por que elige ese nodo', 'como elige el siguiente nodo', 'que es el conjunto de visitados'],
      conceptos: ['pendiente', 'pendientes', 'finalizado', 'finalizados', 'fijado', 'visitado', 'visitados', 'elige'],
      breve: 'Los pendientes son los vértices cuya distancia todavía puede mejorar. Los finalizados ya tienen su distancia definitiva. En cada paso Dijkstra toma el pendiente con menor distancia tentativa, lo finaliza y revisa sus conexiones.',
      sencilla: 'Es como una lista de espera: siempre atiendes primero al que está más cerca. Una vez atendido, su distancia no cambia más.',
      ejemplo: 'Pendientes: B (4), C (1), D (∞). Se finaliza C porque 1 es la menor. Luego se revisan las conexiones que salen de C.',
      detalle: 'La garantía de que un finalizado no mejora depende de que no haya pesos negativos. Cuando varios pendientes empatan, se toma el primero en el orden de la lista de vértices (desempate determinista).',
      relacionadas: ['dijkstra.que-es', 'dijkstra.empates', 'dijkstra.pesos-negativos']
    },
    {
      id: 'dijkstra.predecesores', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué es un predecesor y cómo se reconstruye la ruta?',
      variantes: ['que es el predecesor', 'que significa la tabla de predecesores', 'como se reconstruye el camino', 'como saco la ruta a partir de los predecesores', 'de donde sale el camino resaltado', 'que es el nodo anterior'],
      conceptos: ['predecesor', 'predecesores', 'anterior', 'reconstruir', 'reconstruccion', 'ruta'],
      breve: 'El predecesor de un vértice es el vértice inmediatamente anterior en su camino mínimo desde el origen. Para reconstruir la ruta hasta un destino se parte de él y se sigue la cadena de predecesores hacia atrás hasta llegar al origen; luego se invierte.',
      sencilla: 'Cada punto recuerda «desde dónde llegué». Para saber el camino completo, vas preguntando hacia atrás hasta volver a casa.',
      ejemplo: 'Predecesores: pred(D) = B, pred(B) = C, pred(C) = A. Ruta de A a D: A → C → B → D.',
      detalle: 'La tabla de predecesores define el árbol de caminos mínimos desde el origen. Elegir un destino sigue esa tabla para resaltar una ruta concreta, con sus pesos y costo; no vuelve a ejecutar Dijkstra. «Ver árbol de predecesores» muestra las conexiones del árbol completo sobre los nodos alcanzables. Un vértice con distancia ∞ no tiene predecesor.',
      relacionadas: ['dijkstra.relajacion', 'dijkstra.inalcanzables', 'ejercicio.resultado']
    },
    {
      id: 'dijkstra.pesos-cero', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Dijkstra acepta pesos cero?',
      variantes: ['puedo poner peso 0 en dijkstra', 'que pasa con una conexion de peso cero', 'peso cero es valido', 'conexion gratis'],
      conceptos: ['cero', 'peso 0', 'gratis'],
      breve: 'Sí. Un peso 0 es una conexión que no cuesta recorrer. Dijkstra la trata como cualquier otra: la distancia al otro extremo puede quedar igual que la del vértice actual.',
      ejemplo: 'A→B con peso 0: d(B) = d(A) = 0. El camino existe y es «gratis», que no es lo mismo que no existir (∞).',
      detalle: 'El ejemplo «Ceros y empates» del módulo muestra cómo varios caminos pueden tener la misma distancia y cómo se desempata.',
      relacionadas: ['matriz.cero-vacio-infinito', 'dijkstra.empates']
    },
    {
      id: 'dijkstra.pesos-negativos', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Por qué Dijkstra no admite pesos negativos?',
      variantes: ['por que no acepta negativos dijkstra', 'puedo poner un peso negativo en dijkstra', 'dijkstra con pesos negativos', 'que pasa si hay un peso negativo', 'no acepta numeros negativos'],
      conceptos: ['negativo', 'negativos'],
      breve: 'Porque Dijkstra da por definitiva la distancia de un vértice en cuanto lo finaliza, confiando en que ningún camino posterior puede ser más barato. Un peso negativo rompe esa confianza: un camino más largo podría terminar costando menos. Por eso esta implementación rechaza pesos negativos en la validación.',
      sencilla: 'Dijkstra piensa: «si ya llegué por 3, cualquier otro camino costará 3 o más». Con una carretera que te paga por recorrerla, eso deja de ser cierto.',
      ejemplo: 'A→B (1), A→C (2), C→B (−5). Dijkstra finaliza B con 1 y nunca descubre A→C→B, que cuesta −3.',
      detalle: 'Si tu problema tiene pesos negativos, usa Johnson, que los admite mientras no formen ciclos negativos. Es una limitación matemática del método, no solo una regla del editor.',
      relacionadas: ['grafo.pesos-negativos', 'johnson.que-es', 'problema.negativos']
    },
    {
      id: 'dijkstra.origen-igual-destino', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué pasa si el origen es igual al destino?',
      variantes: ['puedo elegir el mismo nodo como origen y destino', 'origen igual a destino', 'distancia del origen a si mismo', 'por que el origen tiene distancia cero'],
      conceptos: ['mismo', 'igual', 'a si mismo'],
      breve: 'La distancia del origen a sí mismo es 0 y la ruta es solo ese vértice: no hace falta moverse. Elegir el mismo vértice como destino es válido, pero no aporta un camino que recorrer.',
      ejemplo: 'Origen A, destino A: distancia 0, ruta «A».',
      relacionadas: ['grafo.origen-destino', 'matriz.diagonal']
    },
    {
      id: 'dijkstra.inalcanzables', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué significa que un vértice sea inalcanzable en Dijkstra?',
      variantes: ['por que un nodo queda en infinito', 'que significa sin camino en dijkstra', 'por que no llega a ese nodo', 'nodo inalcanzable', 'por que este nodo no tiene camino'],
      conceptos: ['inalcanzable', 'inalcanzables', 'sin camino', 'infinito'],
      breve: 'Un vértice es inalcanzable cuando no existe ninguna secuencia de conexiones desde el origen hasta él respetando los sentidos. Su distancia queda en ∞ («Sin camino») y no tiene predecesor. No es un fallo del cálculo.',
      sencilla: 'Desde donde saliste, no hay carretera que lleve hasta allí. Puede que exista una, pero en sentido contrario.',
      ejemplo: 'En modo dirigido con B→A como única conexión y origen A: B es inalcanzable (∞) porque la flecha va de B hacia A, no al revés.',
      detalle: 'Revisa si falta una conexión, si el sentido está invertido o si el modo del grafo debería ser no dirigido. Cambiar el modo o las conexiones invalida el resultado y exige recalcular.',
      relacionadas: ['dijkstra.infinito', 'grafo.conectividad', 'dijkstra.dirigido-vs-no-dirigido', 'problema.infinito']
    },
    {
      id: 'dijkstra.infinito', tema: 'dijkstra', modulos: ['dijkstra', 'johnson'],
      pregunta: '¿Qué significa infinito (∞) en las distancias?',
      variantes: ['que significa infinito', 'que es la distancia infinita', 'me sale infinito', 'por que aparece el simbolo de infinito', 'infinito es un error'],
      conceptos: ['infinito', 'infinita', '∞'],
      breve: '∞ significa que no existe camino desde el origen hasta ese vértice. No equivale a distancia cero ni a un número muy grande: representa «imposible llegar». Durante los pasos, ∞ también es el valor inicial de los vértices aún no descubiertos.',
      sencilla: 'Cero es «ya estoy aquí»; infinito es «no hay manera de llegar».',
      ejemplo: 'Al empezar, todos menos el origen valen ∞. Al terminar, los que siguen en ∞ son los inalcanzables.',
      relacionadas: ['dijkstra.inalcanzables', 'matriz.cero-vacio-infinito', 'johnson.sin-camino']
    },
    {
      id: 'dijkstra.empates', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Cómo resuelve Dijkstra los empates?',
      variantes: ['que pasa si dos caminos miden lo mismo', 'por que eligio ese camino y no el otro', 'empates en dijkstra', 'dos nodos con la misma distancia', 'hay otro camino con la misma distancia'],
      conceptos: ['empate', 'empates', 'misma distancia', 'igual'],
      breve: 'Si dos vértices pendientes tienen la misma distancia, se finaliza primero el que aparece antes en la lista de vértices. Si dos caminos a un vértice cuestan lo mismo, se conserva el primero encontrado: una candidata igual a la distancia actual no cuenta como mejora.',
      sencilla: 'Ante un empate, el programa no cambia de opinión: se queda con la primera ruta que encontró. Las dos son igual de buenas.',
      ejemplo: 'A→B (2), A→C (1), C→B (1): d(B) por A es 2 y por C también 2. Como A→B se revisó primero, el predecesor de B es A.',
      relacionadas: ['grafo.empates', 'basico.determinista', 'dijkstra.pendientes-finalizados']
    },
    {
      id: 'dijkstra.dirigido-vs-no-dirigido', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué cambia entre modo dirigido y no dirigido en Dijkstra?',
      variantes: ['que es el modo del grafo', 'dirigido o no dirigido en dijkstra', 'para que sirve cambiar el modo', 'si cambio el modo cambia el resultado'],
      conceptos: ['modo', 'dirigido', 'no dirigido'],
      breve: 'En modo dirigido cada conexión solo se recorre en el sentido de la flecha, y A→B y B→A son conexiones distintas. En modo no dirigido cada conexión funciona en ambos sentidos con el mismo peso. Cambiar el modo cambia qué vértices son alcanzables y, por tanto, el resultado, que se invalida.',
      ejemplo: 'Conexión única A→B: en dirigido, desde B no se llega a A (∞); en no dirigido, d(A) desde B es el peso de la conexión.',
      detalle: 'En no dirigido el editor no permite dos conexiones entre el mismo par, porque serían duplicadas. En dirigido sí permite la opuesta. Al pasar a no dirigido se fusionan las opuestas y se pide resolver cualquier diferencia de pesos; cancelar conserva el documento. Pasar a dirigido crea las dos direcciones de cada arista y valida el límite antes de aceptar el cambio.',
      relacionadas: ['grafo.dirigido-no-dirigido', 'grafo.aristas-duplicadas-opuestas', 'aplicacion.recalcular'],
      referencia: 'Dijkstra · campo «Modo del grafo»'
    },
    {
      id: 'dijkstra.caminos-maximos', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Por qué no basta invertir las comparaciones para calcular caminos máximos?',
      variantes: ['puedo usar dijkstra para el camino mas largo', 'como calculo el camino maximo', 'dijkstra para maximizar', 'camino mas largo con dijkstra', 'por que dijkstra solo calcula minimos'],
      conceptos: ['maximo', 'maximos', 'mas largo', 'maximizar', 'invertir'],
      breve: 'La propiedad que usa Dijkstra para fijar un vértice deja de estar garantizada al invertir las comparaciones. Por eso este módulo calcula mínimos. Si se permiten repeticiones, un ciclo de peso positivo situado en el recorrido puede hacer crecer el costo sin límite; la presencia de cualquier ciclo por sí sola no demuestra un máximo infinito.',
      sencilla: 'Dijkstra garantiza la ruta más barata con pesos no negativos. Cambiar «menor» por «mayor» no proporciona la misma garantía para la ruta más cara.',
      ejemplo: 'Multiplicar un peso positivo por −1 produce un peso negativo que Dijkstra no admite. Si un recorrido puede repetir un ciclo de suma positiva, tras invertir signos ese ciclo es negativo.',
      detalle: 'El camino simple más largo, sin repetir vértices, siempre tiene longitud finita en un grafo finito y es difícil de obtener en general (NP-duro). En grafos dirigidos acíclicos se resuelve por orden topológico; el módulo Johnson ofrece ese cálculo adicional. Kruskal ofrece máximo para un árbol o bosque de expansión, un problema diferente.',
      relacionadas: ['dijkstra.pesos-negativos', 'kruskal.minimo-maximo', 'grafo.camino-recorrido-ciclo']
    },
    {
      id: 'dijkstra.reglas', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué valores acepta Dijkstra?',
      variantes: ['cuales son los limites de dijkstra', 'cuantos nodos admite dijkstra', 'rango de pesos de dijkstra', 'dijkstra acepta decimales', 'limite de vertices y aristas'],
      conceptos: ['limites', 'reglas', 'pesos', 'rango', 'acepta', 'cuantos'],
      breve: L => 'Hasta ' + L.grafosNodos + ' vértices y ' + L.grafosAristas + ' aristas, con nombres de hasta ' + L.nombreVertice + ' caracteres. Pesos enteros entre 0 y ' + L.peso + ': no admite negativos ni decimales. Sin bucles ni duplicados; en modo dirigido se permiten A→B y B→A como conexiones diferentes.',
      relacionadas: ['dijkstra.pesos-negativos', 'dijkstra.dirigido-vs-no-dirigido', 'problema.decimal'],
      referencia: 'Dijkstra · «Cómo funciona y límites»'
    },
    {
      id: 'dijkstra.arbol-ruta', tema: 'dijkstra', modulos: ['dijkstra'],
      pregunta: '¿Qué diferencia hay entre el árbol de predecesores y la ruta al destino?',
      variantes: ['arbol de predecesores', 'ruta al destino', 'cambiar destino', 'ver arbol de caminos minimos', 'como leo resultado dijkstra'],
      conceptos: ['arbol', 'predecesores', 'ruta', 'destino', 'resultado'],
      breve: 'El árbol reúne una conexión predecesora por cada nodo alcanzable distinto del origen. La ruta al destino es solo la cadena de ese árbol que termina en el nodo elegido: el grafo distingue sus estilos. El resumen da origen, destino, secuencia, pesos originales y suma total; la tabla permite consultar distancias e inalcanzables.',
      detalle: 'El motor calcula las distancias desde un origen a todos los nodos. Por eso cambiar únicamente destino conserva el cálculo y reconstruye otra cadena de predecesores. Cambiar origen, pesos, topología o dirección exige recalcular. Un destino inalcanzable queda sin ruta; origen=destino produce un nodo y costo 0. Los nodos muestran datos propios de Dijkstra, no tiempos tempranos/tardíos.',
      relacionadas: ['dijkstra.predecesores', 'dijkstra.inalcanzables', 'grafos.estado-fase1']
    },

    /* ---------------- Kruskal ---------------- */
    {
      id: 'kruskal.que-es', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Qué resuelve Kruskal?',
      variantes: ['que es el algoritmo de kruskal', 'para que sirve kruskal', 'que hace kruskal', 'cuando uso kruskal', 'que calcula kruskal'],
      conceptos: ['kruskal', 'arbol de expansion', 'expansion'],
      breve: 'Kruskal construye un árbol de expansión de peso mínimo o máximo: elige conexiones que unen todos los vértices sin ciclos, minimizando o maximizando la suma según el objetivo. Si el grafo tiene grupos separados, produce un bosque. No necesita origen ni destino.',
      sencilla: 'Imagina pueblos que hay que conectar con carreteras gastando lo menos posible. Kruskal va eligiendo las carreteras más baratas, pero salta las que conectarían pueblos que ya están unidos.',
      ejemplo: 'Aristas A–B (1), B–C (2), A–C (3). Kruskal acepta A–B y B–C y descarta A–C porque A y C ya están conectados. Total: 3.',
      detalle: 'Ordena todas las aristas por peso y las recorre en orden; acepta una arista si sus extremos están en componentes distintas (Union-Find) y la rechaza si cerraría un ciclo. Termina con V − 1 aristas si el grafo es conectado.',
      relacionadas: ['kruskal.ordenacion', 'kruskal.detectar-ciclos', 'kruskal.union-find', 'kruskal.bosque', 'kruskal.vs-dijkstra-johnson'],
      referencia: 'Kruskal · etapas Grafo → Objetivo → Pasos → Resultado'
    },
    {
      id: 'kruskal.minimo-maximo', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Qué diferencia hay entre árbol de expansión mínimo y máximo?',
      variantes: ['que es el arbol de expansion minimo', 'arbol de expansion minimo', 'que es el arbol de expansion maximo', 'para que sirve el objetivo maximo', 'minimo o maximo en kruskal', 'que cambia al elegir maximo', 'arbol maximo'],
      conceptos: ['minimo', 'maximo', 'objetivo'],
      breve: 'El árbol de expansión mínimo conecta todos los vértices con la menor suma de pesos; el máximo, con la mayor. Kruskal resuelve ambos: solo cambia el orden en que recorre las aristas (de menor a mayor o de mayor a menor).',
      sencilla: 'Mínimo: gastar lo menos posible en carreteras. Máximo: por ejemplo, elegir las conexiones de mayor capacidad o confianza.',
      ejemplo: 'Con A–B (1), B–C (2), A–C (3): el árbol mínimo usa A–B y B–C (total 3); el máximo usa A–C y B–C (total 5).',
      relacionadas: ['kruskal.ordenacion', 'kruskal.que-es'],
      referencia: 'Kruskal · etapa 2 «Elige el objetivo»'
    },
    {
      id: 'kruskal.bosque', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Qué es un bosque de expansión y por qué me sale un bosque?',
      variantes: ['por que el resultado es un bosque', 'que significa bosque en kruskal', 'por que hay varias componentes', 'el resultado tiene grupos separados', 'bosque de expansion'],
      conceptos: ['bosque', 'componentes', 'grupos', 'separados'],
      breve: 'Un bosque de expansión es el resultado de Kruskal cuando el grafo no está conectado: un árbol por cada grupo de vértices que sí se conectan entre sí. No es un error; indica que no existen conexiones entre esos grupos.',
      sencilla: 'Si tus pueblos están en dos islas sin puente, obtendrás dos redes de carreteras separadas. Eso es un bosque.',
      ejemplo: 'Aristas A–B y C–D: el resultado tiene dos árboles ({A, B} y {C, D}) y 2 aristas en total. Un vértice aislado forma su propio árbol de un solo nodo.',
      detalle: 'Si quieres un único árbol, añade al menos una conexión entre los grupos y recalcula. El número de aristas final es V − C, donde C es la cantidad de componentes.',
      relacionadas: ['grafo.conectividad', 'kruskal.v-menos-1', 'grafo.arbol-bosque']
    },
    {
      id: 'kruskal.ordenacion', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Por qué Kruskal ordena las aristas primero?',
      variantes: ['por que se ordenan las conexiones', 'en que orden revisa las aristas', 'que es la ordenacion de aristas', 'como ordena kruskal'],
      conceptos: ['ordenar', 'ordenacion', 'orden', 'ordenadas'],
      breve: 'Porque la estrategia voraz de Kruskal consiste en considerar primero la arista más conveniente (la más barata en mínimo, la más cara en máximo). Al ordenarlas una sola vez, el recorrido posterior es directo.',
      sencilla: 'Es como hacer una lista de precios de menor a mayor y recorrerla comprando lo que sirve.',
      ejemplo: 'Aristas con pesos 5, 1, 3 → se revisan en el orden 1, 3, 5 para el objetivo mínimo.',
      detalle: 'En empates de peso, esta aplicación conserva el orden en que creaste las conexiones. La ordenación es la parte más costosa del algoritmo: O(E log E).',
      relacionadas: ['kruskal.empates', 'basico.voraz', 'kruskal.minimo-maximo']
    },
    {
      id: 'kruskal.detectar-ciclos', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Por qué Kruskal acepta o descarta una arista?',
      variantes: ['por que descarto esta conexion', 'por que rechazo una arista', 'por que eligio esta arista', 'como detecta un ciclo', 'que significa que la arista forma ciclo', 'cuando se acepta una arista'],
      conceptos: ['acepta', 'aceptada', 'descarta', 'descartada', 'rechaza', 'rechazada', 'ciclo', 'detectar'],
      breve: 'Acepta una arista si sus dos extremos pertenecen a componentes (grupos) distintas: unirlos no forma ciclo. La descarta si ambos extremos ya están en la misma componente, porque entonces cerraría un ciclo y un árbol no puede tenerlos.',
      sencilla: 'Antes de poner una carretera, pregunta: «¿estos dos pueblos ya están conectados por otro camino?». Si sí, la carretera sobra.',
      ejemplo: 'Ya aceptadas A–B y B–C. Llega A–C: A y C están en el mismo grupo → se descarta. Llega C–D: D está solo → se acepta.',
      detalle: 'La comprobación se hace con Union-Find: cada vértice tiene un representante de grupo; si los dos extremos tienen el mismo representante, hay ciclo. El paso a paso muestra las componentes antes y después de cada decisión.',
      relacionadas: ['kruskal.union-find', 'grafo.camino-recorrido-ciclo', 'ejercicio.arista']
    },
    {
      id: 'kruskal.union-find', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Qué son las componentes y Union-Find?',
      variantes: ['que es union find', 'que son las componentes en kruskal', 'que es el conjunto disjunto', 'que es el representante del grupo', 'como sabe si dos nodos estan conectados'],
      conceptos: ['union-find', 'union find', 'componentes', 'componente', 'conjuntos disjuntos', 'representante'],
      breve: 'Las componentes son los grupos de vértices que ya están conectados entre sí por aristas aceptadas. Union-Find es la estructura que gestiona esos grupos: «find» averigua a qué grupo pertenece un vértice y «union» fusiona dos grupos cuando se acepta una arista.',
      sencilla: 'Cada vértice lleva una etiqueta de equipo. Al aceptar una carretera entre dos equipos, se fusionan en uno. Si los dos extremos ya son del mismo equipo, la carretera forma ciclo.',
      ejemplo: 'Inicio: {A}, {B}, {C}, {D}. Aceptar A–B → {A, B}, {C}, {D}. Aceptar C–D → {A, B}, {C, D}. Aceptar B–C → {A, B, C, D}.',
      detalle: 'Al principio cada vértice es su propia componente (V grupos). Cada aceptación reduce el número de grupos en 1. El resultado final muestra las componentes que quedaron.',
      relacionadas: ['kruskal.detectar-ciclos', 'kruskal.v-menos-1', 'grafo.conectividad']
    },
    {
      id: 'kruskal.v-menos-1', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Por qué el árbol tiene V − 1 aristas (o V − C en un bosque)?',
      variantes: ['cuantas aristas tiene el arbol', 'que significa v menos 1', 'por que son n menos 1 conexiones', 'cuantas conexiones elige kruskal', 'v menos c'],
      conceptos: ['v-1', 'v menos 1', 'n-1', 'v menos c', 'cantidad de aristas'],
      breve: 'Un árbol con V vértices tiene exactamente V − 1 aristas: cada arista aceptada une dos grupos en uno, y hacen falta V − 1 uniones para pasar de V grupos a 1. Si el grafo tiene C componentes, el bosque tendrá V − C aristas.',
      sencilla: 'Para unir 5 pueblos en una sola red necesitas 4 carreteras: cada carretera «pega» dos grupos. Con menos, algo queda suelto; con más, hay un ciclo.',
      ejemplo: '6 vértices conectados → 5 aristas. 6 vértices en 2 grupos → 6 − 2 = 4 aristas.',
      relacionadas: ['grafo.arbol-bosque', 'kruskal.bosque', 'kruskal.union-find']
    },
    {
      id: 'kruskal.pesos-negativos-cero', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Kruskal acepta pesos negativos y cero?',
      variantes: ['puedo usar negativos en kruskal', 'que pasa con un peso negativo en kruskal', 'peso cero en kruskal', 'kruskal con pesos negativos'],
      conceptos: ['negativo', 'negativos', 'cero'],
      breve: 'Sí, ambos. Kruskal solo ordena las aristas y evita ciclos; el signo del peso no afecta a su lógica. Un peso negativo simplemente se coloca al principio de la lista en el objetivo mínimo.',
      ejemplo: 'Aristas A–B (−4), B–C (0), A–C (2): el árbol mínimo usa A–B y B–C con total −4.',
      detalle: 'Los pesos negativos son válidos para el árbol o bosque: Kruskal no repite recorridos y siempre descarta las aristas que cerrarían un ciclo. Un ciclo de suma negativa en el grafo de entrada no impide este cálculo. El ejemplo «Negativos, cero y empates» del módulo lo ilustra.',
      relacionadas: ['grafo.pesos-negativos', 'dijkstra.pesos-negativos', 'kruskal.reglas']
    },
    {
      id: 'kruskal.empates', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Qué pasa con los empates en Kruskal? ¿El árbol es único?',
      variantes: ['el arbol de expansion es unico', 'por que mi arbol es distinto al del libro', 'empates en kruskal', 'dos aristas con el mismo peso', 'puede haber otro arbol con el mismo total'],
      conceptos: ['empate', 'empates', 'unico', 'unicidad', 'mismo peso'],
      breve: 'Si hay aristas con el mismo peso, puede existir más de un árbol de expansión con el mismo total mínimo: el árbol no es único, aunque el total sí lo es. Esta aplicación desempata por el orden en que creaste las conexiones.',
      sencilla: 'Dos carreteras igual de baratas que sirven para lo mismo: cualquiera vale. El programa toma la que creaste primero.',
      ejemplo: 'Triángulo con las tres aristas de peso 1: cualquier par de ellas forma un árbol mínimo de total 2. Hay tres soluciones válidas.',
      detalle: 'Si todos los pesos son distintos, el árbol de expansión mínimo es único. Si tu profesor o libro muestran otro árbol con el mismo total, ambos son correctos.',
      relacionadas: ['grafo.empates', 'basico.determinista', 'kruskal.ordenacion']
    },
    {
      id: 'kruskal.vs-dijkstra-johnson', tema: 'kruskal', modulos: ['kruskal', 'dijkstra', 'johnson'],
      pregunta: '¿En qué se diferencia Kruskal de Dijkstra y Johnson?',
      variantes: ['diferencia entre kruskal y dijkstra', 'diferencia entre kruskal y johnson', 'kruskal vs dijkstra', 'kruskal vs johnson', 'cual elijo kruskal o dijkstra', 'que algoritmo uso para conectar todo'],
      conceptos: ['diferencia', 'comparar', 'elegir'],
      breve: 'Kruskal conecta todos los vértices con el menor (o mayor) peso total, sin origen ni destino: responde «¿cómo unir todo barato?». Dijkstra busca el camino más barato desde un origen; Johnson, entre todos los pares. Dijkstra y Johnson responden «¿cómo llego de aquí a allá?».',
      sencilla: 'Kruskal diseña la red de carreteras; Dijkstra y Johnson planean viajes sobre una red que ya existe.',
      ejemplo: 'Triángulo A–B (2), B–C (2), A–C (3): Kruskal elige A–B y B–C, total 4. Dijkstra desde A hasta C elige la directa A–C, costo 3, que Kruskal no incluyó.',
      detalle: 'Kruskal usa grafos no dirigidos y admite negativos. Dijkstra admite modo dirigido o no, solo pesos no negativos. Johnson usa grafos dirigidos y admite negativos sin ciclos negativos.',
      relacionadas: ['grafo.camino-minimo-vs-arbol', 'kruskal.que-es', 'dijkstra.que-es', 'johnson.que-es']
    },
    {
      id: 'kruskal.reglas', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Qué valores acepta Kruskal?',
      variantes: ['cuales son los limites de kruskal', 'cuantos nodos admite kruskal', 'rango de pesos de kruskal', 'kruskal acepta decimales'],
      conceptos: ['limites', 'reglas', 'pesos', 'rango', 'acepta', 'cuantos'],
      breve: L => 'Grafo no dirigido con hasta ' + L.grafosNodos + ' vértices y ' + L.grafosAristas + ' aristas, nombres de hasta ' + L.nombreVertice + ' caracteres. Pesos enteros entre −' + L.peso + ' y ' + L.peso + ', incluidos cero y negativos. No admite decimales, bucles ni duplicados. El grafo de entrada sí puede tener ciclos.',
      relacionadas: ['kruskal.pesos-negativos-cero', 'problema.decimal'],
      referencia: 'Kruskal · «Cómo funciona y límites»'
    },
    {
      id: 'kruskal.resultado', tema: 'kruskal', modulos: ['kruskal'],
      pregunta: '¿Cómo leo el resultado de Kruskal y sus aristas descartadas?',
      variantes: ['resultado de kruskal', 'aristas elegidas y descartadas', 'nodos aislados', 'cantidad de aristas', 'por que kruskal no pide origen ni destino'],
      conceptos: ['resultado', 'aceptadas', 'descartadas', 'aislados', 'componentes', 'total'],
      breve: 'El resultado identifica el objetivo mínimo o máximo, costo total, aristas aceptadas, componentes y nodos aislados. Si existe una sola componente es un árbol de expansión; si hay varias, es un bosque. No se eligen origen ni destino porque se construye una red de expansión, no una ruta.',
      detalle: 'Las aristas descartadas por ciclo se consultan en su apartado y se distinguen por trazo discontinuo. El costo suma únicamente las aceptadas. Con V nodos y C componentes se eligen V−C aristas, incluidos los aislados como componentes de un solo nodo. Cambiar objetivo recalcula las decisiones con el orden de pesos correspondiente; mover o renombrar conserva un resultado válido.',
      relacionadas: ['kruskal.bosque', 'kruskal.detectar-ciclos', 'kruskal.v-menos-1', 'grafos.estado-fase1']
    }
  ]);
})();
