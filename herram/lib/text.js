// -*- coding: utf-8 -*-
// Utilidades de texto compartidas entre herramientas.

/**
 * Normaliza texto: entidades XML, espacios y puntuación.
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim()
    .replace(/\s+([,.;:!?»])/g, '$1')
    .replace(/([«])\s+/g, '$1')
}
