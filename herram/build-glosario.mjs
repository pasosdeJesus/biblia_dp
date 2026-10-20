#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Construye un glosario Strong → { traducción: frecuencia } desde los
// <wi type="G" value="NNN,pos,">texto</wi> de libros/*.gbfxml.
//
// Uso:
//   node herram/build-glosario.mjs > /tmp/glosario.json
//   node herram/build-glosario.mjs mateo > /tmp/glosario-mateo.json

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = path.join(__dirname, '..')
const LIBROS_DIR = path.join(BASE, 'libros')

// Meta-archivos que no son libros bíblicos
const META = new Set([
  'biblia_dp.gbfxml', 'libro_dp.gbfxml', 'biblio.gbfxml',
  'derechos.gbfxml', 'intro-evangelios.gbfxml', 'intro-nuevotestamento.gbfxml'
])

function childNodesArr(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}

// Texto de un nodo omitiendo <rf>
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

const glosario = {}
const files = process.argv[2]
  ? [process.argv[2] + '.gbfxml']
  : fs.readdirSync(LIBROS_DIR).filter(f => f.endsWith('.gbfxml') && !META.has(f))

let totalWi = 0
for (const f of files) {
  const fp = path.join(LIBROS_DIR, f)
  if (!fs.existsSync(fp)) { console.error(`No existe ${fp}`); process.exit(1) }
  const doc = new DOMParser().parseFromString(fs.readFileSync(fp, 'utf-8'), 'application/xml')
  const wis = doc.getElementsByTagName('wi')
  for (let i = 0; i < wis.length; i++) {
    const wi = wis[i]
    if (wi.getAttribute('type') !== 'G') continue
    const value = wi.getAttribute('value') || ''
    const m = value.match(/^(\d+),(\d+),?/)
    if (!m) continue
    const strong = m[1]
    const txt = textOf(wi).replace(/\s+/g, ' ').trim()
    if (!txt) continue
    totalWi++
    if (!glosario[strong]) glosario[strong] = {}
    glosario[strong][txt] = (glosario[strong][txt] || 0) + 1
  }
}

// Ordenar traducciones por frecuencia descendente
const salida = {}
for (const strong of Object.keys(glosario).sort((a, b) => a - b)) {
  const entradas = Object.entries(glosario[strong]).sort((a, b) => b[1] - a[1])
  salida[strong] = Object.fromEntries(entradas)
}

console.error(`Glosario: ${Object.keys(salida).length} Strong, ${totalWi} <wi> procesados`)
console.log(JSON.stringify(salida, null, 2))
