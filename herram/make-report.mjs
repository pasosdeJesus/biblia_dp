#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Genera un reporte de revisión en Markdown a partir de la salida de
// parse-revision.mjs y de un archivo de hallazgos.
//
// Uso:
//   node herram/parse-revision.mjs <libro> <cap> > /tmp/rev.json
//   node herram/make-report.mjs /tmp/rev.json [findings.json]
//
// findings.json (opcional), por versículo:
//   { "1": ["hallazgo 1", "hallazgo 2"], "2": ["..."] }
//
// El reporte incluye, por versículo: WEB, SpaTDP, KJV, RVG2012, Strong
// SpaTDP/KJV y la verificación (hallazgos + diferencias Strong).

import fs from 'fs'

const jsonPath = process.argv[2]
const findingsPath = process.argv[3]
const glosarioPath = process.argv[4]

if (!jsonPath) {
  console.error('Uso: node herram/make-report.mjs <json> [findings.json] [glosario.json]')
  process.exit(1)
}

const d = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
const gbf = d.gbf
const kjv = d.kjv
const rvg = d.rvg

const findings = findingsPath ? JSON.parse(fs.readFileSync(findingsPath, 'utf-8')) : {}
const glosario = glosarioPath ? JSON.parse(fs.readFileSync(glosarioPath, 'utf-8')) : null

function strongs(lst) {
  return lst.map(([n, p]) => `G${n},${p}`).join(' ')
}

// --- Detección heurística de tiempo verbal en español ---
const PRETERITO_IRREG = new Set([
  'fue', 'fui', 'fueron', 'fuiste', 'fuimos', 'vio', 'dio', 'hizo', 'dijo',
  'trajo', 'puso', 'quiso', 'supo', 'vino', 'tuvo', 'estuvo', 'anduvo',
  'pusieron', 'vinieron', 'tuvieron', 'dijeron', 'hicieron', 'trajeron'
])

function esPreteritoSimple(w) {
  const first = w.toLowerCase().replace(/[.,;:!?»«()"]/g, '').split(/\s+/)[0]
  if (PRETERITO_IRREG.has(first)) return true
  if (/(ó|ió)$/.test(first)) return true
  if (/(aron|ieron)$/.test(first)) return true
  return false
}

function esParticipioPasivo(w) {
  const last = w.toLowerCase().replace(/[.,;:!?»«()"]/g, '').split(/\s+/).pop()
  return /(ado|ada|ido|ida)$/.test(last)
}

// Imperfectos que convencionalmente se vierten en pretérito simple (φημί).
const IMPERFECTO_PRETERITO_EXC = new Set(['εφη'])

// Devuelve hallazgos automáticos de morfología (indicativo y participios).
function detectarMorfologia(verbs, words) {
  const flags = []
  if (!words) return flags
  for (const vb of verbs) {
    const morph = vb.morph || ''
    const pos = String(vb.src || '').trim().split(/\s+/)[0]
    const w = (words[pos] || '').trim()
    if (!w) continue
    // Imperfecto indicativo (V-I*I) vertido en pretérito simple
    if (/^V-I[A-Z]I/.test(morph) && !IMPERFECTO_PRETERITO_EXC.has(vb.greek) && esPreteritoSimple(w)) {
      flags.push(`⚙️ Imperfecto ${morph} «${vb.greek}» → «${w}» (pretérito); se espera imperfecto (-aba/-ía).`)
    }
    // Participio presente activo (V-PAP) vertido con apariencia pasiva (-ado/-ido)
    if (/^V-PAP/.test(morph) && esParticipioPasivo(w)) {
      flags.push(`⚙️ Participio activo ${morph} «${vb.greek}» → «${w}» (apariencia pasiva -ado/-ido); revisar voz.`)
    }
  }
  return flags
}

// Preposiciones griegas → traducción española esperada (por Strong).
const PREP_ES = {
  575: ['de', 'desde'],        // ἀπό
  1537: ['de', 'desde', 'del'],// ἐκ
  1722: ['en'],                // ἐν
  1519: ['a', 'en', 'al'],     // εἰς
  1909: ['sobre', 'en'],       // ἐπί
  4314: ['a', 'hacia', 'al'],  // πρός
  1223: ['por', 'mediante'],   // διά
  2596: ['según', 'contra'],   // κατά
  5259: ['por', 'de'],         // ὑπό
  4012: ['acerca', 'alrededor', 'por'], // περί
  3326: ['con'],               // μετά
  3844: ['junto', 'al lado', 'a orillas'], // παρά
  4862: ['con']                // σύν
}

function detectarPreposiciones(preps, words) {
  const flags = []
  if (!words) return flags
  for (const p of (preps || [])) {
    const pos = String(p.src || '').trim().split(/\s+/)[0]
    const w = (words[pos] || '').trim().toLowerCase()
    if (!w) continue
    const esperados = PREP_ES[p.strong] || []
    if (!esperados.length) continue
    const first = w.split(/\s+/)[0].replace(/[.,;:!?»«()"]/g, '')
    if (!esperados.some(e => first === e || first.startsWith(e))) {
      flags.push(`⚙️ Preposición G${p.strong} «${p.greek}» → «${w}»; se espera ${esperados.join('/')}.`)
    }
  }
  return flags
}

// Palabras funcionales con variación legítima (no se marcan por léxico).
const SKIP_LEXICO = new Set([
  3588, 846, 2532, 1161, 1063, 3754, 1722, 1519, 1909, 5259, 575, 1537,
  4314, 4012, 3326, 2596, 1223, 3778, 1565, 3739, 5101, 3956, 3361, 3756,
  1487, 1437, 2443, 3767, 235, 2228, 3004, 2036, 2076, 1510, 1096, 2192,
  4160, 1325, 2064, 1492, 191, 2983, 863, 906, 5087, 2476, 2521, 2309, 1410
])

// Marca traducciones léxicas inusuales: palabra usada pocas veces (<= 3) para
// un Strong que tiene otra traducción dominante. Incluye el lema griego
// (lemma.TR) para juzgar fidelidad, no solo consistencia.
function detectarLexico(strongs, words, glosario, greekMap) {
  const flags = []
  if (!glosario || !words) return flags
  for (const [n, pos] of strongs) {
    if (SKIP_LEXICO.has(n)) continue
    const g = glosario[String(n)]
    if (!g) continue
    const w = (words[String(pos)] || '').trim().toLowerCase()
    if (!w) continue
    // Normaliza a minúsculas el glosario (fusiona diferencias de mayúscula)
    const gLower = {}
    let total = 0
    for (const [k, c] of Object.entries(g)) {
      const kk = k.toLowerCase()
      gLower[kk] = (gLower[kk] || 0) + c
      total += c
    }
    if (!gLower[w]) continue
    const entradas = Object.entries(gLower)
    const max = Math.max(...entradas.map(([, c]) => c))
    if (gLower[w] < max && gLower[w] <= 3) {
      const comunes = entradas.filter(([, c]) => c === max).map(([k]) => k)
      const greek = (greekMap && greekMap[n]) ? ` (${greekMap[n]})` : ''
      flags.push(`⚙️ Léxico G${n}${greek} → «${w}» (${gLower[w]}/${total} usos); frecuente: ${comunes.join(' / ')}.`)
    }
  }
  return flags
}

const out = []
out.push('# Revisión — fuente canónica `libros/*.gbfxml`')
out.push('')
out.push('Archivos leídos completos:')
out.push('- `libros/*.gbfxml` (fuente canónica: WEB + SpaTDP + Strong)')
out.push('- `ref/sword_kjv/capitulos2003/*.osis.xml` (KJV + Strong + morfología Robinson)')
out.push('- `ref/reina_valera_geiger_nt/capitulos/*.usfm` (RVG2012)')
out.push('')
out.push('## Nota de morfología')
out.push('')
out.push('Reglas: aoristo narrativo (genealogías, hechos puntuales) → pretérito simple; «he X» para afirmaciones teológicas/exhortaciones. Perfecto → «he X»/estado resultante; imperfecto → «-aba/-ía»; presente → presente (el presente histórico puede verterse como pasado, opción del traductor); futuro → futuro.')
out.push('')
for (const v of Object.keys(gbf).sort((a, b) => a - b)) {
  const g = gbf[v]
  const k = kjv[v] || { text: '', strongs: [], verbs: [] }
  out.push(`## ${v}`)
  out.push('')
  out.push(`**WEB:** ${g.web}`)
  out.push('')
  out.push(`**SpaTDP:** ${g.spa}`)
  out.push('')
  out.push(`**KJV:** ${k.text}`)
  out.push('')
  out.push(`**RVG2012:** ${rvg[v] || ''}`)
  out.push('')
  out.push(`**Strong SpaTDP:** ${strongs(g.strongs)}`)
  out.push('')
  out.push(`**Strong KJV:** ${strongs(k.strongs)}`)
  out.push('')
  out.push('**Morfología verbal (KJV):**')
  for (const vb of k.verbs) {
    out.push(`- G_${vb.greek || '?'} \`${vb.morph}\` → «${vb.text}» (src ${vb.src})`)
  }
  out.push('')
  out.push('**Interlinear (griego → inglés → español):**')
  for (const wd of (k.words || [])) {
    const strong = wd.strongs.map(s => `G${s}`).join('+')
    const spa = wd.positions.map(p => g.words[String(p)] || '').filter(x => x).join(' ')
    out.push(`- ${wd.greek || '?'} \`${wd.morph || '?'}\` [${strong}] «${wd.english}» → «${spa}»`)
  }
  out.push('')
  out.push('**Verificación:**')
  const fs2 = findings[String(v)] || []
  const strongToGreek = {}
  for (const wd of (k.words || [])) {
    for (let i = 0; i < wd.strongs.length; i++) {
      const s = wd.strongs[i]
      const gr = (wd.greeks && wd.greeks[i]) || wd.greek
      if (gr && !strongToGreek[s]) strongToGreek[s] = gr
    }
  }
  const auto = detectarMorfologia(k.verbs, g.words)
  const preps = detectarPreposiciones(k.preps, g.words)
  const lex = detectarLexico(g.strongs, g.words, glosario, strongToGreek)
  const warns = g.warnings || []
  if (fs2.length === 0 && auto.length === 0 && preps.length === 0 && lex.length === 0 && warns.length === 0) out.push('(sin hallazgos registrados)')
  for (const f of fs2) out.push(`- ${f}`)
  for (const a of auto) out.push(`- ${a}`)
  for (const p of preps) out.push(`- ${p}`)
  for (const l of lex) out.push(`- ${l}`)
  for (const w of warns) out.push(`- ⚠️ ${w}`)
  if (g.missing.length || g.extra.length) {
    out.push(`- Diferencia Strong: faltan [${strongs(g.missing)}]; sobran [${strongs(g.extra)}]`)
  }
  out.push('')
}

console.log(out.join('\n'))
