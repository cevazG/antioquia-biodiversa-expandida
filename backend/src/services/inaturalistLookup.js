'use strict';
// Autofill iNaturalist para el panel admin — busca nombre en inglés, estado
// IUCN y detalle en ES/EN (nombre + resumen de Wikipedia). Separado de
// routes/admin.js: es una consulta pura, no depende de Express.
// Nota: es un flujo distinto al de comunidad/Ampliacion Jovenes/backend/src/utils/inaturalistAutofill.js,
// que resuelve IUCN/endemismo para clasificar fotos, no nombres ES/EN + descripciones.
const IUCN_MAP = {
  'least concern': 'LC', 'near threatened': 'NT', 'vulnerable': 'VU',
  'endangered': 'EN', 'critically endangered': 'CR', 'data deficient': 'DD',
  'extinct in the wild': 'EW', 'extinct': 'EX', 'not evaluated': 'NE',
};

// Limpia el resumen de Wikipedia: quita HTML, trunca en 350 chars al último punto
function cleanWiki(raw) {
  if (!raw) return '';
  const clean = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const cut = clean.length > 350 ? clean.lastIndexOf('.', 350) : clean.length;
  return clean.slice(0, cut > 0 ? cut + 1 : 350).trim();
}

async function buscarEspecie(scientificName) {
  const query = scientificName.replace(/\s+(sp\.|cf\.|aff\.|ssp\.|subsp\.).*/i, '').trim();

  // 1) Buscar taxón con locale=en para obtener nombre en inglés
  const searchRes = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=1&locale=en`,
    { signal: AbortSignal.timeout(8000) }
  );
  const searchData = await searchRes.json();
  const taxon = searchData.results?.[0];
  if (!taxon) return { data: null, msg: 'No encontrado en iNaturalist' };

  const nameEn = taxon.preferred_common_name || '';

  // 2) Estado IUCN
  const statusRaw = taxon.conservation_status?.status_name?.toLowerCase() || '';
  // eslint-disable-next-line security/detect-object-injection -- statusRaw es string lowercase de iNaturalist API, IUCN_MAP tiene claves fijas
  const iucn = IUCN_MAP[statusRaw]
            || taxon.conservation_status?.status?.toUpperCase()
            || 'DD';

  // 3) Detalle en ES y EN en paralelo → nombres y Wikipedia en ambos idiomas
  const [detailEsData, detailEnData] = await Promise.all([
    fetch(`https://api.inaturalist.org/v1/taxa/${taxon.id}?locale=es`, { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
    fetch(`https://api.inaturalist.org/v1/taxa/${taxon.id}?locale=en`, { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
  ]);

  const taxonEs = detailEsData.results?.[0] || {};
  const taxonEn = detailEnData.results?.[0] || {};

  const nameEs = taxonEs.preferred_common_name || '';
  const descripcionEs = cleanWiki(taxonEs.wikipedia_summary);
  const descripcionEn = cleanWiki(taxonEn.wikipedia_summary);

  return {
    data: { nameEs, nameEn, iucn, descripcionEs, descripcionEn, inatUrl: `https://www.inaturalist.org/taxa/${taxon.id}` },
  };
}

module.exports = { buscarEspecie };
