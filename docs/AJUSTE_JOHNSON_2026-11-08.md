# Ajuste de Johnson — 8 de noviembre de 2026

Continuación de los cambios locales existentes de Johnson. Los informes de entregas anteriores se conservan; esta nota registra únicamente el ajuste del destino, la ayuda local, el procedimiento y la entrega estática. No se publica el sitio.

## Contrato del resultado

- Los nodos ordinarios de consulta muestran mínimo | máximo desde el origen elegido.
- El destino con una ruta activa muestra Acum. | Total. El acumulado se obtiene sumando los pesos originales de los tramos; una discrepancia con el costo esperado produce un error y no permite presentar la ruta como válida.
- Comparar sin una ruta activa muestra mín | máx. Pulsar una ruta la activa y volver a pulsarla la desactiva; los valores y la leyenda siguen esa selección.
- La vista temporal conserva temprano | tardío. Esos tiempos no se interpretan como el costo mínimo.
- Resultado y procedimiento comparten el renderizador de nodos. El paso final reconstruye la ruta activa; los pasos anteriores conservan sus datos de cada etapa. Cambiar la ruta sustituye ese paso final y editar el grafo invalida la selección y sus resaltados.
- Algo explica los valores y los errores del contexto de consulta vigente, de forma local y sin interpretar texto del DOM.

En el ejemplo A→B=58, A→E=6, E→D=5 y D→B=8, B muestra Acum. 19 | Total 19 con el mínimo activo; Acum. 58 | Total 58 con el máximo; mín 19 | máx 58 al comparar sin selección; y temprano 58 | tardío 58 en temporal. Las distancias matemáticas guardadas siguen siendo mínimo 19 y máximo 58.

## Verificación de este ajuste

Comprobaciones ejecutadas y aprobadas el 8 de noviembre de 2026:

- `node tests/fase1-estado-johnson.test.js`: **21 correctas, 0 fallidas**. Incluye casillas y rótulos, leyenda, pesos originales frente a reponderados, discrepancia explícita, sincronización del paso final, datos reales de etapas e invalidación por pesos y topología.
- `node tests/fase2-ayuda-johnson.test.js`: **7 correctas, 0 fallidas**. Incluye Acum./Total, comparación, temporal, error de correspondencia y rechazo de contexto obsoleto.
- `node --check` de los seis JavaScript modificados: sin errores de sintaxis.
- `node tests/ajuste-johnson-navegador.js`: **21 comprobaciones correctas** en un único recorrido real, sin capturas. Mínimo → máximo → comparar sin selección → activar/desactivar ruta → temporal → procedimiento → último paso → editar un peso. También se comprobó la desactivación fuera de comparación y que zoom, ajuste y ampliación de ambos SVG conservan el grafo y sus cálculos. El último paso siguió la ruta activa sin duplicarse y conservó temprano/tardío en temporal. La edición real de un peso invalidó resultado, procedimiento, modelo y resaltados. Sin errores de página ni consola de la aplicación; la solicitud automática de favicon se respondió con HTTP 204 desde la prueba.
- `node scripts/preparar-netlify.js`: regeneró `public/`, Drop y ZIP con **101 archivos públicos**; ZIP de **505786 bytes**.
- El verificador existente `tests/verificar-paquete-fase2.py`, ejecutado con el Python instalado del entorno, confirmó inventarios exactos, `index.html` en raíz, CRC del ZIP e identidad SHA-256 de **los 101 archivos** entre fuentes, `public/`, Drop y ZIP. Sin archivos internos, bibliotecas de ejercicios, respaldos, configuración local, secretos detectados ni dependencias del asistente remoto.

Herramientas existentes utilizadas, sin instalar dependencias:

- Puppeteer-core: `C:\Users\GONZALO APAZA\AppData\Local\Temp\grafo-e2e\node_modules\puppeteer-core\lib\cjs\puppeteer\puppeteer-core.js`.
- Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- Python: `C:\Users\GONZALO APAZA\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.

El verificador del paquete es una comprobación mecánica del artefacto y no ejecuta los otros algoritmos. No se requieren suites generales ni instalación de dependencias para este cierre.

## Archivos modificados en esta continuación

- `js/comun/asistente-contexto.js`: explicación local con los valores/rótulos reales del destino y su error; el extractor comparte la fuente del renderizador para comparación y temporal.
- `js/johnson/vistas.js`: limpieza de modelo/error al invalidar y desactivación persistente al volver a pulsar una ruta, también fuera de comparación.
- `js/dibujo.js`: leyenda coherente cuando la ruta está desactivada.
- `tests/fase1-estado-johnson.test.js`, `tests/fase2-ayuda-johnson.test.js` y `tests/ajuste-johnson-navegador.js`: pruebas dirigidas del contrato y recorrido reproducible.
- `README.md`, `PUBLICAR_NETLIFY.md` y esta nota: significado de las casillas, ejemplo y cierre documentado.

Las copias públicas se actualizaron únicamente mediante el preparador. Se conservaron los cambios previos de Devin, los informes y los respaldos de entregas anteriores. No se analizaron ni modificaron otros algoritmos; tampoco se ejecutaron suites generales, commits, push ni publicaciones.

## Rutas de entrega

- Drop: `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop`
- ZIP: `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\ciudad-algoritmos-netlify.zip`

Drop y ZIP actualizados y verificados. No quedan pendientes dentro del alcance solicitado. El sitio no fue publicado.
