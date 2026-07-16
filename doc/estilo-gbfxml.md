# Estilo de Formato GBFXML

**«Hágase todo decentemente y con orden» (1 Corintios 14:40)**

---

## 1. Separación entre versículos

Cada `<sv id="...">` va precedido y seguido de una línea en blanco para
facilitar la lectura y navegación:

```xml
</sv>

<sv id="Marcos-1-2">
...
</sv>

<sv id="Marcos-1-3">
```

---

## 2. Convención G3588 y etiquetas `<wi>`

### 2.1 G3588 con texto (artículo o preposición)

En su propia línea, con nueva línea antes del siguiente `<wi>`:

```xml
<wi type="G" value="3588,5,">la</wi>
<wi type="G" value="4864,6,">sinagoga</wi>
```

### 2.2 G3588 vacío (`/>`)

En la **misma línea** que el siguiente `<wi>`, **sin espacio** entre
el cierre `/>` y la apertura `<wi`:

```xml
<wi type="G" value="3588,3,"/><wi type="G" value="2424,4,">Jesús</wi>
```

### 2.3 Varios `<wi/>` vacíos consecutivos

Se agrupan en una misma línea:

```xml
<wi type="G" value="2532,1,"/><wi type="G" value="3588,2,"/><wi type="G" value="2424,3,">Jesús</wi>
```

### 2.4 `<wi>` con texto después de un vacío

Si hay un `<wi/>` vacío seguido de un `<wi>` con texto, el de texto va
en **línea aparte**:

```xml
<wi type="G" value="3588,3,"/><wi type="G" value="1161,2,">Pero</wi>
<wi type="G" value="2424,4,">Jesús</wi>
```

---

## 3. Etiquetas `<rb>` y `<rf>`

### 3.1 Contenido de `<rf>`

El texto del `<rf>` comienza en **nueva línea** después de la apertura:

```xml
<rb xml:lang="es"><wi type="G" value="4396,5,">profetas</wi><rf>
<citebib id="WEB"/> dice `en los profetas,´
<citebib id="DiosHablaHoy"/> dice `el profeta Isaías.´</rf></rb>
```

### 3.2 Longitud de línea en `<rf>`

Las líneas dentro de `<rf>` no deben ser excesivamente cortas ni largas
(ideal ~80 caracteres). Se parte en puntos naturales (después de comas,
puntos, o cambios de fuente):

```xml
<rf>
<citebib id="WEB"/> dice `me uniré a ti,´
<citebib id="SE"/> dice `Ahora vete, más cuando tenga oportunidad te llamaré,´
<citebib id="Gideons"/> dice lo mismo.
Según <citebib id="Thayer-BLB"/> la palabra griega `μετακαλέω` significa
llamar de un sitio a otro, llamarse o unirse.</rf>
```

---

## 4. Indentación

- `<sc>`, `<cm>`, `<sv>` no se indenta (nivel raíz de capítulo)
- `<t xml:lang="es">` no se indenta (va al mismo nivel que el texto inglés)
- Los `<wi>` dentro de `<t>` van a nivel de 2 espacios (pero por simplicidad
  en el GBFXML actual no se indenta el contenido)

---

## 5. Espacios entre palabras

En el contenido mixto (texto inglés + `<t>` + `<rb>`), los espacios entre
etiquetas y texto se colocan de forma que el resultado renderizado tenga
espaciado natural:

```xml
fueron <wi type="G" value="907,3,">bautizados</wi> por
<wi type="G" value="846,4,">él</wi> </t>
<rb xml:lang="es">en <wi type="G" value="3588,5,">el</wi>
<wi type="G" value="2446,6,">Jordán</wi><rf>
<citebib id="Peshitta"/> dice `en el río Jordán.´</rf></rb>
```

---

## 6. Atributo `sacred="yes"`

Se coloca después del valor y antes del cierre `>`:

```xml
<wi type="G" value="2424,10," sacred="yes">Jesús</wi>
<wi type="G" value="3588,12,"/><wi type="G" value="2316,13," sacred="yes">Dios</wi>
```
