let _sp   = null; // datos de la especie actual
  let _data = null; // datos completos del JSON

  function licenciaLabel(code) {
    return 'CC ' + (code || '').replace('cc-', '').split('-').map(s => s.toUpperCase()).join(' ');
  }

  // ── Visor de pantalla completa (mismo patrón que especie.js/feed.js) ──
  let _lbFotos = [];
  let _lbSlides = [];
  let _lbDots = [];
  let _lbCurrent = 0;

  function buildLightbox(fotosConImagen) {
    _lbFotos = fotosConImagen;
    _lbSlides = [];
    _lbDots = [];
    _lbCurrent = 0;
    const stage = document.getElementById('lightbox-stage');
    const dotsC = document.getElementById('lightbox-dots');
    stage.innerHTML = '';
    dotsC.innerHTML = '';
    fotosConImagen.forEach((f, i) => {
      const slide = document.createElement('div');
      slide.className = 'photo-slide' + (i === 0 ? ' active' : '');
      const img = document.createElement('img');
      img.src = f.foto;
      img.alt = `Foto de ${f.usuario}`;
      img.loading = 'lazy';
      slide.appendChild(img);
      stage.appendChild(slide);
      _lbSlides.push(slide);
      if (fotosConImagen.length > 1) {
        const dot = document.createElement('div');
        dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', e => { e.stopPropagation(); showLbSlide(i); });
        dotsC.appendChild(dot);
        _lbDots.push(dot);
      }
    });
  }

  function showLbSlide(n) {
    if (!_lbSlides.length) return;
    _lbSlides[_lbCurrent].classList.remove('active');
    if (_lbDots[_lbCurrent]) _lbDots[_lbCurrent].classList.remove('active');
    _lbCurrent = (n + _lbSlides.length) % _lbSlides.length;
    _lbSlides[_lbCurrent].classList.add('active');
    if (_lbDots[_lbCurrent]) _lbDots[_lbCurrent].classList.add('active');

    const counter = document.getElementById('lightbox-counter');
    const caption = document.getElementById('lightbox-caption');
    if (_lbFotos.length > 1) {
      counter.textContent = `${_lbCurrent + 1} / ${_lbSlides.length}`;
      counter.style.display = 'block';
    } else {
      counter.style.display = 'none';
    }
    const f = _lbFotos[_lbCurrent];
    const bits = f ? [f.usuario, f.municipio].filter(Boolean) : [];
    caption.textContent = bits.join(' · ');
    caption.style.display = bits.length ? 'block' : 'none';
  }

  function openLightbox(idx) {
    if (!_lbSlides.length) return;
    document.getElementById('lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lightbox-dots').style.display = _lbFotos.length > 1 ? '' : 'none';
    showLbSlide(idx || 0);
  }

  function closeLightbox() {
    document.getElementById('lightbox').hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    const stage = document.getElementById('lightbox-stage');
    stage.addEventListener('click', () => { if (_lbSlides.length > 1) showLbSlide(_lbCurrent + 1); });
    let lbStartX = 0;
    stage.addEventListener('touchstart', e => { lbStartX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      const diff = lbStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40 && _lbSlides.length > 1) showLbSlide(_lbCurrent + (diff > 0 ? 1 : -1));
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !document.getElementById('lightbox').hidden) closeLightbox();
    });
    // bfcache: el gesto "atrás" puede restaurar la página con el visor abierto
    window.addEventListener('pageshow', e => { if (e.persisted) closeLightbox(); });
  });

  // Renderiza todo el contenido dependiente del idioma
  function renderLang() {
    if (!_sp) return;
    const lang = I18n.getLang();

    // Textos bilingües del JSON
    const desc = lang === 'en'
      ? (_sp.descripcionEn  || _sp.descripcionEs  || '')
      : (_sp.descripcionEs  || '');
    const como = lang === 'en'
      ? (_sp.como_identificarlaEn || _sp.como_identificarlaEs || _sp.como_identificarla || '')
      : (_sp.como_identificarlaEs || _sp.como_identificarla   || '');
    document.getElementById('desc-text').textContent = desc || '—';
    document.getElementById('como-text').textContent = como || '—';

    // Chips IUCN y grupo (usan i18n)
    const chips = document.getElementById('hero-chips');
    chips.innerHTML = `
      <span class="em-chip em-chip--iucn-${_sp.iucn}">${_sp.iucn} · ${I18n.t('iucn_' + _sp.iucn)}</span>
      <span class="em-chip">${I18n.t('groups.' + _sp.grupo)}</span>`;

    // Botones de envío (texto según idioma)
    const nombre  = lang === 'en' ? (_sp.nombreEn || _sp.nombre) : _sp.nombre;
    const mes     = _sp.mes;
    const año     = _sp.año;
    if (_sp.contacto_whatsapp) {
      const tel   = _sp.contacto_whatsapp.replace(/\D/g, '');
      const msgWa = lang === 'en'
        ? encodeURIComponent(`Hi, I want to send my sighting photo of *${nombre}* (${mes} ${año}) for the community gallery 📸`)
        : encodeURIComponent(`Hola, quiero enviar mi foto de avistamiento de *${nombre}* (${mes} ${año}) para la galería de la comunidad 📸`);
      document.getElementById('btn-wa').href = `https://wa.me/${tel}?text=${msgWa}`;
    }
    if (_sp.contacto_email) {
      const asunto = lang === 'en'
        ? encodeURIComponent(`Species of the Month Photo – ${nombre} – ${mes} ${año}`)
        : encodeURIComponent(`Foto Especie del Mes – ${nombre} – ${mes} ${año}`);
      const cuerpo = lang === 'en'
        ? encodeURIComponent(`Hello, I'm attaching my sighting photo of ${nombre} (${_sp.nombreCientifico}).\n\nMunicipality: \nDate: \nComment: `)
        : encodeURIComponent(`Hola, adjunto mi foto de avistamiento de ${nombre} (${_sp.nombreCientifico}).\n\nMunicipio: \nFecha: \nComentario: `);
      document.getElementById('btn-email').href =
        `mailto:${_sp.contacto_email}?subject=${asunto}&body=${cuerpo}`;
    }

    // Contador galería
    const fotos = _sp.fotos_comunidad || [];
    document.getElementById('gallery-count').textContent =
      `${fotos.length} ${I18n.t('edm_fotos_count_label')}`;
  }

  I18n.init().then(() => {
    fetch('data/especie_mes.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      _data = data;
      const mesParam = new URLSearchParams(location.search).get('mes');
      _sp = mesParam
        ? ([data.actual, ...data.anteriores].find(m => m.slug === mesParam) || data.actual)
        : data.actual;

      // Contenido estático (no cambia con el idioma)
      document.getElementById('badge-mes').textContent     = `${_sp.mes} ${_sp.año}`;
      document.getElementById('hero-emoji').textContent    = _sp.emoji;

      // Foto principal (de iNaturalist, o de la galería del proyecto cuando la
      // foto por defecto de la especie no tiene licencia reutilizable, ver
      // foto_oficial.nota) — reemplaza el emoji cuando existe.
      const heroEl = document.getElementById('hero-foto');
      if (_sp.foto_oficial && _sp.foto_oficial.foto) {
        heroEl.classList.add('em-hero__foto--con-foto');
        heroEl.innerHTML = `<img src="${_sp.foto_oficial.foto}" alt="${_sp.nombre}" loading="eager">`;
        heroEl.addEventListener('click', () => openLightbox(0));

        const creditoEl = document.getElementById('hero-credito');
        creditoEl.href = _sp.foto_oficial.obs_url || '#';
        creditoEl.textContent = `📷 ${_sp.foto_oficial.usuario} · ${licenciaLabel(_sp.foto_oficial.licencia)}`;
        creditoEl.style.display = '';
      }

      document.getElementById('hero-nombre').textContent   = _sp.nombre;
      document.getElementById('hero-cientifico').textContent = _sp.nombreCientifico;
      document.title = `${_sp.nombre} · ${I18n.t('edm_titulo')}`;

      if (_sp.especieId) {
        document.getElementById('link-ficha').href =
          `../biodiversidad/especie.html?id=${_sp.especieId}`;
      } else {
        document.getElementById('link-ficha').style.display = 'none';
      }

      // Subregiones (no cambian con idioma en esta versión)
      const srEl = document.getElementById('subregion-chips');
      if ((_sp.subregiones || []).length === 0) {
        srEl.innerHTML = `<span class="subregion-chips__vacio">${I18n.t('edm_subregiones_protegida')}</span>`;
      }
      (_sp.subregiones || []).forEach(sr => {
        const chip = document.createElement('span');
        chip.className = 'subregion-chip';
        chip.textContent = sr;
        srEl.appendChild(chip);
      });

      // Galería comunidad — el carrete de pantalla completa incluye la foto
      // principal del hero como primera diapositiva (si existe), seguida de
      // las fotos de la comunidad, para que sea un solo recorrido continuo.
      const fotos  = _sp.fotos_comunidad || [];
      const galEl  = document.getElementById('gallery-container');
      const fotosConImagen = fotos.filter(f => f.foto);
      const heroFoto = (_sp.foto_oficial && _sp.foto_oficial.foto)
        ? { foto: _sp.foto_oficial.foto, usuario: _sp.foto_oficial.usuario, municipio: '' }
        : null;
      buildLightbox(heroFoto ? [heroFoto, ...fotosConImagen] : fotosConImagen);
      const indexOffset = heroFoto ? 1 : 0;

      if (fotos.length === 0) {
        galEl.innerHTML = `
          <div class="em-no-fotos">
            <div class="em-no-fotos__emoji">📷</div>
            <strong>${I18n.t('edm_no_fotos_titulo')}</strong><br>
            ${I18n.t('edm_no_fotos_desc')}
          </div>`;
      } else {
        const grid = document.createElement('div');
        grid.className = 'em-gallery__grid';
        fotos.forEach(f => {
          const card = document.createElement('div');
          card.className = 'em-foto-card';
          const fechaFmt = f.fecha
            ? new Date(f.fecha + 'T12:00:00').toLocaleDateString(
                I18n.getLang() === 'en' ? 'en-US' : 'es-CO',
                { day:'numeric', month:'short' })
            : '';
          card.innerHTML = `
            <div class="em-foto-card__img em-foto-card__img--placeholder">
              ${f.foto
                ? `<img src="${f.foto}" alt="Foto de ${f.usuario}" loading="lazy">`
                : _sp.emoji}
            </div>
            <div class="em-foto-card__body">
              <div class="em-foto-card__usuario">${f.usuario}</div>
              <div class="em-foto-card__municipio">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${f.municipio}
              </div>
              ${f.comentario ? `<div class="em-foto-card__comentario">${f.comentario}</div>` : ''}
              <div class="em-foto-card__fecha">${fechaFmt}</div>
              ${f.creditoINaturalist ? `<a class="em-foto-card__credito" href="${f.creditoINaturalist.obs_url}" target="_blank" rel="noopener">${licenciaLabel(f.creditoINaturalist.licencia)} · iNaturalist</a>` : ''}
            </div>`;
          if (f.foto) {
            const lbIdx = fotosConImagen.indexOf(f) + indexOffset;
            card.querySelector('.em-foto-card__img').addEventListener('click', () => openLightbox(lbIdx));
          }
          grid.appendChild(card);
        });
        galEl.appendChild(grid);
      }

      // Meses anteriores — cada tarjeta enlaza a la misma página con ?mes=<slug>
      // para ver el mes completo (galería, descripción, etc.), ver arriba.
      const scroll = document.getElementById('anteriores-scroll');
      data.anteriores.forEach(m => {
        const card = document.createElement('a');
        card.href = `especie_del_mes.html?mes=${m.slug}`;
        card.className = 'em-mes-card';
        card.style.borderTopColor = m.colorGrupo || '#8b4a97';
        const nFotos = (m.fotos_comunidad || []).length;
        const foto = m.foto_oficial && m.foto_oficial.foto;
        card.innerHTML = `
          <div class="em-mes-card__foto">
            ${foto
              ? `<img src="${foto}" alt="${m.nombre}" loading="lazy">`
              : `<span class="em-mes-card__emoji">${m.emoji}</span>`}
          </div>
          <div class="em-mes-card__mes">${m.mes} ${m.año}</div>
          <div class="em-mes-card__nombre">${m.nombre}</div>
          <div class="em-mes-card__cientifico">${m.nombreCientifico}</div>
          <div class="em-mes-card__fotos">📷 ${nFotos} ${I18n.t('edm_fotos_count_label')}</div>`;
        scroll.appendChild(card);
      });

      // Render inicial según idioma activo
      renderLang();
    })
    .catch(() => {
      document.getElementById('hero-nombre').textContent = I18n.t('error_load');
    });
  });

  // Re-renderizar contenido dinámico al cambiar idioma
  document.addEventListener('langchange', renderLang);
