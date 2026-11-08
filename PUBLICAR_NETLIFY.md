# Publicar la entrega estática en Netlify

Paquete preparado localmente el 8 de noviembre de 2026. **No se publicó el sitio.**

## Carpeta para arrastrar

Arrastra exactamente esta carpeta, que contiene `index.html` en su raíz:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop
```

ZIP equivalente:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\ciudad-algoritmos-netlify.zip
```

Puedes extraer el ZIP en una carpeta nueva y arrastrar esa carpeta con `index.html` directamente dentro. No arrastres la carpeta completa `Algoritmos` ni `entrega-netlify`; contienen documentación, pruebas y respaldos ajenos al sitio.

## Actualizar el proyecto existente

1. Inicia sesión tú en Netlify y abre el proyecto que ya usas.
2. Entra en **Deploys** y localiza la zona de despliegue manual al final de la página.
3. Arrastra `drop` a esa zona. Así actualizas el proyecto existente; la zona general para crear proyectos tendría otro propósito.
4. Espera el estado de despliegue terminado y abre su URL. La carga manual puede publicar directamente la nueva versión; revísala antes de presentarla.

Pasos contrastados con la [documentación oficial de creación de despliegues de Netlify](https://docs.netlify.com/deploy/create-deploys/). No necesitas Gemini, funciones de servidor ni claves de API para esta aplicación estática.

## Llevar ejercicios de localhost al dominio publicado

Los guardados son independientes por navegador y por origen. `localhost`, `127.0.0.1` y el dominio Netlify tienen bibliotecas distintas.

- En un módulo con **Mis trabajos**, usa **Exportar** para descargar los trabajos del módulo. En el dominio publicado abre el mismo módulo y usa **Importar**. Conserva el archivo hasta confirmar que puedes cargar el ejercicio.
- Johnson también permite **Exportar JSON / Importar JSON** para un grafo. Dijkstra, Kruskal y Northwest tienen exportación/importación de sus documentos actuales.
- Lógica difusa conserva su biblioteca propia: carga el ejercicio, usa **Exportar trabajo**, luego **Importar trabajo** en el otro origen y guárdalo allí. Sus trabajos recientes en Inicio abren esa biblioteca, sin cargar automáticamente un ejercicio.
- Importar no combina formatos de algoritmos distintos. Descargar y subir archivos no sincroniza cambios posteriores entre los dos sitios.

## Comprobación breve después de publicar

Abre el inicio y cada ejemplo de la lista siguiente; comprueba que no faltan recursos y que la URL pertenece al proyecto esperado. En móvil revisa que controles, tablas y ayuda sean alcanzables. Exporta e importa un ejercicio de prueba y comprueba que se puede recuperar. Esta comprobación posterior al despliegue corresponde a quien publique; no se ha ejecutado aquí.

## Ejemplos para la defensa

- **Johnson:** «Rutas y tiempos (19 / 58)». A→E→D→B suma 19; A→B pesa 58. Con el mínimo activo, B muestra **Acum. 19 | Total 19**; con el máximo activo, **Acum. 58 | Total 58**. Comparar sin ruta activa muestra **mín 19 | máx 58**; activar una ruta cambia a Acum./Total y volver a pulsarla recupera mín/máx. En temporal, B conserva **temprano 58 | tardío 58**; holguras 0/39.
- **Dijkstra:** ejemplo de ceros y empates; origen A, seleccionar destinos sin recalcular. Mostrar también un nodo inalcanzable del ejemplo desconectado.
- **Kruskal:** negativos, cero y empates, y luego grupos separados. Comparar mínimo/máximo y explicar árbol frente a bosque, sin origen/destino.
- **Northwest:** caso balanceado, seguido de uno que necesita elemento ficticio. Es una solución inicial factible; no se afirma costo óptimo.
- **Shell:** mostrar un salto con posiciones 0, 4 y 8; usar el deslizador o Ir al final para evitar esperar toda la reproducción de una lista grande.
- **Lógica difusa:** mostrar AND/OR, recortes y centroide; para la corrección numérica, salida [0,100] con triángulo [0.01,0.02,0.03], activación 1 y centroide 0.02. La integración continua puede diferir ligeramente del muestreo discreto anterior.

El informe [ENTREGA_FASE_2_FINAL.md](ENTREGA_FASE_2_FINAL.md) identifica pruebas realizadas y pendientes. Asignación permanece fuera de las correcciones y de las pruebas de esta fase.

El [ajuste de Johnson del 8 de noviembre de 2026](docs/AJUSTE_JOHNSON_2026-11-08.md) añade el significado de las casillas del destino, la ayuda local y su verificación dirigida. Los informes anteriores se conservan como historial.
