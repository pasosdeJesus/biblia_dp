#!/usr/bin/env node
/**
 * Convert USFX to GBFXML (English only, no Strong numbers).
 * Usage: node herram/usfx2gbfxml.mjs           # all OT books
 *        node herram/usfx2gbfxml.mjs GEN        # single book to stdout
 */
import fs from 'fs';

const BOOK_NAMES = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers',
  DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth',
  '1SA': '1Samuel', '2SA': '2Samuel', '1KI': '1Kings', '2KI': '2Kings',
  '1CH': '1Chronicles', '2CH': '2Chronicles', EZR: 'Ezra', NEH: 'Nehemiah',
  EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'SongOfSongs', ISA: 'Isaiah', JER: 'Jeremiah',
  LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah',
  NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai',
  ZEC: 'Zechariah', MAL: 'Malachi'
};

function stripTags(str) {
  // Remove <w ...> </w> footnotes <f>..</f>, <note>..</note>, <q>, <transChange>, etc
  let s = str
    .replace(/<f[^>]*>[\s\S]*?<\/f>/g, '')       // footnotes
    .replace(/<note[^>]*>[\s\S]*?<\/note>/g, '') // study notes
    .replace(/<ve\s*\/?>/g, '')                   // verse ends
    .replace(/<\/?[\w-]+[^>]*>/g, '')             // all remaining tags
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')                          // collapse whitespace
    .trim();
  return s;
}

function convertBook(bookXml, bid) {
  const bname = BOOK_NAMES[bid];
  if (!bname) return null;

  let out = `<?xml version="1.0" encoding="UTF-8"?>\n\n`;
  out += `<sb id="${bname}" type="" xml:lang="en">\n`;

  // Title
  const hMatch = bookXml.match(/<h[^>]*>([^<]*)<\/h>/);
  const title = hMatch ? hMatch[1].trim() : bname;
  out += `<tt>${title}<t xml:lang="es"/></tt>\n`;

  // Extract chapters
  const chRe = /<c\s+id="(\d+)"\s*\/?>/g;
  let chMatch;
  let lastChEnd = 0;
  const chapters = [];

  while ((chMatch = chRe.exec(bookXml)) !== null) {
    const chNum = chMatch[1];
    const chStart = chMatch.index;
    const chEnd = bookXml.indexOf('<c', chStart + 1);
    const chContent = chEnd === -1 ? bookXml.substring(chStart) : bookXml.substring(chStart, chEnd);
    
    // Extract verses from this chapter's content
    const verseRe = /<v\s+id="(\d+)"[^>]*>([\s\S]*?)(?=<v\s+id=|<ve\s*\/?>|$)/g;
    let vMatch;
    const verses = [];

    while ((vMatch = verseRe.exec(chContent)) !== null) {
      const vNum = vMatch[1];
      const rawText = vMatch[2];
      const text = stripTags(rawText);
      verses.push({ v: vNum, text });
    }

    // If no verses found with that regex, try broader match
    if (verses.length === 0) {
      const broadRe = /<v\s+id="(\d+)"[^>]*>([\s\S]*?)(?=<v\s+id=|<c\s+id=|<book|<ve|$)/g;
      while ((vMatch = broadRe.exec(chContent)) !== null) {
        const vNum = vMatch[1];
        const text = stripTags(vMatch[2]);
        verses.push({ v: vNum, text });
      }
    }

    chapters.push({ ch: chNum, verses });
  }

  // Output chapters
  for (const ch of chapters) {
    out += `<sc id="${bname}-${ch.ch}">\n<cm>\n`;
    for (const v of ch.verses) {
      out += `<sv id="${bname}-${ch.ch}-${v.v}">\n`;
      if (v.text) {
        out += v.text + '\n';
      }
      out += `</sv>\n`;
    }
    out += `</cm>\n</sc>\n`;
  }

  out += `</sb>\n`;
  return out;
}

// Main
const singleBook = process.argv[2] || null;
const xml = fs.readFileSync('ref/web_usfx/eng-web_usfx.xml', 'utf8');

const bookRe = /<book\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/book>/g;
let match;
let count = 0;

while ((match = bookRe.exec(xml)) !== null) {
  const bid = match[1];
  if (!BOOK_NAMES[bid]) continue;
  if (singleBook && bid !== singleBook) continue;

  const gbfxml = convertBook(match[0], bid);
  if (!gbfxml) continue;

  const bname = BOOK_NAMES[bid];
  if (singleBook) {
    process.stdout.write(gbfxml);
  } else {
    const filename = `libros/${bname.toLowerCase()}.gbfxml`;
    fs.writeFileSync(filename, gbfxml);
    console.log(`Written: ${filename}`);
  }
  count++;
}

if (!singleBook) console.log(`Done. ${count} OT books converted.`);
