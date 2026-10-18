/* Verificación estática sin dependencias (npm run lint).
 *
 * - Sintaxis de todos los .js (raíz, js/**, tests/*) con vm.Script.
 * - En cada .html: scripts y hojas locales existentes, ids únicos, orden de carga
 *   (config.js y utilidades.js antes que el resto) y los elementos comunes que
 *   toda página debe tener (meta description, enlace «Saltar al contenido»,
 *   barra lateral, cabecera con #topbarModulo).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { prueba, cierto, igual, informe } = require('./cargar');

const RAIZ = path.join(__dirname, '..');
const IGNORAR = new Set(['node_modules', '.git', 'docs']);

function listar(dir, extension, acumulado) {
  acumulado = acumulado || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entrada => {
    if (IGNORAR.has(entrada.name)) return;
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listar(ruta, extension, acumulado);
    else if (entrada.name.endsWith(extension)) acumulado.push(ruta);
  });
  return acumulado;
}

function relativa(ruta) {
  return path.relative(RAIZ, ruta).split(path.sep).join('/');
}

/* ---------------- JavaScript ---------------- */

const scripts = listar(RAIZ, '.js');
prueba('Todos los .js tienen sintaxis válida (' + scripts.length + ' archivos)', () => {
  const errores = [];
  scripts.forEach(ruta => {
    try {
      new vm.Script(fs.readFileSync(ruta, 'utf8'), { filename: relativa(ruta) });
    } catch (e) {
      errores.push(relativa(ruta) + ': ' + e.message);
    }
  });
  igual(errores, [], 'Errores de sintaxis');
});

prueba('Ningún script usa console.log (solo warn/error para fallos de almacenamiento)', () => {
  const culpables = scripts
    .filter(ruta => !relativa(ruta).startsWith('tests/'))
    .filter(ruta => /console\.log\(/.test(fs.readFileSync(ruta, 'utf8')))
    .map(relativa);
  igual(culpables, []);
});

/* ---------------- HTML ---------------- */

const paginas = listar(RAIZ, '.html');

function atributos(etiqueta) {
  const resultado = {};
  const re = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(etiqueta))) resultado[m[1]] = m[2];
  return resultado;
}

function referenciasLocales(html, nombreEtiqueta, atributo) {
  const re = new RegExp('<' + nombreEtiqueta + '\\b[^>]*>', 'g');
  const refs = [];
  let m;
  while ((m = re.exec(html))) {
    const valor = atributos(m[0])[atributo];
    if (valor && !/^(https?:|data:|#|mailto:)/.test(valor)) refs.push(valor);
  }
  return refs;
}

paginas.forEach(ruta => {
  const nombre = relativa(ruta);
  const html = fs.readFileSync(ruta, 'utf8');

  prueba(nombre + ': scripts y hojas de estilo locales existen', () => {
    const faltan = referenciasLocales(html, 'script', 'src')
      .concat(referenciasLocales(html, 'link', 'href'))
      .filter(ref => !fs.existsSync(path.join(path.dirname(ruta), ref)));
    igual(faltan, []);
  });

  prueba(nombre + ': sin ids duplicados', () => {
    const vistos = new Map();
    const re = /\sid="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) vistos.set(m[1], (vistos.get(m[1]) || 0) + 1);
    igual([...vistos].filter(([, n]) => n > 1).map(([id]) => id), []);
  });

  prueba(nombre + ': config.js y utilidades.js se cargan antes que el resto', () => {
    const orden = referenciasLocales(html, 'script', 'src');
    cierto(orden.length > 0, 'La página no carga scripts');
    igual(orden.slice(0, 2), ['js/config.js', 'js/comun/utilidades.js']);
  });

  prueba(nombre + ': estructura común (description, saltar, cabecera, barra lateral)', () => {
    const faltan = [];
    if (!/<meta name="description"/.test(html)) faltan.push('meta description');
    if (!/<meta name="theme-color"/.test(html)) faltan.push('meta theme-color');
    if (!/class="saltar"/.test(html)) faltan.push('enlace .saltar');
    if (!/id="topbarModulo"/.test(html)) faltan.push('#topbarModulo');
    if (!/id="barraLateral"/.test(html)) faltan.push('#barraLateral');
    if (!/id="btnMenuLateral"[^>]*aria-controls="barraLateral"/.test(html)) faltan.push('aria-controls en #btnMenuLateral');
    if (!/<body[^>]*data-modulo="/.test(html)) faltan.push('data-modulo en <body>');
    if (/\sstyle="/.test(html)) faltan.push('sin estilos inline');
    igual(faltan, []);
  });
});

/* ---------------- CSS ---------------- */

const hojas = listar(RAIZ, '.css');
prueba('Las hojas de estilo cierran todas sus llaves', () => {
  const malas = hojas.filter(ruta => {
    const css = fs.readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    return (css.match(/\{/g) || []).length !== (css.match(/\}/g) || []).length;
  }).map(relativa);
  igual(malas, []);
});

process.exit(informe('Verificación estática') ? 0 : 1);
