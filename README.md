# Ciudad de los Algoritmos

Proyecto de la materia **Análisis de Algoritmos** del grupo **Los Fanáticos del Nabo**: aplicación web educativa de investigación de operaciones y estructuras de datos. Siete módulos:

| Categoría | Módulo | Entrada | Resultado |
|---|---|---|---|
| Grafos y rutas | **Johnson** | Grafo dirigido con pesos enteros (editor visual o ejemplos) | Resolución paso a paso, distancias entre todos los pares y rutas |
| Grafos y rutas | **Dijkstra** | Grafo dirigido o no dirigido, pesos no negativos y origen | Distancias a todos los vértices, árbol de caminos mínimos y ruta opcional |
| Grafos y rutas | **Kruskal** | Grafo no dirigido ponderado, objetivo mínimo/máximo | Árbol o bosque de expansión y peso total |
| Asignación | **Asignación (método húngaro)** | Grafo bipartito recursos–tareas o matriz | Asignación óptima, total y procedimiento completo |
| Transporte | **Esquina noroeste** | Matriz de costos, oferta y demanda | Solución inicial factible paso a paso |
| Ordenamiento | **Ordenamiento (Bowling)** | 3–200 enteros entre 1 y 99 | Selection, Insertion, Bubble, Shell y Merge Sort animados con pinos, pseudocódigo e historial |
| Árboles | **Árboles binarios** | 1–31 enteros únicos entre −999 y 999, o recorridos | Árbol SVG, recorridos animados y reconstrucción validada |

Sin compilación, dependencias, backend ni base de datos: HTML, CSS y JavaScript planos. Los siete módulos ofrecen ayuda textual y una presentación en video. Dijkstra usa `UnsRfl6xw2o` y Kruskal, `Wo-Pk0Iq3oU`.

El inicio es una ciudad SVG con siete zonas seleccionables y un panel con entrada, resultado y acceso a cada módulo. En móvil, las escenas se conectan en una columna y el acceso al módulo seleccionado permanece visible mientras recorres la ciudad. «Vista lista» ofrece el mismo catálogo por categorías. La vista y la pausa de demostraciones se recuerdan en `ui.inicio.vista.v1` y `ui.inicio.movimiento.v1`; se respeta el movimiento reducido del sistema. Los trabajos recientes usan la biblioteca local existente: abren «Cargar» sin reemplazar el ejercicio hasta confirmar. Fundamentos, videos y equipo continúan al final del inicio.

### Equipo

| Integrante | Rol |
|---|---|
| Gonzalo Gabriel Apaza Ticona | Líder del grupo |
| Roy Brian Alarcon Chambi | Integrante |
| Alan Ariel Aquino Carvajal | Integrante |
| David Alessandro Chuquimia Candia | Integrante |
| Samuel Denis Villca Castro | Integrante |

---

## 1. Ejecutar

```bash
# Desde la carpeta del proyecto
npm start                    # servidor Node sin dependencias, solo 127.0.0.1:8123
```

Abrir `http://localhost:8123`. El servidor también acepta `http://127.0.0.1:8123`; conserva la dirección que ya utilizabas para acceder a tus trabajos, pues cada origen tiene su propio almacenamiento. También funciona abriendo los `.html` directamente. Como alternativa, `python -m http.server 8123 --bind 127.0.0.1`.

Páginas: `index.html`, `johnson.html`, `dijkstra.html`, `kruskal.html`, `asignacion.html`, `northwest.html`, `ordenamiento.html` y `arboles.html`.

Parámetros útiles: `?intro=no` salta la presentación con video; `index.html?simular=10` muestra un catálogo simulado (entradas marcadas «Próximamente», nunca enlazadas) para revisar el diseño con muchas entradas.

Navegadores: cualquiera moderno (Pointer Events, ResizeObserver, `dvh/svh`, `:has()`, `aspect-ratio`).

---

## 2. Estructura

```
grafo/
├── index.html               Ciudad interactiva, catálogo/lista, recientes, fundamentos, videos y equipo
├── dijkstra.html            Caminos mínimos desde un origen; editor y pasos independientes
├── kruskal.html             Árbol/bosque de expansión mínimo o máximo
├── johnson.html             Johnson: grafo → matriz → paso a paso → resultado
├── asignacion.html          Asignación: grafo → matriz → resultado → procedimiento
├── northwest.html           Esquina noroeste: datos → balanceo → resolución → resultado
├── arboles.html             Árboles: inserción, recorridos y reconstrucción
├── styles.css               Base compartida: tokens, botones, formularios, tablas, mensajes, modal, pasos
├── css/
│   ├── shell.css            Cabecera compacta, barra lateral plegable, inicio, presentación con video, pie
│   ├── ciudad.css           Ciudad isométrica, escenas móviles, panel y temas del inicio
│   ├── johnson.css          Editor de grafos, vistas por pasos, grafo de solo lectura, hojas
│   ├── asignacion.css       Vistas, grafo bipartito, matriz y procedimiento de asignación
│   ├── northwest.css        Matriz de transporte, balanceo, pasos y resultado
│   ├── ordenamiento.css     Pista y pinos, contador de pasos, pseudocódigo y paneles auxiliares
│   ├── arboles.css          Árbol SVG, controles, reconstrucción y recorridos
│   └── impresion.css        Hoja de impresión (media="print"): sin interfaz, tablas completas, pasos volcados
├── app.js                   Punto de entrada de Johnson (botones, menú «Más», atajos)
├── js/
│   ├── config.js            Constantes y límites de toda la aplicación
│   ├── comun/
│   │   ├── catalogo.js      Catálogo: id, nombre, categoría, descripción, ruta, icono, video
│   │   ├── navegacion.js    Barra lateral + cabecera construidas desde el catálogo
│   │   ├── intro.js         Presentación con video (YouTube nocookie) antes del algoritmo
│   │   ├── inicio.js        Selección de zonas, lista, preferencias y recientes
│   │   ├── ciudad.js        Ilustraciones SVG propias de los siete edificios
│   │   ├── dialogo.js       Ventana modal compartida (confirmar / informar / pedir dato)
│   │   ├── notificaciones.js  Toasts
│   │   ├── guardados.js     «Mis trabajos»: guardar, cargar, renombrar, eliminar, exportar e importar por módulo
│   │   ├── exportarImagen.js  SVG → PNG copiando los estilos calculados (Johnson, Asignación y Árboles)
│   │   ├── tema.js          Tema claro/oscuro (ui.tema.v1 o preferencia del sistema); se carga en <head>
│   │   ├── presentacion.js  Modo presentación para proyector (Alt+P, solo escritorio)
│   │   ├── impresion.js     Al imprimir, vuelca todos los pasos del procedimiento en tema claro
│   │   └── utilidades.js    limitar(), escaparHtml() (se carga en todas las páginas)
│   ├── grafos/              Modelo, algoritmos puros, editor SVG y controlador Dijkstra/Kruskal
│   ├── asignacion/
│   │   ├── modelo.js        Modelo con ids estables, pendientes, serialización v2 y migración v1
│   │   ├── validacion.js    Validación de valores y nombres
│   │   ├── hungaro.js       Método húngaro completo + verificación por fuerza bruta
│   │   ├── estado.js        Estado del módulo, autoguardado, deshacer/rehacer, vigencia del resultado
│   │   ├── grafo.js         Grafo bipartito SVG: dibujo, zoom/pan, selección, conectar, arrastre
│   │   ├── matriz.js        Matriz editable y resumen de validación
│   │   ├── resultado.js     Resolución y vista de resultado
│   │   ├── procedimiento.js Pasos reales del método húngaro (anterior/siguiente/reiniciar)
│   │   └── app.js           Conexión de vistas, botones y atajos
│   ├── northwest/
│   │   ├── modelo.js        Modelo de transporte (costos escalados ×100), ejemplos, serialización
│   │   ├── validacion.js    Costos (coma/punto, 2 decimales), cantidades enteras, etiquetas
│   │   ├── balanceo.js      Balanceo con ficticio (derivado, nunca guardado)
│   │   ├── noroeste.js      Algoritmo puro + degeneración + verificación (sumas, base, ciclos)
│   │   ├── estado.js        Estado, autoguardado, deshacer/rehacer
│   │   ├── tabla.js         Tablas: entrada editable, balanceada, por paso, final
│   │   └── app.js           Vistas, botones y atajos
│   ├── arboles/
│   │   ├── modelo.js        Inserción BST, generador y recorridos puros
│   │   ├── validacion.js    Validación estricta de nodos, rangos y entradas
│   │   ├── reconstruccion.js Reconstrucción desde preorden/inorden e inorden/postorden
│   │   ├── estado.js        Estado y persistencia independiente arboles.v1
│   │   ├── dibujo.js        Visualización SVG, zoom y centrado
│   │   └── app.js           Formularios, recorridos animados y eventos
│   ├── johnson/
│   │   ├── ejemplos.js      Grafos de ejemplo (posiciones relativas al área)
│   │   └── vistas.js        Vistas por pasos, resolución, resultado, grafo de solo lectura, ejemplos
│   └── (Johnson) johnson.js (algoritmo puro + registro de pasos), estado.js, almacenamiento.js,
│       interfaz.js, dibujo.js, modal.js, acciones.js, matriz.js, biblioteca.js, dijkstra.js,
│       interaccion.js, zoom.js, deshacer.js
├── tests/
│   ├── cargar.js            Carga scripts clásicos en un contexto `vm` de Node
│   ├── asignacion.test.js   Húngaro, validación, modelo, migración
│   ├── northwest.test.js    Esquina noroeste, balanceo, validación, modelo
│   ├── ordenamiento.test.js Selection/Insertion/Bubble/Shell/Merge: historial, conteos, estabilidad, entrada y persistencia
│   ├── arboles.test.js      BST, validación, generación y reconstrucción desde recorridos
│   ├── johnson.test.js      Johnson vs Floyd-Warshall, ciclos negativos, ejemplos
│   ├── guardados.test.js    Biblioteca de trabajos: insertar/reemplazar, renombrar, eliminar, exportar/importar, límites
│   ├── verificar.js         `npm run lint`: sintaxis de los .js, rutas y orden de <script>, ids duplicados, estructura común de cada página
│   └── navegador.js         Pruebas en Edge headless (puppeteer-core) + capturas
└── docs/capturas/           Capturas de escritorio y móvil generadas por tests/navegador.js
```

### Convenciones

- Scripts clásicos sin módulos ES: cada archivo declara funciones globales; el orden de carga en cada HTML es significativo (datos → lógica → estado → vistas → `app.js`).
- Nombres del dominio en español. Sin `class`.
- Texto del usuario siempre por `textContent` o `escaparHtml()`.
- **Los estados no se mezclan**: `estado` (Johnson), `estadoAsignacion` y `estadoNorthwest` son objetos independientes con sus propias claves de almacenamiento.
- Lógica matemática sin DOM (`hungaro.js`, `noroeste.js`, `balanceo.js`, `johnson.js`, `johnson/ejemplos.js`, modelos y validaciones): se prueba en Node.

### Ordenamiento y árboles

Ordenamiento conserva identificadores estables para pinos repetidos y limita las entradas a 3–200 enteros de 1 a 99. Shell Sort usa saltos `floor(n/2)` y luego `floor(salto/2)` hasta 1; no fija elementos antes de la pasada final. Merge Sort realiza divisiones recursivas y mezcla estable (elige primero la mitad izquierda en caso de empate). La interfaz conserva eventos compactos y un punto de recuperación cada 128 eventos; reconstruye como máximo 127 eventos al consultar un paso. Las APIs clásicas consultan snapshots a demanda para más de 12 elementos. Las comparaciones cuentan comparaciones entre valores y los movimientos cuentan intercambios, escrituras al auxiliar y copias de segmentos.

Árboles limita sus valores a −999…999 y 1…31 nodos. La sección de creación inserta valores únicos en un árbol binario de búsqueda sin balanceo; la sección de reconstrucción no supone orden BST. Preorden+inorden o inorden+postorden determinan la estructura; preorden+postorden requiere también inorden, y cuando se ingresan los tres recorridos se comprueba exactamente el tercero. Los recorridos aceptan enteros separados por comas, espacios o saltos de línea. Los datos se guardan bajo `arboles.v1`, se validan al restaurar y no reanudan una animación.

### Capacidad de Ordenamiento

El límite de esta implementación es 200 datos, manteniendo el rango 1–99 y los repetidos. A partir de 13 se usan barras con desplazamiento interno, selección por ID y consulta accesible de posición/valor; los arreglos pequeños conservan pinos cómodos. Se conservan todos los eventos, no un nodo DOM por evento: el mapa resume como máximo 120 marcas. La preparación cede cada 8 ms o 256 eventos y se cancela por token; editar el texto no lanza cálculos completos. El deslizador agrupa actualizaciones mediante `requestAnimationFrame`. La reproducción conserva cada paso y su velocidad es independiente del tiempo de preparación.

Medición reproducible: `node --expose-gc tests/medir-ordenamiento.js`. Windows x64, Node v26.12.1, Intel i7-10510U @ 1.80 GHz; 45 casos (cinco métodos × ordenado/inverso/repetidos × 40/100/200). Máximos observados por columna:

| Datos | Preparación síncrona | Eventos | Checkpoints | Memoria estructural estimada | Heap retenido medido tras GC |
|---:|---:|---:|---:|---:|---:|
| 40 | 15,25 ms | 1.640 | 13 | 0,95 MiB | 1,12 MiB |
| 100 | 121,40 ms | 10.099 | 79 | 6,10 MiB | 6,88 MiB |
| 200 | 655,20 ms | 40.093 | 314 | 25,95 MiB | 27,63 MiB |

Se eligió 200 para conservar este rango de memoria y dividir la preparación en tareas cortas, sin worker. No es un máximo universal. Los tiempos anteriores miden CPU síncrona de referencia; la preparación cooperativa incluye esperas. La estimación recorre las estructuras reales y sus referencias compartidas; el heap retenido es otra medida, tomada en procesos aislados. Persistencia v1 guarda únicamente valores, método, velocidad y paso; regenera el historial en pausa.

### Dijkstra y Kruskal

Ambos editores admiten hasta 24 vértices y 96 aristas, IDs estables, nombres de hasta 12 caracteres, sin bucles ni duplicados. El límite prioriza la legibilidad del editor ampliable y las listas; en el caso medido 24/96, las medianas del núcleo fueron 3,27 ms para Dijkstra y 1,69 ms para Kruskal (10 ejecuciones tras calentamiento). El registro didáctico está incluido; no es una garantía para otros equipos. El SVG encuadra el grafo completo al abrirlo y al redimensionar; «Ver todo» recupera esa vista después de usar «Zoom y más». Hay formularios alternativos de selección, peso y posición. Los nombres largos se abrevian dentro del nodo y se consultan completos en listas y etiquetas accesibles.

Las cuatro etapas incluyen instrucciones, «Continuar», «Ver resultado» y retorno al procedimiento, con foco en la etapa elegida. La explicación y los controles de reproducción aparecen inmediatamente debajo del grafo; las decisiones se muestran al lado en escritorio y debajo en móvil. Dijkstra explica cada suma de distancia y peso y distingue «Sin camino» al terminar; Kruskal explica el orden de revisión, los grupos conectados y los ciclos descartados. Las opciones avanzadas se despliegan cuando se necesitan.

La bienvenida permite cargar un ejemplo o enfocar la creación del primer punto. Los formularios explican «punto/vértice» y «conexión/arista»; Enter añade puntos y conexiones, y la edición de elementos existentes se despliega por separado. Las cuatro etapas mantienen sus nombres visibles en móvil. El procedimiento tiene una barra de avance y destaca la fila actual. Los resultados resumen las cifras reales: en Dijkstra, cada tarjeta de destino muestra su ruta sin repetir el cálculo, con opción de volver a todos los caminos; Kruskal resume peso, conexiones elegidas y grupos.

Johnson conserva las coordenadas al redimensionar, importar o recuperar un grafo: se adapta el encuadre, sin sobrescribir su distribución. El botón de porcentaje encuadra la red completa. Espacio selecciona un elemento SVG, Enter permite editarlo y las flechas conservan la selección y el foco. Los nombres automáticos respetan las mayúsculas/minúsculas y la importación rechaza conexiones repetidas con el mismo origen y destino.

- **Dijkstra:** dirigido o no dirigido, enteros 0…999999. Calcula todas las distancias con lista de adyacencia y barrido lineal de pendientes: núcleo `O(V² + E)`, registro de estados `O((V + E)V)`. Los empates siguen el orden de vértices y aristas; una igualdad conserva el primer predecesor. Cambiar el destino reconstruye su ruta con pesos originales sin recalcular. Convertir a dirigido duplica cada arista; convertir a no dirigido fusiona las opuestas y solicita resolver cualquier peso diferente.
- **Kruskal:** no dirigido, enteros −999999…999999. Ordena ascendente/descendente según mínimo/máximo y usa Union-Find con compresión y rango: núcleo `O(E log E + E α(V))`; registrar componentes añade estados de tamaño `O(EV)`. Los empates siguen el orden original de aristas. Un grafo desconectado entrega un bosque con `V−C` aristas, incluye aislados y no añade conexiones. No se afirma unicidad.

Editar pesos, topología, modo, origen u objetivo invalida el cálculo correspondiente. Renombrar o mover vértices conserva los valores y actualiza las etiquetas. CRUD, deshacer/rehacer (50 acciones), generación acotada, ejemplos, JSON, autoguardado, trabajos nombrados y PNG comparten componentes pequeños; Johnson mantiene su propio estado y comportamiento.

Los nuevos documentos usan `{version:1, modulo:'dijkstra'|'kruskal', grafo:{dirigido,nodos,conexiones,siguienteId}, origen, destino, objetivo, vista, paso, resuelto}`. Cada nodo contiene `{id,nombre,x,y}`; cada conexión `{id,desde,hacia,valor}`. Se valida íntegramente antes de importar, restaurar o cargar un trabajo. Las claves `dijkstra.v1`, `kruskal.v1` y `grafo.v1` son independientes; la biblioteca nombrada sigue en `algoritmos.trabajos.v1`. Los resultados se reconstruyen desde los datos y la reproducción queda pausada.

En el ejemplo solicitado de Kruskal, el mínimo suma 6; el máximo correcto suma **12** (B–D=5, A–C=4, C–D=3). El árbol propuesto de peso 10 es válido, pero no máximo.

### Añadir un algoritmo

1. Añadir la entrada en `js/comun/catalogo.js` (`id`, `nombre`, `corto`, `categoria`, `descripcion`, `entrada`, `resultado`, `ruta`, `icono`, `disponible` y `video` solo si existe uno válido). El inicio y la barra lateral se actualizan solos. Con `disponible: false` aparece como «Próximamente» sin enlace.
2. Crear `nombre.html` copiando la estructura de `northwest.html` (cabecera, `#introModulo`, `#moduloContenido`, scripts comunes) y una carpeta `js/nombre/` separando modelo, lógica, estado y vistas.
3. Constantes nuevas en `config.js`. Hoja propia en `css/nombre.css`.

---

## 3. Navegación y diseño

- **Cabecera compacta**: menú ☰ (móvil/tablet), marca, nombre del módulo activo, botones «Video» y «Ayuda».
- **Barra lateral** construida desde el catálogo y agrupada por categoría. En escritorio (≥ 1024 px) es una columna fija que se pliega a iconos (se recuerda en `ui.navegacion.v1`); por debajo es un cajón lateral con fondo, cierre con Escape y devolución del foco.
- **Presentación con video**: los módulos que tienen un video registrado muestran primero una sección con el video de YouTube (dominio `youtube-nocookie.com`, insertado solo mientras está visible), la descripción, entrada y resultado, y el botón «Ir al algoritmo». «No mostrar al entrar» se guarda por módulo (`ui.intro.<id>`); el botón «Video» de la cabecera la reabre.
- **Ayuda de los siete módulos**: incluye entrada y límites, significado del resultado, controles, guardados con nombre, importación/exportación y recuperación en el navegador. En móvil, «Video del módulo» y «Ayuda del módulo» están en el menú lateral. Dijkstra y Kruskal pausan la reproducción al consultar el video o la ayuda, conservando el cálculo, el paso y los campos sin aplicar; Árboles, Ordenamiento y Northwest también pausan su reproducción al abrir la ayuda.
- **Tema claro y oscuro**: `js/comun/tema.js` (en `<head>`, sin parpadeo) aplica la elección guardada en `ui.tema.v1` o, si no hay ninguna, la del sistema (`prefers-color-scheme`, con cambios en vivo). El conmutador está en la barra lateral (también en el cajón móvil). Las superficies, hovers, texto sobre tintes y colores de grafos son variables que `html[data-tema="claro"]` redefine; los acentos por módulo tienen su variante oscura para contraste sobre blanco.
- **Modo presentación** (escritorio, botón de la cabecera o Alt+P): oculta barra lateral y pie, ensancha el contenido y agranda la tipografía; Escape lo cierra si no hay diálogos abiertos. Se recuerda en `ui.presentacion.v1`.
- **Impresión / PDF**: `css/impresion.css` quita la interfaz y expande las tablas. En las vistas paso a paso de Johnson, Asignación y Northwest el botón «Imprimir» (o Ctrl+P) vuelca **todos** los pasos con su tabla y grafo en tema claro, y al terminar restaura el paso y el tema en pantalla.
- **Exportar PNG**: Johnson, Asignación, Árboles, Dijkstra y Kruskal comparten `js/comun/exportarImagen.js`, que copia los estilos calculados del SVG, así la imagen respeta el tema activo.
- **Sistema visual** en `styles.css`: un solo bloque de tokens (`--bg-*`, `--texto*`, `--acento*`, semánticos, radios, espaciado, tipografía) con alias para las reglas históricas del editor de Johnson. Acento moderado por módulo (`body[data-modulo]`): azul Johnson, verde azulado Asignación, ámbar Northwest. Botones definidos una sola vez (`.btn` + `-primary`, `-secondary`, `-neutral`, `-peligro`, `-fantasma`, `-icono`, `-sm`). Un botón principal por vista; las acciones destructivas van separadas.
- **Responsive**: sin desplazamiento horizontal de la página en ningún ancho probado; las tablas se desplazan dentro de su caja con cabecera y primera columna fijas; controles táctiles de 44 px; indicador «Paso X de Y» compacto en móvil; Dijkstra y Kruskal conservan el desplazamiento vertical de la página, ajustan el grafo al ancho disponible y permiten acercar/desplazar la vista con controles; sus tablas móviles ajustan el texto a cada celda. Modales con desplazamiento interno; `prefers-reduced-motion` respetado.

Puntos de corte: 1180 px (paneles laterales debajo), 1024 px (barra lateral → cajón), 900 px (presentación y paso de Johnson en una columna), 640 px (móvil), 400 px (cabecera compacta), 360 px, y `max-height: 520px` (teléfono en horizontal).

Indicador de pasos: cada rótulo ocupa lo que necesita y, si no cabe, se recorta con «…» (nunca se superpone al siguiente); en móvil solo se rotula el paso actual y el contador «Paso X de Y» y el estado pasan a una segunda línea. Las rejillas usan `minmax(min(Npx, 100%), 1fr)` para no desbordar a 320 px.

---

## 4. Asignación (método húngaro)

Cuatro vistas navegables dentro del módulo: **1 Grafo → 2 Matriz y validación → 3 Resultado → 4 Procedimiento**. Al entrar se muestra el grafo.

### Modelo

```js
estadoAsignacion.modelo = {
  recursos: [{ id: 'r_1', nombre: 'Trabajador A' }],
  tareas:   [{ id: 't_5', nombre: 'Trabajo 1' }],
  valores:  { 'r_1|t_5': 12 },      // ausente = PENDIENTE (nunca cero)
  siguienteId: 9
}
```

El grafo y la matriz son dos vistas del mismo modelo: todo cambio pasa por `aplicarCambioAsignacion()`, que guarda el historial, persiste y redibuja. Renombrar no toca las conexiones (ids estables). Eliminar una conexión deja la pareja pendiente. «Completar pendientes…» pide explícitamente el valor que recibirán; no se asigna un cero en silencio.

### Reglas y límites de esta versión

- 1 a 8 recursos y 1 a 8 tareas; valores enteros entre −999999 y 999999; el 0 es válido; vacío = pendiente.
- Texto, decimales, notación científica, NaN e infinito se rechazan sin convertir (la celda queda marcada y el modelo no cambia).
- No se conectan dos recursos, dos tareas ni un elemento consigo mismo; no hay conexiones duplicadas (una por pareja).
- Matrices rectangulares: se hacen `min(recursos, tareas)` asignaciones reales; el resto queda «sin asignar». Las filas/columnas ficticias del balanceo se distinguen en el procedimiento.
- El resultado se invalida si cambian costos, conexiones, dimensiones u objetivo (firma del modelo); mover un nodo o renombrar no lo invalida. Volver exactamente a los datos originales lo recupera.

### Algoritmo (`js/asignacion/hungaro.js`)

Método húngaro completo. Cada paso mostrado proviene de la ejecución real:

1. Matriz original.
2. Maximizar → minimizar (`máximo − valor`), si corresponde.
3. Balanceo a cuadrada con filas/columnas ficticias de costo 0, si corresponde.
4. Reducción por filas. 5. Reducción por columnas.
6. Mientras el emparejamiento máximo de ceros (Kuhn) tenga menos de `n` ceros: cobertura mínima de líneas (König), δ = mínimo no cubierto, restar δ a lo no cubierto y sumarlo a las intersecciones.
7. Selección final y total con los valores originales.

Verificación independiente: `verificarAsignacionPorFuerzaBruta()` (programación dinámica sobre subconjuntos) comprueba el total y cuenta las soluciones óptimas; solo se afirma «única» cuando la cuenta es 1.

### Grafo

Recursos a la izquierda, tareas a la derecha, conexiones con etiqueta de valor colocada a distinta distancia por columna para que no se superpongan. Herramientas **Seleccionar** (seleccionar, arrastrar, desplazar la vista, doble toque para editar) y **Conectar** (recurso + tarea → valor). Zoom por rueda, pellizco o botones; «Reordenar» devuelve las dos columnas; «Ampliar» ocupa la pantalla (Escape cierra). En el resultado las conexiones elegidas se destacan y las demás se ocultan («Mostrar todas las conexiones» las recupera); las etiquetas se muestran de forma contextual con más de 20 parejas; la leyenda no depende solo del color (trazo grueso, discontinuo, «sin asignar»). Seleccionar una pareja la resalta en grafo, lista y matriz.

### Persistencia

| Clave | Contenido |
|---|---|
| `asignacion.v2` | `{ version, objetivo, modelo, posiciones, vista }` |
| `asignacion.v1` | Formato anterior (`rows/cols/labelsRows/labelsCols/values`). Solo se lee: si no hay v2 se **migra** (nombres repetidos se desambiguan, valores no enteros quedan pendientes) y se avisa. No se borra. |

Exportar/Importar JSON (panel «Edición») acepta ambos formatos. Deshacer/rehacer con Ctrl+Z / Ctrl+Y (hasta 50 acciones), incluidos arrastres y reordenaciones.

---

## 5. Esquina noroeste (transporte)

> El método de la esquina noroeste obtiene una solución inicial factible. **No garantiza el costo mínimo.** La aclaración se muestra permanentemente en el módulo y en el resultado; no existen botones ni etiquetas de «óptimo».

Flujo: **1 Datos → 2 Balanceo → 3 Resolución paso a paso → 4 Resultado**.

### Límites de esta versión

| Dato | Regla |
|---|---|
| Orígenes / destinos reales | 1 a 10 (el ficticio del balanceo se añade aparte, aunque haya 10) |
| Costo unitario | 0 a 999999, hasta 2 decimales, coma o punto; se guarda como entero × 100 |
| Oferta / demanda | Entero 0 a 999999 (decisión de la aplicación, no del método) |
| Etiquetas | 1 a 40 caracteres, sin espacios exteriores, sin repetir en el grupo |
| Casillas vacías | Pendientes (no cero). No hay rutas prohibidas: todas las celdas necesitan costo |

Se rechazan negativos, fracciones en cantidades, más de 2 decimales, separadores de miles y textos parciales («12abc»). Productos y acumulados se comprueban con `Number.isSafeInteger`.

### Balanceo (`balanceo.js`)

Se deriva siempre del modelo actual (nunca se escribe en él, así no se acumulan ficticios). Oferta > demanda → destino ficticio; demanda > oferta → origen ficticio; ambos con costo 0 y explicación de que ese 0 es una convención del modelo. Vista previa con el ficticio distinguido (borde discontinuo, color propio) y confirmación antes de resolver. Todo cero → caso trivial.

### Algoritmo (`noroeste.js`)

Función pura `resolverEsquinaNoroeste(costos, ofertas, demandas)` sobre el problema balanceado: empieza en (1,1), asigna `min(oferta, demanda)`, resta a ambos, baja si se agota la oferta, avanza si se cubre la demanda. Agotamiento simultáneo → se tacha una sola línea y la siguiente celda recibe un **«0 básico»** (sin ε). Filas o columnas con saldo 0 se tratan igual sin bucles. Siempre resultan `m + n − 1` variables básicas. `verificarSolucionTransporte()` comprueba no negatividad, sumas por fila y columna, costo total y base sin ciclos (eliminación de hojas).

Cada paso registra: celda, costo unitario, oferta/demanda antes, operación `min(a, b) = c`, cantidad, saldos después, línea satisfecha y próximo movimiento. La vista distingue costo unitario (`c =`, pequeño) de cantidad (grande). Anterior / Siguiente / Reiniciar (también ← →); «Reproducir» es opcional.

### Persistencia

`northwest.v1` → `{ version, modelo, vista }`. Exportar/Importar JSON en el panel «Ejemplos». Deshacer/rehacer con Ctrl+Z / Ctrl+Y.

Preparado para MODI / Vogel / costo mínimo: el resultado expone `basicas`, `asignaciones`, `costos` balanceados y la verificación de la base; no se incluyen en esta entrega.

---

## 6. Johnson

Cuatro vistas, como en los otros módulos: **1 Grafo → 2 Matriz → 3 Paso a paso → 4 Resultado**.

- **Grafo**: editor visual (Seleccionar / Nodo / Conectar, zoom, arrastre). «Ejemplos» abre la lista de grafos preparados (pesos negativos clásico, solo positivos, nodos sin camino, ceros y bucle, ciclo negativo); también está en el estado vacío. «Más» agrupa Deshacer/Rehacer, Guardar, Biblioteca, Dijkstra, Exportar/Importar y Limpiar. En móvil la vista del grafo funciona como aplicación (sin desplazamiento de página).
- **Matriz**: matriz de adyacencia con sumas y una revisión de datos (nodos, conexiones, negativos, ceros, bucles, aislados) con avisos. «Calcular Johnson» requiere 2 nodos.
- **Paso a paso**: cada fase real de la ejecución, con su tabla y el grafo resaltado: grafo original, nodo auxiliar q, cada pasada de Bellman-Ford (distancias antes/después y relajaciones), potenciales h(v) o el ciclo negativo detectado, reponderación `w' = w + h(u) − h(v)`, un Dijkstra por origen (orden de fijación, `d'`, `d = d' − h(u) + h(v)`, ruta) y la matriz final. Anterior / Siguiente / Reiniciar, lista de saltos y ← →.
- **Resultado**: matriz de distancias; tocar una celda muestra la ruta en un grafo de solo lectura con la suma de sus pesos; «Ver en el editor» la resalta sobre el grafo. Con ciclo negativo se muestra el ciclo y su suma.

El resultado guarda la firma del grafo (ids, nombres, conexiones y pesos; no posiciones): si el grafo cambia, el chip pasa a «Grafo modificado: recalcular», las vistas 3 y 4 lo piden y cualquier resaltado del editor se descarta solo.

Algoritmo (`js/johnson.js`, sin DOM): Bellman-Ford desde q con registro por pasada y parada temprana; la detección de ciclo fija el predecesor de la arista que aún mejora antes de retroceder, así el ciclo devuelto siempre es real y negativo. Dijkstra con desempate determinista. Verificado contra Floyd-Warshall en 300 grafos aleatorios.

Los grafos de solo lectura se dibujan en su propio SVG (con marcadores propios) sobre una copia compactada de las posiciones: nunca mueven los nodos del editor. Los avisos son fijos a la ventana para verse desde cualquier vista.

Persistencia sin cambios: `grafo.v1` (autoguardado) y `grafo.biblioteca.v1`. Cargar un ejemplo, un grafo guardado o un JSON se puede deshacer.

---

## 7. Pruebas

```bash
npm test                          # verificación estática + todas las pruebas unitarias (también en GitHub Actions, .github/workflows/pruebas.yml)
npm run lint                      # solo la verificación estática (tests/verificar.js): sintaxis, rutas, ids, orden de carga y estructura de cada página

node tests/grafos.test.js         # Dijkstra vs Floyd; Kruskal vs enumeración exhaustiva, validación y límites
node tests/usabilidad-grafos-navegador.js --capturas # cuatro etapas, teclado, encuadre y responsive de Dijkstra/Kruskal en ambos temas
npm run test:ampliacion           # ciudad de siete zonas, CRUD, persistencia, archivos, PNG y Ordenamiento grande
npm run test:mejoras              # distribución y teclado de Johnson, bienvenida, progreso y destinos interactivos
npm run medir:ordenamiento        # 45 casos reproducibles: 40/100/200 × 3 entradas × 5 métodos
node tests/asignacion.test.js     # húngaro vs fuerza bruta (incl. 300 aleatorias), validación, modelo, migración e importación
node tests/northwest.test.js      # ejemplo 230, exceso oferta/demanda, degeneración, límites, 300 aleatorias e importación
node tests/ordenamiento.test.js   # Shell/Merge y Selection/Insertion/Bubble: historial, límites, estabilidad y 300 entradas aleatorias
node tests/arboles.test.js        # BST, validación, generación y reconstrucción compatible/incompatible
node tests/johnson.test.js        # ejemplo clásico, rutas, pasos, ciclos negativos, importación, 300 aleatorias vs Floyd-Warshall
node tests/guardados.test.js      # biblioteca, importación no destructiva y aviso/recuperación de autoguardado
node tests/ciudad-navegador.js    # ciudad/lista, teclado, temas, responsive, movimiento y recientes
node tests/regresiones-navegador.js  # importación por archivo, renombrado, navegación y autoguardado
node tests/navegador.js --capturas   # regresión de navegador, recorridos y tamaños móvil/escritorio
```

Las suites de navegador necesitan el servidor local y `puppeteer-core` instalado en `%TEMP%/grafo-e2e` (fuera del proyecto). Usan `127.0.0.1:8123` por defecto; `URL_PRUEBAS` permite cambiarlo. Las pruebas cubren las presentaciones y ayudas de los siete módulos, acceso desde el menú móvil, lectura del texto completo, foco, controles, historiales y persistencia. `test:mejoras` comprueba además que abrir Video/Ayuda en Dijkstra y Kruskal pausa sin perder cálculo, paso o borradores. Ejecuta sin `--capturas` para validar; la suite de ciudad guarda solo sus vistas representativas con ese argumento. En PowerShell con scripts bloqueados, usa `npm.cmd`.

Las comprobaciones de Johnson de `tests/navegador.js` se ampliaron con las vistas por pasos; vuelve a ejecutarlo para regenerar el recuento y las capturas. Capturas en `docs/capturas/` (`*-1440`, `*-768`, `*-390`, `*-375`, `*-320`, `*-horizontal`, `*-video-*`).

---

## 8. Atajos

| Módulo | Atajo | Acción |
|---|---|---|
| Todos | Escape | Cierra menú lateral, diálogo, grafo ampliado, selección o modo presentación |
| Módulos | Alt+P | Entrar / salir del modo presentación (escritorio) |
| Módulos | Ctrl+P | Imprimir (en las vistas paso a paso, con el procedimiento completo) |
| Johnson | 1/2/3, Ctrl+N, Ctrl +/−/0, Supr, flechas | Herramientas, nodo nuevo, zoom, eliminar, recorrer nodos (solo en el editor) |
| Johnson | Ctrl+Z/Y, Ctrl+S/B, Ctrl+M, Ctrl+J | Deshacer/rehacer, guardar/biblioteca, ir a la matriz, calcular |
| Johnson | ← / → | Cambiar de paso en «Paso a paso» |
| Asignación | 1 / 2 | Seleccionar / Conectar |
| Asignación | Ctrl+Z / Ctrl+Y, Supr | Deshacer / rehacer, eliminar selección |
| Northwest | Ctrl+Z / Ctrl+Y, ← / → | Deshacer / rehacer, cambiar de paso |
| Ordenamiento | ← / →, Espacio, Inicio / Fin, R | Paso anterior / siguiente, reproducir / pausar, primer / último paso, reiniciar |
| Árboles | Controles de la vista | Anterior / siguiente, reproducir / pausar y reiniciar el recorrido seleccionado |

---

## 9. Limitaciones pendientes

- Northwest no incluye MODI, Vogel ni costo mínimo (fuera del alcance de esta entrega).
- La verificación exhaustiva de Asignación se limita a `n ≤ 10` (aquí siempre se cumple: máximo 8×8).
- El tema claro se revisó en Chrome headless a 1280 px; conviene una pasada en pantalla real con brillo de aula.
- Las capturas de móvil se generan en un navegador de escritorio emulado (Edge headless): conviene una pasada final en un teléfono real, sobre todo con el teclado virtual abierto.
- Los videos requieren conexión a internet; sin ella la presentación muestra el marco vacío y el botón «Ir al algoritmo» sigue disponible.
