# Antioquia Biodiversa — Resumen del Proyecto

**Web app mobile-first** desarrollada para la Gobernación de Antioquia.
Permite explorar la biodiversidad, los recursos hídricos y los programas comunitarios del departamento, en español e inglés, accesible mediante código QR.

---

## Lo que construimos

### Arquitectura general

- **Stack:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks, sin dependencias externas)
- **Datos:** JSON estático — preparado para conectar a base de datos real en Fase 2
- **Hosting:** Netlify (deploy por arrastre de carpeta) / GitHub Pages
- **Idiomas:** Español / Inglés con cambio en tiempo real sin recargar la página
- **Diseño:** Mobile-first, optimizado para 375–430 px (iPhone estándar), responsive hasta desktop

---

## Tres módulos

### 🌿 Módulo Biodiversidad (especies insignia)

Consulta de flora y fauna representativa de Antioquia, organizada por subregión y grupo taxonómico.

| Pantalla | Descripción |
|---|---|
| Selección de idioma | Entrada a la app, ES / EN |
| Inicio | Selección del módulo a explorar |
| Biodiversidad | Buscar por subregión o por especie/familia |
| Mapa interactivo | SVG sobre el mapa oficial de Antioquia — 9 subregiones clickeables |
| Subregión | Grupos de biodiversidad con conteo de especies |
| Listado | Acordeón familia → especie, buscador en tiempo real, filtro por grupo |
| Ficha de especie | Galería de fotos, badge IUCN, distribución, descripción bilingüe |

**Base de datos de especies:**
- **80 especies** con fotografías reales
- **32 familias** taxonómicas
- 6 grupos activos: Polillas, Mariposas, Mamíferos, Anfibios y Reptiles, Orquídeas, Aves
- 9 subregiones cubiertas
- **92 fotos** en formato WebP (1200 px, q82) — ahorro promedio del 97% respecto a los originales JPG

---

### 💧 Módulo Agua

Exploración de la red hídrica de Antioquia: fuentes hídricas y cuencas abastecedoras por subregión.

| Pantalla | Descripción |
|---|---|
| Landing Agua | Elegir entre fuentes hídricas o cuencas abastecedoras |
| Mapa hídrico | Mapa interactivo con filtro por tipo y subregión |
| Subregión hídrica | Detalle de ríos, cuencas y municipios abastecidos |

---

### 👥 Módulo Comunidad

Tres programas que conectan a la ciudadanía con el territorio y los programas de la Gobernación.

**Jóvenes pa' Lante (JPL)**
- Información del programa de educación superior
- Mapa interactivo con los 90 municipios beneficiados (Leaflet)
- Galería fotográfica con **23 fotos reales de participantes del programa**
  - Filtro por grupo taxonómico, subregión y versión/mes
  - Ficha de especie con IUCN, flag endémica, sector y crédito fotográfico
  - Primera Versión: 17 fotos de campo — 13 especies endémicas, 1 CR, 2 EN
  - Archivo navegable por chips (versión o mes)
  - Fotos verticales mostradas completas con fondo verde oscuro `#0d1f0f`

**Guarda Cuencas**
- Programa de vigilancia y conservación de cuencas hídricas
- Galería fotográfica: 10 fotos de cuencas y ríos por mes
  - Cada foto incluye nombre de la cuenca, subregión y municipio
  - Cards en formato paisaje (16:9) para mostrar los cuerpos de agua
  - Archivo mensual con navegación por chips de mes

**Especie del Mes**
- El equipo editorial selecciona una especie insignia cada mes
- La comunidad puede enviar fotos de avistamiento vía WhatsApp o correo
- Las fotos se publican en la galería comunitaria de la app
- Historial de especies de meses anteriores

---

## Sistema de diseño

- **Colores institucionales** del Manual de Identidad Visual de la Gobernación de Antioquia
  - Verde principal `#018d38`, Verde oscuro `#0b5640`
  - Cada módulo tiene su propio color de acento (azul para Agua, naranja para Comunidad, púrpura para Especie del Mes)
- **Tipografía:** Poppins auto-hospedada (12 woff2 locales, sin dependencia de Google Fonts)
- **Logo oficial** (Escudo de Armas) integrado en el header y pantalla de entrada
- Componentes reutilizables: bottom navigation bar, tarjetas, badges IUCN, chips de subregión, acordeón, galería con swipe táctil

---

## Funcionalidades destacadas

**Bilingüismo completo**
- Todos los módulos cambian entre español e inglés en tiempo real, sin recargar
- La preferencia de idioma se guarda entre sesiones
- Las descripciones de contenido (especies, fuentes) tienen campos `Es`/`En` en los datos

**Mapa SVG interactivo (Biodiversidad)**
- SVG superpuesto al JPG oficial del mapa de Antioquia
- 9 polígonos clickeables — tocar navega directamente a la subregión (sin panel intermedio)
- Hover CSS-only (sin manipulación de estilos inline) para evitar parpadeo en polígonos múltiples

**Mapa de municipios (Leaflet)**
- 90 marcadores geolocalizados con popups
- Filtro por subregión con píldoras de color
- Vista mobile-first con zoom y arrastre

**Buscador de especies**
- Búsqueda en tiempo real con debounce (220 ms)
- Filtro simultáneo por texto y grupo taxonómico
- Resultados organizados por familia

**Galería de fotos**
- Navegación por toque, swipe y puntos indicadores
- Soporte de captions bilingües por foto (Macho/Female, Hábitat/Habitat)
- Lazy loading en fotos secundarias

**Panel de administración web (curadores)**
- Login con sesión protegida por contraseña
- Panel JPL: subir, editar y eliminar fotos de biodiversidad por mes; publicar JSON del mes
- Panel Guarda Cuencas: mismo flujo para fotos de cuencas (16:9)
- Las fotos se convierten automáticamente a WebP optimizado al guardar (sharp, servidor)

---

## Optimizaciones realizadas

- **Conversión a WebP:** script batch (`optimize_photos.js`) convierte JPG/PNG a WebP 1200 px q82 — ahorro promedio del 97% (92 fotos procesadas)
- **Auto-conversión en uploads:** el panel admin procesa cada foto con sharp antes de guardarla; ningún JPG/PNG llega al disco del servidor
- **Servidor de desarrollo:** `serve.sh` con `npx serve` elimina el TTFB de 29 s que Safari tenía con `python -m http.server`
- Conteos de especies calculados dinámicamente desde los datos (no hardcodeados)
- Solo se muestran especies con fotografías reales
- Fetch de datos con `cache: 'no-store'` para contenido administrado (Especie del Mes)
- Guard anti-duplicación en el sistema bilingüe para páginas complejas
- Compatibilidad con Netlify Pretty URLs: `_autoPath()` detecta URLs con trailing slash (sin `index.html`) y calcula la ruta a `translations.json` correctamente

---

## Archivos entregables

| Archivo / Carpeta | Descripción |
|---|---|
| `biodiversidad/data/species.json` | Base de datos completa de familias y especies (9 grupos) |
| `data/translations.json` | Todas las cadenas ES/EN de la interfaz |
| `comunidad/data/especie_mes.json` | Datos de la Especie del Mes (actualizable por admin) |
| `comunidad/jovenes_pa_lante/data/municipios.json` | 90 municipios JPL geolocalizados |
| `comunidad/jovenes_pa_lante/data/fotos_biodiversidad.json` | Índice de meses para galería JPL |
| `comunidad/guarda_cuencas/data/fotos_cuencas.json` | Índice de meses para galería Guarda Cuencas |
| `agua/data/fuentes.json` | Red hídrica por subregión |
| `admin/` | Panel web de administración para curadores (JPL y Guarda Cuencas) |
| `backend/` | API REST Node.js/Express + scripts de migración MongoDB |
| `QR_Antioquia_Biodiversa.png` | QR en verde institucional apuntando a la URL pública |
| `CLAUDE.md` | Documentación técnica detallada del proyecto |
| `SCHEMA_DB.md` | Esquema MongoDB para producción |
| `biodiversidad/img/species/GUIA_IMAGENES.md` | Instrucciones para el equipo curador de fotos |

---

## URL pública (demo)

**https://antioquia-biodiversa-demo.netlify.app**

---

## Necesidades de la Gobernación para producción

Para llevar el prototipo a producción completa, el equipo de la Gobernación debe proveer:

| Elemento | Descripción |
|---|---|
| Fotografías oficiales | Fotos de las 150+ especies (ver GUIA_IMAGENES.md para especificaciones) |
| Base de datos de especies | Nombres, descripciones e IUCN de todas las especies a incluir |
| Datos hídricos verificados | Fuentes, cuencas y municipios abastecidos por subregión |
| Dominio oficial | Subdominio `.gov.co` o URL definitiva |
| Contacto de WhatsApp/correo | Para recepción de fotos de la comunidad (Especie del Mes) |
| Logo y activos en alta resolución | Versiones SVG del escudo y logotipo oficial |

---

## Presupuesto estimado para producción completa

| Fase | COP estimado |
|---|---|
| Desarrollo a producción (backend, CMS, panel curador) | $59M – $113M |
| Fotografías y contenido (150+ especies, ~1.800 fotos) | $13M – $120M |
| Infraestructura anual (hosting, dominio, CDN) | $4M – $10M/año |
| Mantenimiento y operación anual | $39M – $107M/año |
| **Inversión total año 1** | **$115M – $350M** |

---

## Próximos pasos sugeridos — Fase 2

- [ ] Ampliar base de datos a 150+ especies (meta documentada en IMPACTO.md)
- [ ] Consultar Libro Rojo de Colombia para estados IUCN en Lepidoptera
- [ ] Backend / API real (reemplazar JSON estático con base de datos)
- [ ] Integración de subida de fotos comunitarias directamente en la app
- [ ] Dominio oficial `.gov.co` y certificado SSL
- [ ] PWA: instalable en celular como app nativa, modo offline
- [ ] Analytics de uso y mapas de calor de interacción
- [ ] Integración con SiB Colombia / GBIF
- [ ] Módulos adicionales según prioridades de la Gobernación

---

*Desarrollado con Claude Code — Anthropic*
*Última actualización: junio 2026 · 80 especies · 92 fotos WebP · 23 fotos JPL*
