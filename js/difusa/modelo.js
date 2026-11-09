/* Modelo configurable y validación pura. Ningún dato importado se ejecuta. */
(function (raiz) {
  'use strict';
  var LIMITE = 1000000;
  function objeto(valor) { return valor !== null && typeof valor === 'object' && !Array.isArray(valor); }
  function numero(valor) { return typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= LIMITE; }
  function idValido(valor) {
    return typeof valor === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(valor) &&
      ['constructor', 'prototype', '__proto__'].indexOf(valor) === -1;
  }
  function nombreValido(valor) { return typeof valor === 'string' && valor.trim().length >= 1 && valor.trim().length <= 40; }
  function normalizarNombre(valor) { return valor.trim().toLocaleLowerCase('es'); }
  function leerNumero(valor) {
    if (typeof valor === 'string') {
      valor = valor.trim();
      if (!valor) return { valido: false, valor: null, error: 'Introduce un número; el campo está vacío.' };
      if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(valor)) {
        return { valido: false, valor: null, error: 'Usa un número completo con punto o coma decimal, sin separadores de miles.' };
      }
      valor = Number(valor.replace(',', '.'));
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return { valido: false, valor: null, error: 'Introduce un número finito.' };
    return { valido: true, valor: valor, error: '' };
  }
  function grado(x, conjunto) {
    var p = conjunto.parametros;
    if (conjunto.tipo === 'triangular') {
      if (x < p[0] || x > p[2]) return 0;
      if (x === p[1]) return 1;
      return x < p[1] ? (x - p[0]) / (p[1] - p[0]) : (p[2] - x) / (p[2] - p[1]);
    }
    if (x < p[0] || x > p[3]) return 0;
    if (x >= p[1] && x <= p[2]) return 1;
    return x < p[1] ? (x - p[0]) / (p[1] - p[0]) : (p[3] - x) / (p[3] - p[2]);
  }
  function revisarVariable(variable, ruta, errores) {
    function error(campo, mensaje) { errores.push({ ruta: ruta + (campo ? '.' + campo : ''), mensaje: mensaje }); }
    if (!objeto(variable)) { error('', 'La variable debe ser un objeto.'); return; }
    if (!idValido(variable.id)) error('id', 'Usa un ID estable de 1 a 64 caracteres: letra inicial, letras, números, guion o guion bajo.');
    if (!nombreValido(variable.nombre)) error('nombre', 'El nombre debe tener entre 1 y 40 caracteres tras quitar espacios exteriores.');
    if (variable.unidad !== undefined && (typeof variable.unidad !== 'string' || variable.unidad.length > 40)) error('unidad', 'La unidad opcional debe ser texto de hasta 40 caracteres.');
    if (!numero(variable.min)) error('min', 'El mínimo debe ser un número finito entre −1000000 y 1000000.');
    if (!numero(variable.max)) error('max', 'El máximo debe ser un número finito entre −1000000 y 1000000.');
    if (numero(variable.min) && numero(variable.max) && variable.min >= variable.max) error('max', 'El mínimo debe ser estrictamente menor que el máximo.');
    if (!Array.isArray(variable.conjuntos) || variable.conjuntos.length < 2 || variable.conjuntos.length > 5) {
      error('conjuntos', 'Cada variable necesita entre 2 y 5 conjuntos.'); return;
    }
    var ids = new Set(), nombres = new Set();
    variable.conjuntos.forEach(function (conjunto, i) {
      var base = 'conjuntos.' + i;
      if (!objeto(conjunto)) { error(base, 'El conjunto debe ser un objeto.'); return; }
      if (!idValido(conjunto.id)) error(base + '.id', 'El conjunto necesita un ID válido y estable.');
      else if (ids.has(conjunto.id)) error(base + '.id', 'El ID del conjunto está repetido dentro de la variable.');
      else ids.add(conjunto.id);
      if (!nombreValido(conjunto.nombre)) error(base + '.nombre', 'El nombre debe tener entre 1 y 40 caracteres.');
      else if (nombres.has(normalizarNombre(conjunto.nombre))) error(base + '.nombre', 'Los nombres de conjuntos deben ser únicos dentro de la variable.');
      else nombres.add(normalizarNombre(conjunto.nombre));
      var cantidad = conjunto.tipo === 'triangular' ? 3 : conjunto.tipo === 'trapezoidal' ? 4 : 0;
      if (!cantidad) { error(base + '.tipo', 'Selecciona triangular o trapezoidal.'); return; }
      if (!Array.isArray(conjunto.parametros) || conjunto.parametros.length !== cantidad) {
        error(base + '.parametros', 'Esta función necesita exactamente ' + cantidad + ' parámetros.'); return;
      }
      var validos = true;
      for (var j = 0; j < cantidad; j++) {
        var parametro = conjunto.parametros[j];
        if (!numero(parametro)) { error(base + '.parametros.' + j, 'El parámetro debe ser un número finito entre −1000000 y 1000000.'); validos = false; }
        else if (numero(variable.min) && numero(variable.max) && (parametro < variable.min || parametro > variable.max)) {
          error(base + '.parametros.' + j, 'El parámetro queda fuera del dominio. Reajusta las curvas explícitamente o cancela el cambio.'); validos = false;
        }
        if (j > 0 && numero(parametro) && numero(conjunto.parametros[j - 1]) && parametro < conjunto.parametros[j - 1]) {
          error(base + '.parametros.' + j, 'Los parámetros deben estar en orden no decreciente.'); validos = false;
        }
      }
      if (validos && conjunto.parametros[0] >= conjunto.parametros[cantidad - 1]) error(base + '.parametros', 'La función necesita soporte útil: el primer parámetro debe ser menor que el último.');
    });
  }

  function cobertura(variable) {
    var errores = [];
    revisarVariable(variable, 'variable', errores);
    if (errores.length) return { valida: false, completa: false, huecos: [], intervalos: [], puntos: [], error: errores[0].mensaje };
    var puntos = [variable.min, variable.max];
    variable.conjuntos.forEach(function (c) { puntos = puntos.concat(c.parametros); });
    puntos = Array.from(new Set(puntos)).sort(function (a, b) { return a - b; });
    function vacio(x) { return variable.conjuntos.every(function (c) { return grado(x, c) === 0; }); }
    var piezas = [];
    puntos.forEach(function (punto, i) {
      if (vacio(punto)) piezas.push({ min: punto, max: punto, incluyeMin: true, incluyeMax: true });
      if (i < puntos.length - 1 && vacio(punto + (puntos[i + 1] - punto) / 2)) {
        piezas.push({ min: punto, max: puntos[i + 1], incluyeMin: vacio(punto), incluyeMax: vacio(puntos[i + 1]) });
      }
    });
    piezas.sort(function (a, b) { return a.min - b.min || a.max - b.max; });
    var huecos = [];
    piezas.forEach(function (pieza) {
      var anterior = huecos[huecos.length - 1];
      if (anterior && (pieza.min < anterior.max || (pieza.min === anterior.max && (anterior.incluyeMax || pieza.incluyeMin)))) {
        if (pieza.min === anterior.min) anterior.incluyeMin = anterior.incluyeMin || pieza.incluyeMin;
        if (pieza.max > anterior.max) { anterior.max = pieza.max; anterior.incluyeMax = pieza.incluyeMax; }
        else if (pieza.max === anterior.max) anterior.incluyeMax = anterior.incluyeMax || pieza.incluyeMax;
      } else huecos.push({ min: pieza.min, max: pieza.max, incluyeMin: pieza.incluyeMin, incluyeMax: pieza.incluyeMax });
    });
    return { valida: true, completa: huecos.length === 0, huecos: huecos, intervalos: huecos, puntos: puntos };
  }

  function validar(modelo, opciones) {
    opciones = opciones || {};
    var errores = [], avisos = [], pendientes = [];
    function error(ruta, mensaje) { errores.push({ ruta: ruta, mensaje: mensaje }); }
    if (!objeto(modelo)) return { valido: false, errores: [{ ruta: 'modelo', mensaje: 'El modelo debe ser un objeto JSON.' }], avisos: [], listo: false, pendientes: [] };
    if (modelo.version !== 2) error('version', 'Se requiere el formato de modelo versión 2.');
    if (!idValido(modelo.id)) error('id', 'El modelo necesita un ID válido y estable.');
    if (!nombreValido(modelo.nombre)) error('nombre', 'El nombre del sistema debe tener entre 1 y 40 caracteres.');
    if (modelo.descripcion !== undefined && (typeof modelo.descripcion !== 'string' || modelo.descripcion.length > 4000)) error('descripcion', 'La descripción debe ser texto de hasta 4000 caracteres.');
    var entradas = Array.isArray(modelo.entradas) ? modelo.entradas : [];
    if (!Array.isArray(modelo.entradas) || entradas.length < 1 || entradas.length > 3) error('entradas', 'Configura entre 1 y 3 variables de entrada.');
    // Las dimensiones inválidas no se recorren: los archivos importados también tienen límites.
    var variables = entradas.length <= 3 ? entradas.slice() : [];
    variables.forEach(function (v, i) { revisarVariable(v, 'entradas.' + i, errores); });
    revisarVariable(modelo.salida, 'salida', errores);
    if (objeto(modelo.salida)) variables.push(modelo.salida);
    var idsVariables = new Set(), nombresVariables = new Set();
    variables.forEach(function (v, i) {
      if (!objeto(v)) return;
      var ruta = i < entradas.length ? 'entradas.' + i : 'salida';
      if (idValido(v.id)) {
        if (idsVariables.has(v.id)) error(ruta + '.id', 'Los IDs de variables deben ser únicos.');
        idsVariables.add(v.id);
      }
      if (nombreValido(v.nombre)) {
        var nombre = normalizarNombre(v.nombre);
        if (nombresVariables.has(nombre)) error(ruta + '.nombre', 'Los nombres de variables deben ser únicos.');
        nombresVariables.add(nombre);
      }
    });
    var entradasPorId = new Map();
    entradas.slice(0, 3).forEach(function (v) { if (objeto(v) && idValido(v.id)) entradasPorId.set(v.id, v); });
    var conjuntosSalida = objeto(modelo.salida) && Array.isArray(modelo.salida.conjuntos) ? modelo.salida.conjuntos.slice(0, 5) : [];
    var idsSalida = new Set(conjuntosSalida.filter(objeto).map(function (c) { return c.id; }));
    if (!Array.isArray(modelo.reglas) || modelo.reglas.length < 1 || modelo.reglas.length > 125) error('reglas', 'Configura entre 1 y 125 reglas.');
    var reglas = Array.isArray(modelo.reglas) && modelo.reglas.length <= 125 ? modelo.reglas : [];
    var idsReglas = new Set(), firmasExactas = new Map(), firmasAntecedentes = new Map();
    reglas.forEach(function (regla, i) {
      var ruta = 'reglas.' + i;
      if (!objeto(regla)) { error(ruta, 'La regla debe ser un objeto.'); return; }
      if (!idValido(regla.id)) error(ruta + '.id', 'La regla necesita un ID válido y estable.');
      else if (idsReglas.has(regla.id)) error(ruta + '.id', 'Los IDs de reglas deben ser únicos.');
      else idsReglas.add(regla.id);
      if (regla.conector !== 'AND' && regla.conector !== 'OR') error(ruta + '.conector', 'El conector debe ser AND u OR.');
      if (typeof regla.activa !== 'boolean') error(ruta + '.activa', 'El estado activo debe ser verdadero o falso.');
      if (typeof regla.peso !== 'number' || !Number.isFinite(regla.peso) || regla.peso < 0 || regla.peso > 1) error(ruta + '.peso', 'El peso debe ser un número entre 0 y 1.');
      if (!objeto(regla.antecedentes)) { error(ruta + '.antecedentes', 'Configura un antecedente por entrada o No importa.'); return; }
      Object.keys(regla.antecedentes).forEach(function (id) { if (!entradasPorId.has(id)) error(ruta + '.antecedentes.' + id, 'La regla hace referencia a una entrada inexistente.'); });
      var usados = 0;
      entradasPorId.forEach(function (variable, id) {
        var conjuntoId = regla.antecedentes[id];
        if (conjuntoId === null) return;
        usados++;
        if (!idValido(conjuntoId) || !Array.isArray(variable.conjuntos) || !variable.conjuntos.slice(0, 5).some(function (c) { return objeto(c) && c.id === conjuntoId; })) {
          error(ruta + '.antecedentes.' + id, 'Selecciona un conjunto existente o No importa; la referencia no existe.');
        }
      });
      if (usados === 0) error(ruta + '.antecedentes', 'Cada regla debe utilizar al menos una entrada; no puede quedar completamente vacía.');
      if (regla.consecuente === null) {
        var pendiente = { ruta: ruta + '.consecuente', mensaje: 'Selecciona un consecuente de salida para esta regla.', reglaId: regla.id, activa: regla.activa };
        pendientes.push(pendiente);
        if (!opciones.permitirBorradores) error(pendiente.ruta, pendiente.mensaje);
      } else if (!idValido(regla.consecuente) || !idsSalida.has(regla.consecuente)) error(ruta + '.consecuente', 'La regla hace referencia a un conjunto de salida inexistente.');
      if (regla.activa === false) avisos.push({ ruta: ruta + '.activa', mensaje: 'La regla está desactivada y no aporta salida.' });
      if (regla.peso === 0) avisos.push({ ruta: ruta + '.peso', mensaje: 'La regla tiene peso cero y no aporta salida.' });
      var antecedentes = JSON.stringify([regla.conector, Array.from(entradasPorId.keys()).sort().map(function (id) { return [id, regla.antecedentes[id]]; })]);
      var exacta = JSON.stringify([antecedentes, regla.consecuente, regla.peso]);
      if (firmasExactas.has(exacta)) avisos.push({ ruta: ruta, mensaje: 'Regla duplicada: mismos antecedentes, conector, consecuente y peso que ' + firmasExactas.get(exacta) + '.' });
      else firmasExactas.set(exacta, regla.id);
      if (regla.consecuente !== null && firmasAntecedentes.has(antecedentes) && firmasAntecedentes.get(antecedentes).consecuente !== regla.consecuente) {
        avisos.push({ ruta: ruta + '.consecuente', mensaje: 'Los mismos antecedentes tienen otro consecuente en ' + firmasAntecedentes.get(antecedentes).id + '. Puede ser deliberado; revisa esta decisión.' });
      } else if (regla.consecuente !== null) firmasAntecedentes.set(antecedentes, { id: regla.id, consecuente: regla.consecuente });
    });
    if (errores.length === 0) variables.forEach(function (variable, i) {
      var analisis = cobertura(variable);
      if (!analisis.completa) avisos.push({ ruta: i < entradas.length ? 'entradas.' + i : 'salida', mensaje: 'Hay zonas sin pertenencia en ' + variable.nombre + '. Esto no demuestra cobertura de reglas.', huecos: analisis.huecos });
    });
    if (modelo.valoresIniciales !== undefined) {
      if (!objeto(modelo.valoresIniciales)) error('valoresIniciales', 'Los valores iniciales deben ser un objeto de números.');
      else Object.keys(modelo.valoresIniciales).forEach(function (id) {
        var variable = entradasPorId.get(id), valor = modelo.valoresIniciales[id];
        if (!variable || !numero(valor) || !numero(variable.min) || !numero(variable.max) || valor < variable.min || valor > variable.max) error('valoresIniciales.' + id, 'El valor inicial debe pertenecer al dominio de una entrada existente.');
      });
    }
    return { valido: errores.length === 0, errores: errores, avisos: avisos,
      listo: errores.length === 0 && !pendientes.some(function (p) { return p.activa; }), pendientes: pendientes };
  }

  function distribuirConjuntos(variable, cantidad) {
    if (!objeto(variable) || !numero(variable.min) || !numero(variable.max) || variable.min >= variable.max) throw new TypeError('Configura un dominio válido antes de distribuir conjuntos.');
    var existentes = Array.isArray(variable.conjuntos) ? variable.conjuntos : [];
    cantidad = cantidad === undefined ? (existentes.length || 3) : cantidad;
    if (!Number.isInteger(cantidad) || cantidad < 2 || cantidad > 5) throw new RangeError('Distribuye entre 2 y 5 conjuntos.');
    var paso = (variable.max - variable.min) / (cantidad - 1), ids = new Set(), nombres = new Set();
    return Array.from({ length: cantidad }, function (_, i) {
      var anterior = existentes[i] || {}, id = anterior.id, nombre = anterior.nombre;
      var indice = i + 1, prefijo = idValido(variable.id) ? variable.id.slice(0, 45) : 'variable';
      if (!idValido(id) || ids.has(id)) { id = prefijo + '-c' + indice; while (ids.has(id)) id = prefijo + '-c' + (++indice); }
      if (!nombreValido(nombre) || nombres.has(normalizarNombre(nombre))) { nombre = 'Conjunto ' + indice; while (nombres.has(normalizarNombre(nombre))) nombre = 'Conjunto ' + (++indice); }
      ids.add(id); nombres.add(normalizarNombre(nombre));
      var centro = variable.min + i * paso, parametros, tipo;
      if (i === 0) { tipo = 'trapezoidal'; parametros = [variable.min, variable.min, variable.min, variable.min + paso]; }
      else if (i === cantidad - 1) { tipo = 'trapezoidal'; parametros = [variable.max - paso, variable.max, variable.max, variable.max]; }
      else { tipo = 'triangular'; parametros = [centro - paso, centro, centro + paso]; }
      // Los extremos se asignan exactamente al dominio para evitar un desfase de coma flotante.
      parametros = parametros.map(function (p) { return Math.max(variable.min, Math.min(variable.max, p)); });
      return { id: id, nombre: nombre, tipo: tipo, parametros: parametros };
    });
  }

  function generarCombinaciones(modelo) {
    if (!objeto(modelo) || !Array.isArray(modelo.entradas) || modelo.entradas.length < 1 || modelo.entradas.length > 3) throw new TypeError('Configura entre 1 y 3 entradas antes de generar combinaciones.');
    var combinaciones = [{}];
    var idsEntrada = new Set();
    modelo.entradas.forEach(function (variable) {
      var errores = []; revisarVariable(variable, 'entrada', errores);
      if (errores.length) throw new TypeError(errores[0].mensaje);
      if (idsEntrada.has(variable.id)) throw new TypeError('Los IDs de entradas deben ser únicos antes de generar combinaciones.');
      idsEntrada.add(variable.id);
      var nuevas = [];
      combinaciones.forEach(function (anterior) {
        variable.conjuntos.forEach(function (conjunto) { var siguiente = Object.assign({}, anterior); siguiente[variable.id] = conjunto.id; nuevas.push(siguiente); });
      });
      combinaciones = nuevas;
    });
    if (combinaciones.length > 125) throw new RangeError('El máximo permitido es 125 reglas.');
    var existentes = new Set((Array.isArray(modelo.reglas) ? modelo.reglas : []).filter(objeto).map(function (r) { return r.id; }));
    var siguienteId = 1;
    return combinaciones.map(function (antecedentes) {
      while (existentes.has('r' + siguienteId)) siguienteId++;
      var id = 'r' + siguienteId++; existentes.add(id);
      return { id: id, antecedentes: antecedentes, conector: 'AND', consecuente: null, peso: 1, activa: true };
    });
  }

  function firmaMatematica(modelo) {
    function variable(v) { return { id: v.id, min: v.min, max: v.max, conjuntos: v.conjuntos.map(function (c) {
      return { id: c.id, tipo: c.tipo, parametros: c.parametros };
    }).sort(function (a, b) { return a.id.localeCompare(b.id); }) }; }
    return JSON.stringify({ entradas: modelo.entradas.map(variable).sort(function (a, b) { return a.id.localeCompare(b.id); }), salida: variable(modelo.salida),
      reglas: modelo.reglas.map(function (r) { return { id: r.id, antecedentes: Object.keys(r.antecedentes).sort().map(function (id) { return [id, r.antecedentes[id]]; }),
        conector: r.conector, consecuente: r.consecuente, peso: r.peso, activa: r.activa };
      }).sort(function (a, b) { return a.id.localeCompare(b.id); }) });
  }

  function conjunto(id, nombre, tipo, parametros) { return { id: id, nombre: nombre, tipo: tipo, parametros: parametros }; }
  function tres(id, nombre, unidad, min, max, nombres) {
    var variable = { id: id, nombre: nombre, unidad: unidad, min: min, max: max, conjuntos: [] };
    variable.conjuntos = distribuirConjuntos(variable, 3).map(function (c, i) { c.id = ['baja', 'media', 'alta'][i]; c.nombre = nombres[i]; return c; });
    return variable;
  }
  function crearEjemplo(tipo) {
    var modelo, destinos;
    if (tipo === 'ayuda' || tipo === undefined) {
      var conjuntosEntrada = [conjunto('baja', 'Baja', 'trapezoidal', [0, 0, 2.5, 5]), conjunto('media', 'Media', 'triangular', [2.5, 5, 7.5]), conjunto('alta', 'Alta', 'trapezoidal', [5, 7.5, 10, 10])];
      modelo = { version: 2, id: 'ayuda', nombre: 'Nivel de ayuda recomendado',
        descripcion: 'Demostración didáctica basada en reglas configuradas. No mide ni califica el aprendizaje.',
        entradas: [{ id: 'familiaridad', nombre: 'Familiaridad con el tema', unidad: '', min: 0, max: 10, conjuntos: JSON.parse(JSON.stringify(conjuntosEntrada)) },
          { id: 'dificultad', nombre: 'Dificultad percibida del ejercicio', unidad: '', min: 0, max: 10, conjuntos: JSON.parse(JSON.stringify(conjuntosEntrada)) }],
        salida: { id: 'detalle', nombre: 'Detalle recomendado', unidad: '', min: 0, max: 100,
          conjuntos: [conjunto('breve', 'Breve', 'trapezoidal', [0, 0, 20, 40]), conjunto('intermedia', 'Intermedia', 'triangular', [20, 50, 80]), conjunto('detallada', 'Detallada', 'trapezoidal', [60, 80, 100, 100])] },
        reglas: [], valoresIniciales: { familiaridad: 5, dificultad: 5 } };
      destinos = ['intermedia', 'detallada', 'detallada', 'breve', 'intermedia', 'detallada', 'breve', 'breve', 'intermedia'];
    } else if (tipo === 'propina') {
      modelo = { version: 2, id: 'propina', nombre: 'Propina sugerida',
        descripcion: 'Ejemplo didáctico con parámetros escogidos: combina servicio y comida. No es una recomendación financiera ni un modelo calibrado.',
        entradas: [tres('servicio', 'Calidad del servicio', 'puntos', 0, 10, ['Mala', 'Aceptable', 'Buena']), tres('comida', 'Calidad de la comida', 'puntos', 0, 10, ['Mala', 'Aceptable', 'Buena'])],
        salida: tres('propina', 'Propina sugerida', '%', 0, 30, ['Baja', 'Media', 'Alta']), reglas: [], valoresIniciales: { servicio: 5, comida: 5 } };
      destinos = ['baja', 'baja', 'media', 'baja', 'media', 'alta', 'media', 'alta', 'alta'];
    } else if (tipo === 'ventilacion') {
      modelo = { version: 2, id: 'ventilacion', nombre: 'Velocidad de ventilación',
        descripcion: 'Demostración didáctica con parámetros escogidos. No es un controlador calibrado ni una recomendación de control real.',
        entradas: [tres('temperatura', 'Temperatura', '°C', 0, 40, ['Baja', 'Templada', 'Alta'])],
        salida: tres('velocidad', 'Velocidad de ventilación', '%', 0, 100, ['Baja', 'Media', 'Alta']), reglas: [], valoresIniciales: { temperatura: 20 } };
      destinos = ['baja', 'media', 'alta'];
    } else throw new RangeError('Ejemplo desconocido: ' + tipo + '.');
    modelo.reglas = generarCombinaciones(modelo).map(function (r, i) { r.consecuente = destinos[i]; return r; });
    return modelo;
  }
  function plantilla() {
    var entrada = tres('entrada1', 'Mi entrada', '', 0, 10, ['Baja', 'Media', 'Alta']);
    return { version: 2, id: 'mi-sistema', nombre: 'Mi sistema difuso', descripcion: 'Configura tus variables y selecciona las decisiones de tus reglas. Plantilla editable, sin decisiones del dominio.',
      entradas: [entrada], salida: tres('salida', 'Mi salida', '', 0, 100, ['Baja', 'Media', 'Alta']),
      reglas: [{ id: 'r1', antecedentes: { entrada1: 'baja' }, conector: 'AND', consecuente: null, peso: 1, activa: true }], valoresIniciales: { entrada1: 5 } };
  }
  var api = { leerNumero: leerNumero, crearEjemplo: crearEjemplo, plantilla: plantilla, validar: validar,
    cobertura: cobertura, generarCombinaciones: generarCombinaciones, firmaMatematica: firmaMatematica, distribuirConjuntos: distribuirConjuntos };
  raiz.DifusaModelo = Object.freeze(api);
  if (typeof module !== 'undefined' && module.exports) module.exports = raiz.DifusaModelo;
}(typeof globalThis !== 'undefined' ? globalThis : this));
