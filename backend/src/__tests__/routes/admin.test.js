'use strict';
const request = require('supertest');
const { makeApp } = require('../helpers/app');

// Mocks de modelos para que el router no intente conectar a BD
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

// Contraseña fija para pruebas
process.env.ADMIN_PASSWORD = 'clave-prueba';

const app = makeApp(require('../../routes/admin'));

describe('POST /login', () => {
  test('inicia sesion con contrasena correcta', async () => {
    const res = await request(app).post('/login').send({ password: 'clave-prueba' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('rechaza contrasena incorrecta con 401', async () => {
    const res = await request(app).post('/login').send({ password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Contraseña incorrecta' });
  });
});

describe('GET /me', () => {
  test('devuelve isAdmin:false cuando no hay sesion activa', async () => {
    const res = await request(app).get('/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: false });
  });

  test('devuelve isAdmin:true despues de un login exitoso', async () => {
    const agente = request.agent(app);
    await agente.post('/login').send({ password: 'clave-prueba' });

    const res = await agente.get('/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: true });
  });
});

describe('POST /logout', () => {
  test('cierra la sesion activa', async () => {
    const agente = request.agent(app);
    await agente.post('/login').send({ password: 'clave-prueba' });

    const resLogout = await agente.post('/logout');
    expect(resLogout.status).toBe(200);
    expect(resLogout.body).toEqual({ ok: true });

    const resMe = await agente.get('/me');
    expect(resMe.body).toEqual({ isAdmin: false });
  });
});
