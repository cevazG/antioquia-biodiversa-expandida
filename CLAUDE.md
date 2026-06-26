# Antioquia Biodiversa — Documentación Técnica

## Descripción general

Web app mobile-first para la Gobernación de Antioquia. Permite consultar la biodiversidad del departamento, explorar la red hídrica y acceder a programas comunitarios, en español e inglés. Acceso vía QR.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (sin frameworks) |
| Backend | Node.js + Express 4 · MongoDB Atlas M0 · Mongoose ODM (1 BD: `comunidad`) |
| Datos | JSON estático — biodiversidad lee `species.json` directamente, sin API REST |
| Hosting | GitHub Pages / Netlify (archivos estáticos) |
| Diseño | Mobile-first, 375–430 px de ancho objetivo |
| Idiomas | Español / Inglés (`localStorage` clave `ab_lang`) |
| Mapa municipios | Leaflet.js 1.9.4 |
| Logs | Winston 3 — JSON estructurado con traceId por petición (ajuste v2.1) |
| Caché | Redis 7 + ioredis — TTLs por ruta; modo degradado si Redis no está disponible (ajuste v2.1) |
| SAST | ESLint-security + Semgrep (`p/nodejs`, `p/owasp-top-ten`) — 0 errores en código de API (ajuste v2.1) |

---

## Identidad visual — Gobernación de Antioquia

> Fuente: **Manual de Identidad Visual — Gobernación de Antioquia** (leído y aplicado).

### Colores por módulo

| Módulo | Color principal | HEX |
|---|---|---|
| Biodiversidad | Verde / Verde oscuro | `#018d38` / `#0b5640` |
| Agua | Azul | `#3561ab` |
| Comunidad / JPL | Naranja / Dorado | `#f28e18` / `#B0942B` |
| Especie del Mes | Púrpura | `#8b4a97` / `#5e2c68` |

### Tipografía
- **Poppins** (Google Fonts) — pesos 400, 500, 600, 700, 800
- Poppins Italic para nombres científicos

---

## Estructura de carpetas

```
Antioquia Biodiversa/
├── index.html                         ← Redirect a biodiversidad/index.html
├── CLAUDE.md                          ← Este archivo
├── RESUMEN_PROYECTO.md                ← Resumen ejecutivo para stakeholders
├── SCHEMA_DB.md                       ← Esquema MongoDB para producción
├── data/
│   └── translations.json              ← Textos ES/EN compartidos por todos los módulos
│
├── admin/                             ← Panel de administración para curadores
│   ├── index.html                     ← Login
│   ├── jpl.html                       ← Panel curador JPL (fotos biodiversidad)
│   ├── gc.html                        ← Panel curador Guarda Cuencas
│   ├── css/admin.css                  ← Diseño del panel (incluye .foto-slot para multi-foto)
│   └── js/api.js                      ← Cliente HTTP del panel
│
├── backend/                           ← API REST (Node.js/Express + MongoDB Atlas)
│   ├── package.json
│   ├── .env                           ← MONGODB_URI_COM, SESSION_SECRET, ADMIN_PASSWORD, LOG_LEVEL, REDIS_URL
│   ├── src/
│   │   ├── index.js                   ← Express app, rutas, CORS, sesiones, requestLogger
│   │   ├── db.js                      ← Conexión MongoDB + Redis (exporta connCom, redis)
│   │   ├── swagger.yaml               ← Spec OpenAPI 3.0.3
│   │   ├── middleware/
│   │   │   ├── adminAuth.js           ← Guard de sesión para rutas admin
│   │   │   └── requestLogger.js       ← Log de cada request: método, path, status, ms, traceId
│   │   ├── utils/
│   │   │   ├── logger.js              ← Winston: JSON estructurado, traceId, archivos en logs/
│   │   │   └── cache.js               ← getCached() + invalidate() con TTLs de la propuesta
│   ├── .eslintrc.json                 ← ESLint + eslint-plugin-security; overrides para tests/scripts
├── .semgrep.yml                       ← Reglas SAST locales + apunta a p/nodejs y p/owasp-top-ten
├── azure-pipelines.yml                ← CI: lint → lint:security → semgrep → tests → SonarQube → deploy
├── netlify.toml                       ← Publish dir, redirects trailing slash, security headers, cache
│   │   ├── models/
│   │   │   ├── JplPhoto.js            ← fotos:[String] (array 1-3), mes, especie, grupo, IUCN…
│   │   │   └── GcPhoto.js             ← foto:String (único), mes, cuenca, subregion…
│   │   └── scripts/
│   │       ├── import_excel.js        ← Importa especies desde plantilla Excel
│   │       ├── generate_template.js   ← Genera plantilla Excel para curadores
│   │       ├── generate_evaluacion_especies.js  ← Genera plantilla Excel de evaluación (4 hojas)
│   │       ├── export_evaluacion_csv.js         ← Exporta LISTADO diligenciado a CSV
│   │       ├── generate_analisis_especies_doc.js ← Genera Word con propuesta de 158 especies
│   │       ├── generate_docs.js       ← Regenera documentos Word para TI
│   │       ├── add_peces_arboles.js   ← Migración: agrega grupos peces/arboles_nativos
│   │       └── optimize_photos.js     ← Convierte JPG/PNG → WebP 1200px q82 en batch
│
├── biodiversidad/                     ← Módulo principal
│   ├── index.html                     ← Selección de idioma (entrada a la app)
│   ├── home.html                      ← Selección de módulo (Bio / Agua / Comunidad)
│   ├── biodiversidad.html             ← Landing bio: buscar por subregión o especie
│   ├── mapa.html                      ← Mapa SVG interactivo — toca subregión → navega directo
│   ├── subregion.html                 ← Grupos de biodiversidad por subregión
│   ├── listado.html                   ← Acordeón familia → especie + buscador
│   ├── especie.html                   ← Ficha: galería, IUCN, distribución, descripción
│   ├── css/
│   │   ├── main.css                   ← Variables globales, tipografía, reset
│   │   ├── components.css             ← Componentes UI reutilizables
│   │   ├── animations.css             ← Transiciones y animaciones
│   │   ├── especie.css                ← Galería con slides, dots, contador (z-index:10), swipe
│   │   └── …                         ← biodiversidad/home/index/listado/mapa/subregion.css
│   ├── js/
│   │   ├── i18n.js                    ← Sistema de traducción ES/EN
│   │   ├── data.js                    ← DataStore: carga y filtrado de species.json
│   │   ├── map.js                     ← MapController: SVG interactivo (CSS-only hover)
│   │   ├── nav.js                     ← Nav: navegación con parámetros URL
│   │   ├── app.js                     ← App: inicialización y utilidades compartidas
│   │   └── …                         ← biodiversidad/especie/home/index/listado/mapa/subregion.js
│   ├── data/
│   │   └── species.json               ← Familias y especies con fotos, IUCN, subregiones
│   └── img/
│       ├── mapa/                      ← JPG oficial mapa de Antioquia
│       ├── icons/                     ← SVG por grupo bio
│       ├── logo/                      ← Logo Gobernación de Antioquia
│       ├── placeholders/              ← Siluetas por grupo
│       └── species/                   ← Fotos WebP: grupo/familia/spXXX_slug/slug_001.webp
│           └── GUIA_IMAGENES.md       ← Instrucciones para curadores de fotos
│
├── agua/                              ← Módulo de recursos hídricos
│   ├── index.html
│   ├── mapa.html
│   ├── subregion.html
│   ├── data/fuentes.json
│   └── mapas/
│
└── comunidad/                         ← Módulo comunidad
    ├── index.html                     ← Landing con 3 programas (JPL, GC, EDM)
    ├── especie_del_mes.html           ← Especie del mes + galería comunitaria
    ├── data/especie_mes.json
    ├── jovenes_pa_lante/              ← Programa JPL
    │   ├── index.html                 ← Landing: stats iNaturalist en vivo + acceso a galería/mapa
    │   ├── index.js                   ← Carga stats de iNaturalist (obs, spp, observadores) con animación
    │   ├── mapa.html                  ← Mapa Leaflet — 90 municipios beneficiados
    │   ├── galeria.html               ← Galería de fotos con filtros (grupo, subregión, versión/mes)
    │   ├── galeria.js                 ← Carousel: dots + tap + swipe; getImgs() compatibilidad foto/fotos
    │   └── data/
    │       ├── municipios.json          ← 90 municipios con coords y subregión
    │       ├── fotos_biodiversidad.json ← Índice de versiones/meses (id, titulo/mes, archivo, count)
    │       ├── fotos_v0.json            ← Primera Versión: 17 fotos (campo foto:string — legado)
    │       └── fotos_2026_06.json       ← Junio 2026 (campo foto:string — legado, 2 entradas)
    └── guarda_cuencas/               ← Programa Guarda Cuencas
        ├── index.html                 ← Landing con acceso a galería
        ├── galeria.html               ← Galería 10 fotos/mes (paisaje 16:9) + archivo mensual
        └── data/
            ├── fotos_cuencas.json     ← Índice de meses
            └── cuencas_2026_06.json   ← 10 fotos junio 2026 (cuenca, subregion, municipio…)
```

---

## Sistema de traducciones (i18n.js)

### Regla fundamental: dos capas

**Capa 1 — `data/translations.json`** → solo strings de UI (etiquetas, botones, mensajes).
**Capa 2 — campos bilingües en los JSON de datos** → contenido de especies, fuentes, etc.

```json
// species.json — patrón correcto
{
  "nameEs": "Colibrí de cola rufa",
  "nameEn": "Rufous-tailed Hummingbird",
  "descriptionEs": "Descripción larga...",
  "descriptionEn": "Long description..."
}
```

A escala (150+ especies), las descripciones NO van en `translations.json` — solo en `species.json`.

### API de i18n.js

```js
I18n.init()          // Carga JSON, aplica traducciones al DOM, cablea toggles
I18n.t('clave')      // Retorna texto traducido (dot notation: 'groups.aves')
I18n.setLang('en')   // Cambia idioma + dispara evento CustomEvent 'langchange'
I18n.getLang()       // Retorna 'es' o 'en'
I18n.apply()         // Re-aplica todas las traducciones [data-i18n] al DOM
```

### Patrones de uso en HTML

```html
<span data-i18n="clave">Texto español</span>
<input data-i18n-placeholder="search_placeholder">
<button data-lang-toggle>EN</button>   <!-- se cablea automáticamente -->
```

### Auto-detección de ruta

`_autoPath()` calcula la ruta a `translations.json` según la profundidad del URL:
- `biodiversidad/home.html` (depth 1) → `../data/translations.json` ✓
- `comunidad/jovenes_pa_lante/mapa.html` (depth 2) → `../../data/translations.json` ✓

**Netlify Pretty URLs:** cuando `pathname.endsWith('/')` todos los segmentos son directorios. Sin este fix la profundidad se calcula mal y las claves aparecen en crudo.

### Guard anti-duplicación

`_wireLangToggles()` usa `data-langWired` para no añadir listeners duplicados cuando `I18n.init()` se llama más de una vez.

---

## Flujo de navegación

```
/ (index.html)
  └─→ biodiversidad/index.html          Selección de idioma
        └─→ biodiversidad/home.html     Selección de módulo
              ├─→ biodiversidad/biodiversidad.html
              │     ├─→ biodiversidad/mapa.html → subregion.html → listado.html → especie.html
              │     ├─→ biodiversidad/listado.html?kingdom=flora
              │     └─→ biodiversidad/listado.html?kingdom=fauna
              ├─→ agua/index.html
              │     ├─→ agua/mapa.html
              │     └─→ agua/subregion.html?subregion=XXX&tipo=fuentes|cuencas
              └─→ comunidad/index.html
                    ├─→ comunidad/jovenes_pa_lante/index.html
                    │     ├─→ comunidad/jovenes_pa_lante/mapa.html
                    │     └─→ comunidad/jovenes_pa_lante/galeria.html
                    ├─→ comunidad/guarda_cuencas/index.html
                    │     └─→ comunidad/guarda_cuencas/galeria.html
                    └─→ comunidad/especie_del_mes.html
```

---

## Grupos de biodiversidad

| Emoji | Español | English | ID interno | Reino |
|---|---|---|---|---|
| 🦜 | Aves | Birds | `aves` | `fauna` |
| 🐸 | Anfibios y Reptiles | Amphibians & Reptiles | `anfibios_reptiles` | `fauna` |
| 🦋 | Mariposas | Butterflies | `mariposas` | `fauna` |
| 🦗 | Polillas | Moths | `polillas` | `fauna` |
| 🦌 | Mamíferos | Mammals | `mamiferos` | `fauna` |
| 🐄 | Animales Domésticos | Domestic Animals | `animales_domesticos` | `fauna` |
| 🐟 | Peces de Agua Dulce | Freshwater Fish | `peces` | `fauna` |
| 🌸 | Orquídeas | Orchids | `orquideas` | `flora` |
| 🌳 | Árboles Nativos | Native Trees | `arboles_nativos` | `flora` |

### Emojis por familia (FAMILY_EMOJI)

Definido en `listado.js`, `especie.js` y `galeria.js` (JPL). El emoji de grupo es el fallback.

```js
const FAMILY_EMOJI = {
  bradypodidae:'🦥', choloepodidae:'🦥',
  callitrichidae:'🐒', cebidae:'🐒', atelidae:'🐒', aotidae:'🐒',
  procyonidae:'🦝', trichechidae:'🦭', felidae:'🐆',
  mustelidae:'🦦', ursidae_andean:'🐻', canidae:'🦊',
  sciuridae:'🐿️', caviidae:'🦫', dasyproctidae:'🦫',
  elapidae:'🐍', cracidae:'🐓', ramphastidae:'🦜',
};
```

## Las 9 subregiones (IDs internos)

`uraba` · `occidente` · `norte` · `bajo_cauca` · `nordeste` · `magdalena_medio` · `valle_aburra` · `oriente` · `suroeste`

---

## Estructura de datos

### species.json

```json
{
  "families": [{ "id": "trochilidae", "group": "aves", "nameEs": "…", "nameEn": "…" }],
  "species": [{
    "id": "sp001", "familyId": "trochilidae", "group": "aves",
    "scientificName": "Amazilia tzacatl",
    "nameEs": "Colibrí de cola rufa", "nameEn": "Rufous-tailed Hummingbird",
    "iucn": "LC", "subregions": ["Valle de Aburrá", "Oriente"],
    "descriptionEs": "…", "descriptionEn": "…",
    "photos": [
      "aves/trochilidae/sp001_amazilia_tzacatl/01.jpg",
      { "url": "aves/.../02.jpg", "captionEs": "Macho", "captionEn": "Male" }
    ]
  }]
}
```

Las fotos se referencian como rutas relativas a `biodiversidad/img/species/`.
Si `photos: []`, la app muestra automáticamente el placeholder del grupo.

### fotos JPL — dos formatos (compatibilidad hacia atrás)

Los archivos JSON estáticos publicados antes del esquema multi-foto usan campo singular:
```json
{ "foto": "img/fotos/bio/v0/especie_001.webp", … }
```

Los documentos MongoDB y los JSON publicados desde el admin usan array:
```json
{ "fotos": ["img/fotos/bio/2026-06/aves/coereba/coereba_001.webp"], … }
```

`galeria.js` normaliza ambos con `getImgs(foto)`:
```js
function getImgs(foto) {
  if (foto.fotos && foto.fotos.length) return foto.fotos;
  if (foto.foto) return [foto.foto];
  return [];
}
```

### Modelo MongoDB JplPhoto

```js
{
  mes:              String,   // 'YYYY-MM'
  orden:            Number,
  fotos:            [String], // rutas relativas al frontend (1–3 fotos)
  credito:          String,
  municipio:        String,
  subregion:        String,   // ID interno (ej. 'uraba')
  especieEs:        String,
  especieEn:        String,
  especieCientifico:String,
  grupo:            String,
  iucn:             String,   // 'LC','NT','VU','EN','CR','DD'
  endemica:         Boolean,
  descripcionEs:    String,
  descripcionEn:    String,
  publicado:        Boolean,
}
```

### fotos_biodiversidad.json (índice JPL)

```json
{
  "meses": [
    { "id": "2026-06", "mes": "Junio", "mesEn": "June", "año": 2026,
      "count": 3, "portada": "img/fotos/bio/2026-06/…/001.webp",
      "archivo": "data/fotos_2026_06.json" },
    { "id": "v0", "titulo": "Primera Versión", "tituloEn": "First Edition",
      "count": 17, "portada": "img/fotos/bio/v0/…webp",
      "archivo": "data/fotos_v0.json" }
  ]
}
```

El campo `portada` es `fotos[0].fotos?.[0]` (array) o `fotos[0].foto` (legado).
Las entradas sin fecha usan `titulo`/`tituloEn` en lugar de `mes`/`año`.

### especie_mes.json

```json
{
  "actual": {
    "mes": "Mayo", "año": 2026,
    "nombre": "Mariposa Morpho Azul", "nombreCientifico": "Morpho peleides",
    "grupo": "mariposas", "emoji": "🦋", "iucn": "LC",
    "subregiones": ["Oriente", "Suroeste", "Norte"],
    "descripcionEs": "…", "descripcionEn": "…",
    "como_identificarlaEs": "…", "como_identificarlaEn": "…",
    "fotos_comunidad": [{ "usuario": "…", "municipio": "…", "fecha": "YYYY-MM-DD" }]
  },
  "anteriores": [{ "mes": "Abril", "fotos_comunidad": 18 }]
}
```

---

## Panel admin JPL — funcionalidades

### Multi-foto (1–3 imágenes por especie)

- El formulario muestra slots cuadrados en una rejilla (`.foto-slots` en `admin.css`)
- **Nueva entrada**: arranca con 1 slot vacío; botón "+ Agregar otra foto" hasta máximo 3
- **Edición**: muestra las fotos existentes como thumbnails con ✕ para eliminar; se pueden agregar nuevas
- En el envío: `fotosExistentes` (JSON array de rutas a conservar) + `fotosNuevas` (archivos nuevos)
- El backend borra del disco las fotos eliminadas y guarda las nuevas como WebP optimizado

### Autofill iNaturalist

- Campo "Nombre científico" → botón "🔍 Autocompletar"
- Llama a `POST /api/admin/autofill` → backend consulta la API pública de iNaturalist
- Rellena (solo campos vacíos): nombre en español, nombre en inglés, descripción ES, descripción EN
- Actualiza IUCN si el valor actual es DD y iNaturalist devuelve algo más específico
- Muestra enlace "Ver en iNaturalist ↗" al resultado encontrado
- Fuente: `/v1/taxa?q=…&locale=en` + `/v1/taxa/{id}?locale=es` + `?locale=en`

### Ruta de archivos JPL

```
comunidad/jovenes_pa_lante/img/fotos/bio/{mes}/{grupo}/{especie_slug}/{especie_slug}_NNN.webp
```
`saveJplFile()` en `admin.js`: memoryStorage → sharp WebP 1200px q82 → numeración secuencial por carpeta.

---

## Galería JPL — carousel de fotos

Cuando una entrada tiene 2 o 3 fotos, el modal usa el mismo patrón que `especie.html`:

- **Dots**: indicadores en la parte inferior central (círculo → pastilla activa)
- **Tap**: toca la foto → avanza a la siguiente (cíclico)
- **Swipe**: desliza izquierda/derecha para navegar (umbral 40 px)
- **Contador**: badge `N / total` en la esquina inferior derecha (`z-index: 10`)

El mismo patrón se aplica en `biodiversidad/especie.html` (galería de fotos de especies).

---

## iNaturalist — panel de estadísticas JPL

En `comunidad/jovenes_pa_lante/index.html` hay un panel de ciencia ciudadana que carga en vivo:

- **Observaciones** totales del proyecto
- **Especies** identificadas
- **Observadores** activos

Fuentes API (pública, sin auth):
- `GET /v1/projects/jovenes-palante-con-el-ambiente` → obs + spp
- `GET /v1/observations/observers?project_id=…&per_page=1` → total_results

Animación count-up con ease-out cúbico (1 400 ms). Si la API falla en 6 s, usa valores de fallback estáticos.

---

## Categorías IUCN

| Código | Español | Color |
|---|---|---|
| LC | Preocupación menor | Verde `#4CAF50` |
| NT | Casi amenazada | Amarillo `#FFC107` |
| VU | Vulnerable | Naranja `#FF9800` |
| EN | En peligro | Rojo `#F44336` |
| CR | En peligro crítico | Púrpura `#9C27B0` |
| DD | Sin evaluación global | Gris `#9E9E9E` |
| NE | Sin evaluación global | Gris claro `#e0e0e0` (badge outline) |

> **Nota DD vs NE:** Las mariposas y polillas sin evaluación IUCN formal se almacenan como DD por compatibilidad de display, pero el label en la UI es "Sin evaluación global".

---

## Guía de imágenes de especies

Estructura: `biodiversidad/img/species/<grupo>/<familia>/<spXXX_slug>/<slug>_001.webp`

- Formato obligatorio: **WebP** — el script `optimize_photos.js` convierte cualquier JPG/PNG
- Primera foto (`_001.webp`) = foto principal (aparece en tarjetas del listado)
- Resolución: máx 1200 px en el lado mayor, `fit: inside`, quality 82
- Los uploads del panel admin se convierten automáticamente en el servidor (sharp)

---

## SAST — Análisis estático de seguridad

### Scripts de seguridad disponibles

| Script | Alcance | Cuándo usar |
|---|---|---|
| `npm run lint` | Todo `src/` — calidad de código | En cada commit |
| `npm run lint:security` | Solo código de API (`routes/`, `middleware/`, `utils/`, `index.js`, `db.js`) | Antes de cada PR |
| `npm run lint:fix` | Todo `src/` — corrige automáticamente | Para limpiar advertencias menores |
| `npm audit --audit-level=high` | Dependencias de producción con CVE conocidas | Antes de cada PR |

### Resultado esperado de `lint:security`

- **0 errores** — el pipeline CI falla si hay errores
- **~20 advertencias** — todas son falsos positivos documentados con `// eslint-disable-next-line` en el código (rutas de archivo construidas por el servidor, claves de objetos desde MongoDB, todo bajo `requireAdmin`)

### Pipeline CI — 7 pasos (azure-pipelines.yml)

Según la Propuesta Técnica v2.0, el pipeline ejecuta en cada push a `main` o `develop`:

| Paso | Comando | Falla si… |
|---|---|---|
| 1 | Checkout desde Azure Repos | — |
| 2 | `npm install` | Dependencias no resuelven |
| 3 | `npm audit --audit-level=high` | CVE Alta o Crítica en deps de producción |
| 4 | `npm run lint:security` | Error ESLint de severidad `error` |
| 5 | `npm test` | Test fallido o cobertura < 90% |
| 6 | Semgrep `p/nodejs + p/owasp-top-ten` | Vulnerabilidad Alta o Crítica |
| 7 | Build + deploy (solo `develop`/`main`) | — |

Semgrep publica el reporte JSON como artefacto `semgrep-sast`. Las reglas locales en `.semgrep.yml` detectan session cookies sin `secure`, contraseñas hardcodeadas y errores internos expuestos al cliente.

> **Pendiente de activar:** requiere acceso al proyecto Azure DevOps de TI Gobernación. `azure-pipelines.yml` está listo; solo necesita las Service Connections configuradas por TI.

---

## Netlify — Configuración de despliegue

El frontend estático se despliega en Netlify desde la rama `main`. El backend Node.js corre en el servidor de la Gobernación y **no** pasa por Netlify.

### netlify.toml — comportamiento clave

| Sección | Qué hace |
|---|---|
| `[build] publish = "."` | Sirve todos los archivos desde la raíz del repo |
| Redirect `/` → `/biodiversidad/index.html` (200) | Entrada instantánea sin parpadeo de la meta-refresh |
| Redirects `/{módulo}/*/` → `/{módulo}/*` (301) | Normaliza trailing slash para que `_autoPath()` en i18n.js calcule bien la profundidad del URL |
| Headers `X-Frame-Options`, `X-Content-Type-Options`… | Cabeceras de seguridad en todas las páginas |
| Cache CSS/JS/fotos especies → 1 año | Los archivos usan `?v=N` como cache buster al cambiar |
| Cache fotos JPL/GC → 30 días | Se actualizan mensualmente al publicar un mes nuevo |
| Cache JSON de datos → 1 hora | Pueden cambiar sin nuevo deploy de Netlify |

### Privacidad Ley 1581 (`biodiversidad/index.html`)

Modal que aparece **una sola vez** en la primera visita:
- Texto completo en ES y EN (antes de elegir idioma)
- Checkbox **no pre-marcado** — el botón "Aceptar · Accept" arranca deshabilitado
- Al aceptar: `localStorage.setItem('ab_privacy_accepted', '1')` → modal no vuelve a aparecer
- Botón en `--color-green-light` (#3bbb6a) — verde del sistema de diseño oficial

---

## Manual de despliegue (README.md)

Cubre todos los compromisos de documentación del § 8 de la Propuesta Técnica v2.0:

| Sección | Contenido |
|---|---|
| Prerrequisitos | Node.js 22 LTS, npm 10+, MongoDB Atlas 7.x, Redis 7.x |
| Instalación local | Clonar, instalar, configurar `.env`, levantar Redis, `npm run dev` |
| Variables de entorno | `MONGODB_URI_COM`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `REDIS_URL`, `LOG_LEVEL`, `PORT` |
| Comandos | `dev`, `start`, `lint`, `lint:security`, `npm audit`, `test`, `test:coverage`, `optimize-photos` |
| Despliegue producción | Ubuntu 24.04: Node.js, Redis (256 MB, allkeys-lru), PM2, Nginx, Certbot/SSL |
| Nginx | Config completa con proxy inverso, `X-Real-IP`, health check upstream, SSL |
| Verificación | `pm2 status`, `pm2 logs`, `curl /api/health` — respuesta esperada `mongodb+redis connected` |
| API REST | Tabla de endpoints con método, ruta, descripción y nivel de auth |
| Stack tecnológico | Tabla completa al día (Winston, ioredis, SAST, CI/CD) |

---

## Roadmap

### Fase 1 — Prototipo (completado)
- [x] Sistema de diseño con identidad visual oficial
- [x] Módulo Biodiversidad: 6 pantallas, mapa SVG, 9 grupos, buscador, galería
- [x] Mapa SVG: navegación directa al tocar subregión (sin panel intermedio), hover CSS-only
- [x] Módulo Agua: 3 pantallas, mapa interactivo con filtros fuentes/cuencas
- [x] Módulo Comunidad: landing con 3 programas (JPL, Guarda Cuencas, Especie del Mes)
- [x] JPL: mapa Leaflet 90 municipios + galería con filtros chips (grupo, subregión, versión/mes)
- [x] Guarda Cuencas: galería fotos cuencas (paisaje 16:9) con archivo mensual
- [x] Especie del Mes: selección editorial + galería comunitaria
- [x] Sistema bilingüe ES/EN completo en todos los módulos
- [x] Backend Node.js/Express + MongoDB Atlas: API de especies, import desde Excel
- [x] Panel admin web para curadores JPL y Guarda Cuencas (login, CRUD fotos, publicar JSON)
- [x] Tipografía Poppins auto-hospedada (12 woff2, sin dependencia de Google Fonts)
- [x] **80 especies** en 32 familias y 6 grupos activos — 92 fotos WebP (1200 px, q82)
- [x] Migración masiva de polillas: 30 nuevas especies en 6 familias
- [x] JPL Primera Versión: 17 fotos reales de participantes del programa en campo
- [x] Sistema FAMILY_EMOJI: emojis por familia taxonómica en listado, ficha y galería JPL
- [x] Fotos verticales en galería JPL: object-fit contain + fondo `#0d1f0f`
- [x] DD label: "Sin evaluación global" (más preciso para Lepidoptera sin evaluación IUCN)
- [x] galeria.js soporta `titulo`/`tituloEn` (versiones sin fecha) y `mes`/`año` (versiones mensuales)
- [x] CSS/JS extraídos de los 22 HTML a archivos externos
- [x] Plantilla Excel de evaluación de especies: 4 hojas (LISTADO, INSTRUCCIONES, Listas, RESUMEN)
- [x] Exportación CSV del LISTADO diligenciado: BOM UTF-8, maneja fórmulas y fechas
- [x] **Panel admin JPL: multi-foto (1–3 imágenes por especie)** — slots, fotos existentes, upload, borrado del disco
- [x] **Panel admin JPL: autofill iNaturalist** — nombre ES/EN, descripciones, IUCN, enlace
- [x] **Panel JPL landing: estadísticas iNaturalist en vivo** — obs, spp, observadores con animación count-up
- [x] **Galería JPL: carousel dots + tap + swipe** — mismo patrón que biodiversidad/especie.html
- [x] **Mariposas completadas**: 19 especies con subregiones, descripcionEs y descripcionEn
- [x] Corrección contador galería biodiversidad (`z-index: 10` en `.gallery-counter`)
- [x] Backward compat foto/fotos: `getImgs()` normaliza datos legados (foto:string) y nuevos (fotos:[])

### Fase 2 — Propuesta Técnica v2.1 (en curso)

> Ajustes comprometidos con la Gobernación de Antioquia. Secuencia: A1 → A2 → A3 → B1.
> Pendientes de TI Gobernación: Azure DevOps, credenciales Entra ID, servidor on-premises.

- [x] **A1 — Winston + /api/health** — logs JSON estructurados con traceId; health reporta estado MongoDB
- [x] **A2 — Redis 7 + ioredis** — caché de catálogo con TTLs definidos (RNF02, RNF06)
- [x] **A3 — ESLint-security + Semgrep** — SAST en dos capas + pipeline CI Azure DevOps (RNF05)
- [x] **npm audit** — agregado al pipeline CI (Paso 3 del PDF); falla en CVE Alta o Crítica
- [x] **README.md / Manual de despliegue** — prerrequisitos, instalación, Redis, Nginx, PM2, variables, comandos
- [ ] **B1 — Microsoft Entra ID** — reemplaza express-session; requiere Client ID + Tenant ID (RNF05, RNF08)
- [x] **C1 — Ley 1581** — modal de privacidad en entrada de la app, checkbox no pre-marcado, bilingüe, localStorage
- [x] **C2 — netlify.toml** — redirects para Pretty URLs, cabeceras de seguridad, cache de assets
- [ ] **WCAG 2.1 AA** — validación con WAVE antes de cada pase a producción

### Fase 3 — Contenido y producción completa
- [ ] Ampliar a 150+ especies con fotos y descripciones bilingües
- [ ] Consultar Libro Rojo de Colombia para estados IUCN reales en Lepidoptera
- [ ] Dominio oficial `.gov.co`
- [ ] PWA con modo offline (Service Workers)
- [ ] Analytics de uso
- [ ] Integración con SiB Colombia / GBIF

---

*Proyecto desarrollado con Claude Code — Anthropic*
*Última actualización: junio 2026*
