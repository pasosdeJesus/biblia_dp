# Guía del Formato GBFXML (Biblia DP)

**"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." (Salmo 119:105)**

Este formato es una evolución en XML del **General Bible Format (GBF)**, cuya especificación original se encuentra en el archivo `doc/gbf.htm` y fue creada por **Michael Paul Johnson** (disponible en [ebible.org](http://ebible.org/bible/gbf.htm)).

El formato GBFXML utilizado en el proyecto Biblia DP permite el marcado de textos bíblicos con concordancia Strong y análisis filológico avanzado.

> **Este documento es la fuente de verdad del marcado.** Las reglas normativas
> sobre `<wi>`, `<rb>` y `<rf>` viven aquí y solo aquí. Para el formato visual
> (indentación, líneas) ver `doc/estilo-gbfxml.md`; para el protocolo de
> revisión, `doc/REVISION-NT.md`.

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

### 3.1 Atributos

*   `type`: `G` (Griego), `H` (Hebreo), `GC` (Continuación de Griego), `HC` (Continuación de Hebreo), `HN` (Hebreo sin número Strong).
*   `value`: Formato `Strong,Posicion[,Morfologia[,Lema[,FormaInflectada]]]`.
*   `sacred`: Valor `yes`. Se utiliza exclusivamente para la **Invocación Sagrada**.

### 3.2 Invocación sagrada

Se marca con `sacred="yes"`. Identifica los momentos en que un ser humano (o Jesús
en Su humanidad) se dirige directamente a Dios o a Jesús reconociendo Su
divinidad.

*   *Uso:* Diferencia el vocativo sagrado («¡Señor, sálvame!») del uso narrativo
    («El Señor caminaba»).
*   *Ejemplo:* `<wi type="G" value="2424,10," sacred="yes">Jesús</wi>, hijo de David...`

### 3.3 Anidar o separar `<wi>`

**Regla general:** se **anida** (`<wi externo><wi interno>texto</wi></wi>`) solo
cuando el español funde las dos palabras griegas en **una sola palabra**; en
todos los demás casos se **separa** en `<wi>` hermanos, cada uno con su palabra.

**Se anida:**

| Caso | Ejemplo | Strong |
| :--- | :--- | :--- |
| Contracción preposición + artículo | `al`, `del` | G1519/G1537 + G3588 |
| Pronombre enclítico pegado al verbo | `recordarles`, `minístrelo`, `diciéndole` | G5279 + G5209 |
| Sujeto pronominal implícito | `escuchamos` (= nosotros escuchamos) | G2249 + G191 |
| Relativo indefinido | `aquel que` | G3739/G3745 + G302 |
| Preposición + reflexivo fundidos en «consigo» | `consigo mismo` (Lucas 12:17, ἐν ἑαυτῷ) | G1722 + G1438 |
| Reflexivo incorporado al imperativo | `Ten cuidado` (Lucas 17:3, προσέχετε ἑαυτοῖς) | G4337 + G1438 |
| Término arameo con Strong duplicado | `Ven Señor` (1 Co 16:22, μαραναθά) | G3134 + G3134 |
| Locución fija | `de ninguna manera`, `a menos que`, `por qué` | ver `herram/analizar-anidacion.mjs` |

```xml
<!-- «al» = G1519 (εἰς «a») + G3588 (τήν «el») -->
<wi type="G" value="1519,8,"><wi type="G" value="3588,9,">al</wi></wi>

<!-- «escuchamos» = G2249 (ἡμεῖς «nosotros») + G191 (ἠκούσαμεν) -->
<wi type="G" value="2249,5,"><wi type="G" value="191,6,">escuchamos</wi></wi>

<!-- «consigo mismo» = G1722 (ἐν «en») + G1438 (ἑαυτῷ «sí mismo») -->
<wi type="G" value="1722,3,"><wi type="G" value="1438,4,">consigo mismo</wi></wi>
```

**El caso arameo con Strong duplicado merece nota.** En 1 Co 16:22 el KJV
desdobla el único término arameo μαραναθά («¡Ven, Señor!») en dos Strong
iguales, G3134 y G3134. El español lo vierte como una sola expresión, así que
se anida; conviene acompañarlo de una nota `<rb><rf>` que explique la
transliteración.

**Se separa:**

| Caso | Ejemplo | Strong |
| :--- | :--- | :--- |
| Verbo auxiliar + participio | `se había` + `ocultado` | G1096 + G1416 |
| Preposición + demostrativo | `para` + `esto` | G1519 + G5124 |
| Preposición + relativo | `en` + `el que` | G1722 + G3739 |
| Cuantificador + relativo | `todos` + `los que` | G3956 + G3745 |
| Artículo + sustantivo | `pan` + `de la proposición` | G740 + G4286 |
| Verbo + pronombre objeto | `estaba sentado` → verbo y pronombre | — |

```xml
<!-- «se había ocultado» = G1096 (γινομένης) + G1416 (ἔδυ) -->
<wi type="G" value="1096,3,">se había</wi>
<wi type="G" value="1416,5,">ocultado</wi>
```

**Separable pero dependiente del traductor.** Hay casos donde ambos tratamientos
son válidos y no se fuerza la uniformidad. Ejemplo: el hebraísmo ἀποκριθεὶς
εἶπεν puede verterse como `<wi 611,1><wi 2036,5>respondió</wi></wi>` o como
`<wi 611,1>respondió</wi> <wi 2036,5>diciendo</wi>`. El clasificador lo trata
como fusión para no generar ruido.

**Verificación:** `node herram/analizar-anidacion.mjs LIBRO` clasifica cada
anidación en fusión correcta / separar / locución fija / especial.

### 3.4 Palabras vacías y continuación

*   **Palabras vacías:** marcan artículos o partículas del original que no se
    traducen explícitamente pero deben estar en la concordancia:
    `<wi type="G" value="3588,4,"/>`

*   **Continuación (`GC` / `HC`):** cuando una palabra del original se divide en
    varias palabras españolas, la primera lleva `type="G"` o `type="H"` con el
    Strong completo, y las siguientes llevan `type="GC"` o `type="HC"` con solo
    la posición. Ejemplo NT (Griego): `vamos` → `type="GC" value="5"` para
    continuar G71 en posición 5. Ejemplo AT (Hebreo, Gén 1:4): `Y` (vav prefijo)
    + `separó` (verbo) vienen de una sola palabra hebrea (וַיַּבְדֵּל, H0914):

    ```xml
    <wi type="H" value="H0914,7,TH8686">Y</wi>
    <wi type="H" value="H0430,8,">Dios</wi>
    <wi type="HC" value="7">separó</wi>
    ```

    El sujeto pronominal implícito también usa `GC` cuando se explicita:
    «Ustedes no pueden» (Lucas 16:13), con G1410 aportando «Ustedes».

    ```xml
    <wi type="G" value="1410,24,">Ustedes</wi>
    <wi type="G" value="3756,23,">no</wi>
    <wi type="GC" value="24">pueden</wi>
    ```

### 3.5 Orden de las posiciones

Las posiciones de `value` corresponden al orden del texto griego/hebreo, **no al
orden del español**. Es normal y correcto que aparezcan en orden descendente:

```xml
<!-- «les digo»: el griego es λέγω ὑμῖν (26 antes de 27) -->
<wi type="G" value="5213,27,">les</wi>
<wi type="G" value="3004,26,">digo</wi>
```

En el corpus aproximadamente el 23% de los pares consecutivos van en orden
descendente. No es un error de marcado.

### 3.6 Texto español sin `<wi>`

Las palabras que el español exige y el original no tiene (artículos,
conjunciones de enlace, pronombres objeto, preposiciones exigidas por el caso)
van como texto suelto dentro del `<t xml:lang="es">`, sin `<wi>`. Regla:

> La preposición o el artículo que el español necesita pero el griego no expresa
> con palabra propia se incluye **dentro** del `<wi>` del Strong que la rige;
> nunca se deja suelta una palabra que sí pertenece a un Strong.

Ejemplo (Lucas 3:22): `σωματικῷ εἴδει` son dos dativos; el «en» español va dentro
del `<wi>` de G1491:

```xml
<wi type="G" value="1491,8,">en forma</wi>
<wi type="G" value="4984,7,">corporal</wi>
```

---

## 4. Notas, Crítica Textual y Estilo (`<rb>`, `<rf>`, `<fp>`)

El formato permite una transparencia total sobre las decisiones de traducción.

### 4.1 Los dos usos de `<rb>`

| Forma | Contenido | `<t xml:lang="es">` interno |
| :--- | :--- | :--- |
| `<rb>` sin atributo | Bloque de variante del texto base: contiene inglés y su traducción | **Necesario** |
| `<rb xml:lang="es">` | Bloque que ya es traducción | **Innecesario** (no debe duplicarse) |

### 4.2 La nota vive dentro de su propio `<rb>`

Cuando se inserta una nota en medio de un `<t xml:lang="es">`, hay que **cerrar
el `<t>`** antes del `<rb>`, envolver con `<rb xml:lang="es">` la palabra que la
nota explica, y **abrir un nuevo `<t xml:lang="es">`** después:

```xml
<!-- MAL: <rf> suelto dentro del <t> actual -->
<t xml:lang="es">
<wi type="G" value="740,10,">pan</wi>
<wi type="G" value="4286,12,">de la proposición</wi><rf>
Nota…</rf>
<wi type="G" value="3588,11,">el</wi>
</t>

<!-- BIEN: se cierra <t>, se abre <rb>, y se reabre <t> -->
<t xml:lang="es">
<wi type="G" value="740,10,">pan</wi>
</t>
<rb xml:lang="es"><wi type="G" value="4286,12,">de la proposición</wi><rf>
Doce panes consagrados que cada sábado se ponían delante de Yahvé en el
Tabernáculo y luego en el Templo (Levítico 24:5-9).</rf></rb>
<t xml:lang="es">
<wi type="G" value="3588,11,">el</wi>
</t>
```

El contenido de `<rf>` empieza en línea nueva y `</rf></rb>` cierra en la misma
línea. Ejemplos canónicos: Mateo 1:3, Mateo 12:4, Marcos 2:26.

### 4.3 Tipos de nota

*   **Variantes textuales:** comparación con otras versiones.
    ```xml
    <rb xml:lang="es"><wi type="G" value="4396,5,">los profetas</wi><rf>
    <citebib id="WEB"/> dice `en los profetas,´ <citebib id="DiosHablaHoy"/> dice
    `el profeta Isaías.´</rf></rb>
    ```
*   **Análisis léxico:** definiciones de diccionarios (Thayer), comparación de
    versiones (SE, KJV, RVG2012).
*   **Fuentes alternativas:** términos de la Peshitta aramea.
*   **Aclaración de una expresión:** traducción literal y su sentido (Mateo 9:15).

### 4.4 Citas poéticas

Uso de `<fp>` para marcar texto que debe presentarse como poesía, común en
citas de los profetas.

---

## 5. Otros Elementos Estructurales

*   `<tt>`: Títulos. Atributo `type="ts"` para títulos de sección introducidos por el editor.
*   `<cl/>`: Salto de línea manual.
*   `<credits>`: Sección obligatoria al inicio de cada `<sb>` para detallar colaboradores y fuentes (WEB, SE, DHH, etc.).

---

## 6. Verificación antes de editar

```sh
python3 -c "import xml.etree.ElementTree as ET; ET.parse('libros/LIBRO.gbfxml')"
node herram/parse-revision.mjs LIBRO CAP          # missing/extra vacíos
node herram/analizar-anidacion.mjs LIBRO          # clasificación de anidados
node herram/diagnostico-formato.mjs LIBRO         # texto fuera de <wi>
```

---

**Diligencia Fiel:** El marcado debe ser exhaustivo y transparente, reflejando siempre la relación entre la traducción al español y el Texto Recepto (TR) o el texto base hebreo.
