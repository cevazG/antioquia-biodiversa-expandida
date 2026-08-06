'use strict';
// Caso de uso: dar de alta una foto JPL. Orquesta validación (dominio),
// guardado de archivos (puerto AlmacenamientoFotos) y persistencia (puerto
// FotoRepositorio) — no sabe si detrás hay Express, Mongoose o sharp.
const Foto = require('../../domain/Foto');
const { ErrorValidacion } = require('../../domain/errores');

function crearCrearFoto({ repositorio, almacenamiento, cache }) {
  return async function crearFoto({ mes, archivosNuevos, ...crudos }) {
    // El chequeo de archivos va primero, igual que en la ruta original —
    // el mensaje de error que ve el frontend depende de este orden.
    if (!archivosNuevos?.length) throw new ErrorValidacion('Se requiere al menos una foto');

    const datos = Foto.crearDatosFoto(crudos);

    const fotoPaths = [];
    for (const archivo of archivosNuevos) {
      fotoPaths.push(await almacenamiento.guardar(
        archivo.buffer, archivo.originalname, mes, datos.grupo || 'sin-grupo', datos.especieCientifico
      ));
    }

    const orden = await repositorio.contarPorMes(mes);
    const creada = await repositorio.crear({ mes, orden, fotos: fotoPaths, ...datos });

    if (cache) await cache.invalidar(`jpl:fotos:${mes}`, 'jpl:stats:analytics', 'jpl:stats:monthly');
    return creada;
  };
}

module.exports = { crearCrearFoto };
