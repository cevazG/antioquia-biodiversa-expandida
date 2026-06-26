'use strict';
/**
 * export_evaluacion_csv.js
 * Lee el Excel de evaluación diligenciado y exporta la hoja LISTADO a CSV.
 * El CSV incluye solo las filas con nombre científico ingresado.
 *
 * Uso: node src/scripts/export_evaluacion_csv.js
 */

const ExcelJS = require('exceljs');
const path    = require('path');
const fs      = require('fs');

const DIR      = path.join(__dirname, '../../../Documentos gobernacion');
const IN_FILE  = path.join(DIR, 'Evaluacion_Especies_Antioquia_Biodiversa.xlsx');
const OUT_FILE = path.join(DIR, 'Evaluacion_Especies_Export.csv');

const HEADERS = [
  '#', 'Fecha', 'Evaluador(es)', 'Nombre científico', 'Nombre común (ES)',
  'Grupo', 'Familia taxonómica', 'Subregiones presentes',
  'P1 IUCN', 'P2 Endemismo', 'P3 Rol ecológico', 'P4 Rep. geográfica',
  'P5a Reconocibilidad', 'P5b Historia natural', 'P5c Valor cultural',
  'P6 Foto disponible', 'P7 Diversidad taxonómica',
  'TOTAL', 'Categoría', 'Decisión comité', 'Fuente fotográfica', 'Notas',
];

function readCell(cell) {
  // Fórmulas: usar el resultado calculado (disponible si el archivo fue guardado en Excel)
  if (cell.type === ExcelJS.ValueType.Formula) {
    return cell.result ?? '';
  }
  // Fechas: formatear como dd/mm/yyyy
  if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
    const d = cell.value;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return cell.value ?? '';
}

function escapeCsv(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

async function main() {
  if (!fs.existsSync(IN_FILE)) {
    console.error('✗ Archivo no encontrado:', IN_FILE);
    console.error('  Genera primero la plantilla con: npm run generate-evaluacion');
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(IN_FILE);

  const ws = wb.getWorksheet('LISTADO');
  if (!ws) {
    console.error('✗ No se encontró la hoja LISTADO en el archivo.');
    process.exit(1);
  }

  const rows  = [HEADERS];
  let   count = 0;

  ws.eachRow((row, rowNum) => {
    if (rowNum < 3) return;                       // saltar título y encabezado
    if (!row.getCell(4).value) return;            // saltar filas sin nombre científico

    const values = [];
    for (let c = 1; c <= 22; c++) values.push(readCell(row.getCell(c)));
    rows.push(values);
    count++;
  });

  if (count === 0) {
    console.warn('⚠ No se encontraron especies diligenciadas en la hoja LISTADO.');
    process.exit(0);
  }

  // BOM UTF-8 para compatibilidad con Excel en Windows
  const csv = '﻿' + rows.map(r => r.map(escapeCsv).join(',')).join('\n');
  fs.writeFileSync(OUT_FILE, csv, 'utf8');

  console.log(`✓ ${count} especies exportadas → ${OUT_FILE}`);
}

main().catch(console.error);
