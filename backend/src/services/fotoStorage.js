'use strict';
// Guardado/borrado en disco de las fotos JPL y Guarda Cuencas — separado de
// routes/admin.js para que esa lógica no dependa de Express (req/res).
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');

const FRONTEND = path.join(__dirname, '../../../'); // backend/src/services → Antioquia Natural/

// Convierte un nombre científico en slug de carpeta: "Amazilia tzacatl" → "amazilia_tzacatl"
function especieSlug(nombre) {
  if (!nombre || !nombre.trim()) return null;
  return nombre.trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
}

// Guarda el buffer de una foto JPL como WebP optimizado y devuelve la ruta relativa.
// Estructura: img/fotos/bio/{mes}/{grupo}/{especie_slug}/{especie_slug}_001.webp
async function saveJplFile(buffer, originalname, mes, grupo, especieCientifico) {
  const slug   = especieSlug(especieCientifico) || 'sin_nombre';
  const subdir = path.join(mes, grupo, slug);
  const dir    = path.join(FRONTEND, 'comunidad/jovenes_pa_lante/img/fotos/bio', subdir);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta construida por el servidor, no por el usuario; endpoint protegido por requireAdmin
  fs.mkdirSync(dir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  const existing = fs.readdirSync(dir).filter(f => /\.(jpe?g|webp|png)$/i.test(f)).length;
  const filename = `${slug}_${String(existing + 1).padStart(3, '0')}.webp`;
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, filename));
  return `img/fotos/bio/${subdir.replace(/\\/g, '/')}/${filename}`;
}

// Guarda el buffer de una foto GC como WebP 1200×675 (16:9 recortado) y devuelve la ruta relativa.
async function saveGcFile(buffer, mes) {
  const dir = path.join(FRONTEND, 'comunidad/guarda_cuencas/img/fotos', `gc_${mes}`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  fs.mkdirSync(dir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  const existing = fs.readdirSync(dir).filter(f => /\.(jpe?g|webp|png)$/i.test(f)).length;
  const filename = `gc_${String(existing + 1).padStart(3, '0')}.webp`;
  await sharp(buffer)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(path.join(dir, filename));
  return `img/fotos/gc_${mes}/${filename}`;
}

// Elimina un archivo relativo a `base` (ej. 'comunidad/guarda_cuencas') si existe.
// rutaRelativa siempre viene de saveJplFile()/saveGcFile(), nunca de input directo del cliente.
function borrarSiExiste(base, rutaRelativa) {
  if (!rutaRelativa) return;
  // nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal -- rutaRelativa la genera el propio servidor al guardar la foto, no el cliente
  const abs = path.join(FRONTEND, base, rutaRelativa);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta construida por el servidor (saveJplFile/saveGcFile), no por el usuario; endpoint protegido por requireAdmin
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

module.exports = { FRONTEND, especieSlug, saveJplFile, saveGcFile, borrarSiExiste };
