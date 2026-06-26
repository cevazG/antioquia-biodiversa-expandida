const mongoose = require('mongoose');
const { connCom } = require('../db');

const communitySightingSchema = new mongoose.Schema({
  speciesMonthId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpeciesMonth', required: true },
  usuario:        String,
  municipio:      String,
  subregion:      String,
  fecha:          Date,
  fotoUrl:        String,
  comentario:     String,
  approved:       { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now }
});

communitySightingSchema.index({ speciesMonthId: 1, approved: 1 });

module.exports = connCom.model('CommunitySighting', communitySightingSchema);
