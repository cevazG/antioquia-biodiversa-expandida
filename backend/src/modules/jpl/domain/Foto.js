'use strict';
// Entidad Foto (JPL) — funciones puras, sin I/O ni conocimiento de
// Mongoose/Express. Es el corazón del dominio: reglas de negocio que no
// deberían cambiar aunque cambie la base de datos o el framework HTTP.
const { ErrorValidacion } = require('./errores');
const { MESES_ES, MESES_EN } = require('./meses');
const { GRUPOS_VALIDOS, SUBREGIONES_VALIDAS, IUCN_VALIDOS } = require('../../../config/catalogo');

// Valida y normaliza los campos "de datos" de una foto (no incluye
// archivos, eso es responsabilidad del puerto AlmacenamientoFotos). Mismo
// orden y mismos mensajes de validación que tenía routes/admin.js, para no
// romper el contrato de errores que ya consume admin/jpl.js.
function crearDatosFoto(crudos) {
  const especieEs = crudos.especieEs?.trim();
  if (!especieEs) throw new ErrorValidacion('Se requiere el nombre común de la especie');

  if (!GRUPOS_VALIDOS.includes(crudos.grupo)) {
    throw new ErrorValidacion('Grupo taxonómico no reconocido');
  }
  if (!SUBREGIONES_VALIDAS.includes(crudos.subregion)) {
    throw new ErrorValidacion('Subregión no reconocida');
  }
  if (crudos.iucn && !IUCN_VALIDOS.includes(crudos.iucn)) {
    throw new ErrorValidacion('Código IUCN no reconocido');
  }

  return {
    especieEs,
    especieEn:         crudos.especieEn         || '',
    especieCientifico: crudos.especieCientifico || '',
    grupo:             crudos.grupo,
    subregion:         crudos.subregion,
    iucn:              crudos.iucn || 'DD',
    endemica:          crudos.endemica === 'true' || crudos.endemica === true,
    descripcionEs:     crudos.descripcionEs || '',
    descripcionEn:     crudos.descripcionEn || '',
    credito:           crudos.credito   || '',
    municipio:         crudos.municipio || '',
  };
}

// Convierte las fotos ya guardadas de un mes en el payload público que
// publica la galería (comunidad/jovenes_pa_lante/data/fotos_{mes}.json).
// Pura transformación de datos — no toca disco ni base de datos.
function aPayloadPublicacion(fotosDelMes, mes) {
  const [año, numMes] = mes.split('-').map(Number);
  return {
    // eslint-disable-next-line security/detect-object-injection -- numMes sale de mes.split('-') ('YYYY-MM' validado antes de llegar aquí), siempre 1-12; MESES_ES/MESES_EN son arrays fijos de 13 posiciones
    mes: MESES_ES[numMes], mesEn: MESES_EN[numMes], año,
    fotos: fotosDelMes.map((f, i) => ({
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
}

module.exports = { crearDatosFoto, aPayloadPublicacion };
