(async () => {
  const { isAdmin } = await api.me();
  if (isAdmin) location.href = '/admin/jpl.html';
})();

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';
  try {
    await api.login(document.getElementById('password').value);
    location.href = '/admin/jpl.html';
  } catch {
    document.getElementById('errorMsg').style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
});
