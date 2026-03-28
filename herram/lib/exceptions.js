// -*- coding: utf-8 -*-
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEPTIONS_PATH = path.join(__dirname, '..', 'data', 'excepciones.json');

let cachedExceptions = null;

export function loadExceptions() {
    if (cachedExceptions !== null) return cachedExceptions;
    
    try {
          if (fs.existsSync(EXCEPTIONS_PATH)) {
                  const content = fs.readFileSync(EXCEPTIONS_PATH, 'utf-8');
                  cachedExceptions = JSON.parse(content);
                  console.error(`[DEBUG] Exceptions loaded from ${EXCEPTIONS_PATH}`);
                  return cachedExceptions;
                } else {
                        console.error(`[DEBUG] Exceptions file not found at ${EXCEPTIONS_PATH}`);
                      }
        } catch (e) {
              console.error(`Error loading exceptions from ${EXCEPTIONS_PATH}:`, e);
            }
    
    cachedExceptions = {};
    return cachedExceptions;
}

export function getException(book, chapter, verse) {
  const exceptions = loadExceptions();
  return exceptions[book]?.[chapter]?.[verse] || null;
}

// herram/lib/exceptions.js
export function isException(book, chapter, verse, missingInSpatdp, missingInKjv2003) {
  const exception = getException(book, chapter, verse);
  if (!exception) return false;
  
  // Normalizar: el JSON puede tener "missingKjv2003" (sin 'In')
  const expectedMissingKjv2003 = new Set(exception.missingKjv2003 || exception.missingInKjv2003 || []);
  const expectedMissingSpatdp = new Set(exception.missingInSpatdp || []);
  
  const spatdpMatch = missingInSpatdp.size === expectedMissingSpatdp.size &&
    [...missingInSpatdp].every(item => expectedMissingSpatdp.has(item));
  const kjvMatch = missingInKjv2003.size === expectedMissingKjv2003.size &&
    [...missingInKjv2003].every(item => expectedMissingKjv2003.has(item));
  
  return spatdpMatch && kjvMatch;
}
