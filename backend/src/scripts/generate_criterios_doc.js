/**
 * generate_criterios_doc.js
 * Genera el documento Word:
 *   Criterios_Seleccion_Especies_Antioquia_Biodiversa.docx
 *
 * Uso: node src/scripts/generate_criterios_doc.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  UnderlineType, PageBreak, TabStopType, TabStopPosition,
  convertInchesToTwip, Header, Footer, PageNumber, NumberFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion');

// ── Colores institucionales ───────────────────────────────────────────────────
const GREEN      = '018D38';
const DARK_GREEN = '0B5640';
const WHITE      = 'FFFFFF';
const TABLE_HDR  = '018D38';
const TABLE_ALT  = 'F0FFF4';
const GRAY_TEXT  = '555555';

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
  const runs = Array.isArray(children)
    ? children
    : [new TextRun({ text: children, size: 20, color: '333333' })];
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
      const cellRuns = typeof cell === 'string'
        ? [new TextRun({ text: cell, size: 18, color: '333333' })]
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

// ── Documento: Criterios de Selección de Especies ────────────────────────────

function buildCriterios() {
  const children = [

    // ── PORTADA ──────────────────────────────────────────────────────────────
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'CRITERIOS DE SELECCIÓN DE ESPECIES', bold: true, size: 48, color: GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Módulo de Biodiversidad - Antioquia Biodiversa', bold: true, size: 28, color: DARK_GREEN })],
      alignment: AlignmentType.CENTER, spacing: { after: 320 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Propuesta para el comité científico asesor', size: 22, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Gobernación de Antioquia - Secretaría de Ambiente', size: 20, color: '333333' })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Versión 1.0 - junio 2026', size: 20, color: GRAY_TEXT })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),

    pageBreak(),

    // ── SECCIÓN 1 - Objetivo y principio rector ───────────────────────────────
    heading1('1.  Objetivo y principio rector'),
    heading2('1.1.  Objetivo'),
    para([
      normal('Establecer los parámetros que guíen la selección de las '),
      bold('150 especies insignia'),
      normal(' que conformarán el catálogo inicial del módulo de biodiversidad. Estas especies serán la carta de presentación de la riqueza natural de Antioquia ante la ciudadanía, por lo que la selección debe equilibrar rigor científico, representatividad territorial y potencial educativo.')
    ]),
    spacer(),
    heading2('1.2.  Principio rector'),
    new Paragraph({
      children: [
        new TextRun({ text: '“Una especie debe estar en la app si su presencia le dice algo significativo al ciudadano sobre el territorio que habita - porque está amenazada, porque es única de aquí, porque cumple un rol ecológico clave, o porque cualquier persona puede encontrarla y reconocerla.”', size: 20, color: DARK_GREEN, italics: true })
      ],
      spacing: { before: 120, after: 120 },
      indent: { left: 720, right: 720 }
    }),
    spacer(),
    para([
      normal('No se trata de hacer un inventario exhaustivo sino de construir una '),
      bold('muestra representativa y pedagógicamente poderosa'),
      normal(' de la biodiversidad antioqueña.')
    ]),

    pageBreak(),

    // ── SECCIÓN 2 - Sistema de puntuación ────────────────────────────────────
    heading1('2.  Sistema de puntuación'),
    para([
      normal('Cada especie candidata se evalúa sobre '),
      bold('100 puntos'),
      normal(' distribuidos en 7 parámetros. El comité puede ajustar los pesos si lo considera necesario, pero debe documentar el cambio y aplicarlo consistentemente a todas las candidatas.')
    ]),
    spacer(),
    heading2('2.1.  Parámetros y pesos'),
    makeTable(
      ['Nº', 'Parámetro', 'Puntos máx.'],
      [
        ['P1', 'Estado de conservación (IUCN)', '20'],
        ['P2', 'Endemismo', '20'],
        ['P3', 'Rol ecológico', '15'],
        ['P4', 'Representación geográfica', '15'],
        ['P5', 'Valor educativo y cultural', '15'],
        ['P6', 'Disponibilidad fotográfica', '10'],
        ['P7', 'Diversidad taxonómica', '5'],
        ['', [new TextRun({ text: 'Total', bold: true, size: 18, color: '333333' })], [new TextRun({ text: '100', bold: true, size: 18, color: '333333' })]],
      ],
      [1200, 6360, 1800]
    ),
    spacer(),
    heading2('2.2.  Interpretación del puntaje total'),
    makeTable(
      ['Puntaje', 'Categoría', 'Decisión recomendada'],
      [
        ['80 – 100', 'Inclusión prioritaria', 'Debe estar en la versión 1.0 sin excepción'],
        ['60 – 79', 'Inclusión recomendada', 'Incluir dentro del cupo disponible del grupo'],
        ['40 – 59', 'Inclusión condicional', 'Incluir si queda cupo y cumple alguna cuota mínima'],
        ['< 40', 'Lista de espera', 'Reservar para Fase 2 o reemplazos'],
      ],
      [1800, 2800, 4760]
    ),

    pageBreak(),

    // ── SECCIÓN 3 - Los 7 parámetros ─────────────────────────────────────────
    heading1('3.  Los 7 parámetros de evaluación'),

    // P1
    heading2('P1 - Estado de conservación (IUCN)   │   Máximo: 20 puntos'),
    heading3('Por qué importa'),
    para('La app es una herramienta de sensibilización ambiental. Incluir especies amenazadas cumple una función de alerta ciudadana y refuerza la urgencia de la conservación. Al mismo tiempo, las especies en buen estado de conservación son necesarias para mostrar lo que el departamento aún tiene y debe proteger.'),
    heading3('Escala de puntuación'),
    makeTable(
      ['Categoría IUCN', 'Puntos', 'Justificación'],
      [
        ['CR - En peligro crítico', '20', 'Urgencia máxima; la visibilidad puede apoyar esfuerzos de rescate'],
        ['EN - En peligro', '17', 'Alta prioridad; tendencia poblacional negativa comprobada'],
        ['VU - Vulnerable', '13', 'Señal de alerta; presiones identificadas sobre el hábitat'],
        ['NT - Casi amenazada', '9', 'Tendencia preocupante; requiere monitoreo'],
        ['DD - Datos insuficientes', '7', 'El vacío de información es en sí mismo un mensaje de conservación'],
        ['LC - Preocupación menor', '4', 'Incluir si cumple otros criterios con puntaje alto'],
      ],
      [2800, 1000, 5560]
    ),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('Usar la **evaluación más reciente de la Lista Roja de la IUCN** (iucnredlist.org). Si existe una evaluación nacional (Resolución MADS) más reciente o más restrictiva, aplicar la más exigente.'),
    bullet('Especies con evaluación nacional EN o CR pero global LC deben recibir el puntaje de la categoría más amenazada.'),
    bullet('Si la especie no tiene evaluación IUCN pero sí está en los libros rojos colombianos, asignar la categoría equivalente.'),
    spacer(),
    heading3('Ejemplos en contexto antioqueño'),
    bullet('Dinomys branickii (pacarana) - VU global, EN Colombia → 17 pts'),
    bullet('Ateles hybridus (mono araña café) - CR → 20 pts'),
    bullet('Cattleya trianae (orquídea de navidad, flor nacional) - LC pero con alta presión de extracción → 4 pts (compensar con parámetros 2 y 5)'),
    spacer(),

    // P2
    heading2('P2 - Endemismo   │   Máximo: 20 puntos'),
    heading3('Por qué importa'),
    para('Las especies endémicas son el argumento más poderoso para la conservación local: si Antioquia o Colombia las pierde, desaparecen del planeta. Su inclusión refuerza el sentido de responsabilidad territorial y el orgullo regional.'),
    heading3('Escala de puntuación'),
    makeTable(
      ['Nivel de endemismo', 'Puntos', 'Descripción'],
      [
        ['Endémica de Antioquia', '20', 'Distribución confirmada exclusivamente en el departamento'],
        ['Endémica de la región andina colombiana', '16', 'Restringida a los Andes colombianos (incluye Antioquia)'],
        ['Endémica de Colombia', '13', 'Distribución confirmada solo en territorio colombiano'],
        ['Cuasi-endémica', '9', 'Más del 75% de su distribución global está en Colombia'],
        ['Nativa no endémica', '4', 'Presente en Colombia y otros países; originaria de la región'],
        ['Introducida / exótica', '0', 'No nativa de la región (excepción: razas criollas del grupo Animales Domésticos)'],
      ],
      [3200, 1000, 5160]
    ),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('Para **Animales Domésticos**, el criterio de endemismo se reemplaza por **origen patrimonial**: las razas criollas colombianas (ej. caballo de paso fino, cerdo criollo, gallina de campo) reciben 20 pts por su valor de patrimonio genético y cultural.'),
    bullet('El nivel de endemismo debe sustentarse con una fuente verificable (IUCN, SiB Colombia, literatura científica revisada por pares).'),
    bullet('En caso de distribución incierta o en revisión, asignar el nivel más conservador (menor puntaje) y documentar la fuente.'),
    spacer(),
    heading3('Ejemplos en contexto antioqueño'),
    bullet('Anolis heterodermus (lagartija de Antioquia) - endémica de la región andina → 16 pts'),
    bullet('Ranitomeya opisthomelas (rana venenosa del Chocó) - endémica de Colombia → 13 pts'),
    bullet('Morpho peleides (mariposa morpho azul) - nativa no endémica → 4 pts'),
    bullet('Caballo paso fino colombiano - raza criolla nacional → 20 pts (criterio especial)'),
    spacer(),

    pageBreak(),

    // P3
    heading2('P3 - Rol ecológico   │   Máximo: 15 puntos'),
    heading3('Por qué importa'),
    para('Los ecosistemas funcionan como redes de interdependencias. Incluir especies que cumplen roles ecológicos clave permite a la app explicar cómo funciona la naturaleza, no solo mostrar especies de forma aislada. Una especie con rol ecológico relevante “arrastra” la historia de todo un ecosistema.'),
    heading3('Roles ecológicos y su relevancia pedagógica'),
    makeTable(
      ['Rol', 'Descripción', 'Grupos donde aplica'],
      [
        ['Polinizador clave', 'Sin esta especie, ciertas plantas no se reproducen', 'Aves, mariposas, polillas'],
        ['Dispersor de semillas', 'Transporta semillas a nuevos sitios; regenera el bosque', 'Aves, mamíferos'],
        ['Controlador biológico', 'Regula poblaciones de insectos, roedores u otras presas', 'Aves rapaces, mamíferos, anfibios'],
        ['Especie paraguas', 'Su territorio de vida protege a decenas de otras especies', 'Mamíferos grandes, aves de grandes rangos'],
        ['Especie indicadora', 'Su presencia o ausencia revela el estado del ecosistema', 'Anfibios, peces, líquenes'],
        ['Ingeniero del ecosistema', 'Modifica físicamente el hábitat en beneficio de otros', 'Árboles estructurantes, ciertas aves'],
        ['Especie fundacional', 'Provee alimento, refugio o estructura a muchas otras', 'Árboles nativos, plantas hospederas'],
      ],
      [2400, 4160, 2800]
    ),
    spacer(),
    heading3('Escala de puntuación'),
    makeTable(
      ['Nivel', 'Puntos', 'Descripción'],
      [
        ['Rol único o insustituible', '15', 'La especie cumple un rol que ninguna otra en su ecosistema puede reemplazar fácilmente'],
        ['Rol importante, con alternativas', '11', 'Cumple un rol clave pero existen otras especies que lo complementan'],
        ['Rol moderado', '7', 'Participa en procesos ecológicos pero sin ser determinante'],
        ['Rol genérico', '3', 'Forma parte del ecosistema sin un rol especializado'],
        ['Rol no documentado', '1', 'No hay suficiente información sobre su función ecológica'],
      ],
      [3000, 1000, 5360]
    ),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('Una especie puede cumplir **varios roles simultáneamente** (ej. un árbol que es polinizado por colibríes, dispersado por monos y refugio de anfibios). En ese caso, puntuar por el rol más relevante o de mayor impacto.'),
    bullet('Para **Árboles Nativos**, priorizar especies con múltiples servicios ecosistémicos documentados (madera, frutos, sombra, fijación de nitrógeno, prevención de erosión).'),
    bullet('Para **Peces de Agua Dulce**, priorizar especies indicadoras de calidad hídrica, que permiten conectar el módulo de biodiversidad con el módulo de agua.'),
    spacer(),
    heading3('Ejemplos en contexto antioqueño'),
    bullet('Heliconia spp. + colibríes (mutualismo estricto) - rol único → 15 pts'),
    bullet('Cedrela odorata (cedro) - árbol fundacional, refugio, madera → 11 pts'),
    bullet('Morpho peleides - polinizador secundario, rol moderado → 7 pts'),
    bullet('Especie de pez endémica de río con datos limitados → 1 pt (compensar con parámetros 1 y 2)'),
    spacer(),

    pageBreak(),

    // P4
    heading2('P4 - Representación geográfica   │   Máximo: 15 puntos'),
    heading3('Por qué importa'),
    para([
      normal('La app sirve a ciudadanos de los 125 municipios de Antioquia. Si un habitante del Bajo Cauca o de Urabá no encuentra ninguna especie de su territorio, el proyecto pierde relevancia local. La representación geográfica garantiza que '),
      bold('cada antioqueño se vea reflejado'),
      normal(' en el catálogo.')
    ]),
    heading3('Escala de puntuación'),
    makeTable(
      ['Situación', 'Puntos', 'Descripción'],
      [
        ['Representante único de su subregión', '15', 'Es la única o mejor opción para representar una subregión aún sin especies seleccionadas'],
        ['Presente en 1–2 subregiones poco representadas', '12', 'Cubre subregiones que tienen menos de 5 especies ya seleccionadas'],
        ['Presente en 3–5 subregiones', '8', 'Distribución media, cubre varias subregiones'],
        ['Presente en 6–9 subregiones (amplia distribución)', '5', 'Especie generalista; su inclusión no resuelve déficits geográficos'],
      ],
      [3400, 1000, 4960]
    ),
    spacer(),
    heading3('Bonificación por ecosistema poco representado (+3 pts, no supera el máximo)'),
    para('Asignar +3 puntos adicionales si la especie habita un ecosistema que el catálogo tiene sub-representado al momento de la evaluación:'),
    bullet('Selva húmeda del Pacífico / Urabá'),
    bullet('Bosque seco tropical (Norte, Magdalena Medio)'),
    bullet('Humedales y ciénagas (Bajo Cauca)'),
    bullet('Páramo y subpáramo (Oriente)'),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('El puntaje de este parámetro **es dinámico**: cambia a medida que se van seleccionando especies. El comité debe evaluarlo en el contexto de las especies ya aprobadas.'),
    bullet('Mantener un mapa de calor actualizado durante la sesión de evaluación mostrando cuántas especies tiene cada subregión.'),
    bullet('Para **Animales Domésticos**, la representación geográfica se evalúa por regiones productivas (ganadería, porcicultura, avicultura) más que por subregiones de biodiversidad.'),
    spacer(),
    heading3('Las 9 subregiones y sus ecosistemas prioritarios'),
    makeTable(
      ['Subregión', 'Ecosistema prioritario a representar'],
      [
        ['Valle de Aburrá', 'Bosque urbano, quebradas intervenidas, jardines'],
        ['Oriente', 'Bosque andino, páramo, embalses'],
        ['Suroeste', 'Zona cafetera, bosque nublado, cañaduzales'],
        ['Norte', 'Bosque seco, cañón del Cauca, serranías'],
        ['Occidente', 'Bosque húmedo, ríos caudalosos, cañones'],
        ['Urabá', 'Selva húmeda tropical, manglar, ciénagas costeras'],
        ['Bajo Cauca', 'Humedales, ciénagas, sabanas inundables'],
        ['Nordeste', 'Bosque andino, ríos auríferos, páramos locales'],
        ['Magdalena Medio', 'Bosque seco tropical, grandes ríos, serranías'],
      ],
      [3000, 6360]
    ),
    spacer(),

    pageBreak(),

    // P5
    heading2('P5 - Valor educativo y cultural   │   Máximo: 15 puntos'),
    heading3('Por qué importa'),
    para('La app está dirigida a ciudadanía general, no a biólogos. Una especie con alto valor educativo genera conexión emocional, facilita el aprendizaje y aumenta la probabilidad de que el usuario comparta el contenido. El valor cultural local refuerza la identidad territorial.'),
    heading3('5A. Reconocibilidad visual (0 – 5 pts)'),
    para('¿Puede un ciudadano sin formación biológica identificar esta especie con rasgos visibles a simple vista?'),
    makeTable(
      ['Puntos', 'Descripción'],
      [
        ['5', 'Rasgos únicos y llamativos (color, forma, tamaño) que permiten identificación inmediata'],
        ['3', 'Identificable con orientación básica; rasgos distintivos presentes pero no inmediatos'],
        ['1', 'Identificación difícil sin guía especializada; confundible con otras especies'],
      ],
      [1200, 8160]
    ),
    spacer(),
    heading3('5B. Riqueza de historia natural (0 – 5 pts)'),
    para('¿Tiene comportamientos, ciclos de vida, adaptaciones o estrategias de supervivencia llamativas que se puedan contar de forma atractiva?'),
    makeTable(
      ['Puntos', 'Descripción'],
      [
        ['5', 'Historia natural rica: comportamientos únicos, adaptaciones extremas, relaciones simbióticas sorprendentes o ciclo de vida extraordinario'],
        ['3', 'Aspectos interesantes documentados, pero no excepcionales'],
        ['1', 'Poca información o historia natural común y sin rasgos diferenciadores'],
      ],
      [1200, 8160]
    ),
    spacer(),
    heading3('5C. Valor cultural y conexión cotidiana (0 – 5 pts)'),
    para('¿Tiene esta especie nombre vernáculo propio, presencia en tradiciones, gastronomía, medicina popular o aparece en zonas accesibles para el ciudadano?'),
    makeTable(
      ['Puntos', 'Descripción'],
      [
        ['5', 'Nombre vernáculo ampliamente usado + presencia en cultura local (coplas, medicina, agricultura) + avistable en zonas urbanas o periurbanas'],
        ['3', 'Nombre vernáculo conocido o presencia cultural moderada'],
        ['1', 'Sin nombre vernáculo propio o sin conexión cultural documentada'],
      ],
      [1200, 8160]
    ),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('Para **Polillas**, el valor educativo es el parámetro más importante para compensar su menor visibilidad pública. Priorizar las de mayor impacto visual (colores, tamaño) y las que tienen una historia natural sorprendente (ej. mimetismo, relaciones con plantas hospederas).'),
    bullet('Para **Árboles Nativos**, el valor cultural es especialmente relevante: árboles con historia en los municipios, usados en medicina tradicional o citados en coplas y tradición oral tienen un vínculo emocional fuerte con las comunidades.'),
    spacer(),
    heading3('Ejemplos en contexto antioqueño'),
    bullet('Amazilia tzacatl (colibrí) - colores llamativos (5) + mutualismo con heliconias (5) + común en jardines de todo Antioquia (5) = 15 pts'),
    bullet('Leptodactylus pentadactylus (rana de hojarasca) - reconocible (3) + historia de canto nocturno (3) + conocida en tradición popular (3) = 9 pts'),
    bullet('Tabebuia rosea (guayacán rosado) - árbol emblema, floración espectacular (5) + símbolo de renovación en muchos municipios (5) + fácil de ver en parques y vías (5) = 15 pts'),
    spacer(),

    pageBreak(),

    // P6
    heading2('P6 - Disponibilidad fotográfica   │   Máximo: 10 puntos'),
    heading3('Por qué importa'),
    para('Sin fotografía de calidad no hay ficha en la app. Este parámetro es el más práctico y puede ser determinante para la viabilidad del catálogo en los tiempos del proyecto. Una especie con puntaje alto en otros criterios pero sin opción fotográfica realista debe quedar en lista de espera.'),
    heading3('Escala de puntuación'),
    makeTable(
      ['Nivel', 'Puntos', 'Descripción'],
      [
        ['A - Foto propia disponible', '10', 'El proyecto ya cuenta con una foto de calidad adecuada (≥ 800 px lado menor, bien iluminada, especie nítida)'],
        ['B - Foto libre disponible', '8', 'Existe fotografía con licencia compatible (CC BY, CC BY-SA, dominio público) en iNaturalist, Wikimedia Commons o GBIF'],
        ['C - Foto encargable a corto plazo', '5', 'Especie fotografiable mediante una salida de campo planificada en Antioquia; fotógrafo naturalista identificado'],
        ['D - Foto difícil o de largo plazo', '2', 'Especie nocturna estricta, subterránea, de zonas de muy difícil acceso o que requiere equipo especializado'],
      ],
      [3000, 1000, 5360]
    ),
    spacer(),
    heading3('Fuentes de imágenes recomendadas (niveles A y B)'),
    bullet('**iNaturalist** (inaturalist.org) - licencias CC por foto; verificar individualmente'),
    bullet('**Wikimedia Commons** (commons.wikimedia.org) - CC o dominio público'),
    bullet('**GBIF** (gbif.org) - licencias variables; revisar cada imagen'),
    bullet('**Instituto Humboldt** (humboldt.org.co) - banco de imágenes de biodiversidad colombiana'),
    bullet('**ProAves Colombia** - banco fotográfico de aves'),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('Las especies con nivel D **no se excluyen automáticamente** si tienen puntaje muy alto en los parámetros 1 y 2 (CR + endémica). En ese caso se incluyen en la selección pero se marcan como “pendiente de foto” y se activa gestión especial con fotógrafos naturalistas o instituciones científicas.'),
    bullet('Para el comité: al evaluar el nivel fotográfico, adjuntar el enlace o referencia de la foto identificada (nivel A o B) o el nombre del fotógrafo contactado (nivel C).'),
    spacer(),

    // P7
    heading2('P7 - Diversidad taxonómica   │   Máximo: 5 puntos'),
    heading3('Por qué importa'),
    para('Dentro de cada grupo taxonómico, es fácil concentrar la selección en las familias más conocidas o carisáticas (ej. colibríes en aves, mariposas morpho en lepiدópteros). Este parámetro penaliza la sobrerrepresentación y premia la diversidad de familias dentro del catálogo.'),
    heading3('Escala de puntuación'),
    makeTable(
      ['Situación al momento de evaluar', 'Puntos'],
      [
        ['La familia de esta especie **no tiene ninguna** representante seleccionada aún', '5'],
        ['La familia tiene **1 representante** seleccionado', '3'],
        ['La familia tiene **2 representantes** seleccionados', '1'],
        ['La familia tiene **3 o más representantes** seleccionados', '0'],
      ],
      [7560, 1800]
    ),
    spacer(),
    heading3('Consideraciones especiales'),
    bullet('Este parámetro es **dinámico**: debe actualizarse conforme el comité va seleccionando especies en cada sesión. Se recomienda llevar un conteo de familias en tiempo real.'),
    bullet('**Excepción justificada:** si el comité determina que una familia tiene excepcional riqueza y relevancia en Antioquia (ej. Orchidaceae, Trochilidae), puede acordar aumentar el umbral de 3 a 5 representantes antes de asignar 0 puntos, pero debe documentar la decisión.'),
    bullet('Para **Animales Domésticos**, reemplazar “familia taxonómica” por “especie doméstica”: no más de 2 razas de la misma especie (bovinos, porcinos, equinos, etc.).'),

    pageBreak(),

    // ── SECCIÓN 4 - Cuotas mínimas por grupo ─────────────────────────────────
    heading1('4.  Cuotas mínimas por grupo'),
    para([
      normal('Independientemente del puntaje, la selección final debe respetar una distribución mínima por grupo para garantizar que la app represente toda la biodiversidad antioqueña.')
    ]),
    spacer(),
    makeTable(
      ['Grupo', 'Cupo sugerido', 'Cupo mínimo'],
      [
        ['🦜 Aves', '30', '25'],
        ['🐸 Anfibios y Reptiles', '25', '20'],
        ['🦋 Mariposas', '20', '15'],
        ['🌸 Orquídeas', '20', '15'],
        ['🌳 Árboles Nativos', '18', '13'],
        ['🐟 Peces de Agua Dulce', '15', '10'],
        ['🦌 Mamíferos', '13', '10'],
        ['🦗 Polillas', '10', '7'],
        ['🐄 Animales Domésticos', '7', '5'],
        [[new TextRun({ text: 'Total', bold: true, size: 18, color: '333333' })], [new TextRun({ text: '158', bold: true, size: 18, color: '333333' })], [new TextRun({ text: '120', bold: true, size: 18, color: '333333' })]],
      ],
      [5760, 1800, 1800]
    ),
    spacer(),
    para([
      normal('El comité puede redistribuir cupos entre grupos, pero la suma total debe mantenerse en '),
      bold('150 (±8 por margen de ajuste)'),
      normal('.')
    ]),

    pageBreak(),

    // ── SECCIÓN 5 - Criterios de exclusión automática ─────────────────────────
    heading1('5.  Criterios de exclusión automática'),
    para('Las siguientes condiciones excluyen una especie sin necesidad de evaluarla:'),
    spacer(),
    bullet('Distribución restringida a zonas de conflicto activo o acceso imposible'),
    bullet('Identificación requiere análisis de laboratorio (sin rasgos visuales diagnósticos a nivel de especie)'),
    bullet('Taxón en revisión sistemática activa (nombre científico inestable o en disputa)'),
    bullet('Especie exótica invasora sin valor educativo específico para el contexto antioqueño'),
    bullet('Especie con registros dudosos o sin confirmación en Antioquia en los últimos 10 años'),

    pageBreak(),

    // ── SECCIÓN 6 - Ficha de evaluación ──────────────────────────────────────
    heading1('6.  Ficha de evaluación por especie'),
    para([
      normal('Usar una fila por especie y una columna por evaluador. El puntaje final es el '),
      bold('promedio de los evaluadores'),
      normal('.')
    ]),
    spacer(),
    makeTable(
      ['Criterio', 'Opciones', 'Puntos / ___ pts'],
      [
        ['P1 - Estado IUCN', 'CR=20 | EN=17 | VU=13 | NT=9 | DD=7 | LC=4', '___ / 20'],
        ['P2 - Endemismo', 'Antioquia=20 | Andina=16 | Colombia=13 | Cuasi=9 | Nativa=4 | Exótica=0', '___ / 20'],
        ['P3 - Rol ecológico', 'Único=15 | Importante=11 | Moderado=7 | Genérico=3 | Sin datos=1', '___ / 15'],
        ['P4 - Representación geo', 'Rep.único=15 | Subr.poco cubiertas=12 | 3-5 subr.=8 | Amplia=5', '___ / 15'],
        ['P5a - Reconocibilidad', 'Alta=5 | Media=3 | Baja=1', '___ / 5'],
        ['P5b - Historia natural', 'Rica=5 | Moderada=3 | Pobre=1', '___ / 5'],
        ['P5c - Valor cultural', 'Alto=5 | Medio=3 | Bajo=1', '___ / 5'],
        ['P6 - Foto disponible', 'A=10 | B=8 | C=5 | D=2', '___ / 10'],
        ['P7 - Diversidad taxonómica', 'Nueva familia=5 | 1 rep.=3 | 2 rep.=1 | 3+ rep.=0', '___ / 5'],
        [[new TextRun({ text: 'TOTAL', bold: true, size: 18, color: '333333' })], '', [new TextRun({ text: '___ / 100', bold: true, size: 18, color: '333333' })]],
      ],
      [2600, 4800, 1960]
    ),
    spacer(),
    para([
      bold('Categoría: '),
      normal('[ ] Prioritaria (80–100)   [ ] Recomendada (60–79)   [ ] Condicional (40–59)   [ ] Lista de espera (<40)')
    ]),
    spacer(),
    para([bold('Notas / justificaciones: '), normal('_________________________________________________')]),
    para([bold('Fuente fotográfica identificada (nivel A o B): '), normal('________________________________')]),

    pageBreak(),

    // ── SECCIÓN 7 - Entregables y calendario ─────────────────────────────────
    heading1('7.  Entregables y calendario'),
    heading2('7.1.  Lo que el comité debe entregar'),
    makeTable(
      ['Documento', 'Descripción'],
      [
        ['Lista definitiva de 150 especies', 'Nombre científico, nombre común ES/EN, grupo, IUCN, subregiones, endemismo, puntaje total'],
        ['Fichas de evaluación', 'Una por especie con puntajes por criterio y notas de cada evaluador'],
        ['Ficha de contenido por especie', 'Descripción ES/EN (máx. 150 palabras c/u), cómo identificarla, curiosidad, rol ecológico - para cargar en la app'],
        ['Mapa de cobertura', 'Tabla subregión × grupo mostrando cuántas especies cubre cada combinación'],
        ['Estado fotográfico', 'Nivel A/B/C/D por especie con fuente o contacto identificado'],
        ['Lista de espera', '30–40 especies adicionales ordenadas por puntaje para reemplazos o Fase 2'],
      ],
      [3000, 6360]
    ),
    spacer(),
    heading2('7.2.  Calendario sugerido para el comité'),
    makeTable(
      ['Etapa', 'Actividad', 'Duración sugerida'],
      [
        ['Preparación', 'El equipo técnico entrega lista candidata de ~300 especies con datos básicos (IUCN, distribución, endemismo)', '2 semanas previas'],
        ['Sesión 1', 'Evaluación individual por miembros del comité', '1 semana'],
        ['Sesión 2', 'Reunión plenaria: consolidar puntajes, resolver empates, aplicar cuotas', '1 día'],
        ['Sesión 3', 'Revisión de estado fotográfico y confirmación de lista final', '3 días'],
        ['Entrega', 'Lista definitiva + fichas de contenido al equipo técnico', '-'],
      ],
      [2000, 5560, 1800]
    ),
    spacer(),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'Antioquia Biodiversa - Gobernación de Antioquia', size: 18, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Propuesta elaborada como punto de partida para la discusión del comité científico asesor', size: 18, color: GRAY_TEXT, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
  ];

  return new Document({
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
  });
}

// ── Generar archivo ───────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const doc = buildCriterios();
  const outFile = path.join(OUT_DIR, 'Criterios_Seleccion_Especies_Antioquia_Biodiversa.docx');

  await Packer.toBuffer(doc).then(buf => fs.writeFileSync(outFile, buf));
  console.log(`✓ ${outFile}`);
}

main().catch(console.error);
