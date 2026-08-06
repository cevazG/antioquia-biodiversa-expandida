# Antioquia Natural — Documentación Técnica

## Reglas de flujo de trabajo

> **OBLIGATORIO — no hacer commit ni push a GitHub sin autorización explícita del usuario.**
>
> Flujo correcto:
> 1. Implementar cambios
> 2. Probar en **localhost:3000** — el usuario aprueba lo que ve
> 3. Solo cuando el usuario dice "sí, súbelo" → `git commit` + `git push`

> **Documentos privados — nunca subir a GitHub.** `Documentos gobernacion/TI/Propuesta_Ampliacion_JPL_Participantes.md` (y su versión `.docx` cuando exista) contienen la propuesta económica/tarifas internas de negociación con la Gobernación. Son solo para Sebastián y Claude — están en `.gitignore` a propósito. Cualquier documento similar de presupuesto/tarifas/negociación que se cree a futuro debe agregarse también a `.gitignore` y quedar fuera de cualquier commit.

---

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
| Autenticación admin | Usuarios individuales (colección `Usuario`) + bcrypt + reCAPTCHA v2 + MFA (TOTP) obligatorio — ver "Panel admin — Autenticación y usuarios" |
| Contenedores | Docker (multi-stage, usuario non-root, `.dockerignore`, `HEALTHCHECK`, escaneo Trivy en CI/CD) — ver "Docker — Containerización del backend" |

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

### Regla de texto: nunca mayúsculas sostenidas

> **No usar `text-transform: uppercase` ni escribir texto directamente en mayúsculas sostenidas en ningún label, kicker, badge o título de la UI.** Usar peso de fuente (bold) y/o `letter-spacing` para dar énfasis en vez de mayúsculas. Aplica a todo el proyecto, en los 3 módulos.

---

## Estructura de carpetas

```
Antioquia Natural/
├── index.html                         ← Redirect a biodiversidad/index.html
├── CLAUDE.md                          ← Este archivo
├── RESUMEN_PROYECTO.md                ← Resumen ejecutivo para stakeholders
├── SCHEMA_DB.md                       ← Esquema MongoDB para producción
├── data/
│   └── translations.json              ← Textos ES/EN compartidos por todos los módulos
│
├── admin/                             ← Panel de administración para curadores
│   ├── index.html                     ← Login (usuario + contraseña + reCAPTCHA v2)
│   ├── usuarios.html                  ← Gestión de usuarios (crear/editar/desactivar) — solo rol Admin.Contenido
│   ├── jpl.html                       ← Panel curador JPL (fotos biodiversidad)
│   ├── gc.html                        ← Panel curador Guarda Cuencas
│   ├── css/admin.css                  ← Diseño del panel (incluye .foto-slot para multi-foto)
│   └── js/api.js                      ← Cliente HTTP del panel
│
├── Dockerfile                         ← Imagen del backend: multi-stage, usuario non-root, HEALTHCHECK
├── .dockerignore                      ← Excluye node_modules, secretos, volúmenes dinámicos, documentos institucionales
├── docker-compose.yml                 ← Servicio app + volúmenes nombrados (fotos/JSON publicados/logs)
├── backend/                           ← API REST (Node.js/Express + MongoDB Atlas), arquitectura hexagonal por módulo
│   ├── package.json
│   ├── .env                           ← MONGODB_URI_COM, SESSION_SECRET, REDIS_URL, RECAPTCHA_SITE_KEY/SECRET_KEY, LOG_LEVEL
│   ├── src/
│   │   ├── index.js                   ← Express app, rutas, CORS, sesiones, requestLogger
│   │   ├── db.js                      ← Conexión MongoDB + Redis (exporta connCom, redis)
│   │   ├── swagger.yaml               ← Spec OpenAPI 3.0.3
│   │   ├── config/catalogo.js         ← Única fuente de verdad: GRUPOS_VALIDOS, SUBREGIONES_VALIDAS, IUCN_VALIDOS, ROLES_VALIDOS, ROL_SUPERADMIN
│   │   ├── middleware/
│   │   │   └── requestLogger.js       ← Log de cada request: método, path, status, ms, traceId
│   │   ├── utils/
│   │   │   ├── logger.js              ← Winston: JSON estructurado, traceId, archivos en logs/
│   │   │   ├── cache.js               ← getCached() + invalidate() con TTLs de la propuesta
│   │   │   └── rateLimit.js           ← Rate limiting en /login, /login/mfa, /autofill — se autodesactiva en NODE_ENV=test
│   │   ├── models/
│   │   │   ├── JplPhoto.js            ← fotos:[String] (array 1-3), mes, especie, grupo, IUCN…
│   │   │   ├── GcPhoto.js             ← foto:String (único), mes, cuenca, subregion…
│   │   │   └── Usuario.js             ← nombre, usuario, passwordHash, roles[], activo — ver "Panel admin — Autenticación y usuarios"
│   │   ├── modules/                   ← Hexagonal por módulo: domain/ (reglas puras) → application/casos_uso/ → infrastructure/ (Mongoose, Redis, bcrypt) → interfaces/http/ (router, composition root)
│   │   │   ├── jpl/                   ← CRUD + estadísticas + publicación de galería JPL
│   │   │   ├── gc/                    ← CRUD + publicación de galería Guarda Cuencas
│   │   │   └── auth/                  ← Login, usuarios individuales, RBAC, reCAPTCHA — ver sección dedicada abajo
│   │   ├── routes/admin.js            ← Composition root: monta authRouter + jplRouter/gcRouter/usuariosRouter detrás de requireRole()
│   │   └── scripts/
│   │       ├── import_excel.js        ← Importa especies desde plantilla Excel
│   │       ├── generate_template.js   ← Genera plantilla Excel para curadores
│   │       ├── generate_evaluacion_especies.js  ← Genera plantilla Excel de evaluación (4 hojas)
│   │       ├── export_evaluacion_csv.js         ← Exporta LISTADO diligenciado a CSV
│   │       ├── generate_analisis_especies_doc.js ← Genera Word con propuesta de 158 especies
│   │       ├── generate_docs.js       ← Regenera documentos Word para TI (parcialmente obsoleto, ver "TI Gobernación")
│   │       ├── add_peces_arboles.js   ← Migración: agrega grupos peces/arboles_nativos
│   │       ├── optimize_photos.js     ← Convierte JPG/PNG → WebP 1200px q82 en batch
│   │       ├── seed_usuario_admin.js  ← Bootstrap: crea el primer usuario Admin.Contenido
│   │       ├── lib/docx_helpers.js    ← Portada, TOC nativo, headings, tablas, header/footer institucional — compartido por los generadores de "TI Gobernación" abajo
│   │       ├── generate_levantamiento_requisitos.js ← Levantamiento_Requisitos_Antioquia_Natural.docx (FO-M7-P8-020) — script orphan, ver nota en "TI Gobernación"
│   │       ├── generate_propuesta_ajustes.js        ← Propuesta_Ajustes_Tecnicos_v2_Antioquia_Natural.docx (FO-M7-P8-021) — script orphan, ver nota en "TI Gobernación"
│   │       ├── generate_documento_integral.js       ← Documento_Integral_Desarrollo_Antioquia_Natural.docx (FO-M7-P8-023) — script orphan, ver nota en "TI Gobernación"
│   │       ├── generate_matriz_respuesta.js         ← Respuesta a los 26 hallazgos de REVISION 2 (histórico)
│   │       ├── generate_respuesta_revision3.js      ← Respuesta a los hallazgos de REVISION 3 — ver "TI Gobernación"
│   │       ├── generate_diccionario_datos.js        ← Diccionario_Datos_BD_Comunidad_Antioquia_Natural.xlsx (una hoja por colección)
│   │       ├── generate_presentacion_comite.py       ← Presentacion_Comite_Cientifico_Antioquia_Natural.pptx (python-pptx, criterios de evaluación de especies)
│   │       ├── generate_figura1_arquitectura_general.py ← Figura 1 del DI (graphviz) — única fuente editable, ver "Docker" y "TI Gobernación"
│   │       └── generate_figura3_infraestructura.py      ← Figura 3 del DI (graphviz), mismo patrón
│   └── __tests__/                     ← supertest (HTTP) + tests unitarios por capa hexagonal (domain/application aislados con fakes, sin Mongoose)
├── .semgrep.yml                       ← Reglas SAST locales + apunta a p/nodejs y p/owasp-top-ten
├── azure-pipelines.yml                ← CI → BuildImage (Docker + Trivy) → DeployDev/DeployProd (docker compose)
├── netlify.toml                       ← Publish dir, redirects trailing slash, security headers, cache
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
│   │   ├── species.json               ← Familias y especies con fotos, IUCN, subregiones, umbrella/endémica/dieta/actividad
│   │   └── subregiones.json           ← Contenido "sobre esta subregión": tagline, descripción, municipios, sitios destacados
│   └── img/
│       ├── mapa/                      ← JPG oficial mapa de Antioquia
│       ├── icons/                     ← SVG por grupo bio
│       ├── logo/                      ← Logo Gobernación de Antioquia
│       ├── placeholders/              ← Siluetas por grupo
│       └── species/                   ← Fotos WebP: grupo/familia/spXXX_slug/slug_001.webp
│           └── GUIA_IMAGENES.md       ← Instrucciones para curadores de fotos
│
├── agua/                              ← Módulo de recursos hídricos
│   ├── index.html                     ← Landing: stats interactivos (subregiones/ríos/cuencas → botones)
│   ├── mapa.html                      ← Mapa Leaflet de cuencas hidrográficas (18 ríos)
│   ├── subregion.html                 ← Fuentes/cuencas por subregión
│   ├── acueductos.html                ← Módulo aparte: cuencas que abastecen acueductos municipales
│   ├── ecosistemas.html               ← Landing de Ecosistemas Estratégicos (grid de 7 tipos)
│   ├── ecosistema.html                ← Ficha de un ecosistema: galería, sitios representativos (usa especie.css compartido)
│   ├── ecosistemas_mapa.html          ← Mapa Leaflet de sitios representativos; soporta deep-link `?foco=<id>`
│   ├── data/
│   │   ├── fuentes.json
│   │   ├── cuencas.json
│   │   ├── antioquia_boundary.json
│   │   └── ecosistemas.json           ← 7 ecosistemas, cada uno con `sitiosRepresentativos[]` (id, lat, lng, nombre, municipio, subregion)
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
| 🍄 | Hongos | Fungi | `hongos` | `fungi` |

**10 grupos en total** (`HOME_GROUPS` en `biodiversidad.js`), no todos con especies cargadas todavía — los que están en 0 se muestran como "Próximamente" en la cuadrícula de `biodiversidad.html`. El stat "Grupos bio" de esa pantalla (`#total-groups`) se calcula como `HOME_GROUPS.length`, nunca hardcodeado, para que no se desincronice del contenido real (incidente 2026-08-02: quedó fijo en "7" mientras la cuadrícula ya mostraba 10).

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
    ],
    "umbrella": true,
    "endemica": true,
    "dieta": "carnivoro",
    "actividad": "nocturno"
  }]
}
```

Las fotos se referencian como rutas relativas a `biodiversidad/img/species/`.
Si `photos: []`, la app muestra automáticamente el placeholder del grupo.

### Campos de atributo opcionales (badges en especie.html)

| Campo | Tipo | Valores válidos | Notas |
|---|---|---|---|
| `umbrella` | Boolean | `true` / ausente | Especie sombrilla — solo se marca en las que de verdad lo son (ej. *Panthera onca*, *Tremarctos ornatus*), nunca por defecto |
| `endemica` | Boolean | `true` / ausente | Nunca debe marcarse en organismos identificados solo a género/familia (`sp.`, `indet.`, `cf.`) — ver `isUnidentified()` abajo |
| `dieta` | String | `carnivoro`, `herbivoro`, `omnivoro`, `insectivoro`, `frugivoro`, `nectarivoro`, `granivoro`, `piscivoro`, `detritivoro` | Traducciones en `data/translations.json` (`dieta_*`) |
| `actividad` | String | `diurno`, `nocturno`, `crepuscular` | Convención por grupo cuando no hay dato específico: todas las mariposas = `diurno`, todas las polillas = `nocturno` |

Todos los campos son opcionales — si faltan, el badge correspondiente simplemente no se renderiza. Nunca se debe inventar un valor sin fuente citable; si no se encuentra dato confiable, se deja el campo fuera en vez de adivinar.

### subregiones.json

Contenido "sobre esta subregión" (identidad económica/cultural, no biodiversidad) que se muestra en `biodiversidad/subregion.html`, tomado de "Antioquia Viva 2025":

```json
{
  "subregiones": [{
    "id": "uraba",
    "tituloEs": "…", "tituloEn": "…",
    "descripcionEs": "…", "descripcionEn": "…",
    "municipios": ["Apartadó", "…"],
    "distritos": ["…"],
    "sitios": [
      { "nombreEs": "Serranía de Abibe", "nombreEn": "…", "ecoSiteId": "serrania-abibe" },
      { "nombreEs": "Hidroituango", "nombreEn": "…", "ecoSiteId": null }
    ]
  }]
}
```

`sitios[].ecoSiteId` enlaza al mapa de ecosistemas (`agua/ecosistemas_mapa.html?foco=<ecoSiteId>`) cuando el punto de interés es un sitio real dentro de `agua/data/ecosistemas.json`; se deja `null` para lugares que no son ecosistema/área protegida (represas, cascos urbanos, estaciones de tren) — esos se muestran como tag plano no interactivo, no como enlace.

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
  subregion:        String,   // ID interno (ej. 'uraba') — validado contra SUBREGIONES_VALIDAS
  especieEs:        String,
  especieEn:        String,
  especieCientifico:String,
  grupo:            String,   // validado contra GRUPOS_VALIDOS (config/catalogo.js)
  iucn:             String,   // 'LC','NT','VU','EN','CR','DD','NE' — validado contra IUCN_VALIDOS
  endemica:         Boolean,
  descripcionEs:    String,
  descripcionEn:    String,
  publicado:        Boolean,
}
```

`backend/src/config/catalogo.js` es la única fuente de verdad para `GRUPOS_VALIDOS`, `SUBREGIONES_VALIDAS` e `IUCN_VALIDOS` en el backend (debe coincidir con las listas ya usadas en `admin/jpl.js` y `admin/gc.js`). Ambos modelos (`JplPhoto`, `GcPhoto`) validan estos campos con `enum` de Mongoose, y las rutas de `admin.js` los validan antes de eso con un 400 explícito (grupo/subregión/IUCN no reconocidos, nombre común o cuenca/título faltante), para que el error llegue con un mensaje claro en vez de una excepción de validación de Mongoose.

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

## Panel admin — Autenticación y usuarios

Cada curador tiene usuario y contraseña propios — **no** una sola contraseña compartida (así era antes; se corrigió por un hallazgo crítico de TI Gobernación, ver "TI Gobernación" abajo).

- **Modelo** (`backend/src/models/Usuario.js`): `nombre`, `usuario` (único, minúsculas), `passwordHash` (bcrypt, factor 10), `roles: [String]`, `activo: Boolean`.
- **Roles** (`backend/src/config/catalogo.js`): `Curador.Biodiversidad`, `Curador.GuardaCuencas`, `Admin.Contenido` — este último es superrole (pasa cualquier `requireRole(...)`, incluida la gestión de usuarios). Los nombres coinciden a propósito con los que ya están comprometidos con TI como mapeo de roles de Microsoft Entra ID, para que una futura migración solo cambie el mecanismo de verificación, no el modelo de permisos.
- **Sesión**: `express-session`, cookie `httpOnly`, nombre custom (`antioquia.sid`), `secure` en producción, 8h de expiración. El usuario de la sesión se busca en Mongo **en cada petición** (no se cachea en la sesión), para que desactivar una cuenta revoque el acceso de inmediato — trade-off deliberado de rendimiento por seguridad.
- **`GET /api/admin/me` nunca responde 401** — siempre 200 con `{isAdmin:false}` si no hay sesión válida, para que el frontend pueda usarlo como probe sin tratar "no logueado" como error.
- **reCAPTCHA v2** en `admin/index.html`: verificado en el servidor (`modules/auth/infrastructure/verificarRecaptcha.js`) antes de siquiera consultar la base de usuarios. Usa las claves de prueba oficiales de Google (`RECAPTCHA_SITE_KEY`/`RECAPTCHA_SECRET_KEY` en `.env`) mientras el dominio real no está desplegado — **reemplazar por claves reales registradas para el dominio antes de producción**.
- **MFA (TOTP) obligatorio para todos los curadores** (2026-08-06, anticipando el requisito "Obligatorio" de MFA para administradores de la Guía de Arquitectura de TI, numeral 9 — independiente de Entra ID): login en dos pasos — `POST /login` valida password+reCAPTCHA y marca `req.session.usuarioIdPendienteMfa` (todavía NO abre sesión completa); si el usuario no tiene `mfaSecret` genera uno nuevo y devuelve un QR (`otplib` + `qrcode`, RFC 6238) para enrolar; `POST /login/mfa` verifica el código de 6 dígitos y recién ahí promueve la sesión a `usuarioId`. Un `Admin.Contenido` puede resetear el MFA de un curador que pierda su dispositivo (`POST /usuarios/:id/reset-mfa`, botón 🔑 en `admin/usuarios.html`) — vuelve a pedirle enrolar un dispositivo nuevo en su próximo login. `mfaSecret` nunca se expone en respuestas HTTP (mismo criterio que `passwordHash`).
- **Panel de gestión** (`admin/usuarios.html`, solo `Admin.Contenido`): crear, editar, desactivar, resetear MFA. Desactivar no borra el registro (soft-delete vía `activo:false`).
- **Rate limiting** (`backend/src/utils/rateLimit.js`, `express-rate-limit`): `/login` y `/login/mfa` a 10 solicitudes/15 min por IP, `/autofill` a 30/min — capa adicional contra fuerza bruta más allá de reCAPTCHA y del keyspace del código TOTP. Se autodesactiva en `NODE_ENV=test` (si no, la suite agotaría el límite en la primera decena de tests que hacen login); el comportamiento real se prueba aparte en `__tests__/utils/rateLimit.test.js`, forzando otro `NODE_ENV`.
- **Bootstrap**: `node src/scripts/seed_usuario_admin.js "Nombre" usuario clave12345678 Admin.Contenido` crea el primer usuario.
- **Futuro**: migración a Microsoft Entra ID (OAuth 2.0 + OIDC) documentada como Ajuste 1 en la PTF — no bloqueante, ya que el módulo de usuarios individuales resuelve el hallazgo de fondo (cuentas genéricas). Ver Roadmap Técnico del DI.

---

## Docker — Containerización del backend

Se containeriza solo el backend (proceso Node, sirve también el frontend estático). Redis, Nginx y MongoDB Atlas quedan fuera del contenedor, igual que antes.

- **`Dockerfile`** (raíz del proyecto, no `backend/`): multi-stage — etapa `deps` (`npm ci --omit=dev`) + etapa `runtime` (`node:22-slim`, usuario `node` non-root, `HEALTHCHECK` contra `/api/health`).
- **`.dockerignore`**: excluye secretos, `node_modules`, contenido dinámico (fotos/JSON publicados) y documentos institucionales grandes/privados — reduce tamaño de imagen y no expone `Documentos gobernacion/` dentro del contenedor.
- **`docker-compose.yml`**: 5 volúmenes nombrados para lo que el backend escribe en tiempo de ejecución — `jpl_fotos`, `jpl_data`, `gc_fotos`, `gc_data`, `backend_logs`. **Primer despliegue**: hay que copiar el contenido actual de esas carpetas al volumen (`docker compose cp`), incluyendo archivos estáticos que viven en la misma carpeta que el contenido dinámico (ej. `municipios.json` en `jovenes_pa_lante/data/`) — el volumen arranca vacío, no hereda nada de la imagen. Rotación de logs vía driver `json-file` (`max-size: 10m`, `max-file: 5`).
- **`azure-pipelines.yml`**: nueva stage `BuildImage` entre CI y los despliegues — build de la imagen, escaneo de vulnerabilidades con Trivy (falla en Alta/Crítica), push al registry. `DeployDev`/`DeployProd` pasaron de `git pull && pm2 restart` por SSH a `docker compose pull && docker compose up -d`.
- **Registry de imágenes**: placeholder `<acr-name>.azurecr.io/antioquia-natural`, a confirmar con TI Gobernación (mismo tratamiento que el resto del pipeline, listo pero bloqueado por credenciales institucionales).
- **Rollback**: ahora es cambiar `IMAGE_TAG` al tag anterior + `docker compose up -d` — más simple que el procedimiento previo (`git checkout` + `npm install` + reinicio).
- **Desarrollo local no cambia**: `npm run dev` en `localhost:3000` sigue siendo el flujo de trabajo diario; Docker reemplaza el despliegue documentado en QA/Producción, no el desarrollo.
- Detalle completo del procedimiento (pre-requisitos, despliegue, subir/bajar, rollback, monitoreo) en el Manual Técnico del DI (`Documentos gobernacion/TI/REVISION 3/Documento Integral de Desarrollo Tecnico de la Aplicacion.docx`, numeral 10) y en `README.md` § Despliegue en producción.

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

El estado IUCN vive como **badge** en la ficha de especie (`App.iucnStatusBadge(sp.iucn)` en `app.js`), no como tarjeta dedicada — la antigua sección "Estado de conservación" (`.iucn-card`) se eliminó para no duplicar la misma información dos veces en la misma pantalla.

---

## Sistema de etiquetas (badges) en especie.html

`biodiversidad/especie.html` muestra hasta 5 badges de atributo bajo el nombre científico: IUCN, especie sombrilla, endémica, dieta y actividad.

### Flag de activación — `BADGE_TAGS` (`biodiversidad/js/especie.js`)

```js
const BADGE_TAGS = { umbrella: true, endemica: true, dieta: true, actividad: true };
```

No hay UI de administración para esto — es un interruptor a nivel de código. Para desactivar un tipo de badge en toda la app (por ejemplo, si falta cobertura de datos), basta con poner su valor en `false` aquí; el badge de IUCN no está en este flag porque siempre se muestra.

### Guard `isUnidentified(sp)` — protege el badge "Endémica"

Antes de mostrar el badge de endémica, `especie.js` verifica que el organismo esté identificado a nivel de especie (no género/familia), usando regex sobre `scientificName`:

```js
/\bsp\.\s*\d*$/i     // "Genus sp." o "Genus sp. 3"
/\bindet\.?\b/i       // "Familia indet."
/^cf\.\s/i            // "cf. Especie" (identificación tentativa)
```

Esto aplica a todos los grupos taxonómicos (incluye hongos y árboles nativos, no solo fauna) — nunca se debe declarar endémica una especie que en realidad no está identificada a ese nivel, sin importar lo que diga el campo `endemica` en `species.json`.

### Convención visual: chip interactivo vs. tag informativo

Auditoría de agosto 2026: 33 clases con forma de píldora en 22 pantallas, de las cuales solo 5 eran realmente interactivas — el resto confundía al usuario haciéndolo pensar que podía tocarlas. Regla adoptada en toda la app (`biodiversidad/`, `agua/`, `comunidad/`):

| | Interactivo (`<a>`/`<button>` con acción real) | Informativo (`<span>`/`<div>`, solo texto) |
|---|---|---|
| Radio | `var(--radius-full)` — píldora completa | `var(--radius-sm)` (8px) — rectángulo suave |
| Relleno | Borde + sólido/blanco + sombra | Tinte plano, sin sombra |
| Ejemplo | `.subregion-about__sitio--link`, `.stat-chip--link` | `.badge-attr`, `.badge-iucn`, `.cuenca-badge` |

**Excepción:** badges superpuestos directo sobre una foto (ej. `.photo-card__iucn-overlay` en las galerías JPL) mantienen relleno sólido por legibilidad — solo cambia el radio.

Los tintes de fondo/texto de los badges informativos se generan con `color-mix()` a partir de un solo color base, en vez de elegir a mano cada variante:

```css
.badge-attr--iucn-lc {
  background: color-mix(in srgb, var(--iucn-lc) 18%, white);
  color: color-mix(in srgb, var(--iucn-lc) 65%, black);
}
```

---

## CSS — el atributo `hidden` necesita un guard explícito

> **Regla:** cualquier elemento que se oculte/muestre con el atributo HTML `hidden` (no con una clase) necesita una regla `.mi-clase[hidden] { display: none; }` explícita en el CSS **si esa misma clase también fija `display` por su cuenta** (`display: flex`, `display: block`, etc).

**Por qué:** el navegador oculta `[hidden]` por defecto, pero esa regla vive en su propia hoja de estilos de *usuario-agente* (la de más baja prioridad en la cascada). Si una clase de autor (la tuya) también declara `display` para ese mismo elemento, **la regla de autor gana siempre**, sin importar la especificidad ni el atributo `hidden` — el elemento se queda visible.

**Incidente real (2026-08-02):** `.view-switcher__btn { display: flex; }` en `components.css` hacía que `#reel-view-btn` (con atributo `hidden`) quedara visible y clickeable en `listado.html` incluso en modo subregión+grupo, donde debía estar oculto — al tocarlo se abría un carrete vacío. Mismo patrón exacto en `.subregion-about__municipios-list`, que aparecía expandida desde el primer render aunque el JS arrancara con `_municipiosOpen = false`. Se corrigió agregando `.view-switcher__btn[hidden] { display: none; }` y `.subregion-about__municipios-list[hidden] { display: none; }` justo debajo de cada regla base.

**Antes de dar por buena cualquier clase nueva que combine `display` + toggle por `hidden`**, agregar el guard `[hidden]` en el mismo lugar donde se define `display`, no como una ocurrencia tardía.

### Overlays/lightbox: reset defensivo en `pageshow`

Los overlays de pantalla completa que se abren con `overlay.hidden = false` (carrete de `listado.js`/`subregion.js`, lightbox de `especie.js`) escuchan también `window.addEventListener('pageshow', e => { if (e.persisted) ... })` para forzar el cierre si el navegador restaura la página desde el *back-forward cache* (gesto de "atrás") con el overlay tal como quedó abierto, sin volver a ejecutar el JS. Aplicar el mismo patrón a cualquier overlay/modal nuevo de pantalla completa que se agregue más adelante.

---

## Guía de imágenes de especies

Estructura: `biodiversidad/img/species/<grupo>/<familia>/<spXXX_slug>/<slug>_001.webp`

- Formato obligatorio: **WebP** — el script `optimize_photos.js` convierte cualquier JPG/PNG
- Primera foto (`_001.webp`) = foto principal (aparece en tarjetas del listado)
- Resolución: máx 1200 px en el lado mayor, `fit: inside`, quality 82
- Los uploads del panel admin se convierten automáticamente en el servidor (sharp)

---

## Módulo Agua — Cuencas Hídricas

`agua/mapa.html` muestra las cuencas hidrográficas principales de Antioquia (18 ríos) en un solo mapa Leaflet, con su área de drenaje y el trazado del río, coloreadas por zona hidrográfica. `agua/acueductos.html` es un módulo aparte (cuencas que abastecen acueductos municipales, no confundir con el de cuencas hidrográficas).

### Clasificación oficial (Decreto 1640 de 2012, IDEAM)

Colombia clasifica sus cuencas en **6 niveles jerárquicos**, cada uno anidado dentro del anterior:

| Nivel | Nombre | Qué es | Ejemplo |
|---|---|---|---|
| 1 | Área hidrográfica | La gran vertiente continental | Antioquia: Magdalena-Cauca (mayoría) y Caribe (Urabá) |
| 2 | Zona hidrográfica | Agrupa cuencas de relieve/drenaje similar | Cauca, Nechí, Medio Magdalena, Atrato-Darién, Caribe-Urabá |
| 3 | Subzona hidrográfica | La cuenca de un río principal | Río Porce, Río Cauca — **nivel que muestra el mapa** |
| 4-6 | Nivel I / II / III | Subdivisiones cada vez más finas | Afluentes y quebradas — no disponible aún (ver abajo) |

Los niveles 1 y 2 no son cuencas adicionales — son categorías que agrupan las de nivel 3. Cada río en el mapa ya muestra sus 3 primeros niveles como badges en el panel de información.

**Por qué se queda en nivel 3**: los niveles 4-6 requieren el detalle de las Corporaciones Autónomas Regionales (CORANTIOQUIA/CORNARE/CORPOURABA), pendiente de autorización — ver `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

### Por qué estos 18 ríos

**No es un ranking objetivo único** — es una selección curada que mezcla continuidad con la lista previa del módulo, área real medida (donde la fuente lo permitió, 15 de 18) y reconocimiento regional (los otros 3: Cocorná, Grande, Guatapé, sin área medible en esta fuente). Detalle completo, con el ranking por tamaño y la respuesta sugerida si preguntan "¿por qué estos y no otros?", en `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

### Datos y regeneración

`generate_cuencas_agua.py` (raíz del proyecto) genera `agua/data/cuencas.json` y `agua/data/antioquia_boundary.json` desde fuentes públicas (GADM + webmap nacional de IDEAM). Detalle completo de fuentes, licencias pendientes y cómo actualizar en `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

### Zona de tap ampliada en el mapa de cuencas

Cada río visible en `agua/mapa.js` tiene una segunda polyline invisible superpuesta (`weight: 22, opacity: 0.02`, mismo trazado y mismo handler de click) para que el área tocable sea mucho más ancha que la línea dibujada — sin esto, tocar un río en un teléfono real requería hacer zoom para acertar el trazo delgado. Se guarda como `entry.lineaHit`/`entry.lineaFueraHit` junto a las líneas visibles y se sincroniza con ellas en `updateVisibility()`.

### Panel de información: toque en el área vs. toque en la línea

Un mismo río se puede tocar en dos lugares distintos del mapa (su polígono de drenaje o su trazado), y `openSheet(cuenca, tipoToque)` en `agua/mapa.js` muestra contenido distinto según cuál fue: longitud aprox. si `tipoToque === 'linea'`, área en km² si `tipoToque === 'area'`. Para que quede claro cuál de los dos se está viendo, el título antepone **"Área del"** al nombre del río solo en el caso de área (`"Área del Río Sucio"`) — nunca como una etiqueta/kicker aparte, y nunca en mayúsculas sostenidas (ver regla de estilo arriba).

---

## Ecosistemas Estratégicos (`agua/ecosistemas.html`)

7 ecosistemas de Antioquia (páramo, bosque tropical, bosque seco tropical, humedales, manglares, playas y mar, cavernas y cuevas), con contenido tomado de la bibliografía educativa "Antioquia Viva 2025" (SIDAP/Gobernación).

- **`agua/data/ecosistemas.json`** — cada ecosistema tiene `id`, nombre/descripción/amenazas/por-qué-estratégico bilingües, `fotos[]` y `sitiosRepresentativos[]` (22 sitios reales en total: parques nacionales, páramos, manglares, cañones… cada uno con `id` slug único, `lat`/`lng`, `nombre`, `municipio`, `subregion`).
- **`agua/ecosistema.html`** — ficha de un ecosistema: descripción, galería (mismo patrón crossfade+dots+swipe+contador que `especie.js`), y sus sitios representativos como tarjetas tocables (`.species-card`, reusa el CSS de `biodiversidad/css/especie.css` que ya importa esta página).
- **`agua/ecosistemas_mapa.html`** — mapa Leaflet con un marcador por sitio representativo (ícono circular de color por tipo de ecosistema + emoji), popup con nombre/municipio/subregión y enlace a la ficha del ecosistema.

### Deep-link `?foco=<id>` — centrar el mapa en un sitio específico

`ecosistemas_mapa.js` lee `?foco=<siteId>` de la URL; si coincide con el `id` de algún sitio, centra el mapa ahí (`map.setView(…, 11)`) y abre su popup automáticamente al terminar el movimiento (`map.once('moveend', …)`). Dos pantallas enlazan a este mecanismo en vez de tener su propio mini-mapa:

- `biodiversidad/subregion.html` → sección "sobre esta subregión", sitios destacados con `ecoSiteId`
- `agua/ecosistema.html` → lista de sitios representativos del propio ecosistema

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

**Ampliado desde entonces (2026-08-06):** el paso 7 ahora es una stage `BuildImage` dedicada (build de la imagen Docker + escaneo de vulnerabilidades con Trivy, falla en Alta/Crítica) seguida de `DeployDev`/`DeployProd` vía `docker compose pull && up -d` — ver "Docker — Containerización del backend".

> **Pendiente de activar:** requiere acceso al proyecto Azure DevOps de TI Gobernación. `azure-pipelines.yml` está listo; solo necesita las Service Connections configuradas por TI.

### Verificación manual completa (2026-07-13)

Los 7 pasos del pipeline se ejecutaron localmente por primera vez (el pipeline real sigue sin correr en ningún lado, a la espera de Azure DevOps), para confirmar que de verdad pasarían el día que TI active el proyecto. Antes de esta verificación, varias piezas estaban configuradas pero nunca probadas contra el código real.

**Suite de tests (`backend/src/__tests__/`)**: pasó de 2 archivos/9 casos (solo login/logout/me del admin) a **8 archivos/51 casos**, cubriendo el CRUD real de JPL y Guarda Cuencas (crear, editar, eliminar, listar), `/autofill` (mockeando la API de iNaturalist), las agregaciones de `/jpl/stats/*`, la publicación (`/jpl/publicar/:mes`, `/gc/publicar/:mes`) y el middleware `requestLogger` (antes en 0%). Cobertura real: de 16.79% a **96.81% líneas / 91.93% funciones**, por encima del umbral del 90% ya configurado (que nunca se había cumplido).

**`npm audit`**: 3 vulnerabilidades resueltas con `npm audit fix` (sin `--force`, sin cambios de versión mayor): `multer` 2.1.1 → 2.2.0, `form-data` 4.0.5 → 4.0.6, `js-yaml` (transitivo de las herramientas de cobertura) 3.14.2 → 3.15.0. Quedó en 0 vulnerabilidades.

**Semgrep**: instalado localmente (`pip3 install semgrep`) y corrido por primera vez contra el código real. Encontró 58 hallazgos iniciales:
- Cookie de sesión (`src/index.js`): se agregó `httpOnly: true` explícito (ya era el default de `express-session`, pero no conviene depender de eso) y un nombre custom (`antioquia.sid` en vez de `connect.sid`, que delata la librería). `secure`/`domain`/`path`/`expires` ya estaban bien manejados, solo se documentó con `nosemgrep` por qué (Semgrep no reconoce valores condicionales por `NODE_ENV` ni los defaults seguros de la librería).
- Path traversal en Guarda Cuencas (2 lugares en `admin.js`): documentado con `nosemgrep`, la ruta siempre la genera el servidor (`saveGcFile()`), nunca viene de input directo.
- Detalle de error expuesto en `/autofill`: documentado con `nosemgrep`, la ruta está detrás de `requireAdmin` y el detalle ayuda a diagnosticar fallas de la API pública de iNaturalist.
- **Regla local `req-body-without-validation` eliminada de `.semgrep.yml`**: estaba mal escrita desde que se creó (26 jun 2026, junto con el resto de A3) y nunca se había ejecutado hasta ahora. Su intención era detectar `req.body.campo` sin validar, pero su patrón (`pattern-not-inside: if (...) { ... }`) no reconoce la guarda de entrada estándar de Express (`if (!req.body.campo) return res.status(400)...`), así que marcaba el 100% de los accesos a `req.body`, estuvieran validados o no. Se comprobó con un caso mínimo antes de quitarla. Las otras 3 reglas locales sí funcionan y se mantienen.
- Como consecuencia de esa regla, se agregó validación real (no solo para satisfacer Semgrep): `backend/src/config/catalogo.js` centraliza `GRUPOS_VALIDOS`/`SUBREGIONES_VALIDAS`/`IUCN_VALIDOS`, usados tanto en validación explícita (400 con mensaje claro) en las rutas de `admin.js` como en `enum` de los esquemas `JplPhoto`/`GcPhoto`.

Resultado final: **0 hallazgos de Semgrep**, `npm audit` limpio, lint sin errores, cobertura por encima del umbral. Los 7 pasos del pipeline pasarían hoy si Azure DevOps se activara.

---

## Netlify — Configuración de despliegue

El frontend estático se despliega en Netlify desde la rama `main`. El backend Node.js corre en el servidor de la Gobernación y **no** pasa por Netlify.

**Limpieza de repositorio (2026-08-06):** `main` tenía ~550 MB de material de referencia/respaldo trackeado por error (`Respaldo Fotos/` — fotos RAW y JPG sin procesar de un fotógrafo, `Manual de marca gobernacion/`, `Bibliografia/`, `Informes menusales/`) — como `netlify.toml` publica todo el repo (`publish = "."`), Netlify lo estaba sirviendo públicamente. Se dejaron de trackear (`.gitignore`) en `main` y `develop`, sin reescribir el historial existente (los archivos siguen en disco local). De paso se corrigió el *upstream tracking* de la rama local `develop`, que apuntaba mal a `origin/main` en vez de `origin/develop` desde antes de esta sesión.

### Sitio único — NO crear sitios nuevos

> **Hay un solo sitio de producción. Antes de correr cualquier comando `netlify` que pueda crear un sitio nuevo (`netlify init`, `netlify deploy` sin sitio vinculado, `netlify sites:create`), verificar primero con `netlify status` o `netlify sites:list` que la carpeta ya está vinculada al sitio correcto.**

| Sitio | Project ID | Propósito |
|---|---|---|
| **antioquia-biodiversa-expandida** | `050e260c-4478-4814-bfc9-f8928b8f3fcf` | **Producción real.** Único sitio con CI/CD conectado al repo de GitHub (`cevazG/antioquia-biodiversa-expandida`, rama `main`). Cada `git push` a `main` dispara un build y deploy automático — no requiere ningún paso manual en Netlify. |
| antioquia-biodiversa-demo | `f686c856-5231-489d-a76f-8c306f914114` | Demo aparte, sin conexión a GitHub (deploys manuales). No tocar salvo que se pida explícitamente. |

El vínculo local carpeta↔sitio vive en `.netlify/state.json` (en `.gitignore`, no se sube al repo — por eso cada máquina/checkout nuevo necesita re-vincularse con `netlify link --id 050e260c-4478-4814-bfc9-f8928b8f3fcf`, **nunca** con `netlify init` a menos que `netlify status` confirme que no hay ningún sitio ya conectado a este repo).

**Cómo se originó el CI/CD:** el 14 de julio de 2026 se corrió `netlify init` desde esta carpeta, que autorizó a Netlify contra GitHub (`Authorize with GitHub through app.netlify.com`) y agregó una deploy key + webhook al repo. Ese mismo día se descubrió que el sitio de producción (`antioquia-biodiversa-expandida`) **ya tenía CI/CD configurado desde antes** (deploys automáticos desde el 10 de julio), así que `netlify init` había creado sin querer un segundo sitio duplicado (`effortless-meerkat-5ea004`) con su propia deploy key/webhook redundante sobre el mismo repo. Se eliminó ese sitio duplicado (`netlify sites:delete`) y se re-vinculó la carpeta al sitio original. Moraleja: **siempre correr `netlify status` primero** — si ya existe un sitio con `repo:` apuntando a este repo, solo hace falta `netlify link --id <ese-id>`, nunca `netlify init`.

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

### Cache-buster `?v=N` — obligatorio al tocar CSS/JS

> **Regla:** cada vez que se edite el CONTENIDO de un archivo CSS o JS, hay que subir el número `?v=N` en **todos** los `<link>`/`<script>` que lo referencian, en **todas** las páginas HTML que lo cargan — no solo en la página que se estaba editando.

Por qué importa tanto: `netlify.toml` cachea `/biodiversidad/css/*.css` y `/biodiversidad/js/*.js` por **1 año** (`Cache-Control: max-age=31536000`), confiando en que el `?v=N` cambie cada vez que el contenido cambia — el navegador solo vuelve a pedir el archivo si la URL (incluyendo el query string) cambió. Si se edita `components.css` pero se deja `?v=3` en el HTML, cualquier visitante que ya haya cargado el sitio antes sigue viendo la versión vieja durante meses, sin ningún error visible ni en consola ni en Network — el archivo "carga bien", solo que es el archivo equivocado.

**Incidente real (2026-07-31):** una sesión completa de cambios a `main.css`, `components.css`, `data.js`, `biodiversidad.js`, `especie.js` y varios CSS de página (carrete/grid/mosaico, header, lightbox, Ecosistemas en Agua) se subió a producción sin tocar los `?v=N`. El bug solo se detectó porque el usuario probó el sitio real en su celular (que ya lo había visitado antes) y mandó una captura de WhatsApp: el header salía en mayúsculas sostenidas y los botones nuevos (selector de vista, "Explorar") aparecían sin ningún estilo — exactamente el aspecto que tenían *antes* de los cambios de esa sesión. En local (`localhost:3000`, sin caché previa) todo se había visto perfecto. Se corrigió subiendo el `?v=N` en las ~30 páginas reales de la app que cargan alguno de esos archivos (commit `bba7f5b`).

**Alcance de la regla:**
- `biodiversidad/css/*.css` y `biodiversidad/js/*.js` — cache de **1 año** por `netlify.toml`, es el caso más crítico.
- CSS específicos de página en `agua/`, `comunidad/`, `admin/` (ej. `index.css`, `galeria.css`) — no tienen regla explícita en `netlify.toml`, pero igual conviene versionarlos por consistencia y porque el caché por defecto del navegador/CDN no es cero.
- Verificar con `grep -rn "nombre_del_archivo" --include="*.html"` antes de dar el cambio por terminado, porque un mismo archivo compartido (`main.css`, `components.css`, `data.js`) se carga desde muchas páginas distintas, no solo la que se tocó.
- **No probar solo en local** para este tipo de cambio — `localhost:3000` no tiene el historial de caché de un navegador real que ya visitó el sitio, así que un `?v=N` desactualizado nunca se nota ahí. Hay que revisar el HTML final (`grep` del `?v=`) o probar en el sitio real con caché ya cargada.

### Privacidad Ley 1581 (`biodiversidad/index.html`)

Modal que aparece **una sola vez** en la primera visita:
- Texto completo en ES y EN (antes de elegir idioma)
- Checkbox **no pre-marcado** — el botón "Aceptar · Accept" arranca deshabilitado
- Al aceptar: `localStorage.setItem('ab_privacy_accepted', '1')` → modal no vuelve a aparecer
- Botón en `--color-green-light` (#3bbb6a) — verde del sistema de diseño oficial

---

## Ambientes — Dev / QA / Producción

Segregación de ambientes según la sección 6.1 de la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación. Estado real (2026-07-16):

| Ambiente | Frontend | Backend / Datos |
|---|---|---|
| **Desarrollo** | `localhost:3000` | `backend/.env` → BD `antioquia-biodiversa` (MongoDB Atlas). Único ambiente con datos reales hasta hoy (nombres de fotógrafos comunitarios que consintieron participar) — no hay producción separada todavía |
| **QA / Staging** | Branch deploy de Netlify en `develop` → `develop--antioquia-biodiversa-expandida.netlify.app`, se actualiza solo con `git push origin develop` | `backend/.env.qa` → BD separada `antioquia-biodiversa-qa` (mismo cluster Atlas, puerto local `3001`), poblada 100% con datos sintéticos vía `node src/scripts/seed_qa_data.js` — cero datos reales |
| **Producción** | Netlify, rama `main` (sitio `antioquia-biodiversa-expandida`) | Pendiente: servidor Ubuntu 24.04 de TI Gobernación (ver "Manual de despliegue" abajo) |

**Regenerar datos de QA:** `node backend/src/scripts/seed_qa_data.js` borra y vuelve a insertar los registros de prueba (`mes: test-2026-07`). El script aborta si `MONGODB_URI_COM` no apunta a una base terminada en `-qa`, como salvaguarda contra ejecutarlo por error sobre datos reales.

`.env.qa` está en `.gitignore` — nunca se sube al repositorio, igual que `.env`.

---

## Manual de despliegue (README.md)

Cubre todos los compromisos de documentación del § 8 de la Propuesta Técnica v2.0:

| Sección | Contenido |
|---|---|
| Prerrequisitos | Node.js 22 LTS, npm 10+, MongoDB Atlas 7.x, Redis 7.x (Docker Engine + Compose solo para despliegue) |
| Instalación local | Clonar, instalar, configurar `.env`, levantar Redis, `npm run dev` — **sin Docker**, no cambió |
| Variables de entorno | `MONGODB_URI_COM`, `SESSION_SECRET`, `REDIS_URL`, `RECAPTCHA_SITE_KEY`/`RECAPTCHA_SECRET_KEY`, `LOG_LEVEL`, `PORT` |
| Comandos | `dev`, `start`, `lint`, `lint:security`, `npm audit`, `test`, `test:coverage`, `optimize-photos` |
| Despliegue producción | Ubuntu 24.04: Docker Engine + Compose, Nginx, Certbot/SSL, Redis nativo — imagen construida/escaneada/publicada por el pipeline, servidor solo corre `docker compose pull && up -d` |
| Nginx | Config completa con proxy inverso, `X-Real-IP`, health check upstream, SSL (sigue igual, proxy al puerto 3000 del contenedor) |
| Verificación | `docker compose ps` (estado "healthy"), `docker compose logs app`, `curl /api/health` — respuesta esperada `mongodb+redis connected` |
| API REST | Tabla de endpoints con método, ruta, descripción y nivel de auth |
| Stack tecnológico | Tabla completa al día (Winston, ioredis, SAST, CI/CD) |

---

## TI Gobernación — Trámite de aval

Contrato de prestación de servicios por 18 meses (ejecución, desarrollo y mantenimiento) ya suscrito entre el contratista y la Secretaría de Ambiente. Contratistas: **Sebastián Guzmán Díaz y Alejandro López**. La ejecución sobre infraestructura institucional todavía no ha podido comenzar porque TI Gobernación no ha entregado el servidor ni activado Azure DevOps.

### Estado actual: REVISION 3

Los documentos vivos y actuales están en `Documentos gobernacion/TI/REVISION 3/` — 3 archivos `.docx` que se editan **directamente** con `python-docx` (formato preservado, verificado con `assert run.text == old_text` antes de cualquier cambio, nunca reemplazo de párrafo/celda completo):

| Documento | Plantilla |
|---|---|
| `Documento Integral de Desarrollo Tecnico de la Aplicacion.docx` | FO-M7-P8-023 |
| `Levantamiento de Requisitos de Software.docx` | FO-M7-P8-020 |
| `Propuesta tecnica y financiera de desarrollo de software.docx` | FO-M7-P8-021 |
| `Respuesta_Observaciones_Revision_Documental_Verificacion_Final_v3_Antioquia_Natural.docx` | — respuesta punto por punto a los hallazgos de REVISION 3, generado con `generate_respuesta_revision3.js` |

**Los 3 ajustes vigentes son: Entra ID, Redis, SAST.** Entra ID quedó reencuadrado como "a futuro, se evaluará la posibilidad" (no bloqueante) desde que el módulo de usuarios individuales resolvió de fondo el hallazgo de cuenta genérica — ver "Panel admin — Autenticación y usuarios".

**Hallazgos de REVISION 3 (`Observaciones_Revision_Documental_Verificacion_Final_v3.pdf`) — estado (2026-08-06): 12 de 13 resueltos.**
- ✅ Resueltos: índice de contenido del LRS (numerales 7-10), Roadmap Técnico del DI, contradicción Redis/catálogo (PTF vs. DI vs. LRS), **containerización con Docker** y sus 6 controles de hardening, wording de RQP09, 2 errores de redacción/referencia cruzada, columna "Estado" en la tabla de Stack Tecnológico de la PTF, la **Figura 1 del DI rediseñada** (Redis pasó a la caja del servidor institucional, MongoDB quedó marcado "proveedor externo", y se agregó la anotación de Entra ID como pendiente), y **autenticación** (cuenta genérica eliminada — usuarios individuales, roles, panel de gestión, reCAPTCHA; ya no aplica el formato de excepción FO-M7-P8-016 y Acceso según Funciones/Mínimo Privilegio/Revisión Mensual ya son auditables).
- ⏳ En espera de TI (1): integración con el **pipeline de CI/CD institucional** (nota formal en el DI pidiendo la plantilla a TI).

**Sobre el "Gestor de Contraseñas/Acceso de la Entidad"** (el único punto del hallazgo de autenticación que quedaba abierto): el "Manual de Lineamientos de Seguridad de la Información de la Gobernación de Antioquia" citado como fuente de ese requisito **no aparece entre los documentos que TI ha compartido formalmente** (`Documentos gobernacion/TI/DOCUMENTOS ENVIADOS POR TI/` — verificado 2026-08-06 contra los 6 archivos ahí: Guía de Arquitectura y Buenas Prácticas, Lista de Chequeo de Conformidad, Guía de Azure DevOps, Propuesta Técnica, Levantamiento de Requerimientos, y su propia revisión anterior). El único requisito de autenticación verificable en esos documentos (Guía de Arquitectura, numeral 9) es "MFA para administradores, **sugiriendo** integración con Microsoft Entra ID" — sugerencia, no obligación de un Gestor de Acceso específico — y ya está en el Roadmap Técnico. Consistente con lo que Sebastián recuerda que TI dijo verbalmente en reunión (que esa integración no era obligatoria).

Diagrama de Figura 1 regenerado con `backend/src/scripts/generate_figura1_arquitectura_general.py` (graphviz) — no existía una fuente editable para este diagrama antes de esto.

Nota menor sin cerrar del todo: la columna "Entrada" de la fila RQP09 en el LRS sigue describiendo mejor una API que un archivo estático.

**Mejoras proactivas (2026-08-06), anticipando lo que TI probablemente pida en la próxima revisión** — no son respuesta a un hallazgo formal, se adelantaron por análisis propio de la Guía de Arquitectura y la Guía de Azure DevOps:
- **MFA (TOTP) obligatorio** — a diferencia del "Gestor de Acceso" (ver arriba, ese sí depende de Entra ID), la Guía de Arquitectura exige "Implementación de MFA para administradores" como su propio punto "Obligatorio" (numeral 9), separado de la sugerencia de Entra ID — esto sí era implementable sin depender de TI, y ya quedó hecho.
- **Figura 3 del DI actualizada** — seguía mostrando PM2 después de containerizar con Docker, la misma clase de inconsistencia que ya se había corregido en la Figura 1. Regenerada con `backend/src/scripts/generate_figura3_infraestructura.py` (mismo patrón que Figura 1).
- **Rate limiting** en `/login`, `/login/mfa` y `/autofill` — ver "Panel admin — Autenticación y usuarios".
- **Nombre de repositorio para Azure Repos, ya decidido**: `antioquia-natural` (17 caracteres, kebab-case, cumple la tabla de buenas prácticas de la Guía de Azure DevOps — claro, descriptivo, sin nombres genéricos, dentro del límite de 25 caracteres). No se renombra el repositorio de GitHub actual (`cevazG/antioquia-biodiversa-expandida`) — este nombre queda listo solo para cuando se cree el repo espejo en Azure Repos.
- **`Documentos gobernacion/TI/Solicitud_Servidor_Antioquia_Natural.docx`** diligenciado con las specs reales del proyecto (Ubuntu 24.04, Docker, Node 22, MongoDB Atlas externo, Redis nativo) — listo para cuando TI pida formalizar la solicitud del servidor de producción.

Ambas están documentadas en el documento de respuesta (sección "Mejoras proactivas") y en el DI (numeral 8.1).

Detalle completo, hallazgo por hallazgo, en el propio documento de respuesta.

### Scripts de generación — cuáles siguen vigentes

`backend/src/scripts/generate_levantamiento_requisitos.js`, `generate_propuesta_ajustes.js` y `generate_documento_integral.js` (los 3 generadores originales de REVISION 1/2) están **huérfanos**: 6 de los 10 scripts de este tipo apuntan a un `OUT_DIR` (`Nuevos documentos TI/`) que ya no es donde viven los documentos reales — **no editar estos 3 documentos regenerándolos**, se pierde todo lo corregido a mano en REVISION 3. El método vigente es editar el `.docx` de REVISION 3 directamente con `python-docx` (ver ejemplos de sesiones anteriores: scripts ad-hoc en el scratchpad, no versionados).

`generate_matriz_respuesta.js` (histórico, respuesta a REVISION 2) y `generate_respuesta_revision3.js` (vigente) sí siguen el flujo normal: usan `lib/docx_helpers.js` (paquete `docx` de npm) y generan el documento desde cero — apropiado porque son documentos *nuevos* en cada revisión, no ediciones incrementales de uno ya aprobado.

**Ojo con `Documentos gobernacion/TI/Revision 2/`** (fuera de `REVISION 3/`): ahí quedan copias históricas de la ronda anterior — no se actualizan solas ni se deben confundir con los documentos vigentes.

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

### Fase 2 — Propuesta Técnica v2.2 (en curso)

> Ajustes comprometidos con la Gobernación de Antioquia. Secuencia: A1 → A2 → A3 → B1.
> Pendientes de TI Gobernación: Azure DevOps, credenciales Entra ID, servidor on-premises.
> Contrato de 18 meses ya suscrito con la Secretaría de Ambiente — ver sección "TI Gobernación — Trámite de aval" arriba.

- [x] **A1 — Winston + /api/health** — logs JSON estructurados con traceId; health reporta estado MongoDB
- [x] **A2 — Redis 7 + ioredis** — caché de catálogo con TTLs definidos (RNF02, RNF06)
- [x] **A3 — ESLint-security + Semgrep** — SAST en dos capas + pipeline CI Azure DevOps (RNF05)
- [x] **npm audit** — agregado al pipeline CI (Paso 3 del PDF); falla en CVE Alta o Crítica
- [x] **Verificación manual de los 7 pasos del pipeline (2026-07-13)**: 51 tests de integración nuevos (96.81% líneas / 91.93% funciones, cumple el umbral de 90%), 3 vulnerabilidades de dependencias resueltas, Semgrep corrido por primera vez y en 0 hallazgos (ver detalle en "SAST")
- [x] **README.md / Manual de despliegue** — prerrequisitos, instalación, Redis, Nginx, Docker Compose, variables, comandos
- [x] **Respuesta a los 26 hallazgos de TI (2026-07-29)** — portada, TOC, diagramas, Estado de Completitud, diccionario de datos en Excel, matriz de respuesta punto por punto — ver "TI Gobernación — Trámite de aval"
- [x] **Retiro de Observabilidad (Grafana) y Backup como ajustes propios (2026-07-29)** — por instrucción de TI; quedan 3 ajustes: Entra ID, Redis, SAST
- [x] **Arquitectura hexagonal** — módulos JPL, Guarda Cuencas y Auth migrados a domain/application/infrastructure/interfaces, con tests unitarios aislados por capa además de los tests HTTP existentes
- [x] **Autenticación con usuarios individuales + RBAC** (2026-08-03/06) — reemplaza la contraseña compartida (hallazgo crítico de TI); colección `Usuario`, 3 roles, panel de gestión, reCAPTCHA v2 en el login — ver "Panel admin — Autenticación y usuarios"
- [x] **Containerización con Docker** (2026-08-06) — Dockerfile multi-stage, usuario non-root, `.dockerignore`, `HEALTHCHECK`, escaneo Trivy en CI/CD; Manual Técnico del DI y `azure-pipelines.yml` reescritos — ver "Docker — Containerización del backend"
- [x] **Respuesta a los hallazgos de REVISION 3 de TI** (2026-08-06) — ver "TI Gobernación — Trámite de aval"
- [x] **MFA (TOTP) obligatorio, rate limiting y Figura 3 actualizada a Docker** (2026-08-06) — anticipado antes de que TI lo pidiera como hallazgo formal, ver "Panel admin — Autenticación y usuarios" y "TI Gobernación — Trámite de aval"
- [ ] **B1 — Microsoft Entra ID** — ya no bloqueante (usuarios individuales resuelven el hallazgo de cuenta genérica); reemplazaría express-session; requiere Client ID + Tenant ID (RNF05, RNF08)
- [ ] Integración con el pipeline de CI/CD institucional de TI Gobernación — bloqueado hasta que TI comparta su plantilla (nota formal ya enviada en el DI)
- [x] **C1 — Ley 1581** — modal de privacidad en entrada de la app, checkbox no pre-marcado, bilingüe, localStorage
- [x] **C2 — netlify.toml** — redirects para Pretty URLs, cabeceras de seguridad, cache de assets
- [x] **WCAG 2.1 AA — validación inicial** — axe-core (equivalente a WAVE) en las 19 páginas públicas, 0 hallazgos (ver DI, numeral 9.2 / Chequeo de Lineamientos). Queda como compromiso recurrente re-validar antes de cada futuro pase a producción, no una tarea pendiente de arrancar.

### Fase 3 — Contenido y producción completa
- [x] **154 especies** en el catálogo — subida desde las 80 de Fase 1
- [x] **Badges de atributo en especie.html**: sombrilla, endémica, dieta, actividad — con flag `BADGE_TAGS` y guard `isUnidentified()` (ver "Sistema de etiquetas")
- [x] **IUCN como badge** (se retiró la tarjeta grande dedicada, quedaba duplicada)
- [x] **Galería swipeable multi-foto en especie.html** — todas las fotos precargadas en el preview, no solo la primera
- [x] **Ecosistemas Estratégicos** (`agua/ecosistemas.html`) — 7 ecosistemas, 22 sitios representativos, mapa Leaflet con deep-link `?foco=`
- [x] **Contenido "sobre esta subregión"** en `biodiversidad/subregion.html` — identidad económica/cultural de "Antioquia Viva 2025", municipios, sitios destacados enlazados al mapa
- [x] **Stats interactivos** en `biodiversidad.html` y `agua/index.html` — los números (subregiones/grupos/especies, subregiones/ríos/cuencas) ahora son botones que navegan
- [x] **Auditoría y rediseño de píldoras vs. tags** — convención unificada interactivo (píldora+borde) vs. informativo (rectángulo suave+tinte) en toda la app
- [x] **Zona de tap ampliada** en el mapa de cuencas hídricas (hit-line invisible de 22px sobre cada río)
- [x] **Fix: carrete atascado en `listado.html`/`subregion.html`** — bug de cascada CSS (`[hidden]` sin guard, ver "CSS — el atributo `hidden`"), no bfcache como se sospechó al inicio; de paso se restauró el carrete filtrado por subregión+grupo (antes solo funcionaba en modo flora/fauna)
- [x] **Fix: stat "Grupos bio" desincronizado** — pasó de estar fijo en el HTML a calcularse desde `HOME_GROUPS.length`
- [x] **Fix: panel de Cuencas Hídricas** — título distingue toque en área ("Área del Río X") vs. línea (longitud); se quitó una línea de depuración que abría un panel automáticamente en cada carga de producción
- [x] **Marca de agua eliminada** del mapa de subregiones (inpainting, 3 copias del archivo)
- [ ] Ampliar a 150+ especies con fotos y descripciones bilingües *(154 alcanzadas — evaluar seguir creciendo el catálogo o cerrar esta línea)*
- [ ] Consultar Libro Rojo de Colombia para estados IUCN reales en Lepidoptera
- [ ] **Proceso de build para el frontend** — script que hashea el contenido de cada `.css`/`.js` y reescribe las referencias en los HTML, para eliminar el `?v=N` manual (ver incidente 2026-07-31 arriba). Netlify pasaría a servir una carpeta `dist/` en vez de la raíz del repo. No requiere bundler/framework — mantiene la arquitectura vanilla actual.
- [ ] Dominio oficial `.gov.co`
- [ ] PWA con modo offline (Service Workers)
- [ ] Analytics de uso
- [ ] Integración con SiB Colombia / GBIF

---

## Control de Versiones

**GitFlow adoptado (2026-08-06)**, siguiendo el estándar institucional descrito en la Guía de Azure DevOps de TI Gobernación:

| Rama | Rol |
|---|---|
| `main` | Solo código estable, ya desplegado en producción. No se trabaja directo aquí. |
| `develop` | Rama de integración — el trabajo del día a día ocurre aquí (directo o vía `feature/*`). Existía en el remoto desde antes pero llevaba 10 commits desactualizada respecto a `main`; se puso al día por fast-forward. |
| `feature/*` | Opcional, para trabajo aislado que no se quiera integrar de inmediato. |
| `hotfix/*` | Arreglo urgente sobre `main` sin esperar el ciclo normal de `develop`. |

`main` solo se actualiza (merge desde `develop`) cuando el usuario confirma explícitamente que una versión está lista para producción — mismo criterio que ya regía el flujo de trabajo ("implementar → probar en localhost → aprobar → sübelo"), solo que ahora "súbelo" aterriza primero en `develop`.


Commits en estándar **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`). Código y comentarios en **español neutro**.

---

*Proyecto desarrollado con Claude Code — Anthropic*
*Última actualización: 2026-08-06*
