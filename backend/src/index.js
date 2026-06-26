require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const session       = require('express-session');
const path          = require('path');
const fs            = require('fs');
const YAML          = require('js-yaml');
const swaggerUi     = require('swagger-ui-express');
const logger        = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { connectDB, connCom, redis } = require('./db');

const swaggerDoc = YAML.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));

// Validar variables de entorno obligatorias antes de arrancar
const VARS_REQUERIDAS = ['MONGODB_URI_COM', 'SESSION_SECRET', 'ADMIN_PASSWORD'];
// eslint-disable-next-line security/detect-object-injection -- v proviene de array literal hardcoded, no de input externo
const faltantes = VARS_REQUERIDAS.filter(v => !process.env[v]);
if (faltantes.length > 0) {
  logger.error('Variables de entorno no definidas', { faltantes });
  logger.error('Copiar backend/.env.example como backend/.env y completar los valores.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 },  // 8 h
}));

// API routes
app.use('/api/admin',  require('./routes/admin'));

app.get('/api/health', async (_req, res) => {
  const mongoStatus = connCom.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch (_) { /* Redis opcional */ }
  const status = mongoStatus === 'connected' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    mongodb:   mongoStatus,
    redis:     redisStatus,
    uptime:    Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/docs',   swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Sirve el frontend estático desde la raíz del proyecto
// extensions: ['html'] permite acceder a /biodiversidad/home sin .html
app.use(express.static(path.join(__dirname, '../../'), { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`API corriendo en http://localhost:${PORT}/api`);
    logger.info(`App en         http://localhost:${PORT}/biodiversidad/biodiversidad.html`);
    logger.info(`Panel admin    http://localhost:${PORT}/admin/`);
  });
});
