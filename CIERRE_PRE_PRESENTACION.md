# Cierre previo a la presentación

**9 de noviembre de 2026.** R-01 a R-05 implementados y entrega estática regenerada. **Sin publicación, commits, instalaciones ni capturas.** Se conservaron los cambios locales anteriores y `REVISION_PRE_PRESENTACION.md` como registro histórico.

## Correcciones

| Referencia | Estado y cambio |
|---|---|
| R-01 | **Corregido.** Northwest usa `resultadoConsultableNorthwest()` para distinguir cálculo vigente, histórico consultable con texto inválido, cálculo invalidado y ausencia de cálculo. Chip, Resultado, Procedimiento y Algo comparten el criterio y los mensajes. Un resultado incompatible permanece oculto y no se entrega a Algo como histórico consultable. |
| R-02 | **Corregido.** Reconocimiento acotado a Difusa para «¿Cómo se obtuvo el centroide?», «¿Cómo obtuviste el centroide?», «¿De dónde sale el centroide?», «¿Cómo se calculó este centroide?» y «¿Cómo se calcula el centroide?». Con cálculo vigente explica momento, área y valor reales; sin él explica integración continua por tramos y pide Evaluar. Sin cambios de umbrales globales ni del motor matemático. |
| R-03 | **Corregido.** Los dos textos de Inicio derivan la cantidad del catálogo disponible: actualmente **8 módulos y 8 zonas**. El HTML de respaldo tampoco fija una cantidad incorrecta. |
| R-04 | **Corregido únicamente en Inicio.** «Implementación actual: O(V³ + V·E), con selección lineal en Dijkstra». Se aclara que registrar pasos y dibujar añade trabajo al núcleo de cálculo. |
| R-05 | **Corregido, solo texto.** Tooltips: «Generar valores en orden descendente» y «Generar valores casi ordenados». Este último describe la generación existente sin prometer orden ascendente completo ni un mejor caso universal. |

## Responsive de Inicio y ciudad

- La distribución depende del **ancho útil del contenedor**, incluida la reducción causada por la navegación lateral: panel al lado desde 68 rem; debajo en anchos intermedios; escenas conectadas en columna hasta 39 rem.
- Se conservaron edificios SVG, catálogo, paleta, animaciones, pausa, movimiento reducido y alternativa Lista. Los SVG mantienen su proporción; las etiquetas envuelven y los controles principales medidos alcanzan al menos 44 px.
- Hay **un único enlace «Abrir módulo»**: en composición compacta se traslada, junto al nombre seleccionado, a la barra inferior; al ampliar vuelve a la ficha. No se clona ni duplica su foco. La barra queda a 10 px de Algo, reserva espacio inferior y se oculta con Lista, menú o Algo y al salir de la sección. Con texto ampliado en escritorio respeta también el lateral desplegado o plegado.
- Seleccionar un edificio actualiza ficha, nombre y enlace sin desplazar automáticamente la página. La selección se conserva al redimensionar.
- La cabecera admite texto aumentado y comunica su altura real a la navegación. La descripción de complejidad envuelve dentro de su tabla. Se comprobó el documento sin ocultar el desbordamiento horizontal de Inicio.
- Fundamentos, video, equipo y recientes mantienen sus secciones y enlaces; no se cambiaron almacenamiento ni formatos de trabajos.

## Archivos modificados en este cierre

Fuentes:

- `index.html`
- `css/ciudad.css`
- `js/comun/inicio.js`
- `js/northwest/estado.js`
- `js/northwest/app.js`
- `js/comun/asistente-contexto.js` — únicamente la rama Northwest.
- `js/comun/asistente-motor.js` — únicamente la derivación de preguntas del centroide en Difusa.
- `ordenamiento.html` — dos atributos `title`.

Además, esta nota y las salidas del preparador existente: `public/`, `entrega-netlify/drop/`, ZIP, manifiesto e instrucciones generadas. No se editaron manualmente las copias públicas.

**Asignación no se analizó ni probó. Johnson no se abrió ni probó y sus fuentes permanecieron intactas.** Solo cambió su texto de complejidad en Inicio. Dijkstra, Kruskal, Árboles y los motores matemáticos indicados quedaron sin modificaciones. La copia y comparación de archivos excluidos durante el empaquetado fueron exclusivamente mecánicas.

## Comprobaciones realizadas

Se reutilizaron Edge y Puppeteer-core instalados, con contextos nuevos y aislados, servidores `127.0.0.1` y datos sintéticos. Las solicitudes externas se bloquearon. Se usaron interacción real y medidas DOM/SVG; **no hubo inspección visual directa ni imágenes generadas**.

| Área | Resultado observado |
|---|---|
| Northwest, fuente | Sin cálculo, con y sin entrada inválida: mensajes correctos. Vigente: **230**. Texto `x` directamente sobre el cálculo: histórico **230** consultable en Resultado y Procedimiento, identificado como anterior. Cambio aceptado `2→3`, con y sin `x` posterior: cálculo oculto, chip y Algo piden recalcular/corregir. Recuperación al corregir a `3` y resolver: **240**. Pregunta literal a Algo en cada estado; sin costo histórico expuesto en el contexto invalidado. |
| Centroide, fuente | Sin cálculo previo, las cinco variantes con cálculo vigente, pregunta ajena e invalidación real por temperatura `20→21` sin evaluar. Con evaluación vigente de ventilación: **2500 / 50 = 50**; tras invalidar, método general y solicitud de Evaluar, sin las cifras anteriores. Comprobaciones puntuales en memoria adicionales también aprobadas. |
| Ciudad | Anchos **320, 390, 768, 1024 y 1440 px**, además de **844×390** horizontal. Sin desbordamiento horizontal del documento; etiquetas dentro de sus edificios y proporción SVG conservada. Se verificaron ambos temas de forma representativa. |
| Texto ampliado | **200 %** mediante tamaño de fuente raíz: 390 px sin desbordamiento de cabecera/documento; etiquetas y acceso alcanzables. Comprobación adicional en escritorio con lateral desplegado y plegado: separación final de 12 px entre lateral y barra. |
| Interacción de Inicio | Selección con ratón, teclado y toque emulado; datos/enlace correctos. Cambio de selección sin variación del desplazamiento. Ciudad/Lista, preferencias de Lista y pausa tras recargar, selección al redimensionar, foco visible, IDs únicos y un único enlace de entrada. Acceso a la ficha alcanzable en los anchos intermedios. |
| Menú y Algo | Apertura/cierre y convivencia con la barra. Escape devolvió el foco a `btnMenuLateral` y `algoAbrir`. Pausa y preferencia de movimiento reducido respetadas. |
| Sintaxis y textos | `node --check` aprobado en los **cinco JavaScript modificados**. `git diff --check` acotado aprobado; solo avisos de normalización LF/CRLF. Cantidad, complejidad y tooltips verificados. |
| Conservación | Comparación mecánica de fuentes protegidas: **61 idénticas** al baseline; los otros dos archivos de esa selección son estado/interfaz Northwest, con los cambios de mensajes autorizados. El informe histórico conserva SHA-256 `db0e6e8e2899df99a684442a5037f2b73db807fb1fb161aa13b2b915e53f976d`. |
| Drop servido directamente | Inicio a **320, 1024 y 1440 px**, cantidad y complejidad correctas, enlace único; toque a 390 px y ambos temas. Northwest reprodujo `230 → edición 2→3 → x → resultado invalidado`, Algo coherente y recuperación a **240**. Sin errores de página ni recursos locales HTTP fallidos en los recorridos completados. |

No se ejecutaron `npm test`, suites generales ni pruebas de Asignación/Johnson. No se crearon suites nuevas. Las verificaciones de interfaz fueron recorridos específicos de los cambios.

## Entrega Netlify actualizada

Se ejecutó `node scripts/preparar-netlify.js`. Después, el verificador existente `tests/verificar-paquete-fase2.py` confirmó:

- **101 archivos públicos** en cada salida y paridad SHA-256 con las fuentes seleccionadas.
- Referencias locales incluidas e `index.html` directamente en la raíz.
- ZIP con **101 entradas**, CRC correcto y tamaño **507150 bytes**.
- Sin bibliotecas de ejercicios, pruebas, respaldos, configuración local ni dependencias remotas necesarias para Algo dentro del paquete permitido.

**Carpeta que debes subir:**

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop
```

ZIP equivalente actualizado:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\ciudad-algoritmos-netlify.zip
```

SHA-256 del ZIP: `b3529daea69a801363624294c52f1e4abda08bf38fa2f74571d15fcc4f036708`.

## Límites que permanecen

R-06 y R-07 **no se implementaron**. MATLAB, dispositivos físicos, lectores de pantalla, zoom nativo y comprobación del dominio remoto siguen pendientes. Las medidas geométricas y la interacción no certifican accesibilidad completa ni todos los posibles solapamientos. No se consultó ni publicó el dominio remoto.
