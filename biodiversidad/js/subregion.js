const GROUPS = [
      { id: 'aves',              icon: 'img/icons/aves.svg',              deco: '🦜', i18nEs: 'Aves',                 i18nEn: 'Birds' },
      { id: 'anfibios_reptiles', icon: 'img/icons/anfibios_reptiles.svg', deco: '🐸', i18nEs: 'Anfibios y Reptiles', i18nEn: 'Amphibians & Reptiles' },
      { id: 'mariposas',         icon: 'img/icons/mariposas.svg',         deco: '🦋', i18nEs: 'Mariposas',            i18nEn: 'Butterflies' },
      { id: 'polillas',          icon: 'img/icons/polillas.svg',          deco: '🦗', i18nEs: 'Polillas',             i18nEn: 'Moths' },
      { id: 'orquideas',         icon: 'img/icons/orquideas.svg',         deco: '🌸', i18nEs: 'Orquídeas',            i18nEn: 'Orchids' },
      { id: 'mamiferos',           icon: 'img/icons/mamiferos.svg',              deco: '🦌', i18nEs: 'Mamíferos',              i18nEn: 'Mammals' },
      { id: 'animales_domesticos', icon: 'img/icons/animales_domesticos.svg',  deco: '🐄', i18nEs: 'Animales Domésticos y de Granja', i18nEn: 'Domestic and Farm Animals' },
      { id: 'peces',               icon: 'img/icons/peces.svg',               deco: '🐟', i18nEs: 'Peces de Agua Dulce',      i18nEn: 'Freshwater Fish' },
      { id: 'arboles_nativos',     icon: 'img/icons/arboles_nativos.svg',     deco: '🌳', i18nEs: 'Árboles Nativos',          i18nEn: 'Native Trees' },
      { id: 'hongos',              icon: 'img/icons/hongos.svg',              deco: '🍄', i18nEs: 'Hongos',                   i18nEn: 'Fungi' }
    ];

    // Nombre de subregión a partir del ID (map IDs → nombre en el JSON)
    const REGION_NAMES = {
      uraba: 'Urabá',
      occidente: 'Occidente',
      norte: 'Norte',
      bajo_cauca: 'Bajo Cauca',
      nordeste: 'Nordeste',
      magdalena_medio: 'Magdalena Medio',
      valle_aburra: 'Valle de Aburrá',
      oriente: 'Oriente',
      suroeste: 'Suroeste'
    };

    document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      const subregionId = Nav.getParam('subregion') || 'valle_aburra';
      const subregionName = REGION_NAMES[subregionId] || subregionId;
      const lang = I18n.getLang();

      // Nombre en el hero
      document.getElementById('subregion-name').textContent = subregionName;
      document.title = subregionName + ' · Antioquia Natural';

      // Generar cuadrícula de grupos
      const grid = document.getElementById('bio-grid');
      const badgesEl = document.getElementById('subregion-badges');

      for (const group of GROUPS) {
        const count = DataStore.countSpeciesByGroup(group.id, subregionId);
        const label = lang === 'en' ? group.i18nEn : group.i18nEs;

        // Badge en el hero — enlaza directo al grupo, igual que la tarjeta de abajo
        if (count > 0) {
          const badge = document.createElement('a');
          badge.href = `listado.html?subregion=${subregionId}&grupo=${group.id}`;
          badge.className = 'hero-badge';
          badge.title = label;
          badge.setAttribute('aria-label', `${label}: ${count} ${I18n.t('species_count')}`);
          badge.innerHTML = `
            <span class="hero-badge__emoji">${group.deco}</span>
            <span class="hero-badge__count">${count}</span>`;
          badgesEl.appendChild(badge);
        }

        // Tarjeta del grupo
        const card = document.createElement('a');
        card.href = `listado.html?subregion=${subregionId}&grupo=${group.id}`;
        card.className = `bio-card-sr bio-card-sr--${group.id} ripple-container anim-fade-in-up`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `${label}: ${count} especies en ${subregionName}`);
        card.innerHTML = `
          <div class="bio-card-sr__icon-wrap">
            <img src="${group.icon}" alt="" width="40" height="40">
          </div>
          <span class="bio-card-sr__name">${label}</span>
          <span class="bio-card-sr__count">${count} ${I18n.t('species_count')}</span>
        `;

        // Efecto ripple
        card.addEventListener('click', function(e) {
          const ripple = document.createElement('span');
          ripple.className = 'ripple';
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });

        grid.appendChild(card);
      }

      _initSubregionReel(subregionId);
    });

    // ── Carrete de fotos de la subregión actual (overlay, 3 modalidades) ──

    const REEL_VIEW_KEY = 'ab_photo_view';
    let _subregionReelData = [];

    function _initSubregionReel(subregionId) {
      const btn = document.getElementById('reel-view-btn');
      const overlay = document.getElementById('reel-overlay');
      const closeBtn = document.getElementById('reel-overlay-close');

      _subregionReelData = DataStore.getPhotoReel({ subregion: subregionId });
      _renderSubregionReel();
      _renderSubregionGrid();
      _renderSubregionMasonry();

      btn.addEventListener('click', () => { overlay.hidden = false; });
      closeBtn.addEventListener('click', () => { overlay.hidden = true; });

      const switcherBtns = overlay.querySelectorAll('.view-switcher__btn');
      const views = {
        reel:    document.getElementById('kreel-view-reel'),
        grid:    document.getElementById('kreel-view-grid'),
        masonry: document.getElementById('kreel-view-masonry'),
      };
      function setView(view) {
        Object.keys(views).forEach(key => { views[key].hidden = key !== view; });
        switcherBtns.forEach(b => {
          const active = b.dataset.view === view;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        localStorage.setItem(REEL_VIEW_KEY, view);
      }
      switcherBtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
      const saved = localStorage.getItem(REEL_VIEW_KEY);
      setView(saved && views[saved] ? saved : 'reel');

      document.addEventListener('langchange', () => {
        _renderSubregionReel();
        _renderSubregionGrid();
        _renderSubregionMasonry();
      });
    }

    function _renderSubregionReel() {
      const reel = document.getElementById('subregion-photo-reel');
      const lang = I18n.getLang();
      reel.innerHTML = '';
      _subregionReelData.forEach((item, i) => {
        const card = document.createElement('a');
        card.href = `especie.html?id=${item.speciesId}`;
        card.className = 'photo-reel__card';
        const name = lang === 'en' ? item.nameEn : item.nameEs;
        card.innerHTML = `
          <img src="${item.url}" alt="${name}" loading="${i < 3 ? 'eager' : 'lazy'}">
          <div class="photo-reel__scrim" aria-hidden="true"></div>
          <span class="photo-reel__dot photo-reel__dot--${item.iucn}" aria-hidden="true"></span>
          <span class="photo-reel__name">${name}</span>
        `;
        reel.appendChild(card);
      });
    }

    function _renderSubregionGrid() {
      const grid = document.getElementById('subregion-photo-grid');
      const lang = I18n.getLang();
      grid.innerHTML = '';
      _subregionReelData.forEach((item, i) => {
        const name = lang === 'en' ? item.nameEn : item.nameEs;
        const cell = document.createElement('a');
        cell.href = `especie.html?id=${item.speciesId}`;
        cell.className = 'photo-grid-3col__item';
        cell.innerHTML = `<img src="${item.url}" alt="${name}" loading="${i < 9 ? 'eager' : 'lazy'}">`;
        grid.appendChild(cell);
      });
    }

    // Columna de cada foto calculada en JS (columna más corta primero, con
    // el ratio real de cada imagen) — ver nota en biodiversidad.js.
    function _renderSubregionMasonry() {
      const masonry = document.getElementById('subregion-photo-masonry');
      const lang = I18n.getLang();
      masonry.innerHTML = '';
      const cols = [document.createElement('div'), document.createElement('div')];
      cols.forEach(c => c.className = 'photo-masonry__col');
      const colHeights = [0, 0];

      _subregionReelData.forEach((item, i) => {
        const name = lang === 'en' ? item.nameEn : item.nameEs;
        const cell = document.createElement('a');
        cell.href = `especie.html?id=${item.speciesId}`;
        cell.className = 'photo-masonry__item';
        cell.innerHTML = `
          <img src="${item.url}" alt="${name}" loading="${i < 6 ? 'eager' : 'lazy'}" width="${item.width}" height="${item.height}">
          <div class="photo-masonry__scrim" aria-hidden="true"></div>
          <span class="photo-masonry__name">${name}</span>
        `;
        const target = colHeights[0] <= colHeights[1] ? 0 : 1;
        cols[target].appendChild(cell);
        colHeights[target] += 1 / (item.ratio || 1);
      });

      masonry.appendChild(cols[0]);
      masonry.appendChild(cols[1]);
    }
