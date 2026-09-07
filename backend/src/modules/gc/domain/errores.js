'use strict';
// Errores de dominio del módulo Guarda Cuencas — independientes de HTTP; la
// capa de interfaces (gcRouter.js) los traduce a códigos de estado.
//
// Mismo contenido que modules/jpl/domain/errores.js, duplicado a propósito:
// cada módulo es un contexto acotado (bounded context) autocontenido, sin
// depender de las carpetas internas de otro módulo.

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
