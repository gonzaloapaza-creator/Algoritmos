/* Preguntas de diagnóstico: qué significa, qué revisar y qué hacer. Cuando hay
 * un aviso de validación visible, el motor lo antepone a estas respuestas. No se
 * atribuye una causa única si pueden existir varias. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  const GRAFOS = ['johnson', 'dijkstra', 'kruskal'];
  const TODOS = ['*'];

  K.registrar([
    {
      id: 'problema.no-conecta', tema: 'problemas', modulos: GRAFOS.concat('asignacion'),
      pregunta: 'No me deja conectar dos nodos',
      variantes: ['no puedo conectar', 'no me deja crear la conexion', 'la conexion no se crea', 'por que no conecta', 'no me deja unir los nodos', 'error al conectar'],
      conceptos: ['conectar', 'conexion', 'no deja', 'no puedo'],
      breve: 'Puede deberse a varias causas: intentas unir un nodo consigo mismo (bucle), ya existe esa conexión (duplicado), en Johnson ya existe la conexión en sentido contrario (inversa), el peso está vacío, no es entero o está fuera de rango, o superaste el máximo de aristas. En Asignación, solo se permiten parejas recurso–tarea, no dos recursos ni dos tareas.',
      detalle: 'Qué revisar: el aviso que aparece al intentar conectar indica la causa concreta. Próxima acción: elige dos nodos distintos, comprueba en la lista de conexiones si ya existe, escribe un peso entero dentro del rango y vuelve a intentar. En Johnson, si necesitas el sentido contrario, pasa por otro nodo.',
      relacionadas: ['grafo.bucle', 'grafo.aristas-duplicadas-opuestas', 'johnson.restriccion-editor', 'aplicacion.conectar-pesos']
    },
    {
      id: 'problema.no-calcula', tema: 'problemas', modulos: TODOS,
      pregunta: 'No puedo calcular o el botón está deshabilitado',
      variantes: ['no puedo calcular', 'no puedo resolver', 'el boton calcular no funciona', 'resolver esta deshabilitado', 'no me deja resolver', 'por que no calcula', 'no pasa nada al calcular'],
      conceptos: ['calcular', 'resolver', 'deshabilitado', 'no funciona', 'boton'],
      breve: 'Normalmente falta algo que el módulo exige antes de calcular: en Dijkstra, al menos un nodo y un origen; en Kruskal, al menos un nodo; en Johnson, al menos dos nodos; en Asignación y Esquina noroeste, celdas pendientes o con texto inválido; en Esquina noroeste, confirmar el balanceo; en Árboles, recorridos compatibles. También puede haber un aviso de validación visible que señala el dato a corregir.',
      detalle: 'Qué revisar: el mensaje junto al botón o el último aviso de la aplicación; la pestaña de datos en busca de casillas vacías o marcadas. Próxima acción: completa o corrige el dato señalado y vuelve a pulsar Calcular / Resolver. Pregúntame «¿qué dato me falta?» para revisar el estado actual.',
      relacionadas: ['problema.faltan-datos', 'ejercicio.pendientes', 'basico.validacion-limites']
    },
    {
      id: 'problema.infinito', tema: 'problemas', modulos: ['johnson', 'dijkstra'],
      pregunta: 'Me sale infinito (∞) en el resultado',
      variantes: ['me sale infinito', 'por que aparece infinito', 'la distancia es infinita', 'sale sin camino', 'infinito es un error'],
      conceptos: ['infinito', 'sin camino', 'error'],
      breve: 'No es un error: ∞ significa que no existe camino entre esos dos vértices respetando el sentido de las conexiones. Causas habituales: falta una conexión, la conexión existe pero en sentido contrario (grafo dirigido), o el vértice está aislado o en otro grupo.',
      detalle: 'Qué revisar: si el destino tiene alguna conexión que llegue a él; si el sentido de las flechas permite el recorrido; en Dijkstra, si el modo debería ser no dirigido. Próxima acción: añade o invierte la conexión necesaria (en Johnson, pasando por otro nodo si la inversa no está permitida) y recalcula.',
      relacionadas: ['dijkstra.infinito', 'dijkstra.inalcanzables', 'johnson.sin-camino', 'grafo.conectividad']
    },
    {
      id: 'problema.ciclo-negativo', tema: 'problemas', modulos: ['johnson'],
      pregunta: 'Me aparece un ciclo negativo',
      variantes: ['me aparece ciclo negativo', 'dice que hay un ciclo negativo', 'como quito el ciclo negativo', 'por que detecto ciclo negativo', 'ciclo negativo que hago'],
      conceptos: ['ciclo negativo', 'detectado'],
      breve: 'Significa que existe un recorrido cerrado cuya suma de pesos es menor que cero, y por eso no hay distancias mínimas. La aplicación resalta las conexiones del ciclo en el grafo. Para continuar, modifica alguno de esos pesos (o elimina una de esas conexiones) de modo que la suma del ciclo sea mayor o igual a cero y recalcula.',
      detalle: 'Qué revisar: las conexiones destacadas y su suma. Un ciclo de suma exactamente 0 sí se admite. Los pesos negativos que no forman ciclo negativo no son un problema.',
      relacionadas: ['johnson.ciclo-negativo', 'grafo.pesos-negativos']
    },
    {
      id: 'problema.faltan-datos', tema: 'problemas', modulos: TODOS,
      pregunta: 'Dice que faltan datos o hay pendientes',
      variantes: ['faltan datos', 'dice que hay datos pendientes', 'que datos me faltan', 'casillas pendientes', 'datos incompletos', 'por que dice incompleto'],
      conceptos: ['faltan', 'falta', 'pendientes', 'incompleto', 'incompletos', 'vacias'],
      breve: 'Hay casillas sin valor: en Asignación, parejas recurso–tarea vacías o con «?»; en Esquina noroeste, costos, ofertas o demandas en blanco. Una casilla vacía no se interpreta como cero. También puede faltar el origen en Dijkstra o el balanceo en Esquina noroeste.',
      detalle: 'Qué revisar: la pestaña de datos o matriz; las celdas resaltadas. Próxima acción: escribe el valor en cada casilla (cero es válido si corresponde) o usa «Completar pendientes» en Asignación para dar un mismo valor a todas las vacías. Pregúntame «¿qué dato me falta?» para una lista según el estado actual.',
      relacionadas: ['asignacion.pendientes', 'matriz.cero-vacio-infinito', 'ejercicio.pendientes']
    },
    {
      id: 'problema.no-guarda', tema: 'problemas', modulos: TODOS,
      pregunta: 'No guarda mi trabajo',
      variantes: ['no guarda', 'no se guarda', 'error al guardar', 'dice que no se pudo guardar', 'fallo el autoguardado', 'no me deja guardar'],
      conceptos: ['guardar', 'no guarda', 'autoguardado', 'fallo'],
      breve: 'Las causas posibles son: el navegador bloquea el almacenamiento local (modo privado o configuración estricta), no queda espacio, alcanzaste el máximo de trabajos del módulo, el nombre está vacío o es demasiado largo, o el autoguardado está pausado por un guardado anterior incompatible.',
      detalle: 'Qué revisar: el aviso exacto; si hay un cartel de datos incompatibles con «Descargar original» y «Usar ejercicio actual»; cuántos trabajos tienes en «Mis trabajos». Próxima acción: exporta tu ejercicio a JSON de inmediato para no perderlo, elimina trabajos antiguos si llegaste al máximo, y si estás en modo privado prueba con una ventana normal.',
      relacionadas: ['aplicacion.guardar', 'aplicacion.recuperacion', 'aplicacion.json']
    },
    {
      id: 'problema.no-encuentro-trabajo', tema: 'problemas', modulos: TODOS,
      pregunta: 'No encuentro mi trabajo guardado',
      variantes: ['no encuentro mi trabajo', 'desaparecio mi trabajo', 'donde esta lo que guarde', 'mis trabajos esta vacio', 'perdi mi ejercicio', 'no aparece mi guardado'],
      conceptos: ['no encuentro', 'desaparecio', 'perdi', 'vacio', 'mis trabajos'],
      breve: 'Revisa estas posibilidades: lo guardaste en otro módulo (cada módulo tiene su propia lista en «Cargar»), en otro navegador o dispositivo, o en otra dirección del sitio (localhost y el sitio publicado no comparten guardados); borraste los datos del navegador; o usaste una ventana privada, cuyo almacenamiento se vacía al cerrar.',
      detalle: 'Qué revisar: «Trabajos recientes» en el inicio, que lista los últimos guardados de todos los módulos; y «Cargar» → «Mis trabajos» dentro del módulo correcto. Próxima acción: si tienes un JSON exportado, impórtalo. Si no, no hay forma de recuperarlo desde la aplicación: no existe copia en servidor.',
      relacionadas: ['aplicacion.origenes', 'aplicacion.guardar', 'aplicacion.json']
    },
    {
      id: 'problema.no-importa', tema: 'problemas', modulos: TODOS,
      pregunta: 'El archivo no se importa',
      variantes: ['no puedo importar', 'el json no se importa', 'error al importar', 'archivo no valido', 'dice que el archivo es incompatible', 'no acepta mi archivo'],
      conceptos: ['importar', 'archivo', 'json', 'invalido', 'incompatible'],
      breve: 'El archivo se rechaza cuando no es JSON válido, pertenece a otro módulo, tiene una versión no admitida, supera 1 MiB, o contiene datos que incumplen las reglas actuales (bucles, duplicados, pares opuestos en Johnson, valores fuera de rango, nombres repetidos). La importación nunca reemplaza tus datos con un archivo inválido.',
      detalle: 'Qué revisar: el aviso indica el motivo; abre el archivo en un editor de texto y confirma que sea el exportado por esta aplicación y del mismo módulo. Próxima acción: corrige el dato señalado en una copia del archivo o vuelve a exportarlo desde el origen. Para trabajos múltiples usa «Mis trabajos» → Importar; para un ejercicio, «Importar JSON».',
      relacionadas: ['aplicacion.json', 'aplicacion.recuperacion']
    },
    {
      id: 'problema.no-veo-grafo', tema: 'problemas', modulos: GRAFOS.concat('asignacion', 'arboles'),
      pregunta: 'No veo todo el grafo o el dibujo',
      variantes: ['no veo todo el grafo', 'el grafo se sale de la pantalla', 'no veo algunos nodos', 'el dibujo esta cortado', 'donde estan mis nodos', 'el arbol no cabe'],
      conceptos: ['no veo', 'cortado', 'se sale', 'no cabe', 'pantalla', 'dibujo'],
      breve: 'El dibujo puede estar desplazado o con mucho zoom. Usa el ajuste a la vista: «100%» en Johnson y Asignación, «Ver todo» en Dijkstra y Kruskal, «Ajustar» o «Centrar» en Árboles. «Ampliar» da más espacio al lienzo en Dijkstra, Kruskal y Asignación. También puedes alejar con «−» o arrastrar el lienzo.',
      detalle: 'Qué revisar: si los nodos existen en la lista o el editor de puntos aunque no se vean. Próxima acción: ajusta la vista y, si trabajas en móvil, gira la pantalla o usa el modo lista/editor para seleccionar elementos.',
      relacionadas: ['aplicacion.zoom', 'problema.tabla-no-cabe']
    },
    {
      id: 'problema.tabla-no-cabe', tema: 'problemas', modulos: ['asignacion', 'northwest', 'johnson'],
      pregunta: 'La tabla no cabe en la pantalla',
      variantes: ['la tabla no cabe', 'la matriz se sale', 'no veo todas las columnas', 'la tabla es muy ancha', 'como veo toda la matriz'],
      conceptos: ['tabla', 'matriz', 'no cabe', 'ancha', 'columnas'],
      breve: 'Las tablas tienen desplazamiento horizontal interno: arrastra o usa la barra inferior para ver las columnas restantes. En pantallas pequeñas, el modo presentación (Alt+P) y girar el dispositivo dan más espacio. Reducir los nombres largos de filas y columnas también ayuda.',
      detalle: 'Qué revisar: si hay una barra de desplazamiento bajo la tabla. Próxima acción: desplaza con el dedo, con la rueda del ratón manteniendo Mayús, o con Tab entre celdas.',
      relacionadas: ['aplicacion.presentacion', 'problema.no-veo-grafo']
    },
    {
      id: 'problema.resultado-cambio', tema: 'problemas', modulos: TODOS,
      pregunta: 'El resultado cambió',
      variantes: ['el resultado cambio', 'por que ahora da otro resultado', 'antes daba otra cosa', 'el resultado es diferente al de ayer', 'por que cambio la respuesta'],
      conceptos: ['cambio', 'diferente', 'distinto', 'otro resultado'],
      breve: 'Un resultado distinto indica que cambió algún dato de entrada: un peso, una conexión, el sentido, el modo dirigido/no dirigido, el origen, el objetivo (mínimo/máximo), la cantidad de elementos o el orden de creación de las conexiones (que afecta el desempate). Con los mismos datos, el algoritmo es determinista y da siempre lo mismo.',
      detalle: 'Qué revisar: compara los datos actuales con los anteriores; si cargaste un trabajo guardado, confirma que sea la versión correcta. Próxima acción: usa Deshacer para volver atrás paso a paso, o revisa las conexiones una por una.',
      relacionadas: ['basico.determinista', 'grafo.empates', 'aplicacion.recalcular']
    },
    {
      id: 'problema.resultado-desaparecio', tema: 'problemas', modulos: TODOS,
      pregunta: 'El resultado ya no aparece',
      variantes: ['el resultado ya no aparece', 'se borro el resultado', 'desaparecio el resultado', 'ya no veo los pasos', 'la pestana resultado esta deshabilitada'],
      conceptos: ['desaparecio', 'ya no aparece', 'se borro', 'deshabilitada'],
      breve: 'El resultado se invalida automáticamente al cambiar cualquier dato que influya en el cálculo: es una protección para no mostrar una respuesta que ya no corresponde. Vuelve a pulsar Calcular / Resolver y el procedimiento se genera con los datos actuales. En Ordenamiento, pulsa «Usar valores» si editaste la lista.',
      detalle: 'Qué revisar: el aviso «el resultado anterior no está vigente» o similar. Mover o renombrar elementos no invalida el resultado; cambiar pesos, conexiones, valores, modo, origen u objetivo sí.',
      relacionadas: ['aplicacion.recalcular', 'problema.resultado-cambio']
    },
    {
      id: 'problema.decimal', tema: 'problemas', modulos: TODOS,
      pregunta: 'No puedo escribir un decimal',
      variantes: ['no acepta decimales', 'no me deja poner coma', 'por que no puedo poner 2.5', 'solo acepta enteros', 'decimales no validos'],
      conceptos: ['decimal', 'decimales', 'coma', 'punto', 'entero', 'enteros'],
      breve: L => 'Solo Esquina noroeste admite decimales, y únicamente en los costos (hasta ' + L.northwestDecimales + ', con coma o punto); sus ofertas y demandas son enteras. Johnson, Dijkstra, Kruskal, Asignación, Ordenamiento y Árboles trabajan exclusivamente con enteros. Esta es una decisión de la aplicación para mantener los pasos legibles.',
      detalle: 'Próxima acción: si tus datos tienen decimales, multiplícalos todos por 10 o 100 para convertirlos en enteros; la solución (qué camino, qué parejas) no cambia, solo la escala del total.',
      relacionadas: ['basico.validacion-limites', 'aplicacion.limites', 'northwest.reglas']
    },
    {
      id: 'problema.negativos', tema: 'problemas', modulos: TODOS,
      pregunta: 'No acepta números negativos',
      variantes: ['no acepta negativos', 'por que no puedo poner un numero negativo', 'donde se permiten negativos', 'error peso negativo', 'valor negativo no valido'],
      conceptos: ['negativo', 'negativos', 'menos'],
      breve: 'Depende del módulo. Admiten negativos: Johnson (pesos), Kruskal (pesos), Asignación (valores) y Árboles (valores). No los admiten: Dijkstra (por una razón matemática: el algoritmo no funciona con ellos), Esquina noroeste (costos, ofertas y demandas) y Ordenamiento (valores de 1 a 99).',
      detalle: 'Próxima acción: si necesitas pesos negativos en caminos mínimos, usa Johnson en lugar de Dijkstra. Si es un costo de transporte negativo (un subsidio), este módulo no lo contempla.',
      relacionadas: ['dijkstra.pesos-negativos', 'grafo.pesos-negativos', 'aplicacion.limites']
    },
    {
      id: 'problema.repetidos', tema: 'problemas', modulos: ['arboles', 'ordenamiento', 'asignacion', 'northwest'],
      pregunta: 'No acepta valores repetidos',
      variantes: ['no acepta valores repetidos', 'dice que el valor ya existe', 'por que no puedo repetir un valor', 'duplicado no valido', 'nombre repetido'],
      conceptos: ['repetido', 'repetidos', 'duplicado', 'ya existe', 'nombre'],
      breve: 'Este módulo de Árboles exige valores únicos en el BST y en los recorridos de reconstrucción. Es una regla del proyecto: otros BST pueden usar contadores o convenciones para admitir duplicados. Los nombres de nodos, recursos, tareas, orígenes y destinos tampoco pueden repetirse dentro de su grupo. En Ordenamiento sí se permiten valores repetidos.',
      detalle: 'Próxima acción: en Árboles, elige otro valor o limpia el árbol; en nombres, añade un distintivo (A1, A2).',
      relacionadas: ['arboles.insercion', 'ordenamiento.repetidos-identidad']
    },
    {
      id: 'problema.no-coincide', tema: 'problemas', modulos: TODOS,
      pregunta: 'El resultado no coincide con lo que esperaba',
      variantes: ['no coincide con mi libro', 'el resultado es distinto al del profesor', 'el resultado esta mal', 'por que da diferente a lo que calcule a mano', 'esta bien el resultado', 'es correcto el resultado'],
      conceptos: ['no coincide', 'esperaba', 'libro', 'profesor', 'mal', 'correcto', 'a mano'],
      breve: 'Antes de concluir que algo está mal, revisa: (1) si hay empates, puede existir otra solución con el mismo total igualmente óptima; (2) si el grafo es dirigido o no, y el sentido de cada conexión; (3) si los datos ingresados son exactamente los del enunciado; (4) en Esquina noroeste, recuerda que es una solución inicial, no la óptima; (5) qué cuenta cada contador en Ordenamiento.',
      detalle: 'Qué revisar: compara los datos, las restricciones y el total, además de las aristas o parejas elegidas. Dos soluciones factibles con el mismo valor óptimo pueden ser correctas aunque elijan elementos distintos; que coincida el total por sí solo no prueba su validez. Próxima acción: recorre el paso a paso y localiza la primera decisión que difiere de tu cálculo; pregúntame «¿por qué eligió esta arista?» o «explica este paso» en ese punto.',
      relacionadas: ['grafo.empates', 'basico.determinista', 'northwest.no-optimo', 'ordenamiento.contadores']
    },
    {
      id: 'problema.animacion-rapida', tema: 'problemas', modulos: ['dijkstra', 'kruskal', 'northwest', 'ordenamiento', 'arboles'],
      pregunta: 'La animación va muy rápido',
      variantes: ['la animacion va muy rapido', 'no alcanzo a ver los pasos', 'como hago mas lenta la animacion', 'va demasiado rapido', 'pasa muy rapido'],
      conceptos: ['rapido', 'rapida', 'animacion', 'lenta', 'no alcanzo'],
      breve: 'Cambia el selector «Velocidad» a Lento (en Dijkstra y Kruskal está en «Velocidad y más controles»), o pulsa «Pausar» y avanza con «Siguiente →» a tu ritmo. En Ordenamiento, el deslizador y el mapa permiten ir a cualquier paso; en todos los módulos, «← Anterior» retrocede.',
      detalle: 'La velocidad solo afecta a la reproducción: los pasos ya están calculados y no se pierde ninguno.',
      relacionadas: ['aplicacion.velocidad', 'aplicacion.pasos-controles', 'basico.complejidad-vs-tiempo']
    },
    {
      id: 'problema.ficticio', tema: 'problemas', modulos: ['northwest', 'asignacion'],
      pregunta: '¿Por qué hay un ficticio?',
      variantes: ['por que aparece un ficticio', 'de donde salio el origen ficticio', 'por que hay una columna ficticia', 'no puse ficticio y aparece', 'como quito el ficticio'],
      conceptos: ['ficticio', 'ficticia', 'aparece', 'quitar'],
      breve: 'En Esquina noroeste aparece porque la oferta total y la demanda total no coinciden: el ficticio absorbe la diferencia (destino ficticio si sobra oferta, origen ficticio si falta). En Asignación aparece porque la cantidad de recursos y tareas es distinta y el método necesita una matriz cuadrada. En ambos casos es parte del cálculo, no de tus datos.',
      detalle: 'Qué revisar: suma de ofertas frente a suma de demandas; cantidad de recursos frente a tareas. Próxima acción: si no quieres ficticio, iguala esas cantidades; si el desequilibrio es real, interprétalo como excedente no enviado o demanda no cubierta.',
      relacionadas: ['northwest.ficticios', 'northwest.balanceo', 'asignacion.ficticios']
    },
    {
      id: 'problema.sin-asignar', tema: 'problemas', modulos: ['asignacion'],
      pregunta: '¿Por qué este elemento quedó sin asignar?',
      variantes: ['por que quedo sin asignar', 'un recurso no tiene tarea', 'una tarea no tiene recurso', 'por que sobra un elemento', 'quedo sin pareja'],
      conceptos: ['sin asignar', 'sin pareja', 'sobra'],
      breve: 'Porque hay más elementos de un lado que del otro: el método empareja uno a uno y el excedente queda libre. Se queda sin asignar el elemento cuyo descarte permite el mejor total; si varios producen el mismo total, se elige de forma determinista. No es un error.',
      detalle: 'Qué revisar: la cantidad de recursos frente a la de tareas en la pestaña Grafo. Próxima acción: iguala las cantidades si quieres que todos tengan pareja, o acepta el resultado como está.',
      relacionadas: ['asignacion.sin-asignar', 'asignacion.rectangular', 'asignacion.ficticios']
    }
  ]);
})();
