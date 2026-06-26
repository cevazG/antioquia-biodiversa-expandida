'use strict';
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

// Asigna un traceId único a cada petición y loguea método, path, status y tiempo de respuesta.
module.exports = function requestLogger(req, res, next) {
  req.traceId = randomUUID();
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const meta = { traceId: req.traceId, method: req.method, path: req.path, status: res.statusCode, ms };
    if (res.statusCode >= 500) {
      logger.error('request', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('request', meta);
    } else {
      logger.info('request', meta);
    }
  });

  next();
};
