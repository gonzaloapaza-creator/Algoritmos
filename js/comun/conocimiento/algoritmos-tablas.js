/* Conocimiento de los algoritmos sobre tablas: Asignación (método húngaro) y
 * Esquina noroeste (transporte). Los límites se leen de la configuración. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  K.registrar([
    /* ---------------- Asignación ---------------- */
    {
      id: 'asignacion.que-es', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué es el problema de asignación?',
      variantes: ['que es la asignacion', 'para que sirve el modulo de asignacion', 'que resuelve asignacion', 'que es asignar recursos a tareas', 'que hace el metodo de asignacion'],
      conceptos: ['asignacion', 'asignar', 'emparejar', 'emparejamiento'],
      breve: 'El problema de asignación consiste en emparejar recursos con tareas, uno a uno, de forma que el costo total sea mínimo o el beneficio total máximo. Cada recurso hace a lo sumo una tarea y cada tarea la hace a lo sumo un recurso.',
      sencilla: 'Tienes personas y trabajos, y una tabla que dice cuánto le cuesta a cada persona cada trabajo. Hay que repartir los trabajos para gastar lo menos posible, sin que nadie haga dos ni un trabajo quede con dos personas.',
      ejemplo: 'Ana: Tarea 1 = 5, Tarea 2 = 8. Luis: Tarea 1 = 6, Tarea 2 = 4. La mejor asignación es Ana→Tarea 1 y Luis→Tarea 2 con total 9.',
      detalle: 'Se resuelve con el método húngaro, que trabaja sobre la matriz de costos haciendo reducciones y coberturas. Es un caso particular del problema de transporte donde todas las ofertas y demandas valen 1.',
      relacionadas: ['asignacion.recursos-tareas', 'asignacion.metodo-hungaro', 'asignacion.costos-beneficios', 'asignacion.vs-transporte'],
      referencia: 'Asignación · Grafo → Matriz y validación → Resultado → Procedimiento'
    },
    {
      id: 'asignacion.recursos-tareas', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué son recursos, tareas y parejas?',
      variantes: ['que es un recurso', 'que es una tarea', 'que es una pareja en asignacion', 'que significa pareja recurso tarea', 'quien es el recurso y quien la tarea'],
      conceptos: ['recurso', 'recursos', 'tarea', 'tareas', 'pareja', 'parejas', 'persona', 'trabajo'],
      breve: 'Los recursos son quienes realizan algo (personas, máquinas, vehículos); las tareas, lo que hay que realizar. Una pareja es la combinación de un recurso con una tarea y tiene un valor (costo o beneficio). El resultado elige un conjunto de parejas.',
      sencilla: 'Recursos: la columna de la izquierda del grafo. Tareas: la de la derecha. Cada línea entre ambos lados es una pareja posible.',
      ejemplo: 'Recursos: Ana, Luis. Tareas: Cocinar, Limpiar. Parejas posibles: Ana–Cocinar, Ana–Limpiar, Luis–Cocinar, Luis–Limpiar. La solución elige dos de ellas.',
      detalle: 'En la matriz, los recursos son las filas y las tareas las columnas. Puedes renombrarlos con doble toque sobre el nodo. Si hay más recursos que tareas (o al revés), algunos quedarán sin asignar.',
      relacionadas: ['grafo.bipartito', 'asignacion.grafo-y-matriz', 'asignacion.sin-asignar'],
      referencia: 'Asignación · botones «+ Recurso» y «+ Tarea»'
    },
    {
      id: 'asignacion.costos-beneficios', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué diferencia hay entre costos y beneficios, y entre minimizar y maximizar?',
      variantes: ['que es minimizar', 'que es maximizar', 'cuando elijo minimizar costos', 'cuando elijo maximizar beneficios', 'diferencia entre costo y beneficio', 'que objetivo elijo'],
      conceptos: ['minimizar', 'maximizar', 'costo', 'costos', 'beneficio', 'beneficios', 'objetivo'],
      breve: 'Un costo es algo que quieres reducir (tiempo, dinero, distancia): eliges «Minimizar costos». Un beneficio es algo que quieres aumentar (ganancia, puntuación, afinidad): eliges «Maximizar beneficios». Los números de la matriz son los mismos; cambia qué se considera mejor.',
      sencilla: 'Si la tabla dice «cuánto tarda cada persona», quieres el total más pequeño. Si dice «cuántos puntos gana cada persona», quieres el total más grande.',
      ejemplo: 'Misma matriz [5 8; 6 4]. Minimizar: Ana→T1, Luis→T2, total 9. Maximizar: Ana→T2, Luis→T1, total 14.',
      detalle: 'Para maximizar, el método húngaro convierte la matriz restando cada valor del máximo (máximo − valor) y luego minimiza. El total final se calcula siempre con tus valores originales. Cambiar el objetivo invalida el resultado.',
      relacionadas: ['asignacion.metodo-hungaro', 'asignacion.ceros-vs-originales', 'grafo.peso'],
      referencia: 'Asignación · «Minimizar costos» / «Maximizar beneficios»'
    },
    {
      id: 'asignacion.grafo-y-matriz', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué relación hay entre el grafo bipartito y la matriz en Asignación?',
      variantes: ['por que hay un grafo y una matriz', 'el grafo y la matriz son lo mismo', 'donde ingreso los valores en el grafo o en la matriz', 'que pasa si edito la matriz', 'relacion grafo matriz'],
      conceptos: ['grafo', 'matriz', 'bipartito', 'relacion'],
      breve: 'Son dos vistas de los mismos datos. En el grafo, cada conexión recurso–tarea con su valor es una celda de la matriz; en la matriz, cada fila es un recurso y cada columna una tarea. Editar en una vista actualiza la otra.',
      sencilla: 'El grafo muestra las parejas como líneas; la matriz las muestra como casillas. Es la misma información dibujada de dos maneras.',
      ejemplo: 'Conectar Ana con Tarea 2 y escribir 8 equivale a escribir 8 en la celda fila Ana, columna Tarea 2.',
      detalle: 'Una pareja sin conexión en el grafo es una celda vacía (pendiente) en la matriz. «Completar pendientes» pone un mismo valor en todas las vacías. Eliminar una conexión vuelve a dejar pendiente esa celda.',
      relacionadas: ['grafo.bipartito', 'asignacion.pendientes', 'matriz.costos'],
      referencia: 'Asignación · pestañas Grafo y Matriz y validación'
    },
    {
      id: 'asignacion.metodo-hungaro', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué es el método húngaro?',
      variantes: ['que es el metodo hungaro', 'como funciona el metodo hungaro', 'por que se llama hungaro', 'pasos del metodo hungaro', 'que hace el algoritmo hungaro', 'explicame el metodo hungaro'],
      conceptos: ['hungaro', 'hungara', 'kuhn', 'munkres'],
      breve: 'El método húngaro resuelve el problema de asignación de forma óptima. Trabaja sobre la matriz de costos: resta el mínimo de cada fila y de cada columna para crear ceros, cubre todos los ceros con el menor número de líneas, ajusta la matriz si faltan líneas y repite hasta poder elegir un cero por fila y columna.',
      sencilla: 'La idea es transformar la tabla sin cambiar cuál es la mejor respuesta, hasta que la mejor respuesta sea obvia: elegir casillas con cero.',
      ejemplo: 'Matriz [5 8; 6 4]. Reducir filas: [0 3; 2 0]. Ya hay un cero por fila y columna: Ana→T1 (5) y Luis→T2 (4), total 9.',
      detalle: 'Debe su nombre a los matemáticos húngaros Kőnig y Egerváry, en cuyo trabajo se basó Kuhn en 1955. Garantiza el óptimo con complejidad O(n³). Las fases del procedimiento en este módulo: conversión (si maximizas), balanceo con ficticios (si la matriz es rectangular), reducción por filas, reducción por columnas, cobertura, ajuste con δ, selección final y total.',
      relacionadas: ['asignacion.reducciones', 'asignacion.cobertura-ajuste', 'asignacion.ceros-vs-originales', 'asignacion.que-es'],
      referencia: 'Asignación · pestaña 4 Procedimiento'
    },
    {
      id: 'asignacion.reducciones', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué son las reducciones por filas y por columnas?',
      variantes: ['que es la reduccion por filas', 'que es la reduccion por columnas', 'por que se resta el minimo de cada fila', 'para que sirve restar el minimo', 'que es reducir la matriz'],
      conceptos: ['reduccion', 'reducciones', 'reducir', 'restar', 'minimo de la fila', 'minimo de la columna'],
      breve: 'Reducir por filas es restar a cada fila su valor mínimo; reducir por columnas, restar a cada columna su mínimo. Así aparece al menos un cero en cada fila y columna. Restar una constante a toda una fila o columna no cambia cuál asignación es la óptima, solo el valor numérico del total.',
      sencilla: 'Si a todas las opciones de Ana les quitas 5, la opción más barata de Ana sigue siendo la misma. Haciéndolo con todos, las mejores opciones se convierten en ceros.',
      ejemplo: 'Fila [7 9 12] → mínimo 7 → [0 2 5]. Columna [0 4 6] → mínimo 0 → sin cambios.',
      detalle: 'Como toda asignación usa exactamente una celda por fila y por columna, restar k a una fila le resta k a todas las asignaciones posibles por igual. El total real se recupera al final con los valores originales.',
      relacionadas: ['asignacion.ceros-vs-originales', 'asignacion.cobertura-ajuste', 'matriz.sumas']
    },
    {
      id: 'asignacion.ceros-vs-originales', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué diferencia hay entre los ceros del procedimiento y los costos originales?',
      variantes: ['por que la matriz tiene ceros si mis costos no eran cero', 'los ceros son el costo real', 'que significan los ceros en el metodo hungaro', 'por que el total no es cero', 'ceros del procedimiento'],
      conceptos: ['ceros', 'cero', 'originales', 'reducida'],
      breve: 'Los ceros que aparecen durante el procedimiento son el resultado de las reducciones: marcan las parejas «relativamente mejores», no un costo real de 0. El total de la solución se calcula siempre con tus costos originales.',
      sencilla: 'Los ceros son pistas, no precios. Dicen «esta casilla es la mejor opción de su fila y columna», pero su precio sigue siendo el que escribiste.',
      ejemplo: 'Matriz original [5 8; 6 4] → reducida [0 3; 2 0]. Se eligen los ceros (Ana→T1, Luis→T2), pero el total es 5 + 4 = 9, no 0.',
      detalle: 'La pestaña Procedimiento muestra la matriz reducida en cada paso; la pestaña Resultado muestra las parejas con sus valores originales y el total. Un 0 que tú escribiste como dato sí es un costo real de cero.',
      relacionadas: ['asignacion.reducciones', 'asignacion.total', 'matriz.cero-vacio-infinito']
    },
    {
      id: 'asignacion.cobertura-ajuste', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué son la cobertura de ceros y el ajuste con δ?',
      variantes: ['que es cubrir los ceros con lineas', 'que es el ajuste con delta', 'que significa delta', 'por que se tachan filas y columnas', 'que es la cobertura minima', 'por que hay varias iteraciones'],
      conceptos: ['cobertura', 'cubrir', 'lineas', 'ajuste', 'delta', 'δ', 'tachar', 'iteracion'],
      breve: 'La cobertura consiste en tachar todos los ceros con el menor número posible de líneas (filas o columnas). Si ese número es igual al tamaño de la matriz, ya se puede asignar. Si es menor, se hace un ajuste: δ es el menor valor sin tachar; se resta a las celdas no cubiertas y se suma a las cubiertas dos veces. Esto crea nuevos ceros y se repite.',
      sencilla: 'Si no hay suficientes ceros bien repartidos, el método «fabrica» más ceros donde hacen falta, sin cambiar cuál es la mejor solución.',
      ejemplo: 'Matriz 3×3 reducida cuyos ceros se tapan con solo 2 líneas: se toma el menor valor sin tapar, por ejemplo δ = 2, se resta en las celdas libres y se suma en los cruces de líneas. Aparece un cero nuevo y ahora hacen falta 3 líneas.',
      detalle: 'El número mínimo de líneas coincide con el máximo de ceros independientes (teorema de Kőnig). Cada iteración del procedimiento muestra la cobertura y, si hace falta, el ajuste. El proceso termina cuando se pueden elegir n ceros sin compartir fila ni columna.',
      relacionadas: ['asignacion.metodo-hungaro', 'asignacion.reducciones']
    },
    {
      id: 'asignacion.rectangular', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué pasa si hay más recursos que tareas o más tareas que recursos?',
      variantes: ['matriz rectangular en asignacion', 'que pasa si no hay la misma cantidad de recursos y tareas', 'puedo tener 3 recursos y 5 tareas', 'asignacion no cuadrada', 'cantidades distintas'],
      conceptos: ['rectangular', 'cuadrada', 'distintas', 'mas recursos', 'mas tareas', 'balanceo'],
      breve: 'El método húngaro necesita una matriz cuadrada, así que la aplicación añade filas o columnas ficticias con valor 0 hasta igualar los tamaños. Los elementos emparejados con un ficticio quedan sin asignar en el resultado real.',
      sencilla: 'Si hay 3 personas y 5 tareas, se inventan 2 «personas fantasma» para que la tabla sea cuadrada. Las tareas que les toquen a los fantasmas se quedan sin hacer.',
      ejemplo: '2 recursos × 3 tareas → se añade un recurso ficticio → matriz 3×3. En el resultado, una tarea aparece como «sin asignar».',
      detalle: 'El paso «Balanceo» del procedimiento muestra esta ampliación. Los ficticios no se agregan a tus datos: solo existen dentro del cálculo.',
      relacionadas: ['asignacion.ficticios', 'asignacion.sin-asignar', 'matriz.cuadrada-rectangular']
    },
    {
      id: 'asignacion.ficticios', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué es un elemento ficticio en Asignación?',
      variantes: ['que es un recurso ficticio', 'que es una tarea ficticia', 'por que aparece un ficticio', 'que significa ficticio en asignacion', 'de donde salio la fila ficticia'],
      conceptos: ['ficticio', 'ficticios', 'ficticia', 'fantasma', 'dummy'],
      breve: 'Un elemento ficticio es una fila o columna que el método añade, con todos sus valores en 0, para que la matriz sea cuadrada. No es un dato tuyo ni aparece en tu lista de recursos o tareas: representa «quedarse sin pareja».',
      sencilla: 'Es un comodín: la persona o tarea «de mentira» con la que se empareja quien no tiene con quién.',
      ejemplo: 'Con 3 recursos y 2 tareas se añade una tarea ficticia. El recurso asignado a ella es el que queda sin tarea real.',
      detalle: 'Su valor es 0 para que no influya en el total. En Esquina noroeste también existen ficticios, pero allí absorben la diferencia entre oferta y demanda total.',
      relacionadas: ['asignacion.rectangular', 'asignacion.sin-asignar', 'northwest.ficticios']
    },
    {
      id: 'asignacion.sin-asignar', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Por qué un elemento quedó sin asignar?',
      variantes: ['por que este recurso quedo sin asignar', 'por que esta tarea quedo sin asignar', 'que significa sin asignar', 'por que no le toco tarea', 'elemento sin pareja'],
      conceptos: ['sin asignar', 'sin pareja', 'sobra', 'sobrante'],
      breve: 'Porque hay más elementos de un tipo que del otro: si tienes 4 recursos y 3 tareas, uno de los recursos necesariamente queda libre. El método elige cuál dejando fuera al que menos perjudica el total. No es un error.',
      sencilla: 'Cuatro personas, tres trabajos: alguien se queda sin trabajo. El método elige a la persona que, al quedarse fuera, permite el mejor reparto del resto.',
      ejemplo: 'Recursos Ana, Luis, Marta; tareas T1, T2. Si Marta es la más cara en ambas tareas, probablemente quedará sin asignar.',
      detalle: 'En el procedimiento, el elemento sin asignar es el que se emparejó con un ficticio. Si quieres que todos tengan pareja, iguala la cantidad de recursos y tareas.',
      relacionadas: ['asignacion.rectangular', 'asignacion.ficticios', 'problema.sin-asignar']
    },
    {
      id: 'asignacion.pendientes', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué es un dato pendiente en Asignación?',
      variantes: ['que significa pendiente', 'por que no puedo resolver si hay pendientes', 'que es una casilla pendiente', 'que significa el signo de interrogacion en la conexion', 'puedo dejar casillas vacias'],
      conceptos: ['pendiente', 'pendientes', 'vacia', 'interrogacion', 'incompleto'],
      breve: 'Un dato pendiente es una pareja recurso–tarea sin valor: la celda está vacía o la conexión muestra «?». No equivale a cero. «Resolver» se deshabilita hasta que todas las parejas tengan un número.',
      sencilla: 'Vacío quiere decir «todavía no me dijiste cuánto cuesta». El método no puede adivinarlo, así que espera a que lo completes.',
      ejemplo: 'Si Ana–Tarea 2 está vacía, puedes escribir el valor en la matriz, conectar en el grafo o usar «Completar pendientes» para darle a todas las vacías el mismo valor.',
      detalle: 'Si quieres que una pareja sea «indeseable», no la dejes vacía: ponle un costo alto (o un beneficio bajo). Esta aplicación no admite infinito ni parejas prohibidas.',
      relacionadas: ['matriz.cero-vacio-infinito', 'asignacion.grafo-y-matriz', 'problema.faltan-datos'],
      referencia: 'Asignación · «Completar pendientes…»'
    },
    {
      id: 'asignacion.total', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Cómo se calcula el total de la asignación?',
      variantes: ['como salio el total', 'de donde sale el total', 'que significa el total en asignacion', 'el total usa los valores originales', 'como se suma el total'],
      conceptos: ['total', 'suma', 'costo total', 'beneficio total'],
      breve: 'El total es la suma de los valores originales de las parejas elegidas. Si una pareja incluye un elemento ficticio, no aporta nada. No se usan los ceros de la matriz reducida.',
      ejemplo: 'Parejas elegidas Ana→T1 (5) y Luis→T2 (4): total 9. Si Marta quedó con una tarea ficticia, no suma.',
      detalle: 'Si varias asignaciones tienen el mismo total, todas son óptimas; la aplicación muestra una. Al maximizar, el total es la suma de beneficios de las parejas, también con los valores originales.',
      relacionadas: ['asignacion.ceros-vs-originales', 'asignacion.alternativas', 'ejercicio.total']
    },
    {
      id: 'asignacion.alternativas', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Puede haber otra asignación con el mismo total?',
      variantes: ['hay varias soluciones optimas en asignacion', 'por que mi solucion es distinta y da el mismo total', 'soluciones alternativas en el metodo hungaro', 'la asignacion es unica'],
      conceptos: ['alternativa', 'alternativas', 'unica', 'varias soluciones', 'mismo total'],
      breve: 'Sí. Cuando en la matriz final hay más ceros independientes de los necesarios, existen varias asignaciones óptimas con el mismo total. La aplicación muestra una de ellas, elegida de forma determinista.',
      sencilla: 'Dos repartos distintos pueden costar exactamente lo mismo. Ambos son correctos.',
      ejemplo: 'Matriz [1 1; 1 1]: cualquier emparejamiento cuesta 2. Hay dos soluciones óptimas.',
      relacionadas: ['grafo.empates', 'basico.determinista', 'asignacion.total']
    },
    {
      id: 'asignacion.vs-transporte', tema: 'asignacion', modulos: ['asignacion', 'northwest'],
      pregunta: '¿En qué se diferencia el problema de asignación del problema de transporte?',
      variantes: ['diferencia entre asignacion y transporte', 'asignacion vs northwest', 'asignacion vs esquina noroeste', 'es lo mismo asignacion que transporte', 'cuando uso asignacion y cuando noroeste'],
      conceptos: ['transporte', 'diferencia', 'comparar'],
      breve: 'En asignación cada fila y columna se empareja a lo sumo una vez (cada recurso hace una tarea). En transporte cada origen puede enviar a varios destinos y cada destino recibir de varios orígenes, en cantidades que deben respetar ofertas y demandas. Asignación es un caso particular de transporte con todas las ofertas y demandas iguales a 1.',
      sencilla: 'Asignación: una persona, un trabajo. Transporte: una fábrica puede abastecer a varias tiendas, repartiendo su producción.',
      ejemplo: 'Asignación: 3 repartidores y 3 zonas, cada zona a un repartidor. Transporte: 2 almacenes con 100 y 150 cajas y 3 tiendas que piden 80, 90 y 80.',
      detalle: 'El método húngaro garantiza el óptimo en asignación. Esquina noroeste solo obtiene una solución inicial factible de transporte; para optimizar habría que aplicar MODI u otro método, no incluidos en esta aplicación.',
      relacionadas: ['asignacion.que-es', 'northwest.que-es', 'northwest.no-optimo']
    },
    {
      id: 'asignacion.reglas', tema: 'asignacion', modulos: ['asignacion'],
      pregunta: '¿Qué valores acepta Asignación?',
      variantes: ['cuales son los limites de asignacion', 'cuantos recursos puedo poner', 'rango de valores en asignacion', 'asignacion acepta decimales', 'asignacion acepta negativos'],
      conceptos: ['limites', 'reglas', 'rango', 'acepta', 'cuantos'],
      breve: L => 'De ' + L.asignacionMin + ' a ' + L.asignacionMax + ' recursos y de ' + L.asignacionMin + ' a ' + L.asignacionMax + ' tareas, con nombres de hasta ' + L.asignacionNombre + ' caracteres. Valores enteros entre −' + L.asignacionValor + ' y ' + L.asignacionValor + '. Cero es válido; vacío es pendiente. No admite decimales ni infinitos.',
      relacionadas: ['asignacion.pendientes', 'problema.decimal'],
      referencia: 'Asignación · Matriz y validación'
    },

    /* ---------------- Esquina noroeste ---------------- */
    {
      id: 'northwest.que-es', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué es el método de la esquina noroeste y por qué se llama así?',
      variantes: ['que es esquina noroeste', 'que es northwest', 'por que se llama esquina noroeste', 'para que sirve la esquina noroeste', 'que hace el metodo noroeste', 'que es el problema de transporte'],
      conceptos: ['northwest', 'noroeste', 'esquina', 'transporte'],
      breve: 'Es un método para obtener una primera solución factible del problema de transporte: cuánto enviar desde cada origen a cada destino respetando ofertas y demandas. Se llama así porque empieza por la celda superior izquierda de la tabla, que en un mapa sería el noroeste, y avanza hacia la derecha y hacia abajo.',
      sencilla: 'Empiezas en la esquina de arriba a la izquierda, asignas todo lo que puedas, y te mueves a la derecha o hacia abajo hasta llenar la tabla. No mira los precios: solo reparte cantidades.',
      ejemplo: 'Fábricas F1 (oferta 30) y F2 (oferta 40); tiendas T1 (demanda 20) y T2 (demanda 50). Celda F1–T1: min(30, 20) = 20. Se agota T1 → derecha. F1–T2: min(10, 50) = 10. Se agota F1 → abajo. F2–T2: min(40, 40) = 40.',
      detalle: 'Es rápido (O(m + n)) y siempre produce una solución factible si el problema está balanceado, pero no garantiza el costo mínimo porque ignora los costos. Métodos como Vogel o costo mínimo dan mejores puntos de partida, y MODI optimiza; no están implementados en este módulo.',
      relacionadas: ['northwest.oferta-demanda', 'northwest.primera-celda', 'northwest.movimiento', 'northwest.no-optimo', 'northwest.otros-metodos'],
      referencia: 'Esquina noroeste · Datos → Balanceo → Resolución → Resultado'
    },
    {
      id: 'northwest.oferta-demanda', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué son origen, destino, oferta y demanda?',
      variantes: ['que es la oferta', 'que es la demanda', 'que es un origen en transporte', 'que es un destino en transporte', 'diferencia entre oferta y demanda', 'donde escribo la oferta'],
      conceptos: ['oferta', 'ofertas', 'demanda', 'demandas', 'origen', 'origenes', 'destino', 'destinos', 'fila', 'columna'],
      breve: 'Los orígenes son quienes tienen producto (fábricas, almacenes) y su oferta es cuánto pueden enviar; son las filas. Los destinos son quienes lo necesitan (tiendas, clientes) y su demanda es cuánto piden; son las columnas. La solución reparte las ofertas para cubrir las demandas.',
      sencilla: 'Oferta: lo que hay disponible en cada fila. Demanda: lo que se necesita en cada columna.',
      ejemplo: 'F1 ofrece 30, F2 ofrece 40 (total 70). T1 pide 20, T2 pide 50 (total 70). Como coinciden, el problema está balanceado.',
      detalle: 'En la tabla de Datos, la oferta se escribe en la última columna y la demanda en la última fila. Ambas deben ser enteros. Si la suma de ofertas no coincide con la de demandas, el balanceo agrega un ficticio.',
      relacionadas: ['northwest.balanceo', 'northwest.costo-unitario', 'grafo.origen-destino'],
      referencia: 'Esquina noroeste · pestaña 1 Datos'
    },
    {
      id: 'northwest.costo-unitario', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué es el costo unitario?',
      variantes: ['que significa costo unitario', 'que es el costo por unidad', 'que numero va en el centro de la tabla', 'costo de la celda'],
      conceptos: ['costo unitario', 'unitario', 'por unidad', 'costo'],
      breve: 'El costo unitario de una celda es lo que cuesta enviar una sola unidad desde el origen de esa fila al destino de esa columna. Al resolver, el costo de la celda es cantidad enviada × costo unitario.',
      sencilla: 'Es el precio por caja de ese trayecto. Si mandas 20 cajas a 3 cada una, pagas 60.',
      ejemplo: L => 'Costo unitario F1–T1 = 2,50; cantidad 20 → costo de la celda 50,00. Los costos admiten hasta ' + L.northwestDecimales + ' decimales.',
      relacionadas: ['northwest.costo-total', 'matriz.costos', 'northwest.costos-no-deciden']
    },
    {
      id: 'northwest.balanceo', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué es el balanceo?',
      variantes: ['que significa balancear', 'por que hay que balancear', 'que es un problema balanceado', 'que pasa si la oferta no es igual a la demanda', 'para que sirve la pestana balanceo'],
      conceptos: ['balanceo', 'balancear', 'balanceado', 'equilibrar', 'equilibrado', 'desbalanceado'],
      breve: 'Balancear es igualar la oferta total con la demanda total. Si sobra oferta, se añade un destino ficticio que absorbe el excedente; si falta oferta, se añade un origen ficticio que cubre lo que no se puede entregar. El método necesita un problema balanceado para que cada fila y columna se agote exactamente.',
      sencilla: 'Si las fábricas producen más de lo que piden las tiendas, se inventa una «tienda» donde guardar lo que sobra. Si producen menos, se inventa una «fábrica» que representa lo que no se entregará.',
      ejemplo: 'Ofertas 30 + 40 = 70; demandas 20 + 30 = 50. Sobra 20 → destino ficticio con demanda 20 y costo 0.',
      detalle: 'La pestaña Balanceo muestra el ficticio sin modificar tus datos reales. Si ya están igualados, no se agrega nada y puedes pasar directamente a resolver.',
      relacionadas: ['northwest.ficticios', 'northwest.oferta-demanda', 'matriz.sumas'],
      referencia: 'Esquina noroeste · pestaña 2 Balanceo'
    },
    {
      id: 'northwest.ficticios', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué es un origen o destino ficticio y cómo lo interpreto?',
      variantes: ['por que hay un ficticio', 'que significa destino ficticio', 'que significa origen ficticio', 'que hago con las cantidades del ficticio', 'por que el ficticio tiene costo cero', 'como interpreto el ficticio'],
      conceptos: ['ficticio', 'ficticios', 'ficticia', 'dummy', 'excedente', 'faltante'],
      breve: 'Un destino ficticio representa producto que se queda sin enviar (sobra oferta): las cantidades en su columna son existencias no despachadas de cada origen. Un origen ficticio representa demanda que no se cubrirá (falta oferta): las cantidades en su fila son lo que cada destino deja de recibir. Su costo unitario es 0 por convención, porque no hay envío real.',
      sencilla: 'La columna «ficticio» dice cuánto le sobra a cada fábrica. La fila «ficticio» dice cuánto le falta a cada tienda.',
      ejemplo: 'Si en la celda F2–Ficticio aparece 20, la fábrica F2 se queda con 20 unidades sin enviar.',
      detalle: 'El ficticio solo existe en el cálculo: no altera tus datos originales. Si quieres asignar un costo de almacenamiento o penalización al excedente, este módulo no lo permite; el costo del ficticio es siempre 0.',
      relacionadas: ['northwest.balanceo', 'asignacion.ficticios', 'problema.ficticio']
    },
    {
      id: 'northwest.primera-celda', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Por qué empieza en la primera celda y qué asigna allí?',
      variantes: ['por que empieza arriba a la izquierda', 'cuanto asigna en cada celda', 'que es el minimo entre oferta y demanda', 'como decide la cantidad de la celda', 'regla de la esquina noroeste'],
      conceptos: ['primera celda', 'minimo', 'min', 'arriba izquierda', 'cantidad'],
      breve: 'Empieza en la celda superior izquierda por convención, sin mirar costos. En cada celda asigna el mínimo entre la oferta restante de la fila y la demanda restante de la columna: todo lo que se pueda enviar sin pasarse de ninguna de las dos.',
      sencilla: 'Es como llenar vasos de izquierda a derecha con una jarra: viertes lo máximo que admite el vaso o lo que queda en la jarra, lo que sea menor.',
      ejemplo: 'Oferta restante 30, demanda restante 20 → se asignan 20. La demanda se agota y la oferta queda en 10.',
      detalle: 'El paso a paso muestra la operación «min(oferta, demanda) = cantidad» en cada celda, junto con los restantes de fila y columna.',
      relacionadas: ['northwest.movimiento', 'northwest.costos-no-deciden']
    },
    {
      id: 'northwest.movimiento', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Cuándo se mueve a la derecha y cuándo hacia abajo?',
      variantes: ['por que se movio a la derecha', 'por que bajo de fila', 'como avanza la esquina noroeste', 'que pasa si se agotan oferta y demanda a la vez', 'agotamiento simultaneo', 'regla de movimiento'],
      conceptos: ['derecha', 'abajo', 'mover', 'movimiento', 'avanza', 'agotar', 'agotamiento', 'simultaneo'],
      breve: 'Si se agota la demanda de la columna, se mueve a la derecha (siguiente destino). Si se agota la oferta de la fila, baja (siguiente origen). Si se agotan ambas a la vez (agotamiento simultáneo), solo se tacha una de las dos y la siguiente celda recibe un 0 básico: la solución es degenerada.',
      sencilla: 'Vaso lleno → siguiente vaso (derecha). Jarra vacía → siguiente jarra (abajo). Las dos cosas a la vez → caso especial con un cero.',
      ejemplo: 'Oferta 20 y demanda 20 en la misma celda: se asignan 20, ambas llegan a 0. La aplicación avanza y marca la siguiente celda con un 0 básico.',
      relacionadas: ['northwest.degeneracion', 'northwest.cero-basico', 'northwest.primera-celda']
    },
    {
      id: 'northwest.degeneracion', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué es una solución degenerada?',
      variantes: ['que significa degenerado', 'que es la degeneracion', 'por que dice que la base es degenerada', 'cuantas celdas basicas debe haber', 'm mas n menos 1'],
      conceptos: ['degenerada', 'degenerado', 'degeneracion', 'base', 'basicas', 'm+n-1'],
      breve: 'Una solución de transporte es degenerada cuando tiene menos de m + n − 1 celdas con envío positivo (m orígenes, n destinos). Ocurre cuando oferta y demanda se agotan a la vez en una celda. Para mantener la base completa se incluye un 0 básico.',
      sencilla: 'Normalmente la tabla necesita cierta cantidad de casillas «activas». Si una coincidencia exacta deja una de menos, se añade una casilla con cero que cuenta como activa aunque no envíe nada.',
      ejemplo: '2 orígenes y 2 destinos → se esperan 3 celdas básicas. Si solo hay 2 con cantidad positiva, la tercera es un 0 básico.',
      detalle: 'La degeneración no afecta al costo total de Esquina noroeste, pero sería importante en métodos de mejora como MODI, que necesitan exactamente m + n − 1 celdas básicas.',
      relacionadas: ['northwest.cero-basico', 'northwest.movimiento']
    },
    {
      id: 'northwest.cero-basico', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué diferencia hay entre un 0 básico y un envío positivo?',
      variantes: ['que es un cero basico', 'que significa 0 basico', 'por que hay un cero en la solucion', 'el cero basico es un envio', 'cero basico vs cero normal'],
      conceptos: ['cero basico', '0 basico', 'basico', 'basica'],
      breve: 'Un envío positivo es una celda con cantidad mayor que 0: sí se transporta algo. Un 0 básico es una celda que pertenece a la base de la solución pero con cantidad 0: no se envía nada por ella; solo está marcada para que la base tenga m + n − 1 celdas. Las celdas vacías no básicas tampoco envían, pero no forman parte de la base.',
      sencilla: 'Envío positivo: «por aquí pasan cajas». Cero básico: «por aquí no pasa nada, pero la casilla cuenta como usada». Vacío: «no se usa».',
      ejemplo: 'Después de un agotamiento simultáneo, la siguiente celda aparece con 0 y marcada como básica. Su costo aportado es 0 × costo unitario = 0.',
      relacionadas: ['northwest.degeneracion', 'matriz.cero-vacio-infinito']
    },
    {
      id: 'northwest.costo-total', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Cómo se calcula el costo total en Esquina noroeste?',
      variantes: ['como salio el costo total', 'de donde sale el total de transporte', 'que significa el costo total', 'como se suma el costo', 'formula del costo total'],
      conceptos: ['costo total', 'total', 'suma', 'calcular'],
      breve: 'Se multiplica la cantidad enviada en cada celda por su costo unitario y se suman todas las celdas. Las celdas vacías y los 0 básicos aportan 0; las celdas del ficticio también, porque su costo unitario es 0.',
      sencilla: 'Para cada casilla con cajas: cajas × precio por caja. Luego sumas todo.',
      ejemplo: 'F1–T1: 20 × 2 = 40. F1–T2: 10 × 5 = 50. F2–T2: 40 × 3 = 120. Costo total = 210.',
      detalle: 'Si cambias un costo unitario sin tocar ofertas ni demandas, las cantidades asignadas no cambian (el método no mira costos), pero el total sí y debes resolver de nuevo. Ante texto inválido, Resultado y Procedimiento conservan «Último cálculo válido; hay datos pendientes de corregir»: sus cantidades y costo pertenecen al modelo válido anterior. Algo muestra el mismo aviso. Debes corregir las casillas antes de balancear o recalcular. Quitar una fila o columna elimina solo sus errores incidentes; Deshacer los restaura junto con sus IDs.',
      relacionadas: ['northwest.costo-unitario', 'northwest.costos-no-deciden', 'ejercicio.total']
    },
    {
      id: 'northwest.costos-no-deciden', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Por qué los costos no deciden las cantidades asignadas?',
      variantes: ['por que no usa los costos', 'por que asigno a la celda mas cara', 'el metodo mira los costos', 'por que no elige el costo mas bajo', 'los costos influyen en la asignacion'],
      conceptos: ['costos', 'deciden', 'ignora', 'no mira', 'mas cara', 'mas barata'],
      breve: 'Porque la regla de la esquina noroeste solo depende de la posición: siempre la celda superior izquierda disponible, y se asigna el mínimo entre oferta y demanda. Los costos se usan únicamente al final para calcular el total. Es una regla simple a propósito: busca una solución factible rápida, no la mejor.',
      sencilla: 'El método llena la tabla «a ciegas» respecto a los precios. Por eso puede mandar cajas por la ruta más cara si esa ruta está arriba a la izquierda.',
      ejemplo: 'Si la celda F1–T1 cuesta 9 y F1–T2 cuesta 1, Esquina noroeste igualmente empieza por F1–T1.',
      relacionadas: ['northwest.no-optimo', 'northwest.otros-metodos', 'northwest.primera-celda']
    },
    {
      id: 'northwest.no-optimo', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Por qué Esquina noroeste no garantiza la solución óptima?',
      variantes: ['la esquina noroeste es optima', 'el resultado es el costo minimo', 'por que no es la mejor solucion', 'esquina noroeste da el minimo costo', 'es la solucion final'],
      conceptos: ['optima', 'optimo', 'minimo', 'garantiza', 'mejor', 'inicial'],
      breve: 'Porque ignora los costos al repartir: solo garantiza que la solución sea factible (cumple ofertas y demandas). Casi siempre existe otro reparto más barato. Por eso se considera una solución inicial, el punto de partida para métodos de mejora.',
      sencilla: 'Es como empacar la maleta metiendo las cosas en el orden en que las encuentras: todo cabe, pero seguramente hay una forma mejor de acomodarlas.',
      ejemplo: 'Con costos F1–T1 = 9 y F1–T2 = 1, F2–T1 = 1 y F2–T2 = 9, Esquina noroeste asigna primero F1–T1 (caro). Un reparto que use F1–T2 y F2–T1 costaría mucho menos.',
      detalle: 'Para llegar al óptimo se aplican métodos como MODI (distribución modificada) o el de los escalones (stepping stone), que mejoran la solución inicial. No están implementados en este módulo: el resultado que ves es la solución inicial factible.',
      relacionadas: ['basico.solucion-valida-factible-optima', 'northwest.otros-metodos', 'northwest.costos-no-deciden']
    },
    {
      id: 'northwest.otros-metodos', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué son Vogel, costo mínimo y MODI?',
      variantes: ['que es el metodo de vogel', 'que es el metodo del costo minimo', 'que es modi', 'la aplicacion tiene vogel', 'puedo optimizar con modi', 'que otros metodos de transporte existen', 'que es stepping stone'],
      conceptos: ['vogel', 'costo minimo', 'modi', 'stepping stone', 'escalones', 'otros metodos', 'aproximacion'],
      breve: 'Son otros métodos del problema de transporte. Costo mínimo y Vogel (aproximación de Vogel) obtienen soluciones iniciales mejores que Esquina noroeste porque sí consideran los costos. MODI (y el método de los escalones) parten de una solución inicial y la mejoran hasta el óptimo. Ninguno de ellos está implementado en esta aplicación: el módulo solo ofrece Esquina noroeste.',
      sencilla: 'Costo mínimo: empieza por la ruta más barata. Vogel: empieza donde más se perdería si no se usa la ruta barata. MODI: toma una solución y la va corrigiendo hasta que ya no se puede mejorar.',
      detalle: 'Puedes calcular aquí la solución inicial con Esquina noroeste y continuar a mano con MODI usando su costo total como punto de partida. La aplicación no verifica optimalidad.',
      relacionadas: ['northwest.no-optimo', 'northwest.que-es']
    },
    {
      id: 'northwest.reglas', tema: 'northwest', modulos: ['northwest'],
      pregunta: '¿Qué valores acepta Esquina noroeste?',
      variantes: ['cuales son los limites de esquina noroeste', 'cuantos origenes puedo poner', 'acepta decimales la esquina noroeste', 'rango de costos en transporte', 'northwest acepta negativos'],
      conceptos: ['limites', 'reglas', 'rango', 'acepta', 'cuantos', 'decimales'],
      breve: L => 'De ' + L.northwestMin + ' a ' + L.northwestMax + ' orígenes y de ' + L.northwestMin + ' a ' + L.northwestMax + ' destinos reales, con nombres de hasta ' + L.northwestNombre + ' caracteres. Costos de 0 a ' + L.northwestCosto + ' con hasta ' + L.northwestDecimales + ' decimales (coma o punto). Oferta y demanda enteras de 0 a ' + L.northwestCantidad + '. Vacío es pendiente; cero es válido. No admite costos negativos, rutas prohibidas ni cantidades fraccionarias.',
      relacionadas: ['northwest.balanceo', 'problema.decimal', 'problema.negativos'],
      referencia: 'Esquina noroeste · tabla de Datos'
    }
  ]);
})();
