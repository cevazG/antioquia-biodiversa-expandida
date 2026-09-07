'use strict';
// Caso de uso: publicar el JSON del mes que lee el frontend estático.
const FotoCuenca = require('../../domain/FotoCuenca');
const { ErrorSinContenido } = require('../../domain/errores');

function crearPublicarMes({ repositorio, publicador, cache }) {
  return async function publicarMes(mes) {
    const fotos = await repositorio.buscarPorMes(mes);
    if (!fotos.length) throw new ErrorSinContenido('Sin fotos para publicar');

    const payload = FotoCuenca.aPayloadPublicacion(fotos, mes);
    const resultado = await publicador.publicarMes(mes, payload);
    await repositorio.marcarPublicadas(mes);

    if (cache) await cache.invalidar(`gc:fotos:${mes}`);
    return resultado;
  };
}

module.exports = { crearPublicarMes };
