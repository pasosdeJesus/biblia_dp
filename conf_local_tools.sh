# Detección de herramientas específicas para biblia_dp
# Este archivo es incluido por herram_confsh/conf.sh

check "JADE" "" "test -x \$JADE" `command -v jade 2> /dev/null` `command -v openjade 2> /dev/null`
check "JADETEX" "" "test -x \$JADETEX" `command -v jadetex 2> /dev/null`
check "PDFJADETEX" "" "test -x \$PDFJADETEX" `command -v pdfjadetex 2> /dev/null`
check "XMLLINT" "" "test -x \$XMLLINT" `command -v xmllint 2> /dev/null`
check "XSLTPROC" "optional" "test -x \$XSLTPROC" `command -v xsltproc 2> /dev/null`

if [ -x "$XSLTPROC" ]; then
	verxsltproc=`xsltproc -V | head -n 1 | sed -e "s/.*libxslt \([0-9]*\) .*/\1/g"`
	if [ "$verxsltproc" -lt "10019" ]; then
		echo "Se requiere xsltproc 1.0.19 o superior. Empleando jade como alternativa."
		HTML_PROC=dbrep_html_jade
		changeVar HTML_PROC 1
	fi
elif [ "$HTML_PROC" = "dbrep_html_xsltproc" ]; then
	HTML_PROC=dbrep_html_jade
	changeVar HTML_PROC 1
fi

check "DVIPS" "" "test -x \$DVIPS" `command -v dvips 2> /dev/null`
check "PS2PDF" "" "test -x \$PS2PDF" `command -v ps2pdf 2> /dev/null`

check "DOCBOOK_XML_DIR" "" "test -f \$DOCBOOK_XML_DIR/docbookx.dtd" "/usr/local/share/xml/docbook/4.2" "/usr/local/share/xml/docbook/4.1.2" "/usr/share/sgml/docbook/dtd/xml/4.1.2" "/usr/share/sgml/docbook/dtd/4.2/"
check "DOCBOOK_DSSSL" "optional" "test -f \$DOCBOOK_DSSSL/html/docbook.dsl" "/usr/local/share/sgml/docbook/dsssl/modular/" "/usr/share/sgml/docbook/stylesheet/dsssl/modular/"
check "CATALOG_DSSSL" "" "test -f \$CATALOG_DSSSL" "/usr/local/share/sgml/catalog" "/etc/sgml/catalog"
check "SGML_XML" "" "test -f \$SGML_XML" "$DOCBOOK_DSSSL/dtds/decls/xml.dcl" "/usr/share/sgml/declaration/xml.dcl"
check "DOCBOOK_XSL" "optional" "test -f \$DOCBOOK_XSL/html/docbook.xsl" "/usr/local/share/xml/docbook-xsl" "/usr/share/sgml/docbook/stylesheet/xsl/nwalsh" "/usr/local/share/xsl/docbook/"

check "CONVERT" "" "test -x \$CONVERT" `command -v convert 2> /dev/null`
check "DOT" "optional" "test -x \$DOT" `command -v dot 2> /dev/null`
check "FIG2DEV" "optional" "test -x \$FIG2DEV" `command -v fig2dev 2> /dev/null`
check "ISPELL" "optional" "test -x \$ISPELL" `command -v ispell 2> /dev/null`
check "TIDY" "optional" "test -x \$TIDY" `command -v tidy 2> /dev/null`
