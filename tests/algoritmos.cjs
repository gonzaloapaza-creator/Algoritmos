const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ estado: { nodos: [], conexiones: [] } });
for (const file of ['johnson.js', 'hungaro.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), ctx);
}
let seed = 123456;
function rand(n) { seed = (1664525 * seed + 1013904223) >>> 0; return Math.floor(seed / 4294967296 * n); }
let negativeCases = 0;
for (let test = 0; test < 500; test++) {
  const n = 1 + rand(7), edges = [];
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (rand(4) === 0) {
    const value = rand(15) - 5;
    edges.push({ id: 'e' + edges.length, desde: 'n' + i, hacia: 'n' + j, valor: value });
    dist[i][j] = Math.min(dist[i][j], value);
  }
  ctx.estado.nodos = Array.from({ length: n }, (_, i) => ({ id: 'n' + i, nombre: String(i) }));
  ctx.estado.conexiones = edges;
  // Referencia independiente: Floyd-Warshall.
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
  const negative = dist.some((row, i) => row[i] < 0), result = ctx.calcularJohnson();
  assert.equal(result.tieneCicloNegativo, negative);
  if (negative) {
    negativeCases++;
    const cycle = result.cicloConexiones.map(id => edges.find(e => e.id === id));
    assert.ok(cycle.length > 0, 'Todo ciclo detectado debe reconstruirse');
    assert.ok(cycle.reduce((s, e) => s + e.valor, 0) < 0);
    cycle.forEach((e, i) => assert.equal(e.hacia, cycle[(i + 1) % cycle.length].desde));
  } else {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      assert.equal(result.distancias[i][j], dist[i][j]);
      const route = ctx.reconstruirRutaJohnson(i, j, result);
      if (dist[i][j] === Infinity) assert.equal(route, null);
      else {
        assert.ok(route);
        assert.equal(route.nodos[0], 'n' + i); assert.equal(route.nodos.at(-1), 'n' + j);
        assert.equal(route.conexiones.reduce((sum, id) => sum + edges.find(e => e.id === id).valor, 0), dist[i][j]);
      }
    }
  }
}
function brute(matrix, objective) {
  const n = Math.max(matrix.length, matrix[0].length);
  let best = objective === 'min' ? Infinity : -Infinity;
  function walk(row, used, sum) {
    if (row === n) { best = objective === 'min' ? Math.min(best, sum) : Math.max(best, sum); return; }
    for (let col = 0; col < n; col++) if (!(used & (1 << col))) walk(row + 1, used | (1 << col), sum + (matrix[row]?.[col] ?? 0));
  }
  walk(0, 0, 0); return best;
}
let assignments = 0;
for (let test = 0; test < 200; test++) {
  const rows = 1 + rand(5), cols = 1 + rand(5);
  const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => rand(25) - 10));
  for (const objective of ['min', 'max']) {
    const result = ctx.solveAssignment(matrix, objective);
    assert.equal(result.total, brute(matrix, objective));
    assert.equal(result.assignments.length, Math.min(rows, cols));
    assert.equal(new Set(result.assignments.map(a => a.row)).size, result.assignments.length);
    assert.equal(new Set(result.assignments.map(a => a.col)).size, result.assignments.length);
    const last = result.steps.at(-1);
    last.stars.forEach((row, r) => { assert.equal(row.filter(Boolean).length, 1); row.forEach((v, c) => { if (v) assert.equal(last.matrix[r][c], 0); }); });
    assignments++;
  }
}
const example = ctx.solveAssignment([[0,1,1],[0,1,1],[1,0,0]], 'min');
assert.equal(example.total, 1);
assert.ok(example.steps.some(s => s.title === 'Ajustar la matriz'));
for (const objective of ['min','max']) {
  const matrix = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => rand(200) - 100));
  assert.equal(ctx.solveAssignment(matrix, objective).total, brute(matrix, objective));
}
for (const invalid of [[], [[null]], [[1.5]], [[Infinity]], [[1000000]], [[1],[1,2]]]) assert.throws(() => ctx.solveAssignment(invalid));
console.log(`Correcto: 500 grafos (${negativeCases} ciclos negativos reconstruidos), ${assignments} casos de asignación, matrices 8×8 y validaciones.`);
