'use strict';
const request = require('supertest');
const { makeApp } = require('../helpers/app');
const { mockQuery } = require('../helpers/mockQuery');

// Mock de db para evitar conexión real a MongoDB/Redis en tests
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

// sharp real intenta decodificar la imagen — con un buffer falso fallaría,
// así que se reemplaza por una cadena encadenable que no toca el archivo real.
jest.mock('sharp', () => {
  const chain = { resize: jest.fn().mockReturnThis(), webp: jest.fn().mockReturnThis(), toFile: jest.fn().mockResolvedValue({}) };
  return jest.fn(() => chain);
});

// Solo se sobreescriben las funciones que admin.js usa para escribir a disco —
// el resto de fs queda real, para no romper nada interno de express/supertest.
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync:     jest.fn(),
  readdirSync:   jest.fn().mockReturnValue([]),
  existsSync:    jest.fn().mockReturnValue(false),
  unlinkSync:    jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync:  jest.fn().mockReturnValue('{"meses":[]}'),
}));

const JplPhoto = require('../../models/JplPhoto');
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
// Requerido transitivamente por routes/admin.js -> modules/auth/... — este
// archivo no ejercita login, solo necesita que requerir admin.js no truene.
jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const Usuario = require('../../models/Usuario');
const PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);
const CURADOR_JPL = {
  _id: 'u1', nombre: 'Curador JPL', usuario: 'curador', passwordHash: PASSWORD_HASH,
  roles: ['Curador.Biodiversidad'], activo: true,
};

const app = require('../../routes/admin');
const testApp = makeApp(app);

async function agenteLogueado() {
  Usuario.findOne.mockReturnValue(mockQuery(CURADOR_JPL));
  Usuario.findById.mockReturnValue(mockQuery(CURADOR_JPL));
  const agente = request.agent(testApp);
  await agente.post('/login').send({ usuario: 'curador', password: 'clave-prueba' });
  return agente;
}

beforeEach(() => jest.clearAllMocks());

describe('Rutas JPL — requieren sesión de admin', () => {
  test('GET /jpl/meses sin sesión responde 401', async () => {
    const res = await request(testApp).get('/jpl/meses');
    expect(res.status).toBe(401);
  });
});

describe('GET /jpl/meses', () => {
  test('devuelve los meses ordenados de más reciente a más antiguo', async () => {
    JplPhoto.distinct.mockResolvedValue(['2026-05', '2026-06', '2026-04']);
    const agente = await agenteLogueado();

    const res = await agente.get('/jpl/meses');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['2026-06', '2026-05', '2026-04']);
  });
});

describe('GET /jpl/fotos/:mes', () => {
  test('devuelve las fotos del mes solicitado', async () => {
    const fotos = [{ _id: 'a1', mes: '2026-06', especieEs: 'Colibrí de cola rufa' }];
    JplPhoto.find.mockReturnValue(mockQuery(fotos));
    const agente = await agenteLogueado();

    const res = await agente.get('/jpl/fotos/2026-06');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fotos);
  });
});

describe('POST /jpl/fotos/:mes', () => {
  test('rechaza con 400 si no viene ninguna foto', async () => {
    const agente = await agenteLogueado();

    const res = await agente.post('/jpl/fotos/2026-06').field('grupo', 'aves');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Se requiere al menos una foto' });
  });

  test('crea una foto nueva con los datos enviados', async () => {
    JplPhoto.countDocuments.mockResolvedValue(2);
    const creada = { _id: 'nueva1', mes: '2026-06', orden: 2, especieEs: 'Colibrí de cola rufa' };
    JplPhoto.create.mockResolvedValue(creada);
    const agente = await agenteLogueado();

    const res = await agente
      .post('/jpl/fotos/2026-06')
      .field('especieEs', 'Colibrí de cola rufa')
      .field('especieCientifico', 'Amazilia tzacatl')
      .field('grupo', 'aves')
      .field('subregion', 'valle_aburra')
      .field('iucn', 'LC')
      .field('endemica', 'false')
      .attach('fotosNuevas', Buffer.from('fake-image-data'), 'colibri.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toEqual(creada);
    expect(JplPhoto.create).toHaveBeenCalledWith(expect.objectContaining({
      mes: '2026-06', orden: 2, especieEs: 'Colibrí de cola rufa',
      especieCientifico: 'Amazilia tzacatl', grupo: 'aves', iucn: 'LC', endemica: false,
    }));
  });

  test('rechaza con 400 si falta el nombre común', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .post('/jpl/fotos/2026-06')
      .field('grupo', 'aves')
      .field('subregion', 'valle_aburra')
      .attach('fotosNuevas', Buffer.from('fake-image-data'), 'colibri.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Se requiere el nombre común de la especie' });
    expect(JplPhoto.create).not.toHaveBeenCalled();
  });

  test('rechaza con 400 si el grupo no es válido', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .post('/jpl/fotos/2026-06')
      .field('especieEs', 'Colibrí')
      .field('grupo', 'dinosaurios')
      .field('subregion', 'valle_aburra')
      .attach('fotosNuevas', Buffer.from('fake-image-data'), 'colibri.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Grupo taxonómico no reconocido' });
    expect(JplPhoto.create).not.toHaveBeenCalled();
  });

  test('rechaza con 400 si la subregión no es válida', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .post('/jpl/fotos/2026-06')
      .field('especieEs', 'Colibrí')
      .field('grupo', 'aves')
      .field('subregion', 'narnia')
      .attach('fotosNuevas', Buffer.from('fake-image-data'), 'colibri.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Subregión no reconocida' });
    expect(JplPhoto.create).not.toHaveBeenCalled();
  });

  test('rechaza con 400 si el código IUCN no es válido', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .post('/jpl/fotos/2026-06')
      .field('especieEs', 'Colibrí')
      .field('grupo', 'aves')
      .field('subregion', 'valle_aburra')
      .field('iucn', 'ZZ')
      .attach('fotosNuevas', Buffer.from('fake-image-data'), 'colibri.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Código IUCN no reconocido' });
    expect(JplPhoto.create).not.toHaveBeenCalled();
  });
});

describe('PUT /jpl/fotos/:mes/:id', () => {
  test('responde 404 si la foto no existe', async () => {
    JplPhoto.findById.mockResolvedValue(null);
    JplPhoto.findByIdAndUpdate.mockResolvedValue(null);
    const agente = await agenteLogueado();

    const res = await agente
      .put('/jpl/fotos/2026-06/000000000000000000000000')
      .field('especieEs', 'Colibrí')
      .field('grupo', 'aves')
      .field('subregion', 'valle_aburra')
      .field('fotosExistentes', JSON.stringify(['img/fotos/bio/2026-06/aves/x/x_001.webp']));

    expect(res.status).toBe(404);
  });

  test('actualiza metadatos conservando las fotos existentes', async () => {
    JplPhoto.findById.mockResolvedValue({ fotos: ['img/fotos/bio/2026-06/aves/x/x_001.webp'] });
    const actualizada = { _id: 'id1', especieEs: 'Colibrí corregido' };
    JplPhoto.findByIdAndUpdate.mockResolvedValue(actualizada);
    const agente = await agenteLogueado();

    const res = await agente
      .put('/jpl/fotos/2026-06/id1')
      .field('especieEs', 'Colibrí corregido')
      .field('grupo', 'aves')
      .field('subregion', 'valle_aburra')
      .field('fotosExistentes', JSON.stringify(['img/fotos/bio/2026-06/aves/x/x_001.webp']));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(actualizada);
  });

  test('rechaza con 400 si no queda ninguna foto (ni existentes ni nuevas)', async () => {
    JplPhoto.findById.mockResolvedValue({ fotos: [] });
    const agente = await agenteLogueado();

    const res = await agente
      .put('/jpl/fotos/2026-06/id1')
      .field('especieEs', 'Colibrí')
      .field('grupo', 'aves')
      .field('subregion', 'valle_aburra')
      .field('fotosExistentes', JSON.stringify([]));

    expect(res.status).toBe(400);
  });

  test('rechaza con 400 si el grupo no es válido', async () => {
    const agente = await agenteLogueado();

    const res = await agente
      .put('/jpl/fotos/2026-06/id1')
      .field('especieEs', 'Colibrí')
      .field('grupo', 'dinosaurios')
      .field('subregion', 'valle_aburra')
      .field('fotosExistentes', JSON.stringify(['a.webp']));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Grupo taxonómico no reconocido' });
    expect(JplPhoto.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('DELETE /jpl/fotos/:id', () => {
  test('responde 404 si la foto no existe', async () => {
    JplPhoto.findByIdAndDelete.mockResolvedValue(null);
    const agente = await agenteLogueado();

    const res = await agente.delete('/jpl/fotos/000000000000000000000000');

    expect(res.status).toBe(404);
  });

  test('elimina la foto y responde ok', async () => {
    JplPhoto.findByIdAndDelete.mockResolvedValue({ fotos: ['img/fotos/bio/2026-06/aves/x/x_001.webp'] });
    const agente = await agenteLogueado();

    const res = await agente.delete('/jpl/fotos/id1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
