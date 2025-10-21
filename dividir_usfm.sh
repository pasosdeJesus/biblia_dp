#!/bin/sh
# Script para dividir un archivo USFM en capítulos individuales

if [ $# -lt 2 ]; then
  echo "Uso: $0 <archivo.usfm> <directorio_salida>"
  exit 1
fi

INPUT="$1"
OUTPUT_DIR="$2"

# Crear directorio de salida si no existe
mkdir -p "$OUTPUT_DIR"

# Extraer el nombre base del libro (sin extensión)
BOOK_NAME=$(basename "$INPUT" .usfm)

# Usar awk para dividir por capítulos
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
    print header > outfile
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
' "$INPUT"

echo "Archivo dividido en capítulos en: $OUTPUT_DIR"
ls -1 "$OUTPUT_DIR"
