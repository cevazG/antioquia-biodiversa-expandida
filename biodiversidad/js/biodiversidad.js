const HOME_GROUPS = [
      { id: 'aves',              kingdom: 'fauna', icon: 'img/icons/aves.svg' },
      { id: 'anfibios_reptiles', kingdom: 'fauna', icon: 'img/icons/anfibios_reptiles.svg' },
      { id: 'mariposas',         kingdom: 'fauna', icon: 'img/icons/mariposas.svg' },
      { id: 'polillas',          kingdom: 'fauna', icon: 'img/icons/polillas.svg' },
      { id: 'mamiferos',           kingdom: 'fauna', icon: 'img/icons/mamiferos.svg' },
      { id: 'animales_domesticos', kingdom: 'fauna', icon: 'img/icons/animales_domesticos.svg' },
      { id: 'peces',               kingdom: 'fauna', icon: 'img/icons/peces.svg' },
      { id: 'arboles_nativos',     kingdom: 'flora', icon: 'img/icons/arboles_nativos.svg' },
      { id: 'orquideas',           kingdom: 'flora', icon: 'img/icons/orquideas.svg' },
      { id: 'hongos',              kingdom: 'fungi', icon: 'img/icons/hongos.svg' }
    ];

    function renderPhotoReel() {
      const reel = document.getElementById('photo-reel');
      if (!reel) return;
      reel.innerHTML = '';
      const lang = I18n.getLang();
      DataStore.getPhotoReel().forEach((item, i) => {
        const card = document.createElement('a');
        card.href = `especie.html?id=${item.speciesId}`;
        card.className = 'photo-reel__card ripple-container';
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

    // Cuadrícula 3 columnas estilo Instagram — fotos recortadas cuadradas
    function renderPhotoGrid3col() {
      const grid = document.getElementById('photo-grid-3col');
      if (!grid) return;
      grid.innerHTML = '';
      const lang = I18n.getLang();
      DataStore.getPhotoReel().forEach((item, i) => {
        const name = lang === 'en' ? item.nameEn : item.nameEs;
        const cell = document.createElement('a');
        cell.href = `especie.html?id=${item.speciesId}`;
        cell.className = 'photo-grid-3col__item';
        cell.innerHTML = `<img src="${item.url}" alt="${name}" loading="${i < 9 ? 'eager' : 'lazy'}">`;
        grid.appendChild(cell);
      });
    }

    // Mosaico estilo Pinterest — proporción real, sin recortar.
    // Se calcula la columna de cada foto en JS (columna más corta primero,
    // usando el ratio real de cada imagen) en vez de dejar que el navegador
    // balancee con CSS columns — ese balanceo se recalculaba a medida que
    // se insertaba contenido y se veía como fotos "saltando" de columna.
    function renderPhotoMasonry() {
      const masonry = document.getElementById('photo-masonry');
      if (!masonry) return;
      masonry.innerHTML = '';
      const lang = I18n.getLang();
      const cols = [document.createElement('div'), document.createElement('div')];
      cols.forEach(c => c.className = 'photo-masonry__col');
      const colHeights = [0, 0];

      DataStore.getPhotoReel().forEach((item, i) => {
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

    // Selector de modalidad de vista — recuerda la preferencia del usuario
    const VIEW_KEY = 'ab_photo_view';
    function initViewSwitcher() {
      const buttons = document.querySelectorAll('.view-switcher__btn');
      const views = {
        reel: document.getElementById('view-reel'),
        grid: document.getElementById('view-grid'),
        masonry: document.getElementById('view-masonry'),
      };

      function setView(view) {
        Object.keys(views).forEach(key => {
          views[key].hidden = key !== view;
        });
        buttons.forEach(btn => {
          const active = btn.dataset.view === view;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        localStorage.setItem(VIEW_KEY, view);
      }

      buttons.forEach(btn => {
        btn.addEventListener('click', () => setView(btn.dataset.view));
      });

      const saved = localStorage.getItem(VIEW_KEY);
      setView(saved && views[saved] ? saved : 'reel');
    }

    async function renderBioGrid() {
      const speciesLabel = I18n.t('species_count');
      const grid = document.getElementById('bio-grid');
      if (!grid) return;
      grid.innerHTML = '';
      let total = 0;

      await Promise.all(HOME_GROUPS.map(async g => {
        const count = DataStore.countSpeciesByGroup(g.id);
        total += count;
        const name = I18n.t(`groups.${g.id}`);
        const countLabel = count > 0 ? `${count} ${speciesLabel}` : I18n.t('coming_soon');

        const card = document.createElement('a');
        card.href = `listado.html?grupo=${g.id}`;
        card.className = `bio-card bio-card--${g.id} ripple-container`;
        card.style.textDecoration = 'none';
        card.innerHTML = `
          <img src="${g.icon}" class="bio-card__icon" alt="" width="48" height="48">
          <span class="bio-card__name">${name}</span>
          <span class="bio-card__count">${countLabel}</span>
        `;

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
      }));

      const totalEl = document.getElementById('total-species');
      if (totalEl) totalEl.textContent = total;

      // Cuenta los grupos que de verdad se muestran en la cuadrícula de
      // abajo (con especies o "Próximamente") — así el número del stat de
      // arriba nunca queda desincronizado del contenido real.
      const groupsEl = document.getElementById('total-groups');
      if (groupsEl) groupsEl.textContent = HOME_GROUPS.length;
    }

    document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      renderPhotoReel();
      renderPhotoGrid3col();
      renderPhotoMasonry();
      initViewSwitcher();
      await renderBioGrid();

      // Los nombres de especie/grupo se generan una vez desde JS (no llevan
      // data-i18n), así que I18n.apply() no los toca — hay que repintarlos
      // a mano cuando el usuario cambia de idioma.
      document.addEventListener('langchange', () => {
        renderPhotoReel();
        renderPhotoGrid3col();
        renderPhotoMasonry();
        renderBioGrid();
      });

      document.querySelectorAll('.mode-card.ripple-container, .stat-chip--link.ripple-container').forEach(btn => {
        btn.addEventListener('click', function(e) {
          const ripple = document.createElement('span');
          ripple.className = 'ripple';
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });
      });

      // Panel de búsqueda (bottom sheet) — se abre desde el FAB sobre el carrete
      const fab = document.getElementById('reel-fab');
      const sheetOverlay = document.getElementById('filter-sheet-overlay');
      const sheet = document.getElementById('filter-sheet');
      const sheetClose = document.getElementById('filter-sheet-close');

      function openSheet() {
        sheetOverlay.classList.add('open');
        sheet.classList.add('open');
      }
      function closeSheet() {
        sheetOverlay.classList.remove('open');
        sheet.classList.remove('open');
      }
      fab.addEventListener('click', openSheet);
      sheetClose.addEventListener('click', closeSheet);
      sheetOverlay.addEventListener('click', closeSheet);

      // Stat "Especies" — cierra el panel y cambia el carrete principal a
      // vista cuadrícula, reusando el mismo botón del header (misma lógica
      // de guardar preferencia en localStorage que ya tiene initViewSwitcher).
      const statEspecies = document.getElementById('stat-especies-link');
      const gridBtn = document.querySelector('.view-switcher__btn[data-view="grid"]');
      statEspecies?.addEventListener('click', () => {
        closeSheet();
        gridBtn?.click();
      });
    });
