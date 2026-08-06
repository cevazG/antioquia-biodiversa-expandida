'use strict';
function crearObtenerEstadisticasMensuales({ estadisticas }) {
  return function obtenerEstadisticasMensuales() {
    return estadisticas.calcularEstadisticasMensuales();
  };
}

module.exports = { crearObtenerEstadisticasMensuales };
