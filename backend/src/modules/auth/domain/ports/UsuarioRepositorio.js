'use strict';
/**
 * Puerto — contrato que debe cumplir cualquier adaptador de persistencia de
 * usuarios del panel admin. No es una clase abstracta ni se fuerza en
 * runtime: este archivo documenta el contrato por convención.
 *
 * @typedef {Object} UsuarioRepositorio
 * @property {function(): Promise<Object[]>} listar
 * @property {function(string): Promise<Object|null>} buscarPorId
 * @property {function(string): Promise<Object|null>} buscarPorUsuario
 *   Búsqueda por el handle de login (`usuario`), no por `_id`.
 * @property {function(string): Promise<boolean>} existeUsuario
 *   Chequeo de unicidad antes de crear.
 * @property {function(Object): Promise<Object>} crear
 * @property {function(string, Object): Promise<Object|null>} actualizar
 * @property {function(string): Promise<Object|null>} buscarPorIdConMfaSecret
 *   Único método que expone mfaSecret — para verificar el código TOTP.
 * @property {function(string, string): Promise<void>} guardarSecretoMfa
 * @property {function(string): Promise<Object|null>} resetearMfa
 */
module.exports = {};
