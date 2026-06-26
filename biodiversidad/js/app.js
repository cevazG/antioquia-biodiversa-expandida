/* ============================================================
   ANTIOQUIA BIODIVERSA — app.js
   Inicialización general y utilidades compartidas
   ============================================================ */

var App = (() => {

  // ── Inicialización ──────────────────────────────────────

  async function init() {
    await I18n.init();

    // Los botones [data-lang-toggle] son cableados automáticamente por i18n.js

    // Botones de retroceso
    document.querySelectorAll('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => Nav.back());
    });

    // Scroll to top
    const scrollTopBtn = document.querySelector('.scroll-top');
    if (scrollTopBtn) {
      window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 200);
      });
      scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

  }

  // ── Toast notification ──────────────────────────────────

  let _toastTimer;

  function toast(message, duration = 2500) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── Render helpers ───────────────────────────────────────

  // Renderiza el badge IUCN
  function iucnBadge(code) {
    const label = I18n.t(`iucn_${code}`);
    if (code === 'NE') return `<span class="badge-iucn badge-iucn--NE">${label}</span>`;
    return `<span class="badge-iucn badge-iucn--${code}" title="${label}">${code}</span>`;
  }

  // Renderiza un badge de grupo
  function groupBadge(group) {
    const label = I18n.t(`groups.${group}`);
    return `<span class="badge-group badge-group--${group}">${label}</span>`;
  }

  // Renderiza placeholder de foto según grupo
  function groupPlaceholder(group) {
    const icons = {
      aves: '🦜',
      anfibios_reptiles: '🐸',
      mariposas: '🦋',
      polillas: '🦗',
      orquideas: '🌸',
      mamiferos: '🦌',
      animales_domesticos: '🐄',
      peces: '🐟',
      arboles_nativos: '🌳'
    };
    return icons[group] || '🌿';
  }

  // ── Acordeón ─────────────────────────────────────────────

  function initAccordion(containerSelector) {
    document.querySelectorAll(`${containerSelector} .family-header`).forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const isOpen = header.classList.contains('open');
        header.classList.toggle('open', !isOpen);
        body.classList.toggle('open', !isOpen);
      });
    });
  }

  // ── Galería de fotos ─────────────────────────────────────

  function initGallery(galleryEl) {
    if (!galleryEl) return;
    const slides = galleryEl.querySelectorAll('.photo-gallery__slide');
    const dots = galleryEl.querySelectorAll('.photo-gallery__dot');
    let current = 0;

    function showSlide(n) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      current = (n + slides.length) % slides.length;
      slides[current]?.classList.add('active');
      dots[current]?.classList.add('active');
    }

    galleryEl.querySelector('.photo-gallery__prev')?.addEventListener('click', () => showSlide(current - 1));
    galleryEl.querySelector('.photo-gallery__next')?.addEventListener('click', () => showSlide(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => showSlide(i)));

    // Swipe en móvil
    let startX = 0;
    galleryEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    galleryEl.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) showSlide(diff > 0 ? current + 1 : current - 1);
    });

    showSlide(0);
  }

  // ── Búsqueda ─────────────────────────────────────────────

  function initSearch(inputId, onSearch) {
    const input = document.getElementById(inputId);
    const clearBtn = input?.parentElement.querySelector('.search-bar__clear');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      const val = input.value.trim();
      clearBtn?.classList.toggle('visible', val.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onSearch(val), 220);
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.remove('visible');
      onSearch('');
      input.focus();
    });
  }

  return { init, toast, iucnBadge, groupBadge, groupPlaceholder, initAccordion, initGallery, initSearch };
})();

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', App.init);
