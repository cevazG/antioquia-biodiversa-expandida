const SUBREGION_NAMES = {
      uraba: 'Urabá', occidente: 'Occidente', norte: 'Norte',
      bajo_cauca: 'Bajo Cauca', nordeste: 'Nordeste',
      magdalena_medio: 'Magdalena Medio', valle_aburra: 'Valle de Aburrá',
      oriente: 'Oriente', suroeste: 'Suroeste'
    };

    let _index   = [];
    let _cache   = {};
    let _photos  = [];
    let _activeMonth     = null;
    let _activeSubregion = 'all';

    document.addEventListener('DOMContentLoaded', async () => {
      await I18n.init();

      const res  = await fetch('data/fotos_cuencas.json');
      const data = await res.json();
      _index = data.meses;

      buildMonthChips();
      initViewSwitcher();

      document.addEventListener('langchange', () => { buildMonthChips(); buildSubregionChips(); renderAll(); });

      await setMonth(_index[0].id);
    });

    function buildSubregionChips() {
      const row = document.getElementById('subregion-filters');
      row.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.className = 'filter-chip filter-chip--sub' + (_activeSubregion === 'all' ? ' active' : '');
      allBtn.dataset.sub = 'all';
      allBtn.textContent = I18n.t('all_subregions') || 'Todas las subregiones';
      allBtn.addEventListener('click', () => setSubregion('all'));
      row.appendChild(allBtn);

      const subregions = [...new Set(_photos.map(f => f.subregion).filter(Boolean))].sort();
      subregions.forEach(s => {
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
      renderAll();
    }

    function buildMonthChips() {
      const lang = I18n.getLang();
      const row  = document.getElementById('month-filters');
      row.innerHTML = '';
      _index.forEach(m => {
        const label = (lang === 'en' ? m.mesEn : m.mes) + ' ' + m.año;
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
      _activeSubregion = 'all';

      document.querySelectorAll('.month-chip').forEach(b =>
        b.classList.toggle('active', b.dataset.monthId === id)
      );

      if (!_cache[id]) {
        const entry = _index.find(m => m.id === id);
        const res   = await fetch(entry.archivo);
        _cache[id]  = await res.json();
      }

      const monthData = _cache[id];
      _photos = monthData.fotos;

      const lang = I18n.getLang();
      const mesLabel = lang === 'en' ? (monthData.mesEn || monthData.mes) : monthData.mes;
      document.getElementById('gallery-sub').textContent =
        `${_photos.length} ${I18n.t('gc_fotos_count') || 'fotografías'} · ${mesLabel} ${monthData.año}`;

      buildSubregionChips();
      renderAll();
    }

    function getVisible() {
      return _photos.filter(f => _activeSubregion === 'all' || f.subregion === _activeSubregion);
    }

    function emptyStateHtml() {
      return `<p style="text-align:center;padding:var(--space-xxl);color:var(--color-text-light)">${I18n.t('no_results') || 'Sin resultados'}</p>`;
    }

    function renderAll() {
      renderList();
      renderReel();
      renderMasonry();
    }

    function renderList() {
      const lang = I18n.getLang();
      const list = document.getElementById('photo-list');
      list.innerHTML = '';

      const visible = getVisible();

      if (visible.length === 0) {
        const msg = document.createElement('p');
        msg.style.cssText = 'text-align:center;padding:var(--space-xxl);color:var(--color-text-light)';
        msg.textContent = I18n.t('no_results') || 'Sin resultados';
        list.appendChild(msg);
        return;
      }

      visible.forEach(foto => {
        const titulo = lang === 'en' && foto.tituloEn ? foto.tituloEn : foto.tituloEs;
        const subNombre = SUBREGION_NAMES[foto.subregion] || foto.subregion;

        const card = document.createElement('div');
        card.className = 'photo-card anim-fade-in-up';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', titulo);

        card.innerHTML = `
          <div class="photo-card__img-wrap">
            <img src="${foto.foto}" alt="${titulo}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="photo-card__placeholder"><img src="img/icons/guarda-cuencas.svg" alt="" class="photo-card__placeholder-icon"></div>
          </div>
          <div class="photo-card__info">
            <div class="photo-card__title">${titulo}</div>
            <div class="photo-card__badges">
              <a href="../../agua/subregion.html?subregion=${foto.subregion}&tipo=cuencas" class="badge-subregion badge-subregion--link" onclick="event.stopPropagation()" aria-label="Ver cuencas de esta subregión">📍 ${subNombre}</a>
            </div>
            <div class="photo-card__credit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>
              ${foto.credito}
            </div>
          </div>`;

        card.addEventListener('click', () => openModal(foto));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(foto); });
        list.appendChild(card);
      });
    }

    function renderReel() {
      const lang = I18n.getLang();
      const reel = document.getElementById('gc-reel');
      if (!reel) return;
      reel.innerHTML = '';
      const visible = getVisible();
      if (visible.length === 0) { reel.innerHTML = emptyStateHtml(); return; }

      visible.forEach((foto, i) => {
        const titulo = lang === 'en' && foto.tituloEn ? foto.tituloEn : foto.tituloEs;
        const card = document.createElement('div');
        card.className = 'photo-reel__card ripple-container';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', titulo);
        card.innerHTML = `
          <img src="${foto.foto}" alt="${titulo}" loading="${i < 3 ? 'eager' : 'lazy'}">
          <div class="photo-reel__scrim" aria-hidden="true"></div>
          <span class="photo-reel__name">${titulo}</span>`;
        card.addEventListener('click', () => openModal(foto));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(foto); });
        reel.appendChild(card);
      });
    }

    function renderMasonry() {
      const lang = I18n.getLang();
      const masonry = document.getElementById('gc-masonry');
      if (!masonry) return;
      masonry.innerHTML = '';
      const visible = getVisible();
      if (visible.length === 0) { masonry.innerHTML = emptyStateHtml(); return; }

      const cols = [document.createElement('div'), document.createElement('div')];
      cols.forEach(c => c.className = 'photo-masonry__col');
      const colHeights = [0, 0];
      visible.forEach((foto, i) => {
        const titulo = lang === 'en' && foto.tituloEn ? foto.tituloEn : foto.tituloEs;
        const cell = document.createElement('div');
        cell.className = 'photo-masonry__item';
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', titulo);
        cell.innerHTML = `
          <img src="${foto.foto}" alt="${titulo}" loading="${i < 6 ? 'eager' : 'lazy'}">
          <div class="photo-masonry__scrim" aria-hidden="true"></div>
          <span class="photo-masonry__name">${titulo}</span>`;
        cell.addEventListener('click', () => openModal(foto));
        cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(foto); });
        const target = colHeights[0] <= colHeights[1] ? 0 : 1;
        cols[target].appendChild(cell);
        colHeights[target] += 1;
      });
      masonry.appendChild(cols[0]);
      masonry.appendChild(cols[1]);
    }

    // ── Selector de modalidad de vista (mismo patrón que feed.js/biodiversidad.js) ──
    const VIEW_KEY = 'gc_gallery_view';
    function initViewSwitcher() {
      const buttons = document.querySelectorAll('.view-switcher__btn');
      const views = {
        reel: document.getElementById('view-reel'),
        grid: document.getElementById('view-grid'),
        masonry: document.getElementById('view-masonry'),
      };
      const context = document.getElementById('gallery-context');
      const toolbar = document.getElementById('gallery-toolbar');

      function setView(view) {
        Object.keys(views).forEach(key => { views[key].hidden = key !== view; });
        buttons.forEach(btn => {
          const active = btn.dataset.view === view;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        if (context) context.hidden = view === 'reel';
        if (toolbar) toolbar.hidden = view === 'reel';
        localStorage.setItem(VIEW_KEY, view);
      }

      buttons.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
      const saved = localStorage.getItem(VIEW_KEY);
      setView(saved && views[saved] ? saved : 'grid');
    }

    function openModal(foto) {
      const lang = I18n.getLang();
      const titulo = lang === 'en' && foto.tituloEn ? foto.tituloEn : foto.tituloEs;
      const desc   = lang === 'en' && foto.descripcionEn ? foto.descripcionEn : foto.descripcionEs;
      const subNombre = SUBREGION_NAMES[foto.subregion] || foto.subregion;

      const img = document.getElementById('modal-img');
      const placeholder = document.getElementById('modal-placeholder');
      img.src = '';
      img.style.display = 'block';
      placeholder.style.display = 'none';
      img.onerror = () => { img.style.display = 'none'; placeholder.style.display = 'flex'; };
      img.src = foto.foto;
      img.alt = titulo;

      document.getElementById('modal-title').textContent = titulo;
      document.getElementById('modal-badges').innerHTML = `
        <a href="../../agua/subregion.html?subregion=${foto.subregion}&tipo=cuencas" class="badge-subregion badge-subregion--link" aria-label="Ver cuencas de esta subregión">📍 ${subNombre}</a>
        <span class="badge-municipio">🏘️ ${foto.municipio}</span>`;
      const descEl = document.getElementById('modal-desc');
      descEl.textContent = desc || '';
      descEl.style.display = desc ? 'block' : 'none';
      document.getElementById('modal-credit-text').textContent = foto.credito;

      document.getElementById('modal-overlay').classList.add('open');
      document.getElementById('modal-sheet').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.remove('open');
      document.getElementById('modal-sheet').classList.remove('open');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
