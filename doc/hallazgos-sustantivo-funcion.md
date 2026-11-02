# Hallazgos: sustantivos etiquetados con palabra funcional (NT)

Propuestas de corrección para los 63 casos restantes que la herramienta
`herram/arregla-sustantivo-funcion.mjs` no pudo resolver automáticamente.

Regla general aplicada en cada propuesta:
- El **texto en español del sustantivo** debe ir dentro de su `<wi type="G" value="Strong,pos,">`.
- La **palabra funcional** (artículo/preposición) no debe quedar dentro del
  `<wi>` del sustantivo: se mueve al artículo vacío `G3588` adyacente si existe,
  o se deja como texto sin etiquetar.
- El `<wi type="GC" value="pos">` duplicado se elimina.

Leyenda:
- `→` indica el cambio propuesto (solo la porción afectada del versículo).
- Los casos marcados **(requiere decisión de traducción)** implican añadir una
  palabra que hoy falta en el español (el sustantivo griego quedó sin traducir).

---

## Mateo

### Mateo 4:15 — G3598 «hacia» (ὁδός, "camino") — **(requiere decisión de traducción)**
El griego `ὁδὸν θαλάσσης` es "camino del mar" (KJV "toward the sea"). El
sustantivo "camino" no está traducido; G3598 lleva la preposición "hacia".
- **Opción literal (recomendada, fiel a TR):**
  ```xml
  <wi type="G" value="3598,6,">camino</wi><wi type="G" value="2281,7,">del mar</wi>,
  ```
- **Opción funcional (mantener "hacia el mar"):** dejar "hacia" sin etiquetar y
  G3598 vacío.

### Mateo 5:35 — G935 «del» (βασιλεύς, "Rey")
```xml
<wi type="G" value="3588,17,">del</wi><wi type="G" value="3173,18,">gran</wi><wi type="G" value="935,19,">Rey</wi>.
```
(se elimina el `<wi type="GC" value="19">Rey</wi>`)

### Mateo 6:25 — G5590 «por» (ψυχή, "vida")
"vida" está en un `<wi type="GC" value="8">` dentro de un `<rb>`; debe ir al texto principal.
```xml
<wi type="G" value="3588,7,">por</wi><wi type="G" value="5216,9,">su</wi><wi type="G" value="5590,8,">vida</wi>
```
(quitar el GC del `<rb>`; conservar la nota del diccionario)

### Mateo 7:22 — G3686 «en» (ὄνομα, "nombre") — 3 ocurrencias
El artículo `G3588` está antes del verbo y debe reordenarse después de "profetizamos"/"sacamos"/"hicimos".
1. `profetizamos`:
   ```xml
   <wi type="G" value="4395,14,">profetizamos</wi><wi type="G" value="3588,11,">en</wi><wi type="G" value="4674,12,">tu</wi><wi type="G" value="3686,13,">nombre</wi>,
   ```
2. `sacamos`:
   ```xml
   <wi type="G" value="1544,20,">sacamos</wi><wi type="G" value="3588,16,">en</wi><wi type="G" value="4674,17,">tu</wi><wi type="G" value="3686,18,">nombre</wi>
   ```
3. `hicimos`:
   ```xml
   <wi type="G" value="4160,27,">hicimos</wi><wi type="G" value="3588,22,">en</wi><wi type="G" value="4674,23,">tu</wi><wi type="G" value="3686,24,">nombre</wi>?´
   ```

### Mateo 8:16 — G3056 «con» (λόγος, "palabra")
```xml
<wi type="G" value="3056,12,">palabra</wi>
```
con "con una" como texto sin etiquetar: `con una <wi ...>palabra</wi>` (se elimina GC).

### Mateo 10:25 — G3615 «de» (οἰκιακός, "familia")
```xml
<wi type="G" value="3588,24,">los</wi> de <wi type="G" value="846,26,">su</wi><wi type="G" value="3615,25,">familia</wi>!
```

### Mateo 10:36 — G3615 «de» (οἰκιακός, "familia")
```xml
<wi type="G" value="3588,5,">los</wi> de <wi type="G" value="846,7,">su propia</wi><wi type="G" value="3615,6,">familia</wi>.
```

### Mateo 11:20 — G1411 «de» (δύναμις, "obras poderosas")
```xml
<wi type="G" value="3588,9,">la</wi><wi type="G" value="4118,10,">mayoría</wi> de <wi type="G" value="846,12,">sus</wi><wi type="G" value="1411,11,">obras poderosas</wi>,
```

### Mateo 12:39 — G4592 «la» (σημεῖον, "señal") — **(requiere decisión de traducción)**
Falta "señal" (hoy dice "la de Jonás" en vez de "la señal de Jonás").
```xml
<wi type="G" value="3588,19,">la</wi><wi type="G" value="4592,20,">señal</wi><wi type="G" value="3588,22,">de</wi><wi type="G" value="2495,21,">Jonás</wi>
```

### Mateo 13:1 — G2250 «El» (ἡμέρα, "día")
Reordenar: "El" va al artículo G3588; "día" va a G2250.
```xml
<wi type="G" value="1161,2,"/><wi type="G" value="1722,1,"/><wi type="G" value="3588,3,">El</wi><wi type="G" value="1565,5,">mismo</wi><wi type="G" value="2250,4,">día</wi>
```

### Mateo 14:2 — G3816 «a» (παῖς, "siervo")
El `GC` tiene `value="3"`; debe ser la posición del sustantivo (4).
```xml
<wi type="G" value="3588,3,">a</wi><wi type="G" value="846,5,">sus</wi><wi type="G" value="3816,4,">siervos</wi>,
```

### Mateo 15:11 — G4750 «la» (στόμα, "boca")
```xml
<wi type="G" value="3588,14,">la</wi><wi type="G" value="4750,15,">boca</wi>,
```

### Mateo 17:15 — G5207 «de» (υἱός, "hijo")
```xml
<wi type="G" value="3588,4,">de</wi><wi type="G" value="3450,3,">mi</wi><wi type="G" value="5207,5,">hijo</wi>,
```

### Mateo 19:28 — G1391 «de» (δόξα, "gloria")
```xml
<wi type="G" value="2362,24,">el trono</wi> de <wi type="G" value="846,26,">su</wi><wi type="G" value="1391,25,">gloria</wi>,
```

### Mateo 19:29 — G2222 «la» (ζωή, "vida")
G166 (αἰώνιος) solo debe llevar "eterna", no "vida eterna".
```xml
la <wi type="G" value="2222,27,">vida</wi><wi type="G" value="166,28,">eterna</wi>.
```

### Mateo 20:7 — G290 «la» (ἀμπελών, "viña")
```xml
<wi type="G" value="1519,12,">a</wi><wi type="G" value="3588,13,">la</wi><wi type="G" value="290,14,">viña</wi>,
```

### Mateo 20:23 — G4221 «de» (ποτήριον, "copa")
```xml
de <wi type="G" value="3450,7,">mi</wi><wi type="G" value="4221,6,">copa</wi>
```

### Mateo 20:29 — G3793 «una» (ὄχλος, "multitud")
```xml
una <wi type="G" value="4183,9,">gran</wi><wi type="G" value="3793,8,">multitud</wi>
```

### Mateo 21:8 — G3793 «una» (ὄχλος, "multitud")
```xml
<wi type="G" value="1161,2,">Y</wi> una <wi type="G" value="4118,3,">gran</wi><wi type="G" value="3793,4,">multitud</wi>
```

### Mateo 21:38 — G2817 «de» (κληρονομία, "herencia")
El `GC` tiene `value="21"`; debe ser la posición del sustantivo (20).
```xml
<wi type="G" value="3588,19,">de</wi><wi type="G" value="846,21,">su</wi><wi type="G" value="2817,20,">herencia</wi>.´
```

### Mateo 21:41 — G1092 «a» (γεωργός, "granjeros")
```xml
a <wi type="G" value="243,11,">otros</wi><wi type="G" value="1092,12,">granjeros</wi>
```

### Mateo 22:23 — G2250 «El» (ἡμέρα, "día")
```xml
<wi type="G" value="1722,1,"/><wi type="G" value="3588,3,">El</wi><wi type="G" value="1565,2,">mismo</wi><wi type="G" value="2250,4,">día</wi>
```

### Mateo 23:27 — G167 «de» (ἀκαθαρσία, "suciedad")
```xml
de <wi type="G" value="3956,22,">toda</wi><wi type="G" value="167,23,">suciedad</wi>.
```

### Mateo 24:31 — G5456 «un» (φωνή, "sonido")
```xml
un <wi type="G" value="3173,9,">gran</wi><wi type="G" value="5456,8,">sonido</wi>
```

### Mateo 24:43 — G5438 «a» (φυλακή, "vigilia") — **(requiere decisión de traducción)**
`ἐν ποίᾳ φυλακῇ` = "en qué vigilia". El `GC` lleva `value="11"` (posición del
artículo), no la del sustantivo (10). Propuesta:
```xml
<wi type="G" value="4169,9,">qué</wi><wi type="G" value="5438,10,">vigilia</wi> de la noche
```
("a" queda sin etiquetar; si se prefiere "hora" en vez de "vigilia", decidir).

### Mateo 25:11 — G3933 «las» (παρθένος, "vírgenes")
```xml
<wi type="G" value="3588,5,">las</wi><wi type="G" value="3062,6,">otras</wi><wi type="G" value="3933,7,">vírgenes</wi>
```

### Mateo 25:31 — G1391 «de» (δόξα, "gloria")
```xml
de <wi type="G" value="846,24,">su</wi><wi type="G" value="1391,23,">gloria</wi>.
```

### Mateo 25:40 — G80 «con» (ἀδελφός, "hermanos")
"hermanos" está en un `GC` dentro de un `<rb>` (nota "hermanos y hermanas"); debe ir al texto principal.
```xml
<wi type="G" value="80,16,">hermanos</wi>
```
con "con" como texto sin etiquetar delante: `con <wi ...>hermanos</wi>` (se elimina el GC del rb; se conserva la nota).

### Mateo 26:10 — G2041 «una» (ἔργον, "obra")
```xml
una <wi type="G" value="2570,14,">buena</wi><wi type="G" value="2041,12,">obra</wi>
```

### Mateo 26:19 — G3957 «la» (πάσχα, "Pascua")
```xml
<wi type="G" value="3588,12,">la</wi><wi type="G" value="3957,13,">Pascua</wi>.
```

### Mateo 26:47 — G3793 «una» (ὄχλος, "multitud")
```xml
una <wi type="G" value="4183,15,">gran</wi><wi type="G" value="3793,14,">multitud</wi>
```

---

## Marcos

### Marcos 4:1 — G3793 «una» (ὄχλος, "multitud")
```xml
una <wi type="G" value="4183,13,">gran</wi><wi type="G" value="3793,12,">multitud</wi>
```

### Marcos 4:37 — G2978 «Una» (λαῖλαψ, "tormenta")
```xml
Una <wi type="G" value="3173,5,">gran</wi><wi type="G" value="2978,3,">tormenta</wi>
```

### Marcos 9:14 — G3793 «una» (ὄχλος, "multitud")
```xml
una <wi type="G" value="4183,8,">gran</wi><wi type="G" value="3793,7,">multitud</wi>
```

### Marcos 10:46 — G3793 «una» (ὄχλος, "multitud")
```xml
una <wi type="G" value="2425,16,">gran</wi><wi type="G" value="3793,15,">multitud</wi>
```

### Marcos 13:27 — G3772 «del» (οὐρανός, "cielo")
```xml
del <wi type="G" value="3772,21,">cielo</wi>.
```

---

## Lucas

### Lucas 1:70 — G4396 «de» (προφήτης, "profetas")
```xml
<wi type="G" value="3588,5,">de</wi><wi type="G" value="846,11,">sus</wi><wi type="G" value="40,6,">santos</wi><wi type="G" value="4396,10,">profetas</wi>
```

### Lucas 1:80 — G323 «de» (ἀνάδειξις, "aparición")
```xml
de <wi type="G" value="846,16,">su</wi><wi type="G" value="323,15,">aparición</wi>
```

### Lucas 2:10 — G5479 «de» (χαρά, "regocijo")
```xml
de <wi type="G" value="3173,13,">gran</wi><wi type="G" value="5479,12,">regocijo</wi>
```

### Lucas 20:4 — G444 «los» (ἄνθρωπος, "hombres")
```xml
<wi type="G" value="1537,8,">de</wi> los <wi type="G" value="444,9,">hombres</wi>?
```

---

## Juan

### Juan 1:17 — G5547 «el» (Χριστός, "Cristo")
```xml
el <wi type="G" value="5547,14,">Cristo</wi>.
```

### Juan 15:27 — G746 «el» (ἀρχή, "comienzo")
```xml
el <wi type="G" value="746,7,">comienzo</wi>.
```

### Juan 16:8 — G2920 «el» (κρίσις, "juicio")
```xml
el <wi type="G" value="2920,14,">juicio</wi>;
```

---

## Hechos

### Hechos 2:21 — G2962 «del» (κύριος, "Señor")
```xml
del <wi type="G" value="2962,9,">Señor</wi>
```

### Hechos 2:40 — G3056 «con» (λόγος, "palabras")
```xml
con <wi type="G" value="4119,4,">muchas</wi><wi type="G" value="2087,1,">otras</wi><wi type="G" value="3056,3,">palabras</wi>
```

### Hechos 5:30 — G3962 «de» (πατήρ, "padres")
El `GC` tiene `value="3"`; debe ser la posición del sustantivo (4).
```xml
<wi type="G" value="3588,3,">de</wi><wi type="G" value="2257,5,">nuestros</wi><wi type="G" value="3962,4,">padres</wi>,
```

### Hechos 5:42 — G5547 «el» (Χριστός, "Cristo")
```xml
<wi type="G" value="3588,16,">el</wi><wi type="G" value="5547,17,">Cristo</wi>.
```

### Hechos 7:57 — G5456 «con» (φωνή, "voz")
```xml
con <wi type="G" value="3173,4,">fuerte</wi><wi type="G" value="5456,3,">voz</wi>,
```

### Hechos 7:60 — G5456 «con» (φωνή, "voz")
```xml
con <wi type="G" value="3173,7,">fuerte</wi><wi type="G" value="5456,6,">voz</wi>,
```

### Hechos 20:7 — G3317 «la» (μεσονύκτιον, "medianoche")
```xml
la <wi type="G" value="3317,26,">medianoche</wi>.
```

### Hechos 26:13 — G2250 «a» (ἡμέρα, "día")
```xml
a <wi type="G" value="3319,2,">medio</wi><wi type="G" value="2250,1,">día</wi>,
```

---

## Romanos

### Romanos 12:3 — G4102 «de» (πίστις, "fe")
```xml
de <wi type="G" value="4102,31,">fe</wi>.
```

### Romanos 13:3 — G2041 «a» (ἔργον, "obra") — **(requiere decisión de traducción)**
Falta "obra" (hoy "terror a lo bueno"; WEB: "la buena obra"). Propuesta:
```xml
<wi type="G" value="3588,7,">la</wi><wi type="G" value="18,8,">buena</wi><wi type="G" value="2041,9,">obra</wi>
```

---

## 1 Corintios

### 1 Corintios 7:19 — G2316 «de» (θεός, "Dios")
```xml
de <wi type="G" value="2316,13,">Dios</wi>.
```

---

## Filipenses

### Filipenses 1:19 — G2024 «por» (ἐπιχορηγία, "suministro") — **(requiere decisión de traducción)**
Falta "suministro" (hoy "por el Espíritu"; griego "el suministro del Espíritu"). Propuesta:
```xml
por <wi type="G" value="3588,15,">el</wi><wi type="G" value="2024,14,">suministro</wi> de <wi type="G" value="4151,16,">Espíritu</wi>
```

---

## 1 Tesalonicenses

### 1 Tesalonicenses 2:6 — G5547 «de» (Χριστός, "Cristo")
```xml
de <wi type="G" value="5547,17,">Cristo</wi>.
```

---

## 1 Timoteo

### 1 Timoteo 3:8 — G1249 «Los» (διάκονος, "diáconos")
```xml
Los <wi type="G" value="1249,1,">diáconos</wi>
```

### 1 Timoteo 5:24 — G444 «de» (ἄνθρωπος, "hombres") — **(requiere decisión de traducción)**
Falta "hombres" (hoy "de algunos"; griego "de algunos hombres"). Propuesta:
```xml
de <wi type="G" value="5100,1,">algunos</wi><wi type="G" value="444,2,">hombres</wi>
```

---

## Hebreos

### Hebreos 6:11 — G5056 «el» (τέλος, "final")
```xml
el <wi type="G" value="5056,15,">final</wi>,
```

### Hebreos 10:18 — G266 «el» (ἁμαρτία, "pecado")
```xml
el <wi type="G" value="266,8,">pecado</wi>.
```

---

## Santiago

### Santiago 1:15 — G2288 «la» (θάνατος, "muerte")
```xml
la <wi type="G" value="2288,12,">muerte</wi>.
```

---

## Resumen

| Tipo | Cantidad | Tratamiento |
|---|---|---|
| Palabra funcional → artículo `G3588` adyacente | ~13 | mover y eliminar GC |
| Palabra funcional → texto sin etiquetar (sin artículo griego) | ~44 | mover sustantivo al `<wi>`; función sin etiquetar |
| `GC` con `value` incorrecto | 4 (Mt 14:2, 21:38; Hch 5:30; también 24:43) | corregir `value` |
| **Sustantivo ausente (requiere decisión de traducción)** | **6** | añadir palabra: Mt 4:15, 12:39, 24:43; Ro 13:3; Fil 1:19; 1 Ti 5:24 |

Los 6 casos marcados "requiere decisión de traducción" no son meramente de marcado:
el traductor debe confirmar si añade la palabra que falta (fidelidad al TR) o
conserva la traducción funcional actual cambiando el marcado.
