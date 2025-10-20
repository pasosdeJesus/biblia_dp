<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="text" encoding="UTF-8"/>
  <xsl:strip-space elements="*"/>

  <!-- Template principal -->
  <xsl:template match="/">
    <xsl:apply-templates select="//sb"/>
  </xsl:template>

  <!-- Template para el libro (sb) -->
  <xsl:template match="sb">
    <xsl:variable name="bookId">
      <xsl:choose>
        <xsl:when test="@id='Marcos'">MRK</xsl:when>
        <xsl:when test="@id='Mateo'">MAT</xsl:when>
        <xsl:when test="@id='Lucas'">LUK</xsl:when>
        <xsl:when test="@id='Juan'">JHN</xsl:when>
        <xsl:when test="@id='Hechos'">ACT</xsl:when>
        <xsl:when test="@id='Romanos'">ROM</xsl:when>
        <xsl:when test="@id='1 Corintios'">1CO</xsl:when>
        <xsl:when test="@id='2 Corintios'">2CO</xsl:when>
        <xsl:when test="@id='Gálatas'">GAL</xsl:when>
        <xsl:when test="@id='Efesios'">EPH</xsl:when>
        <xsl:when test="@id='Filipenses'">PHP</xsl:when>
        <xsl:when test="@id='Colosenses'">COL</xsl:when>
        <xsl:when test="@id='1 Tesalonicenses'">1TH</xsl:when>
        <xsl:when test="@id='2 Tesalonicenses'">2TH</xsl:when>
        <xsl:when test="@id='1 Timoteo'">1TI</xsl:when>
        <xsl:when test="@id='2 Timoteo'">2TI</xsl:when>
        <xsl:when test="@id='Tito'">TIT</xsl:when>
        <xsl:when test="@id='Filemón'">PHM</xsl:when>
        <xsl:otherwise><xsl:value-of select="@id"/></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    
    <!-- Encabezado USFM -->
    <xsl:text>\id </xsl:text>
    <xsl:value-of select="$bookId"/>
    <xsl:text> SpaTDP - Traducción de Dominio Público al Español&#10;</xsl:text>
    <xsl:text>\ide UTF-8&#10;</xsl:text>
    <xsl:text>\h </xsl:text>
    <xsl:value-of select="@id"/>
    <xsl:text>&#10;</xsl:text>
    <xsl:text>\toc1 </xsl:text>
    <xsl:value-of select="@id"/>
    <xsl:text>&#10;</xsl:text>
    <xsl:text>\toc2 </xsl:text>
    <xsl:value-of select="@id"/>
    <xsl:text>&#10;</xsl:text>
    <xsl:text>\mt1 </xsl:text>
    <xsl:value-of select="tt/t[@xml:lang='es']"/>
    <xsl:text>&#10;</xsl:text>
    
    <!-- Procesar capítulos -->
    <xsl:apply-templates select="sc"/>
  </xsl:template>

  <!-- Template para capítulos (sc) -->
  <xsl:template match="sc">
    <xsl:variable name="chapterNum">
      <xsl:value-of select="substring-after(@id, '-')"/>
    </xsl:variable>
    
    <xsl:text>\c </xsl:text>
    <xsl:value-of select="$chapterNum"/>
    <xsl:text>&#10;</xsl:text>
    
    <!-- Procesar versículos -->
    <xsl:apply-templates select=".//sv"/>
  </xsl:template>

  <!-- Template para versículos (sv) -->
  <xsl:template match="sv">
    <xsl:variable name="verseNum">
      <xsl:value-of select="substring-after(substring-after(@id, '-'), '-')"/>
    </xsl:variable>
    
    <!-- Agregar \p antes del primer versículo de cada párrafo -->
    <xsl:if test="parent::cm and not(preceding-sibling::sv)">
      <xsl:text>\p&#10;</xsl:text>
    </xsl:if>
    
    <xsl:text>\v </xsl:text>
    <xsl:value-of select="$verseNum"/>
    <xsl:text> </xsl:text>
    
    <!-- Extraer solo el texto en español -->
    <xsl:apply-templates mode="verse-text"/>
    
    <!-- Agregar salto de línea al final del versículo -->
    <xsl:text>&#10;</xsl:text>
  </xsl:template>

  <!-- Template para elementos t en español -->
  <xsl:template match="t[@xml:lang='es']" mode="verse-text">
    <xsl:apply-templates mode="verse-text"/>
  </xsl:template>
  
  <!-- Template para elementos wi (palabras con Strong) -->
  <xsl:template match="wi" mode="verse-text">
    <xsl:value-of select="."/>
    <xsl:text> </xsl:text>
  </xsl:template>
  
  <!-- Template para elementos rb con xml:lang='es' -->
  <xsl:template match="rb[@xml:lang='es']" mode="verse-text">
    <!-- Procesar wi y texto, pero ignorar rf -->
    <xsl:apply-templates select="wi | text()[normalize-space(.) != '']" mode="verse-text"/>
  </xsl:template>
  
  <!-- Template para elementos rb sin xml:lang (pueden contener t con xml:lang='es') -->
  <xsl:template match="rb[not(@xml:lang)]" mode="verse-text">
    <!-- Procesar elementos t en español dentro de rb, pero ignorar rf -->
    <xsl:apply-templates select="t[@xml:lang='es'] | wi" mode="verse-text"/>
  </xsl:template>
  
  <!-- Template para elementos rf (notas al pie) - ignorar completamente -->
  <xsl:template match="rf" mode="verse-text"/>
  
  <!-- Template para texto directo -->
  <xsl:template match="text()" mode="verse-text">
    <xsl:value-of select="."/>
  </xsl:template>
  
  <!-- Ignorar elementos que no son parte del texto bíblico -->
  <xsl:template match="cl|fp|fr|cm" mode="verse-text"/>
  
  <!-- Ignorar texto en inglés -->
  <xsl:template match="text()[parent::sv and not(ancestor::t[@xml:lang='es']) and not(ancestor::rb)]" mode="verse-text"/>
  
  <!-- Template por defecto: no procesar otros elementos -->
  <xsl:template match="*"/>
  
</xsl:stylesheet>