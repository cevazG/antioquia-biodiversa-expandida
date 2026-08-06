'use strict';
const bcrypt = require('bcryptjs');
const credencial = require('../../../../modules/auth/domain/credencial');

describe('credencial.esValida', () => {
  const hash = bcrypt.hashSync('clave-correcta', 10);

  test('devuelve true si la clave coincide con el hash', () => {
    expect(credencial.esValida('clave-correcta', hash)).toBe(true);
  });

  test('devuelve false si la clave no coincide', () => {
    expect(credencial.esValida('clave-incorrecta', hash)).toBe(false);
  });

  test('devuelve false (no lanza) si no se envía clave', () => {
    expect(credencial.esValida(undefined, hash)).toBe(false);
    expect(credencial.esValida('', hash)).toBe(false);
  });
});
