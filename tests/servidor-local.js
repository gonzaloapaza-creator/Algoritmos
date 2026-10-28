/* Servidor estático local para las pruebas de navegador, sin dependencias.
 * Uso: node tests/servidor-local.js
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  let ruta;
  try { ruta = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch (_) { res.writeHead(400); res.end(); return; }
  if (ruta.includes('\\') || ruta.split('/').some(parte => parte.startsWith('.'))) {
    res.writeHead(403); res.end(); return;
  }
  const archivo = path.resolve(raiz, '.' + (ruta.endsWith('/') ? ruta + 'index.html' : ruta));
  if (!archivo.startsWith(raiz + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.stat(archivo, (error, datos) => {
    if (error || !datos.isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {
      'Content-Type': tipos[path.extname(archivo)] || 'application/octet-stream',
      'Content-Length': datos.size, 'Cache-Control': 'no-store'
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(archivo).pipe(res);
  });
}).listen(8123, '127.0.0.1', () => console.log('Pruebas: http://127.0.0.1:8123/'));
