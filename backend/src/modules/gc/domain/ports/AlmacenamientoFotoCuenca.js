'use strict';
/**
 * Puerto — contrato para guardar/eliminar el archivo de foto de una
 * cuenca. A diferencia de JPL (hasta 3 fotos por especie), Guarda Cuencas
 * tiene un único archivo por registro, sin slug de especie.
 *
 * @typedef {Object} AlmacenamientoFotoCuenca
 * @property {function(Buffer, string): Promise<string>} guardar
 *   (buffer, mes) → ruta relativa guardada.
 * @property {function(string): void} eliminar
 *   Borra el archivo en esa ruta relativa si existe. Silencioso si no existe.
 */
module.exports = {};
