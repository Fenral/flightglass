/**
 * backspinProjection mot flight-golden.json.
 *
 * Kjører modulen over alle 5028 løste flight-caser og sammenligner
 * `signedBackspinRpm`, `backspin`, `rightCurveSpinRpm` og
 * `spinVectorRadPerSec` mot fixturen.
 *
 * TOLERANSE — hva som faktisk trengs: 0. Alle fire feltene reproduseres
 * bit-eksakt på alle 5028 caser. Oppgaven ba om 1e-9 relativt; det kjøres
 * som kontrakt-toleranse i den første testen, men den andre testen låser
 * det som faktisk stemmer: eksakt likhet. 1e-6 absolutt for rpm var ikke
 * nødvendig og brukes ikke.
 *
 * Ikke slakk noen av disse. Ryker eksakt-testen har operasjonsrekkefølgen i
 * `src/backspinProjection.js` endret seg, og det er en fysikkendring i
 * forkledning.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, report } from './_fixture.js';

import {
  backspinProjection,
  backspinAxis,
  launchDirectionUnit,
  rightCurveAxis,
  rightCurveSpinRpm,
  signedBackspinRpm,
  spinVectorRadPerSec,
} from '../src/backspinProjection.js';

/** Feltene modulen eier. */
const SCALAR_FIELDS = ['signedBackspinRpm', 'backspin', 'rightCurveSpinRpm'];

/** Relativ toleranse fra oppgaven. Absolutt tall, utledet per case. */
const RELATIVE_TOLERANCE = 1e-9;

/** Kjører modulen over hele fixturen én gang og gir [case, expected, actual]. */
function evaluated() {
  return loadFlight().map((c) => [
    c,
    c.out,
    backspinProjection({
      launchAngle: c.out.launchAngle,
      startDirection: c.out.startDirection,
      spinAxisUnit: c.out.spinAxisUnit,
      totalSpinRpm: c.out.totalSpinRpm,
    }),
  ]);
}

/** Én sammenligningsoppføring per felt per case, med gitt toleransefunksjon. */
function* comparisons(tolerance) {
  for (const [c, expected, actual] of evaluated()) {
    for (const field of SCALAR_FIELDS) {
      yield {
        id: c.id,
        field,
        expected: expected[field],
        actual: actual[field],
        tol: tolerance(expected[field]),
      };
    }
    for (let axis = 0; axis < 3; axis += 1) {
      yield {
        id: c.id,
        field: `spinVectorRadPerSec[${axis}]`,
        expected: expected.spinVectorRadPerSec[axis],
        actual: actual.spinVectorRadPerSec[axis],
        tol: tolerance(expected.spinVectorRadPerSec[axis]),
      };
    }
  }
}

/* ── Fixturen ───────────────────────────────────────────────────────────── */

test('alle 5028 caser er innenfor 1e-9 relativt', () => {
  const result = report('flight/backspinProjection@1e-9rel', comparisons(
    (expected) => RELATIVE_TOLERANCE * Math.abs(expected),
  ));

  assert.equal(result.total, 5028 * 6, 'seks felt per case');
  assert.ok(result.ok, `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`);
});

test('alle 5028 caser er bit-eksakte — dette er den bindende testen', () => {
  const result = report('flight/backspinProjection@exact', comparisons(() => 0));

  assert.equal(result.failed, 0, `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`);
  assert.equal(result.maxDeviation, 0, result.summary);
});

test('backspin er absoluttverdien av signedBackspinRpm, ikke en egen størrelse', () => {
  let checked = 0;
  for (const [c, expected, actual] of evaluated()) {
    assert.equal(actual.backspin, Math.abs(actual.signedBackspinRpm), c.id);
    assert.equal(actual.backspin, expected.backspin, c.id);
    checked += 1;
  }
  assert.equal(checked, 5028);
});

test('den kollineære grenen slår faktisk inn, og trengs', () => {
  // ENGINE-GAPS §5: `|,|p| − 1,| < 1e-14` → `sign(p) · totalSpinRpm`.
  // Uten grenen faller 495 caser ut. Teller den her så en «opprydding» som
  // fjerner grenen ikke kan påstå at den er død kode.
  let branchHits = 0;
  let wouldDiffer = 0;

  for (const [, expected] of evaluated()) {
    const launchDirection = launchDirectionUnit(
      expected.launchAngle,
      expected.startDirection,
    );
    const axis = backspinAxis(launchDirection);
    const projection =
      expected.spinAxisUnit[0] * axis[0] +
      expected.spinAxisUnit[1] * axis[1] +
      expected.spinAxisUnit[2] * axis[2];

    if (Math.abs(Math.abs(projection) - 1) < 1e-14) {
      branchHits += 1;
      if (projection * expected.totalSpinRpm !== expected.signedBackspinRpm) {
        wouldDiffer += 1;
      }
    }
  }

  assert.equal(branchHits, 692, 'caser der aksene er numerisk kollineære');
  assert.equal(wouldDiffer, 495, 'caser som bare stemmer med grenen');
});

/* ── Aksene ─────────────────────────────────────────────────────────────── */

test('launchDirectionUnit er en enhetsvektor med riktige fortegn', () => {
  // x = høyre, y = mål, z = opp.
  const straight = launchDirectionUnit(0, 0);
  assert.deepEqual(straight, [0, 1, 0]);

  const right = launchDirectionUnit(0, 30);
  assert.ok(right[0] > 0, 'positiv startDirection peker til høyre');

  const up = launchDirectionUnit(30, 0);
  assert.ok(up[2] > 0, 'positiv launchAngle peker opp');

  for (const [elevation, azimuth] of [[0, 0], [12.5, 2.66], [-3.75, -15], [35, 15]]) {
    const l = launchDirectionUnit(elevation, azimuth);
    assert.ok(Math.abs(Math.hypot(l[0], l[1], l[2]) - 1) < 1e-15, 'enhetslengde');
  }
});

test('backspinAxis faller tilbake til [1,0,0] når l er parallell med opp', () => {
  assert.deepEqual(backspinAxis([0, 0, 1]), [1, 0, 0]);
  assert.deepEqual(backspinAxis([0, 0, -1]), [1, 0, 0]);
  // launchAngle 90° treffer ikke fallbacken: `cos(90°)` er 6.1e-17, ikke 0,
  // så krysset er bittelite men positivt og normaliseringen står.
  const nearlyVertical = backspinAxis(launchDirectionUnit(90, 0));
  assert.ok(
    Math.abs(Math.hypot(...nearlyVertical) - 1) < 1e-15,
    'normalisert, ikke fallback',
  );

  // Rett fram: b = unit(l × z) = [1, 0, 0] uten at fallbacken brukes.
  assert.deepEqual(backspinAxis([0, 1, 0]), [1, 0, 0]);
});

test('b, l og m er et ortonormalt sett', () => {
  for (const [elevation, azimuth] of [[12.5, 2.66], [-3.75, -15], [35, 15], [0, 0]]) {
    const l = launchDirectionUnit(elevation, azimuth);
    const b = backspinAxis(l);
    const m = rightCurveAxis(l, b);

    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    assert.ok(Math.abs(dot(l, b)) < 1e-15, 'l ⟂ b');
    assert.ok(Math.abs(dot(l, m)) < 1e-15, 'l ⟂ m');
    assert.ok(Math.abs(dot(b, m)) < 1e-15, 'b ⟂ m');
    assert.ok(Math.abs(Math.hypot(m[0], m[1], m[2]) - 1) < 1e-15, '|m| = 1');
  }
});

/* ── Formen på returverdien ─────────────────────────────────────────────── */

test('returobjektet inneholder kun de fire feltene, alle endelige tall', () => {
  const out = backspinProjection({
    launchAngle: 12.503017767130947,
    startDirection: 2.66,
    spinAxisUnit: [0.9911921096163304, -0.08121498577258922, 0.10460558264397843],
    totalSpinRpm: 4619.511665274681,
  });

  assert.deepEqual(Object.keys(out).sort(), [
    'backspin',
    'rightCurveSpinRpm',
    'signedBackspinRpm',
    'spinVectorRadPerSec',
  ]);

  for (const field of SCALAR_FIELDS) {
    assert.ok(Number.isFinite(out[field]), field);
  }
  assert.equal(out.spinVectorRadPerSec.length, 3);
  assert.ok(out.spinVectorRadPerSec.every(Number.isFinite), 'spinVectorRadPerSec');

  // Ordrett fra fixturen, edge.spec-9-golden / spec-9.push-draw.
  assert.equal(out.signedBackspinRpm, 4591.301374571777);
  assert.equal(out.backspin, 4591.301374571777);
  assert.equal(out.rightCurveSpinRpm, -506.8968697418096);
  assert.deepEqual(out.spinVectorRadPerSec, [
    479.4932770071182, -39.288084814616745, 50.603382662736415,
  ]);
});

test('null spinn gir null i alle fire feltene', () => {
  const out = backspinProjection({
    launchAngle: 0,
    startDirection: 0,
    spinAxisUnit: [1, 0, 0],
    totalSpinRpm: 0,
  });

  assert.equal(out.signedBackspinRpm, 0);
  assert.equal(out.backspin, 0);
  assert.equal(out.rightCurveSpinRpm, 0);
  assert.deepEqual(out.spinVectorRadPerSec, [0, 0, 0]);
});

test('delfunksjonene komponerer til det samlede kallet', () => {
  const input = {
    launchAngle: 14.003017767130947,
    startDirection: 1.56,
    spinAxisUnit: [0.996066569800816, 0.0046373876183462065, -0.08848662701964236],
    totalSpinRpm: 3526.207052838138,
  };

  const l = launchDirectionUnit(input.launchAngle, input.startDirection);
  const b = backspinAxis(l);
  const m = rightCurveAxis(l, b);

  const combined = backspinProjection(input);

  assert.equal(
    combined.signedBackspinRpm,
    signedBackspinRpm(input.spinAxisUnit, b, input.totalSpinRpm),
  );
  assert.equal(
    combined.rightCurveSpinRpm,
    rightCurveSpinRpm(input.spinAxisUnit, m, input.totalSpinRpm),
  );
  assert.deepEqual(
    combined.spinVectorRadPerSec,
    spinVectorRadPerSec(input.spinAxisUnit, input.totalSpinRpm),
  );
});
