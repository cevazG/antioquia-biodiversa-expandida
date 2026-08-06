/**
 * generate_documento_integral.js
 * Genera el documento Word:
 *   Documento_Integral_Desarrollo_Antioquia_Natural.docx
 *
 * "Documentación técnica final del proyecto: infraestructura, arquitectura,
 * modelo de base de datos y demás componentes relevantes" — uno de los 5
 * documentos que pide TI Gobernación para el aval de paso a producción.
 * Frente a la plantilla institucional FO-M7-P8-023.
 *
 * Reestructurado el 28/07/2026 según observaciones de revisión documental:
 * portada + TOC nativos, diagramas de arquitectura/infraestructura/datos/flujo
 * (generados con mermaid-cli, ver Documentos gobernacion/TI/Revision 2/diagramas/),
 * sección de Metodología y Herramientas, procedimiento de Rollback explícito,
 * y bloque de Aprobación y Firmas.
 *
 * Fuentes: README.md, CLAUDE.md, SCHEMA_DB.md (marcado como planeado, no
 * implementado), y el código real verificado en las sesiones de calidad de
 * julio 2026 (backend/src/models, routes/admin.js, services/).
 *
 * Uso: node src/scripts/generate_documento_integral.js
 */

const { Document, Packer } = require('docx');
const fs = require('fs');
const path = require('path');
const {
  heading1, heading2, heading3, para, nota, bullet, code, spacer, makeTable, image, scorecard,
  portada, tocSection, footerConNumeracion, headerInstitucional, PAGE_MARGIN,
} = require('./lib/docx_helpers');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');
const DIAG_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Revision 2/diagramas');

function buildDoc() {
  const children = [

    ...portada({
      titulo: 'DOCUMENTO INTEGRAL DE DESARROLLO',
      version: '2',
      fecha: '2026-07-28',
    }),

    ...tocSection(),

    // ── ESTADO DE COMPLETITUD ─────────────────────────────────────────────
    heading1('Estado de Completitud del Documento'),
    scorecard('Completitud documental: 100%  ·  Pendientes atribuibles al desarrollo: 0  ·  Pendientes de TI Gobernación: 3'),
    para('Este documento fue verificado ítem por ítem contra la plantilla institucional FO-M7-P8-023 (revisión del 28/07/2026). Las 12 secciones y los Anexos exigidos están desarrollados con contenido real, verificado contra el código del repositorio — ninguna sección está vacía, en borrador o marcada "por definir". El diccionario de datos en Excel exigido por la sección 6.6 ya fue generado y se entrega junto con este documento.'),
    para('Los 3 puntos siguientes no son vacíos de este documento: son insumos que TI Gobernación debe entregar para que el desarrollo, ya completo, se active. Se listan aquí para que queden visibles en un solo lugar, en vez de dispersos:'),
    bullet('Client ID y Tenant ID de Microsoft Entra ID (sección 11, ítem B1) — depende de TI Gobernación, no del equipo de desarrollo.'),
    bullet('Activación del proyecto Azure DevOps (sección 4.4) — el pipeline azure-pipelines.yml ya está escrito y verificado localmente; falta que TI configure las Service Connections.'),
    bullet('Servidor de producción on-premises (sección 5.2) — el Manual Técnico (sección 9) ya documenta el procedimiento de despliegue completo; falta que TI Gobernación entregue el servidor Ubuntu 24.04.'),
    spacer(),

    // ── 1. INTRODUCCIÓN ─────────────────────────────────────────────────
    heading1('1. Introducción'),
    para('Este documento consolida la documentación técnica final de Antioquia Natural para el trámite de aval de paso a producción ante la Dirección TIC de la Gobernación de Antioquia. Complementa al Levantamiento de Requisitos de Software y Propuesta Técnica (alcance funcional) y a la Lista de Chequeo de Conformidad (verificación de lineamientos), ambos entregados por separado.'),
    para('Antioquia Natural es una aplicación web mobile-first que permite consultar la biodiversidad del departamento (flora y fauna por subregión y grupo taxonómico), los recursos hídricos y los programas comunitarios Jóvenes pa\' Lante y Guarda Cuencas, en español e inglés, accesible vía código QR desde cualquier dispositivo móvil.'),
    para('Es un "living document": se actualiza a medida que la aplicación evoluciona. La versión vigente está indicada en la portada; el historial detallado de cambios (Control de Ajustes) se lleva en la Propuesta de Ajustes Técnicos v2, entregada por separado.'),

    // ── 2. ARQUITECTURA ──────────────────────────────────────────────────
    heading1('2. Arquitectura (Incluir diagramas)'),
    para('Esta sección describe la estructura general y los componentes principales de la aplicación: primero la vista de conjunto con su diagrama (2.1), luego el detalle interno del backend (2.2), y por último los patrones arquitectónicos aplicados y su justificación (2.3).'),

    heading2('2.1. Arquitectura general'),
    para('Arquitectura monolítica modular: un frontend estático (HTML/CSS/JS vanilla) y un backend Node.js/Express, ambos servidos desde el mismo servidor institucional — Nginx entrega los archivos estáticos del frontend directamente y hace proxy inverso hacia el backend para las rutas de la API. El backend expone una API REST consumida únicamente por el panel de administración; los módulos públicos (Biodiversidad, Agua, Comunidad) leen datos directamente como JSON estático, sin pasar por la API.'),
    ...image(path.join(DIAG_DIR, 'arquitectura_general.png'), 1530, 1870, 'Figura 1. Arquitectura general de Antioquia Natural.'),

    heading2('2.2. Diagramas de Arquitectura Detallados'),
    para('Dentro del backend, las rutas HTTP (routes/admin.js) validan la petición y delegan a la capa de servicios (services/), que a su vez usa los modelos de datos (models/) y utilidades transversales (utils/, middleware/, config/catalogo.js como única fuente de verdad para los catálogos válidos).'),
    ...image(path.join(DIAG_DIR, 'arquitectura_detallada.png'), 1568, 624, 'Figura 2. Arquitectura detallada del backend: rutas → servicios → modelos.'),
    para('Los dos componentes con mayor complejidad de interacción (llamadas externas encadenadas y efectos secundarios en disco/caché) se detallan por separado como diagramas de secuencia:'),
    para('Autofill iNaturalist: la única integración con un servicio externo, con una búsqueda inicial seguida de dos llamadas en paralelo.'),
    ...image(path.join(DIAG_DIR, 'secuencia_autofill.png'), 1384, 708, 'Figura 2a. Secuencia del autofill de iNaturalist en el panel admin JPL.'),
    para('CRUD multi-foto: edición de una entrada JPL con borrado selectivo en disco, conversión a WebP y numeración secuencial de archivos nuevos.'),
    ...image(path.join(DIAG_DIR, 'secuencia_multifoto.png'), 1384, 452, 'Figura 2b. Secuencia de edición multi-foto (1-3 imágenes) en el panel admin JPL.'),

    heading2('2.3. Patrones de Arquitectura Utilizados'),
    para('El backend sigue una estructura de capas ligera, sin implementar Clean Architecture ni Arquitectura Hexagonal en sentido estricto (los servicios llaman directo a Mongoose, sin interfaces de dominio), pero sí separa el "qué hace" del "cómo llega la petición" — ver detalle y justificación en el Chequeo de Lineamientos, sección 2.'),
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

    // ── 3. TECNOLOGÍAS ────────────────────────────────────────────────────
    heading1('3. Tecnologías'),
    para('Esta sección enumera y describe las tecnologías, lenguajes, frameworks, librerías y herramientas de desarrollo utilizadas (3.1), y explica los criterios detrás de las decisiones técnicas más relevantes (3.2).'),
    heading2('3.1. Lista de Tecnologías'),
    makeTable(
      ['Código', 'Tecnología', 'Versión', 'Descripción', 'Utilidad'],
      [
        ['TEC001', 'HTML5 + CSS3 + JavaScript Vanilla', '—', 'Interfaz de usuario sin frameworks', 'Frontend'],
        ['TEC002', 'Node.js', '22 LTS', 'Runtime de JavaScript del lado del servidor', 'Backend'],
        ['TEC003', 'Express', '4.x', 'Framework web minimalista sobre Node.js', 'Backend'],
        ['TEC004', 'MongoDB Atlas + Mongoose', '7.x', 'Base de datos NoSQL gestionada + ODM', 'Base de Datos'],
        ['TEC005', 'Redis + ioredis', '7.x / ^5', 'Caché en memoria, modo degradado si no está disponible', 'Backend / Rendimiento'],
        ['TEC006', 'Winston', '^3', 'Logs JSON estructurados con traceId por petición', 'Backend / Observabilidad'],
        ['TEC007', 'sharp', '^0.34', 'Conversión y optimización automática de imágenes a WebP', 'Backend'],
        ['TEC008', 'multer', '^2.2', 'Recepción de archivos subidos, en memoria (sin temporales a disco)', 'Backend'],
        ['TEC009', 'express-session + bcrypt', '—', 'Autenticación del panel admin, contraseña hasheada (nunca texto plano)', 'Backend / Seguridad'],
        ['TEC010', 'swagger.yaml + swagger-ui-express', 'OpenAPI 3.0.3', 'Documentación interactiva de la API en /api/docs', 'Backend / Documentación'],
        ['TEC011', 'ESLint-security + Semgrep', '—', 'Análisis estático de seguridad (reglas p/nodejs, p/owasp-top-ten, locales)', 'CI/CD / Seguridad'],
        ['TEC012', 'Jest + Supertest', '^30', 'Framework de tests y aserciones HTTP de integración', 'Backend / Pruebas'],
        ['TEC013', 'Leaflet.js', '1.9.4', 'Mapas interactivos (municipios JPL, cuencas hídricas)', 'Frontend'],
      ],
      [900, 2200, 1200, 3560, 1500]
    ),

    heading2('3.2. Justificación de la Selección'),
    bullet('Node.js + Express: ya presentado y revisado por TI Gobernación en la Propuesta Técnica y el Levantamiento de Requisitos, sin objeciones. Ecosistema maduro, gran comunidad, curva de aprendizaje baja para mantenimiento futuro por otro equipo.'),
    bullet('MongoDB: esquema flexible adecuado para catálogos y fotografías con metadatos variables (1-3 fotos por entrada, campos bilingües opcionales). Atlas incluye backups automáticos y cifrado en reposo por defecto, sin configuración adicional.'),
    bullet('JavaScript Vanilla en frontend (sin framework): la app es mobile-first con interacciones relativamente simples (navegación, filtros, galería); un framework SPA habría agregado peso de carga y complejidad de build sin beneficio proporcional para este alcance.'),
    bullet('Redis: elegido por ser el estándar de facto para caché en aplicaciones Node.js, con modo degradado nativo (la app sigue funcionando si Redis no está disponible, solo pierde el beneficio de velocidad).'),
    bullet('Winston + Semgrep + ESLint-security: herramientas gratuitas (Community Edition en el caso de Semgrep) con soporte nativo para Node.js/Express y para las reglas OWASP Top 10 exigidas por el RNF05.'),

    // ── 4. METODOLOGÍA Y HERRAMIENTAS ─────────────────────────────────────
    heading1('4. Metodología y Herramientas'),
    para('Esta sección describe la metodología de desarrollo de software (4.1) y las herramientas utilizadas por el equipo para gestión de proyecto (4.2), control de versiones (4.3), integración y entrega continua (4.4), y desarrollo en general (4.5).'),
    heading2('4.1. Metodología de Desarrollo'),
    para('Metodología ágil adaptada a un equipo unipersonal (un solo desarrollador): iteraciones cortas con entrega continua por módulo o funcionalidad, sin las ceremonias formales de Scrum (daily, sprint planning, retro) que requieren un equipo de varias personas para tener sentido. Fases por entregable: Análisis → Diseño → Desarrollo → Pruebas (QA) → Despliegue.'),

    heading2('4.2. Herramientas de Gestión de Proyectos'),
    para('Seguimiento vía GitHub (issues y commits referenciados a cambios concretos). No se usa una herramienta de gestión de proyecto separada (Jira/Trello) dado el tamaño del equipo — cuando el proyecto de Azure DevOps de TI Gobernación se active, los Work Items y Boards de Azure DevOps (ver Guía de Azure DevOps entregada por TI) pasarán a ser la herramienta oficial de seguimiento.'),

    heading2('4.3. Herramientas de Control de Versiones'),
    para('Git, con GitFlow como estrategia de ramas: main es producción estable, develop es la rama de integración, y feature/nombre para desarrollos nuevos. Los commits siguen el estándar Conventional Commits (feat:, fix:, docs:, etc.).'),
    para('Repositorio de desarrollo en GitHub (cevazG/antioquia-biodiversa-expandida). Cuando TI active el proyecto institucional en Azure DevOps, el repositorio se espejará ahí como exige la Guía de Arquitectura y Buenas Prácticas de Desarrollo.'),

    heading2('4.4. Herramientas de Integración y Entrega Continua (CI/CD)'),
    para('Pipeline definido en azure-pipelines.yml (raíz del repositorio), listo para ejecutarse en cuanto TI Gobernación active las Service Connections del proyecto en Azure DevOps. Verificado manualmente paso a paso el 2026-07-13 contra el código real:'),
    makeTable(
      ['Paso', 'Acción', 'Falla si...'],
      [
        ['1', 'Checkout desde Azure Repos', '—'],
        ['2', 'npm install', 'Dependencias no resuelven'],
        ['3', 'npm audit --audit-level=high', 'CVE Alta o Crítica en dependencias de producción'],
        ['4', 'npm run lint:security', 'Error ESLint de severidad "error"'],
        ['5', 'npm test', 'Test fallido o cobertura < 90%'],
        ['6', 'Semgrep (p/nodejs + p/owasp-top-ten)', 'Vulnerabilidad Alta o Crítica'],
        ['7', 'Build + deploy (solo develop/main)', '—'],
      ],
      [900, 4900, 3560]
    ),
    para('Despliegue del frontend: los archivos estáticos se sincronizan al servidor institucional junto con cada despliegue del backend, dentro del mismo procedimiento (ver sección 9.3) — ambos quedan servidos por el mismo Nginx.'),

    heading2('4.5. Otras Herramientas de Desarrollo'),
    bullet('Editor/asistente: Claude Code (Anthropic) para desarrollo asistido y generación de documentación técnica.'),
    bullet('mermaid-cli: generación de los diagramas técnicos de este documento a partir de código versionable (.mmd), reproducibles ante cualquier cambio de arquitectura.'),

    // ── 5. INFRAESTRUCTURA ───────────────────────────────────────────────
    heading1('5. Infraestructura'),
    para('Esta sección detalla la infraestructura donde se despliega y ejecuta la aplicación: el diagrama por ambiente (5.1), la segregación entre Desarrollo, QA/Staging y Producción (5.2), los proveedores de nube involucrados (5.3), las especificaciones de hardware solicitadas a TI Gobernación (5.4), y las consideraciones de escalabilidad y disponibilidad (5.5).'),
    heading2('5.1. Diagrama de Infraestructura'),
    ...image(path.join(DIAG_DIR, 'infraestructura.png'), 860, 1283, 'Figura 3. Infraestructura definitiva por ambiente: origen del código en Azure Repos, pipeline de Azure DevOps y despliegue en el servidor de la Gobernación.'),

    heading2('5.2. Entornos de Despliegue'),
    para('Siguiendo la segregación de ambientes de la sección 6.1 de la Guía de Arquitectura y Buenas Prácticas de Desarrollo:'),
    makeTable(
      ['Ambiente', 'Estado'],
      [
        ['Desarrollo (Dev)', 'Local (localhost:3000), backend/.env. Es el único ambiente con datos reales hasta hoy porque el ambiente de Producción todavía no existe (pendiente del servidor de TI Gobernación, ver Estado de Completitud). Esos datos reales son únicamente nombres de pila de fotógrafos comunitarios (campo "credito"), provistos voluntariamente y ya destinados a mostrarse públicamente como crédito en las galerías: no son información confidencial en riesgo, ver detalle en la sección 7.2'],
        ['QA / Staging', 'Activo desde 2026-07-16. Entorno de staging interno del equipo de desarrollo, aislado de producción, usado para validar la rama develop antes de fusionarla a main. Backend: base de datos MongoDB separada (antioquia-biodiversa-qa, mismo cluster Atlas), puerto local 3001, poblada con datos 100% sintéticos (backend/src/scripts/seed_qa_data.js) — ningún dato real de participantes'],
        ['Producción (Prod)', 'Frontend y backend desplegados juntos en el servidor institucional (Ubuntu 24.04): Nginx sirve el frontend y hace proxy inverso al backend (PM2). El manual de despliegue (README.md) ya cubre el procedimiento completo. Pendiente de la entrega del servidor por parte de TI Gobernación — ver Estado de Completitud'],
      ],
      [2500, 6860]
    ),
    para('La gestión de datos de prueba sigue la anonimización obligatoria de la sección 6.2 de la Guía: el ambiente de QA no contiene ningún dato real, y el ambiente de Desarrollo no maneja datos sensibles tipo cédula o identificación (solo nombres de pila de fotógrafos que consintieron participar en los programas comunitarios).'),

    heading2('5.3. Proveedores de Servicios en la Nube'),
    bullet('MongoDB Atlas: base de datos gestionada, cluster M0 (plan gratuito), con backups automáticos y cifrado en reposo por defecto. Es el único componente de producción que depende de un proveedor externo.'),
    bullet('Servidor propio (on-premise): tanto el frontend estático como el backend Node.js corren en infraestructura de la Gobernación (Ubuntu 24.04) — no se usa ningún servicio externo de hosting o CDN para servir la aplicación.'),

    heading2('5.4. Especificaciones del Hardware'),
    makeTable(
      ['Componente', 'Requisito'],
      [
        ['Servidor', 'Ubuntu Server 24.04 LTS — 4 vCPU, 16 GB RAM, 2 TB almacenamiento'],
        ['Proceso', 'PM2 (gestor de procesos, reinicio automático)'],
        ['Proxy inverso', 'Nginx (proxy a Node.js, terminación SSL)'],
        ['Certificado SSL', 'Let\'s Encrypt vía Certbot (TLS 1.2+)'],
        ['Caché', 'Redis 7.x (256 MB, política allkeys-lru) — opcional, modo degradado si no está disponible'],
      ],
      [2800, 6560]
    ),

    heading2('5.5. Consideraciones de Escalabilidad y Disponibilidad'),
    para('El diseño actual prioriza simplicidad operativa (monolito modular) sobre escalabilidad horizontal extrema, coherente con el volumen esperado de tráfico (aplicación departamental, no de escala nacional masiva).'),
    bullet('Redis absorbe la carga de lectura del catálogo (prácticamente estático), evitando que picos de tráfico —por ejemplo al difundir el código QR en un evento público— golpeen directamente a MongoDB.'),
    bullet('PM2 reinicia automáticamente el proceso Node.js ante una caída.'),
    bullet('MongoDB Atlas M0 tiene límites de conexiones concurrentes propios del plan gratuito; escalar a un tier de pago es la vía natural si el tráfico lo exige, sin cambios de código.'),
    bullet('No hay balanceo de carga ni múltiples instancias del backend en el diseño actual — se consideraría solo si el monitoreo (sección 9) mostrara que es necesario.'),

    // ── 6. BASE DE DATOS ──────────────────────────────────────────────────
    heading1('6. Base de Datos'),
    para('Esta sección describe el motor de base de datos utilizado y la estructura de datos manejada por la aplicación: el motor (6.1), el modelo entidad-relación (6.2), el esquema real de las colecciones (6.3), cómo la aplicación accede a los datos (6.4), las consideraciones de rendimiento (6.5) y el diccionario de datos (6.6).'),
    heading2('6.1. Motor de Base de Datos'),
    para('MongoDB Atlas 7.x, base de datos "comunidad" (variable de entorno MONGODB_URI_COM). Se eligió por su esquema flexible, adecuado para catálogos con campos opcionales y arreglos de longitud variable (1-3 fotos por entrada), y porque Atlas incluye backups automáticos y cifrado en reposo sin configuración adicional. No hay una segunda conexión activa a una base "biodiversidad" en el backend actual — el catálogo de especies se sirve como JSON estático desde el frontend (biodiversidad/data/species.json), no desde MongoDB; una eventual migración a MongoDB (si el catálogo crece más allá de lo que un JSON estático puede servir con buen rendimiento) ya está documentada como arquitectura de referencia en SCHEMA_DB.md, sin fecha comprometida — es una opción de escalamiento a futuro (roadmap Fase 3), no un requisito de esta plantilla.'),

    heading2('6.2. Diagrama del Modelo de Datos'),
    ...image(path.join(DIAG_DIR, 'modelo_datos.png'), 1568, 686, 'Figura 4. Modelo de datos (DER): colecciones activas (JplPhoto, GcPhoto) y definidas sin ruta activa (CommunitySighting, Municipality).'),

    heading2('6.3. Descripción del Esquema de la Base de Datos'),
    heading3('JplPhoto — fotos de Jóvenes pa\' Lante (colección activa)'),
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
    heading3('GcPhoto — fotos de Guarda Cuencas (colección activa)'),
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
    heading3('CommunitySighting y Municipality — colecciones definidas, sin ruta activa'),
    para('Ambas tienen esquema Mongoose definido en el código, pero ninguna ruta de la API los lee ni escribe actualmente — quedaron preparados para una futura integración de Especie del Mes con base de datos real; hoy esa sección funciona con JSON estático y contenido editorial manual.'),
    para('La validación de grupo/subregión/IUCN se centraliza en backend/src/config/catalogo.js — la misma fuente de verdad se usa en la ruta HTTP (rechazo con 400 y mensaje claro) y en el esquema de Mongoose (enum, como respaldo).'),

    heading2('6.4. Estrategias de Acceso a Datos'),
    para('Acceso vía Mongoose ODM (Object Document Mapper) desde la capa de servicios (services/) — las rutas HTTP nunca llaman a Mongoose directamente, siempre delegan al servicio correspondiente. Consultas simples (find, findOne, findOneAndUpdate); las agregaciones estadísticas (jplStats.js) usan el pipeline de agregación nativo de MongoDB.'),

    heading2('6.5. Consideraciones de Rendimiento y Escalabilidad de la Base de Datos'),
    para('El catálogo de especies (JSON estático, no MongoDB) no genera carga de base de datos. Las colecciones activas (JplPhoto, GcPhoto) son de bajo volumen (proyección ~4.000 y ~800 registros respectivamente al final de los programas), por lo que no se anticipan problemas de rendimiento con los índices actuales. Redis (ver Ajuste 2 de la Propuesta de Ajustes Técnicos v2) absorbe la carga de lectura repetitiva donde aplica.'),
    para('Índices recomendados:'),
    code(
      'JplPhoto: { mes: 1, orden: 1 }\n' +
      'JplPhoto: { mes: 1, publicado: 1 }\n' +
      'GcPhoto:  { mes: 1, orden: 1 }'
    ),

    heading2('6.6. Diccionario de datos'),
    para('Conforme a la plantilla, el diccionario de datos no se incluye en este documento — se entrega como archivo Excel versionado aparte: Diccionario_Datos_BD_Comunidad_Antioquia_Natural.xlsx, con una hoja por colección (JplPhoto, GcPhoto, CommunitySighting, Municipality) y las columnas exigidas: nombre del campo, tipo de dato, PK/FK si aplica, capacidad máxima, especificaciones adicionales y comentarios.'),

    // ── 7. SEGURIDAD ──────────────────────────────────────────────────────
    heading1('7. Seguridad (Manejo de la Seguridad)'),
    para('Esta sección describe las medidas de seguridad implementadas: autenticación y autorización (7.1), manejo de datos sensibles (7.2), protección contra vulnerabilidades comunes (7.3), políticas de seguridad (7.4) y auditorías realizadas (7.5).'),
    heading2('7.1. Autenticación y Autorización'),
    para('Autenticación del panel de administración vía express-session + bcrypt (factor de costo 10): la contraseña nunca se compara en texto plano ni se guarda en el código fuente (corregido 2026-07-14, se lee de la variable de entorno ADMIN_PASSWORD_HASH). La sesión queda protegida con cookie httpOnly, de nombre personalizado (no revela la librería usada), con expiración de 8 horas y marcada secure en producción (detalle completo en la sección 7.3).'),
    para('Autorización: hoy es binaria (sesión activa o no), sin roles granulares, con una sola contraseña compartida entre los curadores del panel (Jóvenes pa\' Lante y Guarda Cuencas). Cualquier curador autenticado puede editar cualquier módulo, sin separación de funciones ni registro individual de quién hizo cada cambio. Es una limitación conocida y aceptada temporalmente, mitigada por ser un panel de uso interno, no público, con un número reducido de curadores designados por los programas.'),
    para('La solución definitiva es la migración a Microsoft Entra ID (OAuth 2.0 + OIDC), con 3 roles diferenciados (Curador.Biodiversidad, Curador.GuardaCuencas y Admin.Contenido), cada uno limitado a su propio módulo, con identidad individual por curador en vez de una clave compartida. Esta migración está completamente especificada, con su justificación técnica y cronograma, como Ajuste 1 en la Propuesta de Ajustes Técnicos v2 (documento entregado por separado); depende exclusivamente de que TI Gobernación provea el Client ID y Tenant ID del tenant institucional de Entra ID (ver Estado de Completitud).'),

    heading2('7.2. Manejo de Datos Sensibles'),
    para('Cifrado en tránsito: documentado y listo en el manual de despliegue (Nginx + Let\'s Encrypt/Certbot, TLS 1.2+); su verificación en vivo depende del mismo servidor de producción listado como pendiente de TI Gobernación en el Estado de Completitud (no es un punto adicional). Cifrado en reposo: provisto por defecto por MongoDB Atlas en todos sus clusters, incluido el plan gratuito M0 usado actualmente. No hay datos sensibles tipo cédula o documento de identidad en ninguna base; sí hay nombres de pila de fotógrafos comunitarios (campo "credito"), provistos voluntariamente al participar en los programas y ya destinados a publicarse como crédito visible en las galerías (ver services/publicacion.js), es decir, no es información confidencial que deba protegerse de exposición, solo un dato pendiente de que exista un ambiente de Producción separado (sección 5.2).'),

    heading2('7.3. Medidas de Protección contra Vulnerabilidades Comunes'),
    makeTable(
      ['Verificación', 'Resultado'],
      [
        ['npm audit --audit-level=high', '0 vulnerabilidades (3 corregidas en sesión de julio 2026: multer, form-data, js-yaml)'],
        ['ESLint + eslint-plugin-security', '0 errores'],
        ['Semgrep (p/nodejs + p/owasp-top-ten + reglas locales)', '0 hallazgos'],
        ['Cookie de sesión', 'httpOnly explícito, nombre custom (no revela la librería), secure activo en producción'],
        ['Credenciales en código fuente', 'Ninguna — todas se leen de variables de entorno'],
        ['Path traversal / inyección', 'Validación de entrada en rutas de admin.js; rutas de archivo siempre generadas por el servidor, nunca directamente desde input del usuario'],
        ['Licencias de dependencias', '13 dependencias de producción: 11 MIT, 1 BSD-2-Clause, 1 Apache-2.0. Ninguna GPL/restrictiva'],
        ['MFA para administradores', 'Pendiente — la solución de fondo es Microsoft Entra ID (ítem B1 del roadmap, sección 11), sujeta a que TI Gobernación provea Client ID y Tenant ID. Mientras tanto, acceso protegido con sesión + contraseña con hash bcrypt'],
      ],
      [3800, 5560]
    ),

    heading2('7.4. Políticas de Seguridad'),
    para('El proyecto sigue las políticas de seguridad de la información definidas en la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación de Antioquia (sección 9 de dicha Guía, "Seguridad y Privacidad"), incluyendo prohibición de contraseñas en texto plano, cifrado en tránsito obligatorio, y verificación de licencias de terceros compatibles con uso institucional.'),

    heading2('7.5. Auditorías de Seguridad'),
    para('Auditoría manual ejecutada el 2026-07-13/14 mediante Semgrep (rulesets p/nodejs, p/owasp-top-ten, más 3 reglas locales en .semgrep.yml) y ESLint-security, corridos directamente contra el código real. Hallazgos iniciales: 58 (Semgrep), reducidos a 0 tras corregir/documentar cada caso — ver detalle completo en el Chequeo de Lineamientos, sección "SAST". No ha habido una auditoría externa independiente; el pipeline de Azure DevOps (sección 4.4) automatizará esta verificación en cada push una vez activado por TI.'),
    nota('Detalle completo, incluyendo los ítems parcialmente cumplidos (patrón de arquitectura del backend y cifrado en un ambiente todavía sin desplegar), en la Lista de Chequeo de Conformidad entregada por separado.'),

    // ── 8. PRUEBAS Y TESTING ──────────────────────────────────────────────
    heading1('8. Pruebas y Testing'),
    para('Esta sección detalla la estrategia de pruebas y los tipos de pruebas que se realizan: el enfoque general (8.1), los tipos de prueba (8.2), las herramientas usadas (8.3), la cobertura alcanzada (8.4) y el proceso de ejecución y seguimiento de defectos (8.5).'),
    heading2('8.1. Estrategia de Pruebas'),
    para('Enfoque de pruebas de integración: en vez de una pirámide clásica con mayoría de pruebas unitarias aisladas, se prioriza probar las rutas HTTP reales contra una base de datos de prueba (Supertest + Jest), verificando el comportamiento observable de la API tal como lo consume el frontend.'),

    heading2('8.2. Tipos de Pruebas Realizadas'),
    bullet('Integración: 51 casos contra las rutas HTTP reales — autenticación (login/logout/sesión), CRUD completo de fotos JPL y Guarda Cuencas (crear, editar, eliminar, listar, validaciones), autocompletar desde iNaturalist (API externa mockeada), agregaciones estadísticas, publicación de JSON mensual, y el middleware de logging.'),
    bullet('Estático (SAST): ESLint-security y Semgrep, ver sección 7.3.'),
    bullet('Manual: validación de accesibilidad WCAG 2.1 AA con axe-core (equivalente a WAVE) en las 19 páginas públicas del sitio — 0 hallazgos, ver Chequeo de Lineamientos.'),

    heading2('8.3. Herramientas de Testing'),
    makeTable(
      ['Herramienta', 'Función'],
      [
        ['Jest', 'Framework de test runner y aserciones'],
        ['Supertest', 'Peticiones HTTP de integración contra las rutas Express reales'],
        ['jest-junit', 'Reporte en formato JUnit XML, listo para publicar en Azure DevOps'],
        ['axe-core (CLI)', 'Validación automatizada de accesibilidad WCAG 2.1 AA'],
      ],
      [2600, 6760]
    ),

    heading2('8.4. Cobertura de Pruebas'),
    makeTable(
      ['Métrica', 'Valor'],
      [
        ['Tests de integración', '51 (Jest + Supertest, contra las rutas HTTP reales)'],
        ['Cobertura de líneas', '98.62% (umbral configurado: 90%)'],
        ['Cobertura de funciones', '95.38% (umbral configurado: 90%)'],
        ['Alcance de la cobertura medida', 'routes/admin.js, middleware/, services/ — no incluye models/, utils/ ni scripts/'],
        ['Reporte de tests', 'JUnit XML (jest-junit), listo para publicar en Azure DevOps'],
      ],
      [3200, 6160]
    ),

    heading2('8.5. Proceso de Pruebas'),
    para('Las pruebas corren localmente antes de cada commit relevante (npm test), y correrán automáticamente en el pipeline de Azure DevOps (paso 5, sección 4.4) una vez activado por TI. Gestión de defectos: dado el tamaño del equipo, los defectos se registran y resuelven directamente como commits con mensaje fix: referenciando el problema — no hay todavía un tablero formal de bugs; al activarse Azure DevOps, los Bugs se gestionarán como Work Items según la Guía de Azure DevOps entregada por TI.'),

    // ── 9. MANUAL TÉCNICO (DESPLIEGUES Y OPERACIONES) ────────────────────
    heading1('9. Manual Técnico (Despliegues y Operaciones)'),
    para('Instrucciones para desplegar, iniciar, detener y monitorear la aplicación. El procedimiento completo, con cada comando, está en README.md (raíz del repositorio), sección "Despliegue en producción" — este apartado resume los puntos exigidos por la plantilla, incluyendo el rollback.'),

    heading2('9.1. Pre-requisitos'),
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
    bullet('Software requerido: Node.js 22 LTS, PM2, Nginx, Certbot, Redis (opcional) — ver README.md para comandos completos de instalación.'),

    heading2('9.2. Procedimiento de Despliegue en QA'),
    bullet('1. Push a la rama develop → el equipo de desarrollo actualiza el entorno de staging interno con los archivos estáticos más recientes.'),
    bullet('2. Backend: configurar backend/.env.qa a partir de .env.example, apuntando a la BD antioquia-biodiversa-qa.'),
    bullet('3. node src/scripts/seed_qa_data.js para poblar con datos sintéticos si es necesario.'),
    bullet('4. Levantar con node -e "require(\'dotenv\').config({path:\'.env.qa\'}); require(\'./src/index.js\')" (puerto 3001).'),

    heading2('9.3. Procedimiento de Despliegue en Producción'),
    bullet('1. Preparar el servidor: Node.js 22, PM2, Nginx, Certbot, Redis.'),
    bullet('2. Clonar el repositorio y configurar backend/.env a partir de .env.example, con los valores reales de producción.'),
    bullet('3. npm install --omit=dev.'),
    bullet('4. Iniciar con PM2: pm2 start src/index.js --name antioquia-natural.'),
    bullet('5. Configurar Nginx como proxy inverso y activar SSL con Certbot.'),
    bullet('6. Verificar: pm2 status, pm2 logs, y curl al endpoint /api/health (debe responder mongodb y redis conectados).'),
    para('Riesgos críticos: variables de entorno mal configuradas (la app no arranca o conecta a la BD equivocada), y certificado SSL no renovado automáticamente (Certbot debe configurarse con renovación automática vía cron/systemd timer).'),

    heading2('9.4. Procedimiento para Subir y Bajar la Aplicación'),
    code(
      'pm2 start src/index.js --name antioquia-natural   # iniciar\n' +
      'pm2 stop antioquia-natural                         # detener\n' +
      'pm2 restart antioquia-natural                      # reiniciar\n' +
      'pm2 logs antioquia-natural                         # ver logs en vivo'
    ),

    heading2('9.5. Procedimientos de Rollback'),
    para('Pasos para revertir a una versión anterior de la aplicación en caso de problemas durante o después del despliegue:'),
    bullet('1. Identificar el último commit estable en la rama main: git log --oneline -10.'),
    bullet('2. En el servidor, hacer checkout al commit/tag estable anterior: git checkout <hash-o-tag-anterior>.'),
    bullet('3. Reinstalar dependencias si package.json cambió entre versiones: npm install --omit=dev.'),
    bullet('4. Reiniciar el proceso: pm2 restart antioquia-natural.'),
    bullet('5. Verificar /api/health y las rutas críticas (login admin, carga de listado de especies) antes de dar por cerrado el rollback.'),
    bullet('6. Si el problema involucra un cambio de esquema en MongoDB (poco frecuente, dado que Mongoose no fuerza migraciones), restaurar según el protocolo de respaldos propio de TI Gobernación para bases de datos institucionales.'),
    bullet('7. Notificar a TI Gobernación y al líder funcional el rollback ejecutado, con la causa raíz identificada.'),
    para('Al estar servido por el mismo Nginx en el mismo servidor que el backend, el frontend se revierte automáticamente junto con el backend en el paso 2 (git checkout): no requiere un procedimiento de rollback independiente.'),

    heading2('9.6. Monitoreo y Logging'),
    para('Logs de Winston en formato JSON estructurado (nivel, módulo, timestamp, traceId por petición), almacenados en logs/ del servidor. Endpoint GET /api/health verifica el estado de MongoDB y Redis. Un stack adicional de monitoreo con Grafana fue evaluado y descartado por instrucción de TI Gobernación (no necesario): el monitoreo de la infraestructura se rige por las herramientas propias de TI sobre el servidor institucional.'),

    heading2('9.7. Procedimientos de Mantenimiento'),
    bullet('Actualización de dependencias: npm audit --audit-level=high antes de cada actualización mayor; npm outdated periódicamente.'),
    bullet('Backup de base de datos: se rige por el protocolo propio de TI Gobernación (instrucción explícita de no duplicar respaldos de MongoDB por fuera de dicho protocolo).'),
    bullet('Rotación de logs: gestionada por PM2 (pm2-logrotate) para evitar que los archivos de log crezcan sin límite.'),
    bullet('Renovación de certificado SSL: automática vía Certbot (cron/systemd timer), verificar manualmente cada 3 meses que la renovación esté funcionando.'),

    // ── 10. OTRAS COSAS TÉCNICAS ──────────────────────────────────────────
    heading1('10. Otras Cosas Técnicas (Diagramas de Flujo y Actividades)'),
    para('Flujo operativo de publicación mensual de las galerías Jóvenes pa\' Lante y Guarda Cuencas — el proceso que ejecuta el curador cada mes.'),
    ...image(path.join(DIAG_DIR, 'flujo_publicacion.png'), 1568, 2192, 'Figura 5. Flujo de publicación mensual de galerías JPL / Guarda Cuencas.'),

    // ── 11. ROADMAP TÉCNICO (OPCIONAL) ────────────────────────────────────
    heading1('11. Roadmap Técnico (Opcional)'),
    para('Plan a futuro de las evoluciones técnicas previstas para la aplicación, más allá del alcance ya implementado:'),
    bullet('Ítem B1 — Migración de autenticación admin a Microsoft Entra ID — pendiente de que TI Gobernación provea Client ID y Tenant ID (detallado como Ajuste 1 en la Propuesta de Ajustes Técnicos v2).'),
    bullet('Caché con Redis y SAST en pipeline de Azure DevOps — Ajustes 2 y 3 de la Propuesta de Ajustes Técnicos v2, pendientes de aprobación y de activación de infraestructura de TI.'),
    bullet('Migración del catálogo de Biodiversidad de JSON estático a una segunda base de datos MongoDB — documentado como plan en SCHEMA_DB.md, sin fecha definida.'),
    bullet('Activación del proyecto institucional en Azure DevOps por parte de TI, necesaria para que el pipeline de CI/CD (azure-pipelines.yml, ya escrito) corra automáticamente.'),
    bullet('Ampliación del catálogo de especies a 150+ registros con fotos y descripciones bilingües completas.'),

    // ── 12. APROBACIÓN Y FIRMAS ────────────────────────────────────────────
    heading1('12. Aprobación y Firmas'),
    para('Área destinada a la validación formal mediante firmas de los responsables de la aprobación, desarrollo y aprovechamiento del proyecto.'),
    spacer(),
    para('Por la Dirección TIC (Gobernación de Antioquia):'),
    para('Nombre: _________________________________'),
    para('Cargo: _________________________________'),
    para('Fecha: _________________________________'),
    spacer(),
    para('Por el líder funcional (Secretaría de Ambiente):'),
    para('Nombre: _________________________________'),
    para('Cargo: _________________________________'),
    para('Fecha: _________________________________'),
    spacer(),
    para('Por el desarrollo:'),
    para('Nombre: Sebastián Guzmán Díaz'),
    para('Cargo: Contratista — Desarrollo de Software'),
    para('Fecha: _________________________________'),

    // ── ANEXOS ─────────────────────────────────────────────────────────────
    heading1('Anexos'),
    para('Documentos técnicos relacionados, entregados por separado como parte del mismo trámite de aval:'),
    bullet('Levantamiento de Requisitos de Software y Propuesta Técnica — alcance funcional, roles, requerimientos funcionales y no funcionales.'),
    bullet('Propuesta de Ajustes Técnicos v2 — 3 ajustes de seguridad y rendimiento (Entra ID, Redis, SAST).'),
    bullet('Lista de Chequeo de Conformidad — verificación ítem por ítem contra la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación.'),
    bullet('README.md (raíz del repositorio) — manual de instalación y despliegue paso a paso, con todos los comandos.'),
    bullet('swagger.yaml (backend/src/) — especificación OpenAPI 3.0.3 de la API, navegable en /api/docs.'),
    bullet('Diccionario_Datos_BD_Comunidad_Antioquia_Natural.xlsx — diccionario de datos completo, una hoja por colección (ver sección 6.6).'),
    bullet('Respuesta_Observaciones_Revision_Documental_Antioquia_Natural.docx — respuesta punto por punto a los 26 hallazgos de la revisión documental de TI, con la sección donde se resolvió cada uno.'),
  ];

  return new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      headers: { default: headerInstitucional({ titulo: 'Documento Integral de Desarrollo Técnico de la Aplicación', codigo: 'FO-M7-P8-023' }) },
      footers: { default: footerConNumeracion() },
      children,
    }],
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const doc = buildDoc();
  const outFile = path.join(OUT_DIR, 'Documento_Integral_Desarrollo_Antioquia_Natural.docx');
  await Packer.toBuffer(doc).then(buf => fs.writeFileSync(outFile, buf));
  console.log(`✓ ${outFile}`);
}

main().catch(console.error);
