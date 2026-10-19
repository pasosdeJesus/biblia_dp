#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Extrae, para revisión, el texto de las 4 fuentes (WEB, SpaTDP, KJV, RVG),
// los números Strong con posición y la morfología Robinson de cada verbo,
// de un libro + capítulo. Emite JSON a stdout.
//
// Uso: node herram/parse-revision.mjs <libro> <capítulo>
//   <libro>   nombre del archivo en libros/ (ej. mateo, pedro1, santiago)
//   <capítulo> número de capítulo
//
// Salida (JSON):
//   { gbf: { <v>: { web, spa, strongs, missing, extra } },
//     kjv: { <v>: { text, strongs, verbs } },
//     rvg: { <v>: "texto" } }

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'
import { BOOK_MAP } from './lib/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = path.join(__dirname, '..')
const XML_LANG = 'xml:lang'

// Número (en USFM) y nombre inglés (en RVG/KJV) por libro NT.
// KJV2003 viene de BOOK_MAP; aquí solo lo que falta (número RVG).
const RVG_NUM = {
  mateo: 40, marcos: 41, lucas: 42, juan: 43, hechos: 44, romanos: 45,
  corintios1: 46, corintios2: 47, galatas: 48, efesios: 49,
  filipenses: 50, colosenses: 51, tesalonicenses1: 52,
  tesalonicenses2: 53, timoteo1: 54, timoteo2: 55, tito: 56,
  filemon: 57, hebreos: 58, santiago: 59, pedro1: 60, pedro2: 61,
  juan1: 62, juan2: 63, juan3: 64, judas: 65, apocalipsis: 66
}

// Nombre inglés en RVG (USFM) por libro; difiere del kjv2003 en algunos
const RVG_NAME = {
  mateo: 'Matthew', marcos: 'Mark', lucas: 'Luke', juan: 'John',
  hechos: 'Acts', romanos: 'Romans', corintios1: '1_Corinthians',
  corintios2: '2_Corinthians', galatas: 'Galatians', efesios: 'Ephesians',
  filipenses: 'Philippians', colosenses: 'Colossians',
  tesalonicenses1: '1_Thessalonians', tesalonicenses2: '2_Thessalonians',
  timoteo1: '1_Timothy', timoteo2: '2_Timothy', tito: 'Titus',
  filemon: 'Philemon', hebreos: 'Hebrews', santiago: 'James',
  pedro1: '1_Peter', pedro2: '2_Peter', juan1: '1_John', juan2: '2_John',
  juan3: '3_John', judas: 'Jude', apocalipsis: 'Revelation'
}

const libro = process.argv[2]
const ch = parseInt(process.argv[3] || '1', 10)
if (!libro || !BOOK_MAP[libro]) {
  console.error('Uso: node herram/parse-revision.mjs <libro> <capítulo>')
  console.error('Libros NT disponibles:', Object.keys(BOOK_MAP).filter(k => BOOK_MAP[k].kjv2003).join(', '))
  process.exit(1)
}

const kjvName = BOOK_MAP[libro].kjv2003
const gbfPath = path.join(BASE, `libros/${libro}.gbfxml`)
const kjvPath = path.join(BASE, `ref/sword_kjv/capitulos2003/${kjvName}-${String(ch).padStart(2, '0')}.osis.xml`)
const rvgChapPath = path.join(BASE, `ref/reina_valera_geiger_nt/capitulos/${RVG_NUM[libro]}_${RVG_NAME[libro]}-${String(ch).padStart(2, '0')}.usfm`)
const rvgFullPath = path.join(BASE, `ref/reina_valera_geiger_nt/${RVG_NUM[libro]}_${RVG_NAME[libro]}.usfm`)

function normalize(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim()
    .replace(/\s+([,.;:!?»])/g, '$1')
    .replace(/([«])\s+/g, '$1')
}

function childNodesArr(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}

// Texto de un nodo, omitiendo <rf>
function textOf(node) {
  const parts = []
  function walk(n) {
    if (n.nodeType === 3) { parts.push(n.nodeValue); return }
    if (n.nodeType !== 1) return
    if (n.tagName === 'rf') return
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(node)
  return parts.join('')
}

// Texto español: concatenar t/rb con xml:lang="es", omitiendo rf
function spanish(sv) {
  const parts = []
  function walk(n) {
    if (n.nodeType !== 1) return
    if (n.tagName === 'rf') return
    if ((n.tagName === 't' || n.tagName === 'rb') && n.getAttribute(XML_LANG) === 'es') {
      parts.push(textOf(n)); return
    }
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(sv)
  return normalize(parts.join(' '))
}

// Texto WEB: texto del <sv> omitiendo <t>, <rf> y <rb xml:lang="es">
function web(sv) {
  const parts = []
  function walk(n) {
    if (n.nodeType === 3) { parts.push(n.nodeValue); return }
    if (n.nodeType !== 1) return
    if (n.tagName === 'rf' || n.tagName === 't') return
    if (n.tagName === 'rb') {
      if (n.getAttribute(XML_LANG) === 'es') return
      // <rb> inglés: su texto (no t/rf)
      for (const c of childNodesArr(n)) {
        if (c.nodeType === 3) parts.push(c.nodeValue)
        else if (c.nodeType === 1 && c.tagName !== 't' && c.tagName !== 'rf') walk(c)
      }
      return
    }
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(sv)
  return normalize(parts.join(''))
}

// Strongs (n, posición) de un subárbol
function strongsFrom(node, out) {
  if (node.nodeType !== 1) return
  if (node.tagName === 'rf') return
  if (node.tagName === 'wi') {
    const value = node.getAttribute('value') || ''
    const m = value.match(/^[A-Za-z]*(\d+),(\d+),?/)
    if (m) out.push([parseInt(m[1], 10), parseInt(m[2], 10)])
  }
  for (const c of childNodesArr(node)) strongsFrom(c, out)
}

// Texto español por posición Strong: { posición: "texto" }
// (unión de <wi> y su continuación <wi type="GC"> cuando comparten posición)
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

// --- GBF (SpaTDP + WEB) ---
const gbf = {}
const doc = new DOMParser().parseFromString(fs.readFileSync(gbfPath, 'utf-8'), 'application/xml')
for (let i = 0; i < doc.getElementsByTagName('sv').length; i++) {
  const sv = doc.getElementsByTagName('sv')[i]
  const id = sv.getAttribute('id') || ''
  const m = id.match(/-(\d+)-(\d+)$/)
  if (!m || parseInt(m[1], 10) !== ch) continue
  const v = parseInt(m[2], 10)
  const strongs = []
  const words = {}
  for (const c of childNodesArr(sv)) { strongsFrom(c, strongs); spaWordsFrom(c, words) }
  gbf[v] = {
    web: web(sv),
    spa: spanish(sv),
    strongs: [...new Map(strongs.map(x => [x.join('-'), x])).values()].sort((a, b) => a[1] - b[1] || a[0] - b[0]),
    words
  }
}

// --- KJV2003 (OSIS) ---
const kjv = {}
let cur = null
for (const raw of fs.readFileSync(kjvPath, 'utf-8').split('\n')) {
  const line = raw.replace(/\r$/, '')
  const mm = line.match(new RegExp(`^\\$\\$\\$${kjvName} ${ch}:(\\d+)`))
  if (mm) { cur = parseInt(mm[1], 10); kjv[cur] = { text: [], strongs: [], verbs: [] }; continue }
  if (cur === null) continue
  // palabras <w ...> ... </w>
  const wRe = /<w\b([^>]*?)(?:\/>|>(.*?)<\/w>)/g
  let wm
  const lineStrongs = []
  const lineVerbs = []
  while ((wm = wRe.exec(line))) {
    const attrs = wm[1]
    const body = (wm[2] || '').replace(/<[^>]+>/g, '')
    const lemma = attrs.match(/lemma="([^"]*)"/)
    const src = attrs.match(/src="([^"]*)"/)
    const morph = attrs.match(/morph="robinson:([^"]*)"/)
    if (!lemma || !src) continue
    const gids = [...lemma[1].matchAll(/strong:G(\d+)/g)].map(x => x[1])
    const positions = src[1].split(/\s+/).filter(x => /^\d+$/.test(x)).map(Number)
    if (gids.length === positions.length) {
      for (let k = 0; k < gids.length; k++) lineStrongs.push([Number(gids[k]), positions[k]])
    } else if (gids.length === 1) {
      for (const p of positions) lineStrongs.push([Number(gids[0]), p])
    }
    if (morph && morph[1].startsWith('V-')) {
      lineVerbs.push({
        morph: morph[1],
        greek: (lemma[1].match(/lemma\.TR:([^"\s]+)/) || [])[1] || '',
        text: normalize(body),
        src: src[1].trim()
      })
    }
  }
  kjv[cur].strongs.push(...lineStrongs)
  kjv[cur].verbs.push(...lineVerbs)
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

// --- RVG2012 (USFM, por capítulo; si no existe, libro completo) ---
const rvg = {}
{
  // Usar archivo por capítulo si existe; si no, el libro completo (extraer el capítulo)
  const rvgRaw = fs.existsSync(rvgChapPath)
    ? fs.readFileSync(rvgChapPath, 'utf-8')
    : (fs.existsSync(rvgFullPath) ? fs.readFileSync(rvgFullPath, 'utf-8') : '')
  const lines = rvgRaw.split('\n')
  // Si es libro completo, recortar entre \c CH y \c CH+1
  const fullBook = !fs.existsSync(rvgChapPath)
  let inChapter = !fullBook
  let c = null
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    if (fullBook) {
      const cm = line.match(/^\\c\s+(\d+)/)
      if (cm) { inChapter = parseInt(cm[1], 10) === ch; continue }
      if (!inChapter) continue
    }
    const vm = line.match(/^\\v\s+(\d+)\s*(.*)$/)
    if (vm) { c = parseInt(vm[1], 10); rvg[c] = [vm[2]]; continue }
    if (c === null) continue
    if (line && !line.startsWith('\\c ') && !line.startsWith('\\cd ')) {
      rvg[c].push(line)
    }
  }
  for (const v of Object.keys(rvg)) {
    let t = rvg[v].join(' ')
    t = t.replace(/\\x\s*\+.*?\\x\*/g, '')            // referencias cruzadas \x + ... \x*
    t = t.replace(/\\w\s+([^|\\]+)\|[^\\]*\\w\*/g, '$1')
    t = t.replace(/\\(?:add|nd|wj|bd|it|sc|no)\s+(.*?)\\\1\*/g, '$1')
    t = t.replace(/\\p\s*/g, '')
    t = t.replace(/\\[a-z0-9]+\*?\s*/g, '')
    rvg[v] = normalize(t)
  }
}

// --- Concordancia Strong: missing/extra por versículo ---
for (const v of Object.keys(gbf)) {
  const gs = new Set(gbf[v].strongs.map(x => x.join(',')))
  const ks = new Set((kjv[v] || { strongs: [] }).strongs.map(x => x.join(',')))
  gbf[v].missing = [...ks].filter(x => !gs.has(x)).map(x => x.split(',').map(Number))
  gbf[v].extra = [...gs].filter(x => !ks.has(x)).map(x => x.split(',').map(Number))
}

console.log(JSON.stringify({ gbf, kjv, rvg }, null, 2))
