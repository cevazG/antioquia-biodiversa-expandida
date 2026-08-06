'use strict';
// Caso de uso probado con colaboradores falsos en memoria — sin Mongoose,
// sin Express, sin sharp. Confirma la orquestación (orden de validación,
// guardado de archivos, invalidación de caché) de forma rápida y aislada.
const { crearCrearFoto } = require('../../../../../modules/jpl/application/casos_uso/crearFoto');
const { ErrorValidacion } = require('../../../../../modules/jpl/domain/errores');

function fakeRepositorio(overrides = {}) {
  return {
    contarPorMes: jest.fn().mockResolvedValue(0),
    crear: jest.fn().mockImplementation(datos => Promise.resolve({ _id: 'nueva1', ...datos })),
    ...overrides,
  };
}
function fakeAlmacenamiento(overrides = {}) {
  return { guardar: jest.fn().mockResolvedValue('img/fotos/bio/2026-06/aves/x/x_001.webp'), ...overrides };
}
function fakeCache() {
  return { invalidar: jest.fn().mockResolvedValue(undefined) };
}

describe('crearFoto (caso de uso)', () => {
  test('rechaza si no vienen archivos, antes de validar los demás campos', async () => {
    const repositorio = fakeRepositorio();
    const crearFoto = crearCrearFoto({ repositorio, almacenamiento: fakeAlmacenamiento(), cache: fakeCache() });

    await expect(crearFoto({ mes: '2026-06', archivosNuevos: [] }))
      .rejects.toThrow('Se requiere al menos una foto');
    expect(repositorio.crear).not.toHaveBeenCalled();
  });

  test('valida los datos antes de guardar archivos', async () => {
    const almacenamiento = fakeAlmacenamiento();
    const crearFoto = crearCrearFoto({ repositorio: fakeRepositorio(), almacenamiento, cache: fakeCache() });

    await expect(crearFoto({
      mes: '2026-06',
      archivosNuevos: [{ buffer: Buffer.from('x'), originalname: 'x.jpg' }],
      grupo: 'dinosaurios', subregion: 'valle_aburra', especieEs: 'X',
    })).rejects.toThrow(ErrorValidacion);
    expect(almacenamiento.guardar).not.toHaveBeenCalled();
  });

  test('guarda cada archivo, asigna orden y crea el registro', async () => {
    const repositorio = fakeRepositorio({ contarPorMes: jest.fn().mockResolvedValue(2) });
    const almacenamiento = fakeAlmacenamiento();
    const cache = fakeCache();
    const crearFoto = crearCrearFoto({ repositorio, almacenamiento, cache });

    const creada = await crearFoto({
      mes: '2026-06',
      archivosNuevos: [{ buffer: Buffer.from('x'), originalname: 'x.jpg' }],
      especieEs: 'Colibrí de cola rufa', especieCientifico: 'Amazilia tzacatl',
      grupo: 'aves', subregion: 'valle_aburra', iucn: 'LC', endemica: 'false',
    });

    expect(almacenamiento.guardar).toHaveBeenCalledWith(
      expect.any(Buffer), 'x.jpg', '2026-06', 'aves', 'Amazilia tzacatl'
    );
    expect(repositorio.crear).toHaveBeenCalledWith(expect.objectContaining({
      mes: '2026-06', orden: 2, fotos: ['img/fotos/bio/2026-06/aves/x/x_001.webp'],
      especieEs: 'Colibrí de cola rufa', grupo: 'aves', iucn: 'LC', endemica: false,
    }));
    expect(cache.invalidar).toHaveBeenCalledWith('jpl:fotos:2026-06', 'jpl:stats:analytics', 'jpl:stats:monthly');
    expect(creada._id).toBe('nueva1');
  });

  test('funciona sin cache — es un colaborador opcional', async () => {
    const crearFoto = crearCrearFoto({ repositorio: fakeRepositorio(), almacenamiento: fakeAlmacenamiento() });

    await expect(crearFoto({
      mes: '2026-06',
      archivosNuevos: [{ buffer: Buffer.from('x'), originalname: 'x.jpg' }],
      especieEs: 'X', grupo: 'aves', subregion: 'valle_aburra',
    })).resolves.toBeDefined();
  });
});
