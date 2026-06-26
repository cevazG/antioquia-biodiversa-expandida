'use strict';
const mongoose = require('mongoose');
const Redis    = require('ioredis');
const logger   = require('./utils/logger');

const connCom = mongoose.createConnection(process.env.MONGODB_URI_COM);

// Redis standalone — modo degradado si no está disponible
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest:  1,
  enableReadyCheck:      false,
  lazyConnect:           true,
  retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
});
redis.on('connect', () => logger.info('Redis conectado'));
redis.on('error',   (err) => logger.warn('Redis no disponible', { error: err.message }));

async function connectDB() {
  await connCom.asPromise();
  logger.info('BD Comunidad conectada', { host: connCom.host });
  try {
    await redis.connect();
  } catch (_) {
    // Redis opcional — la app sigue funcionando sin caché
  }
}

module.exports = { connectDB, connCom, redis };
