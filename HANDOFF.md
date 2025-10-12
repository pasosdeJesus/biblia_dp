# HANDOFF: Revisión de Traducción Bíblica biblia_dp

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
Traducir Nuevo Testamento al español moderno de dominio público.
- Fuente base: WEB (World English Bible, dominio público, inglés)
- Formato: GBFXML con números Strong del griego
- Referencias: KJV con Strong (Textus Receptus), RVG2012 (español)

## Progreso de Revisión

### Completados
- Filemón 1:22: "restaurado" → "concedido" (G5483)
- Tito 1:6: "creyentes" → "fieles" (G4103 πιστά más preciso)

### Pendientes (con KJV+Strong disponible)
**Epístolas Paulinas:**
- Gálatas, Efesios, Filipenses, Colosenses
- 1-2 Tesalonicenses, 1-2 Timoteo, Tito
- Hebreos

**Epístolas Generales:**
- Santiago, 1-2 Pedro, 2-3 Juan

**Apocalipsis**

### Sin KJV individual disponible
Evangelios (Mateo, Marcos, Lucas, Juan), Hechos, Romanos, 1-2 Corintios, 1 Juan, Judas

## Estructura de Archivos

### Tu traducción
- `{libro}.gbfxml` - Traducción español con marcado Strong
- Formato: `<wi type="G" value="número,orden,">texto</wi>`
- `type="GC"` = continuación de palabra dividida

### Referencias
- `ref/sword_kjv/{Libro}-2023-01-06.osis.xml` - KJV con Strong y morfología Robinson
- `ref/reina_valera_geiger_nt/57_Philemon.usfm` - RVG2012 (formato USFM)

### Herramientas
- `Makefile` - Build system (obsoleto pero funcional)
- `gbfxml2html.xsl`, `gbfxml2db.xsl` - Conversiones XSLT

## Metodología de Revisión

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

## Próximo Paso Sugerido

Revisar **Tito** (3 capítulos, libro corto) o **2-3 Juan** (1 capítulo cada uno).

Ambos tienen KJV+Strong disponible para validación completa.

## Notas

- Usuario prefiere respuestas concisas
- Solo reportar problemas, no confirmar lo correcto
- Verificar antes de afirmar cualquier capacidad
