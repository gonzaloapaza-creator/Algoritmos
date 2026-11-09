/* SVG nativo para dominios y conjuntos configurables. Conserva la API anterior. */
const DifusaDibujo = (() => {
  const ns = 'http://www.w3.org/2000/svg';
  const formato = n => new Intl.NumberFormat('es', { maximumSignificantDigits: 9, notation: Math.abs(n) > 0 && Math.abs(n) < 1e-4 ? 'scientific' : 'standard' }).format(n);
  function crear(tipo, atributos, texto) {
    const e = document.createElementNS(ns, tipo); Object.entries(atributos || {}).forEach(([k, v]) => e.setAttribute(k, String(v)));
    if (texto !== undefined) e.textContent = texto; return e;
  }
  function base(titulo, descripcion, id, alto) {
    const svg = crear('svg', { viewBox: '0 0 590 ' + (alto || 280), class: 'difusa-grafica', role: 'img', 'aria-labelledby': id + '-titulo ' + id + '-desc' });
    svg.append(crear('title', { id: id + '-titulo' }, titulo), crear('desc', { id: id + '-desc' }, descripcion)); return svg;
  }
  function variable(contenedor, v, valor, id, salida) {
    const resultado = salida && salida.resultado, regla = salida && salida.regla, indice = salida && salida.indice;
    const x0 = 65, x1 = 550, y0 = 38, y1 = 218;
    const px = x => x0 + (x - v.min) / (v.max - v.min) * (x1 - x0), py = grado => y1 - grado * (y1 - y0);
    const svg = base(v.nombre, 'Dominio de ' + v.min + ' a ' + v.max + (v.unidad ? ' ' + v.unidad : '') + '. Pertenencia de 0 a 1. Curvas diferenciadas por trazo y leyenda. ' + (valor == null ? 'Sin valor evaluado.' : 'Valor marcado: ' + valor + '.') + (resultado ? ' Agregación por segmentos e integración del centroide continuo. ' + resultado.centroide.mensaje : ''), id);
    svg.append(crear('text', { x: x0, y: 22 }, 'Pertenencia μ'));
    [0, 0.5, 1].forEach(y => {
      svg.append(crear('line', { x1: x0, x2: x1, y1: py(y), y2: py(y), class: 'difusa-rejilla' }), crear('text', { x: x0 - 9, y: py(y) + 5, 'text-anchor': 'end' }, formato(y)));
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(fraccion => {
      const x = v.min + fraccion * (v.max - v.min);
      svg.append(crear('line', { x1: px(x), x2: px(x), y1, y2: y1 + 5, class: 'difusa-eje' }), crear('text', { x: px(x), y: 243, 'text-anchor': 'middle' }, formato(x)));
    });
    svg.append(crear('line', { x1: x0, x2: x1, y1, y2: y1, class: 'difusa-eje' }), crear('line', { x1: x0, x2: x0, y1: y0, y2: y1, class: 'difusa-eje' }));
    const etiqueta = v.nombre.slice(0, 24) + (v.unidad ? ' (' + v.unidad.slice(0, 12) + ')' : '');
    svg.append(crear('text', { x: (x0 + x1) / 2, y: 271, 'text-anchor': 'middle' }, etiqueta));
    const trazo = (puntos, grados) => puntos.map((x, i) => (i ? 'L' : 'M') + px(x) + ',' + py(grados[i])).join(' ');
    const trazoTramos = tramos => tramos.map(t => 'M' + px(t.x0) + ',' + py(t.y0) + 'L' + px(t.x1) + ',' + py(t.y1)).join(' ');
    if (resultado) {
      const area = resultado.tramos ? resultado.tramos.map(t => 'M' + px(t.x0) + ',' + y1 + 'L' + px(t.x0) + ',' + py(t.y0) + 'L' + px(t.x1) + ',' + py(t.y1) + 'L' + px(t.x1) + ',' + y1 + 'Z').join(' ')
        : trazo(resultado.puntos, resultado.agregada) + 'L' + x1 + ',' + y1 + 'L' + x0 + ',' + y1 + 'Z';
      svg.append(crear('path', { d: area, class: 'difusa-agregada-area' }));
    }
    v.conjuntos.forEach((c, i) => {
      const p = c.parametros;
      const vertices = c.tipo === 'triangular' ? [[p[0], 0], [p[1], 1], [p[2], 0]] : [[p[0], 0], [p[1], 1], [p[2], 1], [p[3], 0]];
      if (v.min < p[0]) vertices.unshift([v.min, 0]);
      if (v.max > p[p.length - 1]) vertices.push([v.max, 0]);
      const curva = crear('path', { d: vertices.map(([x, y], j) => (j ? 'L' : 'M') + px(x) + ',' + py(y)).join(' '), class: 'difusa-curva difusa-curva--' + i });
      curva.append(crear('title', {}, c.nombre)); svg.append(curva);
    });
    if (resultado) svg.append(crear('path', { d: resultado.tramos ? trazoTramos(resultado.tramos) : trazo(resultado.puntos, resultado.agregada), class: 'difusa-agregada-linea' }));
    if (regla) svg.append(crear('path', { d: regla.tramos ? trazoTramos(regla.tramos) : trazo(resultado.puntos, regla.recortada), class: 'difusa-recorte-linea' }));
    if (valor != null) {
      svg.append(crear('line', { x1: px(valor), x2: px(valor), y1: y0, y2: y1, class: 'difusa-marcador' }));
      svg.append(crear('text', { x: px(valor), y: 60, 'text-anchor': valor < v.min + (v.max - v.min) / 10 ? 'start' : valor > v.max - (v.max - v.min) / 10 ? 'end' : 'middle', class: 'difusa-marca-texto' }, formato(valor)));
    }
    if (resultado && Number.isInteger(indice)) svg.append(crear('line', { x1: px(resultado.puntos[indice]), x2: px(resultado.puntos[indice]), y1: y0, y2: y1, class: 'difusa-consulta-linea' }));
    contenedor.replaceChildren(svg); return svg;
  }
  function leyenda(contenedor, v, extras) {
    contenedor.replaceChildren();
    v.conjuntos.forEach((c, i) => { const span = document.createElement('span'); span.className = 'difusa-clave difusa-clave--' + i; span.textContent = c.nombre + ' · trazo ' + (i + 1); contenedor.append(span); });
    if (extras) [['agregada', 'Área y línea gruesa: agregación'], ['recorte', 'Línea fina rayada: regla seleccionada'], ['valor', 'Línea vertical: centroide'], ['consulta', 'Puntos verticales: punto consultado']].forEach(([clase, texto]) => {
      const span = document.createElement('span'); span.className = 'difusa-clave difusa-clave--' + clase; span.textContent = texto; contenedor.append(span);
    });
  }
  function mapa(contenedor, datos, modelo) {
    const xVar = modelo.entradas.find(v => v.id === datos.ejeX), yVar = modelo.entradas.find(v => v.id === datos.ejeY), salida = modelo.salida;
    const svg = base(yVar ? 'Mapa de respuesta de ' + salida.nombre : 'Curva de respuesta de ' + salida.nombre, 'Muestreo de entradas del motor con centroide continuo. Cruces indican puntos sin salida numérica; cada punto conserva su diagnóstico. ' + datos.fijos.map(f => f.nombre + ' fijo en ' + f.valor).join('; '), 'mapaDifusa', 410);
    const x0 = 78, x1 = 545, y0 = 30, y1 = 310, px = x => x0 + (x - xVar.min) / (xVar.max - xVar.min) * (x1 - x0);
    const py = y => y1 - (y - (yVar ? yVar.min : salida.min)) / ((yVar ? yVar.max : salida.max) - (yVar ? yVar.min : salida.min)) * (y1 - y0);
    if (yVar) {
      const ancho = (x1 - x0) / datos.resolucion, alto = (y1 - y0) / datos.resolucion;
      datos.puntos.forEach(p => {
        const x = x0 + p.columna * ancho, y = y1 - (p.fila + 1) * alto;
        const t = p.resultado === null ? null : (p.resultado - salida.min) / (salida.max - salida.min);
        const celda = crear('rect', { x, y, width: ancho + 0.2, height: alto + 0.2, fill: t === null ? 'var(--bg-3)' : 'hsl(' + (230 - t * 190) + ' 65% 47%)' });
        celda.append(crear('title', {}, xVar.nombre + ': ' + formato(p.x) + '; ' + yVar.nombre + ': ' + formato(p.y) + '; ' + (p.resultado === null ? p.diagnostico || 'Sin salida' : salida.nombre + ': ' + formato(p.resultado)))); svg.append(celda);
        if (p.resultado === null) svg.append(crear('path', { d: 'M' + (x + 4) + ',' + (y + 4) + 'l' + (ancho - 8) + ',' + (alto - 8) + 'm0,' + (8 - alto) + 'l' + (8 - ancho) + ',' + (alto - 8), class: 'difusa-sin-salida' }));
      });
    } else {
      let trazo = '', anterior = false;
      datos.puntos.forEach(p => {
        if (p.resultado === null) { anterior = false; svg.append(crear('text', { x: px(p.x), y: y1 - 4, 'text-anchor': 'middle' }, '×')); }
        else { trazo += (anterior ? 'L' : 'M') + px(p.x) + ',' + py(p.resultado); anterior = true; }
      });
      svg.append(crear('path', { d: trazo, class: 'difusa-agregada-linea' }));
    }
    svg.append(crear('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: 'none', class: 'difusa-eje' }));
    [0, 0.5, 1].forEach(t => {
      const x = xVar.min + (xVar.max - xVar.min) * t, v = yVar || salida, y = v.min + (v.max - v.min) * t;
      svg.append(crear('text', { x: px(x), y: y1 + 24, 'text-anchor': 'middle' }, formato(x)), crear('text', { x: x0 - 8, y: py(y) + 5, 'text-anchor': 'end' }, formato(y)));
    });
    svg.append(crear('text', { x: (x0 + x1) / 2, y: 365, 'text-anchor': 'middle' }, xVar.nombre.slice(0, 30) + (xVar.unidad ? ' (' + xVar.unidad.slice(0, 10) + ')' : '')));
    svg.append(crear('text', { x: x0, y: 20 }, (yVar || salida).nombre.slice(0, 30)));
    if (yVar) {
      for (let i = 0; i < 40; i++) svg.append(crear('rect', { x: 80 + i * 8, y: 385, width: 8.2, height: 10, fill: 'hsl(' + (230 - i / 39 * 190) + ' 65% 47%)' }));
      svg.append(crear('text', { x: 80, y: 407 }, formato(salida.min)), crear('text', { x: 400, y: 407, 'text-anchor': 'end' }, formato(salida.max)), crear('text', { x: 420, y: 394 }, salida.unidad || 'salida'));
    }
    contenedor.replaceChildren(svg);
  }
  function entrada(contenedor, titulo, valor, id) {
    variable(contenedor, { nombre: titulo, min: 0, max: 10, unidad: '', conjuntos: Object.entries(DifusaMotor.modelo.entradas).map(([clave, c]) => ({ ...c, id: clave })) }, valor, id);
  }
  function salida(contenedor, resultado) {
    variable(contenedor, { nombre: 'Detalle recomendado', min: 0, max: 100, unidad: '', conjuntos: Object.entries(DifusaMotor.modelo.salidas).map(([clave, c]) => ({ ...c, id: clave })) }, resultado ? resultado.centroide.valor : null, 'svgSalidaDifusa', resultado ? { resultado } : null);
  }
  return { variable, leyenda, mapa, entrada, salida };
})();
