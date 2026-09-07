'use strict';
function crearListarFotosDelMes({ repositorio }) {
  return function listarFotosDelMes(mes) {
    return repositorio.buscarPorMes(mes);
  };
}

module.exports = { crearListarFotosDelMes };
