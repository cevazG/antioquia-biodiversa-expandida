const SUBREGIONES = {
  valle_aburra:'Valle de Aburrá', oriente:'Oriente', norte:'Norte',
  occidente:'Occidente', suroeste:'Suroeste', nordeste:'Nordeste',
  bajo_cauca:'Bajo Cauca', magdalena_medio:'Magdalena Medio', uraba:'Urabá'
};

let _mes = '';
let _fotos = [];
let _editing = null;

checkAuth();
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api.logout(); location.href = '/admin/';
});

window.addEventListener('DOMContentLoaded', async () => {
  const meses = await api.gcMeses();
  renderMonthTabs(meses);
  if (meses.length) loadMes(meses[0]);
  else {
    const now = new Date();
    document.getElementById('mesInput').value =
      `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }
});

function renderMonthTabs(meses) {
  const tabs = document.getElementById('monthTabs');
  tabs.innerHTML = meses.map(m => `<button class="month-tab" data-mes="${m}">${fmtMes(m)}</button>`).join('');
  tabs.querySelectorAll('.month-tab').forEach(btn =>
    btn.addEventListener('click', () => loadMes(btn.dataset.mes)));
}

async function loadMes(mes) {
  _mes = mes;
  document.getElementById('mesInput').value = mes;
  document.querySelectorAll('.month-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.mes === mes));
  _fotos = await api.gcFotos(mes);
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
      <img class="photo-card__img photo-card__img--landscape"
           src="/comunidad/guarda_cuencas/${f.foto}"
           onerror="this.src=''" alt="">
      <div class="photo-card__info">
        <div class="photo-card__title">${f.tituloEs}</div>
        <div class="photo-card__sub">💧 ${f.cuenca}</div>
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

document.getElementById('nuevoMesBtn').addEventListener('click', () => {
  const val = document.getElementById('mesInput').value;
  if (!val) { showToast('Selecciona un mes primero'); return; }
  if (_mes === val) { showToast('Ese mes ya está activo'); return; }
  openSheet(null, val);
});

document.getElementById('cargarMesBtn').addEventListener('click', async () => {
  const val = document.getElementById('mesInput').value;
  if (!val) return;
  const meses = await api.gcMeses();
  if (!meses.includes(val)) {
    const tabs = document.getElementById('monthTabs');
    tabs.insertAdjacentHTML('beforeend',
      `<button class="month-tab" data-mes="${val}">${fmtMes(val)}</button>`);
    tabs.querySelector(`[data-mes="${val}"]`).addEventListener('click', () => loadMes(val));
  }
  loadMes(val);
});

document.getElementById('addFotoBtn').addEventListener('click', () => openSheet(null, _mes));
document.getElementById('cancelSheetBtn').addEventListener('click', closeSheet);
document.getElementById('sheetOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('sheetOverlay')) closeSheet();
});

function openSheet(foto, mes) {
  _editing = foto;
  document.getElementById('photoForm').reset();
  document.getElementById('uploadPreview').style.display  = 'none';
  document.getElementById('cancelChangeBtn').style.display = 'none';

  if (foto) {
    document.getElementById('sheetTitle').textContent  = 'Editar foto';
    document.getElementById('editId').value            = foto._id;
    document.getElementById('tituloEs').value          = foto.tituloEs || '';
    document.getElementById('tituloEn').value          = foto.tituloEn || '';
    document.getElementById('cuenca').value            = foto.cuenca || '';
    document.getElementById('subregion').value         = foto.subregion || '';
    document.getElementById('municipio').value         = foto.municipio || '';
    document.getElementById('credito').value           = foto.credito || '';
    document.getElementById('descripcionEs').value     = foto.descripcionEs || '';
    document.getElementById('descripcionEn').value     = foto.descripcionEn || '';
    document.getElementById('currentPhotoImg').src     = `/comunidad/guarda_cuencas/${foto.foto}`;
    document.getElementById('currentPhotoWrap').style.display = '';
    document.getElementById('uploadZoneWrap').style.display   = 'none';
    document.getElementById('fotoInput').required = false;
    document.getElementById('savePhotoBtn').textContent = 'Guardar cambios';
  } else {
    document.getElementById('sheetTitle').textContent = 'Nueva foto de cuenca';
    document.getElementById('editId').value = '';
    document.getElementById('currentPhotoWrap').style.display = 'none';
    document.getElementById('uploadZoneWrap').style.display   = '';
    document.getElementById('fotoInput').required = true;
    document.getElementById('savePhotoBtn').textContent = 'Guardar foto';
  }
  document.getElementById('sheetOverlay').classList.add('open');
}

document.getElementById('changePhotoBtn').addEventListener('click', () => {
  document.getElementById('currentPhotoWrap').style.display = 'none';
  document.getElementById('uploadZoneWrap').style.display   = '';
  document.getElementById('cancelChangeBtn').style.display  = '';
  document.getElementById('fotoInput').required = false;
});

document.getElementById('cancelChangeBtn').addEventListener('click', () => {
  document.getElementById('uploadZoneWrap').style.display   = 'none';
  document.getElementById('currentPhotoWrap').style.display = '';
  document.getElementById('cancelChangeBtn').style.display  = 'none';
  document.getElementById('uploadPreview').style.display    = 'none';
  document.getElementById('fotoInput').value = '';
});

function closeSheet() {
  document.getElementById('sheetOverlay').classList.remove('open');
  _editing = null;
}

document.getElementById('fotoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('previewImg').src = ev.target.result;
    document.getElementById('uploadPreview').style.display = '';
  };
  reader.readAsDataURL(file);
});

document.getElementById('photoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('savePhotoBtn');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    if (_editing) {
      const fd = new FormData();
      fd.set('tituloEs',     document.getElementById('tituloEs').value);
      fd.set('tituloEn',     document.getElementById('tituloEn').value);
      fd.set('cuenca',       document.getElementById('cuenca').value);
      fd.set('subregion',    document.getElementById('subregion').value);
      fd.set('municipio',    document.getElementById('municipio').value);
      fd.set('credito',      document.getElementById('credito').value);
      fd.set('descripcionEs',document.getElementById('descripcionEs').value);
      fd.set('descripcionEn',document.getElementById('descripcionEn').value);
      const file = document.getElementById('fotoInput').files[0];
      if (file) fd.set('foto', file);
      await api.gcUpdateFoto(_mes, _editing._id, fd);
      showToast('Foto actualizada');
    } else {
      const fd = new FormData(e.target);
      await api.gcAddFoto(_mes, fd);
      showToast('Foto guardada');
    }
    closeSheet();
    _fotos = await api.gcFotos(_mes);
    renderGrid(); updateCount();
  } catch (err) {
    showToast('Error: ' + err.message, 4000);
  } finally {
    btn.disabled = false;
    btn.textContent = _editing ? 'Guardar cambios' : 'Guardar foto';
  }
});

function openEdit(id) {
  const foto = _fotos.find(f => f._id === id);
  if (foto) openSheet(foto, _mes);
}

async function deletePhoto(id) {
  if (!confirm('¿Borrar esta foto?')) return;
  await api.gcDeleteFoto(id);
  _fotos = _fotos.filter(f => f._id !== id);
  renderGrid(); updateCount();
  showToast('Foto eliminada');
}

document.getElementById('publicarBtn').addEventListener('click', async () => {
  if (!_fotos.length) { showToast('Agrega fotos antes de publicar'); return; }
  const btn = document.getElementById('publicarBtn');
  btn.disabled = true; btn.textContent = 'Publicando…';
  try {
    const { count } = await api.gcPublicar(_mes);
    showToast(`✅ ${count} fotos publicadas para ${fmtMes(_mes)}`);
    _fotos = await api.gcFotos(_mes);
    renderGrid();
  } catch (err) {
    showToast('Error: ' + err.message, 4000);
  } finally {
    btn.disabled = false; btn.textContent = '✓ Publicar mes';
  }
});

function fmtMes(mes) {
  const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [y, m] = mes.split('-');
  return `${MESES[+m]} ${y}`;
}
