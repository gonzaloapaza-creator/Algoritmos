# Análisis de Dijkstra, Kruskal, lógica difusa e inicio

Fecha: 15 de noviembre de 2026. Proyecto: Ciudad de los Algoritmos.

## 1. Alcance y requisitos que deben conservarse

Este informe revisa funcionamiento observable, presentación visual, claridad didáctica, navegación y facilidad de uso. Incluye lectura del código, ejecución de pruebas existentes y comprobaciones en Microsoft Edge sin interfaz, con un contexto de navegador aislado. No se modificaron los algoritmos ni la interfaz de la aplicación.

**Requisito obligatorio: Dijkstra y Kruskal deben conservar sus opciones de Mínimo y Máximo.** Las recomendaciones buscan hacer más claras y cómodas ambas opciones. El modo máximo no se considera un error ni se propone retirarlo.

En Dijkstra se conserva el comportamiento actual de máximos para grafos dirigidos acíclicos. La interfaz debe ayudar a preparar un grafo compatible y explicar cualquier condición incumplida. En Kruskal se conservan el árbol o bosque de expansión de peso mínimo y máximo.

Interpreto «hasta tres» en lógica difusa como **hasta tres variables de entrada, además de una salida**. El proyecto ya permite de una a tres entradas; la mejora necesaria es hacer esa capacidad visible, enseñar a usarla y facilitar la edición de sus reglas. Cada variable admite de dos a cinco conjuntos; entradas, conjuntos y reglas son conceptos distintos.

### Cómo leer los hallazgos

- **Error confirmado:** comportamiento reproducido o contradicción directamente verificable en el código.
- **Fricción confirmada:** comportamiento válido que dificulta entender o utilizar la aplicación.
- **Propuesta:** mejora de diseño; no implica que la función actual esté rota.
- **P1:** resolver primero por su efecto en comprensión o interacción.
- **P2:** mejora importante de claridad y organización.
- **P3:** refinamiento o ampliación posterior.

No se atribuye a los algoritmos un fallo numérico que las comprobaciones realizadas no hayan demostrado. Tampoco se considera un defecto que Kruskal entregue un bosque cuando la entrada contiene componentes separadas.

## 2. Diagnóstico general

La base matemática revisada está respaldada por pruebas y ya ofrece ejemplos, procedimiento, persistencia y estados especiales. El principal margen de mejora está en **mostrar qué está pasando, qué configuración está vigente y qué debe hacer la persona después**.

Los problemas más relevantes encontrados son:

| ID | Área | Hallazgo | Tipo | Prioridad |
|---|---|---|---|---|
| G-01 | Dijkstra | Un nodo inalcanzable aparece como «Valor definitivo» en el procedimiento de máximos. | Error confirmado de presentación | P1 |
| G-02 | Ambos grafos | Cambiar la configuración desde Resultado deja una guía genérica que envía a la etapa 2, aunque los controles de cálculo siguen delante. | Error confirmado de orientación | P2 |
| G-03 | Ambos grafos | Dos nodos pueden tener el mismo nombre y quedar indistinguibles en selectores y explicaciones. | Fricción confirmada | P2 |
| G-04 | Dijkstra | La cuadrícula de configuración crea una cuarta columna implícita y deja la explicación en una columna muy estrecha. | Error confirmado de distribución | P1 |
| G-05 | Ambos grafos | Calcular salta de la configuración al resultado y marca el procedimiento como completado sin haberlo visitado. | Fricción confirmada del recorrido | P2 |
| F-01 | Lógica difusa | Cambiar una condición de una regla con teclado deja el foco en el cuerpo de la página. | Error confirmado de interacción | P1 |
| F-02 | Lógica difusa | Una entrada nueva vacía permite intentar evaluar; el error posterior no se asocia visualmente con su campo ni lo enfoca. | Error confirmado de validación en interfaz | P1 |
| F-03 | Lógica difusa | Una entrada añadida no influye en las reglas existentes hasta utilizarla en un antecedente. La interfaz no explica suficientemente este paso. | Fricción confirmada | P1 |
| F-04 | Lógica difusa | Durante el borrador de una tercera entrada, el resumen sigue contando dos entradas aplicadas sin distinguir claramente ambos estados. | Fricción confirmada | P2 |
| I-01 | Inicio | La descripción de Dijkstra no anuncia ambos objetivos y la nota de difusa sigue presentando nueve reglas como característica general. | Desajuste editorial confirmado | P2 |
| T-01 | Verificación | Una suite visual conserva expectativas del recorrido anterior y falla también por el tamaño de las etiquetas. | Inconsistencia confirmada entre prueba e interfaz | P2 |

La recomendación principal es **corregir primero estas incoherencias y después simplificar la distribución**, conservando las funciones que ya existen.

## 3. Evidencia y comprobaciones realizadas

### 3.1 Pruebas existentes

| Comando o escenario | Resultado observado |
|---|---|
| `node tests/grafos.test.js` | 27 pruebas correctas, 0 fallidas. Incluye ambos objetivos, ceros, empates, desconexión, validación y comparación con referencias independientes. |
| `npm.cmd run test:difusa` | 56 pruebas correctas: 14 de núcleo, 19 de modelo, 16 de estado y 7 de mapa. |
| `node tests/logica-difusa-editor.test.js` | 5 pruebas correctas de generación y validación transaccional. |
| `node tests/fase2-difusa-navegador.js` | 22 comprobaciones correctas: escritorio oscuro y móvil claro con interacción táctil emulada. |
| `tests/fase2-grafos-navegador.js`, escenario `dijkstra-movil`, con `GRAFOS_BREVE=1` | 7 comprobaciones correctas, sin errores de página. |
| La misma suite, escenario `kruskal-movil` | 7 comprobaciones correctas, sin errores de página. |
| `node tests/fase2-inicio-navegador.js` | En la primera ejecución hubo un tiempo de espera al abrir la biblioteca desde recientes; una segunda ejecución pasó sus 9 comprobaciones. Se registra como inestabilidad por investigar, no como enlace roto confirmado. |
| `node tests/usabilidad-grafos-navegador.js --caso=dijkstra-390-claro` | Falló tras 26 comprobaciones aprobadas en «etiquetas y objetivos del grafo legibles». No hubo errores de consola/página. Véase T-01. |

Estas son comprobaciones dirigidas al alcance de este informe; no constituyen una ejecución completa de todas las suites del repositorio.

### 3.2 Recorridos adicionales

Se inspeccionaron inicio, resultados y procedimiento de ambos grafos, edición de variables difusas, reglas, evaluación con tres entradas y mapa. Se obtuvieron capturas temporales a 1440 y 390 píxeles de ancho, sin usar los datos guardados del navegador personal.

| Vista observada a 390 px | Ancho del documento | Alto aproximado del documento |
|---|---:|---:|
| Inicio, vista ciudad | 390 px | 5663 px |
| Dijkstra, procedimiento del ejemplo | 390 px | 2708 px |
| Kruskal, procedimiento del ejemplo | 390 px | 2444 px |
| Difusa, variables tras agregar una tercera entrada | 390 px | 3764 px |
| Difusa, evaluación de tres entradas | 390 px | 2076 px |
| Difusa, resultado de tres entradas | 390 px | 5287 px |

No se observó desbordamiento horizontal global en esas vistas. **Una página larga no es por sí misma un error**, pero estas medidas y la inspección visual muestran la oportunidad de reducir bloques repetidos y acercar las acciones a la tarea actual. Son medidas de los casos revisados, no límites universales de la aplicación.

La prueba adicional de mapa con tres entradas produjo una rejilla de 15 × 15, 225 salidas válidas y un valor fijo visible para la tercera entrada. Al elegir como eje horizontal la entrada que estaba en el vertical, la interfaz reasignó el otro eje para mantenerlos distintos. Ambas capacidades ya funcionan.

## 4. Dijkstra: análisis y mejoras

### 4.1 Lo que conviene conservar

- Mínimo y máximo como opciones explícitas del mismo módulo.
- Selección de origen y consulta de destinos sin repetir el cálculo.
- Presentación de la ruta con suma de los pesos originales.
- Tratamiento de los nodos sin camino y los empates.
- Conservación del resultado al mover o renombrar un nodo.
- Ejemplos con ceros, empates y grupos separados.
- Resultado estático con acceso voluntario al procedimiento, evitando reproducción automática.

La solución visual debe organizar estas capacidades, sin reducirlas.

### 4.2 G-01 — Un nodo sin camino aparece como definitivo en máximos

**Evidencia:** [algoritmos.js](js/grafos/algoritmos.js), líneas 115–117, y [app.js](js/grafos/app.js), línea 292.

El recorrido topológico incorpora cada nodo al conjunto de procesados, incluso cuando no es alcanzable desde el origen. La tabla interpreta primero esa pertenencia como «✓ Valor definitivo» y solo después comprueba el estado «Sin camino».

**Reproducción:** crear A → B de peso 2 y un nodo C aislado; elegir A como origen y Máximo; calcular y consultar el último paso.

| Nodo | Valor mostrado | Estado actual |
|---|---:|---|
| A | 0 | ✓ Valor definitivo |
| B | 2 | ✓ Valor definitivo |
| C | −∞ | ✓ Valor definitivo |

La explicación del mismo paso sí indica que los valores −∞ no son alcanzables. Hay, por tanto, una contradicción entre tabla y explicación. El resultado numérico de C no se calculó mal: el problema es su clasificación visual.

**Mejora:** separar «procesado» de «alcanzable». En el paso final, un valor no finito debe presentarse como «Sin camino desde A». Durante el recorrido puede decir «Procesado, sin camino desde el origen», evitando una marca de éxito ambigua.

**Aceptación:** C figura como sin camino en tabla, tarjetas y consulta; A y B conservan 0 y 2. Ambos objetivos siguen disponibles.

### 4.3 G-04 — La configuración ocupa espacio de forma innecesaria

**Evidencia:** [app.js](js/grafos/app.js), línea 68, y [grafos.css](css/grafos.css), líneas 240–243.

La cuadrícula declara tres columnas, pero tiene cuatro parejas de etiqueta y selector. Las reglas de colocación crean una cuarta columna implícita. El párrafo explicativo queda en una sola columna, debajo de los selectores.

En una medición a 1440 px, el contenedor tenía unos 707 px de ancho y el párrafo solo 126 px de ancho y 124 px de alto. Esto forma una columna estrecha de texto y desplaza el lienzo hacia abajo. En el selector de destino también se observó el texto «Todos los destinos» recortado por el ancho disponible.

**Mejora concreta:** envolver cada etiqueta y selector en su propio grupo de campo; usar dos columnas o cuatro columnas según el espacio real, sin columnas implícitas. La ayuda breve debe ocupar toda la fila. La información ampliada puede permanecer en «Cómo funciona».

**Aceptación:** etiquetas alineadas con sus campos, opciones reconocibles, ayuda a ancho completo y ausencia de desplazamiento horizontal a 320, 360, 390, 768 y 1440 px.

### 4.4 Dar prioridad a la consulta elegida

Actualmente el resultado ya incluye rutas, métricas y tarjetas de destinos. La mejora es de jerarquía: con muchos vértices, todas las tarjetas compiten por atención.

**Propuesta P1/P2:** si hay destino elegido, mostrar primero una respuesta compacta:

```text
Objetivo: Máximo     Origen: A     Consultar destino: D

A → C → D
Peso total: 6
1 + 5 = 6

[Ver ruta en el grafo]  [Paso a paso]  [Otros destinos]
```

Sin destino, mantener el resumen general y una lista compacta de valores. Para hasta 24 nodos, una tabla de filas breves puede resultar más cómoda que 24 tarjetas grandes. «Todos los destinos» debe significar claramente consulta general, no un cambio del problema.

Los nodos sin camino necesitan el texto «Sin camino», además de ∞ o −∞. La acción puede explicar la falta de ruta; no debe aparentar que existe una secuencia de conexiones.

### 4.5 Hacer cómodos mínimo y máximo

**Propuesta P2:** presentar un selector visible «Mínimo / Máximo» y repetir el objetivo activo en el título del resultado y en la explicación del paso. Evitar que el modo elegido quede reconocible únicamente dentro de un desplegable.

Cuando el usuario elija Máximo, mostrar la condición en palabras sencillas: «Necesitas un grafo con dirección y sin ciclos». Si el grafo no la cumple, indicar qué corregir antes de intentar calcular o dar un diagnóstico local al hacerlo. Es mejor ofrecer «Cargar ejemplo compatible» y «Revisar conexiones» que obligar a interpretar un mensaje técnico aislado.

No convertir, borrar conexiones ni modificar el grafo automáticamente para cumplir esa condición. Cualquier transformación debe ser explícita y conservar las posibilidades de deshacer.

### 4.6 Procedimiento más fácil de seguir

El procedimiento ya tiene explicación, progreso, tabla y reproducción opcional. Puede mejorar con:

- Una tarjeta de operación actual: «Valor conocido + peso = candidato», seguida de «Mejora / Se conserva».
- En mínimos, hacer visible qué nodo se elige y por qué; en máximos, mostrar el orden de procesamiento y el nodo actual.
- Identificar el mismo nodo o conexión en texto, lienzo y tabla.
- Resaltar los valores que cambiaron sin depender exclusivamente del color.
- Mantener «Anterior», «Siguiente» y «Pausar» cerca del grafo también en móvil.
- Ocultar o plegar las herramientas de creación mientras se consulta el resultado; ofrecer «Editar grafo» como entrada clara a la edición.

La vista actual conserva herramientas de edición y configuración encima del grafo incluso durante la consulta. Ese espacio es más útil para mostrar origen, destino, objetivo y estado vigente.

## 5. Kruskal: análisis y mejoras

### 5.1 Lo que ya funciona y debe permanecer

El núcleo ordena las conexiones según el objetivo, utiliza conjuntos disjuntos, acepta conexiones entre componentes distintas y rechaza las que producirían ciclos. Admite pesos negativos y cero. Los empates conservan el orden original.

La interfaz ya distingue árbol y bosque, muestra el total, las conexiones elegidas, las componentes, los aislados y la relación `aristas elegidas = V − C`. También explica que otras elecciones pueden tener el mismo peso total. No se propone implementar de nuevo esas funciones, sino darles mayor claridad visual.

El ejemplo de clase tiene peso mínimo **6** y máximo **12**. Ambas respuestas están verificadas en las pruebas existentes.

### 5.2 Hacer visible la decisión de cada paso

**Fricción:** los grupos antes y después se describen mediante texto como `{A, B} · {C} · {D}`. Es adecuado con pocos nodos, pero se vuelve difícil de comparar en grafos más grandes.

**Propuesta P1/P2:** presentar el paso en tres bloques:

```text
Conexión actual: B — C       Peso: 2

Antes:   [A, B]   [C]   [D]
Decisión: Aceptada; une dos grupos distintos.
Después: [A, B, C]      [D]

Peso acumulado: 3       Conexiones elegidas: 2
```

Al descartar una conexión, explicar: «Sus extremos ya están en el mismo grupo; añadirla formaría un ciclo». Como mejora avanzada, se puede destacar el camino ya existente que cerraría ese ciclo.

Utilizar etiquetas de grupo, texto e iconos. El color puede ayudar a seguir una unión, pero no debe ser la única forma de identificar componentes.

### 5.3 Mejorar la tabla de conexiones

La tabla ordenada es didácticamente útil y debe conservarse. Con hasta 96 conexiones, conviene:

- Mantener la fila actual a la vista dentro del contenedor.
- Mostrar «Conexión 7 de 18» y el sentido del orden: menor a mayor o mayor a menor.
- Dar más énfasis a la conexión actual que a las pendientes.
- Permitir consultar aceptadas, descartadas y todas, sin alterar el cálculo.
- Conservar un acceso a la secuencia original del procedimiento.

El motor revisa todas las conexiones incluso después de completar el árbol. Esto permite explicar las descartadas y **no es un error**. Se puede añadir «La red ya está construida; los pasos restantes revisan conexiones que formarían ciclos» y ofrecer «Ir al resultado».

### 5.4 Resultado más claro por componente

**Propuesta P2:** colocar primero el objetivo y la respuesta; después el detalle:

```text
Bosque de expansión máximo
Peso total: …        Componentes: 2

Grupo 1: A, B, C    Conexiones elegidas: …    Subtotal: …
Grupo 2: D, E       Conexiones elegidas: …    Subtotal: …

[Ver conexiones]  [Revisar decisiones]
```

Los subtotales por componente serían una ampliación: actualmente hay un total general y una descripción de las componentes. Ayudarían a comprender un bosque sin leer toda la lista de aristas.

Un nodo aislado debe verse como una componente de un solo vértice, con cero conexiones y subtotal cero. No debe presentarse como un cálculo fallido.

### 5.5 Mínimo y máximo con la misma jerarquía

**Propuesta P2:** situar «Mínimo / Máximo» antes del botón de cálculo y repetirlo en la tarjeta principal. Explicar el objetivo mediante ejemplos de peso total, sin mezclarlo con una ruta desde un origen.

Una comparación voluntaria «Mínimo: 6 / Máximo: 12» con alternancia de grafos sería una mejora P3. Requeriría gestionar dos resultados vigentes; no debe simularse reutilizando una solución con otra etiqueta.

## 6. Mejoras comunes para Dijkstra y Kruskal

### 6.1 G-02 — Mensaje de recalcular demasiado genérico

**Evidencia:** [app.js](js/grafos/app.js), funciones `cambiarConsultaModuloGrafo` y `actualizarModuloGrafo`, especialmente línea 439.

Cambiar origen u objetivo invalida correctamente el resultado. Sin embargo, el mensaje posterior vuelve a «Cuando estén listos, continúa a la etapa 2», aunque la persona puede estar en Resultado y tener los controles de cálculo visibles en el mismo panel del grafo.

**Mejora P2:** mostrar «Cambiaste el objetivo. Calcula de nuevo para ver el resultado» y una acción principal de recalcular. Distinguir tres estados: edición inicial, resultado vigente y resultado pendiente de recalcular. Cambiar solo el destino debe seguir siendo una consulta sin recalcular.

### 6.2 G-03 — Nombres de nodos ambiguos

**Evidencia:** [modelo.js](js/grafos/modelo.js), líneas 130–137. Los IDs son únicos; los nombres no tienen esa restricción. Se comprobó que un grafo con nombres `A, A, C, D, E` es aceptado.

Los algoritmos siguen distinguiendo los IDs, pero textos como «A → A», opciones iguales de origen/destino o el grupo `{A, A}` resultan ambiguos.

**Mejora P2:** prevenir duplicados al crear o renombrar, o distinguirlos con un identificador breve y estable. Elegir una política uniforme para lienzo, selectores, tablas y exportaciones.

Los archivos antiguos con duplicados requieren una solución compatible: mostrar identificadores y permitir renombrar. No conviene convertir de repente un archivo válido en irrecuperable ni cambiar nombres sin avisar.

### 6.3 G-05 — El indicador de etapas no coincide con el recorrido real

**Evidencia:** [app.js](js/grafos/app.js), líneas 210 y 418. Calcular abre Resultado y el indicador marca como completas todas las etapas anteriores, incluido el procedimiento todavía no consultado.

**Propuesta P2:** organizar tres etapas de trabajo y dos vistas de consulta:

```text
1. Crear grafo → 2. Configurar → 3. Explorar solución
                                  [Resultado] [Paso a paso]
```

La alternativa de menor alcance es mantener las cuatro vistas actuales y aclarar «Paso a paso, opcional», sin confundir una vista disponible con una actividad ya realizada.

### 6.4 Herramientas y acciones con grupos claros

Separar los modos persistentes de las acciones puntuales:

| Grupo | Controles propuestos |
|---|---|
| Editar | Seleccionar/mover nodo, crear punto, conectar extremos |
| Mover la vista | Desplazar lienzo, acercar, alejar, ver todo |
| Acciones | Organizar grafo, editar selección, importar/exportar |
| Consultar | Objetivo, origen/destino cuando corresponda, recalcular |

«Mover nodos» y «Mover lienzo» expresan mejor la diferencia que dos acciones que solo hablan de mover. La herramienta activa necesita texto, estado accesible y una salida clara con Escape o Cancelar conexión. Parte de esto ya existe; la mejora es su agrupación y su presencia según la vista.

### 6.5 Legibilidad de etiquetas y mantenimiento de pruebas

**T-01:** en el ejemplo de Dijkstra a 390 px se midieron nombres de nodo de aproximadamente **13 px**, pesos de 14 px y diámetros mínimos de unos 44 px. La suite visual exige al menos 13,9 px para todos los textos y por eso falla.

La misma suite todavía espera que Calcular abra el procedimiento, aunque el controlador actual abre Resultado. Esta segunda diferencia está verificada en el código, aunque la ejecución se detuvo antes de llegar a esa aserción.

**Recomendación P2:** acordar el recorrido y el tamaño de texto deseados, corregir la interfaz donde corresponda y actualizar las pruebas para ese contrato. Como objetivo de diseño, procurar etiquetas de 14–16 px visibles; no reducir automáticamente todos los textos para hacer caber un grafo denso. La elección debe combinar zoom, encuadre y consulta textual.

Estas medidas de texto son un objetivo de legibilidad del producto, no una afirmación de que WCAG imponga un mínimo tipográfico de 14 px.

### 6.6 Precisión de la explicación de complejidad

**Evidencia:** [algoritmos.js](js/grafos/algoritmos.js), línea 92, y [app.js](js/grafos/app.js), línea 95.

El recorrido topológico vuelve a ordenar la lista de disponibles y utiliza `shift()`. La explicación de interfaz anuncia `O(V + E)` sin contabilizar ese manejo de la lista. Tampoco debe confundirse el coste del núcleo con el de copiar y presentar el historial.

**Mejora P3:** usar una cola con índice de lectura si se desea el recorrido lineal, o documentar la estructura elegida y su coste real. Si es indispensable escoger siempre el disponible de menor índice, evaluar una estructura adecuada y mantener el desempate determinista. Con 24 nodos, la prioridad es la precisión educativa, no una urgencia de rendimiento.

## 7. Lógica difusa: análisis y mejoras hasta tres entradas

### 7.1 Capacidad actual y base que debe conservarse

El módulo ya permite:

- De una a tres entradas y una salida.
- De dos a cinco conjuntos triangulares o trapezoidales por variable.
- Hasta 125 reglas, con AND/OR, peso y «No importa».
- Edición mediante borrador, aplicación explícita y cancelación.
- Validación de dominios, referencias y parámetros.
- Avisos de reglas duplicadas, antecedentes con consecuentes distintos y huecos de pertenencia.
- Centroide continuo por integración de la envolvente lineal.
- Mapa de una entrada como curva y de dos ejes como rejilla; con tres entradas se fija la restante.
- Guardado de trabajos, importación validada y protección de datos incompatibles.

La mejora visual no debe sustituir la integración continua por un promedio aproximado ni perder los estados de ausencia de activación, activación sin masa o resultado sin etiqueta. Las pruebas del consecuente estrecho que produce 0,02 están pasando.

### 7.2 F-01 — Pérdida de foco al editar reglas

**Evidencia:** [editor.js](js/difusa/editor.js), función `renderReglas`, especialmente líneas 179–185.

Cambiar un antecedente reconstruye la lista completa de reglas. El selector enfocado se elimina del documento. En la comprobación con teclado, antes del cambio el foco estaba en `ant-r1-familiaridad`; después de pulsar Flecha abajo, `document.activeElement` pasó a ser `BODY`.

**Impacto:** se interrumpe la edición con teclado y se pierde la referencia del control actual. Con muchas reglas, recuperar la posición puede ser costoso.

**Mejora P1:** actualizar únicamente los controles y textos afectados o restaurar el foco al mismo control mediante su identificador estable. Conservar también el desplazamiento de la lista. Las acciones de duplicar o borrar deben llevar el foco a la nueva regla o a una regla vecina de forma predecible.

**Aceptación:** modificar antecedente, conector, consecuente o estado de una regla no envía el foco al cuerpo de la página. Tab continúa desde un lugar coherente. La misma condición debe comprobarse con 27 y 125 reglas.

### 7.3 F-02 — Entrada nueva pendiente sin error local al evaluar

**Evidencia:** [app.js](js/difusa/app.js), líneas 24–29 y función `evaluar`; [estado.js](js/difusa/estado.js), función `aplicarModelo`.

**Reproducción:** partir del sistema de ayuda, añadir una entrada, aplicar la configuración e ir a Evaluar sin escribir su valor.

Se observó:

1. La nueva entrada tiene valor pendiente (`null`), conservando correctamente la necesidad de que el usuario elija un número.
2. El resumen avisa de un valor pendiente, pero el botón Evaluar está habilitado.
3. Al pulsarlo, el motor rechaza la evaluación y aparece «Introduce un número finito para Entrada 1 entre 0 y 10» en el estado general.
4. El campo no recibe el error local, no obtiene `aria-invalid` y el foco permanece en el encabezado de Evaluar.

La validación matemática impide un resultado inválido. El error está en la experiencia de corrección.

**Mejora P1:** incluir los valores pendientes en la preparación del formulario o permitir el intento y señalar el campo al enviar. En ambos casos, explicar qué falta. Al detectar el error, mostrarlo junto a la entrada, enlazarlo mediante `aria-describedby` y enfocar el primer campo incorrecto. No asignar silenciosamente cero o un valor central.

**Aceptación:** el usuario identifica y corrige el valor pendiente sin volver a buscarlo. El número escrito se conserva y nunca se publica un resultado viejo como vigente.

### 7.4 F-03 — Añadir la tercera entrada no significa que ya influya

**Evidencia:** [editor.js](js/difusa/editor.js), líneas 236–241.

Al añadir una entrada, las reglas existentes reciben `null` para su antecedente: «No importa». Esto preserva el significado anterior de las reglas. Se comprobó que las nueve reglas del ejemplo mantienen ese estado para la entrada nueva.

Es un comportamiento válido, pero una persona puede añadir una variable, mover su valor y concluir que el módulo falla porque la respuesta no cambia.

**Mejora P1:** mostrar inmediatamente:

> Entrada añadida. Las reglas actuales la ignoran hasta que la utilices en sus condiciones.

Agregar «Configurar sus reglas» y un indicador por variable: «Participa en 0 de 9 reglas habilitadas». Si una variable solo aparece en reglas con peso cero o deshabilitadas, el indicador debe aclararlo.

No prometer que una variable producirá siempre un cambio visible por aparecer en una regla: puede no activarse en el caso actual o quedar dominada por la agregación. Conviene diferenciar **participación en el modelo** y **efecto en esta evaluación**.

### 7.5 F-04 — Distinguir configuración aplicada y borrador

Durante la adición de la tercera entrada, el selector ya contiene tres entradas y una salida, y Añadir entrada queda correctamente deshabilitado. Sin embargo, el resumen superior sigue mostrando «2 entradas», porque consulta el modelo aplicado.

La separación transaccional es correcta. La presentación debe explicarla:

```text
Aplicado: 2 entradas        Borrador: 3 entradas
Cambios sin aplicar
[Aplicar configuración] [Cancelar cambios]
```

**Mejora P2:** mantener una barra de borrador visible cerca de la edición, con resumen del cambio y sin reconstruir innecesariamente sus botones. Al cancelar, explicar si hace falta volver a evaluar, ya que la edición matemática invalida el resultado anterior desde que se empieza a editar.

### 7.6 Hacer visible «Entradas 1/3, 2/3, 3/3»

Actualmente el límite se encuentra en la ficha desplegable y el botón se deshabilita al llegar a tres. Falta una presentación más directa.

**Propuesta P1/P2:** mostrar tarjetas o una lista corta de variables, separadas de la salida:

```text
ENTRADAS 3/3
[Temperatura · °C] [Humedad · %] [Ocupación · personas]
Máximo de entradas alcanzado

SALIDA
[Potencia de ventilación · %]
```

Al añadir una entrada, seleccionar su tarjeta y enfocar su nombre. Conservar el dominio inicial como propuesta editable, sin aparentar que ya está calibrado para el tema elegido. Ofrecer después «Definir conjuntos» y «Usar en reglas».

En móvil, una lista vertical breve o un selector agrupado puede funcionar mejor que tres pestañas apretadas. La salida necesita una separación clara para evitar que parezca una cuarta entrada.

### 7.7 Un ejemplo que utilice realmente tres entradas

Los ejemplos disponibles son de una o dos entradas. **Propuesta P2:** agregar uno completo de tres entradas, por ejemplo temperatura, humedad y ocupación → potencia de ventilación.

Debe incluir unidades, dominios, conjuntos y decisiones explicadas. Para enseñarlo, presentar dos casos que mantengan temperatura y humedad y cambien ocupación, mostrando qué reglas y qué salida se modifican. No es suficiente agregar un tercer control si todas las reglas lo dejan como «No importa».

El ejemplo sería didáctico, igual que los actuales. No se deben presentar sus parámetros como un diseño de control calibrado.

### 7.8 Menos densidad al editar conjuntos

En la vista actual, el gráfico y todos los campos de los conjuntos ocupan una página extensa. En móvil, la vista previa pasa encima del editor y puede quedar lejos del parámetro que se modifica.

**Propuesta P2:**

- Tarjetas compactas de conjuntos, con nombre y forma resumida; expandir el conjunto elegido.
- Resaltar en el gráfico el conjunto que se está editando.
- Mantener `a, b, c, d`, acompañados de nombres comprensibles como inicio, pico, comienzo/fin de meseta y fin.
- Mostrar «Conjuntos 3/5» y explicar el mínimo de dos cuando no sea posible eliminar más.
- Mantener una vista previa cercana: lateral en escritorio y acceso «Ver curva» junto a los campos en móvil.
- Si los parámetros son inválidos, rotular la gráfica «Última vista válida» de manera visible. El texto actual ya avisa que conserva la vista anterior, pero puede perderse al desplazarse.

La edición visual arrastrando puntos sería una ampliación P3. Debe convivir con los campos numéricos, usar las mismas validaciones y no modificar curvas o dominios silenciosamente.

### 7.9 Reglas comprensibles con tres entradas

Tres entradas con tres conjuntos producen 27 combinaciones completas; con cinco conjuntos, 125. **No es obligatorio escribir todas:** «No importa» permite representar varias combinaciones mediante una sola regla.

La interfaz ya detecta duplicados exactos y algunos antecedentes iguales con consecuentes diferentes. La mejora es presentar esos avisos cerca de las reglas afectadas, con acceso directo, en lugar de acumular mensajes largos arriba.

**Propuesta P1/P2:**

1. Antes de generar, mostrar la cantidad concreta: «3 × 3 × 3 = 27 combinaciones». Avisar que reemplaza las reglas actuales y deja consecuentes pendientes, como ya hace la confirmación existente.
2. Mostrar contadores: completas, pendientes, deshabilitadas y con avisos.
3. Ofrecer filtros por entrada/conjunto, pendientes y avisos; mantener IDs y orden del modelo al filtrar.
4. En resultados, mostrar primero las reglas activas con su activación y conservar «Ver todas». Si se ordenan por influencia, mostrar el número original de cada regla.
5. Para tres entradas, ofrecer una tabla opcional: dos entradas forman filas y columnas, y la tercera selecciona una capa. Conservar la lista editable como alternativa.

No describir automáticamente dos consecuentes distintos como un error matemático: el modelo permite que esa decisión sea deliberada. El aviso debe invitar a revisarla.

Tampoco equiparar una tabla de combinaciones completa con cobertura numérica del dominio. Curvas con huecos, pesos cero y reglas deshabilitadas cambian la activación. La interfaz ya hace parte de esta distinción y debe conservarla.

### 7.10 Resultado y explicación progresiva

El resultado numérico ya aparece al principio. El problema posterior es la cantidad de desarrollo abierto: tres gráficas de entrada, tabla de pertenencias, todas las reglas, agregación, centroide y recursos adicionales. Con tres entradas y nueve reglas se midió una sección de resultado de unos 4000 px en escritorio; en móvil el documento completo superó 5200 px.

**Propuesta P2:** conservar la tarjeta numérica inicial y añadirle valores de entrada, unidad de salida y un resumen «Se activaron N de M reglas». Debajo, presentar bloques expandibles:

```text
Resultado: … %
Temperatura: … °C | Humedad: … % | Ocupación: … personas
Reglas activas: N de M

[Ver reglas activas] [Explorar mapa] [Cálculo completo]

▸ Entradas y pertenencias
▸ Activación de reglas
▸ Recortes y agregación
▸ Centroide
```

El acceso «Cálculo completo» debe permitir abrir todo para una clase o revisión. Los estados sin salida necesitan el mismo lugar principal que un resultado válido, acompañados de una explicación y acceso a las reglas relevantes.

### 7.11 Mejorar el mapa que ya soporta tres entradas

La base funcional ya existe. El siguiente paso es hacer evidente que se está viendo un **corte del sistema**, con dos entradas variables y la tercera fija.

**Propuesta P2:**

- Título completo: «Potencia según temperatura y humedad, con ocupación = 8 personas».
- Selector de los dos ejes y control de la entrada fija con unidad y rango.
- Diferenciar el valor usado en el mapa del valor de la evaluación actual; ofrecer «Usar valor evaluado».
- Acercar «Explorar mapa» a la tarjeta del resultado, conservando el cálculo bajo petición y su cancelación.
- Mantener las cruces para puntos sin salida y una leyenda que los distinga de salida cero.
- Ofrecer una consulta textual del punto seleccionado y, como mejora P3, varios cortes para valores distintos de la tercera entrada.

Hay una fricción adicional comprobable en el código: el campo fijo se rellena al reconstruir los controles del mapa; escribir después un valor en Evaluar no lo sincroniza automáticamente. La generación usa el campo fijo de forma independiente. Esto puede ser una elección válida, pero conviene explicarlo y facilitar «Usar valor evaluado», especialmente tras agregar una entrada nueva que empieza pendiente.

No hace falta introducir una escena 3D para resolver esta necesidad. Un mapa de calor bien rotulado con un control de corte suele ser más sencillo de consultar, también con teclado.

## 8. Recomendación para ordenar el inicio

### 8.1 Qué ocurre ahora

El inicio presenta una introducción, la ciudad como vista predeterminada, el acceso alternativo «Vista lista», trabajos recientes, fundamentos, recursos y equipo. La ciudad tiene ocho zonas y un panel con información del módulo seleccionado. Existe una preferencia persistida de vista y un control de movimiento.

La identidad visual de ciudad merece conservarse. La oportunidad está en permitir dos intenciones con la misma claridad: **explorar** y **abrir un módulo conocido**.

### 8.2 Orden recomendado

| Posición | Contenido | Propósito |
|---:|---|---|
| 1 | Cabecera actual, con accesos breves | Navegar sin ocupar una segunda portada. |
| 2 | Introducción compacta y «Elegir un módulo» | Explicar la aplicación y llevar a una tarea concreta. |
| 3 | Hasta tres trabajos recientes, solo si existen | Facilitar el regreso de quien ya trabajó. |
| 4 | Selector principal «Elige qué quieres resolver», con Lista / Ciudad | Dar acceso a los ocho módulos. |
| 5 | Guía breve de uso | Enseñar cómo empezar sin obligar a leer teoría. |
| 6 | Fundamentos y recursos | Acompañar el aprendizaje después de la elección. |
| 7 | Proyecto y equipo | Conservar la presentación institucional al final. |

Para una primera visita, recomiendo probar **Lista como vista inicial**, con Ciudad claramente disponible. Para visitas posteriores, respetar la última elección guardada. No cambiar la preferencia de quienes ya escogieron ciudad.

Esto es una propuesta de usabilidad que puede validarse comparando cuánto tarda una persona nueva en abrir el módulo que necesita; no una necesidad de eliminar o relegar la identidad de la aplicación.

### 8.3 Categorías y orden de módulos

Las categorías actuales incluyen varias con un solo módulo. Para facilitar la exploración, propongo:

| Categoría | Orden | Frase de orientación |
|---|---|---|
| Grafos y rutas | Dijkstra → Kruskal → Johnson | Consulta caminos, conecta una red o estudia rutas entre todos los pares. |
| Optimización y distribución | Asignación → Esquina noroeste | Reparte tareas o distribuye cantidades entre orígenes y destinos. |
| Estructuras y ordenamiento | Ordenamiento → Árboles | Ordena datos y explora sus estructuras. |
| Decisiones y lógica | Lógica difusa | Combina categorías graduales y reglas para obtener una salida. |

El orden dentro de grafos parte de una consulta desde un origen, continúa con conexión de redes y termina con todos los pares. Son problemas distintos; no debe presentarse como una secuencia obligatoria de prerrequisitos.

En cada tarjeta, mantener el nombre, una frase de propósito, entrada, resultado y acción «Abrir [módulo]». **Dijkstra y Kruskal deben anunciar Mínimo y Máximo con igual claridad.** Difusa debe indicar «1–3 entradas · reglas configurables».

### 8.4 I-01 — Corregir textos desactualizados

Se encontraron tres desajustes concretos:

- [catalogo.js](js/comun/catalogo.js), línea 101: la descripción de Dijkstra no comunica los dos objetivos que ofrece el módulo. Actualizarla, por ejemplo: «Consulta caminos de peso mínimo o máximo desde un origen. El modo máximo requiere un grafo dirigido sin ciclos».
- [inicio.js](js/comun/inicio.js), línea 159: la nota de difusa dice «Mamdani tipo 1 con nueve reglas». Las nueve pertenecen al ejemplo de ayuda; el módulo permite reglas configurables. Sustituir por «De una a tres entradas, una salida y reglas configurables».
- [index.html](index.html), línea 162: el recorrido enumera grafos, asignación, transporte, ordenamiento y árboles, pero omite lógica difusa. Incluir decisiones y lógica o usar las nuevas categorías.

La tabla de complejidad de fundamentos contiene tres algoritmos. Puede mantenerse como «Ejemplos de complejidad» o ampliarse de manera documentada. No conviene aparentar una comparación completa de los ocho módulos si su alcance es parcial.

### 8.5 Recientes: el texto debe coincidir con el destino

Los accesos actuales muestran trabajos concretos, pero abren la biblioteca del módulo mediante `?intro=no&trabajos=1`; no cargan automáticamente ese ejercicio. Este comportamiento preserva la decisión de cargar y ya está explicado en la ayuda.

**Propuesta P2:** hacer visible «Abrir biblioteca» junto al nombre del trabajo. Si se desea «Continuar este trabajo», implementar primero una selección o identificación inequívoca del trabajo y conservar la confirmación de reemplazo que corresponda.

Cuando no haya registros, usar un mensaje breve dentro del selector o después del catálogo. No reservar una gran sección vacía por encima de los módulos.

### 8.6 Mantener la ciudad y mejorar el acceso

- Conservar las ocho zonas, demostraciones, pausa y respeto al movimiento reducido.
- Mostrar el nombre del módulo y su acción con claridad al seleccionar una zona.
- Mantener la equivalencia entre destinos de ciudad, lista y menú.
- Evitar duplicar una lista completa y la ciudad completa una debajo de otra: el conmutador ya proporciona una base útil.
- En móvil, revisar conjuntamente el acceso fijo al módulo y el acceso a Algo para que no consuman demasiado alto de pantalla.

## 9. Criterios visuales y de amabilidad comunes

### 9.1 Dar una tarea principal a cada pantalla

Crear, configurar, consultar y explicar requieren distintas prioridades. Mostrar todas las herramientas siempre obliga a decidir entre demasiadas acciones.

En edición, priorizar añadir y conectar. En configuración, priorizar objetivo y datos pendientes. En resultado, priorizar la respuesta y su consulta. En procedimiento, priorizar la operación actual y los controles de avance. Mantener las funciones secundarias accesibles mediante grupos o menús claros.

### 9.2 Reducir la ocupación fija de la pantalla

**Fricción observada:** el acceso cerrado de Algo utiliza una franja fija opaca de 70 px a todo el ancho, definida en [asistente.css](css/asistente.css), línea 9. En una pantalla de 844 px representa aproximadamente el 8 % del alto, además de la barra superior. En el inicio móvil se combina con el acceso al módulo seleccionado.

**Propuesta P2:** evaluar un acceso compacto a Algo que conserve tamaño cómodo y nombre accesible, evitando una franja completa cuando el panel está cerrado. Si se conserva la franja, tratarla como espacio reservado y comprobar que no oculta el elemento enfocado, leyendas o controles durante el desplazamiento.

La inspección muestra ocupación visual real; no se afirma que todos los controles cubiertos pierdan el clic, ya que la franja usa reglas específicas de eventos del puntero.

### 9.3 Estados y mensajes concretos

Preferir mensajes vinculados con una acción:

| Situación | Texto sugerido |
|---|---|
| Cambió el objetivo | «Cambiaste a Máximo. Calcula de nuevo». |
| Nodo sin ruta | «No hay camino desde A hasta C». |
| Conexión rechazada en Kruskal | «A y D ya están conectados; esta conexión formaría un ciclo». |
| Entrada nueva sin condiciones | «Esta entrada todavía no participa en ninguna regla habilitada». |
| Borrador pendiente | «Tienes cambios sin aplicar». |
| Falta un número | «Escribe un valor entre 0 y 10 para Ocupación». |

Reducir las notificaciones transitorias repetidas por acciones esperables. Los errores y estados necesarios para continuar deben permanecer cerca de la tarea; no depender únicamente de un aviso que desaparece.

### 9.4 Accesibilidad como parte de la implementación

Los controles ya tienen una base útil de etiquetas, estados y alternativas de edición. Las mejoras deben mantenerla y verificar especialmente el foco después de actualizar el DOM. El orden de navegación debe conservar el significado y la operación de la pantalla. Referencia: [W3C, orden del foco](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).

Aceptar, descartar, seleccionar y distinguir curvas debe apoyarse también en texto, formas o patrones. El proyecto ya utiliza algunos trazos e iconos; extender esa práctica a los nuevos grupos y estados. Referencia: [W3C, uso del color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

Un error detectado necesita identificar el dato afectado y describir el problema. Aplicarlo especialmente al caso de la nueva entrada vacía de difusa. Referencia: [W3C, identificación de errores](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html).

Como objetivo de comodidad, conservar controles principales cercanos a 44 × 44 px. No confundirlo con el mínimo AA de WCAG 2.2: el criterio 2.5.8 establece 24 × 24 px con excepciones y reglas de separación. Referencia: [W3C, tamaño mínimo del objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Estas referencias orientan las propuestas; esta revisión no constituye una certificación completa de accesibilidad.

## 10. Orden recomendado de implementación

| Fase | Trabajo | Resultado esperado |
|---|---|---|
| 1 — Corregir incoherencias | G-01, G-04, F-01 y F-02. | Tabla correcta, configuración legible y edición/corrección con foco estable. |
| 2 — Aclarar estados | G-02, G-03, G-05, F-03, F-04 e I-01. | Se entiende qué está vigente, qué falta y qué hacen ambos objetivos o la tercera entrada. |
| 3 — Simplificar pantallas | Agrupar herramientas, priorizar destino y componentes, compactar variables/reglas, acercar mapa. | Menos desplazamiento y mejor relación entre explicación y gráfico. |
| 4 — Reordenar inicio | Hero breve, recientes condicionales, selector principal, categorías y recursos secundarios. | Elegir o retomar un módulo con menos búsqueda. |
| 5 — Ampliaciones | Ejemplo de tres entradas, tabla de reglas por capas, comparación de objetivos y cortes del mapa. | Más valor didáctico sin sobrecargar el recorrido básico. |

T-01 debe resolverse junto con el acuerdo del recorrido y la legibilidad de las fases 1–3. Las pruebas deben expresar la experiencia elegida y detectar regresiones, sin perpetuar expectativas abandonadas.

## 11. Criterios de aceptación para una futura mejora

### Dijkstra y Kruskal

- [ ] Mínimo y Máximo permanecen disponibles y visibles en ambos módulos.
- [ ] El ejemplo de Kruskal mantiene mínimo 6 y máximo 12.
- [ ] El grafo A → B de peso 2 con C aislado muestra C sin camino en el procedimiento de máximos.
- [ ] Cambiar origen u objetivo invalida y explica la necesidad de recalcular.
- [ ] Cambiar solo destino permite consultar otra ruta sin borrar el cálculo.
- [ ] Mover o renombrar no cambia pesos ni resultados matemáticos.
- [ ] No hay nombres indistinguibles en las consultas, incluidos archivos antiguos.
- [ ] Grafo, explicación y controles de paso pueden consultarse sin búsquedas largas en móvil.
- [ ] Kruskal conserva árboles, bosques, aislados, empates, ceros y pesos negativos.
- [ ] Las pruebas de navegación reflejan el recorrido definitivo y no marcan como visitado lo que solo está disponible.

### Lógica difusa

- [ ] Se entiende el límite de tres entradas sin abrir la ayuda.
- [ ] Puede recorrerse 1 → 2 → 3 entradas y eliminar una con las reglas de confirmación y referencias actuales.
- [ ] No es posible agregar una cuarta entrada.
- [ ] Añadir una entrada informa de su participación inicial en las reglas.
- [ ] La entrada nueva pendiente se corrige desde su campo, con error asociado y foco adecuado.
- [ ] Editar reglas con teclado conserva foco y posición, también con 27 y 125 reglas.
- [ ] Un ejemplo completo demuestra que las tres entradas pueden intervenir en la inferencia.
- [ ] Aplicado y borrador se distinguen; cancelar o aplicar tiene consecuencias claras.
- [ ] Los filtros de reglas conservan el modelo y los identificadores originales.
- [ ] El mapa permite elegir dos ejes y fijar la tercera entrada, mostrando nombre, valor y unidad.
- [ ] Cambiar ejes, modelo o valor fijo invalida el mapa previo y mantiene cancelación y estados sin salida.
- [ ] Se conserva el centroide continuo, incluido el caso estrecho de 0,02 y los diagnósticos actuales.

### Inicio y presentación común

- [ ] Ciudad y lista permiten abrir los mismos ocho módulos.
- [ ] La última vista elegida se respeta.
- [ ] Las tarjetas de Dijkstra y Kruskal comunican los dos objetivos.
- [ ] La descripción de difusa representa su configuración actual de una a tres entradas.
- [ ] Recientes anuncia si abre una biblioteca o un trabajo concreto.
- [ ] Las vistas principales se revisan a 320, 360, 390, 768 y 1440 px y con ampliación de texto.
- [ ] Se verifica teclado, foco visible, temas claro/oscuro y movimiento reducido.
- [ ] Barras fijas, Algo, notificaciones y acceso móvil no impiden consultar el contenido o el control enfocado.

## 12. Límites de este análisis

La inspección visual se realizó con Edge de escritorio y emulación móvil; faltan comprobaciones en teléfonos físicos, con teclado virtual y otros motores. No se midió contraste de todos los elementos ni rendimiento bajo todas las combinaciones máximas. Las propuestas sobre 125 reglas necesitan validación específica de interacción y tiempos antes de elegir paginación, renderizado parcial u otra técnica.

No se verificó equivalencia con MATLAB en esta revisión. Se preserva el alcance documentado de esa comparación. Las pruebas aprobadas aportan evidencia de los casos ejecutados; no demuestran ausencia absoluta de errores.

El entregable de esta revisión es este análisis. Las correcciones y diseños descritos quedan definidos para una implementación posterior, con sus prioridades y condiciones de aceptación.
