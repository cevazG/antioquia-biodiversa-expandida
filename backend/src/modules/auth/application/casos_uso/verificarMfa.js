'use strict';
// Caso de uso: segundo paso del login — valida el código TOTP de 6 dígitos
// contra el secreto guardado del usuario. Mismo criterio de mensaje
// genérico que iniciarSesion: no distingue "no tienes MFA configurado" de
// "código incorrecto" para no filtrar información sobre el estado interno
// de la cuenta.
const totp = require('../../domain/totp');
const { ErrorCodigoMfaInvalido, ErrorUsuarioInactivo } = require('../../domain/errores');

const MENSAJE_GENERICO = 'Código incorrecto';

function crearVerificarMfa({ repositorio }) {
  return async function verificarMfa({ usuarioId, codigo }) {
    const usuario = await repositorio.buscarPorIdConMfaSecret(usuarioId);
    if (!usuario) throw new ErrorCodigoMfaInvalido(MENSAJE_GENERICO);
    if (!usuario.activo) throw new ErrorUsuarioInactivo('Usuario o contraseña incorrectos');
    if (!totp.verificarCodigo(codigo, usuario.mfaSecret)) {
      throw new ErrorCodigoMfaInvalido(MENSAJE_GENERICO);
    }
    return { id: usuario._id };
  };
}

module.exports = { crearVerificarMfa };
