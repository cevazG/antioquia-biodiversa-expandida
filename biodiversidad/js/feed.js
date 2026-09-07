/* ============================================================
   ANTIOQUIA NATURAL — feed.js
   Controlador de la página feed (pantalla de entrada de la app).
   Reutiliza el patrón de 3 vistas de biodiversidad.js (carrete /
   cuadrícula / mosaico, misma clave localStorage 'ab_photo_view')
   y el modal de comunidad/jovenes_pa_lante/galeria.js.
   ============================================================ */

const VIEW_KEY   = 'ab_photo_view';      // compartida con el catálogo
const SOURCE_KEY = 'ab_feed_source';

const GROUP_EMOJI = {
  aves: '🦜', anfibios_reptiles: '🐸', mariposas: '🦋', polillas: '🦗',
  orquideas: '🌸', mamiferos: '🦌', animales_domesticos: '🐄', peces: '🐟',
  arboles_nativos: '🌳', hongos: '🍄',
};
const IUCN_CODES = ['LC', 'NT', 'VU', 'EN', 'CR', 'DD', 'NE'];

const _filters = {
  source: localStorage.getItem(SOURCE_KEY) || 'all',
  query: null,
};

let _modalItem = null;
let _modalImgIdx = 0;

// ── Helpers ────────────────────────────────────────────────
function badgeLabel(source) {
  return I18n.t(
    source === 'jpl' ? 'feed_badge_jpl'
    : source === 'gc' ? 'feed_badge_gc'
    : 'feed_badge_catalog'
  );
}
function titleOf(item) {
  const lang = I18n.getLang();
  return (lang === 'en' ? item.titleEn : item.titleEs) || item.titleEs || item.titleEn || '';
}
function emojiOf(item) {
  if (item.source === 'gc') return '💧';
  return GROUP_EMOJI[item.group] || '🌿';
}

// Devuelve <a> (catálogo, navega) o <div role=button> (comunidad, abre modal)
function makeCardEl(item, className) {
  let el;
  if (item.source === 'catalogo' && item.link) {
    el = document.createElement('a');
    el.href = item.link;
  } else {
    el = document.createElement('div');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.classList.add('feed-card--tappable');
    el.addEventListener('click', () => openModal(item));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item); }
    });
  }
  el.className = (el.className ? el.className + ' ' : '') + className;
  return el;
}

function feedBadgeHtml(item) {
  return `<span class="feed-badge feed-badge--${item.source}">${badgeLabel(item.source)}</span>`;
}
function iucnDotHtml(item) {
  if (!item.iucn || !IUCN_CODES.includes(item.iucn)) return '';
  return `<span class="photo-reel__dot photo-reel__dot--${item.iucn}" aria-hidden="true"></span>`;
}

function emptyStateHtml() {
  return `
    <div class="feed-empty">
      <div class="feed-empty__icon">🔍</div>
      <div class="feed-empty__title">${I18n.t('feed_empty')}</div>
      <div class="feed-empty__desc">${I18n.t('feed_empty_desc')}</div>
    </div>`;
}

// ── Render de las 3 vistas ─────────────────────────────────
function renderReel(list) {
  const reel = document.getElementById('feed-reel');
  if (!reel) return;
  reel.innerHTML = '';
  if (!list.length) { reel.innerHTML = emptyStateHtml(); return; }
  list.forEach((item, i) => {
    const name = titleOf(item);
    const card = makeCardEl(item, 'photo-reel__card ripple-container');
    card.innerHTML = `
      <img src="${item.imgs[0]}" alt="${name}" loading="${i < 3 ? 'eager' : 'lazy'}" onerror="this.style.visibility='hidden'">
      <div class="photo-reel__scrim" aria-hidden="true"></div>
      ${feedBadgeHtml(item)}
      ${iucnDotHtml(item)}
      <span class="photo-reel__name">${name}</span>`;
    reel.appendChild(card);
  });
}

function renderGrid(list) {
  const grid = document.getElementById('feed-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!list.length) { grid.innerHTML = emptyStateHtml(); return; }
  list.forEach((item, i) => {
    const name = titleOf(item);
    const cell = makeCardEl(item, 'photo-grid-3col__item');
    cell.innerHTML = `
      <img src="${item.imgs[0]}" alt="${name}" loading="${i < 9 ? 'eager' : 'lazy'}" onerror="this.style.visibility='hidden'">
      ${feedBadgeHtml(item)}`;
    grid.appendChild(cell);
  });
}

function renderMasonry(list) {
  const masonry = document.getElementById('feed-masonry');
  if (!masonry) return;
  masonry.innerHTML = '';
  if (!list.length) { masonry.innerHTML = emptyStateHtml(); return; }
  const cols = [document.createElement('div'), document.createElement('div')];
  cols.forEach((c) => (c.className = 'photo-masonry__col'));
  const colHeights = [0, 0];
  list.forEach((item, i) => {
    const name = titleOf(item);
    const cell = makeCardEl(item, 'photo-masonry__item');
    cell.innerHTML = `
      <img src="${item.imgs[0]}" alt="${name}" loading="${i < 6 ? 'eager' : 'lazy'}" width="${item.width}" height="${item.height}" onerror="this.style.visibility='hidden'">
      <div class="photo-masonry__scrim" aria-hidden="true"></div>
      ${feedBadgeHtml(item)}
      <span class="photo-masonry__name">${name}</span>`;
    const target = colHeights[0] <= colHeights[1] ? 0 : 1;
    cols[target].appendChild(cell);
    colHeights[target] += 1 / (item.ratio || 1);
  });
  masonry.appendChild(cols[0]);
  masonry.appendChild(cols[1]);
}

function renderAll() {
  const list = FeedStore.getItems(_filters);
  renderReel(list);
  renderGrid(list);
  renderMasonry(list);
}

// ── Selector de modalidad de vista (idéntico a biodiversidad.js) ──
function initViewSwitcher() {
  const buttons = document.querySelectorAll('.view-switcher__btn');
  const views = {
    reel: document.getElementById('view-reel'),
    grid: document.getElementById('view-grid'),
    masonry: document.getElementById('view-masonry'),
  };
  const searchRow = document.getElementById('feed-search');
  const modulesLink = document.querySelector('.feed-modules-link');

  function setView(view) {
    Object.keys(views).forEach((key) => { views[key].hidden = key !== view; });
    buttons.forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    // La búsqueda y el enlace a módulos estorban en el carrete inmersivo;
    // se muestran solo en cuadrícula / mosaico
    if (searchRow) searchRow.hidden = view === 'reel';
    if (modulesLink) modulesLink.hidden = view === 'reel';
    localStorage.setItem(VIEW_KEY, view);
  }

  buttons.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  const saved = localStorage.getItem(VIEW_KEY);
  setView(saved && views[saved] ? saved : 'reel');
}

// ── Filtro de fuente (acceso rápido) ──────────────────────
function initSourceTabs() {
  const btns = document.querySelectorAll('.feed-sources__btn');
  function setSource(src) {
    _filters.source = src;
    btns.forEach((b) => {
      const active = b.dataset.source === src;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    localStorage.setItem(SOURCE_KEY, src);
    renderAll();
  }
  btns.forEach((b) => b.addEventListener('click', () => setSource(b.dataset.source)));
  setSource(_filters.source && document.querySelector(`.feed-sources__btn[data-source="${_filters.source}"]`) ? _filters.source : 'all');
}

// ── Modal / visor (adaptado de galeria.js) ────────────────
function openModal(item) {
  _modalItem = item;
  _modalImgIdx = 0;
  const lang = I18n.getLang();
  const name = titleOf(item);
  const desc = (lang === 'en' ? item.descEn : item.descEs) || item.descEs || '';

  const photoEl = document.getElementById('modal-photo');
  photoEl.classList.toggle('modal-photo--wide', item.source === 'gc');
  document.getElementById('modal-placeholder').textContent = emojiOf(item);
  showModalImg(0);
  buildLightbox(item);

  document.getElementById('modal-name').textContent = name;
  const sciEl = document.getElementById('modal-sci');
  sciEl.textContent = item.sciName || '';
  sciEl.style.display = item.sciName ? '' : 'none';

  const badges = [];
  if (item.iucn && IUCN_CODES.includes(item.iucn)) {
    badges.push(`<span class="badge-iucn badge-iucn--${item.iucn}">${item.iucn} · ${I18n.t('iucn_' + item.iucn) || item.iucn}</span>`);
  }
  if (item.endemica) badges.push(`<span class="badge-endemic">🫓 ${I18n.t('tag_endemica') || 'Endémica'}</span>`);
  if (item.subregionName) badges.push(`<span class="badge-subregion">📍 ${item.subregionName}</span>`);
  if (item.municipio) badges.push(`<span class="badge-municipio">🏘️ ${item.municipio}</span>`);
  if (item.cuenca) badges.push(`<span class="badge-cuenca">🌊 ${item.cuenca}</span>`);
  if (item.group) badges.push(`<span class="badge-group badge-group--${item.group}">${GROUP_EMOJI[item.group] || '🌿'} ${I18n.t('groups.' + item.group) || item.group}</span>`);
  document.getElementById('modal-badges').innerHTML = badges.join('');

  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('modal-desc').style.display = desc ? '' : 'none';

  const creditRow = document.getElementById('modal-credit');
  document.getElementById('modal-credit-text').textContent = item.credito || '';
  creditRow.style.display = item.credito ? '' : 'none';

  const ficha = document.getElementById('modal-ficha-link');
  if (item.speciesId) { ficha.href = `especie.html?id=${item.speciesId}`; ficha.hidden = false; }
  else ficha.hidden = true;

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showModalImg(idx) {
  const imgs = _modalItem ? _modalItem.imgs : [];
  const img = document.getElementById('modal-img');
  const ph = document.getElementById('modal-placeholder');
  const dotsEl = document.getElementById('modal-dots');
  const counter = document.getElementById('modal-counter');
  _modalImgIdx = idx;

  img.src = ''; img.style.display = 'block'; ph.style.display = 'none';
  img.onerror = () => { img.style.display = 'none'; ph.style.display = 'flex'; };
  img.src = imgs[idx] || '';
  img.alt = _modalItem ? titleOf(_modalItem) : '';

  if (imgs.length > 1) {
    dotsEl.innerHTML = imgs.map((_, i) => `<div class="modal-dot${i === idx ? ' active' : ''}" onclick="showModalImg(${i})"></div>`).join('');
    dotsEl.style.display = '';
    counter.textContent = `${idx + 1} / ${imgs.length}`;
    counter.style.display = '';
  } else {
    dotsEl.style.display = 'none';
    counter.style.display = 'none';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('modal-sheet').classList.remove('open');
  if (document.getElementById('feed-lightbox').hidden) document.body.style.overflow = '';
}

// ── Visor de pantalla completa (mismo patrón que especie.html) ──
let _lbSlides = [];
let _lbDots = [];
let _lbCurrent = 0;
let _lbItem = null;

function buildLightbox(item) {
  _lbItem = item;
  _lbSlides = [];
  _lbDots = [];
  _lbCurrent = 0;
  const stage = document.getElementById('feed-lightbox-stage');
  const dotsC = document.getElementById('feed-lightbox-dots');
  stage.innerHTML = '';
  dotsC.innerHTML = '';
  item.imgs.forEach((u, i) => {
    const slide = document.createElement('div');
    slide.className = 'photo-slide' + (i === 0 ? ' active' : '');
    const img = document.createElement('img');
    img.src = u;
    img.alt = titleOf(item);
    img.loading = 'lazy';
    slide.appendChild(img);
    stage.appendChild(slide);
    _lbSlides.push(slide);
    if (item.imgs.length > 1) {
      const d = document.createElement('div');
      d.className = 'gallery-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', (e) => { e.stopPropagation(); showLbSlide(i); });
      dotsC.appendChild(d);
      _lbDots.push(d);
    }
  });
}

function showLbSlide(n) {
  if (!_lbSlides.length) return;
  _lbSlides[_lbCurrent].classList.remove('active');
  if (_lbDots[_lbCurrent]) _lbDots[_lbCurrent].classList.remove('active');
  _lbCurrent = (n + _lbSlides.length) % _lbSlides.length;
  _lbSlides[_lbCurrent].classList.add('active');
  if (_lbDots[_lbCurrent]) _lbDots[_lbCurrent].classList.add('active');

  const counter = document.getElementById('feed-lightbox-counter');
  const caption = document.getElementById('feed-lightbox-caption');
  if (_lbItem && _lbItem.imgs.length > 1) {
    counter.textContent = `${_lbCurrent + 1} / ${_lbSlides.length}`;
    counter.style.display = 'block';
  } else {
    counter.style.display = 'none';
  }
  const bits = _lbItem ? [titleOf(_lbItem), _lbItem.credito].filter(Boolean) : [];
  caption.textContent = bits.join(' · ');
  caption.style.display = bits.length ? 'block' : 'none';
}

function openLightbox(idx) {
  const lb = document.getElementById('feed-lightbox');
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('feed-lightbox-dots').style.display =
    _lbItem && _lbItem.imgs.length > 1 ? '' : 'none';
  showLbSlide(idx || 0);
}

function closeLightbox() {
  document.getElementById('feed-lightbox').hidden = true;
  // Si la hoja de detalle sigue abierta, mantener el scroll del body bloqueado
  if (!document.getElementById('modal-sheet').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function initModal() {
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', closeModal));
  document.getElementById('feed-lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('feed-lightbox').hidden) closeLightbox();
    else closeModal();
  });
  // bfcache: el gesto "atrás" puede restaurar la página con el visor/hoja abiertos
  window.addEventListener('pageshow', (e) => { if (e.persisted) { closeLightbox(); closeModal(); } });

  // Hoja de detalle: deslizar/puntos navegan la vista chica; tocar la foto la abre grande
  const photoEl = document.getElementById('modal-photo');
  let startX = 0;
  photoEl.addEventListener('click', (e) => {
    if (e.target.closest('.modal-close') || e.target.closest('.modal-dot')) return;
    openLightbox(_modalImgIdx);
  });
  photoEl.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  photoEl.addEventListener('touchend', (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    const imgs = _modalItem ? _modalItem.imgs : [];
    if (Math.abs(diff) > 40 && imgs.length > 1) {
      const next = Math.max(0, Math.min(imgs.length - 1, _modalImgIdx + (diff > 0 ? 1 : -1)));
      showModalImg(next);
    }
  });

  // Visor de pantalla completa: tocar avanza; deslizar navega
  const stage = document.getElementById('feed-lightbox-stage');
  let lbStartX = 0;
  stage.addEventListener('click', () => { if (_lbSlides.length > 1) showLbSlide(_lbCurrent + 1); });
  stage.addEventListener('touchstart', (e) => { lbStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const diff = lbStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40 && _lbSlides.length > 1) showLbSlide(_lbCurrent + (diff > 0 ? 1 : -1));
  });
}

// ── Arranque ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([I18n.init(), FeedStore.init()]);

  initViewSwitcher();
  initSourceTabs();  // hace el primer renderAll()
  initModal();
  App.initSearch('feed-search-input', (q) => { _filters.query = q || null; renderAll(); });

  // Los textos de tarjeta se generan en JS (sin data-i18n) → repintar al cambiar idioma
  document.addEventListener('langchange', renderAll);
});
