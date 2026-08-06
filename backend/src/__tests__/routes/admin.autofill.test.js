'use strict';
const request = require('supertest');
const { makeApp } = require('../helpers/app');
const { mockQuery } = require('../helpers/mockQuery');

jest.mock('../../db', () => ({
  connCom: { readyState: 1 },
  redis: {
    get: jest.fn().mockResolvedValue(null), setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1), keys: jest.fn().mockResolvedValue([]), ping: jest.fn().mockResolvedValue('PONG'),
  },
}));
jest.mock('../../modules/auth/infrastructure/verificarRecaptcha', () => jest.fn().mockResolvedValue(true));
jest.mock('../../models/JplPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), countDocuments: jest.fn(),
  create: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(), updateMany: jest.fn(),
}));
jest.mock('../../models/GcPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), countDocuments: jest.fn(),
  create: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(), updateMany: jest.fn(),
}));
jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const Usuario = require('../../models/Usuario');
const PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);
const MFA_SECRET_PRUEBA = 'JBSWY3DPEHPK3PXP';
const CUALQUIER_USUARIO = {
  _id: 'u1', nombre: 'Curador', usuario: 'curador', passwordHash: PASSWORD_HASH,
  roles: ['Curador.Biodiversidad'], activo: true, mfaSecret: MFA_SECRET_PRUEBA, // /autofill solo exige requireAuth, no un rol específico
};

const testApp = makeApp(require('../../routes/admin'));

async function agenteLogueado() {
  Usuario.findOne.mockReturnValue(mockQuery(CUALQUIER_USUARIO));
  Usuario.findById.mockReturnValue(mockQuery(CUALQUIER_USUARIO));
  const agente = request.agent(testApp);
  await agente.post('/login').send({ usuario: 'curador', password: 'clave-prueba' });
  await agente.post('/login/mfa').send({ codigo: authenticator.generate(MFA_SECRET_PRUEBA) });
  return agente;
}

function jsonResponse(data) {
  return Promise.resolve({ json: () => Promise.resolve(data) });
}

describe('POST /autofill', () => {
  afterEach(() => { delete global.fetch; });

  test('rechaza con 401 sin sesión de admin', async () => {
    const res = await request(testApp).post('/autofill').send({ scientificName: 'Amazilia tzacatl' });
    expect(res.status).toBe(401);
  });

  test('rechaza con 400 si no viene nombre científico', async () => {
    const agente = await agenteLogueado();
    const res = await agente.post('/autofill').send({ scientificName: '  ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Se requiere nombre científico' });
  });

  test('devuelve data:null si iNaturalist no encuentra el taxón', async () => {
    global.fetch = jest.fn(() => jsonResponse({ results: [] }));
    const agente = await agenteLogueado();

    const res = await agente.post('/autofill').send({ scientificName: 'Especie inexistente' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: null, msg: 'No encontrado en iNaturalist' });
  });

  test('arma nombre ES/EN, IUCN y descripciones a partir de las 3 consultas a iNaturalist', async () => {
    global.fetch = jest.fn((url) => {
      if (/\/v1\/taxa\?/.test(url)) {
        return jsonResponse({ results: [{ id: 5676, preferred_common_name: 'Rufous-tailed Hummingbird', conservation_status: { status_name: 'near threatened' } }] });
      }
      if (/\/v1\/taxa\/5676\?locale=es/.test(url)) {
        return jsonResponse({ results: [{ preferred_common_name: 'Colibrí Cola Canela', wikipedia_summary: '<p>Resumen en español sobre el colibrí.</p>' }] });
      }
      if (/\/v1\/taxa\/5676\?locale=en/.test(url)) {
        return jsonResponse({ results: [{ wikipedia_summary: '<p>English summary about the hummingbird.</p>' }] });
      }
      return jsonResponse({ results: [] });
    });
    const agente = await agenteLogueado();

    const res = await agente.post('/autofill').send({ scientificName: 'Amazilia tzacatl' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      data: {
        nameEs: 'Colibrí Cola Canela',
        nameEn: 'Rufous-tailed Hummingbird',
        iucn: 'NT',
        descripcionEs: 'Resumen en español sobre el colibrí.',
        descripcionEn: 'English summary about the hummingbird.',
        inatUrl: 'https://www.inaturalist.org/taxa/5676',
      },
    });
  });

  test('responde 500 si la consulta a iNaturalist falla', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('timeout')));
    const agente = await agenteLogueado();

    const res = await agente.post('/autofill').send({ scientificName: 'Amazilia tzacatl' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error consultando iNaturalist');
  });
});
