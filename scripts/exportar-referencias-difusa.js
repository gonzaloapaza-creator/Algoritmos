/* Exporta resultados reales del nucleo para compararlos con Fuzzy Logic Toolbox.
 * Ejecutar desde cualquier carpeta: node scripts/exportar-referencias-difusa.js
 * No requiere dependencias ni MATLAB y no forma parte del paquete publico.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const motor = require('../js/difusa/motor.js');
const modeloAPI = require('../js/difusa/modelo.js');

if (typeof motor.exportarReferencias !== 'function') {
  throw new Error('El nucleo de logica difusa no dispone de exportarReferencias().');
}

const referencias = motor.exportarReferencias();
if (!referencias || referencias.version !== 1 || !Array.isArray(referencias.casos) ||
    referencias.casos.length === 0) {
  throw new Error('El nucleo devolvio referencias vacias o con un formato desconocido.');
}
referencias.casos.forEach((caso, indice) => {
  if (!Number.isFinite(caso.familiaridad) || caso.familiaridad < 0 || caso.familiaridad > 10 ||
      !Number.isFinite(caso.dificultad) || caso.dificultad < 0 || caso.dificultad > 10 ||
      !Number.isFinite(caso.resultado) || caso.resultado < 0 || caso.resultado > 100) {
    throw new Error('Referencia invalida en el caso ' + (indice + 1) + '.');
  }
});

const destino = path.join(__dirname, '..', 'matlab', 'referencias_logica_difusa.json');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(referencias, null, 2) + '\n', 'utf8');
console.log('Exportados ' + referencias.casos.length + ' casos en ' + destino + '.');
const modelo = modeloAPI.crearEjemplo('ayuda');
const configurable = {
  tipo: 'ciudad-logica-difusa-comparacion', version: 2, modelo,
  integracion: referencias.integracion,
  muestreo: { puntos: 1001, minimo: 0, maximo: 100, uso: 'consulta auxiliar; no determina el centroide' },
  reglasNumericas: modelo.reglas.map(r => modelo.entradas.map(v => v.conjuntos.findIndex(c => c.id === r.antecedentes[v.id]) + 1)
    .concat(modelo.salida.conjuntos.findIndex(c => c.id === r.consecuente) + 1, r.peso, 1)),
  casos: referencias.casos.map(c => ({ valores: [c.familiaridad, c.dificultad], resultado: c.resultado })),
  toleranciaAbs: 1e-8
};
const destinoConfigurable = path.join(__dirname, '..', 'matlab', 'referencias_sistema_difuso.json');
fs.writeFileSync(destinoConfigurable, JSON.stringify(configurable, null, 2) + '\n', 'utf8');
console.log('Exportada referencia configurable continua en ' + destinoConfigurable + '.');
console.log('Comparacion con MATLAB pendiente hasta ejecutar matlab/validar_logica_difusa.m.');
