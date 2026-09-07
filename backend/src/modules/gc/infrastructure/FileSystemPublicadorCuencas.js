'use strict';
// Adaptador de publicación — implementa el puerto PublicadorCuencas: escribe
// el JSON del mes y actualiza el índice que lee el frontend estático.
// Misma lógica que tenía publicarGc() en services/publicacion.js, movida
// aquí (con esto, services/publicacion.js queda sin ningún requirer y se
// elimina).
const fs   = require('fs');
const path = require('path');

const RAIZ_PROYECTO = path.join(__dirname, '../../../../../'); // infrastructure/ → gc/ → modules/ → src/ → backend/ → raíz
const DATA_DIR = path.join(RAIZ_PROYECTO, 'comunidad/guarda_cuencas/data');

// Reemplaza la entrada existente del mismo mes en vez de duplicarla, y
// mantiene el índice ordenado de más reciente a más antiguo. Misma función
// que la versión JPL (modules/jpl/infrastructure/FileSystemPublicadorGaleria.js),
// duplicada a propósito para que cada módulo sea autocontenido.
function actualizarIndice(indexPath, entry) {
  let index = { meses: [] };
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- indexPath lo arma el servidor (DATA_DIR + nombre fijo), no el cliente
  if (fs.existsSync(indexPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  const existing = index.meses.findIndex(m => m.id === entry.id);
  // eslint-disable-next-line security/detect-object-injection -- existing es un índice numérico de findIndex sobre un array, no una clave arbitraria
  if (existing >= 0) index.meses[existing] = entry;
  else index.meses.unshift(entry);
  index.meses.sort((a, b) => b.id.localeCompare(a.id));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

// eslint-disable-next-line require-await -- la firma del puerto es async por contrato, aunque esta implementación con fs síncrono no necesita await
async function publicarMes(mes, payload) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- DATA_DIR es una ruta fija del servidor, no viene del cliente
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  fs.writeFileSync(path.join(DATA_DIR, `cuencas_${mes.replace('-', '_')}.json`), JSON.stringify(payload, null, 2));

  actualizarIndice(path.join(DATA_DIR, 'fotos_cuencas.json'), {
    id: mes, mes: payload.mes, mesEn: payload.mesEn, año: payload.año,
    count: payload.fotos.length, portada: payload.fotos[0]?.foto || '',
    archivo: `data/cuencas_${mes.replace('-', '_')}.json`,
  });

  return { count: payload.fotos.length };
}

module.exports = { publicarMes };
