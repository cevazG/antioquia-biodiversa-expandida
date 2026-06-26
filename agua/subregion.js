const params  = new URLSearchParams(window.location.search);
  const srId    = params.get('subregion') || 'valle_aburra';
  const tipo    = params.get('tipo') || 'fuentes';

  // Caudal máximo de referencia para la barra (m³/s)
  const CAUDAL_MAX = 15;

  I18n.init().then(() => {
    fetch('data/fuentes.json')
    .then(r => r.json())
    .then(data => {
      const sr = data.subregiones[srId];
      if (!sr) return;

      // — Header —
      document.getElementById('header-nombre').textContent = sr.nombre;
      document.getElementById('tipo-label').textContent =
        tipo === 'cuencas' ? I18n.t('agua_cuencas_header') : I18n.t('agua_fuentes_header');

      // — Mini mapa —
      const map = L.map('mini-map', {
        center: [sr.lat, sr.lng],
        zoom: sr.zoom,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Pin central
      const pin = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;
          background:#3561ab;
          border:3px solid white;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:1rem;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">💧</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([sr.lat, sr.lng], { icon: pin }).addTo(map);

      // — Stats —
      const statsRow = document.getElementById('stats-row');
      if (tipo === 'fuentes') {
        statsRow.innerHTML = `
          <div class="stat-chip">
            <div class="stat-chip__num">${sr.rios.length}</div>
            <div class="stat-chip__label">${I18n.t('agua_fuentes_hidrica_stat')}</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip__num">${sr.cuencas_abastecedoras.length}</div>
            <div class="stat-chip__label">${I18n.t('agua_cuencas_stat')}</div>
          </div>`;
      } else {
        const totalMun = sr.cuencas_abastecedoras
          .reduce((acc, c) => acc + c.municipios.length, 0);
        statsRow.innerHTML = `
          <div class="stat-chip">
            <div class="stat-chip__num">${sr.cuencas_abastecedoras.length}</div>
            <div class="stat-chip__label">${I18n.t('agua_cuencas_abastecedoras_stat')}</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip__num">${totalMun}</div>
            <div class="stat-chip__label">${I18n.t('agua_municipios_abastecidos')}</div>
          </div>`;
      }

      // — Lista —
      const container = document.getElementById('lista-container');

      if (tipo === 'fuentes') {
        // Ríos y fuentes hídricas
        container.innerHTML = `<div class="section-title">${I18n.t('agua_fuentes_principales_label')}</div>`;

        // Enriquecer con datos de ríos_principales si existen
        const riosPrincipalesMap = {};
        (data.rios_principales || []).forEach(r => {
          riosPrincipalesMap[r.nombre] = r;
        });

        sr.rios.forEach(nombre => {
          const rp = Object.values(riosPrincipalesMap)
            .find(r => nombre.includes(r.nombre.replace('Río ', '')));

          const card = document.createElement('div');
          card.className = 'fuente-card';
          card.innerHTML = `
            <div class="fuente-card__icon">💧</div>
            <div class="fuente-card__body">
              <div class="fuente-card__name">${nombre}</div>
              ${rp
                ? `<div class="fuente-card__detail">${rp.descripcionEs}</div>
                   <span class="fuente-card__badge">${rp.longitud_km} km</span>`
                : `<div class="fuente-card__detail">${I18n.t('agua_fuente_de')} ${sr.nombre}</div>`
              }
            </div>`;
          container.appendChild(card);
        });

      } else {
        // Cuencas abastecedoras
        container.innerHTML = `<div class="section-title">${I18n.t('agua_cuencas_label')}</div>`;

        sr.cuencas_abastecedoras.forEach(c => {
          const pct = Math.min(100, Math.round((c.caudal_m3s / CAUDAL_MAX) * 100));
          const card = document.createElement('div');
          card.className = 'cuenca-card';
          card.innerHTML = `
            <div class="cuenca-card__name">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3561ab" stroke-width="2">
                <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
              </svg>
              ${c.nombre}
            </div>
            <div class="cuenca-card__municipios">${I18n.t('agua_abastece')}</div>
            <div class="municipio-chips">
              ${c.municipios.map(m => `<span class="municipio-chip">${m}</span>`).join('')}
            </div>
            <div class="cuenca-card__caudal" style="margin-top:10px">
              <div class="caudal-bar">
                <div class="caudal-bar__fill" style="width:${pct}%"></div>
              </div>
              <span class="caudal-label">${c.caudal_m3s} m³/s</span>
            </div>`;
          container.appendChild(card);
        });
      }
    })
    .catch(() => {
      document.getElementById('lista-container').innerHTML =
        '<p style="color:#888;text-align:center;padding:2rem">No se pudieron cargar los datos.</p>';
    });
  }); // end I18n.init
