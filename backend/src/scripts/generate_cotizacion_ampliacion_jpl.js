/**
 * generate_cotizacion_ampliacion_jpl.js
 * Genera el documento Word (privado, no se sube a GitHub):
 *   Cotizacion_Formal_Ampliacion_JPL_v2.docx
 *
 * Fuente de contenido: Cotizacion_Formal_Ampliacion_JPL_v2.md (misma carpeta)
 * Reemplaza la Propuesta_Ampliacion_JPL_Participantes.md/.docx (v1.0)
 *
 * Uso: node src/scripts/generate_cotizacion_ampliacion_jpl.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI');

// ── Colores institucionales ───────────────────────────────────────────────────
const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const WHITE      = 'FFFFFF';
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
  return new Paragraph({ children: runs, bullet: { level }, spacing: { after: 80 } });
}

function bold(text, color = '333333') {
  return new TextRun({ text, bold: true, size: 20, color });
}

function normal(text, color = '333333') {
  return new TextRun({ text, size: 20, color });
}

function pending(text) {
  return new TextRun({ text, color: PENDING, italics: true, size: 20 });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer() {
  return new Paragraph({ children: [], spacing: { after: 120 } });
}

function callout(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 20, color: DARK_GREEN })],
    spacing: { before: 80, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: 'F0FFF4' },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: GREEN } },
    indent: { left: 160 }
  });
}

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

// ── Documento ──────────────────────────────────────────────────────────────────

function buildCotizacion() {
  const children = [

    // Portada
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'COTIZACIÓN FORMAL', bold: true, size: 44, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'MÓDULO DE PARTICIPANTES — JÓVENES PA\' LANTE', bold: true, size: 32, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Antioquia Natural', size: 24, color: DARK_GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Versión 2.0 — julio 2026  ·  Reemplaza la propuesta v1.0', size: 20, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Sebastián Guzmán Díaz  |  sguzmand@gmail.com  |  3006552511', size: 20, color: '333333' })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Gobernación de Antioquia — Secretaría de Ambiente', size: 20, color: GRAY_TEXT })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    spacer(),
    callout('Documento privado de negociación. No distribuir fuera del equipo de TI/jurídica de la Gobernación y el contratista.'),

    pageBreak(),

    // ── 1. Resumen ejecutivo ─────────────────────────────────────────────────
    heading1('1.  Resumen ejecutivo'),
    para('La Gobernación solicita un nuevo módulo para Jóvenes pa\' Lante (JPL) que reemplaza el flujo manual actual (fotos recibidas por WhatsApp, curador único que publica una vez al mes) por una plataforma transaccional con:'),
    bullet('**Autenticación de dos tipos de usuario:** participantes (jóvenes del programa) y coordinadores.'),
    bullet('**Solicitud y aprobación de cuentas:** los jóvenes solicitan cuenta nueva; un coordinador la aprueba o rechaza. Las cuentas de coordinador solo se crean desde el panel de administración.'),
    bullet('**Tres roles de coordinador** (combinables): moderación de fotos, revisión de documentos de solicitud de participación, y visualización de estadísticas/tendencias.'),
    bullet('**Casillero virtual de fotos** por participante, con capacidad fija y límite mensual de subida.'),
    bullet('**Flujo de revisión de documentos** de la solicitud de participación, con aprobación/rechazo **por documento individual**, no por paquete completo.'),
    spacer(),
    para([bold('Esfuerzo estimado de implementación inicial: '), normal('~72 días de desarrollo (ver sección 9).')]),
    para([
      bold('Propuesta económica: '),
      normal('65.000.000 COP de pago único por la construcción inicial + 5.000.000 COP/mes adicionales recurrentes durante el resto del contrato, a partir del mes de lanzamiento.')
    ]),
    spacer(),

    // ── 2. Contexto ───────────────────────────────────────────────────────────
    heading1('2.  Contexto — qué existe hoy'),
    makeTable(
      ['Área', 'Estado actual'],
      [
        ['Fuente de las fotos de la galería JPL', 'Un único curador/admin las sube manualmente vía panel, tras un proceso externo de evaluación en dos etapas (documentado en EVALUACION_FOTOS_JPL.md)'],
        ['Autenticación', 'Un solo usuario administrador con contraseña compartida; sin roles, sin cuentas individuales, sin concepto de "usuario final"'],
        ['Subida de archivos', 'Sin ningún endpoint público; solo el curador autenticado puede subir fotos'],
        ['Identidad de los jóvenes en el sistema', 'No existe — el nombre del fotógrafo se guarda como texto libre, sin cuenta ni relación real a un usuario'],
        ['Solicitud de participación en el programa', 'Proceso externo en papel/otros canales, sin registro digital ni flujo de revisión de documentos'],
        ['Estadísticas', 'Existen paneles basados en datos de iNaturalist, pero no hay estadísticas generadas a partir de datos propios de participantes'],
      ],
      [3000, 6360]
    ),
    spacer(),

    // ── 3. Alcance ────────────────────────────────────────────────────────────
    heading1('3.  Alcance solicitado por la Gobernación'),
    bullet('Módulo nuevo con autenticación de ingreso para **usuarios (participantes)** y para **coordinadores**.'),
    bullet('Los usuarios solicitan cuenta nueva; los **coordinadores aprueban** esas solicitudes.'),
    bullet('Los coordinadores se crean **exclusivamente desde el panel de administración**.'),
    bullet('Los coordinadores tienen **3 roles** (combinables): editar/moderar fotos subidas por los usuarios; revisar el flujo de documentos de la solicitud de participación; visualizar estadísticas y tendencias generadas a partir de los datos de la plataforma.'),
    bullet('Cada perfil de usuario tiene un **casillero virtual con capacidad fija** para subir sus fotos.'),
    bullet('Existe un **límite mensual de fotos** por usuario.'),
    bullet('Existe un **flujo de revisión de documentos**: el usuario solicita participar en el programa y adjunta los documentos requeridos; el coordinador puede aprobar o **rechazar/solicitar corrección de cada documento individualmente**, no del paquete completo.'),
    spacer(),

    // ── 4. Modelo funcional ──────────────────────────────────────────────────
    heading1('4.  Modelo funcional — dos puertas de aprobación distintas'),
    para('El alcance define dos flujos de aprobación separados, con objetivos distintos:'),
    bullet('**Aprobación de cuenta** (acceso a la plataforma) — el joven solicita una cuenta nueva con sus datos básicos. Un coordinador aprueba o rechaza la solicitud. Es un gate simple, no evalúa documentos.'),
    bullet('**Aprobación de participación en el programa** (una vez la cuenta está activa) — el joven presenta la "solicitud de participación" y adjunta los documentos requeridos. El coordinador revisa cada documento por separado: puede aprobarlo, o rechazarlo/solicitar corrección de ese documento puntual, sin afectar los demás documentos ya aprobados de la misma solicitud. El joven solo debe reenviar el documento observado, nunca el paquete completo.'),
    spacer(),

    // ── 5. Roles de coordinador ──────────────────────────────────────────────
    heading1('5.  Roles de coordinador — modelo RBAC (3 permisos combinables)'),
    para('Se extiende el mismo patrón de roles ya definido en el contrato base para Entra ID (Curador.Biodiversidad / Curador.GuardaCuencas / Admin.Contenido). Cada cuenta de coordinador puede tener uno, dos o los tres permisos siguientes, asignados desde el panel admin al momento de crear la cuenta:'),
    makeTable(
      ['Permiso', 'Función'],
      [
        ['Coordinador.Fotos', 'Edita y modera las fotos subidas por los usuarios — bandeja de revisión que digitaliza el proceso de comité + curador ya documentado en EVALUACION_FOTOS_JPL.md'],
        ['Coordinador.Documentos', 'Revisa el flujo de solicitudes de participación en el programa: aprueba o rechaza/solicita corrección de cada documento individual'],
        ['Coordinador.Estadisticas', 'Visualiza estadísticas y tendencias generadas a partir de los datos ingresados en la plataforma'],
      ],
      [2800, 6560]
    ),
    spacer(),
    para([bold('Punto a validar con TI: '), normal('los coordinadores del programa (comité evaluador externo: biólogo, fotógrafo naturalista, técnico en educación ambiental) probablemente no son funcionarios del tenant institucional, por lo que su autenticación no puede vivir en Microsoft Entra ID de la misma forma que los curadores internos. Se propone que coordinadores y participantes compartan el mismo sistema de identidad nuevo (sección 7), diferenciado por rol.')]),
    spacer(),

    // ── 6. Especificaciones técnicas ─────────────────────────────────────────
    pageBreak(),
    heading1('6.  Especificaciones técnicas — casillero, límite mensual y documentos'),
    heading2('6.1  Límite mensual de fotos por usuario: 8 fotos/mes'),
    para('Los documentos ya existentes del proceso de curaduría (EVALUACION_FOTOS_JPL.md, CRITERIOS_SELECCION_ESPECIES.md) describen que el sistema completo recibe aproximadamente 1.000 fotos al mes entre los ~1.000 participantes — un promedio real de apenas 1 foto/mes por participante. Un límite de 8 fotos/mes por usuario:'),
    bullet('Da holgura amplia a un participante genuinamente activo (8 veces el promedio real observado en el programa).'),
    bullet('Acota el peor caso posible: si los 1.000 usuarios agotaran su cupo el mismo mes, el sistema recibiría un máximo de 8.000 fotos — una cifra manejable para la bandeja de revisión de coordinadores.'),
    bullet('Es sencillo de comunicar a los participantes y de implementar como límite de tasa técnico (express-rate-limit + rate-limit-redis, reutilizando el Redis ya contratado en el Ajuste 2 de la Propuesta Técnica v2.0).'),
    spacer(),

    heading2('6.2  Capacidad del casillero virtual: 150 fotos por usuario (≈37,5 MB)'),
    para('El casillero es acumulativo: no libera espacio cuando una foto es aprobada o rechazada, conserva todo lo que el participante ha subido durante la vigencia del programa.'),
    bullet('Horizonte de dimensionamiento: 18 meses, la duración del contrato base.'),
    bullet('Para que ningún participante activo se quede sin espacio aunque use su cupo mensual completo (8 fotos/mes) todos los meses: 8 × 18 = 144 fotos → se redondea a **150 fotos** de margen.'),
    bullet('Tamaño real por foto, ya optimizada con el mismo pipeline sharp que usa hoy el resto de la aplicación (WebP, 1200 px, calidad 82): entre 150 y 300 KB por archivo. Usando 250 KB como cifra de planeación: 150 × 250 KB ≈ **37,5 MB por usuario**.'),
    bullet('Total para 1.000 usuarios en el peor caso (todos llenan su casillero): **≈37,5 GB**. Se recomienda aprovisionar 50 GB con margen para overhead de conversión y archivos temporales.'),
    bullet('Esta cifra es notablemente menor que la estimación de ~36 GB/año "fotos crudas sin optimizar" que manejaba la propuesta v1.0, porque ahora se cuenta el archivo ya optimizado — una ventaja directa de reutilizar la arquitectura de conversión a WebP ya construida en el proyecto.'),
    spacer(),

    heading2('6.3  Documentos de la solicitud de participación'),
    para([pending('Pendiente de confirmar con la Gobernación: '), normal('la lista exacta de documentos requeridos para la solicitud de participación. Se usa como referencia de trabajo un set típico, ajustable sin impacto mayor en el diseño técnico:')]),
    bullet('Documento de identidad (cédula, tarjeta de identidad o registro civil) — imagen o PDF'),
    bullet('Consentimiento informado del acudiente, si el participante es menor de edad — PDF o foto del formulario firmado'),
    bullet('Carta de compromiso / formulario de inscripción al programa — PDF'),
    bullet('Foto tipo documento del participante (opcional, para credencial)'),
    spacer(),
    para('Parámetros técnicos asumidos: máximo 5 MB por archivo, formatos PDF/JPG/PNG. Almacenamiento estimado (carga única por participante, salvo reenvíos por corrección puntual): 1.000 participantes × ~4 documentos × 3 MB promedio ≈ 12 GB.'),
    spacer(),

    // ── 7. Requisitos técnicos ───────────────────────────────────────────────
    pageBreak(),
    heading1('7.  Nuevos requisitos técnicos'),
    makeTable(
      ['Componente', 'Tecnología propuesta', 'Estado'],
      [
        ['Identidad de participantes y coordinadores', 'Modelos Mongoose nuevos (Participant, Coordinator) + JWT en cookie httpOnly', 'Nuevo — independiente de la migración a Entra ID ya comprometida para curadores internos'],
        ['Hash de contraseñas', 'bcryptjs', 'Nueva dependencia, sin compilación nativa, compatible con el servidor Ubuntu on-premises'],
        ['Solicitud de participación', 'Modelo Mongoose nuevo (ParticipationRequest) con sub-documentos por archivo y estado individual', 'Nuevo — el estado vive a nivel de documento individual, no del paquete completo'],
        ['Casillero de fotos', 'Modelo Mongoose nuevo (PhotoLocker) con contador acumulativo por participante', 'Nuevo'],
        ['Límite de tasa', 'express-rate-limit + rate-limit-redis, sobre el Redis 7 ya contratado', 'Nueva dependencia, reutiliza infraestructura ya aprobada'],
        ['Almacenamiento de fotos y documentos', 'Directorios separados del árbol de código/Git, servidos solo mediante endpoints autenticados', 'Nuevo requisito de infraestructura — validar capacidad de disco con TI'],
        ['Dashboard de estadísticas', 'Nuevas vistas en el panel admin, alimentadas por agregaciones sobre los modelos nuevos', 'Nuevo — complementa los paneles ya existentes basados en iNaturalist'],
        ['Accesibilidad de formularios nuevos', 'Cumplimiento WCAG 2.1 AA', 'Extensión del compromiso ya vigente'],
        ['Cobertura de pruebas y SAST', 'Jest + ESLint-security + Semgrep sobre las rutas y modelos nuevos', 'Extensión del pipeline ya vigente'],
      ],
      [2400, 3600, 3360]
    ),
    spacer(),

    // ── 8. Requisitos funcionales ────────────────────────────────────────────
    heading1('8.  Nuevos requisitos funcionales'),
    makeTable(
      ['#', 'Requisito'],
      [
        ['RF-1', 'Solicitud de cuenta nueva por el participante; aprobación o rechazo por un coordinador'],
        ['RF-2', 'Creación y gestión de cuentas de coordinador desde el panel admin, con asignación de 1 a 3 permisos'],
        ['RF-3', 'Autenticación dual (participantes y coordinadores) con JWT en cookie httpOnly y bcryptjs'],
        ['RF-4', 'Solicitud de participación en el programa, con carga de los documentos requeridos'],
        ['RF-5', 'Bandeja de revisión de documentos: aprobar, rechazar o corregir por documento individual'],
        ['RF-6', 'Casillero virtual de fotos por participante: 150 fotos acumulativas (≈37,5 MB), límite de 8 fotos/mes'],
        ['RF-7', 'Bandeja de moderación de fotos por coordinador, con cuotas visibles en vivo por grupo/subregión'],
        ['RF-8', 'Publicación de fotos aprobadas al flujo mensual existente de la galería JPL'],
        ['RF-9', 'Dashboard de estadísticas y tendencias para coordinadores'],
        ['RF-10', 'Límite de tasa y validación de contenido sobre los endpoints públicos nuevos'],
      ],
      [900, 8460]
    ),
    spacer(),
    para([pending('Punto abierto: '), normal('la propuesta v1.0 incluía un puente automático de reenvío a iNaturalist (RF-J6) para conservar el aporte científico del programa a plataformas externas. El alcance descrito para esta versión no lo menciona explícitamente. Se debe confirmar con la Gobernación si ese requisito se mantiene — de ser así, se debe sumar al desglose de esfuerzo de la sección 9 (~5 días adicionales).')]),
    spacer(),

    // ── 9. Esfuerzo ───────────────────────────────────────────────────────────
    pageBreak(),
    heading1('9.  Trabajo estimado y desglose de esfuerzo'),
    para('Se usa la misma tarifa/día implícita del contrato vigente (18.000.000 COP/mes ÷ 20 días laborales = 900.000 COP/día), consistente con la lógica ya aplicada en la propuesta v1.0.'),
    heading2('9.1  Desglose por etapa'),
    makeTable(
      ['Etapa', 'Actividad', 'Días'],
      [
        ['0', 'Validación de alcance con TI y jurídica: RBAC de coordinadores, datos de menores, capacidad de disco', '3'],
        ['1', 'Modelos de datos: Participant, Coordinator, ParticipationRequest, PhotoLocker', '6'],
        ['2', 'Autenticación dual: registro, aprobación de cuentas, JWT, hash de contraseñas, cambio obligatorio', '8'],
        ['3', 'Solicitud de participación + carga de documentos', '7'],
        ['4', 'Bandeja de revisión de documentos por documento individual', '8'],
        ['5', 'Casillero virtual de fotos: subida, límites, integración con sharp', '7'],
        ['6', 'Bandeja de moderación de fotos (comité digital), cuotas en vivo', '7'],
        ['7', 'Panel de creación/gestión de cuentas de coordinador en admin', '4'],
        ['8', 'Dashboard de estadísticas y tendencias para coordinadores', '6'],
        ['9', 'Límite de tasa y seguridad de endpoints nuevos', '4'],
        ['10', 'Pruebas de carga, WCAG, Jest + SAST, documentación', '7'],
        ['11', 'Rollout a los 90 municipios: soporte y capacitación', '5'],
        ['', 'Total', '72 días ≈ 64.800.000 COP'],
      ],
      [900, 6560, 1900]
    ),
    spacer(),

    heading2('9.2  Encaje frente al alcance ya contratado'),
    makeTable(
      ['Si el esfuerzo de funciones 1–5 fue...', 'Esta ampliación representa'],
      [
        ['~90 días', '80% adicional'],
        ['~120 días', '60% adicional'],
        ['~150 días', '48% adicional'],
      ],
      [4680, 4680]
    ),
    spacer(),

    heading2('9.3  Soporte recurrente'),
    para('5.000.000 COP/mes ÷ 900.000 COP/día ≈ 5,6 días/mes de soporte recurrente — coherente con el rango de 4 a 6 días/mes que ya estimaba la propuesta v1.0 para funciones similares, ahora ampliado a soporte de coordinadores y mantenimiento del dashboard de estadísticas.'),
    spacer(),

    // ── 10. Propuesta económica ──────────────────────────────────────────────
    heading1('10.  Propuesta económica'),
    makeTable(
      ['Componente', 'Valor'],
      [
        ['Construcción inicial (pago único, aprobación de la adenda)', '65.000.000 COP'],
        ['Incremento mensual recurrente, a partir del mes de lanzamiento', '5.000.000 COP/mes adicionales sobre la mensualidad vigente de 18.000.000 COP'],
      ],
      [5600, 3760]
    ),
    spacer(),
    para('El desglose de la sección 9 sustenta ambas cifras con la misma tarifa/día que ya rige el contrato (900.000 COP/día): 72 días de construcción ≈ 64,8M ≈ 65M, y ~5,6 días/mes de soporte recurrente ≈ 5M/mes.'),
    spacer(),

    // ── 11. Riesgos ───────────────────────────────────────────────────────────
    pageBreak(),
    heading1('11.  Riesgos y puntos a validar con la Gobernación antes de iniciar'),
    bullet('**Cambio de alcance contractual:** esta ampliación excede las 16 funciones ya firmadas y debe formalizarse como adenda o nueva función, no ejecutarse como ajuste menor dentro del alcance existente.'),
    bullet('**Alternativa Microsoft Entra External ID (B2C):** vale la pena que TI evalúe si Entra External ID puede cubrir las identidades de participantes y coordinadores antes de confirmar el sistema de autenticación propio descrito en la sección 7.'),
    bullet('**Datos de menores de edad:** el programa incluye participantes menores de edad; almacenar documento de identidad, teléfono y fotografías exige validación con la oficina jurídica de la Gobernación más allá de la Ley 1581 ya cubierta — posible aplicación de la Ley 1098 (Código de Infancia y Adolescencia).'),
    bullet('**Capacidad de disco e infraestructura:** las estimaciones de esta propuesta (≈50 GB para fotos, ≈12 GB para documentos) deben confirmarse con quien administra el servidor Ubuntu on-premises.'),
    bullet('**Lista exacta de documentos de la solicitud de participación:** la sección 6.3 usa un set de referencia; debe confirmarse contra el formulario real que exige el programa.'),
    bullet('**Puente a iNaturalist:** confirmar si se mantiene el requisito de reenvío automático heredado de v1.0 (ver nota al final de la sección 8).'),
    spacer(),

    // ── 12. Próximos pasos ───────────────────────────────────────────────────
    heading1('12.  Próximos pasos'),
    bullet('Confirmar con la Gobernación la lista real de documentos de la solicitud de participación (sección 6.3) y si se mantiene el puente a iNaturalist (sección 8).'),
    bullet('Presentar esta propuesta al líder funcional de la Gobernación para su revisión.'),
    bullet('Formalizar el alcance como adenda o nueva función contractual antes de iniciar la Etapa 0.'),
    spacer(),

    para([
      normal('Nota: '),
      normal('este documento reemplaza por completo la Propuesta_Ampliacion_JPL_Participantes.md (v1.0, julio 2026). Las cifras y el desglose de esfuerzo de v1.0 quedan obsoletos y no deben citarse.', GRAY_TEXT)
    ]),
  ];

  return new Document({
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
  });
}

// ── Generar ────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const doc = buildCotizacion();
  const file = path.join(OUT_DIR, 'Cotizacion_Formal_Ampliacion_JPL_v2.docx');

  await Packer.toBuffer(doc).then(buf => fs.writeFileSync(file, buf));
  console.log(`✓ ${file}`);
}

main().catch(console.error);
