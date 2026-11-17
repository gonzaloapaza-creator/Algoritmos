# Análisis actual de Kruskal, Dijkstra y lógica difusa

**Fecha:** 17 de noviembre de 2026, zona America/La_Paz.

**Proyecto:** Ciudad de los Algoritmos.

**Base revisada:** archivos locales del proyecto, con `HEAD` en `20cc886`.
**Tipo de entrega:** análisis y diagnóstico; no se modificó la implementación.

## 1. Alcance y resultado de la revisión

Se revisaron exclusivamente los módulos pendientes solicitados: **Kruskal, Dijkstra y lógica difusa**, junto con el código compartido necesario para entenderlos. Asignación, ordenamiento, Johnson y árboles conservan su visto bueno y quedan fuera de esta evaluación. Esquina noroeste tampoco forma parte del alcance solicitado.

| Módulo | Estado observado | Errores o pendientes relevantes |
|---|---|---|
| Kruskal | Implementación funcional de expansión mínima y máxima, con soporte para bosques y procedimiento real. | No se encontraron errores de cálculo en las pruebas realizadas. Existen restricciones de producto que deben respetarse: pesos enteros no negativos, grafo simple y límites de tamaño. |
| Dijkstra | Caminos mínimos funcionales; el objetivo máximo se resuelve mediante un algoritmo independiente sobre DAG. | No se encontraron errores de cálculo en las pruebas realizadas. El máximo exige que todo el grafo sea dirigido y acíclico. |
| Lógica difusa | Sistema Mamdani configurable, con editor, persistencia, procedimiento e integración continua del centroide. | Fallos del deslizador en ciertos dominios numéricos válidos; pérdida de información en etiquetas; una suite de navegador conserva resultados esperados obsoletos. |
| Verificación | Hay pruebas matemáticas, de estado y de navegador relevantes. | `npm test` no incluye las pruebas funcionales de lógica difusa. Las pruebas completas de navegador de ese módulo no terminan por la referencia obsoleta. |

**Conclusión:** los casos ejecutados respaldan los motores matemáticos de los tres módulos dentro de su dominio implementado. Los problemas nuevos identificados se concentran en los controles y la verificación de lógica difusa. Esto no equivale a certificar todas las entradas posibles ni todos los navegadores.

## 2. Cómo se verificó

- Lectura del HTML, configuración, modelos, motores, controladores, almacenamiento y pruebas relevantes.
- Ejecución de las suites dirigidas existentes; se registraron también sus fallos.
- Comparación adicional del máximo en DAG contra enumeración independiente de caminos.
- Comprobación de límites numéricos y de la aritmética de los controles de lógica difusa.
- Pruebas de navegador existentes con Edge en contextos aislados, sin perfiles personales ni capturas nuevas.

**Entorno de ejecución:** Windows, Node `v26.12.1`, Microsoft Edge `157.0.4341.60`, Puppeteer disponible en el entorno de pruebas.

Se compararon mediante SHA-256 los tres HTML y los once JavaScript de `js/grafos/` y `js/difusa/`: los **14 archivos coinciden** con sus copias de `public/` y `entrega-netlify/drop/`. Por ello, los resultados sobre esos archivos del Drop corresponden también a la implementación fuente revisada. No se regeneraron paquetes ni se publicó el proyecto.

Los errores de los controles numéricos descritos en H-01 y H-02 se reprodujeron ejecutando el controlador original con DOM simulado y el estado real del módulo. **No se comprobó la interacción de esos dominios extremos en un navegador real**; la normalización nativa del elemento `range` podría añadir otros efectos. La suite general de navegador de lógica difusa se detuvo en el fallo indicado en H-04.

## 3. Estructura de los módulos revisados

| Archivos | Responsabilidad actual |
|---|---|
| `dijkstra.html`, `kruskal.html` | Páginas independientes de los dos módulos de grafos. |
| `js/grafos/modelo.js` | Validación, operaciones transaccionales, documentos JSON, ejemplos y generación aleatoria. |
| `js/grafos/algoritmos.js` | Dijkstra mínimo, máximo en DAG, reconstrucción de rutas y Kruskal. |
| `js/grafos/editor.js` | Dibujo y manipulación del grafo SVG, selección, arrastre y herramientas. |
| `js/grafos/app.js` | Formularios, configuración, ejecución, pasos, resultados, historial e importación/exportación. |
| `js/config.js`, `js/comun/guardados.js` | Límites comunes, claves de almacenamiento y biblioteca de trabajos. |
| `logica-difusa.html` | Vistas de inicio, variables, reglas, evaluación y resultado. |
| `js/difusa/modelo.js` | Contrato del sistema, validación, cobertura, ejemplos y combinaciones de reglas. |
| `js/difusa/motor.js` | Pertenencias, inferencia Mamdani, recortes, agregación e integración continua. |
| `js/difusa/estado.js` | Modelo aplicado, entradas, invalidación, migración, importación y trabajos. |
| `js/difusa/editor.js`, `app.js`, `dibujo.js`, `mapa.js` | Borradores, interfaz, gráficas y mapa de respuesta cancelable. |

**Aclaración sobre el archivo activo del IDE:** `app.js` en la raíz es el punto de entrada de Johnson. Los módulos independientes Dijkstra y Kruskal se controlan desde `js/grafos/app.js`. El archivo `js/dijkstra.js` pertenece a la integración anterior de Dijkstra en Johnson; no es el motor principal de `dijkstra.html`.

## 4. Valores y validaciones compartidos por Kruskal y Dijkstra

Fuentes principales: `js/config.js:9`, `js/grafos/modelo.js:5`, `js/grafos/modelo.js:32` y `js/grafos/modelo.js:149`.

| Dato | Valores realmente aceptados | Rechazos y observaciones |
|---|---|---|
| Número de vértices | De 0 a 24 en el editor/documento; de 1 a 24 para calcular. | El grafo vacío puede guardarse o editarse, pero no resolverse. |
| Número de aristas | De 0 a 96, sujeto también al número de parejas diferentes disponibles. | Sin bucles propios ni aristas paralelas. |
| Peso de arista | Entero de **0 a 999999**, extremos incluidos. | Rechaza negativos, decimales, infinitos y `NaN`. |
| Nombre de vértice | Texto no vacío, máximo 12 caracteres. | En altas y renombres se recortan espacios exteriores y se impiden duplicados normalizados. |
| Comparación de nombres al editar | Ignora mayúsculas y espacios repetidos o exteriores. | Los documentos antiguos pueden conservar nombres duplicados; se distinguen mediante una marca derivada del ID. |
| ID de nodo o arista en JSON | Texto de 1 a 80 caracteres, sin espacios exteriores. | Debe ser único entre todos los nodos y aristas del grafo. |
| Posición X | Número finito entre 30 y 970. | Puede ser decimal. |
| Posición Y | Número finito entre 30 y 570. | Puede ser decimal. |
| `siguienteId` | Entero seguro positivo, menor que `Number.MAX_SAFE_INTEGER`. | Se valida para poder generar identificadores. |
| Objetivo | `min` o `max`. | Otras opciones se rechazan. |
| Archivo de importación directa | JSON de hasta **1048576 bytes**. | Se valida antes de reemplazar el ejercicio. |
| Historial | Hasta 50 cambios deshacibles. | Deshacer/rehacer restaura documentos del módulo. |
| Biblioteca común | Hasta 50 trabajos por módulo; nombre de trabajo de hasta 60 caracteres. | El límite del nombre de trabajo es distinto del nombre de un vértice. |

### 4.1. Formato de los pesos escritos

El editor exige una representación textual de entero, no cualquier texto que JavaScript pueda convertir a número.

| Entrada escrita | Resultado comprobado |
|---|---|
| `0`, `999999` | Aceptadas. |
| `001` | Aceptada como 1. |
| `-0` | Aceptada como cero. |
| `-1`, `1000000` | Rechazadas por rango. |
| `1.5`, `1,5` | Rechazadas: los pesos deben ser enteros. |
| `1e3`, `+1` | Rechazadas por el formato textual del editor. |
| Campo vacío o texto | Rechazados. |

En un archivo JSON el peso debe ser un **número entero**, no una cadena. Por ejemplo, `"valor": 3` es correcto y `"valor": "3"` se rechaza. Una notación JSON como `1e3` se convierte al número 1000 al analizar el archivo y puede pasar la validación; el JSON valida el valor numérico resultante.

### 4.2. Generación aleatoria

`generarGrafoAleatorio`, en `js/grafos/modelo.js:302`, admite entre 1 y 24 nodos. El máximo de conexiones es:

- Dirigido: `min(96, n × (n − 1))`.
- No dirigido: `min(96, n × (n − 1) / 2)`.

Los pesos generados están entre **0 y 20**, aunque el editor y la importación aceptan hasta 999999. La generación no fuerza conectividad ni garantiza que el grafo dirigido sea acíclico. Por eso un grafo aleatorio puede producir un bosque en Kruskal o ser incompatible con el máximo en Dijkstra.

### 4.3. Documento JSON y protección del ejercicio

El documento directo usa `version: 1`, `modulo: "dijkstra"` o `"kruskal"`, y `grafo` con `dirigido`, `nodos`, `conexiones` y `siguienteId`. Puede incluir origen, destino, objetivo, vista, paso y estado resuelto.

`validarDocumentoGrafo`, en `js/grafos/modelo.js:200`, rechaza versiones incompatibles, módulos distintos, referencias inexistentes y opciones inválidas. Si se restaura un trabajo resuelto, el resultado se reconstruye antes de asignarlo al ejercicio activo. Una importación inválida conserva el trabajo actual.

El autoguardado utiliza `dijkstra.v1` y `kruskal.v1`. El módulo protege guardados incompatibles mediante el mecanismo común de recuperación. Como usa almacenamiento local del navegador, los datos de `localhost`, `127.0.0.1` y un sitio publicado pertenecen a orígenes diferentes.

## 5. Kruskal

### 5.1. Qué tiene implementado

- Editor de grafo no dirigido: creación, selección, renombre, movimiento y eliminación de vértices y aristas.
- Objetivos de expansión **mínima** y **máxima**.
- Ordenación de aristas por peso y desempate por el orden original de las conexiones.
- Detección de ciclos con conjuntos disjuntos, compresión de caminos y unión por rango.
- Procedimiento con decisión de aceptar/rechazar, componentes antes/después y peso acumulado.
- Resultado con conexiones elegidas, peso total, componentes y subtotales de la red.
- Ejemplos de clase, ceros/empates, desconectado con aislado, cableado y varias redes óptimas.
- Reproducción de pasos, zoom, desplazamiento, organización, ampliación, guardados, JSON, PNG e impresión.

El motor está en `js/grafos/algoritmos.js:171`. Revisa todas las aristas para registrar también los rechazos finales por ciclo. Ese comportamiento es coherente con la finalidad educativa.

### 5.2. Qué acepta específicamente

Solo grafos **no dirigidos**. Se aceptan grafos conectados, desconectados, nodos aislados y aristas de peso cero. No se necesita un origen ni un destino para resolver.

Si hay `V` vértices y `C` componentes, el resultado selecciona `V − C` aristas. En un grafo conectado es un árbol; en uno desconectado es un bosque. Un nodo sin aristas da total 0, una componente y ningún paso de aristas.

**Los pesos negativos no están implementados como entrada permitida**, aunque Kruskal puede trabajar matemáticamente con ellos. La propia ayuda lo explica como política del producto; no es un error del algoritmo.

### 5.3. Casos comprobados y resultados

| Caso | Resultado observado |
|---|---|
| Ejemplo de clase | Mínimo 6; máximo 12. |
| Ceros y empates | Mínimo 2; máximo 4, con desempate estable. |
| Cableado | Mínimo 9; máximo 22. |
| Varias redes óptimas | Mínimo 3; máximo 6. |
| Grafo desconectado | Devuelve bosque, identifica componentes y conserva aislados. |
| Un vértice sin conexiones | Total 0, ninguna arista elegida. |
| Cadena de 24 nodos, pesos 999999 | Total 22999977 tanto en mínimo como en máximo. |

La suite contrasta 28 grafos pequeños con enumeración exhaustiva de bosques. También comprueba ciclos descartados, componentes y el límite 24 nodos/96 aristas.

### 5.4. Errores encontrados y límites

**No se confirmó un error de cálculo o validación específico de Kruskal en esta revisión.** Tampoco falló su revisión de navegador dentro de los escenarios ejecutados.

Los límites actuales son: grafo simple, pesos enteros no negativos, 24 nodos y 96 aristas. Con empates puede haber varios árboles óptimos; cambiar el orden de las aristas puede cambiar cuál se muestra. El coste óptimo no cambia por ese desempate.

El núcleo usa ordenación y Union-Find; su historial educativo añade almacenamiento de componentes por paso. No debe extrapolarse esta implementación a grafos grandes sin revisar el coste del historial.

## 6. Dijkstra y máximo en DAG

### 6.1. Qué tiene implementado

- Editor compartido, con grafos dirigidos o no dirigidos.
- Selección de origen y destino opcional para consultar una ruta.
- **Mínimo:** Dijkstra mediante lista de adyacencia y búsqueda lineal del siguiente pendiente.
- **Máximo:** orden topológico y relajaciones para grafos dirigidos acíclicos.
- Distancias, predecesores, árbol de caminos y reconstrucción con los pesos originales.
- Procedimiento con inicialización, selección, relajación y finalización.
- Distinción entre un nodo todavía no descubierto y un nodo confirmado sin camino.
- Cinco ejemplos guiados: atajo, mejoras, campus, direcciones y ceros/empates.
- Conversión explícita de dirección, resolución de conflictos de pesos opuestos, historial, persistencia y exportación.

Fuentes: `js/grafos/algoritmos.js:10`, `:73` y `:138`.

### 6.2. Valores y condiciones específicas

| Condición | Mínimo con Dijkstra | Máximo en DAG |
|---|---|---|
| Dirigido | Sí. | Sí. |
| No dirigido | Sí; cada conexión se recorre en ambos sentidos. | Se rechaza. |
| Ciclos | Sí, con los pesos no negativos admitidos. | Se rechazan, incluso ciclos de peso cero. |
| Pesos cero | Sí. | Sí. |
| Pesos negativos o decimales | Se rechazan. | También se rechazan por la validación compartida. |
| Origen | Obligatorio y existente. | Obligatorio y existente. |
| Destino | Opcional: permite examinar una ruta de los resultados ya calculados. | Igual. |
| Origen igual a destino | Ruta de un nodo y coste 0. | Igual. |
| Destino inalcanzable | Distancia `∞`, sin ruta. | Distancia `−∞`, sin ruta. |

**El máximo no se obtiene invirtiendo Dijkstra.** Se calcula con otro algoritmo. Exige que **todo el grafo** sea un DAG: un ciclo en una componente desconectada del origen también produce rechazo. Es una condición actual del módulo.

Aunque el algoritmo topológico podría trabajar con pesos negativos, el producto no los admite en este módulo. Esa limitación debe distinguirse de las capacidades matemáticas del algoritmo.

### 6.3. Estado y edición

Cambiar origen, objetivo, conexiones, pesos o dirección invalida el cálculo. Cambiar únicamente el destino conserva las distancias y modifica la consulta de ruta. Mover o renombrar nodos conserva la validez matemática del resultado.

Al convertir de no dirigido a dirigido se generan dos conexiones por cada arista; si se superarían 96 conexiones, la conversión se rechaza. En sentido contrario se fusionan conexiones opuestas y se exige resolver explícitamente los pesos distintos. Cancelar conserva el grafo anterior.

### 6.4. Casos comprobados y resultados

| Caso | Resultado |
|---|---|
| Caso dirigido base desde A | Distancias `[0, 3, 1, 4, ∞]`; ruta a D de coste 4. |
| Atajo aparente | Mínimo a D: 6; máximo: 9. |
| Mejoras sucesivas | Mínimo a E: 8; máximo: 18. |
| Campus no dirigido | Mínimo a Biblioteca: 60; regreso válido; máximo rechazado. |
| Las flechas importan | Mínimo a C: 5; D no es alcanzable desde A. |
| Ceros y empates | Coste a D: 2; se conserva el primer predecesor óptimo. |
| Cadena de 24 nodos, pesos 999999 | Mínimo y máximo: 22999977. |

La suite existente compara Dijkstra contra Floyd-Warshall sobre 32 grafos pequeños y todos sus orígenes.

Se añadió una verificación durante el análisis, sin guardar cambios en los tests: **48 DAG de 2 a 7 nodos, 1112 pares origen/destino y 522 rutas alcanzables**, comparados con enumeración independiente de caminos. Se usaron pesos 0, 1, 2 y 999999, con orden de nodos permutado. Todas las distancias y rutas contrastadas coincidieron.

### 6.5. Errores encontrados y límites

**No se confirmó un error de cálculo específico de Dijkstra ni del máximo en DAG.** Las pruebas de navegador ejecutadas también pasaron.

La implementación mínima usa barrido lineal, con complejidad de núcleo `O(V² + E)`; no utiliza una cola de prioridad. Los pasos guardan copias del estado para explicar la ejecución. El objetivo máximo no resuelve caminos máximos en grafos generales con ciclos ni enumera todas las rutas empatadas.

Con los límites aceptados, una ruta óptima representativa no necesita superar 23 aristas y el total máximo comprobado es 22999977. El rango de los resultados no está limitado a 999999: ese límite pertenece a cada peso individual.

## 7. Lógica difusa

### 7.1. Qué tiene implementado

Es un sistema **Mamdani tipo 1 configurable**, no solamente el ejemplo inicial de ayuda.

- De una a tres entradas y una salida independiente.
- Editor de variables, unidades, dominios y conjuntos triangulares/trapezoidales.
- Borrador separado del modelo aplicado; aplicar o cancelar cambios.
- Reglas editables con AND/OR, peso, activación y condiciones «No importa».
- Generación de combinaciones con consecuentes pendientes de elección.
- Validación de referencias, dimensiones, cobertura de curvas y advertencias de reglas.
- Evaluación con pertenencias, activaciones, recortes, agregación y centroide.
- Resultado con gráficas SVG y consulta auxiliar de 1001 puntos.
- Mapa bajo petición: curva de 101 puntos o rejilla 15 × 15, con cancelación y tercera entrada fija cuando corresponde.
- Autoguardado v2, migración v1, trabajos con nombre, exportación/importación y JSON separado para comparación numérica.

### 7.2. Valores aceptados

Fuentes: `js/difusa/modelo.js:4`, `:13`, `:36`, `:106`; `js/difusa/estado.js:71`.

| Dato | Valores o límites actuales |
|---|---|
| Entradas | Entre 1 y 3. |
| Salidas | Una. |
| Conjuntos por variable | Entre 2 y 5, también en la salida. |
| Reglas | Entre 1 y 125. |
| Dominio de cada variable | Mínimo y máximo finitos entre −1000000 y 1000000, con mínimo estrictamente menor que máximo. |
| Parámetros de conjuntos | Números finitos dentro del dominio, en orden no decreciente; mismos límites absolutos de 1000000. |
| Triangular | Tres parámetros `[a,b,c]`; `a ≤ b ≤ c` y `a < c`. |
| Trapezoidal | Cuatro parámetros `[a,b,c,d]`; `a ≤ b ≤ c ≤ d` y `a < d`. |
| Hombros | Se permiten parámetros repetidos en extremos o mesetas. No se permite soporte totalmente colapsado. |
| Valor de evaluación | Número finito dentro del dominio de su entrada, extremos incluidos. Acepta decimales y negativos si el dominio los incluye. |
| Peso de regla | Número finito entre 0 y 1. |
| Conector | Exactamente `AND` u `OR`. |
| Regla habilitada | Booleano `true` o `false`. |
| Antecedente | ID de conjunto de su entrada, o `null` para «No importa». Debe utilizarse al menos una entrada. |
| Consecuente | ID de conjunto de salida. Puede quedar `null` como borrador; una regla habilitada pendiente impide evaluar. |
| Nombres de sistema, variables y conjuntos | De 1 a 40 caracteres tras quitar espacios exteriores. |
| Unidad | Texto opcional de hasta 40 caracteres. |
| Descripción | Texto opcional de hasta 4000 caracteres. |
| IDs | De 1 a 64 caracteres; letra inicial y después letras ASCII, números, guion o guion bajo. Excluye `constructor`, `prototype` y `__proto__`. |
| Importación de archivo | Hasta 1000000 bytes; el lector de texto también limita a 1000000 caracteres. |
| Biblioteca difusa | Hasta 50 trabajos, con nombres de 1 a 40 caracteres. |

Los IDs de variables deben ser únicos entre entradas y salida. Los IDs y nombres de conjuntos deben ser únicos dentro de cada variable. Los IDs de reglas también deben ser únicos. No se admiten referencias a entradas o conjuntos inexistentes.

**No existe una anchura mínima de dominio ni un límite de decimales.** Se utiliza precisión doble de JavaScript. Esto permite configurar rangos muy pequeños y explica por qué los controles deben manejar los casos H-01 y H-02.

### 7.3. Formato numérico

El lector configurable admite punto o coma decimal, signo y notación científica. Por ejemplo: `3.5`, `3,5`, `.5`, `-2.75` y `1e-3`, siempre que el valor resultante pertenezca al dominio del campo.

Rechaza campos vacíos, `Infinity`, `NaN`, booleanos, texto parcial como `3.5resto`, formatos mixtos como `1,2.3` y separadores de miles. Un texto `1,000` se interpreta como **uno decimal**, no como mil.

El rango no se corrige silenciosamente recortando el valor: un dato fuera del dominio queda inválido. En JSON, los parámetros y valores deben ser números; la coma decimal corresponde al lector de los campos de texto.

### 7.4. Ejemplos disponibles actualmente

| Ejemplo | Entradas y dominios | Salida | Reglas |
|---|---|---|---|
| Ayuda | Familiaridad y dificultad, ambas 0–10. | Detalle recomendado, 0–100. | 9. |
| Propina | Servicio y comida, ambas 0–10. | Porcentaje, 0–30. | 9. |
| Ventilación de una entrada | Temperatura, 0–40 °C. | Velocidad, 0–100 %. | 3. |
| Ventilación de tres entradas | Temperatura 0–40 °C, humedad 0–100 %, ocupación 0–20 personas. | Nivel de ventilación, 0–100 %. | 27. |

También existe **Crear mi sistema**, con una entrada, una salida y una regla cuyo consecuente está pendiente. No puede evaluarse hasta completar la decisión. Los cuatro ejemplos están implementados en `js/difusa/modelo.js:257` y expuestos en `logica-difusa.html`.

### 7.5. Cómo calcula y qué significan sus resultados

1. Calcula pertenencias triangulares o trapezoidales.
2. Aplica AND mediante mínimo u OR mediante máximo; excluye las condiciones «No importa».
3. Multiplica el resultado del antecedente por el peso de la regla; una regla deshabilitada aporta cero.
4. Recorta el consecuente con mínimo.
5. Agrega los consecuentes con máximo.
6. Integra la envolvente lineal por tramos y obtiene el centroide como primer momento dividido por área.
7. Añade etiquetas según la pertenencia del centroide, conservando los empates.

El cálculo actual **no obtiene el centroide sumando las 1001 muestras**. Esos puntos sirven para consultar la salida; la integral incluye nudos, recortes e intersecciones. Se verificó el triángulo estrecho `[0.01,0.02,0.03]`: devuelve centroide **0.02** y área **0.01**, aunque las consultas uniformes sean todas cero.

El resultado diferencia ausencia de activación, activación sin masa y fallo numérico. También puede existir un centroide válido sin etiqueta lingüística. No son estados equivalentes ni deben reemplazarse por un cero inventado.

### 7.6. Persistencia y seguridad de cambios

- Autoguardado: `logica-difusa.v2`; el formato v1 se migra conservando el original.
- Biblioteca propia: `logica-difusa.trabajos.v2`.
- JSON de trabajo: `tipo: "ciudad-logica-difusa-trabajo"`, `version: 2`, modelo, valores y vista.
- El JSON de comparación numérica tiene otra finalidad y no restaura un trabajo.
- Importaciones inválidas conservan el ejercicio vigente.
- No persiste muestras, recortes ni mapas; el resultado se vuelve a evaluar cuando corresponde.
- Cambios matemáticos invalidan el resultado; renombres y cambios descriptivos conservan su validez.
- Si se cambia un dominio y una entrada queda fuera de él, se marca pendiente en lugar de limitarla silenciosamente.

Reglas duplicadas, pesos cero, reglas deshabilitadas y zonas sin cobertura pueden generar advertencias sin invalidar necesariamente el sistema. Tener curvas sin huecos no demuestra que las reglas produzcan salida para todas las combinaciones.

## 8. Hallazgos actuales

Las prioridades siguientes son sugerencias de corrección, no cambios realizados.

| ID | Ubicación | Hallazgo | Prioridad sugerida | Evidencia |
|---|---|---|---|---|
| H-01 | `js/difusa/app.js:74` | El redondeo del deslizador elimina precisión de entradas válidas; Home/End pueden no alcanzar el extremo y las flechas pueden no avanzar. | Media | Controlador original ejecutado con DOM simulado y estado real; valores detallados debajo. |
| H-02 | `js/difusa/app.js:70` | Un dominio subnormal válido produce paso cero y propagación de `NaN` al campo. | Baja, por tratarse de un extremo numérico. | Modelo validado y controlador original ejecutado con DOM simulado. |
| H-03 | `js/difusa/app.js:5`, `js/difusa/dibujo.js:4` | El formato de etiquetas puede mostrar límites distintos como si fueran iguales. | Baja | Reproducción de las funciones de formato sobre valores aceptados. |
| H-04 | `tests/logica-difusa-navegador.js:213` | Referencias anteriores del centroide provocan un fallo de la suite de navegador vigente. | Media | Comando real termina con código 1 y comparación analítica independiente. |
| H-05 | `package.json:13` | La verificación habitual no incluye toda la lógica difusa ni su prueba del editor. | Media | Inspección de los comandos de `package.json`. |

### H-01. El deslizador altera precisión que el modelo y el campo de texto aceptan

El controlador calcula un paso igual al ancho del dominio dividido por 1000 y después aplica `toPrecision(14)`. Ese redondeo cambia el valor almacenado; no se limita a formatear una etiqueta.

**Caso A: extremos que no se alcanzan exactamente.**

Configurar una entrada con:

```text
min = 999999.123456786
max = 999999.123476894
```

El modelo pasa la validación. Al ejecutar los manejadores originales del control:

| Acción | Valor esperado | Valor obtenido |
|---|---|---|
| Home | 999999.123456786 | 999999.12345679 |
| End | 999999.123476894 | 999999.12347689 |

**Caso B: la flecha no avanza.** Con dominio `[999999, 999999.000001]`, el paso calculado es aproximadamente `1.00000761449337e-9`. Desde el mínimo, el valor anterior al redondeo es `999999.000000001`, representable en JavaScript. `toPrecision(14)` lo convierte nuevamente en `999999`; el manejador de ArrowRight guarda el mismo valor inicial.

**Impacto:** se impide elegir determinados valores desde el deslizador o el teclado, aunque el campo de texto y el modelo sí los admitan. La inferencia recibe el valor redondeado.

**Corrección propuesta:** preservar exactamente los extremos en Home/End y evitar un redondeo fijo de cifras significativas al actualizar el estado. Ajustar el paso a valores representables del dominio y redondear únicamente la presentación. Estos casos merecen pruebas del controlador y una comprobación posterior en navegador real.

### H-02. Un dominio aceptado puede producir un paso igual a cero

El validador permite el dominio `[0, Number.MIN_VALUE]`, es decir, `[0, 5e-324]`. Se construyó un sistema válido con conjuntos de soporte no colapsado y se comprobó que `DifusaModelo.validar(...).valido` es `true`.

La operación del control produce:

```js
const min = 0, max = Number.MIN_VALUE;
const paso = (max - min) / 1000; // 0 por subdesbordamiento
const home = min + Math.round((min - min) / paso) * paso; // NaN
```

Al ejecutar el manejador original, el campo termina con el texto `NaN`, aparece un error de formato y el deslizador queda deshabilitado. El estado conserva el último valor válido, 0: el fallo no lo sustituye por un número inválido.

**Impacto:** el propio control convierte una acción de navegación en una entrada inválida. No poder representar 1000 posiciones dentro de ese dominio es una limitación numérica; propagar `NaN` hasta la interfaz es evitable.

**Corrección propuesta:** comprobar que el paso sea positivo y útil antes de dividir, ofrecer extremos cuando no existan posiciones intermedias representables o rechazar explícitamente ese dominio con una explicación. No se verificó la normalización nativa del `range` para este caso en Edge.

### H-03. Etiquetas que ocultan diferencias válidas del dominio

Con dominio `[999999.123456786, 999999.123456894]`, ambos extremos son distintos y están dentro de los límites permitidos. Sin embargo:

- El formato habitual de la interfaz, con cinco decimales, muestra ambos como `999.999,12346`.
- El formato de las gráficas, con nueve cifras significativas, muestra ambos como `999.999,123`.

**Impacto:** el rango o sus marcas pueden parecer constantes. El motor conserva los números originales; el problema está en la información que se presenta al usuario.

**Corrección propuesta:** adaptar la precisión al ancho del dominio, y permitir consultar el valor completo cuando las etiquetas compactas coincidan. El límite no debe presentarse como pérdida de precisión del centroide.

### H-04. La prueba completa de navegador utiliza un resultado esperado obsoleto

Comando ejecutado:

```powershell
node tests/logica-difusa-navegador.js
```

Salida relevante:

```text
AssertionError: Referencia original 2/8:
84.44444444444444 / 84.47038269550748
```

La suite termina con código 1. `tests/logica-difusa-navegador.js:213` espera `84.47038269550748` para familiaridad 2 y dificultad 8. En ese caso se activa plenamente el consecuente Detallada, trapezoide `[60,80,100,100]`.

Su área es 30 y su primer momento es `2533.3333333333335`; el centroide continuo es `760/9 = 84.44444444444444`. **El resultado actual del motor es correcto para la integral continua.** La referencia de la prueba corresponde al comportamiento numérico anterior.

También aparecen referencias obsoletas en el caso 8/2, que espera `15.52961730449252` en lugar del centroide continuo `15.555555555555555`, y en la migración de `tests/logica-difusa-navegador.js:412`. El JSON vigente `matlab/referencias_logica_difusa.json` ya contiene los valores continuos.

**Impacto:** la suite se detiene antes de completar su revisión de interacción, importación, trabajos, vistas y migración. No se pueden dar por verificadas esas partes por el mero hecho de que existan en el archivo de pruebas.

**Corrección propuesta:** actualizar las expectativas mediante referencias analíticas independientes y revisar las restantes suposiciones discretas de esa suite. Después ejecutarla completa. No cambiar el motor para ajustarlo al resultado antiguo.

### H-05. Los comandos habituales dejan pruebas del módulo fuera

`npm test` ejecuta la comprobación estática y varias suites, incluida `tests/grafos.test.js`, pero **no ejecuta las suites funcionales de lógica difusa**.

Existe `npm run test:difusa`, que ejecuta cuatro suites y pasa sus 56 pruebas. Sin embargo, ese comando tampoco incluye `tests/logica-difusa-editor.test.js`, que tiene cinco pruebas adicionales y también pasó al ejecutarse por separado. Las pruebas de navegador son comandos independientes.

**Impacto:** un `npm test` satisfactorio no constituye una revisión completa de los tres módulos pendientes. Una regresión de lógica difusa o de su editor puede quedar fuera del comando habitual.

**Corrección propuesta:** integrar la cobertura funcional del módulo y su editor en un comando de verificación explícito. Mantener las pruebas de navegador identificadas por separado y corregir H-04 antes de usarlas como criterio de cierre.

## 9. Pruebas ejecutadas y resultado real

| Comando o comprobación | Resultado |
|---|---|
| `node tests/verificar.js` | **111 correctas, 0 fallidas**; sintaxis, referencias y estructura. Es una comprobación estática, no certifica los resultados matemáticos. |
| `node tests/grafos.test.js` | **27 correctas, 0 fallidas**. |
| `node tests/dijkstra-ejemplos.test.js` | **6 correctas, 0 fallidas**. |
| `npm.cmd run test:difusa` | **56 correctas, 0 fallidas**: núcleo 14, modelo 19, estado 16, mapa 7. |
| `node tests/logica-difusa-editor.test.js` | **5 correctas, 0 fallidas**. |
| `node tests/ejemplos-modulos.test.js` | **5 correctas, 0 fallidas**. Se usó la suite existente para contrastar ejemplos; sus comprobaciones ajenas al alcance no constituyen una nueva auditoría de módulos aprobados. |
| `node tests/usabilidad-grafos-navegador.js` | **936 comprobaciones correctas**, sin errores de consola/página. Dijkstra y Kruskal a 320, 390, 768 y 1440 px, en ambos temas, sus cuatro etapas y casos de encuadre. |
| `node tests/dijkstra-catalogo-navegador.js` | **62 comprobaciones correctas**, sin errores de consola/página. |
| `node tests/fase2-difusa-navegador.js` | **22 comprobaciones correctas**, escenarios a 1280 y 360 px, ratón y emulación táctil; sin errores JavaScript/HTTP locales en esos escenarios. |
| `node tests/logica-difusa-navegador.js` | **Falla**, código 1, por H-04. El resto de la suite no se completó. |
| Máximo DAG contra enumeración independiente | **48 grafos, 1112 pares y 522 rutas alcanzables coincidentes**. |
| Cadena de 24 nodos con pesos máximos | Resultado **22999977** en Dijkstra mínimo, máximo DAG y Kruskal mínimo/máximo. |
| Controladores numéricos y formato de lógica difusa | Reproducidos H-01, H-02 y la colisión de etiquetas H-03. |
| Comparación SHA-256 de archivos objetivo | Los **14 archivos** coinciden con sus copias de `public/` y Drop. |

No se ejecutó `npm test` completo para repetir pruebas de los módulos que ya tienen visto bueno. Se seleccionaron las suites relacionadas con el alcance, además de la comprobación estática compartida.

## 10. Orden de trabajo propuesto

1. **Actualizar la prueba de navegador difusa, H-04.** Permite completar la verificación y descubrir posibles problemas posteriores que hoy quedan ocultos por la interrupción temprana.
2. **Corregir la actualización numérica del deslizador, H-01 y H-02.** Preservar valores y extremos válidos, comprobar pasos representables y evitar `NaN`.
3. **Ajustar las etiquetas a la precisión del dominio, H-03.** Evitar que rangos distintos se presenten como constantes.
4. **Integrar los comandos de pruebas, H-05.** Hacer visible qué se verifica con cada comando e incluir el editor difuso.
5. **Cerrar la validación externa pendiente.** Si se requiere comparación con MATLAB, ejecutar los scripts con la herramienta y versión disponibles y registrar los resultados reales.

Para Kruskal y Dijkstra, esta revisión no justifica modificar sus motores. Deben conservarse sus objetivos mínimo/máximo, el comportamiento de bosques y la condición DAG documentada para máximos.

## 11. Límites de este informe

- Es una fotografía del código local del 17 de noviembre de 2026. No verifica un despliegue remoto.
- No se ejecutó MATLAB ni se obtuvo una comparación externa nueva. Los scripts existen y esa validación sigue pendiente.
- No se comprobaron otros motores de navegador, teléfonos físicos, teclado virtual o proyector.
- Pasar pruebas finitas no demuestra ausencia de todos los errores posibles.
- La suite completa de navegador difusa quedó interrumpida; las 22 comprobaciones de su suite dirigida cubren otros escenarios concretos y no sustituyen todo ese recorrido.
- Los ejemplos difusos usan reglas didácticas; la validez de la inferencia no valida por sí sola la idoneidad de esas reglas para un problema real.
- Esta entrega crea únicamente el presente análisis. Los hallazgos quedan documentados y pendientes de implementación.
