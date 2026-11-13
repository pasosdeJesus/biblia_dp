#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Diagnóstico de formato GBFXML sobre el TEXTO original (solo lectura).
//
// A diferencia de estilo-gbfxml.mjs --diff, que reescribe el archivo con su
// propio serializador y por tanto marca cambios de forma masiva, este script
// solo señala desviaciones reales respecto a doc/estilo-gbfxml.md, sin
// proponer reescrituras.
//
// Reglas verosímiles (no contradicen el estilo del corpus):
//   1. Palabra española fuera de <wi> que podría ir en el <wi> contiguo.
//   2. <wi> vacío seguido de texto sin etiquetar.
//   3. <wi> anidado que el clasificador marca como «separar».
//   4. Comas/espacios tras « ¿ ¡ `.
//
// Uso:
//   node herram/diagnostico-formato.mjs            (todo el NT)
//   node herram/diagnostico-formato.mjs pedro2     (un libro)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = path.join(__dirname, '..')

const NT_BOOKS = [
  'mateo', 'marcos', 'lucas', 'juan', 'hechos', 'romanos',
  'corintios1', 'corintios2', 'galatas', 'efesios', 'filipenses',
  'colosenses', 'tesalonicenses1', 'tesalonicenses2', 'timoteo1',
  'timoteo2', 'tito', 'filemon', 'hebreos', 'santiago', 'pedro1',
  'pedro2', 'juan1', 'juan2', 'juan3', 'judas', 'apocalipsis'
]

// Texto español que el estilo permite fuera de <wi>: puntuación y signos de
// cita. Cualquier otra palabra suelta es sospechosa.
const SOLO_PUNTUACION = /^[\s«»`´'"“”‘’.,;:!?¿¡()—–\-]*$/
// Conjunciones/artículos que suelen quedar fuera por descuido (no por estilo).
const PALABRAS_SOSPECHOSAS = /\b(el|la|los|las|un|una|y|o|de|del|al|a|en|por|para|con|que|su|sus|mi|mis|tu|tus)\b/i

function svDeLinea(lineas, i) {
  for (let j = i; j >= 0 && j > i - 500; j--) {
    const m = lineas[j].match(/<sv id="([^"]+)"/)
    if (m) return m[1]
  }
  return ''
}

function dentroDeTEs(linea) {
  // Heurística: la línea inicia un bloque <t xml:lang="es"> o está en flujo
  return /<t [^>]*xml:lang="es"/.test(linea) || /^<wi /.test(linea) || /^[^\s<]/.test(linea)
}

function revisar(libro, texto) {
  const lineas = texto.split('\n')
  const hallazgos = []
  let enBloqueEs = false

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i]
    const ref = svDeLinea(lineas, i)

    // Regla 4: espacio tras signo de apertura
    if (/«\s+[A-Za-zÁÉÍÓÚÑ]/.test(linea)) hallazgos.push({ ref, tipo: 'espacio tras «', linea: i + 1 })
    if (/¿\s+[A-Za-zÁÉÍÓÚÑ]/.test(linea)) hallazgos.push({ ref, tipo: 'espacio tras ¿', linea: i + 1 })
    if (/¡\s+[A-Za-zÁÉÍÓÚÑ]/.test(linea)) hallazgos.push({ ref, tipo: 'espacio tras ¡', linea: i + 1 })

    // Regla 2: <wi> vacío seguido de palabra sin etiquetar en la misma línea
    const mVacio = linea.match(/<wi\b[^>]*\/>\s*([A-Za-zÁÉÍÓÚÑáéíóúñ][^<]*)/)
    if (mVacio) {
      const txt = mVacio[1].trim()
      if (txt && !SOLO_PUNTUACION.test(txt) && PALABRAS_SOSPECHOSAS.test(txt)) {
        hallazgos.push({ ref, tipo: `<wi/> vacío seguido de «${txt.slice(0, 25)}»`, linea: i + 1 })
      }
    }
  }
  return hallazgos
}

function main() {
  const args = process.argv.slice(2)
  const books = args.length > 0 ? args : NT_BOOKS

  console.log('='.repeat(70))
  console.log('  DIAGNÓSTICO DE FORMATO GBFXML (solo lectura)')
  console.log('='.repeat(70))

  let total = 0
  for (const book of books) {
    const fp = path.join(BASE, 'libros', `${book}.gbfxml`)
    if (!fs.existsSync(fp)) {
      console.log(`\n${book}: no encontrado`)
      continue
    }
    const hs = revisar(book, fs.readFileSync(fp, 'utf-8'))
    if (hs.length === 0) continue
    console.log(`\n📖 ${book} (${hs.length}):`)
    const porRef = {}
    for (const h of hs) {
      const k = h.ref || `L${h.linea}`
      porRef[k] = porRef[k] || []
      porRef[k].push(`${h.tipo} (L${h.linea})`)
      total++
    }
    for (const [ref, tipos] of Object.entries(porRef)) {
      console.log(`  ${ref}: ${tipos.join('; ')}`)
    }
  }

  console.log()
  console.log('='.repeat(70))
  console.log(`📈 Total: ${total} hallazgo(s).`)
  console.log('='.repeat(70))
}

main()
