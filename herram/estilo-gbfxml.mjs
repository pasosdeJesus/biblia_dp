#!/usr/bin/env node
/**
 * estilo-gbfxml.mjs — Aplica la guía de estilo GBFXML a un libro.
 *
 * Uso:
 *   node herram/estilo-gbfxml.mjs <libro>
 *
 * Reglas aplicadas (ver doc/estilo-gbfxml.md):
 *   1. Línea en blanco antes y después de cada <sv id="...">...</sv>
 *   2. <wi/> vacíos consecutivos en misma línea, sin espacio entre ellos
 *   3. Contenido de <rf> comienza en nueva línea
 *   4. Líneas de <rf> se ajustan a ~80 caracteres (partiendo en comas/puntos)
 */

import { readFileSync, writeFileSync } from 'node:fs';

function aplicarEstilo(contenido) {
  let c = contenido;

  // ── -1. Unir tags partidos en líneas (ej: <citebib\nid="RVG2012"/> → <citebib id="RVG2012"/>)
  c = c.replace(/(<\w+)\n\s*([^>]+>)/g, '$1 $2');

  // ── 0. Eliminar indentación (tabs/espacios al inicio de línea) ──
  c = c.replace(/^[ \t]+(<\/?(?:sv|sc|sb|cm|t|rb|fr|tt|credits|fp|wi|rf|cl|br)\b[^>]*>?)/gm, '$1');

  // ── 1. Línea en blanco antes y después de <sv id="..."> ──
  // Antes: asegurar \n\n antes de <sv id=
  c = c.replace(/\n<sv id="/g, '\n\n<sv id="');
  // También: <sv al inicio de línea tras otra etiqueta en línea anterior
  c = c.replace(/([>])\n<sv id="/g, '$1\n\n<sv id="');
  // Después: asegurar \n\n después de </sv>
  c = c.replace(/<\/sv>\n(?!\n)/g, '</sv>\n\n');
  // Evitar triple salto
  c = c.replace(/\n\n\n+/g, '\n\n');

  // ── 2. <wi .../> en misma línea que el siguiente <wi> ──
  // Juntar: />\n<wi → /><wi
  c = c.replace(/\/>\n\s*<wi /g, '/><wi ');
  // Entre dos self-closing: agregar espacio para HTML
  c = c.replace(/\/><wi ([^>]*\/)>/g, '/> <wi $1>');
  // Quitar espacio cuando el siguiente NO es self-closing (tiene texto)
  c = c.replace(/\/> <wi ([^>]*[^/])>/g, '/><wi $1>');
  // Si hay más <wi> en la misma línea tras />...texto</wi>, pasarlos a línea aparte
  c = c.replace(/(\/><wi [^>]*[^\/]>[^<]*<\/wi>)([,;.]?) +(<wi )/g, '$1$2\n$3');
  // General: un <wi> con texto seguido de otro <wi> (con o sin texto) → línea aparte
  c = c.replace(/(<wi [^>]*[^\/]>[^<]*<\/wi>)([,;.]?) +(<wi )/g, '$1$2\n$3');

  // ── 3. <rf> contenido en nueva línea (manejado por regla 4) ──

  // ── 4. Ajustar líneas en <rf> (~80 chars, sin partir tags ni URLs) ──
  c = c.replace(/<rf>([\s\S]*?)<\/rf>/g, (match, contenido) => {
    // No tocar si tiene URL
    if (contenido.includes('http://') || contenido.includes('https://')) {
      return '<rf>' + contenido + '</rf>';
    }
    // Proteger espacios dentro de tags: <t xml:lang="es"> → <t␟xml:lang="es">
    const tags = [];
    const protegido = contenido.replace(/<[^>]+>/g, (tag) => {
      tags.push(tag);
      return '\x00T' + (tags.length - 1) + '\x00';
    });
    // Juntar texto, dividir en palabras
    const texto = protegido.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const words = texto.split(' ');
    const result = [];
    let current = '';
    for (const w of words) {
      if (current && current.length + 1 + w.length > 80) {
        result.push(current);
        current = w;
      } else {
        current = current ? current + ' ' + w : w;
      }
    }
    if (current) result.push(current);
    // Restaurar tags
    return '<rf>\n' + result.join('\n').replace(/\x00T(\d+)\x00/g, (m, i) => tags[parseInt(i)]) + '</rf>';
  });

  // ── 5. <t xml:lang="es"> dentro de <rf> en nueva línea ──
  c = c.replace(/<rf>([\s\S]*?)<\/rf>/g, (match, contenido) => {
    return '<rf>' + contenido.replace(/([^\n])(<t xml:lang="es">)/g, '$1\n$2') + '</rf>';
  });

  // ── 6. </rf> en línea propia ──
  c = c.replace(/([^\n])(<\/rf>)/g, '$1\n$2');
  c = c.replace(/\/><wi ([^>]*\/)>/g, '/><wi $1>');

  // ── 6. Quitar línea en blanco después de <sc> y antes de </sc> ──
  c = c.replace(/<sc id="([^"]+)">\n\n/g, '<sc id="$1">\n');
  c = c.replace(/\n\n<\/sc>/g, '\n</sc>');

  // ── 7. <t> dentro de <rb> empieza en nueva línea ──
  c = c.replace(/(<rb[^>]*>[^\n]*)(<t xml:lang=)/g, '$1\n$2');

  // ── 7. Quitar línea en blanco antes del primer <sv> de un <cm> ──
  // (Eliminada: entraba en conflicto con regla 1)

  return c;
}

function main() {
  const args = process.argv.slice(2);
  const NT = [
    'mateo','marcos','lucas','juan','hechos','romanos',
    'corintios1','corintios2','galatas','efesios','filipenses','colosenses',
    'tesalonicenses1','tesalonicenses2','timoteo1','timoteo2','tito','filemon',
    'hebreos','santiago','pedro1','pedro2','juan1','juan2','juan3','judas','apocalipsis'
  ];

  const libros = args.length > 0 ? [args[0]] : NT;
  let urlsTotal = 0;

  for (const libro of libros) {
    const archivo = `libros/${libro}.gbfxml`;
    let contenido;
    try {
      contenido = readFileSync(archivo, 'utf-8');
    } catch (err) {
      console.error(`Error al leer ${archivo}: ${err.message}`);
      continue;
    }

    const antes = contenido;
    const despues = aplicarEstilo(contenido);

    if (antes === despues) {
      if (libros.length === 1) console.log(`✅ ${libro}: sin cambios necesarios`);
    } else {
      writeFileSync(archivo, despues, 'utf-8');
      const lineasAntes = antes.split('\n').length;
      const lineasDespues = despues.split('\n').length;
      console.log(`✅ ${libro}: estilo aplicado (${lineasAntes} → ${lineasDespues} líneas)`);
    }

    // Diagnosticar posibles URLs partidas
    const lineas = despues.split('\n');
    const urlsRotas = [];
    for (let i = 0; i < lineas.length - 1; i++) {
      if (lineas[i].includes('http') && !lineas[i].includes('-->') &&
          lineas[i].match(/[a-z0-9\/%_\-=&#?]$/)) {
        const sig = lineas[i + 1].trim();
        if (sig && sig[0] === sig[0].toLowerCase() && !sig.startsWith('<') && !sig.startsWith('-->') &&
            !/^(dice|según|el |la |los |las |su |en |de |del |por |que |como |para |con |una |etimología|lícito)/.test(sig) &&
            sig.slice(0, 10).match(/[\/%=?&~#_-]/)) {
          urlsRotas.push({ linea: i + 1, antes: lineas[i].trim(), despues: sig });
        }
      }
    }
    if (urlsRotas.length > 0) {
      console.log(`   ⚠ ${libro}: ${urlsRotas.length} posibles URLs partidas:`);
      for (const u of urlsRotas) {
        console.log(`     Línea ${u.linea}: ...${u.antes.slice(-60)}\n     → ${u.despues.slice(0, 60)}...`);
      }
      urlsTotal += urlsRotas.length;
    }
  }

  if (libros.length > 1) {
    console.log(`\n✅ NT procesado (${libros.length} libros)`);
    if (urlsTotal > 0) console.log(`   ⚠ ${urlsTotal} URLs potencialmente partidas`);
  }
}

main();
