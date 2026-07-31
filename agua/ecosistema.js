const SUBREGION_NAMES = {
  uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
  bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
  magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
  oriente: 'Oriente', suroeste: 'Suroeste',
};

document.addEventListener('DOMContentLoaded', async () => {
  await I18n.init();

  const id = Nav.getParam('id');
  const res = await fetch('data/ecosistemas.json');
  const data = await res.json();
  const eco = data.ecosistemas.find(e => e.id === id);

  document.getElementById('sp-loading').classList.add('hidden');

  if (!eco) { Nav.go('ecosistemas.html'); return; }

  const lang = I18n.getLang();
  const name = lang === 'en' ? eco.nombreEn : eco.nombreEs;

  document.title = name + ' · Antioquia Natural';
  document.getElementById('eco-name').textContent = name;
  document.getElementById('eco-altitude').textContent = eco.rangoAltitudinal || '';
  document.getElementById('eco-tag').innerHTML = `${eco.icono} ${I18n.t('ecosystems_title') || 'Ecosistema Estratégico'}`;
  document.getElementById('eco-desc').textContent = lang === 'en' ? eco.descripcionEn : eco.descripcionEs;
  document.getElementById('eco-why').textContent = lang === 'en' ? eco.porQueEstrategicoEn : eco.porQueEstrategicoEs;
  document.getElementById('eco-threats').textContent = lang === 'en' ? eco.amenazasEn : eco.amenazasEs;

  // Sitios representativos
  const sitesEl = document.getElementById('eco-sites');
  const sites = eco.sitiosRepresentativos || [];
  if (sites.length === 0) {
    sitesEl.innerHTML = `<p class="info-section__text">—</p>`;
  } else {
    sitesEl.innerHTML = sites.map(s => `
      <div class="species-card" style="cursor:default">
        <div class="species-card__photo" aria-hidden="true">📍</div>
        <div class="species-card__info">
          <div class="species-card__common">${s.nombre}</div>
          <div class="species-card__scientific" style="font-style:normal">${s.municipio} · ${SUBREGION_NAMES[s.subregion] || s.subregion}</div>
        </div>
      </div>
    `).join('');
  }

  // Galería — reusa el patrón de especie.js (crossfade + dots + swipe + contador)
  const photos = eco.fotos || [];
  if (photos.length > 0) {
    document.getElementById('photo-placeholder').style.display = 'none';
    const galleryEl = document.getElementById('gallery-wrapper');
    let current = 0;
    const slides = [];
    const dots = [];

    const captionEl = document.createElement('div');
    captionEl.className = 'photo-caption';
    captionEl.style.display = 'none';
    galleryEl.appendChild(captionEl);

    photos.forEach((photo, i) => {
      const slide = document.createElement('div');
      slide.className = 'photo-slide' + (i === 0 ? ' active' : '');
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = name;
      img.loading = i === 0 ? 'eager' : 'lazy';
      slide.appendChild(img);
      galleryEl.insertBefore(slide, document.getElementById('gallery-counter'));
      slides.push(slide);
    });

    function updateCaption(idx) {
      const cap = lang === 'en' ? photos[idx].creditoEn : photos[idx].creditoEs;
      if (cap) { captionEl.textContent = cap; captionEl.style.display = 'block'; }
      else { captionEl.style.display = 'none'; }
    }
    updateCaption(0);

    if (photos.length > 1) {
      const dotsEl = document.createElement('div');
      dotsEl.className = 'gallery-dots';
      photos.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
        dotsEl.appendChild(dot);
        dots.push(dot);
      });
      galleryEl.appendChild(dotsEl);

      const counter = document.getElementById('gallery-counter');
      counter.style.display = 'block';
      counter.textContent = '1 / ' + photos.length;

      function showSlide(n) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (n + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
        counter.textContent = (current + 1) + ' / ' + slides.length;
        updateCaption(current);
      }

      dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));

      galleryEl.addEventListener('click', e => {
        if (!e.target.closest('.gallery-dot') && !e.target.closest('.gallery-back')) {
          showSlide(current + 1);
        }
      });

      let startX = 0;
      galleryEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      galleryEl.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) showSlide(diff > 0 ? current + 1 : current - 1);
      });
    }
  } else {
    document.getElementById('photo-emoji').textContent = eco.icono;
  }
});
