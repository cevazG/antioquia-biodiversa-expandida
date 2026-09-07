'use strict';
// Regla de negocio de autenticación: una clave ingresada es válida si
// coincide (vía bcrypt) con un hash almacenado. Antes comparaba contra
// ADMIN_PASSWORD_HASH (una sola clave compartida); ahora la usa
// iniciarSesion.js contra el passwordHash de cada Usuario individual —
// la función en sí no cambió, solo de dónde sale el hash con el que compara.
//
// Este mecanismo (usuario/clave propios + sesión) es un puente temporal
// mientras se resuelve Microsoft Entra ID (Ajuste 1 / B1 — OAuth 2.0 +
// OIDC), bloqueado por que TI Gobernación provea Client ID y Tenant ID.
// Cuando eso ocurra, cambia cómo se autentica (esta función deja de
// usarse), no el modelo de usuarios/roles que ya existe en modules/auth/.
const bcrypt = require('bcryptjs');

function esValida(claveIngresada, hashAlmacenado) {
  return bcrypt.compareSync(claveIngresada || '', hashAlmacenado);
}

module.exports = { esValida };
