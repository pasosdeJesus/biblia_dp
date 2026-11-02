import fs from 'fs'
import path from 'path'
import { DOMParser } from '@xmldom/xmldom'
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const fp = path.join(ROOT, 'libros', 'mateo.gbfxml')
const KJV_DIR = path.join(ROOT, 'ref', 'sword_kjv')

const morphs = new Map()
for (const f of fs.readdirSync(KJV_DIR).filter(f => f.endsWith('.osis.xml'))) {
  const text = fs.readFileSync(path.join(KJV_DIR, f), 'utf-8')
  const re = /<w\b([^>]*?)(?:\/>|>)/g; let m
  while ((m = re.exec(text))) {
    const lm = m[1].match(/lemma="([^"]*)"/); const mo = m[1].match(/morph="robinson:([^"]*)"/)
    if (!lm || !mo) continue
    for (const g of [...lm[1].matchAll(/strong:G(\d+)/g)].map(x=>x[1])) { if(!morphs.has(g))morphs.set(g,new Set()); morphs.get(g).add(mo[1]) }
  }
}
const FUNC = new Set(['de','del','el','la','lo','los','las','a','al','un','una','unos','unas','por','para','en','con','sin','sobre','hacia','según','contra','desde','hasta','entre','ante','tras','mediante','durante'])
function childNodesArr(el){const a=[];for(let i=0;i<el.childNodes.length;i++)a.push(el.childNodes[i]);return a;}
function textOf(n){const p=[];function w(x){if(x.nodeType===3){p.push(x.nodeValue);return;}if(x.nodeType!==1)return;if(x.tagName==='rf')return;for(const c of childNodesArr(x))w(c);}w(n);return p.join('');}

const doc = new DOMParser().parseFromString(fs.readFileSync(fp,'utf-8'),'application/xml')
const wis = doc.getElementsByTagName('wi')
const out = []
for (let i=0;i<wis.length;i++) {
  const wi = wis[i]
  if (wi.getAttribute('type') !== 'G') continue
  const value = wi.getAttribute('value') || ''
  const mm = value.match(/^(\d+),(\d+),?/); if(!mm) continue
  const strong = mm[1], pos = mm[2]
  const txt = textOf(wi).replace(/\s+/g,' ').trim().toLowerCase()
  if (!FUNC.has(txt)) continue
  const ms = morphs.get(strong); if(!ms) continue
  if (![...ms].every(m=>/N-|ARAM/.test(m))) continue
  // buscar el sustantivo real: GC con mismo pos, o texto suelto siguiente
  let noun = ''
  // 1) GC en el mismo <sv>
  let sv=wi; while(sv && sv.tagName!=='sv') sv=sv.parentNode
  if (sv) {
    const gcs = sv.getElementsByTagName('wi')
    for (let j=0;j<gcs.length;j++) {
      const gc = gcs[j]
      if (gc.getAttribute('type')==='GC' && gc.getAttribute('value')===pos) {
        noun = textOf(gc).replace(/\s+/g,' ').trim(); break
      }
    }
  }
  // 2) texto suelto siguiente
  if (!noun) {
    const nx = wi.nextSibling
    if (nx && nx.nodeType===3) {
      const t = nx.nodeValue.replace(/\s+/g,' ').trim()
      const w = t.match(/^([A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)/)
      if (w && !FUNC.has(w[1].toLowerCase())) noun = w[1]
    }
  }
  out.push({ v: sv ? sv.getAttribute('id') : '?', strong, txt, noun })
}
// agrupar por patrón de función
const seen = new Set()
for (const o of out) {
  const key = `${o.v}|${o.strong}|${o.txt}`
  if (seen.has(key)) continue; seen.add(key)
  console.log(`${o.v}\tG${o.strong}\t«${o.txt}»\t→\t«${o.noun || '?'}»`)
}
console.log(`\nTotal casos (únicos): ${seen.size}`)
