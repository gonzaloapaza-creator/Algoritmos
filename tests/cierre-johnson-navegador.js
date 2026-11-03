/* Fronteras reales de Johnson y recuperación. Perfil temporal, sin datos del usuario. */
'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require(path.join(os.tmpdir(), 'grafo-e2e/node_modules/puppeteer-core'));
const BASE = process.env.URL_PRUEBAS || 'http://127.0.0.1:8123/';
let total = 0;
function check(valor, texto) { assert.ok(valor, texto); total++; console.log('✓ ' + texto); }

async function importarArchivoJohnson(page, archivo) {
  if (!(await page.$eval('#btnMasOpciones', boton => boton.getAttribute('aria-expanded') === 'true'))) {
    await page.click('#btnMasOpciones');
  }
  const [selector] = await Promise.all([page.waitForFileChooser(), page.click('#btnImportarJSON')]);
  await selector.accept([archivo]);
}

function referenciaFloydJohnson(grafo) {
  const indices = new Map(grafo.nodos.map((nodo, i) => [nodo.id, i]));
  const distancias = grafo.nodos.map((_, i) => grafo.nodos.map((__, j) => i === j ? 0 : Infinity));
  for (const arista of grafo.conexiones) distancias[indices.get(arista.desde)][indices.get(arista.hacia)] = arista.valor;
  for (let k = 0; k < distancias.length; k++) for (let i = 0; i < distancias.length; i++) for (let j = 0; j < distancias.length; j++) {
    distancias[i][j] = Math.min(distancias[i][j], distancias[i][k] + distancias[k][j]);
  }
  return distancias;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const contexto = await browser.createBrowserContext();
  const page = await contexto.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.setViewport({ width: 390, height: 844 });
  const descargas = fs.mkdtempSync(path.join(os.tmpdir(), 'johnson-cierre-'));
  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: descargas });
  try {
    await page.goto(BASE + 'johnson.html?intro=no', { waitUntil: 'networkidle0' });
    await page.evaluate(() => { aplicarEjemploJohnson(ejemploJohnsonPorId('negativos')); calcularYMostrarJohnson('resultado'); });
    check(await page.evaluate(() => JSON.stringify(estadoJohnson.resultado.distancias[0]) === '[0,1,-3,2,-4]'), 'Distancias clásicas correctas en interfaz');
    check(await page.evaluate(() => {
      const antes = JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
      const c = estado.conexiones[0];
      const resultados = [guardarConexionJohnson(c.desde, c.desde, 1), guardarConexionJohnson(c.desde, c.hacia, 1), guardarConexionJohnson(c.hacia, c.desde, 1)];
      return resultados.every(r => !r.ok) && antes === JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
    }), 'Modelo rechaza bucle, duplicada e inversa sin modificar grafo, historial ni resultado');
    check(await page.evaluate(() => {
      cambiarVistaJohnson('grafo'); elegirHerramienta('conectar');
      const c = estado.conexiones[0];
      const antes = JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson.resultado]);
      for (const [a, b] of [[c.desde, c.desde], [c.desde, c.hacia], [c.hacia, c.desde]]) {
        estado.origenConexion = a; manejarConectar(buscarNodo(b));
        if (modalAbierto()) return false;
      }
      estado.origenConexion = null;
      return antes === JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson.resultado]);
    }), 'Herramienta Conectar señala las tres selecciones inválidas sin abrir edición');
    check(await page.evaluate(() => {
      const c = estado.conexiones[0];
      const r = guardarConexionJohnson(c.desde, c.hacia, c.valor, c.id);
      return r.ok && validarGrafoImportado(instantaneaGrafo()).ok;
    }), 'Editar excluye la propia arista');
    check(await page.evaluate(() => {
      const original = estadoJohnson.resultado;
      estado.nodos[0].x += 17; dibujar();
      return resultadoVigenteJohnson() && estadoJohnson.resultado === original;
    }), 'Mover conserva cálculo');
    await page.evaluate(() => { elegirHerramienta('seleccionar'); estado.seleccion = { tipo: 'nodo', id: estado.nodos[0].id }; editarSeleccion(); });
    await page.waitForSelector('#modalFondo:not([hidden])');
    await page.$eval('#modalInput', e => { e.value = 'Origen largo'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalAceptar');
    await page.waitForFunction(() => estado.nodos[0].nombre === 'Origen largo');
    check(await page.evaluate(() => resultadoVigenteJohnson() && estadoJohnson.resultado.nombres[0] === 'Origen largo' && estadoJohnson.resultado.pasos.some(p => p.titulo.includes('Origen largo'))), 'Renombrar actualiza pasos y etiquetas manteniendo distancias');
    check(await page.evaluate(() => {
      const c = estado.conexiones[0]; guardarConexionJohnson(c.desde, c.hacia, c.valor + 1, c.id);
      return !resultadoVigenteJohnson();
    }), 'Cambiar peso invalida resultado');
    await page.evaluate(() => { deshacer(); calcularYMostrarJohnson('resultado'); });
    check(await page.evaluate(() => {
      const mal = instantaneaGrafo(); mal.conexiones.push({ id: 'mala', desde: mal.nodos[0].id, hacia: mal.nodos[0].id, valor: 1 });
      const antes = JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
      let rechazo = false; try { aplicarGrafo(mal); } catch (_) { rechazo = true; }
      return rechazo && antes === JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
    }), 'Carga del modelo incompatible es atómica');
    check(await page.evaluate(() => {
      const mal = instantaneaGrafo(); mal.conexiones[0].hacia = mal.conexiones[0].desde;
      const t = { id: 'antiguo', nombre: 'Original', modulo: 'johnson', fecha: new Date().toISOString(), datos: { grafo: mal } };
      const antes = JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
      let rechazo = false; try { aplicarTrabajoNombrado(t); } catch (_) { rechazo = true; }
      return rechazo && !fusionarTrabajosImportados([], { version: 1, modulo: 'johnson', trabajos: [t] }, 'johnson').ok && antes === JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
    }), 'Mis trabajos rechaza carga e importación incompatibles sin reemplazar ejercicio');
    check(await page.evaluate(() => {
      const mal = instantaneaGrafo(); mal.conexiones[0].hacia = mal.conexiones[0].desde;
      estado.historial.pasado.push(mal); estado.historial.futuro.push(mal);
      const antes = JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
      deshacer(); rehacer();
      return antes === JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]);
    }), 'Deshacer y rehacer no consumen ni aplican instantáneas incompatibles');
    await page.evaluate(() => { cambiarVistaJohnson('grafo'); estado.seleccion = { tipo: 'nodo', id: estado.nodos[0].id }; editarSeleccion(); estado.nodos[0].x += 1; });
    await page.$eval('#modalInput', e => { e.value = 'Obsoleto'; });
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalAceptar');
    check(await page.evaluate(() => estado.nodos[0].nombre === 'Origen largo'), 'Confirmación obsoleta no cambia otro estado');
    await page.evaluate(() => mostrarBiblioteca());
    const antesAtajo = await page.evaluate(() => JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]));
    await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control');
    check(await page.evaluate(antes => antes === JSON.stringify([instantaneaGrafo(), estado.historial, estadoJohnson]), antesAtajo), 'Atajos no alteran el ejercicio detrás de Biblioteca');
    await page.keyboard.press('Escape');

    // Frontera real: selector de archivo, FileReader y validación antes del reemplazo.
    await page.evaluate(() => { cambiarVistaJohnson('grafo'); elegirHerramienta('seleccionar'); });
    const instantaneaImportacion = () => JSON.stringify({ grafo: instantaneaGrafo(), historial: estado.historial,
      johnson: estadoJohnson, autoguardado: localStorage.getItem(CLAVE_ALMACEN) });
    const grafoActual = await page.evaluate(() => instantaneaGrafo());
    const copiar = datos => JSON.parse(JSON.stringify(datos));
    const archivosImportacion = [];
    const casosInvalidos = [
      ['bucle', documento => { const nodo = documento.grafo.nodos[0].id; documento.grafo.conexiones.push({ id: 'importacion_bucle', desde: nodo, hacia: nodo, valor: 0 }); }, 'consigo mismo'],
      ['inversa', documento => { const c = documento.grafo.conexiones[0]; documento.grafo.conexiones.push({ id: 'importacion_inversa', desde: c.hacia, hacia: c.desde, valor: 1 }); }, 'sentido contrario'],
      ['duplicada', documento => { documento.grafo.conexiones.push({ ...documento.grafo.conexiones[0], id: 'importacion_duplicada' }); }, 'ya existe'],
      ['referencia-rota', documento => { documento.grafo.conexiones[0].hacia = 'nodo-inexistente'; }, 'no existe'],
      ['version-futura', documento => { documento.version = '99.0'; }, 'Versión de archivo no compatible'],
      ['mayor-1MiB', documento => { documento.relleno = 'x'.repeat(1024 * 1024); }, 'límite de 1 MB']
    ];
    for (const [nombre, alterar, mensaje] of casosInvalidos) {
      const documento = { version: '1.0', grafo: copiar(grafoActual) };
      alterar(documento);
      const archivo = path.join(descargas, 'importacion-' + nombre + '.json');
      const original = Buffer.from(JSON.stringify(documento), 'utf8');
      fs.writeFileSync(archivo, original);
      archivosImportacion.push([archivo, original]);
      const antes = await page.evaluate(instantaneaImportacion);
      await page.evaluate(() => document.querySelectorAll('#avisos > *, #toastStack > *').forEach(aviso => aviso.remove()));
      await importarArchivoJohnson(page, archivo);
      await page.waitForFunction(texto => Array.from(document.querySelectorAll('#avisos, #toastStack')).some(pila => pila.textContent.includes(texto)), {}, mensaje);
      check(await page.evaluate(instantaneaImportacion) === antes &&
        await page.evaluate(() => !modalAbierto()) && fs.readFileSync(archivo).equals(original),
      'JSON real ' + nombre + ': rechazo conserva grafo, historial, resultado, autoguardado y archivo original');
    }

    // Ciclo permitido de tres vértices: suma 3; cuarto vértice aislado.
    const documentoValido = { version: '1.0', grafo: {
      nodos: [
        { id: 'import_A', nombre: 'A', x: 120, y: 100 }, { id: 'import_B', nombre: 'B', x: 300, y: 100 },
        { id: 'import_C', nombre: 'C', x: 210, y: 270 }, { id: 'import_D', nombre: 'D', x: 420, y: 270 }
      ], conexiones: [
        { id: 'import_AB', desde: 'import_A', hacia: 'import_B', valor: 0 },
        { id: 'import_BC', desde: 'import_B', hacia: 'import_C', valor: -2 },
        { id: 'import_CA', desde: 'import_C', hacia: 'import_A', valor: 5 }
      ], siguienteId: 1
    } };
    const textoValido = JSON.stringify(documentoValido);
    const originalValido = Buffer.from(textoValido + ' '.repeat(1024 * 1024 - Buffer.byteLength(textoValido)), 'utf8');
    const archivoValido = path.join(descargas, 'importacion-valida-1MiB.json');
    fs.writeFileSync(archivoValido, originalValido);
    archivosImportacion.push([archivoValido, originalValido]);
    const antesImportarValido = await page.evaluate(instantaneaImportacion);
    await importarArchivoJohnson(page, archivoValido);
    await page.waitForSelector('#modalFondo:not([hidden])');
    check(originalValido.length === 1024 * 1024 && await page.evaluate(instantaneaImportacion) === antesImportarValido,
      'JSON válido de exactamente 1 MiB se valida sin reemplazar antes de confirmar');
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalCancelar');
    check(await page.evaluate(instantaneaImportacion) === antesImportarValido,
      'Cancelar importación válida conserva grafo, historial, resultado y autoguardado');
    await importarArchivoJohnson(page, archivoValido);
    await page.waitForSelector('#modalFondo:not([hidden])');
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalAceptar');
    await page.waitForFunction(() => estado.nodos[0].id === 'import_A');
    check(await page.evaluate(() => JSON.stringify(instantaneaGrafo())) === JSON.stringify(documentoValido.grafo) &&
      fs.readFileSync(archivoValido).equals(originalValido), 'Confirmar JSON válido carga todos sus datos y conserva el archivo');
    await page.evaluate(() => calcularYMostrarJohnson('resultado'));
    const referencia = referenciaFloydJohnson(documentoValido.grafo);
    check(await page.evaluate(esperadas => resultadoVigenteJohnson() && !estadoJohnson.resultado.tieneCicloNegativo &&
      JSON.stringify(estadoJohnson.resultado.distancias) === JSON.stringify(esperadas), referencia),
    'Ciclo importado de tres con cero y negativo coincide con Floyd independiente; aislado queda sin camino');

    await page.evaluate(() => { cambiarVistaJohnson('grafo'); elegirHerramienta('conectar'); });
    const antesCancelarConexion = await page.evaluate(instantaneaImportacion);
    await page.evaluate(() => { manejarConectar(buscarNodo('import_A')); manejarConectar(buscarNodo('import_D')); });
    await page.waitForSelector('#modalFondo:not([hidden])');
    await page.$eval('#modalInput', campo => { campo.value = '7'; });
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalCancelar');
    check(await page.evaluate(instantaneaImportacion) === antesCancelarConexion,
      'Cancelar Conectar después de escribir peso conserva grafo, historial, resultado y autoguardado');
    await page.evaluate(() => { elegirHerramienta('seleccionar'); estado.seleccion = { tipo: 'conexion', id: 'import_AB' }; });
    const antesCancelarPeso = await page.evaluate(instantaneaImportacion);
    await page.evaluate(() => editarSeleccion());
    await page.waitForSelector('#modalFondo:not([hidden])');
    await page.$eval('#modalInput', campo => { campo.value = '999'; });
    await page.waitForFunction(() => !clicFantasma());
    await page.click('#modalCancelar');
    check(await page.evaluate(instantaneaImportacion) === antesCancelarPeso &&
      archivosImportacion.every(([archivo, original]) => fs.readFileSync(archivo).equals(original)),
    'Cancelar edición de peso conserva el ejercicio y todos los archivos de entrada permanecen intactos');

    const crudo = await page.evaluate(() => {
      const mal = instantaneaGrafo(); mal.conexiones[0].hacia = mal.conexiones[0].desde;
      const texto = JSON.stringify(mal);
      localStorage.setItem(CLAVE_ALMACEN, texto);
      localStorage.setItem(CLAVE_BIBLIOTECA, JSON.stringify([{ ...mal, id: 'viejo', nombre: 'Biblioteca anterior' }]));
      return texto;
    });
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.evaluate(original => localStorage.getItem(CLAVE_ALMACEN) === original && estado.nodos.length === 0 && !permiteEscrituraGuardado(CLAVE_ALMACEN), crudo), 'Restauración incompatible conserva original y bloquea autoguardado');
    await page.evaluate(() => crearNodo(150, 150));
    check(await page.evaluate(original => localStorage.getItem(CLAVE_ALMACEN) === original, crudo), 'Crear otro ejercicio no sobrescribe original protegido');
    check(await page.evaluate(() => {
      const antes = JSON.stringify([instantaneaGrafo(), estado.historial]);
      const lista = leerBiblioteca(); aplicarGuardado(lista[0]);
      return lista.length === 1 && lista[0].conexiones[0].desde === lista[0].conexiones[0].hacia && antes === JSON.stringify([instantaneaGrafo(), estado.historial]);
    }), 'Biblioteca conserva aristas antiguas y rechaza carga sin alterar ejercicio');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.click('.aviso-almacenamiento button');
    await page.waitForFunction(() => !document.querySelectorAll('.aviso-almacenamiento button')[1].disabled);
    for (let i = 0; i < 30 && !fs.readdirSync(descargas).some(n => n.endsWith('-original.json')); i++) await new Promise(r => setTimeout(r, 100));
    const archivo = fs.readdirSync(descargas).find(n => n.endsWith('-original.json'));
    check(archivo && fs.readFileSync(path.join(descargas, archivo), 'utf8') === crudo, 'Descarga real conserva exactamente el original incompatible');
    await page.click('.aviso-almacenamiento button:nth-of-type(2)');
    await page.evaluate(() => guardar());
    check(await page.evaluate(original => permiteEscrituraGuardado(CLAVE_ALMACEN) && localStorage.getItem(CLAVE_ALMACEN) !== original && JSON.parse(localStorage.getItem(CLAVE_ALMACEN)).nodos.length === 1, crudo), 'Elección explícita habilita escritura exitosa del nuevo ejercicio');
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.evaluate(() => estado.nodos.length === 1 && permiteEscrituraGuardado(CLAVE_ALMACEN)), 'La nueva escritura se recupera al recargar');
    check(await page.evaluate(() => {
      estado.siguienteId = Number.MAX_SAFE_INTEGER - 1;
      crearNodo(250, 250); crearNodo(300, 300);
      return validarGrafoImportado(instantaneaGrafo()).ok && new Set(estado.nodos.map(n => n.id)).size === estado.nodos.length && estado.siguienteId < 100;
    }), 'Contador extremo se reanuda sin colisiones ni pérdida de guardado');
    await page.evaluate(() => { aplicarEjemploJohnson(ejemploJohnsonPorId('ciclo')); calcularYMostrarJohnson('resultado'); });
    check(await page.evaluate(() => estadoJohnson.resultado.tieneCicloNegativo && estadoJohnson.resultado.cicloPeso === -1 && /ciclo de peso negativo/i.test(document.querySelector('#vistaResultadoJn').textContent)), 'Ciclo negativo de tres se detecta y explica en resultado');
    check(errores.length === 0, 'Sin errores JavaScript: ' + errores.join('; '));
    console.log('\nCierre Johnson: ' + total + ' comprobaciones correctas. Descargas: ' + descargas);
  } finally { await contexto.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
