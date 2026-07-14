'use strict';
const express = require('express');
const session = require('express-session');

function makeApp(router, mountPath = '/') {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // nosemgrep: express-session-hardcoded-secret,javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure,javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain,javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires,javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly,javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path,javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name -- secreto y config ficticios solo para tests, nunca corren en producción; no hay respuesta HTTP real que proteger
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(mountPath, router);
  return app;
}

module.exports = { makeApp };
