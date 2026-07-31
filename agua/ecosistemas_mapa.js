const SUBREGION_NAMES = {
  uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
  bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
  magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
  oriente: 'Oriente', suroeste: 'Suroeste',
};

const ECO_COLORS = {
  paramo: '#8ba7b0',
  bosque_tropical: '#018d38',
  bosque_seco_tropical: '#cf9d52',
  humedales: '#2e9c9c',
  manglares: '#1f7a4d',
  playas_mar: '#3561ab',
  cavernas_cuevas: '#6b5b5f',
};

const map = L.map('map', {
  center: [6.90, -75.60],
  zoom: 7,
  zoomControl: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

// Límite del departamento: capa fija, siempre visible por encima de los
// marcadores — mismo patrón que agua/mapa.js
fetch('data/antioquia_boundary.json')
  .then(r => r.json())
  .then(boundaryGeoJson => {
    L.geoJSON(boundaryGeoJson, {
      style: { color: '#1a1a2e', weight: 1, fill: false },
    }).addTo(map);
  });

function crearIcono(emoji, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px; height:30px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      font-size:0.85rem;
      cursor:pointer;
    ">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await I18n.init();
  const lang = I18n.getLang();

  const res = await fetch('data/ecosistemas.json');
  const data = await res.json();

  let total = 0;
  data.ecosistemas.forEach(eco => {
    const ecoName = lang === 'en' ? eco.nombreEn : eco.nombreEs;
    const color = ECO_COLORS[eco.id] || '#018d38';
    (eco.sitiosRepresentativos || []).forEach(site => {
      total++;
      const marker = L.marker([site.lat, site.lng], { icon: crearIcono(eco.icono, color) });
      const subNombre = SUBREGION_NAMES[site.subregion] || site.subregion;
      const popup = `
        <div class="eco-popup">
          <div class="eco-popup__eco">${eco.icono} ${ecoName}</div>
          <div class="eco-popup__name">${site.nombre}</div>
          <div class="eco-popup__sub">${site.municipio} · ${subNombre}</div>
          <a class="eco-popup__link" href="ecosistema.html?id=${eco.id}">→ ${lang === 'en' ? 'View ecosystem' : 'Ver ecosistema'}</a>
        </div>`;
      marker.bindPopup(popup, { maxWidth: 240, minWidth: 190 });
      marker.addTo(map);
    });
  });

  const counterLabel = lang === 'en' ? 'sites' : 'sitios';
  document.getElementById('eco-map-counter').textContent = `${total} ${counterLabel}`;
});
