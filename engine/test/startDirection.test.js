/**
 * §5.1 Startretning — verifikasjon mot golden-fixturen.
 *
 * Kjører `src/startDirection.js` over ALLE 5028 flight-caser som har `out`, og
 * sammenligner `startDirection` og `startFaceW` felt for felt.
 *
 * TOLERANSE — hva som faktisk trengs:
 * Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader.
 * Ingen av dem trengs. Modulen er BIT-EKSAKT mot fixturen i alle 5028 caser
 * for begge felt: maks absolutt avvik er nøyaktig `0`. Derfor kjører vi begge:
 *
 *   1. det oppgaven ba om — 1e-9 relativt, som `|forventet| × 1e-9`;
 *   2. en strengere lås på toleranse `0`.
 *
 * Lås nr. 2 er den som er verdt å beholde. Slår den ut mens nr. 1 fortsatt er
 * grønn, har noen endret rekkefølgen på flyttalloperasjonene — ikke fysikken.
 * Se kommentaren over `blendStartDirection` i modulen.
 *
 * Studio-fixturen har verken `startDirection` eller `startFaceW` (Studio
 * beregner aldri ballflukt, spec §11.3), så bare `loadFlight()` er relevant.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, loadFlightErrors, report } from './_fixture.js';

import {
  solveStartDirection,
  startFaceWeight,
  blendStartDirection,
} from '../src/startDirection.js';

import {
  startFaceWIntercept,
  startFaceWLoftSlope,
  startFaceWMinimum,
  startFaceWMaximum,
} from '../src/constants.js';

/* ── Toleranse ──────────────────────────────────────────────────────────── */

/** Det oppgaven ba om. `report` tar absolutt toleranse, så vi skalerer selv. */
const RELATIVE_TOLERANCE = 1e-9;

/** `|forventet| × 1e-9`. Ved forventet `0` blir dette `0` — og det passerer. */
function relativeTolerance(expected) {
  return Math.abs(expected) * RELATIVE_TOLERANCE;
}

/** Feiler høyt: hele summary pluss de første avvikende casene. */
function assertReport(result) {
  assert.ok(
    result.ok,
    `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`,
  );
}

/* ── Hele fixturen ──────────────────────────────────────────────────────── */

test('startFaceW matcher fixturen i alle 5028 caser (1e-9 relativt)', () => {
  const cases = loadFlight();
  assert.equal(cases.length, 5028, 'alle caser med out er med');

  const result = report(
    'flight/startFaceW',
    cases.map((c) => ({
      id: c.id,
      field: 'startFaceW',
      expected: c.out.startFaceW,
      actual: solveStartDirection(c.in).startFaceW,
      tol: relativeTolerance(c.out.startFaceW),
    })),
  );

  assertReport(result);
  assert.equal(result.total, cases.length, 'ingen case hoppet over');
});

test('startDirection matcher fixturen i alle 5028 caser (1e-9 relativt)', () => {
  const cases = loadFlight();

  const result = report(
    'flight/startDirection',
    cases.map((c) => ({
      id: c.id,
      field: 'startDirection',
      expected: c.out.startDirection,
      actual: solveStartDirection(c.in).startDirection,
      tol: relativeTolerance(c.out.startDirection),
    })),
  );

  assertReport(result);
  assert.equal(result.total, cases.length, 'ingen case hoppet over');
});

test('begge feltene er bit-eksakte — toleranse 0, avvik 0', () => {
  const cases = loadFlight();

  const results = [];
  for (const c of cases) {
    const mine = solveStartDirection(c.in);
    results.push({
      id: c.id,
      field: 'startFaceW',
      expected: c.out.startFaceW,
      actual: mine.startFaceW,
    });
    results.push({
      id: c.id,
      field: 'startDirection',
      expected: c.out.startDirection,
      actual: mine.startDirection,
    });
  }

  const result = report('flight/§5.1 bit-eksakt', results);

  assertReport(result);
  assert.equal(result.total, 2 * cases.length);
  assert.equal(
    result.maxDeviation,
    0,
    'maks absolutt avvik skal være nøyaktig 0, ikke bare lite',
  );
});

/* ── Spec §9 golden cases ───────────────────────────────────────────────── */

test('spec §9: de fire golden-casene gir startretningen spec-en oppgir', () => {
  const byId = new Map(loadFlight().map((c) => [c.id, c]));

  // Spec §9-tabellen oppgir Start avrundet til 2 desimaler. Fixturen er fasit
  // for full presisjon; tabellverdien er kryssjekken mot dokumentet.
  const expectedFromSpec = [
    ['spec-9.neutral-iron', 0],
    ['spec-9.d-plane-default', 1.56],
    ['spec-9.push-draw', 2.66],
    ['spec-9.no-flight', 0],
  ];

  for (const [id, specStart] of expectedFromSpec) {
    const c = byId.get(id);
    assert.ok(c, `fixturen har ${id}`);

    const mine = solveStartDirection(c.in);
    assert.equal(mine.startDirection, c.out.startDirection, `${id} mot fixtur`);
    assert.equal(mine.startFaceW, c.out.startFaceW, `${id} startFaceW`);
    assert.ok(
      Math.abs(mine.startDirection - specStart) < 5e-3,
      `${id} mot spec §9-tabellen: ${mine.startDirection} vs ${specStart}`,
    );
  }
});

/* ── Clamp-oppførsel ────────────────────────────────────────────────────── */

test('taket 0.88 slår inn under 4° loft — interceptet 0.90 er uoppnåelig', () => {
  // Fixture-belagt: hver case med dynamicLoft < 4 har startFaceW === 0.88.
  const lowLoft = loadFlight().filter((c) => c.in.dynamicLoft < 4);
  assert.ok(lowLoft.length > 0, 'fixturen har caser under 4° loft');

  for (const c of lowLoft) {
    assert.equal(c.out.startFaceW, startFaceWMaximum, `fixtur ${c.id}`);
    assert.equal(startFaceWeight(c.in.dynamicLoft), startFaceWMaximum, c.id);
  }

  // Baseline-detalj, ikke en bug å fikse: 0.90 forekommer aldri.
  assert.ok(startFaceWIntercept > startFaceWMaximum, '0.90 > 0.88');
  assert.equal(startFaceWeight(0), startFaceWMaximum);
  assert.equal(startFaceWeight(4), startFaceWMaximum);
  assert.ok(startFaceWeight(4 + 1e-9) < startFaceWMaximum, 'knekkpunkt ved 4°');
});

test('gulvet 0.60 krever loft ≥ 60° og er derfor ikke fixture-belagt', () => {
  // declaredInputBounds.dynamicLoft = [0, 50] → vekten bunner på 0.65.
  const minimumWeightInFixture = Math.min(
    ...loadFlight().map((c) => c.out.startFaceW),
  );
  assert.equal(minimumWeightInFixture, 0.65, 'laveste vekt i baseline');
  assert.ok(
    minimumWeightInFixture > startFaceWMinimum,
    'ingen case treffer gulvet — grenen er spec-belagt, ikke fixture-belagt',
  );

  // Grenen finnes likevel i spec §5.1 og reproduseres uendret.
  // (Selve divisjonen her er testens egen aritmetikk og lander på
  // 60.00000000000001 — derfor toleranse, ikke likhet.)
  const loftAtFloor =
    (startFaceWIntercept - startFaceWMinimum) / startFaceWLoftSlope;
  assert.ok(
    Math.abs(loftAtFloor - 60) < 1e-9,
    `knekkpunkt ≈ 60°, fikk ${loftAtFloor}`,
  );

  // FLYTTALLSDETALJ, ikke en bug å fikse: ved nøyaktig 60° gir
  // `0.9 − 0.005 × 60` verdien 0.6000000000000001 — én ULP over gulvet. Clampen
  // biter altså ikke på 60° selv, bare over. Reproduser oppførselen som den er.
  assert.equal(startFaceWeight(60), 0.6000000000000001);
  assert.ok(startFaceWeight(60) > startFaceWMinimum, 'gulvet biter ikke på 60°');
  assert.equal(startFaceWeight(60.0000001), startFaceWMinimum);
  assert.equal(startFaceWeight(1000), startFaceWMinimum);
});

/* ── Egenskaper, alle fixture-belagte ───────────────────────────────────── */

test('startDirection avhenger bare av face, path og loft', () => {
  // Fixturen beviser det: caser som deler (face, path, loft) men har ulik
  // clubSpeed/attackAngle har identisk startDirection og startFaceW.
  const groups = new Map();
  for (const c of loadFlight()) {
    const key = `${c.in.faceAngle}|${c.in.clubPath}|${c.in.dynamicLoft}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(c);
    else groups.set(key, [c]);
  }

  let compared = 0;
  for (const bucket of groups.values()) {
    const [first, ...rest] = bucket;
    for (const c of rest) {
      assert.equal(c.out.startDirection, first.out.startDirection, c.id);
      assert.equal(c.out.startFaceW, first.out.startFaceW, c.id);
      compared += 1;
    }
  }
  assert.ok(compared > 0, 'fixturen har grupper å sammenligne');

  // Og modulen gjør det samme: ekstra felt i shot state endrer ingenting.
  const base = { faceAngle: 2, clubPath: -5, dynamicLoft: 24 };
  assert.deepEqual(
    solveStartDirection({ ...base, clubSpeed: 30, attackAngle: -15 }),
    solveStartDirection({ ...base, clubSpeed: 150, attackAngle: 15 }),
  );
});

test('fortegnskontrakt: speiling av face og path speiler startretningen', () => {
  // Spec §4: + = høyre. Fixturen er symmetrisk om (face, path) = (0, 0).
  const byKey = new Map();
  for (const c of loadFlight()) {
    byKey.set(
      `${c.in.faceAngle}|${c.in.clubPath}|${c.in.dynamicLoft}`,
      c.out.startDirection,
    );
  }

  let checked = 0;
  for (const c of loadFlight()) {
    const mirrored = byKey.get(
      `${-c.in.faceAngle}|${-c.in.clubPath}|${c.in.dynamicLoft}`,
    );
    if (mirrored === undefined) continue;
    assert.equal(mirrored, -c.out.startDirection || 0, `speiling av ${c.id}`);
    checked += 1;
  }
  assert.ok(checked > 0, 'fixturen har speilbare par');
});

/* ── Delfunksjonene og feilcasen ────────────────────────────────────────── */

test('startFaceWeight og blendStartDirection utgjør solveStartDirection', () => {
  for (const c of loadFlight()) {
    const w = startFaceWeight(c.in.dynamicLoft);
    assert.equal(w, c.out.startFaceW, `${c.id} vekt`);
    assert.equal(
      blendStartDirection(c.in.faceAngle, c.in.clubPath, w),
      c.out.startDirection,
      `${c.id} blanding`,
    );
  }
});

test('RK4-timeout-casen har ingen out, men §5.1 er definert for input-en', () => {
  // `clubSpeed: 18000` kaster i RK4, ikke i §5.1. Fixturen har derfor ingen
  // fasit for startDirection her. Vi hevder ingen verdi — bare at modulen ikke
  // kaster og gir et endelig tall, slik den ekte motoren gjorde før den røk.
  const errors = loadFlightErrors();
  assert.equal(errors.length, 1);

  const mine = solveStartDirection(errors[0].in);
  assert.ok(Number.isFinite(mine.startDirection), 'endelig startDirection');
  assert.ok(Number.isFinite(mine.startFaceW), 'endelig startFaceW');
});

test('returobjektet har nøyaktig de to feltene og ingen presentasjonsdata', () => {
  const keys = Object.keys(
    solveStartDirection({ faceAngle: 2, clubPath: 0, dynamicLoft: 24 }),
  ).sort();
  assert.deepEqual(keys, ['startDirection', 'startFaceW']);
});
