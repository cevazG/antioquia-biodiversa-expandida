'use strict';
const { ErrorNoEncontrado } = require('../../domain/errores');

function crearEliminarFoto({ repositorio, almacenamiento, cache }) {
  return async function eliminarFoto(id) {
    const eliminada = await repositorio.eliminarPorId(id);
    if (!eliminada) throw new ErrorNoEncontrado('No encontrada');

    (eliminada.fotos || []).forEach(p => almacenamiento.eliminar(p));

    if (cache) await cache.invalidar('jpl:fotos:*', 'jpl:stats:analytics', 'jpl:stats:monthly');
    return { ok: true };
  };
}

module.exports = { crearEliminarFoto };
