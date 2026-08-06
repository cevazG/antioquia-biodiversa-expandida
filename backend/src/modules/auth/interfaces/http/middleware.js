'use strict';
// Middleware de autenticación/autorización — protege TODAS las rutas admin
// (JPL, GC, Usuarios), no solo las de este módulo. Vive acá porque el
// módulo auth es quien sabe qué significa "estar autenticado" y "tener tal
// rol"; reemplaza a middleware/adminAuth.js.
const repositorio = require('../../infrastructure/MongooseUsuarioRepositorio');
const { ROL_SUPERADMIN } = require('../../../../config/catalogo');

// Devuelve el usuario de la sesión activa (activo:true) o null. Compartido
// entre requireAuth (corta con 401 si es null) y GET /me (responde 200 con
// isAdmin:false si es null — no es un endpoint protegido, es la forma en
// que el frontend pregunta "¿sigo logueado?").
async function usuarioDeSesion(req) {
  if (!req.session?.usuarioId) return null;
  const usuario = await repositorio.buscarPorId(req.session.usuarioId);
  return usuario && usuario.activo ? usuario : null;
}

// Consulta Mongo en cada request (por _id, indexado) en vez de confiar en
// un booleano cacheado en la sesión — así, si un Admin.Contenido desactiva
// a alguien, el efecto es inmediato en la siguiente petición de esa
// persona, no recién en su próximo login.
async function requireAuth(req, res, next) {
  const usuario = await usuarioDeSesion(req);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });
  req.usuario = usuario;
  next();
}

// Admin.Contenido es superrole: pasa cualquier chequeo de rol sin
// necesidad de tener además los otros roles asignados.
function requireRole(...rolesPermitidos) {
  return [requireAuth, (req, res, next) => {
    const roles = req.usuario.roles || [];
    if (roles.includes(ROL_SUPERADMIN) || roles.some(r => rolesPermitidos.includes(r))) {
      return next();
    }
    res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
  }];
}

module.exports = { requireAuth, requireRole, usuarioDeSesion };
