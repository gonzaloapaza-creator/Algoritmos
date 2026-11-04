# Entrega: Algo exclusivamente local

Actualizada el 4 de noviembre de 2026.

## Comportamiento

- Robot SVG y diseño con variables de ambos temas conservados; subtítulo **Ayuda interactiva**. Saludo, parpadeo y gesto breve de respuesta, sin esperas artificiales.
- Una conversación, un campo y Enviar. Historial y borrador permanecen en memoria al cerrar el panel; Limpiar los elimina. Se conservan Escape, teclado, foco, protección del fondo en móvil y posición de lectura.
- Base estructurada para inicio y los siete módulos: primeros pasos, datos, reglas, herramientas, procedimiento, interpretación, guardado, traslado JSON, impresión y errores. Normalización de acentos, sinónimos e intenciones delimitadas. Prioridad al módulo activo con consultas explícitas sobre otros y comparaciones.
- Las explicaciones del ejercicio reutilizan adaptadores de lectura: vista, datos pendientes, avisos, paso, operación, resultado y elementos resaltados. Utilizan textos y valores ya producidos por la aplicación. Los resultados invalidados exigen recalcular y las muestras recortadas se indican.
- Las preguntas sin cobertura reciben: «No tengo una explicación local para esa pregunta. Puedo ayudarte con las reglas, los pasos y el uso de este módulo.», junto con tres sugerencias. No se presenta ayuda general como cálculo exacto del ejercicio.
- El asistente no hace solicitudes de red. Se retiraron disponibilidad, peticiones al proveedor, avisos de envío, cancelación/reintento de red y estados de espera. Los videos externos existentes conservan su funcionamiento.

## Servidor y publicación

Servidor local estático conservado en el puerto 8123, con las restricciones de rutas y origen. Ya no lee `.env`. El archivo del usuario no se leyó ni modificó. Se retiraron los tres archivos exclusivos del servidor de Gemini, la Function, sus reglas Netlify y el ejemplo de configuración ya innecesario. La lógica de los algoritmos no se modificó.

Paquete vigente: `entrega-netlify/ciudad-algoritmos-netlify.zip` y carpeta equivalente `entrega-netlify/drop/`, con `index.html` directamente en la raíz. Son 81 archivos públicos, sin secretos, pruebas, capturas, archivos privados ni Functions.

Las salidas anteriores `ciudad-algoritmos-funciones.zip`, `proyecto-completo` y `.vinculo-cli-proyecto-completo` se conservaron dentro de `entrega-netlify/OBSOLETO_GEMINI_NO_PUBLICAR/`, con aviso de no publicación. El script no vuelve a generarlas. Se conservó el resto del contenido ajeno al empaquetado.

La guía [PUBLICAR_NETLIFY.md](PUBLICAR_NETLIFY.md) indica cómo arrastrar **drop** al apartado **Deploys** del proyecto existente https://tranquil-palmier-b1959c.netlify.app. Algo no requiere claves, variables de entorno ni Netlify Functions. No se publicó ni se modificó el proyecto remoto.

## Verificaciones específicas realizadas

- Sintaxis correcta de los ocho archivos JavaScript modificados.
- `npm.cmd run test:asistente`: 33 casos de adaptadores/ayuda, 19 comprobaciones de interfaz en DOM simulado y comprobación del servidor estático. No resuelven las suites matemáticas.
- `npm.cmd run test:asistente:navegador`: Microsoft Edge headless, perfil aislado y paquete Drop. Inicio y siete módulos: apertura y cierre, respuestas representativas, desconocida, contexto sin modificar el ejercicio y conservación de conversación. También teclado, límites del panel móvil, movimiento reducido, impresión y respuesta sin conexión. Cero solicitudes del chat y cero errores JavaScript.
- ZIP verificado mediante CRC y comparación de sus 81 archivos con drop, public y las fuentes. Recursos HTML validados por el empaquetador y exclusiones comprobadas.

No se generaron capturas, no se ejecutaron suites generales, no se hicieron commits, push ni publicaciones. Las comprobaciones móviles fueron en navegador con tamaño simulado; no se probó un teléfono físico ni un teclado virtual real. El alcance de Algo es la ayuda local cubierta y los datos disponibles en el estado de la página.
