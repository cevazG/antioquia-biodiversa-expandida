'use strict';
const { crearEliminarFoto } = require('../../../../../modules/gc/application/casos_uso/eliminarFoto');
const { ErrorNoEncontrado } = require('../../../../../modules/gc/domain/errores');

describe('eliminarFoto GC (caso de uso)', () => {
  test('lanza ErrorNoEncontrado si el repositorio no encuentra la foto', async () => {
    const repositorio = { eliminarPorId: jest.fn().mockResolvedValue(null) };
    const eliminarFoto = crearEliminarFoto({
      repositorio, almacenamiento: { eliminar: jest.fn() }, cache: { invalidar: jest.fn() },
    });

    await expect(eliminarFoto('id-inexistente')).rejects.toThrow(ErrorNoEncontrado);
  });

  test('borra del almacenamiento la foto del registro eliminado', async () => {
    const repositorio = { eliminarPorId: jest.fn().mockResolvedValue({ foto: 'img/fotos/gc_2026-06/gc_001.webp' }) };
    const almacenamiento = { eliminar: jest.fn() };
    const cache = { invalidar: jest.fn().mockResolvedValue(undefined) };
    const eliminarFoto = crearEliminarFoto({ repositorio, almacenamiento, cache });

    const resultado = await eliminarFoto('g1');

    expect(almacenamiento.eliminar).toHaveBeenCalledWith('img/fotos/gc_2026-06/gc_001.webp');
    expect(cache.invalidar).toHaveBeenCalledWith('gc:fotos:*');
    expect(resultado).toEqual({ ok: true });
  });
});
