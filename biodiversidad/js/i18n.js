/* ============================================================
   ANTIOQUIA BIODIVERSA — i18n.js
   Sistema de internacionalización ES / EN
   ============================================================ */

var I18n = (() => {
  let _translations = {};
  let _lang = 'es';
  let _initPromise = null;

  // Detecta automáticamente la ruta a translations.json según la
  // profundidad del URL: funciona desde root, agua/, comunidad/, etc.
  function _autoPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    // Si la URL termina en '/' (Netlify Pretty URLs strip index.html),
    // todos los parts son directorios; si no, el último es el nombre del archivo.
    const endsWithSlash = window.location.pathname.endsWith('/');
    const depth = endsWithSlash ? parts.length : Math.max(0, parts.length - 1);
    return (depth > 0 ? '../'.repeat(depth) : '') + 'data/translations.json';
  }

  // Carga el JSON de traducciones y aplica al DOM.
  // Cachea la promesa para que llamadas simultáneas compartan un solo fetch.
  async function init(translationsPath) {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
      const path = translationsPath || _autoPath();
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status} – ${path}`);
        _translations = await res.json();
      } catch (e) {
        console.error('[i18n] No se pudo cargar traducciones:', e.message);
      }
      _lang = localStorage.getItem('ab_lang') || 'es';
      apply();
      _wireLangToggles();
    })();
    return _initPromise;
  }

  // Retorna un texto traducido por clave (soporta dot notation: "subregions.uraba")
  function t(key) {
    const parts = key.split('.');
    let obj = _translations[_lang] || _translations['es'];
    for (const p of parts) {
      if (obj == null) return key;
      obj = obj[p];
    }
    return obj ?? key;
  }

  // Cambia el idioma, actualiza el DOM y dispara el evento 'langchange'
  function setLang(lang) {
    if (!_translations[lang]) return;
    _lang = lang;
    localStorage.setItem('ab_lang', lang);
    apply();
    // Actualizar todos los botones de toggle
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.textContent = lang === 'es' ? 'EN' : 'ES';
    });
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function getLang() { return _lang; }

  // Aplica traducciones a todos los elementos con data-i18n en el DOM
  function apply() {
    document.documentElement.lang = _lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });

    const titleKey = document.querySelector('meta[name="page-title"]');
    if (titleKey) {
      document.title = t(titleKey.content) + ' · Antioquia Biodiversa';
    }
  }

  // Conecta automáticamente todos los [data-lang-toggle] del DOM
  // Usa data-langWired para evitar listeners duplicados si init() se llama más de una vez
  function _wireLangToggles() {
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.textContent = _lang === 'es' ? 'EN' : 'ES';
      if (!btn.dataset.langWired) {
        btn.dataset.langWired = '1';
        btn.addEventListener('click', () => {
          const newLang = _lang === 'es' ? 'en' : 'es';
          setLang(newLang);
        });
      }
    });
  }

  return { init, t, setLang, getLang, apply };
})();
