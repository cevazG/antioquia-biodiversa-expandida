const mongoose = require('mongoose');
const { connCom } = require('../db');

const municipalitySchema = new mongoose.Schema({
  nombre:         { type: String, required: true },
  subregion:      { type: String, required: true },
  lat:            Number,
  lng:            Number,
  jpl_beneficiado:{ type: Boolean, default: true },
  codigoDANE:     String
});

module.exports = connCom.model('Municipality', municipalitySchema);
