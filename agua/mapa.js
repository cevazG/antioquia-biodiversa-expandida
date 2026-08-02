I18n.init().then(() => { if (window.__cuencasData) renderChips(window.__cuencasData); });
document.addEventListener('langchange', () => { if (window.__cuencasData) { renderChips(window.__cuencasData); renderLegend(); } });

// Paleta por zona hidrográfica (nivel 2 de la clasificación oficial IDEAM).
// Colores vivos: solo para relleno/trazo del mapa (no hay texto encima, no aplica WCAG).
const COLOR_ZONA = {
  'Cauca':               '#1a6fb0',
  'Nechí':                '#0d8f8f',
  'Medio Magdalena':      '#5b3fa8',
  'Atrato - Darién':      '#1a8f4c',
  'Caribe - Urabá':       '#c4780c',
};
// Variante oscurecida: para texto y fondos sólidos con texto blanco (chips, badges).
// Nechí/Atrato-Darién/Caribe-Urabá originales daban 3.48-4.14:1 sobre blanco, no alcanzan WCAG AA (4.5:1).
const COLOR_ZONA_TEXTO = {
  'Cauca':               '#1a6fb0',
  'Nechí':                '#0c8282',
  'Medio Magdalena':      '#5b3fa8',
  'Atrato - Darién':      '#188647',
  'Caribe - Urabá':       '#a7660a',
};
const COLOR_DEFAULT = '#3561ab';

function colorFor(cuenca) {
  return COLOR_ZONA[cuenca.zona_hidrografica] || COLOR_DEFAULT;
}
function colorForTexto(cuenca) {
  return COLOR_ZONA_TEXTO[cuenca.zona_hidrografica] || COLOR_DEFAULT;
}

// ── Estado ────────────────────────────────────────────────────────────
let layerMode = 'todo';           // 'todo' (ríos + áreas) | 'rios' (solo ríos)
const visibleCuencas = new Set(); // ids visibles — todas al inicio
const layersByCuenca = {};        // id -> { area: L.GeoJSON|null, linea: L.GeoJSON|null }

// Inicializar mapa centrado en Antioquia
const map = L.map('map', { zoomControl: false });
map.fitBounds([[5.35, -77.2], [8.95, -73.85]]);
setTimeout(() => { if (window.__cuencasData) openSheet(window.__cuencasData.find(c=>c.nombre==='Río San Juan (Suroeste)'), 'linea'); }, 800);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

fetch('data/cuencas.json')
  .then(r => r.json())
  .then(data => {
    window.__cuencasData = data;
    data.forEach(cuenca => {
      visibleCuencas.add(cuenca.id);
      addCuencaToMap(cuenca);
    });
    renderChips(data);
    renderLegend();
    return fetch('data/antioquia_boundary.json');
  })
  .then(r => r.json())
  .then(boundaryGeoJson => {
    // Límite del departamento: capa fija, siempre visible, siempre por encima
    // de las cuencas — no se apaga con los toggles ni con el modo de capa.
    L.geoJSON(boundaryGeoJson, {
      style: { color: '#1a1a2e', weight: 1, fill: false }
    }).addTo(map);
  });

const COLOR_FUERA = '#4a7fc9'; // azul estándar — tramo del río fuera de Antioquia (solo contexto)

// Peso del trazo invisible que amplía la zona de clic de cada río — el
// trazo visible (3.5px / 1.5px) es demasiado delgado para tocarlo sin
// hacer zoom; esta línea ancha va debajo, sin verse, solo para capturar
// el toque en un radio más generoso alrededor del río.
const HIT_WEIGHT = 22;

function addCuencaToMap(cuenca) {
  const color = colorFor(cuenca);
  const entry = { area: null, linea: null, lineaFuera: null, lineaHit: null, lineaFueraHit: null };

  if (cuenca.geometry_area) {
    entry.area = L.geoJSON(cuenca.geometry_area, {
      style: { color, weight: 1, fillColor: color, fillOpacity: 0.22 }
    });
    entry.area.on('click', () => openSheet(cuenca, 'area'));
    entry.area.addTo(map);
  }

  // Tramo fuera de Antioquia primero (más delgado, azul estándar) para que
  // el tramo interior quede siempre por encima visualmente.
  if (cuenca.geometry_linea_fuera) {
    entry.lineaFueraHit = L.geoJSON(cuenca.geometry_linea_fuera, {
      style: { color: COLOR_FUERA, weight: HIT_WEIGHT, opacity: 0.02 }
    });
    entry.lineaFueraHit.on('click', () => openSheet(cuenca, 'linea'));
    entry.lineaFueraHit.addTo(map);

    entry.lineaFuera = L.geoJSON(cuenca.geometry_linea_fuera, {
      style: { color: COLOR_FUERA, weight: 1.5, opacity: 0.75, dashArray: '4 3' }
    });
    entry.lineaFuera.on('click', () => openSheet(cuenca, 'linea'));
    entry.lineaFuera.addTo(map);
  }

  if (cuenca.geometry_linea) {
    entry.lineaHit = L.geoJSON(cuenca.geometry_linea, {
      style: { color, weight: HIT_WEIGHT, opacity: 0.02 }
    });
    entry.lineaHit.on('click', () => openSheet(cuenca, 'linea'));
    entry.lineaHit.addTo(map);

    entry.linea = L.geoJSON(cuenca.geometry_linea, {
      style: { color, weight: 3.5, opacity: 0.9 }
    });
    entry.linea.on('click', () => openSheet(cuenca, 'linea'));
    entry.linea.addTo(map);
  }

  layersByCuenca[cuenca.id] = entry;
}

// ── Visibilidad: combina modo de capa (ríos / ríos+áreas) y chips activos ──
function updateVisibility() {
  Object.keys(layersByCuenca).forEach(id => {
    const { area, linea, lineaFuera, lineaHit, lineaFueraHit } = layersByCuenca[id];
    const on = visibleCuencas.has(id);
    if (linea) {
      if (on && map.hasLayer(linea) === false) linea.addTo(map);
      if (!on && map.hasLayer(linea)) map.removeLayer(linea);
    }
    if (lineaHit) {
      if (on && map.hasLayer(lineaHit) === false) lineaHit.addTo(map);
      if (!on && map.hasLayer(lineaHit)) map.removeLayer(lineaHit);
    }
    if (lineaFuera) {
      if (on && map.hasLayer(lineaFuera) === false) lineaFuera.addTo(map);
      if (!on && map.hasLayer(lineaFuera)) map.removeLayer(lineaFuera);
    }
    if (lineaFueraHit) {
      if (on && map.hasLayer(lineaFueraHit) === false) lineaFueraHit.addTo(map);
      if (!on && map.hasLayer(lineaFueraHit)) map.removeLayer(lineaFueraHit);
    }
    if (area) {
      const showArea = on && layerMode === 'todo';
      if (showArea && !map.hasLayer(area)) area.addTo(map);
      if (!showArea && map.hasLayer(area)) map.removeLayer(area);
    }
  });
}

// ── Control de modo de capa (Ríos / Ríos + áreas) ───────────────────────
const modeToggle = document.getElementById('layer-mode-toggle');
modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mode]');
  if (!btn) return;
  layerMode = btn.dataset.mode;
  modeToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
  updateVisibility();
});

// ── Chips: cada uno es un toggle on/off, no abren el panel ──────────────
function renderChips(data) {
  const row = document.getElementById('cuencas-chip-row');
  row.innerHTML = '';
  data.forEach(cuenca => {
    const chip = document.createElement('button');
    const color = colorForTexto(cuenca);
    const active = visibleCuencas.has(cuenca.id);
    chip.className = 'filter-chip cuenca-chip' + (active ? ' cuenca-chip--active' : '');
    chip.style.setProperty('--chip-color', color);
    chip.textContent = cuenca.nombre;
    chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    chip.addEventListener('click', () => {
      if (visibleCuencas.has(cuenca.id)) {
        visibleCuencas.delete(cuenca.id);
        chip.classList.remove('cuenca-chip--active');
        chip.setAttribute('aria-pressed', 'false');
      } else {
        visibleCuencas.add(cuenca.id);
        chip.classList.add('cuenca-chip--active');
        chip.setAttribute('aria-pressed', 'true');
      }
      updateVisibility();
    });
    row.appendChild(chip);
  });
}

// ── Leyenda de niveles (clasificación oficial IDEAM, Decreto 1640 de 2012) ──
const NIVELES = [
  { n: 1, es: 'Área hidrográfica', en: 'Hydrographic area', descEs: 'La gran vertiente. Antioquia está en 2: Magdalena-Cauca y Caribe.', descEn: 'The major watershed. Antioquia lies within 2: Magdalena-Cauca and Caribbean.' },
  { n: 2, es: 'Zona hidrográfica', en: 'Hydrographic zone', descEs: 'Agrupa varias cuencas con relieve y drenaje similares (ej. "Cauca", "Nechí"). Es el color de cada cuenca en este mapa.', descEn: 'Groups several basins with similar relief and drainage (e.g. "Cauca", "Nechí"). This is the color of each basin on this map.' },
  { n: 3, es: 'Subzona hidrográfica', en: 'Hydrographic subzone', descEs: 'La cuenca de un río principal (ej. Río Porce). Es el nivel que muestra este mapa.', descEn: 'The basin of a main river (e.g. Porce River). This is the level shown on this map.' },
  { n: 4, es: 'Nivel I', en: 'Level I', descEs: 'Subdivisión de una subzona — cuencas de afluentes grandes.', descEn: 'Subdivision of a subzone — large tributary basins.' },
  { n: 5, es: 'Nivel II', en: 'Level II', descEs: 'Subdivisión más fina, dentro de un Nivel I.', descEn: 'Finer subdivision, within a Level I.' },
  { n: 6, es: 'Nivel III', en: 'Level III', descEs: 'El nivel más detallado — quebradas y microcuencas individuales.', descEn: 'The most detailed level — individual streams and micro-basins.' },
];

function renderLegend() {
  const lang = I18n.getLang();
  const list = document.getElementById('legend-list');
  list.innerHTML = NIVELES.map(n => `
    <div class="legend-item">
      <span class="legend-item__num">${n.n}</span>
      <div>
        <div class="legend-item__title">${lang === 'en' ? n.en : n.es}</div>
        <div class="legend-item__desc">${lang === 'en' ? n.descEn : n.descEs}</div>
      </div>
    </div>
  `).join('');

  const zonasList = document.getElementById('legend-zonas');
  zonasList.innerHTML = Object.entries(COLOR_ZONA).map(([nombre, color]) => `
    <div class="legend-zona"><span class="legend-zona__dot" style="background:${color}"></span>${nombre}</div>
  `).join('');
}

document.getElementById('legend-btn').addEventListener('click', () => {
  document.getElementById('legend-sheet').classList.add('open');
  document.getElementById('legend-overlay').classList.add('open');
});
document.getElementById('legend-close').addEventListener('click', closeLegend);
document.getElementById('legend-overlay').addEventListener('click', closeLegend);
function closeLegend() {
  document.getElementById('legend-sheet').classList.remove('open');
  document.getElementById('legend-overlay').classList.remove('open');
}

// ── Bottom sheet de información de cuenca ────────────────────────────────
const sheet = document.getElementById('cuenca-sheet');
const overlay = document.getElementById('cuenca-overlay');

function openSheet(cuenca, tipoToque) {
  const lang = I18n.getLang();
  document.getElementById('cuenca-sheet-name').textContent = cuenca.nombre;
  document.getElementById('cuenca-sheet-desc').textContent =
    lang === 'en' ? (cuenca.descripcionEn || cuenca.descripcionEs) : cuenca.descripcionEs;

  const badges = document.getElementById('cuenca-sheet-badges');
  const colorTexto = colorForTexto(cuenca);
  const nivelLabel = cuenca.nivel_ideam === 3
    ? (lang === 'en' ? 'Level 3 · Subzone' : 'Nivel 3 · Subzona')
    : (lang === 'en' ? 'Level 4-6 (tributary)' : 'Nivel 4-6 (afluente)');
  const n1 = lang === 'en' ? 'Level 1' : 'Nivel 1';
  const n2 = lang === 'en' ? 'Level 2' : 'Nivel 2';
  // Tags puramente informativos (no se pueden tocar) — relleno tenue del
  // color con el mismo tono usado en los chips de filtro de abajo, para
  // que se lean como dato y no como botón. Alfa en hex (últimos 2 dígitos)
  // en vez de color-mix() porque el color viene dinámico desde JS.
  badges.innerHTML = `
    <span class="cuenca-badge" style="background:${colorTexto}22;color:${colorTexto}" title="${n1}">${n1}: ${cuenca.area_hidrografica}</span>
    <span class="cuenca-badge" style="background:${colorTexto}22;color:${colorTexto}" title="${n2}">${n2}: ${cuenca.zona_hidrografica}</span>
    <span class="cuenca-badge" style="background:#eceded;color:#555">${nivelLabel}</span>
  `;

  const meta = document.getElementById('cuenca-sheet-meta');
  if (tipoToque === 'linea') {
    const notaExtra = cuenca.longitud_nota
      ? `<br><span class="cuenca-sheet__pendiente">⚠️ ${cuenca.longitud_nota}</span>`
      : '';
    meta.innerHTML = cuenca.longitud_km_aprox
      ? `<span>${lang === 'en' ? 'Approx. length in Antioquia' : 'Longitud aprox. en Antioquia'}: <strong>${cuenca.longitud_km_aprox} km</strong></span>` +
        (cuenca.longitud_total_oficial_km
          ? `<br><span>${lang === 'en' ? 'Total length (source to mouth)' : 'Longitud total (nacimiento a desembocadura)'}: <strong>${cuenca.longitud_total_oficial_km} km</strong></span>
             <br><span class="cuenca-sheet__pendiente">${lang === 'en' ? 'Source' : 'Fuente'}: ${cuenca.longitud_total_fuente}</span>` + notaExtra
          : `<br><span class="cuenca-sheet__pendiente">${lang === 'en' ? 'Total length: no reliable public source found yet' : 'Longitud total: no se encontró todavía una fuente pública confiable'}</span>` + notaExtra)
      : '';
  } else {
    meta.innerHTML = cuenca.area_km2_aprox
      ? `<span>${lang === 'en' ? 'Approx. area in Antioquia' : 'Área aprox. en Antioquia'}: <strong>${cuenca.area_km2_aprox.toLocaleString(lang === 'en' ? 'en-US' : 'es-CO')} km²</strong></span>`
      : '';
  }

  const subEl = document.getElementById('cuenca-sheet-subregiones');
  const nombresSub = {
    valle_aburra: 'Valle de Aburrá', oriente: 'Oriente', norte: 'Norte', uraba: 'Urabá',
    bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste', magdalena_medio: 'Magdalena Medio',
    occidente: 'Occidente', suroeste: 'Suroeste'
  };
  subEl.innerHTML = (cuenca.subregiones || [])
    .map(id => `<span class="badge-subregion">${nombresSub[id] || id}</span>`).join('');

  sheet.classList.add('open');
  overlay.classList.add('open');
}

function closeSheet() {
  sheet.classList.remove('open');
  overlay.classList.remove('open');
}

document.getElementById('cuenca-sheet-close').addEventListener('click', closeSheet);
overlay.addEventListener('click', closeSheet);
