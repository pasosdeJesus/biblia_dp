#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Analiza la anidación de <wi> en archivos GBF, listando los versículos
// que contienen <wi> anidados (un <wi> dentro de otro <wi>) y los clasifica:
//   ✓ Fusión correcta: una palabra en español corresponde a dos en griego
//     (contracción «al»/«del» o pronombre enclítico «recordarles»).
//   ⚠ Separar: el texto tiene varias palabras, cada una corresponde a un
//     Strong distinto; deben ser <wi> independientes.
//   🔗 Locución fija: expresión idiomática (doble negación, «a menos que»,
//     «por qué», «quienquiera»); no se separa.
//   🔍 Especial: artículo G3588, reflexivo G1438, arameo, doble pronombre o
//     numeral; requiere revisión manual.
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

// Locuciones fijas (pares Strong externo→interno) que NO deben separarse:
// expresiones idiomáticas cuya división por Strong sería artificial.
// Formato: "externo,interno". Ej.: G1437(ἐάν)+G3361(μή) = «a menos que».
const LOCUCIONES = new Set([
  '3756,3361', // οὐ μή → «de ninguna manera»
  '3761,3756', // οὐδέ οὐ → «y como nunca»
  '3765,3756', // οὐκέτι οὐ → «no volveré»
  '1437,3361', // ἐὰν μή → «a menos que»
  '1487,3361', // εἰ μή → «si no»
  '1487,1161', // εἰ δέ → «o de lo contrario»
  '3361,1096', // μὴ γένοιτο → «De ninguna manera»
  '3739,302',  // ὃς ἄν → «quienquiera»
  '5100,302',  // τις ἄν → «lo que sea que»
  '3745,302',  // ὅσος ἄν → «todo el que»
  '2443,2444', // ἵνα τί → «¿por qué?»
  '1223,5101', // διὰ τί → «¿por qué?»
  '1722,5101', // ἐν τί → «¿con qué?»
  '2193,4219', // ἕως πότε → «¿cuánto tiempo?»
  '2443,3361', // ἵνα μή → «para que no»
  '1893,3756', // ἐπεὶ οὐ → «o de lo contrario»
  '1161,3361', // δέ μή → «así es»
  '1161,3123', // δέ μᾶλλον → «en cambio»
  '2532,2532', // καὶ καὶ → «junto con»
  '1161,2532', // δέ καὶ → «y así»
  '3676,3305', // ὅμως μέντοι → «sin embargo»
  '3779,2532', // οὕτως καὶ → «así mismo»
  '3379,2443', // μήποτε ἵνα → «no sea que»
  '2532,3668', // καὶ ὁμοίως → «así como»
  '3754,2530', // ὅτι καθότι → «por cuanto»
  '2193,737',  // ἕως ἄρτι → «así que»
  '3767,3739', // οὖν ὅς → «lo que»
  '3754,3778', // ὅτι οὗτος → «este hombre»
  '2596,3778', // κατά οὗτος → «así mismo»
])

function childNodesArr(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}

// Texto completo de un nodo (concatenando nodos de texto descendientes).
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

/**
 * Clasifica un <wi> anidado (externo → interno).
 * Devuelve: 'fusion' | 'separar' | 'locucion' | 'especial'.
 */
function classify(outerStrong, innerStrong, fullText) {
  const singleWord = !/\s/.test(fullText)

  // 1. Fusión correcta: una sola palabra = dos Strong (y no es artículo externo).
  if (singleWord && outerStrong !== 3588) return 'fusion'

  // 2. Especial: requiere revisión manual.
  if (outerStrong === 3588) return 'especial' // artículo envuelve (convención antigua)
  if (innerStrong === 3588) return 'especial' // artículo envuelto multi-palabra
  if (outerStrong === 1438 || innerStrong === 1438) return 'especial' // reflexivo ἑαυτόν
  if (outerStrong === 3134 || innerStrong === 3134) return 'especial' // arameo μαραναθα
  if (outerStrong === 846 && innerStrong === 846) return 'especial'   // doble pronombre
  if (outerStrong === 1440 && innerStrong === 1803) return 'especial' // numeral «setenta y seis»

  // 3. Locución fija: expresión idiomática, no separar.
  if (LOCUCIONES.has(`${outerStrong},${innerStrong}`)) return 'locucion'

  // 4. Separar: cada palabra española corresponde a un Strong.
  return 'separar'
}

/**
 * Encuentra <wi> anidados en un <sv>: pares { outer, inner, text, category }.
 */
function findNestedWi(sv) {
  const nested = []
  function walk(n) {
    if (n.nodeType !== 1) return
    if (n.tagName === 'wi') {
      const value = n.getAttribute('value') || ''
      const outerStrong = parseInt((value.match(/^[A-Za-z]*(\d+),/) || [])[1] || '0', 10)
      for (const c of childNodesArr(n)) {
        if (c.nodeType === 1 && c.tagName === 'wi') {
          const innerValue = c.getAttribute('value') || ''
          const innerStrong = parseInt((innerValue.match(/^[A-Za-z]*(\d+),/) || [])[1] || '0', 10)
          const fullText = textOf(n).trim()
          nested.push({
            outer: value,
            inner: innerValue,
            text: fullText,
            category: classify(outerStrong, innerStrong, fullText)
          })
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

const ETIQUETAS = {
  fusion: '✓ fusión',
  separar: '⚠ separar',
  locucion: '🔗 locución fija',
  especial: '🔍 especial'
}

function main() {
  const args = process.argv.slice(2)
  const books = args.length > 0 ? args : NT_BOOKS

  console.log('='.repeat(70))
  console.log('  ANÁLISIS DE ANIDACIÓN DE <wi> POR VERSÍCULO')
  console.log('='.repeat(70))

  let totalVerses = 0
  const totales = { fusion: 0, separar: 0, locucion: 0, especial: 0 }

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
        console.log(`    ${ETIQUETAS[n.category]} <wi value="${n.outer}"> contiene <wi value="${n.inner}">  [«${n.text}»]`)
        totales[n.category]++
      }
      totalVerses++
    }
  }

  console.log()
  console.log('='.repeat(70))
  if (totalVerses === 0) {
    console.log('✅ No se encontraron <wi> anidados.')
  } else {
    const totalAnidados = totales.fusion + totales.separar + totales.locucion + totales.especial
    console.log(`📈 Total: ${totalVerses} versículo(s) con ${totalAnidados} <wi> anidado(s).`)
    console.log(`   ✓ Fusión correcta (una palabra = dos Strong): ${totales.fusion}`)
    console.log(`   ⚠ A separar: ${totales.separar}`)
    console.log(`   🔗 Locución fija (no separar): ${totales.locucion}`)
    console.log(`   🔍 Especial (revisar manual): ${totales.especial}`)
  }
  console.log('='.repeat(70))
}

main()
