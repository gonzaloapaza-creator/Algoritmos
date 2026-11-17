# Entrega final local de Dijkstra y Kruskal

**Fecha:** 17 de noviembre de 2026 · America/La_Paz.

**Proyecto:** Ciudad de los Algoritmos.
**Referencia de análisis:** `ANALISIS_ACTUAL_KRUSKAL_DIJKSTRA_DIFUSA_2026-11-17.md`.

## Resultado de la entrega

Se implementó la presentación y consulta final de las páginas independientes `dijkstra.html` y `kruskal.html` mediante sus archivos compartidos de `js/grafos/` y `css/grafos.css`.

Los motores, sus desempates y el formato de documentos versión 1 se conservaron. El diff no modifica `js/grafos/algoritmos.js`, el `app.js` de la raíz ni `js/dijkstra.js`. Tampoco modifica las implementaciones de Asignación, Johnson, Northwest, Ordenamiento, Árboles o Lógica difusa. Los hallazgos difusos H-01 a H-05 quedan para la siguiente fase.

Trabajo realizado localmente, sin dependencias nuevas, commits, push ni publicación.

## Cambios de interfaz

- **Minimizar y Maximizar visibles** en ambos módulos, con texto de modo activo y `aria-pressed`. El botón de ejecución identifica qué calculará.
- **Panel plegable de respuesta**, con objetivo y total vigente en su cabecera. En escritorio comparte espacio con el grafo; al plegarlo libera la columna. En móvil va debajo del grafo y su contenido tiene altura limitada y desplazamiento interno.
- **Desde y Hasta** en Dijkstra; se conserva Todos los destinos. El modo del grafo sigue disponible al editar/configurar.
- **Editar grafo**, **Ver procedimiento** y retorno al resultado conservan la consulta y el objetivo. No se inicia reproducción automática.
- Zoom, desplazamiento, encuadre y ampliación conservan las coordenadas del trabajo. Plegar o redimensionar tampoco reinicia el cálculo.
- Pesos con posiciones alternativas para evitar choques con nodos y otras etiquetas. Las conexiones opuestas mantienen curvas separadas; las flechas conservan un tamaño visible al cambiar el zoom.
- Rutas con aristas gruesas y nodos destacados; origen y destino diferenciados. Las conexiones secundarias permanecen legibles.
- Foco visible y uso de teclado en objetivos, panel y tarjetas.
- Impresión del detalle aunque el panel estuviera plegado; después se restaura su estado.

## Dijkstra

La consulta de una ruta muestra sus nodos, cantidad de aristas, pesos originales por tramo y suma. Cambiar solamente el destino reutiliza el resultado. La consulta del árbol permite regresar a la última ruta seleccionada durante la sesión.

Los destinos alcanzables aparecen primero y los inalcanzables quedan agrupados. Una consulta sin ruta muestra «Sin camino desde [origen]» y retira el resaltado anterior. Consultar el origen como destino da total 0 y cero aristas.

Cambiar origen, objetivo, peso, conexiones o dirección invalida resultado y procedimiento y muestra «Calcula de nuevo». Renombrar o mover conserva el cálculo y actualiza los rótulos.

Minimizar mantiene Dijkstra con pesos no negativos y ciclos válidos. Maximizar mantiene el método topológico: exige que todo el grafo sea dirigido y acíclico. La condición está junto a los objetivos y el diagnóstico distingue dirección incompatible de ciclo, conservando el grafo.

El procedimiento añade tarjetas plegables por vértice/ronda, preparación y cierre. Cada relajación apunta a su índice del historial real. Abrir una ronda o elegir una relajación actualiza el grafo al estado registrado, sin recalcular. Los nodos máximos procesados sin camino se distinguen de los alcanzables. La tabla y los controles anteriores siguen disponibles.

## Kruskal

El resultado identifica árbol o bosque mínimo/máximo, presenta aristas elegidas de las disponibles, pesos, total y componentes. Conserva los subtotales por grupo y los aislados con subtotal 0.

Las conexiones elegidas tienen trazo destacado; las descartadas se distinguen mediante trazo discontinuo y lista explicativa. El procedimiento mantiene arista actual, peso, decisión, grupos antes/después y acumulado. Los empates conservan el orden de entrada y se explica que puede haber otra selección con el mismo total.

Cambiar objetivo retira el árbol anterior antes de volver a calcular. No se añadieron origen ni destino a este módulo.

## Referencias de clase comprobadas

Se añadió **Referencia de clase** a cada catálogo y se mantuvieron los ejemplos anteriores. La carga utiliza la confirmación de reemplazo existente; los resultados proceden de los motores.

| Módulo y objetivo | Solución verificada | Total |
|---|---|---:|
| Dijkstra · Minimizar | A → C → E → B → D; cuatro aristas: 23 + 23 + 23 + 32 | **101** |
| Dijkstra · Maximizar | A → E → D; dos aristas: 52 + 69 | **121** |
| Kruskal · Minimizar | A—B, C—D, A—C; tres de cuatro: 2 + 3 + 5 | **10** |
| Kruskal · Maximizar | A—C, B—D, C—D; tres de cuatro: 5 + 5 + 3 | **13** |

En el mínimo de Kruskal, B—D es una alternativa óptima a A—C. La aplicación conserva su desempate estable y elige A—C porque aparece antes.

## Validaciones y compatibilidad

Se conservan pesos enteros de 0 a 999999, hasta 24 vértices y 96 aristas, junto con los rechazos de vacíos, negativos, decimales, lazos, referencias inexistentes y duplicados. A→B y B→A pueden coexistir en dirigido; en no dirigido representan la misma conexión.

Se verificó la restauración de un documento anterior resuelto, la importación inválida sin reemplazo, la importación válida y la exportación JSON en ambos módulos. Se comprobaron PNG, preparación de impresión de todos los pasos, edición, deshacer/rehacer y contexto del asistente local mediante las suites correspondientes.

## Pruebas ejecutadas

Entorno: Windows, Node `v26.12.1`, Edge `157.0.4341.60`, Puppeteer ya disponible. Contextos aislados, sin trabajos personales.

| Comando | Resultado |
|---|---|
| `node tests/verificar.js` | 111 correctas, 0 fallidas; sintaxis de 299 JS y comprobaciones estáticas. |
| `node tests/grafos.test.js` | 27 correctas, 0 fallidas. |
| `node tests/dijkstra-ejemplos.test.js` | 6 correctas, 0 fallidas. |
| `node tests/referencias-clase-grafos.test.js` | 3 correctas, 0 fallidas: los cuatro totales, rutas, desempates y documentos. |
| `node tests/usabilidad-grafos-navegador.js` | 936 comprobaciones correctas; cero errores de consola/página. |
| `node tests/dijkstra-catalogo-navegador.js` | 71 comprobaciones correctas, incluidos los seis ejemplos. |
| `$env:CASO_GRAFOS='dijkstra'; node tests/fase2-grafos-navegador.js` | 31 comprobaciones correctas; cero escenarios fallidos y errores de página. |
| `$env:CASO_GRAFOS='kruskal'; node tests/fase2-grafos-navegador.js` | 28 comprobaciones correctas; cero escenarios fallidos y errores de página. |
| `node tests/entrega-grafos-navegador.js` | 845 comprobaciones correctas; cero errores JS/HTTP locales recogidos por la prueba. |
| `npm.cmd run preparar:netlify` | Paquete regenerado: 102 archivos públicos; ZIP de 535926 bytes. |
| `node tests/verificar-paquete-asistente.js` | CRC correcto e igualdad de los 102 archivos entre fuente, public, drop y ZIP. |
| `git diff --check` y revisión del diff | Sin errores de espacios; motores y módulos excluidos conservados. |

La nueva regresión de navegador recorre ambos objetivos en los dos módulos a **320, 390, 768 y 1440 px**, con temas claro y oscuro y escala de navegador 100 %. Comprueba panel abierto/cerrado con Enter, ruta y resaltados, tarjetas, edición y retorno, encuadre, etiquetas sin solapes en las referencias, redimensionamiento, controles alcanzables frente a las barras y Algo, invalidación, documentos, PNG e impresión.

Se actualizaron dos expectativas de catálogo para incluir el nuevo ejemplo. También se corrigió una expectativa antigua de la suite de interacción de Kruskal que todavía admitía −2: ahora comprueba rechazo de negativos y edición con 3. No se cambió la política de pesos ni el motor para satisfacer esa prueba antigua.

Para repetir las pruebas de navegador, iniciar primero `npm start` en otra terminal. Todas usan por defecto `http://127.0.0.1:8123/`; admiten `URL_PRUEBAS` cuando se necesita otro servidor local. La opción `--captura` de la nueva prueba guarda únicamente imágenes temporales de QA, sin añadir una galería al proyecto o al paquete.

## Paquete listo para Netlify

**Carpeta arrastrable actual:**

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\drop
```

**ZIP equivalente:**

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\ciudad-algoritmos-netlify.zip
```

Se verificó que `js/northwest/optimizacion.js` continúa incluido en el inventario público y, por la comparación del paquete, en fuente, public, drop y ZIP. Los informes, pruebas, capturas y archivos privados quedan fuera del paquete estático.

La publicación queda a cargo del usuario. Para Netlify se debe utilizar la carpeta `drop` o extraer el ZIP y arrastrar su contenido estático, con `index.html` en la raíz.

## Pendientes y límites reales

- Las capturas originales de la aplicación aprobada por el docente no se adjuntaron a esta solicitud. Se aplicó la jerarquía descrita en el texto; queda pendiente contrastar el parecido visual con esas capturas concretas cuando estén disponibles.
- No se probó en teléfono físico, teclado virtual, proyector, Firefox o Safari. Las pruebas móviles son emulación de Edge.
- Lógica difusa y H-01 a H-05 siguen fuera de esta fase.
- No se verificó un sitio remoto ni se realizó publicación.

No quedan fallos conocidos de los casos de aceptación de Dijkstra y Kruskal ejecutados en esta entrega local.
