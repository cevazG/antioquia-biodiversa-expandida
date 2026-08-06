'use strict';
const FotoCuenca = require('../../../../modules/gc/domain/FotoCuenca');
const { ErrorValidacion } = require('../../../../modules/gc/domain/errores');

describe('FotoCuenca.crearDatosFoto', () => {
  const datosValidos = { cuenca: 'Río Medellín', tituloEs: 'Nacimiento del río', subregion: 'valle_aburra' };

  test('lanza ErrorValidacion si falta cuenca', () => {
    expect(() => FotoCuenca.crearDatosFoto({ ...datosValidos, cuenca: '' })).toThrow(ErrorValidacion);
    expect(() => FotoCuenca.crearDatosFoto({ ...datosValidos, cuenca: '   ' }))
      .toThrow('Se requiere el nombre de la cuenca');
  });

  test('lanza ErrorValidacion si falta tituloEs', () => {
    expect(() => FotoCuenca.crearDatosFoto({ ...datosValidos, tituloEs: '' }))
      .toThrow('Se requiere un título');
  });

  test('lanza ErrorValidacion si la subregión no es válida', () => {
    expect(() => FotoCuenca.crearDatosFoto({ ...datosValidos, subregion: 'narnia' }))
      .toThrow('Subregión no reconocida');
  });

  // Mismo orden que tenía routes/admin.js.
  test('valida cuenca antes que tituloEs', () => {
    expect(() => FotoCuenca.crearDatosFoto({ cuenca: '', tituloEs: '', subregion: 'narnia' }))
      .toThrow('Se requiere el nombre de la cuenca');
  });

  test('valida tituloEs antes que subregión', () => {
    expect(() => FotoCuenca.crearDatosFoto({ cuenca: 'X', tituloEs: '', subregion: 'narnia' }))
      .toThrow('Se requiere un título');
  });

  test('rellena campos opcionales con string vacío por defecto', () => {
    expect(FotoCuenca.crearDatosFoto(datosValidos)).toMatchObject({
      tituloEn: '', descripcionEs: '', descripcionEn: '', credito: '', municipio: '',
    });
  });
});

describe('FotoCuenca.aPayloadPublicacion', () => {
  test('arma el payload con mes/mesEn/año y fotos numeradas', () => {
    const fotos = [{
      foto: 'img/fotos/gc_2026-06/gc_001.webp', credito: 'Ana', municipio: 'Rionegro',
      subregion: 'oriente', cuenca: 'Río Negro', tituloEs: 'Nacimiento', tituloEn: '',
      descripcionEs: '', descripcionEn: '',
    }];

    const payload = FotoCuenca.aPayloadPublicacion(fotos, '2026-06');

    expect(payload).toMatchObject({ mes: 'Junio', mesEn: 'June', año: 2026 });
    expect(payload.fotos).toHaveLength(1);
    expect(payload.fotos[0]).toMatchObject({ id: 'gc_2026-06_001', cuenca: 'Río Negro' });
  });

  test('numera los ids en orden secuencial de 3 dígitos', () => {
    const fotos = [0, 1].map(i => ({
      foto: `f${i}.webp`, cuenca: `C${i}`, tituloEs: `T${i}`, tituloEn: '', subregion: 'oriente',
      credito: '', municipio: '', descripcionEs: '', descripcionEn: '',
    }));

    const payload = FotoCuenca.aPayloadPublicacion(fotos, '2026-06');

    expect(payload.fotos.map(f => f.id)).toEqual(['gc_2026-06_001', 'gc_2026-06_002']);
  });
});
