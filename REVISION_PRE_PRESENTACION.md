# Revisión previa a la presentación — Ciudad de los Algoritmos

Fecha: **8 de noviembre de 2026**. Revisión del árbol de trabajo local, con sus cambios pendientes, y de la entrega estática existente. **No se implementaron correcciones.**

## Diagnóstico para decidir el último ajuste

- **Bloqueo de presentación:** no identifiqué un P0 en los casos concretos revisados. Johnson cumple el contrato visual más reciente tanto en la fuente como en el Drop servido directamente. Esto no certifica todos los grafos, entradas, dispositivos ni trayectorias posibles.
- **Corrección necesaria para cerrar la coherencia del producto:** **R-01, P1**, en Northwest. Una edición válida seguida de una inválida deja el resultado oculto, mientras Algo afirma que sus valores siguen visibles. Es una contradicción reproducida de explicación y estado; no observé un costo matemático incorrecto ni pérdida del ejercicio.
- **Si queda tiempo:** mejorar una variante natural de pregunta a Algo, contextualizar la complejidad de Johnson en Inicio y corregir dos textos residuales: el número de módulos y el tooltip de orden inverso. Son ajustes pequeños y de bajo riesgo, sin cambiar motores.
- **Para después:** consulta del mapa difuso por teclado/texto, ampliar los casos de comparación externa, MATLAB, cobertura automática adicional y comprobaciones completas de accesibilidad/dispositivos. No conviene ampliar funcionalidades ni reescribir algoritmos antes de presentar.
- **Netlify:** raíz → `public/` → `entrega-netlify/drop/` → ZIP están sincronizados: **101 archivos públicos idénticos por SHA-256**, ZIP de **505786 bytes**, CRC correcto e `index.html` en raíz. No se regeneró ni publicó nada.

## Alcance y naturaleza de la evidencia

Se revisaron Inicio, Johnson, Dijkstra, Kruskal, Northwest, Ordenamiento, Árboles, Lógica difusa, ayuda local y empaquetado. Se consultaron `INFORME_ANALISIS_GENERAL.md`, `RESUMEN_PARA_REVISION.md`, las entregas de fases 1 y 2, la entrega difusa y, con precedencia para el contrato de Johnson, `docs/AJUSTE_JOHNSON_2026-11-08.md`.

**Asignación quedó excluida del análisis funcional y de las pruebas.** Sus archivos públicos solo participaron en la comparación mecánica autorizada del paquete. El número de edificios se contó desde Inicio, sin abrir ese módulo.

Se conservaron los cambios locales. El único archivo del proyecto creado por esta revisión es este informe. No se instalaron dependencias, ejecutaron baterías generales, generaron capturas/descargas de imágenes, hicieron commits/push ni consultó el dominio remoto. No se leyeron secretos ni perfiles personales.

Browser no tenía navegadores conectados. Se reutilizaron **Edge headless y Puppeteer-core ya instalados**, con contextos nuevos y aislados. Los ejercicios y guardados usados fueron sintéticos. Se sirvieron únicamente direcciones `127.0.0.1`; se bloquearon solicitudes externas para comprobar que la falta de video no impedía continuar. La disponibilidad real de YouTube no fue comprobada.

La evidencia de interfaz consiste en interacciones reales, texto renderizado, estado de controles, foco, dimensiones y visibilidad del DOM. **No hubo inspección mediante capturas**, por instrucción expresa. No se certifican contraste, accesibilidad completa ni ausencia universal de superposiciones.

**Certeza:** “observado” significa ejecutado en esta revisión, indicando si fue en navegador o en memoria; “deducido” significa lectura de una ruta concreta del código; “pendiente” identifica lo que falta comprobar. Las pruebas aprobadas que citan las entregas anteriores son evidencia histórica, no ejecuciones nuevas.

## Hallazgos priorizados

P0: bloqueo, pérdida de datos o resultado matemático incorrecto. P1: explicación contradictoria o interacción/visualización que impide interpretar. P2: claridad o comodidad. P3: ampliación posterior. No se encontraron P0 dentro del alcance ejecutado.

| ID | Módulo | Problema | Evidencia | Pasos para reproducir | Esperado / observado | Impacto en presentación | Prioridad | Certeza | Propuesta de corrección | Esfuerzo estimado | Riesgo del cambio |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Northwest / Algo | El aviso presupone que el resultado anterior sigue visible aunque ya fue invalidado por una edición válida. | `js/northwest/estado.js:180` y `:184`, `js/northwest/app.js:251` y `:337`, `js/comun/asistente-contexto.js:331`. Reproducido en navegador y mediante estado en memoria. | Resolver «Balanceado 2×3» (230) → Datos → cambiar costo Planta A/Tienda 1 de 2 a 3 y confirmar con Tab → escribir `x` en esa celda y confirmar → Resultado → Algo: «¿Qué significa este resultado?». | Esperado: indicar resultado invalidado, pedir corregir la celda y recalcular, sin afirmar que hay valores consultables.<br>Observado: el panel dice que el resultado ya no es válido y lo oculta; el chip dice «Último cálculo válido…» y Algo afirma «Los valores visibles en Resultado y Procedimiento…». `consultable=false`, `vigente=false`. | Contradicción docente al explicar recuperación de errores. Corregir antes de afirmar coherencia completa del estado y de Algo. Se recuperó corrigiendo a 2 y resolviendo otra vez: 230. | **P1** | **Observado**, navegador y memoria. | Condicionar el aviso y la explicación a `resultadoConsultableNorthwest()`. Con firma distinta, usar el mensaje de invalidación; con firma conservada, mantener el histórico consultable. No cambiar el motor ni presentar el resultado anterior como vigente. | Pequeño: aproximadamente 30–60 min, incluida comprobación focal. | Bajo; afecta mensajes/contexto. Cuidar que el caso habitual de texto inválido sobre un cálculo consultable siga funcionando. |
| R-02 | Algo / Lógica difusa | Una pregunta natural sobre el centroide queda fuera de reconocimiento pese a existir la explicación. | Interacción de Algo sobre «Velocidad de ventilación», resultado 50; variantes en `js/comun/conocimiento/algoritmos-datos.js:43`; reconocimiento en `js/comun/asistente-motor.js`. | Evaluar el ejemplo de ventilación con temperatura 20 → preguntar «¿Cómo se obtuvo el centroide?» → reformular «¿Cómo se calcula el centroide?». | Esperado: explicar el método o pedir aclaración vinculada al centroide.<br>Observado: la primera pregunta devuelve «No tengo una explicación local…»; la segunda explica correctamente la integral. «¿Qué significa este resultado?» sí devuelve 2500 / 50 = 50. | Puede interrumpir una pregunta espontánea del docente; no inventa una respuesta ni altera el resultado. | **P2** | **Observado** en navegador. | Añadir la variante concreta y otras equivalentes acotadas; para el cálculo del ejercicio, dirigir a la explicación dinámica con área/momento actuales. Mantener rechazo honesto fuera de cobertura. | Pequeño: 15–30 min. | Bajo; evitar que una regla genérica capture preguntas ajenas. |
| R-03 | Inicio | Anuncia siete módulos/zonas aunque hay ocho edificios. | `index.html:44` y `:49`; catálogo renderizado y Ayuda de Inicio. También observado en Drop. | Abrir Inicio → leer introducción y subtítulo → contar edificios o abrir Ayuda. | Esperado: cantidad coherente con el catálogo.<br>Observado: dos textos «Siete…» frente a ocho edificios; Ayuda ya deriva correctamente ocho. | Detalle visible al iniciar la defensa; no falta ningún acceso. | **P2** | **Observado** en fuente y Drop. | Derivar ambos textos del catálogo o usar una formulación sin cantidad fija. | Mínimo: 10–20 min. | Muy bajo. |
| R-04 | Inicio / explicación de Johnson | La tabla de complejidad no distingue su referencia teórica del costo de la implementación actual. | `index.html:145`: `O(V·E·log V)` bajo «Complejidad de referencia»; `js/johnson.js:230` usa barrido lineal; Algo lo precisa en `js/comun/conocimiento/algoritmos-grafos.js:85`. | Inicio → Fundamentos → tabla de complejidad → contrastar con la explicación técnica de Johnson. | Esperado: distinguir variante con montículo y núcleo implementado.<br>Observado: Inicio no aclara la variante; el núcleo actual cuesta `O(V³ + V·E)`, sin contar las copias didácticas. La expresión de referencia no demuestra por sí sola un cálculo erróneo. | Pregunta docente evitable en una materia de análisis de algoritmos. Se clasifica como falta de contexto, no fallo del motor. | **P2** | Texto **observado**; costo **deducido** del código y coherente con Algo. | Mostrar el costo del núcleo actual y separar explícitamente la referencia teórica. No prometer tiempos medidos a partir de O grande. | Pequeño: 15–30 min. | Muy bajo, documental. |
| R-05 | Ordenamiento | El tooltip «Peor caso: orden inverso» se conserva para todos los métodos, incluido Merge. | `ordenamiento.html:84`; atributo observado con Merge seleccionado. Contraste puntual en memoria del motor Merge. | Seleccionar Merge → señalar «Invertido». Para contrastar, comparar `[8,7,6,5,4,3,2,1]` con `[1,5,3,7,2,6,4,8]`. | Esperado: describir que genera orden descendente, o contextualizar por método.<br>Observado: afirma peor caso universal. En el Merge actual, los casos comparados usan 12 y 17 comparaciones respectivamente; ambos ordenan correctamente. | Simplificación pedagógica incorrecta en un tooltip secundario; no afecta el resultado ni el recorrido principal. | **P2** | Título **observado** en navegador; contraejemplo **observado** en memoria. | Cambiar a «Generar valores en orden descendente». Revisar el tooltip vecino «Caso favorable» con el mismo criterio. | Mínimo: 10–15 min. | Muy bajo. |
| R-06 | Lógica difusa / mapa | La consulta exacta de celdas del mapa bidimensional depende de títulos SVG, sin alternativa tabular ni foco por celda. | `js/difusa/dibujo.js:67`: crea `rect` con `title`; no incorpora interacción por teclado por celda. Observación histórica H-13 aún compatible con la fuente actual. | Generar un mapa de dos entradas e intentar consultar cada valor con teclado. Esta trayectoria completa no se ejecutó en la revisión actual. | Esperado: poder consultar entrada/salida/diagnóstico por una alternativa textual operable.<br>Deducido: hay descripción general del SVG y títulos, pero no una consulta equivalente por celdas. | No bloquea la explicación ordinaria del resultado. Limita una demostración del mapa operada solo con teclado. | **P2**, diferible | **Deducido**; navegación de celdas y lector de pantalla **pendientes de comprobación**. | Añadir consulta textual seleccionable o tabla del muestreo. Conservar el mapa y sus diagnósticos. | Mediano: unas horas. | Bajo a medio; no tocar integración ni cálculo del mapa. |
| R-07 | Lógica difusa / comparación | El JSON comparativo reúne solo el caso actual y el inicial; pueden ser iguales. No constituye una validación amplia. | `js/difusa/app.js:261`: inserta ambos casos sin deduplicar. H-12 sigue vigente como límite. | Cargar un ejemplo, mantener sus entradas iniciales y exportar la comparación. No se descargó el archivo en esta auditoría. | Esperado para una validación posterior: casos distintos y representativos.<br>Deducido: puede exportar dos casos idénticos; el formato no promete cobertura exhaustiva. | Bajo si se explica honestamente el alcance. No decir «validado con MATLAB» ni presentar dos casos como una campaña de validación. | **P3** | **Deducido**; descarga actual y ejecución externa **pendientes**. | Deduplicar y ampliar casos al realizar la validación externa real; conservar el JSON de trabajo como formato separado. | Pequeño para deduplicar; mediano para validar externamente. | Bajo en deduplicación; medio en cambios al protocolo de comparación. |

Las estimaciones son orientativas e incluyen comprobar la interacción afectada; no son compromisos de implementación. R-01 se eleva a P1 por la contradicción entre panel y explicación. R-05 es P2 por estar limitado a una ayuda secundaria y no alterar la interpretación del resultado principal.

## Johnson: contrato final confirmado

Ejemplo existente **«Rutas y tiempos (19 / 58)»**: A→B = 58; A→E = 6; E→D = 5; D→B = 8.

| Estado de la consulta A→B | Destino observado | Rótulos | Modelo matemático |
|---|---|---|---|
| Mínimo activo | 19 / 19 | Acum. / Total | mínimo 19, máximo 58 |
| Máximo activo | 58 / 58 | Acum. / Total | mínimo 19, máximo 58 |
| Comparación sin ruta única | 19 / 58 | mín / máx | mínimo 19, máximo 58 |
| Temporal | 58 / 58 | temprano / tardío | mínimo 19, máximo 58; duración temporal 58 |

Los cuatro estados se observaron en la raíz y nuevamente sirviendo **el Drop**, no una copia supuesta de la raíz. El mínimo proviene de 6 + 5 + 8 = 19 y su detalle acumula 0, 6, 11, 19. El máximo suma el tramo original de 58. La consulta conserva los extremos reales; Acum./Total es un contrato de presentación de la ruta activa, no una sustitución de las distancias matemáticas.

Otros puntos comprobados:

- **Activar/desactivar:** pulsar una ruta de comparación cambia a Acum./Total; pulsarla otra vez restaura mín/máx. Las leyendas identifican la selección y los pesos originales. La desactivación fuera de comparación también está expresamente cubierta por el ajuste previo y su implementación actual; no se repitió toda aquella batería.
- **Conexiones compartidas:** cambiando origen a E y comparando E→B, E→D y D→B reciben las clases de ambas rutas y trazo discontinuo `11px, 5px`. Los estilos son estáticos; no dependen de esperar una reproducción.
- **Temporal:** duración 58, actividad A→B crítica con H=0 y las tres actividades del recorrido de 19 con H=39. Algo explica temprano/tardío y no confunde 19 con duración.
- **Procedimiento:** el primer paso muestra casillas pendientes «—». El último paso sigue la interpretación temporal o la ruta seleccionada. Cambiar de máximo a mínimo dentro del procedimiento mostró 58/58 y luego 19/19; permanecieron **12 pasos**, sin duplicar el final. Por lectura, las etapas intermedias usan sus datos reales de Bellman-Ford, potenciales, reponderación y Dijkstra por origen.
- **Matriz secundaria:** el resultado conserva la matriz de mínimos (`construirTablaDistancias`, `js/johnson/vistas.js:842`) y su distancia A→B=19; los máximos se exponen como consulta adicional. La pestaña «Ver matriz» es la matriz de **adyacencia**, con pesos directos: allí A→B=58 es correcto. No exigir 19 en una celda de peso directo ni llamar a esa tabla matriz de máximos.
- **Dijkstra rápido:** editor → seleccionar A → Más → Dijkstra → cerrar diálogo → Resultado conservó la consulta Johnson y extremos 19/58, sin excepción ni mezcla de estructura.
- **Invalidación real:** editar A→B de 58 a 59 mediante el formulario/modal ocultó el resultado anterior, limpió selección, modelo activo y resaltados. Algo respondió que no había resultado vigente.
- **Controles:** ampliar y restaurar por el mismo botón conservaron datos, incluido el Drop. Escape se comprobó para diálogos, menú y Algo. La ampliación de grafo de Johnson usa su botón de restauración; no se da por supuesto que Escape cierre todas las ampliaciones.

La nota más reciente reemplaza la recomendación antigua de mantener siempre mín/máx en el destino. **No se debe reabrir H-02 basándose solo en que ahora se ve 19/19 o 58/58:** con los rótulos Acum./Total esos pares son correctos. No recomiendo cambiar cálculos para obtener coincidencias visuales.

## Estado de las observaciones anteriores

| Referencia anterior | Estado al cierre de esta revisión |
|---|---|
| H-01, conflicto Johnson/Dijkstra rápido | Atendido; transición reproducida sin error y consulta conservada. |
| H-02, semántica de las dos casillas | Contrato actualizado por el ajuste final; cuatro estados confirmados en fuente y Drop. La recomendación anterior quedó superada. |
| H-03, consecuente difuso estrecho | Atendido. Comprobación puntual actual: triángulo `[0.01,0.02,0.03]`, activación 1, dominio `[0,100]` → centroide **0.02** aunque las 1001 consultas uniformes sean cero. |
| H-04 y H-10, errores eliminados/foco Northwest | La fuente depura errores por IDs vigentes y restaura foco por clave; coincide con FASE 2. No se repitió toda la secuencia de eliminar/deshacer/rehacer ni su prueba de foco. |
| H-05, nombres importados de biblioteca | Atendido por lectura: reserva espacio para sufijos y valida antes de escribir (`js/comun/guardados.js:62`, `:198`, `:243`). No se repitió la importación al límite. |
| H-07, índices Shell | Atendido y observado a 320 px: grupo auxiliar **0, 4, 8**. |
| H-08, generación de combinaciones difusas | Atendido por lectura de validación/captura transaccional (`js/difusa/editor.js:207`). No se repitió la suite previa. |
| H-09, paquete desactualizado | Resuelto en los artefactos actuales: inventarios/hashes/CRC y recorrido breve del Drop aprobados. |
| H-11, costo del mapa difuso | Sigue siendo una cuestión de medición posterior. No se midió latencia con 125 reglas; no se afirma que el mapa sea lento en la demo. |
| H-12 / H-13, comparación y mapa | Límites todavía presentes por lectura: R-07 y R-06. |
| H-14, esperar reproducciones largas | Mitigado; se observó Ir al final con 200 valores, en pausa y sin esperar la reproducción. |
| H-15, aislados/diagonal/ciclo negativo de Johnson | Mensajes corregidos por lectura actual de `vistas.js:275`, `:277`, `:1345`, `:1362`. No se repitieron todos esos ejemplos. |
| H-16, recientes y número de módulos | Recientes difusos y Ayuda corregidos; guardar un trabajo y abrir su biblioteca desde Inicio funcionó. Subsisten solo los dos textos «Siete…»: R-03. |
| H-17, operaciones de Árboles | El alcance se explica expresamente: quitar última inserción, insertar, recorridos y reconstruir. Buscar/eliminar cualquier nodo no es una operación prometida ni un error pendiente. |
| H-18, cobertura automática | La configuración sigue separando suites específicas de ayuda/difusa del comando general. Deuda posterior, sin implicar fallos actuales; no se ejecutó la batería general. |
| H-19, Northwest | Corregido el caso habitual de conservar un cálculo consultable frente a texto rechazado. Queda la combinación adicional de edición válida más inválida descrita en R-01. |

## Máximo cinco acciones antes de presentar

1. **Corregir R-01** en aviso y contexto de Northwest y comprobar únicamente la secuencia descrita, su recuperación y el caso de histórico todavía consultable. Mantener los cálculos.
2. **Precisar la complejidad de Johnson en Inicio** (R-04). Tiene especial valor en la defensa de Análisis de Algoritmos y riesgo técnico mínimo.
3. **Aceptar la variante de pregunta sobre el centroide** (R-02), vinculándola a la explicación existente. Comprobar la pregunta literal y la explicación del resultado vigente.
4. **Cerrar los textos residuales** de número de módulos e «Invertido» (R-03/R-05). Son cambios breves; no justificarían rediseñar Inicio ni el reproductor.
5. **Si se aprueba e implementa algún ajuste**, actualizar después la entrega estática y volver a verificar solo los archivos/interacciones afectados y su paridad. Ensayar el recorrido siguiente con el paquete elegido. **En esta auditoría no se regeneró el paquete ni se publicó.**

Si se presenta la versión actual, el pendiente principal que debe reconocerse es R-01. Las mejoras de mapa y validación externa pueden quedar expresamente fuera de la defensa sin prometer funciones inexistentes.

## Funcionalidades que conviene conservar

- Johnson: motores separados para mínimo, máximo DAG y temporal; pesos originales al reconstruir; selección estática; casillas con significado explícito; matriz secundaria; etapas reales y un solo paso final de reconstrucción.
- Dijkstra: cero válido, rechazo de negativos, distancias desde un origen, separación árbol/ruta y cambio de destino sin recalcular. Las restricciones del editor y del algoritmo están diferenciadas.
- Kruskal: conexiones no dirigidas, mínimo/máximo, componentes/aislados, aceptadas/descartadas y terminología árbol/bosque. No convertirlo en una ruta entre extremos.
- Northwest: balanceo en copia, ficticios, cantidades/costo verificables y aviso de solución inicial factible. Mantener la distinción entre texto pendiente y valor matemático aceptado.
- Ordenamiento: cinco métodos, identificadores para conservar repetidos, índices reales de Shell, pausa, deslizador e Ir al final. No confundir tiempo de reproducción con tiempo de cálculo.
- Árboles: distinción BST/reconstruido, rechazo de duplicados, conservación del árbol/campos ante incompatibilidad y alcance explícito de quitar última inserción.
- Difusa: Mamdani con AND=min, OR=max, peso sobre activación, implicación=min, agregación=max e integración continua por tramos. Mantener los diagnósticos diferenciados y la biblioteca propia.
- Inicio y Algo: ciudad/lista, guías para empezar, recientes por biblioteca y respuestas locales que admiten límites. Guardados por origen y formatos de importación validados.

## Recorrido de demostración: 9 minutos 30 segundos

Usar ejemplos existentes. No abrir el módulo excluido. Evitar listas enormes, grafos densos y mapas extensos durante el recorrido principal.

| Tiempo | Pantalla y acción | Idea que explicar |
|---|---|---|
| 0:00–0:35 | Inicio: seleccionar un edificio, mostrar Vista lista y abrir Johnson. Continuar aunque el video no cargue. | Cada módulo recibe datos, muestra procedimiento y permite interpretar un resultado. Videos opcionales; cálculo y ayuda locales. |
| 0:35–3:05 | Johnson → Ejemplos → «Rutas y tiempos (19 / 58)» → Calcular. Mostrar mínimo, máximo, comparar sin selección y temporal. Abrir un paso inicial y el último. | 6+5+8=19 frente a 58. Acum./Total depende de ruta activa; temprano/tardío es otra interpretación. Modelo y matriz mínima no se alteran. |
| 3:05–4:00 | Dijkstra → «Ceros y empates» → origen A → calcular y cambiar destino. | Cero es válido, distancias desde un origen y ruta concreta. El destino se cambia sin recalcular. Si hay tiempo, mencionar el ejemplo de grupos separados. |
| 4:00–4:50 | Kruskal → «Grupos separados» → mínimo y máximo. | Bosque, tres componentes y F aislado; 3=V−C conexiones. Totales observados: mínimo −1, máximo 4. No hay origen/destino. |
| 4:50–5:45 | Northwest → «Balanceado 2×3 (costo 230)» → balanceo → resolver → un paso y resultado. | 10×2 + 10×3 + 15×4 + 15×8 = 230. Es factible, sin garantía de costo óptimo. Un ejemplo de exceso de oferta está disponible para explicar ficticio sin rellenar otra tabla. |
| 5:45–6:40 | Ordenamiento: usar nueve valores pequeños con repetidos, avanzar/pausar y luego Ir al final. Si se muestra Shell, usar `9,8,7,6,5,4,3,2,1` para el grupo 0,4,8. | Se conservan duplicados; los índices del grupo corresponden a posiciones originales. La reproducción se puede saltar. |
| 6:40–7:30 | Árboles → «Cargar ejemplo de clase», mostrar inorden; en reconstrucción, cargar su ejemplo y aceptar reemplazo. | BST e inorden ordenado; reconstruir produce un árbol binario que no tiene por qué ser BST. La confirmación protege el ejercicio actual. |
| 7:30–9:05 | Difusa → «Velocidad de ventilación» → temperatura 20 → evaluar. Mostrar μ templada=1, R2, agregación, área/momento y centroide 50. Preguntar a Algo «¿Qué significa este resultado?». | El registro y Algo explican el mismo cálculo continuo. Mencionar el caso estrecho 0.02 como comprobación dirigida, sin editar todo el modelo durante la demo. |
| 9:05–9:30 | Guardar un trabajo difuso con nombre → Inicio → reciente → biblioteca. | Guardar conserva una copia local; Exportar/Importar traslada datos entre orígenes. El reciente abre la biblioteca y permite elegir qué cargar. |

El ejemplo Northwest con ficticio y la edición numérica estrecha de difusa están disponibles como ampliaciones si el docente pregunta; no son necesarios para cumplir los 9:30.

## Preguntas posibles del docente y respuestas honestas

| Pregunta | Respuesta |
|---|---|
| ¿Por qué B puede mostrar 19/19 si el máximo es 58? | Con una ruta activa las casillas son Acum./Total de esa ruta. Sin ruta única son mín/máx. El modelo sigue conservando 19 y 58. |
| ¿El máximo también lo calcula Johnson? | No. Johnson obtiene mínimos entre pares; el máximo adicional usa orden topológico y programación dinámica en un DAG. No se ofrece máximo general para grafos cíclicos. |
| ¿Por qué el tiempo total es 58 y no 19? | Temporal analiza duraciones no negativas sobre una red acíclica y la subred entre los extremos. El recorrido más largo fija la duración; los valores temprano/tardío no son la matriz de mínimos. |
| ¿Se están sumando los pesos reponderados? | Se usan internamente en Dijkstra. La distancia se recupera y el recorrido mostrado se verifica sumando pesos originales. |
| ¿Cuál es la complejidad implementada de Johnson? | Su núcleo usa selección lineal en Dijkstra: `O(V³ + V·E)`. Las cotas con montículos pertenecen a otras implementaciones; registrar y dibujar pasos añade trabajo. El texto de Inicio necesita esa precisión. |
| ¿Dijkstra admite pesos negativos? | No en esta interfaz. Cero sí. Para mínimos con negativos se ofrece Johnson y se detectan ciclos negativos. |
| ¿Kruskal encontró una ruta? | Encontró un árbol o bosque de expansión. Con C componentes acepta V−C aristas; el total suma sus pesos, no un trayecto entre dos extremos. |
| ¿Northwest garantiza el óptimo? | No, obtiene una solución inicial factible. Los costos totalizan los envíos, pero no deciden qué celda se asigna primero. No se implementa una fase de optimización posterior como MODI. |
| ¿Inorden siempre entrega valores ordenados? | Solo en un BST. Reconstruir desde recorridos no impone la propiedad de búsqueda ni balanceo automático. |
| ¿Las 1001 muestras determinan el centroide? | No. La versión actual integra por tramos la envolvente lineal con recortes e intersecciones. Las 1001 posiciones son consultas auxiliares. El caso estrecho comprobado produce 0.02 aunque esas consultas sean cero. |
| ¿Se validó con MATLAB? | No se ejecutó MATLAB/Fuzzy Logic Toolbox. Hay recursos para comparar, pero no se certifica equivalencia externa ni su tolerancia hasta realizarla. |
| ¿Algo es una IA generativa conectada? | Es ayuda local con reconocimiento de preguntas y explicaciones construidas desde un contexto acotado del ejercicio. No envía preguntas ni necesita Gemini. Puede no reconocer una reformulación; lo admite. |
| ¿Los trabajos pasan automáticamente a Netlify? | No. Se guardan por navegador y origen. Se trasladan con los formatos Exportar/Importar de cada módulo; no hay sincronización automática entre localhost y otro dominio. |

## Comprobaciones realizadas y límites

| Área | Evidencia nueva de esta revisión | Pendiente o límite concreto |
|---|---|---|
| Inicio / navegación | Ciudad/lista, abrir Johnson desde Inicio, introducción, regreso y navegación por enlaces a los módulos permitidos. Ayuda de Inicio cerró con Escape y devolvió foco. | No se revisaron todas las combinaciones de preferencias ni sesiones simultáneas. |
| Videos | Con solicitudes externas bloqueadas, la introducción mantuvo enlace a YouTube e «Ir al algoritmo»; el módulo funcionó. Alternativas de enlace presentes en los recursos comunes. | Disponibilidad de videos externos y reproducción en la red de presentación pendientes. |
| Johnson | Cuatro estados visuales; activación/desactivación en comparación; etapa inicial y final; cambio de ruta sin pasos duplicados; compartidas; Dijkstra rápido; edición real e invalidación; Algo temporal/máximo/invalidado. | Todos los grafos extremos, nombres largos, ciclos y cruces manuales no se volvieron a ensayar. La geometría evita ciertos cruces de forma heurística; zoom/ajustar/organizar pueden seguir siendo necesarios. |
| Dijkstra | «Ceros y empates»: A→D costo 2, A→B costo 0; cambiar destino conservó el mismo objeto de cálculo. «Grupos separados»: destino F sin camino, tres inalcanzables. | CRUD completo, negativos y conversión dirigido/no dirigido confirmados por fuente y entregas previas; no se repitió toda la secuencia actual. |
| Kruskal | «Grupos separados»: mínimo −1, máximo 4, tres componentes, F aislado, tres aristas y descarte por ciclo identificado. | Edición completa y rechazo de duplicados revisados por lectura; no se repitió toda la suite. |
| Northwest | Resolver 230, reproducir R-01 con entradas reales y recuperar el ejercicio. Tabla resuelta a 320 px en ambos temas. | Balanceo ficticio y purga de errores tras eliminar filas/celdas: lectura actual e historial de FASE 2; recorrido completo actual pendiente. No se afirma que haya reaparecido el error huérfano. |
| Ordenamiento | Cinco métodos visibles; Shell con grupo 0,4,8; salida `[1,1,2,2,3,5,6,9,9]`; pausa; deslizador; Ir al final con 200 valores y reproducción detenida. Contraejemplo puntual Merge para R-05. | No se volvieron a demostrar exhaustivamente los cinco métodos ni su estabilidad en todas las entradas. Sin nueva medición general de rendimiento. |
| Árboles | Ejemplo de ocho nodos; duplicado 5 rechazado; modo reconstruido identificado tras confirmar; inorden incompatible de dos valores dejó árbol de ocho nodos y campos conservados. | Árbol sesgado máximo de 31 nodos, exportación PNG y dispositivos físicos pendientes. No se considera fallo la ausencia declarada de eliminación arbitraria. |
| Difusa | UI de ventilación: temperatura 20, R2 activa, resultado 50, momento 2500/área 50, dos tramos; Algo explica resultado. Puntual en memoria: estrecho 0.02, reglas deshabilitadas → `sin-reglas-activas/null`, entrada `abc` rechazada con mensaje de Temperatura. | Validación visual completa de todos los editores, todas las combinaciones AND/OR/pesos y los estados `activacion-sin-masa`/`fallo-numerico`: lectura, sin nueva ejecución exhaustiva. MATLAB pendiente. |
| Guardados / recientes | Trabajo difuso sintético «Revisión previa» guardado desde UI; reciente en Inicio abrió biblioteca propia y mostró Cargar/Renombrar/Eliminar, sin carga automática. | No se descargaron ni importaron archivos ni se usaron datos reales. Importación/exportación y protección transaccional se revisaron por código/etiquetas; traslado real entre orígenes pendiente. |
| Algo | Preguntas de resultado máximo y total temporal correctas; tras invalidar Johnson no presentó resultado vigente. «¿Y eso?» y pregunta de clima devolvieron límite de cobertura. Resultado difuso coherente; variante no reconocida R-02; contradicción NW R-01. | No es cobertura total de lenguaje natural ni validación de todas las entradas del banco. |
| Diseño adaptable | Escritorio 1440×1000; Johnson medido en ambos temas. Móvil emulado 320×800: Inicio y resultados representativos de los siete módulos permitidos, ambos temas, sin desbordamiento horizontal del documento. SVG/tablas permanecieron dentro de sus superficies o contenedores. | Las mediciones de DOM no certifican legibilidad universal, contraste ni ausencia absoluta de textos cruzados. Navegadores alternativos, zoom del sistema, teclado virtual y equipos físicos pendientes. |
| Menú / diálogos / controles flotantes | Menú móvil y Algo abrieron/cerraron con Escape devolviendo foco. Algo móvil quedó dentro de 320 px y en modo modal. Ampliar/restaurar Johnson funcionó por botón. En difusa, «Generar mapa» desplegado fue visible y su centro recibió el clic, sin cubrirlo Algo. | No se auditó el foco de todos los diálogos ni cada posición de desplazamiento. Una intersección geométrica con botones dentro de `details` cerrados se descartó al comprobar que no eran visibles; no se convirtió en hallazgo. |

No se ejecutó `npm test`, que incluye el módulo excluido. Tampoco se repitieron las suites ya aprobadas de fases anteriores. Las ejecuciones nuevas fueron recorridos dirigidos de interfaz, tres contrastes puntuales en memoria y verificaciones mecánicas del artefacto. No se crearon suites nuevas.

Dos incidencias de instrumentación no se trataron como defectos del producto: cambiar el modo móvil de Puppeteer recarga la página y exige reabrir su etapa; además, la tubería predeterminada de PowerShell sustituía acentos del código de entrada por `?`. La pregunta literal de Johnson se volvió a comprobar preservando Unicode y devolvió la explicación temporal correcta. Los recorridos completados no registraron excepciones de página de la aplicación; el recorrido breve del Drop tampoco registró recursos locales fallidos. Esto no garantiza ausencia de errores fuera de los recorridos ejecutados.

## Sincronización de la entrega Netlify

Se reutilizó el verificador existente `tests/verificar-paquete-fase2.py` y la función de **solo verificación** `verificarPublico()` de `scripts/preparar-netlify.js`. No se invocó la preparación ni el build.

| Artefacto / condición | Resultado observado |
|---|---|
| `public/` | Inventario exacto de 101 archivos permitidos; SHA-256 idénticos a las fuentes públicas seleccionadas. |
| `entrega-netlify/drop/` | Mismos 101 archivos y hashes; recursos locales HTML presentes; scripts de ayuda local incluidos en orden correcto. |
| `entrega-netlify/ciudad-algoritmos-netlify.zip` | 101 entradas, **505786 bytes**, CRC correcto, sin duplicadas; contenido idéntico al Drop y a las fuentes por SHA-256. |
| Página de entrada | `index.html` directamente en la raíz del Drop y del ZIP. |
| Último ajuste de Johnson | Incluido mecánicamente y observado al servir Drop: 19/19, 58/58, 19/58, temporal 58/58; Algo temporal correcto; restauración del grafo conservada. |
| Recursos y privacidad del paquete | Inventario permitido; sin pruebas, bibliotecas de ejercicios, respaldos, configuración local ni secretos en los artefactos comprobados. No se inspeccionaron archivos secretos del proyecto. |
| Ayuda remota | Sin referencias activas a Gemini ni endpoints remotos necesarios para Algo en los recursos públicos comprobados. Los videos/enlaces externos son opcionales. |
| Rutas de entrega | Drop: `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop`.<br>ZIP: `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\ciudad-algoritmos-netlify.zip`. |
| Publicación | **No realizada. Dominio remoto pendiente de comprobación y de autorización posterior.** |

El directorio `entrega-netlify/` contiene además instrucciones y respaldos históricos fuera de Drop; no forman parte del inventario verificado del sitio. El artefacto actual que se evaluó es Drop/ZIP. Si posteriormente se corrigen los hallazgos, esta verificación acredita la versión actual, no futuras modificaciones.
