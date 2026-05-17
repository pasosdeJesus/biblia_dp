# Guía del Formato GBFXML (Biblia DP)

**"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." (Salmo 119:105)**

Este formato es una evolución en XML del **General Bible Format (GBF)**, cuya especificación original se encuentra en el archivo `doc/gbf.htm` y fue creada por **Michael Paul Johnson** (disponible en [ebible.org](http://ebible.org/bible/gbf.htm)).

El formato GBFXML utilizado en el proyecto Biblia DP permite el marcado de textos bíblicos con concordancia Strong y análisis filológico avanzado.

---

## 1. Estructura Jerárquica

El documento sigue una estructura XML estricta basada en el DTD `formatos/gbfxml.dtd`:

*   `<sb id="ID">`: Libro (Sub-book). Atributo `type`: `BN` (Nuevo Testamento), `BO` (Antiguo Testamento).
*   `<sc id="Libro-N">`: Capítulo.
*   `<cm type="PO|PI|etc">`: Párrafo. Permite definir el estilo (Poesía, cita indentada, etc.).
*   `<sv id="Libro-C-V">`: Versículo. Contiene el texto base (normalmente inglés PCDATA) y las traducciones.

---

## 2. El Elemento de Traducción `<t>`

El elemento `<t>` permite incluir traducciones paralelas.
*   Atributo `xml:lang`: Identifica el idioma (ej: `es` para español).
*   Uso: Se coloca dentro de un elemento que contiene PCDATA (títulos, versículos, notas).

---

## 3. Información de Palabras y Strongs (`<wi>`)

Es el elemento más crítico para la concordancia.
*   **Atributos:**
    *   `type`: `G` (Griego), `H` (Hebreo), `GC` (Continuación de Griego), `HC` (Continuación de Hebreo).
    *   `value`: Formato `Strong,Posicion[,Morfologia[,Lema[,FormaInflectada]]]`.
    *   `sacred`: Valor `yes`. Se utiliza exclusivamente para la **Invocación Sagrada**.

*   **Patrones Avanzados:**
    *   **Invocación Sagrada:** Se marca con el atributo `sacred="yes"`. Identifica los momentos en que un ser humano (o Jesús en Su humanidad) se dirige directamente a Dios o a Jesús reconociendo Su divinidad.
        *   *Uso:* Diferencia el vocativo sagrado ("¡Señor, sálvame!") del uso narrativo ("El Señor caminaba").
        *   *Ejemplo:* `<wi type="G" value="2424,X," sacred="yes">Jesús</wi>, hijo de David...`
    *   **Anidamiento:** Para asociar múltiples números Strong a una sola palabra o frase (ej: Marcos 1:1):
        `<wi type="G" value="3588,2,"><wi type="G" value="2098,3,">de la Buena Nueva</wi></wi>`

    *   **Palabras Vacías:** Para marcar artículos o partículas del original que no se traducen explícitamente pero deben estar en la concordancia:
        `<wi type="G" value="3588,4,"/>`
    *   **Continuación (`GC` / `HC`):** Cuando una palabra del original se divide en varias palabras españolas, la primera lleva `type="G"` o `type="H"` con el Strong completo, y las siguientes llevan `type="GC"` o `type="HC"` con solo la posición. Ejemplo NT (Griego): `vamos`  → `type="GC" value="5"` para continuar G71 en posición 5. Ejemplo AT (Hebreo, Gén 1:4): `Y` (vav prefijo) + `separó` (verbo) vienen de una sola palabra hebrea (וַיַּבְדֵּל, H0914):
    ```xml
    <wi type="H" value="H0914,7,TH8686">Y</wi>
    <wi type="H" value="H0430,8,">Dios</wi>
    <wi type="HC" value="7">separó</wi>
    ```

---

## 4. Notas, Crítica Textual y Estilo (`<rb>`, `<rf>`, `<fp>`)

El formato permite una transparencia total sobre las decisiones de traducción:

*   **Variantes Textuales:** (ej: Marcos 1:2)
    `<rb xml:lang="es"><wi type="G" value="4396,5,">los profetas</wi><rf><citebib id="WEB"/> dice 'en los profetas,' <citebib id="DiosHablaHoy"/> dice 'el profeta Isaías.'</rf></rb>`
*   **Análisis Léxico:** (ej: Hechos 17:25) Uso de `<rf>` para comparar definiciones de diccionarios (como Thayer) y otras versiones (`SE`, `KJV`).
*   **Fuentes Alternativas:** (ej: Juan 1:1) Inclusión de términos de la **Peshitta** aramea para dar profundidad semántica.
*   **Citas Poéticas:** Uso de `<fp>` para marcar texto que debe presentarse como poesía, común en citas de los profetas.

---

## 5. Otros Elementos Estructurales

*   `<tt>`: Títulos. Atributo `type="ts"` para títulos de sección introducidos por el editor.
*   `<cl/>`: Salto de línea manual.
*   `<credits>`: Sección obligatoria al inicio de cada `<sb>` para detallar colaboradores y fuentes (WEB, SE, DHH, etc.).

---

**Diligencia Fiel:** El marcado debe ser exhaustivo y transparente, reflejando siempre la relación entre la traducción al español y el Texto Recepto (TR) o el texto base hebreo.
