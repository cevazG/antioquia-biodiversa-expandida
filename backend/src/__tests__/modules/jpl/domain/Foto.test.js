'use strict';
// Tests de dominio puro — sin Mongoose, sin Express, sin mocks pesados.
// Es exactamente la ganancia que buscaba el refactor a arquitectura
// hexagonal: esta lógica de negocio se prueba aislada de la infraestructura.
const Foto = require('../../../../modules/jpl/domain/Foto');
const { ErrorValidacion } = require('../../../../modules/jpl/domain/errores');

describe('Foto.crearDatosFoto', () => {
  const datosValidos = {
    especieEs: 'Colibrí de cola rufa',
    grupo: 'aves',
    subregion: 'valle_aburra',
  };

  test('lanza ErrorValidacion si falta especieEs', () => {
    expect(() => Foto.crearDatosFoto({ ...datosValidos, especieEs: '' })).toThrow(ErrorValidacion);
    expect(() => Foto.crearDatosFoto({ ...datosValidos, especieEs: '   ' }))
      .toThrow('Se requiere el nombre común de la especie');
  });

  test('lanza ErrorValidacion si el grupo no es válido', () => {
    expect(() => Foto.crearDatosFoto({ ...datosValidos, grupo: 'dinosaurios' }))
      .toThrow('Grupo taxonómico no reconocido');
  });

  test('lanza ErrorValidacion si la subregión no es válida', () => {
    expect(() => Foto.crearDatosFoto({ ...datosValidos, subregion: 'narnia' }))
      .toThrow('Subregión no reconocida');
  });

  test('lanza ErrorValidacion si el IUCN no es válido', () => {
    expect(() => Foto.crearDatosFoto({ ...datosValidos, iucn: 'ZZ' }))
      .toThrow('Código IUCN no reconocido');
  });

  test('no exige IUCN — usa DD por defecto si no viene', () => {
    expect(Foto.crearDatosFoto(datosValidos).iucn).toBe('DD');
  });

  // Mismo orden que tenía routes/admin.js — el mensaje de error que ve el
  // frontend depende de que este orden no cambie.
  test('valida especieEs antes que grupo', () => {
    expect(() => Foto.crearDatosFoto({ especieEs: '', grupo: 'dinosaurios', subregion: 'narnia' }))
      .toThrow('Se requiere el nombre común de la especie');
  });

  test('valida grupo antes que subregión', () => {
    expect(() => Foto.crearDatosFoto({ especieEs: 'X', grupo: 'dinosaurios', subregion: 'narnia' }))
      .toThrow('Grupo taxonómico no reconocido');
  });

  test('normaliza endemica desde string "true"/"false"', () => {
    expect(Foto.crearDatosFoto({ ...datosValidos, endemica: 'true' }).endemica).toBe(true);
    expect(Foto.crearDatosFoto({ ...datosValidos, endemica: 'false' }).endemica).toBe(false);
    expect(Foto.crearDatosFoto(datosValidos).endemica).toBe(false);
  });

  test('rellena campos opcionales con string vacío por defecto', () => {
    expect(Foto.crearDatosFoto(datosValidos)).toMatchObject({
      especieEn: '', especieCientifico: '', descripcionEs: '', descripcionEn: '',
      credito: '', municipio: '',
    });
  });
});

describe('Foto.aPayloadPublicacion', () => {
  test('arma el payload con mes/mesEn/año y fotos numeradas', () => {
    const fotos = [{
      fotos: ['a.webp'], credito: 'Juan', municipio: 'Medellín', subregion: 'valle_aburra',
      especieEs: 'Colibrí', especieEn: '', especieCientifico: 'Amazilia tzacatl',
      grupo: 'aves', iucn: 'LC', endemica: false, descripcionEs: '', descripcionEn: '',
    }];

    const payload = Foto.aPayloadPublicacion(fotos, '2026-06');

    expect(payload).toMatchObject({ mes: 'Junio', mesEn: 'June', año: 2026 });
    expect(payload.fotos).toHaveLength(1);
    expect(payload.fotos[0]).toMatchObject({ id: 'jpl_2026-06_001', especieCientifico: 'Amazilia tzacatl' });
  });

  test('usa array vacío si la foto no tiene .fotos', () => {
    const fotos = [{ especieEs: 'X', especieCientifico: 'Y', grupo: 'aves', subregion: 'oriente', credito: '', municipio: '', iucn: 'DD', endemica: false, descripcionEs: '', descripcionEn: '', especieEn: '' }];

    expect(Foto.aPayloadPublicacion(fotos, '2026-06').fotos[0].fotos).toEqual([]);
  });

  test('numera los ids en orden secuencial de 3 dígitos', () => {
    const fotos = [0, 1, 2].map(i => ({
      especieEs: `E${i}`, especieCientifico: `C${i}`, grupo: 'aves', subregion: 'oriente',
      credito: '', municipio: '', iucn: 'DD', endemica: false, descripcionEs: '', descripcionEn: '', especieEn: '',
    }));

    const payload = Foto.aPayloadPublicacion(fotos, '2026-06');

    expect(payload.fotos.map(f => f.id)).toEqual(['jpl_2026-06_001', 'jpl_2026-06_002', 'jpl_2026-06_003']);
  });
});
