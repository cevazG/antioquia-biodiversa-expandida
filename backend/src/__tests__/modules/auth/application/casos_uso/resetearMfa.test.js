'use strict';
const { crearResetearMfa } = require('../../../../../modules/auth/application/casos_uso/resetearMfa');
const { ErrorNoEncontrado } = require('../../../../../modules/auth/domain/errores');

describe('resetearMfa (caso de uso)', () => {
  test('lanza ErrorNoEncontrado si el repositorio no encuentra el usuario', async () => {
    const repositorio = { resetearMfa: jest.fn().mockResolvedValue(null) };
    const resetearMfa = crearResetearMfa({ repositorio });

    await expect(resetearMfa('no-existe')).rejects.toThrow(ErrorNoEncontrado);
  });

  test('deja mfaSecret en null y devuelve el usuario actualizado', async () => {
    const actualizado = { _id: 'u1', nombre: 'Ana', mfaSecret: null };
    const repositorio = { resetearMfa: jest.fn().mockResolvedValue(actualizado) };
    const resetearMfa = crearResetearMfa({ repositorio });

    const resultado = await resetearMfa('u1');

    expect(repositorio.resetearMfa).toHaveBeenCalledWith('u1');
    expect(resultado).toEqual(actualizado);
  });
});
