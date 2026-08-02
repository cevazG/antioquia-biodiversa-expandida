// Etiquetas nuevas (sombrilla/endémica/dieta/actividad) — activar/desactivar aquí.
// "actividad" prendida a modo de prueba (2026-08-01) — la mayoría de las 154
// especies aún no tiene este dato investigado, así que no aparecerá para ellas.
const BADGE_TAGS = {
  umbrella:  true,
  endemica:  true,
  dieta:     true,
  actividad: true,
};

// "Endémica" es una afirmación a nivel de especie — no se puede sostener
// para algo identificado solo hasta género/familia (ej. "Polyporus sp.",
// "Pristimantis sp. 1", "Fungi indet.", "cf. Sarcoscyphaceae"). Este candado
// evita que el badge aparezca aunque species.json tuviera "endemica": true
// puesto por error, para cualquier grupo, no solo hongos.
function isUnidentified(sp) {
  const name = sp.scientificName.trim();
  return /\bsp\.\s*\d*$/i.test(name) || /\bindet\.?\b/i.test(name) || /^cf\.\s/i.test(name);
}

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

        // Vista previa: todas las fotos como slides apiladas (mismo patrón
        // que el visor de pantalla completa), con deslizar directo aquí —
        // antes solo se veía la primera y había que abrir el visor para
        // pasar de foto en foto.
        let previewCurrent = 0;
        const previewSlides = [];
        const counterEl = document.getElementById('gallery-counter');
        photoData.forEach((photo, i) => {
          const slide = document.createElement('div');
          slide.className = 'photo-slide' + (i === 0 ? ' active' : '');
          const img = document.createElement('img');
          img.src = photo.url;
          img.alt = sp.scientificName;
          img.loading = i === 0 ? 'eager' : 'lazy';
          slide.appendChild(img);
          galleryEl.insertBefore(slide, counterEl);
          previewSlides.push(slide);
        });

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

          counterEl.style.display = 'block';
          counterEl.textContent = '1 / ' + photoData.length;
        }

        function showPreviewSlide(n) {
          previewSlides[previewCurrent].classList.remove('active');
          if (dots[previewCurrent]) dots[previewCurrent].classList.remove('active');
          previewCurrent = (n + previewSlides.length) % previewSlides.length;
          previewSlides[previewCurrent].classList.add('active');
          if (dots[previewCurrent]) dots[previewCurrent].classList.add('active');
          counterEl.textContent = (previewCurrent + 1) + ' / ' + photoData.length;
        }

        // Deslizar con el dedo en la vista previa (antes de abrir el visor)
        if (photoData.length > 1) {
          let previewStartX = 0;
          galleryEl.addEventListener('touchstart', e => { previewStartX = e.touches[0].clientX; }, { passive: true });
          galleryEl.addEventListener('touchend', e => {
            const diff = previewStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) showPreviewSlide(previewCurrent + (diff > 0 ? 1 : -1));
          });
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

        // Los puntos cambian la vista previa (igual que deslizar); tocar la
        // foto abre el visor de pantalla completa en la que se esté viendo.
        dots.forEach((dot, i) => dot.addEventListener('click', e => { e.stopPropagation(); showPreviewSlide(i); }));
        galleryEl.addEventListener('click', e => {
          if (e.target.closest('.gallery-dot') || e.target.closest('.gallery-back') || e.target.closest('.gallery-share')) return;
          openLightbox(previewCurrent);
        });
      }

      // Nombre
      document.getElementById('sp-common').textContent = lang === 'en' ? sp.nameEn : sp.nameEs;
      document.getElementById('sp-scientific').textContent = sp.scientificName;

      // Badges
      const badgesEl = document.getElementById('sp-badges');
      badgesEl.innerHTML = App.groupBadge(sp.group);

      // Badges de atributo (segunda fila) — cada tipo se puede apagar en BADGE_TAGS
      // sin tocar los datos de species.json, y cada uno solo aparece si la especie
      // tiene el dato correspondiente. IUCN va primero: es el dato más importante
      // de la ficha, por eso dejó de tener su propia tarjeta grande más abajo.
      const attrsEl = document.getElementById('sp-badges-attrs');
      const attrBadges = [
        App.iucnStatusBadge(sp.iucn),
        BADGE_TAGS.umbrella  && sp.umbrella  ? App.umbrellaBadge()        : '',
        BADGE_TAGS.endemica  && sp.endemica && !isUnidentified(sp) ? App.endemicaBadge() : '',
        BADGE_TAGS.dieta                     ? App.dietaBadge(sp.dieta)   : '',
        BADGE_TAGS.actividad                 ? App.actividadBadge(sp.actividad) : '',
      ].filter(Boolean);
      attrsEl.innerHTML = attrBadges.join(' ');
      attrsEl.style.display = attrBadges.length ? '' : 'none';

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
