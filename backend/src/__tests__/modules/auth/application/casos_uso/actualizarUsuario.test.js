'use strict';
const { crearActualizarUsuario } = require('../../../../../modules/auth/application/casos_uso/actualizarUsuario');
const { ErrorNoEncontrado, ErrorUsuarioDuplicado } = require('../../../../../modules/auth/domain/errores');

function fakeRepositorio(overrides = {}) {
  return {
    buscarPorUsuario: jest.fn().mockResolvedValue(null),
    actualizar: jest.fn().mockImplementation((id, datos) => Promise.resolve({ _id: id, ...datos })),
    ...overrides,
  };
}
function fakeHasher() {
  return { hashear: jest.fn().mockReturnValue('hash-nuevo') };
}

const datosValidos = { nombre: 'Ana R.', usuario: 'aruiz', roles: ['Admin.Contenido'] };

describe('actualizarUsuario (caso de uso)', () => {
  test('no rehashea la contraseña si no viene una nueva', async () => {
    const repositorio = fakeRepositorio();
    const hasher = fakeHasher();
    const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher });

    await actualizarUsuario('u1', datosValidos);

    expect(hasher.hashear).not.toHaveBeenCalled();
    expect(repositorio.actualizar).toHaveBeenCalledWith('u1', expect.not.objectContaining({ passwordHash: expect.anything() }));
  });

  test('rehashea y actualiza passwordHash si viene una contraseña nueva', async () => {
    const repositorio = fakeRepositorio();
    const hasher = fakeHasher();
    const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher });

    await actualizarUsuario('u1', { ...datosValidos, password: 'nuevaClave123' });

    expect(hasher.hashear).toHaveBeenCalledWith('nuevaClave123');
    expect(repositorio.actualizar).toHaveBeenCalledWith('u1', expect.objectContaining({ passwordHash: 'hash-nuevo' }));
  });

  test('lanza ErrorUsuarioDuplicado si el usuario elegido ya lo tiene OTRO registro', async () => {
    const repositorio = fakeRepositorio({ buscarPorUsuario: jest.fn().mockResolvedValue({ _id: 'otro-id', usuario: 'aruiz' }) });
    const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher: fakeHasher() });

    await expect(actualizarUsuario('u1', datosValidos)).rejects.toThrow(ErrorUsuarioDuplicado);
    expect(repositorio.actualizar).not.toHaveBeenCalled();
  });

  test('no lanza duplicado si el usuario coincide con el mismo registro que se edita', async () => {
    const repositorio = fakeRepositorio({ buscarPorUsuario: jest.fn().mockResolvedValue({ _id: 'u1', usuario: 'aruiz' }) });
    const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher: fakeHasher() });

    await expect(actualizarUsuario('u1', datosValidos)).resolves.toBeDefined();
  });

  test('incluye activo en la actualización solo si viene como booleano', async () => {
    const repositorio = fakeRepositorio();
    const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher: fakeHasher() });

    await actualizarUsuario('u1', { ...datosValidos, activo: false });

    expect(repositorio.actualizar).toHaveBeenCalledWith('u1', expect.objectContaining({ activo: false }));
  });

  test('lanza ErrorNoEncontrado si el repositorio no encuentra el id', async () => {
    const repositorio = fakeRepositorio({ actualizar: jest.fn().mockResolvedValue(null) });
    const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher: fakeHasher() });

    await expect(actualizarUsuario('no-existe', datosValidos)).rejects.toThrow(ErrorNoEncontrado);
  });
});
