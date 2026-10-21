// -*- coding: utf-8 -*-
import fs from 'fs';
import { normalize } from '../text.js';

/**
 * Parsea un archivo OSIS de KJV2003
 * @param {string} filepath - Ruta al archivo .osis.xml
 * @returns {Map} Map<versículo, Set<strong-position>>
 */
export function parseKjv2003(filepath) {
  const versesData = new Map();
  
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const verseChunks = content.split(/\$\$\$[A-Za-z0-9_ ]+\s\d+:/);
    const verseMarkers = content.match(/\$\$\$([A-Za-z0-9_ ]+\s\d+:(\d+))/g) || [];

    if (verseChunks.length === 0 || verseMarkers.length === 0) {
      return versesData;
    }

    for (let i = 1; i < verseChunks.length; i++) {
      const marker = verseMarkers[i - 1];
      let verseContent = verseChunks[i];
      const verseNumMatch = marker.match(/:(\d+)/);
      if (!verseNumMatch || !verseContent) continue;
      const verseNum = parseInt(verseNumMatch[1], 10);

      // Eliminar colofones
      const colophonIndex = verseContent.indexOf('type="colophon"');
      if (colophonIndex !== -1) {
        verseContent = verseContent.substring(0, colophonIndex);
      }

      const strongs = new Set();
      const wTags = verseContent.match(/<w [^>]+>/g) || [];

      for (const wTag of wTags) {
        const srcMatch = wTag.match(/src="([\d\s]+)"/);
        if (!srcMatch) continue;
        const positions = srcMatch[1].split(/\s+/).map(p => parseInt(p, 10));

        const lemmaMatch = wTag.match(/lemma="([^"]*)"/);
        if (!lemmaMatch) continue;

        const strongsInLemma = lemmaMatch[1].match(/strong:G\d+/g) || [];
        const strongNumbers = strongsInLemma.map(s => s.replace('strong:', ''));

        if (strongNumbers.length > 0 && strongNumbers.length === positions.length) {
          for (let j = 0; j < strongNumbers.length; j++) {
            strongs.add(`${strongNumbers[j]}-${positions[j]}`);
          }
        } else if (strongNumbers.length > 0 && positions.length === 1) {
          for (const strongNum of strongNumbers) {
            strongs.add(`${strongNum}-${positions[0]}`);
          }
        }
      }
      versesData.set(verseNum, strongs);
    }
    return versesData;
  } catch (e) {
    console.error(`Error parsing ${filepath}:`, e);
    return new Map();
  }
}

/**
 * Obtiene los Strongs de un versículo específico
 */
export function getStrongsForVerse(versesData, verse) {
  return versesData.get(verse) || new Set();
}

/**
 * Parsea un archivo OSIS de KJV2003 por capítulo, extrayendo el detalle
 * completo por versículo: texto, Strongs con posición, verbos, preposiciones
 * e interlinear (griego → inglés). Es la fuente única de este formato para
 * las herramientas de revisión.
 *
 * @param {string} filepath - Ruta al archivo .osis.xml
 * @param {string} markerName - Nombre del libro en el marcador de versículo
 *                              (con espacios, ej. "I Peter").
 * @param {number} chapter - Número de capítulo.
 * @returns {Object} Map<versículo, { text, strongs, verbs, preps, words }>
 */
export function parseKjv2003Full(filepath, markerName, chapter) {
  const kjv = {}
  let cur = null
  for (const raw of fs.readFileSync(filepath, 'utf-8').split('\n')) {
    const line = raw.replace(/\r$/, '')
    const mm = line.match(new RegExp(`^\\$\\$\\$${markerName} ${chapter}:(\\d+)`))
    if (mm) { cur = parseInt(mm[1], 10); kjv[cur] = { text: [], strongs: [], verbs: [], preps: [], words: [] }; continue }
    if (cur === null) continue

    // palabras <w ...> ... </w>
    const wRe = /<w\b([^>]*?)(?:\/>|>(.*?)<\/w>)/g
    let wm
    const lineStrongs = []
    const lineVerbs = []
    const linePreps = []
    const lineWords = []
    while ((wm = wRe.exec(line))) {
      const attrs = wm[1]
      const body = (wm[2] || '').replace(/<[^>]+>/g, '')
      const lemma = attrs.match(/lemma="([^"]*)"/)
      const src = attrs.match(/src="([^"]*)"/)
      const morph = attrs.match(/morph="robinson:([^"]*)"/)
      if (!lemma || !src) continue
      const gids = [...lemma[1].matchAll(/strong:G(\d+)/g)].map(x => x[1])
      const greeks = [...lemma[1].matchAll(/lemma\.TR:([^"\s]+)/g)].map(x => x[1])
      const positions = src[1].split(/\s+/).filter(x => /^\d+$/.test(x)).map(Number)
      if (gids.length === positions.length) {
        for (let k = 0; k < gids.length; k++) lineStrongs.push([Number(gids[k]), positions[k]])
      } else if (gids.length === 1) {
        for (const p of positions) lineStrongs.push([Number(gids[0]), p])
      }
      lineWords.push({
        strongs: gids.map(Number),
        greeks,
        positions,
        greek: greeks[0] || '',
        morph: morph ? morph[1] : '',
        english: normalize(body)
      })
      if (morph && morph[1].startsWith('V-')) {
        lineVerbs.push({
          morph: morph[1],
          greek: greeks[0] || '',
          text: normalize(body),
          src: src[1].trim()
        })
      }
      if (morph && morph[1] === 'PREP' && gids.length) {
        linePreps.push({
          strong: Number(gids[0]),
          greek: greeks[0] || '',
          text: normalize(body),
          src: src[1].trim()
        })
      }
    }
    kjv[cur].strongs.push(...lineStrongs)
    kjv[cur].verbs.push(...lineVerbs)
    kjv[cur].preps.push(...linePreps)
    kjv[cur].words.push(...lineWords)

    // texto: quitar <w/> y <w>..</w>, <transChange>..</transChange>, resto de tags
    let t = line.replace(/<w\b[^>]*?\/>/g, '')
    t = t.replace(/<w\b[^>]*?>(.*?)<\/w>/g, '$1')
    t = t.replace(/<transChange[^>]*>(.*?)<\/transChange>/g, '$1')
    t = t.replace(/<[^>]+>/g, '')
    kjv[cur].text.push(t.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'"))
  }
  for (const v of Object.keys(kjv)) {
    kjv[v].text = normalize(kjv[v].text.join(' '))
    kjv[v].strongs = [...new Map(kjv[v].strongs.map(x => [x.join('-'), x])).values()].sort((a, b) => a[1] - b[1] || a[0] - b[0])
  }
  return kjv
}
