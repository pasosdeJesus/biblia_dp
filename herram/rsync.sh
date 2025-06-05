#!/bin/sh
# Genera y publica en traduccion.pasosdeJesus.org

rm -rf html/*
make multi
echo "Generado. Presione [ENTER] para publicar"
read
rsync -ravz --delete html/ traduccion.pasosdeJesus.org:/var/www/pasosdeJesus/traduccion/
