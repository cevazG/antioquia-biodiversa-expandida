/**
 * optimize_photos.js
 *
 * Convierte todas las fotos del proyecto a WebP optimizado:
 *   - Especies (biodiversidad): 1200px lado largo, q82, ratio libre
 *   - JPL (comunidad):          1200px lado largo, q82, ratio libre
 *   - Guarda Cuencas (comunidad): 1200×675 recortado al centro, q82
 *
 * Elimina el archivo original (jpg/png) y actualiza species.json.
 *
 * Uso: node src/scripts/optimize_photos.js [--dry-run]
 */

require('dotenv').config();
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

const DRY = process.argv.includes('--dry-run');
const ROOT = path.join(__dirname, '../../../');  // Antioquia Biodiversa/

// ── Configuraciones por carpeta ────────────────────────────────────────────
const PROFILES = [
  {
    label:  'Biodiversidad (especies)',
    dir:    path.join(ROOT, 'biodiversidad/img/species'),
    mode:   'fit',       // redimensiona preservando ratio
    width:  1200,
    height: 1200,
    quality: 82,
    updateJson: path.join(ROOT, 'biodiversidad/data/species.json'),
  },
  {
    label:  'JPL (fotos biodiversidad)',
    dir:    path.join(ROOT, 'comunidad/jovenes_pa_lante/img/fotos/bio'),
    mode:   'fit',
    width:  1200,
    height: 1200,
    quality: 82,
  },
  {
    label:  'Guarda Cuencas (fotos cuencas)',
    dir:    path.join(ROOT, 'comunidad/guarda_cuencas/img/fotos'),
    mode:   'cover',     // recorta al centro para forzar 16:9
    width:  1200,
    height: 675,
    quality: 82,
  },
];

// ── Utilidades ─────────────────────────────────────────────────────────────
function humanKB(bytes) { return (bytes / 1024).toFixed(1) + ' KB'; }

async function convertFile(src, profile) {
  const dest = src.replace(/\.(jpe?g|png|webp)$/i, '.webp');

  const statBefore = fs.statSync(src).size;

  if (!DRY) {
    let pipeline = sharp(src);
    if (profile.mode === 'fit') {
      pipeline = pipeline.resize(profile.width, profile.height, {
        fit: 'inside', withoutEnlargement: true,
      });
    } else {
      pipeline = pipeline.resize(profile.width, profile.height, {
        fit: 'cover', position: 'centre',
      });
    }
    await pipeline.webp({ quality: profile.quality }).toFile(dest);

    // Borrar original solo si no es ya .webp (o si dest !== src)
    if (src !== dest) fs.unlinkSync(src);
  }

  const statAfter = DRY ? statBefore : fs.statSync(dest).size;
  const pct = (((statBefore - statAfter) / statBefore) * 100).toFixed(0);
  return { src, dest, before: statBefore, after: statAfter, pct: +pct };
}

function walkImages(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkImages(full));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ── Actualizar species.json ────────────────────────────────────────────────
function updateSpeciesJson(jsonPath, renames) {
  if (!fs.existsSync(jsonPath) || !renames.size) return 0;
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const IMG_ROOT = path.join(ROOT, 'biodiversidad/img/species');
  let changed = 0;

  for (const sp of data.species) {
    sp.photos = (sp.photos || []).map(p => {
      const isObj = typeof p === 'object';
      const url   = isObj ? p.url : p;
      const abs   = path.join(IMG_ROOT, url);
      const newAbs = renames.get(abs);
      if (!newAbs) return p;
      changed++;
      const newRel = path.relative(IMG_ROOT, newAbs).replace(/\\/g, '/');
      return isObj ? { ...p, url: newRel } : newRel;
    });
  }

  if (!DRY) fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  return changed;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  if (DRY) console.log('── MODO DRY-RUN (no se escriben archivos) ──\n');

  let totalBefore = 0, totalAfter = 0, totalFiles = 0;

  for (const profile of PROFILES) {
    const files = walkImages(profile.dir);
    if (!files.length) {
      console.log(`[${profile.label}] Sin archivos para convertir.\n`);
      continue;
    }

    console.log(`[${profile.label}] ${files.length} archivo(s):`);
    const renames = new Map();  // src → dest

    for (const src of files) {
      const result = await convertFile(src, profile);
      renames.set(result.src, result.dest);
      totalBefore += result.before;
      totalAfter  += result.after;
      totalFiles++;
      const rel = path.relative(profile.dir, result.src);
      const arrow = result.src === result.dest ? '(ya es webp)' : `→ ${path.basename(result.dest)}`;
      console.log(`  ${rel}  ${arrow}  ${humanKB(result.before)} → ${humanKB(result.after)}  (-${result.pct}%)`);
    }

    // Actualizar JSON de referencias si aplica
    if (profile.updateJson) {
      const changed = updateSpeciesJson(profile.updateJson, renames);
      if (changed) console.log(`  ✓ species.json actualizado (${changed} referencias)\n`);
    } else {
      console.log();
    }
  }

  const saved = totalBefore - totalAfter;
  console.log('────────────────────────────────────────');
  console.log(`Archivos procesados : ${totalFiles}`);
  console.log(`Peso antes          : ${humanKB(totalBefore)}`);
  console.log(`Peso después        : ${humanKB(totalAfter)}`);
  console.log(`Ahorro total        : ${humanKB(saved)} (-${((saved/totalBefore)*100).toFixed(0)}%)`);
  if (DRY) console.log('\nVuelve a correr sin --dry-run para aplicar los cambios.');
}

main().catch(err => { console.error(err); process.exit(1); });
