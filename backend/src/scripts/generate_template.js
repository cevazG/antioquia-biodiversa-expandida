const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT = path.join(__dirname, '../../../Plantilla_Especies_AntBio.xlsx');

// ── Datos de referencia ──────────────────────────────────────────────────────

const GROUPS = [
  { id: 'aves',              kingdom: 'fauna', es: 'Aves',                en: 'Birds' },
  { id: 'anfibios_reptiles', kingdom: 'fauna', es: 'Anfibios y Reptiles', en: 'Amphibians & Reptiles' },
  { id: 'mariposas',         kingdom: 'fauna', es: 'Mariposas',           en: 'Butterflies' },
  { id: 'polillas',          kingdom: 'fauna', es: 'Polillas',            en: 'Moths' },
  { id: 'mamiferos',           kingdom: 'fauna', es: 'Mamíferos',            en: 'Mammals' },
  { id: 'animales_domesticos', kingdom: 'fauna', es: 'Animales Domésticos',  en: 'Domestic Animals' },
  { id: 'peces',               kingdom: 'fauna', es: 'Peces de Agua Dulce',  en: 'Freshwater Fish' },
  { id: 'orquideas',           kingdom: 'flora', es: 'Orquídeas',             en: 'Orchids' },
  { id: 'arboles_nativos',     kingdom: 'flora', es: 'Árboles Nativos',       en: 'Native Trees' }
];

const SUBREGIONS = [
  'uraba', 'occidente', 'norte', 'bajo_cauca', 'nordeste',
  'magdalena_medio', 'valle_aburra', 'oriente', 'suroeste'
];

const IUCN_CODES = ['LC', 'NT', 'VU', 'EN', 'CR', 'DD'];

const IUCN_DESC = {
  LC: 'Preocupación menor',
  NT: 'Casi amenazada',
  VU: 'Vulnerable',
  EN: 'En peligro',
  CR: 'En peligro crítico',
  DD: 'Datos insuficientes'
};

const FAMILIES = [
  { id: 'trogonidae',    group: 'aves',              es: 'Trogones',              en: 'Trogons' },
  { id: 'trochilidae',   group: 'aves',              es: 'Colibríes',             en: 'Hummingbirds' },
  { id: 'cracidae',      group: 'aves',              es: 'Pavas y Pavones',       en: 'Guans & Curassows' },
  { id: 'psittacidae',   group: 'aves',              es: 'Loros y Pericos',       en: 'Parrots' },
  { id: 'accipitridae',  group: 'aves',              es: 'Gavilanes y Águilas',   en: 'Hawks & Eagles' },
  { id: 'craugastoridae',group: 'anfibios_reptiles', es: 'Ranas de Lluvia',       en: 'Rain Frogs' },
  { id: 'leptodactylidae',group:'anfibios_reptiles', es: 'Ranas Leptodactílidas', en: 'Leptodactylid Frogs' },
  { id: 'hylidae',       group: 'anfibios_reptiles', es: 'Ranas de Árbol',        en: 'Tree Frogs' },
  { id: 'colubridae',    group: 'anfibios_reptiles', es: 'Serpientes Colúbridas', en: 'Colubrid Snakes' },
  { id: 'nymphalidae',   group: 'mariposas',         es: 'Ninfálidas',            en: 'Brush-footed Butterflies' },
  { id: 'hesperiidae',   group: 'mariposas',         es: 'Hespéridas',            en: 'Skipper Butterflies' },
  { id: 'pieridae',      group: 'mariposas',         es: 'Pieridias',             en: 'Whites & Sulphurs' },
  { id: 'papilionidae',  group: 'mariposas',         es: 'Papiliónidas',          en: 'Swallowtails' },
  { id: 'saturniidae',   group: 'polillas',           es: 'Polillas Gigantes',     en: 'Giant Silk Moths' },
  { id: 'erebidae',      group: 'polillas',           es: 'Polillas Érébidas',     en: 'Erebid Moths' },
  { id: 'cattleyinae',   group: 'orquideas',          es: 'Orquídeas Cattleya',   en: 'Cattleya Orchids' },
  { id: 'epidendrinae',  group: 'orquideas',          es: 'Epidendros',            en: 'Epidendrum & Allies' },
  { id: 'maxillarieae',  group: 'orquideas',          es: 'Maxilarias',            en: 'Maxillaria & Allies' },
  { id: 'oncidiinae',    group: 'orquideas',          es: 'Orquídeas Danza',       en: 'Dancing Lady Orchids' },
  { id: 'felidae',       group: 'mamiferos',          es: 'Félidos',               en: 'Felids' },
  { id: 'ursidae_andean',group: 'mamiferos',          es: 'Oso andino',            en: 'Andean Bear' },
  { id: 'cervidae',      group: 'mamiferos',          es: 'Venados',               en: 'Deer' },
  { id: 'dasypodidae',   group: 'mamiferos',          es: 'Armadillos',            en: 'Armadillos' }
];

const EXAMPLE_SPECIES = [
  {
    scientificName: 'Amazilia tzacatl',
    nameEs: 'Colibrí de cola rufa',
    nameEn: 'Rufous-tailed Hummingbird',
    group: 'aves',
    kingdom: 'fauna',
    familyId: 'trochilidae',
    familyNameEs: 'Colibríes',
    order: 'Apodiformes',
    iucn: 'LC',
    subregions: 'valle_aburra, oriente, norte',
    altitudeMin: 0,
    altitudeMax: 2500,
    endemic: 'NO',
    descriptionEs: 'Colibrí de tamaño mediano con pico largo y ligeramente curvo. El macho presenta corona verde brillante y cola de color canela rojizo característico.',
    descriptionEn: 'Medium-sized hummingbird with a long, slightly curved bill. The male has a brilliant green crown and characteristic rufous tail.',
    photos: 'aves/trochilidae/sp001_amazilia_tzacatl/amazilia_tzacatl_001.jpg, aves/trochilidae/sp001_amazilia_tzacatl/amazilia_tzacatl_002.jpg',
    featured: 'NO',
    notes: ''
  },
  {
    scientificName: 'Morpho peleides',
    nameEs: 'Mariposa Morpho Azul',
    nameEn: 'Blue Morpho Butterfly',
    group: 'mariposas',
    kingdom: 'fauna',
    familyId: 'nymphalidae',
    familyNameEs: 'Ninfálidas',
    order: 'Lepidoptera',
    iucn: 'LC',
    subregions: 'oriente, suroeste, norte',
    altitudeMin: 0,
    altitudeMax: 1400,
    endemic: 'NO',
    descriptionEs: 'Una de las mariposas más grandes del mundo. Sus alas presentan un azul iridiscente producido por microestructuras que refractan la luz, no por pigmento.',
    descriptionEn: 'One of the largest butterflies in the world. Its wings show an iridescent blue produced by microstructures that refract light, not by pigment.',
    photos: 'mariposas/nymphalidae/sp010_morpho_peleides/morpho_peleides_001.jpg',
    featured: 'SI',
    notes: 'Especie del mes mayo 2026'
  }
];

// ── Colores ──────────────────────────────────────────────────────────────────

const COLOR = {
  headerBg:     '0B5640',
  headerFont:   'FFFFFF',
  required:     'FFF3CD',
  optional:     'F0F7F0',
  example:      'E8F5E9',
  instrBg:      'F8F9FA',
  instrHeader:  '018D38',
  subheaderBg:  'D4EDDA',
  iucnLC:       'C8E6C9',
  iucnNT:       'FFF9C4',
  iucnVU:       'FFE0B2',
  iucnEN:       'FFCDD2',
  iucnCR:       'E1BEE7',
  iucnDD:       'F5F5F5'
};

// ── Columnas ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'scientificName', header: 'Nombre Científico *',  width: 30, required: true,  note: 'Género y especie en itálicas. Ej: Amazilia tzacatl' },
  { key: 'nameEs',         header: 'Nombre Común (ES) *',  width: 28, required: true,  note: 'Nombre común en español. Ej: Colibrí de cola rufa' },
  { key: 'nameEn',         header: 'Nombre Común (EN) *',  width: 28, required: true,  note: 'Nombre común en inglés. Ej: Rufous-tailed Hummingbird' },
  { key: 'group',          header: 'Grupo *',              width: 20, required: true,  note: 'Seleccionar de la lista. Valores: aves / anfibios_reptiles / mariposas / polillas / mamiferos / orquideas' },
  { key: 'kingdom',        header: 'Reino',                width: 12, required: false, note: 'Se llena automático según el grupo: fauna o flora' },
  { key: 'familyId',       header: 'ID de Familia *',      width: 20, required: true,  note: 'ID interno de la familia. Ver hoja "Familias" para la lista completa. Ej: trochilidae' },
  { key: 'familyNameEs',   header: 'Familia (referencia)', width: 22, required: false, note: 'Solo para referencia visual. El sistema usa el ID de familia.' },
  { key: 'order',          header: 'Orden taxonómico',     width: 20, required: false, note: 'Orden al que pertenece la especie. Ej: Apodiformes, Lepidoptera, Anura' },
  { key: 'iucn',           header: 'IUCN *',               width: 10, required: true,  note: 'Categoría IUCN. Seleccionar: LC / NT / VU / EN / CR / DD' },
  { key: 'subregions',     header: 'Subregiones *',        width: 40, required: true,  note: 'Subregiones separadas por coma. Valores: uraba, occidente, norte, bajo_cauca, nordeste, magdalena_medio, valle_aburra, oriente, suroeste' },
  { key: 'altitudeMin',    header: 'Altitud Mín (msnm)',   width: 16, required: false, note: 'Altitud mínima en metros sobre el nivel del mar. Ej: 0' },
  { key: 'altitudeMax',    header: 'Altitud Máx (msnm)',   width: 16, required: false, note: 'Altitud máxima en metros sobre el nivel del mar. Ej: 2500' },
  { key: 'endemic',        header: 'Endémica',             width: 12, required: false, note: 'SI si es endémica de Antioquia o Colombia. NO en caso contrario.' },
  { key: 'descriptionEs',  header: 'Descripción (ES) *',   width: 60, required: true,  note: 'Descripción en español. Mínimo 2 oraciones. Máximo 5.' },
  { key: 'descriptionEn',  header: 'Descripción (EN) *',   width: 60, required: true,  note: 'Descripción en inglés. Traducción fiel de la descripción en español.' },
  { key: 'photos',         header: 'Rutas de fotos',       width: 60, required: false, note: 'Rutas relativas separadas por coma. Ej: aves/trochilidae/sp001_amazilia/01.jpg, .../02.jpg. Ver GUIA_IMAGENES.md' },
  { key: 'featured',       header: 'Destacada',            width: 12, required: false, note: 'SI para aparecer en la portada de la app. Máximo 3 especies.' },
  { key: 'notes',          header: 'Notas internas',       width: 40, required: false, note: 'Notas del curador. No aparecen en la app.' }
];

// ── Generación ───────────────────────────────────────────────────────────────

async function generate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Antioquia Biodiversa';
  wb.created = new Date();

  // ── Hoja 1: Instrucciones ────────────────────────────────────────────────

  const instrSheet = wb.addWorksheet('📋 Instrucciones', {
    views: [{ showGridLines: false }]
  });
  instrSheet.getColumn(1).width = 25;
  instrSheet.getColumn(2).width = 80;

  const instrData = [
    ['ANTIOQUIA BIODIVERSA', 'Plantilla de carga de especies'],
    ['', ''],
    ['OBJETIVO', 'Completar esta plantilla para agregar nuevas especies a la app. Cada fila es una especie.'],
    ['', ''],
    ['HOJAS', ''],
    ['📝 Especies', 'Aquí van los datos de cada especie nueva. Una fila = una especie.'],
    ['📋 Instrucciones', 'Esta hoja — guía de uso.'],
    ['👪 Familias', 'Lista de familias existentes y sus IDs. Usar estos IDs en la columna "ID de Familia".'],
    ['🗺️ Referencia', 'Lista de subregiones, grupos e IUCN válidos.'],
    ['', ''],
    ['COLUMNAS OBLIGATORIAS', 'Marcadas con * — la especie no se importará si faltan.'],
    ['COLUMNAS OPCIONALES', 'Se pueden dejar en blanco; la app usará valores por defecto.'],
    ['', ''],
    ['FOTOS', 'Las fotos deben estar organizadas en la carpeta: biodiversidad/img/species/<grupo>/<familia>/<nombre_cientifico>/'],
    ['', 'Nombrar las fotos: nombre_cientifico_001.jpg, nombre_cientifico_002.jpg ... (la primera es la foto principal en listados)'],
    ['', 'Ejemplo: especie Trogon collaris → trogon_collaris_001.jpg, trogon_collaris_002.jpg'],
    ['', 'Formato: JPG o WebP. Peso máximo: 800 KB por foto. Resolución: máx 1200px en el lado mayor.'],
    ['', 'Ver archivo GUIA_IMAGENES.md para instrucciones detalladas.'],
    ['', ''],
    ['SUBREGIONES', 'Escribir los IDs exactamente como aparecen en la hoja Referencia, separados por coma.'],
    ['', 'Ejemplo: uraba, norte, oriente'],
    ['', ''],
    ['IUCN', 'LC = Preocupación menor | NT = Casi amenazada | VU = Vulnerable'],
    ['', 'EN = En peligro | CR = En peligro crítico | DD = Datos insuficientes'],
    ['', ''],
    ['PROCESO', ''],
    ['Paso 1', 'Completar la hoja "Especies" con los datos de cada especie.'],
    ['Paso 2', 'Organizar las fotos en las carpetas correspondientes.'],
    ['Paso 3', 'Enviar el archivo Excel al equipo técnico para importación.'],
    ['Paso 4', 'El equipo revisa y carga las especies a la base de datos.'],
    ['Paso 5', 'Las especies aparecen en la app tras la importación.'],
  ];

  instrData.forEach((row, i) => {
    const r = instrSheet.addRow(row);
    if (i === 0) {
      r.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF' + COLOR.instrHeader } };
      r.getCell(2).font = { size: 12, color: { argb: 'FF666666' } };
      r.height = 28;
    } else if (['OBJETIVO','HOJAS','COLUMNAS OBLIGATORIAS','COLUMNAS OPCIONALES','FOTOS','SUBREGIONES','IUCN','PROCESO'].includes(row[0])) {
      r.getCell(1).font = { bold: true, color: { argb: 'FF' + COLOR.instrHeader } };
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      r.height = 20;
    } else if (row[0] && !['',''].includes(row[0])) {
      r.getCell(1).font = { bold: true, color: { argb: 'FF333333' } };
    }
    r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  });

  // ── Hoja 2: Especies ─────────────────────────────────────────────────────

  const sheet = wb.addWorksheet('📝 Especies', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }]
  });

  // Fila 1: título de secciones
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = 'TAXONOMÍA';
  sheet.mergeCells('D1:E1');
  sheet.getCell('D1').value = 'GRUPO';
  sheet.mergeCells('F1:H1');
  sheet.getCell('F1').value = 'CLASIFICACIÓN';
  sheet.mergeCells('I1:I1');
  sheet.getCell('I1').value = 'CONSERV.';
  sheet.mergeCells('J1:L1');
  sheet.getCell('J1').value = 'DISTRIBUCIÓN';
  sheet.mergeCells('M1:N1');
  sheet.getCell('M1').value = 'DESCRIPCIÓN';
  sheet.mergeCells('O1:Q1');
  sheet.getCell('O1').value = 'MULTIMEDIA Y EXTRAS';

  ['A1','D1','F1','I1','J1','M1','O1'].forEach(cell => {
    sheet.getCell(cell).font = { bold: true, color: { argb: 'FF' + COLOR.headerFont }, size: 10 };
    sheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR.headerBg } };
    sheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  sheet.getRow(1).height = 22;

  // Fila 2: encabezados de columna
  const headerRow = sheet.addRow(COLUMNS.map(c => c.header));
  headerRow.height = 36;
  COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.font = { bold: true, color: { argb: 'FF' + COLOR.headerFont }, size: 9 };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: col.required ? 'FF' + COLOR.headerBg : 'FF2E7D32' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.note = col.note;
    sheet.getColumn(i + 1).width = col.width;
  });

  // Filas de ejemplo (sombreadas en verde claro)
  EXAMPLE_SPECIES.forEach(sp => {
    const rowData = COLUMNS.map(c => sp[c.key] ?? '');
    const row = sheet.addRow(rowData);
    row.height = 60;
    COLUMNS.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      cell.font = { color: { argb: 'FF555555' }, italic: true, size: 9 };
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });

  // 148 filas vacías para nuevas especies
  for (let i = 0; i < 148; i++) {
    const row = sheet.addRow(new Array(COLUMNS.length).fill(''));
    row.height = 55;
    COLUMNS.forEach((col, j) => {
      const cell = row.getCell(j + 1);
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: col.required ? 'FFFFF9E6' : 'FFFAFAFA' }
      };
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { size: 9 };
    });
  }

  // Validaciones de datos (dropdown)
  const startRow = 3;
  const endRow   = 2 + 2 + 148;
  const groupCol   = COLUMNS.findIndex(c => c.key === 'group')   + 1;
  const iucnCol    = COLUMNS.findIndex(c => c.key === 'iucn')    + 1;
  const endemicCol = COLUMNS.findIndex(c => c.key === 'endemic') + 1;
  const featuredCol= COLUMNS.findIndex(c => c.key === 'featured')+ 1;

  const colLetter = n => String.fromCharCode(64 + n);
  const dvRange   = n => `${colLetter(n)}${startRow}:${colLetter(n)}${endRow}`;

  sheet.dataValidations.add(dvRange(groupCol), {
    type: 'list',
    allowBlank: true,
    formulae: ['"aves,anfibios_reptiles,mariposas,polillas,mamiferos,animales_domesticos,peces,orquideas,arboles_nativos"']
  });
  sheet.dataValidations.add(dvRange(iucnCol), {
    type: 'list',
    allowBlank: true,
    formulae: ['"LC,NT,VU,EN,CR,DD"']
  });
  sheet.dataValidations.add(dvRange(endemicCol), {
    type: 'list', allowBlank: true, formulae: ['"SI,NO"']
  });
  sheet.dataValidations.add(dvRange(featuredCol), {
    type: 'list', allowBlank: true, formulae: ['"SI,NO"']
  });

  // ── Hoja 3: Familias ─────────────────────────────────────────────────────

  const famSheet = wb.addWorksheet('👪 Familias');
  famSheet.columns = [
    { header: 'ID (usar en plantilla)', key: 'id',    width: 22 },
    { header: 'Nombre ES',              key: 'es',    width: 28 },
    { header: 'Nombre EN',              key: 'en',    width: 28 },
    { header: 'Grupo',                  key: 'group', width: 22 }
  ];
  const famHeader = famSheet.getRow(1);
  famHeader.height = 28;
  famHeader.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FF' + COLOR.headerFont } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLOR.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  FAMILIES.forEach(f => {
    const row = famSheet.addRow(f);
    row.getCell(1).font = { bold: true, color: { argb: 'FF0B5640' } };
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF4' } };
    });
  });

  famSheet.addRow([]);
  famSheet.addRow(['* Si necesitas una familia nueva, coordina con el equipo técnico para agregarla.']);

  // ── Hoja 4: Referencia ───────────────────────────────────────────────────

  const refSheet = wb.addWorksheet('🗺️ Referencia');
  refSheet.getColumn(1).width = 24;
  refSheet.getColumn(2).width = 28;
  refSheet.getColumn(3).width = 28;
  refSheet.getColumn(4).width = 16;

  refSheet.addRow(['GRUPOS VÁLIDOS', '', '', '']).font = { bold: true, size: 12, color: { argb: 'FF' + COLOR.instrHeader } };
  refSheet.addRow(['ID (usar en plantilla)', 'Nombre ES', 'Nombre EN', 'Reino']);
  refSheet.lastRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }; });
  GROUPS.forEach(g => {
    refSheet.addRow([g.id, g.es, g.en, g.kingdom]);
    refSheet.lastRow.getCell(1).font = { bold: true, color: { argb: 'FF0B5640' } };
  });

  refSheet.addRow([]);
  refSheet.addRow(['SUBREGIONES VÁLIDAS', '', '', '']).font = { bold: true, size: 12, color: { argb: 'FF' + COLOR.instrHeader } };
  refSheet.addRow(['ID (usar en plantilla)', 'Nombre para mostrar', '', '']);
  refSheet.lastRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }; });
  const SUBREGION_NAMES = {
    uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
    bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
    magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
    oriente: 'Oriente', suroeste: 'Suroeste'
  };
  SUBREGIONS.forEach(s => {
    refSheet.addRow([s, SUBREGION_NAMES[s]]);
    refSheet.lastRow.getCell(1).font = { bold: true, color: { argb: 'FF0B5640' } };
  });

  refSheet.addRow([]);
  refSheet.addRow(['CATEGORÍAS IUCN', '', '', '']).font = { bold: true, size: 12, color: { argb: 'FF' + COLOR.instrHeader } };
  refSheet.addRow(['Código', 'Significado', '', '']);
  refSheet.lastRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }; });
  const IUCN_COLORS_EXCEL = { LC: 'C8E6C9', NT: 'FFF9C4', VU: 'FFE0B2', EN: 'FFCDD2', CR: 'E1BEE7', DD: 'F5F5F5' };
  IUCN_CODES.forEach(code => {
    const row = refSheet.addRow([code, IUCN_DESC[code]]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + IUCN_COLORS_EXCEL[code] } };
  });

  await wb.xlsx.writeFile(OUTPUT);
  console.log(`✓ Plantilla generada: ${OUTPUT}`);
}

generate().catch(console.error);
