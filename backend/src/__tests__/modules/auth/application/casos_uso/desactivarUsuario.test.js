'use strict';
const { crearDesactivarUsuario } = require('../../../../../modules/auth/application/casos_uso/desactivarUsuario');
const { ErrorNoEncontrado } = require('../../../../../modules/auth/domain/errores');

describe('desactivarUsuario (caso de uso)', () => {
  test('lanza ErrorNoEncontrado si el repositorio no encuentra el usuario', async () => {
    const repositorio = { actualizar: jest.fn().mockResolvedValue(null) };
    const desactivarUsuario = crearDesactivarUsuario({ repositorio });

    await expect(desactivarUsuario('no-existe')).rejects.toThrow(ErrorNoEncontrado);
  });

  test('actualiza activo:false y devuelve el usuario desactivado', async () => {
    const desactivado = { _id: 'u1', nombre: 'Ana', activo: false };
    const repositorio = { actualizar: jest.fn().mockResolvedValue(desactivado) };
    const desactivarUsuario = crearDesactivarUsuario({ repositorio });

    const resultado = await desactivarUsuario('u1');

    expect(repositorio.actualizar).toHaveBeenCalledWith('u1', { activo: false });
    expect(resultado).toEqual(desactivado);
  });
});
