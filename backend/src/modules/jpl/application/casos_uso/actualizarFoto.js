'use strict';
// Caso de uso: editar una foto JPL existente. `fotosExistentes` ya llega
// parseado (array de rutas) — la interpretación de cómo el HTTP transporta
// ese array como string JSON es responsabilidad de la capa de interfaces,
// no de este caso de uso.
const Foto = require('../../domain/Foto');
const { ErrorValidacion, ErrorNoEncontrado } = require('../../domain/errores');

function crearActualizarFoto({ repositorio, almacenamiento, cache }) {
  return async function actualizarFoto({ id, mes, fotosExistentes, archivosNuevos, ...crudos }) {
    const datos = Foto.crearDatosFoto(crudos);

    const anterior = await repositorio.buscarPorId(id);
    if (anterior) {
      const eliminadas = (anterior.fotos || []).filter(p => !fotosExistentes.includes(p));
      eliminadas.forEach(p => almacenamiento.eliminar(p));
    }

    const nuevasRutas = [];
    for (const archivo of archivosNuevos || []) {
      nuevasRutas.push(await almacenamiento.guardar(
        archivo.buffer, archivo.originalname, mes, datos.grupo || 'sin-grupo', datos.especieCientifico
      ));
    }

    const fotos = [...fotosExistentes, ...nuevasRutas].slice(0, 3);
    if (!fotos.length) throw new ErrorValidacion('Se requiere al menos una foto');

    // Cualquier edición vuelve a poner la foto como no publicada — si ya
    // estaba en el JSON público, debe republicarse para reflejar el cambio.
    const actualizada = await repositorio.actualizar(id, { ...datos, fotos, publicado: false });
    if (!actualizada) throw new ErrorNoEncontrado('No encontrada');

    if (cache) await cache.invalidar(`jpl:fotos:${mes}`, 'jpl:stats:analytics', 'jpl:stats:monthly');
    return actualizada;
  };
}

module.exports = { crearActualizarFoto };
