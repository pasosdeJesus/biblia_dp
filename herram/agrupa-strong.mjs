#!/usr/bin/env node
/**
 * agrupa-strong.mjs — Post-procesa html/strong.html para agrupar
 * ocurrencias de un número Strong por palabra española traducida.
 *
 * Cuando un número Strong tiene múltiples traducciones distintas,
 * las agrupa en sub-bullets. Si solo tiene una, lo deja como está.
 *
 * Uso:
 *   node herram/agrupa-strong.mjs [--diff] [html/strong.html]
 *
 * --diff: muestra cambios sin modificar archivo
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { writeFileSync as wfs, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Extrae pares {word, linkHtml} del contenido interior de un <li>.
 * Ignora <a name="st...">.
 */
function extraerPares(innerHtml) {
  const pares = [];

  const re = /(<a\s+name="st\d+"><\/a>)?(\d+):\s*/g;
  let limpio = innerHtml.replace(re, '');

  const re2 = /(<a\s[^>]*>[^<]*<\/a>)/g;
  const links = [];
  limpio = limpio.replace(re2, (match) => {
    links.push(match);
    return '\x00L' + (links.length - 1) + '\x00';
  });

  const partes = limpio.split(/\x00L\d+\x00/);

  for (let i = 0; i < links.length; i++) {
    const word = partes[i].replace(/\s+/g, ' ').trim();
    if (word && !/^[,;.]$/.test(word)) {
      pares.push({ word, linkHtml: links[i] });
    } else if (pares.length > 0) {
      pares[pares.length - 1].linkHtml += ', ' + links[i];
    }
  }

  return pares;
}

function procesarLi(liHtml) {
  const innerMatch = liHtml.match(/^<li>(.*)<\/li>$/s);
  if (!innerMatch) return liHtml;

  const inner = innerMatch[1];
  const pares = extraerPares(inner);

  if (pares.length <= 1) return liHtml;

  const grupos = new Map();
  for (const p of pares) {
    const key = p.word.toLowerCase();
    if (!grupos.has(key)) grupos.set(key, { variants: new Set(), links: [] });
    const g = grupos.get(key);
    g.variants.add(p.word);
    g.links.push(p.linkHtml);
  }

  const nsMatch = inner.match(/<a\s+name="(st\d+)"><\/a>(\d+):/);
  const nameAnchor = nsMatch ? `<a name="${nsMatch[1]}"></a>` : '';
  const numStr = nsMatch ? nsMatch[2] : '';

  function fmtVariants(variants) {
    const arr = [...variants].sort();
    return arr.join(', ');
  }

  if (grupos.size === 1) {
    const [key, g] = [...grupos][0];
    if (g.links.length === 1 && g.variants.size === 1) return liHtml;
    const word = fmtVariants(g.variants);
    return `<li>\n${nameAnchor}${numStr}: ${word} ${g.links.join(', ')}\n</li>`;
  }

  const sorted = [...grupos.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], 'es')
  );

  let subHtml = `<ul>\n`;
  for (const [key, g] of sorted) {
    const word = fmtVariants(g.variants);
    subHtml += `<li>${word} ${g.links.join(', ')}</li>\n`;
  }
  subHtml += `</ul>`;

  return `<li>\n${nameAnchor}${numStr}:\n${subHtml}\n</li>`;
}

function procesarStrong(html) {
  const liRe = /<li>[\s\S]*?<\/li>/g;
  let result = html;
  let cambios = 0;

  result = result.replace(liRe, (match) => {
    if (/<li>[\s\S]*<ul>/.test(match)) return match;
    const nuevo = procesarLi(match);
    if (nuevo !== match) cambios++;
    return nuevo;
  });

  return { html: result, cambios };
}

function main() {
  const args = process.argv.slice(2);
  const diffMode = args.includes('--diff');
  const archivo = args.filter(a => a !== '--diff')[0] || 'html/strong.html';

  let contenido;
  try {
    contenido = readFileSync(archivo, 'utf-8');
  } catch (err) {
    console.error(`Error al leer ${archivo}: ${err.message}`);
    process.exit(1);
  }

  const { html: resultado, cambios } = procesarStrong(contenido);

  if (cambios === 0) {
    console.log('✅ strong.html: sin cambios necesarios');
    return;
  }

  if (diffMode) {
    const tmpOri = join(tmpdir(), 'strong-ori.html');
    const tmpNew = join(tmpdir(), 'strong-new.html');
    wfs(tmpOri, contenido, 'utf-8');
    wfs(tmpNew, resultado, 'utf-8');

    console.log(`📄 strong.html: ${cambios} números Strong agrupados. diff:`);
    try {
      const diff = execSync(`diff -u "${tmpOri}" "${tmpNew}"`, {
        encoding: 'utf-8', timeout: 30000
      });
      console.log(diff);
    } catch (e) {
      if (e.stdout) console.log(e.stdout);
    }

    unlinkSync(tmpOri);
    unlinkSync(tmpNew);
  } else {
    writeFileSync(archivo, resultado, 'utf-8');
    console.log(`✅ strong.html: ${cambios} números Strong agrupados`);
  }
}

export { procesarStrong };

const esModuloPrincipal = process.argv[1] && import.meta.url === ('file://' + process.argv[1]);
if (esModuloPrincipal) {
  main();
}
