/* Proveedor de lectura para Inicio. No carga modelos, evalúa ni migra bibliotecas. */
'use strict';
const CLAVE_RECIENTES_DIFUSA = 'logica-difusa.trabajos.v2';

function metadatosRecientesDifusa(documento) {
  if (!documento || documento.version !== 2 || !Array.isArray(documento.trabajos) || documento.trabajos.length > 50) return [];
  const ids = new Set(), salida = [];
  for (const trabajo of documento.trabajos) {
    if (!trabajo || trabajo.version !== 2 || trabajo.tipo !== 'ciudad-logica-difusa-trabajo' ||
        typeof trabajo.id !== 'string' || !/^trabajo-[a-z0-9-]+$/.test(trabajo.id) || trabajo.id.length > 160 || ids.has(trabajo.id) ||
        typeof trabajo.nombre !== 'string' || !trabajo.nombre.trim() || trabajo.nombre.trim().length > 40 ||
        typeof trabajo.actualizado !== 'string' || trabajo.actualizado.length > 64 || !Number.isFinite(Date.parse(trabajo.actualizado))) return [];
    ids.add(trabajo.id);
    salida.push({ id: trabajo.id, nombre: trabajo.nombre.trim(), modulo: 'difusa', fecha: new Date(trabajo.actualizado).toISOString(),
      resumen: 'Biblioteca propia · abrir trabajos' });
  }
  return salida;
}

function leerRecientesDifusa() {
  try {
    const texto = localStorage.getItem(CLAVE_RECIENTES_DIFUSA);
    // La biblioteca completa pertenece a su módulo. Inicio solo admite una lectura
    // acotada y devuelve metadatos; nunca interpreta resultados como válidos.
    if (!texto || texto.length > 4 * 1024 * 1024) return [];
    return metadatosRecientesDifusa(JSON.parse(texto));
  } catch (_) { return []; }
}
