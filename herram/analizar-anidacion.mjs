#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Analiza la profundidad máxima de anidación de <wi> en archivos GBF

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NT_BOOKS = [
  'mateo', 'marcos', 'lucas', 'juan', 'hechos', 'romanos',
  'corintios1', 'corintios2', 'galatas', 'efesios', 'filipenses',
  'colosenses', 'tesalonicenses1', 'tesalonicenses2', 'timoteo1',
  'timoteo2', 'tito', 'filemon', 'hebreos', 'santiago', 'pedro1',
  'pedro2', 'juan1', 'juan2', 'juan3', 'judas', 'apocalipsis'
]

/**
 * Calcula la profundidad máxima de anidación de <wi> dentro de cada versículo
 */
function findMaxWiNestingDepth(content) {
  let maxDepthOverall = 0
  let currentDepth = 0
  
  // Dividir por versículos (etiquetas <sv)
  const svBlocks = content.match(/<sv id="[^"]+"[^>]*>[\s\S]*?<\/sv>/g) || []
  
  for (const block of svBlocks) {
    let depth = 0
    let maxInVerse = 0
    let i = 0
    const len = block.length
    
    while (i < len) {
      // Buscar apertura <wi
      if (block[i] === '<' && block[i+1] === 'w' && block[i+2] === 'i') {
        // Verificar que no es cierre
        if (block[i+3] !== '/') {
          depth++
          if (depth > maxInVerse) maxInVerse = depth
          i += 3
          continue
        }
      }
      
      // Buscar cierre </wi>
      if (block[i] === '<' && block[i+1] === '/' && block[i+2] === 'w' && block[i+3] === 'i' && block[i+4] === '>') {
        depth--
        i += 5
        continue
      }
      
      i++
    }
    
    if (maxInVerse > maxDepthOverall) {
      maxDepthOverall = maxInVerse
    }
  }
  
  return maxDepthOverall
}

/**
 * Analiza un archivo
 */
function analyzeFile(filepath, bookName) {
  if (!fs.existsSync(filepath)) {
    return null
  }
  
  const content = fs.readFileSync(filepath, 'utf-8')
  const maxDepth = findMaxWiNestingDepth(content)
  
  // Contar tags totales
  const wiCount = (content.match(/<wi/g) || []).length
  const closeWiCount = (content.match(/<\/wi>/g) || []).length
  
  return { book: bookName, maxDepth, wiCount, closeWiCount }
}

function main() {
  console.log('='.repeat(60))
  console.log('  ANÁLISIS DE ANIDACIÓN DE <wi> POR VERSÍCULO')
  console.log('='.repeat(60))
  console.log()
  
  const results = []
  let maxOverall = 0
  let maxBook = ''
  
  for (const book of NT_BOOKS) {
    const filepath = path.join(__dirname, '..', `${book}.gbfxml`)
    const result = analyzeFile(filepath, book)
    if (result) {
      results.push(result)
      if (result.maxDepth > maxOverall) {
        maxOverall = result.maxDepth
        maxBook = book
      }
    }
  }
  
  console.log('📊 RESULTADOS:\n')
  console.log('  Libro'.padEnd(20) + 'Profundidad'.padEnd(15) + 'Tags <wi>'.padEnd(12) + 'Cierre')
  console.log('  ' + '-'.repeat(60))
  
  for (const r of results) {
    const depthMarker = r.maxDepth > 0 ? '█'.repeat(Math.min(r.maxDepth, 10)) + ' ' + r.maxDepth : '0'
    console.log(`  ${r.book.padEnd(20)} ${depthMarker.padEnd(15)} ${r.wiCount.toString().padEnd(12)} ${r.closeWiCount}`)
  }
  
  console.log()
  console.log('='.repeat(60))
  console.log(`📈 PROFUNDIDAD MÁXIMA EN TODO EL NT: ${maxOverall} (en ${maxBook})`)
  console.log('='.repeat(60))
}

main()
