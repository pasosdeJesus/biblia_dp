#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Anida el artículo griego G3588 dentro de la palabra española que determina,
// usando la morfología Robinson de la KJV.
//
// Regla única: el artículo se anida en el <wi> cuyo orden griego es pos+1,
// siempre que sea nombre o adjetivo y su caso coincida con el del artículo.
// Los demás casos quedan sin tocar y se informan: ahí lo correcto es rellenar
// el <wi 3588/> con su propia palabra («EL» + «REY»), no anidarlo.
//
// Cuando un <w> de la OSIS fusiona varios Strong (G3588 + G935), cada uno
// recibe su propio morph de la lista robinson:..., en orden.
//
// Uso:
//   node herram/anida-articulos.mjs mateo          (simulación)
//   node herram/anida-articulos.mjs mateo --apply  (escribe libros/mateo.gbfxml)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const KJV = path.join(ROOT, 'ref', 'sword_kjv', 'capitulos2003')

const NOMBRE = {
  mateo: 'Matthew', marcos: 'Mark', lucas: 'Luke', juan: 'John', hechos: 'Acts',
  romanos: 'Romans', corintios1: 'I_Corinthians', corintios2: 'II_Corinthians',
  galatas: 'Galatians', efesios: 'Ephesians', filipenses: 'Philippians',
  colosenses: 'Colossians', tesalonicenses1: 'I_Thessalonians',
  tesalonicenses2: 'II_Thessalonians', timoteo1: 'I_Timothy',
  timoteo2: 'II_Timothy', tito: 'Titus', filemon: 'Philemon', hebreos: 'Hebrews',
  santiago: 'James', pedro1: 'I_Peter', pedro2: 'II_Peter', juan1: 'I_John',
  juan2: 'II_John', juan3: 'III_John', judas: 'Jude', apocalipsis: 'Revelation'
}

function codigoDe(m) {
  return (m || '').split('-')[1] || ''
}
function caso(m) {
  const c = codigoDe(m)
  return c === 'PRI' ? '' : c.slice(0, 1)
}
function numero(m) {
  const c = codigoDe(m)
  return c === 'PRI' || c.length < 3 ? '' : c.slice(2, 3)
}
function esNombreAdjetivo(m) { return /^[NA]/.test(m || '') }

const NO_DESTINO = new Set([
  846, 2532, 1161, 1063, 3754, 3767, 235, 3303, 1065, 686, 2228,
  3361, 3756, 5101, 302, 1437, 1487, 2443, 3739
])

const cacheMorfo = new Map()
function morfo(libro, cap) {
  const clave = `${libro}-${cap}`
  if (cacheMorfo.has(clave)) return cacheMorfo.get(clave)
  const archivo = path.join(KJV, `${NOMBRE[libro]}-${String(cap).padStart(2, '0')}.osis.xml`)
  if (!fs.existsSync(archivo)) { cacheMorfo.set(clave, []); return [] }

  const texto = fs.readFileSync(archivo, 'utf-8').split(/[\r\n]+/).join(' ')
  const re = /[$][$][$][^ ]+ ([0-9]+):([0-9]+)|<w\b([^>]*)>/g
  const salida = []
  let verso = [0, 0]
  let m
  while ((m = re.exec(texto))) {
    if (m[1]) { verso = [Number(m[1]), Number(m[2])]; continue }
    const attrs = m[3]
    if (!attrs) continue

    const lemma = (attrs.match(/lemma="([^"]*)"/) || [])[1] || ''
    const src = (attrs.match(/src="([^"]*)"/) || [])[1] || ''
    const morphs = (attrs.match(/robinson:[A-Z0-9-]+/g) || []).map(x => x.slice(9))
    const srcs = src.trim().split(/\s+/).filter(Boolean).map(Number).filter(Number.isFinite)
    const strongs = [...lemma.matchAll(/strong:G(\d+)/g)].map(x => Number(x[1]))

    strongs.forEach((strong, k) => {
      salida.push({
        strong,
        morph: morphs[k] || '',
        src: srcs[k] || srcs[0] || 0,
        cap: verso[0],
        vers: verso[1]
      })
    })
  }
  cacheMorfo.set(clave, salida)
  return salida
}

function palabrasDe(bloque) {
  const re = /<wi type="G" value="([0-9]+),([0-9]+),">((?:(?!<wi|<\/wi>).)*?)<\/wi>/g
  return [...bloque.matchAll(re)].map(w => ({
    strong: Number(w[1]), orden: Number(w[2]), texto: w[3]
  }))
}

function anidar(bloque, libro, cap, versiculo) {
  const morph = morfo(libro, cap).filter(e => e.vers === versiculo)
  if (!morph.length) return { texto: bloque, cambios: [], pendientes: [] }

  const porStrong = new Map()
  for (const e of morph) {
    if (!porStrong.has(e.strong)) porStrong.set(e.strong, [])
    porStrong.get(e.strong).push(e)
  }

  const palabras = palabrasDe(bloque)
  const articulos = [...bloque.matchAll(/<wi type="G" value="3588,([0-9]+),"/g)].map(a => Number(a[1]))
  const cambios = []
  const pendientes = []

  // Se trabaja sobre una lista de tokens (texto y marcadores) para poder mover
  // el artículo sin reconstruir el archivo con expresiones peligrosas.
  const cambiosTexto = []

  for (const pos of articulos) {
    const arts = porStrong.get(3588) || []
    const art = arts.find(a => a.src === pos) || null
    const casoArt = art ? caso(art.morph) : ''

    // Miembro inmediato: el <wi> cuyo Strong tiene su entrada en la OSIS en
    // la posición pos+1 del mismo verso.
    // El miembro inmediato puede estar fusionado con el artículo en el mismo
    // <w> de la OSIS: si el <wi> siguiente tiene el Strong número pos+1 en su
    // value, también vale.
    // Miembro determinado por el artículo: el <wi> cuyo orden es pos+1, o
    // aquel cuya entrada en la OSIS ocupa la posición pos+1 (casos en que el
    // español y el griego no numeran igual).
    const siguiente = palabras.find(w => !NO_DESTINO.has(w.strong) && w.orden === pos + 1) ||
      palabras.find(w => !NO_DESTINO.has(w.strong) &&
        (porStrong.get(w.strong) || []).some(e => e.src === pos + 1))

    const entrada = siguiente
      ? ((porStrong.get(siguiente.strong) || []).find(e => e.src === siguiente.orden) ||
         (porStrong.get(siguiente.strong) || []).find(e => e.src === pos + 1) ||
         (porStrong.get(siguiente.strong) || [])[0] ||
         null)
      : null

    const valido = entrada && esNombreAdjetivo(entrada.morph)

    if (!valido) {
      pendientes.push({ pos, morph: art ? art.morph : '?', siguiente: siguiente ? siguiente.texto : '-' })
      continue
    }

    cambiosTexto.push({ pos, siguiente })
  }

  let texto = bloque
  for (const { pos, siguiente } of cambiosTexto) {
    // Hueco entre el artículo vacío y su palabra (puede incluir saltos de línea).
    const reArt = new RegExp(`<wi type="G" value="3588,${pos},"[^>]*/>\s*(?=<wi type="G" value="${siguiente.strong},${siguiente.orden},">)`)
    const m = texto.match(reArt)
    if (!m) {
      pendientes.push({ pos, morph: '?', siguiente: siguiente.texto })
      continue
    }
    const hueco = m[0].slice(`<wi type="G" value="3588,${pos},"/>`.length)
    texto = texto.replace(reArt, '')
    texto = texto.replace(
      `<wi type="G" value="${siguiente.strong},${siguiente.orden},">`,
      `<wi type="G" value="${siguiente.strong},${siguiente.orden},"><wi type="G" value="3588,${pos},"/>${hueco}`
    )
    cambios.push({ pos, texto: siguiente.texto })
  }

  return { texto, cambios, pendientes }
}

function contarWi(contenido) {
  const doc = new DOMParser().parseFromString(contenido, 'application/xml')
  const errores = doc.getElementsByTagName('parsererror')
  if (errores.length > 0) return { error: errores[0].textContent.trim() }
  return { total: doc.getElementsByTagName('wi').length }
}

function main() {
  const libro = process.argv[2]
  const apply = process.argv.includes('--apply')
  if (!libro) {
    console.log('Uso: node herram/anida-articulos.mjs <libro> [--apply]')
    process.exit(1)
  }
  const archivo = path.join(ROOT, 'libros', `${libro}.gbfxml`)
  if (!fs.existsSync(archivo)) {
    console.log(`No existe ${archivo}`)
    process.exit(1)
  }

  const original = fs.readFileSync(archivo, 'utf-8')
  // Se conserva el encabezado del verso para poder volver a unirlo: la
  // traducción de un versículo puede abarcar varios <t> (notas incluidas).
  const partes = original.split(/(<cm[^>]*>|<sv id="[^"]*">|<\/sv>)/)

  let cap = 0
  let versiculo = 0
  let dentro = false
  let total = 0
  const pendientes = []

  const salida = partes.map(parte => {
    const mv = parte.match(/^<sv id="[^-]+-(\d+)-(\d+)"/)
    if (mv) { cap = Number(mv[1]); versiculo = Number(mv[2]); dentro = true }
    else if (parte.startsWith('<cm') || parte === '</sv>') dentro = false
    if (!dentro) return parte

    const r = anidar(parte, libro, cap, versiculo)
    total += r.cambios.length
    pendientes.push(...r.pendientes.map(p => ({ cap, versiculo, ...p })))
    return r.texto
  }).join('')

  console.log(`${libro}: ${total} artículo(s) anidado(s)`)
  if (pendientes.length) {
    console.log(`sin anidar (revisar: pospuesto, verbo o sin miembro pos+1): ${pendientes.length}`)
    for (const p of pendientes.slice(0, 10)) {
      console.log(`  ${p.cap}:${p.versiculo} 3588,${p.pos} (${p.morph}) antes de «${p.siguiente}»`)
    }
  }

  const despues = contarWi(salida)
  if (despues.error) {
    console.log(`ERROR: el resultado no es XML válido: ${despues.error}`)
    process.exit(1)
  }
  console.log(`verificado: ${despues.total} <wi>`)

  if (apply && salida !== original) {
    fs.writeFileSync(archivo, salida)
    console.log('escrito')
  }
}

main()
