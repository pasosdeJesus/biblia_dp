# HANDOFF: Revisión de Traducción Bíblica biblia_dp o SpaTDP con Claude Sonnet
4.5 en gitlab


## DIRECTIVAS PRIORITARIAS 🙏

### Principios Fundamentales:
* **Responder con verdad, honestidad y humildad**. Mantener esta directiva como prioritaria.

> *"Y conocerán la verdad, y la verdad los hará libres."* - Juan 8:32 (SpaTDP)
> 

### Communication Guidelines

"CRITICAL: Never claim to have completed a review or analysis without 
 explicitly showing evidence of having read ALL required files"
 "When reviewing multiple files, explicitly list each file read and confirm
 completion before making summary statements"
 "If you haven't read all necessary files, clearly state which ones remain and
 ask if you should continue"


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
- **Efesios**
- **2 Corintios**
- **1 Corintios** - 12:29 profetas/instructores (G4396/G1320), 14:26 lenguas
- **Romanos** - 1:9 G4335 para "oraciones". :29 - Cambiado "muerte" →
  "homicidios" (G5408). 2:8 "buscan peleas" → "contenciosos".
  3:27 "vanidad" → "vanagloria". 4:15 "indignación" → "ira". 
  4:20 "no la discernió" → "no dudó"

## Estructura de Archivos

### Tu traducción
- `{libro}.gbfxml` - Traducción español con marcado Strong
- Formato: `<wi type="G" value="número,orden,">texto</wi>`
- `type="GC"` = continuación de palabra dividida

### Referencias
- `tmp_capitulos/romanos-{cc}.gbfxml` es capítulo `cc` de Romanos con 
   traducciones WEB y SpaTDP y con marcado Strong en SpaTDP
- `ref/sword_kjv/capitulos/Romans-{cc}.osis.xml)` - es capítulo `cc` de 
   Filemón de KJV con Strong y morfología Robinson.  
- `ref/reina_valera_geiger_nt/45_Romans.usfm` - RVG2012 (formato USFM)
- Patrón RVG: ref/reina_valera_geiger_nt/NN_{Libro_inglés}.usfm (NN = número).
  {Libro_ingles} y si tiene número como 2 Timoteo es `55_2_Timothy.usfm`.

### Herramientas
- `Makefile` - Build system (obsoleto pero funcional)
- `gbfxml2html.xsl`, `gbfxml2db.xsl` - Conversiones XSLT

## Protocolo de revisión obligatorio

** PRIORIDAD: Fidelidad al Textus Receptus **

### 1. Antes de reportar "completado":

1. **Leer TODOS los capítulos del libro solicitado**
   - No asumir que algunos capítulos están bien
   - Si el usuario dice "continúa con capítulos X-Y", leer TODOS esos capítulos

2. **Comparar palabra por palabra, versículo por versículo**:
   - La traducción SpaTDP (tmp_capitulos/*.gbfxml)
   - KJV+Strong (ref/sword_kjv/capitulos/*.osis.xml)
   - RVG2012 (ref/reina_valera_geiger_nt/*.usfm)

3. **Verificar CUATRO fuentes, no dos**:
   - ❌ Error común: solo comparar SpaTDP vs KJV
   - ✅ Correcto: comparar las CUATRO (SpaTDP, WEB en inglés que está en
     el mismo gbfxml, KJV, RVG2012)
   - Validar números Strong de SpaTDP contra KJV OSIS

4. **Formato de reporte de problemas**
    ```
    Versículo X: [problema específico]
    - Tu traducción: "..."
    - Griego Strong: G#### (palabra)
    - Sugerencia: "..." [razón]
    ```

### 2. Criterios de Reporte

**REPORTAR como problema:**
- Números Strong faltantes o en orden incorrecto
- Traducción que contradice el significado griego
- Inconsistencia en traducción del mismo Strong en diferentes versículos
- Errores claros de traducción

**NO reportar como problema:**
- Variaciones válidas de traducción del mismo término griego
- Diferencias estilísticas que no afectan el significado
- Notas al pie que ya explican las variantes

### 3. No omitir versículos

- Si un capítulo tiene 25 versículos, presentar los 25
- Si se solicitan capítulos 10-13, revisar TODOS los versículos de esos 4
  capítulos
- NO usar frases como "continuando con..." sin mostrar TODOS los versículos
  intermedios

### 4. Formato de Reporte Detallado OBLIGATORIO

#### 4.1. Estructura del Reporte por Versículo

Para CADA versículo debes presentar:

1. **Número del versículo** (ej: ROMANOS 12:1)

2. **WEB:** Texto completo del versículo en inglés

3. **SpaTDP:** Texto completo del versículo

4. **KJV:** Texto completo del versículo

5. **RVG2012:** Texto completo del versículo en español

6. **Strong:** Lista de números Strong que debe coincidir en SpaTDP y en
   KJV.

7. **Verificación**: Reporte de problema o 
   `✓ Traducción correcta, números Strong coinciden`

#### 4.2. Ejemplo de Formato Correcto:

```
**ROMANOS 5:20**

**WEB:** The law came in besides, that the trespass might abound; but where sin
abounded, grace did abound more exceedingly;


**SpaTDP:** Además llegó la ley, para que la transgresión abundara; pero donde
abundó el pecado, mucho más abundó la gracia;


**KJV:** Moreover the law entered, that the offence might abound. But where sin
abounded, grace did much more abound:

**RVG2012:** La ley empero entró para que el pecado creciera; pero cuando el
pecado creció, sobrepujó la gracia;

**Strong:** G1161 G3551 G3922 G2443 G3588 G3900 G4121 G1161 G3757 G3588 G266
G4121 G3588 G5485 G5248

**Verificacion:** ✓ Traducción correcta, números Strong coinciden
```

#### 4.3 NO Hacer:

❌ "Revisando versículos 1-10... ✓ Correcto"
❌ "Todos los versículos están correctos"
❌ Omitir versículos intermedios
❌ Resumir múltiples versículos juntos

#### 4.4 SÍ Hacer:

✅ Presentar CADA versículo individualmente
✅ Mostrar TODOS los números Strong de SpaTDP
✅ Mostrar TODOS los números Strong de KJV
✅ Incluir el texto completo de WEB
✅ Incluir el texto completo de RVG2012
✅ Verificar palabra por palabra
✅ Si hay 25 versículos, presentar los 25


### 5. Resumen final

Al terminar cada revisión, presentar:
- Total de problemas encontrados
- Lista numerada de cada problema con ubicación exacta
- Total acumulado si es revisión en múltiples partes


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


## Notas

- Usuario prefiere respuestas concisas
- Verificar antes de afirmar cualquier capacidad
