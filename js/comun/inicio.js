/* Página de inicio: tarjetas por categoría construidas desde el catálogo. */

'use strict';

function crearTarjetaAlgoritmo(alg) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta-alg' + (alg.disponible ? '' : ' tarjeta-alg--pendiente');
  tarjeta.dataset.categoria = alg.categoria;

  const cabecera = document.createElement('div');
  cabecera.className = 'tarjeta-alg__cabecera';
  const icono = document.createElement('span');
  icono.className = 'tarjeta-alg__icono';
  icono.setAttribute('aria-hidden', 'true');
  icono.appendChild(svgIcono(alg.icono));
  cabecera.appendChild(icono);
  const titulo = document.createElement('h3');
  titulo.textContent = alg.etiqueta || alg.nombre;
  cabecera.appendChild(titulo);
  tarjeta.appendChild(cabecera);

  const texto = document.createElement('p');
  texto.className = 'tarjeta-alg__texto';
  texto.textContent = alg.descripcion;
  tarjeta.appendChild(texto);

  const datos = document.createElement('dl');
  datos.className = 'tarjeta-alg__datos';
  [['Entrada', alg.entrada], ['Resultado', alg.resultado]].forEach(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    datos.appendChild(dt); datos.appendChild(dd);
  });
  tarjeta.appendChild(datos);

  const pie = document.createElement('div');
  pie.className = 'tarjeta-alg__pie';
  if (alg.disponible) {
    const enlace = document.createElement('a');
    enlace.className = 'btn btn-primary';
    enlace.href = alg.ruta;
    enlace.textContent = 'Abrir ' + alg.corto;
    pie.appendChild(enlace);
  } else {
    const etiqueta = document.createElement('span');
    etiqueta.className = 'estado estado--neutro';
    etiqueta.textContent = 'Próximamente';
    pie.appendChild(etiqueta);
  }
  tarjeta.appendChild(pie);
  return tarjeta;
}

const CLAVE_VISTA_INICIO = 'ui.inicio.vista.v1';
const CLAVE_MOVIMIENTO_INICIO = 'ui.inicio.movimiento.v1';

function leerPreferenciaInicio(clave, permitidos, predeterminado) {
  try {
    const valor = localStorage.getItem(clave);
    return permitidos.includes(valor) ? valor : predeterminado;
  } catch (error) { return predeterminado; }
}

function guardarPreferenciaInicio(clave, valor) {
  try { localStorage.setItem(clave, valor); } catch (error) { /* La navegación funciona sin almacenamiento. */ }
}

function aplicarColorZona(elemento, alg) {
  elemento.style.setProperty('--zona', alg.color);
  elemento.style.setProperty('--zona-clara', alg.colorClaro);
}

function dibujarInicio() {
  const contenedor = document.getElementById('catalogo');
  if (!contenedor) return;
  const parametros = new URLSearchParams(window.location.search);
  const simular = Number(parametros.get('simular'));
  const lista = Number.isInteger(simular) && simular > CATALOGO_ALGORITMOS.length ? catalogoSimulado(Math.min(simular, 30)) : CATALOGO_ALGORITMOS;
  contenedor.replaceChildren();
  agruparCatalogo(lista).forEach(grupo => {
    const seccion = document.createElement('section');
    seccion.className = 'categoria';
    const titulo = document.createElement('h3');
    titulo.textContent = grupo.categoria.nombre;
    titulo.className = 'ciudad-categoria';
    seccion.appendChild(titulo);
    const descripcion = document.createElement('p');
    descripcion.className = 'ciudad-categoria-descripcion';
    descripcion.textContent = grupo.categoria.descripcion;
    seccion.appendChild(descripcion);
    const rejilla = document.createElement('div');
    rejilla.className = 'rejilla-tarjetas';
    grupo.algoritmos.forEach(alg => rejilla.appendChild(crearTarjetaAlgoritmo(alg)));
    seccion.appendChild(rejilla);
    contenedor.appendChild(seccion);
  });

  const mapa = document.getElementById('ciudadMapa');
  const zonas = document.getElementById('ciudadZonas');
  const panel = document.getElementById('panelModulo');
  let seleccion = null;
  let temporizador = null;
  let visible = true;
  let vistaActual = 'ciudad';
  let movimiento = leerPreferenciaInicio(CLAVE_MOVIMIENTO_INICIO, ['activo', 'pausado'], 'activo');
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
  const detenerDemo = () => {
    clearTimeout(temporizador);
    zonas.querySelectorAll('.demostrando').forEach(z => z.classList.remove('demostrando'));
  };
  const demostrar = boton => {
    detenerDemo();
    if (movimiento === 'pausado' || reducir.matches || document.hidden || !visible) return;
    boton.classList.add('demostrando');
    temporizador = setTimeout(() => boton.classList.remove('demostrando'), 1800);
  };
  const seleccionar = (alg, animar) => {
    seleccion = alg.id;
    zonas.querySelectorAll('.ciudad-zona').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.modulo === seleccion));
    });
    aplicarColorZona(panel, alg);
    panel.replaceChildren();
    const icono = document.createElement('span');
    icono.className = 'ciudad-panel-icono';
    icono.appendChild(svgIcono(alg.icono));
    const zona = document.createElement('p');
    zona.className = 'ciudad-panel-zona';
    zona.textContent = alg.zona;
    const titulo = document.createElement('h3');
    titulo.id = 'panelTitulo';
    titulo.textContent = alg.etiqueta;
    const descripcion = document.createElement('p');
    descripcion.className = 'ciudad-panel-descripcion';
    descripcion.textContent = alg.descripcion;
    const datos = document.createElement('dl');
    [['Entrada', alg.entrada], ['Resultado', alg.resultado]].forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      datos.append(dt, dd);
    });
    const abrir = document.createElement('a');
    abrir.href = alg.ruta;
    abrir.className = 'btn btn-primary ciudad-abrir';
    abrir.textContent = 'Abrir módulo';
    abrir.setAttribute('aria-label', 'Abrir módulo: ' + alg.corto);
    const nota = document.createElement('p');
    nota.className = 'ciudad-panel-nota';
    const notas = {
      arboles: 'BST por inserción y reconstrucción de árboles binarios. Incluye varios recorridos y operaciones.',
      johnson: 'Todos los pares; admite negativos y detecta ciclos negativos.',
      dijkstra: 'Desde un origen; admite cero y desconexión. Los pesos deben ser no negativos.',
      kruskal: 'Optimiza el peso total de la conexión de cada componente; los caminos mínimos se estudian en Dijkstra y Johnson.'
    };
    nota.textContent = alg.metodos ? alg.metodos.join(' · ') : (notas[alg.id] || 'Carga un ejemplo desde el módulo y sigue su procedimiento.');
    panel.append(icono, zona, titulo, descripcion, datos, abrir, nota);
    const acceso = document.getElementById('ciudadAccesoMovil');
    acceso.replaceChildren();
    const nombreMovil = document.createElement('span'); nombreMovil.textContent = alg.corto;
    const abrirMovil = document.createElement('a');
    abrirMovil.href = alg.ruta;
    abrirMovil.className = 'btn btn-primary';
    abrirMovil.textContent = 'Abrir módulo ↗';
    abrirMovil.setAttribute('aria-label', 'Abrir módulo: ' + alg.corto);
    acceso.append(nombreMovil, abrirMovil);
    const anuncio = document.getElementById('estadoCiudad');
    if (anuncio) anuncio.textContent = 'Seleccionado: ' + alg.etiqueta;
    if (animar) demostrar(zonas.querySelector('[data-modulo="' + alg.id + '"]'));
  };
  const anuncio = document.createElement('p');
  anuncio.id = 'estadoCiudad';
  anuncio.className = 'sr-only';
  anuncio.setAttribute('role', 'status');
  zonas.after(anuncio);
  const accesoMovil = document.createElement('div');
  accesoMovil.className = 'ciudad-acceso-movil';
  accesoMovil.id = 'ciudadAccesoMovil';
  mapa.after(accesoMovil);
  agruparCatalogo().forEach(grupo => grupo.algoritmos.filter(a => a.disponible).forEach((alg) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'ciudad-zona ciudad-zona--' + alg.id;
    boton.dataset.modulo = alg.id;
    boton.dataset.distrito = alg.distrito;
    boton.setAttribute('aria-pressed', 'false');
    boton.setAttribute('aria-controls', 'panelModulo');
    aplicarColorZona(boton, alg);
    boton.innerHTML = edificioCiudad(alg.escena);
    const etiqueta = document.createElement('span');
    etiqueta.className = 'ciudad-etiqueta';
    const nombre = document.createElement('strong'); nombre.textContent = alg.etiqueta;
    const edificio = document.createElement('span'); edificio.textContent = alg.zona;
    etiqueta.append(nombre, edificio);
    boton.appendChild(etiqueta);
    boton.addEventListener('click', () => seleccionar(alg, true));
    boton.addEventListener('pointerenter', () => demostrar(boton));
    boton.addEventListener('focus', () => demostrar(boton));
    boton.addEventListener('pointerleave', () => { if (document.activeElement !== boton) detenerDemo(); });
    boton.addEventListener('blur', detenerDemo);
    zonas.appendChild(boton);
  }));
  seleccionar(algoritmoPorId('johnson'), false);

  function cambiarVista(vista, guardar) {
    vistaActual = vista;
    const esCiudad = vista === 'ciudad';
    detenerDemo();
    mapa.hidden = !esCiudad;
    panel.hidden = !esCiudad;
    contenedor.hidden = esCiudad;
    accesoMovil.hidden = !esCiudad || !visible;
    document.getElementById('ciudadDistribucion').classList.toggle('es-lista', !esCiudad);
    document.getElementById('vistaCiudad').setAttribute('aria-pressed', String(esCiudad));
    document.getElementById('vistaLista').setAttribute('aria-pressed', String(!esCiudad));
    document.getElementById('btnMovimiento').hidden = !esCiudad;
    if (guardar) guardarPreferenciaInicio(CLAVE_VISTA_INICIO, vista);
  }
  ['Ciudad', 'Lista'].forEach(nombre => document.getElementById('vista' + nombre).addEventListener('click', () => cambiarVista(nombre.toLowerCase(), true)));
  cambiarVista(leerPreferenciaInicio(CLAVE_VISTA_INICIO, ['ciudad', 'lista'], 'ciudad'), false);

  const btnMovimiento = document.getElementById('btnMovimiento');
  function actualizarMovimiento() {
    detenerDemo();
    const pausado = movimiento === 'pausado' || reducir.matches;
    mapa.classList.toggle('movimiento-detenido', pausado);
    btnMovimiento.setAttribute('aria-pressed', String(pausado));
    btnMovimiento.setAttribute('aria-label', reducir.matches ? 'Movimiento reducido por preferencia del sistema' : (pausado ? 'Activar demostraciones' : 'Pausar demostraciones'));
    btnMovimiento.querySelector('span').textContent = pausado ? 'Movimiento pausado' : 'Pausar movimiento';
    btnMovimiento.disabled = reducir.matches;
  }
  btnMovimiento.addEventListener('click', () => {
    movimiento = movimiento === 'activo' ? 'pausado' : 'activo';
    guardarPreferenciaInicio(CLAVE_MOVIMIENTO_INICIO, movimiento);
    actualizarMovimiento();
  });
  reducir.addEventListener('change', actualizarMovimiento);
  document.addEventListener('visibilitychange', () => { if (document.hidden) detenerDemo(); });
  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(entradas => {
      visible = entradas[0].isIntersecting;
      accesoMovil.hidden = !visible || vistaActual !== 'ciudad';
      if (!visible) detenerDemo();
    });
    observador.observe(mapa);
  }
  actualizarMovimiento();
}

function dibujarTrabajosRecientes() {
  const caja = document.getElementById('trabajosRecientes');
  caja.replaceChildren();
  const trabajos = leerTrabajos().filter(t => algoritmoPorId(t.modulo)).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
  if (!trabajos.length) {
    const vacio = document.createElement('div');
    vacio.className = 'ciudad-sin-trabajos';
    const icono = document.createElement('span'); icono.setAttribute('aria-hidden', 'true'); icono.textContent = '↳';
    const texto = document.createElement('p');
    const titulo = document.createElement('strong'); titulo.textContent = 'Aquí continúa tu próximo descubrimiento';
    const ayuda = document.createElement('span'); ayuda.textContent = 'Abre un módulo y usa «Guardar» para encontrar aquí tus trabajos. Se conservan en este navegador.';
    texto.append(titulo, ayuda); vacio.append(icono, texto); caja.appendChild(vacio); return;
  }
  const lista = document.createElement('ul'); lista.className = 'ciudad-trabajos-lista';
  trabajos.forEach(t => {
    const alg = algoritmoPorId(t.modulo);
    const item = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.className = 'reciente-enlace';
    enlace.href = alg.ruta + '?intro=no&trabajos=1';
    aplicarColorZona(enlace, alg);
    enlace.appendChild(svgIcono(alg.icono));
    const texto = document.createElement('span');
    const nombre = document.createElement('strong'); nombre.textContent = t.nombre;
    const datos = document.createElement('span'); datos.textContent = alg.corto + ' · ' + resumenTrabajo(t);
    texto.append(nombre, datos);
    const flecha = document.createElement('span'); flecha.textContent = '↗'; flecha.setAttribute('aria-hidden', 'true');
    enlace.append(texto, flecha); item.appendChild(enlace); lista.appendChild(item);
  });
  caja.appendChild(lista);
}

function inicializarAyudaInicio() {
  document.getElementById('btnAyudaInicio').addEventListener('click', () => dialogoInformar({
    titulo: 'Explora la ciudad',
    mensaje: 'Selecciona uno de los siete edificios para conocer su módulo y pulsa «Abrir módulo» para trabajar. Usa Tab y Enter para navegar con teclado. En «Vista lista» puedes comparar los módulos: Johnson calcula todos los pares de caminos, Dijkstra los caminos desde un origen y Kruskal una conexión de peso total mínimo o máximo. «Mis trabajos» reúne los ejercicios guardados en este navegador. Puedes pausar las demostraciones desde el control de movimiento.'
  }));
  const boton = document.getElementById('btnTemaInicio');
  const actualizar = () => {
    boton.textContent = temaActual() === 'claro' ? '☾ Oscuro' : '☼ Claro';
    boton.setAttribute('aria-label', 'Cambiar al tema ' + (temaActual() === 'claro' ? 'oscuro' : 'claro'));
  };
  boton.addEventListener('click', alternarTema);
  window.addEventListener('tema:cambio', actualizar);
  actualizar();
  window.addEventListener('storage', evento => { if (!evento.key || evento.key === CLAVE_TRABAJOS) dibujarTrabajosRecientes(); });
  window.addEventListener('pageshow', dibujarTrabajosRecientes);
}
/**
 * Video «¿Qué es un algoritmo?»: hasta que se pulsa solo se muestra la miniatura,
 * así el inicio no carga el reproductor de YouTube si nadie lo va a ver.
 */
function inicializarVideoInicio() {
  const caja = document.getElementById('videoAlgoritmo');
  const boton = document.getElementById('btnVideoAlgoritmo');
  if (!caja || !boton) return;
  boton.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + caja.dataset.video + '?rel=0&autoplay=1';
    iframe.title = 'Video: ' + caja.dataset.titulo;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    caja.replaceChildren(iframe);
    iframe.focus();
  });
}

dibujarInicio();
dibujarTrabajosRecientes();
inicializarAyudaInicio();
inicializarVideoInicio();
