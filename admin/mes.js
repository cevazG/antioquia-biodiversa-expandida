checkAuth();

const IUCN_COLORS = {
  CR: '#7b1fa2', EN: '#d32f2f', VU: '#e65100',
  NT: '#f9a825', LC: '#2e7d32', DD: '#757575',
};
const GROUP_NAMES = {
  aves: 'Aves', mariposas: 'Mariposas', polillas: 'Polillas',
  anfibios_reptiles: 'Anfibios y Reptiles', mamiferos: 'Mamíferos',
  orquideas: 'Orquídeas', peces: 'Peces', arboles_nativos: 'Árboles Nativos',
  animales_domesticos: 'Animales Domésticos',
};
const GROUP_EMOJI = {
  aves: '🦜', mariposas: '🦋', polillas: '🦗',
  anfibios_reptiles: '🐸', mamiferos: '🦌',
  orquideas: '🌸', peces: '🐟', arboles_nativos: '🌳',
  animales_domesticos: '🐄',
};
const MESES_ES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const JPL_BASE = '/comunidad/jovenes_pa_lante/';

function animateCount(el, target, duration = 600) {
  if (!el) return;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString('es-CO');
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function renderStats(fotos) {
  const especiesSet = new Set(fotos.map(f => f.especieCientifico).filter(Boolean));
  const subregSet   = new Set(fotos.map(f => f.subregion).filter(Boolean));
  const amenazadas  = fotos.filter(f => ['CR','EN','VU'].includes(f.iucn)).length;
  const endemicas   = fotos.filter(f => f.endemica).length;

  animateCount(document.getElementById('m-fotos'),       fotos.length);
  animateCount(document.getElementById('m-especies'),    especiesSet.size);
  animateCount(document.getElementById('m-amenazadas'),  amenazadas);
  animateCount(document.getElementById('m-endemicas'),   endemicas);
  animateCount(document.getElementById('m-subregiones'), subregSet.size);

  // IUCN bars
  const byIucn = {};
  fotos.forEach(f => { byIucn[f.iucn] = (byIucn[f.iucn] || 0) + 1; });
  const iucnEl  = document.getElementById('m-iucn-bars');
  const iucnOrd = ['CR','EN','VU','NT','LC','DD'];
  if (iucnEl) {
    const rows = iucnOrd.filter(k => byIucn[k]).map(k => {
      const n   = byIucn[k];
      const pct = (n / fotos.length * 100).toFixed(0);
      return `
        <div class="iucn-row">
          <div class="iucn-badge" style="background:${IUCN_COLORS[k]}">${k}</div>
          <div class="iucn-count">${n}</div>
          <div class="iucn-track">
            <div class="iucn-fill" style="width:${pct}%;background:${IUCN_COLORS[k]}"></div>
          </div>
          <div class="iucn-pct">${pct}%</div>
        </div>`;
    });
    iucnEl.innerHTML = rows.length
      ? rows.join('')
      : '<span style="color:var(--muted);font-size:12px">Sin datos</span>';
  }

  // Grupos
  const byGroup = {};
  fotos.forEach(f => { if (f.grupo) byGroup[f.grupo] = (byGroup[f.grupo] || 0) + 1; });
  const sorted  = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
  const maxG    = sorted[0]?.[1] || 1;
  const groupEl = document.getElementById('m-group-bars');
  if (groupEl) {
    groupEl.innerHTML = sorted.length
      ? sorted.map(([g, n]) => `
          <div class="bar-row">
            <div class="bar-label">${GROUP_EMOJI[g] || '🌿'} ${GROUP_NAMES[g] || g}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(n / maxG * 100).toFixed(1)}%;background:var(--green)"></div>
            </div>
            <div class="bar-value">${n}</div>
          </div>`).join('')
      : '<span style="color:var(--muted);font-size:12px">Sin datos</span>';
  }
}

function renderGrid(fotos) {
  const grid  = document.getElementById('mes-grid');
  const empty = document.getElementById('mes-empty');
  if (!grid) return;

  if (!fotos.length) {
    grid.style.display  = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  grid.style.display  = '';
  if (empty) empty.style.display = 'none';

  grid.innerHTML = fotos.map(f => {
    const imgPath   = f.fotos?.[0] || f.foto || '';
    const imgSrc    = imgPath ? `${JPL_BASE}${imgPath}` : '';
    const iucnColor = IUCN_COLORS[f.iucn] || '#999';
    return `
      <div class="mes-photo-card">
        <div class="mes-photo-card__img-wrap">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="${f.especieEs || ''}" loading="lazy" onerror="this.style.display='none'">`
            : ''}
          <div class="mes-photo-card__iucn" style="background:${iucnColor}">${f.iucn || '—'}</div>
          ${f.endemica ? '<div class="mes-photo-card__endemic">🏔️</div>' : ''}
        </div>
        <div class="mes-photo-card__body">
          <div class="mes-photo-card__name">${f.especieEs || '—'}</div>
          <div class="mes-photo-card__sci">${f.especieCientifico || ''}</div>
          <div class="mes-photo-card__meta">${[f.municipio, f.subregion].filter(Boolean).join(' · ')}</div>
          ${f.credito ? `<div class="mes-photo-card__credit">📷 ${f.credito}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

async function loadMes(mes) {
  const [y, m] = mes.split('-');
  const labelEl = document.getElementById('kpi-label');
  if (labelEl) labelEl.textContent = `${MESES_ES[+m]} ${y}`;

  const fotos = await api.jplFotos(mes);
  renderStats(fotos);
  renderGrid(fotos);
}

async function init() {
  const meses  = await api.jplMeses();
  const select = document.getElementById('mesSelect');
  if (!select) return;

  if (!meses.length) {
    select.innerHTML = '<option value="">Sin meses disponibles</option>';
    return;
  }

  select.innerHTML = meses.map(m => {
    const [y, mo] = m.split('-');
    return `<option value="${m}">${MESES_ES[+mo]} ${y}</option>`;
  }).join('');

  select.addEventListener('change', () => {
    if (select.value) loadMes(select.value).catch(console.warn);
  });

  await loadMes(meses[0]);
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch(err => console.warn('mes error', err));
});
