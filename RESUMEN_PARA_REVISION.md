# Ciudad de los Algoritmos: contexto para planificar la versión final

Fecha de corte: **7 de noviembre de 2026**, America/La_Paz. Este resumen se puede compartir sin el chat original. El análisis detallado y la tabla completa de hallazgos están en `INFORME_ANALISIS_GENERAL.md`, en la misma raíz.

## Qué se hizo y qué no se ha demostrado

Se auditó el **código actual del árbol de trabajo local**, incluidos cambios pendientes y archivos sin seguimiento. Se leyó implementación, no solo README. Solo se crearon estos dos documentos. Se conservaron los cambios existentes.

No se ejecutaron aplicación, pruebas, construcción, mediciones ni MATLAB; no se abrió navegador, hicieron capturas, instalaron dependencias, commits, push o publicaciones. No se leyeron `.env`, credenciales, datos de navegador ni contenido de paquetes históricos. Los ejemplos siguientes son deducciones manuales, no ejecuciones.

**L** = confirmado por lectura; **P** = riesgo pendiente de comprobar; **NC** = comportamiento real no comprobado. Un fallo L deducido de una ruta de código puede seguir necesitando reproducción en navegador. La existencia de funciones o pruebas no demuestra que hoy funcionen/pasen.

## Estado y arquitectura reales

Hay inicio y **ocho módulos**: Johnson, Dijkstra, Kruskal, Asignación, Northwest, Ordenamiento, Árboles y Lógica difusa. El catálogo actual está en `js/comun/catalogo.js:35–182`. HTML/CSS/JavaScript planos, scripts clásicos, sin paquetes externos declarados; navegación entre páginas HTML, no SPA. SVG nativo para los principales dibujos; canvas para rasterizar PNG.

| Área | Archivos clave |
| --- | --- |
| Inicio/ciudad/navegación | `index.html`, `js/comun/{catalogo,inicio,ciudad,navegacion,intro}.js`, `css/ciudad.css`, `css/shell.css`. |
| Johnson | `johnson.html`, `app.js`, `js/{estado,acciones,almacenamiento,dibujo,interaccion,zoom,johnson,dijkstra}.js`, `js/johnson/{vistas,caminos,ejemplos}.js`. |
| Dijkstra/Kruskal | Sus HTML y `js/grafos/{modelo,algoritmos,editor,app}.js`, `css/grafos.css`. |
| Asignación | `js/asignacion/`: modelo, validación, estado, húngaro, grafo, matriz, procedimiento y resultado. |
| Northwest | `js/northwest/`: modelo, validación, balanceo, noroeste, tabla, estado y app. |
| Ordenamiento | `js/ordenamiento/{algoritmos,estado,dibujo,app}.js`. |
| Árboles | `js/arboles/{modelo,validacion,reconstruccion,estado,dibujo,app}.js`. |
| Lógica difusa | `js/difusa/{motor,modelo,estado,editor,dibujo,mapa,app}.js`. |
| Compartido | `js/comun/`: temas, diálogos/foco, avisos, trabajos, PNG, impresión, Algo y `conocimiento/`; `js/config.js`. |
| Distribución | `package.json`, `netlify.toml`, `scripts/preparar-netlify.js`, `tests/servidor-local.js`. |

Cada módulo une controles → modelo/estado → validación → motor → resultado/pasos → dibujo. Se usan firmas para distinguir edición matemática de renombres/movimiento. Dijkstra/Kruskal comparten editor/modelo; Johnson mantiene otro editor y otro Dijkstra rápido. Existen tres funciones Dijkstra para contextos distintos: interno de Johnson, rápido histórico y módulo independiente. Conviene corregir contratos localizados, no reescribir toda la aplicación.

La ciudad son ilustraciones SVG y botones HTML; sus demostraciones son decorativas. Inicio ofrece ciudad/lista, edificios y catálogo. Introducciones y videos se pueden omitir. Trabajos recientes abren la biblioteca del módulo, no cargan automáticamente el ejercicio elegido. La ayuda aún dice siete edificios aunque hay ocho. Difusa tiene biblioteca propia y sus trabajos no aparecen en recientes comunes.

## Johnson: separar dibujo, cálculo mínimo y máximo

**Construcción:** nodos `{id,nombre,x,y}`, aristas `{id,desde,hacia,valor}`; referencias por ID, dirigidas. Editor hasta 40 nodos/300 conexiones, nombres únicos de hasta 12 caracteres, pesos enteros ±999999, incluido 0. Rechaza bucles, duplicados y también la conexión inversa si ya existe la otra; sí admite ciclos de tres o más. Esta es una restricción de su editor, no de todo Johnson. El núcleo permite más estructuras que la UI (`js/almacenamiento.js:59–129`; `js/johnson.js:25–54`). La UI exige dos nodos para calcular; el núcleo admite un nodo.

Hay creación/eliminación, edición de nombres/pesos, ejemplos, arrastre, zoom/pinza/pan/ajuste y ampliación. No se encontró generación aleatoria de Johnson en el producto. SVG calcula extremos sobre círculos, flechas con marcadores y etiquetas desplazadas; conserva ramas heredadas de curvas opuestas/bucles aunque la UI los rechace. Miniaturas compactan copias de posiciones, sin cambiar el grafo guardado. Radio 26 normal y 66 con consulta T; no hay garantía de ausencia de solapamientos.

**Mínimos:** `calcularJohnsonDesde()` (`js/johnson.js:267–350`) agrega q→todos con peso 0, ejecuta Bellman-Ford, obtiene h, repondera `w′=w+h(u)−h(v)`, ejecuta Dijkstra desde cada origen y recupera `d=d′−h(u)+h(v)`. Dijkstra usa barrido lineal, sin heap. Bellman-Ford detecta ciclos negativos en cualquier componente gracias a q; el cálculo global se aborta si los hay.

Guarda matrices de mínimos originales/reponderados y predecesores por par. `reconstruirRutaJohnson():365–400` sigue predecesores; el detalle verifica dirección y suma pesos originales (`vistas.js:759–769`). Igualdad no reemplaza predecesor: muestra una ruta representativa. Inalcanzable → ∞/sin ruta; origen=destino → 0/nodo único. La matriz final es solo de **mínimos**; los pesos reponderados son parte del procedimiento, no el costo final de la ruta.

**Máximos:** `calcularMaximosDAGJohnson()` (`js/johnson/caminos.js:9–95`) usa Kahn y programación dinámica en orden topológico con pesos originales. Es otro algoritmo, no Johnson maximizado. Solo acepta que **todo el grafo** sea acíclico, incluso si el ciclo está en una componente ajena al origen. Admite negativos; origen=destino da 0, inalcanzable da −∞ y máximo no calculable por ciclo da null. No debe afirmarse que cualquier máximo en un grafo cíclico sea infinito.

**Los nodos T** guardan nombre arriba, mínimo desde el origen actual abajo izquierda y máximo DAG desde ese mismo origen abajo derecha (`vistas.js:795–809`). No son tiempos tempranos/tardíos, potenciales h ni holguras. La tabla de tramos muestra acumulado de la ruta elegida y puede diferir del mínimo general en un nodo intermedio.

Hay una excepción de dibujo que debe corregirse: en el destino con objetivo único, `dibujarCompartimentosNodoJohnson()` repite el costo elegido en ambas casillas, rotuladas «Elegido» (`js/dibujo.js:200,244–274`). La leyenda lo admite, pero contradice el contrato mínimo/máximo de tabla/HTML. Ejemplo existente A→B=2, B→D=3, A→C=5, C→D=4: D tiene **5 y 9**; Minimizar dibuja 5/5, Maximizar 9/9 y Comparar 5/9. Deben conservarse 5/9 y señalar objetivo aparte. **30/30 solo corresponde si ambos extremos reales valen 30**; no forzar coincidencias.

Costo actual de mínimos con pasos: tiempo O(V³+VE), memoria O(VE+V²). Un máximo DAG O(V+E); caché de máximos hasta O(V(V+E)). El procedimiento de Johnson agrega un paso Dijkstra por origen, no cada relajación de todos los orígenes. Cambiar pesos/topología invalida; mover conserva; renombrar actualiza textos. Existe un conflicto de estado con Dijkstra rápido, detallado en prioridades.

## Dijkstra y Kruskal independientes

Modelo compartido hasta 24 nodos/96 aristas, IDs estables/únicos, nombres de hasta 12 caracteres que pueden repetirse. Sin bucles. Dirigido admite A→B/B→A; no dirigido los considera una sola arista. SVG y editor son distintos de Johnson, aunque comparten utilidades. Nombres se abrevian en el dibujo y pesos intentan varias posiciones. Arrastre está habilitado para ratón; formularios de coordenadas sirven de alternativa táctil/teclado.

**Dijkstra** admite dirigido/no dirigido y pesos enteros 0…999999; rechaza negativos/decimales por validación. `resolverDijkstraGrafo()` (`js/grafos/algoritmos.js:10–66`) usa Map de adyacencia, distancias/predecesores, Set de finalizados y elección lineal del menor. Inicializa 0/∞, finaliza, relaja con `<` y termina al no quedar alcanzables. Calcula todos desde origen; destino solo resalta una ruta. Reconstrucción por IDs valida sentido y suma pesos originales (`:69`). Origen=destino da 0; desconectado, ∞. Resultado distingue árbol de predecesores y ruta elegida. Núcleo O(V²+E), pero snapshots añaden tiempo O(V²+VE) y memoria O((V+E)V).

**Kruskal** siempre no dirigido; admite pesos enteros negativos/cero/positivos y objetivo min/max. `resolverKruskalGrafo()` (`algoritmos.js:101–143`) ordena ascendente/descendente y desempata por índice original. Union-Find con compresión/rango acepta si une componentes y descarta ciclos. Procesa todas las aristas para explicar decisiones, incluso después de completar el árbol. Suma solo aceptadas. Desconectado→bosque, con aislados y V−C aristas; conectado→árbol. Máximo es expansión de peso máximo, no ruta máxima. La UI principal ya usa árbol/bosque correctamente; no se halló un rótulo principal «ruta» que deba corregirse. Núcleo O(E log E+Eα(V)+V); historial añade aproximadamente O(EV) tiempo/memoria.

En ambos, mover/renombrar conserva resultado, datos matemáticos/origen/objetivo lo invalidan; cambiar solo destino Dijkstra conserva. Documento v1 guarda datos/opciones y `resuelto`, luego recalcula, sin confiar un resultado importado. Importación ≤1 MiB valida y comprueba revisión antes de reemplazar. Claves de almacenamiento separadas.

## Resto de módulos: capacidades y límites

- **Asignación:** método húngaro real con emparejamiento de ceros, cobertura y ajustes; min/max, rectangulares hasta 8×8, enteros ±999999, pendientes distintos de 0. Completa al cuadrado con tantos ficticios como faltan; filtra asignaciones ficticias y totaliza originales. Exige todos los costos; no hay rutas prohibidas. Verificación independiente por DP/subconjuntos, aunque su nombre diga fuerza bruta. Motor O((I+1)n³), límite de 200 ajustes; DP O(n·2ⁿ), pasos O((I+1)n²). La matriz editable muestra mal cantidad/orden de ficticios, sin demostrar total incorrecto.
- **Northwest:** solución inicial factible, sin optimización posterior. Hasta 10×10 reales más ficticio, cantidades enteras 0…999999, costos no negativos con dos decimales almacenados ×100. Balancea en copia; empates generan básica 0, sin ε. Verifica conservación/base/costo, no optimalidad. Decisiones O(m+n), pero snapshots O(mn(m+n)) tiempo/memoria. Errores visuales de celdas eliminadas pueden quedar bloqueando la resolución.
- **Ordenamiento:** Selection, Insertion, Bubble, Shell y Merge; solo ascendente, 3–200 enteros 1…99, duplicados. Insertion/Bubble/Merge estables; Selection/Shell no. Selection Θ(n²); Insertion/Bubble mejor O(n), peor O(n²); Shell peor O(n²) con mitades; Merge O(n log n), auxiliar O(n). Instrumentación puede elevar preparación a O(n³) para primeros tres y O(n² log n) para Merge. Eventos compactos/checkpoint cada 128; preparación cooperativa/cancelable. Shell rotula mal índices de grupos. La velocidad mínima de 120 ms por evento hace extensa la animación grande; Fin/deslizador disponibles.
- **Árboles:** hasta 31 valores enteros únicos ±999, incluye 0; inserción BST sin balanceo, recorridos y reconstrucción binaria general con inorden+preorden/postorden. Preorden+postorden solos se consideran ambiguos. No hay búsqueda por valor ni eliminación arbitraria; solo consulta por selección, quitar última inserción y vaciar, declarado en ayuda. Inserción cuenta nodos y cuesta O(n), construcción O(n²); reconstrucción validada O(n²), recorridos O(n). Dibujo x por inorden/y por profundidad; guarda secuencia o recorridos, paso y modo.
- **Difusa:** editor Mamdani configurable de 1–3 entradas, 1 salida, 2–5 conjuntos/variable y 1–125 reglas; triángulos/trapecios/hombros, dominios finitos ±1000000. AND=min, OR=max, activación×peso, implicación=min y agregación=max. Centroide discreto de 1001 puntos; masa 0 → null. Procedimiento registra operaciones reales; cambios matemáticos invalidan, renombres conservan. Mapa de 101 puntos o 15×15, tercera entrada fija, cancelación por revisión. Guarda modelos/valores, recalcula derivados; v2 y migración del ejemplo v1. MATLAB está expresamente pendiente. Muestreo uniforme puede omitir un consecuente estrecho válido y diagnosticar mal «sin reglas activas».

## Prioridades y evidencia concreta

Los IDs corresponden al informe completo; no son resultados de pruebas ejecutadas.

| Prioridad | Hallazgo | Evidencia / solución recomendada |
| --- | --- | --- |
| Alta, H-01 | Dijkstra rápido sobrescribe visualización Johnson sin valoresNodos y conserva selección. Volver a Resultado puede lanzar TypeError. | `js/dijkstra.js:191–200`; `js/johnson/vistas.js:936,979,992`. Aislar estado o reconstruir consulta y comprobar tipo. L; reproducción NC. |
| Alta, H-05 | Importar homónimo de nombre de 60 caracteres agrega sufijo y produce nombre de 64; siguiente lectura rechaza biblioteca completa y protege original. | `js/comun/guardados.js:54–59,165–169,203`. Reservar espacio de sufijo y validar antes de escribir. L. |
| Alta, H-02 | T destino duplica valor elegido pese a extremos distintos. | `js/dibujo.js:200,244–274`; `vistas.js:933–936`. Conservar extremos reales. L. |
| Alta para entrega, H-09 | public/drop no reflejan fuente actual. | Comparación de 100 fuentes: falta `js/johnson/caminos.js`, ocho archivos Johnson difieren. Regenerar después de corregir; sitio remoto NC. L. |
| Media, H-03 | Consecuente estrecho puede desaparecer entre 1001 muestras y dar null aunque activo. | `difusa/modelo.js:66–74`; `motor.js:128–129,244–268`. Ejemplo salida [0,100], triángulo [0.01,0.02,0.03], centroide continuo 0.02. Diagnóstico distinto y solución numérica explícita. L, deducción manual. |
| Media, H-04 | Northwest cuenta errores de celdas ya eliminadas. | `northwest/tabla.js:40–49`; `app.js:31–45,64–68`. Purgar por IDs actuales. L. |
| Media, H-06 | Un ficticio mostrado frente a varios necesarios y orden distinto. | `asignacion/matriz.js:48–111` frente `hungaro.js:139–146`. Unificar normalización visual. L. |
| Media, H-07/H-08 | Shell índices auxiliares erróneos; generar combinaciones difusas con borrador inválido no captura excepción. | `ordenamiento/app.js:189–217`; `difusa/editor.js:217–219`, `modelo.js:220–223`. Índices reales y validación/mensaje. L. |
| Media, H-18 | CI llama lint/test estándar, que omite suites específicas de difusa/asistente. | `package.json`; `.github/workflows/pruebas.yml:15–16`. Integrar suites y nuevas regresiones. L sobre configuración, no fallos actuales. |

Otro hallazgo de estado (H-19, L): texto rechazado en Asignación/Northwest queda en `invalidas` y no sustituye el último valor del modelo. Resultado puede seguir marcado vigente mientras Algo lo considera no vigente (`asignacion/estado.js:236`; `northwest/estado.js:134`; `asistente-contexto.js:264–266,289–291`). Acordar si se conserva como «último resultado válido con cambios pendientes» o se invalida uniformemente; interacción real NC.

Pendientes secundarios: foco al reconstruir tablas (P); rendimiento de mapa que genera explicaciones por cada punto (costo L, latencia NC); acceso textual al mapa; cobertura escasa del JSON de comparación; recientes difusos; textos de ciclo negativo/diagonal de aislado; duración de animación; búsqueda/eliminación BST como ampliación opcional.

## Persistencia, ayuda y publicación

Los siete módulos originales comparten biblioteca versionada, 50 trabajos/módulo, nombres hasta 60 caracteres y validación al importar/cargar. Johnson tiene otra biblioteca histórica de 30 grafos. Difusa tiene su biblioteca propia de 50. Se conservan originales incompatibles y se pausan escrituras hasta recuperación explícita; fallos de almacenamiento avisan y permiten seguir en memoria. Esto no garantiza conservación tras cerrar si no se pudo guardar. Localhost, 127.0.0.1 y Netlify son orígenes distintos: no comparten guardados automáticamente.

Algo es ayuda local preparada, sin Gemini ni modelo generativo: normaliza/puntúa preguntas, ofrece aclaraciones/explorador y consulta una fotografía acotada del módulo activo. Limita pregunta a 1200 caracteres y contexto a muestras con avisos de omisión. Usa firmas para vigencia; no resuelve de nuevo ni tiene datos de otras páginas. Conversación solo en memoria; respuestas anteriores permanecen históricas. Su calidad de reconocimiento, foco y accesibilidad reales son NC.

`npm start` sirve fuentes raíz con Node en 127.0.0.1:8123. Netlify declara construcción hacia `public` mediante lista permitida de archivos y puede generar entrega estática/ZIP con otro comando. No hay dependencia activa de Gemini en fuentes revisadas; referencias restantes son controles de rechazo y archivo de paquetes obsoletos en `scripts/preparar-netlify.js:74,137–156`. No se inspeccionaron respaldos ni `.env`. Videos sí requieren YouTube.

**Paquetes existentes:** tanto public como entrega-netlify/drop carecen de caminos.js y difieren en `johnson.html`, `js/acciones.js`, `js/dibujo.js`, `js/interaccion.js`, `js/zoom.js`, `js/johnson/ejemplos.js`, `js/johnson/vistas.js`, `css/johnson.css`. No publicar esas copias asumiendo paridad. No se modificaron ni se comprobó qué usa el sitio remoto.

## Plan recomendado y aceptación

1. Preservar cambios locales y contratos por módulo. Corregir estado Johnson/Dijkstra y nombres de biblioteca. Aceptación: transición completa sin excepción/mezcla; importación límite conserva biblioteca y ejercicios.
2. Corregir T y cubrir máximos. Caso DAG de dos rutas muestra 5/9 en todos los modos; único camino de 30 muestra 30/30. Cubrir negativos, empates, inalcanzables, diagonal y ciclos ajenos. Tabla, ruta, ARIA y dibujo deben expresar lo mismo.
3. En paralelo, corregir errores huérfanos Northwest, ficticios Asignación, índices Shell y generación difusa inválida. Aceptación con casos 2×5/5×2, grupo [0,4,8] y eliminación de celda errónea.
4. Definir precisión difusa y resolver masa muestreada cero. Verificar contra referencia independiente, incluidos triángulos estrechos, extremos, OR/pesos/huecos. Una malla no uniforme necesita ponderación de integración. Actualizar procedimiento/Algo y comparación externa conjuntamente.
5. Ejecutar en trabajo posterior suites existentes pertinentes y nuevas regresiones; integrar CI. Las pruebas hoy escritas no se consideran aprobadas. Usar referencias independientes e invariantes, no solo repetir implementación.
6. Revisar teclado/foco/mapa, recientes, móvil/escritorio, temas, contraste, zoom texto, grafos densos y exportaciones. Medir rendimiento de preparación, dibujo y animación por separado antes de optimizar o ampliar límites.
7. Regenerar salida estática después de estabilizar; verificar inventario/paridad de fuentes y paquete y comprobar versión construida. Publicación será un paso posterior separado.
8. Decidir después si búsqueda/eliminación BST entran en el alcance final; no confundir ausencia declarada con bug.

Revisión pendiente: reproducción de interacciones, pruebas actuales, apariencia y solapamientos, teclado/táctil/lector de pantalla, cuotas/varias pestañas, rendimiento real, PNG/impresión, MATLAB/toolbox y despliegue remoto. No hay evidencia para prometer ausencia absoluta de errores.
