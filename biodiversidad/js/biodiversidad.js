const HOME_GROUPS = [
      { id: 'aves',              kingdom: 'fauna', icon: 'img/icons/aves.svg' },
      { id: 'anfibios_reptiles', kingdom: 'fauna', icon: 'img/icons/anfibios_reptiles.svg' },
      { id: 'mariposas',         kingdom: 'fauna', icon: 'img/icons/mariposas.svg' },
      { id: 'polillas',          kingdom: 'fauna', icon: 'img/icons/polillas.svg' },
      { id: 'mamiferos',           kingdom: 'fauna', icon: 'img/icons/mamiferos.svg' },
      { id: 'animales_domesticos', kingdom: 'fauna', icon: 'img/icons/animales_domesticos.svg' },
      { id: 'peces',               kingdom: 'fauna', icon: 'img/icons/peces.svg' },
      { id: 'arboles_nativos',     kingdom: 'flora', icon: 'img/icons/arboles_nativos.svg' },
      { id: 'orquideas',           kingdom: 'flora', icon: 'img/icons/orquideas.svg' }
    ];

    document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      const speciesLabel = I18n.t('species_count');
      const grid = document.getElementById('bio-grid');
      let total = 0;

      await Promise.all(HOME_GROUPS.map(async g => {
        const count = DataStore.countSpeciesByGroup(g.id);
        total += count;
        const name = I18n.t(`groups.${g.id}`);
        const countLabel = count > 0 ? `${count} ${speciesLabel}` : I18n.t('coming_soon');

        const card = document.createElement('a');
        card.href = `listado.html?grupo=${g.id}`;
        card.className = `bio-card bio-card--${g.id} ripple-container`;
        card.style.textDecoration = 'none';
        card.innerHTML = `
          <img src="${g.icon}" class="bio-card__icon" alt="" width="48" height="48">
          <span class="bio-card__name">${name}</span>
          <span class="bio-card__count">${countLabel}</span>
        `;

        card.addEventListener('click', function(e) {
          const ripple = document.createElement('span');
          ripple.className = 'ripple';
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });

        grid.appendChild(card);
      }));

      const totalEl = document.getElementById('total-species');
      if (totalEl) totalEl.textContent = total;

      document.querySelectorAll('.mode-card.ripple-container').forEach(btn => {
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
    });
