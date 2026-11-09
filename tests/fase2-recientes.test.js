'use strict';
const fs = require('fs');
const path = require('path');
const { crearContexto, cargar, evaluar, prueba, igual, cierto, informe } = require('./cargar');
let texto = null, lecturas = 0;
const ctx = crearContexto();
ctx.localStorage = { getItem: clave => { igual(clave, 'logica-difusa.trabajos.v2'); lecturas++; return texto; }, setItem: () => { throw new Error('El proveedor debe ser de solo lectura'); } };
cargar(ctx, ['js/comun/recientes-difusa.js', 'js/comun/catalogo.js']);
const trabajo = (id = 'trabajo-ejemplo-1') => ({ tipo: 'ciudad-logica-difusa-trabajo', version: 2, id,
  nombre: 'Ejemplo de defensa', creado: '2026-11-08T12:00:00.000Z', actualizado: '2026-11-08T13:00:00.000Z',
  modelo: { privadoDelModulo: true }, resultado: { centroide: 999 } });

prueba('Recientes lee solo metadatos; no propaga ni valida modelos o resultados importados', () => {
  const documento = { version: 2, trabajos: [trabajo()] }, original = JSON.stringify(documento);
  const salida = ctx.metadatosRecientesDifusa(documento);
  igual(salida.length, 1);
  igual(salida[0], { id: 'trabajo-ejemplo-1', nombre: 'Ejemplo de defensa', modulo: 'difusa', fecha: '2026-11-08T13:00:00.000Z', resumen: 'Biblioteca propia · abrir trabajos' });
  cierto(!('modelo' in salida[0]) && !('resultado' in salida[0]));
  igual(JSON.stringify(documento), original);
});

prueba('El proveedor acota lectura y cantidad, tolera corrupción y no escribe', () => {
  texto = JSON.stringify({ version: 2, trabajos: [trabajo()] });
  igual(ctx.leerRecientesDifusa().length, 1);
  texto = 'x'.repeat(4 * 1024 * 1024 + 1); igual(ctx.leerRecientesDifusa(), []);
  texto = '{'; igual(ctx.leerRecientesDifusa(), []);
  texto = null; igual(ctx.leerRecientesDifusa(), []);
  igual(ctx.metadatosRecientesDifusa({ version: 2, trabajos: Array.from({ length: 51 }, (_, i) => trabajo('trabajo-id-' + i)) }), []);
  cierto(lecturas === 4);
});

prueba('Registros incompatibles o IDs duplicados no se anuncian como trabajos recuperables', () => {
  for (const registros of [[trabajo(), trabajo()], [Object.assign(trabajo(), { actualizado: 'no es fecha' })], [Object.assign(trabajo(), { nombre: ' ' })], [Object.assign(trabajo(), { tipo: 'ajeno' })]]) {
    igual(ctx.metadatosRecientesDifusa({ version: 2, trabajos: registros }), []);
  }
});

prueba('Inicio deriva el número de edificios del catálogo y enlaza la biblioteca propia', () => {
  igual(evaluar(ctx, 'CATALOGO_ALGORITMOS.filter(a => a.disponible).length'), 8);
  const archivo = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  cierto(archivo('js/comun/inicio.js').includes('CATALOGO_ALGORITMOS.filter(a => a.disponible).length'));
  cierto(!archivo('js/comun/inicio.js').includes('los siete edificios'));
  cierto(archivo('index.html').includes('src="js/comun/recientes-difusa.js"'));
  const { PUBLICOS } = require('../scripts/preparar-netlify');
  cierto(PUBLICOS.includes('js/comun/recientes-difusa.js'));
  igual(ctx.algoritmoPorId('difusa').ruta, 'logica-difusa.html');
});

process.exitCode = informe('FASE 2 · recientes e inicio (sin adaptadores de otros módulos)') ? 0 : 1;
