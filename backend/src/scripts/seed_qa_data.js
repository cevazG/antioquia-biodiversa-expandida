'use strict';

// Puebla la base de datos de QA (antioquia-biodiversa-qa) con datos sintéticos,
// nunca datos reales de participantes — cumple la anonimización obligatoria
// de la Guía de Arquitectura y Buenas Prácticas (sección 6.2) y RNF08.
//
// Uso: node src/scripts/seed_qa_data.js
// Requiere backend/.env.qa (MONGODB_URI_COM debe apuntar a la BD *-qa)

require('dotenv').config({ path: require('path').join(__dirname, '../../.env.qa') });

if (!/-qa(\?|$)/.test(process.env.MONGODB_URI_COM || '')) {
  console.error('MONGODB_URI_COM no apunta a una base de datos "-qa". Abortando para no tocar datos reales.');
  process.exit(1);
}

const mongoose = require('mongoose');
const JplPhoto = require('../models/JplPhoto');
const GcPhoto = require('../models/GcPhoto');

const FOTOGRAFOS_FICTICIOS = [
  'Participante de prueba 1', 'Participante de prueba 2', 'Participante de prueba 3',
  'Participante de prueba 4', 'Participante de prueba 5',
];

const MUNICIPIOS_FICTICIOS = {
  valle_aburra: 'Municipio de prueba (Valle de Aburrá)',
  oriente: 'Municipio de prueba (Oriente)',
  suroeste: 'Municipio de prueba (Suroeste)',
  norte: 'Municipio de prueba (Norte)',
  uraba: 'Municipio de prueba (Urabá)',
};

const JPL_SEED = [
  { grupo: 'aves', especieEs: 'Especie de prueba — Aves 1', especieCientifico: 'Testus avis', subregion: 'valle_aburra', iucn: 'LC' },
  { grupo: 'aves', especieEs: 'Especie de prueba — Aves 2', especieCientifico: 'Testus avis secundus', subregion: 'oriente', iucn: 'NT' },
  { grupo: 'mariposas', especieEs: 'Especie de prueba — Mariposa 1', especieCientifico: 'Testus lepidoptera', subregion: 'suroeste', iucn: 'LC' },
  { grupo: 'mamiferos', especieEs: 'Especie de prueba — Mamífero 1', especieCientifico: 'Testus mammalia', subregion: 'norte', iucn: 'VU' },
  { grupo: 'anfibios_reptiles', especieEs: 'Especie de prueba — Anfibio 1', especieCientifico: 'Testus amphibia', subregion: 'uraba', iucn: 'EN' },
  { grupo: 'orquideas', especieEs: 'Especie de prueba — Orquídea 1', especieCientifico: 'Testus orchidaceae', subregion: 'valle_aburra', iucn: 'DD' },
];

const GC_SEED = [
  { cuenca: 'Cuenca de prueba 1', subregion: 'valle_aburra', tituloEs: 'Fotografía de prueba — Cuenca 1' },
  { cuenca: 'Cuenca de prueba 2', subregion: 'oriente', tituloEs: 'Fotografía de prueba — Cuenca 2' },
  { cuenca: 'Cuenca de prueba 3', subregion: 'suroeste', tituloEs: 'Fotografía de prueba — Cuenca 3' },
];

async function seed() {
  const mes = '2026-07';

  await JplPhoto.deleteMany({ mes: { $regex: /^test-/ } });
  await GcPhoto.deleteMany({ mes: { $regex: /^test-/ } });

  const jplDocs = JPL_SEED.map((s, i) => ({
    mes: `test-${mes}`,
    orden: i,
    fotos: [`img/fotos/bio/test/${s.grupo}/placeholder_${i + 1}.webp`],
    credito: FOTOGRAFOS_FICTICIOS[i % FOTOGRAFOS_FICTICIOS.length],
    municipio: MUNICIPIOS_FICTICIOS[s.subregion],
    subregion: s.subregion,
    especieEs: s.especieEs,
    especieEn: s.especieEs.replace('prueba', 'test'),
    especieCientifico: s.especieCientifico,
    grupo: s.grupo,
    iucn: s.iucn,
    endemica: false,
    descripcionEs: 'Descripción sintética generada para el ambiente de QA, no corresponde a una observación real.',
    descripcionEn: 'Synthetic description generated for the QA environment, does not correspond to a real observation.',
    publicado: true,
  }));

  const gcDocs = GC_SEED.map((s, i) => ({
    mes: `test-${mes}`,
    orden: i,
    foto: `img/fotos/gc/test/placeholder_${i + 1}.webp`,
    credito: FOTOGRAFOS_FICTICIOS[i % FOTOGRAFOS_FICTICIOS.length],
    municipio: MUNICIPIOS_FICTICIOS[s.subregion],
    subregion: s.subregion,
    cuenca: s.cuenca,
    tituloEs: s.tituloEs,
    tituloEn: s.tituloEs.replace('prueba', 'test'),
    descripcionEs: 'Descripción sintética generada para el ambiente de QA, no corresponde a una observación real.',
    descripcionEn: 'Synthetic description generated for the QA environment, does not correspond to a real observation.',
    publicado: true,
  }));

  await JplPhoto.insertMany(jplDocs);
  await GcPhoto.insertMany(gcDocs);

  console.log(`✓ ${jplDocs.length} registros JplPhoto sintéticos insertados (mes: test-${mes})`);
  console.log(`✓ ${gcDocs.length} registros GcPhoto sintéticos insertados (mes: test-${mes})`);
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error al poblar datos de QA:', err);
    process.exit(1);
  });
