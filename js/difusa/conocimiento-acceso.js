/* Conocimiento adicional de Algo, cargado solo en las dos páginas de acceso. */
'use strict';
(() => {
  const K = window.AlgoConocimiento;
  if (!K) return;
  K.registrar([
    {
      id: 'difusa.acceso.versiones', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Qué ofrece cada versión de Lógica difusa?', variantes: ['como regreso al selector', 'que version elijo'], conceptos: ['versiones', 'matlab', 'web', 'selector'],
      breve: 'Estás eligiendo cómo usar Lógica difusa. «Usar en esta página» abre el simulador configurable en el navegador y conserva el acceso a tus trabajos web. «Usar MATLAB Online» abre instrucciones y descargas para trabajar con Fuzzy Logic Toolbox; requiere Internet y una cuenta habilitada. Allí puedes abrir ventilación o crear un FIS. «Elegir versión» vuelve al selector sin repetir el video; «Video» permite consultarlo de nuevo.',
      relacionadas: ['difusa.matlab.abrir', 'difusa.matlab.crear', 'difusa.matlab.problemas']
    },
    {
      id: 'difusa.matlab.abrir', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Cómo abro el ejemplo de ventilación en MATLAB Online?', variantes: ['como subo los archivos', 'como descargo el ejemplo'], conceptos: ['abrir', 'ventilacion', 'descargar', 'subir', 'drive'],
      breve: "Descarga el ZIP del ejemplo, extráelo y sube sus tres archivos a una misma carpeta de MATLAB Online. Abre abrir_ventilacion.m y pulsa Run. El .fis contiene el modelo; el .m lo localiza junto a sí mismo y lo abre. Si ya está en MATLAB Drive, entra a esa carpeta en MATLAB Online. Para el comando fuzzyLogicDesigner('ventilacion_aula.fis'), el modelo debe estar en la carpeta actual o en la ruta de búsqueda. La subida es manual y los resultados se consultan en MATLAB.",
      relacionadas: ['difusa.matlab.comandos', 'difusa.matlab.vistas', 'difusa.matlab.problemas']
    },
    {
      id: 'difusa.matlab.crear', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Cómo creo un sistema nuevo en MATLAB?', variantes: ['como configuro mi propio fis'], conceptos: ['crear', 'sistema', 'fis', 'variables', 'reglas'],
      breve: 'En Command Window, ejecuta fuzzyLogicDesigner. Abre la pantalla inicial, no un modelo ya configurado. Elige Custom FIS → Mamdani Type-1; indica nombre, entradas y salidas. Configura variables, rangos y funciones de pertenencia; revisa y elige los Then/consecuentes de las reglas. Generar combinaciones no decide sus salidas por ti. Al cambiar un dominio, ajusta sus funciones al nuevo rango. Guarda tu diseño como un .fis con nombre propio.',
      relacionadas: ['difusa.matlab.comandos', 'difusa.matlab.guardar', 'difusa.matlab.vistas']
    },
    {
      id: 'difusa.matlab.comandos', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Qué comandos uso en MATLAB?', variantes: ['comando para iniciar el disenador'], conceptos: ['comando', 'fuzzylogicdesigner', 'iniciar'],
      breve: "Para iniciar el diseñador: fuzzyLogicDesigner. Después elige cómo crear el FIS. Para abrir el ejemplo existente: fuzzyLogicDesigner('ventilacion_aula.fis'); el archivo debe estar en la carpeta actual o en la ruta de búsqueda. Los botones «Copiar comando» copian cada texto por separado; si falla el portapapeles, selecciónalo y cópialo manualmente. ver('fuzzy') consulta si MATLAB identifica la toolbox, sin garantizar por sí solo la ejecución.",
      relacionadas: ['difusa.matlab.crear', 'difusa.matlab.abrir', 'difusa.matlab.problemas']
    },
    {
      id: 'difusa.matlab.vistas', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Cómo uso Rule Inference y Control Surface?', variantes: ['como veo el procedimiento de matlab'], conceptos: ['rule', 'inference', 'control', 'surface', 'procedimiento'],
      breve: 'En Design → Simulation, Rule Inference sigue pertenencias, activaciones, recortes, agregación y centroide para una combinación. En Input values escribe números en el orden [Temperatura Humedad Ocupacion]. Control Surface explora cambios de salida: X Temperatura, Y Humedad, Z Ventilacion, con Ocupacion fija en 10. Reference Inputs usa [NaN NaN 10] únicamente para señalar los ejes variables; no es el vector de evaluación. Consulta allí los resultados de tus entradas.',
      relacionadas: ['difusa.matlab.abrir', 'difusa.matlab.resultados']
    },
    {
      id: 'difusa.matlab.guardar', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Cómo guardo y descargo mi FIS?', variantes: ['guardar sistema en matlab drive'], conceptos: ['guardar', 'descargar', 'fis', 'drive'],
      breve: 'En Fuzzy Logic Designer usa Design → Save, selecciona tu diseño y guárdalo como .fis con un nombre propio, por ejemplo mi_sistema.fis. Localízalo en MATLAB Drive, selecciónalo y utiliza Download para conservar una copia en tu equipo. Así mantienes el ejemplo original. Los trabajos del simulador web pertenecen a su propia biblioteca y se recuperan desde la versión web.',
      relacionadas: ['difusa.matlab.crear', 'difusa.acceso.versiones']
    },
    {
      id: 'difusa.matlab.problemas', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Qué necesito y qué reviso si falla MATLAB Online?', variantes: ['no se reconoce fuzzylogicdesigner', 'no encuentro el fis'], conceptos: ['toolbox', 'cuenta', 'archivo', 'ubicacion', 'error'],
      breve: "Necesitas Internet y una cuenta MathWorks con acceso a MATLAB y Fuzzy Logic Toolbox. Si no se reconoce fuzzyLogicDesigner, revisa su disponibilidad y el acceso a la toolbox; ver('fuzzy') solo consulta si MATLAB la identifica. Si no se encuentra el .fis, revisa nombre y ubicación; el lanzador lo busca junto al .m. El .fis se abre en el diseñador, no se ejecuta con Run. Para curvas concentradas, revisa dominios y parámetros; para salidas de reglas incorrectas, revisa Then/consecuentes.",
      relacionadas: ['difusa.matlab.abrir', 'difusa.matlab.crear', 'difusa.matlab.resultados']
    },
    {
      id: 'difusa.matlab.resultados', tema: 'difusa', modulos: ['difusa'],
      pregunta: '¿Puedes consultar o ejecutar mi resultado de MATLAB?', variantes: ['por que no veo resultados de matlab aqui'], conceptos: ['resultado', 'sesion', 'matlab', 'ejecutar'],
      breve: 'Esta página es un acceso con instrucciones y descargas; no tiene un cálculo web activo. Algo no ejecuta MATLAB, no consulta tu sesión privada de MathWorks ni carga automáticamente tus archivos. Consulta el resultado en MATLAB Online con Rule Inference o Control Surface. Si compartes tus entradas y el resultado observado, puedo orientarte sobre su lectura; no conozco un resultado que no hayas proporcionado.',
      relacionadas: ['difusa.matlab.vistas', 'difusa.matlab.abrir', 'difusa.acceso.versiones']
    }
  ]);
})();
