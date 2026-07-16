# Estilo de Formato GBFXML

**«Hágase todo decentemente y con orden» (1 Corintios 14:40)**

---

## Meta-reglas

- **Cada palabra del NT en su propia línea** (un `<wi>` con texto por línea).
- **Líneas de máximo ~80 caracteres**, excepto URLs largos.
- **Script de estilo**: `node herram/estilo-gbfxml.mjs [libro]` (sin argumentos = todo el NT).
- **No confundir con `art3588.mjs`**: primero se convierte G3588, luego se aplica estilo.

---

## 1. Separación entre versículos

Cada `<sv id="...">` va precedido y seguido de una línea en blanco:

```xml
</sv>

<sv id="Marcos-1-2">
...
</sv>

<sv id="Marcos-1-3">
```

---

## 2. Etiquetas `<wi>`

### 2.1 Cada `<wi>` con texto en su propia línea

```xml
<wi type="G" value="3588,5,">la</wi>
<wi type="G" value="4864,6,">sinagoga</wi>
```

### 2.2 `<wi/>` vacíos consecutivos en misma línea, con espacio entre ellos

```xml
<wi type="G" value="2532,1,"/> <wi type="G" value="3588,2,"/><wi type="G" value="2424,3,">Jesús</wi>
```

### 2.3 `<wi/>` vacío seguido de `<wi>` con texto: misma línea, sin espacio

```xml
<wi type="G" value="3588,3,"/><wi type="G" value="2424,4,">Jesús</wi>
```

### 2.4 Signos de puntuación entre `<wi>`

La coma, punto o punto y coma se queda en la línea del `<wi>` que la precede:

```xml
<wi type="G" value="2464,4,">Isaac</wi>,
<wi type="G" value="1161,6,">e</wi>
```

---

## 3. Etiquetas `<rb>`, `<rf>` y `<t>` en notas

### 3.1 `<t xml:lang="es">` en nueva línea dentro de `<rb>`

```xml
<rb>Christ
<t xml:lang="es"><wi type="G" value="5547,4,">el Cristo</wi></t><rf>
```

### 3.2 Contenido de `<rf>` en nueva línea, wrapping ~80 chars

```xml
</t><rf>
Christ (Greek) and Messiah (Hebrew) both mean «Anointed One»
<t xml:lang="es">Cristo (griego) y Mesías (hebreo) ambos significan «El ungido.»</t>
</rf>
```

### 3.3 `<t xml:lang="es">` en nueva línea dentro de `<rf>`

Las traducciones al español dentro de notas al pie empiezan en línea nueva.

### 3.4 Cierre `</rf>` en línea propia

```xml
<citebib id="WEB"/> dice `Judas.´
</rf></rb>
```

### 3.5 Tags no se parten

Tags como `<citebib id="RVG2012"/>` o `<t xml:lang="es">` se mantienen íntegros en una línea.

### 3.6 URLs no se parten ni se modifican

Las URLs (`http://` o `https://`) se preservan completas en una línea. URLs ya partidas se detectan con `⚠` para revisión manual.

---

## 4. Indentación

Ningún elemento GBFXML lleva indentación (tabs o espacios al inicio):

```xml
<sv id="Marcos-1-1">
The book of the generation...
<t xml:lang="es"><wi ...
```

---

## 5. Atributo `sacred="yes"`

Después del valor y antes del cierre `>`:

```xml
<wi type="G" value="2424,10," sacred="yes">Jesús</wi>
```

---

## 6. Reglas que aplica el script automáticamente

| # | Regla |
|---|-------|
| -1 | Unir tags partidos en líneas (`<citebib\nid=".."/>` → `<citebib id=".."/>`) |
| 0 | Eliminar indentación de todas las etiquetas GBFXML |
| 1 | Línea en blanco antes y después de `<sv id="...">` |
| 2a | `/>` vacíos consecutivos: misma línea, con espacio entre ellos |
| 2b | `/>` vacío + `<wi>` con texto: misma línea, sin espacio |
| 2c | Un `<wi>` con texto seguido de otro `<wi>`: línea aparte |
| 3 | Contenido de `<rf>`: wrapping a ~80 chars, sin partir tags ni URLs |
| 4 | `<t xml:lang="es">` dentro de `<rf>`: en nueva línea |
| 5 | Cierre `</rf>`: en línea propia, separado del contenido |
| 6 | `<t xml:lang="es">` dentro de `<rb>`: empieza en nueva línea |
