'use strict';
/**
 * Puerto — contrato para guardar/eliminar los archivos de foto. La capa de
 * aplicación no sabe si detrás hay `sharp` + filesystem local, un bucket
 * externo, o cualquier otra cosa — solo conoce esta forma.
 *
 * @typedef {Object} AlmacenamientoFotos
 * @property {function(Buffer, string, string, string, string): Promise<string>} guardar
 *   (buffer, nombreOriginal, mes, grupo, especieCientifico) → ruta relativa guardada.
 * @property {function(string): void} eliminar
 *   Borra el archivo en esa ruta relativa si existe. Silencioso si no existe.
 */
module.exports = {};
