const REGION_NAMES = {
      uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
      bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
      magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
      oriente: 'Oriente', suroeste: 'Suroeste'
    };

    const GROUP_META = {
      aves:              { deco: '🦜', kingdom: 'fauna', i18nKey: 'birds' },
      anfibios_reptiles: { deco: '🐸', kingdom: 'fauna', i18nKey: 'amphibians_reptiles' },
      mariposas:         { deco: '🦋', kingdom: 'fauna', i18nKey: 'butterflies' },
      polillas:          { deco: '🦗', kingdom: 'fauna', i18nKey: 'moths' },
      mamiferos:           { deco: '🦌', kingdom: 'fauna', i18nKey: 'mammals' },
      animales_domesticos: { deco: '🐄', kingdom: 'fauna', i18nKey: 'domestic_animals' },
      peces:               { deco: '🐟', kingdom: 'fauna', i18nKey: 'freshwater_fish' },
      orquideas:           { deco: '🌸', kingdom: 'flora', i18nKey: 'orchids' },
      arboles_nativos:     { deco: '🌳', kingdom: 'flora', i18nKey: 'native_trees' },
      hongos:              { deco: '🍄', kingdom: 'fungi', i18nKey: 'fungi' }
    };

    const KINGDOM_META = {
      flora: { deco: '🌿', i18nKey: 'by_flora' },
      fauna: { deco: '🦜', i18nKey: 'by_fauna' },
      fungi: { deco: '🍄', i18nKey: 'by_fungi' }
    };

    const FAMILY_EMOJI = {
      bradypodidae:   '🦥', choloepodidae:  '🦥',
      callitrichidae: '🐒', cebidae:        '🐒',
      atelidae:       '🐒', aotidae:        '🐒',
      procyonidae:    '🦝', trichechidae:   '🦭',
      felidae:        '🐆', mustelidae:     '🦦',
      ursidae_andean: '🐻', canidae:        '🦊',
      sciuridae:      '🐿️', caviidae:      '🦫',
      dasyproctidae:  '🦫', elapidae:      '🐍',
      cracidae:       '🐓', ramphastidae:   '🦜',
    };

    function getSpeciesEmoji(sp) {
      return FAMILY_EMOJI[sp.familyId] || GROUP_META[sp.group]?.deco || '🌿';
    }

    let _subregionId, _grupo, _kingdom, _activeGroupFilter = 'all';

    document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      _subregionId = Nav.getParam('subregion');
      _grupo       = Nav.getParam('grupo');
      _kingdom     = Nav.getParam('kingdom');

      _initKingdomReel();

      if (_kingdom) {
        _setupKingdomMode();
      } else {
        _setupListadoMode();
      }

      // Buscador con debounce
      App.initSearch('search-input', async (query) => {
        if (_kingdom) {
          const group = _activeGroupFilter === 'all' ? null : _activeGroupFilter;
          await _renderSearchResults(query, group, _kingdom);
          _refreshKingdomReelViews(query || null, group);
        } else {
          _filterAccordion(query);
          _refreshKingdomReelViews(query || null, _grupo);
        }
      });
    });

    // ── Modo Flora / Fauna ──────────────────────────────────

    function _setupKingdomMode() {
      const km = KINGDOM_META[_kingdom];
      _refreshKingdomLabels(km);
      document.addEventListener('langchange', () => {
        _refreshKingdomLabels(km);
        const query = document.getElementById('search-input').value.trim();
        const group = _activeGroupFilter === 'all' ? null : _activeGroupFilter;
        _refreshKingdomReelViews(query || null, group);
      });

      document.getElementById('reel-view-btn').hidden = false;

      // Chips de grupo filtrados por reino
      const filterBar = document.getElementById('filter-bar');
      filterBar.style.display = 'flex';

      const groups = Object.entries(GROUP_META).filter(([, m]) => m.kingdom === _kingdom);
      filterBar.innerHTML = `<button class="filter-chip active" data-group="all">${I18n.t('all_groups') || 'Todos'}</button>`;
      groups.forEach(([id, m]) => {
        const label = I18n.t(m.i18nKey) || id;
        filterBar.innerHTML += `<button class="filter-chip" data-group="${id}">${m.deco} ${label}</button>`;
      });

      filterBar.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', async () => {
          filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          _activeGroupFilter = chip.dataset.group;
          const query = document.getElementById('search-input').value.trim();
          const group = _activeGroupFilter === 'all' ? null : _activeGroupFilter;
          await _renderAccordion(I18n.getLang(), group, _kingdom);
          _refreshKingdomReelViews(query || null, group);
        });
      });

      _renderAccordion(I18n.getLang(), null, _kingdom);
      _refreshKingdomReelViews(null, null);
    }

    // ── Carrete de fotos del reino actual (overlay, 3 modalidades) ───
    // Refleja siempre los filtros activos del listado (chip de grupo, búsqueda).

    const KINGDOM_VIEW_KEY = 'ab_photo_view';
    let _kingdomReelData = [];

    function _initKingdomReel() {
      const btn = document.getElementById('reel-view-btn');
      const overlay = document.getElementById('reel-overlay');
      const closeBtn = document.getElementById('reel-overlay-close');

      btn.addEventListener('click', () => { overlay.hidden = false; });
      closeBtn.addEventListener('click', () => { overlay.hidden = true; });

      // Si el navegador restaura esta página desde el back-forward cache
      // (gesto de "atrás" en Safari/Chrome), el overlay puede quedar
      // abierto tal como estaba, sin que el JS vuelva a correr — se fuerza
      // a cerrado en cada restauración.
      window.addEventListener('pageshow', (e) => { if (e.persisted) overlay.hidden = true; });

      const switcherBtns = overlay.querySelectorAll('.view-switcher__btn');
      const kviews = {
        reel:    document.getElementById('kreel-view-reel'),
        grid:    document.getElementById('kreel-view-grid'),
        masonry: document.getElementById('kreel-view-masonry'),
      };
      function setKView(view) {
        Object.keys(kviews).forEach(key => { kviews[key].hidden = key !== view; });
        switcherBtns.forEach(b => {
          const active = b.dataset.view === view;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        localStorage.setItem(KINGDOM_VIEW_KEY, view);
      }
      switcherBtns.forEach(b => b.addEventListener('click', () => setKView(b.dataset.view)));
      const saved = localStorage.getItem(KINGDOM_VIEW_KEY);
      setKView(saved && kviews[saved] ? saved : 'reel');
    }

    // Recalcula el set de fotos (según reino/subregión + grupo activo +
    // búsqueda) y vuelve a pintar las 3 vistas, para que el carrete quede
    // sincronizado con lo que el usuario está filtrando en el listado.
    // _subregionId es null en modo flora/fauna, así que ahí no filtra nada.
    function _refreshKingdomReelViews(query = null, group = null) {
      _kingdomReelData = DataStore.getPhotoReel({ kingdom: _kingdom, subregion: _subregionId, group, query });
      _renderKingdomReel();
      _renderKingdomGrid();
      _renderKingdomMasonry();
    }

    function _renderKingdomReel() {
      const reel = document.getElementById('kingdom-photo-reel');
      const lang = I18n.getLang();
      reel.innerHTML = '';
      _kingdomReelData.forEach((item, i) => {
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

    function _renderKingdomGrid() {
      const grid = document.getElementById('kingdom-photo-grid');
      const lang = I18n.getLang();
      grid.innerHTML = '';
      _kingdomReelData.forEach((item, i) => {
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
    function _renderKingdomMasonry() {
      const masonry = document.getElementById('kingdom-photo-masonry');
      const lang = I18n.getLang();
      masonry.innerHTML = '';
      const cols = [document.createElement('div'), document.createElement('div')];
      cols.forEach(c => c.className = 'photo-masonry__col');
      const colHeights = [0, 0];

      _kingdomReelData.forEach((item, i) => {
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

    function _refreshKingdomLabels(km) {
      const label = I18n.t(km.i18nKey);
      document.getElementById('header-title').textContent = label;
      document.getElementById('context-deco').textContent = km.deco;
      document.getElementById('context-title').textContent = label;
      document.getElementById('context-sub').textContent = I18n.t('by_species_desc');
      document.getElementById('context-breadcrumb').textContent = 'Antioquia › ' + label;
    }

    // ── Modo subregión / grupo (flujo existente) ────────────

    function _setupListadoMode() {
      const lang = I18n.getLang();
      const subregionName = _subregionId ? REGION_NAMES[_subregionId] : null;
      const groupMeta = _grupo ? GROUP_META[_grupo] : null;
      const groupLabel = groupMeta ? I18n.t(groupMeta.i18nKey) : '';

      let breadcrumb = 'Antioquia';
      if (subregionName) breadcrumb += ' › ' + subregionName;
      if (groupLabel)    breadcrumb += ' › ' + groupLabel;

      document.getElementById('context-breadcrumb').textContent = breadcrumb;
      document.getElementById('context-deco').textContent = groupMeta?.deco || '🌿';
      document.getElementById('context-title').textContent = groupLabel || I18n.t('species');
      if (subregionName) document.getElementById('context-sub').textContent = subregionName;
      document.getElementById('header-title').textContent = groupLabel || I18n.t('species');

      // El carrete sí aplica en este modo — muestra solo el grupo de esta
      // subregión (a diferencia del modo flora/fauna, aquí no hay chips
      // para cambiar de grupo, así que el filtro queda fijo en _grupo).
      document.getElementById('reel-view-btn').hidden = false;
      _refreshKingdomReelViews(null, _grupo);

      document.addEventListener('langchange', () => {
        _refreshKingdomReelViews(
          document.getElementById('search-input').value.trim() || null,
          _grupo
        );
      });

      _renderAccordion(lang, _grupo, null, _subregionId);
    }

    // ── Acordeón (familias → especies) ──────────────────────

    async function _renderAccordion(lang, group = null, kingdom = null, subregion = null) {
      const body = document.getElementById('listado-body');
      body.innerHTML = `<p class="results-count">Cargando...</p>`;

      const familiesWithSpecies = DataStore.getFamiliesWithSpecies(group, subregion, kingdom);
      const totalSpecies = familiesWithSpecies.reduce((s, f) => s + f.species.length, 0);

      body.innerHTML = `
        <p class="results-count">
          <strong>${totalSpecies}</strong> ${I18n.t('species_count')} ·
          <strong>${familiesWithSpecies.length}</strong> ${I18n.t('families') || 'familias'}
        </p>
      `;

      if (familiesWithSpecies.length === 0) { body.innerHTML += _emptyState(); return; }

      familiesWithSpecies.forEach(family => {
        const familyNameLang = lang === 'en' ? family.nameEn : family.nameEs;
        const gm = GROUP_META[family.group];
        const accordion = document.createElement('div');
        accordion.className = 'family-accordion anim-fade-in-up';
        accordion.innerHTML = `
          <button class="family-header" aria-expanded="false">
            <div class="family-header__icon" style="font-size:1.5rem">${FAMILY_EMOJI[family.id] || gm?.deco || '🌿'}</div>
            <div class="family-header__text">
              <div class="family-header__name">${familyNameLang}</div>
              <div class="family-header__count">
                <em style="font-style:italic;font-size:0.8rem;color:var(--color-text-light)">${_toSentenceCase(family.id)}</em>
                · ${family.species.length} ${I18n.t('species_count')}
              </div>
            </div>
            <svg class="family-header__chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="family-body">
            ${family.species.map(sp => _speciesCard(sp, lang)).join('')}
          </div>
        `;
        body.appendChild(accordion);
      });

      App.initAccordion('#listado-body');
    }

    // ── Resultados de búsqueda (lista plana) ─────────────────

    async function _renderSearchResults(query, group, kingdom) {
      const body = document.getElementById('listado-body');
      const lang = I18n.getLang();
      body.innerHTML = `<p class="results-count">Buscando...</p>`;

      const results = DataStore.searchSpecies(query, group, kingdom);

      body.innerHTML = `
        <p class="results-count">
          <strong>${results.length}</strong> ${I18n.t('species_count')}
          ${query ? ' · "' + query + '"' : ''}
        </p>
      `;

      if (results.length === 0) { body.innerHTML += _emptyState(); return; }

      const container = document.createElement('div');
      container.className = 'anim-stagger';
      results.forEach(sp => {
        const gm = GROUP_META[sp.group];
        const nameComun = lang === 'en' ? sp.nameEn : sp.nameEs;
        const mainPhoto = DataStore.getMainPhoto(sp);
        const card = document.createElement('a');
        card.href = `especie.html?id=${sp.id}`;
        card.className = 'search-result-card anim-fade-in-up';
        card.setAttribute('aria-label', nameComun);
        card.innerHTML = `
          <div class="search-result-card__photo" style="overflow:hidden;">${
            mainPhoto
              ? `<img src="${mainPhoto}" alt="${nameComun}" style="width:100%;height:100%;object-fit:cover;">`
              : getSpeciesEmoji(sp)
          }</div>
          <div class="search-result-card__info">
            <div class="search-result-card__common">${nameComun}</div>
            <div class="search-result-card__scientific">${sp.scientificName}</div>
            <div class="search-result-card__meta">
              ${App.iucnBadge(sp.iucn)}
              ${App.groupBadge(sp.group)}
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-green-primary)" stroke-width="2.5" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        `;
        container.appendChild(card);
      });
      body.appendChild(container);
    }

    function _speciesCard(sp, lang) {
      const nameComun = lang === 'en' ? sp.nameEn : sp.nameEs;
      const gm = GROUP_META[sp.group];
      const mainPhoto = DataStore.getMainPhoto(sp);
      const photoContent = mainPhoto
        ? `<img src="${mainPhoto}" alt="${nameComun}" style="width:100%;height:100%;object-fit:cover;">`
        : `<span style="font-size:1.75rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${getSpeciesEmoji(sp)}</span>`;
      return `
        <a href="especie.html?id=${sp.id}" class="species-card" aria-label="${nameComun}">
          <div class="species-card__photo" style="overflow:hidden;">${photoContent}</div>
          <div class="species-card__info">
            <div class="species-card__common">${nameComun}</div>
            <div class="species-card__scientific">${sp.scientificName}</div>
            <div class="species-card__badges">${App.iucnBadge(sp.iucn)}</div>
          </div>
          <svg class="species-card__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </a>
      `;
    }

    function _filterAccordion(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('.family-accordion').forEach(acc => {
        acc.style.display = acc.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }

    function _emptyState() {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <div class="empty-state__title">${I18n.t('no_results')}</div>
          <div class="empty-state__desc">${I18n.t('no_results_desc')}</div>
        </div>
      `;
    }

    function _toSentenceCase(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
    }
