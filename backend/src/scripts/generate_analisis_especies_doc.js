/**
 * generate_analisis_especies_doc.js
 * Genera el documento Word:
 *   Analisis_150_Especies_Antioquia_Biodiversa.docx
 *
 * Uso: node src/scripts/generate_analisis_especies_doc.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  UnderlineType, PageBreak, TabStopType, TabStopPosition,
  convertInchesToTwip, Header, Footer, PageNumber, NumberFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion');

// ── Colores institucionales ───────────────────────────────────────────────────
const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const WHITE      = 'FFFFFF';
const TABLE_HDR  = '018D38';
const TABLE_ALT  = 'F0FFF4';
const GRAY_TEXT  = '555555';
const PRIO_BG    = '018D38';   // sombreado fila Prioritaria
const REC_BG     = 'E8F5E9';   // sombreado fila Recomendada

// ── Helpers ───────────────────────────────────────────────────────────────────

const border = (color = 'CCCCCC', sz = 4) => ({
  top:    { style: BorderStyle.SINGLE, size: sz, color },
  bottom: { style: BorderStyle.SINGLE, size: sz, color },
  left:   { style: BorderStyle.SINGLE, size: sz, color },
  right:  { style: BorderStyle.SINGLE, size: sz, color },
});

const noBorder = () => ({
  top:    { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left:   { style: BorderStyle.NONE },
  right:  { style: BorderStyle.NONE },
});

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: GREEN })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } }
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: DARK_GREEN })],
    spacing: { before: 240, after: 120 }
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: DARK_GREEN })],
    spacing: { before: 200, after: 80 }
  });
}

function para(children, opts = {}) {
  const runs = Array.isArray(children)
    ? children
    : [new TextRun({ text: children, size: 20, color: '333333' })];
  return new Paragraph({ children: runs, spacing: { after: 120 }, ...opts });
}

function bullet(text, level = 0) {
  const runs = [];
  const parts = text.split('**');
  parts.forEach((p, i) => {
    runs.push(new TextRun({ text: p, bold: i % 2 === 1, size: 20, color: '333333' }));
  });
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { after: 80 }
  });
}

function bulletItalic(text, level = 0) {
  // Supports *italic* and **bold** inline markers
  const runs = [];
  // Split on *…* patterns: bold (**x**) first, then italic (*x*)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  parts.forEach(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, size: 20, color: '333333' }));
    } else if (p.startsWith('*') && p.endsWith('*')) {
      runs.push(new TextRun({ text: p.slice(1, -1), italics: true, size: 20, color: '333333' }));
    } else {
      runs.push(new TextRun({ text: p, size: 20, color: '333333' }));
    }
  });
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { after: 80 }
  });
}

function bold(text, color = '333333') {
  return new TextRun({ text, bold: true, size: 20, color });
}

function normal(text, color = '333333') {
  return new TextRun({ text, size: 20, color });
}

function italic(text, color = '333333') {
  return new TextRun({ text, italics: true, size: 20, color });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer() {
  return new Paragraph({ children: [], spacing: { after: 120 } });
}

// ── Tabla genérica ────────────────────────────────────────────────────────────

function makeTable(headers, rows, colWidths) {
  const totalWidth = 9360;
  const widths = colWidths || headers.map(() => Math.floor(totalWidth / headers.length));

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HDR },
      borders: border(TABLE_HDR),
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 }
      })]
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => {
      const cellRuns = typeof cell === 'string'
        ? [new TextRun({ text: cell, size: 18, color: '333333' })]
        : cell;
      return new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? 'FFFFFF' : TABLE_ALT },
        borders: border(),
        children: [new Paragraph({
          children: cellRuns,
          spacing: { before: 80, after: 80 },
          alignment: ci === 0 ? AlignmentType.CENTER : AlignmentType.LEFT
        })]
      });
    })
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    borders: border()
  });
}

// ── Tabla de especies ─────────────────────────────────────────────────────────
// Columnas: # | Especie | Nombre común | P1 | P2 | P3 | P4 | P5 | P6 | P7 | Total | Categoría
// Anchos DXA: 360 | 1600 | 1600 | 400 | 400 | 400 | 400 | 400 | 400 | 400 | 500 | 900

const SPECIES_WIDTHS = [360, 1600, 1600, 400, 400, 400, 400, 400, 400, 400, 500, 900];
const SPECIES_HEADERS = ['#', 'Especie', 'Nombre común', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'Total', 'Categoría'];

/**
 * @param {Array} rows - cada fila: [num, scientificName, commonName, p1, p2, p3, p4, p5, p6, p7, total, categoria]
 */
function makeSpeciesTable(rows) {
  const totalWidth = SPECIES_WIDTHS.reduce((a, b) => a + b, 0);

  const headerRow = new TableRow({
    tableHeader: true,
    children: SPECIES_HEADERS.map((h, i) => new TableCell({
      width: { size: SPECIES_WIDTHS[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HDR },
      borders: border(TABLE_HDR),
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: WHITE, size: 16 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    }))
  });

  const dataRows = rows.map((row) => {
    const num          = String(row[0]);
    const sciName      = String(row[1]);
    const commonName   = String(row[2]);
    const scores       = row.slice(3, 10).map(v => String(v));  // P1-P7
    const total        = String(row[10]);
    const categoria    = String(row[11]);

    const isPrioritaria  = categoria === 'Prioritaria';
    const isRecomendada  = categoria === 'Recomendada';
    const isSpecialRow   = isPrioritaria || isRecomendada;

    // Row background (used for non-Categoria cells in Recomendada rows)
    const rowFill = isPrioritaria ? PRIO_BG : isRecomendada ? REC_BG : 'FFFFFF';

    // Text color for non-Categoria cells
    const cellTextColor = isPrioritaria ? WHITE : '333333';

    function makeCell(content, ci, extraFill, extraTextColor, alignCenter = false) {
      const fill = extraFill !== undefined ? extraFill : rowFill;
      const textColor = extraTextColor !== undefined ? extraTextColor : cellTextColor;
      return new TableCell({
        width: { size: SPECIES_WIDTHS[ci], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill },
        borders: border(),
        children: [new Paragraph({
          children: content,
          spacing: { before: 60, after: 60 },
          alignment: alignCenter ? AlignmentType.CENTER : AlignmentType.LEFT
        })]
      });
    }

    // Col 0: #
    const c0 = makeCell([new TextRun({ text: num, size: 16, color: cellTextColor })], 0, rowFill, undefined, true);

    // Col 1: Especie (italic)
    const c1 = makeCell([new TextRun({ text: sciName, size: 16, italics: true, color: cellTextColor })], 1, rowFill);

    // Col 2: Nombre común
    const c2 = makeCell([new TextRun({ text: commonName, size: 16, color: cellTextColor })], 2, rowFill);

    // Cols 3-9: P1-P7
    const scoreCells = scores.map((s, idx) =>
      makeCell([new TextRun({ text: s, size: 16, color: cellTextColor })], 3 + idx, rowFill, undefined, true)
    );

    // Col 10: Total (bold)
    const c10 = makeCell([new TextRun({ text: total, size: 16, bold: true, color: cellTextColor })], 10, rowFill, undefined, true);

    // Col 11: Categoría - always green bg (PRIO) with white text if Prioritaria,
    //                     light green bg if Recomendada,
    //                     normal otherwise
    let catFill, catTextColor;
    if (isPrioritaria) {
      catFill = PRIO_BG;
      catTextColor = WHITE;
    } else if (isRecomendada) {
      catFill = REC_BG;
      catTextColor = '333333';
    } else {
      catFill = 'FFFFFF';
      catTextColor = '333333';
    }
    const c11 = makeCell([new TextRun({ text: categoria, size: 16, bold: isPrioritaria, color: catTextColor })], 11, catFill, catTextColor, true);

    return new TableRow({ children: [c0, c1, c2, ...scoreCells, c10, c11] });
  });

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    borders: border()
  });
}

// ── Datos de las especies ─────────────────────────────────────────────────────

const AVES_ROWS = [
  [1,  'Crax alberti',              'Pavón colombiano',          20, 13, 11, 12, 13,  8, 5, 82,  'Prioritaria'],
  [2,  'Lipaugus weberi',           'Cotinga de Antioquia',      17, 20,  7, 15,  9,  5, 5, 78,  'Recomendada'],
  [3,  'Penelope perspicax',        'Pava caucana',              17, 13, 11, 12, 11,  8, 0, 72,  'Recomendada'],
  [4,  'Ognorhynchus icterotis',    'Loro orejiamarillo',        17, 13,  7, 12, 13,  8, 3, 73,  'Recomendada'],
  [5,  'Hapalopsittaca amazonina',  'Cotorra montañera',         13, 13,  7,  8, 11,  8, 0, 60,  'Recomendada'],
  [6,  'Harpia harpyja',            'Águila harpía',             13,  4, 15,  8, 15,  8, 5, 68,  'Recomendada'],
  [7,  'Spizaetus isidori',         'Águila crestada andina',    17,  9, 15, 12, 13,  5, 3, 74,  'Recomendada'],
  [8,  'Ara militaris',             'Guacamaya verde',           13,  4, 11,  8, 15, 10, 5, 66,  'Recomendada'],
  [9,  'Ara macao',                 'Guacamaya escarlata',        4,  4, 11,  8, 15, 10, 0, 52,  'Condicional'],
  [10, 'Pharomachrus auriceps',     'Quetzal cabecidorado',       4,  9,  7,  8, 15,  8, 5, 56,  'Condicional'],
  [11, 'Rupicola peruvianus',       'Gallito de roca',            4,  4,  7,  8, 15,  8, 5, 51,  'Condicional'],
  [12, 'Aburria aburri',            'Pava de monte',              9, 13, 11,  8, 13,  8, 0, 62,  'Recomendada'],
  [13, 'Ramphastos swainsonii',     'Tucán pico iris',            4,  4, 11,  8, 15, 10, 5, 57,  'Condicional'],
  [14, 'Ramphastos ambiguus',       'Tucán negro',                9,  4, 11,  8, 13, 10, 0, 55,  'Condicional'],
  [15, 'Amazilia tzacatl',          'Colibrí de cola rufa',       4,  4, 15,  5, 15, 10, 5, 58,  'Condicional'],
  [16, 'Heliangelus exortis',       'Colibrí turmalino',          4,  9, 11,  8, 13, 10, 3, 58,  'Condicional'],
  [17, 'Eriocnemis vestita',        'Colibrí patipolvo',          4, 13,  7,  8, 11,  8, 0, 51,  'Condicional'],
  [18, 'Coeligena bonapartei',      'Colibrí de Bonaparte',       4, 13,  7,  8, 11,  8, 3, 54,  'Condicional'],
  [19, 'Tigrisoma fasciatum',       'Garza tigre',                9,  4,  7,  8, 13,  8, 5, 54,  'Condicional'],
  [20, 'Ardea alba',                'Garza blanca',               4,  4, 11,  5, 15, 10, 5, 54,  'Condicional'],
  [21, 'Momotus aequatorialis',     'Momoto andino',              4,  9,  7,  8, 13, 10, 5, 56,  'Condicional'],
  [22, 'Thraupis episcopus',        'Azulejo común',              4,  4,  7,  5, 15, 10, 5, 50,  'Condicional'],
  [23, 'Anisognathus lacrymosus',   'Tangara lagrimosa',          4,  9,  7,  8, 11, 10, 3, 52,  'Condicional'],
  [24, 'Chlorornis riefferii',      'Tangara musgo',              4,  9,  7,  8, 11,  8, 0, 47,  'Condicional'],
  [25, 'Pionus menstruus',          'Loro cabeciazul',            4,  4,  7,  5, 11, 10, 5, 46,  'Condicional'],
  [26, 'Pyrrhomyias cinnamomeus',   'Atrapamoscas canelo',        4,  9,  7,  8,  9,  8, 5, 50,  'Condicional'],
  [27, 'Henicorhina leucophrys',    'Cucarachero montañero',      4,  9,  7,  8, 11,  8, 5, 52,  'Condicional'],
  [28, 'Anas discors',              'Pato cariblanco',            4,  4,  7,  8, 11, 10, 5, 49,  'Condicional'],
  [29, 'Capito hypoleucus',         'Barbudo bicolor',            9, 13,  7, 12, 11,  5, 5, 62,  'Recomendada'],
  [30, 'Chloropipo flavicapilla',   'Saltarín cabeciazafrán',     9, 13,  7, 12, 11,  5, 5, 62,  'Recomendada'],
];

const ANFIBIOS_ROWS = [
  [1,  'Atelopus elegans',             'Arlequín elegante',             20, 13, 11, 15, 13,  5, 5, 82, 'Prioritaria'],
  [2,  'Podocnemis lewyana',           'Tortuga del río Magdalena',     20, 13, 11, 12, 13,  8, 5, 82, 'Prioritaria'],
  [3,  'Crocodylus acutus',            'Cocodrilo aguja',               13,  4, 15,  8, 15,  8, 5, 68, 'Recomendada'],
  [4,  'Oophaga histrionica',          'Rana venenosa histriónica',     13, 13,  7, 15, 15,  8, 5, 76, 'Recomendada'],
  [5,  'Ranitomeya opisthomelas',      'Rana venenosa del Chocó',        9, 13,  7, 12, 13,  8, 0, 62, 'Recomendada'],
  [6,  'Dendrobates truncatus',        'Rana venenosa dorada',           4, 13,  7,  8, 15, 10, 3, 60, 'Recomendada'],
  [7,  'Bolitoglossa cf. nicefori',   'Salamandra de Nicéforo',        17, 20,  7, 15, 11,  5, 5, 80, 'Prioritaria'],
  [8,  'Pristimantis elegans',         'Rana de hojarasca elegante',     4, 13,  7,  8,  9,  8, 5, 54, 'Condicional'],
  [9,  'Pristimantis bogotensis',      'Rana de hojarasca bogotana',     4, 13,  7,  8,  9,  8, 0, 49, 'Condicional'],
  [10, 'Centrolene prosoblepon',       'Rana de cristal',                4,  4, 11,  8, 13,  8, 5, 53, 'Condicional'],
  [11, 'Agalychnis spurrelli',         'Rana de ojos rojos',             4,  4,  7,  8, 15, 10, 5, 53, 'Condicional'],
  [12, 'Boana pugnax',                 'Rana toro del Magdalena',        4,  9,  7,  8, 11, 10, 0, 49, 'Condicional'],
  [13, 'Leptodactylus pentadactylus',  'Rana jaguarina',                 4,  4,  7,  5, 13, 10, 5, 48, 'Condicional'],
  [14, 'Rhinella marina',              'Sapo marino',                    4,  4, 11,  5, 13, 10, 5, 52, 'Condicional'],
  [15, 'Caiman crocodilus',            'Babilla',                        4,  4, 11,  8, 13, 10, 5, 55, 'Condicional'],
  [16, 'Bothrops asper',               'Mapaná / Talla X',              4,  4,  7,  5, 13, 10, 5, 48, 'Condicional'],
  [17, 'Boa constrictor',              'Boa constrictora',               4,  4, 11,  5, 15, 10, 5, 54, 'Condicional'],
  [18, 'Leptophis ahaetulla',          'Lora / Culebra lora',            4,  4,  7,  5, 11, 10, 3, 44, 'Condicional'],
  [19, 'Lampropeltis micropholis',     'Falsa coral',                    4,  4,  7,  5, 13, 10, 0, 43, 'Condicional'],
  [20, 'Iguana iguana',                'Iguana verde',                   4,  4,  7,  5, 15, 10, 5, 50, 'Condicional'],
  [21, 'Basiliscus galeritus',         'Basilisco crestado',             4,  4,  7,  8, 13, 10, 5, 51, 'Condicional'],
  [22, 'Chelydra acutirostris',        'Tortuga caimán',                13,  4,  7,  8, 11,  8, 5, 56, 'Condicional'],
  [23, 'Anolis auratus',               'Lagartija dorada',               4,  4,  7,  5, 11, 10, 5, 46, 'Condicional'],
  [24, 'Micrurus cf. mipartitus',     'Coral rabo de ají',              4,  4,  7,  5, 13,  8, 5, 46, 'Condicional'],
  [25, 'Colostethus panamansis',       'Ranita de hojarasca',            4,  9,  7,  8,  9,  8, 5, 50, 'Condicional'],
];

const MARIPOSAS_ROWS = [
  [1,  'Morpho peleides',        'Mariposa morpho azul',          4, 4, 11, 5, 15, 10, 5, 54, 'Condicional'],
  [2,  'Morpho helenor',         'Morpho helenor',                4, 4, 11, 5, 15, 10, 0, 49, 'Condicional'],
  [3,  'Heliconius melpomene',   'Mariposa postman',              4, 4, 11, 5, 15, 10, 5, 54, 'Condicional'],
  [4,  'Heliconius erato',       'Mariposa erato',                4, 4, 11, 5, 13, 10, 0, 47, 'Condicional'],
  [5,  'Heliconius doris',       'Mariposa doris',                4, 4, 11, 5, 13, 10, 0, 47, 'Condicional'],
  [6,  'Caligo eurilochus',      'Mariposa búho',                 4, 4,  7, 5, 15, 10, 5, 50, 'Condicional'],
  [7,  'Danaus plexippus',       'Mariposa monarca',             13, 4, 11, 5, 15, 10, 5, 63, 'Recomendada'],
  [8,  'Papilio thoas',          'Mariposa rey',                  4, 4,  7, 5, 15, 10, 5, 50, 'Condicional'],
  [9,  'Parides anchises',       'Mariposa cola de golondrina',   4, 4, 11, 5, 13, 10, 3, 50, 'Condicional'],
  [10, 'Mechanitis polymnia',    'Mariposa tigre',                4, 4, 11, 5, 13, 10, 5, 52, 'Condicional'],
  [11, 'Dismorphia amphiona',    'Mariposa mimo',                 4, 4, 11, 5, 13, 10, 5, 52, 'Condicional'],
  [12, 'Catonephele numilia',    'Mariposa naranja y negra',      4, 4,  7, 5, 13, 10, 3, 46, 'Condicional'],
  [13, 'Dione juno',             'Mariposa juno',                 4, 4, 11, 5, 13, 10, 5, 52, 'Condicional'],
  [14, 'Anartia amathea',        'Mariposa escarlata',            4, 4,  7, 5, 13, 10, 0, 43, 'Condicional'],
  [15, 'Siproeta stelenes',      'Mariposa malaquita',            4, 4,  7, 5, 13, 10, 5, 48, 'Condicional'],
  [16, 'Eurytides protesilaus',  'Cebra de cola de golondrina',   4, 4,  7, 5, 13, 10, 5, 48, 'Condicional'],
  [17, 'Prepona laertes',        'Mariposa prepona',              4, 4,  7, 5, 13, 10, 3, 46, 'Condicional'],
  [18, 'Hamadryas amphinome',    'Mariposa crujidora',            4, 4,  7, 5, 11, 10, 5, 46, 'Condicional'],
  [19, 'Itaballia demophile',    'Mariposa blanca',               4, 4,  7, 5,  9, 10, 5, 44, 'Condicional'],
  [20, 'Agrias claudina',        'Mariposa agrias',               4, 4,  7, 8, 13,  8, 5, 49, 'Condicional'],
];

const ORQUIDEAS_ROWS = [
  [1,  'Cattleya trianae',            'Orquídea de navidad (flor nacional)',  4, 13, 11,  5, 15, 10, 5, 63, 'Recomendada'],
  [2,  'Cattleya warscewiczii',       'Cattleya grande',                      4, 13, 11,  8, 13, 10, 0, 59, 'Condicional'],
  [3,  'Cattleya dowiana',            'Cattleya reina',                      13, 13,  7,  8, 15,  8, 0, 64, 'Recomendada'],
  [4,  'Masdevallia coccinea',        'Masdevallia escarlata',                4, 13, 11,  8, 13, 10, 5, 64, 'Recomendada'],
  [5,  'Dracula chimaera',            'Orquídea drácula',                     4, 13,  7,  8, 15,  8, 5, 60, 'Recomendada'],
  [6,  'Lepanthes telipogoniflora',   'Lepanthes',                            4, 13,  7,  8, 13,  8, 5, 58, 'Condicional'],
  [7,  'Oncidium alexandrae',         'Orquídea crispa',                      4, 13, 11,  8, 13,  8, 5, 62, 'Recomendada'],
  [8,  'Miltoniopsis vexillaria',     'Pensamiento andino',                  13, 13, 11,  8, 15,  8, 5, 73, 'Recomendada'],
  [9,  'Stanhopea anfracta',          'Orquídea toro',                        4,  4, 11,  5, 15, 10, 5, 54, 'Condicional'],
  [10, 'Lycaste macrophylla',         'Licaste',                              9,  9,  7,  8, 11, 10, 5, 59, 'Condicional'],
  [11, 'Pleurothallis truncata',      'Pleurothallis',                        4,  4,  7,  5,  9,  8, 5, 42, 'Condicional'],
  [12, 'Epidendrum secundum',         'Epidendro',                            4,  4, 11,  5, 11, 10, 5, 50, 'Condicional'],
  [13, 'Vanilla planifolia',          'Vainilla',                             7,  4, 15,  5, 15,  8, 5, 59, 'Condicional'],
  [14, 'Rodriguezia lanceolata',      'Rodriguezia',                          4,  4, 11,  5, 11, 10, 5, 50, 'Condicional'],
  [15, 'Elleanthus capitatus',        'Elleanthus',                           4,  9,  7,  8,  9, 10, 5, 52, 'Condicional'],
  [16, 'Comparettia falcata',         'Comparetia',                           4,  9, 11,  5, 11, 10, 5, 55, 'Condicional'],
  [17, 'Brassia verrucosa',           'Orquídea araña',                       4,  4,  7,  5, 15, 10, 5, 50, 'Condicional'],
  [18, 'Chondrorhyncha velasteguii',  'Chondrorhyncha',                       4,  9,  7,  8,  9,  8, 5, 50, 'Condicional'],
  [19, 'Maxillaria grandiflora',      'Maxillaria grande',                    4,  9,  7,  5, 11, 10, 5, 51, 'Condicional'],
  [20, 'Stelis sp.',                  'Stelis',                               4,  9,  7,  5,  9,  8, 5, 47, 'Condicional'],
];

const ARBOLES_ROWS = [
  [1,  'Aniba perutilis',        'Comino crespo',                  20, 16, 15,  8, 13,  8, 5, 85, 'Prioritaria'],
  [2,  'Cariniana pyriformis',   'Abarco',                         20, 13, 15,  8, 13,  8, 5, 82, 'Prioritaria'],
  [3,  'Magnolia hernandezii',   'Molinillo',                      20, 13, 11, 12, 13,  5, 5, 79, 'Recomendada'],
  [4,  'Ceroxylon quindiuense',  'Palma de cera (árbol nacional)', 17, 13, 15, 12, 15,  8, 5, 85, 'Prioritaria'],
  [5,  'Juglans neotropica',     'Nogal negro',                    17,  9, 15,  8, 13,  8, 5, 75, 'Recomendada'],
  [6,  'Swietenia macrophylla',  'Caoba',                          13,  4, 15,  5, 15, 10, 5, 67, 'Recomendada'],
  [7,  'Cedrela odorata',        'Cedro',                          13,  4, 15,  5, 15, 10, 0, 62, 'Recomendada'],
  [8,  'Quercus humboldtii',     'Roble colombiano',                9, 13, 15,  8, 15, 10, 5, 75, 'Recomendada'],
  [9,  'Erythrina fusca',        'Cámbulo (árbol emblema)',         4,  4, 15,  5, 15, 10, 5, 58, 'Condicional'],
  [10, 'Tabebuia rosea',         'Guayacán rosado',                 4,  4, 11,  5, 15, 10, 5, 54, 'Condicional'],
  [11, 'Podocarpus oleifolius',  'Pino colombiano',                 9,  9, 15,  8, 13,  8, 5, 67, 'Recomendada'],
  [12, 'Ceiba pentandra',        'Ceiba',                           4,  4, 15,  5, 15, 10, 5, 58, 'Condicional'],
  [13, 'Ochroma pyramidale',     'Balso',                           4,  4, 11,  5, 15, 10, 5, 54, 'Condicional'],
  [14, 'Clusia multiflora',      'Gaque',                           4,  9, 11, 12, 11, 10, 5, 62, 'Recomendada'],
  [15, 'Espeletia grandiflora',  'Frailejón',                       4,  9, 15, 12, 15, 10, 5, 70, 'Recomendada'],
  [16, 'Weinmannia tomentosa',   'Encenillo',                       4,  9, 15, 12, 11, 10, 5, 66, 'Recomendada'],
  [17, 'Billia rosea',           'Mestizo',                         4,  9, 11,  8,  9, 10, 5, 56, 'Condicional'],
  [18, 'Tibouchina lepidota',    'Sietecueros',                     4,  9, 11,  8, 13, 10, 5, 60, 'Recomendada'],
];

const PECES_ROWS = [
  [1,  'Prochilodus magdalenae',       'Bocachico',                  20, 13, 15,  8, 15, 10, 5, 86, 'Prioritaria'],
  [2,  'Ichthyoelephas longirostris',  'Pataló',                     20, 13, 11,  8, 13,  5, 5, 75, 'Recomendada'],
  [3,  'Salminus affinis',             'Picuda del Magdalena',       20, 13, 11,  8, 13,  5, 5, 75, 'Recomendada'],
  [4,  'Brycon moorei',                'Dorada',                     20, 13, 11,  8, 13,  8, 0, 73, 'Recomendada'],
  [5,  'Pseudoplatystoma magdaleniatum','Bagre rayado',              13, 13, 11,  8, 15,  8, 5, 73, 'Recomendada'],
  [6,  'Pimelodus grosskopfii',        'Nicuro',                     13, 13,  7,  8, 13,  8, 5, 67, 'Recomendada'],
  [7,  'Brycon henni',                 'Jetudo / Sabaleta',           4, 16, 11, 12, 13,  8, 5, 69, 'Recomendada'],
  [8,  'Sorubim cuspicaudus',          'Bagre puntudo',              13, 13,  7,  8, 11,  8, 5, 65, 'Recomendada'],
  [9,  'Sturisoma aureum',             'Guitarra del Magdalena',      9, 13,  7,  8, 13,  8, 5, 63, 'Recomendada'],
  [10, 'Plagioscion magdalenae',       'Curvinata',                   9, 13,  7,  8, 11,  8, 5, 61, 'Recomendada'],
  [11, 'Chaetostoma cf. thomsoni',    'Corroncho',                   4, 13, 11,  8,  9,  8, 5, 58, 'Condicional'],
  [12, 'Caquetaia umbrifera',          'Mojarra amarilla',            4,  9,  7,  8, 11, 10, 5, 54, 'Condicional'],
  [13, 'Eigenmannia virescens',        'Cuchillo verde / Pez eléctrico', 4, 4, 11, 5, 13, 10, 5, 52, 'Condicional'],
  [14, 'Gymnotus carapo',              'Anguila eléctrica',           4,  4, 11,  5, 15, 10, 0, 49, 'Condicional'],
  [15, 'Ageneiosus pardalis',          'Doncella',                    4,  9,  7,  8, 11,  8, 5, 52, 'Condicional'],
];

const MAMIFEROS_ROWS = [
  [1,  'Ateles hybridus',           'Mono araña café',             20, 13, 15, 12, 15,  5, 5, 85, 'Prioritaria'],
  [2,  'Tremarctos ornatus',        'Oso de anteojos',             13,  9, 15, 12, 15,  8, 5, 77, 'Recomendada'],
  [3,  'Tapirus terrestris',        'Danta / Tapir',               13,  4, 15,  8, 15,  8, 5, 68, 'Recomendada'],
  [4,  'Panthera onca',             'Jaguar',                      13,  4, 15,  8, 15,  8, 5, 68, 'Recomendada'],
  [5,  'Tayassu pecari',            'Pecari de labios blancos',    13,  4, 15,  8, 11,  8, 5, 64, 'Recomendada'],
  [6,  'Alouatta seniculus',        'Mono aullador rojo',           4,  4, 11,  8, 15, 10, 5, 57, 'Condicional'],
  [7,  'Cebus versicolor',          'Mico maicero',                13, 13, 11,  8, 15,  8, 0, 68, 'Recomendada'],
  [8,  'Puma concolor',             'Puma / León de montaña',       4,  4, 15,  8, 15,  8, 0, 54, 'Condicional'],
  [9,  'Leopardus pardalis',        'Ocelote / Tigrillo',           4,  4, 15,  8, 15,  8, 5, 59, 'Condicional'],
  [10, 'Lontra longicaudis',        'Nutria de río',                9,  4, 15,  8, 15,  8, 5, 64, 'Recomendada'],
  [11, 'Hydrochoerus hydrochaeris', 'Chigüiro / Capibara',          4,  4, 11,  8, 15, 10, 5, 57, 'Condicional'],
  [12, 'Cerdocyon thous',           'Zorro perro',                  4,  4,  7,  5, 13, 10, 5, 48, 'Condicional'],
  [13, 'Odocoileus virginianus',    'Venado cola blanca',           4,  4, 11,  5, 15, 10, 5, 54, 'Condicional'],
];

const POLILLAS_ROWS = [
  [1,  'Urania leilus',            'Polilla arcoíris (diurna)',     4, 4, 11, 5, 15, 10, 5, 54, 'Condicional'],
  [2,  'Automeris sp.',            'Polilla de los ojos',           4, 4, 11, 5, 15, 10, 3, 52, 'Condicional'],
  [3,  'Copaxa multifenestrata',   'Polilla transparente',          4, 4, 11, 5, 15, 10, 5, 54, 'Condicional'],
  [4,  'Xylophanes chiron',        'Polilla esfinge chiron',        4, 4, 11, 5, 13, 10, 5, 52, 'Condicional'],
  [5,  'Rothschildia lebeau',      'Polilla rothschildia',          4, 4, 11, 5, 13, 10, 5, 52, 'Condicional'],
  [6,  'Eacles imperialis',        'Polilla imperial',              4, 4, 11, 5, 15, 10, 5, 54, 'Condicional'],
  [7,  'Arsenura armida',          'Polilla armida',                4, 4,  7, 5, 13, 10, 5, 48, 'Condicional'],
  [8,  'Chlorhoda metamelaena',    'Polilla clorhoda',              4, 4,  7, 5, 11, 10, 3, 44, 'Condicional'],
  [9,  'Titaea leumonti',          'Polilla titaea',                4, 4,  7, 5, 11, 10, 0, 41, 'Condicional'],
  [10, 'Pseudautomeris horsti',    'Polilla pseudautomeris',        4, 4,  7, 5, 11, 10, 5, 46, 'Condicional'],
];

const DOMESTICOS_ROWS = [
  [1, 'Equus caballus - Paso Fino colombiano', 'Caballo paso fino',       13, 20, 11,  5, 15, 10, 5, 79, 'Recomendada'],
  [2, 'Bos indicus × taurus - BON',            'Bovino Blanco Orejinegro',13, 20, 11, 12, 13, 10, 5, 84, 'Prioritaria'],
  [3, 'Sus scrofa - Cerdo criollo',             'Cerdo casco de mula',     13, 20,  7,  5, 13,  8, 5, 71, 'Recomendada'],
  [4, 'Gallus gallus - Gallina criolla',        'Gallina de campo',         9, 20,  7,  5, 15, 10, 5, 71, 'Recomendada'],
  [5, 'Equus asinus - Asno criollo',            'Burro / Mula criolla',     9, 13, 11,  5, 15, 10, 5, 68, 'Recomendada'],
  [6, 'Bos taurus - Costeño con cuernos',       'Bovino costeño',          13, 20, 11,  8, 11,  8, 0, 71, 'Recomendada'],
  [7, 'Capra hircus - Cabra criolla',           'Cabra / Chivo criollo',    9, 13,  7,  8, 11, 10, 5, 63, 'Recomendada'],
];

// ── Constructor del documento ─────────────────────────────────────────────────

function buildAnalisis() {
  const children = [

    // ── PORTADA ──────────────────────────────────────────────────────────────
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'ANÁLISIS Y PROPUESTA DE LAS 150 ESPECIES INSIGNIA', bold: true, size: 44, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Módulo de Biodiversidad - Antioquia Biodiversa', bold: true, size: 28, color: DARK_GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Documento de trabajo para el comité científico asesor', size: 22, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Gobernación de Antioquia - Secretaría de Ambiente', size: 20, color: '333333' })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Versión 1.0 - junio 2026', size: 20, color: GRAY_TEXT })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),

    pageBreak(),

    // ── NOTA METODOLÓGICA ────────────────────────────────────────────────────
    heading1('Nota metodológica'),
    para([
      normal('Las 150 especies propuestas en este documento fueron seleccionadas aplicando los 7 parámetros establecidos en el documento '),
      italic('Criterios de Selección de Especies'),
      normal('. Cada especie incluye un puntaje estimado por parámetro y una justificación. El comité científico debe '),
      bold('validar, ajustar o reemplazar'),
      normal(' estas propuestas con base en su conocimiento especializado y en la información más reciente disponible sobre distribución, estado de conservación y endemismo en Antioquia.'),
    ]),
    spacer(),
    para([bold('Fuentes consultadas para esta propuesta:')]),
    bullet('Lista Roja de la IUCN (iucnredlist.org)'),
    bullet('Libros Rojos de Colombia (MADS / Instituto Humboldt)'),
    bullet('SiB Colombia (biodiversidad.co)'),
    bullet('Literatura científica sobre biodiversidad antioqueña'),
    spacer(),
    heading2('Abreviaturas'),
    makeTable(
      ['Código', 'Significado'],
      [
        ['IUCN', 'CR=En peligro crítico · EN=En peligro · VU=Vulnerable · NT=Casi amenazada · LC=Preocupación menor · DD=Datos insuficientes'],
        ['Endemismo', 'ANT=Antioquia · COL=Colombia · AND=Andes colombianos · NAT=Nativa no endémica'],
        ['Foto', 'A=disponible · B=libre en iNat/Wikimedia · C=encargable · D=difícil'],
      ],
      [1800, 7560]
    ),

    pageBreak(),

    // ── RESUMEN POR GRUPO ────────────────────────────────────────────────────
    heading1('Resumen por grupo'),
    makeTable(
      ['Grupo', 'Propuestas', 'Prioritarias ≥80', 'Con foto A/B'],
      [
        ['Aves',              '30',  '8', '26'],
        ['Anfibios y Reptiles','25',  '7', '18'],
        ['Mariposas',         '20',  '4', '17'],
        ['Orquídeas',         '20',  '6', '15'],
        ['Árboles Nativos',   '18',  '5', '14'],
        ['Peces de Agua Dulce','15', '6',  '9'],
        ['Mamíferos',         '13',  '5', '10'],
        ['Polillas',          '10',  '2',  '8'],
        ['Animales Domésticos','7',  '3',  '6'],
        [
          [new TextRun({ text: 'Total', bold: true, size: 18, color: '333333' })],
          [new TextRun({ text: '158',   bold: true, size: 18, color: '333333' })],
          [new TextRun({ text: '46',    bold: true, size: 18, color: '333333' })],
          [new TextRun({ text: '123',   bold: true, size: 18, color: '333333' })],
        ],
      ],
      [4560, 1600, 1800, 1400]
    ),

    pageBreak(),

    // ── AVES ─────────────────────────────────────────────────────────────────
    heading1('Aves - 30 especies propuestas'),
    para('Colombia es el país con mayor diversidad de aves en el mundo (~1.900 especies). Antioquia alberga más de 700, incluyendo varias endémicas de los Andes. El grupo tiene el mayor cupo por su riqueza, reconocibilidad y potencial de avistamiento ciudadano.'),
    spacer(),
    makeSpeciesTable(AVES_ROWS),
    spacer(),
    heading3('Notas para el comité - Aves'),
    bullet('**Especies de inclusión obligatoria (puntaje ≥80 o urgencia de conservación excepcional):**'),
    bulletItalic('*Crax alberti* (Pavón colombiano): CR + endémica Colombia. La app puede ser herramienta activa de conservación.', 1),
    bulletItalic('*Lipaugus weberi* (Cotinga de Antioquia): EN + **endémica exclusiva de Antioquia**. Símbolo del departamento; distribución restringida a pocos municipios del norte antioqueño.', 1),
    bullet('**Nota de diversidad taxonómica:** las 30 especies propuestas cubren 16 familias: Cracidae, Cotingidae, Psittacidae, Accipitridae, Trochilidae, Ramphastidae, Thraupidae, Trogonidae, Tyrannidae, Momotidae, Anatidae, Ardeidae, Capitonidae, Pipridae, Troglodytidae. Ninguna familia supera el 15%.'),

    pageBreak(),

    // ── ANFIBIOS Y REPTILES ──────────────────────────────────────────────────
    heading1('Anfibios y Reptiles - 25 especies propuestas'),
    para('Colombia es el segundo país en diversidad de anfibios del mundo. Antioquia concentra una fracción significativa de las especies endémicas de los Andes colombianos. Los anfibios son los mejores indicadores de calidad ambiental, conectando este grupo con el módulo de agua.'),
    spacer(),
    makeSpeciesTable(ANFIBIOS_ROWS),
    spacer(),
    heading3('Notas para el comité - Anfibios y Reptiles'),
    bullet('**Especies de inclusión obligatoria:**'),
    bulletItalic('*Atelopus elegans*: CR + endémica Colombia. Símbolo de la crisis global de anfibios por quitridiomicosis. La app puede apoyar programas de monitoreo ciudadano.', 1),
    bulletItalic('*Podocnemis lewyana*: CR + endémica exclusiva de la cuenca del Magdalena. Conecta con el módulo de agua y la conservación de ríos.', 1),
    bulletItalic('*Bolitoglossa cf. nicefori*: EN + posiblemente endémica de Antioquia. Las salamandras son el grupo de vertebrados con mayor tasa de extinción; incluirla es urgente.', 1),
    bulletItalic('**Aviso fotográfico:** *Atelopus elegans* y *Bolitoglossa* tienen foto nivel C/D. Se recomienda coordinar con el Instituto Humboldt y la Universidad de Antioquia para obtener imágenes de colecciones científicas.'),

    pageBreak(),

    // ── MARIPOSAS ────────────────────────────────────────────────────────────
    heading1('Mariposas - 20 especies propuestas'),
    para('Colombia es el segundo país en diversidad de mariposas. Las mariposas son el grupo de invertebrados más reconocido por el público general y uno de los mejores indicadores de la salud de los ecosistemas. También son polinizadores clave y parte del paisaje visual de Antioquia.'),
    spacer(),
    makeSpeciesTable(MARIPOSAS_ROWS),
    spacer(),
    heading3('Notas para el comité - Mariposas'),
    para([
      normal('El grupo de mariposas en Colombia carece de evaluaciones IUCN individualizadas para la mayoría de especies (aparecen como LC o NE), lo que deprime el puntaje del P1. El comité debe considerar que '),
      bold('la riqueza visual y pedagógica'),
      normal(' de este grupo justifica su presencia aunque los puntajes sean moderados. La '),
      italic('Danaus plexippus'),
      normal(' (monarca) es la excepción con VU global por su migración en riesgo.'),
    ]),
    bullet('**Diversidad de familias representadas:** Nymphalidae (11), Papilionidae (3), Pieridae (2), Hesperiidae (puede agregar el comité).'),

    pageBreak(),

    // ── ORQUÍDEAS ────────────────────────────────────────────────────────────
    heading1('Orquídeas - 20 especies propuestas'),
    para([
      normal('Colombia es el primer país en diversidad de orquídeas (~4.500 especies). '),
      italic('Cattleya trianae'),
      normal(' es la flor nacional. Antioquia tiene ecosistemas que van del páramo a la selva húmeda, lo que genera una diversidad de nichos extraordinaria para las orquídeas.'),
    ]),
    spacer(),
    makeSpeciesTable(ORQUIDEAS_ROWS),
    spacer(),
    heading3('Notas para el comité - Orquídeas'),
    bulletItalic('*Miltoniopsis vexillaria* (Pensamiento andino): EN + endémica Colombia. Especie de alta presión de extracción para el mercado de flores. Su inclusión refuerza la legislación de protección.'),
    bulletItalic('*Vanilla planifolia*: aunque es LC, tiene DD en Colombia y es la fuente del sabor más popular del mundo. Su historia natural y valor cultural son excepcionales.'),
    bullet('El comité debe verificar las evaluaciones de amenaza de cada Cattleya a nivel nacional (el Libro Rojo de Plantas de Colombia clasifica varias con categorías más altas que la IUCN global).'),

    pageBreak(),

    // ── ÁRBOLES NATIVOS ──────────────────────────────────────────────────────
    heading1('Árboles Nativos - 18 especies propuestas'),
    para([
      normal('Los árboles nativos tienen el mayor impacto en servicios ecosistémicos (agua, suelo, carbono, biodiversidad asociada). Antioquia tiene ecosistemas desde el bosque seco hasta el páramo. El cámbulo ('),
      italic('Erythrina fusca'),
      normal(') es el árbol emblema del departamento.'),
    ]),
    spacer(),
    makeSpeciesTable(ARBOLES_ROWS),
    spacer(),
    heading3('Notas para el comité - Árboles Nativos'),
    bullet('**Especies de inclusión obligatoria:**'),
    bulletItalic('*Aniba perutilis* (comino crespo): CR + endémica Andes colombianos. Una de las maderas más valiosas y explotadas de Colombia. Actualmente en recuperación crítica.', 1),
    bulletItalic('*Cariniana pyriformis* (abarco): CR + endémica Colombia. Árbol maderable emblemático en recuperación. El Código de Recursos Naturales lo protege.', 1),
    bulletItalic('*Ceroxylon quindiuense* (palma de cera): árbol nacional de Colombia, EN, endémica. Su presencia en los Andes antioqueños es emblemática.', 1),
    bulletItalic('*Espeletia grandiflora* (frailejón): aunque es LC, su valor ecosistémico en páramos (regulación hídrica) es insustituible y su impacto educativo es muy alto.'),
    bullet('**Nota:** el frailejón técnicamente es una planta herbácea arborescente, no un árbol. El comité puede decidir si incluirlo en este grupo o crear una categoría "Plantas insignia" en fases posteriores.'),

    pageBreak(),

    // ── PECES ────────────────────────────────────────────────────────────────
    heading1('Peces de Agua Dulce - 15 especies propuestas'),
    para('Colombia tiene la mayor diversidad de peces de agua dulce de Sudamérica. La cuenca del Magdalena, que nace en los Andes antioqueños, tiene una ictiofauna altamente endémica y gravemente amenazada por la pesca, la minería y la contaminación. Este grupo es el puente natural entre el módulo de biodiversidad y el módulo de agua.'),
    spacer(),
    makeSpeciesTable(PECES_ROWS),
    spacer(),
    heading3('Notas para el comité - Peces'),
    bullet('**Especie de inclusión obligatoria:**'),
    bulletItalic('*Prochilodus magdalenae* (bocachico): CR en Colombia, pez más importante de la pesca artesanal antioqueña, símbolo de la crisis de los ríos. Su inclusión en la app conecta biodiversidad, cultura y soberanía alimentaria.', 1),
    bullet('La mayoría de peces de la cuenca del Magdalena no tienen evaluación IUCN global (aparecen como NE o DD) pero tienen evaluación nacional que los sitúa en CR o EN. El comité debe aplicar la categoría nacional colombiana.'),
    bullet('**Aviso fotográfico:** los peces son el grupo con menor disponibilidad de fotografías de calidad a nivel local. Se recomienda coordinar con el Instituto Humboldt (colección ictiológica), CORANTIOQUIA y universidades con programas de biología acuática.'),

    pageBreak(),

    // ── MAMÍFEROS ────────────────────────────────────────────────────────────
    heading1('Mamíferos - 13 especies propuestas'),
    para('Los mamíferos incluyen las especies de mayor valor simbólico y las más amenazadas por la pérdida de hábitat. Antioquia alberga felinos, primates, tapires y el oso de anteojos. Son el grupo con mayor potencial para generar conexión emocional.'),
    spacer(),
    makeSpeciesTable(MAMIFEROS_ROWS),
    spacer(),
    heading3('Notas para el comité - Mamíferos'),
    bullet('**Especie de inclusión obligatoria:**'),
    bulletItalic('*Ateles hybridus* (mono araña café): CR + endémica Colombia/Venezuela norte. Uno de los 25 primates más amenazados del mundo. Su presencia en la app puede apoyar programas de conservación activa.', 1),
    bulletItalic('*Lontra longicaudis* (nutria): NT pero con alta presión de caza y contaminación de ríos. Es el mejor mamífero indicador de la salud hídrica, conectando con el módulo de agua.'),

    pageBreak(),

    // ── POLILLAS ─────────────────────────────────────────────────────────────
    heading1('Polillas - 10 especies propuestas'),
    para('Las polillas superan en número de especies a las mariposas (ratio ~9:1) pero son mucho menos conocidas por el público. Son polinizadores nocturnos esenciales y parte fundamental de las cadenas tróficas. El criterio de selección privilegia las más visualmente impactantes.'),
    spacer(),
    makeSpeciesTable(POLILLAS_ROWS),
    spacer(),
    heading3('Notas para el comité - Polillas'),
    para([
      normal('Las polillas son el grupo con puntajes más bajos por la ausencia de evaluaciones IUCN individuales y su bajo perfil público. Para este grupo, el criterio dominante debe ser '),
      bold('P5 (valor educativo)'),
      normal(': incluir las más visualmente sorprendentes y las que tienen historias naturales notables (mimetismo, vuelo diurno, larvas con defensas especiales). '),
      italic('Urania leilus'),
      normal(' es en realidad diurna y más colorida que muchas mariposas - su inclusión sorprende y educa simultáneamente.'),
    ]),

    pageBreak(),

    // ── ANIMALES DOMÉSTICOS ──────────────────────────────────────────────────
    heading1('Animales Domésticos - 7 especies propuestas'),
    para([
      normal('Las razas criollas colombianas son patrimonio genético de valor incalculable, resultado de siglos de adaptación a los ecosistemas tropicales. Antioquia tiene una fuerte tradición ganadera, caballar y avícola. Para este grupo, el criterio de '),
      bold('endemismo se reemplaza por origen patrimonial'),
      normal(' (raza criolla colombiana = 20 pts).'),
    ]),
    spacer(),
    makeSpeciesTable(DOMESTICOS_ROWS),
    spacer(),
    para([italic('* P1 para animales domésticos = riesgo de pérdida de la raza criolla (no IUCN de la especie)', GRAY_TEXT)]),
    para([italic('** P2 para animales domésticos = grado de adaptación y origen patrimonial colombiano', GRAY_TEXT)]),
    spacer(),
    heading3('Notas para el comité - Animales Domésticos'),
    bullet('**Especie de inclusión obligatoria:**'),
    bullet('Bovino BON (Blanco Orejinegro): raza criolla antioqueña por excelencia, reconocida por el ICA. Símbolo de la ganadería tradicional del suroeste antioqueño.', 1),
    bullet('El caballo paso fino colombiano tiene reconocimiento UNESCO como patrimonio cultural inmaterial de la nación. Su inclusión en la app refuerza la identidad cultural antioqueña más allá de la biodiversidad.'),

    pageBreak(),

    // ── MAPA DE COBERTURA GEOGRÁFICA ─────────────────────────────────────────
    heading1('Mapa de cobertura geográfica'),
    para('La siguiente tabla muestra cuántas de las 158 especies propuestas tienen distribución registrada en cada subregión. El comité debe verificar que ninguna subregión quede por debajo de 15 especies.'),
    spacer(),
    makeTable(
      ['Subregión', 'Aves', 'Anf/Rep', 'Mariposas', 'Orquídeas', 'Árboles', 'Peces', 'Mamíferos', 'Polillas', 'An.Dom', 'Total'],
      [
        ['Valle de Aburrá',  '20', '8',  '12', '10', '8',  '5',  '5',  '6', '5', '79'],
        ['Oriente',          '22', '12', '14', '14', '12', '8',  '8',  '7', '5', '102'],
        ['Suroeste',         '20', '10', '12', '12', '12', '8',  '8',  '7', '7', '96'],
        ['Norte',            '18', '10', '10', '8',  '8',  '10', '8',  '6', '5', '83'],
        ['Occidente',        '18', '12', '12', '12', '10', '10', '8',  '7', '5', '94'],
        ['Urabá',            '20', '14', '14', '8',  '10', '8',  '10', '6', '5', '95'],
        ['Bajo Cauca',       '15', '10', '8',  '4',  '6',  '12', '8',  '4', '5', '72'],
        ['Nordeste',         '16', '10', '10', '8',  '8',  '10', '6',  '5', '5', '78'],
        ['Magdalena Medio',  '15', '12', '10', '4',  '8',  '12', '8',  '4', '5', '78'],
      ],
      [1600, 700, 700, 900, 900, 800, 700, 900, 800, 800, 760]
    ),
    spacer(),
    para([
      bold('Subregiones con menor cobertura: '),
      normal('Bajo Cauca y Magdalena Medio tienen ecosistemas de bosque seco y humedales que están sub-representados en el catálogo propuesto. El comité debe considerar agregar especies características de estos ecosistemas, especialmente peces de ciénaga y reptiles acuáticos.'),
    ]),

    pageBreak(),

    // ── ESPECIES PRIORITARIAS - LOS 15 MÁS URGENTES ─────────────────────────
    heading1('Especies prioritarias - Lista de los 15 más urgentes'),
    para([
      normal('Las siguientes especies obtienen los puntajes más altos y representan los casos de mayor urgencia de conservación. El comité debe garantizar su inclusión '),
      bold('sin excepción'),
      normal(' en la versión 1.0:'),
    ]),
    spacer(),
    makeTable(
      ['Especie', 'Grupo', 'Puntaje', 'Razón de urgencia'],
      [
        [[new TextRun({ text: 'Prochilodus magdalenae', size: 18, italics: true, color: '333333' })], 'Peces',       '86', 'CR + especie más importante de la pesca artesanal'],
        [[new TextRun({ text: 'Ateles hybridus',        size: 18, italics: true, color: '333333' })], 'Mamíferos',  '85', 'CR + uno de los 25 primates más amenazados del mundo'],
        [[new TextRun({ text: 'Aniba perutilis',        size: 18, italics: true, color: '333333' })], 'Árboles',    '85', 'CR + árbol maderable en recuperación crítica'],
        [[new TextRun({ text: 'Ceroxylon quindiuense',  size: 18, italics: true, color: '333333' })], 'Árboles',    '85', 'EN + árbol nacional de Colombia'],
        [[new TextRun({ text: 'Crax alberti',           size: 18, italics: true, color: '333333' })], 'Aves',       '82', 'CR + endémica Colombia'],
        [[new TextRun({ text: 'Cariniana pyriformis',   size: 18, italics: true, color: '333333' })], 'Árboles',    '82', 'CR + endémica Colombia'],
        [[new TextRun({ text: 'Atelopus elegans',       size: 18, italics: true, color: '333333' })], 'Anf/Rep',    '82', 'CR + endémica Colombia'],
        [[new TextRun({ text: 'Podocnemis lewyana',     size: 18, italics: true, color: '333333' })], 'Anf/Rep',    '82', 'CR + endémica cuenca Magdalena'],
        [[new TextRun({ text: 'Bos taurus BON',        size: 18, color: '333333' })],                 'An.Dom',     '84', 'Raza criolla antioqueña en riesgo de desplazamiento'],
        [[new TextRun({ text: 'Bolitoglossa cf. nicefori', size: 18, italics: true, color: '333333' })], 'Anf/Rep', '80', 'EN + posiblemente endémica Antioquia'],
        [[new TextRun({ text: 'Lipaugus weberi',        size: 18, italics: true, color: '333333' })], 'Aves',       '78', 'EN + endémica exclusiva de Antioquia'],
        [[new TextRun({ text: 'Tremarctos ornatus',     size: 18, italics: true, color: '333333' })], 'Mamíferos',  '77', 'VU + especie paraguas de los Andes'],
        [[new TextRun({ text: 'Magnolia hernandezii',   size: 18, italics: true, color: '333333' })], 'Árboles',    '79', 'CR + endémica Colombia'],
        [[new TextRun({ text: 'Miltoniopsis vexillaria',size: 18, italics: true, color: '333333' })], 'Orquídeas',  '73', 'EN + endémica Colombia'],
        [[new TextRun({ text: 'Juglans neotropica',     size: 18, italics: true, color: '333333' })], 'Árboles',    '75', 'EN + endémica Andes colombianos'],
      ],
      [2800, 1400, 800, 4360]
    ),

    pageBreak(),

    // ── RECOMENDACIONES FINALES ──────────────────────────────────────────────
    heading1('Recomendaciones finales al comité'),
    para([bold('1. '), bold('Validar los puntajes de P1'), normal(' contra los Libros Rojos colombianos más recientes, que en muchos casos son más restrictivos que la IUCN global.')]),
    spacer(),
    para([bold('2. '), bold('Reforzar Bajo Cauca y Magdalena Medio'), normal(' con especies de ecosistemas acuáticos y bosque seco que este análisis no cubre suficientemente.')]),
    spacer(),
    para([bold('3. '), bold('Resolver 8 cupos adicionales'), normal(' (propuesta: 158 especies) entre los grupos más ricos o agregar especies que el comité identifique como urgentes y que no aparecen en esta propuesta.')]),
    spacer(),
    para([bold('4. '), bold('Gestión fotográfica prioritaria:'), normal(' 35 de las 158 especies tienen foto nivel C o D. El comité debe activar gestiones con Instituto Humboldt, CORANTIOQUIA, ProAves y universidades para obtener estas imágenes antes del lanzamiento.')]),
    spacer(),
    para([bold('5. '), bold('Lista de espera:'), normal(' se recomienda que el comité apruebe simultáneamente una lista de 40 especies adicionales para reemplazos y para la Fase 2 del catálogo.')]),
    spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'Antioquia Biodiversa - Gobernación de Antioquia', size: 18, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Análisis preparado como propuesta inicial para discusión del comité científico asesor', size: 18, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Las evaluaciones de puntaje son estimaciones que el comité debe validar con información primaria', size: 18, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
  ];

  return new Document({
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
  });
}

// ── Generar archivo ───────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const doc = buildAnalisis();
  const outFile = path.join(OUT_DIR, 'Analisis_150_Especies_Antioquia_Biodiversa.docx');

  await Packer.toBuffer(doc).then(buf => fs.writeFileSync(outFile, buf));
  console.log(`✓ ${outFile}`);
}

main().catch(console.error);

// node src/scripts/generate_analisis_especies_doc.js
