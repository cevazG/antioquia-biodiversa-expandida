'use strict';
// Adaptador de persistencia — implementa el puerto UsuarioRepositorio
// usando el modelo Mongoose (models/Usuario.js).
const Usuario = require('../../../models/Usuario');

function listar() {
  return Usuario.find({}).select('-passwordHash -mfaSecret').sort('nombre').lean();
}

// Se usa en cada request protegido (requireAuth) para confirmar activo y
// traer roles frescos — lean() y sin passwordHash/mfaSecret porque solo se
// necesitan esos campos, no un documento Mongoose completo.
function buscarPorId(id) {
  return Usuario.findById(id).select('-passwordHash -mfaSecret').lean();
}

// Incluye passwordHash a propósito: lo necesita iniciarSesion() para
// comparar contra la clave ingresada. mfaSecret también se incluye — el
// router lo usa justo después del login para decidir si falta enrolar MFA.
function buscarPorUsuario(usuario) {
  return Usuario.findOne({ usuario }).lean();
}

// Único punto donde se lee mfaSecret completo — para verificar el código
// TOTP en el segundo paso del login (POST /login/mfa).
function buscarPorIdConMfaSecret(id) {
  return Usuario.findById(id).select('mfaSecret usuario activo').lean();
}

async function existeUsuario(usuario) {
  const doc = await Usuario.findOne({ usuario }).select('_id').lean();
  return !!doc;
}

function crear(datos) {
  return Usuario.create(datos);
}

function actualizar(id, datos) {
  return Usuario.findByIdAndUpdate(id, datos, { new: true }).select('-passwordHash -mfaSecret');
}

function guardarSecretoMfa(id, secreto) {
  return Usuario.findByIdAndUpdate(id, { mfaSecret: secreto });
}

// Revoca el MFA de un usuario (p. ej. perdió el dispositivo) — vuelve a
// quedar en estado "sin enrolar", así que su próximo login le pedirá
// escanear un código QR nuevo antes de continuar.
function resetearMfa(id) {
  return Usuario.findByIdAndUpdate(id, { mfaSecret: null }, { new: true }).select('-passwordHash -mfaSecret');
}

module.exports = {
  listar, buscarPorId, buscarPorUsuario, buscarPorIdConMfaSecret, existeUsuario,
  crear, actualizar, guardarSecretoMfa, resetearMfa,
};
