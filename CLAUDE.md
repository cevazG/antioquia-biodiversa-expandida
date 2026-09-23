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

### Fondos de pantalla completa — patrón `.page-bg`

Desde septiembre 2026 cada módulo tiene una fotografía real de fondo (entregada por el diseñador, no gradiente/patrón CSS) cubriendo toda la pantalla, fija detrás del contenido que hace scroll — no solo el hero. Implementado en `biodiversidad/home.html`, `listado.html`, `index.html` (selector de idioma), `agua/index.html`, `agua/ecosistemas.html`, `comunidad/index.html`, `comunidad/especie_del_mes.html`, `comunidad/guarda_cuencas/index.html`, `comunidad/jovenes_pa_lante/index.html`.

```html
<div class="app-shell app-shell--<modulo>">
  <div class="page-bg" aria-hidden="true"></div>
  <!-- resto del contenido, con position:relative; z-index:1 -->
</div>
```

```css
.page-bg {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width);   /* 430px — misma técnica que .bottom-bar */
  height: 100dvh;
  z-index: 0;
  pointer-events: none;
  background: url("img/fondos/fondo-xxx.webp") center / cover no-repeat;
}
```

**Por qué no `background-attachment: fixed` directo en `.app-shell`:** esa propiedad se posiciona contra el viewport completo, no contra el elemento — en una ventana de escritorio ancha la imagen se escala contra el ancho total de la ventana en vez de los 430px de la columna de la app, y el resultado es un zoom exagerado que recorta casi toda la foto (se detectó así: en una ventana ancha solo se veía la nariz de un oso de la ilustración). El `.page-bg` fijo + centrado + `max-width` evita ese problema en cualquier ancho de ventana.

Imágenes en `<módulo>/img/fondos/*.webp` (JPG del diseñador convertidos con `cwebp -q 82..85`; fuente original en `Diseño/Exportados APP/fondos/`):

| Módulo | Archivo |
|---|---|
| Biodiversidad (home, listado, selector de idioma) | `biodiversidad/img/fondos/fondo-biodiversidad.webp` |
| Panel "Explorar" de `biodiversidad.html` | `biodiversidad/img/fondos/fondo-biodiversidad-2.webp` |
| Agua + Ecosistemas | `agua/img/fondos/fondo-agua.webp` |
| Comunidad (landing) | `comunidad/img/fondos/fondo-comunidad.webp` |
| Especie del Mes | `comunidad/img/fondos/fondo-especie-del-mes.webp` |
| Guarda Cuencas | `comunidad/guarda_cuencas/img/fondos/fondo-guardacuencas.webp` |
| Jóvenes pa' Lante (landing + contexto de galería) | `comunidad/jovenes_pa_lante/img/fondos/fondo-jpl.webp` |

**Cualquier elemento opaco (tarjetas blancas, barras de filtro sticky) debe declarar su propio `background`** — si no, queda transparente y deja ver la foto detrás donde no corresponde.

**`<link rel="preload" as="image">` obligatorio en el `<head>`, antes del CSS de la página.** Un `background-image` en CSS se descubre tarde (el navegador no lo pide hasta terminar de parsear el CSSOM), así que sin preload se ve primero el color sólido de respaldo de `.app-shell--<modulo>` y la foto aparece después, de golpe — más notorio en la primera visita sin caché. El preload adelanta la descarga de la foto al mismo momento que el CSS/JS, en paralelo. Cada una de las 9 pantallas con `.page-bg` tiene el suyo, apuntando exactamente a la imagen que usa esa página (ver tabla arriba).

**Títulos de hero: color de marca sólido, no blanco.** Al pasar de gradiente CSS a foto real, el texto blanco quedó ilegible contra las zonas claras de las fotos nuevas. Se cambió a texto de color sólido (ya no depende de que el fondo sea oscuro):

| Módulo | Color | Hex |
|---|---|---|
| Biodiversidad | Verde oscuro | `#0b5640` (`--color-green-dark`) |
| Agua / Guarda Cuencas | Azul | `#3561ab` |
| Comunidad / Jóvenes pa' Lante | Ocre (variante accesible) | `#8f4c08` (`--color-jpl-text`) — el ocre exacto de marca `#B0942B` da 2.7:1 sobre blanco, no alcanza WCAG AA |
| Especie del Mes | Púrpura | `#8b4a97` (`--color-em`) |

Mismo criterio aplicado a `.app-header__title` (la barra blanca superior — antes fija en verde oscuro sin importar el módulo) en cada CSS de página fuera de biodiversidad.

### Íconos SVG de grupos taxonómicos

Reemplazados en septiembre 2026 con el set del diseñador (`biodiversidad/img/icons/`), a color (paleta verde/menta/blanco), no monocromos con `currentColor` como los anteriores — no hace falta recolorearlos dinámicamente en los contextos donde se usan (listados, fichas, sobre fondo claro).

Reemplazados: `aves`, `anfibios_reptiles` (mapeado desde el `anfibios-reptiles.svg` del diseñador), `animales_domesticos`, `arboles_nativos`, `mamiferos`, `mariposas`, `orquideas`, `peces`, `polillas`.

**Pendientes** (no entregados en esta ronda): `anfibios.svg` (anfibios sin reptiles, uso standalone) y `hongos.svg` — quedan con el SVG viejo `currentColor`. El diseñador sí entregó un `reptiles.svg` standalone nuevo que no se usa todavía (el ícono vigente para el grupo combinado sigue siendo `anfibios_reptiles`).

Inventario completo de emojis de la app (grupos, placeholders por familia, IUCN, ecosistemas, badges de interfaz) entregado al diseñador en `Diseño/Referencias para diseñador/Antioquia_Natural_Inventario_Emojis.xlsx` — candidatos a ilustrarse como íconos propios.

### Tarjetas de grupo (`.bio-card`) — borde de color, no relleno

Rediseño de septiembre 2026: `.bio-card` pasó de relleno sólido de color (gradiente) a fondo blanco + borde grueso (4px) del color del grupo, texto oscuro — mismo mapeo de colores que antes, solo cambió de "relleno" a "borde". Afecta la cuadrícula de 10 grupos en `biodiversidad.html`.

**La cuadrícula de ecosistemas (`agua/ecosistemas.html`, `#eco-grid`) reutiliza `.bio-card` pero conserva el relleno de color original**, con texto blanco fijado explícitamente vía `#eco-grid .bio-card` — no se le aplicó el rediseño de borde.

`.bio-card__name` (el nombre del grupo, ej. "Mariposas") es siempre verde oscuro (`--color-green-dark`), independiente del color del borde de cada tarjeta — antes usaba `--color-text-dark` (gris casi negro).

### Fondos "ajustados" (segunda entrega, septiembre 2026)

El diseñador entregó una segunda versión de los fondos de Biodiversidad, Agua, Guardacuencas, Especie del Mes y Jóvenes pa' Lante en `Diseño/Exportados APP/fondos/Fondos ajustados/` (mismas dimensiones 1170×2532, mismos nombres de archivo de salida) — reemplazan directamente los `.webp` existentes, sin tocar CSS/HTML. Fondo de Comunidad (landing) y el de "Explorar" en biodiversidad.html **no se actualizaron** en esta ronda (el diseñador no entregó versión ajustada de esos dos).

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
│   │       ├── generate_figura1_ajustes_arquitectura.py ← Figura 1 de la Propuesta Técnica (graphviz), mismo patrón — ver "TI Gobernación"
│   │       └── generate_figura3_infraestructura.py      ← Figura 3 del DI (graphviz), mismo patrón
│   └── __tests__/                     ← supertest (HTTP) + tests unitarios por capa hexagonal (domain/application aislados con fakes, sin Mongoose)
├── .semgrep.yml                       ← Reglas SAST locales + apunta a p/nodejs y p/owasp-top-ten
├── azure-pipelines.yml                ← CI → BuildImage (Docker + Trivy) → DeployDev/DeployProd (docker compose)
├── netlify.toml                       ← Publish dir, redirects trailing slash, security headers, cache
│
├── biodiversidad/                     ← Módulo principal
│   ├── index.html                     ← Selección de idioma (entrada a la app) → feed.html
│   ├── feed.html                      ← Feed unificado (pantalla de entrada tras elegir idioma): catálogo + JPL + Guarda Cuencas, 3 vistas, filtro de fuente
│   ├── home.html                      ← Selección de módulo (Bio / Agua / Comunidad) — pantalla secundaria, enlazada desde el feed
│   ├── biodiversidad.html             ← Landing bio: buscar por subregión o especie
│   ├── mapa.html                      ← Mapa SVG interactivo — toca subregión → navega directo
│   ├── subregion.html                 ← Grupos de biodiversidad por subregión
│   ├── listado.html                   ← Acordeón familia → especie + buscador
│   ├── especie.html                   ← Ficha: galería, IUCN, distribución, descripción
│   ├── css/
│   │   ├── main.css                   ← Variables globales, tipografía, reset
│   │   ├── components.css             ← Componentes UI reutilizables (incluye el sistema de 3 vistas)
│   │   ├── animations.css             ← Transiciones y animaciones
│   │   ├── especie.css                ← Galería con slides, dots, contador (z-index:10), swipe
│   │   ├── feed.css                   ← Feed: filtro de fuente, badge de origen, modal (copiado de galeria.css JPL)
│   │   └── …                         ← biodiversidad/home/index/listado/mapa/subregion.css
│   ├── js/
│   │   ├── i18n.js                    ← Sistema de traducción ES/EN
│   │   ├── feed-data.js               ← FeedStore: fusiona en runtime catálogo + JPL + GC → modelo FeedItem
│   │   ├── feed.js                    ← Controlador de feed.html (3 vistas + filtro de fuente + modal)
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
│   ├── mapa.html                      ← Mapa Leaflet de cuencas hidrográficas (19 ríos)
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
    ├── consejos_fotos.html            ← Tips para mejores fotos (portado de Ampliación JPL)
    ├── data/especie_mes.json
    ├── jovenes_pa_lante/              ← Programa JPL
    │   ├── index.html                 ← Landing: stats iNaturalist en vivo + acceso a galería/mapa
    │   ├── index.js                   ← Carga stats de iNaturalist (obs, spp, observadores) con animación
    │   ├── mapa.html                  ← Mapa Leaflet — 90 municipios beneficiados
    │   ├── galeria.html               ← Galería de fotos con filtros (grupo, subregión, versión/mes)
    │   ├── galeria.js                 ← Carousel: dots + tap + swipe; getImgs() compatibilidad foto/fotos
    │   └── data/
    │       ├── municipios.json          ← 90 municipios con coords y subregión
    │       ├── fotos_biodiversidad.json ← Índice de versiones/meses (id, titulo/mes, archivo, count) — solo "v0" activo
    │       ├── fotos_v0.json            ← Primera Versión: 17 fotos (campo foto:string — legado)
    │       └── fotos_2026_05.json       ← Mayo 2026 — datos de prueba, NUNCA estuvo en el índice, no se publica
    └── guarda_cuencas/               ← Programa Guarda Cuencas
        ├── index.html                 ← Landing con acceso a galería
        ├── galeria.html               ← Galería foto completa sin recortar (no 16:9) + archivo mensual
        └── data/
            ├── fotos_cuencas.json     ← Índice de meses (2026-06 a 2026-09, más reciente primero)
            ├── cuencas_2026_06.json   ← 8 fotos reales junio 2026 (id, foto, credito, municipio, subregion, tituloEs/En)
            ├── cuencas_2026_07.json   ← 8 fotos reales julio 2026
            ├── cuencas_2026_08.json   ← 8 fotos reales agosto 2026
            └── cuencas_2026_09.json   ← 8 fotos reales septiembre 2026
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
        └─→ biodiversidad/feed.html     Feed unificado — PANTALLA DE ENTRADA
              │                          (catálogo + JPL + Guarda Cuencas; 3 vistas; filtro de fuente)
              │                          "Inicio" en la barra inferior de toda la app apunta aquí
              ├─→ biodiversidad/home.html     Selección de módulo (secundaria, enlace "Ver todos los módulos")
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

### Feed unificado (`biodiversidad/feed.html`)

Pantalla de entrada de la app tras elegir idioma. Fusiona **en runtime** (sin build step, sin backend nuevo) las 3 colecciones de fotos y las muestra juntas:

- **`biodiversidad/js/feed-data.js` (`FeedStore`)** — `init()` llama a `DataStore.init()` y hace fetch de los índices de JPL (`../comunidad/jovenes_pa_lante/data/fotos_biodiversidad.json`) y Guarda Cuencas (`../comunidad/guarda_cuencas/data/fotos_cuencas.json`) + todos sus archivos de mes. Normaliza todo a un modelo común `FeedItem` (`source: 'catalogo'|'jpl'|'gc'`, `imgs[]`, `titleEs/En`, `sciName`, `group`, `iucn`, `subregionName`, `municipio`, `credito`, `cuenca`, `speciesId`, `link`, `dateKey`). Rutas de imagen: catálogo tal cual (`img/species/...`), JPL/GC con prefijo `../comunidad/<programa>/`. Si un fetch de comunidad falla, esa fuente se omite y el feed sigue.
- **`getItems({source,group,subregion,query})`** — filtra y ordena. Orden por defecto ("Todo"): buckets por grupo (GC → bucket `_gc`), dentro de cada bucket comunidad antes que catálogo y `dateKey` desc, luego round-robin entre buckets (misma técnica que `DataStore.getPhotoReel`) → el tope alterna grupos con las fotos ciudadanas más recientes arriba.
- **`getCommunityForSpecies(sciName)`** — usado por `especie.js` (Nivel 2): las fotos de JPL cuyo nombre científico coincide con una especie del catálogo se **anexan** al final de la galería de `especie.html`, con el crédito del participante y un badge "Jóvenes pa' Lante". El cruce normaliza el nombre (minúsculas, quita `sp.`/`cf.`/`indet.`) y descarta identificaciones solo a género. GC no cruza (no tiene nombre científico). Hoy solo 1 especie cruza (`Baryphthengus martii`); es infraestructura para cuando crezcan catálogo y JPL en paralelo.
- **`biodiversidad/js/feed.js`** — controlador: 3 vistas (carrete/cuadrícula/mosaico, reutiliza `.photo-reel*`/`.photo-grid-3col*`/`.photo-masonry*` de `components.css`, misma clave `ab_photo_view` que el catálogo), filtro de fuente `.feed-sources` (persiste en `ab_feed_source`), búsqueda (solo en cuadrícula/mosaico), y un modal para las fotos de comunidad (patrón dots/swipe/contador de `galeria.js`, con fila "Ver ficha" si la especie cruza el catálogo). Las tarjetas de catálogo son `<a href="especie.html?id=…">`; las de comunidad abren el modal.
- **Badge de origen** (`.feed-badge--jpl/--gc/--catalogo`): tag informativo sobre la foto (relleno sólido, `--radius-sm`), color por módulo.
- **`.bottom-bar` "Inicio"** de todas las páginas apunta a `feed.html` (antes `home.html`); los botones "Volver" del header siguen apuntando a `home.html`.
- **Vista por defecto: cuadrícula, no carrete** (desde septiembre 2026) — `initViewSwitcher()` cae a `'grid'` si no hay preferencia guardada en `ab_photo_view`; el HTML inicial (botón activo, `hidden` de cada vista) se ajustó para coincidir y evitar parpadeo antes de que corra el JS.

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

### Grid de `galeria.html` — mismo criterio visual que el feed de biodiversidad

Rediseño de septiembre 2026: el grid pasó de recorte a cuadrado con fondo negro (`object-fit: cover` sobre `#0d1f0f`) a **fondo blanco + recorte a cuadrado tipo feed** (`object-fit: cover` sobre `var(--color-bg)`, mismo criterio que `.photo-grid-3col__item` del feed), manteniendo 2 columnas (no 3, para que quepan nombre/científico/badges/crédito debajo de cada foto — el feed de 3 columnas no tiene esa info visible). Badges de Endémica/IUCN sobre la foto y toda la info debajo se conservan igual; el modal de detalle sigue mostrando la foto completa sin recortar.

La barra de contexto ("Primera Versión" / mes activo, arriba del grid) usa como fondo `fondo-jpl.webp` en vez del gradiente dorado plano — mismo criterio de fondo fotográfico que el resto de la app.

**Logo de Jóvenes pa' Lante** reemplazado en `comunidad/jovenes_pa_lante/img/logo/logo_jovenes_pa_lante.png` (único lugar que lo usa: `index.html`) — cambió de proporción rectangular (691×389) a cuadrada (1080×1080); el CSS lo muestra a `width:190px; height:auto`, así que ahora ocupa 190×190 en vez de 190×107.

**Meses Junio y Julio 2026 eliminados** (septiembre 2026) — eran subidas de prueba durante el arranque del programa, no contenido curado: nombres tipo "sin_nombre"/"Cajas de cemento", descripciones tipo "lorem ipsum"/"no tiene aun". Se quitaron del índice (`fotos_biodiversidad.json`), se borraron `fotos_2026_06.json`/`fotos_2026_07.json` y sus fotos (`img/fotos/bio/2026-06/`, `img/fotos/bio/2026-07/`). Solo queda **"Primera Versión" (`v0`, 17 fotos)** como contenido real. La desaparición se propaga sola al feed unificado (`biodiversidad/feed.html`), que lee el mismo índice.

### Fix: emoji de respaldo (`.photo-card__placeholder`) tapaba la foto ya cargada

Bug presente en las galerías de JPL y Guarda Cuencas: el `<div class="photo-card__placeholder">` (💧 en Guarda Cuencas, el emoji de familia en JPL) es `position:absolute; inset:0` sobre la miniatura, pensado para mostrarse **solo si la foto falla al cargar** — pero le faltaba `display:none` por defecto, así que se veía siempre, encima de la foto, incluso cuando cargaba bien. Corregido en ambas: `display:none` por defecto en el CSS, y el `onerror` de la `<img>` ahora también hace `this.nextElementSibling.style.display='flex'` para mostrarlo solo en el caso real de fallo. El modal de detalle de ambas galerías ya estaba bien implementado (no tenía este bug).

### Badge de ubicación → enlace al mapa de cuencas (Guarda Cuencas)

El badge 📍 muestra la **subregión** de la foto (`foto.subregion`, uno de los 9 ids internos) — no hay dato de cuenca/río específico en esta foto (ver nota de esquema simplificado arriba). En `comunidad/guarda_cuencas/galeria.js` — tarjeta y modal — ahora es un `<a href="../../agua/subregion.html?subregion=${foto.subregion}&tipo=cuencas">`, no un `<span>` informativo; usa el deep-link que ya existía en el proyecto (mismo patrón que `biodiversidad/subregion.html`) en vez de mandar al mapa general sin filtrar. Cambió también su estilo de rectángulo suave (`--radius-sm`, tag informativo) a píldora con borde (`--radius-full` + `border`, `.badge-subregion--link`) — sigue la convención del proyecto de diferenciar visualmente lo tocable de lo puramente informativo (ver "Convención visual: chip interactivo vs. tag informativo"). El link en la tarjeta lleva `onclick="event.stopPropagation()"` porque la tarjeta entera también es clickeable (abre el modal) — sin eso, tocar el badge dispararía ambas acciones.

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

## Infográfico de ecosistemas — versión con Cavernas y Cuevas integrado (septiembre 2026)

Sebastián reemplazó `Diseño/Exportados APP/Infografico/Infografico.jpg` por una versión nueva que ya incluye "Cavernas y Cuevas" como un recuadro dentro de la misma ilustración (antes era una tarjeta HTML aparte, debajo del gráfico). Pidió quitarle la regla/escala del lado izquierdo y reubicar los enlaces táctiles.

- **Regla eliminada** con clonado de fondo (mismo criterio que la limpieza de imagen ya documentada en "Ecosistemas Estratégicos" más abajo): se detectó la caja exacta de la regla por análisis de color (x 70-165, y 120-2180 sobre 2562×2258) y se rellenó con una franja limpia de fondo tomada de una zona sin contenido (x 168-200, confirmada libre de la tarjeta "0 msnm" y de la pirámide en toda la altura) — un primer intento clonando una franja más ancha arrastró por error un fragmento de la tarjeta "0 msnm" al área de la regla; se corrigió acotando la fuente del clonado.
- **Los 6 hotspots de siempre** (`agua/ecosistemas.css`, `.eco-hotspot--*`) **se dejaron con los mismos porcentajes** que ya tenía el gráfico anterior — se verificó por análisis de color (mediana de color por fila dentro del contorno de la pirámide) que las proporciones de la nueva ilustración coinciden con las de la vieja, dentro de 1-3% de margen.
- **7° hotspot nuevo**: `.eco-hotspot--cavernas_cuevas` — a diferencia de los otros 6 (franjas de ancho completo), es un recuadro propio (`left:67%; top:36.5%; width:31%; height:15%`), medido sobre la imagen fuente por el color del borde de la tarjeta.
- **`eco-cave-card` (la tarjeta HTML separada) se eliminó** de `agua/ecosistemas.html` — quedaría duplicada con el nuevo hotspot. El CSS huérfano (`.eco-cave-card*`) también se quitó de `agua/ecosistemas.css`.
- Texto del disclaimer actualizado (ES/EN, `ecosystems_infographic_disclaimer` en `data/translations.json`): ya no dice "aparecen aparte, abajo" sino que refleja que ahora está integrado en la misma imagen.

## Fondo de Biodiversidad — reemplazo (septiembre 2026)

`biodiversidad/img/fondos/fondo-biodiversidad.webp` (un solo archivo, referenciado desde 5 páginas: `home.html`, `listado.html`, `feed.html`, `biodiversidad.html`, `index.html`) se regeneró desde `Diseño/Exportados APP/fondos/Fondo-Biodiversidad-2.jpg` (mismas dimensiones que el anterior, reemplazo directo) — no hizo falta tocar ningún HTML/CSS, solo sobrescribir el WebP.

## Galerías de Guarda Cuencas y JPL — 3 vistas + píldoras de subregión (septiembre 2026)

Sebastián pidió que ambas galerías tuvieran las mismas 3 modalidades de vista (carrete / cuadrícula / mosaico) que ya usan `biodiversidad/feed.html` y `biodiversidad.html`, conservando la vista que cada una ya tenía como una de las tres. También pidió que la selección de subregión en Guarda Cuencas usara píldoras en vez de un `<select>` — Jóvenes pa' Lante ya las tenía (se verificó explícitamente, no hizo falta tocarla en ese punto).

### Guarda Cuencas (`comunidad/guarda_cuencas/galeria.html`/`.js`/`.css`)
- La vista de lista detallada que ya existía (`#photo-list`, con foto + subregión + crédito) se conservó tal cual, ahora dentro de `<div class="photo-view" id="view-grid">` y accesible desde el botón "grid" del switcher.
- Se agregaron `#view-reel` (`.photo-reel.photo-reel--vertical`) y `#view-masonry` (`.photo-masonry`), reutilizando las clases ya compartidas en `biodiversidad/css/components.css` (no hizo falta CSS nuevo para estas dos vistas).
- El `<select id="subregion-filter">` se reemplazó por `<div class="filter-row" id="subregion-filters">`, poblado con el mismo patrón de `buildSubregionChips()`/`setSubregion()` que ya usaba `jovenes_pa_lante/galeria.js` (chip "Todas las subregiones" + una por subregión presente en el mes activo, con 📍 y nombre).
- `renderList()` (grid) se mantuvo; se agregaron `renderReel()`/`renderMasonry()` y un `renderAll()` que llama a las tres, más `initViewSwitcher()` (mismo patrón que `feed.js`: guarda la vista elegida en `localStorage`, oculta la barra de contexto y el toolbar en modo carrete).

### Jóvenes pa' Lante (`comunidad/jovenes_pa_lante/galeria.html`/`.js`/`.css`)
- Mismo tratamiento: la cuadrícula existente (`#photo-grid`) pasó a `#view-grid`; se agregaron `#view-reel`/`#view-masonry` y `renderReel()`/`renderMasonry()`/`renderAll()`/`initViewSwitcher()` análogos.
- Los filtros de grupo y subregión (`#group-filters`/`#subregion-filters`) ya eran píldoras — no se tocaron.

### Bug encontrado y corregido en ambas: `[hidden]` no ocultaba el toolbar
Al implementar `initViewSwitcher()` (que usa el atributo `hidden` para esconder `.gallery-toolbar` en modo carrete), el toolbar **no se ocultaba** — mismo bug ya documentado en "CSS — el atributo `hidden` necesita un guard explícito" más abajo: `.gallery-toolbar { display: flex; ... }` le gana en cascada al `display:none` que el navegador aplica por `[hidden]`. Se agregó `.gallery-toolbar[hidden] { display: none; }` en los `galeria.css` de ambos módulos.

---

## Íconos SVG a color (septiembre 2026) — reemplazo de emojis, entrega del diseñador

El diseñador entregó 49 íconos SVG duotono (`#104837` verde oscuro / `#4fd698` verde claro, semáforo de colores propio en los 6 de IUCN) en `Diseño/Exportados APP/Iconografía/Iconos SVG-2/`, para reemplazar los emojis documentados en `Diseño/Referencias para diseñador/Antioquia_Natural_Inventario_Emojis.xlsx` (el inventario que se le entregó en agosto). Implementados en esta sesión:

### Ya estaban sincronizados (nada que hacer)
9 de los 10 íconos de grupo taxonómico (`biodiversidad/img/icons/*.svg`) ya eran idénticos byte a byte a esta entrega — se habían integrado en una sesión anterior. Solo **Hongos** seguía con el placeholder viejo (1.3 KB) — reemplazado por el nuevo (4.5 KB).

### Placeholders de foto por familia (18 familias → 13 íconos, algunos compartidos)
`biodiversidad/img/icons/familias/<familyId>.svg` — nuevo. Reemplaza el emoji que se mostraba en vez de la foto cuando una especie de esa familia no tenía foto todavía, en 3 archivos que mantienen el mismo patrón (`FAMILY_EMOJI` se conserva como *alt*/fallback, `FAMILY_ICON`/`getSpeciesIconUrl()` es la ruta nueva):
- `biodiversidad/js/especie.js` — placeholder grande de la ficha (`#photo-emoji`) y el ícono de la píldora de familia (`.family-pill`)
- `biodiversidad/js/listado.js` — ícono del encabezado de familia en el acordeón, tarjeta de especie (grid) y tarjeta de resultado de búsqueda
- `comunidad/jovenes_pa_lante/galeria.js` — placeholder de la tarjeta de foto y del visor modal

Si una familia no tiene ícono propio (la mayoría de las 65 familias del catálogo), cae al ícono del **grupo** (`img/icons/<grupo>.svg`, ya sincronizado) — no al emoji, salvo que ni familia ni grupo resuelvan (caso extremo, no debería pasar con los 10 grupos ya completos).

**Cuidado con la especificidad CSS**: en `comunidad/jovenes_pa_lante/galeria.css` y `comunidad/guarda_cuencas/galeria.css` hay reglas tipo `.photo-card__img-wrap img { width:100%; height:100% }` que le ganan en especificidad a una clase sola (`.photo-card__placeholder-icon`) — hubo que escribir el selector como `.photo-card__img-wrap img.photo-card__placeholder-icon` para que el tamaño chico (32px) no quedara pisado por el 100%/100% pensado para la foto real. Mismo cuidado si se agrega un ícono nuevo dentro de un contenedor de foto existente.

### Íconos de héroe / módulo
- **Agua / Guarda Cuencas** (💧) → `agua/img/icons/guarda-cuencas.svg` y `comunidad/guarda_cuencas/img/icons/guarda-cuencas.svg` (copia local en cada módulo, siguiendo el patrón ya establecido de no compartir assets entre módulos) — hero de `agua/index.html`, hero circular de `comunidad/guarda_cuencas/index.html`, y placeholder de foto (tarjeta + modal) en `comunidad/guarda_cuencas/galeria.js`/`.html`.
- **Ecosistemas** (🏞️) → `agua/img/icons/ecosistemas.svg` — mode-card "Ecosistemas Estratégicos" en `agua/index.html`. *Antes* este mode-card compartía el mismo emoji 🏞️ con "Cuencas Hídricas" (ambigüedad preexistente); ahora cada uno tiene su propio ícono/emoji distinto.
- **Biodiversidad general** (🌿) → `biodiversidad/img/icons/biodiversidad-general.svg` — las 2 hojas decorativas (`.corner-leaf`) de la pantalla de idioma.
- **Privacidad** (🔒) → `biodiversidad/img/icons/privacidad.svg` — ícono del modal de tratamiento de datos (Ley 1581).

### Los 7 ecosistemas (`agua/data/ecosistemas.json`)
Se agregó el campo `iconoUrl` a cada uno de los 7 ecosistemas (`icono` con el emoji se conserva, usado todavía en el tag pequeño "🏔️ Ecosistema Estratégico" de `agua/ecosistema.html` y en el popup/marcador de `agua/ecosistemas_mapa.js`, que se dejaron en emoji por ser contextos chicos de texto+ícono). `iconoUrl` reemplaza el emoji en:
- `agua/ecosistemas.js` — las 7 tarjetas grandes de "Los 7 ecosistemas" (antes NO se veían al tamaño correcto: `.bio-card__icon` ya estaba pensado para `<img>` de 48×48, un `<span>` con emoji dentro no respeta ese tamaño — se corrigió de paso)
- `agua/ecosistema.js` — placeholder grande cuando el ecosistema no tiene fotos

### Botones "Ver en el mapa" / "Subir foto" / cámara
- `agua/img/icons/ver-en-el-mapa.svg` — card "Ver en el mapa" de `agua/ecosistemas.html`
- `comunidad/jovenes_pa_lante/img/icons/ver-en-el-mapa.svg` (copia local) — card "Mapa de Municipios" de `comunidad/jovenes_pa_lante/index.html`
- `comunidad/jovenes_pa_lante/img/icons/subir-foto.svg` — card "Fotos de Biodiversidad" (mismo módulo)
- `comunidad/img/icons/subir-foto.svg` y `comunidad/img/icons/especie-del-mes.svg` quedaron copiados pero **sin usar todavía** — ver pendientes abajo

### Pendiente / no resuelto en esta sesión

- **🚧 "Próximamente"** (banner de `comunidad/guarda_cuencas/index.html`) no tiene ícono en esta entrega — sigue en emoji, a la espera de una futura entrega del diseñador.
- **`reptiles.svg`** (un lagarto) vino de más — la app solo tiene el grupo combinado "Anfibios y Reptiles" (`anfibios-reptiles.svg`, una rana), no uno separado para reptiles. No se usó. Si en el futuro se separa el grupo en dos, este ícono ya está listo en la carpeta de origen.
- **`Especie del Mes.svg`** (trofeo con hoja) y **`Especie del Mes_1.svg`** eran casi idénticos — se trataron como exportación duplicada (mismo caso que `Ver en el mapa copia.svg`, un duplicado exacto). El trofeo se copió a `comunidad/img/icons/especie-del-mes.svg` pero **no se usó**: los dos lugares candidatos (`em-badge-mes` en `especie_del_mes.html`, `prog-card__deco` en `comunidad/index.html`) son textos-con-emoji chicos en línea, no un ícono grande independiente — convertir solo uno de los 3 `prog-card__deco` de `comunidad/index.html` (🌱 JPL, 💧 GC, 🏆 EDM) se habría visto inconsistente al lado de los otros dos que se quedan en emoji por no tener ícono de programa general todavía.
- **Badges chicos con emoji + texto** (📍 ubicación/subregión — "el más repetido de toda la app", 🏘️ municipio, 🌊 cuenca/río) — **no se tocaron**, decisión de alcance: son docenas de instancias en toda la app (feed, galerías, fichas), y en los casos donde sí se reemplazó un emoji-en-línea-con-texto (badges de grupo, tags IUCN chicos, "eco-tag") se dejaron igual por ser del mismo patrón. Si se quiere que estos badges también usen ícono en vez de emoji, es una tarea aparte — hay que decidir si vale la pena para un ícono tan chico (normalmente 14-16px al lado del texto).
- **6 íconos de IUCN** (`LC-Preocupación menor.svg`, etc.) — **no se tocaron, pendiente de decisión de diseño**. El emoji actual (🟢🟡🟠🔴🟣⚪) es un puntito chico de color al lado del texto "LC"/"NT"/etc. en `biodiversidad/js/app.js` (`iucnStatusBadge()`). Los SVG nuevos ya traen el código de 2 letras dibujado adentro del círculo (ej. el círculo verde ya dice "LC") — usarlos junto a un texto separado que también dice "LC" mostraría el código duplicado. Hace falta decidir con Sebastián si el ícono nuevo **reemplaza** el badge de texto entero (`badge-iucn`, usado en decenas de tarjetas de especie en toda la app) o si se necesita una versión sin el texto dibujado adentro.

---

## Íconos SVG — segunda tanda (septiembre 2026): resuelve varios pendientes de arriba

Sebastián pidió reemplazar los emojis de 3 pantallas más. Resultado:

- **`biodiversidad/biodiversidad.html`** (modal "¿Cómo quieres explorar?"): 📍 Por Subregión → `img/icons/ubicacion-subregion.svg` (nuevo, copiado de `Diseño/.../Ubicación - Subregión.svg`); 🌿 Flora → reutiliza `arboles_nativos.svg`; 🦜 Fauna → reutiliza `aves.svg`; 🍄 Hongos → reutiliza `hongos.svg`. Ninguno de los 4 tenía ícono genérico propio en la entrega — para Flora/Fauna, decisión explícita de Sebastián: reutilizar árbol/ave aunque se repitan visualmente con las tarjetas de esos grupos más abajo en la misma pantalla.
- **`agua/index.html`**: 🏞️ Cuencas Hídricas → `img/icons/cuenca-rio.svg` (nuevo). 🚰 Cuencas Abastecedoras → reutiliza `guarda-cuencas.svg` (mismo ícono que ya usa el hero de esta página) — no había ícono de "acueducto"/grifo en la entrega, decisión explícita de Sebastián de usar el más cercano temáticamente.
- **`comunidad/index.html`** (Programas Comunitarios) — esto resuelve el pendiente de arriba ("los dos lugares candidatos... no se usó"): 🌱 Jóvenes pa' Lante → `comunidad/img/icons/jovenes-pa-lante.svg` (copia de `arboles-nativos.svg`, tampoco había ícono de "semilla/germinar"); 💧 Guarda Cuencas → copia local de `guarda-cuencas.svg`; 🏆 Especie del Mes → **por fin se usa** `comunidad/img/icons/especie-del-mes.svg` (el trofeo con hoja que había quedado copiado sin usar).

Con esto, de los 4 pendientes de la tanda anterior solo siguen sin resolver: el 🚧 "Próximamente", los badges chicos texto+emoji (📍🏘️🌊), y los 6 íconos de estado IUCN (sigue pendiente decidir si reemplazan el badge de texto completo o no).

## Ecosistemas — fix de tamaño de ícono y halo de contraste (septiembre 2026)

Dos bugs encontrados por Sebastián en las 7 tarjetas de `agua/ecosistemas.js` (`#eco-grid .bio-card`) después de la tanda de íconos:

1. **Hueco vacío enorme en la tarjeta**: el ícono es un `<img>` de un SVG con solo `viewBox="0 0 500 500"` (sin `width`/`height` propios). La regla `#eco-grid .bio-card__icon { width:auto; height:auto; font-size:2.5rem; }` era un resabio de cuando el ícono era un emoji de texto — con `auto/auto` el navegador usa el tamaño intrínseco por defecto del SVG (mucho más grande de lo pensado), estirando toda la tarjeta. Fix: `width:64px; height:64px;` explícitos.
2. **Bosque Húmedo Tropical y Manglares ilegibles**: sus íconos usan verdes oscuros (`#005641`, `#135748`...) casi idénticos al degradado de fondo de su propia tarjeta. Primero se agregó un halo blanco translúcido (`background: rgba(255,255,255,0.3); border-radius:50%`) solo en esas 2 tarjetas — verificado con capturas antes/después (composición en PIL) que sí mejora el contraste. Sebastián después pidió extenderlo a **las 7 tarjetas por parejo** (se ve mejor así, no solo en las 2 con problema real de contraste) — `#eco-grid .bio-card__icon` quedó con el halo aplicado a todas.

## Animación de bienvenida / splash (septiembre 2026)

Video fuente: `Diseño/Exportados APP/Animación/Animación Inicio 1.mp4` (720×1280, 6s, con audio, 4 MB, 5.3 Mbps).

- **Comprimido** a `biodiversidad/video/intro.mp4` vía ffmpeg: audio eliminado (los navegadores bloquean el autoplay con audio de todas formas), H.264 CRF 32 + `preset slower`, mismo 720×1280 → **557 KB** (-88% del original). Se probaron variantes más agresivas (540×960, hasta 432 KB) pero se descartaron por ahora: la de 557 KB no pierde nitidez visible (verificado extrayendo frames) y no había necesidad de bajar más.
- **Pantalla nueva** `biodiversidad/splash.html` + `css/splash.css` + `js/splash.js`: video a pantalla completa, `autoplay muted playsinline` (obligatorio en iOS/Android), botón "Saltar", y una salvaguarda de 9s por si `ended`/`error` no disparan (nunca deja a nadie atascado).
- **Se muestra siempre** al pasar de la pantalla de idioma (`biodiversidad/index.html`, `selectLang()`) al feed — no solo la primera vez (se probó con flag en `localStorage` pero Sebastián pidió quitarlo). También accesible bajo demanda desde un botón "▶" nuevo en el header de `feed.html` (`.app-header__replay-btn`, junto al título).
- **Precarga durante la reproducción**: en el evento `canplaythrough` del video (no antes, para no competir por ancho de banda con la descarga del propio video) se hace `fetch(..., {cache:'force-cache'})` de todo el CSS/JS/JSON que necesita `feed.html`, precalentando el caché HTTP para que la transición sea instantánea. Esto incluye los 2 índices de fotos de comunidad (JPL/GC). Además, `splash.html` carga `data.js` y `feed-data.js` como `<script>` reales (no solo fetch) para poder armar el mismo `FeedStore` que usa `feed.html`, calcular exactamente qué 9 fotos van a salir primero en la cuadrícula (la vista por defecto) y precargarlas con `new Image()` — lo más pesado del feed no es el HTML/CSS/JS sino las fotos en sí.
- **El fade-out arranca 1s antes de que termine el video** (`timeupdate`, `currentTime >= duration - 1`), no en el evento `ended` — así la transición ya está en curso cuando llega el último frame, en vez de sumarse después.
- **Cross-fade video → feed**: no es posible un crossfade real entre dos documentos HTML distintos sin ayuda del navegador. Se implementó en dos capas:
  1. **Respaldo manual garantizado** (funciona en cualquier navegador): al salir de `splash.html`, el video y el botón "Saltar" se desvanecen (0.5s) hacia el verde institucional de fondo; `feed.html` detecta que viene de `splash.html` vía `document.referrer` (clase `from-splash` agregada por un `<script>` inline muy temprano en el `<head>`, antes de que cargue el CSS, para evitar flash de contenido) y arranca en opacidad 0, con fade-in (0.5s) tras un `requestAnimationFrame`. No afecta la navegación normal al feed (bottom bar, etc.), que sigue apareciendo de inmediato.
  2. **Mejora nativa donde el navegador la soporte**: `@view-transition { navigation: auto; }` declarado en `splash.css` y `feed.css` (debe estar en ambos documentos). Se intentó usar esto como mecanismo *principal* pero Sebastián reportó corte abrupto — la API es poco confiable capturando el snapshot de un `<video>` reproduciéndose en algunos navegadores. Se dejó como mejora silenciosa adicional, no como el mecanismo del que depende el efecto.

## Flash de color de fondo al entrar a un módulo (septiembre 2026)

Sebastián notó que al entrar por primera vez (caché frío) a Agua y Comunidad se alcanzaba a ver el color de fondo sólido antes de que cargara la foto. Investigando, resultó ser un bug de **toda la app, no solo esas dos pantallas**: cada `.app-shell--*` tiene un color de `background` de respaldo (visible mientras `.page-bg` con la foto termina de cargar), y esos colores databan de la época de fondos con degradado CSS — antes de que se instalaran las fotos actuales de "fondos ajustados" (casi blancas, `~rgb(242,242,242)` de promedio en las 6 revisadas). El resultado: un salto brusco de un color de marca oscuro/saturado a una foto casi blanca.

Se corrigieron los **11 módulos** con este desfase, todos a `var(--color-bg)` (`#F4F8F5`, el mismo neutro que ya usa `body` en `main.css` — no un color nuevo): `biodiversidad/css/biodiversidad.css`, `listado.css`, `home.css`, `feed.css` (`.app-shell--bio`/`--listado`/`--feed`), `agua/index.css` (`.app-shell--agua`), `agua/ecosistemas.css` (`.app-shell--eco`), y en `comunidad/`: `index.css` (`--com`), `especie_del_mes.css` y `consejos_fotos.css` (`--em`), `guarda_cuencas/index.css` (`--gc`), `jovenes_pa_lante/index.css` (`--jpl`).

## Splash: poster + prefetch del video (septiembre 2026)

Sebastián reportó que la animación de bienvenida tardaba en arrancar y se veía el fondo verde institucional bastante tiempo antes de que apareciera el video. Causa: el `<video>` partía en `opacity:0` y solo se revelaba (`is-visible`) cuando el evento `loadeddata` confirmaba que había datos del `.mp4` (557 KB) — en conexiones no instantáneas, eso deja el fondo verde visible varios cientos de ms o más.

- **Poster** (`biodiversidad/img/fondos/intro-poster.webp`, primer frame del video, WebP q35 → 100 KB): se muestra instantáneo vía el atributo `poster` del `<video>` mientras el `.mp4` completo sigue bajando — mucho más liviano que el video, así que aparece casi de inmediato.
- El `<video>` ahora **parte visible por defecto** (`opacity:1`) en vez de esperar `loadeddata` — el fade-in-desde-invisible ya no hace falta porque el poster cubre ese momento. El fade que queda es solo el de **salida** (`.is-hidden`, ver "Animación de bienvenida" arriba).
- **Prefetch del video desde la pantalla de idioma** (`biodiversidad/index.html`, `<link rel="prefetch" href="video/intro.mp4">`, no `preload` — es para la *siguiente* navegación, no le compite recursos a esta pantalla) — empieza a bajar en segundo plano mientras el usuario lee/elige idioma, antes de siquiera llegar a `splash.html`.

## Caché HTTP — por qué alternar entre pantallas se sentía lento (septiembre 2026)

Sebastián notó que navegar Inicio ↔ Bio (`feed.html` ↔ `biodiversidad.html`) se sentía lento cada vez, "como si necesitara cargar todo de nuevo". Causa real: **no había prácticamente ningún caché HTTP activo**, ni en local ni en producción.

- **Local (`backend/src/index.js`)**: `express.static()` se usaba sin `maxAge` — por defecto manda `Cache-Control: max-age=0`, forzando al navegador a revalidar (o re-descargar) cada asset en cada navegación. Se agregó `maxAge: '1h'` (parejo para todo, sin distinguir tipo de archivo — a diferencia de Netlify, en local no hace falta tanta granularidad). Durante desarrollo activo, un hard refresh (Cmd+Shift+R) sigue trayendo la versión más reciente.
- **Producción (`netlify.toml`)**: ya había cabeceras de caché largo para `biodiversidad/css`, `biodiversidad/js`, `biodiversidad/img/species` y `/data/*.json` (solo la carpeta raíz), pero **`biodiversidad/data/species.json` — el archivo más pesado y más reutilizado de toda la app, usado tanto por el feed como por Bio — no tenía ninguna cabecera explícita**. Ese era el hueco real detrás de la lentitud reportada. Se completó la cobertura:
  - CSS/JS de `agua/` y `comunidad/` → 1 año (ya usan `?v=N` cache-busting, igual que biodiversidad). El `*` de Netlify cruza `/`, así que `/comunidad/*.css` también cubre `comunidad/guarda_cuencas/*.css` y `comunidad/jovenes_pa_lante/*.css` sin necesitar una regla por submódulo.
  - JSON de datos de `biodiversidad/`, `agua/` y `comunidad/` (todos sus submódulos, mismo truco del `*`) → 1h, mismo criterio que ya regía para `/data/*.json`.
  - Imágenes/íconos de `agua/img/*`, `comunidad/img/*`, `comunidad/guarda_cuencas/img/*` → **30 días, no 1 año** — a propósito distinto del año completo que ya tenía `biodiversidad/img/species/*`, porque estos íconos/fondos se han reemplazado varias veces en esta sesión con el mismo nombre de archivo (ver "Íconos SVG" y fondos arriba); un año de caché dejaría la versión vieja pegada demasiado tiempo para quien ya la tenía cacheada.

## Contraste de texto — 3 pantallas (septiembre 2026)

Mismo patrón de bug encontrado 3 veces: texto en un color pensado para fondo oscuro/saturado, reutilizado sobre un fondo que en algún momento se volvió claro (los `fondo-*.webp` de este período son casi blancos, ~`rgb(242,241,242)` de promedio, con líneas decorativas sutiles).

- **`comunidad/especie_del_mes.html`**: `.em-badge-mes` ("Junio 2026") y `.em-chip` base (ej. "Mamíferos") tenían `color:white` sobre `rgba(255,255,255,0.16)` — invisibles sobre el fondo casi blanco de `fondo-especie-del-mes.webp`. Cambiados a fondo `--color-em-pale` sólido + texto `--color-em-dark`. Los chips de estado IUCN (`.em-chip--iucn-*`) sí tienen color de fondo propio saturado y mantienen texto blanco, pero se subió su opacidad de 0.35 a 0.75 para más contraste. De paso, el 🏆 del badge de mes se reemplazó por `img/icons/especie-del-mes.svg`.
- **`agua/index.html`** ("Red Hídrica de Antioquia..."): `.agua-hero h1`/`p` en `var(--color-agua)` (#3561ab, azul medio) se confundían con el patrón decorativo azul-grisáceo de `fondo-agua.webp` (mismo tono, aunque el contraste plano contra blanco puro daba ~5.4:1 — el problema es de matiz/textura, no solo luminancia). Cambiado a `var(--color-agua-dark)` (#1a3a6b, ~10:1 de contraste).
- **`agua/ecosistemas.css`**: mismo bug, mismo fondo compartido (`fondo-agua.webp`) — `.eco-hero h1`/`p` de `#3561ab` a `#1a3a6b`.

---

## Módulo Agua — Cuencas Hídricas

`agua/mapa.html` muestra las cuencas hidrográficas principales de Antioquia (19 ríos) en un solo mapa Leaflet, con su área de drenaje y el trazado del río, coloreadas por zona hidrográfica. `agua/acueductos.html` es un módulo aparte (cuencas que abastecen acueductos municipales, no confundir con el de cuencas hidrográficas).

**Orden de las 3 tarjetas en `agua/index.html`** (septiembre 2026, a pedido de Sebastián): Cuencas Hídricas → Ecosistemas Estratégicos → Cuencas Abastecedoras. Es solo el orden del DOM (`.agua-mode-card`), no cambia rutas ni ids.

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

### Por qué estos 19 ríos

**No es un ranking objetivo único** — es una selección curada que mezcla continuidad con la lista previa del módulo, área real medida (donde la fuente lo permitió, 16 de 19) y reconocimiento regional (los otros 3: Cocorná, Grande, Guatapé, sin área medible en esta fuente). Detalle completo, con el ranking por tamaño y la respuesta sugerida si preguntan "¿por qué estos y no otros?", en `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

**Septiembre 2026 — se agregó el Río Regla (19º río):** Sebastián notó en el mapa una zona sin cobertura al sur de Yalí (cerca de Vegachí). Investigación con Playwright (conversión exacta píxel→coordenada vía la API de Leaflet, hit-testing nativo de SVG) confirmó que el centroide de Yalí sí caía dentro del Porce, pero un punto real ~3 km al sur, sin ningún río de los 18 encima, sí era un hueco genuino. Se encontró en la fuente IDEAM una subzona hidrográfica no usada hasta entonces, "Río Regla" (SZH 2310, zona Medio Magdalena), con área real dentro de Antioquia de 2.530 km² dentro de la jurisdicción de Vegachí, Yolombó y Maceo — tamaño comparable a 6 de los 18 ríos ya existentes. Se agregó como entrada 19 en `agua/data/cuencas.json` y se replicó en `generate_cuencas_agua.py` (`GRUPOS`/`DESCRIPCIONES`) para que la regeneración futura sea reproducible.

**Los 19 ríos ya tienen trazado de línea (no solo área).** Tres ríos (Porce, San Juan de Urabá y el propio Regla) no tenían línea propia en el webmap de IDEAM — Porce porque la única línea nacional con ese nombre en realidad traza el tramo del Nechí (ver comentario en `GRUPOS`), y San Juan de Urabá/Regla porque esa fuente simplemente no los trazó. Se completaron con datos de **OpenStreetMap** (© colaboradores de OpenStreetMap, licencia ODbL — ya se cita en el pie de mapa junto a CARTO): `generate_cuencas_agua.py` tiene ahora una función `fetch_osm_line()` que consulta la API Overpass por nombre y bbox (diccionario `OSM_LINEAS`), evitando el problema de nombres de río duplicados en Colombia (ej. "San Juan" aparece más de una vez). Detalle: para el Río Regla, la línea se trazó como **"Río San Bartolomé"** — el nombre oficial completo de esa subzona en las memorias del IDEAM (Decreto 1640) es *"Río San Bartolo y otros directos al Magdalena Medio"*; "Regla" es el nombre corto usado solo en el webmap de origen (con nota "ó San Bernardo"). No se cambió el nombre público del río en la app (se mantiene "Río Regla", consistente con el resto de la fuente), pero vale la pena tenerlo presente si alguien pregunta por qué el trazado se llama distinto internamente. Ver detalle completo en `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

**Bug real encontrado y corregido de paso: la línea de Río Grande estaba mal — coincidía con la del Porce.** Sebastián notó, alternando el chip "Río Porce" con dos capturas de pantalla, que la línea visible en el mapa no cambiaba al apagarlo. Investigación con Playwright (comparación de rutas DOM/SVG antes y después del toggle, no solo visual) confirmó que el propio toggle de Porce sí funcionaba correctamente — el problema era que la línea preexistente de **Río Grande** (fuente: webmap de IDEAM, dato que ya existía antes de esta sesión) estaba a 0-110 m de distancia del trazado del Porce en todo su recorrido entre Gómez Plata y Amalfi/Anorí, es decir, prácticamente la misma línea duplicada bajo otro nombre y color idéntico (ambos "Nechí" = teal). El Río Grande real (nace cerca de Santa Rosa de Osos/Belmira, alimenta el embalse Riogrande II) está bastante más al oeste. Se re-trazó desde OpenStreetMap igual que los 3 ríos anteriores — ahora Grande y Porce se ven como líneas claramente distintas y el toggle cambia visiblemente el mapa. `Río Grande` se agregó también a `OSM_LINEAS` en `generate_cuencas_agua.py` (con comentario explicando el hallazgo), y el bucle de `SOLO_LINEA` ahora prefiere OpenStreetMap sobre el webmap de IDEAM cuando el río está en ese diccionario.

**Área aproximada para Grande, Cocorná y Guatapé (los 3 ríos sin subzona propia).** Al corregir la línea de Grande, Sebastián notó que su línea quedaba "flotando" sin color de fondo si se apagaba el área del Porce (su río anfitrión) — porque estos 3 ríos nunca tuvieron polígono de área propio (solo línea, ver "Criterio de selección" en `FUENTES_DATOS_AGUA.md`). Se investigó agregar un área aproximada con **HydroBASINS** (HydroSHEDS/WWF, nivel 8, Suramérica — mismo linaje de datos que ya cita el webmap de IDEAM como base). Los polígonos encontrados resultaron superponerse 99-100% con el área oficial del río anfitrión (Porce para Grande, Samaná Norte para Cocorná y Guatapé) — hidrológicamente correcto, porque la Subzona Hidrográfica oficial del anfitrión ya incluye a estos afluentes por definición. Sebastián pidió agregarlas de todos modos, con menos opacidad y borde punteado para diferenciarlas visualmente del área del anfitrión (`areaEsAproximada: true` en `cuencas.json`, estilo condicional en `addCuencaToMap()` de `agua/mapa.js`, y una nota de advertencia (`area_nota`/`area_notaEn`) en el panel de información explicando la superposición intencional). Reproducible vía `HYBAS_IDS` + `fetch_hybas_geometry()` en `generate_cuencas_agua.py` (lee el shapefile de HydroBASINS con `pyshp`, puro Python, sin GDAL/PROJ — mismo motivo que con la fórmula esférica de Web Mercator).

**⚠️ Esto es una solución provisional, pendiente de validar con un experto en cuencas hidrográficas de la Gobernación** — la superposición al 100% con el área del anfitrión es un dilema real (¿mostrar un área aproximada y superpuesta, o dejarlo solo con línea?), no un error de cálculo. Preguntas concretas para llevarle al experto, y el detalle completo, en la sección **"⚠️ Pendiente — validar con experto en cuencas hidrográficas de la Gobernación"** de `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

### Datos y regeneración

`generate_cuencas_agua.py` (raíz del proyecto) genera `agua/data/cuencas.json` y `agua/data/antioquia_boundary.json` desde fuentes públicas (GADM + webmap nacional de IDEAM). Detalle completo de fuentes, licencias pendientes y cómo actualizar en `Mapa/Info agua/FUENTES_DATOS_AGUA.md`.

### Zona de tap ampliada en el mapa de cuencas

Cada río visible en `agua/mapa.js` tiene una segunda polyline invisible superpuesta (`weight: 22, opacity: 0.02`, mismo trazado y mismo handler de click) para que el área tocable sea mucho más ancha que la línea dibujada — sin esto, tocar un río en un teléfono real requería hacer zoom para acertar el trazo delgado. Se guarda como `entry.lineaHit`/`entry.lineaFueraHit` junto a las líneas visibles y se sincroniza con ellas en `updateVisibility()`.

### Panel de información: toque en el área vs. toque en la línea

Un mismo río se puede tocar en dos lugares distintos del mapa (su polígono de drenaje o su trazado), y `openSheet(cuenca, tipoToque)` en `agua/mapa.js` muestra contenido distinto según cuál fue: longitud aprox. si `tipoToque === 'linea'`, área en km² si `tipoToque === 'area'`. Para que quede claro cuál de los dos se está viendo, el título antepone **"Área del"** al nombre del río solo en el caso de área (`"Área del Río Sucio"`) — nunca como una etiqueta/kicker aparte, y nunca en mayúsculas sostenidas (ver regla de estilo arriba).

### Mapas Leaflet — CARTO ahora requiere API key

CARTO cambió su política el 28 de agosto de 2026: las teselas del basemap (`basemaps.cartocdn.com/rastertiles/voyager`) sin key devuelven la marca de agua "API KEY REQUIRED" en vez del mapa real. Se agregó `?key=...` a la URL de tiles en los 5 archivos que cargan este basemap: `agua/mapa.js`, `agua/subregion.js`, `agua/acueductos.js`, `agua/ecosistemas_mapa.js`, `comunidad/jovenes_pa_lante/mapa.js`. Key gratuita (5M teselas/mes, sin aprobación ni cuenta), solicitada por Sebastián en carto.com/basemaps/apikey/.

**A futuro:** CARTO está retirando los basemaps raster (PNG) a favor de mapas vectoriales — la key resuelve el problema actual, pero eventualmente tocaría migrar a su sistema nuevo (cambio grande: MapLibre GL en vez de tiles raster de Leaflet).

---

## Ecosistemas Estratégicos (`agua/ecosistemas.html`)

7 ecosistemas de Antioquia (páramo, bosque tropical, bosque seco tropical, humedales, manglares, playas y mar, cavernas y cuevas), con contenido tomado de la bibliografía educativa "Antioquia Viva 2025" (SIDAP/Gobernación).

- **`agua/data/ecosistemas.json`** — cada ecosistema tiene `id`, nombre/descripción/amenazas/por-qué-estratégico bilingües, `fotos[]` y `sitiosRepresentativos[]` (22 sitios reales en total: parques nacionales, páramos, manglares, cañones… cada uno con `id` slug único, `lat`/`lng`, `nombre`, `municipio`, `subregion`).
- **`agua/ecosistema.html`** — ficha de un ecosistema: descripción, galería (mismo patrón crossfade+dots+swipe+contador que `especie.js`), y sus sitios representativos como tarjetas tocables (`.species-card`, reusa el CSS de `biodiversidad/css/especie.css` que ya importa esta página).
- **`agua/ecosistemas_mapa.html`** — mapa Leaflet con un marcador por sitio representativo (ícono circular de color por tipo de ecosistema + emoji), popup con nombre/municipio/subregión y enlace a la ficha del ecosistema.

### Fotos reales (septiembre 2026)

7 fotos reales de participantes cargadas en `fotos[]`: Páramo, Bosque Húmedo Tropical, Humedales, Manglares (1 c/u) y Playas y Mar (3). Cada entrada es `{ url, creditoEs, creditoEn }` — sin título ni descripción, el componente (`agua/ecosistema.js`) ya soportaba ese esquema simple desde antes. **Bosque Seco Tropical y Cavernas y Cuevas siguen sin foto** — no había ninguna en el lote entregado. Fuente: `Respaldo Fotos/Fotos App/Ecosistemas/` + `Fotos App_link.xlsx` (autor, municipio, subregión, tipo de ecosistema — sin cuenca/título/descripción, por eso el esquema se mantuvo mínimo).

### Infografía del corte transversal — imagen real + zonas táctiles medidas

El diagrama de franjas hecho en CSS (`clip-path`) se reemplazó por la ilustración del diseñador (`agua/img/ecosistemas/infografia-transversal.webp`) — la regla de escala vertical que traía la imagen se removió a nivel de píxel (relleno con textura clonada de un área limpia cercana, no un recorte que hubiera cortado la montaña). Encima de la imagen van 6 enlaces `<a>` invisibles (`.eco-hotspot`) posicionados por porcentaje — **medidos con análisis de color sobre la imagen fuente, no a ojo** — que llevan a cada ficha de ecosistema, igual que las franjas clicables de antes. Cavernas y Cuevas no tiene franja en la imagen (nunca la tuvo) — se accede solo por la tarjeta `.eco-cave-card` debajo del gráfico.

### Deep-link `?foco=<id>` — centrar el mapa en un sitio específico

`ecosistemas_mapa.js` lee `?foco=<siteId>` de la URL; si coincide con el `id` de algún sitio, centra el mapa ahí (`map.setView(…, 11)`) y abre su popup automáticamente al terminar el movimiento (`map.once('moveend', …)`). Dos pantallas enlazan a este mecanismo en vez de tener su propio mini-mapa:

- `biodiversidad/subregion.html` → sección "sobre esta subregión", sitios destacados con `ecoSiteId`
- `agua/ecosistema.html` → lista de sitios representativos del propio ecosistema

---

## Guarda Cuencas — fotos reales (septiembre 2026) y desvío del pipeline de admin

Las 32 fotos reales de `cuencas_2026_06.json` a `cuencas_2026_09.json` (ver estructura de carpetas arriba) se publicaron **directo como JSON estático**, sin pasar por el panel admin ni MongoDB — reemplazaron datos de prueba inventados que había antes (créditos falsos tipo "Juan Pérez"). Dos consecuencias a tener en cuenta:

1. **Estos 4 meses no aparecen en `admin/gc.html`** (que lista fotos desde MongoDB, no desde el JSON publicado) — no se pueden editar ni republicar desde el panel tal como están. Si un curador necesita editarlos, hay que decidir si se migran a Mongo primero o se editan el JSON a mano.
2. **Esquema simplificado, distinto al que espera el backend**: el modelo `GcPhoto` (`backend/src/models/GcPhoto.js`) y el formulario de `admin/gc.js` todavía piden `cuenca` (obligatorio) y `descripcionEs/En` — campos que **no existían en el Excel real** (`Respaldo Fotos/Fotos App/Fotos App_link.xlsx`, solo trae autor/vereda/municipio/subregión) y que no se quisieron inventar. Los 4 meses reales solo tienen `id, foto, credito, municipio, subregion, tituloEs, tituloEn`. El frontend (`galeria.js`) ya tolera la ausencia de `cuenca`/descripción (badge y párrafo se omiten si no hay dato), pero **si un futuro mes se publica desde el panel admin, va a traer esos dos campos de más** — inconsistencia conocida, no es un bug.

Mismo lote trajo el rediseño de foto completa sin recortar (`object-fit: contain`, ya no `16:9` con `cover`) — las fotos reales son mezcla de retrato y paisaje, no todas horizontales como asumía el diseño original.

---

## Especie del Mes — datos reales de iNaturalist (septiembre 2026)

`comunidad/data/especie_mes.json` tenía datos 100% de prueba (usuarios falsos tipo "María G.", `foto: null` en todas, especies genéricas sin relación con ningún dato real). Se reemplazó por completo con datos reales del proyecto de iNaturalist **["Jóvenes Palante Con El Ambiente"](https://www.inaturalist.org/projects/jovenes-palante-con-el-ambiente)** (id 269450), que reúne los avistamientos que suben los participantes del programa.

### Metodología

1. **"Especie más observada del mes"** = la especie con más observaciones ese mes dentro del proyecto (`GET /v1/observations/species_counts?project_id=269450&month=M&year=Y`, API pública de iNaturalist, sin autenticación).
2. **Regla anti-repetición, orden cronológico**: se procesan los meses de enero a junio en orden; cada mes se queda con su especie más observada que ningún mes **anterior** ya haya usado — si hay conflicto, se baja a la 2ª, 3ª... más observada de ese mes hasta encontrar una libre. (Decisión de Sebastián: cronológico enero→junio, no al revés.)
3. **Rango de meses = enero-junio 2026**: es el único período con actividad real y sustancial del proyecto (miles de observaciones/mes). De julio a septiembre 2026 (mes calendario "actual") casi no hay datos (20, 5 y 3 observaciones en total respectivamente) — no alcanza para calcular una especie "más observada" con sentido. Por eso `data.actual` en el JSON es **junio 2026** (el mes más reciente con datos suficientes), no el mes calendario real. Ver histograma completo de observaciones por mes en el chat si hace falta re-derivar esto.
4. **Fotos**: hasta 6 por especie (5 para Tití Gris, que solo tiene 6 observaciones en total ese mes y una no mostraba el animal), elegidas a mano revisando *contact sheets* (grillas de miniaturas generadas con PIL, mucho más eficiente que revisar una por una) — se prefirieron fotos nítidas, con el animal bien visible, sin marcas de agua/GPS grandes encima. Solo se usaron fotos con licencia (`license_code` presente, casi todas CC BY-NC — las "todos los derechos reservados" se descartaron).
5. **Crédito**: cada foto guarda `usuario` (nombre real si el observador lo puso público, si no su usuario de iNaturalist), `municipio` (parseado de `place_guess`), `fecha`, y un objeto `creditoINaturalist` (usuario, licencia, atribución textual, y link a la observación original) — se muestra en la app como línea "CC BY NC · iNaturalist" debajo de cada foto, enlazando a la observación.
6. **Fotos convertidas a WebP** (`cwebp -q 82 -resize 1200 0`) en `comunidad/img/especie_del_mes/`.
7. **Descripciones bilingües, curiosidad y pistas de identificación**: texto original (no copiado de Wikipedia/iNaturalist), basado en información biológica general de cada especie.

### Las 6 especies elegidas

| Mes | Especie | Grupo | IUCN |
|---|---|---|---|
| Enero | Sapo Gigante (*Rhinella horribilis*) | anfibios_reptiles | LC |
| Febrero | Zopilote Común (*Coragyps atratus*) | aves | LC |
| Marzo | Tangara Azulgrís (*Thraupis episcopus*) | aves | LC |
| Abril | Iguana Verde (*Iguana iguana*) | anfibios_reptiles | LC |
| Mayo | Canario Coronado (*Sicalis flaveola*) | aves | LC |
| Junio (**actual**) | Tití Gris (*Saguinus leucopus*) | mamiferos | **VU** |

**Tití Gris es un caso especial**: es un primate endémico de Colombia (solo existe en el valle del Magdalena y zonas de Antioquia), clasificado Vulnerable. Por eso iNaturalist aplica `geoprivacy: "obscured"` a sus observaciones — no expone el municipio exacto, solo "Antioquia". El campo `municipio` de sus 5 fotos quedó como `"Antioquia (ubicación protegida)"` y `subregiones: []`; la app muestra un texto explicativo en vez de la lista de chips vacía (`edm_subregiones_protegida` en `translations.json`).

### Cambios de esquema y frontend (antes solo "actual" tenía galería completa)

- `anteriores[]` pasó de ser un resumen (nombre + conteo de fotos como número) a tener **exactamente el mismo esquema que `actual`** (descripción, curiosidad, pistas, galería completa con créditos) — decisión de Sebastián: "galería completa en todos los meses", no solo el destacado.
- Cada entrada tiene un `slug` (`"junio-2026"`, `"mayo-2026"`...). `especie_del_mes.js` ahora lee `?mes=<slug>` de la URL para decidir qué mes mostrar (`data.actual` si no hay parámetro o no matchea); las tarjetas de "Meses anteriores" pasaron de `<div>` a `<a href="especie_del_mes.html?mes=...">`.
- `link-ficha` ("Ver ficha completa de la especie") se oculta si `especieId` es `null` — las 6 especies son nuevas, ninguna existe todavía en el catálogo principal de `biodiversidad/data/species.json`, así que antes quedaba un link muerto a `#`.
- **Visor de pantalla completa (lightbox)**: la galería no tenía forma de ampliar una foto ni verlas en carrete, a diferencia del resto de la app. Se agregó el mismo patrón de `especie.html`/`feed.html` (slides con crossfade, puntos, contador, caption, swipe) — CSS copiado tal cual a `especie_del_mes.css` (no está en el `components.css` compartido, cada página lo duplica). A diferencia de `feed.js` (que tiene una hoja de detalle intermedia + lightbox anidado, porque el feed mezcla muchas especies distintas), acá el toque en cualquier foto de la grilla abre el visor directo, ya que la página entera ya es el "detalle" de una sola especie — más simple, un solo nivel.

### Foto principal del hero (`foto_oficial`) — la misma que muestra iNaturalist en vista de especies

Sebastián pidió reemplazar el emoji del hero por la foto que se ve al entrar a [la vista de especies del proyecto](https://www.inaturalist.org/observations?project_id=269450&view=species) — es el `default_photo` de cada taxón (foto global "representativa" de la especie en iNaturalist, **no** necesariamente de un participante del proyecto).

- **5 de las 6 especies** tienen `default_photo` con licencia reutilizable (casi todas CC BY-NC) — se descargaron, convirtieron a WebP (`<slug>_hero.webp`) y se guardan en `foto_oficial` con su propio crédito (fotógrafo distinto al de la galería, porque el `default_photo` es global, no del proyecto).
- **Tití Gris es la excepción**: su `default_photo` en iNaturalist tiene `license_code: null` ("todos los derechos reservados" — visible como el ícono © en vez de CC en la propia vista de especies del proyecto) — no se podía reutilizar. Sebastián lo confirmó comparando directamente esa vista. Primero se probó con la mejor foto de la galería del propio proyecto (`titi_00.webp`), pero se reemplazó por una foto de mejor calidad: otra observación de la especie en iNaturalist (fuera del proyecto, `alexguthrie`, CC BY-NC) — `titi_hero.webp`. Queda registrado en `foto_oficial.nota` de esa entrada (`fuente: "inaturalist_otra_observacion"`).
- El carrete de pantalla completa (ver arriba) ahora es **un solo recorrido**: si hay `foto_oficial`, es la diapositiva 0, seguida de las fotos de la comunidad — tocar el hero o cualquier foto de la grilla abre el mismo visor en la posición correspondiente.
- Crédito visible debajo del nombre científico en el hero (`#hero-credito`), no solo al abrir el visor — importante porque varias licencias (CC BY-NC, CC BY-SA) exigen atribución visible, no oculta tras un toque.
- Foto ampliada un 10% adicional (148px → 163px de diámetro), a pedido de Sebastián.
- Las tarjetas de "Meses anteriores" también muestran `foto_oficial.foto` en vez del emoji (con el emoji como *fallback* si algún mes futuro no tuviera foto) — `.em-mes-card__foto`, 84px de alto, `object-fit: cover`.

### Consejos para mejores fotos (`comunidad/consejos_fotos.html`) — portado de Ampliación JPL

Sebastián ya tenía un apartado de tips fotográficos hecho para el proyecto de Ampliación de Jóvenes pa' Lante (`comunidad/Ampliacion Jovenes/participante/consejos-fotos.html` — **carpeta con `.gitignore` propio, nunca se sube a GitHub**, cotización/negociación privada con la Gobernación). Pidió reutilizar ese contenido (8 tips con carrusel horizontal, cada uno con ejemplo ❌/✅ en SVG) como una página nueva, propia de la app principal (sí versionada), enlazada desde Especie del Mes.

- **Página nueva**: `comunidad/consejos_fotos.html` + `consejos_fotos.css` — mismo patrón de header/page-bg/bottom-bar que `especie_del_mes.html` (reutiliza `app-shell--em`, mismo fondo `fondo-especie-del-mes.webp`).
- **8 tips**: enfoque, lente limpio, encuadre, zoom digital, luz, fondo simple, estabilidad, orientación — contenido y SVGs de ejemplo copiados del original, solo se recoloreó el acento de naranja/JPL (`#f28e18`) a morado/Especie del Mes (`#8b4a97`) para que combine con la página que enlaza.
- **Bilingüe completo** (`consejos_*` en `data/translations.json`, ES y EN) — el original de Ampliación JPL era solo español.
- **Acceso**: tarjeta propia "💡 Consejos para tomar mejores fotos" (`.em-tips-card`) en `especie_del_mes.html`, debajo (no dentro) de la tarjeta "¿La encontraste?" — Sebastián pidió sacarla de ahí para que no compitiera visualmente con los botones de WhatsApp/Correo.

### Pendiente / no resuelto en esta sesión

- **`contacto_whatsapp`/`contacto_email`** siguen siendo el placeholder original (`+573001234567` / `natural@antioquia.gov.co`) — no se inventó un contacto nuevo porque no hay uno real confirmado en ningún otro punto de la app. Si la Gobernación da un WhatsApp/correo real para "envía tu foto", reemplazar ahí.
- **`foto_oficial`** queda `null` en las 6 — nunca se renderiza en la UI actual (campo sin uso, ya estaba así antes de esta sesión).
- El botón de idioma (EN) traduce todo el texto propio de la página, pero `nombre`/`municipio`/`comentario` de cada foto quedan solo en español (igual que el resto del catálogo del proyecto — no se generó traducción de nombres comunes ni comentarios).

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

### Selector de idioma — texto verde, sin país, bandera UK (septiembre 2026)

Título, subtítulo, "Elige tu idioma", pie de página y las tarjetas de Español/English estaban en blanco (o vidrio translúcido `rgba(255,255,255,0.12)` + blur, pensado para el gradiente oscuro de antes) — ilegibles sobre el nuevo fondo fotográfico claro. Todo pasó a `var(--color-green-dark)` sólido; las tarjetas de idioma ahora son fondo blanco opaco + borde verde (mismo lenguaje visual que `.bio-card`), no vidrio translúcido.

De paso: se quitó el subtítulo de país bajo cada idioma (`.lang-option__native`: "Colombia · Colombia" / "United States · EE.UU", clase ahora eliminada del CSS por quedar sin uso) y la bandera de English pasó de 🇺🇸 a 🇬🇧 — no se usa la bandera específica de Inglaterra (tag sequence `🏴󠁧󠁢󠁥󠁮󠁧󠁿`) porque se renderiza mal o no aparece en varios celulares; 🇬🇧 es la opción confiable multiplataforma.

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

> **Próximo paso pendiente (2026-08-12): enviar el correo a TI Gobernación.** Los documentos de `REVISION 3/` (ver tabla abajo) ya están verificados y en 13/13 hallazgos resueltos — el correo con `Respuesta_Observaciones_Revision_Documental_Verificacion_Final_v3_Antioquia_Natural.docx` adjunto **todavía no se ha enviado**. No enviarlo sin que Sebastián lo confirme explícitamente (ver regla de autorización en la cabecera de este archivo).

### Estado actual: REVISION 3

Los documentos vivos y actuales están en `Documentos gobernacion/TI/REVISION 3/` — 3 archivos `.docx` que se editan **directamente** con `python-docx` (formato preservado, verificado con `assert run.text == old_text` antes de cualquier cambio, nunca reemplazo de párrafo/celda completo):

| Documento | Plantilla |
|---|---|
| `Documento Integral de Desarrollo Tecnico de la Aplicacion.docx` | FO-M7-P8-023 |
| `Levantamiento de Requisitos de Software.docx` | FO-M7-P8-020 |
| `Propuesta tecnica y financiera de desarrollo de software.docx` | FO-M7-P8-021 |
| `Respuesta_Observaciones_Revision_Documental_Verificacion_Final_v3_Antioquia_Natural.docx` | — respuesta punto por punto a los hallazgos de REVISION 3, generado con `generate_respuesta_revision3.js` |

**Los 3 ajustes vigentes son: Entra ID, Redis, SAST.** Entra ID quedó reencuadrado como "a futuro, se evaluará la posibilidad" (no bloqueante) desde que el módulo de usuarios individuales resolvió de fondo el hallazgo de cuenta genérica — ver "Panel admin — Autenticación y usuarios".

**Hallazgos de REVISION 3 (`Observaciones_Revision_Documental_Verificacion_Final_v3.pdf`) — estado (2026-08-12): 13 de 13 resueltos.**
- ✅ Resueltos: índice de contenido del LRS (numerales 7-10), Roadmap Técnico del DI, contradicción Redis/catálogo (PTF vs. DI vs. LRS — incluida una recurrencia de la misma contradicción encontrada y corregida el 2026-08-12 en el numeral 6.5 del DI, que había quedado sin tocar en la primera pasada), **containerización con Docker** y sus 6 controles de hardening, wording de RQP09, 2 errores de redacción/referencia cruzada, columna "Estado" en la tabla de Stack Tecnológico de la PTF, la **Figura 1 del DI rediseñada** (Redis pasó a la caja del servidor institucional, MongoDB quedó marcado "proveedor externo", y se agregó la anotación de Entra ID como pendiente), **autenticación** (cuenta genérica eliminada — usuarios individuales, roles, panel de gestión, reCAPTCHA; ya no aplica el formato de excepción FO-M7-P8-016 y Acceso según Funciones/Mínimo Privilegio/Revisión Mensual ya son auditables), y el **pipeline de CI/CD** (ver siguiente párrafo — reencuadrado 2026-08-12, ya no depende de TI).
- **Pipeline de CI/CD (reencuadrado 2026-08-12):** ante la demora de TI Gobernación en compartir su plantilla institucional (solicitud formal enviada desde REVISION 3, sin respuesta), se dejó de tratar como "en espera de TI" y se documentó en el DI (numeral 5.4) y en la Respuesta v3 que `azure-pipelines.yml` implementa la **arquitectura de línea base oficial de Microsoft para Azure Pipelines** ("CI/CD baseline architecture", learn.microsoft.com/azure/devops/pipelines/architectures/devops-pipelines-baseline-architecture) — el estándar del propio fabricante de la plataforma, no un diseño propio del contratista. Si TI comparte su plantilla en el futuro, el proyecto se alinea a ella sin costo adicional. De paso se le agregó a `azure-pipelines.yml` lo que a ese estándar le faltaba: **smoke test post-despliegue** (`curl /api/health`, hasta 60s) y **rollback automático** al último tag sano (registrado en `.last_successful_tag` en el servidor) si el smoke test falla, en las etapas `DeployDev` y `DeployProd`.
- **Auditoría de consistencia interna antes de enviar (2026-08-12):** antes de dar por cerrada la Respuesta v3, se releyeron los 6 archivos de `REVISION 3/` completos (no solo el documento de respuesta) y aparecieron 2 inconsistencias que el documento de respuesta no reportaba: (1) el numeral 6.5 del DI seguía con una frase suelta que reintroducía la contradicción Redis/catálogo ya "resuelta" en otras secciones — corregida; (2) la tabla de hallazgos [Crítico] de la Respuesta v3 decía que la Figura 3 "todavía no representa el contenedor" cuando en realidad ya lo hacía (contradecía la propia sección de Mejoras proactivas del mismo documento) — corregida. Lección para próximas rondas: verificar el contenido real de los `.docx`, no solo lo que dice el documento de respuesta sobre sí mismo.

**Corrección 2026-08-18 — el "13/13 resueltos" del 08-12 no era exacto: TI reportó 4 hallazgos Críticos aún abiertos**, todos por inconsistencias entre lo corregido en tablas/prosa y lo que quedó sin actualizar en otro lugar del mismo o de otro documento — ya corregidos:
1. **Contradicción Redis/catálogo en la Figura 1 de la PTF** (no la del DI, que ya estaba bien): la tabla de Stack Tecnológico (numeral 2.2) ya decía que Redis cachea lecturas del panel admin, pero el diagrama (`ajustes_arquitectura.png`, un PNG suelto sin fuente versionada) seguía rotulando el nodo Redis "catálogo en caché, menos de 5 ms vs. 60-120 ms". Se creó `backend/src/scripts/generate_figura1_ajustes_arquitectura.py` (mismo patrón que la Figura 1 del DI) con el rótulo corregido ("caché de lecturas del panel admin (JPL/GC)"), se regeneró el PNG y se reemplazó la imagen embebida directamente en el `.docx` (bytes del media part, sin tocar el resto del documento).
2. **MFA marcado "Pendiente" en la tabla de numeral 8.3 del DI**, mientras el numeral 8.1 ya narraba el MFA como implementado desde 2026-08-06 — la fila now dice "Implementado", con referencia cruzada a 8.1.
3. **Falta de confirmación explícita sobre el pipeline institucional**: la justificación del reencuadre (`azure-pipelines.yml` = arquitectura de línea base de Microsoft, se alinea a la plantilla de TI sin costo si aparece) solo vivía en el DI (numeral 5.4) — se agregó la misma justificación, resumida, a la PTF (numeral 2.1) y al LRS (RNF07, columna Comentarios), ambas con referencia cruzada al DI.
4. **PM2 vs. Docker inconsistente en los 3 documentos**: DI numeral 6.2 (fila Producción) y 6.4 (fila Proceso) todavía decían PM2 pese a que el numeral 10 completo ya asume contenedores — corregidas a Docker/Docker Compose. LRS numeral 3.5 y PTF numeral 3.2 no mencionaban Docker en absoluto (instalación nativa implícita) — se agregó Docker Compose al primero y un bullet nuevo de contenerización al segundo.

**Pendiente de acción humana:** los 3 `.docx` de `REVISION 3/` quedaron editados con `python-docx` (mismo método ya establecido, `assert` de texto viejo antes de cada reemplazo); los `.pdf` correspondientes **no se regeneraron** (no hay LibreOffice/soffice en esta máquina para exportar sin Word) — quedan desactualizados frente a los `.docx` hasta que alguien los reexporte a PDF desde Word antes de reenviar el paquete a TI.

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
- [x] **Pipeline de CI/CD — adoptado el estándar de Microsoft en vez de esperar a TI** (2026-08-12) — `azure-pipelines.yml` documentado como implementación de la arquitectura de línea base oficial de Azure Pipelines; se le agregó smoke test post-despliegue y rollback automático — ver "TI Gobernación — Trámite de aval"
- [ ] **B1 — Microsoft Entra ID** — ya no bloqueante (usuarios individuales resuelven el hallazgo de cuenta genérica); reemplazaría express-session; requiere Client ID + Tenant ID (RNF05, RNF08)
- [ ] Espejo del repositorio en Azure Repos y activación de las Service Connections del pipeline — bloqueado hasta que TI active el proyecto institucional en Azure DevOps (el pipeline en sí ya no depende de una plantilla de TI, ver punto anterior)
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
- [x] **Fondos fotográficos de pantalla completa** en 9 pantallas (patrón `.page-bg`, ver "Fondos de pantalla completa" arriba) — reemplazan los gradientes/patrones CSS generados de Fase 1/2
- [x] **Títulos de hero recoloreados** de blanco a color de marca sólido por módulo (verde/azul/ocre/púrpura) — se volvieron ilegibles contra las zonas claras de las fotos nuevas
- [x] **9 íconos SVG de grupos taxonómicos reemplazados** por el set a color del diseñador — pendientes `anfibios` (standalone) y `hongos`
- [x] **Rediseño de `.bio-card`**: borde de color + fondo blanco en vez de relleno sólido (cuadrícula de 10 grupos en `biodiversidad.html`)
- [x] **Infografía de ecosistemas**: imagen ilustrada real del diseñador reemplaza el diagrama CSS, con 6 zonas táctiles medidas por análisis de color (no a ojo) hacia cada ficha
- [x] **7 fotos reales en Ecosistemas** (Páramo, Bosque Húmedo Tropical, Humedales, Manglares, Playas y Mar×3) — Bosque Seco Tropical y Cavernas y Cuevas siguen sin foto
- [x] **32 fotos reales en Guarda Cuencas** (junio-septiembre 2026), reemplazando datos de prueba inventados — publicadas fuera del pipeline de admin/MongoDB, ver "Guarda Cuencas — fotos reales" arriba
- [x] **Fix: mapas Leaflet con "API KEY REQUIRED"** — CARTO exige key desde el 28 de agosto de 2026, agregada a los 5 mapas del proyecto
- [x] **Feed (`feed.html`) por defecto en cuadrícula**, no carrete
- [x] **Galería de JPL rediseñada** al criterio visual del feed (recorte a cuadrado, fondo blanco) + fondo fotográfico en la barra de contexto + logo JPL actualizado
- [x] **Inventario de emojis de la app** entregado al diseñador en Excel (`Diseño/Referencias para diseñador/Antioquia_Natural_Inventario_Emojis.xlsx`) — candidatos a ilustrarse como íconos propios
- [x] **Pantalla de idioma**: texto de blanco a verde oscuro, quita subtítulo de país, bandera de English a 🇬🇧
- [x] **`<link rel="preload" as="image">`** en las 9 pantallas con fondo fotográfico, evita el flash del color de respaldo
- [x] **JPL: meses Junio y Julio 2026 eliminados** (subidas de prueba, no contenido curado) — solo queda "Primera Versión"
- [x] **Segunda entrega de fondos "ajustados"** para Biodiversidad, Agua, Guardacuencas, Especie del Mes y JPL
- [x] **`.bio-card__name` siempre verde oscuro**, independiente del color del borde
- [x] **Fix: emoji de respaldo tapaba la foto cargada** en galerías JPL y Guarda Cuencas (faltaba `display:none` por defecto)
- [x] **Badge de ubicación → enlace a las cuencas de esa subregión** en la galería de Guarda Cuencas, con estilo de chip interactivo
- [x] **19º río agregado al mapa de cuencas: Río Regla** — hueco real detectado al sur de Yalí (cerca de Vegachí), cubierto por la subzona IDEAM "Río Regla" (SZH 2310, 2.530 km² dentro de Antioquia), ver "Por qué estos 19 ríos" arriba
- [x] **Trazado de línea agregado para Porce, San Juan de Urabá y Regla** (los 3 únicos de los 19 sin línea en el webmap de IDEAM) — completados con datos de OpenStreetMap vía Overpass API, ver nota arriba
- [x] **Fix: línea de Río Grande duplicaba la del Porce** (0-110 m de distancia en todo su recorrido, dato preexistente del webmap de IDEAM) — re-trazada desde OpenStreetMap, ver nota arriba
- [x] **Área aproximada para Grande, Cocorná y Guatapé** (antes solo tenían línea) — polígonos de HydroBASINS, renderizados con menor opacidad y borde punteado por superponerse a propósito con el área de su río anfitrión, ver nota arriba
- [x] **Especie del Mes con datos reales de iNaturalist** (enero-junio 2026) — reemplaza los datos 100% de prueba que había; 6 especies, hasta 6 fotos con crédito cada una, galería completa en todos los meses (no solo el actual), ver sección dedicada arriba
- [x] **Foto principal de Especie del Mes** (`foto_oficial`) reemplaza el emoji del hero, con visor de pantalla completa unificado (hero + galería en un solo carrete) y crédito visible — ver sección dedicada arriba
- [x] **Consejos para mejores fotos** (`comunidad/consejos_fotos.html`) — portado de Ampliación JPL, bilingüe, enlazado desde Especie del Mes en su propia tarjeta, ver sección dedicada arriba
- [x] **Headers transparentes** en `agua/index.html`, `biodiversidad/listado.html`, `biodiversidad/biodiversidad.html`, `biodiversidad/feed.html` y `comunidad/jovenes_pa_lante/index.html` — mismo fondo fotográfico que el resto de la pantalla, en vez de la barra blanca sólida que traían
- [x] **Infográfico de ecosistemas actualizado** con Cavernas y Cuevas integrado a la ilustración (antes tarjeta aparte), regla/escala eliminada por clonado de imagen, 7 hotspots — ver sección dedicada arriba
- [x] **Fondo de Biodiversidad reemplazado** (`Fondo-Biodiversidad-2.jpg`)
- [x] **Guarda Cuencas y JPL: 3 modalidades de vista** (carrete/cuadrícula/mosaico) + selector de subregión por píldoras en Guarda Cuencas — ver sección dedicada arriba
- [x] **Segunda tanda de íconos SVG**: Por Subregión/Flora/Fauna/Hongos en `biodiversidad.html`, Cuencas Hídricas/Abastecedoras en `agua/index.html`, JPL/Guarda Cuencas/Especie del Mes en `comunidad/index.html` — ver sección dedicada arriba
- [x] **Fix de ícono sobredimensionado y halo de contraste** en las 7 tarjetas de `agua/ecosistemas.html` — ver sección dedicada arriba
- [x] **Animación de bienvenida** (`biodiversidad/splash.html`) entre la pantalla de idioma y el feed, con fade in/out, botón de repetir en el feed y precarga de assets durante la reproducción — ver sección dedicada arriba
- [x] **Fix de contraste de texto** en Especie del Mes (badge de mes, chip de grupo, chips IUCN) y en los hero de `agua/index.html`/`agua/ecosistemas.html` — ver sección dedicada arriba
- [ ] Ampliar a 150+ especies con fotos y descripciones bilingües *(154 alcanzadas — evaluar seguir creciendo el catálogo o cerrar esta línea)*
- [ ] Consultar Libro Rojo de Colombia para estados IUCN reales en Lepidoptera
- [ ] **Proceso de build para el frontend** — script que hashea el contenido de cada `.css`/`.js` y reescribe las referencias en los HTML, para eliminar el `?v=N` manual (ver incidente 2026-07-31 arriba). Netlify pasaría a servir una carpeta `dist/` en vez de la raíz del repo. No requiere bundler/framework — mantiene la arquitectura vanilla actual.
- [ ] **Validar con experto en cuencas hidrográficas de la Gobernación** el área aproximada (HydroBASINS) de Grande/Cocorná/Guatapé — se superpone 99-100% con el área de su río anfitrión, ver sección dedicada en `FUENTES_DATOS_AGUA.md`
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
*Última actualización: 2026-09-23*
