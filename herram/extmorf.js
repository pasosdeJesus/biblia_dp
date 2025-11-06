#!/usr/bin/env node 

const fs = require('fs');
const path = require('path');

async function extractAndSaveMorphologyCodes() {
    const directoryPath = 'ref/sword_kjv/capitulos/';
    const outputPath = 'gen/morphology_summary.json';
    console.log(`Buscando en: ${directoryPath}`);

    const allCodes = [];
    const morphRegex = /robinson:([^\s"]+)/g;

    const ntBooksIdentifier = [
        'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
        'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm',
        'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'
    ];

    try {
        const files = await fs.promises.readdir(directoryPath);
        const ntFiles = files.filter(file => 
            ntBooksIdentifier.some(bookId => file.startsWith(bookId)) && file.endsWith('.osis.xml')
        );

        if (ntFiles.length === 0) {
            console.log('No se encontraron archivos del Nuevo Testamento.');
            return;
        }

        console.log(`Procesando ${ntFiles.length} archivos del Nuevo Testamento...`);

        for (const file of ntFiles) {
            const filePath = path.join(directoryPath, file);
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                let match;
                while ((match = morphRegex.exec(content)) !== null) {
                    allCodes.push(match[1]);
                }
            } catch (err) {
                console.error(`Error procesando el archivo ${file}`);
            }
        }

        const codeCounts = allCodes.reduce((acc, code) => {
            acc[code] = (acc[code] || 0) + 1;
            return acc;
        }, {});

        const sortedCodeCounts = Object.entries(codeCounts).sort(([a], [b]) => a.localeCompare(b));

        const summary = {
            totalOccurrences: allCodes.length,
            uniqueCodesCount: sortedCodeCounts.length,
            codes: Object.fromEntries(sortedCodeCounts)
        };

        await fs.promises.writeFile(outputPath, JSON.stringify(summary, null, 4));
        console.log(`\n¡Éxito! El resumen morfológico ha sido guardado en: ${outputPath}`);

    } catch (err) {
        console.error('Ocurrió un error en la ejecución:', err);
    }
}

extractAndSaveMorphologyCodes();
