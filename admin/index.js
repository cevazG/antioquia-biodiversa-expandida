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
    const resultado = await api.login(document.getElementById('usuario').value, document.getElementById('password').value, recaptchaToken);
    mostrarPasoMfa(resultado);
  } catch (err) {
    errorMsg.textContent = err.message || 'Usuario o contraseña incorrectos';
    errorMsg.style.display = 'block';
    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
});

// Segundo paso: código de 6 dígitos (con QR si es la primera vez que este
// usuario configura MFA). El formulario de usuario/contraseña se oculta —
// si el código falla, se reintenta el código, no hay que volver a escribir
// la contraseña.
function mostrarPasoMfa({ requiereMfaSetup, qr }) {
  document.getElementById('loginForm').hidden = true;
  const mfaForm = document.getElementById('mfaForm');
  mfaForm.hidden = false;

  if (requiereMfaSetup) {
    document.getElementById('mfaSetupIntro').hidden = false;
    const img = document.getElementById('mfaQr');
    img.src = qr;
    img.hidden = false;
  }
  document.getElementById('mfaCodigo').focus();
}

document.getElementById('mfaForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const errorMsg = document.getElementById('mfaErrorMsg');
  btn.disabled = true;
  btn.textContent = 'Verificando…';
  try {
    await api.loginMfa(document.getElementById('mfaCodigo').value);
    location.href = '/admin/jpl.html';
  } catch (err) {
    errorMsg.textContent = err.message || 'Código incorrecto';
    errorMsg.style.display = 'block';
    document.getElementById('mfaCodigo').value = '';
    document.getElementById('mfaCodigo').focus();
    btn.disabled = false;
    btn.textContent = 'Verificar';
  }
});
