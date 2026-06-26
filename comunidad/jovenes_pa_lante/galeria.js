const SUBREGION_NAMES = {
      uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
      bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
      magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
      oriente: 'Oriente', suroeste: 'Suroeste'
    };

    const GROUP_EMOJI = {
      aves: '🦜', anfibios_reptiles: '🐸', mariposas: '🦋',
      polillas: '🦗', orquideas: '🌸', mamiferos: '🦌',
      animales_domesticos: '🐄', peces: '🐟', arboles_nativos: '🌳'
    };

    const FAMILY_EMOJI = {
      // Mamíferos
      bradypodidae:   '🦥', choloepodidae:  '🦥',
      callitrichidae: '🐒', cebidae:        '🐒',
      atelidae:       '🐒', aotidae:        '🐒',
      procyonidae:    '🦝', trichechidae:   '🦭',
      felidae:        '🐆', mustelidae:     '🦦',
      ursidae_andean: '🐻', canidae:        '🦊',
      sciuridae:      '🐿️', caviidae:      '🦫',
      dasyproctidae:  '🦫',
      // Anfibios y reptiles
      elapidae:       '🐍',
      // Aves
      cracidae:       '🐓', ramphastidae:   '🦜',
    };

    function getEmoji(foto) {
      return FAMILY_EMOJI[foto.familia] || GROUP_EMOJI[foto.grupo] || '🌿';
    }

    // Normaliza el campo foto/fotos para compatibilidad con datos estáticos (foto: string) y BD (fotos: [])
    function getImgs(foto) {
      if (foto.fotos && foto.fotos.length) return foto.fotos;
      if (foto.foto) return [foto.foto];
      return [];
    }

    let _index    = [];   // array de meses del índice
    let _cache    = {};   // { "2026-06": { fotos: [...] } }
    let _photos   = [];   // fotos del mes activo
    let _activeMonth    = null;
    let _activeGroup    = 'all';
    let _activeSubregion = 'all';
    let _modalFoto      = null;
    let _modalImgIdx    = 0;

    document.addEventListener('DOMContentLoaded', async () => {
      await I18n.init();

      const res  = await fetch('data/fotos_biodiversidad.json');
      const data = await res.json();
      _index = data.meses;

      buildMonthChips();

      document.addEventListener('langchange', () => {
        buildMonthChips();
        buildGroupChips();
        buildSubregionChips();
        renderGrid();
      });

      // Cargar el mes más reciente por defecto
      await setMonth(_index[0].id);
    });

    function buildMonthChips() {
      const lang = I18n.getLang();
      const row  = document.getElementById('month-filters');
      row.innerHTML = '';
      _index.forEach(m => {
        let label;
        if (m.titulo) {
          label = lang === 'en' ? (m.tituloEn || m.titulo) : m.titulo;
        } else {
          label = (lang === 'en' ? m.mesEn : m.mes) + ' ' + m.año;
        }
        const btn = document.createElement('button');
        btn.className = 'month-chip' + (m.id === _activeMonth ? ' active' : '');
        btn.dataset.monthId = m.id;
        btn.textContent = label;
        btn.addEventListener('click', () => setMonth(m.id));
        row.appendChild(btn);
      });
    }

    async function setMonth(id) {
      _activeMonth = id;
      _activeGroup = 'all';
      _activeSubregion = 'all';

      // Actualizar chips de mes
      document.querySelectorAll('.month-chip').forEach(b =>
        b.classList.toggle('active', b.dataset.monthId === id)
      );

      // Cargar datos (con caché)
      if (!_cache[id]) {
        const entry = _index.find(m => m.id === id);
        const res   = await fetch(entry.archivo);
        _cache[id]  = await res.json();
      }

      const monthData = _cache[id];
      _photos = monthData.fotos;

      // Actualizar context bar
      const lang = I18n.getLang();
      let galleryTitle;
      if (monthData.titulo) {
        galleryTitle = lang === 'en' ? (monthData.tituloEn || monthData.titulo) : monthData.titulo;
      } else {
        const mesLabel = lang === 'en' ? (monthData.mesEn || monthData.mes) : monthData.mes;
        galleryTitle = `${mesLabel} ${monthData.año}`;
      }
      document.getElementById('gallery-title').textContent = galleryTitle;

      buildGroupChips();
      buildSubregionChips();
      renderGrid();
    }

    function buildSubregionChips() {
      const subregions = [...new Set(_photos.map(f => f.subregion).filter(Boolean))];
      const row = document.getElementById('subregion-filters');
      row.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.className = 'filter-chip filter-chip--sub' + (_activeSubregion === 'all' ? ' active' : '');
      allBtn.dataset.sub = 'all';
      allBtn.textContent = I18n.t('all_subregions') || 'Todas las subregiones';
      allBtn.addEventListener('click', () => setSubregion('all'));
      row.appendChild(allBtn);

      subregions.sort().forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip filter-chip--sub' + (_activeSubregion === s ? ' active' : '');
        btn.dataset.sub = s;
        btn.textContent = '📍 ' + (SUBREGION_NAMES[s] || s);
        btn.addEventListener('click', () => setSubregion(s));
        row.appendChild(btn);
      });
    }

    function setSubregion(value) {
      _activeSubregion = value;
      document.querySelectorAll('#subregion-filters .filter-chip--sub').forEach(b =>
        b.classList.toggle('active', b.dataset.sub === value)
      );
      renderGrid();
    }

    function buildGroupChips() {
      const groups = [...new Set(_photos.map(f => f.grupo))];
      const row = document.getElementById('group-filters');
      row.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.className = 'filter-chip active';
      allBtn.dataset.group = 'all';
      allBtn.textContent = I18n.t('all_groups') || 'Todos';
      allBtn.addEventListener('click', () => setGroup('all'));
      row.appendChild(allBtn);

      groups.forEach(g => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.dataset.group = g;
        btn.textContent = `${GROUP_EMOJI[g] || '🌿'} ${I18n.t('groups.' + g) || g}`;
        btn.addEventListener('click', () => setGroup(g));
        row.appendChild(btn);
      });
    }

    function setGroup(group) {
      _activeGroup = group;
      document.querySelectorAll('#group-filters .filter-chip').forEach(b =>
        b.classList.toggle('active', b.dataset.group === group)
      );
      renderGrid();
    }

    function getFiltered() {
      return _photos.filter(f => {
        if (_activeGroup !== 'all' && f.grupo !== _activeGroup) return false;
        if (_activeSubregion !== 'all' && f.subregion !== _activeSubregion) return false;
        return true;
      });
    }

    function updateResultsCount(shown, total) {
      const label = I18n.t('jpl_fotos_count') || 'fotografías';
      document.getElementById('results-count').textContent =
        shown === total ? `${total} ${label}` : `${shown} de ${total} ${label}`;
    }

    function renderGrid() {
      const lang = I18n.getLang();
      const grid = document.getElementById('photo-grid');
      grid.innerHTML = '';

      const list = getFiltered();
      updateResultsCount(list.length, _photos.length);

      if (list.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'no-results visible';
        msg.textContent = I18n.t('no_results') || 'Sin resultados';
        grid.appendChild(msg);
        return;
      }

      list.forEach(foto => {
        const nombre   = lang === 'en' && foto.especieEn ? foto.especieEn : foto.especieEs;
        const subNombre = SUBREGION_NAMES[foto.subregion] || foto.subregion;
        const emoji    = getEmoji(foto) || '🌿';

        const card = document.createElement('div');
        card.className = 'photo-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${nombre} · ${subNombre}`);
        card.innerHTML = `
          <div class="photo-card__img-wrap">
            <img src="${getImgs(foto)[0] || ''}" alt="${nombre}" loading="lazy" onerror="this.style.display='none'">
            <div class="photo-card__placeholder">${emoji}</div>
            <span class="photo-card__iucn-overlay badge-iucn badge-iucn--${foto.iucn}">${foto.iucn}</span>
            ${foto.endemica ? `<span class="photo-card__endemic-overlay">🏔️ Endémica</span>` : ''}
          </div>
          <div class="photo-card__info">
            <div class="photo-card__name">${nombre}</div>
            <div class="photo-card__sci">${foto.especieCientifico}</div>
            <span class="photo-card__subregion">📍 ${subNombre}</span>
            <div class="photo-card__credit">© ${foto.credito}</div>
          </div>`;

        card.addEventListener('click', () => openModal(foto));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(foto); });
        grid.appendChild(card);
      });
    }

    function openModal(foto) {
      _modalFoto    = foto;
      _modalImgIdx  = 0;

      const lang      = I18n.getLang();
      const nombre    = lang === 'en' && foto.especieEn ? foto.especieEn : foto.especieEs;
      const desc      = lang === 'en' && foto.descripcionEn ? foto.descripcionEn : foto.descripcionEs;
      const subNombre = SUBREGION_NAMES[foto.subregion] || foto.subregion;
      const emoji     = getEmoji(foto) || '🌿';

      document.getElementById('modal-placeholder').textContent = emoji;
      showModalImg(0);

      document.getElementById('modal-name').textContent = nombre;
      document.getElementById('modal-sci').textContent  = foto.especieCientifico;
      document.getElementById('modal-badges').innerHTML = `
        <span class="badge-iucn badge-iucn--${foto.iucn}">${foto.iucn} · ${I18n.t('iucn_' + foto.iucn) || foto.iucn}</span>
        ${foto.endemica ? `<span class="badge-endemic">🏔️ ${I18n.t('endemica') || 'Endémica Antioquia'}</span>` : ''}
        <span class="badge-subregion">📍 ${subNombre}</span>
        <span class="badge-municipio">🏘️ ${foto.municipio}</span>
        <span class="badge-group badge-group--${foto.grupo}">${emoji} ${I18n.t('groups.' + foto.grupo) || foto.grupo}</span>`;
      document.getElementById('modal-desc').textContent        = desc || '';
      document.getElementById('modal-credit-text').textContent = foto.credito;

      document.getElementById('modal-overlay').classList.add('open');
      document.getElementById('modal-sheet').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function showModalImg(idx) {
      const imgs    = getImgs(_modalFoto);
      const img     = document.getElementById('modal-img');
      const ph      = document.getElementById('modal-placeholder');
      const dotsEl  = document.getElementById('modal-dots');
      const counter = document.getElementById('modal-counter');
      _modalImgIdx  = idx;

      img.src = ''; img.style.display = 'block'; ph.style.display = 'none';
      img.onerror = () => { img.style.display = 'none'; ph.style.display = 'flex'; };
      img.src = imgs[idx] || ''; img.alt = _modalFoto.especieEs || '';

      if (imgs.length > 1) {
        dotsEl.innerHTML = imgs.map((_, i) =>
          `<div class="modal-dot${i === idx ? ' active' : ''}" onclick="showModalImg(${i})"></div>`
        ).join('');
        dotsEl.style.display  = '';
        counter.textContent   = `${idx + 1} / ${imgs.length}`;
        counter.style.display = '';
      } else {
        dotsEl.style.display  = 'none';
        counter.style.display = 'none';
      }
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.remove('open');
      document.getElementById('modal-sheet').classList.remove('open');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Tap en la foto avanza a la siguiente; swipe táctil para navegar
    (function () {
      const photoEl = document.getElementById('modal-photo');
      let startX = 0;
      photoEl.addEventListener('click', e => {
        if (e.target.closest('.modal-close') || e.target.closest('.modal-dot')) return;
        const imgs = getImgs(_modalFoto);
        if (imgs.length > 1) showModalImg((_modalImgIdx + 1) % imgs.length);
      });
      photoEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      photoEl.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        const imgs = getImgs(_modalFoto);
        if (Math.abs(diff) > 40 && imgs.length > 1) {
          const next = Math.max(0, Math.min(imgs.length - 1, _modalImgIdx + (diff > 0 ? 1 : -1)));
          showModalImg(next);
        }
      });
    })();
