'use strict';
// Publicación de un mes (JPL o Guarda Cuencas): escribe el JSON público que
// lee el frontend estático, actualiza el índice de meses, y marca los
// registros como publicados. Separado de routes/admin.js: esto es la
// operación de negocio completa, no un detalle de la petición HTTP.
const fs   = require('fs');
const path = require('path');
const JplPhoto = require('../models/JplPhoto');
const GcPhoto  = require('../models/GcPhoto');
const { redis } = require('../db');
const { invalidate } = require('../utils/cache');
const { FRONTEND } = require('./fotoStorage');

const MESES_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Reemplaza la entrada existente del mismo mes en vez de duplicarla, y
// mantiene el índice ordenado de más reciente a más antiguo.
function actualizarIndice(indexPath, entry) {
  let index = { meses: [] };
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- indexPath lo arma el servidor (dataDir + nombre fijo), no el cliente
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

// Devuelve { count } o null si el mes no tiene fotos (la ruta decide el 400).
async function publicarJpl(mes) {
  const [año, numMes] = mes.split('-').map(Number);
  const fotos = await JplPhoto.find({ mes }).sort('orden createdAt').lean();
  if (!fotos.length) return null;

  const payload = {
    // eslint-disable-next-line security/detect-object-injection -- numMes sale de mes.split('-') ('YYYY-MM' ya validado antes de llegar aquí), siempre 1-12; MESES_ES/MESES_EN son arrays fijos de 13 posiciones
    mes: MESES_ES[numMes], mesEn: MESES_EN[numMes], año,
    fotos: fotos.map((f, i) => ({
      id:                `jpl_${mes}_${String(i + 1).padStart(3, '0')}`,
      fotos:             f.fotos || [],
      credito:           f.credito,
      municipio:         f.municipio,
      subregion:         f.subregion,
      especieEs:         f.especieEs,
      especieEn:         f.especieEn,
      especieCientifico: f.especieCientifico,
      grupo:             f.grupo,
      iucn:              f.iucn,
      endemica:          f.endemica,
      descripcionEs:     f.descripcionEs,
      descripcionEn:     f.descripcionEn,
    })),
  };

  const dataDir = path.join(FRONTEND, 'comunidad/jovenes_pa_lante/data');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- dataDir lo arma el servidor con una ruta fija, no el cliente
  fs.mkdirSync(dataDir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  fs.writeFileSync(path.join(dataDir, `fotos_${mes.replace('-', '_')}.json`), JSON.stringify(payload, null, 2));

  actualizarIndice(path.join(dataDir, 'fotos_biodiversidad.json'), {
    // eslint-disable-next-line security/detect-object-injection -- ídem, numMes siempre 1-12
    id: mes, mes: MESES_ES[numMes], mesEn: MESES_EN[numMes], año,
    count: fotos.length, portada: fotos[0].fotos?.[0] || '',
    archivo: `data/fotos_${mes.replace('-', '_')}.json`,
  });

  await JplPhoto.updateMany({ mes }, { publicado: true });
  await invalidate(redis, 'jpl:meses', `jpl:fotos:${mes}`);
  return { count: fotos.length };
}

async function publicarGc(mes) {
  const [año, numMes] = mes.split('-').map(Number);
  const fotos = await GcPhoto.find({ mes }).sort('orden createdAt').lean();
  if (!fotos.length) return null;

  const payload = {
    // eslint-disable-next-line security/detect-object-injection -- numMes sale de mes.split('-') ('YYYY-MM' ya validado antes de llegar aquí), siempre 1-12; MESES_ES/MESES_EN son arrays fijos de 13 posiciones
    mes: MESES_ES[numMes], mesEn: MESES_EN[numMes], año,
    fotos: fotos.map((f, i) => ({
      id:            `gc_${mes}_${String(i + 1).padStart(3, '0')}`,
      foto:          f.foto,
      credito:       f.credito,
      municipio:     f.municipio,
      subregion:     f.subregion,
      cuenca:        f.cuenca,
      tituloEs:      f.tituloEs,
      tituloEn:      f.tituloEn,
      descripcionEs: f.descripcionEs,
      descripcionEn: f.descripcionEn,
    })),
  };

  const dataDir = path.join(FRONTEND, 'comunidad/guarda_cuencas/data');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- dataDir lo arma el servidor con una ruta fija, no el cliente
  fs.mkdirSync(dataDir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ídem
  fs.writeFileSync(path.join(dataDir, `cuencas_${mes.replace('-', '_')}.json`), JSON.stringify(payload, null, 2));

  actualizarIndice(path.join(dataDir, 'fotos_cuencas.json'), {
    // eslint-disable-next-line security/detect-object-injection -- ídem, numMes siempre 1-12
    id: mes, mes: MESES_ES[numMes], mesEn: MESES_EN[numMes], año,
    count: fotos.length, portada: fotos[0].foto,
    archivo: `data/cuencas_${mes.replace('-', '_')}.json`,
  });

  await GcPhoto.updateMany({ mes }, { publicado: true });
  await invalidate(redis, 'gc:meses', `gc:fotos:${mes}`);
  return { count: fotos.length };
}

module.exports = { publicarJpl, publicarGc };
