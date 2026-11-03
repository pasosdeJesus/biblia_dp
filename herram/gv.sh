#!/bin/sh
# Abre en gvim el libro en traducción y su referencia KJV,
# leyendo los nombres del Makefile (variables VS_LIBRO y VS_SWORDBOOK).

cd "$(dirname "$0")/.." || exit 1

VS_LIBRO=$(sed -n 's/^VS_LIBRO[[:space:]]*=[[:space:]]*//p' Makefile | head -n 1)
VS_SWORDBOOK=$(sed -n 's/^VS_SWORDBOOK[[:space:]]*=[[:space:]]*//p' Makefile | head -n 1)

if [ -z "$VS_LIBRO" ] || [ -z "$VS_SWORDBOOK" ]; then
  echo "No se encontraron VS_LIBRO / VS_SWORDBOOK en el Makefile." >&2
  exit 1
fi

gvim "libros/${VS_LIBRO}.gbfxml" &
gvim "${VS_SWORDBOOK}-KJV.tmp" &
