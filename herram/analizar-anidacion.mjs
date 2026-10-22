#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Analiza la anidación de <wi> en archivos GBF, listando los versículos
// que contienen <wi> anidados (un <wi> dentro de otro <wi>).
//
// Uso:
//   node herram/analizar-anidacion.mjs           (todo el NT)
//   node herram/analizar-anidacion.mjs mateo     (un libro)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NT_BOOKS = [
  'mateo', 'marcos', 'lucas', 'juan', 'hechos', 'romanos',
  'corintios1', 'corintios2', 'galatas', 'efesios', 'filipenses',
  'colosenses', 'tesalonicenses1', 'tesalonicenses2', 'timoteo1',
  'timoteo2', 'tito', 'filemon', 'hebreos', 'santiago', 'pedro1',
  'pedro2', 'juan1', 'juan2', 'juan3', 'judas', 'apocalipsis'
]

function childNodesArr(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}

/**
 * Encuentra <wi> anidados en un <sv>: pares { outer, inner } donde un <wi>
 * contiene directamente a otro <wi>.
 */
function findNestedWi(sv) {
  const nested = []
  function walk(n) {
    if (n.nodeType !== 1) return
    if (n.tagName === 'wi') {
      const value = n.getAttribute('value') || ''
      for (const c of childNodesArr(n)) {
        if (c.nodeType === 1 && c.tagName === 'wi') {
          nested.push({ outer: value, inner: c.getAttribute('value') || '' })
        }
      }
    }
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(sv)
  return nested
}

function analyzeFile(filepath, bookName) {
  if (!fs.existsSync(filepath)) return null
  const content = fs.readFileSync(filepath, 'utf-8')
  let doc
  try {
    doc = new DOMParser().parseFromString(content, 'application/xml')
  } catch (e) {
    console.error(`  Error parseando ${filepath}: ${e.message}`)
    return null
  }

  const verses = []
  const svElements = doc.getElementsByTagName('sv')
  for (let i = 0; i < svElements.length; i++) {
    const sv = svElements[i]
    const nested = findNestedWi(sv)
    if (nested.length > 0) {
      verses.push({ id: sv.getAttribute('id') || '', nested })
    }
  }
  return { book: bookName, verses }
}

function main() {
  const args = process.argv.slice(2)
  const books = args.length > 0 ? args : NT_BOOKS

  console.log('='.repeat(70))
  console.log('  ANÁLISIS DE ANIDACIÓN DE <wi> POR VERSÍCULO')
  console.log('='.repeat(70))

  let totalVerses = 0
  let totalNested = 0

  for (const book of books) {
    const filepath = path.join(__dirname, '..', 'libros', `${book}.gbfxml`)
    const result = analyzeFile(filepath, book)
    if (!result) {
      console.log(`\n${book}: archivo no encontrado o inválido`)
      continue
    }

    if (result.verses.length === 0) continue

    console.log(`\n📖 ${book} (${result.verses.length} versículo(s)):`)
    for (const v of result.verses) {
      console.log(`  ${v.id}:`)
      for (const n of v.nested) {
        console.log(`    <wi value="${n.outer}"> contiene <wi value="${n.inner}">`)
        totalNested++
      }
      totalVerses++
    }
  }

  console.log()
  console.log('='.repeat(70))
  if (totalVerses === 0) {
    console.log('✅ No se encontraron <wi> anidados.')
  } else {
    console.log(`📈 Total: ${totalVerses} versículo(s) con ${totalNested} <wi> anidado(s).`)
  }
  console.log('='.repeat(70))
}

main()
