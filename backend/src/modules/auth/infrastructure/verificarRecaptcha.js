'use strict';
// Verifica el token de reCAPTCHA v2 contra la API de Google antes de intentar
// el login del panel — control exigido por el Manual de Lineamientos de
// Seguridad de la Gobernación (protección anti-fuerza-bruta/bots).
//
// RECAPTCHA_SECRET_KEY usa por defecto la clave de PRUEBA oficial de Google
// (ver backend/.env.example) mientras el dominio real no está desplegado;
// esa clave siempre valida como exitosa. Antes de producción hay que
// reemplazarla por una clave real registrada para el dominio final.
const ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

async function verificarRecaptcha(token) {
  if (!token) return false;
  const params = new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: token });
  const res = await fetch(ENDPOINT, { method: 'POST', body: params });
  const data = await res.json();
  return data.success === true;
}

module.exports = verificarRecaptcha;
