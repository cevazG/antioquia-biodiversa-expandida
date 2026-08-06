'use strict';
/**
 * generate_diccionario_datos.js
 * Genera el diccionario de datos en Excel exigido por la plantilla FO-M7-P8-023
 * (sección 6.6): un documento versionado, una hoja por colección de MongoDB,
 * con columnas Nombre del campo / Tipo de dato / PK-FK / Capacidad máxima /
 * Especificaciones adicionales / Comentarios.
 *
 * Fuente de verdad: los 4 modelos Mongoose reales en backend/src/models/.
 *
 * Uso: node src/scripts/generate_diccionario_datos.js
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');
const OUT_FILE = path.join(OUT_DIR, 'Diccionario_Datos_BD_Comunidad_Antioquia_Natural.xlsx');

const C = {
  hdrDark: 'FF0B5640',
  hdrMid: 'FF018D38',
  white: 'FFFFFFFF',
  rowOdd: 'FFFFFFFF',
  rowEven: 'FFF5F5F5',
  pk: 'FFC8E6C9',
};
const FONT = 'Calibri';
const COLS = ['Nombre del campo', 'Tipo de dato', 'PK / FK', 'Capacidad máxima', 'Especificaciones adicionales', 'Comentarios'];
const WIDTHS = [22, 18, 12, 20, 38, 40];

function brd() {
  const thin = { style: 'thin', color: { argb: 'FFBDBDBD' } };
  return { top: thin, bottom: thin, left: thin, right: thin };
}

function buildSheet(wb, { nombre, coleccion, campos }) {
  const ws = wb.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 4 }] });
  WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  ws.mergeCells('A1:F1');
  const t = ws.getCell('A1');
  t.value = `Diccionario de Datos — Colección: ${nombre}`;
  t.font = { bold: true, size: 14, color: { argb: C.white }, name: FONT };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrDark } };
  t.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 26;

  ws.mergeCells('A2:F2');
  const s = ws.getCell('A2');
  s.value = `Base de datos: comunidad (MongoDB Atlas, colección física: ${coleccion}) · Antioquia Natural · v1 · 2026-07-28`;
  s.font = { italic: true, size: 10, color: { argb: 'FF555555' }, name: FONT };
  s.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 18;

  ws.getRow(3).height = 6;

  const hdrRow = ws.getRow(4);
  COLS.forEach((c, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = c;
    cell.font = { bold: true, size: 10, color: { argb: C.white }, name: FONT };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.hdrMid } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = brd();
  });
  hdrRow.height = 20;

  campos.forEach((row, i) => {
    const r = ws.getRow(5 + i);
    const isPk = row[2].includes('PK');
    row.forEach((v, ci) => {
      const cell = r.getCell(ci + 1);
      cell.value = v;
      cell.font = { size: 10, name: FONT };
      cell.alignment = { vertical: 'middle', horizontal: ci === 2 ? 'center' : 'left', wrapText: ci >= 4 };
      cell.border = brd();
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPk ? C.pk : (i % 2 === 0 ? C.rowOdd : C.rowEven) } };
    });
    r.height = 30;
  });
}

function buildWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Antioquia Natural';
  wb.created = new Date();

  buildSheet(wb, {
    nombre: 'JplPhoto',
    coleccion: 'jplphotos',
    campos: [
      ['_id', 'ObjectId', 'PK', '12 bytes', 'Generado automáticamente por MongoDB', 'Identificador único del documento'],
      ['mes', 'String', '—', 'variable', "Formato 'YYYY-MM', requerido", 'Mes de publicación de la galería'],
      ['orden', 'Number', '—', '—', 'Entero, default 0', 'Orden de despliegue dentro del mes'],
      ['fotos', 'Array<String>', '—', '1 a 3 elementos', 'Rutas relativas al frontend', 'Array de 1 a 3 fotos por entrada (multi-foto)'],
      ['credito', 'String', '—', 'variable', "Default ''", 'Nombre del fotógrafo/participante que consintió'],
      ['municipio', 'String', '—', 'variable', "Default ''", 'Municipio de la observación'],
      ['subregion', 'String', '—', 'variable', 'Enum SUBREGIONES_VALIDAS (9 valores), requerido', 'Validado contra config/catalogo.js'],
      ['especieEs', 'String', '—', 'variable', 'Requerido', 'Nombre común en español'],
      ['especieEn', 'String', '—', 'variable', "Default ''", 'Nombre común en inglés'],
      ['especieCientifico', 'String', '—', 'variable', "Default ''", 'Nombre científico'],
      ['grupo', 'String', '—', 'variable', 'Enum GRUPOS_VALIDOS (9 valores), requerido', 'Validado contra config/catalogo.js'],
      ['iucn', 'String', '—', 'variable', "Enum IUCN_VALIDOS, default 'DD'", 'Categoría de conservación'],
      ['endemica', 'Boolean', '—', '—', 'Default false', 'Indica si es especie endémica'],
      ['descripcionEs', 'String', '—', 'variable', "Default ''", 'Descripción en español'],
      ['descripcionEn', 'String', '—', 'variable', "Default ''", 'Descripción en inglés'],
      ['publicado', 'Boolean', '—', '—', 'Default false', 'Indica si ya fue publicado al JSON público'],
      ['createdAt', 'Date', '—', '—', 'Generado automáticamente (timestamps: true)', 'Fecha de creación del documento'],
      ['updatedAt', 'Date', '—', '—', 'Generado automáticamente (timestamps: true)', 'Fecha de última modificación'],
    ],
  });

  buildSheet(wb, {
    nombre: 'GcPhoto',
    coleccion: 'gcphotos',
    campos: [
      ['_id', 'ObjectId', 'PK', '12 bytes', 'Generado automáticamente por MongoDB', 'Identificador único del documento'],
      ['mes', 'String', '—', 'variable', "Formato 'YYYY-MM', requerido", 'Mes de publicación de la galería'],
      ['orden', 'Number', '—', '—', 'Entero, default 0', 'Orden de despliegue dentro del mes'],
      ['foto', 'String', '—', 'variable', 'Requerido', 'Ruta relativa a una sola foto (formato 16:9, a diferencia de JplPhoto)'],
      ['credito', 'String', '—', 'variable', "Default ''", 'Nombre del fotógrafo/participante que consintió'],
      ['municipio', 'String', '—', 'variable', "Default ''", 'Municipio de la observación'],
      ['subregion', 'String', '—', 'variable', 'Enum SUBREGIONES_VALIDAS (9 valores), requerido', 'Validado contra config/catalogo.js'],
      ['cuenca', 'String', '—', 'variable', 'Requerido', 'Nombre de la cuenca hídrica'],
      ['tituloEs', 'String', '—', 'variable', 'Requerido', 'Título en español'],
      ['tituloEn', 'String', '—', 'variable', "Default ''", 'Título en inglés'],
      ['descripcionEs', 'String', '—', 'variable', "Default ''", 'Descripción en español'],
      ['descripcionEn', 'String', '—', 'variable', "Default ''", 'Descripción en inglés'],
      ['publicado', 'Boolean', '—', '—', 'Default false', 'Indica si ya fue publicado al JSON público'],
      ['createdAt', 'Date', '—', '—', 'Generado automáticamente (timestamps: true)', 'Fecha de creación del documento'],
      ['updatedAt', 'Date', '—', '—', 'Generado automáticamente (timestamps: true)', 'Fecha de última modificación'],
    ],
  });

  buildSheet(wb, {
    nombre: 'CommunitySighting',
    coleccion: 'communitysightings',
    campos: [
      ['_id', 'ObjectId', 'PK', '12 bytes', 'Generado automáticamente por MongoDB', 'Identificador único del documento'],
      ['speciesMonthId', 'ObjectId', 'FK → SpeciesMonth', '12 bytes', 'Requerido', 'Referencia a la especie del mes avistada'],
      ['usuario', 'String', '—', 'variable', 'Sin default', 'Nombre del observador comunitario'],
      ['municipio', 'String', '—', 'variable', 'Sin default', 'Municipio del avistamiento'],
      ['subregion', 'String', '—', 'variable', 'Sin default', 'Subregión del avistamiento'],
      ['fecha', 'Date', '—', '—', 'Sin default', 'Fecha del avistamiento reportado'],
      ['fotoUrl', 'String', '—', 'variable', 'Sin default', 'URL o ruta de la foto adjunta'],
      ['comentario', 'String', '—', 'variable', 'Sin default', 'Comentario libre del observador'],
      ['approved', 'Boolean', '—', '—', 'Default false', 'Indica si el avistamiento fue aprobado por un curador'],
      ['createdAt', 'Date', '—', '—', 'Default Date.now', 'Fecha de creación del documento'],
    ],
  });

  buildSheet(wb, {
    nombre: 'Municipality',
    coleccion: 'municipalities',
    campos: [
      ['_id', 'ObjectId', 'PK', '12 bytes', 'Generado automáticamente por MongoDB', 'Identificador único del documento'],
      ['nombre', 'String', '—', 'variable', 'Requerido', 'Nombre del municipio'],
      ['subregion', 'String', '—', 'variable', 'Requerido', 'Subregión a la que pertenece'],
      ['lat', 'Number', '—', '—', 'Sin default', 'Latitud (coordenada del mapa Leaflet)'],
      ['lng', 'Number', '—', '—', 'Sin default', 'Longitud (coordenada del mapa Leaflet)'],
      ['jpl_beneficiado', 'Boolean', '—', '—', 'Default true', 'Indica si el municipio es beneficiario del programa JPL'],
      ['codigoDANE', 'String', '—', 'variable', 'Sin default', 'Código DANE del municipio'],
    ],
  });

  return wb;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const wb = buildWorkbook();
  await wb.xlsx.writeFile(OUT_FILE);
  console.log('✓', OUT_FILE);
}

main().catch((err) => { console.error(err); process.exit(1); });
