#!/usr/bin/env node
// -*- coding: utf-8 -*-
// Normaliza el artículo griego G3588 en un libro GBFXML.
//
// Formas de destino:
//   1. Con artículo:      <wi 3588,14>EL</wi>   <wi 935,15>REY</wi>
//   2. Vacío:             <wi 935,15><wi 3588,14/>REY</wi>
//   3. Dudoso:            se deja intacto y se informa.
//
// Localiza cada <sv> por líneas (abre en la de «<sv …>», cierra en la de
// «</sv>») y parsea solo ese bloque: una regex sobre el archivo completo se
// trunca cuando el versículo lleva «</sv>» dentro de <rb>, <rf> o <fr>.
//
// Uso:
//   node herram/normaliza-3588.mjs mateo            (simulación, todo)
//   node herram/normaliza-3588.mjs mateo --apply    (escribe)
//   node herram/normaliza-3588.mjs mateo --verbose  (lista cada caso)
//
// Modos (sin modo se ejecuta todo; con modo se restringe el tipo de arreglo):
//   --solo-articulos      extrae artículos simples («el», «la», «los»…)
//   --solo-que            extrae el relativo «que»
//   --solo-contracciones  extrae «del», «al», «en el», «por el»…
//
// Verificación: el número de <wi> y el conjunto Strong,posición de cada
// versículo deben quedar idénticos; si no, aborta sin escribir.

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

// Artículos que puede absorber G3588. Incluye mayúsculas sostenidas
// (rótulos como «EL REY»). Los más largos primero.
const ARTICULOS = [
  'DE LOS', 'DE LAS', 'DE LA', 'DE', 'A LOS', 'A LAS', 'A LA', 'AL',
  'LOS', 'LAS', 'EL', 'LA',
  'de los', 'de las', 'de la', 'de una', 'de un',
  'a los', 'a las', 'a la', 'a una', 'a un',
  'en los', 'en las', 'en el', 'en la',
  'por los', 'por las', 'por el', 'por la',
  'los que', 'las que', 'el que', 'la que',
  'del', 'al',
  'Los', 'Las', 'El', 'La', 'Un', 'Una',
  'los', 'las', 'el', 'la', 'un', 'una', 'de', 'a', 'que'
]

function codigo(m) { return (m || '').split('-')[1] || '' }
function casoGramatical(m) {
  const c = codigo(m)
  return c === 'PRI' ? '' : c.slice(0, 1)
}
function esNombreAdjetivo(m) { return /^[NA]/.test(m || '') }

// ¿Puede la palabra española de este Strong absorber el artículo griego?
// El artículo griego ante nombres propios, verbos y pronombres no se traduce:
// «ὁ Ἰησοῦς» es «Jesús», no «el Jesús». En esos casos el <wi/> de G3588 debe
// quedar suelto y explícito, no anidarse dentro de la palabra (ver
// doc/gbfxml.md §3.3 y REQ/10.md §3).
function absorbeArticulo(morph, texto) {
  const tipo = (morph || '').split('-')[0]
  // Propio, verbo, pronombre personal/relativo/demostrativo, partícula,
  // preposición, conjunción, adverbio, número, interjección: no absorben.
  if (/^(N-PRI|V-|P-|R-|T-|PREP|CONJ|ADV|PRT|COND|INJ|NUI|A-NUI|F-|X-)/.test(morph || '')) return false
  if (!/^[NA]/.test(morph || '')) return false
  // Sustantivo o adjetivo común: solo si el texto empieza por artículo o
  // relativo («el», «la», «los», «las», «lo que», «el que»).
  return /^(el|la|los|las|lo)/i.test((texto || '').trim())
}


// Devuelve [artículo, resto] o [null, texto].
function extraerArticulo(texto) {
  const limpio = texto.trim()
  for (const articulo of ARTICULOS) {
    const BS = String.fromCharCode(92)
    const re = new RegExp('^' + articulo.split(' ').join(BS + 's+') + '(?=' + BS + 's|$)')
    const m = limpio.match(re)
    if (m) return [articulo, limpio.slice(m[0].length).trim()]
  }
  return [null, limpio]
}

// ── Morfología Robinson de la KJV, por capítulo ──
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
        vers: verso[1]
      })
    })
  }
  cacheMorfo.set(clave, salida)
  return salida
}

// ── utilidades DOM ──
function hijos(el) {
  const arr = []
  for (let i = 0; i < el.childNodes.length; i++) arr.push(el.childNodes[i])
  return arr
}
function textoDe(nodo) {
  let t = ''
  for (const c of hijos(nodo)) {
    if (c.nodeType === 3) t += c.nodeValue
    else if (c.nodeType === 1) t += textoDe(c)
  }
  return t
}
function valorDe(nodo) {
  if (!nodo.getAttribute) return null
  const m = (nodo.getAttribute('value') || '').match(/^([0-9]+),([0-9]+),/)
  return m ? { strong: Number(m[1]), orden: Number(m[2]) } : null
}
const NL = String.fromCharCode(10)

function crearWi(doc, valor, texto) {
  const wi = doc.createElement('wi')
  wi.setAttribute('type', 'G')
  wi.setAttribute('value', valor)
  if (texto) wi.appendChild(doc.createTextNode(texto))
  return wi
}
function ponerTexto(doc, wi, texto) {
  while (wi.firstChild) wi.removeChild(wi.firstChild)
  if (texto) wi.appendChild(doc.createTextNode(texto))
}


// Todos los descendientes elemento de un nodo, en orden de documento,
// congelados en un arreglo (no una vista viva como getElementsByTagName).
function descendientes(nodo, salida = []) {
  for (const c of hijos(nodo)) {
    if (c.nodeType !== 1) continue
    salida.push(c)
    descendientes(c, salida)
  }
  return salida
}

// ── Procesa un verso ──
function procesarVerso(sv, doc, libro, cap, versiculo, verbose, modo) {
  const morph = morfo(libro, cap).filter(e => e.vers === versiculo)
  const entradaDe = (strong, orden) =>
    morph.filter(e => e.strong === strong).find(e => e.src === orden) || null

  const informe = { conTexto: 0, anidados: 0, desanidados: 0, sinDestino: 0, yaAnidado: 0,
                    articuloDelSiguiente: 0, textoEnHijo: 0, sinMorfologia: 0, noAbsorbe: 0, textoFueraEntre: 0,
                    fueraDeModo: 0, textoFueraEntre: 0, articuloInexistente: 0, articuloNoContiguo: 0, indeterminado: 0 }
  // getElementsByTagName devuelve una vista viva: al mover nodos la lista
  // cambia y se saltan elementos. Se congelan los nodos en un arreglo.
  const wis = descendientes(sv).filter(n => n.tagName === 'wi')

  for (const wi of wis) {
    const v = valorDe(wi)
    if (!v || v.strong !== 3588) continue

    const subWi = hijos(wi).filter(n => n.nodeType === 1 && n.tagName === 'wi')
    const propio = textoDe(wi)
    const deSub = subWi.map(textoDe).join('')

    // Forma correcta: <wi X><wi 3588/>texto</wi> (el texto está en el hijo).
    // También cuenta el caso en que la palabra es toda del hijo y el artículo
    // va vacío dentro de él: <wi 3588/> dentro del <wi> que traduce.
    if (subWi.length > 0 && propio.replace(deSub, '').trim() === '') {
      informe.yaAnidado++
      continue
    }

    // Ya tiene su propio texto y ningún <wi> interior: correcto.
    if (subWi.length === 0 && propio.trim()) { informe.conTexto++; continue }

    // Caso A: hay otra palabra dentro del <wi> de G3588. El español debe
    // separarla; NUNCA se elimina el <wi> interior (perdería su Strong).
    if (subWi.length > 0) {
      const hijo = subWi[subWi.length - 1]
      const [art, resto] = extraerArticulo(textoDe(hijo))
      const padre = wi.parentNode
      if (art && resto) {
        const nuevo = crearWi(doc, `3588,${v.orden},`, art)
        padre.insertBefore(nuevo, wi)
        ponerTexto(doc, hijo, resto)
        // insertBefore desacopla el nodo de su padre anterior: no hacer
        // removeChild antes, porque el nodo aún no está enlazado y se perdería.
        padre.insertBefore(hijo, wi)
        padre.removeChild(wi)
        informe.desanidados++
        if (verbose) console.log(`  ${cap}:${versiculo} separar «${art}» + «${resto}» (3588,${v.orden})`)
      } else {
        padre.removeChild(wi)
        hijo.insertBefore(crearWi(doc, `3588,${v.orden},`), hijo.firstChild)
        informe.anidados++
      }
      continue
    }

    // Vacío: el artículo debe anidarse. Primero se intenta extraerlo de la
    // palabra siguiente si esta lo arrastra («EL REY» -> «el» + «REY»).
    const hermanos = hijos(wi.parentNode)
    const idx = hermanos.indexOf(wi)
    // Solo bloquea si hay TEXTO con contenido entre el <wi/> y el <wi>
    // siguiente. Las etiquetas y los espacios en blanco son normales.
    let posSig = -1
    for (let k = idx + 1; k < hermanos.length; k++) {
      const n = hermanos[k]
      if (n.nodeType === 1 && n.tagName === 'wi' && textoDe(n).trim()) { posSig = k; break }
    }
    const intermedios = posSig === -1 ? [] : hermanos.slice(idx + 1, posSig)
      .filter(n => n.nodeType === 3 && n.nodeValue.trim())
    const siguiente = posSig === -1 ? null : hermanos[posSig]
    // Si entre el <wi/> vacío y la palabra hay texto o etiquetas sueltas
    // («<wi 3588,1/>En»), extraer el artículo movería texto de fuera del
    // <wi>: se omite y se informa.
    if (siguiente && intermedios.length > 0) {
      informe.textoFueraEntre++
      if (verbose) console.log(`  ${cap}:${versiculo} 3588,${v.orden} con texto suelto entre <wi>; se omite`)
      continue
    }
    if (siguiente) {
      // Solo se extrae artículo si el G3588 de esta posición es de verdad un
      // artículo según la morfología Robinson (T-). Si en el griego esa
      // posición es otra cosa, «el/la/los» del texto español es añadido y no
      // debe asignarse a G3588 (Filipenses 3:3, 2 Co 6:7 y 12:18, 1 Co 1:10).
      const entradaArt = entradaDe(3588, v.orden)
      if (entradaArt && entradaArt.morph && !/^T-/.test(entradaArt.morph)) {
        informe.articuloInexistente = (informe.articuloInexistente || 0) + 1
        if (verbose) console.log(`  ${cap}:${versiculo} 3588,${v.orden} no es articulo (${entradaArt.morph}); no se extrae`)
        continue
      }
      // El artículo debe ser contiguo en el orden griego a la palabra que lo
      // absorbe. En Filipenses 3:3 el G3588 src=6 va al final («οἱ ... καίπερ»),
      // no junto a πνεύματι (src=7): esa posición es un error de marcado.
      const valsSig = valorDe(siguiente)
      if (entradaArt && valsSig) {
        const posArt = entradaArt.src
        if (posArt && Math.abs(posArt - valsSig.orden) !== 1) {
          informe.articuloNoContiguo = (informe.articuloNoContiguo || 0) + 1
          if (verbose) console.log(`  ${cap}:${versiculo} 3588,${v.orden} (src ${posArt}) no es contiguo a ${valsSig.strong},${valsSig.orden}; no se extrae`)
          continue
        }
      }
      const texto = textoDe(siguiente).trim()
      const [art, resto] = extraerArticulo(texto)
      const mayusculas = texto === texto.toUpperCase()
      // Salvaguarda: el texto fuera de los <wi> no se toca. Si el original trae
      // palabras sueltas pegadas al <wi> («<wi/>En»), el artículo extraído no
      // debe cambiar la capitalización ni el orden del texto en español.
      const soloDentro = texto === textoDe(siguiente).trim()
      if (art && resto && soloDentro && !/^(de|a)$/i.test(art) && (mayusculas || resto !== texto)) {
        const grupo = grupoDe(art)
        // «un/una» delante del articulo griego determinado es uso idiomatico
        // del espanol (1 Co 1:10 «en una misma mente» para τῇ αὐτῇ): se
        // informa y no se toca, ni siquiera en modo «todo».
        if (grupo === 'indeterminado') {
          informe.indeterminado++
          if (verbose) console.log(`  ${cap}:${versiculo} «${art}» delante de articulo determinado (3588,${v.orden}); idiomatico, no se extrae`)
          continue
        }
        const coincide = modo === 'articulos'
          ? grupo === 'determinados'
          : grupo === modo
        if (modo !== 'todo' && !coincide) {
          informe.fueraDeModo++
          continue
        }
        // ponerTexto vacía los hijos: si «siguiente» tenía a su vez un <wi>
        // interior (Strong vacío), se perdería. Se leen los valores ANTES de
        // reescribir el texto y se reinsertan.
        const interiores = hijos(siguiente)
          .filter(n => n.nodeType === 1 && n.tagName === 'wi')
          .map(n => n.getAttribute('value'))
        ponerTexto(doc, wi, art)
        ponerTexto(doc, siguiente, resto)
        for (const val of interiores) siguiente.insertBefore(crearWi(doc, val, ''), siguiente.firstChild)
        // Un <wi> por línea en el texto español (doc/estilo-gbfxml.md).
        siguiente.parentNode.insertBefore(doc.createTextNode(NL), siguiente)
        informe.articuloDelSiguiente++
        if (verbose) console.log(`  ${cap}:${versiculo} extraer «${art}» de «${texto}» (3588,${v.orden})`)
        continue
      }
    }

    // Caso C: anidar en la palabra cuyo Strong ocupa pos+1 en la OSIS.
    // Si no hay morfología disponible (libro sin OSIS o versículo sin datos) no
    // se adivina el destino: se informa y se deja intacto.
    const art = entradaDe(3588, v.orden)
    if (morph.length === 0) {
      informe.sinMorfologia++
      if (verbose) console.log(`  ${cap}:${versiculo} 3588,${v.orden} sin morfología; intacto`)
      continue
    }
    const casoArt = art ? casoGramatical(art.morph) : ''
    const srcMiembro = new Set([v.orden + 1])
    if (art && art.src) srcMiembro.add(art.src)

    const candidatos = hermanos
      .map(nodo => ({ nodo, valores: valorDe(nodo) }))
      .filter(x => x.valores && x.valores.strong !== 3588)
      .map(x => ({ ...x, entrada: entradaDe(x.valores.strong, x.valores.orden) }))
      .filter(x => x.entrada && srcMiembro.has(x.entrada.src))
      .filter(x => absorbeArticulo(x.entrada.morph, textoDe(x.nodo)))

    const concordantes = candidatos.filter(x => {
      const cc = casoGramatical(x.entrada.morph)
      return !casoArt || !cc || cc === casoArt
    })
    const destino = (concordantes[0] || candidatos[0] || {}).nodo || null

    if (!destino) {
      informe.sinDestino++
      informe.noAbsorbe++
      if (verbose) console.log(`  ${cap}:${versiculo} 3588,${v.orden} sin destino claro`)
      continue
    }

    destino.insertBefore(wi, destino.firstChild)
    informe.anidados++
    if (verbose) console.log(`  ${cap}:${versiculo} anidar 3588,${v.orden} en <wi ${destino.getAttribute('value')}>`)
  }

  return informe
}

function contarWi(texto) {
  const doc = new DOMParser().parseFromString(texto, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) return null
  return doc.getElementsByTagName('wi').length
}

// Modos de trabajo. Sin modo se ejecuta todo. Los modos restringen qué tipo de
// arreglo se aplica, para poder revisarlos por separado:
//   --solo-articulos      extrae artículos simples («el», «la», «los»…)
//   --solo-que            extrae el relativo «que»
//   --solo-contracciones  extrae «del», «al», «en el», «por el»…
// Los tres exigen combinarse con --apply para escribir.
function modoDesde(argv) {
  if (argv.includes('--solo-determinados')) return 'determinados'
  if (argv.includes('--solo-indeterminados')) return 'indeterminado'
  if (argv.includes('--solo-articulos')) return 'articulos'
  if (argv.includes('--solo-que')) return 'que'
  if (argv.includes('--solo-contracciones')) return 'contracciones'
  return 'todo'
}

// Clasifica el artículo que se extrajo de la palabra siguiente, para saber si
// el modo activo permite aplicarlo.
const CONTRACCIONES = new Set(['del', 'al', 'en el', 'en la', 'en los', 'en las',
  'por el', 'por la', 'por los', 'por las', 'de los', 'de las', 'de la', 'a los',
  'a las', 'a la'])
function grupoDe(art) {
  if (!art) return 'ninguno'
  const a = art.toLowerCase()
  if (a === 'que' || a.endsWith(' que')) return 'que'
  if (CONTRACCIONES.has(a)) return 'contracciones'
  // «un/una» no es traduccion del articulo griego determinado: el espanol
  // idiomatico lo usa donde el griego lleva el articulo (1 Co 1:10
  // «en una misma mente» para τῇ αὐτῇ). No se extrae: se deja el <wi/> vacio.
  if (/^(un|una|unos|unas)$/i.test(a)) return 'indeterminado'
  return 'determinados'
}

function main() {
  const libro = process.argv[2]
  const apply = process.argv.includes('--apply')
  const verbose = process.argv.includes('--verbose')
  const modo = modoDesde(process.argv)
  if (!libro) {
    console.log('Uso: node herram/normaliza-3588.mjs <libro> [--apply] [--verbose]')
    console.log('     [--solo-articulos | --solo-que | --solo-contracciones]')
    process.exit(1)
  }
  const archivo = path.join(ROOT, 'libros', `${libro}.gbfxml`)
  if (!fs.existsSync(archivo)) { console.log(`No existe ${archivo}`); process.exit(1) }

  const original = fs.readFileSync(archivo, 'utf-8')

  // Se trabaja al nivel de línea: cada <sv ...> abre en una línea y cierra en
  // la que contiene «</sv>». Así no se depende del DOM para localizar bloques
  // (que falla con «</sv>» dentro de <rb>/<rf>/<fr> ni para serializar).
  const lineas = original.split(String.fromCharCode(10))
  const total = { conTexto: 0, anidados: 0, desanidados: 0, sinDestino: 0, yaAnidado: 0,
                  articuloDelSiguiente: 0, textoEnHijo: 0, sinMorfologia: 0, noAbsorbe: 0, textoFueraEntre: 0,
                    fueraDeModo: 0, textoFueraEntre: 0, articuloInexistente: 0, articuloNoContiguo: 0, indeterminado: 0 }
  let modificados = 0
  let i = 0
  while (i < lineas.length) {
    const apertura = lineas[i].match(/^(\s*)<sv id="([^"]+)"[^>]*>\s*$/)
    if (!apertura) { i++; continue }
    const sangria = apertura[1]
    const id = apertura[2]
    const mv = id.match(/-(\d+)-(\d+)$/)
    if (!mv) { i++; continue }
    // El cierre puede venir en la misma línea que otra etiqueta
    // («</sv></cm>»). Se toma solo hasta «</sv>» y se guarda el resto para
    // reinsertarlo, o se perdería el </cm>.
    let fin = i
    while (fin < lineas.length && !/^\s*<\/sv>/.test(lineas[fin])) fin++
    if (fin >= lineas.length) break
    const colaDeFin = (lineas[fin].match(/^\s*<\/sv>([\s\S]*)$/) || [])[1] || ''

    const bloque = lineas.slice(i, fin + 1).join(String.fromCharCode(10))
    const doc = new DOMParser().parseFromString(bloque, 'application/xml')
    if (doc.getElementsByTagName('parsererror').length) {
      console.log(`ADVERTENCIA: ${id} no parsea; se omite`)
      i = fin + 1
      continue
    }
    const sv = doc.documentElement
    const r = procesarVerso(sv, doc, libro, Number(mv[1]), Number(mv[2]), verbose, modo)
    for (const k of Object.keys(total)) total[k] += r[k]
    // «conTexto» cuenta estados ya correctos, no cambios: no debe provocar
    // escritura. Solo se reescribe el <sv> si hubo una modificación real.
    if (r.anidados + r.desanidados + r.articuloDelSiguiente > 0) {
      const nuevoBloque = sv.toString().trimEnd()
      const nuevas = nuevoBloque.split(String.fromCharCode(10))
      if (colaDeFin) nuevas[nuevas.length - 1] += colaDeFin
      lineas.splice(i, fin - i + 1, ...nuevas)
      modificados++
      i += nuevoBloque.split(String.fromCharCode(10)).length
      continue
    }
    i = fin + 1
  }

  const salida = lineas.join(String.fromCharCode(10))
  if (process.env.DUMP_3588) fs.writeFileSync(path.join(ROOT,'out3588.tmp'), salida)
  fs.writeFileSync(path.join(ROOT,'out3588.tmp'), salida)

  console.log(`${libro}:${modo === 'todo' ? '' : ` (modo: ${modo})`}`)
  console.log(`  con contenido:      ${total.conTexto}`)
  console.log(`  ya anidados:        ${total.yaAnidado}`)
  console.log(`  anidados nuevos:    ${total.anidados}`)
  console.log(`  separados:          ${total.desanidados}`)
  console.log(`  sin destino:        ${total.sinDestino}`)
  console.log(`  art. del siguiente: ${total.articuloDelSiguiente}`)
  console.log(`  sin morfología:     ${total.sinMorfologia}`)
  console.log(`  no absorben art.:   ${total.noAbsorbe}`)
  if (modo !== 'todo') console.log(`  fuera del modo «${modo}»: ${total.fueraDeModo}`)
  if (total.textoFueraEntre) console.log(`  omitidos (texto suelto entre <wi>): ${total.textoFueraEntre}`)
  if (total.articuloInexistente) console.log(`  omitidos (G3588 no es articulo en la morfologia): ${total.articuloInexistente}`)
  if (total.articuloNoContiguo) console.log(`  omitidos (G3588 no contiguo en el griego): ${total.articuloNoContiguo}`)
  if (total.indeterminado) console.log(`  omitidos (un/una idiomatico): ${total.indeterminado}`)
  console.log(`  versículos tocados: ${modificados}`)

  // El conjunto Strong,posición por versículo no debe cambiar: G3588 solo se
  // mueve de sitio, no se crea ni se borra.
  // El documento completo puede contener «</sv>» dentro de <rb>/<rf>/<fr>, que
  // confunde al parser: la firma se toma bloque por bloque, delimitado por
  // líneas, que es la misma unidad con la que se escribió.
  const bloquesDe = texto => {
    const ls = texto.split(String.fromCharCode(10))
    const out = new Map()
    let i = 0
    while (i < ls.length) {
      const m = ls[i].match(/^\s*<sv id="([^"]+)"/)
      if (!m) { i++; continue }
      let fin = i
      while (fin < ls.length && !/^\s*<\/sv>/.test(ls[fin])) fin++
      out.set(m[1], ls.slice(i, fin + 1).join(String.fromCharCode(10)))
      i = fin + 1
    }
    return out
  }
  const firma = texto => {
    const out = new Map()
    for (const [id, bloque] of bloquesDe(texto)) {
      const d = new DOMParser().parseFromString(bloque, 'application/xml')
      if (d.getElementsByTagName('parsererror').length) return null
      const sv = d.documentElement
      const vals = Array.from(sv.getElementsByTagName('wi'))
        .map(w => (w.getAttribute('value') || '').replace(/^[A-Za-z]*/, '').replace(/,$/, ''))
        .filter(Boolean)
        .sort()
      out.set(id, vals.join(' '))
    }
    return out
  }

  const antes = contarWi(original)
  const despues = contarWi(salida)
  if (despues === null) { console.log('ERROR: XML inválido en el resultado'); process.exit(1) }
  const antesAbiertos = (original.match(/<wi(?=[\s>\/])/g) || []).length
  const antesCierres = (original.match(/<\/wi>/g) || []).length
  const antesTotal = antesAbiertos + antesCierres
  const despuesAbiertos = (salida.match(/<wi(?=[\s>\/])/g) || []).length
  const despuesCierres = (salida.match(/<\/wi>/g) || []).length
  if (process.env.DEBUG_3588) console.error(`  [dbg] aperturas ${antesAbiertos}->${despuesAbiertos} cierres ${antesCierres}->${despuesCierres}`)
  // El serializer puede escribir <wi/> como <wi></wi> o al revés; lo que no
  // puede cambiar es el total de elementos <wi>.
  if (antesAbiertos !== despuesAbiertos) {
    console.log(`ERROR: cambió el número de <wi> (${antesAbiertos} -> ${despuesAbiertos})`)
    process.exit(1)
  }

  const fa = firma(original)
  const fb = firma(salida)
  if (!fa || !fb) { console.log('ERROR: no se pudo verificar el conjunto de Strong'); process.exit(1) }
  const rotos = [...fa.keys()].filter(k => fa.get(k) !== fb.get(k))
  if (rotos.length > 0) {
    console.log(`ERROR: cambió el conjunto Strong,posición en ${rotos.length} versículo(s): ${rotos.slice(0, 5).join(', ')}`)
    process.exit(1)
  }

  console.log(`  verificado: ${despues} <wi>, ${fa.size} versículos con Strong idéntico`)

  if (apply) {
    fs.writeFileSync(archivo, salida)
    console.log('  escrito')
  }
}

main()
