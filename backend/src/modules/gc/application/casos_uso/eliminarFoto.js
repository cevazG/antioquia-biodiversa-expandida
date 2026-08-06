'use strict';
const { ErrorNoEncontrado } = require('../../domain/errores');

function crearEliminarFoto({ repositorio, almacenamiento, cache }) {
  return async function eliminarFoto(id) {
    const eliminada = await repositorio.eliminarPorId(id);
    if (!eliminada) throw new ErrorNoEncontrado('No encontrada');

    almacenamiento.eliminar(eliminada.foto);

    if (cache) await cache.invalidar('gc:fotos:*');
    return { ok: true };
  };
}

module.exports = { crearEliminarFoto };
