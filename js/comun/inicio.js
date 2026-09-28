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
  titulo.textContent = alg.nombre;
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

function dibujarInicio() {
  const contenedor = document.getElementById('catalogo');
  if (!contenedor) return;

  // ?simular=N añade entradas ficticias (no disponibles) para revisar el diseño con un catálogo largo.
  const parametros = new URLSearchParams(window.location.search);
  const simular = Number(parametros.get('simular'));
  const lista = Number.isInteger(simular) && simular > CATALOGO_ALGORITMOS.length ? catalogoSimulado(Math.min(simular, 30)) : CATALOGO_ALGORITMOS;

  contenedor.replaceChildren();
  agruparCatalogo(lista).forEach(grupo => {
    const seccion = document.createElement('section');
    seccion.className = 'categoria';
    seccion.setAttribute('aria-labelledby', 'cat-' + grupo.categoria.id);

    const cabecera = document.createElement('div');
    cabecera.className = 'categoria__cabecera';
    const titulo = document.createElement('h2');
    titulo.id = 'cat-' + grupo.categoria.id;
    titulo.textContent = grupo.categoria.nombre;
    cabecera.appendChild(titulo);
    const descripcion = document.createElement('p');
    descripcion.textContent = grupo.categoria.descripcion;
    cabecera.appendChild(descripcion);
    const contador = document.createElement('span');
    contador.className = 'categoria__contador';
    const disponibles = grupo.algoritmos.filter(a => a.disponible).length;
    contador.textContent = disponibles + (disponibles === 1 ? ' disponible' : ' disponibles');
    cabecera.appendChild(contador);
    seccion.appendChild(cabecera);

    const rejilla = document.createElement('div');
    rejilla.className = 'rejilla-tarjetas';
    grupo.algoritmos.forEach(alg => rejilla.appendChild(crearTarjetaAlgoritmo(alg)));
    seccion.appendChild(rejilla);
    contenedor.appendChild(seccion);
  });

  const resumen = document.getElementById('resumenCatalogo');
  if (resumen) {
    const disponibles = lista.filter(a => a.disponible).length;
    resumen.textContent = disponibles + ' algoritmos disponibles en ' + agruparCatalogo(lista).length + ' categorías.';
  }
}

dibujarInicio();
