const IUCN_COLORS = {
      LC: '#4CAF50', NT: '#FFC107', VU: '#FF9800',
      EN: '#F44336', CR: '#9C27B0', DD: '#9E9E9E', NE: '#e0e0e0'
    };

    const GROUP_META = {
      aves:              { deco: '🦜', i18nKey: 'birds' },
      anfibios_reptiles: { deco: '🐸', i18nKey: 'amphibians_reptiles' },
      mariposas:         { deco: '🦋', i18nKey: 'butterflies' },
      polillas:          { deco: '🦗', i18nKey: 'moths' },
      orquideas:         { deco: '🌸', i18nKey: 'orchids' },
      mamiferos:           { deco: '🦌', i18nKey: 'mammals' },
      animales_domesticos: { deco: '🐄', i18nKey: 'domestic_animals' },
      peces:               { deco: '🐟', i18nKey: 'freshwater_fish' },
      arboles_nativos:     { deco: '🌳', i18nKey: 'native_trees' }
    };

    const FAMILY_EMOJI = {
      bradypodidae:   '🦥', choloepodidae:  '🦥',
      callitrichidae: '🐒', cebidae:        '🐒',
      atelidae:       '🐒', aotidae:        '🐒',
      procyonidae:    '🦝', trichechidae:   '🦭',
      felidae:        '🐆', mustelidae:     '🦦',
      ursidae_andean: '🐻', canidae:        '🦊',
      sciuridae:      '🐿️', caviidae:      '🦫',
      dasyproctidae:  '🦫', elapidae:      '🐍',
      cracidae:       '🐓', ramphastidae:   '🦜',
    };

    function getSpeciesEmoji(sp) {
      return FAMILY_EMOJI[sp.familyId] || GROUP_META[sp.group]?.deco || '🌿';
    }

    document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      document.getElementById('sp-loading').classList.add('hidden');

      const id = Nav.getParam('id');
      if (!id || id === 'undefined') { Nav.go('listado.html'); return; }

      const sp = DataStore.getSpeciesById(id);
      if (!sp) { Nav.go('listado.html'); return; }

      const lang = I18n.getLang();
      const groupMeta = GROUP_META[sp.group];
      const family = DataStore.getFamilyById(sp.familyId);

      // Título de página
      document.title = (lang === 'en' ? sp.nameEn : sp.nameEs) + ' · Antioquia Biodiversa';

      // Foto placeholder (emoji de grupo)
      document.getElementById('photo-emoji').textContent = getSpeciesEmoji(sp);

      // Fotos reales — sp.photos puede ser string[] u object[] {url, captionEs, captionEn}
      const rawPhotos = sp.photos || [];
      const photoData = rawPhotos
        .map(p => typeof p === 'string'
          ? { url: p, captionEs: null, captionEn: null }
          : { url: p.url, captionEs: p.captionEs || null, captionEn: p.captionEn || null }
        )
        .filter(p => p.url && !p.url.startsWith('placeholder_'))
        .map(p => ({ ...p, url: 'img/species/' + p.url }));

      if (photoData.length > 0) {
        const galleryEl = document.getElementById('gallery');
        document.getElementById('photo-placeholder').style.display = 'none';

        let current = 0;
        const slides = [];
        const dots = [];

        // Caption overlay
        const captionEl = document.createElement('div');
        captionEl.className = 'photo-caption';
        captionEl.style.display = 'none';
        galleryEl.appendChild(captionEl);

        // Crear slides
        photoData.forEach((photo, i) => {
          const slide = document.createElement('div');
          slide.className = 'photo-slide' + (i === 0 ? ' active' : '');
          const img = document.createElement('img');
          img.src = photo.url;
          img.alt = sp.scientificName;
          img.loading = i === 0 ? 'eager' : 'lazy';
          slide.appendChild(img);
          galleryEl.insertBefore(slide, document.getElementById('gallery-counter'));
          slides.push(slide);
        });

        // Mostrar caption de la foto actual
        function updateCaption(idx) {
          const cap = lang === 'en' ? photoData[idx].captionEn : photoData[idx].captionEs;
          if (cap) {
            captionEl.textContent = cap;
            captionEl.style.display = 'block';
          } else {
            captionEl.style.display = 'none';
          }
        }
        updateCaption(0);

        // Indicadores (dots) si hay más de 1 foto
        if (photoData.length > 1) {
          const dotsEl = document.createElement('div');
          dotsEl.className = 'gallery-dots';
          photoData.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
            dotsEl.appendChild(dot);
            dots.push(dot);
          });
          galleryEl.appendChild(dotsEl);

          // Contador
          const counter = document.getElementById('gallery-counter');
          counter.style.display = 'block';
          counter.textContent = '1 / ' + photoData.length;

          function showSlide(n) {
            slides[current].classList.remove('active');
            dots[current].classList.remove('active');
            current = (n + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current].classList.add('active');
            counter.textContent = (current + 1) + ' / ' + slides.length;
            updateCaption(current);
          }

          // Click en dots
          dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));

          // Toque/click en la foto avanza a la siguiente
          galleryEl.addEventListener('click', e => {
            if (!e.target.closest('.gallery-dot') && !e.target.closest('.gallery-back') && !e.target.closest('.gallery-share')) {
              showSlide(current + 1);
            }
          });

          // Swipe táctil
          let startX = 0;
          galleryEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
          galleryEl.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) showSlide(diff > 0 ? current + 1 : current - 1);
          });
        }
      }

      // Nombre
      document.getElementById('sp-common').textContent = lang === 'en' ? sp.nameEn : sp.nameEs;
      document.getElementById('sp-scientific').textContent = sp.scientificName;

      // Badges
      const badgesEl = document.getElementById('sp-badges');
      badgesEl.innerHTML = App.iucnBadge(sp.iucn) + ' ' + App.groupBadge(sp.group);

      // IUCN expandido
      const iucnCircle = document.getElementById('iucn-circle');
      if (sp.iucn === 'NE') {
        iucnCircle.textContent = '—';
        iucnCircle.style.background = IUCN_COLORS.NE;
        iucnCircle.style.color = '#999';
      } else {
        iucnCircle.textContent = sp.iucn;
        iucnCircle.style.background = IUCN_COLORS[sp.iucn] || '#9E9E9E';
      }
      document.getElementById('iucn-code').textContent = sp.iucn === 'NE' ? '—' : sp.iucn;
      document.getElementById('iucn-label').textContent = I18n.t('iucn_' + sp.iucn);

      // Familia
      const familyEl = document.getElementById('sp-family');
      if (family) {
        const familyName = lang === 'en' ? family.nameEn : family.nameEs;
        familyEl.innerHTML = `
          <div class="family-pill">
            <span>${getSpeciesEmoji(sp)}</span>
            <em style="font-style:italic;font-size:0.8rem">${sp.familyId.charAt(0).toUpperCase() + sp.familyId.slice(1)}</em>
            · ${familyName}
          </div>
        `;
      } else {
        familyEl.textContent = sp.familyId;
      }

      // Distribución
      const distEl = document.getElementById('sp-distribution');
      sp.subregions.forEach(sr => {
        const chip = document.createElement('span');
        chip.className = 'badge-subregion';
        chip.textContent = sr;
        distEl.appendChild(chip);
      });

      // Descripción
      document.getElementById('sp-description').textContent =
        lang === 'en' ? sp.descriptionEn : sp.descriptionEs;

      // Compartir
      document.getElementById('fab-share').addEventListener('click', () => {
        const name = lang === 'en' ? sp.nameEn : sp.nameEs;
        Nav.share(name, sp.scientificName);
      });
    });
