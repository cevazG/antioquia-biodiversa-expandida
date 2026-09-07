/* ============================================================
   ANTIOQUIA NATURAL — feed-data.js
   FeedStore: fusiona en runtime las 3 fuentes de fotos
     · catálogo de biodiversidad  (via DataStore / species.json)
     · Jóvenes pa' Lante (JPL)     (comunidad/jovenes_pa_lante/data/)
     · Guarda Cuencas (GC)         (comunidad/guarda_cuencas/data/)
   Normaliza todo a un modelo común (FeedItem) y lo entrega
   filtrado + ordenado. No hay backend nuevo: lee los mismos JSON
   estáticos que ya genera el panel admin al publicar.

   Debe cargarse DESPUÉS de data.js (depende de DataStore) y desde
   una página a nivel biodiversidad/ (feed.html, especie.html).
   ============================================================ */

var FeedStore = (() => {
  const JPL_BASE = '../comunidad/jovenes_pa_lante/';
  const GC_BASE  = '../comunidad/guarda_cuencas/';
  const JPL_INDEX = JPL_BASE + 'data/fotos_biodiversidad.json';
  const GC_INDEX  = GC_BASE  + 'data/fotos_cuencas.json';

  const SUBREGION_NAMES = {
    uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
    bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
    magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
    oriente: 'Oriente', suroeste: 'Suroeste',
  };

  let _items = null;          // FeedItem[]
  let _bySpecies = {};        // normSci -> FeedItem[] (solo comunidad que cruzó)
  let _initPromise = null;

  // ── Normalización de nombre científico para el cruce con el catálogo ──
  function normSci(s) {
    return (s || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s+(sp|spp|cf|aff|indet)\.?(\s+\d+)?$/i, '')
      .trim();
  }
  // Identificado solo a género/familia → no sirve para cruzar con una especie
  function isGenusOnly(s) {
    const n = (s || '').trim();
    if (!n || !/\s/.test(n)) return true;
    return /\bsp\.?\s*\d*$/i.test(n) || /\bindet\.?\b/i.test(n) || /^cf\.\s/i.test(n);
  }

  // getImgs — mismo criterio que comunidad/jovenes_pa_lante/galeria.js
  function getImgs(foto) {
    if (foto.fotos && foto.fotos.length) return foto.fotos;
    if (foto.foto) return [foto.foto];
    return [];
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  // Carga un índice de comunidad (meses[]) + todos sus archivos de mes.
  // Devuelve [] si algo falla, sin tumbar el resto del feed.
  async function loadCommunity(indexUrl, base) {
    try {
      const index = await fetchJson(indexUrl);
      const meses = Array.isArray(index.meses) ? index.meses : [];
      const cargas = await Promise.all(meses.map(async (m) => {
        try {
          const data = await fetchJson(base + m.archivo);
          return { mes: m, data };
        } catch (e) {
          console.warn('[FeedStore] mes omitido:', m && m.archivo, e.message);
          return null;
        }
      }));
      return cargas.filter(Boolean);
    } catch (e) {
      console.warn('[FeedStore] fuente omitida:', indexUrl, e.message);
      return [];
    }
  }

  function dateKeyOf(mesEntry) {
    // 'YYYY-MM' para meses fechados; '' para ediciones sin fecha (v0)
    return /^\d{4}-\d{2}$/.test(mesEntry.id) ? mesEntry.id : '';
  }

  async function build() {
    await DataStore.init();

    // ── 1. Catálogo propio ──────────────────────────────────
    const sciToId = {};
    const catalogo = [];
    DataStore.searchSpecies().forEach((sp) => {
      const key = normSci(sp.scientificName);
      if (key) sciToId[key] = sp.id;

      const url = DataStore.getMainPhoto(sp);
      if (!url) return; // sin foto → no entra al feed
      catalogo.push({
        source: 'catalogo',
        imgs: [url],
        ratio:  sp.mainPhotoRatio  || 1,
        width:  sp.mainPhotoWidth  || 1200,
        height: sp.mainPhotoHeight || 1200,
        titleEs: sp.nameEs,
        titleEn: sp.nameEn,
        sciName: sp.scientificName,
        group: sp.group,
        iucn: sp.iucn || '',
        endemica: !!sp.endemica,
        subregionId: '',
        subregionName: (sp.subregions && sp.subregions[0]) || '',
        subregionNames: sp.subregions || [],
        municipio: '',
        credito: '',
        cuenca: '',
        descEs: sp.descriptionEs || '',
        descEn: sp.descriptionEn || '',
        speciesId: sp.id,
        link: `especie.html?id=${sp.id}`,
        dateKey: '',
      });
    });

    // ── 2. Jóvenes pa' Lante ─────────────────────────────────
    const jplMeses = await loadCommunity(JPL_INDEX, JPL_BASE);
    const jpl = [];
    jplMeses.forEach(({ mes, data }) => {
      const dateKey = dateKeyOf(mes);
      (data.fotos || []).forEach((foto) => {
        const imgs = getImgs(foto).map((p) => JPL_BASE + p);
        if (!imgs.length) return;
        const sci = foto.especieCientifico || '';
        let speciesId = null;
        if (!isGenusOnly(sci)) {
          const hit = sciToId[normSci(sci)];
          if (hit) speciesId = hit;
        }
        jpl.push({
          source: 'jpl',
          imgs,
          ratio: 1, width: 1200, height: 1200,
          titleEs: foto.especieEs || sci || '',
          titleEn: foto.especieEn || foto.especieEs || sci || '',
          sciName: sci,
          group: foto.grupo || '',
          iucn: foto.iucn || '',
          endemica: !!foto.endemica,
          subregionId: foto.subregion || '',
          subregionName: SUBREGION_NAMES[foto.subregion] || foto.subregion || '',
          subregionNames: [],
          municipio: foto.municipio || '',
          credito: foto.credito || '',
          cuenca: '',
          descEs: foto.descripcionEs || '',
          descEn: foto.descripcionEn || '',
          speciesId,
          link: speciesId ? `especie.html?id=${speciesId}` : null,
          dateKey,
        });
      });
    });

    // ── 3. Guarda Cuencas ───────────────────────────────────
    const gcMeses = await loadCommunity(GC_INDEX, GC_BASE);
    const gc = [];
    gcMeses.forEach(({ mes, data }) => {
      const dateKey = dateKeyOf(mes);
      (data.fotos || []).forEach((foto) => {
        const imgs = getImgs(foto).map((p) => GC_BASE + p);
        if (!imgs.length) return;
        gc.push({
          source: 'gc',
          imgs,
          ratio: 16 / 9, width: 1200, height: 675,
          titleEs: foto.tituloEs || '',
          titleEn: foto.tituloEn || foto.tituloEs || '',
          sciName: '',
          group: '',
          iucn: '',
          endemica: false,
          subregionId: foto.subregion || '',
          subregionName: SUBREGION_NAMES[foto.subregion] || foto.subregion || '',
          subregionNames: [],
          municipio: foto.municipio || '',
          credito: foto.credito || '',
          cuenca: foto.cuenca || '',
          descEs: foto.descripcionEs || '',
          descEn: foto.descripcionEn || '',
          speciesId: null,
          link: null,
          dateKey,
        });
      });
    });

    _items = [...catalogo, ...jpl, ...gc];

    // Índice para especie.html (Nivel 2): solo comunidad que cruzó una especie
    _bySpecies = {};
    [...jpl, ...gc].forEach((it) => {
      if (!it.sciName || isGenusOnly(it.sciName)) return;
      const key = normSci(it.sciName);
      (_bySpecies[key] = _bySpecies[key] || []).push(it);
    });
  }

  async function init() {
    if (_initPromise) return _initPromise;
    _initPromise = build();
    return _initPromise;
  }

  // ── Consulta principal del feed ──────────────────────────
  // filtros: { source: 'all'|'jpl'|'gc'|'catalogo', group, subregion (id), query }
  function getItems({ source = 'all', group = null, subregion = null, query = null } = {}) {
    let list = (_items || []).slice();

    if (source && source !== 'all') list = list.filter((it) => it.source === source);
    if (group) list = list.filter((it) => it.group === group);
    if (subregion) {
      const name = SUBREGION_NAMES[subregion] || subregion;
      list = list.filter((it) =>
        it.subregionId === subregion || (it.subregionNames || []).includes(name)
      );
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((it) =>
        (it.titleEs && it.titleEs.toLowerCase().includes(q)) ||
        (it.titleEn && it.titleEn.toLowerCase().includes(q)) ||
        (it.sciName && it.sciName.toLowerCase().includes(q)) ||
        (it.cuenca && it.cuenca.toLowerCase().includes(q))
      );
    }

    return _interleave(list);
  }

  // Buckets por grupo (GC / sin grupo → '_gc'); dentro de cada bucket,
  // comunidad antes que catálogo y lo más nuevo primero; luego round-robin
  // entre buckets (igual que DataStore.getPhotoReel) para no dejar tramos
  // largos del mismo grupo y para que el tope alterne fuentes con la
  // comunidad más reciente arriba.
  function _interleave(list) {
    const rank = (it) => (it.source === 'catalogo' ? 1 : 0);
    const buckets = {};
    const order = [];
    list.forEach((it) => {
      const key = it.group || '_gc';
      if (!buckets[key]) { buckets[key] = []; order.push(key); }
      buckets[key].push(it);
    });
    order.forEach((key) => {
      buckets[key].sort((a, b) => {
        const r = rank(a) - rank(b);
        if (r !== 0) return r;
        return (b.dateKey || '').localeCompare(a.dateKey || '');
      });
    });

    const out = [];
    let remaining = true;
    while (remaining) {
      remaining = false;
      for (const key of order) {
        const bucket = buckets[key];
        if (bucket && bucket.length) {
          out.push(bucket.shift());
          if (bucket.length) remaining = true;
        }
      }
    }
    return out;
  }

  // ── Nivel 2: fotos de comunidad que corresponden a una especie ──
  function getCommunityForSpecies(scientificName) {
    if (!_items) return [];
    const key = normSci(scientificName);
    if (!key) return [];
    return (_bySpecies[key] || []).slice();
  }

  return { init, getItems, getCommunityForSpecies };
})();
