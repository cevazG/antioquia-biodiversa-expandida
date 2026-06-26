const GRUPOS_ES = {
  aves:'Aves', anfibios_reptiles:'Anfibios y Reptiles', mariposas:'Mariposas',
  polillas:'Polillas', mamiferos:'Mamíferos', animales_domesticos:'Animales Domésticos',
  peces:'Peces', orquideas:'Orquídeas', arboles_nativos:'Árboles Nativos'
};
const SUBREGIONES = {
  valle_aburra:'Valle de Aburrá', oriente:'Oriente', norte:'Norte',
  occidente:'Occidente', suroeste:'Suroeste', nordeste:'Nordeste',
  bajo_cauca:'Bajo Cauca', magdalena_medio:'Magdalena Medio', uraba:'Urabá'
};

let _mes       = '';
let _fotos     = [];
let _editing   = null;
let _keepPaths = [];   // edit mode: existing photo paths to keep
let _slots     = [];   // new/edit mode: { file, preview } for newly-added photos

// ── Auth ──────────────────────────────────────────────────
checkAuth();
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api.logout(); location.href = '/admin/';
});

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const meses = await api.jplMeses();
  renderMonthTabs(meses);
  if (meses.length) loadMes(meses[0]);
  else {
    // Default al mes actual
    const now = new Date();
    const m = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    document.getElementById('mesInput').value = m;
  }
});

function renderMonthTabs(meses) {
  const tabs = document.getElementById('monthTabs');
  tabs.innerHTML = meses.map(m => `<button class="month-tab" data-mes="${m}">${fmtMes(m)}</button>`).join('');
  tabs.querySelectorAll('.month-tab').forEach(btn => {
    btn.addEventListener('click', () => loadMes(btn.dataset.mes));
  });
}

async function loadMes(mes) {
  _mes = mes;
  document.getElementById('mesInput').value = mes;
  document.querySelectorAll('.month-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.mes === mes));
  _fotos = await api.jplFotos(mes);
  renderGrid();
  document.getElementById('fotosCard').style.display = '';
  document.getElementById('fotosCardTitle').textContent = `Fotos — ${fmtMes(mes)}`;
  document.getElementById('publishBar').style.display = '';
  updateCount();
}

function renderGrid() {
  const grid = document.getElementById('fotosGrid');
  const empty = document.getElementById('emptyFotos');
  if (!_fotos.length) { grid.innerHTML = ''; empty.style.display = ''; return; }
  empty.style.display = 'none';
  grid.innerHTML = _fotos.map(f => `
    <div class="photo-card" data-id="${f._id}">
      ${f.publicado ? '<span class="photo-card__badge-pub">✓ Pub</span>' : ''}
      <img class="photo-card__img" src="/comunidad/jovenes_pa_lante/${f.fotos?.[0] || ''}"
           onerror="this.src='/admin/img/placeholder.png'" alt="">
      <div class="photo-card__info">
        <div class="photo-card__title">${f.especieEs}</div>
        <div class="photo-card__sub">${GRUPOS_ES[f.grupo] || f.grupo} · ${f.iucn}</div>
        <div class="photo-card__sub">${SUBREGIONES[f.subregion] || f.subregion}</div>
      </div>
      <div class="photo-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openEdit('${f._id}')">✏️</button>
        <button class="btn btn--danger btn--sm" onclick="deletePhoto('${f._id}')">🗑</button>
      </div>
    </div>`).join('');
}

function updateCount() {
  document.getElementById('publishCount').textContent =
    `${_fotos.length} foto${_fotos.length !== 1 ? 's' : ''}`;
}

// ── Nuevo mes ─────────────────────────────────────────────
document.getElementById('nuevoMesBtn').addEventListener('click', () => {
  const val = document.getElementById('mesInput').value;
  if (!val) { showToast('Selecciona un mes primero'); return; }
  if (_mes === val) { showToast('Ese mes ya está activo'); return; }
  openSheet(null, val);
});

document.getElementById('cargarMesBtn').addEventListener('click', async () => {
  const val = document.getElementById('mesInput').value;
  if (!val) return;
  await ensureMesLoaded(val);
  loadMes(val);
});

async function ensureMesLoaded(mes) {
  const meses = await api.jplMeses();
  if (!meses.includes(mes)) {
    document.getElementById('monthTabs').insertAdjacentHTML('beforeend',
      `<button class="month-tab" data-mes="${mes}">${fmtMes(mes)}</button>`);
    document.querySelectorAll('.month-tab').forEach(btn => {
      btn.addEventListener('click', () => loadMes(btn.dataset.mes));
    });
  }
}

// ── Sheet ─────────────────────────────────────────────────
document.getElementById('addFotoBtn').addEventListener('click', () => openSheet(null, _mes));
document.getElementById('cancelSheetBtn').addEventListener('click', closeSheet);
document.getElementById('sheetOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('sheetOverlay')) closeSheet();
});

function openSheet(foto, mes) {
  _editing = foto;
  document.getElementById('photoForm').reset();

  if (foto) {
    document.getElementById('sheetTitle').textContent = 'Editar foto';
    document.getElementById('editId').value            = foto._id;
    document.getElementById('especieEs').value         = foto.especieEs || '';
    document.getElementById('especieEn').value         = foto.especieEn || '';
    document.getElementById('especieCientifico').value = foto.especieCientifico || '';
    document.getElementById('grupo').value             = foto.grupo || '';
    document.getElementById('iucn').value              = foto.iucn || 'LC';
    document.getElementById('subregion').value         = foto.subregion || '';
    document.getElementById('municipio').value         = foto.municipio || '';
    document.getElementById('credito').value           = foto.credito || '';
    document.getElementById('descripcionEs').value     = foto.descripcionEs || '';
    document.getElementById('descripcionEn').value     = foto.descripcionEn || '';
    document.getElementById('endemica').checked        = foto.endemica || false;
    document.getElementById('savePhotoBtn').textContent = 'Guardar cambios';
    _keepPaths = [...(foto.fotos || [])];
    _slots = [];
  } else {
    document.getElementById('sheetTitle').textContent = 'Nueva foto de biodiversidad';
    document.getElementById('editId').value = '';
    document.getElementById('savePhotoBtn').textContent = 'Guardar foto';
    _keepPaths = [];
    _slots = [{ file: null, preview: null }];
  }
  document.getElementById('inatLink').style.display = 'none';
  renderFotoSlots();
  document.getElementById('sheetOverlay').classList.add('open');
}

// ── Foto slots ────────────────────────────────────────────
document.getElementById('addSlotBtn').addEventListener('click', addSlot);

function renderFotoSlots() {
  const area   = document.getElementById('fotosArea');
  const addBtn = document.getElementById('addSlotBtn');
  const total  = _keepPaths.length + _slots.length;
  area.innerHTML = '';

  _keepPaths.forEach((path, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'foto-slot foto-slot--existing';
    wrap.innerHTML = `
      <img src="/comunidad/jovenes_pa_lante/${path}" alt=""
           onerror="this.src='/admin/img/placeholder.png'">
      <button type="button" class="foto-slot__remove"
              onclick="removeKeepPath(${i})" aria-label="Eliminar foto">✕</button>`;
    area.appendChild(wrap);
  });

  _slots.forEach((slot, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'foto-slot foto-slot--upload';
    if (slot.preview) {
      wrap.innerHTML = `
        <img src="${slot.preview}" alt="Vista previa">
        <button type="button" class="foto-slot__remove"
                onclick="removeSlot(${i})" aria-label="Quitar foto">✕</button>`;
    } else {
      wrap.innerHTML = `
        <label class="foto-slot__zone">
          <input type="file" accept="image/jpeg,image/webp,image/png"
                 onchange="onSlotFileChange(${i}, this)">
          <span class="foto-slot__icon">📷</span>
          <span class="foto-slot__hint">JPG / WEBP</span>
        </label>
        ${total > 1 ? `<button type="button" class="foto-slot__remove"
                onclick="removeSlot(${i})" aria-label="Quitar slot">✕</button>` : ''}`;
    }
    area.appendChild(wrap);
  });

  addBtn.style.display = total < 3 ? '' : 'none';
}

function addSlot() {
  if (_keepPaths.length + _slots.length >= 3) return;
  _slots.push({ file: null, preview: null });
  renderFotoSlots();
}

function removeKeepPath(i) {
  _keepPaths.splice(i, 1);
  renderFotoSlots();
}

function removeSlot(i) {
  _slots.splice(i, 1);
  if (!_slots.length && !_keepPaths.length) _slots.push({ file: null, preview: null });
  renderFotoSlots();
}

function onSlotFileChange(i, input) {
  const file = input.files[0];
  if (!file) return;
  _slots[i] = { file, preview: URL.createObjectURL(file) };
  renderFotoSlots();
}

function closeSheet() {
  document.getElementById('sheetOverlay').classList.remove('open');
  _editing = null;
}

// ── Autofill iNaturalist ──────────────────────────────────
document.getElementById('autofillBtn').addEventListener('click', async () => {
  const name = document.getElementById('especieCientifico').value.trim();
  if (!name) { showToast('Escribe primero el nombre científico'); return; }

  const btn = document.getElementById('autofillBtn');
  btn.textContent = '⏳ Buscando…';
  btn.disabled = true;

  try {
    const { data, msg } = await api.autofill(name);

    if (!data) {
      showToast(msg || 'No encontrado en iNaturalist');
      return;
    }

    // Llenar solo los campos que están vacíos
    const fill = (id, val) => { if (val && !document.getElementById(id).value.trim()) document.getElementById(id).value = val; };
    fill('especieEn',     data.nameEn);
    fill('especieEs',     data.nameEs);
    fill('descripcionEs', data.descripcionEs);
    fill('descripcionEn', data.descripcionEn);

    // IUCN: actualizar solo si está en DD (default) y el resultado es más específico
    const iucnSelect = document.getElementById('iucn');
    if (data.iucn && data.iucn !== 'DD' && iucnSelect.value === 'DD')
      iucnSelect.value = data.iucn;

    // Mostrar enlace a iNaturalist
    if (data.inatUrl) {
      document.getElementById('inatLinkAnchor').href = data.inatUrl;
      document.getElementById('inatLink').style.display = '';
    }

    showToast('✓ Datos completados desde iNaturalist');
  } catch (_) {
    showToast('Error consultando iNaturalist');
  } finally {
    btn.textContent = '🔍 Autocompletar';
    btn.disabled = false;
  }
});

// ── Guardar foto ──────────────────────────────────────────
document.getElementById('photoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('savePhotoBtn');
  btn.disabled = true; btn.textContent = 'Guardando…';

  try {
    const fd = new FormData();
    fd.set('especieEs',         document.getElementById('especieEs').value);
    fd.set('especieEn',         document.getElementById('especieEn').value);
    fd.set('especieCientifico', document.getElementById('especieCientifico').value);
    fd.set('grupo',             document.getElementById('grupo').value);
    fd.set('iucn',              document.getElementById('iucn').value);
    fd.set('subregion',         document.getElementById('subregion').value);
    fd.set('municipio',         document.getElementById('municipio').value);
    fd.set('credito',           document.getElementById('credito').value);
    fd.set('descripcionEs',     document.getElementById('descripcionEs').value);
    fd.set('descripcionEn',     document.getElementById('descripcionEn').value);
    fd.set('endemica',          document.getElementById('endemica').checked ? 'true' : 'false');
    _slots.forEach(s => { if (s.file) fd.append('fotosNuevas', s.file); });

    if (_editing) {
      const hasNew = _slots.some(s => s.file);
      if (!_keepPaths.length && !hasNew) {
        showToast('Agrega al menos una foto');
        btn.disabled = false; btn.textContent = 'Guardar cambios';
        return;
      }
      fd.set('fotosExistentes', JSON.stringify(_keepPaths));
      await api.jplUpdateFoto(_mes, _editing._id, fd);
      showToast('Foto actualizada');
    } else {
      if (!_slots.some(s => s.file)) {
        showToast('Agrega al menos una foto');
        btn.disabled = false; btn.textContent = 'Guardar foto';
        return;
      }
      await api.jplAddFoto(_mes, fd);
      showToast('Foto guardada');
    }
    closeSheet();
    _fotos = await api.jplFotos(_mes);
    renderGrid();
    updateCount();
  } catch (err) {
    showToast('Error: ' + err.message, 4000);
  } finally {
    btn.disabled = false;
    btn.textContent = _editing ? 'Guardar cambios' : 'Guardar foto';
  }
});

// ── Editar / Borrar ───────────────────────────────────────
function openEdit(id) {
  const foto = _fotos.find(f => f._id === id);
  if (foto) openSheet(foto, _mes);
}

async function deletePhoto(id) {
  if (!confirm('¿Borrar esta foto? Esta acción no se puede deshacer.')) return;
  await api.jplDeleteFoto(id);
  _fotos = _fotos.filter(f => f._id !== id);
  renderGrid(); updateCount();
  showToast('Foto eliminada');
}

// ── Publicar ──────────────────────────────────────────────
document.getElementById('publicarBtn').addEventListener('click', async () => {
  if (!_fotos.length) { showToast('Agrega fotos antes de publicar'); return; }
  const btn = document.getElementById('publicarBtn');
  btn.disabled = true; btn.textContent = 'Publicando…';
  try {
    const { count } = await api.jplPublicar(_mes);
    showToast(`✅ ${count} fotos publicadas para ${fmtMes(_mes)}`);
    _fotos = await api.jplFotos(_mes);
    renderGrid();
  } catch (err) {
    showToast('Error: ' + err.message, 4000);
  } finally {
    btn.disabled = false; btn.textContent = '✓ Publicar mes';
  }
});

// ── Utils ─────────────────────────────────────────────────
function fmtMes(mes) {
  const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [y, m] = mes.split('-');
  return `${MESES[+m]} ${y}`;
}
