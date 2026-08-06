'use strict';
// Adaptador de almacenamiento — implementa el puerto AlmacenamientoFotoCuenca
// usando sharp + filesystem local. Misma lógica que tenía saveGcFile() en
// services/fotoStorage.js, movida aquí (JPL ya se había movido antes; con
// esta migración, services/fotoStorage.js y services/publicacion.js quedan
// sin ningún requirer y se eliminan).
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');

const RAIZ_PROYECTO = path.join(__dirname, '../../../../../'); // infrastructure/ → gc/ → modules/ → src/ → backend/ → raíz
const BASE_GC = 'comunidad/guarda_cuencas';

// Guarda el buffer de una foto de cuenca como WebP 1200×675 (16:9
// recortado) y devuelve la ruta relativa. Estructura: img/fotos/gc_{mes}/gc_001.webp
async function guardar(buffer, mes) {
  const dir = path.join(RAIZ_PROYECTO, BASE_GC, 'img/fotos', `gc_${mes}`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta construida por el servidor, no por el usuario; endpoint protegido por requireAdmin
  fs.mkdirSync(dir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  const existentes = fs.readdirSync(dir).filter(f => /\.(jpe?g|webp|png)$/i.test(f)).length;
  const filename = `gc_${String(existentes + 1).padStart(3, '0')}.webp`;
  await sharp(buffer)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(path.join(dir, filename));
  return `img/fotos/gc_${mes}/${filename}`;
}

// Elimina un archivo relativo a comunidad/guarda_cuencas si existe.
// rutaRelativa siempre viene de guardar(), nunca de input directo del cliente.
function eliminar(rutaRelativa) {
  if (!rutaRelativa) return;
  // nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal -- rutaRelativa la genera el propio servidor al guardar la foto, no el cliente
  const abs = path.join(RAIZ_PROYECTO, BASE_GC, rutaRelativa);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta construida por el servidor, no por el usuario; endpoint protegido por requireAdmin
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

module.exports = { guardar, eliminar };
