# Cierre local · Ciudad de los Algoritmos

Revisión iniciada el 3 de noviembre de 2026 para la presentación del jueves 5. Cambios locales, sin commit, push ni publicación.

## Registro de hallazgos

| Hallazgo | Estado |
| --- | --- |
| Johnson permitía bucles, duplicación y pares inversos en varias entradas | Corregido en modelo, interfaz, importación, ejemplos, bibliotecas, restauración e historial |
| Restauración permisiva podía sobrescribir originales incompatibles | Corregido: original protegido, aviso, descarga y habilitación explícita de escrituras |
| Fronteras de modelos bipartitos y árboles aceptaban datos fuera del contrato | Corregido y cubierto por regresiones de modelo y navegador |
| Resultado de grafos podía conservarse tras cambios matemáticos con un indicador incorrecto | Corregido: firma matemática independiente del indicador del llamador |
| Foco perdido al redibujar y selección SVG de árboles con `.click()` inexistente | Corregido: foco por ID y selección compartida por puntero/teclado |
| Atajos actuaban sobre botones o detrás de ventanas | Corregido en Ordenamiento y Johnson; confirmado con interacción de teclado |
| Insertion mostraba un prefijo como definitivo durante intercambios | Corregido: marcas del prefijo realmente ordenado y explicación de su significado |
| Dijkstra/Kruskal no volcaban todos los pasos al imprimir | Corregido: integración con impresión común, tema claro y restauración de paso/tema |
| Avisos largos de recuperación comprimían botones a 320 px | Corregido: ajuste de filas, desplazamiento interno y margen de foco bajo cabecera |
| Etiquetas de nodos resaltados de Johnson tenían poco contraste en tema claro | Corregido: texto blanco sobre sus rellenos oscuros, incluido origen/selección |
| Northwest conservaba una base flex de 260px como altura en móvil; botones de Árboles cortaban texto | Corregido: altura por contenido y etiquetas que pueden ocupar dos líneas |
| Contador extremo de Johnson podía desbordarse; nombres crudos eludían el límite | Corregido: reutilización segura del contador sin cambiar IDs existentes y validación del largo real |
| Bibliotecas podían depurarse perdiendo registros o importar parcialmente nombres inválidos | Corregido: protección del original y rechazo completo antes de fusionar |

## Alcance y contratos finales

Inventario: inicio más siete módulos funcionales. No se añadieron frameworks, backend, otros algoritmos ni funciones ajenas al cierre.

| Módulo | Entrada y relaciones | Números, dimensiones y casos especiales |
| --- | --- | --- |
| Johnson | Grafo dirigido; IDs estables; sin bucles, duplicadas ni dos sentidos entre el mismo par | Hasta 40 nodos/300 conexiones; nombres únicos ≤12 caracteres; enteros ±999999, incluido 0. Vacío editable; cálculo desde 2 nodos; desconexión → ∞. Ciclos de ≥3 permitidos; ciclo negativo impide distancias mínimas |
| Dijkstra | Dirigido o no dirigido; sin bucles/duplicados. En dirigido admite opuestas; en no dirigido A–B y B–A son la misma arista | Hasta 24/96; nombres ≤12; enteros 0…999999. Solo caminos mínimos. Origen=destino →0; inalcanzable →∞. Igualdad conserva primer predecesor, evitando ciclos de predecesores con peso 0 |
| Kruskal | No dirigido, sin bucles ni duplicados inversos; admite ciclos en la entrada y los descarta al resolver | Hasta 24/96; enteros ±999999. Mínimo y máximo; empates deterministas sin afirmar unicidad. Conectado: V−1 aristas; desconectado: bosque V−C. Ejemplo: mínimo 6, máximo 12 |
| Asignación | Bipartito recurso–tarea; IDs estables; sin relaciones internas, referencias inexistentes ni parejas duplicadas | 1…8 por grupo; etiquetas ≤24; enteros ±999999; null/ausencia pendiente, 0 real. Mínimo/máximo, negativos, rectangular y ficticios derivados. Cada elemento real participa como máximo en una pareja; total con valores originales |
| Northwest | Matriz de transporte origen–destino; referencias válidas y costos únicos por pareja | 1…10 por grupo; etiquetas ≤40. Costos 0…999999, hasta 2 decimales, enteros internos ×100; ofertas/demandas enteras 0…999999; null pendiente. Ficticio derivado sin cambiar original. Solución inicial factible; no promete optimalidad |
| Ordenamiento | Selection, Insertion, Bubble, Shell y Merge; conserva valores e IDs de elementos | Interfaz 3…200 enteros 1…99; repetidos válidos. Insertion/Bubble/Merge estables; Selection/Shell no prometen estabilidad. Núcleos prueban también vacío/un elemento. Preparación cooperativa y eventos con checkpoints; velocidad de reproducción separada del cálculo |
| Árboles | Inserción construye BST sin balanceo; reconstrucción produce árbol binario general y no supone BST | Hasta 31 valores únicos −999…999; duplicados rechazados. Preorden+inorden o inorden+postorden; preorden+postorden requiere inorden. Recorridos compatibles; árbol vacío editable. Recupera recorrido/paso en pausa |

Las restricciones de Johnson son una **decisión de esta aplicación**, no una prohibición matemática universal. Los grafos dirigidos y el algoritmo general de Johnson pueden admitir aristas opuestas. El núcleo se sigue contrastando con grafos generales; el editor aplica el contrato de producto en sus fronteras.

La matriz de Johnson es de consulta, no editable. No hay generador aleatorio ni selector dirigido/no dirigido en Johnson: sus ejemplos y todas las cargas pasan por validación; las conversiones grafo/matriz leen el mismo modelo. Dijkstra y Kruskal sí tienen generación y conversión, con su contrato independiente. Árboles permite insertar, seleccionar/consultar, **Quitar última inserción**, vaciar, generar ejemplos, recorrer y reconstruir. Quitar la última inserción retira el último valor de la secuencia de un BST, independientemente del seleccionado; la selección consulta relaciones. No ofrece edición de valores, eliminación arbitraria de un nodo, rehacer ni balanceo automático.

Los límites de cantidades/pesos mantienen las sumas de los problemas de la interfaz dentro del rango entero seguro de JavaScript. Los núcleos rechazan tipos y números inválidos y no omiten referencias rotas. En Northwest, el costo se calcula en unidades escaladas; el balanceo y los ceros básicos conservan ofertas, demandas y una base sin ciclos.

## Estado, operaciones y recuperación

- Johnson rechaza A→A, A→B repetida y la inversa de una conexión existente con los mensajes solicitados. El modelo compara IDs y excluye la arista que se edita. Un rechazo conserva datos, historial y resultado. La interfaz actual edita pesos; la operación de modelo que admite extremos también valida esa exclusión.
- Crear, renombrar, editar, eliminar, cancelar y deshacer/rehacer se verifican con los controles disponibles. Borrar un vértice elimina sus referencias dependientes. Ventanas antiguas de Johnson no aplican una confirmación si el ejercicio cambió mientras estaban abiertas.
- Nombres y posiciones no cambian las distancias. Renombrar regenera etiquetas y pasos; cambiar pesos, extremos, estructura u objetivo invalida resultados. Las reproducciones anteriores se detienen al preparar otros datos. Reiniciar pasos y borrar el ejercicio son operaciones distintas.
- Los siete autoguardados conservan el texto original incompatible. El aviso explica el problema y pausa escrituras; **Descargar original** inicia su exportación exacta. **Usar ejercicio actual** habilita el próximo guardado. Hasta elegirlo, el ejercicio nuevo vive en la sesión y puede exportarse. No se eliminan aristas ni se reemplaza el original por un ejemplo para resolver incompatibilidades.
- La Biblioteca de Johnson identifica grafos incompatibles, permite descargarlos y rechaza cargarlos sin alterar el ejercicio. «Mis trabajos → Exportar» conserva los trabajos antiguos; una biblioteca dañada o con IDs ambiguos queda protegida y descargable completa.
- Archivos de importación limitados a 1 MiB; se validan versión, estructura, referencias y rangos antes de reemplazar datos. Las listas verifican metadatos y todos los trabajos del módulo importado antes de fusionar. Las migraciones compatibles siguen disponibles, incluida Asignación V1 sin truncar columnas. Si V1 es incompatible, se conserva su clave original y también se bloquea la escritura de V2 hasta completar la recuperación explícita.
- Compatibilidad de Asignación V1: una matriz migrable conserva enteros en rango y 0; ausencias, texto, decimales o valores fuera de rango quedan pendientes. Las dimensiones se toman de `values`, sin truncar; las etiquetas se normalizan, se completan y se desambiguan. No se rechaza todo V1 por un valor inválido. Sí se rechazan estructura vacía o mayor de 8×8, filas que no sean listas, versión u objetivo incompatibles. La importación pide confirmar y avisa revisar pendientes; la restauración conserva V1 y guarda el modelo migrado en V2. V2 se valida estrictamente, sin esa conversión. Esto distingue la migración compatible de la protección de un original incompatible.
- Fallos de almacenamiento muestran un aviso persistente; una escritura posterior exitosa lo retira. Árboles completa el guardado diferido al salir y recupera la animación en pausa.
- Las pruebas usan perfiles temporales/contextos independientes, nunca el almacenamiento del navegador habitual del usuario. No se realizaron commits, push, PR, despliegues ni publicaciones.

## Pruebas ejecutadas en la revisión integral

Comprobaciones del 3 de noviembre de 2026. Los recuentos son aserciones/escenarios de cada suite, no porcentajes de cobertura ni una garantía de ausencia de errores. Las iteraciones aleatorias citadas son parte de esas pruebas; no se suman de nuevo al recuento.

Estos resultados históricos se conservan sin modificarlos. El cierre puntual posterior no vuelve a ejecutar las suites masivas; sus comprobaciones se registran por separado al final.

| Comando o archivo | Resultado final |
| --- | --- |
| `npm.cmd test` | 194 comprobaciones correctas, 0 fallidas: estática 35, Johnson 16, Asignación 32, Northwest 26, Ordenamiento 25, Árboles 16, Guardados 19, Foco 3, Grafos 22 |
| `node tests/navegador.js` | 334 correctas, 0 fallidas; 0 errores de consola/página |
| `node tests/ampliacion-navegador.js` | 187 correctas; 0 errores de consola/página |
| `node tests/mejoras-grafos-navegador.js` | 30 correctas; sin errores JavaScript |
| `node tests/regresiones-navegador.js` | 15 regresiones correctas; sin errores JavaScript |
| `node tests/usabilidad-grafos-navegador.js` | 920 correctas; 0 errores de consola/página |
| `npm.cmd run test:responsive` | 2289 correctas, 0 fallidas; 0 errores de consola/JavaScript; ejecución completa tras los últimos ajustes |
| `npm.cmd run test:cierre` | 81 correctas: Johnson 33, Datos 20, Rutas/Ordenamiento 28; sin errores JavaScript |
| `node tests/cierre-johnson-navegador.js` | 33 correctas; archivos reales, rechazos atómicos, cancelación, ciclos y recuperación exacta |
| `node tests/cierre-datos-navegador.js` | 20 correctas; recuperación real de los 3 módulos, V1 incompatible, foco, migración y cancelación |
| `node tests/cierre-rutas-navegador.js` | 28 correctas; recuperación real, firmas, foco, atajos e impresión |
| `node --expose-gc tests/medir-ordenamiento.js --json` | 45 casos completados y resultado ordenado verificado en cada uno |

Referencias independientes: Johnson frente a Floyd-Warshall en 300 grafos, rutas y ciclo reconstruido; Dijkstra en 32 grafos y todos sus orígenes; Kruskal frente a enumeración exhaustiva de bosques en 28 grafos. Asignación compara 300 matrices aleatorias de hasta 6×6 con referencia exhaustiva y prueba casos extremos adicionales de 8×8. Northwest verifica 300 problemas y otros 250 frente a intersecciones de intervalos acumulados. Ordenamiento prueba 300 arreglos en los 5 métodos, estabilidad y 40/100/200 elementos. Árboles verifica 200 estructuras generales con 3 reconstrucciones y profundidad 31.

Las nuevas suites comprueban **archivos descargados físicamente y comparados con el original**; no se da por válida una recuperación solo porque se haya llamado a una función de exportación. La suite visual comprueba que los cambios de viewport no recarguen la página y pierdan el estado que se pretendía revisar.

Durante el trabajo se descartó un recuento visual provisional: la configuración táctil cambiaba al redimensionar y provocaba recargas. Se corrigió el propio test y se repitió la matriz completa. La primera ejecución general produjo 7 fallos por nuevas confirmaciones de reemplazo de Árboles no atendidas por el test; el flujo se actualizó para confirmarlas sin cambiar expectativas matemáticas y la ejecución final dio 334/334.

## Navegador y tamaños

Windows x64; Node v26.12.1; Microsoft Edge 156.0.4314.58 en modo headless, Puppeteer Core externo al repositorio. Servidor local `http://127.0.0.1:8123/`. La conexión al navegador integrado no tenía una instancia disponible; la verificación se realizó con Edge local en contextos aislados.

Ocho páginas en temas claro/oscuro. Viewports: **320×800,375×812,390×844,768×1024,1024×900,1440×950 y 844×390 horizontal**. Estados: inicio/ejemplo, configuración o matriz, procedimiento/resultado donde existen, máximos, nombres largos, validación, aviso de recuperación, ayuda y presentación. Se comprueba ausencia de scroll horizontal global, desplazamiento interno de tablas/listas, foco, Escape, controles visibles y geometría de nodos/etiquetas.

Máximos visuales: Johnson 40/300; Dijkstra/Kruskal 24/96; Asignación 8×8; Northwest 10×10; Ordenamiento 200; Árboles 31 en cadena. Los datos grandes usan desplazamiento interno, zoom o vista completa, sin reducir toda la interfaz a letras diminutas.

Para el reflow al 200% se usó un viewport equivalente 720×475 con escala 2 frente a 1440×950. **No es una comprobación del control de zoom nativo del navegador ni de un gesto físico.** Además se probaron toques emulados para abrir/cerrar menú en las ocho páginas, cargar ejemplos de Dijkstra/Kruskal y desplazar la página fuera del lienzo. La capacidad táctil permanece constante durante cada recorrido; Johnson usa también orientación horizontal. No se certifica el teclado virtual real.

Salida: PNG real rasterizado en Johnson, Dijkstra, Kruskal, Asignación y Árboles; PDF nativo en los 7 módulos; volcado completo de pasos en Johnson, Dijkstra, Kruskal, Asignación y Northwest, en claro y oscuro, con restauración de tema y paso. Se comprobaron colores de texto sobre papel en las 14 combinaciones de módulo/tema. Ordenamiento y Árboles imprimen su vista actual. No se añade exportación PNG a módulos que no la ofrecen.

## Medición de Ordenamiento

Datos completos y entorno en [docs/cierre-medicion-ordenamiento.json](docs/cierre-medicion-ordenamiento.json). Cinco métodos×tres entradas×40/100/200. Máximos por columna, no necesariamente del mismo caso:

| Cantidad | Preparación síncrona | Eventos | Checkpoints | Estimación estructural | Heap retenido tras GC |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 40 | 40,55 ms | 1640 | 13 | 0,95 MiB | 1,12 MiB |
| 100 | 108,85 ms | 10099 | 79 | 6,10 MiB | 6,88 MiB |
| 200 | 576,60 ms | 40093 | 314 | 25,94 MiB | 27,63 MiB |

Intel Core i7-10510U @ 1,80 GHz. Medición puntual en Node con otras comprobaciones de QA activas, no una garantía de latencia en teléfonos. El tiempo instrumental del registro síncrono no equivale al tiempo de animación: la interfaz prepara por lotes, cede el hilo y puede cancelar; la reproducción usa su propia velocidad. El DOM del mapa de pasos permanece acotado.

## Capturas representativas

Las capturas históricas del repositorio se conservan y no se presentan como evidencia nueva. Capturas de este cierre:

| Captura | Estado |
| --- | --- |
| [Inicio oscuro, 390px](docs/capturas/cierre-index-oscuro-390.png) | Catálogo y navegación móvil |
| [Johnson claro, 1440px](docs/capturas/cierre-johnson-claro-1440.png) | Matriz de distancias y ruta a→e→d→c de costo −3 |
| [Dijkstra oscuro, 390px](docs/capturas/cierre-dijkstra-oscuro-390.png) | Grafo y distancias alcanzables/∞ |
| [Kruskal claro, 1440px](docs/capturas/cierre-kruskal-claro-1440.png) | Árbol elegido y resumen del resultado |
| [Asignación oscuro, 1440px](docs/capturas/cierre-asignacion-oscuro-1440.png) | Asignación y valores originales |
| [Northwest claro, 390px](docs/capturas/cierre-northwest-claro-390.png) | Solución inicial de transporte |
| [Ordenamiento oscuro, 390px](docs/capturas/cierre-ordenamiento-oscuro-390.png) | Máximo 200 elementos y desplazamiento interno |
| [Árboles claro, 1440px](docs/capturas/cierre-arboles-claro-1440.png) | Árbol profundo de 31 nodos |
| [Impresión Kruskal](docs/capturas/cierre-impresion-kruskal-claro.png) | Primera página renderizada del PDF real: grafo, decisión y tabla |

Se inspeccionaron visualmente las nueve capturas finales. El PDF de Kruskal se volvió a abrir y renderizar con PDF.js: 5 páginas; se comprobó texto hasta la última y se inspeccionó visualmente la primera. No se afirma haber inspeccionado visualmente todas las páginas de todos los PDF.

## Limitaciones comprobadas

- No se probó un teléfono físico, su teclado virtual real, Safari/iOS, Firefox ni un proyector del aula. La emulación de escritorio no certifica esos entornos.
- El reflow equivalente al 200% cubre disposición y accesibilidad por tamaño; queda pendiente la comprobación manual con el zoom nativo.
- Los videos de los 7 módulos están registrados y sus controles de acceso/retorno se prueban. Dijkstra usa `UnsRfl6xw2o` y Kruskal `Wo-Pk0Iq3oU`. La reproducción externa de YouTube, permisos de la cuenta y conectividad del aula no se certifican. La presentación indica que requiere internet y permite ir al algoritmo.
- Los datos se guardan por origen/navegador y no se sincronizan entre equipos. Exportar es necesario para trasladarlos; borrar datos del navegador elimina ese almacenamiento.
- Northwest entrega una solución inicial factible; no incorpora MODI/Vogel. Los árboles BST no se balancean automáticamente. Los límites del editor y de sus matrices son deliberados.
- No se encontró un error pendiente de cálculo en los casos comprobados; esto no prueba ausencia absoluta de errores ni cubre entradas/dispositivos fuera de los contratos descritos.

## Guion breve para la defensa

1. Iniciar `npm.cmd start`, abrir la dirección usada habitualmente (`http://localhost:8123/` o `http://127.0.0.1:8123/`) y comprobar tema/tamaño del proyector. Conservar ese origen para recuperar trabajos. Tener un JSON exportado como respaldo.
2. Johnson: cargar «Pesos negativos (clásico)», intentar A→A y una inversa; explicar que son reglas del editor. Mostrar la matriz (0≠ausencia), q, Bellman-Ford, potenciales y reponderación. Resultado esperado fila a: `[0,1,-3,2,-4]`; ruta a→e→d→c, total −3. Cargar ciclo negativo: suma −1, sin distancias mínimas.
3. Dijkstra: usar ejemplo, elegir origen y destino; mostrar relajaciones, ruta y un vértice inalcanzable. Explicar pesos no negativos y que dirigido admite opuestas.
4. Kruskal: mostrar orden y descarte de un ciclo; ejemplo mínimo 6 y máximo 12. En un grafo desconectado explicar el bosque y V−C.
5. Asignación: editar un valor en matriz y verlo en el grafo, distinguir pendiente/0, resolver y mostrar ficticio si es rectangular; total con valores originales.
6. Northwest: ejemplo con costo 230, balanceo si corresponde, agotamiento simultáneo y 0 básico. Aclarar que se obtiene solución inicial, sin prometer mínimo.
7. Ordenamiento: Insertion con repetidos, pausar/retroceder y explicar prefijo ordenado. Mostrar 200 elementos con scroll interno; cambiar velocidad no cambia los conteos.
8. Árboles: insertar BST, recorrer y reconstruir con inorden más otro recorrido. Explicar por qué preorden+postorden no basta. Guardar, recargar y comprobar que vuelve en pausa.
9. Abrir ayuda/video, regresar sin perder el ejercicio, mostrar impresión y exportar JSON. Si aparece recuperación, descargar primero el original y explicar la pausa del autoguardado.

## Cierre puntual de documentación y uso

Se contrastaron README, ayudas y código sin cambiar algoritmos ni ampliar operaciones. Se corrigieron las descripciones de impresión y PNG, se distinguió navegador comprobado de compatibilidad prevista y se detallaron los dos caminos de Asignación V1: migración tolerante o rechazo de una estructura incompatible. Las ayudas distinguen las reglas de Johnson de Dijkstra y añaden guía para continuar tras un rechazo. Árboles ahora rotula «Quitar última inserción» y explica que no elimina el nodo seleccionado.

Impresión confirmada en el código: `registrarImpresionPasos()` se configura en Johnson, Dijkstra, Kruskal, Asignación y Northwest para sus vistas de procedimiento. Ordenamiento y Árboles usan impresión de la vista actual con CSS de papel, sin volcar su historial. PNG comparte `exportarSvgComoPng()` en Johnson, Dijkstra, Kruskal, Asignación y Árboles. Las ayudas y el árbol de archivos del README reflejan esa lista.

Pasada dirigida realizada en Edge 156.0.4314.58 headless, con contextos y almacenamiento temporales en `http://127.0.0.1:8123/`, sin tocar el perfil habitual ni cambiar el origen. No se reprodujo un fallo del producto en estos casos:

- Johnson: rechazos de bucle, duplicada e inversa conservan datos, historial y resultado; renombrar con Enter conserva distancias y actualiza etiquetas; cambiar un peso invalida el cálculo.
- Los siete módulos: abrir ejemplo, completar recorrido principal, guardar, recargar y recuperar desde «Mis trabajos» en el mismo origen; ayudas con Enter/Escape y retorno del foco. Se comprobaron las aclaraciones nuevas de reglas, migración y alcance.
- Ordenamiento con 40 y 200 valores: reproducir, pausar, retroceder y terminar con resultado ascendente.
- PNG real en los cinco módulos documentados; PDF nativo con conteo completo de pasos en Johnson, Dijkstra, Kruskal, Asignación y Northwest. Ordenamiento y Árboles no generaron volcado de pasos y conservaron la impresión de su vista actual.
- Pantallas de riesgo a 320×800, 390×844 y 844×390: editor y diálogo de Johnson, Northwest 10×10 con etiquetas largas y scroll interno, Ordenamiento con 200 valores. Sin desborde horizontal global; el cambio de orientación comprobado conservó los datos.

Se intentó Ctrl++ en Edge headless sin observar cambio de zoom. Solo se verificó el viewport equivalente 720×475 con DPR 2: **emulación de reflow, no zoom nativo al 200 %**. No se probaron teléfono físico, teclado virtual real ni proyector.

Verificación relacionada: `node tests/verificar.js` dio 35 correctas y 0 fallidas; comprobaciones de sintaxis de los JavaScript tocados, enlaces locales de README/informe y revisión del diff sin errores de espacios. Estas ejecuciones de navegador fueron dirigidas y fragmentadas; se registran sus casos, sin inventar un recuento unificado ni sumarlos a los resultados históricos. No se repitieron las suites masivas ni se añadieron informes o suites al repositorio.

## Comprobación presencial pendiente del usuario

**Todas las casillas siguientes quedan sin realizar por el agente.** Requieren tus dispositivos o una comprobación manual del zoom nativo; no representan pruebas ya ejecutadas.

Conserva la dirección que usas habitualmente: `localhost` y `127.0.0.1` tienen almacenamientos separados, aunque el puerto sea el mismo. No se cambia automáticamente el origen ni se migran datos entre ambos. Si no aparecen tus trabajos, comprueba primero la dirección original.

- [ ] Teléfono real: ingresar datos con el teclado virtual abierto y comprobar que el campo y sus botones siguen accesibles.
- [ ] Abrir y cerrar el menú y las ayudas.
- [ ] Desplazarse fuera del grafo y dentro de las tablas.
- [ ] Cambiar la orientación sin perder el ejercicio.
- [ ] Probar el zoom nativo del navegador al 200 %.
- [ ] Probar el modo presentación y la legibilidad en el proyector.
- [ ] Abrir los ejemplos preparados sin depender del video.
- [ ] Recuperar un trabajo guardado desde la misma dirección habitual.
- [ ] Exportar un JSON de respaldo y conservarlo fuera del navegador.
