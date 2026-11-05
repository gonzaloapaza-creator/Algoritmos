/* Conocimiento sobre el uso de la aplicación: módulos, controles comunes,
 * guardados, exportación, impresión y privacidad. Los nombres de botones son
 * los reales de cada página; si algo no existe, se dice. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  const GRAFOS = ['johnson', 'dijkstra', 'kruskal'];
  const TODOS = ['*'];

  K.registrar([
    {
      id: 'aplicacion.que-es', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué es Ciudad de los Algoritmos?',
      variantes: ['que es esta aplicacion', 'que es la ciudad de los algoritmos', 'para que sirve esta pagina', 'de que trata este sitio', 'que puedo hacer aqui'],
      conceptos: ['ciudad', 'aplicacion', 'sitio', 'pagina', 'proyecto'],
      breve: 'Ciudad de los Algoritmos es una aplicación educativa que muestra, paso a paso, cómo trabajan siete algoritmos clásicos: Johnson, Dijkstra, Kruskal, Asignación (método húngaro), Esquina noroeste, Ordenamiento y Árboles. Cada módulo es un edificio de la ciudad del inicio.',
      sencilla: 'Es un laboratorio para ver cómo piensa cada algoritmo: tú pones los datos y la aplicación muestra cada decisión.',
      detalle: 'Funciona por completo en tu navegador: los cálculos, los guardados y esta ayuda son locales. Solo los videos de apoyo y la carga inicial del sitio necesitan conexión.',
      relacionadas: ['aplicacion.modulos', 'aplicacion.elegir-algoritmo', 'aplicacion.internet', 'aplicacion.asistente']
    },
    {
      id: 'aplicacion.modulos', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué módulos incluye?',
      variantes: ['que algoritmos hay', 'cuales son los modulos', 'que edificios tiene la ciudad', 'lista de modulos', 'que temas cubre'],
      conceptos: ['modulos', 'modulo', 'edificios', 'algoritmos disponibles', 'lista'],
      breve: 'Siete módulos: Johnson (distancias entre todos los pares), Dijkstra (caminos mínimos desde un origen), Kruskal (árbol de expansión mínimo o máximo), Asignación (método húngaro), Esquina noroeste (solución inicial de transporte), Ordenamiento (Selection, Insertion, Bubble, Shell y Merge) y Árboles (BST, recorridos y reconstrucción).',
      relacionadas: ['aplicacion.elegir-algoritmo', 'aplicacion.abrir-modulo', 'aplicacion.que-es']
    },
    {
      id: 'aplicacion.elegir-algoritmo', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué algoritmo elijo según mi problema?',
      variantes: ['que modulo uso para mi problema', 'cual algoritmo necesito', 'que algoritmo sirve para', 'como se cual modulo usar', 'que algoritmo me conviene'],
      conceptos: ['elegir', 'elijo', 'conviene', 'cual uso', 'segun'],
      breve: 'Camino más barato desde un punto a los demás: Dijkstra (pesos no negativos). Distancias entre todos los pares o pesos negativos: Johnson. Conectar todos los puntos con el menor total: Kruskal. Emparejar personas con tareas una a una: Asignación. Repartir cantidades de orígenes a destinos: Esquina noroeste. Poner una lista en orden: Ordenamiento. Jerarquías y búsqueda por valor: Árboles.',
      sencilla: 'Pregúntate qué quieres: ¿una ruta?, ¿una red?, ¿un reparto?, ¿un orden? Cada respuesta lleva a un módulo distinto.',
      relacionadas: ['kruskal.vs-dijkstra-johnson', 'asignacion.vs-transporte', 'aplicacion.modulos']
    },
    {
      id: 'aplicacion.abrir-modulo', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo abro un módulo? ¿Qué son la vista ciudad y la vista lista?',
      variantes: ['como entro a un modulo', 'que es la vista ciudad', 'que es la vista lista', 'no encuentro el modulo en la ciudad', 'como cambio de modulo', 'donde esta el menu'],
      conceptos: ['abrir', 'entrar', 'vista ciudad', 'vista lista', 'menu', 'navegar', 'cambiar de modulo'],
      breve: 'En el inicio, selecciona un edificio de la ciudad para ver su descripción y el acceso al módulo. «Vista lista» muestra el mismo catálogo como lista por categorías, útil en pantallas pequeñas. Desde cualquier módulo, la barra lateral (o «Abrir menú» en móvil) permite cambiar a otro.',
      detalle: '«Pausar movimiento» detiene las demostraciones animadas del inicio; son ilustraciones, no cálculos de tus ejercicios.',
      relacionadas: ['aplicacion.modulos', 'aplicacion.que-es'],
      referencia: 'Inicio · «Vista ciudad» / «Vista lista»'
    },
    {
      id: 'aplicacion.ejemplos', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo cargo un ejemplo?',
      variantes: ['donde estan los ejemplos', 'puedo empezar con un ejemplo', 'cargar ejemplo', 'hay ejercicios de muestra', 'como uso el ejemplo de clase'],
      conceptos: ['ejemplo', 'ejemplos', 'muestra', 'caso de clase'],
      breve: 'Cada módulo tiene ejemplos listos: en Johnson, el botón «Ejemplos»; en Dijkstra y Kruskal, el selector «Ejemplo» y «Cargar ejemplo»; en Asignación, «Cargar ejemplo»; en Esquina noroeste, el selector «Ejemplo» con «Cargar»; en Ordenamiento, «Pinos al azar», «Casi ordenado» e «Invertido»; en Árboles, «Cargar ejemplo de clase» y «Generar árbol». Cargar un ejemplo reemplaza los datos actuales tras confirmar o se puede deshacer.',
      relacionadas: ['aplicacion.deshacer', 'aplicacion.reiniciar-vs-limpiar']
    },
    {
      id: 'aplicacion.crear-editar-eliminar', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo creo, selecciono, edito y elimino elementos?',
      variantes: ['como agrego un nodo', 'como elimino un nodo', 'como edito un nombre', 'como selecciono un elemento', 'como borro una conexion', 'como renombro un punto', 'como cambio el peso'],
      conceptos: ['crear', 'agregar', 'anadir', 'seleccionar', 'editar', 'eliminar', 'borrar', 'renombrar', 'nombre'],
      breve: 'Johnson: herramienta «Nodo» y toque en el lienzo para crear; «Seleccionar» para elegir, mover, «Editar nombre» o «Eliminar». Dijkstra y Kruskal: «Añadir» con un nombre; selecciona en el dibujo o en «Editar un punto existente» / «Editar una conexión existente» para «Renombrar», «Cambiar peso» o «Eliminar». Asignación: «+ Recurso», «+ Tarea», doble toque para renombrar, Supr para eliminar la selección. Esquina noroeste: «+ Origen (fila)», «+ Destino (columna)» y edición directa en la tabla. Ordenamiento y Árboles no tienen elementos editables individualmente: se trabaja con la lista de valores o con inserciones.',
      relacionadas: ['aplicacion.conectar-pesos', 'arboles.operaciones', 'aplicacion.deshacer']
    },
    {
      id: 'aplicacion.conectar-pesos', tema: 'aplicacion', modulos: GRAFOS.concat('asignacion'),
      pregunta: '¿Cómo conecto nodos y edito pesos?',
      variantes: ['como uno dos nodos', 'como creo una conexion', 'como pongo el peso', 'como cambio el peso de una arista', 'como hago una arista', 'herramienta conectar'],
      conceptos: ['conectar', 'conexion', 'unir', 'peso', 'arista', 'enlazar'],
      breve: 'Johnson: elige «Conectar», toca el nodo origen, luego el destino y escribe el peso. Dijkstra y Kruskal: en el formulario elige «Desde», «Hasta» y «Peso» y pulsa «Conectar»; para modificar, selecciona la conexión y usa «Cambiar peso». Asignación: herramienta «Conectar», toca un recurso y una tarea, o escribe directamente el valor en la matriz.',
      detalle: 'Las validaciones se aplican al conectar: sin bucles, sin duplicados, rango de pesos, y en Johnson sin conexiones inversas. Cambiar un peso invalida el resultado anterior.',
      relacionadas: ['grafo.aristas-duplicadas-opuestas', 'johnson.restriccion-editor', 'aplicacion.recalcular', 'problema.no-conecta']
    },
    {
      id: 'aplicacion.zoom', tema: 'aplicacion', modulos: GRAFOS.concat('asignacion', 'arboles'),
      pregunta: '¿Cómo uso el zoom, el desplazamiento, el ajuste y la ampliación?',
      variantes: ['como hago zoom', 'como muevo la vista', 'no veo todo el grafo', 'como centro el dibujo', 'que hace ver todo', 'que hace ampliar', 'como ajusto la vista'],
      conceptos: ['zoom', 'acercar', 'alejar', 'desplazar', 'desplazamiento', 'ajustar', 'ampliar', 'centrar', 'ver todo', 'vista'],
      breve: 'Johnson: botones «−», «100%» y «+» (el porcentaje ajusta la vista al grafo completo). Dijkstra y Kruskal: «Ver todo» encuadra, «Ampliar» da más espacio al lienzo y «Zoom y más» ofrece «−», «+», flechas de desplazamiento y PNG. Asignación: «−», «100%», «+» y «Ampliar». Árboles: «−», «+», «Centrar» y «Ajustar». También puedes arrastrar el lienzo o usar la rueda del ratón donde esté disponible.',
      relacionadas: ['aplicacion.png', 'problema.no-veo-grafo']
    },
    {
      id: 'aplicacion.deshacer', tema: 'aplicacion', modulos: GRAFOS.concat('asignacion', 'northwest'),
      pregunta: '¿Cómo deshago y rehago cambios?',
      variantes: ['como deshago', 'hay deshacer', 'como vuelvo atras', 'ctrl z funciona', 'como rehago', 'me equivoque como vuelvo'],
      conceptos: ['deshacer', 'rehacer', 'atras', 'ctrl z', 'ctrl y', 'historial'],
      breve: L => 'Johnson, Dijkstra, Kruskal, Asignación y Esquina noroeste tienen botones «Deshacer» y «Rehacer». Asignación y Esquina noroeste aceptan además Ctrl+Z / Ctrl+Y (Cmd en Mac) cuando el foco no está en un campo de texto; en los módulos de grafos usa los botones. Se recuerdan hasta ' + L.deshacer + ' acciones. Ordenamiento y Árboles no tienen deshacer general; en Árboles, «Quitar última inserción» revierte la última inserción.',
      relacionadas: ['aplicacion.atajos', 'arboles.operaciones', 'aplicacion.reiniciar-vs-limpiar']
    },
    {
      id: 'aplicacion.etapas', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo cambio de etapa o pestaña dentro de un módulo?',
      variantes: ['que son las etapas', 'como paso a la siguiente pestana', 'por que no puedo ir al resultado', 'que son los numeros 1 2 3 4 arriba', 'como vuelvo al grafo'],
      conceptos: ['etapa', 'etapas', 'pestana', 'pestanas', 'fase', 'continuar', 'volver'],
      breve: 'Los módulos de grafos y tablas se organizan en cuatro etapas numeradas (por ejemplo, Grafo → Matriz → Paso a paso → Resultado). Puedes pulsar el número de la etapa o usar los botones «Continuar…», «Ver resultado →» y «← Volver». Las etapas de pasos y resultado se habilitan después de calcular; si cambias datos, hay que recalcular.',
      detalle: 'Ordenamiento y Árboles no usan etapas: todo está en una misma pantalla con secciones.',
      relacionadas: ['aplicacion.pasos-controles', 'aplicacion.recalcular']
    },
    {
      id: 'aplicacion.pasos-controles', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo reproduzco, pauso, avanzo y retrocedo los pasos?',
      variantes: ['como veo los pasos', 'como avanzo un paso', 'como retrocedo', 'como reproduzco', 'como pauso', 'que hace siguiente', 'como voy al ultimo paso', 'controles del procedimiento'],
      conceptos: ['reproducir', 'pausar', 'avanzar', 'retroceder', 'siguiente', 'anterior', 'ultimo paso', 'controles'],
      breve: 'Todos los módulos tienen «← Anterior» y «Siguiente →». Dijkstra, Kruskal, Esquina noroeste, Ordenamiento y Árboles además tienen «Reproducir» (que cambia a «Pausar») y un selector de velocidad; Dijkstra y Kruskal ofrecen «Último paso» en «Velocidad y más controles». Ordenamiento tiene además un deslizador y un mapa de pasos para saltar; Árboles, «Reiniciar recorrido». Johnson y Asignación se recorren solo con Anterior, Siguiente y Reiniciar.',
      relacionadas: ['aplicacion.velocidad', 'aplicacion.atajos', 'aplicacion.reiniciar-vs-limpiar', 'ejercicio.paso']
    },
    {
      id: 'aplicacion.velocidad', tema: 'aplicacion', modulos: ['dijkstra', 'kruskal', 'northwest', 'ordenamiento', 'arboles'],
      pregunta: '¿Cómo cambio la velocidad de la animación?',
      variantes: ['la animacion va muy rapido', 'la animacion va muy lenta', 'como hago mas lento', 'donde esta la velocidad', 'selector de velocidad'],
      conceptos: ['velocidad', 'rapido', 'lento', 'animacion', 'ritmo'],
      breve: 'Usa el selector «Velocidad» (Lento, Normal, Rápido y, en Ordenamiento, Muy rápido). En Dijkstra y Kruskal está dentro de «Velocidad y más controles». La velocidad solo cambia el intervalo entre pasos durante «Reproducir»; no modifica el cálculo ni los contadores. Para ir a tu ritmo, pausa y usa «Siguiente» y «Anterior».',
      relacionadas: ['basico.complejidad-vs-tiempo', 'aplicacion.pasos-controles', 'problema.animacion-rapida']
    },
    {
      id: 'aplicacion.reiniciar-vs-limpiar', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué diferencia hay entre reiniciar los pasos y limpiar los datos?',
      variantes: ['que hace reiniciar', 'que hace limpiar', 'reiniciar borra mis datos', 'reiniciar vs limpiar', 'como vuelvo al primer paso', 'como borro todo'],
      conceptos: ['reiniciar', 'limpiar', 'borrar todo', 'primer paso', 'reinicio'],
      breve: '«Reiniciar» (o «Reiniciar recorrido») vuelve al primer paso del procedimiento sin tocar tus datos ni el resultado. «Limpiar», «Limpiar todo», «Limpiar datos» o «Limpiar árbol» borran el ejercicio actual (con confirmación donde corresponde) para empezar de cero; en los módulos con historial se puede deshacer.',
      sencilla: 'Reiniciar rebobina la película; limpiar borra el guion.',
      relacionadas: ['aplicacion.deshacer', 'aplicacion.pasos-controles']
    },
    {
      id: 'aplicacion.recalcular', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Por qué el resultado desaparece o deja de ser vigente al cambiar datos?',
      variantes: ['el resultado ya no aparece', 'por que tengo que recalcular', 'que significa resultado no vigente', 'cambie un dato y se borro el resultado', 'el resultado cambio'],
      conceptos: ['recalcular', 'vigente', 'invalidado', 'desaparece', 'cambio'],
      breve: 'Porque el resultado corresponde a los datos con los que se calculó. Si cambias pesos, conexiones, valores, dimensiones, el modo, el origen o el objetivo, la aplicación invalida el resultado anterior para no mostrar algo incorrecto, y pide calcular de nuevo. Mover o renombrar elementos y cambiar solo el destino en Dijkstra conservan el resultado.',
      sencilla: 'Si cambias los ingredientes, el plato anterior ya no corresponde a la receta. Hay que cocinar de nuevo.',
      detalle: 'En Ordenamiento, editar el campo de valores sin pulsar «Usar valores» deja la lista anterior vigente; el aviso te recuerda aplicarla. En Esquina noroeste, cambiar solo un costo conserva la lógica de cantidades, pero el total cambia, por lo que también exige resolver otra vez.',
      relacionadas: ['basico.entrada-proceso-salida', 'problema.resultado-cambio', 'problema.resultado-desaparecio']
    },
    {
      id: 'aplicacion.tema', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo cambio el tema claro u oscuro?',
      variantes: ['como pongo modo oscuro', 'donde cambio el tema', 'tema claro', 'tema oscuro', 'modo nocturno'],
      conceptos: ['tema', 'oscuro', 'claro', 'nocturno', 'colores'],
      breve: 'En la barra lateral de cualquier página hay un botón «Tema claro» / «Tema oscuro»; en el inicio también aparece como «Tema» en la cabecera. La preferencia se recuerda en este navegador.',
      relacionadas: ['aplicacion.presentacion', 'aplicacion.privacidad']
    },
    {
      id: 'aplicacion.presentacion', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué es el modo presentación?',
      variantes: ['como activo el modo presentacion', 'que hace el modo presentacion', 'modo proyector', 'pantalla limpia para proyectar', 'alt p'],
      conceptos: ['presentacion', 'proyector', 'proyectar', 'pantalla completa', 'alt+p'],
      breve: 'El modo presentación oculta la barra lateral y el pie, ensancha el contenido y agranda la tipografía para proyectar en clase. Se activa con el botón de la cabecera (visible en pantallas de escritorio) o con Alt+P, y se sale con Escape o el mismo botón. No está disponible en la página de inicio.',
      relacionadas: ['aplicacion.atajos', 'aplicacion.tema'],
      referencia: 'Cabecera · botón «Modo presentación» (Alt+P)'
    },
    {
      id: 'aplicacion.guardar', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo guardo y cargo trabajos?',
      variantes: ['como guardo mi trabajo', 'como guardo el ejercicio', 'donde se guardan mis trabajos', 'como recupero un trabajo', 'que es mis trabajos', 'como cargo un trabajo guardado', 'se guarda solo'],
      conceptos: ['guardar', 'guardado', 'guardados', 'cargar', 'recuperar', 'trabajo', 'trabajos', 'mis trabajos', 'autoguardado'],
      breve: L => 'Cada módulo guarda automáticamente el ejercicio actual en este navegador. Para conservar varias versiones, pulsa «Guardar» en la cabecera, escribe un nombre y confirma. «Cargar» abre «Mis trabajos», donde puedes cargar, renombrar, eliminar, exportar e importar. Se admiten hasta ' + L.trabajos + ' trabajos por módulo. Cargar reemplaza el ejercicio actual después de confirmar. Johnson además tiene «Guardar grafo» y «Biblioteca» para grafos.',
      detalle: 'En el inicio, «Trabajos recientes» muestra los últimos guardados y abre la biblioteca del módulo correspondiente. Los trabajos pertenecen a este navegador y a este origen (sitio): no se sincronizan entre equipos ni entre localhost y el sitio publicado.',
      relacionadas: ['aplicacion.json', 'aplicacion.origenes', 'problema.no-guarda', 'problema.no-encuentro-trabajo'],
      referencia: 'Cabecera · «Guardar» y «Cargar»'
    },
    {
      id: 'aplicacion.json', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo importo y exporto JSON?',
      variantes: ['como exporto mi ejercicio', 'como importo un archivo', 'como llevo mi trabajo a otra computadora', 'que es exportar json', 'donde esta importar json', 'como comparto un ejercicio'],
      conceptos: ['json', 'exportar', 'importar', 'archivo', 'descargar', 'compartir', 'trasladar', 'otra computadora', 'otro equipo'],
      breve: 'Hay dos niveles. Un ejercicio: Johnson, Dijkstra, Kruskal, Asignación y Esquina noroeste tienen «Exportar JSON» e «Importar JSON» (en «Más», «Más opciones», «Edición» o «Ejemplos» según el módulo). Varios trabajos: en «Cargar» → «Mis trabajos», «Exportar» descarga todos los trabajos del módulo y «Importar» los añade sin pisar los existentes. Ordenamiento y Árboles exportan e importan solo desde «Mis trabajos».',
      detalle: 'Los archivos se validan antes de reemplazar datos; uno inválido o de otro módulo se rechaza con un aviso. El tamaño máximo de importación es 1 MiB. Para llevar un trabajo a otra computadora: exporta aquí, copia el archivo y usa Importar en el mismo módulo allí.',
      relacionadas: ['aplicacion.guardar', 'aplicacion.origenes', 'problema.no-importa']
    },
    {
      id: 'aplicacion.png', tema: 'aplicacion', modulos: GRAFOS.concat('asignacion', 'arboles'),
      pregunta: '¿Cómo exporto una imagen PNG?',
      variantes: ['como descargo el grafo como imagen', 'como guardo el dibujo', 'exportar png', 'puedo sacar una imagen del arbol', 'donde esta el boton png'],
      conceptos: ['png', 'imagen', 'descargar dibujo', 'captura'],
      breve: 'Johnson: «Exportar PNG» dentro de «Más ▼». Dijkstra y Kruskal: «PNG» dentro de «Zoom y más». Asignación: botón «PNG» junto al zoom. Árboles: botón «PNG» en los controles de vista. Se descarga el dibujo actual con el tema vigente; Algo no aparece en la imagen. Esquina noroeste y Ordenamiento no exportan PNG: usa imprimir o guardar como PDF.',
      relacionadas: ['aplicacion.imprimir', 'aplicacion.zoom']
    },
    {
      id: 'aplicacion.imprimir', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo imprimo o guardo como PDF?',
      variantes: ['como imprimo el procedimiento', 'como guardo en pdf', 'imprimir todos los pasos', 'puedo imprimir el resultado', 'donde esta imprimir'],
      conceptos: ['imprimir', 'impresion', 'pdf', 'papel'],
      breve: 'Johnson, Asignación y Esquina noroeste tienen «Imprimir» en la etapa de pasos; Dijkstra y Kruskal, «Imprimir todos los pasos» en «Velocidad y más controles». Preparan todos los pasos en una vista limpia y abren el diálogo del navegador, donde puedes elegir una impresora o «Guardar como PDF». En Ordenamiento, Árboles e Inicio usa Ctrl+P: imprime la vista actual. Algo se oculta al imprimir.',
      relacionadas: ['aplicacion.png', 'aplicacion.pasos-controles']
    },
    {
      id: 'aplicacion.recuperacion', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué pasa si un guardado anterior es incompatible?',
      variantes: ['aviso de datos incompatibles', 'que es descargar original', 'que significa usar ejercicio actual', 'el autoguardado esta pausado', 'guardado incompatible', 'recuperacion de datos'],
      conceptos: ['incompatible', 'incompatibles', 'recuperacion', 'original', 'pausado', 'version'],
      breve: 'Si al abrir un módulo el guardado anterior no es compatible (otra versión o datos que ya no cumplen las reglas), la aplicación lo conserva intacto y pausa el autoguardado para no sobrescribirlo. En el aviso, «Descargar original» guarda ese archivo; después, «Usar ejercicio actual» vuelve a habilitar el guardado. Puedes trabajar y exportar mientras tanto.',
      detalle: 'No se eliminan datos para reparar nada automáticamente. Corrige los problemas señalados (bucles, duplicados, pares opuestos, valores fuera de rango) en una copia del original e impórtala.',
      relacionadas: ['aplicacion.guardar', 'aplicacion.json', 'problema.no-guarda']
    },
    {
      id: 'aplicacion.origenes', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Por qué mis guardados no aparecen en otra computadora o en otra dirección?',
      variantes: ['diferencia entre localhost y el sitio publicado', 'mis trabajos no estan en otro navegador', 'guarde en casa y no aparece en clase', 'los guardados se sincronizan', 'por que no veo mis trabajos en el celular'],
      conceptos: ['localhost', 'publicado', 'sitio', 'otra computadora', 'otro navegador', 'sincronizar', 'sincronizan', 'celular', 'origen'],
      breve: 'Porque los guardados viven en el almacenamiento local del navegador que usaste, y ese almacenamiento es distinto por dispositivo, por navegador y por dirección (origen): localhost, 127.0.0.1 y el sitio publicado tienen almacenes separados. No hay cuenta ni servidor que los sincronice. Para moverlos, exporta JSON y usa Importar en el otro lugar.',
      sencilla: 'Es como guardar apuntes en el cajón de un escritorio: están solo en ese escritorio. Para llevarlos a otro, haces una copia (exportar) y la llevas (importar).',
      relacionadas: ['aplicacion.json', 'aplicacion.guardar', 'aplicacion.privacidad', 'problema.no-encuentro-trabajo']
    },
    {
      id: 'aplicacion.asistente', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cómo funciona Algo, el asistente?',
      variantes: ['que es algo', 'quien eres', 'como funciona el asistente', 'eres una inteligencia artificial', 'usas internet para responder', 'que puedes responder', 'que sabes hacer', 'eres chatgpt'],
      conceptos: ['algo', 'asistente', 'ayuda', 'chat', 'robot', 'inteligencia artificial', 'ia', 'eres'],
      breve: 'Soy Algo, una ayuda local. Respondo con una base de conocimiento preparada por el equipo del proyecto y con la lectura del estado del ejercicio que tienes en pantalla. No uso internet, ni servicios externos, ni modelos de lenguaje: reconozco tu pregunta comparándola con preguntas conocidas. Puedo explicar conceptos, el uso de los módulos y el paso o resultado que estás viendo; si no reconozco algo, te lo digo y ofrezco alternativas.',
      sencilla: 'Soy como un índice inteligente del manual: busco la explicación que mejor coincide con tu pregunta. No invento respuestas.',
      detalle: 'Entiendo variaciones de escritura (mayúsculas, tildes, errores leves, sinónimos como nodo/vértice) y preguntas cortas de seguimiento como «más sencillo» u «otro ejemplo» referidas al último tema. La conversación se guarda solo en memoria mientras la página está abierta. Usa «Explorar temas» para ver todo lo que cubro.',
      relacionadas: ['aplicacion.internet', 'aplicacion.privacidad', 'aplicacion.que-es']
    },
    {
      id: 'aplicacion.internet', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué necesita internet y qué funciona sin conexión?',
      variantes: ['funciona sin internet', 'necesito conexion', 'puedo usar la aplicacion sin conexion', 'que partes usan internet', 'los calculos se hacen en un servidor'],
      conceptos: ['internet', 'conexion', 'sin conexion', 'offline', 'servidor', 'red'],
      breve: 'Los cálculos, los pasos, los guardados y esta ayuda funcionan sin conexión una vez que la página está cargada: todo ocurre en tu navegador. Necesitan internet la carga inicial del sitio (si lo abres desde la dirección publicada) y los videos de apoyo, que se reproducen desde YouTube. Si no hay conexión, puedes trabajar sin ellos.',
      relacionadas: ['aplicacion.privacidad', 'aplicacion.asistente', 'aplicacion.origenes']
    },
    {
      id: 'aplicacion.privacidad', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué pasa con mis datos? ¿Son privados?',
      variantes: ['a donde van mis datos', 'la aplicacion envia mis ejercicios', 'mis datos se guardan en un servidor', 'privacidad', 'quien ve mis trabajos'],
      conceptos: ['privacidad', 'privado', 'privados', 'datos', 'envia', 'servidor', 'seguridad'],
      breve: 'Tus ejercicios, guardados y preguntas a Algo se quedan en tu navegador: la aplicación no los envía a ningún servidor ni los comparte. Lo único que sale hacia internet es la solicitud de los videos cuando decides reproducirlos. Borrar los datos del navegador elimina tus guardados, así que exporta JSON si quieres conservarlos.',
      relacionadas: ['aplicacion.internet', 'aplicacion.origenes', 'aplicacion.json']
    },
    {
      id: 'aplicacion.atajos', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Qué atajos de teclado existen?',
      variantes: ['hay atajos de teclado', 'que teclas puedo usar', 'puedo avanzar con el teclado', 'atajos', 'teclas rapidas', 'como uso el teclado'],
      conceptos: ['atajo', 'atajos', 'teclado', 'teclas', 'tecla', 'flechas'],
      breve: 'Comunes: Escape cierra paneles y diálogos; Alt+P activa el modo presentación; Ctrl+P imprime; Tab recorre controles. Deshacer/Rehacer: Ctrl+Z / Ctrl+Y en Asignación y Esquina noroeste (en los módulos de grafos, usa los botones). Pasos: flechas ← → en Johnson, Esquina noroeste y Ordenamiento (fuera de campos de texto); en Ordenamiento también Espacio (reproducir/pausar), Inicio/Fin (primer/último paso) y R (reiniciar). Asignación: 1 y 2 cambian de herramienta; Supr elimina la selección. En Árboles y Ordenamiento, Enter o Espacio seleccionan el nodo o pino enfocado. En Algo: Enter envía y Mayús+Enter añade una línea.',
      relacionadas: ['aplicacion.pasos-controles', 'aplicacion.deshacer', 'aplicacion.presentacion']
    },
    {
      id: 'aplicacion.limites', tema: 'aplicacion', modulos: TODOS,
      pregunta: '¿Cuáles son los límites de cada módulo?',
      variantes: ['resumen de limites', 'cuantos elementos admite cada modulo', 'limites de la aplicacion', 'tabla de limites', 'maximos de cada modulo'],
      conceptos: ['limites', 'maximos', 'resumen', 'cada modulo'],
      breve: L => 'Johnson: pesos enteros de −' + L.peso + ' a ' + L.peso + '. Dijkstra y Kruskal: ' + L.grafosNodos + ' vértices y ' + L.grafosAristas + ' aristas; Dijkstra solo pesos de 0 a ' + L.peso + ', Kruskal de −' + L.peso + ' a ' + L.peso + '. Asignación: ' + L.asignacionMin + '–' + L.asignacionMax + ' recursos y tareas, valores enteros hasta ±' + L.asignacionValor + '. Esquina noroeste: ' + L.northwestMin + '–' + L.northwestMax + ' orígenes y destinos, costos con ' + L.northwestDecimales + ' decimales hasta ' + L.northwestCosto + ', cantidades enteras hasta ' + L.northwestCantidad + '. Ordenamiento: ' + L.ordenCantidadMin + '–' + L.ordenCantidadMax + ' enteros de ' + L.ordenMin + ' a ' + L.ordenMax + '. Árboles: ' + L.arbolMin + '–' + L.arbolMax + ' enteros únicos de ' + L.arbolValorMin + ' a ' + L.arbolValorMax + '.',
      relacionadas: ['basico.validacion-limites', 'johnson.reglas', 'dijkstra.reglas', 'kruskal.reglas', 'asignacion.reglas', 'northwest.reglas', 'ordenamiento.reglas', 'arboles.reglas']
    }
  ]);
})();
