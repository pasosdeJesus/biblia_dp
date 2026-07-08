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

// ─── Artículos y contracciones a extraer (orden: más largos primero) ───
const ARTICULOS = [
  'de los ', 'de las ', 'de la ',
  'a los que ', 'a los ', 'a las ', 'a la ',
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
  const t = texto.trimStart();
  for (const art of ARTICULOS) {
    if (t.startsWith(art)) {
      return [art.trimEnd(), t.slice(art.length).trimStart()];
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
    /<wi type="G" value="3588,(\d+),[^"]*"(\s+sacred="yes")?>\s*<wi type="([GH])" value="([^"]+)"(\s+sacred="yes")?>([^<]*)<\/wi>\s*<\/wi>/g;

  let resultado = texto.replace(regexNested,
    (match, pos3588, sacredOuter, tipoInner, valorInner, sacredInner, textoInner) => {
      const [articulo, resto] = extraerArticulo(textoInner);
      const sacOuter = sacredOuter || '';
      const sacInner = sacredInner || '';

      if (articulo !== null) {
        // El texto interior comienza con artículo → separar
        if (resto === '') {
          return `<wi type="G" value="3588,${pos3588},"${sacOuter}>${articulo}</wi>\n` +
                 `<wi type="${tipoInner}" value="${valorInner}"${sacInner}/>`;
        }
        return `<wi type="G" value="3588,${pos3588},"${sacOuter}>${articulo}</wi>\n` +
               `<wi type="${tipoInner}" value="${valorInner}"${sacInner}>${resto}</wi>`;
      } else {
        // Sin artículo → G3588 vacío, sin espacio
        return `<wi type="G" value="3588,${pos3588},"${sacOuter}/><wi type="${tipoInner}" value="${valorInner}"${sacInner}>${textoInner}</wi>`;
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
  if (args.length < 2) {
    console.error('Uso: node herram/art3588.mjs <libro> <capítulo>');
    console.error('Ejemplo: node herram/art3588.mjs marcos 3');
    process.exit(1);
  }

  const [libro, capStr] = args;
  const capitulo = parseInt(capStr, 10);
  if (isNaN(capitulo) || capitulo < 1) {
    console.error('El capítulo debe ser un número entero positivo');
    process.exit(1);
  }

  const libroId = libro.charAt(0).toUpperCase() + libro.slice(1);
  const archivo = `libros/${libro}.gbfxml`;

  let contenido;
  try {
    contenido = readFileSync(archivo, 'utf-8');
  } catch (err) {
    console.error(`Error al leer ${archivo}: ${err.message}`);
    process.exit(1);
  }

  const { antes, capitulo: capContenido, despues } =
    extraerCapitulo(contenido, libroId, capitulo);

  // Convertir el capítulo
  const convertido = convertirBloque(capContenido);

  // Estadísticas
  const nestedAntes =
    (capContenido.match(/<wi type="G" value="3588,\d+,[^"]*">\s*<wi /g) || []).length;
  const nestedDespues =
    (convertido.match(/<wi type="G" value="3588,\d+,[^"]*">\s*<wi /g) || []).length;

  // Escribir resultado
  const nuevoContenido = antes + convertido + despues;
  writeFileSync(archivo, nuevoContenido, 'utf-8');

  console.log(`✅ Capítulo ${libroId}-${capitulo} procesado:`);
  console.log(`   G3588 anidados antes: ${nestedAntes}`);
  console.log(`   G3588 anidados después: ${nestedDespues}`);
  if (nestedDespues > 0) {
    console.log(`   ⚠️  Quedan ${nestedDespues} casos anidados por revisar manualmente`);
  }

  // Verificar balance de tags <wi> (excluyendo auto-cerrados)
  const wisAbren = (convertido.match(/<wi type=/g) || []).length;
  const wisCierran = (convertido.match(/<\/wi>/g) || []).length;
  const wisSelfClose = (convertido.match(/<wi [^>]*\/>/g) || []).length;
  if (wisAbren !== wisCierran + wisSelfClose) {
    console.log(`   ⚠️  Desbalance de tags <wi>: ${wisAbren} aperturas vs ${wisCierran} cierres + ${wisSelfClose} auto-cerrados`);
  } else {
    console.log(`   Tags <wi> balanceados: ${wisAbren} aperturas, ${wisCierran} cierres, ${wisSelfClose} auto-cerrados`);
  }
}

main();
