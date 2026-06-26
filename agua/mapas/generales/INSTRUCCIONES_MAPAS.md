# Instrucciones — Mapas Generales del Módulo Agua

## ¿Qué va aquí?
Mapas del departamento de Antioquia con las redes hídricas principales:
- Mapa general de cuencas hidrográficas de Antioquia
- Mapa de fuentes hídricas superficiales (ríos, quebradas, ciénagas)
- Mapa de cuencas abastecedoras de acueductos municipales

---

## ¿Qué formato de archivo usar?

### Recomendación principal: GeoJSON ✅
Es el formato ideal para esta app web. Razones:
- Funciona directamente con JavaScript y librerías como Leaflet.js o MapLibre GL
- No requiere servidor especial — es un archivo de texto plano como el species.json de Biodiversidad
- Fácil de editar y versionar
- Soportado por QGIS, ArcGIS, Google Earth Pro

**Archivos GeoJSON a depositar aquí:**
```
generales/
├── cuencas_antioquia.geojson         ← Polígonos de todas las cuencas
├── rios_principales.geojson          ← Líneas de ríos principales
├── acueductos_cuencas.geojson        ← Cuencas abastecedoras de acueductos
└── subregiones_agua.geojson          ← Límites de subregiones (base del mapa)
```

---

## Flujo de trabajo recomendado

### Si tienes archivos Shapefile (.shp) de CORANTIOQUIA, IDEAM o IGAC:
1. Abrir en **QGIS** (gratuito)
2. Clic derecho sobre la capa → Exportar → Guardar como GeoJSON
3. Sistema de coordenadas: **EPSG:4326 (WGS 84)**
4. Depositar el .geojson en esta carpeta
5. Avisar al desarrollador para integrarlo al mapa

### Si tienes KML/KMZ (Google Earth):
```bash
# Convertir con QGIS o con ogr2ogr (GDAL):
ogr2ogr -f GeoJSON output.geojson input.kml
```

### Fuentes de datos gratuitas para empezar:
- **IGAC** (igac.gov.co) → Cartografía básica de Colombia
- **IDEAM** (ideam.gov.co) → Red hídrica nacional
- **CORANTIOQUIA** (corantioquia.gov.co) → Cuencas de Antioquia
- **Sistema de Información Ambiental de Colombia** (siac.gov.co)

---

## Especificaciones técnicas

| Parámetro | Valor recomendado |
|---|---|
| Sistema de coordenadas | WGS 84 (EPSG:4326) |
| Formato | GeoJSON |
| Tamaño máximo por archivo | < 5 MB (simplificar geometrías si es necesario) |
| Encoding | UTF-8 |

### Simplificación de geometrías
Si los archivos pesan mucho, simplificar en QGIS:
Vectorial → Herramientas de geometría → Simplificar → tolerancia 0.001°
