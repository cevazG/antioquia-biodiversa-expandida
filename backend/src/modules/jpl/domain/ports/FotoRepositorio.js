'use strict';
/**
 * Puerto — contrato que debe cumplir cualquier adaptador de persistencia de
 * fotos JPL. No es una clase abstracta ni se fuerza en runtime (JavaScript
 * no tiene interfaces): este archivo documenta el contrato por convención,
 * y cada adaptador en infrastructure/ implementa estas mismas firmas.
 *
 * @typedef {Object} FotoRepositorio
 * @property {function(): Promise<string[]>} listarMesesDistintos
 *   Meses con al menos una foto, ordenados de más reciente a más antiguo.
 * @property {function(string): Promise<number>} contarPorMes
 *   Cantidad de fotos ya guardadas en ese mes (para calcular el campo `orden`).
 * @property {function(string): Promise<Object[]>} buscarPorMes
 *   Fotos de un mes, ordenadas por `orden` y luego `createdAt`.
 * @property {function(string): Promise<Object|null>} buscarPorId
 * @property {function(Object): Promise<Object>} crear
 * @property {function(string, Object): Promise<Object|null>} actualizar
 * @property {function(string): Promise<Object|null>} eliminarPorId
 * @property {function(string): Promise<void>} marcarPublicadas
 *   Marca `publicado: true` en todas las fotos de ese mes.
 */
module.exports = {};
