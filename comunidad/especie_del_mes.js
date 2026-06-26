let _sp   = null; // datos de la especie actual
  let _data = null; // datos completos del JSON

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
      _sp   = data.actual;

      // Contenido estático (no cambia con el idioma)
      document.getElementById('badge-mes').textContent     = `${_sp.mes} ${_sp.año}`;
      document.getElementById('hero-emoji').textContent    = _sp.emoji;
      document.getElementById('hero-nombre').textContent   = _sp.nombre;
      document.getElementById('hero-cientifico').textContent = _sp.nombreCientifico;
      document.title = `${_sp.nombre} · ${I18n.t('edm_titulo')}`;

      if (_sp.especieId) {
        document.getElementById('link-ficha').href =
          `../biodiversidad/especie.html?id=${_sp.especieId}`;
      }

      // Subregiones (no cambian con idioma en esta versión)
      const srEl = document.getElementById('subregion-chips');
      (_sp.subregiones || []).forEach(sr => {
        const chip = document.createElement('span');
        chip.className = 'subregion-chip';
        chip.textContent = sr;
        srEl.appendChild(chip);
      });

      // Galería comunidad
      const fotos  = _sp.fotos_comunidad || [];
      const galEl  = document.getElementById('gallery-container');
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
            </div>`;
          grid.appendChild(card);
        });
        galEl.appendChild(grid);
      }

      // Meses anteriores
      const scroll = document.getElementById('anteriores-scroll');
      data.anteriores.forEach(m => {
        const card = document.createElement('div');
        card.className = 'em-mes-card';
        card.style.borderTopColor = m.colorGrupo || '#8b4a97';
        card.innerHTML = `
          <span class="em-mes-card__emoji">${m.emoji}</span>
          <div class="em-mes-card__mes">${m.mes} ${m.año}</div>
          <div class="em-mes-card__nombre">${m.nombre}</div>
          <div class="em-mes-card__cientifico">${m.nombreCientifico}</div>
          <div class="em-mes-card__fotos">📷 ${m.fotos_comunidad} ${I18n.t('edm_fotos_count_label')}</div>`;
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
