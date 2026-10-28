# Cierre de correcciones de Devin · 26/10/2026

Se conservaron los cambios locales existentes, incluidas capturas, README y herramientas de navegador. Se corrigió la importación de `evaluar` en la suite de Asignación; el ejemplo `exceso-oferta` de Northwest ya estaba corregido.

Se verificaron validación estricta, pendientes, migración v1 de Asignación y actualización de nombres sin invalidar cálculos. Se cerraron rechazos pendientes de versiones incompatibles (incluidos trabajos guardados), nombres numéricos e IDs repetidos entre grupos. Las pruebas comprueban que un trabajo inválido conserva el ejercicio activo.

Árboles conserva estructura, recorrido y paso al restaurar, pausa la reproducción y completa el guardado pendiente de 400 ms al abandonar u ocultar la página. El aviso visible de autoguardado no se duplica y desaparece tras una escritura exitosa. El acceso `?trabajos=1` abre la biblioteca existente sin aplicar datos.

Verificaciones ejecutadas con resultado satisfactorio:

- `node tests/johnson.test.js`: 11 pruebas.
- `node tests/asignacion.test.js`: 26 pruebas.
- `node tests/northwest.test.js`: 22 pruebas.
- `node tests/ordenamiento.test.js`: 18 pruebas.
- `node tests/arboles.test.js`: 13 pruebas, incluida restauración y salida antes del guardado diferido.
- `node tests/guardados.test.js`: 16 pruebas, incluida conservación del ejercicio y aviso visible con DOM mínimo.
- `git diff --check -- js tests/*.test.js`: sin errores de espacios.
- `node tests/regresiones-navegador.js`: 14 regresiones correctas en Edge headless real, sin errores JavaScript ni capturas. Importación por selector de archivo y FileReader conserva datos/historial ante errores y versiones incompatibles; renombrado mediante controles reales actualiza resultado y procedimiento; navegar antes de 400 ms recupera Árboles en pausa; el aviso único y su recuperación funcionan en los cinco módulos.

La prueba dirigida reutiliza `puppeteer-core` disponible en `%TEMP%/grafo-e2e`, Edge instalado y el servidor local; no añade dependencias al proyecto. La comprobación integral `npm test` y la revisión visual se registran en `ENTREGA_CODEX.md`. No se realizaron commits ni subidas.
