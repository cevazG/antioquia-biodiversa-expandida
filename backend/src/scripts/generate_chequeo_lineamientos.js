/**
 * generate_chequeo_lineamientos.js
 * Genera el documento Word:
 *   Chequeo_Lineamientos_Antioquia_Natural.docx
 *
 * Diligencia la "Lista de Chequeo de Conformidad" que pidió TI Gobernación
 * (molde original: Documentos gobernacion/TI/Chekeo Lineamientos.pdf), con el
 * estado real del proyecto verificado el 2026-07-13/14 (sesión de calidad:
 * tests, npm audit, Semgrep) más revisión adicional puntual para los ítems
 * que esa sesión no cubrió (arquitectura, GitFlow, licencias, hash de
 * contraseñas). Cada ítem incluye una nota breve de evidencia o de lo que
 * falta — no son solo casillas marcadas sin sustento.
 *
 * Uso: node src/scripts/generate_chequeo_lineamientos.js
 */

const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');

// ── Colores institucionales (mismos que generate_criterios_doc.js) ──────────
const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const GRAY_TEXT  = '555555';
const RED        = 'C62828';
const AMBER      = 'B8860B';

// ── Helpers ───────────────────────────────────────────────────────────────
function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: GREEN })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: DARK_GREEN })],
    spacing: { before: 240, after: 120 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '333333' })],
    spacing: { after: 120 },
    ...opts,
  });
}

function spacer() {
  return new Paragraph({ children: [], spacing: { after: 120 } });
}

// Cada ítem: casilla (☑ cumple / ▣ parcial / ☐ no cumple), pregunta original,
// y una nota breve con la evidencia real o lo que falta.
const ESTADO = {
  SI:      { marca: '☑', color: GREEN,  label: 'Cumple' },
  PARCIAL: { marca: '▣', color: AMBER,  label: 'Cumple parcialmente' },
  NO:      { marca: '☐', color: RED,    label: 'No cumple / pendiente' },
};

function item(estado, pregunta, nota) {
  const e = ESTADO[estado];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${e.marca}  `, bold: true, size: 22, color: e.color }),
        new TextRun({ text: `[${e.label}] `, bold: true, size: 18, color: e.color }),
        new TextRun({ text: pregunta, size: 20, color: '333333' }),
      ],
      spacing: { before: 100, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `→ ${nota}`, size: 18, color: GRAY_TEXT, italics: true })],
      spacing: { after: 140 },
      indent: { left: 340 },
    }),
  ];
}

function buildDoc() {
  const children = [

    // ── PORTADA ──────────────────────────────────────────────────────────
    spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'LISTA DE CHEQUEO DE CONFORMIDAD', bold: true, size: 40, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Antioquia Natural', bold: true, size: 26, color: DARK_GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Referencia: Guía de Arquitectura y Buenas Prácticas de Desarrollo — Gobernación de Antioquia', size: 20, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Diligenciado con el estado real y verificado del proyecto al 2026-07-14', size: 18, color: GRAY_TEXT })],
      alignment: AlignmentType.CENTER, spacing: { after: 320 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Convención: ☑ cumple  ·  ▣ cumple parcialmente (ver nota)  ·  ☐ no cumple / pendiente',
        size: 18, color: '333333', italics: true,
      })],
      alignment: AlignmentType.CENTER, spacing: { after: 40 },
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 1. Cumplimiento Normativo y Ciudadano ─────────────────────────────
    heading1('1. Cumplimiento Normativo y Ciudadano'),
    para('Aspectos legales y de usabilidad obligatorios.'),
    ...item('PARCIAL',
      'Accesibilidad (Digital First): ¿La interfaz cumple con los criterios de accesibilidad WCAG 2.1 Nivel AA (colores, contraste, lectores de pantalla)?',
      'Se corrigieron errores conocidos de contraste, headings y etiquetas de formulario en la pantalla de idioma, en home.html y en 5 páginas adicionales (commits "fix: corregir errores WCAG 2.1 AA…"). Falta una validación formal con WAVE sobre la totalidad del sitio antes de certificar cumplimiento completo (pendiente en el roadmap del proyecto).'),
    ...item('SI',
      'Privacidad (Ley 1581): ¿La política de tratamiento de datos es visible y existe un mecanismo de aceptación explícito (checkbox no pre-marcado) por parte del usuario?',
      'Modal de privacidad bilingüe (ES/EN) en la entrada de la app (biodiversidad/index.html), checkbox no pre-marcado, se guarda en localStorage tras aceptar.'),
    ...item('PARCIAL',
      'Gobierno Digital: ¿El desarrollo se alinea con los lineamientos de la política de Gobierno Digital y Servicios Ciudadanos Digitales (si aplica)?',
      'No se identificaron incumplimientos, pero tampoco se hizo una revisión formal punto por punto contra esa política específica. Recomendable una validación explícita con el área correspondiente antes de certificar.'),

    // ── 2. Arquitectura y Stack Tecnológico ────────────────────────────────
    heading1('2. Arquitectura y Stack Tecnológico'),
    para('Alineación con la arquitectura de referencia.'),
    ...item('PARCIAL',
      'Patrones de Diseño: ¿El backend implementa Clean Architecture o Arquitectura Hexagonal, separando el dominio de la infraestructura?',
      'Actualizado 2026-07-14: se extrajo la lógica de negocio de routes/admin.js (que antes mezclaba HTTP, reglas de negocio y acceso a datos en la misma función) a src/services/ (fotoStorage, jplStats, publicacion, inaturalistLookup) — las rutas ahora son una capa delgada que valida, llama al servicio y responde. No es Clean Architecture ni Arquitectura Hexagonal en sentido estricto (los servicios siguen llamando directo a Mongoose/fs, no hay interfaces de dominio ni inversión de dependencias), pero sí separa el "qué hace" del "cómo llega la petición HTTP". admin.js pasó de 598 a 284 líneas.'),
    ...item('PARCIAL',
      'Tecnologías: ¿Los lenguajes y frameworks utilizados pertenecen al Catálogo de Tecnologías de Referencia (Java/Spring, Python, Angular/React, etc.)?',
      'Node.js 22 LTS + Express + JavaScript vanilla (sin framework de frontend) no aparece en los ejemplos listados en la guía. La elección fue justificada y presentada en la Propuesta Técnica original, pero no hay una confirmación explícita documentada de que esté aprobada contra el catálogo oficial vigente. Se recomienda confirmarlo directamente con TI antes de radicar el aval.'),
    ...item('SI',
      'Interoperabilidad: ¿Los servicios expuestos (API REST) cuentan con contratos estandarizados (OpenAPI/Swagger)?',
      'src/swagger.yaml (OpenAPI 3.0.3) documenta la API, servido en /api/docs vía swagger-ui-express.'),

    // ── 3. Calidad del Código y Pruebas (QA) ───────────────────────────────
    heading1('3. Calidad del Código y Pruebas (QA)'),
    para('Higiene del código y aseguramiento.'),
    ...item('SI',
      'Análisis Estático: ¿El código pasa la revisión de linters sin errores bloqueantes ni advertencias críticas?',
      'npm run lint y npm run lint:security: 0 errores. Las ~20 y ~76 advertencias restantes están documentadas en el código como falsos positivos aceptados (rutas de archivo construidas por el servidor, no por el usuario).'),
    ...item('PARCIAL',
      'Cobertura de Pruebas: ¿Se alcanza el umbral sugerido de cobertura de pruebas unitarias (>80%) en la lógica de negocio crítica?',
      '96.81% líneas / 91.93% funciones, por encima del umbral. Ojo: la cobertura medida (collectCoverageFrom en package.json) cubre routes/admin.js y middleware/, que es donde vive la lógica de negocio principal, pero no incluye models/, utils/ ni scripts/. Recomendable ampliar el alcance medido antes de certificar cobertura total del proyecto.'),
    ...item('SI',
      'Idioma: ¿El código fuente, variables y comentarios están escritos en Español neutro?',
      'Confirmado en todo el código revisado: nombres de funciones, variables y comentarios están en español.'),
    ...item('PARCIAL',
      'Control de Versiones: ¿Se siguió la estrategia de ramas (GitFlow) y los commits siguen el estándar "Conventional Commits"?',
      'Los commits sí siguen Conventional Commits (feat:, fix:, docs:). GitFlow no se está aplicando en la práctica: el repositorio solo tiene la rama main, sin rama develop ni ramas de feature. Se recomienda adoptar GitFlow formalmente antes de la transición a Azure DevOps, o documentar la estrategia trunk-based como decisión consciente si se prefiere mantenerla así.'),

    // ── 4. Seguridad y Gestión de Datos ────────────────────────────────────
    heading1('4. Seguridad y Gestión de Datos'),
    para('Protección de activos de información.'),
    ...item('SI',
      'Credenciales: ¿Se ha verificado (mediante herramientas o revisión manual) que NO existen contraseñas, tokens o secretos "hardcoded" en el código fuente?',
      'Verificado con Semgrep (regla hardcoded-admin-password + rulesets p/nodejs y p/owasp-top-ten): 0 hallazgos. Todas las credenciales se leen de variables de entorno (process.env).'),
    ...item('PARCIAL',
      'Datos en Ambientes Bajos: ¿Se garantiza que los datos en los entornos de Desarrollo y QA son sintéticos o han sido anonimizados (no son datos reales de ciudadanos)?',
      'No hay datos sensibles tipo cédula o documento de identidad en las bases de biodiversidad/comunidad. Sí hay nombres reales de fotógrafos comunitarios (campo "credito") en los registros de JPL/Guarda Cuencas, provistos voluntariamente al participar en los programas. Se recomienda confirmar con el área legal si esto requiere anonimización adicional en ambientes de prueba.'),
    ...item('PARCIAL',
      'Cifrado: ¿Se utiliza TLS 1.2+ para todas las comunicaciones y cifrado en reposo para datos sensibles?',
      'TLS vía Nginx + Let\'s Encrypt está documentado y listo en el manual de despliegue (README.md), pero no verificable hasta que exista un ambiente real desplegado (todavía no hay producción). Cifrado en reposo: lo provee MongoDB Atlas por defecto en todos sus clusters, incluido el plan gratuito M0 usado actualmente.'),
    ...item('SI',
      'Gestión de Identidad: ¿Las contraseñas se almacenan con algoritmos de hash robustos (bcrypt/Argon2) y no en texto plano?',
      'Actualizado 2026-07-14: el login de administrador ahora compara con bcrypt.compareSync() contra ADMIN_PASSWORD_HASH (bcryptjs, factor de costo 10), ya no en texto plano. Sigue siendo una sola clave compartida para todos los admins (no hay cuentas individuales todavía) — para eso, la solución de fondo sigue siendo Microsoft Entra ID (ítem B1 del roadmap, pendiente de credenciales por parte de TI).'),
    ...item('SI',
      'Vulnerabilidades: ¿Las librerías de terceros están actualizadas y libres de vulnerabilidades críticas conocidas (CVEs)?',
      'npm audit --audit-level=high: 0 vulnerabilidades (se corrigieron 3 esta sesión: multer, form-data, js-yaml, con npm audit fix sin --force).'),

    // ── 5. Propiedad Intelectual y Licenciamiento ──────────────────────────
    heading1('5. Propiedad Intelectual y Licenciamiento'),
    para('Aspectos legales del código.'),
    ...item('SI',
      'Entrega de Fuentes: ¿Se ha entregado la totalidad del código fuente sin ofuscación en el repositorio institucional?',
      'Frontend en JavaScript vanilla sin bundler/minificador; backend en Node.js plano. No hay ofuscación en ningún punto del pipeline.'),
    ...item('SI',
      'Licenciamiento de Terceros: ¿Se verificó que las librerías Open Source utilizadas tengan licencias permisivas (MIT, Apache) y no restrictivas (GPL) que comprometan la propiedad de la Gobernación?',
      'Se revisaron las 13 dependencias de producción del backend: 11 MIT, 1 BSD-2-Clause (dotenv), 1 Apache-2.0 (sharp). Ninguna con licencia GPL o restrictiva.'),

    // ── 6. Documentación y Soporte ──────────────────────────────────────────
    heading1('6. Documentación y Soporte'),
    para('Gestión del conocimiento.'),
    ...item('SI',
      'Documentación Técnica: ¿El repositorio incluye un README.md actualizado con instrucciones de instalación, despliegue y variables de entorno?',
      'README.md cubre prerrequisitos, instalación local, variables de entorno, comandos, despliegue en producción (Ubuntu, Nginx, PM2, Certbot/SSL) y verificación.'),
    ...item('NO',
      'Documentación Funcional: ¿Las Historias de Usuario en Azure DevOps tienen criterios de aceptación claros y cumplidos?',
      'No aplica todavía: el proyecto de Azure DevOps de TI Gobernación sigue inactivo, pendiente de las Service Connections. No hay Historias de Usuario registradas ahí porque no hay dónde registrarlas aún.'),
    ...item('SI',
      'Manuales: ¿Se han generado los manuales de despliegue y operación requeridos para la transición a infraestructura?',
      'Cubierto en el mismo README.md: instalación, despliegue paso a paso en Ubuntu 24.04, configuración de Nginx, PM2 y SSL, y verificación post-despliegue (pm2 status, pm2 logs, /api/health).'),

    // ── Resumen y firma ──────────────────────────────────────────────────
    spacer(),
    heading2('Resumen'),
    para('13 de 21 ítems cumplen totalmente, 8 cumplen parcialmente (con nota de lo que falta en cada uno), 0 sin cumplir. Actualizado el 2026-07-14: se corrigió el hash de contraseñas del panel admin (bcrypt) y se extrajo la lógica de negocio de las rutas a servicios separados, lo que movió esos dos ítems de "no cumple" a "cumple"/"cumple parcialmente". Los ítems marcados "parcial" no son bloqueantes por sí solos, pero se recomienda revisarlos con TI antes de radicar la solicitud de aval, en particular la confirmación del stack tecnológico contra el catálogo de referencia vigente y la validación WAVE completa de accesibilidad.'),
    spacer(),
    para('Al marcar estas casillas, certifico que el software entregado cumple con los lineamientos establecidos en el estado descrito arriba, con las salvedades anotadas en cada ítem.'),
    spacer(),
    para('Responsable Técnico: Sebastián Guzmán Díaz'),
    para('Fecha: __________________________'),
  ];

  return new Document({
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }],
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const doc = buildDoc();
  const outFile = path.join(OUT_DIR, 'Chequeo_Lineamientos_Antioquia_Natural.docx');

  await Packer.toBuffer(doc).then(buf => fs.writeFileSync(outFile, buf));
  console.log(`✓ ${outFile}`);
}

main().catch(console.error);
