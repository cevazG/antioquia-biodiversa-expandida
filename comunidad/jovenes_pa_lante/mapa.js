// Nombres legibles de subregiones
  const SR_NOMBRES = {
    'valle_aburra':    'Valle de Aburrá',
    'oriente':         'Oriente',
    'norte':           'Norte',
    'uraba':           'Urabá',
    'bajo_cauca':      'Bajo Cauca',
    'nordeste':        'Nordeste',
    'magdalena_medio': 'Magdalena Medio',
    'occidente':       'Occidente',
    'suroeste':        'Suroeste'
  };

  // Colores por subregión
  const SR_COLORES = {
    'valle_aburra':    '#e53935',
    'oriente':         '#43a047',
    'norte':           '#1e88e5',
    'uraba':           '#8e24aa',
    'bajo_cauca':      '#fb8c00',
    'nordeste':        '#00acc1',
    'magdalena_medio': '#6d4c41',
    'occidente':       '#039be5',
    'suroeste':        '#f28e18'
  };

  // Mapa centrado en Antioquia
  const map = L.map('map', {
    center: [6.70, -75.55],
    zoom: 7,
    zoomControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  let allMarkers = [];
  let activeFilter = 'todas';

  function crearIcono(color) {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:28px; height:28px;
        background:${color};
        border:2.5px solid white;
        border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
        font-size:0.75rem; color:white; font-weight:700;
        cursor:pointer;
      ">🎓</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -18]
    });
  }

  function actualizarContador() {
    const visibles = allMarkers.filter(m => m._visible).length;
    document.getElementById('map-counter').textContent =
      `${visibles} municipio${visibles !== 1 ? 's' : ''}`;
  }

  function aplicarFiltro(sr) {
    activeFilter = sr;
    allMarkers.forEach(m => {
      const mostrar = (sr === 'todas' || m._subregion === sr);
      m._visible = mostrar;
      if (mostrar) {
        if (!map.hasLayer(m)) m.addTo(map);
      } else {
        if (map.hasLayer(m)) map.removeLayer(m);
      }
    });
    actualizarContador();

    // Ajustar vista si filtro activo
    if (sr !== 'todas') {
      const visibles = allMarkers.filter(m => m._visible);
      if (visibles.length > 0) {
        const group = L.featureGroup(visibles);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    } else {
      map.setView([6.70, -75.55], 7);
    }

    // Actualizar pills
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.sr === sr);
    });
  }

  // Construir filtros y marcadores desde JSON
  I18n.init().then(() => {
    initLangToggle();
    // Update the "Todas" pill text after i18n is ready
    const todasPill = document.querySelector('.filter-pill[data-sr="todas"]');
    if (todasPill) todasPill.textContent = I18n.t('jpl_todas');
  });

  fetch('data/municipios.json')
    .then(r => r.json())
    .then(data => {
      // Pills de subregiones
      const bar = document.getElementById('filter-bar');
      const subregiones = [...new Set(data.municipios.map(m => m.subregion))];

      subregiones.forEach(sr => {
        const pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.dataset.sr = sr;
        pill.textContent = SR_NOMBRES[sr] || sr;
        pill.style.borderColor = SR_COLORES[sr] || '#ccc';
        pill.addEventListener('click', () => aplicarFiltro(sr));
        bar.appendChild(pill);
      });

      // Marcadores
      data.municipios.forEach(mun => {
        const color = SR_COLORES[mun.subregion] || '#f28e18';
        const marker = L.marker([mun.lat, mun.lng], { icon: crearIcono(color) });

        const popup = `
          <div class="popup-card">
            <div class="popup-card__name">${mun.nombre}</div>
            <div class="popup-card__sub">${SR_NOMBRES[mun.subregion] || mun.subregion}</div>
          </div>`;

        marker.bindPopup(popup, { maxWidth: 220, minWidth: 180 });
        marker._subregion = mun.subregion;
        marker._visible = true;
        marker.addTo(map);
        allMarkers.push(marker);
      });

      actualizarContador();

      // Filtro "todas"
      document.querySelector('.filter-pill[data-sr="todas"]')
        .addEventListener('click', () => aplicarFiltro('todas'));
    })
    .catch(() => {
      document.getElementById('map-counter').textContent = 'Error al cargar datos';
    });
