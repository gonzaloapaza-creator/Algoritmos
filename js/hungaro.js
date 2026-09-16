'use strict';

/** Método húngaro con ceros marcados, primados y caminos alternantes.
 * Matrices enteras de hasta 8×8. El resultado usa SIEMPRE los valores originales.
 * Cada paso guarda una copia independiente para poder avanzar y retroceder.
 */
function solveAssignment(matrix, objective = 'min') {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) throw new Error('La matriz está vacía.');
  const rows = matrix.length, cols = matrix[0].length, n = Math.max(rows, cols);
  if (!cols || n > 8 || !['min','max'].includes(objective) || matrix.some(row => !Array.isArray(row) || row.length !== cols ||
      row.some(v => !Number.isInteger(v) || Math.abs(v) > 999999))) {
    throw new Error('Usa una matriz de 1 a 8 filas/columnas con enteros entre −999999 y 999999.');
  }
  const padded = Array.from({length:n}, (_,r) => Array.from({length:n}, (_,c) => matrix[r]?.[c] ?? 0));
  let cost = padded.map(row => row.slice());
  const stars = Array.from({length:n}, () => Array(n).fill(false));
  const primes = Array.from({length:n}, () => Array(n).fill(false));
  let coveredRows = Array(n).fill(false), coveredCols = Array(n).fill(false);
  const steps = [];
  function record(title,text,active=null) {
    steps.push({title,text,matrix:cost.map(row=>row.slice()),
      stars:stars.map(row=>row.slice()),primes:primes.map(row=>row.slice()),
      coveredRows:coveredRows.slice(),coveredCols:coveredCols.slice(),active});
  }
  record('Matriz de trabajo', rows === cols ? 'La matriz ya es cuadrada.' :
    `Se completa ${rows}×${cols} a ${n}×${n} con recursos o tareas ficticias de valor 0. No cuentan en el total final.`);
  if (objective === 'max') {
    const max = Math.max(...cost.flat());
    cost = cost.map(row=>row.map(v=>max-v));
    record('Conversión a minimización', `Se resta cada valor del máximo (${max}). La solución final se evalúa en la matriz original.`);
  }
  const minRows=cost.map(row=>Math.min(...row));
  cost=cost.map((row,r)=>row.map(v=>v-minRows[r]));
  record('Reducción por filas',`Se resta el mínimo de cada fila: ${minRows.join(', ')}.`);
  const minCols=Array.from({length:n},(_,c)=>Math.min(...cost.map(row=>row[c])));
  cost=cost.map(row=>row.map((v,c)=>v-minCols[c]));
  record('Reducción por columnas',`Se resta el mínimo de cada columna: ${minCols.join(', ')}.`);
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) {
    if(cost[r][c]===0&&!coveredRows[r]&&!coveredCols[c]) {
      stars[r][c]=true;coveredRows[r]=true;coveredCols[c]=true;
    }
  }
  coveredRows.fill(false);
  function coverStars(){coveredCols=Array.from({length:n},(_,c)=>stars.some(row=>row[c]));}
  coverStars();
  record('Ceros independientes iniciales','★ identifica una asignación provisional. Se cubren las columnas que contienen una estrella.');
  let guard=0;
  while(coveredCols.filter(Boolean).length<n) {
    if(++guard>10000) throw new Error('No se pudo completar el procedimiento.');
    let zero=null;
    for(let r=0;r<n&&!zero;r++) for(let c=0;c<n;c++) {
      if(!coveredRows[r]&&!coveredCols[c]&&cost[r][c]===0){zero=[r,c];break;}
    }
    if(!zero) {
      let minimum=Infinity;
      for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!coveredRows[r]&&!coveredCols[c])minimum=Math.min(minimum,cost[r][c]);
      if(!Number.isFinite(minimum)||minimum<=0)throw new Error('No se pudo ajustar la matriz.');
      for(let r=0;r<n;r++)for(let c=0;c<n;c++) {
        if(coveredRows[r])cost[r][c]+=minimum;
        if(!coveredCols[c])cost[r][c]-=minimum;
      }
      record('Ajustar la matriz',`El menor valor descubierto es ${minimum}. Se resta de las casillas descubiertas y se suma en las intersecciones de dos líneas. Las casillas cubiertas una vez no cambian.`);
      continue;
    }
    const [r,c]=zero; primes[r][c]=true;
    const starCol=stars[r].indexOf(true);
    if(starCol!==-1) {
      coveredRows[r]=true;coveredCols[starCol]=false;
      record('Explorar un cero', '′ marca un cero candidato. Su fila ya contiene una estrella: se cubre esta fila y se descubre la columna de esa estrella.',zero);
    } else {
      const path=[[r,c]];
      while(true) {
        const last=path[path.length-1];
        const sr=stars.findIndex(row=>row[last[1]]);
        if(sr===-1)break;
        path.push([sr,last[1]]);
        const pc=primes[sr].indexOf(true);
        if(pc===-1)throw new Error('Camino alternante incompleto.');
        path.push([sr,pc]);
      }
      record('Camino alternante',`Se alternan candidatos y estrellas: ${path.map(([a,b])=>`(${a+1}, ${b+1})`).join(' → ')}. Se intercambiarán las marcas para aumentar el número de asignaciones.`,zero);
      path.forEach(([a,b])=>stars[a][b]=!stars[a][b]);
      primes.forEach(row=>row.fill(false));coveredRows.fill(false);coverStars();
      record('Aumentar la asignación','Se intercambian las estrellas del camino, se borran los candidatos y se cubren nuevamente las columnas con estrella.');
    }
  }
  const assignments=[];
  stars.forEach((row,r)=>row.forEach((selected,c)=>{if(selected&&r<rows&&c<cols)assignments.push({row:r,col:c,value:matrix[r][c]});}));
  const total=assignments.reduce((sum,a)=>sum+a.value,0);
  record('Asignación óptima',`Hay una estrella por fila y columna de la matriz cuadrada. Se descartan las asignaciones ficticias y se suman los valores originales: ${total}.`);
  return {assignments,total,objective,steps,padded:rows!==cols};
}
