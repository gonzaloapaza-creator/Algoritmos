# Entrega: Lógica difusa · Mamdani configurable

Versión 2, 5 de noviembre de 2026. Se amplió la implementación existente conservando sus resultados de referencia. Se preservaron las modificaciones previas del proyecto. Sin commits, push ni publicación; sin cambios en los algoritmos de otros módulos.

## Abrir y utilizar

Desde la raíz, ejecutar `npm.cmd start` y abrir `http://127.0.0.1:8123/logica-difusa.html`, o entrar desde **Ciudad → Centro de decisiones → Lógica difusa**. Hay un solo módulo en catálogo, ciudad, lista y navegación.

La bienvenida reutiliza la introducción común y el video registrado en el catálogo. Tiene **Ir al módulo**, preferencia **No mostrar al entrar**, acceso **Video** para volver sin perder el ejercicio y enlace alternativo a YouTube. No solicita reproducción automática y elimina el iframe al salir. Se pudo consultar el título del video, pero no revisar su contenido completo; no se le atribuyen procedimientos concretos.

Las cinco vistas muestran únicamente el contenido activo y conservan datos y borradores al navegar:

1. **Inicio y ejemplos:** Ayuda, Propina, Ventilación o Crear mi sistema.
2. **Variables:** elegir entrada/salida, nombre, unidad, dominio y conjuntos; previsualización inmediata de las curvas válidas.
3. **Reglas:** antecedentes, No importa, AND/OR, consecuente, peso y habilitación.
4. **Evaluar:** valores de entrada separados de la configuración y deslizadores sincronizados.
5. **Procedimiento y resultado:** pertenencias, reglas, recortes, agregación, centroide y mapa bajo petición.

En el editor, **Aplicar configuración** sustituye el modelo únicamente si es estructuralmente válido; **Cancelar cambios** recupera la configuración aplicada. Una regla coherente con consecuente pendiente puede guardarse como borrador, pero debe completarse o desactivarse antes de evaluar. Los cambios matemáticos invalidan el resultado, sus resaltados y los mapas; renombrar conserva el cálculo y actualiza las etiquetas. Los campos inválidos no sustituyen números válidos por cero o NaN.

## Modelo configurable y límites

| Elemento | Alcance |
|---|---|
| Inferencia | Mamdani tipo 1 |
| Entradas | Entre 1 y 3, con IDs estables |
| Salida | Una variable configurable |
| Conjuntos por variable | Entre 2 y 5, IDs estables y nombres únicos dentro de cada variable |
| Funciones | Triangular [a, b, c] o trapezoidal [a, b, c, d] |
| Reglas | Entre 1 y 125, IDs estables |
| Antecedentes | Uno por entrada o No importa; al menos una entrada utilizada |
| Consecuente | Un conjunto de salida; puede quedar pendiente como borrador |
| Conector | AND u OR por regla, sin anidamiento |
| Peso | Entre 0 y 1 |
| Nombres | 1–40 caracteres tras quitar espacios exteriores; variables con nombres únicos |
| Unidad | Opcional, hasta 40 caracteres |
| Números del modelo | Finitos, entre −1000000 y 1000000 |
| Dominio | Mínimo estrictamente menor que máximo |
| Triangular | a ≤ b ≤ c y a < c |
| Trapezoidal | a ≤ b ≤ c ≤ d y a < d |
| Trabajos locales | Hasta 50, con nombre de 1–40 caracteres |
| JSON importado | Máximo 1 MB; validación completa antes de reemplazar |

Los parámetros permanecen dentro del dominio y deben tener soporte útil. Los hombros con parámetros repetidos se calculan sin divisiones por cero. El lector numérico admite punto o coma decimal y notación científica completa; rechaza vacíos, números no finitos, texto parcial y separadores de miles o mezclados.

Si un cambio de dominio deja curvas fuera, se muestran errores junto a los parámetros. **Reajustar curvas al rango** solicita confirmación y escala explícitamente desde el dominio de referencia; repetir la acción no vuelve a escalar las curvas ya ajustadas. **Distribuir conjuntos automáticamente** propone una partición editable con hombros extremos y triángulos interiores, conservando IDs/nombres. Cancelar recupera el modelo aplicado. Los valores de evaluación que queden fuera de un dominio nuevo se marcan pendientes, sin limitarse silenciosamente.

Al borrar una variable o un conjunto utilizado, el diálogo identifica las reglas afectadas y permite cancelar o eliminarlas explícitamente. No se reasignan sus referencias. Si el borrador queda sin reglas, es necesario añadir una antes de aplicar. Duplicar crea una regla con consecuente pendiente. **Generar combinaciones** confirma antes de reemplazar reglas y deja todos los consecuentes pendientes: no inventa decisiones del dominio.

Los duplicados exactos son errores. Antecedentes iguales con diferentes consecuentes son avisos para revisión, porque pueden ser deliberados. También se señalan reglas deshabilitadas o de peso cero.

## Operadores y método numérico

- AND: mínimo de los antecedentes utilizados.
- OR: máximo de los antecedentes utilizados.
- No importa: excluye esa entrada de ambos conectores.
- Peso: multiplica el grado del antecedente, después de aplicar el conector.
- Regla deshabilitada: activación final cero.
- Implicación: mínimo entre activación final y pertenencia del consecuente.
- Agregación: máximo de los consecuentes recortados en cada coordenada de salida.
- Defuzzificación desde FASE 2: centroide continuo por integración analítica de la envolvente lineal. Las 1001 muestras uniformes se conservan únicamente para consultar puntos con el deslizador.

```text
numerador   = ∫ y × pertenenciaAgregada(y) dy
denominador = ∫ pertenenciaAgregada(y) dy
resultado   = numerador / denominador
```

Se construyen los segmentos de cada consecuente recortado, sus nudos y las intersecciones de los máximos; cada tramo de la envolvente se integra con fórmulas de área y primer momento de una recta. Se acumula con compensación de suma y una referencia centrada en el soporte activo. No se redondea internamente ni se sustituye la integral por un promedio no ponderado. La aritmética es de precisión doble; puede diferir ligeramente de los antiguos resultados discretos. El helper heredado `centroide(puntos, grados)` conserva sus sumas discretas para compatibilidad, pero ningún evaluador del producto lo usa para el resultado.

Los estados son `sin-reglas-activas` si ninguna activación final es positiva; `activacion-sin-masa` si hay activación sin soporte de salida útil en el dominio; y `fallo-numerico` si una masa/momento no puede representarse o el centroide no es finito o sale del dominio. En los tres casos se devuelve `null` con explicación propia. Los modelos admitidos exigen soporte útil: la activación sin masa es además una defensa del integrador, y el subdesbordamiento se identifica como fallo numérico, no como ausencia de reglas.

Regresión de referencia: salida [0,100], triángulo [0.01,0.02,0.03], activación 1 → área 0.01, primer momento 0.0002 y centroide **0.02**, aunque las 1001 consultas uniformes sean cero. Gráfica y recortes usan los segmentos exactos; el mapa evalúa cada punto con la misma integral y conserva su diagnóstico.

La etiqueta adicional evalúa los conjuntos configurados en el centroide, elige la mayor pertenencia y conserva empates numéricos. Si todos los grados son cero, se mantiene el número y se explica que ningún conjunto contiene ese centroide. No se inventa una etiqueta. Pertenencia no significa probabilidad.

## Cobertura, procedimiento y mapa

La cobertura de cada variable se analiza exactamente por tramos usando los puntos de quiebre de las funciones. Detecta intervalos sin pertenencia y huecos puntuales. La cobertura de curvas y la cobertura de reglas se presentan como problemas diferentes: disponer de pertenencias no demuestra que todas las combinaciones activen salida. Un sistema estructuralmente válido puede evaluarse aunque tenga huecos.

El registro conserva los siete pasos reales: datos, fuzzificación, activación, implicación, agregación, centroide e interpretación. Se muestran los grados de cada antecedente, la operación mínimo/máximo, el peso y la activación final. Al seleccionar una regla se dibuja su recorte. El control del punto de salida consulta una de las 1001 muestras y muestra su coordenada, pertenencia original, recorte seleccionado y máximo agregado; ya no asume y = 50. Tablas, leyendas y estados distinguen las reglas también mediante texto y trazo.

El mapa usa el mismo motor, bajo petición:

- Una entrada: curva entrada–salida de 101 puntos.
- Dos entradas: mapa de calor de 15 × 15 puntos.
- Tres entradas: dos ejes elegibles y valor fijo explícito de la restante.

Los lotes calculan dos puntos y ceden el hilo. **Cancelar** detiene los lotes; una edición matemática o firma caducada descarta el trabajo. No se publica un resultado parcial. Los mapas no se crean al abrir y no bloquean la evaluación normal. Se conservan solo resultados escalares del mapa, sin almacenar los registros de 1001 muestras de cada celda. Las zonas sin salida llevan una cruz; hay escala, ejes, unidades y descripción del valor fijo. Es una exploración por muestreo, no una demostración exhaustiva de cobertura de reglas.

## Ejemplos

Todos incluyen variables, unidades cuando corresponden, curvas, reglas, valores iniciales y finalidad. Son demostraciones didácticas con parámetros escogidos, no modelos calibrados ni recomendaciones de control real. Cargar otro ejemplo solicita confirmación si hay cambios. Crear mi sistema proporciona una plantilla editable con consecuente pendiente.

El ejemplo **Nivel de ayuda recomendado** mantiene el modelo original: familiaridad y dificultad de 0 a 10, con Baja trapezoidal [0, 0, 2.5, 5], Media triangular [2.5, 5, 7.5] y Alta trapezoidal [5, 7.5, 10, 10]. Salida Detalle recomendado de 0 a 100: Breve [0, 0, 20, 40], Intermedia [20, 50, 80] y Detallada [60, 80, 100, 100].

| Familiaridad | Dificultad | Detalle |
|---|---|---|
| Baja | Baja | Intermedia |
| Baja | Media | Detallada |
| Baja | Alta | Detallada |
| Media | Baja | Breve |
| Media | Media | Intermedia |
| Media | Alta | Detallada |
| Alta | Baja | Breve |
| Alta | Media | Breve |
| Alta | Alta | Intermedia |

Todas las reglas originales usan AND y peso 1. **Este ejemplo ofrece una recomendación didáctica basada en reglas configuradas. No mide ni califica el aprendizaje.** Los valores los introduce el usuario.

Referencias originales conservadas, con decimales de presentación:

| Familiaridad | Dificultad | Centroide | Etiqueta |
|---|---|---|---|
| 0 | 10 | 84.47038269550748 | Detallada |
| 10 | 0 | 15.52961730449252 | Breve |
| 5 | 5 | 49.99999999999999 | Intermedia |
| 3.5 | 6.5 | 66.66482365048095 | Intermedia |

**Propina sugerida** usa calidad de servicio y comida de 0 a 10 y salida de 0 a 30 %. Tiene nueve decisiones ilustrativas y valores iniciales 5/5, cuyo resultado es 15 %. **Velocidad de ventilación** usa temperatura de 0 a 40 °C, salida de 0 a 100 %, tres reglas y valor inicial 20 °C, cuyo resultado es 50 %. Las funciones y reglas completas se consultan y editan en sus vistas, y se exportan en el JSON del modelo.

## Estado, trabajos y formatos

El autoguardado `logica-difusa.v2` contiene modelo, valores y vista. La biblioteca propia `logica-difusa.trabajos.v2` conserva copias con nombre, con acciones de guardar, cargar, renombrar y eliminar. Se mantiene separada para no alterar los adaptadores de los demás módulos. Los fallos de almacenamiento permiten trabajar y conservar trabajos durante la sesión, mostrando que no han podido persistirse.

La migración lee `logica-difusa.v1`, recupera familiaridad/dificultad y las aplica al ejemplo original. Conserva intacto el texto anterior. Un autoguardado incompatible pausa escrituras automáticas; **Descargar original** permite respaldarlo y **Usar sistema actual** habilita explícitamente el nuevo guardado. Una biblioteca incompatible tampoco se sobrescribe automáticamente.

**JSON de trabajo:** `tipo: "ciudad-logica-difusa-trabajo"`, `version: 2`, nombre, modelo, valores y vista. Las dimensiones, nombres, dominios, parámetros, pesos y referencias se validan antes de sustituir datos. Una importación inválida conserva modelo, evaluación, selección, registro y almacenamiento. No utiliza eval ni ejecuta texto importado.

**JSON de comparación:** `tipo: "ciudad-logica-difusa-comparacion"`, `version: 2`, modelo, política `integracion.metodo: "continua-por-tramos-lineales"`, metadatos de 1001 puntos auxiliares, casos y resultados continuos sin redondear, tolerancia absoluta y `reglasNumericas`. Esa matriz usa índices de conjuntos, 0 para No importa, peso y conector 1/2, e incluye solo reglas habilitadas, completas y con peso positivo. Evita ambigüedades al normalizar IDs JSON en MATLAB. No restaura trabajos.

No se guardan los miles de puntos, los recortes ni los mapas. Los borradores de edición se conservan en memoria al navegar; antes de guardar/exportar se requiere aplicarlos o cancelarlos. Una regla estructuralmente coherente con consecuente pendiente sí puede formar parte de un trabajo aplicado. No hay compatibilidad general con archivos .fis.

## Algo y estructura

Algo incluye **14 entradas locales** sobre variables lingüísticas, dominios, unidades, funciones, hombros, AND/OR, pesos, fuzzificación, implicación, agregación, centroide, cobertura, mapas y controles. El adaptador transmite un resumen de hasta tres entradas y cinco conjuntos por variable, ocho reglas de muestra, valores actuales, selección, paso, resultado vigente y hasta cinco errores. La regla y el punto seleccionados se explican a partir del registro; las 1001 muestras y los recortes completos no se copian en cada consulta. No usa APIs.

Archivos principales: `js/difusa/motor.js` conserva el núcleo anterior y añade la evaluación genérica; `modelo.js` valida y genera ejemplos; `estado.js` administra persistencia/importación; `editor.js` gestiona borradores; `dibujo.js` genera SVG; `mapa.js` organiza lotes cancelables; `app.js` coordina vistas y controles. `logica-difusa.html` y `css/difusa.css` reutilizan la estructura y los temas comunes.

## FASE 2: correcciones y comprobaciones del 8 de noviembre de 2026

H-03 se atiende con el centroide continuo descrito arriba. H-08 se atiende validando variables y conjuntos antes de generar combinaciones, mostrando errores en los campos, abriendo Variables para corregir el primer error y conservando el sistema aplicado. La generación se calcula antes de mutar el borrador y captura excepciones; una revisión diferente tras el diálogo descarta la operación. Los consecuentes siguen pendientes de elección explícita.

Cambios propios de esta fase: `js/difusa/{motor,editor,dibujo,mapa,app}.js`, textos de `logica-difusa.html`, entradas difusa de `js/comun/conocimiento/algoritmos-datos.js` y ramas difusa de `js/comun/asistente-contexto.js`; política y comparación en este documento, sección difusa de `README.md`, `scripts/exportar-referencias-difusa.js` y archivos `matlab/`. El motor del asistente ya delegaba sus respuestas dinámicas al adaptador; no necesitó una implementación numérica aparte. La biblioteca propia también se abre con `?trabajos=1` sin cargar automáticamente un ejercicio.

Comprobaciones ejecutadas realmente, sin suites generales:

| Comando | Resultado |
| --- | --- |
| `node tests/logica-difusa.test.js` | 14 correctas, 0 fallidas |
| `node tests/logica-difusa-modelo.test.js` | 19 correctas, 0 fallidas |
| `node tests/logica-difusa-estado.test.js` | 16 correctas, 0 fallidas |
| `node tests/logica-difusa-mapa.test.js` | 7 correctas, 0 fallidas |
| `node tests/logica-difusa-editor.test.js` | 5 correctas, 0 fallidas |
| `node tests/fase2-difusa-navegador.js` | 22 comprobaciones correctas |
| `node scripts/exportar-referencias-difusa.js` | JSON v1 y v2 regenerados desde el motor continuo; no ejecuta MATLAB |

Las **61 pruebas automatizadas** cubren referencias geométricas independientes de áreas y primeros momentos, triángulo estrecho, hombros y saltos interiores, recorte parcial asimétrico, intersección de consecuentes, pesos 0/1, AND/OR, ausencia de activación, resultado sin etiqueta, fallo por subdesbordamiento, persistencia y validación transaccional del editor. La sintaxis de los 14 archivos JS modificados o añadidos en esta parte se comprobó mediante `vm.Script`; `git diff --check` de su alcance no encontró errores de espacios.

La prueba de navegador usa Edge headless con Puppeteer ya instalado, perfiles aislados y el servidor de fuentes en 127.0.0.1:8123. Se ejecutó en **1280 px oscuro con ratón** y **360 px claro con táctil emulado**. Comprueba entradas y acciones reales: generación inválida, error visible y foco del campo, Tab, cancelación con Escape, conservación del modelo, evaluación 0.02 mediante controles, segmentos SVG y descripción accesible de la envolvente, procedimiento, respuesta contextual de Algo, mapa con diagnósticos y controles sin desbordamiento global. No observó errores JS/HTTP locales. No creó capturas, videos ni galerías. Esto no acredita un teléfono físico ni otros motores de navegador.

Límites: precisión doble y diagnóstico explícito de subdesbordamientos o resultados no finitos; no aritmética simbólica ni precisión arbitraria. El deslizador sigue consultando 1001 coordenadas uniformes: puede no tocar un soporte estrecho, pero su gráfica, integral y resultado sí lo incluyen. El mapa muestrea entradas y no demuestra cobertura exhaustiva. **MATLAB no se ejecutó ni instaló**; su comparación y el funcionamiento de los scripts `.m` siguen pendientes. Los operadores y límites del modelo se conservan. No se analizaron ni modificaron modelos de Asignación ni se ejecutaron sus pruebas.

## Verificación de la entrega anterior (registro histórico)

- `npm.cmd run lint`: **143 comprobaciones correctas, 0 fallidas**; sintaxis, recursos, IDs, orden de carga y CSS.
- `npm.cmd run test:difusa`: **50 pruebas correctas, 0 fallidas**: 14 del núcleo original, 14 de modelo/inferencia configurable, 16 de estado/migración/trabajos y 6 del mapa.
- Referencias independientes: sumas aritméticas de hombros; perfil por tramos del ejemplo mixto; salida uniforme en dominio 10–30 con centroide 20; AND/OR/No importa/peso en modelos de una, dos y tres entradas. Se comparan operaciones y muestras, no solamente el rango del resultado.
- Cobertura exacta, huecos puntuales/estrechos, referencias rotas, duplicados, límites, ausencia de activación y centroide sin etiqueta. Conservación exacta de todas las referencias originales.
- Mapas: lotes, cancelación, descarte por firma, una/dos/tres entradas y extremos decimales asignados exactamente para no rebasar el dominio por coma flotante.
- `node tests/asistente-contexto.test.js`: **36/36**. `node tests/asistente-conocimiento.test.js`: **34/34**.
- `node tests/logica-difusa-navegador.js`: revisión funcional sobre el Drop, con Edge headless y perfiles aislados. Bienvenida y regreso, cinco vistas, edición/aplicar/cancelar, reglas CRUD/AND/OR/pesos, evaluación y referencias, selección/punto/recorte, trabajos y JSON, importación no destructiva, mapas y cancelación, migración y almacenamiento bloqueado. A **390 y 1440 px**, en ambos temas: controles completos, tablas con desplazamiento interno, foco de teclado y ausencia de desbordamiento horizontal global. Integración sin duplicación. Cero errores JS/HTTP/API del módulo.
- `node tests/verificar-paquete-asistente.js`: **99 archivos**, CRC y coincidencia de ZIP, Drop, public y fuentes; exclusión de secretos, pruebas y archivos privados.

No se ejecutaron suites completas ajenas al cambio, ni se generaron capturas, videos o galerías. La comprobación de disposición utiliza DOM y estilos calculados; no certifica teléfono físico, teclado virtual, proyector ni otros motores de navegador. El video externo se inspeccionó en su integración sin reproducirlo ni afirmar que esté disponible en todas las redes.

## MATLAB: comparación pendiente

**Comparación con MATLAB pendiente.** No se dispone de un ejecutable MATLAB ni de una licencia/toolbox verificable en este entorno. No se instaló MATLAB ni se anuncia una validación ejecutada.

`node scripts/exportar-referencias-difusa.js` regenera los JSON v1 original y v2 completo con la política continua actual. `matlab/validar_logica_difusa.m` llama a la comparación configurable del ejemplo original.

`matlab/validar_sistema_difuso.m` construye el modelo configurable desde el JSON de comparación v2: de una a tres entradas, funciones y dominios exportados, AND mínimo, OR máximo, pesos, implicación mínimo y agregación máximo. Su referencia continua usa `integral` adaptativa sobre intervalos separados por nudos y recortes, con funciones `trimf`/`trapmf`; es un método distinto de las fórmulas analíticas JS. La salida discreta de `evalfis` con 1001 puntos se presenta en otra columna y no se exige que coincida con la integral. El script aún no se ejecutó: ni su sintaxis ni una equivalencia MATLAB se certifican en esta fase.

Requiere **MATLAB R2018b o posterior y Fuzzy Logic Toolbox instalada y con licencia**. Con la raíz del proyecto como directorio actual:

```matlab
addpath('matlab');
validar_sistema_difuso('matlab/referencias_sistema_difuso.json');
```

Ese archivo incluye el modelo y nueve casos originales. Para otro sistema, descargar **JSON de comparación** desde Procedimiento/resultado y pasar su ruta, por ejemplo:

```matlab
validar_sistema_difuso('C:/ruta/logica-difusa-comparacion.json');
```

La tolerancia absoluta propuesta es `1e-8` para contrastar los centroides continuos; queda pendiente validarla al ejecutar MATLAB. No se interpreta como equivalencia con 1001 muestras. Ante discrepancias se revisan modelo, integrales, operadores y versión; no se amplía arbitrariamente.

Fuentes oficiales de sintaxis: [mamfis](https://www.mathworks.com/help/fuzzy/mamfis.html), [addInput](https://www.mathworks.com/help/fuzzy/mamfis.addinput.html), [addOutput](https://www.mathworks.com/help/fuzzy/mamfis.addoutput.html), [addMF](https://www.mathworks.com/help/fuzzy/mamfis.addmf.html), [addRule](https://www.mathworks.com/help/fuzzy/mamfis.addrule.html), [evalfis](https://www.mathworks.com/help/fuzzy/mamfis.evalfis.html), [evalfisOptions](https://www.mathworks.com/help/fuzzy/fuzzy.evalfis.evalfisoptions.html) y [defuzzificación](https://www.mathworks.com/help/fuzzy/defuzzification-methods.html).

## Paquete para el sitio existente

`npm.cmd run preparar:netlify` regenera `public/`, `entrega-netlify/drop/` y `entrega-netlify/ciudad-algoritmos-netlify.zip`. La lista pública explícita incluye los siete scripts del módulo, página, CSS, catálogo/ciudad y ayudas actualizadas. MATLAB, pruebas, informes, secretos, .git y temporales quedan fuera. La navegación y los recursos se comprueban sirviendo el propio Drop.

Carpeta exacta para arrastrar a **Deploys** del sitio Netlify existente:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop
```

No se publicó el sitio.

## Límites

Un único tipo de inferencia y operadores fijos; sin expresiones anidadas, importación general .fis, superficie 3D, calibración, entrenamiento o control real. Los mapas tienen resolución inicial fija y son exploratorios. La biblioteca depende del navegador/origen y conviene exportar JSON para trasladar sistemas. Los resultados y mapas se recalculan tras cargar. La bienvenida requiere conexión para ver el video; el módulo y Algo funcionan localmente sin MATLAB ni APIs. La comparación MATLAB permanece pendiente de ejecución real.
