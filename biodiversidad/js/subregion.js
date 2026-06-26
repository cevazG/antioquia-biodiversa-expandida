const GROUPS = [
      { id: 'aves',              icon: 'img/icons/aves.svg',              deco: '🦜', i18nEs: 'Aves',                 i18nEn: 'Birds' },
      { id: 'anfibios_reptiles', icon: 'img/icons/anfibios_reptiles.svg', deco: '🐸', i18nEs: 'Anfibios y Reptiles', i18nEn: 'Amphibians & Reptiles' },
      { id: 'mariposas',         icon: 'img/icons/mariposas.svg',         deco: '🦋', i18nEs: 'Mariposas',            i18nEn: 'Butterflies' },
      { id: 'polillas',          icon: 'img/icons/polillas.svg',          deco: '🦗', i18nEs: 'Polillas',             i18nEn: 'Moths' },
      { id: 'orquideas',         icon: 'img/icons/orquideas.svg',         deco: '🌸', i18nEs: 'Orquídeas',            i18nEn: 'Orchids' },
      { id: 'mamiferos',           icon: 'img/icons/mamiferos.svg',              deco: '🦌', i18nEs: 'Mamíferos',              i18nEn: 'Mammals' },
      { id: 'animales_domesticos', icon: 'img/icons/animales_domesticos.svg',  deco: '🐄', i18nEs: 'Animales Domésticos',    i18nEn: 'Domestic Animals' },
      { id: 'peces',               icon: 'img/icons/peces.svg',               deco: '🐟', i18nEs: 'Peces de Agua Dulce',      i18nEn: 'Freshwater Fish' },
      { id: 'arboles_nativos',     icon: 'img/icons/arboles_nativos.svg',     deco: '🌳', i18nEs: 'Árboles Nativos',          i18nEn: 'Native Trees' }
    ];

    // Nombre de subregión a partir del ID (map IDs → nombre en el JSON)
    const REGION_NAMES = {
      uraba: 'Urabá',
      occidente: 'Occidente',
      norte: 'Norte',
      bajo_cauca: 'Bajo Cauca',
      nordeste: 'Nordeste',
      magdalena_medio: 'Magdalena Medio',
      valle_aburra: 'Valle de Aburrá',
      oriente: 'Oriente',
      suroeste: 'Suroeste'
    };

    document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      const subregionId = Nav.getParam('subregion') || 'valle_aburra';
      const subregionName = REGION_NAMES[subregionId] || subregionId;
      const lang = I18n.getLang();

      // Nombre en el hero
      document.getElementById('subregion-name').textContent = subregionName;
      document.title = subregionName + ' · Antioquia Biodiversa';

      // Generar cuadrícula de grupos
      const grid = document.getElementById('bio-grid');
      const badgesEl = document.getElementById('subregion-badges');

      for (const group of GROUPS) {
        const count = DataStore.countSpeciesByGroup(group.id, subregionId);
        const label = lang === 'en' ? group.i18nEn : group.i18nEs;

        // Badge en el hero
        if (count > 0) {
          const badge = document.createElement('div');
          badge.className = 'hero-badge';
          badge.title = label;
          badge.innerHTML = `
            <span class="hero-badge__emoji">${group.deco}</span>
            <span class="hero-badge__count">${count}</span>`;
          badgesEl.appendChild(badge);
        }

        // Tarjeta del grupo
        const card = document.createElement('a');
        card.href = `listado.html?subregion=${subregionId}&grupo=${group.id}`;
        card.className = `bio-card-sr bio-card-sr--${group.id} ripple-container anim-fade-in-up`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `${label}: ${count} especies en ${subregionName}`);
        card.innerHTML = `
          <div class="bio-card-sr__icon-wrap">
            <img src="${group.icon}" alt="" width="40" height="40">
          </div>
          <span class="bio-card-sr__name">${label}</span>
          <span class="bio-card-sr__count">${count} ${I18n.t('species_count')}</span>
        `;

        // Efecto ripple
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
      }
    });
