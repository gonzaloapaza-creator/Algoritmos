/* Contexto de Algo: lectura bajo demanda, sin almacenamiento ni cálculos nuevos.
 * Cada propiedad enviada está elegida explícitamente. Las etiquetas y los textos
 * del ejercicio son datos, nunca instrucciones para el asistente. */
'use strict';

(() => {
  if (window.AlgoContexto) return;
  const NOMBRES = {
    inicio: 'Inicio', johnson: 'Johnson', dijkstra: 'Dijkstra', kruskal: 'Kruskal',
    asignacion: 'Asignación', northwest: 'Esquina noroeste', ordenamiento: 'Ordenamiento', arboles: 'Árboles', difusa: 'Lógica difusa'
  };
  const GUIAS = {
    inicio: 'Elige una tarjeta de la ciudad: Johnson, Dijkstra, Kruskal, Asignación, Esquina noroeste, Ordenamiento, Árboles o Lógica difusa. Dentro de cada módulo puedes cargar un ejemplo y consultar su ayuda.',
    difusa: 'Carga un ejemplo o elige «Crear mi sistema». Revisa Variables y pertenencias, configura Reglas y pasa a Evaluar para introducir valores. Procedimiento y resultado muestra la ejecución real. Puedes usar de una a tres entradas, una salida, conjuntos triangulares o trapezoidales y reglas AND/OR con peso. Los ejemplos son didácticos, sin calibración para decisiones reales.',
    johnson: 'Crea los vértices y las conexiones, revisa la matriz y calcula para seguir los pasos y ver las distancias entre todos los pares. Esta aplicación prohíbe bucles, duplicados y conexiones inversas; es una decisión del editor, no una limitación matemática de Johnson. Sí permite pesos negativos y ciclos de tres o más vértices. Un ciclo negativo impide obtener distancias mínimas.',
    dijkstra: 'Crea un grafo o carga un ejemplo; elige origen y, si quieres, destino. Usa pesos enteros no negativos y calcula. Se obtienen distancias desde el origen a todos los vértices. En modo dirigido se permiten A→B y B→A como conexiones diferentes. No se admiten bucles ni duplicados.',
    kruskal: 'Crea un grafo no dirigido o carga un ejemplo, elige peso mínimo o máximo y calcula. Los pasos aceptan una conexión cuando une componentes distintas; rechazan la que cerraría un ciclo. Un grafo conectado produce un árbol de expansión y uno desconectado, un bosque. Los pesos pueden ser negativos o cero.',
    asignacion: 'Añade recursos y tareas y completa todos sus valores en el grafo o la matriz. Elige minimizar costos o maximizar beneficios y pulsa Resolver. Una casilla pendiente no equivale a cero. El método húngaro asigna cada recurso y tarea a lo sumo una vez; si las cantidades difieren, algunas quedan sin asignar.',
    northwest: 'Completa costos, ofertas y demandas; revisa el balanceo y avanza por la resolución. El balanceo agrega un origen o destino ficticio cuando hace falta. Esquina noroeste obtiene una solución inicial factible: no garantiza el costo mínimo. Cero es un dato válido; una casilla vacía sigue pendiente.',
    ordenamiento: 'Escribe entre 3 y 200 enteros de 1 a 99 o genera una lista; elige uno de los cinco algoritmos y avanza o reproduce. La velocidad cambia la animación; el tiempo de preparación mide el cálculo del procedimiento. No son la misma medida. Se permiten valores repetidos.',
    arboles: 'En BST, inserta valores únicos entre −999 y 999, con un máximo de 31 nodos. Quitar última revierte la última inserción; no elimina un nodo arbitrario. En reconstrucción, introduce recorridos compatibles para crear un árbol binario general, que no tiene por qué ser BST. Elige un recorrido para visitar y emitir sus valores.'
  };

  // Guías contrastadas con la ayuda y los controles de cada módulo. No ejecutan
  // operaciones del ejercicio ni sustituyen sus validadores o algoritmos.
  const TEMAS = {
    inicio: {
      datos: 'Selecciona un edificio y entra en su módulo. «Vista lista» ofrece el mismo catálogo por categorías. Los datos del ejercicio se ingresan dentro de cada módulo.',
      reglas: 'Hay ocho módulos independientes. Los trabajos pertenecen al navegador y al origen: localhost, 127.0.0.1 y el sitio publicado tienen almacenes separados.',
      herramientas: 'Selecciona un edificio para ver su descripción y acceso. Puedes cambiar entre ciudad y lista, y pausar las demostraciones. Las demostraciones del inicio ilustran ideas; no calculan tus ejercicios.',
      pasos: 'Entra en un módulo y prepara un ejercicio para ver su procedimiento. Las escenas del inicio no son pasos calculados.',
      resultado: 'El inicio presenta el catálogo y los trabajos recientes. Abre el módulo correspondiente para consultar un resultado calculado.',
      errores: 'Si no encuentras un módulo en la ciudad, usa «Vista lista». Los videos requieren conexión; puedes trabajar sin reproducirlos.'
    },
    difusa: {
      datos: 'Configura nombres, unidades, dominios y conjuntos en Variables y pertenencias. Los valores de una evaluación se introducen por separado en Evaluar mediante campo o deslizador. Se admite punto o coma decimal sin separadores ambiguos. Editar datos matemáticos invalida la ejecución anterior.',
      reglas: 'De 1 a 3 entradas, una salida, entre 2 y 5 conjuntos por variable y de 1 a 125 reglas. AND usa mínimo y OR máximo. El peso de 0 a 1 multiplica la activación. Implicación mínimo, agregación máximo y centroide continuo de la envolvente lineal con nudos, recortes e intersecciones. Una regla necesita alguna entrada y un consecuente válido.',
      herramientas: 'Navega por Inicio, Variables y pertenencias, Reglas, Evaluar y Procedimiento y resultado. Selecciona una regla y un punto de salida para consultar su recorte. Genera el mapa bajo petición; puedes cancelarlo. Los cambios de ejemplo y las eliminaciones con reglas afectadas requieren una decisión explícita.',
      pasos: 'La ejecución registra datos, fuzzificación, activación AND/OR, peso, recortes, envolvente e integral del centroide continuo. La gráfica usa los tramos de esa integral. Los 1001 puntos uniformes son consultas auxiliares y no determinan el resultado. Un punto muestreado con pertenencia cero no demuestra que toda la salida tenga masa cero.',
      resultado: 'El centroide es el resultado numérico principal, dentro del dominio de salida configurado. Las etiquetas adicionales usan los nombres de sus conjuntos y la mayor pertenencia del centroide, conservando empates. Si ninguna categoría contiene ese punto, se conserva el número sin inventar una etiqueta.',
      errores: 'Revisa nombres únicos, dominios válidos, parámetros ordenados dentro del rango, reglas completas y entradas finitas dentro de sus dominios. Una zona sin pertenencia y una zona sin reglas activas son problemas distintos. Si no se activa salida, revisa valores, antecedentes, reglas desactivadas y pesos cero.'
    },
    johnson: {
      datos: 'Usa «Nodo» para crear nodos y «Conectar» para elegir origen, destino y peso. En «Seleccionar», selecciona el elemento para editarlo; revisa también la matriz antes de «Calcular Johnson». Puedes comenzar con «Ejemplos».',
      reglas: 'Pesos enteros entre −999999 y 999999; cero y negativos son válidos. El editor prohíbe bucles, duplicados y conexiones inversas; son reglas del editor, no restricciones universales de Johnson. Un ciclo negativo detiene Johnson global; solo los pares que pueden atravesarlo carecen de mínimo finito. Máximos requieren DAG; tiempos y holguras también requieren duraciones no negativas y extremos distintos conectados.',
      herramientas: '«Seleccionar» permite elegir y mover elementos; «Nodo» añade nodos y «Conectar» une origen y destino. Usa los controles de zoom («−», «100%», «+») para explorar el grafo. Cambiar sus datos exige recalcular; «Deshacer» y «Rehacer» recuperan cambios.',
      pasos: 'Pasa por Grafo → Matriz → Paso a paso → Resultado. «Anterior», «Siguiente» y «Reiniciar» recorren el procedimiento calculado: Bellman-Ford, potenciales, reponderación, Dijkstra y recuperación de distancias originales.',
      resultado: 'Consulta de caminos: nombre arriba, mínimo desde el origen a la izquierda y máximo DAG a la derecha; no se fuerza su igualdad. Con una ruta activa, el destino muestra Acum. (suma de los pesos originales de sus tramos) y Total (costo de esa ruta), que deben coincidir; sin ruta única activa conserva mín | máx. El último paso del procedimiento reconstruye esa misma ruta. Tiempos y holguras es un análisis complementario con temprano/tardío y destino T | T; H=0 identifica actividades críticas. La matriz secundaria contiene únicamente mínimos originales de Johnson. ∞ significa sin camino y — significa máximo no calculable por ciclos.',
      errores: 'Revisa pesos enteros, conexiones repetidas o inversas y bucles. Si la aplicación informa un ciclo negativo, corrige sus conexiones y calcula de nuevo. Si editaste el grafo, recalcula antes de interpretar el resultado.'
    },
    dijkstra: {
      datos: 'Carga un ejemplo o escribe el nombre del punto y pulsa «Añadir». Elige «Desde», «Hasta» y peso, y pulsa «Conectar». Continúa a elegir origen; el destino es opcional. El modo puede ser dirigido o no dirigido.',
      reglas: 'Hasta 24 vértices, 96 aristas y nombres de 12 caracteres. Pesos enteros entre 0 y 999999. No admite negativos, bucles ni duplicados. En dirigido A→B y B→A son diferentes. Solo calcula caminos mínimos.',
      herramientas: 'Selecciona el dibujo o usa «Editar un punto existente» y «Editar una conexión existente» para renombrar, cambiar pesos o eliminar. Puedes arrastrar puntos o ajustar sus coordenadas. «Ver todo» encuadra y «Zoom y más» ofrece zoom, desplazamiento y PNG.',
      pasos: 'Después de calcular, usa «Anterior», «Siguiente» y «Reproducir/Pausar». «Velocidad y más controles» ofrece reiniciar y último paso. Se elige el pendiente de menor distancia y se revisan sus conexiones; las tablas muestran distancias y predecesores.',
      resultado: 'Las distancias parten del origen elegido y se calculan a todos los puntos. ∞ o «Sin camino» significa inalcanzable; el origen tiene distancia 0. Elegir otro destino muestra su ruta sin recalcular. «Ver todos los caminos» recupera el árbol de caminos mínimos. En empates se conserva el primer camino encontrado.',
      errores: 'Elige un origen y usa pesos no negativos. ∞ no es un error ni un costo cero: puede faltar una conexión o su dirección impedir el acceso. Cambiar pesos, conexiones, modo u origen invalida el resultado; mover o renombrar puntos y cambiar solo el destino lo conserva.'
    },
    kruskal: {
      datos: 'Carga un ejemplo o añade puntos con nombre. Elige dos extremos y un peso para «Conectar». Continúa a elegir el objetivo Mínimo o Máximo y calcula. No necesita origen ni destino.',
      reglas: 'Grafo no dirigido: hasta 24 vértices y 96 aristas, nombres de hasta 12 caracteres. Pesos enteros entre −999999 y 999999, incluidos cero y negativos. No se admiten bucles ni duplicados. El grafo de entrada puede contener ciclos.',
      herramientas: 'Selecciona un punto o conexión en el dibujo o en los editores de listas para renombrar, cambiar pesos o eliminar. Arrastra los puntos o ajusta sus coordenadas. «Ver todo» encuadra; «Ampliar» da espacio y «Zoom y más» ofrece zoom y PNG.',
      pasos: 'Usa «Anterior», «Siguiente» o «Reproducir/Pausar». Las conexiones se ordenan según Mínimo o Máximo y se aceptan si unen grupos distintos; se rechazan si forman un ciclo. «Velocidad y más controles» permite reiniciar o ir al último paso.',
      resultado: 'El resultado muestra conexiones elegidas, peso total y componentes. Un grupo conectado produce un árbol; varios producen un bosque, conservando puntos aislados. No calcula rutas mínimas. Con pesos iguales puede existir otra selección con el mismo total.',
      errores: 'Un bosque no indica un fallo: el grafo tiene grupos separados. Agrega conexiones entre grupos si quieres un único árbol y vuelve a calcular. Cambiar pesos, conexiones u objetivo invalida el resultado; mover o renombrar puntos lo conserva.'
    },
    asignacion: {
      datos: 'Usa «+ Recurso» y «+ Tarea», y completa cada pareja en el grafo o en la matriz. «Conectar» enlaza un recurso con una tarea; doble toque sobre un nodo lo renombra. «Completar pendientes» aplica un mismo valor a las parejas vacías. Elige Minimizar o Maximizar antes de «Resolver».',
      reglas: 'De 1 a 8 recursos y de 1 a 8 tareas; nombres de hasta 24 caracteres. Valores enteros entre −999999 y 999999. Cero es válido y vacío es pendiente. No admite decimales ni infinitos. Si los tamaños difieren, algunos elementos quedan sin asignar.',
      herramientas: 'El grafo y la matriz comparten datos. Conectar solo permite parejas recurso–tarea. Eliminar una conexión la deja pendiente; borrar un nodo elimina sus conexiones. Arrastra nodos, usa «Reordenar» para volver a dos columnas y el zoom para explorar.',
      pasos: 'Grafo → Matriz y validación → Resultado → Procedimiento. «Anterior», «Siguiente» y «Reiniciar» recorren el método húngaro; puedes elegir una fase o «Ver todos». Se muestran conversión de maximización, ficticios, reducciones, coberturas, ajustes con δ y asignación final.',
      resultado: 'Cada recurso y tarea se asigna a lo sumo una vez. El total usa los valores originales y el objetivo elegido. Con cantidades distintas, los ficticios representan elementos sin asignar y no se añaden a tus datos. Tocar una pareja la resalta en grafo, lista y matriz; «Mostrar todas» recupera las demás conexiones.',
      errores: '«Resolver» se deshabilita si hay datos pendientes o inválidos. Completa cada pareja y corrige texto o decimales. Una conexión con «?» sigue pendiente. Cambiar valores, dimensiones u objetivo exige recalcular. Renombrar o mover un nodo conserva el resultado.'
    },
    northwest: {
      datos: 'Edita los costos unitarios en el centro, la oferta en la última columna y la demanda en la última fila. Completa cada casilla y pasa a Balanceo; confirma el ficticio si hace falta antes de resolver. Los ejemplos permiten comenzar con datos completos.',
      reglas: 'De 1 a 10 orígenes y destinos reales. Costos de 0 a 999999 con hasta 2 decimales, coma o punto; oferta y demanda enteras de 0 a 999999. Nombres de hasta 40 caracteres. Vacío es pendiente, cero es válido. No admite rutas prohibidas ni cantidades fraccionarias.',
      herramientas: 'La tabla de Datos permite editar costos, oferta, demanda y nombres. Balanceo muestra el ficticio sin modificar tus datos reales. Usa ejemplos para comenzar y Ctrl+Z / Ctrl+Y para deshacer o rehacer cambios.',
      pasos: 'Datos → Balanceo → Resolución paso a paso → Resultado. Se asigna min(oferta restante, demanda restante), empezando arriba a la izquierda. Baja al agotarse la oferta o avanza a la derecha al cubrir la demanda. «Anterior», «Siguiente», «Reiniciar» y «Reproducir/Pausar» recorren las decisiones.',
      resultado: 'Es una solución inicial factible; no garantiza el costo mínimo. El total suma cantidad × costo unitario. Si sobra oferta se agrega destino ficticio; si falta oferta, origen ficticio, con costo 0 por convención. Un 0 básico pertenece a la base sin representar un envío. Los ficticios no alteran los datos originales.',
      errores: 'Completa todas las celdas; corrige costos negativos, más de dos decimales o cantidades fraccionarias. Una oferta y demanda desiguales requieren balanceo. Cambiar costos, oferta o demanda exige resolver de nuevo. Cambiar solo costos conserva la lógica de cantidades, pero cambia el total.'
    },
    ordenamiento: {
      datos: 'Escribe de 3 a 200 enteros de 1 a 99, incluidos repetidos, y pulsa «Usar valores». También puedes generar datos al azar, casi ordenados o invertidos. Elige Selection, Insertion, Bubble, Shell o Merge Sort.',
      reglas: 'De 3 a 200 enteros entre 1 y 99. No admite cero, negativos, decimales ni texto. Se permiten repetidos. Todos los métodos ordenan de menor a mayor. Hasta 12 valores se muestran pinos; con más, barras con desplazamiento interno.',
      herramientas: '«Usar valores» aplica la entrada escrita. Seleccionar o enfocar un elemento consulta valor, posición e identificador estable. El deslizador permite elegir cada evento; el mapa resume hasta 120 marcas. La velocidad controla la reproducción, no el rendimiento del cálculo.',
      pasos: '«Siguiente» y «Anterior» recorren un evento. «Reproducir/Pausar» controla el avance y «Reiniciar» vuelve al paso 0 sin borrar datos. El mapa y el deslizador saltan a otros pasos. Cambiar método o valores prepara un procedimiento nuevo. El pseudocódigo resalta la línea actual.',
      resultado: 'Los contadores son acumulados hasta el paso elegido. Cada comparación de valores cuenta una comparación. Selection, Bubble y Shell cuentan intercambios; Insertion cuenta desplazamientos mediante intercambios con la clave; Merge cuenta escrituras auxiliares y copias de vuelta. La lista final se consulta al llegar al último evento.',
      errores: 'Si editaste el campo, pulsa «Usar valores» para que el procedimiento corresponda a esa lista. Una entrada inválida conserva la lista anterior. La velocidad es el intervalo de animación, y el tiempo de preparación mide el cálculo; no son la misma medida.'
    },
    arboles: {
      datos: 'En búsqueda BST escribe un entero y pulsa «Agregar» o Enter. Puedes generar valores únicos o cargar el ejemplo. En reconstrucción, escribe preorden + inorden, inorden + postorden o los tres; separa valores con comas o espacios.',
      reglas: 'Entre 1 y 31 valores únicos de −999 a 999. Cero es válido; no admite duplicados, decimales ni texto. Los recorridos de reconstrucción deben tener la misma longitud, valores y estructura compatible. Preorden + postorden exige también inorden. No hay balanceo automático.',
      herramientas: 'Selecciona un nodo para consultar padre, hijos y si es raíz u hoja; Tab lo enfoca y Enter/Espacio lo seleccionan. Usa +/−, «Centrar» y «Ajustar». «Quitar última inserción» solo revierte la última inserción en BST: seleccionar un nodo no permite editarlo ni borrarlo individualmente.',
      pasos: 'Elige preorden (raíz–izquierda–derecha), inorden (izquierda–raíz–derecha) o postorden (izquierda–derecha–raíz). Usa «Anterior», «Siguiente», «Reproducir/Pausar» y «Reiniciar recorrido». Visitar un nodo y agregarlo a la salida son eventos distintos.',
      resultado: 'La salida parcial contiene solo los valores emitidos hasta el paso elegido. Inorden ordena valores únicamente si el árbol es BST. La reconstrucción puede producir un árbol binario general que no sea BST. El orden de inserción cambia la forma de un BST.',
      errores: 'Revisa valores repetidos, rango y recorridos incompatibles. Una reconstrucción inválida conserva el árbol previo. Para insertar en un árbol reconstruido, primero limpia ese árbol. Al generar valores, el rango debe contener suficientes enteros distintos.'
    }
  };

  const numero = valor => typeof valor === 'number'
    ? (Number.isFinite(valor) ? valor : valor === Infinity ? '∞' : valor === -Infinity ? '−∞' : null) : null;
  const lista = valor => Array.isArray(valor) ? valor : [];
  const propio = (objeto, clave) => objeto && Object.prototype.hasOwnProperty.call(objeto, clave) ? objeto[clave] : null;
  const indice = valor => Number.isInteger(valor) && valor >= 0 ? valor : 0;
  // La revisión incluye datos que pudieron quedar fuera de la muestra de contexto.
  // Solo se conservan dos huellas; no se copia otro trabajo ni almacenamiento.
  function huella(valor) {
    const fuente = JSON.stringify(valor);
    let a = 2166136261, b = 5381;
    for (let i = 0; i < fuente.length; i++) {
      a = Math.imul(a ^ fuente.charCodeAt(i), 16777619);
      b = Math.imul(b, 33) ^ fuente.charCodeAt(i);
    }
    return (a >>> 0).toString(16) + '-' + (b >>> 0).toString(16);
  }

  function obtener() {
    const solicitado = document.body && document.body.dataset ? document.body.dataset.modulo : '';
    const modulo = Object.prototype.hasOwnProperty.call(NOMBRES, solicitado) ? solicitado : 'inicio';
    let revision = null;
    const omitidos = [];
    const omitir = mensaje => { if (!omitidos.includes(mensaje)) omitidos.push(mensaje); };
    const texto = (valor, max = 80) => {
      if (typeof valor !== 'string') return '';
      if (valor.length > max) omitir('Algunas etiquetas o descripciones se abreviaron.');
      return valor.slice(0, max);
    };
    const tomar = (valores, max, ruta, transformar = numero) => {
      const origen = lista(valores);
      if (origen.length > max) omitir(ruta + ': se muestran ' + max + ' de ' + origen.length + ' elementos.');
      return origen.slice(0, max).map(transformar);
    };
    const matriz = (valores, max, ruta) => tomar(valores, max, ruta, (fila, i) => tomar(fila, max, ruta + '[' + i + ']'));
    const entidad = e => ({ id: texto(e && e.id), nombre: texto(e && e.nombre) });
    const conexion = c => ({ id: texto(c && c.id), desde: texto(c && c.desde), hacia: texto(c && c.hacia), valor: numero(c && c.valor) });
    const grafo = g => ({
      dirigido: g.dirigido !== false, cantidadVertices: lista(g.nodos).length, cantidadConexiones: lista(g.conexiones).length,
      nodos: tomar(g.nodos, 40, 'datos.nodos', entidad), conexiones: tomar(g.conexiones, 50, 'datos.conexiones', conexion)
    });
    const revisionGrafo = g => [lista(g.nodos).map(n => [n.id, n.nombre]), lista(g.conexiones).map(c => [c.id, c.desde, c.hacia, c.valor])];
    const marcaPaso = (p, actual, total, base = 1) => p ? {
      indice: indice(actual), numero: indice(actual) + base, total,
      tipo: texto(p.tipo), titulo: texto(p.titulo, 160), texto: texto(p.texto || p.explicacion || p.mensaje, 1200)
    } : null;
    const errorVisible = ids => {
      for (const id of ids) {
        const elemento = document.getElementById(id);
        if (elemento && !elemento.hidden && elemento.textContent && elemento.textContent.trim()) return texto(elemento.textContent.trim(), 1200);
      }
      return null;
    };
    const contexto = { vista: 'catalogo', datos: null, paso: null, resultado: null, resultadoVigente: false, error: null, seleccion: null };
    // Selección actual del editor: solo tipo, id y los datos ya visibles del elemento.
    const seleccionGrafo = (s, g) => {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string') return null;
      if (s.tipo === 'nodo') {
        const n = lista(g.nodos).find(x => x.id === s.id);
        return n ? { tipo: 'nodo', id: texto(n.id), nombre: texto(n.nombre) } : null;
      }
      if (s.tipo === 'conexion' || s.tipo === 'arista') {
        const c = lista(g.conexiones).find(x => x.id === s.id);
        return c ? { tipo: 'conexion', id: texto(c.id), desde: texto(c.desde), hacia: texto(c.hacia), valor: numero(c.valor) } : null;
      }
      return null;
    };

    if (modulo === 'johnson' && typeof estadoJohnson !== 'undefined' && typeof estado !== 'undefined') {
      contexto.vista = texto(estadoJohnson.vista);
      contexto.datos = grafo(estado);
      contexto.datos.tipoMatriz = contexto.vista === 'matriz' ? 'adyacencia' : 'distancias';
      contexto.seleccion = seleccionGrafo(estado.seleccion, estado);
      // La selección del editor solo identifica un elemento en el grafo principal.
      if (contexto.vista !== 'grafo') contexto.seleccion = null;
      revision = revisionGrafo(estado);
      contexto.resultadoVigente = typeof resultadoVigenteJohnson === 'function' && !!resultadoVigenteJohnson();
      if (contexto.resultadoVigente) {
        const r = estadoJohnson.resultado;
        // Este getter solo agrega el paso descriptivo de reconstrucción existente.
        const pasos = typeof pasosResolucionJohnson === 'function' ? pasosResolucionJohnson(r) : lista(r.pasos);
        const p = lista(pasos)[indice(estadoJohnson.pasoActual)];
        contexto.paso = marcaPaso(p, estadoJohnson.pasoActual, pasos.length);
        if (contexto.paso) contexto.paso.etapa = texto(p.tipo);
        const extremosPaso = estadoJohnson.seleccion || { origen: 0, destino: r.cantidad - 1 };
        const rotulosEtapa = {
          original: [['d', 'h'], ['Distancia desde q pendiente', 'Potencial pendiente']],
          auxiliar: [['d', 'h'], ['Distancia inicial desde q', 'Potencial pendiente']],
          bellman: [['antes', 'después'], ['Distancia desde q antes de esta pasada', 'Distancia desde q después de esta pasada']],
          ciclo: [['d', 'h'], ['Última distancia provisional desde q', 'Potencial no disponible por ciclo negativo']],
          verificacion: [['d(q,v)', 'h'], ['Distancia final desde q', 'Potencial h(v), igual a d(q,v)']],
          reponderacion: [['h', '—'], ['Potencial h(v)', 'Sin dato en esta etapa']],
          dijkstra: [["d'", 'd'], ['Distancia reponderada desde el origen de este paso', 'Distancia recuperada con pesos originales']],
          final: [['desde ' + texto(propio(r.nombres, extremosPaso.origen)), 'hasta ' + texto(propio(r.nombres, extremosPaso.destino))], ['Mínimo desde el origen de la consulta hasta cada nodo', 'Mínimo desde cada nodo hasta el destino de la consulta']]
        };
        if (contexto.vista === 'resolucion' && p && rotulosEtapa[p.tipo]) contexto.casillasJohnson = {
          rotulos: rotulosEtapa[p.tipo][0], etiquetas: rotulosEtapa[p.tipo][1], etapa: texto(p.titulo, 160)
        };
        if (contexto.paso && p.pasada) {
          contexto.paso.pasada = {
            numero: numero(p.pasada.numero), antes: tomar(p.pasada.antes, 40, 'paso.antes'),
            despues: tomar(p.pasada.despues, 40, 'paso.despues'),
            mejoras: lista(p.pasada.relajaciones).length
          };
        }
        if (contexto.paso && Number.isInteger(p.origen)) contexto.paso.origenIndice = p.origen;
        contexto.resultado = {
          tieneCicloNegativo: !!r.tieneCicloNegativo, ids: tomar(r.ids, 40, 'resultado.ids', v => texto(v)),
          distancias: r.distancias === null ? null : matriz(r.distancias, 8, 'resultado.distancias'),
          potenciales: tomar(r.potenciales, 40, 'resultado.potenciales'),
          cicloNodos: tomar(r.cicloNodos, 40, 'resultado.cicloNodos', v => texto(v)),
          cicloConexiones: tomar(r.cicloConexiones, 50, 'resultado.cicloConexiones', v => texto(v)), cicloPeso: numero(r.cicloPeso),
          seleccion: estadoJohnson.seleccion ? { origen: numero(estadoJohnson.seleccion.origen), destino: numero(estadoJohnson.seleccion.destino) } : null
        };
        const seleccion = estadoJohnson.seleccion;
        if (seleccion && Number.isInteger(seleccion.origen) && Number.isInteger(seleccion.destino)) {
          const origenId = lista(r.ids)[seleccion.origen], destinoId = lista(r.ids)[seleccion.destino];
          const origen = lista(estado.nodos).find(n => n.id === origenId), destino = lista(estado.nodos).find(n => n.id === destinoId);
          Object.assign(contexto.resultado.seleccion, {
            origenId: texto(origenId), destinoId: texto(destinoId),
            origenNombre: texto(origen && origen.nombre), destinoNombre: texto(destino && destino.nombre),
            distancia: numero(propio(propio(r.distancias, seleccion.origen), seleccion.destino)), ruta: null
          });
          // Esta ruta ya fue calculada para la celda que ve el usuario. Solo se
          // copia si pertenece al mismo grafo y a los extremos seleccionados.
          const ruta = estado.visualizacionJohnson;
          if (ruta && typeof estadoJohnson.firma === 'string' && ruta.firma === estadoJohnson.firma
              && ruta.origen === origenId && ruta.destino === destinoId) {
            contexto.resultado.consulta = { vista: ruta.vistaTemporal ? 'temporal' : 'caminos', objetivo: texto(ruta.objetivo),
              minimo: numero(propio(propio(ruta.valoresNodos, destinoId), 'minimo')), maximo: numero(propio(propio(ruta.valoresNodos, destinoId), 'maximo')) };
            // Lee la misma fuente que dibuja las casillas, sin consultar texto del
            // SVG. El respaldo permite usar la ayuda local sin cargar el dibujo.
            const valoresDestino = propio(ruta.valoresNodos, destinoId);
            const casillaDestino = typeof casillasNodoJohnson === 'function'
              ? casillasNodoJohnson({ id: destinoId }, ruta)
              : propio(ruta.casillas, destinoId) || {
                rotulos: ruta.vistaTemporal ? ['temprano', 'tardío'] : ['mín', 'máx'],
                valores: [propio(valoresDestino, 'minimo'), propio(valoresDestino, 'maximo')]
              };
            if (casillaDestino && Array.isArray(casillaDestino.valores)) contexto.resultado.consulta.destino = {
              rotulos: lista(casillaDestino.rotulos).slice(0, 2).map(v => texto(v)),
              valores: lista(casillaDestino.valores).slice(0, 2).map(numero)
            };
            if (contexto.vista !== 'resolucion' || p && p.tipo === 'ruta') {
              const seleccionada = contexto.seleccion && contexto.seleccion.tipo === 'nodo' ? contexto.seleccion : null;
              const id = seleccionada ? seleccionada.id : destinoId;
              const casilla = typeof casillasNodoJohnson === 'function' ? casillasNodoJohnson({ id }, ruta) :
                propio(ruta.casillas, id) || { rotulos: ruta.vistaTemporal ? ['temprano', 'tardío'] : ['mín', 'máx'],
                  valores: [propio(propio(ruta.valoresNodos, id), 'minimo'), propio(propio(ruta.valoresNodos, id), 'maximo')] };
              contexto.casillasJohnson = { rotulos: lista(casilla.rotulos).slice(0, 2).map(v => texto(v)),
                etiquetas: lista(casilla.etiquetas || casilla.rotulos).slice(0, 2).map(v => texto(v, 160)),
                temporal: !!ruta.vistaTemporal, etapa: contexto.vista === 'resolucion' && p ? texto(p.titulo, 160) : 'Consulta actual' };
              // Un par de consulta puede ser el predeterminado; no equivale a seleccionar un nodo.
              if (seleccionada) Object.assign(contexto.casillasJohnson, { nodo: seleccionada,
                valores: lista(casilla.valores).slice(0, 2).map(numero) });
            }
            if (typeof ruta.errorRuta === 'string' && ruta.errorRuta) contexto.resultado.consulta.error = texto(ruta.errorRuta, 400);
            const elegida = ruta.rutaSeleccionada && typeof ruta.rutaSeleccionada === 'object' ? ruta.rutaSeleccionada : ruta.tipo === 'ruta' ? ruta : null;
            if (!ruta.vistaTemporal && elegida) contexto.resultado.seleccion.ruta = {
              id: texto(elegida.id || ruta.objetivo),
              nodos: tomar(elegida.nodos, 40, 'resultado.seleccion.ruta.nodos', id => texto(id)),
              conexiones: tomar(elegida.conexiones, 50, 'resultado.seleccion.ruta.conexiones', id => texto(id)), distancia: numero(elegida.distancia)
            };
            if (ruta.vistaTemporal && ruta.temporal) {
              const t = ruta.temporal;
              contexto.resultado.temporal = { valido: !!t.valido, mensaje: texto(t.mensaje), duracion: numero(t.duracion),
                nodos: tomar(r.ids, 40, 'temporal.nodos', (id, i) => ({ id: texto(id), temprano: numero(propio(t.tempranos, i)), tardio: numero(propio(t.tardios, i)) })),
                actividades: tomar(lista(estado.conexiones).filter(c => lista(t.conexionesActivas).includes(c.id)), 50, 'temporal.actividades', c => ({ id: texto(c.id), desde: texto(c.desde), hacia: texto(c.hacia), duracion: numero(c.valor), holgura: numero(propio(t.holguras, c.id)), critica: lista(t.criticas).includes(c.id) })),
                excluidos: lista(estado.nodos).length - lista(t.idsActivos).length };
            }
          }
        }
      } else if (estadoJohnson.resultado) contexto.error = 'El grafo cambió: el resultado anterior no está vigente. Recalcula.';
      contexto.datos.resultadoInvalidado = !!estadoJohnson.resultado && !contexto.resultadoVigente;
      contexto.error = errorVisible(['validacionJohnson']) || contexto.error;
    } else if ((modulo === 'dijkstra' || modulo === 'kruskal') && typeof moduloGrafo !== 'undefined') {
      const e = moduloGrafo, r = e.resultado;
      contexto.vista = texto(e.vista);
      contexto.datos = Object.assign(grafo(e.grafo), { origen: texto(e.origen) || null, destino: texto(e.destino) || null, objetivo: texto(e.objetivo), preparando: !!e.preparando });
      contexto.seleccion = seleccionGrafo(e.seleccion, e.grafo);
      revision = revisionGrafo(e.grafo);
      // El controlador invalida el resultado al cambiar datos matemáticos. Además,
      // se compara la entrada del resultado sin nombres ni posiciones visuales.
      const firmaGrafo = g => JSON.stringify([g.dirigido !== false, lista(g.nodos).map(n => n.id), lista(g.conexiones).map(c => [c.id, c.desde, c.hacia, c.valor])]);
      contexto.resultadoVigente = !!r && !e.preparando && !!r.grafo && firmaGrafo(r.grafo) === firmaGrafo(e.grafo)
        && (modulo === 'dijkstra' ? r.origen === e.origen : r.objetivo === e.objetivo);
      if (contexto.resultadoVigente) {
        const p = lista(r.pasos)[indice(e.paso)];
        contexto.paso = marcaPaso(p, e.paso, lista(r.pasos).length);
        const distancias = valores => tomar(e.grafo.nodos, 40, 'distancias', n => ({ nodo: texto(n.id), distancia: numero(propio(valores, n.id)) }));
        if (modulo === 'dijkstra') {
          const predecesores = valores => tomar(e.grafo.nodos, 40, 'predecesores', n => {
              const anterior = propio(valores, n.id);
              return { nodo: texto(n.id), anterior: anterior ? texto(anterior.nodo) : null, conexion: anterior ? texto(anterior.conexion) : null };
            });
          contexto.resultado = { origen: texto(r.origen), destino: texto(e.destino) || null,
            distancias: distancias(r.distancias), predecesores: predecesores(r.predecesores) };
          if (contexto.paso) Object.assign(contexto.paso, {
            actual: texto(p.actual) || null, desde: texto(p.desde) || null, hacia: texto(p.hacia) || null,
            arista: texto(p.arista) || null, anterior: numero(p.anterior), candidata: numero(p.candidata), mejora: !!p.mejora,
            distancias: distancias(p.distancias), predecesores: predecesores(p.predecesores), finalizados: tomar(p.finalizados, 40, 'paso.finalizados', v => texto(v))
          });
        } else {
          const componentes = (v, ruta) => tomar(v, 40, ruta, (g, i) => tomar(g, 40, ruta + '[' + i + ']', id => texto(id)));
          contexto.resultado = { objetivo: texto(r.objetivo), total: numero(r.total), cantidadElegidas: lista(r.elegidas).length,
            cantidadComponentes: lista(r.componentes).length, elegidas: tomar(r.elegidas, 40, 'resultado.elegidas', v => texto(v)), componentes: componentes(r.componentes, 'resultado.componentes') };
          if (contexto.paso) Object.assign(contexto.paso, { arista: texto(p.arista), aceptada: !!p.aceptada, pesoAcumulado: numero(p.total),
            componentesAntes: componentes(p.componentesAntes, 'paso.componentesAntes'), componentesDespues: componentes(p.componentesDespues, 'paso.componentesDespues') });
        }
      } else if (r) contexto.error = 'Los datos cambiaron: el resultado anterior no está vigente. Recalcula.';
    } else if (modulo === 'asignacion' && typeof estadoAsignacion !== 'undefined') {
      const e = estadoAsignacion, m = e.modelo;
      const recursos = lista(m.recursos).slice(0, 8), tareas = lista(m.tareas).slice(0, 8);
      contexto.vista = texto(e.vista);
      contexto.datos = { objetivo: texto(e.objetivo), recursos: tomar(m.recursos, 8, 'datos.recursos', entidad), tareas: tomar(m.tareas, 8, 'datos.tareas', entidad),
        valores: recursos.map(r => tareas.map(t => numero(propio(m.valores, r.id + '|' + t.id)))) };
      revision = [m.recursos.map(r => [r.id, r.nombre]), m.tareas.map(t => [t.id, t.nombre]), m.recursos.map(r => m.tareas.map(t => propio(m.valores, r.id + '|' + t.id)))];
      const s = e.seleccion;
      if (s && s.tipo === 'nodo' && typeof s.id === 'string') {
        const n = lista(m.recursos).find(x => x.id === s.id) || lista(m.tareas).find(x => x.id === s.id);
        if (n) contexto.seleccion = { tipo: 'nodo', id: texto(n.id), nombre: texto(n.nombre), grupo: lista(m.recursos).includes(n) ? 'recurso' : 'tarea' };
      } else if (s && s.tipo === 'conexion' && typeof s.recursoId === 'string' && typeof s.tareaId === 'string') {
        const r = lista(m.recursos).find(x => x.id === s.recursoId), t = lista(m.tareas).find(x => x.id === s.tareaId);
        if (r && t) contexto.seleccion = { tipo: 'pareja', recurso: texto(r.nombre), tarea: texto(t.nombre), valor: numero(propio(m.valores, r.id + '|' + t.id)) };
      }
      const invalidas = typeof matrizAsig !== 'undefined' && Object.keys(matrizAsig.invalidas || {}).length > 0;
      contexto.resultadoVigente = !invalidas && typeof resultadoVigenteAsignacion === 'function' && !!resultadoVigenteAsignacion()
        && (typeof firmaModeloAsignacion !== 'function' || e.resultado.firma === firmaModeloAsignacion(m, e.objetivo));
      if (contexto.resultadoVigente) {
        const r = e.resultado.datos, p = lista(r.pasos)[indice(e.resultado.pasoActual)];
        contexto.paso = marcaPaso(p, e.resultado.pasoActual, lista(r.pasos).length);
        if (contexto.paso) {
          contexto.paso.matriz = matriz(p.matriz, 8, 'paso.matriz');
          if (typeof textoPasoAsignacion === 'function') contexto.paso.texto = texto(textoPasoAsignacion(p), 1200);
        }
        contexto.resultado = { objetivo: texto(r.objetivo), total: numero(r.total),
          asignaciones: tomar(r.asignaciones, 8, 'resultado.asignaciones', a => ({ fila: numero(a.fila), col: numero(a.col), valor: numero(a.valor) })),
          sinAsignarFilas: tomar(r.sinAsignarFilas, 8, 'resultado.sinAsignarFilas'), sinAsignarColumnas: tomar(r.sinAsignarColumnas, 8, 'resultado.sinAsignarColumnas') };
      } else if (e.resultado) contexto.error = 'Los datos cambiaron: el resultado anterior no está vigente. Recalcula.';
      if (invalidas) contexto.error = 'Hay casillas con texto no válido. Corrígelas antes de resolver.';
    } else if (modulo === 'northwest' && typeof estadoNorthwest !== 'undefined') {
      const e = estadoNorthwest, m = e.modelo;
      const origenes = lista(m.origenes).slice(0, 10), destinos = lista(m.destinos).slice(0, 10);
      contexto.vista = texto(e.vista);
      const escalaCostos = typeof ESCALA_COSTO_NORTHWEST !== 'undefined' ? ESCALA_COSTO_NORTHWEST : 100;
      contexto.datos = { escalaCostos,
        origenes: tomar(m.origenes, 10, 'datos.origenes', o => Object.assign(entidad(o), { oferta: numero(o.oferta) })),
        destinos: tomar(m.destinos, 10, 'datos.destinos', d => Object.assign(entidad(d), { demanda: numero(d.demanda) })),
        costos: origenes.map(o => destinos.map(d => numero(propio(m.costos, o.id + '|' + d.id)))) };
      revision = [m.origenes.map(o => [o.id, o.nombre, o.oferta]), m.destinos.map(d => [d.id, d.nombre, d.demanda]), m.origenes.map(o => m.destinos.map(d => propio(m.costos, o.id + '|' + d.id)))];
      const invalidas = typeof hayPendientesNorthwest === 'function' ? hayPendientesNorthwest() : typeof tablaNw !== 'undefined' && Object.keys(tablaNw.invalidas || {}).length > 0;
      const consultable = typeof resultadoConsultableNorthwest === 'function' && resultadoConsultableNorthwest();
      contexto.datos.pendientesDeCorregir = invalidas;
      contexto.datos.resultadoInvalidado = !!e.resultado && !consultable;
      if (invalidas && consultable) contexto.ultimoCalculoValido = { costoTotal: numero(e.resultado.datos.costoTotal), escalaCostos, consultable: true };
      revision.push(invalidas ? Object.entries(e.invalidas || (typeof tablaNw !== 'undefined' ? tablaNw.invalidas : {})) : []);
      contexto.resultadoVigente = consultable && !invalidas;
      if (contexto.resultadoVigente) {
        const r = e.resultado.datos, b = e.resultado.balance, p = lista(r.pasos)[indice(e.resultado.pasoActual)];
        contexto.paso = marcaPaso(p, e.resultado.pasoActual, lista(r.pasos).length);
        if (contexto.paso) Object.assign(contexto.paso, { fila: numero(p.fila), col: numero(p.col), operacion: texto(p.operacion, 160), cantidad: numero(p.cantidad),
          ofertaAntes: numero(p.ofertaAntes), demandaAntes: numero(p.demandaAntes), costoUnitario: numero(p.costoUnitario), movimiento: texto(p.movimiento) || null, basicaCero: !!p.basicaCero,
          restanteOferta: tomar(p.restanteOferta, 11, 'paso.restanteOferta'), restanteDemanda: tomar(p.restanteDemanda, 11, 'paso.restanteDemanda'),
          asignaciones: matriz(p.asignaciones, 11, 'paso.asignaciones') });
        contexto.resultado = { escalaCostos, costoTotal: numero(r.costoTotal), asignaciones: matriz(r.asignaciones, 11, 'resultado.asignaciones'), degenerado: !!r.degenerado,
          ficticio: b && b.ficticio ? { tipo: texto(b.ficticio.tipo), cantidad: numero(b.ficticio.cantidad), indice: numero(b.ficticio.indice) } : null };
      } else contexto.error = explicarEstadoResultadoNorthwest();
    } else if (modulo === 'ordenamiento' && typeof estadoOrdenamiento !== 'undefined') {
      const e = estadoOrdenamiento;
      contexto.vista = e.preparando ? 'preparando' : 'procedimiento';
      contexto.datos = { algoritmo: texto(e.algoritmo), cantidad: lista(e.valores).length, valores: tomar(e.valores, 40, 'datos.valores'), preparando: !!e.preparando };
      const entrada = document.getElementById('entradaValores');
      // Comparar la entrada escrita no prepara ni ejecuta el algoritmo.
      const escrita = entrada && typeof entrada.value === 'string' ? entrada.value.trim() : null;
      const valoresEscritos = escrita === null ? null : escrita.split(/[\s,;]+/).filter(Boolean).map(v => /^-?\d+$/.test(v) ? Number(v) : null);
      const pendiente = valoresEscritos !== null && JSON.stringify(valoresEscritos) !== JSON.stringify(e.valores);
      const original = e.registro && lista(e.registro.pinos).map(p => p.valor);
      const coincideRegistro = !original || original.length === 0 || JSON.stringify(original) === JSON.stringify(e.valores);
      revision = [e.valores, escrita];
      if (pendiente) contexto.datos.entradaPendiente = texto(escrita, 1200);
      contexto.resultadoVigente = !e.preparando && !pendiente && coincideRegistro && !!e.registro && lista(e.registro.eventos).length > 0;
      if (contexto.resultadoVigente && typeof obtenerPasoOrdenamiento === 'function') {
        // Reconstruye solo el paso seleccionado a partir de su checkpoint existente.
        const p = obtenerPasoOrdenamiento(e.registro, indice(e.pasoActual));
        contexto.paso = marcaPaso(p, e.pasoActual, e.registro.eventos.length - 1, 0);
        if (contexto.paso) Object.assign(contexto.paso, { arreglo: tomar(p.arreglo, 40, 'paso.arreglo', v => v ? numero(v.valor) : null),
          comparaciones: numero(p.comparaciones), intercambios: numero(p.intercambios),
          comparando: tomar(p.comparando, 40, 'paso.comparando'), moviendo: tomar(p.moviendo, 40, 'paso.moviendo') });
        if (contexto.paso) {
          const relevantes = Array.from(new Set([...lista(p.comparando), ...lista(p.moviendo)]))
            .filter(i => Number.isInteger(i) && i >= 0 && i < lista(p.arreglo).length);
          contexto.paso.valoresRelevantes = tomar(relevantes, 40, 'paso.valoresRelevantes', i => ({ indice: i, valor: numero(p.arreglo[i] && p.arreglo[i].valor) }));
          // El pino seleccionado en el dibujo, ubicado en el arreglo del paso actual.
          const idPino = typeof pinoSeleccionado === 'string' ? pinoSeleccionado : null;
          const posicion = idPino ? lista(p.arreglo).findIndex(v => v && v.id === idPino) : -1;
          if (posicion >= 0) contexto.seleccion = { tipo: 'pino', id: texto(idPino), indice: posicion, valor: numero(p.arreglo[posicion].valor) };
        }
        const final = e.registro.eventos[e.registro.eventos.length - 1];
        contexto.resultado = { estado: 'Procedimiento preparado', totalEventos: e.registro.eventos.length, comparaciones: numero(final.comparaciones), intercambios: numero(final.intercambios),
          arregloFinal: p && p.tipo === 'fin' ? tomar(p.arreglo, 40, 'resultado.arregloFinal', v => numero(v.valor)) : null,
          nota: 'La instantánea enviada corresponde al paso seleccionado. La velocidad de animación no mide el tiempo de cálculo.' };
      }
      contexto.error = errorVisible(['errorEntrada']) || (pendiente ? 'La entrada escrita cambió. Pulsa «Usar valores» para preparar su procedimiento.' : null);
    } else if (modulo === 'arboles' && typeof estadoArboles !== 'undefined') {
      const e = estadoArboles;
      contexto.vista = texto(e.modo);
      let cantidad = 0;
      const vistos = new Set();
      const nodo = n => {
        if (!n) return null;
        if (cantidad >= 31 || vistos.has(n)) { omitir('datos.raiz: se limitó la estructura a 31 nodos, sin repetir referencias.'); return null; }
        cantidad++; vistos.add(n);
        return { valor: numero(n.valor), izquierdo: nodo(n.izquierdo), derecho: nodo(n.derecho) };
      };
      contexto.datos = { modo: texto(e.modo), secuencia: tomar(e.secuencia, 31, 'datos.secuencia'), raiz: nodo(e.raiz), recorrido: texto(e.recorridoSeleccionado), seleccion: numero(e.seleccion) };
      if (typeof e.seleccion === 'number' && Number.isFinite(e.seleccion)) contexto.seleccion = { tipo: 'valor', valor: e.seleccion };
      const historial = lista(e.historialRecorrido), eventos = historial.slice(0, 62), actual = Math.min(indice(e.pasoRecorrido), eventos.length);
      if (historial.length > 62) omitir('paso.recorrido: muestra limitada a 62 eventos.');
      contexto.paso = marcaPaso(actual ? eventos[actual - 1] : null, actual, eventos.length, 0);
      if (contexto.paso) contexto.paso.valor = numero(eventos[actual - 1].valor);
      contexto.resultadoVigente = eventos.length > 0;
      contexto.resultado = contexto.resultadoVigente ? { recorrido: texto(e.recorridoSeleccionado),
        salidaParcial: tomar(eventos.slice(0, actual).filter(ev => ev.tipo === 'emitir'), 31, 'resultado.salidaParcial', ev => numero(ev.valor)), completo: actual === eventos.length } : null;
      contexto.error = errorVisible(['errorInsercion', 'errorReconstruccion', 'errorAleatorio']);
    } else if (modulo === 'difusa') {
      const e = typeof DifusaEstado !== 'undefined' ? DifusaEstado.estado : null;
      const m = e && e.modelo;
      contexto.vista = texto(e && e.vista) || 'inicio';
      if (m) {
        const resumenVariable = v => ({ id: texto(v.id), nombre: texto(v.nombre, 40), unidad: texto(v.unidad, 40),
          minimo: numero(v.min), maximo: numero(v.max), conjuntos: tomar(v.conjuntos, 5, 'datos.conjuntos', c => ({
            id: texto(c.id), nombre: texto(c.nombre, 40), tipo: texto(c.tipo), parametros: tomar(c.parametros, 4, 'datos.parametros') })) });
        const entradas = lista(m.entradas).slice(0, 3);
        const resumenRegla = regla => ({ id: texto(regla.id), conector: texto(regla.conector), peso: numero(regla.peso),
          habilitada: regla.activa !== false, consecuente: texto(regla.consecuente) || null,
          antecedentes: entradas.map(v => ({ variableId: texto(v.id), conjuntoId: texto(propio(regla.antecedentes, v.id)) || null })) });
        contexto.datos = { modelo: { id: texto(m.id), nombre: texto(m.nombre, 40), entradas: entradas.map(resumenVariable),
          salida: m.salida ? resumenVariable(m.salida) : null, cantidadReglas: lista(m.reglas).length,
          reglasHabilitadas: lista(m.reglas).filter(regla => regla.activa !== false && regla.peso > 0).length,
          reglas: tomar(m.reglas, 8, 'datos.modelo.reglas', resumenRegla) },
        valores: entradas.map(v => ({ id: texto(v.id), nombre: texto(v.nombre, 40), valor: numero(propio(e.valores, v.id)), unidad: texto(v.unidad, 40) })),
        pendiente: !!e.pendiente, resultadoInvalidado: !!e.pendiente };
        // Huella de configuración/valores; nunca de muestras, tramos o recortes.
        revision = [m, e.valores];
        contexto.resultadoVigente = !!e.resultado && !e.pendiente && entradas.every(v =>
          propio(e.resultado.entradas, v.id) === propio(e.valores, v.id));
        if (contexto.resultadoVigente && typeof DifusaModelo !== 'undefined' && typeof DifusaModelo.firmaMatematica === 'function' && e.resultado.firmaModelo) {
          contexto.resultadoVigente = e.resultado.firmaModelo === DifusaModelo.firmaMatematica(m);
        }
        const r = contexto.resultadoVigente ? e.resultado : null;
        if (r) {
          const centroide = r.centroide || {};
          contexto.resultado = { estado: texto(centroide.estado), valor: numero(centroide.valor),
            diagnostico: texto(centroide.mensaje, 500), metodo: texto(centroide.metodo, 80), tramos: lista(r.tramos).length,
            numerador: numero(centroide.numerador), denominador: numero(centroide.denominador),
            puntos: lista(r.puntos).length, minimo: numero(m.salida.min), maximo: numero(m.salida.max),
            etiquetas: tomar(r.etiquetas, 5, 'resultado.etiquetas', id => {
              const conjunto = lista(m.salida.conjuntos).find(c => c.id === id);
              return conjunto ? texto(conjunto.nombre, 40) : texto(id, 40);
            }), reglasActivas: lista(r.reglas).filter(regla => regla.activacion > 0).length };
          const s = e.seleccion || {};
          const seleccionada = lista(r.reglas).find(regla => regla.id === s.reglaId);
          const configurada = lista(m.reglas).find(regla => regla.id === s.reglaId);
          const punto = Number.isInteger(s.puntoIndice) && s.puntoIndice >= 0 && s.puntoIndice < lista(r.puntos).length ? s.puntoIndice : null;
          if (seleccionada) {
            contexto.seleccion = { tipo: 'regla-difusa', id: texto(seleccionada.id),
              conector: texto(seleccionada.conector), peso: numero(seleccionada.peso),
              habilitada: seleccionada.habilitada !== false, activacionAntecedente: numero(seleccionada.activacionAntecedente),
              activacion: numero(seleccionada.activacion),
              antecedentes: entradas.map(v => {
                const conjuntoId = configurada && propio(configurada.antecedentes, v.id);
                const conjunto = lista(v.conjuntos).find(c => c.id === conjuntoId);
                return { variable: texto(v.nombre, 40), conjunto: conjunto ? texto(conjunto.nombre, 40) : 'No importa',
                  grado: conjuntoId ? numero(propio(propio(r.pertenencias, v.id), conjuntoId)) : null };
              }), consecuente: texto((lista(m.salida.conjuntos).find(c => c.id === seleccionada.consecuente) || {}).nombre, 40) };
          }
          if (punto !== null) {
            const detallePunto = { indice: punto, y: numero(r.puntos[punto]), agregada: numero(propio(r.agregada, punto)),
              recorte: seleccionada ? numero(propio(seleccionada.recortada, punto)) : null };
            if (contexto.seleccion) contexto.seleccion.punto = detallePunto;
            else contexto.seleccion = { tipo: 'punto-difuso', punto: detallePunto };
          }
          const pasoIndice = Number.isInteger(e.pasoActual) ? e.pasoActual : Number.isInteger(e.paso) ? e.paso :
            seleccionada ? 2 : punto !== null ? 4 : 5;
          contexto.paso = marcaPaso(lista(r.pasos)[pasoIndice], pasoIndice, lista(r.pasos).length);
          if (contexto.paso) {
            // Las descripciones del registro son breves; nunca copiar sus arrays.
            contexto.paso.texto = texto(lista(r.pasos)[pasoIndice].descripcion || contexto.paso.texto, 1200);
          }
        } else if (e.pendiente || e.resultado) contexto.error = 'Los datos matemáticos cambiaron: pulsa Evaluar para obtener un resultado vigente.';
        contexto.error = errorVisible(['difusaError', 'errorDifusa', 'errorFamiliaridad', 'errorDificultad']) || contexto.error;
        if (typeof e.error === 'string' && e.error) contexto.error = texto(e.error, 1200);
        const errores = tomar(e.errores, 5, 'datos.errores', error => texto(typeof error === 'string' ? error : error && error.mensaje, 240)).filter(Boolean);
        if (errores.length) { contexto.datos.errores = errores; contexto.error = errores[0]; }
      } else contexto.datos = { modelo: null, valores: [] };
    } else {
      contexto.datos = { catalogo: Object.keys(NOMBRES).filter(n => n !== 'inicio').map(n => NOMBRES[n]) };
    }

    // Solo el último aviso de validación visible, sin copiar el contenedor ni HTML.
    if (modulo !== 'inicio' && !contexto.error) {
      const pila = document.getElementById('toastStack');
      const aviso = pila && pila.lastElementChild;
      if (aviso && aviso.classList && aviso.classList.contains('toast--error') && !aviso.classList.contains('is-hiding')) contexto.error = texto(aviso.textContent, 1200) || null;
    }

    // Cota final incluso con etiquetas largas y resultados muy densos. Se acortan
    // solo las copias del contexto y cada recorte queda señalado al receptor.
    if (omitidos.length) contexto.omitidos = omitidos;
    for (let intento = 0; JSON.stringify(contexto).length > 10000 && intento < 32; intento++) {
      let mayor = null;
      const recorrer = (objeto, ruta) => {
        if (!objeto || typeof objeto !== 'object') return;
        if (Array.isArray(objeto) && objeto !== omitidos && objeto.length > 1) {
          const peso = JSON.stringify(objeto).length;
          if (!mayor || peso > mayor.peso) mayor = { lista: objeto, ruta, peso };
        }
        Object.keys(objeto).forEach(clave => recorrer(objeto[clave], ruta + '.' + clave));
      };
      recorrer(contexto, 'contexto');
      if (!mayor) break;
      mayor.lista.splice(Math.ceil(mayor.lista.length / 2));
      omitir(mayor.ruta + ': muestra reducida para limitar el contexto.');
      contexto.omitidos = omitidos;
    }
    if (modulo !== 'asignacion') contexto.estadoAyuda = estadoContexto({ modulo, contexto });
    const referencia = NOMBRES[modulo] + ' · ' + contexto.vista + (contexto.paso ? ' · paso ' + contexto.paso.numero : '');
    return { modulo, contexto, referencia, firma: JSON.stringify(contexto) + '|' + huella(revision) };
  }

  const SIN_EXPLICACION = 'No tengo una explicación local para esa pregunta. Puedo ayudarte con las reglas, los pasos y el uso de este módulo.';
  const ALIAS = {
    inicio: ['inicio', 'ciudad', 'catalogo'], johnson: ['johnson'], dijkstra: ['dijkstra'], kruskal: ['kruskal'],
    asignacion: ['asignacion', 'hungaro', 'hungara'], northwest: ['northwest', 'esquina noroeste', 'noroeste', 'transporte'],
    ordenamiento: ['ordenamiento', 'selection', 'insertion', 'bubble', 'shell', 'merge'],
    arboles: ['arboles', 'arbol binario', 'arboles binarios', 'bst'],
    difusa: ['logica difusa', 'difusa', 'mamdani']
  };
  const INTENCIONES = {
    empezar: /^(?:como (?:empiezo|empezar|comienzo|comenzar|inicio|iniciar)(?: ejercicio)?|como (?:uso|usar|funciona)|que es|para que sirve|que hace|por donde empiezo|primeros pasos|ayuda|hola|buenas)$/,
    datos: /^(?:como (?:ingreso|ingresar|introduzco|introducir|edito|editar|cambio|cambiar|agrego|agregar|creo|crear|anado|insertar|inserto|cargo|cargar)(?: datos| valores| nodos| vertices| puntos| conexiones| pesos| costos| recursos| tareas| arbol| grafo| lista| matriz| recorridos)|ingresar datos|editar datos)$/,
    reglas: /^(?:(?:que|cuales) (?:son )?(?:reglas|limites|validaciones|restricciones)|(?:que|cuantos) (?:datos|valores|nodos|vertices|puntos|recursos|tareas) (?:admite|acepta|permite|puedo ingresar)|limites(?: datos)?|como (?:valido|validar) datos)$/,
    herramientas: /^(?:como (?:uso|usar|funcionan) (?:herramientas|controles|zoom|seleccionar|conectar)|(?:para que sirve|que hace) (?:herramienta )?(?:seleccionar|conectar|zoom|reiniciar)|herramientas|como (?:muevo|mover|elimino|eliminar|borro|borrar|selecciono|seleccionar|conecto|conectar)(?: nodo| nodos| vertice| vertices| conexion| conexiones| punto| puntos| arbol)?)$/,
    pasos: /^(?:como (?:resuelvo|resolver|calculo|calcular|avanzo|avanzar|retrocedo|retroceder|reinicio|reiniciar|reproduzco|reproducir|pauso|pausar)(?: ejercicio| pasos| procedimiento| recorrido)?|como (?:veo|ver|navego|navegar|recorro|recorrer|sigo|seguir) (?:pasos|procedimiento|recorrido)|como (?:uso|usar) (?:siguiente|anterior|reproducir|pausar)|como cambio (?:paso|velocidad))$/,
    paso: /^(?:(?:explica|explicame|describe|describeme|resume) (?:paso|operacion)|que paso estoy|que hice paso|(?:que (?:ocurre|pasa|hace)|cual es operacion)(?: paso)?|que significa (?:paso|operacion))$/,
    resultado: /^(?:(?:explica|explicame|describe|describeme|resume) (?:resultado|solucion)|que (?:significa|dice|muestra) (?:resultado|solucion|costo total|peso total)|cual es (?:resultado|solucion|costo total|peso total)|como (?:interpreto|interpretar|entiendo|entender|leo|leer) (?:resultado|resultados|solucion))$/,
    vista: /^(?:donde estoy|(?:que|cual es) vista(?: actual)?|que estoy viendo|explica vista)$/,
    ejercicio: /^(?:explica|explicame|describe|describeme|resume) ejercicio$/,
    pendientes: /^(?:que (?:falta|datos faltan|datos estan pendientes|datos son invalidos|tengo pendiente)|(?:hay )?datos pendientes|como (?:corrijo|corregir) datos|(?:revisa|revisar) (?:datos|ejercicio))$/,
    errores: /^(?:(?:que|cual) error (?:muestra aplicacion|hay|tengo|es)|(?:por que )?no (?:puedo resolver|puedo calcular|funciona|resuelve|calcula)|como (?:corrijo|corregir|soluciono|solucionar) (?:error|errores)|errores frecuentes)$/,
    resaltado: /^(?:que (?:significa|indica|representa) (?:resaltado|resaltados|colores|color|seleccion|elemento resaltado|elementos resaltados)|que resaltado|(?:explica|explicame) (?:resaltado|colores|seleccion))$/,
    guardar: /^(?:como (?:guardo|guardar|salvo|salvar|recupero|recuperar|cargo|cargar)(?: (?:trabajo|trabajos|ejercicio|ejercicios|grafo|arbol))?|donde (?:se )?guardan (?:trabajos|datos)|guardar|trabajos)$/,
    traslado: /^(?:como (?:exporto|exportar|importo|importar|traslado|trasladar|llevo|llevar)(?: (?:trabajo|trabajos|ejercicio|ejercicios|datos|json|grafo|arbol|lista|problema))?(?: otro navegador| otro equipo| otro sitio)?|como descargo json|(?:exportar|importar) json)$/,
    imprimir: /^(?:como (?:imprimo|imprimir)(?: (?:ejercicio|pasos|procedimiento|resultado))?|como (?:guardo|guardar|exporto|exportar|descargo|descargar)(?: como)? pdf|imprimir)$/,
    imagen: /^(?:como (?:exporto|exportar|descargo|descargar|guardo|guardar)(?: como| en)? (?:png|imagen)|exportar png)$/,
    diferencias: /^(?:(?:que|cual|cuales) (?:es |son |hay )?(?:diferencia|diferencias)(?: entre)?(?: y| con| vs| versus)*|(?:compara|comparar)(?: y| con| vs| versus)*|(?:cual|que) (?:algoritmo )?(?:elijo|elegir|uso|usar)|diferencias(?: entre)?(?: y| con| vs| versus)*)$/
  };
  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function interpretar(pregunta, activo) {
    let consulta = normalizar(pregunta);
    const modulos = [];
    Object.entries(ALIAS).forEach(([modulo, nombres]) => {
      nombres.slice().sort((a, b) => b.length - a.length).forEach(nombre => {
        const patron = new RegExp('\\b' + nombre + '\\b', 'g');
        if (patron.test(consulta)) {
          if (!modulos.includes(modulo)) modulos.push(modulo);
          consulta = consulta.replace(patron, ' ');
        }
      });
    });
    const compacta = consulta.replace(/\bcomo puedo\b/g, 'como').replace(/\b(?:por favor|me puedes|puedes|podrias|quiero saber|necesito saber)\b/g, ' ')
      .replace(/\b(?:el|la|los|las|un|una|unos|unas|de|del|al|a|en|sobre|para|mi|mis|este|esta|estos|estas|su|sus|modulo|metodo|algoritmo|actual|seleccionado)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
    const comparacion = /^(?:(?:que|cual|cuales) (?:es |son )?diferencias?(?: hay)?(?: entre)?|(?:compara|comparar)|diferencias?(?: entre)?)(?: (?:y|con|vs|versus))*$/.test(compacta);
    const intencion = comparacion ? 'diferencias' : Object.keys(INTENCIONES).find(clave => INTENCIONES[clave].test(compacta)) || null;
    return { modulo: modulos.length === 1 ? modulos[0] : activo, modulos, intencion,
      consulta: compacta, contextual: /\b(?:mi|mis|este|esta|actual|seleccionado)\b/.test(normalizar(pregunta)) };
  }
  function sugeridas(foto, pregunta) {
    const f = foto || obtener(), c = f.contexto;
    const lectura = interpretar(pregunta, f.modulo);
    const nombre = NOMBRES[lectura.modulo] || NOMBRES.inicio;
    // El módulo excluido conserva sus sugerencias anteriores, sin clasificar su estado.
    if (f.modulo !== 'asignacion' && !lectura.modulos.includes('asignacion')) {
      if (lectura.modulos.length === 1 && lectura.modulo !== f.modulo) return ['¿Qué es ' + nombre + '?', '¿Cuáles son las reglas de ' + nombre + '?', '¿Cómo empiezo en ' + nombre + '?'];
      const situacion = estadoContexto(f);
      if (situacion === 'inicio') return ['¿Qué es un algoritmo?', '¿Qué algoritmo elijo?', '¿Cómo guardo mi trabajo?'];
      if (situacion === 'historico-consultable') return ['¿Qué dato me falta?', '¿Qué significa este resultado?', '¿Por qué no me deja continuar?'];
      if (situacion === 'invalidado' || situacion === 'entrada-invalida') return ['¿Por qué no me deja continuar?', '¿Qué dato me falta?', '¿Cuáles son las reglas?'];
      if (situacion === 'sin-datos') return ['¿Cómo empiezo?', '¿Qué datos necesito?', '¿Cuáles son las reglas?'];
      if (situacion === 'sin-resolver' || situacion === 'preparando') return ['¿Qué me falta?', '¿Qué restricciones hay?', '¿Cómo calculo?'];
      if (situacion === 'sin-solucion') return f.modulo === 'johnson' ? ['¿Qué es un ciclo negativo?', 'Explícame el resultado', '¿Qué hago ahora?'] : ['Explícame el resultado', '¿Qué dato me falta?', '¿Cómo funcionan las reglas difusas?'];
      if (situacion === 'vigente') return ['Explícame el resultado', c.paso ? 'Explicar este paso' : '¿Qué hago ahora?', '¿Qué significan estos valores?'];
    }
    if (f.modulo === 'difusa' && !c.resultadoVigente && !c.error && (!lectura.modulos.length || lectura.modulo === 'difusa')) return ['¿Qué es lógica difusa?', '¿Cómo configuro las variables?', '¿Cómo funcionan AND y OR?'];
    if (pregunta && (!lectura.intencion || lectura.modulos.length > 1)) {
      return ['¿Cómo empiezo en ' + nombre + '?', '¿Cuáles son las reglas de ' + nombre + '?', '¿Cómo veo los pasos de ' + nombre + '?'];
    }
    if (lectura.modulo !== f.modulo) return ['¿Cómo ingreso datos en ' + nombre + '?', '¿Cuáles son las reglas de ' + nombre + '?', '¿Cómo interpreto resultados de ' + nombre + '?'];
    if (f.modulo === 'inicio') return ['¿Cómo empiezo?', '¿Qué diferencias hay entre Johnson y Dijkstra?', '¿Cómo guardo mi trabajo?'];
    if (c.error) return ['¿Qué error muestra la aplicación?', '¿Qué datos faltan?', '¿Cuáles son las reglas?'];
    const preguntas = ['¿Cómo empiezo?'];
    if (c.paso) preguntas.push('Explícame este paso');
    if (c.resultadoVigente && c.resultado) preguntas.push('¿Qué significa este resultado?');
    if (preguntas.length < 3) preguntas.push('¿Cuáles son las reglas?');
    if (preguntas.length < 3) preguntas.push('¿Cómo ingreso datos?');
    return preguntas.slice(0, 3);
  }
  function estadoContexto(foto) {
    const f = foto || obtener(), c = f.contexto || {}, d = c.datos || {};
    if (f.modulo === 'asignacion') return 'legado';
    if (f.modulo === 'inicio') return 'inicio';
    if (d.preparando) return 'preparando';
    if (c.ultimoCalculoValido && c.ultimoCalculoValido.consultable) return 'historico-consultable';
    if (d.resultadoInvalidado || d.pendiente && !c.resultadoVigente) return 'invalidado';
    const informativoNorthwest = f.modulo === 'northwest' && !d.pendientesDeCorregir && !d.resultadoInvalidado &&
      /^el resultado y (?:el )?procedimiento aparecen despues de confirmar (?:el )?balanceo y resolver$/.test(normalizar(c.error));
    if (c.error && !informativoNorthwest || d.pendientesDeCorregir || lista(d.errores).length) return 'entrada-invalida';
    if (c.resultadoVigente && c.resultado) return c.resultado.tieneCicloNegativo || f.modulo === 'difusa' && c.resultado.valor === null ? 'sin-solucion' : 'vigente';
    const vacio = ['johnson', 'dijkstra', 'kruskal'].includes(f.modulo) ? !(d.cantidadVertices >= (f.modulo === 'johnson' ? 2 : 1)) :
      f.modulo === 'ordenamiento' ? !d.cantidad : f.modulo === 'arboles' ? !d.raiz :
        f.modulo === 'difusa' ? !d.modelo : f.modulo === 'northwest' ? !lista(d.origenes).length || !lista(d.destinos).length : true;
    return vacio ? 'sin-datos' : 'sin-resolver';
  }
  function explicarCasillasJohnson(c) {
    const casillas = c.casillasJohnson;
    if (!c.resultadoVigente) return faltaResultado(c) + ' Las dos casillas dependen de la vista y la etapa; no uses números de un cálculo anterior.';
    if (!casillas || lista(casillas.rotulos).length !== 2) return 'Las dos casillas cambian con la vista: una ruta activa usa Acum. y Total; la comparación usa mínimo y máximo; la vista temporal usa temprano y tardío. En el procedimiento representan los datos de su etapa. Selecciona un nodo del grafo principal o identifica el paso para precisar sus valores.';
    const etiquetas = casillas.etiquetas || casillas.rotulos;
    let respuesta = (casillas.etapa ? 'Vista actual · ' + casillas.etapa + '. ' : '') + 'Izquierda: ' + etiquetas[0] + '; derecha: ' + etiquetas[1] + '.';
    if (casillas.nodo && lista(casillas.valores).length === 2) respuesta += ' Nodo seleccionado «' + (casillas.nodo.nombre || casillas.nodo.id) + '»: ' + casillas.rotulos.map((r, i) => r + ' ' + valor(casillas.valores[i])).join(' | ') + '.';
    else respuesta += ' No hay un nodo seleccionado inequívocamente; identifica el nodo para dar sus valores.';
    if (casillas.rotulos[0] === 'Acum.') respuesta += ' Acum. suma los pesos originales de la ruta hasta el destino y Total es el costo de esa ruta.';
    else if (casillas.temporal) respuesta += ' Son tiempos de la red; la holgura de una actividad usa tardío(destino) − temprano(origen) − duración.';
    return respuesta;
  }
  function explicarMatrizJohnson(c, tipo) {
    const adyacencia = tipo === 'adyacencia' || !tipo && c.vista === 'matriz';
    return adyacencia
      ? 'La matriz de adyacencia describe conexiones directas: fila = origen, columna = destino y cada valor es el peso original de esa conexión. No suma recorridos ni contiene los mínimos de Johnson. Cero puede ser un peso válido; la ausencia de conexión se distingue de ese cero.'
      : 'La matriz de distancias contiene mínimos calculados con los pesos originales: fila = origen y columna = destino. Cada celda puede resumir varias conexiones; ∞ significa que no hay camino y la diagonal es 0 cuando el cálculo global es válido. Los máximos sobre DAG y los tiempos temprano/tardío se consultan por separado.' + (!c.resultadoVigente ? ' Todavía no hay una matriz de distancias vigente para el ejercicio actual.' : '');
  }
  function explicarNumero(modulo, c) {
    const s = c.seleccion;
    if (!s) return 'No hay una selección que identifique un único número. Indica la celda, el nodo o el valor que quieres explicar.' + (modulo === 'johnson' ? '\n' + explicarCasillasJohnson(c) : '');
    if (s.tipo === 'conexion') return 'La conexión seleccionada ' + nombreNodo(c, s.desde) + (c.datos && c.datos.dirigido === false ? ' — ' : ' → ') + nombreNodo(c, s.hacia) + ' tiene peso original ' + valor(s.valor) + '. Ese peso corresponde a una conexión directa; el costo total de un recorrido o árbol es otra magnitud.';
    if (modulo === 'johnson' && s.tipo === 'nodo') return explicarCasillasJohnson(c);
    if (modulo === 'dijkstra' && s.tipo === 'nodo') {
      if (!c.resultadoVigente || !c.resultado) return faltaResultado(c);
      const origen = c.resultado.origen, distancias = c.vista === 'resolucion' && c.paso ? c.paso.distancias : c.resultado.distancias;
      const distancia = lista(distancias).find(x => x.nodo === s.id);
      return distancia ? 'La distancia registrada desde ' + nombreNodo(c, origen) + ' hasta el nodo seleccionado ' + nombreNodo(c, s.id) + ' es ' + valor(distancia.distancia) + '. ' + (distancia.distancia === '∞' ? 'No hay camino desde ese origen; no equivale a cero.' : 'Suma pesos del camino mínimo, no solo la última conexión.') : 'La muestra de contexto no incluye la distancia de ese nodo; consulta su fila en el módulo.';
    }
    if (s.tipo === 'pino') return 'En la posición ' + (s.indice + 1) + ' está el elemento seleccionado de valor ' + valor(s.valor) + '. La posición y el valor son datos distintos; otro elemento puede tener el mismo valor.';
    if (s.tipo === 'valor' && modulo === 'arboles') return 'El nodo seleccionado guarda el valor ' + valor(s.valor) + '. Ese valor identifica al nodo; el orden de emisión depende del recorrido elegido.';
    if (modulo === 'difusa') return 'Indica qué cifra quieres explicar: activación de la regla, recorte en el punto consultado o centroide. Una misma regla muestra varias magnitudes; no elegiré una por suposición.';
    return 'La selección contiene varias magnitudes. Indica el valor o la operación que quieres explicar.';
  }
  function sinCobertura(foto, pregunta) {
    return SIN_EXPLICACION + '\n\nPuedes preguntar:\n' + sugeridas(foto, pregunta).map(p => '• ' + p).join('\n');
  }
  const valor = n => n === null || n === undefined ? 'sin dato' : String(n);
  function nombreNodo(c, id) {
    const nodo = lista(c.datos && c.datos.nodos).find(n => n.id === id);
    return nodo ? nodo.nombre || nodo.id : valor(id);
  }
  function faltaResultado(c) {
    return 'Todavía no hay un resultado vigente. ' + (c.error || 'Completa los datos y calcula o recalcula en el módulo.');
  }
  function pendientes(modulo, c) {
    if (modulo === 'northwest' && c.datos && c.datos.pendientesDeCorregir) {
      const anterior = c.ultimoCalculoValido;
      return (c.error || 'Hay datos pendientes de corregir.') + (anterior && anterior.consultable ? '\nCosto del último cálculo válido: ' + valor(anterior.costoTotal / anterior.escalaCostos) + '. Es una solución inicial factible del modelo anterior, sin garantía de costo mínimo.' : '') + '\nCorrige las entradas marcadas en Datos antes de balancear o resolver.';
    }
    if (modulo === 'difusa') {
      const d = c.datos || {}, modelo = d.modelo;
      return [c.error ? 'Aviso actual: ' + c.error : '', !modelo ? 'Carga un ejemplo o crea tu sistema.' :
        'Modelo «' + modelo.nombre + '»: ' + lista(modelo.entradas).length + ' entradas, ' + modelo.cantidadReglas + ' reglas y ' + modelo.reglasHabilitadas + ' habilitadas con peso mayor que cero.',
      lista(d.valores).filter(v => v.valor === null).map(v => 'Falta un valor válido para ' + v.nombre + '.').join(' '),
      !c.resultadoVigente ? 'Revisa Variables, Reglas y los valores de Evaluar antes de calcular.' :
        c.resultado && c.resultado.valor === null ? c.resultado.diagnostico || 'No hay salida numérica; consulta el diagnóstico del resultado.' : 'Hay una evaluación vigente. Consulta su procedimiento.',
      modelo && lista(modelo.reglas).length < modelo.cantidadReglas ? 'La ayuda recibe una muestra de ' + lista(modelo.reglas).length + ' reglas de ' + modelo.cantidadReglas + '; no describe todas las decisiones del sistema.' : ''].filter(Boolean).join('\n');
    }
    const d = c.datos || {}, avisos = [];
    if (c.error) avisos.push('Aviso actual: ' + c.error);
    if (d.entradaPendiente !== undefined) avisos.push('La entrada escrita no corresponde al procedimiento: pulsa «Usar valores».');
    if (d.preparando) avisos.push('El módulo está preparando el procedimiento; consulta de nuevo al terminar.');
    if (['johnson', 'dijkstra', 'kruskal'].includes(modulo)) {
      if (!d.cantidadVertices) avisos.push('Todavía no hay vértices.');
      else if (modulo === 'johnson' && d.cantidadVertices < 2) avisos.push('Johnson requiere al menos dos nodos en este editor.');
      if (modulo === 'dijkstra' && !d.origen) avisos.push('Falta elegir un origen.');
    }
    if (modulo === 'asignacion') {
      if (!lista(d.recursos).length || !lista(d.tareas).length) avisos.push('Añade al menos un recurso y una tarea.');
      const vacias = lista(d.valores).flat().filter(v => v === null).length;
      if (vacias) avisos.push('Parejas pendientes en el contexto: ' + vacias + '. Complétalas en la matriz; cero es válido.');
    }
    if (modulo === 'northwest') {
      if (!lista(d.origenes).length || !lista(d.destinos).length) avisos.push('Añade al menos un origen y un destino.');
      const costos = lista(d.costos).flat().filter(v => v === null).length;
      const cantidades = lista(d.origenes).filter(o => o.oferta === null).length + lista(d.destinos).filter(o => o.demanda === null).length;
      if (costos || cantidades) avisos.push('Datos pendientes en el contexto: ' + costos + ' costos y ' + cantidades + ' cantidades. Complétalos en Datos.');
    }
    if (modulo === 'arboles' && !d.raiz) avisos.push('Todavía no hay un árbol: agrega valores o reconstruye con recorridos válidos.');
    if (!avisos.length) avisos.push('No hay un aviso de validación visible ni datos pendientes identificados en este contexto. Los controles del módulo realizan la validación completa al calcular.');
    if (modulo !== 'inicio' && !c.resultadoVigente) avisos.push('Aún debes calcular o recalcular para consultar un resultado vigente.');
    return avisos.join('\n');
  }
  function explicarPaso(modulo, c) {
    if (modulo === 'northwest' && c.datos && c.datos.pendientesDeCorregir) return pendientes(modulo, c);
    if (!c.resultadoVigente) return faltaResultado(c);
    if (modulo === 'johnson' && c.resultado && c.resultado.temporal && c.vista === 'resultado') return explicarResultado(modulo, c) + '\nTempranos: máximos de temprano(u) + duración en orden topológico. Tardíos: mínimos de tardío(v) − duración en orden inverso, comenzando con tardío(destino)=T. Consulta el procedimiento temporal desplegable para sus valores.';
    if (modulo === 'difusa') {
      const s = c.seleccion, lineas = [];
      if (c.paso) lineas.push('Registro · ' + (c.paso.titulo || c.paso.tipo) + '. ' + c.paso.texto);
      if (s && s.tipo === 'regla-difusa') {
        const grados = lista(s.antecedentes).filter(a => a.grado !== null).map(a => a.grado);
        lineas.push('Regla ' + s.id + ': ' + lista(s.antecedentes).map(a => a.variable + ' es ' + a.conjunto + (a.grado === null ? '' : ' (grado ' + valor(a.grado) + ')')).join(s.conector === 'OR' ? ' O ' : ' Y ') + '.');
        lineas.push((s.conector === 'OR' ? 'máximo' : 'mínimo') + '(' + grados.map(valor).join(', ') + ') = ' + valor(s.activacionAntecedente) + '; peso ' + valor(s.peso) + '; activación final registrada = ' + valor(s.activacion) + (s.habilitada ? '.' : ' (regla desactivada).'));
        lineas.push('El consecuente ' + s.consecuente + ' se recorta con mínimo(activación final, pertenencia de salida).');
      }
      if (s && s.punto) lineas.push('Punto consultado y = ' + valor(s.punto.y) + ': ' +
        (s.tipo === 'regla-difusa' ? 'recorte de la regla seleccionada = ' + valor(s.punto.recorte) + '; ' : '') +
        'agregación por máximo = ' + valor(s.punto.agregada) + '.');
      if (!lineas.length) lineas.push('Selecciona una regla o un punto de salida en Procedimiento y resultado para consultar los valores del registro.');
      return lineas.join('\n');
    }
    const p = c.paso;
    if (!p) return 'Aún no hay un paso calculado seleccionado. Avanza al procedimiento y selecciona el paso que quieres consultar.';
    if (modulo === 'johnson' && p.tipo === 'ruta') return 'Paso ' + p.numero + ' · ' + p.titulo + '. ' + p.texto + '\n' + explicarResultado(modulo, c);
    const lineas = ['Paso ' + p.numero + ' · ' + (p.titulo || p.tipo || 'Procedimiento') + '.', p.texto];
    if (modulo === 'johnson' && p.pasada) lineas.push('Pasada ' + p.pasada.numero + ': antes [' + p.pasada.antes.map(valor).join(', ') + ']; después [' + p.pasada.despues.map(valor).join(', ') + ']. Mejoras registradas: ' + p.pasada.mejoras + '.');
    if (modulo === 'dijkstra' && p.desde && p.hacia && p.candidata !== null) {
      lineas.push('Conexión revisada: ' + nombreNodo(c, p.desde) + ' → ' + nombreNodo(c, p.hacia) + '. Distancia anterior: ' + valor(p.anterior) + '; candidata registrada: ' + valor(p.candidata) + '. ' + (p.mejora ? 'La aplicación registra una mejora.' : 'La aplicación no registra mejora.'));
    }
    if (modulo === 'kruskal' && p.arista) lineas.push('Conexión ' + p.arista + ': ' + (p.aceptada ? 'aceptada' : 'descartada') + '. Peso acumulado registrado: ' + valor(p.pesoAcumulado) + '.');
    if (modulo === 'northwest' && typeof p.cantidad === 'number') lineas.push('Cantidad registrada: ' + valor(p.cantidad) + '; oferta previa: ' + valor(p.ofertaAntes) + '; demanda previa: ' + valor(p.demandaAntes) + '.' + (p.operacion ? ' Operación: ' + p.operacion + '.' : '') + (p.basicaCero ? ' Es un 0 básico; no representa un envío.' : ''));
    if (modulo === 'ordenamiento') {
      if (lista(p.valoresRelevantes).length) lineas.push('Elementos de este evento: ' + p.valoresRelevantes.map(v => 'posición ' + (v.indice + 1) + ' = ' + valor(v.valor)).join('; ') + '.');
      lineas.push('Contadores en este paso: ' + valor(p.comparaciones) + ' comparaciones; ' + valor(p.intercambios) + ' movimientos.');
    }
    if (modulo === 'arboles') {
      lineas.push('Evento ' + p.tipo + ' en el valor ' + valor(p.valor) + '. ' + (p.tipo === 'emitir' ? 'Se agrega a la salida.' : p.tipo === 'visitar' ? 'Visitar no implica agregar todavía a la salida.' : 'La descripción corresponde al evento guardado.'));
      lineas.push('Salida parcial registrada: [' + lista(c.resultado && c.resultado.salidaParcial).join(', ') + '].');
    }
    if (!p.texto && lineas.length === 2) lineas.push('Este paso no incluye una descripción adicional guardada. Consulta la tabla del procedimiento.');
    return lineas.filter(Boolean).join('\n');
  }
  function explicarResultado(modulo, c) {
    if (modulo === 'northwest' && c.datos && c.datos.pendientesDeCorregir) return pendientes(modulo, c);
    if (!c.resultadoVigente || !c.resultado) return faltaResultado(c);
    const r = c.resultado, d = c.datos || {};
    if (modulo === 'difusa') return r.valor === null ? r.diagnostico || 'No hay salida numérica; consulta el diagnóstico del resultado, las activaciones y los consecuentes.' :
      'Resultado vigente de «' + (d.modelo && d.modelo.nombre || 'Sistema difuso') + '»: ' + valor(r.valor) + '. Centroide continuo = primer momento ' + valor(r.numerador) + ' / área ' + valor(r.denominador) + ', integrado sobre ' + r.tramos + ' tramos con nudos, recortes e intersecciones. Los ' + r.puntos + ' puntos de consulta no determinan la integral. ' +
      (lista(r.etiquetas).length ? 'Mayor pertenencia de salida: ' + r.etiquetas.join(' / ') + '.' : 'Ninguna categoría de salida contiene el centroide; se mantiene el número sin etiqueta.') + ' El número es el resultado principal; los grados de pertenencia no son probabilidades.';
    if (modulo === 'johnson') {
      const consulta = r.consulta, destino = consulta && consulta.destino;
      const casillas = destino && lista(destino.rotulos).length === 2 && lista(destino.valores).length === 2
        ? 'El destino muestra ' + destino.rotulos.map((rotulo, i) => rotulo + ' ' + valor(destino.valores[i])).join(' | ') + '.'
        : 'No se copiaron las casillas del destino en este contexto.';
      if (consulta && consulta.error) return 'Error de correspondencia de la ruta: ' + consulta.error + '\nLa ruta no puede presentarse como válida. Revisa sus tramos y vuelve a seleccionarla.';
      if (r.temporal) return r.temporal.valido
        ? 'Tiempos y holguras · análisis temporal complementario, distinto del costo del camino mínimo de Johnson. Duración T = ' + valor(r.temporal.duracion) + '. ' + casillas + ' Izquierda: tiempo temprano; derecha: tiempo tardío. Holgura de actividad = tardío(destino de la actividad) − temprano(origen de la actividad) − duración. Solo participa la subred entre los extremos elegidos; nodos excluidos: ' + valor(r.temporal.excluidos) + '. Actividades copiadas en este contexto: ' + lista(r.temporal.actividades).length + '. Consulta la tabla del módulo para la lista completa.'
        : 'Tiempos y holguras no disponible: ' + r.temporal.mensaje;
      if (r.tieneCicloNegativo) return 'Johnson global detenido por un ciclo negativo. Los pares que pueden atravesarlo no tienen mínimo finito; otros pares pueden conservar mínimos o no tener camino. Peso registrado del ciclo: ' + valor(r.cicloPeso) + '. Revisa las conexiones destacadas.';
      const s = r.seleccion;
      if (s) {
        let operacion = '';
        if (s.ruta) {
          const ids = lista(s.ruta.conexiones), conexiones = ids.map(id => lista(d.conexiones).find(a => a.id === id));
          const rutaParcial = lista(c.omitidos).some(aviso => /resultado\.seleccion\.ruta\.conexiones/.test(aviso));
          if (ids.length && !rutaParcial && conexiones.every(a => a && typeof a.valor === 'number' && Number.isFinite(a.valor))) {
            operacion = '\nPesos originales: ' + conexiones.map(a => a.valor < 0 ? '(' + valor(a.valor) + ')' : valor(a.valor)).join(' + ') + ' = ' + valor(s.ruta.distancia) + '.';
          } else if (ids.length || rutaParcial) operacion = '\nEl detalle de conexiones es parcial: no se muestran todos los pesos para desarrollar la suma; se conserva el costo registrado.';
        }
        return 'Consulta: ' + s.origenNombre + ' → ' + s.destinoNombre + '. Mínimo Johnson: ' + valor(s.distancia) + '.' + (consulta ? ' Máximo DAG: ' + (consulta.maximo === null ? 'no disponible por ciclos; no implica infinito' : valor(consulta.maximo)) + '.' : '') + (s.distancia === '∞' ? ' No existe camino en esa dirección.' : '') + '\n' + casillas + (s.ruta ? '\nRuta seleccionada ' + (s.ruta.id || '') + ': ' + s.ruta.nodos.map(id => nombreNodo(c, id)).join(' → ') + '. Costo de esta ruta: ' + valor(s.ruta.distancia) + '.' : '\nNo hay una ruta seleccionada vigente copiada.') + operacion;
      }
      return 'Hay una matriz vigente de distancias entre todos los pares. Selecciona una celda para consultar su distancia y la ruta que muestra la aplicación. ∞ significa que no hay camino; 0 en la diagonal corresponde al mismo vértice.';
    }
    if (modulo === 'dijkstra') {
      const destino = r.destino && lista(r.distancias).find(v => v.nodo === r.destino);
      if (destino) return 'Desde ' + nombreNodo(c, r.origen) + ' hasta ' + nombreNodo(c, r.destino) + ', la distancia mínima registrada es ' + valor(destino.distancia) + '. ' + (destino.distancia === '∞' ? 'Ese destino es inalcanzable; ∞ no equivale a cero.' : 'La ruta seleccionada corresponde solo a ese destino.') + ' El árbol de predecesores reúne caminos desde el origen a los nodos alcanzables; no es una única ruta.';
      return 'Distancias calculadas desde ' + nombreNodo(c, r.origen) + ':\n' + lista(r.distancias).map(v => nombreNodo(c, v.nodo) + ': ' + valor(v.distancia)).join('\n') + '\n∞ significa inalcanzable desde ese origen. Un predecesor es el punto anterior en el camino; el árbol reúne caminos y la ruta seleccionada corresponde a un destino.';
    }
    if (modulo === 'kruskal') {
      const parcial = lista(c.omitidos).length > 0, elegidas = Number.isInteger(r.cantidadElegidas) ? r.cantidadElegidas : parcial ? null : lista(r.elegidas).length;
      const componentes = Number.isInteger(r.cantidadComponentes) ? r.cantidadComponentes : parcial ? null : lista(r.componentes).length;
      return 'Objetivo: expansión de peso ' + (r.objetivo === 'max' ? 'máximo' : 'mínimo') + '. Peso total calculado: ' + valor(r.total) + '. Conexiones elegidas: ' + (elegidas === null ? 'recuento no copiado' : elegidas) + '; componentes: ' + (componentes === null ? 'recuento no copiado' : componentes) + '. ' + (componentes === null ? 'La muestra parcial no permite clasificar toda la expansión.' : componentes === 1 ? 'El resultado es un árbol de expansión.' : 'El resultado es un bosque con grupos separados.') + ' No representa una ruta entre origen y destino.';
    }
    if (modulo === 'asignacion') return 'Objetivo: ' + (r.objetivo === 'max' ? 'maximizar' : 'minimizar') + '. Total calculado con valores originales: ' + valor(r.total) + '.\n' + lista(r.asignaciones).map(a => valor(lista(d.recursos)[a.fila] && d.recursos[a.fila].nombre) + ' → ' + valor(lista(d.tareas)[a.col] && d.tareas[a.col].nombre) + ': ' + valor(a.valor)).join('\n') + '\nSin asignar: ' + lista(r.sinAsignarFilas).length + ' recursos y ' + lista(r.sinAsignarColumnas).length + ' tareas.';
    if (modulo === 'northwest') {
      const total = typeof r.costoTotal === 'number' ? r.costoTotal / r.escalaCostos : r.costoTotal;
      const asignaciones = lista(r.asignaciones), costos = lista(d.costos), columnas = lista(d.destinos).length;
      const completa = Number.isFinite(r.escalaCostos) && r.escalaCostos > 0 && asignaciones.length > 0 && asignaciones.length === lista(d.origenes).length && costos.length === asignaciones.length && columnas > 0 &&
        asignaciones.every((fila, i) => lista(fila).length === columnas && lista(costos[i]).length === columnas && fila.every((cantidad, j) =>
          typeof cantidad === 'number' && Number.isFinite(cantidad) && cantidad >= 0 && typeof costos[i][j] === 'number' && Number.isFinite(costos[i][j]))) &&
        !lista(c.omitidos).some(aviso => /(?:resultado\.asignaciones|datos\.(?:costos|origenes|destinos))/.test(aviso));
      let operacion = '';
      if (completa) {
        const terminos = [];
        asignaciones.forEach((fila, i) => fila.forEach((cantidad, j) => {
          if (cantidad > 0) terminos.push(valor(cantidad) + ' × ' + valor(costos[i][j] / r.escalaCostos));
        }));
        operacion = '\nCantidad × costo unitario: ' + (terminos.length ? terminos.join(' + ') : '0') + ' = ' + valor(total) + '.';
      } else if (asignaciones.length) operacion = '\nEl contexto no incluye todas las asignaciones y costos para desarrollar la suma completa; se conserva el total registrado.';
      return 'Costo total calculado: ' + valor(total) + '. Es una solución inicial factible; no garantiza el costo mínimo.' + operacion + (r.ficticio ? '\nFicticio registrado: ' + r.ficticio.tipo + ', cantidad ' + valor(r.ficticio.cantidad) + '.' : '\nNo se registró un ficticio.') + (r.degenerado ? '\nLa base es degenerada: puede incluir un 0 básico sin envío.' : '');
    }
    if (modulo === 'ordenamiento') return 'Procedimiento preparado para ' + d.algoritmo + '. Totales registrados: ' + valor(r.comparaciones) + ' comparaciones y ' + valor(r.intercambios) + ' movimientos.' + (r.arregloFinal ? '\nLista final: [' + r.arregloFinal.join(', ') + '].' : '\nLa vista actual corresponde al paso seleccionado. Avanza al último evento para consultar la lista final.') + '\nLa velocidad de animación no mide el tiempo de cálculo.';
    if (modulo === 'arboles') return 'Recorrido: ' + valor(r.recorrido) + '. Salida emitida hasta el paso elegido: [' + lista(r.salidaParcial).join(', ') + ']. ' + (r.completo ? 'El recorrido está completo.' : 'Es una salida parcial; avanza para completarla.') + '\nInorden ordena valores solo si el árbol es BST.';
    return TEMAS.inicio.resultado;
  }
  function diferencias(lectura) {
    const descripciones = {
      inicio: 'Inicio permite elegir el módulo y abrir trabajos recientes.',
      johnson: 'Johnson calcula distancias entre todos los pares en un grafo dirigido y permite pesos negativos, sin ciclos negativos.',
      dijkstra: 'Dijkstra calcula distancias desde un origen y requiere pesos no negativos; admite modo dirigido o no dirigido.',
      kruskal: 'Kruskal conecta los vértices en un árbol o bosque de peso mínimo o máximo, sin buscar rutas desde un origen.',
      asignacion: 'Asignación usa el método húngaro para elegir parejas recurso–tarea de costo mínimo o beneficio máximo.',
      northwest: 'Esquina noroeste obtiene una solución inicial factible de transporte; no garantiza costo mínimo.',
      ordenamiento: 'Ordenamiento transforma una lista en orden ascendente; Selection busca mínimos, Insertion inserta, Bubble compara vecinos, Shell usa saltos y Merge divide y mezcla. Insertion, Bubble y Merge son estables; Selection y Shell no lo garantizan.',
      arboles: 'Árboles permite crear un BST por inserciones o reconstruir un árbol binario general y seguir sus recorridos. Un árbol binario general no necesariamente cumple el orden de un BST.',
      difusa: 'Lógica difusa permite configurar un sistema Mamdani de una a tres entradas, pertenencias y reglas AND/OR con peso. Incluye ejemplos didácticos de ayuda, propina y ventilación; no son modelos calibrados.'
    };
    return (lectura.modulos.length ? lectura.modulos : Object.keys(descripciones).filter(m => m !== 'inicio')).map(m => descripciones[m]).join('\n\n');
  }
  function ayudaLocal(pregunta, foto) {
    const f = foto || obtener(), c = f.contexto;
    if (typeof pregunta !== 'string' || !pregunta.trim() || pregunta.length > 1200) return sinCobertura(f, pregunta);
    const l = interpretar(pregunta, f.modulo), modulo = l.modulo, temas = TEMAS[modulo] || TEMAS.inicio;
    const prefijo = NOMBRES[modulo] + ' · ';
    if (l.intencion === 'diferencias') return diferencias(l);
    if (l.modulos.length > 1) return sinCobertura(f, pregunta);
    // Conceptos con preguntas completas; mencionar una palabra aislada no basta.
    if (/^(?:que significa|que es|que son) (?:infinito|infinita|distancia infinita)$/.test(l.consulta) && ['johnson', 'dijkstra'].includes(modulo)) return prefijo + '∞ significa que no existe camino desde el origen hasta ese destino. No equivale a distancia cero.';
    if (/^(?:que es|que significa|como funciona) (?:balanceo|ficticio|cero basico|0 basico)$/.test(l.consulta) && modulo === 'northwest') return prefijo + temas.resultado;
    if (/^(?:puedo usar|puedo poner|se permiten|se admiten|acepta|admite)(?: pesos| valores| numeros| datos)? (?:negativos|decimales|repetidos|duplicados|cero)$/.test(l.consulta)) return prefijo + temas.reglas;
    if (/^(?:que es|que significa) ciclo negativo$/.test(l.consulta) && modulo === 'johnson') return prefijo + 'Un ciclo negativo tiene suma de pesos menor que cero. Recorrerlo repetidamente impide una distancia mínima finita. El módulo lo detecta y muestra el ciclo en lugar de una matriz de distancias.';
    if (/^(?:que diferencia hay entre|diferencia entre) (?:preorden y inorden|bst y arbol binario)$/.test(normalizar(pregunta)) && modulo === 'arboles') return prefijo + temas.pasos + '\n' + temas.resultado;
    const intencion = l.intencion;
    if (!intencion) return sinCobertura(f, pregunta);
    if (modulo === 'difusa') {
      if (intencion === 'guardar') return prefijo + 'El autoguardado conserva el modelo y los valores de entrada bajo una clave propia y versionada. Puedes guardar y recuperar trabajos del módulo. Los puntos, los recortes y los mapas se recalculan; no se guardan miles de muestras. El almacenamiento pertenece a este navegador y origen.';
      if (intencion === 'traslado') return prefijo + 'El JSON de trabajo restaura modelo y valores tras validarlos; una importación inválida conserva el ejercicio actual. El JSON de comparación numérica contiene casos y resultados para contrastarlos: cumple otra función. No hay importación general de archivos MATLAB .fis.';
      if (intencion === 'imprimir') return prefijo + 'Ctrl+P imprime la vista actual; desde el navegador puedes guardarla como PDF.';
      if (intencion === 'imagen') return prefijo + 'Las gráficas se consultan como SVG adaptables en la página. La entrega incluye exportación JSON de referencia para la comparación numérica.';
      if (intencion === 'pendientes') return prefijo + pendientes(modulo, c);
      if (intencion === 'vista') return prefijo + 'Vista actual: Lógica difusa, «' + c.vista + '». ' + temas.herramientas;
      if (['paso', 'ejercicio', 'resaltado'].includes(intencion)) return prefijo + explicarPaso(modulo, c);
      if (intencion === 'resultado') return prefijo + explicarResultado(modulo, c);
      if (intencion === 'errores') return prefijo + temas.errores;
    }
    if (intencion === 'empezar') return prefijo + GUIAS[modulo];
    if (['datos', 'reglas', 'herramientas', 'pasos'].includes(intencion)) return prefijo + temas[intencion];
    if (intencion === 'guardar') return modulo === 'inicio'
      ? 'Abre el módulo de tu ejercicio para guardarlo. «Trabajos recientes» abre su biblioteca sin reemplazar el ejercicio hasta confirmar.'
      : 'Pulsa «Guardar», escribe un nombre y confirma. «Cargar» abre «Mis trabajos» para recuperar, renombrar, eliminar o exportar/importar trabajos JSON. ' + (modulo === 'johnson' ? 'También puedes guardar grafos desde su biblioteca. ' : '') + 'Los guardados pertenecen a este navegador y no se sincronizan entre equipos. Exporta una copia antes de borrar sus datos.';
    if (intencion === 'traslado') return 'En el módulo correspondiente, abre «Cargar» → «Mis trabajos» y usa «Exportar» para descargar sus trabajos JSON o «Importar» para incorporarlos. Para trasladar un solo ejercicio, ' + (['johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest'].includes(modulo) ? 'usa también «Exportar JSON» / «Importar JSON» en sus opciones. ' : 'exporta el trabajo desde la biblioteca. ') + 'Abre el mismo módulo en el otro navegador o sitio y revisa el archivo antes de confirmar. Los datos de localhost, 127.0.0.1 y del sitio publicado no se trasladan automáticamente.';
    if (intencion === 'imprimir') return ['ordenamiento', 'arboles', 'inicio'].includes(modulo)
      ? 'Ctrl+P imprime la vista actual; desde el navegador puedes guardar como PDF. No vuelca todo el historial animado. Algo se oculta al imprimir.'
      : 'Pulsa «Imprimir» en el procedimiento' + (['dijkstra', 'kruskal'].includes(modulo) ? ' («Imprimir todos los pasos» en «Velocidad y más controles»)' : '') + ' para preparar todos los pasos. Desde el navegador puedes imprimir o guardar como PDF. Algo se oculta al imprimir.';
    if (intencion === 'imagen') return ['johnson', 'dijkstra', 'kruskal', 'asignacion', 'arboles'].includes(modulo)
      ? 'Usa el botón «PNG» o «Exportar PNG» de la vista del grafo o árbol. Descarga el dibujo; Algo no forma parte de esa exportación.'
      : 'Este módulo no ofrece exportación PNG del ejercicio. Puedes conservar trabajos como JSON o imprimir la vista como PDF.';
    if (modulo !== f.modulo) return prefijo + 'Estás en ' + NOMBRES[f.modulo] + '. Abre ' + NOMBRES[modulo] + ' para consultar el estado de su ejercicio.\n' + (temas[intencion] || GUIAS[modulo]);
    let respuesta;
    if (intencion === 'vista') respuesta = 'Vista actual: ' + c.vista + '.\n' + (temas[c.vista === 'resultado' ? 'resultado' : ['procedimiento', 'resolucion'].includes(c.vista) ? 'pasos' : 'datos']);
    if (intencion === 'pendientes') respuesta = pendientes(modulo, c);
    if (intencion === 'ejercicio') respuesta = 'Vista actual: ' + c.vista + '.\n' + (c.resultadoVigente ? (c.paso ? explicarPaso(modulo, c) + '\n\n' : '') + explicarResultado(modulo, c) : pendientes(modulo, c));
    if (intencion === 'errores') respuesta = (c.error ? 'Aviso actual de la aplicación:\n' + c.error : 'La aplicación no muestra un error de validación en este momento.') + '\n\n' + temas.errores;
    if (intencion === 'paso') respuesta = explicarPaso(modulo, c);
    if (intencion === 'resultado') respuesta = modulo === 'inicio' ? temas.resultado : l.contextual || !/^como /.test(l.consulta) ? explicarResultado(modulo, c) : temas.resultado;
    if (intencion === 'resaltado') {
      respuesta = ['dijkstra', 'kruskal'].includes(modulo) ? 'Verde: conexión elegida; amarillo: elemento del paso actual; contorno discontinuo: selección. La fila destacada corresponde al paso actual.' : modulo === 'asignacion' ? temas.resultado : modulo === 'ordenamiento' ? 'Los elementos comparados o movidos y la línea de pseudocódigo corresponden al evento elegido.' : modulo === 'arboles' ? 'Se distingue el nodo visitado del valor emitido a la salida; consulta la descripción del evento actual.' : temas.resultado;
      respuesta += '\n\n' + explicarPaso(modulo, c);
    }
    if (!respuesta) return sinCobertura(f, pregunta);
    if (lista(c.omitidos).length) respuesta += '\n\nEl contexto es una muestra limitada: ' + c.omitidos.join(' ');
    return prefijo + respuesta;
  }

  // El motor de conocimiento (asistente-motor.js) reutiliza estas piezas de solo
  // lectura para construir explicaciones del ejercicio sin duplicar la lógica.
  const interno = Object.freeze({ NOMBRES, GUIAS, TEMAS, SIN_EXPLICACION, normalizar, interpretar, explicarPaso, explicarResultado, pendientes, faltaResultado, nombreNodo, diferencias, valor,
    estadoContexto, explicarNumero, explicarCasillasJohnson, explicarMatrizJohnson });
  window.AlgoContexto = Object.freeze({ obtener, ayudaLocal, sugeridas, interno });
})();
