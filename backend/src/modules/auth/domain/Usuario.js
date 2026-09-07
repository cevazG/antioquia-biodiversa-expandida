'use strict';
// Entidad Usuario — funciones puras, sin I/O ni conocimiento de
// Mongoose/Express/bcrypt.
const { ErrorValidacion } = require('./errores');
const { ROLES_VALIDOS } = require('../../../config/catalogo');

const PASSWORD_MIN_LENGTH = 8;

// Valida y normaliza nombre/usuario/roles. No incluye la contraseña — eso
// es responsabilidad de validarPassword() más abajo, porque no siempre
// viene junta (editar un usuario sin cambiarle la clave).
function crearDatosUsuario(crudos) {
  const nombre = crudos.nombre?.trim();
  if (!nombre) throw new ErrorValidacion('Se requiere el nombre');

  const usuario = crudos.usuario?.trim().toLowerCase();
  if (!usuario) throw new ErrorValidacion('Se requiere el usuario');

  const roles = Array.isArray(crudos.roles) ? crudos.roles : [];
  if (!roles.length) throw new ErrorValidacion('Se requiere al menos un rol');
  const invalidos = roles.filter(r => !ROLES_VALIDOS.includes(r));
  if (invalidos.length) throw new ErrorValidacion(`Rol no reconocido: ${invalidos.join(', ')}`);

  return { nombre, usuario, roles };
}

function validarPassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new ErrorValidacion(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }
}

module.exports = { crearDatosUsuario, validarPassword };
