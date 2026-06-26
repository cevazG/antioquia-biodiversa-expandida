// ── Auth ──────────────────────────────────────────────────
checkAuth();

// ── Constants ─────────────────────────────────────────────
const INAT_PROJECT = 'jovenes-palante-con-el-ambiente';

const IUCN_COLORS = {
  CR: '#7b1fa2', EN: '#d32f2f', VU: '#e65100',
  NT: '#f9a825', LC: '#2e7d32', DD: '#757575', NE: '#9e9e9e',
};
const IUCN_LABELS = {
  CR: 'Peligro crítico', EN: 'En peligro', VU: 'Vulnerable',
  NT: 'Casi amenazada', LC: 'Preocupación menor', DD: 'Sin evaluación', NE: 'No evaluada',
};
const GROUP_NAMES = {
  polillas: 'Polillas', mariposas: 'Mariposas', mamiferos: 'Mamíferos',
  anfibios_reptiles: 'Anfibios y Reptiles', orquideas: 'Orquídeas', aves: 'Aves',
  peces: 'Peces', arboles_nativos: 'Árboles Nativos', animales_domesticos: 'Animales Domésticos',
};
const GROUP_EMOJI = {
  polillas: '🦗', mariposas: '🦋', mamiferos: '🦌',
  anfibios_reptiles: '🐸', orquideas: '🌸', aves: '🦜',
  peces: '🐟', arboles_nativos: '🌳', animales_domesticos: '🐄',
};
const SUBREGION_NAMES = {
  uraba: 'Urabá', oriente: 'Oriente', nordeste: 'Nordeste',
  magdalena_medio: 'Magdalena Medio', occidente: 'Occidente', norte: 'Norte',
  bajo_cauca: 'Bajo Cauca', suroeste: 'Suroeste', valle_aburra: 'Valle de Aburrá',
};

// Hardcoded de IMPACTO.md — datos verificados, no cambian con el tiempo
const NOTABLE_SPECIES = [
  {
    sci:         'Crax alberti',
    es:          'Paujil piquiazul',
    iucn:        'CR',
    credito:     'Amarelis Orozco',
    municipio:   'Maceo',
    subregion:   'Magdalena Medio',
    foto:        '/comunidad/jovenes_pa_lante/img/fotos/bio/v0/Crax alberti-Amarelis Orozco-AMENAZADA (VU)Las brisas-Maceo.webp',
    descripcion: 'Una de las aves más amenazadas del norte de Colombia, con poblaciones en grave declive por la deforestación. Su registro en Maceo por una participante del programa es un avistamiento de alto valor para el monitoreo de la especie a nivel nacional.',
    badge:       'Registro de alto valor científico',
    endemica:    true,
  },
  {
    sci:         'Agalychnis terranova',
    es:          'Rana de ojos rojos de Terranova',
    iucn:        'EN',
    credito:     'Breiner Ferney Jimenez',
    municipio:   'San Francisco',
    subregion:   'Oriente',
    foto:        '/comunidad/jovenes_pa_lante/img/fotos/bio/v0/Agalychnis_terranova-ENDÉMICA-Breiner Ferney Jimenez-La Cristalina-SanFrancisco.webp',
    descripcion: 'Especie endémica de Antioquia descrita formalmente en 2004. Sus ojos rojos le permiten deslumbrar a los depredadores nocturnos. Depende de quebradas de agua limpia en bosques conservados del Oriente antioqueño — un indicador directo de calidad ambiental.',
    badge:       'Endémica de Antioquia · descrita en 2004',
    endemica:    true,
  },
  {
    sci:         'Oedipomidas leucopus',
    es:          'Tití pielroja',
    iucn:        'VU',
    credito:     'Marlyn Carolina Giraldo Ospina',
    municipio:   'San Carlos',
    subregion:   'Oriente',
    foto:        '/comunidad/jovenes_pa_lante/img/fotos/bio/v0/Oedipomidas leucopus-ENDÉMICA-Marlyn Carolina Giraldo Ospina-Pio XII-San Carlos.webp',
    descripcion: 'Primate endémico de Colombia, especialista en bosques fragmentados del Oriente antioqueño. Dispersa semillas de más de 80 especies vegetales, siendo fundamental para la regeneración del bosque. Su presencia indica ecosistemas en proceso de recuperación.',
    badge:       'Primate endémico · dispersor de semillas',
    endemica:    true,
  },
];

// Tabla completa de amenazadas (de fotos_v0.json, verificado)
const THREATENED_SPECIES = [
  { sci: 'Crax alberti',              es: 'Paujil piquiazul',                      iucn: 'CR', municipio: 'Maceo',         credito: 'Amarelis Orozco',                  endemica: true  },
  { sci: 'Agalychnis terranova',       es: 'Rana de ojos rojos de Terranova',       iucn: 'EN', municipio: 'San Francisco', credito: 'Breiner Ferney Jimenez',           endemica: true  },
  { sci: 'Rulyrana susatamai',         es: 'Rana de cristal del Susatama',          iucn: 'EN', municipio: 'Santo Domingo', credito: 'Diana Marcela Osorio',             endemica: true  },
  { sci: 'Andinobates opisthomelas',   es: 'Rana venenosa de Antioquia',            iucn: 'VU', municipio: 'San Carlos',    credito: 'Sebastian Parra',                  endemica: true  },
  { sci: 'Brycon henni',               es: 'Sabaleta',                              iucn: 'VU', municipio: 'Alejandría',    credito: 'Diomedes Velasquez',               endemica: true  },
  { sci: 'Hypopyrrhus pyrohypogaster', es: 'Cacique candela',                       iucn: 'VU', municipio: 'Alejandría',    credito: 'Cindy Noreidy Echeverry',          endemica: true  },
  { sci: 'Oedipomidas leucopus',       es: 'Tití pielroja',                         iucn: 'VU', municipio: 'San Carlos',    credito: 'Marlyn Carolina Giraldo Ospina',   endemica: true  },
];

// ── Utility ────────────────────────────────────────────────
function animateCount(el, target, duration = 1500) {
  if (!el) return;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
    el.textContent = v.toLocaleString('es-CO');
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function iucnBadge(code) {
  return `<span class="iucn-dot" style="background:${IUCN_COLORS[code] || '#999'}">${code}</span>`;
}

// ── Date ───────────────────────────────────────────────────
(function setDates() {
  const now   = new Date();
  const label = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
  const el    = document.getElementById('reportDate');
  const el2   = document.getElementById('footerDate');
  if (el)  el.textContent  = `Datos actualizados a ${label}`;
  if (el2) el2.textContent = label;
})();

// ── iNaturalist ────────────────────────────────────────────
async function loadInat() {
  const FALLBACK = { obs: 57843, spp: 4698, ppl: 473 };
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 7000);

    const [projRes, obsRes] = await Promise.all([
      fetch(`https://api.inaturalist.org/v1/projects/${INAT_PROJECT}`, { signal: ctrl.signal }).then(r => r.json()),
      fetch(`https://api.inaturalist.org/v1/observations/observers?project_id=${INAT_PROJECT}&per_page=1`, { signal: ctrl.signal }).then(r => r.json()),
    ]);

    const obs  = projRes.results?.[0]?.observations_count ?? FALLBACK.obs;
    const spp  = projRes.results?.[0]?.taxa_count          ?? FALLBACK.spp;
    const ppl  = obsRes.total_results                      ?? FALLBACK.ppl;

    animateCount(document.getElementById('inat-obs'), obs);
    animateCount(document.getElementById('inat-spp'), spp);
    animateCount(document.getElementById('inat-ppl'), ppl);
  } catch {
    animateCount(document.getElementById('inat-obs'), FALLBACK.obs);
    animateCount(document.getElementById('inat-spp'), FALLBACK.spp);
    animateCount(document.getElementById('inat-ppl'), FALLBACK.ppl);
  }
}

// ── Species catalog ────────────────────────────────────────
async function loadSpeciesCatalog() {
  try {
    const data = await fetch('../biodiversidad/data/species.json').then(r => r.json());

    const byGroup  = {};
    const families = new Set();
    let   photos   = 0;

    data.species.forEach(sp => {
      byGroup[sp.group] = (byGroup[sp.group] || 0) + 1;
      families.add(sp.familyId);
      (sp.photos || []).forEach(p => {
        const url = typeof p === 'string' ? p : p.url;
        if (url && !url.startsWith('placeholder')) photos++;
      });
    });

    const total = data.species.length;
    animateCount(document.getElementById('bio-grupos'),   Object.keys(byGroup).length, 800);
    animateCount(document.getElementById('bio-familias'), families.size,                800);
    animateCount(document.getElementById('bio-especies'), total,                        1000);
    animateCount(document.getElementById('bio-fotos'),    photos,                       1000);

    // Bar chart
    const sorted = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
    const max    = sorted[0]?.[1] || 1;
    const bars   = document.getElementById('group-bars');
    if (bars) {
      bars.innerHTML = sorted.map(([g, n]) => `
        <div class="bar-row">
          <div class="bar-label">${GROUP_EMOJI[g] || '🌿'} ${GROUP_NAMES[g] || g}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(n / max * 100).toFixed(1)}%;background:var(--green)"></div>
          </div>
          <div class="bar-value">${n}</div>
        </div>`).join('');
    }
  } catch (err) {
    console.warn('species.json no disponible', err);
  }
}

// ── JPL v0 stats ───────────────────────────────────────────
async function loadJplStats() {
  try {
    const data  = await fetch('../comunidad/jovenes_pa_lante/data/fotos_v0.json').then(r => r.json());
    const fotos = data.fotos || [];

    // IUCN counts
    const byIucn    = {};
    let   endemicas = 0;
    const subregSet = new Set();

    fotos.forEach(f => {
      byIucn[f.iucn]     = (byIucn[f.iucn] || 0) + 1;
      if (f.endemica)    endemicas++;
      if (f.subregion)   subregSet.add(f.subregion);
    });

    const total     = fotos.length;
    const amenazadas = (byIucn.CR || 0) + (byIucn.EN || 0) + (byIucn.VU || 0);
    const pctThreat  = Math.round(amenazadas / total * 100);
    const pctEnd     = Math.round(endemicas  / total * 100);

    // Update KPIs
    animateCount(document.getElementById('jpl-fotos'), total, 800);
    const pctEl = document.getElementById('jpl-pct-threat');
    if (pctEl) animateCount(pctEl, pctThreat, 1000);
    else document.getElementById('jpl-pct-threat').textContent = pctThreat + '%';

    const endEl = document.getElementById('jpl-endemicas');
    if (endEl) { endEl.dataset.pct = pctEnd; endEl.textContent = pctEnd + '%'; }

    animateCount(document.getElementById('jpl-amenazadas'), amenazadas, 800);

    // IUCN bars
    const iucnOrder = ['CR','EN','VU','NT','LC','DD'];
    const iucnEl    = document.getElementById('iucn-bars');
    if (iucnEl) {
      iucnEl.innerHTML = iucnOrder
        .filter(k => byIucn[k])
        .map(k => {
          const n   = byIucn[k];
          const pct = (n / total * 100).toFixed(0);
          return `
            <div class="iucn-row">
              <div class="iucn-badge" style="background:${IUCN_COLORS[k]}">${k}</div>
              <div class="iucn-count">${n}</div>
              <div class="iucn-track">
                <div class="iucn-fill" style="width:${pct}%;background:${IUCN_COLORS[k]}"></div>
              </div>
              <div class="iucn-pct">${pct}%</div>
            </div>`;
        }).join('');
    }

    // Subregion pills (JPL v0 coverage)
    const allSubs = ['uraba','oriente','nordeste','magdalena_medio','norte','occidente','bajo_cauca','suroeste','valle_aburra'];
    const pillEl  = document.getElementById('subregion-pills');
    if (pillEl) {
      pillEl.innerHTML = allSubs.map(s =>
        subregSet.has(s)
          ? `<span class="subregion-pill subregion-pill--active">✓ ${SUBREGION_NAMES[s]}</span>`
          : `<span class="subregion-pill subregion-pill--inactive">◌ ${SUBREGION_NAMES[s]}</span>`
      ).join('');
    }
  } catch (err) {
    console.warn('fotos_v0.json no disponible', err);
  }
}

// ── Notable species cards ──────────────────────────────────
function renderNotableCards() {
  const grid = document.getElementById('notable-grid');
  if (!grid) return;
  grid.innerHTML = NOTABLE_SPECIES.map(sp => `
    <div class="notable-card">
      <div class="notable-card__img-wrap">
        <img class="notable-card__img"
             src="${sp.foto}"
             alt="${sp.es}"
             onerror="this.style.display='none'">
        <div class="notable-card__iucn-pill" style="background:${IUCN_COLORS[sp.iucn]}">
          ${sp.iucn} — ${IUCN_LABELS[sp.iucn]}
        </div>
        <div class="notable-card__badge">${sp.badge}</div>
      </div>
      <div class="notable-card__body">
        <div class="notable-card__sci">${sp.sci}</div>
        <div class="notable-card__name">${sp.es}</div>
        <div class="notable-card__desc">${sp.descripcion}</div>
        <div class="notable-card__credit">
          📷 ${sp.credito} · ${sp.municipio}, ${sp.subregion}
          ${sp.endemica ? ' &nbsp;🏔️ <em>Endémica</em>' : ''}
        </div>
      </div>
    </div>`).join('');
}

// ── Threat table ───────────────────────────────────────────
function renderThreatTable() {
  const table = document.getElementById('threat-table');
  if (!table) return;
  table.innerHTML = `
    <thead>
      <tr>
        <th>Estado IUCN</th>
        <th>Nombre científico</th>
        <th>Nombre común</th>
        <th>Municipio</th>
        <th>Participante</th>
        <th>Endémica</th>
      </tr>
    </thead>
    <tbody>
      ${THREATENED_SPECIES.map(sp => `
        <tr>
          <td>${iucnBadge(sp.iucn)}&nbsp;<small style="color:${IUCN_COLORS[sp.iucn]};font-weight:600">${IUCN_LABELS[sp.iucn]}</small></td>
          <td><em>${sp.sci}</em></td>
          <td>${sp.es}</td>
          <td>${sp.municipio}</td>
          <td style="font-size:11px">${sp.credito}</td>
          <td style="text-align:center">${sp.endemica ? '🏔️' : '—'}</td>
        </tr>`).join('')}
    </tbody>`;
}

// ── Init ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  renderNotableCards();
  renderThreatTable();

  // Load async data in parallel
  Promise.all([
    loadInat(),
    loadSpeciesCatalog(),
    loadJplStats(),
  ]);
});
