/* Solo servidor estático: no carga .env, no resuelve algoritmos ni usa red externa. */
'use strict';
const assert = require('node:assert/strict');
const { crearServidor, rutaPublica } = require('./servidor-local');
(async () => {
  const servidor = crearServidor();
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + servidor.address().port;
  try {
    for (const ruta of ['/', '/johnson.html', '/js/comun/asistente.js', '/js/comun/asistente-contexto.js', '/css/asistente.css']) {
      const r = await fetch(base + ruta);
      assert.equal(r.status, 200, ruta);
      await r.arrayBuffer();
    }
    for (const ruta of ['/.env', '/.git/config', '/servidor/api.js', '/api/estado', '/api/asistente']) assert.equal(rutaPublica(ruta), null, ruta);
    const ajeno = await fetch(base + '/', { headers: { Origin: 'https://example.invalid' } });
    assert.equal(ajeno.status, 403);
    await ajeno.arrayBuffer();
    const post = await fetch(base + '/', { method: 'POST' });
    assert.equal(post.status, 405);
    await post.arrayBuffer();
    console.log('Servidor estático: recursos públicos correctos, rutas privadas/API retiradas y origen conservado.');
  } finally { await new Promise(resolve => servidor.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
