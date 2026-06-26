'use strict';
const mongoose = require('mongoose');

const connCom = mongoose.createConnection(process.env.MONGODB_URI_COM);

async function connectDB() {
  await connCom.asPromise();
  console.log('BD Comunidad:', connCom.host);
}

module.exports = { connectDB, connCom };
