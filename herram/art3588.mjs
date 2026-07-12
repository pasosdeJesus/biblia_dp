#!/usr/bin/env node
/**
 * art3588.mjs - Convierte la convención de G3588 (artículo griego)
 * de forma anidada a forma separada en archivos GBFXML.
 *
 * Uso:
 *   node herram/art3588.mjs <libro> <capítulo>
 *
 * Ejemplo:
 *   node herram/art3588.mjs marcos 3
 *
 * Convención antigua (anidada):
 *   <wi type="G" value="3588,5,"><wi type="G" value="4102,6,">la fe</wi></wi>
 *
 * Convención nueva (separada):
 *   <wi type="G" value="3588,5,">la</wi>
 *   <wi type="G" value="4102,6,">fe</wi>
 *
 * Cuando G3588 no tiene traducción explícita al español,
 * queda vacío y sin espacio con la siguiente palabra:
 *   <wi type="G" value="3588,5,"/><wi type="G" value="4102,6,">fe</wi>
 *
 * Cuando G3588 sí tiene texto (artículo), se separa con nueva línea:
 *   <wi type="G" value="3588,5,">la</wi>
 *   <wi type="G" value="4102,6,">fe</wi>
 *
 * El artículo se extrae del texto interior según estas reglas
 * (probadas en orden, coincidencia más larga primero):
 *   "de los ", "de las ", "de la ",
 *   "a los que ", "a los ", "a las ", "a la ",
 *   "en los ", "en las ", "en el ", "en la ",
 *   "por los ", "por las ", "por el ", "por la ",
 *   "los que ", "las que ",
 *   "del ", "al ",
 *   "de ", "a ",
 *   "Los ", "Las ", "los ", "las ",
 *   "El ", "La ", "el ", "la ",
 *   "Un ", "Una ", "un ", "una ",
 *   "unos ", "unas "
 *
 * Si no coincide ningún artículo, G3588 queda vacío (/>).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// ─── Artículos y contracciones a extraer (orden: más largos primero) ───
const ARTICULOS = [
  'de los ', 'de las ', 'de la ', 'de una ', 'de un ', 'de unos ', 'de unas ',
  'a los que ', 'a los ', 'a las ', 'a la ', 'a una ', 'a un ',
  'en los ', 'en las ', 'en el ', 'en la ',
  'por los ', 'por las ', 'por el ', 'por la ',
  'los que ', 'las que ',
  'del ', 'al ',
  'de ', 'a ',
  'Los ', 'Las ', 'los ', 'las ',
  'El ', 'La ', 'el ', 'la ',
  'Un ', 'Una ', 'un ', 'una ',
  'unos ', 'unas ',
];

/**
 * Extrae el artículo del inicio de un texto.
 * Retorna [artículo, resto] o [null, textoOriginal] si no hay coincidencia.
 */
function extraerArticulo(texto) {
  // Normalizar whitespace para comparación (colapsar espacios y saltos de línea)
  const collapsed = texto.trimStart().replace(/\s+/g, ' ');
  for (const art of ARTICULOS) {
    if (collapsed.startsWith(art)) {
      const artWords = art.trimEnd();
      // Encontrar el fin del artículo en el texto original (manejando whitespace)
      let pos = 0;
      while (pos < texto.length && /\s/.test(texto[pos])) pos++;
      const words = artWords.split(' ');
      for (const w of words) {
        while (pos < texto.length && /\s/.test(texto[pos])) pos++;
        if (texto.slice(pos, pos + w.length) === w) {
          pos += w.length;
        }
      }
      while (pos < texto.length && /\s/.test(texto[pos])) pos++;
      return [artWords, texto.slice(pos).trimStart()];
    }
    // También verificar coincidencia exacta sin espacio final
    const artWord = art.trimEnd();
    if (collapsed === artWord) {
      let pos = 0;
      while (pos < texto.length && /\s/.test(texto[pos])) pos++;
      const words = artWord.split(' ');
      for (const w of words) {
        while (pos < texto.length && /\s/.test(texto[pos])) pos++;
        if (texto.slice(pos, pos + w.length) === w) {
          pos += w.length;
        }
      }
      while (pos < texto.length && /\s/.test(texto[pos])) pos++;
      return [artWord, texto.slice(pos).trimStart()];
    }
  }
  return [null, texto];
}

/**
 * Procesa un bloque de texto convirtiendo G3588 anidados a la nueva convención.
 */
function convertirBloque(texto) {
  // ── Paso 1: G3588 anidado simple ──
  // <wi type="G" value="3588,POS,[...]"><wi type="T" value="STRONG,[...]">texto</wi></wi>
  // value puede ser "3588,N," o "3588,N,,"
  const regexNested =
    /<wi type="G" value="3588,(\d+),[^"]*"(\s+sacred="yes")?>\s*<wi type="([GH])" value="([^"]+)"(\s+sacred="yes")?>([^<]*)<\/wi>([\s\S]*?)<\/wi>/g;

  let resultado = texto.replace(regexNested,
    (match, pos3588, sacredOuter, tipoInner, valorInner, sacredInner, textoInner, extraWis) => {
      const [articulo, resto] = extraerArticulo(textoInner);
      const sacOuter = sacredOuter || '';
      const sacInner = sacredInner || '';
      const extras = extraWis ? extraWis.trim() : '';

      if (articulo !== null) {
        // Texto interior del inner + extras forman el contenido del inner
        const innerTexto = (resto + (extras ? ' ' + extras : '')).trim();
        if (innerTexto === '') {
          return `<wi type="G" value="3588,${pos3588},"${sacOuter}>${articulo}</wi>\n` +
                 `<wi type="${tipoInner}" value="${valorInner}"${sacInner}/>`;
        }
        return `<wi type="G" value="3588,${pos3588},"${sacOuter}>${articulo}</wi>\n` +
               `<wi type="${tipoInner}" value="${valorInner}"${sacInner}>${innerTexto}</wi>`;
      } else {
        // Sin artículo → G3588 vacío
        const innerTexto = textoInner + (extras ? ' ' + extras : '');
        if (innerTexto.trim() === '') {
          return `<wi type="G" value="3588,${pos3588},"${sacOuter}/><wi type="${tipoInner}" value="${valorInner}"${sacInner}/>`;
        }
        return `<wi type="G" value="3588,${pos3588},"${sacOuter}/><wi type="${tipoInner}" value="${valorInner}"${sacInner}>${innerTexto.trim()}</wi>`;
      }
    });

  // ── Paso 2: G3588 con texto huérfano entre dos G3588 ──
  // <wi type="G" value="3588,POS1,">art</wi> huérfano
  // <wi type="G" value="3588,POS2,"><wi ...>texto</wi></wi>
  const regexOrphan =
    /<wi type="G" value="3588,(\d+),[^"]*"(\s+sacred="yes")?">([^<]+)<\/wi>(\s*)(\S+)\s+<wi type="G" value="3588,(\d+),[^"]*"(\s+sacred="yes")?">\s*<wi type="([GH])" value="([^"]+)"(\s+sacred="yes")?>([^<]*)<\/wi>\s*<\/wi>/g;

  resultado = resultado.replace(regexOrphan,
    (match,
      pos1, sac1, art1, espacio, huerfano,
      pos2, sac2, tipoInner, valorInner, sacInner, textoInner) => {
      const sac1clean = sac1 || '';
      const sac2clean = sac2 || '';
      const sacInnerClean = sacInner || '';
      return `<wi type="G" value="3588,${pos1},"${sac1clean}/>` +
             `<wi type="G" value="3588,${pos2},"${sac2clean}>${art1}</wi>\n` +
             `<wi type="${tipoInner}" value="${valorInner}"${sacInnerClean}>${huerfano} ${textoInner}</wi>`;
    });

  // ── Paso 3: G3588 con "de"/"a" seguido de wi que empieza con artículo indefinido ──
  // <wi type="G" value="3588,POS,">de</wi>\n<wi ...>una X</wi>
  // → <wi type="G" value="3588,POS,">de una</wi>\n<wi ...>X</wi>
  const regexDeUna =
    /<wi type="G" value="3588,(\d+),[^"]*"(\s+sacred="yes")?>(de|a)<\/wi>\s*\n\s*<wi type="([GH])" value="([^"]+)"(\s+sacred="yes")?>(un|una|unos|unas)\s+([^<]+)<\/wi>/g;

  resultado = resultado.replace(regexDeUna,
    (match, pos3588, sacOuter, prep, tipoInner, valorInner, sacInner, art, resto) => {
      const so = sacOuter || '';
      const si = sacInner || '';
      return `<wi type="G" value="3588,${pos3588},"${so}>${prep} ${art}</wi>\n` +
             `<wi type="${tipoInner}" value="${valorInner}"${si}>${resto}</wi>`;
    });

  return resultado;
}

/**
 * Encuentra el contenido de un capítulo en el archivo GBFXML.
 */
function extraerCapitulo(contenido, libroId, capitulo) {
  const inicioTag = `<sc id="${libroId}-${capitulo}">`;
  const finTag = `</sc>`;

  const ini = contenido.indexOf(inicioTag);
  if (ini === -1) {
    throw new Error(`No se encontró el capítulo ${libroId}-${capitulo}`);
  }

  // Buscar el </sc> que cierra este capítulo (balanceado)
  let depth = 0;
  let pos = ini;
  const scRegex = /<\/?sc[\s>]/g;
  let fin = -1;

  while (pos < contenido.length) {
    scRegex.lastIndex = pos;
    const m = scRegex.exec(contenido);
    if (!m) break;
    if (m[0].startsWith('</sc')) {
      depth--;
      if (depth === 0) {
        fin = m.index + m[0].length;
        break;
      }
    } else {
      depth++;
    }
    pos = scRegex.lastIndex;
  }

  if (fin === -1) {
    throw new Error(`No se pudo encontrar el cierre del capítulo ${libroId}-${capitulo}`);
  }

  return {
    antes: contenido.slice(0, ini),
    capitulo: contenido.slice(ini, fin),
    despues: contenido.slice(fin),
  };
}

// ─── Principal ───

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Uso: node herram/art3588.mjs <libro> [capítulo]');
    console.error('  Sin capítulo: procesa todo el libro');
    console.error('  Con capítulo: procesa solo ese capítulo');
    console.error('Ejemplo: node herram/art3588.mjs marcos 3');
    console.error('         node herram/art3588.mjs marcos');
    process.exit(1);
  }

  const [libro, capStr] = args;
  const libroId = libro.charAt(0).toUpperCase() + libro.slice(1);
  const archivo = `libros/${libro}.gbfxml`;

  let contenido;
  try {
    contenido = readFileSync(archivo, 'utf-8');
  } catch (err) {
    console.error(`Error al leer ${archivo}: ${err.message}`);
    process.exit(1);
  }

  // Determinar capítulos a procesar
  const todosCaps = [...contenido.matchAll(/<sc id="[^"]+"/g)]
    .map(m => m[0].match(/id="([^"]+)"/)?.[1])
    .filter(id => id && id.startsWith(libroId + '-'))
    .map(id => parseInt(id.split('-')[1], 10));

  let capsProcesar;
  if (capStr) {
    const c = parseInt(capStr, 10);
    if (isNaN(c) || c < 1) {
      console.error('El capítulo debe ser un número entero positivo');
      process.exit(1);
    }
    if (!todosCaps.includes(c)) {
      console.error(`No se encontró el capítulo ${libroId}-${c}`);
      process.exit(1);
    }
    capsProcesar = [c];
  } else {
    capsProcesar = todosCaps;
  }

  let totalAntes = 0;
  let totalDespues = 0;

  for (const capitulo of capsProcesar) {
    const { antes, capitulo: capContenido, despues } =
      extraerCapitulo(contenido, libroId, capitulo);

    const convertido = convertirBloque(capContenido);

    const nestedAntes =
      (capContenido.match(/<wi type="G" value="3588,\d+,[^"]*">\s*<wi /g) || []).length;
    const nestedDespues =
      (convertido.match(/<wi type="G" value="3588,\d+,[^"]*">\s*<wi /g) || []).length;
    totalAntes += nestedAntes;
    totalDespues += nestedDespues;

    // Reconstruir contenido
    contenido = antes + convertido + despues;

    if (capsProcesar.length > 1) {
      const wisAbren = (convertido.match(/<wi type=/g) || []).length;
      const wisCierran = (convertido.match(/<\/wi>/g) || []).length;
      const wisSelfClose = (convertido.match(/<wi [^>]*\/>/g) || []).length;
      const bal = wisAbren === wisCierran + wisSelfClose ? '✓' : '⚠';
      console.log(`   ${libroId}-${capitulo}: ${nestedAntes}→${nestedDespues} [${bal}]`);
      if (nestedDespues > 0) {
        const reRestantes = /<wi type="G" value="3588,\d+,[^"]*">\s*<wi type=/g;
        let m;
        while ((m = reRestantes.exec(convertido)) !== null) {
          const pre = convertido.slice(0, m.index);
          const svMatch = pre.match(/<sv id="([^"]+)"/g);
          const svId = svMatch ? svMatch[svMatch.length - 1].match(/id="([^"]+)"/)[1] : '?';
          console.log(`     ⚠ ${svId}: caso anidado restante`);
        }
      }
    }
  }

  // Escribir resultado final
  writeFileSync(archivo, contenido, 'utf-8');

  if (capsProcesar.length > 1) {
    console.log(`\n✅ ${libroId} procesado (${capsProcesar.length} capítulos):`);
  } else {
    console.log(`✅ Capítulo ${libroId}-${capsProcesar[0]} procesado:`);
  }
  console.log(`   G3588 anidados antes: ${totalAntes}`);
  console.log(`   G3588 anidados después: ${totalDespues}`);

  // Diagnóstico demostrativos en todo el resultado
  const reDemo =
    /<wi type="G" value="3588,(\d+),[^"]*"\/><wi type="[GH]" value="[^"]+">(este|esta|estos|estas|ese|esa|esos|esas|aquel|aquella|aquellos|aquellas)\s+/gi;
  const demos = [...contenido.matchAll(reDemo)];
  if (demos.length > 0) {
    console.log(`   💡 Posibles demostrativos (${demos.length}):`);
    for (const d of demos) {
      const pre = contenido.slice(0, d.index);
      const svM = pre.match(/<sv id="([^"]+)"/g);
      const svId = svM ? svM[svM.length - 1].match(/id="([^"]+)"/)[1] : '?';
      const ctx = contenido.slice(d.index, d.index + 80).replace(/\n/g, ' ');
      console.log(`     ${svId}: G3588,${d[1]} vacío → ¿"${d[2]}"?  (${ctx}...)`);
    }
  }

  // Validar XML con xmllint si está disponible
  try {
    execSync('which xmllint', { stdio: 'ignore' });
    try {
      execSync(`xmllint --noout --valid --dtdvalid formatos/gbfxml.dtd "${archivo}" 2>&1`, { encoding: 'utf-8' });
      console.log('   ✓ XML válido (xmllint)');
    } catch (e) {
      const err = e.stderr || e.stdout || e.message;
      // Extraer número de línea del error
      const lineMatch = err.match(/:(\d+):/);
      if (lineMatch) {
        const lineNum = parseInt(lineMatch[1]);
        const lines = contenido.split('\n');
        const ctx = lines.slice(Math.max(0, lineNum - 2), lineNum + 1).map((l, i) => 
          `${lineNum - 1 + i}: ${l.trim().slice(0, 120)}`
        ).join('\n');
        console.log(`   ⚠ xmllint error línea ${lineNum}:\n${ctx}`);
      } else {
        console.log(`   ⚠ xmllint: ${err.trim().split('\n')[0]}`);
      }
    }
  } catch {
    // xmllint no disponible
  }
}

main();
