I18n.init();

    // Ripple
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

    // Cargar total real de municipios
    fetch('data/municipios.json')
      .then(r => r.json())
      .then(d => {
        document.getElementById('stat-mun').textContent = d.total_municipios || d.municipios.length;
      })
      .catch(() => {});

    // iNaturalist live stats
    (async function loadInatStats() {
      // Fallback: última lectura en vivo conocida (jul 2026) — solo se usa si la API falla
      const FALLBACK = { obs: 58112, spp: 4671, ppl: 472 };

      function animateCount(el, target) {
        const start = performance.now();
        const dur = 1400;
        (function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
          el.textContent = v.toLocaleString('es-CO');
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      }

      const obsEl = document.getElementById('inat-obs');
      const sppEl = document.getElementById('inat-spp');
      const pplEl = document.getElementById('inat-ppl');

      let obs = FALLBACK.obs, spp = FALLBACK.spp, ppl = FALLBACK.ppl;

      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        // El proyecto es de tipo "collection": observations_count/species_count del
        // endpoint /v1/projects vienen vacíos. Hay que consultar los totales con los
        // endpoints de búsqueda (per_page=0/1 solo para leer total_results).
        const [obsResp, sppResp, pplResp] = await Promise.all([
          fetch('https://api.inaturalist.org/v1/observations?project_id=jovenes-palante-con-el-ambiente&per_page=0', { signal: ctrl.signal }),
          fetch('https://api.inaturalist.org/v1/observations/species_counts?project_id=jovenes-palante-con-el-ambiente&per_page=1', { signal: ctrl.signal }),
          fetch('https://api.inaturalist.org/v1/observations/observers?project_id=jovenes-palante-con-el-ambiente&per_page=1', { signal: ctrl.signal })
        ]);
        clearTimeout(timer);
        const [obsData, sppData, pplData] = await Promise.all([obsResp.json(), sppResp.json(), pplResp.json()]);
        obs = obsData.total_results || FALLBACK.obs;
        spp = sppData.total_results || FALLBACK.spp;
        ppl = pplData.total_results || FALLBACK.ppl;
      } catch (_) { /* usa valores de respaldo */ }

      animateCount(obsEl, obs);
      animateCount(sppEl, spp);
      animateCount(pplEl, ppl);
    })();
