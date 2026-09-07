'use strict';
const Usuario = require('../../domain/Usuario');
const { ErrorNoEncontrado, ErrorUsuarioDuplicado } = require('../../domain/errores');

function crearActualizarUsuario({ repositorio, hasher }) {
  return async function actualizarUsuario(id, crudos) {
    const datos = Usuario.crearDatosUsuario(crudos);

    // El usuario (login handle) puede estar cambiando — confirmar que no
    // choca con OTRO registro (buscarPorUsuario, no existeUsuario, para
    // poder excluir el propio id que se está editando).
    const conflicto = await repositorio.buscarPorUsuario(datos.usuario);
    if (conflicto && String(conflicto._id) !== String(id)) {
      throw new ErrorUsuarioDuplicado('Ya existe un usuario con ese nombre de usuario');
    }

    const update = { ...datos };
    if (crudos.password) {
      Usuario.validarPassword(crudos.password);
      update.passwordHash = hasher.hashear(crudos.password);
    }
    if (typeof crudos.activo === 'boolean') {
      update.activo = crudos.activo;
    }

    const actualizado = await repositorio.actualizar(id, update);
    if (!actualizado) throw new ErrorNoEncontrado('Usuario no encontrado');
    return actualizado;
  };
}

module.exports = { crearActualizarUsuario };
