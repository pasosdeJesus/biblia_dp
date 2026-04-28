#!/bin/sh
# Script para convertir GBFXML a USFM dividido por capítulos

if [ $# -lt 2 ]; then
  echo "Uso: $0 <archivo.gbfxml> <directorio_salida>"
  echo "Ejemplo: $0 marcos.gbfxml tmp_usfm/"
  echo "Creará: tmp_usfm/marcos-01.usfm, tmp_usfm/marcos-02.usfm, etc."
  exit 1
fi

INPUT="$1"
OUTPUT_DIR="$2"

# Crear directorio de salida si no existe
mkdir -p "$OUTPUT_DIR"

# Extraer nombre base del archivo (sin extensión .gbfxml)
BOOK_NAME=$(basename "$INPUT" .gbfxml)

# Archivo temporal para USFM completo
TEMP_USFM="/tmp/${BOOK_NAME}_temp.usfm"

# Aplicar transformación XSL y post-procesamiento
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
  # Eliminar espacios después de apertura de comillas y paréntesis
  sed 's/« /«/g' | \
  sed 's/` /`/g' | \
  sed 's/( /(/g' | \
  sed 's/¡ /¡/g' | \
  # Eliminar espacios antes de comillas de cierre
  sed 's/ \([`´]\)/\1/g' | \
  # Eliminar múltiples espacios consecutivos
  sed 's/  */ /g' | \
  # Eliminar espacios al final de línea
  sed 's/ $//' | \
  # Eliminar líneas en blanco múltiples
  sed '/^$/N;/^\n$/D' | \
  # Unir lineas del mismo versículo
  tr "\n" "\|" | \
  sed -e "s/\|\|*/\|/g" | \
  sed -e "s/ *| *\([^\]\)/ \1/g" | \
  tr "\|" "\n" \
  > "$TEMP_USFM"

# Dividir por capítulos usando awk
awk -v outdir="$OUTPUT_DIR" -v book="$BOOK_NAME" '
  BEGIN {
    chapter = 0
    header = ""
    in_header = 1
  }
  
  # Capturar encabezado (antes del primer \c)
  in_header == 1 && /^\\c / {
    in_header = 0
  }
  
  in_header == 1 {
    header = header $0 "\n"
    next
  }
  
  # Detectar inicio de capítulo
  /^\\c / {
    # Cerrar archivo anterior si existe
    if (chapter > 0) {
      close(outfile)
    }
    
    # Extraer número de capítulo
    chapter = $2
    
    # Crear nombre de archivo con ceros a la izquierda
    outfile = sprintf("%s/%s-%02d.usfm", outdir, book, chapter)
    
    # Escribir encabezado en el nuevo archivo
    printf "%s", header > outfile
  }
  
  # Escribir línea al archivo actual
  chapter > 0 {
    print $0 >> outfile
  }
  
  END {
    if (chapter > 0) {
      close(outfile)
    }
  }
' "$TEMP_USFM"

# Limpiar archivo temporal
rm -f "$TEMP_USFM"

echo "Conversión completada. Archivos creados en: $OUTPUT_DIR"
ls -1 "$OUTPUT_DIR"/${BOOK_NAME}-*.usfm

