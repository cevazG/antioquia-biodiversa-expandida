'use strict';
/**
 * generate_evaluacion_especies.js
 * Genera la plantilla Excel de evaluación de especies para el comité científico.
 *
 * Uso: node src/scripts/generate_evaluacion_especies.js
 */

const ExcelJS = require('exceljs');
const path    = require('path');
const fs      = require('fs');

const OUT_DIR  = path.join(__dirname, '../../../Documentos gobernacion');
const OUT_FILE = path.join(OUT_DIR, 'Evaluacion_Especies_Antioquia_Biodiversa.xlsx');
const FILAS    = 200;

// ── Colores ────────────────────────────────────────────────────────────────────
const C = {
  hdrDark:     'FF0B5640',
  hdrMid:      'FF018D38',
  hdrScore:    'FF2E7D32',
  hdrAdmin:    'FF546E7A',
  white:       'FFFFFFFF',
  rowOdd:      'FFFFFFFF',
  rowEven:     'FFF5F5F5',
  scoreOdd:    'FFFFFFFF',
  scoreEven:   'FFF1F8E9',
  prioritaria: 'FFC8E6C9',
  recomendada: 'FFFFF9C4',
  condicional: 'FFFFE0B2',
  espera:      'FFFFCDD2',
};
const FONT = 'Calibri';

// ── Parámetros ─────────────────────────────────────────────────────────────────
const PARAMS = [
  {
    col: 9,  header: 'P1 · IUCN\n(máx. 20)',
    scale: [
      ['CR · En peligro crítico',  20],
      ['EN · En peligro',          17],
      ['VU · Vulnerable',          13],
      ['NT · Casi amenazada',       9],
      ['DD · Datos insuficientes',  7],
      ['LC · Preocupación menor',   4],
    ],
  },
  {
    col: 10, header: 'P2 · Endemismo\n(máx. 20)',
    scale: [
      ['Endémica de Antioquia',    20],
      ['Endémica región andina',   16],
      ['Endémica de Colombia',     13],
      ['Cuasi-endémica',            9],
      ['Nativa no endémica',        4],
      ['Introducida / exótica',     0],
    ],
  },
  {
    col: 11, header: 'P3 · Rol ecológico\n(máx. 15)',
    scale: [
      ['Único o insustituible',        15],
      ['Importante con alternativas',  11],
      ['Moderado',                      7],
      ['Genérico',                      3],
      ['Sin documentar',                1],
    ],
  },
  {
    col: 12, header: 'P4 · Rep. geográfica\n(máx. 15)',
    scale: [
      ['Representante único de subregión',  15],
      ['Subregiones poco representadas',    12],
      ['3 a 5 subregiones',                  8],
      ['Distribución amplia (6-9 subr.)',    5],
    ],
  },
  {
    col: 13, header: 'P5a · Reconocibilidad\n(máx. 5)',
    scale: [['Alta', 5], ['Media', 3], ['Baja', 1]],
  },
  {
    col: 14, header: 'P5b · Historia natural\n(máx. 5)',
    scale: [['Rica', 5], ['Moderada', 3], ['Pobre', 1]],
  },
  {
    col: 15, header: 'P5c · Valor cultural\n(máx. 5)',
    scale: [['Alto', 5], ['Medio', 3], ['Bajo', 1]],
  },
  {
    col: 16, header: 'P6 · Foto disponible\n(máx. 10)',
    scale: [
      ['A · Foto propia disponible',         10],
      ['B · Foto libre (CC) disponible',      8],
      ['C · Foto encargable a corto plazo',   5],
      ['D · Foto difícil o largo plazo',      2],
    ],
  },
  {
    col: 17, header: 'P7 · Diversidad taxonómica\n(máx. 5)',
    scale: [
      ['Familia sin representantes',    5],
      ['Familia con 1 representante',   3],
      ['Familia con 2 representantes',  1],
      ['Familia con 3+ representantes', 0],
    ],
  },
];

const GRUPOS = [
  'Aves', 'Anfibios y Reptiles', 'Mariposas', 'Polillas',
  'Mamíferos', 'Animales Domésticos', 'Peces de Agua Dulce',
  'Orquídeas', 'Árboles Nativos',
];

const SUBREGIONES = [
  'Valle de Aburrá', 'Oriente', 'Suroeste', 'Norte', 'Occidente',
  'Urabá', 'Bajo Cauca', 'Nordeste', 'Magdalena Medio',
];

// ── Calcular posiciones de cada parámetro en la hoja Listas ───────────────────
// Estructura de cada sección: 1 título + 1 encabezado + N filas de datos + 1 blanco
// Sección Grupos: 1+1+9+1 = 12 filas → siguiente sección empieza en fila 13
function computeListasRanges() {
  let r = 13; // primera fila después de la sección Grupos
  PARAMS.forEach(p => {
    const dataStart = r + 2;              // +1 título +1 encabezado
    const dataEnd   = dataStart + p.scale.length - 1;
    p.listasDesc   = `Listas!$A$${dataStart}:$A$${dataEnd}`;   // solo col A → para el dropdown
    p.listasLookup = `Listas!$A$${dataStart}:$B$${dataEnd}`;   // cols A+B → para VLOOKUP
    r += 2 + p.scale.length + 1;         // título + encabezado + datos + blanco
  });
}

// ── Helpers de estilo ──────────────────────────────────────────────────────────
function brd(argb = 'FFBDBDBD') {
  const b = { style: 'thin', color: { argb } };
  return { top: b, bottom: b, left: b, right: b };
}

function hdrCell(cell, value, bgArgb) {
  cell.value = value;
  cell.font  = { bold: true, color: { argb: C.white }, size: 10, name: FONT };
  cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = brd();
}

function dataCell(cell, align = 'left', bgArgb = C.rowOdd) {
  cell.font      = { size: 10, name: FONT };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.alignment = { vertical: 'middle', horizontal: align };
  cell.border    = brd();
}

// ── HOJA 1: LISTADO ────────────────────────────────────────────────────────────
function buildListado(wb) {
  const ws = wb.addWorksheet('LISTADO');

  // Anchos de columna (A-V = 22 cols)
  [4, 11, 18, 26, 22, 18, 18, 28,
   18, 18, 18, 22, 14, 14, 14, 22, 22,
   8, 15, 18, 28, 35
  ].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Fila 1: título
  ws.mergeCells('A1:V1');
  const t = ws.getCell('A1');
  t.value = 'EVALUACIÓN DE ESPECIES · Antioquia Biodiversa · Comité Científico Asesor';
  t.font  = { bold: true, size: 13, color: { argb: C.white }, name: FONT };
  t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrDark } };
  t.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 28;

  // Fila 2: encabezados
  ws.getRow(2).height = 44;
  const HDRS = [
    ['#',                     C.hdrMid],
    ['Fecha',                 C.hdrMid],
    ['Evaluador(es)',          C.hdrMid],
    ['Nombre científico',     C.hdrMid],
    ['Nombre común (ES)',     C.hdrMid],
    ['Grupo',                 C.hdrMid],
    ['Familia taxonómica',    C.hdrMid],
    ['Subregiones presentes', C.hdrMid],
    ...PARAMS.map(p => [p.header, C.hdrScore]),
    ['TOTAL\n(/100)',         C.hdrDark],
    ['Categoría',             C.hdrDark],
    ['Decisión comité',       C.hdrAdmin],
    ['Fuente fotográfica',    C.hdrAdmin],
    ['Notas',                 C.hdrAdmin],
  ];
  HDRS.forEach(([v, bg], i) => hdrCell(ws.getCell(2, i + 1), v, bg));

  // Fórmula TOTAL: suma VLOOKUP de cada parámetro
  function totalFormula(r) {
    const lookups = PARAMS.map(p => {
      const col = String.fromCharCode(64 + p.col); // col 9=I, 10=J, …
      return `IFERROR(VLOOKUP(${col}${r},${p.listasLookup},2,0),0)`;
    }).join('+');
    return `=IF(I${r}="","",IFERROR(${lookups},0))`;
  }

  // Filas de datos
  const R0 = 3;
  const R1 = R0 + FILAS - 1;

  for (let r = R0; r <= R1; r++) {
    const even  = r % 2 === 0;
    const rowBg = even ? C.rowEven  : C.rowOdd;
    const scrBg = even ? C.scoreEven : C.scoreOdd;
    ws.getRow(r).height = 18;

    // A: número de fila
    const numC = ws.getCell(r, 1);
    numC.value = r - 2;
    dataCell(numC, 'center', rowBg);
    numC.font = { size: 9, color: { argb: 'FF9E9E9E' }, name: FONT };

    // B: fecha
    const dateC = ws.getCell(r, 2);
    dataCell(dateC, 'center', rowBg);
    dateC.numFmt = 'dd/mm/yyyy';

    // C–H: texto libre
    for (let c = 3; c <= 8; c++) dataCell(ws.getCell(r, c), 'left', rowBg);

    // F (col 6): dropdown grupos desde Listas
    ws.getCell(r, 6).dataValidation = {
      type: 'list', allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Grupo inválido',
      error: 'Seleccione un grupo de la lista',
      formulae: ['Listas!$A$3:$A$11'],
    };

    // I–Q (cols 9-17): dropdown con descripciones desde Listas
    PARAMS.forEach(p => {
      const cell = ws.getCell(r, p.col);
      dataCell(cell, 'left', scrBg);
      cell.font = { size: 10, name: FONT };
      cell.dataValidation = {
        type: 'list', allowBlank: true,
        showErrorMessage: true,
        errorTitle: 'Valor inválido',
        error: 'Seleccione una opción de la lista desplegable',
        formulae: [p.listasDesc],
      };
    });

    // R (col 18): TOTAL via VLOOKUP
    const totC = ws.getCell(r, 18);
    totC.value = { formula: totalFormula(r) };
    totC.font  = { bold: true, size: 11, name: FONT };
    totC.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    totC.alignment = { vertical: 'middle', horizontal: 'center' };
    totC.border = brd();
    totC.numFmt = '0';

    // S (col 19): Categoría
    const catC = ws.getCell(r, 19);
    catC.value = {
      formula: `=IF(I${r}="","",IF(R${r}>=80,"Prioritaria",IF(R${r}>=60,"Recomendada",IF(R${r}>=40,"Condicional","Lista de espera"))))`,
    };
    catC.font  = { bold: true, size: 10, name: FONT };
    catC.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    catC.alignment = { vertical: 'middle', horizontal: 'center' };
    catC.border = brd();

    // T (col 20): decisión dropdown
    const decC = ws.getCell(r, 20);
    dataCell(decC, 'center', rowBg);
    decC.dataValidation = {
      type: 'list', allowBlank: true,
      formulae: ['"Incluida,Lista de espera,Excluida,Pendiente revisión"'],
    };

    // U–V: fuente foto y notas
    dataCell(ws.getCell(r, 21), 'left', rowBg);
    dataCell(ws.getCell(r, 22), 'left', rowBg);
  }

  // Formato condicional — Categoría (col S)
  ws.addConditionalFormatting({
    ref: `S${R0}:S${R1}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'Prioritaria',     priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.prioritaria } }, font: { bold: true, name: FONT } } },
      { type: 'containsText', operator: 'containsText', text: 'Recomendada',     priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.recomendada } }, font: { bold: true, name: FONT } } },
      { type: 'containsText', operator: 'containsText', text: 'Condicional',     priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.condicional } }, font: { bold: true, name: FONT } } },
      { type: 'containsText', operator: 'containsText', text: 'Lista de espera', priority: 4, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.espera     } }, font: { bold: true, name: FONT } } },
    ],
  });

  // Formato condicional — TOTAL (col R)
  ws.addConditionalFormatting({
    ref: `R${R0}:R${R1}`,
    rules: [
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [80],     priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.prioritaria } } } },
      { type: 'cellIs', operator: 'between',            formulae: [60, 79], priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.recomendada } } } },
      { type: 'cellIs', operator: 'between',            formulae: [40, 59], priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.condicional } } } },
      { type: 'cellIs', operator: 'between',            formulae: [1,  39], priority: 4, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.espera     } } } },
    ],
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 22 } };
  ws.views = [{ state: 'frozen', xSplit: 5, ySplit: 2 }];
}

// ── HOJA 2: INSTRUCCIONES ──────────────────────────────────────────────────────
function buildInstrucciones(wb) {
  const ws = wb.addWorksheet('INSTRUCCIONES');
  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 54;
  ws.getColumn(4).width = 18;

  let r = 1;

  function title(text) {
    ws.mergeCells(`A${r}:D${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font  = { bold: true, size: 13, color: { argb: C.white }, name: FONT };
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrDark } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(r).height = 26;
    r++;
  }

  function section(text) {
    ws.mergeCells(`A${r}:D${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font  = { bold: true, size: 11, color: { argb: C.white }, name: FONT };
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrMid } };
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(r).height = 22;
    r++;
  }

  function tHead(...cols) {
    ws.getRow(r).height = 18;
    cols.forEach((v, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = v; c.font = { bold: true, size: 10, color: { argb: C.white }, name: FONT };
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrScore } };
      c.alignment = { vertical: 'middle', horizontal: 'center' }; c.border = brd();
    });
    r++;
  }

  function tRow(vals, even) {
    const bg = even ? C.rowEven : C.rowOdd;
    ws.getRow(r).height = 16;
    vals.forEach((v, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = v; c.font = { size: 10, name: FONT };
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'center' : 'left', indent: i === 0 ? 1 : 0, wrapText: true };
      c.border = brd();
    });
    r++;
  }

  function blank() { r++; }

  title('INSTRUCCIONES — Plantilla de Evaluación de Especies · Antioquia Biodiversa');
  blank();

  section('¿Cómo usar esta plantilla?');
  [
    '1.  Ir a la hoja LISTADO.',
    '2.  Completar una fila por especie evaluada.',
    '3.  Ingresar los datos de identificación: nombre científico, nombre común, grupo, familia y subregiones (columnas A–H).',
    '4.  En las columnas P1–P7 (I–Q) abrir el desplegable y seleccionar la descripción que corresponda a la especie.',
    '5.  El TOTAL (col R) y la Categoría (col S) se calculan automáticamente con colores.',
    '6.  Registrar la Decisión del comité (col T), la fuente fotográfica (U) y observaciones (V).',
    '7.  Usar los filtros de la fila 2 para ver por grupo, categoría, decisión o evaluador.',
    '8.  P4 (representación geográfica) y P7 (diversidad taxonómica) son dinámicos — revisar al final de cada sesión.',
  ].forEach((text, i) => {
    ws.mergeCells(`A${r}:D${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text; c.font = { size: 10, name: FONT };
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? C.rowOdd : C.rowEven } };
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 2, wrapText: true };
    ws.getRow(r).height = 16;
    r++;
  });
  blank();

  section('Interpretación del puntaje total (/100)');
  tHead('Rango', 'Pts', 'Categoría', 'Decisión recomendada');
  [
    ['80 – 100', '≥80', 'Prioritaria',     'Debe estar en versión 1.0 sin excepción'],
    ['60 – 79',  '≥60', 'Recomendada',     'Incluir dentro del cupo disponible del grupo'],
    ['40 – 59',  '≥40', 'Condicional',     'Incluir si hay cupo y cumple cuota mínima'],
    ['< 40',     '<40', 'Lista de espera', 'Reservar para Fase 2 o reemplazos'],
  ].forEach((row, i) => tRow(row, i % 2 === 0));
  blank();

  // Escala de cada parámetro
  PARAMS.forEach(p => {
    section(p.header.replace('\n', ' — '));
    tHead('Descripción (opción del desplegable)', 'Pts', 'Notas');
    p.scale.forEach(([desc, pts], i) => tRow([desc, pts, ''], i % 2 === 0));
    blank();
  });

  section('Cuotas mínimas por grupo taxonómico');
  tHead('Grupo', 'Cupo sugerido', 'Cupo mínimo', 'Notas');
  [
    ['🦜  Aves',                 30, 25, ''],
    ['🐸  Anfibios y Reptiles',  25, 20, ''],
    ['🦋  Mariposas',            20, 15, ''],
    ['🌸  Orquídeas',            20, 15, ''],
    ['🌳  Árboles Nativos',      18, 13, ''],
    ['🐟  Peces de Agua Dulce',  15, 10, ''],
    ['🦌  Mamíferos',            13, 10, ''],
    ['🦗  Polillas',             10,  7, ''],
    ['🐄  Animales Domésticos',   7,  5, 'P2: usar criterio de raza criolla colombiana'],
    ['TOTAL',                   158, 120, '150 ± 8 margen de ajuste permitido'],
  ].forEach((row, i) => tRow(row, i % 2 === 0));
}

// ── HOJA 3: Listas ─────────────────────────────────────────────────────────────
function buildListas(wb) {
  const ws = wb.addWorksheet('Listas');
  ws.getColumn(1).width = 35;
  ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 40;
  ws.getColumn(4).width = 10;

  let r = 1;

  function section(titleText, colHeaders, rows) {
    // Título
    ws.mergeCells(`A${r}:D${r}`);
    const tc = ws.getCell(`A${r}`);
    tc.value = titleText;
    tc.font  = { bold: true, size: 11, color: { argb: C.white }, name: FONT };
    tc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrMid } };
    tc.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(r).height = 20;
    r++;

    // Encabezados
    ws.getRow(r).height = 16;
    colHeaders.forEach((v, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = v; c.font = { bold: true, size: 10, color: { argb: C.white }, name: FONT };
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrScore } };
      c.alignment = { vertical: 'middle', horizontal: 'center' }; c.border = brd();
    });
    r++;

    // Datos
    rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? C.rowOdd : C.rowEven;
      ws.getRow(r).height = 16;
      row.forEach((v, j) => {
        const c = ws.getCell(r, j + 1);
        c.value = v; c.font = { size: 10, name: FONT };
        c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.alignment = { vertical: 'middle', horizontal: j === 1 ? 'center' : 'left', indent: j === 0 ? 1 : 0 };
        c.border = brd();
      });
      r++;
    });
    r++; // blanco entre secciones
  }

  // Grupos — referenciado por dropdown de col F del LISTADO (A3:A11)
  section('Grupos de biodiversidad', ['Grupo', ''], GRUPOS.map(g => [g, '']));

  // P1-P7 — referenciados por dropdowns de cols I-Q del LISTADO
  PARAMS.forEach(p => {
    section(
      p.header.replace('\n', ' — '),
      ['Descripción', 'Puntaje'],
      p.scale.map(([desc, pts]) => [desc, pts])
    );
  });

  // Subregiones (referencia para el evaluador)
  section('Subregiones de Antioquia', ['Subregión', ''], SUBREGIONES.map(s => [s, '']));

  // Decisiones (referencia)
  section('Opciones de decisión del comité', ['Decisión', 'Descripción'], [
    ['Incluida',            'Especie aprobada para la versión 1.0'],
    ['Lista de espera',     'Puntaje insuficiente; reservar para Fase 2'],
    ['Excluida',            'No cumple criterios mínimos'],
    ['Pendiente revisión',  'Requiere más información antes de decidir'],
  ]);
}

// ── HOJA 4: RESUMEN ───────────────────────────────────────────────────────────
function buildResumen(wb) {
  const ws = wb.addWorksheet('RESUMEN');
  const R0 = 3;               // primera fila de datos en LISTADO
  const R1 = R0 + FILAS - 1; // última fila (202)

  [28, 12, 13, 13, 13, 18, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  let r = 1;

  function colLetter(n) { return String.fromCharCode(64 + n); }

  function secTitle(text, ncols = 7) {
    ws.mergeCells(`A${r}:${colLetter(ncols)}${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font  = { bold: true, size: 11, color: { argb: C.white }, name: FONT };
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrMid } };
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(r).height = 22;
    r++;
  }

  function dataRow(vals, even) {
    const bg = even ? C.rowEven : C.rowOdd;
    ws.getRow(r).height = 18;
    vals.forEach((v, i) => {
      const c    = ws.getCell(r, i + 1);
      const isF  = typeof v === 'object' && v !== null && v.formula;
      c.value    = isF ? { formula: v.formula } : v;
      c.font     = { size: 10, name: FONT, bold: isF ? !!v.bold : false, italics: isF ? !!v.italic : false };
      c.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
      c.border   = brd();
      if (isF && v.numFmt) c.numFmt = v.numFmt;
    });
    r++;
  }

  function totalsRow(vals) {
    ws.getRow(r).height = 20;
    vals.forEach((v, i) => {
      const c   = ws.getCell(r, i + 1);
      const isF = typeof v === 'object' && v !== null && v.formula;
      c.value   = isF ? { formula: v.formula } : v;
      c.font    = { bold: true, size: 10, color: { argb: C.white }, name: FONT };
      c.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrDark } };
      c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
      c.border  = brd();
      if (isF && v.numFmt) c.numFmt = v.numFmt;
    });
    r++;
  }

  // ── Título ──────────────────────────────────────────────────────────────────
  ws.mergeCells('A1:G1');
  const titleC = ws.getCell('A1');
  titleC.value = 'RESUMEN DE EVALUACIÓN · Antioquia Biodiversa · Comité Científico Asesor';
  titleC.font  = { bold: true, size: 13, color: { argb: C.white }, name: FONT };
  titleC.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrDark } };
  titleC.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 28;
  r = 2;

  // ── Sección 1: Totales generales ─────────────────────────────────────────────
  r++;
  secTitle('Totales generales', 3);
  [
    ['Total especies evaluadas',     `COUNTA(LISTADO!D${R0}:D${R1})`],
    ['Prioritarias (puntaje ≥ 80)',  `COUNTIF(LISTADO!S${R0}:S${R1},"Prioritaria")`],
    ['Recomendadas (60 – 79 pts)',   `COUNTIF(LISTADO!S${R0}:S${R1},"Recomendada")`],
    ['Condicionales (40 – 59 pts)',  `COUNTIF(LISTADO!S${R0}:S${R1},"Condicional")`],
    ['Lista de espera (< 40 pts)',   `COUNTIF(LISTADO!S${R0}:S${R1},"Lista de espera")`],
    ['Puntaje promedio',             `IFERROR(AVERAGEIF(LISTADO!R${R0}:R${R1},">0"),"-")`],
  ].forEach(([label, formula], i) => {
    const bg = i % 2 === 0 ? C.rowOdd : C.rowEven;
    ws.getRow(r).height = 18;
    const lc = ws.getCell(r, 1);
    lc.value = label;
    lc.font  = { size: 10, name: FONT, bold: i === 0 };
    lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    lc.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    lc.border = brd();
    const vc = ws.getCell(r, 2);
    vc.value = { formula };
    vc.font  = { size: 11, name: FONT, bold: i === 0 };
    vc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    vc.alignment = { vertical: 'middle', horizontal: 'center' };
    vc.border = brd();
    if (i === 5) vc.numFmt = '0.0';
    r++;
  });

  // ── Sección 2: Por grupo taxonómico ──────────────────────────────────────────
  r++;
  secTitle('Por grupo taxonómico', 7);

  ws.getRow(r).height = 20;
  ['Grupo', 'Evaluadas', 'Prioritaria', 'Recomendada', 'Condicional', 'Lista espera', 'Promedio']
    .forEach((h, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = h;
      c.font  = { bold: true, size: 10, color: { argb: C.white }, name: FONT };
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrScore } };
      c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
      c.border = brd();
    });
  r++;

  const grpStart = r;
  GRUPOS.forEach((g, gi) => {
    dataRow([
      g,
      { formula: `COUNTIF(LISTADO!F${R0}:F${R1},"${g}")` },
      { formula: `COUNTIFS(LISTADO!F${R0}:F${R1},"${g}",LISTADO!S${R0}:S${R1},"Prioritaria")` },
      { formula: `COUNTIFS(LISTADO!F${R0}:F${R1},"${g}",LISTADO!S${R0}:S${R1},"Recomendada")` },
      { formula: `COUNTIFS(LISTADO!F${R0}:F${R1},"${g}",LISTADO!S${R0}:S${R1},"Condicional")` },
      { formula: `COUNTIFS(LISTADO!F${R0}:F${R1},"${g}",LISTADO!S${R0}:S${R1},"Lista de espera")` },
      { formula: `IFERROR(AVERAGEIFS(LISTADO!R${R0}:R${R1},LISTADO!F${R0}:F${R1},"${g}",LISTADO!R${R0}:R${R1},">0"),"-")`, numFmt: '0.0' },
    ], gi % 2 === 0);
  });
  const grpEnd = r - 1;

  totalsRow([
    'TOTAL',
    { formula: `SUM(B${grpStart}:B${grpEnd})` },
    { formula: `SUM(C${grpStart}:C${grpEnd})` },
    { formula: `SUM(D${grpStart}:D${grpEnd})` },
    { formula: `SUM(E${grpStart}:E${grpEnd})` },
    { formula: `SUM(F${grpStart}:F${grpEnd})` },
    { formula: `IFERROR(AVERAGEIF(LISTADO!R${R0}:R${R1},">0"),"-")`, numFmt: '0.0' },
  ]);

  // ── Sección 3: Top 15 — mayor puntaje ────────────────────────────────────────
  r++;
  secTitle('Top 150 — mayor puntaje', 6);

  ws.getRow(r).height = 20;
  ['Pos.', 'Nombre científico', 'Nombre común', 'Grupo', 'Puntaje', 'Categoría']
    .forEach((h, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = h;
      c.font  = { bold: true, size: 10, color: { argb: C.white }, name: FONT };
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrDark } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.border = brd();
    });
  r++;

  const top15Start = r;
  for (let k = 1; k <= 150; k++) {
    const bg = k % 2 === 0 ? C.rowEven : C.rowOdd;
    const mf = `MATCH(LARGE(LISTADO!$R$${R0}:$R$${R1},${k}),LISTADO!$R$${R0}:$R$${R1},0)`;
    ws.getRow(r).height = 18;
    [
      { v: k,                                                                          center: true },
      { f: `IFERROR(INDEX(LISTADO!$D$${R0}:$D$${R1},${mf}),"")`, italic: true, left: true },
      { f: `IFERROR(INDEX(LISTADO!$E$${R0}:$E$${R1},${mf}),"")`,                left: true },
      { f: `IFERROR(INDEX(LISTADO!$F$${R0}:$F$${R1},${mf}),"")`,                left: true },
      { f: `IFERROR(LARGE(LISTADO!$R$${R0}:$R$${R1},${k}),"")`,  bold: true, center: true },
      { f: `IFERROR(INDEX(LISTADO!$S$${R0}:$S$${R1},${mf}),"")`,               center: true },
    ].forEach((cd, ci) => {
      const c = ws.getCell(r, ci + 1);
      c.value = cd.f ? { formula: cd.f } : cd.v;
      c.font  = { size: 10, name: FONT, bold: !!cd.bold, italics: !!cd.italic };
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.alignment = { vertical: 'middle', horizontal: cd.center ? 'center' : 'left', indent: cd.left ? 1 : 0 };
      c.border = brd();
    });
    r++;
  }
  const top15End = r - 1;

  ws.addConditionalFormatting({
    ref: `F${top15Start}:F${top15End}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'Prioritaria',     priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.prioritaria } }, font: { bold: true, name: FONT } } },
      { type: 'containsText', operator: 'containsText', text: 'Recomendada',     priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.recomendada } }, font: { bold: true, name: FONT } } },
      { type: 'containsText', operator: 'containsText', text: 'Condicional',     priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.condicional } }, font: { bold: true, name: FONT } } },
      { type: 'containsText', operator: 'containsText', text: 'Lista de espera', priority: 4, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: C.espera     } }, font: { bold: true, name: FONT } } },
    ],
  });

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Calcular rangos de la hoja Listas antes de construir el Listado
  computeListasRanges();

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Antioquia Biodiversa - Gobernación de Antioquia';
  wb.created  = new Date();
  wb.modified = new Date();

  buildListado(wb);
  buildInstrucciones(wb);
  buildListas(wb);
  buildResumen(wb);

  await wb.xlsx.writeFile(OUT_FILE);
  console.log('✓', OUT_FILE);
}

main().catch(console.error);
