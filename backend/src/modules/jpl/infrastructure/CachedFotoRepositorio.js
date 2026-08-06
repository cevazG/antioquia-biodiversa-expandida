'use strict';
// Decorador — envuelve un FotoRepositorio real y agrega caché de lectura
// (Redis) sobre listarMesesDistintos/buscarPorMes, reusando exactamente el
// mecanismo que ya tenía el proyecto (utils/cache.js), solo movido fuera de
// los handlers Express hacia la capa de infraestructura, donde pertenece.
const { getCached, TTL } = require('../../../utils/cache');

function crearCachedFotoRepositorio(repositorioReal, redis) {
  return {
    ...repositorioReal,
    listarMesesDistintos: () =>
      getCached(redis, 'jpl:meses', TTL.JPL_MESES, () => repositorioReal.listarMesesDistintos()),
    buscarPorMes: (mes) =>
      getCached(redis, `jpl:fotos:${mes}`, TTL.JPL_FOTOS, () => repositorioReal.buscarPorMes(mes)),
  };
}

module.exports = { crearCachedFotoRepositorio };
