const express  = require('express');
const multer   = require('multer');
const bcrypt   = require('bcryptjs');
const router   = express.Router();

const { requireAdmin }          = require('../middleware/adminAuth');
const { getCached, invalidate, TTL } = require('../utils/cache');
const { redis }                 = require('../db');
const JplPhoto = require('../models/JplPhoto');
const GcPhoto  = require('../models/GcPhoto');
const { GRUPOS_VALIDOS, SUBREGIONES_VALIDAS, IUCN_VALIDOS } = require('../config/catalogo');
const { saveJplFile, saveGcFile, borrarSiExiste } = require('../services/fotoStorage');
const jplStats     = require('../services/jplStats');
const publicacion  = require('../services/publicacion');
const inaturalist  = require('../services/inaturalistLookup');

// ─── Configuración de multer ───────────────────────────────────────────────

// JPL usa memoryStorage para poder construir la ruta con grupo + especie
const jplUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, /\.(jpe?g|webp|png)$/i.test(file.originalname));
  },
});
const jplFields = jplUpload.fields([{ name: 'fotosNuevas', maxCount: 3 }]);

// GC usa memoryStorage igual que JPL para poder procesar con sharp antes de guardar
const gcUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, /\.(jpe?g|webp|png)$/i.test(file.originalname));
  },
});

// ─── Auth ──────────────────────────────────────────────────────────────────
// La contraseña nunca se compara en texto plano: ADMIN_PASSWORD_HASH guarda
// el hash bcrypt (ver .env.example para el comando que lo genera).
router.post('/login', (req, res) => {
  const clave = req.body.password || '';
  if (bcrypt.compareSync(clave, process.env.ADMIN_PASSWORD_HASH)) {
    req.session.isAdmin = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin });
});

// ─── Autofill iNaturalist ─────────────────────────────────────────────────
router.post('/autofill', requireAdmin, async (req, res) => {
  const { scientificName } = req.body;
  if (!scientificName?.trim()) return res.status(400).json({ error: 'Se requiere nombre científico' });

  try {
    const resultado = await inaturalist.buscarEspecie(scientificName);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    // nosemgrep: error-detail-in-response -- ruta detrás de requireAdmin; el detalle ayuda a diagnosticar fallas de la API pública de iNaturalist, no expone datos internos del servidor
    res.status(500).json({ error: 'Error consultando iNaturalist', detail: err.message });
  }
});

// ─── JPL ──────────────────────────────────────────────────────────────────
router.get('/jpl/meses', requireAdmin, async (req, res) => {
  const meses = await getCached(redis, 'jpl:meses', TTL.JPL_MESES, async () => {
    const lista = await JplPhoto.distinct('mes');
    lista.sort((a, b) => b.localeCompare(a));
    return lista;
  });
  res.json(meses);
});

router.get('/jpl/fotos/:mes', requireAdmin, async (req, res) => {
  const mes   = req.params.mes;
  const fotos = await getCached(redis, `jpl:fotos:${mes}`, TTL.JPL_FOTOS, () =>
    JplPhoto.find({ mes }).sort('orden createdAt').lean()
  );
  res.json(fotos);
});

router.get('/jpl/stats/analytics', requireAdmin, async (req, res) => {
  const result = await getCached(redis, 'jpl:stats:analytics', TTL.JPL_STATS, jplStats.calcularAnalytics);
  res.json(result);
});

router.get('/jpl/stats/monthly', requireAdmin, async (req, res) => {
  const result = await getCached(redis, 'jpl:stats:monthly', TTL.JPL_STATS, jplStats.calcularEstadisticasMensuales);
  res.json(result);
});

router.post('/jpl/fotos/:mes', requireAdmin, jplFields, async (req, res) => {
  const mes = req.params.mes;
  const newFiles = req.files?.fotosNuevas || [];
  if (!newFiles.length) return res.status(400).json({ error: 'Se requiere al menos una foto' });
  if (!req.body.especieEs?.trim()) return res.status(400).json({ error: 'Se requiere el nombre común de la especie' });
  if (!GRUPOS_VALIDOS.includes(req.body.grupo)) return res.status(400).json({ error: 'Grupo taxonómico no reconocido' });
  if (!SUBREGIONES_VALIDAS.includes(req.body.subregion)) return res.status(400).json({ error: 'Subregión no reconocida' });
  if (req.body.iucn && !IUCN_VALIDOS.includes(req.body.iucn)) return res.status(400).json({ error: 'Código IUCN no reconocido' });

  const fotoPaths = [];
  for (const f of newFiles) {
    fotoPaths.push(await saveJplFile(f.buffer, f.originalname, mes, req.body.grupo || 'sin-grupo', req.body.especieCientifico));
  }

  const count = await JplPhoto.countDocuments({ mes });
  const photo = await JplPhoto.create({
    mes,
    orden:             count,
    fotos:             fotoPaths,
    credito:           req.body.credito           || '',
    municipio:         req.body.municipio          || '',
    subregion:         req.body.subregion,
    especieEs:         req.body.especieEs,
    especieEn:         req.body.especieEn          || '',
    especieCientifico: req.body.especieCientifico  || '',
    grupo:             req.body.grupo,
    iucn:              req.body.iucn               || 'DD',
    endemica:          req.body.endemica === 'true',
    descripcionEs:     req.body.descripcionEs      || '',
    descripcionEn:     req.body.descripcionEn      || '',
  });
  await invalidate(redis, `jpl:fotos:${mes}`, 'jpl:stats:analytics', 'jpl:stats:monthly');
  res.status(201).json(photo);
});

router.put('/jpl/fotos/:mes/:id', requireAdmin, jplFields, async (req, res) => {
  if (!req.body.especieEs?.trim()) return res.status(400).json({ error: 'Se requiere el nombre común de la especie' });
  if (!GRUPOS_VALIDOS.includes(req.body.grupo)) return res.status(400).json({ error: 'Grupo taxonómico no reconocido' });
  if (!SUBREGIONES_VALIDAS.includes(req.body.subregion)) return res.status(400).json({ error: 'Subregión no reconocida' });
  if (req.body.iucn && !IUCN_VALIDOS.includes(req.body.iucn)) return res.status(400).json({ error: 'Código IUCN no reconocido' });

  const update = {
    credito:           req.body.credito           || '',
    municipio:         req.body.municipio          || '',
    subregion:         req.body.subregion,
    especieEs:         req.body.especieEs,
    especieEn:         req.body.especieEn          || '',
    especieCientifico: req.body.especieCientifico  || '',
    grupo:             req.body.grupo,
    iucn:              req.body.iucn               || 'DD',
    endemica:          req.body.endemica === 'true',
    descripcionEs:     req.body.descripcionEs      || '',
    descripcionEn:     req.body.descripcionEn      || '',
    publicado:         false,
  };

  // Fotos a conservar (enviadas como JSON desde el frontend)
  const keepPaths = JSON.parse(req.body.fotosExistentes || '[]');

  // Borrar del disco las fotos que ya no se quieren
  const old = await JplPhoto.findById(req.params.id);
  if (old) {
    const removed = (old.fotos || []).filter(p => !keepPaths.includes(p));
    removed.forEach(p => borrarSiExiste('comunidad/jovenes_pa_lante', p));
  }

  // Guardar fotos nuevas
  const newFiles = req.files?.fotosNuevas || [];
  const newPaths = [];
  for (const f of newFiles) {
    newPaths.push(await saveJplFile(f.buffer, f.originalname, req.params.mes, update.grupo || 'sin-grupo', update.especieCientifico));
  }

  update.fotos = [...keepPaths, ...newPaths].slice(0, 3);
  if (!update.fotos.length) return res.status(400).json({ error: 'Se requiere al menos una foto' });

  const photo = await JplPhoto.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  await invalidate(redis, `jpl:fotos:${req.params.mes}`, 'jpl:stats:analytics', 'jpl:stats:monthly');
  res.json(photo);
});

router.delete('/jpl/fotos/:id', requireAdmin, async (req, res) => {
  const photo = await JplPhoto.findByIdAndDelete(req.params.id);
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  (photo.fotos || []).forEach(p => borrarSiExiste('comunidad/jovenes_pa_lante', p));
  await invalidate(redis, 'jpl:fotos:*', 'jpl:stats:analytics', 'jpl:stats:monthly');
  res.json({ ok: true });
});

router.post('/jpl/publicar/:mes', requireAdmin, async (req, res) => {
  const resultado = await publicacion.publicarJpl(req.params.mes);
  if (!resultado) return res.status(400).json({ error: 'Sin fotos para publicar' });
  res.json({ ok: true, count: resultado.count });
});

// ─── GUARDA CUENCAS ────────────────────────────────────────────────────────
router.get('/gc/meses', requireAdmin, async (req, res) => {
  const meses = await getCached(redis, 'gc:meses', TTL.GC_MESES, async () => {
    const lista = await GcPhoto.distinct('mes');
    lista.sort((a, b) => b.localeCompare(a));
    return lista;
  });
  res.json(meses);
});

router.get('/gc/fotos/:mes', requireAdmin, async (req, res) => {
  const mes   = req.params.mes;
  const fotos = await getCached(redis, `gc:fotos:${mes}`, TTL.GC_FOTOS, () =>
    GcPhoto.find({ mes }).sort('orden createdAt').lean()
  );
  res.json(fotos);
});

router.post('/gc/fotos/:mes', requireAdmin, gcUpload.single('foto'), async (req, res) => {
  const mes = req.params.mes;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto' });
  if (!req.body.cuenca?.trim()) return res.status(400).json({ error: 'Se requiere el nombre de la cuenca' });
  if (!req.body.tituloEs?.trim()) return res.status(400).json({ error: 'Se requiere un título' });
  if (!SUBREGIONES_VALIDAS.includes(req.body.subregion)) return res.status(400).json({ error: 'Subregión no reconocida' });
  const rel = await saveGcFile(req.file.buffer, mes);
  const count = await GcPhoto.countDocuments({ mes });
  const photo = await GcPhoto.create({
    mes,
    orden:        count,
    foto:         rel,
    credito:      req.body.credito       || '',
    municipio:    req.body.municipio     || '',
    subregion:    req.body.subregion,
    cuenca:       req.body.cuenca,
    tituloEs:     req.body.tituloEs,
    tituloEn:     req.body.tituloEn      || '',
    descripcionEs:req.body.descripcionEs || '',
    descripcionEn:req.body.descripcionEn || '',
  });
  await invalidate(redis, `gc:fotos:${mes}`);
  res.status(201).json(photo);
});

router.put('/gc/fotos/:mes/:id', requireAdmin, gcUpload.single('foto'), async (req, res) => {
  if (!req.body.cuenca?.trim()) return res.status(400).json({ error: 'Se requiere el nombre de la cuenca' });
  if (!req.body.tituloEs?.trim()) return res.status(400).json({ error: 'Se requiere un título' });
  if (!SUBREGIONES_VALIDAS.includes(req.body.subregion)) return res.status(400).json({ error: 'Subregión no reconocida' });

  const update = {
    credito:      req.body.credito       || '',
    municipio:    req.body.municipio     || '',
    subregion:    req.body.subregion,
    cuenca:       req.body.cuenca,
    tituloEs:     req.body.tituloEs,
    tituloEn:     req.body.tituloEn      || '',
    descripcionEs:req.body.descripcionEs || '',
    descripcionEn:req.body.descripcionEn || '',
    publicado:    false,
  };
  if (req.file) {
    const old = await GcPhoto.findById(req.params.id);
    if (old) borrarSiExiste('comunidad/guarda_cuencas', old.foto);
    update.foto = await saveGcFile(req.file.buffer, req.params.mes);
  }
  const photo = await GcPhoto.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  await invalidate(redis, `gc:fotos:${req.params.mes}`);
  res.json(photo);
});

router.delete('/gc/fotos/:id', requireAdmin, async (req, res) => {
  const photo = await GcPhoto.findByIdAndDelete(req.params.id);
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  borrarSiExiste('comunidad/guarda_cuencas', photo.foto);
  await invalidate(redis, 'gc:fotos:*');
  res.json({ ok: true });
});

router.post('/gc/publicar/:mes', requireAdmin, async (req, res) => {
  const resultado = await publicacion.publicarGc(req.params.mes);
  if (!resultado) return res.status(400).json({ error: 'Sin fotos para publicar' });
  res.json({ ok: true, count: resultado.count });
});

module.exports = router;
