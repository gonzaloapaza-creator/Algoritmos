# Grafo · Algoritmos de Optimización

Aplicación web educativa de investigación de operaciones. Tres módulos:

| Categoría | Módulo | Entrada | Resultado |
|---|---|---|---|
| Grafos y rutas | **Johnson** | Grafo dirigido con pesos enteros (editor visual) | Distancias entre todos los pares y rutas |
| Asignación | **Asignación (método húngaro)** | Grafo bipartito recursos–tareas o matriz | Asignación óptima, total y procedimiento completo |
| Transporte | **Esquina noroeste** | Matriz de costos, oferta y demanda | Solución inicial factible paso a paso |

Sin compilación, dependencias, backend ni base de datos: HTML, CSS y JavaScript planos. Cada módulo abre con un **video explicativo** antes de entrar al algoritmo.

---

## 1. Ejecutar

```bash
# Desde la carpeta del proyecto
python -m http.server 8123     # o: npx serve .   /  http-server -p 8123
```

Abrir `http://localhost:8123`. También funciona abriendo los `.html` directamente, pero un servidor local hace que `localStorage` y los `<iframe>` de video se comporten igual que en producción.

URLs (se conservan las existentes): `index.html`, `johnson.html`, `asignacion.html`, `northwest.html`.

Parámetros útiles: `?intro=no` salta la presentación con video; `index.html?simular=10` muestra un catálogo simulado (entradas marcadas «Próximamente», nunca enlazadas) para revisar el diseño con muchas entradas.

Navegadores: cualquiera moderno (Pointer Events, ResizeObserver, `dvh/svh`, `:has()`, `aspect-ratio`).

---

## 2. Estructura

```
grafo/
├── index.html               Inicio: tarjetas por categoría (desde el catálogo)
├── johnson.html             Editor de grafos + Johnson
├── asignacion.html          Asignación: grafo → matriz → resultado → procedimiento
├── northwest.html           Esquina noroeste: datos → balanceo → resolución → resultado
├── styles.css               Base compartida: tokens, botones, formularios, tablas, mensajes, modal, pasos
├── css/
│   ├── shell.css            Cabecera compacta, barra lateral plegable, inicio, presentación con video, pie
│   ├── johnson.css          Editor de grafos (barra, lienzo, hojas, tablas de Johnson)
│   ├── asignacion.css       Vistas, grafo bipartito, matriz y procedimiento de asignación
│   └── northwest.css        Matriz de transporte, balanceo, pasos y resultado
├── app.js                   Punto de entrada de Johnson (sin cambios de lógica)
├── js/
│   ├── config.js            Constantes y límites de toda la aplicación
│   ├── comun/
│   │   ├── catalogo.js      Catálogo: id, nombre, categoría, descripción, ruta, icono, video
│   │   ├── navegacion.js    Barra lateral + cabecera construidas desde el catálogo
│   │   ├── intro.js         Presentación con video (YouTube nocookie) antes del algoritmo
│   │   ├── inicio.js        Tarjetas del inicio
│   │   ├── dialogo.js       Ventana modal compartida (confirmar / informar / pedir dato)
│   │   ├── notificaciones.js  Toasts
│   │   └── utilidades.js    limitar(), escaparHtml()
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
│   └── (Johnson) estado.js, almacenamiento.js, interfaz.js, dibujo.js, modal.js, acciones.js,
│       matriz.js, biblioteca.js, johnson.js, dijkstra.js, interaccion.js, zoom.js, deshacer.js
├── tests/
│   ├── cargar.js            Carga scripts clásicos en un contexto `vm` de Node
│   ├── asignacion.test.js   Húngaro, validación, modelo, migración
│   ├── northwest.test.js    Esquina noroeste, balanceo, validación, modelo
│   └── navegador.js         Pruebas en Edge headless (puppeteer-core) + capturas
└── docs/capturas/           Capturas de escritorio y móvil generadas por tests/navegador.js
```

### Convenciones

- Scripts clásicos sin módulos ES: cada archivo declara funciones globales; el orden de carga en cada HTML es significativo (datos → lógica → estado → vistas → `app.js`).
- Nombres del dominio en español. Sin `class`.
- Texto del usuario siempre por `textContent` o `escaparHtml()`.
- **Los estados no se mezclan**: `estado` (Johnson), `estadoAsignacion` y `estadoNorthwest` son objetos independientes con sus propias claves de almacenamiento.
- Lógica matemática sin DOM (`hungaro.js`, `noroeste.js`, `balanceo.js`, modelos y validaciones): se prueba en Node.

### Añadir un algoritmo

1. Añadir la entrada en `js/comun/catalogo.js` (`id`, `nombre`, `corto`, `categoria`, `descripcion`, `entrada`, `resultado`, `ruta`, `icono`, `video`, `disponible`). El inicio y la barra lateral se actualizan solos. Con `disponible: false` aparece como «Próximamente» sin enlace.
2. Crear `nombre.html` copiando la estructura de `northwest.html` (cabecera, `#introModulo`, `#moduloContenido`, scripts comunes) y una carpeta `js/nombre/` separando modelo, lógica, estado y vistas.
3. Constantes nuevas en `config.js`. Hoja propia en `css/nombre.css`.

---

## 3. Navegación y diseño

- **Cabecera compacta**: menú ☰ (móvil/tablet), marca, nombre del módulo activo, botones «Video» y «Ayuda».
- **Barra lateral** construida desde el catálogo y agrupada por categoría. En escritorio (≥ 1024 px) es una columna fija que se pliega a iconos (se recuerda en `ui.navegacion.v1`); por debajo es un cajón lateral con fondo, cierre con Escape y devolución del foco.
- **Presentación con video**: cada módulo muestra primero una sección con el video de YouTube (dominio `youtube-nocookie.com`, insertado solo mientras está visible), la descripción, entrada y resultado, y el botón «Ir al algoritmo». «No mostrar al entrar» se guarda por módulo (`ui.intro.<id>`); el botón «Video» de la cabecera la reabre.
- **Sistema visual** en `styles.css`: un solo bloque de tokens (`--bg-*`, `--texto*`, `--acento*`, semánticos, radios, espaciado, tipografía) con alias para las reglas históricas del editor de Johnson. Acento moderado por módulo (`body[data-modulo]`): azul Johnson, verde azulado Asignación, ámbar Northwest. Botones definidos una sola vez (`.btn` + `-primary`, `-secondary`, `-neutral`, `-peligro`, `-fantasma`, `-icono`, `-sm`). Un botón principal por vista; las acciones destructivas van separadas.
- **Responsive**: sin desplazamiento horizontal de la página en ningún ancho probado; las tablas se desplazan dentro de su caja con cabecera y primera columna fijas; controles táctiles de 44 px; indicador «Paso X de Y» compacto en móvil; `touch-action: none` solo sobre la superficie del grafo; modales con desplazamiento interno; `prefers-reduced-motion` respetado.

Puntos de corte: 1180 px (paneles laterales debajo), 1024 px (barra lateral → cajón), 900 px (presentación en una columna), 640 px (móvil), 360 px, y `max-height: 520px` (teléfono en horizontal).

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

Sin cambios funcionales: editor visual, herramientas Seleccionar/Nodo/Conectar, zoom y desplazamiento, deshacer/rehacer, matriz de adyacencia, cálculo de Johnson con detección de ciclos negativos, Dijkstra, biblioteca, autoguardado (`grafo.v1`, `grafo.biblioteca.v1`) e importación/exportación JSON/PNG. Integrado en el shell común (cabecera, barra lateral, presentación con video). Detalle en los comentarios de `js/johnson.js`, `js/dibujo.js`, `js/interaccion.js`.

Ajuste: `adaptarAlArea()` ignora medidas de lienzo menores de 50 px (ocurre mientras la presentación con video oculta el editor) para no amontonar los nodos.

---

## 7. Pruebas

```bash
node tests/asignacion.test.js     # 24 pruebas: húngaro vs fuerza bruta (incl. 300 aleatorias), validación, modelo, migración
node tests/northwest.test.js      # 20 pruebas: ejemplo 230, exceso oferta/demanda, degeneración, ceros, 1×1, 1×N, M×1, 10×10, 300 aleatorias
node tests/navegador.js --capturas   # 160 comprobaciones en Edge headless + capturas en docs/capturas
```

`tests/navegador.js` necesita un servidor en `localhost:8123` y `puppeteer-core` instalado en `%TEMP%/grafo-e2e` (fuera del proyecto). Cubre: inicio (catálogo real y simulado, menú lateral, Escape), presentación con video en los tres módulos, Asignación (inicio en grafo, sincronización grafo↔matriz, validación de texto inválido, resultado 26 con A→2, B→1, C→3, D→4, selección sincronizada, invalidación, procedimiento, persistencia, migración v1, renombrar/eliminar, deshacer/rehacer, conectar), regresión de Johnson (nodos, conexiones, zoom, deshacer/rehacer, distancias, ciclo negativo, matriz, autoguardado, limpiar, importar), Northwest (aclaración, pasos, costo 230, cambio de costos conserva cantidades, ficticio sin acumular, validación de costos/cantidades, persistencia) y ausencia de desplazamiento horizontal en 320, 375, 390, 768, 1024, 1440 y 844×390 (horizontal). Todo sin errores de consola.

Resultados de la última ejecución: 24 + 20 + 160 correctas, 0 fallidas. Capturas en `docs/capturas/` (`*-1440`, `*-768`, `*-390`, `*-375`, `*-320`, `*-horizontal`, `*-video-*`).

---

## 8. Atajos

| Módulo | Atajo | Acción |
|---|---|---|
| Todos | Escape | Cierra menú lateral, diálogo, grafo ampliado o selección |
| Johnson | 1/2/3, Ctrl+Z/Y, Ctrl+N/S/B/M/J, Ctrl +/−/0, Supr | Como antes |
| Asignación | 1 / 2 | Seleccionar / Conectar |
| Asignación | Ctrl+Z / Ctrl+Y, Supr | Deshacer / rehacer, eliminar selección |
| Northwest | Ctrl+Z / Ctrl+Y, ← / → | Deshacer / rehacer, cambiar de paso |

---

## 9. Limitaciones pendientes

- Northwest no incluye MODI, Vogel ni costo mínimo (fuera del alcance de esta entrega).
- La verificación exhaustiva de Asignación se limita a `n ≤ 10` (aquí siempre se cumple: máximo 8×8).
- El grafo de Asignación no exporta a PNG (sí a JSON).
- Las capturas de móvil se generan en un navegador de escritorio emulado (Edge headless): conviene una pasada final en un teléfono real, sobre todo con el teclado virtual abierto.
- Los videos requieren conexión a internet; sin ella la presentación muestra el marco vacío y el botón «Ir al algoritmo» sigue disponible.
