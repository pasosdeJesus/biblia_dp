# biblia_dp

Nuevo Testamento de Dominio Público con concordancia Strong, fiel al Textus Receptus de Stephanus (1550).

En este repositorio se encuentra el código fuente de la traducción en formato GBFXML, así como las herramientas necesarias para su verificación y conversión a otros formatos.

## Instalación y Generación

### Requisitos del Sistema

Para generar todos los formatos (incluyendo PDF y PostScript), se requieren herramientas como `xsltproc`, `jade`, `w3m` y un entorno TeX. 

En **adJ** (OpenBSD), puede instalar las dependencias necesarias con:
```bash
doas pkg_add libxslt openjade w3m texlive_texmf-minimal
```

### Configuración

Antes de intentar generar documentos, configure las fuentes de acuerdo a las herramientas que tenga ejecutando:

```bash
./conf.sh
```

Este script le indicará los programas requeridos si alguno llega a hacer falta. Una vez completada la configuración, puede generar HTML, PostScript y PDF con:

```bash
make
```

Los archivos generados se ubicarán en:
*   **Página HTML (única)**: `html/biblia_dp.html`
*   **Páginas HTML (múltiples)**: `html/index.html` y una página por capítulo (generadas con `make multi`).
*   **PostScript**: `imp/biblia_dp.ps`
*   **PDF**: `imp/biblia_dp.pdf`

También puede generar cada uno por separado:
```bash
make html/biblia_dp.html
make multi
make imp/biblia_dp.ps
make imp/biblia_dp.pdf
```

Para instalar los archivos generados:
```bash
make instala
```

## Estructura del Repositorio

*   **`libros/`**: Contienen el texto de la traducción de cada libro del Nuevo Testamento en formato `.gbfxml`, con el marcado de números Strong correspondiente.
*   **`formatos/`**: Esquemas DTD y hojas de estilo XSL/DSL para las transformaciones.
*   **`herram/`**: Herramientas y scripts para verificar la consistencia de la traducción y el marcado Strong.
*   **`docs/`**: Documentación técnica detallada. Ver **[docs/FORMATO.md](docs/FORMATO.md)**.
*   **`ref/`**: Obras y recursos de referencia externos.
*   **`ia/`**: Entrenamiento para agentes de IA que asisten en la verificación y traducción.

## Herramientas y Comandos

| Comando | Propósito |
|---|---|
| `make` | Generar todos los formatos (HTML, PS, PDF) |
| `make multi` | HTML multipágina (una por capítulo) |
| `make imp/biblia_dp.pdf` | Generar solo PDF |
| `make imp/biblia_dp.ps` | Generar solo PostScript |
| `make html/biblia_dp.html` | Generar solo HTML |
| `make instala` | Instalar archivos generados |
| `bin/m ai:framework` | Cargar marco bayesiano de análisis (para agentes IA) |
| `bin/m ai:principles` | Cargar principios del proyecto (para agentes IA) |
| `herram/validador.mjs` | Validar estructura GBFXML y números Strong |
| `herram/enriquecedor.mjs` | Enriquecer marcado (Strong, morfología) |
| `herram/corrector_formato.mjs` | Corregir problemas de formato |
| `herram/analizar-anidacion.mjs` | Analizar patrones de anidamiento wi |

## Licencia y Créditos

Vea detalles de los derechos de reproducción en **[LICENSE.md](LICENSE.md)** y los colaboradores en **[CREDITS.md](CREDITS.md)**.

Si desea colaborar traduciendo o desarrollando, por favor consulte **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Consulta en Línea

Puede explorar la traducción más reciente en: **<https://traduccion.pasosdeJesus.org>**
