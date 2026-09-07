'use strict';
const { authenticator } = require('otplib');
const totp = require('../../../../modules/auth/domain/totp');

describe('totp', () => {
  test('generarSecreto devuelve un secreto base32 no vacío y distinto cada vez', () => {
    const a = totp.generarSecreto();
    const b = totp.generarSecreto();
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });

  test('generarUri produce una URI otpauth:// con el emisor y el usuario', () => {
    const uri = totp.generarUri('JBSWY3DPEHPK3PXP', 'curador');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('curador');
    expect(uri).toContain('Antioquia%20Natural');
  });

  test('verificarCodigo devuelve true para un código válido recién generado', () => {
    const secreto = totp.generarSecreto();
    const codigo = authenticator.generate(secreto);

    expect(totp.verificarCodigo(codigo, secreto)).toBe(true);
  });

  test('verificarCodigo devuelve false para un código incorrecto', () => {
    const secreto = totp.generarSecreto();

    expect(totp.verificarCodigo('000000', secreto)).toBe(false);
  });

  test('verificarCodigo devuelve false (no lanza) si falta código o secreto', () => {
    expect(totp.verificarCodigo(undefined, 'JBSWY3DPEHPK3PXP')).toBe(false);
    expect(totp.verificarCodigo('123456', undefined)).toBe(false);
    expect(totp.verificarCodigo('', '')).toBe(false);
  });

  test('verificarCodigo devuelve false (no lanza) si el código tiene formato inválido', () => {
    expect(totp.verificarCodigo('no-es-un-numero', 'JBSWY3DPEHPK3PXP')).toBe(false);
  });
});
