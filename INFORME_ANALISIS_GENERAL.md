# Estado actual de Ciudad de los Algoritmos

Informe técnico para planificar la versión final. Fecha de corte: **7 de noviembre de 2026**, zona America/La_Paz. Se analiza el árbol de trabajo local, incluidos sus cambios pendientes y archivos sin seguimiento, no solamente la versión registrada en Git.

## 0. Alcance y cómo interpretar la evidencia

La revisión fue estática: lectura de HTML, JavaScript, CSS, configuración de construcción y servidor local; inspección selectiva del código de pruebas; comparación SHA-256 de fuentes públicas con sus copias de entrega. **No se ejecutaron la aplicación, pruebas, mediciones, construcción ni MATLAB; no se abrió un navegador ni se generaron capturas.** Tampoco se instalaron dependencias, hicieron commits, push o publicaciones. Solo se crearon este informe y `RESUMEN_PARA_REVISION.md`.

No se leyeron archivos `.env`, credenciales, datos de almacenamiento de un navegador, conversaciones del usuario ni contenido de paquetes antiguos de Gemini. La existencia de archivos o pruebas no acredita que funcionen o pasen actualmente. No se consultó un despliegue remoto.

Se utilizan tres niveles de evidencia:

- **L — Confirmado por lectura:** existe una estructura, operación, validación o contradicción concreta en el código. Un fallo deducido de una secuencia de instrucciones puede tener evidencia L y seguir pendiente de reproducción en ejecución.
- **P — Posible problema pendiente de comprobación:** hay una condición de riesgo sustentada en el código, pero no se ha establecido su incidencia real.
- **NC — No comprobado:** funcionamiento en navegador, rendimiento actual, apariencia efectiva, compatibilidad y estado de publicación.

Las referencias `archivo:línea` son relativas a la raíz y aproximadas para este estado del código. Las complejidades se deducen de la implementación; no son resultados de un benchmark. Todos los ejemplos numéricos explicativos de este informe se dedujeron manualmente y **no se ejecutaron**.

## 1. Inventario y arquitectura

### 1.1. Páginas y responsabilidades

Hay nueve páginas: inicio y ocho módulos disponibles en `js/comun/catalogo.js:35–182`.

| Página | Implementación principal | Responsabilidad real |
| --- | --- | --- |
| `index.html` | `js/comun/inicio.js`, `ciudad.js`, `catalogo.js` | Ciudad decorativa, selección de edificio, catálogo por categorías, video, accesos a trabajos recientes. |
| `johnson.html` | `app.js`, `js/estado.js`, `acciones.js`, `interaccion.js`, `dibujo.js`, `johnson.js`, `js/johnson/*` | Editor dirigido; Johnson de todos los pares; consulta mínima/máxima y procedimiento; Dijkstra rápido adicional. |
| `dijkstra.html` | `js/grafos/{modelo,algoritmos,editor,app}.js` | Editor y visualización de Dijkstra desde un origen, dirigido o no dirigido. |
| `kruskal.html` | los mismos cuatro archivos de `js/grafos/` | Editor no dirigido; árbol o bosque de expansión mínimo/máximo. |
| `asignacion.html` | `js/asignacion/` | Modelo bipartito, matriz, método húngaro, resultado y procedimiento. |
| `northwest.html` | `js/northwest/` | Datos de transporte, balanceo, solución inicial factible y procedimiento. |
| `ordenamiento.html` | `js/ordenamiento/` | Selection, Insertion, Bubble, Shell y Merge, con eventos, reproducción y contadores. |
| `arboles.html` | `js/arboles/` | Inserción BST, recorridos y reconstrucción de árboles binarios generales. |
| `logica-difusa.html` | `js/difusa/` | Sistema Mamdani configurable, ejemplos, inferencia, gráficos y mapa de respuesta. |

No se encontró una aplicación de página única ni un enrutador de framework: los enlaces cargan documentos HTML. Dijkstra y Kruskal generan buena parte de su interfaz con `js/grafos/app.js`; otros módulos conservan más estructura en su HTML.

### 1.2. Tecnologías y carpetas

El producto utiliza HTML, CSS y JavaScript de navegador, con scripts clásicos y dependencias por orden de carga. No declara paquetes externos de ejecución ni desarrollo en `package.json`/`package-lock.json`. Los `const` superiores de `js/config.js` son compartidos por los scripts clásicos posteriores, sin necesidad de convertirlos en propiedades de `window` (`config.js:100`). La ayuda y lógica difusa también publican objetos de API en el ámbito global mediante envoltorios.

- `styles.css`: variables de temas, controles, tablas y componentes generales. `css/shell.css`: barra superior/lateral, introducciones, biblioteca de trabajos y otros contenedores. Cada módulo agrega su CSS.
- `js/comun/`: navegación, catálogo, ciudad/inicio, temas, modo presentación, diálogos/foco, avisos, persistencia nombrada, PNG, impresión y ayuda Algo.
- `js/comun/conocimiento/`: base local de preguntas, conceptos, explicaciones, ejemplos y diagnóstico. No es un servicio de inteligencia artificial remoto.
- `js/johnson/`, `js/grafos/`, `js/asignacion/`, `js/northwest/`, `js/ordenamiento/`, `js/arboles/`, `js/difusa/`: lógica y vistas por dominio. Johnson mantiene además su editor histórico en varios `js/*.js` y su punto de entrada en `app.js`.
- `scripts/preparar-netlify.js`: lista explícita de archivos públicos, copia, comprobaciones de paquete y ZIP. `scripts/exportar-referencias-difusa.js`: apoyo para comparación externa, no parte del cálculo de navegador.
- `tests/`: validaciones estáticas, pruebas de motores/modelos, automatización de navegador, servidor local y mediciones. Sus nombres no son resultados de esta revisión.
- `matlab/`: material de comparación de lógica difusa. No se comprobó su ejecución.
- `public/` y `entrega-netlify/drop/`: copias generadas para distribuir; no deben asumirse equivalentes a la fuente actual.
- `servidor/` y `netlify/`: sin archivos en la enumeración actual. Existe una carpeta de paquetes obsoletos dentro de `entrega-netlify/`, cuyo contenido no se auditó.

Node solo participa en servidor, construcción y herramientas. `package.json` declara Node >=18; la configuración Netlify pide 22; el workflow de GitHub configura 20. Son entornos declarados, no versiones verificadas en ejecución.

### 1.3. Flujo interfaz → estado → validación → cálculo → dibujo

El patrón común es: controles editan un modelo en memoria; validadores deciden si la entrada es admisible o queda pendiente; el cálculo genera un resultado y pasos; las vistas consumen ese resultado. Las firmas matemáticas separan cambios de datos de cambios puramente visuales en varios módulos. Los resultados y miles de pasos normalmente se recalculan al recuperar trabajos en vez de tratar un resultado JSON como autoridad matemática.

Se comparten catálogo/navegación/temas, diálogos y foco, notificaciones, manejo de fallos de almacenamiento, trabajos nombrados para siete módulos, exportación SVG→PNG e impresión donde se integra. Los nombres, IDs y coordenadas tienen validadores propios por dominio. Dijkstra/Kruskal comparten modelo, editor, aplicación y motores del directorio `grafos`.

Hay duplicación deliberada y deuda localizada: Johnson tiene otro editor y otro Dijkstra (`js/dijkstra.js`) además de `js/grafos/algoritmos.js`; las tablas y reproductores se implementan por módulo; lógica difusa usa persistencia/biblioteca propias; Johnson tiene biblioteca histórica de grafos y también trabajos nombrados. No se justifica reescribirlo todo: conviene corregir contratos y compartir utilidades concretas cuando reduzcan discrepancias demostrables.

### 1.4. Inicio, ciudad, navegación e introducciones

`catalogo.js` contiene ocho entradas disponibles y seis categorías. Inicio y barra lateral se generan desde ese catálogo. `?simular=N` solo agrega entradas ficticias no disponibles, con tope 30 (`inicio.js:76–93`, `catalogo.js:206`); no son algoritmos implementados.

`ciudad.js:8–21` devuelve SVG decorativos propios, con `aria-hidden`; los controles son botones HTML. Elegir edificio actualiza descripción, entradas/salida y enlace al módulo (`inicio.js:117–203`). Las demostraciones no ejecutan los algoritmos: son animaciones de la ilustración. Se pausan por control, preferencia de movimiento reducido, visibilidad del documento y visibilidad de la ciudad (`inicio.js:105–115,222–245`). Hay vista lista y acceso móvil. El edificio inicial seleccionado es Johnson.

La barra se pliega en escritorio y se convierte en diálogo lateral por debajo de 1024 px (`navegacion.js:190–211`, `css/shell.css:186–216`). `intro.js` muestra presentación/video por módulo; se puede omitir con preferencia local o `?intro=no`. Al cerrar elimina el iframe, muestra el módulo y emite eventos para ajustar dibujos (`intro.js:94–121`). Los trabajos recientes abren la biblioteca del módulo mediante `?intro=no&trabajos=1`; el enlace no carga automáticamente el trabajo mostrado (`inicio.js:250–277`, `guardados.js:665–666`).

### 1.5. Local frente a Netlify y situación de Gemini

`npm start` está declarado como `node tests/servidor-local.js`. Ese servidor lee las fuentes de la raíz, escucha en `127.0.0.1:8123`, permite GET/HEAD de rutas públicas y valida host/origen; no es un backend de cálculo (`tests/servidor-local.js:17–32,40–88`). No lo ejecutamos.

`netlify.toml:1–6` declara construcción `node scripts/preparar-netlify.js --solo-publico` y publicación de `public`. El script copia una lista explícita de 100 archivos de producto, incluyendo lógica difusa y `js/johnson/caminos.js` (`preparar-netlify.js:9–39,159–172`), comprueba referencias HTML y rechaza referencias a asistente remoto en los archivos permitidos (`65–95`). Sin `--solo-publico` también prepara `drop` y ZIP y archiva salidas antiguas conocidas. No se ejecutó ninguna de esas acciones.

**Diferencia material confirmada por comparación de archivos:** de las 100 fuentes HTML/JS/CSS revisadas, tanto `public/` como `entrega-netlify/drop/` carecen de `js/johnson/caminos.js`; difieren además en ocho archivos: `johnson.html`, `js/acciones.js`, `js/dibujo.js`, `js/interaccion.js`, `js/zoom.js`, `js/johnson/ejemplos.js`, `js/johnson/vistas.js` y `css/johnson.css`. Esto demuestra desactualización respecto de la raíz; no demuestra que un sitio remoto concreto esté usando esas copias ni que las copias antiguas fallen por el archivo faltante, porque su HTML también es distinto. Regenerar y validar la entrega será un trabajo posterior.

La búsqueda en fuentes activas no encontró llamadas a Gemini, SDK de Google ni rutas de API remota para Algo. Las menciones activas restantes son controles de rechazo/archivo de paquetes obsoletos en `preparar-netlify.js:74,137–156`; existe respaldo `OBSOLETO_GEMINI_NO_PUBLICAR`, no incluido en `PUBLICOS`. No se inspeccionó su contenido ni `.env`. La aplicación actual calcula y responde con código local; esto no equivale a certificar ausencia de datos sensibles en cualquier archivo histórico. Los videos sí dependen de YouTube (`intro.js:73`, `inicio.js:308`), aunque los motores no dependen de ellos.

El almacenamiento es por navegador y origen: `localhost`, `127.0.0.1` y un dominio Netlify tienen guardados distintos. No hay sincronización automática entre esos contextos. La carga por `file://`, políticas reales del hosting y videos sin conexión no se comprobaron.

## 2. Johnson: construcción del grafo y cálculo de rutas

### 2.A. Construcción y representación del grafo

**Problema:** mínimos entre todos los pares de un grafo dirigido ponderado que puede tener pesos negativos, siempre que no tenga ciclos negativos. La aplicación agrega una consulta de máximos sobre DAG mediante otro algoritmo.

`js/estado.js:7` mantiene nodos `{id,nombre,x,y}`, conexiones `{id,desde,hacia,valor}`, contador, herramientas, selección, visualización, zoom e historial. Las referencias son IDs; renombrar o mover no cambia las conexiones. Un peso pertenece a `desde → hacia`, no a una pareja sin dirección.

El contrato del editor/importación (`almacenamiento.validarGrafoImportado():59–105`) es:

- Hasta 40 nodos y 300 conexiones; nombres no vacíos, únicos sin distinguir mayúsculas, hasta 12 caracteres; IDs de hasta 80, únicos entre nodos y conexiones; posiciones finitas dentro de ±1000000.
- Pesos enteros entre −999999 y 999999. Cero es una conexión válida; vacío no es un peso; negativos permitidos; decimales rechazados.
- Prohíbe bucles, duplicados A→B y también B→A si ya existe A→B. Sí admite ciclos dirigidos de tres o más nodos, positivos, nulos o negativos: la detección matemática decide estos últimos al calcular.
- Se puede editar un grafo vacío; el botón de cálculo exige al menos dos nodos (`vistas.js:155–161`). Esa exigencia no es una condición matemática de Johnson.

El núcleo `prepararDatosJohnson()` verifica identidades, referencias y números seguros, pero permite bucles/opuestas (`johnson.js:25–54`). Por ello una prueba del núcleo con un bucle no demuestra que el editor lo admita. Del mismo modo, ramas de dibujo para bucles/opuestas son capacidad heredada, no habilitación del CRUD actual.

`acciones.js` crea nodos con nombre/ID únicos y posición validada (`crearNodo():10–30`); la herramienta conectar recoge origen/destino y peso y verifica que el ejercicio no haya cambiado durante el diálogo (`38–81`). `guardarConexionJohnson():119–129` en almacenamiento valida antes de mutar o registrar historial. La UI permite renombrar nodos y cambiar pesos; esa función interna admite también editar extremos, pero no se encontró un control dedicado que lo ofrezca: el llamador de edición conserva los extremos (`acciones.js:125`). Eliminar nodo elimina aristas incidentes; hay confirmación y control del estado durante el diálogo (`acciones.js:88–176`).

Existen ejemplos clásico con negativos, positivos, comparación mínimo/máximo, inalcanzables, ceros/negativos y ciclo negativo (`js/johnson/ejemplos.js:9–100`). No se encontró generador aleatorio en la UI de Johnson; sí existe en Dijkstra/Kruskal. No debe confundirse un barrido aleatorio de pruebas con una función del producto.

**Dibujo:** SVG con capas de conexiones/nodos. `geometriaConexion()` calcula puntos de salida/llegada sobre círculos y espacio de flecha; usa segmentos rectos y desplazamiento perpendicular de etiquetas; su rama de opuestas usa Bézier cuadrática y la de bucles cúbica (`dibujo.js:32–82`). Las flechas son marcadores SVG. `separarEtiquetasGrafoJohnson():86` intenta evitar círculos/textos/segmentos; es una heurística, sin garantía general.

El radio es 26 normalmente y 66 en consulta T (`dibujo.js:28–29`). El nombre se mide, se abrevia con elipsis si excede 104 unidades y conserva título; cifras largas se comprimen a 42 unidades por compartimento (`197–274`). Esto puede reducir legibilidad con costos largos: su magnitud visual es NC.

La edición usa Pointer Events, arrastre, pan y pinza; las coordenadas lógicas se separan del zoom. `zoom.js:93–103` mantiene el punto del cursor; límite superior 3, mínimo normal 0.25, con alejamiento adicional al ajustar un grafo grande. Pan/zoom/resize no reescriben el grafo para encajarlo. Las miniaturas compactan una copia de posiciones y restauran en `finally`; posiciones coincidentes o muy desiguales pueden usar rejilla (`vistas.js:299–352`). Resultado ajusta `viewBox` usando cajas SVG y tiene pan, zoom y ampliación (`455–468,1161–1227`). No se comprobaron táctil, encuadre o exportación.

### 2.B. Cálculo de distancias mínimas y reconstrucción

`calcularJohnsonDesde()` en `js/johnson.js:267–350` implementa realmente:

1. Copia/valida datos y crea índices en orden de nodos.
2. `bellmanFordJohnson():129` agrega q con aristas q→v de peso 0; distancia de q=0 y resto infinito. Hace hasta V pasadas por E+V aristas, con parada si no mejora.
3. Una revisión adicional detecta ciclos negativos. q alcanza todas las componentes, de modo que también detecta ciclos separados de un origen ordinario.
4. Potenciales `h(v)=d(q,v)`; reponderación `w′(u,v)=w(u,v)+h(u)−h(v)` (`reponderarConexiones():211`).
5. Ejecuta `dijkstraJohnson():230` desde cada origen, con arreglos y elección lineal del pendiente de menor distancia, sin heap/cola de prioridad.
6. Recupera `d(u,v)=d′(u,v)−h(u)+h(v)`.

Conserva matrices originales/reponderadas, potenciales, predecesores y órdenes. Cada predecesor por origen/destino es `null` o `{nodo:indiceAnterior,conexion:idOriginal}`. La relajación usa `<`: igualdad no reemplaza el primer predecesor. El orden de nodos y aristas determina una ruta representativa en empates, no se enumeran todas.

`reconstruirRutaJohnson():365–400` sigue predecesores con límite defensivo e invierte nodos/aristas. Inalcanzable da `null` y distancia `Infinity`; UI usa ∞. Origen=destino devuelve nodo único, ninguna arista y costo 0 cuando el cálculo global es válido. `prepararRecorridoRutaJohnson()` verifica aristas/extremos y exige que la suma de pesos originales sea la distancia esperada (`vistas.js:759–769`). La matriz de resultado contiene **mínimos originales**, y hacer clic en una celda configura ese par y objetivo mínimo (`748–752`). Los pesos reponderados se ven en procedimiento, no sustituyen los pesos que se suman al usuario en la ruta final.

Ejemplo manual de reponderación: A→B=−2, B→C=3, A→C=4. q permite h(A)=0, h(B)=−2, h(C)=0; pesos reponderados 0,1,4. Dijkstra obtiene d′(A,C)=1; recuperación 1−0+0=1, igual a −2+3. Esto ilustra por qué la ruta final debe sumar pesos originales aunque el procedimiento use otros.

`nodosDelCiclo():98` salta atrás para entrar en un ciclo y reconstruye su dirección; `conexionesDelCiclo():69` recupera aristas originales y suma su peso. Si hay ciclo negativo, el núcleo devuelve matrices/predecesores `null` y termina antes de reponderar. La política de abortar Johnson global es razonable, pero decir sin matices que «no existen distancias mínimas» generaliza demasiado: solo los pares que pueden atravesar el ciclo pueden disminuir sin límite; otros pueden conservar mínimos finitos o ser inalcanzables (H-15). No se propone fabricar una matriz parcial en esta versión sin decidir su semántica.

### 2.C. Máximos: algoritmo diferente y restricciones reales

`calcularMaximosDAGJohnson()` en `js/johnson/caminos.js:9–95` usa Kahn para ordenar topológicamente **todo el grafo**. Si no ordena V nodos, devuelve `aciclico:false`, incluso si el ciclo está en una componente ajena al origen. Esta es una restricción conservadora de la aplicación, no una prueba de que todo máximo en grafos cíclicos sea infinito.

En DAG inicializa origen 0/resto −∞ y relaja en orden topológico con `>` usando pesos originales; admite pesos negativos y conserva el primer predecesor en empate. `reconstruirMaximoDAGJohnson():98` recupera la ruta. Origen=destino vale 0; −∞ significa inalcanzable; `null` se reserva para máximo no calculable por la restricción de ciclos. No son tiempos de proyecto, Bellman-Ford invertido ni un Johnson de máximos. La consulta conserva caché por origen mientras el grafo es vigente (`vistas.js:784`).

### 2.D. Significado exacto de los nodos T

`actualizarConsultaRutaJohnson()` genera `valoresNodos[id]` con el mínimo de la fila del origen en Johnson y el máximo DAG desde **ese mismo origen** (`vistas.js:795–809`). En general: nombre arriba; mínimo abajo izquierda; máximo abajo derecha. `—` significa no calculable; ∞ significa sin camino. La tabla de tramos, en cambio, lleva el acumulado exclusivo de la ruta elegida.

Estos números **no son** potenciales h, tiempos tempranos/tardíos, holguras ni mínimos/máximos entre todos los orígenes. En un nodo intermedio de la ruta máxima, el acumulado elegido puede superar su distancia mínima desde el origen sin contradicción.

Hay una excepción actual de presentación importante (H-02): `dibujarCompartimentosNodoJohnson()` define `finalElegido` en el destino si se eligió un único objetivo y hay distancia finita; sustituye ambos valores por `visual.distancia` y los rotula «Elegido» (`dibujo.js:200,244–274`). La leyenda SVG declara esa repetición (`296`), pero HTML, accesibilidad general y detalle siguen anunciando mínimo/máximo (`johnson.html:265`; `vistas.js:933–936,978`). Por tanto es una decisión de presentación explícita con semántica distinta, no evidencia de que ambos extremos calculados sean iguales.

Ejemplo existente `minimo-maximo`, deducido manualmente (`ejemplos.js:44–55`): A→B=2, B→D=3, A→C=5, C→D=4. Desde A, D tiene **mínimo 5 y máximo 9**. El estado/tabla guardan 5|9. En el destino, Minimizar dibuja 5|5, Maximizar 9|9 y Comparar 5|9. Se recomienda conservar 5|9 en los tres modos y mostrar aparte el objetivo elegido.

**30|30 es correcto** cuando ambos extremos reales valen 30, por ejemplo un único camino de costo 30 o varios caminos todos de costo 30. Si hay caminos de costo 20 y 30, corresponde 20|30. La corrección no consiste en forzar coincidencia.

Colores: las listas de nodos/aristas de cada ruta deciden clases mínimo/máximo/compartido, con estilos cian/violeta/discontinuo; origen y destino tienen clases propias, y en la diagonal se prioriza el color/clase de origen, aunque se añaden ambos aros y el rótulo «Origen / destino» (`dibujo.js:175–193,333–344`). No se colorea todo nodo alcanzable como si perteneciera a la ruta consultada. El ciclo negativo usa su propia visualización. Normalmente tabla, rutas y SVG proceden del mismo resultado/firma, salvo el conflicto de estado descrito a continuación.

### 2.E. Invalidación y conflicto con el Dijkstra rápido

`firmaGrafoJohnson()` incluye orden de IDs y conexiones/pesos, excluyendo nombres/posiciones (`vistas.js:54–58`). Cambiar topología o peso invalida; mover conserva cálculo; renombrar actualiza nombres/textos/ciclo y pasos (`83–100`). El dibujo descarta resaltados con firma distinta (`dibujo.js:377–380`). `limpiarRutaSeleccionadaJohnson():955` elimina consulta, caché, selección y visualización.

**Conflicto confirmado de estructura; reproducción pendiente (H-01):** después de resolver Johnson, ir a Resultado, «Ver en editor», seleccionar un nodo y ejecutar Más→Dijkstra sobre pesos no negativos, el Dijkstra rápido sobrescribe `estado.visualizacionJohnson` sin `valoresNodos` (`app.js:46–53`; `js/dijkstra.js:191–200`). Conserva selección/consulta Johnson. Volver a Resultado solo reconstruye consulta si falta selección (`vistas.js:992`), pero el detalle accede directamente a `visualizacionJohnson.valoresNodos[id]` (`936,979`). Esa ruta puede lanzar TypeError; el panel también puede combinar detalle previo con árbol nuevo. Debe aislarse la visualización rápida o limpiar/reconstruir consulta y comprobar su tipo.

Este Dijkstra rápido tiene controlador que rechaza negativos; su núcleo histórico no los valida por sí mismo. No es el motor utilizado por `dijkstra.html`.

### 2.F. Complejidad, pasos y límites

Por barrido lineal de Dijkstra, el cálculo mínimo cuesta `O(V(E+V)+V(V²+E)) = O(V³+VE)`, no la cota de Johnson con heap. Matrices: O(V²); adyacencias O(V+E). Bellman-Ford conserva distancias antes/después y relajaciones por pasada, hasta O(VE+V²) memoria; el conjunto de datos/pasos tiene esa cota. El procedimiento de Dijkstra en Johnson agrega **un paso por origen**, con distancias/predecesores/orden finales, no una animación de cada relajación (`johnson.js:490–501`; `vistas.js:603–627`).

Un máximo DAG cuesta O(V+E), incluido registro didáctico; la caché para V orígenes puede ocupar O(V(V+E)). Mostrar todas las rutas de un origen puede añadir O(V²) de reconstrucciones. Dibujar SVG denso/evitar etiquetas añade trabajo de presentación no incluido en esas cotas; rendimiento real con 40/300 es NC. No se identificó cobertura específica en pruebas de los nuevos máximos/T y de la transición al Dijkstra rápido; sí hay pruebas escritas de mínimos contra Floyd, ciclos y contratos, sin ejecutar.

## 3. Dijkstra independiente: construcción, caminos y visualización

### 3.1. Modelo y construcción

`js/grafos/modelo.js:31–76` valida hasta **24 nodos/96 aristas**, dirigido o no dirigido. IDs únicos entre objetos de 1–80 caracteres; nombres no vacíos hasta 12, pero **pueden repetirse**. Posiciones x en [30,970], y en [30,570]. Los nombres duplicados no confunden IDs matemáticos, aunque dificultan leer rutas abreviadas.

Dirigido admite A→B y B→A con pesos independientes, sin paralelas en el mismo sentido. No dirigido usa una pareja canónica y A–B/B–A es una sola arista. Prohíbe bucles. Pesos enteros entre 0 y 999999: cero válido; negativos y decimales rechazados por entrada y validador, no solo por explicación. Vacío válido para editar pero no para resolver; un solo vértice sí se resuelve.

Se crean nodos/conexiones mediante editor/formularios; hay ejemplos y generación aleatoria acotada. Cambiar a dirigido duplica aristas no dirigidas y bloquea si supera 96; cambiar a no dirigido fusiona opuestas y pide decidir pesos distintos (`app.js:411–437`). Las restricciones no son las de Johnson.

Comparte con Kruskal editor, estado/controlador y validación. Con Johnson comparte utilidades/temas/PNG/ayuda, pero no el editor o modelo directamente. `editor.js:143–220` dibuja SVG, flechas solo en dirigido, curvas para opuestas y etiquetas a un tercio; intenta cuatro posiciones y puede volver a la primera si ninguna queda libre. Nombres de más de cinco caracteres se abrevían a cuatro y elipsis, con título/ARIA completos. Se admiten coordenadas coincidentes: solapamientos previsibles requieren revisión visual.

El arrastre del editor compartido está habilitado para ratón; táctil/teclado disponen de campos de coordenadas (`editor.js:258`). Durante arrastre mueve el grupo y al confirmar redibuja conexiones; no ofrece el mismo comportamiento Pointer/pinza de Johnson. Tiene zoom/ajuste/ampliación según controles del módulo, sin que su existencia acredite usabilidad actual.

### 3.2. Algoritmo y flujo de resolución

Origen obligatorio y destino opcional. El destino solo decide el resaltado: se calculan todos los destinos. `resolverModuloGrafo()` copia grafo/opciones, registra revisión y difiere inicio con setTimeout(0); comprueba revisión antes/después para descartar tareas viejas (`app.js:190–209`). El núcleo posterior sigue siendo sincrónico, sin worker.

`resolverDijkstraGrafo()` (`algoritmos.js:10–66`) valida/copia, construye Map de adyacencias y, en no dirigido, agrega acceso a ambos sentidos conservando ID original. Usa objetos sin prototipo para distancias/predecesores y Set de finalizados/exploradas. Inicializa origen 0/resto ∞, elige por barrido lineal el menor pendiente, finaliza y relaja salientes hacia no finalizados. Termina al no quedar pendientes alcanzables. No tiene cola de prioridad ni maximización.

Registra distancia y predecesor `{nodo,conexion}`. La comparación estricta `<` conserva el primer camino al empatar; ciclos de peso cero no exigen cambiarlo. `reconstruirRutaGrafo():69` sigue IDs, valida dirección o inversa no dirigida, controla ciclos y suma pesos originales. Inalcanzable: ruta null/∞; origen=destino: nodo único/costo 0. Ejemplo manual: A→B=0 y B→C=2 producen costo 2, no «ausencia de A→B»; A aislado de D deja D en ∞.

### 3.3. Pasos, colores y estado

Registra inicio, selección de nodo, revisiones/relajaciones y final con copias de distancias, predecesores, finalizados y pendientes. El procedimiento pinta árbol de predecesores del paso, nodo/arista actuales y finalizados. Resultado pinta árbol de caminos mínimos y, si se eligió destino, destaca su ruta; no significa que todo el árbol sea una única ruta. Los rótulos identifican origen/destino.

`firmaCalculoGrafo()` incluye dirección, IDs, aristas y pesos, no nombres/posiciones (`modelo.js:25–29`). `comprometerGrafo()` valida copia antes de modificar; mover/renombrar conserva resultado actualizando su copia del grafo; modificar pesos/topología/modo/origen invalida; destino conserva cálculo (`app.js:131–152`). Historial hasta 50 acciones. Documento v1 guarda datos/opciones y bandera `resuelto`, no resultados confiados; al recuperar recalcula y acota paso (`app.js:105–116`). Importación ≤1 MiB valida antes de sustituir y protege contra revisión cambiada durante diálogo (`541–557`). Clave `dijkstra.v1`; incompatible conserva original (`584–593`).

### 3.4. Complejidad real

Núcleo sin historial: O(V²+E) tiempo y O(V+E) espacio. Hay O(V+E) eventos y cada uno copia O(V): el cálculo instrumentado tiene O(V²+VE) tiempo y memoria adicional O((V+E)V). Reconstruir una ruta arma mapa de aristas O(E) y recorre O(V). La etiqueta O(V²+E) es correcta para el núcleo, incompleta como costo del producto con pasos. No se encontró una discrepancia matemática manifiesta en su motor por lectura; se mantienen pendientes su ejecución, colores/tabla en pantalla y casos de los límites.

## 4. Kruskal: árbol o bosque de expansión

### 4.1. Datos y modelo

Usa los mismos archivos de `js/grafos/`, pero **siempre no dirigido** y con pesos enteros entre −999999 y 999999. Admite negativos/cero y rechaza decimales. Hasta 24 nodos/96 aristas; sin bucles, paralelas ni duplicación A–B/B–A. No hay origen/destino porque no resuelve una ruta entre dos puntos. Grafo vacío puede editarse pero no calcularse; un nodo sin aristas produce árbol trivial de peso 0; varios aislados, bosque de peso 0.

### 4.2. Cálculo efectivamente implementado

`resolverKruskalGrafo()` en `algoritmos.js:101–143` valida objetivo min/max, ordena ascendente/descendente y desempata explícitamente por índice original. Union-Find usa Map de padre/rango, compresión de caminos y unión por rango. Acepta una arista si sus representantes difieren; la agrega y suma su peso. Si ya comparten componente, descarta por ciclo. Procesa **todas** las aristas, incluso después de V−1 aceptadas en conectado, para explicar descartes restantes.

El costo total es la suma original de aceptadas, incluidas negativas. En desconectado produce un árbol por componente y mantiene aislados: bosque con V−C aristas. Maximizar invierte el orden y es válido para árbol/bosque de expansión de peso máximo; no busca un subconjunto arbitrario sin obligación de conectar. Ejemplo manual: A–B=−2, B–C=1, A–C=4; mínimo elige −2 y 1, total −1; máximo 4 y 1, total 5. Un D aislado agrega una componente, no una arista ficticia.

### 4.3. Procedimiento, representación y terminología

Cada arista deja componentes antes/después, aceptadas acumuladas, decisión y peso. La tabla marca «Aceptada», «Ciclo» o «Pendiente»; muestra componentes y acumulado (`app.js:283–293`). Resultado nombra «Árbol/Bosque de expansión de peso mínimo/máximo», lista grupos, aislados y V−C (`356–366`). El SVG resalta aceptadas y arista actual. Rechazadas anteriores quedan en estilo base y se explican en tabla, sin clase visual persistente propia de rechazo.

En los mensajes principales actuales revisados **no se encontró** que llame «ruta» al resultado Kruskal; variables/CSS de ruta del archivo compartido corresponden a Dijkstra. Conviene conservar esa terminología y no inventar una corrección de un rótulo que ya está bien.

### 4.4. Estado, complejidad y límites

Mismos contratos de mutación/importación/persistencia de Dijkstra, con clave `kruskal.v1` y objetivo mínimo/máximo. Cambiar objetivo invalida/recalcula; renombrar/mover conserva cálculo, topología/pesos lo invalidan. Resultados de documentos se reconstruyen a partir de datos.

Sin historial: O(E log E + E α(V) + V). Para cada arista se reconstruyen componentes antes/después recorriendo nodos y se copian aceptadas, por lo que el trabajo didáctico añade aproximadamente O(EV), conservadoramente O(EV α(V)); memoria de pasos O(EV). No se detectó un defecto matemático manifiesto por lectura. Las pruebas existentes incluyen mínimos/máximos, negativos, empates y bosques contra referencias, pero no se ejecutaron. Separación de componentes/etiquetas en grafos densos queda NC.

## 5. Asignación: método húngaro

### 5.1. Entradas, modelo y flujo

Empareja recursos con tareas uno a uno para minimizar costos o maximizar beneficios. Admite **1–8 recursos y 1–8 tareas**, matrices rectangulares, valores enteros de −999999 a 999999 y nombres únicos dentro de cada grupo de hasta 24 caracteres (`config.js:17–21`). Cero/negativos válidos; decimales, notación científica textual y texto parcial rechazados; vacío significa pendiente, no cero (`validacion.js:12–25`).

El modelo usa IDs estables y valores por clave `recurso|tarea` (`modelo.js:90–108`). Grafo bipartito y matriz leen/escriben la misma estructura. El grafo impide bucles y conexiones dentro del mismo grupo (`grafo.js:367–391`). No hay rutas prohibidas representadas como infinito: quitar una conexión deja un pendiente y **todas las parejas reales deben completarse** para resolver, incluso si una asignación concreta luego no las utiliza (`modelo.js:136–166`). Eliminar elemento elimina sus valores incidentes (`74–83`).

Flujo: crear recursos/tareas o ejemplo; completar matriz/grafo; elegir min/max; validar; resolver; consultar asignaciones/total y procedimiento. Un modelo sin recursos o tareas no está listo para resolver. Importación comprueba forma, IDs, referencias y valores, no solo JSON.parse (`modelo.js:227–272`).

### 5.2. Algoritmo y correspondencia con el resultado

`resolverHungaro()` en `hungaro.js:108–234` contiene:

1. Copia/validación de matriz.
2. Para máximo, conversión `máximo − beneficio`.
3. Completar a n×n, n=max(filas,columnas), con ficticios de costo cero.
4. Reducción de filas y columnas.
5. Emparejamiento máximo de ceros con caminos de aumento de Kuhn (`emparejarCeros():28–51`).
6. Cobertura mínima por caminos alternantes (`coberturaMinima():58–81`).
7. Ajuste con mínimo no cubierto hasta emparejar n elementos, con guarda de 200 iteraciones (`164–166`).
8. Filtrar asignaciones ficticias y sumar valores originales (`207–220`).

Hay siempre min(filas,columnas) asignaciones reales: un beneficio negativo no permite omitir libremente una pareja si el modelo exige cubrir el grupo menor. La transformación rectangular mantiene ese número fijo y es coherente para maximización. Los índices de salida preservan orden de listas reales; `resultado.js:87–115` los traduce a nombres y enumera elementos sin asignar. Los ficticios representan el exceso de un lado, no agentes reales con nombre intercambiable.

Ejemplo manual: beneficios 2×3 `[[−1,3,0],[2,1,4]]`; maximizar asigna fila1→col2 y fila2→col3, total 7; una tarea queda sin asignar y se agrega una fila ficticia en el problema cuadrado. El total visible debe seguir siendo 3+4, no la suma transformada.

Hay verificación exacta independiente `verificarAsignacionPorFuerzaBruta()` (`hungaro.js:264–309`), que en realidad usa programación dinámica por subconjuntos, no enumeración ingenua. Para máximo minimiza el negativo, cuenta óptimos y divide permutaciones ficticias por factorial. La UI muestra coincidencia/unicidad/discrepancia (`resultado.js:117–125`); una discrepancia no detiene por sí sola la presentación del húngaro. Empates admitidos: se muestra una solución representativa y el conteo ayuda a explicar alternativas. No se detectó una incorrección matemática manifiesta en el motor por lectura, sin afirmar que haya sido ejecutado correctamente ahora.

**Inconsistencia de ficticios (H-06):** la matriz editable agrega exactamente una fila o columna ficticia al principio cuando los tamaños difieren (`matriz.js:48–49,62–68,80–95,105–111`). El motor agrega tantas como faltan y al final (`hungaro.js:139–146`), y procedimiento sigue ese orden. En 2×5 la edición muestra 3×5 con un ficticio, mientras se resuelve 5×5 con tres. Incluso cuando falta uno, cambia su posición. Es inconsistencia pedagógica entre vistas, no prueba de total erróneo.

### 5.3. Estado, persistencia y costos de pasos

La firma incluye objetivo, IDs ordenados y valores, excluye nombre/posición (`modelo.js:174–180`). Costos, dimensiones, conexiones u objetivo invalidan; renombrar conserva y actualiza textos, incluidas expresiones del total. Historial de mutaciones valida/revierte antes de incorporar (`estado.js:193–247`). Deshacer/rehacer comprueba vigencia por firma (`165–182`).

Autoguardado v2 conserva objetivo, modelo, posiciones y vista, sin resultado/pasos/historial/zoom (`estado.js:40–52`). Recargar vuelve a entrada y exige resolver; un trabajo nombrado que declara resultado vigente lo recalcula. Migra v1 conservando enteros válidos y dejando pendientes valores incompatibles; rechaza estructuras excesivas/versiones inválidas conservando original (`estado.js:65–125`; `modelo.js:279–326`). Exportación/importación específica en `app.js:167–240`, máximo 1 MiB.

Kuhn rehecho tras cada ajuste cuesta hasta O(n³); por ello el cálculo actual es O((I+1)n³), I iteraciones de ajuste, con guarda 200, además de la verificación O(n·2ⁿ) tiempo/O(2ⁿ) espacio. Cada paso copia matriz n×n (`hungaro.js:120–122`): memoria del procedimiento O((I+1)n²). n≤8 limita la escala, pero no se debe citar sin matices la complejidad de un húngaro optimizado distinto.

Hay tabla desplazable, zoom/ampliación del bipartito y CSS responsive. Confirmar una celda válida puede reconstruir toda la tabla y dejar referencias de foco a la tabla anterior (`matriz.js:140–159,203`; `app.js:97–99`): riesgo P de navegación por teclado, pendiente de reproducción (H-10).

## 6. Northwest: solución inicial factible de transporte

### 6.1. Datos y balanceo

No es un optimizador de transporte: produce una **solución inicial factible**, y la página/resultado lo declaran (`northwest.html:48`; `app.js:294`). No implementa MODI ni stepping stone. Admitir desequilibrio no equivale a garantizar costo mínimo.

Límites: **1–10 orígenes y destinos reales**, más un ficticio derivado; oferta/demanda enteras de 0 a 999999; costos de 0 a 999999 con hasta dos decimales, coma o punto; nombres únicos por grupo hasta 40 (`config.js:23–30`; `validacion.js:16–64`). Vacío es pendiente; negativos rechazados; cantidades fraccionarias rechazadas aunque el método matemático pueda trabajar con reales. Los costos se guardan como enteros ×100. Todos deben existir, también en filas de oferta cero; no se modelan rutas prohibidas (`modelo.js:127–133`).

`balancearNorthwest()` crea una copia balanceada (`balanceo.js:21–52`): si sobra oferta, destino ficticio; si falta, origen ficticio. Registra tipo/índice/cantidad, costo cero como convención explícita (`55–67`). No modifica los datos reales ni acumula ficticios al volver a balancear.

### 6.2. Algoritmo, empates y degeneración

`resolverEsquinaNoroeste()` (`noroeste.js:29–143`) valida forma, valores y balance; comienza arriba izquierda, asigna `min(ofertaRestante,demandaRestante)` y avanza fila o columna. En empate no salta ambas a la vez: una visita posterior genera una básica cero para mantener m+n−1 básicas. No introduce un ε numérico que altere cantidades/costo. Las ofertas/demandas cero recorren la misma lógica; oferta y demanda totales cero se explican como caso trivial (`app.js:123–127`).

El costo suma cantidad×costo unitario escalado y verifica productos/acumulado seguros (`noroeste.js:115–123`). El verificador comprueba cantidades no negativas, conservación por filas/columnas, costo, número de básicas y ausencia de ciclos (`149–181`); no prueba optimalidad.

Ejemplo manual balanceado: oferta [5,5], demanda [5,5], costos `[[9,1],[1,9]]`. Noroeste asigna 5 a (1,1), básica cero para degeneración y 5 a (2,2); costo 90. Otra solución envía 5 por cada cruce y cuesta 10. Esto muestra por qué «factible» no es «óptimo» aunque el cálculo del procedimiento esté bien.

### 6.3. Interfaz, invalidación y defecto de validación

Flujo en cuatro vistas: datos → balanceo y confirmación → resolución paso a paso → resultado. Los pasos muestran celda, saldos, operación/movimiento; la matriz diferencia costo pequeño y cantidad grande, y marca «0 básico»; resultado enumera envíos/verificaciones (`app.js:179–305`; `tabla.js:186–247`). Reproducción a 1600 ms/paso e impresión del procedimiento.

Firma con IDs/orden, oferta/demanda y costos, sin nombres (`modelo.js:153–158`). Cambios numéricos/estructura invalidan; renombrar actualiza las copias de balance sin perder resultado (`estado.js:112–132`). Mutaciones se validan y revierten ante error; deshacer/rehacer comprueba vigencia (`89–109`).

**Error de estado confirmado (H-04):** `tablaNw.invalidas` conserva textos inválidos por clave de celda (`tabla.js:40–49`). `estadoValidacionNorthwest()` cuenta todas las claves (`app.js:64–68`), pero quitar origen/destino elimina datos/costos sin purgar errores de esas celdas (`app.js:31–45`; `modelo.js:70–79`). Secuencia deducida: introducir texto inválido, confirmarlo, eliminar su origen cuando queda otro, completar las demás celdas. El error ya no es editable en la tabla, pero sigue bloqueando balanceo. Cargar ejemplo/importar/limpiar vacía el registro; no equivale a una recuperación normal desde las celdas restantes. Debe purgarse por IDs vigentes o validarse solo claves existentes.

También hay riesgo P de perder foco por reemplazo completo de tabla al confirmar un valor (`app.js:104–106,320–334`; `tabla.js:40–51`), compartido conceptualmente con Asignación. No se verificó en navegador.

### 6.4. Persistencia y complejidad

`northwest.v1` conserva versión, modelo y vista, sin resultado/pasos/paso actual/historial (`estado.js:21–52`). Los trabajos nombrados sí pueden solicitar regenerar resultado y recuperar paso. JSON de ejercicio explica escalado de costos ×100; importación valida antes de reemplazar, máximo 1 MiB (`app.js:368–409`). El lector de archivos no tiene `onerror` específico: mejora menor de diagnóstico, no evidencia de archivo corrupto aceptado.

La decisión noroeste toma O(m+n), pero cada paso copia matriz completa (`noroeste.js:101–103`): conservar el procedimiento eleva tiempo/memoria a O(mn(m+n)), además del recorrido O(mn) de costos/verificación. La comprobación de base sin ciclos puede añadir O((m+n)²). Con límites actuales, hasta 10×11/11×10 balanceado y como máximo 20 pasos. Rendimiento/legibilidad del máximo son NC.

## 7. Ordenamiento: revisión de cada método

### 7.1. Contrato y reproducción compartidos

La UI admite **3–200 enteros de 1 a 99**, incluidos duplicados (`estado.js:4`; `ordenamiento.html:74–79`). Cero, negativos y decimales se rechazan: es límite del producto, no de los algoritmos. Los motores puros contemplan vacío/un elemento, pero la UI no los ofrece. `analizarValoresOrdenamiento()` valida tokens completos, con coma, espacio o punto y coma como separadores (`algoritmos.js:493–505`); una coma no es separador decimal: `1,5,8` son tres enteros.

Los cinco métodos ordenan **solo ascendente**. No se encontró opción de descendente. Cada elemento `{id,valor}` tiene identidad distinta aun con valores repetidos, permitiendo seguir estabilidad. Se carga lista/aleatorio, elige método, prepara eventos y reproduce o navega por deslizador/inicio/fin. Cambiar datos o método limpia registro/estadísticas/auxiliares y descarta preparación anterior mediante versión (`app.js:91–138,385–390`).

### 7.2. Selection Sort

`generarSelectionSort()` (`algoritmos.js:186–231`) busca el mínimo del sufijo, intercambia solo si corresponde y fija prefijo. Θ(n²) comparaciones en cualquier orden; O(n) intercambios; auxiliar puro O(1) aparte de copia/lista de datos. No estable: intercambiar extremos puede cambiar orden relativo de iguales. Para n=200 hace 19900 comparaciones. Los pasos distinguen mínimo actual, comparación, intercambio y pasada, con posiciones definitivas.

### 7.3. Insertion Sort

`generarInsertionSort()` (`233–269`) toma clave y la mueve por intercambios adyacentes ante `>`; conserva iguales y es estable. Mejor O(n), peor O(n²), auxiliar puro O(1). Distingue prefijo ordenado de posiciones definitivas. El pseudocódigo presenta desplazamiento convencional y la ayuda aclara la representación por intercambio con la clave (`ordenamiento.html:215`). Los conteos corresponden a esa implementación animada, no necesariamente a asignaciones de otro pseudocódigo.

### 7.4. Bubble Sort

`generarBubbleSort()` (`271–316`) compara vecinos, intercambia ante `>`, fija máximo al final y termina si una pasada no cambia nada. Estable; mejor O(n), peor O(n²); auxiliar puro O(1). Los eventos muestran comparación/intercambio y frontera final. Igualdad no provoca un intercambio artificial.

### 7.5. Shell Sort

`generarShellSort()` (`318–359`) usa saltos floor(n/2), mitades sucesivas hasta 1 e inserción/intercambio dentro de grupos; no fija posiciones definitivas antes del final. No estable. Para esta secuencia el peor tiempo es O(n²); la complejidad depende de saltos y no debe atribuirse una garantía universal O(n log n). Auxiliar de explicación incluye grupos/índices.

**Error de índices confirmado (H-07):** el panel auxiliar recibe grupos de posiciones reales, por ejemplo [0,4,8], pero `renderPinosAuxiliares()` etiqueta `(inicio||0)+indice`, produciendo 0,1,2 (`app.js:189–205,214–217`). Los datos pueden estar ordenándose con el grupo correcto mientras su explicación muestra índices erróneos. Deben pasarse/rotularse las posiciones reales, incluidas etiquetas accesibles.

### 7.6. Merge Sort

`generarMergeSort()` (`361–431`) divide recursivamente, mezcla mitades en auxiliar y copia cada segmento de vuelta. Usa `<=` para preferir el izquierdo en igualdad: estable. Núcleo O(n log n), auxiliar O(n), pila O(log n). Registra divisiones/mezclas y auxiliar. Sus «movimientos» incluyen escrituras auxiliares y vuelta al arreglo: no son directamente comparables con «intercambios» de Selection o Bubble sin explicar la métrica.

Ejemplo manual compartido: [3a,1,3b] termina [1,3a,3b] en Insertion/Bubble/Merge por estabilidad; Selection/Shell no prometen conservar orden de iguales para todas las entradas. Las letras simbolizan IDs, no valores admitidos en el campo numérico.

### 7.7. Registro de pasos: costo real y rendimiento máximo

`crearRegistro()` guarda eventos compactos, cambios por ID, rangos ordenados, diferencias de auxiliar y checkpoint cada 128 eventos (`algoritmos.js:102–158`). `obtenerPasoOrdenamiento()` materializa el paso solicitado desde el checkpoint anterior, aplicando hasta 127 eventos de diferencias, que pueden contener varios cambios cada uno (`160–184`). Merge comparte catálogos de IDs mediante WeakMap; API grande indexada por Proxy evita almacenar cada snapshot completo (`467–480`). Hay trabajo específico de escala, no una copia ingenua de n elementos por todo evento.

Sin embargo, instrumentar tiene costo adicional:

| Método | Núcleo | Preparación explicativa deducida |
| --- | --- | --- |
| Selection / Insertion / Bubble | Θ(n²), O(n²), O(n²) peores | Construir/copiar/comprimir posiciones ordenadas añade O(n) en muchos eventos; peor puede llegar a O(n³). |
| Shell | Peor O(n²) con estos saltos | Grupos, índices y textos añaden trabajo proporcional a su tamaño; no asumir costo del núcleo como costo total. |
| Merge | O(n log n) | Revisa auxiliar completo para detectar cambios (`141–147`); con eventos O(n log n), puede añadir O(n² log n). |

Con P eventos y checkpoint cada K=128, memoria incluye O(P + n·ceil(P/K)) más datos auxiliares y textos, cuyas longitudes importan. Consultar un paso copia/materializa O(n) y reproduce diferencias de ≤127 eventos; no vuelve a ordenar todo.

`prepararOrdenamiento()` cede tras 256 eventos o unos 8 ms entre comprobaciones y permite cancelación (`448–465`). Está en el hilo de interfaz: un evento largo puede superar esa duración; no hay worker ni garantía rígida de 8 ms. Solo se publica historial completo de la revisión vigente. Más de 12 elementos se dibujan como barras con desplazamiento interno; se reutiliza DOM por ID y hay selección por teclado (`dibujo.js:28–67,106–159`). El mapa reduce a 120 marcas, el deslizador llega a cualquier evento.

Reproducción: 120/300/650/1200 ms **por evento**, distinta del tiempo de cálculo (`estado.js:5`; `app.js:323`). Un inverso de 200 puede generar decenas de miles de eventos. El archivo histórico `docs/cierre-medicion-ordenamiento.json` registra 40093 para Insertion/Bubble; a 120 ms, unos 80 minutos. Ese archivo **no se regeneró**, no mide el navegador actual ni certifica tiempos presentes. Inicio/Fin y deslizador ya permiten saltar; conviene duración estimada o reproducción resumida (H-14), no aumentar sin evidencia el máximo de 200.

### 7.8. Persistencia y vigencia

`ordenamiento.v1` guarda método, valores originales, paso y velocidad; regenera registro al restaurar y empieza pausado (`estado.js:30–58`; `app.js:295–303`). No persiste miles de eventos. Invoca guardado sincrónico en cada paso (`app.js:291`): un guardado diferido sería mejora opcional si mediciones lo justifican. Formatos incompatibles conservan original. No se observó por lectura una publicación del resultado viejo durante una preparación nueva, sin certificar todas las carreras en ejecución.

## 8. Árboles binarios

### 8.1. Alcance, entradas y operaciones

Admite hasta **31 nodos**, enteros de −999 a 999, incluido cero; rechaza duplicados/decimales (`config.js:44–47`; `validacion.js:3–25`). Vacío representa árbol sin nodos. El generador comprueba rango inclusivo y capacidad para suficientes valores únicos y mezcla su orden (`modelo.js:52–71`; `validacion.js:62–80`).

Modo de inserción BST: `insertarNodoArbol()` compara valores, recorre izquierda/derecha, devuelve camino y rechaza duplicado sin mutación (`modelo.js:8–24`). No es AVL/red-black: datos crecientes/decrecientes pueden producir 31 niveles. La interfaz impide insertar sobre un árbol reconstruido general, que puede no satisfacer BST (`app.js:191–200`).

**No hay búsqueda por valor ni eliminación arbitraria ofrecidas al usuario.** `buscarRelacionArbol()` es una búsqueda DFS interna para consultar el nodo seleccionado, no una operación didáctica de buscar clave (`app.js:29–32`). «Deshacer» quita la última inserción y reconstruye desde la secuencia restante; vaciar elimina todo (`271–277`). No implementa los casos de eliminación de hoja/un hijo/dos hijos ni rehacer general. La ayuda lo declara (`arboles.html:174`): es alcance funcional, no un fallo escondido. Ampliarlo es opcional según requisitos finales (H-17).

### 8.2. Recorridos, reconstrucción y errores

`recorridosArbol()` genera preorden/inorden/postorden (`modelo.js:38–49`). Animación: dos eventos por nodo, visitar y emitir, para explicar cuándo entra en la salida (`app.js:83–95`). Cambiar árbol detiene reproducción, limpia selección/camino y reconstruye historial (`149–160`).

Reconstruye árbol binario general con preorden+inorden (`reconstruccion.js:7–24`) o inorden+postorden (`26–43`). Con tres recorridos verifica también el tercero (`45–93`). La opción preorden+postorden solicita inorden adicional y explica ambigüedad (`arboles.html:97,115`; `app.js:203–228`). Exige longitudes/conjuntos coincidentes y sin repetidos; valida segmentos y vuelve a comparar recorridos. Una entrada incompatible conserva árbol/campos anteriores (`236–247`).

Ejemplo manual: preorden [2,3,1] e inorden [3,2,1] reconstruyen raíz2, hijo izquierdo3 y derecho1. Es árbol binario válido y **no BST**: la reconstrucción no debe forzarlo a ordenarse por valor. Preorden+postorden solos no determinan en general si un hijo único es izquierdo o derecho.

### 8.3. Dibujo, estado y complejidad

SVG asigna x por posición inorden e y por profundidad, evitando anchura exponencial; usa scroll, zoom, centrar/ajustar (`dibujo.js:36–51`). Nodos seleccionables con teclado conservan foco al redibujar y describen padre/hijos/raíz/hoja (`85–109`). Con 31 niveles puede requerir mucho desplazamiento; no se observó el resultado visual. `css/arboles.css:22–36` contiene el área con overflow/altura máxima.

`arboles.v1` conserva secuencia BST o los tres recorridos del reconstruido, recorrido elegido y paso, no selección/zoom/velocidad (`estado.js:17–23`). Restaurar valida/reconstruye, acota paso y pausa (`app.js:175–189`). Guardado diferido 400 ms y vaciado de escritura pendiente al ocultar/salir (`estado.js:34–60`).

Aunque buscar el punto de inserción cuesta O(h), cada alta cuenta todos los nodos mediante recorrido (`modelo.js:18`): inserción exitosa O(n), aun si equilibrado; construir n altas O(n²). Recorridos O(n), pila O(h); núcleo de reconstrucción con Map O(n), pero validación `filter/includes` eleva reconstrucción validada a O(n²) (`reconstruccion.js:62–74`). Registro de recorrido O(n), sin snapshots completos de árbol por evento; disposición geométrica O(n), dibujo hasta O(n²) por búsquedas `includes` de camino/visitados para cada nodo/arista (`dibujo.js:68,80,83`). No atribuir O(log n) a la operación actual ni prometer balanceo.

## 9. Lógica difusa: sistema Mamdani configurable

### 9.1. Problema, arquitectura y entradas

Produce una recomendación gradual a partir de valores de entrada, pertenencias y reglas, con inferencia Mamdani tipo 1. Hay cinco vistas: inicio/ejemplos, variables, reglas, evaluar y procedimiento/resultado (`logica-difusa.html:32–78`). Incluye ejemplos de ayuda, propina y ventilación, además de una plantilla que deja una decisión pendiente. Los ejemplos se presentan como didácticos, sin calibración para decisiones reales.

`motor.js` calcula; `modelo.js` define esquema/validación/ejemplos/firma; `estado.js` aplica cambios y persiste; `editor.js` maneja borradores; `dibujo.js` crea SVG; `mapa.js` muestrea; `app.js` conecta vistas, acciones y resultados. El motor conserva además API del ejemplo fijo anterior; la página usa el sistema configurable.

Límites confirmados en `js/difusa/modelo.js:4–12,36–75,106–170`:

| Elemento | Contrato actual |
| --- | --- |
| Entradas/salida | 1–3 entradas y exactamente una salida. |
| Conjuntos | 2–5 por variable, triangulares o trapezoidales. |
| Reglas | 1–125; AND/OR, peso real en [0,1], habilitada/deshabilitada. |
| Dominios/parámetros | Finitos dentro de ±1000000; mínimo menor que máximo; parámetros dentro del dominio. |
| Curvas | Tres/cuatro parámetros en orden no decreciente; soporte de anchura positiva. Hombros permitidos; conjuntos puntuales no. |
| Nombres/IDs | Nombres de 1–40 caracteres, unidades hasta 40, descripción hasta 4000; IDs hasta 64 con formato restringido, unicidad y rechazo de nombres peligrosos de propiedades. |

`leerNumero():13–23` admite punto o coma decimal y notación científica; rechaza vacíos, formatos ambiguos/texto parcial y no finitos. Los ceros y negativos son válidos cuando pertenecen al dominio: no son costos de transporte ni pesos Dijkstra. La API antigua `motor.validarEntrada()` tiene contrato distinto, 0–10 con punto decimal; no debe confundirse con el editor configurable.

### 9.2. Inferencia efectivamente implementada

Para un triángulo `[a,b,c]`, la pertenencia sube linealmente de a a b y baja de b a c; fuera del soporte es 0 y en b es 1. Para un trapecio `[a,b,c,d]`, sube a–b, vale 1 en [b,c] y baja c–d. Se comprueba el pico/meseta antes de dividir: hombros triangulares a=b o b=c y trapezoidales a=b o c=d conservan pertenencia 1 en el extremo sin división por cero (`motor.js:56–72`).

Cada antecedente referencia un conjunto por ID; `null` significa «No importa» y se excluye del conector. Debe quedar al menos un antecedente utilizado. Para la regla r:

`βr = min(pertenencias utilizadas)` con AND, o `max(...)` con OR; `αr = peso × βr` si está habilitada y 0 si está deshabilitada. La implicación recorta la salida con `μr(y)=min(αr,μconsecuente(y))`; la agregación es `μag(y)=maxr μr(y)` (`motor.evaluarSistema():251–267`). No usa producto como implicación ni suma como agregación.

Una regla habilitada con consecuente pendiente impide evaluar. Deshabilitada puede conservar consecuente `null`; referencias inexistentes siguen siendo errores estructurales. Generan avisos las reglas con igual conector, antecedentes, consecuente y peso, o con igual conector/antecedentes y distinto consecuente; compartir antecedentes por sí solo no siempre genera aviso (`modelo.js:149–191`).

Se evalúan **1001 puntos uniformes**, incluidos ambos extremos: `yi = min + (max-min)i/1000`. El centroide es discreto: `Σ yi μag(yi) / Σ μag(yi)`; no hay integración analítica ni redondeo intermedio (`motor.js:115–131,243–249`). Si la masa muestreada es cero se devuelve `valor:null`. La presentación redondea, pero conserva las sumas para explicar el cociente.

La etiqueta interpretativa se obtiene de las pertenencias de salida en el centroide; se conservan etiquetas empatadas con tolerancia relativa. Si el centroide cae en un hueco entre conjuntos, se mantiene el número y se informa ausencia de etiqueta (`motor.js:269–276`). El registro explicativo guarda siete etapas: datos, fuzzificación, reglas, implicación, agregación, centroide e interpretación (`278–300`).

Ejemplo de ayuda (`modelo.js:260–268`): familiaridad y dificultad en [0,10], Baja trapecio [0,0,2.5,5], Media triángulo [2.5,5,7.5], Alta trapecio [5,7.5,10,10]. Salida [0,100]: Breve [0,0,20,40], Intermedia [20,50,80], Detallada [60,80,100,100]. Las nueve reglas AND/peso 1 son:

| Familiaridad \ Dificultad | Baja | Media | Alta |
| --- | --- | --- | --- |
| Baja | Intermedia | Detallada | Detallada |
| Media | Breve | Intermedia | Detallada |
| Alta | Breve | Breve | Intermedia |

Deducción manual: entradas (5,5) activan Media/Media→Intermedia; por simetría la salida queda alrededor de 50. Los hombros y las nueve combinaciones evitan huecos de activación en ese ejemplo, sin demostrarlo para modelos editados. Propina usa servicio/comida [0,10], salida [0,30] %, nueve reglas; ventilación temperatura [0,40] °C, salida [0,100] %, tres reglas (`269–282`).

### 9.3. Flujo, cobertura y estado

Se elige ejemplo o plantilla; se editan variables/reglas en borradores; se aplican solo si son válidos; se introducen valores; se evalúa; procedimiento y SVG consumen el mismo resultado registrado. La cobertura de pertenencias se calcula con nudos y puntos medios de los intervalos lineales, detectando huecos estrechos y extremos abiertos/cerrados (`modelo.cobertura():78–103`). Cobertura de curvas no demuestra cobertura de reglas: se permite un sistema parcial con avisos.

La firma matemática incluye IDs, dominios, curvas, reglas, conectores y pesos; ignora nombres, unidades, descripción y orden (`modelo.js:241–248`). Al aplicar, los valores aún válidos se conservan y los que quedan fuera se vuelven `null`, sin recortarlos al dominio (`estado.js:166–190`). Cambiar matemática invalida resultado, selección y mapa e incrementa revisión; renombrar conserva cálculo y actualiza descripciones. Editar un campo numérico del borrador ya invalida; cancelar recupera modelo aplicado, pero exige recalcular el resultado invalidado. Una entrada de evaluación inválida conserva el último valor numérico válido, agrega error e impide evaluar hasta corregir (`estado.js:159–165,192–230`).

Eliminar entradas/conjuntos muestra reglas afectadas y ajusta referencias mediante acción explícita. Generar combinaciones produce el producto cartesiano de conjuntos y deja consecuentes pendientes, hasta 5³=125 (`editor.js:154–169,217–219`; `modelo.js:216–237`). **Hay un error de recuperación:** con un borrador de variable inválido, «Generar combinaciones» llama a una función que lanza sin captura local; la promesa queda rechazada sin mensaje específico. El modelo aplicado no se sustituye (H-08).

### 9.4. SVG, mapa y complejidad

Los SVG muestran curvas, pertenencias, recorte de regla, agregación y centroide; hay consulta de una de las 1001 muestras (`dibujo.js:9–52`; `app.js:91–151`). El mapa es bajo petición: 101 puntos con una entrada; 15×15=225 con dos; con tres usa dos ejes y fija la restante. Incluye extremos, marca salidas nulas con cruces y conserva coordenadas/resultado, no todos los recortes. Trabaja de dos puntos por lote y cancela por nueva generación, edición, ejes/fijo, apertura del video o acción del usuario; comprueba firma y revisión (`mapa.js:4–44`; `app.js:49–55,153–186`). Es exploración muestreada, no prueba de cobertura exhaustiva.

Con V entradas, C conjuntos por variable, R reglas y S=1001: evaluación `O(VC + SCsalida + RV + RS)`, dominada por `O(RS)`. Memoria `O(RS + SCsalida + RV)` porque guarda un recorte por regla para explicarlo: hasta 125125 valores de recorte por evaluación. El mapa cuesta `O(P·R·S)` y hoy usa evaluación explicativa completa/revalidación en cada punto aunque solo conserve el centroide (`mapa.js:35`). En el máximo de 225 puntos construye a lo largo del proceso 28153125 valores de recorte; no simultáneamente. La latencia efectiva es NC. Separar cálculo escalar y explicativo sería una optimización localizada si se justifica por medición (H-11).

### 9.5. Problema de discretización y límites de interpretación

**Deducción manual, no ejecutada:** salida [0,100] muestrea 0,0.1,0.2,… Un consecuente triangular [0.01,0.02,0.03] pasa la validación de soporte y parámetros. Con activación 1 y sin otro aporte, todas las muestras son cero aunque la regla esté activa; el centroide continuo del triángulo es 0.02. El modelo puede tener un segundo conjunto sin reglas habilitadas hacia él para cumplir el mínimo de dos.

El motor devuelve `null` y estado «sin-reglas-activas», y UI/Algo lo explican como ausencia de activación (`motor.js:128–129,244–268`; `app.js:133,200`; `asistente-contexto.js:618`). Es un fallo numérico/de diagnóstico para modelos válidos estrechos, no una prueba de que todos los ejemplos fallen (H-03). Debe distinguirse activación cero de masa muestreada cero y decidir resolución adaptativa o integración por tramos. Si se usa malla no uniforme, hay que ponderar la integración; agregar nudos y conservar el cociente de sumas uniformes no basta. Un aviso de resolución mejora el diagnóstico, pero no recupera por sí solo el centroide omitido.

### 9.6. Persistencia, importación y comparación externa

Usa autoguardado `logica-difusa.v2`, anterior `logica-difusa.v1` y biblioteca `logica-difusa.trabajos.v2`. Guarda modelo, valores y vista, no resultados/recortes/mapas (`estado.js:5–11,44–54,101–109`). La migración recupera entradas válidas del ejemplo v1 y conserva la clave original. El trabajo tiene tipo `ciudad-logica-difusa-trabajo`, versión 2; valida íntegramente antes de reemplazar y distingue documento de comparación. La interfaz limita archivos a 1000000 bytes y la API texto JSON a 1000000 unidades UTF-16 (`string.length`): no es exactamente el 1 MiB común (`app.js:245–254`; `estado.js:71–99,288–293`). Protege originales incompatibles y trata fallos de almacenamiento; biblioteca de hasta 50 trabajos (`313–366`).

El JSON de comparación configurable agrega solo caso actual y valores iniciales, que pueden ser duplicados al abrir un ejemplo (`app.js:261–264`). No representa por sí solo una validación general (H-12). Los scripts de MATLAB describen equivalencia con operadores y discretización de 1001 puntos, con tolerancia absoluta 1e-8; esa tolerancia compara la misma discretización, no error respecto al centroide continuo (`matlab/validar_sistema_difuso.m:47–105,121–139`). La interfaz dice «Comparación con MATLAB pendiente» (`logica-difusa.html:78`). Ni MATLAB ni Fuzzy Logic Toolbox se ejecutaron aquí.

La inspección detallada del mapa depende de títulos SVG sin tabla alternativa completa ni foco por celda (`dibujo.js:62–86`). La limitación estructural está confirmada; experiencia real con tecnología asistiva NC (H-13).

## 10. Estado, persistencia, importación y exportación compartidos

### 10.1. Guardados y recuperación

`js/config.js:33–43` define claves separadas para Johnson, su biblioteca histórica, Asignación v1/v2, Northwest, Árboles, Ordenamiento, Dijkstra y Kruskal, más `algoritmos.trabajos.v1` para trabajos nombrados. El límite común es 50 trabajos por módulo; Johnson tiene además hasta 30 grafos históricos. La biblioteca común acepta nombres de hasta 60 caracteres y conserva una copia JSON de los datos (`guardados.js:8–38,66–83`). Guardar el mismo nombre en un módulo reemplaza ese trabajo mediante confirmación en la interfaz; renombrar comprueba colisiones; eliminar un trabajo no elimina el ejercicio en memoria.

`escribirAlmacenamientoLocal()` captura almacenamiento bloqueado/lleno y muestra un aviso persistente, que se retira tras una escritura posterior exitosa (`utilidades.js:51–68`). El helper común `protegerGuardadoIncompatible()` conserva el texto original sin sobrescribirlo y bloquea escrituras de esa clave hasta la recuperación explícita (`87–115`). Ofrece descargar original y después usar ejercicio actual; esto habilita la próxima escritura, no guarda inmediatamente. Difusa utiliza su recuperación propia e intenta persistir inmediatamente al respaldar/descartar el original (`difusa/estado.js:296–307`). Se comprueba que se inició la descarga, no que el archivo terminó de guardarse en disco. La protección es una buena medida de recuperación por lectura, sin certificar su experiencia de uso en navegador.

`leerTrabajos()` verifica estructura básica, máximo global de 1000 registros e IDs distintos; si el contenedor es incompatible, devuelve lista vacía y protege el original (`guardados.js:198–207`). No valida profundamente todos los modelos al listar: esa validación se realiza al importar/cargar en el módulo correspondiente. La biblioteca histórica de Johnson permite ver/exportar un grafo incompatible pero impide cargarlo (`almacenamiento.js:183–208`).

### 10.2. Documentos y versiones

La biblioteca común exporta `{version:1,tipo:'trabajos',modulo,fecha,trabajos}` y acepta también arrays históricos. La importación fusiona con IDs nuevos y nombres libres; valida toda la importación antes de añadir, incluso los trabajos que no entren por cupo (`guardados.js:99–173`). Los tipos/versiones de cada ejercicio son distintos: Johnson 1.0 cuando hay envoltorio, Dijkstra/Kruskal 1, Asignación 2 con migración desde 1, Northwest 1, Ordenamiento 1 y Árboles 1; algunos formatos históricos sin versión se admiten expresamente. Lógica difusa tiene su propio documento/biblioteca v2 y migración específica, descritos en su sección.

Las importaciones de archivos limitan habitualmente a 1 MiB en la interfaz; difusa utiliza 1000000 bytes. Usan JSON.parse y validadores antes del reemplazo. No basta con que el JSON sea sintácticamente válido. En grafos se comprueban IDs repetidos, referencias y coordenadas; en matrices, dimensiones, IDs y valores; en árboles, secuencias/recorridos; en difusa, variables/conjuntos/reglas y sus referencias. Los cambios de nombres se basan principalmente en IDs estables; eliminar entidades purga sus relaciones del modelo, aunque hay un fallo de estado visual de validación en Northwest (H-04).

La carga nombrada de Asignación y Northwest valida que un trabajo que declara resultado vigente sea calculable antes de aplicar su modelo; luego recalcula y acota el paso (`guardados.js:271–320`). Johnson elimina resultado y selección al cargar (`258–269`). Dijkstra/Kruskal usan su validador de documento tanto para archivos como para trabajos (`46–50,252–255`). No se leen ni confían resultados de usuario como si ya estuvieran verificados.

**Distinción entre modelo y texto inválido (H-19):** en Asignación/Northwest, un texto rechazado se conserva en `invalidas` sin cambiar el valor previo del modelo ni su firma (`asignacion/matriz.js:140–147`; `northwest/tabla.js:40–47`). Sus funciones `resultadoVigente...()` solo consultan el resultado y su bandera, por lo que Resultado puede seguir presentando el cálculo anterior como vigente (`asignacion/estado.js:236–237`, `resultado.js:54–61`; `northwest/estado.js:134–135`, `app.js:240–241,326`). Algo, en cambio, exige además que no haya claves inválidas (`asistente-contexto.js:264–266,289–291`). El cálculo anterior sigue correspondiendo al último modelo válido, pero la interfaz y la ayuda no usan la misma definición de vigencia durante una edición inválida. Conviene rotularlo «resultado del último dato válido; hay cambios pendientes» o acordar invalidación uniforme. El recorrido visual concreto permanece NC.

**Fallo de nombres importados:** `nombreLibreTrabajo()` añade ` (2)` sin limitar de nuevo a 60 caracteres (`guardados.js:54–59`). Si ya existe un trabajo con nombre de 60 caracteres y se importa otro homónimo válido, se guarda un nombre de 64. En la siguiente lectura `esTrabajoValido()` lo rechaza y `leerTrabajos()` protege la biblioteca completa como incompatible (`14–15,165–169,203–207`). No se pierde físicamente el original por ese camino, pero desaparece la lista normal hasta recuperar. Debe reservarse espacio para el sufijo y validar el resultado antes de escribir (H-05).

### 10.3. Exportación gráfica y procedimientos

Los módulos con SVG integran `exportarSvgComoPng()`: clona dibujo, copia estilos calculados, normaliza referencias de marcadores, serializa, rasteriza en canvas y descarga PNG al doble de resolución por defecto (`exportarImagen.js:23–39,54–102`). Exporta el SVG y su encuadre actual; no es una captura integral del sitio ni garantiza que todos los elementos del modelo estén dentro del encuadre. Se propagan fallos de rasterización. Árboles y Ordenamiento trasladan ejercicios principalmente mediante trabajos nombrados; no todos los módulos ofrecen los mismos botones JSON/PNG.

`impresion.js` registra constructores de pasos y arma contenido temporal para `window.print()` donde se integra. El navegador decide el destino de impresión/PDF; no se genera un PDF matemático independiente. Tablas, colores, recortes y estilos de impresión necesitan revisión visual posterior. No se realizó exportación o impresión durante esta auditoría.

### 10.4. Sincronización y concurrencia

Los módulos usan invalidación, firmas o revisión según el caso; no existe un único almacén global para toda la ciudad. Algo vuelve a tomar una fotografía del estado activo, no una base central de resultados. Inicio escucha eventos `storage` y `pageshow` para refrescar trabajos comunes (`inicio.js:295–296`). No se encontró un protocolo de resolución de conflictos de ejercicios entre pestañas: dos instancias que escriban la misma clave pueden reemplazarse por última escritura. Se registra como riesgo P si el uso en varias pestañas es un requisito; no se observó una pérdida real ni se propone añadir sincronización remota por defecto.

## 11. Experiencia de usuario, accesibilidad y responsive desde el código

### 11.1. Facilidades presentes

Hay ejemplos, estados vacíos, instrucciones por vista, mensajes de validación, acciones de resolver deshabilitadas según datos y navegación por pasos. Northwest indica expresamente que ofrece una solución inicial factible y no garantiza el óptimo (`catalogo.js:155–157`). Kruskal tiene terminología de árbol/bosque en el catálogo. Los controles y las restricciones concretas deben interpretarse por módulo; por ejemplo, que Johnson rechace inversas no es una regla matemática universal de grafos.

`styles.css` define foco visible, tablas con desplazamiento, tamaños táctiles y variantes de tema; `css/shell.css` ajusta barra lateral a 1024 px y cabeceras/diálogos a 640 px. Ciudad tiene cambios a 1279/767 px y movimiento reducido (`css/ciudad.css:196–255`). Los módulos agregan sus propios puntos de corte. Las tablas conservan anchuras mínimas; por ello el desplazamiento horizontal interno es parte del diseño y debe revisarse con matrices máximas. `body` oculta desbordamiento horizontal (`styles.css:211`), lo que podría ocultar un error de ancho en vez de hacerlo evidente; su incidencia es P, no observación en pantalla.

El sistema común de foco registra una pila, recicla Tab, cierra con Escape y restaura foco (`dialogo.js:15–62`), usado por ayudas, bibliotecas y menú móvil. Hay etiquetas ARIA, roles de alert/status y varios accesos por teclado. Esto acredita implementación de apoyos, **no conformidad completa de accesibilidad**. SVG editables y controles de dibujo requieren revisión con teclado/lector de pantalla, especialmente cuando la interacción depende de posición o arrastre.

### 11.2. Límites y comprobaciones visuales pendientes

- Grafos: distribución densa, aristas cruzadas, etiquetas de pesos y nombres máximos, nodos T grandes, zoom y exportación. Existen curvas/ajustes, pero no un algoritmo general que garantice ausencia de solapamientos.
- Tablas: 8×8 de Asignación y 10×10 más ficticio de Northwest, foco y desplazamiento en móvil. Una anchura mínima no equivale a un defecto si se ofrece desplazamiento usable.
- Ordenamiento: hasta 200 elementos y decenas de miles de eventos; legibilidad y duración de reproducción requieren medición/revisión, distinta del tiempo de preparar el cálculo.
- Árboles: árbol muy sesgado de 31 niveles y reconstrucciones generales; comprobar encuadre, nombres y exportación.
- Difusa: formularios de tres entradas/cinco conjuntos/125 reglas, curvas estrechas, etiquetas y accesibilidad del mapa.
- Transversales: 320/360/768/1024 px, orientación horizontal, zoom de texto 200 %, teclado virtual, temas claro/oscuro, contraste medido, diálogos superpuestos, restauración de foco y exportaciones.

Estos son escenarios de aceptación futuros, no capturas observadas. No se afirma que actualmente todo se desborde ni que todo sea legible. Hay inconsistencia textual confirmada: la ayuda de inicio aún dice «siete edificios» aunque el catálogo tiene ocho (`inicio.js:285`). Además, los trabajos de difusa no aparecen entre los recientes del inicio porque este lee únicamente la biblioteca común que excluye ese módulo (`guardados.js:8`; `inicio.js:253`); su biblioteca propia sí existe. Son ajustes de integración, no inexistencia del módulo.

### 11.3. Ayuda local Algo

La cadena es `asistente-contexto.js` → `conocimiento/base.js` y siete archivos de contenido → `asistente-motor.js` → `asistente.js`, en orden de scripts. La base cubre conceptos, ocho módulos, uso, diagnóstico y ejercicio actual. El motor normaliza tildes/abreviaturas/sinónimos, puntúa variantes y conceptos con pesos de frecuencia, tolera algunas erratas y aplica afinidad de módulo (`asistente-motor.js:13–137`). Mantiene un tema reciente y niveles de explicación en memoria; no guarda conversación ni llama a red. Es ayuda determinista preparada, no un modelo generativo ni un solucionador adicional.

Acepta preguntas de hasta 1200 caracteres; ante puntuación insuficiente admite falta de cobertura; ante dos candidatos aceptables separados por menos de 7 puntos pide aclaración (`554–600`). Ofrece explorador y búsqueda de hasta 12 resultados (`531–535`), ejemplos y seguimientos. Estas puntuaciones son heurísticas, no probabilidades de exactitud: frases nuevas, negaciones, preguntas compuestas o ambiguas pueden recibir la entrada equivocada. La calidad de reconocimiento actual es NC hasta ejecutar casos independientes.

El contexto lee solo el módulo de la página y verifica vigencia/firma donde corresponde. Limita por ejemplo a 40 nodos/50 aristas y reduce arrays si su serialización supera aproximadamente 10000 caracteres; agrega avisos de datos omitidos (`asistente-contexto.js:118–145,441–461`). Por ello no debe deducir una solución completa de una muestra. El motor informa las omisiones en respuestas dinámicas (`asistente-motor.js:423–439`) y no tiene el estado de otro módulo aunque se lo mencione.

El panel se actualiza con MutationObserver e inputs; una respuesta ya escrita permanece como conversación histórica con referencia de módulo/vista/paso, no se reescribe al editar datos (`asistente.js:77–106,151–170,257–267`). Para conocer el nuevo resultado hay que volver a preguntar. Cambios en el contexto o invalidación de resultados impiden usar el resultado anterior como vigente en una nueva respuesta, sujeto a cada adaptador.

Hay Enter/Mayús+Enter, manejo de composición, Escape, roles de conversación y estados; en móvil aplica `inert`, bloqueo de fondo, foco y ajustes de `visualViewport` (`asistente.js:109–140,333–376`; `css/asistente.css:31,79`). El foco de Algo es un sistema separado del modal común: conviene comprobar la coexistencia de diálogos, sin afirmar un fallo reproducido. La cobertura de difusa está integrada pero hereda el problema semántico de llamar «sin reglas activas» a toda masa cero.

## 12. Hallazgos priorizados

Las filas **L** describen evidencia estática concreta; la reproducción de interacciones sigue pendiente. **P** indica impacto aún por comprobar. No se identificó evidencia que justifique clasificar un hallazgo como crítico durante esta revisión. Eso no certifica ausencia de errores críticos no observados.

| ID | Módulo | Problema o mejora / clase | Evidencia: archivo, función y línea aproximada | Condición | Consecuencia para el usuario | Gravedad | Certeza | Solución propuesta | Esfuerzo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H-01 | Johnson / Dijkstra rápido | Funcionamiento/estado: visualización incompatible con detalle Johnson. | `js/dijkstra.js`, `ejecutarDijkstra`, 191–200; `js/johnson/vistas.js`, `construirConsultaDetalleJohnson`, 936, `dibujarResultadoJohnson`, 992. | Resolver Johnson, ver editor, ejecutar Dijkstra rápido, volver a Resultado. | Posible TypeError y bloqueo del resultado; panel puede conservar detalle de otra visualización. | Alta | L: incompatibilidad y ruta identificadas; reproducción NC. | Aislar visualización rápida o limpiar/reconstruir consulta; validar tipo antes de leer valoresNodos. | Mediano |
| H-05 | Trabajos comunes | Funcionamiento/persistencia: sufijo de nombre importado excede límite permitido. | `js/comun/guardados.js`, `nombreLibreTrabajo`, 54–59; `fusionarTrabajosImportados`, 165–169; `leerTrabajos`, 203. | Importar homónimo de nombre ya usado con 60 caracteres. | Se escribe registro inválido; siguiente lectura protege/oculta biblioteca completa. Original permanece recuperable. | Alta | L, deducción determinista; ejecución NC. | Reservar longitud del sufijo, validar nombre final y lista completa antes de escribir. | Pequeño |
| H-02 | Johnson T | Interfaz/semántica matemática: destino repite objetivo elegido en ambos compartimentos. | `js/dibujo.js`, `dibujarCompartimentosNodoJohnson`, 200,244–274 y leyenda296; `vistas.js`, detalle, 933–936. | Mínimo y máximo distintos; objetivo único. | Grafo muestra 5\|5 o 9\|9 para un destino cuyos extremos son 5\|9, aunque el estado/tabla son correctos. | Alta | L; está declarado en leyenda, pero contradice contrato general. | Mantener mínimo/máximo reales; objetivo/costo elegido en indicador aparte. | Pequeño |
| H-09 | Distribución Netlify | Integración/entrega: copias estáticas desactualizadas. | Comparación SHA-256 de 100 fuentes públicas; `scripts/preparar-netlify.js`, PUBLICOS, 9–39. | Publicar manualmente public/drop existentes como si reflejaran raíz actual. | Se entrega otro Johnson: ocho archivos distintos y caminos.js ausente. Estado remoto NC. | Alta para la entrega final | L para diferencia; impacto de un despliegue concreto NC. | Tras corregir, regenerar por script, verificar inventario/paridad y revisar paquete antes de publicar. | Pequeño, después de correcciones |
| H-03 | Lógica difusa | Matemático/diagnóstico: consecuente válido puede desaparecer entre muestras uniformes. | `js/difusa/modelo.js`, revisarVariable, 66–74; `motor.js`, evaluarSistema/centroide, 128–129,244–268; `app.js`, resultado, 133,200. | Soporte estrecho entre puntos de la grilla, p. ej. triángulo [0.01,0.02,0.03] en [0,100]. | Devuelve null y «Sin reglas activas» pese a activación positiva y centroide continuo existente. | Media | L: deducción numérica explícita; ejecución NC. | Distinguir causa de masa cero; adoptar muestreo adaptativo/integración por tramos o contrato de resolución explícito y verificable. | Mediano; diagnóstico pequeño |
| H-04 | Northwest | Funcionamiento/validación: errores de celdas eliminadas quedan activos. | `tabla.js`, entradaNw, 40–49; `app.js`, quitarElementoNorthwest, 31–45 y estadoValidacionNorthwest64–68; `modelo.js`, eliminarElemento, 70–79. | Confirmar texto inválido y eliminar su origen/destino. | Balanceo bloqueado por celda inexistente; obliga a recargar/limpiar o restaurar la entidad para corregir. | Media | L; interacción NC. | Purgar invalidas por IDs vigentes al eliminar/restaurar; conservar errores de celdas existentes. | Pequeño |
| H-06 | Asignación | Interfaz/procedimiento: un solo ficticio y orden distinto a matriz realmente resuelta. | `matriz.js`, construirTablaAsignacion, 48–111; `hungaro.js`, resolverHungaro, 139–146; `procedimiento.js`, 58–78. | Matriz rectangular, especialmente diferencia >1. | Edición 2×5 muestra solo 3×5; procedimiento 5×5, índices visuales diferentes. No demuestra total incorrecto. | Media | L. | Derivar cantidad/orden de ficticios del mismo modelo de normalización que usa procedimiento. | Pequeño |
| H-07 | Shell Sort | Interfaz: índices auxiliares consecutivos en grupos separados por salto. | `js/ordenamiento/app.js`, renderPinosAuxiliares/actualizarAuxiliar, 189–217. | Grupo real como [0,4,8]. | Explicación muestra 0,1,2 aunque el cálculo trabaja posiciones distintas. | Media | L. | Pasar posiciones reales al render y ARIA. | Pequeño |
| H-08 | Editor difuso | Funcionamiento/recuperación: generar reglas sobre borrador inválido no trata excepción. | `editor.js`, acción generar combinaciones, 217–219; `modelo.js`, generarCombinaciones, 220–223. | Dejar nombre o mínimo vacío y generar combinaciones. | Acción sin mensaje específico; modelo aplicado conserva integridad. | Media | L para throw sin captura local; interacción NC. | Validar borrador antes y presentar errores/capturar excepción. | Pequeño |
| H-10 | Asignación / Northwest | Posible interfaz: reemplazar tabla al confirmar celda puede interrumpir foco. | `asignacion/matriz.js`, 140–159,203 y app97–99; `northwest/tabla.js`, 40–51 y app104–106,320–334. | Editar por teclado y avanzar entre celdas. | Foco perdido o salto que usa un nodo DOM ya sustituido. | Media si se reproduce | P; reemplazo confirmado, resultado de foco NC. | Reproducir; actualizar parcialmente o restaurar por IDs/selección. | Mediano |
| H-19 | Asignación / Northwest / Algo | Estado/presentación: vigencia diferente ante texto rechazado. | `asignacion/matriz.js`, change, 140–147; `asignacion/estado.js`, resultadoVigenteAsignacion, 236; `northwest/tabla.js`, 40–47, estado134; `asistente-contexto.js`, 264–266,289–291. | Resolver y después confirmar texto inválido sin aplicarlo al modelo. | Resultado puede seguir marcado vigente sobre datos previos, mientras Algo lo considera no vigente y la entrada mantiene error. | Media | L sobre contratos; interacción NC. | Explicitar resultado del último modelo válido o compartir criterio de vigencia/borrador pendiente entre vistas y ayuda. | Pequeño/mediano |
| H-18 | Verificación / CI | Cobertura: pipeline estándar omite suites específicas de difusa y asistente. | `package.json`, scripts test/test:difusa/test:asistente; `.github/workflows/pruebas.yml`, 15–16. | Ejecutar solo workflow actual, que llama lint y test. | Cambios de esos módulos pueden no atravesar sus suites específicas; no implica que hoy fallen. | Media | L sobre comandos declarados. | Integrar suites pertinentes en CI y cubrir máximos/T, transiciones y hallazgos nuevos. | Pequeño/mediano |
| H-11 | Mapa difuso | Mejora opcional de rendimiento: evaluación completa por punto. | `js/difusa/mapa.js`, generación, 35; `motor.js`, evaluarSistema, 220–300. | Hasta 225 puntos y 125 reglas. | Trabajo innecesario de recortes/pasos; latencia efectiva no medida. | Media potencial | L para costo, P para incomodidad real. | Medir; reutilizar modelo/curvas y evaluación escalar; considerar worker si sigue necesario. | Mediano |
| H-13 | Mapa difuso | Accesibilidad: detalle numérico principalmente en títulos SVG. | `js/difusa/dibujo.js`, mapa, 62–86. | Inspección por teclado/lector de valores de cada celda. | No hay tabla alternativa completa ni navegación propia por celda. | Media | L estructural; experiencia NC. | Tabla o consulta de celda navegable con salida textual. | Mediano |
| H-12 | Comparación difusa | Mejora de validación: solo caso actual e inicial, potencialmente idénticos. | `js/difusa/app.js`, exportación comparación, 261–264. | Exportar tras abrir un ejemplo sin variar entradas. | Referencias poco diversas; no justifican equivalencia general con MATLAB. | Media | L. | Deduplicar y generar conjunto explícito de extremos, nudos, OR, pesos y masa cero. | Mediano |
| H-14 | Ordenamiento | Mejora opcional de UX: animación completa muy larga con máximos. | `app.js`, reproducción, 323; `estado.js`, velocidades, 5; histórico `docs/cierre-medicion-ordenamiento.json`. | Decenas de miles de eventos a 120 ms/evento. | Reproducción puede durar más de una hora; Fin/deslizador ya permiten acceso directo. | Baja/media | L para intervalo; volumen histórico, tiempos actuales NC. | Duración estimada y navegación/reproducción por bloques o pasadas. | Mediano |
| H-16 | Inicio / difusa | Integración UX: recientes excluyen difusa; ayuda dice siete edificios. | `js/comun/inicio.js`, dibujarTrabajosRecientes, 253 y ayuda285; `guardados.js`, MODULOS_TRABAJO, 8; `difusa/estado.js`, biblioteca, 313. | Guardar trabajo difuso y volver a Inicio. | Trabajo no aparece entre recientes; texto desactualizado pese a ocho módulos. | Baja | L. | Incorporar proveedor de recientes difusa o aclarar alcance; derivar número del catálogo. | Mediano para integración; texto pequeño |
| H-15 | Textos Johnson | Interfaz educativa: mensajes demasiado generales de ciclo negativo/aislados. | `js/johnson/vistas.js`, resumen272 y aviso995–1018. | Aislado o ciclo en una componente. | Omite diagonal0 del aislado; puede sugerir que ningún par tiene mínimo. | Baja | L. | Precisar diagonal y alcance de pares afectados/aborto de matriz global. | Pequeño |
| H-17 | Árboles | Alcance opcional: sin buscar valor ni eliminar nodo arbitrario. | `arboles.html`, ayuda174; `js/arboles/app.js`, 29–32,271–277. | Querer búsqueda didáctica o eliminar una clave concreta. | Solo selección, última inserción o vaciar; funcionalidad ausente declarada. | Baja como mejora | L; no se clasifica como bug. | Confirmar requisito final; si entra, añadir operaciones con estado/dibujo/recorridos coherentes. | Mediano/grande |

Otros riesgos documentados sin convertirlos artificialmente en errores: etiquetas densas, nombres repetidos en Dijkstra/Kruskal, conflicto de última escritura entre pestañas, guardado sincrónico por evento en Ordenamiento y compatibilidad de exportación. Requieren priorización mediante uso/medición, no una reescritura completa preventiva.

## 13. Orden de trabajo recomendado para la versión final

Este plan describe trabajo **posterior**; sus pruebas y correcciones no se ejecutaron ni implementaron en esta auditoría. Cada etapa tiene un resultado revisable y criterios finitos; no promete ausencia absoluta de errores.

| Orden / dependencia | Trabajo concreto | Criterios de aceptación verificables |
| --- | --- | --- |
| 0. Antes de editar | Conservar el árbol de trabajo actual y acordar la fuente de entrega. Mantener separadas fuentes y salidas generadas. Registrar restricciones por módulo y semántica de datos pendientes. | Cambios existentes preservados; ocho módulos inventariados; correcciones acotadas a hallazgos; sin mezclar paquetes antiguos con fuentes. |
| 1. Depende de 0 | Corregir H-01 y H-05: contrato de visualización Johnson/Dijkstra y nombres/biblioteca. | Secuencia Johnson→editor→Dijkstra rápido→Resultado, incluido renombrar, no lanza y presenta un único estado coherente. Importar nombre homónimo de 60 caracteres produce nombre válido; biblioteca previa sigue visible; archivos inválidos no reemplazan ejercicio/biblioteca. |
| 2. Depende de 1 | Corregir semántica T H-02 y cubrir máximos DAG. Ajustar H-15. | Caso A→B2,B→D3,A→C5,C→D4 muestra D=5\|9 en mínimo/máximo/comparar y total5/9 según ruta; tabla/ARIA/PNG coherentes. Caso único30 muestra30\|30. Cubrir negativos, ceros, empates, origen=destino, inalcanzables y ciclo ajeno; el máximo bloqueado se explica como restricción de DAG. |
| 3. Depende de 0; puede avanzar en paralelo con 1–2 | Resolver H-04/H-06/H-07/H-08/H-19. | Eliminar una entidad con texto inválido no bloquea celdas restantes; deshacer/restaurar mantiene errores relevantes. Una edición inválida deja el mismo criterio de vigencia en Resultado/Algo y explica si se conserva el cálculo previo. Rectangulares 2×5 y5×2 muestran todos los ficticios con orden consistente y total independiente correcto. Shell grupo[0,4,8] muestra esos índices. Borrador difuso inválido al generar reglas da mensaje y conserva aplicado. |
| 4. Depende de 0 y decisión numérica | Resolver H-03 de difusa con contrato de precisión explícito. Actualizar explicación y comparación H-12. | Distinguir ninguna activación, activación con masa muestreada nula y resultado sin etiqueta. Caso estrecho tiene salida coherente con la política elegida; para solución matemática, centroide0.02 dentro de tolerancia documentada y referencia independiente. Extremos/hombros, OR, pesos0/1, deshabilitadas, huecos, empates y dominios negativos cubiertos. Procedimiento/curvas/Algo describen el mismo cálculo. |
| 5. Depende de 1–4 | Verificación automatizada pertinente y CI H-18; añadir regresiones de hallazgos. | Ejecutar suites existentes relevantes y registrar comandos/resultados reales. Añadir casos nuevos de máximos/T/transición/errores huérfanos/nombres límite/curvas estrechas; no usar una copia del algoritmo como única referencia. CI incluye suites específicas de difusa/asistente. Ningún test existente se da por aprobado antes de ejecutarlo. |
| 6. Depende de 3–5 | UX/accesibilidad: reproducir H-10, tabla/consulta de mapa H-13, recientes H-16 y duración de pasos H-14. | Edición por teclado conserva foco/celda; Tab/Escape/restauración correctos en diálogos y Algo; salida del mapa consultable sin hover. Recientes tienen política explícita para difusa. 320/360/768/1024px, zoom de texto200%, temas y reducción de movimiento revisados, con incidencias registradas. |
| 7. Depende de 4–6; solo si las mediciones lo requieren | Optimización localizada: mapa escalar H-11, costes de instrumentación/guardado de Ordenamiento. | Medir preparación, interacción, memoria y reproducción por separado en dispositivo/navegador declarado. Mapas cancelados/revisiones antiguas no se publican. n200 y grafos/matrices máximas siguen dentro de presupuestos acordados, sin reducir explicación necesaria. |
| 8. Depende de correcciones y verificación anteriores | Preparar salida estática H-09 y revisar integración local/estática. | Construcción con lista permitida completa; 100 archivos actuales o inventario actualizado justificado, referencias resueltas, caminos.js presente; fuentes/copias coinciden donde corresponde. Comprobar producto construido, importación entre orígenes y exportación PNG/impresión. Publicar será un paso separado posterior, no realizado aquí. |
| 9. Opcional, después de estabilizar | Decidir ampliaciones de alcance como búsqueda/eliminación BST H-17. | Si se aprueban: hoja/un hijo/dos hijos, raíz, ausentes, duplicados, persistencia y recorridos/dibujo coherentes. Si no se incluyen, ayuda y catálogo declaran el alcance vigente. |

Referencias independientes apropiadas para la etapa 5: Floyd-Warshall en mínimos pequeños; enumeración de caminos en DAG para máximos pequeños; enumeración de bosques para Kruskal pequeño; DP/subconjuntos independiente para Asignación; invariantes y referencia de acumulados para Northwest; orden/permutación/estabilidad por IDs en ordenamiento; recorridos/reconstrucción de árbol general; sumas analíticas o integración independiente para difusa. Su uso futuro no cambia el carácter estático del informe presente.

## 14. Qué se revisó y qué queda fuera

Se revisaron los motores y validaciones de los ocho módulos; controladores de sus flujos principales, firmas/invalidación, reconstrucciones y registro de pasos; dibujo SVG y restricciones de entrada; persistencia/importación/exportación; catálogo, inicio, ciudad y navegación; ayudas/diálogos/foco/temas/impresión/PNG; integración de Algo y su motor/adaptadores, con consulta focal de la base de conocimiento; servidor local, manifiestos de scripts, Netlify y CI. CSS y HTML se inspeccionaron para deducir disposición, accesibilidad y mensajes, sin afirmar observaciones visuales.

Se consultaron selectivamente pruebas de Johnson/grafos, Asignación, Northwest, Ordenamiento, Árboles, guardados, asistente y lógica difusa, además de referencias de medición/MATLAB cuando aportaban contexto. Su código contempla numerosos bordes: negativos y ciclos, desconexión, matrices rectangulares, degeneración, estabilidad/IDs, checkpoints/cancelación, reconstrucciones incompatibles, migraciones y mapa cancelado. **No se ejecutaron y no se asegura que pasen.** No se hizo una lectura exhaustiva palabra por palabra de todas las respuestas preparadas de Algo ni de toda automatización de navegador. No se identificaron pruebas específicas de la ampliación máxima/T de Johnson; no equivale a descartar toda cobertura indirecta.

La comparación de paquetes leyó únicamente las 100 fuentes HTML/JS/CSS del producto y sus copias correspondientes para comparar hashes/inventario. No se reconstruyeron `public`, `drop` o ZIP. No se auditó la versión remota, historial Git, dependencias transitivas inexistentes en el manifiesto, paquetes archivados, archivos de credenciales ni datos de usuarios. No se obtuvo ninguna evidencia de ejecución a partir de resultados históricos.

Permanecen NC: arranque real, suites actuales, comportamiento exacto del foco y táctil, exportaciones en cada navegador, rendimiento actual y cuotas de almacenamiento, conformidad de accesibilidad/contraste, apariencia/solapamientos efectivos, equivalencia MATLAB/toolbox y despliegue remoto. Los hallazgos estáticos prioritarios permiten planificar correcciones concretas sin convertir estas incertidumbres en afirmaciones de funcionamiento.
