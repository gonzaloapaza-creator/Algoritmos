'use strict';
const { crearContexto, cargar, evaluar, prueba, igual, cierto, informe } = require('./cargar');

function contextoEditor() {
  const ids = new Map();
  class Nodo {
    constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.attrs = {}; this.eventos = {}; this.value = ''; this.textContent = ''; this.className = ''; this.parent = null; }
    set id(id) { this._id = id; ids.set(id, this); }
    get id() { return this._id; }
    append(...nodos) { nodos.forEach(n => { this.children.push(n); n.parent = this; }); }
    replaceChildren(...nodos) { this.children = []; this.append(...nodos); }
    replaceWith(nodo) { if (this.parent) { const i = this.parent.children.indexOf(this); this.parent.children[i] = nodo; nodo.parent = this.parent; } }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k]; }
    addEventListener(tipo, fn) { (this.eventos[tipo] ||= []).push(fn); }
    focus() { doc.activeElement = this; }
    emitir(tipo) { return (this.eventos[tipo] || []).map(fn => fn({ target: this })); }
  }
  const body = new Nodo('body');
  function nodos() { const lista = []; function recorrer(n) { lista.push(n); n.children.forEach(recorrer); } recorrer(body); return lista; }
  const doc = {
    body, activeElement: null,
    createElement: tag => new Nodo(tag), createTextNode: texto => Object.assign(new Nodo('#text'), { textContent: texto }),
    getElementById: id => { if (!ids.has(id)) { const n = new Nodo('div'); n.id = id; body.append(n); } return ids.get(id); },
    querySelectorAll: selector => nodos().filter(n => selector === '[data-ruta-modelo]' ? n.dataset.rutaModelo : selector === '.difusa-aplicar' && n.className === 'difusa-aplicar'),
    querySelector: selector => { const m = /^\[data-ruta-modelo="([^"]+)"\]$/.exec(selector); return m ? nodos().find(n => n.dataset.rutaModelo === m[1]) || null : null; }
  };
  const ctx = crearContexto(); ctx.document = doc;
  cargar(ctx, ['js/difusa/modelo.js']);
  ctx.DifusaEstado = { estado: { modelo: ctx.DifusaModelo.crearEjemplo('ayuda') } };
  ctx.DifusaDibujo = { variable() {}, leyenda() {} };
  const avisos = []; let confirmaciones = 0;
  ctx.dialogoConfirmar = async () => { confirmaciones++; return true; };
  cargar(ctx, ['js/difusa/editor.js']);
  const editor = evaluar(ctx, 'DifusaEditor');
  editor.inicializar({ notificar: texto => avisos.push(texto), alBorrador() {}, alCancelar() {}, alCambiar() {} });
  return { ctx, editor, doc, avisos, confirmaciones: () => confirmaciones };
}

async function pruebaAsync(nombre, fn) {
  let error; try { await fn(); } catch (e) { error = e; }
  prueba(nombre, () => { if (error) throw error; });
}
(async () => {
  await pruebaAsync('H-08: dominio inválido antes de generar muestra error junto al campo y conserva aplicado', async () => {
    const { ctx, editor, doc, avisos, confirmaciones } = contextoEditor();
    const antes = JSON.stringify(ctx.DifusaEstado.estado.modelo);
    const campo = doc.getElementById('minVariableDifusa'); campo.value = 'texto'; campo.emitir('input');
    igual(await editor.generarCombinaciones(), false);
    igual(confirmaciones(), 0);
    igual(JSON.stringify(ctx.DifusaEstado.estado.modelo), antes);
    cierto(editor.tieneBorradores());
    igual(doc.getElementById('minVariableDifusa').getAttribute('aria-invalid'), 'true');
    cierto(doc.getElementById('minVariableDifusa-error').textContent.length > 0);
    cierto(avisos.some(texto => texto.includes('entradas.0.min')));
    cierto(doc.activeElement === doc.getElementById('minVariableDifusa'));
  });
  await pruebaAsync('Parámetros desordenados también bloquean generación sin perder los datos aplicados', async () => {
    const { ctx, editor, doc, avisos } = contextoEditor();
    const antes = JSON.stringify(ctx.DifusaEstado.estado.modelo);
    const parametro = doc.getElementById('param-baja-2'); parametro.value = '9'; parametro.emitir('input');
    igual(await editor.generarCombinaciones(), false);
    igual(JSON.stringify(ctx.DifusaEstado.estado.modelo), antes);
    cierto(avisos.some(texto => texto.includes('orden no decreciente')));
  });
  await pruebaAsync('Generación válida deja consecuentes pendientes y conserva el sistema aplicado hasta aplicar', async () => {
    const { ctx, editor, doc } = contextoEditor();
    const antes = JSON.stringify(ctx.DifusaEstado.estado.modelo);
    igual(await editor.generarCombinaciones(), true);
    igual(JSON.stringify(ctx.DifusaEstado.estado.modelo), antes);
    cierto(editor.tieneBorradores());
    const reglas = doc.getElementById('editorReglasDifusa').children.filter(n => n.tag === 'article');
    igual(reglas.length, 9);
    const seleccionados = [];
    function recorrer(n) { if (n.id && n.id.startsWith('cons-')) seleccionados.push(n.value); n.children.forEach(recorrer); }
    reglas.forEach(recorrer); igual(seleccionados, Array(9).fill(''));
  });
  await pruebaAsync('Excepción inesperada de generación se explica y no deja una promesa rechazada ni un borrador parcial', async () => {
    const { ctx, editor, avisos } = contextoEditor();
    const antes = JSON.stringify(ctx.DifusaEstado.estado.modelo);
    ctx.DifusaModelo = { ...ctx.DifusaModelo, generarCombinaciones() { throw new Error('fallo controlado'); } };
    igual(await editor.generarCombinaciones(), false);
    igual(JSON.stringify(ctx.DifusaEstado.estado.modelo), antes);
    igual(editor.tieneBorradores(), false);
    cierto(avisos.some(texto => texto.includes('fallo controlado') && texto.includes('se conserva')));
  });
  await pruebaAsync('Cambiar el borrador durante la confirmación no aplica combinaciones de una revisión anterior', async () => {
    const { ctx, editor, doc, avisos } = contextoEditor();
    const antes = JSON.stringify(ctx.DifusaEstado.estado.modelo);
    let responder; ctx.dialogoConfirmar = () => new Promise(resolve => { responder = resolve; });
    const pendiente = editor.generarCombinaciones();
    const nombre = doc.getElementById('nombreVariableDifusa'); nombre.value = 'Nuevo nombre'; nombre.emitir('input');
    responder(true);
    igual(await pendiente, false);
    igual(JSON.stringify(ctx.DifusaEstado.estado.modelo), antes);
    cierto(avisos.some(texto => texto.includes('cambió durante el diálogo')));
  });
  process.exitCode = informe('Lógica difusa: generación transaccional y errores de campos') ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
