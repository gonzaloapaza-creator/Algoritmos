# Resumen técnico del proyecto

## 1. Descripción general

**Grafo · Algoritmos de Optimización** es una aplicación web educativa para explorar algoritmos de optimización, ordenamiento y árboles binarios de forma visual. El usuario ingresa datos o carga ejemplos, ejecuta un algoritmo y puede recorrer el historial de decisiones antes de consultar el resultado y sus verificaciones.

El repositorio es una aplicación estática de varias páginas. No hay servidor de aplicación: las páginas, los estilos y la lógica se entregan directamente al navegador. Los cálculos y el almacenamiento de los datos de cada usuario se realizan localmente.

## 2. Tecnologías

| Tecnología | Uso en el proyecto |
|---|---|
| HTML5 | Estructura de la página de inicio y de las páginas de cada módulo; formularios, navegación, tablas y regiones accesibles. |
| CSS3 | Diseño visual, temas por módulo, animaciones, disposición adaptable a escritorio y móvil, y estilos de las vistas de cada algoritmo. |
| JavaScript nativo (Vanilla JS) | Navegación, validación, modelos de datos, algoritmos, historial de pasos, interacción con el DOM y almacenamiento en el navegador. |
| SVG | Dibujo de grafos, nodos, aristas, rutas, conexiones del problema de asignación, árboles e ilustraciones vectoriales. |
| Web APIs del navegador | DOM, `localStorage`, `JSON`, eventos de teclado y puntero, temporizadores, `ResizeObserver` y pantalla completa, según la interacción de cada módulo. |
| Node.js | Ejecución de pruebas unitarias para las capas de lógica que no dependen del DOM. |
| `node:vm` | Carga de scripts clásicos dentro de un contexto compartido para probar las funciones globales de los algoritmos. |
| Puppeteer Core y Microsoft Edge | Automatización opcional de pruebas de interfaz en Edge headless y generación de capturas. Las dependencias de esta prueba se instalan fuera del repositorio. |
| Python `http.server` | Opción sencilla para servir localmente los archivos estáticos durante el desarrollo y las pruebas de navegador. |

### Lo que el proyecto no utiliza

- No hay framework de interfaz como React, Vue o Angular.
- No se usan módulos ES: los scripts se cargan con etiquetas `<script>` y comparten funciones y estado global.
- No se observa un gestor de paquetes ni un manifiesto de dependencias para la aplicación web.
- No hay compilación, backend, API propia ni base de datos.
- No hay un paso de empaquetado: el navegador ejecuta directamente los HTML, CSS y JavaScript del repositorio.

Los videos explicativos de YouTube son contenido externo. La aplicación solo presenta los videos registrados en el catálogo y permite volver a abrir la presentación desde la cabecera. El funcionamiento de los algoritmos no depende del video ni de conectarse a un servidor propio.

## 3. Páginas y módulos

| Página | Propósito | Recorrido principal |
|---|---|---|
| [`index.html`](../index.html) | Presenta el proyecto, explica conceptos básicos y ofrece el catálogo de módulos. | Introducción → categorías y algoritmos → equipo. |
| [`johnson.html`](../johnson.html) | Editor de grafos dirigidos y visualización de caminos mínimos entre todos los pares. | Grafo → matriz → resolución paso a paso → resultado. |
| [`asignacion.html`](../asignacion.html) | Permite modelar recursos y tareas como grafo bipartito o matriz y resolver una asignación. | Grafo → matriz y validación → resultado → procedimiento. |
| [`northwest.html`](../northwest.html) | Resuelve un problema de transporte mediante el método de la esquina noroeste. | Datos → balanceo → resolución paso a paso → resultado. |
| [`ordenamiento.html`](../ordenamiento.html) | Anima el ordenamiento de una secuencia representada como pinos de boliche. | Elegir algoritmo y entrada → recorrer la animación y el pseudocódigo. |
| [`arboles.html`](../arboles.html) | Construye BST por inserción y reconstruye árboles binarios desde recorridos. | Crear o reconstruir → inspeccionar nodos → recorrer y animar. |

El catálogo y la navegación lateral se construyen a partir de [`js/comun/catalogo.js`](../js/comun/catalogo.js). En esa lista se registran el nombre, categoría, descripción, ruta e icono; el identificador de video es opcional.

## 4. Cómo funciona la aplicación

### Arranque y navegación

1. El navegador abre una página HTML independiente.
2. La página carga primero los estilos comunes y luego los estilos específicos de su módulo.
3. Al final del documento carga `js/config.js`, las utilidades compartidas y los scripts propios de esa página, respetando el orden indicado en el HTML.
4. Los scripts leen los elementos de la página por sus identificadores, registran eventos de botones, formularios, teclado y puntero, y dibujan la vista inicial.
5. En las páginas de algoritmos, la navegación común crea la barra lateral desde el catálogo. La presentación con video aparece para los módulos que tienen un identificador registrado y se puede volver a abrir desde la cabecera.
6. Los cambios de datos actualizan el modelo correspondiente; la interfaz se vuelve a dibujar y el resultado se calcula o invalida según corresponda.

Los pasos del algoritmo se calculan y almacenan como un historial de estados. Los controles de anterior, siguiente, reinicio, deslizador o reproducción automática cambian el índice del paso mostrado; no vuelven a ejecutar manualmente cada operación de la animación.

### Organización de responsabilidades

- **HTML:** esqueleto de vistas, botones, tablas y puntos de montaje para contenido dinámico.
- **CSS compartido:** tokens de color, tipografía, espaciado, controles, tarjetas, tablas, mensajes y componentes generales.
- **CSS de módulo:** editor, diagramas y componentes propios de cada algoritmo.
- **Modelo y validación:** representan los datos aceptados y separan los valores incompletos o inválidos de los válidos.
- **Lógica algorítmica:** calcula resultados y, cuando aplica, registra pasos sin depender del DOM.
- **Estado y persistencia:** mantiene la entrada, el resultado, la vista actual y el historial de acciones.
- **Interfaz y punto de entrada (`app.js`):** conecta las acciones del usuario con el modelo, el algoritmo y el dibujo.

La lógica matemática independiente del navegador se puede probar con Node.js; las capas visuales se ejercitan con las pruebas de navegador.

## 5. Funcionamiento de cada algoritmo

### 5.1 Johnson: caminos mínimos de todos los pares

El usuario crea un grafo dirigido con nodos y aristas ponderadas, o carga un ejemplo. El editor permite seleccionar, crear nodos, conectar, arrastrar, aplicar zoom, deshacer y rehacer, guardar grafos, importar o exportar JSON y consultar Dijkstra desde un nodo seleccionado.

El cálculo de Johnson realiza estas fases:

1. Prepara los nodos y aristas sin modificar el grafo que dibujó el usuario.
2. Añade conceptualmente un nodo auxiliar conectado a todos los nodos con peso cero.
3. Ejecuta Bellman-Ford para obtener potenciales y detectar ciclos negativos.
4. Si no hay ciclo negativo, repondera las aristas para que los pesos sean no negativos.
5. Ejecuta Dijkstra desde cada nodo.
6. Convierte las distancias a los pesos originales y arma la matriz final.

La vista de resolución muestra las pasadas de Bellman-Ford, las reponderaciones y las ejecuciones de Dijkstra. En el resultado, seleccionar una celda de la matriz permite inspeccionar la ruta correspondiente. Si se detecta un ciclo negativo, se presenta como tal en vez de ofrecer distancias incorrectas.

El algoritmo y el registro de sus pasos están principalmente en [`js/johnson.js`](../js/johnson.js); el editor y las vistas se reparten entre los otros scripts `js/` y `js/johnson/`.

### 5.2 Asignación: método húngaro

El modelo consta de recursos, tareas y un valor para cada pareja recurso–tarea. El grafo bipartito y la matriz son dos representaciones del mismo modelo: editar una representación se refleja en la otra. Se puede buscar minimizar costos o maximizar beneficios.

El método húngaro:

1. Valida que todas las parejas tengan un valor entero.
2. Para maximizar, transforma los beneficios en costos equivalentes.
3. Convierte una matriz rectangular en cuadrada agregando filas o columnas ficticias cuando sea necesario.
4. Reduce la matriz por filas y columnas.
5. Busca un emparejamiento máximo de ceros. Si todavía no existe una asignación completa, cubre los ceros con el mínimo de líneas y ajusta la matriz; repite hasta poder seleccionar una asignación.
6. Calcula el total con los valores originales y expone el procedimiento para inspeccionarlo.

El resultado incluye una comprobación independiente por búsqueda exhaustiva cuando el tamaño permite ejecutarla. Los valores pendientes se representan como pendientes, no como cero. La lógica principal está en [`js/asignacion/hungaro.js`](../js/asignacion/hungaro.js) y la estructura de datos en `js/asignacion/modelo.js`.

### 5.3 Transporte: método de la esquina noroeste

El usuario ingresa una matriz de costos, la oferta de cada origen y la demanda de cada destino. Antes de resolver se comparan las sumas de oferta y demanda:

- Si coinciden, el problema ya está balanceado.
- Si sobra oferta, se añade un destino ficticio.
- Si falta oferta, se añade un origen ficticio.
- El elemento ficticio y sus costos cero son derivados para el cálculo y no se incorporan permanentemente al modelo de entrada.

Sobre el problema balanceado, la lógica empieza en la celda superior izquierda, asigna el mínimo entre la oferta restante y la demanda restante y avanza según se agote una fila o se satisfaga una columna. Si ambos saldos se agotan simultáneamente, registra la degeneración y una variable básica de cantidad cero cuando corresponde.

La aplicación muestra los cálculos intermedios y verifica no negatividad, totales por fila y columna, costo total, número de variables básicas y ausencia de ciclos en la base. **La esquina noroeste entrega una solución inicial factible; no garantiza el costo mínimo.** El cálculo puro está en [`js/northwest/noroeste.js`](../js/northwest/noroeste.js), y el balanceo se separa en `js/northwest/balanceo.js`.

### 5.4 Ordenamiento: Selection, Insertion, Bubble, Shell y Merge Sort

La entrada es una lista de 3 a 12 enteros entre 1 y 99. Se puede escribir la lista, generar valores aleatorios, crear una secuencia casi ordenada o usar el caso invertido. Cada elemento conserva un identificador propio para que la animación muestre el mismo pino aunque cambie de posición. Los cinco algoritmos están disponibles en el selector.

Los cinco métodos ordenan de forma ascendente:

- **Selection Sort:** busca el menor valor de la parte no ordenada y lo intercambia a su lugar.
- **Insertion Sort:** toma un elemento y lo inserta en su posición dentro de la parte ya ordenada.
- **Bubble Sort:** compara elementos vecinos e intercambia los que están en orden incorrecto; puede detenerse temprano si una pasada no produce cambios.
- **Shell Sort:** aplica inserciones mediante intercambios separados por saltos `floor(n/2)`, reducidos con `floor(salto/2)` hasta 1. No presenta posiciones intermedias como definitivas.
- **Merge Sort:** divide recursivamente y mezcla subarreglos en un auxiliar; ante valores iguales, elige el elemento izquierdo primero. Las escrituras al auxiliar y las copias de vuelta se cuentan como movimientos.

La lógica produce un historial determinista con instantáneas independientes del arreglo y metadatos de comparaciones, movimientos, elementos fijados, explicación y línea de pseudocódigo activa. Shell muestra sus grupos y salto; Merge muestra mitades, segmento y auxiliar. La copia final de un segmento es atómica en el historial para conservar pinos únicos. Al cambiar algoritmo o entrada se detiene la reproducción. La lógica está en [`js/ordenamiento/algoritmos.js`](../js/ordenamiento/algoritmos.js).

### 5.5 Árboles binarios

La página [`arboles.html`](../arboles.html) separa la creación de árboles binarios de búsqueda de la reconstrucción de árboles binarios generales. Los límites configurables están en [`js/config.js`](../js/config.js): 1–31 nodos y enteros entre −999 y 999.

- **Inserción BST:** el primer valor es la raíz, los menores van a la izquierda y los mayores a la derecha; no hay duplicados ni balanceo automático. La secuencia, el camino y el nodo nuevo se reflejan en SVG. Hay entrada manual, deshacer, limpiar y generación aleatoria de valores únicos en orden mezclado.
- **Recorridos:** preorden (raíz–izquierda–derecha), inorden (izquierda–raíz–derecha) y postorden (izquierda–derecha–raíz). La animación distingue visita de incorporación a la salida; en postorden el nodo se emite tras recorrer sus hijos. Inorden está ordenado solo cuando el árbol es BST.
- **Reconstrucción:** preorden+inorden e inorden+postorden definen un árbol. Con los tres recorridos se construye usando una pareja que contiene inorden y se verifica exactamente el tercero. Preorden+postorden exige también inorden, porque no determina una estructura única en general. Se validan campos, enteros, límites, duplicados, longitudes, conjuntos, particiones y recorridos recalculados. El resultado no se supone BST.
- **Visualización:** el SVG calcula posiciones según orden inorden y profundidad, con ancho lineal respecto del número de nodos. Incluye desplazamiento local, zoom, centrado, ajuste e inspección de padre e hijos.

El código separa [`modelo.js`](../js/arboles/modelo.js), [`validacion.js`](../js/arboles/validacion.js), [`reconstruccion.js`](../js/arboles/reconstruccion.js), [`estado.js`](../js/arboles/estado.js), [`dibujo.js`](../js/arboles/dibujo.js) y [`app.js`](../js/arboles/app.js). El ejemplo de clase `5, 3, 1, 4, 7, 11, 8, 15` está disponible para inserción y reconstrucción.

## 6. Datos, validación y persistencia

Cada módulo tiene su propio estado y claves de almacenamiento; los datos de un algoritmo no se mezclan con los de otro. La persistencia habitual usa `localStorage`, por lo que queda asociada al perfil y al origen del sitio en el navegador usado.

| Área | Persistencia y formatos observados |
|---|---|
| Johnson | Autoguardado del grafo en `grafo.v1`, biblioteca de grafos en `grafo.biblioteca.v1`; permite importar y exportar JSON. |
| Asignación | Modelo y preferencias del módulo en formato `asignacion.v2`; hay lectura y migración del formato anterior `asignacion.v1`. También permite importar y exportar JSON. La matriz editable muestra la fila o columna ficticia necesaria antes de resolver. |
| Esquina noroeste | Modelo y vista en `northwest.v1`; permite importar y exportar JSON. |
| Árboles | Estado independiente `arboles.v1`: secuencia de inserción BST o recorridos del árbol reconstruido. Se valida al restaurar, los errores de almacenamiento se notifican sin bloquear la página y no se reanuda la animación. |
| Presentación y navegación | Preferencias de interfaz almacenadas localmente por clave, como el estado de la introducción por módulo y la navegación lateral. |
| Ordenamiento | Autoguardado en `ordenamiento.v1` (algoritmo, valores, paso actual y velocidad); los historiales de pasos se recalculan al restaurar. |

Todos los módulos ofrecen además los botones **Guardar** y **Cargar** en la barra superior. La biblioteca `algoritmos.trabajos.v1` conserva hasta 50 instantáneas con nombre por algoritmo en el almacenamiento local; desde el panel «Mis trabajos» se puede guardar o reemplazar, cargar, renombrar, eliminar, y exportar o importar en JSON todos los trabajos del módulo (los importados reciben id nuevo y un sufijo si el nombre ya existe). Cargar valida los datos y vuelve a calcular resultados derivados cuando corresponde.

La entrada se valida antes de resolver. En general, un campo vacío no equivale a cero; esto permite distinguir un dato faltante de un valor válido igual a cero. El resultado se considera vigente solo mientras corresponda al modelo usado para calcularlo. Al modificar los datos relevantes, la interfaz advierte que debe recalcularse.

Se ofrece deshacer y rehacer en los módulos de edición que mantienen historial de cambios. Los límites concretos de datos se fijan en la interfaz y en `js/config.js`; son límites de esta aplicación, no restricciones matemáticas inherentes a los algoritmos.

## 7. Interfaz y accesibilidad

- El sistema visual compartido reside en [`styles.css`](../styles.css) y [`css/shell.css`](../css/shell.css); cada algoritmo tiene su propio CSS dentro de `css/`.
- Los colores de acento cambian por módulo.
- El diseño contempla pantallas pequeñas y grandes; las tablas se desplazan dentro de su contenedor y los controles admiten interacción táctil.
- Se usan etiquetas, nombres accesibles, indicadores de estado y regiones `aria-live` en distintas vistas.
- Los grafos se dibujan con SVG y se distinguen mediante formas, trazos y etiquetas además del color.
- El árbol SVG ofrece nodos seleccionables con teclado y ratón, etiquetas de raíz/hoja y desplazamiento local en móviles.
- La introducción de YouTube se inserta de forma diferida en la vista de presentación y se retira al entrar al algoritmo, evitando mantener ese iframe cuando no se muestra.
- Hay controles de ayuda, mensajes, diálogos, estados sin datos y opciones para cargar ejemplos.

## 8. Estructura del repositorio

```text
.
├── index.html                 Página de inicio y catálogo
├── johnson.html               Editor de grafos y módulo Johnson
├── asignacion.html            Módulo de asignación
├── northwest.html             Módulo de transporte
├── ordenamiento.html          Módulo de ordenamiento
├── arboles.html               Módulo de árboles binarios
├── app.js                     Punto de entrada del editor Johnson
├── styles.css                 Estilos base compartidos
├── css/
│   ├── shell.css              Navegación y estructura común
│   ├── arboles.css            Diagrama e interacción de árboles
│   └── *.css                  Estilos específicos por módulo
├── js/
│   ├── config.js              Límites y constantes
│   ├── comun/                 Catálogo, navegación, introducción, diálogos y utilidades
│   ├── asignacion/            Modelo, validación, húngaro, vistas y estado
│   ├── northwest/             Modelo, validación, balanceo, solución y vistas
│   ├── ordenamiento/          Estado, algoritmos, dibujo e interacción
│   ├── arboles/               Modelo, validación, reconstrucción, estado, dibujo y app
│   └── *.js                   Editor, estado, dibujo y lógica de Johnson
├── tests/
│   ├── cargar.js              Contexto y utilidades para pruebas de lógica
│   ├── johnson.test.js        Pruebas del algoritmo Johnson
│   ├── asignacion.test.js     Pruebas de asignación
│   ├── northwest.test.js      Pruebas de transporte
│   ├── ordenamiento.test.js   Pruebas de ordenamiento
│   ├── arboles.test.js        Pruebas de BST, validación y reconstrucción
│   ├── guardados.test.js      Pruebas de la biblioteca de trabajos
│   └── navegador.js           Pruebas de interfaz en Edge headless
└── docs/
    ├── capturas/              Capturas de distintas páginas y tamaños
    └── resumen-tecnico.md     Este documento
```

## 9. Ejecutar localmente

Desde la carpeta raíz del repositorio, se puede servir la aplicación con Python:

```bash
python -m http.server 8123
```

Luego se abre <http://localhost:8123/> en un navegador moderno. También es posible abrir los HTML directamente, pero un servidor local ofrece un contexto más representativo para `localStorage`, iframes y las pruebas de navegador.

No se necesita instalar dependencias para usar las páginas ni para ejecutar las pruebas unitarias básicas. Las pruebas de interfaz automatizadas sí requieren Microsoft Edge, un servidor en `localhost:8123` y `puppeteer-core` en la ubicación externa que indica `tests/navegador.js`.

## 10. Pruebas

Las pruebas unitarias se ejecutan directamente con Node.js:

```bash
node tests/johnson.test.js
node tests/asignacion.test.js
node tests/northwest.test.js
node tests/ordenamiento.test.js
node tests/arboles.test.js
node tests/guardados.test.js
```

O todas juntas con `npm test` (no instala nada: solo encadena los comandos anteriores). El mismo comando se ejecuta en GitHub Actions en cada push (`.github/workflows/pruebas.yml`).

`tests/cargar.js` implementa un cargador pequeño que ejecuta los scripts sin DOM en un contexto `vm`, y proporciona aserciones básicas. Entre las comprobaciones principales del conjunto están:

- Johnson frente al algoritmo de referencia Floyd–Warshall, además de rutas y ciclos negativos.
- El método húngaro frente a una búsqueda exhaustiva y la validez de las asignaciones.
- La esquina noroeste en casos balanceados, desbalanceados, degenerados y de dimensiones límite, junto con la verificación de la solución.
- Los historiales de ordenamiento, la salida ascendente, los contadores, estabilidad e instantáneas.
- Árboles vacíos, unitarios, desbalanceados, generación aleatoria, límites y reconstrucción desde recorridos compatibles e incompatibles.

La prueba de navegador se inicia con:

```bash
node tests/navegador.js
```

Para generar o actualizar las capturas de `docs/capturas/`:

```bash
node tests/navegador.js --capturas
```

La prueba de navegador usa Edge headless mediante Puppeteer Core. Antes de ejecutarla, debe estar disponible el servidor local y la dependencia externa definida en el comentario inicial de `tests/navegador.js`.

## 11. Consideraciones para mantenimiento

1. Mantener el orden de los `<script>` en cada HTML: son scripts clásicos y una página depende de que sus constantes y funciones estén cargadas antes de inicializar la aplicación.
2. Mantener separadas las lógicas puras del DOM siempre que sea posible; así pueden probarse desde Node.js.
3. Si se agrega un algoritmo, registrar sus metadatos en `js/comun/catalogo.js`, crear su página, estilos y scripts, y conectarlo a la navegación compartida.
4. Mantener diferenciados los estados y las claves `localStorage` de los módulos.
5. No describir una solución de esquina noroeste como óptima: es una solución inicial factible.
6. Al cambiar formatos persistidos, considerar la migración y la compatibilidad con los datos ya guardados en el navegador.
