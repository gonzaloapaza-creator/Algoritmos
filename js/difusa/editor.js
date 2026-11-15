/* Editor transaccional: los borradores nunca sustituyen un modelo válido. */
const DifusaEditor = (() => {
  let borrador = null, variableId = null, conjuntoId = null, opciones = {}, secuencia = 0;
  let filtroEstado = '', filtroCondicion = '';
  let posicionRegla = null;
  const fichasReglas = new Map();
  const dominiosCurvas = new Map();
  const textosBorrador = new Map();
  const $ = id => document.getElementById(id);
  const copiar = dato => JSON.parse(JSON.stringify(dato));
  const nuevoId = prefijo => prefijo + '_' + Date.now().toString(36) + '_' + (++secuencia);
  const nodo = (tipo, texto, clase) => { const e = document.createElement(tipo); if (texto !== undefined) e.textContent = texto; if (clase) e.className = clase; return e; };
  const modelo = () => borrador || DifusaEstado.estado.modelo;
  const variables = () => modelo().entradas.concat(modelo().salida);
  const actual = () => variables().find(v => v.id === variableId) || variables()[0];
  function editar(matematico) {
    if (document.activeElement?.closest?.('.difusa-regla-editor')) posicionRegla = { top: window.scrollY, left: window.scrollX };
    if (!borrador) borrador = copiar(DifusaEstado.estado.modelo);
    opciones.alBorrador(Boolean(matematico)); actualizarBarras();
    return borrador;
  }
  function aviso(texto) { opciones.notificar(texto); }
  async function confirmar(titulo, mensaje, textoAceptar) {
    return await dialogoConfirmar({ titulo, mensaje, textoAceptar: textoAceptar || 'Aplicar cambio' }) === true;
  }
  function campo(etiqueta, valor, id, tipo) {
    const caja = nodo('div', undefined, 'campo');
    const label = nodo('label', etiqueta, 'campo__etiqueta'); label.htmlFor = id;
    const input = nodo('input', undefined, 'entrada'); input.id = id; input.type = 'text';
    const claveTexto = id.startsWith('peso-') ? id : variableId + '|' + id;
    input.value = textosBorrador.has(claveTexto) ? textosBorrador.get(claveTexto) : valor;
    input.addEventListener('input', () => textosBorrador.set(claveTexto, input.value));
    if (tipo === 'numero') input.inputMode = 'decimal'; else input.maxLength = 40;
    const error = nodo('p', '', 'difusa-error'); error.id = id + '-error'; input.setAttribute('aria-describedby', error.id);
    caja.append(label, input, error); return { caja, input, error };
  }
  function selector(etiqueta, id, elementos, valor, alCambiar) {
    const caja = nodo('div', undefined, 'campo');
    const label = nodo('label', etiqueta, 'campo__etiqueta'); label.htmlFor = id;
    const select = nodo('select', undefined, 'entrada'); select.id = id;
    elementos.forEach(([clave, nombre]) => { const option = nodo('option', nombre); option.value = clave; select.append(option); });
    select.value = valor; select.addEventListener('change', () => alCambiar(select.value)); caja.append(label, select); return caja;
  }
  function boton(texto, accion, clase, id) {
    const b = nodo('button', texto, clase || 'btn btn-neutral'); b.type = 'button'; if (id) b.id = id; b.addEventListener('click', accion); return b;
  }
  function accionesBorrador() {
    const barra = nodo('div', undefined, 'difusa-aplicar');
    barra.append(nodo('span', borrador ? 'Borrador · Cambios sin aplicar. Los resultados corresponden al modelo Aplicado; si cambió la matemática, vuelve a evaluar.' : 'Aplicado · Configuración vigente.', 'difusa-pista'));
    const aplicar = boton('Aplicar configuración', aplicarCambios, 'btn btn-primary'); aplicar.disabled = !borrador; aplicar.dataset.aplicarDifusa = '';
    const cancelar = boton('Cancelar cambios', () => { borrador = null; dominiosCurvas.clear(); textosBorrador.clear(); opciones.alCancelar(); renderizar(); }, 'btn btn-neutral'); cancelar.disabled = !borrador;
    barra.append(aplicar, cancelar); return barra;
  }
  function actualizarBarras() {
    document.querySelectorAll('.difusa-aplicar').forEach(barra => barra.replaceWith(accionesBorrador()));
  }
  function validarCampos() {
    const validacion = DifusaModelo.validar(modelo(), { permitirBorradores: true });
    const errores = validacion.errores || [];
    document.querySelectorAll('[data-ruta-modelo]').forEach(input => {
      const error = errores.find(e => e.ruta === input.dataset.rutaModelo || e.ruta.startsWith(input.dataset.rutaModelo + '.') || input.dataset.rutaModelo.startsWith(e.ruta + '.'));
      input.setAttribute('aria-invalid', String(Boolean(error)));
      const pista = $(input.getAttribute('aria-describedby'));
      if (pista) pista.textContent = error ? error.mensaje : '';
    });
    return validacion;
  }
  function previsualizar() {
    const variable = actual(); if (!variable) return;
    $('tituloPreviewDifusa').textContent = variable.nombre || 'Vista previa de variable';
    const valido = Number.isFinite(variable.min) && Number.isFinite(variable.max) && variable.min < variable.max && variable.conjuntos.every(c =>
      c.parametros.every(Number.isFinite) && c.parametros.every((p, i, a) => p >= variable.min && p <= variable.max && (!i || p >= a[i - 1])) && c.parametros[0] < c.parametros[c.parametros.length - 1]);
    if (valido) {
      DifusaDibujo.variable($('previewVariableDifusa'), variable, null, 'previewDifusa', { conjuntoId });
      DifusaDibujo.leyenda($('leyendaPreviewDifusa'), variable);
      const cobertura = DifusaModelo.cobertura(variable);
      $('coberturaVariableDifusa').textContent = cobertura.completa ? 'Curvas: todo el dominio tiene alguna pertenencia positiva. Esto no garantiza cobertura de reglas.' :
        'Zonas sin pertenencia: ' + cobertura.huecos.map(h => (h.incluyeMin ? '[' : '(') + h.min + ', ' + h.max + (h.incluyeMax ? ']' : ')')).join('; ') + '. Puedes evaluar un sistema parcialmente cubierto.';
    } else {
      $('tituloPreviewDifusa').textContent = 'Última vista válida · ' + (variable.nombre || 'Variable');
      $('coberturaVariableDifusa').textContent = 'Última vista válida. Corrige los números, el orden y el dominio de las curvas del borrador.';
    }
    validarCampos(); actualizarBarras(); if (opciones.alResumen) opciones.alResumen();
  }
  function escribirNumero(input, error, asignar) {
    const lectura = DifusaModelo.leerNumero(input.value);
    editar(true); asignar(lectura.valido ? lectura.valor : null);
    error.textContent = lectura.valido ? '' : lectura.error;
    input.setAttribute('aria-invalid', String(!lectura.valido));
    previsualizar();
  }
  function renderVariables() {
    const caja = $('editorVariablesDifusa'); caja.replaceChildren();
    const m = modelo(); const variable = actual(); variableId = variable.id;
    if (!dominiosCurvas.has(variable.id)) dominiosCurvas.set(variable.id, [variable.min, variable.max]);
    caja.append(accionesBorrador());
    caja.append(nodo('p', (borrador ? 'Borrador' : 'Aplicado') + ' · Entradas ' + m.entradas.length + '/3 · Salida: ' + m.salida.nombre, 'difusa-pista'));
    caja.append(nodo('p', m.entradas.length === 3 ? 'Límite alcanzado: se admiten tres entradas y una salida independiente.' : 'Puedes añadir hasta tres entradas. La salida se configura por separado.', 'difusa-pista'));
    caja.append(selector('Variable a editar', 'variableActualDifusa', variables().map(v => [v.id, v.nombre + (v.id === m.salida.id ? ' · salida' : ' · entrada')]), variableId, id => { variableId = id; renderVariables(); }));
    caja.append(nodo('h3', variable.id === m.salida.id ? 'Salida · ' + variable.nombre : 'Entrada · ' + variable.nombre));
    if (variable.id !== m.salida.id) {
      const utilizadas = m.reglas.filter(r => r.activa && r.peso > 0 && r.antecedentes[variable.id] != null).length;
      caja.append(nodo('p', utilizadas + ' reglas habilitadas con peso mayor que cero utilizan esta entrada. ' + (!utilizadas ? 'Las reglas actuales ignoran esta entrada hasta que la utilices en sus condiciones. ' : '') + 'Participar en el modelo no garantiza influir en cada evaluación: depende de las activaciones y de la agregación.', 'difusa-pista'));
      caja.append(boton('Configurar reglas de esta entrada', () => {
        // Una entrada ignorada todavía no tiene reglas participantes: mostrar
        // todas permite empezar a utilizarla en lugar de abrir una lista vacía.
        filtroCondicion = ''; filtroEstado = '';
        if (opciones.alReglas) opciones.alReglas(); else renderReglas();
        const primera = modelo().reglas[0];
        if (primera) $('ant-' + primera.id + '-' + variable.id).focus({ preventScroll: true });
        else $('agregarReglaDifusa').focus();
        aviso('Configura las condiciones de ' + variable.nombre + '. «No importa» conserva la regla sin utilizar esta entrada.');
      }, undefined, 'btnReglasEntradaDifusa'));
    }
    const raizRuta = variable.id === m.salida.id ? 'salida' : 'entradas.' + m.entradas.findIndex(v => v.id === variable.id);
    const ficha = nodo('div', undefined, 'difusa-campos-variable');
    [['Nombre', 'nombre', 'nombreVariableDifusa'], ['Unidad (opcional)', 'unidad', 'unidadVariableDifusa'], ['Mínimo del dominio', 'min', 'minVariableDifusa'], ['Máximo del dominio', 'max', 'maxVariableDifusa']].forEach(([label, clave, id]) => {
      const numerico = clave === 'min' || clave === 'max';
      const control = campo(label, variable[clave] == null ? '' : variable[clave], id, numerico ? 'numero' : 'texto');
      control.input.dataset.rutaModelo = raizRuta + '.' + clave;
      control.input.addEventListener('input', () => {
        if (numerico) escribirNumero(control.input, control.error, valor => { variables().find(v => v.id === variableId)[clave] = valor; });
        else { editar(false); variables().find(v => v.id === variableId)[clave] = control.input.value; previsualizar(); }
      });
      ficha.append(control.caja);
    });
    caja.append(ficha);
    const acciones = nodo('div', undefined, 'difusa-acciones');
    acciones.append(boton('Reajustar curvas al rango', async () => {
      const v = actual(); const dominio = dominiosCurvas.get(v.id); const original = dominio && { min: dominio[0], max: dominio[1] };
      if (!original || !Number.isFinite(v.min) || !Number.isFinite(v.max) || v.min >= v.max) { aviso('Introduce un rango válido antes de reajustar.'); return; }
      if (!await confirmar('Reajustar curvas', 'Se escalarán explícitamente las curvas del dominio anterior [' + original.min + ', ' + original.max + '] al nuevo [' + v.min + ', ' + v.max + ']. Puedes cancelar todos los cambios antes de aplicarlos.')) return;
      editar(true); const destino = actual();
      destino.conjuntos.forEach(c => { c.parametros = c.parametros.map(p => Number.isFinite(p) ? v.min + (p - original.min) / (original.max - original.min) * (v.max - v.min) : null); });
      Array.from(textosBorrador.keys()).filter(k => k.startsWith(v.id + '|param-')).forEach(k => textosBorrador.delete(k));
      dominiosCurvas.set(v.id, [v.min, v.max]);
      renderizar();
    }));
    acciones.append(boton('Distribuir conjuntos automáticamente', async () => {
      if (!await confirmar('Propuesta editable', 'Se distribuirán los conjuntos con hombros en los extremos y triángulos interiores. Se conservan IDs y nombres. Es una propuesta editable, no una decisión calibrada.')) return;
      editar(true); const v = actual();
      if (!Number.isFinite(v.min) || !Number.isFinite(v.max) || v.min >= v.max) { aviso('Corrige el dominio antes de distribuir.'); return; }
      v.conjuntos = DifusaModelo.distribuirConjuntos(v); dominiosCurvas.set(v.id, [v.min, v.max]);
      Array.from(textosBorrador.keys()).filter(k => k.startsWith(v.id + '|param-')).forEach(k => textosBorrador.delete(k)); renderizar();
    }));
    if (variable.id !== m.salida.id) {
      const borrar = boton('Eliminar entrada', () => eliminarEntrada(variable.id)); borrar.disabled = m.entradas.length <= 1; acciones.append(borrar);
    }
    caja.append(acciones, nodo('p', 'Si un nuevo dominio deja curvas fuera de rango, reajústalas mediante la acción explícita o cancela el borrador. No se recortan parámetros automáticamente. Los valores de evaluación que queden fuera se marcarán pendientes al aplicar; un valor inicial incompatible se retirará.', 'difusa-pista'));
    const encabezado = nodo('div', undefined, 'difusa-cabecera-seccion'); encabezado.append(nodo('h3', 'Conjuntos (' + variable.conjuntos.length + '/5)'));
    const agregar = boton('Añadir conjunto', () => {
      editar(true); const v = actual(); const usados = v.conjuntos.map(c => c.nombre);
      let n = 1; while (usados.includes('Conjunto ' + n)) n++;
      v.conjuntos.push({ id: nuevoId('conjunto'), nombre: 'Conjunto ' + n, tipo: 'triangular', parametros: [v.min, (v.min + v.max) / 2, v.max] }); renderizar();
    }); agregar.disabled = variable.conjuntos.length >= 5; encabezado.append(agregar); caja.append(encabezado);
    variable.conjuntos.forEach((conjunto, indice) => {
      if (!variable.conjuntos.some(c => c.id === conjuntoId)) conjuntoId = variable.conjuntos[0].id;
      const card = nodo('details', undefined, 'difusa-conjunto-editor'); card.dataset.conjuntoId = conjunto.id; card.open = conjunto.id === conjuntoId;
      const resumen = nodo('summary', conjunto.nombre + ' · ' + conjunto.tipo); card.append(resumen);
      card.addEventListener('toggle', () => { if (card.open) { conjuntoId = conjunto.id; previsualizar(); } });
      const nombre = campo('Nombre del conjunto', conjunto.nombre, 'conjunto-' + conjunto.id);
      nombre.input.dataset.rutaModelo = raizRuta + '.conjuntos.' + indice + '.nombre';
      nombre.input.addEventListener('input', () => { editar(false); actual().conjuntos[indice].nombre = nombre.input.value; resumen.textContent = nombre.input.value + ' · ' + actual().conjuntos[indice].tipo; previsualizar(); });
      card.append(nombre.caja, selector('Función', 'tipo-' + conjunto.id, [['triangular', 'Triangular [a, b, c]'], ['trapezoidal', 'Trapezoidal [a, b, c, d]']], conjunto.tipo, tipo => {
        editar(true); const c = actual().conjuntos[indice], p = c.parametros;
        c.parametros = tipo === 'triangular' ? [p[0], Number.isFinite(p[1]) && Number.isFinite(p[2]) ? (p[1] + p[2]) / 2 : null, p[3]] : [p[0], p[1], p[1], p[2]]; c.tipo = tipo;
        Array.from(textosBorrador.keys()).filter(k => k.startsWith(variableId + '|param-' + c.id + '-')).forEach(k => textosBorrador.delete(k)); renderizar();
      }));
      const parametros = nodo('div', undefined, 'difusa-parametros');
      conjunto.parametros.forEach((valor, p) => {
        const control = campo(['a', 'b', 'c', 'd'][p], valor === null ? '' : valor, 'param-' + conjunto.id + '-' + p, 'numero');
        control.input.dataset.parametro = p; control.input.dataset.rutaModelo = raizRuta + '.conjuntos.' + indice + '.parametros.' + p;
        control.input.addEventListener('input', () => escribirNumero(control.input, control.error, numero => { actual().conjuntos[indice].parametros[p] = numero; })); parametros.append(control.caja);
      }); card.append(parametros, nodo('p', conjunto.tipo === 'triangular' ? 'a: inicio del soporte; b: pico (pertenencia 1); c: final del soporte. Se permite a = b o b = c para un hombro.' : 'a: inicio; b: comienzo de la meseta (pertenencia 1); c: final de la meseta; d: final del soporte. Los valores se ordenan de menor a mayor.', 'difusa-pista'));
      const borrar = boton('Eliminar conjunto', () => eliminarConjunto(variable.id, conjunto.id)); borrar.disabled = variable.conjuntos.length <= 2; card.append(borrar); caja.append(card);
    });
    previsualizar();
  }
  async function eliminarEntrada(id) {
    const m = modelo(); const afectadas = m.reglas.filter(r => r.antecedentes[id] != null);
    if (!await confirmar('Eliminar entrada', 'Se eliminará la entrada y estas reglas que la utilizan: ' + (afectadas.map(r => 'Regla ' + (m.reglas.indexOf(r) + 1)).join(', ') || 'ninguna') + '. Las demás reglas conservarán sus antecedentes. Si no queda ninguna regla deberás crear una antes de aplicar.', 'Eliminar entrada y reglas afectadas')) return;
    editar(true); borrador.entradas = borrador.entradas.filter(v => v.id !== id);
    borrador.reglas = borrador.reglas.filter(r => !afectadas.some(a => a.id === r.id)); borrador.reglas.forEach(r => delete r.antecedentes[id]);
    if (borrador.valoresIniciales) delete borrador.valoresIniciales[id]; variableId = borrador.entradas[0].id; renderizar();
  }
  async function eliminarConjunto(variable, conjunto) {
    const m = modelo(); const salida = variable === m.salida.id;
    const afectadas = m.reglas.filter(r => salida ? r.consecuente === conjunto : r.antecedentes[variable] === conjunto);
    if (!await confirmar('Eliminar conjunto', 'Reglas afectadas que se eliminarán: ' + (afectadas.map(r => 'Regla ' + (m.reglas.indexOf(r) + 1)).join(', ') || 'ninguna') + '. Puedes cancelar. Si no queda ninguna regla, crea una nueva antes de aplicar.', 'Eliminar conjunto y reglas afectadas')) return;
    editar(true); const v = variables().find(x => x.id === variable); v.conjuntos = v.conjuntos.filter(c => c.id !== conjunto);
    borrador.reglas = borrador.reglas.filter(r => !afectadas.some(a => a.id === r.id)); renderizar();
  }
  function nuevaRegla(m) {
    return { id: nuevoId('regla'), antecedentes: Object.fromEntries(m.entradas.map((v, i) => [v.id, i === 0 ? v.conjuntos[0].id : null])), conector: 'AND', consecuente: null, peso: 1, activa: true };
  }
  function actualizarResumenReglas() {
    const m = modelo(), validacion = DifusaModelo.validar(m, { permitirBorradores: true });
    const pendientes = (r, i) => r.consecuente === null || !m.entradas.some(v => r.antecedentes[v.id] != null) || (validacion.errores || []).some(e => e.ruta === 'reglas.' + i || e.ruta.startsWith('reglas.' + i + '.'));
    const avisada = i => (validacion.errores || []).concat(validacion.avisos || []).some(e => e.ruta === 'reglas.' + i || e.ruta.startsWith('reglas.' + i + '.'));
    $('resumenReglasDifusa').textContent = (borrador ? 'Borrador' : 'Aplicado') + ' · Completas: ' + m.reglas.filter((r, i) => !pendientes(r, i)).length + ' · Pendientes: ' + m.reglas.filter(pendientes).length + ' · Deshabilitadas: ' + m.reglas.filter(r => !r.activa).length + ' · Con avisos: ' + m.reglas.filter((r, i) => avisada(i)).length + '. Los contadores pueden solaparse.';
    $('combinacionesDifusa').textContent = m.entradas.map(v => v.conjuntos.length).join(' × ') + ' = ' + m.entradas.reduce((n, v) => n * v.conjuntos.length, 1) + ' combinaciones. Generarlas deja consecuentes pendientes y no demuestra cobertura numérica completa.';
    $('avisosReglasDifusa').textContent = (validacion.errores || []).concat(validacion.pendientes || [], validacion.avisos || []).map(e => e.mensaje || e).join(' · ') || 'Reglas coherentes. La cobertura de curvas no demuestra cobertura de todas las combinaciones de reglas.';
    m.reglas.forEach((r, i) => {
      const ficha = fichasReglas.get(r.id); if (!ficha) return;
      const condicion = filtroCondicion ? JSON.parse(filtroCondicion) : null;
      const coincide = (!filtroEstado || (filtroEstado === 'pendientes' ? pendientes(r, i) : avisada(i))) && (!condicion || (condicion[1] ? r.antecedentes[condicion[0]] === condicion[1] : r.antecedentes[condicion[0]] != null));
      // Una edición no oculta el control que se está utilizando.
      ficha.hidden = !coincide && !(ficha.contains && ficha.contains(document.activeElement));
    });
    validarCampos(); actualizarBarras(); if (opciones.alResumen) opciones.alResumen();
  }
  function enfocarRegla(id) { const control = $('conector-' + id); if (control) control.focus({ preventScroll: true }); }
  function renderReglas() {
    fichasReglas.clear();
    const contenedor = $('editorReglasDifusa'); contenedor.replaceChildren(accionesBorrador());
    const m = modelo(); const validacion = DifusaModelo.validar(m, { permitirBorradores: true });
    $('avisosReglasDifusa').textContent = (validacion.errores || []).concat(validacion.pendientes || [], validacion.avisos || []).map(e => e.mensaje || e).join(' · ') || 'Reglas coherentes. La cobertura de curvas no demuestra cobertura de todas las combinaciones de reglas.';
    m.reglas.forEach((regla, indice) => {
      const card = nodo('article', undefined, 'difusa-regla-editor'); card.dataset.reglaId = regla.id;
      fichasReglas.set(regla.id, card);
      const refrescar = () => {
        const r = modelo().reglas.find(x => x.id === regla.id);
        texto.textContent = 'SI ' + modelo().entradas.filter(v => r.antecedentes[v.id]).map(v => v.nombre + ' ES ' + (v.conjuntos.find(c => c.id === r.antecedentes[v.id]) || { nombre: 'referencia inexistente' }).nombre).join(r.conector === 'OR' ? ' O ' : ' Y ') + ' ENTONCES ' + modelo().salida.nombre + ' ES ' + ((modelo().salida.conjuntos.find(c => c.id === r.consecuente) || { nombre: 'pendiente' }).nombre) + '.';
        actualizarResumenReglas();
        // Las barras y avisos pueden cambiar de altura por encima de la regla.
        // El control sigue siendo el mismo; conserva además el desplazamiento.
        if (posicionRegla && typeof window.scrollTo === 'function') {
          window.scrollTo({ ...posicionRegla, behavior: 'instant' }); posicionRegla = null;
        }
      };
      const cabecera = nodo('div', undefined, 'difusa-cabecera-seccion'); cabecera.append(nodo('h3', 'Regla ' + (indice + 1) + ' · ' + regla.id));
      const activar = nodo('label', undefined, 'difusa-checkbox'); const check = nodo('input'); check.type = 'checkbox'; check.checked = regla.activa;
      check.id = 'activa-' + regla.id;
      check.addEventListener('change', () => { editar(true); borrador.reglas[indice].activa = check.checked; refrescar(); }); activar.append(check, document.createTextNode(' Habilitada')); cabecera.append(activar); card.append(cabecera);
      const campos = nodo('div', undefined, 'difusa-regla-campos');
      m.entradas.forEach(v => campos.append(selector('SI ' + v.nombre + ' ES', 'ant-' + regla.id + '-' + v.id, [['', 'No importa'], ...v.conjuntos.map(c => [c.id, c.nombre])], regla.antecedentes[v.id] || '', valor => {
        editar(true); borrador.reglas[indice].antecedentes[v.id] = valor || null; refrescar();
      })));
      campos.append(selector('Conector', 'conector-' + regla.id, [['AND', 'Y (AND · mínimo)'], ['OR', 'O (OR · máximo)']], regla.conector, valor => { editar(true); borrador.reglas[indice].conector = valor; refrescar(); }));
      campos.append(selector('ENTONCES ' + m.salida.nombre + ' ES', 'cons-' + regla.id, [['', 'Seleccionar consecuente…'], ...m.salida.conjuntos.map(c => [c.id, c.nombre])], regla.consecuente || '', valor => { editar(true); borrador.reglas[indice].consecuente = valor || null; refrescar(); }));
      const peso = campo('Peso (0 a 1)', regla.peso === null ? '' : regla.peso, 'peso-' + regla.id, 'numero'); peso.input.dataset.rutaModelo = 'reglas.' + indice + '.peso';
      peso.input.addEventListener('input', () => { const lectura = DifusaModelo.leerNumero(peso.input.value); editar(true); borrador.reglas[indice].peso = lectura.valido ? lectura.valor : null; refrescar(); }); campos.append(peso.caja); card.append(campos);
      const texto = nodo('p', 'SI ' + m.entradas.filter(v => regla.antecedentes[v.id]).map(v => v.nombre + ' ES ' + (v.conjuntos.find(c => c.id === regla.antecedentes[v.id]) || { nombre: 'referencia inexistente' }).nombre).join(regla.conector === 'OR' ? ' O ' : ' Y ') + ' ENTONCES ' + m.salida.nombre + ' ES ' + ((m.salida.conjuntos.find(c => c.id === regla.consecuente) || { nombre: 'pendiente' }).nombre) + '.', 'difusa-pista'); card.append(texto);
      const acciones = nodo('div', undefined, 'difusa-acciones');
      const duplicar = boton('Duplicar como borrador', () => { editar(true); const copia = copiar(borrador.reglas[indice]); copia.id = nuevoId('regla'); copia.consecuente = null; borrador.reglas.splice(indice + 1, 0, copia); filtroEstado = ''; filtroCondicion = ''; renderReglas(); enfocarRegla(copia.id); }); duplicar.disabled = m.reglas.length >= 125;
      acciones.append(duplicar, boton('Eliminar regla', async () => { if (!await confirmar('Eliminar regla', 'Se eliminará la regla ' + (indice + 1) + '. El cambio queda como borrador hasta aplicar.')) return; editar(true); borrador.reglas.splice(indice, 1); filtroEstado = ''; filtroCondicion = ''; renderReglas(); const vecina = borrador.reglas[Math.min(indice, borrador.reglas.length - 1)]; if (vecina) enfocarRegla(vecina.id); else $('agregarReglaDifusa').focus(); })); card.append(acciones); contenedor.append(card);
    });
    $('agregarReglaDifusa').disabled = m.reglas.length >= 125;
    const filtros = $('filtrosReglasDifusa'); filtros.replaceChildren();
    filtros.append(selector('Mostrar reglas', 'filtroEstadoDifusa', [['', 'Todas'], ['pendientes', 'Pendientes'], ['avisos', 'Con avisos']], filtroEstado, valor => { filtroEstado = valor; actualizarResumenReglas(); }));
    filtros.append(selector('Entrada / conjunto utilizado', 'filtroCondicionDifusa', [['', 'Cualquier condición'], ...m.entradas.flatMap(v => [[JSON.stringify([v.id, '']), v.nombre + ' · cualquier conjunto'], ...v.conjuntos.map(c => [JSON.stringify([v.id, c.id]), v.nombre + ' / ' + c.nombre])])], filtroCondicion, valor => { filtroCondicion = valor; actualizarResumenReglas(); }));
    actualizarResumenReglas();
  }
  function aplicarCambios() {
    if (!borrador) return;
    variables().forEach(v => { v.nombre = v.nombre.trim(); v.unidad = (v.unidad || '').trim(); v.conjuntos.forEach(c => { c.nombre = c.nombre.trim(); }); });
    // Los valores de evaluación fuera del dominio quedan pendientes en estado.js.
    // Un valor inicial anterior ya incompatible se retira, nunca se limita.
    if (borrador.valoresIniciales) borrador.entradas.forEach(v => { const inicial = borrador.valoresIniciales[v.id]; if (inicial < v.min || inicial > v.max) delete borrador.valoresIniciales[v.id]; });
    const resultado = DifusaEstado.aplicarModelo(borrador);
    if (!resultado.ok) { aviso((resultado.errores || []).map(e => e.mensaje || e).join(' · ')); validarCampos(); return; }
    borrador = null; dominiosCurvas.clear(); textosBorrador.clear(); aviso('Configuración aplicada. Revisa los datos pendientes antes de evaluar.'); opciones.alCambiar(); renderizar();
  }
  function renderizar() { renderVariables(); renderReglas(); $('agregarEntradaDifusa').disabled = modelo().entradas.length >= 3; }
  async function generarCombinaciones() {
    try {
      const validacion = validarCampos();
      const errores = validacion.errores.filter(e => /^(entradas|salida)(\.|$)/.test(e.ruta));
      if (errores.length) {
        const primera = errores[0], entrada = /^entradas\.(\d+)/.exec(primera.ruta);
        variableId = entrada ? modelo().entradas[Number(entrada[1])].id : modelo().salida.id;
        renderVariables(); validarCampos();
        if (typeof opciones.alErrorVariables === 'function') opciones.alErrorVariables();
        const campoError = document.querySelector('[data-ruta-modelo="' + primera.ruta + '"]');
        if (campoError) campoError.focus();
        aviso('Corrige las variables y conjuntos antes de generar: ' + errores.map(e => e.ruta + ': ' + e.mensaje).join(' · '));
        return false;
      }
      const firma = JSON.stringify(modelo());
      const cantidad = modelo().entradas.map(v => v.conjuntos.length).join(' × ') + ' = ' + modelo().entradas.reduce((n, v) => n * v.conjuntos.length, 1);
      if (modelo().reglas.length && !await confirmar('Reemplazar reglas', 'Se reemplazarán las ' + modelo().reglas.length + ' reglas por ' + cantidad + ' combinaciones. Los consecuentes quedarán pendientes: debes escogerlos tú.', 'Generar y reemplazar')) return false;
      if (firma !== JSON.stringify(modelo())) { aviso('La configuración cambió durante el diálogo. Revisa los campos y vuelve a generar.'); return false; }
      // Generar primero, sin mutar el borrador ni el modelo aplicado si falla.
      const nuevas = DifusaModelo.generarCombinaciones(modelo());
      editar(true); borrador.reglas = nuevas; renderReglas();
      return true;
    } catch (error) {
      aviso('No se generaron las combinaciones: ' + (error && error.message ? error.message : 'revisa las variables y conjuntos') + '. El sistema aplicado se conserva.');
      validarCampos();
      return false;
    }
  }
  function inicializar(config) {
    opciones = config;
    $('agregarEntradaDifusa').addEventListener('click', () => {
      if (modelo().entradas.length >= 3) return;
      editar(true); const usados = variables().map(v => v.nombre); let n = 1; while (usados.includes('Entrada ' + n)) n++;
      const v = { id: nuevoId('entrada'), nombre: 'Entrada ' + n, unidad: '', min: 0, max: 10, conjuntos: [] };
      v.conjuntos = DifusaModelo.distribuirConjuntos(v, 3); borrador.entradas.push(v); borrador.reglas.forEach(r => { r.antecedentes[v.id] = null; });
      variableId = v.id; renderizar(); $('nombreVariableDifusa').focus({ preventScroll: true }); $('nombreVariableDifusa').select?.();
      aviso('Las reglas actuales ignoran esta entrada hasta que la utilices en sus condiciones. Su valor de evaluación queda pendiente.');
    });
    $('agregarReglaDifusa').addEventListener('click', () => { if (modelo().reglas.length >= 125) return; editar(true); borrador.reglas.push(nuevaRegla(borrador)); renderReglas(); });
    $('generarCombinacionesDifusa').addEventListener('click', generarCombinaciones);
    renderizar();
  }
  return { inicializar, renderizar, generarCombinaciones, obtenerModeloEditor: () => modelo(), tieneBorradores: () => Boolean(borrador), reiniciar: () => { borrador = null; variableId = null; conjuntoId = null; filtroEstado = ''; filtroCondicion = ''; dominiosCurvas.clear(); textosBorrador.clear(); renderizar(); } };
})();
