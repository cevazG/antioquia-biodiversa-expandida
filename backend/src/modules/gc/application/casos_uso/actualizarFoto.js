'use strict';
// Caso de uso: editar una foto de cuenca existente. El archivo es opcional
// al editar — si no viene uno nuevo, la foto guardada no cambia (a
// diferencia de JPL, acá no hay que fusionar/recortar un array).
const FotoCuenca = require('../../domain/FotoCuenca');
const { ErrorNoEncontrado } = require('../../domain/errores');

function crearActualizarFoto({ repositorio, almacenamiento, cache }) {
  return async function actualizarFoto({ id, mes, archivo, ...crudos }) {
    const datos = FotoCuenca.crearDatosFoto(crudos);
    // Cualquier edición vuelve a poner la foto como no publicada.
    const update = { ...datos, publicado: false };

    if (archivo) {
      const anterior = await repositorio.buscarPorId(id);
      if (anterior) almacenamiento.eliminar(anterior.foto);
      update.foto = await almacenamiento.guardar(archivo.buffer, mes);
    }

    const actualizada = await repositorio.actualizar(id, update);
    if (!actualizada) throw new ErrorNoEncontrado('No encontrada');

    if (cache) await cache.invalidar(`gc:fotos:${mes}`);
    return actualizada;
  };
}

module.exports = { crearActualizarFoto };
