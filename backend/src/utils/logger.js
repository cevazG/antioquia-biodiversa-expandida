'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../../logs');

// eslint-disable-next-line security/detect-non-literal-fs-filename -- LOG_DIR es variable de entorno del servidor, no input externo
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { servicio: 'antioquia-biodiversa-api' },
  transports: [
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
    }),
  ],
});

// En desarrollo también loguea en consola con formato legible
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ level, message, timestamp, traceId, ...meta }) => {
        const trace = traceId ? ` [${traceId}]` : '';
        const extra = Object.keys(meta).length && meta.servicio === undefined
          ? ` ${JSON.stringify(meta)}`
          : '';
        return `${timestamp}${trace} ${level}: ${message}${extra}`;
      })
    ),
  }));
}

module.exports = logger;
