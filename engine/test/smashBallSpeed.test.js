/**
 * §5.5 — smashBallSpeed mot flight-golden.json.
 *
 * Fixturen er fasit. Avviker modulen, er det modulen som har feil.
 *
 * Modulen isoleres: `spinLoft3DDeg` mates inn FRA fixturen, ikke regnes ut av
 * §5.2-geometrien. En feil her peker derfor garantert på §5.5 og ikke på
 * D-plane-modulen.
 *
 * Toleranse: 0. Alle tre feltene reproduseres bit-eksakt i alle 5028 caser.
 * Oppgaven ba om 1e-9 relativt; det er oppfylt med maks relativt avvik 0.
 * Den løsere porten står som egen test lenger nede, slik at rapporten kan vise
 * begge tallene.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, report } from './_fixture.js';
import {
  smashEfficiency,
  smashEfficiencyRaw,
  ballSpeedFrom,
  smashFactor,
  solveSmashBallSpeed,
} from '../src/smashBallSpeed.js';
import {
  smashModelIntercept,
  smashSpinLoftLinear,
  smashSpinLoftQuadratic,
  smashMinimum,
  smashMaximum,
} from '../src/constants.js';

/** Modulen kjørt over hver case, med fixturens egne inputs. */
function solveAll() {
  return loadFlight().map((c) => ({
    id: c.id,
    group: c.group,
    out: c.out,
    got: solveSmashBallSpeed({
      clubSpeed: c.in.clubSpeed,
      spinLoft: c.out.spinLoft3DDeg,
    }),
  }));
}

/* ── Bit-eksakthet, alle 5028 caser ─────────────────────────────────────── */

test('smashEff er bit-eksakt i alle caser', () => {
  const results = solveAll().map(({ id, out, got }) => ({
    id,
    field: 'smashEff',
    expected: out.smashEff,
    actual: got.smashEff,
  }));

  const r = report('flight/smashEff', results);
  assert.equal(r.total, 5028, r.summary);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('ballSpeed er bit-eksakt i alle caser', () => {
  const results = solveAll().map(({ id, out, got }) => ({
    id,
    field: 'ballSpeed',
    expected: out.ballSpeed,
    actual: got.ballSpeed,
  }));

  const r = report('flight/ballSpeed', results);
  assert.equal(r.total, 5028, r.summary);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('smash er bit-eksakt i alle caser', () => {
  const results = solveAll().map(({ id, out, got }) => ({
    id,
    field: 'smash',
    expected: out.smash,
    actual: got.smash,
  }));

  const r = report('flight/smash', results);
  assert.equal(r.total, 5028, r.summary);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

/* ── Den etterspurte relative porten ────────────────────────────────────── */

test('alle tre feltene ligger innenfor 1e-9 relativt', () => {
  const RELATIVE_TOLERANCE = 1e-9;
  let maxRelative = 0;

  const results = [];
  for (const { id, out, got } of solveAll()) {
    for (const field of ['smash', 'smashEff', 'ballSpeed']) {
      const expected = out[field];
      const actual = got[field];
      // Relativt mot |expected|, med absolutt fallback når expected er 0
      // (ballSpeed og smash er begge 0 i club-speed-zero-casen).
      const scale = Math.abs(expected) > 0 ? Math.abs(expected) : 1;
      const relative = Math.abs(actual - expected) / scale;
      if (relative > maxRelative) maxRelative = relative;
      results.push({
        id,
        field,
        expected,
        actual,
        pass: relative <= RELATIVE_TOLERANCE,
      });
    }
  }

  const r = report('flight/smash-relative-1e-9', results);
  assert.equal(r.total, 5028 * 3, r.summary);
  assert.ok(r.ok, r.summary);
  assert.equal(maxRelative, 0, `maks relativt avvik ${maxRelative}`);
});

/* ── Feller som skal forbli reprodusert ─────────────────────────────────── */

test('§5.5 bruker spinLoft3DDeg, ikke signedVerticalSpinLoftDeg', () => {
  // Negativ kontroll. Bruker noen den vertikale spin loften «fordi den er
  // signert og ser mer riktig ut», feiler 4122 caser. Denne testen sier ifra.
  let vertical = 0;
  let mismatched = 0;

  for (const c of loadFlight()) {
    if (!Object.is(c.out.spinLoft3DDeg, c.out.signedVerticalSpinLoftDeg)) {
      vertical += 1;
    }
    if (
      !Object.is(smashEfficiency(c.out.signedVerticalSpinLoftDeg), c.out.smashEff)
    ) {
      mismatched += 1;
    }
  }

  assert.equal(vertical, 4392, 'caser der 3-D og vertikal spin loft er ulike');
  assert.equal(mismatched, 4122, 'caser den vertikale varianten ville brutt');
});

test('kvadratleddet må grupperes: k × (S × S), ikke (k × S) × S', () => {
  // ULP-felle. Den venstreassosiative formen ser identisk ut og er det ikke.
  const leftAssociative = (S) =>
    Math.min(
      Math.max(
        smashModelIntercept +
          smashSpinLoftLinear * S +
          smashSpinLoftQuadratic * S * S,
        smashMinimum,
      ),
      smashMaximum,
    );

  let broken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(leftAssociative(c.out.spinLoft3DDeg), c.out.smashEff)) {
      broken += 1;
    }
  }

  assert.equal(broken, 78, 'caser den venstreassosiative formen ville brutt');
  // …og modulens egen form bryter ingen.
  assert.equal(
    loadFlight().filter(
      (c) => !Object.is(smashEfficiency(c.out.spinLoft3DDeg), c.out.smashEff),
    ).length,
    0,
  );
});

test('smash er ballSpeed / clubSpeed, ikke smashEff gjenbrukt', () => {
  // Rundturen gjennom multiplikasjon og divisjon mister siste bit i 372 caser.
  // Returnerer noen `smashEff` som `smash`, feiler nøyaktig de 372.
  const roundTripLoses = loadFlight().filter(
    (c) => !Object.is(c.out.smash, c.out.smashEff),
  );
  assert.equal(roundTripLoses.length, 372, 'caser der smash ≠ smashEff');

  for (const c of roundTripLoses) {
    const got = solveSmashBallSpeed({
      clubSpeed: c.in.clubSpeed,
      spinLoft: c.out.spinLoft3DDeg,
    });
    assert.ok(Object.is(got.smash, c.out.smash), `smash i ${c.id}`);
    assert.ok(Object.is(got.smashEff, c.out.smashEff), `smashEff i ${c.id}`);
  }
});

test('clubSpeed 0 gir smash 0, ballSpeed 0 — men smashEff står', () => {
  const zero = loadFlight().filter((c) => c.in.clubSpeed === 0);
  assert.equal(zero.length, 1, 'baseline har én club-speed-zero-case');

  const c = zero[0];
  assert.equal(c.id, 'edge.club-speed-zero');

  const got = solveSmashBallSpeed({
    clubSpeed: c.in.clubSpeed,
    spinLoft: c.out.spinLoft3DDeg,
  });

  assert.equal(got.smash, 0, 'vakten mot 0/0 = NaN');
  assert.equal(got.ballSpeed, 0);
  assert.ok(Object.is(got.smashEff, c.out.smashEff));
  assert.ok(got.smashEff > 1, 'smashEff er modellverdien, ikke 0');
  assert.ok(Number.isFinite(got.smash), 'ingen NaN slipper ut');
});

test('begge clamp-grenene fyrer i baseline', () => {
  let low = 0;
  let high = 0;

  for (const c of loadFlight()) {
    const raw = smashEfficiencyRaw(c.out.spinLoft3DDeg);
    if (raw < smashMinimum) {
      low += 1;
      assert.equal(c.out.smashEff, smashMinimum, `gulv i ${c.id}`);
    }
    if (raw > smashMaximum) {
      high += 1;
      assert.equal(c.out.smashEff, smashMaximum, `tak i ${c.id}`);
    }
  }

  // FUNN-nivå: klampen er en synlig modellgrense, ikke et unntak.
  assert.equal(low, 290, 'caser klampet til 1.15');
  assert.equal(high, 127, 'caser klampet til 1.52');
});

/* ── Modulgrensen ───────────────────────────────────────────────────────── */

test('delfunksjonene komponerer til solveSmashBallSpeed', () => {
  for (const c of loadFlight()) {
    const smashEff = smashEfficiency(c.out.spinLoft3DDeg);
    const ballSpeed = ballSpeedFrom(c.in.clubSpeed, smashEff);
    const smash = smashFactor(c.in.clubSpeed, ballSpeed);
    const whole = solveSmashBallSpeed({
      clubSpeed: c.in.clubSpeed,
      spinLoft: c.out.spinLoft3DDeg,
    });

    assert.ok(Object.is(whole.smashEff, smashEff), c.id);
    assert.ok(Object.is(whole.ballSpeed, ballSpeed), c.id);
    assert.ok(Object.is(whole.smash, smash), c.id);
  }
});

test('returobjektet har nøyaktig de tre feltene og ingen presentasjonsdata', () => {
  const got = solveSmashBallSpeed({ clubSpeed: 90, spinLoft: 28 });
  assert.deepEqual(Object.keys(got).sort(), ['ballSpeed', 'smash', 'smashEff']);
  for (const v of Object.values(got)) assert.equal(typeof v, 'number');
});

test('konstantene er de fixturen oppgir', () => {
  const c = loadFlight()[0].out;
  assert.equal(smashModelIntercept, c.smashModelIntercept);
  assert.equal(smashSpinLoftLinear, c.smashSpinLoftLinear);
  assert.equal(smashSpinLoftQuadratic, c.smashSpinLoftQuadratic);
  assert.equal(smashMinimum, c.smashMinimum);
  assert.equal(smashMaximum, c.smashMaximum);
});
