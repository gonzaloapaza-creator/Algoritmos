/* Motor de Algo: reconoce preguntas por coincidencia puntuada contra la base de
 * conocimiento, mantiene un contexto conversacional pequeño en memoria y
 * construye explicaciones dinámicas a partir del estado leído por AlgoContexto.
 * No usa red, almacenamiento ni cálculo de algoritmos. No es un modelo
 * generativo: cuando no reconoce una pregunta, lo dice. */
'use strict';

(() => {
  if (window.AlgoMotor || !window.AlgoConocimiento || !window.AlgoContexto) return;
  const K = window.AlgoConocimiento, C = window.AlgoContexto, I = C.interno;

  /* ---------------- Normalización y comparación de palabras ---------------- */
  const ABREVIATURAS = { q: 'que', k: 'que', xq: 'por que', pq: 'por que', porq: 'por que', xk: 'por que', porque: 'por que',
    dif: 'diferencia', ej: 'ejemplo', ejm: 'ejemplo', ejem: 'ejemplo', tb: 'tambien', tmb: 'tambien', nw: 'northwest',
    min: 'minimo', max: 'maximo', info: 'informacion', expl: 'explica', x: 'por', d: 'de' };
  const FRASES = [['esquina noroeste', 'northwest'], ['bellman ford', 'bellman-ford'], ['union find', 'union-find'],
    ['binary search tree', 'bst'], ['arbol binario de busqueda', 'bst'], ['o grande', 'notacion'], ['big o', 'notacion']];
  const SINONIMOS = { vertice: 'nodo', vertices: 'nodos', arista: 'conexion', aristas: 'conexiones', noroeste: 'northwest',
    coste: 'costo', costes: 'costos', hungara: 'hungaro', nodito: 'nodo', grafica: 'grafo', ordenamientos: 'ordenamiento',
    relajar: 'relajacion', relajando: 'relajacion', sirve: 'servir', sirven: 'servir',
    elimino: 'eliminar', elimina: 'eliminar', borro: 'borrar', borra: 'borrar',
    sale: 'salir', saliendo: 'salir', salio: 'salir', infinita: 'infinito',
    distinto: 'diferente', permite: 'acepta', permiten: 'acepta', repetir: 'repetido', leo: 'leer', lee: 'leer', interpreto: 'leer' };
  const IRREGULARES = { matrices: 'matriz', raices: 'raiz', veces: 'vez', luces: 'luz' };
  const VACIAS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'con', 'para', 'por', 'sobre',
    'entre', 'y', 'o', 'u', 'e', 'que', 'cual', 'cuales', 'como', 'es', 'son', 'esta', 'este', 'esto', 'estos', 'estas', 'ese', 'esa', 'eso',
    'esos', 'esas', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'lo', 'le', 'les', 'me', 'te', 'se', 'nos', 'hay', 'ser', 'estar', 'fue', 'era',
    'tengo', 'tiene', 'tienen', 'puedo', 'puede', 'pueden', 'debo', 'debe', 'quiero', 'saber', 'necesito', 'favor', 'hola', 'buenas',
    'gracias', 'explicame', 'explica', 'explicar', 'dime', 'decime', 'cuentame', 'quisiera', 'gustaria', 'podrias', 'puedes', 'ayudame',
    'entender', 'significa', 'significan', 'quiere', 'decir', 'entonces', 'pues', 'bueno', 'ah', 'eh', 'ok', 'vale', 'tambien', 'ya',
    'aqui', 'alli', 'ahi', 'cuando', 'donde', 'muy', 'bien', 'mas', 'ahora']);
  // Palabras que no deben mezclarse aunque se parezcan.
  const CONFUNDIBLES = new Set(['peso|paso', 'grado|grafo', 'costo|corto', 'ciclo|cielo', 'nodo|modo', 'lista|vista', 'origen|orden',
    'insercion|inversion', 'factible|posible', 'cero|cerca', 'celda|cerda', 'minimo|maximo', 'bst|bts']);

  function normalizar(texto) {
    let t = I.normalizar(String(texto || '').replace(/(\d+)\s*[×x]\s*(\d+)/gi, '$1 por $2'));
    t = t.replace(/\bque (?:estoy viendo|veo)\b/g, 'actual')
      .replace(/\b(?:sigue|continua) (?=\w+(?:ando|iendo)\b)/g, '');
    FRASES.forEach(([frase, canon]) => { t = t.replace(new RegExp('\\b' + frase + '\\b', 'g'), canon); });
    const palabras = t.split(' ').filter(Boolean);
    return palabras.map((p, i) => p === 'q' && (i > 0 || palabras.length === 1) ? p : ABREVIATURAS[p] || p).join(' ');
  }
  function canonico(palabra) {
    let p = SINONIMOS[palabra] || palabra;
    if (IRREGULARES[p]) return IRREGULARES[p];
    p = SINONIMOS[p] || p;
    if (p.length > 4 && p.endsWith('s') && !/^(?:menos|tres|seis|despues|entonces|antes)$/.test(p)) p = p.slice(0, -1);
    return SINONIMOS[p] || p;
  }
  function tokens(texto, conVacias) {
    const todos = normalizar(texto).replace(/\b\d+ por \d+\b/g, 'dimension')
      .replace(/\b(?:de|del) (?:un |el )?algoritmo\b/g, '').split(' ').filter(p => p.length > 1 || p === 'q' || /^\d$/.test(p));
    const lista = conVacias ? todos : todos.filter(p => !VACIAS.has(p));
    return Array.from(new Set(lista.map(canonico)));
  }
  function distancia(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const m = a.length, n = b.length, d = [];
    for (let i = 0; i <= m; i++) { d[i] = [i]; }
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function igualToken(q, t) {
    if (q === t) return true;
    if (CONFUNDIBLES.has(q + '|' + t) || CONFUNDIBLES.has(t + '|' + q)) return false;
    const corto = Math.min(q.length, t.length);
    if (corto >= 5 && (t.startsWith(q) || q.startsWith(t)) && Math.abs(t.length - q.length) <= 6) return true;
    if (corto >= 5) { const d = distancia(q, t); if (d <= (corto >= 10 ? 2 : 1)) return true; }
    return false;
  }
  /* ---------------- Índice de la base ---------------- */
  let indice = null, pesos = new Map();
  function construirIndice() {
    indice = K.entradas().map(e => ({
      entrada: e,
      variantes: [e.pregunta].concat(e.variantes).map(v => ({ plano: normalizar(v), contenido: tokens(v), completos: tokens(v, true) })),
      conceptos: e.conceptos.map(c => tokens(c, true)).filter(c => c.length)
    }));
    const frecuencias = new Map();
    indice.forEach(item => new Set(item.variantes.flatMap(v => v.contenido)).forEach(t => frecuencias.set(t, (frecuencias.get(t) || 0) + 1)));
    pesos = new Map(Array.from(frecuencias, ([t, n]) => [t, 1 + Math.log(1 + indice.length / n)]));
  }
  const asegurarIndice = () => { if (!indice || indice.length !== K.entradas().length) construirIndice(); };

  function puntuar(pregunta, opciones) {
    asegurarIndice();
    const contenido = tokens(pregunta), completos = tokens(pregunta, true);
    if (!contenido.length) return indice.filter(item => item.variantes.some(v => v.plano === normalizar(pregunta)))
      .map(item => ({ entrada: item.entrada, total: 165, claves: [], cobertura: 100, exacta: true }));
    const activo = opciones.modulo, mencionados = opciones.mencionados || [];
    const plano = normalizar(pregunta), cache = new Map();
    const similitud = (a, b) => {
      if (a === b) return 1;
      const clave = a + '|' + b;
      if (!cache.has(clave)) cache.set(clave, igualToken(a, b) ? 0.78 : 0);
      return cache.get(clave);
    };
    const peso = t => pesos.get(t) || 4;
    const suma = ts => ts.reduce((n, t) => n + peso(t), 0);
    const coincidencia = (ts, t) => Math.max(0, ...ts.map(q => similitud(q, t)));
    const diagnostico = /\b(?:me sale|me aparece|me salio|me saliendo|me apareciendo|no acepta|no puedo|no deja|no me deja|no encuentro|no guarda|no coincide|cambio|hay un ficticio|(?:muy|demasiado) rapid[oa])\b/.test(plano)
      || contenido.includes('no') && contenido.includes('acepta');
    const definicion = /^(?:que (?:es|son|significa)|definicion)/.test(plano);
    const contextual = /\b(?:este|esta|estos|estas|mi|mis|actual|seleccionad[oa]|ahora|aqui)\b/.test(normalizar(pregunta));
    return indice.map(item => {
      let mejor = 0, cobertura = 0, exacta = false;
      item.variantes.forEach(v => {
        const literal = plano === v.plano;
        if (!v.contenido.length && !literal) return;
        const recall = v.contenido.length ? v.contenido.reduce((n, t) => n + peso(t) * coincidencia(contenido, t), 0) / suma(v.contenido) : 1;
        const precision = contenido.reduce((n, t) => n + peso(t) * coincidencia(v.contenido, t), 0) / suma(contenido);
        const mismos = contenido.length === v.contenido.length && contenido.every(t => v.contenido.includes(t));
        const puntaje = 100 * (0.4 * recall + 0.6 * precision) + (literal ? 65 : mismos ? 28 : 0);
        if (puntaje > mejor) { mejor = puntaje; cobertura = precision * 100; exacta = literal; }
      });
      const claves = [], compuestas = [];
      item.conceptos.forEach(c => {
        if (c.every(t => completos.includes(t))) { claves.push(c.join(' ')); if (c.length > 1) compuestas.push(c.length); }
      });
      let afinidad = 0;
      const modulos = item.entrada.modulos;
      const general = modulos.includes('*');
      if (mencionados.length) afinidad = general || mencionados.some(m => modulos.includes(m)) ? 8 : -24;
      else if (activo && activo !== 'inicio') afinidad = general || modulos.includes(activo) ? 6 : -12;
      if (contextual && item.entrada.dinamica) afinidad += 8;
      if (diagnostico) afinidad += item.entrada.tema === 'problemas' ? 14 : 0;
      if (definicion && !contextual && item.entrada.dinamica) afinidad -= 55;
      if (!/\b(?:diferencia|diferencias|vs|versus|compara|comparar)\b/.test(plano) && /diferencia/.test(normalizar(item.entrada.pregunta))) afinidad -= 16;
      const total = mejor + (claves.length ? 10 : 0) + 8 * Math.max(0, ...compuestas) + afinidad;
      return { entrada: item.entrada, total, claves, cobertura, exacta };
    }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
  }

  function agruparEquivalentes(candidatos, pregunta) {
    if (tokens(pregunta).length < 2) return candidatos;
    const grupos = [];
    candidatos.forEach(c => {
      const grupo = grupos.find(g => Math.abs(g.total - c.total) < 7 && !g.entrada.dinamica && !c.entrada.dinamica
        && g.claves.some(k => c.claves.includes(k)));
      if (!grupo) { grupos.push(c); return; }
      // Una definición general y su explicación específica comparten el concepto
      // reconocido. Conservamos una sola opción y preferimos la del módulo.
      if (c.entrada.modulos.includes(c.entrada.tema) && !grupo.entrada.modulos.includes(grupo.entrada.tema)) {
        grupos[grupos.indexOf(grupo)] = Object.assign({}, c, { total: grupo.total });
      }
    });
    return grupos;
  }

  /* ---------------- Contexto conversacional ---------------- */
  const memoria = { entrada: null, modulo: null, mostrado: new Set(), firma: null };
  function recordar(entrada, nivel, foto) {
    if (memoria.entrada !== entrada) memoria.mostrado = new Set();
    memoria.entrada = entrada;
    memoria.modulo = foto ? foto.modulo : memoria.modulo;
    memoria.firma = foto ? foto.firma : null;
    if (nivel) memoria.mostrado.add(nivel);
  }
  function reiniciar() { memoria.entrada = null; memoria.modulo = null; memoria.mostrado = new Set(); memoria.firma = null; }

  /* ---------------- Construcción de respuestas ---------------- */
  const MAX_ACCIONES = 5;
  const texto = v => K.texto(v);
  function accionesDe(entrada) {
    const acciones = [];
    if (texto(entrada.sencilla) && !memoria.mostrado.has('sencilla')) acciones.push({ etiqueta: 'Más sencillo', comando: { tipo: 'nivel', id: entrada.id, nivel: 'sencilla' } });
    if (texto(entrada.ejemplo) && !memoria.mostrado.has('ejemplo')) acciones.push({ etiqueta: 'Ver un ejemplo', comando: { tipo: 'nivel', id: entrada.id, nivel: 'ejemplo' } });
    if (texto(entrada.detalle) && !memoria.mostrado.has('detalle')) acciones.push({ etiqueta: 'Más detalle', comando: { tipo: 'nivel', id: entrada.id, nivel: 'detalle' } });
    const comparables = Object.keys(entrada.comparar || {}).filter(id => K.porId(id));
    if (comparables.length) acciones.push({ etiqueta: '¿En qué se diferencia de…?', comando: { tipo: 'comparaciones', id: entrada.id } });
    if (entrada.relacionadas.some(id => K.porId(id))) acciones.push({ etiqueta: 'Preguntas relacionadas', comando: { tipo: 'relacionadas', id: entrada.id } });
    return acciones.slice(0, MAX_ACCIONES);
  }
  function respuestaEntrada(entrada, nivel, foto, prefijo) {
    const cuerpo = texto(entrada[nivel]) || texto(entrada.breve);
    recordar(entrada, nivel, foto);
    const partes = [];
    if (prefijo) partes.push(prefijo);
    if (nivel !== 'breve' && nivel !== 'sencilla') partes.push({ ejemplo: 'Ejemplo:', detalle: 'Más detalle:' }[nivel] || '');
    partes.push(cuerpo);
    return { tipo: 'conocimiento', entrada: entrada.id, texto: partes.filter(Boolean).join('\n'), referencia: entrada.referencia || null, acciones: accionesDe(entrada) };
  }
  function sinCobertura(foto, pregunta) {
    reiniciar();
    const sugeridas = C.sugeridas(foto, pregunta).slice(0, 3);
    return { tipo: 'desconocida', entrada: null,
      texto: I.SIN_EXPLICACION + ' También puedo explicarte conceptos básicos, el uso de la aplicación y problemas frecuentes.\n\nPuedes preguntar:\n' + sugeridas.map(p => '• ' + p).join('\n'),
      acciones: [{ etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } }, { etiqueta: 'Ver ejemplos de preguntas', comando: { tipo: 'ejemplos' } }] };
  }
  function aclaracion(candidatos) {
    reiniciar();
    return { tipo: 'aclaracion', entrada: null,
      texto: 'Tu pregunta puede referirse a más de un tema. ¿Cuál te interesa?',
      acciones: candidatos.slice(0, 4).map(c => ({ etiqueta: c.entrada.pregunta, comando: { tipo: 'entrada', id: c.entrada.id } })) };
  }
  function respuestaDoble(a, b, foto) {
    const comparacion = (a.comparar && a.comparar[b.id]) || (b.comparar && b.comparar[a.id]);
    reiniciar(); // Dos conceptos requieren una referencia explícita en el seguimiento.
    const cuerpo = comparacion ? texto(comparacion)
      : a.pregunta + '\n' + texto(a.breve) + '\n\n' + b.pregunta + '\n' + texto(b.breve);
    return { tipo: 'conocimiento', entrada: a.id, texto: (comparacion ? '' : 'Tu pregunta toca dos temas:\n\n') + cuerpo,
      acciones: [{ etiqueta: 'Más sobre: ' + a.pregunta, comando: { tipo: 'entrada', id: a.id } }, { etiqueta: 'Más sobre: ' + b.pregunta, comando: { tipo: 'entrada', id: b.id } }] };
  }

  /* ---------------- Explicaciones dinámicas del ejercicio ---------------- */
  const valor = I.valor, nombres = I.NOMBRES;
  const lista = v => Array.isArray(v) ? v : [];
  const nombre = (c, id) => I.nombreNodo(c, id);
  function comoSeleccionar(modulo) {
    return {
      johnson: 'Con la herramienta «Seleccionar», toca un nodo o una conexión del grafo. En la pestaña Resultado, toca una celda de la matriz para ver su ruta.',
      dijkstra: 'Toca un punto o una conexión en el dibujo, o elígelo en «Editar un punto existente» / «Editar una conexión existente».',
      kruskal: 'Toca un punto o una conexión en el dibujo, o elígelo en «Editar un punto existente» / «Editar una conexión existente».',
      asignacion: 'Con la herramienta «Seleccionar», toca un recurso, una tarea o una conexión del grafo; en la pestaña Resultado, toca una pareja.',
      northwest: 'Esquina noroeste no tiene selección de celdas: edita directamente en la tabla de Datos. En la resolución, cada paso señala la celda en curso.',
      ordenamiento: 'Toca un pino o barra, o usa «Consultar posición» para elegirlo por número.',
      arboles: 'Toca un nodo del árbol, o enfócalo con Tab y pulsa Enter o Espacio.'
    }[modulo] || 'Abre un módulo para seleccionar elementos de su ejercicio.';
  }
  function dinamicaVista(modulo, c, foto) {
    if (modulo === 'inicio') return 'Vista actual: Inicio · catálogo. ' + I.TEMAS.inicio.datos;
    const temas = I.TEMAS[modulo];
    const clave = c.vista === 'resultado' ? 'resultado' : ['procedimiento', 'resolucion', 'preparando'].includes(c.vista) ? 'pasos' : 'datos';
    let r = 'Vista actual: ' + nombres[modulo] + ', vista «' + c.vista + '».\n' + temas[clave];
    if (c.resultadoVigente && c.paso) r += '\nPaso actual: ' + c.paso.numero + ' de ' + c.paso.total + '.';
    else if (!c.resultadoVigente && modulo !== 'inicio') r += '\nTodavía no hay un resultado vigente.';
    if (c.error) r += '\nAviso actual: ' + c.error;
    return r;
  }
  function dinamicaSeleccion(modulo, c) {
    const s = c.seleccion;
    if (!s) return 'No hay ningún elemento seleccionado en este momento. ' + comoSeleccionar(modulo);
    if (s.tipo === 'nodo') return 'Nodo seleccionado: «' + (s.nombre || s.id) + '»' + (s.grupo ? ' (' + s.grupo + ')' : '') + '. Puedes editarlo, moverlo o eliminarlo con los controles del módulo.';
    if (s.tipo === 'conexion') return 'Conexión seleccionada: ' + nombre(c, s.desde) + ' → ' + nombre(c, s.hacia) + ', peso ' + valor(s.valor) + '. Puedes cambiar su peso o eliminarla.';
    if (s.tipo === 'pareja') return 'Pareja seleccionada: ' + s.recurso + ' – ' + s.tarea + '. Valor: ' + (s.valor === null ? 'pendiente (sin dato; no equivale a cero)' : valor(s.valor)) + '.';
    if (s.tipo === 'pino') return 'Elemento seleccionado: posición ' + (s.indice + 1) + ' con valor ' + valor(s.valor) + ' (identificador ' + s.id + '). La posición corresponde al paso que estás viendo.';
    if (s.tipo === 'valor') return 'Nodo seleccionado en el árbol: valor ' + valor(s.valor) + '. El panel del módulo indica su padre, sus hijos y si es raíz u hoja.';
    return 'Hay una selección, pero no tengo detalles para describirla.';
  }
  function dinamicaCelda(modulo, c) {
    if (modulo === 'johnson') {
      if (!c.resultadoVigente) return 'La matriz de la pestaña 2 muestra los pesos directos de tus conexiones: fila origen, columna destino; un guion significa que no hay conexión directa. Calcula para obtener la matriz de distancias mínimas y selecciona una celda del resultado para ver su ruta.';
      const s = c.resultado && c.resultado.seleccion;
      if (s && s.origenNombre) return I.explicarResultado(modulo, c) + '\nLa fila es el origen y la columna el destino.';
      return 'No hay una celda seleccionada en el resultado. Toca una celda de la matriz de distancias para conocer su distancia y la ruta que la produce.';
    }
    if (modulo === 'asignacion') {
      const s = c.seleccion;
      if (s && s.tipo === 'pareja') return 'La celda ' + s.recurso + ' – ' + s.tarea + ' guarda el ' + (c.datos && c.datos.objetivo === 'max' ? 'beneficio' : 'costo') + ' de esa pareja: ' + (s.valor === null ? 'está pendiente, sin dato (no es cero).' : valor(s.valor) + '.') + (c.resultadoVigente ? ' Si aparece resaltada en el resultado, forma parte de la asignación elegida.' : '');
      return 'Cada celda de la matriz es una pareja recurso (fila) – tarea (columna) con su valor. ' + comoSeleccionar(modulo);
    }
    if (modulo === 'northwest') {
      const p = c.paso, d = c.datos || {};
      if (c.resultadoVigente && p && typeof p.fila === 'number' && typeof p.col === 'number') {
        const o = lista(d.origenes)[p.fila], t = lista(d.destinos)[p.col];
        const escala = d.escalaCostos || 1;
        const ficticio = c.resultado && c.resultado.ficticio;
        const origen = o ? o.nombre : ficticio && ficticio.tipo === 'origen' && ficticio.indice === p.fila ? 'Origen ficticio' : 'Origen fuera de la muestra';
        const destino = t ? t.nombre : ficticio && ficticio.tipo === 'destino' && ficticio.indice === p.col ? 'Destino ficticio' : 'Destino fuera de la muestra';
        return 'Celda del paso actual: ' + origen + ' → ' + destino + '.\nCantidad asignada: ' + valor(p.cantidad) + (p.operacion ? ' (' + p.operacion + ')' : '') + '. Costo unitario: ' + (typeof p.costoUnitario === 'number' ? p.costoUnitario / escala : valor(p.costoUnitario)) + '.' + (p.basicaCero ? '\nEs un 0 básico: pertenece a la base sin representar un envío.' : '');
      }
      return 'En la tabla de Datos, cada celda central es el costo unitario de enviar una unidad desde el origen de la fila al destino de la columna; la última columna es la oferta y la última fila la demanda. Tras resolver, la celda muestra la cantidad enviada.';
    }
    return 'Este módulo no trabaja con celdas de matriz.';
  }
  function dinamicaArista(modulo, c) {
    if (!c.resultadoVigente) return I.faltaResultado(c);
    const p = c.paso;
    if (modulo === 'kruskal') {
      if (!p || !p.arista) return 'Avanza hasta el paso de la conexión que te interesa: cada paso de Kruskal revisa una sola conexión.';
      const conexion = lista(c.datos && c.datos.conexiones).find(x => x.id === p.arista);
      const etiqueta = conexion ? nombre(c, conexion.desde) + ' – ' + nombre(c, conexion.hacia) + ' (peso ' + valor(conexion.valor) + ')' : p.arista;
      const grupo = id => lista(p.componentesAntes).find(g => g.includes(id));
      let r;
      if (p.aceptada) {
        r = 'Conexión ' + etiqueta + ': aceptada. Sus extremos estaban en grupos distintos' + (conexion && grupo(conexion.desde) && grupo(conexion.hacia) ? ' ({' + grupo(conexion.desde).map(id => nombre(c, id)).join(', ') + '} y {' + grupo(conexion.hacia).map(id => nombre(c, id)).join(', ') + '})' : '') + ', así que unirlos no forma ciclo. Peso acumulado: ' + valor(p.pesoAcumulado) + '.';
      } else {
        r = 'Conexión ' + etiqueta + ': descartada. Sus dos extremos ya pertenecían al mismo grupo' + (conexion && grupo(conexion.desde) ? ' {' + grupo(conexion.desde).map(id => nombre(c, id)).join(', ') + '}' : '') + ', por lo que añadirla cerraría un ciclo. El peso acumulado se mantiene en ' + valor(p.pesoAcumulado) + '.';
      }
      return r + '\nKruskal revisa las conexiones ordenadas por peso (' + (c.datos && c.datos.objetivo === 'max' ? 'de mayor a menor' : 'de menor a mayor') + '); en empates, por orden de creación.';
    }
    if (modulo === 'dijkstra') {
      if (!p || !p.desde) return 'Avanza hasta un paso que revise una conexión: Dijkstra las examina al finalizar cada vértice.';
      return I.explicarPaso(modulo, c) + '\n' + (p.mejora ? 'Se registró una mejora porque la candidata (' + valor(p.anterior === null ? null : p.candidata) + ') es menor que la distancia anterior (' + valor(p.anterior) + ').' : 'No hubo mejora porque la candidata no es menor que la distancia ya conocida.');
    }
    return 'Esta pregunta corresponde a Kruskal o Dijkstra.';
  }
  function dinamicaCambio(modulo, c) {
    if (!c.resultadoVigente) return I.faltaResultado(c);
    const p = c.paso;
    if (!p) return 'Aún no hay un paso seleccionado. Avanza al procedimiento.';
    const lineas = ['Paso ' + p.numero + ' de ' + p.total + ' · ' + (p.titulo || p.tipo || '') + '.'];
    if (modulo === 'johnson' && p.pasada) {
      const cambios = lista(p.pasada.antes).map((a, i) => ({ a, d: p.pasada.despues[i], i })).filter(x => x.a !== x.d);
      lineas.push(cambios.length ? 'Distancias que cambiaron en esta pasada: ' + cambios.map(x => nombre(c, lista(c.resultado && c.resultado.ids)[x.i]) + ': ' + valor(x.a) + ' → ' + valor(x.d)).join('; ') + '.' : 'Ninguna distancia cambió en esta pasada.');
    } else if (modulo === 'dijkstra') {
      if (p.actual) lineas.push('Se finalizó el vértice ' + nombre(c, p.actual) + '.');
      if (p.desde && p.hacia) lineas.push(p.mejora ? 'La distancia a ' + nombre(c, p.hacia) + ' bajó de ' + valor(p.anterior) + ' a ' + valor(p.candidata) + ' pasando por ' + nombre(c, p.desde) + '.' : 'Se revisó ' + nombre(c, p.desde) + ' → ' + nombre(c, p.hacia) + ' sin cambios.');
      if (!p.actual && !p.desde) lineas.push(p.texto || 'Sin cambios registrados en las distancias.');
    } else if (modulo === 'kruskal') {
      lineas.push((p.aceptada ? 'Se aceptó' : 'Se descartó') + ' la conexión ' + valor(p.arista) + '. Grupos: ' + lista(p.componentesAntes).length + ' → ' + lista(p.componentesDespues).length + '. Peso acumulado: ' + valor(p.pesoAcumulado) + '.');
    } else if (modulo === 'asignacion') {
      lineas.push(p.texto || 'Consulta la matriz del paso en la pestaña Procedimiento.');
    } else if (modulo === 'northwest') {
      lineas.push('Se asignaron ' + valor(p.cantidad) + ' unidades en la celda (fila ' + (p.fila + 1) + ', columna ' + (p.col + 1) + ').' + (p.movimiento ? ' Movimiento: ' + p.movimiento + '.' : '') + (p.basicaCero ? ' Es un 0 básico.' : ''));
    } else if (modulo === 'ordenamiento') {
      if (lista(p.moviendo).length) lineas.push('Se movieron las posiciones ' + p.moviendo.map(i => i + 1).join(' y ') + '.');
      else if (lista(p.comparando).length) lineas.push('Se compararon las posiciones ' + p.comparando.map(i => i + 1).join(' y ') + ' sin mover nada.');
      else lineas.push(p.texto || 'Evento sin movimientos.');
      lineas.push('Contadores acumulados: ' + valor(p.comparaciones) + ' comparaciones, ' + valor(p.intercambios) + ' movimientos.');
    } else if (modulo === 'arboles') {
      lineas.push(p.tipo === 'emitir' ? 'Se agregó ' + valor(p.valor) + ' a la salida.' : 'Se visitó el nodo ' + valor(p.valor) + ' sin emitirlo todavía.');
    }
    return lineas.join('\n');
  }
  function dinamicaTotal(modulo, c) {
    if (!c.resultadoVigente || !c.resultado) return I.faltaResultado(c);
    const r = c.resultado, d = c.datos || {};
    if (modulo === 'kruskal') {
      const conexiones = lista(d.conexiones);
      const sumandos = lista(r.elegidas).map(id => conexiones.find(x => x.id === id)).filter(Boolean);
      const completo = sumandos.length === lista(r.elegidas).length;
      return 'Peso total ' + valor(r.total) + ' = suma de los pesos de las ' + lista(r.elegidas).length + ' conexiones elegidas' + (completo && sumandos.length ? ':\n' + sumandos.map(x => nombre(c, x.desde) + ' – ' + nombre(c, x.hacia) + ': ' + valor(x.valor)).join('\n') : '. La muestra del contexto no incluye todas las conexiones; consulta la lista del resultado.') + '\nLas conexiones descartadas no suman.';
    }
    if (modulo === 'asignacion') {
      const filas = lista(d.recursos), cols = lista(d.tareas);
      return 'Total ' + valor(r.total) + ' = suma de los valores originales de las parejas elegidas:\n' + lista(r.asignaciones).map(a => valor(filas[a.fila] && filas[a.fila].nombre) + ' → ' + valor(cols[a.col] && cols[a.col].nombre) + ': ' + valor(a.valor)).join('\n') + '\nLos ceros de la matriz reducida no se usan; los elementos sin asignar no aportan.';
    }
    if (modulo === 'northwest') {
      const escala = r.escalaCostos || 1, origenes = lista(d.origenes), destinos = lista(d.destinos), costos = lista(d.costos);
      const celdas = [];
      lista(r.asignaciones).forEach((fila, i) => lista(fila).forEach((cant, j) => {
        if (typeof cant === 'number' && cant > 0) {
          const ficticio = r.ficticio && (r.ficticio.tipo === 'origen' ? r.ficticio.indice === i : r.ficticio.indice === j);
          const costo = costos[i] && typeof costos[i][j] === 'number' ? costos[i][j] / escala : ficticio ? 0 : null;
          const origen = origenes[i] ? origenes[i].nombre : ficticio && r.ficticio.tipo === 'origen' ? 'Origen ficticio' : 'Origen fuera de la muestra';
          const destino = destinos[j] ? destinos[j].nombre : ficticio && r.ficticio.tipo === 'destino' ? 'Destino ficticio' : 'Destino fuera de la muestra';
          celdas.push(origen + ' → ' + destino + ': ' + cant + ' × ' + (costo === null ? 'costo no incluido en la muestra' : costo + (ficticio ? ' (ficticio)' : '')) + (costo === null ? '' : ' = ' + Math.round(cant * costo * escala) / escala));
        }
      }));
      return 'Costo total ' + (typeof r.costoTotal === 'number' ? r.costoTotal / escala : valor(r.costoTotal)) + ' = suma de cantidad × costo unitario en cada celda con envío:\n' + (celdas.length ? celdas.join('\n') : 'Sin celdas con envío en la muestra.') + '\nLos 0 básicos y las celdas sin envío no aumentan el costo. Es el costo de la solución inicial, no necesariamente el mínimo.';
    }
    return 'Este módulo no calcula un total.';
  }
  function dinamicaSinCamino(modulo, c) {
    if (!c.resultadoVigente || !c.resultado) return I.faltaResultado(c);
    const r = c.resultado, dirigido = c.datos && c.datos.dirigido !== false;
    const causas = '\nCausas posibles: falta una conexión hacia ese vértice, la conexión existe en sentido contrario' + (dirigido ? ' (el grafo es dirigido)' : '') + ', o el vértice está aislado o en otro grupo. Añade o corrige la conexión y recalcula.';
    if (modulo === 'dijkstra') {
      const sin = lista(r.distancias).filter(v => v.distancia === '∞').map(v => nombre(c, v.nodo));
      return (sin.length ? 'Sin camino desde ' + nombre(c, r.origen) + ': ' + sin.join(', ') + '.' : 'Todos los vértices son alcanzables desde ' + nombre(c, r.origen) + ' en el resultado vigente.') + (sin.length ? causas : '')
        + (!c.seleccion ? '\nNo hay un nodo seleccionado. ' + comoSeleccionar(modulo) : '');
    }
    if (modulo === 'johnson') {
      if (r.tieneCicloNegativo) return 'Hay un ciclo negativo: no se calcularon distancias.';
      const s = r.seleccion;
      if (s && s.distancia === '∞') return 'No hay camino de ' + s.origenNombre + ' a ' + s.destinoNombre + ' respetando el sentido de las conexiones.' + causas;
      const pares = [];
      lista(r.distancias).forEach((fila, i) => lista(fila).forEach((v, j) => { if (v === '∞' && pares.length < 12) pares.push(nombre(c, lista(r.ids)[i]) + ' → ' + nombre(c, lista(r.ids)[j])); }));
      return (pares.length ? 'Pares sin camino (muestra): ' + pares.join('; ') + '.' + causas : 'En la muestra de la matriz no hay pares sin camino.') + '\nSelecciona una celda con ∞ para analizarla.';
    }
    return 'Esta pregunta corresponde a Dijkstra o Johnson.';
  }
  function dinamicaSiguiente(modulo, c) {
    if (modulo === 'inicio') return 'Elige un módulo de la ciudad (o de «Vista lista») según tu problema. Si no sabes cuál, pregúntame «¿qué algoritmo elijo según mi problema?».';
    const d = c.datos || {};
    if (c.error) return 'Primero atiende el aviso actual: ' + c.error;
    if (['johnson', 'dijkstra', 'kruskal'].includes(modulo)) {
      if (!d.cantidadVertices) return 'Crea tus primeros nodos o carga un ejemplo. Después conéctalos con pesos.';
      if (modulo === 'johnson' && d.cantidadVertices < 2) return 'Añade un segundo nodo: «Calcular Johnson» requiere al menos dos nodos. Puedes calcular incluso si hay nodos sin conexiones.';
      if (modulo === 'dijkstra' && !d.origen) return 'Elige el origen en la etapa 2 (el destino es opcional) y pulsa «Encontrar caminos mínimos».';
      if (!c.resultadoVigente) return 'Los datos están listos: pulsa ' + (modulo === 'johnson' ? '«Calcular Johnson»' : modulo === 'dijkstra' ? '«Encontrar caminos mínimos»' : '«Encontrar conexiones»') + ' y después recorre los pasos.';
    }
    if (modulo === 'asignacion' || modulo === 'northwest') {
      const pendientes = I.pendientes(modulo, c);
      if (/pendientes en el contexto|Añade al menos/.test(pendientes)) return pendientes.split('\n')[0] + ' Luego pulsa ' + (modulo === 'asignacion' ? '«Resolver asignación»' : '«Continuar: balanceo →» y «Confirmar balanceo y resolver»') + '.';
      if (!c.resultadoVigente) return 'Los datos parecen completos: ' + (modulo === 'asignacion' ? 'elige Minimizar o Maximizar y pulsa «Resolver asignación».' : 'revisa el balanceo y pulsa «Confirmar balanceo y resolver».');
    }
    if (modulo === 'ordenamiento') {
      if (d.entradaPendiente !== undefined) return 'Pulsa «Usar valores» para preparar el procedimiento con la lista que escribiste.';
      if (d.preparando) return 'Espera a que termine la preparación o cancélala si la lista es muy grande.';
      if (!c.resultadoVigente) return 'Escribe o genera una lista, elige un método y pulsa «Usar valores».';
    }
    if (modulo === 'arboles') {
      if (!d.raiz) return 'Agrega valores con «Agregar», carga el ejemplo de clase o reconstruye un árbol con recorridos.';
      if (!c.resultadoVigente) return 'Elige un recorrido (preorden, inorden o postorden) y pulsa «Reproducir» o «Siguiente» para verlo paso a paso.';
    }
    if (c.resultadoVigente && c.paso && c.paso.numero < c.paso.total) return 'Estás en el paso ' + c.paso.numero + ' de ' + c.paso.total + '. Avanza con «Siguiente» o reproduce; pregúntame «¿qué cambió en este paso?» cuando quieras.';
    if (c.resultadoVigente) return 'El procedimiento está completo. Revisa el resultado, pregúntame «¿qué significa este resultado?» o modifica los datos para comparar.';
    return I.GUIAS[modulo];
  }
  const DINAMICAS = {
    vista: dinamicaVista, seleccion: dinamicaSeleccion, celda: dinamicaCelda, arista: dinamicaArista, cambio: dinamicaCambio,
    total: dinamicaTotal, 'sin-camino': dinamicaSinCamino, siguiente: dinamicaSiguiente,
    paso: (m, c) => I.explicarPaso(m, c), resultado: (m, c) => I.explicarResultado(m, c), pendientes: (m, c) => I.pendientes(m, c)
  };
  function respuestaDinamica(entrada, foto, solicitado) {
    if (solicitado && solicitado !== foto.modulo) {
      reiniciar();
      return { tipo: 'dinamica', entrada: entrada.id, texto: 'Abre ' + nombres[solicitado] + ' para consultar su ejercicio actual. Ahora estás en ' + nombres[foto.modulo] + '; no tengo el estado de otro módulo.', acciones: [] };
    }
    const c = foto.contexto, modulo = foto.modulo;
    const aplica = entrada.modulos.includes('*') || entrada.modulos.includes(modulo)
      || modulo === 'inicio' && ['vista', 'siguiente', 'pendientes', 'paso', 'resultado'].includes(entrada.dinamica);
    let cuerpo;
    if (!aplica) cuerpo = 'Esta pregunta corresponde a ' + entrada.modulos.filter(m => nombres[m]).map(m => nombres[m]).join(', ') + '. Estás en ' + nombres[modulo] + '. ' + texto(entrada.breve);
    else cuerpo = DINAMICAS[entrada.dinamica](modulo, c, foto);
    if (lista(c.omitidos).length && aplica) cuerpo += '\n\nEl contexto es una muestra limitada: ' + c.omitidos.join(' ');
    recordar(entrada, 'breve', foto);
    const acciones = [];
    if (entrada.dinamica !== 'siguiente') acciones.push({ etiqueta: '¿Qué tengo que hacer ahora?', comando: { tipo: 'entrada', id: 'ejercicio.siguiente' } });
    entrada.relacionadas.filter(id => K.porId(id) && !K.porId(id).dinamica).slice(0, 2).forEach(id => acciones.push({ etiqueta: K.porId(id).pregunta, comando: { tipo: 'entrada', id } }));
    return { tipo: 'dinamica', entrada: entrada.id, texto: nombres[modulo] + ' · ' + cuerpo, acciones };
  }

  /* ---------------- Seguimientos ---------------- */
  const SEGUIMIENTOS = [
    { nivel: 'sencilla', patron: /^(?:mas (?:sencillo|facil|simple|claro)|mas simple|(?:explicamelo |explicalo |dimelo )?(?:mas )?(?:facil|sencillo|simple)|no (?:lo )?(?:entiendo|entendi)|en palabras simples|version sencilla|como para principiantes|otra vez)$/ },
    { nivel: 'ejemplo', patron: /^(?:(?:ver |dame |muestrame |pon |quiero |necesito )?(?:un |otro |algun )?ejemplos?|ejemplo|otro ejemplo|un ejemplo|ejemplos|con un ejemplo)$/ },
    { nivel: 'detalle', patron: /^(?:mas detalles?|mas informacion|mas info|amplia|ampliar|profundiza|profundizar|cuentame mas|dime mas|y que mas|sigue|continua|mas)$/ },
    { nivel: 'comparaciones', patron: /^(?:en que se diferencia(?: de)?|con que se diferencia|cual es la diferencia|diferencias?|comparar|compara)$/ },
    { nivel: 'relacionadas', patron: /^(?:preguntas relacionadas|relacionadas|que mas puedo preguntar|temas relacionados|otras preguntas)$/ },
    { nivel: 'repetir', patron: /^(?:que es(?: eso)?|que significa(?: eso)?|a que te refieres|y eso que es|que quiere decir|para que sirve|como funciona|por que|y por que|por que pasa eso)$/ },
    { nivel: 'ejercicio', patron: /^(?:y en este caso|en mi caso|y en mi ejercicio|y aqui|en este ejercicio|y en mi grafo|en mi matriz|y en el mio)$/ }
  ];
  function respuestaNivel(nivel, foto, etiqueta) {
    const e = memoria.entrada;
    if (!e) {
      if (nivel === 'repetir') return { tipo: 'aclaracion', entrada: null, texto: '¿Sobre qué término o tema quieres que te explique? Escríbelo, por ejemplo: «¿qué es una matriz?» o «¿qué es la relajación?».', acciones: [{ etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } }] };
      return { tipo: 'aclaracion', entrada: null, texto: 'Todavía no hemos hablado de un tema concreto. Pregúntame por un concepto y luego podrás pedir una versión más sencilla, un ejemplo o más detalle.', acciones: [{ etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } }, { etiqueta: 'Ver ejemplos de preguntas', comando: { tipo: 'ejemplos' } }] };
    }
    if (e.dinamica && ['sencilla', 'ejemplo', 'detalle'].includes(nivel)) {
      const fijo = e.relacionadas.map(id => K.porId(id)).find(x => x && !x.dinamica && (x.modulos.includes('*') || x.modulos.includes(foto.modulo)) && texto(x[nivel]));
      if (fijo) return respuestaEntrada(fijo, nivel, foto, 'Sobre «' + fijo.pregunta + '»:');
      return { tipo: 'aclaracion', entrada: e.id, texto: 'La explicación anterior se construyó con los datos de tu ejercicio y no tiene una versión alternativa. Puedo explicarte el concepto relacionado si me lo preguntas.', acciones: accionesDe(e) };
    }
    if (nivel === 'repetir') {
      if (e.dinamica) return respuestaDinamica(e, foto);
      if (/por que/.test(etiqueta || '') && !texto(e.detalle)) return { tipo: 'conocimiento', entrada: e.id, texto: 'No tengo una explicación adicional del porqué para este tema.\n' + texto(e.breve), acciones: accionesDe(e) };
      return respuestaEntrada(e, texto(e.detalle) && /por que/.test(etiqueta || '') ? 'detalle' : 'breve', foto, 'Sobre «' + e.pregunta + '»:');
    }
    if (nivel === 'comparaciones') return respuestaComparaciones(e.id);
    if (nivel === 'relacionadas') return respuestaRelacionadas(e.id);
    if (nivel === 'ejercicio') {
      const dinamica = K.porId('ejercicio.paso');
      if (foto.modulo === 'inicio' || !dinamica) return { tipo: 'aclaracion', entrada: e.id, texto: 'Para relacionarlo con un ejercicio, abre un módulo y prepara o calcula un caso; entonces podré leer su estado.', acciones: accionesDe(e) };
      const c = foto.contexto;
      const cuerpo = c.resultadoVigente ? (c.paso ? I.explicarPaso(foto.modulo, c) + '\n\n' : '') + I.explicarResultado(foto.modulo, c) : I.pendientes(foto.modulo, c);
      recordar(e, 'breve', foto);
      return { tipo: 'dinamica', entrada: e.id, texto: 'En tu ejercicio de ' + nombres[foto.modulo] + ':\n' + cuerpo, acciones: accionesDe(e) };
    }
    if (!texto(e[nivel])) {
      const faltante = { sencilla: 'una versión más sencilla', ejemplo: 'otro ejemplo preparado', detalle: 'más detalle preparado' }[nivel];
      return { tipo: 'aclaracion', entrada: e.id, texto: 'No tengo ' + faltante + ' para «' + e.pregunta + '». Lo esencial es:\n' + texto(e.breve), acciones: accionesDe(e) };
    }
    if (memoria.mostrado.has(nivel) && nivel === 'ejemplo') return { tipo: 'conocimiento', entrada: e.id, texto: 'Solo tengo un ejemplo preparado para «' + e.pregunta + '»; es este:\n' + texto(e.ejemplo), acciones: accionesDe(e) };
    return respuestaEntrada(e, nivel, foto);
  }
  function respuestaComparaciones(id) {
    const e = K.porId(id);
    const pares = Object.keys(e.comparar || {}).filter(o => K.porId(o));
    if (!pares.length) return { tipo: 'aclaracion', entrada: id, texto: 'No tengo una comparación preparada para «' + e.pregunta + '». Puedes preguntarme por los temas relacionados.', acciones: accionesDe(e) };
    return { tipo: 'aclaracion', entrada: id, texto: '¿Con qué quieres comparar «' + e.pregunta + '»?',
      acciones: pares.map(o => ({ etiqueta: K.porId(o).pregunta, comando: { tipo: 'comparar', a: id, b: o } })) };
  }
  function respuestaRelacionadas(id) {
    const e = K.porId(id);
    const rel = e.relacionadas.map(r => K.porId(r)).filter(Boolean);
    if (!rel.length) return { tipo: 'aclaracion', entrada: id, texto: 'No tengo preguntas relacionadas registradas para este tema.', acciones: [{ etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } }] };
    return { tipo: 'aclaracion', entrada: id, texto: 'Relacionado con «' + e.pregunta + '»:', acciones: rel.slice(0, 5).map(r => ({ etiqueta: r.pregunta, comando: { tipo: 'entrada', id: r.id } })) };
  }

  /* ---------------- Intenciones dinámicas heredadas ---------------- */
  const ENTRADA_POR_INTENCION = { guardar: 'aplicacion.guardar', traslado: 'aplicacion.json', imprimir: 'aplicacion.imprimir', imagen: 'aplicacion.png',
    pasos: 'aplicacion.pasos-controles', herramientas: 'aplicacion.crear-editar-eliminar', datos: 'aplicacion.crear-editar-eliminar',
    paso: 'ejercicio.paso', resultado: 'ejercicio.resultado', vista: 'ejercicio.vista', pendientes: 'ejercicio.pendientes', ejercicio: 'ejercicio.vista',
    errores: 'problema.no-calcula', resaltado: 'ordenamiento.colores', reglas: null, empezar: null, diferencias: null };
  function respuestaIntencion(lectura, pregunta, foto) {
    const textoAyuda = C.ayudaLocal(pregunta, foto);
    if (textoAyuda.startsWith(I.SIN_EXPLICACION)) return null;
    let id = ENTRADA_POR_INTENCION[lectura.intencion];
    if (lectura.intencion === 'reglas') id = lectura.modulo + '.reglas';
    if (lectura.intencion === 'empezar') id = lectura.modulo === 'inicio' ? 'aplicacion.que-es' : lectura.modulo + '.que-es';
    const entrada = id ? K.porId(id) : null;
    if (lectura.intencion === 'reglas' && entrada) return respuestaEntrada(entrada, 'breve', foto);
    if (entrada) recordar(entrada, 'breve', foto); else reiniciar();
    const acciones = [];
    if (entrada && !entrada.dinamica) {
      if (texto(entrada.sencilla)) acciones.push({ etiqueta: 'Más sencillo', comando: { tipo: 'nivel', id: entrada.id, nivel: 'sencilla' } });
      if (texto(entrada.ejemplo)) acciones.push({ etiqueta: 'Ver un ejemplo', comando: { tipo: 'nivel', id: entrada.id, nivel: 'ejemplo' } });
      acciones.push({ etiqueta: 'Preguntas relacionadas', comando: { tipo: 'relacionadas', id: entrada.id } });
    } else if (entrada) {
      acciones.push({ etiqueta: '¿Qué tengo que hacer ahora?', comando: { tipo: 'entrada', id: 'ejercicio.siguiente' } });
    }
    return { tipo: 'dinamica', entrada: entrada ? entrada.id : null, texto: textoAyuda, acciones };
  }

  /* ---------------- Explorador y ejemplos ---------------- */
  function explorar(modulo) {
    return K.GRUPOS.map(g => ({ titulo: g.titulo, temas: g.temas.map(clave => ({ clave, titulo: K.TEMAS[clave].titulo, descripcion: K.TEMAS[clave].descripcion, cantidad: entradasTema(clave, modulo).length })).filter(t => t.cantidad) })).filter(g => g.temas.length);
  }
  function entradasTema(clave, modulo) {
    return K.porTema(clave).filter(e => clave !== 'ejercicio' || !modulo || modulo === 'inicio' || e.modulos.includes('*') || e.modulos.includes(modulo));
  }
  function buscar(textoBusqueda, modulo) {
    const q = String(textoBusqueda || '').trim();
    if (q.length < 2) return [];
    const resultados = puntuar(q, { modulo, mencionados: I.interpretar(q, modulo).modulos }).filter(r => r.total >= 40 || r.claves.length);
    return resultados.slice(0, 12).map(r => r.entrada);
  }
  const EJEMPLOS = {
    generales: ['¿Qué es un algoritmo?', '¿Qué es una matriz?', '¿Qué es un grafo?', '¿Qué significa O(n²)?', '¿Qué algoritmo elijo según mi problema?', '¿Cómo guardo mi trabajo?', '¿Funciona sin internet?', 'No encuentro mi trabajo guardado'],
    johnson: ['¿Qué es el nodo auxiliar q?', '¿Qué son los potenciales?', 'Me aparece un ciclo negativo', '¿Por qué no me deja la conexión inversa?', '¿Qué significa esta celda?'],
    dijkstra: ['¿Qué es la relajación?', '¿Por qué no admite pesos negativos?', '¿Qué es un predecesor?', 'Me sale infinito', '¿Por qué este nodo no tiene camino?'],
    kruskal: ['¿Por qué descartó esta conexión?', '¿Qué es Union-Find?', '¿Por qué me sale un bosque?', '¿El árbol de expansión es único?', '¿Cómo salió este total?'],
    asignacion: ['¿Qué es el método húngaro?', '¿Qué es un dato pendiente?', '¿Por qué este elemento quedó sin asignar?', '¿Qué son las reducciones?', '¿Cómo salió este total?'],
    northwest: ['¿Por qué se llama esquina noroeste?', '¿Qué es el balanceo?', '¿Por qué hay un ficticio?', '¿Qué es un 0 básico?', '¿Por qué no garantiza la solución óptima?'],
    ordenamiento: ['¿Cómo funciona Merge Sort?', '¿Qué es la estabilidad?', '¿Qué significan los colores?', '¿Qué cuentan los contadores?', 'La animación va muy rápido'],
    arboles: ['¿Qué diferencia hay entre árbol binario y BST?', '¿Qué son preorden, inorden y postorden?', '¿Por qué no acepta valores repetidos?', '¿Puedo eliminar un nodo?', '¿Por qué preorden y postorden no determinan un árbol único?']
  };
  function ejemplos(modulo) {
    const propios = EJEMPLOS[modulo] || [];
    return propios.concat(EJEMPLOS.generales.filter(p => !propios.includes(p))).slice(0, 8);
  }

  /* ---------------- Entrada principal ---------------- */
  function responder(pregunta, foto, comando) {
    const f = foto || C.obtener();
    if (memoria.modulo && memoria.modulo !== f.modulo) reiniciar();
    if (comando && typeof comando === 'object') return responderComando(comando, f);
    if (typeof pregunta !== 'string' || !pregunta.trim() || pregunta.length > 1200) return sinCobertura(f, pregunta);
    const plano = normalizar(pregunta);
    if (/^(?:hola|buenas|buenos dias|buenas tardes|buenas noches|hey|holi|ayuda|help|que tal)$/.test(plano)) {
      return { tipo: 'conocimiento', entrada: null, texto: '¡Hola! Puedes preguntarme por conceptos, cómo usar los módulos o el paso que estás viendo.', acciones: [{ etiqueta: 'Ayúdame a empezar', comando: { tipo: 'empezar' } }, { etiqueta: 'Explorar temas', comando: { tipo: 'explorar' } }, { etiqueta: 'Ver ejemplos de preguntas', comando: { tipo: 'ejemplos' } }] };
    }
    if (/^(?:gracias|muchas gracias|ok gracias|perfecto|genial|entendido|listo)$/.test(plano)) {
      return { tipo: 'conocimiento', entrada: memoria.entrada ? memoria.entrada.id : null, texto: 'De nada. Si quieres, sigue preguntando sobre este tema o sobre tu ejercicio.', acciones: memoria.entrada ? accionesDe(memoria.entrada) : [] };
    }
    const lectura = I.interpretar(pregunta, f.modulo);
    const seguimiento = SEGUIMIENTOS.find(s => s.patron.test(plano));
    if (seguimiento && !lectura.modulos.length && (memoria.entrada || seguimiento.nivel !== 'comparaciones')) {
      if (seguimiento.nivel === 'detalle' && plano === 'mas' && !memoria.entrada) return sinCobertura(f, pregunta);
      return respuestaNivel(seguimiento.nivel, f, plano);
    }
    const candidatos = agruparEquivalentes(puntuar(pregunta, { modulo: f.modulo, mencionados: lectura.modulos }), pregunta);
    const mejor = candidatos[0], segundo = candidatos[1];
    const aceptable = r => r && r.total >= 58 && r.cobertura >= 65 && (r.claves.length || r.cobertura >= 76);
    const fuerte = mejor && (mejor.exacta || mejor.total >= 118 && (!segundo || mejor.total - segundo.total >= 7));
    // Una pregunta compuesta se divide por su unión, y cada lado debe reconocer
    // un concepto por sí solo. No se deducen dos temas de empates accidentales.
    const partes = plano.replace(/^(?:que )?(?:diferencias?(?: hay)? entre|compara(?:r)?) /, '').split(/\s+(?:y|vs|versus)\s+/);
    if (!fuerte && partes.length === 2) {
      const par = partes.map(p => puntuar(p, { modulo: f.modulo, mencionados: lectura.modulos })[0]);
      if (par.every(r => aceptable(r) && r.cobertura >= 76) && par[0].entrada.id !== par[1].entrada.id && par.every(r => !r.entrada.dinamica)) return respuestaDoble(par[0].entrada, par[1].entrada, f);
    }
    if (!fuerte && lectura.intencion === 'diferencias' && lectura.modulos.length >= 2) {
      reiniciar();
      return { tipo: 'dinamica', entrada: null, texto: I.diferencias(lectura), acciones: lectura.modulos.filter(m => K.porId(m + '.que-es')).map(m => ({ etiqueta: 'Más sobre ' + nombres[m], comando: { tipo: 'entrada', id: m + '.que-es' } })) };
    }
    if (lectura.intencion && !fuerte && lectura.modulos.length <= 1) {
      const r = respuestaIntencion(lectura, pregunta, f);
      if (r) return r;
    }
    if (!aceptable(mejor)) return sinCobertura(f, pregunta);
    if (segundo && aceptable(segundo) && mejor.total - segundo.total < 7) {
      return aclaracion(candidatos.filter(aceptable));
    }
    const entrada = mejor.entrada;
    if (entrada.dinamica) return respuestaDinamica(entrada, f, lectura.modulos.length === 1 ? lectura.modulos[0] : null);
    const nivel = /\bejemplo\b/.test(plano) && texto(entrada.ejemplo) ? 'ejemplo' : 'breve';
    const r = respuestaEntrada(entrada, nivel, f);
    if (nivel === 'ejemplo') { memoria.mostrado.add('breve'); r.texto = texto(entrada.breve) + '\n\nEjemplo:\n' + texto(entrada.ejemplo); r.acciones = accionesDe(entrada); }
    if (entrada.tema === 'problemas' && f.contexto && f.contexto.error) r.texto = 'Aviso actual de la aplicación: ' + f.contexto.error + '\n\n' + r.texto;
    return r;
  }
  function responderComando(comando, f) {
    switch (comando.tipo) {
      case 'entrada': {
        const e = K.porId(comando.id);
        if (!e) return sinCobertura(f, '');
        return e.dinamica ? respuestaDinamica(e, f) : respuestaEntrada(e, 'breve', f);
      }
      case 'nivel': {
        const e = comando.id ? K.porId(comando.id) : memoria.entrada;
        if (comando.id && !e) return sinCobertura(f, '');
        if (e && memoria.entrada !== e) recordar(e, null, f);
        return respuestaNivel(comando.nivel, f, '');
      }
      case 'comparaciones': return K.porId(comando.id) ? respuestaComparaciones(comando.id) : sinCobertura(f, '');
      case 'relacionadas': return K.porId(comando.id) ? respuestaRelacionadas(comando.id) : sinCobertura(f, '');
      case 'comparar': {
        const a = K.porId(comando.a), b = K.porId(comando.b);
        if (!a || !b) return sinCobertura(f, '');
        return respuestaDoble(a, b, f);
      }
      case 'empezar': {
        const r = respuestaIntencion({ intencion: 'empezar', modulo: f.modulo, modulos: [] }, '¿Cómo empiezo?', f);
        return r || sinCobertura(f, '');
      }
      case 'paso': return respuestaDinamica(K.porId('ejercicio.paso'), f);
      case 'resultado': return respuestaDinamica(K.porId('ejercicio.resultado'), f);
      case 'explorar': return { tipo: 'explorador', entrada: null, texto: 'Elige un tema o busca una pregunta.', explorador: explorar(f.modulo), acciones: [] };
      case 'tema': {
        const entradas = entradasTema(comando.clave, f.modulo);
        return { tipo: 'lista', entrada: null, texto: (K.TEMAS[comando.clave] ? K.TEMAS[comando.clave].titulo : 'Tema') + ' · ' + entradas.length + ' preguntas:', acciones: entradas.map(e => ({ etiqueta: e.pregunta, comando: { tipo: 'entrada', id: e.id } })) };
      }
      case 'ejemplos': return { tipo: 'lista', entrada: null, texto: 'Ejemplos de preguntas que puedo responder aquí:', acciones: ejemplos(f.modulo).map(p => ({ etiqueta: p, pregunta: p })) };
      default: return sinCobertura(f, '');
    }
  }

  window.AlgoMotor = Object.freeze({ responder, explorar, buscar, ejemplos, reiniciar, interno: Object.freeze({ normalizar, tokens, canonico, igualToken, puntuar, distancia, memoria: () => ({ entrada: memoria.entrada ? memoria.entrada.id : null, mostrado: Array.from(memoria.mostrado) }) }) });
})();
