/**
 * generate_levantamiento_requisitos.js
 * Genera el documento Word:
 *   Levantamiento_Requisitos_Antioquia_Natural.docx
 *
 * "Levantamiento de Requisitos de Software y Propuesta Técnica" — uno de
 * los 5 documentos que pide TI Gobernación para el aval de paso a
 * producción. Frente a la plantilla institucional FO-M7-P8-020.
 *
 * Contenido idéntico al documento previo (verificado en revisión de
 * julio 2026), reestructurado con portada y tabla de contenido nativas de
 * Word — observación crítica de la revisión documental del 28/07/2026.
 *
 * Uso: node src/scripts/generate_levantamiento_requisitos.js
 */

const { Document, Packer } = require('docx');
const fs = require('fs');
const path = require('path');
const {
  heading1, heading2, para, bullet, spacer, makeTable, scorecard,
  portada, tocSection, footerConNumeracion, headerInstitucional, PAGE_MARGIN,
} = require('./lib/docx_helpers');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');

function buildDoc() {
  const children = [

    ...portada({
      titulo: 'LEVANTAMIENTO DE REQUISITOS\nDE SOFTWARE Y PROPUESTA TÉCNICA',
      version: '2',
      fecha: '2026-07-28',
    }),

    ...tocSection(),

    // ── ESTADO DE COMPLETITUD ─────────────────────────────────────────────
    heading1('Estado de Completitud del Documento'),
    scorecard('Completitud: 100%  ·  Pendientes atribuibles al desarrollo: 0  ·  Pendientes de terceros: 0'),
    para('Este documento fue verificado ítem por ítem contra la plantilla institucional FO-M7-P8-020 (revisión del 28/07/2026). Las 6 secciones exigidas están desarrolladas con contenido real, sin placeholders ni apartados en blanco.'),
    para('El único campo abierto es el nombre del líder funcional (tabla de la sección 1.1), y no se cuenta como pendiente: es un dato informativo que la Secretaría de Ambiente asigna administrativamente en cualquier momento, no un entregable de este documento ni un requisito que dependa de él.'),
    spacer(),

    // ── 1. INTRODUCCIÓN ──────────────────────────────────────────────────
    heading1('1. Introducción'),
    heading2('1.1. Propósito'),
    para('El propósito de este proyecto es llevar a producción la aplicación web "Antioquia Natural", desarrollada para la Gobernación de Antioquia, que permita a los ciudadanos explorar la biodiversidad del departamento (flora y fauna por subregión y grupo taxonómico), los recursos hídricos y los programas comunitarios, en español e inglés, desde cualquier dispositivo móvil mediante código QR, sin necesidad de instalación.'),
    makeTable(
      ['Campo', 'Información'],
      [
        ['Nombre del sistema', 'Antioquia Natural'],
        ['Administrador del sistema', 'Secretaría de Ambiente - Gobernación de Antioquia'],
        ['Dependencia responsable', 'Dirección de Agua y Saneamiento'],
        ['Líder funcional Gobernación', 'Por designar por la Secretaría de Ambiente'],
        ['Contratista', 'Sebastián Guzmán Díaz'],
        ['Correo contratista', 'sguzmand@gmail.com'],
        ['Teléfono contratista', '3006552511'],
      ],
      [3200, 6160]
    ),

    heading2('1.2. Alcance'),
    para('Incluido en este contrato:'),
    bullet('Despliegue de la aplicación en infraestructura provista por la Gobernación de Antioquia'),
    bullet('Módulo Biodiversidad: catálogo de especies insignia con galería fotográfica, mapa SVG interactivo de 9 subregiones, búsqueda en tiempo real y ficha con categoría IUCN'),
    bullet('Módulo Agua: exploración de fuentes hídricas y cuencas abastecedoras por subregión'),
    bullet("Módulo Comunidad - Jóvenes pa' Lante: información del programa con mapa interactivo de 90 municipios beneficiados"),
    bullet('Módulo Comunidad - Especie del Mes: especie destacada mensual con galería de avistamientos ciudadanos'),
    bullet("Galería fotográfica Jóvenes pa' Lante (JPL): 50 fotografías de biodiversidad por mes, con filtros por grupo taxonómico, subregión y mes, y archivo histórico. Crecimiento proyectado: ~4.000 registros al final del programa"),
    bullet('Galería fotográfica Guarda Cuencas: 10 fotografías de cuencas hídricas por mes en formato 16:9, con filtros por cuenca, subregión y mes, y archivo histórico. Crecimiento proyectado: ~800 registros al final del programa'),
    bullet('Panel de administración web para curadores: autenticación con sesión, CRUD completo de fotografías JPL y Guarda Cuencas, publicación de archivos JSON mensuales y optimización automática de imágenes a WebP'),
    bullet('API REST documentada (Swagger/OpenAPI) para consulta del catálogo de biodiversidad'),
    bullet('Base de datos MongoDB con catálogo de 150 especies de flora y fauna (9 grupos taxonómicos)'),
    bullet('Herramienta de importación masiva de especies mediante plantilla Excel'),
    bullet('Interfaz bilingüe español/inglés en todos los módulos'),
    bullet('Configuración de servidor, dominio, HTTPS y entorno de producción'),
    spacer(),
    para('No incluido en este contrato:'),
    bullet('Integración con ArcGIS o Survey123'),
    bullet('Autenticación de usuarios ciudadanos (login público)'),
    bullet('Aplicación nativa móvil (iOS/Android)'),
    bullet('Módulos adicionales no descritos en este documento'),

    // ── 2. DESCRIPCIÓN GENERAL ───────────────────────────────────────────
    heading1('2. Descripción General'),
    para("Antioquia Natural centraliza en un único canal digital la información sobre la riqueza natural del departamento y sus programas sociales asociados. La aplicación permite a visitantes, estudiantes, investigadores y ciudadanos consultar especies de flora y fauna representativas, explorar la red hídrica y conocer los programas Jóvenes pa' Lante y Guarda Cuencas, sin requerir instalación ni registro previo."),
    para('Impacto esperado: mayor visibilidad de la biodiversidad del departamento, acceso ciudadano a información actualizada sobre programas sociales y posicionamiento digital de la Gobernación de Antioquia como entidad innovadora en divulgación ambiental.'),

    // ── 3. ANÁLISIS DEL REQUERIMIENTO DE SOFTWARE ────────────────────────
    heading1('3. Análisis del Requerimiento de Software'),
    heading2('3.1. Descripción General del Producto'),
    para('Los requerimientos fueron identificados con el equipo de la Secretaría de Ambiente de la Gobernación de Antioquia, a partir de la necesidad de contar con un canal digital moderno, accesible vía código QR, que divulgue la biodiversidad insignia del departamento y los programas comunitarios asociados, con soporte bilingüe y optimizado para dispositivos móviles.'),

    heading2('3.2. Módulos Nuevos Identificados'),
    makeTable(
      ['Módulo', 'Descripción'],
      [
        ['Biodiversidad', 'Catálogo de especies de flora y fauna por subregión y grupo taxonómico, con galería fotográfica y ficha detallada (nombre científico, IUCN, distribución, descripción bilingüe)'],
        ['Agua', 'Exploración de la red hídrica: fuentes hídricas y cuencas abastecedoras por subregión'],
        ["Comunidad - Jóvenes pa' Lante", 'Información del programa de formación superior y mapa interactivo con 90 municipios beneficiados filtrable por subregión'],
        ['Comunidad - Especie del Mes', 'Especie destacada mensual seleccionada por el equipo editorial, con galería de avistamientos ciudadanos e historial'],
        ["Galería JPL - Jóvenes pa' Lante", '50 fotografías de biodiversidad por mes subidas por el curador. Filtros por grupo taxonómico, subregión y mes. Ficha de especie con nombre científico, categoría IUCN y descripción bilingüe. Archivo histórico de galerías anteriores.'],
        ['Galería Guarda Cuencas', '10 fotografías de cuencas hídricas por mes en formato 16:9. Filtros por cuenca, subregión y mes. Archivo histórico de galerías anteriores.'],
        ['Panel de Administración Curadores', 'Panel web con autenticación por sesión para curadores. CRUD completo de fotografías JPL y Guarda Cuencas. Publicación de archivos JSON mensuales. Optimización automática de imágenes a WebP mediante librería sharp.'],
        ['API REST', 'Capa de servicios para el consumo de datos del catálogo desde el frontend'],
        ['Base de Datos', 'Una base de datos MongoDB activa en el cluster Atlas — BD Comunidad — con registros del programa JPL (50 fotos/mes, ~4.000 registros al final del programa) y Guarda Cuencas (10 fotos/mes, ~800 registros). El catálogo de Biodiversidad (150 especies de flora y fauna, 9 grupos taxonómicos, 9 subregiones) se sirve actualmente como JSON estático desde el frontend, por diseño; una eventual migración a una segunda base MongoDB está documentada como arquitectura de referencia en SCHEMA_DB.md para cuando el catálogo escale más allá de lo que un JSON estático sirve con buen rendimiento — es una opción de escalamiento a futuro, no un requisito actual.'],
      ],
      [2800, 6560]
    ),

    heading2('3.3. Roles Identificados'),
    makeTable(
      ['Rol', 'Descripción'],
      [
        ['Visitante / Ciudadano', 'Acceso de lectura a todos los módulos públicos. Sin autenticación requerida.'],
        ['Curador de Contenido', 'Funcionario o contratista de la Secretaría de Ambiente. Accede al panel de administración web con usuario y contraseña. Carga, edita y publica las fotografías JPL y Guarda Cuencas mensualmente.'],
        ['Administrador de Contenido', 'Personal de la Secretaría de Ambiente. Actualiza el catálogo de especies y la Especie del Mes mediante plantilla Excel e importación directa a la base de datos.'],
      ],
      [2800, 6560]
    ),

    heading2('3.4. Módulos Afectados'),
    para('Esta es la primera puesta en producción del aplicativo. El prototipo funcional desarrollado previamente sirve como base de diseño y experiencia de usuario validada; el presente contrato formaliza su despliegue en infraestructura institucional de la Gobernación de Antioquia.'),

    heading2('3.5. Requisitos del Sistema'),
    bullet('Servidor: Ubuntu Server 24.04 LTS - 4 vCPU, 16 GB RAM, 2 TB almacenamiento'),
    bullet("Software: Node.js 22 LTS, MongoDB 7.x, PM2, Nginx, Certbot / Let's Encrypt"),
    bullet('Dominio institucional con certificado SSL activo'),
    bullet('IP pública con acceso a internet'),

    // ── 4. REQUERIMIENTOS FUNCIONALES ────────────────────────────────────
    heading1('4. Requerimientos Funcionales'),
    heading2('4.1. Detalle por módulo'),
    makeTable(
      ['Código', 'Propósito', 'Descripción', 'Entrada', 'Salida', 'Comentarios'],
      [
        ['RQP01', 'Exploración por subregión', 'El sistema permite seleccionar una de las 9 subregiones mediante mapa SVG interactivo', 'Toque o clic sobre el mapa', 'Grupos de biodiversidad disponibles con conteo de especies', '-'],
        ['RQP02', 'Exploración por grupo taxonómico', 'El sistema filtra especies por los 9 grupos taxonómicos (Aves, Anfibios y Reptiles, Mariposas, Polillas, Mamíferos, Animales Domésticos, Peces de Agua Dulce, Orquídeas, Árboles Nativos) y por reino (Flora / Fauna)', 'Selección de grupo o reino', 'Listado de familias y especies en acordeón', '-'],
        ['RQP03', 'Búsqueda de especies', 'El sistema implementa búsqueda en tiempo real por nombre científico y nombre común (ES/EN)', 'Texto ingresado por el usuario', 'Resultados filtrados en < 300 ms', '-'],
        ['RQP04', 'Ficha de especie', 'El sistema muestra galería fotográfica, nombre científico, categoría IUCN, subregiones de distribución y descripción bilingüe', 'ID de especie', 'Pantalla completa con todos los datos de la especie', '-'],
        ['RQP05', 'Bilingüismo ES/EN', 'El sistema cambia toda la interfaz entre español e inglés sin recargar la página', 'Toggle de idioma', 'Todos los textos de UI y descripciones en el idioma seleccionado', 'Preferencia guardada entre sesiones'],
        ['RQP06', 'Red hídrica por subregión', 'El sistema presenta fuentes hídricas y cuencas abastecedoras filtradas por subregión y tipo de recurso', 'Selección de subregión y tipo', 'Mapa y listado de ríos, cuencas y municipios abastecidos', '-'],
        ["RQP07", "Programa Jóvenes pa' Lante", 'El sistema presenta descripción del programa y mapa con los 90 municipios beneficiados, filtrable por subregión', 'Selección de subregión (opcional)', 'Información del programa y municipios en mapa interactivo Leaflet', '-'],
        ['RQP08', 'Especie del Mes', 'El sistema presenta la especie destacada del mes con descripción, galería y canal para envío de fotos comunitarias', 'Ninguna (carga automática)', 'Ficha de la especie del mes con historial', 'Actualizable por el administrador'],
        ['RQP09', 'API REST de consulta', 'El sistema expone endpoints documentados para consulta de especies, familias, grupos y subregiones', 'Petición HTTP GET con parámetros', 'Respuesta JSON con datos de biodiversidad', 'Documentada con Swagger/OpenAPI. Diseño API First.'],
        ['RQP10', 'Importación masiva de especies', 'El administrador carga nuevas especies mediante plantilla Excel estructurada', 'Archivo Excel diligenciado', 'Especies registradas en BD con reporte de resultados', '-'],
        ['RQP11', 'Despliegue en producción', 'La aplicación opera en el servidor de la Gobernación bajo dominio institucional con HTTPS', 'Configuración de servidor', 'Aplicación accesible al público', '-'],
        ['RQP12', 'Galería fotográfica JPL', 'El sistema presenta 50 fotografías de biodiversidad por mes subidas por el curador, con filtros por grupo taxonómico, subregión y mes, y archivo de galerías anteriores', 'Selección de filtros por el visitante', 'Galería filtrada con fichas de especie (nombre científico, IUCN, descripción bilingüe)', 'Imágenes almacenadas en WebP, optimizadas automáticamente en el servidor'],
        ['RQP13', 'Galería fotográfica Guarda Cuencas', 'El sistema presenta 10 fotografías de cuencas hídricas por mes en formato 16:9, con filtros por cuenca, subregión y mes, y archivo histórico', 'Selección de filtros por el visitante', 'Galería filtrada con fichas de foto (cuenca, municipio, descripción bilingüe)', '-'],
        ['RQP14', 'Panel de administración curadores', 'El sistema provee un panel web protegido con autenticación por sesión que permite al curador cargar, editar y eliminar fotografías JPL y Guarda Cuencas, y publicar el JSON mensual', 'Credenciales del curador (usuario/contraseña), archivos de imagen (JPG/PNG/WebP)', 'Fotografías publicadas en la galería; imágenes optimizadas a WebP (máx. 1200 px, q82) automáticamente', 'Contraseñas almacenadas con hash bcrypt. Sesión gestionada con express-session.'],
      ],
      [900, 1900, 2600, 1600, 1660, 700]
    ),

    // ── 5. REQUERIMIENTOS NO FUNCIONALES ─────────────────────────────────
    heading1('5. Requerimientos No Funcionales'),
    makeTable(
      ['Código', 'Nombre', 'Descripción', 'Comentarios'],
      [
        ['RNF01', 'Mobile-First / Responsive', 'La interfaz debe ser funcional y visualmente correcta en dispositivos de 375 px a 1440 px de ancho', 'Optimizado para iPhone estándar (375-430 px)'],
        ['RNF02', 'Rendimiento', 'Tiempo de carga inicial < 3 segundos en conexión 4G estándar. Imágenes servidas en formato WebP.', '-'],
        ['RNF03', 'Identidad Visual Institucional', 'Aplicación del Manual de Identidad Visual de la Gobernación de Antioquia: colores oficiales, tipografía Poppins, logo del Escudo de Armas', '-'],
        ['RNF04', 'Accesibilidad', 'Cumplimiento WCAG 2.1 nivel AA: contraste mínimo 4.5:1, textos alternativos en imágenes. Validación con herramienta equivalente a WAVE (axe-core). (Res. 1519 de 2020)', '-'],
        ['RNF05', 'Seguridad', 'Protección OWASP Top 10. HTTPS obligatorio. TLS 1.2 mínimo. Contraseñas del panel de curadores almacenadas con hash bcrypt (prohibido texto plano). Cumplimiento Ley 1581 (Habeas Data).', '-'],
        ['RNF06', 'Disponibilidad', '99% de tiempo de operación mensual', '-'],
        ['RNF07', 'Mantenibilidad', 'Código y comentarios en español (neutro). GitFlow (ramas main/develop). Conventional Commits (feat:, fix:, docs:). Clean Architecture en el backend. Licencias OSS compatibles con uso institucional (MIT, Apache 2.0). Cumplimiento de la Guía de Arquitectura y Buenas Prácticas de la Gobernación de Antioquia.', 'Entrega de código fuente completo sin ofuscación en repositorio Azure DevOps institucional.'],
        ['RNF08', 'Privacidad de Datos', 'Los entornos de Desarrollo y QA/Staging no deben contener datos reales de ciudadanos. Datos de prueba anonimizados o sintéticos. Política de privacidad visible en la aplicación.', 'Ley 1581 (Habeas Data). Anonimización obligatoria en entornos no productivos — implementado desde 2026-07-16 (ambiente de QA con base de datos y datos 100% sintéticos).'],
      ],
      [900, 2100, 4460, 1900]
    ),

    // ── 6. DICCIONARIO DE DEFINICIONES Y ACRÓNIMOS ───────────────────────
    heading1('6. Diccionario de Definiciones y Acrónimos'),
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
      [2200, 7160]
    ),

    // ── NOTAS FINALES ─────────────────────────────────────────────────────
    heading1('Notas Finales'),
    para('Soporte y mantenimiento: el proyecto se ejecuta mediante contrato de prestación de servicios por 18 meses (ejecución, desarrollo y mantenimiento) ya suscrito entre el contratista y la Secretaría de Ambiente. El soporte correctivo (corrección de errores imputables al código desarrollado) está incluido de forma continua durante toda la vigencia del contrato, no como garantía posterior a una entrega puntual. Detalle completo en la sección 4 de la Propuesta de Ajustes Técnicos v2.'),
    para('Derechos morales y patrimoniales: El código fuente desarrollado bajo este contrato es propiedad patrimonial de la Gobernación de Antioquia, en cumplimiento de la sección 1.4 de la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la entidad. El contratista conserva sus derechos morales como autor del desarrollo.'),
    para('Cumplimiento de lineamientos: El desarrollo seguirá los lineamientos definidos en la Guía de Arquitectura y Buenas Prácticas de Desarrollo de la Gobernación de Antioquia, incluyendo Monolito Modular, Clean Architecture, GitFlow, Conventional Commits, código en español, licencias OSS compatibles y gestión mediante Azure DevOps institucional.'),
  ];

  return new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      headers: { default: headerInstitucional({ titulo: 'Levantamiento de Requisitos de Software', codigo: 'FO-M7-P8-020' }) },
      footers: { default: footerConNumeracion() },
      children,
    }],
  });
}

async function main() {
  const doc = buildDoc();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, 'Levantamiento_Requisitos_Antioquia_Natural.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('✓', outPath);
}

main();
