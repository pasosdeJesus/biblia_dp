#!/usr/bin/env node
// -*- coding: utf-8 -*-

/**
 * Script for verse-by-verse concordance and format debugging.
 * - Analyzes all NT books with corrected naming conventions.
 * - Identifies and reports known, correct exceptions (e.g., Textus Receptus differences).
 * - Skips concordance analysis for untranslated verses to provide a cleaner report.
 * - Reads exceptions from an external `herram/excepciones.json` file.
 * - Validates XML format, including spacing, punctuation, and tag structure.
 *
 * herram/validador.mjs  --validation-mode=all
 */

import fs from 'fs';
import path from 'path';

// --- Configuration ---

const BOOK_MAP = {
  'mateo': { kjv2003: 'Matthew', display: 'Matthew' },
  'marcos': { kjv2003: 'Mark', display: 'Mark' },
  'lucas': { kjv2003: 'Luke', display: 'Luke' },
  'juan': { kjv2003: 'John', display: 'John' },
  'hechos': { kjv2003: 'Acts', display: 'Acts' },
  'romanos': { kjv2003: 'Romans', display: 'Romans' },
  'corintios1': { kjv2003: 'I_Corinthians', display: '1 Corinthians' },
  'corintios2': { kjv2003: 'II_Corinthians', display: '2 Corinthians' },
  'galatas': { kjv2003: 'Galatians', display: 'Galatians' },
  'efesios': { kjv2003: 'Ephesians', display: 'Ephesians' },
  'filipenses': { kjv2003: 'Philippians', display: 'Philippians' },
  'colosenses': { kjv2003: 'Colossians', display: 'Colossians' },
  'tesalonicenses1': { kjv2003: 'I_Thessalonians', display: '1 Thessalonians' },
  'tesalonicenses2': { kjv2003: 'II_Thessalonians', display: '2 Thessalonians' },
  'timoteo1': { kjv2003: 'I_Timothy', display: '1 Timothy' },
  'timoteo2': { kjv2003: 'II_Timothy', display: '2 Timothy' },
  'tito': { kjv2003: 'Titus', display: 'Titus' },
  'filemon': { kjv2003: 'Philemon', display: 'Philemon' },
  'hebreos': { kjv2003: 'Hebrews', display: 'Hebrews' },
  'santiago': { kjv2003: 'James', display: 'James' },
  'pedro1': { kjv2003: 'I_Peter', display: '1 Peter' },
  'pedro2': { kjv2003: 'II_Peter', display: '2 Peter' },
  'juan1': { kjv2003: 'I_John', display: '1 John' },
  'juan2': { kjv2003: 'II_John', display: '2 John' },
  'juan3': { kjv2003: 'III_John', display: '3 John' },
  'judas': { kjv2003: 'Jude', display: 'Jude' },
  'apocalipsis': { kjv2003: 'Revelation', display: 'Revelation' }
};

const KJV2003_PATH_TEMPLATE = "ref/sword_kjv/capitulos2003/{book_kjv2003}-{chapter_padded}.osis.xml";

const EXCEPTIONS_PATH = 'herram/excepciones.json';
let KNOWN_EXCEPTIONS = {};
if (fs.existsSync(EXCEPTIONS_PATH)) {
  try {
    const exceptionsContent = fs.readFileSync(EXCEPTIONS_PATH, 'utf-8');
    KNOWN_EXCEPTIONS = JSON.parse(exceptionsContent);
  } catch (e) {
    console.error(`Error reading or parsing ${EXCEPTIONS_PATH}:`, e);
    process.exit(1);
  }
}

// --- Validation Functions ---

function validateBookFormat(bookLower) {
  const bookFilepath = `${bookLower}.gbfxml`;
  if (!fs.existsSync(bookFilepath)) return;

  const content = fs.readFileSync(bookFilepath, 'utf-8');
  const lines = content.split('\n');
  let hasIssues = false;

  console.log(`\n--- Running Format Validation for ${bookLower} ---`);

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
    console.log("  No format issues found.");
  }
}


// --- Parsing Functions ---

function parseSpaTdp(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const bookData = new Map();
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
      const tMatch = block.match(/<t xml:lang="es">([\s\S]*?)<\/t>/);
      const rbMatch = block.match(/<rb xml:lang="es">([\s\S]*?)<\/rb>/);
      
      const hasTContent = tMatch && tMatch[1] && tMatch[1].trim();
      const hasRbContent = rbMatch && rbMatch[1] && rbMatch[1].trim();
      
      if (!hasTContent && !hasRbContent) {
        chapterContent.untranslatedVerses.add(verseNum);
      }

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
    return new Map();
  }
}

function parseKjv2003(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const versesData = new Map();
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
    return new Map();
  }
}

// --- Main Concordance Logic ---

async function debugBookConcordance(bookLower) {
  const bookInfo = BOOK_MAP[bookLower];
  if (typeof bookInfo == "undefined") {
    console.log("Libro desconocido: ", bookLower);
    process.exit(1);
  }

  const bookDisplayName = bookInfo.display;
  console.log(`\n\n--- Analyzing Concordance for ${bookDisplayName} ---\n`);
  console.log("======================================================");

  const spatdpBookFilepath = `${bookLower}.gbfxml`;
  if (!fs.existsSync(spatdpBookFilepath)) {
      console.log(`No file found for ${bookDisplayName}: ${spatdpBookFilepath}. Skipping.`);
      return { totalMismatches: 0, totalUntranslated: 0, totalExceptions: 0 };
  }
  const spatdpBookData = parseSpaTdp(spatdpBookFilepath);

  let chapter = 1;
  let totalMismatches = 0;
  let totalUntranslated = 0;
  let totalExceptions = 0;

  while (true) {
    const chapterPadded = String(chapter).padStart(2, '0');
    const kjv2003Filepath = KJV2003_PATH_TEMPLATE.replace('{book_kjv2003}', bookInfo.kjv2003).replace('{chapter_padded}', chapterPadded);
    if (!fs.existsSync(kjv2003Filepath)) {
      if (chapter === 1) console.log(`No KJV2003 files found for ${bookDisplayName}.`);
      break;
    }
    
    const kjv2003Data = parseKjv2003(kjv2003Filepath);
    const spatdpChapterData = spatdpBookData.get(chapter) || { strongsData: new Map(), untranslatedVerses: new Set() };
    const { strongsData: spatdpData, untranslatedVerses } = spatdpChapterData;

    let chapterHasIssue = false;

    if (untranslatedVerses.size > 0) {
      totalUntranslated += untranslatedVerses.size;
      chapterHasIssue = true;
      const ranges = [];
      const sortedVerses = Array.from(untranslatedVerses).sort((a, b) => a - b);
      if (sortedVerses.length > 0) {
        let start = sortedVerses[0];
        let end = sortedVerses[0];
        for (let i = 1; i < sortedVerses.length; i++) {
          if (sortedVerses[i] === end + 1) {
            end = sortedVerses[i];
          } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = sortedVerses[i];
            end = sortedVerses[i];
          }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
      }
      console.log(`\n** Chapter ${chapter}: Found ${untranslatedVerses.size} untranslated verse(s): ${ranges.join(', ')}`);
    }

    const allVerseKeys = new Set([...spatdpData.keys(), ...kjv2003Data.keys()]);
    const sortedVerseKeys = Array.from(allVerseKeys).sort((a, b) => a - b);
    const sorter = (a, b) => {
      const [, posA] = a.split('-').map(Number); const [, posB] = b.split('-').map(Number);
      return posA - posB;
    };

    let verseMismatches = [];

    for (const verse of sortedVerseKeys) {
      if (untranslatedVerses.has(verse)) {
        continue;
      }

      const spatdpSet = spatdpData.get(verse) || new Set();
      const kjv2003Set = kjv2003Data.get(verse) || new Set();
      const missingInSpatdp = new Set([...kjv2003Set].filter(item => !spatdpSet.has(item)));
      const missingInKjv2003 = new Set([...spatdpSet].filter(item => !kjv2003Set.has(item)));

      if (missingInSpatdp.size === 0 && missingInKjv2003.size === 0) {
        continue;
      }

      const exception = KNOWN_EXCEPTIONS[bookLower]?.[chapter]?.[verse];
      if (exception) {
        const missingKjvKey = exception.missingInKjv2003 || exception.missingKjv2003;
        const expectedMissingKjv2003 = new Set(missingKjvKey || []);
        const expectedMissingSpatdp = new Set(exception.missingInSpatdp || []);
        const isExceptionMatch = missingInKjv2003.size === expectedMissingKjv2003.size &&
          [...missingInKjv2003].every(item => expectedMissingKjv2003.has(item)) &&
          missingInSpatdp.size === expectedMissingSpatdp.size &&
          [...missingInSpatdp].every(item => expectedMissingSpatdp.has(item));

        if (isExceptionMatch) {
          console.log(`\n  - NOTE (Verse ${chapter}:${verse}): ${exception.reason}`);
          totalExceptions++;
          chapterHasIssue = true;
          continue;
        }
      }

      totalMismatches++;
      chapterHasIssue = true;
      verseMismatches.push({ verse, missingInSpatdp, missingInKjv2003 });
    }

    if (verseMismatches.length > 0) {
      console.log(`\n** Chapter ${chapter}: Found ${verseMismatches.length} verse(s) with Strong number mismatches.`);
      for(const mismatch of verseMismatches) {
        console.log(`\n  - Verse ${chapter}:${mismatch.verse}`);
        let parts = [];
        if (mismatch.missingInSpatdp.size > 0) parts.push(`Missing in SpaTDP: [${Array.from(mismatch.missingInSpatdp).sort(sorter).join(', ')}]`);
        if (mismatch.missingInKjv2003.size > 0) parts.push(`Missing in KJV2003: [${Array.from(mismatch.missingInKjv2003).sort(sorter).join(', ')}]`);
        console.log(`    Result: ${parts.join('; ')}`);
      }
    }

    if (!chapterHasIssue) {
      process.stdout.write('.');
    }
    chapter++;
  }
  return { totalMismatches, totalUntranslated, totalExceptions };
}


// --- Main Execution Logic ---

async function main() {
  const args = process.argv.slice(2);
  const validationModeArg = args.find(arg => arg.startsWith('--validation-mode='));
  const validationMode = validationModeArg ? validationModeArg.split('=')[1] : 'concordance';
  
  const booksToValidate = args.filter(arg => !arg.startsWith('--'));

  const targetBooks = booksToValidate.length > 0 ? booksToValidate : Object.keys(BOOK_MAP);

  if (validationMode === 'format' || validationMode === 'all') {
    for (const book of targetBooks) {
        validateBookFormat(book);
    }
  }

  if (validationMode === 'concordance' || validationMode === 'all') {
      console.log("\n\nStarting refined New Testament concordance analysis...");
      let grandTotalMismatches = 0;
      let grandTotalUntranslated = 0;
      let grandTotalExceptions = 0;
      const booksWithIssues = new Set();

      for (const book of targetBooks) {
        const { totalMismatches, totalUntranslated, totalExceptions } = await debugBookConcordance(book);
        if (totalMismatches > 0) {
          grandTotalMismatches += totalMismatches;
          booksWithIssues.add(BOOK_MAP[book].display);
        }
        if (totalUntranslated > 0) {
          grandTotalUntranslated += totalUntranslated;
          booksWithIssues.add(BOOK_MAP[book].display);
        }
        if (totalExceptions > 0) {
          grandTotalExceptions += totalExceptions;
        }
      }

      console.log("\n\n\n======================================================");
      console.log("            Full New Testament Analysis Summary");
      console.log("======================================================");
      console.log(`Untranslated Verses: ${grandTotalUntranslated} total.`);
      console.log(`Noted Exceptions (Correct): ${grandTotalExceptions} total (reported for clarity, not errors).`);
      console.log(`True Mismatches: ${grandTotalMismatches} total verses requiring review.`);
      if(booksWithIssues.size > 0) console.log(`  (Issues found in: ${Array.from(booksWithIssues).join(', ')})`);
  }

  console.log("\nAnalysis complete.");
}

main();
