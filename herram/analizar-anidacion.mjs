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
// Además señala <wi/> vacíos seguidos de una palabra traducida (➕): el Strong
// sin palabra propia debe anidarse dentro del <wi> que sí la tiene, para que no
// parezca omitido en la traducción y para que la concordancia no lo asigne a
// la palabra española equivocada.
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
  '686,3767',  // ἄρα οὖν → «así que, entonces»
  '5087,1119', // τίθημι γόνυ → «poner la rodilla» = «arrodillarse»
  '2955,2736', // κύπτω κάτω → «agacharse hacia abajo» = «agacharse»
])

function childNodesArr(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}

// Pronombres griegos personales (G846 αὐτός y familia): cuando van pegados al
// verbo en español forman una sola palabra y no se separan.
const PRONOMBRES = new Set([
  846, 1473, 4771, 5210, 5216, 2249, 2257, 2254, 2248, 3165, 3427, 4671,
  4571, 5209, 5213, 4771, 4675, 4674, 1438, 4572, 1439
])

// Pronombres personales que pueden quedar implícitos en la desinencia verbal
// española (sujeto): «llegó» = «él llegó», «escuchamos» = «nosotros».
// Reflexivos y preposiciones usados en las fusiones «consigo mismo».
const REFLEXIVOS = new Set([1438, 848])
const PREPOSICIONES = new Set([1722, 1519, 1537, 4314, 3326, 1909])

const PERSONALES = new Set([846, 1473, 4771, 5210, 2249, 2248, 5209, 5213, 5201])

// Verbos de movimiento que, con G846 como sujeto, forman una unidad en
// español porque el sujeto va implícito en la desinencia: «se iban»,
// «habían vuelto», «ha concebido».
const VERBOS_MOVIMIENTO = new Set([
  1831, 4815, 2064, 4334, 565, 4198, 3854, 1525, 2597, 305, 402, 1910,
  399, 424, 4863, 4313, 4314, 4260, 1279, 1350, 4198
])

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
 *
 * Criterio (doc/REVISION-NT.md y AGENTS.md §10): se anida cuando el español
 * une las dos palabras griegas en una unidad indivisible; se separa solo
 * cuando cada Strong tiene su propia palabra española independiente.
 */
function classify(outerStrong, innerStrong, fullText) {
  const singleWord = !/\s/.test(fullText)

  // 1. Fusión correcta: una sola palabra = dos Strong (y no es artículo externo).
  if (singleWord && outerStrong !== 3588) return 'fusion'

  // 2. Pronombre enclítico (pegado al verbo): «decirle», «diciéndole»,
  // «díganles» son UNA palabra española, no se pueden separar.
  // En cambio «les digo» sí es separable: son dos palabras.
  // El regex exige que el verbo y el pronombre estén unidos, sin espacio.
  if (PRONOMBRES.has(outerStrong) || PRONOMBRES.has(innerStrong)) {
    if (/\b[a-záéíóúñ]+(le|les|lo|la|los|las|me|nos|te|se)\b/i.test(fullText) &&
        !/\s+(le|les|lo|la|los|las|me|nos|te|se)\s/i.test(fullText)) {
      return 'fusion'
    }
  }

  // 2b. Cláusula relativa: el texto empieza por relativo («a quien», «quienes»,
  // «lo que», «que»), así que el participio griego se vierte como relativa y
  // el pronombre interno funciona como objeto dentro de ella.
  if (/^\s*(a\s+)?(quien|quienes|el\s+que|la\s+que|los\s+que|las\s+que|lo\s+que|que)\b/i.test(fullText)) {
    return 'fusion'
  }

  // 2c. Hebraísmo ἀποκριθεὶς εἶπεν (G611 «responder» + G2036 «decir»): el
  // griego no tiene pronombre propio para el sujeto ni para el destinatario,
  // así que «Él le contestó» o «le dijo» son añadidos exigidos por el español.
  // Se acepta tanto la fusión («contestó») como la forma ampliada.
  if (outerStrong === 611 && (innerStrong === 2036 || innerStrong === 3004)) {
    return 'fusion'
  }

  // 2d. Sujeto pronominal implícito (doc/REVISION-NT.md, caso 3): en español
  // la desinencia verbal contiene el sujeto («llegó» = «él llegó»,
  // «escuchamos» = «nosotros escuchamos»), así que el pronombre griego no
  // tiene palabra propia y se anida dentro del verbo.
  if (PERSONALES.has(innerStrong) && /^(cuando|al|después de|mientras|habiendo)\b/i.test(fullText)) {
    return 'fusion'
  }

  // 2e. Genitivo absoluto o sujeto pronominal en participio: G846 αὐτός como
  // sujeto del verbo en «se iban», «habían vuelto», «ha concebido». El
  // español lleva el sujeto en la desinencia, así que se anida.
  if (PERSONALES.has(outerStrong) && VERBOS_MOVIMIENTO.has(innerStrong)) {
    return 'fusion'
  }

  // 2f. Preposición + reflexivo fundidos en «consigo» (Lucas 12:17,
  // ἐν ἑαυτῷ): el español une las dos palabras griegas en un solo pronombre,
  // así que se anida. Igual que «al»/«del», una palabra = dos Strong.
  if (REFLEXIVOS.has(innerStrong) && PREPOSICIONES.has(outerStrong) &&
      /^consigo\b/i.test(fullText)) {
    return 'fusion'
  }

  // 2g. Reflexivo incorporado al imperativo (Lucas 17:3, προσέχετε ἑαυτοῖς):
  // «ten cuidado» no tiene pronombre propio porque la desinencia y el
  // reflexivo español lo absorben. Una palabra = dos Strong.
  if (REFLEXIVOS.has(innerStrong) && /^(ten|tened|tengan|cuidado|mirad|estad)\b/i.test(fullText) &&
      !/\s+mismo\b/i.test(fullText)) {
    return 'fusion'
  }

  // 2h. Término arameo transliterado con Strong duplicado (1 Corintios 16:22,
  // μαραναθά): el KJV desdobla un solo término en dos Strong iguales, y el
  // español lo vierte como una sola expresión. Se anida y se documenta en nota.
  if (outerStrong === 3134 && innerStrong === 3134) return 'fusion'

  // 3. Especial: requiere revisión manual.
  if (outerStrong === 3588) return 'especial' // artículo envuelve (convención antigua)
  if (innerStrong === 3588) return 'especial' // artículo envuelto multi-palabra
  if (outerStrong === 1438 || innerStrong === 1438) return 'especial' // reflexivo ἑαυτόν
  if (outerStrong === 3134 || innerStrong === 3134) return 'especial' // arameo μαραναθα
  if (outerStrong === 846 && innerStrong === 846) return 'especial'   // doble pronombre
  if (outerStrong === 1440 && innerStrong === 1803) return 'especial' // numeral «setenta y seis»

  // 4. Locución fija: expresión idiomática, no separar.
  if (LOCUCIONES.has(`${outerStrong},${innerStrong}`)) return 'locucion'

  // 5. Separar: cada palabra española corresponde a un Strong.
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

// <wi/> vacío seguido de una palabra traducida que no lleva su propio <wi>.
// Esos Strong se anidan dentro del <wi> siguiente (o de la palabra que traduce
// el conjunto) en lugar de quedar como <wi/> suelto.
// Strong que no llevan palabra propia en español por su función gramatical
// (conjunción, partícula, pronombre relativo). G3588 no esta aquí: el articulo
// se evalua aparte con absorbeArticulo, porque ante un sustantivo si debe
// recibir su palabra.
const SIN_PALABRA_PROPIA = new Set([
  846, 2532, 1161, 1063, 3754, 3767, 235, 3303, 1065, 686, 2228,
  3361, 3756, 5101, 302, 1437, 1487, 2443, 3739
])


// ── Morfología Robinson de la KJV, por capítulo ──
// Se usa para saber si la palabra española que sigue a un <wi/> vacío puede
// absorber el artículo griego. Ante nombre propio, verbo o pronombre no se
// absorbe: «ὁ Ἰησοῦς» es «Jesús», no «el Jesús».
const NOMBRE_KJV = {
  mateo: 'Matthew', marcos: 'Mark', lucas: 'Luke', juan: 'John', hechos: 'Acts',
  romanos: 'Romans', corintios1: 'I_Corinthians', corintios2: 'II_Corinthians',
  galatas: 'Galatians', efesios: 'Ephesians', filipenses: 'Philippians',
  colosenses: 'Colossians', tesalonicenses1: 'I_Thessalonians',
  tesalonicenses2: 'II_Thessalonians', timoteo1: 'I_Timothy',
  timoteo2: 'II_Timothy', tito: 'Titus', filemon: 'Philemon', hebreos: 'Hebrews',
  santiago: 'James', pedro1: 'I_Peter', pedro2: 'II_Peter', juan1: 'I_John',
  juan2: 'II_John', juan3: 'III_John', judas: 'Jude', apocalipsis: 'Revelation'
}

const cacheMorfo = new Map()
function morfo(libro, cap) {
  const clave = `${libro}-${cap}`
  if (cacheMorfo.has(clave)) return cacheMorfo.get(clave)
  const archivo = path.join(__dirname, '..', 'ref', 'sword_kjv', 'capitulos2003',
    `${NOMBRE_KJV[libro]}-${String(cap).padStart(2, '0')}.osis.xml`)
  if (!NOMBRE_KJV[libro] || !fs.existsSync(archivo)) { cacheMorfo.set(clave, []); return [] }
  const texto = fs.readFileSync(archivo, 'utf-8').split(/[\r\n]+/).join(' ')
  const re = /<w\b([^>]*)>/g
  const salida = []
  let verso = 0
  let m2
  let pos = 0
  while ((m2 = re.exec(texto))) {
    const attrs = m2[1]
    const lemma = (attrs.match(/lemma="([^"]*)"/) || [])[1] || ''
    const src = (attrs.match(/src="([^"]*)"/) || [])[1] || ''
    const morphs = (attrs.match(/robinson:[A-Z0-9-]+/g) || []).map(x => x.slice(9))
    const srcs = src.trim().split(/\s+/).filter(Boolean).map(Number).filter(Number.isFinite)
    const strongs = [...lemma.matchAll(/strong:G(\d+)/g)].map(x => Number(x[1]))
    strongs.forEach((strong, k) => {
      salida.push({ strong, morph: morphs[k] || '', src: srcs[k] || srcs[0] || 0, vers: 0 })
    })
  }
  // Los versículos se asignan al recorrer el documento GBFXML; aquí basta la
  // lista por capítulo, y el destino se busca por strong+orden del gbfxml.
  cacheMorfo.set(clave, salida)
  return salida
}

// ¿Puede la palabra española absorber el artículo? Mismo criterio que
// normaliza-3588.mjs (absorbeArticulo).
function absorbeArticulo(texto) {
  return /^(el|la|los|las|lo)\b/i.test((texto || '').trim())
}

function findSoloVacioSeguido(sv) {
  const candidatos = []
  function walk(n) {
    if (n.nodeType !== 1) return
    if (n.tagName === 'wi') {
      const value = n.getAttribute('value') || ''
      const m = value.match(/^[A-Za-z]*(\d+),/)
      const strong = m ? parseInt(m[1], 10) : 0
      if (!textOf(n).trim() && strong && !SIN_PALABRA_PROPIA.has(strong)) {
        let next = n.nextSibling
        while (next && next.nodeType === 3 && !next.nodeValue.trim()) next = next.nextSibling
        if (next && next.nodeType === 1 && next.tagName === 'wi' && textOf(next).trim()) {
          const texto = textOf(next).trim()
          candidatos.push({
            outer: value,
            inner: next.getAttribute('value') || '',
            text: texto,
            // Se anida solo si la palabra siguiente puede absorber este Strong:
            //   G3588 -> cuando empieza por artículo o relativo («el», «la»...)
            //   resto -> cuando es una palabra que puede llevar preposición o
            //            conjunción fundida; ante nombre propio no se anida.
            absorbe: Number(strong) === 3588
              ? absorbeArticulo(texto)
              : !/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(texto)
          })
        }
      }
    }
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(sv)
  return candidatos
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
    const solo = findSoloVacioSeguido(sv)
    if (nested.length > 0 || solo.length > 0) {
      verses.push({ id: sv.getAttribute('id') || '', nested, solo })
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
  let totalSugeridos = 0
  let totalNoAbsorben = 0

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
      for (const n of v.solo) {
        if (n.absorbe) {
          console.log(`    ➕ anidar <wi value="${n.outer}"/> en <wi value="${n.inner}">  [«${n.text}»]`)
          totalSugeridos++
        } else {
          // El artículo griego no se traduce ante nombre propio, verbo o
          // pronombre: dejarlo suelto es lo correcto.
          totalNoAbsorben++
        }
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
    console.log(`   ➕ <wi/> vacío a anidar en la palabra siguiente: ${totalSugeridos}`)
    console.log(`   ⬜ <wi/> vacío cuya palabra no absorbe artículo (correcto): ${totalNoAbsorben}`)
  }
  console.log('='.repeat(70))
}

main()
