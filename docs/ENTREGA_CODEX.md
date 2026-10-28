# Entrega local · Ciudad de los Algoritmos · 26/10/2026

Correcciones de Devin cerradas y rediseño implementado. Se conservaron los cambios previos, README, capturas históricas, `tests/navegador.js` y `tests/_cap_tmp.js`. Todo permanece local, sin commits, subidas ni publicaciones.

## Funcionalidad e interfaz

- Importaciones estrictas y no destructivas en Johnson, Asignación y Northwest, incluidas versiones, IDs, referencias y límites. Se mantienen pendientes válidos y migración existente. Corregida la importación de `evaluar`; `exceso-oferta` ya era correcto.
- Renombrado posterior al cálculo actualiza resultados y procedimientos. Árboles recupera estructura, recorrido y paso en pausa; el guardado de 400 ms se completa al salir u ocultar la página. El aviso de fallo de autoguardado es único y se retira tras una escritura exitosa.
- Inicio con cinco edificios SVG propios, calles, vegetación y perspectiva isométrica; selección persistente durante la visita, panel de entrada/resultado y acceso al módulo. En móvil, escenas conectadas en columna y acceso al módulo seleccionado mientras la ciudad está visible.
- Vista ciudad/lista y pausa de demostraciones guardadas de forma tolerante a fallos. Animaciones breves, una por vez; se detienen fuera de pantalla, con pestaña oculta y con movimiento reducido.
- Nombres, rutas, descripciones, zonas, iconos y colores proceden del catálogo común. Ordenamiento conserva cinco métodos y Árboles distingue BST y reconstrucción. Northwest mantiene la advertencia de solución inicial factible.
- Recientes mediante la biblioteca existente: abrirlos muestra «Cargar» y requiere confirmación para reemplazar datos. Fundamentos, videos y equipo conservados al final. Ayudas, diálogos, bibliotecas y menú móvil comparten gestión de foco.
- Identidad discreta en los cinco módulos y ambos temas. Servidor estático local Node sin dependencias para `npm start`.

## Archivos principales

`index.html`, `css/ciudad.css`, `js/comun/ciudad.js`, `inicio.js` y `catalogo.js`; los cinco HTML de módulos, `css/shell.css` y `css/arboles.css`; componentes comunes de foco, navegación y guardados; validadores y persistencia afectados; pruebas de lógica y navegador. README y `ENTREGA_DEVIN.md` actualizados.

## Verificación realizada

- `npm.cmd test`: 136 comprobaciones correctas, 0 fallidas (27 estáticas y 109 de lógica/foco). Ejecuta el mismo script que `npm test`; PowerShell bloqueaba el lanzador `npm.ps1`.
- `node tests/regresiones-navegador.js`: 14 regresiones correctas en Edge, sin errores JavaScript. Usa importación real por FileReader, edición de nombres y navegación antes del guardado diferido; prueba aviso/recuperación en los cinco módulos.
- `node tests/ciudad-navegador.js --capturas`: 282 comprobaciones correctas, 0 fallidas y 0 errores de consola/página. Selección, enlaces, teclado, lista, preferencias, movimiento, recientes y menú móvil.
- `npm.cmd run test:navegador`: 239 comprobaciones correctas, 0 fallidas y 0 errores de consola/página. Ejecutada una vez al final, sin regenerar capturas históricas; cubre los cinco módulos con ejemplos, cálculos, persistencia y tamaños adaptables.
- Inspección visual de Inicio a 320, 390, 768 y 1440 px; ambos temas en móvil y escritorio. Se revisaron las seis capturas nuevas del inicio y dos vistas representativas de módulos. Los cinco módulos se revisaron con ejemplos.
- `git diff --check`: sin errores de espacios; diff revisado, sin archivos eliminados ni regeneración de la galería histórica.

## Limitaciones

El navegador integrado no estaba conectado; las comprobaciones se realizaron con Edge headless y Puppeteer ya disponible. Se verificaron los controles y apertura de video; la reproducción remota de YouTube no se certifica en esta red. La miniatura del inicio ahora es SVG local y no necesita red. No quedan correcciones funcionales pendientes detectadas.

Para abrir el proyecto: `npm start` (o `npm.cmd start` en PowerShell) y `http://localhost:8123`. Mantener el mismo origen utilizado anteriormente permite acceder al almacenamiento existente.
