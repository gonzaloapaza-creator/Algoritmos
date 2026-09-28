/* Matriz de costos del módulo de asignación: tabla editable y resumen de validación.
 * Es otra vista del mismo modelo que el grafo: cada celda escribe en el modelo y el
 * grafo se redibuja solo. */

'use strict';

const matrizAsig = {
  contenedor: document.getElementById('matrizAsignacion'),
  validacion: document.getElementById('validacionAsignacion'),
  resultado: document.getElementById('matrizResultadoAsignacion'),
  invalidas: {}          // 'rid|tid' -> texto escrito no válido (solo presentación)
};

function textoResumenAsignacion() {
  const r = resumenModelo(estadoAsignacion.modelo);
  return r.recursos + (r.recursos === 1 ? ' recurso' : ' recursos') + ' · ' +
    r.tareas + (r.tareas === 1 ? ' tarea' : ' tareas') + ' · ' +
    r.completos + ' de ' + r.total + ' valores completos';
}

function crearEntradaNombreAsignacion(elemento, tipo) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = elemento.nombre;
  input.maxLength = MAX_LARGO_ETIQUETA_ASIGNACION;
  input.setAttribute('aria-label', (tipo === 'recurso' ? 'Nombre del recurso ' : 'Nombre de la tarea ') + elemento.nombre);
  input.addEventListener('change', () => {
    const lista = tipo === 'recurso' ? estadoAsignacion.modelo.recursos : estadoAsignacion.modelo.tareas;
    const v = validarNombreAsignacion(input.value, lista, elemento.id);
    if (!v.ok) { notificar(v.error, 'error'); input.value = elemento.nombre; return; }
    if (v.valor === elemento.nombre) return;
    aplicarCambioAsignacion(modelo => renombrarElementoAsignacion(modelo, elemento.id, v.valor), { motivo: 'nombre' });
  });
  return input;
}

function moverFocoMatriz(tabla, fila, col) {
  const destino = tabla.querySelector('input[data-fila="' + fila + '"][data-col="' + col + '"]');
  if (destino) { destino.focus(); destino.select(); }
}

/**
 * @param {{editable:boolean}} opciones
 */
function construirTablaAsignacion(opciones) {
  const editable = !!opciones.editable;
  const m = estadoAsignacion.modelo;
  const asignaciones = modoResultadoAsignacion() || (estadoAsignacion.vista === 'resultado' && resultadoVigenteAsignacion())
    ? estadoAsignacion.resultado.datos.asignaciones : [];

  const tabla = document.createElement('table');
  tabla.className = 'tabla tabla-asignacion';
  const thead = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  const esquina = document.createElement('th');
  esquina.scope = 'col';
  esquina.className = 'fija';
  esquina.innerHTML = '<span class="tabla__marca">Recurso ↓ / Tarea →</span>';
  filaCabecera.appendChild(esquina);
  m.tareas.forEach(t => {
    const th = document.createElement('th');
    th.scope = 'col';
    if (editable) th.appendChild(crearEntradaNombreAsignacion(t, 'tarea'));
    else th.textContent = t.nombre;
    filaCabecera.appendChild(th);
  });
  thead.appendChild(filaCabecera);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  m.recursos.forEach((r, i) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.className = 'fija';
    if (editable) th.appendChild(crearEntradaNombreAsignacion(r, 'recurso'));
    else th.textContent = r.nombre;
    tr.appendChild(th);

    m.tareas.forEach((t, j) => {
      const td = document.createElement('td');
      const valor = obtenerValorAsignacion(m, r.id, t.id);
      const clave = claveAsignacion(r.id, t.id);
      const elegida = asignaciones.some(a => a.fila === i && a.col === j);
      if (elegida) td.classList.add('elegida');
      if (esConexionSeleccionada(r.id, t.id)) td.classList.add('seleccionada');
      const s = estadoAsignacion.seleccion;
      if (s && s.tipo === 'nodo' && (s.id === r.id || s.id === t.id)) td.classList.add('relacionada');

      if (editable) {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'text';       // el teclado numérico de muchos móviles no tiene el signo menos
        input.autocomplete = 'off';
        input.dataset.fila = String(i);
        input.dataset.col = String(j);
        input.placeholder = '—';
        input.setAttribute('aria-label', r.nombre + ' → ' + t.nombre);
        const invalida = matrizAsig.invalidas[clave];
        if (invalida !== undefined) { input.value = invalida; input.setAttribute('aria-invalid', 'true'); input.title = validarValorAsignacion(invalida).error; }
        else { input.value = valor === null ? '' : String(valor); if (valor === null) input.classList.add('pendiente'); }

        input.addEventListener('input', () => {
          const v = validarValorAsignacion(input.value);
          input.toggleAttribute('aria-invalid', !v.ok);
          input.title = v.ok ? '' : v.error;
        });
        input.addEventListener('change', () => {
          const v = validarValorAsignacion(input.value);
          if (!v.ok) {
            matrizAsig.invalidas[clave] = input.value;
            input.setAttribute('aria-invalid', 'true');
            dibujarValidacionAsignacion();
            notificar(v.error, 'error');
            return;
          }
          delete matrizAsig.invalidas[clave];
          if (v.valor === obtenerValorAsignacion(estadoAsignacion.modelo, r.id, t.id)) { dibujarValidacionAsignacion(); return; }
          aplicarCambioAsignacion(modelo => fijarValorAsignacion(modelo, r.id, t.id, v.valor), { motivo: 'valor' });
        });
        input.addEventListener('focus', () => {
          if (!esConexionSeleccionada(r.id, t.id)) { estadoAsignacion.seleccion = { tipo: 'conexion', recursoId: r.id, tareaId: t.id }; emitirCambioAsignacion('seleccion-matriz'); }
        });
        input.addEventListener('keydown', evento => {
          const mapa = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
          if (mapa[evento.key]) { evento.preventDefault(); moverFocoMatriz(tabla, i + mapa[evento.key][0], j + mapa[evento.key][1]); }
          if (evento.key === 'Enter') { evento.preventDefault(); input.blur(); moverFocoMatriz(tabla, i + 1, j); }
        });
        td.appendChild(input);
      } else {
        td.textContent = valor === null ? '—' : String(valor);
        if (valor === null) td.classList.add('apagado');
        td.classList.add('pulsable');
        td.tabIndex = 0;
        td.setAttribute('role', 'button');
        td.setAttribute('aria-label', r.nombre + ' → ' + t.nombre + ': ' + (valor === null ? 'pendiente' : valor) + (elegida ? ' (elegida)' : ''));
        const elegir = () => seleccionarAsignacion({ tipo: 'conexion', recursoId: r.id, tareaId: t.id });
        td.addEventListener('click', elegir);
        td.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(); } });
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);
  return tabla;
}

function dibujarMatrizAsignacion() {
  if (!matrizAsig.contenedor) return;
  const m = estadoAsignacion.modelo;
  if (m.recursos.length === 0 || m.tareas.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'mensaje mensaje--info';
    aviso.textContent = 'La matriz aparece cuando hay al menos un recurso y una tarea. Vuelve al grafo para agregarlos.';
    matrizAsig.contenedor.replaceChildren(aviso);
  } else {
    matrizAsig.contenedor.replaceChildren(construirTablaAsignacion({ editable: true }));
  }
  dibujarValidacionAsignacion();
}

function dibujarMatrizResultadoAsignacion() {
  if (!matrizAsig.resultado) return;
  matrizAsig.resultado.replaceChildren(construirTablaAsignacion({ editable: false }));
}

/** Lista de errores y avisos; también decide si se puede resolver. */
function estadoValidacionAsignacion() {
  const v = validarModeloAsignacion(estadoAsignacion.modelo);
  const invalidas = Object.keys(matrizAsig.invalidas).filter(clave => {
    const [r, t] = clave.split('|');
    return estadoAsignacion.modelo.recursos.some(e => e.id === r) && estadoAsignacion.modelo.tareas.some(e => e.id === t);
  });
  const errores = v.errores.slice();
  if (invalidas.length) {
    errores.unshift(invalidas.length === 1
      ? 'Hay 1 casilla con un texto no válido (marcada en rojo): corrígela o vacíala.'
      : 'Hay ' + invalidas.length + ' casillas con texto no válido (marcadas en rojo): corrígelas o vacíalas.');
  }
  return { ok: errores.length === 0, errores, avisos: v.avisos };
}

function dibujarValidacionAsignacion() {
  if (!matrizAsig.validacion) return;
  const estadoV = estadoValidacionAsignacion();
  const caja = matrizAsig.validacion;
  caja.replaceChildren();

  const resumen = document.createElement('p');
  resumen.className = 'resumen-datos';
  resumen.innerHTML = '<strong>' + escaparTextoAsignacion(textoResumenAsignacion()) + '</strong>';
  caja.appendChild(resumen);

  if (estadoV.errores.length) {
    const msg = document.createElement('div');
    msg.className = 'mensaje mensaje--error';
    msg.setAttribute('role', 'alert');
    msg.innerHTML = '<div><strong>No se puede resolver todavía</strong><ul></ul></div>';
    const ul = msg.querySelector('ul');
    estadoV.errores.forEach(e => { const li = document.createElement('li'); li.textContent = e; ul.appendChild(li); });
    caja.appendChild(msg);
  } else {
    const msg = document.createElement('div');
    msg.className = 'mensaje mensaje--ok';
    msg.textContent = 'Datos completos y válidos. Puedes resolver.';
    caja.appendChild(msg);
  }
  estadoV.avisos.forEach(a => {
    const msg = document.createElement('div');
    msg.className = 'mensaje mensaje--aviso';
    msg.textContent = a;
    caja.appendChild(msg);
  });

  const limites = document.createElement('p');
  limites.className = 'tarjeta__pista';
  limites.textContent = 'Límites de esta versión: de ' + MIN_ASIGNACION_DIMENSION + ' a ' + MAX_ASIGNACION_DIMENSION + ' recursos y tareas; valores enteros entre -' +
    MAX_VALOR_ASIGNACION + ' y ' + MAX_VALOR_ASIGNACION + '. El cero es válido; una casilla vacía es un dato pendiente. No son límites matemáticos del método.';
  caja.appendChild(limites);

  document.querySelectorAll('[data-accion="resolver"]').forEach(b => { b.disabled = !estadoV.ok; });
}

function escaparTextoAsignacion(texto) {
  const span = document.createElement('span');
  span.textContent = texto;
  return span.innerHTML;
}
