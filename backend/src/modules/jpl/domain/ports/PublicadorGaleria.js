'use strict';
/**
 * Puerto — contrato para publicar el JSON mensual que lee el frontend
 * estático (comunidad/jovenes_pa_lante/data/). No toca la base de datos:
 * recibe el payload ya armado por el caso de uso `publicarMes`.
 *
 * @typedef {Object} PublicadorGaleria
 * @property {function(string, Object): Promise<{count: number}>} publicarMes
 *   (mes, payload) → escribe fotos_{mes}.json y actualiza el índice de meses.
 */
module.exports = {};
