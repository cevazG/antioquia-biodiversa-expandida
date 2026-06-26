const mongoose = require('mongoose');
const { connCom } = require('../db');

const GcPhotoSchema = new mongoose.Schema({
  mes:          { type: String, required: true },  // 'YYYY-MM'
  orden:        { type: Number, default: 0 },
  foto:         { type: String, required: true },
  credito:      { type: String, default: '' },
  municipio:    { type: String, default: '' },
  subregion:    { type: String, required: true },
  cuenca:       { type: String, required: true },
  tituloEs:     { type: String, required: true },
  tituloEn:     { type: String, default: '' },
  descripcionEs:{ type: String, default: '' },
  descripcionEn:{ type: String, default: '' },
  publicado:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = connCom.model('GcPhoto', GcPhotoSchema);
