#!/usr/bin/env node
// -*- coding: utf-8 -*-

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import { parseSpaTdp } from './lib/parsers/spatdp-parser.js';
import { parseKjv2003 } from './lib/parsers/kjv2003-parser.js';
import { parseWlc } from './lib/parsers/wlc-parser.js';
import { analyzeChapterConcordance, sortStrongs } from './lib/validators/concordance.js';
import { loadExceptions } from './lib/exceptions.js';
import { BOOK_MAP, KJV2003_PATH_TEMPLATE, WLC_PATH_TEMPLATE } from './lib/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Format Validation ---
function validateBookFormat(bookLower, bookInfo) {
  const bookFilepath = path.join(__dirname, '..', `libros/${bookLower}.gbfxml`);
  if (!fs.existsSync(bookFilepath)) return;

  const content = fs.readFileSync(bookFilepath, 'utf-8');
  const lines = content.split('\n');
  let hasIssues = false;

  console.log(`\n--- Validación de Formato: ${bookInfo.display} ---`);

  const strongType = bookInfo.strongType || 'G';
  const issues = {
    "Marcado errado (type=\"G\" value=\"[0-9]*\")": new RegExp(`type="${strongType}" value="[0-9]*"`),
    "Apostrofes por cambiar por ´": /\`[^\´']*\'/,
    "Signos de puntuación fuera de \` \´": /\´[\.,]/,
    "Marcación Strong errada": new RegExp(`wi type="${strongType}[^C]"`),
    "Errores comunes (i<w)": /i<w/
  };

  for (const [description, regex] of Object.entries(issues)) {
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        console.log(`  [L ${i + 1}] ${description}: ${lines[i].trim()}`);
        hasIssues = true;
      }
    }
  }

  if (!hasIssues) {
    console.log("  Sin problemas de formato.");
  }
}

// --- Validación de sustantivos etiquetados con palabra funcional ---
// Detecta <wi value="N,pos,">palabra-funcional</wi> cuando N es un sustantivo,
// p. ej. <wi value="5590,8,">por</wi> (ψυχή «vida/alma») o
// <wi value="11,18,">de</wi> (Ἀβραάμ «Abraham»). El artículo o preposición
// no debería ser el contenido de un <wi> cuyo Strong es un sustantivo.
const FUNCION_ETIQUETA = new Set(['de', 'del', 'el', 'la', 'lo', 'los', 'las', 'a', 'al', 'un', 'una', 'unos', 'unas', 'por', 'para', 'en', 'con', 'sin', 'sobre', 'hacia', 'según', 'contra', 'desde', 'hasta', 'entre', 'ante', 'tras', 'mediante', 'durante']);

function childNodesArr(el) {
  const a = [];
  for (let i = 0; i < el.childNodes.length; i++) a.push(el.childNodes[i]);
  return a;
}

function textOfWi(node) {
  const p = [];
  function w(x) {
    if (x.nodeType === 3) { p.push(x.nodeValue); return; }
    if (x.nodeType !== 1) return;
    if (x.tagName === 'rf') return;
    for (const c of childNodesArr(x)) w(c);
  }
  w(node);
  return p.join('');
}

// Mapa Strong → morfologías, construido una vez desde KJV OSIS.
let strongMorphMap = null;
function buildStrongMorphMap() {
  if (strongMorphMap) return strongMorphMap;
  strongMorphMap = new Map();
  const dir = path.join(__dirname, '..', 'ref', 'sword_kjv');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.osis.xml'))) {
    const text = fs.readFileSync(path.join(dir, f), 'utf-8');
    const re = /<w\b([^>]*?)(?:\/>|>)/g;
    let m;
    while ((m = re.exec(text))) {
      const lm = m[1].match(/lemma="([^"]*)"/);
      const mo = m[1].match(/morph="robinson:([^"]*)"/);
      if (!lm || !mo) continue;
      const strongs = [...lm[1].matchAll(/strong:G(\d+)/g)].map(x => x[1]);
      const codes = mo[1].split(/\s+/).map(s => s.replace(/^robinson:/, '')).filter(Boolean);
      if (strongs.length !== codes.length) continue; // apareo posicional defensivo
      strongs.forEach((g, i) => {
        if (!strongMorphMap.has(g)) strongMorphMap.set(g, new Set());
        strongMorphMap.get(g).add(codes[i]);
      });
    }
  }
  return strongMorphMap;
}

function isNounStrong(strong) {
  const ms = buildStrongMorphMap().get(strong);
  if (!ms) return false;
  return [...ms].every(m => m === 'ARAM' || /^N-/.test(m));
}

function validateArticleTagging(bookLower, bookInfo) {
  const bookFilepath = path.join(__dirname, '..', `libros/${bookLower}.gbfxml`);
  if (!fs.existsSync(bookFilepath)) return 0;

  const doc = new DOMParser().parseFromString(fs.readFileSync(bookFilepath, 'utf-8'), 'application/xml');
  const wis = doc.getElementsByTagName('wi');
  const found = [];

  for (let i = 0; i < wis.length; i++) {
    const wi = wis[i];
    if (wi.getAttribute('type') !== 'G') continue;
    const value = wi.getAttribute('value') || '';
    const m = value.match(/^[A-Za-z]*(\d+),(\d+),?/);
    if (!m) continue;
    const strong = m[1];
    const txt = textOfWi(wi).replace(/\s+/g, ' ').trim().toLowerCase();
    if (!FUNCION_ETIQUETA.has(txt)) continue;
    if (!isNounStrong(strong)) continue;
    let sv = null, cur = wi;
    while (cur) {
      if (cur.tagName === 'sv') { sv = cur.getAttribute('id'); break; }
      cur = cur.parentNode;
    }
    found.push(`  [${sv || '?'}] <wi G${strong}> etiqueta «${txt}» (sustantivo mal etiquetado)`);
  }

  console.log(`\n--- Validación de sustantivos etiquetados con palabra funcional: ${bookInfo.display} ---`);
  if (found.length === 0) {
    console.log('  Sin problemas.');
  } else {
    found.forEach(f => console.log(f));
  }
  return found.length;
}

// --- Concordance Analysis ---
async function analyzeBookConcordance(bookLower, targetChapter, targetVerse) {
  const bookInfo = BOOK_MAP[bookLower];
  if (!bookInfo) {
    console.log(`Libro desconocido: ${bookLower}`);
    return { totalMismatches: 0, totalUntranslated: 0, totalExceptions: 0 };
  }

  const strongType = bookInfo.strongType || 'G';
  const isOT = strongType === 'H';

  console.log(`\n\n--- Analizando Concordancia: ${bookInfo.display} ---`);
  console.log("=".repeat(60));

  const spatdpFilepath = path.join(__dirname, '..', `libros/${bookLower}.gbfxml`);
  if (!fs.existsSync(spatdpFilepath)) {
    console.log(`Archivo no encontrado: ${spatdpFilepath}`);
    return { totalMismatches: 0, totalUntranslated: 0, totalExceptions: 0 };
  }

  const spatdpBookData = parseSpaTdp(spatdpFilepath, strongType);
  let totalMismatches = 0;
  let totalUntranslated = 0;
  let totalExceptions = 0;

  let chapters;
  if (targetChapter) {
    chapters = [targetChapter];
  } else {
    chapters = Array.from(spatdpBookData.keys()).sort((a, b) => a - b);
  }
  
  for (const chapter of chapters) {
    let referenceData;

    if (isOT) {
      // AT: usar WLC como referencia
      const wlcFilepath = path.join(__dirname, '..', WLC_PATH_TEMPLATE.replace('{wlc_code}', bookInfo.wlc));
      if (!fs.existsSync(wlcFilepath)) {
        console.log(`  Capítulo ${chapter}: archivo WLC no encontrado: ${wlcFilepath}`);
        continue;
      }
      referenceData = parseWlc(wlcFilepath);
      // parseWlc devuelve Map<capítulo, Map<versículo, Set>>, extraer el capítulo
      referenceData = referenceData.get(chapter) || new Map();
    } else {
      // NT: usar KJV2003 como referencia
      const chapterPadded = String(chapter).padStart(2, '0');
      const kjvFilepath = path.join(__dirname, '..', KJV2003_PATH_TEMPLATE
        .replace('{book_kjv2003}', bookInfo.kjv2003)
        .replace('{chapter_padded}', chapterPadded));
      
      if (!fs.existsSync(kjvFilepath)) {
        console.log(`  Capítulo ${chapter}: archivo KJV2003 no encontrado: ${kjvFilepath}`);
        continue;
      }
      referenceData = parseKjv2003(kjvFilepath);
    }

    const chapterResults = analyzeChapterConcordance(spatdpBookData, referenceData, bookLower, chapter);

    // Si hay versículo específico, filtrar resultados
    if (targetVerse) {
      chapterResults.mismatches = chapterResults.mismatches.filter(m => m.verse === targetVerse);
      chapterResults.untranslated = chapterResults.untranslated.filter(v => v === targetVerse);
      chapterResults.exceptions = chapterResults.exceptions.filter(e => e.verse === targetVerse);
    }

    totalMismatches += chapterResults.mismatches.length;
    totalUntranslated += chapterResults.untranslated.length;
    totalExceptions += chapterResults.exceptions.length;
    
    // Reportar resultados del capítulo
    if (chapterResults.untranslated.length > 0) {
      const ranges = [];
      const sorted = chapterResults.untranslated;
      let start = sorted[0];
      let end = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
          end = sorted[i];
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`);
          start = sorted[i];
          end = sorted[i];
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      console.log(`\n** Capítulo ${chapter}: ${chapterResults.untranslated.length} versículo(s) sin traducir: ${ranges.join(', ')}`);
    }
    
    if (chapterResults.mismatches.length > 0) {
      console.log(`\n** Capítulo ${chapter}: ${chapterResults.mismatches.length} versículo(s) con discrepancias de Strong.`);
      for (const mismatch of chapterResults.mismatches) {
        console.log(`\n  - Versículo ${chapter}:${mismatch.verse}`);
        let parts = [];
        if (mismatch.missingInSpatdp.length > 0) {
          parts.push(`Faltan en SpaTDP: [${sortStrongs(mismatch.missingInSpatdp).join(', ')}]`);
        }
        if (mismatch.missingInKjv2003.length > 0) {
          const refLabel = isOT ? 'WLC' : 'KJV2003';
          parts.push(`Faltan en ${refLabel}: [${sortStrongs(mismatch.missingInKjv2003).join(', ')}]`);
        }
        console.log(`    Resultado: ${parts.join('; ')}`);
      }
    }
    
    if (chapterResults.exceptions.length > 0) {
      for (const exc of chapterResults.exceptions) {
        console.log(`\n  - NOTA (${chapter}:${exc.verse}): ${exc.reason}`);
      }
    }
    
    if (chapterResults.mismatches.length === 0 && chapterResults.untranslated.length === 0) {
      process.stdout.write('.');
    }
  }
  
  return { totalMismatches, totalUntranslated, totalExceptions };
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const validationModeArg = args.find(arg => arg.startsWith('--modo-de-validacion='));
  const validationMode = validationModeArg ? validationModeArg.split('=')[1] : 'todo';
  
  const booksToValidate = args.filter(arg => !arg.startsWith('--'));
  const ntOnly = args.includes('--nt');
  
  // Parsear libro, capítulo y versículo opcionales
  let targetBook = null;
  let targetChapter = null;
  let targetVerse = null;

  if (booksToValidate.length >= 1) {
    targetBook = booksToValidate[0].toLowerCase();
  }
  if (booksToValidate.length >= 2) {
    targetChapter = parseInt(booksToValidate[1], 10);
  }
  if (booksToValidate.length >= 3) {
    targetVerse = parseInt(booksToValidate[2], 10);
  }

  // Cargar excepciones al inicio
  loadExceptions();

  let grandTotalArticle = 0;

  if (validationMode === 'formato' || validationMode === 'todo') {
    const booksToProcess = targetBook ? [targetBook] : Object.keys(BOOK_MAP);
    const filtered = ntOnly ? booksToProcess.filter(b => BOOK_MAP[b]?.strongType === 'G') : booksToProcess;
    for (const book of filtered) {
      const bookInfo = BOOK_MAP[book];
      if (bookInfo) {
        validateBookFormat(book, bookInfo);
        grandTotalArticle += validateArticleTagging(book, bookInfo);
      }
    }
  }
  
  if (validationMode === 'concordancia' || validationMode === 'todo') {
    const scope = targetChapter ? (targetVerse ? `${targetBook} ${targetChapter}:${targetVerse}` : `${targetBook} cap. ${targetChapter}`) : (targetBook || 'todos los libros');
    const testam = targetBook && BOOK_MAP[targetBook]?.strongType === 'H' ? 'Antiguo Testamento' : 'Nuevo Testamento';
    console.log(`\n\nIniciando análisis de concordancia del ${testam}: ${scope}...`);
    console.log("=".repeat(60));
    
    let grandTotalMismatches = 0;
    let grandTotalUntranslated = 0;
    let grandTotalExceptions = 0;
    const booksWithIssues = new Set();
    
    const booksToProcess = targetBook ? [targetBook] : Object.keys(BOOK_MAP);
    const filtered = ntOnly ? booksToProcess.filter(b => BOOK_MAP[b]?.strongType === 'G') : booksToProcess;
    
    for (const book of filtered) {
      const bookInfo = BOOK_MAP[book];
      if (!bookInfo) {
        console.log(`\nLibro desconocido: ${book}`);
        continue;
      }
      const { totalMismatches, totalUntranslated, totalExceptions } = await analyzeBookConcordance(book, targetChapter, targetVerse);
      if (totalMismatches > 0 || totalUntranslated > 0 || totalExceptions > 0) {
        grandTotalMismatches += totalMismatches;
        grandTotalUntranslated += totalUntranslated;
        grandTotalExceptions += totalExceptions;
        if (totalMismatches > 0 || totalUntranslated > 0) {
          booksWithIssues.add(bookInfo.display);
        }
      }
    }
    
    console.log("\n\n\n" + "=".repeat(60));
    console.log("            RESUMEN DEL ANÁLISIS");
    console.log("=".repeat(60));
    console.log(`Versículos sin traducir: ${grandTotalUntranslated}`);
    console.log(`Excepciones documentadas: ${grandTotalExceptions}`);
    console.log(`Discrepancias reales: ${grandTotalMismatches}`);
    console.log(`Sustantivos etiquetados con palabra funcional: ${grandTotalArticle}`);
    if (booksWithIssues.size > 0) {
      console.log(`  (Problemas encontrados en: ${Array.from(booksWithIssues).join(', ')})`);
    }
  }
  
  console.log("\nAnálisis completado.");
}

main();
