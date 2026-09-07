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

const JplPhoto = require('../../models/JplPhoto');
jest.mock('../../models/JplPhoto', () => ({
  distinct: jest.fn(), find: jest.fn(), aggregate: jest.fn(), countDocuments: jest.fn(),
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
const CURADOR_JPL = {
  _id: 'u1', nombre: 'Curador JPL', usuario: 'curador', passwordHash: PASSWORD_HASH,
  roles: ['Curador.Biodiversidad'], activo: true, mfaSecret: MFA_SECRET_PRUEBA,
};

const testApp = makeApp(require('../../routes/admin'));

async function agenteLogueado() {
  Usuario.findOne.mockReturnValue(mockQuery(CURADOR_JPL));
  Usuario.findById.mockReturnValue(mockQuery(CURADOR_JPL));
  const agente = request.agent(testApp);
  await agente.post('/login').send({ usuario: 'curador', password: 'clave-prueba' });
  await agente.post('/login/mfa').send({ codigo: authenticator.generate(MFA_SECRET_PRUEBA) });
  return agente;
}

beforeEach(() => jest.clearAllMocks());

describe('GET /jpl/stats/analytics', () => {
  test('rechaza con 401 sin sesión de admin', async () => {
    const res = await request(testApp).get('/jpl/stats/analytics');
    expect(res.status).toBe(401);
  });

  test('agrega fotógrafos por subregión, cobertura municipal, alertas y bioindicadores', async () => {
    const fotos = [
      { credito: 'Juan Pérez', subregion: 'valle_aburra', municipio: 'Medellín', especieCientifico: 'Amazilia tzacatl', especieEs: 'Colibrí', iucn: 'LC', grupo: 'aves', endemica: false, fotos: ['a.webp'], mes: '2026-06' },
      { credito: 'Juan Pérez', subregion: 'valle_aburra', municipio: 'Medellín', especieCientifico: 'Rana venenosa', especieEs: 'Rana', iucn: 'CR', grupo: 'anfibios_reptiles', endemica: true, fotos: ['b.webp'], mes: '2026-06' },
      { credito: 'María Gómez', subregion: 'oriente', municipio: 'Rionegro', especieCientifico: 'Pez X', especieEs: 'Pez', iucn: 'EN', grupo: 'peces', endemica: false, fotos: ['c.webp'], mes: '2026-05' },
      { credito: 'Juan Pérez', subregion: 'oriente', municipio: '', especieCientifico: '', especieEs: 'Mamífero', iucn: 'DD', grupo: 'mamiferos', endemica: false, fotos: [], mes: '2026-05' },
    ];
    JplPhoto.find.mockReturnValue(mockQuery(fotos));
    const agente = await agenteLogueado();

    const res = await agente.get('/jpl/stats/analytics');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalFotografos: 2,
      municipiosCubiertos: 2,
      subregionesCubiertas: 2,
      fotografos: [
        { subregion: 'oriente', count: 2, nombres: ['Juan Pérez', 'María Gómez'] },
        { subregion: 'valle_aburra', count: 1, nombres: ['Juan Pérez'] },
      ],
      municipios: [
        { municipio: 'Medellín', subregion: 'valle_aburra', fotos: 2, especies: 2, amenazadas: 1 },
        { municipio: 'Rionegro', subregion: 'oriente', fotos: 1, especies: 1, amenazadas: 1 },
      ],
      alertas: [
        { sci: 'Rana venenosa', es: 'Rana', iucn: 'CR', municipio: 'Medellín', subregion: 'valle_aburra', credito: 'Juan Pérez', endemica: true, foto: 'b.webp', mes: '2026-06' },
        { sci: 'Pez X', es: 'Pez', iucn: 'EN', municipio: 'Rionegro', subregion: 'oriente', credito: 'María Gómez', endemica: false, foto: 'c.webp', mes: '2026-05' },
      ],
      bioindicadores: [
        { sci: 'Rana venenosa', es: 'Rana', grupo: 'anfibios_reptiles', iucn: 'CR', municipio: 'Medellín', subregion: 'valle_aburra', credito: 'Juan Pérez', endemica: true, foto: 'b.webp', mes: '2026-06' },
        { sci: 'Pez X', es: 'Pez', grupo: 'peces', iucn: 'EN', municipio: 'Rionegro', subregion: 'oriente', credito: 'María Gómez', endemica: false, foto: 'c.webp', mes: '2026-05' },
      ],
    });
  });
});

describe('GET /jpl/stats/monthly', () => {
  test('agrega por mes vía pipeline y agrega la etiqueta legible', async () => {
    JplPhoto.aggregate.mockResolvedValue([
      { mes: '2026-05', fotos: 3, amenazadas: 0, endemicas: 1, especiesUnicas: 3, subregiones: 2 },
      { mes: '2026-06', fotos: 5, amenazadas: 1, endemicas: 2, especiesUnicas: 4, subregiones: 3 },
    ]);
    const agente = await agenteLogueado();

    const res = await agente.get('/jpl/stats/monthly');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { mes: '2026-05', fotos: 3, amenazadas: 0, endemicas: 1, especiesUnicas: 3, subregiones: 2, label: 'May 2026' },
      { mes: '2026-06', fotos: 5, amenazadas: 1, endemicas: 2, especiesUnicas: 4, subregiones: 3, label: 'Jun 2026' },
    ]);
  });
});
