# Fuentes de datos — Cuencas Hídricas de Antioquia

Documenta de dónde sale la información del mapa `agua/mapa.html` y cómo
regenerarla o actualizarla en el futuro.

## Los 6 niveles de clasificación hidrográfica — preguntas frecuentes

**¿Qué son los "niveles" que aparecen en el mapa?**
Es la clasificación oficial de cuencas hidrográficas de Colombia, definida
por el IDEAM y adoptada legalmente por el **Decreto 1640 de 2012** (Ministerio
de Ambiente y Desarrollo Sostenible). No es un criterio propio de este
proyecto — es el mismo estándar que usan el IDEAM, el IGAC y las
Corporaciones Autónomas Regionales en su cartografía oficial. Fuente completa
en `MEMORIAS-MAPA-ZONIFICACION-HIDROGRAFICA.pdf` (mismo folder).

**¿Cómo funciona la jerarquía?**
Cada nivel vive *dentro* del anterior, como muñecas rusas:

| Nivel | Nombre | Qué es | Ejemplo en Antioquia |
|---|---|---|---|
| 1 | Área hidrográfica | La gran vertiente continental — a qué sistema mayor van las aguas | Antioquia está en 2: **Magdalena-Cauca** (la mayoría del territorio) y **Caribe** (Urabá) |
| 2 | Zona hidrográfica | Agrupa varias cuencas de relieve y drenaje similar dentro de un área | "Cauca", "Nechí", "Medio Magdalena", "Atrato-Darién", "Caribe-Urabá" — define el color de cada río en el mapa |
| 3 | Subzona hidrográfica | La cuenca de un río principal | Río Porce, Río Cauca, Río Nechí — **es el nivel que muestra este mapa** |
| 4 | Nivel I | Subdivisión de una subzona: cuencas de afluentes grandes | P.ej. dentro de la subzona del Nechí, la cuenca propia del Porce |
| 5 | Nivel II | Subdivisión más fina, dentro de un Nivel I | Afluentes medianos |
| 6 | Nivel III | El más detallado: quebradas y microcuencas individuales | Quebradas locales |

**¿Por qué no vemos ríos "de nivel 1" o "nivel 2" en la lista?**
Porque no son cuencas adicionales — son categorías que *agrupan* las cuencas
de nivel 3 que sí se muestran. Cada uno de los 18 ríos del mapa ya pertenece
a un nivel 1 y un nivel 2 (se ven como los primeros dos badges en el panel de
información de cada río), además de ser él mismo el nivel 3.

**¿Por qué el mapa se queda en el nivel 3 y no llega al 4-6?**
Los niveles 4 a 6 requieren cartografía de mayor detalle, que en Colombia
delimita cada Corporación Autónoma Regional para su propia jurisdicción (no
existe una versión nacional pública unificada a ese nivel de detalle). Para
Antioquia eso significa CORANTIOQUIA, CORNARE y CORPOURABA — la misma fuente
con licencia restringida que se documenta más abajo, pendiente de
autorización.

**¿Los 18 ríos del mapa son todos nivel 3?**
15 de 18 sí — su área se construye directamente a partir de códigos
oficiales de subzona del IDEAM (ver `GRUPOS` en `generate_cuencas_agua.py`,
campo `nivel_ideam: 3` en `cuencas.json`). Los otros 3 (Cocorná, Grande,
Guatapé) no tienen código de subzona propio en esta fuente — son afluentes
reconocidos dentro de una subzona mayor, aproximadamente nivel 4-6, pero sin
poder precisar cuál sin la cartografía de la Corporación correspondiente
(campo `nivel_ideam: null`).

## Criterio de selección de los 18 ríos

**No es un ranking objetivo único** (ej. "las 18 subzonas más grandes por
área"). Es una selección curada que combina tres criterios distintos, sin un
peso definido entre ellos:

1. **Continuidad con lo que ya existía**: el módulo de agua tenía antes una
   lista escrita a mano (`rios_principales` en el `fuentes.json` original) con
   10 ríos, sin criterio documentado de por qué esos. Se tomó como punto de
   partida.
2. **Tamaño real, donde se pudo medir**: al cruzar las subzonas hidrográficas
   oficiales del IDEAM contra el límite de Antioquia (ver sección de fuentes
   más abajo), se obtuvo el área real en km² de 15 de los 18 ríos. Se
   descartaron subzonas con una superposición mínima con Antioquia (<5%,
   salvo que fueran la continuación de un río ya incluido — ver el caso del
   Cauca en la sección de correcciones de geometría).
3. **Reconocimiento regional**: 3 ríos (Cocorná, Grande, Guatapé) se
   agregaron por su peso conocido en la región — Cocorná ya estaba en la
   lista original, Grande y Guatapé son centrales para el sistema de
   embalses/generación eléctrica del oriente antioqueño — aunque la fuente
   de datos no les asigna un código de subzona propio, así que **no se pudo
   medir su área** y no se sabe si son más grandes o más pequeños que otras
   subzonas que quedaron fuera.

### Los 18, ordenados por área real dentro de Antioquia (donde se pudo medir)

| Río | Área en Antioquia |
|---|---|
| Río Cauca | 12.150 km² |
| Río Nechí | 8.572 km² |
| Río Samaná Norte | 5.641 km² |
| Río Porce | 5.299 km² |
| Río Atrato | 4.225 km² |
| Río Sucio | 4.031 km² |
| Río Magdalena | 3.482 km² |
| Río Murrí | 3.440 km² |
| Río Mulatos | 3.070 km² |
| Río León | 2.130 km² |
| Río Cimitarra | 2.095 km² |
| Río Arma | 1.442 km² |
| Río San Juan (Suroeste) | 1.422 km² |
| Río San Juan de Urabá | 1.397 km² |
| Río Samaná Sur | 736 km² |
| Río Cocorná | sin medir (sin subzona propia en la fuente) |
| Río Grande | sin medir (sin subzona propia en la fuente) |
| Río Guatapé | sin medir (sin subzona propia en la fuente) |

**Si preguntan "¿por qué estos 18 y no otros?"**: la respuesta honesta es que
es una selección curada, no un ranking automático. Si se necesita un criterio
100% objetivo y defendible (ej. "todas las subzonas de nivel 3 con más de X
km² dentro de Antioquia, sin excepción"), es un cambio de metodología que
implica rehacer la selección — evaluarlo con el equipo antes de presentar el
mapa como definitivo ante la Gobernación.

## Script de generación

`generate_cuencas_agua.py` (raíz del proyecto). Descarga las fuentes públicas
de abajo, recorta la geometría contra el límite real de Antioquia y escribe
`agua/data/cuencas.json`.

```bash
python3 generate_cuencas_agua.py
```

Requiere `shapely` (`pip3 install shapely`). No requiere `pyproj` — la
reproyección de Web Mercator a lon/lat se hace con la fórmula esférica
directamente en el script, porque en este entorno `pyproj` no logra ubicar su
base de datos PROJ.

## Fuentes usadas

### 1. Límite del departamento de Antioquia
- **Fuente**: GADM 4.1, Colombia ADM1 (departamentos)
- **URL**: `https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_COL_1.json.zip`
- **Licencia**: uso libre para fines no comerciales y académicos (ver gadm.org)
- **Por qué esta fuente**: ya se usaba en otras partes del proyecto para límites administrativos de Colombia.

### 2. Cuencas y ríos (área, zona y subzona hidrográfica + trazado)
- **Fuente**: Webmap público de ArcGIS Online "Mapa cuencas Colombia", de Fernando Salazar Holguín (exsubdirector de Ecosistemas e Información Ambiental del IDEAM), a partir de mapas del HIMAT/IDEAM y modelamiento hidrológico SRTM 3" (HydroSHEDS, 2006).
- **Item ID**: `57edccf4f4474e1ebbbada737c307bfb`
- **URL del mapa**: https://www.arcgis.com/apps/mapviewer/index.html?webmap=57edccf4f4474e1ebbbada737c307bfb
- **URL de datos (JSON)**: `https://www.arcgis.com/sharing/rest/content/items/57edccf4f4474e1ebbbada737c307bfb/data?f=json`
- **Acceso**: público, sin restricción de licencia.
- **⚠️ Importante**: el propio ítem indica explícitamente *"Mapa indicativo para consulta, no es información oficial. Está en proceso de edición... Favor consultar también al IDEAM (www.ideam.gov.co)"*. Es la mejor fuente pública gratuita encontrada, pero no es el dato oficial certificado.
- **Capas usadas**: `SubZonas Hidrográficas` (polígonos, para el área de cada cuenca) y `Ríos de Colombia (Niveles 3 a 6)` + `Ríos de Colombia (Nivel 2)` (líneas, para el trazado/recorrido).

### Clasificación oficial de referencia (no se usó como fuente de datos, solo de metodología)
- **Documento**: IDEAM, *"Zonificación y Codificación de Cuencas Hidrográficas"* (2013), en `Mapa/Info agua/MEMORIAS-MAPA-ZONIFICACION-HIDROGRAFICA.pdf`
- Define los 6 niveles jerárquicos oficiales (Decreto 1640 de 2012): Área hidrográfica → Zona hidrográfica → Subzona hidrográfica → Nivel I → Nivel II → Nivel III. El mapa de la app usa esta terminología y llega hasta el nivel 3 (Subzona).

### 3. Longitud total de cada río (nacimiento a desembocadura)
No se calcula de nuestra propia geometría — la fuente pública del punto 2 no capta el curso completo de la mayoría de los ríos fuera de Antioquia (es un dataset preliminar), así que un cálculo propio habría sido incompleto y engañoso. En su lugar, se investigó en fuentes públicas citables (Wikipedia, EcuRed, estudios POMCA de las Corporaciones) para 9 de los 18 ríos; ver el diccionario `LONGITUD_OFICIAL_KM` en `generate_cuencas_agua.py` para el detalle y la fuente de cada cifra. Los otros 9 (Samaná Sur, San Juan Suroeste, Cimitarra, Murrí, Mulatos, San Juan de Urabá, Cocorná, Grande, Guatapé) quedan sin esta cifra — no se encontró una fuente confiable, y se prefiere no mostrar nada antes que inventar un número.

**Cuidado con nombres repetidos**: "San Juan" existe como nombre de al menos 2 ríos distintos y no relacionados en Colombia (el de Andes/Bolombolo en Antioquia, tributario del Cauca, y el mucho más largo que desemboca en el Pacífico por Chocó/Valle del Cauca). Verificar siempre el contexto geográfico antes de usar una cifra encontrada en una búsqueda.

## Pendiente — fuente con licencia restringida (no usada todavía)

**CORANTIOQUIA — "Cuencas Hidrográficas Principales-Antioquia"** (ArcGIS item
`8021813b5d5942e8b811ac65638c2d85`, edición 2010): tiene mucho más detalle
(776 cuencas/quebradas nombradas) y es la fuente que permitiría separar ríos
como Nare, Aburrá o Cocorná (Sur) como cuencas propias en vez de tramos
agrupados. **Requiere autorización previa por escrito de CORANTIOQUIA** antes
de usarse (ver su `licenseInfo`); además solo cubre 80 de los 125 municipios
(falta Oriente/CORNARE y Urabá/CORPOURABA). Pendiente de gestión por parte de
la Gobernación — ver conversación de julio 2026 sobre el módulo de agua.

## Cómo actualizar

1. Editar el diccionario `GRUPOS` / `DESCRIPCIONES` en `generate_cuencas_agua.py` si se agrega o quita una cuenca.
2. Volver a correr `python3 generate_cuencas_agua.py`.
3. Revisar visualmente en `localhost:3000/agua/mapa.html` antes de subir.

Si en el futuro se obtiene la autorización de CORANTIOQUIA (o de CORNARE /
CORPOURABA para completar cobertura), el reemplazo natural es sustituir la
fuente del paso 2 (IDEAM) por la de la Corporación correspondiente, manteniendo
la misma estructura de salida (`agua/data/cuencas.json`).
