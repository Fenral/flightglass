/**
 * geometry3d mot flight-golden.json — spec §5.2.
 *
 * Fixturen er fasit. Avviker modulen, er det modulen som har feil.
 *
 * Alle 5028 loste flight-caser kjores gjennom `solveGeometry3D`, og alle atte
 * feltene sammenlignes mot `out`. Ingen case hoppes over, ingen gruppe filtreres
 * bort: geometrien avhenger bare av A, P, L, F, og alle caser har alle fire.
 *
 * TOLERANSE — hva som faktisk trengs:
 *   Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader.
 *   Ingen av delene trengs. Maks avvik er 0 pa samtlige atte felt i samtlige
 *   5028 caser. Derfor tester vi begge nivaene:
 *     1. det bestilte kravet (1e-9 relativt) — kontrakten
 *     2. bit-eksakthet (avvik nøyaktig 0) — den faktiske baselinen
 *   Test 2 fanger ULP-regresjoner test 1 aldri ville sett. Faller test 2 mens
 *   test 1 star, er en formel omgruppert; se ULP-notatene i geometry3d.js.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, loadFlightErrors, loadFlightMeta, close, report } from './_fixture.js';
import { solveGeometry3D } from '../src/geometry3d.js';

/** Skalarfelt i `out` som denne modulen eier. */
const SCALAR_FIELDS = [
  'spinLoft3DDeg',
  'signedVerticalSpinLoftDeg',
  'spinAxis',
  'horizontalSpinLoftComponent',
  'verticalSpinLoftComponent',
];

/** Vektorfelt i `out` som denne modulen eier. Alle [x, y, z]. */
const VECTOR_FIELDS = ['spinAxisUnit', 'clubVelocityUnit', 'faceNormalUnit'];

/**
 * Relativ toleranse omgjort til absolutt for én sammenligning.
 * `|actual − expected| <= rel × max(1, |expected|)`. Nedre gulv pa 1 gjor at
 * felt som er eksakt 0 i fixturen (spinAxis i 713 caser) ikke far toleranse 0
 * gjennom bakdoren — de ma fortsatt treffe innenfor `rel`.
 */
function absoluteTolerance(expected, relative) {
  return relative * Math.max(1, Math.abs(expected));
}

/** Genererer én sammenligningsoppforing per felt per case. */
function* comparisons(cases, relative) {
  for (const c of cases) {
    const got = solveGeometry3D(c.in);

    for (const field of SCALAR_FIELDS) {
      const expected = c.out[field];
      yield {
        id: c.id,
        field,
        expected,
        actual: got[field],
        tol: absoluteTolerance(expected, relative),
      };
    }

    for (const field of VECTOR_FIELDS) {
      for (let i = 0; i < 3; i += 1) {
        const expected = c.out[field][i];
        yield {
          id: c.id,
          field: `${field}[${i}]`,
          expected,
          actual: got[field][i],
          tol: absoluteTolerance(expected, relative),
        };
      }
    }
  }
}

/* ── Dekning ────────────────────────────────────────────────────────────── */

test('alle 5028 loste caser er relevante og kjores', () => {
  const cases = loadFlight();
  const meta = loadFlightMeta();

  assert.equal(cases.length, meta.counts.returned);
  assert.equal(cases.length, 5028);

  for (const c of cases) {
    for (const key of ['attackAngle', 'clubPath', 'dynamicLoft', 'faceAngle']) {
      assert.equal(typeof c.in[key], 'number', `${c.id}: in.${key}`);
    }
    for (const field of [...SCALAR_FIELDS, ...VECTOR_FIELDS]) {
      assert.ok(field in c.out, `${c.id}: out.${field} mangler`);
    }
  }
});

/* ── Kontrakten: 1e-9 relativt ──────────────────────────────────────────── */

test('alle atte felt matcher fixturen innenfor 1e-9 relativt', () => {
  const cases = loadFlight();
  const summary = report('geometry3d/1e-9-relativ', comparisons(cases, 1e-9));

  assert.equal(summary.total, cases.length * (SCALAR_FIELDS.length + VECTOR_FIELDS.length * 3));
  assert.ok(
    summary.ok,
    `${summary.summary}\n${JSON.stringify(summary.failures, null, 2)}`,
  );
});

/* ── Baselinen: bit-eksakt ──────────────────────────────────────────────── */

test('alle atte felt er bit-eksakte — maks avvik 0', () => {
  const cases = loadFlight();
  const summary = report('geometry3d/bit-eksakt', comparisons(cases, 0));

  assert.ok(
    summary.ok,
    `${summary.summary}\n${JSON.stringify(summary.failures, null, 2)}`,
  );
  assert.equal(summary.maxDeviation, 0, summary.summary);
  assert.equal(summary.failed, 0);
});

/* ── Per-case-regnskap, sa en feil peker pa en case og ikke bare et felt ─── */

test('hver enkelt case matcher pa alle felt samtidig', () => {
  const cases = loadFlight();
  let passed = 0;
  const failures = [];

  for (const c of cases) {
    const got = solveGeometry3D(c.in);
    const bad = [];

    for (const field of SCALAR_FIELDS) {
      if (!close(got[field], c.out[field])) bad.push(field);
    }
    for (const field of VECTOR_FIELDS) {
      for (let i = 0; i < 3; i += 1) {
        if (!close(got[field][i], c.out[field][i])) bad.push(`${field}[${i}]`);
      }
    }

    if (bad.length === 0) passed += 1;
    else if (failures.length < 10) failures.push({ id: c.id, in: c.in, bad });
  }

  assert.equal(
    passed,
    cases.length,
    `${passed}/${cases.length} caser bit-eksakte\n${JSON.stringify(failures, null, 2)}`,
  );
});

/* ── De to grenene fixturen krever og spec §5.2 ikke nevner ─────────────── */

test('gren A: spinAxis er eksakt 0 i alle 713 caser med faceToPath === 0', () => {
  const cases = loadFlight();
  const planar = cases.filter((c) => c.in.faceAngle - c.in.clubPath === 0);

  assert.equal(planar.length, 713);
  assert.ok(
    planar.every((c) => c.out.spinAxis === 0),
    'fixturen har ikke null overalt der face og path deler vertikalplan',
  );
  assert.ok(
    planar.every((c) => solveGeometry3D(c.in).spinAxis === 0),
    'modulen gir ikke eksakt null der',
  );

  // Gapet som gjor gren A umulig a skille fra en epsilon-snapping:
  // minste `spinAxis` ulik null i hele fixturen.
  const smallestNonZero = Math.min(
    ...cases.map((c) => Math.abs(c.out.spinAxis)).filter((x) => x !== 0),
  );
  assert.ok(smallestNonZero > 1, `minste verdi ulik 0 er ${smallestNonZero}`);
});

test('gren B: spinLoft3DDeg er signedVerticalSpinLoftDeg nar planar og positiv', () => {
  const cases = loadFlight();
  const planar = cases.filter((c) => c.in.faceAngle - c.in.clubPath === 0);

  const positive = planar.filter((c) => c.out.signedVerticalSpinLoftDeg > 0);
  const negative = planar.filter((c) => c.out.signedVerticalSpinLoftDeg < 0);
  assert.equal(positive.length, 607);
  assert.equal(negative.length, 77);

  assert.ok(
    positive.every((c) => c.out.spinLoft3DDeg === c.out.signedVerticalSpinLoftDeg),
    'positiv gren',
  );
  assert.ok(
    negative.every((c) => c.out.spinLoft3DDeg !== Math.abs(c.out.signedVerticalSpinLoftDeg)),
    'negativ gren folger ikke absoluttverdien',
  );

  // Speilparet som beviser at forgreningen ikke kan vaere en ren funksjon av
  // geometrien: identisk |v × n| og identisk v · n, ulikt svar.
  const mirrored = (attackAngle) =>
    cases.find(
      (c) =>
        c.in.faceAngle === 0 &&
        c.in.clubPath === 0 &&
        c.in.dynamicLoft === 0 &&
        c.in.attackAngle === attackAngle,
    );
  const up = mirrored(-7.5);
  const down = mirrored(7.5);
  assert.ok(up && down, 'speilparet finnes i fixturen');
  assert.equal(up.out.spinLoft3DDeg, 7.5);
  assert.equal(down.out.spinLoft3DDeg, 7.499999999999999);
  assert.equal(solveGeometry3D(up.in).spinLoft3DDeg, 7.5);
  assert.equal(solveGeometry3D(down.in).spinLoft3DDeg, 7.499999999999999);
});

/* ── Degenerert akse ────────────────────────────────────────────────────── */

test('degenerert kryssprodukt gir spinAxisUnit [1, 0, 0]', () => {
  const cases = loadFlight();
  const degenerate = cases.filter(
    (c) =>
      c.in.faceAngle === c.in.clubPath && c.in.dynamicLoft === c.in.attackAngle,
  );

  assert.equal(degenerate.length, 29);
  for (const c of degenerate) {
    const got = solveGeometry3D(c.in);
    assert.deepEqual(got.spinAxisUnit, [1, 0, 0], c.id);
    assert.deepEqual(c.out.spinAxisUnit, [1, 0, 0], c.id);
    assert.equal(got.spinLoft3DDeg, 0, c.id);
    assert.equal(got.spinAxis, 0, c.id);
  }

  // Fallbacken deles ikke mellom kall.
  const a = solveGeometry3D(degenerate[0].in).spinAxisUnit;
  a[0] = 42;
  assert.deepEqual(solveGeometry3D(degenerate[0].in).spinAxisUnit, [1, 0, 0]);
});

/* ── Endelighet, ogsa for casen den ekte motoren kastet pa ──────────────── */

test('ingen ikke-endelige tall, heller ikke for RK4-timeout-casen', () => {
  const inputs = [
    ...loadFlight().map((c) => ({ id: c.id, in: c.in })),
    ...loadFlightErrors().map((c) => ({ id: c.id, in: c.in })),
  ];
  assert.equal(inputs.length, 5029);

  for (const { id, in: input } of inputs) {
    const got = solveGeometry3D(input);
    for (const field of SCALAR_FIELDS) {
      assert.ok(Number.isFinite(got[field]), `${id}: ${field} = ${got[field]}`);
    }
    for (const field of VECTOR_FIELDS) {
      assert.equal(got[field].length, 3, `${id}: ${field} lengde`);
      assert.ok(
        got[field].every(Number.isFinite),
        `${id}: ${field} = ${got[field]}`,
      );
    }
  }
});

/* ── Renhet ─────────────────────────────────────────────────────────────── */

test('solveGeometry3D er ren og gir ingen presentasjonsdata', () => {
  const input = { attackAngle: -4, clubPath: 0, dynamicLoft: 24, faceAngle: 0 };
  const first = solveGeometry3D(input);
  const second = solveGeometry3D({ ...input, clubSpeed: 90, club: '7iron' });

  assert.deepEqual(first, second, 'clubSpeed og club pavirker ikke geometrien');
  assert.notEqual(first.clubVelocityUnit, second.clubVelocityUnit, 'friske arrays');

  const expected = [
    'clubVelocityUnit',
    'faceNormalUnit',
    'spinAxisUnit',
    'spinLoft3DDeg',
    'signedVerticalSpinLoftDeg',
    'spinAxis',
    'horizontalSpinLoftComponent',
    'verticalSpinLoftComponent',
  ];
  assert.deepEqual(Object.keys(first).sort(), [...expected].sort());
  for (const value of Object.values(first)) {
    assert.ok(
      typeof value === 'number' || Array.isArray(value),
      'bare tall og vektorer — ingen strenger, farger eller UI-felt',
    );
  }
});
