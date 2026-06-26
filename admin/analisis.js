checkAuth();

const TAXON_COLORS = {
  Aves:           '#1976D2',
  Amphibia:       '#388E3C',
  Reptilia:       '#F57C00',
  Mammalia:       '#7B1FA2',
  Actinopterygii: '#0097A7',
  Insecta:        '#FBC02D',
  Arachnida:      '#795548',
  Plantae:        '#558B2F',
  Fungi:          '#D84315',
  default:        '#607D8B',
};
const TAXON_LABELS = {
  Aves:           '🦜 Aves',
  Amphibia:       '🐸 Anfibios',
  Reptilia:       '🦎 Reptiles',
  Mammalia:       '🦌 Mamíferos',
  Actinopterygii: '🐟 Peces',
  Insecta:        '🦋 Insectos',
  Arachnida:      '🕷 Arácnidos',
  Plantae:        '🌿 Plantas',
  Fungi:          '🍄 Hongos',
  default:        '• Otros',
};

const IUCN_COLORS = {
  CR: '#7b1fa2', EN: '#d32f2f', VU: '#e65100',
  NT: '#f9a825', LC: '#2e7d32', DD: '#757575',
};
const IUCN_LABELS = {
  CR: 'Peligro crítico', EN: 'En peligro', VU: 'Vulnerable',
  NT: 'Casi amenazada', LC: 'Preocupación menor', DD: 'Sin evaluación',
};
const SUBREGION_NAMES = {
  uraba: 'Urabá', oriente: 'Oriente', nordeste: 'Nordeste',
  magdalena_medio: 'Magdalena Medio', occidente: 'Occidente', norte: 'Norte',
  bajo_cauca: 'Bajo Cauca', suroeste: 'Suroeste', valle_aburra: 'Valle de Aburrá',
};
const GROUP_LABELS = {
  anfibios_reptiles: '🐸 Anfibios y Reptiles',
  peces:             '🐟 Peces de Agua Dulce',
};
const MESES_ES  = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_ABR = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const JPL_BASE  = '/comunidad/jovenes_pa_lante/';

function animateCount(el, target, duration = 700) {
  if (!el) return;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString('es-CO');
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

(function setDate() {
  const el = document.getElementById('reportDate');
  if (el) el.textContent = `Actualizado a ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}`;
})();

// ── Render: mapa de calor municipal ────────────────────────
function renderHeatmap(municipios) {
  const el = document.getElementById('heatmap');
  if (!el || !municipios.length) return;

  const maxFotos = Math.max(...municipios.map(m => m.fotos), 1);

  // Agrupar por subregión
  const bySubreg = {};
  municipios.forEach(m => {
    const key = m.subregion || 'otras';
    if (!bySubreg[key]) bySubreg[key] = [];
    bySubreg[key].push(m);
  });

  const subregOrder = [
    'valle_aburra','oriente','norte','occidente','suroeste',
    'nordeste','bajo_cauca','magdalena_medio','uraba','otras',
  ];

  el.innerHTML = subregOrder
    .filter(s => bySubreg[s])
    .map(s => {
      const muns = bySubreg[s].sort((a, b) => b.fotos - a.fotos);
      const cells = muns.map(m => {
        const intensity = 0.35 + (m.fotos / maxFotos) * 0.65;
        const bg        = `rgba(1,141,56,${intensity.toFixed(2)})`;
        const amenBadge = m.amenazadas > 0
          ? `<span class="heatmap-cell__badge" style="background:rgba(211,47,47,.85)">⚠ ${m.amenazadas}</span>`
          : '';
        return `
          <div class="heatmap-cell" style="background:${bg}" title="${m.fotos} registros · ${m.especies} especies">
            <span class="heatmap-cell__name">${m.municipio}</span>
            <span class="heatmap-cell__count">${m.fotos}</span>
            ${amenBadge}
          </div>`;
      }).join('');
      return `
        <div class="heatmap-row">
          <div class="heatmap-row__label">${SUBREGION_NAMES[s] || s}</div>
          <div class="heatmap-row__cells">${cells}</div>
        </div>`;
    }).join('');
}

// ── Render: fotógrafos por subregión ───────────────────────
function renderFotografos(fotografos) {
  const el = document.getElementById('fotografos-bars');
  if (!el || !fotografos.length) return;
  const max = Math.max(...fotografos.map(f => f.count), 1);
  el.innerHTML = fotografos.map(f => `
    <div class="fotograf-row">
      <div class="fotograf-row__main">
        <div class="fotograf-row__label">${SUBREGION_NAMES[f.subregion] || f.subregion}</div>
        <div class="fotograf-row__track">
          <div class="fotograf-row__fill" data-w="${(f.count / max * 100).toFixed(1)}" style="width:0%"></div>
        </div>
        <div class="fotograf-row__count">${f.count}</div>
      </div>
      <div class="fotograf-row__names">${f.nombres.join(' · ')}</div>
    </div>`).join('');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.querySelectorAll('.fotograf-row__fill[data-w]').forEach(bar => {
      bar.style.width = bar.dataset.w + '%';
    });
  }));
}

// ── Render: cobertura municipal ─────────────────────────────
function renderMunicipios(municipios) {
  const table = document.getElementById('municipios-table');
  const empty = document.getElementById('municipios-empty');
  if (!table) return;
  if (!municipios.length) {
    table.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  table.innerHTML = `
    <thead>
      <tr>
        <th>Municipio</th>
        <th>Subregión</th>
        <th>Registros</th>
        <th>Especies únicas</th>
        <th>Amenazadas</th>
      </tr>
    </thead>
    <tbody>
      ${municipios.map(m => `
        <tr>
          <td style="font-weight:600">${m.municipio}</td>
          <td>${SUBREGION_NAMES[m.subregion] || m.subregion || '—'}</td>
          <td>${m.fotos}</td>
          <td>${m.especies}</td>
          <td style="color:${m.amenazadas > 0 ? '#d32f2f' : 'var(--muted)'};font-weight:${m.amenazadas > 0 ? '700' : '400'}">
            ${m.amenazadas > 0 ? m.amenazadas : '—'}
          </td>
        </tr>`).join('')}
    </tbody>`;
}

// ── Render: alertas CR / EN ─────────────────────────────────
function renderAlertas(alertas) {
  const grid  = document.getElementById('alertas-grid');
  const empty = document.getElementById('alertas-empty');
  if (!grid) return;
  if (!alertas.length) {
    grid.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  grid.innerHTML = alertas.map(sp => {
    const [y, m] = (sp.mes || '').split('-');
    const mesLabel = m ? `${MESES_ES[+m]} ${y}` : '';
    const imgSrc   = sp.foto ? `${JPL_BASE}${sp.foto}` : '';
    return `
      <div class="notable-card">
        <div class="notable-card__img-wrap">
          ${imgSrc
            ? `<img class="notable-card__img" src="${imgSrc}" alt="${sp.es || ''}" onerror="this.style.display='none'">`
            : ''}
          <div class="notable-card__iucn-pill" style="background:${IUCN_COLORS[sp.iucn]}">
            ${sp.iucn} — ${IUCN_LABELS[sp.iucn]}
          </div>
          <div class="notable-card__badge">⚠ Alerta prioritaria</div>
        </div>
        <div class="notable-card__body">
          <div class="notable-card__sci">${sp.sci || ''}</div>
          <div class="notable-card__name">${sp.es || '—'}</div>
          <div class="notable-card__desc">
            📍 ${[sp.municipio, SUBREGION_NAMES[sp.subregion] || sp.subregion].filter(Boolean).join(' · ')}
            ${sp.endemica ? '<br>🏔️ <em>Especie endémica</em>' : ''}
            ${mesLabel   ? `<br>📅 Registrada en ${mesLabel}` : ''}
          </div>
          <div class="notable-card__credit">📷 ${sp.credito || '—'}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Render: bioindicadores hídricos ────────────────────────
function renderBio(bio) {
  const table = document.getElementById('bio-table');
  const empty = document.getElementById('bio-empty');
  if (!table) return;
  if (!bio.length) {
    table.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  table.innerHTML = `
    <thead>
      <tr>
        <th>Grupo</th>
        <th>Nombre científico</th>
        <th>Nombre común</th>
        <th>IUCN</th>
        <th>Municipio</th>
        <th>Subregión</th>
        <th>Endémica</th>
        <th>Mes</th>
      </tr>
    </thead>
    <tbody>
      ${bio.map(f => {
        const [y, m] = (f.mes || '').split('-');
        return `
          <tr>
            <td>${GROUP_LABELS[f.grupo] || f.grupo}</td>
            <td><em>${f.sci || '—'}</em></td>
            <td>${f.es || '—'}</td>
            <td>
              <span class="iucn-dot" style="background:${IUCN_COLORS[f.iucn] || '#999'}">${f.iucn || '—'}</span>
              &nbsp;<small style="color:${IUCN_COLORS[f.iucn] || '#999'};font-weight:600">${IUCN_LABELS[f.iucn] || ''}</small>
            </td>
            <td>${f.municipio || '—'}</td>
            <td>${SUBREGION_NAMES[f.subregion] || f.subregion || '—'}</td>
            <td style="text-align:center">${f.endemica ? '🏔️' : '—'}</td>
            <td style="font-size:11px">${m ? `${MESES_ABR[+m]} ${y}` : '—'}</td>
          </tr>`;
      }).join('')}
    </tbody>`;
}

// ── iNaturalist charts ──────────────────────────────────────

function pointInRing(pt, ring) {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function obsToSubregion(lat, lng) {
  if (typeof SUBREGIONES_GEOJSON === 'undefined') return null;
  const pt = [lng, lat];
  for (const feat of SUBREGIONES_GEOJSON.features) {
    const geom = feat.geometry;
    const outerRings = geom.type === 'Polygon'
      ? [geom.coordinates[0]]
      : geom.coordinates.map(p => p[0]);
    if (outerRings.some(r => pointInRing(pt, r))) return feat.properties.name;
  }
  return null;
}

function renderInatBarList(containerId, loadingId, items, colorFn) {
  const el = document.getElementById(containerId);
  const ld = document.getElementById(loadingId);
  if (ld) ld.style.display = 'none';
  if (!el || !items.length) return;
  const max = Math.max(...items.map(x => x.count), 1);
  el.innerHTML = items.map(item => `
    <div class="fotograf-row">
      <div class="fotograf-row__main" style="grid-template-columns:200px 1fr 56px">
        <div class="fotograf-row__label" style="font-size:11px;line-height:1.3">${item.label}</div>
        <div class="fotograf-row__track">
          <div class="fotograf-row__fill"
               style="width:0%;background:${colorFn(item)}"
               data-w="${(item.count / max * 100).toFixed(1)}"></div>
        </div>
        <div class="fotograf-row__count">${item.count.toLocaleString('es-CO')}</div>
      </div>
    </div>`).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.querySelectorAll('.fotograf-row__fill[data-w]').forEach(b => {
      b.style.width = b.dataset.w + '%';
    });
  }));
}

function renderInatSubregiones(counts) {
  const colorMap = {};
  if (typeof SUBREGIONES_GEOJSON !== 'undefined') {
    SUBREGIONES_GEOJSON.features.forEach(f => { colorMap[f.properties.name] = f.properties.color; });
  }
  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ label: name, count, name }));
  renderInatBarList('inat-subs-bars', 'inat-subs-loading', items,
    item => colorMap[item.name] || '#018d38');
}

function renderInatEspecies(results) {
  const items = results.map(r => ({
    label: r.taxon.preferred_common_name
      ? `${r.taxon.preferred_common_name} <em style="font-size:9px;color:var(--muted)">${r.taxon.name}</em>`
      : `<em>${r.taxon.name}</em>`,
    count: r.count,
    taxon: r.taxon.iconic_taxon_name,
  }));
  renderInatBarList('inat-spp-bars', 'inat-spp-loading', items,
    item => TAXON_COLORS[item.taxon] || TAXON_COLORS.default);

  // Leyenda: solo los grupos que aparecen en los resultados
  const legendEl = document.getElementById('inat-spp-legend');
  if (!legendEl) return;
  const seenTaxa = [...new Set(items.map(i => i.taxon || 'default'))].sort();
  legendEl.innerHTML = seenTaxa.map(k => `
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#1a1a2e;font-weight:500">
      <span style="width:11px;height:11px;border-radius:50%;background:${TAXON_COLORS[k] || TAXON_COLORS.default};flex-shrink:0;display:inline-block"></span>
      ${TAXON_LABELS[k] || k}
    </div>`).join('');
}

function renderInatObservadores(results) {
  const items = results.map(r => ({
    label: r.user.name
      ? `${r.user.name} <small style="color:var(--muted);font-weight:400">@${r.user.login}</small>`
      : `@${r.user.login}`,
    count: r.observation_count,
  }));
  renderInatBarList('inat-obs-bars', 'inat-obs-loading', items, () => '#018d38');
}

async function loadInatCharts() {
  const PROJ = 'jovenes-palante-con-el-ambiente';
  const BASE = 'https://api.inaturalist.org/v1';

  // Species counts and observers in parallel (total from API, not a sample)
  const [sppData, pplData] = await Promise.all([
    fetch(`${BASE}/observations/species_counts?project_id=${PROJ}&per_page=20&locale=es`).then(r => r.json()),
    fetch(`${BASE}/observations/observers?project_id=${PROJ}&per_page=20`).then(r => r.json()),
  ]);
  if (sppData.results?.length) renderInatEspecies(sppData.results);
  if (pplData.results?.length) renderInatObservadores(pplData.results);

  // 3 pages of geolocated obs → point-in-polygon → subregion counts
  const pages = await Promise.all(
    [1, 2, 3].map(p =>
      fetch(`${BASE}/observations?project_id=${PROJ}&per_page=200&page=${p}&has%5B%5D=geo&order=desc&order_by=created_at`)
        .then(r => r.json())
    )
  );
  const counts = {};
  pages.forEach(d => {
    (d.results || []).forEach(o => {
      let lat = parseFloat(o.latitude);
      let lng = parseFloat(o.longitude);
      if ((isNaN(lat) || isNaN(lng)) && o.location) {
        const [a, b] = o.location.split(',');
        lat = parseFloat(a); lng = parseFloat(b);
      }
      if (isNaN(lat) || isNaN(lng)) return;
      const sr = obsToSubregion(lat, lng);
      if (sr) counts[sr] = (counts[sr] || 0) + 1;
    });
  });
  if (Object.keys(counts).length) renderInatSubregiones(counts);
  else {
    const ld = document.getElementById('inat-subs-loading');
    if (ld) ld.textContent = 'Sin datos de subregión disponibles.';
  }
}

// ── Init ────────────────────────────────────────────────────
async function loadAnalytics() {
  const data = await api.jplStatsAnalytics();

  animateCount(document.getElementById('a-fotografos'),  data.totalFotografos);
  animateCount(document.getElementById('a-municipios'),  data.municipiosCubiertos);
  animateCount(document.getElementById('a-subregiones'), data.subregionesCubiertas);

  renderHeatmap(data.municipios);
  renderFotografos(data.fotografos);
  renderMunicipios(data.municipios);
  renderAlertas(data.alertas);
  renderBio(data.bioindicadores);
}

window.addEventListener('DOMContentLoaded', () => {
  loadAnalytics().catch(err => console.warn('analisis error', err));
  loadInatCharts().catch(err => console.warn('inat charts error', err));
});
