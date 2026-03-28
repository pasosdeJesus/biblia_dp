#!/usr/bin/env node
// -*- coding: utf-8 -*-

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { parseSpaTdp } from './lib/parsers/spatdp-parser.js';
import { parseKjv2003 } from './lib/parsers/kjv2003-parser.js';
import { analyzeChapterConcordance, sortStrongs } from './lib/validators/concordance.js';
import { loadExceptions } from './lib/exceptions.js';
import { BOOK_MAP, KJV2003_PATH_TEMPLATE } from './lib/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Format Validation (mantenido igual) ---
function validateBookFormat(bookLower) {
  const bookFilepath = path.join(__dirname, '..', `${bookLower}.gbfxml`);
  if (!fs.existsSync(bookFilepath)) return;

  const content = fs.readFileSync(bookFilepath, 'utf-8');
  const lines = content.split('\n');
  let hasIssues = false;

  console.log(`\n--- Validación de Formato: ${BOOK_MAP[bookLower]?.display || bookLower} ---`);

  const issues = {
    "Espacios horizontales que posiblemente deben omitirse": /<t xml:lang="es">[^/]*\/>[ ]*$/,
    "Espacios horizontales que posiblemente deben añadirse": /<wi[^/]*\/><wi[^/]*\/>/,
    "Marcado errado (wi pegado a wi)": /\/wi><wi/,
    "Marcado errado (type=\"G\" value=\"[0-9]*\")": /type=\"G\" value=\"[0-9]*\"/,
    "Apostrofes por cambiar por ´": /\`[^\´']*\'/,
    "Signos de puntuación fuera de \` \´": /\´[\.,]/,
    "Marcación Strong errada": /wi type=\"G[^C]"/,
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

// --- Concordance Analysis ---
async function analyzeBookConcordance(bookLower) {
  const bookInfo = BOOK_MAP[bookLower];
  if (!bookInfo) {
    console.log(`Libro desconocido: ${bookLower}`);
    return { totalMismatches: 0, totalUntranslated: 0, totalExceptions: 0 };
  }

  console.log(`\n\n--- Analizando Concordancia: ${bookInfo.display} ---`);
  console.log("=".repeat(60));

  const spatdpFilepath = path.join(__dirname, '..', `${bookLower}.gbfxml`);
  if (!fs.existsSync(spatdpFilepath)) {
    console.log(`Archivo no encontrado: ${spatdpFilepath}`);
    return { totalMismatches: 0, totalUntranslated: 0, totalExceptions: 0 };
  }

  const spatdpBookData = parseSpaTdp(spatdpFilepath);
  let totalMismatches = 0;
  let totalUntranslated = 0;
  let totalExceptions = 0;

  const chapters = Array.from(spatdpBookData.keys()).sort((a, b) => a - b);
  
  for (const chapter of chapters) {
    const chapterPadded = String(chapter).padStart(2, '0');
    const kjvFilepath = KJV2003_PATH_TEMPLATE
      .replace('{book_kjv2003}', bookInfo.kjv2003)
      .replace('{chapter_padded}', chapterPadded);
    
    if (!fs.existsSync(kjvFilepath)) continue;
    
    const kjvData = parseKjv2003(kjvFilepath);
    const chapterResults = analyzeChapterConcordance(spatdpBookData, kjvData, bookLower, chapter);
    
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
          parts.push(`Faltan en KJV2003: [${sortStrongs(mismatch.missingInKjv2003).join(', ')}]`);
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
  const validationMode = validationModeArg ? validationModeArg.split('=')[1] : 'concordancia';
  
  const booksToValidate = args.filter(arg => !arg.startsWith('--'));
  const targetBooks = booksToValidate.length > 0 ? booksToValidate : Object.keys(BOOK_MAP);
  
  // Cargar excepciones al inicio
  loadExceptions();
  
  if (validationMode === 'formato' || validationMode === 'todo') {
    for (const book of targetBooks) {
      validateBookFormat(book);
    }
  }
  
  if (validationMode === 'concordancia' || validationMode === 'todo') {
    console.log("\n\nIniciando análisis de concordancia del Nuevo Testamento...");
    let grandTotalMismatches = 0;
    let grandTotalUntranslated = 0;
    let grandTotalExceptions = 0;
    const booksWithIssues = new Set();
    
    for (const book of targetBooks) {
      const { totalMismatches, totalUntranslated, totalExceptions } = await analyzeBookConcordance(book);
      if (totalMismatches > 0 || totalUntranslated > 0 || totalExceptions > 0) {
        grandTotalMismatches += totalMismatches;
        grandTotalUntranslated += totalUntranslated;
        grandTotalExceptions += totalExceptions;
        booksWithIssues.add(BOOK_MAP[book]?.display || book);
      }
    }
    
    console.log("\n\n\n" + "=".repeat(60));
    console.log("            RESUMEN DEL ANÁLISIS");
    console.log("=".repeat(60));
    console.log(`Versículos sin traducir: ${grandTotalUntranslated}`);
    console.log(`Excepciones documentadas: ${grandTotalExceptions}`);
    console.log(`Discrepancias reales: ${grandTotalMismatches}`);
    if (booksWithIssues.size > 0) {
      console.log(`  (Problemas encontrados en: ${Array.from(booksWithIssues).join(', ')})`);
    }
  }
  
  console.log("\nAnálisis completado.");
}

main();
