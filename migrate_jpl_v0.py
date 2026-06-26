#!/usr/bin/env python3
"""
migrate_jpl_v0.py
Copia las 17 fotos de JPLv0 al módulo comunidad/jovenes_pa_lante,
crea fotos_v0.json y actualiza fotos_biodiversidad.json.
Los JPGs se convierten después con optimize_photos.js.
"""

import os, json, shutil

SRC_DIR   = '/Users/sebas/Antioquia Biodiversa/Respaldo Fotos/JPLv0'
ROOT      = '/Users/sebas/Antioquia Biodiversa'
DEST_DIR  = os.path.join(ROOT, 'comunidad/jovenes_pa_lante/img/fotos/bio/v0')
DATA_DIR  = os.path.join(ROOT, 'comunidad/jovenes_pa_lante/data')
INDEX_JSON = os.path.join(DATA_DIR, 'fotos_biodiversidad.json')

# ── Datos de las 17 fotos ──────────────────────────────────────────────────
# Campos: (filename_original, especieCientifico, especieEs, especieEn,
#          participante, sector, municipio, subregion, grupo, iucn, endemica,
#          descripcionEs, descripcionEn)
FOTOS = [
    (
        'Agalychnis_terranova-ENDÉMICA-Breiner Ferney Jimenez-La Cristalina-SanFrancisco.jpg',
        'Agalychnis terranova',
        'Rana de ojos rojos de Terranova',
        'Terranova Red-eyed Treefrog',
        'Breiner Ferney Jimenez',
        'La Cristalina', 'San Francisco', 'oriente',
        'anfibios_reptiles', 'EN', True,
        'Especie endémica de Antioquia fotografiada en ribera de quebrada. Sus llamativos ojos rojos le permiten deslumbrar depredadores con un parpadeo repentino.',
        'Antioquia endemic species photographed along a stream bank. Its striking red eyes startle predators with a sudden flash when the frog opens them.',
    ),
    (
        'Andinoacara latifrons-ENDÉMICA-Miguel Alberto Basilio-Changas-Necoclí.jpg',
        'Andinoacara latifrons',
        'Mojarra amarilla',
        'Blue Acara',
        'Miguel Alberto Basilio',
        'Changas', 'Necoclí', 'uraba',
        'peces', 'LC', True,
        'Cíclido endémico de Colombia que habita ríos y ciénagas del norte de Antioquia. Se reconoce por su patrón de líneas horizontales y la mancha en el opérculo.',
        'Cichlid endemic to Colombia, inhabiting rivers and swamps in northern Antioquia. Recognized by its horizontal stripe pattern and opercular spot.',
    ),
    (
        'Andinobates opisthomelas-ENDÉMICA-Sebastian Parra-La Tupiada-SanCarlos.jpg',
        'Andinobates opisthomelas',
        'Rana venenosa de Antioquia',
        'Antioquia Poison Frog',
        'Sebastian Parra',
        'La Tupiada', 'San Carlos', 'oriente',
        'anfibios_reptiles', 'VU', True,
        'Rana dendrobátida endémica del oriente antioqueño. Su coloración aposemática advierte a los depredadores sobre su toxicidad cutánea.',
        'Dendrobatid frog endemic to eastern Antioquia. Its aposematic coloration warns predators of its skin toxicity.',
    ),
    (
        'Baryphthengus martii-Luisa Fernanda Londoño-Pocitos-San Francisco.jpg',
        'Baryphthengus martii',
        'Barranquero pechicanelo',
        'Rufous Motmot',
        'Luisa Fernanda Londoño',
        'Pocitos', 'San Francisco', 'oriente',
        'aves', 'LC', False,
        'Ave de bosque húmedo conocida por su característica cola con raquetas terminales que balancea de lado a lado. Se alimenta de frutos e insectos en el sotobosque.',
        'Humid forest bird known for its distinctive racket-tipped tail that it pendulums from side to side. Feeds on fruits and insects in the understory.',
    ),
    (
        'Bradypus variegatus-Doris Elena Florez-San Jose de Apartadó-Apartadó.jpg',
        'Bradypus variegatus',
        'Perezoso de tres dedos',
        'Brown-throated Sloth',
        'Doris Elena Florez',
        'San Jose de Apartadó', 'Apartadó', 'uraba',
        'mamiferos', 'LC', False,
        'Mamífero arborícola que pasa la mayor parte de su vida colgado del dosel. Sus movimientos lentos son una adaptación para conservar energía con una dieta de hojas.',
        'Arboreal mammal that spends most of its life hanging in the canopy. Its slow movements are an adaptation to conserve energy on a leaf diet.',
    ),
    (
        'Brycon henni-ENDÉMICA-Diomedes Velasquez-La Inmaculada-Alejandria.jpg',
        'Brycon henni',
        'Sabaleta',
        'Colombian Sabaleta',
        'Diomedes Velasquez',
        'La Inmaculada', 'Alejandría', 'nordeste',
        'peces', 'VU', True,
        'Pez endémico de los ríos andinos colombianos, clave en la dispersión de semillas al consumir frutos. Sus poblaciones han disminuido por fragmentación de hábitat.',
        'Fish endemic to Colombian Andean rivers, key seed disperser through fruit consumption. Populations have declined due to habitat fragmentation.',
    ),
    (
        'Choloepus hoffmanni-Yuliana Daza Jimenez-Guacales-San Francisco.jpg',
        'Choloepus hoffmanni',
        'Perezoso de dos dedos de Hoffmann',
        "Hoffmann's Two-toed Sloth",
        'Yuliana Daza Jimenez',
        'Guacales', 'San Francisco', 'oriente',
        'mamiferos', 'LC', False,
        'A diferencia del perezoso de tres dedos, esta especie es nocturna y más activa. Sus dos dedos forman una pinza robusta para aferrarse a las ramas del dosel.',
        'Unlike the three-toed sloth, this species is nocturnal and more active. Its two toes form a robust clamp for gripping canopy branches.',
    ),
    (
        'Crax alberti-Amarelis Orozco-AMENAZADA (VU)Las brisas-Maceo.jpg',
        'Crax alberti',
        'Paujil piquiazul',
        'Blue-billed Curassow',
        'Amarelis Orozco',
        'Las brisas', 'Maceo', 'magdalena_medio',
        'aves', 'CR', True,
        'Una de las aves más amenazadas de Colombia. Su pico azul y la carúncula naranja son únicos en el género. Habita bosques bajos del magdalena medio y norte de Antioquia.',
        "One of Colombia's most threatened birds. Its blue bill and orange knob are unique in the genus. Inhabits lowland forests of the Magdalena medio and northern Antioquia.",
    ),
    (
        'Dendropsophus ebraccatus-ENDÉMICA-Yurany Domico Suescun-Comunidad indigena Jaikerazabi-Mutatá.jpg',
        'Dendropsophus ebraccatus',
        'Rana llorona listada',
        'Pantless Treefrog',
        'Yurany Domico Suescun',
        'Comunidad Indígena Jaikerazabi', 'Mutatá', 'uraba',
        'anfibios_reptiles', 'LC', True,
        'Rana arborícola fotografiada en la comunidad indígena Embera del Urabá antioqueño. Deposita sus huevos sobre hojas que cuelgan sobre el agua.',
        'Treefrog photographed in the Embera indigenous community of Urabá. Lays eggs on leaves hanging over water, which hatch and drop tadpoles into the stream below.',
    ),
    (
        'Hypopyrrhus pyrohypogaster-ENDÉMICA-Cindy Noreidy Echeverry-San Lorenzo-Alejandria.jpg',
        'Hypopyrrhus pyrohypogaster',
        'Cacique candela',
        'Red-bellied Grackle',
        'Cindy Noreidy Echeverry',
        'San Lorenzo', 'Alejandría', 'nordeste',
        'aves', 'VU', True,
        'Icterido endémico de Colombia con vientre rojo intenso que contrasta con su plumaje negro. Habita bordes de bosques montanos andinos donde forrajea en grupos.',
        'Colombian endemic icterid with an intense red belly contrasting with its black plumage. Inhabits Andean montane forest edges, foraging in flocks.',
    ),
    (
        'Melanerpes pulcher-ENDÉMICA-Mariana Giraldo-San Pablo-San Roque.jpg',
        'Melanerpes pulcher',
        'Carpintero coroniblanco',
        'White-mantled Woodpecker',
        'Mariana Giraldo',
        'San Pablo', 'San Roque', 'nordeste',
        'aves', 'LC', True,
        'Carpintero endémico de Colombia que se distingue por su manto blanco y corona roja. Frecuenta árboles muertos en bordes de bosque y zonas abiertas arboladas.',
        'Colombian endemic woodpecker distinguished by its white mantle and red crown. Frequents dead trees at forest edges and open wooded areas.',
    ),
    (
        'Micrurus camilae-ENDÉMICA-Doris Elena Florez-San Jose de Apartadó Apartadó.jpg',
        'Micrurus camilae',
        'Coral de Camila',
        "Camila's Coral Snake",
        'Doris Elena Florez',
        'San Jose de Apartadó', 'Apartadó', 'uraba',
        'anfibios_reptiles', 'LC', True,
        'Serpiente coralina endémica descubierta en el norte de Antioquia. Sus anillos de color rojo, negro y amarillo la distinguen de otras corales de la región.',
        'Endemic coral snake discovered in northern Antioquia. Its red, black, and yellow ring pattern distinguishes it from other coral snakes in the region.',
    ),
    (
        'Oedipomidas leucopus-ENDÉMICA-Marlyn Carolina Giraldo Ospina-Pio XII-San Carlos.jpg',
        'Oedipomidas leucopus',
        'Tití pielroja',
        'White-footed Tamarin',
        'Marlyn Carolina Giraldo Ospina',
        'Pío XII', 'San Carlos', 'oriente',
        'mamiferos', 'VU', True,
        'Primate endémico de los bosques fragmentados del oriente antioqueño. Vive en grupos familiares y cumple un rol clave en la dispersión de semillas.',
        'Primate endemic to fragmented forests of eastern Antioquia. Lives in family groups and plays a key role in seed dispersal.',
    ),
    (
        'Ortalis columbiana-ENDÉMICA-Maria Liseth Lopez Bedoya-Paraguas-San Carlos.jpg',
        'Ortalis columbiana',
        'Guacharaca colombiana',
        'Colombian Chachalaca',
        'Maria Liseth Lopez Bedoya',
        'Paraguas', 'San Carlos', 'oriente',
        'aves', 'LC', True,
        'Ave gallináceas endémica de Colombia que habita bordes de bosque y zonas ribereñas. Sus vocalizaciones matutinas son un sonido característico de los bosques andinos.',
        'Galliform bird endemic to Colombia, inhabiting forest edges and riparian zones. Its morning vocalizations are a hallmark sound of Andean forests.',
    ),
    (
        'Potamotrygon magdalenae-ENDÉMICA-Karen Lorena Vargas-Bocas de Chigorodó-Carepa.jpg',
        'Potamotrygon magdalenae',
        'Raya del Magdalena',
        'Magdalena River Stingray',
        'Karen Lorena Vargas',
        'Bocas de Chigorodó', 'Carepa', 'uraba',
        'peces', 'LC', True,
        'Raya de agua dulce endémica de la cuenca del Magdalena y Cauca. Se entierra en el sustrato arenoso de los ríos bajos, donde caza moluscos y crustáceos.',
        'Freshwater stingray endemic to the Magdalena and Cauca basins. Buries itself in sandy river substrates to hunt mollusks and crustaceans.',
    ),
    (
        'Procyon lotor-Jhoan Andres Murillo-Nueva Colonia-Turbo.jpg',
        'Procyon lotor',
        'Mapache norteño',
        'Common Raccoon',
        'Jhoan Andres Murillo',
        'Nueva Colonia', 'Turbo', 'uraba',
        'mamiferos', 'LC', False,
        'Mamífero omnívoro con gran capacidad de adaptación que ha colonizado hábitats perturbados en el Urabá. Sus características «manos» le permiten manipular alimentos con destreza.',
        'Highly adaptable omnivore that has colonized disturbed habitats in Urabá. Its dexterous forepaws allow it to manipulate food with remarkable skill.',
    ),
    (
        'Rulyrana susatamai-ENDÉMICA-Diana Marcela Osorio-El anime-SantoDomingo.jpg',
        'Rulyrana susatamai',
        'Rana de cristal del Susatama',
        'Susatama Glassfrog',
        'Diana Marcela Osorio',
        'El Anime', 'Santo Domingo', 'nordeste',
        'anfibios_reptiles', 'EN', True,
        'Rana de cristal endémica del nordeste antioqueño cuya piel translúcida permite ver sus órganos internos. Deposita sus huevos bajo hojas sobre quebradas de montaña.',
        'Glass frog endemic to northeastern Antioquia whose translucent skin reveals internal organs. Lays eggs on leaves overhanging mountain streams.',
    ),
]

# ── Crear carpeta destino ──────────────────────────────────────────────────
os.makedirs(DEST_DIR, exist_ok=True)

# ── Copiar fotos ───────────────────────────────────────────────────────────
print('=== Copiando fotos ===')
fotos_json = []
for i, datos in enumerate(FOTOS, start=1):
    (orig_name, sci, nameEs, nameEn, participante,
     sector, municipio, subregion, grupo, iucn, endemica,
     descEs, descEn) = datos

    src = os.path.join(SRC_DIR, orig_name)
    if not os.path.exists(src):
        print(f'  ✗ FALTANTE: {orig_name}')
        continue

    # Copiar con nombre original; optimize_photos.js cambiará .jpg → .webp
    dst = os.path.join(DEST_DIR, orig_name)
    shutil.copy2(src, dst)
    print(f'  ✓ {orig_name}')

    # El path en JSON apunta ya al .webp (que existirá tras optimize_photos.js)
    webp_name = os.path.splitext(orig_name)[0] + '.webp'
    foto_path = f'img/fotos/bio/v0/{webp_name}'

    fotos_json.append({
        'id': f'jpl_v0_{i:03d}',
        'foto': foto_path,
        'credito': f'{participante} · {municipio}',
        'participante': participante,
        'sector': sector,
        'municipio': municipio,
        'subregion': subregion,
        'especieEs': nameEs,
        'especieEn': nameEn,
        'especieCientifico': sci,
        'grupo': grupo,
        'iucn': iucn,
        'endemica': endemica,
        'descripcionEs': descEs,
        'descripcionEn': descEn,
    })

# ── Escribir fotos_v0.json ─────────────────────────────────────────────────
v0_json_path = os.path.join(DATA_DIR, 'fotos_v0.json')
v0_data = {
    'titulo': 'Primera Versión',
    'tituloEn': 'First Edition',
    'fotos': fotos_json,
}
with open(v0_json_path, 'w', encoding='utf-8') as f:
    json.dump(v0_data, f, ensure_ascii=False, indent=2)
print(f'\n✓ {v0_json_path} ({len(fotos_json)} fotos)')

# ── Actualizar fotos_biodiversidad.json ───────────────────────────────────
with open(INDEX_JSON, 'r', encoding='utf-8') as f:
    index = json.load(f)

# Añadir v0 al FINAL (los meses recientes se muestran primero, v0 queda al final)
# Portada: primera foto de la lista
portada_webp_name = os.path.splitext(FOTOS[0][0])[0] + '.webp'
v0_entry = {
    'id': 'v0',
    'titulo': 'Primera Versión',
    'tituloEn': 'First Edition',
    'count': len(fotos_json),
    'portada': f'img/fotos/bio/v0/{portada_webp_name}',
    'archivo': 'data/fotos_v0.json',
}

# Evitar duplicados
index['meses'] = [m for m in index['meses'] if m['id'] != 'v0']
index['meses'].append(v0_entry)

with open(INDEX_JSON, 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, indent=2)
print(f'✓ {INDEX_JSON} actualizado')
print('\n✅ Migración completa. Ahora ejecuta optimize_photos.js para convertir a WebP.')
