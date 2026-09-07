'use strict';
// "Eliminar" un usuario desde el panel desactiva (activo:false), no borra
// el documento — preserva auditoría y es reversible, mismo criterio que
// visible/publicado en el resto del proyecto.
const { ErrorNoEncontrado } = require('../../domain/errores');

function crearDesactivarUsuario({ repositorio }) {
  return async function desactivarUsuario(id) {
    const actualizado = await repositorio.actualizar(id, { activo: false });
    if (!actualizado) throw new ErrorNoEncontrado('Usuario no encontrado');
    return actualizado;
  };
}

module.exports = { crearDesactivarUsuario };
