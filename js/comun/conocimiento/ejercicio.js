/* Preguntas sobre el ejercicio actual. No tienen respuesta fija: el campo
 * `dinamica` indica qué explicación construye el motor a partir del estado
 * leído por AlgoContexto (vista, datos, paso, resultado, selección y avisos).
 * `breve` describe la pregunta en el explorador y sirve de respaldo cuando el
 * módulo activo no ofrece ese dato. */
'use strict';

(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;

  const MODULOS = ['johnson', 'dijkstra', 'kruskal', 'asignacion', 'northwest', 'ordenamiento', 'arboles', 'difusa'];
  const GRAFOS = ['johnson', 'dijkstra', 'kruskal'];

  K.registrar([
    {
      id: 'ejercicio.vista', tema: 'ejercicio', modulos: MODULOS, dinamica: 'vista',
      pregunta: '¿Qué estoy viendo?',
      variantes: ['que estoy viendo', 'donde estoy', 'que es esta pantalla', 'que muestra esta vista', 'en que etapa estoy', 'explica esta pantalla'],
      conceptos: ['viendo', 'pantalla', 'vista', 'etapa'],
      breve: 'Describe la vista o etapa actual del módulo y qué puedes hacer en ella.',
      relacionadas: ['ejercicio.siguiente', 'aplicacion.etapas']
    },
    {
      id: 'ejercicio.celda', tema: 'ejercicio', modulos: ['johnson', 'asignacion', 'northwest'], dinamica: 'celda',
      pregunta: '¿Qué significa esta celda?',
      variantes: ['que significa esta celda', 'que significa esta casilla', 'que es este valor de la matriz', 'explica la celda seleccionada', 'que representa esta casilla'],
      conceptos: ['celda', 'casilla', 'esta', 'seleccionada'],
      breve: 'Explica la celda seleccionada de la matriz con los nombres y valores actuales.',
      relacionadas: ['matriz.leer-posicion', 'johnson.interpretar-matriz']
    },
    {
      id: 'ejercicio.seleccion', tema: 'ejercicio', modulos: GRAFOS.concat('asignacion', 'ordenamiento', 'arboles', 'difusa'), dinamica: 'seleccion',
      pregunta: '¿Qué nodo o elemento está seleccionado?',
      variantes: ['que nodo esta seleccionado', 'que tengo seleccionado', 'que elemento esta seleccionado', 'cual es la seleccion actual', 'que vertice seleccione', 'que conexion esta seleccionada'],
      conceptos: ['seleccionado', 'seleccion', 'seleccione', 'elemento'],
      breve: 'Indica qué nodo, conexión, pareja, pino o valor está seleccionado y cómo seleccionarlo si no hay nada.',
      relacionadas: ['aplicacion.crear-editar-eliminar']
    },
    {
      id: 'ejercicio.arista', tema: 'ejercicio', modulos: ['kruskal', 'dijkstra'], dinamica: 'arista',
      pregunta: '¿Por qué eligió o descartó esta arista?',
      variantes: ['por que eligio esta arista', 'por que descarto esta conexion', 'por que acepto esta conexion', 'por que rechazo esta arista', 'por que esta arista es verde', 'por que no uso esta conexion'],
      conceptos: ['eligio', 'descarto', 'acepto', 'rechazo', 'arista', 'conexion', 'esta'],
      breve: 'Explica la decisión del paso actual sobre la conexión revisada: aceptada o descartada y por qué.',
      relacionadas: ['kruskal.detectar-ciclos', 'dijkstra.relajacion']
    },
    {
      id: 'ejercicio.cambio', tema: 'ejercicio', modulos: MODULOS, dinamica: 'cambio',
      pregunta: '¿Qué cambió en este paso?',
      variantes: ['que cambio en este paso', 'que paso en este paso', 'que hizo este paso', 'que se modifico ahora', 'que ocurrio en el paso actual', 'que diferencia hay con el paso anterior'],
      conceptos: ['cambio', 'paso', 'este', 'modifico', 'ocurrio'],
      breve: 'Resume lo que se modificó en el paso que estás viendo según los datos registrados.',
      relacionadas: ['ejercicio.paso', 'basico.paso-iteracion-parada']
    },
    {
      id: 'ejercicio.paso', tema: 'ejercicio', modulos: MODULOS, dinamica: 'paso',
      pregunta: 'Explícame este paso',
      variantes: ['explica este paso', 'explicame este paso', 'explicame el paso actual', 'describe el paso actual', 'que significa este paso', 'que esta haciendo ahora', 'resume la operacion actual'],
      variantesAutorizadas: ['que esta pasando en este paso', 'como se hizo este paso'],
      conceptos: ['explica', 'paso', 'este', 'actual', 'operacion'],
      breve: 'Explica el paso seleccionado del procedimiento con sus datos reales.',
      relacionadas: ['ejercicio.cambio', 'ejercicio.resultado']
    },
    {
      id: 'ejercicio.resultado', tema: 'ejercicio', modulos: MODULOS, dinamica: 'resultado',
      pregunta: '¿Qué significa este resultado?',
      variantes: ['que significa este resultado', 'interpreta el resultado', 'explica el resultado', 'que dice el resultado', 'como leo este resultado', 'resume la solucion'],
      variantesAutorizadas: ['como salio ese resultado', 'explicame el resultado', 'que quiere decir este resultado'],
      conceptos: ['resultado', 'solucion', 'interpreta', 'este'],
      breve: 'Interpreta el resultado vigente: distancias, árbol, asignaciones, costo total, lista ordenada o recorrido.',
      relacionadas: ['ejercicio.total', 'ejercicio.paso']
    },
    {
      id: 'ejercicio.total', tema: 'ejercicio', modulos: ['kruskal', 'asignacion', 'northwest'], dinamica: 'total',
      pregunta: '¿Cómo salió este total?',
      variantes: ['como salio este total', 'de donde sale el total', 'como se calculo el costo total', 'explica el total', 'por que el total es ese', 'como se obtiene el peso total'],
      conceptos: ['total', 'costo total', 'peso total', 'salio', 'calculo'],
      breve: 'Muestra cómo se compone el total vigente a partir de las parejas, celdas o aristas elegidas.',
      relacionadas: ['asignacion.total', 'northwest.costo-total']
    },
    {
      id: 'ejercicio.sin-camino', tema: 'ejercicio', modulos: ['dijkstra', 'johnson'], dinamica: 'sin-camino',
      pregunta: '¿Por qué este nodo no tiene camino?',
      variantes: ['por que este nodo no tiene camino', 'por que este nodo esta en infinito', 'que nodos no tienen camino', 'cuales son inalcanzables', 'por que no llega a este nodo'],
      variantesAutorizadas: ['por que no hay camino'],
      conceptos: ['sin camino', 'infinito', 'inalcanzable', 'inalcanzables', 'nodo', 'este'],
      breve: 'Lista los vértices sin camino en el resultado vigente y las causas posibles en tu grafo.',
      relacionadas: ['dijkstra.inalcanzables', 'johnson.sin-camino']
    },
    {
      id: 'ejercicio.pendientes', tema: 'ejercicio', modulos: MODULOS, dinamica: 'pendientes',
      pregunta: '¿Qué dato me falta?',
      variantes: ['que dato me falta', 'que me falta completar', 'que falta para resolver', 'que falta para calcular', 'que datos faltan', 'que tengo pendiente', 'hay datos pendientes', 'que debo corregir'],
      variantesAutorizadas: ['por que no me deja continuar', 'que me impide seguir'],
      conceptos: ['falta', 'faltan', 'pendiente', 'pendientes', 'completar', 'corregir'],
      breve: 'Revisa el estado actual y señala datos pendientes o avisos de validación.',
      relacionadas: ['problema.faltan-datos', 'ejercicio.siguiente']
    },
    {
      id: 'ejercicio.siguiente', tema: 'ejercicio', modulos: MODULOS, dinamica: 'siguiente',
      pregunta: '¿Qué tengo que hacer ahora?',
      variantes: ['que tengo que hacer ahora', 'cual es el siguiente paso que debo dar', 'que hago ahora', 'que sigue', 'como continuo', 'y ahora que'],
      variantesAutorizadas: ['que debo hacer ahora'],
      conceptos: ['ahora', 'sigue', 'continuo', 'hacer', 'siguiente'],
      breve: 'Sugiere la próxima acción según la etapa, los datos y el resultado actuales.',
      relacionadas: ['ejercicio.pendientes', 'ejercicio.vista']
    }
  ]);
})();
