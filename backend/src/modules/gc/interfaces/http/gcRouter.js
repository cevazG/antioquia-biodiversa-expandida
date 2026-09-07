'use strict';
// Punto de composición del módulo Guarda Cuencas — mismo patrón que
// modules/jpl/interfaces/http/jplRouter.js, adaptado a las diferencias
// reales del dominio: un solo archivo por registro (no hasta 3), sin
// validación taxonómica (grupo/iucn/endémica no existen acá), sin rutas
// de estadísticas.
//
// requireAdmin se aplica al montar este router en routes/admin.js, no aquí.
const express = require('express');
const multer  = require('multer');

const { redis } = require('../../../../db');
const { invalidate } = require('../../../../utils/cache');

const MongooseFotoCuencaRepositorio        = require('../../infrastructure/MongooseFotoCuencaRepositorio');
const { crearCachedFotoCuencaRepositorio } = require('../../infrastructure/CachedFotoCuencaRepositorio');
const almacenamiento                       = require('../../infrastructure/SharpAlmacenamientoFotoCuenca');
const publicador                           = require('../../infrastructure/FileSystemPublicadorCuencas');

const { crearListarMeses }        = require('../../application/casos_uso/listarMeses');
const { crearListarFotosDelMes }  = require('../../application/casos_uso/listarFotosDelMes');
const { crearCrearFoto }          = require('../../application/casos_uso/crearFoto');
const { crearActualizarFoto }     = require('../../application/casos_uso/actualizarFoto');
const { crearEliminarFoto }       = require('../../application/casos_uso/eliminarFoto');
const { crearPublicarMes }        = require('../../application/casos_uso/publicarMes');

const { ErrorValidacion, ErrorNoEncontrado, ErrorSinContenido } = require('../../domain/errores');

// ─── Composición ────────────────────────────────────────────────────────
const repositorio = crearCachedFotoCuencaRepositorio(MongooseFotoCuencaRepositorio, redis);
const cache = { invalidar: (...keys) => invalidate(redis, ...keys) };

const listarMeses       = crearListarMeses({ repositorio });
const listarFotosDelMes = crearListarFotosDelMes({ repositorio });
const crearFoto          = crearCrearFoto({ repositorio, almacenamiento, cache });
const actualizarFoto     = crearActualizarFoto({ repositorio, almacenamiento, cache });
const eliminarFoto       = crearEliminarFoto({ repositorio, almacenamiento, cache });
const publicarMes        = crearPublicarMes({ repositorio, publicador, cache });

// ─── Multer (igual configuración que antes) ────────────────────────────
const gcUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, /\.(jpe?g|webp|png)$/i.test(file.originalname));
  },
});

// Traduce errores de dominio a códigos HTTP, preservando el mismo
// `{ error: '<mensaje>' }` que ya consume admin/gc.js.
function manejarError(err, res) {
  if (err instanceof ErrorValidacion || err instanceof ErrorSinContenido) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof ErrorNoEncontrado) {
    return res.status(404).json({ error: err.message });
  }
  throw err;
}

// ─── Rutas ──────────────────────────────────────────────────────────────
const router = express.Router();

router.get('/meses', async (req, res) => {
  res.json(await listarMeses());
});

router.get('/fotos/:mes', async (req, res) => {
  res.json(await listarFotosDelMes(req.params.mes));
});

router.post('/fotos/:mes', gcUpload.single('foto'), async (req, res) => {
  try {
    const creada = await crearFoto({
      ...req.body,
      mes: req.params.mes,
      archivo: req.file ? { buffer: req.file.buffer } : null,
    });
    res.status(201).json(creada);
  } catch (err) {
    manejarError(err, res);
  }
});

router.put('/fotos/:mes/:id', gcUpload.single('foto'), async (req, res) => {
  try {
    const actualizada = await actualizarFoto({
      ...req.body,
      id: req.params.id,
      mes: req.params.mes,
      archivo: req.file ? { buffer: req.file.buffer } : null,
    });
    res.json(actualizada);
  } catch (err) {
    manejarError(err, res);
  }
});

router.delete('/fotos/:id', async (req, res) => {
  try {
    res.json(await eliminarFoto(req.params.id));
  } catch (err) {
    manejarError(err, res);
  }
});

router.post('/publicar/:mes', async (req, res) => {
  try {
    const resultado = await publicarMes(req.params.mes);
    res.json({ ok: true, count: resultado.count });
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;
