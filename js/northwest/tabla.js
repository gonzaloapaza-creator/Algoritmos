/* Tablas del módulo de transporte: matriz de entrada editable, vista previa del
 * balanceo, tabla de cada paso y matriz final. Solo construyen DOM a partir del estado. */

'use strict';

const tablaNw = {
  invalidas: {}     // 'costo:o|d' | 'oferta:o' | 'demanda:d' -> texto no válido (solo presentación)
};

function celdaNw(etiqueta, texto, clases) {
  const c = document.createElement(etiqueta);
  if (texto !== undefined && texto !== null) c.textContent = String(texto);
  if (clases) c.className = clases;
  return c;
}

function entradaNw(config) {
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = config.inputmode || 'decimal';
  input.autocomplete = 'off';
  input.placeholder = config.placeholder || '—';
  input.setAttribute('aria-label', config.etiqueta);
  Object.keys(config.datos || {}).forEach(k => { input.dataset[k] = config.datos[k]; });
  const clave = config.clave;
  const invalida = tablaNw.invalidas[clave];
  if (invalida !== undefined) {
    input.value = invalida;
    input.setAttribute('aria-invalid', 'true');
    input.title = config.validar(invalida).error || '';
  } else {
    input.value = config.valor === null || config.valor === undefined ? '' : config.formatear(config.valor);
    if (config.valor === null || config.valor === undefined) input.classList.add('pendiente');
  }
  input.addEventListener('input', () => {
    const v = config.validar(input.value);
    input.toggleAttribute('aria-invalid', !v.ok);
    input.title = v.ok ? '' : v.error;
  });
  input.addEventListener('change', () => {
    const v = config.validar(input.value);
    if (!v.ok) {
      tablaNw.invalidas[clave] = input.value;
      input.setAttribute('aria-invalid', 'true');
      notificar(v.error, 'error');
      dibujarResumenDatosNorthwest();
      return;
    }
    delete tablaNw.invalidas[clave];
    if (v.valor === config.valor) { dibujarResumenDatosNorthwest(); return; }
    config.alCambiar(v.valor);
  });
  input.addEventListener('keydown', evento => {
    if (evento.key === 'Enter') { evento.preventDefault(); input.blur(); }
  });
  return input;
}

function entradaNombreNw(elemento, tipo) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = elemento.nombre;
  input.maxLength = MAX_LARGO_ETIQUETA_NORTHWEST;
  input.setAttribute('aria-label', (tipo === 'origen' ? 'Nombre del origen ' : 'Nombre del destino ') + elemento.nombre);
  input.addEventListener('change', () => {
    const lista = tipo === 'origen' ? estadoNorthwest.modelo.origenes : estadoNorthwest.modelo.destinos;
    const v = validarEtiquetaNorthwest(input.value, lista, elemento.id);
    if (!v.ok) { notificar(v.error, 'error'); input.value = elemento.nombre; return; }
    if (v.valor === elemento.nombre) return;
    aplicarCambioNorthwest(() => { elemento.nombre = v.valor; }, { motivo: 'nombre' });
  });
  return input;
}

function botonQuitarNw(etiqueta, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-fantasma btn-sm btn-icono nw-quitar';
  b.setAttribute('aria-label', etiqueta);
  b.title = etiqueta;
  b.textContent = '✕';
  b.addEventListener('click', fn);
  return b;
}

/* ---------------- Matriz de entrada ---------------- */

function construirTablaDatosNorthwest() {
  const m = estadoNorthwest.modelo;
  const tabla = document.createElement('table');
  tabla.className = 'tabla tabla-nw';

  const thead = document.createElement('thead');
  const cab = document.createElement('tr');
  const esquina = celdaNw('th', null, 'fija');
  esquina.innerHTML = '<span class="tabla__marca">Origen ↓ / Destino →</span>';
  cab.appendChild(esquina);
  m.destinos.forEach(d => { const th = celdaNw('th'); th.scope = 'col'; th.appendChild(entradaNombreNw(d, 'destino')); cab.appendChild(th); });
  const thOferta = celdaNw('th', 'Oferta', 'nw-col-total');
  thOferta.scope = 'col';
  cab.appendChild(thOferta);
  cab.appendChild(celdaNw('th', '', 'nw-col-acciones'));
  thead.appendChild(cab);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  m.origenes.forEach((o, i) => {
    const tr = document.createElement('tr');
    const th = celdaNw('th', null, 'fija');
    th.scope = 'row';
    th.appendChild(entradaNombreNw(o, 'origen'));
    tr.appendChild(th);
    m.destinos.forEach((d, j) => {
      const td = celdaNw('td');
      td.appendChild(entradaNw({
        clave: 'costo:' + o.id + '|' + d.id,
        valor: obtenerCostoNorthwest(m, o.id, d.id),
        formatear: formatearCostoNorthwest,
        validar: validarCostoNorthwest,
        etiqueta: 'Costo unitario de ' + o.nombre + ' a ' + d.nombre,
        datos: { tipo: 'costo', fila: String(i), col: String(j) },
        alCambiar: v => aplicarCambioNorthwest(mod => fijarCostoNorthwest(mod, o.id, d.id, v), { motivo: 'costo' })
      }));
      tr.appendChild(td);
    });
    const tdOferta = celdaNw('td', null, 'nw-col-total');
    tdOferta.appendChild(entradaNw({
      clave: 'oferta:' + o.id,
      valor: o.oferta,
      formatear: String,
      validar: validarCantidadNorthwest,
      inputmode: 'numeric',
      etiqueta: 'Oferta de ' + o.nombre,
      datos: { tipo: 'oferta', fila: String(i) },
      alCambiar: v => aplicarCambioNorthwest(mod => { mod.origenes[i].oferta = v; }, { motivo: 'oferta' })
    }));
    tr.appendChild(tdOferta);
    const tdAcc = celdaNw('td', null, 'nw-col-acciones');
    tdAcc.appendChild(botonQuitarNw('Quitar el origen ' + o.nombre, () => quitarElementoNorthwest(o.id)));
    tr.appendChild(tdAcc);
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);

  const tfoot = document.createElement('tfoot');
  const filaDemanda = document.createElement('tr');
  const thDemanda = celdaNw('th', 'Demanda', 'fija nw-fila-total');
  thDemanda.scope = 'row';
  filaDemanda.appendChild(thDemanda);
  m.destinos.forEach((d, j) => {
    const td = celdaNw('td', null, 'nw-fila-total');
    td.appendChild(entradaNw({
      clave: 'demanda:' + d.id,
      valor: d.demanda,
      formatear: String,
      validar: validarCantidadNorthwest,
      inputmode: 'numeric',
      etiqueta: 'Demanda de ' + d.nombre,
      datos: { tipo: 'demanda', col: String(j) },
      alCambiar: v => aplicarCambioNorthwest(mod => { mod.destinos[j].demanda = v; }, { motivo: 'demanda' })
    }));
    filaDemanda.appendChild(td);
  });
  const t = totalesNorthwest(m);
  const tdTotales = celdaNw('td', null, 'nw-col-total nw-totales');
  tdTotales.innerHTML = '<span class="tabla__marca">Oferta</span><strong>' + t.ofertaTotal + '</strong><span class="tabla__marca">Demanda</span><strong>' + t.demandaTotal + '</strong>';
  filaDemanda.appendChild(tdTotales);
  filaDemanda.appendChild(celdaNw('td', '', 'nw-col-acciones'));
  tfoot.appendChild(filaDemanda);

  const filaQuitar = document.createElement('tr');
  filaQuitar.className = 'nw-fila-quitar';
  filaQuitar.appendChild(celdaNw('th', '', 'fija'));
  m.destinos.forEach(d => {
    const td = celdaNw('td');
    td.appendChild(botonQuitarNw('Quitar el destino ' + d.nombre, () => quitarElementoNorthwest(d.id)));
    filaQuitar.appendChild(td);
  });
  filaQuitar.appendChild(celdaNw('td', ''));
  filaQuitar.appendChild(celdaNw('td', ''));
  tfoot.appendChild(filaQuitar);
  tabla.appendChild(tfoot);
  return tabla;
}

/** Celda con costo unitario (pequeño) y cantidad (grande), claramente distinguidos. */
function celdaCantidadNw(costo, cantidad, opciones) {
  const o = opciones || {};
  const td = document.createElement('td');
  td.className = 'nw-celda' + (o.clases ? ' ' + o.clases : '');
  const c = document.createElement('span');
  c.className = 'nw-celda__costo';
  c.textContent = 'c = ' + formatearCostoNorthwest(costo);
  c.title = 'Costo unitario';
  const q = document.createElement('span');
  q.className = 'nw-celda__cantidad';
  if (o.basicaCero) { q.textContent = '0 básico'; q.classList.add('nw-celda__cantidad--basica'); }
  else if (cantidad === null || cantidad === undefined) { q.textContent = '·'; q.classList.add('nw-celda__cantidad--vacia'); }
  else { q.textContent = String(cantidad); if (cantidad === 0) q.classList.add('nw-celda__cantidad--vacia'); }
  q.title = 'Cantidad enviada';
  td.appendChild(c);
  td.appendChild(q);
  return td;
}

/**
 * Tabla del problema balanceado, con cantidades opcionales.
 * @param {Object} balance    salida de balancearNorthwest
 * @param {Object} [opciones] { asignaciones, basicas, celdaActual, restanteOferta, restanteDemanda, satisfechasFilas, satisfechasColumnas }
 */
function construirTablaBalanceadaNorthwest(balance, opciones) {
  const o = opciones || {};
  const tabla = document.createElement('table');
  tabla.className = 'tabla tabla-nw tabla-nw--balance';
  const conCantidades = !!o.asignaciones;

  const thead = document.createElement('thead');
  const cab = document.createElement('tr');
  cab.appendChild(celdaNw('th', '', 'fija'));
  balance.destinos.forEach((d, j) => {
    const th = celdaNw('th', d.nombre, d.ficticio ? 'ficticio' : '');
    th.scope = 'col';
    if (d.ficticio) th.innerHTML = d.nombre + '<span class="tabla__nota">ficticio · costo 0</span>';
    if (o.satisfechasColumnas && o.satisfechasColumnas[j]) th.classList.add('satisfecha');
    cab.appendChild(th);
  });
  cab.appendChild(celdaNw('th', conCantidades ? 'Oferta / resta' : 'Oferta', 'nw-col-total'));
  thead.appendChild(cab);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  balance.origenes.forEach((org, i) => {
    const tr = document.createElement('tr');
    const th = celdaNw('th', org.nombre, 'fija' + (org.ficticio ? ' ficticio' : ''));
    th.scope = 'row';
    if (org.ficticio) th.innerHTML = org.nombre + '<span class="tabla__nota">ficticio · costo 0</span>';
    if (o.satisfechasFilas && o.satisfechasFilas[i]) th.classList.add('satisfecha');
    tr.appendChild(th);
    balance.destinos.forEach((d, j) => {
      const ficticio = org.ficticio || d.ficticio;
      let td;
      if (conCantidades) {
        const basica = o.basicas ? o.basicas.find(b => b.fila === i && b.col === j) : null;
        td = celdaCantidadNw(balance.costos[i][j], basica ? o.asignaciones[i][j] : null, {
          basicaCero: !!(basica && basica.basicaCero),
          clases: (ficticio ? 'ficticio ' : '') + (basica ? 'basica ' : '') + (o.celdaActual && o.celdaActual.fila === i && o.celdaActual.col === j ? 'actual' : '')
        });
      } else {
        td = celdaNw('td', formatearCostoNorthwest(balance.costos[i][j]), ficticio ? 'ficticio' : '');
      }
      tr.appendChild(td);
    });
    const tdO = celdaNw('td', null, 'nw-col-total' + (org.ficticio ? ' ficticio' : ''));
    tdO.textContent = String(balance.ofertas[i]);
    if (o.restanteOferta) tdO.innerHTML = balance.ofertas[i] + ' <span class="nw-resta">→ ' + o.restanteOferta[i] + '</span>';
    tr.appendChild(tdO);
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);

  const tfoot = document.createElement('tfoot');
  const fila = document.createElement('tr');
  fila.appendChild(celdaNw('th', conCantidades ? 'Demanda / resta' : 'Demanda', 'fija nw-fila-total'));
  balance.destinos.forEach((d, j) => {
    const td = celdaNw('td', null, 'nw-fila-total' + (d.ficticio ? ' ficticio' : ''));
    td.textContent = String(balance.demandas[j]);
    if (o.restanteDemanda) td.innerHTML = balance.demandas[j] + ' <span class="nw-resta">→ ' + o.restanteDemanda[j] + '</span>';
    fila.appendChild(td);
  });
  const total = balance.ofertas.reduce((s, v) => s + v, 0);
  fila.appendChild(celdaNw('td', total, 'nw-col-total nw-fila-total'));
  tfoot.appendChild(fila);
  tabla.appendChild(tfoot);
  return tabla;
}
