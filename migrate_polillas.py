#!/usr/bin/env python3
"""Migración de polillas al módulo de biodiversidad."""
import os, shutil, json

ROOT     = '/Users/sebas/Antioquia Biodiversa'
SRC_BASE = f'{ROOT}/Respaldo Fotos/Polillas'
DST_BASE = f'{ROOT}/biodiversidad/img/species/gr04_polillas'
JSON_PATH= f'{ROOT}/biodiversidad/data/species.json'

# ── Definición de familias nuevas ─────────────────────────────────────────
NEW_FAMILIES = [
    {
        'id': 'geometridae', 'group': 'polillas',
        'nameEs': 'Geométridas', 'nameEn': 'Geometer Moths',
        'descriptionEs': 'Una de las familias más diversas de polillas, reconocibles por sus alas anchas que extienden planas. Sus orugas ("mide-pulgadas") se mueven arqueando el cuerpo. Muchas especies tienen coloración críptica que las hace casi invisibles sobre corteza y hojas.',
        'descriptionEn': 'One of the most diverse moth families, recognizable by their broad wings held flat. Their larvae ("inchworms") move by arching the body. Many species have cryptic coloration that makes them almost invisible on bark and leaves.',
    },
    {
        'id': 'crambidae', 'group': 'polillas',
        'nameEs': 'Polillas Crámbidas', 'nameEn': 'Grass Moths',
        'descriptionEs': 'Familia numerosa de micropolillas y polillas medianas con alas muy variables. Incluye las "polillas del pasto" y varias plagas agrícolas importantes. Algunas tienen alas semitransparentes con marcas oscuras.',
        'descriptionEn': 'A large family of micro- and medium-sized moths with highly variable wings. Includes the grass moths and several important agricultural pests. Some have semi-transparent wings with dark markings.',
    },
    {
        'id': 'lasiocampidae', 'group': 'polillas',
        'nameEs': 'Polillas Lasiocámpidas', 'nameEn': 'Lappet Moths',
        'descriptionEs': 'Polillas robustas con cuerpo peludo y antenas muy pectinadas. Las orugas suelen ser peludas y gregarias. Muchas especies presentan coloraciones crípticas que imitan corteza o madera.',
        'descriptionEn': 'Robust moths with hairy bodies and strongly pectinate antennae. Caterpillars are usually hairy and gregarious. Many species show cryptic coloration mimicking bark or wood.',
    },
    {
        'id': 'bombycidae', 'group': 'polillas',
        'nameEs': 'Bombícidas', 'nameEn': 'Silk Moths',
        'descriptionEs': 'Familia que incluye el gusano de seda domesticado. Las especies silvestres habitan bosques tropicales. Presentan alas anteriores con un ápice ganchudo característico.',
        'descriptionEn': 'Family that includes the domesticated silkworm. Wild species inhabit tropical forests. They have forewings with a characteristic hooked apex.',
    },
]

# ── Definición de todas las nuevas especies ───────────────────────────────
# (src_folder, sp_id, slug, scientific_name, name_es, name_en, family_id, iucn, desc_es, desc_en)
NEW_SPECIES = [
    # ── Erebidae (sp040103-sp040110) ──
    ('Arctiinea 4', 'sp040103', 'arctiinea_sp',
     'Arctiinea sp.', 'Polilla Árctica', 'Arctiinae Moth', 'erebidae', 'DD',
     'Polilla de la subfamilia Arctiinae, una de las más diversas de los trópicos. Muchas especies exhiben patrones de colores vivos que advierten sobre su toxicidad. Frecuente en bordes de bosque y zonas de vegetación secundaria.',
     'Moth of subfamily Arctiinae, one of the most diverse in the tropics. Many species display bright color patterns that warn predators of their toxicity. Frequent at forest edges and secondary vegetation.'),

    ('Bertholdia', 'sp040104', 'bertholdia_sp',
     'Bertholdia sp.', 'Polilla Bertholdia', 'Bertholdia Moth', 'erebidae', 'DD',
     'Género conocido por producir clics ultrasónicos que interfieren con la ecolocalización de murciélagos, siendo uno de los pocos insectos con mecanismo activo de defensa sonora contra depredadores.',
     'Genus known for producing ultrasonic clicks that interfere with bat echolocation, being one of the few insects with an active acoustic defense mechanism against predators.'),

    ('Correbia sp.', 'sp040105', 'correbia_sp',
     'Correbia sp.', 'Polilla Correbia', 'Correbia Moth', 'erebidae', 'DD',
     'Polilla de la tribu Euchromiini con coloración aposemática. Habita los bosques húmedos tropicales de la cordillera andina. Su biología y distribución exacta en Colombia son poco conocidas.',
     'Moth of tribe Euchromiini with aposematic coloration. Inhabits the humid tropical forests of the Andean cordillera. Its exact biology and distribution in Colombia are poorly known.'),

    ('Edebessa nigropuncta', 'sp040106', 'edebessa_nigropuncta',
     'Edebessa nigropuncta', 'Polilla Roja Punteada', 'Red Spotted Moth', 'erebidae', 'DD',
     'Polilla de coloración roja brillante con puntos negros sobre las alas posteriores, patrón aposemático que anuncia la presencia de compuestos tóxicos en sus tejidos. Diurna.',
     'Brightly red-colored moth with black spots on the hindwings, an aposematic pattern announcing the presence of toxic compounds in its tissues. Diurnal.'),

    ('Eulepidotis', 'sp040107', 'eulepidotis_sp',
     'Eulepidotis sp.', 'Polilla Eulepidotis', 'Eulepidotis Moth', 'erebidae', 'DD',
     'Género neotropical de la familia Erebidae con más de 100 especies descritas. Frecuente en bosques húmedos de Colombia. Sus alas muestran patrones variables de colores tierra y ocres.',
     'Neotropical genus of family Erebidae with over 100 described species. Frequent in humid forests of Colombia. Wings show variable patterns of earth tones and ochres.'),

    ('Heliura flavopunctata', 'sp040108', 'heliura_flavopunctata',
     'Heliura flavopunctata', 'Polilla de Puntos Amarillos', 'Yellow-spotted Moth', 'erebidae', 'DD',
     'Polilla de la subfamilia Arctiinae caracterizada por sus puntos amarillos sobre el cuerpo oscuro. Habita bosques húmedos y nublados de los Andes. Nocturna y atraída por fuentes de luz artificial.',
     'Moth of subfamily Arctiinae characterized by yellow spots on a dark body. Inhabits humid and cloud forests of the Andes. Nocturnal and attracted to artificial light sources.'),

    ('Uranophora walkeri', 'sp040109', 'uranophora_walkeri',
     'Uranophora walkeri', 'Polilla Naranja Rayada', 'Striped Orange Moth', 'erebidae', 'DD',
     'Polilla llamativa de color naranja intenso con franjas negras y blancas en el extremo alar. Su coloración aposemática indica toxicidad a los depredadores. Habita bordes de bosque tropical.',
     'Striking moth of intense orange color with black and white stripes at the wing tip. Its aposematic coloration signals toxicity to predators. Inhabits tropical forest edges.'),

    ('Ornarantia biferana', 'sp040110', 'ornarantia_biferana',
     'Ornarantia biferana', 'Polilla Bicolor', 'Bicolor Moth', 'erebidae', 'DD',
     'Polilla con llamativo patrón bicolor: mitad superior pardo oscura y mitad inferior ámbar con manchas negras, separadas por una banda blanca. Nocturna, frecuente en bosques húmedos.',
     'Moth with a striking bicolor pattern: dark brown upper half and amber lower half with black spots, separated by a white band. Nocturnal, frequent in humid forests.'),

    # ── Saturniidae (sp040203-sp040207) ──
    ('Adeloneivaia sp.', 'sp040203', 'adeloneivaia_sp',
     'Adeloneivaia sp.', 'Polilla Sedosa Andina', 'Andean Silk Moth', 'saturniidae', 'DD',
     'Polilla sedosa del género Adeloneivaia, endémica de los bosques andinos de Sudamérica. Pertenece a la subfamilia Ceratocampinae. Los machos presentan antenas muy pectinadas para detectar las feromonas de las hembras.',
     'Silk moth of genus Adeloneivaia, endemic to Andean forests of South America. Belongs to subfamily Ceratocampinae. Males have highly pectinate antennae to detect female pheromones.'),

    ('Ceratocampinae 1', 'sp040204', 'ceratocampinae_sp',
     'Ceratocampinae sp.', 'Polilla Imperial', 'Imperial Moth', 'saturniidae', 'DD',
     'Polilla de la subfamilia Ceratocampinae con impresionantes alas. Las orugas se alimentan de árboles nativos y no construyen capullo de seda; se purifican en el suelo.',
     'Moth of subfamily Ceratocampinae with impressive wings. Caterpillars feed on native trees and do not build a silk cocoon; they pupate underground.'),

    ('rhodirphia carminata', 'sp040205', 'rhodirphia_carminata',
     'Rhodirphia carminata', 'Polilla Carmesí', 'Crimson Silk Moth', 'saturniidae', 'DD',
     'Una de las polillas más espectaculares de Antioquia: alas carmesí y naranja encendido con manchas blancas sobre fondo grisáceo oscuro. Pertenece a la subfamilia Hemileucinae. Su coloración disuade a los depredadores.',
     'One of the most spectacular moths of Antioquia: crimson and bright orange wings with white spots on dark gray background. Belongs to subfamily Hemileucinae. Its coloration deters predators.'),

    ('Saturniidae 3', 'sp040206', 'saturniidae_sp1',
     'Saturniidae sp. 1', 'Polilla Ocelada', 'Eyed Silk Moth', 'saturniidae', 'DD',
     'Satúrnida con espectaculares ocelos (manchas en forma de ojo) en las alas posteriores que usa como mecanismo de defensa contra depredadores. Al abrirse súbitamente, los ocelos simulan los ojos de un animal más grande.',
     'Saturniid with spectacular eyespots (eye-shaped markings) on hindwings used as a defense mechanism against predators. When suddenly opened, the eyespots simulate the eyes of a larger animal.'),

    ('Saturniidae verde', 'sp040207', 'saturniidae_sp2',
     'Saturniidae sp. 2', 'Polilla Sedosa Verde', 'Green Silk Moth', 'saturniidae', 'DD',
     'Gran satúrnida de coloración verde con manchas oscuras características. Posiblemente perteneciente a la subfamilia Arsenurinae. Habita los bosques húmedos andinos y premontanos de Antioquia.',
     'Large saturniid with green coloration and characteristic dark markings. Possibly belonging to subfamily Arsenurinae. Inhabits the humid Andean and premontane forests of Antioquia.'),

    # ── Geometridae (sp040301-sp040313) ──
    ('Argyrotome prospectata', 'sp040301', 'argyrotome_prospectata',
     'Argyrotome prospectata', 'Polilla Argirotoma', 'Argyrotome Moth', 'geometridae', 'DD',
     'Geométrida de tamaño mediano con alas de tonos plateados y plateados moteados. Habita bosques húmedos de altitud media en la cordillera andina. Frecuenta bordes de bosque y áreas con vegetación secundaria.',
     'Medium-sized geometrid with silvery and mottled silver-toned wings. Inhabits mid-altitude humid forests of the Andean cordillera. Frequents forest edges and secondary vegetation.'),

    ('Certima espuma', 'sp040302', 'certima_espuma',
     'Certima espuma', 'Geométrida Anaranjada', 'Orange Geometer', 'geometridae', 'DD',
     'Geométrida de color naranja uniforme con bordes ligeramente oscuros. Las alas extendidas revelan el característico patrón de la familia con líneas transversales tenues. Nocturna y atraída por la luz.',
     'Uniformly orange geometer moth with slightly darkened borders. Extended wings reveal the characteristic family pattern with faint transverse lines. Nocturnal and attracted to light.'),

    ('Chavarriella porcius ', 'sp040303', 'chavarriella_porcius',
     'Chavarriella porcius', 'Geométrida Verde con Bordes', 'Green Bordered Geometer', 'geometridae', 'DD',
     'Hermosa geométrida verde con marcas pardas en los extremos alares. El contraste entre el verde esmeralda y los bordes marrón-púrpura la hace fácilmente reconocible. Habita los bosques nublados andinos.',
     'Beautiful green geometrid with brown markings at the wing ends. The contrast between emerald green and brown-purple borders makes it easily recognizable. Inhabits Andean cloud forests.'),

    ('Eois yvata', 'sp040304', 'eois_yvata',
     'Eois yvata', 'Geométrida Eois', 'Eois Geometer', 'geometridae', 'DD',
     'Geométrida del género Eois, uno de los más ricos en especies de la familia. Sus orugas son especialistas en el género de plantas Piper (piperáceas). Indicadora de la salud de los bosques húmedos.',
     'Geometrid of genus Eois, one of the species-richest in the family. Its caterpillars are specialists on Piper (piperaceae) plants. Indicator of humid forest health.'),

    ('Geometridae verde 1', 'sp040305', 'geometridae_sp1',
     'Geometrinae sp. 1', 'Geométrida Verde 1', 'Green Geometer 1', 'geometridae', 'DD',
     'Geométrida esmeralda de la subfamilia Geometrinae. Su coloración verde brillante le permite mimetizarse perfectamente con la vegetación. Habita los bosques húmedos premontanos de Antioquia.',
     'Emerald geometrid of subfamily Geometrinae. Its bright green coloration allows it to perfectly blend with vegetation. Inhabits the premontane humid forests of Antioquia.'),

    ('Geometridae verde 2', 'sp040306', 'geometridae_sp2',
     'Geometrinae sp. 2', 'Geométrida Verde 2', 'Green Geometer 2', 'geometridae', 'DD',
     'Geométrida verde con suaves marcas pardas en el centro de las alas. La coloración verde es producida por pigmentos de biliverdina, que se degradan con la luz y con la edad, volviendo las alas amarillas.',
     'Green geometrid with soft brown markings at the wing center. The green coloration is produced by biliverdin pigments, which degrade with light and age, turning the wings yellow.'),

    ('Geometridae verde 3', 'sp040307', 'geometridae_sp3',
     'Geometrinae sp. 3', 'Geométrida Verde con Margen Dorado', 'Gold-margined Green Geometer', 'geometridae', 'DD',
     'Espectacular geométrida verde con amplios márgenes dorados y blancos en las alas. El contraste de colores hace de esta especie una de las más llamativas del grupo en Colombia. Habita bosques húmedos.',
     'Spectacular green geometrid with broad golden and white wing margins. The color contrast makes this species one of the most striking in the group in Colombia. Inhabits humid forests.'),

    ('Geometridea tricolor mini', 'sp040308', 'geometridea_tricolor',
     'Geometridea sp.', 'Geométrida Tricolor', 'Tricolor Geometer', 'geometridae', 'DD',
     'Pequeña geométrida de tres colores con un diseño alar muy llamativo. Su tamaño reducido y colores contrastantes son características distintivas. Habita el sotobosque de los bosques húmedos andinos.',
     'Small three-colored geometrid with a very striking wing pattern. Its small size and contrasting colors are distinctive features. Inhabits the understory of Andean humid forests.'),

    ('Leuciris fimbriaria', 'sp040309', 'leuciris_fimbriaria',
     'Leuciris fimbriaria', 'Geométrida Parda Fimbriada', 'Fringed Brown Geometer', 'geometridae', 'DD',
     'Geométrida parda de tamaño mediano con bordes alares finamente festoneados. Una de las geométridas más frecuentes en los bosques andinos de Antioquia. Nocturna, vuela de agosto a enero.',
     'Medium-sized brown geometrid with finely scalloped wing margins. One of the most frequent geometrids in the Andean forests of Antioquia. Nocturnal, flies from August to January.'),

    ('Nemoria scriptaria ', 'sp040310', 'nemoria_scriptaria',
     'Nemoria scriptaria', 'Geométrida Esmeralda Escrita', 'Scripted Emerald', 'geometridae', 'DD',
     'Geométrida esmeralda con finas líneas rojas características ("scriptaria" = escrita). Las orugas se alimentan de flores y frutos inmaduros, imitando perfectamente a las estructuras reproductivas de la planta.',
     'Emerald geometrid with characteristic fine red lines ("scriptaria" = written). Caterpillars feed on flowers and immature fruits, perfectly imitating the plant\'s reproductive structures.'),

    ('Opisthoxia metargyria', 'sp040311', 'opisthoxia_metargyria',
     'Opisthoxia metargyria', 'Geométrida Metálica', 'Metallic Geometer', 'geometridae', 'DD',
     'Geométrida con reflejos plateados y metálicos en las alas. El nombre "metargyria" alude a sus brillos plateados. Especie poco documentada en Colombia, habita bosques húmedos de altitud media.',
     'Geometrid with silvery and metallic reflections on wings. The name "metargyria" alludes to its silvery sheen. Poorly documented species in Colombia, inhabits mid-altitude humid forests.'),

    ('Synchlora gerularia', 'sp040312', 'synchlora_gerularia',
     'Synchlora gerularia', 'Geométrida Verde Sinclorida', 'Synchlora Emerald', 'geometridae', 'DD',
     'Pequeña geométrida verde del género Synchlora, cuyas orugas tienen el hábito único de adornarse con pétalos de flores. La coloración verde de los adultos les sirve de camuflaje en la vegetación.',
     'Small green geometrid of genus Synchlora, whose caterpillars have the unique habit of decorating themselves with flower petals. The green coloration of adults serves as camouflage in vegetation.'),

    ('epimecis subroraria', 'sp040313', 'epimecis_subroraria',
     'Epimecis subroraria', 'Geométrida Ennomina Parda', 'Epimecis Geometer', 'geometridae', 'DD',
     'Geométrida de la subfamilia Ennominae con patrón críptico pardo que imita la corteza de los árboles. Las orugas son "mide-pulgadas" (loop caterpillars). Habita los bosques andinos de Antioquia.',
     'Geometrid of subfamily Ennominae with cryptic brown pattern that mimics tree bark. Caterpillars are "inchworms" (loop caterpillars). Inhabits the Andean forests of Antioquia.'),

    # ── Crambidae (sp040401) ──
    ('Diaphania costata', 'sp040401', 'diaphania_costata',
     'Diaphania costata', 'Polilla Diafania', 'Diaphania Moth', 'crambidae', 'DD',
     'Polilla de la familia Crambidae con alas semitransparentes y marcas oscuras características. Las larvas de algunas especies de Diaphania son plagas de cultivos de cucurbitáceas. Habita zonas tropicales húmedas.',
     'Moth of family Crambidae with semi-transparent wings and characteristic dark markings. Larvae of some Diaphania species are pests of cucurbit crops. Inhabits humid tropical zones.'),

    # ── Lasiocampidae (sp040501-sp040502) ──
    ('Antachara ecuadoriensis', 'sp040501', 'antachara_ecuadoriensis',
     'Antachara ecuadoriensis', 'Polilla Lasiocámpida Naranja', 'Orange Lappet Moth', 'lasiocampidae', 'DD',
     'Polilla lasiocámpida de coloración naranja con alas estriadas plegadas en posición de reposo. Especie registrada en Ecuador y Colombia. Sus orugas son peludas y pueden causar dermatitis por contacto.',
     'Orange lappet moth with striated wings folded at rest. Species recorded in Ecuador and Colombia. Its caterpillars are hairy and can cause contact dermatitis.'),

    ('Nesara amisena', 'sp040502', 'nesara_amisena',
     'Nesara amisena', 'Polilla Lasiocámpida Moteada', 'Spotted Lappet Moth', 'lasiocampidae', 'DD',
     'Polilla robusta con antenas muy pectinadas en el macho. Las alas anteriores crema-beige presentan llamativas manchas ovales marrón oscuro y azul-grisáceo. Habita los bosques húmedos andinos.',
     'Robust moth with highly pectinate antennae in the male. Cream-beige forewings show striking dark brown and blue-gray oval spots. Inhabits Andean humid forests.'),

    # ── Bombycidae (sp040601) ──
    ('Bombycidae 2', 'sp040601', 'bombycidae_sp',
     'Bombycidae sp.', 'Polilla Bombícida', 'Bombycid Moth', 'bombycidae', 'DD',
     'Polilla de la familia Bombycidae, emparentada con el gusano de seda doméstico (Bombyx mori). Presenta alas anteriores con el característico ápice ganchudo de la familia. Habita bosques tropicales húmedos.',
     'Moth of family Bombycidae, related to the domestic silkworm (Bombyx mori). Has forewings with the family\'s characteristic hooked apex. Inhabits tropical humid forests.'),
]

SUBREGIONS_DEFAULT = ['Urabá', 'Norte', 'Occidente', 'Oriente', 'Suroeste']

# ── 1. Crear estructura de carpetas y copiar fotos ────────────────────────
print("=== Creando estructura y copiando fotos ===")

FAMILY_DIRS = {
    'erebidae':     'fa01_erebidae',
    'saturniidae':  'fa02_saturniidae',
    'geometridae':  'fa03_geometridae',
    'crambidae':    'fa04_crambidae',
    'lasiocampidae':'fa05_lasiocampidae',
    'bombycidae':   'fa06_bombycidae',
}

copied = []
for (src_folder, sp_id, slug, sci_name, name_es, name_en, family_id, iucn, desc_es, desc_en) in NEW_SPECIES:
    src_dir = os.path.join(SRC_BASE, src_folder)
    if not os.path.isdir(src_dir):
        print(f"  ⚠️  No encontrado: {src_folder}")
        continue

    fam_dir   = FAMILY_DIRS[family_id]
    sp_folder = f'{sp_id}_{slug}'
    dst_dir   = os.path.join(DST_BASE, fam_dir, sp_folder)
    os.makedirs(dst_dir, exist_ok=True)

    # Copiar fotos con nomenclatura correcta
    photos_src = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(('.jpg','.jpeg','.png')))
    photo_urls = []
    for i, fname in enumerate(photos_src, 1):
        ext     = os.path.splitext(fname)[1].lower()
        new_name= f'{sp_id}_{slug}_{i:03d}{ext}'
        shutil.copy2(os.path.join(src_dir, fname), os.path.join(dst_dir, new_name))
        # URL will be .webp after conversion
        url = f'gr04_polillas/{fam_dir}/{sp_folder}/{sp_id}_{slug}_{i:03d}.webp'
        photo_urls.append(url)
        print(f"  ✓ {sp_folder}/{new_name}")

    copied.append({
        'id': sp_id, 'slug': slug, 'scientificName': sci_name,
        'nameEs': name_es, 'nameEn': name_en,
        'familyId': family_id, 'group': 'polillas',
        'iucn': iucn,
        'subregions': SUBREGIONS_DEFAULT,
        'descriptionEs': desc_es, 'descriptionEn': desc_en,
        'photos': photo_urls,
    })

# ── 2. Actualizar species.json ────────────────────────────────────────────
print("\n=== Actualizando species.json ===")
with open(JSON_PATH) as f:
    data = json.load(f)

existing_family_ids = {fam['id'] for fam in data['families']}
for fam in NEW_FAMILIES:
    if fam['id'] not in existing_family_ids:
        data['families'].append(fam)
        print(f"  + Familia: {fam['id']}")

existing_sp_ids = {sp['id'] for sp in data['species']}
added = 0
for sp in copied:
    if sp['id'] not in existing_sp_ids:
        data['species'].append(sp)
        added += 1

data['species'].sort(key=lambda s: s['id'])

with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"  + {added} especies nuevas añadidas")
print(f"\n✅ Listo. Ahora ejecuta optimize_photos.js para convertir a WebP.")
