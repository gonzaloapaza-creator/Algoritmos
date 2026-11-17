(function (raiz) {
  'use strict';

  const maxEntradas = 6;
  const maxPatrones = 32;
  const maxEpocas = 100;
  const escala = 1_000_000n;

  // Entradas y razón tienen hasta seis decimales. Los pesos se guardan
  // con doce y los productos con dieciocho, sin redondear el umbral.
  function decimal(valor) {
    const texto = typeof valor === 'string' || typeof valor === 'number'
      ? String(valor).trim() : '';
    if (!/^[+-]?(?:\d{1,3}(?:[.,]\d{1,6})?|[.,]\d{1,6})$/.test(texto)) return null;
    const negativo = texto.startsWith('-');
    const [entero, fraccion = ''] = texto.replace(/^[+-]/, '').split(/[.,]/);
    const exacto = BigInt(entero || '0') * escala + BigInt(fraccion.padEnd(6, '0'));
    return negativo ? -exacto : exacto;
  }

  function formato(valor, cifras) {
    const signo = valor < 0n ? '−' : '';
    const digitos = String(valor < 0n ? -valor : valor).padStart(cifras + 1, '0');
    const fraccion = digitos.slice(-cifras).replace(/0+$/, '');
    return signo + digitos.slice(0, -cifras) + (fraccion ? ',' + fraccion : '');
  }

  function validar(datos) {
    const errores = [];
    const registrar = (campo, mensaje) => errores.push({ campo, mensaje });
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      registrar('', 'El ejercicio debe ser un objeto JSON.');
      return { errores };
    }
    const { entradas, activacion, patrones, pesos, aprenderUmbral } = datos;
    if (!Number.isInteger(entradas) || entradas < 1 || entradas > maxEntradas) {
      registrar('entradas', 'Elige de 1 a 6 entradas.');
      return { errores };
    }
    if (activacion !== 'hardlim' && activacion !== 'hardlims') {
      registrar('activacion', 'Elige Hardlim o Hardlims.');
    }
    if (typeof aprenderUmbral !== 'boolean') {
      registrar('aprenderUmbral', 'Indica si el umbral puede aprender.');
    }

    function leer(valor, campo, nombre, minimo = -100n * escala, maximo = 100n * escala) {
      const numero = decimal(valor);
      if (numero === null || numero < minimo || numero > maximo) {
        registrar(campo, nombre + ' debe ser un decimal en el rango indicado, con hasta seis decimales.');
      }
      return numero;
    }

    const umbral = leer(datos.umbral, 'umbral', 'El umbral');
    const razon = leer(datos.razon, 'razon', 'La razón de aprendizaje', 1n, escala);
    const textoEpocas = typeof datos.epocas === 'string' || typeof datos.epocas === 'number'
      ? String(datos.epocas).trim() : '';
    const epocas = Number(textoEpocas);
    if (!/^\d{1,3}$/.test(textoEpocas) || epocas < 1 || epocas > maxEpocas) {
      registrar('epocas', 'Escribe un límite entero de 1 a 100 épocas.');
    }
    const pesosIniciales = [];
    if (!Array.isArray(pesos) || pesos.length !== entradas) {
      registrar('', 'Debe haber un peso inicial por entrada.');
    } else {
      pesos.forEach((peso, i) => {
        pesosIniciales.push(leer(peso, 'peso-' + i, 'El peso w' + (i + 1)));
      });
    }
    const filas = [];
    if (!Array.isArray(patrones) || patrones.length < 1 || patrones.length > maxPatrones) {
      registrar('', 'Incluye entre 1 y 32 patrones de entrenamiento.');
    } else {
      patrones.forEach((patron, i) => {
        if (!patron || !Array.isArray(patron.x) || patron.x.length !== entradas) {
          registrar('', 'La fila ' + (i + 1) + ' debe tener ' + entradas + ' entradas.');
          return;
        }
        const x = patron.x.map((valor, j) => leer(valor, 'x-' + i + '-' + j,
          'La entrada x' + (j + 1) + ' de la fila ' + (i + 1)));
        const clases = activacion === 'hardlims' ? ['-1', '1'] : ['0', '1'];
        if ((typeof patron.y !== 'string' && typeof patron.y !== 'number') ||
            !clases.includes(String(patron.y))) {
          registrar('y-' + i, 'Selecciona una salida deseada válida para la fila ' + (i + 1) + '.');
        }
        filas.push({ x, y: Number(patron.y) });
      });
    }
    if (errores.length) return { errores };
    return {
      errores,
      modelo: {
        activacion, aprenderUmbral, epocas, razon, filas,
        pesos: pesosIniciales.map(peso => peso * escala),
        umbral: umbral * escala
      }
    };
  }

  function predecir(x, pesos, umbral, activacion) {
    const aportes = x.map((entrada, i) => entrada * pesos[i]);
    const suma = aportes.reduce((total, aporte) => total + aporte, 0n);
    const neta = suma - umbral * escala;
    const salida = neta >= 0n ? 1 : activacion === 'hardlims' ? -1 : 0;
    return { aportes, suma, neta, salida };
  }

  function entrenar(datos) {
    const { errores, modelo } = validar(datos);
    if (errores.length) return { errores };
    let pesos = modelo.pesos;
    let umbral = modelo.umbral;
    const historial = [];
    const erradas = [];
    const inicial = modelo.filas.map(({ x }) => predecir(x, pesos, umbral, modelo.activacion));
    for (let epoca = 1; epoca <= modelo.epocas; epoca += 1) {
      let erroresEpoca = 0;
      modelo.filas.forEach(({ x, y }, i) => {
        const prediccion = predecir(x, pesos, umbral, modelo.activacion);
        const error = prediccion.salida - y;
        if (error !== 0) erroresEpoca += 1;
        const delta = x.map(entrada => -modelo.razon * BigInt(error) * entrada);
        const deltaUmbral = modelo.aprenderUmbral ? modelo.razon * BigInt(error) * escala : 0n;
        const nuevos = pesos.map((peso, j) => peso + delta[j]);
        const nuevoUmbral = umbral + deltaUmbral;
        historial.push({
          epoca, fila: i, x, y, ...prediccion, error, delta,
          pesosAntes: pesos, pesosDespues: nuevos,
          umbralAntes: umbral, umbralDespues: nuevoUmbral, deltaUmbral
        });
        pesos = nuevos;
        umbral = nuevoUmbral;
      });
      erradas.push(erroresEpoca);
      if (erroresEpoca === 0) break;
    }
    const final = modelo.filas.map(({ x }) => predecir(x, pesos, umbral, modelo.activacion));
    return {
      errores, modelo, inicial, final, historial, erradas, pesos, umbral,
      convergio: erradas.at(-1) === 0
    };
  }

  const API = Object.freeze({
    maxEntradas, maxPatrones, maxEpocas, decimal, formato, validar, predecir, entrenar
  });
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.PerceptronCiudad = API;
})(globalThis);
