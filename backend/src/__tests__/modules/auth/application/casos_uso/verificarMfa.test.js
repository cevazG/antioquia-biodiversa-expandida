'use strict';
const { authenticator } = require('otplib');
const { crearVerificarMfa } = require('../../../../../modules/auth/application/casos_uso/verificarMfa');
const { ErrorCodigoMfaInvalido, ErrorUsuarioInactivo } = require('../../../../../modules/auth/domain/errores');

const SECRETO = 'JBSWY3DPEHPK3PXP';
const USUARIO_ACTIVO = { _id: 'u1', usuario: 'test', activo: true, mfaSecret: SECRETO };

describe('verificarMfa (caso de uso)', () => {
  test('devuelve el id del usuario si el código TOTP es correcto', async () => {
    const repositorio = { buscarPorIdConMfaSecret: jest.fn().mockResolvedValue(USUARIO_ACTIVO) };
    const verificarMfa = crearVerificarMfa({ repositorio });

    const resultado = await verificarMfa({ usuarioId: 'u1', codigo: authenticator.generate(SECRETO) });

    expect(resultado).toEqual({ id: 'u1' });
  });

  test('lanza ErrorCodigoMfaInvalido si el código es incorrecto', async () => {
    const repositorio = { buscarPorIdConMfaSecret: jest.fn().mockResolvedValue(USUARIO_ACTIVO) };
    const verificarMfa = crearVerificarMfa({ repositorio });

    await expect(verificarMfa({ usuarioId: 'u1', codigo: '000000' })).rejects.toThrow(ErrorCodigoMfaInvalido);
  });

  test('lanza ErrorCodigoMfaInvalido (mensaje genérico) si el usuario no existe', async () => {
    const repositorio = { buscarPorIdConMfaSecret: jest.fn().mockResolvedValue(null) };
    const verificarMfa = crearVerificarMfa({ repositorio });

    await expect(verificarMfa({ usuarioId: 'no-existe', codigo: '123456' })).rejects.toThrow(ErrorCodigoMfaInvalido);
  });

  test('lanza ErrorUsuarioInactivo si el usuario fue desactivado entre el paso 1 y el paso 2 del login', async () => {
    const repositorio = { buscarPorIdConMfaSecret: jest.fn().mockResolvedValue({ ...USUARIO_ACTIVO, activo: false }) };
    const verificarMfa = crearVerificarMfa({ repositorio });

    await expect(verificarMfa({ usuarioId: 'u1', codigo: authenticator.generate(SECRETO) })).rejects.toThrow(ErrorUsuarioInactivo);
  });
});
