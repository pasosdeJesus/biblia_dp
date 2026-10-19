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

if (!jsonPath) {
  console.error('Uso: node herram/make-report.mjs <json> [findings.json]')
  process.exit(1)
}

const d = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
const gbf = d.gbf
const kjv = d.kjv
const rvg = d.rvg

const findings = findingsPath ? JSON.parse(fs.readFileSync(findingsPath, 'utf-8')) : {}

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
  out.push('**Verificación:**')
  const fs2 = findings[String(v)] || []
  const auto = detectarMorfologia(k.verbs, g.words)
  if (fs2.length === 0 && auto.length === 0) out.push('(sin hallazgos registrados)')
  for (const f of fs2) out.push(`- ${f}`)
  for (const a of auto) out.push(`- ${a}`)
  if (g.missing.length || g.extra.length) {
    out.push(`- Diferencia Strong: faltan [${strongs(g.missing)}]; sobran [${strongs(g.extra)}]`)
  }
  out.push('')
}

console.log(out.join('\n'))
