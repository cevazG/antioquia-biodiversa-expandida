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

Requiere: shapely (pyproj NO es necesario — se usa la fórmula esférica de
Web Mercator directamente porque en este entorno pyproj no encuentra su base
de datos PROJ).

Uso: python3 generate_cuencas_agua.py
Escribe: agua/data/cuencas.json
"""

import json
import math
import urllib.request
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import transform, unary_union

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
        if linea_key not in lines_by_name:
            print(f"AVISO: sin línea para {nombre}")
            continue
        merged_line = unary_union(lines_by_name[linea_key])
        antioquia_buf = antioquia.buffer(0.005)
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
        outside_line = merged_line.difference(antioquia_buf)
        if not outside_line.is_empty:
            outside_line = keep_connected_parts(outside_line, antioquia)
        if outside_line is not None and not outside_line.is_empty:
            entry["geometry_linea_fuera"] = mapping(outside_line.simplify(0.005, preserve_topology=True))
        out.append(entry)

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
