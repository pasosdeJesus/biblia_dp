#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

// Referencia principal para los códigos morfológicos: https://studybible.info/mac

// --- DICCIONARIO DE TRADUCCIÓN ---
const dictionary = {
  // Códigos que requieren una coincidencia exacta y no deben ser parseados por partes.
  exactMatch: {
    'ARAM': { en: 'Aramaic Word', es: 'Palabra Aramea' },
    'HEB': { en: 'Hebrew Word', es: 'Palabra Hebrea' },
    'COND': { en: 'Conditional Particle', es: 'Partícula Condicional' },
    'CONJ': { en: 'Conjunction', es: 'Conjunción' },
    'INJ': { en: 'Interjection', es: 'Interjección' },
    'PREP': { en: 'Preposition', es: 'Preposición' },
    'PRT': { en: 'Particle', es: 'Partícula' },
    'ADV': { en: 'Adverb', es: 'Adverbio' },
    'ADV-C': { en: 'Adverb, contracted form', es: 'Adverbio, forma contraída' },
    'ADV-S': { en: 'Adverb, superlative', es: 'Adverbio, superlativo' },
    'ADV-I': { en: 'Adverb, interrogative', es: 'Adverbio, interrogativo' },
    'COND-C': { en: 'Conditional Particle, contracted form', es: 'Partícula Condicional, forma contraída' },
    'PRT-I': { en: 'Interrogative Particle', es: 'Partícula Interrogativa' }, // Ajustado para ser más lógico que "Plural"
    'PRT-N': { en: 'Negative Particle', es: 'Partícula Negativa' },
    'PRT_N': { en: 'Negative Particle', es: 'Partícula Negativa' }, // Corregir la errata
    'T-PAP-NPM': { en: 'Unknown 1', es: 'Desconocido 1' },
    'T-AAP-DSM': { en: 'Unknown 2', es: 'Desconocido 2' },
  },
  // Partes de la oración que pueden ser declinadas o conjugadas.
  partOfSpeech: {
    'A': { en: 'Adjective', es: 'Adjetivo' },
    'C': { en: 'Conjunction', es: 'Conjunción' },
    'D': { en: 'Adverb', es: 'Adverbio' },
    'F': { en: 'Reflexive Pronoun', es: 'Pronombre Reflexivo' },
    'I': { en: 'Interrogative Pronoun', es: 'Pronombre Interrogativo' },
    'K': { en: 'Correlative Pronoun', es: 'Pronombre Correlativo' },
    'N': { en: 'Noun', es: 'Sustantivo' },
    'P': { en: 'Personal Pronoun', es: 'Pronombre Personal' },
    'Q': { en: 'Correlative or Interrogative Pronoun', es: 'Pronombre Correlativo o Interrogativo' },
    'R': { en: 'Relative Pronoun', es: 'Pronombre Relativo' },
    'S': { en: 'Possessive Pronoun', es: 'Pronombre Posesivo' },
    'T': { en: 'Article', es: 'Artículo' },
    'V': { en: 'Verb', es: 'Verbo' },
    'X': { en: 'Indeclinable Particle', es: 'Partícula Indeclinable' }
  },
  person: {
    '1': { en: '1st Person', es: '1ra Persona' },
    '2': { en: '2nd Person', es: '2da Persona' },
    '3': { en: '3rd Person', es: '3ra Persona' }
  },
  tense: {
    'P': { en: 'Present', es: 'Presente' },
    'I': { en: 'Imperfect', es: 'Imperfecto' },
    'F': { en: 'Future', es: 'Futuro' },
    'A': { en: 'Aorist', es: 'Aoristo' },
    '2A': { en: '2nd Aorist', es: '2do Aoristo' },
    'R': { en: 'Perfect', es: 'Perfecto' },
    '2R': { en: '2nd Perfect', es: '2do Perfecto' },
    'L': { en: 'Pluperfect', es: 'Pluscuamperfecto' },
    '2L': { en: '2nd Pluperfect', es: '2do Pluscuamperfecto'},
    '2F': { en: '2nd Future', es: '2do Futuro' },
    'X': { en: 'No Tense', es: 'Sin Tiempo' }
  },
  voice: {
    'A': { en: 'Active', es: 'Activo' },
    'M': { en: 'Middle', es: 'Medio' },
    'P': { en: 'Passive', es: 'Pasivo' },
    'D': { en: 'Middle or Passive Deponent', es: 'Medio o Pasivo Deponente' },
    'E': { en: 'Middle Deponent', es: 'Medio Deponente' },
    'O': { en: 'Passive Deponent', es: 'Pasivo Deponente' },
    'N': { en: 'Middle or Passive', es: 'Medio o Pasivo' },
    'Q': { en: 'No Voice', es: 'Sin Voz' },
    'X': { en: 'No Voice', es: 'Sin Voz' }
  },
  mood: {
    'I': { en: 'Indicative', es: 'Indicativo' },
    'S': { en: 'Subjunctive', es: 'Subjuntivo' },
    'O': { en: 'Optative', es: 'Optativo' },
    'M': { en: 'Imperative', es: 'Imperativo' },
    'N': { en: 'Infinitive', es: 'Infinitivo' },
    'P': { en: 'Participle', es: 'Participio' }
  },
  case: {
    'N': { en: 'Nominative', es: 'Nominativo' },
    'V': { en: 'Vocative', es: 'Vocativo' },
    'G': { en: 'Genitive', es: 'Genitivo' },
    'D': { en: 'Dative', es: 'Dativo' },
    'A': { en: 'Accusative', es: 'Acusativo' }
  },
  number: {
    'S': { en: 'Singular', es: 'Singular' },
    'P': { en: 'Plural', es: 'Plural' }
  },
  gender: {
    'M': { en: 'Masculine', es: 'Masculino' },
    'F': { en: 'Feminine', es: 'Femenino' },
    'N': { en: 'Neuter', es: 'Neutro' }
  },
  special: {
    'ABB': {en: 'Abbreviated', es: 'Abreviado'},
    'ATT': {en: 'Attic', es: 'Ático'},
    'C': {en: 'Comparative', es: 'Comparativo'},
    'I': {en: 'Interrogative', es: 'Interrogativo'},
    'IRR': {en: 'Irregular', es: 'Irregular'},
    'LI': {en: 'Indeclinable', es: 'Indeclinable'},
    'NUI': {en: 'Indeclinable Numeral', es: 'Numeral Indeclinable'},
    'OI': {en: 'Indeclinable', es: 'Indeclinable'},
    'PRI': {en: 'Proper Name', es: 'Nombre Propio'},
    'S': {en: 'Superlative', es: 'Superlativo'}
  }
};

function translateCode(code) {
    // Normalize codes like PRT_N to PRT-N
    const normalizedCode = code.replace('_', '-');
    if (dictionary.exactMatch[normalizedCode]) {
        return { en_full_name: dictionary.exactMatch[normalizedCode].en, es_full_name: dictionary.exactMatch[normalizedCode].es };
    }

    const parts = code.split('-');
    let restOfDeclension = '';
    const translations = { en: [], es: [] };
    const pos = parts[0];
    const posInfo = dictionary.partOfSpeech[pos];

    if (!posInfo) {
        return { en_full_name: `Unknown Code: ${code}`, es_full_name: `Código Desconocido: ${code}` };
    }
    translations.en.push(posInfo.en);
    translations.es.push(posInfo.es);

    const mainParts = parts.slice(1);
    let specialSuffix = null;

    if (mainParts.length > 0 && dictionary.special[mainParts[mainParts.length - 1]]) {
        specialSuffix = mainParts.pop();
    }
    
    let declensionStr = mainParts.join('');

    if (pos === 'V') {
        const tensePartMatch = declensionStr.match(/^(2A|2R|2L|2F|P|I|F|A|R|L|X)/);
        const tensePart = tensePartMatch ? tensePartMatch[0] : '';
        let rest = declensionStr.substring(tensePart.length);

        const voice = rest[0] || '';
        const mood = rest[1] || '';
        rest = rest.substring(2);

        translations.en.push(`${dictionary.tense[tensePart]?.en || ''} ${dictionary.voice[voice]?.en || ''} ${dictionary.mood[mood]?.en || ''}`.trim().replace(/\s+/g, ' '));
        translations.es.push(`${dictionary.tense[tensePart]?.es || ''} ${dictionary.voice[voice]?.es || ''} ${dictionary.mood[mood]?.es || ''}`.trim().replace(/\s+/g, ' '));
        
        if (mood === 'P') { // Participle, uses declension
            const caseVal = rest[0] || '';
            const number = rest[1] || '';
            const gender = rest[2] || '';
            rest = rest.substring(3);
            translations.en.push(`${dictionary.case[caseVal]?.en || ''} ${dictionary.number[number]?.en || ''} ${dictionary.gender[gender]?.en || ''}`.trim().replace(/\s+/g, ' '));
            translations.es.push(`${dictionary.case[caseVal]?.es || ''} ${dictionary.number[number]?.es || ''} ${dictionary.gender[gender]?.es || ''}`.trim().replace(/\s+/g, ' '));
        } else if (mood !== 'N') { // Finite verb (not infinitive)
            const person = rest[0] || '';
            const number = rest[1] || '';
            rest = rest.substring(2);
            translations.en.push(`${dictionary.person[person]?.en || ''} ${dictionary.number[number]?.en || ''}`.trim().replace(/\s+/g, ' '));
            translations.es.push(`${dictionary.person[person]?.es || ''} ${dictionary.number[number]?.es || ''}`.trim().replace(/\s+/g, ' '));
        }
        restOfDeclension = rest;

    } else if (pos === 'P') { // Pronombre Personal
        const person = declensionStr[0] || '';
        const caseVal = declensionStr[1] || '';
        const number = declensionStr[2] || '';
        const gender = (person === '3' && declensionStr.length > 3) ? declensionStr[3] : null;
        
        let personEn = dictionary.person[person]?.en || '';
        let personEs = dictionary.person[person]?.es || '';

        let consumed = 3;
        if (gender && dictionary.gender[gender]) {
            personEn = `${personEn} ${dictionary.gender[gender].en}`;
            personEs = `${personEs} ${dictionary.gender[gender].es}`;
            consumed = 4;
        }

        translations.en.push(`${personEn} ${dictionary.case[caseVal]?.en || ''} ${dictionary.number[number]?.en || ''}`.trim().replace(/\s+/g, ' '));
        translations.es.push(`${personEs} ${dictionary.case[caseVal]?.es || ''} ${dictionary.number[number]?.es || ''}`.trim().replace(/\s+/g, ' '));
        restOfDeclension = declensionStr.substring(consumed);

    } else if (['F', 'S'].includes(pos)) { // Pronombre Reflexivo/Posesivo
        const person = declensionStr[0] || '';
        const caseVal = declensionStr[1] || '';
        const number = declensionStr[2] || '';
        const gender = declensionStr[3] || '';
        translations.en.push(`${dictionary.person[person]?.en || ''} ${dictionary.case[caseVal]?.en || ''} ${dictionary.number[number]?.en || ''} ${dictionary.gender[gender]?.en || ''}`.trim().replace(/\s+/g, ' '));
        translations.es.push(`${dictionary.person[person]?.es || ''} ${dictionary.case[caseVal]?.es || ''} ${dictionary.number[number]?.es || ''} ${dictionary.gender[gender]?.es || ''}`.trim().replace(/\s+/g, ' '));
        restOfDeclension = declensionStr.substring(4);

    } else if (declensionStr) { // Resto de palabras declinables
        const caseVal = declensionStr[0] || '';
        const number = declensionStr[1] || '';
        const gender = declensionStr[2] || '';
        translations.en.push(`${dictionary.case[caseVal]?.en || ''} ${dictionary.number[number]?.en || ''} ${dictionary.gender[gender]?.en || ''}`.trim().replace(/\s+/g, ' '));
        translations.es.push(`${dictionary.case[caseVal]?.es || ''} ${dictionary.number[number]?.es || ''} ${dictionary.gender[gender]?.es || ''}`.trim().replace(/\s+/g, ' '));
        restOfDeclension = declensionStr.substring(3);
    }

    if (specialSuffix) {
        translations.en.push(dictionary.special[specialSuffix].en);
        translations.es.push(dictionary.special[specialSuffix].es);
    }

    if (restOfDeclension) {
        translations.en.push(`(Unrecognized suffix: ${restOfDeclension}?)`);
        translations.es.push(`(Sufijo no reconocido: ${restOfDeclension}?)`);
    }
    
    return {
        en_full_name: translations.en.filter(p => p).join(' - '),
        es_full_name: translations.es.filter(p => p).join(' - '),
    };
}

async function extractAndSaveMorphologyCodes() {
    const directoryPath = 'ref/sword_kjv/capitulos2003/';
    const outputPath = 'gen/resumen_morfologia.json';
    console.log(`Buscando en: ${directoryPath}`);

    const codeCounts = {};
    const morphRegex = /robinson:([^\\s"]+)/g;

    const ntBooksIdentifier = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'];

    try {
        const files = await fs.promises.readdir(directoryPath);
        const ntFiles = files.filter(file => ntBooksIdentifier.some(bookId => file.startsWith(bookId)) && file.endsWith('.osis.xml'));

        console.log(`Procesando ${ntFiles.length} archivos del Nuevo Testamento...`);
        
        for (const file of ntFiles) {
            const filePath = path.join(directoryPath, file);
            const content = await fs.promises.readFile(filePath, 'utf-8');
            let match;
            while ((match = morphRegex.exec(content)) !== null) {
                const code = match[1];
                codeCounts[code] = (codeCounts[code] || 0) + 1;
            }
        }

        const sortedCodes = Object.keys(codeCounts).sort();
        const translatedSummary = {};
        for (const code of sortedCodes) {
            const { en_full_name, es_full_name } = translateCode(code);
            translatedSummary[code] = {
                count: codeCounts[code],
                en_full_name,
                es_full_name,
            };
        }

        await fs.promises.writeFile(outputPath, JSON.stringify(translatedSummary, null, 4));
        console.log(`\\n¡Éxito! El resumen morfológico ha sido guardado en: ${outputPath}`);

    } catch (err) {
        console.error('Ocurrió un error en la ejecución:', err);
    }
}

extractAndSaveMorphologyCodes();

