# Open Scriptures Hebrew Bible (MorphHB) — WLC con Strong y Morfología

## Contenido

Los 39 libros del Antiguo Testamento en formato OSIS XML, con el texto hebreo del **Westminster Leningrad Codex (WLC)**, más números **Strong tipo H** y **morfología** por palabra.

Cada palabra (`<w>`) incluye:
- `lemma` — número Strong (ej. `7225` → H07225)
- `morph` — morfología (ej. `HVqp3ms`)
- `id` — identificador único e inmutable
- El texto hebreo con cantilación y vocales

## Origen

- **Repositorio**: https://github.com/openscriptures/morphhb
- **Archivos**: `wlc/` — 40 archivos XML (39 libros + VerseMap.xml)
- **Licencia del mapeo (lemma + morph)**: CC BY 4.0
  > *"Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb"*
- **Texto WLC**: Dominio público (Westminster Leningrad Codex)

## Formato

```xml
<verse osisID="Gen.1.1">
  <w lemma="b/7225" morph="HR/Ncfsa" id="01xeN">בְּ/רֵאשִׁ֖ית</w>
  <w lemma="1254 a" morph="HVqp3ms" id="01Nvk">בָּרָ֣א</w>
  <w lemma="430" morph="HNcmpa" id="01TyA">אֱלֹהִ֑ים</w>
  ...
</verse>
```

Los prefijos en lemma (`.`, `b/`, `c/`, `d/`, `h/`, `k/`, `l/`, `m/`) indican preformativas (preposiciones, conjunciones, artículo, etc.). El número Strong se obtiene tomando la parte numérica y anteponiendo `H` con 4 dígitos (ej. `7225` → `H07225`).

## Archivos

| Archivo | Libro |
|---------|-------|
| Gen.xml | Génesis |
| Exod.xml | Éxodo |
| Lev.xml | Levítico |
| Num.xml | Números |
| Deut.xml | Deuteronomio |
| Josh.xml | Josué |
| Judg.xml | Jueces |
| Ruth.xml | Rut |
| 1Sam.xml | 1 Samuel |
| 2Sam.xml | 2 Samuel |
| 1Kgs.xml | 1 Reyes |
| 2Kgs.xml | 2 Reyes |
| 1Chr.xml | 1 Crónicas |
| 2Chr.xml | 2 Crónicas |
| Ezra.xml | Esdras |
| Neh.xml | Nehemías |
| Esth.xml | Ester |
| Job.xml | Job |
| Ps.xml | Salmos |
| Prov.xml | Proverbios |
| Eccl.xml | Eclesiastés |
| Song.xml | Cantares |
| Isa.xml | Isaías |
| Jer.xml | Jeremías |
| Lam.xml | Lamentaciones |
| Ezek.xml | Ezequiel |
| Dan.xml | Daniel |
| Hos.xml | Oseas |
| Joel.xml | Joel |
| Amos.xml | Amós |
| Obad.xml | Abdías |
| Jonah.xml | Jonás |
| Mic.xml | Miqueas |
| Nah.xml | Nahúm |
| Hab.xml | Habacuc |
| Zeph.xml | Sofonías |
| Hag.xml | Hageo |
| Zech.xml | Zacarías |
| Mal.xml | Malaquías |
| VerseMap.xml | Mapa de versificación |
