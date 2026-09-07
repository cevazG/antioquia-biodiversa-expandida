'use strict';
const { crearActualizarFoto } = require('../../../../../modules/gc/application/casos_uso/actualizarFoto');
const { ErrorNoEncontrado } = require('../../../../../modules/gc/domain/errores');

const datosValidos = { cuenca: 'Río Medellín', tituloEs: 'Título corregido', subregion: 'valle_aburra' };

function fakeRepositorio(overrides = {}) {
  return {
    buscarPorId: jest.fn().mockResolvedValue(null),
    actualizar: jest.fn().mockImplementation((id, datos) => Promise.resolve({ _id: id, ...datos })),
    ...overrides,
  };
}
function fakeAlmacenamiento(overrides = {}) {
  return { guardar: jest.fn().mockResolvedValue('img/fotos/gc_2026-06/gc_002.webp'), eliminar: jest.fn(), ...overrides };
}
function fakeCache() {
  return { invalidar: jest.fn().mockResolvedValue(undefined) };
}

describe('actualizarFoto GC (caso de uso)', () => {
  test('no toca el almacenamiento si no viene archivo nuevo', async () => {
    const repositorio = fakeRepositorio();
    const almacenamiento = fakeAlmacenamiento();
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento, cache: fakeCache() });

    await actualizarFoto({ id: 'g1', mes: '2026-06', archivo: null, ...datosValidos });

    expect(almacenamiento.guardar).not.toHaveBeenCalled();
    expect(almacenamiento.eliminar).not.toHaveBeenCalled();
    expect(repositorio.buscarPorId).not.toHaveBeenCalled();
  });

  test('si viene archivo nuevo, borra el anterior y guarda el nuevo', async () => {
    const repositorio = fakeRepositorio({ buscarPorId: jest.fn().mockResolvedValue({ foto: 'vieja.webp' }) });
    const almacenamiento = fakeAlmacenamiento();
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento, cache: fakeCache() });

    await actualizarFoto({ id: 'g1', mes: '2026-06', archivo: { buffer: Buffer.from('x') }, ...datosValidos });

    expect(almacenamiento.eliminar).toHaveBeenCalledWith('vieja.webp');
    expect(almacenamiento.guardar).toHaveBeenCalledWith(expect.any(Buffer), '2026-06');
    expect(repositorio.actualizar).toHaveBeenCalledWith('g1', expect.objectContaining({ foto: 'img/fotos/gc_2026-06/gc_002.webp' }));
  });

  test('siempre resetea publicado a false al editar', async () => {
    const repositorio = fakeRepositorio();
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await actualizarFoto({ id: 'g1', mes: '2026-06', archivo: null, ...datosValidos });

    expect(repositorio.actualizar).toHaveBeenCalledWith('g1', expect.objectContaining({ publicado: false }));
  });

  test('lanza ErrorNoEncontrado si el repositorio no encuentra el id al actualizar', async () => {
    const repositorio = fakeRepositorio({ actualizar: jest.fn().mockResolvedValue(null) });
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await expect(actualizarFoto({ id: 'id-inexistente', mes: '2026-06', archivo: null, ...datosValidos }))
      .rejects.toThrow(ErrorNoEncontrado);
  });
});
