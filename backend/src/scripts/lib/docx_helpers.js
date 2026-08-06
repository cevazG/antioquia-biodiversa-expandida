/**
 * docx_helpers.js
 * Utilidades compartidas para los generadores de documentos institucionales
 * (Levantamiento de Requisitos, Propuesta de Ajustes Técnicos, Documento
 * Integral de Desarrollo). Centraliza portada, tabla de contenido nativa de
 * Word, estilos de encabezado con HeadingLevel real (necesario para que el
 * TOC funcione) y tablas, para que los 3 documentos sean visualmente
 * consistentes entre sí.
 *
 * Por qué HeadingLevel real: un TOC de Word solo detecta párrafos con estilo
 * de encabezado nativo (Heading 1, Heading 2...), no texto en negrita común.
 * Sin esto, el campo de tabla de contenido queda vacío al actualizarse.
 *
 * Formato institucional (fuente/tamaño/márgenes): verificado contra las 3
 * plantillas oficiales (FO-M7-P8-020/021/023, revisión 28/07/2026). La
 * plantilla del Documento Integral fija explícitamente Arial en su estilo
 * Normal (word/styles.xml); las otras dos no sobreescriben la fuente del
 * tema. Se estandariza Arial en los 3 documentos generados — es el único
 * requisito de fuente explícito encontrado entre las 3 plantillas, y da
 * consistencia entre nuestros propios documentos. Tamaño de cuerpo 12pt,
 * igual al docDefault de la plantilla del Documento Integral (sz=24).
 * Márgenes de página: 2 de las 3 plantillas usan 2.5 cm (899795 EMU); se
 * adopta ese valor (1417 twips) en los 3 documentos.
 */

const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak,
  HeadingLevel, TableOfContents, Header, Footer, PageNumber,
  ImageRun,
} = require('docx');
const fs = require('fs');
const path = require('path');

const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const GRAY_TEXT  = '555555';
const TABLE_HDR  = '018D38';
const TABLE_ALT  = 'F0FFF4';
const AMBER      = 'B8860B';

// Fuente institucional (ver nota arriba) — aplicada explícitamente a cada
// TextRun para no depender del tema por defecto de quien abra el documento.
const FONT = 'Arial';

// Márgenes de página, verificados contra w:pgMar real de cada plantilla:
// Levantamiento (020) y Documento Integral (023) usan top/bottom 2.5cm,
// left/right 3.0cm (asimétrico, no 2.5cm parejo como se asumió antes).
// Ajustes Técnicos (021) no comparte esa plantilla base: usa 1 pulgada
// pareja (1440 twips), el default de Word.
const PAGE_MARGIN = { top: 1417, right: 1701, bottom: 1417, left: 1701 };
const PAGE_MARGIN_AJUSTES = { top: 1440, right: 1440, bottom: 1440, left: 1440 };

const LOGO_PATH = path.join(__dirname, '../../../../biodiversidad/img/logo/logo_gobernacion.png');

const border = (color = 'CCCCCC', sz = 4) => ({
  top: { style: BorderStyle.SINGLE, size: sz, color }, bottom: { style: BorderStyle.SINGLE, size: sz, color },
  left: { style: BorderStyle.SINGLE, size: sz, color }, right: { style: BorderStyle.SINGLE, size: sz, color },
});

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT, bold: true, size: 32, color: GREEN })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT, bold: true, size: 26, color: DARK_GREEN })],
    spacing: { before: 200, after: 100 },
  });
}
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: FONT, bold: true, size: 23, color: DARK_GREEN })],
    spacing: { before: 160, after: 80 },
  });
}
function para(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, font: FONT, size: 22, color: '333333' })], spacing: { after: 120 }, ...opts });
}
function nota(text) {
  return new Paragraph({ children: [new TextRun({ text, font: FONT, size: 20, color: AMBER, italics: true })], spacing: { after: 140 } });
}
function scorecard(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: GREEN })],
    spacing: { before: 80, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: TABLE_ALT },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN }, bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN }, left: { style: BorderStyle.SINGLE, size: 4, color: GREEN }, right: { style: BorderStyle.SINGLE, size: 4, color: GREEN } },
  });
}
function bullet(text, level = 0) {
  return new Paragraph({ children: [new TextRun({ text, font: FONT, size: 22, color: '333333' })], bullet: { level }, spacing: { after: 60 } });
}
function code(lines) {
  return new Paragraph({
    children: [new TextRun({ text: lines, font: 'Courier New', size: 20, color: '0B5640' })],
    spacing: { before: 80, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
  });
}
function spacer() { return new Paragraph({ children: [], spacing: { after: 100 } }); }

function makeTable(headers, rows, colWidths) {
  const totalWidth = 9360;
  const widths = colWidths || headers.map(() => Math.floor(totalWidth / headers.length));
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HDR },
      borders: border(TABLE_HDR),
      children: [new Paragraph({ children: [new TextRun({ text: h, font: FONT, bold: true, color: 'FFFFFF', size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })],
    })),
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? 'FFFFFF' : TABLE_ALT },
      borders: border(),
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), font: FONT, size: 20, color: '333333' })], spacing: { before: 60, after: 60 } })],
    })),
  }));
  return new Table({ width: { size: totalWidth, type: WidthType.DXA }, rows: [headerRow, ...dataRows], borders: border() });
}

/** Portada institucional consistente entre los 3 documentos. */
function portada({ titulo, subtitulo, version, fecha }) {
  return [
    spacer(), spacer(), spacer(),
    new Paragraph({ children: [new TextRun({ text: 'GOBERNACIÓN DE ANTIOQUIA', font: FONT, bold: true, size: 24, color: GRAY_TEXT })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: 'Secretaría de Ambiente', font: FONT, size: 20, color: GRAY_TEXT, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 320 } }),
    new Paragraph({ children: [new TextRun({ text: titulo, font: FONT, bold: true, size: 44, color: GREEN })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: 'Antioquia Natural', font: FONT, bold: true, size: 28, color: DARK_GREEN })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
    ...(subtitulo ? [new Paragraph({ children: [new TextRun({ text: subtitulo, font: FONT, size: 22, color: GRAY_TEXT })], alignment: AlignmentType.CENTER, spacing: { after: 240 } })] : []),
    new Paragraph({ children: [new TextRun({ text: 'Contratistas: Sebastián Guzmán Díaz y Alejandro López · sguzmand@gmail.com · 3006552511', font: FONT, size: 20, color: GRAY_TEXT })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Versión ${version} — ${fecha}`, font: FONT, size: 20, color: GRAY_TEXT })], alignment: AlignmentType.CENTER, spacing: { after: 320 } }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

/**
 * Tabla de contenido nativa de Word. El campo se genera vacío hasta que el
 * destinatario abra el documento y actualice campos (Word suele mostrar el
 * aviso automáticamente, o Ctrl+A luego F9). Es el mecanismo estándar para
 * TOC en documentos Word generados programáticamente.
 */
function tocSection() {
  return [
    heading1('Tabla de Contenido'),
    new TableOfContents('Tabla de Contenido', {
      hyperlink: true,
      headingStyleRange: '1-3',
    }),
    nota('Nota: si el índice aparece vacío al abrir el documento, actualícelo con clic derecho → "Actualizar campo" (o Ctrl+A y luego F9).'),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

/**
 * Encabezado institucional (logo + título + código + versión + fecha de
 * aprobación), presente en cada página de las 3 plantillas oficiales —
 * hallazgo encontrado al inspeccionar word/header1.xml de las plantillas
 * reales, no estaba replicado en versiones anteriores de este documento.
 * `fecha` es la fecha de aprobación de la PLANTILLA (FO-M7-P8-0XX), no la
 * de este documento — mismo campo y mismo valor que usa TI en su propio
 * formato (14/04/2026 en las 3 plantillas).
 */
function headerInstitucional({ titulo, codigo, fecha = '14/04/2026' }) {
  const logoBuffer = fs.readFileSync(LOGO_PATH);
  return new Header({
    children: [
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2200, type: WidthType.DXA },
                verticalAlign: 'center',
                children: [new Paragraph({ children: [new ImageRun({ data: logoBuffer, transformation: { width: 95, height: 54 }, type: 'png' })] })],
              }),
              new TableCell({
                width: { size: 7160, type: WidthType.DXA },
                verticalAlign: 'center',
                children: [
                  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: titulo, font: FONT, size: 16, bold: true, color: GRAY_TEXT })] }),
                  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Código: ${codigo}  ·  Versión: 01  ·  Fecha de aprobación (plantilla): ${fecha}`, font: FONT, size: 14, color: GRAY_TEXT })] }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { before: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN } }, children: [] }),
    ],
  });
}

/** Pie de página con numeración — requisito de formato institucional. */
function footerConNumeracion() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GRAY_TEXT }),
          new TextRun({ text: ' / ', font: FONT, size: 18, color: GRAY_TEXT }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: GRAY_TEXT }),
        ],
      }),
    ],
  });
}

/**
 * Inserta una imagen (diagrama PNG) centrada, escalada a un ancho máximo de
 * página (~580px ≈ 6in a 96dpi) manteniendo su relación de aspecto real, con
 * un pie de figura debajo.
 */
function image(filePath, nativeWidthPx, nativeHeightPx, caption) {
  const maxW = 580;
  const maxH = 680; // evita que diagramas en retrato (más alto que ancho) se corten al final de la página
  const scale = Math.min(maxW / nativeWidthPx, maxH / nativeHeightPx, 1);
  const w = Math.round(nativeWidthPx * scale);
  const h = Math.round(nativeHeightPx * scale);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new ImageRun({
          data: fs.readFileSync(filePath),
          transformation: { width: w, height: h },
          type: 'png',
        }),
      ],
    }),
    ...(caption ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, font: FONT, italics: true, size: 18, color: GRAY_TEXT })],
    })] : []),
  ];
}

module.exports = {
  GREEN, DARK_GREEN, GRAY_TEXT, TABLE_HDR, TABLE_ALT, AMBER, FONT, PAGE_MARGIN, PAGE_MARGIN_AJUSTES,
  border, heading1, heading2, heading3, para, nota, bullet, code, spacer, scorecard,
  makeTable, portada, tocSection, footerConNumeracion, headerInstitucional, image,
  HeadingLevel, PageBreak, AlignmentType,
};
