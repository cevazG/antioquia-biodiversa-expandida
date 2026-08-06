'use strict';
const { crearIniciarEnrolamientoMfa } = require('../../../../../modules/auth/application/casos_uso/iniciarEnrolamientoMfa');

describe('iniciarEnrolamientoMfa (caso de uso)', () => {
  test('genera un secreto, lo guarda en el repositorio y devuelve la URI del QR', async () => {
    const repositorio = { guardarSecretoMfa: jest.fn().mockResolvedValue(undefined) };
    const iniciarEnrolamientoMfa = crearIniciarEnrolamientoMfa({ repositorio });

    const resultado = await iniciarEnrolamientoMfa({ usuarioId: 'u1', nombreUsuario: 'curador' });

    expect(repositorio.guardarSecretoMfa).toHaveBeenCalledWith('u1', expect.any(String));
    expect(resultado.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(resultado.uri).toContain('curador');
  });

  test('el secreto guardado es el mismo que aparece codificado en la URI devuelta', async () => {
    let secretoGuardado;
    const repositorio = { guardarSecretoMfa: jest.fn((_id, secreto) => { secretoGuardado = secreto; }) };
    const iniciarEnrolamientoMfa = crearIniciarEnrolamientoMfa({ repositorio });

    const { uri } = await iniciarEnrolamientoMfa({ usuarioId: 'u1', nombreUsuario: 'curador' });

    expect(uri).toContain(`secret=${secretoGuardado}`);
  });
});
