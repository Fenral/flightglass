#!/usr/bin/env node
/**
 * FYSIKKLINT — spec §11 krav 2 og 5, håndhevet mekanisk (oppdrag D, D58).
 *
 * Feiler `npm test` hvis en fil utenfor `engine/` inneholder fysikk eller
 * enhetskonvertering. Det er nøyaktig lekkasjen prosjektet finnes for å
 * hindre: en renderer som regner selv er en udokumentert motorkopi.
 *
 * ── Virkeområde ────────────────────────────────────────────────────────────
 * Skanner .js, .mjs og .html. Hopper over:
 *   engine/        fysikken BOR her — det er hele poenget
 *   _reference/    designreferanser, ikke produktkode
 *   _explore/      seks døde HTML-skisser fra fargeutforskningen. Inneholder
 *                  banematematikk og er BEVISST unntatt (eierbeslutning
 *                  2026-08-25): de er flagget i verifikasjonsrapporten og
 *                  skal ikke slettes, men de er heller ikke produktkode.
 *   motor/export/  fixturer og eksporterte data fra det gamle prosjektet
 *   node_modules/, .git/ og andre punktum-mapper
 *   denne fila     regeldefinisjonene inneholder mønstrene de leter etter
 *
 * ── De tre kategoriene (eierpresisering 2026-08-25) ───────────────────────
 *
 *   1. REKALKULERING av et utfall motoren allerede gir — BRUDD, overalt
 *      utenfor engine/. Markører: fysikk-konstantene (0.44704, yard→meter,
 *      7-jern-ankeret, ballradiene) og konverteringsidentifikatorene.
 *
 *   2. PROJEKSJON og interpolasjon MELLOM motorens tall — tillatt i
 *      adapter/ (det er adapterens jobb: traceShape, konvertering),
 *      forbudt i app/ og alt annet. Markør: trigonometri. Trenger en
 *      renderer en vinkel som geometri, skal adapteren levere den.
 *
 *   3. REN SKJERMGEOMETRI — avstand mellom to allerede konverterte
 *      piksler o.l. IKKE fysikk, alltid tillatt. Derfor er `Math.hypot`
 *      IKKE i regellista (eksempel: `Math.hypot(liveEnd − pinEnd)` i
 *      app/ball-flight/bf.js — px-avstand mellom to landingsmerker).
 *
 * Lista er en start, ikke en fasit — utvid den når ny gjeld får et mønster.
 * Falske positive løses ved å flytte regnestykket dit det hører hjemme
 * (kategori 2 → adapter/), ikke ved å myke opp regelen. En gråsone avgjøres
 * av eier, ikke av et unntak man legger inn her.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const SCAN_EXTENSIONS = ['.js', '.mjs', '.html'];

/** Mapper som aldri traverseres (toppnivå eller hvor som helst). */
const SKIP_DIR_NAMES = new Set(['node_modules']);

/** Stier relativt rot (skråstrek-normalisert) som ikke skannes. */
const SKIP_PATHS = [
  'engine',        // fysikken BOR her
  '_reference',    // designreferanser
  '_explore',      // døde skisser (eierunntak 2026-08-25, flagget i rapporten)
  'motor/export',  // fixturer fra det gamle prosjektet
  '_source',       // skrivebeskyttet mock-fasit (D77) — leses, bygges aldri.
  'swift',         // Swift-portens verksted (D90): probe-*.mjs ER differensial-
                   // verifisering av fdlibm mot plattform-libm — samme rolle som
                   // aero-reference.js. Porten har egne, strengere porter
                   // (bit-eksakthet mot 7528 caser + V8-differensial).
                   // Kopiene som ommales i app/ skannes som all annen produktkode.
  '_artifacts',    // byggeutdata for artifact-publisering (D117): inliner
                   // motoren med vilje. Kildene de bygges fra skannes som før.
];

/** Filer som er unntatt fordi de ER regelverket. */
const EXCLUDE_FILES = new Set(['tools/lint-physics.mjs']);

/**
 * Reglene. `allow` er en liste over stier (relativt rot) der mønsteret er
 * lovlig — brukt for det ene konverteringsstedet.
 */
export const RULES = Object.freeze([
  {
    // KATEGORI 2: projeksjon/interpolasjon mellom motortall. Tillatt i
    // adapter/ (traceShape m.fl.), forbudt alle andre steder utenfor engine/.
    // Math.hypot er BEVISST utelatt — kategori 3, ren skjermgeometri.
    name: 'kat 2 — trigonometri (projeksjon) utenfor adapter/ (Math.sin/cos/tan/asin/acos/atan/atan2)',
    re: /\bMath\s*\.\s*(?:a?sin|a?cos|a?tan2?)\s*\(/,
    allowPrefix: ['adapter/src/', 'adapter/test/'],
    // KATEGORI 3-unntak, verifisert manuelt av strøm D 2026-08-25 — trig uten
    // ett eneste motorfelt. Sentral liste med vilje, IKKE fil-pragma: en
    // pragma lar enhver fremtidig fil frikjenne seg selv; denne lista krever
    // at unntaket revideres HER, med begrunnelse. Re-verifiser ved endring.
    allow: [
      // Kamerarigg: slerp-vekter på interpolasjonsparameteren + fov→focal.
      // Ingen motorfelt i fila overhodet (grep-verifisert).
      'app/ball-flight/impact-camera.js',
      // Nøyaktig tre linjer (802–806): atan2/sin/cos på SKJERMPUNKTER for
      // pilhoder på en målelinje. Px inn, px ut.
      'app/ball-flight/impact.html',
    ],
  },
  {
    name: 'kat 1 — mph→m/s-konstanten 0.44704',
    re: /0\.44704/,
  },
  {
    name: 'kat 1 — yard→meter-konstanten 0.9144',
    re: /0\.9144/,
  },
  {
    name: 'kat 1 — 7-jern-ankeret 1.275116456035 (dragCompatibilityScale)',
    re: /1\.275116456035/,
  },
  {
    name: 'kat 1 — ballradius-literal (0.021335 / 0.021336 / 0.0213)',
    re: /0\.021335|0\.021336|0\.0213(?![0-9])/,
  },
  {
    name: 'kat 1 — motorens konverteringskonstanter utenfor det ene konverteringsstedet',
    re: /\b(?:yardToMetre|mphToMps)\b/,
    // Testene får referere konstanten for å BEVISE at konverteringen er
    // eksakt — samme logikk som aero-differensialtesten: verifikasjon mot en
    // uavhengig kilde er ikke duplisert produksjon. Kun disse tre stiene.
    allow: [
      'adapter/src/convert.js',
      'adapter/test/convert.test.js',
      'adapter/test/displayFlight.test.js',
    ],
  },
]);

/**
 * Skann én tekst. Ren funksjon — testbar uten filsystem.
 * @param {string} text filinnhold
 * @param {string} relPath skråstrek-normalisert sti relativt rot
 * @returns {Array<{line: number, rule: string, excerpt: string}>}
 */
export function scanText(text, relPath) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (const rule of RULES) {
    if (rule.allow?.includes(relPath)) continue;
    if (rule.allowPrefix?.some((p) => relPath.startsWith(p))) continue;
    for (let i = 0; i < lines.length; i += 1) {
      if (rule.re.test(lines[i])) {
        hits.push({ line: i + 1, rule: rule.name, excerpt: lines[i].trim().slice(0, 120) });
      }
    }
  }
  return hits;
}

function shouldSkip(relPath, isDirectory) {
  const name = relPath.split('/').pop();
  if (name.startsWith('.')) return true;
  if (isDirectory && SKIP_DIR_NAMES.has(name)) return true;
  return SKIP_PATHS.some((p) => relPath === p || relPath.startsWith(`${p}/`));
}

/**
 * Skann hele repoet. @returns {{scanned: number, violations: Array}}
 */
export function scanRepo(root = ROOT) {
  let scanned = 0;
  const violations = [];

  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (shouldSkip(relPath, entry.isDirectory())) continue;
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), relPath);
        continue;
      }
      if (!SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) continue;
      if (EXCLUDE_FILES.has(relPath)) continue;
      scanned += 1;
      const text = readFileSync(join(dir, entry.name), 'utf8');
      for (const hit of scanText(text, relPath)) {
        violations.push({ path: relPath, ...hit });
      }
    }
  };

  walk(root, '');
  return { scanned, violations };
}

/* Kjør som script — men ikke når modulen importeres av testen. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { scanned, violations } = scanRepo();
  if (violations.length > 0) {
    console.error(`fysikklint: ${violations.length} funn i ${scanned} skannede filer.\n`);
    for (const v of violations) {
      console.error(`  ${v.path}:${v.line}  ${v.rule}`);
      console.error(`      ${v.excerpt}`);
    }
    console.error('\nKat 1 (rekalkulering) hører hjemme i engine/. Kat 2 (projeksjon/');
    console.error('interpolasjon) hører hjemme i adapter/. Flytt regnestykket dit —');
    console.error('ikke myk opp regelen. Ren skjermgeometri (px-avstander) er alltid lov.');
    process.exit(1);
  }
  console.log(`fysikklint: ${scanned} filer skannet, 0 funn.`);
}
