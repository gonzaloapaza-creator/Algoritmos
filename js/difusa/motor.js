/* Núcleo puro de «Nivel de ayuda recomendado» (Mamdani tipo 1).
 * Sin DOM, almacenamiento ni estado de la interfaz. Integra analíticamente la
 * envolvente lineal de consecuentes recortados. Las 1001 muestras se conservan
 * solo para la consulta manual, nunca para decidir masa o centroide.
 * API de script clásico: globalThis.DifusaMotor.
 */
(function (raiz) {
  'use strict';

  function congelar(objeto) {
    Object.keys(objeto).forEach(function (clave) {
      if (objeto[clave] && typeof objeto[clave] === 'object') congelar(objeto[clave]);
    });
    return Object.freeze(objeto);
  }

  var modelo = congelar({
    nombre: 'Nivel de ayuda recomendado',
    rangoEntrada: [0, 10],
    rangoSalida: [0, 100],
    numeroPuntos: 1001,
    entradas: {
      baja: { nombre: 'Baja', tipo: 'trapezoidal', parametros: [0, 0, 2.5, 5] },
      media: { nombre: 'Media', tipo: 'triangular', parametros: [2.5, 5, 7.5] },
      alta: { nombre: 'Alta', tipo: 'trapezoidal', parametros: [5, 7.5, 10, 10] }
    },
    salidas: {
      breve: { nombre: 'Breve', tipo: 'trapezoidal', parametros: [0, 0, 20, 40] },
      intermedia: { nombre: 'Intermedia', tipo: 'triangular', parametros: [20, 50, 80] },
      detallada: { nombre: 'Detallada', tipo: 'trapezoidal', parametros: [60, 80, 100, 100] }
    },
    reglas: [
      { id: 1, familiaridad: 'baja', dificultad: 'baja', salida: 'intermedia', peso: 1 },
      { id: 2, familiaridad: 'baja', dificultad: 'media', salida: 'detallada', peso: 1 },
      { id: 3, familiaridad: 'baja', dificultad: 'alta', salida: 'detallada', peso: 1 },
      { id: 4, familiaridad: 'media', dificultad: 'baja', salida: 'breve', peso: 1 },
      { id: 5, familiaridad: 'media', dificultad: 'media', salida: 'intermedia', peso: 1 },
      { id: 6, familiaridad: 'media', dificultad: 'alta', salida: 'detallada', peso: 1 },
      { id: 7, familiaridad: 'alta', dificultad: 'baja', salida: 'breve', peso: 1 },
      { id: 8, familiaridad: 'alta', dificultad: 'media', salida: 'breve', peso: 1 },
      { id: 9, familiaridad: 'alta', dificultad: 'alta', salida: 'intermedia', peso: 1 }
    ],
    operadores: { and: 'minimo', implicacion: 'minimo', agregacion: 'maximo', defuzzificacion: 'centroide' }
  });

  function validarFuncion(x, parametros, longitud) {
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      throw new TypeError('El valor de pertenencia debe ser un número finito.');
    }
    if (!Array.isArray(parametros) || parametros.length !== longitud || parametros.some(function (p, i) {
      return typeof p !== 'number' || !Number.isFinite(p) || (i > 0 && p < parametros[i - 1]);
    })) {
      throw new TypeError('Los parámetros de pertenencia deben ser ' + longitud + ' números finitos en orden no decreciente.');
    }
  }

  function triangular(x, parametros) {
    validarFuncion(x, parametros, 3);
    var a = parametros[0], b = parametros[1], c = parametros[2];
    if (x < a || x > c) return 0;
    // El pico también cubre a=b, b=c y a=b=c sin dividir entre cero.
    if (x === b) return 1;
    return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
  }

  function trapezoidal(x, parametros) {
    validarFuncion(x, parametros, 4);
    var a = parametros[0], b = parametros[1], c = parametros[2], d = parametros[3];
    if (x < a || x > d) return 0;
    // Meseta inclusiva: los hombros tienen pertenencia 1 en el límite.
    if (x >= b && x <= c) return 1;
    return x < b ? (x - a) / (b - a) : (d - x) / (d - c);
  }

  function pertenencias(x, categorias) {
    var resultado = {};
    Object.keys(categorias).forEach(function (clave) {
      var categoria = categorias[clave];
      resultado[clave] = categoria.tipo === 'triangular' ?
        triangular(x, categoria.parametros) : trapezoidal(x, categoria.parametros);
    });
    return resultado;
  }

  function pertenenciasEntrada(x) { return pertenencias(x, modelo.entradas); }
  function pertenenciasSalida(y) { return pertenencias(y, modelo.salidas); }

  function validarEntrada(valor) {
    if (typeof valor === 'string') {
      valor = valor.trim();
      if (valor === '') return { valida: false, codigo: 'vacio', error: 'Introduce un valor entre 0 y 10; el campo está vacío.' };
      // Solo notación decimal: Number(''), hexadecimales o booleanos no son entradas válidas.
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(valor)) {
        return { valida: false, codigo: 'numero', error: 'Introduce un número finito entre 0 y 10.' };
      }
      valor = Number(valor);
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
      return { valida: false, codigo: 'numero', error: 'Introduce un número finito entre 0 y 10.' };
    }
    if (valor < 0 || valor > 10) {
      return { valida: false, codigo: 'rango', error: 'El valor debe estar entre 0 y 10, incluidos ambos extremos.' };
    }
    return { valida: true, valor: valor };
  }

  function entradaExigida(valor, nombre) {
    var validacion = validarEntrada(valor);
    if (!validacion.valida) {
      var TipoError = validacion.codigo === 'rango' ? RangeError : TypeError;
      throw new TipoError(nombre + ': ' + validacion.error);
    }
    return validacion.valor;
  }

  function centroide(puntos, agregada) {
    if (!Array.isArray(puntos) || !Array.isArray(agregada) || puntos.length !== agregada.length || puntos.length === 0) {
      throw new TypeError('El centroide requiere dos arreglos no vacíos de igual longitud.');
    }
    var numerador = 0, denominador = 0;
    puntos.forEach(function (punto, i) {
      var grado = agregada[i];
      if (typeof punto !== 'number' || !Number.isFinite(punto) || typeof grado !== 'number' || !Number.isFinite(grado) || grado < 0 || grado > 1) {
        throw new TypeError('El centroide requiere puntos finitos y pertenencias entre 0 y 1.');
      }
      numerador += punto * grado;
      denominador += grado;
    });
    if (denominador === 0) {
      return { estado: 'sin-reglas-activas', valor: null, numerador: 0, denominador: 0 };
    }
    return { estado: 'ok', valor: numerador / denominador, numerador: numerador, denominador: denominador };
  }

  /** Segmentos exactos de min(activación, función triangular/trapezoidal).
   * Los segmentos de ancho cero no tienen área. Los saltos de hombros interiores
   * conservan sus límites laterales, sin crear rampas artificiales hasta el cero.
   */
  function recortarTramos(conjunto, activacion) {
    if (!(activacion > 0)) return [];
    var p = conjunto.parametros;
    var a = p[0], b = p[1], c = conjunto.tipo === 'triangular' ? p[1] : p[2], d = p[p.length - 1];
    // Cerca de 1, interpolar desde la meseta conserva sus extremos incluso si
    // el dominio es muy ancho respecto de la distancia hasta el pico.
    var izquierda = activacion > 0.5 ? b - (1 - activacion) * (b - a) : a + activacion * (b - a);
    var derecha = activacion > 0.5 ? c + (1 - activacion) * (d - c) : d - activacion * (d - c);
    return [
      { x0: a, x1: izquierda, y0: 0, y1: activacion },
      { x0: izquierda, x1: derecha, y0: activacion, y1: activacion },
      { x0: derecha, x1: d, y0: activacion, y1: 0 }
    ].filter(function (tramo) { return tramo.x1 > tramo.x0; });
  }

  function valorTramo(tramo, x) {
    var fraccion = (x - tramo.x0) / (tramo.x1 - tramo.x0);
    return tramo.y0 * (1 - fraccion) + tramo.y1 * fraccion;
  }

  /** Máximo de segmentos lineales: incorpora nudos, recortes e intersecciones.
   * Como max(min(a,f),min(b,f))=min(max(a,b),f), el llamador agrupa las reglas
   * por consecuente: como máximo hay cinco funciones en esta envolvente.
   */
  function integrarEnvolvente(consecuentes, minimo, maximo) {
    if (!Number.isFinite(minimo) || !Number.isFinite(maximo) || minimo >= maximo || !Array.isArray(consecuentes)) throw new TypeError('Dominio de integración inválido.');
    var activas = consecuentes.filter(function (c) { return c.activacion > 0; });
    var curvas = activas.map(function (c) { return recortarTramos(c.conjunto, c.activacion); });
    var soportePositivo = activas.some(function (c) {
      var p = c.conjunto.parametros;
      return Math.min(maximo, p[p.length - 1]) > Math.max(minimo, p[0]);
    });
    var nudos = [minimo, maximo];
    curvas.forEach(function (curva) { curva.forEach(function (t) { nudos.push(Math.max(minimo, Math.min(maximo, t.x0)), Math.max(minimo, Math.min(maximo, t.x1))); }); });
    nudos = Array.from(new Set(nudos)).sort(function (a, b) { return a - b; });
    var tramos = [];
    for (var i = 0; i < nudos.length - 1; i++) {
      var x0 = nudos[i], x1 = nudos[i + 1];
      var lineas = curvas.map(function (curva) {
        // Comparar intervalos, no un punto medio que podría redondearse al borde.
        var tramo = curva.find(function (t) { return t.x0 <= x0 && t.x1 >= x1; });
        return tramo ? [valorTramo(tramo, x0), valorTramo(tramo, x1)] : [0, 0];
      });
      lineas.push([0, 0]);
      var cortes = [0, 1];
      for (var a = 0; a < lineas.length; a++) for (var b = a + 1; b < lineas.length; b++) {
        var d0 = lineas[a][0] - lineas[b][0], d1 = lineas[a][1] - lineas[b][1];
        if ((d0 < 0 && d1 > 0) || (d0 > 0 && d1 < 0)) cortes.push(d0 / (d0 - d1));
      }
      cortes = Array.from(new Set(cortes)).sort(function (a, b) { return a - b; });
      for (var k = 0; k < cortes.length - 1; k++) {
        var t0 = cortes[k], t1 = cortes[k + 1], medio = t0 + (t1 - t0) / 2;
        var ganadora = lineas[0], altura = -1;
        lineas.forEach(function (linea) {
          var y = linea[0] * (1 - medio) + linea[1] * medio;
          if (y > altura) { ganadora = linea; altura = y; }
        });
        var desde = x0 + (x1 - x0) * t0, hasta = x0 + (x1 - x0) * t1;
        if (hasta > desde) tramos.push({ x0: desde, x1: hasta,
          y0: ganadora[0] * (1 - t0) + ganadora[1] * t0,
          y1: ganadora[0] * (1 - t1) + ganadora[1] * t1 });
      }
    }
    // Integrales por trapecios exactos y primer momento de una recta. El momento
    // se acumula respecto del centro del dominio para reducir cancelación.
    var positivos = tramos.filter(function (t) { return t.y0 > 0 || t.y1 > 0; });
    var soporteMin = positivos.length ? positivos[0].x0 : minimo;
    var soporteMax = positivos.length ? positivos[positivos.length - 1].x1 : maximo;
    var referencia = soporteMin + (soporteMax - soporteMin) / 2;
    var area = 0, momento = 0, correccionArea = 0, correccionMomento = 0;
    tramos.forEach(function (t) {
      var ancho = t.x1 - t.x0;
      var masa = ancho * (t.y0 / 2 + t.y1 / 2);
      var primerMomento = masa * (t.x0 - referencia) + ancho * ancho * (t.y0 / 6 + t.y1 / 3);
      var aumento = masa - correccionArea, siguiente = area + aumento;
      correccionArea = (siguiente - area) - aumento; area = siguiente;
      aumento = primerMomento - correccionMomento; siguiente = momento + aumento;
      correccionMomento = (siguiente - momento) - aumento; momento = siguiente;
    });
    var calculo = { estado: 'ok', valor: null, numerador: referencia * area + momento, denominador: area,
      metodo: 'integracion-continua-por-tramos', mensaje: '', tramos: tramos.length };
    if (!activas.length) {
      calculo.estado = 'sin-reglas-activas'; calculo.mensaje = 'Sin reglas activas para estas entradas: ninguna activación final es positiva.';
    } else if (!soportePositivo) {
      calculo.estado = 'activacion-sin-masa'; calculo.mensaje = 'Hay activación positiva, pero los consecuentes no tienen masa de salida en el dominio.';
    } else if (!(area > 0) || !Number.isFinite(area) || !Number.isFinite(momento) || !Number.isFinite(calculo.numerador)) {
      calculo.estado = 'fallo-numerico'; calculo.mensaje = 'Limitación numérica al integrar una salida activa: no se pudo representar su masa o momento en precisión doble.';
    } else {
      var valor = referencia + momento / area;
      if (!Number.isFinite(valor) || valor < minimo || valor > maximo) {
        calculo.estado = 'fallo-numerico'; calculo.mensaje = 'Limitación numérica: el centroide calculado no es finito o queda fuera del dominio.';
      } else {
        calculo.valor = valor;
        calculo.mensaje = 'Centroide continuo válido, integrado por tramos lineales sin redondear el cálculo.';
      }
    }
    return { centroide: calculo, tramos: tramos };
  }

  function integrarReglas(conjuntos, reglas, claveSalida, minimo, maximo) {
    return integrarEnvolvente(conjuntos.map(function (conjunto) {
      var activacion = 0;
      reglas.forEach(function (regla) { if (regla[claveSalida] === conjunto.id) activacion = Math.max(activacion, regla.activacion); });
      return { conjunto: conjunto, activacion: activacion };
    }), minimo, maximo);
  }

  function evaluar(familiaridad, dificultad) {
    var entradas = {
      familiaridad: entradaExigida(familiaridad, 'Familiaridad'),
      dificultad: entradaExigida(dificultad, 'Dificultad')
    };
    var grados = {
      familiaridad: pertenenciasEntrada(entradas.familiaridad),
      dificultad: pertenenciasEntrada(entradas.dificultad)
    };
    var puntos = Array.from({ length: modelo.numeroPuntos }, function (_, i) { return i / 10; });
    var originales = puntos.map(pertenenciasSalida);
    var reglas = modelo.reglas.map(function (regla) {
      var gradoFamiliaridad = grados.familiaridad[regla.familiaridad];
      var gradoDificultad = grados.dificultad[regla.dificultad];
      var activacion = Math.min(gradoFamiliaridad, gradoDificultad);
      return {
        id: regla.id, familiaridad: regla.familiaridad, dificultad: regla.dificultad,
        salida: regla.salida, peso: regla.peso,
        gradoFamiliaridad: gradoFamiliaridad, gradoDificultad: gradoDificultad, activacion: activacion,
        recortada: originales.map(function (salida) { return Math.min(activacion, salida[regla.salida]); })
      };
    });
    var agregada = puntos.map(function (_, i) {
      return Math.max.apply(null, reglas.map(function (regla) { return regla.recortada[i]; }));
    });
    var conjuntosSalida = Object.keys(modelo.salidas).map(function (id) { return Object.assign({ id: id }, modelo.salidas[id]); });
    reglas.forEach(function (regla) { regla.tramos = recortarTramos(modelo.salidas[regla.salida], regla.activacion); });
    var integral = integrarReglas(conjuntosSalida, reglas, 'salida', 0, 100);
    var calculoCentroide = integral.centroide;
    var gradosResultado = calculoCentroide.valor === null ? null : pertenenciasSalida(calculoCentroide.valor);
    var etiquetas = [];
    if (gradosResultado) {
      var mayor = Math.max.apply(null, Object.keys(gradosResultado).map(function (clave) { return gradosResultado[clave]; }));
      // La tolerancia solo resuelve empates numéricos de interpretación; nunca altera el centroide.
      etiquetas = Object.keys(gradosResultado).filter(function (clave) { return Math.abs(gradosResultado[clave] - mayor) <= 1e-12; });
    }
    var pasos = [
      { tipo: 'datos', titulo: 'Datos introducidos', entradas: entradas,
        descripcion: 'Familiaridad = ' + entradas.familiaridad + '; dificultad = ' + entradas.dificultad + '.' },
      { tipo: 'fuzzificacion', titulo: 'Pertenencias de las entradas', pertenencias: grados,
        descripcion: 'Se evalúan las tres funciones de pertenencia en cada entrada.' },
      { tipo: 'reglas', titulo: 'Activación de las nueve reglas', reglas: reglas.map(function (regla) {
        return { id: regla.id, gradoFamiliaridad: regla.gradoFamiliaridad, gradoDificultad: regla.gradoDificultad, activacion: regla.activacion };
      }), descripcion: 'AND toma el mínimo de los grados de ambos antecedentes.' },
      { tipo: 'implicacion', titulo: 'Recorte de cada consecuente', reglas: reglas.map(function (regla) {
        return { id: regla.id, salida: regla.salida, activacion: regla.activacion, recortada: regla.recortada };
      }), descripcion: 'Cada consecuente se recorta con el mínimo entre su pertenencia y la activación de su regla.' },
      { tipo: 'agregacion', titulo: 'Agregación por máximo', puntos: puntos, agregada: agregada,
        tramos: integral.tramos, descripcion: 'Se integra la envolvente máxima por tramos, incluidos los nudos, recortes e intersecciones. Las 1001 muestras son solo puntos de consulta.' },
      { tipo: 'centroide', titulo: 'Centroide continuo por tramos', estado: calculoCentroide.estado,
        valor: calculoCentroide.valor, numerador: calculoCentroide.numerador, denominador: calculoCentroide.denominador,
        formula: 'integral(y * mu(y)) / integral(mu(y))',
        descripcion: calculoCentroide.valor === null ? calculoCentroide.mensaje :
          calculoCentroide.numerador + ' / ' + calculoCentroide.denominador + ' = ' + calculoCentroide.valor + '.' },
      { tipo: 'interpretacion', titulo: 'Interpretación adicional', valor: calculoCentroide.valor,
        pertenenciasResultado: gradosResultado, etiquetas: etiquetas,
        descripcion: 'El número es el resultado principal; la etiqueta corresponde a la mayor pertenencia de salida, conservando los empates.' }
    ];
    return { entradas: entradas, pertenencias: grados, reglas: reglas, puntos: puntos, agregada: agregada,
      centroide: calculoCentroide, tramos: integral.tramos, etiquetas: etiquetas, pertenenciasResultado: gradosResultado, pasos: pasos };
  }

  function exportarReferencias() {
    var casos = [[0, 0], [0, 10], [10, 0], [10, 10], [5, 5], [2, 8], [8, 2], [3.5, 6.5], [6.2, 4.1]];
    return {
      modelo: modelo.nombre, version: 1, metodo: 'Mamdani tipo 1',
      muestreo: { minimo: 0, maximo: 100, puntos: 1001, paso: 0.1, uso: 'consulta auxiliar; no determina el centroide' },
      integracion: { metodo: 'continua-por-tramos-lineales', formula: 'integral(y * mu(y)) / integral(mu(y))' },
      // Tolerancia propuesta para contrastar integrales; MATLAB sigue pendiente.
      tolerancia: 1e-8,
      casos: casos.map(function (entradas) {
        var resultado = evaluar(entradas[0], entradas[1]);
        return { familiaridad: entradas[0], dificultad: entradas[1], resultado: resultado.centroide.valor, etiquetas: resultado.etiquetas };
      })
    };
  }

  function obtenerModeloAPI() {
    if (raiz.DifusaModelo) return raiz.DifusaModelo;
    if (typeof require === 'function') return require('./modelo.js');
    throw new Error('Carga js/difusa/modelo.js para evaluar un sistema configurable.');
  }

  function pertenenciasVariable(variable, valor) {
    var grados = {};
    variable.conjuntos.forEach(function (conjunto) {
      grados[conjunto.id] = conjunto.tipo === 'triangular' ? triangular(valor, conjunto.parametros) : trapezoidal(valor, conjunto.parametros);
    });
    return grados;
  }

  /** Mamdani configurable: AND=min, OR=max, activación=antecedente×peso,
   * implicación=min, agregación=max. «No importa» se excluye de ambos conectores.
   * El modelo se valida antes de acceder a referencias importadas.
   */
  function evaluarSistema(sistema, valores) {
    var modeloAPI = obtenerModeloAPI();
    var validacion = modeloAPI.validar(sistema, { permitirBorradores: true });
    if (!validacion.valido || !validacion.listo) {
      var problema = validacion.errores[0] || validacion.pendientes.filter(function (p) { return p.activa; })[0];
      var error = new TypeError('El sistema no está listo para evaluar. ' + (problema ? problema.ruta + ': ' + problema.mensaje : 'Revisa la configuración.'));
      error.validacion = validacion;
      throw error;
    }
    if (!valores || typeof valores !== 'object' || Array.isArray(valores)) throw new TypeError('Introduce un valor para cada entrada.');
    var entradas = {}, grados = {};
    sistema.entradas.forEach(function (variable) {
      var lectura = modeloAPI.leerNumero(valores[variable.id]);
      if (!lectura.valido) throw new TypeError(variable.nombre + ': ' + lectura.error);
      if (lectura.valor < variable.min || lectura.valor > variable.max) throw new RangeError(variable.nombre + ': el valor debe estar entre ' + variable.min + ' y ' + variable.max + '.');
      entradas[variable.id] = lectura.valor;
      grados[variable.id] = pertenenciasVariable(variable, lectura.valor);
    });
    var minimo = sistema.salida.min, maximo = sistema.salida.max;
    var puntos = Array.from({ length: 1001 }, function (_, i) { return i === 1000 ? maximo : minimo + (maximo - minimo) * i / 1000; });
    var originales = {};
    sistema.salida.conjuntos.forEach(function (conjunto) {
      originales[conjunto.id] = puntos.map(function (punto) {
        return conjunto.tipo === 'triangular' ? triangular(punto, conjunto.parametros) : trapezoidal(punto, conjunto.parametros);
      });
    });
    var reglas = sistema.reglas.map(function (regla) {
      var antecedentes = sistema.entradas.map(function (variable) {
        var conjuntoId = regla.antecedentes[variable.id];
        return { variableId: variable.id, conjuntoId: conjuntoId, grado: conjuntoId === null ? null : grados[variable.id][conjuntoId] };
      });
      var usados = antecedentes.filter(function (a) { return a.conjuntoId !== null; }).map(function (a) { return a.grado; });
      var activacionAntecedente = regla.conector === 'AND' ? Math.min.apply(null, usados) : Math.max.apply(null, usados);
      var activacion = regla.activa ? activacionAntecedente * regla.peso : 0;
      var recortada = regla.consecuente === null ? puntos.map(function () { return 0; }) : originales[regla.consecuente].map(function (grado) { return Math.min(activacion, grado); });
      return { id: regla.id, antecedentes: antecedentes, conector: regla.conector, activacionAntecedente: activacionAntecedente,
        peso: regla.peso, habilitada: regla.activa, activa: regla.activa, activacion: activacion, consecuente: regla.consecuente, recortada: recortada };
    });
    var agregada = puntos.map(function (_, i) {
      var mayor = 0;
      reglas.forEach(function (regla) { if (regla.recortada[i] > mayor) mayor = regla.recortada[i]; });
      return mayor;
    });
    reglas.forEach(function (regla) {
      var conjunto = sistema.salida.conjuntos.find(function (c) { return c.id === regla.consecuente; });
      regla.tramos = conjunto ? recortarTramos(conjunto, regla.activacion) : [];
    });
    var integral = integrarReglas(sistema.salida.conjuntos, reglas, 'consecuente', minimo, maximo);
    var calculo = integral.centroide;
    var gradosResultado = calculo.valor === null ? null : pertenenciasVariable(sistema.salida, calculo.valor);
    var etiquetas = [], sinEtiqueta = false;
    if (gradosResultado) {
      var mayor = Math.max.apply(null, Object.keys(gradosResultado).map(function (id) { return gradosResultado[id]; }));
      sinEtiqueta = mayor === 0;
      if (!sinEtiqueta) etiquetas = sistema.salida.conjuntos.filter(function (conjunto) {
        return Math.abs(gradosResultado[conjunto.id] - mayor) <= mayor * 1e-12;
      }).map(function (conjunto) { return conjunto.id; });
    }
    var pasos = [
      { tipo: 'datos', titulo: 'Datos introducidos', entradas: entradas,
        descripcion: sistema.entradas.map(function (v) { return v.nombre + ' = ' + entradas[v.id] + (v.unidad ? ' ' + v.unidad : ''); }).join('; ') + '.' },
      { tipo: 'fuzzificacion', titulo: 'Pertenencias de las entradas', pertenencias: grados,
        descripcion: 'Se evalúan los conjuntos configurados de cada variable en sus valores de entrada.' },
      { tipo: 'reglas', titulo: 'Antecedentes, conector y peso', reglas: reglas.map(function (r) {
        return { id: r.id, antecedentes: r.antecedentes, conector: r.conector, activacionAntecedente: r.activacionAntecedente,
          peso: r.peso, habilitada: r.habilitada, activacion: r.activacion };
      }), descripcion: 'AND toma el mínimo y OR el máximo de los antecedentes utilizados. Se multiplica por el peso; las reglas desactivadas aportan 0.' },
      { tipo: 'implicacion', titulo: 'Recorte de cada consecuente', reglas: reglas.map(function (r) {
        return { id: r.id, consecuente: r.consecuente, activacion: r.activacion, recortada: r.recortada };
      }), descripcion: 'En cada muestra se toma el mínimo de la activación final y la pertenencia del consecuente.' },
      { tipo: 'agregacion', titulo: 'Agregación por máximo', puntos: puntos, agregada: agregada,
        tramos: integral.tramos, descripcion: 'Máximo de los ' + reglas.length + ' recortes como envolvente lineal entre ' + minimo + ' y ' + maximo + ', con nudos e intersecciones. Las 1001 muestras se usan solo para consulta.' },
      { tipo: 'centroide', titulo: 'Centroide continuo por tramos', estado: calculo.estado, valor: calculo.valor,
        numerador: calculo.numerador, denominador: calculo.denominador, formula: 'integral(y * mu(y)) / integral(mu(y))',
        descripcion: calculo.valor === null ? calculo.mensaje : calculo.numerador + ' / ' + calculo.denominador + ' = ' + calculo.valor + '.' },
      { tipo: 'interpretacion', titulo: 'Interpretación adicional', valor: calculo.valor, pertenenciasResultado: gradosResultado, etiquetas: etiquetas, sinEtiqueta: sinEtiqueta,
        descripcion: calculo.valor === null ? 'No hay resultado numérico que interpretar.' : sinEtiqueta ? 'Ningún conjunto contiene el centroide: se conserva el número sin inventar una etiqueta.' : 'La etiqueta adicional corresponde a la mayor pertenencia del centroide; se conservan los empates.' }
    ];
    return { entradas: entradas, pertenencias: grados, reglas: reglas, puntos: puntos, agregada: agregada,
      centroide: calculo, tramos: integral.tramos, pertenenciasResultado: gradosResultado, etiquetas: etiquetas, sinEtiqueta: sinEtiqueta,
      pasos: pasos, firmaModelo: modeloAPI.firmaMatematica(sistema) };
  }

  var api = Object.freeze({ modelo: modelo, triangular: triangular, trapezoidal: trapezoidal,
    pertenenciasEntrada: pertenenciasEntrada, pertenenciasSalida: pertenenciasSalida,
    validarEntrada: validarEntrada, evaluar: evaluar, centroide: centroide, exportarReferencias: exportarReferencias,
    evaluarSistema: evaluarSistema, pertenenciasVariable: pertenenciasVariable,
    integrarEnvolvente: integrarEnvolvente, recortarTramos: recortarTramos });
  raiz.DifusaMotor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
