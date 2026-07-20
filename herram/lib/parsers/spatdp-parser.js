// -*- coding: utf-8 -*-
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

function childNodesArr(el) {
  const cn = el.childNodes;
  const arr = [];
  for (let i = 0; i < cn.length; i++) arr.push(cn[i]);
  return arr;
}

/**
 * Extrae Strongs de un subárbol (t o rb), ignorando rf.
 * @param {Element} el - elemento raíz del subárbol
 * @param {string} strongType - 'G' o 'H'
 * @param {Set} strongs - Set donde acumular
 */
/**
 * Extrae Strongs de todos los <wi> en el subárbol, ignorando <rf>
 */
function extractAllStrongs(el, strongType, strongs) {
  if (!el || el.nodeType !== 1) return;
  if (el.tagName === 'rf' || el.tagName === 'sv') return;

  if (el.tagName === 'wi') {
    const type = el.getAttribute('type') || '';
    if (type === 'HN' || type === 'HC') return;
    const value = el.getAttribute('value') || '';
    const m = value.match(/^[A-Z]*(\d+),(\d+),?/);
    if (m) {
      strongs.add(`${strongType}${m[1]}-${m[2]}`);
    }
  }

  for (const c of childNodesArr(el)) {
    extractAllStrongs(c, strongType, strongs);
  }
}

/**
 * Recorre recursivamente buscando t/rb xml:lang="es" con contenido
 */
function checkTranslation(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.tagName === 'rf') return false;

  if ((el.tagName === 't' || el.tagName === 'rb') &&
      el.getAttribute('xml:lang') === 'es') {
    return el.textContent && el.textContent.trim();
  }

  for (const c of childNodesArr(el)) {
    if (checkTranslation(c)) return true;
  }
  return false;
}

/**
 * Recorre recursivamente buscando t/rb xml:lang="es" para extraer Strongs
 */
function walkForTranslation(el, strongType, strongs) {
  if (!el || el.nodeType !== 1) return;
  if (el.tagName === 'rf') return;

  if ((el.tagName === 't' || el.tagName === 'rb') &&
      el.getAttribute('xml:lang') === 'es') {
    extractStrongs(el, strongType, strongs);
    return;
  }

  for (const c of childNodesArr(el)) {
    walkForTranslation(c, strongType, strongs);
  }
}

/**
 * Parsea un archivo GBF de SpaTDP usando DOMParser (árbol).
 * @param {string} filepath - Ruta al archivo .gbfxml
 * @param {string} strongType - Tipo de Strong: 'G' (NT) o 'H' (AT, por defecto 'G')
 * @returns {Map} Map<capítulo, { strongsData: Map<versículo, Set>, untranslatedVerses: Set }>
 */
export function parseSpaTdp(filepath, strongType = 'G') {
  const bookData = new Map();

  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const doc = new DOMParser().parseFromString(content, 'application/xml');
    const svElements = doc.getElementsByTagName('sv');

    for (let i = 0; i < svElements.length; i++) {
      const sv = svElements[i];
      const svId = sv.getAttribute('id') || '';
      const idMatch = svId.match(/[^-]+-(\d+)-(\d+)/);
      if (!idMatch) continue;

      const chapterNum = parseInt(idMatch[1], 10);
      const verseNum = parseInt(idMatch[2], 10);

      if (!bookData.has(chapterNum)) {
        bookData.set(chapterNum, {
          strongsData: new Map(),
          untranslatedVerses: new Set()
        });
      }
      const chapterContent = bookData.get(chapterNum);

      // Detectar versículos sin traducción (buscar recursivamente t/rb xml:lang="es")
      const hasTranslation = checkTranslation(sv);
      if (!hasTranslation) {
        chapterContent.untranslatedVerses.add(verseNum);
      }

      // Extraer Strongs de todos los <wi> en el sv, ignorando <rf>
      const strongs = new Set();
      for (const c of childNodesArr(sv)) {
        extractAllStrongs(c, strongType, strongs);
      }

      chapterContent.strongsData.set(verseNum, strongs);
    }

    return bookData;
  } catch (e) {
    console.error(`Error parsing ${filepath}:`, e);
    return new Map();
  }
}

/**
 * Obtiene los Strongs de un versículo específico
 */
export function getStrongsForVerse(bookData, chapter, verse) {
  const chapterData = bookData.get(chapter);
  if (!chapterData) return new Set();
  return chapterData.strongsData.get(verse) || new Set();
}

/**
 * Obtiene los versículos no traducidos
 */
export function getUntranslatedVerses(bookData, chapter) {
  const chapterData = bookData.get(chapter);
  if (!chapterData) return new Set();
  return chapterData.untranslatedVerses;
}
