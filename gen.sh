#!/bin/sh
# Genera archivos en otros formatos a partir de gbfxml

(cd gen/capitulos; ./parte.sh)
trad=`grep -l "wi type" *gbfxml`
(for i in $trad; do  n=`echo $i | sed -e "s/.gbfxml//"`; echo $n; ./gbfxml2usfm.sh $i gen/usfm; done)
node herram/extmorf.js
