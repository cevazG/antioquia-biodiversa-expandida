const mongoose = require('mongoose');
const { connCom } = require('../db');
const { ROLES_VALIDOS } = require('../config/catalogo');

const UsuarioSchema = new mongoose.Schema({
  nombre:       { type: String, required: true },
  usuario:      { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  roles:        [{ type: String, enum: ROLES_VALIDOS }],
  activo:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = connCom.model('Usuario', UsuarioSchema);
