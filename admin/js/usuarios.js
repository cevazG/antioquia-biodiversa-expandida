const ROL_LABEL = {
  'Curador.Biodiversidad': '🦜 Biodiversidad',
  'Curador.GuardaCuencas': '💧 Guarda Cuencas',
  'Admin.Contenido':       '👑 Admin',
};

let _usuarios = [];
let _editing = null;

checkAuth().then(sesion => {
  // Defensa extra en el cliente — el backend ya exige Admin.Contenido en
  // /api/admin/usuarios, esto solo evita que alguien sin ese rol vea una
  // pantalla que de todos modos le va a fallar en cada petición.
  if (sesion && !(sesion.roles || []).includes('Admin.Contenido')) {
    location.href = '/admin/jpl.html';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api.logout(); location.href = '/admin/';
});

window.addEventListener('DOMContentLoaded', async () => {
  _usuarios = await api.usuarios();
  renderList();
});

function renderList() {
  const wrap  = document.getElementById('usuariosList');
  const empty = document.getElementById('emptyUsuarios');
  if (!_usuarios.length) { wrap.innerHTML = ''; empty.style.display = ''; return; }
  empty.style.display = 'none';
  wrap.innerHTML = _usuarios.map(u => `
    <div class="photo-card" data-id="${u._id}" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px">
      <div>
        <div class="photo-card__title">${u.nombre} ${u.activo ? '' : '<span class="badge badge--gray">Inactivo</span>'}</div>
        <div class="photo-card__sub">@${u.usuario}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          ${(u.roles || []).map(r => `<span class="badge badge--green">${ROL_LABEL[r] || r}</span>`).join('')}
        </div>
      </div>
      <div class="photo-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openEdit('${u._id}')">✏️</button>
        <button class="btn btn--ghost btn--sm" onclick="resetearMfa('${u._id}')" title="Resetear MFA (perdió su dispositivo)">🔑</button>
        ${u.activo ? `<button class="btn btn--danger btn--sm" onclick="desactivar('${u._id}')">🚫</button>` : ''}
      </div>
    </div>`).join('');
}

document.getElementById('nuevoUsuarioBtn').addEventListener('click', () => openSheet(null));
document.getElementById('cancelSheetBtn').addEventListener('click', closeSheet);
document.getElementById('sheetOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('sheetOverlay')) closeSheet();
});

function openSheet(usuario) {
  _editing = usuario;
  document.getElementById('usuarioForm').reset();
  document.getElementById('activo').checked = true;
  ['rolBiodiversidad', 'rolGuardaCuencas', 'rolAdmin'].forEach(id => {
    document.getElementById(id).checked = false;
  });

  if (usuario) {
    document.getElementById('sheetTitle').textContent = 'Editar usuario';
    document.getElementById('editId').value  = usuario._id;
    document.getElementById('nombre').value  = usuario.nombre || '';
    document.getElementById('usuario').value = usuario.usuario || '';
    document.getElementById('activo').checked = !!usuario.activo;
    (usuario.roles || []).forEach(r => {
      if (r === 'Curador.Biodiversidad') document.getElementById('rolBiodiversidad').checked = true;
      if (r === 'Curador.GuardaCuencas') document.getElementById('rolGuardaCuencas').checked = true;
      if (r === 'Admin.Contenido')       document.getElementById('rolAdmin').checked = true;
    });
    document.getElementById('passwordLabel').innerHTML = 'Nueva contraseña <small style="color:var(--muted)">(dejar vacío para no cambiarla)</small>';
    document.getElementById('password').required = false;
    document.getElementById('saveUsuarioBtn').textContent = 'Guardar cambios';
  } else {
    document.getElementById('sheetTitle').textContent = 'Nuevo usuario';
    document.getElementById('editId').value = '';
    document.getElementById('passwordLabel').innerHTML = 'Contraseña * <small style="color:var(--muted)">(mínimo 8 caracteres)</small>';
    document.getElementById('password').required = true;
    document.getElementById('saveUsuarioBtn').textContent = 'Guardar usuario';
  }
  document.getElementById('sheetOverlay').classList.add('open');
}

function closeSheet() {
  document.getElementById('sheetOverlay').classList.remove('open');
  _editing = null;
}

function rolesSeleccionados() {
  return ['rolBiodiversidad', 'rolGuardaCuencas', 'rolAdmin']
    .map(id => document.getElementById(id))
    .filter(el => el.checked)
    .map(el => el.value);
}

document.getElementById('usuarioForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('saveUsuarioBtn');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    const datos = {
      nombre:  document.getElementById('nombre').value,
      usuario: document.getElementById('usuario').value,
      roles:   rolesSeleccionados(),
      activo:  document.getElementById('activo').checked,
    };
    const password = document.getElementById('password').value;
    if (password) datos.password = password;

    if (_editing) {
      await api.usuarioEditar(_editing._id, datos);
      showToast('Usuario actualizado');
    } else {
      await api.usuarioCrear(datos);
      showToast('Usuario creado');
    }
    closeSheet();
    _usuarios = await api.usuarios();
    renderList();
  } catch (err) {
    showToast('Error: ' + err.message, 4000);
  } finally {
    btn.disabled = false;
    btn.textContent = _editing ? 'Guardar cambios' : 'Guardar usuario';
  }
});

function openEdit(id) {
  const usuario = _usuarios.find(u => u._id === id);
  if (usuario) openSheet(usuario);
}

async function desactivar(id) {
  if (!confirm('¿Desactivar este usuario? Ya no podrá ingresar al panel, pero el registro se conserva.')) return;
  await api.usuarioDesactivar(id);
  _usuarios = await api.usuarios();
  renderList();
  showToast('Usuario desactivado');
}

async function resetearMfa(id) {
  if (!confirm('¿Resetear el MFA de este usuario? En su próximo login deberá escanear un código QR nuevo (por ejemplo, si perdió su celular).')) return;
  await api.usuarioResetearMfa(id);
  showToast('MFA reseteado — se le pedirá enrolar un dispositivo nuevo en su próximo login');
}
