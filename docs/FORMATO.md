# Formatos, Extensiones y Herramientas

## Formatos y Extensiones

*   **.gbf**: GBF - General Bible Format
*   **.gbfxml**: GBF XML - Versión XML de GBF
*   **.xdbk**: DocBook
*   **.xsl**: XSLT
*   **.dsl**: DSSSL
*   **.ps**: PostScript
*   **.pdf**: PDF
*   **.tex**: TeX
*   **.dvi**: DVI (TeX)
*   **.awk**: Script para AWK

## Conversiones y Herramientas

```
                                                        docbookrep_html.xsl
                                                        estilohtml.xsl
    gbf2xml.awk           gbfxml2db.xsl   (XML) /--------------> HTML
GBF -----------> GBF XML -----------------> DocBook 
                    |                        | (SGML)
                    |                         -----> TeX -------> DVI  ---> PS
                    |                 docbookrep_tex.dsl  jadetex     dvips |
                    |                        estilo.dsl                     |
                    |                                                ps2pdf V
                    |                                                      PDF
                    |   gbfxml2html.xls
                    -----------------------> HTML (una página)
                    |
                    |  gbfxml2vhtml.xls
                    -----------------------> HTML (una página por libro)
```

Parte de los scripts para conversión (a partir de DocBook), así como los scripts de configuración y publicación se basan en los de repasa: <http://structio.sourceforge.net/repasa>

---

## ¿Por qué GBFXML?

Existen varios formatos de marcado para textos, como:

*   **TEI (Text Encoding Initiative):** <http://www.tei-c.org/Lite/>
    *   Permite mantener muchos detalles de un libro impreso en XML.

*   **DocBook:** <http://www.docbook.org>
    *   Permite mantener la estructura de un libro.

*   **ThML (Theological Markup Language):** <http://www.ccel.org/ThML/>
    *   Empleado en textos de la Christian Classics Ethereal Library (CCEL).

Cada uno de estos lenguajes ofrece sus ventajas, aunque ninguno es específico para la Biblia. En cambio, **GBFXML** toma los elementos fundamentales de **GBF**, que sí es un formato específico para la Biblia.

La conversión de GBFXML a otros formatos XML como los descritos es relativamente fácil preparando hojas de estilo XSLT.
