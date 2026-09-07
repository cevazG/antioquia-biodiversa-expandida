'use strict';
function crearListarMeses({ repositorio }) {
  return function listarMeses() {
    return repositorio.listarMesesDistintos();
  };
}

module.exports = { crearListarMeses };
