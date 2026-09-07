'use strict';
// CRUD de usuarios del panel admin. requireRole('Admin.Contenido') se
// aplica al montar este router en routes/admin.js, no aquí adentro.
const express = require('express');
const repositorio = require('../../infrastructure/MongooseUsuarioRepositorio');
const hasher = require('../../infrastructure/BcryptHasher');

const { crearListarUsuarios }    = require('../../application/casos_uso/listarUsuarios');
const { crearCrearUsuario }      = require('../../application/casos_uso/crearUsuario');
const { crearActualizarUsuario } = require('../../application/casos_uso/actualizarUsuario');
const { crearDesactivarUsuario } = require('../../application/casos_uso/desactivarUsuario');
const { crearResetearMfa }       = require('../../application/casos_uso/resetearMfa');

const { ErrorValidacion, ErrorNoEncontrado, ErrorUsuarioDuplicado } = require('../../domain/errores');

const listarUsuarios    = crearListarUsuarios({ repositorio });
const crearUsuario      = crearCrearUsuario({ repositorio, hasher });
const actualizarUsuario = crearActualizarUsuario({ repositorio, hasher });
const desactivarUsuario = crearDesactivarUsuario({ repositorio });
const resetearMfa       = crearResetearMfa({ repositorio });

// Traduce errores de dominio a códigos HTTP, mismo patrón que
// modules/jpl y modules/gc.
function manejarError(err, res) {
  if (err instanceof ErrorValidacion || err instanceof ErrorUsuarioDuplicado) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof ErrorNoEncontrado) {
    return res.status(404).json({ error: err.message });
  }
  throw err;
}

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await listarUsuarios());
});

router.post('/', async (req, res) => {
  try {
    const creado = await crearUsuario(req.body);
    // Nunca exponer passwordHash, ni por accidente — repositorio.crear()
    // devuelve el documento completo, acá se elige explícitamente qué sale.
    res.status(201).json({
      _id: creado._id, nombre: creado.nombre, usuario: creado.usuario,
      roles: creado.roles, activo: creado.activo,
    });
  } catch (err) {
    manejarError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  try {
    res.json(await actualizarUsuario(req.params.id, req.body));
  } catch (err) {
    manejarError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    res.json(await desactivarUsuario(req.params.id));
  } catch (err) {
    manejarError(err, res);
  }
});

// El usuario vuelve a quedar "sin MFA enrolado" — su próximo login le pide
// escanear un QR nuevo. Pensado para cuando pierde el dispositivo.
router.post('/:id/reset-mfa', async (req, res) => {
  try {
    res.json(await resetearMfa(req.params.id));
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;
