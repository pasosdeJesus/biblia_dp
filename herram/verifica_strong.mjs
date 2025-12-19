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
  'lucas': {
    '1': {
      '35': {
        missingInSpatdp: ['G1537-21', 'G4675-22', 'G40-23', 'G2564-24', 'G5207-25', 'G2316-26'],
        missingInKjv2003: ['G40-21', 'G2564-22', 'G5207-23', 'G2316-24'],
        reason: 'SpaTDP es fiel al TR. KJV2003 agrega \'ἐκ σοῦ\' (de ti).'
      }
    },
  '2': {
    '37': {
      missingInSpatdp: ['G3739-7', 'G3756-8', 'G868-9', 'G575-10', 'G3588-11', 'G2411-12', 'G3521-13', 'G2532-14', 'G1162-15', 'G3000-16', 'G3571-17', 'G2532-18', 'G2250-19'],
      missingInKjv2003: ['G5064-7', 'G3739-8', 'G3756-9', 'G868-10', 'G575-11', 'G3588-12', 'G2411-13', 'G3521-14', 'G2532-15', 'G1162-16', 'G3000-17', 'G3571-18', 'G2532-19', 'G2250-20'],
      reason: 'SpaTDP es fiel al TR y divide correctamente el número compuesto ὀγδοηκοντατεσσάρων (ochenta y cuatro), añadiendo G5064. La base KJV2003 no lo divide, causando un desfase en la numeración del resto del versículo.'
    }
  },
  '3': {
    '24': {
      missingInKjv2003: ['G3588-3'],
      reason: 'SpaTDP incluye el artículo τοῦ (G3588) que es implícito y omitido en la base KJV2003.'
    }
  },
  '2': {
    '37': {
      missingInSpatdp: ['G3739-7', 'G3756-8', 'G868-9', 'G575-10', 'G3588-11', 'G2411-12', 'G3521-13', 'G2532-14', 'G1162-15', 'G3000-16', 'G3571-17', 'G2532-18', 'G2250-19'],
      missingInKjv2003: ['G5064-7', 'G3739-8', 'G3756-9', 'G868-10', 'G575-11', 'G3588-12', 'G2411-13', 'G3521-14', 'G2532-15', 'G1162-16', 'G3000-17', 'G3571-18', 'G2532-19', 'G2250-20'],
      reason: 'SpaTDP es fiel al TR y divide correctamente el número compuesto ὀγδοηκοντατεσσάρων (ochenta y cuatro), añadiendo G5064 (cuatro) y causando un desfase en la numeración interna de la concordancia Strong. La base KJV2003 no lo divide y deja solo `ὀγδοηκον´ (ochenta).'
    }
  },
  '6': {
    '26': { 
      missingInSpatdp: ['G5024-11'], 
      missingInKjv2003: ['G3778-11'], 
      reason: 'Variante textual. SpaTDP sigue la lectura ταῦτα (G3778) de ediciones como la de Stephanus. KJV2003 sigue la crasis ταὐτὰ (G5024) tal vez de la edición de Scrivener (?).' 
    }
  }
},
  'hechos': {
    '4': {
      '12': {
        missingInKjv2003: ['G3762-6'],
        reason: 'Fidelidad al TR. SpaTDP incluye \'οὐδὲ\' (G3762), que la base KJV2003 omite.'
      }
    },
    '7': {
      '16': {
        missingInSpatdp: ['G4966-19'],
        missingInKjv2003: ['G3588-19', 'G4966-20'],
        reason: 'Fidelidad al TR. SpaTDP incluye el artículo τοῦ (G3588) antes de Siquem, causando un desfase posicional que la base KJV2003 (que lo omite) no tiene.'
      },
      '26': {
        missingInSpatdp: ['G1161-2'],
        missingInKjv2003: ['G5037-2'],
        reason: 'Variación textual menor. SpaTDP sigue el TR (δὲ, G1161), mientras que la base de datos KJV2003 usa (τε, G5037).'
      },
      '44': {
        missingInSpatdp: ['G3588-6', 'G3962-7', 'G2257-8', 'G1722-9', 'G3588-10', 'G2531-12', 'G1299-13', 'G3588-14', 'G2980-15', 'G3588-16', 'G3475-17', 'G4160-18', 'G846-19', 'G2596-20', 'G3588-21', 'G5179-22', 'G3739-23', 'G3708-24'],
        missingInKjv2003: ['G1722-6', 'G3588-7', 'G3962-8', 'G2257-9', 'G1722-10', 'G3588-12', 'G2531-13', 'G1299-14', 'G3588-15', 'G2980-16', 'G3588-17', 'G3475-18', 'G4160-19', 'G846-20', 'G2596-21', 'G3588-22', 'G5179-23', 'G3739-24', 'G3708-25'],
        reason: 'Fidelidad al TR. SpaTDP omite un \'ἐν\' (G1722) que la base KJV2003 añade en la posición 6, causando un desfase posicional en todo el resto del versículo.'
      }
    },
    '8': {
      '28': {
        missingInSpatdp: ['G314-10', 'G3588-11', 'G4396-12', 'G2268-13'],
        missingInKjv2003: ['G2532-10', 'G314-11', 'G3588-12', 'G4396-13', 'G2268-14'],
        reason: 'Fidelidad al TR. SpaTDP incluye un \'καὶ\' (G2532) en la posición 10 que la base KJV2003 omite, causando un desfase posicional.'
      }
    },
    '17': {
      '25': {
        missingInSpatdp: ['G2532-14', 'G3588-15', 'G3956-16'],
        missingInKjv2003: ['G2596-14', 'G3956-15'],
        reason: 'Variante textual. SpaTDP es fiel al TR (καὶ τὰ πάντα), mientras que la base KJV2003 usa la variante (κατὰ πάντα).'
      }
    },
    '24': {
      '13': {
        missingInSpatdp: ['G1410-3', 'G4012-4', 'G3739-5', 'G3568-6', 'G2723-7', 'G3450-8'],
        missingInKjv2003: ['G3165-3', 'G1410-4', 'G4012-5', 'G3739-6', 'G3568-7', 'G2723-8', 'G3450-9'],
        reason: 'Fidelidad al TR. SpaTDP incluye el pronombre \'με\' (G3165) en la posición 3, que la base KJV2003 omite, causando un desfase posicional.'
      }
    },
    '25': {
      '5': {
        missingInSpatdp: ['G824-11', 'G1722-12', 'G3588-13', 'G435-14', 'G5129-15', 'G2723-16', 'G846-17'],
        missingInKjv2003: ['G1722-11', 'G3588-12', 'G435-13', 'G5129-14', 'G2723-15', 'G846-16'],
        reason: 'Fidelidad al TR. SpaTDP omite correctamente \'ἄτοπον\' (G824), que la base KJV2003 erróneamente añade en la posición 11, causando un desfase posicional.'
      }
    },
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

