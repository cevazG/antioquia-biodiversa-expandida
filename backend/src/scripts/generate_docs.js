/**
 * generate_docs.js
 * Genera los dos documentos Word para la Gobernación de Antioquia:
 *   1. Levantamiento_Requisitos_Antioquia_Biodiversa.docx
 *   2. Propuesta_Tecnica_Antioquia_Biodiversa.docx
 *
 * Uso: node src/scripts/generate_docs.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  UnderlineType, PageBreak, TabStopType, TabStopPosition,
  convertInchesToTwip, Header, Footer, PageNumber, NumberFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI');

// ── Colores institucionales ───────────────────────────────────────────────────
const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const WHITE      = 'FFFFFF';
const LIGHT_GREEN= 'E8F5E9';
const TABLE_HDR  = '018D38';
const TABLE_ALT  = 'F0FFF4';
const GRAY_TEXT  = '555555';
const PENDING    = 'CC0000';

// ── Helpers ───────────────────────────────────────────────────────────────────

const border = (color = 'CCCCCC', sz = 4) => ({
  top:    { style: BorderStyle.SINGLE, size: sz, color },
  bottom: { style: BorderStyle.SINGLE, size: sz, color },
  left:   { style: BorderStyle.SINGLE, size: sz, color },
  right:  { style: BorderStyle.SINGLE, size: sz, color },
});

const noBorder = () => ({
  top:    { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left:   { style: BorderStyle.NONE },
  right:  { style: BorderStyle.NONE },
});

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: GREEN })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } }
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: DARK_GREEN })],
    spacing: { before: 240, after: 120 }
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: DARK_GREEN })],
    spacing: { before: 200, after: 80 }
  });
}

function para(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [new TextRun({ text: children, size: 20, color: '333333' })];
  return new Paragraph({ children: runs, spacing: { after: 120 }, ...opts });
}

function bullet(text, level = 0) {
  const runs = [];
  const parts = text.split('**');
  parts.forEach((p, i) => {
    runs.push(new TextRun({ text: p, bold: i % 2 === 1, size: 20, color: '333333' }));
  });
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { after: 80 }
  });
}

function pending(text) {
  return new TextRun({ text, color: PENDING, italics: true, size: 20 });
}

function bold(text, color = '333333') {
  return new TextRun({ text, bold: true, size: 20, color });
}

function normal(text, color = '333333') {
  return new TextRun({ text, size: 20, color });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer() {
  return new Paragraph({ children: [], spacing: { after: 120 } });
}

// ── Tabla genérica ────────────────────────────────────────────────────────────

function makeTable(headers, rows, colWidths) {
  const totalWidth = 9360;
  const widths = colWidths || headers.map(() => Math.floor(totalWidth / headers.length));

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HDR },
      borders: border(TABLE_HDR),
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 }
      })]
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => {
      const isPending = typeof cell === 'string' && cell.startsWith('[PENDIENTE');
      const cellRuns = typeof cell === 'string'
        ? [new TextRun({ text: cell, size: 18, color: isPending ? PENDING : '333333', italics: isPending })]
        : cell;
      return new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? 'FFFFFF' : TABLE_ALT },
        borders: border(),
        children: [new Paragraph({
          children: cellRuns,
          spacing: { before: 80, after: 80 },
          alignment: ci === 0 ? AlignmentType.CENTER : AlignmentType.LEFT
        })]
      });
    })
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    borders: border()
  });
}

// ── DOCUMENTO 1: Levantamiento de Requisitos ──────────────────────────────────

function buildLevantamiento() {
  const children = [

    // Portada
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'LEVANTAMIENTO DE REQUISITOS DE SOFTWARE', bold: true, size: 44, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Y PROPUESTA TÉCNICA', bold: true, size: 44, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Antioquia Biodiversa', size: 28, color: DARK_GREEN })],
      alignment: AlignmentType.RIGHT, spacing: { after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Puesta en producción de la aplicación web mobile-first para la exploración', size: 20, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.RIGHT, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'de la biodiversidad, recursos hídricos y programas comunitarios de Antioquia.', size: 20, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.RIGHT, spacing: { after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Sebastián Guzmán Díaz', size: 20, color: '333333' })],
      alignment: AlignmentType.RIGHT, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'sguzmand@gmail.com  |  3006552511', size: 20, color: GRAY_TEXT })],
      alignment: AlignmentType.RIGHT, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Gobernación de Antioquia - Secretaría de Ambiente', size: 20, color: GRAY_TEXT })],
      alignment: AlignmentType.RIGHT, spacing: { after: 80 }
    }),

    pageBreak(),

    // ── 1. Introducción ──────────────────────────────────────────────────────
    heading1('1.  Introducción'),
    heading2('1.1.  Propósito'),
    para([
      normal('El propósito de este proyecto es llevar a producción la aplicación web '),
      bold('"Antioquia Biodiversa"'),
      normal(', desarrollada para la Gobernación de Antioquia, que permita a los ciudadanos explorar la biodiversidad del departamento (flora y fauna por subregión y grupo taxonómico), los recursos hídricos y los programas comunitarios, en español e inglés, desde cualquier dispositivo móvil mediante código QR, sin necesidad de instalación.')
    ]),
    spacer(),
    makeTable(
      ['Campo', 'Información'],
      [
        ['Nombre del sistema', 'Antioquia Biodiversa'],
        ['Administrador del sistema', 'Secretaría de Ambiente - Gobernación de Antioquia'],
        ['Dependencia responsable', 'Dirección de Agua y Saneamiento'],
        ['Líder funcional Gobernación', '[PENDIENTE - nombre del responsable]'],
        ['Contratista', 'Sebastián Guzmán Díaz'],
        ['Correo contratista', 'sguzmand@gmail.com'],
        ['Teléfono contratista', '3006552511'],
      ],
      [3000, 6360]
    ),
    spacer(),

    heading2('1.2.  Alcance'),
    para([bold('Incluido en este contrato:')]),
    bullet('Despliegue de la aplicación en infraestructura provista por la Gobernación de Antioquia'),
    bullet('Módulo Biodiversidad: catálogo de especies insignia con galería fotográfica, mapa SVG interactivo de 9 subregiones, búsqueda en tiempo real y ficha con categoría IUCN'),
    bullet('Módulo Agua: exploración de fuentes hídricas y cuencas abastecedoras por subregión'),
    bullet('Módulo Comunidad - Jóvenes pa\' Lante: información del programa con mapa interactivo de 90 municipios beneficiados'),
    bullet('Módulo Comunidad - Especie del Mes: especie destacada mensual con galería de avistamientos ciudadanos'),
    bullet('Galería fotográfica Jóvenes pa\' Lante (JPL): 50 fotografías de biodiversidad por mes, con filtros por grupo taxonómico, subregión y mes, y archivo histórico. Crecimiento proyectado: ~4.000 registros al final del programa'),
    bullet('Galería fotográfica Guarda Cuencas: 10 fotografías de cuencas hídricas por mes en formato 16:9, con filtros por cuenca, subregión y mes, y archivo histórico. Crecimiento proyectado: ~800 registros al final del programa'),
    bullet('Panel de administración web para curadores: autenticación con sesión, CRUD completo de fotografías JPL y Guarda Cuencas, publicación de archivos JSON mensuales y optimización automática de imágenes a WebP'),
    bullet('API REST documentada (Swagger/OpenAPI) para consulta del catálogo de biodiversidad'),
    bullet('Base de datos MongoDB con catálogo de 150 especies de flora y fauna (9 grupos taxonómicos)'),
    bullet('Herramienta de importación masiva de especies mediante plantilla Excel'),
    bullet('Interfaz bilingüe español/inglés en todos los módulos'),
    bullet('Configuración de servidor, dominio, HTTPS y entorno de producción'),
    spacer(),
    para([bold('No incluido en este contrato:')]),
    bullet('Integración con ArcGIS o Survey123'),
    bullet('Autenticación de usuarios ciudadanos (login público)'),
    bullet('Aplicación nativa móvil (iOS/Android)'),
    bullet('Módulos adicionales no descritos en este documento'),
    spacer(),

    // ── 2. Descripción General ───────────────────────────────────────────────
    heading1('2.  Descripción General'),
    para([
      normal('Antioquia Biodiversa centraliza en un único canal digital la información sobre la riqueza natural del departamento y sus programas sociales asociados. La aplicación permite a visitantes, estudiantes, investigadores y ciudadanos consultar especies de flora y fauna representativas, explorar la red hídrica y conocer los programas Jóvenes pa\' Lante y Guarda Cuencas, sin requerir instalación ni registro previo.'),
    ]),
    para([
      bold('Impacto esperado: '),
      normal('mayor visibilidad de la biodiversidad del departamento, acceso ciudadano a información actualizada sobre programas sociales y posicionamiento digital de la Gobernación de Antioquia como entidad innovadora en divulgación ambiental.')
    ]),
    spacer(),

    // ── 3. Análisis del Requerimiento ────────────────────────────────────────
    heading1('3.  Análisis del Requerimiento de Software'),
    heading2('3.1.  Descripción General del Producto'),
    para('Los requerimientos fueron identificados con el equipo de la Secretaría de Ambiente de la Gobernación de Antioquia, a partir de la necesidad de contar con un canal digital moderno, accesible vía código QR, que divulgue la biodiversidad insignia del departamento y los programas comunitarios asociados, con soporte bilingüe y optimizado para dispositivos móviles.'),
    spacer(),

    heading2('3.2.  Módulos Nuevos Identificados'),
    makeTable(
      ['Módulo', 'Descripción'],
      [
        ['Biodiversidad', 'Catálogo de especies de flora y fauna por subregión y grupo taxonómico, con galería fotográfica y ficha detallada (nombre científico, IUCN, distribución, descripción bilingüe)'],
        ['Agua', 'Exploración de la red hídrica: fuentes hídricas y cuencas abastecedoras por subregión'],
        ['Comunidad - Jóvenes pa\' Lante', 'Información del programa de formación superior y mapa interactivo con 90 municipios beneficiados filtrable por subregión'],
        ['Comunidad - Especie del Mes', 'Especie destacada mensual seleccionada por el equipo editorial, con galería de avistamientos ciudadanos e historial'],
        ['Galería JPL - Jóvenes pa\' Lante', '50 fotografías de biodiversidad por mes subidas por el curador. Filtros por grupo taxonómico, subregión y mes. Ficha de especie con nombre científico, categoría IUCN y descripción bilingüe. Archivo histórico de galerías anteriores.'],
        ['Galería Guarda Cuencas', '10 fotografías de cuencas hídricas por mes en formato 16:9. Filtros por cuenca, subregión y mes. Archivo histórico de galerías anteriores.'],
        ['Panel de Administración Curadores', 'Panel web con autenticación por sesión para curadores. CRUD completo de fotografías JPL y Guarda Cuencas. Publicación de archivos JSON mensuales. Optimización automática de imágenes a WebP mediante librería sharp.'],
        ['API REST', 'Capa de servicios para el consumo de datos del catálogo desde el frontend'],
        ['Base de Datos', 'Dos bases de datos MongoDB en el mismo cluster Atlas: (1) BD Biodiversidad — catálogo estático de 150 especies de flora y fauna, 9 grupos taxonómicos, 9 subregiones; (2) BD Comunidad — registros del programa JPL (50 fotos/mes, ~4.000 registros al final del programa) y Guarda Cuencas (10 fotos/mes, ~800 registros)'],
      ],
      [2600, 6760]
    ),
    spacer(),

    heading2('3.3.  Roles Identificados'),
    makeTable(
      ['Rol', 'Descripción'],
      [
        ['Visitante / Ciudadano', 'Acceso de lectura a todos los módulos públicos. Sin autenticación requerida.'],
        ['Curador de Contenido', 'Funcionario o contratista de la Secretaría de Ambiente. Accede al panel de administración web con usuario y contraseña. Carga, edita y publica las fotografías JPL y Guarda Cuencas mensualmente.'],
        ['Administrador de Contenido', 'Personal de la Secretaría de Ambiente. Actualiza el catálogo de especies y la Especie del Mes mediante plantilla Excel e importación directa a la base de datos.'],
      ],
      [3000, 6360]
    ),
    spacer(),

    heading2('3.4.  Módulos Afectados'),
    para('Esta es la primera puesta en producción del aplicativo. El prototipo funcional desarrollado previamente sirve como base de diseño y experiencia de usuario validada; el presente contrato formaliza su despliegue en infraestructura institucional de la Gobernación de Antioquia.'),
    spacer(),

    heading2('3.5.  Requisitos del Sistema'),
    bullet('Servidor: Ubuntu Server 24.04 LTS - 4 vCPU, 16 GB RAM, 2 TB almacenamiento'),
    bullet('Software: Node.js 22 LTS, MongoDB 7.x, PM2, Nginx, Certbot / Let\'s Encrypt'),
    bullet('Dominio institucional con certificado SSL activo'),
    bullet('IP pública con acceso a internet'),
    spacer(),

    // ── 4. Requerimientos Funcionales ────────────────────────────────────────
    pageBreak(),
    heading1('4.  Requerimientos Funcionales'),
    heading2('4.1.  Detalle por módulo'),
    makeTable(
      ['Código', 'Propósito', 'Descripción', 'Entrada', 'Salida', 'Comentarios'],
      [
        ['RQP01', 'Exploración por subregión', 'El sistema permite seleccionar una de las 9 subregiones mediante mapa SVG interactivo', 'Toque o clic sobre el mapa', 'Grupos de biodiversidad disponibles con conteo de especies', '-'],
        ['RQP02', 'Exploración por grupo taxonómico', 'El sistema filtra especies por los 9 grupos taxonómicos (Aves, Anfibios y Reptiles, Mariposas, Polillas, Mamíferos, Animales Domésticos, Peces de Agua Dulce, Orquídeas, Árboles Nativos) y por reino (Flora / Fauna)', 'Selección de grupo o reino', 'Listado de familias y especies en acordeón', '-'],
        ['RQP03', 'Búsqueda de especies', 'El sistema implementa búsqueda en tiempo real por nombre científico y nombre común (ES/EN)', 'Texto ingresado por el usuario', 'Resultados filtrados en < 300 ms', '-'],
        ['RQP04', 'Ficha de especie', 'El sistema muestra galería fotográfica, nombre científico, categoría IUCN, subregiones de distribución y descripción bilingüe', 'ID de especie', 'Pantalla completa con todos los datos de la especie', '-'],
        ['RQP05', 'Bilingüismo ES/EN', 'El sistema cambia toda la interfaz entre español e inglés sin recargar la página', 'Toggle de idioma', 'Todos los textos de UI y descripciones en el idioma seleccionado', 'Preferencia guardada entre sesiones'],
        ['RQP06', 'Red hídrica por subregión', 'El sistema presenta fuentes hídricas y cuencas abastecedoras filtradas por subregión y tipo de recurso', 'Selección de subregión y tipo', 'Mapa y listado de ríos, cuencas y municipios abastecidos', '-'],
        ['RQP07', 'Programa Jóvenes pa\' Lante', 'El sistema presenta descripción del programa y mapa con los 90 municipios beneficiados, filtrable por subregión', 'Selección de subregión (opcional)', 'Información del programa y municipios en mapa interactivo Leaflet', '-'],
        ['RQP08', 'Especie del Mes', 'El sistema presenta la especie destacada del mes con descripción, galería y canal para envío de fotos comunitarias', 'Ninguna (carga automática)', 'Ficha de la especie del mes con historial', 'Actualizable por el administrador'],
        ['RQP09', 'API REST de consulta', 'El sistema expone endpoints documentados para consulta de especies, familias, grupos y subregiones', 'Petición HTTP GET con parámetros', 'Respuesta JSON con datos de biodiversidad', 'Documentada con Swagger/OpenAPI. Diseño API First.'],
        ['RQP10', 'Importación masiva de especies', 'El administrador carga nuevas especies mediante plantilla Excel estructurada', 'Archivo Excel diligenciado', 'Especies registradas en BD con reporte de resultados', '-'],
        ['RQP11', 'Despliegue en producción', 'La aplicación opera en el servidor de la Gobernación bajo dominio institucional con HTTPS', 'Configuración de servidor', 'Aplicación accesible al público', '-'],
        ['RQP12', 'Galería fotográfica JPL', 'El sistema presenta 50 fotografías de biodiversidad por mes subidas por el curador, con filtros por grupo taxonómico, subregión y mes, y archivo de galerías anteriores', 'Selección de filtros por el visitante', 'Galería filtrada con fichas de especie (nombre científico, IUCN, descripción bilingüe)', 'Imágenes almacenadas en WebP, optimizadas automáticamente en el servidor'],
        ['RQP13', 'Galería fotográfica Guarda Cuencas', 'El sistema presenta 10 fotografías de cuencas hídricas por mes en formato 16:9, con filtros por cuenca, subregión y mes, y archivo histórico', 'Selección de filtros por el visitante', 'Galería filtrada con fichas de foto (cuenca, municipio, descripción bilingüe)', '-'],
        ['RQP14', 'Panel de administración curadores', 'El sistema provee un panel web protegido con autenticación por sesión que permite al curador cargar, editar y eliminar fotografías JPL y Guarda Cuencas, y publicar el JSON mensual', 'Credenciales del curador (usuario/contraseña), archivos de imagen (JPG/PNG/WebP)', 'Fotografías publicadas en la galería; imágenes optimizadas a WebP (máx. 1200 px, q82) automáticamente', 'Contraseñas almacenadas con hash bcrypt. Sesión gestionada con express-session.'],
      ],
      [900, 1500, 2200, 1400, 1700, 1200]
    ),
    spacer(),

    // ── 5. Requerimientos No Funcionales ────────────────────────────────────
    heading1('5.  Requerimientos No Funcionales'),
    makeTable(
      ['Código', 'Nombre', 'Descripción', 'Comentarios'],
      [
        ['RNF01', 'Mobile-First / Responsive', 'La interfaz debe ser funcional y visualmente correcta en dispositivos de 375 px a 1440 px de ancho', 'Optimizado para iPhone estándar (375-430 px)'],
        ['RNF02', 'Rendimiento', 'Tiempo de carga inicial < 3 segundos en conexión 4G estándar. Imágenes servidas en formato WebP.', '-'],
        ['RNF03', 'Identidad Visual Institucional', 'Aplicación del Manual de Identidad Visual de la Gobernación de Antioquia: colores oficiales, tipografía Poppins, logo del Escudo de Armas', '-'],
        ['RNF04', 'Accesibilidad', 'Cumplimiento WCAG 2.1 nivel AA: contraste mínimo 4.5:1, textos alternativos en imágenes. Validación con herramienta WAVE. (Res. 1519 de 2020)', '-'],
        ['RNF05', 'Seguridad', 'Protección OWASP Top 10. HTTPS obligatorio. TLS 1.2 mínimo. Contraseñas del panel de curadores almacenadas con hash bcrypt (prohibido texto plano). Cumplimiento Ley 1581 (Habeas Data).', '-'],
        ['RNF06', 'Disponibilidad', '99% de tiempo de operación mensual', '-'],
        ['RNF07', 'Mantenibilidad', 'Código y comentarios en español (neutro). GitFlow (ramas main/develop). Conventional Commits (feat:, fix:, docs:). Clean Architecture en el backend. Licencias OSS compatibles con uso institucional (MIT, Apache 2.0). Cumplimiento de la Guía de Arquitectura y Buenas Prácticas de la Gobernación de Antioquia.', 'Entrega de código fuente completo sin ofuscación en repositorio Azure DevOps institucional.'],
        ['RNF08', 'Privacidad de Datos', 'Los entornos de Desarrollo y QA/Staging no deben contener datos reales de ciudadanos. Datos de prueba anonimizados o sintéticos. Política de privacidad visible en la aplicación.', 'Ley 1581 (Habeas Data). Anonimización obligatoria en entornos no productivos.'],
      ],
      [1100, 1900, 4000, 2360]
    ),
    spacer(),

    // ── 6. Diccionario ───────────────────────────────────────────────────────
    heading1('6.  Diccionario de Definiciones y Acrónimos'),
    makeTable(
      ['Término', 'Definición'],
      [
        ['API', 'Interfaz de Programación de Aplicaciones.'],
        ['bcrypt', 'Algoritmo de hash de contraseñas resistente a ataques de fuerza bruta.'],
        ['CRUD', 'Create, Read, Update, Delete (Crear, Leer, Actualizar, Eliminar).'],
        ['HTTPS', 'Protocolo de transferencia de hipertexto seguro.'],
        ['IUCN', 'Unión Internacional para la Conservación de la Naturaleza.'],
        ['MongoDB', 'Base de datos NoSQL orientada a documentos.'],
        ['QR', 'Código de Respuesta Rápida.'],
        ['REST', 'Transferencia de Estado Representacional (estilo de arquitectura de APIs).'],
        ['SVG', 'Gráficos Vectoriales Escalables.'],
        ['TLS', 'Transport Layer Security - protocolo de cifrado para comunicaciones web.'],
        ['WCAG', 'Pautas de Accesibilidad para el Contenido Web.'],
        ['WebP', 'Formato de imagen moderno con compresión superior a JPG/PNG.'],
      ],
      [2000, 7360]
    ),
    spacer(),

    // ── Notas finales ────────────────────────────────────────────────────────
    heading1('Notas Finales'),
    para([bold('Soporte y mantenimiento: '), normal('6 meses de soporte correctivo luego de la firma del acta de entrega final. Cubre corrección de errores imputables al código desarrollado. No incluye nuevas funcionalidades ni cambios en infraestructura de terceros.')]),
    para([bold('Garantía: '), normal('6 meses.')]),
    para([bold('Derechos morales y patrimoniales: '), normal('El código fuente desarrollado bajo este contrato es propiedad patrimonial de la Gobernación de Antioquia, en cumplimiento de la sección 1.4 de la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la entidad. El contratista conserva sus derechos morales como autor del desarrollo.')]),
    para([bold('Cumplimiento de lineamientos: '), normal('El desarrollo seguirá los lineamientos definidos en la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación de Antioquia, incluyendo Monolito Modular, Clean Architecture, GitFlow, Conventional Commits, código en español, licencias OSS compatibles y gestión mediante Azure DevOps institucional.')]),
  ];

  return new Document({
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
  });
}

// ── DOCUMENTO 2: Propuesta Técnica ────────────────────────────────────────────

function buildPropuesta() {
  const children = [

    // Portada
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'PROPUESTA TÉCNICA DE', bold: true, size: 44, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'DESARROLLO DE SOFTWARE', bold: true, size: 44, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Antioquia Biodiversa', size: 24, color: DARK_GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Propuesta realizada por el contratista', size: 20, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Sebastián Guzmán Díaz  |  sguzmand@gmail.com  |  3006552511', size: 20, color: '333333' })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Gobernación de Antioquia - Secretaría de Ambiente', size: 20, color: GRAY_TEXT })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),

    pageBreak(),

    // ── 1. Introducción ──────────────────────────────────────────────────────
    heading1('1.  Introducción a la Solución'),
    para('Antioquia Biodiversa es una aplicación web mobile-first que centraliza la información sobre la biodiversidad del departamento de Antioquia, accesible desde cualquier dispositivo mediante código QR, sin necesidad de instalación. La solución incluye módulos de biodiversidad, recursos hídricos y programas comunitarios (Jóvenes pa\' Lante, Guarda Cuencas, Especie del Mes), galerías fotográficas mensuales para JPL y Guarda Cuencas, un panel de administración web para curadores de contenido, y una API REST documentada. Está construida sobre un stack tecnológico moderno de código abierto, optimizado para bajo costo de operación, alta accesibilidad ciudadana y mantenibilidad a largo plazo por el equipo institucional de la Gobernación.'),
    spacer(),

    // ── 2. Detalles Técnicos ─────────────────────────────────────────────────
    heading1('2.  Detalles Técnicos'),
    heading2('2.1.  Metodología de Desarrollo'),
    para([
      normal('Se utilizará una metodología '),
      bold('ágil incremental'),
      normal(' con entregas quincenales sujetas a revisión y aprobación del líder funcional de la Gobernación.')
    ]),
    bullet('**Fases del ciclo:** Análisis y Diseño - Construcción (sprints) - Pruebas QA - Transición a producción - Capacitación'),
    bullet('**Gestión de tareas:** Azure DevOps institucional (repositorio Git + tablero de seguimiento)'),
    bullet('**Entregables:** quincenales con acta de aprobación por fase'),
    bullet('**Control de versiones:** GitFlow con ramas main (producción estable) y develop (integración continua)'),
    bullet('**Convención de commits:** Conventional Commits (feat:, fix:, docs:, refactor:) para mantener historial legible y auditable'),
    spacer(),

    heading2('2.2.  Stack Tecnológico'),
    makeTable(
      ['Capa', 'Tecnología / Herramienta', 'Justificación Técnica'],
      [
        ['Frontend (Cliente)', 'HTML5 + CSS3 + JavaScript Vanilla', 'Máxima compatibilidad, sin dependencias de framework, carga rápida en red móvil. En catálogo de tecnologías de referencia de la Gobernación.'],
        ['Backend (Servidor)', 'Node.js 22 LTS + Express.js', 'Open source, alto rendimiento, en catálogo oficial de tecnologías de la Gobernación'],
        ['Base de Datos', 'MongoDB Atlas — 2 bases de datos', 'Separación de responsabilidades: BD Biodiversidad (catálogo estático de 150 especies) y BD Comunidad (registros JPL ~4.000 y GC ~800 al final del programa). Mismo cluster Atlas M0, conexiones Mongoose independientes por base de datos (MONGODB_URI_BIO / MONGODB_URI_COM).'],
        ['Optimización de Imágenes', 'sharp 0.34 (Node.js)', 'Conversión automática de JPG/PNG a WebP en el servidor con control de dimensiones (máx. 1200 px) y calidad (q82). Ahorro de hasta 73% en peso de imágenes.'],
        ['Carga de Archivos', 'multer (Node.js)', 'Gestión de uploads multipart/form-data en el panel de administración. Validación de tipo y tamaño de archivo en el servidor.'],
        ['Autenticación Admin', 'express-session + bcrypt', 'Sesiones seguras para el panel de curadores. Contraseñas almacenadas con hash bcrypt. Cumplimiento del lineamiento: prohibido almacenamiento en texto plano.'],
        ['Servidor Web', 'Nginx + PM2', 'Estándar de industria para Node.js en producción: proxy inverso, SSL termination, reinicio automático'],
        ['Control de Versiones', 'Git + Azure DevOps', 'Plataforma institucional de la Gobernación de Antioquia'],
        ['Infraestructura', 'Ubuntu Server 24.04 LTS', 'Sistema operativo Open Source con soporte LTS hasta abril de 2029'],
      ],
      [2000, 2800, 4560]
    ),
    spacer(),

    // ── 3. Arquitectura General ──────────────────────────────────────────────
    heading1('3.  Arquitectura General'),
    heading2('3.1.  Diagrama de Arquitectura'),
    bullet('**Estilo:** Monolito Modular (recomendado en los lineamientos de la Gobernación para aplicaciones de dominio unificado)'),
    bullet('**Patrón de diseño backend:** Clean Architecture - separación entre Dominio (lógica de negocio), Aplicación (casos de uso) e Infraestructura (Express/MongoDB) para proteger las reglas de negocio de la obsolescencia tecnológica'),
    bullet('**Comunicación:** API RESTful bajo protocolo HTTPS con contratos Swagger/OpenAPI definidos antes de la codificación (API First)'),
    bullet('**Seguridad:** TLS 1.2+ (Certbot/Let\'s Encrypt), validación de entradas en todos los endpoints, protección OWASP Top 10, hash bcrypt para contraseñas del panel admin'),
    bullet('**Entornos:** Desarrollo (Dev) - QA/Staging (réplica de producción) - Producción (solo tras aprobación de QA). Solo se despliega en producción con aprobación explícita.'),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'Flujo de petición:', bold: true, size: 20, color: DARK_GREEN })],
      spacing: { before: 120, after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Ciudadano (móvil / escritorio)  ->  [HTTPS]  ->  Nginx (proxy + SSL)  ->  Node.js / Express + PM2  ->  MongoDB',
        size: 18, color: GRAY_TEXT, italics: true
      })],
      spacing: { after: 120 }
    }),
    spacer(),

    heading2('3.2.  Requisitos de Despliegue'),
    bullet('**Servidor de Aplicaciones:** Ubuntu Server 24.04 LTS - 4 vCPU, 16 GB RAM'),
    bullet('**Almacenamiento:** 2 TB (aplicación + fotos de especies + base de datos)'),
    bullet('**Dominio y SSL:** Dominio institucional .gov.co con certificado SSL'),
    bullet('**Entornos separados:** al menos tres ambientes lógicos independientes: Desarrollo, QA/Staging y Producción'),
    spacer(),

    // ── 4. Soporte y Mantenimiento ───────────────────────────────────────────
    heading1('4.  Soporte y Mantenimiento'),
    heading2('4.1.  Período de Garantía'),
    para([
      normal('Se ofrece un período de garantía de '),
      bold('6 meses'),
      normal(' contados a partir de la firma del acta de entrega final.')
    ]),
    bullet('**Cobertura:** Corrección de errores (bugs) imputables al código desarrollado.'),
    bullet('**Exclusiones:** Nuevas funcionalidades, cambios en reglas de negocio posteriores a la aprobación, fallos ocasionados por infraestructura de terceros o mal uso del sistema.'),
    spacer(),

    heading2('4.2.  Acuerdo de Nivel de Servicio (SLA)'),
    makeTable(
      ['Prioridad', 'Descripción', 'Tiempo de Respuesta', 'Tiempo de Resolución (Est.)'],
      [
        ['Crítica', 'Sistema caído o función principal bloqueada', '< 4 horas', '< 24 horas'],
        ['Alta', 'Funcionalidad importante con fallos, existe alternativa temporal', '< 24 horas', '2-3 días hábiles'],
        ['Media/Baja', 'Errores cosméticos o mejoras menores', '< 48 horas', 'A convenir'],
      ],
      [1400, 3500, 2000, 2460]
    ),
    spacer(),

    heading2('4.3.  Mantenimiento Evolutivo (Opcional)'),
    para('Finalizado el período de garantía, cualquier soporte o nueva funcionalidad se cotizará por hora de desarrollo o mediante contrato de mantenimiento mensual.'),
    spacer(),

    // ── 5. Cronograma ────────────────────────────────────────────────────────
    pageBreak(),
    heading1('5.  Cronograma de Ejecución'),
    para([
      normal('Este calendario es una estimación para un proyecto de '),
      bold('2-3 meses'),
      normal(', sujeta a la aprobación oportuna de los entregables por parte del líder funcional y a la disponibilidad del servidor.')
    ]),
    spacer(),
    makeTable(
      ['Fase / Módulo', 'Actividad Principal', 'Fecha Inicio', 'Fecha Fin', 'Entregable'],
      [
        ['Fase 1', 'Configuración de servidor, base de datos y entornos (Dev / QA / Prod)', '[PENDIENTE]', '[PENDIENTE]', 'Ambientes operativos'],
        ['Módulo Biodiversidad', 'Despliegue y validación del módulo de especies en producción', '[PENDIENTE]', '[PENDIENTE]', 'Módulo en producción'],
        ['Módulos Comunidad', 'Despliegue de Agua, JPL, Guarda Cuencas, Especie del Mes y panel de administración', '[PENDIENTE]', '[PENDIENTE]', 'Módulos en producción'],
        ['QA', 'Pruebas integrales (Jest, Postman/Newman, WAVE WCAG, SAST), correcciones y validación de seguridad', '[PENDIENTE]', '[PENDIENTE]', 'Informe de QA'],
        ['Despliegue', 'Puesta en producción final y capacitación al equipo de curadores', '[PENDIENTE]', '[PENDIENTE]', 'Sistema en vivo + acta de entrega'],
      ],
      [1800, 2800, 1300, 1300, 2160]
    ),
    spacer(),

    // ── 6. Diccionario ───────────────────────────────────────────────────────
    heading1('6.  Diccionario de Definiciones y Acrónimos'),
    makeTable(
      ['Término', 'Definición'],
      [
        ['API', 'Interfaz de Programación de Aplicaciones.'],
        ['Backend', 'Parte lógica del sistema que procesa los datos, no visible directamente por el usuario.'],
        ['bcrypt', 'Algoritmo de hash de contraseñas de uso estándar en la industria.'],
        ['Clean Architecture', 'Patrón de diseño que separa el dominio de la infraestructura para mayor mantenibilidad (recomendado por la Gobernación).'],
        ['Frontend', 'Capa de presentación visible al usuario en el navegador.'],
        ['GitFlow', 'Modelo de ramificación Git con ramas main (producción) y develop (integración continua).'],
        ['MongoDB', 'Base de datos NoSQL orientada a documentos.'],
        ['Nginx', 'Servidor web y proxy inverso de código abierto.'],
        ['PM2', 'Gestor de procesos para aplicaciones Node.js en producción.'],
        ['QA', 'Quality Assurance - aseguramiento de calidad.'],
        ['SAST', 'Static Application Security Testing - análisis estático de seguridad.'],
        ['SLA', 'Service Level Agreement - acuerdo de nivel de servicio.'],
        ['TLS', 'Transport Layer Security - protocolo de cifrado para comunicaciones web.'],
        ['WebP', 'Formato de imagen moderno con compresión superior a JPG/PNG.'],
      ],
      [2000, 7360]
    ),
    spacer(),

    // ── 7. Compromisos ───────────────────────────────────────────────────────
    heading1('7.  Compromisos del Contratista'),
    bullet('Entrega del código fuente completo sin ofuscación en repositorio Azure DevOps institucional'),
    bullet('Documentación técnica: README.md, Swagger/OpenAPI, manual de despliegue e instalación'),
    bullet('Cumplimiento de la Guía de Arquitectura y Buenas Prácticas de la Gobernación de Antioquia'),
    bullet('Uso de GitFlow (ramas main/develop) y Conventional Commits para control de versiones'),
    bullet('Código y comentarios en español (neutro) conforme a los lineamientos institucionales'),
    bullet('Uso exclusivo de librerías con licencias compatibles con uso institucional (MIT, Apache 2.0)'),
    bullet('Contraseñas almacenadas con hash bcrypt; prohibido almacenamiento en texto plano'),
    bullet('Estrategia de tres entornos: Desarrollo, QA/Staging y Producción; datos de prueba anonimizados en entornos no productivos'),
    bullet('Cobertura de pruebas unitarias superior al 80% en la lógica de negocio crítica (Jest)'),
    bullet('Capacitación básica al equipo de curadores de la Secretaría de Ambiente para el uso del panel de administración'),
    spacer(),

    // ── 8. Control de Ajustes ────────────────────────────────────────────────
    heading1('8.  Control de Ajustes'),
    makeTable(
      ['Versión', 'Fecha', 'Descripción del Cambio', 'Responsable'],
      [
        ['1.0', '[PENDIENTE]', 'Versión inicial', 'Sebastián Guzmán Díaz'],
        ['1.1', 'junio 2026', 'Se agregan galerías JPL y Guarda Cuencas, panel de administración curadores y stack sharp/multer/express-session. Alineación con lineamientos de la Gobernación: Clean Architecture, GitFlow, Conventional Commits, tres entornos y privacidad Ley 1581.', 'Sebastián Guzmán Díaz'],
        ['1.2', 'junio 2026', 'Cambio estructural de base de datos: de un único repositorio MongoDB a dos bases de datos independientes en el mismo cluster Atlas — BD Biodiversidad (catálogo de 150 especies) y BD Comunidad (registros JPL y Guarda Cuencas con crecimiento proyectado a ~4.000 y ~800 registros respectivamente). Corrección de alcance: 150 especies comprometidas (no 15.000). Actualización de variables de entorno MONGODB_URI_BIO y MONGODB_URI_COM. Modelos Mongoose registrados en la conexión correspondiente a su dominio.', 'Sebastián Guzmán Díaz'],
      ],
      [1200, 1800, 4000, 2360]
    ),
    spacer(),

    // ── 9. Aprobación y Firmas ───────────────────────────────────────────────
    heading1('9.  Aprobación y Firmas'),
    makeTable(
      ['Rol', 'Nombre', 'Firma', 'Fecha'],
      [
        ['Contratista', 'Sebastián Guzmán Díaz', '', ''],
        ['Líder Funcional Gobernación', '[PENDIENTE]', '', ''],
      ],
      [2500, 3000, 2000, 1860]
    ),
  ];

  return new Document({
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
  });
}

// ── Generar ambos archivos ────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const doc1 = buildLevantamiento();
  const doc2 = buildPropuesta();

  const file1 = path.join(OUT_DIR, 'Levantamiento_Requisitos_Antioquia_Biodiversa.docx');
  const file2 = path.join(OUT_DIR, 'Propuesta_Tecnica_Antioquia_Biodiversa.docx');

  await Packer.toBuffer(doc1).then(buf => fs.writeFileSync(file1, buf));
  console.log(`✓ ${file1}`);

  await Packer.toBuffer(doc2).then(buf => fs.writeFileSync(file2, buf));
  console.log(`✓ ${file2}`);
}

main().catch(console.error);
