# Guía de Alimentación de Imágenes — Antioquia Biodiversa

## Estructura de carpetas

```
img/species/
  {grupo}/
    {familia}/
      {id_especie}_{nombre_cientifico}/
        {nombre_cientifico}_001.jpg   ← Foto principal (portrait / individuo completo)
        {nombre_cientifico}_002.jpg   ← Detalle (plumaje, patrón, estructura)
        {nombre_cientifico}_003.jpg   ← Hábitat o comportamiento
        {nombre_cientifico}_004.jpg   ← (opcional) foto adicional
```

**Ejemplo:**
```
img/species/aves/trochilidae/sp001_amazilia_tzacatl/
  amazilia_tzacatl_001.jpg  ← colibrí posado, vista lateral completa
  amazilia_tzacatl_002.jpg  ← detalle del pico y garganta
  amazilia_tzacatl_003.jpg  ← en vuelo sobre flor
```

---

## Reglas de nombrado de archivos

El nombre del archivo sigue el patrón: **`nombre_cientifico_slug_001.jpg`**

- El slug es el nombre científico en minúsculas con espacios reemplazados por `_`
- El consecutivo empieza en `001` y sube según cuántas fotos haya en la carpeta

**Ejemplo:** especie *Trogon collaris* → carpeta `sp022_trogon_collaris/`

| Foto | Nombre correcto | ✗ Incorrecto |
|---|---|---|
| Primera foto | `trogon_collaris_001.jpg` | `01.jpg`, `foto.jpg` |
| Segunda foto | `trogon_collaris_002.jpg` | `02.jpg`, `trogon2.jpg` |
| Tercera foto | `trogon_collaris_003.jpg` | `03.jpg` |

| Regla | ✓ Correcto | ✗ Incorrecto |
|---|---|---|
| Slug + consecutivo 3 dígitos | `trogon_collaris_001.jpg` | `01.jpg` |
| Formato JPG o WEBP | `.jpg` / `.webp` | `.png`, `.HEIC` |
| Sin espacios ni tildes en el nombre | `trogon_collaris_001.jpg` | `trogón collaris 1.jpg` |
| Primera foto = mejor foto | `_001` es la portada en listados | No ordenar al azar |

---

## Especificaciones técnicas de imagen

| Parámetro | Recomendado | Mínimo |
|---|---|---|
| Resolución | 2000 × 1500 px | 800 × 600 px |
| Relación de aspecto | 4:3 (horizontal) | flexible |
| Peso por archivo | < 800 KB | — |
| Formato | JPEG (calidad 85) o WEBP | — |
| Perfil de color | sRGB | — |

> **Tip de compresión:** Usar [Squoosh](https://squoosh.app) (gratuito, en el navegador) para reducir el peso sin perder calidad visual significativa.

---

## Cómo actualizar el JSON después de agregar fotos

Abrir `data/species.json` y actualizar el campo `photos` de la especie correspondiente:

```json
{
  "id": "sp001",
  "photos": [
    "aves/trochilidae/sp001_amazilia_tzacatl/01.jpg",
    "aves/trochilidae/sp001_amazilia_tzacatl/02.jpg",
    "aves/trochilidae/sp001_amazilia_tzacatl/03.jpg"
  ]
}
```

Mientras no haya fotos reales, dejar:
```json
"photos": []
```
La app mostrará automáticamente el placeholder del grupo.

---

## Fuentes de imágenes recomendadas

### Fuentes con licencia libre para uso institucional

| Plataforma | URL | Licencia | Calidad |
|---|---|---|---|
| **iNaturalist** | inaturalist.org | CC BY-NC (verificar por foto) | ★★★★ |
| **Wikimedia Commons** | commons.wikimedia.org | CC / dominio público | ★★★ |
| **GBIF** | gbif.org | Varía por imagen | ★★★ |
| **Flickr** (filtro CC) | flickr.com | CC BY / CC BY-SA | ★★★★ |

### Fotógrafos especializados en Colombia
- Solicitar directamente con crédito y licencia de uso institucional sin fines comerciales.
- El Instituto Humboldt (humboldt.org.co) tiene banco de imágenes de biodiversidad colombiana.
- ProAves Colombia tiene fotos de aves.

### Para la versión final del proyecto
Se recomienda contratar **fotógrafos naturalistas antioqueños** para tener imágenes exclusivas y de alta calidad. Esto da un valor diferencial enorme al proyecto.

---

## Lista de especies con estado de imágenes

| ID | Especie | Grupo | Fotos |
|---|---|---|---|
| sp001 | *Amazilia tzacatl* | Aves | ⬜ pendiente |
| sp002 | *Heliangelus exortis* | Aves | ⬜ pendiente |
| sp003 | *Eriocnemis vestita* | Aves | ⬜ pendiente |
| sp004 | *Patagioenas fasciata* | Aves | ⬜ pendiente |
| sp005 | *Anisognathus lacrymosus* | Aves | ⬜ pendiente |
| sp006 | *Ranitomeya opisthomelas* | Anfibios | ⬜ pendiente |
| sp007 | *Allobates niputidea* | Anfibios | ⬜ pendiente |
| sp008 | *Centrolene prosoblepon* | Anfibios | ⬜ pendiente |
| sp009 | *Pristimantis elegans* | Anfibios | ⬜ pendiente |
| sp010 | *Morpho peleides* | Mariposas | ⬜ pendiente |
| sp011 | *Morpho helenor* | Mariposas | ⬜ pendiente |
| sp012 | *Papilio thoas* | Mariposas | ⬜ pendiente |
| sp013 | *Caligo eurilochus* | Mariposas | ⬜ pendiente |
| sp014 | *Automeris io* | Polillas | ⬜ pendiente |
| sp015 | *Copaxa multifenestrata* | Polillas | ⬜ pendiente |
| sp016 | *Xylophanes chiron* | Polillas | ⬜ pendiente |
| sp017 | *Urania leilus* | Polillas | ⬜ pendiente |
| sp018 | *Cattleya trianae* | Orquídeas | ⬜ pendiente |
| sp019 | *Cattleya warscewiczii* | Orquídeas | ⬜ pendiente |
| sp020 | *Lepanthes telipogoniflora* | Orquídeas | ⬜ pendiente |
| sp021 | *Oncidium carthaginense* | Orquídeas | ⬜ pendiente |
| sp022 | (por definir) | Animales Domésticos | ⬜ pendiente |
| sp023 | (por definir) | Animales Domésticos | ⬜ pendiente |
| sp024 | (por definir) | Peces de Agua Dulce | ⬜ pendiente |
| sp025 | (por definir) | Peces de Agua Dulce | ⬜ pendiente |
| sp026 | (por definir) | Árboles Nativos | ⬜ pendiente |
| sp027 | (por definir) | Árboles Nativos | ⬜ pendiente |

Cambiar ⬜ por ✅ al completar cada especie.

---

## Fotos de las galerías comunitarias

Las fotos de las galerías mensuales (JPL y Guarda Cuencas) se organizan en carpetas distintas:

```
comunidad/jovenes_pa_lante/img/fotos/bio/
  jpl_001.jpg         ← Fotos del mes actual (junio 2026)
  jpl_002.jpg
  2026-05/            ← Fotos de meses anteriores en subcarpeta
    jpl_may_001.jpg

comunidad/guarda_cuencas/img/fotos/
  gc_001.jpg          ← Fotos del mes actual
  gc_2026_05/         ← Fotos de meses anteriores en subcarpeta
    gc_may_001.jpg
```

Para agregar un mes nuevo:
1. Crear la carpeta correspondiente (ej. `2026-07/`)
2. Crear el JSON del mes (ej. `fotos_2026_07.json`) con el mismo schema que los meses existentes
3. Agregar una entrada al índice (`fotos_biodiversidad.json` o `fotos_cuencas.json`)

---

*Antioquia Biodiversa — Gobernación de Antioquia*
