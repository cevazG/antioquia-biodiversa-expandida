'use strict';
const express = require('express');
const session = require('express-session');

function makeApp(router, mountPath = '/') {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(mountPath, router);
  return app;
}

module.exports = { makeApp };
