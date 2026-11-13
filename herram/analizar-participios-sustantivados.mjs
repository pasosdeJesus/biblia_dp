#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Busca participios sustantivados (artículo G3588 + participio) cuya
// traducción española no lleva relativo («que/quien»), señal de que falta
// vertirlos como cláusula relativa «el que/que + verbo».
// Ver doc/morfologia-Robinson.md, «Participio adjetival → cláusula relativa».
//
// Uso:
//   node herram/analizar-participios-sustantivados.mjs           (todo el NT)
//   node herram/analizar-participios-sustantivados.mjs pedro2    (un libro)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'
import { BOOK_MAP } from './lib/config.js'
import { parseKjv2003Full } from './lib/parsers/kjv2003-parser.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = path.join(__dirname, '..')
const KJV_DIR = path.join(BASE, 'ref', 'sword_kjv', 'capitulos2003')
const XML_LANG = 'xml:lang'

const NT_BOOKS = Object.keys(BOOK_MAP).filter(k => BOOK_MAP[k].kjv2003)
const RELATIVO = /\b(que|quien|quienes|cual|cuales)\b/

function childNodesArr(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}

function textOf(node) {
  const parts = []
  function walk(n) {
    if (n.nodeType === 3) { parts.push(n.nodeValue); return }
    if (n.nodeType !== 1) return
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(node)
  return parts.join('')
}

// Texto español por posición Strong: { posición: "texto" }.
function spaWordsFrom(node, out) {
  if (node.nodeType !== 1) return
  if (node.tagName === 'rf') return
  if (node.tagName === 'wi') {
    const value = node.getAttribute('value') || ''
    const m = value.match(/^[A-Za-z]*(\d+),(\d+),?/)
    if (m) {
      const pos = parseInt(m[2], 10)
      const txt = textOf(node).trim()
      if (txt) out[pos] = (out[pos] ? out[pos] + ' ' : '') + txt
    }
  }
  for (const c of childNodesArr(node)) spaWordsFrom(c, out)
}

// Extrae del GBFXML un mapa { versículo: { words: { posición: texto } } }.
function parseGbfWords(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8')
  const doc = new DOMParser().parseFromString(content, 'application/xml')
  const out = {}
  const svs = doc.getElementsByTagName('sv')
  for (let i = 0; i < svs.length; i++) {
    const sv = svs[i]
    const id = sv.getAttribute('id') || ''
    const m = id.match(/-(\d+)-(\d+)$/)
    if (!m) continue
    const chapter = parseInt(m[1], 10)
    const verse = parseInt(m[2], 10)
    const words = {}
    for (const c of childNodesArr(sv)) spaWordsFrom(c, words)
    out[chapter] = out[chapter] || {}
    out[chapter][verse] = words
  }
  return out
}

// Detección (igual que en make-report.mjs): participio con artículo G3588
// cuyo español no contiene relativo.
function detectar(words, spaWords) {
  const flags = []
  if (!words || !spaWords) return flags
  const porPos = {}
  for (const w of words) {
    const morphs = (w.morph || '').split(/robinson:/).map(x => x.trim()).filter(Boolean)
    for (let j = 0; j < w.positions.length; j++) {
      porPos[w.positions[j]] = { strong: w.strongs[j], morph: morphs[j] || '' }
    }
  }
  for (const w of words) {
    const morph = w.morph || ''
    if (!/V-.*P-[A-Z]{2,3}/.test(morph)) continue
    const idx = w.strongs.length > 1 ? w.positions.length - 1 : 0
    const pos = w.positions[idx]
    const prev = porPos[pos - 1]
    const conArticulo = w.strongs.includes(3588) || (prev && prev.strong === 3588)
    if (!conArticulo) continue
    const sig = porPos[pos + 1]
    if (sig && /^N-/.test(sig.morph)) continue
    const spa = (spaWords[String(pos)] || '').trim()
    // Si el artículo anterior ya trae el relativo («el que», «a quien»), la
    // relativa está resuelta y no corresponde relativo en el participio.
    const spaArticulo = (spaWords[String(pos - 1)] || '').trim().toLowerCase()
    if (spaArticulo && RELATIVO.test(spaArticulo)) continue
    if (spa && !RELATIVO.test(spa.toLowerCase())) {
      const greek = (w.greeks && w.greeks[idx]) || w.greek || '?'
      flags.push({ greek, spa })
    }
  }
  return flags
}

function analyzeBook(book) {
  const cfg = BOOK_MAP[book]
  if (!cfg || !cfg.kjv2003) return null
  const gbfPath = path.join(BASE, 'libros', `${book}.gbfxml`)
  if (!fs.existsSync(gbfPath)) return null

  const gbf = parseGbfWords(gbfPath)
  const kjvName = cfg.kjv2003
  const markerName = kjvName.replace(/_/g, ' ')

  const findings = []
  const chapterFiles = fs.readdirSync(KJV_DIR).filter(f =>
    f.startsWith(`${kjvName}-`) && f.endsWith('.osis.xml')
  )
  for (const f of chapterFiles) {
    const ch = parseInt(f.match(/-(\d+)\.osis\.xml$/)[1], 10)
    const kjv = parseKjv2003Full(path.join(KJV_DIR, f), markerName, ch)
    const gbfCh = gbf[ch] || {}
    for (const v of Object.keys(kjv)) {
      const words = kjv[v].words || []
      const spaWords = gbfCh[v] || {}
      for (const flag of detectar(words, spaWords)) {
        findings.push({ ref: `${cfg.display} ${ch}:${v}`, ...flag })
      }
    }
  }
  return { book, display: cfg.display, findings }
}

function main() {
  const args = process.argv.slice(2)
  const books = args.length > 0 ? args : NT_BOOKS

  console.log('='.repeat(70))
  console.log('  PARTICIPIOS SUSTANTIVADOS SIN RELATIVO «que/quien»')
  console.log('='.repeat(70))

  let total = 0
  for (const book of books) {
    const result = analyzeBook(book)
    if (!result) {
      console.log(`\n${book}: archivo no encontrado`)
      continue
    }
    if (result.findings.length === 0) continue
    console.log(`\n📖 ${result.display}:`)
    for (const f of result.findings) {
      console.log(`  ${f.ref}: «${f.greek}» → «${f.spa}»`)
      total++
    }
  }

  console.log()
  console.log('='.repeat(70))
  if (total === 0) {
    console.log('✅ No se encontraron participios sustantivados sin relativo.')
  } else {
    console.log(`📈 Total: ${total} participio(s) sustantivado(s) sin relativo.`)
  }
  console.log('='.repeat(70))
}

main()
