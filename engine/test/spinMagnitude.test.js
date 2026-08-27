/**
 * §5.4 Spinnstørrelse mot `flight-golden.json`.
 *
 * Fixturen er fasit. Feiler en test her, er det `src/spinMagnitude.js` som har
 * feil — ikke fixturen, og ikke toleransen.
 *
 * Alle 5028 løste flight-caser kjøres. Den ene som mangler `out` er
 * RK4-timeouten (`clubSpeed: 18000`); `loadFlight()` filtrerer den bort, og
 * den har ingenting med spinnstørrelse å gjøre.
 *
 * TOLERANSE — hva som faktisk trengs:
 *   Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader og
 *   rpm. Ingen av dem trengs. Med `sinSpinLoft3D = |v × n|` som inngang er alle
 *   tre feltene BIT-EKSAKTE over alle 5028 caser — maks avvik 0. Testene under
 *   kjører derfor på `tol: 0`. Se `src/spinMagnitude.js` for hvorfor
 *   kryssproduktets lengde, og ikke `sin(spinLoft3DDeg × π/180)`, er den
 *   riktige inngangen; den siste ville krevd 1e-11 absolutt.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, report } from './_fixture.js';
import {
  sinSpinLoft3DFromDegrees,
  spinCalibrationFor,
  spinDenominatorM,
  spinMagnitude,
  verticalSpinLoftDeg,
} from '../src/spinMagnitude.js';

/* ── Fixture-inngang ────────────────────────────────────────────────────── */

/**
 * `sinSpinLoft3D` slik motoren faktisk regner den: lengden av kryssproduktet
 * mellom køllehastighetens og flatenormalens enhetsvektorer. Begge er
 * enhetsvektorer, så |v × n| = sin(SpinLoft3D).
 *
 * Dette er fixture-forberedelse, ikke fysikk under test — begge vektorene
 * kommer ordrett fra `out` og eies av §5.2.
 */
function sinSpinLoft3DOf(out) {
  const [vx, vy, vz] = out.clubVelocityUnit;
  const [nx, ny, nz] = out.faceNormalUnit;
  return Math.hypot(vy * nz - vz * ny, vz * nx - vx * nz, vx * ny - vy * nx);
}

/** Kjører modulen over alle caser én gang. */
function solveAll() {
  return loadFlight().map((c) => ({
    id: c.id,
    group: c.group,
    in: c.in,
    out: c.out,
    sin: sinSpinLoft3DOf(c.out),
    got: spinMagnitude({
      clubSpeed: c.in.clubSpeed,
      dynamicLoft: c.in.dynamicLoft,
      attackAngle: c.in.attackAngle,
      sinSpinLoft3D: sinSpinLoft3DOf(c.out),
      ballSpeed: c.out.ballSpeed,
    }),
  }));
}

const solved = solveAll();

/** Bygger `report`-oppføringer for ett felt over alle caser. */
function entriesFor(field, tol = 0) {
  return solved.map((s) => ({
    id: s.id,
    field,
    expected: s.out[field],
    actual: s.got[field],
    tol,
  }));
}

/** Feiler høyt, med case-id og avvik i meldingen. */
function assertGreen(result, expectedMaxDeviation = 0) {
  assert.ok(
    result.ok,
    `${result.summary}\n` +
      result.failures
        .map(
          (f) =>
            `  ${f.id}.${f.field}: forventet ${f.expected}, fikk ${f.actual}` +
            ` (avvik ${f.deviation}, tol ${f.tol})`,
        )
        .join('\n'),
  );
  assert.ok(
    result.maxDeviation <= expectedMaxDeviation,
    `${result.name}: maks avvik ${result.maxDeviation} overskrider ${expectedMaxDeviation} — ${result.summary}`,
  );
}

/* ── Dekning ────────────────────────────────────────────────────────────── */

test('alle 5028 løste flight-caser kjøres', () => {
  assert.equal(solved.length, 5028);
  assert.ok(
    solved.every((s) => s.got && typeof s.got === 'object'),
    'hver case ga et resultatobjekt',
  );
});

/* ── De tre feltene, bit-eksakt ─────────────────────────────────────────── */

test('spinCalibration er bit-eksakt over alle 5028 caser', () => {
  const result = report('flight/spinCalibration', entriesFor('spinCalibration'));
  assert.equal(result.total, 5028);
  assertGreen(result);
});

test('spinRpmRaw er bit-eksakt over alle 5028 caser', () => {
  const result = report('flight/spinRpmRaw', entriesFor('spinRpmRaw'));
  assert.equal(result.total, 5028);
  assertGreen(result);
});

test('totalSpinRpm er bit-eksakt over alle 5028 caser', () => {
  const result = report('flight/totalSpinRpm', entriesFor('totalSpinRpm'));
  assert.equal(result.total, 5028);
  assertGreen(result);
});

test('den forespurte toleransen 1e-9 relativt holder med enorm margin', () => {
  // Dokumenterer hva oppgaven ba om, og at kravet er innfridd med avvik 0.
  const relative = 1e-9;
  const entries = [];
  for (const field of ['spinCalibration', 'spinRpmRaw', 'totalSpinRpm']) {
    for (const s of solved) {
      const expected = s.out[field];
      entries.push({
        id: s.id,
        field,
        expected,
        actual: s.got[field],
        tol: relative * Math.max(1, Math.abs(expected)),
      });
    }
  }
  const result = report('flight/spin@1e-9-relativ', entries);
  assert.equal(result.total, 5028 * 3);
  assertGreen(result);
});

/* ── Byggesteiner ───────────────────────────────────────────────────────── */

test('spinDenominatorM er baselineverdien 0.0318288331', () => {
  assert.equal(spinDenominatorM, 0.0318288331);
});

test('verticalSpinLoftDeg er abs(signedVerticalSpinLoftDeg) fra fixturen', () => {
  const result = report(
    'flight/verticalSpinLoftDeg',
    solved.map((s) => ({
      id: s.id,
      field: 'verticalSpinLoftDeg',
      expected: Math.abs(s.out.signedVerticalSpinLoftDeg),
      actual: verticalSpinLoftDeg({
        dynamicLoft: s.in.dynamicLoft,
        attackAngle: s.in.attackAngle,
      }),
    })),
  );
  assert.equal(result.total, 5028);
  assertGreen(result);
});

test('kalibreringskonstantene i fixturen stemmer med kurven som brukes', () => {
  for (const s of solved) {
    assert.equal(s.out.spinCalibrationLow, 0.81, s.id);
    assert.equal(s.out.spinCalibrationRange, 0.32, s.id);
    assert.equal(s.out.spinCalibrationMidpointDeg, 31.98, s.id);
    assert.equal(s.out.spinCalibrationWidthDeg, 2.14, s.id);
    assert.equal(s.out.maxTotalSpinRpm, 9000, s.id);
  }
  // Kurven er monoton stigende fra 0.81 mot 1.13.
  assert.ok(spinCalibrationFor(0) > 0.81);
  assert.ok(spinCalibrationFor(1e6) < 0.81 + 0.32 + 1e-12);
  assert.ok(
    Math.abs(spinCalibrationFor(31.98) - (0.81 + 0.16)) < 1e-15,
    'midtpunkt',
  );
  assert.ok(spinCalibrationFor(10) < spinCalibrationFor(20));
  assert.ok(spinCalibrationFor(20) < spinCalibrationFor(40));
});

/* ── Nullregelen og taket ───────────────────────────────────────────────── */

test('spinn nulles når 3D-aksen er udefinert eller ballfarten er null', () => {
  const axisUndefined = solved.filter((s) => s.sin === 0);
  const zeroBallSpeed = solved.filter((s) => s.out.ballSpeed === 0);

  assert.equal(axisUndefined.length, 29, 'caser med |v × n| = 0');
  assert.equal(zeroBallSpeed.length, 1, 'caser med ballSpeed = 0');
  assert.equal(zeroBallSpeed[0].id, 'edge.club-speed-zero');

  for (const s of [...axisUndefined, ...zeroBallSpeed]) {
    assert.equal(s.got.totalSpinRpm, 0, `${s.id} totalSpinRpm`);
    assert.equal(s.out.totalSpinRpm, 0, `${s.id} fixture totalSpinRpm`);
    // spinCalibration nulles IKKE — den beregnes uansett.
    assert.ok(s.got.spinCalibration >= 0.81, `${s.id} spinCalibration`);
  }
});

test('nullregelen er ikke observerbar i fixturen — clampen alene holder', () => {
  // Dokumenterer at spec §5.4 sin «axis udefinert / ball speed null»-regel er
  // belte-og-seler i baseline: i alle 30 tilfellene er spinRpmRaw allerede 0.
  const clampOnly = solved.map((s) => ({
    id: s.id,
    field: 'totalSpinRpm',
    expected: s.out.totalSpinRpm,
    actual: Math.min(Math.max(s.out.spinRpmRaw, 0), 9000),
  }));
  assertGreen(report('flight/clamp-alene', clampOnly));
});

test('taket på 9000 rpm binder i 929 caser, gulvet på 0 binder aldri', () => {
  const capped = solved.filter((s) => s.got.spinRpmRaw > 9000);
  assert.equal(capped.length, 929, 'antall caser over taket');
  for (const s of capped) {
    assert.equal(s.got.totalSpinRpm, 9000, `${s.id} skal være clampet`);
    assert.equal(s.out.totalSpinRpm, 9000, `${s.id} fixture`);
  }
  assert.ok(
    solved.every((s) => s.got.spinRpmRaw >= 0),
    'spinRpmRaw er aldri negativ, så nedre clamp binder aldri',
  );
});

test('returobjektet har nøyaktig de tre feltene og ingen presentasjonsdata', () => {
  const got = spinMagnitude({
    clubSpeed: 90,
    dynamicLoft: 24,
    attackAngle: -4,
    sinSpinLoft3D: Math.sin(28 * (Math.PI / 180)),
  });
  assert.deepEqual(Object.keys(got).sort(), [
    'spinCalibration',
    'spinRpmRaw',
    'totalSpinRpm',
  ]);
  for (const value of Object.values(got)) {
    assert.equal(typeof value, 'number');
  }
});

test('ingen ikke-endelige tall ut', () => {
  for (const s of solved) {
    for (const [field, value] of Object.entries(s.got)) {
      assert.ok(Number.isFinite(value), `${s.id}.${field} = ${value}`);
    }
  }
});

/* ── Spec §9 golden cases ───────────────────────────────────────────────── */

test('spec §9: neutral iron gir backspin 4834.54 rpm', () => {
  const s = solved.find((c) => c.id === 'spec-9.neutral-iron');
  assert.ok(s, 'fant spec-9.neutral-iron');
  assert.deepEqual(s.in, {
    clubSpeed: 90,
    faceAngle: 0,
    clubPath: 0,
    attackAngle: -4,
    dynamicLoft: 24,
  });
  assert.equal(s.got.totalSpinRpm, s.out.totalSpinRpm);
  assert.equal(s.got.totalSpinRpm.toFixed(2), '4834.54');
});

test('spec §9: no-flight gir null spinn', () => {
  const s = solved.find((c) => c.id === 'spec-9.no-flight');
  assert.ok(s, 'fant spec-9.no-flight');
  assert.equal(s.got.spinRpmRaw, 0);
  assert.equal(s.got.totalSpinRpm, 0);
});

/* ── Grad-fallbacken ────────────────────────────────────────────────────── */

test('grad-fallbacken er dårligere enn |v × n|, men innenfor 1e-9 absolutt', () => {
  // Dokumenterer prisen ved å gå veien om `spinLoft3DDeg`: den er ikke
  // bit-eksakt. Terskelen er bevisst løs (1e-9 rpm mot målt ~7.3e-12) fordi
  // Math.sin ikke er korrekt avrundet i ECMAScript og kan variere mellom
  // motorer. Poenget testen håndhever er at fallbacken er brukbar, ikke at
  // den er baseline.
  let bitExact = 0;
  const entries = solved.map((s) => {
    const got = spinMagnitude({
      clubSpeed: s.in.clubSpeed,
      dynamicLoft: s.in.dynamicLoft,
      attackAngle: s.in.attackAngle,
      spinLoft3DDeg: s.out.spinLoft3DDeg,
      ballSpeed: s.out.ballSpeed,
    });
    if (got.spinRpmRaw === s.out.spinRpmRaw) bitExact += 1;
    return {
      id: s.id,
      field: 'spinRpmRaw@deg',
      expected: s.out.spinRpmRaw,
      actual: got.spinRpmRaw,
      tol: 1e-9,
    };
  });

  const result = report('flight/spinRpmRaw@deg', entries);
  assertGreen(result, 1e-9);
  assert.ok(
    bitExact < 5028,
    'fallbacken skal IKKE være bit-eksakt — er den det, har noen byttet ut ' +
      'baseline-veien i src/spinMagnitude.js',
  );

  // Og den primære veien er alltid minst like god.
  const primary = report('flight/spinRpmRaw', entriesFor('spinRpmRaw'));
  assert.ok(primary.maxDeviation <= result.maxDeviation);
});

test('sinSpinLoft3DFromDegrees er sin(deg × π/180)', () => {
  assert.equal(sinSpinLoft3DFromDegrees(0), 0);
  assert.equal(sinSpinLoft3DFromDegrees(90), Math.sin(90 * (Math.PI / 180)));
  assert.equal(sinSpinLoft3DFromDegrees(24), Math.sin(24 * (Math.PI / 180)));
});
