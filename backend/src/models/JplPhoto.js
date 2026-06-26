const mongoose = require('mongoose');
const { connCom } = require('../db');

const JplPhotoSchema = new mongoose.Schema({
  mes:              { type: String, required: true },  // 'YYYY-MM'
  orden:            { type: Number, default: 0 },
  fotos:            [{ type: String }],                 // rutas relativas al frontend (1-3)
  credito:          { type: String, default: '' },
  municipio:        { type: String, default: '' },
  subregion:        { type: String, required: true },
  especieEs:        { type: String, required: true },
  especieEn:        { type: String, default: '' },
  especieCientifico:{ type: String, default: '' },
  grupo:            { type: String, required: true },
  iucn:             { type: String, default: 'DD' },
  endemica:         { type: Boolean, default: false },
  descripcionEs:    { type: String, default: '' },
  descripcionEn:    { type: String, default: '' },
  publicado:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = connCom.model('JplPhoto', JplPhotoSchema);
