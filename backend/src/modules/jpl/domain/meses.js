'use strict';
// Nombres de mes ES/EN — duplicado deliberado de la misma tabla en
// services/publicacion.js (usada hoy por Guarda Cuencas, todavía sin migrar
// a su propio módulo). La duplicación se resuelve cuando GC se migre.
const MESES_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

module.exports = { MESES_ES, MESES_EN };
