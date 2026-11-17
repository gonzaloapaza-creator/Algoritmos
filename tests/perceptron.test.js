'use strict';
const assert = require('node:assert/strict');
const M = require('../js/neuronales/motor');
const base = () => ({ entradas: 2, activacion: 'hardlim', aprenderUmbral: false, pesos: ['0,2','0,1'], umbral: '0,2', razon: '0,1', epocas: 30,
  patrones: [[0,0,0],[0,1,0],[1,0,0],[1,1,1]].map(([a,b,y]) => ({ x:[a,b], y })) });
let correctas = 0;
function prueba(nombre, fn) { try { fn(); correctas++; console.log('✓ ' + nombre); } catch(e) { console.error('✗ '+nombre, e); process.exitCode=1; } }
prueba('AND exacto: 3/4 a 4/4, borde z=0, corrección individual y dos épocas', () => {
  const d=base(),antes=JSON.stringify(d),r=M.entrenar(d),f=r.historial[2];
  assert.deepEqual(r.inicial.map(p=>p.salida),[0,0,1,1]);assert.deepEqual(r.final.map(p=>p.salida),[0,0,0,1]);
  assert.deepEqual(r.erradas,[1,0]);assert.equal(r.historial.length,8);assert.ok(r.convergio);
  assert.equal(f.suma,200000000000000000n);assert.equal(f.neta,0n);assert.equal(f.salida,1);assert.equal(f.y,0);assert.equal(f.error,1);
  assert.deepEqual(f.pesosAntes,[200000000000n,100000000000n]);assert.deepEqual(f.delta,[-100000000000n,0n]);assert.deepEqual(f.pesosDespues,[100000000000n,100000000000n]);
  assert.equal(f.umbralAntes,200000000000n);assert.equal(f.umbralDespues,f.umbralAntes);assert.equal(f.deltaUmbral,0n);
  assert.deepEqual(r.pesos,[100000000000n,100000000000n]);assert.equal(JSON.stringify(d),antes);
});
prueba('Historial secuencial: fila y época reciben los pesos reales de la fila previa',()=>{
  const r=M.entrenar(base());for(let i=0;i<r.historial.length;i++){
    const f=r.historial[i];assert.equal(f.epoca,Math.floor(i/4)+1);assert.equal(f.fila,i%4);
    if(i)assert.deepEqual(f.pesosAntes,r.historial[i-1].pesosDespues);
    assert.deepEqual(f.aportes,f.x.map((x,j)=>x*f.pesosAntes[j]));assert.equal(f.suma,f.aportes.reduce((a,b)=>a+b,0n));
    assert.equal(f.neta,f.suma-f.umbralAntes*1000000n);
    assert.deepEqual(f.pesosDespues,f.pesosAntes.map((w,j)=>w+f.delta[j]));
  }
});
prueba('Hardlims: entradas bipolares, error −2 y correcciones +0,2',()=>{
  const d=base();d.activacion='hardlims';d.pesos=['0','0'];d.patrones=[[-1,-1,-1],[-1,1,-1],[1,-1,-1],[1,1,1]].map(([a,b,y])=>({x:[a,b],y}));
  const r=M.entrenar(d);assert.deepEqual(r.erradas,[1,0]);assert.equal(r.historial[3].error,-2);assert.deepEqual(r.historial[3].delta,[200000000000n,200000000000n]);
  assert.deepEqual(r.final.map(p=>p.salida),[-1,-1,-1,1]);assert.ok(r.convergio);
});
prueba('OR converge y XOR llega a su límite sin declarar convergencia',()=>{
  const or=base();or.patrones.forEach((p,i)=>p.y=[0,1,1,1][i]);const ro=M.entrenar(or);assert.ok(ro.convergio);assert.deepEqual(ro.final.map(p=>p.salida),[0,1,1,1]);
  const xor=base();xor.epocas=12;xor.patrones.forEach((p,i)=>p.y=[0,1,1,0][i]);const rx=M.entrenar(xor);
  assert.equal(rx.convergio,false);assert.equal(rx.erradas.length,12);assert.deepEqual(rx.erradas,[2,...Array(11).fill(3)]);assert.equal(rx.historial.length,48);
  assert.ok(rx.final.some((p,i)=>p.salida!==xor.patrones[i].y));
});
prueba('Aprendizaje opcional del umbral se registra por separado con signo correcto',()=>{
  const d=base();d.aprenderUmbral=true;d.patrones=[{x:[1,0],y:0}];const r=M.entrenar(d),f=r.historial[0];
  assert.equal(f.deltaUmbral,100000000000n);assert.equal(f.umbralDespues,300000000000n);assert.equal(f.pesosDespues[0],100000000000n);assert.deepEqual(r.erradas,[1,0]);
});
prueba('Coma/punto equivalentes y frontera exacta sin tolerancia que cambie el signo',()=>{
  const a=base(),b=base();b.pesos=['0.2','0.1'];b.umbral='0.2';b.razon='0.1';assert.deepEqual(M.entrenar(a),M.entrenar(b));
  const d=base();d.patrones=[{x:[1,1],y:1}];d.umbral='0.3';const r=M.entrenar(d);assert.equal(r.historial[0].neta,0n);assert.equal(r.historial[0].salida,1);
  assert.equal(M.predecir([1n],[1n],0n,'hardlim').salida,1);
  assert.equal(M.predecir([1n],[-1n],0n,'hardlim').salida,0);
  assert.equal(M.predecir([1n],[-1n],0n,'hardlims').salida,-1);
});
prueba('Valida vacíos, rangos, precisión, clases, dimensiones y épocas sin mutar',()=>{
  const invalidos=[d=>d.pesos[0]='',d=>d.pesos[0]='1resto',d=>d.pesos[0]='1,2.3',d=>d.pesos[0]='0.0000001',d=>d.umbral='100.000001',d=>d.razon=0,d=>d.razon='1.000001',d=>d.epocas=101,d=>d.epocas=1.5,d=>d.epocas='',d=>d.activacion='sigmoid',d=>d.patrones[0].x[0]=true,d=>d.patrones[0].y=-1,d=>d.activacion='hardlims',d=>d.entradas=7,d=>d.patrones=[],d=>d.patrones=Array(33).fill({x:[0,0],y:0}),d=>d.aprenderUmbral='no'];
  for(const modificar of invalidos){const d=base();modificar(d);const antes=JSON.stringify(d);assert.ok(M.validar(d).errores.length);assert.ok(M.entrenar(d).errores.length);assert.equal(JSON.stringify(d),antes);}
  assert.ok(M.validar(null).errores.length);
});
prueba('Máximo 6 entradas/32 patrones/100 épocas y mínimos de razón válidos',()=>{
  const d=base();d.entradas=6;d.pesos=Array(6).fill('-100');d.razon='0,000001';d.umbral='100';d.epocas=100;d.patrones=Array.from({length:32},()=>({x:Array(6).fill('100'),y:0}));
  assert.equal(M.validar(d).errores.length,0);assert.ok(M.entrenar(d).convergio);
});
console.log(correctas+' pruebas del perceptrón correctas.');
