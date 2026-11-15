# Dijkstra: análisis del catálogo y mejoras aplicadas

15 de noviembre de 2026 · Ciudad de los Algoritmos.

## Diagnóstico

El problema principal era pedagógico. Los ejemplos eran matemáticamente válidos, pero el catálogo mezclaba demostraciones del algoritmo con casos de diagnóstico y repetía varias veces el mismo comportamiento.

Antes del cambio se reprodujo el inicio rápido a 390 px y zoom normal: cargaba el caso de clase con A, B, C, D y E; calculaba A→C→B→D = 4 y dejaba E aislado, aunque la descripción solo invitaba a comparar mínimo y máximo. Al cargar, la explicación desaparecía porque se ocultaba el selector. Quedaba una notificación temporal.

| Hallazgo | Efecto | Resolución |
| --- | --- | --- |
| Caso de clase con E aislado, grupos separados y A→B con C aislado | Tres variantes de inalcanzabilidad ocupaban el catálogo. | Se retiraron del selector y se conservan como datos compatibles para trabajos y regresiones. |
| Ejemplo cíclico con un único camino útil al destino | Mostraba sobre todo el bloqueo de máximo, sin una decisión de rutas interesante. | Se retiró del selector; mínimo con ciclos y bloqueo de máximo siguen disponibles y comprobados. |
| La consigna desaparecía después de cargar | Faltaba recordar qué observar durante la consulta. | Guía «Qué observar» junto al grafo, en configuración, procedimiento y resultado. |
| No se conectaba el resultado con una revisión concreta | Era difícil encontrar el paso que justificaba el cambio de camino. | Acceso directo a la última mejora de distancia conocida del destino, derivado del historial real. |
| Seleccionar destino conservaba resaltadas otras ramas del árbol | Ruta y árbol podían confundirse. | La vista de destino destaca únicamente su ruta; volver a todos restaura el árbol sin recalcular. Leyenda y explicación contextuales. |
| La tabla llamaba «Sin camino» a ∞ desde el inicio | Confundía una distancia todavía desconocida con un destino imposible. | «Aún sin descubrir» durante la búsqueda, valores provisionales y «Sin camino» cuando corresponde concluirlo. |
| Algo ignoraba −∞ al responder sobre destinos sin camino | En máximo podía afirmar que todos eran alcanzables. | Filtro corregido únicamente para Dijkstra; la respuesta consulta el resultado vigente. |

## Catálogo actual: cinco objetivos distintos

| Ejemplo | Qué enseña | Referencia comprobada |
| --- | --- | --- |
| Básico · El atajo aparente | Menos tramos no implica menor costo. Es el nuevo inicio rápido. | Mínimo A→B→C→D: 2+2+2 = **6**. Máximo A→D: **9**. D mejora de 9 a 6. |
| Intermedio · Una distancia puede mejorar | Las distancias provisionales y los predecesores cambian al descubrir mejores caminos. | Mínimo A→C→B→D→E: 2+1+2+3 = **8**. Máximo A→B→E: 8+10 = **18**. Revisiones: B 8→3, D 9→5, E 13→8. |
| Aplicado · Caminos de un campus | Varias rutas en una red de ida y vuelta, con datos didácticos en metros. | Entrada—Patio—Bloque—Biblioteca: 20+15+25 = **60 m**, también de regreso. Máximo conserva el diagnóstico de grafo no dirigido. |
| Intermedio · Las flechas importan | Estar conectado visualmente no garantiza ser alcanzable desde el origen. | A→B=2, B→C=3, D→B=1. Desde A: C=**5** y D sin camino. Desde D: C=**4** y A sin camino. D tiene una conexión; no es un aislado. |
| Especial · Costo cero y rutas empatadas | Cero representa una conexión real y puede haber varias rutas óptimas. | B=C=0; D=**2** por B o por C. Se conserva el desempate existente. |

Cada ficha incluye una descripción, origen y destino sugeridos. Cargar utiliza la confirmación y la operación transaccional existentes, prepara Mínimo y enfoca Calcular. Los resultados se calculan; las referencias de esta tabla no sustituyen ningún cálculo.

La guía se reconoce a partir de los datos del grafo, sin añadir campos obligatorios a los documentos. Mover los puntos la conserva; editar nombres o pesos la retira para no presentar una consigna incorrecta. Deshacer o recuperar un documento coincidente vuelve a mostrarla. Si cambia el origen o el objetivo, la guía distingue la consulta actual de la sugerida.

Los cuatro casos retirados conservan sus IDs y su construcción: `obligatorio`, `desconectado`, `inalcanzable` y `ciclico`. Se comprobó que sus documentos resueltos se recuperan y reconstruyen desde los datos originales. No se eliminaron registros guardados ni se utilizaron trabajos personales para probar.

## Lectura del grafo y precisión de la explicación

Los cinco ejemplos usan posiciones deliberadas sin cruces de aristas, conservando el encuadre y los controles manuales. Una primera revisión detectó tres colisiones de pesos con nodos a 320 px en Mejoras y Campus. Se corrigieron con disposiciones más altas que aprovechan el lienzo móvil, sin alterar el colocador genérico de etiquetas ni reducir fuentes.

La tabla muestra «Mejor distancia conocida» en mínimo y «Mejor valor conocido» en máximo. Un valor no finito no recibe marca de éxito. Al finalizar se confirma «Sin camino desde [origen]»; en máximo también puede confirmarse cuando ese nodo ya fue procesado en orden topológico. Algo conserva la misma distinción al explicar el paso y el nodo seleccionado.

Se corrigió además la frase de ayuda que afirmaba que el módulo solo calculaba mínimos. Dijkstra calcula el mínimo; la opción de máximo usa relajación en orden topológico sobre un grafo dirigido acíclico. La comprobación de ciclos se conserva, sin convertir ni borrar conexiones.

## Verificación y límites

| Comprobación | Resultado |
| --- | --- |
| `node tests/grafos.test.js` | 27 correctas, incluidas las referencias independientes de Floyd-Warshall y enumeración exhaustiva, validación e integridad transaccional. |
| `node tests/dijkstra-ejemplos.test.js` | 6 correctas nuevas: catálogo, revisiones reales, dirección, cambio de origen, campus, ceros/empates y recuperación de documentos antiguos. |
| `node tests/ejemplos-modulos.test.js` | 5 correctas. La expectativa de catálogo se adaptó a la retirada deliberada de opciones, conservando las comprobaciones de las fábricas anteriores. |
| `node tests/mejoras-finales.test.js` | 6 correctas. |
| `node tests/dijkstra-catalogo-navegador.js` | 62 comprobaciones correctas. Cinco ejemplos a 320, 390 y 1440 px; pesos y nodos separados, textos de al menos 13,9 px dentro del SVG, zoom normal y sin desborde. Cargas, foco, salto a E 13→8, ruta/árbol, guía, edición/deshacer, recuperación y cancelación. |
| `node tests/usabilidad-grafos-navegador.js --caso=dijkstra-390-claro` | 59 comprobaciones correctas, sin errores de consola/página. |
| Suite `tests/mejoras-finales-navegador.js` | 70 comprobaciones correctas de grafos y difusa, sin errores de página. Las expectativas del ejemplo inicial ahora comprueban 6/9. |
| `node tests/ejemplos-lectura-navegador.js --solo=grafos` | 46 comprobaciones correctas de Dijkstra y Kruskal. El caso de inalcanzables usa ahora «Las flechas importan»; conserva las aserciones de agrupación, patrón, reutilización del resultado y recuperación. |
| Ayuda de Algo: pruebas nuevas | 4 correctas con 21 aserciones sobre desconocidos, inalcanzables y máximo DAG. |
| Sintaxis | `node --check` correcto en los 13 JavaScript modificados/nuevos. |

Las suites completas de Algo **no están enteramente verdes**: contexto tiene 31 correctas y 7 fallidas; conocimiento, 27 correctas y 9 fallidas. Se ejecutaron también contra la copia inicial de esta revisión: tenían respectivamente 29/7 y 25/9, con los mismos nombres y mensajes de fallo. Las cuatro pruebas añadidas pasan; los 16 fallos anteriores no se corrigieron dentro de este trabajo centrado en Dijkstra.

Las comprobaciones de navegador se hicieron en Edge con contextos aislados y sin capturas ni instalaciones. El navegador integrado no tenía sesión conectada. No se verificaron dispositivos físicos, lectores de pantalla ni todas las combinaciones posibles de grafos, tamaños y temas. No se hizo una auditoría general.

Se comparó contra una copia inicial temporal: no cambiaron las fuentes de Árboles, Difusa, Asignación, Johnson, Northwest ni Ordenamiento. El catálogo de Kruskal conserva contenido y orden, y sus regresiones pasan. Los algoritmos de `js/grafos/algoritmos.js` y el motor `js/difusa/motor.js` permanecen idénticos. Los cambios compartidos de Algo están limitados a la ayuda y al diagnóstico de Dijkstra.

## Entrega local actualizada

- Aplicación: `http://127.0.0.1:8123/dijkstra.html`. El servidor responde con las fuentes actuales y sin caché.
- Drop: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\drop\`
- ZIP: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\ciudad-algoritmos-netlify.zip`
- Regeneración: `node scripts/preparar-netlify.js`, sin publicar.
- **102 archivos** idénticos byte por byte entre fuente, `public/`, `drop/` y ZIP; CRC correcto e inclusión de `js/northwest/optimizacion.js` comprobada.
- ZIP: **532112 bytes**. SHA-256: `21b88155780c6f7659d07847f3cabbc50841de505cecbfe32456f58c417c9502`.

Los informes anteriores describen entregas históricas; este documento identifica el catálogo y paquete actuales.
