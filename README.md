# Grafo · versión corregida

Editor de grafos y aplicación de asignación, en HTML, CSS y JavaScript. No requiere npm ni compilación.

## Abrir en Visual Studio Code

1. Descomprime el ZIP. Abre la carpeta `grafo-mejorado` en VS Code.
2. Abre `index.html` con **Live Server → Open with Live Server**.
3. También puedes ejecutar `python -m http.server 8123` en esa carpeta y abrir `http://localhost:8123`.

Para actualizar el proyecto anterior, copia **todo el contenido** de esta carpeta dentro de tu carpeta del proyecto, aceptando reemplazar los archivos. Incluye `mejoras.css`, `js/mejoras.js` y `js/hungaro.js`: son nuevos. Mantén los nombres y la carpeta `js/`.

Haz una copia del proyecto anterior. Si tienes grafos importantes, expórtalos como JSON antes de actualizar. El almacenamiento está asociado al navegador, host y puerto: cambiar de dirección puede hacer que aparezca vacío aunque el guardado anterior siga existiendo. Recarga con Ctrl+F5 después de reemplazar.

## Qué cambió

- Reconstrucción de ciclos negativos corregida.
- Método húngaro completo: ceros independientes, candidatos, caminos alternantes y ajustes. La explicación corresponde a las operaciones ejecutadas.
- Panel de origen y destino, costo y desglose de la ruta con pesos originales.
- Reproducción de la ruta final por tramos, pausa, anterior y siguiente. Esta reproducción no pretende mostrar todas las relajaciones internas de Johnson.
- Gráfico bipartito de asignación, sincronizado con la matriz y la lista de parejas.
- Pestañas Datos, Resultado y Procedimiento; pasos reales del método húngaro con control de reproducción.
- Las ediciones invalidan los resultados; mover nodos conserva el cálculo.
- Cambiar la pantalla ajusta la cámara y conserva las posiciones de los nodos.
- Controles visibles de deshacer/rehacer, ajustar vista, ampliar editor, ejemplo y orden circular.
- Validación de importaciones, errores de autoguardado visibles y gestión del foco en diálogos.
- Objetivo restaurado correctamente en asignación; los campos vacíos no se convierten en cero.

## Johnson

Usa Seleccionar, Nodo y Conectar para editar. La conexión es dirigida y su peso debe ser entero entre −999999 y 999999. Un segundo enlace en el mismo sentido actualiza el anterior; los sentidos opuestos son conexiones distintas. Se admiten bucles y cero.

**Acciones → Cargar ejemplo** carga cinco nodos con un peso negativo pero sin ciclo negativo. A → E tiene costo mínimo 7: A → B → C → D → E.

Elige origen y destino y pulsa **Ver ruta mínima**. La ruta usa celeste; origen verde; destino naranja. La reproducción muestra el costo acumulado. La matriz de Johnson también permite seleccionar rutas.

**Calcular Johnson** abre todas las distancias y el resumen del procedimiento: potenciales, reponderación y recuperación de distancias. Un ciclo negativo se muestra en rojo. **Dijkstra**, en Acciones, parte del nodo seleccionado y rechaza pesos negativos.

El límite es 150 nodos y 3000 conexiones; los cálculos son síncronos. La selección del mínimo de Dijkstra se hace por barrido, por lo que Johnson tiene complejidad O(VE + V³) en esta implementación. Es una herramienta educativa para grafos pequeños.

**Ajustar** encuadra el grafo. **Ordenar en círculo** cambia posiciones y se puede deshacer. Cambiar el tamaño de la ventana no altera posiciones guardadas. La ampliación del editor es un modo dentro de la página, no una nueva ventana.

## Asignación

Admite de 1 a 8 recursos y tareas, con valores enteros entre −999999 y 999999. Se conservó este límite para mantener legibles el gráfico y el procedimiento. No admite casillas prohibidas ni capacidades múltiples.

Cada recurso recibe como máximo una tarea y cada tarea como máximo un recurso. Se eligen `min(filas, columnas)` parejas reales. La matriz rectangular se completa con elementos ficticios de valor cero; se indican los recursos o tareas restantes.

Al maximizar se transforma la matriz en pérdidas. El total final SIEMPRE se calcula con los datos originales, no con los valores reducidos. Puede haber varias soluciones óptimas: se presenta una de ellas.

El ejemplo 3×3 requiere un ajuste adicional después de las reducciones y tiene costo óptimo 1. En Procedimiento, ★ identifica una asignación provisional, ′ un candidato y las líneas indican cobertura. No todos los pasos son resultados finales.

El gráfico muestra solo las parejas elegidas inicialmente. Activa **Mostrar todas las conexiones** para explorar alternativas. Al seleccionar una casilla se resalta también su conexión, incluso si no pertenece al óptimo. En pantallas estrechas, el gráfico y las matrices se desplazan dentro de sus contenedores.

**Exportar JSON** guarda el problema y, si está vigente, el resultado. **Imprimir / PDF** imprime la vista activa mediante el navegador. La importación JSON sigue disponible para grafos; no se añadió importación de asignaciones en esta versión.

## Archivos

- `index.html`: portada.
- `johnson.html`, `app.js`: editor y eventos principales.
- `asignacion.html`: página de asignación.
- `styles.css`: estilos originales.
- `mejoras.css`: componentes nuevos y ajustes responsive.
- `js/hungaro.js`: cálculo puro del método húngaro y registro de pasos.
- `js/asignacion.js`: formulario, persistencia, gráfico y procedimiento de asignación.
- `js/mejoras.js`: consulta y reproducción de rutas, invalidación, ejemplos y foco.
- Resto de `js/`: módulos originales corregidos para grafos, matrices, biblioteca, historial y cámara.
- `tests/algoritmos.cjs`: comparación con referencias independientes. Ejecutar con `node tests/algoritmos.cjs` si tienes Node instalado. Node no es necesario para usar la aplicación.

## Comprobación rápida

1. Johnson: cargar ejemplo, consultar A → E y verificar 7. Reproducir y pausar.
2. Editar un peso y verificar que el resaltado anterior desaparece. Consultar otra vez.
3. Crear un bucle de peso −1 y verificar la advertencia y su resaltado rojo.
4. Cambiar tamaño/orientación y verificar que las coordenadas originales permanecen.
5. Deshacer/rehacer una edición y recuperar un grafo después de cargar otro.
6. Asignación: cargar ejemplo, resolver y verificar 1. Consultar todos los pasos.
7. Seleccionar una casilla no elegida y comprobar su conexión en el gráfico.
8. Cambiar a maximizar, recargar y comprobar que sigue marcado Maximizar.
9. Vaciar una casilla y comprobar que impide resolver hasta completarla.
10. Probar una matriz rectangular y comprobar los elementos sin asignar.

Todo se guarda localmente en el navegador. No hay cuentas, backend ni sincronización entre dispositivos.

## Verificación de esta entrega

Se ejecutaron 500 pruebas de grafos contra Floyd-Warshall, incluyendo 189 casos con ciclo negativo cuya reconstrucción se verificó, y 400 casos de asignación contra enumeración exhaustiva. También se comprobaron matrices 8×8 y entradas inválidas.

Se probaron eventos de interfaz en un DOM simulado: rutas y tramos, deshacer, conservación de posiciones ante resize, cierre de diálogos, invalidación de resultados, restauración de Maximizar, campos vacíos, selección en el gráfico y pasos. Estas pruebas no validan el diseño visual ni los gestos en dispositivos reales. La revisión visual en un navegador real no pudo completarse en el entorno de preparación; usa la comprobación rápida anterior para probarlo en tu equipo.
