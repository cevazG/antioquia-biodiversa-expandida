'use strict';
// Regla de negocio de MFA: genera secretos TOTP (RFC 6238, compatible con
// Google Authenticator/Authy/1Password) y verifica códigos de 6 dígitos.
// Mismo criterio que credencial.js: envuelve una librería de criptografía
// (otplib) directamente aquí en domain/, sin capa de infraestructura
// intermedia — no hay I/O externo, es cómputo puro.
const { authenticator } = require('otplib');

const EMISOR = 'Antioquia Natural';

function generarSecreto() {
  return authenticator.generateSecret();
}

function generarUri(secreto, nombreUsuario) {
  return authenticator.keyuri(nombreUsuario, EMISOR, secreto);
}

function verificarCodigo(codigo, secreto) {
  if (!codigo || !secreto) return false;
  try {
    return authenticator.check(String(codigo).trim(), secreto);
  } catch (_err) {
    return false;
  }
}

module.exports = { generarSecreto, generarUri, verificarCodigo };
