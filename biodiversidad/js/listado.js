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
      arboles_nativos:     { deco: '🌳', kingdom: 'flora', i18nKey: 'native_trees' }
    };

    const KINGDOM_META = {
      flora: { deco: '🌿', label: 'Flora' },
      fauna: { deco: '🦜', label: 'Fauna' }
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
        } else {
          _filterAccordion(query);
        }
      });
    });

    // ── Modo Flora / Fauna ──────────────────────────────────

    function _setupKingdomMode() {
      const km = KINGDOM_META[_kingdom];
      document.getElementById('header-title').textContent = km.label;
      document.getElementById('context-deco').textContent = km.deco;
      document.getElementById('context-title').textContent = km.label;
      document.getElementById('context-sub').textContent = I18n.t('by_species_desc');
      document.getElementById('context-breadcrumb').textContent = 'Antioquia › ' + km.label;

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
        });
      });

      _renderAccordion(I18n.getLang(), null, _kingdom);
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
