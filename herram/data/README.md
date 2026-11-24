# `herram/data` — datos compartidos por las herramientas

## `excepciones.json`

Diferencias de concordancia Strong contra KJV2003 que **no** son errores: en
esos versículos SpaTDP sigue el Textus Receptus donde la base KJV2003 trae otra
lectura, otra posición o una descomposición distinta.

Lo consumen:

- `herram/validador.mjs` (vía `herram/lib/validators/concordance.js`): el
  versículo pasa de «Discrepancias reales» a «Excepciones documentadas».
- `herram/make-report.mjs`: la diferencia se marca `ℹ️` en vez de reportarse
  como problema.

### Estructura

```json
{
  "<libro>": {
    "<capítulo>": {
      "<versículo>": {
        "missingInSpatdp": ["G5330-6"],
        "missingKjv2003": ["G5330-5"],
        "reason": "Diferencia de posición para G5330 (Φαρισαῖος)…"
      }
    }
  }
}
```

Los nombres de libro son los de `herram/lib/config.js` (`mateo`, `corintios1`,
`timoteo2`, …) y las claves de capítulo y versículo son números **sin ceros a
la izquierda**.

| Clave | Contenido | Obligatoria |
| :--- | :--- | :--- |
| `missingInSpatdp` | `Strong-posición` presentes en KJV2003 y ausentes en SpaTDP | No |
| `missingKjv2003` | `Strong-posición` presentes en SpaTDP y ausentes en KJV2003 | No |
| `reason` | Por qué la diferencia es correcta | **Sí** |

`missingInKjv2003` se acepta como sinónimo de `missingKjv2003` (entradas
antiguas).

### Reglas

1. La coincidencia es **exacta**: si cambia cualquier elemento del conjunto de
   diferencias, la excepción deja de aplicar. No amplíes una entrada para que
   «quepa» un error nuevo: investiga el versículo.
2. `reason` debe decir **qué** difiere y **por qué** SpaTDP tiene razón
   (variante textual del TR, posición de BLB, omisión de la base KJV2003…).
3. Antes de añadir una excepción, verifica contra BLB y otra edición del TR:
   si el error está en `libros/<libro>.gbfxml`, corrígelo allí.

Flujo completo y estado actual: [`REQ/10.md`](../../REQ/10.md) §6.
