'use strict';
const { requireAdmin } = require('../../middleware/adminAuth');

function mockReq(sessionData = {}) {
  return { session: sessionData };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireAdmin', () => {
  test('llama next() cuando la sesion tiene isAdmin=true', () => {
    const req  = mockReq({ isAdmin: true });
    const res  = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('responde 401 cuando no hay sesion', () => {
    const req  = { session: null };
    const res  = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado' });
  });

  test('responde 401 cuando isAdmin es false', () => {
    const req  = mockReq({ isAdmin: false });
    const res  = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
