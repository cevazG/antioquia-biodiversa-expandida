checkAuth();

function animateCount(el, target, duration = 800) {
  if (!el) return;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString('es-CO');
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

(function setDate() {
  const el = document.getElementById('reportDate');
  if (el) el.textContent = `Actualizado a ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}`;
})();

async function loadTrend() {
  const data = await api.jplStatsMonthly();

  if (!data.length) {
    document.querySelector('.impact-body').innerHTML =
      '<div class="impact-section"><div class="section-body" style="text-align:center;color:var(--muted);padding:48px">' +
      'Sin datos aún. Agrega fotos desde el módulo JPL.</div></div>';
    return;
  }

  const total    = data.reduce((s, d) => s + d.fotos, 0);
  const ultimo   = data[data.length - 1];
  const maxFotos = Math.max(...data.map(d => d.fotos), 1);
  const BAR_MAX  = 190;

  animateCount(document.getElementById('t-meses'), data.length, 600);
  animateCount(document.getElementById('t-fotos'), total, 1000);

  const avgEl = document.getElementById('t-avg');
  if (avgEl) avgEl.textContent = (total / data.length).toFixed(1);

  animateCount(document.getElementById('t-ultimo'), ultimo.fotos, 600);
  const labelEl = document.getElementById('t-ultimo-label');
  if (labelEl) labelEl.textContent = ultimo.label;

  // Gráfico de barras
  const chart  = document.getElementById('monthly-chart');
  const labels = document.getElementById('monthly-labels');

  if (chart) {
    chart.innerHTML = data.map(d => {
      const barH      = Math.max(4, Math.round(d.fotos / maxFotos * BAR_MAX));
      const threatPct = d.fotos ? (d.amenazadas / d.fotos * 100).toFixed(1) : 0;
      return `
        <div class="month-col">
          <div class="month-col__count">${d.fotos}</div>
          <div class="month-col__bar" data-h="${barH}" style="height:0">
            <div class="month-col__bar-threat" style="height:${threatPct}%"></div>
          </div>
        </div>`;
    }).join('');

    requestAnimationFrame(() => requestAnimationFrame(() => {
      chart.querySelectorAll('.month-col__bar[data-h]').forEach(el => {
        el.style.height = el.dataset.h + 'px';
      });
    }));
  }

  if (labels) {
    labels.innerHTML = data.map(d => `<div class="month-label">${d.label}</div>`).join('');
  }

  // Tabla con variación mensual
  const table = document.getElementById('monthly-table');
  if (table) {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Mes</th>
          <th>Fotos</th>
          <th>Δ mes ant.</th>
          <th>Especies únicas</th>
          <th>Amenazadas</th>
          <th>Endémicas</th>
          <th>Subregiones</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((d, i) => {
          const prev  = i > 0 ? data[i - 1].fotos : null;
          const delta = prev !== null ? d.fotos - prev : null;
          const deltaHtml = delta === null
            ? '<span style="color:var(--muted)">—</span>'
            : delta > 0
              ? `<span style="color:var(--green);font-weight:600">+${delta}</span>`
              : delta < 0
                ? `<span style="color:#d32f2f;font-weight:600">${delta}</span>`
                : '<span style="color:var(--muted)">0</span>';
          return `
            <tr>
              <td style="font-weight:600">${d.label}</td>
              <td>${d.fotos}</td>
              <td>${deltaHtml}</td>
              <td>${d.especiesUnicas}</td>
              <td style="color:#d32f2f;font-weight:600">${d.amenazadas}</td>
              <td>${d.endemicas}</td>
              <td>${d.subregiones}</td>
            </tr>`;
        }).join('')}
        <tr>
          <td style="font-weight:700;border-top:2px solid var(--border)">Total acumulado</td>
          <td style="font-weight:700;border-top:2px solid var(--border)">${total}</td>
          <td style="border-top:2px solid var(--border)" colspan="5">—</td>
        </tr>
      </tbody>`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadTrend().catch(err => console.warn('tendencia error', err));
});
