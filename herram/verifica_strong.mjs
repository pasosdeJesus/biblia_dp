#!/usr/bin/env node
// -*- coding: utf-8 -*-

/**
 * Script for verse-by-verse concordance debugging.
 * - Analyzes all NT books with corrected naming conventions.
 * - Identifies and reports known, correct exceptions (e.g., Textus Receptus differences).
 * - Skips concordance analysis for untranslated verses to provide a cleaner report.
 */

import fs from 'fs';

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

// Known, correct exceptions where SpaTDP follows Textus Receptus
const KNOWN_EXCEPTIONS = {
  'mateo': {
    '3': {
      '15': { missingInKjv2003: ['G4241-12', 'G2076-13'], reason: 'SpaTDP sigue el TR que incluye "πρεπον εστιν".' }
    },
    '6': {
      '24': { missingInKjv2003: ['G3126-28'], reason: 'SpaTDP sigue el TR que incluye "μαμμωνᾷ".' }
    },
    '14': {
      '16': { missingInKjv2003: ['G2192-8', 'G565-9'], reason: 'SpaTDP sigue el TR que incluye "οὐ χρείαν ἔχουσιν ἀπελθεῖν".' }
    },
    '17': {
      '8': { missingInKjv2003: ['G3440-13'], reason: 'SpaTDP sigue el TR que incluye "μόνον".' }
    },
    '23': {
      '14': {
        missingInSpatdp: ['G5330-6'],
        missingInKjv2003: ['G5330-5'],
        reason: 'Diferencia de posición para G5330 (Φαρισαῖος). SpaTDP (pos 5) es correcto según el TR. La base KJV2003 tiene una variación textual que desplaza la posición a 6.'
      }
    }
  },
  'marcos': {
    '4': {
      '20': { missingInSpatdp: ['G1722-19', 'G1722-22', 'G1722-25'], missingInKjv2003: ['G1520-19', 'G1520-22', 'G1520-25'], reason: 'KJV2003 es incorrecto. Omite G1520 (ἓν) que se repite en el TR y en su lugar añade G1722 (ἐν).' }
    },
    '8': {
      '24': { missingInSpatdp: ['G4043-10'], missingInKjv2003: ['G3708-10', 'G4043-11'], reason: 'SpaTDP (corregido) es correcto al diferenciar G991 y G3708. KJV2003 omite G3708 y tiene una posición incorrecta para G4043.' }
    },
    '12': {
      '31': { missingInSpatdp: ['G846-4'], missingInKjv2003: ['G3778-4'], reason: 'Divergencia de referencia para αὕτη. SpaTDP sigue BLB.org (G3778), mientras que KJV2003 usa G846.' }
    },
    '15': {
      '3': { missingInSpatdp: ['G846-7', 'G1161-8', 'G3762-9', 'G611-10'], missingInKjv2003: [], reason: 'SpaTDP es correcto al omitir una frase no presente en el TR de referencia, pero que KJV2003 sí incluye.' }
    }
  },
  'hechos': {
      '7': {
        '26': { missingInSpatdp: ['G1161-2'], missingInKjv2003: ['G5037-2'], reason: 'Variación textual menor. SpaTDP sigue el TR (δὲ, G1161), mientras que la base de datos KJV2003 usa (τε, G5037).' }
      }
  },
  'hebreos': {
    '1': {
      '3': { missingInKjv2003: ['G3588-13'], reason: 'SpaTDP correctly includes the article [τοῦ] based on Textus Receptus.' }
    },
    '9': {
      '1': {
        missingInSpatdp: ['G1345-7', 'G2999-8', 'G3588-9', 'G5037-10', 'G39-11', 'G2886-12'],
        missingInKjv2003: ['G4633-7', 'G1345-8', 'G2999-9', 'G3588-10', 'G5037-11', 'G39-12', 'G2886-13'],
        reason: 'Divergencia textual. SpaTDP incluye G4633 (σκηνη) basado en el Textus Receptus, lo que causa un desfase en la numeración de posición del resto del versículo en comparación con la KJV2003.'
      }
    }
  }
};

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
      if (!tMatch || !tMatch[1].trim()) {
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

// --- Main Debugging Logic ---

async function debugBook(bookLower) {
  const bookInfo = BOOK_MAP[bookLower];
  if (typeof bookInfo == "undefined") {
    console.log("Libro desconocido: ", bookLower);
    process.exit(1);
  }

  const bookDisplayName = bookInfo.display;
  console.log(`\n\n--- Analyzing ${bookDisplayName} ---\n`);
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
      console.log(`\n** Chapter ${chapter}: Found ${untranslatedVerses.size} untranslated verse(s): ${Array.from(untranslatedVerses).sort((a,b)=>a-b).join(', ')}`);
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
        const expectedMissingKjv2003 = new Set(exception.missingInKjv2003 || []);
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

async function main() {
  console.log("Starting refined New Testament concordance analysis...");
  let grandTotalMismatches = 0;
  let grandTotalUntranslated = 0;
  let grandTotalExceptions = 0;
  const booksWithIssues = new Set();

  for (const bookLower of Object.keys(BOOK_MAP)) {
    const { totalMismatches, totalUntranslated, totalExceptions } = await debugBook(bookLower);
    if (totalMismatches > 0) {
      grandTotalMismatches += totalMismatches;
      booksWithIssues.add(BOOK_MAP[bookLower].display);
    }
    if (totalUntranslated > 0) {
      grandTotalUntranslated += totalUntranslated;
      booksWithIssues.add(BOOK_MAP[bookLower].display);
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
  console.log("\nAnalysis complete.");
}

if (process.argv.length == 2) {
  main()
} else {
  for (let i = 2; i < process.argv.length; i++) {
    debugBook(process.argv[i])
  }
}

