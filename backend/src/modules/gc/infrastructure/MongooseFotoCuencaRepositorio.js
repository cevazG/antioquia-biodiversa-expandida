'use strict';
// Adaptador de persistencia — implementa el puerto FotoCuencaRepositorio
// usando el modelo Mongoose existente (models/GcPhoto.js, sin modificar).
const GcPhoto = require('../../../models/GcPhoto');

async function listarMesesDistintos() {
  const meses = await GcPhoto.distinct('mes');
  meses.sort((a, b) => b.localeCompare(a));
  return meses;
}

function contarPorMes(mes) {
  return GcPhoto.countDocuments({ mes });
}

function buscarPorMes(mes) {
  return GcPhoto.find({ mes }).sort('orden createdAt').lean();
}

function buscarPorId(id) {
  return GcPhoto.findById(id);
}

function crear(datos) {
  return GcPhoto.create(datos);
}

function actualizar(id, datos) {
  return GcPhoto.findByIdAndUpdate(id, datos, { new: true });
}

function eliminarPorId(id) {
  return GcPhoto.findByIdAndDelete(id);
}

function marcarPublicadas(mes) {
  return GcPhoto.updateMany({ mes }, { publicado: true });
}

module.exports = {
  listarMesesDistintos, contarPorMes, buscarPorMes, buscarPorId,
  crear, actualizar, eliminarPorId, marcarPublicadas,
};
