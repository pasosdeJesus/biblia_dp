#!/usr/bin/env node
// -*- coding: utf-8 -*-

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { translateCode } from './lib/morphology.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Función de normalización (misma que en extractor)
function normalizeMorph(morph) {
  if (morph === 'T-PAP-NPM') {
    return 'T-NPM'
  }
  // Pueden agregarse más normalizaciones aquí
  return morph
}

async function extractAndSaveMorphologyCodes() {
  const directoryPath = path.join(__dirname, '..', 'ref/sword_kjv/capitulos2003/')
  const outputPath = path.join(__dirname, '..', 'gen/resumen_morfologia.json')
  console.log(`Buscando en: ${directoryPath}`)

  const codeCounts = {}
  const morphRegex = /robinson:"?([^"\s>]+)"?/g

  const ntBooksIdentifier = [
    'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal',
    'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm',
    'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'
  ]

  try {
    const files = await fs.promises.readdir(directoryPath)
    const ntFiles = files.filter(file => 
      ntBooksIdentifier.some(bookId => file.startsWith(bookId)) && 
      file.endsWith('.osis.xml')
    )

    console.log(`Procesando ${ntFiles.length} archivos...`)
    
    for (const file of ntFiles) {
      const filePath = path.join(directoryPath, file)
      const content = await fs.promises.readFile(filePath, 'utf-8')
      let match
      while ((match = morphRegex.exec(content)) !== null) {
        let code = match[1]
        // Normalizar códigos mal formados
        code = normalizeMorph(code)
        codeCounts[code] = (codeCounts[code] || 0) + 1
      }
    }

    // Consolidar PRT_N en PRT-N
    if (codeCounts['PRT_N']) {
      codeCounts['PRT-N'] = (codeCounts['PRT-N'] || 0) + codeCounts['PRT_N']
      delete codeCounts['PRT_N']
    }

    const sortedCodes = Object.keys(codeCounts).sort()
    const translatedSummary = {}
    for (const code of sortedCodes) {
      const { en_full_name, es_full_name } = translateCode(code)
      translatedSummary[code] = {
        count: codeCounts[code],
        en_full_name,
        es_full_name,
      }
    }

    await fs.promises.writeFile(outputPath, JSON.stringify(translatedSummary, null, 4))
    console.log(`\nResumen guardado en: ${outputPath}`)
    console.log(`Total de códigos únicos: ${sortedCodes.length}`)

  } catch (err) {
    console.error('Error:', err)
  }
}

extractAndSaveMorphologyCodes()
