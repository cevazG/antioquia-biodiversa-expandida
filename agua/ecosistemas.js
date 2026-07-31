document.addEventListener('DOMContentLoaded', async () => {
  await I18n.init();

  const res = await fetch('data/ecosistemas.json');
  const data = await res.json();
  const lang = I18n.getLang();
  const grid = document.getElementById('eco-grid');

  data.ecosistemas.forEach(eco => {
    const name = lang === 'en' ? eco.nombreEn : eco.nombreEs;
    const desc = lang === 'en' ? eco.porQueEstrategicoEn : eco.porQueEstrategicoEs;

    const card = document.createElement('a');
    card.href = `ecosistema.html?id=${eco.id}`;
    card.className = `bio-card bio-card--${eco.id} ripple-container`;
    card.style.textDecoration = 'none';
    card.innerHTML = `
      <span class="bio-card__icon" aria-hidden="true">${eco.icono}</span>
      <span class="bio-card__name">${name}</span>
      <span class="bio-card__desc">${desc}</span>
    `;

    card.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    grid.appendChild(card);
  });

  const caveMarker = document.querySelector('.eco-cave-marker');
  if (caveMarker) {
    caveMarker.addEventListener('click', () => {
      window.location.href = caveMarker.dataset.href;
    });
  }

  document.querySelectorAll('.mode-card.ripple-container, .eco-cave-card.ripple-container').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
});
