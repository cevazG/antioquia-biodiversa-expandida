'use strict';

/**
 * Crea un proxy que imita un Mongoose Query encadenable y thenable.
 * Cualquier método de cadena (.skip, .limit, .sort, .select, .lean)
 * devuelve el mismo proxy; al hacer await resuelve con `valor`.
 */
function mockQuery(valor) {
  const handler = {
    get(_, prop) {
      if (prop === 'then')  return (ok) => Promise.resolve(valor).then(ok);
      if (prop === 'catch') return (err) => Promise.resolve(valor).catch(err);
      return jest.fn().mockReturnValue(proxy);
    },
  };
  const proxy = new Proxy({}, handler);
  return proxy;
}

module.exports = { mockQuery };
