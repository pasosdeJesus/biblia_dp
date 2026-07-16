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

  // ── 1. Línea en blanco antes y después de <sv id="..."> ──
  // Antes: asegurar \n\n antes de <sv id=
  c = c.replace(/\n<sv id="/g, '\n\n<sv id="');
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

  // ── 3. <rf> contenido en nueva línea ──
  // <rf>texto → <rf>\ntexto
  c = c.replace(/<rf>(\S)/g, '<rf>\n$1');

  // ── 4. Ajustar líneas largas en <rf> (~80 chars) ──
  // Procesar cada <rf>...</rf>
  c = c.replace(/<rf>([\s\S]*?)<\/rf>/g, (match, contenido) => {
    const lines = contenido.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.length > 85) {
        // Partir en coma o punto
        const parts = [];
        let remaining = line;
        while (remaining.length > 85) {
          // Buscar punto, coma o espacio para partir
          let cut = remaining.lastIndexOf('. ', 80);
          if (cut < 60) cut = remaining.lastIndexOf(', ', 80);
          if (cut < 60) cut = remaining.lastIndexOf(' ', 80);
          if (cut < 60) cut = 80;
          parts.push(remaining.slice(0, cut + 1).trim());
          remaining = remaining.slice(cut + 1).trim();
        }
        if (remaining) parts.push(remaining);
        result.push(parts.join('\n'));
      } else {
        result.push(line);
      }
    }
    return '<rf>' + result.join('\n') + '</rf>';
  });

  // ── 5. Limpiar: evitar doble espacio después de /> en misma línea ──
  c = c.replace(/\/><wi ([^>]*\/)>/g, '/><wi $1>');

  // ── 6. Quitar línea en blanco después de <sc> y antes de </sc> ──
  c = c.replace(/<sc id="([^"]+)">\n\n/g, '<sc id="$1">\n');
  c = c.replace(/\n\n<\/sc>/g, '\n</sc>');

  // ── 7. Quitar línea en blanco antes del primer <sv> de un <cm> ──
  c = c.replace(/<cm>\n\n<sv/g, '<cm>\n<sv');

  return c;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Uso: node herram/estilo-gbfxml.mjs <libro>');
    console.error('Ejemplo: node herram/estilo-gbfxml.mjs marcos');
    process.exit(1);
  }

  const libro = args[0];
  const archivo = `libros/${libro}.gbfxml`;

  let contenido;
  try {
    contenido = readFileSync(archivo, 'utf-8');
  } catch (err) {
    console.error(`Error al leer ${archivo}: ${err.message}`);
    process.exit(1);
  }

  const antes = contenido;
  const despues = aplicarEstilo(contenido);

  if (antes === despues) {
    console.log(`✅ ${libro}: sin cambios necesarios`);
    return;
  }

  writeFileSync(archivo, despues, 'utf-8');

  // Contar cambios
  const lineasAntes = antes.split('\n').length;
  const lineasDespues = despues.split('\n').length;
  console.log(`✅ ${libro}: estilo aplicado (${lineasAntes} → ${lineasDespues} líneas)`);
}

main();
