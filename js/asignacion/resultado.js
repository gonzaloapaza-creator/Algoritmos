/* Resolución y vista de resultado del módulo de asignación. */

'use strict';

const resultadoAsig = {
  caja: document.getElementById('resultadoAsignacion'),
  lista: document.getElementById('listaAsignacion'),
  total: document.getElementById('totalAsignacion'),
  notas: document.getElementById('notasAsignacion'),
  estadoResultado: document.getElementById('estadoResultado'),
  sinResultado: document.getElementById('sinResultado'),
  conResultado: document.getElementById('conResultado')
};

function resolverAsignacion() {
  const estadoV = estadoValidacionAsignacion();
  if (!estadoV.ok) {
    notificar(estadoV.errores[0], 'error');
    cambiarVistaAsignacion('matriz');
    return false;
  }
  const m = estadoAsignacion.modelo;
  const matriz = matrizDelModelo(m);
  try {
    const datos = resolverHungaro(matriz, estadoAsignacion.objetivo, {
      nombresFilas: m.recursos.map(r => r.nombre),
      nombresColumnas: m.tareas.map(t => t.nombre)
    });
    let verificacion = null;
    try {
      const fb = verificarAsignacionPorFuerzaBruta(matriz, estadoAsignacion.objetivo);
      verificacion = { coincide: fb.total === datos.total, total: fb.total, cantidadOptimos: fb.cantidadOptimos, unica: fb.unica };
    } catch (e) { verificacion = null; }
    fijarResultadoAsignacion(datos, verificacion);
    estadoAsignacion.seleccion = null;
    estadoAsignacion.mostrarTodas = false;
    cambiarVistaAsignacion('resultado');
    notificar('Asignación resuelta: total ' + datos.total + '.', 'ok');
    return true;
  } catch (e) {
    notificar(e.message || 'No se pudo resolver.', 'error');
    return false;
  }
}

function etiquetaTotalAsignacion() {
  return estadoAsignacion.objetivo === 'max' ? 'Beneficio máximo total' : 'Costo mínimo total';
}

function dibujarEstadoResultadoAsignacion() {
  const chip = resultadoAsig.estadoResultado;
  if (!chip) return;
  if (!estadoAsignacion.resultado) { chip.className = 'estado estado--neutro'; chip.textContent = 'Sin resolver'; return; }
  if (resultadoVigenteAsignacion()) { chip.className = 'estado estado--ok'; chip.textContent = 'Resultado vigente · total ' + estadoAsignacion.resultado.datos.total; return; }
  chip.className = 'estado estado--aviso';
  chip.textContent = 'Datos modificados: recalcular';
}

function dibujarResultadoAsignacion() {
  if (!resultadoAsig.caja) return;
  const vigente = resultadoVigenteAsignacion();
  resultadoAsig.sinResultado.hidden = vigente;
  resultadoAsig.conResultado.hidden = !vigente;

  if (!vigente) {
    const p = resultadoAsig.sinResultado.querySelector('p');
    p.textContent = estadoAsignacion.resultado
      ? 'Los datos cambiaron después de resolver (costos, conexiones, dimensiones u objetivo). El resultado anterior ya no es válido: vuelve a calcular.'
      : 'Todavía no hay resultado. Completa el grafo o la matriz y pulsa «Resolver».';
    return;
  }

  const m = estadoAsignacion.modelo;
  const datos = estadoAsignacion.resultado.datos;
  const verificacion = estadoAsignacion.resultado.verificacion;

  resultadoAsig.total.innerHTML = '';
  const etiqueta = document.createElement('span');
  etiqueta.textContent = etiquetaTotalAsignacion();
  const valor = document.createElement('span');
  valor.className = 'total__valor';
  valor.textContent = String(datos.total);
  resultadoAsig.total.appendChild(etiqueta);
  resultadoAsig.total.appendChild(valor);

  resultadoAsig.lista.replaceChildren();
  datos.asignaciones.forEach(a => {
    const r = m.recursos[a.fila], t = m.tareas[a.col];
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    if (esConexionSeleccionada(r.id, t.id)) li.classList.add('seleccionada');
    const s = estadoAsignacion.seleccion;
    if (s && s.tipo === 'nodo' && (s.id === r.id || s.id === t.id)) li.classList.add('seleccionada');
    li.innerHTML = '<span class="lista-resultado__par"></span><span class="valor"></span>';
    li.querySelector('.lista-resultado__par').textContent = r.nombre + ' → ' + t.nombre;
    li.querySelector('.valor').textContent = String(a.valor);
    const elegir = () => seleccionarAsignacion({ tipo: 'conexion', recursoId: r.id, tareaId: t.id });
    li.addEventListener('click', elegir);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(); } });
    resultadoAsig.lista.appendChild(li);
  });

  resultadoAsig.notas.replaceChildren();
  const nota = (clase, texto) => {
    const p = document.createElement('div');
    p.className = 'mensaje ' + clase;
    p.textContent = texto;
    resultadoAsig.notas.appendChild(p);
  };
  if (datos.sinAsignarFilas.length || datos.sinAsignarColumnas.length) {
    const partes = [];
    if (datos.sinAsignarFilas.length) partes.push('sin tarea: ' + datos.sinAsignarFilas.map(i => m.recursos[i].nombre).join(', '));
    if (datos.sinAsignarColumnas.length) partes.push('sin recurso: ' + datos.sinAsignarColumnas.map(j => m.tareas[j].nombre).join(', '));
    nota('mensaje--aviso', 'Matriz rectangular ' + datos.filas + '×' + datos.columnas + ': se hicieron ' + datos.asignaciones.length + ' asignaciones reales. Quedan ' + partes.join(' · ') + '.');
  }
  if (verificacion) {
    if (verificacion.coincide) {
      nota('mensaje--ok', 'Verificación independiente (búsqueda exhaustiva): coincide el total ' + verificacion.total + '. ' +
        (verificacion.unica ? 'La solución óptima es única.' : 'Existen ' + verificacion.cantidadOptimos + ' asignaciones distintas con el mismo total óptimo; se muestra una de ellas.'));
    } else {
      nota('mensaje--error', 'La verificación exhaustiva obtuvo ' + verificacion.total + ' y el método húngaro ' + datos.total + ': revisa los datos.');
    }
  } else {
    nota('mensaje--info', 'No se pudo ejecutar la verificación exhaustiva para este tamaño; no se afirma que la solución sea única.');
  }
  nota('mensaje--info', 'El método húngaro se ejecutó en ' + datos.iteraciones + (datos.iteraciones === 1 ? ' iteración' : ' iteraciones') + ' de cobertura y ajuste tras las reducciones. Consulta el paso «Procedimiento».');

  dibujarMatrizResultadoAsignacion();
}
