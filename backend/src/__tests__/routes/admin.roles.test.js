'use strict';
// Tests de caja negra para requireAuth/requireRole (modules/auth/interfaces/http/middleware.js)
// vía las rutas reales montadas en admin.js — más representativo que mockear
// la firma de la función en aislamiento, dado que la lógica ahora depende
// de una consulta a Mongo por request.
const request = require('supertest');
const { makeApp } = require('../helpers/app');
const { mockQuery } = require('../helpers/mockQuery');

jest.mock('../../db', () => ({
  connCom: { readyState: 1 },
  redis: {
    get:    jest.fn().mockResolvedValue(null),
    setex:  jest.fn().mockResolvedValue('OK'),
    del:    jest.fn().mockResolvedValue(1),
    keys:   jest.fn().mockResolvedValue([]),
    ping:   jest.fn().mockResolvedValue('PONG'),
  },
}));

jest.mock('../../modules/auth/infrastructure/verificarRecaptcha', () => jest.fn().mockResolvedValue(true));

jest.mock('../../models/JplPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), countDocuments: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(), updateMany: jest.fn(),
}));
jest.mock('../../models/GcPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), countDocuments: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(), updateMany: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);

jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
}));
const Usuario   = require('../../models/Usuario');
const JplPhoto  = require('../../models/JplPhoto');
const GcPhoto   = require('../../models/GcPhoto');

const app = makeApp(require('../../routes/admin'));

function usuarioConRoles(roles) {
  return { _id: 'u1', nombre: 'Test', usuario: 'test', passwordHash: PASSWORD_HASH, roles, activo: true };
}

async function agenteConRoles(roles) {
  const usuario = usuarioConRoles(roles);
  Usuario.findOne.mockReturnValue(mockQuery(usuario));
  Usuario.findById.mockReturnValue(mockQuery(usuario));
  const agente = request.agent(app);
  await agente.post('/login').send({ usuario: 'test', password: 'clave-prueba' });
  return agente;
}

beforeEach(() => jest.clearAllMocks());

describe('Sin sesión — todo lo protegido responde 401', () => {
  test.each([['/jpl/meses'], ['/gc/meses'], ['/usuarios']])('%s sin sesión -> 401', async (ruta) => {
    const res = await request(app).get(ruta);
    expect(res.status).toBe(401);
  });
});

describe('Con sesión pero rol incorrecto -> 403', () => {
  test('Curador.GuardaCuencas no puede entrar a /jpl', async () => {
    const agente = await agenteConRoles(['Curador.GuardaCuencas']);
    expect((await agente.get('/jpl/meses')).status).toBe(403);
  });

  test('Curador.Biodiversidad no puede entrar a /gc', async () => {
    const agente = await agenteConRoles(['Curador.Biodiversidad']);
    expect((await agente.get('/gc/meses')).status).toBe(403);
  });

  test('Curador.Biodiversidad no puede entrar a /usuarios', async () => {
    const agente = await agenteConRoles(['Curador.Biodiversidad']);
    expect((await agente.get('/usuarios')).status).toBe(403);
  });
});

describe('Con el rol correcto -> pasa', () => {
  test('Curador.Biodiversidad entra a /jpl', async () => {
    JplPhoto.distinct.mockResolvedValue([]);
    const agente = await agenteConRoles(['Curador.Biodiversidad']);
    expect((await agente.get('/jpl/meses')).status).toBe(200);
  });

  test('Curador.GuardaCuencas entra a /gc', async () => {
    GcPhoto.distinct.mockResolvedValue([]);
    const agente = await agenteConRoles(['Curador.GuardaCuencas']);
    expect((await agente.get('/gc/meses')).status).toBe(200);
  });
});

describe('Admin.Contenido — superrole, pasa cualquier chequeo de rol', () => {
  test('entra a /jpl, /gc y /usuarios sin tener esos roles explícitos', async () => {
    JplPhoto.distinct.mockResolvedValue([]);
    GcPhoto.distinct.mockResolvedValue([]);
    Usuario.find.mockReturnValue(mockQuery([]));
    const agente = await agenteConRoles(['Admin.Contenido']);

    expect((await agente.get('/jpl/meses')).status).toBe(200);
    expect((await agente.get('/gc/meses')).status).toBe(200);
    expect((await agente.get('/usuarios')).status).toBe(200);
  });
});
