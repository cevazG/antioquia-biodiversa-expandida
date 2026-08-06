'use strict';
function crearObtenerAnalytics({ estadisticas }) {
  return function obtenerAnalytics() {
    return estadisticas.calcularAnalytics();
  };
}

module.exports = { crearObtenerAnalytics };
