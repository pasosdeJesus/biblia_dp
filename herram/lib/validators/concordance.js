// -*- coding: utf-8 -*-
import { getException, isException } from '../exceptions.js';
import { getStrongsForVerse as getSpaTdpStrongs, getUntranslatedVerses } from '../parsers/spatdp-parser.js';

/**
 * Compara la concordancia de Strongs entre SpaTDP y KJV2003 para un capítulo
 * @param {Map} spatdpBookData - Datos del libro SpaTDP
 * @param {Map} kjv2003Data - Datos del capítulo KJV2003
 * @param {string} bookName - Nombre del libro para excepciones
 * @param {number} chapter - Número de capítulo
 * @returns {Object} Resultados del análisis
 */
export function analyzeChapterConcordance(spatdpBookData, kjv2003Data, bookName, chapter) {
  const spatdpChapter = spatdpBookData.get(chapter) || { strongsData: new Map(), untranslatedVerses: new Set() };
  const untranslatedVerses = getUntranslatedVerses(spatdpBookData, chapter);
  
  const allVerseKeys = new Set([...spatdpChapter.strongsData.keys(), ...kjv2003Data.keys()]);
  const sortedVerseKeys = Array.from(allVerseKeys).sort((a, b) => a - b);
  
  const results = {
    mismatches: [],
    exceptions: [],
    untranslated: Array.from(untranslatedVerses).sort((a, b) => a - b)
  };
  
  for (const verse of sortedVerseKeys) {
    if (untranslatedVerses.has(verse)) continue;

    const spatdpSet = spatdpChapter.strongsData.get(verse) || new Set();
    const kjvSet = kjv2003Data.get(verse) || new Set();

    const missingInSpatdp = new Set([...kjvSet].filter(item => !spatdpSet.has(item)));
    const missingInKjv2003 = new Set([...spatdpSet].filter(item => !kjvSet.has(item)));

    if (missingInSpatdp.size === 0 && missingInKjv2003.size === 0) continue;

    const exception = getException(bookName, chapter, verse);

    // Usar isException para determinar si es una excepción documentada
    if (exception && isException(bookName, chapter, verse, missingInSpatdp, missingInKjv2003)) {
      results.exceptions.push({
        verse,
        reason: exception.reason,
        missingInSpatdp: Array.from(missingInSpatdp),
        missingInKjv2003: Array.from(missingInKjv2003)
      });
    } else {
      results.mismatches.push({
        verse,
        missingInSpatdp: Array.from(missingInSpatdp),
        missingInKjv2003: Array.from(missingInKjv2003)
      });
    }
  }
  
  return results;
}

/**
 * Compara la concordancia para un libro completo
 * @param {Map} spatdpBookData - Datos del libro SpaTDP
 * @param {string} bookName - Nombre del libro
 * @param {Function} getKjvChapter - Función que obtiene datos KJV para un capítulo
 * @returns {Object} Resultados agregados
 */
export function analyzeBookConcordance(spatdpBookData, bookName, getKjvChapter) {
  const chapters = Array.from(spatdpBookData.keys()).sort((a, b) => a - b);
  const results = {
    totalMismatches: 0,
    totalUntranslated: 0,
    totalExceptions: 0,
    chapters: {}
  };
  
  for (const chapter of chapters) {
    const kjvData = getKjvChapter(chapter);
    if (!kjvData) continue;
    
    const chapterResults = analyzeChapterConcordance(spatdpBookData, kjvData, bookName, chapter);
    
    results.chapters[chapter] = chapterResults;
    results.totalMismatches += chapterResults.mismatches.length;
    results.totalUntranslated += chapterResults.untranslated.length;
    results.totalExceptions += chapterResults.exceptions.length;
  }
  
  return results;
}

/**
 * Ordena strongs por posición (útil para mostrar)
 */
export function sortStrongs(strongsArray) {
  return [...strongsArray].sort((a, b) => {
    const [, posA] = a.split('-').map(Number);
    const [, posB] = b.split('-').map(Number);
    return posA - posB;
  });
}
