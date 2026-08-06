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

// Mocks de modelos para que el router no intente conectar a BD (requeridos
// transitivamente vía routes/admin.js -> modules/jpl|gc/... )
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

jest.mock('../../modules/auth/infrastructure/verificarRecaptcha');
const verificarRecaptcha = require('../../modules/auth/infrastructure/verificarRecaptcha');

const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const PASSWORD_HASH = bcrypt.hashSync('clave-prueba', 10);
const MFA_SECRET_PRUEBA = 'JBSWY3DPEHPK3PXP';

jest.mock('../../models/Usuario', () => ({
  findOne: jest.fn(), findById: jest.fn(), find: jest.fn(),
  create: jest.fn(), findByIdAndUpdate: jest.fn(),
}));
const Usuario = require('../../models/Usuario');

const USUARIO_ACTIVO = {
  _id: 'u1', nombre: 'María González', usuario: 'mgonzalez',
  passwordHash: PASSWORD_HASH, roles: ['Admin.Contenido'], activo: true,
  mfaSecret: MFA_SECRET_PRUEBA,
};

const app = makeApp(require('../../routes/admin'));

// Configura los mocks para un login exitoso Y para que requireAuth siga
// resolviendo a ese mismo usuario en peticiones posteriores del agente.
async function agenteLogueado() {
  Usuario.findOne.mockReturnValue(mockQuery(USUARIO_ACTIVO));
  Usuario.findById.mockReturnValue(mockQuery(USUARIO_ACTIVO));
  const agente = request.agent(app);
  await agente.post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba' });
  await agente.post('/login/mfa').send({ codigo: authenticator.generate(MFA_SECRET_PRUEBA) });
  return agente;
}

beforeEach(() => {
  jest.clearAllMocks();
  verificarRecaptcha.mockResolvedValue(true);
});

describe('POST /login', () => {
  test('rechaza con 401 si la verificación reCAPTCHA falla, sin llegar a validar credenciales', async () => {
    verificarRecaptcha.mockResolvedValue(false);
    Usuario.findOne.mockReturnValue(mockQuery(USUARIO_ACTIVO));

    const res = await request(app).post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba', recaptchaToken: 'token-invalido' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Verificación de seguridad fallida. Vuelve a intentarlo.' });
    expect(Usuario.findOne).not.toHaveBeenCalled();
  });

  test('con credenciales correctas y MFA ya configurado, pide el código en vez de abrir sesión de una vez', async () => {
    Usuario.findOne.mockReturnValue(mockQuery(USUARIO_ACTIVO));

    const res = await request(app).post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ requiereMfaCodigo: true });
  });

  test('con credenciales correctas y sin MFA configurado todavía, genera un secreto y devuelve el QR para enrolar', async () => {
    const sinMfa = { ...USUARIO_ACTIVO, mfaSecret: null };
    Usuario.findOne.mockReturnValue(mockQuery(sinMfa));

    const res = await request(app).post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba' });

    expect(res.status).toBe(200);
    expect(res.body.requiereMfaSetup).toBe(true);
    expect(res.body.qr).toMatch(/^data:image\/png;base64,/);
    expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith('u1', { mfaSecret: expect.any(String) });
  });

  test('rechaza con 401 si el usuario no existe', async () => {
    Usuario.findOne.mockReturnValue(mockQuery(null));

    const res = await request(app).post('/login').send({ usuario: 'noexiste', password: 'x' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Usuario o contraseña incorrectos' });
  });

  test('rechaza con 401 si la contraseña es incorrecta', async () => {
    Usuario.findOne.mockReturnValue(mockQuery(USUARIO_ACTIVO));

    const res = await request(app).post('/login').send({ usuario: 'mgonzalez', password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Usuario o contraseña incorrectos' });
  });

  test('rechaza con 401 si el usuario está inactivo — mismo mensaje genérico', async () => {
    Usuario.findOne.mockReturnValue(mockQuery({ ...USUARIO_ACTIVO, activo: false }));

    const res = await request(app).post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Usuario o contraseña incorrectos' });
  });
});

describe('POST /login/mfa', () => {
  test('rechaza con 401 si no hay un login pendiente de MFA (nunca se llamó a /login)', async () => {
    const res = await request(app).post('/login/mfa').send({ codigo: '123456' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Sesión de login expirada, vuelve a intentarlo.' });
  });

  test('con código correcto, completa el login (sesión queda activa para /me)', async () => {
    Usuario.findOne.mockReturnValue(mockQuery(USUARIO_ACTIVO));
    Usuario.findById.mockReturnValue(mockQuery(USUARIO_ACTIVO));
    const agente = request.agent(app);
    await agente.post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba' });

    const res = await agente.post('/login/mfa').send({ codigo: authenticator.generate(MFA_SECRET_PRUEBA) });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const resMe = await agente.get('/me');
    expect(resMe.body).toEqual({ isAdmin: true, nombre: 'María González', roles: ['Admin.Contenido'] });
  });

  test('rechaza con 401 si el código TOTP es incorrecto, sin abrir sesión', async () => {
    Usuario.findOne.mockReturnValue(mockQuery(USUARIO_ACTIVO));
    Usuario.findById.mockReturnValue(mockQuery(USUARIO_ACTIVO));
    const agente = request.agent(app);
    await agente.post('/login').send({ usuario: 'mgonzalez', password: 'clave-prueba' });

    const res = await agente.post('/login/mfa').send({ codigo: '000000' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Código incorrecto' });

    const resMe = await agente.get('/me');
    expect(resMe.body).toEqual({ isAdmin: false });
  });
});

describe('GET /me', () => {
  test('devuelve isAdmin:false cuando no hay sesión activa (nunca 401)', async () => {
    const res = await request(app).get('/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: false });
  });

  test('devuelve isAdmin:true con nombre y roles después de un login exitoso', async () => {
    const agente = await agenteLogueado();

    const res = await agente.get('/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: true, nombre: 'María González', roles: ['Admin.Contenido'] });
  });

  test('devuelve isAdmin:false si el usuario fue desactivado después del login', async () => {
    const agente = await agenteLogueado();
    Usuario.findById.mockReturnValue(mockQuery({ ...USUARIO_ACTIVO, activo: false }));

    const res = await agente.get('/me');

    expect(res.body).toEqual({ isAdmin: false });
  });
});

describe('POST /logout', () => {
  test('cierra la sesión activa', async () => {
    const agente = await agenteLogueado();

    const resLogout = await agente.post('/logout');
    expect(resLogout.status).toBe(200);
    expect(resLogout.body).toEqual({ ok: true });

    const resMe = await agente.get('/me');
    expect(resMe.body).toEqual({ isAdmin: false });
  });
});
