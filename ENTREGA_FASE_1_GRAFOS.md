# Entrega FASE 1 — Ciudad de los Algoritmos

Fecha: 8 de noviembre de 2026 (America/La_Paz). Trabajo sobre las fuentes locales, conservando las modificaciones que ya existían. No se publicaron cambios, no se hicieron commits ni push, no se instalaron dependencias y no se regeneraron `public/`, `entrega-netlify/` ni ZIP de Netlify.

## Cambios implementados

- **Johnson:** calcular abre el resultado con el grafo como superficie principal; matriz y procedimiento siguen disponibles bajo demanda. Origen, destino, objetivo y selección de interpretación están junto al grafo. El detalle incluye secuencia completa, pesos originales, suma y costo, también para ruta trivial y ausencia de camino.
- Se eliminó la duplicación del costo elegido en las dos casillas del destino. En consulta de caminos cada nodo mantiene sus dos distancias reales desde el origen, cualquiera que sea la ruta seleccionada.
- Vista **Tiempos y holguras** integrada en el mismo resultado, con cálculo independiente, tabla de tiempos/actividades, holguras en conexiones, críticas por holgura cero y elementos ajenos a la subred atenuados.
- Rutas principales con identificadores Rmín/Rmáx, colores, texto y selección para reforzar el trazo. Aristas compartidas reconocibles por trazo discontinuo. Búsqueda adicional de caminos simples solo bajo petición, cancelable y cooperativa, con límites visibles de 30 rutas y 10000 aristas examinadas. Se informa de listas truncadas o canceladas y no se promete orden por costo. Los caminos principales siguen procediendo de Johnson y del motor de máximos DAG.
- Nodos T más amplios, nombres completos, valores separados de sus divisiones, etiquetas de pesos con separación de colisiones y leyendas dentro del SVG. Se reutilizan los mismos descriptores, valores y estilos en editor, resultado y preparación de PNG. **Organizar grafo** es explícito: por niveles en DAG y circular en otros grafos. Seleccionar rutas o recalcular no modifica las posiciones guardadas.
- Formularios Johnson para crear nodos/conexiones y seleccionar elementos para editar o eliminar, además de sus herramientas gráficas. Cancelación de conexión visible y por Escape. Conservados arrastre, zoom, desplazamiento, ajuste y deshacer/rehacer.
- **Dijkstra y Kruskal:** herramientas para crear en el lienzo, seleccionar/mover, conectar extremos, cancelar, desplazar y organizar; edición accesible mediante formularios/listas; Pointer Events para ratón y táctil. Controles de consulta/cálculo cerca del grafo y resultado estático al calcular. Conservados los motores y el historial propios.
- Dijkstra muestra distancias, inalcanzables, predecesores y ruta elegida con tramos/costo, diferenciando árbol y ruta. Kruskal muestra aceptadas, descartadas por ciclo bajo demanda, componentes, aislados, cantidad elegida, costo y árbol/bosque mínimo o máximo.
- Dijkstra rápido de Johnson conserva un resultado independiente para su diálogo y no sustituye `visualizacionJohnson`. Al abrir Resultado se reconstruye explícitamente el contrato de la consulta Johnson.
- Ayuda Algo actualizada únicamente en las entradas de Johnson, Dijkstra y Kruskal.

## Archivos de esta fase

- `johnson.html`, `css/johnson.css`, `css/grafos.css`.
- `js/estado.js`, `js/dijkstra.js`, `js/acciones.js`, `js/dibujo.js`, `js/interaccion.js`, `js/zoom.js`, `js/almacenamiento.js` (editor histórico de Johnson).
- `js/johnson/caminos.js`, `js/johnson/ejemplos.js`, `js/johnson/vistas.js`.
- `js/grafos/modelo.js`, `js/grafos/editor.js`, `js/grafos/app.js`.
- `js/comun/conocimiento/algoritmos-grafos.js`.
- `tests/grafos.test.js`, `tests/fase1-johnson.test.js`, `tests/fase1-estado-johnson.test.js`, `tests/fase1-editor-johnson.test.js`.
- Este documento. Las demás modificaciones que ya estaban presentes no forman parte de esta entrega.

## Reglas definitivas de los editores

| Editor | Dirección | Pesos | Conexiones | Límites conservados |
| --- | --- | --- | --- | --- |
| Johnson | Dirigido | Enteros −999999…999999, incluido cero | Sin bucles, duplicados ni inversa si existe la otra dirección. Son restricciones del editor, no condiciones universales del algoritmo. | 40 nodos, 300 conexiones; nombres únicos sin distinguir mayúsculas, hasta 12 caracteres. |
| Dijkstra | Dirigido o no dirigido | Enteros 0…999999; rechaza negativos antes de calcular | Sin bucles ni duplicados. Dirigido admite A→B y B→A; no dirigido los considera la misma conexión. La conversión se confirma; los pesos opuestos distintos se resuelven explícitamente antes de fusionar. Cancelar o superar límites conserva el ejercicio. | 24 nodos, 96 conexiones; nombres hasta 12 caracteres. |
| Kruskal | No dirigido | Enteros −999999…999999, incluido cero | Sin bucles ni duplicados A–B/B–A. Objetivo mínimo o máximo; no requiere origen ni destino. | 24 nodos, 96 conexiones; nombres hasta 12 caracteres. |

Las referencias se mantienen por ID, independientemente de nombre y posición. Borrar un nodo elimina sus conexiones incidentes. CRUD e importación validan antes de sustituir datos; un rechazo conserva el ejercicio anterior. Se conservan los formatos de documento existentes. Los resultados derivados se recalculan al recuperar documentos, no se aceptan como autoridad matemática importada.

Mover y renombrar conservan cálculos matemáticamente válidos y actualizan la presentación. Cambios de pesos, topología o dirección los invalidan y quitan resaltados; cambiar origen Dijkstra también los invalida. Cambiar solamente destino Dijkstra reutiliza las distancias ya calculadas desde el mismo origen. El objetivo Kruskal invalida su cálculo anterior. Las dos interpretaciones de Johnson reconstruyen sus valores al cambiar de vista.

## Significado exacto de Johnson

**Consulta de caminos:** arriba se muestra el nombre; izquierda, mínimo Johnson desde el origen; derecha, máximo desde ese origen calculado mediante orden topológico si todo el grafo es DAG. El máximo es un cálculo adicional, no Johnson con comparaciones invertidas. `—` indica máximo no disponible por ciclos; no significa infinito. Un nodo inalcanzable muestra `∞` en el dibujo y «sin camino» en el texto. Origen=destino admite el camino trivial de costo cero cuando el cálculo global es válido. Un ciclo negativo detiene Johnson global: los pares que pueden atravesarlo no tienen mínimo finito; no se afirma eso para todos los pares indiscriminadamente.

**Tiempos y holguras:** nombre arriba, tiempo temprano a la izquierda y tardío a la derecha. Requiere red dirigida globalmente acíclica con todas las duraciones no negativas, extremos distintos y camino entre ambos. Solo se calcula sobre la intersección de los nodos alcanzables desde el origen con los que pueden llegar al destino, y sus actividades. El resto sigue visible atenuado, con identificación textual de exclusión.

- `temprano(origen)=0`; propagación topológica por máximo de `temprano(u)+duración(u,v)`.
- `T=temprano(destino)` y `tardío(destino)=T`; recorrido inverso por mínimo de `tardío(v)−duración(u,v)`.
- `H(u,v)=tardío(v)−temprano(u)−duración(u,v)`. Una actividad es crítica si su holgura es cero con tolerancia `Number.EPSILON × 64 × max(1, |T|)`, no porque los dos valores de sus nodos coincidan.
- El destino muestra **T | T** por la condición de inicio del recorrido hacia atrás.

Ejemplo integrado «Rutas y tiempos (19 / 58)», ID `tiempos-holguras`:

| Dato | Resultado |
| --- | --- |
| A→B=58; A→E=6; E→D=5; D→B=8 | Mínimo A→E→D→B = 19; máximo A→B = 58 |
| Consulta de caminos, nodo B | 19 \| 58 |
| Temporal A, E, D, B | 0 \| 0; 6 \| 45; 11 \| 50; 58 \| 58 |
| Holguras | A→B: 0; A→E, E→D y D→B: 39 |

## Reconstrucción y selección

Johnson reconstruye por la cadena de predecesores de cada par; máximos por los predecesores del recorrido DAG. El detalle comprueba por ID el sentido de cada arista y la suma de sus pesos originales. Los pesos reponderados permanecen identificados en el procedimiento. Las alternativas recorren caminos simples mediante DFS, sin repetir nodos; no alimentan los motores principales. Los caminos que coinciden con los principales se omiten de la lista adicional. La paleta de alternativas se reutiliza junto con identificadores, secuencia, costo y selección reforzada para que el color no sea la única referencia.

Dijkstra conserva todos los predecesores desde su origen: su árbol contiene las aristas que llevan a cada alcanzable y la ruta al destino es una cadena concreta dentro de ese árbol. Kruskal conserva Union-Find, acepta una conexión si une componentes distintas y descarta las que cerrarían ciclo. Con C componentes produce V−C aristas; conectado significa árbol y desconectado significa bosque, incluidos los nodos aislados.

## Comprobaciones ejecutadas

Las comprobaciones se limitan a estos grafos; no acreditan navegación ni apariencia real.

| Comando / comprobación | Resultado real |
| --- | --- |
| `node tests/johnson.test.js` | 16 correctas, 0 fallidas. Suite específica existente: negativos, ciclo negativo, inalcanzables, reconstrucción/suma de originales, importación/contrato. Incluye su comparación existente de 300 grafos contra Floyd-Warshall. Reejecutada tras el ajuste de normalización al importar. |
| `node tests/fase1-johnson.test.js` | 21 correctas, 0 fallidas. Ejemplo 19/58, tiempos/holguras, subred/exclusiones, crítica por actividad, cero/trivial/sin camino, rechazo temporal negativo/cíclico, máximos DAG, alternativas simples/límites/cancelación/cesión de control asíncrona. |
| `node tests/fase1-estado-johnson.test.js` | 14 correctas, 0 fallidas. Funciones reales con DOM mínimo: H-01; T 19\|58 en mínimo/máximo/comparación; T temporal 58\|58 y retorno; nombres/posiciones conservan cálculo; matemáticas invalidan y limpian; búsqueda adicional real, selección de alternativa, cancelación y descarte de respuestas tras edición o cambio de par. Geometría de miniatura y efectos externos sustituidos: no prueba navegador real. |
| `node tests/fase1-editor-johnson.test.js` | 15 aprobadas, 0 fallos, 0 omitidas. CRUD e importación atómicos, límites 40/300 y pesos, nombre normalizado sin modificar el documento fuente, archivo >1 MiB, resultados adjuntos ignorados, organizar DAG/ciclo, deshacer/rehacer, borrar incidentes, cancelar y descartar confirmaciones obsoletas. Dibujo, almacenamiento y diálogos externos sustituidos explícitamente. |
| `node tests/grafos.test.js` | 25 correctas, 0 fallidas. Dijkstra con cero, rechazo de negativos, inalcanzables y reconstrucción; Kruskal mínimo/máximo/bosque; CRUD, dirección y sus límites, estado/importación/deshacer. Los casos añadidos comprueban controlador/modelo, no eventos de navegador. |

También pasaron las comprobaciones `node --check` de los JavaScript modificados; `git diff --check` acotado a las fuentes de esta fase, sin errores (avisos de normalización CRLF); y la inspección de IDs HTML únicos y existencia de recursos locales enlazados por `johnson.html`, `dijkstra.html` y `kruskal.html`. La ayuda se cargó aisladamente: 46 entradas, IDs únicos y módulos limitados a Johnson/Dijkstra/Kruskal.

Total de casos registrados en estas cinco suites: **91 aprobados, 0 fallos**. No se ejecutaron sus variantes de medición ni otras suites.

## Limitaciones y continuación de la FASE 2

- **Navegador pendiente:** la habilidad Browser pudo iniciar su conexión, pero devolvió «No browser is available» y la lista de navegadores conectados estaba vacía. No se ejecutó el recorrido funcional escritorio/móvil, no se generaron capturas y no se presentan las pruebas VM como sustituto de esa revisión.
- Pendiente verificar en navegador real: tacto/arrastre/pinza, foco de formularios y SVG, ampliar/restaurar, contraste en ambos temas, nombres/costos largos, grafos densos y resultados en escritorio/móvil. Las posiciones se conservan por código; la ausencia absoluta de solapamientos no está certificada.
- La preparación de PNG comparte valores, etiquetas, leyenda y encuadre del SVG. Falta comprobar el archivo gráfico final y la impresión en un navegador disponible.
- Máximos y análisis temporal exigen DAG global, incluso si un ciclo está en una componente ajena al par elegido. Es una restricción explícita de esta implementación.
- Enumerar caminos simples puede ser exponencial: los límites son deliberados y una lista parcial no representa todos los caminos ni garantiza las mejores alternativas. El zoom sigue siendo necesario para leer grafos grandes.
- H-01 y H-02 están atendidos en el código de esta fase y cubiertos por comprobaciones dirigidas de estado/dibujo; su recorrido visual real sigue pendiente. No se marcan como resueltos los demás hallazgos de los informes. En particular, la desactualización de los paquetes H-09 continúa pendiente por instrucción del usuario.
- Para continuar: revisar este documento y el estado local, completar primero la comprobación funcional pendiente de los tres editores, acordar el alcance concreto de la FASE 2 y mantener aislados los módulos excluidos. Solo tras autorización de la fase de entrega corresponde regenerar/verificar los paquetes Netlify; todavía no publicar.

No se analizaron ni modificaron componentes de Asignación, ni se ejecutaron sus pruebas. Tampoco se intervino en Northwest, Ordenamiento, Árboles o Lógica difusa. No se ejecutaron `npm test`, lint global, suites generales de navegador ni construcción.
