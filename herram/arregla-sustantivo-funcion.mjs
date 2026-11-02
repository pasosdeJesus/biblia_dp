#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * Corrige <wi> de sustantivos etiquetados con una palabra funcional
 * (artículo/preposición). Ejemplo:
 *   <wi value="3588,7,"/><wi value="5590,8,">por</wi> ... <wi type="GC" value="8">vida</wi>
 * →
 *   <wi value="3588,7,">por</wi><wi value="5590,8,">vida</wi> ... (GC eliminado)
 *
 * Uso:
 *   node herram/arregla-sustantivo-funcion.mjs [libro] [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const KJV_DIR = path.join(ROOT, 'ref', 'sword_kjv');

const FUNC = new Set(['de','del','el','la','lo','los','las','a','al','un','una','unos','unas','por','para','en','con','sin','sobre','hacia','según','contra','desde','hasta','entre','ante','tras','mediante','durante']);

// Mapa Strong → morfologías (para saber qué Strong es sustantivo)
function buildMorphs() {
  const morphs = new Map();
  for (const f of fs.readdirSync(KJV_DIR).filter(f => f.endsWith('.osis.xml'))) {
    const text = fs.readFileSync(path.join(KJV_DIR, f), 'utf-8');
    const re = /<w\b([^>]*?)(?:\/>|>)/g; let m;
    while ((m = re.exec(text))) {
      const lm = m[1].match(/lemma="([^"]*)"/);
      const mo = m[1].match(/morph="robinson:([^"]*)"/);
      if (!lm || !mo) continue;
      const strongs = [...lm[1].matchAll(/strong:G(\d+)/g)].map(x => x[1]);
      const codes = mo[1].split(/\s+/).map(s => s.replace(/^robinson:/, '')).filter(Boolean);
      if (strongs.length !== codes.length) continue; // apareo posicional defensivo
      strongs.forEach((g, i) => {
        if (!morphs.has(g)) morphs.set(g, new Set());
        morphs.get(g).add(codes[i]);
      });
    }
  }
  return morphs;
}
const morphs = buildMorphs();
const isNoun = s => { const ms = morphs.get(s); return !!ms && [...ms].every(m => m === 'ARAM' || /^N-/.test(m)); };

function childNodesArr(el) { const a = []; for (let i = 0; i < el.childNodes.length; i++) a.push(el.childNodes[i]); return a; }
function textOf(n) { const p = []; function w(x){ if(x.nodeType===3){p.push(x.nodeValue);return;} if(x.nodeType!==1)return; if(x.tagName==='rf')return; for(const c of childNodesArr(x)) w(c);} w(n); return p.join(''); }
function verseIdOf(node) { let cur = node; while (cur) { if (cur.tagName === 'sv') return cur.getAttribute('id'); cur = cur.parentNode; } return '?'; }

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const book = args.find(a => !a.startsWith('--')) || 'mateo';
  const fp = path.join(ROOT, 'libros', `${book}.gbfxml`);
  if (!fs.existsSync(fp)) { console.error(`No existe ${fp}`); process.exit(1); }

  const original = fs.readFileSync(fp, 'utf-8');
  const doc = new DOMParser().parseFromString(original, 'application/xml');
  const wis = doc.getElementsByTagName('wi');
  let cambios = 0;
  let omitidos = 0;
  const omitidoDetalles = [];
  let sinGC = 0;
  const sinGCDetalles = [];

  for (let i = 0; i < wis.length; i++) {
    const wi = wis[i];
    if (wi.getAttribute('type') !== 'G') continue;
    const value = wi.getAttribute('value') || '';
    const mm = value.match(/^(\d+),(\d+),?/);
    if (!mm) continue;
    const strong = mm[1], pos = mm[2];
    const txt = textOf(wi).replace(/\s+/g, ' ').trim();
    if (!FUNC.has(txt.toLowerCase())) continue;
    if (!isNoun(strong)) continue;

    // Encontrar el sustantivo real: GC con la misma posición
    const sv = wi.parentNode;
    let gc = null;
    const svEls = sv.getElementsByTagName ? sv.getElementsByTagName('wi') : [];
    for (let j = 0; j < svEls.length; j++) {
      const g = svEls[j];
      if (g.getAttribute('type') === 'GC' && g.getAttribute('value') === pos) { gc = g; break; }
    }
    if (!gc) { sinGC++; sinGCDetalles.push(`${verseIdOf(wi)} G${strong} «${txt}»`); continue; }
    const sust = textOf(gc).replace(/\s+/g, ' ').trim();
    if (!sust) continue;

    // Encontrar el <wi G3588> vacío inmediatamente anterior (artículo).
    // Debe ser adyacente (solo espacios en blanco entre ambos) para no
    // alterar el orden de las palabras al mover la función al artículo.
    let art = null;
    let prev = wi.previousSibling;
    while (prev && prev.nodeType === 3 && !prev.nodeValue.trim()) {
      prev = prev.previousSibling;
    }
    if (prev && prev.nodeType === 1 && prev.tagName === 'wi' && prev.getAttribute('type') === 'G') {
      const v = prev.getAttribute('value') || '';
      if (/^3588,\d+,?/.test(v) && !textOf(prev).trim()) art = prev;
    }
    if (!art) { omitidos++; omitidoDetalles.push(`${verseIdOf(wi)} G${strong} «${txt}» → «${sust}»`); continue; }

    // Aplicar el intercambio:
    // 1) artículo vacío ← función
    setWiText(art, txt);
    // 2) mover el <wi> del sustantivo a la posición del GC y poner el sustantivo
    const gcParent = gc.parentNode;
    gcParent.insertBefore(wi, gc);
    setWiText(wi, sust);
    // 3) eliminar el GC (su texto ya está en el wi)
    gcParent.removeChild(gc);
    cambios++;
  }

  let salida = doc.toString();
  if (original.endsWith('\n') && !salida.endsWith('\n')) salida += '\n';
  if (dryRun) {
    const tmpA = '/tmp/arreglo-a.gbfxml', tmpB = '/tmp/arreglo-b.gbfxml';
    fs.writeFileSync(tmpA, original); fs.writeFileSync(tmpB, salida);
    try { console.log(execSync(`diff -u ${tmpA} ${tmpB}`, { encoding: 'utf-8', timeout: 30000 })); }
    catch (e) { if (e.stdout) console.log(e.stdout); }
    console.log(`\n${cambios} cambios propuestos, ${omitidos} omitidos (sin artículo G3588 adyacente), ${sinGC} sin GC (--dry-run).`);
    if (omitidoDetalles.length) { console.log('\nOmitidos (revisar manualmente, orden de palabras):'); omitidoDetalles.forEach(d => console.log(`  ${d}`)); }
    if (sinGCDetalles.length) { console.log('\nSin GC (revisar manualmente):'); sinGCDetalles.forEach(d => console.log(`  ${d}`)); }
  } else {
    fs.writeFileSync(fp, salida, 'utf-8');
    console.log(`${cambios} cambios aplicados a ${fp}; ${omitidos} omitidos (sin artículo G3588 adyacente), ${sinGC} sin GC.`);
    if (omitidoDetalles.length) { console.log('\nOmitidos (revisar manualmente, orden de palabras):'); omitidoDetalles.forEach(d => console.log(`  ${d}`)); }
    if (sinGCDetalles.length) { console.log('\nSin GC (revisar manualmente):'); sinGCDetalles.forEach(d => console.log(`  ${d}`)); }
  }
}

function setWiText(wi, text) {
  // Eliminar todos los hijos y poner un único nodo de texto
  for (const c of childNodesArr(wi)) wi.removeChild(c);
  wi.appendChild(wi.ownerDocument.createTextNode(text));
}

main();
