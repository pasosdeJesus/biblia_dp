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
    <xsl:apply-templates select=".//t[@xml:lang='es']" mode="extract-text"/>
    
    <!-- Agregar salto de línea al final del versículo -->
    <xsl:text>&#10;</xsl:text>
  </xsl:template>

  <!-- Template para extraer texto en español -->
  <xsl:template match="t[@xml:lang='es']" mode="extract-text">
    <xsl:apply-templates mode="text-only"/>
  </xsl:template>

  <!-- Template para extraer solo texto, ignorando elementos wi y otros -->
  <xsl:template match="wi" mode="text-only">
    <xsl:value-of select="."/>
  </xsl:template>

  <!-- Template para texto directo -->
  <xsl:template match="text()" mode="text-only">
    <xsl:value-of select="normalize-space(.)"/>
    <xsl:if test="normalize-space(.) != '' and following-sibling::node()">
      <xsl:text> </xsl:text>
    </xsl:if>
  </xsl:template>

  <!-- Ignorar elementos rb (notas al pie) en el texto principal -->
  <xsl:template match="rb" mode="text-only"/>
  
  <!-- Ignorar elementos rf (referencias) -->
  <xsl:template match="rf" mode="text-only"/>
  
  <!-- Ignorar elementos cl (saltos de línea en poesía) -->
  <xsl:template match="cl" mode="text-only"/>
  
  <!-- Ignorar elementos fp (párrafos de poesía) -->
  <xsl:template match="fp" mode="text-only"/>
  
  <!-- Ignorar elementos fr (citas) -->
  <xsl:template match="fr" mode="text-only"/>

  <!-- Template por defecto: no procesar otros elementos -->
  <xsl:template match="*"/>
  
</xsl:stylesheet>