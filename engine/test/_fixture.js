/**
 * Golden-fixture loader og sammenligningshjelpere.
 *
 * Fixturene er fasit. Avviker motoren fra fixturen, er det motoren som har
 * feil. Denne filen leser dem, den tolker dem ikke.
 *
 * Filene er store (flight ≈ 20 MB, studio ≈ 4 MB). De leses og parses ÉN gang
 * per prosess og caches i modulscope. Returnerte arrays er frosne og deles
 * mellom alle kallere — muter dem aldri. Trenger du å sortere eller filtrere
 * destruktivt: kopier først, `[...loadFlight()]`.
 *
 * Ingen fysikk her. Ingen toleranser hardkodet her — hver test eier sin egen.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** engine/test/ → engine/ → prosjektrot → motor/export/ */
const EXPORT_DIR = join(import.meta.dirname, '..', '..', 'motor', 'export');

const FLIGHT_FILE = 'flight-golden.json';
const STUDIO_FILE = 'studio-golden.json';

/* ── Cache ──────────────────────────────────────────────────────────────── */

/** filnavn → parset JSON-dokument. Fylles ved første bruk. */
const documentCache = new Map();

/** filnavn → frossent array av caser med `out`. */
const solvedCache = new Map();

/** filnavn → frossent array av caser uten `out` (kastede kall). */
const failedCache = new Map();

function readDocument(fileName) {
  let doc = documentCache.get(fileName);
  if (doc === undefined) {
    doc = JSON.parse(readFileSync(join(EXPORT_DIR, fileName), 'utf8'));
    documentCache.set(fileName, doc);
  }
  return doc;
}

function solvedCases(fileName) {
  let cases = solvedCache.get(fileName);
  if (cases === undefined) {
    cases = Object.freeze(
      readDocument(fileName).cases.filter((c) => c != null && c.out != null),
    );
    solvedCache.set(fileName, cases);
  }
  return cases;
}

function failedCases(fileName) {
  let cases = failedCache.get(fileName);
  if (cases === undefined) {
    cases = Object.freeze(
      readDocument(fileName).cases.filter((c) => c != null && c.out == null),
    );
    failedCache.set(fileName, cases);
  }
  return cases;
}

/* ── Lasting ────────────────────────────────────────────────────────────── */

/**
 * Alle flight-caser som produserte et resultat.
 * 5028 av 5029; den ene som mangler er RK4-timeouten (`clubSpeed: 18000`).
 *
 * @returns {ReadonlyArray<{id: string, group: string, in: object, out: object}>}
 */
export function loadFlight() {
  return solvedCases(FLIGHT_FILE);
}

/**
 * Alle studio-caser som produserte et resultat. 2500 av 2500.
 * Studio-caser har i tillegg `validated` (true for iron, false for driver).
 *
 * @returns {ReadonlyArray<{id: string, group: string, validated: boolean, in: object, out: object}>}
 */
export function loadStudio() {
  return solvedCases(STUDIO_FILE);
}

/**
 * Flight-caser der den ekte motoren kastet. Disse har `error {name, message}`
 * i stedet for `out`. Én case i baseline.
 *
 * @returns {ReadonlyArray<{id: string, group: string, in: object, error: {name: string, message: string}}>}
 */
export function loadFlightErrors() {
  return failedCases(FLIGHT_FILE);
}

/** Studio-caser uten `out`. Tom i baseline; finnes for symmetri. */
export function loadStudioErrors() {
  return failedCases(STUDIO_FILE);
}

/** `_meta` fra flight-golden.json — grids, counts, units, declaredInputBounds. */
export function loadFlightMeta() {
  return readDocument(FLIGHT_FILE)._meta;
}

/** `_meta` fra studio-golden.json — grids, counts, units, constants. */
export function loadStudioMeta() {
  return readDocument(STUDIO_FILE)._meta;
}

/* ── Sammenligning ──────────────────────────────────────────────────────── */

/**
 * Absolutt toleranse. `|a − b| <= tol`.
 *
 * Regler, bevisst strenge fordi fixturen ikke inneholder ett eneste
 * ikke-endelig tall:
 *   - NaN er aldri nær noe, heller ikke NaN.
 *   - Eksakt likhet passerer alltid, også `Infinity === Infinity` og `-0 === 0`.
 *   - Ikke-tall passerer aldri.
 *
 * @param {number} a
 * @param {number} b
 * @param {number} [tol=0] absolutt toleranse, ikke relativ
 * @returns {boolean}
 */
export function close(a, b, tol = 0) {
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tol;
}

/**
 * Absolutt avvik mellom to verdier, brukt av `report`.
 * Tall → `|actual − expected|`. Ikke-tall → 0 ved likhet, `Infinity` ellers.
 */
function deviationOf(expected, actual) {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Number.isNaN(expected) || Number.isNaN(actual)) return Infinity;
    if (expected === actual) return 0;
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) return Infinity;
    return Math.abs(actual - expected);
  }
  return expected === actual ? 0 : Infinity;
}

/**
 * Teller pass/fail og finner maks avvik over en samling sammenligninger.
 * Ren funksjon — skriver ingenting. Kalleren bestemmer om og hvordan
 * `summary` presenteres.
 *
 * Hver oppføring i `results` kan ha:
 *   - `{ expected, actual, tol? }` — avvik og pass utledes (tol default 0)
 *   - `{ pass }`                   — eksplisitt utfall, overstyrer utledningen
 *   - `id?`, `field?`              — brukt i `summary` og `failures`
 *
 * @param {string} name etikett for denne sammenligningen, f.eks. "flight/carry"
 * @param {Iterable<{id?: string, field?: string, expected?: unknown, actual?: unknown, tol?: number, pass?: boolean}>} results
 * @param {{maxFailures?: number}} [options] hvor mange failures som beholdes (default 10)
 * @returns {{name: string, total: number, passed: number, failed: number,
 *            ok: boolean, maxDeviation: number, worst: object|null,
 *            failures: Array<object>, summary: string}}
 */
export function report(name, results, options = {}) {
  const maxFailures = options.maxFailures ?? 10;

  let total = 0;
  let passed = 0;
  let maxDeviation = 0;
  let worst = null;
  const failures = [];

  for (const entry of results) {
    total += 1;

    const deviation = deviationOf(entry.expected, entry.actual);
    const pass =
      entry.pass !== undefined ? entry.pass : deviation <= (entry.tol ?? 0);

    const record = {
      id: entry.id ?? null,
      field: entry.field ?? null,
      expected: entry.expected,
      actual: entry.actual,
      tol: entry.tol ?? 0,
      deviation,
      pass,
    };

    // `worst` peker på største avvik, uavhengig av pass/fail.
    if (worst === null || deviation > maxDeviation) {
      maxDeviation = deviation;
      worst = record;
    }

    if (pass) {
      passed += 1;
    } else if (failures.length < maxFailures) {
      failures.push(record);
    }
  }

  const failed = total - passed;
  const where =
    worst && (worst.id || worst.field)
      ? ` at ${worst.id ?? '?'}${worst.field ? '.' + worst.field : ''}`
      : '';
  const summary =
    failed === 0
      ? `${name}: ${passed}/${total} pass, maxDeviation ${maxDeviation}${where}`
      : `${name}: ${passed}/${total} pass, ${failed} FAIL, maxDeviation ${maxDeviation}${where}`;

  return {
    name,
    total,
    passed,
    failed,
    ok: failed === 0,
    maxDeviation,
    worst,
    failures,
    summary,
  };
}
