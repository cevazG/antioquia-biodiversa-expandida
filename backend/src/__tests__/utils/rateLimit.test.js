'use strict';
// El resto de la suite depende de que rateLimit.js se autodesactive en
// NODE_ENV=test (ver comentario en el propio archivo) — así que el
// comportamiento real del límite hay que probarlo forzando otro NODE_ENV,
// en un mini-app aislado, no contra la app completa de la suite.
const express = require('express');
const request = require('supertest');
const { crearLimitador } = require('../../utils/rateLimit');

function appConLimitador(opts) {
  const app = express();
  app.use(crearLimitador(opts));
  app.get('/', (req, res) => res.json({ ok: true }));
  return app;
}

describe('crearLimitador (rate limiting)', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  afterAll(() => { process.env.NODE_ENV = ORIGINAL_ENV; });

  test('deja pasar hasta "max" solicitudes y bloquea con 429 la siguiente, con el mensaje configurado', async () => {
    process.env.NODE_ENV = 'production'; // el limitador se salta a sí mismo si NODE_ENV=test
    const app = appConLimitador({ windowMs: 60_000, max: 3, mensaje: 'Demasiadas solicitudes de prueba.' });

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    }

    const bloqueado = await request(app).get('/');
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body).toEqual({ error: 'Demasiadas solicitudes de prueba.' });
  });

  test('no bloquea nada si NODE_ENV=test — así corre el resto de la suite sin agotar el límite', async () => {
    process.env.NODE_ENV = 'test';
    const app = appConLimitador({ windowMs: 60_000, max: 1, mensaje: 'x' });

    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    }
  });
});
