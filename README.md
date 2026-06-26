# Antioquia Biodiversa

Aplicación web mobile-first para la Gobernación de Antioquia que permite consultar la biodiversidad del departamento (flora y fauna por subregión y grupo taxonómico), los recursos hídricos y los programas comunitarios Jóvenes pa' Lante y Guarda Cuencas, en español e inglés, accesible vía código QR desde cualquier dispositivo móvil.

**Administrador:** Secretaría de Ambiente - Gobernación de Antioquia  
**Contratista:** Sebastián Guzmán Díaz · sguzmand@gmail.com · 3006552511

---

## Prerrequisitos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 22 LTS | `node --version` |
| npm | 10+ | `npm --version` |
| MongoDB | Atlas M0 o local 7.x | — |
| Git | cualquiera | `git --version` |

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://dev.azure.com/GobernacionAntioquia/antioquia-biodiversa-api-nodejs

# 2. Entrar a la carpeta del backend
cd antioquia-biodiversa-api-nodejs/backend

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de entorno)

# 5. Iniciar el servidor en modo desarrollo
npm run dev
```

La aplicación queda disponible en:
- App: `http://localhost:3000/biodiversidad/biodiversidad.html`
- API: `http://localhost:3000/api`
- Panel admin: `http://localhost:3000/admin/`

---

## Variables de entorno

Copiar `.env.example` como `.env` y completar:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MONGODB_URI_BIO` | URI BD Biodiversidad (catálogo 150 especies) | `mongodb+srv://user:pass@cluster.mongodb.net/biodiversidad` |
| `MONGODB_URI_COM` | URI BD Comunidad (JPL ~4.000 registros, GC) | `mongodb+srv://user:pass@cluster.mongodb.net/comunidad` |
| `PORT` | Puerto del servidor | `3000` |
| `SESSION_SECRET` | Secreto para sesiones del panel admin (min. 32 chars) | cadena aleatoria larga |
| `ADMIN_PASSWORD` | Contraseña del panel de curadores | contraseña segura |

> **IMPORTANTE:** Nunca subir el archivo `.env` al repositorio. Está incluido en `.gitignore`.

---

## Comandos disponibles

```bash
npm run dev                   # Servidor en modo desarrollo (nodemon)
npm start                     # Servidor en modo producción
npm run lint                  # Análisis estático del código (ESLint)
npm run lint:fix              # Corregir errores de lint automáticamente
npm run optimize-photos       # Convertir fotos JPG/PNG a WebP (batch)
npm run import-excel          # Importar especies desde plantilla Excel
npm run generate-docs         # Regenerar documentos Word para TI
npm run generate-evaluacion   # Generar plantilla Excel de evaluación de especies (4 hojas)
npm run export-evaluacion     # Exportar LISTADO diligenciado a CSV (BOM UTF-8)
```

---

## Estructura del proyecto

```
antioquia-biodiversa/
├── backend/                    # API REST (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── index.js            # Punto de entrada: Express, rutas, sesiones
│   │   ├── db.js               # Conexión a MongoDB con Mongoose
│   │   ├── middleware/
│   │   │   └── adminAuth.js    # Guard de autenticación para rutas admin
│   │   ├── models/             # Modelos Mongoose (Species, JplPhoto, GcPhoto...)
│   │   ├── routes/             # Rutas Express (species, admin, families...)
│   │   └── scripts/            # Scripts de utilidad y migración
│   ├── .env.example            # Plantilla de variables de entorno
│   ├── .eslintrc.json          # Configuración ESLint
│   └── package.json
├── admin/                      # Panel de administración web (curadores)
├── biodiversidad/              # Módulo de biodiversidad (frontend)
├── agua/                       # Módulo de recursos hídricos (frontend)
├── comunidad/                  # Módulo comunidad (JPL, Guarda Cuencas, EDM)
└── data/                       # Traducciones globales ES/EN
```

---

## Despliegue en producción (Ubuntu Server 24.04 LTS)

### 1. Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clonar y configurar la aplicación

```bash
# Clonar el repositorio
git clone https://dev.azure.com/GobernacionAntioquia/antioquia-biodiversa-api-nodejs /var/www/antioquia-biodiversa

# Instalar dependencias
cd /var/www/antioquia-biodiversa/backend
npm install --omit=dev

# Configurar variables de entorno de producción
cp .env.example .env
nano .env
# Completar MONGODB_URI, SESSION_SECRET y ADMIN_PASSWORD con valores de producción
```

### 3. Iniciar la aplicación con PM2

```bash
cd /var/www/antioquia-biodiversa/backend

# Iniciar la app
pm2 start src/index.js --name antioquia-biodiversa

# Guardar configuración para reinicio automático
pm2 save
pm2 startup
```

### 4. Configurar Nginx como proxy inverso

Crear `/etc/nginx/sites-available/antioquia-biodiversa`:

```nginx
server {
    listen 80;
    server_name biodiversa.antioquia.gov.co;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/antioquia-biodiversa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtener certificado SSL
sudo certbot --nginx -d biodiversa.antioquia.gov.co
```

### 5. Verificar despliegue

```bash
pm2 status                          # Ver estado de la app
pm2 logs antioquia-biodiversa       # Ver logs en tiempo real
curl https://biodiversa.antioquia.gov.co/api/health   # Debe responder: {"status":"ok"}
```

---

## Panel de administración de curadores

Acceso: `https://biodiversa.antioquia.gov.co/admin/`

El panel permite a los curadores:
- Cargar las 50 fotografías mensuales de Jóvenes pa' Lante (JPL)
- Cargar las 10 fotografías mensuales de Guarda Cuencas
- Publicar el archivo JSON mensual de cada galería
- Las imágenes se convierten automáticamente a WebP (máx. 1200 px, q82) en el servidor

**Credenciales:** definidas en la variable `ADMIN_PASSWORD` del archivo `.env`.

---

## API REST

Base URL: `https://biodiversa.antioquia.gov.co/api`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/health` | Estado del servidor |
| GET | `/species` | Listado de especies (filtros: `kingdom`, `group`, `subregion`) |
| GET | `/species/:id` | Ficha completa de una especie |
| GET | `/families` | Familias taxonómicas |
| GET | `/groups` | Grupos de biodiversidad |
| GET | `/subregions` | Las 9 subregiones de Antioquia |
| GET | `/species-month` | Especie del mes activa |

> Documentación completa: Swagger/OpenAPI disponible próximamente en `/api/docs`

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript Vanilla |
| Backend | Node.js 22 LTS + Express 4 |
| Base de datos | MongoDB 7.x (Mongoose ODM) |
| Imágenes | sharp (WebP auto-conversión) |
| Uploads | multer |
| Autenticación admin | express-session + bcrypt |
| Servidor web | Nginx + PM2 |
| Control de versiones | Git + Azure DevOps |

---

## Contribución y control de versiones

Este proyecto sigue **GitFlow**:
- `main` — producción estable
- `develop` — integración continua
- `feature/nombre` — nuevas funcionalidades

Commits con estándar **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`

Código y comentarios en **español neutro** según lineamientos de la Gobernación de Antioquia.

---

*Gobernación de Antioquia - Secretaría de Ambiente*  
*Desarrollado con cumplimiento de la Guía de Arquitectura y Buenas Prácticas de la Gobernación de Antioquia*
