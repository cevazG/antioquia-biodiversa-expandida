'use strict';
const verificarRecaptcha = require('../../../../modules/auth/infrastructure/verificarRecaptcha');

describe('verificarRecaptcha', () => {
  const ORIGINAL_FETCH = global.fetch;
  const ORIGINAL_SECRET = process.env.RECAPTCHA_SECRET_KEY;

  beforeEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = 'secret-de-prueba';
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    process.env.RECAPTCHA_SECRET_KEY = ORIGINAL_SECRET;
  });

  test('devuelve false (no llama a Google) si no hay token', async () => {
    global.fetch = jest.fn();

    expect(await verificarRecaptcha(undefined)).toBe(false);
    expect(await verificarRecaptcha('')).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('devuelve true cuando Google responde success:true', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true }) });

    const ok = await verificarRecaptcha('token-valido');

    expect(ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('devuelve false cuando Google responde success:false', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }) });

    expect(await verificarRecaptcha('token-invalido')).toBe(false);
  });
});
