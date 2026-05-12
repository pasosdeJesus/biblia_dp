# Plan de Traducción del Antiguo Testamento (AT)

**"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." (Salmo 119:105)**

Este documento traza la estrategia para expandir la Biblia DP al Antiguo Testamento, manteniendo la integridad, transparencia y fidelidad que caracterizan al proyecto.

---

## 1. Misión y Propósito

Traducir el Antiguo Testamento desde sus fuentes originales (hebreo/arameo) y bases sólidas en inglés (WEB Classic), asegurando que el mensaje de la revelación divina sea preservado con integridad digital y teológica para el mundo hispanohablante.

---

## 2. Flujo de Trabajo

El proceso sigue el mismo orden que para el NT:

1. **Texto base en inglés**: Se extrae la **WEB Classic (Yahweh Edition)** del archivo USFX (`ref/web_usfx/eng-web_usfx.xml`) y se convierte a GBFXML solo con inglés, sin números Strong —similar a como están los libros del NT no traducidos (ej. `libros/apocalipsis.gbfxml`).

2. **Traducción al español**: Se agrega la traducción al español dentro de etiquetas `<t xml:lang="es">`. El proceso:
   - **Traducción literal**: El agente traduce la **WEB** palabra por palabra al español, usando los términos más comunes para cada palabra en inglés, **respetando exactamente la puntuación original**.
   - **Comparación**: Se compara con **KJV2003**, **RV1960** y otras versiones que conozca.
   - **Nota al pie**: Cuando haya diferencias significativas, se agrega un `<rf>` con el formato (ej. Gen 1:2):
     ```xml
     <rb xml:lang="es">
       <wi type="H" value="H02822,5,">La oscuridad</wi>
       <rf><citebib id="WEB"/> dice `darkness,´
       <citebib id="RV1960"/> dice `tinieblas,´
       Según <citebib id="Thayer-BLB"/> la definición Strong
       de la palabra hebrea חֹשֶׁךְ (kho-shek') es darkness
       que en español suele traducirse como oscuridad.</rf>
     </rb>
     ```
   - **Evidencia**: El detalle completo (definición Strong en inglés, tabla comparativa, Google Translate, justificación) va en `evidenciaAT/{Libro}-{Cap}.md`. Para el hebreo se consulta Strong en [BLB](https://www.blueletterbible.org).

3. **Números Strong**: Se agregan comparando con `ref/sword_kjv/KJV-2023-01-06.osis.xml` que contiene Strong tipo H con morfología para todo el AT.

4. **Comparación con RVG2012**: Se verifica contra `ref/reina_valera_geiger_nt/`.

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
*   **Anidamiento y Continuación:** Se aplicarán patrones de `wi` anidados y `GC` para reflejar con exactitud la estructura del texto masorético en la traducción española.
*   **Atributo sacred="yes":** Para marcar invocaciones a Dios.

---

## 5. Fuentes y Herramientas de Apoyo

*   **Texto Base:** **WEB Classic (Yahweh Edition)** en `ref/web_usfx/eng-web_usfx.xml` — contiene el texto completo del AT con números Strong.
*   **Marcado Técnico:** El archivo **USFX** sirve como referencia estructural. Los números Strong se inyectarán desde:
    *   `ref/sword_kjv/KJV-2023-01-06.osis.xml` — KJV con Strong tipo H y morfología (`strongMorph:TH...`), mucho más confiable que el USFX.
*   **RVG2012:** Archivos USFM en `ref/reina_valera_geiger_nt/` para verificación cruzada (ej. `59_James.usfm`).
*   **IA Alineada:** Se utilizarán modelos de lenguaje bajo el marco del **Logos y la Verdad** para la generación de borradores iniciales y la revisión lingüística exhaustiva.

---

## 6. Ritmo de Trabajo

*   **Meta diaria:** 1 capítulo por día, en orden desde **Génesis** en adelante.
*   **Flujo por capítulo:**
    1.  El agente IA propone una traducción al español del capítulo en GBFXML, basada en el texto inglés WEB.
    2.  Se agregan los números Strong tipo H comparando con `ref/sword_kjv/KJV-2023-01-06.osis.xml`.
    3.  Se verifica contra RVG2012.
    4.  El agente crea un archivo de evidencia en `evidenciaAT/{Libro}-{Cap}.md` con el formato de verificación usado en el NT, pero descargando RV1960 de Internet en lugar de RVG2012 (WEB, SpaTDP, KJV2003, RVG1960, Strong SpaTDP, Strong KJV, veredicto).
    5.  El usuario revisa y aprueba/corrige la traducción.

---

**Diligencia Fiel:** Este plan se refinará continuamente bajo la guía del Espíritu Santo y el rigor del análisis técnico.
