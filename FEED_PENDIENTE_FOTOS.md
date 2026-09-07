# Feed unificado, pendiente de subir a GitHub / Netlify

**Estado:** implementado y probado de forma estática en local. **No subido a GitHub.**
Se sube cuando lleguen las fotos reales de Jóvenes pa' Lante y Guarda Cuencas (hoy GC
solo tiene datos de prueba con rutas rotas, y JPL tiene ~22 fotos).

Fecha de implementación: 2026-09-07. Rama de trabajo: `develop`.

---

## Qué es

Página nueva `biodiversidad/feed.html` que se vuelve **la pantalla de entrada de la app**
(después de elegir idioma). Fusiona en runtime, sin build step y sin backend nuevo, las 3
colecciones de fotos:

- Catálogo de biodiversidad (`species.json`)
- Jóvenes pa' Lante (`comunidad/jovenes_pa_lante/data/`)
- Guarda Cuencas (`comunidad/guarda_cuencas/data/`)

Cada foto lleva un **badge de origen** (Jóvenes pa' Lante / Guarda Cuencas / Catálogo).
Se ve en las **mismas 3 vistas** que el catálogo (carrete / cuadrícula / mosaico) y tiene
un **filtro de acceso rápido** por fuente, siempre visible, con JPL de primero.

### Decisiones tomadas con Sebastián

1. **Alcance = Nivel 2.** Además del feed, las fotos de JPL cuyo nombre científico coincide
   con una especie del catálogo se anexan a la galería de `especie.html` (con crédito y badge).
   No se toca `listado.html`. GC nunca cruza (no tiene nombre científico).
   Hoy solo 1 especie cruza: *Baryphthengus martii* (`sp010301`).
2. **El feed es la entrada.** Tras elegir idioma se entra directo al feed. "Inicio" en la
   barra inferior de toda la app apunta a `feed.html`. `home.html` (selección de módulos) se
   conserva como pantalla secundaria (enlace "Ver todos los módulos" en el feed).
3. **Orden por defecto ("Todo"):** intercalado por grupo (evita rachas del mismo grupo, como
   el carrete actual) con las publicaciones más recientes de JPL/GC empujadas hacia arriba.
4. **Tap en foto de JPL/GC:** abre un visor/modal dentro del feed (dots/swipe/contador,
   patrón de la galería JPL); si la especie cruza el catálogo, muestra un enlace "Ver ficha".

---

## Archivos

### Nuevos (sin trackear todavía)

| Archivo | Rol |
|---|---|
| `biodiversidad/feed.html` | Página feed |
| `biodiversidad/js/feed-data.js` | `FeedStore`: fusiona las 3 fuentes → modelo común `FeedItem`; expone `getItems()` y `getCommunityForSpecies()` |
| `biodiversidad/js/feed.js` | Controlador: 3 vistas + filtro de fuente + modal |
| `biodiversidad/css/feed.css` | Filtro de fuente, badge de origen, modal (copiado de `galeria.css` de JPL) |

### Modificados

| Archivo | Cambio |
|---|---|
| `biodiversidad/js/index.js` | `selectLang()` redirige a `feed.html` (antes `home.html`) |
| `biodiversidad/index.html` | `index.js?v=3` → `?v=4` |
| `biodiversidad/js/especie.js` | Nivel 2: anexa fotos de comunidad que cruzan por nombre científico (helper `communityBadge()`, carga `FeedStore` en try/catch) |
| `biodiversidad/especie.html` | + `<script src="js/feed-data.js?v=1">`; `especie.js?v=11` → `?v=12`; `especie.css?v=6` → `?v=7` |
| `biodiversidad/css/especie.css` | Regla `.photo-slide .feed-badge` para el badge sobre fotos de comunidad |
| `biodiversidad/home.html` | Botón "Inicio" de la barra inferior → `feed.html`, ya no `active` |
| `data/translations.json` | 13 claves `feed_*` en `es` y `en` (paridad verificada) |
| Barra inferior "Inicio" en 17 páginas | `biodiversidad/{biodiversidad,listado,mapa,subregion,especie}.html`, `agua/{index,ecosistema,ecosistemas,ecosistemas_mapa,mapa,subregion,acueductos}.html`, `comunidad/{index,especie_del_mes}.html`, `comunidad/jovenes_pa_lante/{index,mapa}.html`, `comunidad/guarda_cuencas/index.html`. El destino pasó de `.../home.html` a `.../feed.html`. Los botones "Volver" del header **no** se tocaron (siguen a `home.html`). |
| `CLAUDE.md` | Flujo de navegación, estructura de carpetas, sección "Feed unificado" |

`biodiversidad/mapa_contenidos.html` no se tocó (pantalla interna de estadísticas).

### No se tocó

`biodiversidad/js/data.js`, `biodiversidad/css/components.css`, `netlify.toml`, el backend y el
pipeline de publicación. El feed reutiliza de `components.css` todo el sistema de 3 vistas.

---

## Datos que hay que solicitar a JPL y Guarda Cuencas

### JPL: qué entregan hoy vs. qué falta

JPL entrega la información **codificada en el nombre del archivo**, con esta convención:

```
Agalychnis_terranova - ENDÉMICA - Breiner Ferney Jimenez - La Cristalina - SanFrancisco
```

| Token | Campo | Nota |
|---|---|---|
| `Agalychnis_terranova` | `especieCientifico` | Género_especie con guion bajo |
| `ENDÉMICA` | `endemica` = true | Texto libre, no una categoría IUCN |
| `Breiner Ferney Jimenez` | `participante` / autor | |
| `La Cristalina` | `sector` (vereda) | |
| `SanFrancisco` | `municipio` | Sin espacio, hay que separarlo a mano |

Ese nombre entrega **5 datos**. Todo lo demás del JSON de v0 (`especieEs`, `especieEn`,
`grupo`, `familia`, `iucn` real, `descripcionEs/En`, `subregion`) **lo completamos nosotros
en la curación**: el nombre común y la descripción salen de iNaturalist con el nombre
científico, y la subregión se deriva del municipio.

**Falta pedirle a JPL (no lo podemos deducir):**

1. **Nombre científico correcto y a nivel de especie.** A veces viene mal escrito, a veces
   solo a género, y en los meses nuevos (2026-06 en adelante) viene vacío. Es la llave para
   autocompletar el resto y para el cruce con el catálogo.
2. **Fecha en que se tomó la foto** (no el mes de carga).
3. **Autorización de uso de imagen y licencia.** JPL son jóvenes: si hay menores,
   consentimiento del acudiente. Hoy no tenemos nada de esto.
4. **Municipio y sector bien escritos** (el archivo pega "SanFrancisco"; un nombre con guion
   rompería el parseo).
5. Deseable: coordenadas o vereda exacta; enlace a la observación en iNaturalist.
6. Pedir que **no** metan la categoría de conservación en el nombre ("ENDÉMICA"): eso lo
   determinamos con el nombre científico; que solo confirmen si el participante lo afirma.

### Guarda Cuencas: qué falta

1. **Fotos reales.** Hoy los datos son de prueba y las rutas están rotas (`gc_001.jpg` no
   existe). El filtro "Guarda Cuencas" del feed muestra solo placeholders hasta que se carguen.
2. **Autor de la foto** separado del grupo (hoy `credito` mezcla "Guarda Cuencas Oriente · Juan Pérez").
3. **Fecha de la foto.**
4. **Autorización de uso de imagen y licencia.**
5. **Tipo de fuente hídrica** (nacimiento, quebrada, río, humedal, embalse) para filtrar.
6. Deseable: coordenadas.
7. Decisión pendiente: GC no tiene taxonomía, así que nunca cruza con el catálogo. Si se
   quiere que aporte (foto de una especie en la cuenca), habría que agregarle
   `especieCientifico` opcional; si no, se deja como contenido de paisaje/cuenca.

### Ya se captura (no re-pedir)

- JPL: 1 a 3 fotos por entrada, `especieEs`, `especieEn`, `descripcionEs/En`, `municipio`,
  `subregion`, `grupo`, `especieCientifico`, `iucn`, `endemica`, `credito`.
- GC: 1 foto 16:9, `tituloEs`, `tituloEn`, `descripcionEs/En`, `municipio`, `subregion`,
  `cuenca`, `credito`.

### Plantilla sugerida de entrega (una fila por foto)

```
archivo | nombre_cientifico | fecha_foto | participante | vereda | municipio |
endemica_segun_participante (si/no) | autorizacion (si/no) | licencia | enlace_inaturalist
```

El resto (nombre común ES/EN, grupo, familia, IUCN real, descripción, subregión) lo seguimos
completando en el panel con el autocompletar de iNaturalist.

---

## Checklist antes de subir a GitHub / Netlify

Flujo obligatorio del proyecto: probar en `localhost:3000`, aprobar visualmente, y solo
entonces `git commit` + `git push` **a `develop`** (nunca directo a `main`).

1. Levantar el backend: `cd backend && npm run dev` → `http://localhost:3000`.
2. Recorrer la verificación completa (ver `.claude/plans/memoized-exploring-quokka.md`, sección
   "Verificación"): entrada por idioma → feed; 3 vistas; badge de origen; filtro de fuente;
   tap en comunidad abre modal; tap en catálogo navega a `especie.html`; "Ver ficha" en
   *Baryphthengus martii*; Nivel 2 en `especie.html?id=sp010301`; barra inferior "Inicio"
   desde varias páginas; toggle de idioma; regresión de `home.html`, `biodiversidad.html`,
   galerías JPL/GC.
3. **Re-validar WCAG 2.1 AA con axe-core** en `feed.html` (contraste, roles del segmentado,
   foco del modal, tamaño de zonas táctiles). Compromiso recurrente antes de cada pase.
4. **Cache-buster `?v=N`:** ya está resuelto en esta tanda. Los archivos nuevos (`feed.*`)
   nacen en `?v=1`. Los modificados ya se bumpearon: `index.js` v4 (en `biodiversidad/index.html`),
   `especie.js` v12 y `especie.css` v7 (en `biodiversidad/especie.html`). Verificar que
   `especie.js`/`index.js` no los cargue ninguna otra página:
   `grep -rn "especie.js\|index.js" --include="*.html"`.
5. Si al integrar las fotos se edita algún CSS/JS ya existente, **volver a subir su `?v=N`**
   en TODOS los HTML que lo referencian.
6. `git add` de los 4 archivos nuevos + los modificados. Confirmar que **no** se cuela nada de
   `Documentos gobernacion/` ni `comunidad/*/img/` (contenido dinámico, va por volúmenes).
7. Commit en Conventional Commits, p. ej.
   `feat: feed unificado (catálogo + JPL + Guarda Cuencas) como pantalla de entrada`.
8. `git push origin develop` → Netlify despliega el branch deploy de QA automáticamente.
   El pase a `main` (producción) requiere confirmación explícita de Sebastián.

## Notas conocidas

- **GC sin fotos reales:** el filtro "Guarda Cuencas" muestra placeholders 💧 hasta cargarlas.
- **Nivel 2 casi invisible hoy:** solo 1 de ~150 especies cruza. Es infraestructura para
  cuando crezcan catálogo y JPL en paralelo. Cada especie nueva que coincida por nombre
  científico con una foto de JPL aparecerá sola, sin más trabajo.
- **Ratios en mosaico:** para comunidad se usan valores por defecto (JPL 1:1, GC 16:9).
  Mejora futura opcional: leer dimensiones reales al cargar.
- **Optimización futura:** un artefacto `feed.json` generado en la publicación en vez de
  multi-fetch en runtime. Innecesario al volumen actual (~5 archivos de mes).
- **Íconos del diseñador** (`vista_*.svg`, `nav_*.svg`): el feed reutiliza los SVG inline
  actuales; cablear los nuevos es un cambio aparte.
