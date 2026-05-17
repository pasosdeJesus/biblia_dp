# Plan de Traducción del Antiguo Testamento (AT)

**"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." (Salmo 119:105)**

Este documento traza la estrategia para expandir la Biblia DP al Antiguo Testamento, manteniendo la integridad, transparencia y fidelidad que caracterizan al proyecto.

---

## 1. Misión y Propósito

Traducir el Antiguo Testamento desde sus fuentes originales (hebreo/arameo) y bases sólidas en inglés (WEB Classic), asegurando que el mensaje de la revelación divina sea preservado con integridad digital y teológica para el mundo hispanohablante.

---

## 2. Flujo de Trabajo

El proceso para traducir el AT al español sigue los mismos pasos que para el NT, pero usando como fuentes la WEB Classic (Yahweh Edition) para el texto base, el Westminster Leningrad Codex (WLC) para las posiciones y morfología hebrea, y el KJV2003 como referencia cruzada de Strong.

Cada versículo se traduce siguiendo el flujo detallado en la sección 6 (Ritmo de Trabajo).

---

## 3. Conversión USFX → GBFXML

**Herramienta:** `herram/usfx2gbfxml.mjs` — script Node.js que extrae el texto inglés de cada libro del AT desde el archivo USFX, eliminando números Strong y notas, generando GBFXML con la misma estructura que los libros del NT sin traducir.

**Formato de entrada (USFX):**
```xml
<v id="1" bcv="GEN.1.1" /><w s="H8064">In</w> <w s="H1254">the</w> <w s="H7225">beginning</w>...
```

**Formato de salida (GBFXML):**
```xml
<sv id="Genesis-1-1">
In the beginning, God created the heavens and the earth.
</sv>
```

**Uso:**
```bash
# Todos los 39 libros del AT
node herram/usfx2gbfxml.mjs

# Un libro específico (salida a stdout)
node herram/usfx2gbfxml.mjs GEN
```

**Libros generados:** 39, desde `libros/genesis.gbfxml` hasta `libros/malachi.gbfxml`.

---

## 4. Criterios Técnicos de Marcado (GBFXML)

Al iniciar la traducción del AT, se aplicará el rigor técnico documentado en `doc/gbfxml.md`, con las siguientes especificaciones:

*   **Tipificación de Strong:** Se utilizará `type="H"` para todos los números Strong correspondientes al hebreo y arameo.
*   **Posiciones según el WLC:** El segundo valor del atributo `value` (ej. `H07225,1,`) corresponde a la posición secuencial de la palabra en el **Westminster Leningrad Codex** dentro del verso. Para determinar la posición se usa `ref/openscriptures_morphhb/wlc/{Libro}.xml`: cada `<w>` del WLC equivale a una posición, contando desde 1 por verso. Los `<wi>` en el GBFXML pueden aparecer en distinto orden al hebreo (siguen la sintaxis española), pero la numeración siempre refleja el manuscrito.
*   **Anidamiento y Continuación:** Se aplicarán patrones de `wi` anidados y `type="HC"` para reflejar con exactitud la estructura del texto masorético en la traducción española.
*   **Continuación (`type="HC"`):** Cuando una palabra hebrea se divide en varias palabras españolas, la primera lleva `type="H"` con el Strong y la posición, y las siguientes llevan `type="HC"` con solo la posición. Ejemplo (Gén 1:4 — וַיַּבְדֵּל, H0914):
    ```xml
    <wi type="H" value="H0914,7,TH8686">Y</wi>
    <wi type="H" value="H0430,8,">Dios</wi>
    <wi type="HC" value="7">separó</wi>
    ```
    La "Y" y "separó" comparten la posición 7 (misma palabra hebrea).
*   **Partículas sin traducción:** Cuando una palabra hebrea no tiene equivalente directo en español (ej. H0853 אֶת, partícula de objeto directo), se agrega como `<wi>` vacío en la posición que ocupa en el WLC:
    ```xml
    <wi type="H" value="H0853,3,"/><wi type="H" value="H0216,4,">la luz</wi>
    ```
*   **Atributo sacred="yes":** Para marcar invocaciones a Dios.

---

## 5. Fuentes y Herramientas de Apoyo

*   **Texto Base:** **WEB Classic (Yahweh Edition)** en `ref/web_usfx/eng-web_usfx.xml` — contiene el texto completo del AT con números Strong.
*   **Manuscrito de referencia (WLC):** `ref/openscriptures_morphhb/wlc/` — Texto hebreo del **Westminster Leningrad Codex** con números Strong tipo H, morfología e IDs únicos por palabra. Licencia CC BY 4.0 (OpenScriptures MorphHB). Es la fuente principal para determinar el orden de las palabras hebreas y asignar posiciones.
*   **Morfología (KJV):** `ref/sword_kjv/KJV-2023-01-06.osis.xml` — KJV con Strong tipo H y morfología (`strongMorph:TH...`), para verificación cruzada.
*   **RV1960:** Se consulta en [BibleGateway](https://www.biblegateway.com) para verificación cruzada. No se incluye en el repositorio por derechos de autor.
*   **IA Alineada:** Se utilizarán modelos de lenguaje bajo el marco del **Logos y la Verdad** para la generación de borradores iniciales y la revisión lingüística exhaustiva.

---

## 6. Ritmo de Trabajo

*   **Meta diaria:** 1 capítulo por día, en orden desde **Génesis** en adelante.
*   **Flujo por versículo:** Se procesa cada versículo siguiendo estos pasos. La
    evidencia de cada paso se registra en `evidenciaAT/{Libro}-{Cap}.md`.
    Ver `evidenciaAT/Genesis-1.md` como ejemplo completo.

### Formato del archivo de evidencia

Cada versículo se documenta con los siguientes pasos como encabezados:

    ### Paso 2: WEB Literal

    **WEB:** {texto inglés de WEB}

    **Traducción literal WEB:** {traducción palabra por palabra al español}

    ### Paso 3: KJV2003 — Strong inicial

    **KJV2003:** {texto inglés de KJV2003}

    **KJV2003 con Strong:**
    {texto inglés con (H0XXXX) o (H0XXXX,THxxxx) después de cada palabra o frase}

    *Justificación: {explicación si hay ajuste respecto a WEB}*

    ### Paso 4: Hebreo WLC — Posiciones y morfología

    **Hebreo WLC con Strong:**
    {palabra hebrea (H0XXXX, posN)  ... varias en cada línea}

    *Justificación: {explicación si hay ajuste por orden VSO vs SVO,
     vav consecutivo u otra diferencia}*

    ### Paso 5: RV1960 — Comparación

    **RV1960:** {texto de RV1960 desde BibleGateway}

    *Justificación: {explicación si hay ajuste respecto a WEB/WLC}*

    ### Paso 6: Traducción final (SpaTDP)

    **SpaTDP:** {traducción final al español}

    ### Paso 7: Validación

    ```
    $ node herram/validador.mjs {libro} {capitulo} {versiculo}
    0 discrepancias. Versículo válido.
    ```

    **Verificación:** ✓ {resumen de verificación}

### Reglas por paso

**Paso 2 — WEB Literal:**
- Traducir palabra por palabra desde el inglés de la WEB.
- Mantener puntuación, sentido y vocabulario moderno.
- No ajustar aún por hebreo — eso ocurre en pasos siguientes.

**Paso 3 — KJV2003:**
- Extraer el versículo de `ref/sword_kjv/KJV-2023-01-06.osis.xml`.
- Presentar el texto inglés con cada palabra o frase seguida de su Strong
  entre paréntesis: `And God (H0430) called (H07121,TH8804) the light (H0216)...`
- La morfología THxxxx se incluye después del número Strong cuando aparece.
- Si KJV difiere de WEB en vocabulario, decidir si amerita ajuste y justificarlo.

**Paso 4 — Hebreo WLC:**
- Extraer el versículo de `ref/openscriptures_morphhb/wlc/{WLCcode}.xml`.
- Mostrar cada palabra hebrea seguida de su Strong, posición y morfología
  entre paréntesis, todo en la misma línea. Varias palabras por línea.
  Formato: `בְּרֵאשִׁית (H07225, pos1)  בָּרָא (H01254, pos2, TH8804)`
- Asignar posiciones según el orden secuencial de palabras en el WLC (1-based).
- La morfología (THxxxx) se toma del KJV2003.
- Si el orden hebreo (VSO) difiere del español (SVO), justificar la elección.
- Si hay vav consecutivo u otra partícula que afecte la traducción,
  documentarlo.

**Paso 5 — RV1960:**
- Consultar el versículo en [BibleGateway](https://www.biblegateway.com).
- Si RV1960 sugiere un mejor término o construcción, ajustar y justificar.

**Paso 6 — GBFXML (`libros/{libro}.gbfxml`):**
- El marcado GBFXML sigue el orden de la traducción española, no el hebreo.
- Las posiciones en `value="H0XXXX,pos,"` reflejan el orden del WLC.
- Anidar `<wi>` cuando dos palabras hebreas se traducen juntas en español:
  ```xml
  <wi type="H" value="H08064,5,"><wi type="H" value="H0853,4,">los cielos</wi></wi>
  ```
- Agregar nota `<rf>` solo cuando haya variaciones significativas entre
  versiones (vocabulario, no orden de palabras).

**Paso 7 — Validación:**
- Ejecutar `node herram/validador.mjs {libro} {capitulo} {versiculo}`.
- Si hay discrepancia por error real en el GBFXML, corregirla.
- Si la discrepancia es una variante textual válida (fidelidad al TR/WLC),
  reportarla al usuario como posible excepción.
- Solo avanzar al paso 8 cuando el validador reporte 0 discrepancias.

---

**Diligencia Fiel:** Este plan se refinará continuamente bajo la guía del Espíritu Santo y el rigor del análisis técnico.
