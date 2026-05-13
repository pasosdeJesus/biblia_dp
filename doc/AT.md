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
   - **Traducción literal del inglés**: El agente traduce la **WEB** palabra por palabra al español, usando los términos más comunes para cada palabra en inglés, **respetando exactamente la puntuación original**. Esta traducción se registra en `evidenciaAT/{Libro}-{Cap}.md`.
   - **Mejora según el hebreo**: Cuando el texto hebreo difiera significativamente de la WEB (ej. presencia de ו vav consecutivo que marca secuencia narrativa, o palabras que WEB traduce de forma libre), se ajusta la traducción para acercarla más al hebreo. El cambio y su razón se documentan en la evidencia.
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

3. **Números Strong, morfología y posiciones**: Se obtienen del **Westminster Leningrad Codex (WLC)** a través de `ref/openscriptures_morphhb/wlc/` (OpenScriptures MorphHB). Cada palabra hebrea en el manuscrito tiene una posición secuencial dentro del verso que se usa como referencia. La morfología (formato THxxxx) se toma del KJV (`ref/sword_kjv/KJV-2023-01-06.osis.xml`).

   **Asignación de posiciones:** El segundo valor del atributo `value` (ej. `H01254,2,TH8804`) indica la posición de la palabra en el **texto hebreo (WLC)**, no en la traducción española. Los elementos `<wi>` en el GBFXML se ordenan según el español para que la lectura sea natural, pero los números de posición reflejan el orden del manuscrito. Ejemplo (Gén 1:1):
   ```xml
   <wi type="H" value="H07225,1,">En el principio</wi>
   <wi type="H" value="H0430,3,">Dios</wi>
   <wi type="H" value="H01254,2,TH8804,">creó</wi>
   <wi type="H" value="H08064,5,"><wi type="H" value="H0853,4,">los cielos</wi></wi>
   ```
   La posición 2 (H01254, _creó_) precede a la 3 (H0430, _Dios_) en hebreo, aunque en español aparezca invertido.

   **Anidamiento:** Cuando dos palabras hebreas se traducen juntas en español, se anidan con sus respectivas posiciones:
   ```xml
   <wi type="H" value="H08064,5,"><wi type="H" value="H0853,4,">los cielos</wi></wi>
   ```
   La morfología solo se asigna al Strong principal (el verbo), no a partículas (H0853, H0996).

4. **Comparación con RV1960**: Se verifica contra la Reina-Valera 1960 consultada en [BibleGateway](https://www.biblegateway.com).

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
*   **Anidamiento y Continuación:** Se aplicarán patrones de `wi` anidados y `GC` para reflejar con exactitud la estructura del texto masorético en la traducción española.
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
*   **Flujo por versículo:**
    1.  El agente agrega el versículo al archivo de evidencias en 
        `evidenciaAT/{Libro}-{Cap}.md` siguiendo el formato de 
        `evidenciaAT/Genesis-1.md`. Cada versículo incluye la información
        de cada uno de los pasos siguientes
    2.  **WEB Literal:** El agente IA propone una traducción literal al 
        español del versículo a partir del texto inglés WEB, manteniendo 
        la puntuación, sentido y las palabras más usadas actualmente en español.
    3. **KJV2003:** El agente extrae el versículo de **KJV2003** 
       `ref/sword_kjv/KJV-2023-01-06.osis.xml` junto con el marcado Strong 
       y la morfología que allí aparece. Usa esta información para proponer
       un marcado Strong inicial para la traducción. Si se nota la necesidad
       de modificar la traducción se hace justificando.
    4. **Hebreo WLC con Strong y morfología:** El agente extrae el 
       versículo de WLC en Hebreo con marcado Strong, morfología y 
       posición de cada palabra en Hebreo de `ref/openscriptures_morphhb/wlc/`.
       Usa esta información para asignar posiciones a cada strong propuesto
       y mejorar la morfologia. Si se la necesidad de mejorar la traducción
       para que sea semánticamente más equivalente al hebreo se hace y se
       justifica.
    5. **RV1960:** El agente extrae el versículo de RV1960 consultando 
       [BibleGateway](https://www.biblegateway.com).  El agente compara
       la traducción con esta, si se ve la necesidad de mejorar la traducción
       se hace y se justifica.
    6. En libros/{libro}.gbfxml el agente modifica el versículo agregando 
       el marcado GBFXML con la traducción con la respectiva concordancia 
       Strong, posición y morfología por palabra.  Si hay palabras, frases o 
       secciones con variaciones importantes se agrega una nota al pie 
       resumiendo como fue la traducción en cada versión consultada, los
       terminos hebreos involucrados, su significado Strong obtenido de
       [BLB](https://www.blueletterbible.org) y la justificación de la elección.
    7. El usuario revisa y aprueba/corrige el versículo traducido revisando
        de manera simultanea la traducción resultante en libros/{libro}.gbfxml
        y evidenciaAT/{libro}-{capitulo}.md.

---

**Diligencia Fiel:** Este plan se refinará continuamente bajo la guía del Espíritu Santo y el rigor del análisis técnico.
