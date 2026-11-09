/* Estado del editor Mamdani. Se persisten modelos y valores, nunca muestras.
 * Las importaciones se validan completas antes de cambiar el ejercicio. */
(function (raiz) {
  'use strict';
  const CLAVE = 'logica-difusa.v2';
  const CLAVE_ANTERIOR = 'logica-difusa.v1';
  const CLAVE_TRABAJOS = 'logica-difusa.trabajos.v2';
  const TIPO = 'ciudad-logica-difusa-trabajo';
  const VISTAS = ['inicio', 'variables', 'reglas', 'evaluar', 'resultado'];
  const MAX_JSON = 1000000;
  const MAX_TRABAJOS = 50;
  const Modelo = raiz.DifusaModelo;
  if (!Modelo) throw new Error('Carga modelo.js antes de estado.js.');
  const clonar = valor => JSON.parse(JSON.stringify(valor));
  const objeto = valor => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
  const propio = (valor, clave) => Object.prototype.hasOwnProperty.call(valor, clave);
  const error = (ruta, mensaje) => ({ ruta, mensaje });
  const modeloInicial = Modelo.crearEjemplo('ayuda');
  const estado = {
    modelo: modeloInicial, valores: valoresPredeterminados(modeloInicial), vista: 'inicio',
    resultado: null, pendiente: false, aviso: '', errores: [], modificado: false,
    seleccion: { reglaId: null, puntoIndice: null }, almacenamientoProtegido: false, revision: 0
  };
  // Alias anterior; ambos nombres siempre apuntan a los mismos valores.
  Object.defineProperty(estado, 'entradas', { enumerable: true,
    get: () => estado.valores, set: valor => { estado.valores = valor; } });
  let original = null;
  let biblioteca = null;
  let bibliotecaProtegida = false;
  let secuencia = 0;

  function valoresPredeterminados(modelo) {
    const valores = {};
    modelo.entradas.forEach(variable => {
      const candidato = modelo.valoresIniciales && modelo.valoresIniciales[variable.id];
      valores[variable.id] = valorValido(variable, candidato)
        ? candidato : variable.min + (variable.max - variable.min) / 2;
    });
    return valores;
  }
  function valorValido(variable, valor) {
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= variable.min && valor <= variable.max;
  }
  function modeloPublico(modelo) {
    const variable = v => ({ id: v.id, nombre: v.nombre, unidad: v.unidad || '', min: v.min, max: v.max,
      conjuntos: v.conjuntos.map(c => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, parametros: c.parametros.slice() })) });
    const copia = { version: 2, id: modelo.id, nombre: modelo.nombre, descripcion: modelo.descripcion || '',
      entradas: modelo.entradas.map(variable), salida: variable(modelo.salida),
      reglas: modelo.reglas.map(r => ({ id: r.id,
        antecedentes: Object.fromEntries(modelo.entradas.map(v => [v.id, r.antecedentes[v.id]])),
        conector: r.conector, consecuente: r.consecuente, peso: r.peso, activa: r.activa })) };
    if (modelo.valoresIniciales) copia.valoresIniciales = Object.fromEntries(modelo.entradas
      .filter(v => propio(modelo.valoresIniciales, v.id)).map(v => [v.id, modelo.valoresIniciales[v.id]]));
    return copia;
  }
  function erroresValores(modelo, valores, permitirPendientes) {
    if (!objeto(valores)) return [error('valores', 'Los valores de entrada deben ser un objeto.')];
    const errores = [];
    const ids = modelo.entradas.map(v => v.id);
    Object.keys(valores).forEach(id => {
      if (!ids.includes(id)) errores.push(error('valores.' + id, 'La variable de entrada no existe en este modelo.'));
    });
    modelo.entradas.forEach(v => {
      const valor = valores[v.id];
      if (permitirPendientes && valor === null) return;
      if (!propio(valores, v.id) || !valorValido(v, valor)) errores.push(error('valores.' + v.id,
        'Introduce un número finito para ' + v.nombre + ' entre ' + v.min + ' y ' + v.max + '.'));
    });
    return errores;
  }
  function validarTrabajo(datos, interno) {
    if (!objeto(datos)) return { ok: false, errores: [error('', 'El JSON de trabajo debe ser un objeto.')] };
    if (datos.version !== 2 || (!interno && datos.tipo !== TIPO) || (interno && datos.tipo !== undefined && datos.tipo !== TIPO)) {
      return { ok: false, errores: [error('version', 'Se requiere un JSON de trabajo de Lógica difusa, versión 2. Un JSON de comparación numérica no restaura un sistema.')] };
    }
    const validacion = Modelo.validar(datos.modelo, { permitirBorradores: true });
    if (!validacion.valido) return { ok: false, errores: validacion.errores };
    const errores = erroresValores(datos.modelo, datos.valores, true);
    if (datos.vista !== undefined && !VISTAS.includes(datos.vista)) errores.push(error('vista', 'La vista guardada no es compatible.'));
    if (datos.nombre !== undefined && !nombreTrabajo(datos.nombre)) errores.push(error('nombre', 'El nombre del trabajo debe tener entre 1 y 40 caracteres.'));
    if (errores.length) return { ok: false, errores };
    return { ok: true, trabajo: { tipo: TIPO, version: 2,
      nombre: datos.nombre === undefined ? datos.modelo.nombre : datos.nombre.trim(),
      modelo: modeloPublico(datos.modelo), valores: Object.fromEntries(datos.modelo.entradas.map(v => [v.id, datos.valores[v.id]])),
      vista: datos.vista || 'inicio' }, avisos: validacion.avisos || [] };
  }
  function leerJSON(datos) {
    if (typeof datos === 'string') {
      if (datos.length > MAX_JSON) return { ok: false, errores: [error('', 'El archivo excede el límite de 1 MB de texto.')] };
      try { return { ok: true, datos: JSON.parse(datos) }; }
      catch (_) { return { ok: false, errores: [error('', 'El archivo no contiene JSON válido.')] }; }
    }
    return { ok: true, datos };
  }
  function cargaValida(datos, interno) {
    const lectura = leerJSON(datos);
    if (!lectura.ok) return lectura;
    try { return validarTrabajo(lectura.datos, interno); }
    catch (_) { return { ok: false, errores: [error('', 'El formato del trabajo no es compatible.')] }; }
  }
  function fotografia(nombre) {
    return { tipo: TIPO, version: 2, nombre: nombre || estado.modelo.nombre,
      modelo: modeloPublico(estado.modelo), valores: { ...estado.valores }, vista: estado.vista };
  }
  function persistir() {
    if (estado.almacenamientoProtegido) return false;
    try {
      raiz.localStorage.setItem(CLAVE, JSON.stringify(fotografia()));
      return true;
    } catch (_) {
      estado.aviso = 'No se pudieron guardar los cambios. El módulo sigue disponible en esta sesión.';
      return false;
    }
  }
  function proteger(clave, texto) {
    original = { clave, texto, nombreArchivo: clave + '-original.json' };
    estado.almacenamientoProtegido = true;
    estado.aviso = 'Hay un autoguardado incompatible. Se conserva el original y se pausó el autoguardado: descárgalo o elige usar el sistema actual.';
  }
  function reemplazar(trabajo, modificado) {
    estado.modelo = clonar(trabajo.modelo);
    estado.valores = { ...trabajo.valores };
    estado.vista = trabajo.vista || 'inicio';
    estado.resultado = null;
    estado.pendiente = false;
    estado.errores = [];
    estado.seleccion = { reglaId: null, puntoIndice: null };
    estado.modificado = !!modificado;
    estado.revision++;
  }
  function restaurar() {
    try {
      const texto = raiz.localStorage.getItem(CLAVE);
      if (texto !== null) {
        const recuperado = cargaValida(texto, true);
        if (recuperado.ok) reemplazar(recuperado.trabajo, false);
        else proteger(CLAVE, texto);
        return estado;
      }
      const anterior = raiz.localStorage.getItem(CLAVE_ANTERIOR);
      if (anterior === null) return estado;
      let datos;
      try { datos = JSON.parse(anterior); } catch (_) { proteger(CLAVE_ANTERIOR, anterior); return estado; }
      const modelo = Modelo.crearEjemplo('ayuda');
      const valores = datos && datos.entradas;
      if (!objeto(datos) || datos.version !== 1 || !objeto(valores) ||
          !valorValido(modelo.entradas.find(v => v.id === 'familiaridad'), valores.familiaridad) ||
          !valorValido(modelo.entradas.find(v => v.id === 'dificultad'), valores.dificultad)) {
        proteger(CLAVE_ANTERIOR, anterior);
        return estado;
      }
      reemplazar({ modelo, valores: { familiaridad: valores.familiaridad, dificultad: valores.dificultad }, vista: 'inicio' }, false);
      if (persistir()) estado.aviso = 'Se recuperaron familiaridad y dificultad de la versión anterior. El autoguardado original se conserva.';
    } catch (_) {
      estado.aviso = 'No se pudo leer el almacenamiento. Puedes trabajar en esta sesión.';
    }
    return estado;
  }
  function invalidar() {
    estado.pendiente = estado.pendiente || estado.resultado !== null;
    estado.resultado = null;
    estado.seleccion = { reglaId: null, puntoIndice: null };
    estado.modificado = true;
    estado.revision++;
  }
  function aplicarModelo(modelo) {
    let validacion;
    try { validacion = Modelo.validar(modelo, { permitirBorradores: true }); }
    catch (_) { return { ok: false, errores: [error('modelo', 'El modelo no tiene un formato compatible.')] }; }
    if (!validacion.valido) return { ok: false, errores: validacion.errores, avisos: validacion.avisos || [] };
    const copia = modeloPublico(modelo);
    const cambia = Modelo.firmaMatematica(copia) !== Modelo.firmaMatematica(estado.modelo);
    const valores = {};
    copia.entradas.forEach(variable => {
      // Un rango nuevo no recorta ni sustituye una evaluación escrita por el usuario.
      valores[variable.id] = propio(estado.valores, variable.id) && valorValido(variable, estado.valores[variable.id])
        ? estado.valores[variable.id] : null;
    });
    if (cambia) invalidar();
    estado.modelo = copia;
    estado.valores = valores;
    if (!cambia && estado.resultado && Array.isArray(estado.resultado.pasos)) {
      const datos = estado.resultado.pasos.find(p => p.tipo === 'datos');
      if (datos) datos.descripcion = copia.entradas.map(v => v.nombre + ' = ' + estado.resultado.entradas[v.id] +
        (v.unidad ? ' ' + v.unidad : '')).join('; ') + '.';
    }
    estado.modificado = true;
    estado.errores = [];
    persistir();
    return { ok: true, cambioMatematico: cambia, errores: [], avisos: validacion.avisos || [], listo: validacion.listo };
  }
  function actualizarValor(id, entrada) {
    const variable = estado.modelo.entradas.find(v => v.id === id);
    if (!variable) return { ok: false, error: 'La variable de entrada no existe.' };
    const lectura = typeof entrada === 'number' ? { valido: Number.isFinite(entrada), valor: entrada }
      : Modelo.leerNumero(entrada);
    const ruta = 'valores.' + id;
    estado.errores = estado.errores.filter(e => e.ruta !== ruta);
    if (!lectura.valido || !valorValido(variable, lectura.valor)) {
      invalidar();
      const mensaje = lectura.error || 'Introduce un número finito entre ' + variable.min + ' y ' + variable.max + '.';
      estado.errores.push(error(ruta, mensaje));
      return { ok: false, error: mensaje };
    }
    if (estado.valores[id] !== lectura.valor) {
      invalidar();
      estado.valores[id] = lectura.valor;
      estado.modificado = true;
      persistir();
    }
    return { ok: true, valor: lectura.valor };
  }
  function evaluar(familiaridad, dificultad) {
    const valores = arguments.length === 2 ? { familiaridad, dificultad } : { ...estado.valores };
    const validacion = Modelo.validar(estado.modelo, { permitirBorradores: true });
    const errores = (validacion.errores || []).concat(validacion.listo ? [] : validacion.pendientes || [],
      erroresValores(estado.modelo, valores, false), estado.errores.filter(e => e.ruta.startsWith('valores.')));
    if (!validacion.valido || !validacion.listo || errores.length) {
      const fallo = new Error(errores[0] ? errores[0].mensaje : 'Completa las reglas pendientes antes de evaluar.');
      fallo.errores = errores;
      throw fallo;
    }
    const resultado = raiz.DifusaMotor.evaluarSistema(estado.modelo, valores);
    estado.valores = valores;
    estado.resultado = resultado;
    estado.pendiente = false;
    estado.errores = [];
    estado.seleccion = { reglaId: null, puntoIndice: null };
    persistir();
    return resultado;
  }
  function cambiarVista(vista) {
    if (!VISTAS.includes(vista)) return false;
    estado.vista = vista;
    persistir();
    return true;
  }
  function seleccionarRegla(id) {
    if (id !== null && !estado.modelo.reglas.some(r => r.id === id)) return false;
    estado.seleccion.reglaId = id;
    return true;
  }
  function seleccionarPunto(indice) {
    if (indice !== null && (!Number.isInteger(indice) || indice < 0 || indice > 1000)) return false;
    estado.seleccion.puntoIndice = indice;
    return true;
  }
  function cargarEjemplo(id) {
    let modelo;
    try { modelo = Modelo.crearEjemplo(id); }
    catch (_) { return { ok: false, errores: [error('ejemplo', 'El ejemplo solicitado no existe.')] }; }
    reemplazar({ modelo, valores: valoresPredeterminados(modelo), vista: 'inicio' }, false);
    persistir();
    return { ok: true };
  }
  function crearSistema() {
    const modelo = Modelo.plantilla();
    reemplazar({ modelo, valores: valoresPredeterminados(modelo), vista: 'variables' }, true);
    persistir();
    return { ok: true };
  }
  function restablecer() {
    invalidar();
    estado.resultado = null;
    estado.pendiente = false;
    estado.valores = valoresPredeterminados(estado.modelo);
    estado.errores = [];
    estado.modificado = true;
    persistir();
    return { ...estado.valores };
  }
  function guardar(entradas) {
    if (erroresValores(estado.modelo, entradas, false).length) return false;
    if (JSON.stringify(estado.valores) !== JSON.stringify(entradas)) invalidar();
    estado.valores = { ...entradas };
    estado.modificado = true;
    return persistir();
  }
  function exportarTrabajo(nombre) {
    const validacion = cargaValida(fotografia(nombre), false);
    if (!validacion.ok) {
      const fallo = new Error(validacion.errores[0].mensaje);
      fallo.errores = validacion.errores;
      throw fallo;
    }
    return validacion.trabajo;
  }
  function importarTrabajo(datos) {
    const validacion = cargaValida(datos, false);
    if (!validacion.ok) return validacion;
    reemplazar(validacion.trabajo, false);
    persistir();
    return { ok: true, errores: [], avisos: validacion.avisos };
  }
  function obtenerOriginal() { return original ? { ...original } : null; }
  function respaldarOriginal() {
    const copia = obtenerOriginal();
    if (copia) {
      estado.almacenamientoProtegido = false;
      if (persistir()) estado.aviso = 'El original sigue disponible para descargar y el autoguardado del sistema actual está activo.';
    }
    return copia;
  }
  function descartarOriginal() {
    estado.almacenamientoProtegido = false;
    const guardado = persistir();
    if (guardado) estado.aviso = 'Se guarda el sistema actual. La copia del original sigue disponible en esta sesión.';
    return guardado;
  }
  function nombreTrabajo(nombre) {
    return typeof nombre === 'string' && nombre.trim().length >= 1 && nombre.trim().length <= 40 ? nombre.trim() : null;
  }
  function leerBiblioteca() {
    if (biblioteca !== null) return;
    biblioteca = [];
    try {
      const texto = raiz.localStorage.getItem(CLAVE_TRABAJOS);
      if (texto === null) return;
      const datos = JSON.parse(texto);
      if (!objeto(datos) || datos.version !== 2 || !Array.isArray(datos.trabajos) || datos.trabajos.length > MAX_TRABAJOS) throw new Error('Biblioteca incompatible');
      const ids = new Set();
      const recuperados = datos.trabajos.map(t => {
        const valido = cargaValida(t, false);
        if (!valido.ok || typeof t.id !== 'string' || !/^trabajo-[a-z0-9-]+$/.test(t.id) || ids.has(t.id) ||
            typeof t.creado !== 'string' || typeof t.actualizado !== 'string') throw new Error('Trabajo incompatible');
        ids.add(t.id);
        return { ...valido.trabajo, id: t.id, creado: t.creado, actualizado: t.actualizado };
      });
      biblioteca = recuperados;
    } catch (_) {
      // No sobrescribir una biblioteca que no se pudo interpretar.
      bibliotecaProtegida = true;
      estado.aviso = 'No se pudo recuperar la biblioteca. Los trabajos nuevos permanecerán en esta sesión; el archivo anterior se conserva.';
    }
  }
  function guardarBiblioteca() {
    if (bibliotecaProtegida) return false;
    try {
      raiz.localStorage.setItem(CLAVE_TRABAJOS, JSON.stringify({ version: 2, trabajos: biblioteca }));
      return true;
    } catch (_) {
      estado.aviso = 'El trabajo está disponible en esta sesión; no se pudo guardar en el navegador. Exporta su JSON para conservarlo.';
      return false;
    }
  }
  function listarTrabajos() {
    leerBiblioteca();
    return biblioteca.map(t => ({ id: t.id, nombre: t.nombre, creado: t.creado, actualizado: t.actualizado }));
  }
  function guardarTrabajo(nombre, id) {
    const limpio = nombreTrabajo(nombre);
    if (!limpio) return { ok: false, errores: [error('nombre', 'El nombre debe tener entre 1 y 40 caracteres.')] };
    let trabajo;
    try { trabajo = exportarTrabajo(limpio); }
    catch (fallo) { return { ok: false, errores: fallo.errores || [error('', fallo.message)] }; }
    leerBiblioteca();
    const indice = id === undefined ? -1 : biblioteca.findIndex(t => t.id === id);
    if (id !== undefined && indice < 0) return { ok: false, errores: [error('id', 'El trabajo que quieres actualizar no existe.')] };
    if (indice < 0 && biblioteca.length >= MAX_TRABAJOS) return { ok: false, errores: [error('', 'La biblioteca admite hasta 50 trabajos.')] };
    const ahora = new Date().toISOString();
    const nuevo = { ...trabajo, id: indice < 0 ? 'trabajo-' + Date.now().toString(36) + '-' + (++secuencia).toString(36) : id,
      creado: indice < 0 ? ahora : biblioteca[indice].creado, actualizado: ahora };
    if (indice < 0) biblioteca.push(nuevo); else biblioteca[indice] = nuevo;
    const persistido = guardarBiblioteca();
    estado.modificado = false;
    return { ok: true, id: nuevo.id, persistido };
  }
  function cargarTrabajo(id) {
    leerBiblioteca();
    const trabajo = biblioteca.find(t => t.id === id);
    if (!trabajo) return { ok: false, errores: [error('id', 'El trabajo solicitado no existe.')] };
    return importarTrabajo(trabajo);
  }
  function renombrarTrabajo(id, nombre) {
    const limpio = nombreTrabajo(nombre);
    if (!limpio) return { ok: false, errores: [error('nombre', 'El nombre debe tener entre 1 y 40 caracteres.')] };
    leerBiblioteca();
    const trabajo = biblioteca.find(t => t.id === id);
    if (!trabajo) return { ok: false, errores: [error('id', 'El trabajo solicitado no existe.')] };
    trabajo.nombre = limpio;
    trabajo.actualizado = new Date().toISOString();
    return { ok: true, persistido: guardarBiblioteca() };
  }
  function eliminarTrabajo(id) {
    leerBiblioteca();
    const indice = biblioteca.findIndex(t => t.id === id);
    if (indice < 0) return { ok: false, errores: [error('id', 'El trabajo solicitado no existe.')] };
    biblioteca.splice(indice, 1);
    return { ok: true, persistido: guardarBiblioteca() };
  }

  raiz.DifusaEstado = Object.freeze({ estado, restaurar, aplicarModelo, actualizarValor, evaluar,
    cambiarVista, seleccionarRegla, seleccionarPunto, invalidar, guardar, cargarEjemplo, crearSistema, restablecer,
    exportarTrabajo, importarTrabajo, validarTrabajo: datos => cargaValida(datos, false),
    listarTrabajos, guardarTrabajo, cargarTrabajo, renombrarTrabajo, eliminarTrabajo,
    obtenerOriginal, respaldarOriginal, confirmarRespaldoOriginal: respaldarOriginal, descartarOriginal,
    claves: Object.freeze({ actual: CLAVE, anterior: CLAVE_ANTERIOR, trabajos: CLAVE_TRABAJOS }),
    tipoTrabajo: TIPO, vistas: VISTAS.slice() });
  if (typeof module !== 'undefined' && module.exports) module.exports = raiz.DifusaEstado;
})(typeof globalThis !== 'undefined' ? globalThis : window);
