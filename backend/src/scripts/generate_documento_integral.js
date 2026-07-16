/**
 * generate_documento_integral.js
 * Genera el documento Word:
 *   Documento_Integral_Desarrollo_Antioquia_Natural.docx
 *
 * "Documentación técnica final del proyecto: infraestructura, arquitectura,
 * modelo de base de datos y demás componentes relevantes" — uno de los 5
 * documentos que pide TI Gobernación para el aval de paso a producción.
 *
 * Fuentes: README.md, CLAUDE.md, SCHEMA_DB.md (marcado como planeado, no
 * implementado), y el código real verificado en la sesión de calidad del
 * 2026-07-13/14 (backend/src/models, routes/admin.js, services/).
 *
 * Uso: node src/scripts/generate_documento_integral.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');

const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const GRAY_TEXT  = '555555';
const TABLE_HDR  = '018D38';
const TABLE_ALT  = 'F0FFF4';
const AMBER      = 'B8860B';

const border = (color = 'CCCCCC', sz = 4) => ({
  top: { style: BorderStyle.SINGLE, size: sz, color }, bottom: { style: BorderStyle.SINGLE, size: sz, color },
  left: { style: BorderStyle.SINGLE, size: sz, color }, right: { style: BorderStyle.SINGLE, size: sz, color },
});

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: GREEN })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
  });
}
function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: DARK_GREEN })],
    spacing: { before: 200, after: 100 },
  });
}
function para(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, size: 20, color: '333333' })], spacing: { after: 120 }, ...opts });
}
function nota(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 18, color: AMBER, italics: true })], spacing: { after: 140 } });
}
function bullet(text, level = 0) {
  return new Paragraph({ children: [new TextRun({ text, size: 20, color: '333333' })], bullet: { level }, spacing: { after: 60 } });
}
function code(lines) {
  return new Paragraph({
    children: [new TextRun({ text: lines, font: 'Courier New', size: 18, color: '0B5640' })],
    spacing: { before: 80, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
  });
}
function spacer() { return new Paragraph({ children: [], spacing: { after: 100 } }); }

function makeTable(headers, rows, colWidths) {
  const totalWidth = 9360;
  const widths = colWidths || headers.map(() => Math.floor(totalWidth / headers.length));
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HDR },
      borders: border(TABLE_HDR),
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })],
    })),
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? 'FFFFFF' : TABLE_ALT },
      borders: border(),
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, color: '333333' })], spacing: { before: 60, after: 60 } })],
    })),
  }));
  return new Table({ width: { size: totalWidth, type: WidthType.DXA }, rows: [headerRow, ...dataRows], borders: border() });
}

function buildDoc() {
  const children = [

    // ── PORTADA ──────────────────────────────────────────────────────────
    spacer(), spacer(),
    new Paragraph({ children: [new TextRun({ text: 'DOCUMENTO INTEGRAL DE DESARROLLO', bold: true, size: 40, color: GREEN })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: 'Antioquia Natural', bold: true, size: 26, color: DARK_GREEN })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
    new Paragraph({ children: [new TextRun({ text: 'Gobernación de Antioquia — Secretaría de Ambiente', size: 20, color: GRAY_TEXT, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: 'Contratista: Sebastián Guzmán Díaz · sguzmand@gmail.com · 3006552511', size: 18, color: GRAY_TEXT })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: 'Versión 1 — 2026-07-14', size: 18, color: GRAY_TEXT })], alignment: AlignmentType.CENTER, spacing: { after: 320 } }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 1. INTRODUCCIÓN ─────────────────────────────────────────────────
    heading1('1. Introducción'),
    para('Este documento consolida la documentación técnica final de Antioquia Natural para el trámite de aval de paso a producción ante la Dirección TIC de la Gobernación de Antioquia. Complementa al Levantamiento de Requisitos de Software y Propuesta Técnica (alcance funcional) y a la Lista de Chequeo de Conformidad (verificación de lineamientos), ambos entregados por separado.'),
    para('Antioquia Natural es una aplicación web mobile-first que permite consultar la biodiversidad del departamento (flora y fauna por subregión y grupo taxonómico), los recursos hídricos y los programas comunitarios Jóvenes pa\' Lante y Guarda Cuencas, en español e inglés, accesible vía código QR desde cualquier dispositivo móvil.'),

    // ── 2. ARQUITECTURA GENERAL ──────────────────────────────────────────
    heading1('2. Arquitectura General'),
    heading2('2.1. Stack tecnológico'),
    makeTable(
      ['Capa', 'Tecnología', 'Versión'],
      [
        ['Frontend', 'HTML5 + CSS3 + JavaScript Vanilla (sin frameworks)', '—'],
        ['Backend', 'Node.js + Express', '22 LTS / 4.x'],
        ['Base de datos', 'MongoDB Atlas + Mongoose ODM', '7.x'],
        ['Caché', 'Redis + ioredis (modo degradado si no está disponible)', '7.x / ^5'],
        ['Logs', 'Winston (JSON estructurado + traceId por petición)', '^3'],
        ['Imágenes', 'sharp (conversión automática a WebP)', '^0.34'],
        ['Subida de archivos', 'multer (memoria, sin escribir temporales a disco)', '^2.2'],
        ['Autenticación admin', 'express-session + bcrypt (contraseña hasheada, nunca texto plano)', '—'],
        ['Documentación API', 'OpenAPI 3.0.3 (swagger.yaml) + swagger-ui-express en /api/docs', '3.0.3'],
        ['SAST', 'ESLint + eslint-plugin-security + Semgrep (p/nodejs, p/owasp-top-ten, reglas locales)', '—'],
        ['Tests', 'Jest + Supertest (integración contra las rutas reales)', '^30'],
      ],
      [2200, 5560, 1600]
    ),
    nota('La autenticación admin migrará a Microsoft Entra ID (OAuth 2.0 + OIDC) una vez TI Gobernación provea Client ID y Tenant ID — ítem B1 del roadmap del proyecto.'),

    heading2('2.2. Organización del código (backend)'),
    para('El backend sigue una estructura de capas ligera: las rutas HTTP (routes/) validan la petición y delegan la lógica de negocio a servicios (services/), que a su vez usan los modelos de datos (models/) y utilidades transversales (utils/, middleware/). No implementa Clean Architecture ni Arquitectura Hexagonal en sentido estricto (los servicios llaman directo a Mongoose, sin interfaces de dominio), pero sí separa el "qué hace" del "cómo llega la petición" — ver detalle en el Chequeo de Lineamientos, sección 2.'),
    code(
      'backend/src/\n' +
      '  index.js          Arranque de Express, sesión, /api/health\n' +
      '  db.js             Conexión MongoDB (connCom) + Redis\n' +
      '  routes/admin.js   Capa HTTP: valida, llama al servicio, responde\n' +
      '  services/         Lógica de negocio, sin dependencia de Express\n' +
      '    fotoStorage.js       guardado/borrado de fotos en disco (WebP)\n' +
      '    jplStats.js          agregaciones de estadísticas JPL\n' +
      '    publicacion.js       publicar un mes a JSON público + índice\n' +
      '    inaturalistLookup.js consulta a la API de iNaturalist\n' +
      '  models/           Esquemas Mongoose (JplPhoto, GcPhoto, CommunitySighting, Municipality)\n' +
      '  middleware/       adminAuth (guard de sesión), requestLogger (traceId)\n' +
      '  utils/            logger (Winston), cache (Redis con TTLs)\n' +
      '  config/           catalogo.js — grupos/subregiones/IUCN válidos (única fuente de verdad)\n' +
      '  __tests__/        51 tests de integración (Jest + Supertest)'
    ),

    heading2('2.3. Módulos del frontend'),
    makeTable(
      ['Módulo', 'Contenido'],
      [
        ['Biodiversidad', 'Catálogo de especies por subregión/grupo taxonómico, mapa SVG interactivo, ficha con IUCN y distribución. Datos en JSON estático (species.json), sin API REST.'],
        ['Agua', 'Fuentes hídricas y cuencas abastecedoras por subregión. Datos en JSON estático.'],
        ['Comunidad — Jóvenes pa\' Lante', 'Mapa de 90 municipios beneficiados, galería fotográfica mensual con filtros. Backend real (MongoDB + API admin).'],
        ['Comunidad — Guarda Cuencas', 'Galería fotográfica mensual de cuencas y ríos. Backend real (MongoDB + API admin).'],
        ['Comunidad — Especie del Mes', 'Especie insignia mensual con galería comunitaria. Contenido editorial, sin backend propio actualmente.'],
        ['Panel admin (curadores)', 'Login con sesión, CRUD de fotos JPL/GC, autocompletar desde iNaturalist, publicar JSON mensual, estadísticas de cobertura.'],
      ],
      [2800, 6560]
    ),
    nota('Nota de alcance: solo los módulos Jóvenes pa\' Lante y Guarda Cuencas tienen persistencia real en MongoDB a través de la API. Biodiversidad, Agua y Especie del Mes se sirven como JSON estático desde el frontend — la migración de Biodiversidad a base de datos real está documentada como plan en SCHEMA_DB.md, pendiente de implementar.'),

    // ── 3. INFRAESTRUCTURA ───────────────────────────────────────────────
    heading1('3. Infraestructura'),
    heading2('3.1. Requisitos del servidor'),
    makeTable(
      ['Componente', 'Requisito'],
      [
        ['Sistema operativo', 'Ubuntu Server 24.04 LTS'],
        ['Node.js', '22 LTS'],
        ['Proceso', 'PM2 (gestor de procesos, reinicio automático)'],
        ['Proxy inverso', 'Nginx (proxy a Node.js, terminación SSL)'],
        ['Certificado SSL', 'Let\'s Encrypt vía Certbot (TLS 1.2+)'],
        ['Base de datos', 'MongoDB Atlas (cluster ya provisionado, plan M0)'],
        ['Caché', 'Redis 7.x (256 MB, política allkeys-lru) — opcional, modo degradado si no está disponible'],
      ],
      [2800, 6560]
    ),

    heading2('3.2. Variables de entorno requeridas'),
    makeTable(
      ['Variable', 'Descripción', 'Obligatoria'],
      [
        ['MONGODB_URI_COM', 'URI de conexión a la BD Comunidad (JPL, Guarda Cuencas)', 'Sí'],
        ['SESSION_SECRET', 'Secreto de las sesiones del panel admin (mín. 32 caracteres)', 'Sí'],
        ['ADMIN_PASSWORD_HASH', 'Hash bcrypt de la contraseña del panel de curadores (nunca texto plano)', 'Sí'],
        ['REDIS_URL', 'URL del servidor Redis', 'No — modo degradado sin caché'],
        ['LOG_LEVEL', 'Nivel de log: error, warn, info, debug', 'No'],
        ['PORT', 'Puerto del servidor (por defecto 3000)', 'No'],
      ],
      [2600, 5360, 1400]
    ),
    nota('El archivo .env nunca se sube al repositorio (excluido en .gitignore). backend/.env.example documenta cada variable, incluyendo el comando para generar el hash de la contraseña admin.'),

    heading2('3.3. Pasos de despliegue (resumen)'),
    bullet('1. Preparar el servidor: Node.js 22, PM2, Nginx, Certbot, Redis (ver README.md para comandos completos).'),
    bullet('2. Clonar el repositorio y configurar backend/.env a partir de .env.example.'),
    bullet('3. npm install --omit=dev, luego iniciar con PM2 (pm2 start src/index.js --name antioquia-natural).'),
    bullet('4. Configurar Nginx como proxy inverso y activar SSL con Certbot.'),
    bullet('5. Verificar: pm2 status, pm2 logs, y curl al endpoint /api/health (debe responder mongodb y redis conectados).'),
    para('El procedimiento completo, con cada comando, está en README.md (raíz del repositorio), sección "Despliegue en producción".'),

    heading2('3.4. Estrategia de Entornos'),
    para('Siguiendo la segregación de ambientes recomendada en la sección 6.1 de la Guía de Arquitectura y Buenas Prácticas de Desarrollo, el proyecto cuenta con los siguientes ambientes lógicos separados:'),
    makeTable(
      ['Ambiente', 'Estado'],
      [
        ['Desarrollo (Dev)', 'Local (localhost:3000), backend/.env. Único ambiente con datos reales hasta hoy (nombres de fotógrafos comunitarios provistos voluntariamente al participar en los programas) — no existe todavía separación de producción'],
        ['QA / Staging', 'Activo desde 2026-07-16. Frontend: rama develop desplegada aparte en Netlify (branch deploy), sin afectar el sitio de producción. Backend: base de datos MongoDB separada (antioquia-biodiversa-qa, mismo cluster Atlas) poblada con datos 100% sintéticos (backend/src/scripts/seed_qa_data.js) — ningún dato real de participantes'],
        ['Producción (Prod)', 'Pendiente de infraestructura provista por TI Gobernación (servidor Ubuntu 24.04, dominio institucional). El manual de despliegue (README.md) ya cubre el procedimiento completo'],
      ],
      [2500, 6860]
    ),
    para('La gestión de datos de prueba sigue la anonimización obligatoria de la sección 6.2 de la Guía: el ambiente de QA no contiene ningún dato real, y el ambiente de Desarrollo no maneja datos sensibles tipo cédula o identificación (solo nombres de pila de fotógrafos que consintieron participar en los programas comunitarios).'),

    // ── 4. MODELO DE BASE DE DATOS ───────────────────────────────────────
    heading1('4. Modelo de Base de Datos'),
    para('MongoDB Atlas, base de datos "comunidad" (variable MONGODB_URI_COM). No hay una segunda conexión activa a una base "biodiversidad" en el backend actual — el catálogo de especies se sirve como JSON estático desde el frontend (biodiversidad/data/species.json), no desde MongoDB.'),

    heading2('4.1. Colecciones en uso activo (accedidas por la API)'),
    heading2('JplPhoto — fotos de Jóvenes pa\' Lante'),
    code(
      '{\n' +
      '  mes: String,                 // \'YYYY-MM\', requerido\n' +
      '  orden: Number,\n' +
      '  fotos: [String],             // rutas relativas al frontend (1-3 fotos)\n' +
      '  credito: String,\n' +
      '  municipio: String,\n' +
      '  subregion: String,           // requerido, validado contra catálogo fijo (9 subregiones)\n' +
      '  especieEs / especieEn / especieCientifico: String,\n' +
      '  grupo: String,                // requerido, validado contra catálogo fijo (9 grupos)\n' +
      '  iucn: String,                 // validado contra LC/NT/VU/EN/CR/DD/NE, default DD\n' +
      '  endemica: Boolean,\n' +
      '  descripcionEs / descripcionEn: String,\n' +
      '  publicado: Boolean,\n' +
      '  timestamps: true\n' +
      '}'
    ),
    heading2('GcPhoto — fotos de Guarda Cuencas'),
    code(
      '{\n' +
      '  mes: String, orden: Number,\n' +
      '  foto: String,                 // requerido\n' +
      '  credito / municipio: String,\n' +
      '  subregion: String,            // requerido, validado contra catálogo fijo\n' +
      '  cuenca / tituloEs: String,     // requeridos\n' +
      '  tituloEn / descripcionEs / descripcionEn: String,\n' +
      '  publicado: Boolean,\n' +
      '  timestamps: true\n' +
      '}'
    ),
    para('La validación de grupo/subregión/IUCN se centraliza en backend/src/config/catalogo.js — la misma fuente de verdad se usa en la ruta HTTP (rechazo con 400 y mensaje claro) y en el esquema de Mongoose (enum, como respaldo).'),

    heading2('4.2. Colecciones definidas pero sin ruta activa'),
    para('CommunitySighting y Municipality tienen esquema Mongoose definido en el código, pero ninguna ruta de la API los lee ni escribe actualmente — quedaron preparados para una futura integración de Especie del Mes con base de datos real, hoy esa sección funciona con JSON estático y contenido editorial manual.'),

    heading2('4.3. Índices recomendados'),
    code(
      'JplPhoto: { mes: 1, orden: 1 }\n' +
      'JplPhoto: { mes: 1, publicado: 1 }\n' +
      'GcPhoto:  { mes: 1, orden: 1 }'
    ),

    // ── 5. SEGURIDAD ──────────────────────────────────────────────────────
    heading1('5. Seguridad'),
    para('Verificación ejecutada el 2026-07-13/14, con los 4 pasos de SAST/calidad del pipeline de CI corridos manualmente contra el código real (el pipeline de Azure DevOps sigue inactivo, pendiente de las Service Connections de TI).'),
    makeTable(
      ['Verificación', 'Resultado'],
      [
        ['npm audit --audit-level=high', '0 vulnerabilidades (3 corregidas esta sesión: multer, form-data, js-yaml)'],
        ['ESLint + eslint-plugin-security', '0 errores'],
        ['Semgrep (p/nodejs + p/owasp-top-ten + reglas locales)', '0 hallazgos'],
        ['Autenticación admin', 'bcrypt (factor de costo 10), ya no compara contraseña en texto plano'],
        ['Cookie de sesión', 'httpOnly explícito, nombre custom (no revela la librería), secure activo en producción'],
        ['Credenciales en código fuente', 'Ninguna — todas se leen de variables de entorno'],
        ['Licencias de dependencias', '13 dependencias de producción: 11 MIT, 1 BSD-2-Clause, 1 Apache-2.0. Ninguna GPL/restrictiva'],
        ['Cifrado en tránsito (TLS 1.2+)', 'Documentado y listo en el manual de despliegue (Nginx + Let\'s Encrypt/Certbot), pendiente de verificar en vivo hasta que exista un ambiente real desplegado'],
        ['Cifrado en reposo', 'Provisto por defecto por MongoDB Atlas en todos sus clusters, incluido el plan gratuito M0 usado actualmente'],
        ['MFA para administradores', 'Pendiente — la solución de fondo es Microsoft Entra ID (ítem B1 del roadmap), sujeta a que TI Gobernación provea Client ID y Tenant ID. Mientras tanto, acceso protegido con sesión + contraseña con hash bcrypt'],
      ],
      [3800, 5560]
    ),
    nota('Detalle completo, incluyendo los ítems parcialmente cumplidos (patrón de arquitectura del backend y cifrado en un ambiente todavía sin desplegar), en la Lista de Chequeo de Conformidad entregada por separado.'),

    // ── 6. CALIDAD Y PRUEBAS ─────────────────────────────────────────────
    heading1('6. Calidad y Pruebas'),
    makeTable(
      ['Métrica', 'Valor'],
      [
        ['Tests de integración', '51 (Jest + Supertest, contra las rutas HTTP reales)'],
        ['Cobertura de líneas', '98.62% (umbral configurado: 90%)'],
        ['Cobertura de funciones', '95.38% (umbral configurado: 90%)'],
        ['Alcance de la cobertura medida', 'routes/admin.js, middleware/, services/'],
        ['Reporte de tests', 'JUnit XML (jest-junit), listo para publicar en Azure DevOps'],
      ],
      [3200, 6160]
    ),
    para('Los tests cubren: autenticación (login/logout/sesión), CRUD completo de fotos JPL y Guarda Cuencas (crear, editar, eliminar, listar, validaciones), autocompletar desde iNaturalist, agregaciones estadísticas, publicación de JSON mensual, y el middleware de logging.'),

    // ── 7. ANEXOS ─────────────────────────────────────────────────────────
    heading1('7. Documentos Relacionados'),
    para('Entregados por separado, como parte del mismo trámite de aval:'),
    bullet('Levantamiento de Requisitos de Software y Propuesta Técnica — alcance funcional, roles, requerimientos funcionales y no funcionales.'),
    bullet('Lista de Chequeo de Conformidad — verificación ítem por ítem contra la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación.'),
    bullet('README.md (raíz del repositorio) — manual de instalación y despliegue paso a paso, con todos los comandos.'),
    bullet('swagger.yaml (backend/src/) — especificación OpenAPI 3.0.3 de la API, navegable en /api/docs.'),

    spacer(), spacer(),
    new Paragraph({ children: [new TextRun({ text: 'Antioquia Natural — Gobernación de Antioquia', size: 18, color: GRAY_TEXT, italics: true })], alignment: AlignmentType.CENTER }),
  ];

  return new Document({ sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }] });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const doc = buildDoc();
  const outFile = path.join(OUT_DIR, 'Documento_Integral_Desarrollo_Antioquia_Natural.docx');
  await Packer.toBuffer(doc).then(buf => fs.writeFileSync(outFile, buf));
  console.log(`✓ ${outFile}`);
}

main().catch(console.error);
