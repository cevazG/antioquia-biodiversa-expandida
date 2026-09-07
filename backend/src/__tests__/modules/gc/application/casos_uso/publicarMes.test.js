'use strict';
const { crearPublicarMes } = require('../../../../../modules/gc/application/casos_uso/publicarMes');
const { ErrorSinContenido } = require('../../../../../modules/gc/domain/errores');

describe('publicarMes GC (caso de uso)', () => {
  test('lanza ErrorSinContenido si el mes no tiene fotos', async () => {
    const repositorio = { buscarPorMes: jest.fn().mockResolvedValue([]) };
    const publicador = { publicarMes: jest.fn() };
    const publicarMes = crearPublicarMes({ repositorio, publicador, cache: { invalidar: jest.fn() } });

    await expect(publicarMes('2026-06')).rejects.toThrow(ErrorSinContenido);
    expect(publicador.publicarMes).not.toHaveBeenCalled();
  });

  test('arma el payload, publica, marca publicadas e invalida caché en ese orden', async () => {
    const orden = [];
    const fotos = [{
      foto: 'a.webp', cuenca: 'X', tituloEs: 'T', tituloEn: '', subregion: 'oriente',
      credito: '', municipio: '', descripcionEs: '', descripcionEn: '',
    }];
    const repositorio = {
      buscarPorMes: jest.fn().mockResolvedValue(fotos),
      marcarPublicadas: jest.fn().mockImplementation(() => { orden.push('marcarPublicadas'); return Promise.resolve(); }),
    };
    const publicador = {
      publicarMes: jest.fn().mockImplementation(() => { orden.push('publicarMes'); return Promise.resolve({ count: 1 }); }),
    };
    const cache = { invalidar: jest.fn().mockImplementation(() => { orden.push('invalidar'); return Promise.resolve(); }) };
    const publicarMes = crearPublicarMes({ repositorio, publicador, cache });

    const resultado = await publicarMes('2026-06');

    expect(publicador.publicarMes).toHaveBeenCalledWith('2026-06', expect.objectContaining({ mes: 'Junio', mesEn: 'June', año: 2026 }));
    expect(repositorio.marcarPublicadas).toHaveBeenCalledWith('2026-06');
    expect(cache.invalidar).toHaveBeenCalledWith('gc:fotos:2026-06');
    expect(orden).toEqual(['publicarMes', 'marcarPublicadas', 'invalidar']);
    expect(resultado).toEqual({ count: 1 });
  });
});
