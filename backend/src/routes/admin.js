const express  = require('express');
const multer   = require('multer');
const sharp    = require('sharp');
const path     = require('path');
const fs       = require('fs');
const router   = express.Router();

const { requireAdmin } = require('../middleware/adminAuth');
const JplPhoto = require('../models/JplPhoto');
const GcPhoto  = require('../models/GcPhoto');

const FRONTEND = path.join(__dirname, '../../../');  // backend/src/routes → Antioquia Biodiversa/

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

// Convierte un nombre científico en slug de carpeta: "Amazilia tzacatl" → "amazilia_tzacatl"
function especieSlug(nombre) {
  if (!nombre || !nombre.trim()) return null;
  return nombre.trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
}

// Guarda el buffer de una foto JPL como WebP optimizado y devuelve la ruta relativa.
// Estructura: img/fotos/bio/{mes}/{grupo}/{especie_slug}/{especie_slug}_001.webp
async function saveJplFile(buffer, originalname, mes, grupo, especieCientifico) {
  const slug   = especieSlug(especieCientifico) || 'sin_nombre';
  const subdir = path.join(mes, grupo, slug);
  const dir    = path.join(FRONTEND, 'comunidad/jovenes_pa_lante/img/fotos/bio', subdir);
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).filter(f => /\.(jpe?g|webp|png)$/i.test(f)).length;
  const filename = `${slug}_${String(existing + 1).padStart(3, '0')}.webp`;
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, filename));
  return `img/fotos/bio/${subdir.replace(/\\/g, '/')}/${filename}`;
}

// Guarda el buffer de una foto GC como WebP 1200×675 (16:9 recortado) y devuelve la ruta relativa.
async function saveGcFile(buffer, mes) {
  const dir = path.join(FRONTEND, 'comunidad/guarda_cuencas/img/fotos', `gc_${mes}`);
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).filter(f => /\.(jpe?g|webp|png)$/i.test(f)).length;
  const filename = `gc_${String(existing + 1).padStart(3, '0')}.webp`;
  await sharp(buffer)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(path.join(dir, filename));
  return `img/fotos/gc_${mes}/${filename}`;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
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
const IUCN_MAP = {
  'least concern': 'LC', 'near threatened': 'NT', 'vulnerable': 'VU',
  'endangered': 'EN', 'critically endangered': 'CR', 'data deficient': 'DD',
  'extinct in the wild': 'EW', 'extinct': 'EX', 'not evaluated': 'NE',
};

router.post('/autofill', requireAdmin, async (req, res) => {
  const { scientificName } = req.body;
  if (!scientificName?.trim()) return res.status(400).json({ error: 'Se requiere nombre científico' });

  // Quitar sufijos de indeterminación para la búsqueda
  const query = scientificName.replace(/\s+(sp\.|cf\.|aff\.|ssp\.|subsp\.).*/i, '').trim();

  try {
    // 1) Buscar taxón con locale=en para obtener nombre en inglés
    const searchRes = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=1&locale=en`,
      { signal: AbortSignal.timeout(8000) }
    );
    const searchData = await searchRes.json();
    const taxon = searchData.results?.[0];
    if (!taxon) return res.json({ ok: true, data: null, msg: 'No encontrado en iNaturalist' });

    const nameEn = taxon.preferred_common_name || '';

    // 2) Estado IUCN
    const statusRaw = taxon.conservation_status?.status_name?.toLowerCase() || '';
    const iucn = IUCN_MAP[statusRaw]
              || taxon.conservation_status?.status?.toUpperCase()
              || 'DD';

    // 3) Detalle en ES y EN en paralelo → nombres y Wikipedia en ambos idiomas
    const [detailEsData, detailEnData] = await Promise.all([
      fetch(`https://api.inaturalist.org/v1/taxa/${taxon.id}?locale=es`, { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
      fetch(`https://api.inaturalist.org/v1/taxa/${taxon.id}?locale=en`, { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
    ]);

    const taxonEs = detailEsData.results?.[0] || {};
    const taxonEn = detailEnData.results?.[0] || {};

    const nameEs = taxonEs.preferred_common_name || '';

    function cleanWiki(raw) {
      if (!raw) return '';
      const clean = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const cut = clean.length > 350 ? clean.lastIndexOf('.', 350) : clean.length;
      return clean.slice(0, cut > 0 ? cut + 1 : 350).trim();
    }

    const descripcionEs = cleanWiki(taxonEs.wikipedia_summary);
    const descripcionEn = cleanWiki(taxonEn.wikipedia_summary);

    res.json({
      ok: true,
      data: { nameEs, nameEn, iucn, descripcionEs, descripcionEn, inatUrl: `https://www.inaturalist.org/taxa/${taxon.id}` },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error consultando iNaturalist', detail: err.message });
  }
});

// ─── JPL ──────────────────────────────────────────────────────────────────
router.get('/jpl/meses', requireAdmin, async (req, res) => {
  const meses = await JplPhoto.distinct('mes');
  meses.sort((a, b) => b.localeCompare(a));
  res.json(meses);
});

router.get('/jpl/fotos/:mes', requireAdmin, async (req, res) => {
  const fotos = await JplPhoto.find({ mes: req.params.mes }).sort('orden createdAt');
  res.json(fotos);
});

router.get('/jpl/stats/analytics', requireAdmin, async (req, res) => {
  const all = await JplPhoto.find({}).lean();

  const allCreditSet = new Set(all.map(f => f.credito?.trim()).filter(Boolean));
  const allSubregSet = new Set(all.map(f => f.subregion).filter(Boolean));

  // Fotógrafos únicos por subregión
  const fMap = {};
  all.forEach(f => {
    const s = f.subregion || '';
    if (!fMap[s]) fMap[s] = new Set();
    if (f.credito?.trim()) fMap[s].add(f.credito.trim());
  });
  const fotografos = Object.entries(fMap)
    .filter(([s]) => s)
    .map(([subregion, set]) => ({ subregion, count: set.size, nombres: [...set].sort() }))
    .sort((a, b) => b.count - a.count);

  // Cobertura municipal
  const mMap = {};
  all.forEach(f => {
    const key = f.municipio?.trim();
    if (!key) return;
    if (!mMap[key]) mMap[key] = { municipio: key, subregion: f.subregion || '', fotos: 0, esps: new Set(), amenazadas: 0 };
    mMap[key].fotos++;
    if (f.especieCientifico?.trim()) mMap[key].esps.add(f.especieCientifico.trim());
    if (['CR','EN','VU'].includes(f.iucn)) mMap[key].amenazadas++;
  });
  const municipios = Object.values(mMap)
    .map(m => ({ municipio: m.municipio, subregion: m.subregion, fotos: m.fotos, especies: m.esps.size, amenazadas: m.amenazadas }))
    .sort((a, b) => b.fotos - a.fotos);

  // Alertas CR / EN
  const alertas = all
    .filter(f => ['CR','EN'].includes(f.iucn))
    .map(f => ({
      sci: f.especieCientifico, es: f.especieEs, iucn: f.iucn,
      municipio: f.municipio,   subregion: f.subregion,
      credito: f.credito,       endemica: f.endemica,
      foto: f.fotos?.[0] || '', mes: f.mes,
    }));

  // Bioindicadores hídricos
  const bioindicadores = all
    .filter(f => ['anfibios_reptiles','peces'].includes(f.grupo))
    .map(f => ({
      sci: f.especieCientifico, es: f.especieEs, grupo: f.grupo, iucn: f.iucn,
      municipio: f.municipio,   subregion: f.subregion,
      credito: f.credito,       endemica: f.endemica,
      foto: f.fotos?.[0] || '', mes: f.mes,
    }));

  res.json({
    totalFotografos:      allCreditSet.size,
    municipiosCubiertos:  Object.keys(mMap).length,
    subregionesCubiertas: allSubregSet.size,
    fotografos,
    municipios,
    alertas,
    bioindicadores,
  });
});

router.get('/jpl/stats/monthly', requireAdmin, async (req, res) => {
  const MESES_ES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const rows = await JplPhoto.aggregate([
    {
      $group: {
        _id:            '$mes',
        fotos:          { $sum: 1 },
        especiesSet:    { $addToSet: '$especieCientifico' },
        subregionesSet: { $addToSet: '$subregion' },
        amenazadas:     { $sum: { $cond: [{ $in: ['$iucn', ['CR','EN','VU']] }, 1, 0] } },
        endemicas:      { $sum: { $cond: ['$endemica', 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0, mes: '$_id', fotos: 1, amenazadas: 1, endemicas: 1,
        especiesUnicas: { $size: '$especiesSet' },
        subregiones:    { $size: '$subregionesSet' },
      },
    },
    { $sort: { mes: 1 } },
  ]);
  res.json(rows.map(r => {
    const [y, m] = r.mes.split('-');
    return { ...r, label: `${MESES_ES[+m]} ${y}` };
  }));
});

router.post('/jpl/fotos/:mes', requireAdmin, jplFields, async (req, res) => {
  const mes = req.params.mes;
  const newFiles = req.files?.fotosNuevas || [];
  if (!newFiles.length) return res.status(400).json({ error: 'Se requiere al menos una foto' });

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
  res.status(201).json(photo);
});

router.put('/jpl/fotos/:mes/:id', requireAdmin, jplFields, async (req, res) => {
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
    removed.forEach(p => {
      const abs = path.join(FRONTEND, 'comunidad/jovenes_pa_lante', p);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    });
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
  res.json(photo);
});

router.delete('/jpl/fotos/:id', requireAdmin, async (req, res) => {
  const photo = await JplPhoto.findByIdAndDelete(req.params.id);
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  (photo.fotos || []).forEach(p => {
    const abs = path.join(FRONTEND, 'comunidad/jovenes_pa_lante', p);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  });
  res.json({ ok: true });
});

router.post('/jpl/publicar/:mes', requireAdmin, async (req, res) => {
  const mes = req.params.mes;                       // 'YYYY-MM'
  const [año, numMes] = mes.split('-').map(Number);
  const MESES_ES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const MESES_EN = ['', 'January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

  const fotos = await JplPhoto.find({ mes }).sort('orden createdAt').lean();
  if (!fotos.length) return res.status(400).json({ error: 'Sin fotos para publicar' });

  const payload = {
    mes:    MESES_ES[numMes],
    mesEn:  MESES_EN[numMes],
    año,
    fotos: fotos.map((f, i) => ({
      id:                `jpl_${mes}_${String(i + 1).padStart(3, '0')}`,
      fotos:             f.fotos || [],
      credito:           f.credito,
      municipio:         f.municipio,
      subregion:         f.subregion,
      especieEs:         f.especieEs,
      especieEn:         f.especieEn,
      especieCientifico: f.especieCientifico,
      grupo:             f.grupo,
      iucn:              f.iucn,
      endemica:          f.endemica,
      descripcionEs:     f.descripcionEs,
      descripcionEn:     f.descripcionEn,
    })),
  };

  // Escribir JSON del mes
  const dataDir = path.join(FRONTEND, 'comunidad/jovenes_pa_lante/data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, `fotos_${mes.replace('-', '_')}.json`),
    JSON.stringify(payload, null, 2)
  );

  // Actualizar índice
  const indexPath = path.join(dataDir, 'fotos_biodiversidad.json');
  const portada   = fotos[0].fotos?.[0] || '';
  let index = { meses: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  const existing = index.meses.findIndex(m => m.id === mes);
  const entry = {
    id:      mes,
    mes:     MESES_ES[numMes],
    mesEn:   MESES_EN[numMes],
    año,
    count:   fotos.length,
    portada,
    archivo: `data/fotos_${mes.replace('-', '_')}.json`,
  };
  if (existing >= 0) index.meses[existing] = entry;
  else index.meses.unshift(entry);
  index.meses.sort((a, b) => b.id.localeCompare(a.id));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  await JplPhoto.updateMany({ mes }, { publicado: true });
  res.json({ ok: true, count: fotos.length });
});

// ─── GUARDA CUENCAS ────────────────────────────────────────────────────────
router.get('/gc/meses', requireAdmin, async (req, res) => {
  const meses = await GcPhoto.distinct('mes');
  meses.sort((a, b) => b.localeCompare(a));
  res.json(meses);
});

router.get('/gc/fotos/:mes', requireAdmin, async (req, res) => {
  const fotos = await GcPhoto.find({ mes: req.params.mes }).sort('orden createdAt');
  res.json(fotos);
});

router.post('/gc/fotos/:mes', requireAdmin, gcUpload.single('foto'), async (req, res) => {
  const mes = req.params.mes;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto' });
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
  res.status(201).json(photo);
});

router.put('/gc/fotos/:mes/:id', requireAdmin, gcUpload.single('foto'), async (req, res) => {
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
    if (old) {
      const abs = path.join(FRONTEND, 'comunidad/guarda_cuencas', old.foto);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    }
    update.foto = await saveGcFile(req.file.buffer, req.params.mes);
  }
  const photo = await GcPhoto.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  res.json(photo);
});

router.delete('/gc/fotos/:id', requireAdmin, async (req, res) => {
  const photo = await GcPhoto.findByIdAndDelete(req.params.id);
  if (!photo) return res.status(404).json({ error: 'No encontrada' });
  const abs = path.join(FRONTEND, 'comunidad/guarda_cuencas', photo.foto);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
  res.json({ ok: true });
});

router.post('/gc/publicar/:mes', requireAdmin, async (req, res) => {
  const mes = req.params.mes;
  const [año, numMes] = mes.split('-').map(Number);
  const MESES_ES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const MESES_EN = ['', 'January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

  const fotos = await GcPhoto.find({ mes }).sort('orden createdAt').lean();
  if (!fotos.length) return res.status(400).json({ error: 'Sin fotos para publicar' });

  const payload = {
    mes:   MESES_ES[numMes],
    mesEn: MESES_EN[numMes],
    año,
    fotos: fotos.map((f, i) => ({
      id:           `gc_${mes}_${String(i + 1).padStart(3, '0')}`,
      foto:         f.foto,
      credito:      f.credito,
      municipio:    f.municipio,
      subregion:    f.subregion,
      cuenca:       f.cuenca,
      tituloEs:     f.tituloEs,
      tituloEn:     f.tituloEn,
      descripcionEs:f.descripcionEs,
      descripcionEn:f.descripcionEn,
    })),
  };

  const dataDir = path.join(FRONTEND, 'comunidad/guarda_cuencas/data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, `cuencas_${mes.replace('-', '_')}.json`),
    JSON.stringify(payload, null, 2)
  );

  const indexPath = path.join(dataDir, 'fotos_cuencas.json');
  const portada   = fotos[0].foto;
  let index = { meses: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  const existing = index.meses.findIndex(m => m.id === mes);
  const entry = {
    id:      mes,
    mes:     MESES_ES[numMes],
    mesEn:   MESES_EN[numMes],
    año,
    count:   fotos.length,
    portada,
    archivo: `data/cuencas_${mes.replace('-', '_')}.json`,
  };
  if (existing >= 0) index.meses[existing] = entry;
  else index.meses.unshift(entry);
  index.meses.sort((a, b) => b.id.localeCompare(a.id));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  await GcPhoto.updateMany({ mes }, { publicado: true });
  res.json({ ok: true, count: fotos.length });
});

module.exports = router;
