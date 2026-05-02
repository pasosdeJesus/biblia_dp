# Tareas posteriores a la configuración para biblia_dp
# Este archivo es incluido por herram_confsh/conf.sh

s=`echo "$HTML_PROC" | sed -e "s/.*single.*/1/g"`;
if [ "$s" = "1" ]; then
	db_html="docbook.xsl"	
else
	db_html="chunk.xsl"
fi

if [ "$VERBOSE_FLAG" -gt "0" ]; then echo "Generando confv.ent"; fi

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" > confv.ent
echo "<!-- Variables de configuración -->" >> confv.ent
echo "<!-- Generado automáticamente por conf.sh. No editar -->" >> confv.ent
echo "<!ENTITY DOCBOOK-XSL-HTML \"$db_html\">" >> confv.ent

addXMLConfv confv.ent

mkdir -p html
mkdir -p imp

if [ "$VERBOSE_FLAG" -gt "0" ]; then echo "Ajustando rutas en herramientas"; fi

if [ -f herram_confsh/db2rep ]; then
	echo ",s|/usr/bin/awk|$AWK|g
w
q
" | ed herram_confsh/db2rep 2> /dev/null
fi

if [ ! -f personaliza.ent ] && [ -f personaliza.ent.plantilla ]; then
	cp personaliza.ent.plantilla personaliza.ent
fi
