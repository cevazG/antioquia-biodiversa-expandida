'use strict';
function crearListarUsuarios({ repositorio }) {
  return function listarUsuarios() {
    return repositorio.listar();
  };
}

module.exports = { crearListarUsuarios };
