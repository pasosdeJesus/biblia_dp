// -*- coding: utf-8 -*-
import fs from 'fs';

/**
 * Parsea un archivo WLC (Westminster Leningrad Codex) en XML
 * @param {string} filepath - Ruta al archivo .xml del libro en WLC
 * @returns {Map} Map<capítulo, Map<versículo, Set<strong-position>>>
 */
export function parseWlc(filepath) {
  const bookData = new Map();

  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    
    // Extraer todos los versículos con su contenido
    const verseRegex = /<verse osisID="[^.]+\.(\d+)\.(\d+)">([\s\S]*?)<\/verse>/g;
    let match;

    while ((match = verseRegex.exec(content)) !== null) {
      const chapterNum = parseInt(match[1], 10);
      const verseNum = parseInt(match[2], 10);
      const verseContent = match[3];

      if (!bookData.has(chapterNum)) {
        bookData.set(chapterNum, new Map());
      }

      const chapterData = bookData.get(chapterNum);
      const strongs = new Set();

      // Extraer todas las etiquetas <w> en orden secuencial
      const wTags = verseContent.match(/<w[^>]*>/g) || [];
      
      for (let pos = 0; pos < wTags.length; pos++) {
        const wTag = wTags[pos];
        const lemmaMatch = wTag.match(/lemma="([^"]*)"/);
        if (!lemmaMatch) continue;

        const lemma = lemmaMatch[1];
        // Extraer el número: quitar prefijos como "b/", "d/", "c/" y sufijos como " a"
        let numStr = lemma;
        if (numStr.includes('/')) {
          numStr = numStr.split('/').pop();
        }
        // Quitar sufijo alfabético (ej. "1254 a" → "1254")
        numStr = numStr.replace(/[^0-9].*$/, '');
        
        const strongNum = parseInt(numStr, 10);
        if (isNaN(strongNum)) continue;

        // Posición es 1-based
        const position = pos + 1;
        strongs.add(`H${strongNum}-${position}`);
      }

      chapterData.set(verseNum, strongs);
    }

    return bookData;
  } catch (e) {
    console.error(`Error parsing WLC ${filepath}:`, e);
    return new Map();
  }
}
