# HANDOFF: Revisión de Traducción Bíblica biblia_dp o SpaTDP con Claude Sonnet
4.5 en gitlab

## ANTES DE CONTINUAR

**Lee `.gitlab/training_style.jsonl` COMPLETO primero.**

Ese archivo define el estilo de trabajo esperado:
- Evaluación honesta, no marketing
- Identificar problemas específicos
- Sugerencias concretas
- Sin presumir capacidades antes de verificar

## Lecciones
El agente anterior presumió capacidades sin intentar.
Fue corregido: "Es mejor hablar después de examinar o intentar."
No repetir ese error.

* `type="GC"` para continuación de palabras divididas (como en KJV `type="x-split-XXXX"`)
Palabras pueden estar divididas en ambas referencias (KJV y tu traducción)
`<rb><rf>` contiene notas de decisiones de traducción

## Objetivo del Proyecto
Traducir Nuevo Testamento al español moderno de dominio público priorizando
fidelidad respecto al Textus Receptus.
- Fuente base: WEB (World English Bible, dominio público, inglés)
- Formato: GBFXML con números Strong del griego
- Referencias: KJV con Strong (Textus Receptus), RVG2012 (español)

## Progreso de Revisión

### Completados
- **Filemón** - 1:22: "restaurado" → "concedido" (G5483)
- **Tito** - 1:6: "creyentes" → "fieles" (G4103 πιστά más preciso)
- **2 Timoteo**
- **2 Tesalonicenses**
- **1 Tesalonicenses** -  1:1 "al Señor" → "del Señor"
- **1 Timoteo** - 1:9 (G765), 2:14 (G538), 3:15 (G2316), 6:3,5,6,11 (G2150)
- **Colosenses**
- **Filipenses**
- **Galatas**

## Estructura de Archivos

### Tu traducción
- `{libro}.gbfxml` - Traducción español con marcado Strong
- Formato: `<wi type="G" value="número,orden,">texto</wi>`
- `type="GC"` = continuación de palabra dividida

### Referencias
- `ref/sword_kjv/{Libro}-2023-01-06.osis.xml` - KJV con Strong y morfología Robinson.  Será mejor dividirlos en capítulos.
- `ref/reina_valera_geiger_nt/57_Philemon.usfm` - RVG2012 (formato USFM)
- Patrón RVG: ref/reina_valera_geiger_nt/NN_{Libro}.usfm (NN = número).
  {Libro} en inglés y si tiene número como 2 Timoteo es 2_Timothy.

### Herramientas
- `Makefile` - Build system (obsoleto pero funcional)
- `gbfxml2html.xsl`, `gbfxml2db.xsl` - Conversiones XSLT

## Metodología de Revisión

** PRIORIDAD: Fidelidad al Textus Receptus **

1. **Leer** tu `{libro}.gbfxml` completo
2. **Comparar** con WEB (inglés en mismo archivo antes de `<t xml:lang="es">`)
3. **Validar** números Strong contra KJV OSIS
4. **Verificar** español moderno vs RVG2012
5. **Reportar SOLO versículos con problemas**

### Formato de reporte
```
Versículo X: [problema específico]
- Tu traducción: "..."
- Griego Strong: G#### (palabra)
- Sugerencia: "..." [razón]
```

## Verificación Cruzada

Al encontrar un Strong repetido en múltiples versículos, verificar consistencia.
Ejemplo: G2150 aparece en 1 Tim 2:2, 3:16, 4:7,8, 6:3,5,6,11 - debe ser siempre
"piedad"

## Convenciones del Formato GBFXML

```xml
<sb id="Libro">                          <!-- libro -->
  <sc id="Libro-1">                      <!-- capítulo -->
    <sv id="Libro-1-1">                  <!-- versículo -->
      Texto inglés WEB
      <t xml:lang="es">                  <!-- traducción español -->
        <wi type="G" value="3972,1,">Pablo</wi>  <!-- palabra con Strong -->
      </t>
    </sv>
    <rb>texto<rf>nota al pie</rf></rb>   <!-- nota -->
  </sc>
</sb>
```

## Contexto Técnico

- Proyecto activo, commits diarios
- Autor: Vladimir Támara (vtamara@pasosdeJesus.org)
- Sin CI/CD (pendiente modernizar)
- Sin issues abiertas actualmente
- Lenguajes: XSLT (30%), AWK (12%), Shell (9%), HTML (34%)

## Limitaciones Técnicas del Agente

- Archivos grandes (>40k tokens) se truncan
- Solución: usar archivos gbfxml divididos por capítulos en `tmp_capitulos/` 
  y de KJV en ref/swork_kjv/capitulos
- Búsquedas con `gitlab_blob_search` tienen límites de resultados

## Próximo Paso Sugerido

Revisar **Tito** (3 capítulos, libro corto) o **2-3 Juan** (1 capítulo cada uno).

Ambos tienen KJV+Strong disponible para validación completa.

## Notas

- Usuario prefiere respuestas concisas
- Solo reportar problemas, no confirmar lo correcto
- Verificar antes de afirmar cualquier capacidad
