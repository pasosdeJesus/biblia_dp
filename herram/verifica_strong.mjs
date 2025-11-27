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
  'mateo': { kjv: 'Matthew', display: 'Matthew' },
  'marcos': { kjv: 'Mark', display: 'Mark' },
  'lucas': { kjv: 'Luke', display: 'Luke' },
  'juan': { kjv: 'John', display: 'John' },
  'hechos': { kjv: 'Acts', display: 'Acts' },
  'romanos': { kjv: 'Romans', display: 'Romans' },
  'corintios1': { kjv: 'I_Corinthians', display: '1 Corinthians' },
  'corintios2': { kjv: 'II_Corinthians', display: '2 Corinthians' },
  'galatas': { kjv: 'Galatians', display: 'Galatians' },
  'efesios': { kjv: 'Ephesians', display: 'Ephesians' },
  'filipenses': { kjv: 'Philippians', display: 'Philippians' },
  'colosenses': { kjv: 'Colossians', display: 'Colossians' },
  'tesalonicenses1': { kjv: 'I_Thessalonians', display: '1 Thessalonians' },
  'tesalonicenses2': { kjv: 'II_Thessalonians', display: '2 Thessalonians' },
  'timoteo1': { kjv: 'I_Timothy', display: '1 Timothy' },
  'timoteo2': { kjv: 'II_Timothy', display: '2 Timothy' },
  'tito': { kjv: 'Titus', display: 'Titus' },
  'filemon': { kjv: 'Philemon', display: 'Philemon' },
  'hebreos': { kjv: 'Hebrews', display: 'Hebrews' },
  'santiago': { kjv: 'James', display: 'James' },
  'pedro1': { kjv: 'I_Peter', display: '1 Peter' },
  'pedro2': { kjv: 'II_Peter', display: '2 Peter' },
  'juan1': { kjv: 'I_John', display: '1 John' },
  'juan2': { kjv: 'II_John', display: '2 John' },
  'juan3': { kjv: 'III_John', display: '3 John' },
  'judas': { kjv: 'Jude', display: 'Jude' },
  'apocalipsis': { kjv: 'Revelation', display: 'Revelation' }
};

const SPATDP_PATH_TEMPLATE = "gen/capitulos/{book_lower}-{chapter_padded}.gbf.xml";
const KJV_PATH_TEMPLATE = "ref/sword_kjv/capitulos/{book_kjv}-{chapter_padded}.osis.xml";

// Known, correct exceptions where SpaTDP follows Textus Receptus
const KNOWN_EXCEPTIONS = {
  'mateo': {
    '3': {
      '15': { missingInKjv: ['G4241-12', 'G2076-13'], reason: 'SpaTDP sigue el TR que incluye "πρεπον εστιν".' }
    },
    '6': {
      '24': { missingInKjv: ['G3126-28'], reason: 'SpaTDP sigue el TR que incluye "μαμμωνᾷ".' }
    },
    '14': {
      '16': { missingInKjv: ['G2192-8', 'G565-9'], reason: 'SpaTDP sigue el TR que incluye "οὐ χρείαν ἔχουσιν ἀπελθεῖν".' }
    },
    '17': {
      '8': { missingInKjv: ['G3440-13'], reason: 'SpaTDP sigue el TR que incluye "μόνον".' }
    },
    '23': {
      '14': { missingInSpatdp: [], missingInKjv: ["G1161-2", "G5213-3", "G1122-4", "G2532-5", "G5273-7", "G3754-8", "G2719-9", "G3588-10", "G3614-11", "G3588-12", "G5503-13", "G2532-14", "G4392-15", "G3117-16", "G4336-17", "G1223-18", "G5124-19", "G2983-20", "G4053-21", "G2917-22"], reason: 'SpaTDP sigue el TR que incluye este versículo, ausente en la base de KJV.'}
    }
  },
  'hebreos': {
    '1': {
      '3': { missingInKjv: ['G3588-13'], reason: 'SpaTDP correctly includes the article [τοῦ] based on Textus Receptus.' }
    },
    '9': {
      '1': { missingInKjv: ['G4633-7'], reason: 'SpaTDP correctly includes the word [σκηνη] based on Textus Receptus.' }
    }
  }
};

// --- Parsing Functions ---

function parseSpaTdp(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const strongsData = new Map();
    const untranslatedVerses = new Set();
    const svBlocks = content.match(/<sv id="[^"]+"[^>]*>([\s\S]*?)<\/sv>/g) || [];

for (const block of svBlocks) {
  const idMatch = block.match(/<sv id="[^-]+-[^-]+-(\d+)"/);
  if (!idMatch) continue;
  const verseNum = parseInt(idMatch[1], 10);

  const tMatch = block.match(/<t xml:lang="es">([\s\S]*?)<\/t>/);
  if (!tMatch || !tMatch[1].trim()) {
    untranslatedVerses.add(verseNum);
  }

  const contentWithoutFootnotes = block.replace(/<rf>[\s\S]*?<\/rf>/g, '');
  const strongs = new Set();
  const wiTagRegex = /<wi[\s\S]*?>/g;
  const wiTags = contentWithoutFootnotes.match(wiTagRegex) || [];

  for (const wiTag of wiTags) {
    const normalizedTag = wiTag.replace(/\n?\n|\n/g, ' ').replace(/\s{2,}/g, ' ');
    const valueMatch = normalizedTag.match(/value=\"(\d+),(\d+),/);
      if (valueMatch) {
        strongs.add(`G${valueMatch[1]}-${parseInt(valueMatch[2], 10)}`);
      }
  }
  strongsData.set(verseNum, strongs);
}
return { strongsData, untranslatedVerses };
} catch (e) {
  return { strongsData: new Map(), untranslatedVerses: new Set() };
}
}

function parseKjv(filepath) {
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
        const srcMatch = wTag.match(/src=\"([\d\s]+)\"/);
          if (!srcMatch) continue;
          const positions = srcMatch[1].split(/\s+/).map(p => parseInt(p, 10));

          const lemmaMatch = wTag.match(/lemma=\"([^\"]*)\"/);
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
    console.log("Libro desconocido: ", bookLower)
    process.exit(1)
  }

  const bookDisplayName = bookInfo.display;
  console.log(`\n\n--- Analyzing ${bookDisplayName} ---\n`);
  console.log("======================================================");

  let chapter = 1;
  let totalMismatches = 0;
  let totalUntranslated = 0;
  let totalExceptions = 0;

  while (true) {
    const chapterPadded = String(chapter).padStart(2, '0');
    const spatdpFilepath = SPATDP_PATH_TEMPLATE.replace('{book_lower}', bookLower).replace('{chapter_padded}', chapterPadded);
    if (!fs.existsSync(spatdpFilepath)) {
      if (chapter === 1) console.log(`No files found for ${bookDisplayName}.`);
      break;
    }
    const { strongsData: spatdpData, untranslatedVerses } = parseSpaTdp(spatdpFilepath);

    const kjvFilepath = KJV_PATH_TEMPLATE.replace('{book_kjv}', bookInfo.kjv).replace('{chapter_padded}', chapterPadded);
    if (!fs.existsSync(kjvFilepath)) {
      console.log(`Not found ${kjvFilepath}.`);
      break;
    }
    const kjvData = fs.existsSync(kjvFilepath) ? parseKjv(kjvFilepath) : new Map();

    let chapterHasIssue = false;

    if (untranslatedVerses.size > 0) {
      totalUntranslated += untranslatedVerses.size;
      chapterHasIssue = true;
      console.log(`\n** Chapter ${chapter}: Found ${untranslatedVerses.size} untranslated verse(s): ${Array.from(untranslatedVerses).sort((a,b)=>a-b).join(', ')}`);
    }

    const allVerseKeys = new Set([...spatdpData.keys(), ...kjvData.keys()]);
    const sortedVerseKeys = Array.from(allVerseKeys).sort((a, b) => a - b);
    const sorter = (a, b) => {
      const [, posA] = a.split('-').map(Number); const [, posB] = b.split('-').map(Number);
      return posA - posB;
    };

    let verseMismatches = [];

    for (const verse of sortedVerseKeys) {
      // Skip concordance check for untranslated verses
      if (untranslatedVerses.has(verse)) {
        continue;
      }

      const spatdpSet = spatdpData.get(verse) || new Set();
      const kjvSet = kjvData.get(verse) || new Set();
      const missingInSpaTdp = new Set([...kjvSet].filter(item => !spatdpSet.has(item)));
      const missingInKjv = new Set([...spatdpSet].filter(item => !kjvSet.has(item)));

      if (missingInSpaTdp.size === 0 && missingInKjv.size === 0) {
        continue;
      }

      // Check for known exceptions
      const exception = KNOWN_EXCEPTIONS[bookLower]?.[chapter]?.[verse];
      if (exception) {
        const expectedMissingKjv = new Set(exception.missingInKjv || []);
        const expectedMissingSpatdp = new Set(exception.missingInSpatdp || []);
        // Check if the actual diff matches the exception's expected diff
        const isExceptionMatch = missingInKjv.size === expectedMissingKjv.size &&
          [...missingInKjv].every(item => expectedMissingKjv.has(item)) &&
          missingInSpaTdp.size === expectedMissingSpatdp.size &&
          [...missingInSpaTdp].every(item => expectedMissingSpatdp.has(item));

        if (isExceptionMatch) {
          console.log(`\n  - NOTE (Verse ${chapter}:${verse}): ${exception.reason}`);
          totalExceptions++;
          chapterHasIssue = true;
          continue;
        }
      }

      totalMismatches++;
      chapterHasIssue = true;
      verseMismatches.push({ verse, missingInSpaTdp, missingInKjv });
    }

    if (verseMismatches.length > 0) {
      console.log(`\n** Chapter ${chapter}: Found ${verseMismatches.length} verse(s) with Strong number mismatches.`);
      for(const mismatch of verseMismatches) {
        console.log(`\n  - Verse ${chapter}:${mismatch.verse}`);
        let parts = [];
        if (mismatch.missingInSpaTdp.size > 0) parts.push(`Missing in SpaTDP: [${Array.from(mismatch.missingInSpaTdp).sort(sorter).join(', ')}]`);
        if (mismatch.missingInKjv.size > 0) parts.push(`Missing in KJV: [${Array.from(mismatch.missingInKjv).sort(sorter).join(', ')}]`);
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
