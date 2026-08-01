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
      arboles_nativos:     { deco: '🌳', i18nKey: 'native_trees' },
      hongos:              { deco: '🍄', i18nKey: 'fungi' }
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
      document.title = (lang === 'en' ? sp.nameEn : sp.nameEs) + ' · Antioquia Natural';

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

        // Vista previa: siempre muestra la primera foto; el recorrido entre
        // varias fotos ocurre dentro del visor de pantalla completa (lightbox)
        const previewSlide = document.createElement('div');
        previewSlide.className = 'photo-slide active';
        const previewImg = document.createElement('img');
        previewImg.src = photoData[0].url;
        previewImg.alt = sp.scientificName;
        previewImg.loading = 'eager';
        previewSlide.appendChild(previewImg);
        galleryEl.insertBefore(previewSlide, document.getElementById('gallery-counter'));

        const dots = [];
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

          const counter = document.getElementById('gallery-counter');
          counter.style.display = 'block';
          counter.textContent = '1 / ' + photoData.length;
        }

        // ── Lightbox de pantalla completa ──────────────────────────
        const lightbox = document.getElementById('lightbox');
        const lightboxStage = document.getElementById('lightbox-stage');
        const lightboxDots = document.getElementById('lightbox-dots');
        const lightboxCounter = document.getElementById('lightbox-counter');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const lightboxClose = document.getElementById('lightbox-close');

        let lbCurrent = 0;
        const lbSlides = [];
        const lbDots = [];

        photoData.forEach((photo, i) => {
          const slide = document.createElement('div');
          slide.className = 'photo-slide' + (i === 0 ? ' active' : '');
          const img = document.createElement('img');
          img.src = photo.url;
          img.alt = sp.scientificName;
          img.loading = 'lazy';
          slide.appendChild(img);
          lightboxStage.appendChild(slide);
          lbSlides.push(slide);

          if (photoData.length > 1) {
            const dot = document.createElement('div');
            dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', e => { e.stopPropagation(); showLbSlide(i); });
            lightboxDots.appendChild(dot);
            lbDots.push(dot);
          }
        });

        function updateLbCaption(idx) {
          const cap = lang === 'en' ? photoData[idx].captionEn : photoData[idx].captionEs;
          lightboxCaption.textContent = cap || '';
          lightboxCaption.style.display = cap ? 'block' : 'none';
        }

        function showLbSlide(n) {
          lbSlides[lbCurrent].classList.remove('active');
          if (lbDots[lbCurrent]) lbDots[lbCurrent].classList.remove('active');
          lbCurrent = (n + lbSlides.length) % lbSlides.length;
          lbSlides[lbCurrent].classList.add('active');
          if (lbDots[lbCurrent]) lbDots[lbCurrent].classList.add('active');
          if (photoData.length > 1) lightboxCounter.textContent = (lbCurrent + 1) + ' / ' + lbSlides.length;
          updateLbCaption(lbCurrent);
        }

        function openLightbox(idx) {
          lightbox.hidden = false;
          document.body.style.overflow = 'hidden';
          if (photoData.length > 1) {
            lightboxDots.style.display = '';
            lightboxCounter.style.display = 'block';
          } else {
            lightboxDots.style.display = 'none';
            lightboxCounter.style.display = 'none';
          }
          showLbSlide(idx);
        }

        function closeLightbox() {
          lightbox.hidden = true;
          document.body.style.overflow = '';
        }

        lightboxClose.addEventListener('click', closeLightbox);

        lightboxStage.addEventListener('click', e => {
          if (lbSlides.length > 1) showLbSlide(lbCurrent + 1);
        });

        let lbStartX = 0;
        lightboxStage.addEventListener('touchstart', e => { lbStartX = e.touches[0].clientX; }, { passive: true });
        lightboxStage.addEventListener('touchend', e => {
          const diff = lbStartX - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40 && lbSlides.length > 1) showLbSlide(lbCurrent + (diff > 0 ? 1 : -1));
        });

        document.addEventListener('keydown', e => {
          if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
        });

        // Tocar la vista previa (foto o punto) abre el visor de pantalla completa
        dots.forEach((dot, i) => dot.addEventListener('click', e => { e.stopPropagation(); openLightbox(i); }));
        galleryEl.addEventListener('click', e => {
          if (e.target.closest('.gallery-dot') || e.target.closest('.gallery-back') || e.target.closest('.gallery-share')) return;
          openLightbox(0);
        });
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
        // Texto blanco (default en CSS) solo cumple WCAG AA sobre CR; LC/NT/VU/EN/DD
        // necesitan texto oscuro sobre esos fondos claros (ver components.css .badge-iucn--*)
        iucnCircle.style.color = sp.iucn === 'CR' ? '#fff' : '#1a1a1a';
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
