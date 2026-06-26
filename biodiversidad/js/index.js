// ── Modal Ley 1581 ────────────────────────────────────────────────────────
(function initPrivacyModal() {
  const modal    = document.getElementById('privacy-modal');
  const checkbox = document.getElementById('privacy-checkbox');
  const btn      = document.getElementById('privacy-btn');

  if (localStorage.getItem('ab_privacy_accepted') === '1') {
    modal.classList.add('hidden');
    return;
  }

  checkbox.addEventListener('change', () => {
    btn.disabled = !checkbox.checked;
  });

  btn.addEventListener('click', () => {
    if (!checkbox.checked) return;
    localStorage.setItem('ab_privacy_accepted', '1');
    modal.style.transition = 'opacity 0.25s ease';
    modal.style.opacity = '0';
    setTimeout(() => modal.classList.add('hidden'), 250);
  });
}());

// ── Selección de idioma ───────────────────────────────────────────────────
function selectLang(lang) {
  localStorage.setItem('ab_lang', lang);

  const content = document.querySelector('.lang-page__content');
  content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  content.style.opacity = '0';
  content.style.transform = 'translateY(-20px) scale(0.97)';

  setTimeout(() => { window.location.href = 'home.html'; }, 300);
}

// Si ya eligió idioma antes, mostrar el prompt en ese idioma
if (localStorage.getItem('ab_lang') === 'en') {
  document.getElementById('lang-prompt').textContent = 'Choose your language';
}

// Efecto ripple en botones
document.querySelectorAll('.ripple-container').forEach(btn => {
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
