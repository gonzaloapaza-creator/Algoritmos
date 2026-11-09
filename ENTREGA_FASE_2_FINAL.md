# Entrega FASE 2 y cierre — Ciudad de los Algoritmos

Fecha: 8 de noviembre de 2026 (America/La_Paz). Se continúa la FASE 1 sobre el árbol local, conservando sus cambios y los que ya existían. Esta entrega prepara archivos estáticos; no realiza commits, push, inicio de sesión ni publicación en Netlify. No se instalaron dependencias ni se cambió el framework.

## Correcciones y alcance

| Hallazgo | Atención en esta fase |
| --- | --- |
| H-01 / H-02 | Se comprobó el flujo real de los grafos de FASE 1: Johnson 19\|58, temporal 58\|58 y Dijkstra rápido sin sustituir su consulta. Se detectaron y corrigieron dos problemas gráficos adicionales descritos abajo. |
| H-05 | Los nombres homónimos de 60 caracteres reservan espacio para sufijos, también de varias cifras. Registro, contenedor y representación serializada se validan antes de escribir; un fallo conserva la biblioteca. Solo se modifica manejo genérico, sin cambiar adaptadores ni formatos. |
| H-04 / H-19 de Northwest | Errores pendientes por IDs vigentes, purga de celdas eliminadas y restauración con deshacer/rehacer. Resultado, procedimiento y Algo muestran **«Último cálculo válido; hay datos pendientes de corregir»**. No se permite resolver con esas entradas. Tab, Mayús+Tab y Enter conservan el foco por IDs. Sigue siendo una solución inicial factible, sin garantía de óptimo. |
| H-07 | Shell muestra los índices reales del grupo, por ejemplo 0, 4 y 8, también en sus etiquetas accesibles. Mantiene 200 elementos, con Ir al final, deslizador, pausa/cancelación y estimación de duración de reproducción; no se confunde con tiempo de cálculo. |
| H-03 | El centroide difuso se obtiene integrando la envolvente por tramos lineales, incluidos recortes e intersecciones. El caso triangular estrecho ya no depende de que una muestra uniforme caiga dentro del soporte. |
| H-08 | Generar combinaciones valida el borrador y muestra errores de campos antes de modificar las reglas. Captura excepciones y conserva el modelo aplicado y el contenido válido. |
| H-09 | Preparación y verificación mecánica de las copias públicas y el ZIP mediante los comandos registrados abajo. No se publica el resultado. |

**Asignación está excluida:** no se analizó su implementación, no se modificaron sus adaptadores, modelo, interfaz o reglas y no se ejecutaron sus pruebas. H-06 y su parte de H-19 siguen pendientes. El empaquetado solo copia y verifica mecánicamente los archivos públicos ya existentes de ese módulo, sin ejecutar su lógica.

Tampoco se amplió Árboles ni se rehízo el pipeline de CI. Los informes de análisis previos permanecen como referencia histórica; no se marcan resueltos sus demás hallazgos.

## Grafos: qué se observó realmente

El navegador integrado había quedado sin conexiones en FASE 1. En esta fase se usaron **Edge headless y Puppeteer-core ya instalados**, con contextos aislados, siguiendo la autorización de alternativa local. No se usó el perfil del usuario ni se generaron capturas, videos o galerías.

La prueba de fuente de los tres grafos registró **96 comprobaciones satisfactorias, 0 escenarios fallidos y 0 errores de página**. Incluye escritorio 1440 en tema claro y móvil 360 en tema oscuro: creación por controles y lienzo, conexión de extremos, edición y eliminación, cancelación de diálogos/conexiones, reglas, conversión de dirección de Dijkstra con conflicto de pesos, resultados, conservación/invalidez, zoom, pan, ajuste, ampliar/restaurar, táctil emulado y teclado. Johnson conserva matriz secundaria, rutas estáticas y las dos interpretaciones de sus valores.

Defectos observados y corregidos:

- En el PNG real de Johnson, la arista larga A→B del ejemplo de tiempos atravesaba los nodos E/D después de organizar por niveles. Ahora se desvía cuando un segmento cruzaría un nodo intermedio, mediante una curva, sin cambiar las posiciones.
- En Dijkstra, a ciertas escalas un nombre de 12 caracteres se superponía con su distancia: se usaban tamaños mínimos de letra pero separaciones que solo dividían por escala. Las posiciones y el radio ahora contemplan el tamaño tipográfico real.

Se descargó una **exportación PNG desde el botón de la aplicación** y se inspeccionó ese archivo: conserva valores, pesos originales/holguras, leyenda y encuadre. Es una exportación del grafo, no una captura de pantalla.

La legibilidad restante se comprobó mediante cajas y medidas DOM/SVG: desbordamiento, controles alcanzables e intersecciones de textos. Esto no equivale a revisar visualmente todas las combinaciones ni a una certificación de accesibilidad. El móvil fue emulado, no un dispositivo físico.

Algo también distingue ahora, en Johnson, el mínimo de la matriz, el costo de la ruta seleccionada y la vista temporal. No interpreta 19 como duración de una red cuyo T es 58. El contexto temporal se toma del cálculo vigente y limita explícitamente su lista de actividades; no reconstruye cálculos desde una muestra parcial.

## Política numérica definitiva de lógica difusa

Se conservan AND=min, OR=max, activación por peso, implicación=min y agregación=max. Para las funciones triangulares y trapezoidales admitidas:

1. Se forman los segmentos de cada consecuente recortado por su activación.
2. Se incorporan nudos del soporte, extremos del recorte e intersecciones entre segmentos para obtener la envolvente máxima.
3. Se integran analíticamente área y primer momento de cada tramo. Se acumulan con compensación de suma y una referencia centrada en el soporte activo para reducir cancelación numérica.
4. El resultado es `∫y·μ(y)dy / ∫μ(y)dy`, con precisión doble, sin redondear internamente.

Las 1001 muestras siguen disponibles únicamente para consulta manual. No determinan el área ni el centroide, y no se reutiliza un promedio uniforme sobre una malla irregular. Los segmentos exactos alimentan la gráfica, el procedimiento y la agregación; el mapa de respuesta usa el mismo evaluador continuo.

Estados diferenciados: ninguna activación final positiva; activación positiva sin masa de salida; limitación/fallo de representación numérica; y centroide numérico válido sin etiqueta lingüística dominante. Este último conserva su número y explica la falta de etiqueta. El helper discreto heredado permanece por compatibilidad y no es el cálculo utilizado por los evaluadores del producto.

Con salida [0,100], triángulo [0.01,0.02,0.03] y activación 1, el centroide es **0.02**, aunque todas las muestras uniformes de ese soporte sean cero. Los resultados continuos pueden diferir ligeramente de las antiguas sumas discretas.

La documentación y exportación de comparación MATLAB describen esa diferencia. **MATLAB/Fuzzy Logic Toolbox no se instalaron ni ejecutaron**; no se certifica equivalencia externa ni sintaxis ejecutada de esos scripts. La tolerancia propuesta de comparación sigue pendiente de validación allí.

## Inicio, biblioteca y ayuda local

La ayuda del inicio deriva el número de edificios del catálogo disponible. Recientes integra la biblioteca propia de difusa mediante un proveedor de solo lectura, limitado a 50 registros y un texto de 4×1024×1024 caracteres. Solo devuelve identificador, nombre, fecha y enlace; no incorpora modelos ni resultados al contexto de Inicio ni migra la biblioteca. Ante formato incompatible o exceso de presupuesto omite esos recientes; la recuperación completa sigue en el módulo difuso.

Los enlaces abren la biblioteca propia con `?intro=no&trabajos=1`, sin cargar automáticamente un ejercicio. Los guardados siguen separados por navegador y origen. Algo permanece local; las respuestas acotadas avisan cuando el contexto es una muestra.

## Archivos de FASE 2

- Grafos: `js/dibujo.js`, `js/grafos/editor.js`.
- Biblioteca e Inicio: `js/comun/guardados.js`, nuevo `js/comun/recientes-difusa.js`, `js/comun/inicio.js`, `index.html`.
- Northwest: `js/northwest/estado.js`, `tabla.js`, `app.js`.
- Shell/controles: `js/ordenamiento/estado.js`, `app.js`, `css/ordenamiento.css`.
- Ayuda: regiones Johnson/Northwest/difusa de `js/comun/asistente-contexto.js`; condiciones exclusivas Johnson/Northwest de `asistente-motor.js`; entradas afectadas de `conocimiento/algoritmos-tablas.js` y `algoritmos-datos.js`.
- Lógica difusa: `js/difusa/motor.js`, `editor.js`, `app.js`, `dibujo.js` y `mapa.js`; textos de `logica-difusa.html`; comparación en `scripts/exportar-referencias-difusa.js`, scripts/referencias de `matlab/` y `ENTREGA_LOGICA_DIFUSA.md`. El modelo, el estado de persistencia y su CSS se conservaron.
- Empaquetado/documentación: `scripts/preparar-netlify.js`, sección de entrega de `README.md`, `PUBLICAR_NETLIFY.md` y este informe. Las copias generadas se producen mediante el script, sin edición manual.
- Regresiones: ampliaciones acotadas de pruebas Northwest, Ordenamiento y difusa; nuevos `tests/fase2-guardados.test.js`, `fase2-recientes.test.js`, `fase2-ayuda-johnson.test.js`, `fase2-inicio-navegador.js`, `fase2-grafos-navegador.js`, `fase2-nw-shell-navegador.js` y `verificar-paquete-fase2.py`, más las comprobaciones difusas/construidas listadas abajo.

## Comprobaciones ejecutadas

### Automatizadas sobre fuentes

| Comando | Resultado |
| --- | --- |
| `node tests/fase2-guardados.test.js` | 6 correctas, 0 fallidas; datos de Dijkstra, nombres de 60 caracteres, colisiones hasta (15), recarga, validación y conservación ante fallos. |
| `node tests/fase2-recientes.test.js` | 4 correctas, 0 fallidas; metadatos acotados, sin escritura/modelos, corrupción, número de edificios y recurso público incluido. |
| `node tests/fase2-ayuda-johnson.test.js` | 4 correctas, 0 fallidas; costo mínimo/máximo seleccionado, tiempos, diagnóstico e invalidez de firma. |
| `node tests/northwest.test.js` | 28 correctas, 0 fallidas. |
| `node tests/ordenamiento.test.js` | 27 correctas, 0 fallidas. |
| `node tests/logica-difusa.test.js` | 14 correctas, 0 fallidas; integración continua y casos analíticos, incluidos estrechos, hombros, recortes, superposiciones, pesos y ausencia de activación. |
| `node tests/logica-difusa-modelo.test.js` | 19 correctas, 0 fallidas. |
| `node tests/logica-difusa-estado.test.js` | 16 correctas, 0 fallidas. |
| `node tests/logica-difusa-mapa.test.js` | 7 correctas, 0 fallidas. |
| `node tests/logica-difusa-editor.test.js` | 5 correctas, 0 fallidas; rechazo de borradores y generación transaccional. |

No se ejecutó `tests/guardados.test.js` completo porque incluye pruebas específicas de Asignación; se añadió una regresión separada para la lógica genérica autorizada. Tampoco se ejecutaron `npm test`, lint global, suites generales de navegador o las cinco suites completas de FASE 1.

### Navegador real sobre fuentes

| Comando | Resultado |
| --- | --- |
| `node tests/fase2-grafos-navegador.js` | 96 comprobaciones, 0 escenarios fallidos, 0 errores de página; tres grafos y PNG real. |
| `node tests/fase2-nw-shell-navegador.js` | 43 comprobaciones correctas; escritorio 1366 oscuro y móvil 360 claro; foco, pendientes, historial, Shell e interacción con 200 valores. |
| `node tests/fase2-nw-shell-navegador.js --solo=algo` | 6 comprobaciones correctas; resultado/paso/total/celda coherentes con «Último cálculo válido; hay datos pendientes de corregir». |
| `node tests/fase2-inicio-navegador.js` | 9 comprobaciones correctas; guardar un ejercicio difuso válido, reciente, enlace, biblioteca, ayuda de 8 edificios, Escape/foco y móvil claro. |
| `node tests/fase2-difusa-navegador.js` | 22 comprobaciones correctas; escritorio 1280 oscuro y móvil 360 claro con táctil emulado. H-08, resultado 0.02/área 0.01, SVG y accesibilidad, procedimiento, Algo, mapa, controles y ausencia de errores JS/HTTP. |

Las pruebas usan bibliotecas de prueba dentro de contextos aislados. Se ajustaron esperas del propio arnés a la protección existente de 350 ms contra clics fantasma al cerrar diálogos; no se eliminó esa protección del producto.

### Paquete construido y última corrección de integración

Se sirvió **`entrega-netlify/drop`**, no la fuente raíz, con:

```powershell
node -e "require('./tests/servidor-local').crearServidor({raiz:'entrega-netlify/drop'}).listen(8124,'127.0.0.1')"
```

La primera comprobación construida de Algo encontró que la pregunta «¿Cuál es el costo total?» en Johnson temporal seleccionaba por afinidad léxica una respuesta estática de Northwest. Se corrigió la prioridad **únicamente en Johnson** para consultas de su resultado y se amplió la regresión a todo el banco de conocimiento cargado por la página. No se cambió la selección de respuestas de Asignación ni de otros módulos. Se regeneró el paquete y se repitió solo el escenario afectado.

Con `$env:URL_PRUEBAS='http://127.0.0.1:8124/'`:

| Comando / configuración | Resultado real |
| --- | --- |
| `$env:GRAFOS_BREVE='1'; $env:COMPROBAR_ALGO_GRAFOS='1'; node tests/fase2-grafos-navegador.js` | El primer recorrido aprobó las 21 comprobaciones móviles; detectó el fallo de ayuda descrito. Tras corregir se repitió únicamente Johnson con `$env:CASO_GRAFOS='johnson-resultado'`: **19 correctas**, 0 fallos y 0 errores de página. Total de escenarios construidos finales de grafos: **40 comprobaciones aprobadas**. La pregunta real en la UI devuelve duración 58 y destino 58\|58; también se comprobó el PNG construido. |
| `node tests/fase2-construido-nw-shell.js` | **8 correctas**; NW resuelve el ejemplo con costo 230 y rotula pendientes; Shell con 200 valores llega al final y coincide con una ordenación nativa de referencia; móvil 360 claro, sin overflow ni errores de página/scripts. |
| `node tests/fase2-difusa-navegador.js --breve` | **6 correctas**; resultado 0.02, área 0.01 aunque las muestras auxiliares no capturen el soporte, segmentos/ARIA, Algo continuo y cero errores JS/HTTP en móvil claro. |
| `node tests/fase2-inicio-navegador.js` | **9 correctas**; reciente difuso, enlace a biblioteca, ayuda, foco y móvil también desde Drop. |

No se repitieron los módulos no afectados después de la última condición exclusiva de Johnson: sus fuentes/copias permanecieron idénticas.

### Sintaxis, espacios y empaquetado

- `node --check` pasó para los 15 JavaScript de integración, biblioteca, grafos, Northwest, Shell y empaquetado comprobados desde la raíz, y para los nuevos arneses de navegador. La parte difusa comprobó sus 14 archivos JS de producto/pruebas modificados mediante `vm.Script`, además de la sintaxis del arnés breve. No se ejecutó el lint global.
- `git diff --check -- <archivos de FASE 2>` pasó, con avisos informativos LF/CRLF y sin errores de espacios. Se mantuvo acotado a los archivos intervenidos.
- `node scripts/exportar-referencias-difusa.js` regeneró las referencias JSON continuas de comparación: no ejecuta MATLAB.
- `npm.cmd run preparar:netlify` pasó; se repitió tras la corrección final de Algo.
- `python tests/verificar-paquete-fase2.py` pasó sobre el paquete final: inventarios, `index.html` en raíz, CRC del ZIP y SHA-256 de cada copia y entrada frente a las fuentes seleccionadas.

## Artefactos finales preparados

**101 archivos públicos** idénticos por SHA-256 en fuentes seleccionadas, `public/`, `entrega-netlify/drop/` y las entradas del ZIP. Se incluyen `js/johnson/caminos.js` y el nuevo `js/comun/recientes-difusa.js`. El script verificó las referencias locales HTML y su orden de dependencias. No se editaron las copias generadas manualmente.

Carpeta para arrastrar:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop
```

ZIP equivalente, **500781 bytes**:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\ciudad-algoritmos-netlify.zip
SHA-256: 844E981C126F57F29AC5F11108C3F2B337A14F8BD32DBCA51C737C27A0302023
```

El ZIP contiene exactamente la lista pública autorizada, sin pruebas, bibliotecas de ejercicios del navegador, respaldos, paquetes antiguos, `.env`, `.git`, MATLAB ni dependencias de Gemini/Functions. Las comprobaciones genéricas de posibles claves privadas/credenciales conocidas no encontraron coincidencias en los artefactos. No se leyeron archivos de secretos ni perfiles personales para generar la entrega. Los respaldos antiguos permanecen fuera de `drop` y del ZIP; no se deben subir.

## Distinción de evidencia y límites

- **Comprobado en navegador:** los escenarios y combinaciones registrados arriba, en Edge local; una exportación PNG real inspeccionada. No incluye impresión PDF, otros navegadores o dispositivos físicos.
- **Comprobado automáticamente:** regresiones concretas de biblioteca, motores/estado modificados, datos y diagnósticos, sintaxis y verificación mecánica de artefactos según los comandos registrados.
- **Deducido por lectura:** conservación de formatos y operadores fuera de las trayectorias ejercitadas; no equivale a revisar todos los ejercicios posibles. Los cálculos importados no se utilizan como autoridad matemática.
- **Pendiente:** MATLAB/toolbox; publicación y comprobación del dominio remoto; dispositivos físicos/lectores de pantalla/otros navegadores; grafos extremos arbitrarios y los hallazgos expresamente excluidos. El desvío geométrico es heurístico y Organizar/zoom pueden seguir siendo necesarios en redes densas o con nodos manualmente superpuestos. No se promete ausencia absoluta de errores.

La carpeta y las instrucciones de subida están en [PUBLICAR_NETLIFY.md](PUBLICAR_NETLIFY.md), con una lista breve de ejemplos para la defensa. El paquete se entrega preparado, sin publicarlo.
