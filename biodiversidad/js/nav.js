/* ============================================================
   ANTIOQUIA BIODIVERSA — nav.js
   Navegación, parámetros URL y breadcrumbs
   ============================================================ */

var Nav = (() => {

  // Leer parámetro de la URL
  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  // Navegar a otra página con parámetros
  function go(page, params = {}) {
    const query = new URLSearchParams(params).toString();
    window.location.href = query ? `${page}?${query}` : page;
  }

  // Volver atrás (o a home si no hay historial)
  function back() {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
      window.history.back();
    } else {
      window.location.href = 'home.html';
    }
  }

  // Obtener la subregión actual guardada en sessionStorage
  function getCurrentSubregion() {
    return sessionStorage.getItem('ab_subregion') || getParam('subregion');
  }

  function setCurrentSubregion(name) {
    sessionStorage.setItem('ab_subregion', name);
  }

  // Guardar / recuperar el grupo bio actual
  function getCurrentGroup() {
    return sessionStorage.getItem('ab_group') || getParam('grupo');
  }

  function setCurrentGroup(group) {
    sessionStorage.setItem('ab_group', group);
  }

  // Generar breadcrumb textual
  function buildBreadcrumb(parts) {
    const el = document.querySelector('.breadcrumb');
    if (!el) return;
    el.innerHTML = parts
      .map((p, i) =>
        i < parts.length - 1
          ? `<span class="breadcrumb__item breadcrumb__item--link" onclick="Nav.go('${p.href}')">${p.label}</span>`
          : `<span class="breadcrumb__item breadcrumb__item--current">${p.label}</span>`
      )
      .join('<span class="breadcrumb__sep">›</span>');
  }

  // Compartir página actual (Web Share API)
  function share(title, text) {
    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href)
        .then(() => App?.toast(I18n.t('link_copied') || 'Enlace copiado'));
    }
  }

  return { getParam, go, back, getCurrentSubregion, setCurrentSubregion, getCurrentGroup, setCurrentGroup, buildBreadcrumb, share };
})();
