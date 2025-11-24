# HANDOFF: Revisión de Traducción Bíblica biblia_dp o SpaTDP


## DIRECTIVAS PRIORITARIAS 🙏

### Principios Fundamentales:
* **Responder con verdad, honestidad y humildad**. Mantener esta directiva como prioritaria.

> *"Y conocerán la verdad, y la verdad los hará libres."* - Juan 8:32 (SpaTDP)
> 

### Directrices de comunicación

"IMPORTANTE: Nunca afirme haber completado una revisión o análisis 
sin demostrar explícitamente haber leído TODOS los archivos requeridos".
"Al revisar varios archivos, enumere explícitamente cada archivo leído 
y confirme su finalización antes de hacer declaraciones resumidas".
"Si no ha leído todos los archivos necesarios, indique claramente 
cuáles faltan y pregunte si debe continuar".


## ANTES DE CONTINUAR

El estilo de trabajo esperado:
- Evaluación honesta, no marketing
- Identificar problemas específicos
- Sugerencias concretas
- Sin presumir capacidades antes de verificar

Para profundizar en esto lee `.gitlab/training_style.jsonl`

## Lecciones

Un agente anterior presumió capacidades sin intentar.
Fue corregido: "Es mejor hablar después de examinar o intentar."
No repetir ese error.

* `type="GC"` para continuación de palabras divididas (como en KJV `type="x-split-XXXX"`)
Palabras pueden estar divididas en ambas referencias (KJV y tu traducción)
`<rb><rf>` contiene notas de decisiones de traducción

## Objetivo del Proyecto

Revisar parte de la traducción del nuevo testamento SpaTDP que es en español 
moderno estilo latinoamericano, de dominio público, al momento priorizando 
fidelidad respecto al Textus Receptus.
- Fuente base: WEB (World English Bible, dominio público, inglés)
- Formato: GBFXML con números Strong del griego
- Referencia para números strong: KJV con Strong (Textus Receptus)
- Otras referencias RVG2012 (español)
- Los verbos deberían traducirse según el tiempo en griego, aoristo indicativo como 
  hecho consumado (he X), perfecto como estado/resultante (he sido X), 
  presente como estado actual (estoy/es). Reportar el que no esté traducido así.
- Los pronombres personales referidos a Dios deben comenzar en mayúscula (“Tú/Te/Ti/Tuyo”),
  excepto lo, les y mí, me, mi.


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
- **Marcos** - 4:10 - "las parábolas" → "la parábola" (singular). 
    4:11 - "los misterios" → "el misterio" (singular). 5:13 - puntuación.
    5:22 - "calló" → "cayó". 5:41 - "manó" → "mano". 
    7:2 - "inpuramente" → "impuramente". 7:13 - "j" suelta en XML
    7:14 - "llaam" → "llamó". 7:32 - "llevarón" → "llevaron".
    7:33 - "con sigo" → "consigo" y varias otras correciones
    ortográficas, de puntuación y formato.
- **Juan** - diversas correcciones ortográficas y gramaticales (incluso tiempos
  verbales para concordar más con el Textus Receptus)
- **Mateo** - Completado
- **Hechos** - En proceso.
- **Lucas** - por hacer
- **Hebreos** - por completar traducción manual antes
- **Apocalipisis** - antes traducción manual
- **1 Pedro** - antes traducción manual
- **1 Juan** - antes traducción manual
- **Santiago** - antes traducción manual
- **2 Pedro** - antes traducción manual
- **Judas** - antes traducción manual


## Estructura de Archivos

### La traducción
- `{libro}.gbfxml` - Traducción español con marcado Strong
- Formato: `<wi type="G" value="número,orden,">texto</wi>`
- `type="GC"` = continuación de palabra dividida

### Referencias
- `gen/capitulos/romanos-{cc}.gbf.xml` es capítulo `cc` (ej. 01, 02,...) de 
  Romanos con traducciones WEB y SpaTDP y con marcado Strong en SpaTDP
- `ref/sword_kjv/capitulos/Romans-{cc}.osis.xml)` - es capítulo `cc` de 
  Filemón de KJV con Strong y morfología Robinson.  
- `ref/reina_valera_geiger_nt/capitulos/45_Romans-cc.usfm` - Capítulo `cc`
  de Romanos en RVG2012 (formato USFM)
- Patrón RVG: ref/reina_valera_geiger_nt/capitulos/NN_{Libro_inglés}-{cc}.usfm 
  (NN = número, cc es número de 2 digitos como 01, 02 ... 24).
  Si el libro tiene número como 2 Timoteo es `55_2_Timothy-01.usfm`.

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
   - La traducción SpaTDP (gen/capitulos/*.gbf.xml)
   - KJV+Strong (ref/sword_kjv/capitulos/*.osis.xml)
   - RVG2012 (ref/reina_valera_geiger_nt/capitulos/*.usfm)

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
- Los verbos debería traducirse según el tiempo en griego, aoristo indicativo como 
  hecho consumado (he X), perfecto como estado/resultante (he sido X), 
  presente como estado actual (estoy/es). Reportar el que no esté traducido así.
- Los pronombres referidos a Dios deben ser en mayúscula (“Tú/Te/Ti/Tuyo”),
  reportar el que no lo esté.

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

Para CADA versículo sin problema debes presentar:
1. **Número de versículo** (ej: ROMANOS 12:1)

2. ✓ Ortografía correcta, Traducción correcta, números Strong coinciden

Para CADA versículo con problemas debes presentar:

1. **Número del versículo** (ej: ROMANOS 12:1)

2. **WEB:** Texto completo del versículo en inglés

3. **SpaTDP:** Texto completo del versículo

4. **KJV:** Texto completo del versículo

5. **RVG2012:** Texto completo del versículo en español

6. **Strong SpaTDP:** Lista de números Strong en SpaTDP ordenados por posición

7. **Strong KJV2003:** Lista de números Strong en KJV2003 ordenados por posición

8. **Verificación**: Reporte de problemas ortográficos, gramaticales,
   de traducción o en concordancia Strong o 
   `✓ Traducción, ortografía y gramátia correctas, números Strong coinciden`

#### 4.2. Ejemplo de Formato para un versículo Correcto:

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

**Strong SpaTDP:** G1161 G3551 G3922 G2443 G3588 G3900 G4121 G1161 G3757 
G3588 G266 G4121 G3588 G5485 G5248

**Strong KJV:** G1161 G3551 G3922 G2443 G3588 G3900 G4121 G1161 G3757 
G3588 G266 G4121 G3588 G5485 G5248

**Verificacion:** ✓ Ortografía correcta, Traducción correcta, números Strong coinciden
```

#### 4.4. Verificación de Números Strong - CRÍTICO

**Regla fundamental:** El orden de las palabras en español puede diferir del
griego/inglés. 
Lo que DEBE coincidir es el **conjunto de números Strong con sus posiciones**.


**Cómo verificar correctamente:**
1. Extraer cada Strong con su número de posición de SpaTDP:
   - De cada `<wi type="G" value="GXXXX,posición,">` extraer: GXXXX,posición
   - Ejemplo: `value="G3037,16,"` → G3037 posición 16
2. Extraer cada Strong con su número de posición de KJV (atributo src)
   - De cada `lemma="strong:GXXXX" src="posición"` extraer: GXXXX,posición
   - Ejemplo: `lemma="strong:G3037" src="16"` → G3037 posición 16
   - Cuando una palabra griega se divide en múltiples palabras inglesas:
        - KJV: <w ... src="4" type="x-split-1820">the</w> ... <w ... src="4" type="x-split-1820">miracle</w>
        - Ambas referencias tienen MISMO src (posición)
        - Al verificar Strong: contar como UNA sola palabra, no dos
3. Comparar que ambas listas sean idénticas: mismo Strong, misma posición
   - Ordenar ambas listas por número de posición
   - Verificar que cada Strong aparezca con la misma posición en ambas
   - ✅ CORRECTO: Ambas tienen G3037,16 (aunque aparezcan en diferente orden en
     el texto)
   - ❌ ERROR: SpaTDP tiene G3037,16 pero KJV tiene G3037,18
4. **NO importa:**
   - El orden de aparición en el texto español vs inglés
   - Que en español diga "piedras grandes" y en inglés "great stones"
   - La estructura gramatical diferente entre idiomas
5. **SÍ importa:**
   - Que cada número Strong esté presente
   - Que cada Strong tenga el mismo número de posición
   - Que no falten ni sobren números Strong

**Ejemplo de verificación correcta:**

Versículo con orden diferente en español vs inglés:

SpaTDP (español): "gran poder" 
- G1411,12 (poder)
- G4183,13 (gran)

KJV (inglés): "great power"
- G4183,13 (great)
- G1411,12 (power)

✅ VERIFICACIÓN: Ambos tienen G1411 en posición 12 y G4183 en posición 13
✓ Correcto - El orden en el texto es diferente pero las posiciones Strong
coinciden

**Ejemplo de error real:**

SpaTDP: G3037,16 (piedra en posición 16)
KJV: G3037,18 (stone en posición 18)

❌ ERROR: Mismo Strong pero diferente posición

#### 4.5. NO Hacer:

❌ "Revisando versículos 1-10... ✓ Correcto"
❌ "Todos los versículos están correctos"
❌ Omitir versículos intermedios
❌ Resumir múltiples versículos juntos

#### 4.6. SÍ Hacer:

✅ Revisar CADA versículo individualmente
✅ Extraer TODOS los números Strong de SpaTDP
✅ Extraer TODOS los números Strong de KJV
✅ Extraer el texto completo de WEB
✅ Extraer el texto completo de RVG2012
✅ Verificar palabra por palabra
✅ Si hay 25 versículos, verificar los 25

#### 4.7 Lista de chequeo por versículo

- [ ] ¿Todos los Strong de SpaTDP están en KJV?
- [ ] ¿Todas las posiciones coinciden?
- [ ] ¿Hay palabras divididas en KJV (type="x-split")? → Contar como una
- [ ] ¿Ortografía correcta en español?
- [ ] ¿Traducción coherente con el griego?

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
- Solución: usar archivos gbfxml divididos por capítulos en `gen/capitulos/` 
  y de KJV en ref/swork_kjv/capitulos
- Búsquedas con `gitlab_blob_search` tienen límites de resultados


## Notas

- Usuario prefiere respuestas concisas
- Verificar antes de afirmar cualquier capacidad
