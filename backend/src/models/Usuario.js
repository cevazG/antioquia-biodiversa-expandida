const mongoose = require('mongoose');
const { connCom } = require('../db');
const { ROLES_VALIDOS } = require('../config/catalogo');

const UsuarioSchema = new mongoose.Schema({
  nombre:       { type: String, required: true },
  usuario:      { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  roles:        [{ type: String, enum: ROLES_VALIDOS }],
  activo:       { type: Boolean, default: true },
  // Secreto TOTP (RFC 6238) para el segundo factor — null hasta que el
  // usuario complete el enrolamiento en su primer login. Nunca se expone
  // en respuestas HTTP (excluido igual que passwordHash).
  mfaSecret:    { type: String, default: null },
}, { timestamps: true });

module.exports = connCom.model('Usuario', UsuarioSchema);
