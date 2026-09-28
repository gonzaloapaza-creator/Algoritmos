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
  abierta: false
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
  if (nav.abierta) return;
  nav.abierta = true;
  document.body.classList.add('nav-abierta');
  nav.fondo.hidden = false;
  nav.btn.setAttribute('aria-expanded', 'true');
  nav.btn.setAttribute('aria-label', 'Cerrar menú');
  const primero = nav.barra.querySelector('a, button');
  if (primero) primero.focus();
}

function cerrarLateral(devolverFoco) {
  if (!nav.abierta) return;
  nav.abierta = false;
  document.body.classList.remove('nav-abierta');
  nav.fondo.hidden = true;
  nav.btn.setAttribute('aria-expanded', 'false');
  nav.btn.setAttribute('aria-label', 'Abrir menú');
  if (devolverFoco !== false) nav.btn.focus();
}

function lateralAbierta() {
  return nav.abierta;
}

function inicializarNavegacion() {
  if (!nav.barra || !nav.btn) return;
  const moduloActivo = document.body.dataset.modulo || '';
  construirBarraLateral(moduloActivo);

  if (nav.modulo) {
    const alg = algoritmoPorId(moduloActivo);
    nav.modulo.textContent = alg ? alg.corto : (moduloActivo === 'inicio' ? 'Inicio' : nav.modulo.textContent);
  }

  if (leerColapsada()) document.body.classList.add('nav-colapsada');
  fijarColapsada(document.body.classList.contains('nav-colapsada'));

  nav.btn.addEventListener('click', () => (nav.abierta ? cerrarLateral() : abrirLateral()));
  nav.fondo.addEventListener('click', () => cerrarLateral());
  // Escape cierra el cajón antes que cualquier otra cosa. Se escucha en captura
  // para que los módulos que también usan Escape no actúen sobre un menú abierto.
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && nav.abierta) {
      evento.stopPropagation();
      cerrarLateral();
    }
  }, true);
  // Al pasar a escritorio el cajón deja de tener sentido.
  window.matchMedia('(min-width: ' + PUNTO_CORTE_LATERAL + 'px)').addEventListener('change', e => {
    if (e.matches) cerrarLateral(false);
  });
}

inicializarNavegacion();
