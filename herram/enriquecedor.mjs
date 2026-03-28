#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Fase 1: Agregar morfología y lema a los archivos GBF usando parser XML
// Formato value: Strong,Posición,Morfología,Lema

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { parseSpaTdp } from './lib/parsers/spatdp-parser.js'
import { extractMorphFromOsisVerse } from './lib/morphology.js'
import { BOOK_MAP, KJV2003_PATH_TEMPLATE } from './lib/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let idsLogged = false

// Variable para evitar logs repetidos de IDs let idsLogged = false
// Función auxiliar para buscar elemento por id (funciona sin DTD)
function getElementById(doc, id) {
  const allElements = doc.getElementsByTagName('*')
  if (!idsLogged) {
    idsLogged = true
    console.log('  [DEBUG] IDs encontrados en el documento:')
    let count = 0
    for (let i = 0; i < allElements.length && count < 10; i++) {
      const elId = allElements[i].getAttribute('id')
      if (elId) {
        console.log(`    ${elId}`)
        count++
      }
    }
  }
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i]
    if (el.getAttribute && el.getAttribute('id') === id) {
      return el
    }
  }
  return null
}


/**
 * Procesa un libro completo
 */
async function enrichBook(bookLower) {
  const bookInfo = BOOK_MAP[bookLower]
  if (!bookInfo) {
    console.log(`Libro desconocido: ${bookLower}`)
    return false
  }

  const spatdpPath = path.join(__dirname, '..', `${bookLower}.gbfxml`)
  if (!fs.existsSync(spatdpPath)) {
    console.log(`Archivo no encontrado: ${spatdpPath}`)
    return false
  }

  console.log(`\n📖 Procesando: ${bookInfo.display} (${bookLower}.gbfxml)`)

  // Leer archivo
  let content = fs.readFileSync(spatdpPath, 'utf-8')

  // Parsear XML
  let doc
  try {
    console.log(`  [DEBUG] Parseando XML...`)
    doc = new DOMParser().parseFromString(content, 'application/xml')
    console.log(`  [DEBUG] Documento parseado, root: ${doc.documentElement?.tagName}`)
  } catch (e) {
    console.error(`  ❌ Error parsing XML: ${e.message}`)
    return false
  }

  // Obtener datos de SpaTDP (strongs por versículo)
  const spatdpBookData = parseSpaTdp(spatdpPath)

  let totalUpdated = 0
  let modified = false

  // Procesar cada capítulo y versículo
  for (const [chapter, chapterData] of spatdpBookData) {
    const chapterPadded = String(chapter).padStart(2, '0')
    const kjvPath = KJV2003_PATH_TEMPLATE
      .replace('{book_kjv2003}', bookInfo.kjv2003)
      .replace('{chapter_padded}', chapterPadded)

    if (!fs.existsSync(kjvPath)) {
      console.log(`  ⚠️ Capítulo ${chapter}: no se encontró archivo KJV2003`)
      continue
    }

    for (const [verse, strongsSet] of chapterData.strongsData) {
      if (strongsSet.size === 0) continue

      // Extraer morfología y lema del OSIS
      const morphMap = extractMorphFromOsisVerse(kjvPath, verse, strongsSet)
      if (morphMap.size === 0) continue

      // El ID en el XML usa primera letra mayúscula (ej: Filemon-1-1)
      const bookId = bookLower.charAt(0).toUpperCase() + bookLower.slice(1)
      const svId = `${bookId}-${chapter}-${verse}`

      const svElement = getElementById(doc, svId)
      if (!svElement) {
        console.log(`  ⚠️ No se encontró elemento sv con id="${svId}"`)
        continue
      }

      // Recorrer todos los wi tags dentro del sv (incluyendo anidados)
      const wiElements = Array.from(svElement.getElementsByTagName('wi'))
      let verseUpdated = 0

      for (const wi of wiElements) {
        const type = wi.getAttribute('type')
        if (type !== 'G') continue

        const value = wi.getAttribute('value')
        if (!value) continue

        // Parsear value: "strong,pos,..."
        const parts = value.split(',')
        const strong = parts[0]
        const pos = parts[1]

        if (!strong || !pos) continue

        const strongPos = `G${strong}-${pos}`
        const morphData = morphMap.get(strongPos)

        if (morphData && morphData.morph && morphData.lemma) {
          // Verificar si ya tiene morfología y lema
          const hasMorph = parts.length >= 3 && parts[2] && parts[2].trim()
          const hasLemma = parts.length >= 4 && parts[3] && parts[3].trim()

          if (!hasMorph || !hasLemma) {
            const newValue = `${strong},${pos},${morphData.morph},${morphData.lemma}`
            wi.setAttribute('value', newValue)
            verseUpdated++
            modified = true
          }
        }
      }

      if (verseUpdated > 0) {
        console.log(`    ✅ ${chapter}:${verse} - ${verseUpdated} palabras actualizadas`)
        totalUpdated += verseUpdated
      }
    }
  }

  if (modified) {
    // Crear backup
    const backupPath = `${spatdpPath}.bak`
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(spatdpPath, backupPath)
      console.log(`  📦 Backup creado: ${bookLower}.gbfxml.bak`)
    }

    // Serializar y guardar
    const serializer = new XMLSerializer()
    const newContent = serializer.serializeToString(doc)

    // Restaurar el encabezado XML si es necesario
    const finalContent = newContent.replace(/^<\?xml[^?]*\?>/, '<?xml version="1.0" encoding="UTF-8"?>\n')

    fs.writeFileSync(spatdpPath, finalContent, 'utf-8')
    console.log(`  💾 Guardado: ${bookLower}.gbfxml (${totalUpdated} palabras actualizadas)`)
    return true
  } else {
    console.log(`  ℹ️ No se encontraron palabras para enriquecer`)
    return false
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const booksToProcess = args.filter(arg => !arg.startsWith('--'))

  const targetBooks = booksToProcess.length > 0 ? booksToProcess : Object.keys(BOOK_MAP)

  console.log('='.repeat(60))
  console.log('  ENRIQUECEDOR DE MORFOLOGÍA - FASE 1 (con parser XML)')
  console.log('  Agrega morfología (Robinson) y lema a los archivos GBF')
  console.log('  Formato: Strong,Posición,Morfología,Lema')
  if (dryRun) console.log('  🧪 Modo DRY RUN: no se guardarán cambios')
  console.log('='.repeat(60))

  let processed = 0
  let enriched = 0

  for (const book of targetBooks) {
    if (dryRun) {
      console.log(`\n🧪 DRY RUN: ${book}`)
      // Simular sin guardar
      const bookInfo = BOOK_MAP[book]
      console.log(`  ℹ️ Simulación: se procesarían ${book}.gbfxml`)
      processed++
      continue
    }

    const result = await enrichBook(book)
    processed++
    if (result) enriched++
  }

  console.log('\n' + '='.repeat(60))
  console.log(`  RESUMEN: ${enriched} de ${processed} libros enriquecidos`)
  console.log('='.repeat(60))
}

main().catch(console.error)
