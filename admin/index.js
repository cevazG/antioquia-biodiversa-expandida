(async () => {
  const { isAdmin } = await api.me();
  if (isAdmin) location.href = '/admin/jpl.html';
})();

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const errorMsg = document.getElementById('errorMsg');
  const recaptchaToken = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
  if (!recaptchaToken) {
    errorMsg.textContent = 'Marca la casilla de verificación antes de continuar.';
    errorMsg.style.display = 'block';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Ingresando…';
  try {
    await api.login(document.getElementById('usuario').value, document.getElementById('password').value, recaptchaToken);
    location.href = '/admin/jpl.html';
  } catch (err) {
    errorMsg.textContent = err.message || 'Usuario o contraseña incorrectos';
    errorMsg.style.display = 'block';
    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
});
