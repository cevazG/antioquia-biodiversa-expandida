'use strict';
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

jest.mock('sharp', () => {
  const chain = { resize: jest.fn().mockReturnThis(), webp: jest.fn().mockReturnThis(), toFile: jest.fn().mockResolvedValue({}) };
  return jest.fn(() => chain);
});

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync:     jest.fn(),
  readdirSync:   jest.fn().mockReturnValue([]),
  existsSync:    jest.fn().mockReturnValue(false),
  unlinkSync:    jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync:  jest.fn().mockReturnValue('{"meses":[]}'),
}));

jest.mock('../../models/JplPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), countDocuments: jest.fn(),
  create: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(), updateMany: jest.fn(),
}));
const GcPhoto = require('../../models/GcPhoto');
jest.mock('../../models/GcPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), countDocuments: jest.fn(),
  create: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(), updateMany: jest.fn(),
}));
// Requerido transitivamente por routes/admin.js -> modules/auth/... — este
// archivo no ejercita login, solo necesita que requerir admin.js no truene.
jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const Usuario = require('../../models/Usuario');
const PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);
const MFA_SECRET_PRUEBA = 'JBSWY3DPEHPK3PXP';
const CURADOR_GC = {
  _id: 'u1', nombre: 'Curador GC', usuario: 'curador', passwordHash: PASSWORD_HASH,
  roles: ['Curador.GuardaCuencas'], activo: true, mfaSecret: MFA_SECRET_PRUEBA,
};

const app = require('../../routes/admin');
const testApp = makeApp(app);

async function agenteLogueado() {
  Usuario.findOne.mockReturnValue(mockQuery(CURADOR_GC));
  Usuario.findById.mockReturnValue(mockQuery(CURADOR_GC));
  const agente = request.agent(testApp);
  await agente.post('/login').send({ usuario: 'curador', password: 'clave-prueba' });
  await agente.post('/login/mfa').send({ codigo: authenticator.generate(MFA_SECRET_PRUEBA) });
  return agente;
}

beforeEach(() => jest.clearAllMocks());

describe('Rutas Guarda Cuencas — requieren sesión de admin', () => {
  test('GET /gc/meses sin sesión responde 401', async () => {
    const res = await request(testApp).get('/gc/meses');
    expect(res.status).toBe(401);
  });
});

describe('GET /gc/meses', () => {
  test('devuelve los meses ordenados de más reciente a más antiguo', async () => {
    GcPhoto.distinct.mockResolvedValue(['2026-04', '2026-06']);
    const agente = await agenteLogueado();

    const res = await agente.get('/gc/meses');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['2026-06', '2026-04']);
  });
});

describe('GET /gc/fotos/:mes', () => {
  test('devuelve las fotos del mes solicitado', async () => {
    const fotos = [{ _id: 'g1', mes: '2026-06', cuenca: 'Río Medellín' }];
    GcPhoto.find.mockReturnValue(mockQuery(fotos));
    const agente = await agenteLogueado();

    const res = await agente.get('/gc/fotos/2026-06');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fotos);
  });
});

describe('POST /gc/fotos/:mes', () => {
  test('rechaza con 400 si no viene ninguna foto', async () => {
    const agente = await agenteLogueado();

    const res = await agente.post('/gc/fotos/2026-06').field('cuenca', 'Río Medellín');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No se recibió ninguna foto' });
  });

  test('crea una foto nueva con los datos enviados', async () => {
    GcPhoto.countDocuments.mockResolvedValue(1);
    const creada = { _id: 'gcnueva1', mes: '2026-06', cuenca: 'Río Medellín' };
    GcPhoto.create.mockResolvedValue(creada);
    const agente = await agenteLogueado();

    const res = await agente
      .post('/gc/fotos/2026-06')
      .field('cuenca', 'Río Medellín')
      .field('tituloEs', 'Nacimiento del río')
      .field('subregion', 'valle_aburra')
      .attach('foto', Buffer.from('fake-image-data'), 'cuenca.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toEqual(creada);
    expect(GcPhoto.create).toHaveBeenCalledWith(expect.objectContaining({
      mes: '2026-06', orden: 1, cuenca: 'Río Medellín', tituloEs: 'Nacimiento del río',
    }));
  });

  test('rechaza con 400 si falta la cuenca', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .post('/gc/fotos/2026-06')
      .field('tituloEs', 'Nacimiento del río')
      .field('subregion', 'valle_aburra')
      .attach('foto', Buffer.from('fake-image-data'), 'cuenca.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Se requiere el nombre de la cuenca' });
    expect(GcPhoto.create).not.toHaveBeenCalled();
  });

  test('rechaza con 400 si la subregión no es válida', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .post('/gc/fotos/2026-06')
      .field('cuenca', 'Río Medellín')
      .field('tituloEs', 'Nacimiento del río')
      .field('subregion', 'narnia')
      .attach('foto', Buffer.from('fake-image-data'), 'cuenca.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Subregión no reconocida' });
    expect(GcPhoto.create).not.toHaveBeenCalled();
  });
});

describe('PUT /gc/fotos/:mes/:id', () => {
  test('responde 404 si la foto no existe', async () => {
    GcPhoto.findByIdAndUpdate.mockResolvedValue(null);
    const agente = await agenteLogueado();

    const res = await agente
      .put('/gc/fotos/2026-06/000000000000000000000000')
      .field('cuenca', 'Río Medellín')
      .field('tituloEs', 'Título')
      .field('subregion', 'valle_aburra');

    expect(res.status).toBe(404);
  });

  test('actualiza metadatos sin reemplazar la foto', async () => {
    const actualizada = { _id: 'g1', tituloEs: 'Título corregido' };
    GcPhoto.findByIdAndUpdate.mockResolvedValue(actualizada);
    const agente = await agenteLogueado();

    const res = await agente
      .put('/gc/fotos/2026-06/g1')
      .field('cuenca', 'Río Medellín')
      .field('tituloEs', 'Título corregido')
      .field('subregion', 'valle_aburra');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(actualizada);
  });
});

describe('DELETE /gc/fotos/:id', () => {
  test('responde 404 si la foto no existe', async () => {
    GcPhoto.findByIdAndDelete.mockResolvedValue(null);
    const agente = await agenteLogueado();

    const res = await agente.delete('/gc/fotos/000000000000000000000000');

    expect(res.status).toBe(404);
  });

  test('elimina la foto y responde ok', async () => {
    GcPhoto.findByIdAndDelete.mockResolvedValue({ foto: 'img/fotos/gc_2026-06/gc_001.webp' });
    const agente = await agenteLogueado();

    const res = await agente.delete('/gc/fotos/g1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
