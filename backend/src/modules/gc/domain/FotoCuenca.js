'use strict';
// Entidad FotoCuenca (Guarda Cuencas) — funciones puras, sin I/O ni
// conocimiento de Mongoose/Express.
const { ErrorValidacion } = require('./errores');
const { MESES_ES, MESES_EN } = require('./meses');
const { SUBREGIONES_VALIDAS } = require('../../../config/catalogo');

// Valida y normaliza los campos "de datos" de una foto de cuenca (no
// incluye el archivo). Mismo orden y mensajes de validación que tenía
// routes/admin.js, para no romper el contrato de errores que ya consume
// admin/gc.js.
function crearDatosFoto(crudos) {
  const cuenca = crudos.cuenca?.trim();
  if (!cuenca) throw new ErrorValidacion('Se requiere el nombre de la cuenca');

  const tituloEs = crudos.tituloEs?.trim();
  if (!tituloEs) throw new ErrorValidacion('Se requiere un título');

  if (!SUBREGIONES_VALIDAS.includes(crudos.subregion)) {
    throw new ErrorValidacion('Subregión no reconocida');
  }

  return {
    cuenca,
    tituloEs,
    tituloEn:      crudos.tituloEn      || '',
    subregion:     crudos.subregion,
    descripcionEs: crudos.descripcionEs || '',
    descripcionEn: crudos.descripcionEn || '',
    credito:       crudos.credito       || '',
    municipio:     crudos.municipio     || '',
  };
}

// Convierte las fotos ya guardadas de un mes en el payload público que
// publica la galería (comunidad/guarda_cuencas/data/cuencas_{mes}.json).
function aPayloadPublicacion(fotosDelMes, mes) {
  const [año, numMes] = mes.split('-').map(Number);
  return {
    // eslint-disable-next-line security/detect-object-injection -- numMes sale de mes.split('-') ('YYYY-MM' validado antes de llegar aquí), siempre 1-12; MESES_ES/MESES_EN son arrays fijos de 13 posiciones
    mes: MESES_ES[numMes], mesEn: MESES_EN[numMes], año,
    fotos: fotosDelMes.map((f, i) => ({
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
}

module.exports = { crearDatosFoto, aPayloadPublicacion };
