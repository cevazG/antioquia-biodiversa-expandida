'use strict';
const Usuario = require('../../../../modules/auth/domain/Usuario');
const { ErrorValidacion } = require('../../../../modules/auth/domain/errores');

describe('Usuario.crearDatosUsuario', () => {
  const datosValidos = { nombre: 'María González', usuario: 'MGonzalez', roles: ['Curador.Biodiversidad'] };

  test('lanza ErrorValidacion si falta el nombre', () => {
    expect(() => Usuario.crearDatosUsuario({ ...datosValidos, nombre: '' })).toThrow(ErrorValidacion);
    expect(() => Usuario.crearDatosUsuario({ ...datosValidos, nombre: '   ' })).toThrow('Se requiere el nombre');
  });

  test('lanza ErrorValidacion si falta el usuario', () => {
    expect(() => Usuario.crearDatosUsuario({ ...datosValidos, usuario: '' })).toThrow('Se requiere el usuario');
  });

  test('normaliza el usuario a minúsculas', () => {
    expect(Usuario.crearDatosUsuario(datosValidos).usuario).toBe('mgonzalez');
  });

  test('lanza ErrorValidacion si no viene ningún rol', () => {
    expect(() => Usuario.crearDatosUsuario({ ...datosValidos, roles: [] })).toThrow('Se requiere al menos un rol');
    expect(() => Usuario.crearDatosUsuario({ ...datosValidos, roles: undefined })).toThrow('Se requiere al menos un rol');
  });

  test('lanza ErrorValidacion si algún rol no es válido', () => {
    expect(() => Usuario.crearDatosUsuario({ ...datosValidos, roles: ['Curador.Inventado'] }))
      .toThrow('Rol no reconocido: Curador.Inventado');
  });

  test('acepta varios roles válidos', () => {
    const datos = Usuario.crearDatosUsuario({ ...datosValidos, roles: ['Curador.Biodiversidad', 'Admin.Contenido'] });
    expect(datos.roles).toEqual(['Curador.Biodiversidad', 'Admin.Contenido']);
  });
});

describe('Usuario.validarPassword', () => {
  test('lanza ErrorValidacion si la contraseña tiene menos de 8 caracteres', () => {
    expect(() => Usuario.validarPassword('1234567')).toThrow(ErrorValidacion);
    expect(() => Usuario.validarPassword('1234567')).toThrow('al menos 8 caracteres');
  });

  test('lanza ErrorValidacion si no viene contraseña', () => {
    expect(() => Usuario.validarPassword('')).toThrow(ErrorValidacion);
    expect(() => Usuario.validarPassword(undefined)).toThrow(ErrorValidacion);
  });

  test('no lanza con una contraseña de 8 o más caracteres', () => {
    expect(() => Usuario.validarPassword('12345678')).not.toThrow();
  });
});
