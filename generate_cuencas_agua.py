"""
Genera agua/data/cuencas.json: las cuencas hidrográficas principales de
Antioquia (área, zona hidrográfica y trazado de cada río), recortadas contra
el límite real del departamento.

Fuentes (ver también Mapa/Info agua/FUENTES_DATOS_AGUA.md):
  1. Límite de Antioquia: GADM 4.1 Colombia ADM1
     https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_COL_1.json.zip
  2. Cuencas y ríos: webmap público de IDEAM "Mapa cuencas Colombia"
     (Fernando Salazar Holguín, item ArcGIS Online 57edccf4f4474e1ebbbada737c307bfb)
     https://www.arcgis.com/sharing/rest/content/items/57edccf4f4474e1ebbbada737c307bfb/data?f=json
     Nota: el propio item indica "no es información oficial" (versión preliminar).
  3. Trazado de línea para Porce, San Juan de Urabá, Regla y Grande, y área
     aproximada de Grande/Cocorná/Guatapé: OpenStreetMap (Overpass API) y
     HydroBASINS (HydroSHEDS/WWF) — ver OSM_LINEAS y HYBAS_IDS más abajo.

Requiere: shapely, pyshp (lectura pura en Python de shapefiles, sin GDAL/PROJ
— pyproj tampoco es necesario para lo demás: se usa la fórmula esférica de
Web Mercator directamente porque en este entorno pyproj no encuentra su base
de datos PROJ).

Uso: python3 generate_cuencas_agua.py
Escribe: agua/data/cuencas.json
"""

import json
import math
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import LineString, shape, mapping
from shapely.ops import linemerge, transform, unary_union

ROOT = Path(__file__).parent
OUT_PATH = ROOT / "agua" / "data" / "cuencas.json"

GADM_URL = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_COL_1.json.zip"
IDEAM_WEBMAP_URL = (
    "https://www.arcgis.com/sharing/rest/content/items/"
    "57edccf4f4474e1ebbbada737c307bfb/data?f=json"
)

R = 6378137.0  # radio esférico usado por Web Mercator (EPSG:3857)


def webmerc_to_wgs84(x, y, z=None):
    lon = (x / R) * 180.0 / math.pi
    lat = (2 * math.atan(math.exp(y / R)) - math.pi / 2) * 180.0 / math.pi
    return (lon, lat)


def haversine_km(lon1, lat1, lon2, lat2):
    Rk = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * Rk * math.asin(math.sqrt(a))


def keep_connected_parts(multiline_geom, reference_geom, max_gap_deg=0.15):
    """Descarta tramos que comparten nombre pero pertenecen a un río distinto
    y lejano (ej. 'San Juan' o 'Grande' se repiten en Colombia). Solo se
    conservan las partes cuya distancia al polígono de Antioquia es pequeña,
    es decir, que realmente continúan el tramo que sí está en el departamento."""
    parts = list(multiline_geom.geoms) if hasattr(multiline_geom, "geoms") else [multiline_geom]
    kept = [p for p in parts if p.distance(reference_geom) <= max_gap_deg]
    if not kept:
        return None
    return unary_union(kept)


def line_length_km(geom):
    total = 0
    coords_list = geom["coordinates"] if geom["type"] == "MultiLineString" else [geom["coordinates"]]
    for coords in coords_list:
        for i in range(len(coords) - 1):
            total += haversine_km(*coords[i], *coords[i + 1])
    return total


def fetch_json(url, cache_name):
    cache = ROOT / f".cache_{cache_name}.json"
    if cache.exists():
        return json.loads(cache.read_text())
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
    cache.write_text(json.dumps(data))
    return data


def get_antioquia_boundary():
    import zipfile
    import io

    with urllib.request.urlopen(GADM_URL) as r:
        zdata = r.read()
    with zipfile.ZipFile(io.BytesIO(zdata)) as z:
        name = [n for n in z.namelist() if n.endswith(".json")][0]
        gadm = json.loads(z.read(name))
    feat = next(f for f in gadm["features"] if f["properties"]["NAME_1"] == "Antioquia")
    return shape(feat["geometry"])


def get_layer(webmap_data, title):
    for l in webmap_data["operationalLayers"]:
        if l["title"] == title:
            return l["featureCollection"]["layers"][0]


OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def fetch_osm_line(osm_name, bbox, cache_name):
    """Trazado de río desde OpenStreetMap (© colaboradores de OpenStreetMap,
    licencia ODbL) — solo para los ríos que el webmap de IDEAM no trae
    trazados (ver OSM_LINEAS). bbox = (south, west, north, east) en WGS84,
    elegido a mano alrededor de cada río para no mezclar otro río homónimo
    (Colombia repite nombres como "San Juan")."""
    cache = ROOT / f".cache_osm_{cache_name}.json"
    if cache.exists():
        data = json.loads(cache.read_text())
    else:
        south, west, north, east = bbox
        query = (
            f'[out:json][timeout:100];'
            f'(way["waterway"~"river|stream"]["name"="{osm_name}"]'
            f'({south},{west},{north},{east}););out tags geom;'
        )
        req = urllib.request.Request(
            OVERPASS_URL,
            data=urllib.parse.urlencode({"data": query}).encode(),
            headers={"User-Agent": "AntioquiaNaturalResearch/1.0 (contact: sguzmand@gmail.com)"},
        )
        with urllib.request.urlopen(req, timeout=110) as r:
            data = json.loads(r.read())
        cache.write_text(json.dumps(data))

    lines = []
    for e in data.get("elements", []):
        if e.get("type") != "way":
            continue
        if e.get("tags", {}).get("name") != osm_name:
            continue
        geom = e.get("geometry")
        if not geom:
            continue
        coords = [(pt["lon"], pt["lat"]) for pt in geom]
        if len(coords) < 2:
            continue
        lines.append(LineString(coords))
    return lines


HYDROBASINS_LEV08_URL = (
    "https://data.hydrosheds.org/file/hydrobasins/standard/hybas_sa_lev08_v1c.zip"
)


def fetch_hybas_geometry(hybas_id):
    """Polígono de cuenca de HydroBASINS (HydroSHEDS/WWF, nivel 8, Suramérica)
    para un HYBAS_ID puntual — usado solo para Grande/Cocorná/Guatapé, que no
    tienen subzona propia en la fuente de IDEAM (ver HYBAS_IDS). Se lee con
    pyshp (puro Python) en vez de geopandas/fiona porque este entorno no
    encuentra la base de datos PROJ que esas librerías necesitan al abrir un
    .shp — HydroBASINS ya viene en WGS84 así que no hace falta reproyectar.
    IMPORTANTE: el HYBAS_ID de cada río se buscó a mano una sola vez (el
    polígono, de los que tocaba la línea ya trazada del río, con más overlap
    con esa línea) — no hay una forma automática de re-derivarlo aquí."""
    import shapefile
    import zipfile

    zip_path = ROOT / ".cache_hybas_sa_lev08.zip"
    shp_dir = ROOT / ".cache_hybas_sa_lev08"
    if not zip_path.exists():
        req = urllib.request.Request(
            HYDROBASINS_LEV08_URL,
            headers={"User-Agent": "AntioquiaNaturalResearch/1.0 (contact: sguzmand@gmail.com)"},
        )
        with urllib.request.urlopen(req, timeout=180) as r:
            zip_path.write_bytes(r.read())
    if not shp_dir.exists():
        shp_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(shp_dir)

    shp_file = next(shp_dir.glob("*.shp"))
    sf = shapefile.Reader(str(shp_file))
    for sr in sf.iterShapeRecords():
        if sr.record["HYBAS_ID"] == hybas_id:
            return shape(sr.shape.__geo_interface__)
    return None


# Cuencas principales: nombre final -> (códigos SZH a fusionar, clave en la capa de ríos)
GRUPOS = {
    # 2502 tiene solo 2.1% de su área en Antioquia, pero es justo el tramo que
    # sigue el cauce al norte de Caucasia (hacia Nechí/San Jacinto del Cauca) —
    # sin él, la línea del río sigue pero el polígono de área se corta antes.
    "Río Cauca":            ([2617, 2620, 2621, 2622, 2623, 2624, 2625, 2502], "Cauca"),
    "Río Nechí":            ([2702, 2703, 2704], "Porce / Nechí"),
    # La línea nacional "Porce / Nechí" es un solo trazado que en realidad
    # representa el tramo bajo (Nechí), no el propio Porce — asignarla aquí
    # mostraría la línea equivocada, así que Porce queda solo con su área.
    "Río Porce":            ([2701], None),
    "Río Magdalena":        ([2307, 2309, 2316], "Magdalena"),
    "Río Samaná Norte":     ([2308], "Samaná Norte"),
    "Río Samaná Sur":       ([2305], "Samaná"),
    "Río Arma":             ([2618], "Arma"),
    "Río San Juan (Suroeste)": ([2619], "San Juan"),
    "Río Cimitarra":        ([2317], "Cimitarra"),
    # 1109/1110/1113/1114 están nombradas "R. Atrato (mi/md)..." — son tramos
    # del cauce principal hacia la desembocadura, no de sus afluentes; se
    # agregan para que el área llegue hasta donde llega la línea del río.
    "Río Atrato":           ([1102, 1104, 1106, 1109, 1110, 1113, 1114], "Atrato"),
    "Río Murrí":            ([1107], "Murrí"),
    "Río Sucio":            ([1111], "Sucio"),
    "Río León":             ([1201], "León"),
    "Río Mulatos":          ([1202], "Mulatos"),
    "Río San Juan de Urabá": ([1203], None),
    # Agregado septiembre 2026: cubre el hueco visible en el mapa entre las
    # cuencas del Porce y el Samaná Norte (Vegachí, Yolombó, Maceo — sur de
    # Yalí). No tiene línea propia en la fuente (mismo caso que el Porce).
    "Río Regla":            ([2310], None),
}

# id, nombre, descripción ES/EN, subregiones, líneas de río extra sin polígono propio
DESCRIPCIONES = {
    "Río Cauca": ("cauca", "Eje vertebral del occidente antioqueño. Nace en el Macizo Colombiano y atraviesa el departamento de sur a norte.",
                  "The backbone river of western Antioquia. Rises in the Colombian Massif and crosses the department from south to north.",
                  ["suroeste", "occidente", "norte", "bajo_cauca"], "Magdalena-Cauca", "Cauca"),
    "Río Magdalena": ("magdalena", "Límite oriental de Antioquia con Boyacá y Santander. Principal arteria fluvial de Colombia.",
                       "Antioquia's eastern border with Boyacá and Santander. Colombia's main river artery.",
                       ["magdalena_medio"], "Magdalena-Cauca", "Medio Magdalena"),
    "Río Atrato": ("atrato", "Uno de los ríos con mayor caudal del mundo por unidad de área. Nace en el suroeste antioqueño (alto Atrato) y desemboca en el golfo de Urabá.",
                   "One of the highest-discharge rivers in the world per unit area. Rises in southwestern Antioquia and flows into the Gulf of Urabá.",
                   ["uraba", "occidente"], "Caribe", "Atrato - Darién"),
    "Río Porce": ("porce", "Continuación del río Aburrá/Medellín tras salir del Valle de Aburrá. Cruza el nordeste hasta unirse al Nechí.",
                  "Continuation of the Aburrá/Medellín River after leaving the Aburrá Valley. Crosses the northeast until joining the Nechí.",
                  ["valle_aburra", "nordeste"], "Magdalena-Cauca", "Nechí"),
    "Río Nechí": ("nechi", "Afluente del Cauca que drena el Bajo Cauca antioqueño, recibiendo antes las aguas del Porce.",
                  "Tributary of the Cauca that drains the Bajo Cauca region, receiving the Porce before joining the Cauca.",
                  ["nordeste", "bajo_cauca"], "Magdalena-Cauca", "Nechí"),
    "Río León": ("leon", "Principal río de Urabá. Desemboca en el golfo de Urabá junto al Atrato.",
                 "Urabá's main river. Flows into the Gulf of Urabá alongside the Atrato.",
                 ["uraba"], "Caribe", "Caribe - Urabá"),
    "Río San Juan (Suroeste)": ("san_juan_suroeste", "Nace en los Farallones de Citará (suroeste antioqueño) y desemboca en el río Cauca cerca de Bolombolo, íntegramente dentro de Antioquia.",
                                  "Rises in the Farallones de Citará (southwestern Antioquia) and flows into the Cauca River near Bolombolo, entirely within Antioquia.",
                                  ["suroeste", "occidente"], "Magdalena-Cauca", "Cauca"),
    "Río Cocorná": ("cocorna", "Afluente del Magdalena Medio. Atraviesa el oriente antioqueño.",
                    "Tributary of the Middle Magdalena. Crosses eastern Antioquia.",
                    ["oriente"], "Magdalena-Cauca", "Medio Magdalena"),
    "Río Arma": ("arma", "Afluente del Cauca. Límite natural entre Antioquia y Caldas en el suroeste.",
                 "Tributary of the Cauca. Natural boundary between Antioquia and Caldas in the southwest.",
                 ["suroeste", "oriente"], "Magdalena-Cauca", "Cauca"),
    "Río Samaná Norte": ("samana_norte", "Drena el oriente antioqueño hacia el Magdalena Medio, cerca de Puerto Triunfo.",
                          "Drains eastern Antioquia toward the Middle Magdalena, near Puerto Triunfo.",
                          ["oriente", "magdalena_medio"], "Magdalena-Cauca", "Medio Magdalena"),
    "Río Samaná Sur": ("samana_sur", "Nace en el oriente antioqueño (Sonsón, Nariño) y marca parte del límite con Caldas.",
                        "Rises in eastern Antioquia (Sonsón, Nariño) and marks part of the border with Caldas.",
                        ["oriente"], "Magdalena-Cauca", "Medio Magdalena"),
    "Río Cimitarra": ("cimitarra", "Drena el extremo nororiental del Magdalena Medio antioqueño, límite con Santander y Bolívar.",
                       "Drains the northeastern tip of Antioquia's Middle Magdalena region, bordering Santander and Bolívar.",
                       ["magdalena_medio"], "Magdalena-Cauca", "Medio Magdalena"),
    "Río Murrí": ("murri", "Afluente del Atrato que nace en el occidente antioqueño, en jurisdicción de Vigía del Fuerte y Frontino.",
                  "Tributary of the Atrato rising in western Antioquia, in Vigía del Fuerte and Frontino.",
                  ["occidente"], "Caribe", "Atrato - Darién"),
    "Río Sucio": ("sucio", "Drena el occidente antioqueño (Dabeiba, Cañasgordas, Mutatá) hasta unirse al Atrato cerca de Urabá.",
                  "Drains western Antioquia (Dabeiba, Cañasgordas, Mutatá) before joining the Atrato near Urabá.",
                  ["occidente", "uraba"], "Caribe", "Atrato - Darién"),
    "Río Mulatos": ("mulatos", "Río costero de Urabá, entre Arboletes y Necoclí, con desembocadura directa al mar Caribe.",
                     "Coastal river in Urabá, between Arboletes and Necoclí, flowing directly into the Caribbean Sea.",
                     ["uraba"], "Caribe", "Caribe - Urabá"),
    "Río San Juan de Urabá": ("san_juan_uraba", "Río costero del norte de Urabá, cerca del municipio de San Juan de Urabá.",
                                "Coastal river in northern Urabá, near the municipality of San Juan de Urabá.",
                                ["uraba"], "Caribe", "Caribe - Urabá"),
    "Río Regla": ("regla", "Drena parte del Nordeste y el Magdalena Medio antioqueños, en jurisdicción de Vegachí, Yolombó y Maceo.",
                  "Drains part of the Nordeste and Magdalena Medio regions of Antioquia, in the jurisdiction of Vegachí, Yolombó and Maceo.",
                  ["nordeste", "magdalena_medio"], "Magdalena-Cauca", "Medio Magdalena"),
    "Río Grande": ("grande", "Abastece el embalse Riogrande II, una de las principales fuentes de agua potable del Valle de Aburrá.",
                   "Supplies the Riogrande II reservoir, one of the main drinking-water sources for the Aburrá Valley.",
                   ["norte", "valle_aburra"], "Magdalena-Cauca", "Nechí"),
    "Río Guatapé": ("guatape", "Corazón del sistema de embalses de generación hidroeléctrica del oriente antioqueño (Peñol-Guatapé).",
                     "At the heart of eastern Antioquia's hydroelectric reservoir system (Peñol-Guatapé).",
                     ["oriente"], "Magdalena-Cauca", "Medio Magdalena"),
}

# Longitud TOTAL real del río (nacimiento a desembocadura), investigada en
# fuentes públicas citables — no calculada de nuestra propia geometría (que es
# incompleta). Solo se listan los ríos donde se encontró una cifra confiable;
# el resto queda sin dato en vez de inventar un número. Ver fuentes en
# Mapa/Info agua/FUENTES_DATOS_AGUA.md.
LONGITUD_OFICIAL_KM = {
    "Río Cauca":        (1350, "Wikipedia / EcuRed / Tierra Colombiana — cifra más citada"),
    "Río Magdalena":     (1540, "Wikipedia / Banrepcultural — cifra más citada"),
    "Río Atrato":        (750, "Fuentes varían 650-750 km; 750 km es la más citada recientemente"),
    "Río Nechí":         (252, "EcuRed"),
    "Río Porce":         (226, "Wikipedia (algunas fuentes académicas citan 252 km, posible confusión con el Nechí)"),
    "Río León":          (160, "CORPOURABA, Ajuste del POMCA Río León (2019) — fuente oficial"),
    "Río Arma":          (98, "Wikipedia"),
    "Río Sucio":         (170, "Wikipedia"),
    "Río Samaná Norte":  (120, "Fuentes varían 120-148 km; puede incluir el tramo del Samaná Sur/La Miel"),
    "Río Samaná Sur":    (100.9, "CORNARE, POMCA Río Samaná Sur — Fase Diagnóstico (Tabla 67), fuente oficial"),
    "Río Cocorná":       (102.2, "CORNARE, POMCA Río Cocorná — Fase Diagnóstico (Tabla 77), fuente oficial"),
    "Río San Juan (Suroeste)": (73, "CORANTIOQUIA, POMCA Río San Juan — Fase Diagnóstico 2022 (Tabla 2-73, longitud de cuenca al punto de cierre), fuente oficial"),
}

# Notas especiales cuando la línea capturada dentro de Antioquia es sabidamente
# incompleta (no porque el río salga del departamento, sino porque esta fuente
# pública no trazó bien ese tramo específico).
LONGITUD_NOTA = {
    "Río San Juan (Suroeste)": (
        "El río nace y desemboca completamente dentro de Antioquia (Andes a "
        "Bolombolo) — la cifra \"en Antioquia\" de arriba está subestimada por "
        "un trazado incompleto en esta fuente, no porque el río salga del "
        "departamento. La longitud oficial (73 km) es la que corresponde al "
        "río completo."
    ),
}

# Cuencas sin polígono propio en la capa de subzonas: solo línea de río
SOLO_LINEA = {
    "Río Cocorná": "Cocorná",
    "Río Grande": "Grande",
    "Río Guatapé": "Guatapé",
}

# Ríos con polígono de área pero sin trazado en el webmap de IDEAM (linea_key
# None en GRUPOS) — se traza desde OpenStreetMap en su lugar (ver
# fetch_osm_line). bbox elegido a mano alrededor de cada río para evitar
# nombres duplicados en otras partes de Colombia.
# nombre -> (nombre en OSM, (south, west, north, east))
OSM_LINEAS = {
    # SZH 2310 ("R. Regla" en el webmap de IDEAM, nota "ó San Bernardo") —
    # el nombre oficial en el Decreto 1640/memorias IDEAM es "Río San Bartolo
    # y otros directos al Magdalena Medio". En OpenStreetMap el cauce
    # principal está trazado como "Río San Bartolomé" (variante del mismo
    # nombre), confirmado por ser, por lejos, el curso con más longitud
    # trazada dentro del polígono de esta subzona.
    "Río Regla": ("Río San Bartolomé", (6.35, -75.20, 7.05, -74.30)),
    # "San Juan" se repite varias veces en Colombia (ver GRUPOS, comentario
    # de Río San Juan (Suroeste)) — bbox acotado a la zona costera de Urabá
    # para no mezclarlo con el San Juan del suroeste antioqueño.
    "Río San Juan de Urabá": ("Río San Juan", (8.05, -76.65, 8.85, -76.10)),
    # La línea nacional "Porce / Nechí" del webmap de IDEAM traza el tramo
    # bajo (Nechí), no el propio Porce (ver GRUPOS) — en OpenStreetMap sí
    # existe un trazado propio con el nombre "Río Porce".
    "Río Porce": ("Río Porce", (5.90, -75.80, 7.55, -74.60)),
    # La línea "Grande" del webmap de IDEAM (usada antes, ver SOLO_LINEA)
    # resultó estar mal — coincide casi exactamente (0-110 m de distancia)
    # con el propio trazado del Porce entre Gómez Plata y Amalfi/Anorí, en
    # vez de seguir el curso real del Río Grande (que nace cerca de Santa
    # Rosa de Osos/Belmira y desemboca en el embalse Riogrande II). Se
    # detectó porque, al agregar el trazado propio de Porce, los dos ríos
    # se veían idénticos en el mapa — encontrado por Sebastián al alternar
    # el chip de Río Porce y notar que la línea visible no cambiaba
    # (septiembre 2026). Reemplazado por el trazado real de OpenStreetMap.
    "Río Grande": ("Río Grande", (6.30, -75.65, 7.35, -74.80)),
}

# Área aproximada para los 3 ríos SOLO_LINEA (sin subzona propia en IDEAM):
# HYBAS_ID de HydroBASINS nivel 8 (Suramérica) cuyo polígono coincide con la
# línea ya trazada de cada río. Se superpone a propósito con el área oficial
# del río anfitrión que ya la incluye (ver areaEsAproximada en mapa.js —
# opacidad más baja + borde punteado, y nota explicativa en el panel).
HYBAS_IDS = {
    "Río Grande": (6080097460, "Río Porce"),
    "Río Cocorná": (6080102390, "Río Samaná Norte"),
    "Río Guatapé": (6080102230, "Río Samaná Norte"),
}
AREA_NOTA_ES = (
    "Área aproximada de HydroBASINS (HydroSHEDS/WWF), no de la fuente oficial de IDEAM — "
    "este afluente no tiene código de subzona propio, así que su drenaje ya está incluido "
    "dentro del área oficial de {host} (se superponen a propósito)."
)
AREA_NOTA_EN = (
    "Approximate area from HydroBASINS (HydroSHEDS/WWF), not from IDEAM's official source — "
    "this tributary has no subzone code of its own, so its drainage is already included "
    "within {host}'s official area (the overlap is intentional)."
)

LONGITUD_NOTA["Río Porce"] = (
    "La línea trazada (~138 km, fuente OpenStreetMap) cubre solo el tramo "
    "con nombre \"Río Porce\" propiamente dicho (desde la salida del Valle "
    "de Aburrá hasta la confluencia con el Nechí). La longitud oficial de "
    "226 km corresponde al río completo, incluyendo el tramo aguas arriba "
    "donde se llama Río Aburrá/Medellín."
)


def main():
    print("Descargando límite de Antioquia (GADM)...")
    antioquia = get_antioquia_boundary()

    print("Descargando webmap nacional de cuencas (IDEAM)...")
    webmap = fetch_json(IDEAM_WEBMAP_URL, "ideam_webmap")

    subz_layer = get_layer(webmap, "SubZonas Hidrográficas")
    by_szh = {}
    for f in subz_layer["featureSet"]["features"]:
        a = f["attributes"]
        geom = shape({"type": "Polygon", "coordinates": f["geometry"]["rings"]})
        geom_wgs = transform(webmerc_to_wgs84, geom)
        if not geom_wgs.is_valid:
            geom_wgs = geom_wgs.buffer(0)
        by_szh[a["SZH"]] = geom_wgs

    lines_by_name = {}
    for title in ["Ríos de Colombia (Niveles 3 a 6)", "Ríos de Colombia (Nivel 2)"]:
        layer = get_layer(webmap, title)
        for f in layer["featureSet"]["features"]:
            nom = f["attributes"].get("NomDren", "").strip()
            if not nom:
                continue
            geom = shape({"type": "MultiLineString", "coordinates": f["geometry"].get("paths", [])})
            geom_wgs = transform(webmerc_to_wgs84, geom)
            lines_by_name.setdefault(nom, []).append(geom_wgs)

    out = []
    for nombre, (codes, linea_key) in GRUPOS.items():
        cid, desc_es, desc_en, subregiones, area_h, zona_h = DESCRIPCIONES[nombre]
        entry = {
            "id": cid, "nombre": nombre,
            "descripcionEs": desc_es, "descripcionEn": desc_en,
            "subregiones": subregiones,
            "area_hidrografica": area_h, "zona_hidrografica": zona_h,
            # Nivel 3 (Subzona hidrográfica): el área se construye a partir de
            # códigos oficiales de subzona del IDEAM (ver GRUPOS más arriba).
            "nivel_ideam": 3,
        }

        geoms = [by_szh[c] for c in codes if c in by_szh]
        if geoms:
            merged = unary_union(geoms)
            clipped = merged.intersection(antioquia)
            if not clipped.is_empty:
                simplified = clipped.simplify(0.003, preserve_topology=True)
                # Buffer pequeño para cerrar micro-huecos con la cuenca vecina:
                # al simplificar cada polígono por separado, el borde compartido
                # con el de al lado no queda exactamente igual (mismo problema
                # que con las subregiones — ver feedback_geometry_maps.md).
                simplified = simplified.buffer(0.0015)
                area_km2 = clipped.area * 111 * 111 * math.cos(math.radians(clipped.centroid.y))
                entry["area_km2_aprox"] = round(area_km2)
                entry["geometry_area"] = mapping(simplified)

        if linea_key and linea_key in lines_by_name:
            merged_line = unary_union(lines_by_name[linea_key])
            antioquia_buf = antioquia.buffer(0.005)

            clipped_line = merged_line.intersection(antioquia_buf)
            if not clipped_line.is_empty:
                simplified_line = clipped_line.simplify(0.001, preserve_topology=True)
                entry["geometry_linea"] = mapping(simplified_line)
                entry["longitud_km_aprox"] = round(line_length_km(entry["geometry_linea"]))

            # Tramo fuera de Antioquia (nacimiento/desembocadura) — para seguir el
            # río completo. Se descartan tramos lejanos con el mismo nombre que
            # pertenecen a otro río (ej. "San Juan"/"Grande" se repiten en Colombia).
            outside_line = merged_line.difference(antioquia_buf)
            if not outside_line.is_empty:
                outside_line = keep_connected_parts(outside_line, antioquia)
            if outside_line is not None and not outside_line.is_empty:
                simplified_outside = outside_line.simplify(0.005, preserve_topology=True)
                entry["geometry_linea_fuera"] = mapping(simplified_outside)

        out.append(entry)

    # Cuencas adicionales con solo línea (afluentes reconocidos que la capa de
    # subzonas no separa como unidad propia a esta escala)
    for nombre, linea_key in SOLO_LINEA.items():
        cid, desc_es, desc_en, subregiones, area_h, zona_h = DESCRIPCIONES[nombre]
        antioquia_buf = antioquia.buffer(0.005)

        if nombre in OSM_LINEAS:
            # Preferido sobre la línea del webmap de IDEAM para este río — ver
            # comentario en OSM_LINEAS (línea del webmap resultó incorrecta).
            osm_name, bbox = OSM_LINEAS[nombre]
            raw_lines = fetch_osm_line(osm_name, bbox, cid)
            if not raw_lines:
                print(f"AVISO: sin línea en OSM para {nombre}")
                continue
            merged_line = linemerge(unary_union(raw_lines))
            outside_line = None
        else:
            if linea_key not in lines_by_name:
                print(f"AVISO: sin línea para {nombre}")
                continue
            merged_line = unary_union(lines_by_name[linea_key])
            outside_line = merged_line.difference(antioquia_buf)
            if not outside_line.is_empty:
                outside_line = keep_connected_parts(outside_line, antioquia)

        clipped_line = merged_line.intersection(antioquia_buf)
        if clipped_line.is_empty:
            continue
        simplified_line = clipped_line.simplify(0.001, preserve_topology=True)
        entry = {
            "id": cid, "nombre": nombre,
            "descripcionEs": desc_es, "descripcionEn": desc_en,
            "subregiones": subregiones,
            "area_hidrografica": area_h, "zona_hidrografica": zona_h,
            # Sin código propio de subzona en esta fuente — es un afluente
            # reconocido dentro de una subzona mayor (aprox. nivel 4-6, sin
            # poder precisar cuál sin la data de la Corporación correspondiente).
            "nivel_ideam": None,
            "geometry_linea": mapping(simplified_line),
            "longitud_km_aprox": round(line_length_km(mapping(simplified_line))),
        }
        if outside_line is not None and not outside_line.is_empty:
            entry["geometry_linea_fuera"] = mapping(outside_line.simplify(0.005, preserve_topology=True))

        if nombre in HYBAS_IDS:
            hybas_id, host = HYBAS_IDS[nombre]
            basin_geom = fetch_hybas_geometry(hybas_id)
            if basin_geom is not None:
                clipped_area = basin_geom.intersection(antioquia)
                if not clipped_area.is_empty:
                    simplified_area = clipped_area.simplify(0.003, preserve_topology=True)
                    area_km2 = clipped_area.area * 111 * 111 * math.cos(math.radians(clipped_area.centroid.y))
                    entry["geometry_area"] = mapping(simplified_area)
                    entry["area_km2_aprox"] = round(area_km2)
                    entry["areaEsAproximada"] = True
                    entry["area_nota"] = AREA_NOTA_ES.format(host=host)
                    entry["area_notaEn"] = AREA_NOTA_EN.format(host=host)

        out.append(entry)

    print("Trazando desde OpenStreetMap los ríos sin línea en el webmap de IDEAM...")
    antioquia_buf = antioquia.buffer(0.005)
    for entry in out:
        if entry["nombre"] not in OSM_LINEAS or "geometry_linea" in entry:
            continue
        osm_name, bbox = OSM_LINEAS[entry["nombre"]]
        raw_lines = fetch_osm_line(osm_name, bbox, entry["id"])
        if not raw_lines:
            print(f"AVISO: sin línea en OSM para {entry['nombre']}")
            continue
        merged_line = linemerge(unary_union(raw_lines))
        clipped_line = merged_line.intersection(antioquia_buf)
        if clipped_line.is_empty:
            continue
        simplified_line = clipped_line.simplify(0.001, preserve_topology=True)
        entry["geometry_linea"] = mapping(simplified_line)
        entry["longitud_km_aprox"] = round(line_length_km(entry["geometry_linea"]))

    for entry in out:
        if entry["nombre"] in LONGITUD_OFICIAL_KM:
            km, fuente = LONGITUD_OFICIAL_KM[entry["nombre"]]
            entry["longitud_total_oficial_km"] = km
            entry["longitud_total_fuente"] = fuente
        if entry["nombre"] in LONGITUD_NOTA:
            entry["longitud_nota"] = LONGITUD_NOTA[entry["nombre"]]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False))
    print(f"\n{len(out)} cuencas escritas en {OUT_PATH}")

    # Límite del departamento — capa fija de referencia, siempre visible en el mapa.
    # Sin simplificar: GADM solo trae ~2200 vértices para todo el departamento
    # (~42 KB), simplificar más lo vuelve visiblemente anguloso al hacer zoom.
    boundary_path = ROOT / "agua" / "data" / "antioquia_boundary.json"
    boundary_path.write_text(json.dumps(mapping(antioquia), ensure_ascii=False))
    print(f"Límite de Antioquia escrito en {boundary_path}")


if __name__ == "__main__":
    main()
