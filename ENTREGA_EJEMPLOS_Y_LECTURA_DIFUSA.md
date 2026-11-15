# Entrega local: ejemplos y lectura de resultados

15 de noviembre de 2026 · Ciudad de los Algoritmos.

## Ejemplos y resultados comprobados

Los catálogos explican qué observar y distinguen niveles cuando corresponde. Los ejemplos cargan los datos, la dirección y el origen/destino sugeridos; dejan accesible y enfocada la acción siguiente. Los valores de resultado provienen del cálculo del módulo.

| Módulo | Ejemplos nuevos | Referencias verificadas |
| --- | --- | --- |
| Árboles | BST equilibrado: 40, 20, 60, 10, 30, 50, 70 | Preorden: 40, 20, 10, 30, 60, 50, 70. Inorden: 10, 20, 30, 40, 50, 60, 70. Postorden: 10, 30, 20, 50, 70, 60, 40. |
| Árboles | BST en cadena: 10, 20, 30, 40, 50 | Inorden ascendente; postorden: 50, 40, 30, 20, 10. Visible con Ajustar en móvil. |
| Árboles | Árbol general, dos fichas: inorden + preorden e inorden + postorden | Ambas reconstruyen la misma estructura con raíz 6. Inorden: 8, 2, 6, 4, 1; preorden: 6, 2, 8, 1, 4; postorden: 8, 2, 4, 1, 6. |
| Dijkstra | El atajo aparente | A→B→C→D: mínimo 6; A→D: máximo 9. |
| Dijkstra | Edificios de un campus | Entrada—Patio—Bloque—Biblioteca: mínimo 60. Máximo conserva el bloqueo por grafo no dirigido. Datos didácticos. |
| Kruskal | Cableado entre edificios | Mínimo 9: AB, BC, CD. Máximo 22: AD, BD, AC. |
| Kruskal | Varias soluciones óptimas | Mínimo 3; máximo 6. Se conservan las decisiones que descartan ciclos y la igualdad E elegidas = V − C. |

Se conservaron todos los ejemplos anteriores. Para evitar duplicados equivalentes, se reutilizaron «Ceros y rutas empatadas» en Dijkstra y «Grupos separados» en Kruskal, mejorando sus explicaciones. No se añadieron copias de los casos propuestos de empate 5 o bosque 9/13: el bosque existente mantiene mínimo 3 y máximo 6, con tres componentes y el punto aislado.

Difusa reutiliza sus cuatro modelos, agrupados en una, dos y tres entradas. Ventilación con 24 °C, 65 % y 15 personas conserva el centroide interno 55,95238095238095 y muestra **55,95 %**, con **8 de 27 reglas activas**. Ocupación tiene pertenencia 0,5 a Media y 0,5 a Alta. Con 20 °C y 50 % constantes, 0 personas activa r13 y produce 16,67 %; 20 personas activa r15 y produce 83,33 %.

## Cambios de lectura y navegación

- Árboles separa inserción y reconstrucción. Cargar detiene la reproducción; cancelar conserva el árbol. Recorrido, resaltado y secuencia textual siguen sincronizados. Se corrigió la aceptación de cancelaciones del diálogo en este módulo.
- Dijkstra presenta primero origen y alcanzables y agrupa los demás bajo «Sin camino desde [origen]», con cantidad y lista desplegable. La ruta, suma y total aparecen junto al grafo; cambiar destino reutiliza el cálculo. El trazo segmentado distingue la ruta del árbol de mejores caminos y permite volver a todos los destinos. Los inalcanzables tienen contorno de puntos sin atenuar sus nombres.
- Kruskal prioriza árbol/bosque, objetivo, total y conexiones. Las herramientas de creación se agrupan en «Editar grafo»; la edición de una selección conserva su acceso a formularios. Elegidas y descartadas mantienen patrón y texto. Se verificó el encuadre existente antes de decidir conservarlo.
- Difusa muestra un resumen breve y deja precisión, pertenencias y participación en un desplegable. Cada gráfica tiene una lectura local. La primera consulta filtra reglas activas y selecciona la de mayor activación, respetando empates y selección manual. «Ver todas» y «Ver recorte» permiten inspeccionar las inactivas con su motivo.
- Centroide e inspección tienen líneas distintas y dos filas de rótulos dentro del SVG, incluso si coinciden o llegan a los bordes. El selector muestra el valor y la unidad sin recalcular el centroide. Los accesos directos abren la sección y enfocan su encabezado; el desarrollo permanece cerrado al obtener una evaluación nueva.

## Comprobaciones acotadas

| Ejecución | Resultado |
| --- | --- |
| `node tests/arboles.test.js` | 16 correctas. Solo se adaptó la simulación de DOM para el catálogo; se conservaron las aserciones existentes. |
| `node tests/grafos.test.js` | 27 correctas. |
| `npm.cmd run test:difusa` | 56 correctas, incluido el centroide continuo estrecho 0,02. |
| `node tests/logica-difusa-editor.test.js` | 5 correctas. |
| `node tests/ejemplos-modulos.test.js` | 5 correctas nuevas con las referencias de la tabla. |
| `node tests/ejemplos-lectura-navegador.js` | 83 comprobaciones correctas en Edge; sin errores de página ni capturas. |
| `node tests/fase2-difusa-navegador.js` | 22 comprobaciones correctas en escritorio oscuro y móvil claro con entrada táctil emulada. |
| `node tests/mejoras-finales-navegador.js --solo-difusa` | 31 comprobaciones correctas: foco y desplazamiento con 27/125 reglas, validación local, mapa, casos rápidos y responsive. |
| `node tests/usabilidad-grafos-navegador.js --caso=dijkstra-390-claro` | 59 comprobaciones correctas. |
| `node tests/usabilidad-grafos-navegador.js --caso=kruskal-1440-oscuro` | 58 comprobaciones correctas. |
| Sintaxis e integridad | `node --check` sin errores en los JavaScript modificados/nuevos. HTML modificado sin IDs repetidos ni recursos locales ausentes. |

La revisión nueva utiliza contextos aislados, datos de prueba y zoom normal; comprueba grafos a 320/1440 px y etiquetas difusas a 320/390/1440 px. Incluye confirmación cancelada, carga mediante los mecanismos de documentos existentes, conservación de resultados al consultar, foco en accesos directos y separación de Algo/cabecera respecto al lienzo.

No hubo capturas adjuntas accesibles: se reprodujeron los problemas descritos antes de cambiar estilos. En móvil de 390 px se constató el resumen inicial extenso, la primera regla inactiva seleccionada y las herramientas de creación abiertas en Resultado. La prueba actual exige un resumen inferior a 450 px para la evaluación de 55,95 %. No se hicieron capturas nuevas.

La carpeta no tiene Git. Se comparó contra una copia temporal inicial: solo cambiaron fuentes de estos cuatro módulos y sus pruebas. Asignación, Johnson, Northwest y Ordenamiento permanecen intactos; también `js/difusa/motor.js` y `js/grafos/algoritmos.js`. No se instalaron dependencias ni se utilizaron guardados personales. No se ejecutaron pruebas de módulos protegidos ni una auditoría general. Quedan sin comprobar dispositivos físicos, lectores de pantalla y una matriz completa de tamaños/temas.

## Paquete actual

Regenerado con `node scripts/preparar-netlify.js`, sin publicar. Los **102 archivos** son idénticos byte por byte entre las fuentes, `public/`, `drop/` y el ZIP. ZIP con CRC correcto e inclusión comprobada de `js/northwest/optimizacion.js`.

- Drop: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\drop\`
- ZIP: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\ciudad-algoritmos-netlify.zip`
- Tamaño del ZIP: **530453 bytes**.
- SHA-256: `79fc9ed85dec3ba3d6053e8edd3a9cb665af594d035c531684086ea67c1c65f4`.
- Servidor local: `http://127.0.0.1:8123/`; se comprobó respuesta 200 y contenido actual de inicio y los cuatro módulos.

La publicación queda a cargo del usuario. El informe anterior conserva el registro de la entrega anterior; este documento identifica el paquete actualizado.
