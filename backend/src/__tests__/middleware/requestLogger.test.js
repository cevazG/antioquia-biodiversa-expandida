'use strict';
const { EventEmitter } = require('events');

jest.mock('../../utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

const logger = require('../../utils/logger');
const requestLogger = require('../../middleware/requestLogger');

function mockRes(statusCode) {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  return res;
}

describe('requestLogger', () => {
  beforeEach(() => jest.clearAllMocks());

  test('asigna un traceId a la petición y llama next()', () => {
    const req = {};
    const res = mockRes(200);
    const next = jest.fn();

    requestLogger(req, res, next);

    expect(typeof req.traceId).toBe('string');
    expect(req.traceId.length).toBeGreaterThan(0);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('registra con logger.info cuando el status es < 400', () => {
    const req = { method: 'GET', path: '/api/health' };
    const res = mockRes(200);

    requestLogger(req, res, jest.fn());
    res.emit('finish');

    expect(logger.info).toHaveBeenCalledWith('request', expect.objectContaining({ status: 200, method: 'GET', path: '/api/health' }));
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('registra con logger.warn cuando el status es 4xx', () => {
    const req = {};
    const res = mockRes(404);
    requestLogger(req, res, jest.fn());
    res.emit('finish');

    expect(logger.warn).toHaveBeenCalledWith('request', expect.objectContaining({ status: 404 }));
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('registra con logger.error cuando el status es 5xx', () => {
    const req = {};
    const res = mockRes(500);
    requestLogger(req, res, jest.fn());
    res.emit('finish');

    expect(logger.error).toHaveBeenCalledWith('request', expect.objectContaining({ status: 500 }));
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
