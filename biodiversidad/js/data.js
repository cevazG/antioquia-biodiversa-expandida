/* ============================================================
   ANTIOQUIA BIODIVERSA — data.js
   Lee directamente desde data/species.json (sin servidor).
   El panel admin (JPL/GC) sigue usando el backend en puerto 3000.
   ============================================================ */

var DataStore = (() => {
  const JSON_URL = 'data/species.json';

  const SUBREGION_NAMES = {
    uraba:           'Urabá',
    occidente:       'Occidente',
    norte:           'Norte',
    bajo_cauca:      'Bajo Cauca',
    nordeste:        'Nordeste',
    magdalena_medio: 'Magdalena Medio',
    valle_aburra:    'Valle de Aburrá',
    oriente:         'Oriente',
    suroeste:        'Suroeste',
  };

  function _resolveSubregion(s) {
    return SUBREGION_NAMES[s] || s;
  }

  const FAUNA_GROUPS = new Set([
    'aves', 'anfibios_reptiles', 'mariposas', 'polillas',
    'mamiferos', 'animales_domesticos', 'peces',
  ]);

  let _data = null;
  let _initPromise = null;

  async function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
      const res = await fetch(JSON_URL);
      if (!res.ok) throw new Error(`No se pudo cargar species.json (${res.status})`);
      _data = await res.json();
    })();
    return _initPromise;
  }

  // ── Familias ──────────────────────────────────────────────

  function getFamilyById(id) {
    return _data.families.find(f => f.id === id) || null;
  }

  // ── Especies ──────────────────────────────────────────────

  function getSpeciesById(id) {
    return _data.species.find(s => s.id === id) || null;
  }

  function searchSpecies(query, group = null, kingdom = null) {
    let results = _data.species;

    if (group)   results = results.filter(s => s.group === group);
    if (kingdom) results = results.filter(s =>
      kingdom === 'fauna' ? FAUNA_GROUPS.has(s.group) : !FAUNA_GROUPS.has(s.group)
    );
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(s =>
        s.nameEs.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q)
      );
    }
    return results;
  }

  function countSpeciesByGroup(group, subregion = null) {
    let results = _data.species.filter(s => s.group === group);
    if (subregion) {
      const name = _resolveSubregion(subregion);
      results = results.filter(s => s.subregions.includes(name));
    }
    return results.length;
  }

  function getFamiliesWithSpecies(group, subregion = null, kingdom = null) {
    let species = _data.species;

    if (group)     species = species.filter(s => s.group === group);
    if (subregion) {
      const name = _resolveSubregion(subregion);
      species = species.filter(s => s.subregions.includes(name));
    }
    if (kingdom)   species = species.filter(s =>
      kingdom === 'fauna' ? FAUNA_GROUPS.has(s.group) : !FAUNA_GROUPS.has(s.group)
    );

    const byFamily = {};
    species.forEach(sp => {
      if (!byFamily[sp.familyId]) byFamily[sp.familyId] = [];
      byFamily[sp.familyId].push(sp);
    });

    return _data.families
      .filter(f => byFamily[f.id])
      .map(f => ({ ...f, species: byFamily[f.id] }));
  }

  // ── Imágenes ─────────────────────────────────────────────

  function getMainPhoto(species) {
    if (!species.photos || species.photos.length === 0) return null;
    const url = typeof species.photos[0] === 'string'
      ? species.photos[0]
      : species.photos[0].url;
    if (url && !url.startsWith('placeholder_')) return 'img/species/' + url;
    return null;
  }

  function getPhotos(species) {
    if (!species.photos) return [];
    return species.photos
      .map(p => typeof p === 'string' ? p : p.url)
      .filter(p => p && !p.startsWith('placeholder_'))
      .map(p => 'img/species/' + p);
  }

  return {
    init,
    getFamilyById,
    getSpeciesById,
    searchSpecies,
    countSpeciesByGroup,
    getFamiliesWithSpecies,
    getMainPhoto,
    getPhotos,
  };
})();
