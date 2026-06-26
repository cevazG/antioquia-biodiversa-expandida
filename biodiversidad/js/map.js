/* ============================================================
   ANTIOQUIA BIODIVERSA — map.js
   Mapa SVG interactivo de las 9 subregiones de Antioquia
   ============================================================ */

const MapController = (() => {

  // Dimensiones de referencia del mapa JPG (aprox. 618 × 780 px natural)
  // Los polígonos se definen en porcentajes relativos al contenedor
  // para ser totalmente responsivos.

  // Polígonos generados automáticamente por detección de color sobre
  // Mapa_subregiones_municipios_departamento_de_Antioquia.jpg
  // Coordenadas en porcentaje (x%, y%) relativas al contenedor de imagen.
  const REGIONS = [
    {
      id: 'uraba',
      nameEs: 'Urabá',
      nameEn: 'Urabá',
      // Urabá tiene dos partes separadas geográficamente
      points: [
        '22.9,0.9 8.0,9.2 12.9,14.3 13.3,27.5 7.8,27.6 8.4,22.6 1.8,31.7 11.5,37.9 21.1,50.5 32.2,50.6 20.0,37.8 22.7,23.9 29.6,14.6',
        '10.6,54.0 11.6,58.0 6.5,59.5 6.3,61.9 8.5,66.8 11.8,69.0 11.7,74.6 13.9,78.2 21.3,78.1 19.6,76.6 17.3,62.2 19.1,54.5'
      ],
      color: '#4CAF8C'
    },
    {
      id: 'bajo_cauca',
      nameEs: 'Bajo Cauca',
      nameEn: 'Bajo Cauca',
      points: '81.5,32.4 77.6,25.1 70.6,20.1 60.0,23.2 47.4,37.1 48.2,43.3 56.6,42.3 57.1,47.6 63.5,42.7 68.0,42.7 68.2,45.8 78.4,42.5 78.4,36.0',
      color: '#80DEEA'
    },
    {
      id: 'nordeste',
      nameEs: 'Nordeste',
      nameEn: 'Northeastern',
      points: '85.5,41.5 81.5,44.4 78.0,42.2 70.7,45.4 68.3,41.9 63.8,42.1 56.5,47.4 61.6,60.7 58.2,70.3 71.6,74.0 69.9,67.0 78.8,64.9 87.7,55.4 83.3,48.9',
      color: '#4DB6AC'
    },
    {
      id: 'norte',
      nameEs: 'Norte',
      nameEn: 'Northern',
      points: '24.6,43.6 30.5,49.6 36.0,50.9 38.7,48.8 42.6,53.1 45.2,72.4 60.5,66.2 61.8,60.8 55.9,49.7 56.5,42.0 48.5,43.5 48.0,37.9 42.8,37.0 40.0,43.7',
      color: '#FFAB76'
    },
    {
      id: 'occidente',
      nameEs: 'Occidente',
      nameEn: 'Western',
      points: '22.6,48.9 19.4,51.7 16.8,61.4 20.9,69.0 23.4,66.3 26.0,68.2 31.1,66.7 35.7,76.3 39.8,77.0 39.5,80.5 44.0,78.9 46.1,68.5 42.7,52.6 39.5,51.2 39.1,48.0 30.9,50.4',
      color: '#AED581'
    },
    {
      id: 'suroeste',
      nameEs: 'Suroeste',
      nameEn: 'Southwestern',
      points: '18.8,66.2 19.5,77.1 28.9,77.9 30.0,82.7 33.2,83.6 32.8,92.3 35.6,96.8 48.2,97.0 47.4,91.2 51.1,85.1 45.4,83.3 44.8,78.0 40.1,80.1 40.0,76.7 36.0,76.1 30.9,66.2 23.4,66.1 21.5,68.2',
      color: '#F48FB1'
    },
    {
      id: 'oriente',
      nameEs: 'Oriente',
      nameEn: 'Eastern',
      points: '68.0,71.8 59.0,70.2 50.1,74.6 50.6,78.5 47.6,80.7 47.4,83.3 51.1,84.9 48.8,91.0 53.9,92.5 57.1,98.9 65.9,91.0 72.4,91.9 75.6,89.4 75.7,87.1 70.4,85.4 72.2,82.5 70.9,78.8 73.7,76.3',
      color: '#C5E1A5'
    },
    {
      id: 'valle_aburra',
      nameEs: 'Valle de Aburrá',
      nameEn: 'Valley of Aburrá',
      points: '58.5,68.9 55.5,68.7 53.3,70.5 49.4,71.8 47.4,71.0 46.5,72.2 43.8,72.5 45.4,83.4 47.1,83.7 48.0,80.2 50.9,78.6 50.9,74.2 57.7,71.0',
      color: '#DCE775'
    },
    {
      id: 'magdalena_medio',
      nameEs: 'Magdalena Medio',
      nameEn: 'Middle Magdalena',
      points: '97.7,46.0 83.8,57.0 79.6,63.9 69.3,67.3 72.7,76.4 69.9,85.5 77.4,86.4 78.2,77.1 84.0,71.8 83.2,66.4 98.9,54.4',
      color: '#66BB6A'
    }
  ];

  let _onSelectCallback = null;

  function init(containerId, onSelect) {
    _onSelectCallback = onSelect;
    const container = document.getElementById(containerId);
    if (!container) return;

    const img = container.querySelector('img');
    if (!img) return;

    // Crear SVG overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

    const lang = I18n.getLang();
    const tooltip = document.getElementById('map-tooltip');

    REGIONS.forEach(region => {
      const pointsList = Array.isArray(region.points) ? region.points : [region.points];

      pointsList.forEach(pts => {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', pts);
        polygon.classList.add('map-region');
        polygon.dataset.regionId = region.id;

        polygon.addEventListener('click', () => {
          _showTooltip(tooltip, region, lang);
          if (_onSelectCallback) _onSelectCallback(region);
        });
        polygon.addEventListener('mouseenter', () => _showTooltip(tooltip, region, lang));
        polygon.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));

        svg.appendChild(polygon);
      });
    });

    container.appendChild(svg);
  }

  function _showTooltip(tooltip, region, lang) {
    if (!tooltip) return;
    const name = lang === 'en' ? region.nameEn : region.nameEs;
    tooltip.textContent = name;

    // Centroide del primer polígono (el más grande)
    const firstPts = Array.isArray(region.points) ? region.points[0] : region.points;
    const points = firstPts.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

    tooltip.style.left = cx + '%';
    tooltip.style.top = cy + '%';
    tooltip.classList.add('visible');
  }

  return { init, REGIONS };
})();
