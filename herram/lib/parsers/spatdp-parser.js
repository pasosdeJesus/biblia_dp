// -*- coding: utf-8 -*-
import fs from 'fs';

/**
 * Parsea un archivo GBF de SpaTDP
 * @param {string} filepath - Ruta al archivo .gbfxml
 * @returns {Map} Map<capítulo, Map<versículo, Set<strong-position>>>
 */
export function parseSpaTdp(filepath) {
  const bookData = new Map();
  
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const svBlocks = content.match(/<sv id="[^"]+"[^>]*>([\s\S]*?)<\/sv>/g) || [];

    for (const block of svBlocks) {
      const idMatch = block.match(/<sv id="[^-]+-(\d+)-(\d+)"/);
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
      
      // Detectar versículos sin traducción
      const tMatch = block.match(/<t xml:lang="es">([\s\S]*?)<\/t>/);
      const rbMatch = block.match(/<rb xml:lang="es">([\s\S]*?)<\/rb>/);
      const hasTContent = tMatch && tMatch[1] && tMatch[1].trim();
      const hasRbContent = rbMatch && rbMatch[1] && rbMatch[1].trim();
      
      if (!hasTContent && !hasRbContent) {
        chapterContent.untranslatedVerses.add(verseNum);
      }

      // Extraer Strongs
      const contentWithoutFootnotes = block.replace(/<rf>[\s\S]*?<\/rf>/g, '');
      const strongs = new Set();
      const wiTagRegex = /<wi[\s\S]*?>/g;
      const wiTags = contentWithoutFootnotes.match(wiTagRegex) || [];

      for (const wiTag of wiTags) {
        const normalizedTag = wiTag.replace(/\n?\n|\n/g, ' ').replace(/\s{2,}/g, ' ');
        const valueMatch = normalizedTag.match(/value="(\d+),(\d+),/);
        if (valueMatch) {
          strongs.add(`G${valueMatch[1]}-${parseInt(valueMatch[2], 10)}`);
        }
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
