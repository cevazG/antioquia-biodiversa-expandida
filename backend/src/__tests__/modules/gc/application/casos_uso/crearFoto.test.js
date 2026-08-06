'use strict';
const { crearCrearFoto } = require('../../../../../modules/gc/application/casos_uso/crearFoto');
const { ErrorValidacion } = require('../../../../../modules/gc/domain/errores');

function fakeRepositorio(overrides = {}) {
  return {
    contarPorMes: jest.fn().mockResolvedValue(0),
    crear: jest.fn().mockImplementation(datos => Promise.resolve({ _id: 'gcnueva1', ...datos })),
    ...overrides,
  };
}
function fakeAlmacenamiento(overrides = {}) {
  return { guardar: jest.fn().mockResolvedValue('img/fotos/gc_2026-06/gc_001.webp'), ...overrides };
}
function fakeCache() {
  return { invalidar: jest.fn().mockResolvedValue(undefined) };
}

describe('crearFoto GC (caso de uso)', () => {
  test('rechaza si no viene archivo, antes de validar los demás campos', async () => {
    const repositorio = fakeRepositorio();
    const crearFoto = crearCrearFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await expect(crearFoto({ mes: '2026-06', archivo: null }))
      .rejects.toThrow('No se recibió ninguna foto');
    expect(repositorio.crear).not.toHaveBeenCalled();
  });

  test('valida los datos antes de guardar el archivo', async () => {
    const almacenamiento = fakeAlmacenamiento();
    const crearFoto = crearCrearFoto({ repositorio: fakeRepositorio(), almacenamiento, cache: fakeCache() });

    await expect(crearFoto({
      mes: '2026-06', archivo: { buffer: Buffer.from('x') },
      cuenca: '', tituloEs: 'X', subregion: 'valle_aburra',
    })).rejects.toThrow(ErrorValidacion);
    expect(almacenamiento.guardar).not.toHaveBeenCalled();
  });

  test('guarda el archivo, asigna orden y crea el registro', async () => {
    const repositorio = fakeRepositorio({ contarPorMes: jest.fn().mockResolvedValue(1) });
    const almacenamiento = fakeAlmacenamiento();
    const cache = fakeCache();
    const crearFoto = crearCrearFoto({ repositorio, almacenamiento, cache });

    const creada = await crearFoto({
      mes: '2026-06', archivo: { buffer: Buffer.from('x') },
      cuenca: 'Río Medellín', tituloEs: 'Nacimiento', subregion: 'valle_aburra',
    });

    expect(almacenamiento.guardar).toHaveBeenCalledWith(expect.any(Buffer), '2026-06');
    expect(repositorio.crear).toHaveBeenCalledWith(expect.objectContaining({
      mes: '2026-06', orden: 1, foto: 'img/fotos/gc_2026-06/gc_001.webp', cuenca: 'Río Medellín',
    }));
    expect(cache.invalidar).toHaveBeenCalledWith('gc:fotos:2026-06');
    expect(creada._id).toBe('gcnueva1');
  });
});
