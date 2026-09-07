const express  = require('express');
const router   = express.Router();

const { requireAuth, requireRole } = require('../modules/auth/interfaces/http/middleware');
const inaturalist = require('../services/inaturalistLookup');
const { limiterAutofill } = require('../utils/rateLimit');

// ─── Auth ──────────────────────────────────────────────────────────────────
// /login, /logout, /me — módulo completo de usuarios individuales (puente
// temporal a Microsoft Entra ID, ver backend/src/modules/auth/). Ninguna
// de las tres rutas lleva guardia acá: la llevan (o no) internamente,
// mismo comportamiento que el mecanismo anterior.
router.use(require('../modules/auth/interfaces/http/authRouter'));

// ─── Autofill iNaturalist ─────────────────────────────────────────────────
// Compartido entre JPL y Guarda Cuencas — no es específico de ningún módulo,
// se queda acá en vez de moverse a modules/jpl/ o modules/gc/.
router.post('/autofill', limiterAutofill, requireAuth, async (req, res) => {
  const { scientificName } = req.body;
  if (!scientificName?.trim()) return res.status(400).json({ error: 'Se requiere nombre científico' });

  try {
    const resultado = await inaturalist.buscarEspecie(scientificName);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    // nosemgrep: error-detail-in-response -- ruta detrás de requireAuth; el detalle ayuda a diagnosticar fallas de la API pública de iNaturalist, no expone datos internos del servidor
    res.status(500).json({ error: 'Error consultando iNaturalist', detail: err.message });
  }
});

// ─── JPL, Guarda Cuencas y Usuarios ─────────────────────────────────────
// Los tres migrados a arquitectura hexagonal — ver backend/src/modules/.
// requireRole se aplica una sola vez acá, al montar cada sub-router.
// Admin.Contenido es superrole: pasa cualquiera de los tres chequeos.
router.use('/jpl', requireRole('Curador.Biodiversidad'), require('../modules/jpl/interfaces/http/jplRouter'));
router.use('/gc',  requireRole('Curador.GuardaCuencas'), require('../modules/gc/interfaces/http/gcRouter'));
router.use('/usuarios', requireRole('Admin.Contenido'), require('../modules/auth/interfaces/http/usuariosRouter'));

module.exports = router;
