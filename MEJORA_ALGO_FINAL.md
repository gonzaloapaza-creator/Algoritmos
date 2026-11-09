# Mejora final de Algo

Fecha: 9 de noviembre de 2026.

Algo sigue siendo un asistente educativo local basado en conocimiento preparado y contexto del ejercicio. No es una IA generativa ni aprende automáticamente. No incorpora servicios, claves, dependencias ni solicitudes de red para responder.

## Cambios implementados

- Se reutilizaron el banco, la normalización, la coincidencia tolerante y los seguimientos existentes. Se añadieron **22 variantes acotadas**, sin crear entradas duplicadas ni reducir los umbrales generales de confianza. La página carga el banco completo de **217 entradas**.
- Las formulaciones contextuales completas consultan el módulo abierto bajo demanda. Las preguntas con conceptos explícitos conservan su reconocimiento conceptual. Una consulta sobre el ejercicio de otro módulo pide abrirlo antes de describir valores.
- Los adaptadores distinguen datos insuficientes, datos sin resolver, preparación, resultado vigente, histórico consultable, invalidación, entradas inválidas y ausencia de solución. Los valores salen de registros estructurados; Algo no vuelve a ejecutar los algoritmos.
- Johnson conserva los rótulos de la vista: Acum./Total en la ruta activa, mínimo/máximo en comparación, temprano/tardío en temporal y la etapa real del procedimiento. Diferencia adyacencia y distancias, pesos originales y reponderados, y el máximo adicional sobre DAG. Una suma de ruta se desarrolla únicamente si están todas sus conexiones en el contexto.
- Northwest conserva la corrección anterior entre histórico consultable e invalidado. Desarrolla cantidad × costo unitario cuando la matriz copiada está completa y distingue el aviso informativo «sin resolver» de una entrada inválida.
- El centroide vigente utiliza momento, área y resultado registrados. Sin evaluación vigente explica el método continuo por tramos y pide evaluar, sin reutilizar cifras antiguas. Las 1001 muestras siguen descritas como auxiliares.
- Se aclararon conceptos existentes: conjunto y pertenencia difusa, variables de entrada/salida y Guardar frente a Exportar/Importar. Los ejemplos autorizados precisan índices de Shell, la excepción del origen aislado de Dijkstra y el recorrido de aristas de Kruskal.
- Los ejemplos preparados se presentan como **«Ejemplo ilustrativo»**. Pedir otro tras agotar el disponible reconoce ese límite, sin repetirlo como si fuera nuevo.
- Se muestran hasta tres preguntas según el estado actual. Solo envían una consulta al activarse. Las respuestas históricas reciben una marca cuando cambia el contexto; los seguimientos y botones antiguos advierten del cambio. Se conserva la limpieza de memoria al cambiar de módulo y limpiar la conversación.
- Las preguntas, respuestas y nombres continúan renderizándose como texto, sin interpretar HTML.

## Archivos de fuente modificados en esta entrega

1. `js/comun/asistente-motor.js`: variantes autorizadas, prioridades acotadas, aclaraciones, ejemplos y seguimientos.
2. `js/comun/asistente-contexto.js`: lecturas, estados, significado de cifras, rótulos y sugerencias.
3. `js/comun/asistente.js`: chips, marca de historial, conservación de lectura/foco y origen de acciones anteriores.
4. `css/asistente.css`: estilos propios de esos controles.
5. `js/comun/conocimiento/fundamentos.js`.
6. `js/comun/conocimiento/ejercicio.js`.
7. `js/comun/conocimiento/aplicacion.js`.
8. `js/comun/conocimiento/algoritmos-datos.js`.

Las ampliaciones del banco usan metadatos autorizados; los campos anteriores permanecen. Las nuevas prioridades y controles tienen guardias para conservar la ruta anterior del módulo excluido. No se analizó ni ejecutó ese módulo ni se modificaron sus entradas específicas o adaptador. La comparación mecánica confirmó que **89 archivos públicos ajenos al asistente mantienen su SHA-256 inicial**: se preservan motores, modelos, validadores, controles y cambios anteriores del sitio.

## Preguntas representativas admitidas

- «¿Cómo salió ese resultado?», «¿Por qué da eso?», «Explícame el resultado» y «¿Qué significan estos valores?».
- «¿De dónde sale ese número?»: usa una selección inequívoca o pide identificar el nodo, celda o valor.
- «¿Qué está pasando en este paso?», «Explicar este paso» y «¿Qué hago ahora?».
- «No entiendo», «Explícalo más fácil», «Ver ejemplo», «Dame otro ejemplo» y «Más detalle».
- «¿Por qué no me deja continuar?», «¿Qué dato me falta?», «¿Qué restricciones hay?» y «¿Cómo calculo?».
- «¿Por qué no hay camino?», «¿Qué significa infinito?» y «¿Cómo se obtuvo el centroide?».
- «¿Qué significan estos dos números?», «¿Qué significa esta matriz?», «¿Qué significan estos valores de pertenencia?» y «¿Qué significa la raíz de un árbol?».
- «¿Por qué está mal?»: explica el aviso disponible o presenta dos o tres opciones para precisar la consulta.

## Comprobaciones realizadas

Se utilizaron herramientas ya instaladas, Edge en un contexto aislado y un servidor local. Las respuestas se comprobaron con el banco completo cargado por la página. Se bloquearon las solicitudes externas durante las comprobaciones de navegador. No se generaron capturas ni se ejecutaron `npm test` o baterías generales.

| Comprobación dirigida | Resultado observado |
| --- | --- |
| Nuevas reformulaciones, signos y mayúsculas | Reconocidas las consultas representativas de resultado, paso, siguiente y pendientes. «¡¡CÓMO SALIÓ ESE RESULTADO!!» conserva su intención. |
| Error leve de escritura | «que es una matris» devuelve la definición de matriz. |
| Ambigüedad sin error conocido | Pide precisar entre entrada y selección; añade resultado únicamente cuando está disponible. |
| Error conocido en Northwest | Explica los datos pendientes y el estado real del cálculo anterior. |
| Pregunta ajena | Una consulta sobre una nave espacial admite la falta de cobertura y ofrece reformulaciones. |
| Otro módulo explícito | Desde Northwest o Dijkstra, pedir el resultado de Difusa solicita abrir Difusa; preguntar por pertenencia o centroide recibe ayuda conceptual. Se corrigió el cruce de contexto detectado y se repitió ese caso. |
| Johnson, ejemplo 19/58 | Ruta activa: Acum./Total. Resultado mínimo 19, máximo DAG 58 y operación **6 + 5 + 8 = 19**. Comparación: mínimo/máximo. Temporal: temprano/tardío, duración 58 y holguras. Sin selección no atribuye arbitrariamente cifras a un nodo. |
| Johnson, procedimiento | Explica «Grafo original» cuando esa es la etapa actual. Se comprobaron además lecturas preparadas de Bellman-Ford y reconstrucción final sin ejecutar motores desde el asistente. |
| Northwest sin resolver | Estado `sin-resolver`, chips de datos listos y orientación al balanceo. Se corrigió la clasificación del aviso informativo y se repitió con el texto real. |
| Northwest vigente | Costo 230: **10 × 2 + 10 × 3 + 15 × 4 + 15 × 8 = 230**; aclara que es una solución inicial factible sin garantía de óptimo. |
| Northwest histórico consultable | Tras una entrada rechazada identifica el costo anterior 230 y explica que pertenece al modelo válido anterior. |
| Northwest invalidado | Después de un cambio aceptado y otra entrada rechazada no transmite un histórico consultable ni promete valores de un resultado vigente. |
| Centroide real | Ejemplo de ayuda evaluado: **1500 / 30 = 50**, integrado en 4 tramos. Los 1001 puntos no determinan la integral. |
| Centroide sin evaluación o invalidado | No usa las cifras anteriores; explica el método y pide evaluar la configuración actual. |
| Ampliaciones | Matriz → «Más sencillo» → «Ver ejemplo» añade una explicación y un ejemplo ilustrativo. Pedir otro admite que solo hay uno preparado. |
| Contexto anterior y memoria | Cambio de entrada marca el historial; seguimiento y botón histórico advierten del cambio. Al navegar a Dijkstra y al pulsar Limpiar conversación la memoria queda vacía. |
| Chips y teclado | Hasta tres; Enter y Espacio envían una sola consulta. La firma del ejercicio permanece igual tras activar un chip. Actualizar los chips no añadió mensajes. Escape cierra y devuelve el foco a Abrir Algo. |
| Lectura y foco | En una conversación de 9 mensajes, actualizar el estado desplazó **0 px** el párrafo de referencia y mantuvo los 9 mensajes. El foco pasó al chip equivalente disponible al sustituirse las preguntas. |
| Escritorio y móvil | Verificados 1280 px, 390 px y 320 px. A 320 px el panel mide 304 px y los chips caben sin desbordamiento horizontal. |
| Texto seguro | Una pregunta con `<img ... onerror=...>` se muestra literalmente; no crea imágenes ni ejecuta el manejador. |
| Sintaxis y errores | `node --check` correcto en los 7 JavaScript modificados; sin errores de aplicación capturados en las páginas comprobadas ni en el Drop. |
| Contextos preparados | Lecturas adicionales de muestra parcial, selección, matrices y estados confirman que no se extrapolan valores omitidos ni se recalculan algoritmos. |

## Paquete actualizado

Generado exclusivamente con `node scripts/preparar-netlify.js`, sin editar las copias manualmente ni publicar.

- Public: `C:\Users\GONZALO APAZA\Desktop\Algoritmos\public`
- **Drop:** `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop`
- **ZIP:** `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\ciudad-algoritmos-netlify.zip`
- 101 archivos públicos en origen seleccionado, public, Drop y ZIP.
- ZIP: **514235 bytes**.
- SHA-256: `86398fa7e46030d4720e87b69e6e4615f739d771d13361843a53710bd4b02187`.

La verificación mecánica `tests/verificar-paquete-fase2.py` aprobó inventario, referencias, paridad SHA-256 y CRC del ZIP. Los ocho archivos modificados forman parte de esas copias idénticas. Una comprobación desde el Drop servido localmente confirmó el banco de 217 entradas, los tres chips y las nuevas respuestas.

## Límites conservados

El reconocimiento depende de formulaciones y conceptos preparados; algunas preguntas requerirán reformularse. Algo no dispone del ejercicio de otra página ni completa cifras ausentes de una muestra. Una consulta sin selección inequívoca pide identificar el valor. Los ejemplos ilustrativos son preparados, y puede existir solo uno para un concepto. Las respuestas antiguas se conservan como historial y no se recalculan retrospectivamente. No se realizó validación nueva con MATLAB ni con servicios externos.

No hubo instalaciones, commits, push ni publicaciones.
