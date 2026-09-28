/* Validaciones del módulo de asignación. Sin DOM: se prueban en Node. */

'use strict';

/**
 * Valida el texto de una celda o de una conexión.
 * - vacío → { ok: true, valor: null }  (dato pendiente, NO cero)
 * - entero entre -MAX_VALOR_ASIGNACION y MAX_VALOR_ASIGNACION → { ok: true, valor }
 * - cualquier otra cosa (texto, decimales, notación científica, NaN, Infinity) → { ok: false, error }
 * Nunca trunca ni convierte: "12abc" o "3.5" se rechazan, no se aproximan.
 */
function validarValorAsignacion(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: true, valor: null };
  if (!/^[+-]?\d+$/.test(limpio)) {
    if (/^[+-]?\d+[.,]\d*$/.test(limpio) || /^[+-]?[.,]\d+$/.test(limpio)) {
      return { ok: false, error: 'Solo se admiten números enteros: no se aceptan decimales.' };
    }
    return { ok: false, error: 'Escribe un número entero (puede ser negativo o cero) o deja la casilla vacía.' };
  }
  const numero = Number(limpio);
  if (!Number.isSafeInteger(numero) || Math.abs(numero) > MAX_VALOR_ASIGNACION) {
    return { ok: false, error: 'El valor debe estar entre -' + MAX_VALOR_ASIGNACION + ' y ' + MAX_VALOR_ASIGNACION + '.' };
  }
  return { ok: true, valor: numero };
}

/**
 * Valida el nombre de un recurso o una tarea. No se repiten dentro del mismo grupo
 * (sin distinguir mayúsculas), porque el grafo y la lista de parejas los muestran por nombre.
 */
function validarNombreAsignacion(texto, existentes, idActual) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return { ok: false, error: 'El nombre no puede estar vacío.' };
  if (limpio.length > MAX_LARGO_ETIQUETA_ASIGNACION) {
    return { ok: false, error: 'El nombre es demasiado largo (máximo ' + MAX_LARGO_ETIQUETA_ASIGNACION + ' caracteres).' };
  }
  const repetido = (existentes || []).some(e => e.id !== idActual && e.nombre.toLowerCase() === limpio.toLowerCase());
  if (repetido) return { ok: false, error: 'Ya existe un elemento con ese nombre en este grupo.' };
  return { ok: true, valor: limpio };
}
