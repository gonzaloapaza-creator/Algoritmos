'use strict';

const { crearContexto, cargar, evaluar, prueba, igual, cierto, informe } = require('./cargar');

// DOM mínimo para ejercitar las vistas reales y sus textos. No simula medidas,
// disposición ni eventos del navegador; únicamente se sustituye el dibujo mini.
class Elemento {
  constructor(etiqueta) {
    this.tagName = etiqueta;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.className = '';
    this.hidden = false;
    this.value = '';
    this._texto = '';
    this.style = { setProperty() {} };
    this.classList = {
      contains: clase => this.className.split(/\s+/).includes(clase),
      add: (...clases) => { this.className = [...new Set(this.className.split(/\s+/).filter(Boolean).concat(clases))].join(' '); },
      remove: (...clases) => { this.className = this.className.split(/\s+/).filter(clase => !clases.includes(clase)).join(' '); },
      toggle: (clase, forzar) => {
        const activar = forzar === undefined ? !this.classList.contains(clase) : forzar;
        if (activar) this.classList.add(clase); else this.classList.remove(clase);
        return activar;
      }
    };
  }
  set textContent(valor) { this._texto = String(valor); this.children = []; }
  get textContent() { return this._texto + this.children.map(hijo => hijo.textContent).join(' '); }
  get options() { return this.children.filter(hijo => hijo.tagName === 'option'); }
  appendChild(hijo) { hijo.parentNode = this; this.children.push(hijo); return hijo; }
  append(...hijos) { hijos.forEach(hijo => this.appendChild(hijo)); }
  replaceChildren(...hijos) { this._texto = ''; this.children = []; this.append(...hijos); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(hijo => hijo !== this); }
  addEventListener() {}
  setAttribute(nombre, valor) { this.attributes[nombre] = String(valor); if (nombre === 'class') this.className = String(valor); }
  getAttribute(nombre) { return this.attributes[nombre]; }
  removeAttribute(nombre) { delete this.attributes[nombre]; }
  getContext() { return null; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const coincide = nodo => selector.startsWith('.') ? nodo.classList.contains(selector.slice(1))
      : selector === '[value="maximo"]' ? nodo.value === 'maximo'
        : nodo.tagName === selector;
    const encontrados = [];
    const visitar = nodo => nodo.children.forEach(hijo => { if (coincide(hijo)) encontrados.push(hijo); visitar(hijo); });
    visitar(this);
    return encontrados;
  }
}

function preparar(opciones) {
  const porId = new Map();
  const obtener = id => {
    if (!porId.has(id)) porId.set(id, new Elemento('div'));
    return porId.get(id);
  };
  const ctx = crearContexto();
  ctx.document = {
    body: new Elemento('body'),
    getElementById: obtener,
    createElement: etiqueta => new Elemento(etiqueta),
    createElementNS: (_, etiqueta) => new Elemento(etiqueta),
    createTextNode: texto => { const nodo = new Elemento('#text'); nodo.textContent = texto; return nodo; },
    querySelector: () => new Elemento('div'),
    querySelectorAll: () => []
  };
  ctx.window = ctx;
  ctx.setTimeout = setTimeout;
  ctx.getComputedStyle = () => ({ fontFamily: 'sans-serif' });
  ctx.avisos = [];
  ctx.avisar = (mensaje, tipo) => ctx.avisos.push({ mensaje, tipo });
  ctx.ayudar = () => {};
  ctx.abrirModal = contenido => { ctx.modalMostrado = contenido; };
  cargar(ctx, [
    'js/config.js', 'js/comun/utilidades.js', 'js/estado.js', 'js/johnson.js',
    'js/johnson/caminos.js', 'js/matriz.js', 'js/dibujo.js', 'js/dijkstra.js', 'js/johnson/vistas.js'
  ]);
  ctx.dibujarGrafoMini = (svg, configuracion) => { ctx.ultimaMiniatura = configuracion; };
  const maximo = new Elemento('option'); maximo.value = 'maximo';
  obtener('jnObjetivoRuta').appendChild(maximo);
  obtener('resultadoSinJn').appendChild(new Elemento('p'));
  obtener('resolucionSinJn').appendChild(new Elemento('p'));
  const estado = evaluar(ctx, 'estado');
  const johnson = evaluar(ctx, 'estadoJohnson');
  const consulta = evaluar(ctx, 'consultaCaminosJohnson');
  estado.nodos = ['A', 'E', 'D', 'B'].map((nombre, indice) => ({ id: nombre, nombre, x: 150 + indice * 180, y: 200 }));
  estado.conexiones = [['A', 'B', 58], ['A', 'E', 6], ['E', 'D', 5], ['D', 'B', 8]]
    .map(([desde, hacia, valor], indice) => ({ id: 'e' + indice, desde, hacia, valor }));
  if (opciones) opciones(estado);
  johnson.resultado = ctx.calcularJohnsonDesde(ctx.prepararDatosJohnson(estado.nodos, estado.conexiones));
  johnson.firma = ctx.firmaGrafoJohnson();
  cierto(ctx.actualizarConsultaRutaJohnson(0, 3));
  return { ctx, estado, johnson, consulta, obtener };
}

function valoresDibujados(ctx, estado, id, visual = estado.visualizacionJohnson) {
  const grupo = new Elemento('g');
  ctx.dibujarCompartimentosNodoJohnson(grupo, estado.nodos.find(n => n.id === id), visual);
  return {
    valores: grupo.querySelectorAll('.jn-nodo-valor').map(numero => numero._texto),
    rotulos: grupo.querySelectorAll('.jn-nodo-leyenda').map(rotulo => rotulo._texto),
    descripcion: grupo.getAttribute('aria-label')
  };
}

function leyendaDibujada(ctx, visual, capa = new Elemento('g')) {
  // Únicamente ofrece un área para poder leer el texto de la leyenda SVG real.
  // La geometría y los eventos se verifican en el recorrido de navegador.
  capa.getBBox = () => ({ x: 0, y: 0, width: 900, height: 400 });
  ctx.agregarLeyendaConsultaJohnson(capa, visual);
  return { capa, texto: capa.querySelector('.jn-leyenda-svg').getAttribute('aria-label') };
}

prueba('H-01: Johnson → Dijkstra rápido → Resultado conserva la consulta y reconstruye valores', () => {
  const { ctx, estado, johnson, obtener } = preparar();
  const visual = estado.visualizacionJohnson;
  const seleccion = johnson.seleccion;
  ctx.ejecutarDijkstra('A');
  cierto(estado.visualizacionJohnson === visual, 'La consulta rápida no debe reemplazar visualizacionJohnson');
  cierto(johnson.seleccion === seleccion, 'La consulta rápida no debe reemplazar la selección Johnson');
  igual(estado.resultadoDijkstraRapido.resultado.distancias, [0, 6, 11, 19]);
  cierto(ctx.modalMostrado.mensaje.includes('A → E → D → B'));
  ctx.dibujarResultadoJohnson();
  igual(johnson.seleccion, { origen: 0, destino: 3 });
  igual(estado.visualizacionJohnson.valoresNodos.B, { minimo: 19, maximo: 58 });
  cierto(obtener('jnRutaDetalle').textContent.includes('6 + 5 + 8 = 19'));
  cierto(obtener('svgResultadoJn').getAttribute('aria-label').includes('mínimo y máximo'));
  igual(ctx.ultimaMiniatura.visual.valoresNodos.B, { minimo: 19, maximo: 58 });
});

prueba('H-02: el destino activo muestra acumulado | total y conserva los extremos matemáticos', () => {
  const { ctx, estado, johnson, consulta, obtener } = preparar();
  const minimos = JSON.stringify(johnson.resultado.distancias);
  const maximos = JSON.stringify(consulta.maximos.distancias);
  for (const objetivo of ['minimo', 'maximo']) {
    consulta.objetivo = objetivo;
    consulta.seleccionRutaId = objetivo;
    consulta.comparar = false;
    ctx.dibujarResultadoJohnson();
    const costo = objetivo === 'minimo' ? 19 : 58;
    const dibujado = valoresDibujados(ctx, estado, 'B');
    igual(dibujado.valores, [String(costo), String(costo)]);
    igual(dibujado.rotulos, ['Acum.', 'Total']);
    cierto(dibujado.descripcion.includes('Acumulado de la ruta'));
    cierto(dibujado.descripcion.includes('Costo total de la ruta'));
    cierto(obtener('jnRutaDetalle').textContent.includes('Acum. ' + costo + ' | Total ' + costo));
    cierto(obtener('jnRutaDetalle').textContent.includes('Costo total: ' + costo));
    igual(estado.visualizacionJohnson.valoresNodos.B, { minimo: 19, maximo: 58 });
    igual(valoresDibujados(ctx, estado, 'E').rotulos, ['mín', 'máx']);
    igual(JSON.stringify(johnson.resultado.distancias), minimos);
    igual(JSON.stringify(consulta.maximos.distancias), maximos);
  }
  consulta.comparar = true;
  consulta.seleccionRutaId = null;
  ctx.dibujarResultadoJohnson();
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '58']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['mín', 'máx']);
  cierto(valoresDibujados(ctx, estado, 'B').descripcion.includes('Mínimo 19. Máximo 58'));
  igual(estado.visualizacionJohnson.rutaSeleccionada, null);
  cierto(obtener('jnRutaDetalle').textContent.includes('Sin ruta única activa'));
  cierto(obtener('jnRutaDetalle').textContent.includes('Costo total: 19'));
  cierto(obtener('jnRutaDetalle').textContent.includes('Costo total: 58'));
  igual(JSON.stringify(johnson.resultado.distancias), minimos);
  igual(JSON.stringify(consulta.maximos.distancias), maximos);
});

prueba('Activar y desactivar una ruta comparada actualiza casillas y reemplaza la leyenda SVG', () => {
  const { ctx, estado, consulta, obtener } = preparar();
  consulta.comparar = true;
  consulta.seleccionRutaId = null;
  ctx.dibujarResultadoJohnson();
  const { capa, texto } = leyendaDibujada(ctx, estado.visualizacionJohnson);
  cierto(texto.includes('Sin ruta única activa: el destino conserva mínimo | máximo'));
  for (const id of ['minimo', null, 'maximo', null]) {
    consulta.seleccionRutaId = id;
    ctx.dibujarResultadoJohnson();
    const leyenda = leyendaDibujada(ctx, estado.visualizacionJohnson, capa).texto;
    igual(capa.querySelectorAll('.jn-leyenda-svg').length, 1);
    const dibujado = valoresDibujados(ctx, estado, 'B');
    if (id) {
      const costo = id === 'minimo' ? '19' : '58';
      igual(dibujado.valores, [costo, costo]);
      igual(dibujado.rotulos, ['Acum.', 'Total']);
      cierto(leyenda.includes('Ruta activa: ' + (id === 'minimo' ? 'Rmín' : 'Rmáx')));
      cierto(leyenda.includes('Destino: Acum. = suma de los pesos originales'));
      cierto(obtener('jnRutaDetalle').textContent.includes('Acum. ' + costo + ' | Total ' + costo));
    } else {
      igual(dibujado.valores, ['19', '58']);
      igual(dibujado.rotulos, ['mín', 'máx']);
      cierto(leyenda.includes('Sin ruta única activa'));
      cierto(!leyenda.includes('Ruta activa:'));
      igual(consulta.modeloActivo, null);
      igual(consulta.errorRutaActiva, null);
      igual(estado.visualizacionJohnson.casillas, {});
      cierto(obtener('jnRutaDetalle').textContent.includes('Sin ruta única activa'));
    }
  }
});

prueba('Desactivar sin comparar conserva las distancias y permite volver a activar la ruta', () => {
  const { ctx, estado, consulta, obtener } = preparar();
  consulta.seleccionRutaId = null;
  ctx.dibujarResultadoJohnson();
  igual(estado.visualizacionJohnson.rutaSeleccionada, null);
  igual(estado.visualizacionJohnson.rutasMostradas, []);
  igual(estado.visualizacionJohnson.conexiones, []);
  igual(estado.visualizacionJohnson.casillas, {});
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '58']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['mín', 'máx']);
  igual(consulta.modeloActivo, null);
  igual(consulta.errorRutaActiva, null);
  cierto(obtener('jnRutaDetalle').textContent.includes('Sin ruta activa'));
  cierto(!obtener('jnRutaDetalle').textContent.includes('No existe un camino'));
  cierto(!leyendaDibujada(ctx, estado.visualizacionJohnson).texto.includes('Ruta activa:'));
  consulta.seleccionRutaId = 'minimo';
  ctx.dibujarResultadoJohnson();
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '19']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['Acum.', 'Total']);
});

prueba('Vista temporal usa temprano/tardío T | T y volver a caminos restaura la ruta activa', () => {
  const { ctx, estado, consulta, obtener } = preparar();
  consulta.vista = 'temporal';
  ctx.dibujarResultadoJohnson();
  igual(valoresDibujados(ctx, estado, 'B').valores, ['58', '58']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['temprano', 'tardío']);
  igual(valoresDibujados(ctx, estado, 'E').valores, ['6', '45']);
  cierto(valoresDibujados(ctx, estado, 'B').descripcion.includes('Tiempo temprano 58. Tiempo tardío 58'));
  cierto(obtener('jnLeyendaValores').textContent.includes('temprano a la izquierda'));
  cierto(obtener('jnRutaDetalle').textContent.includes('Destino = 58 | 58'));
  igual(ctx.textoConexionJohnson(estado.conexiones[1], estado.visualizacionJohnson), '6 · H=39');
  cierto(ctx.describirConexionJohnson(estado.conexiones[1], estado.visualizacionJohnson).includes('Actividad no crítica'));
  cierto(ctx.clasesJohnsonConexion(estado.conexiones[0], estado.visualizacionJohnson).includes('jn-temporal-critica'));
  cierto(!ctx.clasesJohnsonConexion(estado.conexiones[1], estado.visualizacionJohnson).includes('jn-temporal-critica'));
  const temporal = estado.visualizacionJohnson;
  ctx.ejecutarDijkstra('A');
  cierto(estado.visualizacionJohnson === temporal, 'Dijkstra rápido también conserva la consulta temporal');
  ctx.dibujarResultadoJohnson();
  igual(valoresDibujados(ctx, estado, 'B').valores, ['58', '58']);
  consulta.vista = 'caminos';
  ctx.dibujarResultadoJohnson();
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '19']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['Acum.', 'Total']);
  cierto(obtener('jnLeyendaValores').textContent.includes('mínimo a la izquierda'));
  igual(ctx.textoConexionJohnson(estado.conexiones[1], estado.visualizacionJohnson), '6');
});

prueba('El acumulado usa pesos originales aunque Dijkstra utilice pesos reponderados distintos', () => {
  const { ctx, estado, johnson, consulta } = preparar(g => {
    g.conexiones[1].valor = -6;
    g.conexiones[2].valor = -5;
  });
  igual(consulta.modeloActivo.pesos, [-6, -5, 8]);
  igual(consulta.modeloActivo.acumuladas, [0, -6, -11, -3]);
  igual(johnson.resultado.distancias[0][3], -3);
  igual(johnson.resultado.distanciasReponderadas[0][3], 0);
  igual(estado.visualizacionJohnson.casillas.B.valores, [-3, -3]);
  igual(valoresDibujados(ctx, estado, 'B').valores, ['−3', '−3']);
  igual(consulta.maximos.distancias[3], 58);
});

prueba('Una discrepancia de ruta produce error explícito y deja ambas casillas del destino sin dato', () => {
  const { ctx, estado, johnson, consulta, obtener } = preparar();
  const inconsistente = {
    id: 'inconsistente', nodos: ['A', 'E', 'D', 'B'], indices: [0, 1, 2, 3],
    conexiones: ['e1', 'e2', 'e3'], pesos: [999, 999, 999], distancia: 20
  };
  const modelo = ctx.modeloRutaJohnson(johnson.resultado, inconsistente);
  igual(modelo.modelo, null);
  cierto(modelo.error.includes('pesos originales (19) no coincide con el costo esperado (20)'));
  consulta.alternativas = [inconsistente];
  consulta.seleccionRutaId = inconsistente.id;
  ctx.dibujarResultadoJohnson();
  igual(consulta.modeloActivo, null);
  cierto(consulta.errorRutaActiva.includes('pesos originales (19) no coincide con el costo esperado (20)'));
  igual(estado.visualizacionJohnson.errorRuta, consulta.errorRutaActiva);
  igual(valoresDibujados(ctx, estado, 'B').valores, ['—', '—']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['Acum.', 'Total']);
  cierto(obtener('jnRutaDetalle').textContent.includes('Ruta activa inconsistente'));
  cierto(!obtener('jnRutaDetalle').textContent.includes('Acum. 20 | Total 20'));
  igual(estado.visualizacionJohnson.valoresNodos.B, { minimo: 19, maximo: 58 });
  consulta.seleccionRutaId = null;
  consulta.comparar = true;
  ctx.dibujarResultadoJohnson();
  igual(consulta.errorRutaActiva, null);
  igual(estado.visualizacionJohnson.errorRuta, null);
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '58']);
  cierto(!obtener('jnRutaDetalle').textContent.includes('Ruta activa inconsistente'));
});

prueba('El último paso comparte la ruta del resultado y cambiarla no duplica ni altera pasos o grafo', () => {
  const { ctx, estado, johnson, consulta, obtener } = preparar();
  ctx.dibujarLienzo = () => {};
  const r = johnson.resultado;
  const calculo = JSON.stringify(r);
  const grafo = JSON.stringify([estado.nodos, estado.conexiones]);
  const cantidad = r.pasos.length;
  const pasos = ctx.pasosResolucionJohnson(r);
  igual(pasos.length, cantidad + 1);
  igual(pasos.filter(paso => paso.tipo === 'ruta').length, 1);
  johnson.vista = 'resolucion';
  johnson.pasoActual = pasos.length - 1;
  for (const id of ['minimo', 'maximo', null, 'minimo']) {
    consulta.comparar = id === null;
    consulta.seleccionRutaId = id;
    ctx.mostrarConsultaRutaJohnson(0, 3);
    cierto(ctx.ultimaMiniatura.visual === estado.visualizacionJohnson, 'Procedimiento y resultado deben usar el mismo modelo visual');
    igual(ctx.ultimaMiniatura.visual.rutaSeleccionada && ctx.ultimaMiniatura.visual.rutaSeleccionada.id, id);
    igual(valoresDibujados(ctx, estado, 'B', ctx.ultimaMiniatura.visual).valores,
      id === 'minimo' ? ['19', '19'] : id === 'maximo' ? ['58', '58'] : ['19', '58']);
    igual(ctx.pasosResolucionJohnson(r).length, cantidad + 1);
    igual(ctx.pasosResolucionJohnson(r).filter(paso => paso.tipo === 'ruta').length, 1);
    igual(obtener('jnPasosLista').children.length, cantidad + 1);
    cierto(obtener('jnPasoTablas').textContent.includes(id ? 'Ruta activa:' : 'Sin ruta única activa'));
    igual(JSON.stringify(r), calculo);
    igual(JSON.stringify([estado.nodos, estado.conexiones]), grafo);
  }
  consulta.vista = 'temporal';
  ctx.mostrarConsultaRutaJohnson(0, 3);
  igual(valoresDibujados(ctx, estado, 'B', ctx.ultimaMiniatura.visual).valores, ['58', '58']);
  igual(valoresDibujados(ctx, estado, 'B', ctx.ultimaMiniatura.visual).rotulos, ['temprano', 'tardío']);
  cierto(obtener('jnPasoLeyenda').textContent.includes('temprano | tardío'));
  igual(JSON.stringify(r), calculo);
  igual(JSON.stringify([estado.nodos, estado.conexiones]), grafo);
});

prueba('Los pasos previos muestran los datos reales de cada etapa y no adelantan la ruta final', () => {
  const { ctx, estado, johnson } = preparar(g => {
    g.conexiones[1].valor = -6;
    g.conexiones[2].valor = -5;
  });
  const r = johnson.resultado;
  const pasoDe = tipo => r.pasos.find(paso => paso.tipo === tipo);
  const visualDe = paso => ctx.contenidoPasoJohnson(r, paso).grafo.visual;
  igual(visualDe(pasoDe('original')).casillas.B.valores, [null, null]);
  const auxiliar = visualDe(pasoDe('auxiliar'));
  igual(auxiliar.casillas.B.valores, [r.pasadas[0].antes[3], null]);
  igual(auxiliar.casillas.__q.valores, [0, null]);
  r.pasos.filter(paso => paso.tipo === 'bellman').forEach(paso => {
    const visual = visualDe(paso);
    r.ids.forEach((id, i) => igual(visual.casillas[id].valores, [paso.pasada.antes[i], paso.pasada.despues[i]]));
  });
  const potenciales = visualDe(pasoDe('verificacion'));
  const reponderacion = visualDe(pasoDe('reponderacion'));
  r.ids.forEach((id, i) => {
    igual(potenciales.casillas[id].valores, [r.potenciales[i], r.potenciales[i]]);
    igual(reponderacion.casillas[id].valores, [r.potenciales[i], null]);
  });
  r.pasos.filter(paso => paso.tipo === 'dijkstra').forEach(paso => {
    const visual = visualDe(paso);
    r.ids.forEach((id, i) => igual(visual.casillas[id].valores, [r.distanciasReponderadas[paso.origen][i], r.distancias[paso.origen][i]]));
  });
  const desdeA = visualDe(r.pasos.find(paso => paso.tipo === 'dijkstra' && paso.origen === 0));
  igual(valoresDibujados(ctx, estado, 'B', desdeA).valores, ['0', '−3']);
  igual(valoresDibujados(ctx, estado, 'B', desdeA).rotulos, ["d'", 'd']);
  const matriz = visualDe(pasoDe('final'));
  r.ids.forEach((id, i) => igual(matriz.casillas[id].valores, [r.distancias[0][i], r.distancias[i][3]]));
  r.pasos.forEach(paso => {
    const visual = visualDe(paso);
    igual(visual.rutaSeleccionada, null);
    cierto(!visual.casillas.B.rotulos.includes('Acum.'));
  });
});

prueba('Editar en el último paso invalida su ruta y oculta el procedimiento anterior', () => {
  const { ctx, estado, johnson, consulta, obtener } = preparar();
  johnson.vista = 'resolucion';
  ctx.irAPasoJohnson(ctx.pasosResolucionJohnson(johnson.resultado).length - 1);
  cierto(ctx.ultimaMiniatura.visual === estado.visualizacionJohnson);
  igual(obtener('resolucionConJn').hidden, false);
  estado.conexiones[1].valor = 7;
  ctx.refrescarVistaJohnson();
  igual(ctx.resultadoVigenteJohnson(), false);
  igual(estado.visualizacionJohnson, null);
  igual(johnson.seleccion, null);
  igual(consulta.modeloActivo, null);
  igual(consulta.errorRutaActiva, null);
  igual(obtener('resolucionConJn').hidden, true);
  cierto(obtener('resolucionSinJn').textContent.includes('Vuelve a calcular'));
  igual(ctx.contenidoPasoJohnson(johnson.resultado, { tipo: 'ruta' }).grafo.visual, null);
});

prueba('Elementos fuera de la subred quedan excluidos en clases y lectura accesible temporal', () => {
  const { ctx, estado, consulta } = preparar(g => {
    g.nodos.push({ id: 'X', nombre: 'X', x: 300, y: 500 });
    g.conexiones.push({ id: 'fuera', desde: 'A', hacia: 'X', valor: 100 });
  });
  consulta.vista = 'temporal';
  ctx.dibujarResultadoJohnson();
  const fuera = estado.conexiones.find(c => c.id === 'fuera');
  igual(valoresDibujados(ctx, estado, 'X').valores, ['—', '—']);
  cierto(valoresDibujados(ctx, estado, 'X').descripcion.includes('No participa'));
  cierto(ctx.clasesJohnsonConexion(fuera, estado.visualizacionJohnson).includes('jn-temporal-excluida'));
  igual(ctx.textoConexionJohnson(fuera, estado.visualizacionJohnson), '100 · excluida');
  cierto(ctx.describirConexionJohnson(fuera, estado.visualizacionJohnson).includes('No participa'));
});

prueba('Mover y renombrar conservan firma y resultado, y actualizan resumen y selectores', () => {
  const { ctx, estado, johnson, obtener } = preparar();
  ctx.ejecutarDijkstra('A');
  const firma = ctx.firmaGrafoJohnson();
  const resultado = johnson.resultado;
  const rapido = estado.resultadoDijkstraRapido;
  estado.nodos[0].x += 87;
  estado.nodos[3].nombre = 'Destino';
  ctx.refrescarVistaJohnson();
  igual(ctx.firmaGrafoJohnson(), firma);
  cierto(ctx.resultadoVigenteJohnson());
  cierto(johnson.resultado === resultado);
  cierto(estado.resultadoDijkstraRapido === rapido);
  igual(johnson.resultado.nombres, ['A', 'E', 'D', 'Destino']);
  ctx.dibujarResultadoJohnson();
  cierto(obtener('jnRutaDetalle').textContent.includes('A → E → D → Destino'));
  cierto(obtener('jnDestinoRuta').options.some(opcion => opcion.textContent === 'Destino'));
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '19']);
});

prueba('Editar pesos invalida ambos resultados, cancela alternativas y limpia resaltados/cache', () => {
  const { ctx, estado, johnson, consulta, obtener } = preparar();
  ctx.ejecutarDijkstra('A');
  consulta.vista = 'temporal';
  ctx.actualizarConsultaRutaJohnson(0, 3);
  const tarea = { cancelada: false };
  consulta.busqueda = tarea;
  consulta.alternativas = [{ id: 'vieja' }];
  estado.conexiones[0].valor = 59;
  ctx.refrescarVistaJohnson();
  igual(ctx.resultadoVigenteJohnson(), false);
  igual(estado.resultadoDijkstraRapido, null);
  igual(estado.visualizacionJohnson, null);
  igual(johnson.seleccion, null);
  igual(consulta.temporal, null);
  igual(consulta.alternativas, []);
  igual(consulta.cacheMaximos.size, 0);
  igual(consulta.modeloActivo, null);
  igual(consulta.errorRutaActiva, null);
  igual(tarea.cancelada, true);
  ctx.dibujarResultadoJohnson();
  igual(obtener('resultadoConJn').hidden, true);
  cierto(obtener('estadoResultadoJn').textContent.includes('recalcular'));
});

prueba('Cambiar topología o conjunto de nodos invalida la firma matemática y la selección', () => {
  const mutaciones = [
    g => g.conexiones.push({ id: 'nueva', desde: 'E', hacia: 'B', valor: 1 }),
    g => { g.conexiones = g.conexiones.filter(c => c.id !== 'e0'); },
    g => g.nodos.push({ id: 'X', nombre: 'X', x: 100, y: 100 }),
    g => { g.nodos = g.nodos.filter(n => n.id !== 'E'); g.conexiones = g.conexiones.filter(c => c.desde !== 'E' && c.hacia !== 'E'); }
  ];
  mutaciones.forEach(mutar => {
    const { ctx, estado, johnson, consulta } = preparar();
    mutar(estado);
    ctx.refrescarVistaJohnson();
    igual(ctx.resultadoVigenteJohnson(), false);
    igual(johnson.seleccion, null);
    igual(estado.visualizacionJohnson, null);
    igual(consulta.modeloActivo, null);
    igual(consulta.errorRutaActiva, null);
    igual(ctx.contenidoPasoJohnson(johnson.resultado, { tipo: 'ruta' }).grafo.visual, null);
  });
});

prueba('Dijkstra rápido rechaza negativos con explicación y conserva consulta Johnson válida', () => {
  const { ctx, estado, johnson } = preparar(g => { g.conexiones[0].valor = -1; });
  const visual = estado.visualizacionJohnson;
  const seleccion = johnson.seleccion;
  ctx.ejecutarDijkstra('A');
  igual(estado.resultadoDijkstraRapido, null);
  cierto(estado.visualizacionJohnson === visual);
  cierto(johnson.seleccion === seleccion);
  cierto(ctx.avisos.some(aviso => aviso.tipo === 'error' && aviso.mensaje.includes('no admite pesos negativos')));
  ctx.dibujarResultadoJohnson();
  igual(estado.visualizacionJohnson.valoresNodos.B.minimo, -1);
});

prueba('Resultado sin camino y ruta trivial se reconstruyen sin datos residuales', () => {
  const { ctx, estado, obtener } = preparar(g => g.nodos.push({ id: 'X', nombre: 'X', x: 700, y: 500 }));
  ctx.actualizarConsultaRutaJohnson(0, 4);
  ctx.dibujarResultadoJohnson();
  cierto(obtener('jnRutaDetalle').textContent.includes('No existe un camino'));
  cierto(estado.visualizacionJohnson.valoresNodos.X.minimo === Infinity);
  ctx.actualizarConsultaRutaJohnson(0, 0);
  ctx.dibujarResultadoJohnson();
  igual(estado.visualizacionJohnson.distancia, 0);
  cierto(obtener('jnRutaDetalle').textContent.includes('Mismo nodo: 0 = 0'));
  igual(estado.visualizacionJohnson.nodos, ['A']);
});

prueba('Ciclo ajeno bloquea máximo y conserva mínimo matemático y acumulado de la ruta activa', () => {
  const { ctx, estado, obtener } = preparar(g => {
    ['X', 'Y', 'Z'].forEach(id => g.nodos.push({ id, nombre: id, x: 100, y: 500 }));
    [['X', 'Y'], ['Y', 'Z'], ['Z', 'X']].forEach(([desde, hacia], i) => g.conexiones.push({ id: 'ciclo' + i, desde, hacia, valor: 1 }));
  });
  ctx.dibujarResultadoJohnson();
  igual(estado.visualizacionJohnson.valoresNodos.B, { minimo: 19, maximo: null });
  igual(valoresDibujados(ctx, estado, 'B').valores, ['19', '19']);
  igual(valoresDibujados(ctx, estado, 'B').rotulos, ['Acum.', 'Total']);
  cierto(obtener('jnAvisoMaximo').textContent.includes('no implica automáticamente un máximo infinito'));
});

function prepararAlternativas() {
  const preparado = preparar(g => {
    // Tercer recorrido de costo 28: se distingue del mínimo 19 y máximo 58.
    g.conexiones.push({ id: 'intermedia', desde: 'E', hacia: 'B', valor: 22 });
  });
  preparado.johnson.vista = 'resultado';
  // La geometría del lienzo pertenece a la comprobación real en navegador.
  preparado.ctx.dibujarLienzo = () => {};
  return preparado;
}

async function pruebaAsync(nombre, fn) {
  let error;
  try { await fn(); } catch (e) { error = e; }
  prueba(nombre, () => { if (error) throw error; });
}

(async () => {
  await pruebaAsync('Buscar alternativas integra enumeración real, omite principales y permite destacar la tercera ruta', async () => {
    const { ctx, estado, consulta, obtener } = prepararAlternativas();
    const resultado = evaluar(ctx, 'estadoJohnson.resultado');
    const minimos = JSON.stringify(resultado.distancias);
    const maximos = JSON.stringify(consulta.maximos.distancias);
    const busqueda = ctx.buscarAlternativasJohnson();
    cierto(consulta.busqueda, 'La búsqueda debe dejar su tarea cancelable mientras cede el control');
    cierto(obtener('jnBuscarAlternativas').disabled);
    await busqueda;
    igual(consulta.busqueda, null);
    igual(consulta.alternativas.length, 1);
    const alternativa = consulta.alternativas[0];
    igual(alternativa.id, 'alternativa-1');
    igual(alternativa.nodos, ['A', 'E', 'B']);
    igual(alternativa.conexiones, ['e1', 'intermedia']);
    igual(alternativa.pesos, [6, 22]);
    igual(alternativa.distancia, 28);
    igual(consulta.minimo.ruta.distancia, 19);
    igual(consulta.maximo.ruta.distancia, 58);
    igual(JSON.stringify(resultado.distancias), minimos);
    igual(JSON.stringify(consulta.maximos.distancias), maximos);
    cierto(consulta.avisoBusqueda.includes('3 caminos simples encontrados; 1 adicionales a los principales'));
    cierto(consulta.avisoBusqueda.includes('sin garantía de ranking'));
    consulta.seleccionRutaId = alternativa.id;
    ctx.actualizarConsultaRutaJohnson(0, 3);
    ctx.dibujarResultadoJohnson();
    igual(estado.visualizacionJohnson.rutaSeleccionada.id, alternativa.id);
    igual(estado.visualizacionJohnson.conexiones, ['e1', 'intermedia']);
    igual(estado.visualizacionJohnson.distancia, 28);
    igual(estado.visualizacionJohnson.valoresNodos.B, { minimo: 19, maximo: 58 });
    igual(valoresDibujados(ctx, estado, 'B').valores, ['28', '28']);
    igual(valoresDibujados(ctx, estado, 'B').rotulos, ['Acum.', 'Total']);
    igual(consulta.modeloActivo.acumuladas, [0, 6, 28]);
    cierto(ctx.clasesJohnsonConexion(estado.conexiones.find(c => c.id === 'intermedia'), estado.visualizacionJohnson).includes('jn-ruta-seleccionada'));
    cierto(obtener('jnRutaDetalle').textContent.includes('6 + 22 = 28'));
  });

  await pruebaAsync('Cancelar búsqueda durante su cesión inicial no aplica rutas tardías', async () => {
    const { ctx, estado, consulta } = prepararAlternativas();
    const busqueda = ctx.buscarAlternativasJohnson();
    const tarea = consulta.busqueda;
    ctx.cancelarBusquedaCaminosJohnson();
    igual(tarea.cancelada, true);
    await busqueda;
    igual(consulta.busqueda, null);
    igual(consulta.alternativas, []);
    cierto(consulta.avisoBusqueda.includes('Búsqueda cancelada; lista parcial'));
    igual(estado.visualizacionJohnson.valoresNodos.B, { minimo: 19, maximo: 58 });
    igual(consulta.minimo.ruta.distancia, 19);
    igual(consulta.maximo.ruta.distancia, 58);
  });

  await pruebaAsync('Editar matemáticas durante búsqueda no restaura rutas ni selección después de invalidar', async () => {
    const { ctx, estado, johnson, consulta } = prepararAlternativas();
    const busqueda = ctx.buscarAlternativasJohnson();
    const tarea = consulta.busqueda;
    estado.conexiones[0].valor = 59;
    ctx.refrescarVistaJohnson();
    igual(tarea.cancelada, true);
    igual(consulta.busqueda, null);
    await busqueda;
    igual(consulta.alternativas, []);
    igual(consulta.avisoBusqueda, '');
    igual(consulta.minimo, null);
    igual(consulta.maximo, null);
    igual(estado.visualizacionJohnson, null);
    igual(johnson.seleccion, null);
    igual(ctx.resultadoVigenteJohnson(), false);
  });

  await pruebaAsync('Cambiar par durante búsqueda conserva la nueva consulta y descarta el resultado anterior', async () => {
    const { ctx, estado, johnson, consulta } = prepararAlternativas();
    const busqueda = ctx.buscarAlternativasJohnson();
    const tarea = consulta.busqueda;
    ctx.actualizarConsultaRutaJohnson(0, 2);
    const visualNueva = estado.visualizacionJohnson;
    igual(tarea.cancelada, true);
    await busqueda;
    igual(consulta.busqueda, null);
    igual(consulta.alternativas, []);
    igual(consulta.avisoBusqueda, '');
    igual(johnson.seleccion, { origen: 0, destino: 2 });
    cierto(estado.visualizacionJohnson === visualNueva);
    igual(estado.visualizacionJohnson.destino, 'D');
    igual(estado.visualizacionJohnson.distancia, 11);
  });

  process.exitCode = informe('Johnson FASE 1: estado y vistas con DOM mínimo') ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
