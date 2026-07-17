#!/usr/bin/env node
/**
 * estilo-gbfxml.mjs — Aplica la guía de estilo GBFXML a un libro.
 *
 * Arquitectura:
 *   1. Parse: DOMParser → árbol DOM
 *   2. Transform: placeholder para correcciones estructurales futuras
 *   3. Serialize: serializador custom que escribe con el formato de estilo
 *
 * Uso:
 *   node herram/estilo-gbfxml.mjs [--diff] <libro>
 *   node herram/estilo-gbfxml.mjs [--diff]          (todo el NT)
 *
 * --diff: muestra diff sin modificar archivos
 *
 * Ver doc/estilo-gbfxml.md para las reglas de estilo.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { writeFileSync as wfs, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ANCHO = 80;

const NT = [
  'mateo','marcos','lucas','juan','hechos','romanos',
  'corintios1','corintios2','galatas','efesios','filipenses','colosenses',
  'tesalonicenses1','tesalonicenses2','timoteo1','timoteo2','tito','filemon',
  'hebreos','santiago','pedro1','pedro2','juan1','juan2','juan3','judas','apocalipsis'
];

const TAGS_SIN_CONTENIDO = new Set(['cl', 'br']);

function extraerPreambulo(texto) {
  const m = texto.match(/^([\s\S]*?)<sb\b/);
  return m ? m[1] : '';
}

function esSelfClosing(el) {
  if (!el || el.nodeType !== 1) return false;
  return el.childNodes.length === 0 && TAGS_SIN_CONTENIDO.has(el.tagName);
}

function esWiSelfClosing(el) {
  return el && el.nodeType === 1 && el.tagName === 'wi' &&
    el.childNodes.length === 0 &&
    !esSelfClosing(el);
}

function esWiConTexto(el) {
  return el && el.nodeType === 1 && el.tagName === 'wi' &&
    el.childNodes.length > 0;
}

function attrStr(el) {
  if (!el || !el.attributes) return '';
  const attrs = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    attrs.push(`${a.name}="${a.value}"`);
  }
  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

function textoWi(el) {
  let t = '';
  const hijos = childNodesArr(el);
  for (const c of hijos) {
    if (c.nodeType === 3) t += c.nodeValue;
    else if (c.nodeType === 1 && c.tagName === 'wi') {
      t += serializeWi(c, { mode: 'default' });
    }
    else t += textoWi(c);
  }
  return t;
}

function esVacio(el) {
  return el.childNodes.length === 0;
}

function esBlankText(node) {
  return node.nodeType === 3 && /^\s*$/.test(node.nodeValue);
}

// ── Serializador principal ──

function serialize(nodo, ctx = {}) {
  if (!nodo) return '';
  const modo = ctx.mode || 'default';

  switch (nodo.nodeType) {
    case 9: return serializeDocument(nodo, ctx);
    case 1: return serializeElement(nodo, ctx);
    case 3: return serializeText(nodo, ctx);
    case 8: return `<!--${nodo.nodeValue}-->`;
    default: return '';
  }
}

function serializeDocument(doc, ctx) {
  return childNodesArr(doc).map(c => serialize(c, ctx)).join('');
}

function serializeElement(el, ctx) {
  const tag = el.tagName;

  if (ctx.mode === 'preserve') {
    return serializeInline(el, { ...ctx, mode: 'default' });
  }

  switch (tag) {
    case 'sb': return serializeContainer(el, ctx);
    case 'tt': return serializePreserve(el, ctx);
    case 'credits': return serializePreserve(el, ctx);
    case 'sc': return serializeSc(el, ctx);
    case 'cm': return serializeCm(el, ctx);
    case 'sv': return serializeSv(el, ctx);
    case 't': return serializeT(el, ctx);
    case 'rb': return serializeRb(el, ctx);
    case 'rf': return serializeRf(el, ctx);
    case 'wi': return serializeWi(el, ctx);
    case 'cl':
    case 'br': return `<${tag}/>`;
    default: return serializeInline(el, ctx);
  }
}

function serializeText(node, ctx) {
  if (ctx.mode === 'wi-flow') {
    return node.nodeValue;
  }
  return node.nodeValue;
}

// ── Contenedores estructurales ──

function childNodesArr(el) {
  const cn = el.childNodes;
  const arr = [];
  for (let i = 0; i < cn.length; i++) arr.push(cn[i]);
  return arr;
}

function serializeContainer(el, ctx) {
  const partes = childNodesArr(el).map(c => serialize(c, ctx));
  return `<${el.tagName}${attrStr(el)}>\n${partes.join('')}</${el.tagName}>\n`;
}

function serializePreserve(el, ctx) {
  const partes = childNodesArr(el).map(c => serialize(c, { ...ctx, mode: 'preserve' }));
  return `<${el.tagName}${attrStr(el)}>${partes.join('')}</${el.tagName}>\n`;
}

function serializeSc(el, ctx) {
  const partes = childNodesArr(el).map(c => serialize(c, ctx));
  return `<sc${attrStr(el)}>\n${partes.join('')}</sc>\n`;
}

function serializeCm(el, ctx) {
  const partes = childNodesArr(el).map(c => serialize(c, ctx));
  return `<cm${attrStr(el)}>\n${partes.join('')}</cm>\n`;
}

// ── Versículo <sv> ──

function serializeSv(el, ctx) {
  const partes = [];

  const hijos = childNodesArr(el);
  for (const c of hijos) {
    if (c.nodeType === 1 && c.tagName === 't' &&
        c.getAttribute('xml:lang') === 'es') {
      partes.push(serializeT(c, ctx));
    } else if (c.nodeType === 1 && c.tagName === 'rb') {
      partes.push(serializeRb(c, ctx));
    } else if (c.nodeType === 1 && c.tagName === 'wi') {
      partes.push(serializeWi(c, { ...ctx, mode: 'wi-flow' }));
    } else if (c.nodeType === 1) {
      partes.push(serializeElement(c, ctx));
    } else if (c.nodeType === 3) {
      const t = c.nodeValue;
      if (t.trim()) partes.push(t);
      else partes.push(t);
    }
  }

  const inner = partes.join('').replace(/\n\n+/g, '\n');
  return `\n<sv${attrStr(el)}>\n${inner}</sv>\n`;
}

// ── <t xml:lang="es"> ──

function serializeT(el, ctx) {
  const inner = serializeWiFlow(childNodesArr(el), ctx);
  const trimmed = inner.replace(/\n+$/, '');
  return `<t${attrStr(el)}>\n${trimmed}</t>`;
}

// ── Flujo de <wi> ──

function serializeWiFlow(nodos, ctx) {
  const lines = [];
  let i = 0;
  let pendingPrefix = '';
  const nodosArr = Array.from ? Array.from(nodos) : (() => { const a = []; for (let j = 0; j < nodos.length; j++) a.push(nodos[j]); return a; })();

  while (i < nodosArr.length) {
    const n = nodos[i];

    if (n.nodeType === 1 && n.tagName === 'rb') {
      lines.push(serializeRb(n, ctx));
      i++;
      continue;
    }

    if (n.nodeType === 1 && esWiSelfClosing(n)) {
      const grupo = [n];
      i++;
      while (i < nodosArr.length && nodosArr[i].nodeType === 1 && esWiSelfClosing(nodosArr[i])) {
        grupo.push(nodosArr[i]);
        i++;
      }
      if (i < nodosArr.length && nodosArr[i].nodeType === 1 && esWiConTexto(nodosArr[i])) {
        grupo.push(nodosArr[i]);
        i++;
      }
      let linea = '';
      for (let j = 0; j < grupo.length; j++) {
        const w = grupo[j];
        if (j > 0 && esWiSelfClosing(w) && j < grupo.length - 1 && esWiSelfClosing(grupo[j-1])) {
          linea += ' ';
        }
        linea += `<wi${attrStr(w)}`;
        if (w.childNodes.length > 0) {
          linea += `>${textoWi(w)}</wi>`;
        } else {
          linea += '/>';
        }
      }
      lines.push(linea);
      if (pendingPrefix) {
        lines[lines.length - 1] = pendingPrefix.trimStart() + lines[lines.length - 1];
        pendingPrefix = '';
      }
      continue;
    }

    if (n.nodeType === 1 && n.tagName === 'wi') {
      let linea = `<wi${attrStr(n)}>${textoWi(n)}</wi>`;
      i++;
      while (i < nodosArr.length && nodosArr[i].nodeType === 3) {
        const t = nodosArr[i].nodeValue;
        if (t.trim() || (!t.trim() && linea.endsWith('</wi>'))) {
          linea += t;
          i++;
        } else {
          break;
        }
      }
      lines.push(linea);
      if (pendingPrefix) { lines[lines.length - 1] = pendingPrefix.trimStart() + lines[lines.length - 1]; pendingPrefix = ''; }
      continue;
    }

    if (n.nodeType === 1 && TAGS_SIN_CONTENIDO.has(n.tagName)) {
      lines.push(`<${n.tagName}/>`);
      if (pendingPrefix) { lines[lines.length - 1] = pendingPrefix.trimStart() + lines[lines.length - 1]; pendingPrefix = ''; }
      i++;
      continue;
    }

    if (n.nodeType === 1) {
      const elLine = serializeElement(n, { ...ctx, mode: 'default' });
      lines.push(elLine);
      if (pendingPrefix) { lines[lines.length - 1] = pendingPrefix.trimStart() + lines[lines.length - 1]; pendingPrefix = ''; }
      i++;
      continue;
    }

    if (n.nodeType === 3) {
      const t = n.nodeValue;
      if (!t.trim()) {
        if (lines.length > 0) lines[lines.length - 1] += t;
        else if (!pendingPrefix.trim()) pendingPrefix += t;
      } else if (lines.length === 0) {
        pendingPrefix += t;
      } else {
        lines[lines.length - 1] += t;
      }
      i++;
      continue;
    }

    i++;
  }

  if (pendingPrefix) {
    return pendingPrefix.trimStart() + lines.join('\n');
  }
  return lines.join('\n');
}

function serializeWi(el, ctx) {
  if (esWiSelfClosing(el)) {
    return `<wi${attrStr(el)}/>`;
  }
  return `<wi${attrStr(el)}>${textoWi(el)}</wi>`;
}

// ── Notas: <rb> y <rf> ──

function serializeRb(el, ctx) {
  const hijos = childNodesArr(el);
  const parts = [];
  let wiBuffer = [];

  function flushWi() {
    if (wiBuffer.length > 0) {
      parts.push(serializeWiFlow(wiBuffer, ctx));
      wiBuffer = [];
    }
  }

  for (const c of hijos) {
    if (c.nodeType === 1 && c.tagName === 't' &&
        c.getAttribute('xml:lang') === 'es') {
      flushWi();
      parts.push('\n' + serializeT(c, ctx));
    } else if (c.nodeType === 1 && c.tagName === 'rf') {
      flushWi();
      parts.push(serializeRf(c, ctx));
    } else if (c.nodeType === 1 && c.tagName === 'wi') {
      wiBuffer.push(c);
    } else if (c.nodeType === 3) {
      const t = c.nodeValue;
      if (!t.trim()) continue;
      flushWi();
      parts.push(t);
    } else if (c.nodeType === 1) {
      flushWi();
      parts.push(serializeElement(c, ctx));
    }
  }
  flushWi();

  return `<rb${attrStr(el)}>${parts.join('')}</rb>`;
}

function serializeRf(el, ctx) {
  const contenido = serializeRfContent(el.childNodes, ctx);
  return `<rf>\n${ajustarLineas(contenido)}\n</rf>`;
}

function serializeRfContent(nodos, ctx) {
  const partes = [];
  const hijos = Array.from ? Array.from(nodos) : (() => { const a = []; for (let j = 0; j < nodos.length; j++) a.push(nodos[j]); return a; })();
  for (const n of hijos) {
    if (n.nodeType === 1 && n.tagName === 't' &&
        n.getAttribute('xml:lang') === 'es') {
      partes.push('\n' + serializeT(n, { ...ctx, mode: 'rf-wrap' }));
    } else if (n.nodeType === 1) {
      partes.push(serializeElement(n, { ...ctx, mode: 'rf-wrap' }));
    } else if (n.nodeType === 3) {
      partes.push(n.nodeValue);
    }
  }
  return partes.join('');
}

function serializeInline(el, ctx) {
  const tag = el.tagName;
  if (esVacio(el)) {
    return `<${tag}${attrStr(el)}/>`;
  }
  const partes = childNodesArr(el).map(c => serialize(c, ctx));
  return `<${tag}${attrStr(el)}>${partes.join('')}</${tag}>`;
}

// ── Ajuste de líneas en <rf> ──

function ajustarLineas(texto) {
  if (!texto || !texto.trim()) return texto;

  if (texto.includes('http://') || texto.includes('https://')) {
    return preservarUrls(texto);
  }

  const tags = [];
  const protegido = texto.replace(/<[^>]+>/g, (tag) => {
    tags.push(tag);
    return '\x00T' + (tags.length - 1) + '\x00';
  });

  const limpio = protegido.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const words = limpio.split(' ');
  const result = [];
  let current = '';

  for (const w of words) {
    if (current && current.length + 1 + w.length > ANCHO) {
      result.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current) result.push(current);

  return result.join('\n').replace(/\x00T(\d+)\x00/g, (m, i) => tags[parseInt(i)]);
}

function preservarUrls(texto) {
  const lines = texto.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('http://') || line.includes('https://')) {
      result.push(line.trim());
    } else {
      const wrapped = ajustarLineas(line);
      if (wrapped) result.push(wrapped);
    }
  }

  return result.join('\n');
}

// ── Aplicación del proceso completo ──

function aplicarEstilo(contenido) {
  const preambulo = extraerPreambulo(contenido);

  let doc;
  try {
    doc = new DOMParser().parseFromString(contenido, 'application/xml');
  } catch (e) {
    console.error(`Error al parsear XML: ${e.message}`);
    return null;
  }

  const serializado = serialize(doc, { mode: 'default' });

  // Unir preámbulo con el contenido serializado
  const sbIni = serializado.indexOf('<sb');
  const resultado = preambulo + (sbIni >= 0 ? serializado.slice(sbIni) : serializado);

  // Limpiar líneas en blanco múltiples
  return resultado.replace(/\n{3,}/g, '\n\n');
}

// ── Main ──

function detectarUrlsRotas(contenido) {
  const lineas = contenido.split('\n');
  const rotas = [];
  for (let i = 0; i < lineas.length - 1; i++) {
    if (lineas[i].includes('http') && !lineas[i].includes('-->') &&
        lineas[i].match(/[a-z0-9\/%_\-=&#?]$/)) {
      const sig = lineas[i + 1].trim();
      if (sig && sig[0] === sig[0].toLowerCase() && !sig.startsWith('<') &&
          !sig.startsWith('-->') &&
          !/^(dice|según|el |la |los |las |su |en |de |del |por |que |como |para |con |una |etimología|lícito)/.test(sig) &&
          sig.slice(0, 10).match(/[\/%=?&~#_-]/)) {
        rotas.push({ linea: i + 1, antes: lineas[i].trim(), despues: sig });
      }
    }
  }
  return rotas;
}

function main() {
  const args = process.argv.slice(2);
  const diffMode = args.includes('--diff');
  const librosArg = args.filter(a => a !== '--diff');

  const libros = librosArg.length > 0 ? [librosArg[0]] : NT;
  let urlsTotal = 0;
  let cambiosTotal = 0;

  for (const libro of libros) {
    const archivo = `libros/${libro}.gbfxml`;
    let contenido;
    try {
      contenido = readFileSync(archivo, 'utf-8');
    } catch (err) {
      console.error(`Error al leer ${archivo}: ${err.message}`);
      continue;
    }

    const resultado = aplicarEstilo(contenido);
    if (resultado === null) continue;

    if (contenido === resultado) {
      if (libros.length === 1) console.log(`✅ ${libro}: sin cambios necesarios`);
    } else {
      cambiosTotal++;

      if (diffMode) {
        const tmpOri = join(tmpdir(), `estilo-ori-${libro}.xml`);
        const tmpNew = join(tmpdir(), `estilo-new-${libro}.xml`);
        wfs(tmpOri, contenido, 'utf-8');
        wfs(tmpNew, resultado, 'utf-8');

        console.log(`\n📄 ${libro}: diff (${contenido.split('\n').length} → ${resultado.split('\n').length} líneas):`);
        try {
          const diff = execSync(`diff -u "${tmpOri}" "${tmpNew}"`, { encoding: 'utf-8', timeout: 5000 });
          console.log(diff);
        } catch (e) {
          if (e.stdout) console.log(e.stdout);
        }

        unlinkSync(tmpOri);
        unlinkSync(tmpNew);
      } else {
        writeFileSync(archivo, resultado, 'utf-8');
        const lineasAntes = contenido.split('\n').length;
        const lineasDespues = resultado.split('\n').length;
        console.log(`✅ ${libro}: estilo aplicado (${lineasAntes} → ${lineasDespues} líneas)`);
      }
    }

    const rotas = detectarUrlsRotas(resultado);
    if (rotas.length > 0) {
      console.log(`   ⚠ ${libro}: ${rotas.length} posibles URLs partidas:`);
      for (const u of rotas) {
        console.log(`     Línea ${u.linea}: ...${u.antes.slice(-60)}\n     → ${u.despues.slice(0, 60)}...`);
      }
      urlsTotal += rotas.length;
    }
  }

  if (libros.length > 1) {
    console.log(`\n✅ NT procesado (${libros.length} libros${diffMode ? ', modo --diff' : ''})`);
    if (cambiosTotal > 0) console.log(`   ${cambiosTotal} libro(s) con cambios`);
    if (urlsTotal > 0) console.log(`   ⚠ ${urlsTotal} URLs potencialmente partidas`);
  }
}

export { aplicarEstilo };

const esModuloPrincipal = process.argv[1] && import.meta.url === ('file://' + process.argv[1]);
if (esModuloPrincipal) {
  main();
}
