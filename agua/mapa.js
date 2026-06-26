I18n.init().then(updateTipoPill);
  document.addEventListener('langchange', updateTipoPill);

  function updateTipoPill() {
    const tipo = new URLSearchParams(window.location.search).get('tipo') || 'fuentes';
    document.getElementById('tipo-label').textContent = tipo === 'cuencas'
      ? I18n.t('agua_cuencas_header')
      : I18n.t('agua_fuentes_header');
  }

  // Leer parámetro tipo
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get('tipo') || 'fuentes';

  // Centros y zoom de cada subregión
  const SUBREGIONES = [
    { id: 'valle_aburra',    nombre: 'Valle de Aburrá', lat: 6.25,  lng: -75.57, rios: 5, cuencas: 5 },
    { id: 'oriente',         nombre: 'Oriente',          lat: 6.10,  lng: -75.25, rios: 5, cuencas: 3 },
    { id: 'norte',           nombre: 'Norte',             lat: 6.90,  lng: -75.45, rios: 5, cuencas: 2 },
    { id: 'uraba',           nombre: 'Urabá',             lat: 7.90,  lng: -76.65, rios: 6, cuencas: 3 },
    { id: 'bajo_cauca',      nombre: 'Bajo Cauca',        lat: 7.80,  lng: -75.10, rios: 5, cuencas: 2 },
    { id: 'nordeste',        nombre: 'Nordeste',          lat: 6.80,  lng: -74.90, rios: 5, cuencas: 2 },
    { id: 'magdalena_medio', nombre: 'Magdalena Medio',   lat: 6.30,  lng: -74.45, rios: 4, cuencas: 2 },
    { id: 'occidente',       nombre: 'Occidente',         lat: 6.60,  lng: -75.95, rios: 5, cuencas: 2 },
    { id: 'suroeste',        nombre: 'Suroeste',          lat: 5.90,  lng: -75.80, rios: 5, cuencas: 2 }
  ];

  // Inicializar mapa centrado en Antioquia
  const map = L.map('map', {
    center: [6.70, -75.55],
    zoom: 8,
    zoomControl: false
  });

  // Capa base: CartoDB Voyager — muestra ríos en azul claramente
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Control de zoom reposicionado
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Icono personalizado para cada subregión
  function crearIcono(color) {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:44px; height:44px;
        background:${color};
        border:3px solid white;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:1.2rem;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        cursor:pointer;
      ">💧</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -26]
    });
  }

  const COLOR_MARKER = '#3561ab';

  // Agregar marcadores por subregión
  SUBREGIONES.forEach(sr => {
    const count = tipo === 'cuencas' ? sr.cuencas : sr.rios;
    const label = tipo === 'cuencas' ? 'cuencas abastecedoras' : 'fuentes hídricas';

    const marker = L.marker([sr.lat, sr.lng], { icon: crearIcono(COLOR_MARKER) });

    const popupHtml = `
      <div class="popup-card">
        <div class="popup-card__name">${sr.nombre}</div>
        <div class="popup-card__count">${count} ${label}</div>
        <a class="popup-card__btn" href="subregion.html?subregion=${sr.id}&tipo=${tipo}">
          Ver detalle →
        </a>
      </div>`;

    marker.bindPopup(popupHtml, { maxWidth: 240, minWidth: 200 });
    marker.addTo(map);

    marker.on('click', () => {
      document.getElementById('map-hint').style.display = 'none';
    });
  });
