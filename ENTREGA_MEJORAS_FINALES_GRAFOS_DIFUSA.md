# Entrega local: mejoras finales de grafos y lógica difusa

Fecha: 15 de noviembre de 2026. Proyecto: Ciudad de los Algoritmos.

## Alcance y conservación

Se trabajó sobre las fuentes existentes, conservando los cambios locales. La carpeta no tiene repositorio Git: se tomó una copia temporal inicial y se compararon los archivos contra ella para revisar el diff y comprobar la conservación de los módulos protegidos.

Asignación, Johnson y Northwest conservan su implementación, interfaz, ejemplos, documentación específica y pruebas. Ordenamiento y Árboles tampoco fueron editados. El núcleo `js/difusa/motor.js` permanece intacto. En los algoritmos de grafos solo cambió el diagnóstico de máximo incompatible con ciclos; no se sustituyeron sus cálculos.

Algo continúa siendo completamente local. No se agregaron dependencias, APIs ni servicios. No hubo commits, push, publicaciones ni capturas.

## Hallazgos cerrados

| Hallazgo | Cambio y evidencia |
| --- | --- |
| G-01 | Los valores no finitos se presentan como «Sin camino desde [origen]», antes de comprobar si un vértice fue procesado. No reciben marca de valor definitivo ni estilo de éxito. Comprobado con A→B=2 y C aislado en máximo, incluida la explicación de Algo. |
| G-02 | Se distinguen edición inicial, resultado vigente y resultado pendiente. Los cambios matemáticos indican qué cambió y ofrecen recalcular junto al grafo. Cambiar solo destino conserva el mismo objeto de resultado. Mover y renombrar conservan su validez y actualizan la presentación. |
| G-03 | Crear o renombrar impide nombres duplicados con una normalización común. Los duplicados antiguos se cargan sin renombrarlos y se distinguen mediante IDs estables en lienzo, selectores, tablas, resultados y Algo. |
| G-04 | Cada etiqueta de configuración de Dijkstra está agrupada con su control. Hay dos columnas explícitas y una en móvil; la explicación ocupa la fila completa. Comprobados controles utilizables a 320, 390, 768 y 1440 px. |
| G-05 | Calcular sigue abriendo Resultado. «Paso a paso» es opcional y no se marca visitado solo por disponer de un cálculo. |
| F-01 | Cambiar antecedentes, conector, consecuente, peso o habilitación actualiza la regla localmente. Se conservan foco, selección y desplazamiento con 27 y 125 reglas. Duplicar enfoca la creada; borrar enfoca una vecina. |
| F-02 | Una entrada nueva queda vacía. Evaluar señala el error junto al campo mediante `aria-invalid` y `aria-describedby`, enfoca el primero incorrecto y conserva los demás valores. El resultado anterior queda invalidado. |
| F-03 | Añadir una entrada conserva «No importa» en las reglas existentes. Se explica su falta de participación, se cuenta cuántas reglas habilitadas con peso positivo la utilizan y existe acceso directo a editar sus condiciones, incluso cuando todavía ninguna la utiliza. |
| F-04 | Aplicado y Borrador aparecen diferenciados. El editor cuenta el borrador y los resultados corresponden al modelo aplicado. Aplicar o cancelar comunica la necesidad de evaluar nuevamente cuando se descartó un resultado. |
| I-01 | El catálogo anuncia mínimo y máximo DAG de Dijkstra, árbol/bosque mínimo/máximo de Kruskal y de una a tres entradas con una salida en difusa. Se retiró la descripción general de «nueve reglas» y se añadió difusa al recorrido del inicio. |
| T-01 | La suite conserva sus exigencias de legibilidad y ahora comprueba que Calcular abre Resultado con foco y que el procedimiento aún no está visitado. Se corrigieron la fuente inicial de nombres y el ancho mínimo de la tabla de escritorio; no se redujeron los umbrales de legibilidad. |

## Política exacta de pesos, conexiones y nombres

- Dijkstra y Kruskal aceptan pesos enteros de **0 a 999999**, incluidos ambos extremos. Cero representa una conexión real.
- La entrada se valida completa: se rechazan negativos, vacío, texto parcial como `12abc`, decimales, `NaN`, infinito y valores fuera del rango. No se truncan números, no se convierten vacíos en cero ni negativos en positivos.
- Los documentos JSON requieren pesos numéricos enteros finitos. La misma validación se utiliza al editar, generar, cargar ejemplos, importar, restaurar y recuperar trabajos.
- La exclusión de negativos en Kruskal es una decisión del producto. El algoritmo matemático sí puede procesarlos.
- Se rechazan conexiones consigo mismo, extremos inexistentes y duplicados. Cada situación tiene un diagnóstico distinto.
- Kruskal y Dijkstra no dirigido consideran A—B y B—A la misma conexión. Dijkstra dirigido admite A→B y B→A como conexiones distintas en mínimo.
- Se conservan los ciclos entre distintos nodos en la entrada de Kruskal y en Dijkstra mínimo. Kruskal descarta ciclos únicamente en las conexiones seleccionadas.
- Dijkstra máximo exige dirección y ausencia de ciclos; utiliza relajación en orden topológico. Un incumplimiento bloquea el cálculo y conserva el grafo. Cambiar de objetivo no convierte ni elimina conexiones.
- Los nombres mantienen el límite de 12 caracteres. Para comparar duplicados se ignoran mayúsculas y espacios exteriores, y se agrupan los espacios internos consecutivos. Esta normalización se usa para comparar; no reescribe nombres antiguos.

## Tratamiento de trabajos antiguos

Los trabajos con nombres repetidos siguen siendo recuperables: se muestran, por ejemplo, `A [n1]` y `A [n2]`. Para IDs largos se usa una marca breve derivada del ID, con detección de colisión. El nombre guardado no cambia. Se permite moverlos, calcular y corregirlos mediante Renombrar.

No se implementó una vista especial para revisar pesos negativos antiguos. Se utiliza la alternativa transaccional solicitada: **rechazar la carga antes de reemplazar el ejercicio**, identificando la conexión y su peso. No se eliminan aristas ni se transforma el original. La reconstrucción de un resultado guardado también se valida antes de modificar el historial: un máximo guardado incompatible con un ciclo conserva tanto el ejercicio como Deshacer/Rehacer. Para corregirlo, exporta/conserva el original y modifica una copia de su JSON antes de importarla.

La biblioteca existente conserva sus registros y su exportación. Ante un autoguardado incompatible, el mecanismo existente protege el original y pausa su sobrescritura hasta una acción explícita. Se verificó además el rechazo transaccional de documentos negativos en ambos grafos, manteniendo intactos el documento de entrada y el ejercicio activo.

## Resultados y ejemplos verificados

Se conservaron los ejemplos correctos; el caso de clase de Dijkstra ya aporta un DAG con rutas mínima y máxima diferentes, por lo que no se duplicó.

| Módulo y ejemplo | Resultado comprobado |
| --- | --- |
| Dijkstra, caso de clase, A→D | Mínimo: A→C→B→D, `1 + 2 + 1 = 4`. Máximo: A→C→D, `1 + 5 = 6`. |
| Dijkstra, nuevo ejemplo A→B y C aislado | Desde A: A=0, B=2, C sin camino. En máximo, el estado interno de C es −∞ y la interfaz explica que no es alcanzable. |
| Dijkstra, nuevo ejemplo cíclico | A→B=2, B→A=1, B→C=3. Mínimo A→C=5; máximo bloqueado por ciclo, sin alterar las conexiones. |
| Kruskal, caso de clase con ciclos | Mínimo 6; máximo 12. Se conservan todas las decisiones, incluidas las conexiones descartadas por ciclo. |
| Kruskal, ceros y empates | Sustituye únicamente los negativos del ejemplo didáctico: mínimo 2 y máximo 4; desempate estable según orden original. |
| Kruskal, grupos separados | Pesos no negativos: mínimo 3 y máximo 6. Tres componentes, incluida F aislada con cero conexiones y subtotal cero. |
| Difusa, nuevo ejemplo de tres entradas | Temperatura 0–40 °C, humedad 0–100 %, ocupación 0–20 personas → nivel de ventilación 0–100 %. Tres conjuntos por variable y 27 reglas completas. Ejemplo didáctico, sin calibración para control real. |
| Difusa, caso 1 | 20 °C, 50 %, 0 personas: se activa `r13`, consecuente Baja; centroide `50/3 ≈ 16,6666666667 %`. |
| Difusa, caso 2 | 20 °C, 50 %, 20 personas: se activa `r15`, consecuente Alta; centroide `250/3 ≈ 83,3333333333 %`. |
| Difusa, salida estrecha | Se conserva el centroide continuo **0,02**, aunque los puntos uniformes auxiliares tengan pertenencia cero. |

La ocupación aparece en las 27 reglas habilitadas con peso positivo del ejemplo. Los dos casos se ofrecen mediante botones, mantienen temperatura y humedad iguales y muestran un cambio verificable de regla activa y salida. Sus centroides también se contrastaron con los centros geométricos de los hombros triangulares de salida.

En Kruskal se presentan conexión y peso, grupos antes y después, decisión y motivo, peso acumulado y cantidad elegida. La tabla mantiene su fila actual mediante el desplazamiento de su propio contenedor. Al completar la red se explica que las decisiones restantes descartan ciclos y se ofrece ir al resultado. Cada componente muestra un subtotal obtenido de las conexiones realmente elegidas y se conserva `E elegidas = V − C`.

## Mejoras de lógica difusa

- Conservadas de una a tres entradas, una salida, de dos a cinco conjuntos por variable, hasta 125 reglas, AND/OR, pesos, habilitación y «No importa».
- Conservadas las validaciones de dominios, parámetros, referencias y operaciones transaccionales de borrador, aplicación, cancelación, guardado e importación.
- Contadores de completas, pendientes, deshabilitadas y con avisos. Los contadores pueden solaparse; una regla inválida no se cuenta como completa.
- Cantidad real de combinaciones visible antes de generar. Se conserva la confirmación de reemplazo y los consecuentes quedan pendientes, sin inventar decisiones.
- Filtros por pendientes, avisos y entrada/conjunto utilizado. Solo cambian la visibilidad, sin alterar IDs, orden, datos o exportación. Una edición no oculta el control que se está usando.
- Conjuntos compactos y expandibles, parámetros explicados, curva seleccionada destacada por grosor además de color y aviso «Última vista válida» ante parámetros inválidos.
- Resultado numérico y unidad prioritarios; entradas evaluadas, reglas activadas y participación por entrada. Se diferencia participación estructural de influencia efectiva.
- Desarrollo plegable en pertenencias, reglas, agregación y centroide. Accesos a reglas activas, mapa y cálculo completo. Las reglas conservan su ID original al filtrar.
- El mapa conserva curva de una entrada y dos ejes distintos con dos o tres entradas. La entrada fija muestra nombre, valor y unidad. Modelo, ejes y valor fijo invalidan el mapa. También lo invalidan las entradas de evaluación, los casos rápidos y Restablecer, actualizando sus controles.
- Conservados la cancelación, los estados sin salida y la integración continua de la envolvente. No se sustituyó por muestreo ni promedio y no se afirma equivalencia con MATLAB.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| `node --check` sobre los JavaScript modificados/nuevos, incluido el empaquetador | Sin errores de sintaxis. |
| IDs y referencias locales de los HTML modificados | Sin IDs duplicados ni recursos locales ausentes. |
| `node tests/grafos.test.js` | 27 correctas. Conserva referencias independientes de Floyd-Warshall y enumeración exhaustiva, ambos objetivos y estado transaccional. |
| `npm.cmd run test:difusa` | 56 correctas: núcleo, modelo, estado y mapa. Incluye el centroide estrecho 0,02. |
| `node tests/logica-difusa-editor.test.js` | 5 correctas de generación y validación transaccional. |
| `node tests/mejoras-finales.test.js` | 6 correctas nuevas: política numérica y documentos, nombres antiguos, ejemplos, influencia de ocupación, entradas pendientes y ayuda local. |
| `node tests/mejoras-finales-navegador.js` | 70 comprobaciones correctas en Edge con contextos aislados, sin errores de página. Incluye foco y desplazamiento con 27/125 reglas, duplicar/borrar, acceso directo a tercera entrada, validación local, ejemplos, mapa, etiquetas antiguas, carga negativa transaccional y responsive. |
| `node tests/fase2-difusa-navegador.js` | 22 comprobaciones correctas en escritorio oscuro y móvil claro con entrada táctil emulada; incluye error local, teclado y centroide estrecho. |
| T-01, Dijkstra 390 claro y 320 claro | 59 comprobaciones correctas en cada caso, sin errores de consola/página. |
| T-01, Kruskal 768 claro y 1440 oscuro | 59 y 58 comprobaciones correctas respectivamente, sin errores de consola/página. |
| Comparación contra la copia inicial | Ninguna fuente protegida modificada; cambios fuera de los tres módulos limitados a textos/adaptadores necesarios y la lista de copia del empaquetador. |
| Paquete | 102/102 archivos idénticos byte por byte entre fuente, `public/`, `entrega-netlify/drop/` y el ZIP. |

Durante las comprobaciones se corrigieron desplazamientos causados por avisos de borrador, la sincronización del valor fijo al utilizar casos rápidos y el ancho mínimo excesivo de la tabla de Kruskal en escritorio. Las pruebas de negativos antiguos se adaptaron a la política solicitada sin retirar las aserciones de rechazo, atomicidad o cálculo independiente.

No se ejecutaron pruebas de Asignación ni Johnson. No se hizo una auditoría integral ni una matriz completa de todos los tamaños y temas. Las comprobaciones móviles utilizan emulación de Edge, no dispositivos físicos ni lectores de pantalla. MATLAB sigue sin verificarse. Estas comprobaciones acotadas no garantizan ausencia absoluta de errores.

## Archivos modificados

Fuentes y textos:

- `index.html`
- `logica-difusa.html`
- `css/grafos.css`
- `css/difusa.css`
- `js/grafos/modelo.js`
- `js/grafos/algoritmos.js` — solo diagnóstico de ciclo incompatible con máximo.
- `js/grafos/editor.js`
- `js/grafos/app.js`
- `js/difusa/modelo.js`
- `js/difusa/estado.js`
- `js/difusa/editor.js`
- `js/difusa/dibujo.js`
- `js/difusa/app.js`
- `js/comun/catalogo.js`
- `js/comun/inicio.js`
- `js/comun/asistente-contexto.js` — ramas de grafos y difusa; motor de Algo intacto.
- `js/comun/conocimiento/algoritmos-grafos.js` — política de Kruskal.
- `js/comun/conocimiento/algoritmos-datos.js` — ayuda de difusa.
- `tests/grafos.test.js`
- `tests/usabilidad-grafos-navegador.js`
- `scripts/preparar-netlify.js`

Nuevos:

- `tests/mejoras-finales.test.js`
- `tests/mejoras-finales-navegador.js`
- `ENTREGA_MEJORAS_FINALES_GRAFOS_DIFUSA.md`

El empaquetado regeneró las copias públicas, el manifiesto y el ZIP. El script existente omitía `js/northwest/optimizacion.js`, que ya estaba referenciado por el HTML aprobado. Se añadió únicamente a la lista de copia: **no se editó ni añadió implementación de Northwest**.

## Entrega para Netlify

Se regeneró mediante `node scripts/preparar-netlify.js`. No se publicó.

- Carpeta pública: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\public\`
- Carpeta para arrastrar: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\drop\`
- ZIP estático: `C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\ciudad-algoritmos-netlify.zip`
- ZIP: **102 archivos, 525381 bytes**.
- SHA-256: `b5533fe913147e016dbe7cf23a2185e7080961c1d1395b49c369081af36b5de4`.

El ZIP contiene los mismos archivos de `drop/` y debe extraerse si se utiliza una carpeta para la carga manual. Asignación, Johnson y Northwest conservan sus fuentes originales; sus copias en el paquete son mecánicas.
