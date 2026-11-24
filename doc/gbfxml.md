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

### 3.3.0 El artículo y las marcas de caso

El griego marca el caso con la desinencia; el español necesita preposición. Por
eso G3588 puede llevar en su `<wi>` la preposición que corresponde al caso, sin
que eso sea un Strong adicional:

| Caso griego | Español | Ejemplo | Strong |
| :--- | :--- | :--- | :--- |
| Genitivo | «de» | «el amor **de** Dios» = ἡ ἀγάπη τοῦ θεοῦ | G3588 «de» |
| Dativo (locativo) | «en» | «tribulación **en la** carne» = θλῖψιν τῇ σαρκί (1 Co 7:28) | G3588 «en la» |
| Dativo (objeto indirecto) | «a» | «dijo **a los** discípulos» = τοῖς μαθηταῖς | G3588 «a los» |
| Acusativo con preposición | la preposición ya tiene Strong | «entró **a la** casa» = εἰς τόν οἶκον | G1519 + G3588 |

**Regla:** si el versículo tiene la preposición griega con su `<wi>` (G1722,
G1519, G1537…), la preposición va ahí y G3588 lleva solo el artículo. Si el
griego usa **caso sin preposición**, la preposición española va en el `<wi>` de
G3588, porque es la marca del caso.

**No confundir con la convención de anidar:** en estos casos no se está
afirmando que el artículo «sea» la preposición, sino que el `<wi>` de G3588
traduce el sintagma completo (artículo + caso) tal como el español lo requiere.

**Caso especial: dativo con artículo determinado + «un/una».** En 1 Co 1:10 el
griego dice τῇ αὐτῇ γνώμῃ («la misma mente») y el español idiomático es «una
misma mente». Aquí «una» no traduce el artículo: es elección del español. El
`<wi>` de G3588 queda vacío y G846 (αὐτός «mismo») lleva «una misma».

### 3.3.1 Conjunción completiva añadida

Cuando el español necesita un «que» para completar un verbo o una partícula
(«cuando vio **que**», «ordena **que**», «he aquí **que**»), y el griego no lo
tiene (usa infinitivo o yuxtaposición sin ὅτι), ese «que» **no se deja suelto**:

El criterio es la **adyacencia**, no el tipo de palabra:

| Situación | Marcado |
| :--- | :--- |
| La continuación queda **pegada** al `<wi>` que la rige | Se mete en ese `<wi>`: `<wi 991,1>cuando vio que</wi>` |
| La continuación queda **separada** por otro Strong | `<wi type="GC" value="posición">que</wi>`, con la posición del verbo |
| Ante artículo + sustantivo, pegado | Puede ir con el artículo: `<wi 3588,17>que la</wi>` |

**Cuándo se usa `type="GC"`.** `GC` marca la continuación de un Strong cuya
traducción española se partió y cuyas piezas **no quedaron adyacentes**. El
caso típico es justo el de una completiva:

```
Griego:  λέγω (1) ... σήμερον (2) ...
Español: digo ... hoy que ...
```

Aquí «que» completa a λέγω pero no puede ir en su `<wi>`, porque σήμερον se
interpone:

```xml
<wi type="G" value="3004,1,">digo</wi>
<wi type="G" value="4594,2,">hoy</wi>
<wi type="GC" value="1">que</wi>
```

Cuando las piezas sí son contiguas, basta el mismo `<wi>` y no hace falta
`GC` («cuando vio que» = G991 en una sola etiqueta). `GC` no afirma que la
palabra griega se haya dividido en sentido morfológico: afirma que **ese
segmento español sigue traduciendo el mismo Strong** que el `<wi type="G">`
anterior con esa posición.

**Distinción con el «que» relativo.** Si el «que» tiene antecedente («la piara
**que**», «los pájaros **que**»), es relativo y **sí** puede quedar suelto: el
español lo exige y no corresponde a ningún Strong.

**El «que» del artículo y su participio.** Cuando el griego lleva artículo +
participio (ἡ ὀργὴ **ἡ ἐρχομένη** = «la ira **que** viene»), el «que» pertenece
al **artículo del participio**, no al del sustantivo. Como artículo y participio
son contiguos, el «que» va directamente en el `<wi>` del artículo:

```xml
<!-- 1 Ts 1:10: τῆς ὀργῆς τῆς ἐρχομένης -->
<wi type="G" value="3588,18,">la</wi>      <!-- τῆς de ὀργῆς -->
<wi type="G" value="3709,19,">ira</wi>
<wi type="G" value="3588,20,">que</wi>     <!-- τῆς de ἐρχομένης -->
<wi type="G" value="2064,21,">vendrá</wi>
```

`GC` solo haría falta si ese segundo artículo **no** estuviera contiguo a su
participio, cosa que no ocurre en la construcción griega normal. **Antes de
usar `GC`, comprobar que en el griego hay otra palabra intercalada**; si no la
hay, el «que» va en el `<wi>` del artículo sin más.

`herram/diagnostico-formato.mjs` marca los dos casos por separado: «completivo
suelto» (hay que moverlo) y «relativo suelto» (a revisar).

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
