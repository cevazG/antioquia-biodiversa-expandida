'use strict';
const Usuario = require('../../domain/Usuario');
const { ErrorUsuarioDuplicado } = require('../../domain/errores');

function crearCrearUsuario({ repositorio, hasher }) {
  return async function crearUsuario(crudos) {
    const datos = Usuario.crearDatosUsuario(crudos);
    Usuario.validarPassword(crudos.password);

    if (await repositorio.existeUsuario(datos.usuario)) {
      throw new ErrorUsuarioDuplicado('Ya existe un usuario con ese nombre de usuario');
    }

    const passwordHash = hasher.hashear(crudos.password);
    return repositorio.crear({ ...datos, passwordHash });
  };
}

module.exports = { crearCrearUsuario };
