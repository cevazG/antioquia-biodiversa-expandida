'use strict';
const { crearActualizarFoto } = require('../../../../../modules/jpl/application/casos_uso/actualizarFoto');
const { ErrorValidacion, ErrorNoEncontrado } = require('../../../../../modules/jpl/domain/errores');

function fakeRepositorio(overrides = {}) {
  return {
    buscarPorId: jest.fn().mockResolvedValue(null),
    actualizar: jest.fn().mockImplementation((id, datos) => Promise.resolve({ _id: id, ...datos })),
    ...overrides,
  };
}
function fakeAlmacenamiento(overrides = {}) {
  return {
    guardar: jest.fn().mockResolvedValue('img/fotos/bio/2026-06/aves/x/x_002.webp'),
    eliminar: jest.fn(),
    ...overrides,
  };
}
function fakeCache() {
  return { invalidar: jest.fn().mockResolvedValue(undefined) };
}

const datosValidos = { especieEs: 'Colibrí corregido', grupo: 'aves', subregion: 'valle_aburra' };

describe('actualizarFoto (caso de uso)', () => {
  test('valida los datos antes de tocar el repositorio', async () => {
    const repositorio = fakeRepositorio();
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await expect(actualizarFoto({
      id: 'id1', mes: '2026-06', fotosExistentes: [],
      grupo: 'dinosaurios', subregion: 'valle_aburra', especieEs: 'X',
    })).rejects.toThrow(ErrorValidacion);
    expect(repositorio.buscarPorId).not.toHaveBeenCalled();
  });

  test('borra del almacenamiento las fotos que ya no se conservan', async () => {
    const repositorio = fakeRepositorio({ buscarPorId: jest.fn().mockResolvedValue({ fotos: ['a.webp', 'b.webp'] }) });
    const almacenamiento = fakeAlmacenamiento();
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento, cache: fakeCache() });

    await actualizarFoto({ id: 'id1', mes: '2026-06', fotosExistentes: ['a.webp'], archivosNuevos: [], ...datosValidos });

    expect(almacenamiento.eliminar).toHaveBeenCalledWith('b.webp');
    expect(almacenamiento.eliminar).not.toHaveBeenCalledWith('a.webp');
  });

  test('rechaza si no queda ninguna foto tras combinar existentes y nuevas', async () => {
    const repositorio = fakeRepositorio({ buscarPorId: jest.fn().mockResolvedValue({ fotos: [] }) });
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await expect(actualizarFoto({ id: 'id1', mes: '2026-06', fotosExistentes: [], archivosNuevos: [], ...datosValidos }))
      .rejects.toThrow('Se requiere al menos una foto');
  });

  test('siempre resetea publicado a false al editar', async () => {
    const repositorio = fakeRepositorio();
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await actualizarFoto({ id: 'id1', mes: '2026-06', fotosExistentes: ['a.webp'], archivosNuevos: [], ...datosValidos });

    expect(repositorio.actualizar).toHaveBeenCalledWith('id1', expect.objectContaining({ publicado: false }));
  });

  test('lanza ErrorNoEncontrado si el repositorio no encuentra el id al actualizar', async () => {
    const repositorio = fakeRepositorio({ actualizar: jest.fn().mockResolvedValue(null) });
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await expect(actualizarFoto({ id: 'id-inexistente', mes: '2026-06', fotosExistentes: ['a.webp'], archivosNuevos: [], ...datosValidos }))
      .rejects.toThrow(ErrorNoEncontrado);
  });

  test('recorta a máximo 3 fotos entre existentes y nuevas', async () => {
    const repositorio = fakeRepositorio();
    const almacenamiento = fakeAlmacenamiento({
      guardar: jest.fn().mockResolvedValueOnce('n1.webp').mockResolvedValueOnce('n2.webp'),
    });
    const actualizarFoto = crearActualizarFoto({ repositorio, almacenamiento, cache: fakeCache() });

    await actualizarFoto({
      id: 'id1', mes: '2026-06',
      fotosExistentes: ['a.webp', 'b.webp'],
      archivosNuevos: [
        { buffer: Buffer.from('1'), originalname: '1.jpg' },
        { buffer: Buffer.from('2'), originalname: '2.jpg' },
      ],
      ...datosValidos,
    });

    expect(repositorio.actualizar).toHaveBeenCalledWith('id1', expect.objectContaining({
      fotos: ['a.webp', 'b.webp', 'n1.webp'],
    }));
  });
});
