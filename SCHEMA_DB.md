# Antioquia Biodiversa — Esquema de Base de Datos (MongoDB)

> Dos bases de datos en el mismo cluster Atlas. Mismas credenciales, nombres distintos.
> Última actualización: junio 2026

---

## Arquitectura: dos bases de datos

| Base de datos | Nombre en Atlas | Propósito | Volumen |
|---|---|---|---|
| **biodiversidad** | `biodiversidad` | Catálogo curatorial de especies (estático) | 150 docs |
| **comunidad** | `comunidad` | Registros de programas JPL y GC (crece mensualmente) | ~4.800 docs al final |

**Variable de entorno:** `MONGODB_URI_BIO` apunta a `biodiversidad`, `MONGODB_URI_COM` apunta a `comunidad`.

### Volumen proyectado — BD Comunidad

| Colección | Por mes | 18 meses | 48 meses (fin programa) |
|---|---|---|---|
| `jpl_photos` | 50 | 900 | ~4.000 |
| `gc_photos` | 10 | 180 | ~800 |
| `species_month` | 1 | 18 | 48 |
| Total | — | ~1.100 | ~4.850 |

---

## Colecciones — BD `biodiversidad`

### 1. `species` — Especies (colección principal)

El corazón de la base de datos. Cada documento es una especie.

```json
{
  "_id": "ObjectId generado por MongoDB",
  "legacyId": "sp001",
  "scientificName": "Amazilia tzacatl",
  "nameEs": "Colibrí de cola rufa",
  "nameEn": "Rufous-tailed Hummingbird",
  "kingdom": "fauna",
  "group": "aves",
  "familyId": "trochilidae",
  "order": "Apodiformes",
  "iucn": "LC",
  "subregions": ["valle_aburra", "oriente"],
  "altitudeMin": 0,
  "altitudeMax": 2500,
  "endemic": false,
  "descriptionEs": "Descripción larga en español...",
  "descriptionEn": "Long description in English...",
  "photos": [
    {
      "url": "aves/trochilidae/sp001_amazilia_tzacatl/amazilia_tzacatl_001.webp",
      "captionEs": "Macho",
      "captionEn": "Male",
      "author": "Nombre del fotógrafo",
      "license": "CC-BY"
    }
  ],
  "visible": true,
  "featured": false,
  "verified": false,
  "createdAt": "2026-05-28T00:00:00Z",
  "updatedAt": "2026-05-28T00:00:00Z"
}
```

**Campos nuevos respecto al JSON actual:**

| Campo | Para qué sirve |
|---|---|
| `legacyId` | Mantiene el ID original (sp001) durante la migración |
| `order` | Orden taxonómico (ej. Apodiformes, Anura) |
| `altitudeMin / Max` | Rango altitudinal en metros |
| `endemic` | Si es endémica de Antioquia o Colombia |
| `photos.author` | Crédito fotográfico |
| `photos.license` | Licencia de uso de la foto |
| `visible` | Controla si aparece en la app (útil para ocultar sin borrar) |
| `featured` | Marca especies destacadas para la portada |
| `verified` | Si un biólogo revisó y aprobó el registro |
| `kingdom` | `"flora"` o `"fauna"` — heredado del grupo, permite filtrar sin consultar la colección groups |
| `createdAt / updatedAt` | Control de cambios |

---

### 2. `families` — Familias taxonómicas

```json
{
  "_id": "ObjectId",
  "id": "trochilidae",
  "group": "aves",
  "order": "Apodiformes",
  "nameEs": "Colibríes",
  "nameEn": "Hummingbirds",
  "descriptionEs": "Descripción de la familia...",
  "descriptionEn": "Family description...",
  "createdAt": "2026-05-28T00:00:00Z",
  "updatedAt": "2026-05-28T00:00:00Z"
}
```

---

### 3. `groups` — Grupos de biodiversidad

Los 9 grupos actuales.

```json
{
  "_id": "ObjectId",
  "id": "aves",
  "kingdom": "fauna",
  "nameEs": "Aves",
  "nameEn": "Birds",
  "emoji": "🦜",
  "colorHex": "#018d38",
  "iconPath": "img/icons/aves.svg",
  "order": 1
}
```

---

### 4. `subregions` — Las 9 subregiones

Incluye los datos hídricos del módulo Agua.

```json
{
  "_id": "ObjectId",
  "id": "valle_aburra",
  "nameEs": "Valle de Aburrá",
  "nameEn": "Aburrá Valley",
  "lat": 6.25,
  "lng": -75.57,
  "zoom": 11,
  "rivers": [
    "Río Medellín (Aburrá-Porce)",
    "Río Piedras",
    "Río Aurrá"
  ],
  "watersheds": [
    {
      "nombre": "La Fé",
      "municipios": ["El Retiro", "La Ceja"],
      "caudal_m3s": 4.2
    },
    {
      "nombre": "Río Grande II",
      "municipios": ["Medellín", "Bello", "Copacabana"],
      "caudal_m3s": 6.0
    }
  ]
}
```

---

### 5. `rivers` — Ríos principales

```json
{
  "_id": "ObjectId",
  "nombre": "Río Cauca",
  "longitud_km": 380,
  "descripcionEs": "Eje vertebral del occidente antioqueño...",
  "descripcionEn": "Main axis of western Antioquia...",
  "subregions": ["suroeste", "occidente", "norte", "bajo_cauca"]
}
```

---

---

## Colecciones — BD `comunidad`

### 6. `species_month` — Especie del Mes

Un documento por cada mes publicado.

```json
{
  "_id": "ObjectId",
  "month": 5,
  "year": 2026,
  "active": true,
  "speciesId": "ObjectId referencia a species",
  "nombre": "Mariposa Morpho Azul",
  "nombreCientifico": "Morpho peleides",
  "grupo": "mariposas",
  "emoji": "🦋",
  "iucn": "LC",
  "subregions": ["oriente", "suroeste", "norte"],
  "descripcionEs": "Descripción editorial del mes...",
  "descripcionEn": "Monthly editorial description...",
  "curiosidadEs": "Curiosidad...",
  "curiosidadEn": "Fun fact...",
  "comoIdentificarlaEs": "Cómo identificarla...",
  "comoIdentificarlaEn": "How to identify it...",
  "fotoOficial": "url/foto-oficial.jpg",
  "contactWhatsapp": "+573001234567",
  "contactEmail": "biodiversa@antioquia.gov.co",
  "createdAt": "2026-05-01T00:00:00Z"
}
```

---

### 7. `community_sightings` — Avistamientos comunitarios

Fotos que envía la comunidad para la Especie del Mes.

```json
{
  "_id": "ObjectId",
  "speciesMonthId": "ObjectId referencia a species_month",
  "usuario": "María G.",
  "municipio": "El Retiro",
  "subregion": "oriente",
  "fecha": "2026-05-08T00:00:00Z",
  "fotoUrl": "url/foto-comunidad.jpg",
  "comentario": "La vi en el sendero del parque en la mañana",
  "approved": true,
  "createdAt": "2026-05-08T10:30:00Z"
}
```

**Campo nuevo:** `approved` — permite revisar las fotos antes de publicarlas.

---

### 8. `jpl_photos` — Fotos JPL (Jóvenes pa' Lante)

Un documento por cada foto de biodiversidad subida por el curador del mes.

```json
{
  "_id": "ObjectId",
  "mes": "2026-06",
  "orden": 0,
  "foto": "img/fotos/bio/2026-06/aves/amazilia_tzacatl/amazilia_tzacatl_001.webp",
  "credito": "Nombre del fotógrafo",
  "municipio": "Medellín",
  "subregion": "valle_aburra",
  "especieEs": "Colibrí de cola rufa",
  "especieEn": "Rufous-tailed Hummingbird",
  "especieCientifico": "Amazilia tzacatl",
  "grupo": "aves",
  "iucn": "LC",
  "endemica": false,
  "descripcionEs": "Descripción en español...",
  "descripcionEn": "Description in English...",
  "publicado": true,
  "createdAt": "2026-06-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z"
}
```

---

### 9. `gc_photos` — Fotos Guarda Cuencas

Un documento por cada foto de cuencas subida por el curador del mes.

```json
{
  "_id": "ObjectId",
  "mes": "2026-06",
  "orden": 0,
  "foto": "img/fotos/gc_2026-06/gc_001.webp",
  "credito": "Nombre del fotógrafo",
  "municipio": "Santa Fe de Antioquia",
  "subregion": "occidente",
  "cuenca": "Río Cauca",
  "tituloEs": "Amanecer en el Río Cauca",
  "tituloEn": "Sunrise on the Cauca River",
  "descripcionEs": "...",
  "descripcionEn": "...",
  "publicado": true,
  "createdAt": "2026-06-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z"
}
```

---

### 10. `municipalities` — Municipios (Jóvenes pa' Lante)

```json
{
  "_id": "ObjectId",
  "nombre": "Medellín",
  "subregion": "valle_aburra",
  "lat": 6.25,
  "lng": -75.56,
  "jpl_beneficiado": true,
  "codigoDANE": "05001"
}
```

---

## Índices recomendados

### BD `biodiversidad`

```
species:  { kingdom: 1 }
species:  { kingdom: 1, group: 1 }
species:  { subregions: 1 }
species:  { familyId: 1 }
species:  { iucn: 1 }
species:  { visible: 1 }
species:  { scientificName: "text", nameEs: "text", nameEn: "text" }  ← búsqueda de texto
families: { group: 1 }
```

### BD `comunidad`

```
species_month:       { year: -1, month: -1 }
species_month:       { active: 1 }
community_sightings: { speciesMonthId: 1, approved: 1 }
jpl_photos:          { mes: 1, orden: 1 }
jpl_photos:          { mes: 1, publicado: 1 }
gc_photos:           { mes: 1, orden: 1 }
```

---

## Relaciones entre colecciones

```
species ──── familyId ────→ families
species ──── group ───────→ groups
species ──── subregions ──→ subregions (array de IDs)
species_month ── speciesId → species
community_sightings ── speciesMonthId → species_month
municipalities ── subregion → subregions
rivers ── subregions ────→ subregions (array de IDs)
```

---

## Clasificación Flora / Fauna

### Grupos actuales

| Grupo | Reino | Emoji |
|---|---|---|
| `aves` | `fauna` | 🦜 |
| `anfibios_reptiles` | `fauna` | 🐸 |
| `mariposas` | `fauna` | 🦋 |
| `polillas` | `fauna` | 🦗 |
| `mamiferos` | `fauna` | 🦌 |
| `animales_domesticos` | `fauna` | 🐄 |
| `peces` | `fauna` | 🐟 |
| `orquideas` | `flora` | 🌸 |
| `arboles_nativos` | `flora` | 🌳 |

**Grupos futuros posibles:** escarabajos, arañas, bromelias, helechos, plantas medicinales

### Flujo de navegación — Módulo Biodiversidad

```
biodiversidad/biodiversidad.html
  ├── 📍 Por subregión
  │     └── mapa.html → subregion.html?subregion=XXX
  │           └── listado.html?subregion=XXX&grupo=YYY
  │                 └── especie.html?id=ZZZ
  │
  ├── 🌿 Flora
  │     └── listado.html?kingdom=flora
  │           └── especie.html?id=ZZZ
  │
  └── 🦜 Fauna
        └── listado.html?kingdom=fauna
              └── especie.html?id=ZZZ
```

### Parámetros URL nuevos

| URL | Qué muestra |
|---|---|
| `listado.html?kingdom=flora` | Todas las familias y especies de flora, con buscador |
| `listado.html?kingdom=fauna` | Todas las familias y especies de fauna, con buscador |
| `listado.html?kingdom=flora&grupo=orquideas` | Solo orquídeas, con buscador |
| `listado.html?subregion=oriente&grupo=aves` | Aves del Oriente (flujo existente) |

---

## Migración desde JSON actual

Los 19 registros actuales de `species.json` (26 fotos en WebP) pasan directamente a la colección `species` sin transformación mayor. Solo se agregan los campos nuevos con valores por defecto:

- `legacyId` = el `id` actual (sp022, sp023, etc.)
- `visible` = `true`
- `featured` = `false`
- `verified` = `false`
- `endemic` = `false`
- `altitudeMin / Max` = `null` (a completar)
- `order` = `null` (a completar)
- `createdAt / updatedAt` = fecha de migración
