'use strict';
// Adaptador de estadísticas — agregaciones sobre las fotos JPL. Movido tal
// cual desde services/jplStats.js (exclusivo de JPL, no compartido con GC,
// así que se mueve en vez de duplicarse). Las agregaciones usan operadores
// específicos de MongoDB ($group, $project), por eso viven en
// infraestructura y no detrás de un puerto genérico de repositorio: un
// cambio de motor de base de datos exigiría reescribir esta lógica de
// todas formas.
const JplPhoto = require('../../../models/JplPhoto');

// Fotógrafos únicos por subregión, cobertura municipal, alertas de especies
// en peligro (CR/EN) y bioindicadores hídricos (anfibios/reptiles y peces).
async function calcularAnalytics() {
  const all = await JplPhoto.find({}).lean();

  const allCreditSet = new Set(all.map(f => f.credito?.trim()).filter(Boolean));
  const allSubregSet = new Set(all.map(f => f.subregion).filter(Boolean));

  // Map en vez de objeto plano: evita el riesgo de object-injection al usar
  // valores dinámicos (subregión/municipio) como clave.
  const fMap = new Map();
  all.forEach(f => {
    const s = f.subregion || '';
    if (!fMap.has(s)) fMap.set(s, new Set());
    if (f.credito?.trim()) fMap.get(s).add(f.credito.trim());
  });
  const fotografos = [...fMap.entries()]
    .filter(([s]) => s)
    .map(([subregion, set]) => ({ subregion, count: set.size, nombres: [...set].sort() }))
    .sort((a, b) => b.count - a.count);

  const mMap = new Map();
  all.forEach(f => {
    const key = f.municipio?.trim();
    if (!key) return;
    if (!mMap.has(key)) mMap.set(key, { municipio: key, subregion: f.subregion || '', fotos: 0, esps: new Set(), amenazadas: 0 });
    const m = mMap.get(key);
    m.fotos++;
    if (f.especieCientifico?.trim()) m.esps.add(f.especieCientifico.trim());
    if (['CR', 'EN', 'VU'].includes(f.iucn)) m.amenazadas++;
  });
  const municipios = [...mMap.values()]
    .map(m => ({ municipio: m.municipio, subregion: m.subregion, fotos: m.fotos, especies: m.esps.size, amenazadas: m.amenazadas }))
    .sort((a, b) => b.fotos - a.fotos);

  const alertas = all
    .filter(f => ['CR', 'EN'].includes(f.iucn))
    .map(f => ({
      sci: f.especieCientifico, es: f.especieEs, iucn: f.iucn,
      municipio: f.municipio,   subregion: f.subregion,
      credito: f.credito,       endemica: f.endemica,
      foto: f.fotos?.[0] || '', mes: f.mes,
    }));

  const bioindicadores = all
    .filter(f => ['anfibios_reptiles', 'peces'].includes(f.grupo))
    .map(f => ({
      sci: f.especieCientifico, es: f.especieEs, grupo: f.grupo, iucn: f.iucn,
      municipio: f.municipio,   subregion: f.subregion,
      credito: f.credito,       endemica: f.endemica,
      foto: f.fotos?.[0] || '', mes: f.mes,
    }));

  return {
    totalFotografos:      allCreditSet.size,
    municipiosCubiertos:  mMap.size,
    subregionesCubiertas: allSubregSet.size,
    fotografos, municipios, alertas, bioindicadores,
  };
}

const MESES_ES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

async function calcularEstadisticasMensuales() {
  const rows = await JplPhoto.aggregate([
    {
      $group: {
        _id:            '$mes',
        fotos:          { $sum: 1 },
        especiesSet:    { $addToSet: '$especieCientifico' },
        subregionesSet: { $addToSet: '$subregion' },
        amenazadas:     { $sum: { $cond: [{ $in: ['$iucn', ['CR', 'EN', 'VU']] }, 1, 0] } },
        endemicas:      { $sum: { $cond: ['$endemica', 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0, mes: '$_id', fotos: 1, amenazadas: 1, endemicas: 1,
        especiesUnicas: { $size: '$especiesSet' },
        subregiones:    { $size: '$subregionesSet' },
      },
    },
    { $sort: { mes: 1 } },
  ]);
  return rows.map(r => {
    const [y, m] = r.mes.split('-');
    return { ...r, label: `${MESES_ES[+m]} ${y}` };
  });
}

module.exports = { calcularAnalytics, calcularEstadisticasMensuales };
