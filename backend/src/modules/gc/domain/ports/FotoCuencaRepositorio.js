'use strict';
/**
 * Puerto — contrato que debe cumplir cualquier adaptador de persistencia de
 * fotos de Guarda Cuencas. No es una clase abstracta ni se fuerza en
 * runtime: este archivo documenta el contrato por convención.
 *
 * @typedef {Object} FotoCuencaRepositorio
 * @property {function(): Promise<string[]>} listarMesesDistintos
 * @property {function(string): Promise<number>} contarPorMes
 * @property {function(string): Promise<Object[]>} buscarPorMes
 * @property {function(string): Promise<Object|null>} buscarPorId
 * @property {function(Object): Promise<Object>} crear
 * @property {function(string, Object): Promise<Object|null>} actualizar
 * @property {function(string): Promise<Object|null>} eliminarPorId
 * @property {function(string): Promise<void>} marcarPublicadas
 */
module.exports = {};
