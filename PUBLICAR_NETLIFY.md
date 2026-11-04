# Publicar Ciudad de los Algoritmos en Netlify Drop

La versión actual incluye Algo completamente local. No requiere claves, variables de entorno, construcción en Netlify ni Functions.

## Paquete vigente

- Carpeta para arrastrar: `C:\Users\GONZALO APAZA\Desktop\Algoritmos\entrega-netlify\drop`.
- ZIP equivalente: `entrega-netlify/ciudad-algoritmos-netlify.zip`. Extráelo primero y usa la carpeta que contiene `index.html` directamente.

Ejecuta `npm.cmd run preparar:netlify` desde el proyecto original después de cambiar sus fuentes. El script genera el sitio estático con una lista explícita de archivos públicos y valida sus recursos. Excluye `.env`, secretos, `.git`, pruebas, capturas, archivos privados y paquetes antiguos. Nunca lee `.env`.

## Actualizar el proyecto existente

1. Inicia sesión en Netlify y abre el proyecto correspondiente a **https://tranquil-palmier-b1959c.netlify.app**.
2. Entra en **Deploys** de ese proyecto existente.
3. Arrastra la carpeta **drop** a su zona de carga manual y espera a que finalice el despliegue.
4. Abre el sitio, pulsa Algo y prueba «¿Cómo empiezo?» y «¿Cuáles son las reglas?».

`index.html` está en la raíz de `drop`, junto con las siete páginas y sus CSS y JavaScript. Si aparecen opciones de construcción para esta carpeta, deja Build command vacío y usa `.` como Publish directory. No subas la raíz del proyecto ni `entrega-netlify` completa.

## Paquetes obsoletos

**NO publiques `OBSOLETO_GEMINI_NO_PUBLICAR/`**. Allí se conservan `ciudad-algoritmos-funciones.zip` y `proyecto-completo` de la versión anterior. También se archiva `.vinculo-cli-proyecto-completo`, el vínculo CLI antiguo de ese paquete. No se regeneran ni se incluyen en el ZIP vigente. El único paquete actual es `ciudad-algoritmos-netlify.zip` y su carpeta equivalente `drop`.

## Uso y datos locales

`npm.cmd start` sirve el proyecto en http://localhost:8123/. Algo funciona dentro del navegador sin solicitudes de red propias. Los videos externos conservados necesitan conexión. `.env` permanece intacto y ya no se utiliza para Algo.

Los trabajos pertenecen al origen del navegador: localhost, 127.0.0.1 y el dominio publicado tienen datos separados. Exporta los trabajos JSON del módulo de origen e impórtalos en el mismo módulo del sitio publicado para trasladarlos.

Esta preparación no inicia sesión, no publica, no hace commits ni push. La publicación del proyecto existente queda a cargo del usuario mediante Drop.
