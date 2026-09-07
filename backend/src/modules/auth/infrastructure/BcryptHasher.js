'use strict';
// Adaptador — genera hashes de contraseñas nuevas. La verificación de una
// clave contra un hash existente ya vive en domain/credencial.js
// (esValida) y se reutiliza tal cual; este archivo cubre la otra mitad
// (crear el hash), que solo hace falta al dar de alta o cambiar clave.
const bcrypt = require('bcryptjs');

function hashear(password) {
  return bcrypt.hashSync(password, 10);
}

module.exports = { hashear };
