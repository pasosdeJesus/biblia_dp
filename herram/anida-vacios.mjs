#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Anida cada <wi/> vacío dentro del <wi> que traduce su conjunto, para que la
// concordancia asocie el número griego a la palabra española que le
// corresponde en vez de a la del vecino:
//
//   <wi type="G" value="1722,22,"/><wi type="G" value="1537,25,">del</wi>
//   ->  <wi type="G" value="1537,25,"><wi type="G" value="1722,22,"/>del</wi>
//
// Solo actúa dentro de <t xml:lang="es">, porque fuera de la traducción el
// marcado corresponde a la referencia inglesa.
//
// Uso:
//   node herram/anida-vacios.mjs mateo          (simulación)
//   node herram/anida-vacios.mjs mateo --apply  (escribe libros/mateo.gbfxml)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DOMParser } from '@xmldom/xmldom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// Cuenta los elementos <wi> de un documento GBFXML. Sirve de comprobación:
// el reemplazo textual nunca debe crear ni perder marcado.
function contarWi(contenido) {
  const doc = new DOMParser().parseFromString(contenido, 'application/xml')
  const errores = doc.getElementsByTagName('parsererror')
  if (errores.length > 0) return { error: errores[0].textContent.trim() }
  return { total: doc.getElementsByTagName('wi').length }
}

// Solo se anidan los Strong que el español absorbe en otra palabra: el
// artículo y la preposición fundida en la contracción (G1722/G1519/G1537 +
// G3588 -> «del», «al»). El resto de los <wi/> vacíos puede deberse a una
// palabra griega sencillamente no traducida, y anidarlos daría a la
// concordancia un mapeo falso: se dejan como están y se informan aparte.
const SE_ANIDAN = new Set([3588, 1519, 1537, 1722])

const VACIO = /<wi type="G" value="([0-9]+,[0-9]+,)"\s*\/>/
const CON_TEXTO = /^<wi type="G" value="([0-9]+,[0-9]+,)">((?:(?!<wi|<\/wi>).)*?)<\/wi>/

function strongDe(valor) {
  return Number(valor.split(',')[0])
}

// Anida los <wi/> vacíos de un bloque de texto español que cumplen SE_ANIDAN.
// Devuelve también los que se dejan intactos, para poder revisarlos a mano.
function anidarBloque(bloque) {
  let resto = bloque
  const partes = []
  let anidados = 0
  const pendientes = []
  for (;;) {
    const vacio = resto.match(VACIO)
    if (!vacio) { partes.push(resto); break }
    const antes = resto.slice(0, vacio.index)
    const despues = resto.slice(vacio.index + vacio[0].length)
    const texto = despues.match(CON_TEXTO)
    if (!texto || !SE_ANIDAN.has(strongDe(vacio[1]))) {
      if (texto) pendientes.push({ valor: vacio[1], texto: texto[2] })
      partes.push(antes + vacio[0])
      resto = despues
      continue
    }
    partes.push(antes)
    partes.push(`<wi type="G" value="${texto[1]}"><wi type="G" value="${vacio[1]}"/>${texto[2]}</wi>`)
    resto = despues.slice(texto[0].length)
    anidados++
  }
  return { texto: partes.join(''), anidados, pendientes }
}

// Recorre el archivo y solo procesa los bloques entre <t xml:lang="es"> y </t>.
function anidarArchivo(contenido) {
  const trozos = contenido.split(/(<t xml:lang="es">|<\/t>)/)
  let dentro = false
  let total = 0
  const pendientes = []
  const salida = trozos.map(trozo => {
    if (trozo === '<t xml:lang="es">') { dentro = true; return trozo }
    if (trozo === '</t>') { dentro = false; return trozo }
    if (!dentro) return trozo
    const r = anidarBloque(trozo)
    total += r.anidados
    pendientes.push(...r.pendientes)
    return r.texto
  })
  return { texto: salida.join(''), anidados: total, pendientes }
}

function main() {
  const libro = process.argv[2]
  const apply = process.argv.includes('--apply')
  if (!libro) {
    console.log('Uso: node herram/anida-vacios.mjs <libro> [--apply]')
    process.exit(1)
  }
  const archivo = path.join(ROOT, 'libros', `${libro}.gbfxml`)
  if (!fs.existsSync(archivo)) {
    console.log(`No existe ${archivo}`)
    process.exit(1)
  }
  const original = fs.readFileSync(archivo, 'utf-8')
  const { texto, anidados, pendientes } = anidarArchivo(original)
  console.log(`${libro}: ${anidados} <wi/> vacío(s) anidado(s)`)
  if (pendientes.length) {
    console.log(`sin anidar (revisar si falta traducir la palabra): ${pendientes.length}`)
    for (const p of pendientes.slice(0, 15)) console.log(`  <wi ${p.valor}/> antes de «${p.texto}»`)
    if (pendientes.length > 15) console.log(`  ... y ${pendientes.length - 15} más`)
  }

  const antes = contarWi(original)
  const despues = contarWi(texto)
  if (despues.error) {
    console.log(`ERROR: el resultado no es XML válido: ${despues.error}`)
    process.exit(1)
  }
  if (antes.total !== despues.total) {
    console.log(`ERROR: cambió el número de <wi> (${antes.total} -> ${despues.total})`)
    process.exit(1)
  }
  console.log(`verificado: ${despues.total} <wi> antes y después`)

  if (apply && texto !== original) {
    fs.writeFileSync(archivo, texto)
    console.log('escrito')
  }
}

main()
