const API = '/api/admin';

async function req(method, url, body) {
  const opts = { method, credentials: 'include' };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API + url, opts);
  if (res.status === 401) { location.href = '/admin/'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

const api = {
  me:              () => req('GET',  '/me'),
  login:           (pw) => req('POST', '/login', { password: pw }),
  logout:          () => req('POST', '/logout'),

  jplMeses:        () => req('GET',  '/jpl/meses'),
  jplFotos:        (mes) => req('GET',  `/jpl/fotos/${mes}`),
  jplAddFoto:      (mes, fd) => req('POST', `/jpl/fotos/${mes}`, fd),
  jplUpdateFoto:   (mes, id, fd) => req('PUT', `/jpl/fotos/${mes}/${id}`, fd),
  jplDeleteFoto:   (id) => req('DELETE', `/jpl/fotos/${id}`),
  jplPublicar:     (mes) => req('POST', `/jpl/publicar/${mes}`),
  jplStatsMonthly:   ()  => req('GET',  '/jpl/stats/monthly'),
  jplStatsAnalytics: ()  => req('GET',  '/jpl/stats/analytics'),

  gcMeses:         () => req('GET',  '/gc/meses'),
  gcFotos:         (mes) => req('GET',  `/gc/fotos/${mes}`),
  gcAddFoto:       (mes, fd) => req('POST', `/gc/fotos/${mes}`, fd),
  gcUpdateFoto:    (mes, id, fd) => req('PUT', `/gc/fotos/${mes}/${id}`, fd),
  gcDeleteFoto:    (id) => req('DELETE', `/gc/fotos/${id}`),
  gcPublicar:      (mes) => req('POST', `/gc/publicar/${mes}`),

  autofill: (scientificName) => req('POST', '/autofill', { scientificName }),
};

function showToast(msg, duration = 2500) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), duration);
}

async function checkAuth() {
  const { isAdmin } = await api.me();
  if (!isAdmin) location.href = '/admin/';
}
