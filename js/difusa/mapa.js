/* Mapa bajo petición. Cada lote cede el hilo y conserva solo resultados escalares. */
const DifusaMapa = (() => {
  let trabajo = null;
  function cancelar() {
    if (!trabajo) return;
    const anterior = trabajo; trabajo = null; clearTimeout(anterior.temporizador);
    anterior.resolver({ estado: 'cancelado' });
  }
  function generar(config) {
    cancelar();
    const modelo = JSON.parse(JSON.stringify(config.modelo));
    const validacion = DifusaModelo.validar(modelo, { permitirBorradores: true });
    if (!validacion.listo) return Promise.reject(new Error('Completa el sistema antes de generar el mapa.'));
    const firma = DifusaModelo.firmaMatematica(modelo);
    const xVar = modelo.entradas.find(v => v.id === config.ejeX), yVar = modelo.entradas.find(v => v.id === config.ejeY);
    if (!xVar || (modelo.entradas.length > 1 && (!yVar || xVar.id === yVar.id))) return Promise.reject(new Error('Elige dos ejes distintos.'));
    const fijos = modelo.entradas.filter(v => v.id !== xVar.id && (!yVar || v.id !== yVar.id)).map(v => {
      const lectura = DifusaModelo.leerNumero(config.valores[v.id]);
      if (!lectura.valido || lectura.valor < v.min || lectura.valor > v.max) throw new Error('Introduce un valor fijo válido para ' + v.nombre + '.');
      return { id: v.id, nombre: v.nombre, valor: lectura.valor };
    });
    const resolucion = yVar ? 15 : 101, total = yVar ? resolucion * resolucion : resolucion;
    const datos = { ejeX: xVar.id, ejeY: yVar ? yVar.id : null, fijos, resolucion, puntos: [], firma, sinSalida: 0, diagnosticos: {} };
    return new Promise((resolver, rechazar) => {
      const actual = { resolver, temporizador: null }; trabajo = actual;
      function lote() {
        if (trabajo !== actual) return;
        if (!config.estaVigente(firma)) { cancelar(); return; }
        try {
          for (let n = 0; n < 2 && datos.puntos.length < total; n++) {
            const i = datos.puntos.length, columna = yVar ? i % resolucion : i, fila = yVar ? Math.floor(i / resolucion) : 0;
            const x = columna === 0 ? xVar.min : columna === resolucion - 1 ? xVar.max : xVar.min + (xVar.max - xVar.min) * columna / (resolucion - 1);
            const y = yVar ? fila === 0 ? yVar.min : fila === resolucion - 1 ? yVar.max : yVar.min + (yVar.max - yVar.min) * fila / (resolucion - 1) : null;
            const valores = Object.fromEntries(fijos.map(f => [f.id, f.valor])); valores[xVar.id] = x; if (yVar) valores[yVar.id] = y;
            const evaluacion = DifusaMotor.evaluarSistema(modelo, valores), resultado = evaluacion.centroide.valor;
            const estado = evaluacion.sinEtiqueta ? 'ok-sin-etiqueta' : evaluacion.centroide.estado;
            datos.puntos.push({ columna, fila, x, y, resultado, estado, diagnostico: evaluacion.centroide.mensaje });
            datos.diagnosticos[estado] = (datos.diagnosticos[estado] || 0) + 1;
            if (resultado === null) datos.sinSalida++;
          }
          if (config.progreso) config.progreso(datos.puntos.length, total);
          if (datos.puntos.length < total) actual.temporizador = setTimeout(lote, 0);
          else { trabajo = null; resolver({ estado: 'completo', datos }); }
        } catch (error) { trabajo = null; rechazar(error); }
      }
      actual.temporizador = setTimeout(lote, 0);
    });
  }
  return { generar, cancelar, activo: () => Boolean(trabajo) };
})();
