'use strict';
/**
 * Puerto — contrato para publicar el JSON mensual que lee el frontend
 * estático (comunidad/guarda_cuencas/data/). No toca la base de datos:
 * recibe el payload ya armado por el caso de uso `publicarMes`.
 *
 * @typedef {Object} PublicadorCuencas
 * @property {function(string, Object): Promise<{count: number}>} publicarMes
 */
module.exports = {};
