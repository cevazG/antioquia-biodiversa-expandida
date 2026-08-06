'use strict';
// Adaptador de persistencia — implementa el puerto FotoRepositorio usando
// el modelo Mongoose existente (models/JplPhoto.js, sin modificar). Es la
// única pieza del módulo que sabe que la base de datos es MongoDB.
const JplPhoto = require('../../../models/JplPhoto');

async function listarMesesDistintos() {
  const meses = await JplPhoto.distinct('mes');
  meses.sort((a, b) => b.localeCompare(a));
  return meses;
}

function contarPorMes(mes) {
  return JplPhoto.countDocuments({ mes });
}

function buscarPorMes(mes) {
  return JplPhoto.find({ mes }).sort('orden createdAt').lean();
}

function buscarPorId(id) {
  return JplPhoto.findById(id);
}

function crear(datos) {
  return JplPhoto.create(datos);
}

function actualizar(id, datos) {
  return JplPhoto.findByIdAndUpdate(id, datos, { new: true });
}

function eliminarPorId(id) {
  return JplPhoto.findByIdAndDelete(id);
}

function marcarPublicadas(mes) {
  return JplPhoto.updateMany({ mes }, { publicado: true });
}

module.exports = {
  listarMesesDistintos, contarPorMes, buscarPorMes, buscarPorId,
  crear, actualizar, eliminarPorId, marcarPublicadas,
};
