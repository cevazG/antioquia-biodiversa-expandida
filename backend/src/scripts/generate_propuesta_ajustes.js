/**
 * generate_propuesta_ajustes.js
 * Genera el documento Word:
 *   Propuesta_Ajustes_Tecnicos_v2_Antioquia_Natural.docx
 *
 * "Propuesta de Ajustes Técnicos v2" — reestructurada frente a la plantilla
 * institucional FO-M7-P8-021 (Propuesta Técnica y Financiera de Desarrollo
 * de Software), observación de la revisión documental del 28/07/2026.
 *
 * Contenido: 3 ajustes (Entra ID, Redis, SAST), reorganizados en los 10
 * numerales exactos de la plantilla. Los ajustes de Observabilidad (Grafana)
 * y Backup se retiraron en v2.2 por instrucción de TI Gobernación (ver
 * numeral 9, Control de Ajustes). La sección 6 (Propuesta Financiera)
 * queda con la estructura de tablas lista pero sin cifras — pendientes de
 * que el contratista las provea; no se inventan números.
 *
 * Uso: node src/scripts/generate_propuesta_ajustes.js
 */

const { Document, Packer } = require('docx');
const fs = require('fs');
const path = require('path');
const {
  heading1, heading2, para, nota, bullet, spacer, makeTable, image, scorecard,
  portada, tocSection, footerConNumeracion, headerInstitucional, PAGE_MARGIN_AJUSTES,
} = require('./lib/docx_helpers');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');
const DIAG_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Revision 2/diagramas');

function buildDoc() {
  const children = [

    ...portada({
      titulo: 'PROPUESTA DE AJUSTES TÉCNICOS',
      subtitulo: 'Versión 2, sobre la Propuesta Técnica inicial',
      version: '2.2',
      fecha: '2026-07-29',
    }),

    ...tocSection(),

    // ── ESTADO DE COMPLETITUD ─────────────────────────────────────────────
    heading1('Estado de Completitud del Documento'),
    scorecard('Completitud técnica (Ajustes 1-3): 100%  ·  Pendientes técnicos propios: 0  ·  Pendiente de TI Gobernación: 1  ·  Numeral 6 (Propuesta Financiera): sin costo adicional, incluido en el contrato de servicios vigente'),
    para('Este documento fue verificado ítem por ítem contra la plantilla institucional FO-M7-P8-021 (revisión del 28/07/2026). Los 3 ajustes técnicos (numerales 2 a 5) están completos, con su justificación, especificación y estado de implementación, y no dependen de terceros.'),
    nota('Versión 2.2 (29/07/2026): por instrucción de TI Gobernación se retiraron los ajustes de Observabilidad (monitoreo con Grafana, no necesario) y de Backup (la Gobernación tiene su propio protocolo de respaldos). Quedan 3 ajustes: Entra ID, Redis y SAST. Ver detalle en el numeral 9 (Control de Ajustes).'),
    nota('El único pendiente de TI Gobernación es el espejo del repositorio a Azure Repos institucional (tabla 2.2), que requiere que TI active el proyecto — el mismo pendiente ya descrito en el Documento Integral, no un hallazgo nuevo. El numeral 6 (Propuesta Financiera) no tiene cifras pendientes: los 3 ajustes están cubiertos por el contrato de prestación de servicios de 18 meses ya suscrito con la Secretaría de Ambiente, sin costo adicional a lo ya contratado.'),
    spacer(),

    // ── 1. INTRODUCCIÓN A LA SOLUCIÓN ────────────────────────────────────
    heading1('1. Introducción a la Solución'),
    para('El proyecto Antioquia Natural ya fue contratado por la Secretaría de Ambiente, mediante contrato de prestación de servicios por 18 meses (ejecución, desarrollo y mantenimiento). Este documento, junto con el Levantamiento de Requisitos de Software y el Documento Integral de Desarrollo, conforma el paquete técnico que se somete a la aprobación de TI Gobernación para dar inicio a la ejecución sobre la infraestructura institucional. No se trata de un cambio de alcance sobre un desarrollo ya en ejecución en el servidor de la Gobernación: la ejecución sobre dicha infraestructura todavía no ha podido comenzar en tanto TI Gobernación provee el servidor y demás elementos solicitados.'),
    para('Este documento actualiza y complementa la Propuesta Técnica inicial de Antioquia Natural (2026-06-24) con 3 ajustes puntuales, incorporando la retroalimentación de la revisión técnica de TI Gobernación. El stack base (Node.js, MongoDB, arquitectura modular) se mantiene sin cambios respecto de esa propuesta inicial, que no recibió objeciones técnicas en la primera revisión. Los 3 ajustes refuerzan específicamente seguridad y rendimiento, áreas donde la propuesta inicial quedó corta.'),
    para('Los 3 ajustes son: (1) autenticación con Microsoft Entra ID en reemplazo de un sistema propio, (2) caché con Redis para las consultas del panel de administración contra MongoDB, y (3) análisis estático de seguridad (SAST) integrado al pipeline de CI/CD.'),
    para('Nota de alcance: la versión anterior de esta propuesta incluía además un ajuste de observabilidad (monitoreo con Grafana) y uno de política de backup de MongoDB. Ambos se retiraron por instrucción de TI Gobernación: el monitoreo con Grafana no es necesario, y los respaldos de base de datos ya están cubiertos por el protocolo propio de la Gobernación. Detalle en el numeral 9 (Control de Ajustes).'),

    // ── 2. DETALLES TÉCNICOS ─────────────────────────────────────────────
    heading1('2. Detalles Técnicos'),
    heading2('2.1 Metodología de Desarrollo'),
    para('Metodología ágil adaptada a un equipo unipersonal: iteraciones cortas con entrega continua, sin ceremonias formales de Scrum dado el tamaño del equipo. Fases del ciclo: Análisis → Diseño → Desarrollo → Pruebas (QA) → Despliegue, repetidas por módulo/ajuste.'),
    bullet('Gestión de tareas: seguimiento vía GitHub (issues y commits referenciados), no se usa una herramienta de gestión de proyecto separada dado el tamaño del equipo. Una vez TI Gobernación active el proyecto institucional en Azure DevOps, los Work Items y Boards de Azure DevOps pasarán a ser la herramienta oficial de seguimiento.'),
    bullet('Control de versiones: GitFlow (main = producción estable, develop = integración, feature/nombre = desarrollos nuevos), con Conventional Commits (feat:, fix:, docs:).'),
    bullet('Entregables: incrementales, por ajuste/módulo completado, para revisión y retroalimentación de TI Gobernación.'),

    heading2('2.2 Stack Tecnológico'),
    para('Stack actualizado incluyendo los 3 ajustes de este documento:'),
    makeTable(
      ['Capa', 'Tecnología / Herramienta', 'Justificación Técnica'],
      [
        ['Frontend', 'HTML5 + CSS3 + JavaScript Vanilla', 'Sin dependencias de framework; app ligera, mobile-first, sin necesidad de SPA compleja'],
        ['Backend', 'Node.js 22 LTS + Express 4', 'Ya validado en la propuesta inicial; estabilidad y ecosistema maduro'],
        ['Base de Datos', 'MongoDB Atlas 7.x', 'Ya validado; esquema flexible adecuado para catálogos y fotografías con metadatos variables. Respaldo bajo el protocolo propio de TI Gobernación'],
        ['Autenticación (AJUSTE 1)', 'Microsoft Entra ID — OAuth 2.0 + OIDC (Authorization Code Flow + PKCE), @azure/msal-node + passport-azure-ad', 'Elimina contraseñas propias en la app; hereda MFA y revocación automática del tenant institucional'],
        ['Caché (AJUSTE 2)', 'Redis 7 + ioredis', 'Lecturas del panel de administración (meses, fotos y estadísticas de JPL/Guarda Cuencas) servidas desde memoria en vez de repetir la consulta a MongoDB en cada carga del panel'],
        ['SAST (AJUSTE 3)', 'ESLint-security + Semgrep (p/nodejs, p/owasp-top-ten) en pipeline Azure DevOps', 'Verifica OWASP Top 10 de forma automática y reproducible en cada push, no solo en revisión manual'],
        ['Repositorio', 'Git — GitHub (desarrollo), con espejo a Azure Repos institucional una vez TI active el proyecto (ver Estado de Completitud)', 'Control de versiones'],
      ],
      [2000, 3800, 3560]
    ),

    heading2('2.3 Detalle de los Ajustes Propuestos'),
    para('Cada ajuste se presenta con la misma estructura: situación actual, propuesta, justificación y especificación técnica.'),

    heading2('Ajuste 1 — Autenticación con Microsoft Entra ID'),
    para('Situación actual: express-session con bcrypt. Las contraseñas de los curadores quedaban guardadas en la misma base de datos de la aplicación, y el contratista era responsable de gestionar esa seguridad durante toda la garantía.'),
    para('Propuesta: que la autenticación del panel de administración la maneje Microsoft Entra ID (el Azure AD institucional de la Gobernación) en lugar de un sistema propio. El curador entraría con su cuenta corporativa de siempre, la misma que usa para el correo y Teams.'),
    para('Justificación: la Gobernación ya tiene Entra ID con todos sus funcionarios registrados, así que no tiene sentido montar un sistema de identidad paralelo que además el contratista tendría que mantener. Guardar contraseñas en la BD de la aplicación es uno de los vectores de ataque más comunes — si alguien compromete la base de datos, tiene acceso al panel; con Entra ID eso desaparece porque la app nunca toca una contraseña, solo valida el token que emite Microsoft. El MFA ya está activo para los funcionarios vía Microsoft Authenticator, y con Entra ID viene incluido sin implementarlo desde cero. Además, cuando un curador se va de la institución, TI desactiva su cuenta en Entra ID y automáticamente pierde acceso al panel, sin depender de que alguien recuerde borrarlo manualmente.'),
    makeTable(
      ['Qué', 'Cómo'],
      [
        ['Protocolo', 'OAuth 2.0 + OpenID Connect (OIDC)'],
        ['Flujo', 'Authorization Code Flow con PKCE'],
        ['Backend', '@azure/msal-node + passport-azure-ad'],
        ['Frontend panel', '@azure/msal-browser'],
        ['Sesión', 'JWT emitido por Entra ID — sin contraseñas en la app'],
        ['MFA', 'Heredado del tenant (Microsoft Authenticator)'],
        ['Roles', 'Curador.Biodiversidad, Curador.GuardaCuencas, Admin.Contenido — se definen en el tenant'],
      ],
      [2600, 6760]
    ),
    nota('Nota: la Gobernación debe registrar la app en su tenant de Entra ID antes de iniciar la Fase 0 del cronograma (sección 5). Se requiere el Client ID, el Tenant ID, y configurar los redirect_uri para cada ambiente (QA, Prod).'),

    heading2('Ajuste 2 — Caché con Redis'),
    para('Situación actual: cada vez que un curador abre el panel de administración para revisar los meses o las fotos de Jóvenes pa\' Lante o Guarda Cuencas, la app consulta MongoDB directamente. El catálogo público de especies, en cambio, no genera esta carga: se sirve como archivo JSON estático directamente al navegador, sin pasar por el backend ni por la base de datos.'),
    para('Propuesta: incorporar Redis 7 como capa de caché entre Express y MongoDB, usando la librería ioredis, para las consultas que sí llegan a la base de datos: los meses y fotos de JPL/Guarda Cuencas que el panel lee de las colecciones JplPhoto y GcPhoto, y las agregaciones de estadísticas (fotógrafos, municipios, alertas de conservación, bioindicadores) que hoy se recalculan en cada carga del panel.'),
    para('Justificación: las colecciones JplPhoto y GcPhoto crecen cada mes con las fotos que suben los curadores (proyectadas a ~4.800 documentos al final del programa), y las agregaciones de estadísticas recorren la colección completa en cada consulta. Sin caché, cada vez que un curador abre el panel — o que se recalculan las estadísticas de cobertura — se repite esa consulta completa contra MongoDB. Con Redis, la primera consulta llena el caché (TTLs entre 10 minutos y 24 horas según el recurso, ver tabla) y las siguientes responden desde memoria. El catálogo público de especies no participa de este mecanismo: al ser JSON estático servido directo al navegador, nunca genera una consulta que cachear. Redis corre en el mismo servidor Ubuntu en modo standalone, sin costo de infraestructura adicional.'),
    makeTable(
      ['Clave de caché', 'TTL', 'Se invalida cuando...'],
      [
        ['jpl:meses', '24 h', 'No se invalida activamente hoy — expira solo por TTL (ver nota)'],
        ['jpl:fotos:{mes}', '10 min', 'Se crea, edita, elimina o publica una foto de ese mes'],
        ['jpl:stats:analytics / jpl:stats:monthly', '1 h', 'Se crea, edita, elimina o publica cualquier foto JPL'],
        ['gc:meses', '24 h', 'No se invalida activamente hoy — expira solo por TTL (ver nota)'],
        ['gc:fotos:{mes}', '10 min', 'Se crea, edita, elimina o publica una foto de ese mes'],
      ],
      [3200, 1400, 4760]
    ),
    nota('Nota: jpl:meses y gc:meses no se invalidan de forma activa en las rutas de escritura (solo expiran por TTL) — si un curador sube la primera foto de un mes nuevo, ese mes puede tardar hasta 24 h en aparecer en el listado de meses del panel. Es una limitación conocida del mecanismo actual, no un error de esta propuesta.'),

    heading2('Ajuste 3 — SAST en el Pipeline de Azure DevOps'),
    para('Situación actual: el RNF05 pide cumplimiento OWASP Top 10, pero no había ningún mecanismo automatizado para verificarlo — quedaba en manos de la revisión manual del código.'),
    para('Propuesta: ESLint-security (detecta patrones peligrosos en Node.js/Express como eval con input de usuario, prototype pollution, path traversal) más Semgrep con las reglas p/nodejs y p/owasp-top-ten. Ambos corren en el pipeline de Azure DevOps en cada push, y el pipeline falla si hay algún hallazgo de severidad Alta o Crítica.'),
    para('Justificación: la revisión manual de código no es sistemática ni reproducible — una vulnerabilidad de inyección en un módulo de importación de Excel se puede colar fácilmente en una revisión de PR apurada. El costo también importa: corregir una vulnerabilidad en el mismo commit donde se introduce toma una hora; corregirla en producción implica un parche urgente, comunicación a la Gobernación y posiblemente una revisión del contrato. ESLint-security corre en segundos, sin agregar tiempo perceptible al pipeline, y Semgrep Community Edition es gratuito con soporte nativo para Node.js y OWASP.'),

    heading2('Resumen de impacto por requisito no funcional'),
    makeTable(
      ['Cambio', 'RNF que impacta', 'Qué mejora en concreto'],
      [
        ['Entra ID', 'RNF05, RNF08', 'Elimina credenciales en la app. MFA automático. Revocación inmediata al salir de la institución.'],
        ['Redis', 'RNF02, RNF06', 'Panel admin (JPL/GC) responde desde memoria. MongoDB libre para escrituras. RNF02 sostenible bajo uso simultáneo de varios curadores.'],
        ['SAST en pipeline', 'RNF05', 'OWASP Top 10 verificado en cada commit, no solo en revisión manual.'],
      ],
      [1800, 1600, 5960]
    ),

    // ── 3. ARQUITECTURA GENERAL ──────────────────────────────────────────
    heading1('3. Arquitectura General'),
    heading2('3.1 Diagrama de Arquitectura'),
    para('Arquitectura monolítica modular (mantenida de la propuesta inicial), con los 3 ajustes integrados en los puntos donde aportan valor: autenticación, capa de caché y pipeline de CI/CD.'),
    bullet('Patrón de diseño: separación rutas → servicios → modelos (routes/admin.js delega a services/, que usan models/ vía Mongoose).'),
    bullet('Comunicación: API RESTful bajo HTTPS.'),
    bullet('Seguridad: autenticación mediante OAuth 2.0/OIDC mediante Entra ID (AJUSTE 1); cifrado en tránsito (TLS 1.2+) y en reposo (por defecto en MongoDB Atlas).'),
    ...image(path.join(DIAG_DIR, 'ajustes_arquitectura.png'), 661, 1125, 'Figura 1. Arquitectura general con los 3 ajustes técnicos integrados.'),

    heading2('3.2 Requisitos de Despliegue'),
    para('Para la correcta ejecución del sistema en producción, se requiere:'),
    bullet('Servidor de Aplicaciones: Ubuntu Server 24.04 LTS, 4 vCPU, 16 GB RAM.'),
    bullet('Almacenamiento: 2 TB (fotografías del catálogo y de los programas comunitarios).'),
    bullet('Base de Datos: MongoDB Atlas (cluster ya provisionado, plan M0).'),
    bullet('Redis 7 en modo standalone, en el mismo servidor Ubuntu — sin costo de infraestructura adicional (AJUSTE 2).'),
    bullet('Dominio institucional y certificado SSL (Let\'s Encrypt / Certbot) — requeridos para acceso seguro.'),

    // ── 4. SOPORTE Y MANTENIMIENTO ────────────────────────────────────────
    heading1('4. Soporte y Mantenimiento'),
    heading2('4.1 Periodo de Garantía'),
    para('El proyecto se ejecuta mediante contrato de prestación de servicios por 18 meses entre el contratista y la Secretaría de Ambiente, que cubre ejecución, desarrollo y mantenimiento del desarrollo durante toda su vigencia. No aplica un periodo de garantía posterior a una entrega puntual, como en la venta de un producto: el soporte correctivo está incluido de forma continua mientras el contrato esté vigente.'),
    bullet('Cobertura: corrección de errores (bugs) imputables al código desarrollado, durante toda la vigencia del contrato.'),
    bullet('Exclusiones: fallos ocasionados por infraestructura de terceros o mal uso del sistema.'),

    heading2('4.2 Acuerdo de Nivel de Servicio (SLA)'),
    para('Compromiso de tiempos de respuesta y resolución durante la vigencia del contrato. El cumplimiento se verifica con los logs estructurados de Winston y el endpoint /api/health ya implementados, y con el protocolo de monitoreo propio de TI Gobernación sobre la infraestructura institucional:'),
    makeTable(
      ['Prioridad', 'Descripción', 'Tiempo de Respuesta', 'Tiempo de Resolución (Est.)'],
      [
        ['Crítica', 'Sistema caído o función principal bloqueada.', '< 4 horas', '< 24 horas'],
        ['Alta', 'Funcionalidad importante con fallos, existe workaround.', '< 24 horas', '2 - 3 días hábiles'],
        ['Media/Baja', 'Errores cosméticos o mejoras menores.', '< 48 horas', 'A convenir'],
      ],
      [1800, 3800, 1900, 1860]
    ),

    heading2('4.3 Mantenimiento Evolutivo'),
    para('Durante los 18 meses del contrato, el mantenimiento evolutivo incluido en la ejecución contratada se limita a ajustes menores dentro del alcance ya definido en el Levantamiento de Requisitos de Software y en los Ajustes 1 a 3 de este documento (por ejemplo: corrección de comportamiento, ajustes de textos o de flujo dentro de un módulo ya contemplado). No incluye módulos, funcionalidades o integraciones nuevas que no estén contempladas en dicho alcance: cualquier ampliación de alcance, ocurra en el mes 1 o en el mes 18 del contrato, requiere una ampliación contractual aparte, a convenir con la Secretaría de Ambiente. Al finalizar el contrato, cualquier soporte o desarrollo adicional se definirá mediante una nueva contratación.'),

    // ── 5. CRONOGRAMA DE EJECUCIÓN ────────────────────────────────────────
    heading1('5. Cronograma de Ejecución'),
    para('Secuencia de implementación de los 3 ajustes. Las duraciones son estimadas y están sujetas a la aprobación oportuna de cada entregable por parte de TI Gobernación — en particular, el AJUSTE 1 depende de que la Gobernación registre la aplicación en su tenant de Entra ID (Client ID y Tenant ID) antes de poder iniciar.'),
    makeTable(
      ['Fase / Módulo', 'Actividad Principal', 'Duración Estimada', 'Dependencia', 'Entregable'],
      [
        ['Fase 0', 'Registro de la app en el tenant de Entra ID de la Gobernación', '1 semana', 'Client ID y Tenant ID provistos por TI', 'App registrada, redirect_uri configurados (QA y Prod)'],
        ['Ajuste 1', 'Migración de autenticación a Microsoft Entra ID', '1-2 semanas', 'Fase 0 completa', 'Login del panel admin vía Entra ID en QA'],
        ['Ajuste 2', 'Integración de Redis como caché', '3-5 días', 'Ninguna', 'Catálogo de especies servido desde caché'],
        ['Ajuste 3', 'SAST en pipeline de Azure DevOps', '3-5 días', 'Activación del proyecto Azure DevOps por TI', 'Pipeline con ESLint-security + Semgrep bloqueante'],
      ],
      [1300, 2760, 1500, 1900, 1900]
    ),

    // ── 6. PROPUESTA FINANCIERA DEL PROYECTO ─────────────────────────────
    heading1('6. Propuesta Financiera del Proyecto'),
    para('Este capítulo presenta el marco financiero de los 3 ajustes técnicos descritos en este documento, en concordancia con el alcance definido en la sección 1.'),
    nota('El proyecto Antioquia Natural se ejecuta mediante contrato de prestación de servicios por 18 meses (ejecución, desarrollo y mantenimiento), ya suscrito entre el contratista y la Secretaría de Ambiente. Los 3 ajustes de este documento están dentro del alcance de desarrollo de dicho contrato: no representan un costo adicional al valor ya contratado.'),

    heading2('6.1 Estimación de costos del desarrollo'),
    makeTable(
      ['Concepto', 'Descripción', 'Costo adicional'],
      [
        ['Ajuste 1 — Entra ID', 'Migración de autenticación', 'Incluido en el contrato de servicios vigente'],
        ['Ajuste 2 — Redis', 'Integración de caché', 'Incluido en el contrato de servicios vigente'],
        ['Ajuste 3 — SAST', 'Integración al pipeline CI/CD', 'Incluido en el contrato de servicios vigente'],
      ],
      [2500, 3800, 2860]
    ),
    para('Desglose por fase del ciclo de desarrollo, cubierto en su totalidad por el contrato de prestación de servicios de 18 meses ya suscrito con la Secretaría de Ambiente:'),
    makeTable(
      ['Concepto', 'Descripción', 'Unidad', 'Cantidad', 'Valor Unitario', 'Valor Total'],
      [
        ['Análisis y diseño', 'Levantamiento y estructuración de la solución', 'Global', '1', 'Incluido en el contrato de servicios vigente', 'Incluido en el contrato de servicios vigente'],
        ['Desarrollo', 'Construcción de funcionalidades', 'Global', '1', 'Incluido en el contrato de servicios vigente', 'Incluido en el contrato de servicios vigente'],
        ['Pruebas', 'Validación funcional y técnica', 'Global', '1', 'Incluido en el contrato de servicios vigente', 'Incluido en el contrato de servicios vigente'],
        ['Despliegue', 'Implementación en producción', 'Global', '1', 'Incluido en el contrato de servicios vigente', 'Incluido en el contrato de servicios vigente'],
        ['Capacitación', 'Transferencia de conocimiento', 'Global', '1', 'Incluido en el contrato de servicios vigente', 'Incluido en el contrato de servicios vigente'],
      ],
      [1600, 3000, 1000, 900, 1930, 1930]
    ),
    heading2('6.2 Costos de infraestructura (si aplica)'),
    makeTable(
      ['Concepto', 'Tipo (Nube / On-Premise)', 'Descripción', 'Periodicidad', 'Valor'],
      [
        ['Redis 7', 'On-Premise (mismo servidor Ubuntu)', 'Sin costo adicional — corre junto al backend', 'N/A', '$0'],
      ],
      [1800, 2400, 3000, 1200, 960]
    ),
    nota('El respaldo de la base de datos MongoDB no se incluye como costo de este proyecto: se rige por el protocolo de respaldos propio de TI Gobernación.'),
    heading2('6.3 Costos de soporte y mantenimiento'),
    makeTable(
      ['Concepto', 'Descripción', 'Costo adicional'],
      [
        ['Soporte correctivo', 'Corrección de errores durante la vigencia del contrato', 'Incluido en el contrato de servicios vigente'],
        ['Mantenimiento evolutivo', 'Nuevas funcionalidades menores durante la vigencia del contrato', 'Incluido en el contrato de servicios vigente'],
      ],
      [2500, 4160, 2700]
    ),
    heading2('6.4 Forma de pago (si aplica)'),
    para('La forma de pago de estos 3 ajustes se rige por el contrato de prestación de servicios de 18 meses ya suscrito con la Secretaría de Ambiente: no aplican hitos de pago independientes asociados específicamente a este documento de ajustes.'),

    // ── 7. DICCIONARIO DE DEFINICIONES Y ACRÓNIMOS ───────────────────────
    heading1('7. Diccionario de Definiciones y Acrónimos'),
    makeTable(
      ['Término', 'Definición'],
      [
        ['SAST', 'Static Application Security Testing — análisis estático de seguridad sobre el código fuente, sin ejecutarlo.'],
        ['MFA', 'Multi-Factor Authentication — autenticación con más de un factor (ej. contraseña + app de autenticación).'],
        ['OIDC', 'OpenID Connect — capa de identidad construida sobre OAuth 2.0, usada por Entra ID.'],
        ['OAuth 2.0', 'Estándar abierto de autorización delegada.'],
        ['PKCE', 'Proof Key for Code Exchange — extensión de OAuth 2.0 que protege el flujo de autorización contra interceptación.'],
        ['JWT', 'JSON Web Token — formato estándar de token firmado usado para transmitir la sesión autenticada.'],
        ['MSAL', 'Microsoft Authentication Library — librería oficial de Microsoft para integrar Entra ID.'],
        ['TTL', 'Time To Live — tiempo que un dato permanece válido en caché antes de expirar.'],
        ['SLA', 'Service Level Agreement — acuerdo de nivel de servicio (tiempos de respuesta y resolución).'],
        ['CVE', 'Common Vulnerabilities and Exposures — identificador estándar de vulnerabilidades conocidas.'],
        ['OWASP', 'Open Web Application Security Project — organización que publica el listado "Top 10" de riesgos de seguridad web.'],
      ],
      [2000, 7360]
    ),

    // ── 8. COMPROMISOS ────────────────────────────────────────────────────
    heading1('8. Compromisos'),
    bullet('Propiedad Intelectual: los derechos patrimoniales sobre el software desarrollado, incluidos los 3 ajustes de este documento, son de la Gobernación de Antioquia, en cumplimiento de la sección 1.4 de la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la entidad. El contratista conserva sus derechos morales como autor del desarrollo.'),
    bullet('Confidencialidad: toda la información compartida durante el desarrollo será tratada bajo estricta confidencialidad.'),
    bullet('Cumplimiento normativo — Ley 1581 (Habeas Data): el AJUSTE 1 (Entra ID) cambia el modelo de custodia de identidades de los curadores — la aplicación deja de almacenar contraseñas y delega la autenticación al tenant institucional de la Gobernación. Esto refuerza, no debilita, el cumplimiento de la Ley 1581: menos datos sensibles bajo responsabilidad directa del contratista, y trazabilidad de accesos gestionada centralmente por TI.'),
    bullet('El desarrollo se apegará a los lineamientos de seguridad y buenas prácticas de codificación de la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación de Antioquia.'),

    // ── 9. CONTROL DE AJUSTES ─────────────────────────────────────────────
    heading1('9. Control de Ajustes'),
    para('Registro de versiones de la propuesta técnica y de este documento de ajustes.'),
    makeTable(
      ['Versión', 'Fecha', 'Descripción del Cambio', 'Responsable'],
      [
        ['1.0', '2026-06-24', 'Propuesta Técnica inicial: stack Node.js/MongoDB, arquitectura modular, alcance funcional de los módulos Biodiversidad, Agua y Comunidad.', 'Sebastián Guzmán Díaz'],
        ['2.0', '2026-06-24', 'Propuesta de Ajustes Técnicos: 5 cambios (Entra ID, Redis, Observabilidad, SAST, Backup) en respuesta a observaciones de TI Gobernación sobre seguridad, monitoreo y continuidad de datos.', 'Sebastián Guzmán Díaz'],
        ['2.1', '2026-07-28', 'Reestructuración documental conforme a la plantilla institucional FO-M7-P8-021: portada, tabla de contenido, propuesta financiera, control de ajustes, diccionario de acrónimos, compromisos y bloque de firmas.', 'Sebastián Guzmán Díaz'],
        ['2.2', '2026-07-29', 'Por instrucción de TI Gobernación (Miguel Pérez): se retira el Ajuste de Observabilidad (monitoreo con Grafana, no necesario) y el Ajuste de Backup (la Gobernación tiene su propio protocolo de respaldos de MongoDB). Quedan 3 ajustes: Entra ID, Redis y SAST, renumerados en consecuencia.', 'Sebastián Guzmán Díaz'],
      ],
      [1200, 1600, 5560, 1000]
    ),

    // ── 10. APROBACIÓN Y FIRMAS ───────────────────────────────────────────
    heading1('10. Aprobación y Firmas'),
    para('Al firmar este documento, las partes aceptan el alcance técnico, la metodología y los tiempos propuestos para los 3 ajustes descritos.'),
    spacer(),
    para('Por el Cliente (Gobernación de Antioquia):'),
    para('Nombre: _________________________________'),
    para('Cargo: _________________________________'),
    para('Fecha: _________________________________'),
    spacer(),
    para('Por el Proveedor de Desarrollo:'),
    para('Nombre: Sebastián Guzmán Díaz'),
    para('Cargo: Contratista — Desarrollo de Software'),
    para('Fecha: _________________________________'),
  ];

  return new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN_AJUSTES } },
      headers: { default: headerInstitucional({ titulo: 'Propuesta Técnica y Financiera de Desarrollo de Software', codigo: 'FO-M7-P8-021' }) },
      footers: { default: footerConNumeracion() },
      children,
    }],
  });
}

async function main() {
  const doc = buildDoc();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'Propuesta_Ajustes_Tecnicos_v2_Antioquia_Natural.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('✓', outPath);
}

main();
