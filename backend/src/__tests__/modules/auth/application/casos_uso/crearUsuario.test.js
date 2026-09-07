'use strict';
const { crearCrearUsuario } = require('../../../../../modules/auth/application/casos_uso/crearUsuario');
const { ErrorValidacion, ErrorUsuarioDuplicado } = require('../../../../../modules/auth/domain/errores');

function fakeRepositorio(overrides = {}) {
  return {
    existeUsuario: jest.fn().mockResolvedValue(false),
    crear: jest.fn().mockImplementation(datos => Promise.resolve({ _id: 'nuevo1', ...datos })),
    ...overrides,
  };
}
function fakeHasher() {
  return { hashear: jest.fn().mockReturnValue('hash-simulado') };
}

const datosValidos = { nombre: 'Ana Ruiz', usuario: 'aruiz', password: 'clave12345', roles: ['Curador.GuardaCuencas'] };

describe('crearUsuario (caso de uso)', () => {
  test('valida los datos antes de chequear duplicados', async () => {
    const repositorio = fakeRepositorio();
    const crearUsuario = crearCrearUsuario({ repositorio, hasher: fakeHasher() });

    await expect(crearUsuario({ ...datosValidos, nombre: '' })).rejects.toThrow(ErrorValidacion);
    expect(repositorio.existeUsuario).not.toHaveBeenCalled();
  });

  test('valida la contraseña', async () => {
    const repositorio = fakeRepositorio();
    const crearUsuario = crearCrearUsuario({ repositorio, hasher: fakeHasher() });

    await expect(crearUsuario({ ...datosValidos, password: '123' })).rejects.toThrow(ErrorValidacion);
  });

  test('lanza ErrorUsuarioDuplicado si el usuario ya existe', async () => {
    const repositorio = fakeRepositorio({ existeUsuario: jest.fn().mockResolvedValue(true) });
    const crearUsuario = crearCrearUsuario({ repositorio, hasher: fakeHasher() });

    await expect(crearUsuario(datosValidos)).rejects.toThrow(ErrorUsuarioDuplicado);
    expect(repositorio.crear).not.toHaveBeenCalled();
  });

  test('hashea la contraseña y crea el usuario', async () => {
    const repositorio = fakeRepositorio();
    const hasher = fakeHasher();
    const crearUsuario = crearCrearUsuario({ repositorio, hasher });

    const creado = await crearUsuario(datosValidos);

    expect(hasher.hashear).toHaveBeenCalledWith('clave12345');
    expect(repositorio.crear).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Ana Ruiz', usuario: 'aruiz', roles: ['Curador.GuardaCuencas'], passwordHash: 'hash-simulado',
    }));
    expect(creado._id).toBe('nuevo1');
  });
});
