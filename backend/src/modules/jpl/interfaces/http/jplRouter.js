'use strict';
// Punto de composición del módulo JPL — arma los adaptadores concretos,
// construye los casos de uso con inyección manual (sin contenedor de DI:
// JavaScript plano, factory functions) y expone las rutas Express. Es la
// única capa que conoce Express y las dependencias concretas a la vez; el
// resto del módulo (domain/, application/) no sabe que esto existe.
//
// requireAdmin se aplica al montar este router en routes/admin.js
// (`router.use('/jpl', requireAdmin, jplRouter)`), no aquí adentro.
const express = require('express');
const multer  = require('multer');

const { redis } = require('../../../../db');
const { getCached, invalidate, TTL } = require('../../../../utils/cache');

const MongooseFotoRepositorio        = require('../../infrastructure/MongooseFotoRepositorio');
const { crearCachedFotoRepositorio } = require('../../infrastructure/CachedFotoRepositorio');
const almacenamiento                 = require('../../infrastructure/SharpAlmacenamientoFotos');
const publicador                     = require('../../infrastructure/FileSystemPublicadorGaleria');
const estadisticas                   = require('../../infrastructure/MongooseEstadisticasJpl');

const { crearListarMeses }                  = require('../../application/casos_uso/listarMeses');
const { crearListarFotosDelMes }            = require('../../application/casos_uso/listarFotosDelMes');
const { crearCrearFoto }                    = require('../../application/casos_uso/crearFoto');
const { crearActualizarFoto }               = require('../../application/casos_uso/actualizarFoto');
const { crearEliminarFoto }                 = require('../../application/casos_uso/eliminarFoto');
const { crearPublicarMes }                  = require('../../application/casos_uso/publicarMes');
const { crearObtenerAnalytics }             = require('../../application/casos_uso/obtenerAnalytics');
const { crearObtenerEstadisticasMensuales } = require('../../application/casos_uso/obtenerEstadisticasMensuales');

const { ErrorValidacion, ErrorNoEncontrado, ErrorSinContenido } = require('../../domain/errores');

// ─── Composición ────────────────────────────────────────────────────────
const repositorio = crearCachedFotoRepositorio(MongooseFotoRepositorio, redis);
const cache = { invalidar: (...keys) => invalidate(redis, ...keys) };

const listarMeses                  = crearListarMeses({ repositorio });
const listarFotosDelMes            = crearListarFotosDelMes({ repositorio });
const crearFoto                    = crearCrearFoto({ repositorio, almacenamiento, cache });
const actualizarFoto               = crearActualizarFoto({ repositorio, almacenamiento, cache });
const eliminarFoto                 = crearEliminarFoto({ repositorio, almacenamiento, cache });
const publicarMes                  = crearPublicarMes({ repositorio, publicador, cache });
const obtenerAnalytics             = crearObtenerAnalytics({ estadisticas });
const obtenerEstadisticasMensuales = crearObtenerEstadisticasMensuales({ estadisticas });

// ─── Multer (igual configuración que antes) ────────────────────────────
const jplUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, /\.(jpe?g|webp|png)$/i.test(file.originalname));
  },
});
const jplFields = jplUpload.fields([{ name: 'fotosNuevas', maxCount: 3 }]);

// Adapta los archivos de multer a la forma mínima que esperan los casos de
// uso — así no dependen de la forma completa del objeto de multer
// (mimetype, size, fieldname, etc.), solo de lo que realmente necesitan.
function mapearArchivos(reqFiles) {
  return (reqFiles?.fotosNuevas || []).map(f => ({ buffer: f.buffer, originalname: f.originalname }));
}

// Traduce errores de dominio a códigos HTTP, preservando el mismo
// `{ error: '<mensaje>' }` que ya consume admin/jpl.js. Cualquier otro
// error se relanza — mismo comportamiento que las rutas originales, que
// tampoco atrapaban errores inesperados (ninguna tenía try/catch salvo
// /autofill).
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

router.get('/stats/analytics', async (req, res) => {
  const result = await getCached(redis, 'jpl:stats:analytics', TTL.JPL_STATS, obtenerAnalytics);
  res.json(result);
});

router.get('/stats/monthly', async (req, res) => {
  const result = await getCached(redis, 'jpl:stats:monthly', TTL.JPL_STATS, obtenerEstadisticasMensuales);
  res.json(result);
});

router.post('/fotos/:mes', jplFields, async (req, res) => {
  try {
    const creada = await crearFoto({
      ...req.body,
      mes: req.params.mes,
      archivosNuevos: mapearArchivos(req.files),
    });
    res.status(201).json(creada);
  } catch (err) {
    manejarError(err, res);
  }
});

router.put('/fotos/:mes/:id', jplFields, async (req, res) => {
  try {
    const actualizada = await actualizarFoto({
      ...req.body,
      id: req.params.id,
      mes: req.params.mes,
      fotosExistentes: JSON.parse(req.body.fotosExistentes || '[]'),
      archivosNuevos: mapearArchivos(req.files),
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
