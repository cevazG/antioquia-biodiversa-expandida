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

      document.getElementById('subregion-filter').addEventListener('change', e => {
        _activeSubregion = e.target.value;
        renderList();
      });

      document.addEventListener('langchange', () => { buildMonthChips(); renderList(); });

      await setMonth(_index[0].id);
    });

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
      document.getElementById('subregion-filter').value = 'all';

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

      renderList();
    }

    function renderList() {
      const lang = I18n.getLang();
      const list = document.getElementById('photo-list');
      list.innerHTML = '';

      const visible = _photos.filter(f =>
        _activeSubregion === 'all' || f.subregion === _activeSubregion
      );

      if (visible.length === 0) {
        const msg = document.createElement('p');
        msg.style.cssText = 'text-align:center;padding:var(--space-xxl);color:var(--color-text-light)';
        msg.textContent = I18n.t('no_results') || 'Sin resultados';
        list.appendChild(msg);
        return;
      }

      visible.forEach(foto => {
        const titulo = lang === 'en' && foto.tituloEn ? foto.tituloEn : foto.tituloEs;
        const desc   = lang === 'en' && foto.descripcionEn ? foto.descripcionEn : foto.descripcionEs;
        const subNombre = SUBREGION_NAMES[foto.subregion] || foto.subregion;

        const card = document.createElement('div');
        card.className = 'photo-card anim-fade-in-up';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', titulo);

        card.innerHTML = `
          <div class="photo-card__img-wrap">
            <img src="${foto.foto}" alt="${titulo}" loading="lazy" onerror="this.style.display='none'">
            <div class="photo-card__placeholder">💧</div>
          </div>
          <div class="photo-card__info">
            <div class="photo-card__title">${titulo}</div>
            <div class="photo-card__badges">
              <span class="badge-subregion">📍 ${subNombre}</span>
              <span class="badge-cuenca">🌊 ${foto.cuenca}</span>
            </div>
            <p class="photo-card__desc">${desc}</p>
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
        <span class="badge-subregion">📍 ${subNombre}</span>
        <span class="badge-cuenca">🌊 ${foto.cuenca}</span>
        <span class="badge-municipio">🏘️ ${foto.municipio}</span>`;
      document.getElementById('modal-desc').textContent = desc || '';
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
