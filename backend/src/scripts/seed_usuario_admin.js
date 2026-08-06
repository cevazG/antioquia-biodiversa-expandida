/**
 * seed_usuario_admin.js
 * Crea (o actualiza clave/roles de) un usuario del panel admin directamente
 * en la BD. Bootstrap: mientras no exista ningún usuario, nadie puede
 * entrar al panel para crear el primero desde la pantalla de Usuarios.
 * Mismo patrón que comunidad/Ampliacion Jovenes/backend/src/scripts/seed_coordinador.js.
 *
 * Uso:
 *   node src/scripts/seed_usuario_admin.js "Nombre Apellido" usuario clave12345 Admin.Contenido
 *
 * Roles válidos (separados por coma si son varios): Curador.Biodiversidad,
 * Curador.GuardaCuencas, Admin.Contenido. Volver a ejecutar con el mismo
 * `usuario` actualiza nombre/clave/roles del usuario existente.
 */
require('dotenv').config();
const { connectDB } = require('../db');
const Usuario = require('../models/Usuario');
const { ROLES_VALIDOS } = require('../config/catalogo');
const domainUsuario = require('../modules/auth/domain/Usuario');
const hasher = require('../modules/auth/infrastructure/BcryptHasher');

async function main() {
  const [nombre, usuarioArg, password, rolesArg] = process.argv.slice(2);

  if (!nombre || !usuarioArg || !password) {
    console.error('Uso: node src/scripts/seed_usuario_admin.js "Nombre" usuario password roles(coma)');
    console.error(`Roles válidos: ${ROLES_VALIDOS.join(', ')}`);
    process.exit(1);
  }

  const roles = (rolesArg || 'Admin.Contenido').split(',').map(r => r.trim()).filter(Boolean);

  let datos;
  try {
    datos = domainUsuario.crearDatosUsuario({ nombre, usuario: usuarioArg, roles });
    domainUsuario.validarPassword(password);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  await connectDB();
  const passwordHash = hasher.hashear(password);

  const existente = await Usuario.findOne({ usuario: datos.usuario });
  if (existente) {
    existente.nombre = datos.nombre;
    existente.passwordHash = passwordHash;
    existente.roles = datos.roles;
    existente.activo = true;
    await existente.save();
    console.log(`✓ Usuario actualizado: ${datos.usuario} — roles: ${datos.roles.join(', ')}`);
  } else {
    await Usuario.create({ ...datos, passwordHash });
    console.log(`✓ Usuario creado: ${datos.usuario} — roles: ${datos.roles.join(', ')}`);
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
