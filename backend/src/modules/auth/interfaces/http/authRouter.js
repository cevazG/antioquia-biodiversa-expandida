'use strict';
// /login, /logout, /me — ninguna de las tres está detrás de requireAuth,
// igual que en el mecanismo anterior: /login y /logout deben ser
// alcanzables sin sesión, y /me es una consulta segura de "¿sigo
// logueado?" que siempre responde 200 (nunca 401), para que el frontend
// pueda usarla como probe sin manejar el redirect-a-login como error.
const express = require('express');
const repositorio = require('../../infrastructure/MongooseUsuarioRepositorio');
const { crearIniciarSesion } = require('../../application/casos_uso/iniciarSesion');
const { ErrorCredencialInvalida, ErrorUsuarioInactivo } = require('../../domain/errores');
const { usuarioDeSesion } = require('./middleware');
const verificarRecaptcha = require('../../infrastructure/verificarRecaptcha');

const iniciarSesion = crearIniciarSesion({ repositorio });

const router = express.Router();

router.post('/login', async (req, res) => {
  const recaptchaOk = await verificarRecaptcha(req.body.recaptchaToken);
  if (!recaptchaOk) {
    return res.status(401).json({ error: 'Verificación de seguridad fallida. Vuelve a intentarlo.' });
  }
  try {
    const sesion = await iniciarSesion({ usuario: req.body.usuario, password: req.body.password });
    req.session.usuarioId = sesion.id;
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof ErrorCredencialInvalida || err instanceof ErrorUsuarioInactivo) {
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
