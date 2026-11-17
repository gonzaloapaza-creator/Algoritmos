(function () {
  'use strict';

  const motor = globalThis.PerceptronCiudad;
  const get = id => document.getElementById(id);
  const form = get('config');
  const ordenBinario = [['0', '0'], ['0', '1'], ['1', '0'], ['1', '1']];
  const subindices = '₀₁₂₃₄₅₆';
  const ejemplos = {
    and: {
      nombre: 'AND de la pizarra',
      nota: 'x₁ representa coincidencia de placa y x₂ coincidencia de color. La salida es 1 si coinciden ambas. En la primera época, el patrón (1, 0) corrige el peso w₁.',
      clases: [0, 0, 0, 1]
    },
    or: {
      nombre: 'OR · Al menos una entrada',
      nota: 'Basta con que una entrada sea 1. Observa cómo se ajusta w₂ en el patrón (0, 1).',
      clases: [0, 1, 1, 1]
    },
    bipolar: {
      nombre: 'AND bipolar · Hardlims',
      nota: 'Entradas y clases bipolares (−1/1). Parte de pesos cero: al fallar (1,1), el error es −2 y cada peso aumenta 0,2.',
      clases: [-1, -1, -1, 1],
      activacion: 'hardlims', razon: '0,1', pesos: ['0','0'],
      patrones: [['-1','-1'], ['-1','1'], ['1','-1'], ['1','1']]
    },
    xor: {
      nombre: 'XOR · Límite del perceptrón',
      nota: 'XOR devuelve 1 cuando exactamente una entrada es 1. Una neurona con un solo límite lineal no puede clasificar los cuatro patrones.',
      clases: [0, 1, 1, 0],
      epocas: '12'
    }
  };

  let datos;
  let baseEjemplo;
  let resultado;
  let indice = 0;
  let ultimaEpoca = 0;
  let errorCampo;
  let revision = 0;

  function nodo(etiqueta, texto = '', clase = '') {
    const elemento = document.createElement(etiqueta);
    if (texto) elemento.textContent = texto;
    if (clase) elemento.className = clase;
    return elemento;
  }

  function opcion(valor, texto) {
    const elemento = nodo('option', texto);
    elemento.value = valor;
    return elemento;
  }

  function nombreIndice(simbolo, i) {
    return simbolo + subindices[i + 1];
  }

  function signo(numero) {
    return String(numero).replace('-', '−');
  }

  function campoDecimal(id, valor, etiqueta) {
    const campo = nodo('input');
    campo.type = 'text';
    campo.inputMode = 'decimal';
    campo.maxLength = 14;
    campo.id = id;
    campo.value = valor;
    if (etiqueta) campo.setAttribute('aria-label', etiqueta);
    return campo;
  }

  function encabezado(textos) {
    const head = nodo('thead');
    const fila = nodo('tr');
    textos.forEach(texto => {
      const th = nodo('th', texto);
      th.scope = 'col';
      fila.append(th);
    });
    head.append(fila);
    return head;
  }

  function celdas(fila, valores) {
    valores.forEach((valor, i) => {
      const celda = nodo(i === 0 ? 'th' : 'td', String(valor));
      if (i === 0) celda.scope = 'row';
      fila.append(celda);
    });
  }

  function limpiarError() {
    get('error').hidden = true;
    get('error').textContent = '';
    if (errorCampo) {
      errorCampo.removeAttribute('aria-invalid');
      const descripcion = (errorCampo.getAttribute('aria-describedby') || '').split(' ')
        .filter(id => id && id !== 'error').join(' ');
      if (descripcion) errorCampo.setAttribute('aria-describedby', descripcion);
      else errorCampo.removeAttribute('aria-describedby');
      errorCampo = null;
    }
  }

  function mostrarError({ campo, mensaje }) {
    limpiarError();
    get('error').textContent = mensaje;
    get('error').hidden = false;
    errorCampo = campo ? get(campo) : null;
    if (!errorCampo) return;
    errorCampo.setAttribute('aria-invalid', 'true');
    const ids = errorCampo.getAttribute('aria-describedby');
    errorCampo.setAttribute('aria-describedby', ids ? ids + ' error' : 'error');
    errorCampo.focus();
  }

  function invalidar() {
    revision += 1;
    if (resultado) get('estado').textContent = 'Cambiaste el ejercicio. Entrena de nuevo para actualizar el resultado.';
    resultado = null;
    get('resultados').hidden = true;
    get('diagrama-suma').textContent = 'S = Σ xᵢwᵢ';
    get('diagrama-activacion').textContent = 'z = S − θ';
    get('diagrama-salida').textContent = 'ŷ';
    limpiarError();
  }

  function renderPatrones() {
    const indices = Array.from({ length: datos.entradas }, (_, i) => nombreIndice('x', i));
    const head = encabezado(['Fila', ...indices, 'Deseada', 'Acción']);
    const cuerpo = nodo('tbody');
    datos.patrones.forEach((patron, i) => {
      const fila = nodo('tr');
      celdas(fila, [i + 1]);
      patron.x.forEach((valor, j) => {
        const celda = nodo('td');
        const campo = campoDecimal('x-' + i + '-' + j, valor, indices[j] + ', fila ' + (i + 1));
        campo.addEventListener('input', () => {
          patron.x[j] = campo.value;
          invalidar();
        });
        celda.append(campo);
        fila.append(celda);
      });
      const salida = nodo('select');
      salida.id = 'y-' + i;
      salida.setAttribute('aria-label', 'Salida deseada, fila ' + (i + 1));
      const clases = datos.activacion === 'hardlims' ? ['-1', '1'] : ['0', '1'];
      salida.append(opcion('', 'Elegir'), ...clases.map(clase => opcion(clase, signo(clase))));
      salida.value = patron.y;
      salida.addEventListener('change', () => {
        patron.y = salida.value;
        invalidar();
      });
      const celdaSalida = nodo('td');
      celdaSalida.append(salida);
      fila.append(celdaSalida);
      const celdaQuitar = nodo('td');
      const quitar = nodo('button', 'Quitar', 'rn-quitar');
      quitar.type = 'button';
      quitar.disabled = datos.patrones.length === 1;
      quitar.setAttribute('aria-label', 'Quitar patrón ' + (i + 1));
      quitar.addEventListener('click', () => {
        datos.patrones.splice(i, 1);
        invalidar();
        renderPatrones();
        get('x-' + Math.min(i, datos.patrones.length - 1) + '-0').focus();
      });
      celdaQuitar.append(quitar);
      fila.append(celdaQuitar);
      cuerpo.append(fila);
    });
    get('datos').replaceChildren(head, cuerpo);
    get('agregar').disabled = datos.patrones.length >= motor.maxPatrones;
  }

  function renderPesos() {
    const campos = datos.pesos.map((valor, i) => {
      const label = nodo('label', nombreIndice('w', i) + ' inicial');
      const campo = campoDecimal('peso-' + i, valor);
      label.append(campo);
      campo.addEventListener('input', () => {
        datos.pesos[i] = campo.value;
        invalidar();
      });
      return label;
    });
    get('pesos').replaceChildren(...campos);
  }

  function renderConfiguracion() {
    get('entradas').value = datos.entradas;
    get('activacion').value = datos.activacion;
    get('aprenderUmbral').checked = datos.aprenderUmbral;
    for (const id of ['umbral', 'razon', 'epocas']) get(id).value = datos[id];
    renderPatrones();
    renderPesos();
  }

  function reemplazar(entrada, nota) {
    invalidar();
    datos = {
      entradas: entrada.entradas, activacion: entrada.activacion,
      umbral: String(entrada.umbral), razon: String(entrada.razon), epocas: String(entrada.epocas),
      aprenderUmbral: entrada.aprenderUmbral,
      pesos: entrada.pesos.map(String),
      patrones: entrada.patrones.map(({ x, y }) => ({ x: x.map(String), y: String(y) }))
    };
    baseEjemplo = JSON.stringify(datos);
    get('ejemplo-nota').textContent = nota;
    renderConfiguracion();
  }

  function cargarEjemplo(id) {
    const ejemplo = ejemplos[id];
    reemplazar({
      entradas: 2, pesos: ejemplo.pesos || ['0,2', '0,1'], umbral: '0,2',
      razon: ejemplo.razon || '0,1', epocas: ejemplo.epocas || '30',
      activacion: ejemplo.activacion || 'hardlim', aprenderUmbral: false,
      patrones: (ejemplo.patrones || ordenBinario).map((x, i) => ({ x, y: ejemplo.clases[i] }))
    }, ejemplo.nota);
  }

  async function confirmarReemplazo() {
    if (JSON.stringify(datos) === baseEjemplo) return true;
    const actual = revision;
    const aceptar = await dialogoConfirmar({ titulo: 'Reemplazar ejercicio', mensaje: 'Se sustituirán los datos y su entrenamiento. Puedes exportar el ejercicio antes.', textoAceptar: 'Reemplazar' });
    return aceptar && actual === revision;
  }

  function valores(grupo, cifras) {
    return '(' + grupo.map(valor => motor.formato(valor, cifras)).join(' · ') + ')';
  }

  function resumenValor(titulo, texto, clase = '') {
    const bloque = nodo('div', '', clase);
    bloque.append(nodo('dt', titulo), nodo('dd', texto));
    return bloque;
  }

  function construirTabla(id, titulos, filas) {
    const body = nodo('tbody');
    for (const valoresFila of filas) {
      const tr = nodo('tr');
      celdas(tr, valoresFila);
      body.append(tr);
    }
    get(id).replaceChildren(encabezado(titulos), body);
    return body;
  }

  function mostrarPaso(nuevoIndice) {
    if (!resultado || nuevoIndice < 0 || nuevoIndice >= resultado.historial.length) return;
    indice = nuevoIndice;
    const r = resultado.historial[indice];
    const totalPatrones = resultado.modelo.filas.length;
    get('paso').textContent = 'Época ' + r.epoca + ' de ' + resultado.erradas.length +
      ' · Patrón ' + (r.fila + 1) + ' de ' + totalPatrones;
    get('ir-epoca').value = r.epoca;
    // Mantener los botones enfocados al llegar a un extremo.
    get('anterior').setAttribute('aria-disabled', String(indice === 0));
    get('siguiente').setAttribute('aria-disabled', String(indice === resultado.historial.length - 1));

    const pasos = nodo('dl', '', 'rn-paso-valores');
    const negativo = resultado.modelo.activacion === 'hardlims' ? '−1' : '0';
    pasos.append(
      resumenValor('Suma ponderada', motor.formato(r.suma, 18)),
      resumenValor('Umbral aplicado', motor.formato(r.umbralAntes, 12)),
      resumenValor('Entrada neta z', motor.formato(r.neta, 18)),
      resumenValor('Predicción / deseada', signo(r.salida) + ' / ' + signo(r.y))
    );
    const sumandos = r.x.map((x, i) =>
      '(' + motor.formato(x, 6) + ' × ' + motor.formato(r.pesosAntes[i], 12) + ')');
    const operacion = nodo('p', 'z = ' + sumandos.join(' + ') + ' − (' +
      motor.formato(r.umbralAntes, 12) + ') = ' + motor.formato(r.neta, 18), 'rn-operacion');
    const activacion = r.neta >= 0n ? 'z ≥ 0, por eso la salida es 1.' :
      'z < 0, por eso la salida es ' + negativo + '.';
    const decision = r.error === 0 ? 'La predicción coincide. Los pesos se conservan.' :
      'La predicción difiere. Aplica Δwᵢ = −η · e · xᵢ.';
    const aviso = nodo('p', activacion + ' Error e = ' + signo(r.salida) + ' − (' +
      signo(r.y) + ') = ' + signo(r.error) + '. ' + decision,
    'rn-aviso ' + (r.error === 0 ? 'rn-correcto' : 'rn-correccion'));
    const pesos = nodo('table');
    const body = nodo('tbody');
    for (let i = 0; i < r.x.length; i += 1) {
      const fila = nodo('tr');
      if (r.delta[i] !== 0n) fila.className = 'rn-fila-cambio';
      celdas(fila, [
        nombreIndice('w', i), motor.formato(r.x[i], 6), motor.formato(r.pesosAntes[i], 12),
        motor.formato(r.aportes[i], 18), motor.formato(r.delta[i], 12),
        motor.formato(r.pesosDespues[i], 12)
      ]);
      body.append(fila);
    }
    pesos.append(encabezado(['Peso', 'Entrada', 'Antes', 'Aporte xᵢwᵢ', 'Corrección Δwᵢ', 'Después']), body);
    const tabla = nodo('div', '', 'rn-tabla');
    tabla.tabIndex = 0;
    tabla.setAttribute('role', 'region');
    tabla.setAttribute('aria-label', 'Cambios de pesos en el paso');
    tabla.append(pesos);
    const motivos = nodo('ul', '', 'rn-motivos');
    for (let i = 0; i < r.x.length; i += 1) {
      const texto = nombreIndice('w', i) + ': Δw = −(' + motor.formato(resultado.modelo.razon, 6) + ') × (' + signo(r.error) + ') × (' + motor.formato(r.x[i], 6) + ') = ' + motor.formato(r.delta[i], 12) +
        '; ' + motor.formato(r.pesosAntes[i], 12) + ' + (' + motor.formato(r.delta[i], 12) + ') = ' + motor.formato(r.pesosDespues[i], 12) + '. ' +
        (r.error === 0 ? 'No cambia porque la predicción coincide (e = 0).' : r.x[i] === 0n ? 'No cambia porque esta entrada vale 0, aunque exista error.' : 'Cambia porque hay error y esta entrada es distinta de 0.');
      motivos.append(nodo('li', texto, r.delta[i] !== 0n ? 'rn-fila-cambio' : ''));
    }
    const umbral = resultado.modelo.aprenderUmbral
      ? 'Umbral: Δθ = η · e = (' + motor.formato(resultado.modelo.razon, 6) + ') × (' + signo(r.error) + ') = ' + motor.formato(r.deltaUmbral, 12) + '. θ nuevo = ' + motor.formato(r.umbralAntes, 12) + ' + (' +
        motor.formato(r.deltaUmbral, 12) + ') = ' + motor.formato(r.umbralDespues, 12) + '.'
      : 'Umbral fijo: ' + motor.formato(r.umbralAntes, 12) + '.';
    get('detalle-paso').replaceChildren(pasos, operacion, aviso, tabla, motivos, nodo('p', umbral, 'rn-texto'));
    get('diagrama-suma').textContent = 'S = ' + motor.formato(r.suma, 18);
    get('diagrama-activacion').textContent = (resultado.modelo.activacion === 'hardlims' ? 'Hardlims' : 'Hardlim') + ' · z = ' + motor.formato(r.neta, 18);
    get('diagrama-salida').textContent = 'ŷ = ' + signo(r.salida);

    if (ultimaEpoca !== r.epoca) {
      ultimaEpoca = r.epoca;
      const comienzo = (r.epoca - 1) * totalPatrones;
      const ronda = resultado.historial.slice(comienzo, comienzo + totalPatrones);
      const filas = ronda.map(p => [
        p.fila + 1, valores(p.x, 6), valores(p.pesosAntes, 12), valores(p.aportes, 18), motor.formato(p.suma, 18),
        motor.formato(p.umbralAntes, 12), motor.formato(p.neta, 18), signo(p.salida), signo(p.y), signo(p.error), valores(p.delta, 12), valores(p.pesosDespues, 12), motor.formato(p.umbralDespues, 12)
      ]);
      construirTabla('tabla-epoca', ['Patrón', 'Entradas', 'Pesos antes', 'Productos xᵢwᵢ', 'Suma S', 'Umbral θ antes',
        'Neta z', 'Predicha', 'Deseada', 'Error e', 'Corrección Δw', 'Pesos después', 'Umbral θ después'], filas);
    }
    const filasEpoca = get('tabla-epoca').tBodies[0].rows;
    Array.from(filasEpoca).forEach((fila, i) => fila.classList.toggle('rn-fila-actual', i === r.fila));
  }

  function graficoErrores() {
    const espacio = 'http://www.w3.org/2000/svg';
    function svg(tipo, attrs, texto) {
      const elem = document.createElementNS(espacio, tipo);
      for (const [nombre, valor] of Object.entries(attrs)) elem.setAttribute(nombre, valor);
      if (texto) elem.textContent = texto;
      return elem;
    }
    const { erradas } = resultado;
    const mayor = Math.max(1, ...erradas);
    const x = i => erradas.length === 1 ? 263 : 36 + 454 * i / (erradas.length - 1);
    const y = errores => 84 - (errores / mayor) * 60;
    const dibujo = svg('svg', { viewBox: '0 0 520 120', role: 'img',
      'aria-label': 'Errores por época: ' + erradas.join(', ') });
    for (const nivel of [0, mayor]) {
      dibujo.append(svg('line', { x1: 36, x2: 490, y1: y(nivel), y2: y(nivel), class: 'rn-guia' }),
        svg('text', { x: 24, y: y(nivel) + 4, 'text-anchor': 'end' }, nivel.toString()));
    }
    dibujo.append(svg('polyline', {
      points: erradas.map((errores, i) => x(i) + ',' + y(errores)).join(' '), class: 'rn-linea'
    }));
    for (let i = 0; i < erradas.length; i += 1) {
      if (erradas.length > 18 && i !== 0 && i !== erradas.length - 1) continue;
      const punto = svg('circle', { cx: x(i), cy: y(erradas[i]), r: 3, class: 'rn-punto' });
      punto.append(svg('title', {}, 'Época ' + (i + 1) + ': ' + erradas[i] + ' errores'));
      dibujo.append(punto);
    }
    dibujo.append(svg('text', { x: x(0), y: 106, 'text-anchor': 'middle' }, 'Época 1'));
    if (erradas.length > 1) dibujo.append(svg('text', {
      x: x(erradas.length - 1), y: 106, 'text-anchor': 'end'
    }, 'Época ' + erradas.length));
    const detalle = nodo('details', '', 'rn-detalle');
    detalle.append(nodo('summary', 'Ver recuento de cada época'),
      nodo('p', erradas.map((errores, i) => 'Época ' + (i + 1) + ': ' + errores).join('  ·  '), 'rn-texto'));
    get('grafico').replaceChildren(dibujo, detalle);
  }

  function renderResultados() {
    const { convergio, modelo, inicial, final, erradas, pesos, umbral } = resultado;
    const aciertos = predicciones => predicciones.filter((p, i) => p.salida === modelo.filas[i].y).length;
    const total = modelo.filas.length;
    get('convergencia').textContent = convergio ? 'Convergió' : 'Límite de épocas';
    get('convergencia').dataset.estado = convergio ? 'correcto' : 'pendiente';
    get('diagnostico').textContent = convergio
      ? 'Completó una época sin errores, por lo que dejó de ajustar los pesos.'
      : 'Alcanzó el límite sin completar una época libre de errores. Se muestran los últimos pesos obtenidos.';
    get('metricas').replaceChildren(
      resumenValor('Épocas recorridas', String(erradas.length)),
      resumenValor('Aciertos iniciales → finales', aciertos(inicial) + '/' + total + ' → ' + aciertos(final) + '/' + total),
      resumenValor('Pesos iniciales', valores(modelo.pesos, 12)),
      resumenValor('Pesos obtenidos', valores(pesos, 12)),
      resumenValor('Umbral inicial → final', motor.formato(modelo.umbral, 12) + ' → ' + motor.formato(umbral, 12))
    );
    get('ir-epoca').replaceChildren(...erradas.map((_, i) => opcion(i + 1, 'Época ' + (i + 1))));
    ultimaEpoca = 0;
    mostrarPaso(0);
    const t = construirTabla('comparacion', ['Patrón', 'Entradas', 'Deseada', 'Antes', 'Después', 'Comparación final'],
      modelo.filas.map((f, i) => [i + 1, valores(f.x, 6), signo(f.y), signo(inicial[i].salida),
        signo(final[i].salida), final[i].salida === f.y ? 'Coincide' : 'Difiere']));
    Array.from(t.rows).forEach((fila, i) => {
      fila.lastElementChild.className = final[i].salida === modelo.filas[i].y ? 'rn-ok-texto' : 'rn-alerta-texto';
    });
    graficoErrores();
    get('prediccion').textContent = '';
    get('prediccion-campos').replaceChildren(...modelo.pesos.map((_, i) => {
      const label = nodo('label', nombreIndice('x', i));
      label.append(campoDecimal('pred-' + i, '0'));
      return label;
    }));
    get('resultados').hidden = false;
    get('resultado-titulo').focus();
  }

  for (const [id, ejemplo] of Object.entries(ejemplos)) {
    get('ejemplo').append(opcion(id, ejemplo.nombre));
  }
  for (let i = 1; i <= motor.maxEntradas; i += 1) {
    get('entradas').append(opcion(i, String(i)));
  }
  get('cargar').addEventListener('click', async () => {
    if (!await confirmarReemplazo()) return;
    cargarEjemplo(get('ejemplo').value);
    get('estado').textContent = 'Ejemplo cargado. Puedes entrenar o editar sus datos.';
  });
  get('agregar').addEventListener('click', () => {
    if (datos.patrones.length >= motor.maxPatrones) return;
    datos.patrones.push({ x: Array(datos.entradas).fill(''), y: '' });
    invalidar();
    renderPatrones();
    get('x-' + (datos.patrones.length - 1) + '-0').focus();
  });
  for (const id of ['umbral', 'razon', 'epocas']) {
    get(id).addEventListener('input', () => {
      datos[id] = get(id).value;
      invalidar();
    });
  }
  get('entradas').addEventListener('change', () => {
    datos.entradas = Number(get('entradas').value);
    datos.pesos = Array.from({ length: datos.entradas }, (_, i) => datos.pesos[i] ?? '0');
    for (const patron of datos.patrones) {
      patron.x = Array.from({ length: datos.entradas }, (_, i) => patron.x[i] ?? '');
    }
    invalidar();
    renderPesos();
    renderPatrones();
  });
  get('activacion').addEventListener('change', () => {
    datos.activacion = get('activacion').value;
    const bipolar = datos.activacion === 'hardlims';
    for (const patron of datos.patrones) {
      if (bipolar && patron.y === '0') patron.y = '-1';
      if (!bipolar && patron.y === '-1') patron.y = '0';
    }
    invalidar();
    renderPatrones();
    get('estado').textContent = (bipolar ? 'Las clases 0 se representarán como −1.' : 'Las clases −1 se representarán como 0.') + ' Entrena de nuevo para actualizar el resultado.';
  });
  get('aprenderUmbral').addEventListener('change', () => {
    datos.aprenderUmbral = get('aprenderUmbral').checked;
    invalidar();
  });
  form.addEventListener('submit', evento => {
    evento.preventDefault();
    limpiarError();
    const calculo = motor.entrenar(datos);
    if (calculo.errores.length) return mostrarError(calculo.errores[0]);
    resultado = calculo;
    get('estado').textContent = '';
    renderResultados();
  });
  get('anterior').addEventListener('click', () => mostrarPaso(indice - 1));
  get('siguiente').addEventListener('click', () => mostrarPaso(indice + 1));
  get('ir-epoca').addEventListener('change', () => {
    mostrarPaso((Number(get('ir-epoca').value) - 1) * resultado.modelo.filas.length);
  });
  get('prediccion-campos').addEventListener('input', () => { get('prediccion').textContent = ''; });
  get('predecir').addEventListener('click', () => {
    if (!resultado) return;
    const x = [];
    for (let i = 0; i < resultado.pesos.length; i += 1) {
      const campo = get('pred-' + i);
      const valor = motor.decimal(campo.value);
      if (valor === null || valor < -100_000_000n || valor > 100_000_000n) {
        get('prediccion').textContent = 'Escribe ' + nombreIndice('x', i) + ' entre −100 y 100, con hasta seis decimales.';
        campo.focus();
        return;
      }
      x.push(valor);
    }
    const p = motor.predecir(x, resultado.pesos, resultado.umbral, resultado.modelo.activacion);
    get('prediccion').textContent = 'Entrada neta ' + motor.formato(p.neta, 18) + ' · Clase predicha ' + signo(p.salida);
  });

  get('exportar').addEventListener('click', () => {
    const validacion = motor.validar(datos);
    if (validacion.errores.length) return mostrarError(validacion.errores[0]);
    limpiarError();
    const archivo = new Blob([JSON.stringify({ tipo: 'ciudad-perceptron', version: 1, datos }, null, 2)],
      { type: 'application/json' });
    const url = URL.createObjectURL(archivo);
    const link = nodo('a');
    link.href = url;
    link.download = 'ejercicio-perceptron.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    get('estado').textContent = 'Ejercicio exportado. Puedes entrenarlo de nuevo al importarlo.';
  });
  get('importar').addEventListener('click', () => get('archivo').click());
  get('archivo').addEventListener('change', async () => {
    const selector = get('archivo');
    const archivo = selector.files[0];
    selector.value = '';
    if (!archivo) return;
    const revisionLeida = ++revision;
    try {
      if (archivo.size > 100_000) throw new Error('El archivo supera el límite de 100 KB.');
      let doc;
      try { doc = JSON.parse(await archivo.text()); }
      catch { throw new Error('El archivo no es un JSON legible.'); }
      if (revisionLeida !== revision) return;
      if (doc?.tipo !== 'ciudad-perceptron' || doc.version !== 1) {
        throw new Error('El archivo no corresponde a un ejercicio de perceptrón compatible.');
      }
      const { errores } = motor.validar(doc.datos);
      if (errores.length) throw new Error(errores[0].mensaje);
      if (!await confirmarReemplazo()) return;
      if (revisionLeida !== revision) return;
      reemplazar(doc.datos, 'Ejercicio importado. Entrena para generar su procedimiento.');
      get('estado').textContent = 'Ejercicio cargado correctamente.';
    } catch (error) {
      if (revisionLeida === revision) mostrarError({ mensaje: 'No se cargó el archivo. ' + error.message });
    }
  });

  get('btnAyuda').addEventListener('click', () => dialogoInformar({ titulo: 'Perceptrón · Ayuda', mensaje: 'Carga AND de la pizarra y pulsa Entrenar. Cada fila usa los pesos dejados por la anterior. S = Σxᵢwᵢ; z = S − θ. Hardlim da 1 si z ≥ 0 y 0 si z < 0; Hardlims utiliza −1/1. Error = predicha − deseada y Δwᵢ = −ηexᵢ. Recorre Procedimiento y abre la tabla de la época. Comparación evalúa los mismos patrones antes y después; Probar una entrada no vuelve a entrenar. XOR puede alcanzar el límite porque una sola frontera lineal no separa sus clases. Exportar conserva datos y parámetros, sin guardar el historial. Se aceptan de 1 a 6 entradas, de 1 a 32 patrones y hasta 100 épocas; datos y pesos iniciales entre −100 y 100 con hasta seis decimales.', ancho: true }));
  // Resumen de solo lectura para la ayuda local; no expone ni recalcula el historial.
  globalThis.PerceptronModulo = Object.freeze({ contexto() {
    const r = resultado && resultado.historial[indice];
    return { revision, entradas: datos.entradas, patrones: datos.patrones.length, entrenado: Boolean(resultado),
      epocas: resultado ? resultado.erradas.length : 0, paso: indice + 1, totalPasos: resultado ? resultado.historial.length : 0,
      descripcionPaso: r ? 'Época ' + r.epoca + ', patrón ' + (r.fila + 1) + '. S = ' + motor.formato(r.suma, 18) + ', θ = ' + motor.formato(r.umbralAntes, 12) + ', z = ' + motor.formato(r.neta, 18) + ', predicha = ' + signo(r.salida) + ', deseada = ' + signo(r.y) + ', e = ' + signo(r.error) + '. ' + get('detalle-paso').querySelector('.rn-motivos').textContent : '',
      resumen: resultado ? (resultado.convergio ? 'Convergió' : 'Límite de épocas') + ' tras ' + resultado.erradas.length + ' épocas. Pesos iniciales ' + valores(resultado.modelo.pesos, 12) + '; finales ' + valores(resultado.pesos, 12) + '. Errores por época: ' + resultado.erradas.join(', ') + '. Los aciertos se evalúan sobre los patrones de entrenamiento.' : 'Entrena de nuevo para consultar el resultado vigente.' };
  } });

  cargarEjemplo('and');
})();
