'use strict';
// Adaptador de almacenamiento — implementa el puerto AlmacenamientoFotos
// para JPL usando sharp + filesystem local. Es la misma lógica que tenía
// services/fotoStorage.js (saveJplFile + la parte JPL de borrarSiExiste),
// movida aquí; la mitad de ese archivo que sirve a Guarda Cuencas queda
// intacta hasta que GC se migre a su propio módulo.
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');

const RAIZ_PROYECTO = path.join(__dirname, '../../../../../'); // infrastructure/ → jpl/ → modules/ → src/ → backend/ → raíz
const BASE_JPL = 'comunidad/jovenes_pa_lante';

// Convierte un nombre científico en slug de carpeta: "Amazilia tzacatl" → "amazilia_tzacatl"
function especieSlug(nombre) {
  if (!nombre || !nombre.trim()) return null;
  return nombre.trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
}

// Guarda el buffer de una foto JPL como WebP optimizado y devuelve la ruta relativa.
// Estructura: img/fotos/bio/{mes}/{grupo}/{especie_slug}/{especie_slug}_001.webp
async function guardar(buffer, originalname, mes, grupo, especieCientifico) {
  const slug   = especieSlug(especieCientifico) || 'sin_nombre';
  const subdir = path.join(mes, grupo, slug);
  const dir    = path.join(RAIZ_PROYECTO, BASE_JPL, 'img/fotos/bio', subdir);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta construida por el servidor, no por el usuario; endpoint protegido por requireAdmin
  fs.mkdirSync(dir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  const existentes = fs.readdirSync(dir).filter(f => /\.(jpe?g|webp|png)$/i.test(f)).length;
  const filename = `${slug}_${String(existentes + 1).padStart(3, '0')}.webp`;
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, filename));
  return `img/fotos/bio/${subdir.replace(/\\/g, '/')}/${filename}`;
}

// Elimina un archivo relativo a comunidad/jovenes_pa_lante si existe.
// rutaRelativa siempre viene de guardar(), nunca de input directo del cliente.
function eliminar(rutaRelativa) {
  if (!rutaRelativa) return;
  // nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal -- rutaRelativa la genera el propio servidor al guardar la foto, no el cliente
  const abs = path.join(RAIZ_PROYECTO, BASE_JPL, rutaRelativa);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta construida por el servidor, no por el usuario; endpoint protegido por requireAdmin
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

module.exports = { guardar, eliminar };
