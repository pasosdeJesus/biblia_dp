#!/bin/sh
#
# Separa <w...> en OSIS
# herram/separa-w-osis.sh ref/sword_kjv/Ephesians-2023-01-06-wp-osis.xml > ref/sword_kjv/Ephesians-2023-01-06-osis.xml 


a=$1
if (test "$a" = "" -o  ! -f "$a") then {
  echo "Primer argumento debe ser libro OSIS";
  exit 1;
} fi;
sed -e "s/\/w>,/\/w>,|/g;s/\/w>./\/w>.|/g;s/\/w>;/\/w>;|/g;s/\/w> /\/w>|/g" $a | tr "|" "\n"
