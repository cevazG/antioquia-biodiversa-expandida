'use strict';

// Única fuente de verdad para los valores válidos de grupo/subregión/IUCN en
// el backend — deben coincidir con las listas ya usadas en el frontend admin
// (admin/jpl.js, admin/gc.js) y con la tabla de grupos de biodiversidad del
// CLAUDE.md de la raíz del proyecto.
const GRUPOS_VALIDOS = [
  'aves', 'anfibios_reptiles', 'mariposas', 'polillas', 'mamiferos',
  'animales_domesticos', 'peces', 'orquideas', 'arboles_nativos',
];

const SUBREGIONES_VALIDAS = [
  'valle_aburra', 'oriente', 'norte', 'occidente', 'suroeste',
  'nordeste', 'bajo_cauca', 'magdalena_medio', 'uraba',
];

const IUCN_VALIDOS = ['LC', 'NT', 'VU', 'EN', 'CR', 'DD', 'NE'];

// Roles del panel admin — mismos nombres ya comprometidos con TI Gobernación
// para el mapeo futuro a Microsoft Entra ID (Ajuste 1/B1): cuando llegue esa
// migración, cambia cómo se autentica un usuario, no qué roles existen.
// Admin.Contenido es superrole — pasa cualquier chequeo de rol.
const ROLES_VALIDOS = ['Curador.Biodiversidad', 'Curador.GuardaCuencas', 'Admin.Contenido'];
const ROL_SUPERADMIN = 'Admin.Contenido';

module.exports = { GRUPOS_VALIDOS, SUBREGIONES_VALIDAS, IUCN_VALIDOS, ROLES_VALIDOS, ROL_SUPERADMIN };
