# Registro de Marcado de Invocación Sagrada (sacred="yes")

**"Santificado sea tu nombre." (Mateo 6:9)**

Este documento registra el progreso de la aplicación del atributo `sacred="yes"` en el elemento `<wi>` para identificar las interpelaciones directas a la Divinidad (Invocación Sagrada).

---

## 1. Criterios Técnicos y Definición

*   **Atributo:** `sacred="yes"` añadido al elemento `<wi>` en el DTD.
*   **Definición:** Se aplica exclusivamente cuando un ser humano (o Jesús en su humanidad) se dirige directamente a Dios o a Jesús reconociendo Su divinidad/autoridad.
*   **Procedimiento:** Se utiliza la morfología de los archivos OSIS (`ref/sword_kjv/capitulos2003/`) filtrando por el caso vocativo (`robinson:N-V...`) y términos sagrados (Señor, Dios, Padre, Jesús, Maestro/Rabí en contexto de fe).

---

## 2. Estado del Proyecto (al 10 de mayo de 2026)

### Libros Completados [x]
1.  **Mateo**: 35 invocaciones actualizadas (en 28 versículos del 6:9 al 27:46).
2.  **Marcos**: 16 invocaciones actualizadas (en 10 versículos del 1:24 al 15:34).
3.  **Lucas**: 33 invocaciones actualizadas (en 26 versículos del 1:76 al 23:46).
4.  **Juan**: 22 invocaciones actualizadas (en 19 versículos del 13:6 al 21:21).
5.  **Hechos**: 18 invocaciones actualizadas (en 17 versículos del 1:24 al 26:15).
6.  **Romanos**: 2 invocaciones actualizadas (10:16 y 11:3).
7.  **1 Corintios**, **2 Corintios**, **Gálatas**, **Efesios**, **Filipenses**, **Colosenses**, **1 Tesalonicenses**, **2 Tesalonicenses**, **1 Timoteo**, **2 Timoteo**, **Tito**, **Filemón**: Revisados (sin interpelaciones directas).
8.  **Hebreos**: 2 invocaciones actualizadas (en 2 versículos: 1:8 y 1:10).
9.  **Santiago**: Revisado hasta 2:18 (sin interpelaciones directas).

### Libros Pendientes [ ]

| Libro | Candidatos (vocativos a la divinidad) |
|---|---|
| **Santiago** | Ninguno identificado (revisar desde 2:19) |
| **1 Pedro** | Ninguno identificado |
| **2 Pedro** | Ninguno identificado |
| **1 Juan** | Ninguno identificado (en 2:1 "πατερες" se refiere a humanos) |
| **2 Juan** | Ninguno identificado |
| **3 Juan** | Ninguno identificado |
| **Judas** | Ninguno identificado |
| **Apocalipsis** | Rev 4:11 "Señor", Rev 11:17 "Señor Dios Todopoderoso", Rev 15:3 "Señor Dios Todopoderoso", Rev 15:4 "Señor", Rev 16:5 "Señor", Rev 16:7 "Señor Dios Todopoderoso", Rev 22:20 "Señor Jesús" |

---

## 3. Guía para el Siguiente Agente

1.  **Extraer vocativos:** Usar el siguiente comando para listar candidatos desde los OSIS:
    `grep -E "morph=\"robinson:[NA]-V" ref/sword_kjv/capitulos2003/[Libro]*.osis.xml | grep -E "strong:G2962|strong:G2316|strong:G3962|strong:G2424|strong:G1320|strong:G4462" | sed -e 's/.*osisID="\([^"]*\)".*lemma="strong:\([^ ]*\).*>\(.*\)<\/w>.*/\1 | \2 | \3/' | sort -u`
2.  **Filtrar:** Asegurar que la interpelación es a la Divinidad (excluir "señor" a hombres, "maestro" por cortesía humana, etc.).
3.  **Aplicar:** Usar `replace` en el archivo `.gbfxml` correspondiente, integrando la palabra completa en el `<wi>` y añadiendo `sacred="yes"`.
4.  **Actualizar:** Marcar el progreso en este archivo.

---

**Diligencia Fiel:** Mantener la integridad del Texto Recepto y no alterar los números Strong ni las posiciones.
