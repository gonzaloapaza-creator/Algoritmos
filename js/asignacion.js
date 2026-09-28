// Las constantes ASIGNACION_STORAGE_KEY, MAX_ASIGNACION_DIMENSION, MIN_ASIGNACION_DIMENSION ahora vienen de config.js

const estadoAsignacion = {
  rows: 4,
  cols: 4,
  objective: 'min',
  labelsRows: ['Persona 1', 'Persona 2', 'Persona 3', 'Persona 4'],
  labelsCols: ['Tarea 1', 'Tarea 2', 'Tarea 3', 'Tarea 4'],
  values: []
};

const refs = {
  rowsValue: document.getElementById('rowsValue'),
  colsValue: document.getElementById('colsValue'),
  matrix: document.getElementById('asignacionMatrix'),
  resultBox: document.getElementById('asignacionResultado'),
  resultText: document.getElementById('resultadoAsignacionTexto'),
  resultMatrix: document.getElementById('resultMatrix'),
  procedure: document.getElementById('procedimientoAsignacion'),
  toastStack: document.getElementById('toastStack')
};

function createDefaultMatrix(rows, cols) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => {
      const base = rowIndex + colIndex + 1;
      return ((rowIndex * 3 + colIndex * 5 + 4) % 12) + base;
    })
  );
}

function persistAssignmentState() {
  const payload = {
    rows: estadoAsignacion.rows,
    cols: estadoAsignacion.cols,
    objective: estadoAsignacion.objective,
    labelsRows: estadoAsignacion.labelsRows,
    labelsCols: estadoAsignacion.labelsCols,
    values: estadoAsignacion.values
  };

  try {
    localStorage.setItem(ASIGNACION_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Silencioso: si no hay almacenamiento, la aplicación sigue funcionando.
  }
}

function restoreAssignmentState() {
  try {
    const raw = localStorage.getItem(ASIGNACION_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.values)) return false;

    estadoAsignacion.rows = Number.isInteger(parsed.rows) ? Math.max(1, parsed.rows) : 4;
    estadoAsignacion.cols = Number.isInteger(parsed.cols) ? Math.max(1, parsed.cols) : 4;
    estadoAsignacion.objective = parsed.objective === 'max' ? 'max' : 'min';
    estadoAsignacion.labelsRows = Array.isArray(parsed.labelsRows) && parsed.labelsRows.length ? parsed.labelsRows.slice(0, estadoAsignacion.rows) : Array.from({ length: estadoAsignacion.rows }, (_, i) => `Persona ${i + 1}`);
    estadoAsignacion.labelsCols = Array.isArray(parsed.labelsCols) && parsed.labelsCols.length ? parsed.labelsCols.slice(0, estadoAsignacion.cols) : Array.from({ length: estadoAsignacion.cols }, (_, i) => `Tarea ${i + 1}`);
    estadoAsignacion.values = parsed.values.map(row => row.map(value => Number(value) || 0));
    if (estadoAsignacion.values.length !== estadoAsignacion.rows || estadoAsignacion.values[0]?.length !== estadoAsignacion.cols) {
      throw new Error('Matriz guardada incompatible');
    }
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeMatrixSize() {
  const rows = Math.max(MIN_ASIGNACION_DIMENSION, Math.min(MAX_ASIGNACION_DIMENSION, estadoAsignacion.rows));
  const cols = Math.max(MIN_ASIGNACION_DIMENSION, Math.min(MAX_ASIGNACION_DIMENSION, estadoAsignacion.cols));
  estadoAsignacion.rows = rows;
  estadoAsignacion.cols = cols;

  while (estadoAsignacion.labelsRows.length < rows) {
    estadoAsignacion.labelsRows.push(`Persona ${estadoAsignacion.labelsRows.length + 1}`);
  }
  while (estadoAsignacion.labelsRows.length > rows) {
    estadoAsignacion.labelsRows.pop();
  }

  while (estadoAsignacion.labelsCols.length < cols) {
    estadoAsignacion.labelsCols.push(`Tarea ${estadoAsignacion.labelsCols.length + 1}`);
  }
  while (estadoAsignacion.labelsCols.length > cols) {
    estadoAsignacion.labelsCols.pop();
  }

  while (estadoAsignacion.values.length < rows) {
    estadoAsignacion.values.push(Array(cols).fill(0));
  }
  while (estadoAsignacion.values.length > rows) {
    estadoAsignacion.values.pop();
  }

  estadoAsignacion.values = estadoAsignacion.values.map((row, rowIndex) => {
    const nextRow = Array.from({ length: cols }, (_, colIndex) => {
      const value = row[colIndex];
      return Number.isFinite(value) ? Number(value) : 0;
    });
    return nextRow;
  });

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      if (!Array.isArray(estadoAsignacion.values[rowIndex])) {
        estadoAsignacion.values[rowIndex] = Array(cols).fill(0);
      }
      if (!Number.isFinite(estadoAsignacion.values[rowIndex][colIndex])) {
        estadoAsignacion.values[rowIndex][colIndex] = 0;
      }
    }
  }
}

function showToast(message, type = 'ok') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  refs.toastStack.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add('is-hiding');
    window.setTimeout(() => toast.remove(), 220);
  }, 2200);
}

const TEXTO_AYUDA_ASIGNACION =
  '1) OBJETIVO\n' +
  '· Elige si buscas MINIMIZAR (costos, tiempos) o MAXIMIZAR (ganancias, puntajes).\n\n' +
  '2) TAMAÑO DE LA MATRIZ\n' +
  `· Ajusta filas y columnas con los botones + / −, entre ${MIN_ASIGNACION_DIMENSION} y ${MAX_ASIGNACION_DIMENSION}.\n` +
  '· Si la matriz no es cuadrada, el algoritmo la completa con casillas ficticias de costo 0.\n\n' +
  '3) LA MATRIZ DE COSTOS\n' +
  '· Escribe el costo o beneficio de asignar cada fila a cada columna.\n' +
  '· Toca el nombre de una fila o columna para renombrarla.\n\n' +
  '4) RESOLVER\n' +
  '· «Resolver asignación» aplica el método húngaro y muestra la combinación óptima, el total y el procedimiento paso a paso.\n' +
  '· «Ejemplo» carga una matriz de muestra; «Limpiar» pone todos los valores en 0.\n\n' +
  '5) GUARDADO\n' +
  '· La matriz se guarda automáticamente en este navegador: al volver a abrir la página sigue ahí.';

function mostrarAyudaAsignacion() {
  document.getElementById('ayudaAsignacionMensaje').textContent = TEXTO_AYUDA_ASIGNACION;
  document.getElementById('ayudaFondo').hidden = false;
}

function cerrarAyudaAsignacion() {
  document.getElementById('ayudaFondo').hidden = true;
}

/**
 * Campo para renombrar una fila o una columna. Poder llamar a las cosas por su
 * nombre real («Torno», «Pedido 3») hace el resultado mucho más legible.
 */
function createLabelInput(dimension, index, value) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'label-input';
  input.value = value;
  input.maxLength = 24;
  input.setAttribute('aria-label', dimension === 'rows' ? `Nombre de la fila ${index + 1}` : `Nombre de la columna ${index + 1}`);
  input.addEventListener('change', () => {
    const limpio = input.value.trim();
    const porDefecto = dimension === 'rows' ? `Persona ${index + 1}` : `Tarea ${index + 1}`;
    const nombre = limpio === '' ? porDefecto : limpio;
    input.value = nombre;
    if (dimension === 'rows') estadoAsignacion.labelsRows[index] = nombre;
    else estadoAsignacion.labelsCols[index] = nombre;
    persistAssignmentState();
  });
  return input;
}

function buildMatrixFromState() {
  normalizeMatrixSize();
  refs.rowsValue.textContent = String(estadoAsignacion.rows);
  refs.colsValue.textContent = String(estadoAsignacion.cols);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.textContent = ' '; 
  headRow.appendChild(corner);

  estadoAsignacion.labelsCols.forEach((label, colIndex) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.appendChild(createLabelInput('cols', colIndex, label));
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  estadoAsignacion.values.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const rowCell = document.createElement('th');
    rowCell.scope = 'row';
    rowCell.appendChild(createLabelInput('rows', rowIndex, estadoAsignacion.labelsRows[rowIndex]));
    tr.appendChild(rowCell);

    row.forEach((value, colIndex) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.value = value;
      input.setAttribute('aria-label', `${estadoAsignacion.labelsRows[rowIndex]} - ${estadoAsignacion.labelsCols[colIndex]}`);
      input.addEventListener('input', (event) => {
        const next = Number(event.target.value);
        estadoAsignacion.values[rowIndex][colIndex] = Number.isFinite(next) ? next : 0;
        persistAssignmentState();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          const nextInput = table.querySelector(`input[data-row="${rowIndex}"][data-col="${colIndex + 1}"]`);
          if (nextInput) nextInput.focus();
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          const prevInput = table.querySelector(`input[data-row="${rowIndex}"][data-col="${colIndex - 1}"]`);
          if (prevInput) prevInput.focus();
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextInput = table.querySelector(`input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`);
          if (nextInput) nextInput.focus();
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prevInput = table.querySelector(`input[data-row="${rowIndex - 1}"][data-col="${colIndex}"]`);
          if (prevInput) prevInput.focus();
        }
      });
      input.dataset.row = String(rowIndex);
      input.dataset.col = String(colIndex);
      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  refs.matrix.replaceChildren(table);
}

/**
 * Resuelve el problema de asignación por el método húngaro.
 *
 * Admite matrices no cuadradas: se completan con filas o columnas ficticias de
 * coste 0 (que después se descartan del resultado, porque no son asignaciones
 * reales). Para maximizar se transforma el problema en uno de minimización
 * restando cada valor al máximo de la matriz.
 *
 * La búsqueda del óptimo se hace con programación dinámica sobre subconjuntos
 * (n ≤ 8, así que 8·2⁸ estados): es exacta y permite mostrar el procedimiento.
 *
 * @returns {{assignments:Array, total:number, objective:string, steps:Array}}
 */
function solveAssignment(matrix, objective) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const n = Math.max(rows, cols);
  const steps = [];

  // 1) Cuadrar la matriz con filas/columnas ficticias de coste 0.
  const padded = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r < rows && c < cols ? matrix[r][c] : 0))
  );
  if (rows !== cols) {
    steps.push({
      title: `1. Se cuadra la matriz (${rows}×${cols} → ${n}×${n})`,
      text: rows < cols
        ? `Se añaden ${n - rows} fila(s) ficticia(s) con coste 0: sobran tareas y algunas quedarán sin asignar.`
        : `Se añaden ${n - cols} columna(s) ficticia(s) con coste 0: sobran recursos y algunos quedarán sin asignar.`,
      matrix: padded
    });
  }

  // 2) Maximizar equivale a minimizar la matriz de "pérdidas".
  const maximo = Math.max(...padded.map(row => Math.max(...row)));
  const cost = objective === 'max'
    ? padded.map(row => row.map(value => maximo - value))
    : padded.map(row => row.slice());
  if (objective === 'max') {
    steps.push({
      title: `${steps.length + 1}. Conversión a minimización`,
      text: `Cada valor se resta del máximo de la matriz (${maximo}), así maximizar el beneficio equivale a minimizar esta matriz de pérdidas.`,
      matrix: cost
    });
  }

  // 3) Reducción por filas: a cada fila se le resta su mínimo.
  const rowMin = cost.map(row => Math.min(...row));
  const afterRows = cost.map((row, r) => row.map(value => value - rowMin[r]));
  steps.push({
    title: `${steps.length + 1}. Reducción por filas`,
    text: `Se resta a cada fila su valor mínimo (${rowMin.join(', ')}). Cada fila queda con al menos un cero.`,
    matrix: afterRows
  });

  // 4) Reducción por columnas sobre el resultado anterior.
  const colMin = Array.from({ length: n }, (_, c) => Math.min(...afterRows.map(row => row[c])));
  const reduced = afterRows.map(row => row.map((value, c) => value - colMin[c]));
  steps.push({
    title: `${steps.length + 1}. Reducción por columnas`,
    text: `Se resta a cada columna su valor mínimo (${colMin.join(', ')}). Los ceros marcan las asignaciones candidatas.`,
    matrix: reduced
  });

  // 5) Asignación óptima: la que suma 0 en la matriz reducida.
  const memo = new Map();

  function dp(rowIndex, mask) {
    if (rowIndex === n) return { cost: 0, path: [] };
    if (memo.has(mask)) return memo.get(mask);

    let best = { cost: Infinity, path: [] };
    for (let colIndex = 0; colIndex < n; colIndex++) {
      if ((mask & (1 << colIndex)) !== 0) continue;
      const resto = dp(rowIndex + 1, mask | (1 << colIndex));
      const total = reduced[rowIndex][colIndex] + resto.cost;
      if (total < best.cost) {
        best = { cost: total, path: [{ row: rowIndex, col: colIndex }].concat(resto.path) };
      }
    }
    memo.set(mask, best);
    return best;
  }

  const best = dp(0, 0);
  if (!Number.isFinite(best.cost)) {
    throw new Error('No se pudo completar una asignación válida.');
  }

  // Solo cuentan las casillas reales: las ficticias se descartan.
  const chosen = best.path
    .filter(({ row, col }) => row < rows && col < cols)
    .map(({ row, col }) => ({ row, col, value: matrix[row][col] }));
  const total = chosen.reduce((suma, item) => suma + item.value, 0);

  steps.push({
    title: `${steps.length + 1}. Selección óptima`,
    text: 'Se eligen los ceros de la matriz reducida de forma que haya exactamente uno por fila y por columna. Esas casillas son la asignación óptima sobre la matriz original.',
    matrix: reduced,
    highlight: best.path
  });

  return { assignments: chosen, total, objective, steps, padded: rows !== cols };
}

/** Tabla sencilla de solo lectura, usada por el procedimiento. */
function buildStaticTable(matrix, highlight) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  matrix.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    row.forEach((value, colIndex) => {
      const td = document.createElement('td');
      td.textContent = String(value);
      if (highlight && highlight.some(item => item.row === rowIndex && item.col === colIndex)) {
        td.classList.add('selected-cell');
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function renderProcedure(result) {
  refs.procedure.replaceChildren();

  result.steps.forEach((step) => {
    const block = document.createElement('section');
    block.className = 'procedure-step';

    const title = document.createElement('h3');
    title.textContent = step.title;
    block.appendChild(title);

    const text = document.createElement('p');
    text.textContent = step.text;
    block.appendChild(text);

    if (step.matrix) {
      const scroll = document.createElement('div');
      scroll.className = 'matrix-scroll matrix-scroll--step';
      scroll.appendChild(buildStaticTable(step.matrix, step.highlight));
      block.appendChild(scroll);
    }

    refs.procedure.appendChild(block);
  });
}

function renderResult(result) {
  refs.resultBox.hidden = false;
  refs.resultBox.classList.remove('is-error');
  refs.resultText.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'result-list';

  result.assignments.forEach(({ row, col, value }) => {
    const item = document.createElement('li');
    const labels = `${estadoAsignacion.labelsRows[row]} → ${estadoAsignacion.labelsCols[col]}`;
    const valueText = document.createElement('strong');
    valueText.textContent = `${labels}: ${value}`;
    item.appendChild(valueText);
    list.appendChild(item);
  });

  const total = document.createElement('p');
  total.className = 'total-value';
  const etiqueta = result.objective === 'max' ? 'Beneficio total (máximo)' : 'Costo total (mínimo)';
  total.textContent = `${etiqueta}: ${result.total}`;
  refs.resultText.appendChild(list);

  // Con matrices no cuadradas quedan recursos o tareas sin asignar: hay que decirlo.
  const sinAsignarFilas = estadoAsignacion.labelsRows
    .filter((_, i) => !result.assignments.some(a => a.row === i));
  const sinAsignarCols = estadoAsignacion.labelsCols
    .filter((_, i) => !result.assignments.some(a => a.col === i));
  if (sinAsignarFilas.length || sinAsignarCols.length) {
    const nota = document.createElement('p');
    nota.className = 'result-note';
    const partes = [];
    if (sinAsignarFilas.length) partes.push(`sin tarea: ${sinAsignarFilas.join(', ')}`);
    if (sinAsignarCols.length) partes.push(`sin asignar: ${sinAsignarCols.join(', ')}`);
    nota.textContent = `La matriz no es cuadrada, así que ${partes.join(' · ')}.`;
    refs.resultText.appendChild(nota);
  }

  refs.resultText.appendChild(total);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.textContent = ' ';
  headRow.appendChild(corner);
  estadoAsignacion.labelsCols.forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  estadoAsignacion.values.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const rowLabel = document.createElement('th');
    rowLabel.textContent = estadoAsignacion.labelsRows[rowIndex];
    tr.appendChild(rowLabel);

    row.forEach((value, colIndex) => {
      const td = document.createElement('td');
      const isSelected = result.assignments.some((item) => item.row === rowIndex && item.col === colIndex);
      const valueText = document.createTextNode(String(value));
      td.appendChild(valueText);
      if (isSelected) {
        td.classList.add('selected-cell');
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  refs.resultMatrix.replaceChildren(table);

  renderProcedure(result);
}

function handleSolve() {
  normalizeMatrixSize();
  const matrix = estadoAsignacion.values.map(row => row.slice());

  try {
    const result = solveAssignment(matrix, estadoAsignacion.objective);
    renderResult(result);
    showToast('Cálculo completado', 'ok');
    // En móvil el resultado queda fuera de pantalla si no se desplaza hasta él.
    refs.resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    refs.resultBox.hidden = true;
    showToast(error.message || 'Completa los valores de la matriz', 'error');
  }
}

function resetMatrix() {
  estadoAsignacion.values = createDefaultMatrix(estadoAsignacion.rows, estadoAsignacion.cols);
  refs.matrix.innerHTML = '';
  persistAssignmentState();
  buildMatrixFromState();
  refs.resultBox.hidden = true;
  showToast('Matriz actualizada', 'ok');
}

function applyExample() {
  estadoAsignacion.rows = 4;
  estadoAsignacion.cols = 4;
  estadoAsignacion.objective = 'min';
  const example = [
    [12, 8, 9, 14],
    [7, 10, 11, 18],
    [15, 13, 6, 9],
    [10, 17, 12, 5]
  ];
  estadoAsignacion.labelsRows = ['Trabajador A', 'Trabajador B', 'Trabajador C', 'Trabajador D'];
  estadoAsignacion.labelsCols = ['Trabajo 1', 'Trabajo 2', 'Trabajo 3', 'Trabajo 4'];
  estadoAsignacion.values = example;
  document.querySelector('input[name="objetivo"][value="min"]').checked = true;
  buildMatrixFromState();
  refs.resultBox.hidden = true;
  persistAssignmentState();
  showToast('Ejemplo cargado', 'ok');
}

function adjustDimension(dimension, step) {
  const next = dimension === 'rows' ? estadoAsignacion.rows + step : estadoAsignacion.cols + step;
  if (next < MIN_ASIGNACION_DIMENSION || next > MAX_ASIGNACION_DIMENSION) {
    showToast(`El tamaño debe estar entre ${MIN_ASIGNACION_DIMENSION} y ${MAX_ASIGNACION_DIMENSION}.`, 'error');
    return;
  }

  if (dimension === 'rows') {
    estadoAsignacion.rows = next;
  } else {
    estadoAsignacion.cols = next;
  }

  normalizeMatrixSize();
  if (estadoAsignacion.values.length < estadoAsignacion.rows) {
    while (estadoAsignacion.values.length < estadoAsignacion.rows) {
      estadoAsignacion.values.push(Array(estadoAsignacion.cols).fill(0));
    }
  }

  for (let rowIndex = 0; rowIndex < estadoAsignacion.rows; rowIndex++) {
    if (!Array.isArray(estadoAsignacion.values[rowIndex])) {
      estadoAsignacion.values[rowIndex] = Array(estadoAsignacion.cols).fill(0);
    }
    while (estadoAsignacion.values[rowIndex].length < estadoAsignacion.cols) {
      estadoAsignacion.values[rowIndex].push(0);
    }
    while (estadoAsignacion.values[rowIndex].length > estadoAsignacion.cols) {
      estadoAsignacion.values[rowIndex].pop();
    }
  }

  persistAssignmentState();
  buildMatrixFromState();
}

function initialize() {
  const restored = restoreAssignmentState();
  if (!restored) {
    estadoAsignacion.values = createDefaultMatrix(4, 4);
  }
  normalizeMatrixSize();
  buildMatrixFromState();

  document.querySelectorAll('input[name="objetivo"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      estadoAsignacion.objective = event.target.value;
      persistAssignmentState();
    });
  });

  document.querySelectorAll('[data-dimension]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.step || 0);
      adjustDimension(button.dataset.dimension, direction);
    });
  });

  document.getElementById('btnResolverAsignacion').addEventListener('click', () => {
    handleSolve();
  });

  document.getElementById('btnAsignacionLimpiar').addEventListener('click', () => {
    estadoAsignacion.values = Array.from({ length: estadoAsignacion.rows }, () => Array(estadoAsignacion.cols).fill(0));
    refs.resultBox.hidden = true;
    buildMatrixFromState();
    persistAssignmentState();
    showToast('Matriz limpiada', 'ok');
  });

  document.getElementById('btnAsignacionEjemplo').addEventListener('click', applyExample);

  const ayudaFondo = document.getElementById('ayudaFondo');
  document.getElementById('btnAyudaAsignacion').addEventListener('click', mostrarAyudaAsignacion);
  document.getElementById('btnCerrarAyudaAsignacion').addEventListener('click', cerrarAyudaAsignacion);
  ayudaFondo.addEventListener('click', (event) => {
    if (event.target === ayudaFondo) cerrarAyudaAsignacion();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !ayudaFondo.hidden) cerrarAyudaAsignacion();
  });

  if (!restored) {
    persistAssignmentState();
  }
}

initialize();
