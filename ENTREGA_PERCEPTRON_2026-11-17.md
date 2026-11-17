# Entrega local · Redes neuronales · Perceptrón

**Fecha:** 17 de noviembre de 2026 · America/La_Paz.

**Proyecto:** Ciudad de los Algoritmos.

## Acceso y resultado

Módulo disponible en **http://127.0.0.1:8123/redes-neuronales.html**, con `npm start` activo. También aparece como último módulo en la ciudad, la vista de lista y el menú, dentro de Redes neuronales.

Se encontró y reutilizó `Perceptron_Ciudad_de_los_Algoritmos.zip`. Su archivo `js/neuronales/motor.js` se conserva idéntico, byte por byte; se adaptaron la página, los estilos y el controlador del ZIP a la aplicación actual. El motor utiliza enteros escalados `BigInt` para mantener exactitud decimal y decidir correctamente cuando z = 0.

Archivos propios del módulo:

- `redes-neuronales.html`.
- `css/neuronales.css`.
- `js/neuronales/motor.js`.
- `js/neuronales/app.js`.

Se integró con el catálogo, la ilustración de la ciudad, la navegación y los temas comunes. La ayuda local de Algo añade cinco entradas sobre perceptrón, épocas, pesos, activación y XOR; su explicación del paso lee el registro que se está consultando. La Ayuda del módulo también está disponible desde el menú móvil.

Trabajo local, sin dependencias nuevas, commits, push ni publicación. Los cambios anteriores de Dijkstra y Kruskal se conservaron. Esta fase no modifica sus motores, el `app.js` de la raíz ni las implementaciones aprobadas de Asignación, Johnson, Northwest, Ordenamiento y Árboles. Lógica difusa y MATLAB permanecen para otra fase.

## Ejemplo de clase y convención matemática

AND de la pizarra viene precargado con dos entradas: x₁ representa coincidencia de placa y x₂ coincidencia de color. Los patrones se recorren en este orden:

| Patrón | Deseada |
|---|---:|
| (0, 0) | 0 |
| (0, 1) | 0 |
| (1, 0) | 0 |
| (1, 1) | 1 |

Valores iniciales: **w₁ = 0,2; w₂ = 0,1; θ = 0,2 fijo; η = 0,1; Hardlim**. El límite inicial es de 30 épocas.

El motor, el procedimiento y las tablas usan:

- Suma ponderada: S = Σ(xᵢ · wᵢ).
- Entrada neta: z = S − θ.
- Hardlim: 1 si z ≥ 0; 0 si z < 0.
- Hardlims: 1 si z ≥ 0; −1 si z < 0.
- Error: e = predicha − deseada.
- Corrección: Δwᵢ = −η · e · xᵢ.
- Peso nuevo: peso anterior + Δwᵢ.

Cada fila recibe los pesos y el umbral que dejó la anterior. Una época incluye todas las filas. El entrenamiento termina tras una época completa sin errores o al alcanzar el límite; no se detiene por acertar un único patrón.

La opción avanzada de aprender el umbral está desactivada en los ejemplos. Cuando se habilita, muestra por separado Δθ = η · e y θ nuevo = θ anterior + Δθ.

## Caso obligatorio verificado

Predicciones iniciales: **0, 0, 1, 1**, con **3/4 aciertos**.

En la tercera fila de la primera época, (1, 0) → 0:

```text
S = 1 × 0,2 + 0 × 0,1 = 0,2
z = 0,2 − 0,2 = 0
Hardlim(0) = 1
e = 1 − 0 = 1
Δw₁ = −0,1 × 1 × 1 = −0,1
w₁ nuevo = 0,2 − 0,1 = 0,1
Δw₂ = −0,1 × 1 × 0 = 0
w₂ nuevo = 0,1
θ = 0,2, fijo
```

La explicación destaca w₁ y precisa que w₂ no cambia porque x₂ vale cero, aunque existe error.

| Época | Errores durante el recorrido | Pesos al terminar | Umbral |
|---|---:|---|---:|
| 1 | 1 | (0,1; 0,1) | 0,2 |
| 2 | 0 | (0,1; 0,1) | 0,2 |

El historial contiene ocho registros y el entrenamiento termina después de **dos épocas**. Predicciones finales: **0, 0, 0, 1**, con **4/4 aciertos**. Se verificó la misma información en el motor, el paso individual, la tabla completa de época, el gráfico de errores y la comparación antes/después.

## Datos admitidos y comportamiento

| Dato | Valores admitidos |
|---|---|
| Cantidad de entradas | Entero de 1 a 6 |
| Patrones | De 1 a 32, en el orden de la tabla |
| Entradas, pesos iniciales y umbral inicial | De −100 a 100, hasta seis decimales |
| Razón de aprendizaje η | De 0,000001 a 1, hasta seis decimales |
| Máximo de épocas | Entero de 1 a 100 |
| Deseadas con Hardlim | 0 o 1 |
| Deseadas con Hardlims | −1 o 1 |
| JSON | Tipo `ciudad-perceptron`, versión 1; máximo 100000 bytes |

Se acepta coma o punto decimal. Se rechazan vacíos, texto mezclado con números, separadores mezclados, valores fuera de rango, exceso de precisión, clases incompatibles, dimensiones incorrectas y épocas fraccionarias. Los límites de pesos y umbral se aplican a su configuración inicial; el aprendizaje conserva las actualizaciones calculadas.

El diagrama muestra entradas → suma ponderada → activación → salida y se actualiza con el paso consultado. Procedimiento permite avanzar y retroceder por patrón, atravesar el cambio de época, elegir otra época y desplegar su tabla completa. Incluye entradas, pesos anteriores, productos, S, θ, z, predicción, deseada, error, correcciones y pesos nuevos. La explicación numérica de cada peso procede del historial real.

Comparación evalúa los mismos patrones con los pesos iniciales y los obtenidos. Muestra deseada, antes, después, coincidencia final, pesos, aciertos y errores por época. Estos aciertos corresponden a los patrones de entrenamiento. Probar una entrada utiliza los pesos obtenidos y no modifica el entrenamiento.

Editar patrones, clases, dimensiones, activación, pesos o parámetros retira el resultado vigente y pide entrenar de nuevo. Cambiar de activación convierte las clases binarias/bipolares con un aviso visible. Exportar conserva datos y parámetros, sin historial; al importar se vuelve a entrenar. El JSON se valida antes de reemplazar: una importación inválida mantiene el ejercicio y su resultado. Si hay cambios en el ejercicio, la carga de otro ejemplo o JSON válido utiliza la confirmación compartida de reemplazo.

## Ejemplos adicionales comprobados

- **OR:** converge y obtiene 0, 1, 1, 1.
- **AND bipolar · Hardlims:** usa entradas −1/1, deseadas −1, −1, −1, 1 y pesos iniciales cero. En (1,1) registra e = −2 y Δw₁ = Δw₂ = 0,2. Termina con errores por época 1, 0 y 4/4 aciertos.
- **XOR:** con su límite de 12 épocas registra 2 errores en la primera y 3 en cada una de las siguientes. Presenta «Límite de épocas» y no declara convergencia. Explica que una sola neurona con frontera lineal no puede separar esos cuatro patrones.
- **Umbral ajustable:** una fila con e = 1 muestra Δθ = 0,1 y θ pasa de 0,2 a 0,3, separado del cambio de pesos.
- **Entrada inválida:** se rechaza un peso de texto y se identifica el campo. Un JSON con Hardlims y salida deseada 0 conserva el ejercicio y el entrenamiento anterior.

## Pruebas ejecutadas

Entorno: Windows, Node `v26.12.1`, Microsoft Edge `157.0.4341.60` y Puppeteer ya disponible. Se usaron contextos aislados, sin trabajos personales.

| Comando o comprobación | Resultado |
|---|---|
| `npm.cmd run test:perceptron` | 8 pruebas correctas, sin fallos; aceptación exacta, historial, Hardlims, OR, XOR, umbral opcional y validación |
| `node tests/perceptron-navegador.js --captura` | 235 comprobaciones correctas sobre el proyecto; sin errores JS/HTTP locales |
| Misma suite con `URL_PRUEBAS` sobre un servidor temporal de `entrega-netlify/drop` | 235 comprobaciones correctas; sin errores JS/HTTP locales |
| `node tests/verificar.js`, después de regenerar | 123 correctas, 0 fallidas; sintaxis de 307 JS, incluidas copias públicas |
| `npm.cmd test` | Pasan verificación, Johnson, Asignación, Northwest, Ordenamiento y Árboles; se detiene en el fallo previo de Guardados detallado abajo |
| `node tests/foco.test.js` | 3 correctas, 0 fallidas |
| `node tests/grafos.test.js` | 27 correctas, 0 fallidas |
| `node tests/referencias-clase-grafos.test.js` | 3 correctas, 0 fallidas; conserva las referencias anteriores de Dijkstra y Kruskal |
| `node tests/asistente-servidor.test.js` | Correcta |
| `npm.cmd run preparar:netlify` | 106 archivos públicos; ZIP de 555395 bytes |
| `node tests/verificar-paquete-asistente.js` | CRC correcto e igualdad de los 106 archivos en fuente, public, drop y ZIP |
| Comparación con el ZIP recibido | Motor reutilizado idéntico byte por byte |
| `git diff --check` y revisión de archivos excluidos | Sin errores de espacios; motores anteriores conservados |

La suite de navegador recorre **320, 390, 768 y 1440 px**, en temas claro y oscuro y con escala 100 %. Comprueba carga, entrenamiento, historial, comparación, teclado, validación, invalidación, importación/exportación, predicción independiente, ciudad/lista/menú y ayuda. En móvil, las tablas tienen desplazamiento interno y las explicaciones de pesos se adaptan al ancho. Se revisaron capturas de escritorio y móvil; las imágenes de QA quedan únicamente en la carpeta temporal, fuera del proyecto y del paquete.

### Fallos anteriores que permanecen

No se presenta la suite general como totalmente aprobada. Se comparó el comportamiento con los archivos de referencia de Git mediante lecturas en memoria, sin restaurar ni sobrescribir el trabajo local:

- `tests/asistente-contexto.test.js`: 31 correctas y 7 fallidas, tanto antes como después. Afectan expectativas previas de sugerencias, contexto difuso, selección de Johnson y explicaciones locales.
- `tests/asistente-conocimiento.test.js`: 27 correctas y 9 fallidas, tanto antes como después. Incluyen temas/referencias previos, respuestas difusas y seguimientos conversacionales.
- `tests/asistente-interfaz.test.js`: conserva el fallo previo «Sugerencias, envío y foco siguen disponibles».
- `tests/guardados.test.js`: 18 correctas y 1 fallida. La prueba «leerTrabajos/escribirTrabajos usan la clave de config y toleran JSON corrupto» intenta escribir una biblioteca con un registro incompleto; la implementación la rechaza. El mismo fallo se reproduce usando el modelo de grafos de referencia, sin cambios de esta fase.

La integración específica de Perceptrón con Algo sí pasó sus comprobaciones de navegador. Resolver los fallos generales anteriores queda pendiente fuera de esta entrega.

## Paquete listo para Netlify

Carpeta arrastrable:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\drop
```

ZIP equivalente:

```text
C:\Users\GONZALO APAZA\Desktop\Algoritmos-main\entrega-netlify\ciudad-algoritmos-netlify.zip
```

Se comprobó el enlace del catálogo y la presencia de `redes-neuronales.html`, `css/neuronales.css`, `js/neuronales/motor.js` y `js/neuronales/app.js`. **`js/northwest/optimizacion.js` permanece incluido**, con contenido idéntico entre fuente, public, drop y ZIP. El ZIP original recibido, informes, pruebas y capturas no se incluyen en el paquete estático.

Para Netlify, utiliza `drop` o extrae el ZIP de entrega y arrastra la carpeta que contiene `index.html` en su raíz. No se realizó publicación.

## Pendientes y límites

- Las fotos originales de la pizarra no estaban disponibles entre los archivos recibidos. El ejercicio sigue los valores y la convención explícitos de la orden; queda pendiente contrastar su presentación con esas fotos.
- La revisión móvil corresponde a emulación de Edge. No se probó en teléfono físico, teclado virtual, Firefox, Safari o proyector.
- El perceptrón conserva el ejercicio en la sesión abierta y permite exportarlo. No incorpora autoguardado ni biblioteca de trabajos con nombre.
- Permanecen los fallos generales de Algo y Guardados descritos arriba. No quedan fallos conocidos en los casos ejecutados del nuevo módulo.
- Lógica difusa y su comparación con MATLAB continúan fuera de esta fase. No se verificó ni publicó un sitio remoto.
