// -*- coding: utf-8 -*-
// Módulo unificado de morfología
// Basado en https://studybible.info/mac

import fs from 'fs'

// ============================================================
// DICCIONARIO DE TRADUCCIÓN
// ============================================================

const exactMatch = {
  'ARAM': { en: 'Aramaic Word', es: 'Palabra Aramea' },
  'HEB': { en: 'Hebrew Word', es: 'Palabra Hebrea' },
  'COND': { en: 'Conditional Particle', es: 'Partícula Condicional' },
  'CONJ': { en: 'Conjunction', es: 'Conjunción' },
  'INJ': { en: 'Interjection', es: 'Interjección' },
  'PREP': { en: 'Preposition', es: 'Preposición' },
  'PRT': { en: 'Particle', es: 'Partícula' },
  'ADV': { en: 'Adverb', es: 'Adverbio' },
  'ADV-C': { en: 'Adverb, contracted form', es: 'Adverbio, forma contraída' },
  'ADV-S': { en: 'Adverb, superlative', es: 'Adverbio, superlativo' },
  'ADV-I': { en: 'Adverb, interrogative', es: 'Adverbio, interrogativo' },
  'COND-C': { en: 'Conditional Particle, contracted form', es: 'Partícula Condicional, forma contraída' },
  'PRT-I': { en: 'Interrogative Particle', es: 'Partícula Interrogativa' },
  'PRT-N': { en: 'Negative Particle', es: 'Partícula Negativa' },
}

const partOfSpeech = {
  'A': { en: 'Adjective', es: 'Adjetivo' },
  'C': { en: 'Conjunction', es: 'Conjunción' },
  'D': { en: 'Adverb', es: 'Adverbio' },
  'F': { en: 'Reflexive Pronoun', es: 'Pronombre Reflexivo' },
  'I': { en: 'Interrogative Pronoun', es: 'Pronombre Interrogativo' },
  'K': { en: 'Correlative Pronoun', es: 'Pronombre Correlativo' },
  'N': { en: 'Noun', es: 'Sustantivo' },
  'P': { en: 'Personal Pronoun', es: 'Pronombre Personal' },
  'Q': { en: 'Correlative or Interrogative Pronoun', es: 'Pronombre Correlativo o Interrogativo' },
  'R': { en: 'Relative Pronoun', es: 'Pronombre Relativo' },
  'S': { en: 'Possessive Pronoun', es: 'Pronombre Posesivo' },
  'T': { en: 'Article', es: 'Artículo' },
  'V': { en: 'Verb', es: 'Verbo' },
  'X': { en: 'Indeclinable Particle', es: 'Partícula Indeclinable' }
}

const person = {
  '1': { en: '1st Person', es: '1ra Persona' },
  '2': { en: '2nd Person', es: '2da Persona' },
  '3': { en: '3rd Person', es: '3ra Persona' }
}

const tense = {
  'P': { en: 'Present', es: 'Presente' },
  'I': { en: 'Imperfect', es: 'Imperfecto' },
  'F': { en: 'Future', es: 'Futuro' },
  'A': { en: 'Aorist', es: 'Aoristo' },
  '2A': { en: '2nd Aorist', es: '2do Aoristo' },
  'R': { en: 'Perfect', es: 'Perfecto' },
  '2R': { en: '2nd Perfect', es: '2do Perfecto' },
  'L': { en: 'Pluperfect', es: 'Pluscuamperfecto' },
  '2L': { en: '2nd Pluperfect', es: '2do Pluscuamperfecto' },
  '2F': { en: '2nd Future', es: '2do Futuro' },
  'X': { en: 'No Tense', es: 'Sin Tiempo' }
}

const voice = {
  'A': { en: 'Active', es: 'Activo' },
  'M': { en: 'Middle', es: 'Medio' },
  'P': { en: 'Passive', es: 'Pasivo' },
  'D': { en: 'Middle or Passive Deponent', es: 'Medio o Pasivo Deponente' },
  'E': { en: 'Middle Deponent', es: 'Medio Deponente' },
  'O': { en: 'Passive Deponent', es: 'Pasivo Deponente' },
  'N': { en: 'Middle or Passive', es: 'Medio o Pasivo' },
  'Q': { en: 'No Voice', es: 'Sin Voz' },
  'X': { en: 'No Voice', es: 'Sin Voz' }
}

const mood = {
  'I': { en: 'Indicative', es: 'Indicativo' },
  'S': { en: 'Subjunctive', es: 'Subjuntivo' },
  'O': { en: 'Optative', es: 'Optativo' },
  'M': { en: 'Imperative', es: 'Imperativo' },
  'N': { en: 'Infinitive', es: 'Infinitivo' },
  'P': { en: 'Participle', es: 'Participio' }
}

const caseGram = {
  'N': { en: 'Nominative', es: 'Nominativo' },
  'V': { en: 'Vocative', es: 'Vocativo' },
  'G': { en: 'Genitive', es: 'Genitivo' },
  'D': { en: 'Dative', es: 'Dativo' },
  'A': { en: 'Accusative', es: 'Acusativo' }
}

const number = {
  'S': { en: 'Singular', es: 'Singular' },
  'P': { en: 'Plural', es: 'Plural' }
}

const gender = {
  'M': { en: 'Masculine', es: 'Masculino' },
  'F': { en: 'Feminine', es: 'Femenino' },
  'N': { en: 'Neuter', es: 'Neutro' }
}

const special = {
  'A': { en: 'Aeolic dialect', es: 'dialecto Eólico' },
  'ABB': { en: 'Abbreviated', es: 'Abreviado' },
  'AP': { en: 'Apocopated', es: 'Apocopado' },
  'ATT': { en: 'Attic', es: 'Ático' },
  'C': { en: 'Comparative', es: 'Comparativo' },
  'I': { en: 'Interrogative', es: 'Interrogativo' },
  'IRR': { en: 'Irregular', es: 'Irregular' },
  'LI': { en: 'Indeclinable', es: 'Indeclinable' },
  'NUI': { en: 'Indeclinable Numeral', es: 'Numeral Indeclinable' },
  'OI': { en: 'Indeclinable', es: 'Indeclinable' },
  'P': { en: 'with Emphasis', es: 'con Énfasis' },
  'PRI': { en: 'Proper Name', es: 'Nombre Propio' },
  'S': { en: 'Superlative', es: 'Superlativo' }
}

// ============================================================
// FUNCIÓN DE TRADUCCIÓN
// ============================================================

/**
 * Traduce un código morfológico Robinson a español e inglés
 * @param {string} code - Código como "V-AAI-1S"
 * @returns {Object} { en_full_name, es_full_name }
 */
export function translateCode(code) {
  const normalizedCode = code.replace('_', '-')

  if (exactMatch[normalizedCode]) {
    return {
      en_full_name: exactMatch[normalizedCode].en,
      es_full_name: exactMatch[normalizedCode].es
    }
  }

  const parts = normalizedCode.split('-')
  let restOfDeclension = ''
  const translations = { en: [], es: [] }
  const pos = parts[0]
  const posInfo = partOfSpeech[pos]

  if (!posInfo) {
    return {
      en_full_name: `Unknown Code: ${code}`,
      es_full_name: `Código Desconocido: ${code}`
    }
  }

  translations.en.push(posInfo.en)
  translations.es.push(posInfo.es)

  const mainParts = parts.slice(1)
  let specialSuffix = null

  if (mainParts.length > 0 && special[mainParts[mainParts.length - 1]]) {
    specialSuffix = mainParts.pop()
  }

  let declensionStr = mainParts.join('')

  if (pos === 'V') {
    const tensePartMatch = declensionStr.match(/^(2A|2R|2L|2F|P|I|F|A|R|L|X)/)
    const tensePart = tensePartMatch ? tensePartMatch[0] : ''
    let rest = declensionStr.substring(tensePart.length)

    const voiceChar = rest[0] || ''
    const moodChar = rest[1] || ''
    rest = rest.substring(2)

    const tenseDesc = tense[tensePart] ? `${tense[tensePart].en} ${voice[voiceChar]?.en || ''} ${mood[moodChar]?.en || ''}` : ''
    const tenseDescEs = tense[tensePart] ? `${tense[tensePart].es} ${voice[voiceChar]?.es || ''} ${mood[moodChar]?.es || ''}` : ''
    translations.en.push(tenseDesc.trim().replace(/\s+/g, ' '))
    translations.es.push(tenseDescEs.trim().replace(/\s+/g, ' '))

    if (moodChar === 'P') {
      const caseVal = rest[0] || ''
      const num = rest[1] || ''
      const gen = rest[2] || ''
      rest = rest.substring(3)
      translations.en.push(`${caseGram[caseVal]?.en || ''} ${number[num]?.en || ''} ${gender[gen]?.en || ''}`.trim().replace(/\s+/g, ' '))
      translations.es.push(`${caseGram[caseVal]?.es || ''} ${number[num]?.es || ''} ${gender[gen]?.es || ''}`.trim().replace(/\s+/g, ' '))
    } else if (moodChar !== 'N') {
      const personChar = rest[0] || ''
      const num = rest[1] || ''
      rest = rest.substring(2)
      translations.en.push(`${person[personChar]?.en || ''} ${number[num]?.en || ''}`.trim().replace(/\s+/g, ' '))
      translations.es.push(`${person[personChar]?.es || ''} ${number[num]?.es || ''}`.trim().replace(/\s+/g, ' '))
    }
    restOfDeclension = rest

  } else if (pos === 'P') {
    const personChar = declensionStr[0] || ''
    if (person[personChar]) {
      const p = personChar
      const caseVal = declensionStr[1] || ''
      const num = declensionStr[2] || ''
      const gen = (p === '3' && declensionStr.length > 3) ? declensionStr[3] : null

      let personEn = person[p]?.en || ''
      let personEs = person[p]?.es || ''

      let consumed = 3
      if (gen && gender[gen]) {
        personEn = `${personEn} ${gender[gen].en}`
        personEs = `${personEs} ${gender[gen].es}`
        consumed = 4
      }

      translations.en.push(`${personEn} ${caseGram[caseVal]?.en || ''} ${number[num]?.en || ''}`.trim().replace(/\s+/g, ' '))
      translations.es.push(`${personEs} ${caseGram[caseVal]?.es || ''} ${number[num]?.es || ''}`.trim().replace(/\s+/g, ' '))
      restOfDeclension = declensionStr.substring(consumed)
    } else {
      const caseVal = declensionStr[0] || ''
      const num = declensionStr[1] || ''
      const gen = declensionStr[2] || ''
      translations.en.push(`3rd Person ${caseGram[caseVal]?.en || ''} ${number[num]?.en || ''} ${gender[gen]?.en || ''}`.trim().replace(/\s+/g, ' '))
      translations.es.push(`3ra Persona ${caseGram[caseVal]?.es || ''} ${number[num]?.es || ''} ${gender[gen]?.es || ''}`.trim().replace(/\s+/g, ' '))
      restOfDeclension = declensionStr.substring(3)
    }

  } else if (['F', 'S'].includes(pos)) {
    const p = declensionStr[0] || ''
    const caseVal = declensionStr[1] || ''
    const num = declensionStr[2] || ''
    const gen = declensionStr[3] || ''
    translations.en.push(`${person[p]?.en || ''} ${caseGram[caseVal]?.en || ''} ${number[num]?.en || ''} ${gender[gen]?.en || ''}`.trim().replace(/\s+/g, ' '))
    translations.es.push(`${person[p]?.es || ''} ${caseGram[caseVal]?.es || ''} ${number[num]?.es || ''} ${gender[gen]?.es || ''}`.trim().replace(/\s+/g, ' '))
    restOfDeclension = declensionStr.substring(4)

  } else if (declensionStr) {
    const caseVal = declensionStr[0] || ''
    const num = declensionStr[1] || ''
    const gen = declensionStr[2] || ''
    translations.en.push(`${caseGram[caseVal]?.en || ''} ${number[num]?.en || ''} ${gender[gen]?.en || ''}`.trim().replace(/\s+/g, ' '))
    translations.es.push(`${caseGram[caseVal]?.es || ''} ${number[num]?.es || ''} ${gender[gen]?.es || ''}`.trim().replace(/\s+/g, ' '))
    restOfDeclension = declensionStr.substring(3)
  }

  if (specialSuffix) {
    translations.en.push(special[specialSuffix].en)
    translations.es.push(special[specialSuffix].es)
  }

  if (restOfDeclension) {
    translations.en.push(`(Unrecognized suffix: ${restOfDeclension}?)`)
    translations.es.push(`(Sufijo no reconocido: ${restOfDeclension}?)`)
  }

  return {
    en_full_name: translations.en.filter(p => p).join(' - '),
    es_full_name: translations.es.filter(p => p).join(' - ')
  }
}

// ============================================================
// EXTRACTOR DE DATOS DEL OSIS
// ============================================================

/**
 * Extrae información morfológica de un archivo OSIS
 * @param {string} osisPath - Ruta al archivo .osis.xml
 * @param {Map<number, Set<string>>} versesMap - Map<verseNum, Set<strong-position>>
 * @returns {Map<string, {morph: string, lemma: string, greek: string}>}
 */
export function extractMorphFromOsis(osisPath, versesMap) {
  const result = new Map()

  try {
    const content = fs.readFileSync(osisPath, 'utf-8')

    for (const [verseNum, strongPositions] of versesMap) {
      if (strongPositions.size === 0) continue

      const versePattern = new RegExp(`\\$\\$\\$[^:]+:${verseNum}\\s+([\\s\\S]*?)(?=\\$\\$\\$|$)`, 'i')
      const verseMatch = content.match(versePattern)
      if (!verseMatch) continue

      const verseContent = verseMatch[1]
      const wTags = verseContent.match(/<w [^>]+>/g) || []

      for (const wTag of wTags) {
        const srcMatch = wTag.match(/src="([\d\s]+)"/)
        if (!srcMatch) continue
        const positions = srcMatch[1].split(/\s+/).map(p => parseInt(p, 10))

        const lemmaMatch = wTag.match(/lemma="([^"]*)"/)
        if (!lemmaMatch) continue
        const lemmaContent = lemmaMatch[1]

        const lemmasInLemma = lemmaContent.match(/lemma\.TR:([^\s"]+)/g) || []
        const lemmas = lemmasInLemma.map(l => l.replace('lemma.TR:', ''))

        const strongsInLemma = lemmaContent.match(/strong:G(\d+)/g) || []
        const strongs = strongsInLemma.map(s => s.replace('strong:G', ''))

        const morphMatches = wTag.match(/robinson:"?([^"\s>]+)"?/g) || []
        const morphCodes = morphMatches.map(m => m.replace('robinson:', '').replace(/^"|"$/g, ''))

        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i]
          const strongNum = strongs[i] || ''
          const lemma = lemmas[i] || ''
          let morph = morphCodes[i] || morphCodes[0] || ''

          // Normalizar códigos mal formados conocidos
          if (morph === 'T-PAP-NPM') {
            morph = 'T-NPM'
          }

          if (strongNum && pos) {
            const strongPos = `G${strongNum}-${pos}`
            if (strongNum === '3588' && pos === 7) {
              console.log(`  [DEBUG] strongPos=${strongPos}`)
              console.log(`  [DEBUG] strongPositions.has() = ${strongPositions.has(strongPos)}`)
              console.log(`  [DEBUG] strongPositions (primeros 5): ${Array.from(strongPositions).slice(0,5).join(', ')}`)
              console.log(`  [DEBUG] morphCodes[${i}] = ${morphCodes[i]}`)
              console.log(`  [DEBUG] lemmas[${i}] = ${lemmas[i]}`)
              console.log(`  [DEBUG] strongs[${i}] = ${strongs[i]}`)
            }
            if (strongPositions.has(strongPos)) {
              result.set(strongPos, { morph, lemma, greek: '' })
            }
          }
        }
      }
    }
  } catch (e) {
    console.error(`Error extracting morph from ${osisPath}:`, e)
  }

  return result
}

/**
 * Extrae información para un solo versículo
 * @param {string} osisPath - Ruta al archivo .osis.xml
 * @param {number} verseNum - Número de versículo
 * @param {Set<string>} strongPositions - Set de "G1234-5"
 * @returns {Map<string, {morph: string, lemma: string, greek: string}>}
 */
export function extractMorphFromOsisVerse(osisPath, verseNum, strongPositions) {
  const versesMap = new Map()
  versesMap.set(verseNum, strongPositions)
  return extractMorphFromOsis(osisPath, versesMap)
}
