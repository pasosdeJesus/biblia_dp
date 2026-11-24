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
//   5. «que» suelto entre dos <wi>: se clasifica según su función (§4.7):
//      - RELATIVO (tiene antecedente): «la piara que», «los pájaros que».
//        No es error: el español exige el relativo y no viene de un Strong.
//      - COMPLETIVO (completa al verbo): «cuando vio que», «ordena que».
//        Debe ir dentro del <wi> del verbo o de la partícula que lo rige.
//      - TRAS «he aquí» / «vean»: también completivo.
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


// Verbos y partículas que rigen una completiva con «que» en español. Si el
// <wi> anterior termina en uno de ellos, el «que» completa al verbo.
const RIGEN_COMPLETIVA = new Set([
  'vio', 've', 'vean', 'vea', 'viendo', 'ordenó', 'ordena', 'ordenen',
  'dijo', 'dicen', 'digo', 'sabe', 'saben', 'sabía', 'creyó', 'cree',
  'entiendo', 'entienden', 'oyó', 'oyeron', 'supo', 'esperaba', 'temía',
  'he aquí', 'ocurrió', 'aconteció', 'sucedió', 'pasó', 'escrito',
  'muestra', 'muestran', 'enseñó', 'enseña', 'manda', 'mandó', 'pidió'
])

// Texto visible de un nodo <wi> en una línea.
function textoWi(linea) {
  const m = linea.match(/<wi\b[^>]*>([^<]*)<\/wi>/)
  return m ? m[1].trim() : ''
}

// Clasifica la palabra suelta que aparece entre dos <wi>.
// Devuelve { tipo, verbo } donde tipo es: 'relativo', 'completiva', 'otra'.
function clasificarSuelta(palabra, lineaAnterior) {
  const previo = textoWi(lineaAnterior)
  const ultima = (previo.split(/\s+/).pop() || '').toLowerCase()
  // «se vio», «fue visto»: pasiva, no verbo de percepción con completiva.
  if (/\bse\s+vio\b|\bfue\s+visto\b/i.test(previo)) {
    return { tipo: 'relativo', verbo: previo }
  }
  if (RIGEN_COMPLETIVA.has(ultima) || /^(he aquí|vean|vea)$/i.test(previo.toLowerCase())) {
    return { tipo: 'completiva', verbo: previo }
  }
  // Si lo anterior es un artículo o preposición seguida de sustantivo
  // («la», «los», «en»), el «que» es relativo respecto a ese antecedente.
  if (/^(el|la|los|las|un|una|lo|al|del)$/i.test(ultima)) {
    return { tipo: 'relativo', verbo: previo }
  }
  return { tipo: 'otra', verbo: previo }
}


// Busca hacia arriba (hasta 6 líneas) el <wi> cuyo texto termina en un verbo o
// partícula que rige completiva. Devuelve { texto, strong, posicion, distancia }.
function buscarVerboCompletiva(lineas, i) {
  for (let d = 1; d <= 6 && i - d >= 0; d++) {
    const l = lineas[i - d]
    const m = l.match(/<wi[^>]*value="([A-Za-z]*)(\d+),(\d+),"[^>]*>([^<]*)<\/wi>/)
    if (!m) continue
    const texto = m[4].trim()
    const ultima = (texto.split(/\s+/).pop() || '').toLowerCase()
    const rige = RIGEN_COMPLETIVA.has(ultima) || /^(he aquí|vean|vea)$/i.test(texto.toLowerCase())
    if (rige) return { texto, strong: m[1] + m[2], posicion: m[3], distancia: d }
  }
  return null
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

    // Regla 5: «que» suelto entre dos <wi>
    if (/^\s*que\s*$/.test(linea) && i > 0 && i + 1 < lineas.length) {
      const anterior = lineas[i - 1]
      const siguiente = lineas[i + 1]
      if (/<\/wi>/.test(anterior) && /<wi\b/.test(siguiente)) {
        const { tipo, verbo } = clasificarSuelta('que', anterior)
        if (tipo === 'completiva') {
          hallazgos.push({ ref, tipo: `«que» completivo suelto tras «${verbo.trim()}»: va en su <wi>`, linea: i + 1 })
        } else if (tipo === 'relativo') {
          hallazgos.push({ ref, tipo: `«que» relativo suelto tras «${verbo.trim()}» (revisar)`, linea: i + 1 })
        }
      }
    }

    // Regla 6: «que» completivo separado de su verbo por otro <wi>. El verbo
    // queda arriba en el bloque; la conjunción debe marcarse con type="GC" y
    // la posición (value) del verbo (doc/gbfxml.md §3.3.1).
    if (/^\s*que\s*$/.test(linea) && i > 0) {
      const verboCercano = buscarVerboCompletiva(lineas, i)
      if (verboCercano && verboCercano.distancia >= 2) {
        hallazgos.push({ ref, tipo: `«que» completivo separado de «${verboCercano.texto}» (${verboCercano.strong}): usar <wi type="GC" value="${verboCercano.posicion}">que</wi>`, linea: i + 1 })
      }
    }

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
