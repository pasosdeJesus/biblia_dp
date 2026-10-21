#!/usr/bin/env node
// -*- coding: utf-8 -*-

/**
 * Script para corregir automáticamente errores comunes de formato en los archivos gbfxml.
 * - Crea una copia de seguridad de cada archivo antes de modificarlo (ej. mateo.gbfxml -> mateo.gbfxml.bak).
 * - Reemplaza apóstrofes incorrectos (`'`) por el correcto (`´`) dentro de bloques de texto `...`.
 * - Mueve la puntuación (punto y coma) al interior de los bloques de texto `...´. -> `...´.
 * - Quita el espacio tras signo de apertura (« ¿ ¡ `).
 * - Puede procesar todos los archivos .gbfxml o archivos específicos pasados como argumento.
 * - --dry-run: muestra los archivos que cambiarían sin modificarlos.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filesArg = args.filter(a => !a.startsWith('--'));

function getFilesToProcess() {
  if (filesArg.length > 0) {
    return filesArg.map(file => {
      const name = file.endsWith('.gbfxml') ? file : `${file}.gbfxml`;
      // Sin directorio explícito, asumir libros/
      return name.includes('/') ? name : `libros/${name}`;
    });
  }
  const librosDir = path.join(projectRoot, 'libros');
  if (!fs.existsSync(librosDir)) return [];
  return fs.readdirSync(librosDir).filter(f => f.endsWith('.gbfxml')).map(f => `libros/${f}`);
}

function correctFormat(content) {
  let c = content;
  // 1. Reemplazar apóstrofes incorrectos dentro de bloques `...`
  c = c.replace(/(\`[^´']*)'/g, '$1´');
  // 2. Mover la puntuación (punto o coma) al interior del bloque `...´.
  c = c.replace(/(\`[^´']*)(´)([.,])/g, '$1$3$2');
  // 3. Quitar espacio tras signo de apertura (« ¿ ¡ `) antes de <wi> o palabra (salto de línea)
  c = c.replace(/([«¿¡`])[ \t]*\n[ \t]*(?=<|\p{L})/gu, '$1');
  // 4. Quitar espacio tras « ¿ ¡ (misma línea)
  c = c.replace(/([«¿¡])[ \t]+(?=\p{L})/gu, '$1');
  // 5. Quitar espacio tras ` de apertura (misma línea); se omite el ` de
  //    cierre (precedido por letra o punto), p. ej. `ἐξουσία` puede.
  c = c.replace(/(?<![\p{L}.])`[ \t]+(?=\p{L})/gu, '`');
  return c;
}

const filesToProcess = getFilesToProcess();
let filesChanged = 0;

console.log("Iniciando el script de corrección de formato...");
if (dryRun) console.log("(modo --dry-run: no se modificarán archivos)");

if (filesToProcess.length === 0) {
  console.log("No se encontraron archivos para procesar.");
  process.exit(0);
}

filesToProcess.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`! Advertencia: El archivo ${file} no existe y será omitido.`);
    return;
  }
  try {
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    const newContent = correctFormat(originalContent);
    if (originalContent !== newContent) {
      if (dryRun) {
        console.log(`- [dry-run] Cambios en: ${file}`);
      } else {
        fs.copyFileSync(filePath, `${filePath}.bak`);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`- Archivo modificado y respaldado: ${file}`);
      }
      filesChanged++;
    }
  } catch (error) {
    console.error(`Error procesando el archivo ${file}:`, error);
  }
});

if (filesChanged > 0) {
  console.log(`\nProceso completado. ${dryRun ? 'Se detectaron cambios en' : 'Se modificaron y respaldaron'} ${filesChanged} archivos.`);
  if (!dryRun) console.log("Puedes verificar los cambios y, si todo es correcto, eliminar los archivos .bak");
} else {
  console.log("\nNo se encontraron errores de formato para corregir en los archivos especificados.");
}
