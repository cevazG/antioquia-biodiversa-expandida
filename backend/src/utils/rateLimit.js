'use strict';
// Limita intentos en endpoints sensibles a fuerza bruta — capa adicional a
// reCAPTCHA (que un atacante decidido puede resolver con servicios
// automatizados de terceros) y al keyspace pequeño de un código TOTP de 6
// dígitos (1 millón de combinaciones, brute-forceable sin límite de tasa).
//
// Desactivado en NODE_ENV=test: los tests de integración hacen un login
// nuevo por caso de prueba contra la misma app (misma "IP" simulada por
// supertest), lo que agotaría el límite real en la primera decena de
// tests. El comportamiento del limitador en sí se prueba por separado en
// __tests__/utils/rateLimit.test.js, sin este atajo.
const rateLimit = require('express-rate-limit');

const skipEnTest = () => process.env.NODE_ENV === 'test';

function crearLimitador({ windowMs, max, mensaje }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipEnTest,
    message: { error: mensaje },
  });
}

const limiterLogin = crearLimitador({
  windowMs: 15 * 60 * 1000,
  max: 10,
  mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos antes de volver a intentarlo.',
});

const limiterMfa = crearLimitador({
  windowMs: 15 * 60 * 1000,
  max: 10,
  mensaje: 'Demasiados intentos de verificación. Espera unos minutos antes de volver a intentarlo.',
});

const limiterAutofill = crearLimitador({
  windowMs: 60 * 1000,
  max: 30,
  mensaje: 'Demasiadas solicitudes. Espera un momento antes de volver a intentarlo.',
});

module.exports = { crearLimitador, limiterLogin, limiterMfa, limiterAutofill };
