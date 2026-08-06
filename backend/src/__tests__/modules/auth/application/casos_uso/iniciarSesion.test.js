'use strict';
const bcrypt = require('bcryptjs');
const { crearIniciarSesion } = require('../../../../../modules/auth/application/casos_uso/iniciarSesion');
const { ErrorCredencialInvalida, ErrorUsuarioInactivo } = require('../../../../../modules/auth/domain/errores');

const HASH = bcrypt.hashSync('clave-correcta', 10);
const USUARIO_ACTIVO = { _id: 'u1', nombre: 'Test', usuario: 'test', passwordHash: HASH, roles: ['Admin.Contenido'], activo: true };

describe('iniciarSesion (caso de uso)', () => {
  test('lanza ErrorCredencialInvalida si el usuario no existe', async () => {
    const repositorio = { buscarPorUsuario: jest.fn().mockResolvedValue(null) };
    const iniciarSesion = crearIniciarSesion({ repositorio });

    await expect(iniciarSesion({ usuario: 'noexiste', password: 'x' })).rejects.toThrow(ErrorCredencialInvalida);
  });

  test('lanza ErrorUsuarioInactivo si el usuario está desactivado', async () => {
    const repositorio = { buscarPorUsuario: jest.fn().mockResolvedValue({ ...USUARIO_ACTIVO, activo: false }) };
    const iniciarSesion = crearIniciarSesion({ repositorio });

    await expect(iniciarSesion({ usuario: 'test', password: 'clave-correcta' })).rejects.toThrow(ErrorUsuarioInactivo);
  });

  test('lanza ErrorCredencialInvalida si la contraseña es incorrecta', async () => {
    const repositorio = { buscarPorUsuario: jest.fn().mockResolvedValue(USUARIO_ACTIVO) };
    const iniciarSesion = crearIniciarSesion({ repositorio });

    await expect(iniciarSesion({ usuario: 'test', password: 'incorrecta' })).rejects.toThrow(ErrorCredencialInvalida);
  });

  test('devuelve id/nombre/usuario/roles si todo es correcto', async () => {
    const repositorio = { buscarPorUsuario: jest.fn().mockResolvedValue(USUARIO_ACTIVO) };
    const iniciarSesion = crearIniciarSesion({ repositorio });

    const sesion = await iniciarSesion({ usuario: 'test', password: 'clave-correcta' });

    expect(sesion).toEqual({ id: 'u1', nombre: 'Test', usuario: 'test', roles: ['Admin.Contenido'] });
  });

  test('normaliza el usuario a minúsculas y sin espacios antes de buscar', async () => {
    const repositorio = { buscarPorUsuario: jest.fn().mockResolvedValue(USUARIO_ACTIVO) };
    const iniciarSesion = crearIniciarSesion({ repositorio });

    await iniciarSesion({ usuario: '  Test  ', password: 'clave-correcta' });

    expect(repositorio.buscarPorUsuario).toHaveBeenCalledWith('test');
  });
});
