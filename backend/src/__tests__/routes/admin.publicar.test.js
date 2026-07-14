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

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync:     jest.fn(),
  existsSync:    jest.fn().mockReturnValue(false),
  writeFileSync: jest.fn(),
  readFileSync:  jest.fn(),
}));
const fs = require('fs');

const JplPhoto = require('../../models/JplPhoto');
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

const bcrypt = require('bcryptjs');
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);

const testApp = makeApp(require('../../routes/admin'));

async function agenteLogueado() {
  const agente = request.agent(testApp);
  await agente.post('/login').send({ password: 'clave-prueba' });
  return agente;
}

beforeEach(() => jest.clearAllMocks());

describe('POST /jpl/publicar/:mes', () => {
  test('rechaza con 400 si el mes no tiene fotos', async () => {
    JplPhoto.find.mockReturnValue(mockQuery([]));
    const agente = await agenteLogueado();

    const res = await agente.post('/jpl/publicar/2026-06');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Sin fotos para publicar' });
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('escribe el JSON del mes, crea el índice desde cero y marca las fotos como publicadas', async () => {
    const fotos = [
      { fotos: ['img/fotos/bio/2026-06/aves/x/x_001.webp'], credito: 'Juan', municipio: 'Medellín', subregion: 'valle_aburra', especieEs: 'Colibrí', especieEn: '', especieCientifico: 'Amazilia tzacatl', grupo: 'aves', iucn: 'LC', endemica: false, descripcionEs: '', descripcionEn: '' },
    ];
    JplPhoto.find.mockReturnValue(mockQuery(fotos));
    JplPhoto.updateMany.mockResolvedValue({ modifiedCount: 1 });
    fs.existsSync.mockReturnValue(false); // el índice todavía no existe
    const agente = await agenteLogueado();

    const res = await agente.post('/jpl/publicar/2026-06');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, count: 1 });
    expect(JplPhoto.updateMany).toHaveBeenCalledWith({ mes: '2026-06' }, { publicado: true });

    // Primera escritura: el archivo del mes
    const [rutaMes, contenidoMes] = fs.writeFileSync.mock.calls[0];
    expect(rutaMes).toContain('fotos_2026_06.json');
    const payload = JSON.parse(contenidoMes);
    expect(payload).toMatchObject({ mes: 'Junio', mesEn: 'June', año: 2026 });
    expect(payload.fotos).toHaveLength(1);
    expect(payload.fotos[0]).toMatchObject({ id: 'jpl_2026-06_001', especieCientifico: 'Amazilia tzacatl' });

    // Segunda escritura: el índice, con una sola entrada nueva
    const [rutaIndice, contenidoIndice] = fs.writeFileSync.mock.calls[1];
    expect(rutaIndice).toContain('fotos_biodiversidad.json');
    const index = JSON.parse(contenidoIndice);
    expect(index.meses).toEqual([
      expect.objectContaining({ id: '2026-06', count: 1, portada: 'img/fotos/bio/2026-06/aves/x/x_001.webp' }),
    ]);
  });

  test('reemplaza la entrada existente del mismo mes en vez de duplicarla', async () => {
    const fotos = [{ fotos: ['a.webp'], especieCientifico: 'X', grupo: 'aves', especieEs: 'X', especieEn: '', credito: '', municipio: '', subregion: 'oriente', iucn: 'DD', endemica: false, descripcionEs: '', descripcionEn: '' }];
    JplPhoto.find.mockReturnValue(mockQuery(fotos));
    JplPhoto.updateMany.mockResolvedValue({});
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({
      meses: [
        { id: '2026-06', mes: 'Junio', count: 3, portada: 'vieja.webp', archivo: 'data/fotos_2026_06.json' },
        { id: '2026-05', mes: 'Mayo', count: 2, portada: 'otra.webp', archivo: 'data/fotos_2026_05.json' },
      ],
    }));
    const agente = await agenteLogueado();

    await agente.post('/jpl/publicar/2026-06');

    const [, contenidoIndice] = fs.writeFileSync.mock.calls[1];
    const index = JSON.parse(contenidoIndice);
    expect(index.meses).toHaveLength(2); // no se duplicó
    const junio = index.meses.find(m => m.id === '2026-06');
    expect(junio.count).toBe(1); // se actualizó con el conteo nuevo, no el viejo (3)
    expect(junio.portada).toBe('a.webp');
  });
});

describe('POST /gc/publicar/:mes', () => {
  test('rechaza con 400 si el mes no tiene fotos', async () => {
    GcPhoto.find.mockReturnValue(mockQuery([]));
    const agente = await agenteLogueado();

    const res = await agente.post('/gc/publicar/2026-06');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Sin fotos para publicar' });
  });

  test('escribe el JSON del mes y marca las fotos como publicadas', async () => {
    const fotos = [
      { foto: 'img/fotos/gc_2026-06/gc_001.webp', credito: 'Ana', municipio: 'Rionegro', subregion: 'oriente', cuenca: 'Río Negro', tituloEs: 'Nacimiento', tituloEn: '', descripcionEs: '', descripcionEn: '' },
    ];
    GcPhoto.find.mockReturnValue(mockQuery(fotos));
    GcPhoto.updateMany.mockResolvedValue({});
    fs.existsSync.mockReturnValue(false);
    const agente = await agenteLogueado();

    const res = await agente.post('/gc/publicar/2026-06');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, count: 1 });
    expect(GcPhoto.updateMany).toHaveBeenCalledWith({ mes: '2026-06' }, { publicado: true });

    const [rutaMes, contenidoMes] = fs.writeFileSync.mock.calls[0];
    expect(rutaMes).toContain('cuencas_2026_06.json');
    const payload = JSON.parse(contenidoMes);
    expect(payload.fotos[0]).toMatchObject({ id: 'gc_2026-06_001', cuenca: 'Río Negro' });
  });
});
