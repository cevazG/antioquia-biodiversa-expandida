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
const { authenticator } = require('otplib');
const PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);
const MFA_SECRET_PRUEBA = 'JBSWY3DPEHPK3PXP';

jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
}));
const Usuario = require('../../models/Usuario');

const app = makeApp(require('../../routes/admin'));

const ADMIN = {
  _id: 'admin1', nombre: 'Admin Test', usuario: 'admin', passwordHash: PASSWORD_HASH,
  roles: ['Admin.Contenido'], activo: true, mfaSecret: MFA_SECRET_PRUEBA,
};

async function agenteAdmin() {
  Usuario.findOne.mockReturnValue(mockQuery(ADMIN));
  Usuario.findById.mockReturnValue(mockQuery(ADMIN));
  const agente = request.agent(app);
  await agente.post('/login').send({ usuario: 'admin', password: 'clave-prueba' });
  await agente.post('/login/mfa').send({ codigo: authenticator.generate(MFA_SECRET_PRUEBA) });
  return agente;
}

beforeEach(() => jest.clearAllMocks());

describe('GET /usuarios', () => {
  test('devuelve la lista de usuarios', async () => {
    const lista = [{ _id: 'u1', nombre: 'X', usuario: 'x', roles: ['Curador.Biodiversidad'], activo: true }];
    const agente = await agenteAdmin();
    Usuario.find.mockReturnValue(mockQuery(lista));

    const res = await agente.get('/usuarios');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(lista);
  });
});

describe('POST /usuarios', () => {
  test('crea un usuario nuevo y nunca expone passwordHash', async () => {
    const agente = await agenteAdmin();
    // agenteAdmin() dejó Usuario.findOne devolviendo ADMIN (para el login);
    // hay que sobreescribirlo para que existeUsuario() vea que no hay
    // conflicto de nombre de usuario.
    Usuario.findOne.mockReturnValue(mockQuery(null));
    Usuario.create.mockResolvedValue({
      _id: 'nuevo1', nombre: 'Ana Ruiz', usuario: 'aruiz', passwordHash: 'secreto-no-deberia-salir',
      roles: ['Curador.GuardaCuencas'], activo: true,
    });

    const res = await agente.post('/usuarios').send({
      nombre: 'Ana Ruiz', usuario: 'aruiz', password: 'clave12345', roles: ['Curador.GuardaCuencas'],
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ _id: 'nuevo1', nombre: 'Ana Ruiz', usuario: 'aruiz', roles: ['Curador.GuardaCuencas'], activo: true });
    expect(res.body.passwordHash).toBeUndefined();
  });

  test('rechaza con 400 si falta el nombre', async () => {
    const agente = await agenteAdmin();

    const res = await agente.post('/usuarios').send({ usuario: 'aruiz', password: 'clave12345', roles: ['Curador.GuardaCuencas'] });

    expect(res.status).toBe(400);
    expect(Usuario.create).not.toHaveBeenCalled();
  });

  test('rechaza con 400 si la contraseña es muy corta', async () => {
    const agente = await agenteAdmin();

    const res = await agente.post('/usuarios').send({ nombre: 'Ana', usuario: 'aruiz', password: '123', roles: ['Curador.GuardaCuencas'] });

    expect(res.status).toBe(400);
    expect(Usuario.create).not.toHaveBeenCalled();
  });

  test('rechaza con 400 si el usuario ya existe', async () => {
    const agente = await agenteAdmin();
    Usuario.findOne.mockReturnValue(mockQuery({ _id: 'otro', usuario: 'aruiz' }));

    const res = await agente.post('/usuarios').send({ nombre: 'Ana', usuario: 'aruiz', password: 'clave12345', roles: ['Curador.GuardaCuencas'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya existe/i);
    expect(Usuario.create).not.toHaveBeenCalled();
  });
});

describe('PUT /usuarios/:id', () => {
  test('actualiza nombre y roles sin tocar la clave si no viene', async () => {
    const agente = await agenteAdmin();
    Usuario.findOne.mockReturnValue(mockQuery(null)); // sin conflicto de usuario
    const actualizado = { _id: 'u1', nombre: 'Ana R.', usuario: 'aruiz', roles: ['Admin.Contenido'], activo: true };
    Usuario.findByIdAndUpdate.mockReturnValue(mockQuery(actualizado));

    const res = await agente.put('/usuarios/u1').send({ nombre: 'Ana R.', usuario: 'aruiz', roles: ['Admin.Contenido'] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(actualizado);
    const [, datosUpdate] = Usuario.findByIdAndUpdate.mock.calls[0];
    expect(datosUpdate.passwordHash).toBeUndefined();
  });

  test('responde 404 si el usuario no existe', async () => {
    const agente = await agenteAdmin();
    Usuario.findOne.mockReturnValue(mockQuery(null));
    Usuario.findByIdAndUpdate.mockReturnValue(mockQuery(null));

    const res = await agente.put('/usuarios/no-existe').send({ nombre: 'X', usuario: 'x', roles: ['Admin.Contenido'] });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /usuarios/:id', () => {
  test('desactiva (no borra) al usuario', async () => {
    const agente = await agenteAdmin();
    const desactivado = { _id: 'u1', nombre: 'Ana', usuario: 'aruiz', roles: ['Curador.GuardaCuencas'], activo: false };
    Usuario.findByIdAndUpdate.mockReturnValue(mockQuery(desactivado));

    const res = await agente.delete('/usuarios/u1');

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(false);
    expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith('u1', { activo: false }, { new: true });
  });

  test('responde 404 si el usuario no existe', async () => {
    const agente = await agenteAdmin();
    Usuario.findByIdAndUpdate.mockReturnValue(mockQuery(null));

    const res = await agente.delete('/usuarios/no-existe');

    expect(res.status).toBe(404);
  });
});

describe('POST /usuarios/:id/reset-mfa', () => {
  test('deja mfaSecret en null — el usuario deberá enrolar un dispositivo nuevo en su próximo login', async () => {
    const agente = await agenteAdmin();
    const reseteado = { _id: 'u1', nombre: 'Ana', usuario: 'aruiz', roles: ['Curador.GuardaCuencas'], activo: true };
    Usuario.findByIdAndUpdate.mockReturnValue(mockQuery(reseteado));

    const res = await agente.post('/usuarios/u1/reset-mfa');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(reseteado);
    expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith('u1', { mfaSecret: null }, { new: true });
  });

  test('responde 404 si el usuario no existe', async () => {
    const agente = await agenteAdmin();
    Usuario.findByIdAndUpdate.mockReturnValue(mockQuery(null));

    const res = await agente.post('/usuarios/no-existe/reset-mfa');

    expect(res.status).toBe(404);
  });
});
