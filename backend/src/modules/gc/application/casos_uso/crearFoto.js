'use strict';
// Caso de uso: dar de alta una foto de cuenca. A diferencia de JPL (hasta 3
// archivos por especie), Guarda Cuencas recibe un único archivo obligatorio.
const FotoCuenca = require('../../domain/FotoCuenca');
const { ErrorValidacion } = require('../../domain/errores');

function crearCrearFoto({ repositorio, almacenamiento, cache }) {
  return async function crearFoto({ mes, archivo, ...crudos }) {
    // El chequeo de archivo va primero, igual que en la ruta original.
    if (!archivo) throw new ErrorValidacion('No se recibió ninguna foto');

    const datos = FotoCuenca.crearDatosFoto(crudos);

    const rel = await almacenamiento.guardar(archivo.buffer, mes);

    const orden = await repositorio.contarPorMes(mes);
    const creada = await repositorio.crear({ mes, orden, foto: rel, ...datos });

    if (cache) await cache.invalidar(`gc:fotos:${mes}`);
    return creada;
  };
}

module.exports = { crearCrearFoto };
