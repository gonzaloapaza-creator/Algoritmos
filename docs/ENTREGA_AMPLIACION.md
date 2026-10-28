# Ampliación local · 26/10/2026

Ordenamiento ampliado a 200 elementos y módulos completos Dijkstra/Kruskal integrados en siete zonas de la ciudad. Se preservaron los cambios locales previos, entregas, guardados y capturas históricas. Sin commits ni subidas.

## Cambios

- Ordenamiento: cinco métodos, 3–200 enteros de 1–99, repetidos con IDs, controles y contadores conservados. Eventos compactos/checkpoints cada 128, preparación cancelable en lotes de 8 ms/256 eventos y mapa DOM de hasta 120 marcas. Barras consultables para más de 12 datos; pinos para los pequeños.
- Dijkstra: dirigido/no dirigido, no negativos, distancias completas, barrido lineal y relajaciones reales. Conversión explícita con resolución de pesos opuestos.
- Kruskal: mínimo/máximo, negativos/cero, Union-Find y decisiones reales. Bosque V−C, componentes y aislados cuando está desconectado.
- Ambos incluyen CRUD SVG/formularios, movimiento, zoom, historial, ejemplos, generación, JSON no destructivo, guardados independientes, trabajos y PNG. Renombrar/mover conserva resultados; cambios matemáticos los invalidan. Restauración pausada y foco accesible.
- Ciudad de siete edificios con catálogo común, lista, recientes y ambos temas. Corregido el desborde de Merge en móvil.

## Mediciones

Comando reproducible: `node --expose-gc tests/medir-ordenamiento.js`. Windows x64, Node v26.12.1, Intel i7-10510U @ 1.80 GHz. Se midieron 45 casos: cinco métodos, entradas ordenadas/inversas/repetidas y tres tamaños; un proceso aislado por caso. Máximos observados por columna:

| Datos | Preparación síncrona | Eventos | Checkpoints | Estimación estructural | Heap retenido tras GC |
|---:|---:|---:|---:|---:|---:|
| 40 | 15,25 ms | 1.640 | 13 | 0,95 MiB | 1,12 MiB |
| 100 | 121,40 ms | 10.099 | 79 | 6,10 MiB | 6,88 MiB |
| 200 | 655,20 ms | 40.093 | 314 | 25,95 MiB | 27,63 MiB |

El límite elegido es 200 por este coste de memoria y preparación, dividido en tareas cortas en navegador; no es universal. La estimación recorre objetos/referencias reales; el heap es una medición distinta tras GC. El tiempo síncrono de referencia no incluye las esperas de preparación cooperativa ni mide la velocidad de animación. El navegador verificó que los temporizadores y la cancelación responden durante la preparación de 200 elementos. No se necesitó worker ni ampliar el benchmark.

Grafos: límite de interfaz 24 vértices/96 aristas. En ese caso con semilla 1703 y diez ejecuciones tras calentamiento, medianas Dijkstra 3,272 ms y Kruskal 1,690 ms; SVG en Edge 2,4–4,6 ms por renderizado. Dijkstra usa núcleo O(V²+E) y registro O((V+E)V); Kruskal usa O(E log E + E α(V)) y estados de componentes O(EV). README detalla contratos, desempates y formatos v1 independientes.

## Verificación

- `npm.cmd test`: 172 correctas, 0 fallidas; incluye lint y las suites anteriores, 23 pruebas de Ordenamiento y 20 de grafos. Dijkstra se compara con Floyd-Warshall en 32 grafos con semilla/todos los orígenes; Kruskal con enumeración exhaustiva en 28 grafos para ambos objetivos.
- `node tests/ampliacion-navegador.js --capturas`: 185 correctas, sin errores de consola/página. CRUD, historial, pesos, invalidación, restauración, importación inválida no destructiva, JSON/PNG reales, accesibilidad y Ordenamiento grande.
- Tras corregir la devolución de foco al cargar trabajos nuevos: `node tests/ampliacion-navegador.js --grafos`, 127 correctas sin errores, y `node tests/guardados.test.js`, 19 correctas. Se repitió solo el área afectada antes de `npm test` final.
- `node tests/ciudad-navegador.js`: 338 correctas, 0 fallidas, sin errores de consola/página.
- `npm.cmd run test:navegador`: 239 correctas, 0 fallidas, sin errores de consola/página; sin regenerar capturas históricas.
- Revisión visual de inicio y ambos módulos nuevos en los cuatro anchos y muestras claras/oscuras, más Ordenamiento grande. Nuevas capturas exclusivamente `docs/capturas/ampliacion-*`.
- Revisión del diff y `git diff --check` sin errores de espacios. Se conserva el código de Johnson, incluidos sus pesos/ciclos negativos.

## Archivos y límites de la revisión

Principales: `dijkstra.html`, `kruskal.html`, `js/grafos/`, `css/grafos.css`; Ordenamiento (algoritmos, estado, dibujo, controlador, HTML/CSS); catálogo/ciudad/guardados comunes; `js/config.js`, pruebas y README. Las APIs antiguas de Ordenamiento consultan snapshots nuevos a demanda cuando hay más de 12 datos; la interfaz usa directamente el registro compacto. La persistencia guarda datos y paso, no decenas de miles de eventos.

El máximo correcto del ejemplo de Kruskal es **12**, con B–D=5, A–C=4 y C–D=3. La propuesta de peso 10 es un árbol válido, pero no máximo. El mínimo solicitado sí es 6.

Se consultaron ambos enlaces facilitados: el título de [fgdCNuGPJnw](https://youtu.be/fgdCNuGPJnw) identifica Dijkstra; [Wo-Pk0Iq3oU](https://youtu.be/Wo-Pk0Iq3oU) no pudo identificarse. No se recuperó contenido/transcripción revisable y no se les atribuyen pasos ni se asigna el segundo a Kruskal. La lógica sigue la implementación matemática estándar. Verificaciones de navegador realizadas con Edge headless/Puppeteer disponible; no equivalen a pruebas en teléfonos físicos u otros motores. No quedan pendientes funcionales detectados.

Abrir con `npm start` (`npm.cmd start` en PowerShell) y `http://localhost:8123`.

## Revisión de usabilidad y responsive · Dijkstra y Kruskal

- Navegación guiada con instrucciones por etapa, «Continuar», «Ver resultado» y regreso al procedimiento. El foco y el desplazamiento llevan al contenido elegido sin quedar bajo la barra fija.
- Explicación y reproducción inmediatamente debajo del grafo; tabla de decisiones al lado en escritorio y debajo en móvil. Opciones avanzadas plegables para reducir la cantidad de controles iniciales.
- Dijkstra muestra la suma de distancia conocida y peso, el cambio de predecesor y «Sin camino» para los vértices inalcanzables al finalizar. Kruskal explica el orden mínimo/máximo, los grupos que se unen y los descartes por ciclo.
- Encuadre automático del grafo completo, «Ver todo», zoom y selección por listas. Se conservan las coordenadas del ejercicio; etiquetas legibles al cambiar de ancho, tablas móviles con texto ajustado y controles principales de al menos 44 px.
- Pesos anclados al tercio de su propia arista, con separación en píxeles y alternativas de posición para evitar superposiciones. Se corrigieron los pesos confundibles del cruce de Kruskal y el texto recortado del estado de Dijkstra.
- Revisión en Edge headless a 320, 390, 768 y 1440 px, temas claro y oscuro, estados vacíos y las cuatro etapas. Incluye teclado, cambio de tamaño en vivo, zoom, selección y casos de uno y 24 vértices/96 aristas. Capturas nuevas: `docs/capturas/revision-*`; no se regeneraron las históricas.
- Verificación: `npm.cmd test`, 172 correctas; `node tests/ampliacion-navegador.js --grafos`, 127 correctas; `node tests/usabilidad-grafos-navegador.js --capturas`, 920 correctas y ningún error de consola/página. Las seis capturas finales se inspeccionaron visualmente. El ajuste final de etiquetas pasó además la verificación estática y 16 escenarios de geometría; `git diff --check` sin errores de espacios.
