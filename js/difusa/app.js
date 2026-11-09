/* Control de vistas, evaluación y trabajos. El motor y el editor son independientes. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), estado = DifusaEstado.estado;
  const fmt = (n, d = 5) => new Intl.NumberFormat('es', Math.abs(n) > 0 && Math.abs(n) < 1e-5 ? { notation: 'scientific', maximumSignificantDigits: 8 } : { maximumFractionDigits: d }).format(n);
  const el = (tag, texto, clase) => { const e = document.createElement(tag); if (texto !== undefined) e.textContent = texto; if (clase) e.className = clase; return e; };
  const vistas = ['inicio', 'variables', 'reglas', 'evaluar', 'resultado'];
  let auxiliar = null, mapa = null, mapaEjes = {}, mapaRevision = 0;
  const valoresEscritos = new Map();
  function notificar(texto) { $('estadoDifusa').textContent = texto; }
  function mensajeError(error) { return error && error.errores ? error.errores.map(e => e.mensaje || e).join(' · ') : error.message || String(error); }
  async function confirmarReemplazo(mensaje) {
    if (!estado.modificado && !DifusaEditor.tieneBorradores()) return true;
    return await dialogoConfirmar({ titulo: 'Reemplazar el sistema actual', mensaje: mensaje || 'Se sustituirán tu sistema y los valores actuales. Guarda un trabajo o exporta su JSON si quieres conservarlos.', textoAceptar: 'Reemplazar' }) === true;
  }
  function descargar(nombre, contenido, tipo) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo || 'application/json' }));
    const enlace = el('a'); enlace.href = url; enlace.download = nombre; document.body.append(enlace); enlace.click(); enlace.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function almacenamiento() { $('almacenamientoDifusa').textContent = estado.aviso; $('proteccionDifusa').hidden = !estado.almacenamientoProtegido; }
  function preparacion() {
    const m = estado.modelo, v = DifusaModelo.validar(m, { permitirBorradores: true });
    const activas = m.reglas.filter(r => r.activa && r.peso > 0 && r.consecuente !== null).length;
    const faltantes = m.entradas.filter(x => !Number.isFinite(estado.valores[x.id])).length;
    const borrador = DifusaEditor.tieneBorradores();
    const problemas = [].concat(v.errores || [], (v.pendientes || []).filter(p => p.activa), (estado.errores || []).filter(e => e.ruta && e.ruta.startsWith('valores.')));
    $('preparacionDifusa').textContent = m.nombre + ' · ' + m.entradas.length + ' entradas · ' + m.entradas.concat(m.salida).reduce((n, x) => n + x.conjuntos.length, 0) + ' conjuntos · ' + activas + '/' + m.reglas.length + ' reglas habilitadas con peso positivo y consecuente. ' +
      (borrador ? 'Aplica o cancela los cambios del editor.' : problemas.length ? problemas.map(p => p.mensaje || p).join(' · ') : faltantes ? faltantes + ' valores de entrada pendientes.' : 'Configuración lista para evaluar.');
    $('evaluarDifusa').disabled = borrador || !v.listo || (estado.errores || []).some(e => e.ruta && e.ruta.startsWith('valores.'));
    $('generarMapaDifusa').disabled = borrador || !v.listo || DifusaMapa.activo();
    const cobertura = m.entradas.concat(m.salida).map(variable => {
      const c = DifusaModelo.cobertura(variable);
      return variable.nombre + ': ' + (c.completa ? 'curvas sin huecos' : c.huecos.length + ' zona(s) sin pertenencia');
    });
    $('coberturaSistemaDifusa').textContent = cobertura.join(' · ') + '. La cobertura de curvas se analiza por tramos; no demuestra cobertura de reglas. Puedes evaluar un sistema parcialmente cubierto. ' + (v.avisos || []).map(a => a.mensaje || a).join(' · ');
    almacenamiento();
  }
  function mostrarVista(enfocar) {
    vistas.forEach(vista => { $('vista-' + vista).hidden = Boolean(auxiliar) || estado.vista !== vista; });
    $('panelTrabajosDifusa').hidden = auxiliar !== 'trabajos'; $('ayudaDifusa').hidden = auxiliar !== 'ayuda';
    document.querySelectorAll('[data-vista]').forEach(b => { if (!auxiliar && b.dataset.vista === estado.vista) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if (enfocar) {
      const seccion = auxiliar ? $(auxiliar === 'trabajos' ? 'panelTrabajosDifusa' : 'ayudaDifusa') : $('vista-' + estado.vista);
      const h2 = seccion.querySelector('h2'); h2.focus({ preventScroll: true });
      seccion.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  function ir(vista, enfocar = true) { auxiliar = null; DifusaEstado.cambiarVista(vista); if (vista === 'variables' || vista === 'reglas') DifusaEditor.renderizar(); mostrarVista(enfocar); if (vista === 'resultado') renderResultado(); preparacion(); }
  function cancelarMapa(texto, borrar) {
    if (DifusaMapa.activo()) { DifusaMapa.cancelar(); $('estadoMapaDifusa').textContent = texto || 'Mapa cancelado.'; }
    if (borrar) { mapa = null; $('graficaMapaDifusa').replaceChildren(); $('estadoMapaDifusa').textContent = texto || 'El modelo cambió. Genera un mapa nuevo cuando lo necesites.'; }
    $('cancelarMapaDifusa').disabled = true; mapaRevision++; preparacion();
  }
  function invalidaPorEdicion() {
    DifusaEstado.invalidar(); cancelarMapa('El modelo se está editando. Se descartó el mapa anterior.', true); renderResultado(); preparacion();
  }
  function renderControles() {
    const contenedor = $('controlesEntradasDifusa'); contenedor.replaceChildren();
    estado.modelo.entradas.forEach(v => {
      const ficha = el('div', undefined, 'difusa-entrada');
      const id = 'valor-' + v.id, idRango = 'rango-' + v.id;
      const label = el('label', v.nombre + (v.unidad ? ' (' + v.unidad + ')' : ''), 'campo__etiqueta'); label.htmlFor = id;
      const numero = el('input', undefined, 'entrada'); numero.type = 'text'; numero.inputMode = 'decimal'; numero.autocomplete = 'off'; numero.id = id; numero.dataset.entradaId = v.id; numero.dataset.valorDifusa = v.id; numero.setAttribute('aria-describedby', 'error-' + v.id + ' dominio-' + v.id);
      const inicial = estado.valores[v.id]; numero.value = valoresEscritos.has(v.id) ? valoresEscritos.get(v.id) : inicial == null ? '' : String(inicial);
      const rangoLabel = el('label', 'Ajustar ' + v.nombre, 'difusa-solo-lector'); rangoLabel.htmlFor = idRango;
      const rango = el('input'); rango.type = 'range'; rango.id = idRango; rango.dataset.rangoDifusa = v.id; rango.min = v.min; rango.max = v.max; rango.step = 'any'; rango.value = Number.isFinite(inicial) ? inicial : v.min + (v.max - v.min) / 2; rango.disabled = inicial === null; rango.setAttribute('aria-describedby', 'dominio-' + v.id);
      const paso = (v.max - v.min) / 1000;
      const dominio = el('p', fmt(v.min) + ' — ' + fmt(v.max) + (v.unidad ? ' ' + v.unidad : '') + '. Deslizador: incrementos de ' + fmt(paso, 10) + '; el campo conserva el número escrito.', 'difusa-pista'); dominio.id = 'dominio-' + v.id;
      const error = el('p', '', 'difusa-error'); error.id = 'error-' + v.id; error.setAttribute('role', 'alert');
      function sincronizar(desdeRango) {
        if (desdeRango) { const candidato = Number(rango.value), escalado = v.min + Math.round((candidato - v.min) / paso) * paso; numero.value = String(Math.max(v.min, Math.min(v.max, Number(escalado.toPrecision(14))))); }
        valoresEscritos.set(v.id, numero.value);
        const validacion = DifusaEstado.actualizarValor(v.id, numero.value);
        error.textContent = validacion.ok ? '' : validacion.error; numero.setAttribute('aria-invalid', String(!validacion.ok)); rango.disabled = !validacion.ok;
        if (validacion.ok) { rango.value = validacion.valor; rango.setAttribute('aria-valuetext', fmt(validacion.valor, 10) + (v.unidad ? ' ' + v.unidad : '')); }
        renderResultado(); preparacion(); notificar('Valores modificados. Pulsa Evaluar para ver el procedimiento de esta entrada.');
      }
      numero.addEventListener('input', () => sincronizar(false)); rango.addEventListener('input', () => sincronizar(true));
      rango.addEventListener('keydown', evento => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(evento.key)) return;
        evento.preventDefault(); const actual = Number(rango.value);
        rango.value = evento.key === 'Home' ? v.min : evento.key === 'End' ? v.max : Math.max(v.min, Math.min(v.max, actual + (['ArrowLeft', 'ArrowDown'].includes(evento.key) ? -paso : paso)));
        sincronizar(true);
      });
      ficha.append(label, numero, rangoLabel, rango, dominio, error); contenedor.append(ficha);
    });
    $('ejemplosRapidosDifusa').hidden = estado.modelo.id !== 'ayuda' || estado.modelo.entradas.length !== 2;
  }
  function datosSalida() { return estado.modelo.salida; }
  function etiquetasResultado(resultado) { return resultado.etiquetas.map(id => (datosSalida().conjuntos.find(c => c.id === id) || { nombre: id }).nombre).join(' / '); }
  function renderEntradasResultado(resultado) {
    const graficas = $('graficasEntradasDifusa'), tabla = $('tablaPertenencias'); graficas.replaceChildren(); tabla.replaceChildren();
    estado.modelo.entradas.forEach(v => {
      const figura = el('figure', undefined, 'difusa-figura'), caption = el('figcaption', v.nombre + ' = ' + fmt(resultado.entradas[v.id]) + (v.unidad ? ' ' + v.unidad : ''));
      const grafica = el('div'), leyenda = el('div', undefined, 'difusa-leyenda'); figura.append(caption, grafica, leyenda); graficas.append(figura);
      DifusaDibujo.variable(grafica, v, resultado.entradas[v.id], 'evaluada-' + v.id); DifusaDibujo.leyenda(leyenda, v);
      v.conjuntos.forEach(c => { const fila = el('tr'), h = el('th', v.nombre + ' = ' + fmt(resultado.entradas[v.id])); h.scope = 'row'; fila.append(h, el('td', c.nombre), el('td', fmt(resultado.pertenencias[v.id][c.id]))); tabla.append(fila); });
    });
  }
  function renderReglasResultado(resultado) {
    const tabla = $('tablaReglas'); tabla.replaceChildren();
    resultado.reglas.forEach((r, i) => {
      const fila = el('tr'); fila.dataset.activa = String(r.activacion > 0); fila.dataset.reglaId = r.id;
      const cabecera = el('th', 'R' + (i + 1)); cabecera.scope = 'row'; cabecera.append(el('small', r.activacion > 0 ? '● Activa' : r.habilitada ? '○ Sin activación' : '○ Deshabilitada'));
      const antecedentes = r.antecedentes.map(a => {
        const v = estado.modelo.entradas.find(x => x.id === a.variableId);
        return a.conjuntoId === null ? v.nombre + ': No importa' : v.nombre + ' / ' + v.conjuntos.find(c => c.id === a.conjuntoId).nombre + ': ' + fmt(a.grado);
      });
      const usados = r.antecedentes.filter(a => a.grado !== null).map(a => fmt(a.grado));
      const operacion = (r.conector === 'AND' ? 'mínimo' : 'máximo') + '(' + usados.join('; ') + ') = ' + fmt(r.activacionAntecedente) + '; × peso ' + fmt(r.peso) + ' = ' + fmt(r.activacionAntecedente * r.peso) + (r.habilitada ? '' : '; deshabilitada → 0') + '. Activación final: ' + fmt(r.activacion);
      const c = datosSalida().conjuntos.find(c => c.id === r.consecuente);
      fila.append(cabecera, el('td', antecedentes.join(' · ')), el('td', operacion), el('td', c ? c.nombre : 'Borrador deshabilitado')); tabla.append(fila);
    });
  }
  function renderConsulta() {
    const resultado = estado.resultado; if (!resultado) return;
    const indice = Number.isInteger(estado.seleccion.puntoIndice) ? estado.seleccion.puntoIndice : 500;
    const regla = resultado.reglas.find(r => r.id === estado.seleccion.reglaId) || resultado.reglas[0];
    if (!regla) return;
    if (estado.seleccion.reglaId !== regla.id) DifusaEstado.seleccionarRegla(regla.id);
    if (estado.seleccion.puntoIndice !== indice) DifusaEstado.seleccionarPunto(indice);
    $('seleccionReglaDifusa').value = regla.id; $('puntoSalidaDifusa').value = indice;
    const y = resultado.puntos[indice], v = datosSalida(), consecuente = v.conjuntos.find(c => c.id === regla.consecuente);
    $('valorPuntoSalidaDifusa').textContent = 'y = ' + fmt(y, 8) + (v.unidad ? ' ' + v.unidad : '');
    const grado = consecuente ? DifusaMotor.pertenenciasVariable(v, y)[consecuente.id] : 0;
    $('explicacionRecorteDifusa').textContent = 'Regla ' + (resultado.reglas.indexOf(regla) + 1) + ': ' + (consecuente ? consecuente.nombre : 'sin consecuente habilitado') + '. En y = ' + fmt(y, 8) + ': mínimo(activación ' + fmt(regla.activacion) + '; pertenencia ' + fmt(grado) + ') = ' + fmt(regla.recortada[indice]) + '.';
    $('consultaPuntoDifusa').textContent = 'Agregación en y = ' + fmt(y, 8) + ': máximo(' + resultado.reglas.map(r => fmt(r.recortada[indice])).join('; ') + ') = ' + fmt(resultado.agregada[indice]) + '.';
    DifusaDibujo.variable($('graficaSalida'), v, resultado.centroide.valor, 'salidaDifusa', { resultado, regla, indice }); DifusaDibujo.leyenda($('leyendaSalidaDifusa'), v, true);
  }
  function renderResultado() {
    const r = estado.resultado, resumen = $('resumenResultado'); resumen.replaceChildren(); $('procedimientoVigenteDifusa').hidden = !r;
    if (!r) { resumen.append(el('p', estado.pendiente ? 'Resultado pendiente de recalcular. Evalúa los valores y la configuración actuales.' : 'Todavía no hay una evaluación. Completa los datos y pulsa Evaluar.')); $('tablaReglas').replaceChildren(); $('tablaPertenencias').replaceChildren(); return; }
    if (r.centroide.valor === null) resumen.append(el('strong', r.centroide.estado === 'sin-reglas-activas' ? 'Sin reglas activas para estas entradas' : r.centroide.estado === 'activacion-sin-masa' ? 'Activación positiva sin masa de salida' : 'Limitación numérica de la evaluación'), el('p', r.centroide.mensaje));
    else {
      const precision = Math.min(12, Math.max(5, Math.ceil(-Math.log10(datosSalida().max - datosSalida().min)) + 2));
      const numero = el('output', fmt(r.centroide.valor, precision) + (datosSalida().unidad ? ' ' + datosSalida().unidad : ''), 'difusa-valor'); numero.id = 'valorResultadoDifusa';
      resumen.append(numero, el('p', datosSalida().nombre + ' · rango ' + fmt(datosSalida().min) + ' a ' + fmt(datosSalida().max)));
      resumen.append(el('p', r.sinEtiqueta ? 'Ningún conjunto de salida contiene el centroide. Se mantiene el valor numérico sin asignar una etiqueta.' : 'Interpretación adicional: ' + etiquetasResultado(r) + '.'));
      resumen.append(el('p', datosSalida().conjuntos.map(c => c.nombre + ': ' + fmt(r.pertenenciasResultado[c.id])).join(' · '), 'difusa-pista'));
    }
    renderEntradasResultado(r); renderReglasResultado(r);
    const selector = $('seleccionReglaDifusa'); selector.replaceChildren();
    r.reglas.forEach((regla, i) => { const option = el('option', 'Regla ' + (i + 1) + ' · activación ' + fmt(regla.activacion)); option.value = regla.id; selector.append(option); });
    renderConsulta();
    const calculo = $('calculoCentroide'); calculo.replaceChildren();
    calculo.append(el('p', 'Centroide continuo: se integra la envolvente agregada por tramos lineales, incluidos nudos, recortes e intersecciones. ' + r.tramos.length + ' tramos.'));
    calculo.append(el('p', 'Primer momento ∫ y μ(y) dy = ' + fmt(r.centroide.numerador, 10)), el('p', 'Área ∫ μ(y) dy = ' + fmt(r.centroide.denominador, 10)));
    calculo.append(el('p', r.centroide.valor === null ? r.centroide.mensaje : 'Centroide = primer momento / área = ' + fmt(r.centroide.valor, 10)));
    calculo.append(el('p', 'La gráfica usa los segmentos de la integral, incluso para consecuentes estrechos. Los 1001 puntos uniformes del deslizador son solo consultas auxiliares y no determinan el centroide. Pueden existir salidas válidas entre esos puntos. Solo se redondea la presentación.'));
    const pasos = $('pasosDifusa'); pasos.replaceChildren();
    r.pasos.forEach(paso => { const fila = el('li'); fila.append(el('strong', paso.titulo + '. '), document.createTextNode(paso.descripcion)); pasos.append(fila); });
  }
  function renderMapaControles() {
    const m = estado.modelo, contenedor = $('controlesMapaDifusa'); contenedor.replaceChildren();
    if (!m.entradas.some(v => v.id === mapaEjes.x)) mapaEjes.x = m.entradas[0].id;
    if (!m.entradas.some(v => v.id === mapaEjes.y) || mapaEjes.y === mapaEjes.x) mapaEjes.y = m.entradas.find(v => v.id !== mapaEjes.x)?.id;
    function eje(label, id, valor, alCambiar) {
      const caja = el('div', undefined, 'campo'), etiqueta = el('label', label, 'campo__etiqueta'); etiqueta.htmlFor = id;
      const select = el('select', undefined, 'entrada'); select.id = id; m.entradas.forEach(v => { const option = el('option', v.nombre); option.value = v.id; select.append(option); }); select.value = valor;
      select.addEventListener('change', () => { cancelarMapa('Cambiaste los ejes. Genera un mapa nuevo.', true); alCambiar(select.value); renderMapaControles(); }); caja.append(etiqueta, select); contenedor.append(caja);
    }
    if (m.entradas.length > 1) { eje('Eje horizontal', 'mapaEjeX', mapaEjes.x, id => { mapaEjes.x = id; }); eje('Eje vertical', 'mapaEjeY', mapaEjes.y, id => { mapaEjes.y = id; }); }
    else contenedor.append(el('p', 'Una entrada: se mostrará la curva ' + m.entradas[0].nombre + ' → ' + m.salida.nombre + '.'));
    m.entradas.filter(v => v.id !== mapaEjes.x && v.id !== mapaEjes.y).forEach(v => {
      const caja = el('div', undefined, 'campo'), label = el('label', v.nombre + ' fijo (' + v.min + '–' + v.max + (v.unidad ? ' ' + v.unidad : '') + ')', 'campo__etiqueta'); label.htmlFor = 'mapaFijo-' + v.id;
      const input = el('input', undefined, 'entrada'); input.type = 'text'; input.inputMode = 'decimal'; input.id = 'mapaFijo-' + v.id; input.dataset.mapaFijo = v.id; input.value = Number.isFinite(estado.valores[v.id]) ? estado.valores[v.id] : '';
      input.addEventListener('input', () => cancelarMapa('Cambiaste el valor fijo. Genera un mapa nuevo.', true)); caja.append(label, input); contenedor.append(caja);
    });
  }
  async function generarMapa() {
    if (DifusaEditor.tieneBorradores()) { notificar('Aplica o cancela el borrador antes de generar el mapa.'); return; }
    const revision = ++mapaRevision;
    const valores = { ...estado.valores }; document.querySelectorAll('[data-mapa-fijo]').forEach(input => { valores[input.dataset.mapaFijo] = input.value; });
    $('generarMapaDifusa').disabled = true; $('cancelarMapaDifusa').disabled = false; $('graficaMapaDifusa').replaceChildren(); mapa = null;
    try {
      const resultado = await DifusaMapa.generar({ modelo: estado.modelo, valores, ejeX: mapaEjes.x, ejeY: estado.modelo.entradas.length > 1 ? mapaEjes.y : null,
        estaVigente: firma => revision === mapaRevision && firma === DifusaModelo.firmaMatematica(estado.modelo),
        progreso: (n, total) => { $('estadoMapaDifusa').textContent = 'Calculando ' + n + ' de ' + total + ' puntos… Puedes cancelar y seguir evaluando.'; } });
      if (revision !== mapaRevision) return;
      if (resultado.estado === 'completo') {
        mapa = resultado.datos; DifusaDibujo.mapa($('graficaMapaDifusa'), mapa, estado.modelo);
        const fijados = mapa.fijos.map(f => f.nombre + ' = ' + f.valor).join('; ');
        $('estadoMapaDifusa').textContent = (mapa.ejeY ? 'Mapa 15 × 15' : 'Curva de 101 puntos') + ' · ' + mapa.sinSalida + ' puntos sin salida (×).' + (fijados ? ' Valor fijo: ' + fijados + '.' : '') + ' Entradas por muestreo; cada salida usa el centroide continuo. Diagnósticos: ' + Object.entries(mapa.diagnosticos).map(([estado, cantidad]) => estado + ': ' + cantidad).join('; ') + '.';
      } else $('estadoMapaDifusa').textContent = 'Mapa cancelado.';
    } catch (error) { $('estadoMapaDifusa').textContent = mensajeError(error); }
    finally { if (revision === mapaRevision) { $('cancelarMapaDifusa').disabled = true; preparacion(); } }
  }
  function refrescar(reiniciarEditor) {
    if (reiniciarEditor) { valoresEscritos.clear(); DifusaEditor.reiniciar(); }
    renderControles(); renderResultado(); renderMapaControles(); preparacion(); mostrarVista(false);
    if (mapa && mapa.firma === DifusaModelo.firmaMatematica(estado.modelo)) DifusaDibujo.mapa($('graficaMapaDifusa'), mapa, estado.modelo);
  }
  function asegurarAplicado() {
    if (DifusaEditor.tieneBorradores()) { notificar('Aplica o cancela los cambios del editor antes de guardar, exportar o evaluar.'); return false; }
    const invalidos = Array.from(document.querySelectorAll('[data-entrada-id]')).some(input => input.getAttribute('aria-invalid') === 'true');
    if (invalidos) { notificar('Corrige los valores de entrada antes de guardar o exportar.'); return false; } return true;
  }
  async function evaluar() {
    if (!asegurarAplicado()) return;
    try { const resultado = DifusaEstado.evaluar(); notificar(resultado.centroide.valor === null ? resultado.centroide.mensaje : 'Evaluación vigente. Consulta las pertenencias, reglas, recortes y centroide continuo.'); renderResultado(); ir('resultado'); }
    catch (error) { estado.errores = error.errores || [{ mensaje: error.message }]; notificar(mensajeError(error)); preparacion(); }
  }
  function renderTrabajos() {
    const lista = $('listaTrabajosDifusa'); lista.replaceChildren(); const trabajos = DifusaEstado.listarTrabajos();
    if (!trabajos.length) lista.append(el('p', 'Todavía no hay trabajos guardados en este navegador.'));
    trabajos.forEach(t => {
      const card = el('article', undefined, 'difusa-trabajo'); card.append(el('h3', t.nombre));
      const acciones = el('div', undefined, 'difusa-acciones');
      [['Cargar', async () => {
        if (!await confirmarReemplazo()) return; const r = DifusaEstado.cargarTrabajo(t.id); if (!r.ok) { notificar(mensajeError(r)); return; }
        cancelarMapa('Trabajo cargado. Genera su mapa bajo petición.', true); auxiliar = null; refrescar(true); mostrarVista(true); notificar('Trabajo cargado: ' + t.nombre + '.');
      }], ['Renombrar', async () => {
        const nombre = await pedirNombre('Renombrar trabajo', t.nombre); if (nombre === undefined) return;
        const r = DifusaEstado.renombrarTrabajo(t.id, nombre); if (!r.ok) notificar(mensajeError(r)); renderTrabajos(); almacenamiento();
      }], ['Eliminar', async () => {
        if (await dialogoConfirmar({ titulo: 'Eliminar trabajo', mensaje: 'Se eliminará la copia guardada «' + t.nombre + '». El ejercicio abierto se conserva.', textoAceptar: 'Eliminar' }) !== true) return;
        DifusaEstado.eliminarTrabajo(t.id); renderTrabajos(); almacenamiento();
      }]].forEach(([texto, accion]) => { const b = el('button', texto, 'btn btn-neutral'); b.type = 'button'; b.addEventListener('click', accion); acciones.append(b); }); card.append(acciones); lista.append(card);
    });
  }
  async function pedirNombre(titulo, valor) {
    return dialogoPedirTexto({ titulo, mensaje: 'Usa un nombre de 1 a 40 caracteres.', valor,
      validar: texto => { const limpio = texto.trim(); return !limpio || limpio.length > 40 ? { ok: false, error: 'El nombre debe tener entre 1 y 40 caracteres.' } : { ok: true, valor: limpio }; } });
  }
  $('formDifusa').addEventListener('submit', e => { e.preventDefault(); evaluar(); });
  document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => ir(b.dataset.vista)));
  document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));
  document.querySelectorAll('[data-cargar-ejemplo]').forEach(b => b.addEventListener('click', async () => {
    if (!await confirmarReemplazo()) return; DifusaEstado.cargarEjemplo(b.dataset.cargarEjemplo); cancelarMapa('Ejemplo cambiado. El mapa no se genera automáticamente.', true); refrescar(true); ir('evaluar'); notificar(estado.modelo.descripcion);
  }));
  $('crearSistemaDifusa').addEventListener('click', async () => { if (!await confirmarReemplazo()) return; DifusaEstado.crearSistema(); cancelarMapa('Sistema nuevo.', true); refrescar(true); ir('variables'); notificar('Plantilla editable: configura variables y selecciona el consecuente pendiente de la regla.'); });
  $('restablecerValoresDifusa').addEventListener('click', () => { DifusaEstado.restablecer(); valoresEscritos.clear(); renderControles(); renderResultado(); preparacion(); notificar('Valores iniciales restablecidos para el sistema actual. Pulsa Evaluar.'); });
  document.querySelectorAll('[data-ejemplo-difusa]').forEach(b => b.addEventListener('click', () => { const valores = b.dataset.ejemploDifusa.split(',').map(Number); estado.modelo.entradas.forEach((v, i) => DifusaEstado.actualizarValor(v.id, valores[i])); valoresEscritos.clear(); renderControles(); evaluar(); }));
  $('seleccionReglaDifusa').addEventListener('change', e => { DifusaEstado.seleccionarRegla(e.target.value); renderConsulta(); });
  $('puntoSalidaDifusa').addEventListener('input', e => { DifusaEstado.seleccionarPunto(Number(e.target.value)); renderConsulta(); });
  $('generarMapaDifusa').addEventListener('click', generarMapa); $('cancelarMapaDifusa').addEventListener('click', () => { cancelarMapa('Mapa cancelado; la evaluación normal sigue disponible.'); preparacion(); });
  window.addEventListener('intro:cambio', e => { if (e.detail && e.detail.visible) { cancelarMapa('Mapa cancelado al abrir el video.'); preparacion(); } });
  $('btnAyuda').addEventListener('click', () => { if (typeof introVisible === 'function' && introVisible()) cerrarIntro(true); auxiliar = 'ayuda'; mostrarVista(true); if (typeof cerrarLateral === 'function') cerrarLateral(false); });
  $('cerrarAyudaDifusa').addEventListener('click', () => { auxiliar = null; mostrarVista(true); });
  $('verTrabajosDifusa').addEventListener('click', () => { auxiliar = 'trabajos'; renderTrabajos(); mostrarVista(true); });
  $('cerrarTrabajosDifusa').addEventListener('click', () => { auxiliar = null; mostrarVista(true); });
  $('guardarTrabajoDifusa').addEventListener('click', async () => { if (!asegurarAplicado()) return; const nombre = await pedirNombre('Guardar trabajo', estado.modelo.nombre); if (nombre === undefined) return; const r = DifusaEstado.guardarTrabajo(nombre); notificar(r.ok ? (r.persistido ? 'Trabajo guardado: ' : 'Trabajo disponible solo en esta sesión: ') + nombre : mensajeError(r)); almacenamiento(); });
  $('exportarTrabajoDifusa').addEventListener('click', () => { if (!asegurarAplicado()) return; try { descargar('logica-difusa-trabajo.json', JSON.stringify(DifusaEstado.exportarTrabajo(), null, 2)); } catch (e) { notificar(mensajeError(e)); } });
  $('importarTrabajoDifusa').addEventListener('click', () => $('archivoTrabajoDifusa').click());
  $('archivoTrabajoDifusa').addEventListener('change', async e => {
    const archivo = e.target.files[0]; if (!archivo) return;
    try {
      if (archivo.size > 1000000) throw new Error('El archivo supera el máximo de 1 MB.');
      const texto = await archivo.text(), validacion = DifusaEstado.validarTrabajo(texto); if (!validacion.ok) throw validacion;
      if (!await confirmarReemplazo()) return;
      const r = DifusaEstado.importarTrabajo(texto); if (!r.ok) throw r;
      cancelarMapa('Trabajo importado.', true); auxiliar = null; refrescar(true); mostrarVista(true); notificar('Trabajo JSON validado e importado.');
    } catch (error) { notificar('Importación rechazada. ' + mensajeError(error) + ' El ejercicio actual se conserva.'); }
    finally { e.target.value = ''; }
  });
  $('exportarComparacionDifusa').addEventListener('click', () => {
    if (!asegurarAplicado()) return;
    const m = estado.modelo, validacion = DifusaModelo.validar(m, { permitirBorradores: true });
    if (!validacion.listo) { notificar('Completa las reglas antes de exportar una comparación numérica.'); return; }
    try {
      const casos = [], valores = m.entradas.map(v => estado.valores[v.id]);
      if (valores.every(Number.isFinite)) casos.push({ valores, resultado: DifusaMotor.evaluarSistema(m, estado.valores).centroide.valor });
      if (m.valoresIniciales && m.entradas.every(v => Number.isFinite(m.valoresIniciales[v.id]))) casos.push({ valores: m.entradas.map(v => m.valoresIniciales[v.id]), resultado: DifusaMotor.evaluarSistema(m, m.valoresIniciales).centroide.valor });
      if (!casos.length) throw new Error('Introduce valores válidos para exportar casos.');
      const reglasNumericas = m.reglas.filter(r => r.activa && r.peso > 0 && r.consecuente !== null).map(r => m.entradas.map(v => r.antecedentes[v.id] === null ? 0 : v.conjuntos.findIndex(c => c.id === r.antecedentes[v.id]) + 1).concat(m.salida.conjuntos.findIndex(c => c.id === r.consecuente) + 1, r.peso, r.conector === 'AND' ? 1 : 2));
      descargar('logica-difusa-comparacion.json', JSON.stringify({ tipo: 'ciudad-logica-difusa-comparacion', version: 2, modelo: m, muestreo: { puntos: 1001, minimo: m.salida.min, maximo: m.salida.max, uso: 'consulta auxiliar; no determina el centroide' }, integracion: { metodo: 'continua-por-tramos-lineales', formula: 'integral(y * mu(y)) / integral(mu(y))' }, reglasNumericas, casos, toleranciaAbs: 1e-8 }, null, 2));
    } catch (error) { notificar(mensajeError(error)); }
  });
  $('respaldarOriginalDifusa').addEventListener('click', () => { const original = DifusaEstado.obtenerOriginal(); if (!original) return; descargar(original.nombreArchivo, original.texto); DifusaEstado.respaldarOriginal(); almacenamiento(); });
  $('usarActualDifusa').addEventListener('click', async () => { if (await dialogoConfirmar({ titulo: 'Usar el sistema actual', mensaje: 'Se habilitará el autoguardado con el sistema actual. Descarga primero el original si quieres conservar una copia.', textoAceptar: 'Usar sistema actual' }) !== true) return; DifusaEstado.descartarOriginal(); almacenamiento(); });
  DifusaEstado.restaurar();
  DifusaEditor.inicializar({ notificar, alErrorVariables: () => ir('variables'), alBorrador: matematico => { if (matematico) invalidaPorEdicion(); else preparacion(); }, alCancelar: () => { preparacion(); notificar('Borrador cancelado. Se mantiene la última configuración aplicada.'); }, alCambiar: () => { if (mapa && mapa.firma !== DifusaModelo.firmaMatematica(estado.modelo)) cancelarMapa('Configuración cambiada. Genera el mapa otra vez.', true); valoresEscritos.clear(); refrescar(false); } });
  refrescar(false); notificar('Elige un ejemplo, crea un sistema o continúa con el sistema actual.');
  if (new URLSearchParams(window.location.search).get('trabajos') === '1') { renderTrabajos(); auxiliar = 'trabajos'; mostrarVista(true); }
})();
