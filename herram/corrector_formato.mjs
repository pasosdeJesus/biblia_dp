#!/usr/bin/env node
// -*- coding: utf-8 -*-

/**
 * Script para corregir automáticamente errores comunes de formato en los archivos gbfxml.
 * - Crea una copia de seguridad de cada archivo antes de modificarlo (ej. mateo.gbfxml -> mateo.gbfxml.bak).
 * - Reemplaza apóstrofes incorrectos (`'`) por el correcto (`´`) dentro de bloques de texto `...`.
 * - Mueve la puntuación (punto y coma) al interior de los bloques de texto `...´. -> `...´.
 * - Puede procesar todos los archivos .gbfxml o archivos específicos pasados como argumento.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function getFilesToProcess() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    // Si se pasan argumentos, se procesan esos archivos (añadiendo la extensión .gbfxml si es necesario)
    return args.map(file => file.endsWith('.gbfxml') ? file : `${file}.gbfxml`);
  }
  // Si no hay argumentos, se procesan todos los archivos .gbfxml del directorio
  const allFiles = fs.readdirSync(projectRoot);
  return allFiles.filter(file => file.endsWith('.gbfxml'));
}

const filesToProcess = getFilesToProcess();
let filesChanged = 0;

console.log("Iniciando el script de corrección de formato...");

if (filesToProcess.length === 0) {
    console.log("No se encontraron archivos para procesar.");
    process.exit(0);
}

filesToProcess.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const backupPath = `${filePath}.bak`;

  if (!fs.existsSync(filePath)) {
    console.warn(`! Advertencia: El archivo ${file} no existe y será omitido.`);
    return;
  }

  try {
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    let newContent = originalContent;

    // 1. Reemplazar apóstrofes incorrectos dentro de bloques `...`
    newContent = newContent.replace(/(\`[^´']*)'/g, '$1´');

    // 2. Mover la puntuación (punto o coma) al interior del bloque `...´.
    newContent = newContent.replace(/(\`[^´']*)(´)([.,])/g, '$1$3$2');

    if (originalContent !== newContent) {
      // Crear copia de seguridad
      fs.copyFileSync(filePath, backupPath);

      // Escribir el nuevo contenido
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`- Archivo modificado y respaldado: ${file}`);
      filesChanged++;
    }

  } catch (error) {
    console.error(`Error procesando el archivo ${file}:`, error);
  }
});

if (filesChanged > 0) {
  console.log(`\nProceso completado. Se modificaron y respaldaron ${filesChanged} archivos.`);
  console.log("Puedes verificar los cambios y, si todo es correcto, eliminar los archivos .bak");
} else {
  console.log("\nNo se encontraron errores de formato para corregir en los archivos especificados.");
}
