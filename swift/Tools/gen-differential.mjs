/**
 * Leveranse 3 — differensialkjoring mot JS-motoren.
 *
 * Genererer 500 TILFELDIGE NYE leveringer utenfor fixturen, kjorer dem gjennom
 * JS-motoren (referanseimplementasjonen, D71) og skriver resultatet i samme
 * format som `flight-golden.json`, slik at Swift-testene kan gjenbruke
 * fixturelasteren uendret.
 *
 * Poenget er a bevise at portene er enige ogsa DER FASITEN IKKE FINNES.
 * Fixturen er et grovt rutenett (5 verdier per akse); en port kan i prinsippet
 * treffe hvert rutenettpunkt og likevel divergere mellom dem.
 *
 * ── Determinisme ───────────────────────────────────────────────────────────
 * PRNG-en er en fast xorshift32 med pinnet fro. Samme kjoring gir samme 500
 * leveringer, hver gang, pa enhver maskin. `Math.random` ville gjort
 * differensialkjoringen umulig a reprodusere — og en test du ikke kan kjore
 * pa nytt er ikke et bevis.
 *
 * ── Utenfor fixturen ───────────────────────────────────────────────────────
 * Hver generert levering sjekkes mot alle 5029 fixture-inputtupler. Treffer
 * den et rutenettpunkt, forkastes den. I praksis skjer det aldri med
 * kontinuerlige verdier, men vakten star der fordi pastanden «utenfor
 * fixturen» ellers er utestet.
 *
 * Kjoring:  node swift/Tools/gen-differential.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { solveFlight } from '../../engine/src/solveFlight.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT_DIR = join(HERE, '..', 'Tests', 'Fixtures');
const OUT_FILE = join(OUT_DIR, 'differential-flight.json');

const COUNT = 500;
const SEED = 0x5eed_f11a;

/* ── Deterministisk PRNG ─────────────────────────────────────────────────── */

let state = SEED >>> 0;
function rnd() {
  state ^= state << 13; state >>>= 0;
  state ^= state >>> 17;
  state ^= state << 5;  state >>>= 0;
  return state / 4294967296;
}

/** Uniform i [lo, hi]. */
function uniform(lo, hi) {
  return lo + (hi - lo) * rnd();
}

/* ── Inputgrenser ────────────────────────────────────────────────────────── */

const flightDoc = JSON.parse(
  readFileSync(join(ROOT, 'motor', 'export', 'flight-golden.json'), 'utf8'),
);

const bounds = flightDoc._meta.declaredInputBounds;

/**
 * Fixturens inputtupler, som strenger, for a garantere at ingen generert
 * levering tilfeldigvis lander pa et rutenettpunkt.
 */
const fixtureKeys = new Set(
  flightDoc.cases.map((c) =>
    [c.in.clubSpeed, c.in.faceAngle, c.in.clubPath, c.in.attackAngle, c.in.dynamicLoft].join('|'),
  ),
);

/* ── Generering ──────────────────────────────────────────────────────────── */

const cases = [];
let attempts = 0;
let collisions = 0;
let threw = 0;

while (cases.length < COUNT) {
  attempts += 1;
  if (attempts > COUNT * 100) {
    throw new Error('Klarte ikke generere nok unike leveringer.');
  }

  const shot = {
    clubSpeed: uniform(bounds.clubSpeed[0], bounds.clubSpeed[1]),
    faceAngle: uniform(bounds.faceAngle[0], bounds.faceAngle[1]),
    clubPath: uniform(bounds.clubPath[0], bounds.clubPath[1]),
    attackAngle: uniform(bounds.attackAngle[0], bounds.attackAngle[1]),
    dynamicLoft: uniform(bounds.dynamicLoft[0], bounds.dynamicLoft[1]),
  };

  const key = [
    shot.clubSpeed, shot.faceAngle, shot.clubPath, shot.attackAngle, shot.dynamicLoft,
  ].join('|');
  if (fixtureKeys.has(key)) { collisions += 1; continue; }

  const id = `diff.${String(cases.length).padStart(3, '0')}`;

  try {
    const out = solveFlight(shot);
    cases.push({ id, group: 'differential', in: shot, out });
  } catch (error) {
    // RK4-timeout og lignende. Tas med som `error`-case, i samme form som
    // fixturen bruker, slik at Swift-siden kan verifisere at porten kaster
    // pa nøyaktig de samme leveringene.
    threw += 1;
    cases.push({
      id, group: 'differential', in: shot,
      error: { name: error.name, message: error.message },
    });
  }
}

/* ── Skriving ────────────────────────────────────────────────────────────── */

const doc = {
  _meta: {
    purpose:
      'Differensialkjoring Swift-port mot JS-motor. 500 leveringer utenfor '
      + 'fixturen. Ikke en fasit — en enighetstest mellom to implementasjoner.',
    generator: 'swift/Tools/gen-differential.mjs',
    referenceImplementation: 'engine/src/solveFlight.js (D71)',
    seed: SEED,
    prng: 'xorshift32, fast fro — samme 500 leveringer hver kjoring',
    bounds,
    counts: {
      total: cases.length,
      returned: cases.filter((c) => c.out).length,
      threw,
      gridCollisionsRejected: collisions,
      attempts,
    },
    node: process.version,
  },
  cases,
};

mkdirSync(OUT_DIR, { recursive: true });
// Ingen mellomrom: filen er maskinlesbar, og 500 x 81 felt blir stort nok.
writeFileSync(OUT_FILE, JSON.stringify(doc), 'utf8');

const bytes = readFileSync(OUT_FILE).length;
console.log(`skrev ${OUT_FILE}`);
console.log(`  leveringer          : ${cases.length}`);
console.log(`  med resultat        : ${doc._meta.counts.returned}`);
console.log(`  kastet              : ${threw}`);
console.log(`  rutenettkollisjoner : ${collisions} (forkastet)`);
console.log(`  forsok              : ${attempts}`);
console.log(`  storrelse           : ${(bytes / 1024).toFixed(0)} KB`);
console.log(`  node                : ${process.version}`);
