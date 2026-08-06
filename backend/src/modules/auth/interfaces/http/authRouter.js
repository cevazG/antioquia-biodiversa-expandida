'use strict';
// /login, /login/mfa, /logout, /me — ninguna está detrás de requireAuth,
// igual que en el mecanismo anterior: deben ser alcanzables sin sesión
// completa, y /me es una consulta segura de "¿sigo logueado?" que siempre
// responde 200 (nunca 401), para que el frontend pueda usarla como probe
// sin manejar el redirect-a-login como error.
//
// Login en dos pasos (MFA obligatorio para todos los curadores, ver
// CLAUDE.md § "Panel admin — Autenticación y usuarios"):
//   1. POST /login (usuario+password+recaptcha) valida credenciales pero
//      NO abre sesión todavía — solo marca req.session.usuarioIdPendienteMfa.
//      Si el usuario no tiene MFA configurado, genera un secreto nuevo y
//      devuelve el QR para enrolar; si ya lo tiene, pide el código de 6
//      dígitos directamente.
//   2. POST /login/mfa verifica el código contra usuarioIdPendienteMfa y
//      recién ahí promueve la sesión a usuarioId (login completo).
//
// Ambos pasos tienen rate limiting por IP (utils/rateLimit.js) — capa
// adicional a reCAPTCHA/al keyspace del código TOTP contra fuerza bruta.
const express = require('express');
const repositorio = require('../../infrastructure/MongooseUsuarioRepositorio');
const { crearIniciarSesion } = require('../../application/casos_uso/iniciarSesion');
const { crearIniciarEnrolamientoMfa } = require('../../application/casos_uso/iniciarEnrolamientoMfa');
const { crearVerificarMfa } = require('../../application/casos_uso/verificarMfa');
const { ErrorCredencialInvalida, ErrorUsuarioInactivo, ErrorCodigoMfaInvalido } = require('../../domain/errores');
const { usuarioDeSesion } = require('./middleware');
const verificarRecaptcha = require('../../infrastructure/verificarRecaptcha');
const qrCode = require('../../infrastructure/qrCode');
const { limiterLogin, limiterMfa } = require('../../../../utils/rateLimit');

const iniciarSesion = crearIniciarSesion({ repositorio });
const iniciarEnrolamientoMfa = crearIniciarEnrolamientoMfa({ repositorio });
const verificarMfa = crearVerificarMfa({ repositorio });

const router = express.Router();

router.post('/login', limiterLogin, async (req, res) => {
  const recaptchaOk = await verificarRecaptcha(req.body.recaptchaToken);
  if (!recaptchaOk) {
    return res.status(401).json({ error: 'Verificación de seguridad fallida. Vuelve a intentarlo.' });
  }
  try {
    const sesion = await iniciarSesion({ usuario: req.body.usuario, password: req.body.password });
    req.session.usuarioIdPendienteMfa = sesion.id;

    if (!sesion.mfaHabilitado) {
      const { uri } = await iniciarEnrolamientoMfa({ usuarioId: sesion.id, nombreUsuario: sesion.usuario });
      const qr = await qrCode.generarDataUrl(uri);
      return res.json({ requiereMfaSetup: true, qr });
    }
    res.json({ requiereMfaCodigo: true });
  } catch (err) {
    if (err instanceof ErrorCredencialInvalida || err instanceof ErrorUsuarioInactivo) {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
});

router.post('/login/mfa', limiterMfa, async (req, res) => {
  const usuarioId = req.session.usuarioIdPendienteMfa;
  if (!usuarioId) return res.status(401).json({ error: 'Sesión de login expirada, vuelve a intentarlo.' });
  try {
    const { id } = await verificarMfa({ usuarioId, codigo: req.body.codigo });
    delete req.session.usuarioIdPendienteMfa;
    req.session.usuarioId = id;
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof ErrorCodigoMfaInvalido || err instanceof ErrorUsuarioInactivo) {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const usuario = await usuarioDeSesion(req);
  if (!usuario) return res.json({ isAdmin: false });
  res.json({ isAdmin: true, nombre: usuario.nombre, roles: usuario.roles });
});

module.exports = router;
