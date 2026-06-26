require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const session    = require('express-session');
const path       = require('path');
const fs         = require('fs');
const YAML       = require('js-yaml');
const swaggerUi  = require('swagger-ui-express');
const { connectDB } = require('./db');

const swaggerDoc = YAML.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));

// Validar variables de entorno obligatorias antes de arrancar
const VARS_REQUERIDAS = ['MONGODB_URI_COM', 'SESSION_SECRET', 'ADMIN_PASSWORD'];
const faltantes = VARS_REQUERIDAS.filter(v => !process.env[v]);
if (faltantes.length > 0) {
  console.error(`[ERROR] Variables de entorno no definidas: ${faltantes.join(', ')}`);
  console.error('        Copiar backend/.env.example como backend/.env y completar los valores.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 },  // 8 h
}));

// API routes
app.use('/api/admin',  require('./routes/admin'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/docs',   swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Sirve el frontend estático desde la raíz del proyecto
// extensions: ['html'] permite acceder a /biodiversidad/home sin .html
app.use(express.static(path.join(__dirname, '../../'), { extensions: ['html'] }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}/api`);
    console.log(`App en         http://localhost:${PORT}/biodiversidad/biodiversidad.html`);
    console.log(`Panel admin    http://localhost:${PORT}/admin/`);
  });
});
