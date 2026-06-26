# Antioquia Biodiversa

Aplicación web mobile-first para la Gobernación de Antioquia que permite consultar la biodiversidad del departamento (flora y fauna por subregión y grupo taxonómico), los recursos hídricos y los programas comunitarios Jóvenes pa' Lante y Guarda Cuencas, en español e inglés, accesible vía código QR desde cualquier dispositivo móvil.

**Administrador:** Secretaría de Ambiente — Gobernación de Antioquia  
**Contratista:** Sebastián Guzmán Díaz · sguzmand@gmail.com · 3006552511

---

## Prerrequisitos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 22 LTS | `node --version` |
| npm | 10+ | `npm --version` |
| MongoDB Atlas | 7.x | — |
| Redis | 7.x | `redis-cli ping` |
| Git | cualquiera | `git --version` |

---

## Instalación local (desarrollo)

```bash
# 1. Clonar el repositorio
git clone https://dev.azure.com/GobernacionAntioquia/antioquia-biodiversa

# 2. Entrar a la carpeta del backend
cd antioquia-biodiversa/backend

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de entorno)

# 5. Iniciar Redis localmente (macOS)
brew services start redis
# Ubuntu/Debian
sudo systemctl start redis

# 6. Iniciar el servidor en modo desarrollo
npm run dev
```

La aplicación queda disponible en:
- App: `http://localhost:3000/biodiversidad/index.html`
- API: `http://localhost:3000/api`
- Documentación API: `http://localhost:3000/api/docs`
- Panel admin: `http://localhost:3000/admin/`
- Health check: `http://localhost:3000/api/health`

---

## Variables de entorno

Copiar `backend/.env.example` como `backend/.env` y completar:

| Variable | Descripción | Requerida |
|---|---|---|
| `MONGODB_URI_COM` | URI BD Comunidad (JPL, Guarda Cuencas) | ✅ |
| `SESSION_SECRET` | Secreto sesiones panel admin (mín. 32 chars) | ✅ |
| `ADMIN_PASSWORD` | Contraseña temporal panel curadores | ✅ |
| `REDIS_URL` | URL Redis (`redis://localhost:6379`) | Opcional* |
| `LOG_LEVEL` | Nivel de log: `error`, `warn`, `info`, `debug` | Opcional |
| `LOG_DIR` | Carpeta de archivos de log | Opcional |
| `PORT` | Puerto del servidor (por defecto 3000) | Opcional |

> \* Sin Redis la app funciona en modo degradado — las consultas van directo a MongoDB.  
> **IMPORTANTE:** Nunca subir el archivo `.env` al repositorio. Está incluido en `.gitignore`.

---

## Comandos disponibles

```bash
# Desarrollo
npm run dev                   # Servidor con recarga automática (nodemon)
npm start                     # Servidor en modo producción

# Calidad de código
npm run lint                  # ESLint — todo el código fuente
npm run lint:fix              # Corregir errores de lint automáticamente
npm run lint:security         # ESLint-security — solo código de API (0 errores requeridos)
npm audit --audit-level=high  # Auditoría de dependencias (CVE Alta o Crítica)

# Tests
npm test                      # Pruebas unitarias con Jest
npm run test:coverage         # Tests + informe de cobertura (umbral: 90%)

# Imágenes y datos
npm run optimize-photos       # Convertir fotos JPG/PNG a WebP en batch
npm run optimize-photos-dry   # Simular optimización sin escribir archivos
npm run generate-evaluacion   # Generar plantilla Excel de evaluación de especies
npm run export-evaluacion     # Exportar LISTADO diligenciado a CSV (BOM UTF-8)
```

---

## Estructura del proyecto

```
antioquia-biodiversa/
├── backend/                         # API REST (Node.js + Express + MongoDB + Redis)
│   ├── src/
│   │   ├── index.js                 # Express, rutas, sesiones, /api/health
│   │   ├── db.js                    # Conexión MongoDB + Redis
│   │   ├── swagger.yaml             # Spec OpenAPI 3.0.3
│   │   ├── middleware/
│   │   │   ├── adminAuth.js         # Guard de autenticación para rutas admin
│   │   │   └── requestLogger.js     # Log por petición: método, path, status, ms, traceId
│   │   ├── models/                  # Modelos Mongoose (JplPhoto, GcPhoto)
│   │   ├── routes/
│   │   │   └── admin.js             # CRUD galería JPL y Guarda Cuencas
│   │   ├── utils/
│   │   │   ├── logger.js            # Winston: JSON estructurado, traceId, archivos en logs/
│   │   │   └── cache.js             # getCached() e invalidate() con TTLs de la propuesta
│   │   └── scripts/                 # Utilidades: optimización fotos, importación Excel
│   ├── .env.example                 # Plantilla de variables de entorno
│   ├── .eslintrc.json               # ESLint + eslint-plugin-security
│   └── package.json
├── admin/                           # Panel de administración web (curadores)
├── biodiversidad/                   # Módulo de biodiversidad (frontend)
├── agua/                            # Módulo de recursos hídricos (frontend)
├── comunidad/                       # Módulo comunidad (JPL, Guarda Cuencas, Especie del Mes)
├── data/                            # Traducciones globales ES/EN
├── .semgrep.yml                     # Reglas SAST locales
├── azure-pipelines.yml              # Pipeline CI/CD Azure DevOps
└── netlify.toml                     # Configuración Netlify (frontend estático)
```

---

## Despliegue en producción (Ubuntu Server 24.04 LTS)

### 1. Preparar el servidor

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PM2, Nginx, Certbot
sudo npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx

# Redis 7
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

### 2. Configurar Redis

Editar `/etc/redis/redis.conf`:

```
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

```bash
sudo systemctl restart redis-server
redis-cli ping   # debe responder: PONG
```

### 3. Clonar y configurar la aplicación

```bash
git clone https://dev.azure.com/GobernacionAntioquia/antioquia-biodiversa /var/www/antioquia-biodiversa
cd /var/www/antioquia-biodiversa/backend
npm install --omit=dev

cp .env.example .env
nano .env
# Completar: MONGODB_URI_COM, SESSION_SECRET, ADMIN_PASSWORD, REDIS_URL, LOG_LEVEL
```

### 4. Iniciar con PM2

```bash
cd /var/www/antioquia-biodiversa/backend
pm2 start src/index.js --name antioquia-biodiversa
pm2 save
pm2 startup   # Copiar y ejecutar el comando que muestre
```

### 5. Configurar Nginx

Crear `/etc/nginx/sites-available/antioquia-biodiversa`:

```nginx
server {
    listen 80;
    server_name biodiversa.antioquia.gov.co;

    # Health check para upstream
    location /api/health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/antioquia-biodiversa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL con Let's Encrypt
sudo certbot --nginx -d biodiversa.antioquia.gov.co
```

### 6. Verificar despliegue

```bash
pm2 status
pm2 logs antioquia-biodiversa --lines 50
curl https://biodiversa.antioquia.gov.co/api/health
# Respuesta esperada: {"status":"ok","mongodb":"connected","redis":"connected","uptime":...}
```

---

## API REST

Base URL: `https://biodiversa.antioquia.gov.co/api`

Documentación interactiva Swagger: `/api/docs`

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/health` | Estado: MongoDB, Redis, uptime | — |
| GET | `/admin/jpl/meses` | Meses con fotos JPL | Admin |
| GET | `/admin/jpl/fotos/:mes` | Fotos JPL de un mes | Admin |
| GET | `/admin/jpl/stats/analytics` | Estadísticas de cobertura | Admin |
| GET | `/admin/jpl/stats/monthly` | Datos mensuales para gráficos | Admin |
| GET | `/admin/gc/meses` | Meses con fotos Guarda Cuencas | Admin |
| GET | `/admin/gc/fotos/:mes` | Fotos GC de un mes | Admin |
| POST | `/admin/login` | Iniciar sesión en panel admin | — |
| POST | `/admin/logout` | Cerrar sesión | Admin |
| POST | `/admin/autofill` | Autocompletar desde iNaturalist | Admin |

> La autenticación admin migrará a Microsoft Entra ID (OAuth 2.0 + OIDC) una vez TI Gobernación provea Client ID y Tenant ID.

---

## Panel de administración de curadores

Acceso: `https://biodiversa.antioquia.gov.co/admin/`

Permite a los curadores:
- Cargar las fotos mensuales de Jóvenes pa' Lante (JPL) y Guarda Cuencas
- Autocompletar datos de especies desde iNaturalist
- Publicar el JSON mensual de cada galería
- Ver estadísticas de cobertura municipal y subregional

Las imágenes se convierten automáticamente a WebP (máx. 1200 px, calidad 82) en el servidor.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | HTML5 + CSS3 + JavaScript Vanilla | — |
| Backend | Node.js + Express | 22 LTS / 4.x |
| Base de datos | MongoDB Atlas + Mongoose ODM | 7.x |
| Caché | Redis + ioredis | 7.x / ^5 |
| Logs | Winston (JSON estructurado + traceId) | ^3 |
| Imágenes | sharp (WebP auto-conversión) | ^0.34 |
| Uploads | multer | ^1.4 |
| Autenticación admin | express-session (temporal → Entra ID) | — |
| Servidor web | Nginx + PM2 | — |
| SAST | ESLint-security + Semgrep | — |
| CI/CD | Azure DevOps (plantillas TI Gobernación) | — |
| Infraestructura | Ubuntu Server 24.04 LTS | 24.04 |

---

## Control de versiones

**GitFlow:**
- `main` — producción estable
- `develop` — integración continua
- `feature/nombre` — nuevas funcionalidades

**Conventional Commits:** `feat:`, `fix:`, `docs:`, `refactor:`

Código y comentarios en **español neutro** según lineamientos de la Gobernación de Antioquia.

---

*Gobernación de Antioquia — Secretaría de Ambiente*  
*Propuesta Técnica v2.0 — Junio 2026*
