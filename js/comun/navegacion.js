/* Barra lateral y cabecera compacta, comunes a todas las páginas.
 *
 * La barra se construye a partir del catálogo (catalogo.js). En escritorio es
 * una columna fija que se puede plegar a solo iconos; por debajo de 1024 px es
 * un cajón lateral que se abre desde el botón de la cabecera.
 *
 * Requiere en el documento:
 *   <button id="btnMenuLateral" aria-controls="barraLateral">
 *   <aside id="barraLateral">
 *   <div id="barraLateralFondo" hidden>
 *   <span id="topbarModulo"> (opcional)
 */

'use strict';

const CLAVE_NAV = 'ui.navegacion.v1';
const PUNTO_CORTE_LATERAL = 1024;

const nav = {
  btn: document.getElementById('btnMenuLateral'),
  barra: document.getElementById('barraLateral'),
  fondo: document.getElementById('barraLateralFondo'),
  modulo: document.getElementById('topbarModulo'),
  abierta: false,
  liberarFoco: null
};

function svgIcono(nombre, clase) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (clase) svg.setAttribute('class', clase);
  svg.innerHTML = ICONOS_ALGORITMOS[nombre] || ICONOS_ALGORITMOS.tabla;
  return svg;
}

function esEscritorio() {
  return window.matchMedia('(min-width: ' + PUNTO_CORTE_LATERAL + 'px)').matches;
}

function leerColapsada() {
  try { return localStorage.getItem(CLAVE_NAV) === 'colapsada'; } catch (e) { return false; }
}

function guardarColapsada(valor) {
  try { localStorage.setItem(CLAVE_NAV, valor ? 'colapsada' : 'abierta'); } catch (e) { /* sin almacenamiento */ }
}

function construirBarraLateral(moduloActivo) {
  const barra = nav.barra;
  barra.replaceChildren();

  const cabecera = document.createElement('div');
  cabecera.className = 'sidebar__cabecera';
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'btn btn-fantasma sidebar__cerrar';
  cerrar.textContent = 'Cerrar menú';
  cerrar.addEventListener('click', () => cerrarLateral());
  cabecera.appendChild(cerrar);
  const inicio = document.createElement('a');
  inicio.className = 'sidebar__enlace sidebar__inicio' + (moduloActivo === 'inicio' ? ' activo' : '');
  inicio.href = 'index.html';
  if (moduloActivo === 'inicio') inicio.setAttribute('aria-current', 'page');
  const iconoInicio = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconoInicio.setAttribute('viewBox', '0 0 24 24');
  iconoInicio.setAttribute('aria-hidden', 'true');
  iconoInicio.innerHTML = '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>';
  inicio.appendChild(iconoInicio);
  const textoInicio = document.createElement('span');
  textoInicio.textContent = 'Inicio';
  inicio.appendChild(textoInicio);
  cabecera.appendChild(inicio);
  barra.appendChild(cabecera);

  if (moduloActivo === 'inicio') {
    const secciones = document.createElement('div');
    secciones.className = 'sidebar__grupo sidebar__secciones-inicio';
    [['Módulos', 'titulo-algoritmos'], ['Mis trabajos', 'titulo-trabajos']].forEach(([texto, id]) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'sidebar__enlace sidebar__tema';
      boton.textContent = texto;
      boton.addEventListener('click', () => {
        cerrarLateral(false);
        const destino = document.getElementById(id);
        if (!destino) return;
        destino.setAttribute('tabindex', '-1');
        destino.scrollIntoView({ block: 'start' });
        destino.focus({ preventScroll: true });
      });
      secciones.appendChild(boton);
    });
    barra.appendChild(secciones);
  }

  const lista = document.createElement('nav');
  lista.className = 'sidebar__lista';
  lista.setAttribute('aria-label', 'Algoritmos');

  agruparCatalogo().forEach(grupo => {
    const seccion = document.createElement('div');
    seccion.className = 'sidebar__grupo';
    const titulo = document.createElement('p');
    titulo.className = 'sidebar__titulo';
    titulo.textContent = grupo.categoria.nombre;
    seccion.appendChild(titulo);

    grupo.algoritmos.forEach(alg => {
      const enlace = document.createElement(alg.disponible ? 'a' : 'span');
      enlace.className = 'sidebar__enlace' + (alg.id === moduloActivo ? ' activo' : '') + (alg.disponible ? '' : ' deshabilitado');
      if (alg.disponible) enlace.href = alg.ruta;
      if (alg.id === moduloActivo) enlace.setAttribute('aria-current', 'page');
      enlace.title = alg.nombre;
      if (alg.color) enlace.style.setProperty('--zona-color', alg.color);
      if (alg.colorClaro) enlace.style.setProperty('--zona-color-claro', alg.colorClaro);
      enlace.appendChild(svgIcono(alg.icono));
      const texto = document.createElement('span');
      texto.textContent = alg.corto;
      enlace.appendChild(texto);
      if (!alg.disponible) {
        const etiqueta = document.createElement('small');
        etiqueta.textContent = 'Próximamente';
        enlace.appendChild(etiqueta);
      }
      seccion.appendChild(enlace);
    });
    lista.appendChild(seccion);
  });
  barra.appendChild(lista);

  // Selector de tema: dentro de la lista para que también se vea en el cajón móvil.
  const ajustes = document.createElement('div');
  ajustes.className = 'sidebar__grupo sidebar__ajustes';
  const btnTema = document.createElement('button');
  btnTema.type = 'button';
  btnTema.className = 'sidebar__enlace sidebar__tema';
  btnTema.id = 'btnTema';
  btnTema.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="icono-sol"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></g><path class="icono-luna" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><span></span>';
  const actualizarTema = () => {
    const claro = typeof temaActual === 'function' && temaActual() === 'claro';
    btnTema.querySelector('span').textContent = claro ? 'Tema oscuro' : 'Tema claro';
    btnTema.title = claro ? 'Cambiar al tema oscuro' : 'Cambiar al tema claro';
    btnTema.setAttribute('aria-pressed', claro ? 'true' : 'false');
  };
  btnTema.addEventListener('click', () => { if (typeof alternarTema === 'function') alternarTema(); });
  window.addEventListener('tema:cambio', actualizarTema);
  actualizarTema();
  ajustes.appendChild(btnTema);
  // Video y ayuda siguen accesibles cuando la cabecera se compacta en móvil.
  ['btnVideoModulo', 'btnAyuda', 'btnAyudaAsignacion', 'btnAyudaNw'].forEach(id => {
    const original = document.getElementById(id);
    if (!original) return;
    const acceso = document.createElement('button');
    acceso.type = 'button';
    acceso.className = 'sidebar__enlace sidebar__tema sidebar__acceso-modulo';
    acceso.textContent = id === 'btnVideoModulo' ? 'Video del módulo' : 'Ayuda del módulo';
    acceso.addEventListener('click', () => { cerrarLateral(); original.click(); });
    ajustes.appendChild(acceso);
  });
  barra.appendChild(ajustes);

  const pie = document.createElement('div');
  pie.className = 'sidebar__pie';
  const btnPlegar = document.createElement('button');
  btnPlegar.type = 'button';
  btnPlegar.className = 'btn btn-fantasma sidebar__plegar';
  btnPlegar.id = 'btnPlegarLateral';
  btnPlegar.setAttribute('aria-label', 'Plegar la barra lateral');
  btnPlegar.innerHTML = '<span aria-hidden="true" class="sidebar__flecha">«</span><span>Plegar</span>';
  btnPlegar.addEventListener('click', () => fijarColapsada(!document.body.classList.contains('nav-colapsada')));
  pie.appendChild(btnPlegar);
  barra.appendChild(pie);
}

function fijarColapsada(valor) {
  document.body.classList.toggle('nav-colapsada', valor);
  guardarColapsada(valor);
  const btn = document.getElementById('btnPlegarLateral');
  if (btn) {
    btn.setAttribute('aria-label', valor ? 'Desplegar la barra lateral' : 'Plegar la barra lateral');
    btn.querySelector('.sidebar__flecha').textContent = valor ? '»' : '«';
    btn.querySelector('span:last-child').textContent = valor ? 'Abrir' : 'Plegar';
  }
  // El lienzo de Johnson cambia de ancho: quien lo dibuje escucha este evento.
  window.dispatchEvent(new CustomEvent('navegacion:cambio'));
}

function abrirLateral() {
  if (nav.abierta || esEscritorio()) return;
  nav.abierta = true;
  document.body.classList.add('nav-abierta');
  nav.fondo.hidden = false;
  nav.btn.setAttribute('aria-expanded', 'true');
  nav.btn.setAttribute('aria-label', 'Cerrar menú');
  nav.barra.setAttribute('role', 'dialog');
  nav.barra.setAttribute('aria-modal', 'true');
  nav.liberarFoco = activarFocoModal(nav.barra, { cerrar: cerrarLateral });
}

function cerrarLateral(devolverFoco) {
  if (!nav.abierta) return;
  nav.abierta = false;
  document.body.classList.remove('nav-abierta');
  nav.fondo.hidden = true;
  nav.btn.setAttribute('aria-expanded', 'false');
  nav.btn.setAttribute('aria-label', 'Abrir menú');
  nav.barra.removeAttribute('role');
  nav.barra.removeAttribute('aria-modal');
  nav.liberarFoco(devolverFoco);
  nav.liberarFoco = null;
}

function lateralAbierta() {
  return nav.abierta;
}

function inicializarNavegacion() {
  if (!nav.barra || !nav.btn) return;
  const moduloActivo = document.body.dataset.modulo || '';
  construirBarraLateral(moduloActivo);

  const alg = algoritmoPorId(moduloActivo);
  if (alg) {
    [['--identidad', alg.color], ['--identidad-claro', alg.colorClaro], ['--identidad-fuerte', alg.colorFuerte]].forEach(([clave, valor]) => {
      if (valor) document.body.style.setProperty(clave, valor);
    });
    const texto = document.querySelector('.modulo-cabecera__texto');
    if (texto && !texto.closest('.gm-portada')) {
      const zona = document.createElement('div');
      zona.className = 'modulo-identidad';
      zona.appendChild(svgIcono(alg.icono));
      const nombre = document.createElement('span');
      nombre.textContent = alg.zona || alg.corto;
      zona.appendChild(nombre);
      texto.prepend(zona);
      const titulo = texto.querySelector('h1');
      if (titulo && alg.etiqueta) titulo.textContent = alg.etiqueta;
    }
  }

  if (nav.modulo) {
    nav.modulo.textContent = alg ? alg.corto : (moduloActivo === 'inicio' ? 'Inicio' : nav.modulo.textContent);
    if (alg) {
      const nombre = document.createElement('span');
      nombre.textContent = alg.corto;
      nav.modulo.replaceChildren(svgIcono(alg.icono), nombre);
      nav.modulo.classList.add('topbar__modulo--identidad');
      nav.modulo.title = alg.etiqueta || alg.nombre;
    }
  }

  if (leerColapsada()) document.body.classList.add('nav-colapsada');
  fijarColapsada(document.body.classList.contains('nav-colapsada'));

  nav.btn.addEventListener('click', () => (nav.abierta ? cerrarLateral() : abrirLateral()));
  nav.fondo.addEventListener('click', () => cerrarLateral());
  // Al pasar a escritorio el cajón deja de tener sentido.
  window.matchMedia('(min-width: ' + PUNTO_CORTE_LATERAL + 'px)').addEventListener('change', e => {
    if (e.matches) cerrarLateral(false);
  });
}

inicializarNavegacion();
