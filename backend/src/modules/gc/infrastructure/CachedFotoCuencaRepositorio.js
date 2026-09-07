'use strict';
// Decorador — envuelve un FotoCuencaRepositorio real y agrega caché de
// lectura (Redis) sobre listarMesesDistintos/buscarPorMes, reusando el
// mismo mecanismo del proyecto (utils/cache.js).
const { getCached, TTL } = require('../../../utils/cache');

function crearCachedFotoCuencaRepositorio(repositorioReal, redis) {
  return {
    ...repositorioReal,
    listarMesesDistintos: () =>
      getCached(redis, 'gc:meses', TTL.GC_MESES, () => repositorioReal.listarMesesDistintos()),
    buscarPorMes: (mes) =>
      getCached(redis, `gc:fotos:${mes}`, TTL.GC_FOTOS, () => repositorioReal.buscarPorMes(mes)),
  };
}

module.exports = { crearCachedFotoCuencaRepositorio };
