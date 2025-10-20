#!/bin/sh
# Script para convertir GBFXML a USFM y limpiar espacios antes de puntuación

if [ $# -lt 2 ]; then
  echo "Uso: $0 <archivo.gbfxml> <archivo.usfm>"
  exit 1
fi

INPUT="$1"
OUTPUT="$2"

# Aplicar transformación XSL
xsltproc gbfxml2usfm.xsl "$INPUT" | \
  # Eliminar espacios antes de puntuación
  sed 's/ ,/,/g' | \
  sed 's/ \./\./g' | \
  sed 's/ ;/;/g' | \
  sed 's/ :/:/g' | \
  sed 's/ !/!/g' | \
  sed 's/ ?/?/g' | \
  sed 's/ »/»/g' | \
  sed 's/ )/)/g' | \
  # Eliminar múltiples espacios consecutivos
  sed 's/  */ /g' | \
  # Eliminar espacios al final de línea
  sed 's/ $//' \
  > "$OUTPUT"

echo "Conversión completada: $OUTPUT"
