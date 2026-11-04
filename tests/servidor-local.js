/* Servidor de la aplicación local, sin dependencias. npm start */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const PAGINAS = new Set(['index.html', 'johnson.html', 'dijkstra.html', 'kruskal.html', 'asignacion.html', 'northwest.html', 'ordenamiento.html', 'arboles.html']);
const IMAGENES = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico']);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon'
};

function rutaPublica(url) {
  let ruta;
  try {
    if (!url.startsWith('/') || url.startsWith('//')) return null;
    ruta = decodeURIComponent(url.split('?')[0]);
  } catch (_) { return null; }
  if (/[\\\x00-\x1f%#]/.test(ruta) || ruta.split('/').some(p => p.startsWith('.') || p.includes(':'))) return null;
  if (ruta === '/') ruta = '/index.html';
  const relativa = ruta.slice(1);
  const extension = path.posix.extname(relativa);
  const permitida = PAGINAS.has(relativa) || relativa === 'styles.css' || relativa === 'app.js' ||
    (relativa.startsWith('css/') && extension === '.css') ||
    (relativa.startsWith('js/') && extension === '.js') ||
    (relativa.startsWith('assets/') && IMAGENES.has(extension)) ||
    (relativa.startsWith('docs/capturas/') && IMAGENES.has(extension));
  return permitida ? relativa : null;
}

function normalizarOrigen(valor) {
  if (typeof valor !== 'string' || !/^https?:\/\/[^/]+\/?$/i.test(valor) || /[\s\\*?#@]/.test(valor)) return null;
  try { return new URL(valor).origin; } catch (_) { return null; }
}

function origenPermitido(req) {
  const host = req.headers.host;
  if (typeof host !== 'string' || /[\s/@\\]/.test(host)) return false;
  let url;
  try { url = new URL('http://' + host); } catch (_) { return false; }
  const puerto = Number(url.port || 80);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || puerto !== req.socket.localPort || url.pathname !== '/') return false;
  if (req.headers.origin !== undefined && normalizarOrigen(req.headers.origin) !== url.origin) return false;
  if (req.headers['sec-fetch-site'] !== undefined && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) return false;
  return true;
}

function crearServidor(opciones = {}) {
  // La variante nativa evita mezclar nombres 8.3 y nombres largos en Windows.
  const raiz = fs.realpathSync.native(opciones.raiz || RAIZ);
  return http.createServer(async (req, res) => {
    if (!origenPermitido(req)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Acceso permitido únicamente desde la aplicación local.');
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const relativa = rutaPublica(req.url);
    if (!relativa) { res.writeHead(403); res.end(); return; }
    const archivo = path.resolve(raiz, relativa);
    try {
      const real = await fs.promises.realpath(archivo);
      const relativaReal = path.relative(raiz, real).split(path.sep).join('/');
      if (!real.startsWith(raiz + path.sep) || !rutaPublica('/' + relativaReal) || path.extname(real) !== path.extname(archivo)) {
        res.writeHead(403); res.end(); return;
      }
      const datos = await fs.promises.stat(real);
      if (!datos.isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, {
        'Content-Type': TIPOS[path.extname(real)] || 'application/octet-stream',
        'Content-Length': datos.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
      });
      if (req.method === 'HEAD') res.end();
      else {
        const lectura = fs.createReadStream(real);
        lectura.once('error', () => res.destroy());
        lectura.pipe(res);
      }
    } catch (_) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
}

if (require.main === module) {
  crearServidor().listen(8123, '127.0.0.1', () => console.log('Aplicación local: http://127.0.0.1:8123/'));
}

module.exports = { crearServidor, rutaPublica, origenPermitido };
