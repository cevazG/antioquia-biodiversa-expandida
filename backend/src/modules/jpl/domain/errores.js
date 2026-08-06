'use strict';
// Errores de dominio del módulo JPL — independientes de HTTP; la capa de
// interfaces (jplRouter.js) los traduce a códigos de estado.

class ErrorValidacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorValidacion';
  }
}

class ErrorNoEncontrado extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorNoEncontrado';
  }
}

class ErrorSinContenido extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorSinContenido';
  }
}

module.exports = { ErrorValidacion, ErrorNoEncontrado, ErrorSinContenido };
