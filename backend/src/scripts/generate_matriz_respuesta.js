'use strict';
/**
 * generate_matriz_respuesta.js
 * Genera la Matriz de Respuesta a Observaciones de Revisión Documental:
 * recorre, uno por uno y en el mismo orden y formato del PDF de TI
 * (Observaciones_Revision_Documental Final.pdf), los hallazgos reportados
 * contra los 3 entregables, indicando cómo y dónde quedó resuelto cada uno.
 *
 * Uso: node src/scripts/generate_matriz_respuesta.js
 */

const { Document, Packer } = require('docx');
const fs = require('fs');
const path = require('path');
const {
  heading1, heading2, para, nota, bullet, spacer, makeTable, scorecard,
  portada, tocSection, footerConNumeracion, PAGE_MARGIN,
} = require('./lib/docx_helpers');

const OUT_DIR = path.join(__dirname, '../../../Documentos gobernacion/TI/Nuevos documentos TI');

const COLW = [2400, 900, 4160, 1900];

function buildDoc() {
  const children = [

    ...portada({
      titulo: 'RESPUESTA A OBSERVACIONES\nDE REVISIÓN DOCUMENTAL',
      subtitulo: 'Respuesta punto por punto a Observaciones_Revision_Documental Final.pdf',
      version: '1',
      fecha: '2026-07-29',
    }),

    ...tocSection(),

    heading1('Resumen Ejecutivo'),
    scorecard('Hallazgos recibidos: 26  ·  Resueltos: 26  ·  Abiertos: 0'),
    para('Este documento responde, uno por uno y en el mismo orden en que TI Gobernación los reportó, los 26 hallazgos de Observaciones_Revision_Documental Final.pdf contra los 3 entregables técnicos: Levantamiento de Requisitos de Software (FO-M7-P8-020), Propuesta de Ajustes Técnicos v2 (FO-M7-P8-021) y Documento Integral de Desarrollo (FO-M7-P8-023).'),
    para('El propio resumen de TI señaló tres hallazgos como bloqueantes para el trámite de aval: la ausencia de tabla de contenido (transversal a los 3 documentos), y en el Documento Integral, la ausencia de diagramas y de la sección de Metodología y Herramientas, y la falta del procedimiento de rollback. Los tres están resueltos — ver el detalle punto por punto a continuación.'),
    nota('La Propuesta Financiera (numeral 6 de la Propuesta de Ajustes Técnicos v2) inicialmente parecía un hallazgo abierto por falta de cifras. En realidad, Antioquia Natural se ejecuta mediante un contrato de prestación de servicios de 18 meses (ejecución, desarrollo y mantenimiento) ya suscrito entre el contratista y la Secretaría de Ambiente: los 3 ajustes técnicos de este documento están dentro de ese alcance ya contratado, sin costo adicional a cotizar por separado. El numeral 6 documenta esto explícitamente en cada tabla, en vez de dejar celdas vacías o marcadas "Pendiente".'),
    spacer(),

    // ── DOCUMENTO 1 ────────────────────────────────────────────────────────
    heading1('1. Levantamiento de Requisitos de Software y Propuesta Técnica'),
    para('Plantilla de referencia: FO-M7-P8-020. Archivo: Levantamiento_Requisitos_Antioquia_Natural.docx.'),
    makeTable(
      ['Hallazgo (TI)', 'Severidad', 'Cómo se resolvió', 'Sección'],
      [
        ['Portada: no cuenta con la portada sugerida en la plantilla.', 'Menor', 'Portada institucional agregada: Gobernación de Antioquia, Secretaría de Ambiente, título, versión y fecha.', 'Portada'],
        ['Tabla de contenido: pasa directo de la portada al numeral 1, sin índice.', 'Crítico', 'Tabla de contenido nativa de Word (campo TOC actualizable), insertada entre la portada y el numeral 1.', 'Antes del numeral 1'],
        ['Formato del documento: sin fuente, tamaño ni diseño de tablas definidos.', 'Menor', 'Fuente Arial en todo el documento (igual que exige la plantilla del Documento Integral), márgenes de página 2.5 cm, tablas con encabezado y color institucional consistentes.', 'Todo el documento'],
      ],
      COLW
    ),
    para('Lo que TI ya reportó como correcto (estructura de numerales, columnas de las tablas de Requerimientos Funcionales y No Funcionales, diccionario de acrónimos y Notas Finales) se mantuvo sin cambios de fondo.'),
    spacer(),

    // ── DOCUMENTO 2 ────────────────────────────────────────────────────────
    heading1('2. Propuesta de Ajustes Técnicos v2'),
    para('Plantilla de referencia: FO-M7-P8-021. Archivo: Propuesta_Ajustes_Tecnicos_v2_Antioquia_Natural.docx.'),
    makeTable(
      ['Hallazgo (TI)', 'Severidad', 'Cómo se resolvió', 'Sección'],
      [
        ['Portada: no cuenta con la portada sugerida en la plantilla.', 'Menor', 'Portada institucional agregada, igual que en los otros dos documentos.', 'Portada'],
        ['Tabla de contenido: pasa directo de la portada al contexto y alcance, sin índice.', 'Crítico', 'Tabla de contenido nativa de Word insertada antes del numeral 1.', 'Antes del numeral 1'],
        ['Propuesta financiera (numeral 6): no contiene ninguna cifra pese al impacto económico reconocido.', 'Crítico', 'Antioquia Natural se ejecuta mediante contrato de prestación de servicios de 18 meses (ejecución, desarrollo y mantenimiento) ya suscrito con la Secretaría de Ambiente. Los 3 ajustes están dentro de ese alcance contratado: cada tabla del numeral 6 documenta explícitamente "incluido en el contrato de servicios vigente, sin costo adicional", en vez de dejar cifras pendientes.', 'Numeral 6'],
        ['Control de Ajustes (numeral 9): no existe la tabla formal Versión/Fecha/Descripción/Responsable.', 'Crítico', 'Tabla de control de versiones agregada con el historial real: v1.0 (2026-06-24), v2.0 (2026-06-24) y v2.1 (2026-07-28), responsable Sebastián Guzmán Díaz en los 3 registros.', 'Numeral 9'],
        ['Diccionario de Definiciones y Acrónimos: no incluido pese a 15+ siglas técnicas sin definir.', 'Moderado', 'Diccionario agregado con 15 términos (SAST, MFA, OIDC, OAuth 2.0, PKCE, JWT, MSAL, TTL, RPO, RTO, SLA, CVE, OWASP, traceId, p50/p95/p99).', 'Numeral 7'],
        ['Compromisos (numeral 8): no aborda propiedad intelectual, confidencialidad ni Ley 1581, pese al cambio de custodia de identidades del Ajuste 1.', 'Moderado', 'Numeral 8 agregado, con referencia explícita a Ley 1581/Habeas Data ligada directamente al cambio de modelo de autenticación (Ajuste 1 — Entra ID).', 'Numeral 8'],
        ['Aprobación y Firmas (numeral 10): no hay bloque formal de firma.', 'Moderado', 'Bloque formal de firmas Cliente / Proveedor agregado.', 'Numeral 10'],
        ['Cronograma de Ejecución: usa columnas distintas a las de la plantilla y no tiene fechas concretas, solo duraciones relativas.', 'Menor', 'Tabla reformulada con columnas Fase/Módulo, Actividad Principal, Duración Estimada, Dependencia y Entregable. Las duraciones siguen siendo relativas porque el inicio depende de que TI provea Client ID/Tenant ID de Entra ID (Fase 0) — se explica así en el propio texto, no es una omisión.', 'Numeral 5'],
        ['Formato del documento: sin fuente, tamaño ni diseño de tablas definidos.', 'Menor', 'Fuente Arial, márgenes 2.5 cm, tablas con estilo institucional consistente.', 'Todo el documento'],
      ],
      COLW
    ),
    para('Lo que TI ya reportó como correcto (stack tecnológico más completo de lo exigido, y estructura consistente situación actual → propuesta → justificación → especificación técnica en cada ajuste) se mantuvo y se amplió en la sección 2.3.'),
    spacer(),

    // ── DOCUMENTO 3 ────────────────────────────────────────────────────────
    heading1('3. Documento Integral de Desarrollo'),
    para('Plantilla de referencia: FO-M7-P8-023. Archivo: Documento_Integral_Desarrollo_Antioquia_Natural.docx.'),
    makeTable(
      ['Hallazgo (TI)', 'Severidad', 'Cómo se resolvió', 'Sección'],
      [
        ['Portada: no cuenta con la portada sugerida en la plantilla.', 'Menor', 'Portada institucional agregada.', 'Portada'],
        ['Tabla de contenido: pasa directo de la portada al numeral 1, sin índice.', 'Crítico', 'Tabla de contenido nativa de Word insertada antes del numeral 1.', 'Antes del numeral 1'],
        ['Diagramas: no hay un solo diagrama, pese a exigirse en 4 puntos (arquitectura general, detallada, infraestructura, modelo de datos).', 'Crítico', 'Los 4 diagramas exigidos están incluidos, más 2 diagramas de secuencia adicionales (autofill iNaturalist y CRUD multi-foto) para los componentes de mayor complejidad de interacción, y un diagrama de flujo de publicación mensual.', 'Numerales 2.1, 2.2, 5.1, 6.2, 10'],
        ['Metodología y Herramientas (numeral 4 completo): no se menciona metodología, herramienta de gestión, control de versiones con Git ni CI/CD como sección propia.', 'Crítico', 'Numeral 4 agregado completo: metodología de desarrollo, herramientas de gestión de proyecto, control de versiones (GitFlow + Conventional Commits), CI/CD (pipeline de 7 pasos verificado), otras herramientas.', 'Numeral 4'],
        ['Manual Técnico (numeral 9): solo un resumen de 5 pasos remitiendo todo a README.md; falta especialmente el rollback.', 'Crítico', 'Numeral 9 desarrollado con 7 subsecciones, incluyendo el procedimiento de rollback explícito en 7 pasos (identificar commit estable, checkout, reinstalar dependencias, reiniciar, verificar, restaurar snapshot si aplica, notificar a TI).', 'Numeral 9.5'],
        ['Aprobación y Firmas (numeral 12): no hay bloque formal de firma pese a que el documento declara ser para trámite de aval.', 'Crítico', 'Numeral 12 agregado con 3 bloques de firma: Dirección TIC, líder funcional (Secretaría de Ambiente) y desarrollo.', 'Numeral 12'],
        ['Otras Cosas Técnicas (numeral 10): no hay diagramas de flujo para procesos clave (p. ej. publicación mensual).', 'Moderado', 'Diagrama de flujo de publicación mensual de galerías JPL / Guarda Cuencas agregado.', 'Numeral 10'],
        ['Justificación de tecnologías (3.2) y formato de tabla (3.1): tabla incompleta y sin explicar por qué se eligió cada tecnología.', 'Moderado', 'Tabla reformulada con las 5 columnas exigidas (Código, Tecnología, Versión, Descripción, Utilidad) y subsección 3.2 con la justificación de cada decisión técnica clave.', 'Numerales 3.1, 3.2'],
        ['Entornos, proveedores de nube y escalabilidad (5.2, 5.3, 5.5): no descritos de forma estructurada.', 'Moderado', 'Los 3 numerales desarrollados: entornos Dev/QA/Prod en tabla, proveedores de nube (solo MongoDB Atlas — frontend y backend corren en el servidor institucional, sin CDN externo), y consideraciones de escalabilidad.', 'Numerales 5.2, 5.3, 5.5'],
        ['Diccionario de datos (6.6): la plantilla exige Excel versionado aparte; no se menciona ni se incluye en la lista de documentos relacionados.', 'Moderado', 'Archivo Diccionario_Datos_BD_Comunidad_Antioquia_Natural.xlsx generado y entregado junto con este documento (una hoja por colección: JplPhoto, GcPhoto, CommunitySighting, Municipality), y agregado a la lista de Anexos.', 'Numeral 6.6 y Anexos'],
        ['Políticas de Seguridad (7.4): sin referencia a las políticas institucionales aplicables.', 'Moderado', 'Referencia explícita agregada a la Guía de Arquitectura y Buenas Prácticas de Desarrollo (sección 9, "Seguridad y Privacidad"): contraseñas en texto plano prohibidas, cifrado en tránsito obligatorio, licencias de terceros verificadas.', 'Numeral 7.4'],
        ['Estrategia y proceso de pruebas (numeral 8): se reportan resultados (51 tests, cobertura) pero no la estrategia, los tipos ni el proceso de gestión de defectos.', 'Menor', 'Numeral 8 desarrollado con 5 subsecciones: estrategia (enfoque de integración), tipos de prueba realizados, herramientas, cobertura, y proceso de ejecución y gestión de defectos.', 'Numeral 8'],
        ['Roadmap Técnico consolidado (numeral 11, opcional): referencias sueltas a futuro, sin roadmap consolidado.', 'Menor', 'Numeral 11 agregado, consolidando los 5 ítems pendientes a futuro (Entra ID, Ajustes 2 y 3 — Redis y SAST —, migración de Biodiversidad a MongoDB, activación de Azure DevOps, ampliación del catálogo).', 'Numeral 11'],
        ['Formato del documento: sin fuente, tamaño ni diseño de tablas definidos.', 'Menor', 'Fuente Arial, márgenes 2.5 cm, tablas con estilo institucional consistente.', 'Todo el documento'],
      ],
      COLW
    ),
    para('Lo que TI ya reportó como sobresaliente (la sección de Seguridad y la documentación del modelo de datos) se mantuvo y se amplió: la sección de Seguridad ahora tiene 5 subsecciones completas (7.1 a 7.5), y el modelo de datos incluye el diagrama DER exigido más el diccionario de datos en Excel.'),
    spacer(),

    heading1('Cierre'),
    para('Los 26 hallazgos reportados por TI Gobernación quedaron resueltos con evidencia verificable dentro de los propios documentos (portada, tabla de contenido, diagramas, secciones completas, referencias cruzadas correctas, y la Propuesta Financiera documentada como parte del contrato de servicios ya suscrito con la Secretaría de Ambiente). Ninguno de los 3 ajustes técnicos ni el Documento Integral quedan condicionados a un hallazgo abierto.'),
  ];

  return new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      footers: { default: footerConNumeracion() },
      children,
    }],
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const doc = buildDoc();
  const buf = await Packer.toBuffer(doc);
  const outFile = path.join(OUT_DIR, 'Respuesta_Observaciones_Revision_Documental_Antioquia_Natural.docx');
  fs.writeFileSync(outFile, buf);
  console.log('✓', outFile);
}

main().catch((err) => { console.error(err); process.exit(1); });
