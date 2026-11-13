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
  575: ['de', 'desde', 'del'], // ἀπό
  1537: ['de', 'desde', 'del', 'por'], // ἐκ (+ genitivo; «por» instrumental)
  1722: ['en', 'por', 'con', 'entre'], // ἐν (+ dativo: locativo, instrumental, asociativo)
  1519: ['a', 'en', 'al', 'del', 'para', 'por'], // εἰς (valores: destino, final, instrumental)
  1909: ['sobre', 'en', 'contra'],       // ἐπί
  4314: ['a', 'hacia', 'al', 'con'], // πρός (con = trato/relación)
  1223: ['por', 'mediante'],   // διά
  2596: ['según', 'contra', 'en contra', 'de acuerdo', 'por'], // κατά
  5259: ['por', 'de', 'debajo', 'desde'], // ὑπό (+ dativo = «por»; + acusativo = «bajo»)
  4012: ['acerca', 'alrededor', 'por', 'con respecto', 'sobre'], // περί
  3326: ['con', 'tras', 'después'], // μετά (+ acusativo = «después de»)
  3844: ['junto', 'al lado', 'a orillas', 'de', 'ante', 'en lugar', 'contrario', 'contrarío'], // παρά
  4862: ['con']                // σύν
}

// Traducciones que dependen del caso griego, no del significado básico de la
// preposición. Se aceptan sin reportar.
const PREP_ES_CASO = {
  1722: ['a', 'al', 'de'],     // ἐν: locativo «a», partitivo «de»
  3326: ['tras', 'después'],   // μετά + acusativo
  3844: ['de', 'ante'],        // παρά + genitivo («de parte de»)
  4314: ['para', 'donde'],     // πρός final / relativo («hacia donde»)
  1519: ['para', 'por', 'entre'] // εἰς final/instrumental/distributivo
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
    // Aceptar tanto coincidencia exacta como que la traducción empiece por el
    // valor esperado («en contra» empieza por «en»). Se exige que la primera
    // palabra sea igual o que el valor esperado sea prefijo de la traducción
    // completa.
    const aceptados = esperados.concat(PREP_ES_CASO[p.strong] || [])
    const wLimpio = w.replace(/[.,;:!?»«()"]/g, '').trim()
    const ok = aceptados.some(e => first === e || wLimpio === e || wLimpio.startsWith(e + ' '))
    if (!ok) {
      flags.push(`⚙️ Preposición G${p.strong} «${p.greek}» → «${w}»; se espera ${esperados.join('/')}.`)
    }
  }
  return flags
}

// Participios adjetivales (sustantivados/atributivos) con artículo G3588:
// deben verterse como cláusula relativa «el que/que + verbo». Marca cuando el
// español del participio no contiene un relativo (posible gerundio, participio
// o sustantivo en lugar de relativa). Ver doc/morfologia-Robinson.md,
// «Participio adjetival → cláusula relativa».
const RELATIVO = /\b(que|quien|quienes|cual|cuales)\b/

function detectarParticipioAdjetival(words, spaWords) {
  const flags = []
  if (!words || !spaWords) return flags

  // Mapa posición → { strong, morph } con morfología limpia por posición.
  // Las posiciones reflejan el orden griego (aunque el OSIS reordene los
  // artículos al inicio de la línea).
  const porPos = {}
  for (const w of words) {
    const morphs = (w.morph || '').split(/robinson:/).map(x => x.trim()).filter(Boolean)
    for (let j = 0; j < w.positions.length; j++) {
      porPos[w.positions[j]] = { strong: w.strongs[j], morph: morphs[j] || '' }
    }
  }

  for (const w of words) {
    const morph = w.morph || ''
    if (!/V-.*P-[A-Z]{2,3}/.test(morph)) continue
    // Posición del participio (la última si está combinado con artículo).
    const idx = w.strongs.length > 1 ? w.positions.length - 1 : 0
    const pos = w.positions[idx]
    // Artículo G3588 inmediatamente antes (pos-1) o en el mismo <w>.
    const prev = porPos[pos - 1]
    const conArticulo = w.strongs.includes(3588) || (prev && prev.strong === 3588)
    if (!conArticulo) continue
    // Participio atributivo: le sigue un sustantivo (pos+1) al que modifica;
    // el adjetivo español es válido y no exige relativa.
    const sig = porPos[pos + 1]
    if (sig && /^N-/.test(sig.morph)) continue
    const spa = (spaWords[String(pos)] || '').trim()
    // Si el artículo anterior ya trae el relativo («el que», «a quien»), la
    // relativa está resuelta y no hay nada que reportar.
    const spaArticulo = (spaWords[String(pos - 1)] || '').trim().toLowerCase()
    if (spaArticulo && RELATIVO.test(spaArticulo)) continue
    if (spa && !RELATIVO.test(spa.toLowerCase())) {
      const greek = (w.greeks && w.greeks[idx]) || w.greek || '?'
      flags.push(`⚙️ Participio sustantivado «${greek}» (con artículo G3588) → «${spa}»; se espera relativa «el que/que + verbo».`)
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
out.push('Reglas: aoristo narrativo (genealogías, hechos puntuales) → pretérito simple; «he X» para afirmaciones teológicas/exhortaciones. Perfecto → «he X»/estado resultante; imperfecto → «-aba/-ía»; presente → presente (el presente histórico puede verterse como pasado, opción del traductor); futuro → futuro. Participio adverbial → gerundio; participio adjetival con artículo (sustantivado) → relativa «el que/que + verbo» (ver doc/morfologia-Robinson.md).')
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
  const partAdj = detectarParticipioAdjetival(k.words, g.words)
  const lex = detectarLexico(g.strongs, g.words, glosario, strongToGreek)
  const warns = g.warnings || []
  if (fs2.length === 0 && auto.length === 0 && preps.length === 0 && partAdj.length === 0 && lex.length === 0 && warns.length === 0) out.push('(sin hallazgos registrados)')
  for (const f of fs2) out.push(`- ${f}`)
  for (const a of auto) out.push(`- ${a}`)
  for (const p of preps) out.push(`- ${p}`)
  for (const pa of partAdj) out.push(`- ${pa}`)
  for (const l of lex) out.push(`- ${l}`)
  for (const w of warns) out.push(`- ⚠️ ${w}`)
  if (g.missing.length || g.extra.length) {
    out.push(`- Diferencia Strong: faltan [${strongs(g.missing)}]; sobran [${strongs(g.extra)}]`)
  }
  out.push('')
}

console.log(out.join('\n'))
