#!/usr/bin/env node
// -*- coding: utf-8 -*-
//
// Fase 3 de REQ/10: separa un par <wi> anidado clasificado como «⚠ a separar»
// según la decisión registrada en herram/data/separar.json.
//
// Uso:
//   node herram/aplicar-separar.mjs <libro> <cap>:<ver> --outer X --inner Y [--apply]
//
// Sin --apply solo muestra el estado (lectura). Con --apply reescribe el <sv>
// dejando el <wi> externo y el interno como hermanos, conserva el orden del
// texto español y verifica que la firma Strong,posición del versículo no
// cambia. Si cambia, no escribe nada.
//
// Motivo para no usar regex sobre el fichero: el texto de un <sv> puede
// contener «</sv>» dentro de <fr>/<rf> (REQ/10 §1.3), así que el versículo se
// localiza con el DOM y solo se reescribe la región exacta entre
// «<sv id="...» y su «</sv>».

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function childNodesArr(el) {
  const a = []
  for (let i = 0; i < el.childNodes.length; i++) a.push(el.childNodes[i])
  return a
}

function textOf(node) {
  const p = []
  function walk(n) {
    if (n.nodeType === 3) { p.push(n.nodeValue); return }
    if (n.nodeType !== 1) return
    for (const c of childNodesArr(n)) walk(c)
  }
  walk(node)
  return p.join('')
}

function signatureOf(sv) {
  const wis = sv.getElementsByTagName('wi')
  const arr = []
  for (let i = 0; i < wis.length; i++) {
    const v = wis[i].getAttribute('value') || ''
    if (v) arr.push(v)
  }
  return arr.sort().join(';')
}

// Región del fichero que ocupa el <sv>: desde «<sv id="...» hasta su «</sv>».
function svRegion(src, svId) {
  const open = `<sv id="${svId}">`
  const i = src.indexOf(open)
  if (i === -1) return null
  // Los <sv> no se anidan, así que el primer «</sv>» tras la apertura cierra
  // este versículo y no otro. El riesgo del §1.3 (un «</sv>» dentro de <fr>)
  // lo resuelve la firma: se verifica que el bloque parsee como un <sv> solo.
  let j = src.indexOf('</sv>', i)
  if (j === -1) return null
  j += '</sv>'.length
  let bloque
  try {
    bloque = new DOMParser().parseFromString(`<raiz>${src.slice(i, j)}</raiz>`, 'application/xml')
  } catch {
    return null
  }
  const svs = bloque.getElementsByTagName('sv')
  if (svs.length !== 1 || svs[0].getAttribute('id') !== svId) return null
  return { start: i, end: j, texto: src.slice(i, j), sv: svs[0] }
}

function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const pos = args.filter(a => !a.startsWith('--'))
  const [libro, ref] = pos
  const outerArg = args[args.indexOf('--outer') + 1]
  const innerArg = args[args.indexOf('--inner') + 1]
  if (!libro || !ref || !outerArg || !innerArg || !args.includes('--outer') || !args.includes('--inner')) {
    console.log('Uso: node herram/aplicar-separar.mjs <libro> <cap>:<ver> --outer X --inner Y [--apply]')
    process.exit(1)
  }
  const [cap, ver] = ref.split(':').map(Number)
  const filepath = path.join(__dirname, '..', 'libros', `${libro}.gbfxml`)
  if (!fs.existsSync(filepath)) {
    console.error(`No existe ${filepath}`)
    process.exit(1)
  }
  const src = fs.readFileSync(filepath, 'utf-8')

  // El id del <sv> usa el nombre que trae el GBFXML, no el del fichero.
  const ids = [...src.matchAll(/<sv id="([^"]+)"/g)].map(m => m[1])
  const candidatos = ids.filter(id => {
    const m = id.match(/-(\d+)-(\d+)$/)
    return m && Number(m[1]) === cap && Number(m[2]) === ver
  })
  if (candidatos.length !== 1) {
    console.error(`No pude identificar el <sv> de ${libro} ${ref}: ${candidatos.join(', ') || 'ninguno'}`)
    process.exit(1)
  }
  const svId = candidatos[0]
  const region = svRegion(src, svId)
  if (!region) {
    console.error(`No pude delimitar ${svId} en ${filepath}`)
    process.exit(1)
  }

  const sigAntes = signatureOf(region.sv)
  const wis = region.sv.getElementsByTagName('wi')
  let pair = null
  for (let i = 0; i < wis.length && !pair; i++) {
    const w = wis[i]
    if ((w.getAttribute('value') || '') !== outerArg) continue
    const kids = childNodesArr(w).filter(n => n.nodeType === 1 && n.tagName === 'wi')
    const inner = kids.find(n => (n.getAttribute('value') || '') === innerArg)
    if (inner) pair = { outer: w, inner }
  }
  if (!pair) {
    console.error(`${svId}: no encontré <wi ${outerArg}> conteniendo <wi ${innerArg}>`)
    process.exit(1)
  }

  const textoOuter = pair.outer.textContent
  const textoInner = pair.inner.textContent
  console.log(`${svId}: <wi ${outerArg}>«${textoOuter}»</wi> contiene <wi ${innerArg}>«${textoInner}»</wi>`)
  if (!apply) {
    console.log('(simulación; añade --apply para escribir)')
    return
  }

  // Reescritura textual del bloque: el <wi> externo pasa a ser hermano del
  // interno, ambos en sus propias líneas, con el estilo de doc/estilo-gbfxml.md.
  const bloqueOriginal = `<wi type="G" value="${outerArg}"><wi type="G" value="${innerArg}">${textoInner}</wi></wi>`
  if (!region.texto.includes(bloqueOriginal)) {
    console.error('La forma textual esperada no aparece literalmente; no escribo.')
    process.exit(1)
  }
  const bloqueNuevo = `<wi type="G" value="${outerArg}">${textoOuter}</wi>\n<wi type="G" value="${innerArg}">${textoInner}</wi>`
  const nuevoTexto = region.texto.replace(bloqueOriginal, bloqueNuevo)

  const bloqueNuevoDoc = new DOMParser().parseFromString(`<raiz>${nuevoTexto}</raiz>`, 'application/xml')
  const svNuevo = bloqueNuevoDoc.getElementsByTagName('sv')[0]
  if (!svNuevo || svNuevo.getAttribute('id') !== svId) {
    console.error('El bloque reescrito no parsea como el mismo <sv>; no escribo.')
    process.exit(1)
  }
  const sigDespues = signatureOf(svNuevo)
  if (sigAntes !== sigDespues) {
    console.error('La firma Strong,posición cambiaría; no escribo.')
    process.exit(1)
  }

  const salida = src.slice(0, region.start) + nuevoTexto + src.slice(region.end)
  fs.writeFileSync(filepath, salida)
  console.log('escrito')
  console.log(`verificado: ${sigDespues.split(';').filter(Boolean).length} <wi> con Strong idéntico`)
}

main()
