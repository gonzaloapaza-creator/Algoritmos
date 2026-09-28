/* Validaciones y formato numérico del módulo de transporte (esquina noroeste).
 *
 * Los costos se guardan como enteros escalados × ESCALA_COSTO_NORTHWEST (100), así
 * 2,75 se almacena como 275 y las sumas y productos no arrastran errores de coma flotante.
 * Sin DOM: se prueba en Node.
 */

'use strict';

/**
 * Costo unitario: 0 a MAX_COSTO_NORTHWEST con hasta 2 decimales, coma o punto.
 * Se valida el texto completo: «12abc», «1.234,5» o «1e3» se rechazan.
 * - vacío → { ok: true, valor: null } (pendiente)
 * - válido → { ok: true, valor: entero escalado × 100 }
 */
function validarCostoNorthwest(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: true, valor: null };
  if (/^-/.test(limpio)) return { ok: false, error: 'El costo no puede ser negativo.' };
  const partes = /^\+?(\d+)(?:[.,](\d{0,2}))?$/.exec(limpio);
  if (!partes) {
    if (/^\+?\d+[.,]\d{3,}$/.test(limpio)) return { ok: false, error: 'Como máximo 2 decimales en el costo.' };
    return { ok: false, error: 'Escribe un costo válido: número con hasta 2 decimales (coma o punto), o deja la casilla vacía.' };
  }
  const entera = Number(partes[1]);
  const decimales = (partes[2] || '').padEnd(2, '0');
  if (!Number.isSafeInteger(entera) || entera > MAX_COSTO_NORTHWEST) {
    return { ok: false, error: 'El costo debe estar entre 0 y ' + MAX_COSTO_NORTHWEST + '.' };
  }
  const escalado = entera * ESCALA_COSTO_NORTHWEST + Number(decimales);
  if (escalado > MAX_COSTO_NORTHWEST * ESCALA_COSTO_NORTHWEST) {
    return { ok: false, error: 'El costo debe estar entre 0 y ' + MAX_COSTO_NORTHWEST + '.' };
  }
  return { ok: true, valor: escalado };
}

/**
 * Oferta o demanda: entero entre 0 y MAX_CANTIDAD_NORTHWEST. Esta versión trabaja con
 * cantidades enteras (decisión de la aplicación, no una restricción del método).
 * - vacío → { ok: true, valor: null } (pendiente)
 */
function validarCantidadNorthwest(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: true, valor: null };
  if (/^-/.test(limpio)) return { ok: false, error: 'La cantidad no puede ser negativa.' };
  if (/^\+?\d+[.,]\d+$/.test(limpio)) return { ok: false, error: 'Esta versión usa cantidades enteras: no se admiten fracciones.' };
  if (!/^\+?\d+$/.test(limpio)) return { ok: false, error: 'Escribe un número entero (0 o mayor) o deja la casilla vacía.' };
  const numero = Number(limpio);
  if (!Number.isSafeInteger(numero) || numero > MAX_CANTIDAD_NORTHWEST) {
    return { ok: false, error: 'La cantidad debe estar entre 0 y ' + MAX_CANTIDAD_NORTHWEST + '.' };
  }
  return { ok: true, valor: numero };
}

/** Etiqueta de origen o destino: 1 a 40 caracteres tras quitar espacios exteriores. */
function validarEtiquetaNorthwest(texto, existentes, idActual) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: false, error: 'El nombre no puede estar vacío.' };
  if (limpio.length > MAX_LARGO_ETIQUETA_NORTHWEST) {
    return { ok: false, error: 'El nombre es demasiado largo (máximo ' + MAX_LARGO_ETIQUETA_NORTHWEST + ' caracteres).' };
  }
  const repetido = (existentes || []).some(e => e.id !== idActual && e.nombre.toLowerCase() === limpio.toLowerCase());
  if (repetido) return { ok: false, error: 'Ya existe un elemento con ese nombre en este grupo.' };
  return { ok: true, valor: limpio };
}

/** 275 → "2.75", 200 → "2", 250 → "2.5". Siempre con punto decimal, sin separador de miles. */
function formatearCostoNorthwest(escalado) {
  if (!Number.isInteger(escalado)) return '—';
  const entera = Math.floor(escalado / ESCALA_COSTO_NORTHWEST);
  const dec = escalado % ESCALA_COSTO_NORTHWEST;
  if (dec === 0) return String(entera);
  const texto = String(dec).padStart(2, '0').replace(/0$/, '');
  return entera + '.' + texto;
}

/** Igual que formatearCostoNorthwest pero para un total (puede ser grande). */
function formatearTotalNorthwest(escalado) {
  return formatearCostoNorthwest(escalado);
}
