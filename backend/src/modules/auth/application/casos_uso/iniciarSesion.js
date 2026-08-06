'use strict';
// Caso de uso: login. El mensaje de error es deliberadamente el mismo
// (genérico) sea que el usuario no exista, esté inactivo, o la clave sea
// incorrecta — no hay que filtrar cuáles usuarios existen en el sistema.
const credencial = require('../../domain/credencial');
const { ErrorCredencialInvalida, ErrorUsuarioInactivo } = require('../../domain/errores');

const MENSAJE_GENERICO = 'Usuario o contraseña incorrectos';

function crearIniciarSesion({ repositorio }) {
  return async function iniciarSesion({ usuario, password }) {
    const encontrado = await repositorio.buscarPorUsuario((usuario || '').trim().toLowerCase());
    if (!encontrado) throw new ErrorCredencialInvalida(MENSAJE_GENERICO);
    if (!encontrado.activo) throw new ErrorUsuarioInactivo(MENSAJE_GENERICO);
    if (!credencial.esValida(password, encontrado.passwordHash)) {
      throw new ErrorCredencialInvalida(MENSAJE_GENERICO);
    }

    return { id: encontrado._id, nombre: encontrado.nombre, usuario: encontrado.usuario, roles: encontrado.roles };
  };
}

module.exports = { crearIniciarSesion };
