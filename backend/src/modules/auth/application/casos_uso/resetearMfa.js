'use strict';
// Un Admin.Contenido resetea el MFA de un curador que perdió su
// dispositivo — vuelve a mfaSecret:null, así que en su próximo login se le
// pide enrolar un dispositivo nuevo desde cero (ver iniciarEnrolamientoMfa).
const { ErrorNoEncontrado } = require('../../domain/errores');

function crearResetearMfa({ repositorio }) {
  return async function resetearMfa(id) {
    const actualizado = await repositorio.resetearMfa(id);
    if (!actualizado) throw new ErrorNoEncontrado('Usuario no encontrado');
    return actualizado;
  };
}

module.exports = { crearResetearMfa };
