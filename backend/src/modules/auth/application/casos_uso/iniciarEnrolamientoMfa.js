'use strict';
// Caso de uso: primer login de un usuario sin MFA configurado todavía.
// Genera un secreto nuevo, lo guarda de inmediato (queda "pendiente de
// confirmar" hasta que el usuario escanee el QR y envíe un código válido
// en verificarMfa) y devuelve la URI otpauth:// para pintar el QR.
//
// Si el usuario abandona antes de confirmar, el próximo intento de login
// simplemente genera y guarda un secreto nuevo — no hay estado a medias
// que limpiar ni riesgo de bloqueo permanente.
const totp = require('../../domain/totp');

function crearIniciarEnrolamientoMfa({ repositorio }) {
  return async function iniciarEnrolamientoMfa({ usuarioId, nombreUsuario }) {
    const secreto = totp.generarSecreto();
    await repositorio.guardarSecretoMfa(usuarioId, secreto);
    return { uri: totp.generarUri(secreto, nombreUsuario) };
  };
}

module.exports = { crearIniciarEnrolamientoMfa };
