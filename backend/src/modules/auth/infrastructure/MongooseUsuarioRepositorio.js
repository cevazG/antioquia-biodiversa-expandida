'use strict';
// Adaptador de persistencia — implementa el puerto UsuarioRepositorio
// usando el modelo Mongoose (models/Usuario.js).
const Usuario = require('../../../models/Usuario');

function listar() {
  return Usuario.find({}).select('-passwordHash').sort('nombre').lean();
}

// Se usa en cada request protegido (requireAuth) para confirmar activo y
// traer roles frescos — lean() y sin passwordHash porque solo se necesitan
// esos campos, no un documento Mongoose completo.
function buscarPorId(id) {
  return Usuario.findById(id).select('-passwordHash').lean();
}

// Incluye passwordHash a propósito: lo necesita iniciarSesion() para
// comparar contra la clave ingresada.
function buscarPorUsuario(usuario) {
  return Usuario.findOne({ usuario }).lean();
}

async function existeUsuario(usuario) {
  const doc = await Usuario.findOne({ usuario }).select('_id').lean();
  return !!doc;
}

function crear(datos) {
  return Usuario.create(datos);
}

function actualizar(id, datos) {
  return Usuario.findByIdAndUpdate(id, datos, { new: true }).select('-passwordHash');
}

module.exports = { listar, buscarPorId, buscarPorUsuario, existeUsuario, crear, actualizar };
