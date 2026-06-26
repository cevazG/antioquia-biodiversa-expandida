'use strict';
const logger = require('./logger');

// TTLs en segundos según Propuesta Técnica v2.1
const TTL = {
  JPL_MESES:   86400,  // 24 h
  JPL_FOTOS:     600,  // 10 min
  JPL_STATS:    3600,  // 1 h
  GC_MESES:    86400,  // 24 h
  GC_FOTOS:      600,  // 10 min
};

/**
 * Devuelve el valor cacheado si existe; si no, ejecuta fn(), lo cachea y lo retorna.
 * Si Redis no está disponible, ejecuta fn() directamente sin caché (modo degradado).
 */
async function getCached(redis, key, ttl, fn) {
  try {
    const hit = await redis.get(key);
    if (hit !== null) {
      logger.info('cache hit', { key });
      return JSON.parse(hit);
    }
  } catch (err) {
    logger.warn('cache get fallido, consultando BD', { key, error: err.message });
    return fn();
  }

  const result = await fn();

  try {
    await redis.setex(key, ttl, JSON.stringify(result));
    logger.info('cache set', { key, ttl });
  } catch (err) {
    logger.warn('cache set fallido', { key, error: err.message });
  }

  return result;
}

/**
 * Elimina las claves indicadas. Acepta patrones con wildcard (*).
 * Silencioso si Redis no está disponible.
 */
async function invalidate(redis, ...keys) {
  try {
    const toDelete = [];
    for (const k of keys) {
      if (k.includes('*')) {
        const found = await redis.keys(k);
        toDelete.push(...found);
      } else {
        toDelete.push(k);
      }
    }
    if (toDelete.length) {
      await redis.del(...toDelete);
      logger.info('cache invalidado', { keys: toDelete });
    }
  } catch (err) {
    logger.warn('cache invalidation fallida', { keys, error: err.message });
  }
}

module.exports = { getCached, invalidate, TTL };
