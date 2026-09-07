'use strict';
// Caso de uso: publicar el JSON del mes que lee el frontend estático.
// Orquesta: leer de la base de datos (repositorio) → transformar al
// payload público (dominio, sin I/O) → escribir archivos (publicador) →
// marcar como publicadas (repositorio) → invalidar caché.
const Foto = require('../../domain/Foto');
const { ErrorSinContenido } = require('../../domain/errores');

function crearPublicarMes({ repositorio, publicador, cache }) {
  return async function publicarMes(mes) {
    const fotos = await repositorio.buscarPorMes(mes);
    if (!fotos.length) throw new ErrorSinContenido('Sin fotos para publicar');

    const payload = Foto.aPayloadPublicacion(fotos, mes);
    const resultado = await publicador.publicarMes(mes, payload);
    await repositorio.marcarPublicadas(mes);

    if (cache) await cache.invalidar(`jpl:fotos:${mes}`, 'jpl:stats:analytics', 'jpl:stats:monthly');
    return resultado;
  };
}

module.exports = { crearPublicarMes };
