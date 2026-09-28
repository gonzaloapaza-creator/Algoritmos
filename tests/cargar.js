/* Carga los scripts clásicos (sin módulos ES) en un contexto compartido de Node,
 * igual que los cargaría el navegador. Solo sirve para las capas sin DOM. */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function crearContexto() {
  const contexto = { console, Math, Number, JSON, Array, Object, String, Set, Map, Error, Date, Infinity, NaN, isFinite, isNaN };
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  return contexto;
}

function cargar(contexto, rutas) {
  rutas.forEach(ruta => {
    const absoluta = path.join(__dirname, '..', ruta);
    const codigo = fs.readFileSync(absoluta, 'utf8');
    vm.runInContext(codigo, contexto, { filename: ruta });
  });
  return contexto;
}

/* Las `const` de nivel superior no son propiedades del contexto: se leen evaluándolas. */
function evaluar(contexto, expresion) {
  return vm.runInContext(expresion, contexto);
}

/* Mini «framework»: sin dependencias. */
const resultados = { ok: 0, fallos: 0, detalles: [] };

function prueba(nombre, fn) {
  try {
    fn();
    resultados.ok++;
    resultados.detalles.push('  ✓ ' + nombre);
  } catch (e) {
    resultados.fallos++;
    resultados.detalles.push('  ✗ ' + nombre + '\n      ' + (e && e.message ? e.message : e));
  }
}

function igual(real, esperado, mensaje) {
  const a = JSON.stringify(real), b = JSON.stringify(esperado);
  if (a !== b) throw new Error((mensaje || 'Valores distintos') + '\n      esperado: ' + b + '\n      real:     ' + a);
}

function cierto(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje || 'Se esperaba verdadero');
}

function lanza(fn, mensaje) {
  let lanzo = false;
  try { fn(); } catch (e) { lanzo = true; }
  if (!lanzo) throw new Error(mensaje || 'Se esperaba una excepción');
}

function informe(titulo) {
  console.log('\n' + titulo);
  console.log(resultados.detalles.join('\n'));
  console.log('\n  ' + resultados.ok + ' correctas, ' + resultados.fallos + ' fallidas');
  return resultados.fallos === 0;
}

module.exports = { crearContexto, cargar, evaluar, prueba, igual, cierto, lanza, informe, resultados };
