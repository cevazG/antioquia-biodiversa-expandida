'use strict';
const { crearEliminarFoto } = require('../../../../../modules/jpl/application/casos_uso/eliminarFoto');
const { ErrorNoEncontrado } = require('../../../../../modules/jpl/domain/errores');

describe('eliminarFoto (caso de uso)', () => {
  test('lanza ErrorNoEncontrado si el repositorio no encuentra la foto', async () => {
    const repositorio = { eliminarPorId: jest.fn().mockResolvedValue(null) };
    const eliminarFoto = crearEliminarFoto({
      repositorio, almacenamiento: { eliminar: jest.fn() }, cache: { invalidar: jest.fn() },
    });

    await expect(eliminarFoto('id-inexistente')).rejects.toThrow(ErrorNoEncontrado);
  });

  test('borra del almacenamiento todas las fotos del registro eliminado', async () => {
    const repositorio = { eliminarPorId: jest.fn().mockResolvedValue({ fotos: ['a.webp', 'b.webp'] }) };
    const almacenamiento = { eliminar: jest.fn() };
    const cache = { invalidar: jest.fn().mockResolvedValue(undefined) };
    const eliminarFoto = crearEliminarFoto({ repositorio, almacenamiento, cache });

    const resultado = await eliminarFoto('id1');

    expect(almacenamiento.eliminar).toHaveBeenCalledWith('a.webp');
    expect(almacenamiento.eliminar).toHaveBeenCalledWith('b.webp');
    expect(cache.invalidar).toHaveBeenCalledWith('jpl:fotos:*', 'jpl:stats:analytics', 'jpl:stats:monthly');
    expect(resultado).toEqual({ ok: true });
  });
});
