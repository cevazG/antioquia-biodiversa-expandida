'use strict';
// Errores de dominio del módulo de usuarios/auth — independientes de HTTP;
// la capa de interfaces (authRouter.js, usuariosRouter.js) los traduce a
// códigos de estado.

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

// Deliberadamente el mismo mensaje que "usuario inexistente" en el caso de
// uso de login — no hay que filtrar cuáles usuarios existen.
class ErrorCredencialInvalida extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorCredencialInvalida';
  }
}

class ErrorUsuarioInactivo extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorUsuarioInactivo';
  }
}

class ErrorUsuarioDuplicado extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorUsuarioDuplicado';
  }
}

module.exports = {
  ErrorValidacion, ErrorNoEncontrado, ErrorCredencialInvalida,
  ErrorUsuarioInactivo, ErrorUsuarioDuplicado,
};
